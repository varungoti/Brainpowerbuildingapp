import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Loader2,
  PauseCircle,
  Rocket,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { api } from "../../lib/api.ts";

type OkrStatus = "planned" | "in_progress" | "missed" | "base_hit" | "stretch_hit" | "overachieved" | "cancelled";

interface GrowthOkr {
  id: string;
  okr_date: string;
  objective: string;
  objective_type: string;
  owner_email: string | null;
  status: OkrStatus;
  base_revenue_usd: number;
  stretch_revenue_usd: number;
  over_revenue_usd: number;
  actual_revenue_usd: number;
  actual_pipeline_usd: number;
  okr_score: number | null;
  recovery_required: boolean;
  lessons_learned: string | null;
  next_day_adjustment: string | null;
}

interface Opportunity {
  id: string;
  name: string;
  organization: string | null;
  segment: string;
  estimated_value_usd: number;
  stage: string;
  priority: number;
}

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  audience: string;
  offer: string;
}

interface KeyResult {
  id: string;
  label: string;
  metric_key: string;
  unit: string;
  base_target: number;
  stretch_target: number;
  over_target: number;
  actual_value: number;
  status: OkrStatus;
}

interface RevenueCheckpoint {
  id: string;
  checkpoint_date: string;
  revenue_type: string;
  segment: string;
  amount_usd: number;
  probability: number;
  description: string;
}

interface Approval {
  id: string;
  item_type: string;
  title: string;
  risk_level: string;
  channel: string | null;
  audience: string | null;
  status: string;
  created_at: string;
}

interface Readiness {
  subsystem: string;
  score: number;
  status: string;
  p0_open: number;
  p1_open: number;
  notes: string | null;
}

interface KillSwitch {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  scope: string;
  reason: string | null;
}

interface Brief {
  id: string;
  brief_date: string;
  biggest_win: string | null;
  biggest_miss: string | null;
  recommended_objective: string | null;
  recovery_action: string | null;
}

interface Experiment {
  id: string;
  name: string;
  category: string;
  status: string;
  decision_due_at: string | null;
}

interface AutomationRun {
  id: string;
  system: string;
  workflow_key: string;
  status: string;
  dry_run: boolean;
  error: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  email: string;
  segment: string;
  lead_magnet: string;
  status: string;
  source: string;
  created_at: string;
}

interface IcpDefinition {
  id: string;
  key: string;
  name: string;
  segment: string;
  priority: number;
  positioning: string;
}

interface RevenueSource {
  id: string;
  key: string;
  name: string;
  category: string;
  segment: string;
  offer: string;
  target_price: string | null;
  status: string;
  success_metric: string;
  fail_metric: string;
}

interface GrowthOverview {
  okrs: GrowthOkr[];
  currentOkr: GrowthOkr | null;
  keyResults: KeyResult[];
  checkpoints: RevenueCheckpoint[];
  approvals: Approval[];
  readiness: Readiness[];
  killSwitches: KillSwitch[];
  briefs: Brief[];
  experiments: Experiment[];
  automationRuns: AutomationRun[];
  leads?: Lead[];
  icps?: IcpDefinition[];
  opportunities?: Opportunity[];
  campaigns?: Campaign[];
  revenueSources?: RevenueSource[];
  summary: {
    cashRevenue: number;
    weightedPipeline: number;
    pendingApprovals: number;
    readinessAverage: number;
    blockingSwitches: number;
    liveAutomationAllowed: boolean;
    leadCount?: number;
    opportunityCount?: number;
    campaignCount?: number;
    revenueSourceCount?: number;
  };
}

