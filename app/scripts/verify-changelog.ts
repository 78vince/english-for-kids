// 驗證「關於本站」頁面新增的「更新紀錄」功能（見 docs/handoff-prompt-changelog-section.md）：
// 1. content/changelog.json 每筆資料格式正確（date 是 YYYY-MM-DD、title/items 不是空字串、
//    items 至少 1 條）——這份檔案之後會由內容端直接編輯加新條目，這個檢查可以在加錯格式時
//    馬上抓到，不用等到畫面上才發現。
// 2. content.ts 有正確匯入並匯出 CHANGELOG（不排序，直接原樣匯出，因為檔案本身已經是
//    新到舊排列）。
// 3. main.ts 的 renderAbout() 有讀 CHANGELOG、只取最新 5 則、放在「使用須知」之後、
//    版本號（metaText）之前的位置。
// 這些都是純資料/原始碼層面的字串檢查，不涉及真的開瀏覽器渲染——畫面實際排版（手機版
// 是否跑版）仍需要使用者在 demo-standalone.html 或實機上確認，見 HANDOFF.md 對應章節。
// 用法：npx tsx scripts/verify-changelog.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// ---- 測試 1：content/changelog.json 每筆資料格式正確 ----
{
  const changelog: unknown = JSON.parse(
    readFileSync(new URL("../../content/changelog.json", import.meta.url), "utf-8")
  );

  assert(Array.isArray(changelog), "content/changelog.json 應該是一個陣列");
  const entries = changelog as Array<{ date?: unknown; title?: unknown; items?: unknown }>;
  assert(entries.length > 0, "content/changelog.json 應該至少有 1 筆資料");

  entries.forEach((entry, index) => {
    assert(
      typeof entry.date === "string" && DATE_PATTERN.test(entry.date),
      `第 ${index + 1} 筆資料的 date 應該符合 YYYY-MM-DD 格式，實際是 ${JSON.stringify(entry.date)}`
    );
    assert(
      typeof entry.title === "string" && entry.title.trim().length > 0,
      `第 ${index + 1} 筆資料的 title 不應該是空字串`
    );
    assert(Array.isArray(entry.items), `第 ${index + 1} 筆資料的 items 應該是陣列`);
    const items = entry.items as unknown[];
    assert(items.length >= 1, `第 ${index + 1} 筆資料的 items 至少要有 1 條`);
    items.forEach((item, itemIndex) => {
      assert(
        typeof item === "string" && item.trim().length > 0,
        `第 ${index + 1} 筆資料的第 ${itemIndex + 1} 條 items 不應該是空字串`
      );
    });
  });

  console.log(`✅ 測試 1 通過：content/changelog.json 共 ${entries.length} 筆資料，格式都正確。`);
}

// ---- 測試 2：content.ts 有正確匯入 changelog.json 並原樣匯出 CHANGELOG（不用排序） ----
{
  const contentTs = readFileSync(new URL("../src/content.ts", import.meta.url), "utf-8");

  assert(
    contentTs.includes('import changelogData from "../../content/changelog.json"'),
    "content.ts 應該要 import changelog.json"
  );
  assert(
    contentTs.includes("export const CHANGELOG: ChangelogEntry[] = changelogData;"),
    "content.ts 應該原樣匯出 CHANGELOG（檔案本身已經新到舊排列，不需要再排序）"
  );

  console.log("✅ 測試 2 通過：content.ts 正確匯入並匯出 CHANGELOG。");
}

// ---- 測試 3：main.ts 的 renderAbout() 有正確使用 CHANGELOG，只取最新 5 則，
//      並且放在「使用須知」之後、版本號（metaText）之前 ----
{
  const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");

  assert(
    mainTs.includes("CHANGELOG,") || /import\s*\{[^}]*\bCHANGELOG\b[^}]*\}\s*from\s*"\.\/content"/.test(mainTs),
    "main.ts 應該從 ./content 匯入 CHANGELOG"
  );
  assert(
    mainTs.includes("CHANGELOG.slice(0, 5)"),
    "renderAbout() 應該只取 CHANGELOG 最新 5 則（CHANGELOG.slice(0, 5)），不做「查看更多」的展開功能"
  );

  const renderAboutFn = mainTs.match(/function renderAbout\(\): void \{[\s\S]*?\n\}/);
  assert(renderAboutFn !== null, "應該找得到 renderAbout() 函式定義");
  const body = renderAboutFn![0];

  const usageTitleIndex = body.indexOf('usageSectionTitle.textContent = "使用須知"');
  const changelogTitleIndex = body.indexOf('changelogSectionTitle.textContent = "更新紀錄"');
  const metaTextIndex = body.indexOf("const metaText = document.createElement");

  assert(usageTitleIndex !== -1, "renderAbout() 裡應該找得到「使用須知」標題");
  assert(changelogTitleIndex !== -1, "renderAbout() 裡應該找得到「更新紀錄」標題");
  assert(metaTextIndex !== -1, "renderAbout() 裡應該找得到版本號（metaText）");
  assert(
    usageTitleIndex < changelogTitleIndex && changelogTitleIndex < metaTextIndex,
    "「更新紀錄」區塊應該放在「使用須知」之後、版本號（metaText）之前"
  );

  console.log("✅ 測試 3 通過：renderAbout() 正確串接 CHANGELOG，且放置順序正確（使用須知 → 更新紀錄 → 版本號）。");
}

console.log("\n✅ 全部「更新紀錄」功能驗證通過（實際手機版排版仍需 demo/實機確認）。");
