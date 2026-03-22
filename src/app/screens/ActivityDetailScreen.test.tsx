// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityDetailScreen } from "./ActivityDetailScreen";

const goBack = vi.fn();
const setViewingActivity = vi.fn();

vi.mock("../context/AppContext", () => ({
  useApp: () => ({
    viewingActivity: {
      id: "a01",
      name: "Rice Sensory Bin",
      emoji: "🌾",
      regionEmoji: "🇮🇹",
      region: "Western",
      description: "A calm sensory activity.",
      instructions: ["Fill the bowl", "Hide 3 objects"],
      duration: 8,
      materials: ["Rice / Grains", "Bowls / Plates"],
      intelligences: ["Bodily-Kinesthetic", "Naturalist"],
      method: "Montessori",
      ageTiers: [1, 2],
      difficulty: 1,
      parentTip: "Sensory play supports early discrimination circuits.",
      skillTags: ["dual-task"],
      extensionIdeas: ["Add scooping tongs"],
    },
    goBack,
    setViewingActivity,
  }),
}));

describe("ActivityDetailScreen", () => {
  it("renders the selected activity and allows returning", () => {
    render(<ActivityDetailScreen />);

    expect(screen.getByText("Rice Sensory Bin")).toBeInTheDocument();
    expect(screen.getByText("What this activity builds")).toBeInTheDocument();
    expect(screen.getByText("Rice / Grains")).toBeInTheDocument();
    expect(screen.getByText(/Add scooping tongs/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Back to activities/i }));
    expect(setViewingActivity).toHaveBeenCalledWith(null);
    expect(goBack).toHaveBeenCalled();
  });
});
