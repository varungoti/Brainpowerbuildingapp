import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  describeLocalStorage,
  getAiConsent,
  getLocalRuntimeStatus,
  getProcessingMode,
  purgeChildLocalState,
  revokeAiConsent,
  setAiConsent,
  setProcessingMode,
  type AiConsent,
  type LocalRuntimeStatus,
  type ProcessingMode,
} from "../../lib/localAi";

const FEATURES: Array<{ id: AiConsent["features"][number]; label: string; helper: string }> = [
  { id: "coach", label: "AI Parent Coach", helper: "Long-memory coach answers your parenting questions; quotes back things you've told it." },
  { id: "voice-stt", label: "Voice — speech to text", helper: "Lets your child talk to the app instead of typing." },
  { id: "voice-tts", label: "Voice — text to speech", helper: "Lets the app read activities aloud." },
  { id: "safety", label: "Content safety filter", helper: "Blocks inappropriate output before your child sees it." },
  { id: "image-gen", label: "AI image generation", helper: "Generates illustrations for stories and activities (cloud only — feature gated)." },
];

const MODES: Array<{ id: ProcessingMode; label: string; sub: string }> = [
  { id: "on-device", label: "On-device only", sub: "Strict. No data leaves this phone. Some features may be unavailable on older devices." },
  { id: "hybrid", label: "Hybrid", sub: "On-device when possible, cloud when needed. Best balance of capability and privacy." },
  { id: "cloud", label: "Cloud", sub: "All AI runs in our servers. Faster + more capable, but data leaves the device." },
];

export const AIPrivacyScreen: React.FC = () => {
  const { children, activeChild } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(activeChild?.id);
  useEffect(() => { setSelectedChildId(activeChild?.id ?? children[0]?.id); }, [activeChild?.id, children]);
  const child = children.find((c) => c.id === selectedChildId);

  const [mode, setMode] = useState<ProcessingMode>(getProcessingMode());
  const [status, setStatus] = useState<LocalRuntimeStatus | null>(null);
  const [consent, setConsent] = useState<AiConsent | null>(child ? getAiConsent(child.id) : null);
  const [stored, setStored] = useState<{ key: string; valueLength: number }[]>([]);

  useEffect(() => { getLocalRuntimeStatus().then(setStatus); }, []);
  useEffect(() => {
    if (!child) return;
    setConsent(getAiConsent(child.id));
    void describeLocalStorage(child.id).then(setStored);
  }, [child?.id]);

  function changeMode(next: ProcessingMode) {
    setMode(next);
    setProcessingMode(next);
  }

  function toggleFeature(feature: AiConsent["features"][number]) {
    if (!child) return;
    const next: AiConsent = consent
      ? {
          ...consent,
          features: consent.features.includes(feature)
            ? consent.features.filter((f) => f !== feature)
            : [...consent.features, feature],
        }
      : { childId: child.id, grantedAt: new Date().toISOString(), features: [feature], onDeviceOnly: false };
    setAiConsent(next);
    setConsent(next);
  }

  function toggleOnDeviceOnly() {
    if (!child || !consent) return;
    const next: AiConsent = { ...consent, onDeviceOnly: !consent.onDeviceOnly };
    setAiConsent(next);
    setConsent(next);
  }

  function purgeAll() {
    if (!child) return;
    if (!window.confirm(`Permanently delete every AI-related thing this device has stored about ${child.name}? This is immediate and irreversible (cloud data has its own delete tool).`)) return;
    revokeAiConsent(child.id);
    const n = purgeChildLocalState(child.id);
    setConsent(null);
    setStored([]);
    window.alert(`${n} stored items purged for ${child.name}.`);
  }

  const totalBytes = useMemo(() => stored.reduce((s, e) => s + e.valueLength, 0), [stored]);

  if (!child) {
    return (
      <div className="p-5 text-sm text-gray-600">
        Add a child profile to manage AI consent.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full pb-12">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">AI privacy & consent</h1>
        <p className="text-xs text-gray-600 mt-1">
          COPPA 2.0 (effective 22 April 2026) requires us to ask you, the parent, before any AI feature processes your child's voice, text, or behaviour. This page is the single place where you can grant, revoke, and inspect that.
        </p>
      </div>

      {children.length > 1 && (
        <div className="px-5 mb-3">
          <label className="text-xs font-semibold text-gray-700">Child</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            {children.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      )}

      <section className="px-5 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Processing mode</h2>
        <div className="space-y-2">
          {MODES.map((m) => (
            <label key={m.id} className="flex gap-3 items-start p-3 rounded-2xl border border-gray-200 bg-white">
              <input type="radio" name="mode" checked={mode === m.id} onChange={() => changeMode(m.id)} className="mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-900">{m.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{m.sub}</div>
              </div>
            </label>
          ))}
        </div>
        {status && (
          <div className="mt-3 text-xs text-gray-600">
            On-device runtime: <strong>{status.modelName}</strong> · LLM {status.llmAvailable ? "available" : "not bundled yet"} · STT {status.sttAvailable ? "available" : "no"} · TTS {status.ttsAvailable ? "available" : "no"}
          </div>
        )}
      </section>

      <section className="px-5 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Per-feature consent for {child.name}</h2>
        <div className="space-y-2">
          {FEATURES.map((f) => {
            const granted = consent?.features.includes(f.id) ?? false;
            return (
              <label key={f.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl border border-gray-200 bg-white">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{f.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{f.helper}</div>
                </div>
                <input type="checkbox" checked={granted} onChange={() => toggleFeature(f.id)} className="mt-1.5" aria-label={`Toggle ${f.label}`} />
              </label>
            );
          })}
        </div>
        {consent && (
          <label className="flex items-start gap-3 mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <input type="checkbox" checked={consent.onDeviceOnly} onChange={toggleOnDeviceOnly} className="mt-1" />
            <div>
              <div className="text-sm font-semibold text-amber-900">Force on-device only for {child.name}</div>
              <div className="text-xs text-amber-800 mt-0.5">Even if cloud is allowed elsewhere, this child's data never leaves the device. May reduce some features.</div>
            </div>
          </label>
        )}
      </section>

      <section className="px-5 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-2">What we have stored about {child.name} on this device</h2>
        <div className="text-xs text-gray-600 mb-2">{stored.length} keys · {totalBytes.toLocaleString()} characters · purge below to delete instantly.</div>
        <div className="rounded-2xl border border-gray-200 bg-white max-h-48 overflow-y-auto">
          {stored.length === 0 && <div className="p-3 text-xs text-gray-500">Nothing stored locally for this child.</div>}
          {stored.map((s) => (
            <div key={s.key} className="px-3 py-2 border-b border-gray-100 text-xs flex justify-between">
              <code className="text-gray-700 truncate mr-2">{s.key}</code>
              <span className="text-gray-500">{s.valueLength}</span>
            </div>
          ))}
        </div>
        <button
          onClick={purgeAll}
          className="mt-3 w-full rounded-2xl bg-red-600 text-white text-sm font-semibold py-3"
        >
          Delete everything for {child.name} now
        </button>
        <p className="text-xs text-gray-500 mt-2">Cloud data lives in our servers; the in-app "Delete cloud data" button (in Profile) removes that separately and meets COPPA 2.0's near-real-time deletion requirement.</p>
      </section>

      <section className="px-5 mb-5">
        <a
          href="https://github.com/neurospark/local-ai-verifier"
          target="_blank" rel="noopener noreferrer"
          className="block text-center text-xs text-primary underline"
        >
          Independent verifier — see exactly which payloads leave your device
        </a>
      </section>
    </div>
  );
};
