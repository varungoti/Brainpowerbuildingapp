// ============================================================
// NEUROSPARK — YEAR-LONG BRAIN DEVELOPMENT ROADMAP
// Research-backed, age-tiered, 300-activity journey data
// ============================================================

export interface WeekPlan {
  week: number;
  focus: string;
  activities: string[];
}

export interface MonthPlan {
  month: number;
  theme: string;
  emoji: string;
  color: string;
  description: string;
  scienceNote: string;
  intelligenceFocus: string[];
  weeklyTarget: number;
  milestones: string[];
  researchHighlight: string;
  weeklyPlans: WeekPlan[];
  culturalMethod: string;
}

export interface IntelProjection {
  intel: string;
  emoji: string;
  targetActivities: number;
  yearEndOutcome: string;
  color: string;
  category: string;
}

export interface YearPlan {
  tier: number;
  ageRange: string;
  tagline: string;
  yearEndVision: string;
  activitiesNeeded: number;
  weeklyTarget: number;
  months: MonthPlan[];
  projections: IntelProjection[];
  researchBacking: string[];
  yearEndStats: {
    label: string;
    value: string;
    emoji: string;
    color: string;
  }[];
}

// ─── Tier 1: Ages 1-2 ──────────────────────────────────────────────────────────
const TIER1_YEAR_PLAN: YearPlan = {
  tier: 1,
  ageRange: "1–2 years",
  tagline: "Building the Neural Foundation",
  yearEndVision: "By year end, your baby will have richly developed sensory-motor integration, formed secure attachment, developed a vocabulary of 50+ words, and built the neural foundations for all future learning. Their brain will have formed millions of new connections strengthened through joyful, responsive play.",
  activitiesNeeded: 300,
  weeklyTarget: 6,
  months: [
    {
      month: 1, theme: "Sensory Awakening", emoji: "✨", color: "#FF6B6B",
      description: "The first month ignites all five senses through rich, safe sensory experiences. Every new texture, sound, taste, and smell creates 700 new neural connections per second.",
      scienceNote: "The somatosensory cortex is the fastest-developing brain region in year 1. Tactile discrimination at 12 months predicts fine motor skills at age 5 (Gabbard, 2008).",
      intelligenceFocus: ["Bodily-Kinesthetic", "Naturalist", "Spatial-Visual"],
      weeklyTarget: 5, culturalMethod: "Montessori + Ayurvedic Baby Massage",
      milestones: ["Reach for objects intentionally", "Show distinct responses to 4 different textures", "Turn toward new sounds consistently"],
      researchHighlight: "Harvard study: Babies with rich sensory environments develop 22% more synaptic connections by age 2.",
      weeklyPlans: [
        { week: 1, focus: "Touch Exploration", activities: ["Texture board exploration", "Safe fabric sorting", "Hand-over-hand sand play"] },
        { week: 2, focus: "Sound Discovery", activities: ["Drum imitation", "Music exploration", "Voice modulation games"] },
        { week: 3, focus: "Visual Tracking", activities: ["Slow-moving object tracking", "High-contrast card gazing", "Light and shadow play"] },
        { week: 4, focus: "Multi-Sensory Integration", activities: ["Water play with cups", "Nature texture walk", "Scent bottle exploration"] },
      ]
    },
    {
      month: 2, theme: "Object Permanence", emoji: "👀", color: "#4ECDC4",
      description: "Hidden objects still exist — this revolutionary discovery unlocks abstract thinking. Activities focus on hiding, finding, and celebrating the moment of rediscovery.",
      scienceNote: "Piaget identified object permanence (8–12 months) as the first step toward all abstract cognition. Each peek-a-boo game strengthens the prefrontal-temporal circuit.",
      intelligenceFocus: ["Spatial-Visual", "Logical-Mathematical", "Interpersonal"],
      weeklyTarget: 5, culturalMethod: "Shichida Method + Japanese Kangaroo Play",
      milestones: ["Searches for hidden toy under cloth", "Anticipates return of hidden object", "Shows excitement at reveal"],
      researchHighlight: "Object permanence development directly predicts symbolic play ability at age 3 (Diamond, 1985).",
      weeklyPlans: [
        { week: 1, focus: "Peek-a-Boo Variations", activities: ["Face peek-a-boo", "Behind-door games", "Under-blanket search"] },
        { week: 2, focus: "Hidden Objects", activities: ["Under-cloth toy search", "Cup hiding games", "Drawer discovery play"] },
        { week: 3, focus: "Anticipation Games", activities: ["Pop-up surprise games", "Jack-in-box imitation", "Sound-before-reveal games"] },
        { week: 4, focus: "Spatial Memory", activities: ["2-cup hiding game", "Location memory practice", "Route familiarity walks"] },
      ]
    },
    {
      month: 3, theme: "Imitation & Mirror Neurons", emoji: "🪞", color: "#A8E6CF",
      description: "Mirror neurons — the basis of empathy, language, and social learning — are activated through imitation games. Copy my action, I copy yours: the primal learning loop.",
      scienceNote: "Mirror neuron systems underlie language acquisition, empathy, and social learning. Imitation games at 12–18 months directly predict language richness at age 3 (Meltzoff, 1999).",
      intelligenceFocus: ["Interpersonal", "Linguistic", "Musical-Rhythmic"],
      weeklyTarget: 5, culturalMethod: "Waldorf Social Play + Korean Nunchi",
      milestones: ["Imitates 5 different actions on request", "Initiates imitation games spontaneously", "Copies facial expressions accurately"],
      researchHighlight: "Mirror neuron rich environments: children show 31% better language scores at age 2 (Meltzoff & Moore, 1997).",
      weeklyPlans: [
        { week: 1, focus: "Facial Imitation", activities: ["Expression mirroring", "Tongue game", "Exaggerated emotion faces"] },
        { week: 2, focus: "Action Imitation", activities: ["Clapping patterns", "Object use imitation", "Body part pointing"] },
        { week: 3, focus: "Sound Imitation", activities: ["Animal sound mirroring", "Rhythm copying", "Vocal pitch matching"] },
        { week: 4, focus: "Sequence Imitation", activities: ["2-step action sequences", "Song with gestures", "Morning routine imitating"] },
      ]
    },
    {
      month: 4, theme: "Cause & Effect", emoji: "⚡", color: "#FFB347",
      description: "Drop a spoon: it falls. Tap a pot: it sounds. Push a button: it lights up. Cause-and-effect understanding is the seed of all scientific and mathematical reasoning.",
      scienceNote: "Causal reasoning develops rapidly between 12–24 months. Children who understand cause-effect at 18 months show stronger scientific reasoning at age 7 (Gopnik, 2012).",
      intelligenceFocus: ["Logical-Mathematical", "Bodily-Kinesthetic", "Naturalist"],
      weeklyTarget: 5, culturalMethod: "Reggio Emilia + Indian Curiosity Play",
      milestones: ["Intentionally causes 3 different effects", "Predicts outcome before causing it", "Shows 'testing' behavior systematically"],
      researchHighlight: "\"Children are the best scientists\" — cause-effect play at 15–18 months directly correlates with STEM aptitude (Gopnik, 2016).",
      weeklyPlans: [
        { week: 1, focus: "Object Drop Experiments", activities: ["Drop and hear experiments", "Ramp rolling trials", "Splash water activities"] },
        { week: 2, focus: "Tool Use Discovery", activities: ["Spoon as lever", "Cup filling experiments", "Switch activation games"] },
        { week: 3, focus: "Natural Cause-Effect", activities: ["Plant watering observation", "Ice melting watch", "Shadow changing games"] },
        { week: 4, focus: "Social Cause-Effect", activities: ["Baby laughter games", "Hug-response play", "Communication cause-effect"] },
      ]
    },
    {
      month: 5, theme: "Language Roots", emoji: "💬", color: "#DDA0DD",
      description: "Language explosion: gesture + gaze + babbling = 50,000 new words by age 18. Joint attention, naming games, and rich conversation bathe the brain in language.",
      scienceNote: "The language critical window peaks at 18 months. Vocabulary at 24 months predicts reading ability at age 8 with remarkable accuracy (Hart & Risley, 1995).",
      intelligenceFocus: ["Linguistic", "Interpersonal", "Emotional"],
      weeklyTarget: 6, culturalMethod: "Waldorf Language + Japanese Nursery Rhymes",
      milestones: ["Uses 10+ single words intentionally", "Points to 10+ named objects", "Uses gesture + word combinations"],
      researchHighlight: "Hart & Risley (1995): 30 million word gap by age 3. Rich conversational exposure starts bridging this from day 1.",
      weeklyPlans: [
        { week: 1, focus: "Joint Attention", activities: ["Point-and-name routines", "Shared gaze book reading", "Object-name games"] },
        { week: 2, focus: "Nursery Rhymes", activities: ["Daily rhyme routine", "Fill-in-the-word pausing", "Action rhymes"] },
        { week: 3, focus: "Word Richness", activities: ["Color naming walks", "Body part games", "Texture word vocabulary"] },
        { week: 4, focus: "Story Seeds", activities: ["Simple 3-picture sequences", "Daily narrative ('today we...')", "Puppet character naming"] },
      ]
    },
    {
      month: 6, theme: "Gross Motor Mastery", emoji: "🏃", color: "#98D8C8",
      description: "Walking, climbing, throwing, and catching build cerebellar circuits that directly support mathematics, reading, and attention. Movement IS learning at this age.",
      scienceNote: "Cerebellum develops alongside motor skills in year 2. Gross motor milestones at 18 months predict executive function at age 5 (Piek et al., 2008).",
      intelligenceFocus: ["Bodily-Kinesthetic", "Spatial-Visual", "Intrapersonal"],
      weeklyTarget: 6, culturalMethod: "Waldorf Movement Play + Indian Yoga",
      milestones: ["Walk stably up/down 3 steps", "Throw a ball with aim", "Navigate an obstacle course of 4 elements"],
      researchHighlight: "Physical activity in toddlers directly thickens the prefrontal cortex — even 30 min/day of active play produces measurable brain changes (Hillman, 2008).",
      weeklyPlans: [
        { week: 1, focus: "Balance Development", activities: ["Balance beam (tape on floor)", "One-foot standing attempts", "Rocking boat games"] },
        { week: 2, focus: "Throwing & Catching", activities: ["Bean bag toss", "Ball rolling games", "Soft ball catching"] },
        { week: 3, focus: "Climbing & Descending", activities: ["Cushion mountain", "Step practice", "Indoor obstacle course"] },
        { week: 4, focus: "Rhythm Movement", activities: ["Dancing to music", "March and freeze", "Animal movement imitation"] },
      ]
    },
    {
      month: 7, theme: "Fine Motor Precision", emoji: "🤏", color: "#F7DC6F",
      description: "The pincer grip, stacking, threading, and pouring build the cerebellar precision circuits that will directly enable writing, drawing, and musical instrument play.",
      scienceNote: "Fine motor skills at 24 months are the single strongest predictor of handwriting fluency at age 7. Pincer grip accuracy predicts reading readiness (Cameron et al., 2012).",
      intelligenceFocus: ["Bodily-Kinesthetic", "Spatial-Visual", "Logical-Mathematical"],
      weeklyTarget: 6, culturalMethod: "Montessori Practical Life + Japanese Origami seeds",
      milestones: ["Pincer grip mastery (picks up single grain)", "Stacks 6+ blocks", "Pours water with minimal spilling"],
      researchHighlight: "Montessori practical life activities produce significantly higher fine motor scores at age 5 than play-based approaches alone (Lillard, 2012).",
      weeklyPlans: [
        { week: 1, focus: "Pincer Activities", activities: ["Pom-pom tweezers", "Bean pickup game", "Sticker peeling"] },
        { week: 2, focus: "Stacking & Building", activities: ["Cup towers", "Block architectures", "Natural material stacking"] },
        { week: 3, focus: "Pouring & Transferring", activities: ["Water pouring practice", "Spoon transfer", "Ladle soup game"] },
        { week: 4, focus: "Mark-Making", activities: ["Thick crayon scribbling", "Finger painting", "Water brush strokes"] },
      ]
    },
    {
      month: 8, theme: "Symbolic Play", emoji: "🎭", color: "#BB8FCE",
      description: "A banana becomes a phone. A box becomes a car. Symbolic play is the greatest cognitive leap of year 2 — and the foundation of all language, mathematics, and creativity.",
      scienceNote: "Symbolic play emergence (18–24 months) marks the beginning of representational thinking. Its richness at 24 months predicts language, math, and social competence at school entry (McCune, 1995).",
      intelligenceFocus: ["Creative", "Linguistic", "Interpersonal", "Logical-Mathematical"],
      weeklyTarget: 6, culturalMethod: "Waldorf Imaginative Play + Reggio Emilia",
      milestones: ["Uses one object to represent another in 3 scenarios", "Creates a simple 2-step pretend play sequence", "Engages in shared symbolic play with parent"],
      researchHighlight: "Rich pretend play at 24 months is the #1 predictor of story comprehension at age 5 (Nicolich, 1977).",
      weeklyPlans: [
        { week: 1, focus: "Object Substitution", activities: ["Banana phone play", "Cup as hat game", "Cloth as cape"] },
        { week: 2, focus: "Role Play Seeds", activities: ["Feeding baby doll", "Doctor play", "Tea party with toys"] },
        { week: 3, focus: "Sequence Play", activities: ["Cooking pretend sequence", "Bedtime for teddy", "Going to market game"] },
        { week: 4, focus: "Shared Storytelling", activities: ["Parent-child puppet play", "Simple story acting", "Character voices game"] },
      ]
    },
    {
      month: 9, theme: "Emotional Safety", emoji: "💝", color: "#F1948A",
      description: "Secure attachment — the felt sense of unconditional love and consistent response — builds the emotional foundation from which all courage, curiosity, and learning grow.",
      scienceNote: "Secure attachment (Bowlby/Ainsworth) predicts academic achievement, social competence, mental health, and even immune function. 65% of children with secure attachment show stronger school readiness (Shonkoff, 2000).",
      intelligenceFocus: ["Emotional", "Intrapersonal", "Interpersonal"],
      weeklyTarget: 5, culturalMethod: "Indian Attachment Parenting + Scandinavian Lagom",
      milestones: ["Show clear preference for primary caregiver", "Use parent as 'safe base' for exploration", "Begin expressing 4 basic emotions with clarity"],
      researchHighlight: "Harvard: The most important predictor of adult health, happiness, and relationships is the quality of emotional attunement in the first 2 years.",
      weeklyPlans: [
        { week: 1, focus: "Attunement Play", activities: ["Mirror emotion games", "Calm presence activities", "Skin-to-skin connection"] },
        { week: 2, focus: "Emotion Naming", activities: ["Happy/sad face games", "Emotion story books", "Feeling songs"] },
        { week: 3, focus: "Repair Games", activities: ["Boo-boo comfort rituals", "Reunion greeting games", "Worry-walk together"] },
        { week: 4, focus: "Secure Exploration", activities: ["Safe base exploration game", "Brave-try celebrations", "I'm-here-watching play"] },
      ]
    },
    {
      month: 10, theme: "Nature Intelligence", emoji: "🌿", color: "#58D68D",
      description: "The brain evolved outdoors. Barefoot on grass, holding a snail, watching rain — nature exposure restores attention, regulates stress hormones, and activates the naturalist intelligence.",
      scienceNote: "Kuo & Taylor (2004): Nature exposure reduces ADHD symptoms by 20% and improves directed attention significantly. Even 20 minutes in a garden has measurable cortisol-reducing effects.",
      intelligenceFocus: ["Naturalist", "Bodily-Kinesthetic", "Spatial-Visual"],
      weeklyTarget: 5, culturalMethod: "Shinrin-yoku (Japanese Forest Bathing) + Indian Prakriti",
      milestones: ["Name 5 natural objects (tree, stone, cloud, grass, water)", "Show curiosity about 3 living things", "Walk barefoot on 3 different natural surfaces"],
      researchHighlight: "Children with regular nature contact show stronger executive function and lower anxiety across 12 longitudinal studies (Fyhn, 2018).",
      weeklyPlans: [
        { week: 1, focus: "Outdoor Textures", activities: ["Barefoot texture walk", "Leaf collection", "Mud exploration"] },
        { week: 2, focus: "Living Things", activities: ["Bug observation", "Plant watering", "Bird watching"] },
        { week: 3, focus: "Natural Art", activities: ["Leaf printing", "Stone balancing", "Cloud shapes"] },
        { week: 4, focus: "Weather Exploration", activities: ["Rain puddle play", "Wind observation", "Shadow tracking"] },
      ]
    },
    {
      month: 11, theme: "Music & Rhythm", emoji: "🎵", color: "#85C1E9",
      description: "Rhythm processing shares neural pathways with language and mathematics. A baby who is bathed in music, rhyme, and beat from year 1 has stronger reading, math, and emotional regulation at age 5.",
      scienceNote: "Schlaug (2005): Musical training beginning before age 7 produces structural brain differences — enlarged corpus callosum and auditory cortex. Even passive music exposure in infancy improves phonological processing.",
      intelligenceFocus: ["Musical-Rhythmic", "Linguistic", "Bodily-Kinesthetic"],
      weeklyTarget: 6, culturalMethod: "Waldorf Music + Indian Ragas + Japanese Taiko",
      milestones: ["Clap a 3-beat rhythm accurately", "Recognize 5 songs by first 2 notes", "Spontaneously sing portions of familiar songs"],
      researchHighlight: "Children with rich musical environments before age 2 show 20% better phonemic awareness at school entry (Anvari et al., 2002).",
      weeklyPlans: [
        { week: 1, focus: "Beat and Rhythm", activities: ["Drum imitation sequences", "March to music", "Body percussion"] },
        { week: 2, focus: "Melody & Singing", activities: ["Daily song repertoire", "Pitch matching games", "Humming walks"] },
        { week: 3, focus: "Instruments Exploration", activities: ["Homemade instrument making", "Pot percussion orchestra", "Shaker play"] },
        { week: 4, focus: "Music & Movement", activities: ["Freeze dance", "Musical emotions", "Lullaby wind-down"] },
      ]
    },
    {
      month: 12, theme: "Year 1 Integration", emoji: "🏆", color: "#F39C12",
      description: "The integration month: revisit the best activities from each month, celebrate milestones, and document the incredible journey. Review what your baby can now do that they couldn't 12 months ago.",
      scienceNote: "Consolidation of year-1 learning: the hippocampus integrates episodic memories into long-term cortical storage during the 18–24 month period. Celebratory review strengthens these connections.",
      intelligenceFocus: ["All 13 intelligences — integration"],
      weeklyTarget: 5, culturalMethod: "All global traditions — celebration synthesis",
      milestones: ["Demonstrate milestones from all 11 months", "Show clear preferences in activities", "Communicate about completed activities"],
      researchHighlight: "Year 1 neurodevelopment: 1 billion new synaptic connections made. At 24 months, your child's brain is 70% of adult volume and twice as active metabolically.",
      weeklyPlans: [
        { week: 1, focus: "Sensory Celebration", activities: ["Best sensory activities revisit", "New sensory combinations", "Texture memory game"] },
        { week: 2, focus: "Movement Celebration", activities: ["Best motor activities", "Obstacle course mastery", "Dance performance"] },
        { week: 3, focus: "Language & Story", activities: ["Story retelling attempts", "Name all known objects", "Favorite song performance"] },
        { week: 4, focus: "Portfolio Review", activities: ["Photo review together", "Try hardest activity again", "Future goals celebration"] },
      ]
    },
  ],
  projections: [
    { intel: "Bodily-Kinesthetic", emoji: "🏃", targetActivities: 55, yearEndOutcome: "Fine & gross motor at 12-month ahead of peers; cerebellar circuits primed for writing, sports, and music", color: "#E74C3C", category: "Physical" },
    { intel: "Sensory-Naturalist", emoji: "🌿", targetActivities: 40, yearEndOutcome: "Sensory integration complete; tactile discrimination equivalent to 3-year-old; nature connection established", color: "#27AE60", category: "Natural" },
    { intel: "Linguistic", emoji: "💬", targetActivities: 50, yearEndOutcome: "50+ word vocabulary; two-word combinations emerging; phonological awareness seeded", color: "#2980B9", category: "Language" },
    { intel: "Interpersonal", emoji: "🤝", targetActivities: 40, yearEndOutcome: "Secure attachment formed; joint attention robust; social referencing reliable", color: "#8E44AD", category: "Social" },
    { intel: "Musical-Rhythmic", emoji: "🎵", targetActivities: 35, yearEndOutcome: "Beat discrimination accurate; 10+ songs known; auditory cortex expanded beyond non-musical peers", color: "#16A085", category: "Creative" },
    { intel: "Spatial-Visual", emoji: "🗺️", targetActivities: 35, yearEndOutcome: "Object permanence secure; spatial memory developing; 3D object rotation emerging", color: "#D35400", category: "Cognitive" },
    { intel: "Emotional", emoji: "💝", targetActivities: 30, yearEndOutcome: "4 core emotions recognized and expressed; regulation improving; attachment security established", color: "#C0392B", category: "Emotional" },
    { intel: "Logical-Mathematical", emoji: "🔢", targetActivities: 25, yearEndOutcome: "Cause-effect understanding solid; number sense seeds planted; category awareness developing", color: "#1ABC9C", category: "Cognitive" },
    { intel: "Creative", emoji: "🎨", targetActivities: 20, yearEndOutcome: "Symbolic play emerging; creative expression through mark-making; divergent thinking seeded", color: "#9B59B6", category: "Creative" },
    { intel: "Intrapersonal", emoji: "🧘", targetActivities: 20, yearEndOutcome: "Self-awareness beginning; emotional self-recognition developing; exploration confidence growing", color: "#F39C12", category: "Emotional" },
  ],
  researchBacking: [
    "Harvard Center on the Developing Child: 700 new neural connections per second in the first years",
    "Hart & Risley (1995): Vocabulary at 24 months predicts reading at age 8",
    "Piaget: Object permanence as foundation of all abstract thinking",
    "Bowlby/Ainsworth: Secure attachment predicts lifetime outcomes",
    "Schlaug (2005): Musical exposure before age 7 produces permanent structural brain advantages",
  ],
  yearEndStats: [
    { label: "Neural Connections Built", value: "1 Billion+", emoji: "🧠", color: "#4361EE" },
    { label: "Brain Volume Reached", value: "70% of Adult", emoji: "📈", color: "#7209B7" },
    { label: "Intelligence Types Exercised", value: "10 of 13", emoji: "⚡", color: "#FB5607" },
    { label: "Language Readiness", value: "Advanced", emoji: "💬", color: "#06D6A0" },
  ]
};

