// ============================================================
// NEUROSPARK BLUEPRINT — MASTER DATA FILE
// Brain Development App for Kids Ages 1–10
// ============================================================

export const APP_META = {
  name: "NeuroSpark",
  tagline: "Daily Brain Activities. Zero Cost. Endless Potential.",
  version: "Blueprint v1.0",
  date: "March 2026",
  phase: "Research & Planning",
  targetAge: "1–10 years",
  dailyActivities: "3–5 per day",
};

// ============================================================
// SECTION 1: GLOBAL RESEARCH METHODOLOGIES
// ============================================================

export const RESEARCH_REGIONS = [
  {
    id: "indian",
    region: "Indian",
    color: "#FF6B35",
    bg: "#FFF4F0",
    border: "#FECAB0",
    emoji: "🇮🇳",
    methods: [
      {
        name: "Vedic Mathematics",
        origin: "Ancient India",
        focus: "Mental arithmetic speed & number sense",
        mechanism:
          "16 sutras (word-formulae) enable multi-digit calculations mentally through pattern recognition",
        intelligences: ["Logical-Mathematical", "Spatial-Visual", "Linguistic"],
        ages: "5–10",
        researchBasis:
          "Studies show Vedic math increases calculation speed by 40–60% and reduces math anxiety",
        householdApplication:
          "Rice grains for counting, chalk on floor for number grids, finger patterns",
        activities: [
          "Dot multiplication with stones",
          "Finger Vedic multiplication (up to 10×10)",
          "Rice-grain place value",
        ],
      },
      {
        name: "Sthanapath (Place-Value Chanting)",
        origin: "Vedic oral tradition",
        focus: "Memory encoding through rhythmic place-value recitation",
        mechanism:
          "Phonological loop activation via rhythmic chanting builds working memory capacity",
        intelligences: ["Linguistic", "Musical-Rhythmic", "Logical-Mathematical"],
        ages: "3–8",
        researchBasis:
          "Oral-aural encoding strengthens phonological memory — basis of all academic learning",
        householdApplication: "Clapping rhythms, cup-stacking for place values",
        activities: [
          "Cup-stacking place value chant",
          "Rhythmic number songs",
          "Echo counting games",
        ],
      },
      {
        name: "Yoga & Pranayama",
        origin: "Ancient India (Patanjali ~400 CE)",
        focus: "Body-mind integration, attention regulation, breath awareness",
        mechanism:
          "Vagal tone improvement via breath control enhances prefrontal cortex function and emotional regulation",
        intelligences: ["Bodily-Kinesthetic", "Intrapersonal", "Emotional"],
        ages: "2–10",
        researchBasis:
          "Harvard Medical School: 20 min/day yoga improves attention span by 32% in children",
        householdApplication: "Mat or blanket on floor, no equipment needed",
        activities: [
          "Animal pose storytelling (Lion, Cat, Dog)",
          "Breath counting with fingers",
          "Balance challenge on one leg",
        ],
      },
      {
        name: "Mandala Drawing",
        origin: "Hindu/Buddhist tradition",
        focus: "Geometric thinking, bilateral coordination, sustained attention",
        mechanism:
          "Radial symmetry creation activates both hemispheres simultaneously; meditative focus builds attention span",
        intelligences: ["Spatial-Visual", "Logical-Mathematical", "Creative", "Intrapersonal"],
        ages: "4–10",
        researchBasis:
          "Bilateral drawing exercises shown to improve corpus callosum connectivity in children",
        householdApplication: "Paper, pencil, compass made from string and pencil",
        activities: [
          "Symmetry fold-and-draw",
          "Button/seed mandala arrangement",
          "Dot grid mandala on graph paper",
        ],
      },
    ],
  },
  {
    id: "chinese",
    region: "Chinese",
    color: "#E63946",
    bg: "#FFF0F0",
    border: "#FFBCBC",
    emoji: "🇨🇳",
    methods: [
      {
        name: "Abacus (Suanpan)",
        origin: "China ~200 BCE",
        focus: "Working memory, mental visualization, arithmetic fluency",
        mechanism:
          "Bead visualization creates a mental abacus (anzan) — proven to expand working memory chunks",
        intelligences: ["Logical-Mathematical", "Spatial-Visual", "Bodily-Kinesthetic"],
        ages: "4–10",
        researchBasis:
          "Journal of Neuroscience: Abacus users show enlarged right-hemisphere parietal regions; 3× faster mental math",
        householdApplication: "Buttons on strings, egg carton rows, bead necklaces",
        activities: [
          "Egg-carton abacus addition",
          "Button-bead counting rows",
          "Eyes-closed mental addition",
        ],
      },
      {
        name: "Chinese Calligraphy",
        origin: "China ~200 BCE",
        focus: "Fine motor control, visual-spatial memory, aesthetic attention",
        mechanism:
          "Slow deliberate strokes build cerebellar fine-motor circuits; character memorization enhances visual memory",
        intelligences: ["Spatial-Visual", "Bodily-Kinesthetic", "Linguistic", "Creative"],
        ages: "3–10",
        researchBasis:
          "Calligraphy practice shown to improve handwriting, reading, and concentration across cultures",
        householdApplication: "Water on slate/dark paper (evaporates), charcoal, paintbrush",
        activities: [
          "Water brush strokes on dark paper",
          "Finger tracing sand calligraphy",
          "Symmetry stroke matching",
        ],
      },
      {
        name: "Go (Weiqi)",
        origin: "China ~2500 BCE",
        focus: "Strategic thinking, pattern recognition, executive function",
        mechanism:
          "Go's branching decision trees train prefrontal planning circuits; territory thinking builds spatial strategy",
        intelligences: ["Logical-Mathematical", "Spatial-Visual", "Executive Function"],
        ages: "6–10",
        researchBasis:
          "Korean studies: Go training improves IQ scores and attention in children by measurable margins",
        householdApplication: "Grid drawn on paper, stones/buttons as pieces",
        activities: [
          "Mini 5×5 paper Go grid with stones",
          "Territory capture strategy game",
          "Pattern memory: recreate stone positions",
        ],
      },
      {
        name: "Chinese Storytelling Tradition",
        origin: "Oral tradition",
        focus: "Sequential narrative, moral reasoning, memory",
        mechanism:
          "Story structure internalization builds narrative intelligence and working memory for sequences",
        intelligences: ["Linguistic", "Interpersonal", "Emotional", "Creative"],
        ages: "2–10",
        researchBasis:
          "Narrative thinking is foundational to reading comprehension and social cognition development",
        householdApplication: "No materials needed; household objects as story props",
        activities: [
          "5-object story chain",
          "Retell yesterday's activity as a story",
          "Character emotion role-play",
        ],
      },
    ],
  },
  {
    id: "japanese",
    region: "Japanese",
    color: "#8338EC",
    bg: "#F5F0FF",
    border: "#D4B8FF",
    emoji: "🇯🇵",
    methods: [
      {
        name: "Shichida Method",
        origin: "Japan, Makoto Shichida 1970s",
        focus: "Right-brain activation, photographic memory, intuition",
        mechanism:
          "Flash-card speed training, image linking, and music stimulation activate right-hemisphere holistic processing",
        intelligences: ["Spatial-Visual", "Musical-Rhythmic", "Creative", "Linguistic"],
        ages: "1–6",
        researchBasis:
          "Right-brain training in 0–6 year window (critical period) shows lasting memory and creativity gains",
        householdApplication: "Homemade flashcards, music player, colored paper cards",
        activities: [
          "Flashcard speed-flip (0.5 sec each)",
          "Memory photo: look 10 sec then recreate",
          "Music-image association game",
        ],
      },
      {
        name: "Kumon Method",
        origin: "Japan, Toru Kumon 1954",
        focus: "Mastery through structured incremental repetition",
        mechanism:
          "Spaced, incremental worksheets build procedural fluency; self-pacing builds intrinsic motivation and confidence",
        intelligences: ["Logical-Mathematical", "Linguistic", "Executive Function"],
        ages: "3–10",
        researchBasis:
          "Kumon's 4 million global students show consistent grade-level advancement; meta-analyses confirm procedural mastery",
        householdApplication: "Paper, pencil — parent-made worksheets",
        activities: [
          "Daily 10-problem sheets (parent-made)",
          "Progressive puzzle chains",
          "Self-checking answer keys",
        ],
      },
      {
        name: "Origami",
        origin: "Japan, Edo period",
        focus: "Spatial reasoning, following sequences, patience, geometry",
        mechanism:
          "3D fold prediction activates parietal spatial networks; sequential instruction following builds working memory",
        intelligences: ["Spatial-Visual", "Bodily-Kinesthetic", "Logical-Mathematical", "Creative"],
        ages: "3–10",
        researchBasis:
          "Stanford study: origami significantly improves spatial visualization and geometry scores",
        householdApplication: "Any paper — newspaper, scrap paper, old magazines",
        activities: [
          "Paper boat (age 3–4)",
          "Frog jump (age 5–6)",
          "Modular cube (age 8–10)",
        ],
      },
      {
        name: "Shinrin-yoku (Forest Bathing)",
        origin: "Japan, coined 1982 by Ministry of Agriculture",
        focus: "Sensory regulation, stress reduction, naturalist intelligence",
        mechanism:
          "Phytoncides (forest chemicals) reduce cortisol; multi-sensory nature exposure boosts NK immune cells and attention",
        intelligences: ["Naturalist", "Intrapersonal", "Bodily-Kinesthetic", "Sensory"],
        ages: "1–10",
        researchBasis:
          "University of Michigan: nature exposure improves directed attention by 20%; cortisol reduction 12–16%",
        householdApplication: "Garden, park, or any outdoor space; no materials needed",
        activities: [
          "Barefoot texture walk (grass, soil, concrete)",
          "5-senses nature scavenger hunt",
          "Leaf/stone pattern collection",
        ],
      },
    ],
  },
  {
    id: "korean",
    region: "Korean",
    color: "#0077B6",
    bg: "#EFF8FF",
    border: "#BAE0FF",
    emoji: "🇰🇷",
    methods: [
      {
        name: "Nunchi",
        origin: "Korean cultural concept",
        focus: "Emotional intelligence, social reading, empathy",
        mechanism:
          "Reading social cues rapidly develops Theory of Mind and interpersonal attunement — critical for social cognition",
        intelligences: ["Interpersonal", "Emotional", "Intrapersonal"],
        ages: "2–10",
        researchBasis:
          "Theory of Mind development (Baron-Cohen): children with high social reading show stronger academic outcomes",
        householdApplication: "Family interactions, no materials needed",
        activities: [
          "Emotion face matching with drawn cards",
          "Silent message guessing game",
          "Role-reversal empathy play",
        ],
      },
      {
        name: "Bar Modeling (Singapore-Korean Math)",
        origin: "Singapore/Korea, 1980s curriculum",
        focus: "Visual-spatial mathematical reasoning, word problem solving",
        mechanism:
          "Abstract quantities become visual rectangles — bridges concrete and abstract thinking (Bruner's CPA approach)",
        intelligences: ["Logical-Mathematical", "Spatial-Visual", "Linguistic"],
        ages: "5–10",
        researchBasis:
          "Singapore consistently ranks #1 in PISA math; bar modeling is the core pedagogical differentiator",
        householdApplication: "Paper strips, blocks, ruler, lego bricks",
        activities: [
          "Paper-strip comparison bars",
          "Block bar model division",
          "Word problem drawing challenges",
        ],
      },
    ],
  },
  {
    id: "western",
    region: "Western & Scandinavian",
    color: "#2DC653",
    bg: "#F0FFF4",
    border: "#A8EDBC",
    emoji: "🌍",
    methods: [
      {
        name: "Montessori Method",
        origin: "Italy, Maria Montessori 1907",
        focus: "Self-directed learning, sensorial exploration, practical life",
        mechanism:
          "Prepared environment with self-correcting materials allows intrinsic motivation; multi-age grouping builds leadership",
        intelligences: ["All 13 types", "Bodily-Kinesthetic", "Logical-Mathematical"],
        ages: "1–10",
        researchBasis:
          "Science (2006): Montessori children show significantly better executive function and reading at age 5",
        householdApplication: "Kitchen tools, pouring activities, sorting trays, real tools",
        activities: [
          "Grain transfer (spoon, rice, bowl)",
          "Water pouring precision challenge",
          "Button/zipper/lace dressing frame",
        ],
      },
      {
        name: "Reggio Emilia Approach",
        origin: "Italy, Loris Malaguzzi 1945",
        focus: "Project-based inquiry, 100 languages of children, documentation",
        mechanism:
          "Child-led investigation with adult scaffolding; documentation makes thinking visible and reflective",
        intelligences: ["Creative", "Linguistic", "Spatial-Visual", "Interpersonal"],
        ages: "1–8",
        researchBasis:
          "Newsweek named Reggio schools 'Best in the World'; inquiry-based learning shows lasting creative gains",
        householdApplication: "Loose parts (stones, shells, sticks), drawing materials",
        activities: [
          "Loose parts construction challenge",
          "Nature documentation sketchbook",
          "Light-shadow exploration (torch + objects)",
        ],
      },
      {
        name: "Waldorf Education",
        origin: "Germany, Rudolf Steiner 1919",
        focus: "Imagination, arts integration, developmental rhythm, whole-child",
        mechanism:
          "Arts woven into all learning; main lesson books; seasonal rhythms build sense of time and pattern",
        intelligences: ["Creative", "Musical-Rhythmic", "Bodily-Kinesthetic", "Emotional"],
        ages: "1–10",
        researchBasis:
          "Waldorf graduates show high creativity indices and strong intrinsic motivation in longitudinal studies",
        householdApplication: "Beeswax (or playdough), natural materials, watercolors (DIY)",
        activities: [
          "Watercolor wet-on-wet painting",
          "Rhythmic clapping patterns",
          "Seasonal nature table creation",
        ],
      },
      {
        name: "Growth Mindset (Dweck)",
        origin: "USA, Carol Dweck, Stanford 2006",
        focus: "Neuroplasticity belief, effort attribution, resilience",
        mechanism:
          "Praising process over outcome rewires attribution style; 'yet' language builds persistence and reduces learned helplessness",
        intelligences: ["Intrapersonal", "Executive Function", "Emotional"],
        ages: "3–10",
        researchBasis:
          "Dweck's 20-year research: growth mindset students show 30% higher academic achievement gains",
        householdApplication: "No materials — language and feedback reframing",
        activities: [
          "Brain grows when it's hard — discussion",
          "Mistake-of-the-day celebration",
          "Before/after effort drawing",
        ],
      },
      {
        name: "Spaced Repetition",
        origin: "Germany, Hermann Ebbinghaus 1885 / SuperMemo 1985",
        focus: "Long-term memory consolidation, forgetting curve reversal",
        mechanism:
          "Reviewing material at increasing intervals (1, 3, 7, 14 days) exploits memory reconsolidation for permanent retention",
        intelligences: ["Linguistic", "Logical-Mathematical", "Executive Function"],
        ages: "4–10",
        researchBasis:
          "Cepeda et al. (2006): Spaced practice produces 200% better long-term retention than massed practice",
        householdApplication: "Homemade card sets, small boxes for card sorting system",
        activities: [
          "Leitner box card sorting system",
          "Yesterday's lesson 2-minute recall",
          "Week-review memory challenge",
        ],
      },
      {
        name: "Outdoor/Forest School",
        origin: "Scandinavia/UK, 1950s–present",
        focus: "Risk assessment, physical competence, nature connection, resilience",
        mechanism:
          "Unstructured outdoor play builds executive function, risk calculation, and autonomy through real-world consequences",
        intelligences: ["Naturalist", "Bodily-Kinesthetic", "Executive Function", "Interpersonal"],
        ages: "1–10",
        researchBasis:
          "NHS UK: regular outdoor play improves attention, reduces ADHD symptoms, builds immune function",
        householdApplication: "Any outdoor space, sticks, mud, water, stones",
        activities: [
          "Den/fort building with sticks",
          "Mud kitchen cooking play",
          "Balance beam on fallen log",
        ],
      },
    ],
  },
];

