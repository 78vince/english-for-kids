// 驗證字卡暖身／測驗畫面「文字＋圖示（喇叭播放／星星收藏）」在窄螢幕下改成
// 「圖示在上、文字在下」的響應式修正，涉及三處：
// 1. .flashcard-word-row（字卡正面，單字文字＋🔊＋⭐）：main.ts 把 🔊／⭐ 包進共用的
//    .flashcard-word-icons 容器，配合 style.css 640px 斷點的 flex-direction: column-reverse
//    讓兩顆圖示排在文字上面同一行。
// 2. .flashcard-example-row（例句區塊，文字＋🔊）：只有一顆圖示，不用額外包容器，
//    直接靠 column-reverse 把 DOM 順序「文字在前、圖示在後」反過來排列。
// 3. .flashcard-quiz-reveal（測驗答完顯示的「正確單字」列，文字＋🔊）：同上，
//    只是桌面版是靠左對齊（不是置中），窄螢幕維持靠左。
// 用法：npx tsx scripts/verify-flashcard-icons-responsive.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");
const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");

// ---- 測試 1：main.ts 裡 .flashcard-word-icons 容器真的把播放鍵跟收藏星星包在一起，
//      且順序是先加入文字（wordEn）、再加入這個圖示容器（column-reverse 才會呈現正確）。 ----
{
  assert(
    mainTs.includes('iconsWrap.className = "flashcard-word-icons"'),
    "main.ts 應該要建立 class 為 flashcard-word-icons 的容器"
  );

  const wordRowSection = mainTs.match(
    /const wordRow = document\.createElement\("div"\);[\s\S]*?card\.appendChild\(wordRow\);/
  );
  assert(wordRowSection !== null, "應該找得到建立 .flashcard-word-row 的程式碼區塊");
  const section = wordRowSection![0];

  const wordEnIndex = section.indexOf("wordRow.appendChild(wordEn)");
  const iconsWrapCreateIndex = section.indexOf('iconsWrap.className = "flashcard-word-icons"');
  const replayAppendIndex = section.indexOf("iconsWrap.appendChild(replayWordBtn)");
  const favoriteAppendIndex = section.indexOf("iconsWrap.appendChild(buildFavoriteStarButton(");
  const wordRowAppendIconsIndex = section.indexOf("wordRow.appendChild(iconsWrap)");

  assert(
    wordEnIndex !== -1 &&
      iconsWrapCreateIndex !== -1 &&
      replayAppendIndex !== -1 &&
      favoriteAppendIndex !== -1 &&
      wordRowAppendIconsIndex !== -1,
    "應該找得到 wordEn／iconsWrap 建立／播放鍵／收藏星星／wordRow 掛載 iconsWrap 這幾個步驟"
  );
  assert(
    wordEnIndex < iconsWrapCreateIndex &&
      replayAppendIndex < favoriteAppendIndex &&
      favoriteAppendIndex < wordRowAppendIconsIndex,
    "DOM 組裝順序應該是：文字先加入 wordRow，圖示容器（先播放鍵、再收藏星星）最後才加入 wordRow"
  );
  assert(
    section.includes("iconsWrap.appendChild(replayWordBtn)") &&
      section.includes("iconsWrap.appendChild(buildFavoriteStarButton("),
    "🔊 播放鍵跟 ⭐ 收藏星星都應該是 iconsWrap 的子節點，不是直接掛在 wordRow 下面"
  );

  console.log("✅ 測試 1 通過：main.ts 的 .flashcard-word-icons 容器正確包住播放鍵與收藏星星，DOM 順序正確。");
}

// ---- 測試 2：style.css 裡 .flashcard-word-icons 容器規則存在。 ----
{
  assert(
    /\.flashcard-word-icons\s*\{[^}]*display:\s*flex;/.test(styleCss),
    "style.css 應該有 .flashcard-word-icons 的 flex 容器規則"
  );
  console.log("✅ 測試 2 通過：.flashcard-word-icons 容器樣式存在。");
}

