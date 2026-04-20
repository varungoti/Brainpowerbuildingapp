import React, { useState } from "react";

interface NarrativeProps {
  childName: string;
  narrative: string | null;
  isLoading?: boolean;
  onGenerate?: () => void;
  isPremium?: boolean;
}

export function WeeklyNarrative({ childName, narrative, isLoading, onGenerate, isPremium }: NarrativeProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e5e7eb" }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg,#FFF0F6,#F5F0FF)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <span className="font-bold text-gray-800 text-sm">Weekly Progress Note</span>
        </div>
        {!narrative && onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isLoading || !isPremium}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              background: isPremium ? "linear-gradient(135deg,#4361EE,#7209B7)" : "#e5e7eb",
              color: isPremium ? "white" : "#9CA3AF",
            }}>
            {isLoading ? "Generating..." : isPremium ? "Generate" : "Premium"}
          </button>
        )}
      </div>

      {narrative ? (
        <div className="p-4">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {expanded ? narrative : narrative.slice(0, 200) + (narrative.length > 200 ? "..." : "")}
          </p>
          {narrative.length > 200 && (
            <button onClick={() => setExpanded(e => !e)}
              className="text-xs font-semibold mt-2" style={{ color: "#4361EE" }}>
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 text-center">
          <p className="text-gray-400 text-xs">
            {isPremium
              ? `AI-generated progress narrative for ${childName}'s week`
              : "Upgrade to Premium for AI-generated weekly progress narratives"
            }
          </p>
        </div>
      )}
    </div>
  );
}
