export enum DiscType {
  GDRom = "GD-ROM",
  CDRom = "CD-ROM",
  Unknown = "Unknown",
}

export enum ImageFormat {
  Gdi = "GDI",
  Cdi = "CDI",
  Mds = "MDS",
  Ccd = "CCD",
  Nrg = "NRG",
  Iso = "ISO",
  Raw = "RAW",
  Unknown = "Unknown",
}

export enum Region {
  Japan = "J",
  USA = "U",
  Europe = "E",
  All = "JUE",
}

export const REGION_LABELS: Record<string, string> = {
  J: "Japan",
  U: "USA",
  E: "Europe",
  JUE: "World",
  JU: "Japan/USA",
  JE: "Japan/Europe",
  UE: "USA/Europe",
};

export const SEGA_HEADER = "SEGA SEGAKATANA";
export const IP_BIN_SIZE = 512;
export const GDEMU_FOLDER_PATTERN = /^(\d{2})$/;
export const MENU_FOLDER = "01";
