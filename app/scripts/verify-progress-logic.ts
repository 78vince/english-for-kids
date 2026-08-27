// 驗證 progress.ts 的成效追蹤邏輯：讀寫 localStorage、累加完成次數、記錄最佳正確率，
// 現在還要驗證「不同使用者（profileId）的紀錄要分開存，不能互相干擾」。
// 用法：npx tsx scripts/verify-progress-logic.ts
//
// 這支 script 在 Node 環境跑，沒有瀏覽器的 localStorage，所以先用一個最陽春的
// in-memory 假 localStorage 塞進 globalThis，讓 progress.ts 裡的 window.localStorage
// 呼叫可以正常運作——這樣才能在不開瀏覽器的情況下驗證邏輯本身對不對。

function makeFakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

(globalThis as any).window = {
  localStorage: makeFakeLocalStorage(),
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const { getStageProgress, recordStageCompletion, clearAllProgress } = await import(
  "../src/progress"
);

const ALICE = "profile-alice";
const BOB = "profile-bob";

// ---- 測試 1：一開始沒有任何紀錄 ----
{
  const p = getStageProgress(ALICE, "family", "matching");
  assert(p === null, "還沒玩過的題型，getStageProgress 應該回傳 null");
  console.log("✅ 測試 1 通過：初始狀態沒有任何進度紀錄。");
}

// ---- 測試 2：完成一次後，正確記錄次數與正確率 ----
{
  recordStageCompletion(ALICE, "family", "matching", 18, 3); // 18 對 3 錯，正確率 86%（四捨五入）
  const p = getStageProgress(ALICE, "family", "matching");
  assert(p !== null, "完成一次後應該要有紀錄");
  assert(p!.timesCompleted === 1, `timesCompleted 應該是 1，實際 ${p!.timesCompleted}`);
  assert(p!.bestAccuracy === 86, `bestAccuracy 應該是 86，實際 ${p!.bestAccuracy}`);
  assert(p!.lastCorrectCount === 18, "lastCorrectCount 應該是 18");
  assert(p!.lastWrongCount === 3, "lastWrongCount 應該是 3");
  console.log("✅ 測試 2 通過：完成一次後正確記錄次數、正確率、最近一次結果。");
}

// ---- 測試 3：第二次表現比較差，timesCompleted 累加，但 bestAccuracy 維持之前的最佳值 ----
{
  recordStageCompletion(ALICE, "family", "matching", 10, 11); // 正確率只有 48%，比上次差
  const p = getStageProgress(ALICE, "family", "matching");
  assert(p!.timesCompleted === 2, `timesCompleted 應該累加到 2，實際 ${p!.timesCompleted}`);
  assert(p!.bestAccuracy === 86, `表現變差不該影響 bestAccuracy，應該還是 86，實際 ${p!.bestAccuracy}`);
  assert(p!.lastCorrectCount === 10, "lastCorrectCount 應該更新成最近一次的 10");
  console.log("✅ 測試 3 通過：完成次數累加，最佳正確率只會變好不會變差。");
}

// ---- 測試 4：第三次表現更好，bestAccuracy 應該被刷新 ----
{
  recordStageCompletion(ALICE, "family", "matching", 21, 0); // 滿分
  const p = getStageProgress(ALICE, "family", "matching");
  assert(p!.timesCompleted === 3, "timesCompleted 應該是 3");
  assert(p!.bestAccuracy === 100, `表現更好應該刷新 bestAccuracy 成 100，實際 ${p!.bestAccuracy}`);
  console.log("✅ 測試 4 通過：表現更好時會刷新最佳正確率。");
}

// ---- 測試 5：不同題型／不同主題的紀錄要分開存，不能互相干擾 ----
{
  recordStageCompletion(ALICE, "family", "ordering", 4, 2);
  const matching = getStageProgress(ALICE, "family", "matching");
  const ordering = getStageProgress(ALICE, "family", "ordering");
  const otherTopicMatching = getStageProgress(ALICE, "colors", "matching");

  assert(matching!.timesCompleted === 3, "matching 的紀錄不該被 ordering 影響");
  assert(ordering!.timesCompleted === 1, "ordering 應該是獨立的一筆紀錄");
  assert(otherTopicMatching === null, "不同主題（colors）不該共用 family 的紀錄");
  console.log("✅ 測試 5 通過：不同主題／題型的進度紀錄互相獨立。");
}

// ---- 測試 6：不同使用者（profileId）的紀錄也要分開存 ----
{
  const bobMatching = getStageProgress(BOB, "family", "matching");
  assert(bobMatching === null, "Bob 還沒玩過，不該看到 Alice 的紀錄");

  recordStageCompletion(BOB, "family", "matching", 5, 16); // Bob 表現差很多
  const bobAfter = getStageProgress(BOB, "family", "matching");
  const aliceAfter = getStageProgress(ALICE, "family", "matching");
  assert(bobAfter!.timesCompleted === 1, "Bob 自己的紀錄應該是第 1 次");
  assert(bobAfter!.bestAccuracy < aliceAfter!.bestAccuracy, "Bob 跟 Alice 的最佳正確率不應該互相影響");
  assert(aliceAfter!.timesCompleted === 3, "Alice 的紀錄不該被 Bob 的操作影響");
  console.log("✅ 測試 6 通過：不同使用者（profileId）的進度紀錄互相獨立。");
}

// ---- 測試 7：clearAllProgress 只清除指定使用者的紀錄，不影響其他使用者 ----
{
  clearAllProgress(ALICE);
  assert(getStageProgress(ALICE, "family", "matching") === null, "清除後 Alice 的 matching 應該回到 null");
  assert(getStageProgress(ALICE, "family", "ordering") === null, "清除後 Alice 的 ordering 應該回到 null");
  assert(getStageProgress(BOB, "family", "matching") !== null, "清除 Alice 不該影響 Bob 的紀錄");
  console.log("✅ 測試 7 通過：clearAllProgress 只清除指定使用者、不影響其他使用者。");
}

console.log("\n✅ 全部 progress.ts 邏輯驗證通過（含多使用者隔離）。");
