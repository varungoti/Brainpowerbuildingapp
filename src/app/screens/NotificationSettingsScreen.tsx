import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs, type NotificationType } from "../../lib/notifications/smartScheduler";
import { requestNotificationPermission, getNotificationPermissionState } from "../../lib/notifications/notificationChannel";

const TYPE_LABELS: Record<NotificationType, { emoji: string; label: string; desc: string }> = {
  "daily-reminder": { emoji: "📅", label: "Daily Reminder", desc: "Remind to do activities" },
  "streak-at-risk": { emoji: "🔥", label: "Streak At Risk", desc: "Evening alert when streak might break" },
  "milestone-approaching": { emoji: "🎯", label: "Milestone Alert", desc: "Predicted milestone within 2 weeks" },
  "report-ready": { emoji: "📄", label: "Report Ready", desc: "Weekly report generated" },
  "quest-expiring": { emoji: "⏳", label: "Quest Expiring", desc: "Daily quest about to expire" },
};

export function NotificationSettingsScreen() {
  const { goBack, notificationPrefs, saveNotificationPrefs } = useApp();
  const [prefs, setPrefs] = useState<NotificationPrefs>(notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS);
  const [permState, setPermState] = useState(() => getNotificationPermissionState());

  const handleToggleType = (type: NotificationType) => {
    setPrefs(p => ({
      ...p,
      types: { ...p.types, [type]: !p.types[type] },
    }));
  };

  const handleSave = () => {
    saveNotificationPrefs(prefs);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermState(granted ? "granted" : "denied");
    if (granted) {
      setPrefs(p => ({ ...p, enabled: true }));
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="rounded-b-3xl px-4 pt-3 pb-6"
        style={{ background: "linear-gradient(135deg,#4361EE,#0077B6)" }}>
        <button onClick={goBack} className="text-white/70 text-xs mb-3 flex items-center gap-1">
          <span>‹</span> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔔</span>
          <div>
            <div className="text-white font-black text-xl">Notifications</div>
            <div className="text-white/60 text-xs">Smart reminders that learn your schedule</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {permState !== "granted" && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <p className="text-amber-800 text-xs mb-2">Notifications are not enabled. Allow them to receive smart reminders.</p>
            <button onClick={() => void handleRequestPermission()}
              className="w-full py-2.5 rounded-xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#FFB703,#FB5607)" }}>
              Enable Notifications
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-800 text-sm">Notifications</span>
            <button onClick={() => setPrefs(p => ({ ...p, enabled: !p.enabled }))}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ background: prefs.enabled ? "#4361EE" : "#D1D5DB" }}>
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                style={{ left: prefs.enabled ? 26 : 2 }} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-600 text-xs font-semibold block mb-1">Quiet Start</label>
                <input type="time" value={prefs.quietStart}
                  onChange={e => setPrefs(p => ({ ...p, quietStart: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold block mb-1">Quiet End</label>
                <input type="time" value={prefs.quietEnd}
                  onChange={e => setPrefs(p => ({ ...p, quietEnd: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-gray-600 text-xs font-semibold block mb-1">Max per day: {prefs.maxPerDay}</label>
              <input type="range" min={0} max={3} value={prefs.maxPerDay}
                onChange={e => setPrefs(p => ({ ...p, maxPerDay: Number(e.target.value) }))}
                className="w-full" />
            </div>
          </div>
        </div>

        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">Notification Types</div>
          <div className="space-y-1.5">
            {(Object.entries(TYPE_LABELS) as [NotificationType, typeof TYPE_LABELS[NotificationType]][]).map(([type, info]) => (
              <div key={type} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                <span className="text-xl">{info.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-xs">{info.label}</div>
                  <div className="text-gray-400" style={{ fontSize: 10 }}>{info.desc}</div>
                </div>
                <button onClick={() => handleToggleType(type)}
                  className="w-10 h-5 rounded-full transition-all relative"
                  style={{ background: prefs.types[type] ? "#4361EE" : "#D1D5DB" }}>
                  <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                    style={{ left: prefs.types[type] ? 22 : 2 }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
          Save Preferences
        </button>
      </div>
    </div>
  );
}
