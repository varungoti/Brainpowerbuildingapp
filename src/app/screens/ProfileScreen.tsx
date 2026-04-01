import React, { useRef, useState } from "react";
const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? "1.0";
import { useApp, getLevelFromBP } from "../context/AppContext";
import { MATERIAL_OPTIONS, getAgeTierConfig } from "../data/activities";
import { usePwaInstallPrompt } from "@/utils/pwaInstall";
import { canAccessBlueprint } from "@/utils/adminAccess";
import { TEXT_SCALE_PRESETS, persistTextScale, readTextScaleFromLocalStorage } from "@/utils/textScale";

const INNOVATION_IDEAS = [
  { emoji:"🤖", title:"AI Activity Adaptation",       desc:"On-device ML adapts difficulty based on rolling engagement ratings across all families (privacy-first).", color:"#4361EE" },
  { emoji:"📄", title:"Weekly Intelligence Report",   desc:"Auto-generated PDF showing 15 brain-region coverage — shareable with teachers or pediatricians.", color:"#F72585" },
  { emoji:"👨‍👩‍👧‍👦", title:"Sibling Collaboration Mode", desc:"Activities designed for 2+ children at different ages — builds interpersonal intelligence together.", color:"#06D6A0" },
  { emoji:"🗣️", title:"Voice Instruction Mode",      desc:"Audio-guided activity narration so parents don't need to look at the screen while doing activities.", color:"#FFB703" },
  { emoji:"🌏", title:"10-Language Support",          desc:"Full localisation: Hindi, Tamil, Mandarin, Korean, Spanish, Arabic, Bengali, Portuguese, French, Swahili.", color:"#7209B7" },
  { emoji:"📸", title:"Creation Portfolio",           desc:"Camera module to photograph child's creations — auto-tagged with intelligence type and developmental stage.", color:"#E63946" },
  { emoji:"🧑‍🏫", title:"Parent Coaching Mode",       desc:"'How to interact' guidance for each activity — not just what to do but HOW to deepen the learning.", color:"#0077B6" },
  { emoji:"🌦️", title:"Seasonal Activity Library",   desc:"Monsoon, summer, winter activity sets — grounded in local seasons and cultural celebrations.", color:"#2DC653" },
  { emoji:"🧩", title:"Sensory Modification Engine",  desc:"One-tap to adapt any activity for sensory sensitivities, ADHD, autism spectrum, or visual impairments.", color:"#FB5607" },
  { emoji:"🤝", title:"Community Activity Ratings",  desc:"Anonymous global rating data improves activity recommendations for all children over time.", color:"#118AB2" },
];

