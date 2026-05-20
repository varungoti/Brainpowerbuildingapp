import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CreditCard,
  Gift,
  Layers,
  Loader2,
  Play,
  Power,
  RefreshCw,
  Repeat,
  Users,
} from "lucide-react";
import { api } from "../../lib/api.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Types — match the GET /admin/growth/levers/overview response shape.
// ─────────────────────────────────────────────────────────────────────────────

interface FunnelRow {
  stage: string;
  day: string | null;
  actors: number;
  events: number;
}

interface PaywallVariant {
  id: string;
  variant_key: string;
  name: string;
  headline: string | null;
  sub_copy: string | null;
  price_label: string | null;
  plan_id: string | null;
  allocation_pct: number;
  status: "draft" | "active" | "paused" | "retired";
  hypothesis: string | null;
  updated_at: string;
}

interface ConversionRow {
  variant_key: string;
  name: string;
  status: string;
  allocation_pct: number;
  assigned: number;
  views: number;
  checkout_starts: number;
  purchases: number;
  view_to_paid_pct: number;
  checkout_to_paid_pct: number;
}

interface SubscriptionHealthRow {
  plan: string;
  status: string;
  subscribers: number;
  new_7d: number;
  new_30d: number;
  past_due: number;
}

interface CohortRow {
  cohort_week: string;
  day_offset: number | null;
  retained: number;
  cohort_size: number;
}

interface ReferralMetricRow {
  code: string;
  referrer_user_id: string | null;
  uses_count: number;
  redeemed: number;
  pending: number;
  reward_paid_inr: number;
}

interface LifecycleRule {
  id: string;
  rule_key: string;
  name: string;
  segment: string;
  trigger_kind: string;
  trigger_params: Record<string, unknown>;
  action_kind: string;
  action_params: Record<string, unknown>;
  enabled: boolean;
  cooldown_hours: number;
  last_run_at: string | null;
}

interface LifecycleRun {
  id: string;
  rule_id: string;
  ran_at: string;
  target_count: number;
  enqueued_count: number;
  error: string | null;
}

interface LeversOverview {
  funnel: FunnelRow[];
  variants: PaywallVariant[];
  conversion: ConversionRow[];
  subscriptionHealth: SubscriptionHealthRow[];
  subscriptionHealthError: string | null;
  cohorts: CohortRow[];
  referralMetrics: ReferralMetricRow[];
  lifecycleRules: LifecycleRule[];
  lifecycleRuns: LifecycleRun[];
  lifecycleDue: Array<{ id: string; rule_key: string; due: boolean }>;
}

const FUNNEL_ORDER = [
  "auth_submit_success",
  "onboard_complete",
  "first_activity_open",
  "first_activity_complete",
  "paywall_view",
  "paywall_checkout_start",
  "paywall_purchase_success",
];

const FUNNEL_LABEL: Record<string, string> = {
  auth_submit_success: "Signed up",
  onboard_complete: "Onboarded",
  first_activity_open: "Opened 1st activity",
  first_activity_complete: "Completed 1st activity",
  paywall_view: "Saw paywall",
  paywall_checkout_start: "Started checkout",
  paywall_purchase_success: "Purchased",
};

// ─────────────────────────────────────────────────────────────────────────────
// Section root
// ─────────────────────────────────────────────────────────────────────────────