const usd = (n: number | string | null | undefined) => `$${Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().slice(0, 10);

export const GrowthCommandCenterPage: React.FC = () => {
  const qc = useQueryClient();
  const overview = useQuery({
    queryKey: ["growth-overview"],
    queryFn: () => api<GrowthOverview>("/admin/growth/overview"),
    refetchInterval: 60_000,
  });
  const data = overview.data;

  const toggleSwitch = useMutation({
    mutationFn: (input: { key: string; enabled: boolean; reason?: string }) =>
      api(`/admin/growth/kill-switches/${input.key}`, {
        method: "POST",
        body: JSON.stringify({ enabled: input.enabled, reason: input.reason }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["growth-overview"] }),
  });

  const decideApproval = useMutation({
    mutationFn: (input: { id: string; decision: "approve" | "reject" | "changes" }) =>
      api(`/admin/growth/approvals/${input.id}/${input.decision}`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["growth-overview"] }),
  });

  const createApproval = useMutation({
    mutationFn: (input: { title: string; itemType: string; riskLevel: string; channel: string; audience: string; complianceNotes: string }) =>
      api("/admin/growth/approvals", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["growth-overview"] }),
  });

  if (overview.isLoading) {
    return <div className="flex items-center gap-2 text-slate-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading growth command center…</div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary" /> $10M Growth Command Center
          </h1>
          <p className="text-slate-600 max-w-3xl mt-2">
            Daily OKRs, revenue checkpoints, approval-gated automation, readiness scores, and kill switches. Live automation stays blocked until readiness and compliance gates are green.
          </p>
        </div>
        <button
          onClick={() => overview.refetch()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold bg-white"
        >
          Refresh
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <Stat label="30d cash/signed" value={usd(data?.summary.cashRevenue)} icon={TrendingUp} />
        <Stat label="Weighted pipeline" value={usd(data?.summary.weightedPipeline)} icon={Target} />
        <Stat label="Pending approvals" value={data?.summary.pendingApprovals ?? 0} icon={ClipboardCheck} />
        <Stat label="Readiness avg" value={`${data?.summary.readinessAverage ?? 0}%`} icon={ShieldCheck} />
        <Stat label="Leads captured" value={data?.summary.leadCount ?? 0} icon={Flag} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Opportunities" value={data?.summary.opportunityCount ?? 0} icon={Target} />
        <Stat label="Campaigns" value={data?.summary.campaignCount ?? 0} icon={Rocket} />
        <Stat label="Revenue sources" value={data?.summary.revenueSourceCount ?? 0} icon={TrendingUp} />
        <Stat label="Kill switches on" value={data?.summary.blockingSwitches ?? 0} icon={PauseCircle} tone={(data?.summary.blockingSwitches ?? 0) > 0 ? "warn" : "ok"} />
      </div>

      <GateBanner overview={data} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DailyOkrPanel overview={data} />
        <QuickCreatePanel />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Approval Queue" icon={ClipboardCheck}>
          <div className="space-y-3">
            {(data?.approvals ?? []).map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{a.item_type} · {a.risk_level} risk · {a.channel ?? "no channel"}</div>
                    {a.audience && <div className="text-xs text-slate-600 mt-1">Audience: {a.audience}</div>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.risk_level === "critical" || a.risk_level === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{a.risk_level}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => decideApproval.mutate({ id: a.id, decision: "approve" })} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold">Approve</button>
                  <button onClick={() => decideApproval.mutate({ id: a.id, decision: "changes" })} className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-semibold">Changes</button>
                  <button onClick={() => decideApproval.mutate({ id: a.id, decision: "reject" })} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-semibold">Reject</button>
                </div>
              </div>
            ))}
            {!data?.approvals.length && <Empty text="No pending approvals. Automation remains approval-gated by default." />}
          </div>
        </Section>

        <Section title="Kill Switches" icon={PauseCircle}>
          <div className="space-y-3">
            {(data?.killSwitches ?? []).map((s) => (
              <div key={s.key} className={`rounded-2xl border p-4 ${s.enabled ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-xs text-slate-500">{s.scope} · {s.description}</div>
                    {s.reason && <div className="text-xs text-rose-700 mt-1">Reason: {s.reason}</div>}
                  </div>
                  <button
                    onClick={() => toggleSwitch.mutate({ key: s.key, enabled: !s.enabled, reason: !s.enabled ? "Manual admin pause" : "Manual admin resume" })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${s.enabled ? "bg-white text-rose-700 border border-rose-200" : "bg-slate-900 text-white"}`}
                  >
                    {s.enabled ? "Disable pause" : "Enable pause"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Production Readiness" icon={ShieldCheck}>
          <div className="space-y-3">
            {(data?.readiness ?? []).map((r) => (
              <div key={r.subsystem} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.subsystem.replaceAll("_", " ")}</div>
                    <div className="text-xs text-slate-500">P0: {r.p0_open} · P1: {r.p1_open} · {r.status}</div>
                  </div>
                  <div className={`text-xl font-display font-extrabold ${r.score >= 90 ? "text-emerald-600" : r.score >= 70 ? "text-amber-600" : "text-rose-600"}`}>{r.score}</div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${r.score >= 90 ? "bg-emerald-500" : r.score >= 70 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${r.score}%` }} />
                </div>
                {r.notes && <p className="text-xs text-slate-600 mt-2">{r.notes}</p>}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Daily Learning Brief" icon={Flag}>
          <div className="space-y-3">
            {(data?.briefs ?? []).slice(0, 3).map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">{b.brief_date}</div>
                <div className="grid gap-2 mt-2 text-sm">
                  <BriefLine label="Win" value={b.biggest_win} />
                  <BriefLine label="Miss" value={b.biggest_miss} />
                  <BriefLine label="Tomorrow" value={b.recommended_objective} />
                  <BriefLine label="Recovery" value={b.recovery_action} />
                </div>
              </div>
            ))}
            {!data?.briefs.length && <Empty text="No Hermes/n8n daily brief yet. Use the form to record one manually until automation is connected." />}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableSection title="Recent Revenue Checkpoints" rows={data?.checkpoints ?? []} />
        <LeadSection leads={data?.leads ?? []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <IcpSection icps={data?.icps ?? []} />
        <RevenueSourceSection sources={data?.revenueSources ?? []} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OpportunitySection opportunities={data?.opportunities ?? []} />
        <CampaignSection campaigns={data?.campaigns ?? []} />
      </div>

      <AutomationSection experiments={data?.experiments ?? []} runs={data?.automationRuns ?? []} />

      <GrowthCreationPanel createApproval={(input) => createApproval.mutate(input)} submittingApproval={createApproval.isPending} />
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode; icon: React.FC<{ className?: string }>; tone?: "ok" | "warn" }> = ({ label, value, icon: Icon, tone }) => (
  <div className={`card ${tone === "warn" ? "border border-amber-200 bg-amber-50" : tone === "ok" ? "border border-emerald-200 bg-emerald-50" : ""}`}>
    <div className="flex items-center justify-between">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="text-2xl font-display font-extrabold mt-2">{value}</div>
  </div>
);

