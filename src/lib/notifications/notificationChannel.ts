// ============================================================================
// notificationChannel — single entry point for surface-agnostic notifications
// ----------------------------------------------------------------------------
// Web: uses the browser Notification API.
// Native (iOS / Android via Capacitor `LocalNotifications` plugin): wires up
// permission + scheduling + immediate display through the bridge if it is
// installed. The plugin import is INTENTIONALLY runtime-discovered via the
// global `window.Capacitor.Plugins.LocalNotifications` so the package can be
// added later without touching this file.
// ============================================================================

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  Plugins?: { LocalNotifications?: LocalNotificationsPlugin };
}

interface LocalNotificationsPlugin {
  requestPermissions(): Promise<{ display?: "granted" | "denied" | "prompt" }>;
  checkPermissions(): Promise<{ display?: "granted" | "denied" | "prompt" }>;
  schedule(opts: {
    notifications: Array<{
      id: number;
      title: string;
      body: string;
      schedule?: { at?: Date; allowWhileIdle?: boolean };
      smallIcon?: string;
    }>;
  }): Promise<{ notifications: Array<{ id: number }> }>;
  cancel(opts: { notifications: Array<{ id: number }> }): Promise<void>;
}

function getCap(): CapacitorBridge | null {
  const w = typeof window !== "undefined" ? (window as unknown as { Capacitor?: CapacitorBridge }) : null;
  return w?.Capacitor ?? null;
}

function getNativePlugin(): LocalNotificationsPlugin | null {
  const cap = getCap();
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.LocalNotifications ?? null;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const native = getNativePlugin();
  if (native) {
    try {
      const r = await native.requestPermissions();
      return r.display === "granted";
    } catch {
      return false;
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendLocalNotification(title: string, body: string, icon = "/icons/icon-192x192.png"): void {
  const native = getNativePlugin();
  if (native) {
    void native
      .schedule({
        notifications: [
          {
            id: Math.floor(Date.now() % 2_147_483_647),
            title,
            body,
            smallIcon: "ic_stat_icon_config_sample",
          },
        ],
      })
      .catch(() => undefined);
    return;
  }
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon, badge: icon, tag: "neurospark" });
  } catch {
    // Notification constructor may fail on some mobile browsers
  }
}

/**
 * Schedule a notification for a future date. Native uses the Capacitor plugin
 * (which honours OS quiet-hours / Doze). Web falls back to a setTimeout that
 * fires `sendLocalNotification` if the tab is still open — clearly weaker, so
 * the smartScheduler treats web as best-effort.
 */
export function scheduleLocalNotificationAt(
  title: string,
  body: string,
  at: Date,
  id?: number,
): { ok: boolean; id: number } {
  const native = getNativePlugin();
  const notifId = id ?? Math.floor(Date.now() % 2_147_483_647);
  if (native) {
    void native
      .schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            schedule: { at, allowWhileIdle: false },
            smallIcon: "ic_stat_icon_config_sample",
          },
        ],
      })
      .catch(() => undefined);
    return { ok: true, id: notifId };
  }
  // Web fallback: only fires if the tab is still open at the time.
  const ms = at.getTime() - Date.now();
  if (ms <= 0) {
    sendLocalNotification(title, body);
    return { ok: true, id: notifId };
  }
  setTimeout(() => sendLocalNotification(title, body), Math.min(ms, 24 * 60 * 60 * 1000));
  return { ok: true, id: notifId };
}

export async function cancelLocalNotification(id: number): Promise<void> {
  const native = getNativePlugin();
  if (!native) return;
  try {
    await native.cancel({ notifications: [{ id }] });
  } catch {
    /* ignore */
  }
}

export function isNotificationSupported(): boolean {
  if (getNativePlugin()) return true;
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}
