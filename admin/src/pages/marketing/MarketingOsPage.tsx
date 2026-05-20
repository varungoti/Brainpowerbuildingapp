import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Copy,
  DollarSign,
  FileUp,
  Flag,
  Loader2,
  MessageCircle,
  Megaphone,
  PlayCircle,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { marketingApi } from "../../lib/marketingApi.ts";

// ── Types ────────────────────────────────────────────────────────────────────

type SprintTarget = {
  day: number;
  goalUsd: number;
  theme: string;
  objective: string;
};

type SprintDay = {
  id: string;
  sprint_day: number;
  sprint_date: string;
  goal_usd: number;
  actual_usd: number;
  partner_usd: number;
  consumer_usd: number;
  founder_usd: number;
  leads_added: number;
  posts_published: number;
  notes: string | null;
};

type Lead = {
  id: string;
  parent_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  temperature: string;
  source: string;
  created_at: string;
};

type Post = {
  id: string;
  title: string;
  platform: string | null;
  content: string;
  status: string;
  created_at: string;
};

type Overview = {
  revenue: {
    last30dUsd: number;
    byPlan: Record<string, { transactions: number; usd: number }>;
    paymentsCount: number;
    sprintGoalUsd: number;
    sprintCumulativeUsd: number;
    sprintProgressPct: number;
  };
  sprint: {
    today: SprintDay | null;
    sprintDayToday?: number;
    sprintStartDate?: string;
    targets: SprintTarget[];
    days: SprintDay[];
  };
  leads: Lead[];
  leadsCount: number;
  posts: Post[];
  postsCount: number;
};

const CHANNELS: Array<{ id: string; label: string; cap: number }> = [
  { id: "instagram_caption", label: "Instagram caption", cap: 220 },
  { id: "whatsapp_status", label: "WhatsApp status", cap: 60 },
  { id: "facebook_post", label: "Facebook group post", cap: 220 },
  { id: "linkedin_post", label: "LinkedIn post", cap: 220 },
  { id: "reddit_post", label: "Reddit long-form", cap: 800 },
  { id: "youtube_short", label: "YouTube Shorts script", cap: 120 },
  { id: "twitter_thread", label: "Twitter / X thread", cap: 280 },
  { id: "cold_email", label: "B2B cold email", cap: 200 },
];

const PROVIDERS = ["Instagram", "Facebook Pages", "LinkedIn", "Twitter", "Telegram", "WhatsApp", "YouTube"];

