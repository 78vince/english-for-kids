// 驗證題型選單卡片的「熟悉度分級」（尚未挑戰／練習中／表現不錯／完美）：
// - progressTier() 的門檻判斷（0/79/80/99/100/null 邊界情況）
// - 實際用真正的 progress.ts 操作一輪 recordStageCompletion()，確認 bestAccuracy
//   換算出來的分級跟預期一致，不是只憑程式碼邏輯推論
// - main.ts／style.css／design-tokens.v2-daily-play.css 三個檔案裡，這次新增的
//   class 名稱／CSS 規則／token 是否真的都寫進檔案裡（main.ts 因為用了 import.meta.glob
//   沒辦法直接 import 執行，這裡在 TypeScript 邏輯驗證之外，額外做原始碼字串比對，
//   確保「邏輯測試通過」跟「畫面真的有接上這套邏輯」是兩件都驗證到的事）
// 用法：npx tsx scripts/verify-menu-progress-tier.ts

import { readFileSync } from "node:fs";

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

const { recordStageCompletion, getStageProgress } = await import("../src/progress");
import type { StageProgress } from "../src/progress";

/** 跟 main.ts 的 progressTier() 邏輯一致（main.ts 因為 import.meta.glob 沒辦法直接 import，
 * 這裡重建一份最小版本，做法沿用其他 verify-*.ts，例如 verify-unit-completion-badges.ts）。 */
type ProgressTier = "not-started" | "practicing" | "good" | "mastered";
function progressTier(progress: StageProgress | null): ProgressTier {
  if (!progress) return "not-started";
  if (progress.bestAccuracy >= 100) return "mastered";
  if (progress.bestAccuracy >= 80) return "good";
  return "practicing";
}

function fakeProgress(bestAccuracy: number): StageProgress {
  return {
    timesCompleted: 1,
    bestAccuracy,
    lastCorrectCount: 0,
    lastWrongCount: 0,
    lastPlayedAt: new Date().toISOString(),
  };
}

// ---- 測試 1：null（還沒挑戰過）一律是 not-started ----
{
  assert(progressTier(null) === "not-started", "null 應該判斷為 not-started");
  console.log("✅ 測試 1 通過：還沒有任何成效紀錄時，分級是 not-started。");
}

// ---- 測試 2：邊界值——0/50/79 都是 practicing，80/90/99 都是 good，100 才是 mastered ----
{
  for (const acc of [0, 1, 50, 79]) {
    assert(progressTier(fakeProgress(acc)) === "practicing", `正確率 ${acc}% 應該判斷為 practicing`);
  }
  for (const acc of [80, 85, 90, 99]) {
    assert(progressTier(fakeProgress(acc)) === "good", `正確率 ${acc}% 應該判斷為 good`);
  }
  assert(progressTier(fakeProgress(100)) === "mastered", "正確率 100% 應該判斷為 mastered");
  console.log("✅ 測試 2 通過：0-79% practicing／80-99% good／100% mastered 三個門檻邊界都正確。");
}

// ---- 測試 3：實際用真正的 progress.ts 操作一輪，確認 bestAccuracy 換算出來的分級符合預期
//      （不是只驗證 fakeProgress 這種手造資料，是真的呼叫 recordStageCompletion()）。 ----
{
  const profileId = "test-profile-tier";

  // 還沒挑戰過 Stage A：not-started
  assert(
    progressTier(getStageProgress(profileId, "family", "matching")) === "not-started",
    "還沒玩過 Stage A 時，family 主題應該是 not-started"
  );

  // 答對 2 題、答錯 2 題 → 50% → practicing
  recordStageCompletion(profileId, "family", "matching", 2, 2);
  assert(
    progressTier(getStageProgress(profileId, "family", "matching")) === "practicing",
    "答對 2/4（50%）應該判斷為 practicing"
  );

  // 再玩一次，答對 4、答錯 1 → 80% → bestAccuracy 應該從 50% 更新成 80%，分級變成 good
  recordStageCompletion(profileId, "family", "matching", 4, 1);
  const afterGood = getStageProgress(profileId, "family", "matching");
  assert(afterGood?.bestAccuracy === 80, `bestAccuracy 應該更新成 80，實際 ${afterGood?.bestAccuracy}`);
  assert(progressTier(afterGood) === "good", "更新成最佳正確率 80% 後應該判斷為 good");

  // 再玩一次全對 → 100% → 分級變成 mastered
  recordStageCompletion(profileId, "family", "matching", 5, 0);
  const afterMastered = getStageProgress(profileId, "family", "matching");
  assert(afterMastered?.bestAccuracy === 100, `bestAccuracy 應該是 100，實際 ${afterMastered?.bestAccuracy}`);
  assert(progressTier(afterMastered) === "mastered", "最佳正確率達到 100% 後應該判斷為 mastered");

  // 不同主題／不同題型的紀錄互相獨立，不會被同一個使用者其他關卡的分級影響
  assert(
    progressTier(getStageProgress(profileId, "family", "ordering")) === "not-started",
    "同一使用者的其他題型（ordering）不該被 matching 的紀錄影響"
  );

  console.log(
    "✅ 測試 3 通過：實際操作 recordStageCompletion() 一輪 practicing → good → mastered，分級判斷跟真正的成效資料一致。"
  );
}