// ============================================================
// SECTION 2: 13 INTELLIGENCE TYPES FRAMEWORK
// ============================================================

export const INTELLIGENCE_TYPES = [
  {
    id: "linguistic",
    number: 1,
    name: "Linguistic-Verbal",
    emoji: "📖",
    color: "#4361EE",
    bg: "#EEF1FF",
    origin: "Gardner (1983)",
    description: "Capacity to use language to express and appreciate complex meanings",
    brainRegion: "Left temporal lobe (Broca's & Wernicke's areas)",
    coreSkills: ["Reading", "Writing", "Storytelling", "Vocabulary", "Phonological awareness"],
    targetActivities: ["Rhyming games", "Story construction", "Word pattern matching", "Poetry"],
    developmentPeak: "Ages 1–7 (critical period for language acquisition)",
    methods: ["Kumon", "Waldorf", "Sthanapath", "Storytelling tradition"],
  },
  {
    id: "logical",
    number: 2,
    name: "Logical-Mathematical",
    emoji: "🔢",
    color: "#3A0CA3",
    bg: "#F0EEFF",
    origin: "Gardner (1983)",
    description: "Capacity to think conceptually and abstractly with numbers and patterns",
    brainRegion: "Left prefrontal cortex & parietal lobe",
    coreSkills: ["Number sense", "Pattern recognition", "Cause-effect reasoning", "Sequencing"],
    targetActivities: ["Sorting games", "Pattern blocks", "Logic puzzles", "Math storytelling"],
    developmentPeak: "Ages 4–12 (concrete-to-abstract transition)",
    methods: ["Vedic Math", "Abacus", "Bar Modeling", "Kumon", "Go"],
  },
  {
    id: "spatial",
    number: 3,
    name: "Spatial-Visual",
    emoji: "🎨",
    color: "#7209B7",
    bg: "#F9F0FF",
    origin: "Gardner (1983)",
    description: "Capacity to think in three dimensions, perceive and transform visual information",
    brainRegion: "Right parietal & occipital lobes",
    coreSkills: ["Mental rotation", "Map reading", "Visual memory", "Pattern design", "Perspective"],
    targetActivities: ["Origami", "Block construction", "Drawing from memory", "Mirror symmetry"],
    developmentPeak: "Ages 2–8 (most plastic spatial development window)",
    methods: ["Origami", "Mandala", "Calligraphy", "Bar Modeling", "Shichida"],
  },
  {
    id: "musical",
    number: 4,
    name: "Musical-Rhythmic",
    emoji: "🎵",
    color: "#F72585",
    bg: "#FFF0F7",
    origin: "Gardner (1983)",
    description: "Sensitivity to rhythm, melody, pitch, and musical patterns",
    brainRegion: "Right temporal lobe & auditory cortex",
    coreSkills: ["Rhythm keeping", "Pitch discrimination", "Pattern in music", "Movement to beat"],
    targetActivities: ["Clapping rhythms", "Beat patterns with cups", "Humming melodies", "Sound sorting"],
    developmentPeak: "Ages 1–5 (most rapid musical schema formation)",
    methods: ["Waldorf", "Sthanapath", "Shichida", "Movement play"],
  },
  {
    id: "kinesthetic",
    number: 5,
    name: "Bodily-Kinesthetic",
    emoji: "🤸",
    color: "#FB5607",
    bg: "#FFF4EF",
    origin: "Gardner (1983)",
    description: "Capacity to use one's body skillfully and handle objects dexterously",
    brainRegion: "Motor cortex, cerebellum, basal ganglia",
    coreSkills: ["Fine motor", "Gross motor", "Body awareness", "Balance", "Hand-eye coordination"],
    targetActivities: ["Balancing objects", "Threading", "Clay modeling", "Dance patterns"],
    developmentPeak: "Ages 1–6 (gross motor), 3–8 (fine motor refinement)",
    methods: ["Yoga", "Montessori", "Forest School", "Origami", "Calligraphy"],
  },
  {
    id: "interpersonal",
    number: 6,
    name: "Interpersonal",
    emoji: "🤝",
    color: "#06D6A0",
    bg: "#EDFFF8",
    origin: "Gardner (1983)",
    description: "Capacity to understand and work effectively with others",
    brainRegion: "Prefrontal cortex, mirror neuron system, limbic system",
    coreSkills: ["Empathy", "Cooperation", "Leadership", "Conflict resolution", "Social reading"],
    targetActivities: ["Cooperative games", "Role-play scenarios", "Group problem solving"],
    developmentPeak: "Ages 2–7 (Theory of Mind & empathy windows)",
    methods: ["Nunchi", "Reggio Emilia", "Forest School", "Waldorf"],
  },
  {
    id: "intrapersonal",
    number: 7,
    name: "Intrapersonal",
    emoji: "🧘",
    color: "#118AB2",
    bg: "#EFF8FC",
    origin: "Gardner (1983)",
    description: "Capacity to understand oneself and regulate inner states effectively",
    brainRegion: "Medial prefrontal cortex, anterior insula, amygdala regulation",
    coreSkills: ["Self-awareness", "Goal setting", "Emotion regulation", "Reflection", "Metacognition"],
    targetActivities: ["Feelings journaling (drawing)", "Breath awareness", "Daily reflection rituals"],
    developmentPeak: "Ages 4–10 (self-regulatory control development)",
    methods: ["Yoga", "Mandala", "Growth Mindset", "Waldorf"],
  },
  {
    id: "naturalist",
    number: 8,
    name: "Naturalist",
    emoji: "🌿",
    color: "#2DC653",
    bg: "#F0FFF4",
    origin: "Gardner (1995)",
    description: "Sensitivity to the natural world and skill in recognizing living things and phenomena",
    brainRegion: "Pattern recognition areas + sensory integration cortices",
    coreSkills: ["Classification", "Pattern in nature", "Sensory attunement", "Environmental curiosity"],
    targetActivities: ["Leaf/rock sorting", "Weather journaling", "Creature observation", "Nature patterns"],
    developmentPeak: "Ages 1–10 (continuous; foundational in early years)",
    methods: ["Shinrin-yoku", "Forest School", "Reggio Emilia", "Outdoor Learning"],
  },
  {
    id: "existential",
    number: 9,
    name: "Existential",
    emoji: "🌌",
    color: "#6B4FBB",
    bg: "#F5F0FF",
    origin: "Gardner (1999, candidate)",
    description: "Capacity to tackle questions about human existence, meaning, and the cosmos",
    brainRegion: "Default mode network, temporal-parietal junction",
    coreSkills: ["Wonder", "Big-picture thinking", "Questioning", "Meaning-making"],
    targetActivities: ["Why questions exploration", "Star/sky observation", "Story meaning discussions"],
    developmentPeak: "Ages 4–10 (conceptual curiosity emergence)",
    methods: ["Waldorf", "Reggio Emilia", "Shinrin-yoku"],
  },
  {
    id: "emotional",
    number: 10,
    name: "Emotional (EQ)",
    emoji: "❤️",
    color: "#E63946",
    bg: "#FFF0F1",
    origin: "Goleman (1995) / Salovey-Mayer (1990)",
    description: "Capacity to perceive, understand, manage, and reason with emotions",
    brainRegion: "Amygdala, prefrontal cortex, anterior cingulate cortex",
    coreSkills: ["Emotion identification", "Empathic accuracy", "Impulse control", "Social skills"],
    targetActivities: ["Emotion card games", "Feelings thermometer", "Calming strategy toolkit"],
    developmentPeak: "Ages 2–8 (amygdala-prefrontal connectivity window)",
    methods: ["Nunchi", "Yoga", "Growth Mindset", "Waldorf"],
  },
  {
    id: "creative",
    number: 11,
    name: "Creative",
    emoji: "💡",
    color: "#FFB703",
    bg: "#FFFBEF",
    origin: "Torrance (1966) / expanded by Robinson (2011)",
    description: "Capacity for original thinking, divergent ideation, and novel problem-solving",
    brainRegion: "Default mode network + executive control network (dual activation)",
    coreSkills: ["Divergent thinking", "Ideational fluency", "Flexibility", "Originality"],
    targetActivities: ["Open-ended building", "Alternative uses challenge", "Story invention", "Art with constraints"],
    developmentPeak: "Ages 3–8 (peak creative fluency; declines without nurturing)",
    methods: ["Reggio Emilia", "Waldorf", "Shichida", "Mandala", "Forest School"],
  },
  {
    id: "executive",
    number: 12,
    name: "Executive Function",
    emoji: "🎯",
    color: "#14213D",
    bg: "#F0F1F3",
    origin: "Miyake et al. (2000) / Diamond (2013)",
    description: "Working memory, cognitive flexibility, and inhibitory control — the brain's CEO",
    brainRegion: "Dorsolateral prefrontal cortex, anterior cingulate cortex",
    coreSkills: ["Working memory", "Inhibition", "Flexibility", "Planning", "Self-monitoring"],
    targetActivities: ["Simon Says variations", "Rule-switching games", "Memory chain games", "Wait games"],
    developmentPeak: "Ages 3–7 (explosive growth), continues to 25",
    methods: ["Montessori", "Kumon", "Spaced Repetition", "Go", "Growth Mindset"],
  },
  {
    id: "digital",
    number: 13,
    name: "Digital-Technological",
    emoji: "🔬",
    color: "#0077B6",
    bg: "#EFF8FF",
    origin: "Papert (1980) / Prensky (2001) / expanded",
    description: "Capacity to understand systems, computational thinking, and technological logic",
    brainRegion: "Prefrontal systems + spatial networks",
    coreSkills: ["Algorithmic thinking", "Cause-effect systems", "Pattern logic", "Debugging mindset"],
    targetActivities: ["Unplugged coding games", "Sequence instruction giving", "If-then logic puzzles"],
    developmentPeak: "Ages 5–10 (abstract systems thinking emergence)",
    methods: ["Kumon (structured sequences)", "Bar Modeling", "Logical-Math methods"],
  },
];