const usd = (n: number | null | undefined) =>
  `$${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// ── Today's playbook checklist (drives the Today panel) ─────────────────────
// Each item maps to one hour-block in docs/REVENUE_SPRINT_10K.md §4.
// Storage is local — this is intentional: every admin tracks their own
// execution. The heavy data (revenue, leads) is server-side.
const PLAYBOOK_BY_THEME: Record<string, Array<{ id: string; label: string; minutes: number }>> = {
  Foundation: [
    { id: "razorpay-links", label: "Create / verify 4 Razorpay payment links with notes.plan_id", minutes: 60 },
    { id: "landing", label: "Landing page email-capture wired to /server/growth/lead", minutes: 60 },
    { id: "generate-30", label: "Generate 30 posts via AI Content Generator below", minutes: 90 },
    { id: "queue-30", label: "Queue 30 posts in Social Scheduler (10 days × 3 channels)", minutes: 60 },
    { id: "reddit-1", label: "Submit first long-form Reddit post (1500+ words)", minutes: 90 },
    { id: "wa-20", label: "DM 20 warm WhatsApp/Telegram contacts (track in CRM)", minutes: 90 },
    { id: "linkedin-5", label: "LinkedIn post + 5 cold partner DMs", minutes: 90 },
  ],
  "Demand creation": [
    { id: "respond", label: "Reply to every comment / DM / lead from yesterday", minutes: 60 },
    { id: "long-form", label: "1 long-form post (Reddit OR FB group OR LinkedIn — rotate)", minutes: 90 },
    { id: "founder-calls", label: "5 founder calls or WA voice notes to top hot leads", minutes: 120 },
    { id: "schedule", label: "Schedule next 24h of content (10 posts) via Marketing OS", minutes: 30 },
    { id: "b2b", label: "10 LinkedIn DMs + 3 emails to preschool chains + 1 cold call", minutes: 90 },
  ],
  Conversion: [
    { id: "launch", label: "Run 48h Founding Parent Beta launch — public Reddit/FB", minutes: 60 },
    { id: "email-blast", label: "Single email to all CRM leads with launch offer (via crm_tasks)", minutes: 30 },
    { id: "close-partners", label: "Close partner pilots with warm yes — send pre-loaded Razorpay link", minutes: 90 },
    { id: "funnel", label: "Diagnose funnel: top, landing, offer, trust", minutes: 30 },
  ],
  Reinvest: [
    { id: "ad-spend", label: "Take 50–70% of sprint revenue → Meta + IG boosted post", minutes: 60 },
    { id: "winner", label: "Identify single best-performing reel; double its frequency", minutes: 30 },
    { id: "calls", label: "5 founder calls/day on remaining partner pipeline", minutes: 120 },
  ],
  Close: [
    { id: "close-bundles", label: "Close all pending Bundle / partner verbal yeses", minutes: 180 },
    { id: "launch-post", label: "LinkedIn launch announcement post", minutes: 30 },
    { id: "score", label: "Score the sprint — write the post-mortem brief", minutes: 60 },
  ],
};

const todayCheckKey = (date: string) => `marketing-os.today.${date}`;

// ── Page ─────────────────────────────────────────────────────────────────────

export const MarketingOsPage: React.FC = () => {
  const qc = useQueryClient();
  const overview = useQuery({
    queryKey: ["marketing-os-overview"],
    queryFn: () => marketingApi<Overview>("/overview"),
    refetchInterval: 60_000,
  });

  if (overview.isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-600">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading Marketing OS…
      </div>
    );
  }

  if (overview.isError) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 max-w-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5" />
          <div className="text-sm">
            <div className="font-bold text-amber-900">Marketing OS endpoint unreachable</div>
            <p className="mt-2 text-amber-800">
              Couldn't reach the <code className="font-mono">marketing-os</code> edge function. Run
              <code className="ml-1 font-mono">supabase functions deploy marketing-os razorpay-webhook social-publish-worker</code>
              after applying migration <code className="font-mono">00018_marketing_os.sql</code>. Set
              {" "}<code className="font-mono">VITE_MARKETING_OS_BASE</code> in <code className="font-mono">admin/.env</code> if you use a non-standard host.
            </p>
            <p className="mt-2 text-xs text-amber-700">{(overview.error as Error)?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const data = overview.data!;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary" /> Marketing OS · 10-day Revenue Sprint
          </h1>
          <p className="text-slate-600 max-w-3xl mt-2">
            Hour-by-hour playbook tied to live revenue tracking. Execute Today's Block, generate content with one click, and queue posts into the Social Scheduler.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Source of truth: <a href="#" onClick={(e) => { e.preventDefault(); window.open("/docs/REVENUE_SPRINT_10K.md", "_blank"); }} className="underline text-primary">docs/REVENUE_SPRINT_10K.md</a>
          </p>
        </div>
        <button onClick={() => overview.refetch()} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold bg-white">Refresh</button>
      </header>

      <RevenueGauge data={data} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TodayBlock data={data} />
        <SprintGrid data={data} onScored={() => qc.invalidateQueries({ queryKey: ["marketing-os-overview"] })} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ContentGenerator onSaved={() => qc.invalidateQueries({ queryKey: ["marketing-os-overview"] })} />
        <SocialScheduler onScheduled={() => qc.invalidateQueries({ queryKey: ["marketing-os-overview"] })} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LeadsPanel leads={data.leads} onChanged={() => qc.invalidateQueries({ queryKey: ["marketing-os-overview"] })} />
        <PostsPanel posts={data.posts} />
      </div>
    </div>
  );
};

// ── Revenue gauge ────────────────────────────────────────────────────────────
const RevenueGauge: React.FC<{ data: Overview }> = ({ data }) => {
  const { sprintGoalUsd, sprintCumulativeUsd, sprintProgressPct, byPlan } = data.revenue;
  const planEntries = Object.entries(byPlan).sort((a, b) => b[1].usd - a[1].usd);

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Sprint progress</div>
          <div className="font-display text-4xl font-extrabold mt-1">{usd(sprintCumulativeUsd)} <span className="text-slate-400 text-2xl font-normal">/ {usd(sprintGoalUsd)}</span></div>
          <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden w-80 max-w-full">
            <div
              className={`h-full ${sprintProgressPct >= 100 ? "bg-emerald-500" : sprintProgressPct >= 50 ? "bg-primary" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, sprintProgressPct)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1">{sprintProgressPct}% of $10k goal</div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={DollarSign} label="30d revenue" value={usd(data.revenue.last30dUsd)} />
          <Stat icon={Users} label="Leads (recent)" value={data.leadsCount} />
          <Stat icon={Megaphone} label="Drafts" value={data.postsCount} />
          <Stat icon={TrendingUp} label="Transactions" value={data.revenue.paymentsCount} />
        </div>
      </div>

      {planEntries.length > 0 && (
        <div className="mt-5 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {planEntries.map(([planId, v]) => (
            <div key={planId} className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500 truncate">{planId}</div>
              <div className="font-display font-bold">{usd(v.usd)} <span className="text-xs text-slate-500">· {v.transactions} txns</span></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const Stat: React.FC<{ icon: React.FC<{ className?: string }>; label: string; value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3 min-w-32">
    <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wide">
      <span>{label}</span>
      <Icon className="w-3.5 h-3.5 text-primary" />
    </div>
    <div className="font-display font-bold text-xl mt-1">{value}</div>
  </div>
);

// ── Today block (playbook checklist) ─────────────────────────────────────────
const TodayBlock: React.FC<{ data: Overview }> = ({ data }) => {
  const today = new Date().toISOString().slice(0, 10);
  const dayNumber = data.sprint.today?.sprint_day ?? data.sprint.sprintDayToday ?? guessSprintDay(data.sprint.targets, data.sprint.days);
  const sprintToday = data.sprint.targets.find((t) => t.day === dayNumber);
  const items = sprintToday ? PLAYBOOK_BY_THEME[sprintToday.theme] ?? [] : [];

  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem(todayCheckKey(today)) ?? "{}");
    } catch {
      return {};
    }
  });

  const toggle = (id: string) => {
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      window.localStorage.setItem(todayCheckKey(today), JSON.stringify(next));
      return next;
    });
  };

  const completed = items.filter((i) => checks[i.id]).length;
  const totalMins = items.reduce((s, i) => s + i.minutes, 0);
  const doneMins = items.filter((i) => checks[i.id]).reduce((s, i) => s + i.minutes, 0);

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl flex items-center gap-2"><PlayCircle className="w-5 h-5 text-primary" /> Today's block</h2>
          {sprintToday && <p className="text-sm text-slate-600 mt-1">Day {sprintToday.day} · {sprintToday.theme} · target {usd(sprintToday.goalUsd)}</p>}
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{completed}/{items.length}</div>
          <div className="text-xs text-slate-500">{doneMins}/{totalMins} min</div>
        </div>
      </div>
      {sprintToday?.objective && (
        <div className="mt-3 rounded-xl bg-primary/5 border border-primary/10 p-3 text-sm text-slate-700">
          <span className="font-semibold text-primary">Objective:</span> {sprintToday.objective}
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it.id}>
            <label className="flex items-start gap-3 rounded-xl bg-slate-50 hover:bg-slate-100 p-3 cursor-pointer transition">
              <input
                type="checkbox"
                checked={!!checks[it.id]}
                onChange={() => toggle(it.id)}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div className="flex-1">
                <div className={`text-sm font-medium ${checks[it.id] ? "line-through text-slate-400" : "text-slate-800"}`}>{it.label}</div>
                <div className="text-xs text-slate-500">{it.minutes} min</div>
              </div>
              {checks[it.id] && <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1" />}
            </label>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-slate-500 rounded-xl bg-slate-50 p-3">
            No playbook items for today's theme. The sprint may be over — score the day below to wrap up.
          </li>
        )}
      </ul>
    </section>
  );
};

