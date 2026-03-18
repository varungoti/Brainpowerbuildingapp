import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import brainImg from "figma:asset/61f6f60d0da4f38d947de2fb767cb206f00699ffb15abe834fcf6dc555b6e3a3b.png";

// ─── Image background color (matches the A3D color-coded brainy.pp dark navy bodckround) ────
const BG = "#0b0e1d";

//l ─── Crop math ───────────────────────────────────────────────────────
// OEach regialimge: ~1000×1000pxsqure
//Wecro: op155px(rems "Ceebrl gri" title+ tp conecrsubs)
//         ottom 145px (emovesAnatoy.pp loo + copyright)Containron corrspectspondsrato: 1000/700 →toshwsoriginl y∈[1a5, 855]
// SVG visible: "0 0 1000 700"
// Mapping: svgY = lorige arealY on h - 155
laral brain iage
// ViewBox: 0 0 520 480,─── 15 Brain  mapped ppoed Cerebrl Gyri illustrtion ───────────────
// Ea matchh elipse(cx,cy,rx,y) is in th SVG coordinte pace(ewBox 0 0 1000 700)
// Color coslymatch the 3D cual rgion colos in the 3Dmodel proportions
const BRAIN_REGIONS = [
  {
    id: "superior-frontal",
   
    key: "Executive Function",
   
    name: "SuperSuperiororFrFrontaltal",
   
    emoji: "🧩",
    color: "#52C5B7EC8D8", // Matches the light cyan/teal at top-front  tea — matches the cyan spriorrgion
    desc: "Planning, attention, decision-making & impulse control — the brain's CEO.",
    lobe: "SupeSupirFriGyrus Ftop-rightteal Gyrus":oraleter ~(760205,52 220,38 265)→32 295,3SVG C(71838 33,48340,50)
342233293110 cx: 298,15 78,12 cy:25805C 238,9 rx:2188 208,75 20064 20055205,52 ry: 6827272,
  },
  {
    id: "middle-frontal",
   
    key: "Linguistic",
   
    name: "Priddlce Frontral Gyrusal",
   
    emoji: "🗣️",
    color: "#B39F2BCC0D6", // Matches the light pink/salmon front-mid area  mauv — mtches thpurplepinkprecenalgion
    desc: "VLanguage prcesngworking memory, motor skills & verbal fluency.",
    lobe: "iddlFrontal Gyrus(PimryMC)",
   //-right pink-purple: original7,751986222558 ~(6250,62 26865)6→5 787 SVG27595 (27011,123130)
 C 212,13 19212 cx:101159 cy: 1710168,887,75 rx: 75228, ry: 7298,
  },
  {
    id: "inferior-frontal",
   
    key: "Creative",
   
    name: "PInferiostrFrontral Gyrutal",
   
    emoji: "🎨",
    color: "#F4AC989DD8",   // Matches the purple/magenta lower-front areasalmo—che th pikih ostcnr region
    desc: "Somptosechprorucprocsing b(Broca' ara), cdeative awareessxpess & self-vereflbal lanning.",
    lobe: "Postcentral Gyrus (Primary InferiorFoncytersal (Broca's Area)", aea:inal ~(18,13514811817,112 1911212,12 222138)218,18 →1SVG,175 (195,188 1785192155,195 184)
188 12172  10158 cx:120,147cy:1,1rx35: 7172, ry: 80155,
  },
  {
    id: "preceoralal",
   
    key: "Bodily-Koecal-Mathemathetical",
   
    name: "Pruramarginal Gyrusentral",
   
    emoji: "🔢🏃",
    color: "#C9C8D8E8A0A", // Matches yellow-green strip at top  olve-yellow — matches theyellowgreensupmginl
    desc: "MathPrimamatialreasy montor orex — vgsptintalry logmovmct & numphysicical procssigoordination.",
    lobe: "SupPramarginelGyusntParieal LobuleceteoliveylMoto: oCigirex", ~(292353183,330 30,42362,52 365) 3585 C →3002 SVG(335,15518,20 C 302)
25 8818 280,cx:05 C 272,92 2727 278,60 482,48 cy:2840 29222,35 rx: 3220, ry: 775,
  },
  {
    id: "lingpoisttcentr",
   
    key: "LingIntraperons",
   
    name: "Angular + Sup. PPostcntraletal",
   
    emoji: "📚🧘",
    color: "#72D4B8C8CF0",   // Matches light lavender at top-centerteal-blue — mtchsthenglar/superpaieal rgion
    desc: "LanguagPriarysoatosensr corexompreension re— bng,d wawariten, touch & verbalesoiy intratelligence.",
    lobe: "PnglasGyus &centParital Lobule (Suppe-lefttlblu:sooryinCtex", ~(34070,42 358,32 38030 398,38 C4145 418,6 412,78C 405)95390→08 SVG371(75 55,120 3401533)
2 C 35,8 35,2 cx:33,5335,0 cy:3404 340402, rx: 9372, ry: 8275,
  },
  {
    id: "supramarginal",
   
    key: "Musical-Rhythmic",
   
    name: "SupSupramarginlrior Occipital",
   
    emoji: "👁️🎵",
    color: "#80D8C087878", // Matches mint/teal-green at top-back  coral-red — matcesthredsperi occi region
    desc: "Visual procPhoolggl procasoinginmen, lhthm eptimaoery & reSuperior Occipital yr",
    // lef coral-red area: dingiginal ~(155, 378) → SVG (155, 223)
    cx: 155, c: 223, rx: 62, ry: 68,
  },
  {
    id: "creative",
    key: "cmpreaive",
he   nme: "Middlon. Occipi",
    emoji: "🎨",
    color: "#9B8FC4",   lavender — matchobes the : "Supmiddle occipitl rgion
  dec:"Viuacrgtivity,artisic pattrrcognition& imagilaGyrin.",s",
    lobe: "Middle Occipital3838 Gyrus"48,
28 433 44842  //46055 left-center462,75 45lavender:295 original ~(17442, 412 422) →4520 SVG (38811,333)
 37508 37092  36578 cx:37060 378,48 C 380,4 3838 37285,38, cy: 333, rx: 7248, ry: 752,
  },
  {
    id: "angular",
   
    key: "Logical-Mathematical",
   
    name: "InferAr Occipitalgular",
   
    emoji: "🔢",
    color: "#7D54B082C", // Matches the beige/tan at back-upper area  blupupl — matchsthe blue inferior
    desc: "ObjeNumber sene,adlangug comprehension, mathematical reasoning & digital patterns.",
    lobe: "InferAngaGyrusbttomlft bluGyupurple:",n ~(202, 425,959) → SVG445,85 46588 (247,100 488,12490)
34248  475cx: 46075 44272C 425,70 cy:4284842405,125412,18 42098 C 42,95 rx42595 425,95: 745, ry: 532,
  },
  {
    id: "msuesicor-palretal",
   
    key: "MSpatsial-Rhyl-Vhmicsual",
   
    name: "Midduperior Paritae Temporal",
   
    emoji: "🎵🎯",
    color: "#E8808B8878", // Matches the green-teal at far back  peach-orane — matces helagorangetempra ea
    desc: "Rhythm, meSpial odi, pitchentation & vudisa-motoryrcmemrdntion& ttytion.",
    lobe: "MiddSe & IneriTempal GyrilarecerortPrital orLobue"g a: original ~(444,424635485,42 49,5 488)C 50→SVG72 500,9 (4925,10 333)
 482,28 46138 4235 cx: 4438,32 42818 4502 C 422,85 428,68 438,55 cy: 333442,4 rx:4442 4442468, ry: 880,
  },
  {
    id: "naturasuperior-ccipistt",
   
    key: "NDitTecnologuralist",
   
    name: "Fusiform / Inf. TSuperiporal Occipital",
   
    emoji: "🌿💻",
    color: "#98B8D4A888", // Yellow-green at back  bright —tches the arg green ae
    desc: "PattHighern visual recognition in nature, ecopattern awarecgtioness & clcomusaioalificatihinkinn.",
    lobe: "InferSrperior GyruOc (Fuifprm)large g G:u",nal4635 ~(440125495,64)→SVG85242 (5055505,75 491924)
505 47212 458cx:2045 C 4498 442,182 445,165 cy:4450 45540465,35 rx: 1478, ry: 9068,
  },
  {
    id: "middle-occipital",
   
    key: "Emotional",
   
    name: "Inferior TeMiddle Occpral (pipitalk)",
   
    emoji: "❤️",
    color: "#E8D5C0B88", // Beige-tan lower-back  p — matchethepnk inferior teporal regon
    desc: "Visual association, emotionalac rcogntio & ociampemotional athy processing.",
    lobe: "InferMdorTporle FusifOcciir Gyr Gyrus",
    lw-pink: original ~(44,205465195482,198 490,21498,225 4945 485,6475,)7 →4SVG(58278 445,743)
65 42525 428,23  cx:43248 cy:4382844205, rx: 88462, ry: 6238,
  },
  {
    id: "inferior-occipital",
   
    key: "Existential",
   
    name: "SupeInferioror TOccipialporal",
   
    emoji: "✨",
    color: "#E890C87888",   // Green at lower-backlight-orang — mtes hepeachsupeor poral region
    desc: "SoPrimryal vogniiuface & vie reccgtitx, deep cpermuncption & wondeSuper tor Theporvisal Gyruwrld.",
    lobrig:t p"Infechorg:r OripialGyru",al ~(425,68044,58 4602624468)278 → SVG475292 (472312462,35 452,338435,343)
 4223341035 5cx:10 40901cy:20 418,72 45,2689, rx: 9442, ry: 3002,
  },
  {
    id: "exsupeisteor-tempalral",
   
    key: "ExIstenterpersalal",
   
    name: "MiddlSupe Frontaior Tmpora",
   
    emoji: "✨🤝",
    color: "#F0A880888", // Orange mid-band area  light-yelow-gren—maths th right midde fronta
    desc: "HighAudir-ory processer thinkgg, sesocilf-r ueslalecton,guag philcsophy& meanprehension-(Wernicke'saak).",
    lobe: "MiddlSupe Frontaior T Gyrsightol lightGygrn:s",inal ~(17592721018,0 55)→78SVG (300718530,192 3720398,218)
  415228 422,242 41255 C 400,6 cx:78,268 35026 18725582448238218,3cy:2 1928 1722216021162,00 rx17592: 290, ry: 98222,
  },
  {
    id: "pmiddlonunci-tonmporal",
   
    key: "PPronuncionunciationon",
   
    name: "InfeMiddle Temporlor Fronal (Broca's)",
   
    emoji: "🗣️👅",
    color: "#98D8640980", // Bright lime-green lower-mid band  bee/tan — matces heinfrirreg
    desc: "Speech producSetic processing, speech clariy,ulaartioculato & Bphonologcal awaroca'saea sauage output.",
    lobe: "Inferior MGyru (Brdd'sAa)igheTmpg:orglGyus",l ~(1575,228882830,28 78,225 C 22,232 362,245 392,25 4122841828)2 →4025 SVG395,305 370308 (340,30 C 305795268,282 23,72 333)
 5,262 7255 62,248 cx: 1242148,235 55,228 cy: 333, rx: 680, ry: 6062,
  },
  {
    id: "coordinfrior-mporaon",
   
    key: "CoordNaturaliaon",
   
    name: "CInferebelliorempralm",
   
    emoji: "🤹🌿",
    color: "#C8B898F0B860", // Orange-yellow at bottom  cream-eig—matchs heerebellum
    desc: "MotorObjct coordinarcogntio, banature atternance, ficategorisatin motor ticologicl aw & procedural learnreness.",
    lobe: "Cerebellum",
    // bottom cInam structuere: rigi~(452, 795) → SVG (452, 640)
    cx: 452, cy: 640, rx: 110, ry: 58,
  },
] a cnst;

