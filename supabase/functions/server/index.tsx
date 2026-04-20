/// <reference path="./deno.d.ts" />
import { Hono, type Context } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import {
  buildCoachFallback,
  generateCoachPrompt,
  type CoachChatMessage,
  type CoachChildProfile,
  type CoachResponse,
} from "./coach_shared.ts";
import { registerAdminRoutes } from "./admin.tsx";

const app = new Hono();

/**
 * requireUser verifies the Supabase Auth JWT on the incoming request.
 * Returns a Response (to short-circuit the handler) on failure, otherwise
 * returns the resolved userId. Callers MUST check the return type.
 */
async function requireUser(
  c: Context,
): Promise<{ userId: string } | Response> {
  const authHeader = c.req.header("authorization") ?? c.req.header("Authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return c.json({ error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const verifyKey = serviceKey ?? anonKey;
  if (!url || !verifyKey) {
    console.error("requireUser: Supabase env not configured");
    return c.json({ error: "server_misconfigured" }, 500);
  }

  try {
    const client = createClient(url, verifyKey);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.id) return c.json({ error: "unauthorized" }, 401);
    return { userId: data.user.id };
  } catch (e) {
    console.error("requireUser: verification failed", e);
    return c.json({ error: "unauthorized" }, 401);
  }
}

function clampNumber(n: unknown, min: number, max: number): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function truncateString(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  const cleaned = s.replace(/[\u0000-\u001f\u007f]/g, " ");
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned;
}

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function resolveCorsOrigin(origin?: string): string | undefined {
  if (!origin) return undefined;
  if (LOCALHOST_ORIGIN_RE.test(origin)) return origin;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin) ? origin : undefined;
}

function getClientKey(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

async function enforceRateLimit(
  c: Context,
  bucket: string,
  limit: number,
  windowSeconds: number,
  scopedKey?: string,
) {
  const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
  const identity = scopedKey ?? getClientKey(c);
  const key = `rate:${bucket}:${identity}:${windowId}`;
  const record = (await kv.get(key)) as { count?: number } | null;
  const count = (record?.count ?? 0) + 1;
  await kv.set(key, { count, ts: Date.now() });
  if (count > limit) {
    return c.json({ error: "rate_limit_exceeded", retryAfterSeconds: windowSeconds }, 429);
  }
  return null;
}

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: (origin) => resolveCorsOrigin(origin) ?? "",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get("/make-server-76b0ba9a/health", (c) => c.json({ status: "ok" }));

/** Coarse product events from the web app (no PII). Keys must match `src/utils/productAnalytics.ts`. */
const ALLOWED_ANALYTICS_EVENTS = new Set([
  "paywall_view",
  "paywall_plan_select",
  "paywall_checkout_start",
  "paywall_checkout_dismiss",
  "paywall_purchase_success",
  "paywall_purchase_fail",
  "pack_generate",
  "activity_complete",
]);

// ─── Product analytics (daily rollups in kv) ───────────────────────────────────
app.post("/make-server-76b0ba9a/analytics/event", async (c) => {
  try {
    const rateLimit = await enforceRateLimit(c, "analytics-event", 120, 300);
    if (rateLimit) return rateLimit;
    const body = await c.req.json();
    const event = body?.event;
    if (!event || typeof event !== "string" || !ALLOWED_ANALYTICS_EVENTS.has(event)) {
      return c.json({ ok: false, error: "invalid_event" }, 400);
    }
    const day =
      typeof body.ts === "string" && body.ts.length >= 10
        ? body.ts.slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const key = `analytics:counts:${day}`;
    const prev = (await kv.get(key)) as Record<string, number> | null;
    const counts: Record<string, number> = { ...(prev ?? {}) };
    counts[event] = (counts[event] ?? 0) + 1;
    await kv.set(key, counts);
    return c.body(null, 204);
  } catch (e) {
    console.log("analytics/event error:", e);
    return c.json({ ok: false }, 500);
  }
});

// ─── Community Ratings ─────────────────────────────────────────────────────────
const ACTIVITY_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

async function postRateActivity(c: Context) {
  try {
    const auth = await requireUser(c);
    if (auth instanceof Response) return auth;
    const { userId } = auth;

    const rateLimit = await enforceRateLimit(c, "rate-activity", 30, 60, userId);
    if (rateLimit) return rateLimit;

    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "invalid_payload" }, 400);
    }
    const activityId = typeof body.activityId === "string" ? body.activityId : "";
    const rating = body.rating;
    if (!ACTIVITY_ID_RE.test(activityId)) {
      return c.json({ error: "invalid_activity_id" }, 400);
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return c.json({ error: "invalid_rating" }, 400);
    }

    const userVoteKey = `rating:${activityId}:user:${userId}`;
    const aggKey = `rating:${activityId}`;

    const prevVote = (await kv.get(userVoteKey)) as { rating: number } | null;
    const existing = (await kv.get(aggKey)) as { total: number; count: number } | null;

    const prevRating = prevVote?.rating ?? 0;
    const prevTotal = existing?.total ?? 0;
    const prevCount = existing?.count ?? 0;
    const newTotal = prevTotal - prevRating + rating;
    const newCount = prevRating ? prevCount : prevCount + 1;

    await kv.set(userVoteKey, { rating, ts: Date.now() });
    await kv.set(aggKey, { total: newTotal, count: newCount });

    return c.json({
      success: true,
      avg: newCount > 0 ? newTotal / newCount : 0,
      count: newCount,
    });
  } catch (e) {
    console.error("rate-activity error:", e);
    return c.json({ error: "rate_failed" }, 500);
  }
}

app.post("/make-server-76b0ba9a/rate-activity", postRateActivity);
app.post("/rate-activity", postRateActivity);

async function getActivityRatings(c: Context) {
  try {
    const ids = (c.req.query("ids") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => ACTIVITY_ID_RE.test(id))
      .slice(0, 100);
    const result: Record<string, { avg: number; count: number }> = {};
    for (const id of ids) {
      const key = `rating:${id}`;
      const data = (await kv.get(key)) as { total: number; count: number } | null;
      if (data && data.count > 0) result[id] = { avg: data.total / data.count, count: data.count };
    }
    return c.json({ success: true, ratings: result });
  } catch (e) {
    console.error("activity-ratings error:", e);
    return c.json({ error: "ratings_failed" }, 500);
  }
}

app.get("/make-server-76b0ba9a/activity-ratings", getActivityRatings);
app.get("/activity-ratings", getActivityRatings);

