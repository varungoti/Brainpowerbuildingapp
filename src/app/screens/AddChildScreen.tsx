import { useState } from "react";
import { useApp, AVATAR_EMOJIS, AVATAR_COLORS } from "../context/AppContext";
import { AGE_TIER_CONFIG, getAgeTierConfig } from "../data/activities";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - i); // include current year for babies
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function AddChildScreen() {
  const { addChild, navigate, goBack } = useApp();
  const [name, setName]           = useState("");
  const [year, setYear]           = useState(CURRENT_YEAR - 4);
  const [month, setMonth]         = useState(0);
  const [avatarEmoji, setEmoji]   = useState(AVATAR_EMOJIS[0]);
  const [avatarColor, setColor]   = useState(AVATAR_COLORS[0]);
  const [saving, setSaving]       = useState(false);

  const dob = `${year}-${String(month+1).padStart(2,"0")}-15`;
  const age  = CURRENT_YEAR - year - (month > new Date().getMonth() ? 1 : 0);
  const tier = age < 1?0:age < 3?1:age<5?2:age<7?3:age<9?4:5;
  const tierCfg = getAgeTierConfig(tier);

  const handleSave = () => {
    if (!name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      addChild({ name:name.trim(), dob, avatarEmoji, avatarColor });
      navigate("home");
    }, 600);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#F0EFFF" }}>
      <div className="rounded-b-3xl mb-4 px-4 pt-3 pb-5"
        style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)" }}>
        <button onClick={goBack} className="w-8 h-8 rounded-full glass flex items-center justify-center mb-3">
          <span className="text-white">‹</span>
        </button>
        <div className="text-white font-black text-xl">Add Child Profile</div>
        <div className="text-white/60 text-xs mt-1">Each child gets their own personalised journey</div>
      </div>

      <div className="px-4 pb-6 space-y-5">
        {/* Preview */}
        <div className="flex justify-center animate-pop-in">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl animate-float"
              style={{ background:`linear-gradient(135deg,${avatarColor},${avatarColor}99)`, boxShadow:`0 0 30px ${avatarColor}50` }}>
              {avatarEmoji}
            </div>
            <div className="text-gray-700 font-bold text-base">{name || "Child's Name"}</div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background:`${tierCfg.color}20` }}>
              <span>{tierCfg.emoji}</span>
              <span className="text-xs font-semibold" style={{ color:tierCfg.color }}>{tierCfg.label} · {tierCfg.desc}</span>
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-gray-600 text-xs font-semibold mb-1.5 block">Child's Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Arjun, Emma, Yuki..."
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 outline-none text-gray-800 bg-white"/>
        </div>

        {/* DOB */}
        <div>
          <label className="text-gray-600 text-xs font-semibold mb-1.5 block">Year & Month of Birth</label>
          <div className="flex gap-2">
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="flex-1 px-3 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-800 outline-none text-sm">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="flex-1 px-3 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-800 outline-none text-sm">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m.slice(0,3)}</option>)}
            </select>
          </div>
        </div>

        {/* Avatar */}
        <div>
          <label className="text-gray-600 text-xs font-semibold mb-1.5 block">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className="w-11 h-11 rounded-xl text-2xl border-2 transition-all"
                style={{ background:avatarEmoji===e?`${avatarColor}30`:"white", borderColor:avatarEmoji===e?avatarColor:"#e5e7eb", transform:avatarEmoji===e?"scale(1.2)":"scale(1)" }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Colour */}
        <div>
          <label className="text-gray-600 text-xs font-semibold mb-1.5 block">Profile Colour</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-9 h-9 rounded-full transition-all"
                style={{ background:c, transform:avatarColor===c?"scale(1.25)":"scale(1)", boxShadow:avatarColor===c?`0 0 12px ${c}80`:"none" }}>
                {avatarColor===c && <span className="flex w-full h-full items-center justify-center text-white" style={{ fontSize:14 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={!name.trim()||saving}
          className="w-full py-4 rounded-2xl font-bold text-white"
          style={{ background:name.trim()?"linear-gradient(135deg,#4361EE,#7209B7)":"#e5e7eb" }}>
          {saving ? "Creating..." : "Create Profile →"}
        </button>
      </div>
    </div>
  );
}