export function ProfileScreen() {
  const {
    user,
    children,
    activeChild,
    setActiveChild,
    navigate,
    logoutUser,
    materialInventory,
    setMaterialInventory,
    exportLocalDataBackup,
    importLocalDataBackup,
  } = useApp();
  const [showMaterials, setShowMaterials] = useState(false);
  const [showInnovation, setShowInnovation] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canInstall, isInstalled, promptInstall } = usePwaInstallPrompt();
  const [textScale, setTextScale] = useState(readTextScaleFromLocalStorage);
  const showAdminDocs = canAccessBlueprint(user);

  const toggle = (id: string) =>
    setMaterialInventory(materialInventory.includes(id) ? materialInventory.filter(m=>m!==id) : [...materialInventory, id]);

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#F0EFFF" }}>
      {/* Header */}
      <div className="rounded-b-3xl mb-4 px-4 pt-3 pb-5"
        style={{ background:"linear-gradient(135deg,#14213D,#3A0CA3)" }}>
        <div className="text-white/70 text-xs mb-1">Account</div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)" }}>👤</div>
          <div>
            <div className="text-white font-black text-lg">{user?.name}</div>
            <div className="text-white/50 text-xs">{user?.email}</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Child profiles */}
        <Section title="Child Profiles" icon="👶">
          <div className="space-y-2">
            {children.map(c => {
              const tier = getAgeTierConfig(c.ageTier);
              const lvl  = getLevelFromBP(c.brainPoints);
              return (
                <button key={c.id} onClick={() => setActiveChild(c.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border text-left transition-all active:scale-98"
                  style={{ borderColor:c.id===activeChild?.id?"#4361EE":"#e5e7eb",
                    boxShadow:c.id===activeChild?.id?"0 0 0 2px rgba(67,97,238,0.3)":"none" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background:`${c.avatarColor}25` }}>{c.avatarEmoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{c.name}</span>
                      {c.id===activeChild?.id && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">Active</span>}
                    </div>
                    <div className="text-gray-400 text-xs">{tier.label} · {lvl.name} · {c.brainPoints} BP</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-base">{tier.emoji}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width:`${Math.min(c.totalActivities*8,100)}%`, background:lvl.color }}/>
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-300">›</span>
                </button>
              );
            })}
            <button onClick={() => navigate("add_child")}
              className="w-full flex items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-50">➕</div>
              <span className="text-gray-500 text-sm font-semibold">Add Another Child</span>
            </button>
          </div>
        </Section>

        {/* Backup / new device (local file — cloud sync still planned) */}
        <Section title="Backup & new device" icon="💾">
          <p className="text-gray-500 text-xs mb-2 leading-relaxed">
            Download a JSON backup before switching phones or browsers. The file includes child names and any notes —{" "}
            <strong>keep it private</strong>. Milestone completion, check-ins, and child progress now round-trip too. Restoring <strong>replaces</strong> all data on this device.
          </p>
          <button
            type="button"
            onClick={() => setShowBackup((s) => !s)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200 mb-2"
          >
            <span className="text-gray-700 text-sm">{showBackup ? "Hide" : "Show"} backup tools</span>
            <span className="text-gray-400">{showBackup ? "▲" : "▼"}</span>
          </button>
          {showBackup && (
            <div className="space-y-2 animate-slide-up">
              <button
                type="button"
                onClick={() => {
                  const json = exportLocalDataBackup();
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  const d = new Date().toISOString().slice(0, 10);
                  a.href = url;
                  a.download = `neurospark-backup-${d}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setImportError(null);
                }}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
              >
                Download backup (.json)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setImportError(null);
                  const reader = new FileReader();
                  reader.onload = () => {
                    const text = typeof reader.result === "string" ? reader.result : "";
                    if (!text.trim()) {
                      setImportError("Empty file.");
                      return;
                    }
                    setPendingImportJson(text);
                  };
                  reader.onerror = () => setImportError("Could not read file.");
                  reader.readAsText(file, "UTF-8");
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-2xl bg-white border-2 border-dashed border-gray-300 text-gray-700 font-semibold text-sm"
              >
                Choose backup to restore…
              </button>
              {importError && (
                <p className="text-red-600 text-xs text-center bg-red-50 rounded-xl px-3 py-2">{importError}</p>
              )}
            </div>
          )}
        </Section>

        <Section title="Install app" icon="📲">
          <div className="bg-white rounded-2xl border border-gray-100 p-3.5">
            <div className="text-gray-800 font-bold text-sm mb-1">
              {isInstalled ? "Installed on this device" : "Install NeuroSpark for faster access"}
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-3">
              Installed mode feels more app-like and helps the new offline shell work better for local-first use.
            </p>
            {canInstall ? (
              <button
                type="button"
                onClick={() => { void promptInstall(); }}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
              >
                Install NeuroSpark
              </button>
            ) : (
              <div className="text-xs rounded-xl px-3 py-2" style={{ background: "#F5F3FF", color: "#6D28D9" }}>
                {isInstalled ? "This device already has the app installed." : "If your browser supports install prompts, the button appears here. You can also use your browser menu → Install app."}
              </div>
            )}
          </div>
        </Section>

        {pendingImportJson !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl">
              <p className="text-gray-800 font-bold text-sm mb-2">Replace all data?</p>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                This device&apos;s NeuroSpark data will be overwritten by the backup. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold"
                  onClick={() => setPendingImportJson(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold"
                  onClick={() => {
                    const json = pendingImportJson;
                    setPendingImportJson(null);
                    if (json === null) return;
                    const r = importLocalDataBackup(json);
                    if (!r.ok) setImportError(r.error);
                    else {
                      setShowBackup(true);
                      setImportError(null);
                    }
                  }}
                >
                  Replace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Materials */}
        <Section title={`Materials Inventory (${materialInventory.length} items)`} icon="🏠">
          <button onClick={() => setShowMaterials(s=>!s)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200">
            <span className="text-gray-700 text-sm">{showMaterials?"Hide":"Update"} materials list</span>
            <span className="text-gray-400">{showMaterials?"▲":"▼"}</span>
          </button>
          {showMaterials && (
            <div className="mt-2 animate-slide-up">
              <div className="flex gap-2 mb-2">
                <button onClick={() => setMaterialInventory(MATERIAL_OPTIONS.map(m=>m.id))}
                  className="text-xs px-3 py-1.5 rounded-full" style={{ background:"rgba(67,97,238,0.1)", color:"#4361EE" }}>Select All</button>
                <button onClick={() => setMaterialInventory([])}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">Clear</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {MATERIAL_OPTIONS.map(m => {
                  const sel = materialInventory.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggle(m.id)}
                      className="flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all"
                      style={{ background:sel?"rgba(67,97,238,0.08)":"white", borderColor:sel?"#4361EE":"#e5e7eb" }}>
                      <span>{m.emoji}</span>
                      <span className="text-xs font-medium truncate" style={{ color:sel?"#4361EE":"#374151" }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        {/* Text size — persists locally and on device (Capacitor Preferences when native) */}
        <Section title="Reading comfort" icon="🔤">
          <p className="text-gray-500 text-xs mb-2 leading-relaxed">
            Increase app text size for easier reading. Saved on this device.
          </p>
          <div className="flex gap-2 flex-wrap">
            {TEXT_SCALE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  void persistTextScale(preset.value).then(() => setTextScale(preset.value));
                }}
                className="flex-1 min-w-[88px] py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  borderColor: Math.abs(textScale - preset.value) < 0.02 ? "#4361EE" : "#e5e7eb",
                  background: Math.abs(textScale - preset.value) < 0.02 ? "rgba(67,97,238,0.08)" : "white",
                  color: Math.abs(textScale - preset.value) < 0.02 ? "#4361EE" : "#374151",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Innovation Lab */}
        <Section title="💡 Innovation Lab" icon="">
          <p className="text-gray-500 text-xs mb-3">Planned features and research-backed improvements coming to NeuroSpark:</p>
          <button onClick={() => setShowInnovation(s=>!s)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200 mb-2">
            <span className="text-gray-700 text-sm">{showInnovation?"Hide":"Show"} 10 innovation ideas</span>
            <span className="text-gray-400">{showInnovation?"▲":"▼"}</span>
          </button>
          {showInnovation && (
            <div className="space-y-2 animate-slide-up">
              {INNOVATION_IDEAS.map((idea, i) => (
                <div key={i} className="bg-white rounded-2xl p-3.5 border border-gray-100 animate-slide-up"
                  style={{ animationDelay:`${i*0.06}s` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                      style={{ background:`${idea.color}18` }}>{idea.emoji}</div>
                    <span className="font-bold text-gray-800 text-sm">{idea.title}</span>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">{idea.desc}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* App links */}
        <Section title="About" icon="ℹ️">
          <div className="space-y-1">
            {[
              { icon:"📊", label:"Stats & monthly check-in", fn:() => navigate("stats") },
              { icon:"📜", label:"Activity history", fn:() => navigate("history") },
              { icon:"⚖️", label:"Legal, privacy & AI notice", fn:() => navigate("legal_info") },
            ].map((item) => (
              <button key={item.label} onClick={item.fn}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 text-left">
                <span className="text-xl">{item.icon}</span>
                <span className="text-gray-700 text-sm">{item.label}</span>
                <span className="text-gray-300 ml-auto">›</span>
              </button>
            ))}
            {/* Contact / help */}
            <a
              href="mailto:support@neurospark.app?subject=NeuroSpark%20Support"
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 text-left"
            >
              <span className="text-xl">💬</span>
              <span className="text-gray-700 text-sm">Contact support</span>
              <span className="text-gray-300 ml-auto">›</span>
            </a>
          </div>
        </Section>

        {showAdminDocs && <AdminPanel navigate={navigate} />}

        {/* Sign out */}
        {!confirmLogout ? (
          <button onClick={() => setConfirmLogout(true)}
            className="w-full py-3.5 rounded-2xl text-red-500 font-semibold border border-red-100 bg-white">
            Sign Out
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-pop-in">
            <p className="text-red-700 text-sm font-semibold mb-3 text-center">Sign out and clear all local data?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmLogout(false)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm">Cancel</button>
              <button onClick={logoutUser}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">Yes, Sign Out</button>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs">
          NeuroSpark v{APP_VERSION} · Parent brain-development activities
        </p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title:string; icon:string; children:React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon && <span className="text-base">{icon}</span>}
        <span className="text-gray-800 font-bold text-sm">{title}</span>
      </div>
      {children}
    </div>
  );
}

function AdminPanel({ navigate }: { navigate: (v: import("../context/AppContext").AppView) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(245,158,11,0.4)", background: "rgba(255,251,235,0.8)" }}>
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen(s => !s)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: "rgba(245,158,11,0.18)" }}>🔐</div>
        <div className="flex-1">
          <div className="text-amber-900 font-bold text-sm">Admin</div>
          <div className="text-amber-700/70 text-xs">Internal team tools</div>
        </div>
        <span className="text-amber-500 font-bold text-xs px-2 py-0.5 rounded-full mr-2"
          style={{ background: "rgba(245,158,11,0.15)" }}>
          ADMIN
        </span>
        <span className="text-amber-400 text-base">{open ? "▲" : "▼"}</span>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 animate-slide-down border-t" style={{ borderColor: "rgba(245,158,11,0.2)" }}>
          <p className="text-amber-800/70 text-xs leading-relaxed">
            Architecture &amp; research docs — restricted to allowlisted admin accounts. Set <span className="font-mono">VITE_ADMIN_EMAILS</span> in production.
          </p>
          <button
            type="button"
            onClick={() => navigate("blueprint")}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-95"
            style={{ background: "white", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <span className="text-xl">📐</span>
            <div className="flex-1">
              <div className="text-gray-800 text-sm font-semibold">Blueprint Documentation</div>
              <div className="text-gray-400 text-xs">Architecture, research framework, algorithm &amp; roadmap</div>
            </div>
            <span className="text-gray-300">›</span>
          </button>
        </div>
      )}
    </div>
  );
}