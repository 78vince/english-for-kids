# Handoff：風格改版 v5——答對/答錯色對比度補救（色弱可及性）＋慢速發音按鈕導致單字總覽展開狀態被收合的 bug

## 背景

v4 上線後使用者實測回報兩個問題，加上一個行為確認：

1. 答對／答錯文字（例如選擇題選到正確答案時的綠色文字）對比度不夠，對色弱使用者可能看不清楚——這是 v4 把 `success`／`error` 基礎色直接當文字色用造成的，基礎色本身是粉彩色調，對比度不夠。
2. 單字總覽頁面點擊「慢速」按鈕後，畫面會整個重繪，導致使用者原本展開的例句全部被收合——這是一個真的 bug，不是設計取捨。
3. 遊戲室星星評等「玩得比之前差會不會覆蓋舊紀錄」——已確認這是 `getBestStars()`/`recordStars()` 本來就有的「只記錄最佳成績」設計邏輯（`gameHighScores.ts` 第 46-47 行 `if (clamped <= current) return;`），使用者確認要維持這個設計，**這項不用改**，純粹記錄確認結果。

修正方案（已跟使用者確認）：答對/答錯色比照主色 `primary-700/500/100` 的分級邏輯，新增 `success-700`／`error-700` 兩個正式收錄進色票系統的文字/邊框用色階，不是重新引入 v3 之前那種私下存放、沒有依據的「衍生色」。完整色票規格跟對比度數據見 `docs/design-tokens.html` 第 2／2b 節。

## 1. 新增 `--color-success-700`／`--color-error-700`（`assets/design-tokens/design-tokens.v2-daily-play.css`）

第 13-17 行 Color/Brand 區塊可以看到 `primary-700`／`primary-500`／`primary-100` 這種分級寫法，success/error 這次比照辦理，在第 24-26 行 Feedback 色彩區塊新增：

```css
  /* ---------- Color / Feedback（新增 -700 文字/邊框專用分級，解決色弱可及性問題） ---------- */
  --color-success: #7EDBA0;       /* 不變，裝飾性填色專用（進度條、色條），不可當文字/邊框色 */
  --color-success-700: #237A4F;   /* 新增：答對狀態文字/邊框色，對白底 5.3:1、對 success-tint 4.9:1，通過 WCAG AA */
  --color-error: #FF7A7A;         /* 不變，裝飾性填色專用 */
  --color-error-700: #C13D37;     /* 新增：答錯狀態文字/邊框色，對白底 5.3:1、對 error-tint 4.7:1，通過 WCAG AA */
```

對比度數字是用標準 WCAG 相對亮度公式算出來的（不是目測），4.5:1 是 WCAG AA 一般文字的最低要求，這兩個新色都有留一點安全餘裕，不是卡在剛好及格的邊緣。

## 2. 全站文字／邊框從基礎色改成 `-700`（`app/src/style.css`）

**原則**：凡是「文字顏色」或「跟文字搭配、框住文字內容」的邊框，一律改用 `-700`；單純的裝飾性填色（進度條、卡片左側色條，旁邊沒有依附文字）維持用基礎色不變，不用改。

### 2.1 要改成 `-700` 的規則（文字／答對答錯邊框，共 19 處）

```
var(--color-success) → var(--color-success-700)
var(--color-error)   → var(--color-error-700)
```

適用的規則清單：

| 行號（約） | 規則 |
|---|---|
| 395 | `.nav-item--logout` color |
| 681 | `.menu-item--good .menu-item-progress` color |
| 846-847 | `.secondary-btn.danger-btn` border-color／color |
| 852 | `.secondary-btn.danger-btn:hover` border-color |
| 1390-1391 | `.modal-close-btn:hover` border-color／color |
| 1522-1524 | `.card--correct` border-color／color（background 維持 `success-tint` 不變） |
| 1529-1531 | `.card--wrong` border-color／color（background 維持 `error-tint` 不變） |
| 1623 | `.error` color |
| 1642-1643 | `.answer-area--correct` border-color |
| 1648-1649 | `.answer-area--wrong` border-color |
| 1682-1684 | `.token--correct-pos` border-color／color |
| 1688-1690 | `.token--wrong-pos` border-color／color |
| 1711 | `.hint--correct` color |
| 1715 | `.hint--wrong` color |
| 1744-1746 | `.option--correct` border-color／color（答對選項，就是螢幕截圖裡「對比度不夠」那顆） |
| 1751-1753 | `.option--wrong` border-color／color |
| 3318 | `.conversation-option-btn--wrong` border-color |
| 3332 | `.conversation-option-btn--wrong .conversation-option-en` color |
| 3337 | `.conversation-option-btn--correct` border-color |
| 3342-3343 | `.conversation-option-btn--correct .conversation-option-en` color |

