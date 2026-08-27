// 單字收藏——讓使用者點單字旁邊的星星把喜歡的單字收藏起來，跟 playLog.ts／playTime.ts／
// badgeStats.ts 是同一套模式：依使用者（profileId）分開存在 localStorage，純前端、
// 不用後端資料庫，localStorage 被瀏覽器擋掉或資料壞掉時安靜降級（當作沒有任何收藏），
// 不會讓整個 App 掛掉。
//
// 收藏清單不分主題，全部收藏的單字 id 攤平存在同一個陣列裡（跟使用者確認過的範圍：
// 「收藏清單不分主題」），畫面上要看是哪個主題的單字，呼叫端自己用 vocab.id 反查
// content.ts 的 getVocabByTopic() 結果即可，這裡只負責存「收藏了哪些 vocab id」。

const STORAGE_KEY_PREFIX = "englishForKids.favorites.v1";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function storageKeyForProfile(profileId: string): string {
  return `${STORAGE_KEY_PREFIX}.${profileId}`;
}

function readFavoriteIds(profileId: string): Set<string> {
  if (!hasLocalStorage()) return new Set();
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
  } catch {
    // localStorage 被擋掉或資料壞掉，當作沒有任何收藏，不要讓 App 掛掉。
    return new Set();
  }
}

function writeFavoriteIds(profileId: string, ids: Set<string>): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId), JSON.stringify([...ids]));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略——不影響當次使用，只是這次收藏不會被記住。
  }
}

/** 這個單字目前有沒有被收藏。 */
export function isFavorite(profileId: string, vocabId: string): boolean {
  return readFavoriteIds(profileId).has(vocabId);
}

/** 切換收藏狀態：已收藏就移除，還沒收藏就加入。呼叫端（星星按鈕的 click handler）
 * 不用自己先判斷目前是不是已收藏，直接呼叫這個函式就好。 */
export function toggleFavorite(profileId: string, vocabId: string): void {
  const ids = readFavoriteIds(profileId);
  if (ids.has(vocabId)) {
    ids.delete(vocabId);
  } else {
    ids.add(vocabId);
  }
  writeFavoriteIds(profileId, ids);
}

/** 取得目前收藏的全部 vocab id（不分主題，攤平成一個陣列）——「收藏清單」畫面用這個
 * 清單逐一反查每個 vocab id 對應的英文／中文／主題，畫出收藏清單。 */
export function getFavoriteVocabIds(profileId: string): string[] {
  return [...readFavoriteIds(profileId)];
}

/** 目前收藏的單字總數——給「個人檔案」頁的學習成就數據卡、成就徽章（FV-01~03、
 * OB-04 我的收藏）判斷達成狀態用。 */
export function getFavoriteCount(profileId: string): number {
  return readFavoriteIds(profileId).size;
}
