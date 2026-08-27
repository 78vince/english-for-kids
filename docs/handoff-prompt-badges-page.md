# 任務：改版「成就徽章」頁面

## 背景與重要發現（請先看完再動工）

我剛檢查過現有實作，發現一件事必須先講清楚：**目前 `app/src/main.ts` 裡的成就徽章頁面（`buildBadgeCategories()` / `renderBadgeCard()` / `renderBadges()`，約在 1644-1871 行），用的是另一套獨立設計的徽章邏輯**（4 大類「學習里程碑／精準度／主題征服／每日習慣」× 銅銀金 3 階＝12 個徽章，門檻用 progress 資料動態算出來），**跟我們已經定案、存在 `content/badges/badges.json` 的正式徽章清單（43 個徽章、10 大分類、有徽章代號如 VM-01）完全是兩套不同的東西**。

這次改版**不是只換版面**，請把徽章資料來源整個換成 `content/badges/badges.json`，不要只是把現有的 12 個假徽章套上新樣式。舊有的 `computeAchievementAggregates()` 裡面算出來的一些聚合值（累計單字量、累計題數、最佳正確率、主題全通關數、連續天數）可以參考重用，但要延伸出能對應 43 個新徽章條件的判斷邏輯（見下方「這次要順便解決的資料缺口」）。

## 相關檔案

- `content/badges/badges.json` — 43 個徽章的正式資料，每筆含 `code`／`id`／`name`／`description`／`condition`／`category`／`type`（one_time／repeatable）／`reset_on_achieve`／`display_count`／`tier_group`／`tier_level`／`threshold`／`icon_placeholder`／`status`
- `content/schema/badge.schema.json` — 上述資料的結構定義
- `docs/achievement-badges.md` — 人類可讀版本，含徽章代號命名規則（`<2碼分類字母>-<流水號2碼>`，例如 `VM-01`）與 10 大分類說明
- `app/src/main.ts`（1644-1871 行）— 現有徽章頁面實作，這次要改版／替換的地方
- `app/src/style.css`（987-1120 行，`.badge-card` 相關樣式）— 現有徽章樣式，這次要改版的地方
- `app/src/progress.ts` — 現有使用者進度資料模型，判斷徽章達成與否要以此為基礎擴充
- `assets/design-tokens/design-tokens.css` — 既有設計 token，已經有 `--radius-circle: 50%` 可以直接拿來做圓形遮罩，配色也請優先從這裡挑，不要另外發明新色碼

## 版面規格（我指定的，請照做）

1. 個別徽章排版採**上下排列**：徽章圖案在上、說明文在下。
2. 徽章圖案尺寸統一為 **240 x 240px**。
3. 徽章是圖片檔，並以**圓形框架做遮罩**（`design-tokens.css` 已有 `--radius-circle: 50%`，直接套用在圖片容器上即可）。
4. 圖片還在製作中，**暫時用藍色底色替代**（請從 `design-tokens.css` 挑一個既有藍色 token，例如 `--color-primary-500` 或 `--color-secondary-500`，不要自己發明新色碼），並在程式碼加註解標明「TODO：待美術圖檔完成後替換」。
5. **已取得的成就**：徽章圖案透明度 100%。
6. **尚未取得的成就**：徽章圖案透明度 24%。

## 我補充的建議（請評估後跟我確認，不要自己直接定案）

1. **佔位圖裡放代號**：藍色佔位圓圈裡建議顯示徽章代號文字（如 `VM-01`），方便工程/測試階段一眼辨識是哪個徽章；正式美術圖完成後直接把底色替換成圖片，版面結構不用動。
2. **累積次數徽章要多一行「已達成 N 次」**：`badges.json` 裡 `type: "repeatable"` 的徽章（`display_count: true`）除了說明文，畫面上還要在下方多顯示一行累計達成次數，這是資料模型本來就要求的，原始規格沒特別提到但不能漏掉。
3. **未取得徽章加一圈淡邊框**：24% 透明度可能淡到看不出圖案的圓形邊界，建議在圓形容器加一圈用 `--color-border` 的細邊框，確保使用者一眼就能認出「這裡有一個徽章位置」，而不是覺得畫面壞掉。
4. **分類分組顯示**：`badges.json` 有 10 個 `category`，建議沿用現有 `renderBadges()` 已經有的「分類分組＋標題」呈現模式，只是從 4 類改成新的 10 類，同分類內依 `code` 順序排列（多數分類已經有 `tier_level`，等級感會自然呈現出來）。
5. **RWD**：徽章格線建議用 `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))` 這類自動換行寫法，讓手機上自動變成較少欄，不用另外寫 media query 手動控制欄數。
6. **無障礙**：圖片（含佔位圖）都要有 `alt` 文字，用徽章的 `name` + `description` 組成即可。

## 這次要順便解決的資料缺口

目前 `progress.ts` 沒有「使用者目前解鎖了哪些徽章 ID、repeatable 徽章各自累計達成幾次」這件事的儲存方式。這次改版請規劃一個做法（例如在既有進度資料裡加一個 `unlockedBadges: { [badgeId]: count }` 之類的結構），**先跟我確認做法再動手**，不要直接大改現有 `progress.ts` 的資料結構——這個專案目前的存檔方式（本機 localStorage 還是其他）我們之前討論過還沒完全定案，麻煩改動前跟我對一下現況。

## 範圍界線

- 這次只處理成就徽章頁面本身（資料串接＋版面改版），不要順便去動配對/排序/填空/選擇等遊戲題型的邏輯。
- 口說相關徽章（如果之後 Phase 4 要加）目前 `badges.json` 沒有，不用預先設計，屆時再依同一套 schema 擴充分類即可。
