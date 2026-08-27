// 驗證 OrderingGame 的邏輯，特別是這幾個修過的行為：
// 1. 答錯不會重新洗牌，會保留使用者排的順序，讓他手動修正
// 2. reorderPlaced（拖曳排序）可以正確調整順序，且會在字塊池清空時自動評分
// 3. 提示（useHint）／跳過（skipCurrentSentence）在連續答錯後可用，且行為正確
// 4. 全部句子都能跑完一輪
// 用法：npx tsx scripts/verify-ordering-logic.ts

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

// ---- 測試 0：句子裡出現重複的字（例如 "is" 出現兩次）時，
//              把兩個重複字的「實例」交換位置，結果文字順序其實還是對的，應該判定答對 ----
// 這是實際回報過的 bug：sent.family.b1.001「This is my father. He is a doctor.」
// 有兩個 "is"，使用者排出來的句子肉眼看起來完全正確，卻因為程式內部用「字塊實例」
// 而不是「文字」判斷對錯，把兩個 "is" 實例的位置交換就被誤判為答錯。
{
  const sentences = loadSentences();
  const target = sentences.find((s) => s.id === "sent.family.b1.001");
  assert(!!target, "測試資料裡應該要有 sent.family.b1.001（This is my father. He is a doctor.）");

  const game = new OrderingGame([target!]);
  const words = target!.en.split(" ");
  assert(
    words.filter((w) => w === "is").length === 2,
    "這句測試資料預期要有 2 個 is，資料格式可能變了，測試前提不成立"
  );

  // 依「文字」找出每個位置該放哪個字，但兩個 is 的「實例」故意交換
  const isTokens = game.pool.filter((t) => t.text === "is");
  assert(isTokens.length === 2, "字塊池裡應該要有 2 個 is 的字塊實例");
  const [isA, isB] = isTokens; // 兩個不同的 is 實例，等一下故意交換使用順序

  function findNonIsToken(word: string) {
    const t = game.pool.find((tk) => tk.text === word);
    assert(!!t, `字塊池裡找不到 "${word}"`);
    return t!;
  }

  // 依序放：This / is(用 isB 這個實例) / my / father. / He / is(用 isA 這個實例) / a / doctor.
  // 文字順序跟正確句子一模一樣，只是兩個 is 的實例故意對調。
  game.insertFromPool(findNonIsToken("This").instanceId, null);
  game.insertFromPool(isB.instanceId, null);
  game.insertFromPool(findNonIsToken("my").instanceId, null);
  game.insertFromPool(findNonIsToken("father.").instanceId, null);
  game.insertFromPool(findNonIsToken("He").instanceId, null);
  game.insertFromPool(isA.instanceId, null);
  game.insertFromPool(findNonIsToken("a").instanceId, null);
  game.insertFromPool(findNonIsToken("doctor.").instanceId, null);

  const finalText = game.placed.map((t) => t.text).join(" ");
  assert(finalText === target!.en, `重組出來的句子文字應該跟原句一致，實際是 "${finalText}"`);
  assert(
    game.feedback === "correct",
    `文字順序明明正確（只是兩個 is 的實例交換），卻被判定為 "${game.feedback}"，這就是要修的 bug`
  );
  console.log("✅ 測試 0 通過：重複字的實例交換不會再被誤判答錯。");
}

// ---- 測試 1：答錯要保留使用者排的順序，不能自動重新洗牌 ----
{
  const game = new OrderingGame(loadSentences());
  const idsInWrongOrder = [...game.pool].reverse().map((t) => t.instanceId);
  const wouldAccidentallyBeCorrect = idsInWrongOrder.every(
    (id, i) => game.pool.find((t) => t.instanceId === id)!.originalIndex === i
  );
  assert(!wouldAccidentallyBeCorrect, "測試資料反過來排剛好是對的，測試前提不成立，換句話設計");

  for (const id of idsInWrongOrder) game.placeToken(id);
  assert(game.feedback === "wrong", "排錯順序後 feedback 應該是 wrong");

  const placedIdsRightAfterWrong = game.placed.map((t) => t.instanceId);
  assert(
    JSON.stringify(placedIdsRightAfterWrong) === JSON.stringify(idsInWrongOrder),
    "答錯後應該保留使用者原本排的順序，不能被清空或重新洗牌"
  );
  assert(game.pool.length === 0, "答錯後字塊池應該還是空的（字塊都還留在答案區給使用者修）");
  console.log("✅ 測試 1 通過：答錯保留使用者排列，沒有自動重洗牌。");
}