// ─── Tier 2: Ages 3-4 ──────────────────────────────────────────────────────────
const TIER2_YEAR_PLAN: YearPlan = {
  tier: 2,
  ageRange: "3–4 years",
  tagline: "The Imagination & Language Explosion",
  yearEndVision: "By year end, your child will be reading-ready with strong phonemic awareness, counting to 20 with understanding, demonstrating rich imaginative play, showing empathy and emotional vocabulary, and showing the kind of joyful learning curiosity that makes school a place of adventure rather than obligation.",
  activitiesNeeded: 300,
  weeklyTarget: 6,
  months: [
    {
      month: 1, theme: "Phonemic Awareness Launch", emoji: "🔤", color: "#E74C3C",
      description: "The single most predictive skill for reading success. Rhyming, syllable clapping, first-sound identification — these oral language games wire the brain for decoding before a single letter is taught.",
      scienceNote: "Phonemic awareness is the strongest predictor of early reading. Children with strong phonological awareness at age 4 read 2 years ahead at age 7 (Stanovich, 1994).",
      intelligenceFocus: ["Linguistic", "Musical-Rhythmic", "Logical-Mathematical"],
      weeklyTarget: 6, culturalMethod: "Kumon Language + Welsh Coleg Cymraeg nursery rhymes",
      milestones: ["Clap syllables in 10+ words", "Identify first sounds in 8+ words", "Rhyme 10+ word pairs"],
      researchHighlight: "National Reading Panel: Phonemic awareness instruction produces the largest effect sizes of any reading intervention.",
      weeklyPlans: [
        { week: 1, focus: "Syllable Awareness", activities: ["Syllable clapping games", "Name syllable march", "Food name sorting by syllable count"] },
        { week: 2, focus: "Rhyme Recognition", activities: ["Nursery rhyme completion", "Rhyme pairs sorting", "Silly rhyme creation"] },
        { week: 3, focus: "Initial Sound Isolation", activities: ["Sound sorting games", "I Spy with sounds", "Sound object hunts"] },
        { week: 4, focus: "Blending Games", activities: ["Slow-motion word blending", "Robot talk game", "Word building with sounds"] },
      ]
    },
    {
      month: 2, theme: "Number Sense Foundation", emoji: "🔢", color: "#3498DB",
      description: "Counting is not just reciting numbers — it's understanding that each number represents a quantity. One-to-one correspondence, cardinality, and the mental number line: the architecture of mathematical thinking.",
      scienceNote: "Cardinal number knowledge at age 4 predicts algebraic reasoning at age 14 better than any other early predictor (Siegler et al., 2013).",
      intelligenceFocus: ["Logical-Mathematical", "Spatial-Visual", "Bodily-Kinesthetic"],
      weeklyTarget: 6, culturalMethod: "Singapore Math (CPA) + Indian Sthanapath",
      milestones: ["Count objects to 15 with one-to-one correspondence", "Understand 'more' and 'less' for quantities up to 10", "Recognize numerals 1–10"],
      researchHighlight: "Siegler (2013): Number line understanding at age 5 predicts algebra mastery at age 14.",
      weeklyPlans: [
        { week: 1, focus: "Counting Objects", activities: ["Counting collections", "Egg cup sorting", "Nature number walks"] },
        { week: 2, focus: "More/Less Concepts", activities: ["Comparison sorting games", "Fair sharing activities", "Balance scale experiments"] },
        { week: 3, focus: "Number Line Embodiment", activities: ["Number line hopscotch", "Step counting", "Ruler introduction"] },
        { week: 4, focus: "Pattern Recognition", activities: ["AB pattern continuation", "Pattern in nature hunts", "Bead pattern stringing"] },
      ]
    },
    {
      month: 3, theme: "Imaginative Play Mastery", emoji: "🎭", color: "#9B59B6",
      description: "Pretend play is cognitive development in disguise — it requires planning, theory of mind, narrative structure, role-taking, and creativity all simultaneously. It is the child's work.",
      scienceNote: "Richness of pretend play at age 3–4 predicts narrative comprehension, perspective-taking, and creativity at age 8 (Singer & Singer, 2005).",
      intelligenceFocus: ["Creative", "Interpersonal", "Linguistic", "Executive Function"],
      weeklyTarget: 6, culturalMethod: "Waldorf Free Play + Reggio Emilia Documentation",
      milestones: ["Sustain pretend play sequence for 15+ minutes", "Take 3+ different roles in one play session", "Create a simple story with beginning-middle-end"],
      researchHighlight: "Fantasy play develops executive function more than any direct training method (Vygotsky's ZPD in action).",
      weeklyPlans: [
        { week: 1, focus: "Role Play Scenarios", activities: ["Doctor/patient role play", "Market buying/selling", "Restaurant family play"] },
        { week: 2, focus: "Storytelling", activities: ["3-picture story sequences", "Character creation games", "Story continuation play"] },
        { week: 3, focus: "World Building", activities: ["Box city construction", "Miniature world creation", "Map drawing of imaginary land"] },
        { week: 4, focus: "Collaborative Play", activities: ["Parent-child joint storytelling", "Puppet theater creation", "Group adventure game"] },
      ]
    },
    {
      month: 4, theme: "Creative Art Expression", emoji: "🎨", color: "#E67E22",
      description: "Art at this age is not about the product — it is about the process of exploring, deciding, and expressing. Process art builds divergent thinking, the cognitive skill most linked to adult creativity.",
      scienceNote: "Divergent thinking (the ability to generate multiple solutions) peaks between ages 3–5 and must be exercised. Torrance Tests: children who do process art show 2× higher divergent thinking scores.",
      intelligenceFocus: ["Creative", "Spatial-Visual", "Bodily-Kinesthetic", "Intrapersonal"],
      weeklyTarget: 5, culturalMethod: "Reggio Emilia + Waldorf Beeswax + Indian Rangoli",
      milestones: ["Complete 3 open-ended art projects independently", "Draw a recognizable person with 5+ features", "Mix colors purposefully to create new ones"],
      researchHighlight: "Process art in ages 3–5 predicts adult creativity scores better than any other childhood activity (Runco, 2014).",
      weeklyPlans: [
        { week: 1, focus: "Color Discovery", activities: ["Primary color mixing", "Watercolor exploration", "Color scavenger hunt"] },
        { week: 2, focus: "Texture & Form", activities: ["Clay squishing", "Collage making", "Leaf and stone printing"] },
        { week: 3, focus: "Expressive Drawing", activities: ["Feelings drawing", "Family portrait", "Dream drawing"] },
        { week: 4, focus: "Cultural Art Forms", activities: ["Rangoli patterns", "Mandala coloring", "Chinese paper cutting"] },
      ]
    },
    {
      month: 5, theme: "Gross Motor Excellence", emoji: "🤸", color: "#1ABC9C",
      description: "Running, jumping, hopping, skipping, throwing — motor mastery at 3–4 builds the cerebellar circuits that support mathematical reasoning, impulse control, and reading.",
      scienceNote: "Cerebellar development during gross motor activity supports sequencing, timing, and attention — the same circuits used in reading and mathematics (Roth et al., 2010).",
      intelligenceFocus: ["Bodily-Kinesthetic", "Spatial-Visual", "Intrapersonal"],
      weeklyTarget: 6, culturalMethod: "Waldorf Movement + Indian Yoga + Scandinavian Friluftsliv",
      milestones: ["Hop on preferred foot 10 times", "Throw a ball with aim at a target 2m away", "Complete a 6-step obstacle course"],
      researchHighlight: "Aerobic fitness at age 4 directly predicts hippocampal volume — the memory center — at age 9 (Chaddock, 2010).",
      weeklyPlans: [
        { week: 1, focus: "Balance & Coordination", activities: ["Beam walking", "One-foot balance contest", "Yoga tree pose"] },
        { week: 2, focus: "Jumping & Hopping", activities: ["Jump over lines", "Hopscotch basics", "Jump and freeze game"] },
        { week: 3, focus: "Ball Skills", activities: ["Target throwing", "Kick and aim", "Roll and catch with parent"] },
        { week: 4, focus: "Obstacle Courses", activities: ["Indoor cushion course", "Outdoor natural obstacle course", "Timed challenge"] },
      ]
    },
    {
      month: 6, theme: "Empathy & Social Skills", emoji: "🤝", color: "#E91E63",
      description: "Empathy is a skill — not just a trait. Theory of mind (understanding others have different thoughts/feelings) emerges at 3–4 and must be nurtured through perspective-taking games and emotion conversations.",
      scienceNote: "Theory of mind development at 3–4 is the greatest social cognitive leap. Children with strong ToM at 4 show 37% better social outcomes at age 10 (Baron-Cohen, 1995).",
      intelligenceFocus: ["Interpersonal", "Emotional", "Linguistic"],
      weeklyTarget: 5, culturalMethod: "Korean Nunchi + Montessori Peace Education",
      milestones: ["Pass the false-belief task (theory of mind)", "Use 'I feel...' statements accurately for 6 emotions", "Resolve a simple conflict using words"],
      researchHighlight: "Jones (2015): Kindergarten social-emotional skills predict outcomes across 20 years — employment, education, mental health, legal record.",
      weeklyPlans: [
        { week: 1, focus: "Emotion Recognition", activities: ["Emotion face cards", "Feelings books", "Emotion charades"] },
        { week: 2, focus: "Perspective Taking", activities: ["'What is teddy thinking?' games", "Role reversal play", "Story character feelings"] },
        { week: 3, focus: "Conflict Resolution", activities: ["Peace corner practice", "Problem solving steps", "Sharing negotiation games"] },
        { week: 4, focus: "Kindness Acts", activities: ["Random acts of kindness journal", "Helper role games", "Thank you letter drawing"] },
      ]
    },
    {
      month: 7, theme: "Scientific Curiosity", emoji: "🔬", color: "#3F51B5",
      description: "Children are natural scientists — they form hypotheses ('I think...'), test them, and revise. This month seeds the scientific method through simple, spectacular experiments with kitchen materials.",
      scienceNote: "Gopnik (2016): Children reason causally like Bayesian scientists. Early science play increases STEM interest and aptitude at age 12 by 31% (DeWitt, 2013).",
      intelligenceFocus: ["Logical-Mathematical", "Naturalist", "Executive Function"],
      weeklyTarget: 5, culturalMethod: "Reggio Emilia + Scandinavian Exploratory Learning",
      milestones: ["Form a testable hypothesis using 'I think... because...'", "Complete 5 self-designed simple experiments", "Record observations in a science journal"],
      researchHighlight: "DeWitt et al. (2013): Early science experiences are the strongest predictor of adult STEM career paths.",
      weeklyPlans: [
        { week: 1, focus: "Water Science", activities: ["Floating/sinking experiments", "Water color mixing", "Ice melting observation"] },
        { week: 2, focus: "Plant Science", activities: ["Bean sprouting", "Plant needs experiments", "Nature observation journal"] },
        { week: 3, focus: "Physics Exploration", activities: ["Ramp racing", "Magnet exploration", "Shadow science"] },
        { week: 4, focus: "Kitchen Chemistry", activities: ["Vinegar & baking soda", "Jelly making observation", "Sugar crystal growing"] },
      ]
    },
    {
      month: 8, theme: "Pattern & Pre-Math Logic", emoji: "📐", color: "#FF9800",
      description: "Pattern recognition is the foundation of mathematics. AB, ABC, AAB patterns in beads, sounds, movements — the brain that sees patterns in everything is wired for mathematical thinking.",
      scienceNote: "Pattern abstraction ability at age 4 predicts mathematical reasoning at age 11 more strongly than counting ability (Kidd et al., 2013).",
      intelligenceFocus: ["Logical-Mathematical", "Spatial-Visual", "Musical-Rhythmic"],
      weeklyTarget: 6, culturalMethod: "Singapore Math CPA + Indian Kolam patterns",
      milestones: ["Create and extend ABB and AABB patterns", "Identify the error in a broken pattern", "Create a sound pattern and teach it to parent"],
      researchHighlight: "Kidd (2013): Children who understand pattern abstraction at 4 show mathematics reasoning in the top 25% at age 7.",
      weeklyPlans: [
        { week: 1, focus: "Color & Shape Patterns", activities: ["Bead pattern stringing", "Shape pattern stamps", "Pattern blocks continuation"] },
        { week: 2, focus: "Sound Patterns", activities: ["Rhythm pattern games", "Clap-clap-stomp patterns", "Song pattern identification"] },
        { week: 3, focus: "Movement Patterns", activities: ["Movement sequence games", "Pattern dance creation", "Nature pattern hunt"] },
        { week: 4, focus: "Complex Patterns", activities: ["AABB pattern mastery", "Error-finding in broken patterns", "Pattern story creation"] },
      ]
    },
    {
      month: 9, theme: "Emotional Intelligence", emoji: "💝", color: "#F44336",
      description: "Emotional intelligence is more predictive of life success than IQ. This month deepens emotional vocabulary, builds self-regulation strategies, and strengthens the ability to name and tame difficult feelings.",
      scienceNote: "Emotional vocabulary at age 4 reduces amygdala reactivity by 50% (Lieberman, 2011). Children with 20+ emotion words at 5 show 42% less behavioral problems at age 8.",
      intelligenceFocus: ["Emotional", "Intrapersonal", "Interpersonal"],
      weeklyTarget: 5, culturalMethod: "Gottman Emotion Coaching + Mindfulness for Children",
      milestones: ["Name 12+ emotions accurately", "Use 3 self-regulation strategies independently", "Identify physical sensations of 4 emotions"],
      researchHighlight: "Lieberman (2011): Putting feelings into words activates prefrontal cortex and reduces amygdala activation — 'naming it tames it.'",
      weeklyPlans: [
        { week: 1, focus: "Emotion Vocabulary", activities: ["Emotion word expansion games", "Body sensation mapping", "Feeling story creation"] },
        { week: 2, focus: "Self-Regulation Tools", activities: ["Belly breathing practice", "Calm corner creation", "Glitter jar calm-down"] },
        { week: 3, focus: "Emotional Literacy", activities: ["Emotion diary drawing", "Music emotion matching", "Color-emotion painting"] },
        { week: 4, focus: "Empathy Deepening", activities: ["Perspective story games", "Kindness challenge week", "Gratitude practice"] },
      ]
    },
    {
      month: 10, theme: "Cultural Discovery", emoji: "🌍", color: "#607D8B",
      description: "Children who learn about multiple cultures early show better creative thinking, more perspective-taking ability, and stronger social competence. Global citizenship starts with global curiosity.",
      scienceNote: "Multicultural exposure in ages 3–5 produces measurable gains in perspective-taking ability and creative divergent thinking (Tadmor, 2012).",
      intelligenceFocus: ["Interpersonal", "Linguistic", "Creative", "Naturalist"],
      weeklyTarget: 5, culturalMethod: "All 5 Traditions — World Tour Month",
      milestones: ["Learn a greeting in 3 languages", "Complete crafts from 3 different cultural traditions", "Taste and name 5 foods from different cultures"],
      researchHighlight: "Bilingual exposure (even passive) before age 5 delays cognitive aging by 4–5 years (Bialystok, 2011).",
      weeklyPlans: [
        { week: 1, focus: "Asian Traditions", activities: ["Origami animals", "Counting in Japanese", "Indian rangoli"] },
        { week: 2, focus: "African Traditions", activities: ["African drum rhythms", "Traditional weaving patterns", "Story griot game"] },
        { week: 3, focus: "European Traditions", activities: ["Nordic outdoor play", "Waldorf beeswax modeling", "Greek fable storytelling"] },
        { week: 4, focus: "American Traditions", activities: ["Indigenous land acknowledgment nature walk", "Harvest celebration cooking", "Musical traditions exploration"] },
      ]
    },
    {
      month: 11, theme: "Memory & Sequencing", emoji: "🧩", color: "#00BCD4",
      description: "Working memory — holding information in mind while using it — is the executive function most strongly linked to mathematical and reading success. Memory games and sequencing activities build this critical capacity.",
      scienceNote: "Working memory at age 4 is a stronger predictor of math and reading at age 7 than IQ (Alloway & Alloway, 2010).",
      intelligenceFocus: ["Executive Function", "Logical-Mathematical", "Linguistic"],
      weeklyTarget: 6, culturalMethod: "Shichida Method + Leitner Spaced Repetition",
      milestones: ["Recall 5-item sequence correctly", "Follow 3-step instructions from memory", "Re-tell a 6-event story in order"],
      researchHighlight: "Alloway (2010): Working memory at 4 is a better predictor of academic achievement at 11 than IQ.",
      weeklyPlans: [
        { week: 1, focus: "Visual Memory", activities: ["Kim's game (objects under cloth)", "Pattern replication from memory", "Flash card memory"] },
        { week: 2, focus: "Auditory Memory", activities: ["Sequence following games", "Story retelling", "Sound pattern memory"] },
        { week: 3, focus: "Sequencing", activities: ["Morning routine sequencing cards", "Recipe step ordering", "Story picture ordering"] },
        { week: 4, focus: "Working Memory Games", activities: ["Simon Says memory version", "3-step instruction games", "Memory palace introduction"] },
      ]
    },
    {
      month: 12, theme: "Growth Mindset Celebration", emoji: "🌟", color: "#FFEB3B",
      description: "The greatest gift of year 2 is not any skill — it is the BELIEF that 'I can learn anything with effort.' This month installs growth mindset through stories, portfolios, and celebrating struggle as the path to brilliance.",
      scienceNote: "Growth mindset at age 5 predicts 0.4 standard deviation better academic outcomes — equivalent to months of additional schooling (Yeager & Dweck, 2012).",
      intelligenceFocus: ["Intrapersonal", "All intelligences — synthesis"],
      weeklyTarget: 5, culturalMethod: "All traditions — synthesis and celebration",
      milestones: ["Complete a year portfolio with favorite activities", "Teach one skill to a sibling or parent", "Set 3 goals for the coming year"],
      researchHighlight: "Dweck (2006): Children who believe effort creates intelligence outperform fixed-mindset peers consistently across all academic domains.",
      weeklyPlans: [
        { week: 1, focus: "Strength Discovery", activities: ["Skills inventory celebration", "Photo portfolio creation", "Parent interview activity"] },
        { week: 2, focus: "Challenge Celebration", activities: ["Hardest activity attempt", "Growth wall creation", "Struggle story sharing"] },
        { week: 3, focus: "Teaching Others", activities: ["Teach your favorite activity", "Parent student role reversal", "Mini presentation of learning"] },
        { week: 4, focus: "Future Goals", activities: ["Goal star creation", "Next year vision drawing", "Letter to future self"] },
      ]
    },
  ],
  projections: [
    { intel: "Linguistic", emoji: "💬", targetActivities: 55, yearEndOutcome: "500+ word vocabulary; reading-ready with phoneme mastery; narrative story structure understood", color: "#2980B9", category: "Language" },
    { intel: "Logical-Mathematical", emoji: "🔢", targetActivities: 45, yearEndOutcome: "Counting to 20 with cardinality; pattern abstraction strong; pre-algebraic reasoning emerging", color: "#1ABC9C", category: "Cognitive" },
    { intel: "Creative", emoji: "🎨", targetActivities: 40, yearEndOutcome: "Divergent thinking in 80th percentile; 3D creative play; rich imaginative scenarios", color: "#9B59B6", category: "Creative" },
    { intel: "Emotional", emoji: "💝", targetActivities: 35, yearEndOutcome: "12+ emotion vocabulary; 3 self-regulation strategies mastered; empathy behaviors consistent", color: "#C0392B", category: "Emotional" },
    { intel: "Bodily-Kinesthetic", emoji: "🤸", targetActivities: 40, yearEndOutcome: "Hopping, skipping, throwing mastered; fine motor at kindergarten-entry level", color: "#E74C3C", category: "Physical" },
    { intel: "Musical-Rhythmic", emoji: "🎵", targetActivities: 30, yearEndOutcome: "AABB rhythm patterns; 15+ songs memorized; phonological loop significantly strengthened", color: "#16A085", category: "Creative" },
    { intel: "Interpersonal", emoji: "🤝", targetActivities: 30, yearEndOutcome: "Theory of mind developed; friendship skills strong; cooperative play sustained 20+ minutes", color: "#8E44AD", category: "Social" },
    { intel: "Spatial-Visual", emoji: "🗺️", targetActivities: 25, yearEndOutcome: "3D building mastery; pattern replication accurate; mental rotation beginning", color: "#D35400", category: "Cognitive" },
    { intel: "Executive Function", emoji: "🧩", targetActivities: 25, yearEndOutcome: "Working memory for 5-item sequences; impulse control improving; task switching emerging", color: "#2C3E50", category: "Cognitive" },
    { intel: "Naturalist", emoji: "🌿", targetActivities: 20, yearEndOutcome: "10+ nature classifications; scientific curiosity strong; hypothesis formation emerging", color: "#27AE60", category: "Natural" },
  ],
  researchBacking: [
    "Stanovich (1994): Phonemic awareness is the strongest predictor of reading success",
    "Siegler (2013): Number sense at 4 predicts algebra at 14",
    "Gopnik (2016): Children reason causally like Bayesian scientists",
    "Jones (2015): Kindergarten SEL skills predict 20-year life outcomes",
    "Yeager & Dweck (2012): Growth mindset produces 0.4 SD academic gains",
  ],
  yearEndStats: [
    { label: "Reading Readiness", value: "Grade +1", emoji: "📖", color: "#4361EE" },
    { label: "Number Sense", value: "Top 25%", emoji: "🔢", color: "#7209B7" },
    { label: "Emotional Vocabulary", value: "12+ words", emoji: "💝", color: "#F72585" },
    { label: "Intelligence Types", value: "All 10 Active", emoji: "🧠", color: "#06D6A0" },
  ]
};