// ---- 測試 4：main.ts 真的有把這套分級接到 renderMenu() 的 .menu-item 按鈕上
//      （原始碼字串比對，確認邏輯測試通過的同時，畫面真的有接上）。 ----
{
  const mainTsPath = new URL("../src/main.ts", import.meta.url);
  const mainTs = readFileSync(mainTsPath, "utf-8");

  assert(mainTs.includes("function progressTier("), "main.ts 應該要有 progressTier() 函式");
  assert(
    mainTs.includes('btn.className = "menu-item" + (tier ? `') ||
      mainTs.includes("menu-item--${tier}"),
    "renderMenu() 組 .menu-item 按鈕時應該要把 tier 併進 class name（menu-item--<tier>）"
  );
  assert(mainTs.includes('"⭐ "'), "mastered 分級的進度文字前面應該要加 ⭐ 前綴");

  // 「單字總覽」項目（沒有 stageKey）不該套用分級：確認 items 陣列裡它沒有 stageKey 欄位，
  // 且 renderMenu() 的迴圈本身是靠 item.stageKey 是否存在來決定要不要算 tier（見上面的
  // "tier ?" 判斷式），不是額外寫死排除 "單字總覽" 這個字串（字串比對太脆弱，之後改標籤
  // 文字就會誤判），這裡改成檢查 renderMenu() 是用 `item.stageKey ? progressTier(...)` 這種
  // 「靠型別欄位」而不是「靠標籤文字」的判斷方式。
  assert(
    mainTs.includes("const tier = item.stageKey ? progressTier(progress) : null;"),
    "renderMenu() 應該用 item.stageKey 是否存在來決定要不要套用分級（不是用標籤文字判斷）"
  );

  console.log("✅ 測試 4 通過：main.ts 的 renderMenu() 真的有把 progressTier() 接到 .menu-item 按鈕的 class name 上。");
}

// ---- 測試 5：style.css 真的有這 4 個分級 modifier class，且色條／底色跟需求對照表一致 ----
{
  const styleCssPath = new URL("../src/style.css", import.meta.url);
  const styleCss = readFileSync(styleCssPath, "utf-8");

  assert(styleCss.includes(".menu-item--not-started"), "style.css 應該要有 .menu-item--not-started");
  assert(styleCss.includes(".menu-item--practicing"), "style.css 應該要有 .menu-item--practicing");
  assert(styleCss.includes(".menu-item--good"), "style.css 應該要有 .menu-item--good");
  assert(styleCss.includes(".menu-item--mastered"), "style.css 應該要有 .menu-item--mastered");

  // 色條顏色對照表：practicing 用 primary-500、good 用 success、mastered 用 accent-yellow
  assert(
    /\.menu-item--practicing\s*\{[^}]*border-left:\s*5px solid var\(--color-primary-500\)/.test(styleCss),
    "menu-item--practicing 的色條應該是 --color-primary-500"
  );
  assert(
    /\.menu-item--good\s*\{[^}]*border-left:\s*5px solid var\(--color-success\)/.test(styleCss),
    "menu-item--good 的色條應該是 --color-success"
  );
  assert(
    /\.menu-item--mastered\s*\{[^}]*border-left:\s*5px solid var\(--color-accent-yellow\)/.test(styleCss),
    "menu-item--mastered 的色條應該是 --color-accent-yellow"
  );

  // 刻意不用橘色／紅色代表任何一級
  const tierBlockMatch = styleCss.match(/\.menu-item--not-started[\s\S]*?\.menu-item--mastered[^}]*\}[^}]*\}/);
  assert(tierBlockMatch !== null, "應該找得到完整的分級 CSS 區塊");
  assert(
    !tierBlockMatch![0].includes("--color-accent-orange") && !tierBlockMatch![0].includes("--color-error"),
    "分級樣式不該用到 --color-accent-orange 或 --color-error（橘色/紅色留給 CTA 跟答錯回饋，不是熟悉度分級）"
  );

  // .menu-item-progress 不該再寫死橘色
  const progressRuleMatch = styleCss.match(/\.menu-item-progress\s*\{[^}]*\}/);
  assert(progressRuleMatch !== null, "應該找得到 .menu-item-progress 規則");
  assert(
    !progressRuleMatch![0].includes("--color-accent-orange"),
    ".menu-item-progress 不該再寫死 var(--color-accent-orange)，顏色要交給分級 modifier class 決定"
  );

  console.log("✅ 測試 5 通過：style.css 的 4 個分級 modifier class 都存在，色條顏色對照表正確，且沒有誤用橘色/紅色。");
}

// ---- 測試 6：design-tokens.v2-daily-play.css（main.ts 實際 @import 的那份，不是沒被引用的
//      design-tokens.css）真的有新增 3 個淡色 tint token。 ----
{
  const tokensPath = new URL("../../assets/design-tokens/design-tokens.v2-daily-play.css", import.meta.url);
  const tokens = readFileSync(tokensPath, "utf-8");

  assert(tokens.includes("--color-primary-tint:"), "design-tokens.v2-daily-play.css 應該要有 --color-primary-tint");
  assert(tokens.includes("--color-success-tint:"), "design-tokens.v2-daily-play.css 應該要有 --color-success-tint");
  assert(
    tokens.includes("--color-accent-yellow-tint:"),
    "design-tokens.v2-daily-play.css 應該要有 --color-accent-yellow-tint"
  );

  console.log(
    "✅ 測試 6 通過：3 個淡色 tint token 都已經加進 main.ts 實際引用的 design-tokens.v2-daily-play.css。"
  );
}

console.log("\n✅ 全部題型選單卡片熟悉度分級驗證通過（含邊界值、實際操作 progress.ts、原始碼接線確認）。");