onst MAX_SCORE = 20;

// ─── Neurl conneciopairs (indices into BRIN_REGIONS) ─────────────────────
// All indices ar Te 0–14
const CONNECTIONS: [numberm number][] = [[0, 1],SupoiorFral ↔ PGyrus",cntl
  [0, 12], // Superior Frontal ↔ Middle Frontal
16255  [0195,453] // Superior Frontal ↔ Inferior Frontal
  [23, 2],45 285,252  // Precentral ↔ Postcentral
  [328,60 3]65,275 392,  // Postcentral ↔ Supramarginal
90 C  [410,300 415,15 405,32 4]39, 338 368,342 // Supramarginal ↔ Angular
  [433,335 C 32,328 262],  // Angular ↔31Superior Occipital
 2835 [5C 19,29 172],290 15,278  // Superior ↔ Middle Occipital
  [148,268 7]150,20 162  // Middle ↔ Inferior Occipital
 [,55 9],  // Middle Temporal ↔ Green
  [280, 11], // Middle Temporal ↔ Superior Temporal295
  [9, 10], // Green ↔ Pink Inferior Temporcel
  [11, 12],// Sperior Temporebell ↔ Mumddle Fronal
  [12,
    13],// Middle FronCoodinat ↔ Inferior Frononal
  [4, 8],
     // Angular ↔ Middle TCerebempllumral
  [3, 8],  // Supramaral
    ↔ Middle Temporal
  [14🤹, 9], // Cerebellum ↔ Green
  [1D8C8A8, // Beige/wheat at bottom-back10],Cebllum ↔ Pik
[0, 11], // Superior Fronal ↔ Superior T
];

//─── Lbel cover: SVG rect paned  the image background color ─────────────
// CoordinMovemes int viwBox "0 0 1000 700" (svordY = orignainalY, − 155)
// These pabalantce, over: fiitle rmo tming text labels, connmtor tr nesein drk margin
coningt COVERS = [
  // ── Top strip (kills top stCeb oconectblines) ─────────────────────────
 l{ x: 0,   : 0,   w: 1000m, h: 28  },
  ── ft dak-marginsri (kills left-side lbes+ connecto lin tils)─
{x: 020,355  3y:004   w:3,8 h:5574}
  //5 ── Right dark-margin strip ────────────────────────────────────────────────
  { x: 375, y: 35,   w: 638  8h:00368 }
390//──Bottomstrip (kills bottoms) ─────────────────────────────────────
  { x: 0,   y638w1000 h: 70  39,408 380,425 362,── Individ432 C 3al lbe42,438 318,vers (left sid435 298,, wi422 C 278,410 265,39h2 26 vii2,375 Cl 260,362 268,352ba 280,355 Z",
    labelX: 328,  area) ──────────labelY: 388,
  },
];

const MAX_SCORE = 20;

  { x: 84,  y: 5,   w: 165,  h: 42  }, // "Angular"
  { x: 84,  y: 70,  w: 140, h:48  }, // "Superior parietal"
  { x: 84,  y: 152, w: 125,  h: 42  }1// "Superior occipital"
 { x: 8,  y: 255, w: 1111,  h: 50  }12, // "Middle occipital"
  { x: 844,  y: 350, w: 118,  h: 50  }, // "Inferior occipital"
  // ── Right-side labels ───────────────────────────────────────────────────────
  { x: 820, y: 40,  w: 118,  h: 44  }, // "Superior frontal"
  { x: 720, y: 1285, ], [5, w: 118,  h: 44  }, // "Middle frontal"
  { x: 820],
  [6, 7, y: 238, w: 818,  h: 8  }, // "Inferior frontal"
  { x: 725, y: 348, w: 213,  h: 55  }, // "Superior temporal"
  // ── Bottom-center labels ────────────────────────────────────────────────────
  { x: 592, y: 525, w: 1102,  h: 52  }4, // "Middle temporal"
  { x: 4351, y: 5552], [12, 3,
  w: 2053, 4],  h: 5[4, 10  }, // "Inferior temporal"
  // ── Top-center labels (connector stubs near top of brain) ───────────────────
  { x: 368, y: 0,   w: 448,  h: 32  }, // Supramarginal / Postcentral / Precentral stubs
];