// ============================================================
// SECTION 3: AGE-SEGMENTED DEVELOPMENTAL MATRIX
// ============================================================

export const AGE_TIERS = [
  {
    tier: 1,
    ages: "1–2 years",
    label: "Seedling",
    emoji: "🌱",
    color: "#06D6A0",
    bg: "#EDFFF8",
    piagetStage: "Sensorimotor (late)",
    brainDevelopment:
      "Rapid synaptogenesis — 1 million neural connections/second. Myelination of sensory pathways. Object permanence emerging.",
    keyMilestones: [
      "Object permanence (8–12 months)",
      "First words (12 months)",
      "Symbolic play begins (18 months)",
      "Parallel play",
      "Walking and climbing",
    ],
    priorityIntelligences: ["Bodily-Kinesthetic", "Musical-Rhythmic", "Naturalist", "Interpersonal"],
    dailyFocus: ["Sensory exploration", "Imitation games", "Cause-effect play", "Language immersion"],
    activityDuration: "5–10 min",
    activityCount: 3,
    sampleActivities: [
      { name: "Rice Sensory Bin", method: "Montessori", intelligence: "Bodily-Kinesthetic", materials: "Bowl, rice, cups" },
      { name: "Peek-a-Boo Variations", method: "Shichida", intelligence: "Spatial-Visual", materials: "Cloth/towel" },
      { name: "Drum Beat Imitation", method: "Waldorf", intelligence: "Musical-Rhythmic", materials: "Pots, spoons" },
    ],
    warnings: ["Avoid screen time", "No competitive pressure", "Sensory safety critical"],
  },
  {
    tier: 2,
    ages: "3–4 years",
    label: "Sprout",
    emoji: "🌿",
    color: "#2DC653",
    bg: "#F0FFF4",
    piagetStage: "Preoperational (early)",
    brainDevelopment:
      "Prefrontal cortex pruning begins. Language explosion: 4–6 new words/day. Theory of Mind development (3–4 years). Corpus callosum formation.",
    keyMilestones: [
      "2,000+ vocabulary words",
      "Theory of Mind begins (false belief ~4)",
      "Symbolic/dramatic play",
      "Numbers 1–10 recognition",
      "Bilateral coordination",
    ],
    priorityIntelligences: ["Linguistic", "Creative", "Interpersonal", "Spatial-Visual"],
    dailyFocus: ["Language rich environment", "Imaginative play", "Basic counting", "Social play"],
    activityDuration: "10–15 min",
    activityCount: 3,
    sampleActivities: [
      { name: "Button Counting & Sorting", method: "Montessori", intelligence: "Logical-Mathematical", materials: "Buttons, muffin tin" },
      { name: "Emotion Face Cards", method: "Nunchi", intelligence: "Emotional", materials: "Paper, pen" },
      { name: "Paper Boat Origami", method: "Origami", intelligence: "Spatial-Visual", materials: "Any paper" },
    ],
    warnings: ["Symbolic play MUST be child-led", "Avoid rigid worksheets", "Focus on process not product"],
  },
  {
    tier: 3,
    ages: "5–6 years",
    label: "Sapling",
    emoji: "🌳",
    color: "#FFB703",
    bg: "#FFFBEF",
    piagetStage: "Preoperational → Concrete Operational",
    brainDevelopment:
      "Phonological processing rapid development. Anterior prefrontal maturing. Reading readiness neural networks activating. Phonemic awareness critical period.",
    keyMilestones: [
      "Phonemic awareness (reading foundation)",
      "Conservation concept emerging",
      "Simple addition/subtraction",
      "Rules-based game play",
      "Writing first letters/name",
    ],
    priorityIntelligences: ["Linguistic", "Logical-Mathematical", "Bodily-Kinesthetic", "Creative"],
    dailyFocus: ["Phonological awareness", "Early numeracy", "Rule-following games", "Creative construction"],
    activityDuration: "15–20 min",
    activityCount: 4,
    sampleActivities: [
      { name: "Sound Sorting Game", method: "Kumon/Phonics", intelligence: "Linguistic", materials: "Small objects, bowls" },
      { name: "Vedic Finger Multiplication", method: "Vedic Math", intelligence: "Logical-Mathematical", materials: "Fingers only" },
      { name: "Symmetry Fold Drawing", method: "Mandala", intelligence: "Spatial-Visual", materials: "Paper, pencil" },
    ],
    warnings: ["Reading readiness varies — never force", "Play must still dominate (60%+)", "Fine motor skills still developing"],
  },
  {
    tier: 4,
    ages: "7–8 years",
    label: "Branch",
    emoji: "🌲",
    color: "#FB5607",
    bg: "#FFF4EF",
    piagetStage: "Concrete Operational",
    brainDevelopment:
      "Logic circuits maturing. Hippocampal volume increasing (episodic memory). Prefrontal-limbic connectivity improving. Spaced repetition highly effective.",
    keyMilestones: [
      "Conservation mastered",
      "Logical classification & seriation",
      "Multiplication readiness",
      "Empathy for abstract others",
      "Sustained attention 20–30 min",
    ],
    priorityIntelligences: ["Logical-Mathematical", "Linguistic", "Executive Function", "Interpersonal"],
    dailyFocus: ["Mathematical reasoning", "Reading fluency", "Strategy games", "Spaced repetition"],
    activityDuration: "20–25 min",
    activityCount: 4,
    sampleActivities: [
      { name: "Bar Model Word Problems", method: "Bar Modeling", intelligence: "Logical-Mathematical", materials: "Paper strips, ruler" },
      { name: "Abacus Mental Math", method: "Abacus/Soroban", intelligence: "Spatial-Visual", materials: "Egg carton, buttons" },
      { name: "Go Territory Game (5×5)", method: "Chinese Go", intelligence: "Executive Function", materials: "Paper grid, stones" },
    ],
    warnings: ["Avoid excessive drilling", "Social comparison becomes sensitive", "Need challenge without anxiety"],
  },
  {
    tier: 5,
    ages: "9–10 years",
    label: "Forest",
    emoji: "🌳🌳",
    color: "#4361EE",
    bg: "#EEF1FF",
    piagetStage: "Concrete → Formal Operational (transition)",
    brainDevelopment:
      "Prefrontal executive systems approaching maturity. Abstract reasoning emerging. Working memory near adult capacity. Metacognition developing strongly.",
    keyMilestones: [
      "Abstract hypothetical thinking begins",
      "Multi-step problem solving",
      "Metacognition (thinking about thinking)",
      "Complex social dynamics navigation",
      "Self-directed learning capacity",
    ],
    priorityIntelligences: ["Executive Function", "Logical-Mathematical", "Existential", "Creative"],
    dailyFocus: ["Abstract reasoning", "Self-directed projects", "Complex strategy", "Metacognitive reflection"],
    activityDuration: "25–35 min",
    activityCount: 5,
    sampleActivities: [
      { name: "Leitner Spaced Repetition System", method: "Spaced Repetition", intelligence: "Executive Function", materials: "Index cards, 5 boxes" },
      { name: "Modular Origami Architecture", method: "Origami", intelligence: "Spatial-Visual", materials: "Paper, ruler" },
      { name: "Coding Without Computer", method: "Digital Intelligence", intelligence: "Digital-Technological", materials: "Paper, pencil" },
    ],
    warnings: ["Peer influence strengthens — leverage it", "Autonomy needs increase", "Growth mindset critical at this stage"],
  },
];

