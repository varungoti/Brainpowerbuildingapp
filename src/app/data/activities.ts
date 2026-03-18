// ============================================================
// NEUROSPARK — CENTRAL ACTIVITY DATABASE + AGE ENGINE
// ============================================================

export interface Activity {
  id: string;
  name: string;
  emoji: string;
  regionEmoji: string;
  region: string;
  description: string;
  instructions: string[];
  duration: number;
  materials: string[];
  intelligences: string[];
  method: string;
  ageTiers: number[];
  difficulty: number;
  parentTip: string;
  extensionIdeas?: string[];
  moodTags?: string[]; // high, calm, focus, low
}

export const ACTIVITIES: Activity[] = [
  { id:"a01", name:"Rice Sensory Bin", emoji:"🌾", regionEmoji:"🇮🇹", region:"Western",
    description:"Fill a bowl with rice, hide 3–5 safe objects, and let baby discover through touch and sound — building neural pathways for texture discrimination.",
    instructions:["Fill a large bowl with uncooked rice","Hide 3–5 safe objects (spoon, cloth, cup)","Let child explore freely — scooping, hiding, discovering","Name each object they find","Describe textures: 'smooth', 'bumpy', 'cold'"],
    duration:8, materials:["Rice / Grains","Bowls / Plates","Spoons"],
    intelligences:["Bodily-Kinesthetic","Naturalist","Linguistic"], method:"Montessori", ageTiers:[1,2], difficulty:1,
    parentTip:"Sensory bins build neural pathways for texture discrimination. Rice mimics sand, a primitive sensory medium used across cultures.",
    moodTags:["calm","low"],
  },
  { id:"a02", name:"Peek-a-Boo Object Permanence", emoji:"👀", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Classic peek-a-boo variations to build object permanence — the cognitive foundation for all abstract thinking.",
    instructions:["Cover your face with a cloth","Say 'Where did I go?' slowly","Reveal with 'Peek-a-boo!' and big smile","Then cover a toy under the cloth","Let baby pull cloth to 'find' the toy"],
    duration:5, materials:["Blankets / Towels"],
    intelligences:["Spatial-Visual","Interpersonal","Emotional"], method:"Shichida", ageTiers:[1], difficulty:1,
    parentTip:"Object permanence peaks at 8–12 months and is the first step toward abstract thinking. Every peek-a-boo builds this circuit.",
    moodTags:["high","calm"],
  },
  { id:"a03", name:"Drum Beat Imitation", emoji:"🥁", regionEmoji:"🇩🇪", region:"Western",
    description:"Tap rhythms on pots and pans — baby imitates your beat, activating mirror neurons foundational for both music and language.",
    instructions:["Sit facing each other with pots/pans and spoons","Tap a 2-beat pattern (tap-tap)","Wait for imitation","Try 3 beats once they master 2","Celebrate every attempt enthusiastically"],
    duration:10, materials:["Cooking Pots / Lids","Spoons"],
    intelligences:["Musical-Rhythmic","Interpersonal","Bodily-Kinesthetic"], method:"Waldorf", ageTiers:[1,2], difficulty:1,
    parentTip:"Beat imitation activates mirror neurons and auditory-motor integration — the same circuits used for language learning.",
    moodTags:["high","focus"],
  },
  { id:"a04", name:"Button Counting & Sorting", emoji:"🔵", regionEmoji:"🇮🇹", region:"Western",
    description:"Sort buttons by color/size into a muffin tin — builds 1-to-1 correspondence and classification skills that predict algebra ability.",
    instructions:["Spread 20–30 buttons on the table","Place a muffin tin in front of child","Ask: 'Can you put all red buttons here?'","Count buttons together as they sort","Extend: sort by size next"],
    duration:15, materials:["Buttons","Muffin Tin"],
    intelligences:["Logical-Mathematical","Bodily-Kinesthetic","Naturalist"], method:"Montessori", ageTiers:[2,3], difficulty:2,
    parentTip:"Sorting is pre-mathematical classification. Children who sort well at 3 show stronger algebra reasoning at 7 (research: Kidd et al., 2013).",
    moodTags:["focus","calm"],
  },
  { id:"a05", name:"Emotion Face Cards", emoji:"😊", regionEmoji:"🇰🇷", region:"Korean",
    description:"Draw 6 emotion faces, match them, make them, and discuss — building the emotional vocabulary that reduces amygdala reactivity.",
    instructions:["Draw 6 simple faces: happy, sad, angry, surprised, scared, calm","Show each card and make the face yourself","Ask 'How does this face feel?'","Play matching: 'Show me how YOU feel right now'","Tell a mini-story for each emotion"],
    duration:12, materials:["Paper","Pencils / Crayons"],
    intelligences:["Emotional","Interpersonal","Linguistic"], method:"Nunchi", ageTiers:[2,3], difficulty:1,
    parentTip:"Labeling emotions reduces amygdala activation by ~50% (UCLA, Lieberman 2011). This is why 'naming it tames it' works neurologically.",
    moodTags:["calm","low"],
  },
  { id:"a06", name:"Paper Boat Origami", emoji:"⛵", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Fold a paper boat together — following sequential steps, predicting folds, and testing in water builds spatial reasoning circuits.",
    instructions:["Use any A4 paper","Fold in half lengthwise","Fold top corners down to center","Fold bottom strips up (both sides)","Open from inside to form boat","Test in a bowl of water"],
    duration:15, materials:["Paper","Bowls / Plates","Water"],
    intelligences:["Spatial-Visual","Bodily-Kinesthetic","Logical-Mathematical"], method:"Origami", ageTiers:[2,3], difficulty:2,
    parentTip:"Origami fold prediction activates parietal spatial networks. Stanford study: origami significantly improves spatial visualization and geometry scores.",
    moodTags:["focus","calm"],
  },
  { id:"a07", name:"Cup-Stacking Number Chant", emoji:"🏆", regionEmoji:"🇮🇳", region:"Indian",
    description:"Stack cups to rhythmic chanting — embodying place value through movement and sound activates the phonological loop for 25% stronger working memory.",
    instructions:["Get 10 plastic/paper cups","Chant '1!' and place one cup","Chant '2-ones make 2!' stack two cups","Build rhythm: clap on each number","Count backward while unstacking"],
    duration:10, materials:["Cups / Glasses"],
    intelligences:["Logical-Mathematical","Musical-Rhythmic","Bodily-Kinesthetic"], method:"Sthanapath", ageTiers:[2,3], difficulty:2,
    parentTip:"Rhythmic-kinesthetic number encoding activates the phonological loop AND motor cortex simultaneously — dual encoding theory shows 2× retention.",
    moodTags:["high","focus"],
  },
  { id:"a08", name:"Symmetry Fold Drawing", emoji:"🎨", regionEmoji:"🇮🇳", region:"Indian",
    description:"Fold paper, draw half a shape, unfold to reveal perfect symmetry — activating both hemispheres and strengthening corpus callosum.",
    instructions:["Fold paper in half","Draw half a butterfly/heart/face along the fold","Color it while folded","Unfold to reveal the mirror image","Discuss: 'What is symmetry?'"],
    duration:15, materials:["Paper","Pencils / Crayons"],
    intelligences:["Spatial-Visual","Creative","Logical-Mathematical"], method:"Mandala", ageTiers:[3,4], difficulty:2,
    parentTip:"Bilateral drawing exercises activate both hemispheres simultaneously, strengthening corpus callosum connectivity (key for integrative thinking).",
    moodTags:["calm","focus"],
  },
  { id:"a09", name:"Vedic Finger Multiplication", emoji:"✋", regionEmoji:"🇮🇳", region:"Indian",
    description:"Use finger patterns to instantly calculate 6×6 through 10×10 — no memorization needed, just visual-spatial pattern recognition.",
    instructions:["Hold both hands up","For 7×8: fold 2 fingers left hand, 3 fingers right hand","Count folded fingers: 2+3=5 (tens place = 50)","Count raised fingers: 3×2=6 (ones place)","Answer: 56! Check: 7×8=56 ✓"],
    duration:15, materials:[],
    intelligences:["Logical-Mathematical","Bodily-Kinesthetic","Spatial-Visual"], method:"Vedic Mathematics", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Vedic finger math bypasses rote memorization entirely — research shows 40% faster calculation speed and lower math anxiety than drill methods.",
    moodTags:["focus","high"],
  },
  { id:"a10", name:"Sound Sorting Phonics Game", emoji:"🔊", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Sort household objects by starting sound — the #1 predictor of reading success, active during the 5–6 year critical window.",
    instructions:["Collect 10 small objects from around the house","Say each object name clearly","Sort into groups by first sound: B-sounds, C-sounds...","Stretch the first sound: 'Bbb-all', 'Ccc-up'","Find more objects in the room with same sounds"],
    duration:20, materials:["Stones / Pebbles","Dried Leaves"],
    intelligences:["Linguistic","Logical-Mathematical","Naturalist"], method:"Kumon", ageTiers:[3,4], difficulty:2,
    parentTip:"Phonemic awareness is the single strongest predictor of early reading success. Age 5–6 is the most critical window. This one activity is high-leverage.",
    moodTags:["focus","calm"],
  },
  { id:"a11", name:"Egg-Carton Abacus Math", emoji:"🧮", regionEmoji:"🇨🇳", region:"Chinese",
    description:"Build a physical abacus with an egg carton and beans — creates a 'mental abacus' image that 3× speeds mental arithmetic.",
    instructions:["Get an egg carton and dried beans","Each slot = one position (ones, tens...)","Place beans to represent a number (e.g. 47)","Add a second number by placing more beans","Move beans to carry tens — visualize"],
    duration:20, materials:["Egg Cartons","Dried Beans / Lentils"],
    intelligences:["Logical-Mathematical","Spatial-Visual","Executive Function"], method:"Abacus (Suanpan)", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Journal of Neuroscience: Abacus users show enlarged right-hemisphere parietal regions and 3× faster mental arithmetic. This builds a permanent cognitive tool.",
    moodTags:["focus","high"],
  },
  { id:"a12", name:"Bar Model Word Problems", emoji:"📐", regionEmoji:"🇰🇷", region:"Korean",
    description:"Draw rectangular bars to visualize word problems — Singapore/Korea's #1 pedagogical tool behind their consistent PISA math rankings.",
    instructions:["Read a problem: 'Sam has 28 apples, gives 12. How many left?'","Draw a long bar for total (28)","Mark a section for 'given away' (12)","The remaining section = answer","Write equation from the bar: 28–12=?"],
    duration:20, materials:["Paper","Pencils / Crayons","Ruler"],
    intelligences:["Logical-Mathematical","Spatial-Visual","Linguistic"], method:"Bar Modeling", ageTiers:[4,5], difficulty:3,
    parentTip:"Bar modeling bridges Bruner's Concrete→Pictorial→Abstract stages. Singapore's consistent #1 PISA math ranking is directly linked to this method.",
    moodTags:["focus","calm"],
  },
  { id:"a13", name:"Mini-Go Territory Game", emoji:"⚫", regionEmoji:"🇨🇳", region:"Chinese",
    description:"Play mini-Go on a 5×5 grid — strategy planning activates prefrontal circuits identical to those used in complex executive decision-making.",
    instructions:["Draw a 5×5 grid on paper (dots at intersections)","Use dark and light stones/buttons as pieces","Take turns placing on intersections","Surround opponent's pieces to capture them","Most territory at end wins — plan 3 moves ahead!"],
    duration:25, materials:["Stones / Pebbles","Bottle Caps","Paper"],
    intelligences:["Logical-Mathematical","Spatial-Visual","Executive Function"], method:"Go (Weiqi)", ageTiers:[4,5], difficulty:4,
    parentTip:"Korean studies show regular Go training improves IQ and attention by measurable margins. Go trains deeper planning circuits than chess.",
    moodTags:["focus","calm"],
  },
  { id:"a14", name:"Leitner Spaced Repetition Box", emoji:"🗂️", regionEmoji:"🌍", region:"Western",
    description:"Build a 5-box self-correcting flashcard system — exploiting the forgetting curve for 200% better long-term retention.",
    instructions:["Label 5 small boxes: Daily, 2-day, 4-day, 8-day, 16-day","Write facts/words on homemade cards","Start all cards in Box 1 (review daily)","Correct cards move to next box","Wrong answers return to Box 1"],
    duration:25, materials:["Paper","Pencils / Crayons"],
    intelligences:["Executive Function","Linguistic","Logical-Mathematical"], method:"Spaced Repetition", ageTiers:[4,5], difficulty:3,
    parentTip:"Spaced repetition produces 200% better retention than re-reading (Cepeda et al., 2006). Used by memory champions and medical students worldwide.",
    moodTags:["focus","calm"],
  },
  { id:"a15", name:"Modular Origami Star", emoji:"⭐", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Fold 6 identical modules and assemble them into a 3D star — predicting 3D geometry from 2D instructions activates engineering-level spatial circuits.",
    instructions:["Fold 6 small paper squares into 'units' (triangle pockets)","Each fold creates a locking tab","Insert tabs into pockets to connect","Form a star shape as you connect all 6","Test strength and symmetry"],
    duration:30, materials:["Paper"],
    intelligences:["Spatial-Visual","Logical-Mathematical","Creative"], method:"Origami", ageTiers:[5], difficulty:5,
    parentTip:"Modular origami activates the same spatial circuits used in architecture, engineering, and surgery. Stanford curriculum now uses it.",
    moodTags:["focus","calm"],
  },
  { id:"a16", name:"Unplugged Robot Coding", emoji:"🤖", regionEmoji:"🌍", region:"Western",
    description:"Write step-by-step commands to move a 'robot' (parent/sibling) through a floor maze — debugging real code without a screen.",
    instructions:["Tape a simple maze on the floor","Write command cards: FORWARD, TURN LEFT, TURN RIGHT","Child writes a sequence of commands on paper","Parent follows exactly (robot-style, no thinking!)","Debug: where did the robot go wrong? Fix it!"],
    duration:30, materials:["Tape","Paper","Pencils / Crayons"],
    intelligences:["Logical-Mathematical","Executive Function","Linguistic"], method:"Computational Thinking", ageTiers:[4,5], difficulty:4,
    parentTip:"Computational thinking is the ability to break problems into executable steps. This activity builds debugging mindset — a core 21st-century meta-skill.",
    moodTags:["focus","high"],
  },
  { id:"a17", name:"Barefoot Texture Walk", emoji:"👣", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Walk barefoot over 5 different natural surfaces outdoors — grounding reduces cortisol 16% and improves sensory integration.",
    instructions:["Remove shoes and socks","Walk slowly on: grass, soil, pavement, gravel, stone","Name each texture: warm, prickly, soft, rough, cold","Draw a map of the walk with texture notes","Collect one natural item from each surface"],
    duration:15, materials:["Garden space / Sidewalk","Paper"],
    intelligences:["Naturalist","Bodily-Kinesthetic","Intrapersonal"], method:"Shinrin-yoku", ageTiers:[1,2,3,4,5], difficulty:1,
    parentTip:"Barefoot outdoor contact (grounding/earthing) reduces cortisol by 16% and improves sensory integration. Works for all ages including very young children.",
    moodTags:["high","low","calm"],
  },
  { id:"a18", name:"5-Senses Scavenger Hunt", emoji:"🌿", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Find nature items using each of the 5 senses — improves directed attention by 20% and emotional regulation through nature exposure.",
    instructions:["Create a list: find something ROUGH, SWEET-SMELLING, COLORFUL, MAKES A SOUND, TINY","Go outside (garden, park, courtyard)","Find and observe each item","Draw them in a 'nature journal'","Share 3 surprising discoveries"],
    duration:20, materials:["Garden space / Sidewalk","Paper","Pencils / Crayons"],
    intelligences:["Naturalist","Linguistic","Intrapersonal"], method:"Forest School / Shinrin-yoku", ageTiers:[2,3,4,5], difficulty:2,
    parentTip:"University of Michigan: nature exposure improves directed attention by 20%. Works even in urban courtyards with minimal green space.",
    moodTags:["high","low","calm"],
  },
  { id:"a19", name:"Water Brush Calligraphy", emoji:"🖌️", regionEmoji:"🇨🇳", region:"Chinese",
    description:"Use a wet brush on dark paper — slow deliberate strokes build cerebellar fine-motor circuits that improve handwriting 30% faster than practice sheets.",
    instructions:["Wet a paintbrush or cloth with water","Use dark paper, slate, or a dark-colored plate","Practice slow deliberate strokes: horizontal, vertical, curved","Copy simple shapes or letters","Watch strokes slowly disappear — re-do them"],
    duration:15, materials:["Water","Paper","Spoons"],
    intelligences:["Bodily-Kinesthetic","Spatial-Visual","Intrapersonal"], method:"Chinese Calligraphy", ageTiers:[2,3,4,5], difficulty:2,
    parentTip:"Slow deliberate stroke practice builds cerebellar fine-motor circuits. Research shows calligraphy improves handwriting quality 30% faster than worksheet drills.",
    moodTags:["calm","low"],
  },
  { id:"a20", name:"Animal Pose Yoga Story", emoji:"🦁", regionEmoji:"🇮🇳", region:"Indian",
    description:"A 5-pose yoga sequence woven into a story — Harvard study shows 12 min/day improves attention span 32% in children.",
    instructions:["Create a story: 'The lion met a cat, who jumped like a dog...'","Lion pose: stick tongue out wide","Cat pose: arch back on hands and knees","Dog pose: downward dog","Tree pose: balance on one leg","Child's pose: sleeping bear rest"],
    duration:12, materials:["Blankets / Towels"],
    intelligences:["Bodily-Kinesthetic","Linguistic","Intrapersonal","Creative"], method:"Yoga & Pranayama", ageTiers:[1,2,3,4,5], difficulty:1,
    parentTip:"Harvard Medical School: 10–15 min yoga daily improves children's attention span by 32%. The story framing makes it intrinsically motivating for all ages.",
    moodTags:["high","calm","low"],
  },
  { id:"a21", name:"Breath Counting Meditation", emoji:"🧘", regionEmoji:"🇮🇳", region:"Indian",
    description:"Count breaths to 10, restart on losing count — trains prefrontal inhibitory control, the executive skill most predictive of life outcomes.",
    instructions:["Sit comfortably with eyes closed","Count breaths silently: 1-in, 2-out, 3-in...","When you reach 10, start again at 1","If you lose count, gently return to 1 (no frustration!)","Do 3 full cycles (about 3 minutes)"],
    duration:5, materials:[],
    intelligences:["Intrapersonal","Executive Function","Emotional"], method:"Yoga & Pranayama", ageTiers:[3,4,5], difficulty:2,
    parentTip:"Even 5 minutes of breath-focused attention daily thickens the prefrontal cortex. This is the same skill taught in mindfulness-based stress reduction (MBSR).",
    moodTags:["calm","low"],
  },
  { id:"a22", name:"Flashcard Speed-Flip Game", emoji:"⚡", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Flash homemade image cards at 0.5-second intervals — activates right-hemisphere holistic processing, the basis of photographic memory.",
    instructions:["Make 10 simple image cards (draw: sun, tree, cup, star...)","Flash each card for 0.5 seconds (count '1-and')","After all 10, ask child to recall as many as possible","Play again — can they remember more?","Progress: add 5 more cards each week"],
    duration:10, materials:["Paper","Pencils / Crayons"],
    intelligences:["Spatial-Visual","Linguistic","Creative"], method:"Shichida Method", ageTiers:[1,2,3], difficulty:2,
    parentTip:"The Shichida Method's core is 'right-brain flash training' during the 0–6 year critical window. Proven gains in visual memory and pattern recognition.",
    moodTags:["focus","high"],
  },
  { id:"a23", name:"Mistake Celebration Journal", emoji:"🎉", regionEmoji:"🇺🇸", region:"Western",
    description:"Draw today's mistake + what you learned — rewires attribution from failure to growth, the #1 predictor of academic persistence.",
    instructions:["Ask: 'What didn't work today?'","Draw the mistake (stick figures fine!)","Write/say: 'What did my brain learn?'","Say together: 'My brain grew today!'","Add a star sticker (or draw one)"],
    duration:10, materials:["Paper","Pencils / Crayons"],
    intelligences:["Intrapersonal","Executive Function","Emotional"], method:"Growth Mindset", ageTiers:[3,4,5], difficulty:1,
    parentTip:"Carol Dweck's 20-year Stanford research: process-praising children show 30% higher academic achievement gains. This is that process, ritualized.",
    moodTags:["calm","low"],
  },
  { id:"a24", name:"Loose Parts Construction", emoji:"🏗️", regionEmoji:"🇮🇹", region:"Western",
    description:"Build something — anything — with a random collection of natural and household objects. Divergent thinking peak is ages 3–8; this activity captures it.",
    instructions:["Collect 15–20 loose parts: stones, sticks, buttons, cloth, cups","Say: 'Build anything you imagine!'","Parent does NOT suggest or correct","Photograph/observe what gets created","Ask: 'Tell me about your creation'"],
    duration:20, materials:["Stones / Pebbles","Buttons","Cups / Glasses","Dried Leaves"],
    intelligences:["Creative","Spatial-Visual","Bodily-Kinesthetic","Existential"], method:"Reggio Emilia", ageTiers:[2,3,4], difficulty:1,
    parentTip:"Reggio Emilia's '100 languages' principle: children think in materials, not just words. Unstructured construction is where highest creative divergence occurs.",
    moodTags:["high","calm"],
  },
  { id:"a25", name:"Shadow Story Puppets", emoji:"🎭", regionEmoji:"🇮🇹", region:"Western",
    description:"Use a torch and hand shadows to tell a 3-act story — combines narrative cognition, spatial reasoning, and emotional storytelling.",
    instructions:["Darken the room; hold a torch/flashlight against a wall","Practice hand shadow animals: rabbit, duck, bird","Create a 3-act story: problem → adventure → resolution","Child narrates while you make shadows (or swap roles)","Add object shadows too (cup = mountain)"],
    duration:20, materials:["Torch / Flashlight"],
    intelligences:["Linguistic","Creative","Spatial-Visual","Emotional"], method:"Reggio Emilia", ageTiers:[2,3,4,5], difficulty:2,
    parentTip:"Story structure (exposition-conflict-resolution) is the fundamental cognitive scaffold for reading comprehension and social cognition (Theory of Mind).",
    moodTags:["calm","high"],
  },
];

