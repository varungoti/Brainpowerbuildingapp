// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  scheduleLocalNotificationAt,
  sendLocalNotification,
  isNotificationSupported,
} from "./notificationChannel";

interface CapacitorMock {
  isNativePlatform: () => boolean;
  Plugins: {
    LocalNotifications: {
      schedule: ReturnType<typeof vi.fn>;
      requestPermissions: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
      checkPermissions: ReturnType<typeof vi.fn>;
    };
  };
}

function installCapacitorMock(): CapacitorMock {
  const mock: CapacitorMock = {
    isNativePlatform: () => true,
    Plugins: {
      LocalNotifications: {
        schedule: vi.fn().mockResolvedValue({ notifications: [{ id: 1 }] }),
        requestPermissions: vi.fn().mockResolvedValue({ display: "granted" }),
        cancel: vi.fn().mockResolvedValue(undefined),
        checkPermissions: vi.fn().mockResolvedValue({ display: "granted" }),
      },
    },
  };
  (window as unknown as { Capacitor: CapacitorMock }).Capacitor = mock;
  return mock;
}

describe("notificationChannel — native (Capacitor) path", () => {
  beforeEach(() => {
    delete (window as { Capacitor?: unknown }).Capacitor;
  });

  it("isNotificationSupported is true when Capacitor LocalNotifications is bridged", () => {
    installCapacitorMock();
    expect(isNotificationSupported()).toBe(true);
  });

  it("scheduleLocalNotificationAt routes to the native plugin", () => {
    const mock = installCapacitorMock();
    const future = new Date(Date.now() + 60_000);
    const r = scheduleLocalNotificationAt("Hello", "Body", future, 42);
    expect(r.ok).toBe(true);
    expect(mock.Plugins.LocalNotifications.schedule).toHaveBeenCalledTimes(1);
    const arg = mock.Plugins.LocalNotifications.schedule.mock.calls[0]![0];
    expect(arg.notifications[0]).toMatchObject({ id: 42, title: "Hello", body: "Body" });
    expect(arg.notifications[0].schedule.at).toBeInstanceOf(Date);
  });

  it("sendLocalNotification routes to the native plugin schedule()", () => {
    const mock = installCapacitorMock();
    sendLocalNotification("T", "B");
    expect(mock.Plugins.LocalNotifications.schedule).toHaveBeenCalledTimes(1);
  });
});

describe("notificationChannel — web fallback", () => {
  beforeEach(() => {
    delete (window as { Capacitor?: unknown }).Capacitor;
  });

  it("scheduleLocalNotificationAt with a past time fires immediately via web Notification", () => {
    // jsdom does not implement Notification by default; just assert the call
    // does not throw and returns ok.
    const r = scheduleLocalNotificationAt("Hi", "Body", new Date(Date.now() - 1000));
    expect(r.ok).toBe(true);
  });
});
