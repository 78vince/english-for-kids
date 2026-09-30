// 驗證遊戲代幣（gameTokens.ts）的錢包邏輯，比照 verify-progress-logic.ts 的做法：
// 先塞一個最陽春的 in-memory 假 localStorage 進 globalThis.window，再用動態 import
// 載入 gameTokens.ts，讓裡面的 window.localStorage 呼叫可以正常運作。
// 另外用字串靜態比對的手法（比照 verify-unit-completion-badges.ts 對 main.ts 原始碼
// 做結構性檢查），確認 finalizeRoundCompletion() 真的有接上 earnTokens()。
// 用法：npx tsx scripts/verify-game-tokens-logic.ts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

const { getTokenBalance, earnTokens, spendTokens, TOKENS_EARNED_PER_ROUND } = await import(
  "../src/gameTokens"
);

// ---- 測試 1：初始餘額為 0 ----
{
  const balance = getTokenBalance("test-profile-fresh");
  assert(balance === 0, `全新的 profileId 初始餘額應該是 0，實際是 ${balance}`);
  console.log("✅ 測試 1 通過：初始餘額為 0。");
}

// ---- 測試 2：earnTokens() 正確累加，回傳值等於新餘額 ----
{
  const profileId = "test-profile-earn";
  const afterFirst = earnTokens(profileId, 5);
  assert(afterFirst === 5, `第一次賺 5 個代幣後應該是 5，實際是 ${afterFirst}`);
  const afterSecond = earnTokens(profileId, 20);
  assert(afterSecond === 25, `再賺 20 個代幣後應該是 25，實際是 ${afterSecond}`);
  assert(getTokenBalance(profileId) === 25, "earnTokens() 回傳值應該跟實際存檔的餘額一致");
  console.log("✅ 測試 2 通過：earnTokens() 正確累加，回傳值等於新餘額。");
}

// ---- 測試 3：spendTokens() 餘額足夠時扣款成功並回傳 true；餘額不夠時回傳 false 且
//      不能真的扣款（扣款失敗後餘額要維持不變，不能出現負數） ----
{
  const profileId = "test-profile-spend";
  earnTokens(profileId, 20);

  const successResult = spendTokens(profileId, 15);
  assert(successResult === true, "餘額 20 花 15，應該扣款成功回傳 true");
  assert(getTokenBalance(profileId) === 5, "扣款成功後餘額應該是 20 - 15 = 5");

  const failResult = spendTokens(profileId, 100);
  assert(failResult === false, "餘額 5 花 100，應該扣款失敗回傳 false");
  assert(getTokenBalance(profileId) === 5, "扣款失敗後餘額應該維持不變，不能被扣成負數或被意外修改");
  console.log("✅ 測試 3 通過：spendTokens() 餘額足夠時扣款成功，餘額不夠時扣款失敗且餘額不變、不會出現負數。");
}

// ---- 測試 4：不同 profileId 的餘額互相獨立 ----
{
  earnTokens("test-profile-a", 50);
  earnTokens("test-profile-b", 10);
  assert(getTokenBalance("test-profile-a") === 50, "profile-a 的餘額應該是 50，不受 profile-b 影響");
  assert(getTokenBalance("test-profile-b") === 10, "profile-b 的餘額應該是 10，不受 profile-a 影響");
  spendTokens("test-profile-a", 30);
  assert(getTokenBalance("test-profile-a") === 20, "profile-a 扣款後應該是 20");
  assert(getTokenBalance("test-profile-b") === 10, "profile-a 的扣款不該影響 profile-b 的餘額");
  console.log("✅ 測試 4 通過：不同 profileId 的餘額互相獨立，不會互相污染。");
}

// ---- 測試 5：TOKENS_EARNED_PER_ROUND 常數存在，且 finalizeRoundCompletion() 有接上
//      earnTokens(profileId, TOKENS_EARNED_PER_ROUND)（main.ts 原始碼靜態比對，
//      比照 verify-unit-completion-badges.ts 對 main.ts 做結構性檢查的手法） ----
{
  assert(
    typeof TOKENS_EARNED_PER_ROUND === "number" && TOKENS_EARNED_PER_ROUND > 0,
    "TOKENS_EARNED_PER_ROUND 應該是一個正整數常數"
  );

  const dir = path.dirname(fileURLToPath(import.meta.url));
  const mainTs = readFileSync(path.resolve(dir, "../src/main.ts"), "utf-8");

  assert(
    mainTs.includes('import { earnTokens, getTokenBalance, spendTokens, TOKENS_EARNED_PER_ROUND } from "./gameTokens";'),
    "main.ts 應該要從 gameTokens.ts import earnTokens／getTokenBalance／spendTokens／TOKENS_EARNED_PER_ROUND"
  );

  const fnStart = mainTs.indexOf("function finalizeRoundCompletion(");
  assert(fnStart !== -1, "main.ts 應該要有 finalizeRoundCompletion() 函式");
  const fnBody = mainTs.slice(fnStart, fnStart + 1200);
  assert(
    fnBody.includes("earnTokens(profileId, TOKENS_EARNED_PER_ROUND)"),
    "finalizeRoundCompletion() 應該要呼叫 earnTokens(profileId, TOKENS_EARNED_PER_ROUND)，讓每完成一輪任何題型都會賺代幣"
  );

  console.log("✅ 測試 5 通過：TOKENS_EARNED_PER_ROUND 常數存在，且 finalizeRoundCompletion() 正確接上 earnTokens()。");
}

console.log("\n✅ 全部遊戲代幣（gameTokens.ts）邏輯驗證通過。");
