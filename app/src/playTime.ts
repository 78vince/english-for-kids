// 累計遊玩時間——「我的」頁面要顯示的其中一項時間資訊。這不是精確的碼表計時，
// 而是概略估計：從進入某一種題型畫面（Stage A/B-1/B-2/C）開始算，一直到那一輪
// 答完（也就是 recordStageCompletion 觸發的當下）為止，把經過的時間累加起來；
// 如果玩到一半就切到別的畫面（沒有真的答完那一輪），這段時間不會被算進去——
// 這是刻意的簡化，不追蹤「離開」事件，避免把使用者晾在某個畫面很久也一起算進遊玩時間。
// 跟 playLog.ts（記錄「哪幾天玩過」）、progress.ts（記錄「答對幾次/正確率」）是三份
// 不同用途、互相獨立的資料，一樣依使用者（profileId）分開存在 localStorage。

const PLAY_TIME_KEY_PREFIX = "englishForKids.playTime.v1";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function storageKeyForProfile(profileId: string): string {
  return `${PLAY_TIME_KEY_PREFIX}.${profileId}`;
}

function readTotalMs(profileId: string): number {
  if (!hasLocalStorage()) return 0;
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId));
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    // localStorage 被擋掉或資料壞掉，當作目前累計時間是 0，不要讓 App 掛掉。
    return 0;
  }
}

function writeTotalMs(profileId: string, totalMs: number): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId), String(totalMs));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略——不影響當次遊玩，只是累計時間不準。
  }
}

/** 把這一次估算出來的遊玩時間（毫秒）加進累計總數；elapsedMs 如果是 0 或負的
 * （理論上不該發生，但保險起見）就直接忽略，不會讓累計時間倒退。 */
export function addPlayTime(profileId: string, elapsedMs: number): void {
  if (elapsedMs <= 0) return;
  const total = readTotalMs(profileId) + elapsedMs;
  writeTotalMs(profileId, total);
}

/** 取得目前累計的遊玩時間（毫秒），畫面上要顯示前通常會再用 formatPlayTime() 轉成中文字串。 */
export function getTotalPlayTimeMs(profileId: string): number {
  return readTotalMs(profileId);
}

/** 把毫秒數轉成好讀的中文字串，例如「3 小時 25 分」、「45 分鐘」、「還不到 1 分鐘」。 */
export function formatPlayTime(ms: number): string {
  if (ms < 60_000) return "還不到 1 分鐘";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} 分鐘`;
  if (minutes === 0) return `${hours} 小時`;
  return `${hours} 小時 ${minutes} 分`;
}

/**
 * 「學習成就」宮格專用：把跟 formatPlayTime() 完全一樣的邏輯拆成最多兩行（第一行小時、
 * 第二行分鐘），避免「1 小時 17 分」這種字串在窄螢幕的小卡片裡被瀏覽器隨機斷行，
 * 切成「1 小/時 17/分」這種難以閱讀的殘缺片段。呼叫端把回傳陣列的每一項各自包一個
 * <span> 區塊即可。不影響 formatPlayTime() 本身（其他地方／驗證腳本都還在用它）。
 */
export function formatPlayTimeLines(ms: number): string[] {
  if (ms < 60_000) return ["還不到 1 分鐘"];
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return [`${minutes} 分鐘`];
  if (minutes === 0) return [`${hours} 小時`];
  return [`${hours} 小時`, `${minutes} 分`];
}