// ============================================================
// SECTION 4: ACTIVITY GENERATION ALGORITHM
// ============================================================

export const ALGORITHM = {
  overview:
    "The Activity Generation Engine (AGE) uses a multi-factor weighted scoring system to select 3–5 optimal daily activities from the content database, personalized to each child's age tier, developmental needs, and available materials.",

  inputs: [
    { name: "Child Age", field: "age", type: "number", required: true, description: "Maps to age tier (1–5)" },
    { name: "Focus Areas", field: "focusAreas", type: "multi-select", required: false, description: "Parent-selected intelligences to prioritize (optional)" },
    { name: "Available Materials", field: "materials", type: "checklist", required: true, description: "Selected from household materials inventory" },
    { name: "Time Available", field: "timeMin", type: "number", required: true, description: "Total minutes for activities (default: 60)" },
    { name: "Mood State", field: "mood", type: "select", required: false, description: "Child's energy level: high/medium/low/calm" },
    { name: "Recent History", field: "history", type: "auto", required: false, description: "Last 7 days of activities (auto-loaded from log)" },
  ],

  scoringFactors: [
    { factor: "Age Tier Match", weight: 30, description: "Activities perfectly calibrated for child's developmental stage" },
    { factor: "Intelligence Coverage Balance", weight: 20, description: "Ensures not all activities target same intelligence type" },
    { factor: "Method Diversity", weight: 15, description: "Mix of regional methods per session (not all Indian or all Japanese)" },
    { factor: "Material Availability", weight: 20, description: "Only selects activities where all materials are confirmed available" },
    { factor: "Variety (Anti-repetition)", weight: 10, description: "Activities not done in last 3 days get +10 score boost" },
    { factor: "Duration Balance", weight: 5, description: "Mix of short (5 min) and longer (25 min) activities to match time budget" },
  ],

  rules: [
    "RULE 1: Every daily set must cover at least 4 different intelligence types",
    "RULE 2: No more than 2 activities from the same regional method per day",
    "RULE 3: Each day must include at least 1 physical/bodily-kinesthetic activity",
    "RULE 4: Each day must include at least 1 creative/open-ended activity",
    "RULE 5: Activities done in last 24 hours are excluded from selection",
    "RULE 6: For ages 1–4, all activities must be max 10 minutes",
    "RULE 7: Spaced repetition: certain activities flagged for re-appearance at 1, 3, 7-day intervals",
    "RULE 8: Mood adaptation — 'low energy' days prioritize sensory, calming, or creative activities",
  ],

  outputStructure: {
    dailyPack: {
      date: "ISO date string",
      childId: "UUID",
      ageTier: "1–5",
      totalDuration: "minutes",
      activities: "Array of 3–5 Activity objects",
      balanceReport: "Intelligence types covered (array)",
      methodsUsed: "Regional methods used (array)",
    },
    activityObject: {
      id: "UUID",
      name: "string",
      description: "string (2–3 sentences, parent-friendly)",
      instructions: "string[] (step-by-step, max 6 steps)",
      duration: "number (minutes)",
      materials: "string[] (household items only)",
      intelligence: "string[] (1–3 types targeted)",
      method: "string (source methodology)",
      region: "string (Indian/Chinese/Japanese/Korean/Western)",
      ageTiers: "number[] (compatible tiers)",
      difficulty: "1–5 (auto-adjusted to age tier)",
      parentTip: "string (optional research insight)",
      extensionIdeas: "string[] (if child wants more)",
    },
  },

  phases: [
    { phase: "Phase 1 — Input Validation", description: "Validate age, normalize materials list, check history cache" },
    { phase: "Phase 2 — Activity Filtering", description: "Filter master database by age tier and available materials" },
    { phase: "Phase 3 — Scoring Engine", description: "Score each eligible activity using weighted factors" },
    { phase: "Phase 4 — Rule Application", description: "Apply mandatory rules, eliminate rule violations" },
    { phase: "Phase 5 — Pack Assembly", description: "Select top N activities (3–5) within time budget" },
    { phase: "Phase 6 — Diversity Check", description: "Verify intelligence and method diversity; swap if needed" },
    { phase: "Phase 7 — Output Formatting", description: "Format with descriptions, instructions, and parent tips" },
  ],
};

