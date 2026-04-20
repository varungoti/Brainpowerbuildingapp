/**
 * Survivor 6 — Clinical Wedge.
 *
 * Bayesian milestone predictor: a small Beta-Binomial update over a
 * normative "expected acquisition" prior, conditioned on observed
 * brain-region practice. Returns a 90 % credible interval and an
 * on/above/below-trajectory verdict for the well-child snapshot PDF.
 *
 * The math is intentionally simple — vendors can swap a richer model
 * later. The clinical value is the rubric + the audit trail, not the
 * cleverness of the algorithm. (Same architectural stance as
 * `@neurospark/ai-age` Survivor 5.)
 */
import type { ActivityLog, ChildProfile } from "../../app/context/AppContext";
import { DEVELOPMENTAL_MILESTONES } from "./milestonePredictor";

export interface BayesianPrediction {
  milestoneId: string;
  title: string;
  expectedAgeMonths: number;
  childAgeMonths: number;
  /** Posterior mean probability the milestone is acquired by today. 0..1. */
  posteriorMean: number;
  /** 90 % credible interval, [low, high]. */
  credibleInterval90: [number, number];
  /** How many region-specific activities we observed in the last 90 days. */
  practiceCount: number;
  /** Verdict for the parent / pediatrician. */
  verdict: "above-trajectory" | "on-trajectory" | "monitor" | "consult-pediatrician";
  /** Plain-language sentence for the snapshot PDF. */
  sentence: string;
}

function ageMonths(dob: string): number {
  const b = new Date(dob);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

function logisticPrior(childAge: number, expectedAge: number, slope = 0.3): number {
  return 1 / (1 + Math.exp(-slope * (childAge - expectedAge)));
}

function betaQuantile(alpha: number, beta: number, p: number): number {
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const v = regIncBeta(alpha, beta, mid);
    if (v < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function regIncBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = lnBeta(a, b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  const cf = betaCF(a, b, x);
  return front * cf;
}

function lnBeta(a: number, b: number): number {
  return lnGamma(a) + lnGamma(b) - lnGamma(a + b);
}

function lnGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaCF(a: number, b: number, x: number): number {
  const maxIter = 200;
  const eps = 3e-7;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function practiceForRegions(logs: ActivityLog[], regions: string[], days = 90): number {
  const cutoff = Date.now() - days * 86400000;
  return logs.filter(
    (l) =>
      l.completed &&
      new Date(l.date).getTime() > cutoff &&
      l.intelligences.some((i) => regions.includes(i)),
  ).length;
}

export function predictBayesianMilestones(
  child: ChildProfile,
  logs: ActivityLog[],
  observedAcquired: string[] = [],
): BayesianPrediction[] {
  const childAge = ageMonths(child.dob);
  return DEVELOPMENTAL_MILESTONES.map((m) => {
    const acquired = observedAcquired.includes(m.id);
    const practice = practiceForRegions(logs, m.brainRegions, 90);
    const prior = logisticPrior(childAge, m.expectedAgeMonths);

    // Beta(α, β) prior derived from the normative logistic. effSize = 6
    // observations of "weight" so 5+ recent practice sessions visibly shift
    // the posterior, matching pediatric clinical intuition.
    const effSize = 6;
    const alpha0 = prior * effSize + 1;
    const beta0 = (1 - prior) * effSize + 1;

    const successes = acquired ? 4 : Math.min(practice, 12) * 0.35;
    const failures = acquired ? 0 : Math.max(0, 4 - successes * 0.5);
    const alpha = alpha0 + successes;
    const beta = beta0 + failures;

    const posteriorMean = alpha / (alpha + beta);
    const lo = betaQuantile(alpha, beta, 0.05);
    const hi = betaQuantile(alpha, beta, 0.95);

    let verdict: BayesianPrediction["verdict"];
    if (acquired || posteriorMean >= 0.85) verdict = "above-trajectory";
    else if (posteriorMean >= 0.55) verdict = "on-trajectory";
    else if (childAge <= m.expectedAgeMonths + 3) verdict = "monitor";
    else verdict = "consult-pediatrician";

    const sentence = (() => {
      const pct = Math.round(posteriorMean * 100);
      const loP = Math.round(lo * 100);
      const hiP = Math.round(hi * 100);
      switch (verdict) {
        case "above-trajectory":
          return `${child.name} appears to have acquired "${m.title}" (${pct} %, 90 % CI ${loP}–${hiP} %).`;
        case "on-trajectory":
          return `${child.name} is on trajectory for "${m.title}" — observed practice supports a ${pct} % posterior (90 % CI ${loP}–${hiP} %).`;
        case "monitor":
          return `${child.name}'s posterior for "${m.title}" is ${pct} % (90 % CI ${loP}–${hiP} %). Within the expected window — monitor with the suggested activities.`;
        case "consult-pediatrician":
          return `${child.name} is past the typical age window for "${m.title}" (posterior ${pct} %, 90 % CI ${loP}–${hiP} %). Worth raising at the next well-child visit; not a diagnosis.`;
      }
    })();

    return {
      milestoneId: m.id,
      title: m.title,
      expectedAgeMonths: m.expectedAgeMonths,
      childAgeMonths: childAge,
      posteriorMean,
      credibleInterval90: [lo, hi],
      practiceCount: practice,
      verdict,
      sentence,
    };
  });
}
