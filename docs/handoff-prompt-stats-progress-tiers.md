# 任務：挑戰紀錄頁的視覺分級（延伸自題型選單那次的分級系統）

## 背景

題型選單（`renderMenu()`）的卡片已經套用過「尚未挑戰／練習中／表現不錯／完美」4 級視覺分級（`progressTier()`、`.menu-item--*` modifier class，見 `docs/handoff-prompt-menu-progress-tiers.md`）。這次要把同樣的視覺語言延伸到「挑戰紀錄」頁（`renderStats()`），但**外層主題卡片跟內層題型明細，套用的判斷規則不一樣**，這點已經跟我確認過，細節如下。

## 相關檔案

- `app/src/main.ts`
  - `progressTier()` 函式（題型選單分級用的既有函式）— 內層題型明細直接重用這個，不用另外寫
  - 約 1469 行：`renderStats()`
  - 約 1516-1531 行：每個主題彙整 `stageEntries`／`topicPlayedCount`／`topicAverageAccuracy` 的地方，這次要在這裡多算一個「外層卡片分級」
  - 約 1533-1566 行：外層 `.stats-topic-card` 收合狀態的摘要列（`summaryRow`／`briefEl`），這次要加分級 modifier class，`briefEl` 完美時加 ⭐ 前綴
  - 約 1569-1620 行：展開狀態的 `.stats-stage-list` / `.stats-stage-row`，每一列都有 `progress: StageProgress | null`，這次要在這裡套用既有的 `progressTier()`，跟題型選單同一套顏色
  - 約 1590-1596 行：`.stats-bar-track` / `.stats-bar-fill`（正確率進度條，寬度＝`bestAccuracy%`），這次順便讓填色也呼應分級顏色
- `app/src/style.css`
  - `.menu-item--practicing` / `--good` / `--mastered`（題型選單那次新增的 modifier class）— 這次的新 class 直接比照這幾個的寫法（色條＋淡底色的做法要一致）
  - 約 1528 行起：`.stats-topic-card` 相關樣式
  - 約 1581 行起：`.stats-stage-row` 相關樣式，含 `.stats-bar-track` / `.stats-bar-fill`
- `assets/design-tokens/design-tokens.css` — 沿用題型選單那次新增的淡色 token（`--color-primary-tint`／`--color-success-tint`／`--color-accent-yellow-tint`），這次**不用再新增新的色相**

## 兩種分級規則（已確認）

### 1. 展開後的內層題型列（`.stats-stage-row`）：直接重用 `progressTier()`

這裡是單一題型的 `StageProgress`，跟題型選單的資料形狀完全一樣，**不用另外設計邏輯**，直接呼叫既有的 `progressTier(progress)`，套用完全相同的顏色對照（`not-started` 灰／`practicing` 藍／`good` 綠／`mastered` 金＋⭐）。

`.stats-bar-fill` 的填色也建議跟著分級變色（例如 `practicing` 用 `--color-primary-500`、`good` 用 `--color-success`、`mastered` 用 `--color-accent-yellow`），因為這條進度條本來就是既有元素，讓它呼應分級顏色是低成本的加分，不會增加畫面元素數量。

### 2. 收合狀態的外層主題卡片（`.stats-topic-card`）：完成度優先、正確率次之

外層卡片顯示的是跨全部題型（`STAGE_ROWS.length`，目前是 6 種）彙整的平均值，不是單一正確率，**不能直接套用跟內層一樣的門檻**，不然會出現「只試 1 種題型就矇對 100%」跟「6 種全部完成且全對」被塗成同一種「完美」金色的怪現象，讓「完美」這個顏色失去意義。

改用這個規則（新寫一個函式，例如 `topicProgressTier()`）：

```ts
function topicProgressTier(
  topicPlayedCount: number,
  totalStages: number,
  averageAccuracy: number
): ProgressTier {
  if (topicPlayedCount === 0) return "not-started";
  if (topicPlayedCount < totalStages) return "practicing"; // 還沒全部挑戰過，不管平均正確率多高都算練習中
  if (averageAccuracy >= 100) return "mastered";
  if (averageAccuracy >= 80) return "good";
  return "practicing";
}
```

也就是「表現不錯」跟「完美」這兩級，必須**全部題型都挑戰過**才拿得到，只是部分挑戰過（不管正確率多高）一律算「練習中」。這樣「完美／表現不錯」代表的是真的把這個主題整個做完，符合「挑戰紀錄」這個頁面回顧整體投入程度的定位，不是只看單次手氣。

`ProgressTier` 型別（`"not-started" | "practicing" | "good" | "mastered"`）跟現有 `progressTier()` 回傳的型別共用同一個，不要另外定義一個名字不同但結構一樣的型別。

## 視覺呈現：跟題型選單同一套語言，不要另外發明新樣式

- 外層卡片：套用跟 `.menu-item--*` 一樣手法的 `.stats-topic-card--practicing` / `--good` / `--mastered`（左側色條＋淡底色），`briefEl` 文字在 `mastered` 時加 ⭐ 前綴（例如「⭐ 已挑戰 6 / 6 種題型・平均正確率 100%」）。
- 內層題型列：`.stats-stage-row--practicing` / `--good` / `--mastered`，同樣色條＋淡底色手法；`mastered` 時 `stageTitle` 或 `detail` 文字加 ⭐ 前綴，跟題型選單的做法一致。
- `not-started` 兩層都維持現有中性樣式（不新增 modifier class 也可以，等同預設狀態），`briefEl` 目前「尚未挑戰過」的文字顏色如果也被寫死成跟已挑戰狀態一樣的顏色，比照題型選單那次的做法一併修正成 `--color-ink-muted`。

## 實作檢查清單

1. `main.ts`：新增 `topicProgressTier()`；`renderStats()` 裡幫每個主題算出外層分級，加到 `.stats-topic-card` 的 class；展開列表裡每個 `stageRow` 呼叫既有 `progressTier(progress)` 加對應 class；`.stats-bar-fill` 的 `style.width` 那段順便加上對應分級的填色。
2. `style.css`：新增 `.stats-topic-card--practicing/--good/--mastered` 與 `.stats-stage-row--practicing/--good/--mastered`，色條＋淡底色的寫法要跟 `.menu-item--*` 系列一致（同樣用色條寬度、同樣用既有淡色 token），不要各自發展出不同手法。
3. 做完後實際切換不同主題的挑戰紀錄（未挑戰／部分挑戰／全部挑戰但未滿分／全部挑戰且滿分）跑過所有組合，確認外層卡片跟展開後的內層題型列顏色都符合預期，收合、展開切換時色條/底色不會閃爍或跑版。

## 範圍界線

- 只處理「挑戰紀錄」頁，不要順便更動題型選單（`.menu-item`）已經做好的分級邏輯或樣式。
- 不新增任何新色相，全部沿用題型選單那次已經建立的 token。
- 如果過程中發現 `topicProgressTier()` 的規則在實際資料上看起來怪怪的（例如某個主題的題型數量、平均值算法跟預期不同），先跟我確認要不要調整規則，不要自己直接改判斷邏輯。
