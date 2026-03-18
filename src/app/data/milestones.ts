// ============================================================
// DEVELOPMENTAL MILESTONES — Research-backed child development reference
// Sources: CDC, WHO, AAP, Bayley-III, Denver-II, ASQ-3
// ============================================================

export interface Milestone {
  id: string;
  category: MilestoneCategory;
  ageMonths: number; // target age in months
  ageRange: [number, number]; // normal range in months
  title: string;
  description: string;
  emoji: string;
  redFlags: string; // when to be concerned
  activities: string[]; // suggested activity types
  brainRegions: string[]; // which brain regions this maps to
}

export type MilestoneCategory =
  | "speech" | "motor_gross" | "motor_fine" | "cognitive"
  | "social" | "emotional" | "self_care" | "sensory";

export const CATEGORY_INFO: Record<MilestoneCategory, { label: string; emoji: string; color: string }> = {
  speech:      { label: "Speech & Language",  emoji: "🗣️", color: "#4361EE" },
  motor_gross: { label: "Gross Motor",        emoji: "🏃", color: "#FB5607" },
  motor_fine:  { label: "Fine Motor",         emoji: "✋", color: "#2DC653" },
  cognitive:   { label: "Cognitive",          emoji: "🧠", color: "#7209B7" },
  social:      { label: "Social",            emoji: "🤝", color: "#06D6A0" },
  emotional:   { label: "Emotional",         emoji: "❤️", color: "#E63946" },
  self_care:   { label: "Self-Care",         emoji: "🪥", color: "#FFB703" },
  sensory:     { label: "Sensory",           emoji: "👁️", color: "#118AB2" },
};