// ─── Tier 3: Ages 5-6 ──────────────────────────────────────────────────────────
const TIER3_YEAR_PLAN: YearPlan = {
  tier: 3,
  ageRange: "5–6 years",
  tagline: "The Critical Window — Foundations for Life",
  yearEndVision: "By year end, your child will be reading independently at Grade 2 level, performing mental addition and subtraction fluently, demonstrating strong executive function, showing genuine scientific inquiry skills, and — most importantly — approaching every challenge with the conviction that their brain grows stronger with every effort.",
  activitiesNeeded: 300,
  weeklyTarget: 6,
  months: [
    {
      month: 1, theme: "Phonics & Reading Launch", emoji: "📚", color: "#E74C3C",
      description: "The alphabetic principle — each letter represents a sound — is the gateway to reading independence. Intensive phonics through games, songs, and physical activities opens this door.",
      scienceNote: "Systematic phonics instruction produces the largest reading effect sizes (d=0.86) of any instructional approach (National Reading Panel, 2000). Ages 5–6 is the optimal critical window.",
      intelligenceFocus: ["Linguistic", "Auditory", "Bodily-Kinesthetic"],
      weeklyTarget: 6, culturalMethod: "Orton-Gillingham + Kumon + Phonics Play",
      milestones: ["Blend consonant-vowel-consonant (CVC) words fluently", "Segment 4-phoneme words accurately", "Read 20 sight words independently"],
      researchHighlight: "National Reading Panel: Systematic phonics instruction produces reading gains equivalent to 6 additional months of schooling.",
      weeklyPlans: [
        { week: 1, focus: "Letter-Sound Mastery", activities: ["Sound sorting games", "Letter body shapes", "Tactile letter tracing in sand"] },
        { week: 2, focus: "Blending Practice", activities: ["Robot blending game", "CVC word building", "Blend & read card game"] },
        { week: 3, focus: "Phoneme Segmentation", activities: ["Sound stretching", "Elkonin boxes activity", "Sound tapping games"] },
        { week: 4, focus: "Reading Fluency Seeds", activities: ["Sight word flash cards", "Phonics story reading", "Word family books"] },
      ]
    },
    {
      month: 2, theme: "Mathematical Operations", emoji: "➕", color: "#3498DB",
      description: "Addition and subtraction as actions — joining and separating — not just symbols on paper. Physical, visual, and verbal approaches build flexible number sense that supports algebra years later.",
      scienceNote: "Concrete-Pictorial-Abstract (CPA) instruction (Bruner, 1966) produces 40% better mathematical understanding than abstract-first approaches. Manipulative use at age 5 predicts high school mathematics.",
      intelligenceFocus: ["Logical-Mathematical", "Spatial-Visual", "Bodily-Kinesthetic"],
      weeklyTarget: 6, culturalMethod: "Singapore CPA + Indian Vedic Seeds + Abacus",
      milestones: ["Add within 10 using mental strategies", "Subtract within 10 from a concrete representation", "Solve simple word problems with drawing strategy"],
      researchHighlight: "Siegler (2013): Flexible mental arithmetic at age 6 predicts mathematical success through secondary school.",
      weeklyPlans: [
        { week: 1, focus: "Addition Concepts", activities: ["Counting on fingers games", "Joining story problems", "Bead addition practice"] },
        { week: 2, focus: "Subtraction Concepts", activities: ["Taking away games", "Subtraction stories", "Fingers take-away"] },
        { week: 3, focus: "Visual Models", activities: ["Ten-frame building", "Bar model introduction", "Number line addition jumps"] },
        { week: 4, focus: "Word Problems", activities: ["Story problem drawing", "Maths storytelling", "Real-world problem solving"] },
      ]
    },
    {
      month: 3, theme: "Executive Function Mastery", emoji: "🧩", color: "#9B59B6",
      description: "Working memory, inhibitory control, and cognitive flexibility — the 'air traffic control' of the brain. Diamond (2011) showed these predict academic achievement more powerfully than IQ.",
      scienceNote: "Diamond & Lee (2011): Executive function interventions show the largest effects in ages 4–7. These skills are more predictive of Grade 1 achievement than IQ (Blair & Razza, 2007).",
      intelligenceFocus: ["Executive Function", "Intrapersonal", "Logical-Mathematical"],
      weeklyTarget: 6, culturalMethod: "Mindfulness + Chinese Go strategy + Martial Arts impulse control",
      milestones: ["Follow 4-step instructions from memory", "Complete a 15-minute focus task without redirection", "Switch rules in a game 3 times without errors"],
      researchHighlight: "Moffitt (2011): Self-control at age 5 predicts health, wealth, and freedom from addiction at age 32.",
      weeklyPlans: [
        { week: 1, focus: "Working Memory", activities: ["Sequence memory games", "Story retelling", "Hidden object memory"] },
        { week: 2, focus: "Inhibitory Control", activities: ["Simon Says advanced", "Head-Toes-Knees-Shoulders", "Freeze dance with rules"] },
        { week: 3, focus: "Cognitive Flexibility", activities: ["Rule-switching games", "Multiple category sorting", "Strategy adaptation games"] },
        { week: 4, focus: "Planning & Organization", activities: ["Step-by-step recipe following", "Drawing from plan", "Project organization game"] },
      ]
    },
    {
      month: 4, theme: "Spatial Intelligence", emoji: "🗺️", color: "#E67E22",
      description: "Spatial skills at age 5 predict STEM success at age 25 more strongly than verbal ability. Block building, origami, map reading, and mental rotation: the architecture of engineering and visual thinking.",
      scienceNote: "Wai et al. (2009): Spatial ability at age 5 is the strongest predictor of STEM career success at age 25. Spatial skills show the most improvement with training of any cognitive ability.",
      intelligenceFocus: ["Spatial-Visual", "Logical-Mathematical", "Creative"],
      weeklyTarget: 6, culturalMethod: "Japanese Origami + STEM Tangrams + Vedic Geometry",
      milestones: ["Complete a 7-piece tangram puzzle", "Build a 3D structure from 2D blueprint", "Mentally rotate a simple shape"],
      researchHighlight: "Uttal (2013): Meta-analysis of 217 studies shows spatial training produces d=0.47 improvement — and gains transfer to STEM outcomes.",
      weeklyPlans: [
        { week: 1, focus: "Mental Rotation", activities: ["Tangram puzzles", "Block rotation games", "Shape flip prediction"] },
        { week: 2, focus: "3D Building", activities: ["Blueprint building", "Architecture challenges", "3D origami models"] },
        { week: 3, focus: "Mapping & Navigation", activities: ["Room map drawing", "Treasure map following", "Direction language games"] },
        { week: 4, focus: "Geometry Exploration", activities: ["Symmetry fold drawing", "Shape tessellations", "Sacred geometry patterns"] },
      ]
    },
    {
      month: 5, theme: "Scientific Method", emoji: "🔬", color: "#1ABC9C",
      description: "Observe, hypothesize, test, conclude, revise — the scientific method as daily thinking habit. Children who learn to think scientifically approach every challenge with methodical curiosity.",
      scienceNote: "Early science education (ages 5–6) using inquiry-based methods produces 28% better scientific reasoning at age 10 and stronger transfer to mathematics (Zimmerman, 2007).",
      intelligenceFocus: ["Logical-Mathematical", "Naturalist", "Executive Function"],
      weeklyTarget: 5, culturalMethod: "Reggio Emilia Inquiry + Scandinavian Forest School",
      milestones: ["Design and run a simple experiment independently", "Record observations in a science journal for 4 weeks", "Form evidence-based conclusions from 3 experiments"],
      researchHighlight: "DeWitt (2013): Children who engage in inquiry science at age 5 are 3× more likely to pursue STEM careers.",
      weeklyPlans: [
        { week: 1, focus: "Observation Skills", activities: ["Nature journal keeping", "Detailed object sketching", "5-senses observation game"] },
        { week: 2, focus: "Hypothesis Forming", activities: ["'I think because...' game", "Prediction before experiments", "Variable identification"] },
        { week: 3, focus: "Experiments", activities: ["Water tension experiment", "Plant growth variables", "Density tower activity"] },
        { week: 4, focus: "Conclusions & Questions", activities: ["Evidence-based conclusion drawing", "New question generating", "Science journal review"] },
      ]
    },
    {
      month: 6, theme: "Creative Expression", emoji: "🎨", color: "#F72585",
      description: "Creativity is the highest-order cognitive skill — requiring synthesis of all other intelligences. This month exercises divergent thinking, aesthetic judgment, and the courage to make something original.",
      scienceNote: "Torrance (1968): Divergent thinking peaks at ages 5–7 and must be actively exercised to persist. Process art, storytelling, and music composition are the highest-impact divergent activities.",
      intelligenceFocus: ["Creative", "Linguistic", "Spatial-Visual", "Musical-Rhythmic"],
      weeklyTarget: 5, culturalMethod: "Reggio Emilia + Waldorf Arts + Indian Classical Dance",
      milestones: ["Write and illustrate a 5-page original story", "Compose a simple 8-beat melody", "Create a mixed-media artwork with 4+ techniques"],
      researchHighlight: "Kim (2011): Creative thinking scores have declined among American children since 1990 — deliberate creative activity at home is critical to reversing this trend.",
      weeklyPlans: [
        { week: 1, focus: "Storytelling", activities: ["Original story creation", "Character design", "Setting world-building"] },
        { week: 2, focus: "Music Creation", activities: ["Original melody composition", "Rhythm composition", "Instrument invention"] },
        { week: 3, focus: "Visual Art", activities: ["Mixed media artwork", "Architecture design", "Sculpture creation"] },
        { week: 4, focus: "Performance", activities: ["Mini theater performance", "Dance composition", "Poetry creation"] },
      ]
    },
    {
      month: 7, theme: "Physical Literacy", emoji: "🏃", color: "#FB5607",
      description: "Physical literacy — the confidence, competence, and motivation to be physically active for life — is built between ages 5–7. Yoga, dance, climbing, and sports games build lifelong movement intelligence.",
      scienceNote: "Physical activity at age 6 increases BDNF (Brain-Derived Neurotrophic Factor) — the brain's growth hormone — by 40%, directly improving memory, attention, and learning (Ratey, 2008).",
      intelligenceFocus: ["Bodily-Kinesthetic", "Intrapersonal", "Interpersonal"],
      weeklyTarget: 6, culturalMethod: "Yoga + Scandinavian Sports Pedagogy + Indian Gymnastics",
      milestones: ["Sustain cardiovascular activity for 30 minutes", "Complete a yoga sequence of 8 poses from memory", "Demonstrate sportsmanship in a competitive game"],
      researchHighlight: "Ratey (2008): 20 minutes of aerobic exercise before learning improves focus and retention by 25% in school-age children.",
      weeklyPlans: [
        { week: 1, focus: "Yoga & Flexibility", activities: ["Animal yoga story", "Flexibility stretching", "Balance challenge poses"] },
        { week: 2, focus: "Strength & Coordination", activities: ["Animal walks", "Climbing & swinging", "Core strength games"] },
        { week: 3, focus: "Team Games", activities: ["Cooperative movement games", "Obstacle relay", "Inclusive sports introduction"] },
        { week: 4, focus: "Body Awareness", activities: ["Proprioception games", "Mirror movement", "Body mapping activity"] },
      ]
    },
    {
      month: 8, theme: "Musical Intelligence", emoji: "🎵", color: "#7209B7",
      description: "Music training restructures the brain — enlarging the auditory cortex, strengthening the corpus callosum, and improving phonological processing. A musically enriched child is a more capable reader and mathematician.",
      scienceNote: "Schlaug (2005): Children with musical training show structural brain differences vs. non-trained peers. Hyde (2009): 15 months of music lessons produce measurable brain changes in children.",
      intelligenceFocus: ["Musical-Rhythmic", "Linguistic", "Mathematical", "Bodily-Kinesthetic"],
      weeklyTarget: 5, culturalMethod: "Suzuki Method + Indian Classical Music + Orff Method",
      milestones: ["Identify emotion in music accurately for 5 pieces", "Clap back a 6-beat rhythm pattern", "Compose a 16-beat original piece"],
      researchHighlight: "Anvari (2002): Musical ability at age 5 correlates r=0.71 with phonological awareness — stronger than any other predictor.",
      weeklyPlans: [
        { week: 1, focus: "Rhythm Mastery", activities: ["Complex rhythm imitation", "Polyrhythm introduction", "Rhythm composition"] },
        { week: 2, focus: "Melody & Ear Training", activities: ["Pitch discrimination games", "Melody completion", "Interval recognition"] },
        { week: 3, focus: "Music & Emotion", activities: ["Emotion in music identification", "Music mood painting", "Emotional composition"] },
        { week: 4, focus: "Music Creation", activities: ["Full composition creation", "Homemade instrument concert", "Music story composing"] },
      ]
    },
    {
      month: 9, theme: "Social-Emotional Mastery", emoji: "💝", color: "#06D6A0",
      description: "The RULER approach (Recognizing, Understanding, Labeling, Expressing, Regulating emotions) — the Yale SEL program with the strongest evidence base in education.",
      scienceNote: "Durlak (2011): Meta-analysis of 213 SEL programs: average 11-percentile-point academic improvement, 25% reduction in behavioral problems, 23% improvement in social skills.",
      intelligenceFocus: ["Emotional", "Interpersonal", "Intrapersonal"],
      weeklyTarget: 5, culturalMethod: "RULER SEL + Waldorf Community + Korean Jeong",
      milestones: ["Accurately label 15+ distinct emotions", "Independently use 5 regulation strategies", "Demonstrate genuine perspective-taking in conflict resolution"],
      researchHighlight: "Durlak (2011): SEL programs produce academic gains equivalent to 11 percentile points — comparable to high-quality tutoring.",
      weeklyPlans: [
        { week: 1, focus: "Emotion Nuance", activities: ["Emotion vocabulary expansion", "Feelings thermometer", "Emotion gradient painting"] },
        { week: 2, focus: "Regulation Toolkit", activities: ["Breathing toolkit", "Calm-down strategies menu", "Emotional first aid box"] },
        { week: 3, focus: "Relationship Skills", activities: ["Active listening games", "Conflict resolution scripts", "Friendship investment activities"] },
        { week: 4, focus: "Responsible Decision-Making", activities: ["Consequence thinking games", "Ethical dilemma stories", "Community contribution project"] },
      ]
    },
    {
      month: 10, theme: "Nature Intelligence", emoji: "🌿", color: "#27AE60",
      description: "Nature intelligence — the ability to classify, connect with, and care for the living world — is both a brain-development tool and an ecological imperative. This month goes deep into the natural world.",
      scienceNote: "Children who develop nature intelligence show stronger pattern recognition, classification ability, and empathy — all transferable cognitive skills (Wilson, 1984 Biophilia hypothesis).",
      intelligenceFocus: ["Naturalist", "Spatial-Visual", "Logical-Mathematical"],
      weeklyTarget: 5, culturalMethod: "Shinrin-yoku + Waldorf Nature + Indian Prakriti + Forest School",
      milestones: ["Identify 10 local plants by leaf/flower", "Classify 15 organisms by 3+ criteria", "Design and execute a nature conservation project"],
      researchHighlight: "Taylor (2001): Children with ADHD show 40% improvement in sustained attention after 20 minutes in a natural setting vs. indoor or urban environments.",
      weeklyPlans: [
        { week: 1, focus: "Plant Study", activities: ["Leaf pressing & identification", "Plant part labeling", "Germination experiment"] },
        { week: 2, focus: "Animal Kingdom", activities: ["Bug observation journal", "Bird identification", "Animal track casting"] },
        { week: 3, focus: "Ecosystems", activities: ["Food chain modeling", "Habitat study", "Ecosystem art project"] },
        { week: 4, focus: "Conservation", activities: ["Local environment audit", "Conservation action plan", "Nature thankfulness ritual"] },
      ]
    },
    {
      month: 11, theme: "Cultural Intelligence", emoji: "🌏", color: "#FF9800",
      description: "Cultural intelligence — the ability to relate across cultural differences — is the #1 skill required in the 21st-century global economy. It is also the deepest builder of creativity and perspective.",
      scienceNote: "Tadmor (2012): Multicultural experience increases integrative complexity (the ability to hold multiple perspectives simultaneously) — a key marker of advanced cognition.",
      intelligenceFocus: ["Interpersonal", "Linguistic", "Creative"],
      weeklyTarget: 5, culturalMethod: "All 5 Global Traditions",
      milestones: ["Research and present one culture's traditions independently", "Learn counting in 3 languages", "Cook a dish from a culture different from their own"],
      researchHighlight: "Bialystok (2011): Bilingual children show stronger executive function and cognitive reserve across the lifespan.",
      weeklyPlans: [
        { week: 1, focus: "Asian Cultures", activities: ["Origami advanced", "Chinese calligraphy", "Japanese story origami"] },
        { week: 2, focus: "Indian Culture", activities: ["Vedic mathematics games", "Classical dance moves", "Ayurvedic plant study"] },
        { week: 3, focus: "African Culture", activities: ["African drum patterns", "Traditional weaving", "Griot storytelling"] },
        { week: 4, focus: "European Traditions", activities: ["Scandinavian outdoor nature challenge", "Italian Reggio documentation", "Greek mythology retelling"] },
      ]
    },
    {
      month: 12, theme: "Growth Mindset & Portfolio", emoji: "🌟", color: "#FFEB3B",
      description: "The year culminates in documenting the journey, celebrating growth, and setting ambitious goals — installing the growth mindset that turns every future challenge into an opportunity.",
      scienceNote: "Yeager & Dweck (2012): Growth mindset interventions produce 0.4 effect-size academic gains across all subjects — equivalent to 4 months of additional instruction.",
      intelligenceFocus: ["Intrapersonal", "All intelligences"],
      weeklyTarget: 5, culturalMethod: "All traditions — integration",
      milestones: ["Complete year portfolio", "Teach one mastered skill to a younger child", "Set 5 learning goals for the next year with specific strategies"],
      researchHighlight: "Deci & Ryan (1985): Self-determined goal-setting produces 3× stronger commitment and follow-through than externally set goals.",
      weeklyPlans: [
        { week: 1, focus: "Learning Review", activities: ["Skills inventory celebration", "Best moment collage", "Gratitude letter to brain"] },
        { week: 2, focus: "Teaching Others", activities: ["Teach reading to sibling", "Math game teaching", "Science experiment demonstration"] },
        { week: 3, focus: "Portfolio Completion", activities: ["Portfolio book creation", "Photo documentation", "Achievement display"] },
        { week: 4, focus: "Future Planning", activities: ["Goal setting with strategies", "Learning roadmap drawing", "Year-ahead celebration"] },
      ]
    },
  ],
  projections: [
    { intel: "Linguistic", emoji: "📚", targetActivities: 55, yearEndOutcome: "Reading at Grade 2 level; writing simple sentences; 1,000+ word vocabulary; phonological mastery", color: "#2980B9", category: "Language" },
    { intel: "Logical-Mathematical", emoji: "➕", targetActivities: 50, yearEndOutcome: "Mental addition/subtraction within 20; pattern abstraction strong; pre-multiplication understanding", color: "#1ABC9C", category: "Cognitive" },
    { intel: "Executive Function", emoji: "🧩", targetActivities: 40, yearEndOutcome: "Self-regulation strong; working memory for 6-item sequences; cognitive flexibility on par with 7-year-olds", color: "#2C3E50", category: "Cognitive" },
    { intel: "Creative", emoji: "🎨", targetActivities: 35, yearEndOutcome: "Divergent thinking 85th percentile; original story creation; musical composition ability", color: "#9B59B6", category: "Creative" },
    { intel: "Spatial-Visual", emoji: "🗺️", targetActivities: 30, yearEndOutcome: "3D visualization; geometry readiness 12 months ahead; mental rotation ability", color: "#D35400", category: "Cognitive" },
    { intel: "Bodily-Kinesthetic", emoji: "🏃", targetActivities: 30, yearEndOutcome: "Physical literacy benchmark; yoga sequence from memory; 8 athletic skills mastered", color: "#E74C3C", category: "Physical" },
    { intel: "Musical-Rhythmic", emoji: "🎵", targetActivities: 25, yearEndOutcome: "Ear training advanced; composition ability; phonological processing top 20%", color: "#16A085", category: "Creative" },
    { intel: "Emotional", emoji: "💝", targetActivities: 25, yearEndOutcome: "15+ emotion vocabulary; RULER skills mastered; amygdala regulation demonstrably improved", color: "#C0392B", category: "Emotional" },
    { intel: "Naturalist", emoji: "🌿", targetActivities: 20, yearEndOutcome: "10+ species identification; scientific method independent; ecology understanding solid", color: "#27AE60", category: "Natural" },
    { intel: "Interpersonal", emoji: "🤝", targetActivities: 20, yearEndOutcome: "Conflict resolution skills; perspective-taking reliable; friendship maintenance strong", color: "#8E44AD", category: "Social" },
  ],
  researchBacking: [
    "National Reading Panel: Systematic phonics produces d=0.86 reading gains",
    "Diamond (2011): Executive function predicts achievement more than IQ in ages 5–7",
    "Wai (2009): Spatial ability at 5 predicts STEM career at 25",
    "Durlak (2011): SEL produces 11-percentile-point academic improvement",
    "Ratey (2008): 20min aerobic exercise improves learning by 25%",
  ],
  yearEndStats: [
    { label: "Reading Level", value: "Grade 2+", emoji: "📚", color: "#4361EE" },
    { label: "Math Mental Age", value: "+12 months", emoji: "🔢", color: "#7209B7" },
    { label: "Executive Function", value: "Top 30%", emoji: "🧩", color: "#FB5607" },
    { label: "Intelligences Active", value: "All 13", emoji: "🧠", color: "#06D6A0" },
  ]
};

