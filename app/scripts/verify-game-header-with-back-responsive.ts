// 驗證「主題內題型選單」畫面（renderMenu() 產生的 .game-header--with-back）在窄螢幕下的
// 響應式修正：跟 .stage-banner（見 verify-stage-banner-responsive.ts）同一類成因——標題文字
// 跟返回按鈕（「← 返回選擇主題」，比其他畫面的「← 返回選單」長）搶版面，窄螢幕下標題被擠成
// 逐字換行的窄直條。比照同一個做法修：640px 以下改上下堆疊，標題文字獨占一整列，返回按鈕
// 換到下面單獨一列（靠左，這個標題只有一顆按鈕，不像 .stage-banner-actions 需要額外處理
// 靠右對齊）。
// - @media (max-width: 640px) 區塊裡含 .game-header--with-back { ... flex-direction: column; ... }
// - 桌面／平板寬度（斷點外）維持原樣，.game-header--with-back 仍是 justify-content: space-between，
//   沒有 flex-direction: column
// 這次調整純 CSS，不涉及 main.ts。
// 用法：npx tsx scripts/verify-game-header-with-back-responsive.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");

// ---- 測試 1：640px 窄螢幕斷點裡，.game-header--with-back 改成上下堆疊（column）。 ----
{
  const mediaQueryMatch = styleCss.match(
    /@media \(max-width: 640px\) \{\s*\.game-header--with-back \{[^}]*\}[\s\S]*?\n\}\n/
  );
  assert(
    mediaQueryMatch !== null,
    "應該找得到含 .game-header--with-back 規則的 @media (max-width: 640px) 區塊"
  );
  const mq = mediaQueryMatch![0];

  const ruleInMq = mq.match(/\.game-header--with-back \{[^}]*\}/);
  assert(ruleInMq !== null, "應該找得到窄螢幕斷點裡的 .game-header--with-back 規則內容");
  assert(
    ruleInMq![0].includes("flex-direction: column;"),
    "窄螢幕斷點裡 .game-header--with-back 應該改成 flex-direction: column（標題在上、返回按鈕在下）"
  );

  console.log("✅ 測試 1 通過：640px 斷點裡 .game-header--with-back 改成上下堆疊（column）。");
}

// ---- 測試 2：桌面／平板寬度（斷點外）維持原樣——.game-header--with-back 預設規則仍然是
//      justify-content: space-between，沒有 flex-direction: column，確認這次修正只影響
//      窄螢幕，沒有動到桌面版版面。 ----
{
  const mediaQueryIndex = styleCss.indexOf("@media (max-width: 640px)");
  assert(mediaQueryIndex !== -1, "應該找得到 @media (max-width: 640px) 的位置");

  const defaultRuleMatch = styleCss.match(/\.game-header--with-back \{[^}]*\}/);
  assert(defaultRuleMatch !== null, "應該找得到桌面版預設的 .game-header--with-back 規則");
  const defaultRuleIndex = styleCss.indexOf(defaultRuleMatch![0]);
  assert(
    defaultRuleIndex < mediaQueryIndex,
    "桌面版預設的 .game-header--with-back 規則應該出現在第一個 @media (max-width: 640px) 之前"
  );
  assert(
    defaultRuleMatch![0].includes("justify-content: space-between;"),
    "桌面版預設的 .game-header--with-back 應該維持 justify-content: space-between，不受這次窄螢幕修正影響"
  );
  assert(
    !defaultRuleMatch![0].includes("flex-direction: column"),
    "桌面版預設的 .game-header--with-back 不應該是 column，要維持原本的左右排列"
  );

  console.log("✅ 測試 2 通過：桌面／平板寬度維持原本左右排列的版面，這次修正只在窄螢幕生效。");
}

console.log("\n✅ 全部題型選單標題窄螢幕響應式修正驗證通過。");
