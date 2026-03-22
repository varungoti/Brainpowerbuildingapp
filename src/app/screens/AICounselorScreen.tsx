import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { projectId, publicAnonKey } from "@/utils/supabase/info";
import { useOnlineStatus } from "@/utils/networkStatus";

const CATEGORIES = [
  { id: "eating",   emoji: "🥗", label: "Picky Eating",      color: "#06D6A0" },
  { id: "sleep",    emoji: "😴", label: "Sleep Issues",       color: "#7209B7" },
  { id: "behavior", emoji: "😤", label: "Behavior",           color: "#F72585" },
  { id: "screen",   emoji: "📱", label: "Screen Time",        color: "#4361EE" },
  { id: "ai_literacy", emoji: "🧑‍🏫", label: "AI & tools at home", color: "#0077B6" },
  { id: "social",   emoji: "🤝", label: "Social Difficulty",  color: "#FFB703" },
  { id: "learning", emoji: "📚", label: "Learning Concerns",  color: "#FB5607" },
  { id: "anxiety",  emoji: "😰", label: "Anxiety/Emotions",   color: "#E63946" },
];

interface Solution {
  title: string;
  approach: string;
  science: string;
  steps: string[];
  duration: string;
  successSigns: string[];
  difficulty: string;
}

interface AIResponse {
  category: string;
  summary: string;
  solutions: Solution[];
  redFlags: string[];
  nutritionNote?: string;
  activityRecommendations: string[];
  references: string[];
}

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy to start",   color: "#06D6A0", bg: "#EDFFF8" },
  medium: { label: "Moderate effort", color: "#FFB703", bg: "#FFFBE6" },
  hard:   { label: "Requires patience", color: "#F72585", bg: "#FFF0F6" },
};

