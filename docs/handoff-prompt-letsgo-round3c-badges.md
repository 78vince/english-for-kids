# Handoff：第三輪-C 規則式徽章（範本展開＋新分類）

*撰寫：2026-10-04（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜規劃見原專案 `docs/plan-letsgo-round3-games-story-badges.md` §3*
*只改新專案；不要動原專案。與 3-A（遊戲室）、3-B（會話）互相獨立，但「遊戲室」「會話」類徽章要靠它們提供的事件；先看新專案 `HANDOFF.md` 那兩項是否已完成（見 §4）。*

## 1. 內容端已備妥

- `content/badges/badges.v2.json`（共 52 筆）：36 筆沿用舊徽章（登入、單字量、題數、題型新手／大師、連續天數、累計天數、完美關卡、連勝、收藏、健康習慣、單字量里程碑；內容不變）＋ 16 筆新增：
  - **3 筆範本**（帶 `generate`，`id`／`name`／`description`／`condition` 內含 `{L}`＝Level 數字、`{N}`＝Unit 數字，`code` 為 `null`）：
    - `badge.unit_completion.l{L}u{N}`（`per_unit`）：完成 Level {L} - Unit {N}。**展開後的 id 與舊的 `badge.unit_completion.l4u1` 完全相同**，既有使用者的解鎖紀錄不受影響。
    - `badge.unit_mastery.l{L}u{N}`（`per_unit`）：Unit 三星精熟（該 Unit 所有計星 Stage 皆 3 星）。
    - `badge.level_completion.l{L}`（`per_level`）：完成 Level {L}（該 Level `planned_units` 全部 Unit 的完成徽章皆已取得）。
  - **13 筆固定新徽章**：`unit_milestone`（UM-01~03，單元探險家 3／5、單元大滿貫）、`conversation`（CV-01~03，故事初體驗／故事達人／說書高手）、`game_mastery` 新增 GM-09／GM-10（會話新手／大師）、`game_room`（GR-01~05，填字／戳泡泡各 1 次與 10 次、遊戲室玩家）。
- 舊的 8 筆逐 Unit 寫死的 `badge.unit_completion.l4u1~l4u8`（WC-01~08）已從 v2 移除（由範本取代）。
- 徽章圖案由使用者另外生成（清單與提示詞見原專案 `docs/image-prompt-letsgo-badges.md`），檔名規則：單元完成 `UC-{N}.jpg`（Unit 1–8，**所有 Level 共用**）、單元三星 `UT.jpg`（共用）、Level 完成 `LC-{L}.jpg`、固定徽章用其 `code`（如 `UM-01.jpg`）。圖放在 `app/src/assets/badges/`。**圖還沒齊，App 要能 fallback。**

## 2. 要做的事

1. **取代資料**：把 `badges.v2.json` 取代現行 `badges.json`（刪除舊檔、改名或改載入路徑皆可，結果只留一份），並更新所有讀取處。
2. **Schema**（`content/schema/badge.schema.json`）：
   - `category` enum 新增 `unit_mastery`、`level_completion`、`unit_milestone`、`conversation`、`game_room`。
   - 新增選填欄位 `generate`（`"per_unit"` | `"per_level"`）。
   - `id` 的 pattern 允許 `{L}`、`{N}` 佔位（僅 `generate` 存在時）；`code` 允許 `null`（僅 `generate` 存在時）。
3. **範本展開**：載入徽章時依 `level.json` 展開——`per_unit`：對每個 Level 的每個 `unit_no`（含 `status: "planned"` 尚未有內容的 Unit，直到 `planned_units`）各產生一枚；`per_level`：每個 Level 一枚。`{L}`、`{N}` 於 `id`、`name`、`description`、`condition` 全部替換。展開後的徽章與固定徽章走同一套判定／顯示流程。Level 來源：`content/level*/level.json`。
4. **判定邏輯**（沿用 `computeBadgeViewState()` 的模式）：
   - `unit_completion`：沿用既有判斷（通過該 Unit 的 Stage D）。
   - `unit_mastery`：該 Unit 目前已開放的計星 Stage（配對、填空、排序、句型、綜合；有會話者含會話；**字卡不計**）最高星等皆為 3。達成當下永久取得，之後新增 Stage 不收回（用既有解鎖紀錄機制保存）。
   - `level_completion`：該 Level `planned_units` 內每個 Unit 的 `unit_completion` 徽章皆已取得。門檻讀 `planned_units`，不要寫死 8。
   - `unit_milestone`：累計已取得的 `unit_completion` 徽章數（跨 Level）達 3／5／「目前已開放 Unit 總數」。`all` 的門檻動態計算（同單字量 `all`）。
   - `conversation`：`first`＝完成任一 Unit 會話 ≥ 1 則；`five`＝完成**不同** Unit 的會話 ≥ 5 則；`all`＝目前已開放（有 `conversation.json`）的故事全部完成。
   - `game_mastery.talk_novice／talk_master`：累計「會話題型」答對回合數達 30／150（併入既有 `game_mastery` 計算，題型 key 新增 `conversation`）。
   - `game_room`：填字破完 1／10 次、戳泡泡破完 1／10 次、兩款皆 ≥ 1 次（`both`）。