// ============================================================
// SECTION 5: CONTENT DATABASE SCHEMA
// ============================================================

export const DATABASE_SCHEMA = {
  collections: [
    {
      name: "activities",
      icon: "🎯",
      color: "#4361EE",
      description: "Master library of all brain development activities",
      fields: [
        { name: "id", type: "UUID", key: true },
        { name: "name", type: "string", required: true },
        { name: "description", type: "text", required: true },
        { name: "instructions", type: "string[]", required: true },
        { name: "duration_min", type: "number", required: true },
        { name: "duration_max", type: "number", required: true },
        { name: "age_tier_min", type: "number (1-5)", required: true },
        { name: "age_tier_max", type: "number (1-5)", required: true },
        { name: "intelligence_ids", type: "UUID[]", required: true },
        { name: "method_id", type: "UUID", required: true },
        { name: "region", type: "enum", required: true },
        { name: "material_ids", type: "UUID[]", required: true },
        { name: "difficulty", type: "number (1-5)", required: true },
        { name: "parent_tip", type: "text", optional: true },
        { name: "extension_ideas", type: "string[]", optional: true },
        { name: "safety_notes", type: "text", optional: true },
        { name: "research_citation", type: "string", optional: true },
        { name: "created_at", type: "timestamp", required: true },
        { name: "version", type: "number", required: true },
      ],
      estimatedRecords: "500–1000 activities (MVP: 150)",
    },
    {
      name: "methods",
      icon: "📚",
      color: "#7209B7",
      description: "Research methodologies and their metadata",
      fields: [
        { name: "id", type: "UUID", key: true },
        { name: "name", type: "string", required: true },
        { name: "region", type: "enum", required: true },
        { name: "origin_year", type: "string", optional: true },
        { name: "founder", type: "string", optional: true },
        { name: "core_mechanism", type: "text", required: true },
        { name: "research_basis", type: "text", required: true },
        { name: "primary_intelligences", type: "UUID[]", required: true },
        { name: "age_range", type: "string", required: true },
      ],
      estimatedRecords: "16 methods",
    },
    {
      name: "intelligences",
      icon: "🧠",
      color: "#F72585",
      description: "The 13 intelligence types with scoring weights",
      fields: [
        { name: "id", type: "UUID", key: true },
        { name: "name", type: "string", required: true },
        { name: "number", type: "number (1-13)", required: true },
        { name: "origin", type: "string", required: true },
        { name: "description", type: "text", required: true },
        { name: "brain_region", type: "string", required: true },
        { name: "core_skills", type: "string[]", required: true },
        { name: "development_peak", type: "string", required: true },
      ],
      estimatedRecords: "13 types",
    },
    {
      name: "materials",
      icon: "🧩",
      color: "#FB5607",
      description: "Household materials inventory with categorization",
      fields: [
        { name: "id", type: "UUID", key: true },
        { name: "name", type: "string", required: true },
        { name: "category", type: "enum", required: true },
        { name: "subcategory", type: "string", optional: true },
        { name: "common_name_variants", type: "string[]", optional: true },
        { name: "safety_age_min", type: "number", required: true },
        { name: "availability_regions", type: "string[]", optional: true },
        { name: "substitutes", type: "UUID[]", optional: true },
      ],
      estimatedRecords: "80–120 materials",
    },
    {
      name: "child_profiles",
      icon: "👦",
      color: "#06D6A0",
      description: "Individual child configuration and preferences",
      fields: [
        { name: "id", type: "UUID", key: true },
        { name: "name", type: "string", required: true },
        { name: "birth_date", type: "date", required: true },
        { name: "age_tier", type: "number (computed)", required: true },
        { name: "focus_intelligences", type: "UUID[]", optional: true },
        { name: "material_inventory_id", type: "UUID", required: true },
        { name: "language", type: "string", required: true },
        { name: "created_at", type: "timestamp", required: true },
      ],
      estimatedRecords: "Per user",
    },
    {
      name: "activity_logs",
      icon: "📊",
      color: "#FFB703",
      description: "Daily activity completion tracking for spaced repetition",
      fields: [
        { name: "id", type: "UUID", key: true },
        { name: "child_id", type: "UUID", required: true },
        { name: "activity_id", type: "UUID", required: true },
        { name: "date", type: "date", required: true },
        { name: "completed", type: "boolean", required: true },
        { name: "duration_actual", type: "number", optional: true },
        { name: "engagement_rating", type: "number (1-5)", optional: true },
        { name: "parent_notes", type: "text", optional: true },
        { name: "photo_url", type: "string", optional: true },
      ],
      estimatedRecords: "Growing daily per child",
    },
    {
      name: "daily_packs",
      icon: "📅",
      color: "#118AB2",
      description: "Generated daily activity sets with algorithm metadata",
      fields: [
        { name: "id", type: "UUID", key: true },
        { name: "child_id", type: "UUID", required: true },
        { name: "date", type: "date", required: true },
        { name: "activity_ids", type: "UUID[]", required: true },
        { name: "intelligences_covered", type: "UUID[]", required: true },
        { name: "methods_used", type: "UUID[]", required: true },
        { name: "algorithm_version", type: "string", required: true },
        { name: "total_duration", type: "number", required: true },
      ],
      estimatedRecords: "1 per child per day",
    },
  ],
};