export function AICounselorScreen() {
  const { activeChild } = useApp();
  const isOnline = useOnlineStatus();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [concern, setConcern] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSolution, setExpandedSolution] = useState<number | null>(0);
  const [showAllRefs, setShowAllRefs] = useState(false);

  const childAge = activeChild
    ? Math.floor((Date.now() - new Date(activeChild.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 5;
  const tier = activeChild?.ageTier ?? 3;

  const handleAsk = async () => {
    if (!isOnline) {
      setError("You're offline. AI research needs an internet connection, but your local activity history is still available.");
      return;
    }
    if (!selectedCategory || !concern.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setExpandedSolution(0);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-76b0ba9a/ai-counselor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ concern, childAge, tier, category: selectedCategory }),
        }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Unknown error");
      setResponse(data.data);
      setIsDemo(data.isDemo ?? false);
    } catch (e) {
      console.error("AI counselor error:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResponse(null);
    setConcern("");
    setSelectedCategory(null);
    setError(null);
  };

  const catConfig = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>

      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-4 pb-6 rounded-b-3xl mb-1"
        style={{ background: "linear-gradient(135deg,#0f0f1a,#302b63,#1a0533)" }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#F72585,transparent)", transform: "translate(30%,-30%)" }} />

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "linear-gradient(135deg,#4361EE30,#7209B730)", border: "1px solid rgba(255,255,255,0.15)" }}>
            🧠
          </div>
          <div>
            <div className="text-white font-black text-lg">NeuroSpark AI</div>
            <div className="text-white/50 text-xs">Research-backed parent advisor</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-white/70 text-xs leading-relaxed">
            Describe your child's behavioral, habitual, or eating concern. Our AI will research deeply — drawing from 20–25 academic references — and provide 3 step-by-step evidence-based solutions.
          </div>
        </div>
        {!isOnline && (
          <div className="mt-3 p-3 rounded-2xl" style={{ background: "rgba(251,191,36,0.14)", border: "1px solid rgba(245,158,11,0.35)" }}>
            <div className="text-amber-200 font-semibold text-xs mb-1">Offline right now</div>
            <div className="text-amber-100/90 text-xs">You can read prior guidance already on screen, but new AI research requests will wait until you reconnect.</div>
          </div>
        )}
      </div>

      <div className="px-4 pb-8 space-y-4">
        {!response ? (
          <>
            {/* Category selector */}
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">What's on your mind?</div>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all active:scale-95"
                    style={{
                      background: selectedCategory === cat.id ? cat.color + "18" : "white",
                      border: `2px solid ${selectedCategory === cat.id ? cat.color : "#e5e7eb"}`,
                      boxShadow: selectedCategory === cat.id ? `0 4px 12px ${cat.color}25` : "none",
                    }}>
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="font-semibold" style={{ fontSize: 12, color: selectedCategory === cat.id ? cat.color : "#374151" }}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text input */}
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                Describe your concern in detail
              </div>
              <textarea
                value={concern}
                onChange={e => setConcern(e.target.value)}
                rows={4}
                placeholder={
                  selectedCategory === "eating" ? `E.g. "My 4-year-old refuses to eat anything except plain rice and nuggets. She gags at the sight of vegetables and the same food she ate yesterday..."` :
                  selectedCategory === "sleep" ? `E.g. "My 3-year-old won't sleep alone. He wakes up 3-4 times a night crying and insists on sleeping with us..."` :
                  selectedCategory === "behavior" ? `E.g. "My 5-year-old has extreme tantrums when transitioning between activities. He hits and screams for 20-30 minutes..."` :
                  selectedCategory === "ai_literacy" ? `E.g. "My 7-year-old copies homework answers from a chatbot without reading the question. I want scripts to teach 'two-check questions' before trusting any answer..."` :
                  "Describe what you've noticed, when it happens, how long it's been going on, and what you've already tried..."
                }
                className="w-full p-4 rounded-2xl text-gray-700 text-sm leading-relaxed outline-none resize-none"
                style={{ background: "white", border: "2px solid #e5e7eb", fontFamily: "inherit" }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-gray-400 text-xs">{concern.length} characters</span>
                <span className="text-gray-400 text-xs">More detail = better research</span>
              </div>
            </div>

            {activeChild && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(67,97,238,0.08)", border: "1px solid rgba(67,97,238,0.15)" }}>
                <span className="text-lg">{activeChild.avatarEmoji}</span>
                <span className="text-blue-700 text-xs">Researching for {activeChild.name}, age ~{childAge}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl" style={{ background: "#FFF0F6", border: "1px solid rgba(247,37,133,0.3)" }}>
                <div className="text-pink-700 text-xs font-semibold mb-1">Connection error</div>
                <div className="text-pink-600 text-xs">{error}</div>
              </div>
            )}

            <button
              onClick={handleAsk}
              disabled={!selectedCategory || concern.trim().length < 20 || loading}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all"
              style={{
                background: (!isOnline || !selectedCategory || concern.trim().length < 20) ? "#D1D5DB" : "linear-gradient(135deg,#4361EE,#7209B7)",
                boxShadow: (!isOnline || !selectedCategory || concern.trim().length < 20) ? "none" : "0 8px 24px rgba(67,97,238,0.4)",
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Researching 25+ studies...
                </span>
              ) : "🔬 Get AI Research & Solutions →"}
            </button>

            {loading && (
              <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#4361EE10,#7209B710)", border: "1px solid rgba(67,97,238,0.2)" }}>
                <div className="text-blue-700 font-semibold text-sm mb-2">AI is researching...</div>
                {["Analyzing developmental context","Searching academic databases","Reviewing 20+ peer-reviewed studies","Synthesizing 3 solution approaches","Compiling citations"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                    <span className="text-blue-600 text-xs">{step}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-gray-400 text-xs leading-relaxed">
              ⚕️ This AI provides general research guidance. Always consult a qualified healthcare professional for individual medical, psychological, or nutritional advice.
            </div>
          </>
        ) : (
          <>
            {/* Response header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {catConfig && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: catConfig.color + "20" }}>{catConfig.emoji}</div>
                )}
                <div>
                  <div className="font-bold text-gray-800 text-sm">{catConfig?.label} Research</div>
                  {isDemo && <div className="text-gray-400 text-xs">Demo response · Add OpenAI key for live AI</div>}
                </div>
              </div>
              <button onClick={reset} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "#EEF1FF", color: "#4361EE" }}>
                New Question
              </button>
            </div>

            {/* Research summary */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #e5e7eb" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
                  style={{ background: "#EEF1FF" }}>🔬</div>
                <div className="font-bold text-gray-800 text-sm">Research Context</div>
              </div>
              <div className="text-gray-600 text-xs leading-relaxed">{response.summary}</div>
            </div>

            {/* 3 Solutions */}
            <div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">3 Evidence-Based Solutions</div>
              <div className="space-y-2">
                {response.solutions.map((sol, i) => {
                  const isExpanded = expandedSolution === i;
                  const diffCfg = DIFFICULTY_CONFIG[sol.difficulty as keyof typeof DIFFICULTY_CONFIG] ?? DIFFICULTY_CONFIG.medium;
                  const solColor = catConfig?.color ?? "#4361EE";
                  return (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${isExpanded ? solColor + "40" : "#e5e7eb"}` }}>
                      <button onClick={() => setExpandedSolution(isExpanded ? null : i)}
                        className="w-full flex items-start gap-3 p-4 text-left"
                        style={{ background: isExpanded ? solColor + "08" : "white" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg,${solColor},${solColor}99)`, fontSize: 14 }}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-sm">{sol.title}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-full font-semibold"
                              style={{ fontSize: 10, background: solColor + "15", color: solColor }}>
                              {sol.approach}
                            </span>
                            <span className="px-2 py-0.5 rounded-full font-semibold"
                              style={{ fontSize: 10, background: diffCfg.bg, color: diffCfg.color }}>
                              {diffCfg.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full font-semibold"
                              style={{ fontSize: 10, background: "#F3F4F6", color: "#6B7280" }}>
                              ⏱ {sol.duration}
                            </span>
                          </div>
                        </div>
                        <span className="text-gray-400 text-sm mt-1">{isExpanded ? "▲" : "▼"}</span>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4" style={{ background: solColor + "05" }}>
                          <div className="p-3 rounded-xl mb-3" style={{ background: solColor + "10", border: `1px solid ${solColor}20` }}>
                            <div className="text-xs font-semibold mb-1" style={{ color: solColor }}>🔬 Scientific Basis</div>
                            <div className="text-gray-600 text-xs leading-relaxed">{sol.science}</div>
                          </div>

                          <div className="mb-3">
                            <div className="font-semibold text-gray-800 text-xs mb-2">📋 Step-by-Step Guide</div>
                            <div className="space-y-2">
                              {sol.steps.map((step, si) => (
                                <div key={si} className="flex gap-2.5 items-start">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                                    style={{ fontSize: 10, background: solColor }}>
                                    {si + 1}
                                  </div>
                                  <span className="text-gray-700 text-xs leading-relaxed">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl" style={{ background: "#EDFFF8", border: "1px solid rgba(6,214,160,0.3)" }}>
                            <div className="font-semibold text-emerald-700 text-xs mb-1.5">✅ Signs It's Working</div>
                            {sol.successSigns.map((sign, si) => (
                              <div key={si} className="flex items-center gap-1.5 mb-1">
                                <span className="text-emerald-500" style={{ fontSize: 10 }}>◉</span>
                                <span className="text-emerald-700 text-xs">{sign}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red flags */}
            <div className="rounded-2xl p-4" style={{ background: "#FFF0F6", border: "1px solid rgba(247,37,133,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🚨</span>
                <div className="font-bold text-pink-800 text-sm">When to See a Professional</div>
              </div>
              <div className="space-y-1.5">
                {response.redFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5 flex-shrink-0" style={{ fontSize: 10 }}>⚠</span>
                    <span className="text-pink-700 text-xs leading-relaxed">{flag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition note */}
            {response.nutritionNote && (
              <div className="rounded-2xl p-4" style={{ background: "#FFFBE6", border: "1px solid rgba(255,183,3,0.3)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>🥗</span>
                  <div className="font-bold text-amber-800 text-sm">Nutrition Note</div>
                </div>
                <div className="text-amber-700 text-xs leading-relaxed">{response.nutritionNote}</div>
              </div>
            )}

            {/* References */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #e5e7eb" }}>
              <button onClick={() => setShowAllRefs(s => !s)}
                className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📚</span>
                  <span className="font-bold text-gray-800 text-sm">
                    Academic References ({response.references.length})
                  </span>
                </div>
                <span className="text-gray-400 text-sm">{showAllRefs ? "▲" : "▼"}</span>
              </button>

              {showAllRefs && (
                <div className="mt-3 space-y-2">
                  {response.references.map((ref, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="text-gray-400 font-mono flex-shrink-0" style={{ fontSize: 10, marginTop: 2 }}>{i + 1}.</span>
                      <span className="text-gray-500 text-xs leading-relaxed">{ref}</span>
                    </div>
                  ))}
                  <div className="mt-2 p-2.5 rounded-xl" style={{ background: "#FFF9E6" }}>
                    <div className="text-amber-600 text-xs">
                      ⚕️ Citations are from AI training data. Verify through PubMed or Google Scholar for clinical use. Always consult qualified healthcare professionals.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={reset}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
              Ask Another Question
            </button>
          </>
        )}
      </div>
    </div>
  );
}