// ─── Tier 4: Ages 7-8 ──────────────────────────────────────────────────────────
const TIER4_YEAR_PLAN: YearPlan = {
  tier: 4,
  ageRange: "7–8 years",
  tagline: "Critical Thinking & Deep Mastery",
  yearEndVision: "By year end, your child will demonstrate advanced mathematical reasoning, critical reading comprehension, strategic thinking, strong scientific method application, and beginning abstract reasoning. They will approach complex problems with methodical confidence.",
  activitiesNeeded: 300,
  weeklyTarget: 6,
  months: [
    { month: 1, theme: "Advanced Mathematics", emoji: "🔢", color: "#3498DB", description: "Multiplication concepts through arrays, area models, and grouping stories — building the mathematical fluency that unlocks all advanced STEM.", scienceNote: "Array-based multiplication understanding at age 7 predicts algebraic reasoning at age 12 (Mulligan, 2013).", intelligenceFocus: ["Logical-Mathematical","Spatial-Visual","Executive Function"], weeklyTarget: 6, culturalMethod: "Vedic Mathematics + Bar Modeling + Abacus", milestones: ["Understand multiplication as repeated addition and area","Know 2,3,5,10 times tables with understanding","Solve 2-step word problems independently"], researchHighlight: "Vedic mathematics: 40% faster mental calculation than standard methods (Thakkar, 1965).", weeklyPlans: [{ week:1,focus:"Multiplication Concepts",activities:["Array building games","Equal groups stories","Skip counting patterns"] },{ week:2,focus:"Times Tables",activities:["Vedic multiplication tricks","Abacus multiplication","Times table songs"] },{ week:3,focus:"Division Concepts",activities:["Fair sharing games","Division as ungrouping","Real-world division problems"] },{ week:4,focus:"Word Problems",activities:["Bar model for multiplication","2-step problem drawings","Create-your-own problems"] }] },
    { month: 2, theme: "Critical Reading", emoji: "📖", color: "#E74C3C", description: "Moving beyond decoding to comprehension — inferencing, theme identification, author's purpose, and evidence-based reasoning from text.", scienceNote: "Inference ability at age 7 is the strongest predictor of reading comprehension throughout schooling (Cain & Oakhill, 2007).", intelligenceFocus: ["Linguistic","Logical-Mathematical","Interpersonal"], weeklyTarget: 6, culturalMethod: "Socratic Seminar + Literature Circles + Waldorf Story", milestones: ["Make accurate inferences from text","Identify theme vs. plot","Support opinion with 3 text pieces of evidence"], researchHighlight: "Children who engage in critical discussion of literature show 40% better comprehension at age 10.", weeklyPlans: [{ week:1,focus:"Inference Skills",activities:["Between-the-lines questions","Context clue games","Inference prediction"] },{ week:2,focus:"Theme & Author Purpose",activities:["Theme identification in stories","Author purpose detective","Compare 2 books on same theme"] },{ week:3,focus:"Evidence & Opinion",activities:["Opinion-evidence separating","Debate preparation","Text evidence highlighting"] },{ week:4,focus:"Deep Comprehension",activities:["Socratic discussion","Story structure analysis","Character motivation mapping"] }] },
    { month: 3, theme: "Logic & Strategy", emoji: "♟️", color: "#9B59B6", description: "Chess, Go, logic puzzles, and deduction games build the prefrontal planning circuits identical to those used in executive leadership, engineering, and scientific research.", scienceNote: "Chess training at age 7 produces 17-percentile-point math improvement and 15-point reading improvement (Ferguson, 1995).", intelligenceFocus: ["Logical-Mathematical","Executive Function","Spatial-Visual"], weeklyTarget: 5, culturalMethod: "Go (Weiqi) + Chess + Indian Chaturanga", milestones: ["Play complete game of simplified chess or Go","Solve 5-move logic puzzles","Identify logical fallacies in simple arguments"], researchHighlight: "Go training in Korean schools: measurable IQ gains and executive function improvement.", weeklyPlans: [{ week:1,focus:"Chess Foundations",activities:["Piece movement games","Mini-board chess","Tactics puzzles"] },{ week:2,focus:"Strategy Thinking",activities:["Multi-step planning games","If-then thinking","Mini-Go practice"] },{ week:3,focus:"Logic Puzzles",activities:["Deduction puzzles","Set theory sorting","Logic grid puzzles"] },{ week:4,focus:"Strategic Creativity",activities:["Invent a strategy game","Rules design challenge","Tournament with parent"] }] },
    { month: 4, theme: "Scientific Investigation", emoji: "🔬", color: "#1ABC9C", description: "Full scientific method — from question to peer review — building the habits of mind that distinguish scientific thinkers: curiosity, precision, skepticism, and open-minded revision.", scienceNote: "Inquiry-based science at age 7–8 produces 31% better scientific reasoning at age 12 and increases STEM career interest by 40% (Minner, 2010).", intelligenceFocus: ["Logical-Mathematical","Naturalist","Executive Function"], weeklyTarget: 5, culturalMethod: "Reggio + Maker Movement + Scandinavian Inquiry", milestones: ["Design and conduct a controlled experiment","Identify independent, dependent, and controlled variables","Write a complete lab report with conclusion and future questions"], researchHighlight: "Minner (2010): Inquiry science is 40% more effective than traditional science instruction at building scientific reasoning.", weeklyPlans: [{ week:1,focus:"Experimental Design",activities:["Variable identification games","Hypothesis precision practice","Control group concept"] },{ week:2,focus:"Data Collection",activities:["Measurement practice","Data table creation","Graph construction"] },{ week:3,focus:"Analysis & Conclusion",activities:["Evidence-based conclusion drawing","Anomaly explanation","Pattern in data identification"] },{ week:4,focus:"Science Communication",activities:["Lab report writing","Science fair project","Peer explanation practice"] }] },
    { month: 5, theme: "Spatial & Geometric Mastery", emoji: "📐", color: "#E67E22", description: "Geometry, symmetry, transformation, and visualization — the spatial language of architecture, engineering, surgery, and design. Age 7–8 is the optimal training window.", scienceNote: "Uttal (2013): Spatial training produces d=0.47 average effect — the most trainable of all cognitive abilities. Transfers directly to STEM performance.", intelligenceFocus: ["Spatial-Visual","Logical-Mathematical","Creative"], weeklyTarget: 6, culturalMethod: "Japanese Origami + Vedic Geometry + STEM Engineering", milestones: ["Classify 10 geometric shapes by properties","Predict result of reflection, rotation, translation","Design and build a 3D structure from a 2D net"], researchHighlight: "Children with high spatial ability at age 8 are 3× more likely to enter STEM careers (Wai, 2009).", weeklyPlans: [{ week:1,focus:"2D Geometry",activities:["Shape property classification","Angle exploration","Symmetry fold art"] },{ week:2,focus:"3D Geometry",activities:["3D model building","Net folding activities","Architecture challenge"] },{ week:3,focus:"Transformations",activities:["Reflection drawing","Rotation prediction","Translation games"] },{ week:4,focus:"Applied Geometry",activities:["Measurement project","Map scale activities","Engineering design challenge"] }] },
    { month: 6, theme: "Creative Problem Solving", emoji: "💡", color: "#F72585", description: "SCAMPER, mind mapping, lateral thinking — the tools of creative problem solvers. Age 7–8 is when analytical and creative thinking can be intentionally integrated.", scienceNote: "Torrance (1968): Divergent thinking scores decline from age 5–7 unless actively exercised. Creative problem-solving training shows 0.65 effect size on creativity measures.", intelligenceFocus: ["Creative","Logical-Mathematical","Linguistic"], weeklyTarget: 5, culturalMethod: "De Bono Lateral Thinking + SCAMPER + Reggio", milestones: ["Generate 10+ solutions to an open problem","Apply SCAMPER to improve a familiar object","Solve a design challenge with 3 constraints"], researchHighlight: "Kim (2011): Deliberate creative training is essential — creativity scores have declined 30% in children since 1990.", weeklyPlans: [{ week:1,focus:"Divergent Thinking",activities:["Alternative uses game","Impossible problem brainstorming","Random word connection"] },{ week:2,focus:"SCAMPER Technique",activities:["SCAMPER a familiar object","Invention design challenge","What if questions"] },{ week:3,focus:"Mind Mapping",activities:["Central concept mind maps","Project planning maps","Story brainstorm maps"] },{ week:4,focus:"Design Challenges",activities:["Constrained engineering challenge","Community problem solving","Prototype and test"] }] },
    { month: 7, theme: "Collaborative Intelligence", emoji: "🤝", color: "#3F51B5", description: "The ability to think and create effectively with others — the most-cited skill for 21st-century success. Structured cooperative learning, negotiation, and leadership skills.", scienceNote: "Johnson & Johnson (1989): Cooperative learning produces stronger academic outcomes than competitive or individualistic approaches in 600+ studies.", intelligenceFocus: ["Interpersonal","Emotional","Executive Function"], weeklyTarget: 5, culturalMethod: "Cooperative Learning + Nordic Demokrati Pedagogy", milestones: ["Lead a group project from conception to completion","Negotiate a mutually acceptable solution in a conflict","Facilitate a group discussion where everyone contributes"], researchHighlight: "PISA 2015 collaborative problem solving scores predict academic outcomes better than individual scores in 20 countries.", weeklyPlans: [{ week:1,focus:"Team Roles",activities:["Team roles exploration","Strength-based role assignment","Collaboration reflection"] },{ week:2,focus:"Negotiation",activities:["Win-win negotiation practice","Conflict resolution simulation","Perspective-taking debates"] },{ week:3,focus:"Leadership",activities:["Project leadership role","Meeting facilitation","Group encouragement skills"] },{ week:4,focus:"Collective Creation",activities:["Group artwork","Collaborative story","Community project planning"] }] },
    { month: 8, theme: "Cultural & Historical Thinking", emoji: "🏛️", color: "#795548", description: "Historical empathy — understanding why people in different times and places made different choices — builds the most sophisticated form of perspective-taking.", scienceNote: "Historical thinking skills at age 8 predict superior performance in reading comprehension, moral reasoning, and civic engagement at age 15 (Barton, 2005).", intelligenceFocus: ["Interpersonal","Linguistic","Intrapersonal"], weeklyTarget: 5, culturalMethod: "All 5 Global Traditions + Historical Inquiry", milestones: ["Research and present a historical figure from a different culture","Compare problem-solving approaches across 3 cultures","Create a timeline of 10 world-changing inventions"], researchHighlight: "Students who study world history before age 10 show 27% better cross-cultural empathy scores at 15.", weeklyPlans: [{ week:1,focus:"Ancient Wisdom",activities:["Greek philosopher games","Indian mathematical history","Chinese innovation timeline"] },{ week:2,focus:"Cultural Problem Solving",activities:["How different cultures solved same problems","Cultural approach comparison","Wisdom tradition study"] },{ week:3,focus:"Inventors & Innovators",activities:["Inventor biography research","Innovation timeline","Inventor hat day"] },{ week:4,focus:"Future History",activities:["Future historian game","Community change project","Letter to future generations"] }] },
    { month: 9, theme: "Computational Thinking", emoji: "💻", color: "#607D8B", description: "Algorithms, decomposition, pattern recognition, abstraction — the thinking skills of computer science without a screen. Prepares for digital literacy while building logical precision.", scienceNote: "Wing (2006): Computational thinking is a fundamental analytical skill for everyone, not just computer scientists. Ages 7–9 is the optimal window.", intelligenceFocus: ["Logical-Mathematical","Executive Function","Creative"], weeklyTarget: 5, culturalMethod: "CS Unplugged + STEM + Maker Movement", milestones: ["Write an algorithm that successfully guides a 'robot'","Identify a pattern and write a general rule","Decompose a complex task into 8+ executable steps"], researchHighlight: "Children who learn computational thinking at age 7–9 show 22% better mathematics performance at age 12.", weeklyPlans: [{ week:1,focus:"Algorithms",activities:["Robot instructions game","Step-by-step procedure writing","Algorithm debugging"] },{ week:2,focus:"Decomposition",activities:["Complex task breakdown","Recipe algorithm writing","Event planning decomposition"] },{ week:3,focus:"Pattern & Abstraction",activities:["Pattern in data games","General rule writing","Abstraction sorting games"] },{ week:4,focus:"Applied Coding Thinking",activities:["Unplugged coding games","Binary number introduction","If-then logic games"] }] },
    { month: 10, theme: "Financial Literacy", emoji: "💰", color: "#4CAF50", description: "Money concepts, savings, entrepreneurship, and value creation — the financial intelligence that creates lifetime financial wellbeing. Age 7–8 is when abstract economic concepts become concrete.", scienceNote: "Children who learn financial concepts before age 10 make significantly better financial decisions throughout adulthood (Lusardi, 2015).", intelligenceFocus: ["Logical-Mathematical","Interpersonal","Executive Function"], weeklyTarget: 5, culturalMethod: "Montessori Practical Life + Waldorf Crafts for Trade", milestones: ["Understand income, expense, savings, and charity","Plan and execute a mini-business selling a product","Create a budget for a family event"], researchHighlight: "Lusardi (2015): Financial literacy education before age 10 is the strongest predictor of adult financial health.", weeklyPlans: [{ week:1,focus:"Money Concepts",activities:["Coin identification and value","Simple budgeting game","Earning and spending simulation"] },{ week:2,focus:"Saving & Goals",activities:["Savings goal jar","Interest concept introduction","Short-term goal planning"] },{ week:3,focus:"Entrepreneurship",activities:["Mini-business plan creation","Lemonade stand math","Value-creation brainstorm"] },{ week:4,focus:"Giving & Community",activities:["Charity allocation game","Community needs identification","Social enterprise concept"] }] },
    { month: 11, theme: "Environmental Stewardship", emoji: "🌍", color: "#8BC34A", description: "Environmental literacy — understanding ecological systems, human impact, and personal agency — builds naturalist intelligence while developing the moral reasoning and civic engagement skills.", scienceNote: "Sobel (2008): Children who develop nature connection before age 10 are significantly more likely to become environmental stewards as adults.", intelligenceFocus: ["Naturalist","Logical-Mathematical","Interpersonal"], weeklyTarget: 5, culturalMethod: "Forest School + Indian Prakriti + Scandinavian Friluftsliv", milestones: ["Understand 3 local ecosystem relationships","Design and implement a household sustainability project","Teach an environmental concept to a family member"], researchHighlight: "Wells & Lekies (2006): Regular nature contact before age 11 is the single strongest predictor of adult environmental behavior.", weeklyPlans: [{ week:1,focus:"Ecosystem Study",activities:["Food web modeling","Biodiversity audit","Ecosystem health indicators"] },{ week:2,focus:"Human Impact",activities:["Carbon footprint estimation","Waste audit","Renewable energy experiments"] },{ week:3,focus:"Solutions Focus",activities:["Local problem identification","Solution design challenge","Community action plan"] },{ week:4,focus:"Advocacy",activities:["Environmental poster creation","Teach the family presentation","Letter to community leader"] }] },
    { month: 12, theme: "Leadership & Legacy", emoji: "🌟", color: "#FFEB3B", description: "Leadership is not a personality type — it is a skill set: vision, communication, empathy, resilience, and service. This month builds the identity of a child who leads through contribution.", scienceNote: "Kouzes & Posner (2006): Leadership behaviors can be learned and are most effectively established before age 10.", intelligenceFocus: ["Intrapersonal","Interpersonal","All intelligences"], weeklyTarget: 5, culturalMethod: "All traditions — synthesis and leadership", milestones: ["Complete a year portfolio demonstrating growth in all intelligences","Lead a 'skill teaching' session for family or friends","Write a personal mission statement"], researchHighlight: "Children who develop leadership identity before age 10 show 3× higher community contribution in adulthood.", weeklyPlans: [{ week:1,focus:"Strength Portfolio",activities:["Portfolio compilation","Skill video creation","Growth documentation"] },{ week:2,focus:"Teaching Leadership",activities:["Teach 3 activities to others","Mentor a younger child","Skill sharing event"] },{ week:3,focus:"Vision & Mission",activities:["Personal mission statement","3-year vision board","Values clarification"] },{ week:4,focus:"Celebration",activities:["Year celebration ceremony","Achievement recognition","Next year commitment"] }] },
  ],
  projections: [
    { intel: "Logical-Mathematical", emoji: "🔢", targetActivities: 60, yearEndOutcome: "Multiplication/division mastery; algebraic thinking developing; mathematical reasoning 18 months ahead", color: "#1ABC9C", category: "Cognitive" },
    { intel: "Linguistic", emoji: "📖", targetActivities: 50, yearEndOutcome: "Critical reading comprehension; inferencing strong; written argumentation with evidence", color: "#2980B9", category: "Language" },
    { intel: "Executive Function", emoji: "🧩", targetActivities: 45, yearEndOutcome: "Strategic planning 2 moves ahead; working memory for complex tasks; self-regulation excellent", color: "#2C3E50", category: "Cognitive" },
    { intel: "Spatial-Visual", emoji: "🗺️", targetActivities: 40, yearEndOutcome: "3D geometric reasoning; engineering-level visualization; spatial problem-solving advanced", color: "#D35400", category: "Cognitive" },
    { intel: "Creative", emoji: "💡", targetActivities: 30, yearEndOutcome: "SCAMPER proficiency; design thinking initiated; divergent thinking 80th percentile", color: "#9B59B6", category: "Creative" },
    { intel: "Interpersonal", emoji: "🤝", targetActivities: 25, yearEndOutcome: "Leadership skills initiated; collaborative intelligence strong; negotiation ability", color: "#8E44AD", category: "Social" },
    { intel: "Naturalist", emoji: "🌍", targetActivities: 25, yearEndOutcome: "Ecosystem understanding; conservation mindset; 20+ species classification", color: "#27AE60", category: "Natural" },
    { intel: "Bodily-Kinesthetic", emoji: "🏃", targetActivities: 25, yearEndOutcome: "Sport-specific skills; coordination at athletic level; physical health habits established", color: "#E74C3C", category: "Physical" },
  ],
  researchBacking: [
    "Ferguson (1995): Chess training produces 17-percentile-point math improvement",
    "Diamond (2013): Executive function is the strongest predictor of academic outcomes",
    "Wing (2006): Computational thinking is a fundamental analytical skill for all",
    "Lusardi (2015): Financial literacy before 10 predicts lifetime financial health",
  ],
  yearEndStats: [
    { label: "Math Level", value: "+18 months", emoji: "🔢", color: "#4361EE" },
    { label: "Critical Reading", value: "Advanced", emoji: "📖", color: "#7209B7" },
    { label: "Strategic IQ", value: "High", emoji: "♟️", color: "#FB5607" },
    { label: "All Intelligences", value: "All 13 Active", emoji: "🧠", color: "#06D6A0" },
  ]
};

