# Handoff：風格改版 v4——拿掉「衍生色」，文字/邊框直接用基礎色票，hover 改用 color-mix() 公式即時計算

## 背景

使用者看過 `docs/design-tokens.html` 後指出：第 2b 節列的 6 個「衍生色」（`success-text`／`success-bg`／`error-text`／`error-bg`／`primary-700-hover`／`reward-hover`）是沒有依據、另外手動挑出來的色碼，不在正式的色票系統（`design-tokens.v2-daily-play.css`）裡，新方案**全部不採用**。改成兩條規則：

1. 文字／邊框需要語意色（答對、答錯、警示...）→ **直接用基礎色票**（`--color-success`／`--color-error`），不再另外算一組更深的版本。
2. 背景需要淡底色 → **直接用 `-tint` 淡底色票**（`--color-success-tint` 已存在；`--color-error-tint` 這次新增，沿用跟其他 tint 一樣的淡化比例）。
3. 按鈕 hover 需要「同一個顏色再深一點」→ 不存成新 token，改用 CSS `color-mix()` 公式（基礎色混 15% 黑）在 CSS 規則裡當場算出來。

完整的色票規格跟取捨說明見 `docs/design-tokens.html` 第 2／2b 節。這份 handoff 列出實際要改的程式碼。

**執行順序建議**：這份 v4 可以和 v2／v3 一起做（互不衝突，都是各自獨立的 CSS 區塊），但如果要分批做，建議排在 v2（主色／強調色改版）之後，因為 v4 的 `color-mix()` 公式會引用 v2 定案的 `--color-primary-700`。

## 1. 新增 `--color-error-tint` token（`assets/design-tokens/design-tokens.v2-daily-play.css`）

第 38-42 行 Tint 區塊，跟其餘 tint 放在一起，新增一行：

```css
  --color-primary-tint: #EAF2FB;
  --color-success-tint: #EAFBF1;
  --color-error-tint: #FFEDEC;        /* 新增：答錯／警示狀態淡底色，取代原本 style.css 自己算的 --color-error-bg */
  --color-accent-yellow-tint: #FFF8E6;
  --color-accent-orange-tint: #FFF1EB;
  --color-accent-pink-tint: #FFF3FB;
```

## 2. `app/src/style.css` 刪除衍生色 `:root` 區塊

第 15-21 行整段刪除：

```css
/* 刪除這整段： */
:root {
  --color-success-text: #2f8f5e;
  --color-success-bg: #e6f7ee;
  --color-error-text: #c2453f;
  --color-error-bg: #ffe9e7;
  --color-primary-700-hover: #003b78;
  --color-reward-hover: #e8703f;
  ...
}
```

（`:root { color-scheme: light; }` 這行本身保留，只刪除上面 6 行衍生色宣告。）

## 3. 全站取代：`-text`／`-bg` 改成基礎色／tint

找到以下所有用到這 4 個 token 的地方（`app/src/style.css` 裡，不含已經在 `handoff-prompt-style-refresh-v3.md` 第 5.3 節規劃要整批刪除的 `.thumb-emotions`／`.thumb-occupations`／`.thumb-health` 這三個主題縮圖背景規則——那三個會直接被刪掉，不用在這裡處理），直接做字串取代：

```
var(--color-success-text)  →  var(--color-success)
var(--color-success-bg)    →  var(--color-success-tint)
var(--color-error-text)    →  var(--color-error)
var(--color-error-bg)      →  var(--color-error-tint)
```

可以用這個指令先確認目前全部的使用點（取代前執行一次確認清單、取代後再跑一次應該變成 0 筆）：

```bash
grep -n 'color-success-text\|color-success-bg\|color-error-text\|color-error-bg' app/src/style.css
```

目前（取代前）清單如下，供對照：

