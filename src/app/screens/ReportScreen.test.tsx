// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportScreen } from "./ReportScreen";

const addReportHistoryEntry = vi.fn();
vi.mock("../context/AppContext", () => ({
  useApp: () => ({
    activeChild: {
      id: "synthetic-child", name: "Synthetic", dob: "2018-06-01", brainPoints: 0,
      level: 1, intelligenceScores: {},
    },
    activityLogs: [2, 4].map(day => ({
      id: `synthetic-${day}`, childId: "synthetic-child", completed: true,
      date: new Date(2026, 2, day, 12).toISOString(), duration: 10,
      engagementRating: 4, region: "Frontal", intelligences: [],
    })),
    addReportHistoryEntry,
  }),
}));

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe("ReportScreen activity-day label", () => {
  it("shows nonconsecutive participation as active days and records local week keys", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 8, 12));
    render(<ReportScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Generate Report" }));
    expect(screen.getByText(/2 active days this week/)).toBeInTheDocument();
    expect(screen.queryByText(/2-day streak/)).not.toBeInTheDocument();
    expect(addReportHistoryEntry).toHaveBeenCalledWith({ weekStart: "2026-03-02", weekEnd: "2026-03-08" });
  });
});