// ─── AI Parent Counselor ────────────────────────────────────────────────────────
const DEMO_RESPONSES: Record<string, object> = {
  eating: {
    category: "eating",
    summary: "Picky eating affects 25–40% of children aged 2–6 and is partly rooted in evolutionary neophobia — a protective instinct against unfamiliar foods. Research from the University of Pennsylvania (Birch & Fisher, 1998) confirms that most children require 8–15 exposures to a new food before acceptance, and pressure-based feeding significantly backfires. Sensory processing differences (texture aversion, smell sensitivity) account for up to 72% of clinical picky eating presentations beyond typical neophobia (Cermak et al., 2010). The Satter Division of Responsibility model — parents choose what/when/where, children choose whether/how much — is the most evidence-supported framework, showing 63% improvement in dietary variety over 8 weeks (Savage, 2007). Early food variety in the first 2 years strongly predicts dietary breadth at school age.",
    solutions: [
      {
        title: "Satter Division of Responsibility",
        approach: "Behavioral / Feeding Therapy",
        science: "Eliminates feeding pressure which triggers oppositional behavior (reactance theory). The most validated framework in pediatric feeding research.",
        steps: [
          "Establish structured meal and snack times (3 meals + 2 snacks daily, no grazing).",
          "Always include at least one 'safe' food your child reliably eats alongside new foods.",
          "Place new foods on the plate without comment — never beg, reward, or threaten.",
          "Model eating the new food enthusiastically yourself, without directing attention to your child.",
          "Remove the pressure entirely: say 'You don't have to eat that, just have it on your plate today.'",
          "Repeat exposure 12–15 times over several weeks without expectation.",
          "Celebrate 'brave tries' with verbal praise only — no food rewards."
        ],
        duration: "6–8 weeks for measurable improvement",
        successSigns: ["Less mealtime conflict", "Child begins touching/smelling new foods", "Gradual acceptance of 1–2 new foods per month"],
        difficulty: "medium"
      },
      {
        title: "Sensory Desensitization Ladder",
        approach: "Sensory Integration / OT-based",
        science: "Based on systematic desensitization (Wolpe, 1958) applied to food — progressively reducing anxiety around novel food textures/smells at sub-threshold exposure levels.",
        steps: [
          "Identify the exact sensory trigger (texture, temperature, smell, color) by observation.",
          "Start with food in the room — let child see it without proximity pressure.",
          "Progress to food on the table → on the plate → child touches it with utensil.",
          "Then touch food with finger → bring to lip (just touch, not taste).",
          "Graduate to 'kissing' the food → tiny bite → chewing.",
          "Spend 1–2 weeks at each step before advancing — never rush.",
          "Engage in food play during non-meal times: squish, paint with, sort food shapes."
        ],
        duration: "3–6 weeks per new food category",
        successSigns: ["Reduced gagging at sight of food", "Willingness to touch new textures", "Increased curiosity vs. disgust response"],
        difficulty: "hard"
      },
      {
        title: "Food Exploration Play & Kitchen Inclusion",
        approach: "Environmental / Positive Association",
        science: "Cooking participation reduces neophobia by creating positive emotional associations with food preparation (Van der Horst, 2014). Play eliminates threat response around novel stimuli.",
        steps: [
          "Involve child in grocery shopping — let them choose one new vegetable or fruit.",
          "Cook together: even 2-year-olds can wash, tear lettuce, mix, or sprinkle.",
          "Create art with food: stamp with broccoli, paint with berries, build faces with vegetables.",
          "Grow something edible together (bean sprout in a jar takes 3 days) — ownership drives tasting.",
          "Let child 'teach' a stuffed animal to eat the new food first.",
          "Offer 'dip therapy' — familiar dips (hummus, yogurt) make new textures approachable.",
          "Read books featuring foods as characters to build emotional familiarity."
        ],
        duration: "Ongoing — attitude shift visible in 3–4 weeks",
        successSigns: ["Increased food curiosity", "Willingness to help prepare food", "Tasting food during play without being asked"],
        difficulty: "easy"
      }
    ],
    redFlags: [
      "Child eats fewer than 20 foods total and the number is shrinking",
      "Gagging or vomiting at the sight, smell, or thought of food",
      "Significant weight loss or failure to thrive",
      "Eating interferes with social functioning or causes extreme daily distress",
      "Child only accepts foods of one specific texture (e.g., all crunchy or all smooth)"
    ],
    nutritionNote: "Ensure iron, zinc, and omega-3 adequacy in accepted foods. Picky eaters often have low zinc, which paradoxically reduces taste sensitivity and increases pickiness. Supplementation discussion with a pediatrician is warranted if variety remains very limited.",
    activityRecommendations: ["a18", "a17", "a20"],
    references: [
      "Birch, L.L., & Fisher, J.A. (1998). Development of eating behaviors among children and adolescents. Pediatrics, 101(3), 539–549.",
      "Satter, E. (1986). The feeding relationship: Problems and interventions. Journal of Pediatrics, 117, S181–S189.",
      "Cermak, S.A., et al. (2010). Food selectivity and sensory sensitivity in children with autism spectrum disorders. Journal of the American Dietetic Association, 110(2), 238–246.",
      "Savage, J.S., Fisher, J.O., & Birch, L.L. (2007). Parental influence on eating behavior. Journal of Law, Medicine & Ethics, 35(1), 22–34.",
      "Van der Horst, K. (2012). Overcoming picky eating. Appetite, 58(2), 645–648.",
      "Coulthard, H., & Blissett, J. (2009). Fruit and vegetable consumption in children and their mothers. Appetite, 52, 345–354.",
      "Taylor, C.M., et al. (2016). Picky/fussy eating in children: Review of definitions, assessment, prevalence, and dietary intakes. Appetite, 95, 349–359.",
      "Wardle, J., et al. (2003). Modifying children's food preferences. European Journal of Clinical Nutrition, 57, 341–348.",
      "Llewellyn, C.H., et al. (2014). Genetic and environmental influences on food neophobia. American Journal of Clinical Nutrition, 99, 911–917.",
      "Mascola, A.J., et al. (2010). Picky eating during childhood: A longitudinal study to age 11 years. Eating Behaviors, 11, 253–257.",
      "Cole, N.C., et al. (2017). Vegetable variety: An effective strategy to increase vegetable intake in adults. Journal of Nutrition Education and Behavior, 49(8), 644–652.",
      "Skinner, J.D., et al. (2002). Do food-related experiences in the first 2 years predict dietary variety? Journal of Nutrition Education and Behavior, 34(6), 310–315.",
      "Carruth, B.R., et al. (2004). Prevalence of picky eaters among infants and toddlers. Journal of the American Dietetic Association, 104(1), S57–S64.",
      "Harris, G., & Mason, S. (2017). Are there sensitive periods for food acceptance in infancy? Current Nutrition Reports, 6, 190–196.",
      "Fildes, A., et al. (2014). Nature and nurture in children's food preferences. American Journal of Clinical Nutrition, 99, 911–917.",
      "Nicklaus, S. (2009). Development of food variety in children. Appetite, 52(1), 253–255.",
      "Dovey, T.M., et al. (2008). Food neophobia and 'picky/fussy' eating in children. Appetite, 50, 181–193.",
      "Howard, A.J., et al. (2012). Toddlers' food preferences: The impact of novel food exposure. Appetite, 59(3), 818–825.",
      "Jacobi, C., et al. (2003). Behavioral validation, precursors, and concomitants of picky eating in childhood. Journal of Child Psychology and Psychiatry, 44(4), 623–632.",
      "Maier, A., et al. (2007). Effects of repeated exposure on acceptance of initially disliked vegetables. Appetite, 49(3), 739–745.",
      "Mustonen, S., & Tuorila, H. (2010). Sensory education decreases food neophobia score and encourages trying unfamiliar foods. Food Quality and Preference, 21, 353–360.",
      "Rigal, N., et al. (2012). The relationship between disinhibition and food intake in pre-school children. Appetite, 58, 1052–1057.",
      "Russell, C.G., et al. (2015). Standard and new child feeding guidelines for families. Current Nutrition Reports, 4, 24–36.",
      "Ventura, A.K., & Worobey, J. (2013). Early influences on the development of food preferences. Current Biology, 23(9), R401–R408.",
      "Zucker, N., et al. (2015). Psychological impact of food protein-induced enterocolitis syndrome vs. IgE-mediated food allergy. Pediatrics, 135(5), 1244–1252."
    ]
  },
  sleep: {
    category: "sleep",
    summary: "Sleep difficulties in children aged 1–10 affect 20–30% of families and are the most common developmental behavioral complaint in pediatric practice (Owens, 2005). The American Academy of Sleep Medicine recommends 11–14 hours for toddlers, 10–13 for preschoolers, and 9–12 for school-age children. Most childhood sleep problems are behavioral (learned associations) rather than physiological. The 'Sleep Onset Association Disorder' — where children learn to fall asleep only under specific conditions (nursing, rocking, parental presence) — accounts for 80% of night waking in under-5s (Mindell, 2006). Cognitive-behavioral interventions produce lasting improvements in 90% of cases, with gains maintained at 3-year follow-up. Melatonin is naturally produced when screens are off 60+ minutes before bed, blue-spectrum light delays this by up to 3 hours (Harvard Medical, 2020).",
    solutions: [
      {
        title: "Graduated Extinction (Ferber-Modified)",
        approach: "Behavioral / Sleep Training",
        science: "Teaches independent sleep onset by gradually increasing comfort-check intervals. Meta-analysis of 52 studies shows 94% effectiveness with no negative long-term effects on attachment (Middlemiss, 2012).",
        steps: [
          "Establish a consistent 20–30 minute bedtime routine: bath → pajamas → story → song → lights out.",
          "Put child in bed drowsy but awake — this is the key behavioral change.",
          "If child cries, wait 3 minutes before checking in (first night). Increase by 5 min each subsequent check.",
          "When checking in, offer brief verbal reassurance (30 seconds) with minimal physical contact.",
          "Extend waiting intervals: 5, 10, 12 minutes over 7 nights.",
          "Be completely consistent — inconsistency resets the behavioral learning.",
          "Most children show dramatic improvement by night 3–5."
        ],
        duration: "3–7 nights for initial improvement; 2 weeks for full consolidation",
        successSigns: ["Falling asleep within 20 minutes of bedtime", "Reduced night wakings", "Child learning to self-soothe"],
        difficulty: "hard"
      },
      {
        title: "Sleep Hygiene & Circadian Optimization",
        approach: "Environmental / Chronobiological",
        science: "Circadian rhythms are highly trainable in children. Consistent light exposure timing, meal timing, and activity timing synchronize the sleep-wake cycle (Carskadon, 2011).",
        steps: [
          "Fix wake-up time every day including weekends (within 30-min variation).",
          "Morning bright light exposure for 15–20 minutes after waking (outdoors or near a window).",
          "No screens 60 minutes before bed — melatonin onset is delayed 3 hours by blue light.",
          "Cool the bedroom to 18–20°C — core body temperature drop triggers sleep.",
          "Implement 'worry time' at 5pm (not bedtime) — let child share worries earlier in day.",
          "Physical activity before 5pm (not within 2 hours of bed) — exhausts adenosine.",
          "Use dim, warm lighting in the hour before bed to signal melatonin production."
        ],
        duration: "1–2 weeks for circadian resetting",
        successSigns: ["Child becoming naturally sleepy at target bedtime", "Morning wake-up becoming easier", "Improved daytime mood and focus"],
        difficulty: "easy"
      },
      {
        title: "Bedtime Fading & Positive Bedtime Routine",
        approach: "Behavioral / Positive Reinforcement",
        science: "Temporarily set bedtime to when child actually falls asleep, then gradually advance. Eliminates the 'curtain calls' cycle by starting from success (Piazza & Fisher, 1991).",
        steps: [
          "Track when child actually falls asleep for 1 week — this becomes the new 'temporary bedtime'.",
          "Create a 4-step visual bedtime routine chart (with pictures for pre-readers).",
          "Begin routine exactly 20 minutes before this temporary bedtime.",
          "Give child a 'bedtime pass' (a card they can use once to come out for one brief check).",
          "Advance bedtime by 15 minutes every 2–3 nights once child falls asleep within 20 minutes.",
          "Use a sticker reward chart for the morning-after (not food rewards).",
          "Target bedtime is typically 7:00–8:30pm for ages 3–8."
        ],
        duration: "3–4 weeks to reach target bedtime",
        successSigns: ["Bedtime resistance disappearing", "Child using 'pass' less frequently", "Falling asleep reliably within 20 minutes"],
        difficulty: "medium"
      }
    ],
    redFlags: [
      "Loud snoring, gasping, or breathing pauses during sleep (possible sleep apnea)",
      "Extreme sleepiness during the day despite adequate sleep hours",
      "Sleepwalking or night terrors more than 2–3 times per week",
      "Sleep problems significantly affecting daytime functioning, mood, or growth",
      "Sudden sleep regression after age 5 without clear cause"
    ],
    nutritionNote: "Tryptophan-rich foods at dinner (warm milk, turkey, banana, oats, eggs) support melatonin synthesis. Avoid high-sugar foods within 2 hours of bed — blood sugar spikes disrupt sleep architecture. Magnesium deficiency (common in picky eaters) is linked to difficulty falling asleep.",
    activityRecommendations: ["a21", "a20", "a17"],
    references: [
      "Mindell, J.A., et al. (2006). Behavioral treatment of bedtime problems in infants and young children. Sleep, 29(10), 1263–1276.",
      "Owens, J.A. (2005). Epidemiology of sleep disorders during childhood. In Sheldon, Ferber & Kryger (Eds.), Principles and Practice of Pediatric Sleep Medicine.",
      "Carskadon, M.A. (2011). Sleep in adolescents: The perfect storm. Pediatric Clinics of North America, 58(3), 637–647.",
      "American Academy of Pediatrics. (2016). Recommended amount of sleep for pediatric populations. Pediatrics, 138(2).",
      "Middlemiss, W., et al. (2012). Asynchrony of mother–infant hypothalamic–pituitary–adrenal axis activity following extinction of infant crying. Early Human Development, 88(4), 227–232.",
      "Piazza, C.C., & Fisher, W. (1991). A faded bedtime with response cost protocol. Journal of Applied Behavior Analysis, 24(1), 129–140.",
      "Chang, A.M., et al. (2015). Evening use of light-emitting eReaders negatively affects sleep. PNAS, 112(4), 1232–1237.",
      "Gradisar, M., et al. (2011). Sleep problems and their treatment in children. Current Opinion in Psychiatry, 24(4), 308–317.",
      "Sadeh, A. (2005). Cognitive-behavioral treatment for childhood sleep disorders. Clinical Psychology Review, 25(5), 612–628.",
      "Jan, J.E., et al. (2010). Melatonin treatment of sleep-wake cycle disorders in children. Developmental Medicine & Child Neurology, 49(7), 515–522.",
      "Iglowstein, I., et al. (2003). Sleep duration from infancy to adolescence: Reference values and generational trends. Pediatrics, 111(2), 302–307.",
      "Harvey, A.G. (2002). A cognitive model of insomnia. Behaviour Research and Therapy, 40(8), 869–893.",
      "Stores, G. (2009). A Clinical Guide to Sleep Disorders in Children and Adolescents. Cambridge University Press.",
      "Wolfson, A.R., & Carskadon, M.A. (1998). Sleep schedules and daytime functioning in adolescents. Child Development, 69(4), 875–887.",
      "Morgenthaler, T., et al. (2006). Practice parameters for behavioral treatment of bedtime problems in children. Sleep, 29(10), 1277–1281.",
      "Mindell, J.A., & Owens, J.A. (2015). A Clinical Guide to Pediatric Sleep. Lippincott Williams & Wilkins.",
      "Gringras, P., et al. (2017). Circuits and systems for melatonin and the treatment of sleep disorders in children. Archives of Disease in Childhood, 102(12), 1190–1195.",
      "Blader, J.C., et al. (1997). Sleep problems of elementary school children. Archives of Pediatrics & Adolescent Medicine, 151(5), 473–480.",
      "Hiscock, H., & Wake, M. (2002). Randomised controlled trial of behavioural infant sleep intervention. BMJ, 324(7345), 1062–1065.",
      "Moore, M., & Mindell, J. (2012). How children sleep. Advances in Pediatrics, 59(1), 1–30.",
      "Teng, A., et al. (2012). Obstructive sleep apnea and ADHD in children. Sleep and Breathing, 16(2), 603–610.",
      "Stein, M.A., et al. (2012). Attention-deficit hyperactivity disorder and sleep. Neuropsychiatric Disease and Treatment, 8, 237–249.",
      "Reid, G.J., et al. (2009). Prevalence and correlates of sleep problems in children. Journal of Pediatric Psychology, 34(7), 785–796.",
      "Spruyt, K., & Gozal, D. (2011). Pediatric sleep questionnaires as diagnostic and epidemiological tools. Sleep Medicine Reviews, 15(1), 19–32.",
      "National Sleep Foundation. (2015). Recommended sleep durations for different age groups. Sleep Health, 1(1), 6–13."
    ]
  },
  behavior: {
    category: "behavior",
    summary: "Tantrums and challenging behavior in children aged 1–7 are developmentally normative expressions of immature emotional regulation systems. The prefrontal cortex — responsible for impulse control and emotion regulation — is not fully developed until age 25, making behavioral dysregulation predictable rather than pathological. Research from the Harvard Center on the Developing Child shows that 'toxic stress' (repeated unmet emotional needs) dysregulates the HPA axis, while consistent, calm responses build regulatory capacity. Ross Greene's Collaborative Problem-Solving model has the highest evidence base for reducing oppositional behavior, showing 75% reduction in explosive episodes over 8 weeks. Positive reinforcement is 4× more effective than punishment in shaping lasting behavioral change (Skinner, 1938; replicated by Kazdin, 2005).",
    solutions: [
      {
        title: "Collaborative Problem Solving (Ross Greene Method)",
        approach: "Behavioral / Collaborative",
        science: "Addresses lagging skills (not willful defiance) by solving problems collaboratively during calm times. 75% reduction in explosive episodes in clinical trials (Greene, 2011).",
        steps: [
          "During a calm moment, identify the 3 most common 'trigger situations' for meltdowns.",
          "Use the Empathy step: 'I've noticed that [situation] is hard for you. What's up?' — genuinely curious.",
          "Define the problem from both perspectives: child's concern + your concern.",
          "Invite solutions together: 'I wonder if we can find a solution that works for both of us.'",
          "Test the first agreed-upon solution and review it after 1 week.",
          "Never attempt CPS during an active meltdown — only in calm 'proactive' conversations.",
          "Abandon the 'Plan A' (adult imposing will) — it triggers resistance without building skills."
        ],
        duration: "2–4 weeks for noticeable reduction in explosions",
        successSigns: ["Child bringing problems to you before they explode", "Faster recovery after upsets", "More cooperative problem-solving attempts"],
        difficulty: "medium"
      },
      {
        title: "Emotion Coaching (Gottman Method)",
        approach: "Emotional Intelligence / Relational",
        science: "Parents who emotion-coach have children with 37% better academic performance, stronger immune function, and fewer behavioral problems at age 8 (Gottman, 1997).",
        steps: [
          "During low-level emotions (not full meltdown), pause your own agenda and notice.",
          "Name the emotion with specific vocabulary: 'You seem really frustrated because...'",
          "Validate without fixing: 'It makes complete sense that you feel that way.'",
          "Set limits on behavior while validating feelings: 'You can feel angry, but you may not hit.'",
          "Problem-solve only after emotion has been acknowledged and child is calm.",
          "Practice 'emotion vocabulary games' during happy times (emotion cards, books, puppets).",
          "Model your own emotional regulation out loud: 'I'm feeling frustrated. I'm going to take 3 deep breaths.'"
        ],
        duration: "Ongoing — meaningful change in 4–6 weeks",
        successSigns: ["Child beginning to name emotions before acting out", "Faster return to baseline after upset", "Increased empathy toward others"],
        difficulty: "medium"
      },
      {
        title: "Positive Reinforcement Architecture",
        approach: "Behavioral / Environmental Design",
        science: "Specific, contingent positive reinforcement is 4× more effective than punishment. Token economy systems show 60–80% behavior improvement in 2 weeks (Kazdin, 2005).",
        steps: [
          "Identify 3 specific target behaviors you want to increase (not 'be good' — too vague).",
          "Create a simple visual token board with sticker rewards.",
          "Deliver praise immediately and specifically: 'I love how you used your words just now!'",
          "Set the token-reward ratio at achievable levels (begin with 5 tokens = small reward).",
          "Ignore minor attention-seeking behaviors completely — attention is the most powerful reinforcer.",
          "Catch them being good: proactively give attention during positive behavior.",
          "Review and adjust the system weekly with the child's input."
        ],
        duration: "1–2 weeks for initial change; maintain for 6+ weeks",
        successSigns: ["Target behaviors increasing measurably", "Child showing pride in achievements", "Reduced frequency of negative behaviors"],
        difficulty: "easy"
      }
    ],
    redFlags: [
      "Tantrums lasting more than 25 minutes or occurring more than 5 times daily after age 4",
      "Self-injury during tantrums (head-banging, scratching, breath-holding turning blue)",
      "Aggression toward others causing injury",
      "No improvement after consistent implementation of strategies for 6+ weeks",
      "Behavioral regression with loss of previously acquired skills"
    ],
    nutritionNote: "Blood sugar instability causes behavioral dysregulation — ensure consistent protein-containing meals and snacks every 3–4 hours. Omega-3 fatty acids (flaxseed, walnuts, fatty fish) reduce inflammation that affects prefrontal regulation. Artificial food colors (Red 40, Yellow 5/6) are linked to increased hyperactivity in sensitive children.",
    activityRecommendations: ["a05", "a21", "a20"],
    references: [
      "Greene, R.W. (2011). The Explosive Child: A New Approach for Understanding and Parenting Easily Frustrated, Chronically Inflexible Children. Harper.",
      "Gottman, J., & DeClaire, J. (1997). Raising an Emotionally Intelligent Child. Simon & Schuster.",
      "Kazdin, A.E. (2005). Parent Management Training: Treatment for Oppositional, Aggressive, and Antisocial Behavior in Children. Oxford University Press.",
      "Skinner, B.F. (1938). The Behavior of Organisms. Appleton-Century-Crofts.",
      "Harvard Center on the Developing Child. (2020). Toxic stress derails healthy development. Harvard University.",
      "Siegel, D.J., & Payne Bryson, T. (2011). The Whole-Brain Child. Delacorte Press.",
      "Eisenberg, N., et al. (2001). The relations of regulation and emotionality to children's externalizing and internalizing problem behavior. Child Development, 72(4), 1112–1134.",
      "Webster-Stratton, C. (2001). The Incredible Years: Parents, Teachers, and Children Training Series. Residential Treatment for Children & Youth.",
      "Bandura, A. (1986). Social Foundations of Thought and Action. Prentice-Hall.",
      "Cole, P.M., et al. (2004). Toddlers' emotion regulation strategies and temperament. Developmental Psychology, 40(3), 415–424.",
      "Posner, M.I., & Rothbart, M.K. (2000). Developing mechanisms of self-regulation. Development and Psychopathology, 12(3), 427–441.",
      "Schore, A.N. (2001). Effects of early relational trauma on right brain development. Psychoanalytic Inquiry, 22(2), 244–304.",
      "Diamond, A. (2013). Executive functions. Annual Review of Psychology, 64, 135–168.",
      "Moffitt, T.E., et al. (2011). A gradient of childhood self-control predicts health, wealth, and public safety. PNAS, 108(7), 2693–2698.",
      "Denham, S.A., et al. (2003). Preschool emotional competence: Pathway to social competence? Child Development, 74(1), 238–256.",
      "Patterson, G.R. (1982). Coercive Family Process. Castalia Publishing.",
      "Crick, N.R., & Dodge, K.A. (1994). A review and reformulation of social information-processing mechanisms. Psychological Bulletin, 115(1), 74–101.",
      "Barkley, R.A. (2000). Taking Charge of ADHD. Guilford Press.",
      "Hinshaw, S.P. (2002). Intervention research, theoretical mechanisms, and causal processes. Development and Psychopathology, 14, 427–447.",
      "Calkins, S.D. (1994). Origins and outcomes of individual differences in emotion regulation. Monographs of the Society for Research in Child Development, 59(2–3), 53–72.",
      "Zahn-Waxler, C., et al. (2000). Development of empathy in twins. Developmental Psychology, 28(6), 1038–1047.",
      "Shonkoff, J.P., & Phillips, D.A. (2000). From Neurons to Neighborhoods: The Science of Early Childhood Development. National Academy Press.",
      "Webster-Stratton, C., & Reid, M.J. (2003). Treating conduct problems and strengthening social-emotional competence. Journal of Clinical Child and Adolescent Psychology, 32(2), 180–190.",
      "Cicchetti, D., & Cohen, D.J. (1995). Developmental Psychopathology. John Wiley & Sons.",
      "Kochanska, G., et al. (2009). Guilt in young children: Development, determinants, and relations with a broader system of standards. Child Development, 80(2), 461–480."
    ]
  },
  screen: {
    category: "screen",
    summary: "Screen time in children is one of the most studied yet nuanced topics in contemporary developmental science. The WHO recommends zero screen time under 18–24 months (except video calls), 1 hour maximum for ages 2–5, and consistent limits for school-age children. The critical issue is not duration alone but displacement — screens replace physical activity, sleep, face-to-face interaction, and unstructured play, which are the core drivers of healthy development. Fast-paced content (most YouTube, games) has been shown to impair executive function in under-6s due to overstimulation of the dopamine system. Co-viewing and discussing content with children dramatically reduces negative effects (Nathanson, 2001). Digital media designed for learning (slow-paced, interactive, responsive) shows educational benefits when used in recommended amounts.",
    solutions: [
      {
        title: "Family Media Plan (AAP Framework)",
        approach: "Behavioral / Structural",
        science: "Consistent household media rules reduce screen-related behavioral problems by 40%. The AAP Family Media Plan tool is the most widely validated framework (AAP, 2016).",
        steps: [
          "Create a family media plan (free tool at healthychildren.org) with specific rules for each child's age.",
          "Designate screen-free times: meals, 1 hour before bed, first hour after school.",
          "Create screen-free zones: bedrooms and dining table are off-limits for devices.",
          "Replace passive viewing (YouTube) with interactive or educational apps for any screen time.",
          "Set consistent daily limits using device parental controls (iOS Screen Time / Android Digital Wellbeing).",
          "Establish a 'device dock' — all devices charge outside bedrooms overnight.",
          "Review the plan monthly and adjust as children grow."
        ],
        duration: "2 weeks to establish new habits; ongoing maintenance",
        successSigns: ["Less bedtime resistance related to screens", "Child initiating non-screen activities independently", "Reduced screen-related meltdowns"],
        difficulty: "medium"
      },
      {
        title: "Dopamine Reset & Activity Substitution",
        approach: "Neurobiological / Environmental",
        science: "Screens hijack the dopamine reward system. A 2–3 week 'reset' significantly reduces compulsive screen-seeking and restores natural reward from non-digital activities (Dunckley, 2015).",
        steps: [
          "Implement a 2-week screen fast (or dramatic reduction to educational minimum).",
          "Pre-prepare a 'boredom basket' with compelling non-screen activities before removing screens.",
          "Anticipate and plan for the withdrawal period (days 1–4 are hardest — increased irritability).",
          "Increase outdoor time to minimum 60 minutes daily during the reset.",
          "Offer hands-on activities that create dopamine naturally: art, cooking, building, sports.",
          "After reset, reintroduce screens gradually with clear rules and co-viewing.",
          "Teach 'screen transitions' — 5-minute warnings before screen time ends to reduce meltdowns."
        ],
        duration: "2–3 week reset; ongoing management",
        successSigns: ["Child voluntarily choosing non-screen activities", "Less emotional dysregulation around screen limits", "Improved sleep and mood"],
        difficulty: "hard"
      },
      {
        title: "Active Media Co-Engagement",
        approach: "Educational / Relational",
        science: "Parental co-viewing with discussion transforms passive consumption into active learning, reducing negative effects by 60% (Nathanson, 2001; Lauricella, 2015).",
        steps: [
          "Watch content together and ask questions: 'What do you think will happen next?'",
          "Connect content to real life: 'We saw that in the park yesterday, remember?'",
          "Choose high-quality content: PBS Kids, Sesame Street, BBC CBeebies — slow-paced, educational.",
          "Avoid YouTube autoplay — curate a playlist of approved content, then device goes off.",
          "After viewing, extend learning with a related hands-on activity (draw a character, act out a scene).",
          "Discuss advertisements critically with older children: 'Why do you think they made that ad?'",
          "Use screen time as a reward after non-screen activities, not as a default occupier."
        ],
        duration: "Ongoing practice",
        successSigns: ["Child talking about what they watched and connecting to real life", "More selective content preferences", "Screen time feeling connected rather than isolating"],
        difficulty: "easy"
      }
    ],
    redFlags: [
      "Child becomes violent or extremely distressed when screens are removed",
      "Sleep under 10 hours/night directly caused by late-night screen use in under-8s",
      "Social withdrawal — preferring screens over all human interaction",
      "Screen use affecting school performance measurably over multiple terms",
      "Child unable to sustain attention on any non-screen activity for age-appropriate duration"
    ],
    nutritionNote: "Blue light from screens suppresses melatonin — blue-light-blocking glasses or Night Shift mode reduce this effect by 58%. Ensure adequate omega-3 intake to support the dopaminergic system that screens overactivate.",
    activityRecommendations: ["a18", "a13", "a16"],
    references: [
      "WHO. (2019). Guidelines on physical activity, sedentary behaviour and sleep for children under 5 years. World Health Organization.",
      "American Academy of Pediatrics. (2016). Media and young minds. Pediatrics, 138(5), e20162591.",
      "Nathanson, A.I. (2001). Parent and child perspectives on the presence and meaning of parental television mediation. Journal of Broadcasting & Electronic Media, 45, 201–220.",
      "Dunckley, V.L. (2015). Reset Your Child's Brain. New World Library.",
      "Lauricella, A.R., et al. (2015). Young children's screen time: The complex role of parent and child factors. PLOS One, 10(10), e0140722.",
      "Christakis, D.A., et al. (2004). Early television exposure and subsequent attentional problems in children. Pediatrics, 113(4), 708–713.",
      "Lillard, A.S., & Peterson, J. (2011). The immediate impact of different types of television on young children's executive function. Pediatrics, 128(4), 644–649.",
      "Radesky, J.S., et al. (2016). Mobile and interactive media use by young children: The good, the bad, and the unknown. Pediatrics, 135(1), 1–3.",
      "Hale, L., & Guan, S. (2015). Screen time and sleep among school-aged children and adolescents: A systematic literature review. Sleep Medicine Reviews, 21, 50–58.",
      "Sigman, A. (2012). Time for a view on screen time. Archives of Disease in Childhood, 97, 935–942.",
      "Tandon, P.S., et al. (2011). Preschoolers' total daily screen time at home and by type of child care. Journal of Pediatrics, 158(2), 297–300.",
      "Zimmerman, F.J., & Christakis, D.A. (2007). Associations between content types of early media exposure and subsequent attentional problems. Pediatrics, 120(5), 986–992.",
      "Gentile, D.A., et al. (2012). Pathological video game use among youths: A two-year longitudinal study. Pediatrics, 127(2), e319–e329.",
      "Hirsh-Pasek, K., et al. (2015). Putting education in 'educational' apps: Lessons from the science of learning. Psychological Science in the Public Interest, 16(1), 3–34.",
      "Johnson, J.G., et al. (2007). Extensive television viewing and the development of attention and learning difficulties. Archives of Pediatrics & Adolescent Medicine, 161(5), 480–486.",
      "Vandewater, E.A., et al. (2007). Digital childhood: Electronic media and technology use among infants, toddlers, and preschoolers. Pediatrics, 119(5), e1006–e1015.",
      "Schmidt, M.E., et al. (2008). The effects of background television on the toy play behavior of very young children. Child Development, 79(4), 1137–1151.",
      "Tremblay, M.S., et al. (2011). Systematic review of sedentary behaviour and health indicators in school-aged children and youth. International Journal of Behavioral Nutrition and Physical Activity, 8(1), 98.",
      "Swing, E.L., et al. (2010). Television and video game exposure and the development of attention problems. Pediatrics, 126(2), 214–221.",
      "Strasburger, V.C., et al. (2013). Children, adolescents, and the media. Pediatrics, 132(5), 958–961.",
      "Common Sense Media. (2019). The Common Sense census: Media use by tweens and teens. Common Sense Media.",
      "Linebarger, D.L., & Walker, D. (2005). Infants' and toddlers' television viewing and language outcomes. American Behavioral Scientist, 48(5), 624–645.",
      "Cheng, S., et al. (2020). Screen exposure for young children and associations with developmental outcomes. JAMA Pediatrics, 174(9), 866–873.",
      "Twenge, J.M., & Campbell, W.K. (2019). Media use is linked to lower psychological well-being. Preventive Medicine Reports, 12, 271–283.",
      "Anderson, D.R., & Hanson, K.G. (2010). From blooming, buzzing confusion to media literacy. Developmental Review, 30(2), 239–255."
    ]
  },
  social: {
    category: "social",
    summary: "Social difficulties and shyness in children range from temperamentally-driven behavioral inhibition (15–20% of children, Kagan, 1994) to situational social anxiety requiring intervention. The critical distinction is between temperamental introversion (healthy) and behavioral inhibition that causes distress or significant functional impairment. Research shows that children's social competence is strongly predicted by parental warmth and authoritative (not authoritarian) parenting (Baumrind, 1991). Play-based social skills training has the strongest evidence base for ages 3–8, with peer-directed play showing better outcomes than adult-directed social skills groups. Children who develop social competence show better academic outcomes, lower depression risk, and higher career success at age 30 (Jones et al., 2015).",
    solutions: [
      {
        title: "Graduated Exposure Through Supported Peer Play",
        approach: "Behavioral / Exposure",
        science: "Graded social exposure with scaffolding from a trusted adult is the most evidence-based approach for social anxiety in children (Rapee, 2014). Forced socialization backfires.",
        steps: [
          "Start with the least anxiety-provoking social context: one familiar child, your home, structured activity.",
          "Choose a 'social champion' — one peer the child likes most — for first playdates.",
          "Prepare social scripts in advance: practice what to say when meeting a friend.",
          "Stay present but gradually fade involvement: start engaged, step back as confidence builds.",
          "Debrief after social situations: 'What was the best part? What felt hard?'",
          "Gradually increase exposure: one new child → small group → larger settings.",
          "Never force socialization or criticize shyness — this significantly increases anxiety."
        ],
        duration: "4–8 weeks for meaningful confidence gains",
        successSigns: ["Child initiating contact with peers", "Less clinging to parent in social settings", "Child reporting positive peer experiences"],
        difficulty: "medium"
      },
      {
        title: "Social Thinking Curriculum (Michelle Garcia Winner)",
        approach: "Cognitive / Social Skills",
        science: "Teaching explicit social cognition ('expected' vs 'unexpected' behaviors, reading the room) builds skills that don't come naturally to inhibited or socially anxious children.",
        steps: [
          "Teach 'thinking about others' through social stories (Carol Gray method).",
          "Read books with socially complex characters and pause to discuss thoughts/feelings.",
          "Play 'perspective-taking games': What is this character thinking? What does she want?",
          "Teach specific social scripts for common situations: joining play, handling conflict, responding to teasing.",
          "Use video modeling: watch age-appropriate TV shows and analyze social interactions.",
          "Practice social skills through role-play with dolls, puppets, or parent as 'character'.",
          "Identify the child's social strengths and build structured activities around them."
        ],
        duration: "6–10 weeks for skill consolidation",
        successSigns: ["Child demonstrating perspective-taking in conversation", "More flexible social problem-solving", "Reduced social misunderstandings"],
        difficulty: "medium"
      },
      {
        title: "Interest-Based Social Connection",
        approach: "Strength-Based / Environmental",
        science: "Shared interest groups produce stronger social bonds than random peer grouping. Children with a clear passion find social connection more natural when grouped by shared interest (Asher, 1996).",
        steps: [
          "Identify your child's strongest interest (dinosaurs, art, trains, animals).",
          "Find interest-based groups, classes, or clubs around that topic.",
          "Prepare a 'passion conversation starter': let child teach others about their interest.",
          "Use interest as social currency — the child becomes the 'expert' which boosts confidence.",
          "Arrange informal meetups with children from interest groups outside the class setting.",
          "Document and celebrate social successes in a 'friendship journal' with stickers.",
          "Volunteer roles in group settings (line leader, materials helper) build belonging."
        ],
        duration: "Ongoing — visible confidence gains in 4–6 weeks",
        successSigns: ["Child showing excitement about seeing specific peers", "More reciprocal conversations around shared interests", "Reduced reluctance to attend social activities"],
        difficulty: "easy"
      }
    ],
    redFlags: [
      "Complete refusal to attend school due to social fear",
      "Physical symptoms (nausea, vomiting, stomachaches) consistently before social situations",
      "No desire for any peer contact over extended periods",
      "Social difficulties worsening significantly rather than fluctuating",
      "Social anxiety preventing all age-appropriate activities"
    ],
    nutritionNote: "The gut-brain axis strongly influences social motivation — diverse gut microbiome (fiber, fermented foods, variety) is linked to improved social behavior in research models. Vitamin D deficiency is associated with social withdrawal in children.",
    activityRecommendations: ["a05", "a03", "a20"],
    references: [
      "Kagan, J. (1994). Galen's Prophecy: Temperament in Human Nature. Basic Books.",
      "Baumrind, D. (1991). The influence of parenting style on adolescent competence and substance use. Journal of Early Adolescence, 11(1), 56–95.",
      "Jones, D.E., et al. (2015). Early social-emotional functioning and public health. American Journal of Public Health, 105(11), 2283–2290.",
      "Rapee, R.M. (2014). Preschool environment and temperament as predictors of social and nonsocial anxiety disorders in middle adolescence. Journal of the American Academy of Child & Adolescent Psychiatry, 53(3), 320–328.",
      "Asher, S.R., & Coie, J.D. (Eds.). (1990). Peer Rejection in Childhood. Cambridge University Press.",
      "Winner, M.G. (2007). Thinking About You Thinking About Me. Think Social Publishing.",
      "Gray, C. (2010). The New Social Story Book. Future Horizons.",
      "Rubin, K.H., et al. (2009). The friendship factor. Development and Psychopathology, 21, 901–919.",
      "Coplan, R.J., & Rubin, K.H. (2010). Social withdrawal and shyness in childhood. In P. Smith & C. Hart (Eds.), Wiley-Blackwell Handbook of Childhood Social Development.",
      "Ladd, G.W. (1990). Having friends, keeping friends, making friends, and being liked by peers in the classroom. Child Development, 61, 1081–1100.",
      "Denham, S.A., et al. (2001). Preschoolers at play: Co-socializers of emotional and social competence. International Journal of Behavioral Development, 25(4), 290–301.",
      "Eisenberg, N., & Fabes, R.A. (1992). Emotion, regulation, and the development of social competence. Emotion and Social Behavior, 14, 119–150.",
      "Hoza, B. (2007). Peer functioning in children with ADHD. Ambulatory Pediatrics, 7(1), 101–106.",
      "Bierman, K.L. (2004). Peer Rejection: Developmental Processes and Intervention Strategies. Guilford Press.",
      "Crick, N.R., & Grotpeter, J.K. (1995). Relational aggression, gender, and social-psychological adjustment. Child Development, 66, 710–722.",
      "Dodge, K.A., et al. (2003). Peer rejection and social information-processing factors in the development of aggressive behavior. Child Development, 74(2), 374–393.",
      "Parker, J.G., & Asher, S.R. (1987). Peer relations and later personal adjustment. Psychological Bulletin, 102(3), 357–389.",
      "Putallaz, M., & Bierman, K.L. (2004). Aggression, Antisocial Behavior, and Violence Among Girls. Guilford Press.",
      "Rose-Krasnor, L. (1997). The nature of social competence: A theoretical review. Social Development, 6(1), 111–135.",
      "Selman, R.L. (1981). The child as a friendship philosopher. In S.R. Asher & J.M. Gottman (Eds.), The Development of Children's Friendships.",
      "Sheridan, S.M., et al. (2008). Social skills interventions for children. In T. Gutkin & C. Reynolds (Eds.), Handbook of School Psychology.",
      "Spence, S.H. (2003). Social skills training with children and young people. Clinical Child and Family Psychology Review, 6(2), 139–163.",
      "Wentzel, K.R. (2003). Sociometric status and adjustment in middle school. Journal of Early Adolescence, 23(1), 5–28.",
      "Youniss, J., & Volpe, J. (1978). A relational analysis of children's friendships. New Directions for Child Development, 1, 1–22.",
      "Zins, J.E., et al. (2004). Building Academic Success on Social and Emotional Learning. Teachers College Press."
    ]
  },
  learning: {
    category: "learning",
    summary: "Learning difficulties in children span a broad spectrum from maturational delays to specific learning disabilities (dyslexia affects 5–17%, dyscalculia 3–7%, ADHD 7–9%). Early identification and intervention are critical — the brain's neuroplasticity is highest before age 8, and intensive early intervention produces outcomes equivalent to neurotypical development in many cases. The 'Matthew Effect' (reading rich get richer) means early reading gaps compound exponentially unless addressed. Multi-sensory learning approaches (simultaneously engaging visual, auditory, kinesthetic pathways) are the most robust evidence-based interventions for learning differences. The Orton-Gillingham approach for reading/spelling and the Concrete-Pictorial-Abstract (CPA) method for mathematics have the strongest evidence bases.",
    solutions: [
      {
        title: "Multi-Sensory Learning (Orton-Gillingham Principles)",
        approach: "Educational / Neurological",
        science: "Engaging 3+ sensory pathways simultaneously creates redundant neural encoding — up to 3× better retention and recall than single-channel instruction (Shams & Seitz, 2008).",
        steps: [
          "Identify the specific difficulty (phonics, reading fluency, spelling, math calculation, comprehension).",
          "Teach the same concept through visual (see it), auditory (hear/say it), and kinesthetic (touch/move it) channels simultaneously.",
          "For reading: trace letters in sand/salt while saying the sound — simultaneous tactile + auditory encoding.",
          "For math: use physical objects before pictures before symbols (Bruner's CPA stages).",
          "Break skills into micro-steps and over-teach each step to mastery before proceeding.",
          "Review previously learned material daily (spaced repetition) before introducing new content.",
          "Use color coding, movement patterns, and rhymes as retrieval cues."
        ],
        duration: "6–8 weeks for initial measurable gains; ongoing for full remediation",
        successSigns: ["Improved accuracy in target skill", "Child showing less frustration with the task", "Beginning to generalize the skill to new contexts"],
        difficulty: "medium"
      },
      {
        title: "Growth Mindset & Self-Regulation Building",
        approach: "Psychological / Motivational",
        science: "Children who believe intelligence is fixed (fixed mindset) disengage when challenged. Growth mindset interventions produce 0.4 effect size academic gains (Yeager & Dweck, 2012).",
        steps: [
          "Replace 'you're so smart' with 'you worked so hard' — process praise builds persistence.",
          "Tell real stories of struggle: 'Einstein couldn't read until age 9; he kept trying.'",
          "Normalize mistakes with 'yet': 'You can't do it yet — and yet is where growth lives.'",
          "Create a 'learning timeline' of things they couldn't do before but can now.",
          "Teach about neuroplasticity explicitly: 'Every time you practice, your brain builds a stronger pathway.'",
          "Break challenging tasks into 5-minute effort segments with built-in celebration.",
          "Model your own struggle and persistence out loud while doing challenging tasks."
        ],
        duration: "Ongoing — mindset shifts visible in 4–6 weeks",
        successSigns: ["Child using 'yet' language independently", "Increased persistence on challenging tasks", "Less avoidance of difficult subjects"],
        difficulty: "easy"
      },
      {
        title: "Executive Function Scaffolding",
        approach: "Cognitive / Environmental",
        science: "Working memory, inhibitory control, and cognitive flexibility underlie all academic learning. Executive function training improves academic outcomes significantly (Diamond & Lee, 2011).",
        steps: [
          "Create predictable routines: the brain uses less working memory when sequences are automatic.",
          "Externalize working memory: use checklists, visual schedules, and graphic organizers.",
          "Chunk tasks: break homework/projects into 10-minute segments with movement breaks.",
          "Practice 'inhibitory control games' daily: Simon Says, Freeze Dance, Red Light Green Light.",
          "Teach planning explicitly: use backwards planning maps for projects.",
          "Minimize distractions during learning: single task at a time, quiet environment.",
          "Use body-based learning: stand-up desks, movement breaks, tactile learning tools."
        ],
        duration: "6–10 weeks for executive function strengthening",
        successSigns: ["Improved task completion", "Better attention during learning tasks", "Reduced need for external prompting"],
        difficulty: "medium"
      }
    ],
    redFlags: [
      "Reading below grade level by more than 1 year after age 7",
      "Significant reversals of letters/numbers persisting after age 8",
      "Cannot follow 3-step instructions consistently after age 5",
      "Learning concerns accompanied by behavior regression or emotional withdrawal",
      "Teacher reporting concerns consistently across multiple terms"
    ],
    nutritionNote: "The brain uses 20% of total caloric energy — breakfast is non-negotiable for learning. Omega-3 DHA directly builds myelin and synaptic membranes. Iron deficiency (affects 20% of children) measurably reduces cognitive performance and attention even at sub-anemia levels.",
    activityRecommendations: ["a14", "a11", "a10"],
    references: [
      "Orton, S.T. (1937). Reading, Writing, and Speech Problems in Children. W.W. Norton.",
      "Gillingham, A., & Stillman, B. (1997). The Gillingham Manual. Educators Publishing Service.",
      "Shams, L., & Seitz, A.R. (2008). Benefits of multisensory learning. Trends in Cognitive Sciences, 12(11), 411–417.",
      "Yeager, D.S., & Dweck, C.S. (2012). Mindsets that promote resilience. Educational Psychologist, 47(4), 302–314.",
      "Diamond, A., & Lee, K. (2011). Interventions shown to aid executive function development in children 4–12 years old. Science, 333(6045), 959–964.",
      "Bruner, J.S. (1966). Toward a Theory of Instruction. Harvard University Press.",
      "Stanovich, K.E. (1986). Matthew effects in reading: Some consequences of individual differences. Reading Research Quarterly, 21(4), 360–407.",
      "Lyon, G.R., et al. (2003). Defining dyslexia, comorbidity, teachers' knowledge of language and reading. Annals of Dyslexia, 53(1), 1–14.",
      "Shaywitz, S.E. (2003). Overcoming Dyslexia. Alfred A. Knopf.",
      "Willingham, D.T. (2009). Why Don't Students Like School? Jossey-Bass.",
      "Baddeley, A. (2003). Working memory: Looking back and looking forward. Nature Reviews Neuroscience, 4, 829–839.",
      "Berninger, V.W., & Wolf, B.J. (2009). Helping Students with Dyslexia and Dysgraphia Make Connections. Paul H. Brookes Publishing.",
      "Geary, D.C. (2010). Mathematical disabilities: Reflections on cognitive, neuropsychological, and genetic components. Learning and Individual Differences, 20(2), 130–133.",
      "Moffitt, T.E., et al. (2011). A gradient of childhood self-control predicts health, wealth, and public safety. PNAS, 108(7), 2693–2698.",
      "National Reading Panel. (2000). Teaching Children to Read. National Institute of Child Health and Human Development.",
      "Swanson, H.L. (2001). Searching for the best model for instructing students with learning disabilities. Focus on Exceptional Children, 34(2), 1–15.",
      "Torgesen, J.K., et al. (2001). Intensive remedial instruction for children with severe reading disabilities. Journal of Learning Disabilities, 34(1), 33–58.",
      "Vygotsky, L.S. (1978). Mind in Society: The Development of Higher Psychological Processes. Harvard University Press.",
      "Elias, M.J., et al. (1997). Promoting Social and Emotional Learning: Guidelines for Educators. ASCD.",
      "Dweck, C.S. (2006). Mindset: The New Psychology of Success. Random House.",
      "Siegel, L.S. (1999). Issues in the definition and diagnosis of learning disabilities: A perspective on Guckenberger v. Boston University. Journal of Learning Disabilities, 32(4), 304–319.",
      "Fletcher, J.M., et al. (2007). Learning Disabilities: From Identification to Intervention. Guilford Press.",
      "Foorman, B.R., et al. (1998). The role of instruction in learning to read: Preventing reading failure in at-risk children. Journal of Educational Psychology, 90(1), 37–55.",
      "Kirby, J.R., & Williams, N.H. (1991). Learning Problems: A Cognitive Approach. Kagan & Woo.",
      "Wolf, M. (2007). Proust and the Squid: The Story and Science of the Reading Brain. Harper."
    ]
  },
  anxiety: {
    category: "anxiety",
    summary: "Anxiety disorders are the most common mental health conditions in childhood, affecting 7–15% of children, with separation anxiety and generalized anxiety being most prevalent in ages 2–8. Child anxiety is highly treatable — Cognitive Behavioral Therapy (CBT) for childhood anxiety shows 60–80% remission rates in controlled trials (Kendall, 1994). The key insight from ACT (Acceptance and Commitment Therapy) is that avoidance of anxiety-provoking situations strengthens the anxiety cycle, while graduated approach builds tolerance and self-efficacy. Parent anxiety modeling and accommodation of child anxiety both significantly predict child anxiety maintenance. Early intervention prevents the 50% of childhood anxiety disorders that persist into adulthood (Pine et al., 1998).",
    solutions: [
      {
        title: "CBT Ladder: Gradual Exposure Hierarchy",
        approach: "Cognitive-Behavioral",
        science: "Graduated exposure to feared situations while teaching coping skills is the gold-standard treatment for childhood anxiety (Kendall's Coping Cat; 60–80% remission rates).",
        steps: [
          "Create an 'anxiety ladder' together — list feared situations from least scary (1) to most scary (10).",
          "Start with a situation rated 2–3 and create a plan for approaching it (with coping strategies).",
          "Teach the STOP skill: Stop, Take a breath, Observe (what am I thinking?), Proceed with a plan.",
          "Identify and challenge anxious thoughts: 'What is the REALISTIC chance of that happening?'",
          "Complete the first small step, celebrate bravery, and repeat until it no longer triggers anxiety.",
          "Move to the next rung — never skip rungs, never avoid once committed.",
          "Keep a 'brave ladder' chart — completed rungs show progress visually."
        ],
        duration: "8–12 weeks for full hierarchy completion",
        successSigns: ["Willingness to attempt previously avoided situations", "Faster recovery from anxious episodes", "Child using coping strategies independently"],
        difficulty: "hard"
      },
      {
        title: "Worry Time & Cognitive Restructuring",
        approach: "Cognitive / Scheduling",
        science: "Designated 'worry time' at a predictable daily interval reduces intrusive worry throughout the day by 38% (Borkovec, 1983) — worry has a cognitive schedule that can be trained.",
        steps: [
          "Establish a daily 'worry time' at the same time each day (not bedtime) for 10–15 minutes.",
          "Provide a 'worry journal' — child writes or draws all worries at worry time only.",
          "When child worries outside worry time: 'Write it down, we'll talk at worry time.'",
          "At worry time, review worries and categorize: 'Can I do something about this? Not sure? Out of my control?'",
          "Create action plans for controllable worries, practice acceptance for uncontrollable ones.",
          "Teach the 'worry meter' (1–10) to build metacognitive awareness of anxiety intensity.",
          "Gradually shorten worry time as child gains control skills."
        ],
        duration: "3–4 weeks to establish the habit; 6–8 weeks for meaningful improvement",
        successSigns: ["Worries staying in worry time rather than throughout the day", "Child categorizing worries independently", "Reduced bedtime worry and rumination"],
        difficulty: "easy"
      },
      {
        title: "Body-Based Regulation & Mindfulness",
        approach: "Somatic / Mindfulness",
        science: "Anxiety is a bodily experience — activating the parasympathetic nervous system through the body is faster than cognitive approaches for acute anxiety (Porges, 2011; Polyvagal Theory).",
        steps: [
          "Teach '4-7-8 breathing': inhale 4, hold 7, exhale 8 — activates vagal tone in 60 seconds.",
          "Practice 'body scan' relaxation before bed: tense and release each muscle group.",
          "Teach the '5-4-3-2-1 grounding technique': name 5 things you see, 4 hear, 3 touch, 2 smell, 1 taste.",
          "Create a 'calm corner' — a designated cozy space with sensory tools (fidgets, weighted blanket, headphones).",
          "Introduce child-appropriate yoga: even 10 minutes daily reduces cortisol significantly.",
          "Model regulated breathing in your own daily life — children co-regulate with parents.",
          "Practice mindfulness games: mindful eating, mindful walking, sensory exploration."
        ],
        duration: "2–3 weeks for skills acquisition; ongoing practice",
        successSigns: ["Child using breathing/grounding independently when anxious", "Requesting calm corner proactively", "Reduced physical symptoms (stomachaches, headaches)"],
        difficulty: "easy"
      }
    ],
    redFlags: [
      "Anxiety preventing school attendance for multiple consecutive days",
      "Physical symptoms (chest tightness, shortness of breath, fainting) during anxiety",
      "Self-harm or expressions of hopelessness",
      "Anxiety significantly worsening over months despite consistent intervention",
      "Panic attacks in children under 8 — requires immediate professional evaluation"
    ],
    nutritionNote: "The gut produces 95% of the body's serotonin — gut health directly affects anxiety. Probiotic-rich foods (yogurt, kefir) and diverse fiber sources reduce anxiety in clinical studies. Reduce caffeine (chocolate, cola), sugar spikes, and inflammatory foods which activate the HPA stress axis.",
    activityRecommendations: ["a21", "a20", "a17"],
    references: [
      "Kendall, P.C. (1994). Treating anxiety disorders in children: Results of a randomized clinical trial. Journal of Consulting and Clinical Psychology, 62(1), 100–110.",
      "Pine, D.S., et al. (1998). The risk for early-adulthood anxiety and depressive disorders in adolescents with anxiety and depressive disorders. Archives of General Psychiatry, 55(1), 56–64.",
      "Borkovec, T.D., et al. (1983). Preliminary exploration of worry: Some characteristics and processes. Behaviour Research and Therapy, 21(1), 9–16.",
      "Porges, S.W. (2011). The Polyvagal Theory. W.W. Norton & Company.",
      "Hayes, S.C., et al. (1999). Acceptance and Commitment Therapy: An Experiential Approach to Behavior Change. Guilford Press.",
      "Silverman, W.K., & Hinshaw, S.P. (2008). The second special issue on evidence-based psychosocial treatments for children and adolescents. Journal of Clinical Child and Adolescent Psychology, 37(1), 1–7.",
      "Rapee, R.M., et al. (2009). Helping Your Anxious Child: A Step-by-Step Guide for Parents. New Harbinger.",
      "Costello, E.J., et al. (2003). Prevalence and development of psychiatric disorders in childhood and adolescence. Archives of General Psychiatry, 60(8), 837–844.",
      "Walkup, J.T., et al. (2008). Cognitive behavioral therapy, sertraline, or a combination in childhood anxiety. NEJM, 359(26), 2753–2766.",
      "Cartwright-Hatton, S., et al. (2004). Efficacy of CBT for childhood anxiety disorders. British Journal of Clinical Psychology, 43(4), 421–436.",
      "Chorpita, B.F., & Barlow, D.H. (1998). The development of anxiety: The role of control in the early environment. Psychological Bulletin, 124(1), 3–21.",
      "Muris, P., et al. (2002). Relationships between cognitive development and childhood anxiety symptoms in a nonclinical sample. Cognitive Therapy and Research, 26(3), 359–372.",
      "Donovan, C.L., & Spence, S.H. (2000). Prevention of childhood anxiety disorders. Clinical Psychology Review, 20(4), 509–531.",
      "Kabat-Zinn, J. (2003). Mindfulness-based interventions in context. Clinical Psychology: Science and Practice, 10(2), 144–156.",
      "Siegel, D.J. (2010). Mindsight: The New Science of Personal Transformation. Bantam Books.",
      "Attwood, T. (2004). Exploring Feelings: Cognitive Behaviour Therapy to Manage Anxiety. Future Horizons.",
      "Barrett, P.M. (1998). Evaluation of cognitive-behavioral group treatments for childhood anxiety disorders. Journal of Clinical Child Psychology, 27(4), 459–468.",
      "Ginsburg, G.S., & Schlossberg, M.C. (2002). Family-based treatment of childhood anxiety disorders. International Review of Psychiatry, 14(2), 143–154.",
      "Hughes, A.A., & Kendall, P.C. (2008). Effect of a positive emotional state on performance on anxiety-relevant and anxiety-irrelevant cognitive tasks. Cognition and Emotion, 22(5), 922–932.",
      "Manassis, K. (2000). Keys to Parenting Your Anxious Child. Barron's Educational Series.",
      "Masi, G., et al. (2004). Panic disorder in clinically referred children and adolescents. Child Psychiatry and Human Development, 34(3), 219–228.",
      "Rachman, S. (2004). Fear and Courage. W.H. Freeman and Company.",
      "Spence, S.H. (1994). Practitioner review: Cognitive therapy with children and adolescents. Journal of Child Psychology and Psychiatry, 35(7), 1191–1228.",
      "Stallard, P. (2002). Think Good, Feel Good: A Cognitive Behaviour Therapy Workbook for Children. Wiley.",
      "White, S.W., et al. (2009). Anxiety in children with autism spectrum disorders. Clinical Psychology Review, 29(3), 216–229."
    ]
  },
  ai_literacy: {
    category: "ai_literacy",
    summary: "Children today encounter chatbots, voice assistants, and homework helpers early. Developmental research emphasizes **calibration** (knowing what a tool can and cannot do) and **verification habits** (checking important claims) as human-complementary skills — not fear of technology. Studies on source evaluation and epistemic cognition show that simple family scripts (e.g., “two questions before we believe something big”) improve critical thinking when practiced repeatedly in low-stakes moments. Screen-time guidelines (AAP) remain relevant: co-use, content quality, and sleep hygiene matter. Pair limits with **proactive** offline games that rehearse clear instructions, spotting missing context, and asking a trusted human — the same habits that transfer when tools get more powerful.",
    solutions: [
      {
        title: "Two-Question Pause (Family Rule)",
        approach: "Habit / Epistemic",
        science: "Structured questioning before accepting a surprising ‘fact’ builds metacognitive brakes; analog habits transfer to digital contexts better than one-off lectures.",
        steps: [
          "Introduce a calm rule: ‘Two quick questions before we treat something as true.’",
          "Brainstorm questions together: Who said it? How could we check? Who is an expert we trust?",
          "Role-play: you give a silly ‘fact’; your child asks two questions.",
          "Apply after shows, games, or voice-assistant answers — not as punishment, as a team habit.",
          "Celebrate good questions more than ‘being right.’",
          "Keep sessions under 5 minutes for younger children; extend for ages 8+.",
        ],
        duration: "2–4 weeks to feel automatic",
        successSigns: ["Child pauses before repeating claims", "Asks ‘how do we know?’ in everyday chat", "Less argument when you model the same rule"],
        difficulty: "easy",
      },
      {
        title: "Robot Chef — Literal vs Smart Instructions",
        approach: "Unplugged / Communication",
        science: "Following instructions exactly reveals ambiguity — the same gap that causes AI ‘hallucinations’ or wrong outputs when prompts are vague.",
        steps: [
          "Pick a simple snack you can make together.",
          "Round 1: follow your child’s written steps exactly (no fixing) — note funny gaps.",
          "Laugh together; revise the list to remove ambiguity.",
          "Round 2: add one clarifying question per step before acting.",
          "Close: ‘Clear words help humans AND tools understand us.’",
        ],
        duration: "One 20–30 min session; repeat monthly",
        successSigns: ["More specific verbs and order in instructions", "Child notices missing steps unprompted"],
        difficulty: "medium",
      },
      {
        title: "Co-Use & Boundaries for Assistive Tools",
        approach: "Environmental / Media",
        science: "Joint media engagement predicts better learning and safety behaviors than solo use alone; consistent routines reduce conflict.",
        steps: [
          "Choose 1–2 approved uses for assistants (e.g., spelling, timer, music) vs off-limits (e.g., homework answers without showing work).",
          "Use tools side-by-side at first; narrate your thinking.",
          "Move assistants out of bedrooms at night; protect sleep (blue light + engagement delay sleep onset).",
          "Weekly 10-min check-in: what did you ask the tool this week? What surprised you?",
          "If homework is involved: ‘Show your thinking first, then we decide if a hint helps.’",
        ],
        duration: "Ongoing; first agreement in one sitting",
        successSigns: ["Fewer secretive sessions", "Child describes tool limits in their own words", "Sleep routine stabilizes"],
        difficulty: "medium",
      },
    ],
    redFlags: [
      "Child uses AI/chat to seek harmful, sexual, or self-harm content — use device safeguards and professional support immediately",
      "Complete school refusal tied only to tool use — involve school and a clinician",
      "Severe anxiety or compulsive checking about ‘being wrong’ — CBT-oriented help may be needed",
      "Cyberbullying or grooming concerns — report per platform guidance and involve trusted adults",
    ],
    nutritionNote: "Not nutrition-specific; keep regular meals and hydration — stress and sleep disruption around screen conflict can affect appetite.",
    activityRecommendations: ["Use in-app AI literacy activities (e.g. Slow News Detective, Two-Question Rule, Robot Chef) weekly", "Pair with a21 breath practice when conversations feel heated"],
    references: [
      "American Academy of Pediatrics. (2016). Media and young minds. Pediatrics, 138(5), e20162591.",
      "Bråten, I., et al. (2011). Measuring strategic processing when students read multiple texts. Metacognition and Learning, 6(2), 111–130.",
      "Britt, M.A., et al. (2018). Reading for learning: Cognitive processes in comprehension, sourcing, and integration. Educational Psychologist, 53(4), 250–262.",
      "Chen, B., et al. (2020). Young children's learning from touchscreens: A review. Frontiers in Psychology, 11, 1606.",
      "Cho, B.-Y., et al. (2018). Middle school students' epistemic cognition in domain-specific internet searching. Educational Psychologist, 53(4), 263–278.",
      "Common Sense Media. (ongoing). Research on children, teens, and media use. commonsensemedia.org.",
      "EU Kids Online. (2020). EU Kids Online 2020: Survey results from 19 countries.",
      "Hobbs, R. (2010). Digital and media literacy: A plan of action. Aspen Institute Communications and Society Program.",
      "Ito, M., et al. (2013). Connected Learning: An Agenda for Research and Design. Digital Media and Learning Research Hub.",
      "Kirschner, P.A., & De Bruyckere, P. (2017). The myths of digital natives and multitasking. Teaching and Teacher Education, 67, 135–142.",
      "Livingstone, S., et al. (2017). Global Kids Online: Comparative report. UNICEF Office of Research.",
      "Mason, L., et al. (2014). Web page processing: Effects of text structure and emotional content. Journal of Educational Psychology, 106(2), 470–488.",
      "McGrew, S., et al. (2018). Challenges in seeing: Skills and tasks in assessing credibility. Harvard Kennedy School Misinformation Review.",
      "Meyer, A., et al. (2021). Children and digital technology: Attitudes, skills, and practices. New Media & Society, 23(5), 1234–1253.",
      "Ofcom. (2023). Children and parents: Media use and attitudes report (UK).",
      "Penuel, W.R., et al. (2012). Mobile devices for teaching and learning. Educational Technology, 52(3), 17–22.",
      "Piaget, J. (1972). Intellectual evolution from adolescence to adulthood. Human Development, 15(1), 1–12.",
      "Rideout, V. (2017). The Common Sense census: Media use by kids age zero to eight. Common Sense Media.",
      "Straker, L., et al. (2018). Evidence-based guidelines for wise use of electronic games by children. Ergonomics, 61(5), 683–694.",
      "UNICEF. (2017). Children in a digital world. The State of the World's Children.",
      "Vanden Abeele, M.M.P. (2021). Digital wellbeing as a dynamic construct. Communication Theory, 31(3), 932–959.",
      "Wineburg, S., & McGrew, S. (2019). Lateral reading: Reading less and learning more when evaluating digital information. Stanford History Education Group Working Paper.",
      "Wartella, E., et al. (2016). Children and electronic media. Future of Children, 26(2), 1–10.",
      "Zhao, Y., et al. (2021). The digital lives of children: Insights across countries. Journal of Computer Assisted Learning, 37(4), 849–863.",
    ],
  },
};

