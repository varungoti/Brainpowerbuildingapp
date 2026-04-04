import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { detectSeason, seasonMatchScore, type Season } from "../../lib/seasonal/seasonDetector";
import { getSeasonalVariant, getSeasonalBoostForActivity } from "../data/seasonalActivities";
import { ACTIVITIES as activities } from "../data/activities";

export function SeasonalLibraryScreen() {
  const { navigate, setViewingActivity } = useApp();
  const season = useMemo(() => detectSeason(), []);

  const seasonalPicks = useMemo(() => {
    const scored = activities.map(a => ({
      activity: getSeasonalVariant(a, season.season),
      score: seasonMatchScore(a.seasonalTags, season.season) + getSeasonalBoostForActivity(a.id, season.season),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, 12);
  }, [season.season]);

  const allSeasons: { id: Season; emoji: string; label: string }[] = [
    { id: "summer", emoji: "☀️", label: "Summer" },
    { id: "monsoon", emoji: "🌧️", label: "Monsoon" },
    { id: "autumn", emoji: "🍂", label: "Autumn" },
    { id: "winter", emoji: "❄️", label: "Winter" },
    { id: "spring", emoji: "🌸", label: "Spring" },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">Seasonal Activities</h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: "rgba(67,97,238,0.08)" }}>
          <span>{season.emoji}</span>
          <span className="text-xs font-medium text-gray-700">Currently: {season.label}</span>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {allSeasons.map(s => (
          <div
            key={s.id}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium"
            style={{
              background: s.id === season.season ? "rgba(67,97,238,0.12)" : "rgba(0,0,0,0.03)",
              color: s.id === season.season ? "#4361EE" : "#9CA3AF",
            }}
          >
            {s.emoji} {s.label}
          </div>
        ))}
      </div>

      {seasonalPicks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🌿</div>
          <p className="text-sm text-gray-500">No seasonal activities available right now.</p>
          <p className="text-xs text-gray-400 mt-1">Activities are being tagged with seasonal metadata.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasonalPicks.map(({ activity, score }) => (
            <button
              key={activity.id}
              onClick={() => {
                setViewingActivity(activity);
                navigate("activity_detail");
              }}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{activity.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900">{activity.name}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-gray-400">{activity.duration} min</span>
                    <span className="text-[9px] text-gray-400">·</span>
                    <span className="text-[9px] text-gray-400">{activity.region}</span>
                    {score > 10 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-green-50 text-green-600">
                        Seasonal Pick
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