// ============================================================
// SECTION 6: HOUSEHOLD MATERIALS LIBRARY
// ============================================================

export const MATERIALS_CATEGORIES = [
  {
    category: "Kitchen & Food",
    emoji: "🍳",
    color: "#FB5607",
    bg: "#FFF4EF",
    materials: [
      { name: "Rice / Grains", uses: ["Sensory bins", "Counting", "Abacus beads", "Texture trays"], safeAge: 3 },
      { name: "Dried Beans / Lentils", uses: ["Sorting", "Counting", "Sensory play", "Treasure hunts"], safeAge: 3 },
      { name: "Spoons (wooden/metal/plastic)", uses: ["Scooping transfers", "Rhythm instruments", "Balance experiments"], safeAge: 1 },
      { name: "Cups / Glasses (various sizes)", uses: ["Pouring", "Stacking", "Volume measurement", "Sound experiments"], safeAge: 1 },
      { name: "Bowls / Plates", uses: ["Sorting trays", "Painting surfaces", "Water play containers"], safeAge: 1 },
      { name: "Egg Cartons", uses: ["Abacus rows", "Sorting grids", "Counting trays", "Seedling beds"], safeAge: 2 },
      { name: "Salt / Sugar / Sand", uses: ["Writing trays", "Sensory texture", "Measurement"], safeAge: 3 },
      { name: "Cooking Pots / Lids", uses: ["Drum instruments", "Sound experiments", "Mud kitchen"], safeAge: 1 },
      { name: "Tongs / Clothespins", uses: ["Fine motor practice", "Transfer games", "Sorting"], safeAge: 3 },
      { name: "Muffin/Cupcake Tin", uses: ["Sorting math", "Color sorting", "Abacus grid"], safeAge: 2 },
    ],
  },
  {
    category: "Paper & Craft",
    emoji: "📄",
    color: "#4361EE",
    bg: "#EEF1FF",
    materials: [
      { name: "Any Paper (scrap/newspaper/old books)", uses: ["Origami", "Drawing", "Cutting practice", "Writing trays"], safeAge: 1 },
      { name: "Cardboard / Cereal Boxes", uses: ["Building", "Puzzles", "Bar models", "Flashcards"], safeAge: 1 },
      { name: "Pencils / Crayons", uses: ["Drawing", "Writing", "Tracing", "Mandala"], safeAge: 2 },
      { name: "Scissors (child-safe)", uses: ["Fine motor", "Cutting patterns", "Collage"], safeAge: 3 },
      { name: "Glue (washable)", uses: ["Collage", "Loose parts art", "Binding projects"], safeAge: 2 },
      { name: "Tape (any type)", uses: ["Construction", "Floor number lines", "Masking patterns"], safeAge: 1 },
      { name: "Paper Bags", uses: ["Puppets", "Storage", "Building projects"], safeAge: 1 },
      { name: "Old Magazines", uses: ["Collage", "Picture identification", "Letter hunting"], safeAge: 2 },
    ],
  },
  {
    category: "Small Objects & Loose Parts",
    emoji: "🔮",
    color: "#7209B7",
    bg: "#F9F0FF",
    materials: [
      { name: "Buttons (various sizes)", uses: ["Counting", "Mandala art", "Sorting", "Abacus beads"], safeAge: 3 },
      { name: "Stones / Pebbles", uses: ["Go game pieces", "Counting", "Painting", "Balance play"], safeAge: 3 },
      { name: "Shells", uses: ["Sorting", "Nature art", "Sound instruments", "Counting"], safeAge: 3 },
      { name: "Dried Leaves / Twigs", uses: ["Nature art", "Sorting", "Texture rubbings", "Play structures"], safeAge: 2 },
      { name: "Bottle Caps", uses: ["Counting discs", "Sorting", "Mosaic patterns", "Stamps"], safeAge: 3 },
      { name: "Cloth Scraps / Old Clothes", uses: ["Texture sensory", "Sewing practice", "Puppet costumes"], safeAge: 1 },
      { name: "String / Wool / Yarn", uses: ["Threading", "Weaving", "Measurement", "Cat's cradle"], safeAge: 4 },
      { name: "Old Keys", uses: ["Sorting", "Fine motor", "Treasure hunt props", "Counting"], safeAge: 4 },
    ],
  },
  {
    category: "Water & Outdoor",
    emoji: "💧",
    color: "#0077B6",
    bg: "#EFF8FF",
    materials: [
      { name: "Water", uses: ["Pouring", "Measurement", "Calligraphy (brush on surface)", "Science experiments"], safeAge: 1 },
      { name: "Mud / Soil", uses: ["Sensory play", "Sculpting", "Mud kitchen", "Planting"], safeAge: 1 },
      { name: "Sticks / Branches", uses: ["Drawing in dirt", "Fort building", "Measurement tools", "Balancing"], safeAge: 2 },
      { name: "Leaves (fallen)", uses: ["Rubbings", "Sorting by size/shape", "Art", "Mandala"], safeAge: 1 },
      { name: "Garden space / Sidewalk", uses: ["Chalk drawing", "Hopscotch math", "Outdoor yoga", "Measuring"], safeAge: 1 },
      { name: "Rainwater / Puddles", uses: ["Pouring", "Measurement", "Reflection observation"], safeAge: 2 },
    ],
  },
  {
    category: "Household Items",
    emoji: "🏠",
    color: "#2DC653",
    bg: "#F0FFF4",
    materials: [
      { name: "Pillows / Cushions", uses: ["Obstacle courses", "Balance", "Target games", "Yoga props"], safeAge: 1 },
      { name: "Blankets / Towels", uses: ["Den building", "Peek-a-boo", "Parachute games", "Quiet space"], safeAge: 1 },
      { name: "Torch / Flashlight", uses: ["Shadow play", "Light-dark exploration", "Cave storytelling"], safeAge: 2 },
      { name: "Mirror", uses: ["Self-awareness", "Symmetry exploration", "Emotion faces"], safeAge: 1 },
      { name: "Ruler / Measuring tape", uses: ["Bar modeling", "Measurement math", "Body measurement"], safeAge: 4 },
      { name: "Old Socks", uses: ["Puppet making", "Sorting pairs", "Bean bags (filled)"], safeAge: 1 },
      { name: "Books (any)", uses: ["Reading", "Storytelling props", "Pressing leaves", "Paper source"], safeAge: 1 },
      { name: "Rubber bands", uses: ["Geoboard (on cardboard)", "Sorting by size", "Fine motor"], safeAge: 5 },
    ],
  },
];

