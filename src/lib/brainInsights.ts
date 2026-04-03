import {
  BRAIN_REGIONS,
  getSortedBrainRegionProgress,
  type BrainRegion,
} from "@/lib/brainRegions";

export type BrainInsight = {
  type: "strength" | "improvement";
  regionId: string;
  regionKey: string;
  text: string;
};

function buildStrengthText(region: BrainRegion): string {
  switch (region.key) {
    case "Creative":
      return "Creative thinking is leading right now. Keep it growing with open-ended drawing, storytelling, pretend play, and design challenges.";
    case "Logical-Mathematical":
      return "Logical-mathematical skills are a standout. Lean into pattern games, counting challenges, puzzle solving, and simple science experiments.";
    case "Linguistic":
      return "Language development is strong. Build on it with read-alouds, rhyming games, narration, and everyday conversation prompts.";
    case "Bodily-Kinesthetic":
      return "Bodily-kinesthetic intelligence is a major strength. Support it with obstacle courses, dance, sports drills, and hands-on building tasks.";
    case "Emotional":
      return "Emotional intelligence is showing up well. Reinforce it with reflection prompts, emotion naming, empathy stories, and calm-down routines.";
    case "Interpersonal":
      return "Social intelligence is thriving. Group games, collaborative projects, and turn-taking activities will help it keep compounding.";
    case "Intrapersonal":
      return "Self-awareness is a clear strength. Journaling, mindfulness, and quiet reflection rituals are especially high value here.";
    case "Spatial-Visual":
      return "Spatial-visual processing is a strong asset. Try block design, map play, sketching, and visual problem-solving activities.";
    case "Musical-Rhythmic":
      return "Musical-rhythmic intelligence is ahead. Rhythm copying, singing, percussion play, and movement-to-music will deepen it.";
    case "Naturalist":
      return "Naturalist intelligence is active. Nature walks, classification games, gardening, and observation journals are ideal next steps.";
    case "Digital-Technological":
      return "Digital-technological thinking is emerging as a strength. Channel it with sequencing games, simple coding logic, and systems-based play.";
    case "Pronunciation":
      return "Speech and pronunciation are progressing well. Keep momentum with phonics play, repetition games, and playful articulation practice.";
    case "Coordination":
      return "Coordination is looking strong. Fine-motor crafts, catching games, tracing, and hand-eye routines will reinforce it.";
    case "Existential":
      return "Wonder-driven thinking is a bright spot. Encourage big questions, reflection, and story-based conversations about meaning and curiosity.";
    default:
      return `${region.name} is currently a leading strength. Keep giving it varied, playful repetition so it stays transferable across activities.`;
  }
}

function buildImprovementText(region: BrainRegion): string {
  switch (region.key) {
    case "Creative":
      return "Creative growth looks like the next opportunity. Add more drawing, story invention, open-ended craft, and imaginative role play.";
    case "Logical-Mathematical":
      return "Logical-mathematical growth would benefit from more puzzles, sorting, sequencing, counting games, and cause-effect exploration.";
    case "Linguistic":
      return "Language can be strengthened with extra reading aloud, conversation turns, word games, and storytelling practice.";
    case "Bodily-Kinesthetic":
      return "Bodily-kinesthetic development needs more movement-rich practice. Try sports, balancing games, yoga, dance, and tactile making.";
    case "Emotional":
      return "Emotional development can grow through co-regulation, naming feelings, role-play, and gentle reflection after daily events.";
    case "Interpersonal":
      return "Interpersonal skills need more cooperative reps. Prioritize partner games, shared goals, group routines, and guided social play.";
    case "Intrapersonal":
      return "Intrapersonal awareness can improve with quiet check-ins, journaling, mindfulness, and helping the child describe inner states.";
    case "Spatial-Visual":
      return "Spatial-visual thinking can improve through map play, block builds, tangrams, drawing from observation, and visual planning tasks.";
    case "Musical-Rhythmic":
      return "Musical-rhythmic growth needs more rhythm exposure. Add clapping patterns, singing, instruments, and beat-matching games.";
    case "Naturalist":
      return "Naturalist intelligence can be developed with outdoor exploration, sorting leaves or objects, and noticing real-world patterns.";
    case "Digital-Technological":
      return "Digital-technological thinking needs more structured systems play. Use sequencing tasks, logic toys, and age-appropriate coding ideas.";
    case "Pronunciation":
      return "Pronunciation can improve with sound play, rhymes, slow repetition, listening games, and targeted speech-friendly practice.";
    case "Coordination":
      return "Coordination needs more fine- and gross-motor repetition. Add threading, tossing, tracing, climbing, and bilateral movement games.";
    case "Existential":
      return "Wonder and meaning-making can be nurtured through open questions, reflective stories, and conversations about why things happen.";
    default:
      return `${region.name} is the best area to intentionally build next. Add frequent, low-pressure practice so progress feels natural and repeatable.`;
  }
}

export function generateInsights(scores: Record<string, number>): BrainInsight[] {
  const sorted = getSortedBrainRegionProgress(scores);
  const strongest = sorted[0] ?? BRAIN_REGIONS[0];
  const weakest =
    [...sorted].reverse().find((region) => region.score < strongest.score) ??
    sorted[sorted.length - 1] ??
    BRAIN_REGIONS[BRAIN_REGIONS.length - 1];

  return [
    {
      type: "strength",
      regionId: strongest.id,
      regionKey: strongest.key,
      text: buildStrengthText(strongest),
    },
    {
      type: "improvement",
      regionId: weakest.id,
      regionKey: weakest.key,
      text: buildImprovementText(weakest),
    },
  ];
}
