// 驗證「單字總覽」的例句「練習模式」（見使用者對話紀錄：主開關＋每則例句各自的
// 顯示/模糊小按鈕，取代舊版「全域顯示/隱藏英文」設計）：
// - 主開關（練習模式）預設關閉，開啟後例句英文預設模糊，每則例句多一顆「顯示這句」的
//   小圖示鈕，只影響那一則例句。
// - 全部靠 CSS class 切換（.practice-mode-on／.example-revealed），JS 端不呼叫 render()，
//   確保切換時不會收合其他已展開的例句、也不會讓畫面捲動位置跳掉。
// - 這個功能只影響「單字總覽」：「收藏清單」跟「字卡暖身」呼叫共用函式時都不傳
//   withPracticeToggle，維持一律清楚顯示、不出現這顆按鈕的舊行為。
// 這是純字串比對 main.ts 原始碼的檢查，沒有真的開瀏覽器測互動行為——實際模糊/清楚的
// 視覺效果跟主開關切換觀感仍需要在 demo-standalone.html 上手動確認。
// 用法：npx tsx scripts/verify-vocab-overview-english-toggle.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");
const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");

// ---- 測試 1：buildExampleSentenceBlock() 簽名有 withPracticeToggle: boolean = false，
//      且只有在 withPracticeToggle 為 true 時才會加上顯示鈕，點擊只切換
//      exampleBox 的 class，不呼叫 render() ----
{
  const fnMatch = mainTs.match(
    /function buildExampleSentenceBlock\(([\s\S]*?)\): HTMLDivElement \{[\s\S]*?\n\}/
  );
  assert(fnMatch !== null, "應該找得到 buildExampleSentenceBlock() 函式定義");
  assert(
    /withPracticeToggle:\s*boolean\s*=\s*false/.test(fnMatch![1]),
    "buildExampleSentenceBlock() 的參數應該有 withPracticeToggle: boolean = false（預設不出現練習按鈕，維持原本行為）"
  );
  const body = fnMatch![0];
  assert(
    body.includes('if (withPracticeToggle) {'),
    "buildExampleSentenceBlock() 應該只在 withPracticeToggle 為 true 時才建立顯示鈕"
  );
  assert(
    body.includes('exampleBox.classList.toggle("example-revealed")'),
    "顯示鈕點擊應該切換 exampleBox 的 example-revealed class"
  );
  assert(
    !body.includes("render()"),
    "buildExampleSentenceBlock() 內的顯示鈕不應該呼叫 render()（避免收合其他已展開的例句）"
  );

  console.log("✅ 測試 1 通過：buildExampleSentenceBlock() 只在 withPracticeToggle 時加上顯示鈕，且純 class 切換。");
}

// ---- 測試 2：buildVocabOverviewRow() 簽名有 withPracticeToggle: boolean = false，
//      且呼叫 buildExampleSentenceBlock() 時有傳入 withPracticeToggle ----
{
  const fnMatch = mainTs.match(
    /function buildVocabOverviewRow\(([\s\S]*?)\): HTMLDivElement \{[\s\S]*?\n\}/
  );
  assert(fnMatch !== null, "應該找得到 buildVocabOverviewRow() 函式定義");
  assert(
    /withPracticeToggle:\s*boolean\s*=\s*false/.test(fnMatch![1]),
    "buildVocabOverviewRow() 的參數應該有 withPracticeToggle: boolean = false"
  );
  assert(
    fnMatch![0].includes("buildExampleSentenceBlock(example, withPracticeToggle)"),
    "buildVocabOverviewRow() 呼叫 buildExampleSentenceBlock() 時應該傳入 withPracticeToggle"
  );

  console.log("✅ 測試 2 通過：buildVocabOverviewRow() 正確把 withPracticeToggle 傳給 buildExampleSentenceBlock()。");
}

// ---- 測試 3：renderFavorites() 呼叫 buildVocabOverviewRow(vocab) 時沒有傳第二個參數
//      （確認收藏清單沒有被連帶影響，維持一律顯示英文、沒有練習按鈕的原本行為） ----
{
  const fnMatch = mainTs.match(/function renderFavorites\(\): void \{[\s\S]*?\n\}/);
  assert(fnMatch !== null, "應該找得到 renderFavorites() 函式定義");
  assert(
    fnMatch![0].includes("buildVocabOverviewRow(vocab)"),
    "renderFavorites() 呼叫 buildVocabOverviewRow() 時不應該傳第二個參數（收藏清單不受這個功能影響）"
  );
  assert(
    !fnMatch![0].includes("buildVocabOverviewRow(vocab, "),
    "renderFavorites() 不應該把 withPracticeToggle 傳給 buildVocabOverviewRow()"
  );

  console.log("✅ 測試 3 通過：renderFavorites()（收藏清單）沒有被練習模式波及。");
}

