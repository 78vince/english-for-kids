// 驗證手機版排版第三輪修正（使用者用手機截圖回報四處「頭像/文字/按鈕破格或該
// 上下排列卻沒有」的問題）：
// 1. 「誰在玩」清單項目（.profile-login-btn）：頭像＋名字/上次登入文字，640px 以下
//    改上下堆疊置中，避免文字被固定 200px 寬的頭像擠出卡片外側。
// 2. 「個人檔案」個人小卡（.profile-card）：跟 1 同一類成因，改上下堆疊置中。
// 3. 挑戰紀錄展開後的題型明細列（.stats-stage-row）：資訊區＋「再次挑戰/開始挑戰」
//    按鈕，640px 以下改上下排列，按鈕撐滿寬度。
// 4. 挑戰紀錄頂部三張數據卡（.stats-summary）：640px 以下改單欄、上下堆疊。
//
// 這幾個 selector 都只出現一次（不是像 .stage-banner／.brand-banner--user 那種
// 選字面文字會撞到「桌面版預設規則」跟「其他功能的 640px 區塊」的情況），但保險起見
// 還是統一用「selector 緊接在 @media (max-width: 640px) { 開頭之後」的嚴格錨點，
// 不用「檔案裡第一個 @media」這種天真假設——這個專案已經因為這個天真假設踩雷三次了
// （見 verify-brand-banner-responsive.ts／verify-stage-banner-responsive.ts 的排查記錄）。
// 用法：npx tsx scripts/verify-mobile-layout-round3.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");

function findOwnMediaBlock(selector: string): string {
  const escaped = selector.replace(/[.]/g, "\\.");
  const match = styleCss.match(
    new RegExp(`@media \\(max-width: 640px\\) \\{\\s*${escaped} \\{[^}]*\\}[\\s\\S]*?\\n\\}\\n`)
  );
  assert(match !== null, `應該找得到屬於 ${selector} 的 @media (max-width: 640px) 區塊（selector 必須緊接在開頭之後）`);
  return match![0];
}

// ---- 測試 1：.profile-login-btn 640px 斷點內改上下堆疊，圓角從 pill 改成 xl。 ----
{
  const mq = findOwnMediaBlock(".profile-login-btn");
  const rule = mq.match(/\.profile-login-btn \{[^}]*\}/)![0];
  assert(rule.includes("flex-direction: column;"), ".profile-login-btn 窄螢幕應該改成 flex-direction: column");
  assert(rule.includes("border-radius: var(--radius-xl);"), ".profile-login-btn 窄螢幕應該把 pill 圓角改成 --radius-xl，避免堆疊後變成膠囊形狀");
  assert(mq.includes(".profile-login-info {"), "640px 斷點裡應該也有 .profile-login-info 的置中覆蓋規則");

  const defaultRule = styleCss.match(/\.profile-login-btn \{[^}]*\}/);
  assert(defaultRule !== null, "應該找得到桌面版預設的 .profile-login-btn 規則");
  assert(defaultRule![0].includes("border-radius: var(--radius-pill);"), "桌面版預設的 .profile-login-btn 應該維持 pill 圓角，不受這次窄螢幕修正影響");
  assert(!defaultRule![0].includes("flex-direction: column"), "桌面版預設的 .profile-login-btn 不應該是 column");

  console.log("✅ 測試 1 通過：.profile-login-btn 640px 斷點內改上下堆疊置中，桌面版維持原樣。");
}

// ---- 測試 2：.profile-card 640px 斷點內改上下堆疊置中。 ----
{
  const mq = findOwnMediaBlock(".profile-card");
  const rule = mq.match(/\.profile-card \{[^}]*\}/)![0];
  assert(rule.includes("flex-direction: column;"), ".profile-card 窄螢幕應該改成 flex-direction: column");
  assert(rule.includes("align-items: center;"), ".profile-card 窄螢幕應該置中對齊，讓頭像/文字都在正中間");
  assert(mq.includes(".profile-card-info {"), "640px 斷點裡應該也有 .profile-card-info 置中文字的覆蓋規則");

  const defaultRule = styleCss.match(/\.profile-card \{[^}]*\}/);
  assert(defaultRule !== null, "應該找得到桌面版預設的 .profile-card 規則");
  assert(!defaultRule![0].includes("flex-direction: column"), "桌面版預設的 .profile-card 不應該是 column，要維持原本的左右兩欄排列");

  console.log("✅ 測試 2 通過：.profile-card 640px 斷點內改上下堆疊置中，桌面版維持原樣。");
}

// ---- 測試 3：.stats-stage-row 640px 斷點內改上下排列，按鈕撐滿寬度。 ----
{
  const mq = findOwnMediaBlock(".stats-stage-row");
  const rule = mq.match(/\.stats-stage-row \{[^}]*\}/)![0];
  assert(rule.includes("flex-direction: column;"), ".stats-stage-row 窄螢幕應該改成 flex-direction: column");
  const btnRule = mq.match(/\.stats-stage-btn \{[^}]*\}/);
  assert(btnRule !== null, "640px 斷點裡應該也有 .stats-stage-btn 的覆蓋規則");
  assert(btnRule![0].includes("align-self: stretch;"), ".stats-stage-btn 窄螢幕應該用 align-self: stretch 撐滿寬度");

  const defaultRule = styleCss.match(/\.stats-stage-row \{[^}]*\}/);
  assert(defaultRule !== null, "應該找得到桌面版預設的 .stats-stage-row 規則");
  assert(defaultRule![0].includes("justify-content: space-between;"), "桌面版預設的 .stats-stage-row 應該維持 justify-content: space-between");
  assert(!defaultRule![0].includes("flex-direction: column"), "桌面版預設的 .stats-stage-row 不應該是 column");

  console.log("✅ 測試 3 通過：.stats-stage-row 640px 斷點內改上下排列，按鈕撐滿寬度，桌面版維持原樣。");
}

// ---- 測試 4：.stats-summary 640px 斷點內改單欄（column）。 ----
{
  const mq = findOwnMediaBlock(".stats-summary");
  const rule = mq.match(/\.stats-summary \{[^}]*\}/)![0];
  assert(rule.includes("flex-direction: column;"), ".stats-summary 窄螢幕應該改成 flex-direction: column（單欄堆疊）");

  const defaultRule = styleCss.match(/\.stats-summary \{[^}]*\}/);
  assert(defaultRule !== null, "應該找得到桌面版預設的 .stats-summary 規則");
  assert(!defaultRule![0].includes("flex-direction: column"), "桌面版預設的 .stats-summary 不應該是 column，要維持原本三欄橫向排列");

  console.log("✅ 測試 4 通過：.stats-summary 640px 斷點內改單欄堆疊，桌面版維持原樣三欄橫排。");
}

console.log("\n✅ 全部手機版排版第三輪修正驗證通過。");
