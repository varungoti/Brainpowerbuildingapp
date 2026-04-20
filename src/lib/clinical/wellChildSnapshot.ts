/**
 * Survivor 6 — Clinical Wedge.
 *
 * Generates a one-page well-child neurodevelopmental snapshot. This is
 * deliberately HTML-string-based: we render it in a hidden iframe and
 * use `window.print()` to PDF, so we keep the bundle dependency-free.
 * The same template is used by `partners.neurospark.com` to generate
 * server-side PDFs via Puppeteer.
 *
 * Compliance posture:
 *   - Developmental, not medical. We never suggest a diagnosis.
 *   - Shows raw numbers + a 90 % credible interval, not a "score".
 *   - Always carries the disclaimer footer.
 *   - Only includes data the parent has consented to share (see
 *     Survivor 3's COPPA 2.0 plumbing).
 */
import type { ActivityLog, ChildProfile } from "../../app/context/AppContext";
import { predictBayesianMilestones, type BayesianPrediction } from "../milestones/bayesianPredictor";

export const WELL_CHILD_VISIT_AGES_MONTHS = [9, 12, 15, 18, 24, 30, 36, 48, 60] as const;
export type WellChildAnchor = (typeof WELL_CHILD_VISIT_AGES_MONTHS)[number];

export interface WellChildSnapshotData {
  child: ChildProfile;
  generatedAt: string;
  /** Pediatric anchor visit this snapshot is being prepared for. */
  anchor: WellChildAnchor;
  /** All milestone predictions, sorted oldest-expected first. */
  predictions: BayesianPrediction[];
  /** Highest 5 brain regions by recent activity count, last 30 days. */
  topRegions: { region: string; count: number }[];
  /** Lowest 3 brain regions by recent activity count, last 30 days. */
  underservedRegions: { region: string; count: number }[];
  /** Total minutes of practice in the snapshot window (last 30 days). */
  totalPracticeMinutes: number;
}

function regionCounts(logs: ActivityLog[], days: number): Record<string, number> {
  const cutoff = Date.now() - days * 86400000;
  const counts: Record<string, number> = {};
  for (const l of logs) {
    if (!l.completed || new Date(l.date).getTime() < cutoff) continue;
    counts[l.region] = (counts[l.region] ?? 0) + 1;
  }
  return counts;
}

function nearestAnchor(ageMonths: number): WellChildAnchor {
  let best: WellChildAnchor = WELL_CHILD_VISIT_AGES_MONTHS[0];
  let bestD = Infinity;
  for (const a of WELL_CHILD_VISIT_AGES_MONTHS) {
    const d = Math.abs(a - ageMonths);
    if (d < bestD) {
      best = a;
      bestD = d;
    }
  }
  return best;
}

export function buildSnapshotData(
  child: ChildProfile,
  logs: ActivityLog[],
  observedAcquired: string[] = [],
): WellChildSnapshotData {
  const dob = new Date(child.dob);
  const now = new Date();
  const ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  const anchor = nearestAnchor(ageMonths);

  const predictions = predictBayesianMilestones(child, logs, observedAcquired)
    .sort((a, b) => a.expectedAgeMonths - b.expectedAgeMonths);

  const counts = regionCounts(logs, 30);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topRegions = sorted.slice(0, 5).map(([region, count]) => ({ region, count }));
  const underservedRegions = sorted.slice(-3).map(([region, count]) => ({ region, count }));

  const cutoff = Date.now() - 30 * 86400000;
  const totalPracticeMinutes = logs
    .filter((l) => l.completed && new Date(l.date).getTime() > cutoff)
    .reduce((s, l) => s + (l.duration ?? 0), 0);

  return {
    child,
    generatedAt: now.toISOString(),
    anchor,
    predictions,
    topRegions,
    underservedRegions,
    totalPracticeMinutes,
  };
}

/** Renders the snapshot as a self-contained HTML document. Safe to inject
 * into an iframe and print, or to render server-side with Puppeteer. */
