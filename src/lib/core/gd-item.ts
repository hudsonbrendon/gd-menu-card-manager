import { DiscType, ImageFormat } from "./enums";

export interface IpBinInfo {
  hardwareId: string;
  makerId: string;
  deviceInfo: string;
  areaSymbols: string;
  peripherals: string;
  productNumber: string;
  version: string;
  releaseDate: string;
  bootFilename: string;
  publisher: string;
  gameName: string;
  vga: boolean;
  regions: string[];
}

export interface GdiTrack {
  trackNumber: number;
  startLba: number;
  type: number; // 0 = audio, 4 = data
  sectorSize: number;
  filename: string;
  offset: number;
}

export interface GdItem {
  id: string;
  folderNumber: number;
  name: string;
  fullPath: string;
  sdCardPath: string;
  imageFormat: ImageFormat;
  discType: DiscType;
  fileCount: number;
  totalSize: number;
  ip: IpBinInfo | null;
  gdiTracks: GdiTrack[];
  isMenu: boolean;
  isCodeBreaker: boolean;
  isBleem: boolean;
  nameFromFile: string | null;
  serialFromFile: string | null;
  directoryHandle: FileSystemDirectoryHandle | null;
}

export function createGdItem(
  folderNumber: number,
  name: string,
  dirHandle: FileSystemDirectoryHandle | null = null,
): GdItem {
  const paddedFolder = String(folderNumber).padStart(2, "0");
  return {
    id: `gd-${paddedFolder}-${Date.now()}`,
    folderNumber,
    name,
    fullPath: paddedFolder,
    sdCardPath: paddedFolder,
    imageFormat: ImageFormat.Unknown,
    discType: DiscType.Unknown,
    fileCount: 0,
    totalSize: 0,
    ip: null,
    gdiTracks: [],
    isMenu: folderNumber === 1,
    isCodeBreaker: false,
    isBleem: false,
    nameFromFile: null,
    serialFromFile: null,
    directoryHandle: dirHandle,
  };
}

export function getDisplayName(item: GdItem): string {
  if (item.nameFromFile) return item.nameFromFile;
  if (item.ip?.gameName) return item.ip.gameName.trim();
  return item.name;
}

export function getSerial(item: GdItem): string {
  if (item.serialFromFile) return item.serialFromFile;
  if (item.ip?.productNumber) return item.ip.productNumber.trim();
  return "";
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
