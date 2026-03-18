// ============================================================
// NEUROSPARK — AUDIO EFFECTS ENGINE (Web Audio API)
// All sounds generated programmatically — no audio files needed
// ============================================================

let audioCtx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch { return null; }
}

function tone(
  freq: number, type: OscillatorType = "sine",
  startTime: number, duration: number,
  gainPeak: number = 0.3, ctx?: AudioContext
) {
  const c = ctx ?? getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const reverb = c.createGain();

  osc.connect(gain);
  gain.connect(reverb);
  reverb.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startTime);
  gain.gain.setValueAtTime(0, c.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startTime + duration);
  reverb.gain.setValueAtTime(0.8, c.currentTime + startTime);

  osc.start(c.currentTime + startTime);
  osc.stop(c.currentTime + startTime + duration + 0.05);
}

export function setAudioEnabled(on: boolean) { enabled = on; }
export function getAudioEnabled() { return enabled; }

/** Warm chime played when an activity is completed */
export function playActivityComplete() {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  // C5 - E5 - G5 - C6 ascending arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => tone(freq, "sine", i * 0.12, 0.45, 0.22, c));
}

/** Triumphant fanfare for level-up */
export function playLevelUp() {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  // G4 - B4 - D5 - G5 chord + melody
  [392, 493.88, 587.33, 783.99].forEach((f, i) => tone(f, "triangle", i * 0.08, 0.7, 0.18, c));
  tone(1046.5, "sine", 0.35, 0.5, 0.25, c);
  tone(1318.51, "sine", 0.55, 0.6, 0.3, c);
}

/** Single chime when a brain region activates */
export function playBrainRegionActivate(index: number = 0) {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  const freqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 1760];
  const freq = freqs[index % freqs.length];
  tone(freq, "sine", 0, 0.5, 0.2, c);
  tone(freq * 2, "sine", 0.05, 0.3, 0.08, c); // overtone
}

/** Quick soft click for navigation */
export function playClick() {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  tone(1200, "square", 0, 0.04, 0.05, c);
}

/** Achievement badge earned */
export function playAchievement() {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  // Ascending scale: C D E F G A B C
  [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25].forEach(
    (f, i) => tone(f, "triangle", i * 0.09, 0.35, 0.2, c)
  );
}

/** Soft reward coin sound */
export function playCoin() {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  tone(1568, "sine", 0, 0.12, 0.25, c);
  tone(2093, "sine", 0.05, 0.15, 0.2, c);
}

/** Warm whoosh for page transitions */
export function playWhoosh() {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  o.connect(f); f.connect(g); g.connect(c.destination);
  o.type = "sawtooth";
  o.frequency.setValueAtTime(400, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.3);
  f.type = "lowpass";
  f.frequency.value = 1200;
  g.gain.setValueAtTime(0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
  o.start(c.currentTime);
  o.stop(c.currentTime + 0.4);
}

/** Brain glow pulse — low ambient tone */
export function playBrainPulse() {
  if (!enabled) return;
  const c = getCtx(); if (!c) return;
  tone(65.41, "sine", 0, 1.2, 0.04, c); // C2 base
  tone(130.81, "sine", 0, 1.2, 0.02, c); // C3 octave
}
