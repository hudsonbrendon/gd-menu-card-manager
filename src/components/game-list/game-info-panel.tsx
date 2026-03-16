"use client";

import { useState, useEffect } from "react";
import { DreamcastSpiral } from "@/components/common/dreamcast-spiral";
import { useGameCover } from "@/hooks/useGameCover";
import { getDisplayName, getSerial, formatSize, type GdItem } from "@/lib/core/gd-item";
import { REGION_LABELS } from "@/lib/core/enums";

interface GameInfoPanelProps {
  item: GdItem | null;
}

export function GameInfoPanel({ item }: GameInfoPanelProps) {
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gd-bg">
        <DreamcastSpiral size={140} color="#1a4a5a" />
      </div>
    );
  }

  return <GameInfoContent item={item} />;
}

function GameInfoContent({ item }: { item: GdItem }) {
  const { coverUrl, onError } = useGameCover(item);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
  }, [coverUrl]);

  const name = getDisplayName(item);
  const serial = getSerial(item);
  const regionStr = item.ip?.regions
    ? REGION_LABELS[item.ip.regions.join("")] || item.ip.regions.join("")
    : "—";
  const vgaStr = item.ip?.vga ? "YES" : "NO";
  const discStr = item.ip ? "1/1" : "—";
  const dateStr = item.ip?.releaseDate || "—";
  const versionStr = item.ip?.version || "—";

  const showCover = !!coverUrl;

  return (
    <div id="game-info" className="h-full flex flex-col p-4 bg-gd-bg overflow-y-auto scrollbar-none">
      {/* GDmenu title */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gd-text tracking-wide" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive" }}>
          GDmenu
        </h2>
      </div>

      {/* Game name */}
      <div className="text-xs text-gd-dim mb-4 text-center break-words leading-relaxed font-mono">
        {name}
      </div>

      {/* Info table */}
      <div className="border border-gd-border rounded-sm overflow-hidden mb-4">
        <InfoRow label="REGION" value={regionStr} />
        <InfoRow label="VGA" value={vgaStr} highlight={item.ip?.vga} />
        <InfoRow label="DISC" value={discStr} />
        <InfoRow label="DATE" value={dateStr} />
        <InfoRow label="VERSION" value={versionStr} />
        {serial && <InfoRow label="SERIAL" value={serial} />}
        <InfoRow label="FORMAT" value={item.imageFormat} />
        <InfoRow label="SIZE" value={formatSize(item.totalSize)} />
        <InfoRow label="FOLDER" value={`${String(item.folderNumber).padStart(2, "0")}/`} />
      </div>

      {/* Cover or spiral below info table */}
      <div className="flex items-center justify-center mt-2 mb-4">
        {showCover ? (
          <>
            {!imgLoaded && (
              <div className="flex flex-col items-center gap-3">
                <DreamcastSpiral size={250} color="#1a4a5a" className="animate-spin" />
                <span className="text-xs text-gd-dim font-mono">Carregando capa do jogo...</span>
              </div>
            )}
            <div className={`relative w-[250px] h-[250px] ${imgLoaded ? "" : "hidden"}`}>
              {/* CD disc shape */}
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-gd-border shadow-lg"
                style={{
                  background: "radial-gradient(circle, transparent 18%, rgba(0,0,0,0.15) 19%, transparent 20%)",
                }}>
                <img
                  src={coverUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgLoaded(false); onError(); }}
                />
              </div>
              {/* Center hole */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full bg-gd-bg border-2 border-gd-border" />
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                }} />
            </div>
          </>
        ) : (
          <DreamcastSpiral size={250} color="#1a4a5a" />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center border-b border-gd-border last:border-b-0 px-3 py-1.5">
      <span className="text-xs font-bold text-gd-dim tracking-wider w-24">{label}</span>
      <span className={`text-xs font-bold ml-auto ${highlight ? "text-green-400" : "text-gd-text"}`}>
        {value}
      </span>
    </div>
  );
}