// ─── Supporting Data ──────────────────────────────────────────────────────────
export const MATERIAL_OPTIONS = [
  { id:"paper",     label:"Paper",            emoji:"📄", dbName:"Paper" },
  { id:"pencils",   label:"Pencils/Crayons",  emoji:"✏️", dbName:"Pencils / Crayons" },
  { id:"cups",      label:"Cups",             emoji:"🥤", dbName:"Cups / Glasses" },
  { id:"bowls",     label:"Bowls/Plates",     emoji:"🥣", dbName:"Bowls / Plates" },
  { id:"spoons",    label:"Spoons",           emoji:"🥄", dbName:"Spoons" },
  { id:"pots",      label:"Pots & Lids",      emoji:"🍳", dbName:"Cooking Pots / Lids" },
  { id:"rice",      label:"Rice/Grains",      emoji:"🌾", dbName:"Rice / Grains" },
  { id:"beans",     label:"Beans/Lentils",    emoji:"🫘", dbName:"Dried Beans / Lentils" },
  { id:"buttons",   label:"Buttons",          emoji:"🔵", dbName:"Buttons" },
  { id:"stones",    label:"Stones/Pebbles",   emoji:"🪨", dbName:"Stones / Pebbles" },
  { id:"eggtray",   label:"Egg Carton",       emoji:"🥚", dbName:"Egg Cartons" },
  { id:"muffin",    label:"Muffin Tin",       emoji:"🧁", dbName:"Muffin Tin" },
  { id:"blanket",   label:"Blankets/Towels",  emoji:"🛏️", dbName:"Blankets / Towels" },
  { id:"tape",      label:"Tape",             emoji:"🩹", dbName:"Tape" },
  { id:"ruler",     label:"Ruler",            emoji:"📏", dbName:"Ruler" },
  { id:"water",     label:"Water",            emoji:"💧", dbName:"Water" },
  { id:"outdoor",   label:"Outdoor Space",    emoji:"🌿", dbName:"Garden space / Sidewalk" },
  { id:"torch",     label:"Torch/Flashlight", emoji:"🔦", dbName:"Torch / Flashlight" },
  { id:"leaves",    label:"Leaves/Twigs",     emoji:"🍃", dbName:"Dried Leaves" },
  { id:"bottlecap", label:"Bottle Caps",      emoji:"🪙", dbName:"Bottle Caps" },
];

