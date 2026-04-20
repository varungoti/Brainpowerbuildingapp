import type { ActivityLog, ChildProfile } from "../../app/context/AppContext";
import { BRAIN_REGIONS } from "../../app/data/brainRegions";

export interface MilestonePrediction {
  milestoneId: string;
  title: string;
  expectedDate: string;
  confidencePercent: number;
  status: "on-track" | "needs-attention" | "at-risk";
  recommendedActivities: string[];
  requiredRegions: string[];
}

interface MilestoneSpec {
  id: string;
  title: string;
  expectedAgeMonths: number;
  brainRegions: string[];
}

const DEVELOPMENTAL_MILESTONES: MilestoneSpec[] = [
  { id: "m_first_words", title: "First meaningful words", expectedAgeMonths: 12, brainRegions: ["Linguistic", "Pronunciation"] },
  { id: "m_walk", title: "Walking independently", expectedAgeMonths: 14, brainRegions: ["Bodily-Kinesthetic", "Coordination"] },
  { id: "m_two_word", title: "Two-word phrases", expectedAgeMonths: 24, brainRegions: ["Linguistic", "Executive Function"] },
  { id: "m_pretend_play", title: "Pretend / imaginative play", expectedAgeMonths: 30, brainRegions: ["Creative", "Intrapersonal"] },
  { id: "m_color_naming", title: "Naming basic colors", expectedAgeMonths: 36, brainRegions: ["Spatial-Visual", "Linguistic"] },
  { id: "m_sharing", title: "Sharing with peers", expectedAgeMonths: 36, brainRegions: ["Interpersonal", "Emotional"] },
  { id: "m_counting_10", title: "Counting to 10", expectedAgeMonths: 42, brainRegions: ["Logical-Mathematical", "Executive Function"] },
  { id: "m_first_story", title: "Telling a simple story", expectedAgeMonths: 48, brainRegions: ["Linguistic", "Creative", "Executive Function"] },
  { id: "m_ride_bike", title: "Riding a tricycle / balance bike", expectedAgeMonths: 42, brainRegions: ["Bodily-Kinesthetic", "Coordination"] },
  { id: "m_empathy", title: "Showing empathy for others", expectedAgeMonths: 48, brainRegions: ["Emotional", "Interpersonal"] },
  { id: "m_pattern_recognition", title: "Recognizing patterns", expectedAgeMonths: 54, brainRegions: ["Logical-Mathematical", "Spatial-Visual"] },
  { id: "m_read_letters", title: "Reading individual letters", expectedAgeMonths: 60, brainRegions: ["Linguistic", "Spatial-Visual"] },
  { id: "m_nature_classify", title: "Classifying plants / animals", expectedAgeMonths: 60, brainRegions: ["Naturalist", "Logical-Mathematical"] },
  { id: "m_rhythm", title: "Keeping a beat / rhythm", expectedAgeMonths: 48, brainRegions: ["Musical-Rhythmic", "Coordination"] },
  { id: "m_self_regulation", title: "Emotional self-regulation", expectedAgeMonths: 60, brainRegions: ["Executive Function", "Emotional", "Intrapersonal"] },
  { id: "m_digital_basics", title: "Basic digital interaction", expectedAgeMonths: 54, brainRegions: ["Digital-Technological", "Logical-Mathematical"] },
  { id: "m_existential_questions", title: "Asking 'why' questions", expectedAgeMonths: 42, brainRegions: ["Existential", "Linguistic"] },
];

function monthsBetween(dob: string, now: Date): number {
  const birth = new Date(dob);
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function computeScoreVelocity(logs: ActivityLog[], regions: string[], windowDays: number): number {
  const cutoff = Date.now() - windowDays * 86400000;
  const recent = logs.filter(l => l.completed && new Date(l.date).getTime() > cutoff);
  const regionHits = recent.filter(l => l.intelligences.some(i => regions.includes(i)));
  if (regionHits.length === 0) return 0;
  const months = windowDays / 30;
  return regionHits.length / Math.max(months, 1);
}

function findActivitiesForRegions(regions: string[], ageTier: number): string[] {
  return regions.flatMap(r => {
    const region = BRAIN_REGIONS.find(br => br.key === r);
    return region ? [`region-${region.id}-t${ageTier}`] : [];
  }).slice(0, 5);
}

export function predictMilestones(
  child: ChildProfile,
  logs: ActivityLog[],
  checkedMilestones: string[] = [],
): MilestonePrediction[] {
  const now = new Date();
  const ageMonths = monthsBetween(child.dob, now);
  const unchecked = DEVELOPMENTAL_MILESTONES.filter(m => !checkedMilestones.includes(m.id));

  return unchecked
    .filter(m => m.expectedAgeMonths >= ageMonths - 6 && m.expectedAgeMonths <= ageMonths + 12)
    .map(m => {
      const requiredRegions = m.brainRegions;
      const avgScore = requiredRegions.reduce((sum, r) =>
        sum + (child.intelligenceScores[r] ?? 0), 0) / requiredRegions.length;
      const velocity = computeScoreVelocity(logs, requiredRegions, 30);
      const targetScore = 10;
      const gapToTarget = Math.max(0, targetScore - avgScore);
      const monthsNeeded = gapToTarget / Math.max(velocity, 0.5);
      const monthsUntilExpected = Math.max(1, m.expectedAgeMonths - ageMonths);

      let status: MilestonePrediction["status"];
      if (avgScore >= targetScore || monthsNeeded <= monthsUntilExpected * 0.8) {
        status = "on-track";
      } else if (monthsNeeded <= monthsUntilExpected * 1.2) {
        status = "needs-attention";
      } else {
        status = "at-risk";
      }

      return {
        milestoneId: m.id,
        title: m.title,
        expectedDate: new Date(now.getTime() + monthsUntilExpected * 30 * 86400000).toISOString(),
        confidencePercent: Math.min(100, Math.round((Math.min(velocity, 2) / 2) * 100)),
        status,
        recommendedActivities: findActivitiesForRegions(requiredRegions, child.ageTier),
        requiredRegions,
      };
    })
    .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
}

export { DEVELOPMENTAL_MILESTONES };
