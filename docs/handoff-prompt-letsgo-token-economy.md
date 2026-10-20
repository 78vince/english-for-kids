# Handoff：學習代幣獲得規則改版（依難度與練習階段給代幣）— game-tokens v1.7.0

*撰寫：2026-10-13（內容端，依使用者需求）｜執行對象：App 端 `app/`（`gameTokens.ts`、`main.ts` 完成回合處理、完成畫面）｜數值全在 `assets/game-tokens/game-tokens.json` 的 `economy`*

## 目標
舊規則「完成任何題型一輪固定 +5」會讓人只刷最簡單、最短的單元。新規則依**題型難度、單元難度、練習階段**給代幣；**不設每日總上限**（使用者決定）。

## 規則（讀 `GameTokens.economy`，不要把數字寫在 App）
每輪獲得 ＝ 下列項目加總 × `stageWeight[題型]` × `unitMultiplier.byUnit[單元 key]`（沒有就用 `default` 1），`Math.round`，有任一項成立時最少 1。

| 項目 | 數值 | 條件 |
|---|---|---|
| `firstClear` | 6 | 該使用者在該單元該題型第一次完成（完成前 `timesCompleted` 為 0） |
| `personalBest` | 2 | 本輪正確率高於先前最高正確率（第一次完成不算） |
| `perfectFirst` | 3 | 本輪 100%，且先前最高正確率未達 100%（每單元題型最多一次） |
| `review` | 1 | 既不是第一次、也沒刷新最高分的再次複習；**同一題型同一單元每天最多領 3 次**，之後 0 |

- `firstClear` 與 `perfectFirst` 可同輪一起算；`personalBest` 與 `review` 互斥。
- `stageWeight`：flashcards 0.6、matching 1、ordering 1.5、fillBlank 1.5、pattern 2、capstone 2、conversation 2。
- `unitMultiplier.byUnit`：l4u1 1、l4u2 1、l4u3 1.25、l4u4 1.25（新增單元時內容端會補；沒列的單元用 default）。
- 舊使用者升級：已有 progress 的單元題型一律視為「已完成過」，不補發 `firstClear`；`perfectFirst` 看現有 `bestAccuracy`。

## App 端要做
1. `main.ts` 完成回合：**必須在 `recordStageCompletion()` 寫入之前**讀取先前的 `timesCompleted`、`bestAccuracy`（目前它先寫入、才呼叫 `earnTokens`，順序要調整或先暫存）。
2. 「每天 3 次」計數：存在遊戲代幣存檔（同 `levelUnitReview.gameTokens.v1.<profileId>`，走同步），依日期（本機日期）記每個「單元＋題型」已領 review 次數，只保留當天。
3. `earnTokens(profileId, amount)` 保留；新增計算函式回傳 `{ total, breakdown[] }`，明細例：第一次完成 +6、刷新最高分 +2、拿到滿分 +3、單元加成 ×1.25。
4. 完成畫面顯示本輪獲得與明細；代幣區標題「每完成一輪任何題型 +5」改成讀規則的說明（例如「第一次完成、刷新最高分、拿滿分、複習都能賺代幣」）。
5. 版本：`EXPECTED_GAME_TOKENS_VERSION` → 1.7.0。

## 驗收
- Level 4 - Unit 4 第一次完成 matching 且全對：6＋3＝9 × 1 × 1.25 ≈ 11；再玩一次：review 1×1×1.25 → 1，當天第 4 次起 0。
- Unit 1（×1.0）pattern 第一次完成：6 × 2 = 12；同單元再複習：1 × 2 = 2。
- 一個單元七種題型第一次全完成（無滿分）：Unit 1 約 64、Unit 4 約 80；七種全再複習一輪：約 12／15（舊規則固定 35）。
- 舊使用者升級後不會被補發 `firstClear`；日期換天後 review 次數歸零。