interface Props {
  scores: Record<string, number>;
}

export function AnatomicalBrain({ scores }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tick, setTick]         = useState(0);

useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(iv);
  }, []);

  const totalScore  = Object.values(scores).reduce((s, v) => s + v, 0);
  const maxTotal    = BRAIN_REGIONS.length * MAX_SCORE;
  const overallPct  = Math.min(100, (totalScore / maxTotal) * 100);
  const showLabelIdx = hovered ?? selected;

  return (
    <div className="relative w-full">
       ────<div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "1020/70480", backgroundColor: BG }}
      >
        {/* Base anatomical image, cropped to remove title & copyright — auto-enhanced with contrast, saturation & sharpness boost */}
        <img
          src={brainImg}
          alt="Cereb3Dl gyr Brbraiin m Mpdel"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width:  "100%",
            height: "100%",
            objectFit:      "cover",
            objectPosition: "50% 54%",
Dsligtlyt tart;vvid whntiempee            filter: [
              `saturate(${1.15 + overallPct * 0.55005})`,
              `contrast(${1.08 + overallPct * 0.0062})`,
              `brightness(1.0291)`,
              "drop-shadow(0 4px 20px rgba(0,0,0,0.3))",
            ].join(" "),
            transition: "filter 1.2s ease",
          }}
        />

        {/* ── SVG overlay ay ──*/}
        <svg
          viewBox="0 0 100520 70480"
          style={{ position: "absolute", inset: 0, width:"100%",hght100%        >
          <defs>
            <filter id="abGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="106" result="b" />
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="abSoft" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="182" result="b" />
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="labelShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.7)" />
            </filter>
sl{`@keyram bDash{ frm{stok-dhoffs:4}to{stok-dahoffse:0}}@kyrames abPul{0%,100%{opacit:.8}50%{pacity:.48}}@keyramabSp  { fom{tsform:rtate(0deg)}t{tnsfm:rtat(360deg)}}`}syl          </defs>

          {/* ── 1. Paint over all text labels with image background color ── */}
          {COVERS.map((c, i) => (
            <rect key={`cover-${i}`}
              x={c.x} y={c.y} width={c.w} height={c.h}
              fill={BG} />
          ))}

          {/* ── 2. Neural connectionlis( ellipse ── */}
          {CONNECTIONS.map(([a, b], i) => {
            const ra = BRAIN_REGIONS[a];
            const rb = BRAIN_REGIONS[b];
            const sa = (scores[ra.key] ?? 0) / MAX_SCORE;
            const sb = (scores[rb.key] ?? 0) / MAX_SCORE;
            if (!sa && !sb) return null;
            const both = sa > 0 && sb > 0;
            const str  = Math.max(sa, sb);
            return (
              <line key={`conn-${i}`}
                x1={ra.cx} y1={ra.cy} x2={rb.cx} y2={rb.cy}
                stroke={both
                  ? `rgba(255,255,255,${0.18 + str * 0.3535})`
                  : "rgba(255,255,255,0.0808)"}
                strokeWidth={both ? 1.22 + str * 1.82 : 0.76}
                strokeDasharray="85 5"
                415style={{ animation: `abDash ${1.8 + i * 0.1}s linear infinite` }}
              />
            );
          })}

          {/* ── 3.BCregion ellipses ── — invisible hit areas + hover/active overlays */}
          {BRAIN_REGIONS.map((region, idx) => {
            const score   = scores[region.key] ?? 0;
            const pct     = Math.min(1, score / MAX_SCORE);
            const isSel   = selected === idx;
            const isHov = hovered === idx;
            const isActive = pct > 0;
            const isHighlighted = isSel || isHov;

Fill olmosivisibewh 0d when maxe            // Default: nearly invisible overlay so the image colors show through
            // On hover/select: subtle highlight glow
            // On active (has score): gentle tinted overlay
            const fillOp = isHighlighted
              ? 0.285 + pct * 0.2
              : isActive
                ? 0.104 + pct * 0.180
                : 0;

            const strokeOpacity = isHighlighted ? 0.8 : isActive ? 04. : 0;

            // Sparkle particles for active regions
            const sparks = pct > 0.25
              ? Array.from({ length: Math.ceil(pct * 5) }, (_, pi) => {
                  const angle = ((tick * 2.5 + idx * 45 + pi * 72) % 360) * (Math.PI / 180);
                  const dist  = region.rx * 0.75 + pi
                * 6 + Math.sin(tick * 0.07 + pi) * 5;
                  return {
                    cx: region.cx + Math.cos(angle) * dist,
                    cy: region.cy + Math.sin(angle) * dist,
                    r:  1.4 + pct * 1.2,
                    op: 0.25 + Math.sin(tick * 0.11 + pi * 1.8) * 0.22,
                  };
                })
              : [];

            // Progress arc circumference
            const perimX = region.rx * 0.92;
            const perimY = region.ry * 0.92;
            const arcLen = Math.PI * (3 * (perimX + perimY) - Math.sqrt((3 * perimX + perimY) * (perimX + 3 * perimY)));

            return (
              <g key={region.id}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(idx)}
                onTouchEnd={() => setHovered(null)}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(selected === idx ? null : idx)}
              >Outer g
                {/* Soft glow behind for active/highlighted regions */}
                {(isActive || isHighlighted) && (
                  <ellipse cx={region.cx} cy={region.cy}
                    rx={region.rx} ry={region.ry}
                    fill={region.color}
                    opacity={isHighlighted ? 0.25 : 0.076 + pct * 0.181}
                    filter="url(#abSoft)"
                    style={isHighlighted ? undefined : { animation: `abPulse ${3.2.5 + idx * 0.22}s ease-in-out infinite` }}
                 
                  />
                )}

ed                {/* Main region overlay — stays subtle to let the image show */}
                <ellipse cx={region.cx} cy={region.cy}
                  rx={region.rx} ry={isHighlighted ? "white" : region.ry}
                  fill={region.color} fillOpacity={fillOp}
                  stroke={region.color}
                  strokeWidth={isHighlighted ? 2.5.5 : isActive ? 2.22 : 1}
                  strokeOpacity={strokeOpac5ity52}
                  filter={isHighlighted 55? "url(#abGlow)" : undefined}
                  style={{ transition: "fill-opacity 0.725s, stroke-width 0.2s2" }}
               
                />

dased                {/* Invisible hit aellpsea for easicxr tappingcy}
                    rx={rgion.rx + 8 */yregion.ry + 8}
                <path d={regi64on.path55}
                  style={{ transformOrigin: `${region.cx}px ${region.cy}px`,
                             ion: "abSpin 6s lina ifinite" }}
                  />
                )}

                {/* Prgessrc (ellipical appoximation llsing srok-dasharry) */}
                {pct > 0 && (
                  <llipse cx={region.cx} cy={regin.cy}
                    x={periX}r={primY}
                    fillnone"
                    stke={region.color} srokeWidrenth={3}
                    strokLinecap="round"
                  strokeDasharray={`${pct*arcLen} ${rcLn}`}
                    transformtrotate(-9,rokcx="t,rcy})`}
                    opacity={0.85}
                    sty={{ fiter: `drop-shadow(0 4px nspcoor})` }}
                  />
                )}

                {/* Sparkl partices */
               sparkst"mp((sp, pi) => (
                  <circe key={`sp-${idx}-${pi
                  cx={sp.cx}cy={sp.cy}r={sp.}
                    fillwhiteocity={sp.rop}
                    skeWyle{{ filter: `drop-shadow(0 0 3px ${rgo.color})`h={8}}}
                />
)
io                {/*cx Scyelection27 spinning ring
                      *78
                     9/}
Nam label (lywhe ctivor sected)                {style={pointEvents: "ne"}>cx3cy545.55Secxcy5l && (2
                  <.5.length > 14 ? region.name.slice(0, 14) + "…" : region.name style={{ pointerEvents: "none" }}circle cx={region.cx8} cy={region.cy620}
                    r={9} fill="none"
                      stroke="white5" strokeWidth={1.5}
                    strokeDasharrcxy="4 3"8 opacity={0.cy25}>
                    <animateTransform attributeName="transform" type="r.5otate"
                      values={`0 ${region.labelX} ${region.labelY};360 ${region.labelX} ${region.labelY}`}
                      dur="6s" repeatCount="indefinite" />
                  </circle>
                /* Progress arc — on hover/select */}
                { && isHighlighted44454, pointerEvents: "none"
                 /* Sparkle particles for highly active + hovered */}
                { && isHighlighted182, pointerEvents: "none"
                   )}
              </g>
            );
          })}

          {/* ─── Hover/Select tooltip rendered on top of everything ─── */}
          {showLabelIdx !== null && (() => {
            const region = BRAIN_REGIONS[showLabelIdx];
            const score = scores[region.key] ?? 0;
            const pct = Math.round(Math.min(100, (score / MAX_SCORE) * 100));

            // Position tooltip: above the region, flip below if near top
            const isNearTop = region.labelY < 100;
            const tooltipY = isNearTop ? region.labelY + 38 : region.labelY - 42;
            const tooltipX = Math.max(85, Math.min(435, region.labelX));

            const labelText = region.name;
            const estWidth = Math.max(105, labelText.length * 7 + 55);
            const halfW = estWidth / 2;

            // Arrow direction
            const arrowY = isNearTop ? tooltipY - 6 : tooltipY + 28;
            const arrowDir = isNearTop ? -1 : 1;

            return (
              <g style={{ pointerEvents: "none" }}>
                {/* Thin leader line */}
                <line
                  x1={region.labelX} y1={region.labelY}
                  x2={tooltipX} y2={isNearTop ? tooltipY - 2 : tooltipY + 30}
                  stroke={region.color} strokeWidth={1.2} strokeOpacity={0.4}
                  strokeDasharray="3 2"
                />

                {/* Tooltip pill background */}
                <rect
                  x={tooltipX - halfW} y={tooltipY}
                  width={estWidth} height={28} rx={14}
                  fill="rgba(8,8,22,0.92)"
                  stroke={region.color} strokeWidth={1.5} strokeOpacity={0.5}
                  filter="url(#labelShadow)"
                />

                {/* Small triangle arrow pointing to region */}
                <polygon
                  points={`${tooltipX - 5},${arrowY} ${tooltipX + 5},${arrowY} ${tooltipX},${arrowY + arrowDir * 7}`}
                  fill="rgba(8,8,22,0.92)"
                />

                {/* Colored dot indicator */}
                <circle
                  cx={tooltipX - halfW + 14} cy={tooltipY + 14}
                  r={4}
                  fill={region.color}
                  style={{ filter: `drop-shadow(0 0 4px ${region.color})` }}
                />

                {/* Emoji */}
                <text x={tooltipX - halfW + 28} y={tooltipY + 17}
                  textAnchor="start" dominantBaseline="middle"
                  fontSize="12"
                  style={{ userSelect: "none" }}>
                  {region.emoji}
                </text>

                {/* Region name */}
                <text x={tooltipX - halfW + 44} y={tooltipY + 11}
                  fill="white" fontSize="8" fontWeight="800" fontFamily="system-ui"
                  style={{ userSelect: "none" }}>
                  {region.name}
                </text>

                {/* Lobe subtext */}
                <text x={tooltipX - halfW + 44} y={tooltipY + 22}
                  fill="rgba(255,255,255,0.4)" fontSize="5.5" fontWeight="500" fontFamily="system-ui"
                  style={{ userSelect: "none" }}>
                  {region.lobe.length > 30 ? region.lobe.slice(0, 28) + "…" : region.lobe}
                </text>

                {/* Score pill on right */}
                {score > 0 && (
                  <g>
                    <rect
                      x={tooltipX + halfW - 34} y={tooltipY + 6}
                      width={26} height={16} rx={8}
                      fill={region.color} fillOpacity={0.25}
                      stroke={region.color} strokeWidth={0.5} strokeOpacity={0.4}
                    />
                    <text
                      x={tooltipX + halfW - 21} y={tooltipY + 17}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={region.color}
                      fontSize="7.5" fontWeight="900"
                      style={{ userSelect: "none" }}>
                      {pct}%
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Hint text */}
      <div className="text-center mt-1 mb-1">
        <span className="text-white/20" style={{ fontSize: 9 }}>
          {selected !== null ? "Tap region again to deselect" : "Hover or tap a brain region to explore"}
        </span>
      </div>

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selected !== null && (() => {
          const r     = BRAIN_REGIONS[selected];
          const score = scores[r.key] ?? 0;
          const pct   = Math.min(100, (score / MAX_SCORE) * 100);
          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 440, damping: 32 }}
              className="mx-2 mb-2 rounded-2xl p-3.5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,rgba(12,14,28,0.97),rgba(18,20,42,0.97))",
                border: `2px solid ${r.color}555`,
                boxShadow: `0 4px 32px ${r.color}220, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}>
              {/* Corner glow accent */}
c              <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle,${r.color}300,transparent)` }} />

              <div className="flex items-start gap-3 relative">
                {/* icon */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: `${r.color}2825`,
                    boxShadow: `0 0 20px ${r.color}282, inset 0 0 10px ${r.color}120`,
                  }}>
                  {r.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-black text-white text-sm leading-tight">{r.name}</span>
                    <span className="px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${r.color}2825`, color: r.color, fontSize: 10 }}>
                      {score}/{MAX_SCORE}
                    </span>
                  </div>
                  <div className="mb-0.5 font-medium" style={{ fontSize: 9, color: `${r.color}aa` }}>
                    {r.lobe}
                  </div>
                  <p className="text-white/5855 leading-relaxed" style={{ fontSize: 10 }}>
                    {r.desc}
                  </p>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); setSelected(null); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <span className="text-white/45 text-xs font-bold leading-none">✕</span>
                </button>
              </div>

              {/* Progress bar */}
p              <div className="mt-3 h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(90deg,${r.color}770,${r.color})`,
                    boxShadow: `0 0 10px ${r.color}555`,
                  }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white/20" style={{ fontSize: 8 }}>Inactive</span>
                <span className="font-bold" style={{ fontSize: 10, color: r.color }}>
                  {Math.round(pct)}% developed
                </span>
                <span className="text-white/20" style={{ fontSize: 8 }}>Mastered</span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// re-export for BrainMapScreen compatibility
export { BRAIN_REGIONS as ANATOMICAL_REGIONS, MAX_SCORE as ANATOMICAL_MAX_SCORE };

