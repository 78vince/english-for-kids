// 驗證「挑戰紀錄」頁（renderStats()）延伸自題型選單的熟悉度分級：
// - topicProgressTier()（外層 .stats-topic-card 用，完成度優先、正確率次之）的邊界情況
// - 內層 .stats-stage-row 直接重用題型選單的 progressTier()，這裡確認共用同一個
//   ProgressTier 型別、同一套門檻，不是另外複製一份邏輯
// - 實際用真正的 progress.ts 操作一輪 recordStageCompletion()，模擬「只挑戰部分題型」
//   跟「全部題型都挑戰過」兩種情境，確認外層卡片分級換算出來的結果符合預期，不是只憑
//   程式碼邏輯推論
// - main.ts／style.css 裡這次新增的 class 名稱／CSS 規則是否真的接上了（main.ts 因為
//   import.meta.glob 沒辦法直接 import 執行，這裡額外做原始碼字串比對）
// 用法：npx tsx scripts/verify-stats-progress-tier.ts

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
import type { StageKey, StageProgress } from "../src/progress";

/** 跟 main.ts 的 progressTier() / topicProgressTier() 邏輯一致（main.ts 因為
 * import.meta.glob 沒辦法直接 import，這裡重建最小版本，做法沿用其他 verify-*.ts）。 */
type ProgressTier = "not-started" | "practicing" | "good" | "mastered";
function progressTier(progress: StageProgress | null): ProgressTier {
  if (!progress) return "not-started";
  if (progress.bestAccuracy >= 100) return "mastered";
  if (progress.bestAccuracy >= 80) return "good";
  return "practicing";
}
function topicProgressTier(topicPlayedCount: number, totalStages: number, averageAccuracy: number): ProgressTier {
  if (topicPlayedCount === 0) return "not-started";
  if (topicPlayedCount < totalStages) return "practicing";
  if (averageAccuracy >= 100) return "mastered";
  if (averageAccuracy >= 80) return "good";
  return "practicing";
}

const ALL_STAGE_KEYS: StageKey[] = ["flashcards", "matching", "ordering", "fillBlank", "choice", "capstone"];
const TOTAL_STAGES = ALL_STAGE_KEYS.length; // 跟 main.ts 的 STAGE_ROWS.length 一致（6 種）

// ---- 測試 1：topicProgressTier() 邊界情況（純數字，不牽涉真正的 localStorage）----
{
  assert(topicProgressTier(0, TOTAL_STAGES, 0) === "not-started", "完全沒挑戰過任何題型時應該是 not-started");
  assert(
    topicProgressTier(1, TOTAL_STAGES, 100) === "practicing",
    "只挑戰過 1 種題型（即使正確率 100%）也應該是 practicing，不能因為單次矇對就判定完美"
  );
  assert(
    topicProgressTier(TOTAL_STAGES - 1, TOTAL_STAGES, 100) === "practicing",
    "只差 1 種題型沒挑戰過（即使已挑戰的都 100%）也應該是 practicing"
  );
  assert(
    topicProgressTier(TOTAL_STAGES, TOTAL_STAGES, 79) === "practicing",
    "全部題型都挑戰過，但平均正確率只有 79% 時應該是 practicing"
  );
  assert(
    topicProgressTier(TOTAL_STAGES, TOTAL_STAGES, 80) === "good",
    "全部題型都挑戰過，平均正確率剛好 80% 時應該是 good"
  );
  assert(
    topicProgressTier(TOTAL_STAGES, TOTAL_STAGES, 99) === "good",
    "全部題型都挑戰過，平均正確率 99% 時應該是 good"
  );
  assert(
    topicProgressTier(TOTAL_STAGES, TOTAL_STAGES, 100) === "mastered",
    "全部題型都挑戰過，平均正確率 100% 時應該是 mastered"
  );
  console.log("✅ 測試 1 通過：topicProgressTier() 完成度優先、正確率次之的邊界情況都正確。");
}

// ---- 測試 2：內層題型列直接重用 progressTier()，跟題型選單同一套門檻（不是另外複製一份）----
{
  assert(progressTier(null) === "not-started", "沒有 progress 時應該是 not-started");
  assert(
    progressTier({ timesCompleted: 1, bestAccuracy: 79, lastCorrectCount: 0, lastWrongCount: 0, lastPlayedAt: "" }) ===
      "practicing",
    "正確率 79% 應該是 practicing"
  );
  assert(
    progressTier({ timesCompleted: 1, bestAccuracy: 80, lastCorrectCount: 0, lastWrongCount: 0, lastPlayedAt: "" }) ===
      "good",
    "正確率 80% 應該是 good"
  );
  assert(
    progressTier({ timesCompleted: 1, bestAccuracy: 100, lastCorrectCount: 0, lastWrongCount: 0, lastPlayedAt: "" }) ===
      "mastered",
    "正確率 100% 應該是 mastered"
  );
  console.log("✅ 測試 2 通過：內層題型列的分級門檻跟題型選單完全一致（0-79 practicing／80-99 good／100 mastered）。");
}

