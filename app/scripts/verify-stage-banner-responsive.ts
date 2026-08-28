// 驗證題型橫幅（stageHeader() 產生的 .stage-banner）在窄螢幕下的響應式修正：
// 使用者用手機（iPhone Safari）實測回報，.stage-banner 原本是 justify-content: space-between
// 的單列排版，標題文字（.stage-banner-text，min-width:0 會被壓縮）跟右側按鈕群組
// （.stage-banner-actions，內部按鈕都是 flex-shrink:0 不會縮）搶版面，手機寬度下標題被擠成
// 一欄只能放一兩個字的窄直條——跟 .brand-banner--user 的頭像疊字問題（見
// verify-brand-banner-responsive.ts）同一類成因，比照同一個做法修：640px 以下改上下堆疊，
// 標題文字獨占一整列，動作按鈕群組（慢速切換鈕＋返回選單）換到下面單獨一列、靠右對齊。
// - @media (max-width: 640px) 區塊裡含 .stage-banner { ... flex-direction: column; ... }
// - 同一個區塊裡 .stage-banner-actions 改成 justify-content: flex-end
// - 桌面／平板寬度（斷點外）維持原樣，.stage-banner 仍是 justify-content: space-between，
//   沒有 flex-direction: column
// 這次調整純 CSS，不涉及 main.ts。
//
// 2026-08-28 補充：style.css 裡陸續為其他畫面（.game-header--with-back／
// .brand-banner--user／.profile-stats-grid／字卡圖示……）新增了好幾個同斷點的
// @media (max-width: 640px) 區塊，所以鎖定「屬於 .stage-banner 的那個區塊」時，
// 一定要用「.stage-banner { 緊接在 @media (max-width: 640px) { 開頭之後（中間只能有
// 空白/換行）」這種嚴格錨點，不能用「檔案裡第一個 @media」這種天真假設——那樣可能
// 抓到其他功能的區塊，或抓到桌面版預設的 .stage-banner { ... } 規則（不在媒體查詢內，
// 但文字上可能排在真正的窄螢幕覆寫區塊之前）。
// 用法：npx tsx scripts/verify-stage-banner-responsive.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");

// 鎖定屬於 .stage-banner 的那個 640px 區塊：要求 .stage-banner { 緊接在
// @media (max-width: 640px) { 開頭之後（中間只能有空白/換行），才不會抓錯區塊。
const stageBannerMediaMatch = styleCss.match(
  /@media \(max-width: 640px\) \{\s*\.stage-banner \{[^}]*\}[\s\S]*?\n\}\n/
);
assert(stageBannerMediaMatch !== null, "應該找得到含 .stage-banner 規則的 @media (max-width: 640px) 區塊");
const stageBannerMediaBlock = stageBannerMediaMatch![0];
const stageBannerMediaIndex = styleCss.indexOf(stageBannerMediaBlock);

// ---- 測試 1：640px 窄螢幕斷點裡，.stage-banner 改成上下堆疊（column）。 ----
{
  const stageBannerRuleInMq = stageBannerMediaBlock.match(/\.stage-banner \{[^}]*\}/);
  assert(stageBannerRuleInMq !== null, "應該找得到窄螢幕斷點裡的 .stage-banner 規則內容");
  assert(
    stageBannerRuleInMq![0].includes("flex-direction: column;"),
    "窄螢幕斷點裡 .stage-banner 應該改成 flex-direction: column（標題在上、按鈕群組在下）"
  );

  console.log("✅ 測試 1 通過：640px 斷點裡 .stage-banner 改成上下堆疊（column）。");
}

// ---- 測試 2：同一個窄螢幕斷點裡，.stage-banner-actions 改成靠右對齊（justify-content:
//      flex-end），這樣上下堆疊後，慢速切換鈕＋返回選單那一列會自然靠右，不是散開。 ----
{
  assert(
    stageBannerMediaBlock.includes(".stage-banner-actions {"),
    "窄螢幕斷點裡應該要有 .stage-banner-actions 的覆蓋規則"
  );
  const actionsRuleInMq = stageBannerMediaBlock.match(/\.stage-banner-actions \{[^}]*\}/);
  assert(actionsRuleInMq !== null, "應該找得到窄螢幕斷點裡的 .stage-banner-actions 規則內容");
  assert(
    actionsRuleInMq![0].includes("justify-content: flex-end;"),
    "窄螢幕斷點裡 .stage-banner-actions 應該改成 justify-content: flex-end，讓按鈕群組靠右對齊"
  );

  console.log("✅ 測試 2 通過：640px 斷點裡 .stage-banner-actions 改成靠右對齊。");
}

// ---- 測試 3：桌面／平板寬度（斷點外）維持原樣——.stage-banner 預設規則仍然是
//      justify-content: space-between，沒有 flex-direction: column，確認這次修正
//      只影響窄螢幕，沒有動到桌面版版面。 ----
{
  const defaultStageBannerRule = styleCss.match(/\.stage-banner \{[^}]*\}/);
  assert(defaultStageBannerRule !== null, "應該找得到桌面版預設的 .stage-banner 規則");
  const defaultRuleIndex = styleCss.indexOf(defaultStageBannerRule![0]);
  assert(
    defaultRuleIndex < stageBannerMediaIndex,
    "桌面版預設的 .stage-banner 規則應該出現在它自己的 @media (max-width: 640px) 區塊之前"
  );
  assert(
    defaultStageBannerRule![0].includes("justify-content: space-between;"),
    "桌面版預設的 .stage-banner 應該維持 justify-content: space-between，不受這次窄螢幕修正影響"
  );
  assert(
    !defaultStageBannerRule![0].includes("flex-direction: column"),
    "桌面版預設的 .stage-banner 不應該是 column，要維持原本的左右排列"
  );

  console.log("✅ 測試 3 通過：桌面／平板寬度維持原本左右排列的版面，這次修正只在窄螢幕生效。");
}

console.log("\n✅ 全部題型橫幅窄螢幕響應式修正驗證通過。");