export function renderSnapshotHtml(d: WellChildSnapshotData): string {
  const verdictColor = (v: BayesianPrediction["verdict"]) => {
    switch (v) {
      case "above-trajectory": return "#16a34a";
      case "on-trajectory":   return "#0ea5e9";
      case "monitor":         return "#f59e0b";
      case "consult-pediatrician": return "#dc2626";
    }
  };
  const verdictLabel = (v: BayesianPrediction["verdict"]) => {
    switch (v) {
      case "above-trajectory":     return "Above";
      case "on-trajectory":        return "On";
      case "monitor":              return "Monitor";
      case "consult-pediatrician": return "Discuss";
    }
  };
  const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

  const rows = d.predictions
    .filter((p) => Math.abs(p.expectedAgeMonths - d.anchor) <= 12)
    .map((p) => `
      <tr>
        <td style="padding:6px 8px;">${escape(p.title)}</td>
        <td style="padding:6px 8px; text-align:center; color:#475569;">${p.expectedAgeMonths} mo</td>
        <td style="padding:6px 8px; text-align:center;">${Math.round(p.posteriorMean * 100)}%</td>
        <td style="padding:6px 8px; text-align:center; color:#64748b;">
          ${Math.round(p.credibleInterval90[0] * 100)}–${Math.round(p.credibleInterval90[1] * 100)}%
        </td>
        <td style="padding:6px 8px; text-align:center;">
          <span style="background:${verdictColor(p.verdict)}; color:white; border-radius:999px; padding:2px 10px; font-size:11px;">
            ${verdictLabel(p.verdict)}
          </span>
        </td>
      </tr>`).join("");

  const topRegionsList = d.topRegions
    .map((r) => `<li style="margin-bottom:2px;"><strong>${escape(r.region)}</strong> — ${r.count} sessions</li>`)
    .join("");
  const underList = d.underservedRegions
    .map((r) => `<li style="margin-bottom:2px;"><strong>${escape(r.region)}</strong> — ${r.count} sessions</li>`)
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>Well-child snapshot — ${escape(d.child.name)} — ${d.anchor} mo</title>
<style>
  body { font-family: -apple-system, system-ui, "Segoe UI", Inter, sans-serif; color:#0f172a; padding:32px; max-width:760px; margin:0 auto; font-size:13px; }
  h1 { font-size:20px; margin:0 0 4px 0; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; margin:20px 0 8px 0; }
  table { border-collapse:collapse; width:100%; font-size:12px; }
  th { text-align:left; background:#f1f5f9; padding:6px 8px; font-weight:600; color:#475569; }
  tr { border-bottom:1px solid #e2e8f0; }
  .meta { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
  .lozenge { background:#eef2ff; color:#3730a3; border-radius:999px; padding:2px 10px; font-size:11px; font-weight:600; }
  ul { margin:0; padding-left:18px; }
  .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e2e8f0; color:#64748b; font-size:10px; line-height:1.5; }
</style></head>
<body>
  <div class="meta">
    <div>
      <h1>Neurodevelopmental snapshot — ${escape(d.child.name)}</h1>
      <div style="color:#64748b;">Prepared for the <strong>${d.anchor}-month</strong> well-child visit. Date of birth ${new Date(d.child.dob).toLocaleDateString()}.</div>
    </div>
    <div>
      <div class="lozenge">NeuroSpark snapshot</div>
      <div style="margin-top:6px; color:#94a3b8; font-size:10px;">Generated ${new Date(d.generatedAt).toLocaleString()}</div>
    </div>
  </div>

  <h2>Last 30 days at a glance</h2>
  <div style="display:flex; gap:16px;">
    <div style="flex:1;">
      <div style="font-size:11px; color:#64748b;">Practice volume</div>
      <div style="font-size:22px; font-weight:700;">${d.totalPracticeMinutes.toLocaleString()} min</div>
    </div>
    <div style="flex:1;">
      <div style="font-size:11px; color:#64748b;">Top brain regions</div>
      <ul>${topRegionsList || "<li style=\"color:#94a3b8\">No logged sessions in the last 30 days.</li>"}</ul>
    </div>
    <div style="flex:1;">
      <div style="font-size:11px; color:#64748b;">Underserved regions</div>
      <ul>${underList || "<li style=\"color:#94a3b8\">All regions covered.</li>"}</ul>
    </div>
  </div>

  <h2>Milestones near the ${d.anchor}-month anchor</h2>
  <table>
    <thead><tr>
      <th>Milestone</th>
      <th style="text-align:center">Typical</th>
      <th style="text-align:center">Posterior</th>
      <th style="text-align:center">90 % CI</th>
      <th style="text-align:center">Trajectory</th>
    </tr></thead>
    <tbody>${rows || `<tr><td colspan="5" style="padding:10px; text-align:center; color:#94a3b8;">No milestones in the ±12-month window for this anchor.</td></tr>`}</tbody>
  </table>

  <div class="footer">
    <strong>Important:</strong> This snapshot is a developmental observation report based on caregiver-logged activity in the NeuroSpark app. It is <em>not</em> a clinical diagnosis or a substitute for professional pediatric assessment. The Bayesian posteriors shown are derived from a normative age curve combined with observed brain-region practice; they are intended to support the conversation between you and your pediatrician, not to replace it. NeuroSpark is registered as a developmental-wellness application and is not regulated as a medical device.
    <br/><br/>
    Compliance: COPPA 2.0 (Apr 22 2026), HIPAA-aligned data handling for parent-shared snapshots only.
  </div>
</body></html>`;
}

/** Trigger a print dialog for the snapshot from anywhere in the app. */
export function downloadSnapshotPdf(d: WellChildSnapshotData): void {
  if (typeof window === "undefined") return;
  const html = renderSnapshotHtml(d);
  const w = window.open("", "_blank");
  if (!w) {
    alert("Pop-ups are blocked — allow them for NeuroSpark to download the snapshot.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