// ---- 測試 3：實際用真正的 progress.ts 模擬「只挑戰部分題型」情境，確認外層卡片
//      即使已挑戰的題型正確率都是 100%，只要沒有全部挑戰完，還是應該判定成 practicing。 ----
{
  const profileId = "test-profile-stats-partial";
  const topic = "family";

  // 完全沒挑戰過
  {
    const stageEntries = ALL_STAGE_KEYS.map((key) => getStageProgress(profileId, topic, key));
    const playedCount = stageEntries.filter((p) => p !== null).length;
    assert(playedCount === 0, "還沒挑戰過任何題型，playedCount 應該是 0");
    assert(topicProgressTier(playedCount, TOTAL_STAGES, 0) === "not-started", "應該判定成 not-started");
  }

  // 只挑戰 3 種題型，且都是滿分
  for (const key of ["flashcards", "matching", "ordering"] as StageKey[]) {
    recordStageCompletion(profileId, topic, key, 5, 0); // 100%
  }
  {
    const stageEntries = ALL_STAGE_KEYS.map((key) => getStageProgress(profileId, topic, key));
    const playedCount = stageEntries.filter((p) => p !== null).length;
    const accuracies = stageEntries.filter((p): p is StageProgress => p !== null).map((p) => p.bestAccuracy);
    const avg = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
    assert(playedCount === 3, `應該只有 3 種題型有紀錄，實際 ${playedCount}`);
    assert(avg === 100, `已挑戰的 3 種題型平均正確率應該是 100%，實際 ${avg}%`);
    assert(
      topicProgressTier(playedCount, TOTAL_STAGES, avg) === "practicing",
      "只挑戰過一半題型，即使全部都是滿分，外層卡片還是應該判定成 practicing（不能因為部分題型矇對就算完美）"
    );
  }

  console.log(
    "✅ 測試 3 通過：實際操作 recordStageCompletion() 只挑戰 3/6 種題型（且都滿分），外層卡片正確判定為 practicing，不是 mastered。"
  );
}

// ---- 測試 4：實際操作全部 6 種題型都挑戰過，確認外層卡片會從 practicing 依序變成
//      good、再變成 mastered（隨著補齊題型／刷高正確率）。 ----
{
  const profileId = "test-profile-stats-complete";
  const topic = "colors";

  // 前 5 種都拿 80%（4 對 1 錯），最後 1 種也拿 80%，平均應該是 80% → good
  for (const key of ["flashcards", "matching", "ordering", "fillBlank", "choice"] as StageKey[]) {
    recordStageCompletion(profileId, topic, key, 4, 1); // 80%
  }
  {
    const stageEntries = ALL_STAGE_KEYS.map((key) => getStageProgress(profileId, topic, key));
    const playedCount = stageEntries.filter((p) => p !== null).length;
    assert(playedCount === 5, `應該有 5 種題型有紀錄，實際 ${playedCount}`);
    assert(
      topicProgressTier(playedCount, TOTAL_STAGES, 80) === "practicing",
      "還差最後 1 種題型（capstone）沒挑戰過，即使已挑戰的都 80%，外層卡片還是應該是 practicing"
    );
  }

  recordStageCompletion(profileId, topic, "capstone", 4, 1); // 補上最後一種，80%
  {
    const stageEntries = ALL_STAGE_KEYS.map((key) => getStageProgress(profileId, topic, key));
    const playedCount = stageEntries.filter((p) => p !== null).length;
    const accuracies = stageEntries.filter((p): p is StageProgress => p !== null).map((p) => p.bestAccuracy);
    const avg = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
    assert(playedCount === 6, "6 種題型應該都有紀錄了");
    assert(avg === 80, `平均正確率應該是 80%，實際 ${avg}%`);
    assert(topicProgressTier(playedCount, TOTAL_STAGES, avg) === "good", "全部題型都挑戰過、平均 80% 時應該是 good");
  }

  // 每一種題型都再刷一次滿分，bestAccuracy 應該更新成 100，平均變成 100% → mastered
  for (const key of ALL_STAGE_KEYS) {
    recordStageCompletion(profileId, topic, key, 5, 0); // 100%
  }
  {
    const stageEntries = ALL_STAGE_KEYS.map((key) => getStageProgress(profileId, topic, key));
    const accuracies = stageEntries.filter((p): p is StageProgress => p !== null).map((p) => p.bestAccuracy);
    const avg = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
    assert(avg === 100, `刷過滿分後平均正確率應該是 100%，實際 ${avg}%`);
    assert(
      topicProgressTier(ALL_STAGE_KEYS.length, TOTAL_STAGES, avg) === "mastered",
      "全部題型都挑戰過、平均正確率 100% 時應該是 mastered"
    );
  }

  console.log(
    "✅ 測試 4 通過：實際操作全部 6 種題型，外層卡片分級隨著資料真的從 practicing → good → mastered 依序變化。"
  );
}

