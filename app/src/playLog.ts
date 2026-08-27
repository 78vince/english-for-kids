// 每日遊玩紀錄——只為了算「連續遊玩幾天」這個成就徽章用（見「🔥 每日習慣」分類），
// 跟 progress.ts 的成效追蹤是分開的兩份資料：progress.ts 只記得「每個題型最近一次
// 玩的時間」，沒有留下完整的日期歷史，沒辦法算出連續天數；這裡另外開一份輕量的
// 「哪幾天玩過」日期清單，存在 localStorage，一樣依使用者（profileId）分開存。

const PLAY_LOG_KEY_PREFIX = "englishForKids.playLog.v1";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function storageKeyForProfile(profileId: string): string {
  return `${PLAY_LOG_KEY_PREFIX}.${profileId}`;
}

/** YYYY-MM-DD（本機時區），拿掉時間只留日期，方便直接用字串比對「同一天」。 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readPlayedDates(profileId: string): Set<string> {
  if (!hasLocalStorage()) return new Set();
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
  } catch {
    // localStorage 被擋掉或資料壞掉，當作沒有任何紀錄，不要讓 App 掛掉。
    return new Set();
  }
}

function writePlayedDates(profileId: string, dates: Set<string>): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId), JSON.stringify([...dates]));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略——不影響當次使用，只是連續天數統計不準。
  }
}

/** 記錄「今天」這個使用者玩過（在任何題型答完一輪的時候呼叫），重複呼叫同一天沒有副作用。 */
export function recordPlayToday(profileId: string): void {
  const dates = readPlayedDates(profileId);
  const today = toDateString(new Date());
  if (dates.has(today)) return; // 同一天已經記過了，不用再寫一次
  dates.add(today);
  writePlayedDates(profileId, dates);
}

/** 累計「上線學習過幾天」——不要求連續，只是數一數這個使用者總共有幾個不同的日期玩過，
 * 給「累計學習天數」成就徽章（TD-01~04）用。 */
export function getTotalDaysPlayed(profileId: string): number {
  return readPlayedDates(profileId).size;
}

/**
 * 計算目前的連續遊玩天數：從「今天」往回數，只要中間沒有斷過就一直加；
 * 如果今天還沒玩，但昨天玩過，也算連續中（給使用者一天的寬限，畢竟現在可能是清晨還沒打開 App）；
 * 如果今天跟昨天都沒玩，代表連續紀錄已經斷掉，回傳 0。
 */
export function getPlayStreak(profileId: string): number {
  const dates = readPlayedDates(profileId);
  if (dates.size === 0) return 0;

  const cursor = new Date();
  if (!dates.has(toDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(toDateString(cursor))) return 0;
  }

  let streak = 0;
  while (dates.has(toDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
