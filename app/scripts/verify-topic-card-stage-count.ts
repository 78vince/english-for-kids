// 驗證首頁主題卡片「X / N 種題型已挑戰過」用到的 ALL_STAGE_KEYS 常數（main.ts）
// 確實涵蓋全部題型，包含 Stage E 會話練習（"conversation"）——這是第二次發生「新增
// 題型時忘了同步更新這個清單」的狀況了（見 docs/handoff-prompt-topic-card-stage-count-missing-conversation.md），
// 這裡留一個防呆：往後題型清單如果又有變動（StageKey 型別新增/移除成員），這支腳本會
// 直接比對兩邊是否一致，不一致就直接失敗，不用等到使用者截圖回報才發現。
//
// main.ts 因為用了 import.meta.glob，沒辦法直接 import 執行，這裡比照其他 verify-*.ts
// （例如 verify-menu-progress-tier.ts）的既有做法，讀原始碼字串做比對。
// 用法：npx tsx scripts/verify-topic-card-stage-count.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const mainSrc = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");
const progressSrc = readFileSync(new URL("../src/progress.ts", import.meta.url), "utf-8");

// ---- 從 progress.ts 讀出 StageKey 型別實際包含哪些成員，當作「正確答案」 ----
const stageKeyTypeMatch = progressSrc.match(/export type StageKey = ([^;]+);/);
assert(stageKeyTypeMatch !== null, "progress.ts 找不到 StageKey 型別定義，比對基準跑掉了");
const expectedStageKeys = [...stageKeyTypeMatch![1].matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1]);
assert(expectedStageKeys.length >= 6, `StageKey 型別解析出來的成員數量看起來不對，實際：${JSON.stringify(expectedStageKeys)}`);
assert(expectedStageKeys.includes("conversation"), "StageKey 型別本身應該要包含 \"conversation\"（Stage E 會話練習）");
console.log(`✅ 測試 1 通過：progress.ts 的 StageKey 型別包含 ${expectedStageKeys.length} 種題型：${expectedStageKeys.join("、")}。`);

// ---- 從 main.ts 讀出 ALL_STAGE_KEYS 常數實際列了哪些成員 ----
const allStageKeysMatch = mainSrc.match(/const ALL_STAGE_KEYS: StageKey\[\] = \[([^\]]+)\];/);
assert(allStageKeysMatch !== null, "main.ts 找不到 ALL_STAGE_KEYS 常數定義，選主題畫面的題型統計可能被改名或移除了");
const actualStageKeys = [...allStageKeysMatch![1].matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1]);

assert(
  actualStageKeys.length === expectedStageKeys.length,
  `ALL_STAGE_KEYS 的題型數量應該跟 StageKey 型別一致（${expectedStageKeys.length} 種），實際 ${actualStageKeys.length} 種：${JSON.stringify(actualStageKeys)}——` +
    `這正是這次 bug 的成因：新增/移除題型時，StageKey 型別改了但 ALL_STAGE_KEYS 這個常數忘了同步更新。`
);
for (const key of expectedStageKeys) {
  assert(actualStageKeys.includes(key), `ALL_STAGE_KEYS 缺少 "${key}" 這個題型，首頁卡片的分子分母會少算`);
}
assert(actualStageKeys.includes("conversation"), "ALL_STAGE_KEYS 應該要包含 \"conversation\"（Stage E 會話練習）");
console.log(`✅ 測試 2 通過：main.ts 的 ALL_STAGE_KEYS 常數包含 ${actualStageKeys.length} 種題型，跟 StageKey 型別完全一致：${actualStageKeys.join("、")}。`);

// ---- 確認卡片渲染邏輯用的是 ALL_STAGE_KEYS.length（動態算），不是寫死的數字 ----
// 這樣往後 ALL_STAGE_KEYS 陣列本身如果又有調整，分母會自動跟著變，不用額外改渲染邏輯，
// 只要陣列本身正確（上面兩個測試已經確保），畫面就會正確。
assert(
  /\$\{challenged\} \/ \$\{ALL_STAGE_KEYS\.length\} 種題型已挑戰過/.test(mainSrc),
  "首頁卡片的「X / N 種題型已挑戰過」文案應該用 ALL_STAGE_KEYS.length 當分母（動態算），不應該寫死數字"
);
assert(
  /Math\.round\(\(challenged \/ ALL_STAGE_KEYS\.length\) \* 100\)/.test(mainSrc),
  "首頁卡片的進度條百分比也應該用 ALL_STAGE_KEYS.length 當分母（動態算），不應該寫死數字"
);
console.log("✅ 測試 3 通過：首頁卡片文案／進度條都是用 ALL_STAGE_KEYS.length 動態算分母，不是寫死的數字。");

console.log("\n✅ 全部「首頁主題卡片題型統計」驗證通過。");
