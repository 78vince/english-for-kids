// 驗證 playLog.ts 的「連續遊玩天數」邏輯：記錄今天玩過、算連續天數、跳過一天會不會正確斷掉、
// 寬限一天的規則對不對、不同使用者的紀錄互相獨立。
// 用法：npx tsx scripts/verify-playlog-logic.ts
//
// 這支 script 需要模擬「不同的今天」才能測連續天數，所以暫時把全域 Date 換成假的，
// 讓 playLog.ts 內部呼叫 new Date() 時，拿到我們指定的日期——測完之後換回真的 Date，
// 不影響其他程式碼。

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

const RealDate = Date;

/** 讓 fn() 執行期間，new Date() 都回傳 fakeNow（模擬「今天是某一天」）。 */
function withFakeNow<T>(fakeNow: Date, fn: () => T): T {
  class FakeDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      if (args.length === 0) {
        super(fakeNow.getTime());
      } else {
        // @ts-expect-error - 這裡故意用 spread 呼叫原生 Date 建構子，型別上比較難標準化，
        // 但實際測試只會用到「無參數」跟這個分支，能跑起來就好。
        super(...args);
      }
    }
    static now() {
      return fakeNow.getTime();
    }
  }
  (globalThis as any).Date = FakeDate;
  try {
    return fn();
  } finally {
    (globalThis as any).Date = RealDate;
  }
}

const { recordPlayToday, getPlayStreak } = await import("../src/playLog");

const ALICE = "profile-alice";
const BOB = "profile-bob";

// 找一個任意的錨點日期（用固定日期，不用「今天」，測試結果才不會因為執行的當天而變動）。
const DAY0 = new Date(2026, 0, 10); // 2026-01-10
const DAY1 = new Date(2026, 0, 11);
const DAY2 = new Date(2026, 0, 12);
const DAY3 = new Date(2026, 0, 13);

// ---- 測試 1：一開始沒玩過，連續天數是 0 ----
{
  const streak = withFakeNow(DAY0, () => getPlayStreak(ALICE));
  assert(streak === 0, `還沒玩過，連續天數應該是 0，實際 ${streak}`);
  console.log("✅ 測試 1 通過：還沒玩過的使用者，連續天數是 0。");
}

// ---- 測試 2：第一天玩過，連續天數是 1 ----
{
  withFakeNow(DAY0, () => recordPlayToday(ALICE));
  const streak = withFakeNow(DAY0, () => getPlayStreak(ALICE));
  assert(streak === 1, `玩了第一天，連續天數應該是 1，實際 ${streak}`);
  console.log("✅ 測試 2 通過：玩了第一天，連續天數是 1。");
}

// ---- 測試 3：連續第二天也玩，連續天數變成 2 ----
{
  withFakeNow(DAY1, () => recordPlayToday(ALICE));
  const streak = withFakeNow(DAY1, () => getPlayStreak(ALICE));
  assert(streak === 2, `連續玩兩天，連續天數應該是 2，實際 ${streak}`);
  console.log("✅ 測試 3 通過：連續玩兩天，連續天數是 2。");
}

// ---- 測試 4：第三天沒玩，但問「第三天」的連續天數時，因為昨天（第二天）玩過，
//              算是寬限中，應該還是回傳從第二天往回算的 2 天 ----
{
  const streak = withFakeNow(DAY2, () => getPlayStreak(ALICE));
  assert(streak === 2, `今天沒玩但昨天玩過，應該還在寬限期，連續天數維持 2，實際 ${streak}`);
  console.log("✅ 測試 4 通過：今天沒玩但昨天玩過，寬限期內連續天數不會馬上斷掉。");
}

// ---- 測試 5：第四天，前兩天（第二、三天）都沒玩，寬限期已經過了，連續天數應該斷成 0 ----
{
  const streak = withFakeNow(DAY3, () => getPlayStreak(ALICE));
  assert(streak === 0, `連續兩天沒玩，連續天數應該斷掉變成 0，實際 ${streak}`);
  console.log("✅ 測試 5 通過：連續兩天沒玩，連續天數會斷掉歸零。");
}

// ---- 測試 6：斷掉之後重新玩，會從 1 重新開始算，不會接續之前斷掉的天數 ----
{
  withFakeNow(DAY3, () => recordPlayToday(ALICE));
  const streak = withFakeNow(DAY3, () => getPlayStreak(ALICE));
  assert(streak === 1, `斷掉之後重新玩一天，應該重新從 1 開始算，實際 ${streak}`);
  console.log("✅ 測試 6 通過：斷掉之後重新玩，連續天數會重新從 1 開始算。");
}

// ---- 測試 7：同一天呼叫 recordPlayToday 兩次，不會把連續天數往前多算 ----
{
  withFakeNow(DAY3, () => recordPlayToday(ALICE)); // 同一天再記一次
  const streak = withFakeNow(DAY3, () => getPlayStreak(ALICE));
  assert(streak === 1, `同一天重複記錄，連續天數應該還是 1，實際 ${streak}`);
  console.log("✅ 測試 7 通過：同一天重複呼叫 recordPlayToday 不會影響連續天數。");
}

// ---- 測試 8：不同使用者的紀錄互相獨立 ----
{
  const bobStreak = withFakeNow(DAY3, () => getPlayStreak(BOB));
  assert(bobStreak === 0, `Bob 還沒玩過，連續天數應該是 0，實際 ${bobStreak}`);

  withFakeNow(DAY3, () => recordPlayToday(BOB));
  const bobStreakAfter = withFakeNow(DAY3, () => getPlayStreak(BOB));
  const aliceStreakAfter = withFakeNow(DAY3, () => getPlayStreak(ALICE));
  assert(bobStreakAfter === 1, `Bob 玩了一天，連續天數應該是 1，實際 ${bobStreakAfter}`);
  assert(aliceStreakAfter === 1, "Bob 的紀錄不該影響 Alice 的連續天數");
  console.log("✅ 測試 8 通過：不同使用者的連續遊玩天數互相獨立。");
}

console.log("\n✅ 全部 playLog.ts 邏輯驗證通過。");
