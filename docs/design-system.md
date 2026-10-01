# 設計系統參考文件

> 2026-10-01 新增。專案目前沒有統一的設計系統說明文件——token 本身定義在 `assets/design-tokens/design-tokens.v2-daily-play.css`，但斷點慣例、衍生色邏輯、各元件該怎麼用 token 都只散落在 CSS 註解裡，容易新增元件時各做各的（已發生過好幾次：功能列斷點 bug、填字/翻牌配對兩款遊戲完全沒有手機版樣式、`.nav-item` 的間距用寫死 px 而不是 token）。這份文件把現況整理成一份固定參考，之後新增元件/新遊戲請先看這份文件，不要重新發明一套間距/斷點邏輯。

## 1. Token 檔案在哪裡

- `assets/design-tokens/design-tokens.v2-daily-play.css`——唯一的 token 來源，顏色／字級／間距／圓角／陰影／功能列／徽章分級色都在這裡。`app/src/style.css` 跟三款遊戲各自的 Standalone CSS（`crosswordStandalone.css`／`bubblePopStandalone.css`／`memoryMatchStandalone.css`）都是用 `@import` 讀這同一份檔案，共用同一套基礎色彩／字級／圓角／陰影，這點做得正確，之後新增遊戲／新頁面也要延續「`@import` 同一份 token 檔案」這個做法，不要各自重寫一份顏色變數。
- `app/src/style.css` 自己的 `:root` 區塊（約第 14-23 行）額外放了幾個「衍生色」（`--color-success-text`／`--color-success-bg`／`--color-error-text`／`--color-error-bg`／`--color-primary-700-hover`／`--color-reward-hover`），這些是手動算出來的深/淺色版本，**目前還沒搬進 token 檔案本身**，而且 `crosswordStandalone.css`／`memoryMatchStandalone.css` 又各自複製了一份（詳見第 5 節，這是已知要處理的技術債）。

## 2. 斷點慣例（這次新制定，之前是各元件各自選數字）

現況是 5 種斷點混用（420／480／640／768／899-900px），沒有統一邏輯。**新的慣例，之後新元件請直接套用，不要再發明新的數字**：

| 名稱 | 寬度 | 用途 |
|---|---|---|
| `desktop`（預設，不用 media query） | > 640px | 桌面／平板，絕大多數版面的預設狀態 |
| `mobile`（主要手機斷點） | `max-width: 640px` | 最常用的斷點，橫向排列改堆疊、按鈕改滿版寬——全站 19 個 `@media` 裡有 14 個已經是這個值，維持現狀當作主斷點 |
| `mobile-compact`（極窄手機/資訊密集的格狀版面才需要） | `max-width: 400px` | 只有像「個人檔案統計格狀排列」這種窄到連單欄都要再簡化的狀況才需要，大部分元件不需要這一層。原本有兩個地方各自用 420px／480px，之後新增同類需求一律用 400px，不要再選其他數字 |

舊的 `899px`／`900px`（Voice Lab 雙欄版面用的「平板/桌面」門檻）維持不變——這個不是「手機響應式」斷點，是「要不要排成兩欄」的獨立判斷，跟上面這套手機斷點慣例是兩回事，不用合併。

**CSS 自訂屬性（`var(--xxx)`）沒辦法用在 `@media` 的條件判斷式裡**（這是 CSS 語言本身的限制，不是這個專案的技術選型問題），所以斷點沒辦法做成真正的 token 變數、每個 `@media` 規則還是得寫死數字——這份文件本身就是「斷點 token」的替代品，請直接照這份文件的數字寫，不要自己選一個新的。

## 3. 元件間距/字級使用原則

