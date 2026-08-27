// 驗證品牌橫幅（appendBrandBanner() 的 .brand-banner--user）在窄螢幕下的響應式修正：
// 使用者截圖回報名字很長時，頭像圓形圖（.brand-banner-avatar 的 height:100%，跟著文字欄
// 高度一起撐開）會被文字換行撐出來的高度拉成巨大尺寸，反過來蓋住招呼語文字。
// 修法（跟使用者確認過）：640px 以下改成上下堆疊佈局，頭像改用固定尺寸（不再跟文字欄
// 高度綁在一起），標題字級也調小一階減少換行行數。使用者看過第一版（頭像 72px、
// 文字在上頭像在下）之後又回饋兩點調整：頭像放大 4 倍（72px → 288px）、頭像挪到
// 文字上面（用 CSS order 調整視覺順序，不改 main.ts 的 DOM 結構）。
// - @media (max-width: 640px) 斷點存在
// - .brand-banner--user 在斷點內改成 flex-direction: column
// - .brand-banner-avatar 在斷點內改用固定的 height／width（不是 100%）＝288px，且置中，
//   用 order: -1 排到文字欄前面
// - .brand-banner h1 在斷點內字級變小（不是原本的 --text-h1）
// - 桌面／平板寬度（斷點外）維持原樣，不受影響
// 這次調整純 CSS，main.ts 只用來確認 DOM 順序沒有被意外改動。
// 用法：npx tsx scripts/verify-brand-banner-responsive.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");
const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");

// ---- 測試 1：640px 窄螢幕斷點裡，.brand-banner--user 改成上下堆疊（column）。 ----
{
  const mediaQueryMatch = styleCss.match(
    /@media \(max-width: 640px\) \{[\s\S]*?\.brand-banner\.brand-banner--user \{[^}]*\}[\s\S]*?\n\}\n/
  );
  assert(mediaQueryMatch !== null, "應該找得到含 .brand-banner--user 規則的 @media (max-width: 640px) 區塊");
  assert(
    mediaQueryMatch![0].includes("flex-direction: column;"),
    "窄螢幕斷點裡 .brand-banner--user 應該改成 flex-direction: column（文字在上、頭像在下）"
  );

  console.log("✅ 測試 1 通過：640px 斷點裡 .brand-banner--user 改成上下堆疊（column）。");
}

// ---- 測試 2：窄螢幕斷點裡，.brand-banner-avatar 改用固定尺寸（不是 height:100%），
//      且置中——這是修掉「頭像跟著文字欄高度一起被拉大」這個根本問題的關鍵。 ----
{
  const mediaQueryMatch = styleCss.match(/@media \(max-width: 640px\) \{[\s\S]*?\n\}\n/);
  assert(mediaQueryMatch !== null, "應該找得到 @media (max-width: 640px) 區塊");
  const mq = mediaQueryMatch![0];

  assert(mq.includes(".brand-banner-avatar {"), "窄螢幕斷點裡應該要有 .brand-banner-avatar 的覆蓋規則");
  const avatarRuleInMq = mq.match(/\.brand-banner-avatar \{[^}]*\}/);
  assert(avatarRuleInMq !== null, "應該找得到窄螢幕斷點裡的 .brand-banner-avatar 規則內容");
  assert(
    !avatarRuleInMq![0].includes("height: 100%"),
    "窄螢幕斷點裡的 .brand-banner-avatar 不應該還是 height: 100%（那正是頭像被拉巨大的根本原因）"
  );
  assert(
    /height:\s*\d+px/.test(avatarRuleInMq![0]) && /width:\s*\d+px/.test(avatarRuleInMq![0]),
    "窄螢幕斷點裡的 .brand-banner-avatar 應該改用固定的 px 尺寸，不再跟文字欄高度綁在一起"
  );
  assert(avatarRuleInMq![0].includes("align-self: center;"), "窄螢幕斷點裡的頭像應該置中（align-self: center）");

  console.log("✅ 測試 2 通過：窄螢幕斷點裡頭像改用固定尺寸並置中，不再跟著文字欄高度撐大。");
}

