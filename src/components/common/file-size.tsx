"use client";

import { formatSize } from "@/lib/core/gd-item";

interface FileSizeProps {
  bytes: number;
}

export function FileSize({ bytes }: FileSizeProps) {
  return <span className="text-muted-foreground tabular-nums">{formatSize(bytes)}</span>;
}