// ---- 測試 3b：字卡暖身呼叫 buildExampleSentenceBlock(vocab.example_sentence) 也沒有
//      傳第二個參數，維持不變 ----
{
  assert(
    mainTs.includes("card.appendChild(buildExampleSentenceBlock(vocab.example_sentence));"),
    "字卡暖身呼叫 buildExampleSentenceBlock() 時不應該傳第二個參數（字卡暖身不受這個功能影響）"
  );

  console.log("✅ 測試 3b 通過：字卡暖身呼叫點也沒有被練習模式波及。");
}

// ---- 測試 4：readVocabOverviewPracticeMode()／setVocabOverviewPracticeMode() 存在，
//      且沒存過值時預設回傳 false（練習模式預設關閉） ----
{
  assert(
    mainTs.includes("function readVocabOverviewPracticeMode(): boolean {"),
    "應該有 readVocabOverviewPracticeMode() 函式"
  );
  assert(
    mainTs.includes("function setVocabOverviewPracticeMode(enabled: boolean): void {"),
    "應該有 setVocabOverviewPracticeMode() 函式"
  );

  const readFnMatch = mainTs.match(
    /function readVocabOverviewPracticeMode\(\): boolean \{[\s\S]*?\n\}/
  );
  assert(readFnMatch !== null, "應該找得到 readVocabOverviewPracticeMode() 函式定義");
  assert(
    readFnMatch![0].includes('=== "1"'),
    "readVocabOverviewPracticeMode() 應該只在存過值且等於 \"1\" 時才回傳 true，預設（沒存過/其餘情況）是 false"
  );

  console.log("✅ 測試 4 通過：練習模式讀寫函式都存在，且預設值是 false（關閉）。");
}

// ---- 測試 5：renderVocabOverview() 有讀取 readVocabOverviewPracticeMode()、
//      主開關按鈕點擊只切換 list 的 practice-mode-on class（不呼叫 render()），
//      且每一列都用 buildVocabOverviewRow(vocab, true) ----
{
  const fnMatch = mainTs.match(/function renderVocabOverview\(\): void \{[\s\S]*?\n\}/);
  assert(fnMatch !== null, "應該找得到 renderVocabOverview() 函式定義");
  const body = fnMatch![0];
  assert(
    body.includes("const practiceMode = readVocabOverviewPracticeMode();"),
    "renderVocabOverview() 應該讀取目前的練習模式狀態"
  );
  assert(
    body.includes('list.classList.toggle("practice-mode-on", next)'),
    "主開關點擊應該切換 list 的 practice-mode-on class"
  );
  assert(
    !body.includes("render();"),
    "renderVocabOverview() 的主開關點擊不應該呼叫 render()（避免收合已展開的例句、捲動位置跳掉）"
  );
  assert(
    body.includes("buildVocabOverviewRow(vocab, true)"),
    "renderVocabOverview() 建立每一列單字時應該傳入 withPracticeToggle = true"
  );

  console.log("✅ 測試 5 通過：renderVocabOverview() 正確串接練習模式主開關，且不呼叫 render()。");
}

// ---- 測試 6：style.css 有對應的 CSS 規則——模糊、還原清楚、顯示鈕預設隱藏／
//      練習模式開啟時才出現 ----
{
  assert(
    styleCss.includes(".vocab-overview-list.practice-mode-on .flashcard-example-en"),
    "style.css 應該有 .vocab-overview-list.practice-mode-on .flashcard-example-en 規則（模糊英文）"
  );
  assert(
    styleCss.includes(
      ".vocab-overview-list.practice-mode-on .flashcard-example.example-revealed .flashcard-example-en"
    ),
    "style.css 應該有 .example-revealed 規則讓單一例句還原清楚"
  );
  assert(
    styleCss.includes(".example-practice-toggle-btn {") && styleCss.includes("display: none;"),
    "style.css 的 .example-practice-toggle-btn 預設應該是 display: none（練習模式關閉時完全不出現）"
  );
  assert(
    styleCss.includes(".vocab-overview-list.practice-mode-on .example-practice-toggle-btn"),
    "style.css 應該有練習模式開啟時讓 .example-practice-toggle-btn 出現的規則"
  );

  console.log("✅ 測試 6 通過：style.css 的模糊/清楚/顯示鈕可見性規則都存在。");
}

// ---- 測試 7：🐢 emoji 已經全部換成 TURTLE_ICON，慢速開關按鈕的文字改用 <span> 包起來
//      （才能在窄螢幕用 CSS 隱藏文字、只留圖示） ----
{
  assert(
    !mainTs.includes('"🐢 慢速中" : "🐢 慢速"'),
    "main.ts 不應該再用 🐢 emoji 當按鈕文字，應該已經換成扁平單色的 TURTLE_ICON（原始碼裡提到 🐢 的地方應該只剩說明註解）"
  );
  assert(mainTs.includes("const TURTLE_ICON = (size: number) =>"), "應該有 TURTLE_ICON(size) 這個圖示產生函式");
  assert(
    mainTs.includes('slowToggleBtn.innerHTML = `${TURTLE_ICON(18)}<span>'),
    "stageHeader() 的慢速開關按鈕應該用 TURTLE_ICON 搭配 <span> 文字，不是純文字 textContent"
  );

  console.log("✅ 測試 7 通過：🐢 emoji 已換成扁平單色圖示，且文字包在 <span> 裡。");
}

