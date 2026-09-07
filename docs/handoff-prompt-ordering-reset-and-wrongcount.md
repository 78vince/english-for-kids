# Handoff：Stage B-1 句子排序 — 新增「重置字塊」按鈕 + 修正答錯次數重複累加

使用者截圖回報 Parts of Body 主題，句子「My head and my neck hurts, too.」排錯後，畫面顯示「答對 1　答錯 2」。這裡要處理兩件事，都在 `app/src/orderingGame.ts`（邏輯）與 `app/src/main.ts`（畫面，Stage B-1 渲染區塊約在第 2790-2891 行）。

## 1. 新增「重置字塊」按鈕：一鍵把這一句所有已放置字塊送回字塊池

**現狀**：`OrderingGame` 已經有 `returnToken(instanceId)`（`orderingGame.ts` 第 164-173 行），可以把「單一」已放置的字塊送回字塊池，但沒有「一次全部送回」的方法，使用者想整句重排時要一個一個手動點/拖。

**要加的方法**（`orderingGame.ts`，放在 `returnToken` 附近即可）：

```ts
/** 把這一句「全部」已放置的字塊一次送回字塊池，讓使用者可以整句重排。
 * 跟 returnToken() 一樣不會動到 wrongCount／wrongStreak，純粹是排列操作，
 * 不算「重新作答一次」。已經答對鎖住（locked）或本來就沒有已放置字塊時，什麼都不做。 */
resetPlacedTokens(): void {
  if (this.locked || this.placed.length === 0) return;
  for (const token of this.placed) {
    token.status = "pool";
  }
  this.pool.push(...this.placed);
  this.placed = [];
  this.feedback = "building";
  this.onChange();
}
```

**畫面按鈕**（`main.ts`，Stage B-1 渲染函式裡）：使用者確認過**任何時候都能按**（不限定答錯之後才出現），所以按鈕顯示條件建議是「有字塊已經放置、而且這一句還沒鎖住（沒答對）」，也就是 `!game.locked && game.placed.length > 0`。放在「🔊 播放整句」按鈕附近即可，例如：

```ts
if (!game.locked && game.placed.length > 0) {
  const resetBtn = document.createElement("button");
  resetBtn.className = "secondary-btn";
  resetBtn.textContent = "↺ 重置字塊";
  resetBtn.addEventListener("click", () => game.resetPlacedTokens());
  app!.appendChild(resetBtn);
}
```

（按鈕文字、圖示、確切放置位置可以依現有 UI 風格調整，這裡只是給一個可以動的版本；不需要二次確認彈窗，reset 是可逆操作、沒有扣分風險。）

## 2. 修正答錯次數重複累加：同一句最多只算 1 次答錯

**問題根因**：`evaluate()`（`orderingGame.ts` 第 260-283 行）只要「字塊池是空的」就會判定一次對錯。使用者排錯一次後，如果用「拖曳調整已放置字塊順序」修正（`reorderPlaced()`，第 179-204 行），因為字塊池本來就還是空的，每調整一次就會**立刻再判定一次**——調整 3 次才排對，中間 2 次還沒排對的調整也會各自被記一次答錯，同一句被重複扣分。

**要加的欄位**（跟 `wrongStreak` 放在一起即可，第 56-57 行附近）：

```ts
/** 這一句「答錯次數」有沒有已經算過一次——同一句不管中途調整幾次都只算 1 次答錯，
  避免使用者用拖曳調整順序時，每調整一次就重複扣分，造成心理負擔。
  答對、跳過、換下一句（loadSentence）都會重置。 */
private wrongCountedThisSentence = false;
```

**`evaluate()` 改法**：

```ts
private evaluate(): void {
  const isCorrect = /* 不變 */;

  if (isCorrect) {
    /* 不變 */
    return;
  }

  this.feedback = "wrong";
  if (!this.wrongCountedThisSentence) {
    this.wrongCount += 1;
    this.wrongCountedThisSentence = true;
  }
  this.wrongStreak += 1; // 這個不受影響，維持每次都 +1，用來決定何時出現提示/跳過按鈕
  this.onChange();
  this.onWrong(); // 音效也維持每次都觸發，讓使用者每次調整後都能得到「還不對」的回饋
}
```

**`loadSentence()` 裡加一行重置**（第 100-105 行附近，跟 `this.wrongStreak = 0;`放在一起）：

```ts
private loadSentence(index: number): void {
  this.sentenceIndex = index;
  this.feedback = "building";
  this.locked = false;
  this.wrongStreak = 0;
  this.wrongCountedThisSentence = false; // 新加這行
  this.placed = [];
  /* ... */
}
```

**注意事項**：
- `wrongStreak`（決定何時出現「給我一點提示」「跳過這句」按鈕的那個計數）**不用改**，維持每次判定錯誤都 +1；只有真正拿去做成效紀錄／畫面上「答對 X　答錯 Y」顯示用的 `wrongCount` 才需要限制成同一句最多 +1。
- `onWrong()`（觸發答錯音效的 callback）也維持每次判定都呼叫，不要跟著 `wrongCountedThisSentence` 一起被擋掉——不然使用者調整字塊後即使還是錯的，也聽不到任何回饋音效，體驗會變差。
- `restart()`（第 285 行附近）不用特別處理，因為它會呼叫 `loadSentence(0)`，`wrongCountedThisSentence` 自然會被重置。

## 驗證

- `npm run build`（`tsc --noEmit && vite build`）要過。
- 這兩個改動邏輯單純、不涉及非同步/UI 動畫，應該可以直接寫一支新的 `verify-ordering-reset-and-wrongcount.ts`（比照專案裡其他 `verify-*.ts` 的寫法，直接 new 一個 `OrderingGame` 實例、模擬呼叫方法、斷言欄位值），不需要真的開瀏覽器：
  1. 排錯一次 → `wrongCount === 1`。
  2. 用 `reorderPlaced()` 調整順序但還是錯 → `wrongCount` 應該還是 `1`（不會變成 2）。
  3. 呼叫 `resetPlacedTokens()` → `placed.length === 0`，`pool.length` 回到跟一開始一樣，`feedback === "building"`，且 `wrongCount` 不變（reset 不算重新作答）。
  4. 排對之後 → `advanceToNextSentence()` 到下一句 → 這一句再排錯一次 → `wrongCount === 2`（確認換句子後計數器正常繼續累加，只是「同一句內」不會重複疊加）。
  5. 已經答對鎖住（`locked === true`）時呼叫 `resetPlacedTokens()` 應該什麼都不做（維持 `locked`／`placed` 不變）。
- 實機用 demo 或正式站手動測一次 Parts of Body 這句，確認畫面上「重置字塊」按鈕看得到、按下去字塊真的清空回字塊池，且答錯次數不會因為中途調整順序而暴增。
