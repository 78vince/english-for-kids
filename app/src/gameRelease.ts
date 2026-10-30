// 遊戲上架閘門（docs/GAME-PRODUCTION-SPEC.md §2）。
// content/games/games.json 的 status 決定一款遊戲能不能被孩子看到、玩到：
//   in_development＝開發／測試中：只在遊戲實驗室（__LAB__）出現；孩子用的 App 看不到、頁面也不打包。
//   coming_soon＝遊戲室顯示卡片但不能玩；active＝正式上架；disabled＝下架。
// 雙重保護：建置時 gamePages.ts 不打包未上架的頁面；執行時遊戲室卡片與遊戲頁 boot 都再檢查一次。
import gamesData from "../../content/games/games.json";
import type { GameConfig, GameStatus } from "./types";

export function isLabMode(): boolean {
  return (
    (typeof __LAB__ !== "undefined" && Boolean(__LAB__)) ||
    (typeof window !== "undefined" &&
      (Boolean((window as any).__LAB__) ||
        window.location?.port === "5190" ||
        new URLSearchParams(window.location?.search || "").get("from") === "lab"))
  );
}

export const LAB_MODE: boolean = isLabMode();

const GAME_LIST = gamesData as GameConfig[];

export function gameConfig(id: string): GameConfig | null {
  return GAME_LIST.find((g) => g.id === id) ?? null;
}

export function gameStatus(id: string): GameStatus | null {
  return gameConfig(id)?.status ?? null;
}

/** 可以進入遊玩：正式版只有 active；實驗室裡除了沒登記的以外都可以玩。 */
export function isGamePlayable(id: string): boolean {
  const s = gameStatus(id);
  if (s === null) return false;
  return isLabMode() ? true : s === "active";
}

/** 遊戲室要不要出現這張卡片：正式版 active／coming_soon；實驗室全部顯示。 */
export function isGameListed(id: string): boolean {
  const s = gameStatus(id);
  if (s === null) return false;
  return isLabMode() ? true : s === "active" || s === "coming_soon";
}

export const GAME_STATUS_LABEL: Record<GameStatus, string> = {
  in_development: "開發中",
  coming_soon: "即將推出",
  active: "已上架",
  disabled: "已下架",
};

/** 實驗室裡未上架的遊戲在卡片上加「測試中・開發中」小標；正式版回傳空字串。 */
export function labStatusTagHtml(id: string): string {
  if (!LAB_MODE) return "";
  const s = gameStatus(id);
  if (!s || s === "active") return "";
  return `<span class="game-room-lab-tag">測試中・${GAME_STATUS_LABEL[s]}</span>`;
}

/**
 * 遊戲頁的 boot 第一行呼叫：這款遊戲還沒上架（正式版）就直接回主頁，不載入遊戲。
 * 回傳 true＝可以繼續載入。
 */
export function guardGamePage(id: string): boolean {
  if (isGamePlayable(id)) return true;
  try {
    window.location.replace("../index.html#gameRoom");
  } catch {
    // 忽略
  }
  return false;
}
