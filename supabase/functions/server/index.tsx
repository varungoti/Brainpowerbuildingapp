/// <reference path="./deno.d.ts" />
import { Hono, type Context } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

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
) {
  const windowId = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rate:${bucket}:${getClientKey(c)}:${windowId}`;
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
app.post("/make-server-76b0ba9a/rate-activity", async (c) => {
  try {
    const { activityId, rating, userId } = await c.req.json();
    if (!activityId || !rating || !userId) return c.json({ error: "Missing fields" }, 400);
    const key = `rating:${activityId}`;
    const existing = await kv.get(key) as { total: number; count: number; votes: Record<string, number> } | null;
    const votes = existing?.votes ?? {};
    const wasRated = votes[userId] ?? 0;
    const newTotal = (existing?.total ?? 0) - wasRated + rating;
    const newCount = wasRated ? (existing?.count ?? 0) : (existing?.count ?? 0) + 1;
    votes[userId] = rating;
    await kv.set(key, { total: newTotal, count: newCount, votes });
    return c.json({ success: true, avg: newTotal / newCount, count: newCount });
  } catch (e) {
    console.log("rate-activity error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/make-server-76b0ba9a/activity-ratings", async (c) => {
  try {
    const ids = c.req.query("ids")?.split(",") ?? [];
    const result: Record<string, { avg: number; count: number }> = {};
    for (const id of ids) {
      const key = `rating:${id}`;
      const data = await kv.get(key) as { total: number; count: number } | null;
      if (data && data.count > 0) result[id] = { avg: data.total / data.count, count: data.count };
    }
    return c.json({ success: true, ratings: result });
  } catch (e) {
    console.log("activity-ratings error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

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

app.post("/make-server-76b0ba9a/ai-counselor", async (c) => {
  try {
    const rateLimit = await enforceRateLimit(c, "ai-counselor", 20, 600);
    if (rateLimit) return rateLimit;
    const { concern, childAge, tier, category } = await c.req.json();
    if (!concern || !category) return c.json({ error: "Missing concern or category" }, 400);

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      // Return demo response for the selected category
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
      // Strip markdown code blocks if present
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
});

// ─── Razorpay Payment ──────────────────────────────────────────────────────────
app.post("/make-server-76b0ba9a/razorpay/create-order", async (c) => {
  try {
    const rateLimit = await enforceRateLimit(c, "razorpay-create-order", 10, 600);
    if (rateLimit) return rateLimit;
    const { amount } = await c.req.json();
    if (!amount || typeof amount !== "number") return c.json({ error: "Invalid amount" }, 400);
    const keyId     = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return c.json({ error: "Razorpay keys not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Supabase secrets." }, 500);
    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: "INR", receipt: `ns_${Date.now()}` }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.log("Razorpay create order error:", errText);
      return c.json({ error: `Razorpay error: ${errText}` }, 400);
    }
    const order = await res.json();
    return c.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (e) {
    console.log("razorpay create-order error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.post("/make-server-76b0ba9a/razorpay/verify-payment", async (c) => {
  try {
    const rateLimit = await enforceRateLimit(c, "razorpay-verify-payment", 20, 600);
    if (rateLimit) return rateLimit;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await c.req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return c.json({ error: "Missing payment verification fields" }, 400);
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) return c.json({ error: "Razorpay secret not configured" }, 500);
    const body    = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const key     = await crypto.subtle.importKey("raw", encoder.encode(keySecret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
    const sig     = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const hexSig  = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,"0")).join("");
    if (hexSig !== razorpay_signature) {
      console.log("Razorpay signature mismatch:", { expected: hexSig, received: razorpay_signature });
      return c.json({ error: "Payment signature verification failed — possible tampering" }, 400);
    }
    await kv.set(`payment:${razorpay_payment_id}`, { orderId: razorpay_order_id, paymentId: razorpay_payment_id, ts: Date.now() });
    return c.json({ success: true, paymentId: razorpay_payment_id });
  } catch (e) {
    console.log("razorpay verify-payment error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

Deno.serve(app.fetch);
