export interface GameDbEntry {
  serial: string;
  name: string;
  region?: string;
  vga?: boolean;
}

let gameDb: Map<string, GameDbEntry> | null = null;

export async function loadGameDb(): Promise<Map<string, GameDbEntry>> {
  if (gameDb) return gameDb;

  try {
    const basePath = process.env.NODE_ENV === "production" ? "/gd-menu-card-manager" : "";
    const response = await fetch(`${basePath}/gamedb.json`);
    const data: GameDbEntry[] = await response.json();
    gameDb = new Map(data.map((entry) => [entry.serial.trim(), entry]));
  } catch {
    gameDb = new Map();
  }

  return gameDb;
}

export function lookupGame(serial: string): GameDbEntry | undefined {
  return gameDb?.get(serial.trim());
}
