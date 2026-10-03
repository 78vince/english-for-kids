# Handoff：設計系統健檢——Design Token 一致性＋手機版擁擠問題修正

## 背景

使用者在手機寬度下看到遊戲室的確認彈窗（「要玩『戳泡泡』嗎？」）覺得「擁擠」，進一步要求「重新檢視全站的設計樣式，並調整 design token 來制定整體視覺以及良好的響應式體驗」，確認範圍是**全面檢視視覺＋響應式（完整設計系統健檢）**，不只是修這一個彈窗。

已經先寫好一份固定參考文件 `docs/design-system.md`，整理了 token 現況、新制定的斷點慣例、已知技術債，這份 handoff 是實際要改的程式碼清單，執行前請先看過 `design-system.md` 了解命名邏輯。

這次健檢範圍**不包含**填字遊戲／翻牌配對兩款遊戲完全沒有手機版樣式的問題——那個牽涉到 TypeScript 動態計算格子尺寸的邏輯，不是單純 CSS 斷點就能解決，已經記錄在 `design-system.md` 第 4 節當作下一輪的獨立工作項目，這次先把範圍內的部分做完。

---

## 1. Token 檔案（`assets/design-tokens/design-tokens.v2-daily-play.css`）新增兩個遺漏的 tint token

目前只有 primary／success／accent-yellow 三色有淡色 tint，橘色跟粉色沒有，之後如果有新功能想用這兩色系的淡底色會卡住。第 35-40 行的 Tint 區塊補兩行：

```css
  --color-primary-tint: #EAF2FB;
  --color-success-tint: #EAFBF1;
  --color-accent-yellow-tint: #FFF8E6;
  --color-accent-orange-tint: #FFF1EB;
  --color-accent-pink-tint: #FFF3FB;
```

（橘色／粉色淡色是用跟既有三個 tint 同樣的手法：原色提亮到接近背景色，不是新發明的配色邏輯，實際色碼可以用設計工具微調，不用拘泥於我給的這兩個色碼，重點是把 token 補齊。）

## 2. `.nav-item`／`.menu-item` 寫死的 px 改成對應的 spacing token（純粹字面替換，視覺效果完全不變）

`app/src/style.css` 第 356-363 行：

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  font-size: var(--text-body);
  font-weight: 700;
  padding: 8px 12px;
  border-radius: var(--nav-item-radius);
```

`gap: 4px` → `gap: var(--space-1);`；`padding: 8px 12px` → `padding: var(--space-2) var(--space-3);`（4px=--space-1、8px=--space-2、12px=--space-3，數值完全對得上，單純是之前寫的時候沒注意要用 token）。

第 414-417 行的壓縮態：

```css
.function-nav--compact .nav-item {
  padding: 8px 10px;
  gap: 0;
}
```

`8px` 一樣換成 `var(--space-2)`；`10px` 這個數字沒有對應的 token，**改成捨入到 `var(--space-2)`（8px）**，不要為了這一個特例新增一個 token（跟 `design-system.md` 第 3 節的原則一致）——視覺上只差 2px，但壓縮態本來就是極窄螢幕才會觸發，差異感知不到，比起新增一個只用一次的 token 更划算。

第 390-393 行的 active 狀態：

```css
.nav-item.active {
  background: var(--nav-item-active-bg);
  color: var(--nav-item-active-color);
}
```

這裡不用改，但 token 檔案裡 `--nav-item-active-color: #FFFFFF`（design-tokens.v2-daily-play.css 第 83 行）建議改成 `--nav-item-active-color: var(--color-surface);`——數值完全一樣（都是純白），只是改成引用既有的中性色 token，避免同一個顏色在檔案裡出現兩種不同的表示方式。

`app/src/style.css` 第 640-645 行：

```css
.menu-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-5);
```

`gap: 4px` → `gap: var(--space-1);`（這個元件其餘地方已經是用 token，只有這個 gap 漏掉）。

## 3. 確認彈窗（`.modal-overlay`／`.modal-card`）手機版縮小留白＋字級——這是使用者實際回報的擁擠問題

`app/src/style.css` 第 1503-1555 行目前完全沒有手機版覆寫，在 `.modal-card-header h3`（第 1542-1547 行）後面、或任何方便的位置，新增一段 `@media (max-width: 640px)` 區塊（比照 `design-system.md` 制定的主斷點 640px）：

```css
@media (max-width: 640px) {
  .modal-overlay {
    padding: var(--space-3); /* 24px → 12px，手機螢幕寸土寸金，遮罩內距不用留這麼多 */
  }

  .modal-card {
    padding: var(--space-4); /* 32px → 16px */
    border-radius: var(--radius-lg); /* 32px 圓角在窄卡片上比例過大，縮小一階 */
  }

  .modal-card-header {
    margin-bottom: var(--space-3); /* 16px → 12px */
  }

  .modal-card-header h3 {
    font-size: var(--text-body-lg); /* 28px → 23px，標題跟內文字級差距在窄螢幕上太突兀 */
  }

  .modal-close-btn {
    width: 44px; /* 36px → 44px，符合 44px 最小點擊熱區建議（design-system.md 第 3 節） */
    height: 44px;
  }

  .modal-text {
    font-size: var(--text-caption); /* 21px → 17px，手機版內文縮一階，跟標題縮小的比例一致 */
  }
}
```

