"use client";

import { useState, useEffect, useMemo } from "react";
import { getDisplayName, type GdItem } from "@/lib/core/gd-item";

const LIBRETRO_BASE =
  "https://thumbnails.libretro.com/Sega%20-%20Dreamcast/Named_Boxarts";

// Loaded once, cached
let gameDbPromise: Promise<Record<string, string>> | null = null;
let gameDbCache: Record<string, string> | null = null;

function loadGameDb(): Promise<Record<string, string>> {
  if (gameDbCache) return Promise.resolve(gameDbCache);
  if (!gameDbPromise) {
    gameDbPromise = fetch("/gamedb.json")
      .then((r) => r.json())
      .then((entries: { serial: string; name: string }[]) => {
        const map: Record<string, string> = {};
        for (const e of entries) {
          // Normalize serial: strip spaces, uppercase
          map[e.serial.replace(/[\s-]/g, "").toUpperCase()] = e.name;
        }
        gameDbCache = map;
        return map;
      })
      .catch(() => {
        gameDbCache = {};
        return {};
      });
  }
  return gameDbPromise;
}

// Convert IP.BIN uppercase name to title case for libretro matching
function toTitleCase(str: string): string {
  const lowerWords = new Set(["of", "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "vs", "vs."]);
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (i === 0 || !lowerWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
}

// Sanitize for libretro filename
function sanitize(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, "_")
    .replace(/&/g, "_")
    .trim();
}

function buildUrl(name: string, suffix?: string): string {
  const full = suffix ? `${name} ${suffix}` : name;
  return `${LIBRETRO_BASE}/${encodeURIComponent(full)}.png`;
}

// Build all candidate URLs, prioritized
function buildCandidateUrls(
  rawName: string,
  regions?: string[],
  dbName?: string | null,
  serial?: string | null,
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const addUrl = (url: string) => {
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  // Region suffixes
  const regionSuffixes: string[] = [];
  if (regions) {
    if (regions.includes("U")) regionSuffixes.push("(USA)");
    if (regions.includes("E")) regionSuffixes.push("(Europe)");
    if (regions.includes("J")) regionSuffixes.push("(Japan)");
  }
  if (!regionSuffixes.includes("(USA)")) regionSuffixes.push("(USA)");
  if (!regionSuffixes.includes("(Europe)")) regionSuffixes.push("(Europe)");
  if (!regionSuffixes.includes("(Japan)")) regionSuffixes.push("(Japan)");

  // 1. DB name (highest priority - most accurate)
  if (dbName) {
    const cleanDb = sanitize(dbName);
    for (const suffix of regionSuffixes) {
      addUrl(buildUrl(cleanDb, suffix));
    }
    addUrl(buildUrl(cleanDb));
  }

  // 2. Title case from IP.BIN name
  const titleName = sanitize(toTitleCase(rawName));
  for (const suffix of regionSuffixes) {
    addUrl(buildUrl(titleName, suffix));
  }
  addUrl(buildUrl(titleName));

  // 3. Original name (might be from name.txt, already formatted)
  const cleanRaw = sanitize(rawName);
  if (cleanRaw !== titleName) {
    for (const suffix of regionSuffixes) {
      addUrl(buildUrl(cleanRaw, suffix));
    }
    addUrl(buildUrl(cleanRaw));
  }

  // 4. Try removing common suffixes/prefixes from IP.BIN names
  // IP.BIN sometimes has extra text like "DISC 1", version info etc.
  const simplified = rawName
    .replace(/\s*(DISC|DISK)\s*\d.*/i, "")
    .replace(/\s*V\d+\.\d+.*/i, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim();
  if (simplified !== rawName) {
    const titleSimplified = sanitize(toTitleCase(simplified));
    for (const suffix of regionSuffixes) {
      addUrl(buildUrl(titleSimplified, suffix));
    }
  }

  // 5. Try with "- " replaced by " - " (LibRetro uses spaced dashes)
  if (rawName.includes("-")) {
    const dashed = rawName.replace(/-/g, " - ").replace(/\s+/g, " ").trim();
    const titleDashed = sanitize(toTitleCase(dashed));
    if (titleDashed !== titleName) {
      for (const suffix of regionSuffixes) {
        addUrl(buildUrl(titleDashed, suffix));
      }
    }
  }

  // 6. Try IP.BIN gameName directly (not display name which might be from name.txt)
  // Already covered through rawName variations

  return urls;
}

export function useGameCover(item: GdItem | null) {
  const [dbName, setDbName] = useState<string | null>(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Load DB name from serial
  useEffect(() => {
    if (!item?.ip?.productNumber) {
      setDbName(null);
      setDbLoaded(true);
      return;
    }

    const serial = item.ip.productNumber.replace(/[\s-]/g, "").toUpperCase();
    loadGameDb().then((db) => {
      setDbName(db[serial] || null);
      setDbLoaded(true);
    });
  }, [item?.ip?.productNumber]);

  const candidateUrls = useMemo(() => {
    if (!item || item.isMenu || !dbLoaded) return [];

    // Use IP.BIN gameName as primary source
    const ipName = item.ip?.gameName?.trim();
    const displayName = getDisplayName(item);
    const rawName = ipName || displayName;

    return buildCandidateUrls(
      rawName,
      item.ip?.regions,
      dbName,
      item.ip?.productNumber,
    );
  }, [item, dbName, dbLoaded]);

  const [urlIndex, setUrlIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  // Reset when item changes
  useEffect(() => {
    setUrlIndex(0);
    setFailed(false);
  }, [candidateUrls]);

  const onError = () => {
    if (urlIndex < candidateUrls.length - 1) {
      setUrlIndex(urlIndex + 1);
    } else {
      setFailed(true);
    }
  };

  const coverUrl = !failed && candidateUrls.length > 0 ? candidateUrls[urlIndex] : null;

  return { coverUrl, onError };
}