function guessSprintDay(targets: SprintTarget[], days: SprintDay[]): number {
  // If we have any sprint days persisted, assume "today" is the next one; else day 1.
  const persisted = days.length;
  if (persisted >= targets.length) return targets[targets.length - 1].day;
  return persisted + 1;
}

// ── Sprint grid + scoring ────────────────────────────────────────────────────
const SprintGrid: React.FC<{ data: Overview; onScored: () => void }> = ({ data, onScored }) => {
  const initialDay = data.sprint.today?.sprint_day ?? data.sprint.sprintDayToday ?? guessSprintDay(data.sprint.targets, data.sprint.days);
  const [score, setScore] = useState({ sprintDay: initialDay, actualUsd: 0, partnerUsd: 0, consumerUsd: 0, founderUsd: 0, leadsAdded: 0, postsPublished: 0, notes: "" });

  const submit = useMutation({
    mutationFn: () =>
      marketingApi("/sprint/score", {
        method: "POST",
        body: JSON.stringify(score),
      }),
    onSuccess: () => {
      setScore((s) => ({ ...s, actualUsd: 0, partnerUsd: 0, consumerUsd: 0, founderUsd: 0, leadsAdded: 0, postsPublished: 0, notes: "" }));
      onScored();
    },
  });

  return (
    <section className="card">
      <h2 className="font-display font-bold text-xl flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> 10-day grid</h2>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {data.sprint.targets.map((t) => {
          const persisted = data.sprint.days.find((d) => d.sprint_day === t.day);
          const actual = Number(persisted?.actual_usd ?? 0);
          const hit = actual >= t.goalUsd;
          return (
            <div
              key={t.day}
              className={`rounded-xl p-2 border text-xs ${hit ? "border-emerald-200 bg-emerald-50" : actual > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
              title={t.objective}
            >
              <div className="font-bold">D{t.day}</div>
              <div className="text-[10px] text-slate-500">{t.theme}</div>
              <div className="font-mono mt-1">{usd(actual)}</div>
              <div className="text-[10px] text-slate-400">/{usd(t.goalUsd)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 space-y-2">
        <div className="text-xs font-bold text-slate-700">Score a day</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <NumInput label="Day" value={score.sprintDay} onChange={(v) => setScore((s) => ({ ...s, sprintDay: v }))} />
          <NumInput label="Total $" value={score.actualUsd} onChange={(v) => setScore((s) => ({ ...s, actualUsd: v }))} />
          <NumInput label="Leads added" value={score.leadsAdded} onChange={(v) => setScore((s) => ({ ...s, leadsAdded: v }))} />
          <NumInput label="Partner $" value={score.partnerUsd} onChange={(v) => setScore((s) => ({ ...s, partnerUsd: v }))} />
          <NumInput label="Consumer $" value={score.consumerUsd} onChange={(v) => setScore((s) => ({ ...s, consumerUsd: v }))} />
          <NumInput label="Founder $" value={score.founderUsd} onChange={(v) => setScore((s) => ({ ...s, founderUsd: v }))} />
        </div>
        <textarea
          className="w-full rounded-xl border border-slate-200 p-2 text-xs"
          placeholder="What worked / what wasted time"
          rows={2}
          value={score.notes}
          onChange={(e) => setScore((s) => ({ ...s, notes: e.target.value }))}
        />
        <button
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
          className="bg-slate-900 text-white text-xs font-semibold rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5"
        >
          {submit.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Save day
        </button>
      </div>
    </section>
  );
};

const NumInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <label className="text-[10px] font-semibold text-slate-500 uppercase">
    {label}
    <input
      type="number"
      className="mt-1 w-full rounded-lg border border-slate-200 p-1.5 text-sm font-mono"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

// ── Content generator ────────────────────────────────────────────────────────
const ContentGenerator: React.FC<{ onSaved: () => void }> = ({ onSaved }) => {
  const [channel, setChannel] = useState("instagram_caption");
  const [persona, setPersona] = useState("Indian parent of 4–8 year old, focus concern");
  const [offer, setOffer] = useState("Founding Parent Beta — ₹999 lifetime");
  const [content, setContent] = useState("");
  const [provider, setProvider] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const generate = useMutation({
    mutationFn: () =>
      marketingApi<{ content: string; provider: string }>("/content/generate", {
        method: "POST",
        body: JSON.stringify({ channel, persona, offer }),
      }),
    onSuccess: (r) => {
      setContent(r.content);
      setProvider(r.provider);
    },
  });
  const save = useMutation({
    mutationFn: () =>
      marketingApi<{ saved?: { id: string } }>("/content/generate", {
        method: "POST",
        body: JSON.stringify({ channel, persona, offer, saveAsDraft: true }),
      }),
    onSuccess: (r) => {
      if (r.saved) onSaved();
    },
  });

  const copy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="card">
      <h2 className="font-display font-bold text-xl flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Content generator</h2>
      <p className="text-xs text-slate-500 mt-1">
        Uses Fireworks AI when <code className="font-mono">FIREWORKS_API_KEY</code> is set on the edge function; falls back to deterministic templates otherwise.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">
          Channel
          <select className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600 md:col-span-2">
          Persona
          <input className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm" value={persona} onChange={(e) => setPersona(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-slate-600 md:col-span-3">
          Offer
          <input className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm" value={offer} onChange={(e) => setOffer(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="bg-primary text-white text-sm font-semibold rounded-xl px-4 py-2 inline-flex items-center gap-2"
        >
          {generate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Generate
        </button>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-slate-900 text-white text-sm font-semibold rounded-xl px-4 py-2"
        >
          {save.isPending ? "Saving…" : "Generate & save as draft"}
        </button>
        <button
          onClick={copy}
          disabled={!content}
          className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 inline-flex items-center gap-2"
        >
          <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        rows={8}
        className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm font-mono"
        placeholder="Generated content will appear here. Tap Generate to start."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {provider && (
        <div className="mt-2 text-xs text-slate-500">Generated via <span className="font-mono">{provider}</span></div>
      )}
    </section>
  );
};

// ── Social scheduler ─────────────────────────────────────────────────────────
const SocialScheduler: React.FC<{ onScheduled: () => void }> = ({ onScheduled }) => {
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [providers, setProviders] = useState<string[]>(["Instagram", "LinkedIn"]);
  const [campaign, setCampaign] = useState("Founding Parent Beta");

  const schedule = useMutation({
    mutationFn: () =>
      marketingApi("/social/posts", {
        method: "POST",
        body: JSON.stringify({
          content,
          scheduledAt: new Date(scheduledAt).toISOString(),
          campaign,
          targets: providers.map((p) => ({ provider: p })),
        }),
      }),
    onSuccess: () => {
      setContent("");
      onScheduled();
    },
  });

  const toggleProvider = (p: string) => {
    setProviders((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <section className="card">
      <h2 className="font-display font-bold text-xl flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Social scheduler</h2>
      <p className="text-xs text-slate-500 mt-1">
        Adds a row to <code className="font-mono">social_posts</code> + per-provider <code className="font-mono">social_post_targets</code>. The publish worker simulates delivery until OAuth keys are wired (Telegram is the easiest first integration — set <code className="font-mono">TELEGRAM_BOT_TOKEN</code> + <code className="font-mono">TELEGRAM_CHANNEL_ID</code>).
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          Schedule at
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Campaign
          <input className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        </label>
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold text-slate-600 mb-2">Providers</div>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => toggleProvider(p)}
              className={`text-xs px-3 py-1.5 rounded-full border ${providers.includes(p) ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-slate-200"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <textarea
        rows={5}
        className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
        placeholder="Paste content here (or generate it on the left and copy across)…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        onClick={() => schedule.mutate()}
        disabled={schedule.isPending || !content || providers.length === 0}
        className="mt-3 bg-slate-900 text-white text-sm font-semibold rounded-xl px-4 py-2"
      >
        {schedule.isPending ? "Scheduling…" : `Schedule to ${providers.length} channel${providers.length === 1 ? "" : "s"}`}
      </button>
    </section>
  );
};

// ── Leads panel ──────────────────────────────────────────────────────────────
//
// CSV import grammar: header row required, columns matched case-insensitively.
// Supported: parent_name | name (required), email, phone, city, child_age,
// source, concern. Extra columns are ignored. Max 200 rows per upload (server
// enforced). Lines longer than 4 KB are skipped to defend against malformed
// pastes.
const REQUIRED_COLS = ["parent_name", "name"];
const COL_ALIASES: Record<string, string> = {
  name: "parent_name",
  parent: "parent_name",
  parent_name: "parent_name",
  email: "email",
  phone: "phone",
  whatsapp: "phone",
  city: "city",
  child_age: "child_age",
  age: "child_age",
  source: "source",
  channel: "source",
  concern: "concern",
  notes: "concern",
};

function parseCsv(input: string): { rows: Array<Record<string, string>>; errors: string[] } {
  const errors: string[] = [];
  const lines = input.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], errors: ["CSV needs a header row + at least one data row"] };
  const headers = splitCsvLine(lines[0]).map((h) => COL_ALIASES[h.toLowerCase().trim()] ?? null);
  if (!headers.some((h) => h && REQUIRED_COLS.includes(h))) {
    errors.push("CSV header must include `parent_name` (or `name`)");
    return { rows: [], errors };
  }
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length && rows.length < 200; i++) {
    if (lines[i].length > 4_000) {
      errors.push(`Row ${i + 1} skipped: too long`);
      continue;
    }
    const cells = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((key, j) => {
      if (key && cells[j] !== undefined) row[key] = cells[j].trim();
    });
    if (!row.parent_name) {
      errors.push(`Row ${i + 1} skipped: missing parent_name`);
      continue;
    }
    rows.push(row);
  }
  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  // Tiny CSV splitter that handles quoted fields with commas. Doesn't support
  // escaped quotes inside quoted fields — sufficient for paste-from-Sheets.
  const out: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  out.push(buf);
  return out;
}

function sanitizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  // Default to India country code if user pastes 10-digit numbers
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function whatsappLink(phone: string | null | undefined, message: string): string | null {
  const sanitized = sanitizePhone(phone);
  if (!sanitized) return null;
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}

const WA_TEMPLATES: Array<{ id: string; label: string; render: (name: string) => string }> = [
  {
    id: "intro",
    label: "Founder intro (cold)",
    render: (name) =>
      `Hi ${name || "there"} — this is Varun. I built NeuroSpark, a parent-led app for kids 0–10 (focus, memory, reasoning, emotional regulation). Would love your honest feedback as a parent. First month is free — no card. OK to send the link?`,
  },
  {
    id: "warm",
    label: "Warm follow-up",
    render: (name) =>
      `Hey ${name || "there"} — quick follow-up. Founding Parent Beta is open until Sunday at ₹999 lifetime. After that it goes to ₹2,499. Want me to send the link?`,
  },
  {
    id: "partner",
    label: "B2B partner pilot",
    render: (name) =>
      `Hi ${name || "there"} — I'm offering 50 free family seats to your school/clinic for 90 days, plus a custom progress report you can share with parents. Could we do a 15-min call this week?`,
  },
];

const LeadsPanel: React.FC<{ leads: Lead[]; onChanged: () => void }> = ({ leads, onChanged }) => {
  const [draft, setDraft] = useState({ parent_name: "", phone: "", email: "", source: "Founder DM", concern: "" });
  const [csv, setCsv] = useState("");
  const [csvFeedback, setCsvFeedback] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [waTemplateId, setWaTemplateId] = useState(WA_TEMPLATES[0].id);

  const create = useMutation({
    mutationFn: () => marketingApi("/leads", { method: "POST", body: JSON.stringify(draft) }),
    onSuccess: () => {
      setDraft({ parent_name: "", phone: "", email: "", source: "Founder DM", concern: "" });
      onChanged();
    },
  });

  const promote = useMutation({
    mutationFn: (id: string) => marketingApi(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ temperature: "Hot", status: "Engaged" }) }),
    onSuccess: () => onChanged(),
  });

  const bulk = useMutation({
    mutationFn: (rows: Array<Record<string, string>>) =>
      marketingApi<{ inserted?: number }>("/leads/bulk", {
        method: "POST",
        body: JSON.stringify({ leads: rows }),
      }),
    onSuccess: (r) => {
      setCsvFeedback({ inserted: r.inserted ?? 0, errors: csvFeedback?.errors ?? [] });
      setCsv("");
      onChanged();
    },
  });

  const importCsv = () => {
    const { rows, errors } = parseCsv(csv);
    if (rows.length === 0) {
      setCsvFeedback({ inserted: 0, errors: errors.length ? errors : ["No valid rows found"] });
      return;
    }
    setCsvFeedback({ inserted: 0, errors });
    bulk.mutate(rows);
  };

  const filtered = useMemo(() => leads.slice(0, 25), [leads]);
  const template = WA_TEMPLATES.find((t) => t.id === waTemplateId) ?? WA_TEMPLATES[0];

  return (
    <section className="card">
      <h2 className="font-display font-bold text-xl flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Leads</h2>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <input className="rounded-xl border border-slate-200 p-2 text-sm" placeholder="Parent name" value={draft.parent_name} onChange={(e) => setDraft((s) => ({ ...s, parent_name: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 p-2 text-sm" placeholder="Phone (10-digit OK; assumes +91)" value={draft.phone} onChange={(e) => setDraft((s) => ({ ...s, phone: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 p-2 text-sm" placeholder="Email" value={draft.email} onChange={(e) => setDraft((s) => ({ ...s, email: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 p-2 text-sm" placeholder="Source (Reddit, FB group, DM…)" value={draft.source} onChange={(e) => setDraft((s) => ({ ...s, source: e.target.value }))} />
        <textarea rows={2} className="md:col-span-2 rounded-xl border border-slate-200 p-2 text-sm" placeholder="Concern / notes" value={draft.concern} onChange={(e) => setDraft((s) => ({ ...s, concern: e.target.value }))} />
      </div>
      <button
        onClick={() => create.mutate()}
        disabled={create.isPending || !draft.parent_name}
        className="mt-3 bg-slate-900 text-white text-sm font-semibold rounded-xl px-4 py-2"
      >
        {create.isPending ? "Adding…" : "Add lead"}
      </button>

      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
        <summary className="cursor-pointer font-semibold flex items-center gap-2">
          <FileUp className="w-4 h-4" /> Bulk CSV import
          <span className="text-xs font-normal text-slate-500">({"parent_name | email | phone | city | child_age | source | concern"})</span>
        </summary>
        <textarea
          rows={5}
          className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-xs font-mono"
          placeholder={"parent_name,email,phone,city,source\nPriya Mehta,priya@x.com,9876543210,Mumbai,WhatsApp\n…"}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={importCsv}
            disabled={bulk.isPending || !csv.trim()}
            className="bg-primary text-white text-xs font-semibold rounded-lg px-3 py-1.5"
          >
            {bulk.isPending ? "Importing…" : "Import"}
          </button>
          {csvFeedback && (
            <div className="text-xs text-slate-600">
              {csvFeedback.inserted > 0 && <span className="text-emerald-700 font-semibold">Inserted {csvFeedback.inserted}. </span>}
              {csvFeedback.errors.length > 0 && <span className="text-amber-700">{csvFeedback.errors.length} issue(s): {csvFeedback.errors.slice(0, 3).join(" · ")}{csvFeedback.errors.length > 3 ? "…" : ""}</span>}
            </div>
          )}
        </div>
      </details>

      <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp template (for Send buttons below)
          </div>
          <select
            value={waTemplateId}
            onChange={(e) => setWaTemplateId(e.target.value)}
            className="rounded-lg border border-emerald-200 bg-white text-xs px-2 py-1"
          >
            {WA_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="mt-2 text-xs text-emerald-900/80 italic line-clamp-2">"{template.render("[Name]")}"</div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">Parent</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Temp</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const wa = whatsappLink(l.phone, template.render(l.parent_name.split(" ")[0] ?? ""));
              return (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{l.parent_name}</div>
                    <div className="text-xs text-slate-500">{l.email ?? l.phone ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{l.source}</td>
                  <td className="px-3 py-2 text-xs">{l.status}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.temperature === "Hot" ? "bg-rose-100 text-rose-700" : l.temperature === "Warm" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{l.temperature}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                          title="Open WhatsApp Web with this template pre-filled"
                        >
                          <MessageCircle className="w-3 h-3" /> Send
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400" title="Add a phone to enable">No phone</span>
                      )}
                      {l.temperature !== "Hot" && (
                        <button onClick={() => promote.mutate(l.id)} className="text-xs px-2 py-1 rounded-lg bg-rose-100 text-rose-700 font-semibold">Hot</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500 text-sm">No leads yet. Day 1 target: 30 leads.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ── Posts library ────────────────────────────────────────────────────────────
const PostsPanel: React.FC<{ posts: Post[] }> = ({ posts }) => {
  return (
    <section className="card">
      <h2 className="font-display font-bold text-xl flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Drafts library</h2>
      <p className="text-xs text-slate-500 mt-1">Saved content from the generator. Click <span className="inline-flex items-center gap-0.5"><Copy className="w-3 h-3" /></span> to copy any draft for manual posting.</p>
      <div className="mt-3 space-y-2">
        {posts.slice(0, 12).map((p) => (
          <PostRow key={p.id} post={p} />
        ))}
        {posts.length === 0 && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 flex items-start gap-2">
            <Flag className="w-4 h-4 mt-0.5" /> No drafts yet. Generate 30 with the content tool to seed the queue.
          </div>
        )}
      </div>
    </section>
  );
};

const PostRow: React.FC<{ post: Post }> = ({ post }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold truncate">{post.title}</div>
          <div className="text-xs text-slate-500">{post.platform ?? "any"} · {post.status}</div>
        </div>
        <button onClick={copy} className="text-xs px-2 py-1 rounded-lg bg-white border border-slate-200 inline-flex items-center gap-1">
          <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-700 line-clamp-3 whitespace-pre-wrap">{post.content}</div>
    </div>
  );
};