可以用這個指令在取代前後各跑一次，確認改動範圍跟這份清單一致（取代後第一個指令應該變成 0 筆，但純裝飾性的 `background:`／`border-left:` 那幾處會在第二個指令裡繼續出現，那些是刻意保留的，不是漏改）：

```bash
grep -n "border-color: var(--color-success)\|border-color: var(--color-error)\|color: var(--color-success)\|color: var(--color-error)" app/src/style.css
```

### 2.2 刻意不改的規則（裝飾性填色，維持用基礎色）

這幾處是進度條／色條這類純裝飾用途，旁邊沒有直接依附的文字內容，基礎色的飽和度/明度在這裡沒有可及性問題，維持不動：

- `.menu-item--good`／`.menu-item--good:hover`（左側色條＋背景）
- `.topic-progress-fill`（主題卡進度條填色）
- `.stats-topic-card--good`／`.stats-stage-row--good`（左側色條）
- `.stats-bar-fill`／`.stats-bar-fill--good`（統計長條圖填色）

## 3. 修正「慢速」按鈕導致單字總覽展開例句被收合的 bug

`app/src/main.ts` 的 `stageHeader()`（約第 895-926 行）是所有題型畫面共用的題型橫幅，裡面的「慢速」切換按鈕目前是：

```ts
slowToggleBtn.addEventListener("click", () => {
  setSlowSpeechEnabled(!isSlowSpeechEnabled());
  render(); // 重新渲染目前畫面，讓按鈕文字／active 樣式立刻反映新狀態
});
```

`render()` 會把目前畫面整個重新建構一次 DOM，單字總覽頁面裡「例句 ▾」展開面板的開關狀態（`examplePanel.hidden`）純粹是本地 DOM 屬性、沒有存到任何模組變數裡，整頁重繪就會全部變回收合狀態——這正是使用者回報的現象。

`renderVocabOverview()` 裡的「練習模式」主開關（約第 1925-1931 行）其實已經示範過正確做法：只切換按鈕/容器自己的 class，不呼叫 `render()`。慢速按鈕這次比照辦理：

```ts
slowToggleBtn.addEventListener("click", () => {
  const next = !isSlowSpeechEnabled();
  setSlowSpeechEnabled(next);
  // 不再呼叫 render()：慢速設定只影響這顆按鈕自己的外觀（下次播放語音時才會
  // 讀取這個設定），直接更新按鈕本身的 class／文字／aria 即可，比照
  // renderVocabOverview() 的「練習模式」主開關同一套做法，避免整頁重繪把單字
  // 總覽已經展開的例句、捲動位置全部重置。
  slowToggleBtn.classList.toggle("active", next);
  slowToggleBtn.setAttribute("aria-pressed", String(next));
  slowToggleBtn.innerHTML = `${TURTLE_ICON(18)}<span>${next ? "慢速中" : "慢速"}</span>`;
});
```

因為 `stageHeader()` 是全站共用的函式，這個修正會讓所有題型畫面的「慢速」按鈕都受惠，不只是單字總覽——其餘畫面本來就沒有需要保留的本地展開狀態，改成不呼叫 `render()` 對它們沒有任何負面影響，純粹是修掉一個不必要的重繪。

## 4. 不需要改動的部分：遊戲室星星「最佳成績制」

`app/src/gameHighScores.ts` 的 `recordStars()`（第 44-53 行）`if (clamped <= current) return;` 這段邏輯本來就是「只記錄最佳成績，玩得更差不會覆蓋」的設計，已經跟使用者確認要維持，**這部分不用改任何程式碼**，這裡寫出來純粹是這次 handoff 的完整記錄。

## 5. 驗證

- `npm run build` 要過。
- 全部既有 `verify-*.ts` 重跑一次。
- 手動測試：
  - 選擇題、填空題、重組句型、字卡、Stage E 對話選項，答對/答錯時文字顏色明顯比之前深，在白底跟淡底色背景上都看得清楚（可以用瀏覽器開發工具或線上對比度檢查工具確認 ≥4.5:1）。
  - 主題卡進度條、題型選單左側色條等裝飾性填色維持原本的淺色不變（這次刻意不改）。
  - 單字總覽頁面：展開幾則例句後點擊「慢速」按鈕，確認已展開的例句維持展開狀態、捲動位置不跳動，按鈕文字／樣式正常在「慢速」「慢速中」之間切換。
  - 任一題型畫面點「慢速」按鈕，確認功能正常（語音播放速度確實改變），沒有因為拿掉 `render()` 而失效。
