import React, { useEffect, useState } from "react";
import { useApp, AVATAR_EMOJIS, AVATAR_COLORS } from "../context/AppContext";
import { MATERIAL_OPTIONS, getAgeTierConfig } from "../data/activities";
import { captureProductEvent } from "@/utils/productAnalytics";

export function OnboardingScreen() {
  const { view } = useApp();
  if (view === "onboard_welcome")   return <StepWelcome />;
  if (view === "onboard_child")     return <StepChild />;
  if (view === "onboard_materials") return <StepMaterials />;
  if (view === "onboard_ready")     return <StepReady />;
  return null;
}

function useOnboardStepView(step: "welcome" | "child" | "materials" | "ready") {
  // Fire-and-forget funnel beacon — once per mount of each step component.
  // Lives here (not inside each Step*) so the call site is uniform and we
  // can extend the dimensionality (locale, ab_bucket, …) in one place later.
  useEffect(() => {
    captureProductEvent("onboard_step_view", {
      screen: `onboard_${step}`,
      step,
    });
  }, [step]);
}

function StepWelcome() {
  const { user, navigate } = useApp();
  useOnboardStepView("welcome");
  return (
    <div className="h-full flex flex-col px-5 py-8" style={{ background:"linear-gradient(160deg,#0f0c29,#302b63)" }}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl animate-float mb-6">👋</div>
        <div className="text-white font-black mb-3" style={{ fontSize:28 }}>
          Welcome, {user?.name?.split(" ")[0]}!
        </div>
        <p className="text-white/70 text-sm leading-relaxed mb-8">
          Let's set up your first child's profile. NeuroSpark will personalise every activity based on their age, developmental stage, and what you have at home.
        </p>
        <div className="space-y-3 w-full max-w-sm">
          {["Choose your child's age & avatar", "Tell us what's in your kitchen & cupboard", "Generate your first activity pack!"].map((s, i) => (
            <div key={i} className="flex items-center gap-3 glass rounded-2xl p-3.5 text-left">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)", fontSize:12 }}>{i+1}</div>
              <span className="text-white/80 text-sm">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => navigate("onboard_child")}
        className="w-full py-4 rounded-2xl font-bold text-white mt-6"
        style={{ background:"linear-gradient(135deg,#F72585,#7209B7)", boxShadow:"0 8px 24px rgba(247,37,133,0.4)" }}>
        Set Up My Child →
      </button>
    </div>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 1 - i);
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StepChild() {
  const { addChild, navigate } = useApp();
  useOnboardStepView("child");
  const [name, setName]   = useState("");
  const [year, setYear]   = useState(CURRENT_YEAR - 4);
  const [month, setMonth] = useState(0);
  const [avatarEmoji, setAvatarEmoji] = useState(AVATAR_EMOJIS[0]);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [adding, setAdding] = useState(false);

  const dob = `${year}-${String(month + 1).padStart(2,"0")}-15`;
  const desc = (() => {
    const age = CURRENT_YEAR - year - (month > new Date().getMonth() ? 1 : 0);
    const t = age < 1 ? 0 : age < 3 ? 1 : age < 5 ? 2 : age < 7 ? 3 : age < 9 ? 4 : 5;
    return getAgeTierConfig(t);
  })();

  const handleAdd = () => {
    if (!name.trim()) return;
    setAdding(true);
    setTimeout(() => {
      addChild({ name: name.trim(), dob, avatarEmoji, avatarColor });
      navigate("onboard_materials");
    }, 600);
  };

  return (
    <div className="h-full overflow-y-auto px-5 py-6" style={{ background:"linear-gradient(160deg,#0f0c29,#1a1a2e)" }}>
      <StepDots current={1} />
      <div className="text-center mb-6 animate-slide-up">
        <div className="text-3xl font-black text-white mb-1">Your Child's Profile</div>
        <p className="text-white/50 text-xs">This personalises every activity for their brain stage</p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center mb-6 animate-pop-in">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl animate-pulse-glow"
          style={{ background:`linear-gradient(135deg,${avatarColor},${avatarColor}99)`, boxShadow:`0 0 30px ${avatarColor}60` }}>
          {avatarEmoji}
        </div>
      </div>

      {/* Name */}
      <div className="mb-4 animate-slide-up stagger-1">
        <label className="text-white/60 text-xs mb-1.5 block">Child's Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Arjun, Aisha, Leo..."
          className="w-full px-4 py-3.5 rounded-2xl outline-none text-white"
          style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", caretColor:"white" }}/>
      </div>

      {/* Date of birth */}
      <div className="mb-4 animate-slide-up stagger-2">
        <label className="text-white/60 text-xs mb-1.5 block">Birth Year & Month</label>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(+e.target.value)}
            className="flex-1 px-3 py-3.5 rounded-2xl outline-none text-white text-sm"
            style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)" }}>
            {YEARS.map(y => <option key={y} value={y} style={{ background:"#1a1a2e" }}>{y}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(+e.target.value)}
            className="flex-1 px-3 py-3.5 rounded-2xl outline-none text-white text-sm"
            style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)" }}>
            {MONTHS.map((m, i) => <option key={i} value={i} style={{ background:"#1a1a2e" }}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background:`${desc.color}20` }}>
          <span className="text-lg">{desc.emoji}</span>
          <span className="text-xs font-semibold" style={{ color:desc.color }}>{desc.label} — {desc.desc} Stage</span>
        </div>
      </div>

      {/* Avatar emoji */}
      <div className="mb-4 animate-slide-up stagger-3">
        <label className="text-white/60 text-xs mb-1.5 block">Avatar</label>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_EMOJIS.map(e => (
            <button key={e} onClick={() => setAvatarEmoji(e)}
              className="w-11 h-11 rounded-xl text-2xl transition-all"
              style={{ background: avatarEmoji===e ? avatarColor+"40" : "rgba(255,255,255,0.08)", border:`2px solid ${avatarEmoji===e ? avatarColor : "transparent"}`, transform:avatarEmoji===e?"scale(1.15)":"scale(1)" }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="mb-6 animate-slide-up stagger-4">
        <label className="text-white/60 text-xs mb-1.5 block">Profile Colour</label>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_COLORS.map(c => (
            <button key={c} onClick={() => setAvatarColor(c)}
              className="w-9 h-9 rounded-full transition-all"
              style={{ background:c, transform:avatarColor===c?"scale(1.2)":"scale(1)", boxShadow:avatarColor===c?`0 0 12px ${c}80`:"none" }}>
              {avatarColor===c && <span className="text-white flex items-center justify-center w-full h-full" style={{ fontSize:14 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleAdd} disabled={!name.trim() || adding}
        className="w-full py-4 rounded-2xl font-bold text-white"
        style={{ background: name.trim() ? "linear-gradient(135deg,#4361EE,#7209B7)" : "rgba(255,255,255,0.1)" }}>
        {adding ? "Creating Profile..." : "Next: Materials →"}
      </button>
    </div>
  );
}

function StepMaterials() {
  const { materialInventory, setMaterialInventory, navigate } = useApp();
  useOnboardStepView("materials");
  const toggle = (id: string) =>
    setMaterialInventory(materialInventory.includes(id) ? materialInventory.filter(m => m !== id) : [...materialInventory, id]);

  return (
    <div className="h-full overflow-y-auto px-5 py-6" style={{ background:"linear-gradient(160deg,#0f0c29,#1a1a2e)" }}>
      <StepDots current={2} />
      <div className="text-center mb-5 animate-slide-up">
        <div className="text-3xl font-black text-white mb-1">What's at Home?</div>
        <p className="text-white/50 text-xs">Tap what you have — the algorithm only generates activities you can actually do right now</p>
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMaterialInventory(MATERIAL_OPTIONS.map(m => m.id))}
          className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background:"rgba(67,97,238,0.3)", color:"#a5b4fc" }}>
          Select All
        </button>
        <button onClick={() => setMaterialInventory([])}
          className="px-3 py-1.5 rounded-full text-xs" style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)" }}>
          Clear
        </button>
        <span className="ml-auto text-xs text-white/40 flex items-center">{materialInventory.length} selected</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {MATERIAL_OPTIONS.map((m, i) => {
          const sel = materialInventory.includes(m.id);
          return (
            <button key={m.id} onClick={() => toggle(m.id)}
              className={`flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all animate-slide-up stagger-${Math.min(i%6+1,6)}`}
              style={{ background:sel?"rgba(67,97,238,0.25)":"rgba(255,255,255,0.05)", border:`1px solid ${sel?"rgba(67,97,238,0.6)":"rgba(255,255,255,0.1)"}` }}>
              <span className="text-xl">{m.emoji}</span>
              <span className="text-xs font-medium" style={{ color:sel?"#a5b4fc":"rgba(255,255,255,0.7)" }}>{m.label}</span>
              {sel && <span className="ml-auto text-xs" style={{ color:"#4361EE" }}>✓</span>}
            </button>
          );
        })}
      </div>
      <button onClick={() => navigate("onboard_ready")} disabled={materialInventory.length === 0}
        className="w-full py-4 rounded-2xl font-bold text-white"
        style={{ background:materialInventory.length ? "linear-gradient(135deg,#06D6A0,#4361EE)" : "rgba(255,255,255,0.1)" }}>
        Next: All Ready! →
      </button>
    </div>
  );
}

function StepReady() {
  const { navigate, activeChild } = useApp();
  useOnboardStepView("ready");
  return (
    <div className="h-full flex flex-col items-center justify-center px-5 py-8 text-center"
      style={{ background:"linear-gradient(160deg,#0f0c29,#302b63)" }}>
      <div className="text-6xl mb-5 animate-pop-in">🎉</div>
      <div className="text-white font-black mb-2 animate-slide-up" style={{ fontSize:26 }}>
        {activeChild?.name}'s Profile is Ready!
      </div>
      <p className="text-white/60 text-sm mb-8 animate-slide-up stagger-1">
        The Activity Generation Engine is calibrated for {activeChild?.name}'s brain stage. Ready to generate your first activity pack!
      </p>
      <div className="space-y-3 w-full mb-8 animate-slide-up stagger-2">
        {[
          { emoji:activeChild?.avatarEmoji??"🧠", label:`${activeChild?.name}'s Profile`, value:"Ready ✓", color:activeChild?.avatarColor??"#4361EE" },
          { emoji:"🏠", label:"Materials Inventory", value:"Configured ✓", color:"#06D6A0" },
          { emoji:"⚡", label:"AGE Algorithm", value:"Calibrated ✓", color:"#FFB703" },
        ].map((item,i) => (
          <div key={i} className="flex items-center gap-3 glass rounded-2xl p-3.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background:`${item.color}20` }}>{item.emoji}</div>
            <span className="text-white/80 text-sm flex-1">{item.label}</span>
            <span className="text-xs font-semibold" style={{ color:"#06D6A0" }}>{item.value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          captureProductEvent("onboard_complete", {
            screen: "onboard_ready",
            age_tier: activeChild?.ageTier,
          });
          navigate("home");
        }}
        className="w-full py-4 rounded-2xl font-bold text-white animate-pulse-glow"
        style={{ background:"linear-gradient(135deg,#F72585,#7209B7)", boxShadow:"0 8px 32px rgba(247,37,133,0.5)" }}>
        Generate First Activities ⚡
      </button>
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex justify-center gap-2 mb-5">
      {[0,1,2].map(i => (
        <div key={i} className="rounded-full transition-all"
          style={{ width:i===current?20:8, height:8,
            background:i===current?"linear-gradient(90deg,#F72585,#7209B7)":"rgba(255,255,255,0.2)" }}/>
      ))}
    </div>
  );
}