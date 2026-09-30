// 驗證翻牌配對（MemoryMatchGame）的遊戲邏輯，比照 verify-matching-logic.ts／
// verify-ordering-logic.ts 的做法：直接 new 一個 MemoryMatchGame 實例跑各種情境。
// 2026-09-28：新增「三關關卡機制」之後改版——測試時一律傳入很短的 revealDurationMs／
// shuffleAnimationMs／levelCompletePauseMs（建構子第 2~4 參數），避免每個測試都要
// 真的等好幾秒的正式時長。
// 用法：npx tsx scripts/verify-memory-match-logic.ts

import { MemoryMatchGame, LEVEL_COUNT, shuffleCardCountForLevel } from "../src/games/memoryMatchGame";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const testPairs = [
  { en: "cat", zh: "貓" },
  { en: "dog", zh: "狗" },
  { en: "bird", zh: "鳥" },
];

// 測試用的極短時長，正式時長分別是 5000ms／2300ms／1400ms
const TEST_REVEAL_MS = 30;
const TEST_SHUFFLE_ANIM_MS = 20;
const TEST_LEVEL_PAUSE_MS = 20;

function newTestGame(pairs = testPairs): MemoryMatchGame {
  return new MemoryMatchGame(pairs, TEST_REVEAL_MS, TEST_SHUFFLE_ANIM_MS, TEST_LEVEL_PAUSE_MS);
}

