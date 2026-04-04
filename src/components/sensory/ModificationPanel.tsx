import React from "react";
import type { SensoryAdaptation } from "../../lib/sensory/sensoryAdapter";

interface Props {
  adaptation: SensoryAdaptation;
  originalInstructions: string[];
}

export function ModificationPanel({ adaptation, originalInstructions }: Props) {
  const hasChanges = adaptation.adaptedInstructions.length !== originalInstructions.length
    || adaptation.adaptedInstructions.some((s, i) => s !== originalInstructions[i]);

  if (!hasChanges && adaptation.warnings.length === 0) return null;

  return (
    <div className="bg-teal-50 rounded-xl p-3 space-y-2">
      <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
        <span>🧩</span> Sensory Adaptations Active
      </h4>

      {adaptation.warnings.length > 0 && (
        <div className="space-y-0.5">
          {adaptation.warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-amber-700">⚠️ {w}</p>
          ))}
        </div>
      )}

      {adaptation.adaptedMaterials.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-teal-700 mb-0.5">Adapted Materials:</p>
          <div className="flex flex-wrap gap-1">
            {adaptation.adaptedMaterials.map((m, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-white text-teal-700">{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
