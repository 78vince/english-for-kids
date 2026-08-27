// 成效追蹤——Phase 1 的基本版本。
// 只做「每個使用者、每個主題、每種題型玩過幾次、最佳正確率、最近一次結果」存進 localStorage，
// 讓使用者重新整理頁面或關掉瀏覽器再回來，進度不會不見。
// 積分、連續天數、徽章、學習報告這些是 HANDOFF.md 規劃裡 Phase 2 的範圍，這裡故意不做，
// 避免超出 Phase 1（本地端 MVP）該有的範圍。
//
// 因為專案技術選型就是「純前端 + localStorage」（不用後端資料庫），這裡直接把資料存在
// 使用者瀏覽器本機，符合家庭/個人本機使用的場景。
//
// 加入「登入登出」（見 profile.ts）之後，每個使用者的紀錄要分開存，不能共用同一把 key，
// 不然不同小孩的成效會混在一起——所以這裡所有函式都要求呼叫端先傳入 profileId，
// 實際存到 localStorage 時會把 profileId 一起編進 key 裡（見 storagePrefix）。

const STORAGE_KEY_PREFIX = "englishForKids.progress.v1";

export type StageKey = "flashcards" | "matching" | "ordering" | "fillBlank" | "choice" | "capstone";

export interface StageProgress {
  timesCompleted: number;
  bestAccuracy: number; // 0-100
  lastCorrectCount: number;
  lastWrongCount: number;
  lastPlayedAt: string; // ISO 字串
}

type ProgressStore = Record<string, StageProgress>;

function storageKeyForProfile(profileId: string): string {
  return `${STORAGE_KEY_PREFIX}.${profileId}`;
}

function entryKey(topic: string, stage: StageKey): string {
  return `${topic}:${stage}`;
}

function readStore(profileId: string): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ProgressStore) : {};
  } catch {
    // localStorage 被瀏覽器擋掉（例如無痕模式的某些狀況）或資料壞掉，
    // 都當作沒有進度紀錄就好，不要讓整個 App 掛掉。
    return {};
  }
}

function writeStore(profileId: string, store: ProgressStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId), JSON.stringify(store));
  } catch {
    // 例如容量滿了、無痕模式擋寫入，安靜忽略——不影響遊戲本身還是可以玩，
    // 只是這一次的成績不會被記住。
  }
}

export function getStageProgress(
  profileId: string,
  topic: string,
  stage: StageKey
): StageProgress | null {
  const store = readStore(profileId);
  return store[entryKey(topic, stage)] ?? null;
}

export function recordStageCompletion(
  profileId: string,
  topic: string,
  stage: StageKey,
  correctCount: number,
  wrongCount: number
): void {
  const store = readStore(profileId);
  const key = entryKey(topic, stage);
  const total = correctCount + wrongCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const existing = store[key];

  store[key] = {
    timesCompleted: (existing?.timesCompleted ?? 0) + 1,
    bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, accuracy),
    lastCorrectCount: correctCount,
    lastWrongCount: wrongCount,
    lastPlayedAt: new Date().toISOString(),
  };

  writeStore(profileId, store);
}

export function clearAllProgress(profileId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKeyForProfile(profileId));
  } catch {
    // 忽略
  }
}
