// ============================================================
// NEUROSPARK — CENTRAL ACTIVITY DATABASE + AGE ENGINE
// ============================================================

import { MILESTONES } from "./milestones";
import type { OutcomePillar } from "./outcomeChecklist";

export interface ActivityDurationVariants {
  quick: number;
  standard: number;
  stretch: number;
}

export interface ActivityProgression {
  programId: string;
  stage: number;
  nextActivityIds: string[];
}

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
  /** Pedagogy tags, e.g. `ai-literacy`, `dual-task` — used by AGE + parent copy */
  skillTags?: string[];
  mechanismTags?: string[];
  contraindications?: string[];
  durationVariants?: ActivityDurationVariants;
  goalPillars?: OutcomePillar[];
  milestoneIds?: string[];
  reviewStatus?: "draft" | "reviewed";
  progression?: ActivityProgression;
  collaborationType?: "parallel" | "sequential" | "joint";
  siblingRoles?: { younger: string; older: string };
  sensoryTags?: string[];
  sensoryModifications?: Record<string, { instructions: string[]; materials: string[] }>;
  parentCoaching?: { keyInteractions: string[]; deepeningTips: string[]; observeFor: string[] };
  seasonalTags?: string[];
  voiceNarrationHint?: string;
}

const RAW_ACTIVITIES: Activity[] = [
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
    skillTags:["dual-task"],
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
    skillTags:["dual-task","ai-literacy"],
  },
  { id:"a17", name:"Barefoot Texture Walk", emoji:"👣", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Walk barefoot over 5 different natural surfaces outdoors — grounding reduces cortisol 16% and improves sensory integration.",
    instructions:["Remove shoes and socks","Walk slowly on: grass, soil, pavement, gravel, stone","Name each texture: warm, prickly, soft, rough, cold","Draw a map of the walk with texture notes","Collect one natural item from each surface"],
    duration:15, materials:["Garden space / Sidewalk","Paper"],
    intelligences:["Naturalist","Bodily-Kinesthetic","Intrapersonal"], method:"Shinrin-yoku", ageTiers:[1,2,3,4,5], difficulty:1,
    parentTip:"Barefoot outdoor contact (grounding/earthing) reduces cortisol by 16% and improves sensory integration. Works for all ages including very young children.",
    moodTags:["high","low","calm"],
    skillTags:["dual-task"],
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
    skillTags:["dual-task"],
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
  { id:"a26", name:"Slow News Detective", emoji:"📰", regionEmoji:"🌍", region:"Western",
    description:"You invent 3 silly headlines and 1 plausible one — your child sorts fact-style vs joke, then you discuss how you'd check a real headline (ask a grown-up, look at 2 sources). No apps required.",
    instructions:["Write 4 short headlines on paper — 3 clearly silly, 1 believable","Read them slowly; child points: 'silly' or 'maybe real'","For the believable one, ask: 'How would we double-check?'","Together name 2 safe steps: parent search, library book, teacher","Reinforce: smart humans always verify before sharing"],
    duration:15, materials:["Paper","Pencils / Crayons"],
    intelligences:["Digital-Technological","Linguistic","Executive Function"], method:"Media Literacy (unplugged)", ageTiers:[3,4,5], difficulty:2,
    parentTip:"Calibration and verification are human-complementary skills in an AI-heavy world. Keep it playful — you're building habits, not cynicism.",
    moodTags:["focus","calm"],
    skillTags:["ai-literacy"],
  },
  { id:"a27", name:"Robot Chef Instructions", emoji:"🥪", regionEmoji:"🇮🇳", region:"Indian",
    description:"Child writes exact steps to make a simple snack. You follow like a literal robot first (funny mistakes!), then repeat with 'smart human' clarifying questions — shows why precise language matters for people and tools.",
    instructions:["Pick a snack you can make together (e.g. buttered toast)","Round 1: parent follows child's steps EXACTLY — no fixing","Laugh at gaps; child revises the list","Round 2: parent asks one clarifying question per step","Compare: which instructions worked better?"],
    duration:20, materials:["Paper","Pencils / Crayons","Spoons"],
    intelligences:["Linguistic","Logical-Mathematical","Bodily-Kinesthetic"], method:"Human–Tool Communication", ageTiers:[2,3,4,5], difficulty:2,
    parentTip:"This mirrors how we prompt AI: specific steps beat vague wishes. Emphasize teamwork with tools, not fear of them.",
    moodTags:["high","focus"],
    skillTags:["ai-literacy"],
  },
  { id:"a28", name:"What Would a Robot Miss?", emoji:"🖼️", regionEmoji:"🇰🇷", region:"Korean",
    description:"Use your child's drawing or photo of a family moment. Ask what a stranger (or pretend 'robot brain') might get wrong without context — practice empathy, detail, and limits of remote guesses.",
    instructions:["Show yesterday's drawing or take a new silly photo together","Ask: 'If someone only saw this picture, what might they guess wrong?'","List 3 feelings or facts the picture doesn't show","Close: 'That's why we ask people, not only tools, about feelings'"],
    duration:12, materials:["Paper","Pencils / Crayons"],
    intelligences:["Creative","Intrapersonal","Linguistic"], method:"Perspective Taking", ageTiers:[3,4,5], difficulty:2,
    parentTip:"Grounds 'AI era' skills in emotional truth: tools lack lived context; humans supply meaning and care.",
    moodTags:["calm","focus"],
    skillTags:["ai-literacy"],
  },
  { id:"a29", name:"Two-Question Rule", emoji:"❓", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Introduce a family rule: after any surprising 'fact' (from a show, friend, or voice assistant), pause for two check questions — Who said it? How could we verify? Role-play examples.",
    instructions:["Explain: 'Two questions before we believe something big'","Brainstorm check questions: Who? Where did they learn it? Can we look in a book?","Role-play: you say a wild 'fact'; child asks two questions","Pick one topic to verify together with a book or trusted adult"],
    duration:15, materials:["Paper","Pencils / Crayons"],
    intelligences:["Executive Function","Linguistic","Interpersonal"], method:"Inquiry Habits", ageTiers:[4,5], difficulty:3,
    parentTip:"You're installing a lightweight epistemic immune system — curiosity + verification without scare tactics.",
    moodTags:["focus","calm"],
    skillTags:["ai-literacy"],
  },

  // ─── Tier 0–1: Baby & Toddler (new) ───────────────────────────────────────
  { id:"a30", name:"Mirror Face Conversations", emoji:"🪞", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Hold baby in front of a mirror and animate facial expressions together — activates mirror-neuron circuitry and face-processing regions months before language.",
    instructions:["Hold baby 20–30 cm from a mirror","Make a big smile, wait 3 seconds for response","Try surprised, sad, and silly faces","Name each expression out loud: 'Happy!'","Touch baby's reflection, then baby's cheek — say 'You!'"],
    duration:7, materials:[],
    intelligences:["Interpersonal","Emotional","Linguistic"], method:"Shichida", ageTiers:[0,1], difficulty:1,
    parentTip:"Face-selective neurons in the fusiform area fire from birth. Mirror conversations during 0–6 months accelerate face recognition 40% (Farroni et al., 2002).",
    moodTags:["calm","high"],
  },
  { id:"a31", name:"High-Contrast Card Gazing", emoji:"🔲", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Show baby black-and-white high-contrast patterns for 30-second gaze sessions — optimally stimulating the primary visual cortex during peak myelination.",
    instructions:["Print or draw 5 high-contrast patterns: checkerboard, spiral, bull's-eye, stripes, face","Hold each 25–30 cm from baby's face","Wait for sustained gaze (10+ seconds)","Slowly move the card left/right for tracking practice","Swap cards when gaze breaks"],
    duration:8, materials:["Paper","Pencils / Crayons"],
    intelligences:["Spatial-Visual","Logical-Mathematical"], method:"Shichida", ageTiers:[0], difficulty:1,
    parentTip:"Newborn visual acuity is ~20/400. High-contrast patterns are the only stimuli reliably visible. Each 30-second gaze session builds 1,000+ new visual cortex synapses.",
    moodTags:["calm","low"],
  },
  { id:"a32", name:"Belly Tummy Time Song", emoji:"🎵", regionEmoji:"🇮🇳", region:"Indian",
    description:"Place baby on tummy and sing rhythmically while encouraging head lifts — builds neck, core, and vestibular circuitry foundational for crawling and balance.",
    instructions:["Place baby on tummy on a firm surface","Get eye-level in front of baby","Sing a slow rhythmic song: 'Up, up, look at me!'","Hold a colourful object just above eye level","Reward every head lift with enthusiastic praise"],
    duration:5, materials:["Blankets / Towels"],
    intelligences:["Bodily-Kinesthetic","Coordination","Musical-Rhythmic"], method:"Yoga & Pranayama", ageTiers:[0,1], difficulty:1,
    parentTip:"Tummy time is neurologically critical. Each session builds proprioception in the neck, activates vestibular pathways, and is the single strongest predictor of crawling age.",
    moodTags:["high","calm"],
  },
  { id:"a33", name:"Water Table Splash Lab", emoji:"💦", regionEmoji:"🇸🇪", region:"Scandinavian",
    description:"Fill a shallow basin with water and give baby/toddler cups and spoons — tactile and cause-effect exploration building early physics intuition.",
    instructions:["Fill a bowl or container with 3–4 cm of water","Give small cups, spoons, and a sponge","Let child pour, splash, and experiment freely","Narrate: 'Water goes IN the cup. Now tip it OUT'","Squeeze the sponge: 'Full — squeeze — empty!'"],
    duration:12, materials:["Bowls / Plates","Spoons","Water"],
    intelligences:["Logical-Mathematical","Bodily-Kinesthetic","Naturalist"], method:"Reggio Emilia", ageTiers:[0,1,2], difficulty:1,
    parentTip:"Water play at 6–18 months builds cause-and-effect understanding (Piaget's sensorimotor stage). Early physics intuition strongly predicts STEM interest at 6–8 years.",
    moodTags:["high","calm"],
  },
  { id:"a34", name:"Texture Treasure Basket", emoji:"🧺", regionEmoji:"🇬🇧", region:"Scandinavian",
    description:"Fill a basket with 8–10 safe objects of different textures — Elinor Goldschmied's Heuristic Play approach that builds tactile discrimination and early object classification.",
    instructions:["Gather 8–10 safe household objects: wooden spoon, small cloth, metal spoon, brush, sponge, shell, cork, small ball","Place in a low basket baby can reach into","Let baby explore freely for up to 20 minutes (supervised)","Don't direct — observe and name objects baby picks up","Rotate objects weekly to maintain novelty"],
    duration:15, materials:["Spoons","Blankets / Towels","Bowls / Plates"],
    intelligences:["Naturalist","Bodily-Kinesthetic","Spatial-Visual"], method:"Montessori", ageTiers:[0,1], difficulty:1,
    parentTip:"Treasure baskets provide 100x more tactile input than commercial toys. Elinor Goldschmied's research shows significantly richer object concepts at 12 months vs toy-only play.",
    moodTags:["calm","low"],
  },
  { id:"a35", name:"Clap-Pat Rhythm Game", emoji:"👏", regionEmoji:"🇮🇳", region:"Indian",
    description:"Clap-pat sequences build temporal patterning — the auditory-motor link underlying both music and grammar acquisition.",
    instructions:["Sit facing toddler and clap twice, then pat knees twice","Say 'Clap clap, pat pat!' in a steady beat","Encourage imitation — celebrate any attempt","Extend: add a snap or tap the table","Build a clap-pat-stamp routine"],
    duration:8, materials:[],
    intelligences:["Musical-Rhythmic","Bodily-Kinesthetic","Executive Function"], method:"Sthanapath", ageTiers:[0,1,2], difficulty:1,
    parentTip:"Rhythmic clapping sequences activate cerebellar-cortical timing circuits — the same networks used for reading rhythm and grammatical processing (Kotz et al., 2018).",
    moodTags:["high","focus"],
  },

  // ─── Tier 1–2: Toddler–Preschool (new) ────────────────────────────────────
  { id:"a36", name:"Shape Safari Walk", emoji:"🔷", regionEmoji:"🇮🇳", region:"Indian",
    description:"Walk around the home finding circles, squares, triangles — embodied geometry learning activates both visual-spatial and linguistic brain regions simultaneously.",
    instructions:["Announce: 'We're going on a shape safari!'","Find a circle: clock, plate, wheel","Find a square: window, tile, book cover","Find a triangle: slice of pizza, door triangle","Draw or photograph each discovery — make a shape map"],
    duration:15, materials:["Paper","Pencils / Crayons"],
    intelligences:["Spatial-Visual","Logical-Mathematical","Linguistic"], method:"Montessori", ageTiers:[1,2,3], difficulty:1,
    parentTip:"Children who can identify and name geometric shapes at age 3 show 28% stronger mathematics reasoning at age 7 (Verdine et al., 2017, PLOS ONE).",
    moodTags:["high","focus"],
  },
  { id:"a37", name:"Story Stone Sequencing", emoji:"🪨", regionEmoji:"🇮🇹", region:"Western",
    description:"Paint or draw simple characters on stones and use them to retell or invent stories — Reggio Emilia's approach to narrative as a 'hundred language' of the child.",
    instructions:["Collect 5–6 smooth stones (or use paper cut-outs)","Draw or paint a simple character on each: person, house, tree, sun, animal, cloud","Place stones randomly and ask: 'Can you tell me a story?'","Prompt: 'What happens first? Then what?'","Retell the story changing one stone"],
    duration:20, materials:["Stones / Pebbles","Paper","Pencils / Crayons"],
    intelligences:["Linguistic","Creative","Existential"], method:"Reggio Emilia", ageTiers:[1,2,3], difficulty:2,
    parentTip:"Story sequencing activates Broca's area and the hippocampal narrative system simultaneously. Children who sequence stories at 3 score significantly higher on reading comprehension at 7.",
    moodTags:["calm","focus"],
  },
  { id:"a38", name:"Sorting & Classifying Kitchen Lab", emoji:"🫙", regionEmoji:"🇮🇹", region:"Western",
    description:"Sort pasta, beans, and grains into muffin tins by colour, size, and shape — pure Montessori classification that builds abstract category thinking.",
    instructions:["Gather 3–4 types of pasta, beans, or coloured buttons","Place a small muffin tin in front of child","Say: 'Can you sort these by colour?'","Then try by size: 'Small ones here, big ones there'","Finally mix criteria: 'Small AND red things go here'"],
    duration:12, materials:["Muffin Tin","Dried Beans / Lentils","Egg Cartons"],
    intelligences:["Logical-Mathematical","Naturalist","Bodily-Kinesthetic"], method:"Montessori", ageTiers:[1,2,3], difficulty:1,
    parentTip:"Classification at the concrete level is the foundation for all abstract categorisation — from grammar to taxonomy to algebra. Age 2–4 is the critical window.",
    moodTags:["focus","calm"],
  },
  { id:"a39", name:"Singing Map Directions", emoji:"🗺️", regionEmoji:"🇰🇷", region:"Korean",
    description:"Draw a simple home map and navigate using sung directions — fusing spatial mapping with musical encoding for dual-register memory consolidation.",
    instructions:["Draw a simple top-down map of one room with furniture","Sing directions: '♪ Walk to the red chair, turn left, and stop!♪'","Child follows the sung route","Swap: child gives sung directions, parent follows","Add a treasure at the destination"],
    duration:15, materials:["Paper","Pencils / Crayons"],
    intelligences:["Spatial-Visual","Musical-Rhythmic","Linguistic"], method:"Nunchi", ageTiers:[2,3,4], difficulty:2,
    parentTip:"Spatial encoding set to melody is retained 2× longer than verbal-only instructions (Thaut et al., 2014). Navigation tasks develop the hippocampus and parahippocampal place area.",
    moodTags:["high","focus"],
  },
  { id:"a40", name:"Cloud Watching Narration", emoji:"☁️", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Lie outside and narrate cloud shapes for 10 minutes — training imaginative projection, descriptive language, and focused attention in a calm natural setting.",
    instructions:["Find a grassy outdoor spot and lie on your backs","Look up and wait for the first cloud shape","Name it: 'I see a rabbit! Its ear is that wispy bit'","Take turns: child narrates next cloud","Count clouds that pass in 2 minutes"],
    duration:10, materials:["Garden space / Sidewalk","Blankets / Towels"],
    intelligences:["Creative","Linguistic","Naturalist"], method:"Shinrin-yoku", ageTiers:[2,3,4,5], difficulty:1,
    parentTip:"Open-ended nature observation activates the default mode network — the same brain network used for creativity, planning, and self-reflection. Scientifically, it 'quiets' executive overload.",
    moodTags:["calm","low"],
  },

  // ─── Tier 2–3: Preschool–Early Primary (new) ──────────────────────────────
  { id:"a41", name:"100-Bead Montessori Chain", emoji:"📿", regionEmoji:"🇮🇹", region:"Western",
    description:"Thread 100 beads in groups of 10, each group a different colour — physically building number sense from 1 to 100 by encoding quantity in muscle memory.",
    instructions:["Thread or lay out 100 beads in groups of 10","Each group of 10 is one colour","Count each group as you thread: 10, 20, 30...","Place the chain in a 10×10 square on the floor","Count individual beads from 1 to 100 by touching each one"],
    duration:25, materials:["Buttons","Stones / Pebbles","Egg Cartons"],
    intelligences:["Logical-Mathematical","Bodily-Kinesthetic","Spatial-Visual"], method:"Montessori", ageTiers:[2,3,4], difficulty:2,
    parentTip:"The Montessori bead chain creates a visual-tactile-kinesthetic triple encoding of the base-10 number system — far stronger than numeral worksheets for building number sense.",
    moodTags:["focus","calm"],
  },
  { id:"a42", name:"Cooking Science Observations", emoji:"🍳", regionEmoji:"🇫🇷", region:"Western",
    description:"Observe and document 3 cooking changes — liquid→solid, raw→cooked, solid→dissolved — building chemistry intuition through kitchen science.",
    instructions:["Choose one cooking activity: boiling water, dissolving sugar, baking simple dough","Before: describe and draw what you see","During: observe changes — colour, smell, texture, shape","After: draw again and compare","Discuss: 'What changed? Can we change it back?'"],
    duration:20, materials:["Bowls / Plates","Water","Spoons","Paper","Pencils / Crayons"],
    intelligences:["Logical-Mathematical","Naturalist","Linguistic"], method:"Reggio Emilia", ageTiers:[2,3,4,5], difficulty:2,
    parentTip:"Kitchen science gives children direct experience of physical and chemical change. Children who observe cooking-as-science at 4–6 score higher on scientific reasoning at 9 (French, 2004).",
    moodTags:["focus","high"],
  },
  { id:"a43", name:"Progressive Muscle Relaxation", emoji:"🌙", regionEmoji:"🇮🇳", region:"Indian",
    description:"Tense and relax each body part from toes to forehead — the gold-standard body-scan technique that reduces cortisol and improves sleep quality in children.",
    instructions:["Lie comfortably on a blanket or mat","Start at the feet: 'Squeeze your toes tight... hold 3 seconds... let go'","Move up: calves, thighs, tummy, hands, shoulders, face","Breathe deeply between each squeeze-release pair","End: 'Your whole body is soft like a cloud'"],
    duration:10, materials:["Blankets / Towels"],
    intelligences:["Intrapersonal","Emotional","Bodily-Kinesthetic"], method:"Yoga & Pranayama", ageTiers:[2,3,4,5], difficulty:1,
    parentTip:"PMR reduces cortisol by 20–30% in clinical trials (Pawlow & Jones, 2002). Works within 2 sessions. Particularly effective before high-stakes events and at bedtime.",
    moodTags:["calm","low"],
  },
  { id:"a44", name:"Tangram Pattern Puzzles", emoji:"🧩", regionEmoji:"🇨🇳", region:"Chinese",
    description:"Arrange 7 tangram pieces (cut from paper) to match silhouette cards — a 2000-year-old Chinese spatial reasoning game proven to build geometry intuition.",
    instructions:["Cut 7 tangram pieces from stiff paper following a template (or use cardboard)","Draw or print 3–4 simple silhouette cards: rabbit, house, boat, person","Challenge: can you fill the silhouette using all 7 pieces?","No overlapping, no gaps","Rotate and flip pieces to test different arrangements"],
    duration:20, materials:["Paper","Pencils / Crayons","Tape"],
    intelligences:["Spatial-Visual","Logical-Mathematical","Creative"], method:"Chinese Classical", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Tangrams improve spatial rotation ability by 32% in 4-week intervention studies. The National Academy of Sciences lists spatial reasoning as the strongest untrained predictor of STEM success.",
    moodTags:["focus","calm"],
  },
  { id:"a45", name:"Interview a Family Elder", emoji:"👴", regionEmoji:"🇮🇳", region:"Indian",
    description:"Child prepares 5 questions and interviews a grandparent or elderly neighbour — building oral history, deep listening, and intergenerational empathy.",
    instructions:["Prepare 5 questions together: 'What was school like?', 'What was your favourite game?'","Practice asking clearly and listening without interrupting","Conduct the interview — child can draw portraits while listening","Write or draw 3 things you learned","Share the 'story' with another family member"],
    duration:20, materials:["Paper","Pencils / Crayons"],
    intelligences:["Interpersonal","Linguistic","Intrapersonal"], method:"Nunchi", ageTiers:[3,4,5], difficulty:2,
    parentTip:"Intergenerational conversation builds Theory of Mind, historical thinking, and narrative cognition simultaneously. Children with strong elder bonds show superior social problem-solving by age 8.",
    moodTags:["calm","focus"],
  },

  // ─── Tier 3–4: School Age (new) ───────────────────────────────────────────
  { id:"a46", name:"Fraction Pizza Lab", emoji:"🍕", regionEmoji:"🇮🇹", region:"Western",
    description:"Cut paper 'pizzas' into halves, thirds, and quarters — understanding fractions as real partitions before encountering abstract notation.",
    instructions:["Cut a circle from paper (your pizza)","Fold in half: 2 equal slices — '1/2 each'","Refold into quarters: '4 slices — 1/4 each'","Try thirds by folding into 3 equal parts","Combine: '2/4 is the same as 1/2 — watch!' (lay them side by side)"],
    duration:15, materials:["Paper","Pencils / Crayons","Ruler"],
    intelligences:["Logical-Mathematical","Spatial-Visual","Bodily-Kinesthetic"], method:"Montessori", ageTiers:[3,4,5], difficulty:2,
    parentTip:"Concrete fraction manipulation before symbolic introduction reduces maths anxiety by 40% and accelerates fraction mastery by 6–8 months (Fuchs et al., 2013, Psychological Science).",
    moodTags:["focus","calm"],
  },
  { id:"a47", name:"Palindrome Poetry", emoji:"📝", regionEmoji:"🇺🇸", region:"Western",
    description:"Write 5-word palindrome-like poems where each line reflects the previous — training symmetrical thinking and expanding literary vocabulary.",
    instructions:["Explain palindromes: 'LEVEL reads the same forwards and backwards'","Find palindromes: noon, racecar, madam","Now write a 5-line palindrome poem: Line 3 is the heart, lines mirror outward","Example: Soft rain / Grey clouds / I breathe / Grey clouds / Soft rain","Read aloud — discuss the mirror structure"],
    duration:20, materials:["Paper","Pencils / Crayons"],
    intelligences:["Linguistic","Creative","Logical-Mathematical"], method:"Growth Mindset", ageTiers:[4,5], difficulty:4,
    parentTip:"Palindrome poetry requires simultaneous phonological awareness, pattern recognition, and creative constraint — a rare triple-activation literacy task.",
    moodTags:["focus","calm"],
  },
  { id:"a48", name:"Budget Market Simulation", emoji:"💰", regionEmoji:"🇸🇬", region:"Korean",
    description:"Set up a home market with price tags; child gets a 'budget' and plans purchases — building real-world numeracy, decision-making, and delayed gratification.",
    instructions:["Label 10 household items with 'prices' (small numbers for young children)","Give child a budget: 'You have ₹50 to spend'","Child plans purchases: 'I want this (₹20) and this (₹25). Total?'","Pay using tally marks or paper money","Discuss: 'Could you afford one more? What would you put back?'"],
    duration:20, materials:["Paper","Pencils / Crayons"],
    intelligences:["Logical-Mathematical","Executive Function","Interpersonal"], method:"Bar Modeling", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Financial numeracy games at ages 6–8 predict adult financial literacy and savings behaviour (Whitebread & Bingham, 2013). Budget decisions build prefrontal executive control.",
    moodTags:["focus","high"],
  },
  { id:"a49", name:"Decode the Secret Message", emoji:"🔏", regionEmoji:"🌍", region:"Western",
    description:"Write messages in a simple Caesar cipher — understanding encryption basics while applying pattern recognition and systematic thinking.",
    instructions:["Create a simple substitution: A=Z, B=Y, C=X... (reverse alphabet)","Write a short message in the cipher","Let child decode it letter by letter","Child encodes their own reply","Try a different cipher: shift all letters by 3 (A→D, B→E)"],
    duration:20, materials:["Paper","Pencils / Crayons"],
    intelligences:["Logical-Mathematical","Linguistic","Executive Function"], method:"Computational Thinking", ageTiers:[4,5], difficulty:3,
    parentTip:"Cipher activities activate systematic thinking and pattern mapping — core computational thinking skills. Caesar ciphers are used in computer science education worldwide from age 8.",
    moodTags:["focus","calm"],
    skillTags:["ai-literacy"],
  },
  { id:"a50", name:"Persuasion Letter Writing", emoji:"✉️", regionEmoji:"🇺🇸", region:"Western",
    description:"Child writes a real persuasive letter (to a family member, teacher, or community notice) using evidence and logical argument structure.",
    instructions:["Choose a real topic the child cares about: 'We should have a pet', 'More outside time'","Identify the audience and their concerns","Structure: Opening → 3 reasons with evidence → Restate plea → Close","Draft, revise, and write a neat final version","Actually send or deliver the letter"],
    duration:25, materials:["Paper","Pencils / Crayons"],
    intelligences:["Linguistic","Executive Function","Interpersonal"], method:"Growth Mindset", ageTiers:[4,5], difficulty:4,
    parentTip:"Argument structure (claim-evidence-warrant) is the academic literacy skill most strongly associated with success in secondary school and beyond. Real audiences triple writing motivation.",
    moodTags:["focus","calm"],
  },

  // ─── Tier 4–5: Older Primary (new) ────────────────────────────────────────
  { id:"a51", name:"Geometry Proof by Drawing", emoji:"📐", regionEmoji:"🇬🇷", region:"Western",
    description:"Prove that angles in a triangle always sum to 180° by tearing corners and placing them on a straight line — visual proof used in Euclidean geometry education for centuries.",
    instructions:["Draw any triangle on paper","Label the 3 angles A, B, C","Tear off each corner carefully","Line them up along a straight line (edge of another paper)","The three tips form a perfect straight line — 180°!"],
    duration:15, materials:["Paper","Pencils / Crayons","Ruler"],
    intelligences:["Logical-Mathematical","Spatial-Visual","Existential"], method:"Socratic Method", ageTiers:[4,5], difficulty:3,
    parentTip:"Hands-on proof is more durable than told proof. Piaget's formal-operational stage (11+) benefits enormously from proof-by-manipulation before abstract deductive reasoning.",
    moodTags:["focus","calm"],
  },
  { id:"a52", name:"News Story Fact-Check", emoji:"🗞️", regionEmoji:"🌍", region:"Western",
    description:"Choose one news headline, find two sources that agree AND one that challenges it — building lateral reading, the media-literacy skill recommended by Stanford researchers.",
    instructions:["Pick a current news headline from a newspaper or trusted site","Find one source that confirms the core fact","Find a second source — do they agree on details?","Find one source that gives a different angle or challenges it","Write a 3-sentence summary: 'The story says X. Two sources agree Y. One source says Z instead'"],
    duration:25, materials:["Paper","Pencils / Crayons"],
    intelligences:["Linguistic","Executive Function","Digital-Technological"], method:"Media Literacy (unplugged)", ageTiers:[5], difficulty:5,
    parentTip:"Lateral reading — checking a source from outside it — is the technique used by professional fact-checkers. Stanford study: it beats 'vertical reading' (reading deeply within one site) by a wide margin.",
    moodTags:["focus","calm"],
    skillTags:["ai-literacy"],
  },
  { id:"a53", name:"Build a Working Compass", emoji:"🧭", regionEmoji:"🇨🇳", region:"Chinese",
    description:"Magnetise a needle with a magnet, float it on a leaf in water, and watch it north-align — replicating the 2000-year-old Chinese invention with materials at home.",
    instructions:["Stroke a needle 30 times in ONE direction with a magnet","Float a small piece of leaf on water in a bowl","Gently lay the needle on the leaf","Watch it slowly rotate to align with Earth's magnetic field","Mark North and compare with a real compass or maps"],
    duration:15, materials:["Bowls / Plates","Water","Dried Leaves"],
    intelligences:["Logical-Mathematical","Naturalist","Spatial-Visual"], method:"Chinese Classical", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Replication of historical inventions provides deep understanding of scientific principles unavailable from explanation alone. Magnetic induction involves three STEM concepts at once.",
    moodTags:["focus","high"],
  },
  { id:"a54", name:"Socratic Seminar at Dinner", emoji:"🍽️", regionEmoji:"🇬🇷", region:"Western",
    description:"Pose a genuinely open ethical question at dinner and model Socratic questioning — building philosophical reasoning, perspective-taking, and intellectual humility.",
    instructions:["Choose an open question: 'Is it ever okay to lie?', 'What makes something fair?'","Ground rule: no wrong answers; build on others' ideas","Parent models: 'That's interesting — what would happen if...'","Ask: 'Can anyone think of an example that contradicts that?'","Close: 'We didn't solve it — that's philosophy — we'll think more tomorrow'"],
    duration:20, materials:[],
    intelligences:["Existential","Interpersonal","Linguistic"], method:"Socratic Method", ageTiers:[4,5], difficulty:4,
    parentTip:"Philosophical dialogue at dinner develops metacognition, perspective-taking, and tolerance for ambiguity — three of the strongest predictors of academic and relational success.",
    moodTags:["calm","focus"],
  },
  { id:"a55", name:"Code Breaking: Binary Bracelets", emoji:"⚫⚪", regionEmoji:"🌍", region:"Western",
    description:"Encode your name in 5-bit binary using beads of two colours — a tactile introduction to how computers represent all information as 1s and 0s.",
    instructions:["Learn binary: 0=white bead, 1=black bead, each letter = 5 bits","A=00001, B=00010... download a simple ASCII reference","Thread your first initial: count the bits carefully","Thread a full short name","Decode a friend's bracelet"],
    duration:25, materials:["Buttons","Stones / Pebbles"],
    intelligences:["Logical-Mathematical","Digital-Technological","Creative"], method:"Computational Thinking", ageTiers:[4,5], difficulty:4,
    parentTip:"Binary encoding teaches that abstraction layers underlie all digital technology. Children who build binary bracelets demonstrate 60% stronger understanding of data concepts than lecture-taught peers.",
    moodTags:["focus","calm"],
    skillTags:["ai-literacy"],
  },

  // ─── Cross-tier: Nature, Movement, Mindfulness (new) ─────────────────────
  { id:"a56", name:"Gratitude Jar Ritual", emoji:"🫙", regionEmoji:"🇺🇸", region:"Western",
    description:"Each evening, write or draw one grateful moment on a slip and drop it into a family jar — building positive neuroplasticity through deliberate attention to good.",
    instructions:["Decorate a jar with the family's name","Each evening, write or draw one thing you're grateful for today","Drop it in the jar — child and parent each add a slip","Read 3 random slips from the past week together on Sundays","Celebrate how many are in the jar at month's end"],
    duration:5, materials:["Cups / Glasses","Paper","Pencils / Crayons"],
    intelligences:["Intrapersonal","Emotional","Interpersonal"], method:"Growth Mindset", ageTiers:[2,3,4,5], difficulty:1,
    parentTip:"Gratitude practices for 21 consecutive days measurably shift neural baseline toward positive affect (Emmons & McCullough, 2003). The jar makes gratitude tangible and social, not just journaling.",
    moodTags:["calm","low"],
  },
  { id:"a57", name:"Freeze Dance Regulation", emoji:"🕺", regionEmoji:"🇧🇷", region:"Western",
    description:"Dance freely to music and freeze instantly when it stops — training inhibitory control (the executive skill most predictive of school readiness) disguised as pure fun.",
    instructions:["Clear a dance floor space","Start music — dance any way you like!","When music stops: FREEZE — not even a finger moves","Hold freeze for 5 seconds then dance again","Vary pause length (2 seconds to 10 seconds) — keep them guessing"],
    duration:10, materials:[],
    intelligences:["Bodily-Kinesthetic","Executive Function","Musical-Rhythmic"], method:"Reggio Emilia", ageTiers:[1,2,3,4], difficulty:1,
    parentTip:"Freeze Dance measures exactly what the Head-Toes-Knees-Shoulders task tests: inhibitory control. Children who play it daily for 4 weeks show significant executive control gains (Diamond et al., 2007).",
    moodTags:["high","focus"],
  },
  { id:"a58", name:"Mindful Meal: One Raisin", emoji:"🍇", regionEmoji:"🇮🇳", region:"Indian",
    description:"The classic MBSR raisin exercise — spend 5 minutes examining, smelling, and slowly eating a single raisin with complete attention. Builds sensory awareness and impulse control.",
    instructions:["Give child one raisin (or any small food item)","Look at it for 30 seconds: wrinkles, colour, shine","Smell it for 20 seconds — describe the smell","Place on tongue without biting — feel texture for 30 seconds","Slowly chew — count 20 chews before swallowing"],
    duration:8, materials:[],
    intelligences:["Intrapersonal","Naturalist","Bodily-Kinesthetic"], method:"Yoga & Pranayama", ageTiers:[3,4,5], difficulty:2,
    parentTip:"The raisin exercise is the opening practice in every 8-week MBSR course. It builds interoceptive awareness and slows impulse cycles — particularly effective for children with sensory or attention challenges.",
    moodTags:["calm","low"],
  },
  { id:"a59", name:"Nature Mandala Art", emoji:"🌸", regionEmoji:"🇮🇳", region:"Indian",
    description:"Create a circular mandala on the ground using natural objects — a contemplative creative practice building radial symmetry understanding and focused attention.",
    instructions:["Go to a garden, park, or courtyard","Collect: leaves, flowers, stones, sticks, petals — any natural objects","Mark a centre point on the ground","Build outward in radiating symmetric layers","Photograph before the wind takes it — discuss impermanence"],
    duration:20, materials:["Garden space / Sidewalk","Stones / Pebbles","Dried Leaves"],
    intelligences:["Creative","Spatial-Visual","Naturalist"], method:"Mandala", ageTiers:[2,3,4,5], difficulty:2,
    parentTip:"Mandala-making is used therapeutically across cultures. It requires sustained attention (15–20 min) and radial symmetry thinking — both measurably strengthened by the practice.",
    moodTags:["calm","low"],
  },
  { id:"a60", name:"Cooperative Tower Build", emoji:"🏗️", regionEmoji:"🇸🇪", region:"Scandinavian",
    description:"Build the tallest possible tower using only paper, tape, and cups — but each person can only touch materials for 30 seconds at a time, requiring communication and planning.",
    instructions:["Materials: paper, tape, cups only","Rule: each person contributes for only 30-second turns","Plan verbally before touching materials","Count turns: how tall can you get?","If it falls, rebuild with lessons learned — celebrate resilience"],
    duration:20, materials:["Paper","Tape","Cups / Glasses"],
    intelligences:["Interpersonal","Spatial-Visual","Executive Function"], method:"Reggio Emilia", ageTiers:[2,3,4,5], difficulty:3,
    parentTip:"Cooperative constraint tasks build perspective-taking, verbal planning, and frustration tolerance simultaneously. The 30-second turn rule forces explicit communication that mirrors real teamwork.",
    moodTags:["high","focus"],
  },
  { id:"a61", name:"Haiku Nature Journal", emoji:"🌿", regionEmoji:"🇯🇵", region:"Japanese",
    description:"Observe nature for 5 minutes then write a 5-7-5 haiku — Japanese poetry's structured syllable constraint trains phonological awareness and sensory attention simultaneously.",
    instructions:["Go outside and observe quietly for 5 minutes","Choose one detail: a leaf, an insect, the wind, a shadow","Count syllables on fingers: first line = 5 syllables","Second line = 7 syllables","Third line = 5 syllables. Share and celebrate imperfection"],
    duration:15, materials:["Paper","Pencils / Crayons","Garden space / Sidewalk"],
    intelligences:["Linguistic","Naturalist","Creative"], method:"Japanese Classical", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Haiku requires simultaneous syllable counting (phonological), sensory observation (attention), and image selection (executive). A UNESCO study identifies haiku practice as a uniquely integrated literacy-nature activity.",
    moodTags:["calm","focus"],
  },
  { id:"a62", name:"Emotion Colour Mixing", emoji:"🎨", regionEmoji:"🇫🇷", region:"Western",
    description:"Mix food colouring or paint to represent emotions — warm for big feelings, cool for calm — building emotional vocabulary through non-verbal artistic representation.",
    instructions:["Set out 3 primary colours (or food colouring in water cups)","Ask: 'What colour is happy?', 'What colour is angry?'","Mix colours to make new emotion colours: 'Scared is yellow + a drop of black'","Paint or draw using your emotion palette today","Discuss: 'Does red always mean angry? What does YOUR red mean?'"],
    duration:15, materials:["Bowls / Plates","Water","Paper","Pencils / Crayons"],
    intelligences:["Emotional","Creative","Intrapersonal"], method:"Art Therapy", ageTiers:[2,3,4], difficulty:1,
    parentTip:"Colour-emotion metaphor activates both the limbic system and prefrontal emotional labelling — dual processing that's 50% more effective at building emotional vocabulary than talk alone (Lusebrink, 2010).",
    moodTags:["calm","low"],
  },
  { id:"a63", name:"Reverse Design Challenge", emoji:"🔄", regionEmoji:"🇸🇪", region:"Scandinavian",
    description:"Give child an everyday object and ask: 'Could you redesign this to work better?' Sketch their improved version — building design-thinking and engineering mindset.",
    instructions:["Choose an everyday object: a spoon, a shoe, a door handle","Ask: 'What's annoying or difficult about this?'","'If you could change ONE thing, what would it be?'","Child sketches their redesign, labelling the improvement","Discuss: 'Who else might need this improved version?'"],
    duration:15, materials:["Paper","Pencils / Crayons"],
    intelligences:["Creative","Spatial-Visual","Logical-Mathematical"], method:"Design Thinking", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Design thinking (empathise → define → ideate → prototype → test) is the explicit curriculum in Stanford's d.school from age 6. Even one weekly session builds creative confidence measurably.",
    moodTags:["focus","high"],
  },
  { id:"a64", name:"Whisper Telephone Science", emoji:"📞", regionEmoji:"🌍", region:"Western",
    description:"Play telephone with 5 people to observe message distortion — a playful introduction to information transmission, distortion, and why reliable sources matter.",
    instructions:["Sit in a line of 5+ family members","Whisper a specific message to the first person","Pass it down the line — no repeating allowed","Last person says what they heard aloud","Compare with original. Discuss: how did it change?","Connect: 'This is how rumours and misinformation spread online'"],
    duration:10, materials:[],
    intelligences:["Linguistic","Digital-Technological","Interpersonal"], method:"Media Literacy (unplugged)", ageTiers:[2,3,4,5], difficulty:1,
    parentTip:"Telephone experiments make information distortion viscerally real. Connecting it to digital information sharing (screenshots, reposts) builds durable media literacy that lectures cannot match.",
    moodTags:["high","focus"],
    skillTags:["ai-literacy"],
  },
  { id:"a65", name:"Shadow Length Science", emoji:"🌞", regionEmoji:"🇬🇷", region:"Western",
    description:"Measure your shadow at 8am, noon, and 4pm — rediscovering how Eratosthenes calculated Earth's circumference using shadow lengths in 240 BC.",
    instructions:["Mark where you stand with tape outdoors","Measure your shadow with a stick or tape measure at 8am","Record measurement and time in a table","Repeat at noon (shortest shadow!)","Repeat at 4pm — plot the three lengths on a chart"],
    duration:15, materials:["Tape","Paper","Pencils / Crayons","Garden space / Sidewalk"],
    intelligences:["Logical-Mathematical","Spatial-Visual","Naturalist"], method:"Socratic Method", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Shadow length measurement connects direct observation to astronomical geometry. Eratosthenes measured the Earth's circumference with just sticks and shadows — this exact method. Science as exploration.",
    moodTags:["focus","high"],
  },
  { id:"a66", name:"Body Percussion Orchestra", emoji:"🥁", regionEmoji:"🇧🇷", region:"Western",
    description:"Create a body-percussion score for the family: claps, snaps, chest taps, and stamps in rhythmic layers — activating cross-lateral coordination and ensemble listening.",
    instructions:["Assign each family member a body sound: clap, snap, tap chest, stamp","Start with a steady 4-beat clap together","Layer in snap on beat 2: 'CLAP-snap-CLAP-snap'","Add chest tap on beat 3, stamp on beat 4","Record a 1-minute performance and play it back"],
    duration:15, materials:[],
    intelligences:["Musical-Rhythmic","Bodily-Kinesthetic","Coordination"], method:"Orff Schulwerk", ageTiers:[1,2,3,4,5], difficulty:2,
    parentTip:"Carl Orff's pedagogical method (used in 50+ countries) grounds musical education in body percussion. Cross-lateral movement + rhythm simultaneously stimulates both hemispheres — measurably boosting reading readiness.",
    moodTags:["high","focus"],
  },
  { id:"a67", name:"Memory Palace Journey", emoji:"🏛️", regionEmoji:"🇬🇷", region:"Western",
    description:"Build a memory palace through 5 rooms of your home, placing vivid images to remember a list — the ancient Greek technique used by memory champions and surgeons.",
    instructions:["Choose 5 locations in your home as 'stations'","Assign one item to remember at each station — make it vivid and strange","Walk the journey physically, 'placing' each image","Walk again with eyes closed — retrieve each item","Test: can you recall all 5 items tomorrow?"],
    duration:15, materials:[],
    intelligences:["Spatial-Visual","Executive Function","Intrapersonal"], method:"Classical Memory Training", ageTiers:[4,5], difficulty:4,
    parentTip:"The Method of Loci (memory palace) dates to ancient Greece. fMRI shows it activates visuospatial and hippocampal networks together. World Memory Champions use it to memorise 1000+ items.",
    moodTags:["focus","calm"],
  },
  { id:"a68", name:"Shadow Puppet Script", emoji:"🎭", regionEmoji:"🇮🇩", region:"Indian",
    description:"Write a simple 3-scene script, make shadow puppet characters, and perform — combining narrative structure, spatial reasoning, and oral performance skills.",
    instructions:["Write a 3-scene story: problem → complication → resolution","Make puppet characters from cardboard or paper on sticks","Build a 'stage': torch against a white wall or sheet","Rehearse once, then perform — parent films if available","Watch and discuss: 'What would you change?'"],
    duration:30, materials:["Paper","Pencils / Crayons","Tape","Torch / Flashlight"],
    intelligences:["Creative","Linguistic","Spatial-Visual"], method:"Wayang (Indonesian Shadow Play)", ageTiers:[3,4,5], difficulty:3,
    parentTip:"Shadow puppet traditions exist in India, Java, China, and Turkey. Writing-then-performing a script doubles story comprehension and retention vs reading alone (Gambrell, 1996).",
    moodTags:["high","focus"],
  },
  { id:"a69", name:"Prime Number Sieve", emoji:"🔢", regionEmoji:"🇬🇷", region:"Western",
    description:"Build the Sieve of Eratosthenes on a 10×10 grid — discovering prime numbers through elimination, revealing mathematical beauty through pattern.",
    instructions:["Draw a 10×10 grid, number 1–100","Cross out 1 (not prime)","Circle 2, then cross out all multiples of 2 (4, 6, 8...)","Circle 3, cross out all multiples of 3 not already crossed","Repeat for 5, 7... only primes remain circled!"],
    duration:20, materials:["Paper","Pencils / Crayons"],
    intelligences:["Logical-Mathematical","Spatial-Visual","Executive Function"], method:"Classical Mathematics", ageTiers:[4,5], difficulty:4,
    parentTip:"The Sieve of Eratosthenes (240 BC) remains the most beautiful elementary demonstration that an infinite class of numbers has a discoverable structure. Pattern-finding, not calculation, is the lesson.",
    moodTags:["focus","calm"],
  },
  { id:"a70", name:"Gravity Drop Experiment", emoji:"🪶", regionEmoji:"🇮🇹", region:"Western",
    description:"Drop objects of different weights from the same height simultaneously — rediscovering Galileo's refutation of Aristotle using only a book, a feather, and a sheet of paper.",
    instructions:["Gather 3 pairs: heavy+light of similar shape (two stones of diff size)","Hold them at the same height — predict which lands first","Drop simultaneously — observe. (They land together — Galileo was right!)","Add air resistance: drop a flat paper vs a crumpled ball","Why different? Discuss air resistance vs gravity"],
    duration:10, materials:["Stones / Pebbles","Paper","Garden space / Sidewalk"],
    intelligences:["Logical-Mathematical","Naturalist","Spatial-Visual"], method:"Socratic Method", ageTiers:[3,4,5], difficulty:2,
    parentTip:"Galileo's discovery that mass doesn't affect fall rate is counter-intuitive and directly testable by children. Hands-on refutation of intuition is the strongest foundation for scientific thinking.",
    moodTags:["focus","high"],
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

/** Human judgment + verification habits (unplugged / family rules) */
export const SKILL_TAG_AI_LITERACY = "ai-literacy";
/** Movement + thinking in the same activity window */
export const SKILL_TAG_DUAL_TASK = "dual-task";

export const SKILL_TAG_UI: Record<string, { label: string; emoji: string; shortHint: string }> = {
  [SKILL_TAG_AI_LITERACY]: { label: "AI literacy", emoji: "🧑‍🏫", shortHint: "Human + tool smarts" },
  [SKILL_TAG_DUAL_TASK]: { label: "Dual-task", emoji: "🔄", shortHint: "Body + brain" },
};

const INTEL_TO_PILLARS: Record<string, OutcomePillar[]> = {
  "Executive Function": ["Executive"],
  "Emotional": ["Emotional", "Motor-Social"],
  "Interpersonal": ["Motor-Social", "Emotional"],
  "Intrapersonal": ["Emotional"],
  "Logical-Mathematical": ["Cognitive", "Language-Logic"],
  "Linguistic": ["Language-Logic"],
  "Pronunciation": ["Language-Logic"],
  "Spatial-Visual": ["Cognitive", "Motor-Social"],
  "Bodily-Kinesthetic": ["Motor-Social"],
  "Coordination": ["Motor-Social"],
  "Naturalist": ["Cognitive", "Motor-Social"],
  "Creative": ["Cognitive", "Emotional"],
  "Musical-Rhythmic": ["Language-Logic", "Emotional"],
  "Digital-Technological": ["Cognitive", "Executive"],
  "Existential": ["Cognitive", "Emotional"],
};

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function inferMechanismTags(act: Activity): string[] {
  const tags = new Set<string>();
  if (act.skillTags?.includes(SKILL_TAG_AI_LITERACY)) tags.add("verification-habits");
  if (act.skillTags?.includes(SKILL_TAG_DUAL_TASK)) tags.add("dual-task-integration");
  if (act.moodTags?.includes("calm")) tags.add("stress-regulation");
  if (act.intelligences.includes("Executive Function")) tags.add("executive-function");
  if (act.intelligences.includes("Linguistic") || act.intelligences.includes("Pronunciation")) tags.add("language-enrichment");
  if (act.intelligences.includes("Logical-Mathematical")) tags.add("pattern-reasoning");
  if (act.intelligences.includes("Bodily-Kinesthetic") || act.intelligences.includes("Coordination")) tags.add("motor-cognition");
  if (act.intelligences.includes("Emotional") || act.intelligences.includes("Interpersonal")) tags.add("co-regulation");
  if (act.intelligences.includes("Creative")) tags.add("symbolic-play");
  if (act.method.toLowerCase().includes("spaced")) tags.add("retrieval-practice");
  if (act.method.toLowerCase().includes("montessori")) tags.add("hands-on-autonomy");
  return [...tags];
}

function inferContraindications(act: Activity): string[] {
  const notes: string[] = [];
  if (act.materials.some((m) => /buttons|stones|beans/i.test(m))) {
    notes.push("Requires close supervision with small objects.");
  }
  if (act.intelligences.includes("Bodily-Kinesthetic") || act.skillTags?.includes(SKILL_TAG_DUAL_TASK)) {
    notes.push("Clear floor space and adapt if your child is overtired or unsteady.");
  }
  if (act.moodTags?.includes("high")) {
    notes.push("Shorten or simplify if your child is dysregulated rather than playful-high energy.");
  }
  return uniqueStrings(notes);
}

function inferGoalPillars(act: Activity): OutcomePillar[] {
  return [
    ...new Set(
      act.intelligences.flatMap((intel) => INTEL_TO_PILLARS[intel] ?? ["Cognitive"]),
    ),
  ];
}

function inferDurationVariants(duration: number): ActivityDurationVariants {
  return {
    quick: Math.max(5, duration - 5),
    standard: duration,
    stretch: duration + 5,
  };
}

const TIER_TO_MONTHS: Record<number, [number, number]> = {
  0: [3, 12],
  1: [12, 24],
  2: [24, 48],
  3: [48, 72],
  4: [84, 96],
  5: [108, 120],
};

function inferMilestoneIds(act: Activity): string[] {
  const matched = new Set<string>();
  for (const tier of act.ageTiers) {
    const ageRange = TIER_TO_MONTHS[tier];
    if (!ageRange) continue;
    for (const milestone of MILESTONES) {
      const sameAgeBand = milestone.ageMonths >= ageRange[0] && milestone.ageMonths <= ageRange[1];
      const sameBrainFamily = milestone.brainRegions.some((region) => act.intelligences.includes(region));
      if (sameAgeBand && sameBrainFamily) matched.add(milestone.id);
      if (matched.size >= 4) return [...matched];
    }
  }
  return [...matched];
}

function inferProgression(act: Activity): ActivityProgression {
  const primary = act.skillTags?.includes(SKILL_TAG_AI_LITERACY)
    ? "ai-literacy"
    : act.skillTags?.includes(SKILL_TAG_DUAL_TASK)
      ? "dual-task"
      : act.intelligences[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "general";
  const stage = Math.max(1, Math.min(5, act.difficulty));
  return {
    programId: `${primary}-tier-${act.ageTiers[0] ?? 1}`,
    stage,
    nextActivityIds: RAW_ACTIVITIES
      .filter((candidate) => candidate.id !== act.id && candidate.ageTiers.some((tier) => act.ageTiers.includes(tier)) && candidate.difficulty >= act.difficulty)
      .slice(0, 3)
      .map((candidate) => candidate.id),
  };
}

function enrichActivity(act: Activity): Activity {
  return {
    ...act,
    mechanismTags: act.mechanismTags ?? inferMechanismTags(act),
    contraindications: act.contraindications ?? inferContraindications(act),
    durationVariants: act.durationVariants ?? inferDurationVariants(act.duration),
    goalPillars: act.goalPillars ?? inferGoalPillars(act),
    milestoneIds: act.milestoneIds ?? inferMilestoneIds(act),
    reviewStatus: act.reviewStatus ?? "reviewed",
    progression: act.progression ?? inferProgression(act),
  };
}

export const ACTIVITIES: Activity[] = RAW_ACTIVITIES.map(enrichActivity);

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

// ─── KYC / personalization (Know Your Child → generator) ───────────────────────
/** Mirrors KYC fields needed for scoring; keep in sync with AppContext `KYCData` (minus notes/updatedAt). */
export interface AGEPersonalization {
  learningStyle: "visual" | "auditory" | "kinesthetic" | null;
  curiosity: number;
  energy: number;
  patience: number;
  creativity: number;
  social: number;
  energyLevel: number;
  adaptability: number;
  mood: number;
  sensitivity: number;
}

/** Map slider 1–10 to ~0–1 for weighting (midpoint 5.5). */
function normTrait(v: number): number {
  return Math.max(0, Math.min(1, (v - 5.5) / 4.5));
}

function intelBonus(intelligences: string[], key: string, weight: number): number {
  return intelligences.includes(key) ? weight : 0;
}

/**
 * Extra score from child profile. Capped so mood/materials/tier remain primary.
 * Tuned for diversity: boosts are moderate; pack assembly still enforces spread rules.
 */
export function personalizationScoreBonus(act: Activity, p: AGEPersonalization): number {
  const I = act.intelligences;
  let b = 0;

  if (p.learningStyle === "visual") {
    b += intelBonus(I, "Spatial-Visual", 12);
    b += intelBonus(I, "Creative", 8);
  } else if (p.learningStyle === "auditory") {
    b += intelBonus(I, "Linguistic", 12);
    b += intelBonus(I, "Musical-Rhythmic", 10);
  } else if (p.learningStyle === "kinesthetic") {
    b += intelBonus(I, "Bodily-Kinesthetic", 14);
  }

  const cr = normTrait(p.creativity);
  b += cr * (intelBonus(I, "Creative", 10) + intelBonus(I, "Spatial-Visual", 6));

  const so = normTrait(p.social);
  b += so * (intelBonus(I, "Interpersonal", 10) + intelBonus(I, "Emotional", 8));

  const cq = normTrait(p.curiosity);
  b += cq * (intelBonus(I, "Naturalist", 8) + intelBonus(I, "Logical-Mathematical", 7) + intelBonus(I, "Existential", 5));

  const en = normTrait((p.energy + p.energyLevel) / 2);
  b += en * intelBonus(I, "Bodily-Kinesthetic", 10);

  if (p.patience <= 4 && act.duration <= 12) b += 11;
  if (p.patience >= 8 && act.duration >= 18) b += 6;

  if (p.sensitivity >= 7) {
    if (act.moodTags?.includes("calm") || act.moodTags?.includes("low")) b += 9;
    if (act.difficulty <= 2) b += 4;
  }

  if (p.adaptability >= 8) b += 3;

  return Math.min(b, 28);
}

// ─── Spaced repetition (completion history) ────────────────────────────────────
/** Minimal log shape for `buildLastCompletionMap` (matches `ActivityLog` subset). */
export interface ActivityCompletionLog {
  childId: string;
  activityId: string;
  completed: boolean;
  date: string;
}

/** Latest completion timestamp (ms) per activityId for one child. Only `completed: true` logs. */
export function buildLastCompletionMap(
  logs: ActivityCompletionLog[],
  childId: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of logs) {
    if (l.childId !== childId || !l.completed) continue;
    const t = new Date(l.date).getTime();
    if (Number.isNaN(t)) continue;
    const prev = out[l.activityId];
    if (prev === undefined || t > prev) out[l.activityId] = t;
  }
  return out;
}

/**
 * Aligns with blueprint intent: penalize same-day repeat; reward 3–7d spacing.
 * Empty `lastByActivity` → all activities treated as never completed (neutral).
 */
export function spacedRepetitionScoreBonus(
  activityId: string,
  lastByActivity: Record<string, number>,
  nowMs: number = Date.now(),
): number {
  const last = lastByActivity[activityId];
  if (last === undefined) return 5; // mild novelty — not too large vs mood/tier

  const hours = (nowMs - last) / (1000 * 60 * 60);
  if (hours < 24) return -42; // strong deprioritize (blueprint: exclude last 24h)
  const days = hours / 24;
  if (days < 2) return -8;
  if (days < 3) return 0;
  if (days < 7) return 16; // sweet spot for revisit
  if (days < 14) return 10;
  return 14; // longer gap — still welcome
}

// ─── Pack validation (mirrors greedy assembly rules) ─────────────────────────
function validatePackComposition(pack: Activity[], timeMinutes: number): boolean {
  const maxDur = timeMinutes + 15;
  let totalDur = 0;
  const usedRegions = new Map<string, number>();
  const coveredIntel = new Set<string>();
  for (let pi = 0; pi < pack.length; pi++) {
    const act = pack[pi];
    totalDur += act.duration;
    if (totalDur > maxDur) return false;
    const rc = usedRegions.get(act.region) ?? 0;
    if (rc >= 2) return false;
    usedRegions.set(act.region, rc + 1);
    const newIntel = act.intelligences.filter(i => !coveredIntel.has(i)).length;
    if (newIntel === 0 && pi >= 2) return false;
    act.intelligences.forEach(i => coveredIntel.add(i));
  }
  return true;
}

/** If boost is on and pack lacks AI literacy, try swapping one slot with an eligible tagged activity. */
function tryEnsureAILiteracyInPack(pack: Activity[], eligible: Activity[], timeMinutes: number): Activity[] {
  const hasAILit = (a: Activity) => a.skillTags?.includes(SKILL_TAG_AI_LITERACY);
  if (pack.some(hasAILit) || pack.length === 0) return pack;
  const candidates = eligible.filter(hasAILit);
  for (const cand of candidates) {
    for (let i = 0; i < pack.length; i++) {
      const trial = pack.slice();
      trial[i] = cand;
      if (validatePackComposition(trial, timeMinutes)) return trial;
    }
  }
  return pack;
}

export interface AGEGeneratorOptions {
  /** Prefer / guarantee (via swap) at least one `ai-literacy` activity when materials allow */
  boostAILiteracy?: boolean;
  /** Score boost for `dual-task` tagged activities */
  boostDualTask?: boolean;
  /** Outcome pillars to emphasize gently based on recent parent check-ins */
  focusPillars?: OutcomePillar[];
  /** Extra brain regions/intelligences to prioritize for targeted packs */
  priorityIntelligences?: string[];
  adaptiveModel?: import("../context/AppContext").AdaptiveModel | null;
  communityRatings?: Record<string, { avg: number; count: number }>;
  currentSeason?: string;
}

const SEASONAL_TAG_MAP: Record<string, string[]> = {
  summer: ["outdoor", "water-play", "shade-activities", "summer"],
  monsoon: ["indoor", "rainy-day", "sensory-water", "monsoon"],
  autumn: ["nature-walk", "harvest", "leaf-crafts", "autumn"],
  winter: ["cozy", "warm-activities", "holiday-crafts", "winter"],
  spring: ["garden", "nature", "outdoor", "spring"],
};

// ─── AGE Algorithm ─────────────────────────────────────────────────────────────
export function runAGE(
  tier: number,
  selectedMaterials: string[],
  mood: string,
  timeMinutes: number,
  recentActivityIds: string[] = [],
  personalization: AGEPersonalization | null = null,
  lastCompletionByActivity: Record<string, number> | null = null,
  options: AGEGeneratorOptions | null = null,
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
    // Light anti-repeat from recent pack history (session-adjacent); spaced rep handles calendar timing
    if (!recentActivityIds.includes(act.id)) score += 6;
    score += act.materials.length * 2;
    if (personalization) score += personalizationScoreBonus(act, personalization);
    if (lastCompletionByActivity && Object.keys(lastCompletionByActivity).length > 0) {
      score += spacedRepetitionScoreBonus(act.id, lastCompletionByActivity);
    }
    if (options?.boostAILiteracy && act.skillTags?.includes(SKILL_TAG_AI_LITERACY)) score += 18;
    if (options?.boostDualTask && act.skillTags?.includes(SKILL_TAG_DUAL_TASK)) score += 12;
    if (options?.focusPillars?.length && act.goalPillars?.some((pillar) => options.focusPillars?.includes(pillar))) {
      score += 10;
    }
    if (options?.priorityIntelligences?.length) {
      const matchedPriority = act.intelligences.filter((intel) => options.priorityIntelligences?.includes(intel)).length;
      score += matchedPriority * 14;
    }
    if (options?.adaptiveModel) {
      const w = options.adaptiveModel.regionWeights[act.region] ?? 1.0;
      const rec = options.adaptiveModel.recommendations[act.region];
      let adBonus = (w - 1.0) * 15;
      if (rec) { adBonus += (3 - Math.abs(act.difficulty - rec.recommendedTier)) * 5 * rec.confidenceScore; }
      score += Math.round(adBonus);
    }
    if (options?.communityRatings) {
      const entry = options.communityRatings[act.id];
      if (entry && entry.count >= 3) score += Math.round((entry.avg - 3) * 4);
    }
    if (options?.currentSeason && act.seasonalTags?.length) {
      const sTags = SEASONAL_TAG_MAP[options.currentSeason];
      if (sTags) { score += act.seasonalTags.filter(t => sTags.includes(t)).length * 8; }
    }
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

  if (options?.boostAILiteracy) {
    return tryEnsureAILiteracyInPack(pack, eligible, timeMinutes);
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