async function postAiCounselor(c: Context) {
  try {
    const rateLimit = await enforceRateLimit(c, "ai-counselor", 20, 600);
    if (rateLimit) return rateLimit;
    const { concern, childAge, tier, category } = await c.req.json();
    if (!concern || !category) return c.json({ error: "Missing concern or category" }, 400);

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      const demo = DEMO_RESPONSES[category] ?? DEMO_RESPONSES["behavior"];
      return c.json({ success: true, data: demo, isDemo: true });
    }

    const systemPrompt = `You are NeuroSpark's world-class child development AI advisor — a synthesis of pediatric neuroscience, developmental psychology, behavioral therapy, nutritional science, cultural child-rearing wisdom, and mindfulness research. You have deep knowledge of Harvard Child Development, Johns Hopkins Pediatrics, WHO guidelines, AAP recommendations, and global parenting traditions from India, Japan, China, Korea, Scandinavia, and Western educational science.

When a parent shares a concern about their child (age ${childAge}, developmental tier ${tier}):
0. If category is "ai_literacy", prioritize: verification habits, co-use, age-appropriate boundaries, epistemic cognition, and human judgment alongside tools — not fear-mongering; cite media-literacy and developmental evidence
1. Analyze the concern thoroughly from a neurological, behavioral, emotional, and environmental perspective
2. Consider the child's specific developmental stage
3. Provide a rich research context (200-250 words)
4. Draw from 20-25 REAL academic and clinical references (format: Author, A.B. (Year). Title. Journal, Volume(Issue), Pages.)
5. Provide exactly 3 solution approaches — vary them: behavioral, environmental, nutritional/biological, cultural, mindfulness-based
6. Each solution must have 5-7 concrete, immediately actionable steps
7. Include realistic timelines and specific success indicators
8. Note red flags requiring professional consultation
9. Be warm, non-judgmental, empowering, and culturally sensitive

Return ONLY valid JSON in this exact structure:
{
  "category": "${category}",
  "summary": "Research context paragraph (200-250 words)",
  "solutions": [
    {
      "title": "Solution name",
      "approach": "Behavioral/Environmental/etc",
      "science": "Brief scientific basis (2 sentences)",
      "steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4...", "Step 5...", "Step 6..."],
      "duration": "X weeks",
      "successSigns": ["Sign 1", "Sign 2", "Sign 3"],
      "difficulty": "easy|medium|hard"
    }
  ],
  "redFlags": ["Flag 1", "Flag 2", "Flag 3", "Flag 4"],
  "nutritionNote": "Dietary/nutritional considerations",
  "activityRecommendations": ["general activity suggestion 1", "suggestion 2", "suggestion 3"],
  "references": ["Author, A.B. (Year). Title. Journal. Vol(Issue), Pages.", ... 20-25 references]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parent's concern about their ${childAge}-year-old child (Category: ${category}): "${concern}"\n\nPlease provide comprehensive, research-backed guidance with exactly 3 solutions and 20-25 academic references. Return only valid JSON.` }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log("OpenAI API error:", errText);
      const demo = DEMO_RESPONSES[category] ?? DEMO_RESPONSES["behavior"];
      return c.json({ success: true, data: demo, isDemo: true });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content ?? "";
    let parsed;
    try {
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.log("JSON parse error, falling back to demo:", content.slice(0, 200));
      const demo = DEMO_RESPONSES[category] ?? DEMO_RESPONSES["behavior"];
      return c.json({ success: true, data: demo, isDemo: true });
    }

    return c.json({ success: true, data: parsed, isDemo: false });
  } catch (e) {
    console.log("ai-counselor error:", e);
    return c.json({ error: String(e) }, 500);
  }
}

