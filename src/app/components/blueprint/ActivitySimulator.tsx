import { useState } from "react";

// ─── Full Activity Database (sample set for simulation) ───────────────────────
interface Activity {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number;
  materials: string[];
  intelligences: string[];
  method: string;
  region: string;
  ageTiers: number[];
  difficulty: number;
  parentTip: string;
  emoji: string;
  regionEmoji: string;
}

const ACTIVITY_DATABASE: Activity[] = [
  // ── Tier 1–2 (1–2 yrs) ──────────────────────────────────────────────────
  {
    id: "a1", name: "Rice Sensory Bin", emoji: "🌾", regionEmoji: "🇮🇳",
    description: "Fill a bowl with rice and hide small safe objects for baby to discover through touch and sound.",
    instructions: ["Fill a large bowl with uncooked rice", "Hide 3–5 safe objects (spoon, cloth, cup)", "Let baby explore freely — scooping, hiding, discovering", "Name each object they find", "Describe textures: 'smooth', 'bumpy', 'cold'"],
    duration: 8, materials: ["Rice / Grains", "Bowls / Plates", "Spoons (wooden/metal/plastic)"],
    intelligences: ["Bodily-Kinesthetic", "Naturalist", "Linguistic"], method: "Montessori", region: "Western",
    ageTiers: [1, 2], difficulty: 1,
    parentTip: "Sensory bins build neural pathways for texture discrimination. Rice mimics sand, a primitive sensory medium.",
  },
  {
    id: "a2", name: "Peek-a-Boo Memory Game", emoji: "👀", regionEmoji: "🇯🇵",
    description: "Classic peek-a-boo with variations to build object permanence and social bonding.",
    instructions: ["Cover your face with a cloth or towel", "Say 'Where did I go?' slowly", "Reveal with 'Peek-a-boo!'", "Then cover a toy under the cloth", "Let baby pull cloth to 'find' the toy"],
    duration: 5, materials: ["Blankets / Towels"],
    intelligences: ["Spatial-Visual", "Interpersonal", "Emotional"], method: "Shichida", region: "Japanese",
    ageTiers: [1], difficulty: 1,
    parentTip: "Object permanence (understanding hidden things exist) is foundational for all abstract thinking. Peak development: 8–12 months.",
  },
  {
    id: "a3", name: "Drum Beat Imitation", emoji: "🥁", regionEmoji: "🇩🇪",
    description: "Tap rhythms on pots and pans — baby imitates your beat pattern.",
    instructions: ["Sit facing each other with pots/pans and spoons", "Tap a simple 2-beat pattern (tap-tap)", "Wait for baby to imitate", "Try 3 beats when they get 2", "Celebrate every attempt enthusiastically"],
    duration: 10, materials: ["Cooking Pots / Lids", "Spoons (wooden/metal/plastic)"],
    intelligences: ["Musical-Rhythmic", "Interpersonal", "Bodily-Kinesthetic"], method: "Waldorf", region: "Western",
    ageTiers: [1, 2], difficulty: 1,
    parentTip: "Beat imitation activates mirror neurons and auditory-motor integration — foundational for both music and language.",
  },
  // ── Tier 2–3 (3–4 yrs) ──────────────────────────────────────────────────
  {
    id: "a4", name: "Button Counting & Sorting", emoji: "🔵", regionEmoji: "🇮🇹",
    description: "Sort buttons by color/size into a muffin tin — builds 1-to-1 correspondence and classification.",
    instructions: ["Spread 20–30 buttons on the table", "Place a muffin tin in front of child", "Ask: 'Can you put all red buttons here?'", "Count buttons together as they sort", "Extend: sort by size next"],
    duration: 15, materials: ["Buttons (various sizes)", "Muffin/Cupcake Tin"],
    intelligences: ["Logical-Mathematical", "Bodily-Kinesthetic", "Naturalist"], method: "Montessori", region: "Western",
    ageTiers: [2, 3], difficulty: 2,
    parentTip: "Sorting is pre-mathematical classification. Children who sort well at age 3 show stronger algebra reasoning at age 7.",
  },
  {
    id: "a5", name: "Emotion Face Cards", emoji: "😊", regionEmoji: "🇰🇷",
    description: "Draw faces showing emotions on cards, then match them to how you feel.",
    instructions: ["Draw 6 simple faces on cards: happy, sad, angry, surprised, scared, calm", "Show each card and make the face", "Ask 'How does this face feel?'", "Play matching game: 'Show me how YOU feel right now'", "Tell a mini-story for each emotion"],
    duration: 12, materials: ["Any Paper (scrap/newspaper/old books)", "Pencils / Crayons"],
    intelligences: ["Emotional", "Interpersonal", "Linguistic"], method: "Nunchi", region: "Korean",
    ageTiers: [2, 3], difficulty: 1,
    parentTip: "Naming emotions builds the prefrontal cortex's ability to regulate them. Research: labeling feelings reduces amygdala activation by 50%.",
  },
  {
    id: "a6", name: "Paper Boat Origami", emoji: "⛵", regionEmoji: "🇯🇵",
    description: "Fold a simple paper boat together — following steps, predicting folds, and testing in water.",
    instructions: ["Use any A4 paper", "Fold in half lengthwise", "Fold top corners to center", "Fold bottom strips up (both sides)", "Open from inside to form boat shape", "Test in a bowl of water"],
    duration: 15, materials: ["Any Paper (scrap/newspaper/old books)", "Bowls / Plates", "Water"],
    intelligences: ["Spatial-Visual", "Bodily-Kinesthetic", "Logical-Mathematical"], method: "Origami", region: "Japanese",
    ageTiers: [2, 3], difficulty: 2,
    parentTip: "Origami fold prediction activates parietal spatial networks — Stanford study found significant spatial reasoning gains.",
  },
  {
    id: "a7", name: "Cup-Stacking Number Chant", emoji: "🏆", regionEmoji: "🇮🇳",
    description: "Stack cups to rhythmic number chanting — embodying place value through rhythm and height.",
    instructions: ["Get 10 plastic/paper cups", "Chant '1!' and place one cup", "Chant '2-ones make 2!' and stack two", "Build rhythm: clap on each number", "Count backward while unstacking"],
    duration: 10, materials: ["Cups / Glasses (various sizes)"],
    intelligences: ["Logical-Mathematical", "Musical-Rhythmic", "Bodily-Kinesthetic"], method: "Sthanapath", region: "Indian",
    ageTiers: [2, 3], difficulty: 2,
    parentTip: "Rhythmic encoding of number sequences activates the phonological loop — shown to strengthen working memory by 25%.",
  },
  // ── Tier 3–4 (5–6 yrs) ──────────────────────────────────────────────────
  {
    id: "a8", name: "Symmetry Fold Drawing", emoji: "🎨", regionEmoji: "🇮🇳",
    description: "Fold paper, draw half a shape on one side, unfold to reveal perfect symmetry.",
    instructions: ["Fold paper in half", "Draw half a butterfly/heart/face along the fold", "Paint or color it while folded", "Unfold to reveal the mirror image", "Discuss: 'What is symmetry?'"],
    duration: 15, materials: ["Any Paper (scrap/newspaper/old books)", "Pencils / Crayons"],
    intelligences: ["Spatial-Visual", "Creative", "Logical-Mathematical"], method: "Mandala", region: "Indian",
    ageTiers: [3, 4], difficulty: 2,
    parentTip: "Bilateral drawing activates both brain hemispheres simultaneously, strengthening corpus callosum connectivity.",
  },
  {
    id: "a9", name: "Vedic Finger Multiplication", emoji: "✋", regionEmoji: "🇮🇳",
    description: "Use finger patterns to calculate 6×6 through 10×10 instantly using the Vedic method.",
    instructions: ["Hold both hands up, fingers extended", "For 7×8: fold down 2 fingers (left) and 3 fingers (right)", "Count folded fingers: 2+3=5 (tens place)", "Count raised fingers: 3×2=6 (units place)", "Answer: 56! Verify with 7×8=56"],
    duration: 15, materials: [],
    intelligences: ["Logical-Mathematical", "Bodily-Kinesthetic", "Spatial-Visual"], method: "Vedic Mathematics", region: "Indian",
    ageTiers: [3, 4, 5], difficulty: 3,
    parentTip: "Vedic finger math builds number sense and mental calculation 40% faster than rote memorization. No materials needed!",
  },
  {
    id: "a10", name: "Sound Sorting Game", emoji: "🔊", regionEmoji: "🇯🇵",
    description: "Sort household objects by their starting sound — building phonemic awareness for reading.",
    instructions: ["Collect 10 small objects (ball, book, cup, stone, leaf...)", "Say each object name clearly", "Sort into groups by first sound: B-sounds, C-sounds...", "Stretch the first sound: 'Bbb-all', 'Ccc-up'", "Find more objects in the room with same sounds"],
    duration: 20, materials: ["Stones / Pebbles", "Dried Leaves / Twigs", "Any Paper (scrap/newspaper/old books)"],
    intelligences: ["Linguistic", "Logical-Mathematical", "Naturalist"], method: "Kumon", region: "Japanese",
    ageTiers: [3, 4], difficulty: 2,
    parentTip: "Phonemic awareness is the single strongest predictor of early reading success. Ages 5–6 is the critical window.",
  },
  // ── Tier 4–5 (7–10 yrs) ──────────────────────────────────────────────────
  {
    id: "a11", name: "Egg-Carton Abacus Math", emoji: "🧮", regionEmoji: "🇨🇳",
    description: "Build an abacus with an egg carton and beans — then use it to calculate multi-digit sums mentally.",
    instructions: ["Get an egg carton (10 slots) and dried beans", "Each slot = one position (ones, tens...)", "Place beans to represent a number (e.g. 47)", "Add a second number by placing more beans", "Move beans to carry tens — visualize the calculation"],
    duration: 20, materials: ["Egg Cartons", "Dried Beans / Lentils"],
    intelligences: ["Logical-Mathematical", "Spatial-Visual", "Executive Function"], method: "Abacus (Suanpan)", region: "Chinese",
    ageTiers: [3, 4, 5], difficulty: 3,
    parentTip: "Abacus users develop an internal 'mental abacus' — Journal of Neuroscience shows 3× faster mental arithmetic and enlarged parietal regions.",
  },
  {
    id: "a12", name: "Bar Model Word Problems", emoji: "📐", regionEmoji: "🇰🇷",
    description: "Draw rectangular bars to represent word problems — converting abstract numbers to visual blocks.",
    instructions: ["Read a problem: 'Sam has 28 apples, gives away 12. How many left?'", "Draw a long bar for total (28)", "Mark a section for 'given away' (12)", "The remaining section = answer", "Write equation from the bar: 28–12=?"],
    duration: 20, materials: ["Any Paper (scrap/newspaper/old books)", "Pencils / Crayons", "Ruler / Measuring tape"],
    intelligences: ["Logical-Mathematical", "Spatial-Visual", "Linguistic"], method: "Bar Modeling", region: "Korean",
    ageTiers: [4, 5], difficulty: 3,
    parentTip: "Bar modeling (Singapore/Korea method) is why these nations rank #1 in PISA math. It bridges concrete and abstract thinking.",
  },
  {
    id: "a13", name: "Go Territory Game (5×5 Mini)", emoji: "⚫", regionEmoji: "🇨🇳",
    description: "Play mini-Go on a 5×5 grid drawn on paper — claim territory with stones and plan ahead.",
    instructions: ["Draw a 5×5 grid on paper (dots at intersections)", "Use dark stones and light objects as pieces", "Take turns placing pieces on intersections", "Surround opponent's pieces to capture them", "Most territory at end wins — plan 3 moves ahead"],
    duration: 25, materials: ["Stones / Pebbles", "Bottle Caps", "Any Paper (scrap/newspaper/old books)"],
    intelligences: ["Logical-Mathematical", "Spatial-Visual", "Executive Function"], method: "Go (Weiqi)", region: "Chinese",
    ageTiers: [4, 5], difficulty: 4,
    parentTip: "Go trains deeper planning circuits than chess. Korean studies: regular Go training improves IQ and attention by measurable margins.",
  },
  {
    id: "a14", name: "Leitner Flashcard System", emoji: "🗂️", regionEmoji: "🌍",
    description: "Build a self-correcting spaced repetition card system with 5 boxes and homemade cards.",
    instructions: ["Label 5 small boxes: Daily, 2-day, 4-day, 8-day, 16-day", "Write facts/words on homemade cards", "Start all cards in Box 1 (review daily)", "Cards answered correctly move to next box", "Wrong answers go back to Box 1"],
    duration: 25, materials: ["Any Paper (scrap/newspaper/old books)", "Pencils / Crayons"],
    intelligences: ["Executive Function", "Linguistic", "Logical-Mathematical"], method: "Spaced Repetition", region: "Western",
    ageTiers: [4, 5], difficulty: 3,
    parentTip: "Spaced repetition produces 200% better retention than re-reading. This system, used by memory champions, takes 10 min/day.",
  },
  {
    id: "a15", name: "Modular Origami Star", emoji: "⭐", regionEmoji: "🇯🇵",
    description: "Fold 6 identical modules and assemble them into a 3D paper star — geometry in 3D.",
    instructions: ["Fold 6 small paper squares into 'units' (triangle pockets)", "Each fold creates a locking tab", "Insert tabs into pockets to connect units", "Form a star shape as you connect all 6", "Test strength and symmetry"],
    duration: 30, materials: ["Any Paper (scrap/newspaper/old books)"],
    intelligences: ["Spatial-Visual", "Logical-Mathematical", "Creative"], method: "Origami", region: "Japanese",
    ageTiers: [5], difficulty: 5,
    parentTip: "Modular origami requires predicting 3D assembly from 2D pieces — activates the same spatial circuits used in architecture and engineering.",
  },
  {
    id: "a16", name: "Unplugged Coding: Robot Commands", emoji: "🤖", regionEmoji: "🌍",
    description: "Write step-by-step instructions to move a 'robot' (sibling/parent) through a maze drawn on the floor.",
    instructions: ["Draw or tape a simple maze on the floor", "Write command cards: FORWARD, TURN LEFT, TURN RIGHT", "Child writes a sequence of commands on paper", "Parent/sibling follows commands exactly (robot-style)", "Debug: where did the robot go wrong? Fix the sequence"],
    duration: 30, materials: ["Tape (any type)", "Any Paper (scrap/newspaper/old books)", "Pencils / Crayons"],
    intelligences: ["Logical-Mathematical", "Executive Function", "Linguistic"], method: "Kumon", region: "Western",
    ageTiers: [4, 5], difficulty: 4,
    parentTip: "Computational thinking without screens builds algorithmic logic and debugging mindset — core 21st-century skills.",
  },
  {
    id: "a17", name: "Barefoot Texture Walk", emoji: "👣", regionEmoji: "🇯🇵",
    description: "Walk barefoot over different surfaces outdoors — naming sensations and connecting with nature.",
    instructions: ["Remove shoes and socks", "Walk slowly on 5 surfaces: grass, soil, pavement, gravel, smooth stone", "Name each texture: warm, prickly, soft, rough, cold", "Draw a map of the walk with texture notes", "Collect one small natural item from each surface"],
    duration: 15, materials: ["Garden space / Sidewalk", "Any Paper (scrap/newspaper/old books)"],
    intelligences: ["Naturalist", "Bodily-Kinesthetic", "Intrapersonal"], method: "Shinrin-yoku", region: "Japanese",
    ageTiers: [1, 2, 3, 4, 5], difficulty: 1,
    parentTip: "Barefoot outdoor contact (grounding) reduces cortisol by up to 16% and improves sensory integration in children.",
  },
  {
    id: "a18", name: "5-Senses Nature Scavenger Hunt", emoji: "🌿", regionEmoji: "🇯🇵",
    description: "Find nature items using each of the 5 senses — and describe each discovery.",
    instructions: ["Create a list: find something ROUGH, something SWEET-SMELLING, something COLORFUL, something that MAKES A SOUND, something TINY", "Go outside (garden, park, courtyard)", "Find and collect or observe each item", "Draw items in a 'nature journal'", "Share 3 things that surprised you"],
    duration: 20, materials: ["Garden space / Sidewalk", "Any Paper (scrap/newspaper/old books)", "Pencils / Crayons"],
    intelligences: ["Naturalist", "Linguistic", "Intrapersonal"], method: "Forest School / Shinrin-yoku", region: "Japanese",
    ageTiers: [2, 3, 4, 5], difficulty: 2,
    parentTip: "Nature exposure improves directed attention by 20% — University of Michigan. Works even in urban environments with minimal green space.",
  },
  {
    id: "a19", name: "Water Brush Calligraphy", emoji: "🖌️", regionEmoji: "🇨🇳",
    description: "Use a wet paintbrush to write strokes on dark paper or slate — strokes disappear as they dry.",
    instructions: ["Wet a paintbrush or cloth with water", "Use dark paper, slate, or a dark-colored plate", "Practice slow deliberate strokes: horizontal, vertical, curved", "Copy simple shapes or letters", "Observe how strokes slowly vanish — re-do them"],
    duration: 15, materials: ["Water", "Any Paper (scrap/newspaper/old books)", "Spoons (wooden/metal/plastic)"],
    intelligences: ["Bodily-Kinesthetic", "Spatial-Visual", "Intrapersonal"], method: "Chinese Calligraphy", region: "Chinese",
    ageTiers: [2, 3, 4, 5], difficulty: 2,
    parentTip: "Slow deliberate stroke practice builds cerebellar fine-motor circuits — research shows calligraphy improves handwriting speed and quality 30%.",
  },
  {
    id: "a20", name: "Animal Pose Yoga Story", emoji: "🦁", regionEmoji: "🇮🇳",
    description: "Do a 5-pose yoga sequence while telling a story — each pose is an animal character.",
    instructions: ["Create a story: 'The lion met a cat, who jumped like a dog, then rested like a tree...'", "Lion pose: stick tongue out wide", "Cat pose: arch back on hands and knees", "Dog pose: downward dog", "Tree pose: balance on one leg", "Child's pose: rest like a sleeping bear"],
    duration: 12, materials: ["Blankets / Towels"],
    intelligences: ["Bodily-Kinesthetic", "Linguistic", "Intrapersonal", "Creative"], method: "Yoga & Pranayama", region: "Indian",
    ageTiers: [1, 2, 3, 4, 5], difficulty: 1,
    parentTip: "Yoga improves attention span by 32% (Harvard Medical School) — just 10–15 minutes daily. The story makes it engaging for all ages.",
  },
];