async function waitForPhase(game: MemoryMatchGame, phase: string, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (game.phase !== phase) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`❌ 等待 phase 變成 "${phase}" 逾時，目前是 "${game.phase}"`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

/** 在 "playing" 階段把某一關全部配對完成（依序把每組 pairId 的兩張卡片翻開）。 */
function matchAllPairs(game: MemoryMatchGame): void {
  const pairIds = [...new Set(game.cards.map((c) => c.pairId))];
  for (const pairId of pairIds) {
    const [a, b] = game.cards.filter((c) => c.pairId === pairId);
    game.flip(a.id);
    game.flip(b.id);
  }
}

// ---- 測試 1：建構子正確把傳入的配對拆成兩倍數量的卡片，且每組 pairId 只出現在
//      剛好兩張卡片上；一開局應該處於 "reveal" 階段、全部卡片翻開顯示、level 是 1 ----
{
  const game = newTestGame();
  assert(
    game.cards.length === testPairs.length * 2,
    `3 組配對應該拆成 6 張卡片，實際 ${game.cards.length} 張`
  );

  const pairIdCounts = new Map<string, number>();
  for (const card of game.cards) {
    pairIdCounts.set(card.pairId, (pairIdCounts.get(card.pairId) ?? 0) + 1);
  }
  assert(pairIdCounts.size === testPairs.length, `應該有 ${testPairs.length} 組不同的 pairId`);
  for (const [pairId, count] of pairIdCounts) {
    assert(count === 2, `pairId "${pairId}" 應該剛好出現在兩張卡片上，實際出現 ${count} 次`);
  }

  assert(game.phase === "reveal", `建構子完成後應該處於 "reveal" 階段，實際 "${game.phase}"`);
  assert(game.level === 1, `一開局應該是第 1 關，實際第 ${game.level} 關`);
  assert(
    game.cards.every((c) => c.isFlipped && !c.isMatched),
    "開局記憶階段所有卡片都應該是 isFlipped: true, isMatched: false"
  );
  assert(shuffleCardCountForLevel(1) === 0, "第 1 關不該有任何互換位置");
  assert(shuffleCardCountForLevel(2) === 2, "第 2 關應該互換 2 張卡片");
  assert(shuffleCardCountForLevel(3) === 4, "第 3 關應該互換 4 張卡片");

  console.log("✅ 測試 1 通過：建構子正確把 3 組配對拆成 6 張卡片，開局處於 reveal 階段、第 1 關。");
}

// ---- 測試 2：第 1 關 reveal 階段忽略 flip()；倒數結束後不用交換位置，直接進入
//      "playing"、觸發 onCoverBack ----
{
  const game = newTestGame();
  let coverBackCalls = 0;
  game.onCoverBack = () => {
    coverBackCalls += 1;
  };
  let shuffleStartCalls = 0;
  game.onShuffleStart = () => {
    shuffleStartCalls += 1;
  };

  const someCard = game.cards[0];
  game.flip(someCard.id);
  assert(game.phase === "reveal", "reveal 階段呼叫 flip() 不該改變 phase");

  await waitForPhase(game, "playing");

  assert(
    game.cards.every((c) => !c.isFlipped),
    "第 1 關倒數結束後，全部卡片應該自動蓋牌（isFlipped: false）"
  );
  assert(coverBackCalls === 1, `onCoverBack 應該剛好被觸發一次，實際 ${coverBackCalls} 次`);
  assert(shuffleStartCalls === 0, "第 1 關不該觸發 onShuffleStart（不用交換位置）");

  console.log("✅ 測試 2 通過：第 1 關 reveal 結束直接進入 playing，不經過交換位置。");
}

// ---- 測試 3：playing 階段翻兩張配對成功的卡片，兩張都變成 isMatched: true，
//      並觸發 onFlip／onMatch ----
{
  const game = newTestGame();
  await waitForPhase(game, "playing");

  let changeEvents = 0;
  game.onChange = () => {
    changeEvents += 1;
  };
  let flipCalls = 0;
  game.onFlip = () => {
    flipCalls += 1;
  };
  let matchCalls = 0;
  game.onMatch = () => {
    matchCalls += 1;
  };

  const [firstCard, secondCard] = game.cards.filter((c) => c.pairId === "pair-0");
  game.flip(firstCard.id);
  game.flip(secondCard.id);

  const updatedFirst = game.cards.find((c) => c.id === firstCard.id)!;
  const updatedSecond = game.cards.find((c) => c.id === secondCard.id)!;
  assert(updatedFirst.isMatched && updatedSecond.isMatched, "配對成功的兩張卡片都應該變成 isMatched: true");
  assert(updatedFirst.isFlipped && updatedSecond.isFlipped, "配對成功的兩張卡片應該維持翻開狀態");
  assert(changeEvents >= 2, "onChange 應該至少被觸發兩次（翻第一張、翻第二張判定完成）");
  assert(flipCalls === 2, `onFlip 應該剛好被觸發兩次（使用者主動翻兩張），實際 ${flipCalls} 次`);
  assert(matchCalls === 1, `onMatch 應該剛好被觸發一次，實際 ${matchCalls} 次`);
  assert(game.moveCount === 1, `翻了一組（兩張）應該記為 1 次 move，實際 ${game.moveCount}`);

  console.log("✅ 測試 3 通過：playing 階段翻兩張配對成功的卡片，正確變成 isMatched: true，onFlip/onMatch 正確觸發。");
}

// ---- 測試 4：翻兩張配對失敗的卡片，觸發 onMismatch，延遲後兩張都恢復 isFlipped: false
//      （且都還是 isMatched: false）並觸發 onCoverBack；判定期間第三次 flip() 呼叫要被忽略 ----
{
  const game = newTestGame();
  await waitForPhase(game, "playing");

  let mismatchCalls = 0;
  game.onMismatch = () => {
    mismatchCalls += 1;
  };
  let coverBackCalls = 0;
  game.onCoverBack = () => {
    coverBackCalls += 1;
  };

  const wrongFirst = game.cards.find((c) => c.pairId === "pair-0")!;
  const wrongSecond = game.cards.find((c) => c.pairId === "pair-1")!;
  const thirdCard = game.cards.find((c) => c.pairId === "pair-2")!;

  game.flip(wrongFirst.id);
  game.flip(wrongSecond.id);
  assert(mismatchCalls === 1, `onMismatch 應該剛好被觸發一次，實際 ${mismatchCalls} 次`);

  game.flip(thirdCard.id);
  const thirdAfterIgnoredFlip = game.cards.find((c) => c.id === thirdCard.id)!;
  assert(
    !thirdAfterIgnoredFlip.isFlipped,
    "已經翻開兩張、還在判定中時，第三次 flip() 呼叫應該被忽略，第三張卡片不該被翻開"
  );

  await new Promise((resolve) => setTimeout(resolve, 900));

  const afterFirst = game.cards.find((c) => c.id === wrongFirst.id)!;
  const afterSecond = game.cards.find((c) => c.id === wrongSecond.id)!;
  assert(!afterFirst.isFlipped && !afterSecond.isFlipped, "配對失敗延遲後，兩張卡片都應該恢復 isFlipped: false");
  assert(!afterFirst.isMatched && !afterSecond.isMatched, "配對失敗的兩張卡片都不該變成 isMatched: true");
  assert(coverBackCalls === 1, `配對失敗恢復時 onCoverBack 應該剛好被觸發一次，實際 ${coverBackCalls} 次`);

  game.flip(thirdCard.id);
  const thirdAfterUnlock = game.cards.find((c) => c.id === thirdCard.id)!;
  assert(thirdAfterUnlock.isFlipped, "判定期結束後，應該可以正常翻開新的卡片");

  console.log(
    "✅ 測試 4 通過：配對失敗觸發 onMismatch，延遲後正確恢復 isFlipped: false 並觸發 onCoverBack，判定期間第三次 flip() 被忽略。"
  );
}

// ---- 測試 5：過完第 1 關（還沒破完三關）觸發 onLevelComplete，phase 短暫變成
//      "levelComplete"，接著自動進入第 2 關：重新洗牌、重新倒數，倒數結束後這次要先
//      經過 "shuffling"（觸發 onShuffleStart，帶 1 組要互換的卡片 id），才進入 playing ----
{
  const game = newTestGame();
  await waitForPhase(game, "playing");

  let levelCompleteCalls: number[] = [];
  game.onLevelComplete = (level) => {
    levelCompleteCalls.push(level);
  };

  matchAllPairs(game);

  assert(levelCompleteCalls.length === 1 && levelCompleteCalls[0] === 1, "應該剛好觸發一次 onLevelComplete(1)");
  assert(game.phase === "levelComplete", `第 1 關全部配對完成後應該先進入 "levelComplete"，實際 "${game.phase}"`);
  assert(!game.isComplete, "只破了第 1 關，isComplete 不該是 true");

  // 等自動進入第 2 關（levelCompletePauseMs 之後）：重新洗牌、重新進入 reveal
  await waitForPhase(game, "reveal");
  assert(game.level === 2, `應該自動進入第 2 關，實際第 ${game.level} 關`);
  assert(
    game.cards.every((c) => c.isFlipped && !c.isMatched),
    "進入第 2 關時應該重新洗牌、全部卡片重新翻開"
  );

  let shuffleStartPairs: [string, string][] = [];
  game.onShuffleStart = (pairs) => {
    shuffleStartPairs = pairs;
  };

  await waitForPhase(game, "shuffling");
  assert(shuffleStartPairs.length === 1, `第 2 關應該互換 1 組（2 張）卡片，實際收到 ${shuffleStartPairs.length} 組`);

  await waitForPhase(game, "playing");

  console.log(
    "✅ 測試 5 通過：過第 1 關觸發 onLevelComplete、自動進入第 2 關重新洗牌，且第 2 關倒數結束後正確經過 shuffling（觸發 onShuffleStart）才進 playing。"
  );
}

// ---- 測試 6：連續破完三關才算真正 isComplete，且只在最後一關觸發 onComplete()
//      （第 1、2 關完成時只觸發 onLevelComplete，不會誤觸發 onComplete） ----
{
  const game = newTestGame();

  let completeCallCount = 0;
  game.onComplete = () => {
    completeCallCount += 1;
  };
  let levelCompleteCount = 0;
  game.onLevelComplete = () => {
    levelCompleteCount += 1;
  };

  for (let level = 1; level <= LEVEL_COUNT; level++) {
    await waitForPhase(game, "playing");
    matchAllPairs(game);
    if (level < LEVEL_COUNT) {
      assert(game.phase === "levelComplete", `第 ${level} 關過完應該先是 "levelComplete"`);
      assert(!game.isComplete, `第 ${level} 關過完還不算三關全破，isComplete 應該是 false`);
    }
  }

  assert(game.isComplete, "三關都過完後，isComplete 應該是 true");
  assert(game.phase === "complete", `三關全部過完後 phase 應該是 "complete"，實際 "${game.phase}"`);
  assert(completeCallCount === 1, `onComplete 應該剛好被觸發一次，實際 ${completeCallCount} 次`);
  assert(
    levelCompleteCount === LEVEL_COUNT - 1,
    `onLevelComplete 應該只在前 ${LEVEL_COUNT - 1} 關觸發，實際觸發 ${levelCompleteCount} 次`
  );
  assert(game.level === LEVEL_COUNT, `破完三關後 level 應該停在 ${LEVEL_COUNT}，實際 ${game.level}`);

  console.log("✅ 測試 6 通過：連續闖三關才算 isComplete，onComplete 只在最後一關觸發一次，前面每關只觸發 onLevelComplete。");
}

// ---- 測試 7：第 3 關（4 張卡片、兩組互換）要先後發生，不是同時——第一組 onShuffleStart
//      （只帶 1 組）觸發、真的互換完（onChange 反映新順序）之後，才輪到第二組
//      onShuffleStart 觸發，兩次呼叫之間卡片陣列的順序要不一樣（代表第一組真的先換完） ----
{
  const game = newTestGame();
  await waitForPhase(game, "playing");
  matchAllPairs(game); // 過第 1 關
  await waitForPhase(game, "playing"); // 進入第 2 關 playing
  matchAllPairs(game); // 過第 2 關
  await waitForPhase(game, "reveal"); // 進入第 3 關 reveal
  assert(game.level === 3, `應該進入第 3 關，實際第 ${game.level} 關`);

  const shuffleStartCalls: [string, string][][] = [];
  const cardOrderAtEachCall: string[][] = [];
  game.onShuffleStart = (pairs) => {
    shuffleStartCalls.push(pairs);
    cardOrderAtEachCall.push(game.cards.map((c) => c.id));
  };

  await waitForPhase(game, "playing");

  assert(
    shuffleStartCalls.length === 2,
    `第 3 關應該觸發兩次 onShuffleStart（先後各換一組），實際觸發 ${shuffleStartCalls.length} 次`
  );
  assert(
    shuffleStartCalls[0].length === 1 && shuffleStartCalls[1].length === 1,
    "第 3 關每次 onShuffleStart 都應該只帶 1 組（先後交換，不是同時帶 2 組）"
  );
  assert(
    JSON.stringify(cardOrderAtEachCall[0]) !== JSON.stringify(cardOrderAtEachCall[1]),
    "第二次 onShuffleStart 觸發時，卡片順序應該已經反映第一組換完之後的結果（代表兩組真的先後發生）"
  );

  console.log("✅ 測試 7 通過：第 3 關的兩組互換先後發生（各觸發一次 onShuffleStart，只帶 1 組），不是同時進行。");
}

console.log("\n✅ 全部 MemoryMatchGame 邏輯驗證通過。");
