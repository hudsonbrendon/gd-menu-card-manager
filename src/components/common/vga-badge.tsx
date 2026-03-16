"use client";

import { Badge } from "@/components/ui/badge";

interface VgaBadgeProps {
  vga: boolean;
}

export function VgaBadge({ vga }: VgaBadgeProps) {
  if (!vga) return null;
  return (
    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-600 border-cyan-500/25 font-mono">
      VGA
    </Badge>
  );
}