這段改完之後，截圖裡「要玩『戳泡泡』嗎？會花 5 個遊戲代幣，確定要開始嗎？」那個彈窗在手機寬度下：外圍遮罩留白減半、卡片本身內距減半、標題跟內文字級各降一階、關閉按鈕變大更好點——整體視覺比例會比桌面版「縮小」而不是「桌面版照搬到窄螢幕」。這組規則是通用的（`.modal-overlay`／`.modal-card` 是所有彈窗共用的外殼類別），所以首次進站提醒、頭像選擇、改名字等其他用到同一組外殼的彈窗也會一併受惠，不用每個彈窗各自處理。

**注意**：`.modal-card--wide`（第 1527-1529 行，頭像選擇用的寬版）的 `max-width: 640px` 在手機寬度下本來就會被 `.modal-card` 的 `width: 100%` 蓋過變成滿版，不受這次新增的 `padding`/`font-size` 覆寫影響範圍以外的規則，不用額外處理。

## 4. `.topic-card`／`.menu-item` 手機版字級／內距微調

這兩個元件目前靠 CSS grid 的 `auto-fit` 自動決定欄數（`design-system.md` 第 4 節提到這是刻意的設計，欄數部分不用改），但卡片本身的內距跟字級在手機單欄版面下沒有縮小過。`app/src/style.css` 第 784-796 行（`.topic-card`）附近，新增（或併入上面第 3 點新增的同一個 `@media (max-width: 640px)` 區塊）：

```css
@media (max-width: 640px) {
  .topic-card {
    padding: var(--space-4); /* 24px → 16px */
  }

  .menu-item {
    padding: var(--space-4); /* 24px → 16px */
  }
}
```

（這兩個元件原本的字級 `--text-body-lg`／`--text-caption` 本身不算太大，先只調整內距；如果改完之後實機看起來還是覺得字偏大，再回報，不要先一次把字級也降一階——避免過度調整。）

## 5. 驗證

- `npm run build` 要過。
- 既有 `verify-*.ts` 全部重跑一次（這次改動純粹是 CSS，理論上不會讓任何邏輯驗證腳本失敗，但照慣例還是全部跑一次）。
- 建議新增一支輕量的 `verify-design-token-usage.ts`，用簡單的字串比對確認 `.nav-item`／`.menu-item` 的 CSS 規則裡沒有殘留 `8px 12px`／`gap: 4px` 這類應該已經換成 token 的寫死數值（純粹文字層級的 grep 式檢查，不用真的解析 CSS），避免以後又有人手滑寫回寫死的 px。
- 手動測試（`demo-standalone.html` 或 `npm run dev`，瀏覽器切成手機寬度模擬，例如 375px）：
  - 遊戲室點「戳泡泡」或「填字遊戲」，確認確認彈窗內距跟字級有縮小、關閉按鈕變大、整體不再「擠成一團」。
  - 首次進站提醒彈窗、個人檔案「改名字」「換頭像」彈窗，確認手機版同樣有縮小（因為共用同一組 `.modal-overlay`／`.modal-card` class）。
  - 首頁主題卡片、題型選單卡片，確認手機單欄版面下內距有縮小，不是桌面版原封不動縮小整個瀏覽器視窗的感覺。
  - 桌面寬度（> 640px）畫面要完全不變，這次所有改動都包在 `@media (max-width: 640px)` 裡面，理論上不會影響桌面版。

## 6. 這次刻意不處理的部分（已記錄進 `docs/design-system.md`，下一輪再處理）

- 填字遊戲／翻牌配對兩款遊戲完全沒有手機版 CSS——牽涉 TypeScript 動態格子尺寸計算，需要跟遊戲邏輯一起看，不是這次範圍。
- `style.css` 衍生色（success/error 文字色與底色、hover 色）集中到 token 檔案本身、`crosswordStandalone.css`／`memoryMatchStandalone.css` 複製貼上的重複值——牽涉三個檔案同時改，風險較高，這次不動。
- 填字遊戲／戳泡泡的粉色系主題色改用 `color-mix()` 跟來源色綁定，而不是手動目測調色——這個是「做了更好、不做也不影響功能」的技術債，優先度較低。
- `--nav-height` 疑似未使用 token 的清理。

這幾項不是「漏掉」，是刻意排除在這次範圍外，避免一次改動牽涉太多檔案、風險難以控制——下一輪可以挑其中一項（建議優先做「兩款遊戲的手機版 CSS」，因為互動性內容在手機上壞掉的使用者影響比純粹視覺擁擠更嚴重）再開一次健檢。