// ---- 測試 8：stageHeader() 支援 extraActions 參數，並且會把傳入的元素塞進
//      .stage-banner-actions；renderVocabOverview() 把練習模式按鈕跟說明泡泡
//      透過這個參數塞進題型橫幅（不再是獨立的工具列） ----
{
  const stageHeaderMatch = mainTs.match(
    /function stageHeader\(([\s\S]*?)\): void \{[\s\S]*?\n\}/
  );
  assert(stageHeaderMatch !== null, "應該找得到 stageHeader() 函式定義");
  assert(
    /extraActions:\s*HTMLElement\[\]\s*=\s*\[\]/.test(stageHeaderMatch![1]),
    "stageHeader() 應該有 extraActions: HTMLElement[] = [] 參數"
  );
  assert(
    stageHeaderMatch![0].includes("for (const el of extraActions)"),
    "stageHeader() 應該把 extraActions 逐一塞進 .stage-banner-actions"
  );

  const renderVocabOverviewMatch = mainTs.match(
    /function renderVocabOverview\(\): void \{[\s\S]*?\n\}/
  );
  assert(renderVocabOverviewMatch !== null, "應該找得到 renderVocabOverview() 函式定義");
  assert(
    renderVocabOverviewMatch![0].includes("[toggleBtn, buildPracticeModeInfoTooltip()]"),
    "renderVocabOverview() 應該把練習模式按鈕跟說明泡泡一起當作 extraActions 傳給 stageHeader()"
  );
  assert(
    !mainTs.includes("vocab-overview-toolbar"),
    "舊版獨立工具列（.vocab-overview-toolbar）應該已經移除，按鈕跟說明現在都在題型橫幅裡"
  );

  console.log("✅ 測試 8 通過：練習模式按鈕跟說明泡泡都已經移進題型橫幅，不再是獨立工具列。");
}

// ---- 測試 9：buildPracticeModeInfoTooltip() 產生 .practice-mode-info 結構，
//      手機用長按（touchstart 計時器）觸發，不是單純點擊；且有一次性註冊的
//      全域 touchstart 監聽器負責點畫面其他地方時關閉，同樣不呼叫 render() ----
{
  assert(
    mainTs.includes("function buildPracticeModeInfoTooltip(): HTMLSpanElement {"),
    "應該有 buildPracticeModeInfoTooltip() 函式"
  );
  const fnMatch = mainTs.match(
    /function buildPracticeModeInfoTooltip\(\): HTMLSpanElement \{[\s\S]*?\n\}/
  );
  assert(fnMatch !== null, "應該找得到 buildPracticeModeInfoTooltip() 函式定義");
  const body = fnMatch![0];
  assert(body.includes('wrap.className = "practice-mode-info"'), "外層容器應該是 .practice-mode-info");
  assert(
    body.includes('infoBtn.className = "practice-mode-info-btn"'),
    "說明按鈕應該是 .practice-mode-info-btn"
  );
  assert(
    body.includes('bubble.className = "practice-mode-info-bubble"'),
    "泡泡應該是 .practice-mode-info-bubble"
  );
  assert(
    body.includes('infoBtn.addEventListener(\n    "touchstart",') || body.includes('"touchstart",'),
    "應該用 touchstart 監聽器（搭配計時器判斷長按），不是單純的 click"
  );
  assert(
    /window\.setTimeout\([\s\S]*?,\s*450\)/.test(body),
    "長按判定的計時器應該是 450ms 左右，太短容易誤觸、太長使用者會覺得沒反應"
  );

  assert(
    mainTs.includes("let openPracticeInfoTooltip: HTMLElement | null = null;"),
    "應該有模組層級的 openPracticeInfoTooltip 狀態，搭配一次性全域監聽器處理點外面關閉"
  );
  const dismissListenerIndex = mainTs.indexOf("if (openPracticeInfoTooltip === null) return;");
  assert(dismissListenerIndex !== -1, "應該有全域 touchstart 監聽器，點畫面其他地方時關閉練習模式說明泡泡");
  const dismissListenerBlock = mainTs.slice(dismissListenerIndex, dismissListenerIndex + 300);
  assert(
    dismissListenerBlock.includes('openPracticeInfoTooltip.classList.remove("practice-mode-info--open")') &&
      dismissListenerBlock.includes("openPracticeInfoTooltip = null;"),
    "全域監聽器應該把泡泡的 open class 拿掉，並清空 openPracticeInfoTooltip 狀態"
  );
  assert(
    !dismissListenerBlock.includes("render()"),
    "說明泡泡的全域關閉監聽器不應該呼叫 render()"
  );

  console.log("✅ 測試 9 通過：練習模式說明泡泡用長按觸發（不是單純點擊），且關閉時不呼叫 render()。");
}

console.log("\n✅ 全部「單字總覽」練習模式驗證通過（實際模糊/切換/長按觀感仍需 demo/實機確認）。");
