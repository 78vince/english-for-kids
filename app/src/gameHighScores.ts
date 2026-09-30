// 遊戲室各遊戲共用的「最高紀錄」儲存——2026-09-30 填字遊戲（遊戲室第二款遊戲）新增時
// 順便做的小重構，見 docs/handoff-prompt-crossword-game.md 的背景說明：這是第二款遊戲了，
// 值得現在就抽成共用模組，避免以後每款遊戲各自寫一份高分紀錄邏輯。
//
// 跟 gameTokens.ts／progress.ts 同一套模式：per-profile、存在 localStorage，容錯處理跟
// 其他模組一致（讀取失敗回傳保守預設值、寫入失敗安靜忽略）。
//
// 存的是「最佳星等」（1-5，2026-09-30 使用者要求從 1-3 改成 1-5），不是原始分數——
// 不同遊戲的評分方式不一樣（翻牌配對如果之後也要加最高紀錄，可能是用翻牌次數；填字遊戲
// 用錯誤次數），統一成星等才有辦法共用同一個模組、同一套 UI 呈現方式（遊戲室清單卡片上
// 可以統一顯示「最佳成績：⭐⭐⭐⭐⭐」）。
// 用 gameId 當 key 的一部分，同一個 profile 底下每款遊戲各自有自己的最高紀錄。
//
// 2026-09-30 改成 5 顆星時的已知取捨：這裡只改了「星等上限」跟「換算門檻」
//（見 crosswordGame.ts 的 starsForMistakes()），沒有針對「已經存在 localStorage 裡、
// 舊制 1-3 顆星時代存下來的紀錄」做任何資料轉換——例如舊制下拿到的「3 顆星」（當時代表
// 滿分）改版後會直接被新制的 UI 讀成「5 顆星裡的 3 顆」，畫面上會顯示成沒有拿滿分。
// 這個 App 是單機／個人使用情境（沒有雲端排行榜或跨裝置同步），影響範圍只有使用者自己
// 這台裝置先前累積的最高紀錄視覺上「感覺變差」，不影響任何功能正確性或其他資料；沒有
// 特別寫資料轉換，因為星等只是鼓勵性質的呈現，值得的話之後要嘛使用者自己重玩一次刷新
// 紀錄，要嘛之後有需要再回頭補一次性的資料轉換腳本。

const HIGH_SCORE_STORAGE_KEY_PREFIX = "englishForKids.gameHighScores.v1";

function storageKeyForProfile(profileId: string, gameId: string): string {
  return `${HIGH_SCORE_STORAGE_KEY_PREFIX}.${profileId}.${gameId}`;
}

/** 讀取某個 profile 在某款遊戲的最佳星等，沒紀錄過（或讀取失敗）回傳 0。 */
export function getBestStars(profileId: string, gameId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId, gameId));
    const n = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 && n <= 5 ? n : 0;
  } catch {
    return 0;
  }
}

/** 紀錄這一次玩到的星等，只有比現有紀錄的星等更高時才會真的更新——不會因為這次表現
 * 變差就把之前的最佳紀錄洗掉，跟「最高紀錄」這個詞的直覺意義一致。 */
export function recordStars(profileId: string, gameId: string, stars: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(5, Math.round(stars)));
  const current = getBestStars(profileId, gameId);
  if (clamped <= current) return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId, gameId), String(clamped));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略，跟其餘模組一致
  }
}