// ─── Materials available to select ────────────────────────────────────────────
const MATERIAL_OPTIONS = [
  { id: "rice",     label: "Rice / Grains",        emoji: "🌾", db: "Rice / Grains" },
  { id: "buttons",  label: "Buttons",               emoji: "🔵", db: "Buttons (various sizes)" },
  { id: "paper",    label: "Paper",                 emoji: "📄", db: "Any Paper (scrap/newspaper/old books)" },
  { id: "pencils",  label: "Pencils / Crayons",     emoji: "✏️", db: "Pencils / Crayons" },
  { id: "cups",     label: "Cups",                  emoji: "🥤", db: "Cups / Glasses (various sizes)" },
  { id: "bowls",    label: "Bowls / Plates",        emoji: "🥣", db: "Bowls / Plates" },
  { id: "spoons",   label: "Spoons",                emoji: "🥄", db: "Spoons (wooden/metal/plastic)" },
  { id: "pots",     label: "Pots / Lids",           emoji: "🍳", db: "Cooking Pots / Lids" },
  { id: "eggtray",  label: "Egg Carton",            emoji: "🥚", db: "Egg Cartons" },
  { id: "beans",    label: "Beans / Lentils",       emoji: "🫘", db: "Dried Beans / Lentils" },
  { id: "stones",   label: "Stones / Pebbles",      emoji: "🪨", db: "Stones / Pebbles" },
  { id: "blanket",  label: "Blankets / Towels",     emoji: "🛏️", db: "Blankets / Towels" },
  { id: "tape",     label: "Tape",                  emoji: "🩹", db: "Tape (any type)" },
  { id: "ruler",    label: "Ruler",                 emoji: "📏", db: "Ruler / Measuring tape" },
  { id: "water",    label: "Water",                 emoji: "💧", db: "Water" },
  { id: "outdoor",  label: "Outdoor Space",         emoji: "🌿", db: "Garden space / Sidewalk" },
  { id: "muffin",   label: "Muffin Tin",            emoji: "🧁", db: "Muffin/Cupcake Tin" },
  { id: "cardboard",label: "Cardboard",             emoji: "📦", db: "Cardboard / Cereal Boxes" },
  { id: "leaves",   label: "Leaves / Twigs",        emoji: "🍃", db: "Dried Leaves / Twigs" },
  { id: "bottlecap",label: "Bottle Caps",           emoji: "🪙", db: "Bottle Caps" },
];

