import React from "react";
import { useApp } from "../context/AppContext";
import { canAccessBlueprint } from "@/utils/adminAccess";
import { ResearchFramework } from "../components/blueprint/ResearchFramework";
import { IntelligenceMatrix } from "../components/blueprint/IntelligenceMatrix";
import { DevelopmentalMatrix } from "../components/blueprint/DevelopmentalMatrix";
import { AlgorithmSection } from "../components/blueprint/AlgorithmSection";
import { DatabaseSection } from "../components/blueprint/DatabaseSection";
import { MaterialsSection } from "../components/blueprint/MaterialsSection";
import { FeaturesSection } from "../components/blueprint/FeaturesSection";
import { RoadmapSection } from "../components/blueprint/RoadmapSection";

const SECTIONS = [
  ResearchFramework,
  IntelligenceMatrix,
  DevelopmentalMatrix,
  AlgorithmSection,
  DatabaseSection,
  MaterialsSection,
  FeaturesSection,
  RoadmapSection,
];

export function BlueprintDocsScreen() {
  const { goBack, user, navigate } = useApp();

  if (!canAccessBlueprint(user)) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-3" style={{ background: "#F0EFFF" }}>
        <div className="text-4xl">🔒</div>
        <p className="text-gray-600 text-sm font-semibold">This area is restricted to team administrators.</p>
        <button type="button" onClick={() => navigate("profile")} className="text-[#4361EE] text-sm font-bold underline">
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="p-4 rounded-b-3xl mb-2" style={{ background: "linear-gradient(135deg,#1a1a2e,#302b63)" }}>
        <button onClick={goBack} className="w-8 h-8 rounded-full glass flex items-center justify-center mb-2">
          <span className="text-white">‹</span>
        </button>
        <div className="text-white font-black text-lg">Blueprint Documentation</div>
        <div className="text-white/50 text-xs">Full research & architecture spec · v1.0</div>
      </div>
      <div className="space-y-4 p-4 pb-8">
        {SECTIONS.map((Section, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <Section />
          </div>
        ))}
      </div>
    </div>
  );
}