// ---- 測試 2b：使用者看過 72px 的版本後，回饋「太小了，放大四倍」且「頭像挪到字的
//      上面」，這裡鎖定這次的具體調整：尺寸真的是 72px 的 4 倍（288px），且用 order: -1
//      把頭像排到文字欄前面（視覺上頭像在上、文字在下），不是改動 main.ts 的 DOM 順序。 ----
{
  const mediaQueryMatch = styleCss.match(/@media \(max-width: 640px\) \{[\s\S]*?\n\}\n/);
  assert(mediaQueryMatch !== null, "應該找得到 @media (max-width: 640px) 區塊");
  const avatarRuleInMq = mediaQueryMatch![0].match(/\.brand-banner-avatar \{[^}]*\}/);
  assert(avatarRuleInMq !== null, "應該找得到窄螢幕斷點裡的 .brand-banner-avatar 規則內容");

  assert(avatarRuleInMq![0].includes("height: 288px;"), "窄螢幕斷點裡的頭像高度應該是 288px（72px 的 4 倍）");
  assert(avatarRuleInMq![0].includes("width: 288px;"), "窄螢幕斷點裡的頭像寬度應該是 288px（72px 的 4 倍）");
  assert(avatarRuleInMq![0].includes("order: -1;"), "窄螢幕斷點裡的頭像應該用 order: -1 排到文字欄前面（視覺上頭像在上）");

  // 確認 main.ts 的 DOM 結構沒有被改動——appendBrandBanner() 還是文字 div 在前、
  // 頭像 img 在後，視覺上的「頭像在上」完全靠 CSS 的 order 達成，不是改 HTML 順序。
  assert(
    mainTs.includes('<div class="brand-banner-text">') &&
      mainTs.indexOf('<div class="brand-banner-text">') < mainTs.indexOf('<img class="brand-banner-avatar"'),
    "main.ts 的 appendBrandBanner() 應該維持文字 div 在前、頭像 img 在後的 DOM 順序，視覺排序交給 CSS 的 order 處理"
  );

  console.log("✅ 測試 2b 通過：窄螢幕斷點裡頭像放大成 288px（4 倍）且用 order: -1 排到文字欄上方，main.ts 的 DOM 順序沒有被改動。");
}

// ---- 測試 3：窄螢幕斷點裡，.brand-banner h1 字級調小（不是原本桌面版的 --text-h1），
//      減少長名字造成的換行行數。 ----
{
  const mediaQueryMatch = styleCss.match(/@media \(max-width: 640px\) \{[\s\S]*?\n\}\n/);
  assert(mediaQueryMatch !== null, "應該找得到 @media (max-width: 640px) 區塊");
  const mq = mediaQueryMatch![0];

  assert(mq.includes(".brand-banner h1 {"), "窄螢幕斷點裡應該要有 .brand-banner h1 的字級覆蓋規則");
  const h1RuleInMq = mq.match(/\.brand-banner h1 \{[^}]*\}/);
  assert(h1RuleInMq !== null, "應該找得到窄螢幕斷點裡的 .brand-banner h1 規則內容");
  assert(
    !h1RuleInMq![0].includes("--text-h1"),
    "窄螢幕斷點裡的 .brand-banner h1 字級不應該還是桌面版用的 --text-h1，要調小一階"
  );

  console.log("✅ 測試 3 通過：窄螢幕斷點裡標題字級調小，減少長名字換行行數。");
}

// ---- 測試 4：桌面／平板寬度（斷點外）維持原樣——.brand-banner-avatar 的預設規則
//      仍然是 height: 100%／width: auto，.brand-banner.brand-banner--user 預設仍然是
//      左右排列（不是 column），確認這次修正只影響窄螢幕，沒有動到桌面版版面。 ----
{
  // 抓出 @media 區塊之前的內容，確認桌面版預設規則沒被改掉。
  const mediaQueryIndex = styleCss.indexOf("@media (max-width: 640px)");
  assert(mediaQueryIndex !== -1, "應該找得到 @media (max-width: 640px) 的位置");
  const beforeMediaQuery = styleCss.slice(0, mediaQueryIndex);

  const defaultAvatarRule = beforeMediaQuery.match(/\.brand-banner-avatar \{[^}]*\}/);
  assert(defaultAvatarRule !== null, "應該找得到桌面版預設的 .brand-banner-avatar 規則（在 @media 區塊之前）");
  assert(defaultAvatarRule![0].includes("height: 100%;") && defaultAvatarRule![0].includes("width: auto;"), "桌面版預設的 .brand-banner-avatar 應該維持 height:100%／width:auto，不受這次窄螢幕修正影響");

  const defaultUserBannerRule = beforeMediaQuery.match(/\.brand-banner\.brand-banner--user \{[^}]*\}/);
  assert(defaultUserBannerRule !== null, "應該找得到桌面版預設的 .brand-banner.brand-banner--user 規則");
  assert(
    !defaultUserBannerRule![0].includes("flex-direction: column"),
    "桌面版預設的 .brand-banner.brand-banner--user 不應該是 column，要維持原本的左右排列"
  );

  console.log("✅ 測試 4 通過：桌面／平板寬度維持原本左右排列的版面，這次修正只在窄螢幕生效。");
}

console.log("\n✅ 全部品牌橫幅窄螢幕響應式修正驗證通過。");
