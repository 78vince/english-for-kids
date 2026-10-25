// 遊戲頁的打包清單：依 content/games/games.json 的 status 決定哪些遊戲頁會被打包。
// - vite.config.ts（孩子用的 App，npm run build）：只打包 status = "active" 的頁面。
//   開發中（in_development）、即將推出（coming_soon）、下架（disabled）的頁面根本不會出現在 dist/，
//   孩子就算知道網址也打不開。
// - vite.lab.config.ts（遊戲實驗室，npm run lab／build:lab）：打包全部遊戲頁＋lab.html。
// 規範見 docs/GAME-PRODUCTION-SPEC.md §2。這支檔案只給建置設定與 verify 腳本用，不會進到瀏覽器。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type GameStatus = "in_development" | "coming_soon" | "active" | "disabled";

export interface GameEntry {
  id: string;
  name: string;
  kind: "studio" | "learning" | "character";
  page: string;
  status: GameStatus;
}

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
export const GAMES_JSON = path.resolve(APP_DIR, "../content/games/games.json");

export function readGames(): GameEntry[] {
  return JSON.parse(fs.readFileSync(GAMES_JSON, "utf-8")) as GameEntry[];
}

/** game id（snake_case）→ Rollup input key（camelCase），例：tree_climb → treeClimb */
export function inputKey(id: string): string {
  return id.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** 孩子用的 App 只打包已上架的遊戲頁；lab＝true 時打包全部（給遊戲實驗室測試）。 */
export function gamePageInputs(opts: { lab: boolean }): Record<string, string> {
  const input: Record<string, string> = {};
  for (const g of readGames()) {
    if (!g.page) continue;
    if (!opts.lab && g.status !== "active") continue;
    input[inputKey(g.id)] = g.page;
  }
  return input;
}