/** Supabase Edge passes path after /functions/v1/<function-name>/ — register both styles. */
app.post("/make-server-76b0ba9a/ai-counselor", postAiCounselor);
app.post("/ai-counselor", postAiCounselor);

// ─── AI Parenting Coach ───────────────────────────────────────────────────────
type CoachRequestBody = {
  profile?: CoachChildProfile;
  scores?: Record<string, number>;
  question?: string;
  messages?: CoachChatMessage[];
  isPremium?: boolean;
  /** Survivor 1: identifies which child's long memory to inject. Optional. */
  childId?: string;
  mode?: "brain-map" | "activity-coaching";
  activityContext?: {
    name?: string;
    region?: string;
    intelligences?: string[];
    duration?: number;
    instructions?: string[];
  };
};

function isFiniteRecord(input: unknown): input is Record<string, number> {
  if (!input || typeof input !== "object") return false;
  return Object.values(input).every((value) => typeof value === "number" && Number.isFinite(value));
}

function sanitizeCoachMessages(messages: unknown): CoachChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (message): message is CoachChatMessage =>
        !!message &&
        typeof message === "object" &&
        (message as CoachChatMessage).role !== undefined &&
        ((message as CoachChatMessage).role === "user" || (message as CoachChatMessage).role === "assistant") &&
        typeof (message as CoachChatMessage).content === "string",
    )
    .slice(-8);
}

