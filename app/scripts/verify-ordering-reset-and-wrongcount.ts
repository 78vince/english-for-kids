// 驗證 Stage B-1 句子排序這次修的兩件事（見 docs/handoff-prompt-ordering-reset-and-wrongcount.md）：
// 1. resetPlacedTokens()：一鍵把這一句所有已放置字塊送回字塊池，答對鎖住時什麼都不做。
// 2. 答錯次數（wrongCount）同一句最多只算 1 次——使用者用 reorderPlaced() 拖曳調整順序，
//    中途調整幾次都不該重複累加；換到下一句後才會繼續往上加。
// wrongStreak（決定提示/跳過按鈕門檻）跟 onWrong()（音效）不受這次修正影響，已經在
// verify-ordering-logic.ts 的測試 4 涵蓋過，這裡不重複測。
// 用法：npx tsx scripts/verify-ordering-reset-and-wrongcount.ts

import { readFileSync } from "node:fs";
import { OrderingGame } from "../src/orderingGame";
import type { Sentence } from "../src/types";

function loadSentences(): Sentence[] {
  const all: Sentence[] = JSON.parse(
    readFileSync(new URL("../../content/sentences/family.json", import.meta.url), "utf-8")
  );
  return all.filter((s) => s.topic === "family" && s.stage === "B" && s.status === "published");
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

/** 把目前字塊池「反過來」排進答案區，保證會是一次答錯（前提：句子長度 >= 2，
 * 且反過來排剛好不會意外變成正確答案——用跟 verify-ordering-logic.ts 一樣的防呆判斷）。 */
function placeAllReversedExpectingWrong(game: OrderingGame): void {
  const byOriginal = [...game.pool].sort((a, b) => a.originalIndex - b.originalIndex);
  const ids = [...byOriginal].reverse().map((t) => t.instanceId);
  const wouldBeCorrect = ids.every(
    (id, i) => game.pool.find((t) => t.instanceId === id)?.originalIndex === i
  );
  if (wouldBeCorrect && ids.length >= 2) {
    [ids[0], ids[1]] = [ids[1], ids[0]]; // 保證答錯
  }
  for (const id of ids) game.placeToken(id);
}

/** 把字塊池依正確順序全部放進答案區（會觸發答對評分）。 */
function placeAllInCorrectOrder(game: OrderingGame): void {
  const correctOrderIds = [...game.pool]
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map((t) => t.instanceId);
  for (const id of correctOrderIds) game.placeToken(id);
}

// ---- 測試 1：排錯一次 → wrongCount === 1 ----
{
  const game = new OrderingGame(loadSentences());
  placeAllReversedExpectingWrong(game);
  assert(game.feedback === "wrong", "測試前提：反過來排應該是一次答錯");
  assert(game.wrongCount === 1, `排錯一次後 wrongCount 應該是 1，實際是 ${game.wrongCount}`);
  console.log("✅ 測試 1 通過：排錯一次，wrongCount === 1。");
}

// ---- 測試 2：用 reorderPlaced() 調整順序但還是錯 → wrongCount 應該還是 1（不會變成 2） ----
{
  const game = new OrderingGame(loadSentences());
  placeAllReversedExpectingWrong(game);
  assert(game.feedback === "wrong", "測試前提：反過來排應該是一次答錯");
  assert(game.wrongCount === 1, "測試前提：第一次答錯後 wrongCount 應該是 1");
  assert(game.placed.length >= 3, "測試句子字數不足（至少要 3 個字才能測「調整後仍是錯的」），換句話設計");

  // 交換答案區前兩個字塊的位置（reorderPlaced 是「移到目標前面」，把第 0 個拖到第 1 個
  // 後面＝把第 1 個拖到第 0 個前面），因為原本是完全反過來的順序，交換其中一組相鄰字塊
  // 之後大機率仍然不是正確順序（除非句子長度剛好等於 2，前面已經用 >= 3 排除這個情況）。
  const firstId = game.placed[0].instanceId;
  const secondId = game.placed[1].instanceId;
  game.reorderPlaced(secondId, firstId);
  assert(game.pool.length === 0, "reorderPlaced 之後字塊池應該還是空的（會自動觸發重新評分）");
  assert(
    !game.placed.every((t, i) => t.originalIndex === i),
    "測試前提：交換相鄰兩個字塊後仍然不是正確順序（如果這裡失敗，代表測試句子不適合這個測試，需要換句話設計）"
  );
  assert(game.feedback === "wrong", "調整後仍然是錯的，feedback 應該還是 wrong");
  assert(
    game.wrongCount === 1,
    `用 reorderPlaced 調整順序（還是錯的）不應該讓 wrongCount 重複累加，應該還是 1，實際是 ${game.wrongCount}`
  );
  console.log("✅ 測試 2 通過：拖曳調整順序但仍答錯，wrongCount 不會重複累加。");
}

// ---- 測試 3：resetPlacedTokens() → 全部字塊送回字塊池，feedback 回到 building，
//      wrongCount 不變（reset 不算重新作答一次） ----
{
  const game = new OrderingGame(loadSentences());
  const totalTokenCount = game.pool.length;
  placeAllReversedExpectingWrong(game);
  assert(game.feedback === "wrong", "測試前提：先製造一次答錯");
  const wrongCountBeforeReset = game.wrongCount;
  assert(game.placed.length === totalTokenCount, "測試前提：這時候應該全部字塊都在答案區");

  game.resetPlacedTokens();
  assert(game.placed.length === 0, "resetPlacedTokens() 後答案區應該淨空");
  assert(game.pool.length === totalTokenCount, "resetPlacedTokens() 後字塊池應該回到跟一開始一樣的總數");
  assert(game.feedback === "building", "resetPlacedTokens() 後 feedback 應該回到 building");
  assert(
    game.wrongCount === wrongCountBeforeReset,
    `resetPlacedTokens() 不應該影響 wrongCount，應該維持 ${wrongCountBeforeReset}，實際是 ${game.wrongCount}`
  );
  console.log("✅ 測試 3 通過：resetPlacedTokens() 正確把字塊送回字塊池，且不算一次作答。");
}

// ---- 測試 4：排對之後換下一句，這一句再排錯一次 → wrongCount === 2
//      （確認換句子後計數器正常繼續累加，只是「同一句內」不會重複疊加） ----
{
  const sentences = loadSentences();
  assert(sentences.length >= 2, "測試資料應該至少有 2 句話，才能測「換句子後繼續累加」");
  const game = new OrderingGame(sentences);

  // 先在第一句製造一次答錯，並用 reorderPlaced 調整幾次（確認不會被重複計入）
  placeAllReversedExpectingWrong(game);
  assert(game.wrongCount === 1, "測試前提：第一句先答錯一次");
  if (game.placed.length >= 3) {
    const a = game.placed[0].instanceId;
    const b = game.placed[1].instanceId;
    game.reorderPlaced(b, a);
  }
  assert(game.wrongCount === 1, "測試前提：同一句內調整順序不應該讓 wrongCount 變成 2");

  // 把字塊送回字塊池，改用正確順序排對，答對後前進到下一句
  game.resetPlacedTokens();
  placeAllInCorrectOrder(game);
  assert(game.feedback === "correct", "測試前提：第一句應該可以答對");
  game.advanceToNextSentence();

  // 第二句再製造一次答錯
  placeAllReversedExpectingWrong(game);
  assert(game.feedback === "wrong", "測試前提：第二句也應該先製造一次答錯");
  assert(
    game.wrongCount === 2,
    `換到下一句後再答錯一次，wrongCount 應該累加到 2（不受前一句「同一句只算一次」的限制影響），實際是 ${game.wrongCount}`
  );
  console.log("✅ 測試 4 通過：換句子後 wrongCount 正常繼續累加，同一句內不會重複疊加。");
}

// ---- 測試 5：已經答對鎖住（feedback === "correct"）時呼叫 resetPlacedTokens()
//      應該什麼都不做（維持 placed／feedback 不變） ----
{
  const game = new OrderingGame(loadSentences());
  placeAllInCorrectOrder(game);
  assert(game.feedback === "correct", "測試前提：這一句應該已經答對並鎖住");
  const placedBefore = game.placed.map((t) => t.instanceId);
  const poolBefore = game.pool.length;

  game.resetPlacedTokens();

  assert(game.feedback === "correct", "答對鎖住時呼叫 resetPlacedTokens() 不應該改變 feedback");
  assert(
    JSON.stringify(game.placed.map((t) => t.instanceId)) === JSON.stringify(placedBefore),
    "答對鎖住時呼叫 resetPlacedTokens() 不應該改變 placed 的內容"
  );
  assert(game.pool.length === poolBefore, "答對鎖住時呼叫 resetPlacedTokens() 不應該改變字塊池");
  console.log("✅ 測試 5 通過：答對鎖住時呼叫 resetPlacedTokens() 正確地什麼都不做。");
}

console.log("\n✅ 全部「重置字塊」與「答錯次數」修正驗證通過。");
