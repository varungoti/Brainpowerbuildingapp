import React from "react";

interface Props {
  avg: number;
  count: number;
}

export function CommunityBadge({ avg, count }: Props) {
  if (count < 3) return null;

  const stars = Math.round(avg);
  const starStr = "★".repeat(stars) + "☆".repeat(5 - stars);

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50">
      <span className="text-[10px] text-amber-500">{starStr}</span>
      <span className="text-[9px] text-gray-500">({count})</span>
    </div>
  );
}