// ============================================================
// SECTION 7: APP FEATURES PLAN
// ============================================================

export const APP_FEATURES = [
  {
    category: "Core Features",
    emoji: "⭐",
    color: "#4361EE",
    features: [
      {
        name: "Daily Activity Generator",
        priority: "P0 — Launch Critical",
        description:
          "One-tap generation of 3–5 personalized daily activities based on child's age, available materials, and developmental priorities",
        userStory:
          "As a parent, I tap 'Generate My Day' and receive a curated set of activities I can do right now with what I have at home",
        screens: ["Home Screen", "Material Checklist", "Activity Pack View", "Individual Activity Detail"],
        technicalNotes: "Runs AGE algorithm client-side; no internet required after initial data sync",
      },
      {
        name: "Child Profile Setup",
        priority: "P0 — Launch Critical",
        description:
          "Create profiles for 1–3 children with age, name, and optional focus preferences",
        userStory:
          "As a parent, I set up my child's profile once and the app personalizes everything automatically",
        screens: ["Onboarding", "Profile Creation", "Age Picker", "Focus Area Selection"],
        technicalNotes: "Stored locally; age auto-converts to tier; birthday tracking for tier transitions",
      },
      {
        name: "Material Inventory Manager",
        priority: "P0 — Launch Critical",
        description:
          "Tap-to-toggle checklist of 80+ household materials; drives activity filtering",
        userStory:
          "As a parent, I tell the app once what I have at home, and it only shows me activities I can actually do",
        screens: ["Material Inventory", "Category Browse", "Search", "Confirm Available"],
        technicalNotes: "Persisted locally; re-check prompt every 14 days; material substitution suggestions",
      },
      {
        name: "Activity Detail View",
        priority: "P0 — Launch Critical",
        description:
          "Full step-by-step instructions, duration, materials list, parent tip, and research basis for each activity",
        userStory:
          "As a parent, I can read clear, simple instructions for each activity with a 'Why This Works' section",
        screens: ["Activity Detail", "Instructions Step View", "Parent Tip Panel", "Mark Complete"],
        technicalNotes: "Offline capable; instruction voice-over consideration for Phase 2",
      },
    ],
  },
  {
    category: "Progress & Tracking",
    emoji: "📈",
    color: "#06D6A0",
    features: [
      {
        name: "Activity Completion Log",
        priority: "P1 — Version 1.1",
        description:
          "Simple checkmark logging with optional 1–5 star engagement rating and parent notes",
        userStory:
          "As a parent, I mark activities done and see our growing history",
        screens: ["Mark Complete Modal", "Activity Log List", "Calendar View"],
        technicalNotes: "Feeds spaced repetition algorithm; stored locally with optional cloud sync",
      },
      {
        name: "Intelligence Balance Dashboard",
        priority: "P1 — Version 1.1",
        description:
          "Visual weekly/monthly breakdown of which of the 13 intelligence types have been exercised",
        userStory:
          "As a parent, I can see if we've been neglecting any intelligence area this week",
        screens: ["Dashboard", "Intelligence Radar Chart", "Weekly Summary"],
        technicalNotes: "Recharts radar chart; color-coded by intelligence type",
      },
      {
        name: "Milestone Tracker",
        priority: "P2 — Version 1.2",
        description:
          "Age-appropriate developmental milestones checklist with activity recommendations for any gaps",
        userStory:
          "As a parent, I see which developmental milestones are expected at my child's age and which we've observed",
        screens: ["Milestones List", "Milestone Detail", "Activity Recommendations for Gap"],
        technicalNotes: "Based on WHO developmental standards + Gardner framework",
      },
      {
        name: "Streak & Consistency Tracker",
        priority: "P2 — Version 1.2",
        description:
          "Daily streak counter and weekly consistency score with gentle encouragement (not gamification pressure)",
        userStory:
          "As a parent, I feel encouraged to maintain consistency without guilt on missed days",
        screens: ["Home Screen Widget", "Streak Card", "History Calendar"],
        technicalNotes: "Growth mindset language: 'Every activity counts' not punitive streak breaking",
      },
    ],
  },
  {
    category: "Content & Discovery",
    emoji: "🔍",
    color: "#7209B7",
    features: [
      {
        name: "Activity Library Browser",
        priority: "P1 — Version 1.1",
        description:
          "Full browseable library of all activities filterable by intelligence type, method, age, duration, and materials",
        userStory:
          "As a parent, I can explore and hand-pick activities beyond the daily recommendation",
        screens: ["Library Home", "Filter Panel", "Activity Cards Grid", "Saved Activities"],
        technicalNotes: "Algolia-style local search; bookmark/favorite system",
      },
      {
        name: "Research Corner",
        priority: "P2 — Version 1.2",
        description:
          "Bite-sized research summaries explaining the science behind each method — parent education hub",
        userStory:
          "As a parent, I want to understand WHY an activity works, explained simply",
        screens: ["Method Overview", "Research Card", "Study Summary"],
        technicalNotes: "Static content; short-form 150-word summaries with visual infographics",
      },
      {
        name: "Method Explorer",
        priority: "P2 — Version 1.2",
        description:
          "Visual world map of all 16 research methods with origin story, key principles, and related activities",
        userStory:
          "As a parent, I want to explore methods from different cultures and understand their origins",
        screens: ["World Map View", "Method Profile", "Related Activities"],
        technicalNotes: "SVG world map; tap country to reveal methods",
      },
    ],
  },
  {
    category: "Settings & Personalization",
    emoji: "⚙️",
    color: "#FB5607",
    features: [
      {
        name: "Multi-Child Support",
        priority: "P1 — Version 1.1",
        description: "Up to 3 child profiles per family account with age-specific independent recommendations",
        userStory: "As a parent with 2 kids of different ages, I get separate tailored activity sets for each",
        screens: ["Profile Switcher", "Add Child", "Per-Child Dashboard"],
        technicalNotes: "Profile switcher on home screen; independent algorithm runs per child",
      },
      {
        name: "Focus Mode Override",
        priority: "P1 — Version 1.1",
        description: "Parent can pin specific intelligence types to prioritize for a period (e.g. working on executive function this month)",
        userStory: "As a parent, I can tell the app 'focus more on emotional intelligence this week'",
        screens: ["Focus Settings", "Weight Sliders per Intelligence"],
        technicalNotes: "Modifies AGE algorithm scoring weights temporarily",
      },
      {
        name: "Time Budget Setting",
        priority: "P0 — Launch Critical",
        description: "Set available daily activity time (15, 30, 45, 60, 90 min) to adjust number and duration of activities",
        userStory: "On busy days I tell the app I only have 20 min — it gives me 2 quick activities",
        screens: ["Quick Time Selector", "Home Screen Context"],
        technicalNotes: "Feeds into AGE Phase 5 pack assembly duration constraint",
      },
    ],
  },
];

