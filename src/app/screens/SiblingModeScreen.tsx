import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { matchActivities, type SiblingPack } from "../../lib/sibling/siblingMatcher";
import { ACTIVITIES as activities } from "../data/activities";

export function SiblingModeScreen() {
  const { children, addSiblingGroup, addCollaborationLog, navigate } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [packs, setPacks] = useState<SiblingPack[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);

  const selectedChildren = useMemo(
    () => children.filter(c => selectedIds.includes(c.id)),
    [children, selectedIds],
  );

  const toggleChild = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
    setPacks([]);
    setGroupId(null);
  };

  const handleMatch = () => {
    if (selectedChildren.length < 2) return;
    const matched = matchActivities(selectedChildren, activities, 5);
    setPacks(matched);
    const gId = addSiblingGroup({
      childIds: selectedIds,
      name: selectedChildren.map(c => c.name).join(" & "),
    });
    setGroupId(gId);
  };

  const handleStartActivity = (pack: SiblingPack) => {
    if (groupId) {
      addCollaborationLog({
        groupId,
        childIds: selectedIds,
        activityId: pack.activity.id,
      });
    }
    navigate("activity_detail");
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">Sibling Collaboration</h2>
        <p className="text-xs text-gray-500">Activities designed for siblings at different ages</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Select Children (2+)</h3>
        <div className="space-y-2">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => toggleChild(child.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={{
                borderColor: selectedIds.includes(child.id) ? "#4361EE" : "#E5E7EB",
                background: selectedIds.includes(child.id) ? "rgba(67,97,238,0.06)" : "white",
              }}
            >
              <span className="text-2xl">{child.avatarEmoji}</span>
              <div className="text-left flex-1">
                <div className="text-sm font-medium text-gray-900">{child.name}</div>
                <div className="text-[10px] text-gray-500">Tier {child.ageTier} · Level {child.level}</div>
              </div>
              {selectedIds.includes(child.id) && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#4361EE" }}>
                  <span className="text-white text-[10px]">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
        {children.length < 2 && (
          <p className="text-xs text-amber-600 mt-2">
            Add at least 2 children to use Sibling Mode.
          </p>
        )}
      </div>

      {selectedIds.length >= 2 && packs.length === 0 && (
        <button
          onClick={handleMatch}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, #4361EE, #7209B7)" }}
        >
          Find Collaborative Activities
        </button>
      )}

      {packs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Matched Activities</h3>
          {packs.map(pack => (
            <div key={pack.activity.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl">{pack.activity.emoji}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900">{pack.activity.name}</h4>
                  <p className="text-[10px] text-gray-500">{pack.activity.duration} min · {pack.activity.region}</p>
                </div>
                {pack.activity.collaborationType && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-50 text-blue-600">
                    {pack.activity.collaborationType}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedChildren.map(child => (
                  <span key={child.id} className="px-2 py-0.5 rounded-full text-[9px] bg-gray-100 text-gray-600">
                    {child.avatarEmoji} {child.name}: {pack.roles[child.id]}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleStartActivity(pack)}
                className="w-full py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "#4361EE" }}
              >
                Start Together
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