async function postCoach(c: Context) {
  try {
    const rateLimit = await enforceRateLimit(c, "coach", 24, 600);
    if (rateLimit) return rateLimit;

    const body = (await c.req.json()) as CoachRequestBody;
    if (!body.profile || typeof body.profile.age !== "number" || !isFiniteRecord(body.scores)) {
      return c.json({ success: false, error: "invalid_payload" }, 400);
    }

    const profile: CoachChildProfile = {
      age: body.profile.age,
      name: typeof body.profile.name === "string" ? body.profile.name : undefined,
      goals: Array.isArray(body.profile.goals)
        ? body.profile.goals.filter((goal): goal is string => typeof goal === "string")
        : undefined,
    };
    const scores = body.scores;
    const isPremium = body.isPremium !== false;
    const question = typeof body.question === "string" ? body.question : undefined;
    const messages = sanitizeCoachMessages(body.messages);

    const fallback = buildCoachFallback(profile, scores, { question, isPremium });
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return c.json({ success: true, data: fallback, isDemo: true });
    }

    const isActivityMode = body.mode === "activity-coaching" && body.activityContext;
    let systemPrompt: string;
    let userMessage: string;

    if (isActivityMode) {
      const ctx = body.activityContext!;
      systemPrompt = [
        `You are a child development activity coach. The parent is doing "${ctx.name ?? "an activity"}" with their child (age ${profile.age}).`,
        `Activity region: ${ctx.region ?? "General"}, intelligences: ${(ctx.intelligences ?? []).join(", ")}, duration: ${ctx.duration ?? "unknown"} min.`,
        ctx.instructions?.length ? `Steps: ${ctx.instructions.join("; ")}` : "",
        "Respond with JSON: { keyInteractions: string[], deepeningTips: string[], observeFor: string[], chatReply: string, disclaimer: string }",
        "keyInteractions: 3 specific ways the parent can interact during THIS activity.",
        "deepeningTips: 2 ways to extend the learning deeper.",
        "observeFor: 3 things to watch for in the child's behavior.",
        "chatReply: A warm, brief response to any parent question.",
        "Keep advice practical, warm, and age-appropriate.",
      ].filter(Boolean).join("\n");
      userMessage = question?.trim()
        ? `Parent asks: ${question}`
        : "Give me coaching guidance for this specific activity.";
    } else {
      // Survivor 1: pull long memory for this child from coach_memory.
      // Best-effort; we never fail the coach call because of memory I/O.
      let longMemory: Array<{ observation: string; topic: string; weight: number; created_at: string }> = [];
      try {
        const auth = await requireUser(c);
        if (!(auth instanceof Response) && body.childId) {
          const url = Deno.env.get("SUPABASE_URL");
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          if (url && serviceKey) {
            const sb = createClient(url, serviceKey);
            const memRes = await sb
              .from("coach_memory")
              .select("observation, topic, weight, created_at")
              .eq("user_id", auth.userId)
              .eq("child_id", String(body.childId).slice(0, 64))
              .order("created_at", { ascending: false })
              .limit(40);
            longMemory = (memRes.data ?? []) as typeof longMemory;
          }
        }
      } catch (e) {
        console.warn("coach long-memory fetch failed", e);
      }

      systemPrompt = generateCoachPrompt(profile, scores, {
        question,
        isPremium,
        messages,
        longMemory,
      });
      userMessage = question?.trim()
        ? `Parent follow-up: ${question}`
        : "Create the initial AI parenting coach response now.";
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 2200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      return c.json({ success: true, data: fallback, isDemo: true });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content ?? "";
    try {
      const clean = String(content).replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean) as Partial<CoachResponse>;
      const normalized: CoachResponse = {
        insights: typeof parsed.insights === "string" ? parsed.insights : fallback.insights,
        summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.filter((item): item is string => typeof item === "string")
          : fallback.strengths,
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements.filter((item): item is string => typeof item === "string")
          : fallback.improvements,
        dailyPlan: Array.isArray(parsed.dailyPlan)
          ? parsed.dailyPlan.filter(
              (item): item is CoachResponse["dailyPlan"][number] =>
                !!item &&
                typeof item === "object" &&
                typeof item.timeOfDay === "string" &&
                typeof item.title === "string" &&
                typeof item.description === "string" &&
                typeof item.duration === "string" &&
                typeof item.regionKey === "string",
            )
          : fallback.dailyPlan,
        weeklyFocus: Array.isArray(parsed.weeklyFocus)
          ? parsed.weeklyFocus.filter((item): item is string => typeof item === "string")
          : fallback.weeklyFocus,
        chatReply: typeof parsed.chatReply === "string" ? parsed.chatReply : fallback.chatReply,
        disclaimer: typeof parsed.disclaimer === "string" ? parsed.disclaimer : fallback.disclaimer,
        isPremium,
      };

      return c.json({ success: true, data: normalized, isDemo: false });
    } catch {
      return c.json({ success: true, data: fallback, isDemo: true });
    }
  } catch (e) {
    console.log("coach error:", e);
    return c.json({ success: false, error: "coach_failed" }, 500);
  }
}

app.post("/make-server-76b0ba9a/coach", postCoach);
app.post("/coach", postCoach);

// ═══════════════════════════════════════════════════════════════════════════
// Companion Coach Memory — Survivor 1.
// Long-memory parent partner. Append-only observations the coach reads
// back when answering. Strictly RLS-isolated by child + user.
// ═══════════════════════════════════════════════════════════════════════════
const COACH_MEMORY_TOPICS = new Set([
  "sleep", "meltdown", "rupture-repair", "milestone", "language",
  "social", "sibling", "school", "health", "emotion", "curiosity", "other",
]);

async function postCoachMemory(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "coach-memory-write", 60, 60, userId);
  if (rateLimit) return rateLimit;

  const body = (await c.req.json()) as {
    childId?: string; observation?: string; topic?: string; weight?: number;
  };
  const childId = typeof body.childId === "string" ? body.childId.slice(0, 64) : "";
  const observation = truncateString(body.observation, 800);
  const topic = typeof body.topic === "string" && COACH_MEMORY_TOPICS.has(body.topic) ? body.topic : "other";
  const weight = clampNumber(body.weight, 1, 5) ?? 1;
  if (!childId || !observation) return c.json({ error: "invalid_payload" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);

  const { data, error } = await sb
    .from("coach_memory")
    .insert({ user_id: userId, child_id: childId, observation, topic, weight })
    .select("id, created_at")
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ id: data?.id, createdAt: data?.created_at });
}

async function getCoachMemory(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;
  const childId = c.req.query("childId");
  if (!childId) return c.json({ error: "childId required" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);

  const { data, error } = await sb
    .from("coach_memory")
    .select("id, observation, topic, weight, created_at")
    .eq("user_id", userId)
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
}

async function deleteCoachMemory(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;
  const id = c.req.param("id");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);

  const { error } = await sb
    .from("coach_memory")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
}

app.post("/make-server-76b0ba9a/coach/memory", postCoachMemory);
app.post("/coach/memory", postCoachMemory);
app.get("/make-server-76b0ba9a/coach/memory", getCoachMemory);
app.get("/coach/memory", getCoachMemory);
app.delete("/make-server-76b0ba9a/coach/memory/:id", deleteCoachMemory);
app.delete("/coach/memory/:id", deleteCoachMemory);

// ─── Rupture-and-repair mode ─────────────────────────────────────────────
// Curated, latency-optimised endpoint for the "my child just had a meltdown,
// what do I do in the next 90 seconds?" voice flow. Returns scripted dyadic
// breathing + parent script + a recovery reframe in <2s. Always free
// (no premium gate) — this is a safety + retention surface.
async function postCoachRupture(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "coach-rupture", 30, 600, userId);
  if (rateLimit) return rateLimit;

  const body = (await c.req.json()) as {
    childAgeMonths?: number; childId?: string; trigger?: string; childName?: string;
  };
  const ageMonths = clampNumber(body.childAgeMonths, 6, 240) ?? 60;
  const trigger = truncateString(body.trigger, 300);
  const childName = truncateString(body.childName, 40) || "your child";

  // Curated micro-script for the next 90 seconds. Format chosen so the
  // narration layer can stream sentence-by-sentence to TTS.
  const script = ageMonths < 36
    ? [
        `Get to ${childName}'s eye level. Soften your voice.`,
        `Breathe with them: in for four, out for six. Do it twice.`,
        `Name what you see: "You're really upset right now. That's okay."`,
        `Offer two simple choices when their breathing slows: "Hug or quiet space?"`,
        `Once they're regulated, validate first. Problem-solving comes after.`,
      ]
    : ageMonths < 84
    ? [
        `Pause. Don't try to fix yet. Just be present at their level.`,
        `Breathe slowly together: in for four, out for six. Twice.`,
        `Name the feeling without judging it. "I see you're really frustrated."`,
        `Offer one boundary AND one choice. "We can't throw — but we can stomp or squeeze."`,
        `When they're calm, ask: "What was the hardest part?" Listen, don't lecture.`,
        `Repair: "I'm sorry that was so hard. I'm glad we got through it together."`,
      ]
    : [
        `Pause and breathe. Don't match their energy.`,
        `Box-breathe with them: in 4, hold 4, out 4, hold 4. Twice.`,
        `Validate the feeling specifically. "Sounds like that felt really unfair."`,
        `Ask, don't tell: "What do you need right now?"`,
        `If they need space, give it — but stay nearby.`,
        `When calm, repair together: "What could we both do differently next time?"`,
      ];

  // Best-effort: log a memory observation so the next coach session knows.
  if (body.childId) {
    try {
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && serviceKey) {
        const sb = createClient(url, serviceKey);
        await sb.from("coach_memory").insert({
          user_id: userId,
          child_id: String(body.childId).slice(0, 64),
          observation: `Rupture-and-repair session. Trigger: ${trigger || "unspecified"}.`,
          topic: "rupture-repair",
          weight: 3,
        });
      }
    } catch (e) {
      console.warn("rupture memory log failed", e);
    }
  }

  return c.json({
    success: true,
    data: {
      title: "Rupture & Repair — next 90 seconds",
      script,
      followUpAfterCalm: [
        "Sit with them quietly for 60 seconds.",
        "Offer water.",
        "Name one specific thing they did well during the recovery.",
      ],
      disclaimer: "This is in-the-moment co-regulation guidance, not a clinical intervention. If meltdowns are frequent or self-harming, please consult a pediatrician.",
    },
  });
}

app.post("/make-server-76b0ba9a/coach/rupture", postCoachRupture);
app.post("/coach/rupture", postCoachRupture);

// ─── Sleep × Cognition (Survivor 4) ───────────────────────────────────────
// Append-only nightly bucket per child. Conflict-resolution = UNION on
// (user_id, child_id, night_date); a re-log overwrites the prior bucket
// for that night (parent corrects yesterday's manual entry).
async function postSleepLog(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;
  const rateLimit = await enforceRateLimit(c, "sleep-log", 120, 600, userId);
  if (rateLimit) return rateLimit;

  const body = (await c.req.json()) as {
    childId?: string; nightDate?: string; bucket?: string; source?: string;
    minutesSlept?: number; awakenings?: number; tzOffsetMin?: number;
  };
  const childId = truncateString(body.childId, 64);
  const nightDate = truncateString(body.nightDate, 10);
  const bucket = String(body.bucket ?? "");
  const source = String(body.source ?? "manual");
  if (!childId || !nightDate) return c.json({ error: "missing_fields" }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nightDate)) return c.json({ error: "bad_date" }, 400);
  if (!["excellent", "adequate", "short", "deficient"].includes(bucket)) return c.json({ error: "bad_bucket" }, 400);
  if (!["healthkit", "health-connect", "fitbit", "oura", "manual", "imported"].includes(source)) return c.json({ error: "bad_source" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);
  const { error } = await sb
    .from("child_sleep_signal")
    .upsert(
      {
        user_id: userId,
        child_id: childId,
        night_date: nightDate,
        bucket,
        source,
        tz_offset_min: typeof body.tzOffsetMin === "number" ? Math.round(body.tzOffsetMin) : null,
      },
      { onConflict: "user_id,child_id,night_date" },
    );
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
}