export const AGE_TIER_CONFIG = [
  { tier:0, label:"3–12 mo",   emoji:"🌸", color:"#FF6B9D", desc:"Blossom"  },
  { tier:1, label:"1–2 years",  emoji:"🌱", color:"#06D6A0", desc:"Seedling" },
  { tier:2, label:"3–4 years",  emoji:"🌿", color:"#2DC653", desc:"Sprout"   },
  { tier:3, label:"5–6 years",  emoji:"🌳", color:"#FFB703", desc:"Sapling"  },
  { tier:4, label:"7–8 years",  emoji:"🌲", color:"#FB5607", desc:"Branch"   },
  { tier:5, label:"9–10 years", emoji:"🏔️", color:"#4361EE", desc:"Forest"   },
];

/** Safe lookup — always returns a valid tier config (falls back to tier 1) */
export function getAgeTierConfig(tier: number) {
  return AGE_TIER_CONFIG.find(t => t.tier === tier) ?? AGE_TIER_CONFIG[1];
}

export const MOOD_OPTIONS = [
  { id:"focus", label:"Focused",    emoji:"🎯", boost:"Executive Function" },
  { id:"high",  label:"High Energy",emoji:"⚡", boost:"Bodily-Kinesthetic" },
  { id:"calm",  label:"Calm",       emoji:"😌", boost:"Intrapersonal"      },
  { id:"low",   label:"Tired",      emoji:"😴", boost:"Naturalist"         },
];