const GateBanner: React.FC<{ overview?: GrowthOverview }> = ({ overview }) => {
  const allowed = overview?.summary.liveAutomationAllowed;
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${allowed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
      {allowed ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5" />}
      <div>
        <div className="font-bold">{allowed ? "Live automation allowed" : "Live automation blocked by production gates"}</div>
        <p className="text-sm text-slate-700">
          Requirement: readiness average 90+, no subsystem below 85, no P0/P1, no enabled blocking kill switches, and all outbound actions approval-gated.
        </p>
      </div>
    </div>
  );
};

const DailyOkrPanel: React.FC<{ overview?: GrowthOverview }> = ({ overview }) => {
  const okr = overview?.currentOkr;
  const progress = useMemo(() => {
    if (!okr?.base_revenue_usd) return 0;
    return Math.min(100, Math.round((Number(okr.actual_revenue_usd) / Number(okr.base_revenue_usd)) * 100));
  }, [okr]);
  return (
    <Section title="Today’s OKR" icon={Target}>
      {okr ? (
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500">{okr.okr_date} · {okr.objective_type} · {okr.status}</div>
            <h2 className="font-display font-bold text-2xl mt-1">{okr.objective}</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <MiniStat label="Base" value={usd(okr.base_revenue_usd)} />
            <MiniStat label="Stretch" value={usd(okr.stretch_revenue_usd)} />
            <MiniStat label="Over" value={usd(okr.over_revenue_usd)} />
            <MiniStat label="Actual" value={usd(okr.actual_revenue_usd)} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Base progress</span><span>{progress}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {(overview?.keyResults ?? []).map((kr) => (
              <div key={kr.id} className="rounded-xl bg-slate-50 p-3 text-sm flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{kr.label}</div>
                  <div className="text-xs text-slate-500">Base {kr.base_target} · Stretch {kr.stretch_target} · Over {kr.over_target} {kr.unit}</div>
                </div>
                <div className="font-bold">{kr.actual_value}</div>
              </div>
            ))}
          </div>
          {okr.recovery_required && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">Recovery day required: stop low-intent work and focus on conversion, direct outreach, demos, and closing.</div>}
        </div>
      ) : (
        <Empty text="No OKR for today yet. Create one to start daily tracking." />
      )}
    </Section>
  );
};

const QuickCreatePanel: React.FC = () => {
  const qc = useQueryClient();
  const [objective, setObjective] = useState("Collect first aggressive revenue signal and identify one conversion blocker");
  const [base, setBase] = useState(100);
  const [stretch, setStretch] = useState(500);
  const [over, setOver] = useState(1000);
  const [checkpoint, setCheckpoint] = useState({ amount: 0, description: "", type: "cash", segment: "consumer" });
  const [brief, setBrief] = useState({ win: "", miss: "", tomorrow: "", recovery: "" });
  const [score, setScore] = useState({ okrId: "", okrScore: 1, actualRevenueUsd: 0, actualPipelineUsd: 0, lessonsLearned: "", nextDayAdjustment: "" });

  const createOkr = useMutation({
    mutationFn: () => api("/admin/growth/daily-okrs", {
      method: "POST",
      body: JSON.stringify({
        okrDate: today(),
        objective,
        objectiveType: "revenue",
        baseRevenueUsd: base,
        stretchRevenueUsd: stretch,
        overRevenueUsd: over,
        keyResults: [
          { label: "Revenue collected", metricKey: "revenue_collected", unit: "usd", baseTarget: base, stretchTarget: stretch, overTarget: over },
          { label: "Qualified opportunities created", metricKey: "qualified_opportunities", unit: "count", baseTarget: 5, stretchTarget: 10, overTarget: 20 },
          { label: "Bugs fixed before promotion", metricKey: "bugs_fixed", unit: "count", baseTarget: 1, stretchTarget: 3, overTarget: 5 },
        ],
      }),
    }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["growth-overview"] }),
  });
  const addCheckpoint = useMutation({
    mutationFn: () => api("/admin/growth/revenue-checkpoints", {
      method: "POST",
      body: JSON.stringify({ amountUsd: checkpoint.amount, description: checkpoint.description, revenueType: checkpoint.type, segment: checkpoint.segment }),
    }),
    onSuccess: () => {
      setCheckpoint({ amount: 0, description: "", type: "cash", segment: "consumer" });
      void qc.invalidateQueries({ queryKey: ["growth-overview"] });
    },
  });
  const addBrief = useMutation({
    mutationFn: () => api("/admin/growth/agent-briefs", {
      method: "POST",
      body: JSON.stringify({
        briefDate: today(),
        biggestWin: brief.win,
        biggestMiss: brief.miss,
        recommendedObjective: brief.tomorrow,
        recoveryAction: brief.recovery,
      }),
    }),
    onSuccess: () => {
      setBrief({ win: "", miss: "", tomorrow: "", recovery: "" });
      void qc.invalidateQueries({ queryKey: ["growth-overview"] });
    },
  });
  const scoreOkr = useMutation({
    mutationFn: () => api(`/admin/growth/daily-okrs/${score.okrId}/score`, {
      method: "POST",
      body: JSON.stringify(score),
    }),
    onSuccess: () => {
      setScore({ okrId: "", okrScore: 1, actualRevenueUsd: 0, actualPipelineUsd: 0, lessonsLearned: "", nextDayAdjustment: "" });
      void qc.invalidateQueries({ queryKey: ["growth-overview"] });
    },
  });

  return (
    <Section title="Daily Control Inputs" icon={Rocket}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-slate-50 p-4">
          <h3 className="font-semibold mb-3">Create today’s OKR</h3>
          <textarea className="w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <NumberInput label="Base $" value={base} setValue={setBase} />
            <NumberInput label="Stretch $" value={stretch} setValue={setStretch} />
            <NumberInput label="Over $" value={over} setValue={setOver} />
          </div>
          <button onClick={() => createOkr.mutate()} disabled={createOkr.isPending} className="mt-3 bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2">
            {createOkr.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Save OKR
          </button>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <h3 className="font-semibold mb-3">Add revenue checkpoint</h3>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Amount $" value={checkpoint.amount} setValue={(v) => setCheckpoint((s) => ({ ...s, amount: v }))} />
            <select className="rounded-xl border border-slate-200 p-2 text-sm" value={checkpoint.type} onChange={(e) => setCheckpoint((s) => ({ ...s, type: e.target.value }))}>
              <option value="cash">Cash</option>
              <option value="signed_contract">Signed contract</option>
              <option value="pipeline">Pipeline</option>
            </select>
          </div>
          <input className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder="Evidence / description" value={checkpoint.description} onChange={(e) => setCheckpoint((s) => ({ ...s, description: e.target.value }))} />
          <button onClick={() => addCheckpoint.mutate()} disabled={addCheckpoint.isPending || !checkpoint.description || checkpoint.amount === 0} className="mt-3 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-semibold">Record checkpoint</button>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <h3 className="font-semibold mb-3">Record daily learning brief</h3>
          <input className="w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder="Biggest win" value={brief.win} onChange={(e) => setBrief((s) => ({ ...s, win: e.target.value }))} />
          <input className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder="Biggest miss" value={brief.miss} onChange={(e) => setBrief((s) => ({ ...s, miss: e.target.value }))} />
          <input className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder="Tomorrow objective" value={brief.tomorrow} onChange={(e) => setBrief((s) => ({ ...s, tomorrow: e.target.value }))} />
          <input className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder="Recovery action" value={brief.recovery} onChange={(e) => setBrief((s) => ({ ...s, recovery: e.target.value }))} />
          <button onClick={() => addBrief.mutate()} disabled={addBrief.isPending} className="mt-3 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-semibold">Save brief</button>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <h3 className="font-semibold mb-3">Score an OKR</h3>
          <input className="w-full rounded-xl border border-slate-200 p-2 text-sm font-mono" placeholder="OKR id" value={score.okrId} onChange={(e) => setScore((s) => ({ ...s, okrId: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <NumberInput label="Score 0-2" value={score.okrScore} setValue={(v) => setScore((s) => ({ ...s, okrScore: v }))} />
            <NumberInput label="Actual $" value={score.actualRevenueUsd} setValue={(v) => setScore((s) => ({ ...s, actualRevenueUsd: v }))} />
            <NumberInput label="Pipeline $" value={score.actualPipelineUsd} setValue={(v) => setScore((s) => ({ ...s, actualPipelineUsd: v }))} />
          </div>
          <input className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder="Lessons learned" value={score.lessonsLearned} onChange={(e) => setScore((s) => ({ ...s, lessonsLearned: e.target.value }))} />
          <input className="mt-2 w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder="Next-day adjustment" value={score.nextDayAdjustment} onChange={(e) => setScore((s) => ({ ...s, nextDayAdjustment: e.target.value }))} />
          <button onClick={() => scoreOkr.mutate()} disabled={scoreOkr.isPending || !score.okrId} className="mt-3 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-semibold">Save score</button>
        </div>
      </div>
    </Section>
  );
};

const GrowthCreationPanel: React.FC<{ createApproval: (input: { title: string; itemType: string; riskLevel: string; channel: string; audience: string; complianceNotes: string }) => void; submittingApproval: boolean }> = ({ createApproval, submittingApproval }) => {
  const qc = useQueryClient();
  const [opportunity, setOpportunity] = useState({ name: "", organization: "", segment: "partner", estimatedValueUsd: 10000, contactEmail: "", nextAction: "" });
  const [campaign, setCampaign] = useState({ name: "", channel: "email", audience: "", offer: "", hypothesis: "" });
  const [experiment, setExperiment] = useState({ name: "", category: "pricing", hypothesis: "", audience: "parents", offer: "Annual launch offer", channel: "landing_page" });
  const [suppression, setSuppression] = useState({ channel: "email", value: "", reason: "opt-out or do-not-contact request" });
  const [readiness, setReadiness] = useState({ subsystem: "app_funnel", score: 85, p0Open: 0, p1Open: 0, notes: "" });
  const [approval, setApproval] = useState({ title: "", itemType: "campaign", riskLevel: "medium", channel: "email", audience: "", complianceNotes: "" });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["growth-overview"] });
  const addOpportunity = useMutation({
    mutationFn: () => api("/admin/growth/opportunities", { method: "POST", body: JSON.stringify(opportunity) }),
    onSuccess: () => {
      setOpportunity({ name: "", organization: "", segment: "partner", estimatedValueUsd: 10000, contactEmail: "", nextAction: "" });
      invalidate();
    },
  });
  const addCampaign = useMutation({
    mutationFn: () => api("/admin/growth/campaigns", { method: "POST", body: JSON.stringify({ ...campaign, approvalRequired: true, dryRunRequired: true }) }),
    onSuccess: () => {
      setCampaign({ name: "", channel: "email", audience: "", offer: "", hypothesis: "" });
      invalidate();
    },
  });
  const addExperiment = useMutation({
    mutationFn: () => api("/admin/growth/experiments", { method: "POST", body: JSON.stringify(experiment) }),
    onSuccess: () => {
      setExperiment({ name: "", category: "pricing", hypothesis: "", audience: "parents", offer: "Annual launch offer", channel: "landing_page" });
      invalidate();
    },
  });
  const addSuppression = useMutation({
    mutationFn: () => api("/admin/growth/suppression", { method: "POST", body: JSON.stringify(suppression) }),
    onSuccess: () => {
      setSuppression({ channel: "email", value: "", reason: "opt-out or do-not-contact request" });
      invalidate();
    },
  });
  const updateReadiness = useMutation({
    mutationFn: () => api("/admin/growth/readiness", { method: "POST", body: JSON.stringify(readiness) }),
    onSuccess: invalidate,
  });

  return (
    <Section title="Manual Growth Inputs" icon={ClipboardCheck}>
      <div className="grid gap-4 xl:grid-cols-3">
        <FormCard title="Opportunity">
          <TextInput placeholder="Name" value={opportunity.name} onChange={(v) => setOpportunity((s) => ({ ...s, name: v }))} />
          <TextInput placeholder="Organization" value={opportunity.organization} onChange={(v) => setOpportunity((s) => ({ ...s, organization: v }))} />
          <TextInput placeholder="Contact email" value={opportunity.contactEmail} onChange={(v) => setOpportunity((s) => ({ ...s, contactEmail: v }))} />
          <NumberInput label="Estimated $" value={opportunity.estimatedValueUsd} setValue={(v) => setOpportunity((s) => ({ ...s, estimatedValueUsd: v }))} />
          <TextInput placeholder="Next action" value={opportunity.nextAction} onChange={(v) => setOpportunity((s) => ({ ...s, nextAction: v }))} />
          <ActionButton onClick={() => addOpportunity.mutate()} disabled={!opportunity.name || addOpportunity.isPending}>Add opportunity</ActionButton>
        </FormCard>

        <FormCard title="Campaign">
          <TextInput placeholder="Campaign name" value={campaign.name} onChange={(v) => setCampaign((s) => ({ ...s, name: v }))} />
          <TextInput placeholder="Audience" value={campaign.audience} onChange={(v) => setCampaign((s) => ({ ...s, audience: v }))} />
          <TextInput placeholder="Offer" value={campaign.offer} onChange={(v) => setCampaign((s) => ({ ...s, offer: v }))} />
          <TextInput placeholder="Hypothesis" value={campaign.hypothesis} onChange={(v) => setCampaign((s) => ({ ...s, hypothesis: v }))} />
          <ActionButton onClick={() => addCampaign.mutate()} disabled={!campaign.name || !campaign.audience || !campaign.offer || addCampaign.isPending}>Create approval-gated campaign</ActionButton>
        </FormCard>

        <FormCard title="Experiment">
          <TextInput placeholder="Experiment name" value={experiment.name} onChange={(v) => setExperiment((s) => ({ ...s, name: v }))} />
          <TextInput placeholder="Hypothesis" value={experiment.hypothesis} onChange={(v) => setExperiment((s) => ({ ...s, hypothesis: v }))} />
          <TextInput placeholder="Audience" value={experiment.audience} onChange={(v) => setExperiment((s) => ({ ...s, audience: v }))} />
          <TextInput placeholder="Offer" value={experiment.offer} onChange={(v) => setExperiment((s) => ({ ...s, offer: v }))} />
          <ActionButton onClick={() => addExperiment.mutate()} disabled={!experiment.name || !experiment.hypothesis || addExperiment.isPending}>Add experiment</ActionButton>
        </FormCard>

        <FormCard title="Suppression">
          <TextInput placeholder="Email/domain/handle to suppress" value={suppression.value} onChange={(v) => setSuppression((s) => ({ ...s, value: v }))} />
          <TextInput placeholder="Reason" value={suppression.reason} onChange={(v) => setSuppression((s) => ({ ...s, reason: v }))} />
          <ActionButton onClick={() => addSuppression.mutate()} disabled={!suppression.value || !suppression.reason || addSuppression.isPending}>Add suppression</ActionButton>
        </FormCard>

        <FormCard title="Readiness">
          <TextInput placeholder="Subsystem" value={readiness.subsystem} onChange={(v) => setReadiness((s) => ({ ...s, subsystem: v }))} />
          <div className="grid grid-cols-3 gap-2">
            <NumberInput label="Score" value={readiness.score} setValue={(v) => setReadiness((s) => ({ ...s, score: v }))} />
            <NumberInput label="P0" value={readiness.p0Open} setValue={(v) => setReadiness((s) => ({ ...s, p0Open: v }))} />
            <NumberInput label="P1" value={readiness.p1Open} setValue={(v) => setReadiness((s) => ({ ...s, p1Open: v }))} />
          </div>
          <TextInput placeholder="Notes" value={readiness.notes} onChange={(v) => setReadiness((s) => ({ ...s, notes: v }))} />
          <ActionButton onClick={() => updateReadiness.mutate()} disabled={!readiness.subsystem || updateReadiness.isPending}>Update readiness</ActionButton>
        </FormCard>

        <FormCard title="Approval Request">
          <TextInput placeholder="Title" value={approval.title} onChange={(v) => setApproval((s) => ({ ...s, title: v }))} />
          <TextInput placeholder="Audience" value={approval.audience} onChange={(v) => setApproval((s) => ({ ...s, audience: v }))} />
          <TextInput placeholder="Compliance notes" value={approval.complianceNotes} onChange={(v) => setApproval((s) => ({ ...s, complianceNotes: v }))} />
          <ActionButton onClick={() => createApproval(approval)} disabled={!approval.title || submittingApproval}>Create approval</ActionButton>
        </FormCard>
      </div>
    </Section>
  );
};

const Section: React.FC<{ title: string; icon: React.FC<{ className?: string }>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <section className="card">
    <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2"><Icon className="w-5 h-5 text-primary" /> {title}</h2>
    {children}
  </section>
);

const MiniStat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="font-display font-bold text-lg">{value}</div>
  </div>
);

const NumberInput: React.FC<{ label: string; value: number; setValue: (v: number) => void }> = ({ label, value, setValue }) => (
  <label className="text-xs font-semibold text-slate-600">
    {label}
    <input className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
  </label>
);

const TextInput: React.FC<{ placeholder: string; value: string; onChange: (value: string) => void }> = ({ placeholder, value, onChange }) => (
  <input className="w-full rounded-xl border border-slate-200 p-2 text-sm" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
);

const FormCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
    <h3 className="font-semibold">{title}</h3>
    {children}
  </div>
);

const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} className="mt-1 bg-slate-900 disabled:bg-slate-300 text-white rounded-xl px-4 py-2 text-sm font-semibold">
    {children}
  </button>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">{text}</div>
);

