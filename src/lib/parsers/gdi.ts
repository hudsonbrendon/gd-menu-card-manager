import type { GdiTrack } from "@/lib/core/gd-item";

export function parseGdiFile(content: string): GdiTrack[] {
  const lines = content.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const trackCount = parseInt(lines[0].trim(), 10);
  if (isNaN(trackCount) || trackCount < 1) return [];

  const tracks: GdiTrack[] = [];

  for (let i = 1; i < lines.length && tracks.length < trackCount; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Format: trackNumber startLba type sectorSize filename offset
    const parts = line.split(/\s+/);
    if (parts.length < 6) continue;

    const filename = parts[4].replace(/"/g, "");

    tracks.push({
      trackNumber: parseInt(parts[0], 10),
      startLba: parseInt(parts[1], 10),
      type: parseInt(parts[2], 10),
      sectorSize: parseInt(parts[3], 10),
      filename,
      offset: parseInt(parts[5], 10),
    });
  }

  return tracks;
}

export function getDataTrack(tracks: GdiTrack[]): GdiTrack | undefined {
  // The last track with type 4 (data) is typically the high-density area data track
  return [...tracks].reverse().find((t) => t.type === 4);
}

export function getLowDensityDataTrack(tracks: GdiTrack[]): GdiTrack | undefined {
  // Track 1 is typically the low-density data track
  return tracks.find((t) => t.trackNumber === 1 && t.type === 4);
}
