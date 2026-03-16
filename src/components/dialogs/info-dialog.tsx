"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RegionBadge } from "@/components/common/region-badge";
import { VgaBadge } from "@/components/common/vga-badge";
import { FileSize } from "@/components/common/file-size";
import { getDisplayName, getSerial, type GdItem } from "@/lib/core/gd-item";
import { useSettingsStore } from "@/store/settings-store";

interface InfoDialogProps {
  item: GdItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

export function InfoDialog({ item, open, onOpenChange }: InfoDialogProps) {
  const { t } = useSettingsStore();

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{getDisplayName(item)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{item.imageFormat}</Badge>
            <Badge variant="secondary">{item.discType}</Badge>
            {item.ip && <RegionBadge regions={item.ip.regions} />}
            {item.ip && <VgaBadge vga={item.ip.vga} />}
            {item.isMenu && <Badge>{t("row.menu")}</Badge>}
            {item.isCodeBreaker && <Badge variant="destructive">CodeBreaker</Badge>}
            {item.isBleem && <Badge variant="outline">BleemGame</Badge>}
          </div>

          <Separator />

          <div className="space-y-2">
            <InfoRow label={t("info.folder")} value={item.fullPath} />
            <InfoRow label={t("info.name")} value={getDisplayName(item)} />
            <InfoRow label={t("info.serial")} value={getSerial(item)} />
            <InfoRow label={t("info.size")} value={<FileSize bytes={item.totalSize} />} />
            <InfoRow label={t("info.files")} value={String(item.fileCount)} />
            <InfoRow label={t("info.format")} value={item.imageFormat} />
            <InfoRow label={t("info.discType")} value={item.discType} />
          </div>

          {item.ip && (
            <>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("info.ipBin")}
              </p>
              <div className="space-y-2">
                <InfoRow label={t("info.hardwareId")} value={item.ip.hardwareId} />
                <InfoRow label={t("info.makerId")} value={item.ip.makerId} />
                <InfoRow label={t("info.deviceInfo")} value={item.ip.deviceInfo} />
                <InfoRow label={t("info.productNumber")} value={item.ip.productNumber} />
                <InfoRow label={t("info.version")} value={item.ip.version} />
                <InfoRow label={t("info.releaseDate")} value={item.ip.releaseDate} />
                <InfoRow label={t("info.bootFile")} value={item.ip.bootFilename} />
                <InfoRow label={t("info.publisher")} value={item.ip.publisher} />
                <InfoRow label={t("info.gameName")} value={item.ip.gameName} />
                <InfoRow label={t("info.areaSymbols")} value={item.ip.areaSymbols} />
                <InfoRow label={t("info.peripherals")} value={item.ip.peripherals} />
              </div>
            </>
          )}

          {item.gdiTracks.length > 0 && (
            <>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("info.gdiTracks")} ({item.gdiTracks.length})
              </p>
              <div className="max-h-40 overflow-auto scrollbar-none rounded border bg-muted/50 p-2 text-xs font-mono">
                {item.gdiTracks.map((track) => (
                  <div key={track.trackNumber} className="flex gap-4">
                    <span className="w-6 text-right">{track.trackNumber}</span>
                    <span className="w-16 text-right">{track.startLba}</span>
                    <span className="w-6 text-center">{track.type}</span>
                    <span className="w-12 text-right">{track.sectorSize}</span>
                    <span className="flex-1">{track.filename}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