export const MILESTONES: Milestone[] = [
  // ── 3–6 months ──
  { id:"m001", category:"speech", ageMonths:4, ageRange:[3,6], title:"Coos and babbles",
    description:"Makes vowel sounds like 'ooo' and 'aah', responds to voices", emoji:"🗣️",
    redFlags:"No cooing or vocal sounds by 4 months",
    activities:["Talk to baby during routines","Imitate baby's sounds back","Sing simple songs"],
    brainRegions:["Linguistic","Pronunciation"] },
  { id:"m002", category:"motor_gross", ageMonths:4, ageRange:[3,5], title:"Holds head steady",
    description:"Can hold head up without support when held upright", emoji:"💪",
    redFlags:"Cannot hold head steady by 4 months",
    activities:["Tummy time 3x daily","Hold upright against shoulder","Place toys at eye level"],
    brainRegions:["Bodily-Kinesthetic","Coordination"] },
  { id:"m003", category:"sensory", ageMonths:4, ageRange:[3,5], title:"Follows objects with eyes",
    description:"Tracks moving objects smoothly from side to side", emoji:"👀",
    redFlags:"Does not follow objects or make eye contact by 4 months",
    activities:["Move colorful toy slowly across field of vision","Black and white card stimulation"],
    brainRegions:["Spatial-Visual","Coordination"] },
  { id:"m004", category:"social", ageMonths:4, ageRange:[3,6], title:"Social smile",
    description:"Smiles spontaneously at people, especially parents", emoji:"😊",
    redFlags:"No social smiling by 3 months",
    activities:["Face-to-face interaction","Peek-a-boo games","Mirror play"],
    brainRegions:["Interpersonal","Emotional"] },

  // ── 6–9 months ──
  { id:"m005", category:"motor_gross", ageMonths:7, ageRange:[5,9], title:"Sits without support",
    description:"Can sit alone for several minutes without toppling", emoji:"🪑",
    redFlags:"Cannot sit with support by 9 months",
    activities:["Practice sitting with pillows around","Sit and reach for toys","Ring-around play"],
    brainRegions:["Bodily-Kinesthetic","Coordination"] },
  { id:"m006", category:"speech", ageMonths:7, ageRange:[6,9], title:"Babbles consonant sounds",
    description:"Makes 'ba-ba', 'da-da', 'ma-ma' sounds (without meaning)", emoji:"👶",
    redFlags:"No consonant babbling by 9 months",
    activities:["Repeat baby's syllables","Name objects throughout the day","Read board books"],
    brainRegions:["Linguistic","Pronunciation"] },
  { id:"m007", category:"motor_fine", ageMonths:7, ageRange:[5,8], title:"Raking grasp",
    description:"Uses whole hand to pick up small objects", emoji:"🤏",
    redFlags:"Does not reach for or grasp objects by 7 months",
    activities:["Offer safe objects of different sizes","Cheerio picking practice","Texture boards"],
    brainRegions:["Coordination","Bodily-Kinesthetic"] },
  { id:"m008", category:"cognitive", ageMonths:8, ageRange:[6,10], title:"Object permanence begins",
    description:"Looks for hidden objects, understands things exist when out of sight", emoji:"🔍",
    redFlags:"Shows no interest when objects disappear by 10 months",
    activities:["Peek-a-boo","Hide toy under blanket","Cup hiding games"],
    brainRegions:["Executive Function","Spatial-Visual"] },

  // ── 9–12 months ──
  { id:"m009", category:"motor_gross", ageMonths:10, ageRange:[8,12], title:"Pulls to stand",
    description:"Pulls self up to standing using furniture", emoji:"🧍",
    redFlags:"Cannot pull to stand by 12 months",
    activities:["Place toys on low furniture","Cruising along sofa","Supported standing play"],
    brainRegions:["Bodily-Kinesthetic","Coordination"] },
  { id:"m010", category:"speech", ageMonths:11, ageRange:[9,14], title:"First words",
    description:"Says 'mama' or 'dada' with meaning, may have 1–3 other words", emoji:"💬",
    redFlags:"No words with meaning by 15 months",
    activities:["Label everything you see","Wait for child to vocalize","Picture-word books"],
    brainRegions:["Linguistic","Pronunciation"] },
  { id:"m011", category:"motor_fine", ageMonths:10, ageRange:[8,12], title:"Pincer grasp",
    description:"Picks up small objects with thumb and forefinger", emoji:"👌",
    redFlags:"No pincer grasp by 12 months",
    activities:["Pick up small food pieces","Stacking rings","Peg board play"],
    brainRegions:["Coordination","Bodily-Kinesthetic"] },
  { id:"m012", category:"social", ageMonths:10, ageRange:[8,12], title:"Waves bye-bye",
    description:"Waves, claps, or makes gestures on request", emoji:"👋",
    redFlags:"No gestures by 12 months",
    activities:["Model waving during departures","Clapping songs","Action rhymes"],
    brainRegions:["Interpersonal","Bodily-Kinesthetic"] },

  // ── 12–18 months ──
  { id:"m013", category:"motor_gross", ageMonths:13, ageRange:[10,18], title:"Walks independently",
    description:"Takes steps without holding onto anything", emoji:"🚶",
    redFlags:"Not walking by 18 months",
    activities:["Walk holding one hand","Push toys","Obstacle course with pillows"],
    brainRegions:["Bodily-Kinesthetic","Coordination"] },
  { id:"m014", category:"speech", ageMonths:15, ageRange:[12,18], title:"Uses 5–10 words",
    description:"Vocabulary of simple words; points and vocalizes to communicate", emoji:"📖",
    redFlags:"Fewer than 3 words by 18 months",
    activities:["Name body parts","Simple picture books","'What's this?' games"],
    brainRegions:["Linguistic","Pronunciation"] },
  { id:"m015", category:"cognitive", ageMonths:14, ageRange:[12,18], title:"Cause-and-effect understanding",
    description:"Pushes buttons to make things happen, drops things to see them fall", emoji:"⚡",
    redFlags:"No interest in cause-effect toys by 15 months",
    activities:["Pop-up toys","Musical instruments","Water play with cups"],
    brainRegions:["Logical-Mathematical","Executive Function"] },
  { id:"m016", category:"self_care", ageMonths:15, ageRange:[12,20], title:"Drinks from cup",
    description:"Holds and drinks from an open cup with some spilling", emoji:"🥤",
    redFlags:"Cannot hold cup by 18 months",
    activities:["Practice with small open cup","Pour water play","Sippy cup transition"],
    brainRegions:["Coordination","Bodily-Kinesthetic"] },

  // ── 18–24 months ──
  { id:"m017", category:"speech", ageMonths:20, ageRange:[18,24], title:"Two-word phrases",
    description:"Combines two words: 'more milk', 'daddy go', 'big dog'", emoji:"💬",
    redFlags:"No two-word combinations by 24 months",
    activities:["Expand single words into phrases","Narrate daily activities","Simple stories with repetition"],
    brainRegions:["Linguistic","Pronunciation"] },
  { id:"m018", category:"motor_gross", ageMonths:20, ageRange:[18,24], title:"Kicks a ball",
    description:"Can kick a ball forward without falling over", emoji:"⚽",
    redFlags:"Cannot kick by 24 months, frequent falling",
    activities:["Roll ball back and forth","Kick balloon","Outdoor ball play"],
    brainRegions:["Bodily-Kinesthetic","Coordination"] },
  { id:"m019", category:"motor_fine", ageMonths:20, ageRange:[18,24], title:"Stacks 4+ blocks",
    description:"Can build a tower of at least 4 blocks", emoji:"🧱",
    redFlags:"Cannot stack 2 blocks by 24 months",
    activities:["Block stacking games","Nesting cups","Simple puzzles"],
    brainRegions:["Coordination","Spatial-Visual"] },
  { id:"m020", category:"emotional", ageMonths:20, ageRange:[18,24], title:"Shows empathy",
    description:"Notices when others are upset, may try to comfort them", emoji:"🤗",
    redFlags:"No awareness of others' emotions by 24 months",
    activities:["Name emotions throughout day","Read books about feelings","Comfort doll play"],
    brainRegions:["Emotional","Interpersonal"] },

  // ── 2–3 years ──
  { id:"m021", category:"speech", ageMonths:30, ageRange:[24,36], title:"2–4 word sentences",
    description:"Speaks in short sentences, 200+ word vocabulary, strangers understand 50%", emoji:"🗣️",
    redFlags:"Cannot form 2-word sentences by 30 months; speech is unintelligible to family",
    activities:["Ask open-ended questions","Sing songs with actions","Story retelling","Rhyming games"],
    brainRegions:["Linguistic","Pronunciation"] },
  { id:"m022", category:"motor_gross", ageMonths:30, ageRange:[24,36], title:"Runs and jumps",
    description:"Runs steadily, jumps with both feet off the ground", emoji:"🦘",
    redFlags:"Cannot run without frequent falling by 30 months",
    activities:["Jumping games","Obstacle courses","Dance to music","Hopscotch"],
    brainRegions:["Bodily-Kinesthetic","Coordination"] },
  { id:"m023", category:"cognitive", ageMonths:30, ageRange:[24,36], title:"Sorts by shape/color",
    description:"Can sort objects by one property — color, shape, or size", emoji:"🔶",
    redFlags:"Cannot match identical objects by 30 months",
    activities:["Color sorting bins","Shape puzzles","'Find all the red ones' game","Button sorting"],
    brainRegions:["Logical-Mathematical","Spatial-Visual"] },
  { id:"m024", category:"self_care", ageMonths:30, ageRange:[24,36], title:"Feeds with spoon",
    description:"Uses spoon and fork with minimal spilling", emoji:"🥄",
    redFlags:"Cannot use spoon by 30 months",
    activities:["Practice scooping rice","Stirring play","Cooking together","Playdough sculpting"],
    brainRegions:["Coordination","Bodily-Kinesthetic"] },
  { id:"m025", category:"social", ageMonths:30, ageRange:[24,36], title:"Parallel play",
    description:"Plays alongside other children, beginning to share", emoji:"👫",
    redFlags:"No interest in other children by 30 months",
    activities:["Playdates","Turn-taking games","Group circle time","Cooperative puzzles"],
    brainRegions:["Interpersonal","Emotional"] },

  // ── 3–4 years ──
  { id:"m026", category:"speech", ageMonths:42, ageRange:[36,48], title:"Full sentences, asks 'why'",
    description:"Uses 4–5 word sentences, asks questions constantly, tells simple stories", emoji:"❓",
    redFlags:"Speech largely unintelligible to strangers by 36 months",
    activities:["Storytelling with pictures","'Why' exploration walks","Puppet shows","Rhyming games"],
    brainRegions:["Linguistic","Pronunciation","Creative"] },
  { id:"m027", category:"motor_fine", ageMonths:42, ageRange:[36,48], title:"Draws a circle, uses scissors",
    description:"Can draw circles and lines, begins to cut with scissors", emoji:"✂️",
    redFlags:"Cannot draw any recognizable shapes by 42 months",
    activities:["Drawing shapes","Cutting practice with safety scissors","Playdough rolling","Bead threading"],
    brainRegions:["Coordination","Creative","Spatial-Visual"] },
  { id:"m028", category:"cognitive", ageMonths:42, ageRange:[36,48], title:"Counts to 10",
    description:"Can count objects to 10, understands concept of 'more' and 'less'", emoji:"🔢",
    redFlags:"Cannot count 3 objects by 42 months",
    activities:["Counting during daily routines","Number songs","Dice games","Measuring play"],
    brainRegions:["Logical-Mathematical","Executive Function"] },
  { id:"m029", category:"emotional", ageMonths:42, ageRange:[36,48], title:"Identifies emotions",
    description:"Names basic emotions in self and others: happy, sad, angry, scared", emoji:"😊",
    redFlags:"Cannot identify any emotions by 42 months",
    activities:["Emotion face cards","Feeling charades","Story emotion identification","Mood check-ins"],
    brainRegions:["Emotional","Intrapersonal"] },

  // ── 4–5 years ──
  { id:"m030", category:"speech", ageMonths:54, ageRange:[48,60], title:"Complex stories, all sounds clear",
    description:"Tells detailed stories, uses past tense correctly, speech fully intelligible", emoji:"📚",
    redFlags:"Still omitting or substituting consonant sounds by 48 months",
    activities:["Storybook retelling","Tongue twisters","Letter sound games","Show and tell"],
    brainRegions:["Linguistic","Pronunciation","Creative"] },
  { id:"m031", category:"motor_gross", ageMonths:54, ageRange:[48,60], title:"Hops on one foot, catches ball",
    description:"Hops on one foot 5+ times, catches a bounced ball", emoji:"🤸",
    redFlags:"Cannot hop or balance on one foot by 54 months",
    activities:["Hopping games","Ball catching practice","Balance beam walking","Yoga poses"],
    brainRegions:["Bodily-Kinesthetic","Coordination"] },
  { id:"m032", category:"motor_fine", ageMonths:54, ageRange:[48,60], title:"Writes some letters",
    description:"Can write some letters, draws a person with 3+ body parts", emoji:"✏️",
    redFlags:"Cannot draw a person with head and body by 54 months",
    activities:["Letter tracing","Drawing people","Dot-to-dot","Maze activities"],
    brainRegions:["Coordination","Linguistic","Spatial-Visual"] },
  { id:"m033", category:"cognitive", ageMonths:54, ageRange:[48,60], title:"Understands time concepts",
    description:"Knows yesterday/today/tomorrow, can count to 20+", emoji:"⏰",
    redFlags:"No understanding of sequence or time by 54 months",
    activities:["Calendar routines","Sequencing cards","Before-after games","Pattern recognition"],
    brainRegions:["Logical-Mathematical","Executive Function"] },

  // ── 5–6 years ──
  { id:"m034", category:"speech", ageMonths:66, ageRange:[60,72], title:"Complex grammar, 5000+ words",
    description:"Uses complex sentences with because/if/when, can define words", emoji:"🎓",
    redFlags:"Difficulty being understood or expressing ideas by 66 months",
    activities:["Journal dictation","Debate games","Word of the day","Storytelling chains"],
    brainRegions:["Linguistic","Pronunciation","Executive Function"] },
  { id:"m035", category:"cognitive", ageMonths:66, ageRange:[60,72], title:"Basic reading readiness",
    description:"Recognizes letters, rhymes words, may read simple words", emoji:"📖",
    redFlags:"Cannot recognize any letters by 66 months",
    activities:["Letter games","Phonics activities","Simple sight words","Library visits"],
    brainRegions:["Linguistic","Executive Function","Spatial-Visual"] },
  { id:"m036", category:"social", ageMonths:66, ageRange:[60,72], title:"Cooperative play with rules",
    description:"Plays structured games, follows rules, can take turns consistently", emoji:"🎲",
    redFlags:"Cannot play cooperatively or follow simple rules by 66 months",
    activities:["Board games","Team sports","Rule-based tag","Group projects"],
    brainRegions:["Interpersonal","Executive Function","Emotional"] },

  // ── 7–8 years ──
  { id:"m037", category:"cognitive", ageMonths:90, ageRange:[84,96], title:"Reads independently",
    description:"Reads chapter books, writes paragraphs, does mental math", emoji:"📕",
    redFlags:"Cannot read simple sentences independently by 90 months",
    activities:["Reading challenges","Creative writing","Math puzzles","Science experiments"],
    brainRegions:["Linguistic","Logical-Mathematical","Executive Function"] },
  { id:"m038", category:"emotional", ageMonths:90, ageRange:[84,96], title:"Emotional regulation",
    description:"Can manage frustration, express feelings verbally, use calming strategies", emoji:"🧘",
    redFlags:"Frequent meltdowns or inability to calm down by 90 months",
    activities:["Mindfulness exercises","Emotion journaling","Role-play scenarios","Breathing techniques"],
    brainRegions:["Emotional","Intrapersonal","Executive Function"] },
  { id:"m039", category:"motor_fine", ageMonths:90, ageRange:[84,96], title:"Neat handwriting",
    description:"Writes legibly in cursive or print, ties shoes independently", emoji:"✍️",
    redFlags:"Handwriting still largely illegible by 90 months",
    activities:["Calligraphy practice","Origami","Knitting/weaving","Detailed drawing"],
    brainRegions:["Coordination","Bodily-Kinesthetic","Spatial-Visual"] },

  // ── 9–10 years ──
  { id:"m040", category:"cognitive", ageMonths:114, ageRange:[108,120], title:"Abstract reasoning",
    description:"Solves multi-step problems, understands metaphors, plans independently", emoji:"🧩",
    redFlags:"Difficulty with multi-step problems or abstract concepts by 114 months",
    activities:["Strategy games","Coding challenges","Debate club","Research projects"],
    brainRegions:["Logical-Mathematical","Executive Function","Creative"] },
  { id:"m041", category:"social", ageMonths:114, ageRange:[108,120], title:"Perspective-taking",
    description:"Can see situations from others' viewpoints, understands fairness deeply", emoji:"🌍",
    redFlags:"Difficulty understanding others' perspectives by 114 months",
    activities:["Debate from opposite view","Community service","Collaborative projects","Empathy journals"],
    brainRegions:["Interpersonal","Emotional","Intrapersonal"] },
  { id:"m042", category:"self_care", ageMonths:114, ageRange:[108,120], title:"Full independence",
    description:"Manages daily routines, homework, and personal hygiene independently", emoji:"🌟",
    redFlags:"Still requires constant supervision for daily routines by 114 months",
    activities:["Weekly planning","Goal setting","Time management games","Cooking simple meals"],
    brainRegions:["Executive Function","Intrapersonal"] },
];

