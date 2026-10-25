// 公開版的儲存層轉接檔（2026-10-20，「我的角色」遊戲同步時新增）。
//
// 「我的角色」三款遊戲（角色工作室、賽跑、爬樹，app/src/game/、app/src/games/ 由
// scripts/sync-games-from-letsgo.sh 從 LetsGo 同步過來）原本 import LetsGo 的 storage.ts，
// 那份會把紀錄同步到家裡區網電腦（/api/sync）。公開版放在 GitHub Pages，沒有伺服器，
// 所以這裡提供「同名、同簽名」的版本，全部只讀寫這台設備的 localStorage：
// - 不送任何網路請求（沒有 /api）
// - 同步狀態固定是 "local"（工作室的存檔點會顯示「已存」）
// 這個檔案不在同步範圍內，LetsGo 改了 storage.ts 不會覆蓋這裡。

export type SyncStatus = "local" | "syncing" | "synced" | "offline" | "unreachable";

function ls(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** 跟 LetsGo 的 appStorage 同介面（同步讀寫）；localStorage 被擋或額滿時不讓遊戲掛掉 */
export const appStorage = {
  getItem(key: string): string | null {
    try {
      return ls()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      ls()?.setItem(key, value);
    } catch {
      // 額滿或被擋：忽略，遊戲照常進行
    }
  },
  removeItem(key: string): void {
    try {
      ls()?.removeItem(key);
    } catch {
      // 忽略
    }
  },
};

/** 沒有伺服器，沒有東西要送 */
export function flushPending(): Promise<void> {
  return Promise.resolve();
}

export function getSyncStatus(): SyncStatus {
  return "local";
}

/** 狀態永遠不會改變；回傳取消訂閱函式以維持介面一致 */
export function onSyncStatusChange(_fn: (s: SyncStatus) => void): () => void {
  return () => {};
}

/** 遊戲頁進入點：LetsGo 會先跟伺服器對帳再載入，公開版直接載入 */
export function bootThen(load: () => Promise<unknown>): void {
  void load();
}

/** 2026-10-25：LetsGo 的相簿（game/photoStore.ts）會問「有沒有區網電腦可以同步」；公開版沒有伺服器，一律 false */
export function serverSyncEnabled(): boolean {
  return false;
}
