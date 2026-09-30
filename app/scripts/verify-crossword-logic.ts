// 驗證填字遊戲（CrosswordGame）的遊戲邏輯，比照 verify-memory-match-logic.ts 的做法：
// 直接 new 一個 CrosswordGame 實例跑各種情境，不碰 DOM（拖曳互動、渲染在
// crosswordStandalone.ts，需要瀏覽器才能測，這裡只測引擎本身）。
// 用法：npx tsx scripts/verify-crossword-logic.ts

import { CrosswordGame, blankCountForLevel, starsForMistakes, LEVEL_COUNT } from "../src/games/crosswordGame";
import type { Crossword } from "../src/types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

// 5 個格子的小型固定測試用關卡：CAT（across, (0,0)）跟 CAR（down, (0,0)）在 (0,0) 交疊，
// 交疊處字母都是 "C"，跟 content 端實際的 houses_apartments 關卡同一種排版邏輯，只是
// 縮小成方便手算的尺寸：
//   row0: C A T
//   row1: A . .
//   row2: R . .
// 全部格子：(0,0)C (0,1)A (0,2)T (1,0)A (2,0)R —— 共 5 格。
const testCrossword: Crossword = {
  id: "crossword.test.fixture",
  topicFileKey: "test_topic",
  title: "測試關卡",
  hintZh: "測試提示文字",
  gridWidth: 3,
  gridHeight: 3,
  words: [
    { vocabId: "voc.test.001", en: "CAT", zh: "貓", row: 0, col: 0, direction: "across" },
    { vocabId: "voc.test.002", en: "CAR", zh: "車", row: 0, col: 0, direction: "down" },
  ],
};

function newTestGame(levelCompletePauseMs = 20): CrosswordGame {
  return new CrosswordGame(testCrossword, levelCompletePauseMs);
}

