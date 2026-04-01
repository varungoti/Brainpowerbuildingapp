import React from "react";
import { useApp } from "../context/AppContext";

const FEATURES = [
  { emoji:"🌍", title:"25+ Global Methods", desc:"Vedic Math · Shichida · Montessori · Origami · Kumon · Waldorf · Reggio Emilia and more", color:"#E63946", bg:"#FFF0F0" },
  { emoji:"🧠", title:"15 Brain Regions", desc:"Full neuro-mapping: language, memory, creativity, motor, EQ, executive function & more", color:"#7209B7", bg:"#F5F0FF" },
  { emoji:"🏠", title:"Zero Cost Forever", desc:"Every activity uses only household materials — rice, paper, spoons, stones", color:"#06D6A0", bg:"#EDFFF8" },
  { emoji:"⚡", title:"AGE Algorithm", desc:"AI-grade algorithm selects 3–5 optimal activities daily for each child", color:"#4361EE", bg:"#EEF1FF" },
  { emoji:"📊", title:"Brain Map Tracking", desc:"Visualise your child's development across all 15 brain regions in real time", color:"#FFB703", bg:"#FFFBEF" },
  { emoji:"🎯", title:"Age-Calibrated", desc:"Every activity is calibrated to 6 developmental tiers, ages 0–10", color:"#F72585", bg:"#FFF0F7" },
];

const RESEARCH_STATS = [
  { value:"↑32%", label:"attention span with regular Yoga practice (Harvard Med School)" },
  { value:"↑2×", label:"recall with Spaced Repetition vs massed practice (Cepeda et al. 2006)" },
  { value:"↑3×", label:"mental math speed with Abacus training (Journal of Neuroscience)" },
  { value:"↑30%", label:"academic achievement with Growth Mindset interventions (Dweck, Stanford)" },
];

export function LandingScreen() {
  const { navigate, setAuthMode } = useApp();
  return (
    <div className="h-full overflow-y-auto" style={{ background:"linear-gradient(160deg,#0f0c29 0%,#302b63 50%,#1a1a2e 100%)" }}>
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute w-64 h-64 rounded-full opacity-20 animate-orb" style={{ background:"radial-gradient(circle,#7209B7,transparent)", top:"-40px", right:"-40px" }}/>
        <div className="absolute w-48 h-48 rounded-full opacity-15 animate-orb" style={{ background:"radial-gradient(circle,#4361EE,transparent)", bottom:"120px", left:"-20px", animationDelay:"2s" }}/>
        <div className="absolute w-32 h-32 rounded-full opacity-10 animate-orb" style={{ background:"radial-gradient(circle,#F72585,transparent)", top:"40%", right:"10%", animationDelay:"4s" }}/>
      </div>

      <div className="relative px-5 pt-12 pb-8">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 animate-brain-pulse"
            style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)", boxShadow:"0 0 40px rgba(67,97,238,0.5)" }}>
            <span style={{ fontSize:40 }}>🧠</span>
          </div>
          <div className="text-white font-black mb-1" style={{ fontSize:32, letterSpacing:"-0.5px" }}>NeuroSpark</div>
          <div className="animate-gradient rounded-full px-4 py-1 inline-block mb-3"
            style={{ background:"linear-gradient(90deg,#4361EE,#F72585,#7209B7,#4361EE)", backgroundSize:"300% 100%" }}>
            <span className="text-white text-xs font-semibold tracking-wide">RESEARCH-BACKED BRAIN DEVELOPMENT</span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
            Daily activities that grow every dimension of your child's brain — using only what you already have at home.
          </p>
        </div>

        {/* Research stats bar */}
        <div className="glass rounded-2xl p-4 mb-6 animate-slide-up stagger-1">
          <p className="text-white/40 text-center mb-3" style={{ fontSize:10, letterSpacing:"2px" }}>RESEARCH EVIDENCE</p>
          <div className="grid grid-cols-2 gap-2">
            {RESEARCH_STATS.map((s, i) => (
              <div key={i} className="text-center px-2 py-2 rounded-xl" style={{ background:"rgba(255,255,255,0.05)" }}>
                <div className="text-white font-black animate-gradient"
                  style={{ fontSize:22, background:"linear-gradient(90deg,#F72585,#FFB703)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200% 100%" }}>
                  {s.value}
                </div>
                <div className="text-white/50 leading-tight" style={{ fontSize:9 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 text-center mb-4" style={{ fontSize:9 }}>
          Statistics from peer-reviewed research; individual results vary.
        </p>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-7 animate-slide-up stagger-2">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2" style={{ background:f.bg }}>
                {f.emoji}
              </div>
              <div className="text-white font-bold mb-0.5" style={{ fontSize:12 }}>{f.title}</div>
              <div className="text-white/50" style={{ fontSize:10, lineHeight:1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Who is it for */}
        <div className="glass rounded-2xl p-4 mb-7 animate-slide-up stagger-3">
          <p className="text-white/60 text-center mb-3" style={{ fontSize:11, letterSpacing:"1px" }}>DESIGNED FOR PARENTS OF CHILDREN 0–10</p>
          <div className="flex items-center gap-3">
            {["0–12 mo\n🌸 Blossom", "1–2 yrs\n🌱 Seedling", "3–4 yrs\n🌿 Sprout", "5–6 yrs\n🌳 Sapling", "7–10 yrs\n🌲 Forest"].map((t, i) => {
              const [age, label] = t.split("\n");
              return (
                <div key={i} className="flex-1 text-center py-2 rounded-xl" style={{ background:"rgba(255,255,255,0.08)" }}>
                  <div className="text-lg">{label.split(" ")[0]}</div>
                  <div className="text-white/80" style={{ fontSize:8 }}>{age}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 animate-slide-up stagger-4">
          <button
            onClick={() => { setAuthMode("signup"); navigate("auth"); }}
            className="w-full py-4 rounded-2xl text-white font-bold relative overflow-hidden animate-pulse-glow"
            style={{ background:"linear-gradient(135deg,#F72585,#7209B7)", boxShadow:"0 8px 32px rgba(247,37,133,0.4)" }}
          >
            <span className="relative z-10" style={{ fontSize:16 }}>Get Started Free →</span>
            <div className="absolute inset-0 animate-shimmer" />
          </button>
          <button
            onClick={() => { setAuthMode("login"); navigate("auth"); }}
            className="w-full py-3.5 rounded-2xl font-semibold"
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.85)" }}
          >
            I already have an account
          </button>
        </div>

        <p className="text-center text-white/30 mt-5" style={{ fontSize:10 }}>
          Free forever · No ads · No personal data sold · Built by parents, for parents
        </p>
      </div>
    </div>
  );
}
