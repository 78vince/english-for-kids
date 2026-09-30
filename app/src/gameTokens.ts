// 遊戲代幣——遊戲室的消費貨幣，跟 points.ts 的「學習積分」是兩個完全獨立的數字：
// 學習積分是即時算出來、只會往上加的成就展示數字（沒有存檔、沒有餘額，見
// points.ts computeLearningPoints() 的說明）；遊戲代幣是這裡真正存檔的餘額，
// 可以賺、也可以花在遊戲室裡玩遊戲，兩者刻意不互通、不共用同一個數字，
// 避免「玩遊戲花掉代幣」讓學習成就的數字被牽連著變少（見 handoff 開頭的設計背景）。
//
// 跟 progress.ts／playTime.ts 同一套模式：per-profile、存在 localStorage，
// 容錯處理跟其他模組一致（讀取失敗回傳保守預設值、寫入失敗安靜忽略）。

const TOKENS_STORAGE_KEY_PREFIX = "englishForKids.gameTokens.v1";

function storageKeyForProfile(profileId: string): string {
  return `${TOKENS_STORAGE_KEY_PREFIX}.${profileId}`;
}

export function getTokenBalance(profileId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId));
    const n = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeBalance(profileId: string, balance: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId), String(Math.max(0, balance)));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略，跟其餘模組一致
  }
}

/** 每完成一輪任何題型（不限主題、不限題型、不要求正確率）都呼叫這個函式賺代幣，
 * 金額固定不看正確率——第一階段刻意用最簡單、最容易跟小朋友解釋清楚的規則
 * 「每破一關就有 5 個代幣」，不要一開始就做複雜的加權公式，之後真的覺得
 * 步調太快/太慢，再回來調整這個常數就好。
 * 刻意的設計決定：玩遊戲室的遊戲本身不會再賺代幣。代幣只從「認真學習」這個方向賺，
 * 遊戲室是花代幣去的「休息/獎勵」，不是另一個賺代幣的迴圈——避免變成「一直玩遊戲刷
 * 代幣，再拿去玩更多遊戲」的沒意義迴圈，讓代幣真的跟「有在學習」掛勾。 */
export const TOKENS_EARNED_PER_ROUND = 5;

export function earnTokens(profileId: string, amount: number): number {
  const newBalance = getTokenBalance(profileId) + amount;
  writeBalance(profileId, newBalance);
  return newBalance;
}

/** 回傳 true 代表扣款成功（餘額足夠）；false 代表餘額不夠，呼叫端不能真的讓使用者
 * 進遊戲，畫面上要用鼓勵文案處理，不能出現「餘額不足」這種字眼。 */
export function spendTokens(profileId: string, amount: number): boolean {
  const balance = getTokenBalance(profileId);
  if (balance < amount) return false;
  writeBalance(profileId, balance - amount);
  return true;
}
