/**
 * Survivor 2 — NeuroSpark Audio.
 *
 * 15 highest-coverage activities reformatted into 90–120 second
 * audio-only "micro-rituals" — designed for the car, the walk, the
 * dinner table, brushing teeth. Same `logActivity` accounting as the
 * on-screen activities so coverage credit accrues whether the child
 * is on a screen or not (the strategic point of this Survivor).
 *
 * Each ritual is structured as a short script (60–80 s of TTS audio
 * with two pause beats for the parent + child to interact). The
 * Studio Kokoro pipeline pre-renders the MP3s; the runtime resolves
 * `audioUrl` lazily from the asset CDN.
 */
export type RitualMoment =
  | "car-ride" | "toothbrush" | "walk" | "dinner"
  | "bedtime" | "bath" | "wakeup" | "errand" | "anytime";

export interface MicroRitual {
  id: string;
  title: string;
  emoji: string;
  /** 90 ≤ durationSec ≤ 120 — hard cap from the survivor doc. */
  durationSec: number;
  /** Where this ritual best fits in a parent's day. */
  moment: RitualMoment;
  /** Brain regions the activity hits — same taxonomy as on-screen activities. */
  region: string;
  regionEmoji: string;
  /** Howard-Gardner intelligences hit. */
  intelligences: string[];
  /** Open standard competency tags (Survivor 5). */
  competencyTags: string[];
  /** Min/max age in months. */
  minAgeMonths: number;
  maxAgeMonths: number;
  /** Short blurb shown on the audio-mode card. */
  description: string;
  /** TTS script — \\n\\n marks a 5s parent/child pause beat. */
  script: string;
  /** Optional CDN URL (filled at build time after Kokoro renders). */
  audioUrl?: string;
}