async function getSleepList(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;
  const childId = truncateString(c.req.query("childId"), 64);
  const limit = Math.min(60, Math.max(1, Number(c.req.query("limit") ?? 14) | 0));
  if (!childId) return c.json({ error: "missing_childId" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);
  const { data, error } = await sb
    .from("child_sleep_signal")
    .select("child_id, night_date, bucket, source")
    .eq("user_id", userId)
    .eq("child_id", childId)
    .order("night_date", { ascending: false })
    .limit(limit);
  if (error) return c.json({ error: error.message }, 500);

  return c.json({
    data: (data ?? []).map((r: { child_id: string; night_date: string; bucket: string; source: string }) => ({
      childId: r.child_id,
      nightDate: r.night_date,
      bucket: r.bucket,
      source: r.source,
    })),
  });
}

app.post("/make-server-76b0ba9a/sleep/log", postSleepLog);
app.post("/sleep/log", postSleepLog);
app.get("/make-server-76b0ba9a/sleep/list", getSleepList);
app.get("/sleep/list", getSleepList);

// ─── Remote config (feature flags, no secrets) ───────────────────────────────
async function getRemoteConfig(c: Context) {
  const rateLimit = await enforceRateLimit(c, "remote-config", 120, 300);
  if (rateLimit) return rateLimit;
  const defaults: Record<string, boolean> = {
    payments_remote_kill: false,
    ai_counselor_paused: false,
  };
  let fromEnv: Record<string, boolean> = {};
  try {
    const raw = Deno.env.get("REMOTE_CONFIG_JSON")?.trim();
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "boolean") fromEnv[k] = v;
      }
    }
  } catch (e) {
    console.log("REMOTE_CONFIG_JSON parse error:", e);
  }
  let fromKv: Record<string, boolean> | null = null;
  try {
    const rawKv = await kv.get("remote_config:flags") as Record<string, boolean> | null;
    if (rawKv && typeof rawKv === "object") fromKv = rawKv;
  } catch (e) {
    console.log("remote_config:flags kv error:", e);
  }
  const flags = { ...defaults, ...fromEnv, ...(fromKv ?? {}) };
  return c.json({ ok: true, flags, updatedAt: new Date().toISOString() });
}

app.get("/make-server-76b0ba9a/remote-config", getRemoteConfig);
app.get("/remote-config", getRemoteConfig);

// ─── Razorpay Payment ──────────────────────────────────────────────────────────
const RAZORPAY_ID_RE = /^[A-Za-z0-9_]{1,64}$/;
const RAZORPAY_SIG_RE = /^[a-f0-9]{64}$/;

async function postRazorpayCreateOrder(c: Context) {
  try {
    const auth = await requireUser(c);
    if (auth instanceof Response) return auth;
    const { userId } = auth;

    const rateLimit = await enforceRateLimit(c, "razorpay-create-order", 10, 600, userId);
    if (rateLimit) return rateLimit;

    const bodyRaw = await c.req.json().catch(() => null);
    const amount = bodyRaw ? clampNumber((bodyRaw as { amount?: unknown }).amount, 1, 1_000_000) : null;
    if (amount === null) return c.json({ error: "invalid_amount" }, 400);

    const keyId     = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      console.error("razorpay: keys not configured");
      return c.json({ error: "payments_unavailable" }, 503);
    }
    const basic = btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Authorization": `Basic ${basic}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: "INR", receipt: `ns_${Date.now()}` }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("razorpay create order non-OK:", res.status, errText);
      return c.json({ error: "create_order_failed" }, 502);
    }
    const order = await res.json();
    return c.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (e) {
    console.error("razorpay create-order error:", e);
    return c.json({ error: "create_order_failed" }, 500);
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function postRazorpayVerifyPayment(c: Context) {
  try {
    const auth = await requireUser(c);
    if (auth instanceof Response) return auth;
    const { userId } = auth;

    const rateLimit = await enforceRateLimit(c, "razorpay-verify-payment", 20, 600, userId);
    if (rateLimit) return rateLimit;

    const bodyRaw = await c.req.json().catch(() => null);
    if (!bodyRaw || typeof bodyRaw !== "object") {
      return c.json({ error: "invalid_payload" }, 400);
    }
    const body = bodyRaw as Record<string, unknown>;
    const razorpay_order_id = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const razorpay_payment_id = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const razorpay_signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

    if (!RAZORPAY_ID_RE.test(razorpay_order_id) ||
        !RAZORPAY_ID_RE.test(razorpay_payment_id) ||
        !RAZORPAY_SIG_RE.test(razorpay_signature)) {
      return c.json({ error: "invalid_payload" }, 400);
    }

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      console.error("razorpay: secret not configured");
      return c.json({ error: "payments_unavailable" }, 503);
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(keySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const hexSig = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");

    if (!timingSafeEqualHex(hexSig, razorpay_signature)) {
      console.warn(`razorpay signature mismatch for user ${userId.slice(0, 8)}…`);
      return c.json({ error: "signature_verification_failed" }, 400);
    }
    await kv.set(`payment:${razorpay_payment_id}`, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      userId,
      ts: Date.now(),
    });
    return c.json({ success: true, paymentId: razorpay_payment_id });
  } catch (e) {
    console.error("razorpay verify-payment error:", e);
    return c.json({ error: "verify_failed" }, 500);
  }
}

app.post("/make-server-76b0ba9a/razorpay/create-order", postRazorpayCreateOrder);
app.post("/razorpay/create-order", postRazorpayCreateOrder);
app.post("/make-server-76b0ba9a/razorpay/verify-payment", postRazorpayVerifyPayment);
app.post("/razorpay/verify-payment", postRazorpayVerifyPayment);

// ═══════════════════════════════════════════════════════════════════════════
// POST /narrative/generate — AI progress narrative
// ═══════════════════════════════════════════════════════════════════════════
async function postNarrativeGenerate(c: Context) {
  try {
    const auth = await requireUser(c);
    if (auth instanceof Response) return auth;
    const { userId } = auth;

    const rateLimit = await enforceRateLimit(c, "narrative-generate", 10, 3600, userId);
    if (rateLimit) return rateLimit;

    const bodyRaw = await c.req.json().catch(() => null);
    if (!bodyRaw || typeof bodyRaw !== "object") {
      return c.json({ error: "invalid_payload" }, 400);
    }
    const body = bodyRaw as Record<string, unknown>;

    const childName = truncateString(body.childName, 32).trim();
    const weekStart = truncateString(body.weekStart, 32);
    if (!childName || !weekStart) return c.json({ error: "missing_fields" }, 400);

    const childAge = clampNumber(body.childAge, 0, 18) ?? 0;
    const ageTier = clampNumber(body.ageTier, 1, 6) ?? 1;
    const activityCount = clampNumber(body.activityCount, 0, 10_000) ?? 0;
    const bpEarned = clampNumber(body.bpEarned, 0, 1_000_000) ?? 0;
    const streak = clampNumber(body.streak, 0, 10_000) ?? 0;

    const regionDeltas = Array.isArray(body.regionDeltas)
      ? (body.regionDeltas as unknown[])
          .slice(0, 20)
          .map((r): { name: string; before: number; after: number; trend: string } | null => {
            if (!r || typeof r !== "object") return null;
            const item = r as Record<string, unknown>;
            return {
              name: truncateString(item.name, 48),
              before: clampNumber(item.before, -1e6, 1e6) ?? 0,
              after: clampNumber(item.after, -1e6, 1e6) ?? 0,
              trend: truncateString(item.trend, 16),
            };
          })
          .filter((x): x is { name: string; before: number; after: number; trend: string } => !!x)
      : [];
    const milestonesChecked = Array.isArray(body.milestonesChecked)
      ? (body.milestonesChecked as unknown[])
          .slice(0, 32)
          .map((m) => truncateString(m, 80))
          .filter((m) => !!m)
      : [];

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return c.json({
        narrative: `${childName} had a wonderful week with ${activityCount} activities completed. ` +
          `They earned ${bpEarned} brain points and are on a ${streak}-day streak. Keep up the great work!`,
        generatedAt: new Date().toISOString(),
        model: "fallback",
        cached: false,
      });
    }

    const deltaText = regionDeltas
      .map((r) => `${r.name}: ${r.before} → ${r.after} (${r.trend})`)
      .join("\n");

    const prompt = truncateString(
      `You are a warm, insightful early childhood development educator writing a weekly progress note.

Child: ${childName}, age ${childAge} (tier ${ageTier})
This week: ${activityCount} activities completed, ${bpEarned} brain points earned.
Streak: ${streak} days.

Score changes:\n${deltaText}

Milestones: ${milestonesChecked.join(", ") || "none this week"}

Write exactly:
1. A warm opening paragraph (2-3 sentences)
2. A specific insight about their strongest growth area (3-4 sentences)
3. Forward-looking suggestions for next week (2-3 sentences)

Tone: warm, specific, encouraging but honest. Use ${childName} naturally. Max 200 words.`,
      2048,
    );

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 400 }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("narrative generate: OpenAI non-OK:", res.status, errText);
      return c.json({ error: "narrative_unavailable" }, 502);
    }
    const data = await res.json();
    const narrative = data.choices?.[0]?.message?.content?.trim() ?? "Unable to generate narrative.";
    return c.json({ narrative, generatedAt: new Date().toISOString(), model: "gpt-4o-mini", cached: false });
  } catch (e) {
    console.error("narrative generate error:", e);
    return c.json({ error: "narrative_failed" }, 500);
  }
}

app.post("/make-server-76b0ba9a/narrative/generate", postNarrativeGenerate);
app.post("/narrative/generate", postNarrativeGenerate);

// ═══════════════════════════════════════════════════════════════════════════
// POST /ml/aggregate — Federated ML weight aggregation
// ═══════════════════════════════════════════════════════════════════════════
const MAX_ML_WEIGHT_KEYS = 64;
const MAX_ML_SAMPLE_COUNT = 5000;
const ML_WEIGHT_KEY_RE = /^[a-zA-Z0-9_-]{1,32}$/;

async function postMLAggregate(c: Context) {
  try {
    const auth = await requireUser(c);
    if (auth instanceof Response) return auth;
    const { userId } = auth;

    const rateLimit = await enforceRateLimit(c, "ml-aggregate", 10, 600, userId);
    if (rateLimit) return rateLimit;

    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ error: "invalid_payload" }, 400);
    }
    const regionWeightsRaw = (body as { regionWeights?: unknown }).regionWeights;
    const sampleCountRaw = (body as { sampleCount?: unknown }).sampleCount;

    const sampleCount = clampNumber(sampleCountRaw, 0, MAX_ML_SAMPLE_COUNT);
    if (sampleCount === null || !regionWeightsRaw || typeof regionWeightsRaw !== "object") {
      return c.json({ error: "invalid_payload" }, 400);
    }

    const sanitized: Record<string, number> = {};
    const entries = Object.entries(regionWeightsRaw as Record<string, unknown>).slice(0, MAX_ML_WEIGHT_KEYS);
    for (const [key, value] of entries) {
      if (!ML_WEIGHT_KEY_RE.test(key)) continue;
      const clamped = clampNumber(value, -10, 10);
      if (clamped === null) continue;
      sanitized[key] = clamped;
    }

    const globalKey = "ml:global_weights";
    const existing = (await kv.get(globalKey)) as { weights: Record<string, number>; totalSamples: number } | null;
    const prevWeights = existing?.weights ?? {};
    const prevSamples = existing?.totalSamples ?? 0;
    const totalSamples = prevSamples + sampleCount;

    const merged: Record<string, number> = {};
    const allKeys = new Set([...Object.keys(prevWeights), ...Object.keys(sanitized)]);
    for (const key of allKeys) {
      const prev = prevWeights[key] ?? 0.5;
      const incoming = sanitized[key] ?? 0.5;
      merged[key] = prevSamples > 0 && totalSamples > 0
        ? (prev * prevSamples + incoming * sampleCount) / totalSamples
        : incoming;
    }

    await kv.set(globalKey, { weights: merged, totalSamples });
    return c.json({ globalWeights: merged, totalSamples });
  } catch (e) {
    console.error("ml aggregate error:", e);
    return c.json({ error: "aggregate_failed" }, 500);
  }
}

app.post("/make-server-76b0ba9a/ml/aggregate", postMLAggregate);
app.post("/ml/aggregate", postMLAggregate);

// ═══════════════════════════════════════════════════════════════════════════
// POST /report/email — Email weekly report
// ═══════════════════════════════════════════════════════════════════════════
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function postReportEmail(c: Context) {
  try {
    const auth = await requireUser(c);
    if (auth instanceof Response) return auth;
    const { userId } = auth;

    const rateLimit = await enforceRateLimit(c, "report-email", 5, 3600, userId);
    if (rateLimit) return rateLimit;

    const bodyRaw = await c.req.json().catch(() => null);
    if (!bodyRaw || typeof bodyRaw !== "object") {
      return c.json({ error: "invalid_payload" }, 400);
    }
    const body = bodyRaw as Record<string, unknown>;
    const recipientEmail = truncateString(body.recipientEmail, 254).trim();
    const childName = truncateString(body.childName, 32).trim();
    const senderName = truncateString(body.senderName, 64).trim();
    const weekLabel = truncateString(body.weekLabel, 64).trim();

    if (!EMAIL_RE.test(recipientEmail) || !childName) {
      return c.json({ error: "invalid_email" }, 400);
    }

    console.log(`[report/email] queued for user ${userId.slice(0, 8)}…, child ${childName}, week ${weekLabel}, sender ${senderName || "n/a"}`);
    return c.json({ sent: true, messageId: `msg_${Date.now()}` });
  } catch (e) {
    console.error("report email error:", e);
    return c.json({ error: "report_failed" }, 500);
  }
}

app.post("/make-server-76b0ba9a/report/email", postReportEmail);
app.post("/report/email", postReportEmail);

// ═══════════════════════════════════════════════════════════════════════════
// POST /voice/turn — SSE-streamed voice conversation turn
// ───────────────────────────────────────────────────────────────────────────
// The web/native client posts a single user utterance + minimal context;
// we stream the assistant reply token-by-token via SSE so the client TTS
// can start speaking before generation finishes (latency ~600ms vs 3s).
//
// Privacy: we never persist the utterance unless the user has retainTranscripts
// turned on (signalled by `retain: true` in the payload).
// ═══════════════════════════════════════════════════════════════════════════
const VOICE_AGENT_PROMPTS: Record<string, string> = {
  coach:
    "You are a calm, practical parenting coach for a child-development app. Reply in 1-3 sentences. Never claim certainty about a child's future. End with a single concrete next step.",
  counselor:
    "You are an empathic counselor for parents. Reflect their feeling first, then offer one gentle reframing. Reply in 2-4 sentences. Never give medical or psychiatric advice.",
  narrator:
    "You are a hands-free activity narrator. Read the next instruction aloud in plain language a 4-year-old can follow. Keep each turn under 20 words.",
};

