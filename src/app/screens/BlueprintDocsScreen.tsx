import React from "react";
import { useApp } from "../context/AppContext";
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
  const { goBack } = useApp();

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