const BriefLine: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div><span className="font-semibold">{label}:</span> <span className="text-slate-700">{value || "—"}</span></div>
);

const TableSection: React.FC<{ title: string; rows: RevenueCheckpoint[] }> = ({ title, rows }) => (
  <Section title={title} icon={TrendingUp}>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3">Amount</th></tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{r.checkpoint_date}</td>
              <td className="px-4 py-3">{r.revenue_type}</td>
              <td className="px-4 py-3">{r.segment}</td>
              <td className="px-4 py-3 font-bold">{usd(r.amount_usd)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No checkpoints yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </Section>
);

const LeadSection: React.FC<{ leads: Lead[] }> = ({ leads }) => (
  <Section title="Recent Leads" icon={Flag}>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3">Magnet</th><th className="px-4 py-3">When</th></tr>
        </thead>
        <tbody>
          {leads.slice(0, 10).map((lead) => (
            <tr key={lead.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{lead.email}</td>
              <td className="px-4 py-3">{lead.segment}</td>
              <td className="px-4 py-3">{lead.lead_magnet}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(lead.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {!leads.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No leads captured yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </Section>
);

const IcpSection: React.FC<{ icps: IcpDefinition[] }> = ({ icps }) => (
  <Section title="ICP Definitions" icon={Target}>
    <div className="space-y-2">
      {icps.map((icp) => (
        <div key={icp.id} className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{icp.name}</div>
              <div className="text-xs text-slate-500">{icp.segment} · priority {icp.priority}</div>
              <p className="text-xs text-slate-600 mt-1">{icp.positioning}</p>
            </div>
          </div>
        </div>
      ))}
      {!icps.length && <Empty text="No ICP definitions seeded yet." />}
    </div>
  </Section>
);

const RevenueSourceSection: React.FC<{ sources: RevenueSource[] }> = ({ sources }) => (
  <Section title="Revenue Source Tests" icon={TrendingUp}>
    <div className="space-y-2">
      {sources.slice(0, 12).map((source) => (
        <div key={source.id} className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{source.name}</div>
              <div className="text-xs text-slate-500">{source.category} · {source.segment} · {source.target_price ?? "price TBD"}</div>
              <p className="text-xs text-slate-600 mt-1">{source.success_metric}</p>
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">{source.status}</span>
          </div>
        </div>
      ))}
      {!sources.length && <Empty text="No revenue sources seeded yet." />}
    </div>
  </Section>
);

const OpportunitySection: React.FC<{ opportunities: Opportunity[] }> = ({ opportunities }) => (
  <Section title="Opportunity Radar" icon={Target}>
    <div className="space-y-2">
      {opportunities.slice(0, 10).map((opp) => (
        <div key={opp.id} className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="font-semibold">{opp.name}</div>
          <div className="text-xs text-slate-500">{opp.organization ?? "No org"} · {opp.segment} · {usd(opp.estimated_value_usd)} · {opp.stage}</div>
        </div>
      ))}
      {!opportunities.length && <Empty text="No opportunities yet." />}
    </div>
  </Section>
);

const CampaignSection: React.FC<{ campaigns: Campaign[] }> = ({ campaigns }) => (
  <Section title="Campaign Calendar" icon={Rocket}>
    <div className="space-y-2">
      {campaigns.slice(0, 10).map((campaign) => (
        <div key={campaign.id} className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="font-semibold">{campaign.name}</div>
          <div className="text-xs text-slate-500">{campaign.channel} · {campaign.status}</div>
          <div className="text-xs text-slate-600 mt-1">Offer: {campaign.offer}</div>
        </div>
      ))}
      {!campaigns.length && <Empty text="No campaigns yet." />}
    </div>
  </Section>
);

const AutomationSection: React.FC<{ experiments: Experiment[]; runs: AutomationRun[] }> = ({ experiments, runs }) => (
  <Section title="Experiment And Automation Health" icon={Flag}>
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="font-semibold mb-2">Experiments</h3>
        <div className="space-y-2">
          {experiments.slice(0, 6).map((e) => (
            <div key={e.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="font-semibold">{e.name}</div>
              <div className="text-xs text-slate-500">{e.category} · {e.status}</div>
            </div>
          ))}
          {!experiments.length && <Empty text="No experiments recorded." />}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Automation runs</h3>
        <div className="space-y-2">
          {runs.slice(0, 6).map((r) => (
            <div key={r.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="font-semibold">{r.system}: {r.workflow_key}</div>
              <div className="text-xs text-slate-500">{r.status} · {r.dry_run ? "dry run" : "live"} · {new Date(r.created_at).toLocaleString()}</div>
              {r.error && <div className="text-xs text-rose-700 mt-1">{r.error}</div>}
            </div>
          ))}
          {!runs.length && <Empty text="No automation runs yet. Live sends should remain blocked until dry runs pass." />}
        </div>
      </div>
    </div>
  </Section>
);