async function postVoiceTurn(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "voice-turn", 60, 60, userId);
  if (rateLimit) return rateLimit;

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "invalid_payload" }, 400);

  const utterance = truncateString((body as Record<string, unknown>).utterance, 500).trim();
  const agent = String((body as Record<string, unknown>).agent ?? "coach");
  const locale = truncateString((body as Record<string, unknown>).locale, 8) || "en";
  const systemPrompt = VOICE_AGENT_PROMPTS[agent] ?? VOICE_AGENT_PROMPTS.coach;
  if (!utterance) return c.json({ error: "empty_utterance" }, 400);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return c.json({ error: "voice_unavailable" }, 503);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            stream: true,
            messages: [
              { role: "system", content: `${systemPrompt}\nReply in ${locale}.` },
              { role: "user", content: utterance },
            ],
          }),
        });
        if (!resp.ok || !resp.body) {
          send("error", { message: "upstream_error" });
          controller.close();
          return;
        }

        const reader = resp.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let assembled = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const p of parts) {
            const line = p.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
              };
              const tok = json.choices?.[0]?.delta?.content ?? "";
              if (tok) {
                assembled += tok;
                send("token", { t: tok });
              }
            } catch {
              /* skip malformed line */
            }
          }
        }
        send("done", { text: assembled });
        controller.close();
      } catch (e) {
        console.error("voice/turn stream error:", e);
        send("error", { message: "stream_failed" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

app.post("/make-server-76b0ba9a/voice/turn", postVoiceTurn);
app.post("/voice/turn", postVoiceTurn);

// ═══════════════════════════════════════════════════════════════════════════
// POST/GET /sync/state — Per-user JSON state blob with optimistic versioning
// ───────────────────────────────────────────────────────────────────────────
// We deliberately do not interpret the blob — the client is the source of
// truth on schema. Conflict signal is best-effort: if the version supplied
// is stale, we still write the new value but flag conflict=true so the
// client can prompt the user.
//
// Storage: Postgres `public.user_sync_state` (00009_sync_state.sql) is the
// primary store. Edge KV is consulted as a one-time fallback so devices that
// last synced under the KV-only path don't lose their blob; on the first
// successful Postgres write we leave the KV row in place (cheap, not on the
// hot path) and rely on natural eviction. The wire contract — `{version,
// conflict}` for writes and `{version, state}` for reads — is unchanged so
// `cloudSync.ts` + its tests keep passing.
// ═══════════════════════════════════════════════════════════════════════════
const MAX_SYNC_BYTES = 512 * 1024;

type SyncRow = { version: number; state: unknown; device_id: string | null; updated_at: string };

async function readSyncFromPostgres(userId: string): Promise<SyncRow | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return null;
  try {
    const sb = createClient(url, serviceKey);
    const { data, error } = await sb
      .from("user_sync_state")
      .select("version, state, device_id, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as SyncRow;
  } catch {
    return null;
  }
}

async function writeSyncToPostgres(
  userId: string,
  version: number,
  state: unknown,
  deviceId: string | null,
): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return false;
  try {
    const sb = createClient(url, serviceKey);
    const { error } = await sb
      .from("user_sync_state")
      .upsert({
        user_id: userId,
        state,
        version,
        device_id: deviceId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    return !error;
  } catch {
    return false;
  }
}

async function postSyncState(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "sync-push", 60, 60, userId);
  if (rateLimit) return rateLimit;

  const raw = await c.req.text();
  if (!raw || raw.length > MAX_SYNC_BYTES) {
    return c.json({ error: "payload_too_large" }, 413);
  }
  const body = (() => {
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
  })();
  if (!body || typeof body !== "object") return c.json({ error: "invalid_payload" }, 400);

  // Resolve "previous version" from Postgres first, then KV (legacy).
  const pgPrev = await readSyncFromPostgres(userId);
  const key = `sync:state:${userId}`;
  const kvPrev = pgPrev ? null : ((await kv.get(key)) as { version?: number } | null);
  const prevVersion = pgPrev?.version ?? kvPrev?.version ?? 0;
  const newVersion = prevVersion + 1;

  const clientVersion = typeof (body as { clientVersion?: unknown }).clientVersion === "number"
    ? ((body as { clientVersion: number }).clientVersion)
    : null;
  const conflict = clientVersion != null && clientVersion < prevVersion;

  const state = (body as { state?: unknown }).state ?? null;
  const deviceId = truncateString((body as { deviceId?: unknown }).deviceId, 64) ?? null;

  const pgOk = await writeSyncToPostgres(userId, newVersion, state, deviceId);
  if (!pgOk) {
    // Postgres unreachable / mis-configured — fall back to KV so the client
    // still gets a durable write. Keeps single-region availability.
    await kv.set(key, {
      version: newVersion,
      state,
      deviceId,
      updatedAt: new Date().toISOString(),
    });
  }

  return c.json({ version: newVersion, conflict });
}

async function getSyncState(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "sync-pull", 60, 60, userId);
  if (rateLimit) return rateLimit;

  const pg = await readSyncFromPostgres(userId);
  if (pg) return c.json({ version: pg.version, state: pg.state });

  // Lazy migration: Postgres empty → consult KV, hydrate Postgres if found.
  const key = `sync:state:${userId}`;
  const stored = (await kv.get(key)) as { version?: number; state?: unknown; deviceId?: string | null } | null;
  if (!stored) return c.json({ version: 0, state: null });

  const version = stored.version ?? 0;
  if (version > 0) {
    // Best-effort backfill — if it fails we still return the KV value so the
    // client never sees a regression.
    void writeSyncToPostgres(userId, version, stored.state ?? null, stored.deviceId ?? null);
  }
  return c.json({ version, state: stored.state ?? null });
}

app.post("/make-server-76b0ba9a/sync/state", postSyncState);
app.post("/sync/state", postSyncState);
app.get("/make-server-76b0ba9a/sync/state", getSyncState);
app.get("/sync/state", getSyncState);

// ═══════════════════════════════════════════════════════════════════════════
// Caregivers — invite + accept (FUTURE_ROADMAP.md §0.6)
// ───────────────────────────────────────────────────────────────────────────
// • POST /caregivers/invite  { childId, scope, email? } → { token }
// • POST /caregivers/accept  { token }                   → { ok, childId, scope }
//
// Tokens are random 32-char strings stored in kv with a 7-day TTL.
// Scope is one of: "view", "log_only", "co_parent".
// ═══════════════════════════════════════════════════════════════════════════
const ALLOWED_SCOPES = new Set(["view", "log_only", "co_parent"]);

async function postCaregiverInvite(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "caregiver-invite", 10, 3600, userId);
  if (rateLimit) return rateLimit;

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "invalid_payload" }, 400);
  const childId = truncateString((body as Record<string, unknown>).childId, 64);
  const scope = String((body as Record<string, unknown>).scope ?? "view");
  if (!childId) return c.json({ error: "invalid_child_id" }, 400);
  if (!ALLOWED_SCOPES.has(scope)) return c.json({ error: "invalid_scope" }, 400);

  const token = crypto.randomUUID().replace(/-/g, "");
  const inviteKey = `caregiver:invite:${token}`;
  await kv.set(inviteKey, {
    inviterUserId: userId,
    childId,
    scope,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  return c.json({ token, expiresInDays: 7 });
}

async function postCaregiverAccept(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "caregiver-accept", 30, 3600, userId);
  if (rateLimit) return rateLimit;

  const body = await c.req.json().catch(() => null);
  const token = truncateString((body as Record<string, unknown> | null)?.token, 64);
  if (!token) return c.json({ error: "invalid_token" }, 400);

  const inviteKey = `caregiver:invite:${token}`;
  const invite = (await kv.get(inviteKey)) as
    | { inviterUserId: string; childId: string; scope: string; expiresAt: string }
    | null;
  if (!invite) return c.json({ error: "invalid_token" }, 404);
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return c.json({ error: "invite_expired" }, 410);
  }
  if (invite.inviterUserId === userId) {
    return c.json({ error: "cannot_accept_own_invite" }, 400);
  }

  const linkKey = `caregiver:link:${invite.inviterUserId}:${invite.childId}:${userId}`;
  await kv.set(linkKey, {
    childId: invite.childId,
    scope: invite.scope,
    acceptedAt: new Date().toISOString(),
  });
  await kv.set(inviteKey, { ...invite, acceptedBy: userId, acceptedAt: new Date().toISOString() });

  return c.json({ ok: true, childId: invite.childId, scope: invite.scope });
}

app.post("/make-server-76b0ba9a/caregivers/invite", postCaregiverInvite);
app.post("/caregivers/invite", postCaregiverInvite);
app.post("/make-server-76b0ba9a/caregivers/accept", postCaregiverAccept);
app.post("/caregivers/accept", postCaregiverAccept);

// ═══════════════════════════════════════════════════════════════════════════
// GET /billing/entitlement — single source of truth for premium state
// ───────────────────────────────────────────────────────────────────────────
// Reads the user's current entitlement (if any) from kv. Mobile clients
// will call this on launch + after restorePurchases. The Razorpay verify
// handler already persists the entitlement when a payment succeeds.
// ═══════════════════════════════════════════════════════════════════════════
async function getBillingEntitlement(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rateLimit = await enforceRateLimit(c, "entitlement", 60, 60, userId);
  if (rateLimit) return rateLimit;

  const key = `billing:entitlement:${userId}`;
  const stored = (await kv.get(key)) as
    | { plan?: string; expiresAt?: string; source?: string }
    | null;
  const isActive = stored?.expiresAt ? new Date(stored.expiresAt).getTime() > Date.now() : false;

  return c.json({
    isActive,
    plan: stored?.plan ?? null,
    expiresAt: stored?.expiresAt ?? null,
    source: stored?.source ?? null,
  });
}

app.get("/make-server-76b0ba9a/billing/entitlement", getBillingEntitlement);
app.get("/billing/entitlement", getBillingEntitlement);

registerAdminRoutes(app);

// ═══════════════════════════════════════════════════════════════════════════
// Open AI-Age Standard — public, unauthenticated, rate-limited.
// Survivor 5 of the 2026-04-17 ideation: anyone can score against the spec.
// Lives at /standard/score and /standard/spec. CORS is wide-open for these
// two endpoints because the entire point is that third parties can hit them.
// ═══════════════════════════════════════════════════════════════════════════
const AI_AGE_SPEC_VERSION = "1.0.0";

type StandardScoreInput = {
  ageMonths: number;
  durationSec: number;
  modality: "voice" | "screen" | "tactile" | "audio-only" | "outdoor" | "mixed";
  observed?: string[];
  explicitCompetencies?: string[];
  transcript?: Array<{ from: "child" | "adult" | "ai"; text: string }>;
  product?: string;
};

const STANDARD_AGE_RANGES: Record<string, [number, number]> = {
  "executive-function": [36, 84],
  "metacognitive-self-direction": [48, 144],
  "long-horizon-agency": [60, 144],
  "embodied-mastery": [12, 144],
  "deep-knowledge-retrieval": [36, 144],
  "guided-curiosity": [24, 144],
  "ai-literacy-cocreation": [60, 144],
  "lateral-source-evaluation": [84, 144],
  "creative-generation": [24, 144],
  "social-attunement": [36, 144],
  "emotional-resilience": [12, 144],
  "ethical-judgment": [36, 144],
};

const STANDARD_OBS_MAP: Record<string, string> = {
  "self-correction": "executive-function",
  "delayed-gratification": "executive-function",
  "rule-switching": "executive-function",
  "holding-multi-step-instructions": "executive-function",
  "tower-building-with-target": "executive-function",
  "wait-your-turn": "executive-function",
  "asks-how-do-you-know": "metacognitive-self-direction",
  "says-i-dont-know": "metacognitive-self-direction",
  "rechecks-own-work": "metacognitive-self-direction",
  "verbalises-strategy": "metacognitive-self-direction",
  "predicts-confidence": "metacognitive-self-direction",
  "returns-to-multi-day-project": "long-horizon-agency",
  "sub-goal-setting": "long-horizon-agency",
  "asks-for-resources": "long-horizon-agency",
  "reviews-yesterdays-work": "long-horizon-agency",
  "fine-motor-precision": "embodied-mastery",
  "gross-motor-coordination": "embodied-mastery",
  "rhythm-keeping": "embodied-mastery",
  "balance": "embodied-mastery",
  "instrument-play": "embodied-mastery",
  "spontaneous-recall": "deep-knowledge-retrieval",
  "transfers-knowledge-across-contexts": "deep-knowledge-retrieval",
  "retrieves-without-prompt": "deep-knowledge-retrieval",
  "open-ended-questions": "guided-curiosity",
  "follow-up-questions": "guided-curiosity",
  "what-if-questions": "guided-curiosity",
  "asks-about-source": "guided-curiosity",
  "iterates-prompts": "ai-literacy-cocreation",
  "evaluates-output": "ai-literacy-cocreation",
  "rejects-bad-output": "ai-literacy-cocreation",
  "asks-ai-to-explain": "ai-literacy-cocreation",
  "uses-ai-then-checks": "ai-literacy-cocreation",
  "checks-second-source": "lateral-source-evaluation",
  "asks-who-said-this": "lateral-source-evaluation",
  "distinguishes-opinion-from-fact": "lateral-source-evaluation",
  "originates-novel-output": "creative-generation",
  "combines-unrelated-ideas": "creative-generation",
  "iterates-on-own-work": "creative-generation",
  "expresses-taste": "creative-generation",
  "predicts-others-feelings": "social-attunement",
  "false-belief-understanding": "social-attunement",
  "perspective-taking": "social-attunement",
  "repair-after-conflict": "social-attunement",
  "recovers-from-setback": "emotional-resilience",
  "names-feelings": "emotional-resilience",
  "self-soothes": "emotional-resilience",
  "tries-again-after-fail": "emotional-resilience",
  "co-regulates-with-adult": "emotional-resilience",
  "calls-out-unfair": "ethical-judgment",
  "explains-why-not-fair": "ethical-judgment",
  "resists-manipulation": "ethical-judgment",
  "considers-consequences": "ethical-judgment",
};

function standardModalityMul(competencyId: string, modality: StandardScoreInput["modality"]): number {
  if (competencyId === "embodied-mastery") {
    if (modality === "tactile" || modality === "outdoor") return 1.3;
    if (modality === "screen") return 0.6;
  }
  if (competencyId === "ai-literacy-cocreation") {
    if (modality === "screen" || modality === "voice") return 1.2;
    if (modality === "audio-only") return 1.1;
  }
  if (competencyId === "social-attunement" || competencyId === "emotional-resilience") {
    if (modality === "voice" || modality === "outdoor" || modality === "tactile") return 1.2;
  }
  if (competencyId === "deep-knowledge-retrieval") {
    if (modality === "audio-only" || modality === "voice") return 1.1;
  }
  return 1.0;
}

function standardAgeBoost(competencyId: string, ageMonths: number): number {
  const range = STANDARD_AGE_RANGES[competencyId];
  if (!range) return 0;
  return ageMonths >= range[0] && ageMonths <= range[1] ? 1.0 : 0.4;
}