// ============================================================
// SECTION 8: IMPLEMENTATION ROADMAP
// ============================================================

export const ROADMAP_PHASES = [
  {
    phase: 1,
    name: "Research & Content Foundation",
    duration: "Months 1–2",
    color: "#4361EE",
    bg: "#EEF1FF",
    emoji: "📚",
    status: "current",
    objectives: [
      "Finalize all 16 research method profiles with citations",
      "Build initial activity database (150 activities minimum for MVP)",
      "Complete all 5 age-tier developmental matrices",
      "Define all 13 intelligence type rubrics",
      "Create 80-item household materials taxonomy",
      "Validate content with child development expert (1–2 consultants)",
    ],
    deliverables: [
      "Activity Database v1 (150+ entries in JSON/Sheets)",
      "Method Research Pack (16 methods, cited)",
      "Age-Tier Developmental Matrix Document",
      "Materials Taxonomy with safety ratings",
      "Blueprint Document (this document)",
    ],
    team: ["Lead Researcher", "Child Development Consultant", "Content Writer"],
    risks: ["Content volume — mitigation: prioritize Tier 1–3 activities first"],
  },
  {
    phase: 2,
    name: "Algorithm & Architecture Design",
    duration: "Months 2–3",
    color: "#7209B7",
    bg: "#F9F0FF",
    emoji: "🧮",
    status: "upcoming",
    objectives: [
      "Finalize Activity Generation Engine (AGE) algorithm specification",
      "Design complete database schema (all 7 collections)",
      "Define API contract between algorithm and UI",
      "Build scoring weight matrix and test with sample data",
      "Define spaced repetition scheduling logic",
      "Create algorithm simulation (spreadsheet or Python prototype)",
    ],
    deliverables: [
      "AGE Algorithm Spec Document v1",
      "Database Schema DDL",
      "API Contract Document",
      "Algorithm Prototype (Python/Sheets)",
      "Test Dataset (50 test cases with expected outputs)",
    ],
    team: ["Algorithm Designer", "Backend Architect", "QA Lead"],
    risks: ["Algorithm over-complexity — mitigation: start with rule-based, add ML later"],
  },
  {
    phase: 3,
    name: "MVP App Development",
    duration: "Months 3–6",
    color: "#F72585",
    bg: "#FFF0F7",
    emoji: "📱",
    status: "upcoming",
    objectives: [
      "Build React Native app (iOS + Android from single codebase)",
      "Implement P0 features: Daily Generator, Child Profile, Materials Manager, Activity Detail",
      "Integrate AGE algorithm as local computation engine",
      "Build local-first storage (SQLite / AsyncStorage)",
      "Design system with age-appropriate visual language",
      "Onboarding flow (3 screens max)",
    ],
    deliverables: [
      "React Native MVP App (iOS + Android)",
      "Local Database Implementation",
      "Core 4 P0 Screens Working",
      "Internal Alpha Build",
      "Design System (Figma + code components)",
    ],
    team: ["React Native Developer (×2)", "UI/UX Designer", "QA Tester"],
    risks: [
      "Algorithm performance on low-end Android — mitigation: optimize for 2GB RAM devices",
      "Content quality — mitigation: parent review panel",
    ],
  },
  {
    phase: 4,
    name: "Beta Testing & Refinement",
    duration: "Months 7–8",
    color: "#FB5607",
    bg: "#FFF4EF",
    emoji: "🧪",
    status: "upcoming",
    objectives: [
      "Recruit 50–100 parent beta testers (diverse ages, geographies)",
      "Run structured usability testing (think-aloud protocol)",
      "Validate activity quality and developmental accuracy",
      "Collect AGE algorithm satisfaction scores",
      "Fix critical bugs; refine UX pain points",
      "Add P1 features: Activity Log, Intelligence Dashboard, Library",
    ],
    deliverables: [
      "Beta Build v1.0",
      "Usability Testing Report",
      "Activity Quality Rating Report",
      "Bug Fix Release v1.0.1–v1.0.5",
      "Beta Feedback Summary Document",
    ],
    team: ["Product Manager", "UX Researcher", "Dev Team", "Beta Parent Community"],
    risks: ["Low beta engagement — mitigation: WhatsApp/community groups; incentivize with early access"],
  },
  {
    phase: 5,
    name: "Launch & Growth",
    duration: "Months 9–12",
    color: "#2DC653",
    bg: "#F0FFF4",
    emoji: "🚀",
    status: "upcoming",
    objectives: [
      "App Store & Google Play launch (free, no ads)",
      "Content expansion to 300+ activities",
      "Add P2 features: Milestones, Research Corner, Method Explorer",
      "Multi-language support (Hindi, Tamil, Mandarin, Korean, Spanish)",
      "Community features: share activity photos, parent forums",
      "Sustainability model: premium tier (cloud sync, PDF export, expert content)",
    ],
    deliverables: [
      "App Store / Google Play Launch",
      "v1.1 with P1 features complete",
      "v1.2 with P2 features complete",
      "Multi-language content packs",
      "Launch marketing website",
      "Monetization model live",
    ],
    team: ["Full Team + Marketing", "Community Manager", "Localization Partners"],
    risks: [
      "Discovery/distribution — mitigation: parent community seeding, school partnerships",
      "Monetization resistance — mitigation: free forever core, premium add-ons only",
    ],
  },
];

// ============================================================
// SECTION 9: ACTIVITY VOLUME TARGETS
// ============================================================

export const CONTENT_TARGETS = {
  mvpActivities: 150,
  v1Activities: 300,
  v2Activities: 600,
  fullActivities: 1000,
  breakdown: [
    { tier: "Tier 1 (1–2 yrs)", mvp: 25, v1: 50, v2: 100 },
    { tier: "Tier 2 (3–4 yrs)", mvp: 35, v1: 70, v2: 140 },
    { tier: "Tier 3 (5–6 yrs)", mvp: 35, v1: 70, v2: 140 },
    { tier: "Tier 4 (7–8 yrs)", mvp: 30, v1: 60, v2: 120 },
    { tier: "Tier 5 (9–10 yrs)", mvp: 25, v1: 50, v2: 100 },
  ],
  byRegion: [
    { region: "Indian", count: 25, percent: 17 },
    { region: "Chinese", count: 20, percent: 13 },
    { region: "Japanese", count: 25, percent: 17 },
    { region: "Korean", count: 15, percent: 10 },
    { region: "Western/Scandinavian", count: 40, percent: 27 },
    { region: "Cross-cultural/Blended", count: 25, percent: 16 },
  ],
};
