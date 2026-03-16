import { createGdItem, type GdItem } from "./gd-item";
import { ImageFormat, DiscType, GDEMU_FOLDER_PATTERN } from "./enums";
import { NAME_TXT, SERIAL_TXT, CODEBREAKER_SERIAL, BLEEM_IDENTIFIER, KNOWN_MENU_SERIALS } from "./constants";
import type { FileSystemProvider } from "@/lib/fs/file-system-provider";
import { parseGdiFile, getDataTrack } from "@/lib/parsers/gdi";
import { findIpBinInFile, searchForSegaHeader } from "@/lib/parsers/ip-bin";

export interface ScanProgress {
  current: number;
  total: number;
  currentFolder: string;
}

export async function scanSdCard(
  rootHandle: FileSystemDirectoryHandle,
  fs: FileSystemProvider,
  onProgress?: (progress: ScanProgress) => void,
): Promise<GdItem[]> {
  const dirs = await fs.listDirectories(rootHandle);
  const gameDirs = dirs.filter((d) => GDEMU_FOLDER_PATTERN.test(d.name));

  const items: GdItem[] = [];
  const total = gameDirs.length;

  for (let i = 0; i < gameDirs.length; i++) {
    const dir = gameDirs[i];
    const folderNumber = parseInt(dir.name, 10);

    onProgress?.({ current: i + 1, total, currentFolder: dir.name });

    try {
      const item = await scanFolder(folderNumber, dir.handle, fs);
      items.push(item);
    } catch (e) {
      console.warn(`Failed to scan folder ${dir.name}:`, e);
    }
  }

  return items.sort((a, b) => a.folderNumber - b.folderNumber);
}

async function scanFolder(
  folderNumber: number,
  dirHandle: FileSystemDirectoryHandle,
  fs: FileSystemProvider,
): Promise<GdItem> {
  const item = createGdItem(folderNumber, dirHandle.name, dirHandle);

  // Read name.txt and serial.txt
  const [nameContent, serialContent] = await Promise.all([
    fs.readTextFile(dirHandle, NAME_TXT),
    fs.readTextFile(dirHandle, SERIAL_TXT),
  ]);

  item.nameFromFile = nameContent?.trim() || null;
  item.serialFromFile = serialContent?.trim() || null;

  // List files to detect image format and calculate size
  const files = await fs.listFiles(dirHandle);
  item.fileCount = files.length;

  let totalSize = 0;
  let gdiFile: File | null = null;
  let dataTrackFile: File | null = null;
  let biggestFile: { file: File; size: number } | null = null;

  for (const f of files) {
    const size = await fs.getFileSize(f.handle);
    totalSize += size;

    const lowerName = f.name.toLowerCase();

    if (lowerName.endsWith(".gdi")) {
      item.imageFormat = ImageFormat.Gdi;
      item.discType = DiscType.GDRom;
      gdiFile = await fs.getFile(f.handle);
    } else if (lowerName.endsWith(".cdi")) {
      item.imageFormat = ImageFormat.Cdi;
    } else if (lowerName.endsWith(".mds")) {
      item.imageFormat = ImageFormat.Mds;
    } else if (lowerName.endsWith(".ccd")) {
      item.imageFormat = ImageFormat.Ccd;
    } else if (lowerName.endsWith(".nrg")) {
      item.imageFormat = ImageFormat.Nrg;
    } else if (lowerName.endsWith(".iso")) {
      item.imageFormat = ImageFormat.Iso;
    }

    if (!biggestFile || size > biggestFile.size) {
      biggestFile = { file: await fs.getFile(f.handle), size };
    }
  }

  item.totalSize = totalSize;

  // Parse GDI to get track info and IP.BIN
  if (gdiFile && item.imageFormat === ImageFormat.Gdi) {
    const gdiContent = await gdiFile.text();
    item.gdiTracks = parseGdiFile(gdiContent);

    const dataTrack = getDataTrack(item.gdiTracks);
    if (dataTrack) {
      const trackFileEntry = files.find(
        (f) => f.name.toLowerCase() === dataTrack.filename.toLowerCase(),
      );
      if (trackFileEntry) {
        dataTrackFile = await fs.getFile(trackFileEntry.handle);
      }
    }
  }

  // Try to extract IP.BIN
  if (dataTrackFile) {
    item.ip = await findIpBinInFile(dataTrackFile);
  } else if (biggestFile && item.imageFormat !== ImageFormat.Gdi) {
    // For CDI/MDS/CCD, search for SEGA header in the biggest file
    item.ip = await searchForSegaHeader(biggestFile.file);
  }

  // Detect disc type from IP.BIN if not already known
  if (item.ip && item.discType === DiscType.Unknown) {
    item.discType = item.ip.deviceInfo.includes("GD-ROM") ? DiscType.GDRom : DiscType.CDRom;
  }

  // Detect special types
  if (item.ip) {
    const serial = item.ip.productNumber.trim();
    item.isCodeBreaker = serial === CODEBREAKER_SERIAL;
    item.isBleem = item.ip.gameName.toUpperCase().includes(BLEEM_IDENTIFIER);
    if (KNOWN_MENU_SERIALS.includes(serial) && folderNumber === 1) {
      item.isMenu = true;
    }
  }

  return item;
}

