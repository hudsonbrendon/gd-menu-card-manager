"use client";

import { Badge } from "@/components/ui/badge";
import { REGION_LABELS } from "@/lib/core/enums";

const REGION_FLAGS: Record<string, string> = {
  J: "\u{1F1EF}\u{1F1F5}", // 🇯🇵
  U: "\u{1F1FA}\u{1F1F8}", // 🇺🇸
  E: "\u{1F1EA}\u{1F1FA}", // 🇪🇺
};

const REGION_COLORS: Record<string, string> = {
  J: "bg-red-500/10 text-red-500 border-red-500/25",
  U: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  E: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
};

interface RegionBadgeProps {
  regions: string[];
}

export function RegionBadge({ regions }: RegionBadgeProps) {
  if (regions.length === 0) return null;

  const combined = regions.join("");
  const label = REGION_LABELS[combined] || combined;

  if (regions.length >= 3) {
    return (
      <Badge variant="outline" className="text-[10px] bg-dc-orange/10 text-dc-orange border-dc-orange/25">
        <span className="mr-0.5">{"\u{1F30D}"}</span>
        {label}
      </Badge>
    );
  }

  return (
    <div className="flex gap-1">
      {regions.map((r) => (
        <Badge
          key={r}
          variant="outline"
          className={`text-[10px] ${REGION_COLORS[r] || ""}`}
        >
          <span className="mr-0.5">{REGION_FLAGS[r] || ""}</span>
          {REGION_LABELS[r] || r}
        </Badge>
      ))}
    </div>
  );
}