5. **新統計**（`badgeStats.ts`，沿用獨立 localStorage 模組的模式，key 前綴 `levelUnitReview.`）：
   - `conversationTurnsCorrect`（累計答對回合數）、`conversationCompletedUnits`（已完成會話的 Unit key 集合）。
   - `crosswordClears`、`bubblePopClears`（遊戲破完次數）。
   - 提供 `recordConversationTurn()`、`recordConversationCompleted(unitKey)`、`recordGameClear(gameId)` 之類的記錄函式，並在對應功能完成處呼叫。**若 3-A／3-B 尚未恢復，先建立函式與判定、在 HANDOFF 標明「待接線」；若已恢復，直接接線。**
6. **徽章頁 UI**：
   - 依 Level 分組顯示單元類徽章（單元完成／單元三星／Level 完成），Level 內依 Unit 排序；尚未開放（`planned`）的 Unit 徽章顯示鎖定狀態，說明文字沿用 `condition`，不要顯示成「壞掉」。
   - 新分類的標題與圖示（沿用 `CATEGORY_ICONS` 風格新增）：`unit_mastery`「單元精熟」、`level_completion`「Level 完成」、`unit_milestone`「單元里程碑」、`conversation`「會話故事」、`game_room`「遊戲室」。
   - 「已取得／總數」改為依展開後的徽章數動態計算，不寫死。
   - 圖案：依上述檔名規則取圖；`UC-{N}`、`UT` 這種共用圖，由 App 在圖外疊一個 **Level 小標（如 `L4`）**（色環或角標，使用設計系統色票；圖片本身沒有文字）。找不到圖時沿用既有「色底＋代號／名稱」佔位圖。
   - 解鎖彈窗（pop）對新徽章同樣有效。
7. **驗證腳本**：更新 `verify-badge-unlock-diff.ts`、`verify-badgestats-logic.ts`；新增展開邏輯的驗證——以目前 `level.json`（Level 4、8 個單元）展開後：`unit_completion` 8 筆、`unit_mastery` 8 筆、`level_completion` 1 筆，所有展開 id 唯一、與舊 `l4u1~l4u8` 的 id 一致；用測試資料驗證 `unit_mastery`（缺一顆星時不給、補齊後給、之後新增 Stage 不收回）、`level_completion`、`unit_milestone`（含 `all` 動態門檻）、`conversation.five`（相同 Unit 重複完成不重複計）。

## 3. 驗證

1. `npm run build`、`npm run build:standalone` 與全部 verify 腳本通過。
2. 以既有使用者資料（已取得 `l4u1` 完成徽章者）實測：升級後該徽章仍是已取得，不重複彈窗。
3. 以 Unit 1 跑完所有 Stage 並拿滿三星：解鎖「完成 Unit 1」「Level 4 - Unit 1 三星」「單元探險家」未達不給；補齊不同 Unit 後測 `unit_milestone` 3／5。
4. 徽章頁：Level 4 分組顯示 Unit 1–8（Unit 4–8 鎖定）、新分類標題正確、總數與已取得數正確；圖片缺檔時顯示佔位圖不報錯。
5. 手機（390px）與平板（820px）截圖檢查徽章頁與解鎖彈窗。
6. 全專案 grep：不得出現教材書名／出版社名、舊站主題 key。
7. 在新專案 `HANDOFF.md` 記錄結果、未接線的項目與原因。
8. 不要修改 `content/badges/badges.v2.json` 的內容；若發現條件說明不清楚或判定上有疑慮，回報內容端調整。