export const INTEL_COLORS: Record<string, string> = {
  "Linguistic":             "#4361EE",
  "Logical-Mathematical":   "#3A0CA3",
  "Spatial-Visual":         "#7209B7",
  "Musical-Rhythmic":       "#F72585",
  "Bodily-Kinesthetic":     "#FB5607",
  "Interpersonal":          "#06D6A0",
  "Intrapersonal":          "#118AB2",
  "Naturalist":             "#2DC653",
  "Existential":            "#6B4FBB",
  "Emotional":              "#E63946",
  "Creative":               "#FFB703",
  "Executive Function":     "#14213D",
  "Digital-Technological":  "#0077B6",
  "Pronunciation":          "#FF6B9D",
  "Coordination":           "#FFD166",
};

// ─── AGE Algorithm ─────────────────────────────────────────────────────────────
export function runAGE(
  tier: number,
  selectedMaterials: string[],
  mood: string,
  timeMinutes: number,
  recentActivityIds: string[] = [],
): Activity[] {
  const matDbNames = MATERIAL_OPTIONS
    .filter(m => selectedMaterials.includes(m.id))
    .map(m => m.dbName.toLowerCase());
  // Always allow no-material activities
  const canDo = (act: Activity) => {
    if (act.materials.length === 0) return true;
    return act.materials.every(m =>
      matDbNames.some(db => db.includes(m.toLowerCase().split(" ")[0]) || m.toLowerCase().includes(db.split(" ")[0]))
    );
  };
  const eligible = ACTIVITIES.filter(a => a.ageTiers.includes(tier) && canDo(a));
  if (!eligible.length) return [];

  const scored = eligible.map(act => {
    let score = 50;
    if (act.ageTiers[0] === tier) score += 15;
    if (act.moodTags?.includes(mood)) score += 20;
    const moodBoost = MOOD_OPTIONS.find(m => m.id === mood)?.boost ?? "";
    if (act.intelligences.includes(moodBoost)) score += 12;
    const idealDiff = Math.min(tier + 1, 5);
    score -= Math.abs(act.difficulty - idealDiff) * 5;
    if (!recentActivityIds.includes(act.id)) score += 10;
    score += act.materials.length * 2;
    score += Math.random() * 18;
    return { act, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const pack: Activity[] = [];
  const coveredIntel = new Set<string>();
  const usedRegions = new Map<string, number>();
  let totalDur = 0;
  const target = tier === 1 ? 2 : tier <= 2 ? 3 : tier === 3 ? 4 : 5;

  for (const { act } of scored) {
    if (pack.length >= target) break;
    if (totalDur + act.duration > timeMinutes + 15) continue;
    const regionCount = usedRegions.get(act.region) ?? 0;
    if (regionCount >= 2) continue;
    const newIntel = act.intelligences.filter(i => !coveredIntel.has(i)).length;
    if (newIntel === 0 && pack.length >= 2) continue;
    pack.push(act);
    act.intelligences.forEach(i => coveredIntel.add(i));
    usedRegions.set(act.region, regionCount + 1);
    totalDur += act.duration;
  }
  return pack;
}

export function getAgeTierFromDob(dob: string): number {
  const birth = new Date(dob);
  const now   = new Date();
  if (isNaN(birth.getTime())) return 1; // guard corrupt DOB
  const months = (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 12) return 0;            // 3–12 months → tier 0 (Blossom)
  const years = months / 12;
  if (years < 3) return 1;
  if (years < 5) return 2;
  if (years < 7) return 3;
  if (years < 9) return 4;
  return 5;
}