export const AUDIO_MICRO_RITUALS: MicroRitual[] = [
  {
    id: "ar_emotion_namer",
    title: "Emotion Namer",
    emoji: "💛",
    durationSec: 105,
    moment: "car-ride",
    region: "Emotional",
    regionEmoji: "❤️",
    intelligences: ["Interpersonal", "Intrapersonal"],
    competencyTags: ["emotional-regulation", "social-cognition"],
    minAgeMonths: 30, maxAgeMonths: 96,
    description: "Three emotions, three faces, one small story.",
    script:
      "Time for Emotion Namer. I'll say a feeling. You make the face and tell me when you felt that way.\n\nFirst feeling: proud. Show me a proud face.\n\nNext feeling: worried. Show me worried.\n\nLast one: silly! Tell me about a time you felt silly.",
  },
  {
    id: "ar_category_ride",
    title: "Category Ride",
    emoji: "🗂️",
    durationSec: 110,
    moment: "car-ride",
    region: "Linguistic",
    regionEmoji: "🗣️",
    intelligences: ["Linguistic", "Logical-Mathematical"],
    competencyTags: ["working-memory", "vocabulary-depth"],
    minAgeMonths: 36, maxAgeMonths: 120,
    description: "Take turns naming things in a category until someone runs out.",
    script:
      "Let's play Category Ride. The category is: animals you can see in a city.\n\nYou go first.\n\nMy turn. A pigeon!\n\nKeep going until one of us can't think of one. Loser names the next category.",
  },
  {
    id: "ar_toothbrush_count",
    title: "Toothbrush Counting",
    emoji: "🪥",
    durationSec: 90,
    moment: "toothbrush",
    region: "Bodily-Kinesthetic",
    regionEmoji: "🤸",
    intelligences: ["Logical-Mathematical", "Bodily-Kinesthetic"],
    competencyTags: ["self-care", "numeracy"],
    minAgeMonths: 30, maxAgeMonths: 84,
    description: "Brush along to a counting song and check every tooth.",
    script:
      "Brushing time! Count with me. We'll brush each part for ten.\n\nFront teeth on top: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.\n\nFront teeth on bottom: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.\n\nNow back teeth, tongue, and rinse!",
  },
  {
    id: "ar_walk_observation",
    title: "Walking Detective",
    emoji: "🔍",
    durationSec: 120,
    moment: "walk",
    region: "Naturalist",
    regionEmoji: "🌿",
    intelligences: ["Naturalist", "Spatial-Visual"],
    competencyTags: ["observation", "vocabulary-depth"],
    minAgeMonths: 36, maxAgeMonths: 120,
    description: "Find five things you wouldn't normally notice.",
    script:
      "Detective walk. Five things to find before we get home.\n\nOne: something blue that isn't the sky.\n\nTwo: a sound made by a living thing.\n\nThree: a smell you can name.\n\nFour: something that wasn't here yesterday.\n\nFive: one tiny thing you've never noticed before.",
  },
  {
    id: "ar_dinner_high_low",
    title: "High-Low-Curious",
    emoji: "🍽️",
    durationSec: 100,
    moment: "dinner",
    region: "Intrapersonal",
    regionEmoji: "🪞",
    intelligences: ["Intrapersonal", "Linguistic"],
    competencyTags: ["self-reflection", "social-cognition"],
    minAgeMonths: 48, maxAgeMonths: 144,
    description: "Best part, hardest part, one curious question.",
    script:
      "Around the table: each person says their HIGH, their LOW, and one CURIOUS thing.\n\nHigh: best part of your day.\n\nLow: hardest moment.\n\nCurious: one question you wondered today. No one has to answer it — we just hear it.",
  },
  {
    id: "ar_breath_box",
    title: "Box Breathing",
    emoji: "🌬️",
    durationSec: 90,
    moment: "bedtime",
    region: "Emotional",
    regionEmoji: "❤️",
    intelligences: ["Intrapersonal", "Bodily-Kinesthetic"],
    competencyTags: ["emotional-regulation", "physical-literacy"],
    minAgeMonths: 36, maxAgeMonths: 144,
    description: "Four-second box-breath cycle, four times.",
    script:
      "Time to settle. Box breathing. In four, hold four, out four, hold four. Follow my voice.\n\nIn 2, 3, 4. Hold 2, 3, 4. Out 2, 3, 4. Hold 2, 3, 4.\n\nAgain. In 2, 3, 4. Hold 2, 3, 4. Out 2, 3, 4. Hold 2, 3, 4.\n\nOne more time, slower. Eyes can close.",
  },
  {
    id: "ar_story_chain",
    title: "Story Chain",
    emoji: "📖",
    durationSec: 120,
    moment: "bedtime",
    region: "Creative",
    regionEmoji: "🎨",
    intelligences: ["Linguistic", "Creative"],
    competencyTags: ["narrative-thinking", "creative-fluency"],
    minAgeMonths: 36, maxAgeMonths: 132,
    description: "Each person adds one sentence; build a tiny story together.",
    script:
      "Let's build a story together. I'll start with one sentence; then you add one; then I add one. Three sentences each.\n\nReady? Once upon a time, a small dragon woke up to find that all his fire had turned into bubbles.\n\nYour turn — one sentence!",
  },
  {
    id: "ar_rhythm_clap",
    title: "Rhythm Clap-Back",
    emoji: "👏",
    durationSec: 95,
    moment: "anytime",
    region: "Musical-Rhythmic",
    regionEmoji: "🎵",
    intelligences: ["Musical-Rhythmic", "Bodily-Kinesthetic"],
    competencyTags: ["rhythm", "working-memory"],
    minAgeMonths: 24, maxAgeMonths: 96,
    description: "Listen to a clap pattern and copy it back.",
    script:
      "Clap-back time. I clap a pattern; you copy it.\n\nReady? Listen. CLAP-CLAP-pause-CLAP.\n\nYour turn.\n\nNext one. CLAP-pause-CLAP-CLAP-CLAP.\n\nLast one — harder! CLAP-CLAP-CLAP-pause-CLAP-pause-CLAP.",
  },
  {
    id: "ar_question_chain",
    title: "Question Chain",
    emoji: "❓",
    durationSec: 110,
    moment: "errand",
    region: "Existential",
    regionEmoji: "🌌",
    intelligences: ["Existential", "Linguistic"],
    competencyTags: ["critical-thinking", "metacognition"],
    minAgeMonths: 48, maxAgeMonths: 144,
    description: "Answer with a better question.",
    script:
      "We're going to play Question Chain. I ask a question. You answer with a BETTER question.\n\nFirst: why is the sky blue?\n\nNice. My turn.\n\nNew question: why do we sleep?\n\nYour turn — answer with a question.",
  },
  {
    id: "ar_anatomy_song",
    title: "Body-Part Beat",
    emoji: "🦴",
    durationSec: 90,
    moment: "bath",
    region: "Bodily-Kinesthetic",
    regionEmoji: "🤸",
    intelligences: ["Bodily-Kinesthetic", "Musical-Rhythmic"],
    competencyTags: ["body-awareness", "vocabulary-depth"],
    minAgeMonths: 24, maxAgeMonths: 72,
    description: "Touch the part you hear, on the beat.",
    script:
      "Wash time! Touch the part I name, on the beat.\n\nElbow! Knee! Wrist! Ankle!\n\nElbow! Knee! Wrist! Ankle!\n\nFaster! Elbow! Knee! Wrist! Ankle! Elbow! Knee! Wrist! Ankle!",
  },
  {
    id: "ar_wakeup_intent",
    title: "One-Word Intent",
    emoji: "🌅",
    durationSec: 90,
    moment: "wakeup",
    region: "Intrapersonal",
    regionEmoji: "🪞",
    intelligences: ["Intrapersonal"],
    competencyTags: ["metacognition", "self-reflection"],
    minAgeMonths: 48, maxAgeMonths: 144,
    description: "Pick one word for today and say it out loud.",
    script:
      "Good morning. We're going to pick one word for today. The word is the kind of person you want to be today.\n\nExamples: brave, kind, curious, calm, helpful, gentle, bold.\n\nYour word for today is...\n\nSay it out loud. We will check in tonight.",
  },
  {
    id: "ar_color_hunt",
    title: "Color Hunt",
    emoji: "🌈",
    durationSec: 100,
    moment: "car-ride",
    region: "Spatial-Visual",
    regionEmoji: "👁️",
    intelligences: ["Spatial-Visual", "Linguistic"],
    competencyTags: ["observation", "vocabulary-depth"],
    minAgeMonths: 24, maxAgeMonths: 84,
    description: "Find five things in five different colors.",
    script:
      "Color hunt. I name a color, you find a thing in that color.\n\nRed.\n\nBlue.\n\nYellow.\n\nGreen.\n\nA color you haven't seen yet today!",
  },
  {
    id: "ar_word_relay",
    title: "Word Relay",
    emoji: "🔗",
    durationSec: 105,
    moment: "anytime",
    region: "Linguistic",
    regionEmoji: "🗣️",
    intelligences: ["Linguistic"],
    competencyTags: ["vocabulary-depth", "working-memory"],
    minAgeMonths: 48, maxAgeMonths: 144,
    description: "Each word starts with the last letter of the previous one.",
    script:
      "Word relay. Each word starts with the LAST letter of the word I just said.\n\nElephant.\n\nYou go!\n\nMy turn.\n\nKeep going. No proper nouns. No repeats.",
  },
  {
    id: "ar_count_skip",
    title: "Skip Counting Song",
    emoji: "🔢",
    durationSec: 100,
    moment: "errand",
    region: "Logical-Mathematical",
    regionEmoji: "🔢",
    intelligences: ["Logical-Mathematical", "Musical-Rhythmic"],
    competencyTags: ["numeracy", "working-memory"],
    minAgeMonths: 48, maxAgeMonths: 120,
    description: "Skip-count by 2s, then 5s, then 10s.",
    script:
      "Skip-counting time. We'll do 2s, 5s, 10s.\n\nBy two: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20.\n\nBy five: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50.\n\nBy ten — to one hundred: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100.",
  },
  {
    id: "ar_silly_kindness",
    title: "Silly Kindness",
    emoji: "🌟",
    durationSec: 90,
    moment: "anytime",
    region: "Interpersonal",
    regionEmoji: "🤝",
    intelligences: ["Interpersonal", "Creative"],
    competencyTags: ["social-cognition", "creative-fluency"],
    minAgeMonths: 36, maxAgeMonths: 120,
    description: "Invent the silliest kind thing you could do today.",
    script:
      "Silly kindness time. Invent the silliest kind thing you could do for someone today.\n\nIt has to be a real thing you could actually do.\n\nMy idea: I will compliment three different shoes.\n\nYour idea?",
  },
];

export function ritualsForMoment(moment: RitualMoment): MicroRitual[] {
  if (moment === "anytime") return AUDIO_MICRO_RITUALS;
  return AUDIO_MICRO_RITUALS.filter((r) => r.moment === moment || r.moment === "anytime");
}

export function ritualsForAge(ageMonths: number): MicroRitual[] {
  return AUDIO_MICRO_RITUALS.filter(
    (r) => ageMonths >= r.minAgeMonths && ageMonths <= r.maxAgeMonths,
  );
}

export function pickDailyRitual(ageMonths: number, moment: RitualMoment, seed = Date.now()): MicroRitual | null {
  const candidates = ritualsForMoment(moment).filter(
    (r) => ageMonths >= r.minAgeMonths && ageMonths <= r.maxAgeMonths,
  );
  if (candidates.length === 0) return null;
  return candidates[seed % candidates.length] ?? null;
}
