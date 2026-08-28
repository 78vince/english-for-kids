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
// 用法：npx tsx scripts/verify-stage-banner-responsive.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");

// ---- 測試 1：640px 窄螢幕斷點裡，.stage-banner 改成上下堆疊（column）。 ----
{
  const mediaQueryMatch = styleCss.match(
    /@media \(max-width: 640px\) \{[\s\S]*?\.stage-banner \{[^}]*\}[\s\S]*?\n\}\n/
  );
  assert(mediaQueryMatch !== null, "應該找得到含 .stage-banner 規則的 @media (max-width: 640px) 區塊");
  const mq = mediaQueryMatch![0];

  const stageBannerRuleInMq = mq.match(/\.stage-banner \{[^}]*\}/);
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
  const mediaQueryMatch = styleCss.match(
    /@media \(max-width: 640px\) \{[\s\S]*?\.stage-banner \{[^}]*\}[\s\S]*?\n\}\n/
  );
  assert(mediaQueryMatch !== null, "應該找得到含 .stage-banner 規則的 @media (max-width: 640px) 區塊");
  const mq = mediaQueryMatch![0];

  assert(mq.includes(".stage-banner-actions {"), "窄螢幕斷點裡應該要有 .stage-banner-actions 的覆蓋規則");
  const actionsRuleInMq = mq.match(/\.stage-banner-actions \{[^}]*\}/);
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
  const mediaQueryIndex = styleCss.indexOf("@media (max-width: 640px)");
  assert(mediaQueryIndex !== -1, "應該找得到 @media (max-width: 640px) 的位置");
  const beforeMediaQuery = styleCss.slice(0, mediaQueryIndex);

  const defaultStageBannerRule = beforeMediaQuery.match(/\.stage-banner \{[^}]*\}/);
  assert(defaultStageBannerRule !== null, "應該找得到桌面版預設的 .stage-banner 規則（在 @media 區塊之前）");
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
