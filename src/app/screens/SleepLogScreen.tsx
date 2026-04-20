import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  bucketFromMinutes,
  recommendedSleepHours,
  shouldSurfaceBedtimeRoutine,
  sleepDebtFactor,
  type SleepBucket,
  type SleepNight,
} from "../../lib/sleep/sleepSignal";
import { listSleepNights, logSleepNight } from "../../lib/sleep/sleepClient";

const BUCKET_META: Record<SleepBucket, { label: string; emoji: string; tone: string }> = {
  excellent: { label: "Excellent", emoji: "🌙", tone: "bg-emerald-100 text-emerald-800" },
  adequate:  { label: "Adequate",  emoji: "🛏️", tone: "bg-sky-100 text-sky-800" },
  short:     { label: "Short",     emoji: "😪", tone: "bg-amber-100 text-amber-900" },
  deficient: { label: "Deficient", emoji: "😵", tone: "bg-rose-100 text-rose-900" },
};

function ageMonths(dob: string): number {
  const b = new Date(dob);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

function todayLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDate(iso: string, deltaDays: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return todayLocalFrom(d);
}

function todayLocalFrom(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const SleepLogScreen: React.FC = () => {
  const { activeChild, children } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(activeChild?.id);
  useEffect(() => { setSelectedChildId(activeChild?.id ?? children[0]?.id); }, [activeChild?.id, children]);
  const child = children.find((c) => c.id === selectedChildId);

  const [nights, setNights] = useState<SleepNight[]>([]);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState<string>(todayLocalDate());
  const [hours, setHours] = useState<string>("10");
  const [minutes, setMinutes] = useState<string>("30");
  const [awakenings, setAwakenings] = useState<string>("0");

  async function refresh() {
    if (!child) return;
    setNights(await listSleepNights(child.id, 14));
  }
  useEffect(() => { void refresh(); }, [child?.id]);

  const months = child ? ageMonths(child.dob) : 60;
  const range = recommendedSleepHours(months);
  const debt = useMemo(() => sleepDebtFactor(nights), [nights]);
  const surfaceBedtime = useMemo(() => shouldSurfaceBedtimeRoutine(nights), [nights]);

  async function save() {
    if (!child) return;
    const m = (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
    const a = Math.max(0, parseInt(awakenings, 10) || 0);
    const bucket = bucketFromMinutes(m, months, { awakenings: a });
    setBusy(true);
    try {
      const ok = await logSleepNight({
        childId: child.id,
        nightDate: date,
        bucket,
        source: "manual",
        minutesSlept: m,
        awakenings: a,
      });
      if (!ok) window.alert("Couldn't save. Check your connection.");
      else await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!child) {
    return <div className="p-5 text-sm text-gray-600">Add a child profile to log sleep.</div>;
  }

  return (
    <div className="overflow-y-auto h-full pb-12">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Sleep × Cognition</h1>
        <p className="text-xs text-gray-600 mt-1">
          We never upload raw biometrics. Only a 4-bucket categorical per night, used to throttle working-memory-loaded activities the morning after a poor night (ABCD cohort 2025: ~10.9% of cognition variance).
        </p>
      </div>

      {children.length > 1 && (
        <div className="px-5 mb-3">
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            {children.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      )}

      <section className="px-5 mb-4">
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900 leading-relaxed">
          AAP recommendation for {child.name}: <b>{range.minHours}–{range.maxHours} hours</b> per night.
          {nights.length === 0 ? " No nights logged yet." : ` 7-day debt index: ${(debt * 100).toFixed(0)}%.`}
          {surfaceBedtime ? " Today's plan will surface the bedtime co-regulation routine." : ""}
        </div>
      </section>

      <section className="px-5 mb-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">Log a night</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-700">
              Night ended
              <div className="flex gap-1 mt-1">
                <button onClick={() => setDate(shiftDate(date, -1))} className="px-2 py-1 rounded bg-gray-100 text-xs">‹</button>
                <input
                  type="date"
                  value={date}
                  max={todayLocalDate()}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                />
                <button onClick={() => setDate(shiftDate(date, 1))} className="px-2 py-1 rounded bg-gray-100 text-xs">›</button>
              </div>
            </label>
            <label className="text-xs text-gray-700">
              Awakenings
              <input type="number" min={0} max={20} value={awakenings} onChange={(e) => setAwakenings(e.target.value)} className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm" />
            </label>
            <label className="text-xs text-gray-700">
              Hours slept
              <input type="number" min={0} max={20} value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm" />
            </label>
            <label className="text-xs text-gray-700">
              + Minutes
              <input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm" />
            </label>
          </div>
          <button onClick={save} disabled={busy} className="mt-3 w-full rounded-2xl bg-indigo-500 text-white text-sm font-semibold py-3 disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      <section className="px-5 pb-6">
        <div className="text-xs font-semibold text-gray-700 mb-2">Last 14 nights</div>
        {nights.length === 0 && <div className="text-xs text-gray-500">Nothing yet.</div>}
        <div className="space-y-2">
          {nights.map((n) => {
            const m = BUCKET_META[n.bucket];
            return (
              <div key={n.nightDate} className="rounded-2xl border border-gray-200 bg-white px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-800">{n.nightDate}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.tone}`}>
                  {m.emoji} {m.label} <span className="opacity-60">· {n.source}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
