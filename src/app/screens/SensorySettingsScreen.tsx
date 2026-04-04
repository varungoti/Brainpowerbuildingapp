import React, { useState, useEffect } from "react";
import { useApp, type SensoryProfile, type SensoryCondition } from "../context/AppContext";
import { SENSORY_CONDITIONS, PROFILE_TYPES, createDefaultProfile } from "../../lib/sensory/sensoryProfiles";

export function SensorySettingsScreen() {
  const { activeChild, sensoryProfiles, saveSensoryProfile, goBack } = useApp();
  const childId = activeChild?.id ?? "";
  const existing = sensoryProfiles[childId] ?? createDefaultProfile();

  const [profileType, setProfileType] = useState<SensoryProfile["type"]>(existing.type);
  const [conditions, setConditions] = useState<SensoryCondition[]>(existing.conditions);

  useEffect(() => {
    const p = sensoryProfiles[childId] ?? createDefaultProfile();
    setProfileType(p.type);
    setConditions(p.conditions);
  }, [childId, sensoryProfiles]);

  const toggleCondition = (c: SensoryCondition) => {
    setConditions(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c],
    );
  };

  const handleSave = () => {
    if (!childId) return;
    saveSensoryProfile(childId, {
      type: profileType,
      conditions,
      modifications: conditions.map(c => `${c}-adapted`),
    });
    goBack();
  };

  if (!activeChild) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-gray-500">
        Select a child to configure sensory settings.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">Sensory Settings</h2>
        <p className="text-xs text-gray-500">Configure for {activeChild.name}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Profile Type</h3>
        <div className="space-y-2">
          {PROFILE_TYPES.map(pt => (
            <button
              key={pt.id}
              onClick={() => setProfileType(pt.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
              style={{
                borderColor: profileType === pt.id ? "#4361EE" : "#E5E7EB",
                background: profileType === pt.id ? "rgba(67,97,238,0.06)" : "white",
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{pt.label}</div>
                <div className="text-[10px] text-gray-500">{pt.description}</div>
              </div>
              {profileType === pt.id && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#4361EE" }}>
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Conditions</h3>
        <div className="space-y-2">
          {SENSORY_CONDITIONS.map(sc => (
            <button
              key={sc.id}
              onClick={() => toggleCondition(sc.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
              style={{
                borderColor: conditions.includes(sc.id) ? "#4361EE" : "#E5E7EB",
                background: conditions.includes(sc.id) ? "rgba(67,97,238,0.06)" : "white",
              }}
            >
              <span className="text-lg">{sc.emoji}</span>
              <span className="text-sm text-gray-900 flex-1">{sc.label}</span>
              {conditions.includes(sc.id) && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#4361EE" }}>
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm"
        style={{ background: "linear-gradient(135deg, #4361EE, #7209B7)" }}
      >
        Save Sensory Profile
      </button>
    </div>
  );
}
