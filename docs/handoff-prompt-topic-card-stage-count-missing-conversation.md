# Handoff：首頁主題卡片「X / 6 種題型已挑戰過」漏算 Stage E 會話練習

## 問題

使用者截圖回報：首頁主題選擇畫面的卡片上寫「6 / 6 種題型已挑戰過」，但主題其實已經有 7 種題型（字卡暖身、Stage A～D 四種＋Stage E 會話練習）。

## 根因

`app/src/main.ts` 第 1222-1227 行：

```ts
/** 統計某個主題四種題型裡，有幾種已經挑戰過（timesCompleted > 0），當作選主題畫面上的小提示。 */
const ALL_STAGE_KEYS: StageKey[] = ["flashcards", "matching", "ordering", "fillBlank", "choice", "capstone"];

function countChallengedStages(profileId: string, fileKey: string): number {
  return ALL_STAGE_KEYS.filter((k) => getStageProgress(profileId, fileKey, k) !== null).length;
}
```

這個陣列只有原本 6 種題型，漏了 `"conversation"`（Stage E 會話練習）。但 `StageKey` 這個型別本身（`app/src/progress.ts` 第 16 行）早就已經包含 `"conversation"`：

```ts
export type StageKey = "flashcards" | "matching" | "ordering" | "fillBlank" | "choice" | "capstone" | "conversation";
```

而且 Stage E 走的是跟其餘 6 種題型**完全同一套**進度追蹤機制（`getStageProgress`／`recordStageCompletion`，透過 `finalizeRoundCompletion("conversation", ...)` 記錄），`computeCompletedTopics()`（main.ts 第 4633-4654 行）判斷「這個主題是否完整完成」時也已經正確把 `"conversation"` 一起算進去。**只有這裡的 `ALL_STAGE_KEYS` 常數在新增 Stage E 的時候忘了同步更新**，導致首頁卡片的分子分母都少算了一項。

`app/src/main.ts` 第 1413-1426 行的卡片渲染邏輯（`buildTopicCard`）：

```ts
const challenged = countChallengedStages(activeProfile!.id, summary.topic.fileKey);
const progressPercent = Math.round((challenged / ALL_STAGE_KEYS.length) * 100);
...
<div class="topic-progress-label">${challenged} / ${ALL_STAGE_KEYS.length} 種題型已挑戰過</div>
```

分母是 `ALL_STAGE_KEYS.length`（動態算的，不是寫死的數字），所以只要把 `ALL_STAGE_KEYS` 這個陣列本身補上 `"conversation"`，畫面就會自動變成正確的「X / 7」，不用另外改渲染邏輯。

## 修法

```ts
/** 統計某個主題七種題型裡，有幾種已經挑戰過（timesCompleted > 0），當作選主題畫面上的小提示。 */
const ALL_STAGE_KEYS: StageKey[] = ["flashcards", "matching", "ordering", "fillBlank", "choice", "capstone", "conversation"];
```

（順便把註解「四種題型」改成「七種題型」，這個註解本身也早就跟實際數量脫節了——文件裡沒查到是哪一版改的，可能從一開始就沒跟著題型數量調整過。）

## 影響範圍確認

- 只有 `countChallengedStages()` 這一個函式用到 `ALL_STAGE_KEYS`，用 grep 確認過 `ALL_STAGE_KEYS` 沒有在其他地方被引用，改這裡不會影響其他邏輯。
- `computeCompletedTopics()`／徽章解鎖判斷等其餘用到 `"conversation"` 的地方本來就是各自獨立寫死清單或條件判斷，不受這次修改影響。
- 沒有沒 Stage E 內容的主題（例如 unit_zero 的兩個暖身主題）需要特別處理嗎？——不用，`countChallengedStages()` 是用 `getStageProgress(..., "conversation")` 是否為 `null` 判斷，如果某個主題真的沒有會話練習內容（目前 43 個正式主題＋Unit 0 兩個暖身主題應該都有），沒挑戰過就是回傳 `null`，跟其餘題型漏挑戰時的行為一致，不會出現除以 0 或負數等例外狀況。

## 驗證

- `npm run build` 要過。
- 建議新增一個小型 `verify-topic-card-stage-count.ts`（或加進既有相關驗證腳本），確認 `ALL_STAGE_KEYS` 陣列長度為 7 且包含 `"conversation"`，避免未來又有新題型加入時忘記同步更新這個常數（這是第二次發生「新增題型忘記同步這個清單」的狀況了，值得留一個防呆）。
- 手動測試：選一個已經挑戰過全部 7 種題型（含 Stage E）的主題，確認卡片顯示「7 / 7 種題型已挑戰過」且進度條是滿的；選一個還沒玩過 Stage E 的主題，確認正確顯示「6 / 7」。