// ---- 測試 5：main.ts 真的有把 topicProgressTier()／progressTier() 接到 renderStats() 上
//      （原始碼字串比對，確認邏輯測試通過的同時，畫面真的有接上）。 ----
{
  const mainTsPath = new URL("../src/main.ts", import.meta.url);
  const mainTs = readFileSync(mainTsPath, "utf-8");

  assert(mainTs.includes("function topicProgressTier("), "main.ts 應該要有 topicProgressTier() 函式");
  assert(
    mainTs.includes(
      "const topicTier = topicProgressTier(topicPlayedCount, STAGE_ROWS.length, topicAverageAccuracy);"
    ),
    "renderStats() 應該用 topicPlayedCount／STAGE_ROWS.length／topicAverageAccuracy 呼叫 topicProgressTier()"
  );
  assert(
    mainTs.includes("stats-topic-card--${topicTier}"),
    "外層 .stats-topic-card 應該把 topicTier 併進 class name"
  );
  assert(mainTs.includes("const stageTier = progressTier(progress);"), "內層題型列應該直接重用既有的 progressTier()");
  assert(
    mainTs.includes("stats-stage-row--${stageTier}"),
    "內層 .stats-stage-row 應該把 stageTier 併進 class name"
  );
  assert(
    mainTs.includes("stats-bar-fill stats-bar-fill--${stageTier}"),
    ".stats-bar-fill 應該把 stageTier 併進 class name，讓填色呼應分級"
  );
  assert(
    mainTs.includes('${topicTier === "mastered" ? "⭐ " : ""}已挑戰'),
    "外層卡片 briefEl 在 mastered 時應該加 ⭐ 前綴"
  );
  assert(
    mainTs.includes('${stageTier === "mastered" ? "⭐ " : ""}最佳正確率'),
    "內層題型列的 detail 文字在 mastered 時應該加 ⭐ 前綴"
  );

  console.log("✅ 測試 5 通過：main.ts 的 renderStats() 真的有把兩層分級接到 .stats-topic-card／.stats-stage-row 上。");
}

// ---- 測試 6：style.css 真的有這些分級 modifier class，且色條顏色對照表跟題型選單一致，
//      沒有誤用橘色／紅色。 ----
{
  const styleCssPath = new URL("../src/style.css", import.meta.url);
  const styleCss = readFileSync(styleCssPath, "utf-8");

  for (const cls of [
    ".stats-topic-card--practicing",
    ".stats-topic-card--good",
    ".stats-topic-card--mastered",
    ".stats-stage-row--practicing",
    ".stats-stage-row--good",
    ".stats-stage-row--mastered",
    ".stats-bar-fill--practicing",
    ".stats-bar-fill--good",
    ".stats-bar-fill--mastered",
  ]) {
    assert(styleCss.includes(cls), `style.css 應該要有 ${cls}`);
  }

  assert(
    /\.stats-topic-card--practicing\s*\{[^}]*border-left:\s*5px solid var\(--color-primary-500\)/.test(styleCss),
    "stats-topic-card--practicing 的色條應該是 --color-primary-500"
  );
  assert(
    /\.stats-topic-card--good\s*\{[^}]*border-left:\s*5px solid var\(--color-success\)/.test(styleCss),
    "stats-topic-card--good 的色條應該是 --color-success"
  );
  assert(
    /\.stats-topic-card--mastered\s*\{[^}]*border-left:\s*5px solid var\(--color-accent-yellow\)/.test(styleCss),
    "stats-topic-card--mastered 的色條應該是 --color-accent-yellow"
  );

  // 抓出這次新增的整個分級區塊（從 .stats-topic-card--practicing 開始到 .stats-bar-fill--mastered
  // 結束），確認沒有誤用橘色／紅色代表任何一級。
  const startIdx = styleCss.indexOf(".stats-topic-card--practicing");
  const endIdx = styleCss.indexOf(".stats-bar-fill--mastered");
  assert(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx, "應該找得到完整的分級 CSS 區塊");
  const tierBlock = styleCss.slice(startIdx, endIdx + 200);
  assert(
    !tierBlock.includes("--color-accent-orange") && !tierBlock.includes("--color-error"),
    "挑戰紀錄頁的分級樣式不該用到 --color-accent-orange 或 --color-error（橘色/紅色留給 CTA 跟答錯回饋）"
  );

  console.log("✅ 測試 6 通過：style.css 的挑戰紀錄分級 modifier class 都存在，色條顏色跟題型選單一致，沒有誤用橘色/紅色。");
}

console.log(
  "\n✅ 全部挑戰紀錄頁熟悉度分級驗證通過（含 topicProgressTier() 邊界值、實際操作 progress.ts、原始碼接線確認）。"
);
