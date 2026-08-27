// 驗證 playTime.ts 的「累計遊玩時間」邏輯：時間會不會正確累加、格式化字串對不對、
// 不合法的輸入（0 或負數）會不會被擋掉、不同使用者的紀錄互相獨立。
// 用法：npx tsx scripts/verify-playtime-logic.ts

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

const { addPlayTime, getTotalPlayTimeMs, formatPlayTime } = await import("../src/playTime");

const ALICE = "profile-alice";
const BOB = "profile-bob";

// ---- 測試 1：還沒玩過，累計時間是 0，字串顯示「還不到 1 分鐘」 ----
{
  const total = getTotalPlayTimeMs(ALICE);
  assert(total === 0, `還沒玩過，累計時間應該是 0，實際 ${total}`);
  assert(formatPlayTime(total) === "還不到 1 分鐘", `0 毫秒應該顯示「還不到 1 分鐘」，實際「${formatPlayTime(total)}」`);
  console.log("✅ 測試 1 通過：還沒玩過，累計時間是 0。");
}

// ---- 測試 2：加一筆 30 秒，累計時間變成 30 秒，還是顯示「還不到 1 分鐘」 ----
{
  addPlayTime(ALICE, 30_000);
  const total = getTotalPlayTimeMs(ALICE);
  assert(total === 30_000, `累計時間應該是 30000 毫秒，實際 ${total}`);
  assert(formatPlayTime(total) === "還不到 1 分鐘", `30 秒應該顯示「還不到 1 分鐘」，實際「${formatPlayTime(total)}」`);
  console.log("✅ 測試 2 通過：累計 30 秒，還沒滿 1 分鐘。");
}

// ---- 測試 3：再加 45 秒（累計 75 秒 = 1 分 15 秒），應該顯示「1 分鐘」（無條件捨去到整分鐘） ----
{
  addPlayTime(ALICE, 45_000);
  const total = getTotalPlayTimeMs(ALICE);
  assert(total === 75_000, `累計時間應該是 75000 毫秒，實際 ${total}`);
  assert(formatPlayTime(total) === "1 分鐘", `75 秒應該顯示「1 分鐘」，實際「${formatPlayTime(total)}」`);
  console.log("✅ 測試 3 通過：累計時間會正確加總，並無條件捨去到整分鐘。");
}

// ---- 測試 4：累計時間跨過 1 小時整（3600000 毫秒），只顯示「N 小時」不顯示「0 分」 ----
{
  addPlayTime(ALICE, 3_600_000 - 75_000); // 補到剛好滿 1 小時
  const total = getTotalPlayTimeMs(ALICE);
  assert(total === 3_600_000, `累計時間應該剛好是 1 小時，實際 ${total}`);
  assert(formatPlayTime(total) === "1 小時", `剛好 1 小時應該顯示「1 小時」，實際「${formatPlayTime(total)}」`);
  console.log("✅ 測試 4 通過：剛好整數小時，不會多顯示「0 分」。");
}

// ---- 測試 5：累計時間同時有小時跟分鐘，兩個都要顯示 ----
{
  addPlayTime(ALICE, 25 * 60_000); // 再加 25 分鐘，總共 1 小時 25 分
  const total = getTotalPlayTimeMs(ALICE);
  assert(formatPlayTime(total) === "1 小時 25 分", `應該顯示「1 小時 25 分」，實際「${formatPlayTime(total)}」`);
  console.log("✅ 測試 5 通過：同時有小時跟分鐘時，兩個都會顯示。");
}

// ---- 測試 6：加 0 或負數時間，不會影響累計總數（防呆） ----
{
  const before = getTotalPlayTimeMs(ALICE);
  addPlayTime(ALICE, 0);
  addPlayTime(ALICE, -5000);
  const after = getTotalPlayTimeMs(ALICE);
  assert(before === after, `加 0 或負數時間不應該改變累計總數，加之前 ${before}，加之後 ${after}`);
  console.log("✅ 測試 6 通過：加 0 或負數時間會被忽略，不會讓累計時間出錯或倒退。");
}

// ---- 測試 7：不同使用者的累計時間互相獨立 ----
{
  const bobBefore = getTotalPlayTimeMs(BOB);
  assert(bobBefore === 0, `Bob 還沒玩過，累計時間應該是 0，實際 ${bobBefore}`);

  addPlayTime(BOB, 10 * 60_000); // Bob 玩了 10 分鐘
  const bobAfter = getTotalPlayTimeMs(BOB);
  const aliceAfter = getTotalPlayTimeMs(ALICE);
  assert(bobAfter === 10 * 60_000, `Bob 的累計時間應該是 10 分鐘，實際 ${bobAfter}`);
  assert(aliceAfter === 3_600_000 + 25 * 60_000, "Bob 的紀錄不該影響 Alice 的累計時間");
  console.log("✅ 測試 7 通過：不同使用者的累計遊玩時間互相獨立。");
}

console.log("\n✅ 全部 playTime.ts 邏輯驗證通過。");
