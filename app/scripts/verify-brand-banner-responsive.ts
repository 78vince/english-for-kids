// 驗證品牌橫幅（appendBrandBanner() 的 .brand-banner--user）在 2026-10-01 風格改版 v2
// 重新設計之後的狀態。
//
// 背景：舊版用 <br/> 強制招呼語換成兩行＋頭像 height:100% 跟著文字欄高度撐開，手機寬度下
// 長名字換行會把文字欄撐高、頭像跟著被拉成巨大圓形蓋住文字（這正是先前 9.x 系列處理過的
// 回報），當時的修法是另外寫一個 @media (max-width: 640px) 區塊，手機版改上下堆疊＋頭像
// 放大到 288px。風格改版 v2 直接把抬頭改成「頭像固定 56px＋單行招呼語」，從根源上不再需要
// 動態撐高的頭像，所以那整段手機版覆寫規則已經被拿掉——桌面／手機表現應該一致。
// 這支腳本改成驗證新版的狀態：
// - appendBrandBanner() 已登入狀態只輸出一個 <img class="brand-banner-avatar">
//   和一個單行 <h1>，不再有 .brand-banner-text／.brand-subtitle（已登入狀態不需要）
// - .brand-banner-avatar 是固定的 56×56px 圓形（不是 height:100%／width:auto）
// - .brand-banner.brand-banner--user 用 align-items: center（不是 stretch）
// - .brand-banner h1 字級用既有的 --text-body-lg token（不是原本巨大的 --text-h1）
// - 沒有殘留任何針對 .brand-banner--user 的 @media (max-width: 640px) 覆寫區塊
//   （新設計不需要手機版特殊處理）
// 用法：npx tsx scripts/verify-brand-banner-responsive.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");
const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");

// ---- 測試 1：appendBrandBanner() 已登入狀態是單行招呼語＋頭像在前，不再有
//      .brand-banner-text／.brand-subtitle／<br/> 這些舊版結構。 ----
{
  const fnMatch = mainTs.match(/function appendBrandBanner\(\): void \{[\s\S]*?\n\}\n/);
  assert(fnMatch !== null, "main.ts 應該找得到 appendBrandBanner() 函式");
  const fn = fnMatch![0];

  assert(fn.includes('class="brand-banner-avatar"'), "已登入狀態應該要有 .brand-banner-avatar 頭像");
  assert(/<h1>Hi, \$\{activeProfile\.name\}/.test(fn), "已登入狀態的招呼語應該是單行「Hi, {name}」開頭，不是舊版的 <br/> 兩行版本");
  assert(!fn.includes("<br"), "已登入狀態的招呼語不應該再用 <br/> 強制換行");
  assert(
    !/brand-banner-avatar[\s\S]*?brand-banner-text|brand-banner-text[\s\S]*?brand-banner-avatar/.test(fn) ||
      !fn.includes("brand-banner-text"),
    "已登入狀態不應該再有 .brand-banner-text 包裹層（新版頭像／文字是平行元素，不用額外包一層）"
  );

  const avatarIndex = fn.indexOf('class="brand-banner-avatar"');
  const h1Index = fn.indexOf("<h1>Hi,");
  assert(avatarIndex !== -1 && h1Index !== -1 && avatarIndex < h1Index, "頭像應該排在招呼語前面（頭像在左、文字在右）");

  console.log("✅ 測試 1 通過：appendBrandBanner() 已登入狀態改成頭像在前＋單行招呼語，不再有 <br/>／.brand-banner-text 舊結構。");
}

// ---- 測試 2：.brand-banner-avatar 改用固定 56×56px，不是 height:100%／width:auto。 ----
{
  const avatarRuleMatch = styleCss.match(/\.brand-banner-avatar \{[^}]*\}/);
  assert(avatarRuleMatch !== null, "應該找得到 .brand-banner-avatar 規則");
  const rule = avatarRuleMatch![0];

  assert(!rule.includes("height: 100%"), ".brand-banner-avatar 不應該再用 height:100%（舊版跟著文字欄撐開的根因）");
  assert(rule.includes("width: 56px;") && rule.includes("height: 56px;"), ".brand-banner-avatar 應該改用固定的 56×56px");

  console.log("✅ 測試 2 通過：.brand-banner-avatar 改用固定 56×56px，不再跟著文字欄高度撐大。");
}

// ---- 測試 3：.brand-banner.brand-banner--user 用 align-items: center（頭像不撐滿高度）。 ----
{
  const userBannerRuleMatch = styleCss.match(/\.brand-banner\.brand-banner--user \{[^}]*\}/);
  assert(userBannerRuleMatch !== null, "應該找得到 .brand-banner.brand-banner--user 規則");
  assert(userBannerRuleMatch![0].includes("align-items: center;"), ".brand-banner.brand-banner--user 應該用 align-items: center（原本是 stretch）");

  console.log("✅ 測試 3 通過：.brand-banner.brand-banner--user 改用 align-items: center，頭像不再撐滿文字欄高度。");
}

// ---- 測試 4：.brand-banner h1 字級改用 --text-body-lg（原本的 --text-h1 太大，
//      單行文字不需要那麼大的字級）。 ----
{
  const h1RuleMatch = styleCss.match(/\.brand-banner h1 \{[^}]*\}/);
  assert(h1RuleMatch !== null, "應該找得到 .brand-banner h1 規則");
  assert(h1RuleMatch![0].includes("var(--text-body-lg)"), ".brand-banner h1 應該改用 --text-body-lg（原本的 --text-h1 42px 對單行文字太大）");

  console.log("✅ 測試 4 通過：.brand-banner h1 改用 --text-body-lg，不再是原本的巨大 --text-h1。");
}

// ---- 測試 5：不應該再殘留針對 .brand-banner--user 的 @media (max-width: 640px) 覆寫
//      （新設計頭像固定 56px、單行文字，手機/桌面表現一致，不需要特殊處理）。 ----
{
  const leftoverMediaMatch = styleCss.match(
    /@media \(max-width: 640px\) \{\s*\.brand-banner\.brand-banner--user \{/
  );
  assert(
    leftoverMediaMatch === null,
    "不應該再殘留舊版針對 .brand-banner--user 的手機版 @media 覆寫區塊（新設計不需要手機版特殊處理）"
  );

  console.log("✅ 測試 5 通過：沒有殘留舊版 .brand-banner--user 的手機版覆寫區塊。");
}

console.log("\n✅ 全部品牌橫幅（風格改版 v2 單行招呼語＋固定頭像）驗證通過。");