// ─── Tier 5: Ages 9-10 ─────────────────────────────────────────────────────────
const TIER5_YEAR_PLAN: YearPlan = {
  tier: 5,
  ageRange: "9–10 years",
  tagline: "Mastery, Systems Thinking & Legacy",
  yearEndVision: "By year end, your child will demonstrate pre-algebraic mathematical mastery, sophisticated critical analysis, systems thinking, philosophical inquiry, research skills, entrepreneurial mindset, and the clear identity of a capable, compassionate lifelong learner who is ready to make a meaningful contribution to the world.",
  activitiesNeeded: 300,
  weeklyTarget: 6,
  months: [
    { month: 1, theme: "Advanced Mathematics", emoji: "∑", color: "#3498DB", description: "Vedic maths, fractions, ratios, and pre-algebra — building mathematical mastery that makes secondary school mathematics accessible and enjoyable.", scienceNote: "Mastery of fraction concepts by age 10 is the single strongest predictor of secondary school mathematics success (Siegler, 2012).", intelligenceFocus: ["Logical-Mathematical","Spatial-Visual","Executive Function"], weeklyTarget: 6, culturalMethod: "Vedic Mathematics + Singapore Bar Modeling + Abacus", milestones: ["Solve fraction operations fluently","Apply Vedic mental math for rapid calculation","Understand and apply ratios in real contexts"], researchHighlight: "Siegler (2012): Fraction knowledge at age 10 predicts algebra achievement at age 14 better than any other early predictor.", weeklyPlans: [{ week:1,focus:"Fraction Mastery",activities:["Fraction pizza game","Equivalent fractions visual","Fraction on number line"] },{ week:2,focus:"Vedic Mental Math",activities:["Vedic multiplication tricks","Squaring numbers mentally","Quick calculation games"] },{ week:3,focus:"Ratios & Proportions",activities:["Recipe scaling","Map ratio application","Scale model building"] },{ week:4,focus:"Pre-Algebra",activities:["Variable introduction","Balance equation games","Pattern generalization"] }] },
    { month: 2, theme: "Rhetoric & Advanced Writing", emoji: "✍️", color: "#E74C3C", description: "Persuasive writing, argumentation, evidence evaluation, and rhetorical analysis — the language arts skills that underlie law, leadership, journalism, and scientific communication.", scienceNote: "Children who receive explicit argumentation instruction before age 11 show superior critical thinking throughout academic life (Osborne, 2010).", intelligenceFocus: ["Linguistic","Logical-Mathematical","Interpersonal"], weeklyTarget: 6, culturalMethod: "Socratic Method + Debate + Classical Rhetoric", milestones: ["Write a 5-paragraph persuasive essay with evidence","Identify logical fallacies in 5 arguments","Successfully debate both sides of an issue"], researchHighlight: "Students who practice formal argumentation show 35% better PISA critical thinking scores.", weeklyPlans: [{ week:1,focus:"Argument Structure",activities:["Claim-evidence-reasoning framework","Counterargument practice","Logical structure games"] },{ week:2,focus:"Evidence Evaluation",activities:["Source reliability rating","Fact vs. opinion sorting","Research skills basics"] },{ week:3,focus:"Persuasive Writing",activities:["5-paragraph essay structure","Rhetorical device identification","Peer editing practice"] },{ week:4,focus:"Debate Skills",activities:["Structured debate practice","Devil's advocate game","Panel discussion facilitation"] }] },
    { month: 3, theme: "Systems Thinking", emoji: "⚙️", color: "#9B59B6", description: "Seeing the whole, not just the parts: feedback loops, unintended consequences, leverage points — the thinking mode of engineers, ecologists, economists, and social change-makers.", scienceNote: "Systems thinking ability at age 10 predicts complex problem-solving in adulthood more strongly than any other cognitive ability (Meadows, 2008).", intelligenceFocus: ["Logical-Mathematical","Naturalist","Executive Function"], weeklyTarget: 5, culturalMethod: "Systems Dynamics + Waldorf Holistic Thinking", milestones: ["Map a complex system with 5+ feedback loops","Identify leverage points for change in a system","Predict unintended consequences of a proposed solution"], researchHighlight: "Forrester (1990): Systems thinking is the most important thinking tool for the 21st century and can be introduced effectively at age 9-10.", weeklyPlans: [{ week:1,focus:"Systems Mapping",activities:["Stock-flow diagrams","Feedback loop identification","Causal loop games"] },{ week:2,focus:"Feedback Loops",activities:["Reinforcing loop examples","Balancing loop discovery","Real-world system analysis"] },{ week:3,focus:"Unintended Consequences",activities:["Policy resistance games","Second-order thinking","Historical consequences analysis"] },{ week:4,focus:"Leverage Points",activities:["Where to intervene in a system","Design for systems change","Community systems mapping"] }] },
    { month: 4, theme: "Advanced Creative Expression", emoji: "🎭", color: "#E67E22", description: "At this age, creative mastery means synthesizing multiple forms — combining visual art, writing, music, and performance into complex, meaningful creative works.", scienceNote: "Creative mastery at age 10 requires integration of domain-specific knowledge with divergent thinking — the hallmark of adult creative achievement (Csikszentmihalyi, 1996).", intelligenceFocus: ["Creative","Linguistic","Musical-Rhythmic","Spatial-Visual"], weeklyTarget: 5, culturalMethod: "All creative traditions — synthesis", milestones: ["Complete a multi-discipline project (art + writing + music)","Receive and incorporate constructive feedback without defensiveness","Create work with a specific intended emotional effect"], researchHighlight: "Csikszentmihalyi (1996): Flow states in creative activities at ages 9–12 predict adult creative achievement and life satisfaction.", weeklyPlans: [{ week:1,focus:"Multi-Media Creation",activities:["Illustrated story creation","Music composition for story","Performance rehearsal"] },{ week:2,focus:"Aesthetic Judgment",activities:["Art critique practice","Compare master works","Create in the style of a master"] },{ week:3,focus:"Complex Projects",activities:["Mini-documentary project","Illustrated science report","Original composition performance"] },{ week:4,focus:"Creative Feedback",activities:["Peer critique session","Revision and improvement","Final performance or display"] }] },
    { month: 5, theme: "Physical Mastery", emoji: "⚡", color: "#1ABC9C", description: "Sport-specific skill mastery, physical challenge, and the connection between athletic development and cognitive performance — building the body as an instrument of excellence.", scienceNote: "Ratey (2008): Vigorous physical activity increases BDNF by 200–300% — the most powerful brain growth stimulus available. Athletes show 15% better executive function.", intelligenceFocus: ["Bodily-Kinesthetic","Intrapersonal","Executive Function"], weeklyTarget: 6, culturalMethod: "Yoga + Indian Wrestling/Gymnastics + Mindful Movement", milestones: ["Master a complex movement skill (specific sport, yoga sequence, or gymnastic move)","Complete a physical endurance challenge","Understand the connection between exercise and brain performance"], researchHighlight: "Hillman (2011): 20 minutes of aerobic exercise before tests improves performance by 25–30% in 9-10 year olds.", weeklyPlans: [{ week:1,focus:"Skill Mastery",activities:["Target sport skill practice","Performance video analysis","Technique refinement"] },{ week:2,focus:"Endurance Building",activities:["Progressive endurance challenge","Mind over matter conversation","Persistence training"] },{ week:3,focus:"Brain-Body Connection",activities:["Exercise-before-learning experiment","Sport psychology introduction","Visualization practice"] },{ week:4,focus:"Athletic Identity",activities:["Personal athletic achievement portfolio","Teaching sport skills to others","Physical goal setting"] }] },
    { month: 6, theme: "Mindfulness & Emotional Mastery", emoji: "🧘", color: "#F72585", description: "Advanced mindfulness — not just basic breathing but meta-cognitive awareness, compassion practices, and the ability to observe one's own thinking with non-judgmental clarity.", scienceNote: "Davidson (2012): 8-week mindfulness practice produces measurable changes in 9 brain regions including the prefrontal cortex, insula, and amygdala in school-age children.", intelligenceFocus: ["Intrapersonal","Emotional","Executive Function"], weeklyTarget: 5, culturalMethod: "Buddhist Vipassana + Indian Pranayama + MBSR for Kids", milestones: ["Sustain 10-minute mindfulness practice independently","Identify cognitive distortions in own thinking","Apply self-compassion during failure"], researchHighlight: "Kuyken (2013): School-based mindfulness shows 60% reduction in stress and significant improvements in well-being at age 9–10.", weeklyPlans: [{ week:1,focus:"Advanced Breathing",activities:["Box breathing mastery","Pranayama introduction","Breath-focused attention training"] },{ week:2,focus:"Mindful Awareness",activities:["Thought-watching meditation","Body scan practice","Mindful movement"] },{ week:3,focus:"Compassion Practices",activities:["Loving-kindness meditation","Self-compassion journal","Compassion in action"] },{ week:4,focus:"Integration",activities:["Daily mindfulness habit design","Stress inoculation practice","Mindfulness teaching project"] }] },
    { month: 7, theme: "Computer Science Logic", emoji: "💻", color: "#3F51B5", description: "Binary, encryption, algorithms, and data — the mathematical foundations of digital technology. Understanding how computers think builds both computational and mathematical fluency.", scienceNote: "Wing (2006): Computational thinking transfers to mathematical reasoning and analytical problem-solving across all domains.", intelligenceFocus: ["Logical-Mathematical","Executive Function","Creative"], weeklyTarget: 5, culturalMethod: "CS Unplugged + Maker + STEM", milestones: ["Convert between binary and decimal numbers","Create a working algorithm for a complex task","Explain how encryption protects information"], researchHighlight: "Computer science concepts learned before secondary school produce 3× better programming outcomes and stronger mathematical reasoning.", weeklyPlans: [{ week:1,focus:"Binary & Data",activities:["Binary counting bracelets","Data encoding games","Information theory exploration"] },{ week:2,focus:"Algorithms Advanced",activities:["Sorting algorithm games","Optimization challenges","Algorithm efficiency comparison"] },{ week:3,focus:"Networks & Systems",activities:["Internet working model","Network topology game","Distributed computing exploration"] },{ week:4,focus:"Encryption & Security",activities:["Caesar cipher","Code-breaking challenges","Privacy and ethics discussion"] }] },
    { month: 8, theme: "Philosophy & Ethics", emoji: "🤔", color: "#795548", description: "Philosophy for children (P4C) develops the highest-order thinking skills — questioning assumptions, following arguments to their logical conclusions, and building moral reasoning.", scienceNote: "Trickey & Topping (2004): P4C programs produce 0.43 effect size on cognitive ability and 0.55 on self-confidence. Age 9-10 shows strongest response.", intelligenceFocus: ["Intrapersonal","Interpersonal","Logical-Mathematical"], weeklyTarget: 5, culturalMethod: "Socratic Method + Indian Nyaya + Buddhist Ethics", milestones: ["Facilitate a philosophical discussion with family","Identify and challenge 3 of their own assumptions","Apply an ethical framework to a real dilemma"], researchHighlight: "Trickey & Topping (2004): P4C communities of inquiry produce measurable gains in reasoning, empathy, and self-confidence.", weeklyPlans: [{ week:1,focus:"Questioning Assumptions",activities:["Assumption identification games","What do we know vs believe","Socratic questioning practice"] },{ week:2,focus:"Ethical Frameworks",activities:["Utilitarianism introduction","Virtue ethics exploration","Trolley problem discussion"] },{ week:3,focus:"Big Questions",activities:["What is consciousness?","What makes something fair?","What is the purpose of education?"] },{ week:4,focus:"Applied Ethics",activities:["Real dilemma analysis","Personal values clarification","Community ethics project"] }] },
    { month: 9, theme: "Global Citizenship", emoji: "🌏", color: "#4CAF50", description: "Global citizenship — understanding interconnected systems, cultural diversity, and personal agency in global challenges — prepares children for meaningful contribution to complex 21st-century problems.", scienceNote: "Oxfam (2015): Global citizenship education improves academic performance, civic engagement, and intercultural competence across 15 outcome measures.", intelligenceFocus: ["Interpersonal","Naturalist","Logical-Mathematical"], weeklyTarget: 5, culturalMethod: "All 5 traditions + UNESCO Global Education", milestones: ["Research and present a global challenge with systems analysis","Connect a local issue to a global context","Design a personal action plan for global contribution"], researchHighlight: "UNESCO (2015): Global citizenship education is among the most powerful predictors of civic participation and collaborative problem-solving.", weeklyPlans: [{ week:1,focus:"Global Systems",activities:["World trade game","Climate system modeling","Population and resources simulation"] },{ week:2,focus:"Cultural Intelligence",activities:["Cross-cultural comparison project","Global problem research","International collaboration simulation"] },{ week:3,focus:"Interconnection",activities:["Butterfly effect stories","Global supply chain tracing","Historical globalization timeline"] },{ week:4,focus:"Personal Agency",activities:["Individual action impact calculation","Personal global action plan","Letter to world leaders"] }] },
    { month: 10, theme: "Research & Evidence", emoji: "📊", color: "#FF9800", description: "Research literacy — identifying credible sources, evaluating evidence, recognizing bias, and synthesizing information — the epistemic foundation of an educated citizen.", scienceNote: "Students who develop research skills before secondary school are significantly more resistant to misinformation and show better academic performance at 15 (McGrew, 2019).", intelligenceFocus: ["Logical-Mathematical","Linguistic","Executive Function"], weeklyTarget: 5, culturalMethod: "Scientific Method + Socratic + Academic Research", milestones: ["Complete an original research project with 5+ credible sources","Identify at least 3 forms of media bias","Distinguish between correlation and causation in 5 examples"], researchHighlight: "McGrew (2019): Lateral reading (checking sources) is the most effective strategy against misinformation — and teachable at age 9-10.", weeklyPlans: [{ week:1,focus:"Source Evaluation",activities:["Website credibility rating","Lateral reading practice","Authority check games"] },{ week:2,focus:"Bias Recognition",activities:["Media bias identification","Framing effect demonstration","Multiple perspective comparison"] },{ week:3,focus:"Research Process",activities:["Research question formation","Note-taking strategies","Citation practice"] },{ week:4,focus:"Evidence Synthesis",activities:["Multi-source synthesis writing","Correlation vs. causation games","Research presentation creation"] }] },
    { month: 11, theme: "Entrepreneurial Thinking", emoji: "💡", color: "#FF5722", description: "Identifying problems, designing solutions, understanding value creation, and building resilience through iteration — the entrepreneurial mindset that drives innovation.", scienceNote: "Luthans (2002): Psychological capital (efficacy, optimism, hope, resilience) developed in childhood predicts entrepreneurial success and life satisfaction.", intelligenceFocus: ["Logical-Mathematical","Creative","Interpersonal"], weeklyTarget: 5, culturalMethod: "Lean Startup + Design Thinking + Gandhian Innovation", milestones: ["Complete a full design thinking cycle for a community problem","Create and pitch a simple business idea","Learn from a self-designed failure and iterate"], researchHighlight: "Stanford d.school: Design thinking skills introduced before age 12 produce significantly better problem-solving at 18.", weeklyPlans: [{ week:1,focus:"Problem Identification",activities:["Community problem audit","Empathy interview practice","Problem framing game"] },{ week:2,focus:"Ideation & Design",activities:["Crazy 8 ideation","Prototype building","User testing simulation"] },{ week:3,focus:"Business Thinking",activities:["Value proposition canvas","Simple financial modeling","Pitch deck creation"] },{ week:4,focus:"Resilience & Iteration",activities:["Failure analysis practice","Pivot strategy game","Growth mindset in business"] }] },
    { month: 12, theme: "Legacy & Contribution", emoji: "🌟", color: "#FFEB3B", description: "The culminating month: documenting mastery, teaching others, articulating a personal mission, and committing to contribution — the identity of a person who leaves the world better.", scienceNote: "Damon (2008): Young people with a sense of purpose — wanting to make a contribution beyond themselves — show superior wellbeing, resilience, and academic performance.", intelligenceFocus: ["Intrapersonal","All intelligences"], weeklyTarget: 5, culturalMethod: "All traditions — synthesis and contribution", milestones: ["Complete comprehensive portfolio across all intelligences","Design and execute a community contribution project","Write and present a personal mission statement"], researchHighlight: "Damon (2008): Purpose-driven children show 40% better wellbeing and significantly higher academic motivation.", weeklyPlans: [{ week:1,focus:"Mastery Documentation",activities:["Portfolio completion","Best work selection","Growth video creation"] },{ week:2,focus:"Teaching & Legacy",activities:["Teach 5 activities to community","Mentoring younger children","Legacy documentation"] },{ week:3,focus:"Mission & Vision",activities:["Personal mission statement","10-year vision board","Values-action alignment check"] },{ week:4,focus:"Launch Ceremony",activities:["Family celebration ceremony","Community contribution commitment","Year 2027 goal declaration"] }] },
  ],
  projections: [
    { intel: "Logical-Mathematical", emoji: "∑", targetActivities: 65, yearEndOutcome: "Pre-algebra mastery; fraction fluency; mathematical reasoning 2 years ahead of grade level", color: "#1ABC9C", category: "Cognitive" },
    { intel: "Linguistic", emoji: "✍️", targetActivities: 55, yearEndOutcome: "Persuasive writing; rhetorical analysis; critical reading; argumentation strong", color: "#2980B9", category: "Language" },
    { intel: "Executive Function", emoji: "🧩", targetActivities: 50, yearEndOutcome: "Strategic planning advanced; systems thinking initiated; metacognition strong", color: "#2C3E50", category: "Cognitive" },
    { intel: "Creative", emoji: "🎭", targetActivities: 40, yearEndOutcome: "Multi-discipline creative mastery; design thinking; divergent thinking 90th percentile", color: "#9B59B6", category: "Creative" },
    { intel: "Interpersonal", emoji: "🌏", targetActivities: 35, yearEndOutcome: "Global citizenship; leadership identity; collaborative problem-solving advanced", color: "#8E44AD", category: "Social" },
    { intel: "Intrapersonal", emoji: "🧘", targetActivities: 30, yearEndOutcome: "Mindfulness mastery; emotional intelligence advanced; purpose and mission clarity", color: "#F39C12", category: "Emotional" },
    { intel: "Naturalist", emoji: "🌍", targetActivities: 25, yearEndOutcome: "Systems ecology; environmental stewardship; 25+ species identification", color: "#27AE60", category: "Natural" },
    { intel: "Bodily-Kinesthetic", emoji: "⚡", targetActivities: 25, yearEndOutcome: "Athletic mastery in chosen area; physical health habits for life; movement intelligence", color: "#E74C3C", category: "Physical" },
  ],
  researchBacking: [
    "Siegler (2012): Fraction knowledge at 10 predicts algebra achievement at 14",
    "Meadows (2008): Systems thinking is the most critical thinking skill for the 21st century",
    "Davidson (2012): Mindfulness produces measurable brain changes in school-age children",
    "Damon (2008): Purpose-driven children show 40% better wellbeing and academic motivation",
  ],
  yearEndStats: [
    { label: "Math Level", value: "Pre-Algebra", emoji: "∑", color: "#4361EE" },
    { label: "Critical Thinking", value: "Advanced", emoji: "🤔", color: "#7209B7" },
    { label: "Systems Thinking", value: "Initiated", emoji: "⚙️", color: "#FB5607" },
    { label: "All 13 Intelligences", value: "Mastery Level", emoji: "🌟", color: "#06D6A0" },
  ]
};