/** Get milestones appropriate for a child's age in months */
export function getMilestonesForAge(ageMonths: number): Milestone[] {
  // Show milestones where the child is within the age range, or slightly past
  return MILESTONES.filter(m =>
    ageMonths >= m.ageRange[0] - 2 && ageMonths <= m.ageRange[1] + 6
  );
}

/** Get milestones grouped by category for a given age */
export function getMilestonesByCategory(ageMonths: number): Record<MilestoneCategory, Milestone[]> {
  const relevant = getMilestonesForAge(ageMonths);
  const grouped: Record<string, Milestone[]> = {};
  for (const cat of Object.keys(CATEGORY_INFO)) {
    grouped[cat] = relevant.filter(m => m.category === cat);
  }
  return grouped as Record<MilestoneCategory, Milestone[]>;
}

/** Check if a milestone is overdue for the child's age */
export function isMilestoneOverdue(milestone: Milestone, childAgeMonths: number): boolean {
  return childAgeMonths > milestone.ageRange[1];
}

/** Get concern level */
export function getConcernLevel(milestone: Milestone, childAgeMonths: number): "on_track" | "watch" | "concern" {
  if (childAgeMonths <= milestone.ageMonths) return "on_track";
  if (childAgeMonths <= milestone.ageRange[1]) return "watch";
  return "concern";
}
