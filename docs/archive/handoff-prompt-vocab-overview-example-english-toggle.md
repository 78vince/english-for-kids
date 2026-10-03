# Handoff：「單字總覽」新增例句英文開關（練習「看中文說英文」）

使用者需求：在主題內的「單字總覽」畫面，每個單字展開的例句區塊目前同時顯示英文＋中文。希望新增一個開關，可以把例句裡的**英文文字**先隱藏起來，讓使用者可以看著中文例句練習自己說出英文，說完之後再打開開關核對是否正確。**預設中、英文都顯示（開關預設是「開」）**。

## 範圍：只影響「單字總覽」，不影響「收藏清單」跟「字卡暖身」

`app/src/main.ts` 裡 `buildExampleSentenceBlock()`（第 1677-1704 行）目前被三個地方共用：

1. `buildVocabOverviewRow()`（第 1709-1766 行）→ 又被「單字總覽」`renderVocabOverview()`（第 1770 行）跟「收藏清單」`renderFavorites()`（第 1838 行附近）兩處呼叫
2. 字卡暖身畫面直接呼叫（第 2698 行附近）

使用者這次明確只提到「單字總覽」，**收藏清單、字卡暖身維持現狀，不要因為共用同一個函式就整個站台都被改到**。做法是幫這兩個共用函式加一個「是否顯示英文」的參數，預設值 `true`（維持原本行為），只有「單字總覽」呼叫的地方主動傳入目前的開關狀態：

```ts
// buildExampleSentenceBlock() 簽名改成：
function buildExampleSentenceBlock(
  example: { en: string; zh: string },
  showEnglish: boolean = true
): HTMLDivElement {
  // ...其餘不變，只有這裡改成依 showEnglish 決定要不要隱藏英文那一行：
  const exampleEn = document.createElement("span");
  exampleEn.className = "flashcard-example-en";
  exampleEn.textContent = example.en;
  exampleEn.hidden = !showEnglish; // 新增：英文開關關閉時隱藏這個 span
  exampleRow.appendChild(exampleEn);
  // 🔊 播放發音按鈕維持一律顯示，不受這個開關影響——使用者可能想先聽發音練習，
  // 這個開關管的是「看得到英文文字」，不是「聽不聽得到發音」，兩者是分開的功能。
```

```ts
// buildVocabOverviewRow() 簽名改成：
function buildVocabOverviewRow(vocab: Vocab, showEnglish: boolean = true): HTMLDivElement {
  // ...
  const examplePanel = buildExampleSentenceBlock(example, showEnglish); // 傳入 showEnglish
  // ...
}
```

- `renderFavorites()` 呼叫 `buildVocabOverviewRow(vocab)` 的地方**不用改**，沒傳第二個參數會自動用預設值 `true`，行為完全不變。
- 字卡暖身呼叫 `buildExampleSentenceBlock(vocab.example_sentence)` 的地方也**不用改**，同理維持不變。

## 新增持久化設定（裝置層級，比照 `isSlowSpeechEnabled()` 的做法）

這個開關是「這台裝置的練習模式偏好」，不是學習成效資料，比照 `app/src/speech.ts` 裡 `slowModeEnabled`／`SLOW_MODE_STORAGE_KEY` 的寫法（不分使用者，存在 localStorage）。因為這個設定只有「單字總覽」這一個畫面會用到，不需要放進 `speech.ts`（那個檔案是語音播放相關設定），直接加在 `main.ts` 裡即可，放在 `renderVocabOverview()` 定義之前：

```ts
const VOCAB_OVERVIEW_SHOW_ENGLISH_STORAGE_KEY = "englishForKids.settings.vocabOverviewShowEnglish.v1";

/** 「單字總覽」例句要不要顯示英文——裝置層級設定，預設顯示（true），
 * 讓使用者可以選擇先只看中文練習說英文，說完再打開核對。 */
function readVocabOverviewShowEnglish(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(VOCAB_OVERVIEW_SHOW_ENGLISH_STORAGE_KEY);
    return raw === null ? true : raw === "1"; // 沒存過就是預設值 true（開）
  } catch {
    return true;
  }
}

function setVocabOverviewShowEnglish(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOCAB_OVERVIEW_SHOW_ENGLISH_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 忽略，跟其餘模組一致的容錯方式
  }
}
```

## `renderVocabOverview()` 加上開關按鈕

`renderVocabOverview()`（第 1770-1779 行）目前是：