async function waitForPhase(game: CrosswordGame, phase: string, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (game.phase !== phase) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`❌ 等待 phase 變成 "${phase}" 逾時，目前是 "${game.phase}"`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

// ---- 測試 1：建構子正確把交疊字組出 5 個格子，交疊處 (0,0) 字母是 "C"；建構子完成後
//      應該處於 "playing" 階段、level 1 ----
{
  const game = newTestGame();
  assert(game.cells.length === 5, `5 格的測試關卡應該算出 5 個格子，實際 ${game.cells.length} 格`);
  // 用 game.cells（不受這一關「哪些格子被挖空」影響的原始正確答案）驗證交疊處字母，
  // 不要用 displayLetterAt()——那個方法對「這一關剛好把 (0,0) 挑成空格、還沒填」的
  // 情況會回傳 null（這是正確行為，不是 bug），拿來驗證交疊處「正確答案」會隨機失敗。
  const overlapCell = game.cells.find((c) => c.row === 0 && c.col === 0);
  assert(overlapCell?.letter === "C", `座標 (0,0) 交疊處的正確答案應該是 "C"，實際 "${overlapCell?.letter}"`);
  assert(game.hasCell(0, 0) && game.hasCell(2, 0), "(0,0)／(2,0) 應該屬於網格");
  assert(!game.hasCell(1, 1), "(1,1) 不屬於任何單字，應該回傳 false（版面留白格）");
  assert(game.phase === "playing", `建構子完成後應該處於 "playing" 階段，實際 "${game.phase}"`);
  assert(game.level === 1, `一開局應該是第 1 關，實際第 ${game.level} 關`);
  assert(game.mistakeCount === 0, "一開局錯誤次數應該是 0");
  console.log("✅ 測試 1 通過：建構子正確組出交疊網格，交疊處字母一致，一開局處於 playing 階段、第 1 關。");
}

// ---- 測試 2：blankCountForLevel() 三關比例遞增，且第 3 關即使比例算出來的數字更高，
//      也會被夾在「總格數 - 2」以內，至少留 2 格已知字母 ----
{
  assert(blankCountForLevel(1, 5) === 2, `5 格第 1 關（40%）應該挖空 2 格，實際 ${blankCountForLevel(1, 5)}`);
  assert(blankCountForLevel(2, 5) === 3, `5 格第 2 關（65%）應該挖空 3 格，實際 ${blankCountForLevel(2, 5)}`);
  // round(5*0.875)=4，但要留 2 格已知，夾成 5-2=3
  assert(blankCountForLevel(3, 5) === 3, `5 格第 3 關應該被夾在最多挖空 3 格（留 2 格已知），實際 ${blankCountForLevel(3, 5)}`);
  // 跟 content 端實際關卡（15 格）同一組數字，對應 handoff 給的範例：6 / 10 / 13
  assert(blankCountForLevel(1, 15) === 6, `15 格第 1 關應該挖空 6 格，實際 ${blankCountForLevel(1, 15)}`);
  assert(blankCountForLevel(2, 15) === 10, `15 格第 2 關應該挖空 10 格，實際 ${blankCountForLevel(2, 15)}`);
  assert(blankCountForLevel(3, 15) === 13, `15 格第 3 關應該挖空 13 格（留 2 格已知），實際 ${blankCountForLevel(3, 15)}`);
  console.log("✅ 測試 2 通過：blankCountForLevel() 三關比例遞增，第 3 關正確被夾在留 2 格已知字母以內。");
}

// ---- 測試 3：starsForMistakes() 門檻邊界值（2026-09-30 從 1-3 顆改成 1-5 顆）----
{
  assert(starsForMistakes(0) === 5, "0 次錯誤應該是 5 顆星");
  assert(starsForMistakes(1) === 4, "1 次錯誤應該降到 4 顆星（1-2 次門檻）");
  assert(starsForMistakes(2) === 4, "2 次錯誤應該還是 4 顆星");
  assert(starsForMistakes(3) === 3, "3 次錯誤應該降到 3 顆星（3-4 次門檻）");
  assert(starsForMistakes(4) === 3, "4 次錯誤應該還是 3 顆星");
  assert(starsForMistakes(5) === 2, "5 次錯誤應該降到 2 顆星（5-7 次門檻）");
  assert(starsForMistakes(7) === 2, "7 次錯誤應該還是 2 顆星");
  assert(starsForMistakes(8) === 1, "8 次錯誤應該降到 1 顆星（8 次以上門檻）");
  assert(starsForMistakes(100) === 1, "100 次錯誤應該還是 1 顆星（下限）");
  console.log("✅ 測試 3 通過：starsForMistakes() 五個門檻的邊界值都正確。");
}

// ---- 測試 4：字母區磚的數量／字母種類剛好等於這一關全部空格需要的正確字母（不多給、
//      不少給），且答錯字母不會被移除、也不會被標記完成，會累計 mistakeCount ----
{
  const game = newTestGame();
  const blankCells = game.cells.filter((c) => game.isBlankCell(c.row, c.col));
  assert(game.letterTray.length === blankCells.length, "字母區磚的數量應該剛好等於這一關空格數");
  const trayLetters = [...game.letterTray.map((t) => t.letter)].sort();
  const blankLetters = [...blankCells.map((c) => c.letter)].sort();
  assert(
    JSON.stringify(trayLetters) === JSON.stringify(blankLetters),
    `字母區的字母種類應該跟空格需要的正確字母完全一致（不多給不少給），實際字母區 ${JSON.stringify(trayLetters)}，` +
      `空格需要 ${JSON.stringify(blankLetters)}`
  );

  const someBlank = blankCells[0];
  const wrongTile = game.letterTray.find((t) => t.letter !== someBlank.letter);
  if (wrongTile) {
    let wrongDropCalls = 0;
    game.onWrongDrop = () => {
      wrongDropCalls += 1;
    };
    const result = game.dropLetter(someBlank.row, someBlank.col, wrongTile.id);
    assert(result === false, "字母不對的 dropLetter() 應該回傳 false");
    assert(game.mistakeCount === 1, `答錯應該累計 1 次錯誤，實際 ${game.mistakeCount}`);
    assert(wrongDropCalls === 1, `onWrongDrop 應該剛好被觸發一次，實際 ${wrongDropCalls}`);
    assert(
      game.letterTray.some((t) => t.id === wrongTile.id),
      "答錯的字母磚不應該被移出字母區"
    );
    assert(game.displayLetterAt(someBlank.row, someBlank.col) === null, "答錯之後這個空格應該還是顯示空白");
  }

  console.log("✅ 測試 4 通過：字母區磚的數量/種類剛好對應空格需求，答錯正確累計 mistakeCount、不移除磚、不標記完成。");
}

// ---- 測試 5：拖對字母之後磚固定進格子、從字母區移除，觸發 onCorrectDrop；把某一關
//      全部空格填滿（還沒破完三關）觸發 onLevelComplete，自動進入下一關（重新挑空格、
//      重新排列字母區） ----
{
  const game = newTestGame();
  let correctDropCalls = 0;
  game.onCorrectDrop = () => {
    correctDropCalls += 1;
  };
  let levelCompleteCalls: number[] = [];
  game.onLevelComplete = (level) => {
    levelCompleteCalls.push(level);
  };

  const blankCells = [...game.cells.filter((c) => game.isBlankCell(c.row, c.col))];
  for (const cell of blankCells) {
    const tile = game.letterTray.find((t) => t.letter === cell.letter)!;
    const result = game.dropLetter(cell.row, cell.col, tile.id);
    assert(result === true, `座標 (${cell.row},${cell.col}) 答對應該回傳 true`);
  }

  assert(correctDropCalls === blankCells.length, `onCorrectDrop 應該被觸發 ${blankCells.length} 次，實際 ${correctDropCalls}`);
  assert(levelCompleteCalls.length === 1 && levelCompleteCalls[0] === 1, "應該剛好觸發一次 onLevelComplete(1)");
  assert(game.phase === "levelComplete", `第 1 關全部填滿後應該先進入 "levelComplete"，實際 "${game.phase}"`);
  assert(!game.isComplete, "只破了第 1 關，isComplete 不該是 true");

  await waitForPhase(game, "playing");
  assert(game.level === 2, `應該自動進入第 2 關，實際第 ${game.level} 關`);
  const level2BlankCount = game.cells.filter((c) => game.isBlankCell(c.row, c.col)).length;
  assert(
    game.letterTray.length === level2BlankCount,
    "進入第 2 關時字母區應該重新洗牌成第 2 關的空格數量"
  );

  console.log(
    "✅ 測試 5 通過：答對字母正確固定進格子、觸發 onCorrectDrop，過完第 1 關觸發 onLevelComplete 並自動進入第 2 關重新排列。"
  );
}

// ---- 測試 6：連續破完三關才算真正 isComplete，且用三關加總的錯誤次數換算出正確星等，
//      onComplete 只在最後一關觸發一次 ----
{
  const game = newTestGame();
  let completeCalls: number[] = [];
  game.onComplete = (stars) => {
    completeCalls.push(stars);
  };

  // 故意在第 1 關製造 1 次錯誤，其餘全部答對——三關加總應該剛好 1 次錯誤，換算 4 顆星
  // （2026-09-30 星等改成 1-5 顆之後，1 次錯誤落在新門檻的 4 顆星那一段）。
  let firstMistakeMade = false;
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    await waitForPhase(game, "playing");
    const blankCells = [...game.cells.filter((c) => game.isBlankCell(c.row, c.col))];
    for (const cell of blankCells) {
      if (!firstMistakeMade) {
        const wrongTile = game.letterTray.find((t) => t.letter !== cell.letter);
        if (wrongTile) {
          game.dropLetter(cell.row, cell.col, wrongTile.id);
          firstMistakeMade = true;
        }
      }
      const tile = game.letterTray.find((t) => t.letter === cell.letter)!;
      game.dropLetter(cell.row, cell.col, tile.id);
    }
    if (level < LEVEL_COUNT) {
      assert(game.phase === "levelComplete", `第 ${level} 關過完應該先是 "levelComplete"`);
      assert(!game.isComplete, `第 ${level} 關過完還不算三關全破，isComplete 應該是 false`);
    }
  }

  assert(game.isComplete, "三關都過完後，isComplete 應該是 true");
  assert(game.phase === "complete", `三關全部過完後 phase 應該是 "complete"，實際 "${game.phase}"`);
  assert(game.mistakeCount === 1, `三關加總應該剛好 1 次錯誤，實際 ${game.mistakeCount}`);
  assert(completeCalls.length === 1, `onComplete 應該剛好被觸發一次，實際 ${completeCalls.length} 次`);
  assert(completeCalls[0] === 4, `1 次錯誤應該換算成 4 顆星，實際 ${completeCalls[0]} 顆星`);
  assert(game.level === LEVEL_COUNT, `破完三關後 level 應該停在 ${LEVEL_COUNT}，實際 ${game.level}`);

  console.log(
    "✅ 測試 6 通過：連續闖三關才算 isComplete，onComplete 只在最後一關觸發一次，星等正確依三關加總錯誤次數換算。"
  );
}

// ---- 測試 7：交疊處字母不一致的排版資料應該在建構子直接丟例外（content 端排版資料
//      壞掉時的執行期最後一道保險） ----
{
  const badCrossword: Crossword = {
    id: "crossword.test.bad",
    topicFileKey: "test_topic",
    title: "壞掉的測試關卡",
    hintZh: "測試提示文字",
    gridWidth: 3,
    gridHeight: 3,
    words: [
      { vocabId: "voc.test.001", en: "CAT", zh: "貓", row: 0, col: 0, direction: "across" },
      // DOG 的第一個字母 D 跟 CAT 的第一個字母 C 在 (0,0) 交疊，字母不一致，應該丟例外。
      { vocabId: "voc.test.003", en: "DOG", zh: "狗", row: 0, col: 0, direction: "down" },
    ],
  };
  let threw = false;
  try {
    new CrosswordGame(badCrossword);
  } catch {
    threw = true;
  }
  assert(threw, "交疊處字母不一致的排版資料應該讓建構子丟出例外");
  console.log("✅ 測試 7 通過：交疊處字母不一致時建構子正確丟出例外。");
}

console.log("\n✅ 全部 CrosswordGame 邏輯驗證通過。");