// ─── Age tiers ────────────────────────────────────────────────────────────────
const AGE_TIER_OPTIONS = [
  { tier: 1, label: "1–2 years",  emoji: "🌱", desc: "Seedling" },
  { tier: 2, label: "3–4 years",  emoji: "🌿", desc: "Sprout" },
  { tier: 3, label: "5–6 years",  emoji: "🌳", desc: "Sapling" },
  { tier: 4, label: "7–8 years",  emoji: "🌲", desc: "Branch" },
  { tier: 5, label: "9–10 years", emoji: "🏔️", desc: "Forest" },
];

// ─── Mood options ─────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { id: "high",  label: "High Energy", emoji: "⚡" },
  { id: "calm",  label: "Calm",        emoji: "😌" },
  { id: "focus", label: "Focused",     emoji: "🎯" },
  { id: "low",   label: "Tired",       emoji: "😴" },
];

// ─── Intelligence colors ──────────────────────────────────────────────────────
const INTEL_COLORS: Record<string, string> = {
  "Linguistic": "#4361EE", "Logical-Mathematical": "#3A0CA3", "Spatial-Visual": "#7209B7",
  "Musical-Rhythmic": "#F72585", "Bodily-Kinesthetic": "#FB5607", "Interpersonal": "#06D6A0",
  "Intrapersonal": "#118AB2", "Naturalist": "#2DC653", "Emotional": "#E63946",
  "Creative": "#FFB703", "Executive Function": "#14213D", "Digital-Technological": "#0077B6",
};