export function generateGdemuIni(items: GdItem[]): string {
  const lines: string[] = [];
  for (const item of items) {
    const folder = String(item.folderNumber).padStart(2, "0");
    lines.push(`${folder}.${item.gdiTracks.length > 0 ? "gdi" : "cdi"}`);
  }
  return lines.join("\n");
}

export interface WriteProgress {
  current: number;
  total: number;
  currentItem: string;
  phase: "renaming" | "writing-names" | "done";
  canRename?: boolean;
}

export async function writeChangesToSdCard(
  rootHandle: FileSystemDirectoryHandle,
  items: GdItem[],
  fs: FileSystemProvider,
  onProgress?: (progress: WriteProgress) => void,
): Promise<{ skippedRenames: boolean }> {
  const total = items.length;

  // Build rename map: current folder name -> desired folder name
  const renameOps: { item: GdItem; targetName: string }[] = [];
  for (const item of items) {
    const targetName = String(item.folderNumber).padStart(2, "0");
    const currentName = item.directoryHandle?.name;
    if (currentName && currentName !== targetName) {
      renameOps.push({ item, targetName });
    }
  }

  let skippedRenames = false;

  // Phase 1: Rename folders (only if there are renames and move() is supported)
  if (renameOps.length > 0) {
    // Test if native move() works on this filesystem before attempting renames
    const canMove = await fs.canRenameDirectories(rootHandle);

    if (canMove) {
      const existingDirs = await fs.listDirectories(rootHandle);
      const existingNames = new Set(existingDirs.map((d) => d.name));
      const tempPrefix = "__gdtmp_";
      const totalSteps = renameOps.length * 2;

      // Phase 1a: Rename to temp names to avoid collisions
      for (let i = 0; i < renameOps.length; i++) {
        const { item } = renameOps[i];
        const currentName = item.directoryHandle!.name;
        const tempName = `${tempPrefix}${currentName}`;
        onProgress?.({
          current: i + 1,
          total: totalSteps,
          currentItem: `${currentName} → ${tempName}`,
          phase: "renaming",
        });
        if (existingNames.has(currentName)) {
          await fs.renameDirectory(rootHandle, currentName, tempName);
        }
      }

      // Phase 1b: Rename from temp to final names
      for (let i = 0; i < renameOps.length; i++) {
        const { targetName } = renameOps[i];
        const currentName = renameOps[i].item.directoryHandle!.name;
        const tempName = `${tempPrefix}${currentName}`;
        onProgress?.({
          current: renameOps.length + i + 1,
          total: totalSteps,
          currentItem: `${tempName} → ${targetName}`,
          phase: "renaming",
        });
        await fs.renameDirectory(rootHandle, tempName, targetName);
      }
    } else {
      // move() not supported — skip folder renaming entirely
      // name.txt files will still be written to existing folders
      skippedRenames = true;
    }
  }

  // Phase 2: Write name.txt for items that have custom names
  // Use the ACTUAL folder name on disk (original if renames were skipped)
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const folderName = skippedRenames
      ? item.directoryHandle?.name || String(item.folderNumber).padStart(2, "0")
      : String(item.folderNumber).padStart(2, "0");

    onProgress?.({
      current: i + 1,
      total,
      currentItem: folderName,
      phase: "writing-names",
    });

    try {
      const dirHandle = await rootHandle.getDirectoryHandle(folderName);
      if (item.nameFromFile) {
        await fs.writeTextFile(dirHandle, NAME_TXT, item.nameFromFile);
      }
    } catch (e) {
      console.warn(`Failed to write name.txt for folder ${folderName}:`, e);
    }
  }

  onProgress?.({ current: total, total, currentItem: "", phase: "done" });
  return { skippedRenames };
}