export const YEAR_PLANS: YearPlan[] = [
  TIER1_YEAR_PLAN,
  TIER2_YEAR_PLAN,
  TIER3_YEAR_PLAN,
  TIER4_YEAR_PLAN,
  TIER5_YEAR_PLAN,
];

export function getYearPlan(tier: number): YearPlan {
  return YEAR_PLANS[Math.max(0, Math.min(4, tier - 1))];
}

export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTH_NAMES_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1; // 1-12
}

export function getYearProgress(activitiesCompleted: number): {
  percent: number;
  onTrack: boolean;
  projectedYearEnd: number;
  activitiesPerWeekNeeded: number;
} {
  const weeksElapsed = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const weeksRemaining = 52 - weeksElapsed;
  const activitiesNeeded = 300 - activitiesCompleted;
  const activitiesPerWeekNeeded = weeksRemaining > 0 ? Math.ceil(activitiesNeeded / weeksRemaining) : 0;
  const projectedYearEnd = Math.round((activitiesCompleted / weeksElapsed) * 52);
  const onTrack = activitiesCompleted >= Math.floor((weeksElapsed / 52) * 300);
  return {
    percent: Math.min(100, Math.round((activitiesCompleted / 300) * 100)),
    onTrack,
    projectedYearEnd: Math.min(365, projectedYearEnd),
    activitiesPerWeekNeeded: Math.max(1, activitiesPerWeekNeeded),
  };
}