// ─── AGE Algorithm ────────────────────────────────────────────────────────────
function runAGE(
  tier: number,
  selectedMaterials: string[],
  mood: string,
  timeMinutes: number,
): Activity[] {
  const availableDbNames = MATERIAL_OPTIONS
    .filter((m) => selectedMaterials.includes(m.id))
    .map((m) => m.db);

  // Always include "no materials" activities
  availableDbNames.push("fingers only", "none", "");

  // Phase 2: Filter by age tier and material availability
  const eligible = ACTIVITY_DATABASE.filter((act) => {
    if (!act.ageTiers.includes(tier)) return false;
    if (act.materials.length === 0) return true;
    return act.materials.every((m) => availableDbNames.some((db) => db.toLowerCase().includes(m.toLowerCase().split(" ")[0]) || m.toLowerCase().includes(db.toLowerCase().split(" ")[0])));
  });

  if (eligible.length === 0) return [];

  // Phase 3: Score each activity
  const scored = eligible.map((act) => {
    let score = 50; // base

    // Age match bonus
    if (act.ageTiers[0] === tier) score += 15;

    // Mood adaptation
    if (mood === "low" && (act.intelligences.includes("Intrapersonal") || act.intelligences.includes("Naturalist"))) score += 12;
    if (mood === "high" && act.intelligences.includes("Bodily-Kinesthetic")) score += 12;
    if (mood === "focus" && act.intelligences.includes("Executive Function")) score += 12;
    if (mood === "calm" && act.intelligences.includes("Musical-Rhythmic")) score += 10;

    // Difficulty sweet spot
    const idealDifficulty = Math.min(tier + 1, 5);
    score -= Math.abs(act.difficulty - idealDifficulty) * 5;

    // Duration fit
    if (act.duration <= timeMinutes / 3) score += 5;

    // Material richness (more materials used = better engagement)
    score += Math.min(act.materials.length * 3, 12);

    // Small random factor for variety
    score += Math.random() * 15;

    return { act, score };
  });

  // Phase 4: Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Phase 5: Pack assembly with diversity rules
  const pack: Activity[] = [];
  const coveredIntelligences = new Set<string>();
  const usedRegions = new Map<string, number>();
  let totalDuration = 0;
  const countTarget = Math.min(tier === 1 ? 2 : tier <= 3 ? 3 : tier === 4 ? 4 : 5, 5);

  for (const { act } of scored) {
    if (pack.length >= countTarget) break;
    if (totalDuration + act.duration > timeMinutes + 10) continue;

    // Rule 2: max 2 from same region
    const regionCount = usedRegions.get(act.region) ?? 0;
    if (regionCount >= 2) continue;

    // Rule 1: prefer activities covering new intelligences
    const newIntelCount = act.intelligences.filter((i) => !coveredIntelligences.has(i)).length;
    if (newIntelCount === 0 && pack.length >= 2) continue;

    pack.push(act);
    act.intelligences.forEach((i) => coveredIntelligences.add(i));
    usedRegions.set(act.region, regionCount + 1);
    totalDuration += act.duration;
  }

  return pack;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ActivitySimulator() {
  const [step, setStep] = useState<"setup" | "result">("setup");
  const [ageTier, setAgeTier] = useState<number>(3);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(["paper", "pencils", "cups", "water"]);
  const [mood, setMood] = useState<string>("focus");
  const [timeMinutes, setTimeMinutes] = useState<number>(45);
  const [generatedPack, setGeneratedPack] = useState<Activity[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const pack = runAGE(ageTier, selectedMaterials, mood, timeMinutes);
      setGeneratedPack(pack);
      setGenerating(false);
      setStep("result");
    }, 1200);
  };

  const coveredIntelligences = [...new Set(generatedPack.flatMap((a) => a.intelligences))];
  const totalDuration = generatedPack.reduce((sum, a) => sum + a.duration, 0);

  if (step === "result") {
    return (
      <div>
        {/* Result Header */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: "linear-gradient(135deg, #F72585, #7209B7)" }}>
          <div className="text-white/70 text-xs mb-1">Generated Daily Pack</div>
          <div className="text-white font-bold text-base mb-3">
            {generatedPack.length} Activities · {totalDuration} min total
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {coveredIntelligences.slice(0, 5).map((i) => (
              <span key={i} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{i}</span>
            ))}
            {coveredIntelligences.length > 5 && (
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">+{coveredIntelligences.length - 5} more</span>
            )}
          </div>
        </div>

        {/* Algorithm trace */}
        <div className="bg-gray-900 rounded-2xl p-3 mb-4 text-xs">
          <div className="text-gray-400 font-bold tracking-widest mb-2">⚙️ AGE RUN TRACE</div>
          <div className="space-y-1 font-mono">
            <div className="text-blue-300">▸ Tier {ageTier} filter → {ACTIVITY_DATABASE.filter(a => a.ageTiers.includes(ageTier)).length} eligible</div>
            <div className="text-blue-300">▸ Material filter → {runAGE(ageTier, selectedMaterials, mood, timeMinutes + 999).length} available</div>
            <div className="text-green-400">▸ Mood: {mood} · scoring applied</div>
            <div className="text-green-400">▸ Diversity rules → {generatedPack.length} selected</div>
            <div className="text-yellow-400">▸ Output: {totalDuration} min / {timeMinutes} min budget</div>
          </div>
        </div>

        {/* Activity Cards */}
        <div className="space-y-3 mb-4">
          {generatedPack.map((act, idx) => {
            const isExpanded = expandedActivity === act.id;
            return (
              <div key={act.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <button
                  className="w-full text-left p-4"
                  onClick={() => setExpandedActivity(isExpanded ? null : act.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">
                      {act.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">#{idx + 1}</span>
                        <span className="text-xs text-gray-400">{act.regionEmoji} {act.region}</span>
                        <span className="text-xs text-gray-400">⏱ {act.duration}min</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{act.name}</div>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {act.intelligences.map((intel) => (
                          <span key={intel} className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: (INTEL_COLORS[intel] ?? "#888") + "18", color: INTEL_COLORS[intel] ?? "#888" }}>
                            {intel.split("-")[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm flex-shrink-0 mt-1">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed pt-3">{act.description}</p>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-bold text-gray-500 mb-2">📋 STEPS</div>
                      <div className="space-y-1.5">
                        {act.instructions.map((step, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold flex-shrink-0 mt-px" style={{ fontSize: 9 }}>{i + 1}</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {act.materials.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 mb-1.5">🏠 Materials</div>
                        <div className="flex flex-wrap gap-1">
                          {act.materials.map((m) => (
                            <span key={m} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{m}</span>
                          ))}
                          {act.materials.length === 0 && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">No materials needed</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <div className="text-xs font-bold text-amber-700 mb-1">🔬 Why This Works</div>
                      <p className="text-xs text-amber-800 leading-relaxed">{act.parentTip}</p>
                    </div>

                    <div className="text-xs text-gray-400 text-right">Method: {act.method}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Intelligence coverage bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="text-xs font-bold text-gray-700 mb-3">🧠 Today's Intelligence Coverage</div>
          <div className="grid grid-cols-3 gap-2">
            {coveredIntelligences.map((intel) => (
              <div key={intel} className="rounded-xl p-2 text-center" style={{ background: (INTEL_COLORS[intel] ?? "#888") + "15" }}>
                <div className="text-xs font-semibold" style={{ color: INTEL_COLORS[intel] ?? "#888" }}>{intel.split("-")[0]}</div>
              </div>
            ))}
          </div>
          {coveredIntelligences.length < 4 && (
            <p className="text-xs text-amber-600 mt-2">⚠️ Add more materials to cover more intelligence types.</p>
          )}
        </div>

        {/* Regenerate */}
        <button
          onClick={() => { setStep("setup"); setExpandedActivity(null); }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold border-2 border-purple-200 text-purple-600 mb-2"
        >
          ← Adjust & Regenerate
        </button>
        <button
          onClick={() => {
            setGenerating(true);
            setTimeout(() => {
              setGeneratedPack(runAGE(ageTier, selectedMaterials, mood, timeMinutes));
              setGenerating(false);
              setExpandedActivity(null);
            }, 800);
          }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #F72585, #7209B7)" }}
        >
          🔀 Shuffle Pack
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: "linear-gradient(135deg, #F72585cc, #7209B7cc)" }}>
        <div className="text-white font-bold mb-1">⚡ Live Activity Generator</div>
        <p className="text-white/70 text-xs leading-relaxed">
          This is a working prototype of the AGE algorithm. Configure below and tap Generate to receive a personalized daily pack.
        </p>
      </div>

      {/* Step 1: Age Tier */}
      <SectionLabel step={1} label="Child's Age" />
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        {AGE_TIER_OPTIONS.map((t) => (
          <button
            key={t.tier}
            onClick={() => setAgeTier(t.tier)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl border-2 transition-all"
            style={{
              background: ageTier === t.tier ? "#F72585" : "white",
              borderColor: ageTier === t.tier ? "#F72585" : "#e5e7eb",
              minWidth: 68,
            }}
          >
            <span className="text-lg">{t.emoji}</span>
            <span className="text-xs font-bold" style={{ color: ageTier === t.tier ? "white" : "#374151" }}>{t.label}</span>
            <span className="text-xs opacity-75" style={{ color: ageTier === t.tier ? "rgba(255,255,255,0.8)" : "#9CA3AF" }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Step 2: Mood */}
      <SectionLabel step={2} label="Child's Mood Right Now" />
      <div className="grid grid-cols-4 gap-2 mb-5">
        {MOOD_OPTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all"
            style={{
              background: mood === m.id ? "#F725851A" : "white",
              borderColor: mood === m.id ? "#F72585" : "#e5e7eb",
            }}
          >
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs font-medium text-gray-700" style={{ color: mood === m.id ? "#F72585" : undefined }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Step 3: Time */}
      <SectionLabel step={3} label={`Available Time: ${timeMinutes} min`} />
      <div className="flex gap-2 mb-5 flex-wrap">
        {[15, 30, 45, 60, 90].map((t) => (
          <button
            key={t}
            onClick={() => setTimeMinutes(t)}
            className="px-4 py-2 rounded-full border-2 text-xs font-semibold transition-all"
            style={{
              background: timeMinutes === t ? "#F72585" : "white",
              color: timeMinutes === t ? "white" : "#555",
              borderColor: timeMinutes === t ? "#F72585" : "#e5e7eb",
            }}
          >
            {t} min
          </button>
        ))}
      </div>

      {/* Step 4: Materials */}
      <SectionLabel step={4} label={`Available Materials (${selectedMaterials.length} selected)`} />
      <div className="flex gap-1.5 flex-wrap mb-2">
        <button
          className="text-xs px-3 py-1.5 rounded-full border text-blue-600 border-blue-200 bg-blue-50"
          onClick={() => setSelectedMaterials(MATERIAL_OPTIONS.map((m) => m.id))}
        >
          Select All
        </button>
        <button
          className="text-xs px-3 py-1.5 rounded-full border text-gray-500 border-gray-200"
          onClick={() => setSelectedMaterials([])}
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {MATERIAL_OPTIONS.map((mat) => {
          const isSelected = selectedMaterials.includes(mat.id);
          return (
            <button
              key={mat.id}
              onClick={() => toggleMaterial(mat.id)}
              className="flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all"
              style={{
                background: isSelected ? "#F7258510" : "white",
                borderColor: isSelected ? "#F72585" : "#e5e7eb",
              }}
            >
              <span className="text-base">{mat.emoji}</span>
              <span className="text-xs font-medium truncate" style={{ color: isSelected ? "#F72585" : "#374151" }}>
                {mat.label}
              </span>
              {isSelected && <span className="ml-auto text-pink-500 flex-shrink-0 text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || selectedMaterials.length === 0}
        className="w-full py-4 rounded-2xl text-white font-bold transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #F72585, #7209B7)" }}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⚙️</span> Running AGE Algorithm...
          </span>
        ) : (
          "⚡ Generate My Daily Pack"
        )}
      </button>

      {selectedMaterials.length === 0 && (
        <p className="text-xs text-red-500 text-center mt-2">Select at least one material to generate activities.</p>
      )}
    </div>
  );
}

function SectionLabel({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0"
        style={{ background: "#F72585", fontSize: 10, fontWeight: 700 }}>
        {step}
      </span>
      <span className="text-xs font-bold text-gray-700">{label}</span>
    </div>
  );
}
