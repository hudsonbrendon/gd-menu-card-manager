import type { IpBinInfo } from "@/lib/core/gd-item";
import { SEGA_HEADER } from "@/lib/core/enums";

const decoder = new TextDecoder("ascii");

function readString(view: DataView, offset: number, length: number): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  return decoder.decode(bytes).trim();
}

export function parseIpBin(buffer: ArrayBuffer): IpBinInfo | null {
  if (buffer.byteLength < 256) return null;

  const view = new DataView(buffer);
  const hardwareId = readString(view, 0, 16);

  if (!hardwareId.startsWith(SEGA_HEADER)) return null;

  const areaSymbols = readString(view, 0x30, 8);
  const peripherals = readString(view, 0x38, 8);

  const regions: string[] = [];
  if (areaSymbols.includes("J")) regions.push("J");
  if (areaSymbols.includes("U")) regions.push("U");
  if (areaSymbols.includes("E")) regions.push("E");

  // VGA support: bit 4 of peripherals (position 0)
  const vga = peripherals.length > 0 && (parseInt(peripherals[0], 16) & 0x1) !== 0;

  return {
    hardwareId,
    makerId: readString(view, 0x10, 16),
    deviceInfo: readString(view, 0x20, 16),
    areaSymbols,
    peripherals,
    productNumber: readString(view, 0x40, 10),
    version: readString(view, 0x4a, 6),
    releaseDate: readString(view, 0x50, 16),
    bootFilename: readString(view, 0x60, 16),
    publisher: readString(view, 0x70, 16),
    gameName: readString(view, 0x80, 128),
    vga,
    regions,
  };
}

export async function findIpBinInFile(file: File): Promise<IpBinInfo | null> {
  // Try reading from the start (GDI data track)
  const headerSlice = await file.slice(0, 512).arrayBuffer();
  const result = parseIpBin(headerSlice);
  if (result) return result;

  // Search for SEGA header in common offsets
  const offsets = [0, 0x10, 0x100, 0x8000, 0x15000, 0x2C000];
  for (const offset of offsets) {
    if (offset + 512 > file.size) continue;
    const slice = await file.slice(offset, offset + 512).arrayBuffer();
    const info = parseIpBin(slice);
    if (info) return info;
  }

  return null;
}

export async function searchForSegaHeader(file: File, chunkSize = 64 * 1024): Promise<IpBinInfo | null> {
  const headerBytes = new TextEncoder().encode(SEGA_HEADER);
  const maxSearch = Math.min(file.size, 10 * 1024 * 1024); // Search first 10MB

  for (let offset = 0; offset < maxSearch; offset += chunkSize - 16) {
    const end = Math.min(offset + chunkSize, file.size);
    const chunk = new Uint8Array(await file.slice(offset, end).arrayBuffer());

    for (let i = 0; i < chunk.length - headerBytes.length; i++) {
      let found = true;
      for (let j = 0; j < headerBytes.length; j++) {
        if (chunk[i + j] !== headerBytes[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        const ipOffset = offset + i;
        const ipSlice = await file.slice(ipOffset, ipOffset + 512).arrayBuffer();
        return parseIpBin(ipSlice);
      }
    }
  }

  return null;
}