// ---- 測試 2：用 returnToken 手動修正後，重新排對可以答對 ----
{
  const game = new OrderingGame(loadSentences());
  const reversedIds = [...game.pool].reverse().map((t) => t.instanceId);
  for (const id of reversedIds) game.placeToken(id);
  assert(game.feedback === "wrong", "應該先製造一次答錯");

  // 手動把全部字塊送回字塊池，再依正確順序重新放
  for (const t of [...game.placed]) game.returnToken(t.instanceId);
  assert(game.feedback === "building", "開始修正後 feedback 應該回到 building");
  assert(game.pool.length === reversedIds.length, "全部送回字塊池後，池子應該有全部字塊");

  const correctOrderIds = [...game.pool]
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map((t) => t.instanceId);
  for (const id of correctOrderIds) game.placeToken(id);
  assert(game.feedback === "correct", "依正確順序重新放置後應該答對");
  console.log("✅ 測試 2 通過：手動送回字塊池再重排，可以修正成答對。");
}

// ---- 測試 3：拖曳排序（reorderPlaced）能修正順序並在填滿時自動評分 ----
{
  const game = new OrderingGame(loadSentences());
  const shuffledIds = game.pool.map((t) => t.instanceId);
  for (const id of shuffledIds) game.placeToken(id); // 先照亂序整個放進去（很可能是錯的）

  // 用氣泡排序的方式，反覆把順序不對的相鄰兩個字塊互換，直到排對為止
  let guard = 0;
  while (!game.placed.every((t, i) => t.originalIndex === i)) {
    guard += 1;
    if (guard > 200) throw new Error("拖曳排序測試超過安全上限，可能卡住了");
    for (let i = 0; i < game.placed.length - 1; i++) {
      if (game.placed[i].originalIndex > game.placed[i + 1].originalIndex) {
        const a = game.placed[i].instanceId;
        const b = game.placed[i + 1].instanceId;
        // 把 a 拖到 b 後面（reorderPlaced 是「移到目標的前面」，所以拖 b 到 a 前面等於交換）
        game.reorderPlaced(b, a);
      }
    }
  }
  assert(game.feedback === "correct", "拖曳排序排對後，字塊池清空應該自動觸發評分並答對");
  console.log("✅ 測試 3 通過：拖曳排序（reorderPlaced）可以修正順序並自動評分。");
}

// ---- 測試 3b：insertFromPool 可以把字塊池的字塊直接拖到答案區的指定位置／最後面 ----
{
  const game = new OrderingGame(loadSentences());
  const byOriginal = [...game.pool].sort((a, b) => a.originalIndex - b.originalIndex);
  assert(byOriginal.length >= 3, "測試句子字數不足，換一句話設計這個測試");

  // 先直接把第 0 個字（照正確順序）插到答案區最後面（此時答案區是空的，null 代表插到最後）
  const first = byOriginal[0];
  game.insertFromPool(first.instanceId, null);
  assert(
    game.placed.length === 1 && game.placed[0].instanceId === first.instanceId,
    "insertFromPool(id, null) 應該把字塊插到答案區（此時等於最後面）"
  );

  // 再把第 2 個字插到「第 0 個字」前面，驗證可以插在字塊池字塊之間的指定位置（不是只能接在最後）
  const third = byOriginal[2];
  game.insertFromPool(third.instanceId, first.instanceId);
  assert(
    game.placed[0].instanceId === third.instanceId && game.placed[1].instanceId === first.instanceId,
    "insertFromPool 應該能把字塊池的字塊插到答案區指定字塊的前面，不是只能接在最後"
  );
  assert(
    !game.pool.some((t) => t.instanceId === third.instanceId),
    "插入後這個字塊應該從字塊池移除"
  );
  console.log("✅ 測試 3b 通過：insertFromPool 可以把字塊池的字塊直接拖到答案區的指定位置。");
}

// ---- 測試 3c：reorderPlaced(id, null) 把字塊移到答案區最後面（拖到答案區空白處的情境）----
{
  const game = new OrderingGame(loadSentences());
  const byOriginal = [...game.pool].sort((a, b) => a.originalIndex - b.originalIndex);
  assert(byOriginal.length >= 3, "測試句子字數不足，換一句話設計這個測試");

  // 故意用「反過來」的順序放進答案區，確保排列一定是錯的（不會提早被判定答對而鎖住畫面）
  const reversedIds = [...byOriginal].reverse().map((t) => t.instanceId);
  for (const id of reversedIds) game.placeToken(id);
  assert(game.feedback === "wrong", "測試前提：反過來排應該是錯的");

  const firstPlacedId = game.placed[0].instanceId;
  game.reorderPlaced(firstPlacedId, null);
  assert(
    game.placed[game.placed.length - 1].instanceId === firstPlacedId,
    "reorderPlaced(id, null) 應該把字塊移到答案區最後面"
  );
  console.log("✅ 測試 3c 通過：reorderPlaced(id, null) 可以把字塊移到答案區最後面。");
}