| 行號 | 規則 | 說明 |
|---|---|---|
| 399 | `.nav-item--logout` | 登出文字顏色 |
| 450 | `.nav-item--logout:hover` | 登出 hover 淡底 |
| 1058 | `.secondary-btn.danger-btn:hover` | 危險按鈕 hover 淡底 |
| 1578 | `.modal-close-btn:hover` | 彈窗關閉鈕 hover 文字色 |
| 1709-1711 | `.card--correct` | 字卡答對狀態 |
| 1716-1718 | `.card--wrong` | 字卡答錯狀態 |
| 1795 | `.error` | 通用錯誤文字 class |
| 1814/1816 | `.answer-area--correct` | 填空題答對狀態 |
| 1820/1822 | `.answer-area--wrong` | 填空題答錯狀態 |
| 1854-1856 | `.token--correct-pos` | 重組句型答對 token |
| 1860-1862 | `.token--wrong-pos` | 重組句型答錯 token |
| 1883 | `.hint--correct` | 提示文字答對色 |
| 1887 | `.hint--wrong` | 提示文字答錯色 |
| 1916-1918 | `.option--correct` | 選擇題答對選項 |
| 1923-1925 | `.option--wrong` | 選擇題答錯選項 |
| 3490/3491 | `.conversation-option-btn--wrong` | Stage E 對話選項答錯 |
| 3504 | `.conversation-option-btn--wrong .conversation-option-en` | 同上，英文文字色 |
| 3509/3510 | `.conversation-option-btn--correct` | Stage E 對話選項答對 |
| 3515 | `.conversation-option-btn--correct .conversation-option-en` | 同上，英文文字色 |

這 19 處都是同樣的機械式取代（4 個 token 名稱互換），不涉及版面或邏輯改動，直接用編輯器的「全部取代」執行即可，不用一條一條手動改。

**取捨提醒**：`--color-success`（#7EDBA0）／`--color-error`（#FF7A7A）本身是粉彩色調，比原本手動加深過的 `-text` 版本（#2f8f5e／#c2453f）對比度略低。這是使用者這次明確要求的方向（不要額外的衍生深色），已經在 `docs/design-tokens.html` 第 2b 節誠實記錄這個取捨。如果之後實機看起來答對/答錯文字在白底上不夠清楚，請回報，屆時再討論是否要用別的方式處理對比（例如加粗字重、調整背景深淺），而不是重新引入衍生色。

## 4. 按鈕 hover 改用 `color-mix()` 公式

第 1758-1760 行：

```css
.primary-btn:hover {
  background: color-mix(in srgb, var(--color-primary-700) 85%, black 15%);  /* 原 var(--color-primary-700-hover) */
}
```

第 1768-1770 行：

```css
.primary-btn--reward:hover {
  background: color-mix(in srgb, var(--color-accent-orange) 85%, black 15%);  /* 原 var(--color-reward-hover) */
}
```

`color-mix()` 現代瀏覽器（Chrome/Edge 111+、Safari 16.2+、Firefox 113+）都支援，這個專案目前鎖定的目標瀏覽器沒有更舊的相容性需求，可以直接用。

## 5. 兩款遊戲各自複製的一份 `--color-primary-700-hover` 也要處理

`app/src/games/crosswordStandalone.css`／`memoryMatchStandalone.css` 之前因為 iframe 架構沒辦法共用主站 `style.css`，各自複製了一份 `--color-primary-700-hover`（`docs/design-system.md` 第 5 節列的既有技術債）。盤點後發現：

- `crosswordStandalone.css` 第 9 行定義了這個 token，但**完全沒有地方使用它**——第 107-109 行 `.primary-btn:hover` 實際上是用填字遊戲自己的粉色系 `--color-crossword-pink-700`，不是這個 token。這是死碼，第 9 行那行宣告直接刪除即可。
- `memoryMatchStandalone.css` 第 13 行定義、第 82 行有使用，但翻牌配對遊戲已經在本輪改版稍早被從 `content/games/games.json` 移除（見 HANDOFF 9.150），這個檔案目前應該已經沒有實際入口可以玩到——維持現狀即可，不用特別處理，等之後清理翻牌配對殘留程式碼時（`docs/handoff-prompt-gameroom-icon-and-memory-match-removal.md` 已經記錄這個待辦）一併刪除整個檔案就好，不用現在單獨為了這一行去改一個本來就要整份刪除的檔案。

## 6. 驗證

- `npm run build` 要過。
- 全部既有 `verify-*.ts` 重跑一次。
- 手動測試：
  - 答對／答錯相關畫面（字卡、填空題、重組句型、選擇題、Stage E 對話選項）顏色正常顯示，文字在淡底色背景上還看得清楚。
  - 登出按鈕、危險按鈕（刪除使用者等）文字／hover 顏色正常。
  - 主要按鈕／獎勵按鈕滑鼠移過去時背景確實變深（用瀏覽器開發工具確認算出來的顏色，不用追求跟舊版色碼完全一致，只要「看起來變深」即可）。
  - `grep -rn 'color-success-text\|color-success-bg\|color-error-text\|color-error-bg\|primary-700-hover\|reward-hover' app/src/` 確認整個 `app/src/` 目錄（含兩個遊戲 Standalone CSS）都沒有殘留這 6 個舊 token 名稱。