export const GrowthLeversSection: React.FC = () => {
  const qc = useQueryClient();
  const levers = useQuery({
    queryKey: ["growth-levers-overview"],
    queryFn: () => api<LeversOverview>("/admin/growth/levers/overview"),
    refetchInterval: 60_000,
  });

  const data = levers.data;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Growth Levers
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl mt-1">
            The closed-loop measurement layer for user-base + subscription growth. Each panel exposes one lever: activation funnel, subscription health, paywall A/B, cohort retention, referrals, and lifecycle reactivation.
          </p>
        </div>
        <button
          onClick={() => levers.refetch()}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold bg-white inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {levers.isLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading levers…
        </div>
      ) : levers.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Failed to load Growth Levers. Run migration <code>00020_growth_levers.sql</code> first, then redeploy the server function.
        </div>
      ) : (
        <>
          <ActivationFunnelPanel rows={data?.funnel ?? []} />
          <div className="grid gap-6 xl:grid-cols-2">
            <SubscriptionHealthPanel rows={data?.subscriptionHealth ?? []} error={data?.subscriptionHealthError ?? null} />
            <PaywallVariantPanel
              variants={data?.variants ?? []}
              conversion={data?.conversion ?? []}
              onChange={() => qc.invalidateQueries({ queryKey: ["growth-levers-overview"] })}
            />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <CohortRetentionPanel rows={data?.cohorts ?? []} />
            <ReferralPanel rows={data?.referralMetrics ?? []} onChange={() => qc.invalidateQueries({ queryKey: ["growth-levers-overview"] })} />
          </div>
          <LifecyclePanel
            rules={data?.lifecycleRules ?? []}
            runs={data?.lifecycleRuns ?? []}
            due={data?.lifecycleDue ?? []}
            onChange={() => qc.invalidateQueries({ queryKey: ["growth-levers-overview"] })}
          />
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Activation Funnel
// ─────────────────────────────────────────────────────────────────────────────

const ActivationFunnelPanel: React.FC<{ rows: FunnelRow[] }> = ({ rows }) => {
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.stage, (map.get(r.stage) ?? 0) + (Number(r.actors) || 0));
    }
    return FUNNEL_ORDER.map((stage) => ({ stage, actors: map.get(stage) ?? 0 }));
  }, [rows]);
  const top = totals[0]?.actors ?? 0;

  return (
    <Panel
      icon={Activity}
      title="Activation funnel · last 30 days"
      hint="Where users drop off. Fix the biggest leak first."
    >
      {top === 0 ? (
        <Empty text="No funnel events yet. Wire the client SDK (see /src/utils/productAnalytics.ts) and refresh." />
      ) : (
        <div className="space-y-2">
          {totals.map((t, idx) => {
            const widthPct = top === 0 ? 0 : Math.round((t.actors / top) * 100);
            const prev = idx === 0 ? null : totals[idx - 1].actors;
            const dropPct = prev && prev > 0 ? Math.round(((prev - t.actors) / prev) * 100) : 0;
            return (
              <div key={t.stage} className="rounded-xl bg-white border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold">{FUNNEL_LABEL[t.stage] ?? t.stage}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="font-bold text-slate-900">{t.actors.toLocaleString()}</span>
                    {idx > 0 && (
                      <span className={dropPct > 50 ? "text-rose-600 font-semibold" : "text-slate-500"}>
                        {dropPct > 0 ? `↓ ${dropPct}%` : "—"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${widthPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Subscription Health
// ─────────────────────────────────────────────────────────────────────────────

const SubscriptionHealthPanel: React.FC<{ rows: SubscriptionHealthRow[]; error: string | null }> = ({ rows, error }) => {
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        subscribers: acc.subscribers + Number(r.subscribers ?? 0),
        new_7d: acc.new_7d + Number(r.new_7d ?? 0),
        new_30d: acc.new_30d + Number(r.new_30d ?? 0),
        past_due: acc.past_due + Number(r.past_due ?? 0),
      }),
      { subscribers: 0, new_7d: 0, new_30d: 0, past_due: 0 },
    );
  }, [rows]);
  const planMix = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.plan, (map.get(r.plan) ?? 0) + r.subscribers));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  return (
    <Panel icon={CreditCard} title="Subscription health" hint="Active subscriptions, plan mix, 7d/30d new, past-due.">
      {error ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          Subscriptions table unavailable: {error}. Add the table or run the relevant migration.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="Active" value={totals.subscribers.toLocaleString()} />
            <MiniStat label="New · 7d" value={totals.new_7d.toLocaleString()} tone={totals.new_7d > 0 ? "ok" : undefined} />
            <MiniStat label="New · 30d" value={totals.new_30d.toLocaleString()} />
            <MiniStat label="Past due" value={totals.past_due.toLocaleString()} tone={totals.past_due > 0 ? "warn" : undefined} />
          </div>
          <div className="mt-3">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Plan mix</div>
            <div className="space-y-1">
              {planMix.map(([plan, count]) => {
                const pct = totals.subscribers > 0 ? Math.round((count / totals.subscribers) * 100) : 0;
                return (
                  <div key={plan} className="text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">{plan || "unknown"}</span>
                      <span className="text-slate-500">{count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {planMix.length === 0 && <Empty text="No active subscriptions yet." />}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Paywall A/B Variants
// ─────────────────────────────────────────────────────────────────────────────

const PaywallVariantPanel: React.FC<{ variants: PaywallVariant[]; conversion: ConversionRow[]; onChange: () => void }> = ({ variants, conversion, onChange }) => {
  const conversionByKey = useMemo(() => {
    const map = new Map<string, ConversionRow>();
    conversion.forEach((c) => map.set(c.variant_key, c));
    return map;
  }, [conversion]);

  const setStatus = useMutation({
    mutationFn: (input: { key: string; status: PaywallVariant["status"] }) =>
      api(`/admin/growth/paywall-variants/${input.key}/status`, {
        method: "POST",
        body: JSON.stringify({ status: input.status }),
      }),
    onSuccess: () => onChange(),
  });

  const [draft, setDraft] = useState({ variantKey: "", name: "", headline: "", subCopy: "", priceLabel: "₹999 lifetime", allocationPct: 50, hypothesis: "" });
  const create = useMutation({
    mutationFn: () =>
      api("/admin/growth/paywall-variants", {
        method: "POST",
        body: JSON.stringify({ ...draft, status: "draft" }),
      }),
    onSuccess: () => {
      setDraft({ variantKey: "", name: "", headline: "", subCopy: "", priceLabel: "₹999 lifetime", allocationPct: 50, hypothesis: "" });
      onChange();
    },
  });

  return (
    <Panel icon={Layers} title="Paywall A/B variants" hint="Run side-by-side copy/price tests. Conversion = purchases / views.">
      <div className="space-y-2">
        {variants.map((v) => {
          const c = conversionByKey.get(v.variant_key);
          return (
            <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {v.name}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${v.status === "active" ? "bg-emerald-100 text-emerald-700" : v.status === "paused" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{v.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{v.variant_key} · alloc {v.allocation_pct}%</div>
                  {v.headline && <div className="text-xs text-slate-700 mt-1 italic">"{v.headline}"</div>}
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-base text-slate-900">{c?.view_to_paid_pct ?? 0}%</div>
                  <div className="text-slate-500">{c?.purchases ?? 0} / {c?.views ?? 0} views</div>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                {(["active", "paused", "draft", "retired"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus.mutate({ key: v.variant_key, status: s })}
                    disabled={v.status === s}
                    className={`text-[11px] px-2 py-1 rounded-md font-semibold ${v.status === s ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {variants.length === 0 && <Empty text="No paywall variants yet — seed will create two on first migration." />}
      </div>

      <details className="rounded-xl bg-slate-50 border border-slate-100 p-3 mt-3">
        <summary className="cursor-pointer text-sm font-semibold">+ New variant</summary>
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <TextInput placeholder="variant_key (e.g. price_anchor)" value={draft.variantKey} onChange={(v) => setDraft((s) => ({ ...s, variantKey: v }))} />
            <TextInput placeholder="Display name" value={draft.name} onChange={(v) => setDraft((s) => ({ ...s, name: v }))} />
          </div>
          <TextInput placeholder="Headline shown on paywall" value={draft.headline} onChange={(v) => setDraft((s) => ({ ...s, headline: v }))} />
          <TextInput placeholder="Sub-copy" value={draft.subCopy} onChange={(v) => setDraft((s) => ({ ...s, subCopy: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput placeholder="Price label" value={draft.priceLabel} onChange={(v) => setDraft((s) => ({ ...s, priceLabel: v }))} />
            <NumberInput label="Allocation %" value={draft.allocationPct} setValue={(v) => setDraft((s) => ({ ...s, allocationPct: v }))} />
          </div>
          <TextInput placeholder="Hypothesis you're testing" value={draft.hypothesis} onChange={(v) => setDraft((s) => ({ ...s, hypothesis: v }))} />
          <button
            onClick={() => create.mutate()}
            disabled={!draft.variantKey || !draft.name || create.isPending}
            className="bg-slate-900 disabled:bg-slate-300 text-white rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-2"
          >
            {create.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Save variant (draft)
          </button>
        </div>
      </details>
    </Panel>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Cohort Retention
// ─────────────────────────────────────────────────────────────────────────────

const RETENTION_DAYS = [0, 1, 3, 7, 14, 30];

const CohortRetentionPanel: React.FC<{ rows: CohortRow[] }> = ({ rows }) => {
  const cohorts = useMemo(() => {
    const map = new Map<string, { size: number; days: Map<number, number> }>();
    for (const r of rows) {
      if (!r.cohort_week) continue;
      const k = r.cohort_week;
      const entry = map.get(k) ?? { size: r.cohort_size ?? 0, days: new Map() };
      entry.size = Math.max(entry.size, r.cohort_size ?? 0);
      if (r.day_offset !== null && r.day_offset !== undefined) {
        entry.days.set(r.day_offset, (entry.days.get(r.day_offset) ?? 0) + Number(r.retained ?? 0));
      }
      map.set(k, entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 8);
  }, [rows]);

  return (
    <Panel icon={Users} title="Cohort retention" hint="% of each weekly signup cohort still active on day N.">
      {cohorts.length === 0 ? (
        <Empty text="Need ≥ 7 days of funnel data to build cohorts." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="pr-3 py-1">Week</th>
                <th className="pr-3 py-1">Size</th>
                {RETENTION_DAYS.map((d) => (
                  <th key={d} className="px-2 py-1 text-center">D{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map(([week, info]) => (
                <tr key={week} className="border-t border-slate-100">
                  <td className="pr-3 py-1.5 font-medium">{week.slice(5)}</td>
                  <td className="pr-3 py-1.5">{info.size}</td>
                  {RETENTION_DAYS.map((d) => {
                    const retained = info.days.get(d) ?? 0;
                    const pct = info.size > 0 ? Math.round((retained / info.size) * 100) : 0;
                    const bg = pct >= 50 ? "bg-emerald-500" : pct >= 25 ? "bg-amber-400" : pct >= 10 ? "bg-rose-300" : "bg-slate-100";
                    return (
                      <td key={d} className="px-1 py-1.5 text-center">
                        <div className={`rounded-md ${bg} text-white font-semibold py-0.5`}>{pct}%</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Referrals
// ─────────────────────────────────────────────────────────────────────────────

const ReferralPanel: React.FC<{ rows: ReferralMetricRow[]; onChange: () => void }> = ({ rows, onChange }) => {
  const [draft, setDraft] = useState({ code: "", userId: "", rewardLabel: "1 free month for both" });
  const issue = useMutation({
    mutationFn: () =>
      api("/admin/growth/referrals/issue", {
        method: "POST",
        body: JSON.stringify(draft),
      }),
    onSuccess: () => {
      setDraft({ code: "", userId: "", rewardLabel: "1 free month for both" });
      onChange();
    },
  });

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        codes: acc.codes + 1,
        uses: acc.uses + (Number(r.uses_count) || 0),
        redeemed: acc.redeemed + (Number(r.redeemed) || 0),
        pending: acc.pending + (Number(r.pending) || 0),
      }),
      { codes: 0, uses: 0, redeemed: 0, pending: 0 },
    );
  }, [rows]);

  return (
    <Panel icon={Gift} title="Referral loop" hint="Cheapest growth channel — issue codes, reward redemptions.">
      <div className="grid grid-cols-4 gap-2">
        <MiniStat label="Codes" value={totals.codes} />
        <MiniStat label="Uses" value={totals.uses} />
        <MiniStat label="Redeemed" value={totals.redeemed} tone={totals.redeemed > 0 ? "ok" : undefined} />
        <MiniStat label="Pending" value={totals.pending} tone={totals.pending > 0 ? "warn" : undefined} />
      </div>
      <div className="mt-3 max-h-48 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-slate-500">
            <tr><th className="py-1">Code</th><th>Uses</th><th>Redeemed</th><th>Pending</th></tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((r) => (
              <tr key={r.code} className="border-t border-slate-100">
                <td className="py-1.5 font-mono">{r.code}</td>
                <td>{r.uses_count}</td>
                <td>{r.redeemed}</td>
                <td>{r.pending}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="py-3 text-center text-slate-500">No codes yet — issue the first one below.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <details className="rounded-xl bg-slate-50 border border-slate-100 p-3 mt-3">
        <summary className="cursor-pointer text-sm font-semibold">+ Issue code</summary>
        <div className="mt-3 space-y-2">
          <TextInput placeholder="Custom code (leave blank to auto-generate)" value={draft.code} onChange={(v) => setDraft((s) => ({ ...s, code: v.toUpperCase() }))} />
          <TextInput placeholder="Referrer user_id (optional)" value={draft.userId} onChange={(v) => setDraft((s) => ({ ...s, userId: v }))} />
          <TextInput placeholder="Reward label" value={draft.rewardLabel} onChange={(v) => setDraft((s) => ({ ...s, rewardLabel: v }))} />
          <button
            onClick={() => issue.mutate()}
            disabled={issue.isPending}
            className="bg-slate-900 disabled:bg-slate-300 text-white rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-2"
          >
            {issue.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Issue code
          </button>
        </div>
      </details>
    </Panel>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Lifecycle Rules
// ─────────────────────────────────────────────────────────────────────────────

const LifecyclePanel: React.FC<{ rules: LifecycleRule[]; runs: LifecycleRun[]; due: LeversOverview["lifecycleDue"]; onChange: () => void }> = ({ rules, runs, due, onChange }) => {
  const dueIds = new Set(due.filter((d) => d.due).map((d) => d.id));

  const toggle = useMutation({
    mutationFn: (input: { key: string; enabled: boolean }) =>
      api(`/admin/growth/lifecycle/rules/${input.key}/toggle`, {
        method: "POST",
        body: JSON.stringify({ enabled: input.enabled }),
      }),
    onSuccess: () => onChange(),
  });

  const runDue = useMutation({
    mutationFn: () => api("/admin/growth/lifecycle/run-due", { method: "POST" }),
    onSuccess: () => onChange(),
  });

  return (
    <Panel
      icon={Repeat}
      title="Lifecycle reactivation"
      hint="Rules → enqueued nudges in crm_tasks. Recovers dormant + paywall-abandoned users."
      actions={
        <button
          onClick={() => runDue.mutate()}
          disabled={runDue.isPending}
          className="bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-2"
        >
          <Play className="w-3 h-3" /> Run due ({dueIds.size})
        </button>
      }
    >
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className={`rounded-xl border p-3 ${dueIds.has(rule.id) ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm">{rule.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {rule.trigger_kind} · {rule.action_kind} · cooldown {rule.cooldown_hours}h
                  {rule.last_run_at ? ` · last ${new Date(rule.last_run_at).toLocaleString()}` : " · never run"}
                </div>
              </div>
              <button
                onClick={() => toggle.mutate({ key: rule.rule_key, enabled: !rule.enabled })}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1 ${rule.enabled ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                <Power className="w-3 h-3" /> {rule.enabled ? "On" : "Off"}
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && <Empty text="Migration seeds three rules. Refresh after running it." />}
      </div>
      {runs.length > 0 && (
        <div className="mt-3 text-xs text-slate-500">
          <div className="font-semibold uppercase tracking-wide mb-1">Recent runs</div>
          <div className="space-y-1">
            {runs.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between border-t border-slate-100 py-1">
                <span>{new Date(r.ran_at).toLocaleString()}</span>
                <span className={r.error ? "text-rose-600" : ""}>
                  {r.error ?? `${r.target_count} target → ${r.enqueued_count} enqueued`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable atoms — kept self-contained so this file is portable.
// ─────────────────────────────────────────────────────────────────────────────

const Panel: React.FC<{ icon: React.FC<{ className?: string }>; title: string; hint?: string; actions?: React.ReactNode; children: React.ReactNode }> = ({ icon: Icon, title, hint, actions, children }) => (
  <div className="card">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </h3>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {actions}
    </div>
    {children}
  </div>
);

const MiniStat: React.FC<{ label: string; value: React.ReactNode; tone?: "ok" | "warn" }> = ({ label, value, tone }) => (
  <div className={`rounded-xl px-3 py-2 ${tone === "warn" ? "bg-amber-50 border border-amber-200" : tone === "ok" ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-100"}`}>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="font-display font-extrabold text-base">{value}</div>
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">{text}</div>
);

const TextInput: React.FC<{ placeholder: string; value: string; onChange: (value: string) => void }> = ({ placeholder, value, onChange }) => (
  <input className="w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
);

const NumberInput: React.FC<{ label: string; value: number; setValue: (v: number) => void }> = ({ label, value, setValue }) => (
  <label className="text-xs text-slate-600">
    {label}
    <input className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
  </label>
);