// ---- 測試 4：連續答錯後提示／跳過按鈕的門檻，以及 useHint／skipCurrentSentence 行為 ----
{
  const game = new OrderingGame(loadSentences());

  function wrongOnce(): void {
    const byOriginal = [...game.pool].sort((a, b) => a.originalIndex - b.originalIndex);
    const ids = [...byOriginal].reverse().map((t) => t.instanceId);
    const wouldBeCorrect = ids.every(
      (id, i) => game.pool.find((t) => t.instanceId === id)?.originalIndex === i
    );
    if (wouldBeCorrect && ids.length >= 2) {
      // 極少數情況下反過來排剛好是對的（例如只有 2 個字的句子），交換前兩個保證是錯的
      [ids[0], ids[1]] = [ids[1], ids[0]];
    }
    for (const id of ids) game.placeToken(id);
    assert(game.feedback === "wrong", "wrongOnce() 預期會是一次答錯，但沒有被標記為 wrong");
    // 答錯後把字塊都送回池子，準備下一次嘗試（不影響 wrongStreak，wrongStreak 只在答對/換題時歸零）
    for (const t of [...game.placed]) game.returnToken(t.instanceId);
  }

  assert(!game.canShowHint, "一開始不該出現提示按鈕");
  assert(!game.canSkip, "一開始不該出現跳過按鈕");

  wrongOnce();
  wrongOnce();
  assert(game.canShowHint, "連續答錯 2 次後應該出現提示按鈕");
  assert(!game.canSkip, "連續答錯 2 次後還不該出現跳過按鈕");

  wrongOnce();
  wrongOnce();
  assert(game.canSkip, "連續答錯 4 次後應該出現跳過按鈕");

  const wrongCountBeforeHint = game.wrongCount;
  game.useHint();
  assert(game.placed.length >= 1, "用提示後答案區應該至少放好一個字");
  assert(
    game.placed.every((t, i) => t.originalIndex === i),
    "用提示後，已放置的字塊應該都在正確位置上（提示只會給對的字）"
  );
  assert(game.wrongStreak === 0, "用過提示後應該重設 wrongStreak，給孩子新的機會");
  assert(game.wrongCount === wrongCountBeforeHint, "用提示不應該被算成一次答錯");
  console.log("✅ 測試 4 通過：提示／跳過按鈕門檻正確，useHint 給的字一定擺在正確位置。");
}

// ---- 測試 5：skipCurrentSentence 會前進到下一句，並累計 skippedCount ----
{
  const game = new OrderingGame(loadSentences());
  const before = game.currentSentenceNumber;
  game.skipCurrentSentence();
  assert(game.skippedCount === 1, "跳過一次後 skippedCount 應該是 1");
  assert(game.currentSentenceNumber === before + 1, "跳過後應該前進到下一句");
  console.log("✅ 測試 5 通過：skipCurrentSentence 正確前進並計數。");
}

// ---- 測試 6：整輪跑完（照正確順序作答），confirm correctCount 與總句數一致 ----
{
  const sentences = loadSentences();
  console.log(`載入 Family Stage B 句子數：${sentences.length}（應為 4）`);
  assert(sentences.length === 4, `預期 4 句，實際 ${sentences.length} 句`);

  const game = new OrderingGame(sentences);

  let guard = 0;
  while (!game.isRoundComplete) {
    guard += 1;
    if (guard > 100) throw new Error("超過安全上限，可能卡住了");
    const correctOrderIds = [...game.pool]
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map((t) => t.instanceId);
    for (const id of correctOrderIds) game.placeToken(id);
    if (game.feedback === "correct") {
      // 答對後畫面停在原地，要自己按「下一句」才會前進——這裡模擬使用者按下按鈕。
      game.advanceToNextSentence();
    }
  }

  console.log(`答對次數：${game.correctCount}（應等於 4）`);
  assert(game.correctCount === 4, `答對次數不對，預期 4 實際 ${game.correctCount}`);
  console.log("✅ 測試 6 通過：整輪都照正確順序作答，可以順利跑完全部句子。");
}

console.log("\n✅ 全部 OrderingGame 邏輯驗證通過。");
