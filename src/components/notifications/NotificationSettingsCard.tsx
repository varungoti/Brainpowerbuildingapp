// ============================================================================
// NotificationSettingsCard
// ----------------------------------------------------------------------------
// Profile-screen card that wires the existing smartScheduler logic to a
// concrete UI: per-type toggles, quiet hours, max-per-day, and permission
// request. Web fallback uses the Notification API; native plugin will be
// wired through Capacitor later (contract identical).
// ============================================================================

import React, { useEffect, useState } from "react";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
  type NotificationType,
} from "../../lib/notifications/smartScheduler";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermissionState,
  sendLocalNotification,
} from "../../lib/notifications/notificationChannel";
import { captureProductEvent } from "../../utils/productAnalytics";

const LS_KEY = "neurospark_notif_prefs_v1";

const TYPE_META: Record<NotificationType, { emoji: string; label: string; hint: string }> = {
  "daily-reminder":         { emoji: "⏰", label: "Daily reminder",          hint: "One nudge a day at the best time for your child." },
  "streak-at-risk":         { emoji: "🔥", label: "Streak at risk",          hint: "Tells you the day a streak would otherwise break." },
  "milestone-approaching":  { emoji: "🎯", label: "Milestone approaching",   hint: "When the predictor sees a milestone coming." },
  "report-ready":           { emoji: "📄", label: "Weekly report ready",     hint: "Sunday summary you can share." },
  "quest-expiring":         { emoji: "🏆", label: "Quest expiring",          hint: "Reminds you while there's still time." },
};

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...parsed,
      types: { ...DEFAULT_NOTIFICATION_PREFS.types, ...(parsed.types ?? {}) },
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

function savePrefs(prefs: NotificationPrefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
}

export function NotificationSettingsCard() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadPrefs());
  const [permState, setPermState] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" ? getNotificationPermissionState() : "unsupported",
  );

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  if (!isNotificationSupported()) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        This device doesn't support web notifications. We'll wire native push when the mobile app ships.
      </div>
    );
  }

  const update = <K extends keyof NotificationPrefs>(k: K, v: NotificationPrefs[K]) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    captureProductEvent("notification_pref_change", {
      notification_type: String(k),
      notification_enabled: typeof v === "boolean" ? v : undefined,
    });
  };

  const toggleType = (type: NotificationType) => {
    setPrefs((p) => ({ ...p, types: { ...p.types, [type]: !p.types[type] } }));
    captureProductEvent("notification_pref_change", {
      notification_type: type,
      notification_enabled: !prefs.types[type],
    });
  };

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setPermState(granted ? "granted" : "denied");
    if (granted) {
      update("enabled", true);
      sendLocalNotification("NeuroSpark notifications on ✅", "We'll only ping at thoughtful moments.");
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm space-y-4">
      <ToggleRow
        label="Notifications enabled"
        hint={
          permState === "granted"
            ? "We will only ping outside quiet hours."
            : permState === "denied"
            ? "Permission denied — re-enable from device settings."
            : "Tap to grant permission and start gentle nudges."
        }
        value={prefs.enabled && permState === "granted"}
        onChange={(v) => {
          if (v && permState !== "granted") void handleEnable();
          else update("enabled", v);
        }}
      />

      <div>
        <div className="text-slate-800 font-bold text-xs mb-2">Notification types</div>
        <div className="space-y-2">
          {(Object.keys(TYPE_META) as NotificationType[]).map((t) => {
            const m = TYPE_META[t];
            const active = prefs.types[t];
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                disabled={!prefs.enabled}
                className="w-full flex items-center gap-3 text-left p-2 rounded-xl bg-slate-50 disabled:opacity-50"
                role="switch"
                aria-checked={active}
              >
                <span className="text-lg">{m.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-slate-800 text-xs font-bold">{m.label}</div>
                  <div className="text-slate-400 text-[11px] leading-tight">{m.hint}</div>
                </div>
                <div
                  className="relative w-9 h-5 rounded-full flex-shrink-0 transition"
                  style={{ background: active ? "#4361EE" : "#CBD5E1" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                    style={{ left: active ? 18 : 2 }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TimeField
          label="Quiet start"
          value={prefs.quietStart}
          onChange={(v) => update("quietStart", v)}
        />
        <TimeField
          label="Quiet end"
          value={prefs.quietEnd}
          onChange={(v) => update("quietEnd", v)}
        />
      </div>

      <div className="rounded-xl bg-slate-50 p-2 flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500">Max per day</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => {
            const active = prefs.maxPerDay === n;
            return (
              <button
                key={n}
                onClick={() => update("maxPerDay", n)}
                className="w-7 h-7 rounded-lg text-xs font-bold"
                style={{
                  background: active ? "#4361EE" : "white",
                  color: active ? "white" : "#475569",
                  border: `1px solid ${active ? "#4361EE" : "#E2E8F0"}`,
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between gap-3 text-left" role="switch" aria-checked={value}>
      <div className="min-w-0 flex-1">
        <div className="text-slate-800 text-xs font-bold">{label}</div>
        <div className="text-slate-400 text-[11px] leading-tight">{hint}</div>
      </div>
      <div className="relative w-9 h-5 rounded-full flex-shrink-0 transition" style={{ background: value ? "#4361EE" : "#CBD5E1" }}>
        <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: value ? 18 : 2 }} />
      </div>
    </button>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700"
      />
    </label>
  );
}