```ts
function renderVocabOverview(): void {
  stageHeader(`${currentTopic.label} — 單字總覽`, `共 ${playableVocab.length} 個單字，點星星收藏喜歡的字`);

  const list = document.createElement("div");
  list.className = "vocab-overview-list";
  for (const vocab of playableVocab) {
    list.appendChild(buildVocabOverviewRow(vocab));
  }
  app!.appendChild(list);
}
```

改成：

```ts
function renderVocabOverview(): void {
  stageHeader(`${currentTopic.label} — 單字總覽`, `共 ${playableVocab.length} 個單字，點星星收藏喜歡的字`);

  const showEnglish = readVocabOverviewShowEnglish();

  const toolbar = document.createElement("div");
  toolbar.className = "vocab-overview-toolbar";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  // 沿用「🐢 慢速」開關按鈕現成的樣式（.slow-speech-toggle-btn／.active），
  // 視覺一致，不用另外寫新的 CSS。
  toggleBtn.className = "slow-speech-toggle-btn" + (showEnglish ? " active" : "");
  toggleBtn.setAttribute("aria-pressed", String(showEnglish));
  toggleBtn.textContent = showEnglish ? "👁️ 例句顯示英文" : "🙈 例句隱藏英文";
  toggleBtn.setAttribute("aria-label", "切換例句英文顯示");
  toggleBtn.addEventListener("click", () => {
    setVocabOverviewShowEnglish(!showEnglish);
    render();
  });
  toolbar.appendChild(toggleBtn);

  const hint = document.createElement("p");
  hint.className = "vocab-overview-toolbar-hint";
  hint.textContent = "關掉英文，可以先看中文練習說說看，說完再打開核對正不正確。";
  toolbar.appendChild(hint);

  app!.appendChild(toolbar);

  const list = document.createElement("div");
  list.className = "vocab-overview-list";
  for (const vocab of playableVocab) {
    list.appendChild(buildVocabOverviewRow(vocab, showEnglish));
  }
  app!.appendChild(list);
}
```

## CSS

`toggleBtn` 直接沿用既有的 `.slow-speech-toggle-btn`／`.active` 樣式（`app/src/style.css` 裡搜尋 `slow-speech-toggle-btn` 那組規則），不用新增。只需要新增 `.vocab-overview-toolbar`（讓按鈕跟提示文字之間有點間距，比照頁面其餘區塊的留白習慣）跟 `.vocab-overview-toolbar-hint`（小字、淺灰色，比照 `.about-text` 或 `.progress` 的字級／顏色），手機寬度（640px 斷點）確認一下按鈕跟提示文字排列不會擠壓——這個專案手機版已經修過好幾輪版面 bug，麻煩沿用現有 `.stage-banner-actions` 之類「窄螢幕改上下排列」的既有寫法，不要重新發明。

## 驗證

建議新增 `verify-vocab-overview-english-toggle.ts`，比照 `verify-modal-scroll-lock.ts` 的做法（靜態比對 `main.ts` 原始碼字串，沒有真的瀏覽器可以測互動行為），至少涵蓋：

1. `buildExampleSentenceBlock()` 簽名有 `showEnglish: boolean = true` 參數，且函式內容有 `exampleEn.hidden = !showEnglish`。
2. `buildVocabOverviewRow()` 簽名有 `showEnglish: boolean = true` 參數，且呼叫 `buildExampleSentenceBlock()` 時有傳入 `showEnglish`。
3. `renderFavorites()` 呼叫 `buildVocabOverviewRow(vocab)` 時**沒有**傳第二個參數（確認沒有不小心波及收藏清單）。
4. `readVocabOverviewShowEnglish()`／`setVocabOverviewShowEnglish()` 兩個函式存在，且沒存過值時預設回傳 `true`。
5. `renderVocabOverview()` 裡有呼叫 `buildVocabOverviewRow(vocab, showEnglish)`（確認單字總覽真的把開關狀態傳進去，不是只加了 UI 沒接上邏輯）。

`npm run build` 要過；`npx tsx scripts/verify-vocab-overview-english-toggle.ts`（跟其餘 verify-*.ts）都要通過；建議在 `demo-standalone.html` 實際打開任一主題的「單字總覽」，展開一個單字的例句，切一次開關確認英文真的會被隱藏/顯示、🔊 按鈕仍然可以正常播放發音，且切換後再進「收藏清單」確認例句英文沒有被連帶隱藏。