// ---- 測試 3：640px 斷點內，三個 .flashcard-*-row/-reveal 都是 flex-direction: column-reverse。 ----
{
  const targets: Array<{ selector: string; expectedAlign?: string }> = [
    { selector: ".flashcard-word-row" },
    { selector: ".flashcard-example-row", expectedAlign: "center" },
    { selector: ".flashcard-quiz-reveal", expectedAlign: "flex-start" },
  ];

  for (const { selector, expectedAlign } of targets) {
    const escaped = selector.replace(/[.]/g, "\\.");
    const mediaMatch = styleCss.match(
      new RegExp(
        `@media \\(max-width: 640px\\) \\{\\s*${escaped} \\{[^}]*\\}[\\s\\S]*?\\n\\}\\n`
      )
    );
    assert(mediaMatch !== null, `應該找得到含 ${selector} 規則、且它是區塊裡第一條規則的 @media (max-width: 640px)`);
    const rule = mediaMatch![0].match(new RegExp(`${escaped} \\{[^}]*\\}`));
    assert(rule !== null, `應該找得到 ${selector} 在窄螢幕斷點裡的規則內容`);
    assert(
      rule![0].includes("flex-direction: column-reverse;"),
      `窄螢幕斷點裡 ${selector} 應該改成 flex-direction: column-reverse（圖示在上、文字在下）`
    );
    if (expectedAlign) {
      assert(
        rule![0].includes(`align-items: ${expectedAlign};`),
        `窄螢幕斷點裡 ${selector} 的 align-items 應該是 ${expectedAlign}`
      );
    }
  }

  console.log(
    "✅ 測試 3 通過：.flashcard-word-row／.flashcard-example-row／.flashcard-quiz-reveal 640px 斷點內都改成 column-reverse。"
  );
}

// ---- 測試 4：桌面／平板寬度（斷點外）三者都維持原本 row 排版，沒有被誤改。 ----
// 注意：style.css 裡有好幾個不同功能各自的 @media (max-width: 640px) 區塊（.stage-banner／
// .brand-banner--user／.profile-stats-grid／這次新增的三個 flashcard 相關的），不能直接拿
// 「檔案裡第一個 @media」的位置當基準（那個可能是排在很前面的 .stage-banner 區塊，跟這裡
// 的 flashcard 規則完全無關）。改成：桌面版預設規則必須出現在「它自己那個」640px 區塊
// 之前（用測試 3 同一套錨定規則重新找一次屬於這個 selector 的區塊）。
{
  for (const selector of [".flashcard-word-row", ".flashcard-example-row", ".flashcard-quiz-reveal"]) {
    const escaped = selector.replace(/[.]/g, "\\.");

    const ownMediaMatch = styleCss.match(
      new RegExp(`@media \\(max-width: 640px\\) \\{\\s*${escaped} \\{[^}]*\\}[\\s\\S]*?\\n\\}\\n`)
    );
    assert(ownMediaMatch !== null, `應該找得到屬於 ${selector} 的 @media (max-width: 640px) 區塊`);
    const ownMediaIndex = styleCss.indexOf(ownMediaMatch![0]);

    const defaultRuleMatch = styleCss.match(new RegExp(`${escaped} \\{[^}]*\\}`));
    assert(defaultRuleMatch !== null, `應該找得到桌面版預設的 ${selector} 規則`);
    const defaultRuleIndex = styleCss.indexOf(defaultRuleMatch![0]);
    assert(
      defaultRuleIndex < ownMediaIndex,
      `桌面版預設的 ${selector} 規則應該出現在它自己的 @media (max-width: 640px) 區塊之前`
    );
    assert(
      !defaultRuleMatch![0].includes("column-reverse"),
      `桌面版預設的 ${selector} 不應該是 column-reverse，要維持原本的橫向排列`
    );
  }

  console.log("✅ 測試 4 通過：桌面／平板寬度維持原本橫向排列，這次修正只在窄螢幕生效。");
}

console.log("\n✅ 全部字卡圖示窄螢幕響應式修正驗證通過。");