- 任何 padding／gap／margin，先檢查 `--space-1` ~ `--space-8`（4/8/12/16/24/32/48/64px）裡有沒有符合的值，有就一定要用 token，不要寫死 px——即使數字剛好跟某個 token 相等也一樣（`.nav-item` 目前的 `padding: 8px 12px` 就是這個反例，之後會修正成 `var(--space-2) var(--space-3)`）。
- 如果真的需要一個 token 沒有的中間值（例如 10px），優先考慮「捨入到最接近的既有 token」而不是新增一個一次性 token——除非這個新數值會在好幾個地方重複用到，才值得真的加進 token 檔案。
- 任何可點擊的按鈕/圖示，**最小點擊熱區建議 44×44px**（WCAG 建議的手機點擊熱區下限，這個專案是兒童向應用，手指不夠精準，更需要遵守）。目前 `.modal-close-btn`（36px）跟 `.function-nav--compact .nav-item`（壓縮後的圖示熱區）都低於這個標準，列入後續修正項目（見 handoff）。

## 4. 手機版響應式現況盤點（2026-10-01 健檢結果）

已經有手機版覆寫的元件：`.stage-banner`／`.brand-banner--user`／`.profile-login-btn`／`.profile-card`／`.game-room-card`／`.voice-settings-row`／`.profile-stats-grid`／字卡三個橫向排列區塊／`.stats-summary`／`.stats-stage-row`／Voice Lab 雙欄版面／戳泡泡遊戲（唯一有手機斷點的遊戲）。

**目前完全沒有手機版覆寫、已知需要處理的元件**：

- `.modal-overlay`／`.modal-card`（含確認彈窗、首次進站提醒等共用這組外殼的彈窗）——使用者截圖回報過擁擠，是這次健檢的起點，已經寫成 handoff（見 `docs/handoff-prompt-design-system-health-check.md`）。
- `.menu-item`（題型選單卡片）、`.topic-card`（雖然用 `auto-fit` grid 不需要斷點切欄數，但內距/字級在單欄窄版面下沒有跟著縮小）。
- 填字遊戲（`crosswordStandalone.css`）、翻牌配對（`memoryMatchStandalone.css`）兩款遊戲——目前完全沒有任何 `@media` 規則，是目前責任範圍內最大的缺口（遊戲本身是可拖曳/可點擊的互動內容，手機版沒有適配風險比純版面擁擠更高）。這兩款遊戲的格子尺寸是由 TypeScript 動態計算（`fitGridToViewport()` 之類的邏輯），不是單純加一段 CSS `@media` 就能解決，需要額外跟遊戲邏輯一起看，列為下一輪的獨立工作項目，這次不處理。

## 5. 已知技術債（這次健檢發現，暫不處理，記錄起來避免之後重複發現同一個問題）

- `style.css` 自己 `:root` 裡的 6 個衍生色（成功/錯誤的文字色與底色、hover 色）應該搬進 token 檔案本身集中管理，`crosswordStandalone.css`／`memoryMatchStandalone.css` 目前用「手動複製貼上」的方式各自保留一份同樣的值，檔案裡也自己寫註解提醒「以後 style.css 那邊改了要記得同步」——這是個維護風險，但牽涉三個檔案同時改，這次先不動，列入下一輪。
- 填字遊戲、戳泡泡遊戲的粉色系主題色（`--color-crossword-pink-*`／`--color-bubble-pink-*`）是從 `--color-accent-pink` 手動目測調出來的深淺變化，沒有用 `color-mix()` 這類語法跟來源色綁定，如果以後 `--color-accent-pink` 改色，這些衍生色不會自動更新，也沒人會記得要手動重新調——同樣列入下一輪，不在這次健檢範圍內處理。
- `--nav-height: 64px` 這個 token 目前似乎沒有實際被任何 CSS 規則引用（`.function-nav` 沒有設定 `height`），之後清理時可以確認是否為多餘的 token。
- `--color-primary-tint`／`--color-success-tint`／`--color-accent-yellow-tint` 目前只涵蓋 3 種主色，橘色／粉色沒有對應的淡色 tint token，如果之後有新的卡片分級功能想用橘色/粉色系的淡底色，會發現沒有現成 token 可用。