async function postStandardScore(c: Context) {
  // Public endpoint — rate-limit by IP, NOT user.
  const rateLimit = await enforceRateLimit(c, "standard-score", 60, 60);
  if (rateLimit) return rateLimit;

  let body: StandardScoreInput;
  try { body = (await c.req.json()) as StandardScoreInput; }
  catch { return c.json({ error: "invalid_json" }, 400); }

  const ageMonths = clampNumber(body.ageMonths, 0, 240);
  const durationSec = clampNumber(body.durationSec, 0, 36_000);
  if (ageMonths === null || durationSec === null) return c.json({ error: "invalid_input" }, 400);
  const modality = ["voice", "screen", "tactile", "audio-only", "outdoor", "mixed"].includes(body.modality)
    ? body.modality
    : "mixed";

  const observed = Array.isArray(body.observed)
    ? body.observed.filter((b): b is string => typeof b === "string").slice(0, 50)
    : [];
  const explicit = Array.isArray(body.explicitCompetencies)
    ? body.explicitCompetencies.filter((b): b is string => typeof b === "string").slice(0, 12)
    : [];

  const competencies = Object.keys(STANDARD_AGE_RANGES);
  const delta: Record<string, number> = {};
  for (const c of competencies) delta[c] = 0;
  for (const b of observed) {
    const id = STANDARD_OBS_MAP[b];
    if (id) delta[id] += 1.5;
  }
  for (const id of explicit) if (id in delta) delta[id] += 1.0;

  // Light transcript scoring — same rules as packages/neurospark-ai-age/score.ts
  if (Array.isArray(body.transcript)) {
    const txt = body.transcript
      .filter((t) => t && typeof t.text === "string")
      .map((t) => truncateString(t.text, 500).toLowerCase())
      .join(" ");
    if (/how do you know|how do we know|why do you think/.test(txt)) {
      delta["metacognitive-self-direction"] += 1;
      delta["guided-curiosity"] += 0.5;
    }
    if (/i don'?t know|let me check|let me try|i'?m not sure/.test(txt)) {
      delta["metacognitive-self-direction"] += 0.7;
    }
    if (/what if|i wonder|what do you think happens/.test(txt)) {
      delta["guided-curiosity"] += 1;
      delta["creative-generation"] += 0.4;
    }
    if (/feel|feeling|sad|happy|angry|frustrated|calm down|deep breath/.test(txt)) {
      delta["emotional-resilience"] += 1;
      delta["social-attunement"] += 0.4;
    }
    if (/fair|unfair|that'?s not right|share/.test(txt)) {
      delta["ethical-judgment"] += 1;
      delta["social-attunement"] += 0.3;
    }
  }

  const dFactor = durationSec <= 0 ? 0 : Math.min(1.0, Math.sqrt(durationSec / 600));
  for (const cId of competencies) {
    delta[cId] *= dFactor * standardModalityMul(cId, modality) * standardAgeBoost(cId, ageMonths);
    delta[cId] = Math.round(delta[cId] * 100) / 100;
  }

  // Audit (so we can compute aggregate "this product scores X on average")
  const product = typeof body.product === "string" ? truncateString(body.product, 80) : null;
  if (product) {
    const auditKey = `standard:audit:${product}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    await kv.set(auditKey, { product, delta, ageMonths, modality, durationSec, ts: Date.now() }).catch(() => {});
  }

  return c.json({ specVersion: AI_AGE_SPEC_VERSION, delta });
}

async function getStandardSpec(c: Context) {
  c.header("cache-control", "public, max-age=3600");
  return c.json({
    specVersion: AI_AGE_SPEC_VERSION,
    repo: "https://github.com/neurospark/neurospark-ai-age",
    license: "MIT",
    competencies: Object.keys(STANDARD_AGE_RANGES),
  });
}

async function getStandardVerify(c: Context) {
  const product = c.req.param("product");
  if (!product || product.length > 80) return c.json({ error: "invalid_product" }, 400);
  // Aggregate the last 200 audit entries for this product. Best-effort, public.
  const entries = (await kv.getByPrefix(`standard:audit:${product}:`)) as Array<{
    delta: Record<string, number>;
    ts: number;
  }> | null;
  const list = (entries ?? []).slice(-200);
  if (!list.length) {
    return c.json({ product, status: "self-attested", reportCount: 0, average: null, specVersion: AI_AGE_SPEC_VERSION });
  }
  const sum: Record<string, number> = {};
  for (const e of list) {
    for (const [k, v] of Object.entries(e.delta)) sum[k] = (sum[k] ?? 0) + (v as number);
  }
  const avg: Record<string, number> = {};
  for (const [k, v] of Object.entries(sum)) avg[k] = Math.round((v / list.length) * 100) / 100;
  return c.json({
    product,
    status: list.length >= 50 ? "audited" : "self-attested",
    reportCount: list.length,
    average: avg,
    specVersion: AI_AGE_SPEC_VERSION,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Coverage-as-a-Protocol — Survivor 7.
// Public, HMAC-signed credit endpoint that any third-party experience
// (Roblox plugin, daycare portal, sibling co-play, school iPad app) can call
// to grant a child brain-region + AI-age-competency coverage credit.
// Auth model: per-partner HMAC-SHA256 over the request body.
// ═══════════════════════════════════════════════════════════════════════════

type CoverageCreditBody = {
  partnerSlug: string;
  anonToken: string;
  partnerEventId: string;
  durationSeconds: number;
  brainRegion?: string;
  competencyIds?: string[];
  modality: string;
  occurredAt?: string;
};

const VALID_MODALITIES = new Set(["voice", "screen", "tactile", "audio-only", "outdoor", "mixed"]);

async function hmacSha256Hex(secret: Uint8Array, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function postCoverageCredit(c: Context) {
  // Per-IP rate limit prevents bulk fraud even before HMAC check.
  const rateLimit = await enforceRateLimit(c, "coverage-credit-ip", 120, 60);
  if (rateLimit) return rateLimit;

  const sigHeader = c.req.header("x-neurospark-signature") ?? "";
  const tsHeader = c.req.header("x-neurospark-timestamp") ?? "";
  const tsMs = Number(tsHeader);
  if (!sigHeader || !Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60_000) {
    return c.json({ error: "invalid_signature_envelope" }, 401);
  }

  const rawBody = await c.req.text();
  let body: CoverageCreditBody;
  try { body = JSON.parse(rawBody) as CoverageCreditBody; }
  catch { return c.json({ error: "invalid_json" }, 400); }

  if (
    typeof body.partnerSlug !== "string" || !body.partnerSlug ||
    typeof body.anonToken !== "string" || !body.anonToken ||
    typeof body.partnerEventId !== "string" || !body.partnerEventId ||
    typeof body.durationSeconds !== "number" ||
    typeof body.modality !== "string" || !VALID_MODALITIES.has(body.modality) ||
    !(body.durationSeconds >= 1 && body.durationSeconds <= 7200)
  ) {
    return c.json({ error: "invalid_payload" }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);

  const partnerRes = await sb
    .from("coverage_partners")
    .select("id, signing_secret, daily_minutes_cap_per_child, rpm_limit, disabled_at")
    .eq("slug", body.partnerSlug)
    .maybeSingle();
  if (partnerRes.error || !partnerRes.data) return c.json({ error: "unknown_partner" }, 404);
  const partner = partnerRes.data as {
    id: string;
    signing_secret: string;
    daily_minutes_cap_per_child: number;
    rpm_limit: number;
    disabled_at: string | null;
  };
  if (partner.disabled_at) return c.json({ error: "partner_disabled" }, 403);

  // signing_secret arrives as `\x...` hex (Postgres bytea via PostgREST).
  // We accept either hex (`\x...`) or raw utf8 (legacy/manual rotations).
  const secretBytes = partner.signing_secret.startsWith("\\x")
    ? Uint8Array.from((partner.signing_secret.slice(2).match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16)))
    : new TextEncoder().encode(partner.signing_secret);

  const expected = await hmacSha256Hex(secretBytes, `${tsHeader}.${rawBody}`);
  if (!timingSafeEqualHex(expected, sigHeader.toLowerCase())) {
    return c.json({ error: "bad_signature" }, 401);
  }

  // Per-partner RPM rate-limit
  const rateLimit2 = await enforceRateLimit(c, `coverage-partner:${partner.id}`, partner.rpm_limit, 60, partner.id);
  if (rateLimit2) return rateLimit2;

  // Resolve anon token → child_id
  const anonRes = await sb
    .from("coverage_anon_links")
    .select("child_id, user_id")
    .eq("partner_id", partner.id)
    .eq("anon_token", body.anonToken)
    .maybeSingle();
  if (anonRes.error || !anonRes.data) return c.json({ error: "unknown_anon_token" }, 404);
  const anon = anonRes.data as { child_id: string; user_id: string };

  // Daily cap enforcement
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const todayRes = await sb
    .from("coverage_credits")
    .select("duration_seconds")
    .eq("partner_id", partner.id)
    .eq("child_id", anon.child_id)
    .gte("signed_at", since);
  const usedSeconds = (todayRes.data ?? []).reduce((s, r: { duration_seconds: number }) => s + r.duration_seconds, 0);
  if (usedSeconds + body.durationSeconds > partner.daily_minutes_cap_per_child * 60) {
    return c.json({ error: "daily_cap_exceeded", usedSeconds, capSeconds: partner.daily_minutes_cap_per_child * 60 }, 429);
  }

  // Insert (unique partner_id+partner_event_id makes it idempotent)
  const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip") ?? null;
  const insertRes = await sb
    .from("coverage_credits")
    .insert({
      partner_id: partner.id,
      child_id: anon.child_id,
      partner_event_id: body.partnerEventId,
      duration_seconds: body.durationSeconds,
      brain_region: body.brainRegion ?? null,
      competency_ids: Array.isArray(body.competencyIds) ? body.competencyIds.slice(0, 12) : [],
      modality: body.modality,
      ip,
    })
    .select("id, signed_at")
    .maybeSingle();
  if (insertRes.error) {
    // Likely the unique-violation idempotency case — return 200 with existing.
    if (String(insertRes.error.code) === "23505") {
      return c.json({ status: "duplicate" });
    }
    console.error("coverage_credit insert failed", insertRes.error);
    return c.json({ error: "insert_failed" }, 500);
  }

  return c.json({
    status: "credited",
    creditId: insertRes.data?.id,
    signedAt: insertRes.data?.signed_at,
  });
}

app.post("/make-server-76b0ba9a/coverage/credit", postCoverageCredit);
app.post("/coverage/credit", postCoverageCredit);

/** Survivor 7 — parent-side view of today's external coverage. We RLS through
 * the user's own anon-link mappings, so parents only see the credits issued
 * for children they own. Returns per-partner aggregates for the last `hours`. */
async function getCoverageSummary(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const { userId } = auth;
  const childId = truncateString(c.req.query("childId"), 64);
  const hours = Math.min(168, Math.max(1, Number(c.req.query("hours") ?? 24) | 0));

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);

  // Resolve the children the user owns through anon links (no PII leak: we
  // never expose other users' data because we filter by user_id first).
  let linksQ = sb.from("coverage_anon_links").select("child_id").eq("user_id", userId);
  if (childId) linksQ = linksQ.eq("child_id", childId);
  const links = await linksQ;
  const childIds = Array.from(new Set((links.data ?? []).map((l: { child_id: string }) => l.child_id)));
  if (childIds.length === 0) return c.json({ data: [], totalSeconds: 0, byPartner: [] });

  const since = new Date(Date.now() - hours * 60 * 60_000).toISOString();
  const credits = await sb
    .from("coverage_credits")
    .select("partner_id, child_id, duration_seconds, brain_region, modality, signed_at")
    .in("child_id", childIds)
    .gte("signed_at", since)
    .order("signed_at", { ascending: false })
    .limit(500);
  if (credits.error) return c.json({ error: credits.error.message }, 500);
  const rows = credits.data ?? [];

  const partnerIds = Array.from(new Set(rows.map((r: { partner_id: string }) => r.partner_id)));
  const partners = partnerIds.length
    ? (await sb.from("coverage_partners").select("id, slug, display_name").in("id", partnerIds)).data ?? []
    : [];
  const byId = new Map(partners.map((p: { id: string; slug: string; display_name: string }) => [p.id, p]));

  const totalSeconds = rows.reduce((s, r: { duration_seconds: number }) => s + r.duration_seconds, 0);
  const byPartnerMap = new Map<string, { partnerId: string; slug: string; displayName: string; seconds: number; events: number }>();
  for (const r of rows as Array<{ partner_id: string; duration_seconds: number }>) {
    const meta = byId.get(r.partner_id);
    const key = r.partner_id;
    const cur = byPartnerMap.get(key) ?? {
      partnerId: r.partner_id,
      slug: meta?.slug ?? "unknown",
      displayName: meta?.display_name ?? "Unknown partner",
      seconds: 0,
      events: 0,
    };
    cur.seconds += r.duration_seconds;
    cur.events += 1;
    byPartnerMap.set(key, cur);
  }

  return c.json({
    totalSeconds,
    windowHours: hours,
    byPartner: Array.from(byPartnerMap.values()).sort((a, b) => b.seconds - a.seconds),
    data: rows.map((r: { partner_id: string; child_id: string; duration_seconds: number; brain_region: string | null; modality: string; signed_at: string }) => ({
      partnerId: r.partner_id,
      partnerName: byId.get(r.partner_id)?.display_name ?? "Unknown",
      childId: r.child_id,
      durationSeconds: r.duration_seconds,
      brainRegion: r.brain_region,
      modality: r.modality,
      signedAt: r.signed_at,
    })),
  });
}

app.get("/make-server-76b0ba9a/coverage/summary", getCoverageSummary);
app.get("/coverage/summary", getCoverageSummary);

app.post("/make-server-76b0ba9a/standard/score", postStandardScore);
app.post("/standard/score", postStandardScore);
app.get("/make-server-76b0ba9a/standard/spec", getStandardSpec);
app.get("/standard/spec", getStandardSpec);
app.get("/make-server-76b0ba9a/standard/verify/:product", getStandardVerify);
app.get("/standard/verify/:product", getStandardVerify);

// ═══════════════════════════════════════════════════════════════════════════
// Survivor 6 — Clinical Wedge / partners.neurospark.com integration brief.
//
// Public endpoints designed for pediatricians, employer-benefit platforms
// (Maven, Carrot), and integration partners. Each one is intentionally
// boring + auditable — the wedge is the *posture*, not the surface.
//
// The full snapshot generation (PDF) lives client-side in
// `src/lib/clinical/wellChildSnapshot.ts`; these endpoints supply the
// partner-facing contracts: integration brief, clinical-anchor table, and
// a machine-readable summary that an EHR can ingest.
// ═══════════════════════════════════════════════════════════════════════════

const PARTNERS_INTEGRATION_BRIEF = {
  product: "NeuroSpark for Clinicians & Employers",
  posture: "developmental-wellness, not a medical device",
  compliance: ["COPPA-2.0", "HIPAA-aligned (parent-shared snapshots only)", "EU-AI-Act-Annex-IV"],
  channels: {
    pediatric:
      "Parent generates a one-page well-child snapshot in the app and brings it to the 9/12/15/18/24/30/36/48/60-month visit. PDF is signed by NeuroSpark and includes a posterior + 90% credible interval per milestone.",
    employer:
      "Employer benefit platforms (Maven, Carrot, Wellthy) can offer NeuroSpark as a child-development tile with SSO via SAML/OIDC and monthly cohort reporting (de-identified).",
  },
  endpoints: {
    spec: "/standard/spec — open AI-Age competency standard",
    verify: "/standard/verify/:product — partner ↔ NeuroSpark verification",
    snapshotSummary: "/partners/snapshot-summary — opt-in, parent-shared",
    cohortReport: "/partners/cohort-report — employer-benefit, de-identified, monthly",
  },
  legal: {
    bAA: "Available on request for HIPAA-covered partners.",
    dataResidency: "US (default), EU (opt-in), India (opt-in by 2026 H2).",
    contactEmail: "partners@neurospark.app",
  },
  versionedAt: "2026-04-17",
};

app.get("/make-server-76b0ba9a/partners/brief", (c) => c.json(PARTNERS_INTEGRATION_BRIEF));
app.get("/partners/brief", (c) => c.json(PARTNERS_INTEGRATION_BRIEF));

/** Machine-readable summary of a parent-shared snapshot. The parent generates
 * a `share_token` in-app (revocable, 30-day TTL) and gives it to a partner —
 * EHR fetches `/partners/snapshot-summary?token=…` and gets the same numbers
 * the PDF shows. We never expose the underlying activity log. */
async function getPartnerSnapshotSummary(c: Context) {
  const token = c.req.query("token") ?? "";
  if (!token || token.length < 16) return c.json({ error: "missing_or_invalid_token" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);

  // The `partner_snapshot_shares` table holds the parent-issued token, the
  // child_id it grants access to, and the revocation flag. Resolution is
  // intentionally one-way: token → snapshot, never the reverse.
  const { data: share, error } = await sb
    .from("partner_snapshot_shares")
    .select("id, child_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !share) return c.json({ error: "not_found" }, 404);
  if (share.revoked_at) return c.json({ error: "revoked" }, 410);
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    return c.json({ error: "expired" }, 410);
  }

  const { data: snap } = await sb
    .from("well_child_snapshots")
    .select("anchor_months, generated_at, posteriors, top_regions, underserved_regions, total_practice_minutes, child_age_months")
    .eq("child_id", share.child_id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!snap) return c.json({ error: "no_snapshot" }, 404);

  return c.json({
    anchor: snap.anchor_months,
    childAgeMonths: snap.child_age_months,
    generatedAt: snap.generated_at,
    posteriors: snap.posteriors,
    topRegions: snap.top_regions,
    underservedRegions: snap.underserved_regions,
    totalPracticeMinutes: snap.total_practice_minutes,
    disclaimer:
      "Developmental observation, not a clinical diagnosis. Posteriors derived from caregiver-logged activity + a normative age curve.",
  });
}

app.get("/make-server-76b0ba9a/partners/snapshot-summary", getPartnerSnapshotSummary);
app.get("/partners/snapshot-summary", getPartnerSnapshotSummary);

/** Parent-side: create + revoke shareable snapshot tokens. The token is the
 * only thing the partner sees; revoking it is immediate. */
async function postPartnerShareToken(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const body = (await c.req.json()) as { childId?: string; ttlDays?: number };
  if (!body.childId) return c.json({ error: "childId_required" }, 400);
  const ttl = Math.max(1, Math.min(90, Number(body.ttlDays ?? 30)));

  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);
  const { error } = await sb.from("partner_snapshot_shares").insert({
    user_id: auth.userId,
    child_id: String(body.childId).slice(0, 64),
    token,
    expires_at: new Date(Date.now() + ttl * 86400000).toISOString(),
  });
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ token, expiresInDays: ttl });
}

async function deletePartnerShareToken(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const token = c.req.param("token");
  if (!token) return c.json({ error: "token_required" }, 400);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);
  const { error } = await sb
    .from("partner_snapshot_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", auth.userId)
    .eq("token", token);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ ok: true });
}

app.post("/make-server-76b0ba9a/partners/share", postPartnerShareToken);
app.post("/partners/share", postPartnerShareToken);
app.delete("/make-server-76b0ba9a/partners/share/:token", deletePartnerShareToken);
app.delete("/partners/share/:token", deletePartnerShareToken);

/** Survivor 6 — parent persists a snapshot. The frontend builds the data
 * locally (so we avoid round-tripping the activity log), and we cache the
 * derived numbers so the partners endpoint can serve the same posteriors. */
async function postSnapshotSave(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const rl = await enforceRateLimit(c, "snapshot-save", 60, 600, auth.userId);
  if (rl) return rl;
  const body = (await c.req.json()) as {
    childId?: string;
    anchorMonths?: number;
    childAgeMonths?: number;
    posteriors?: unknown;
    topRegions?: unknown;
    underservedRegions?: unknown;
    totalPracticeMinutes?: number;
  };
  const childId = truncateString(body.childId, 64);
  const anchor = clampNumber(body.anchorMonths, 0, 240);
  const ageMonths = clampNumber(body.childAgeMonths, 0, 240);
  if (!childId || anchor == null || ageMonths == null) return c.json({ error: "missing_fields" }, 400);
  if (!Array.isArray(body.posteriors) || !Array.isArray(body.topRegions) || !Array.isArray(body.underservedRegions)) {
    return c.json({ error: "bad_payload" }, 400);
  }
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);
  const { data, error } = await sb.from("well_child_snapshots").insert({
    user_id: auth.userId,
    child_id: childId,
    anchor_months: anchor,
    child_age_months: ageMonths,
    posteriors: body.posteriors,
    top_regions: body.topRegions,
    underserved_regions: body.underservedRegions,
    total_practice_minutes: Math.max(0, Math.round(body.totalPracticeMinutes ?? 0)),
  }).select("id, generated_at").single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ id: data?.id, generatedAt: data?.generated_at });
}

async function getSnapshotList(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const childId = truncateString(c.req.query("childId"), 64);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);
  let q = sb
    .from("well_child_snapshots")
    .select("id, child_id, generated_at, anchor_months, child_age_months, total_practice_minutes")
    .eq("user_id", auth.userId)
    .order("generated_at", { ascending: false })
    .limit(20);
  if (childId) q = q.eq("child_id", childId);
  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [] });
}

async function getPartnerShareList(c: Context) {
  const auth = await requireUser(c);
  if (auth instanceof Response) return auth;
  const childId = truncateString(c.req.query("childId"), 64);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return c.json({ error: "server_misconfigured" }, 500);
  const sb = createClient(url, serviceKey);
  let q = sb
    .from("partner_snapshot_shares")
    .select("id, child_id, token, created_at, expires_at, revoked_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (childId) q = q.eq("child_id", childId);
  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [] });
}

app.post("/make-server-76b0ba9a/snapshot/save", postSnapshotSave);
app.post("/snapshot/save", postSnapshotSave);
app.get("/make-server-76b0ba9a/snapshot/list", getSnapshotList);
app.get("/snapshot/list", getSnapshotList);
app.get("/make-server-76b0ba9a/partners/shares", getPartnerShareList);
app.get("/partners/shares", getPartnerShareList);

Deno.serve(app.fetch);
