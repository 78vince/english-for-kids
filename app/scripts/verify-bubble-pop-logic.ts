// 驗證戳泡泡遊戲（BubblePopGame）的核心遊戲邏輯
// 比照 verify-memory-match-logic.ts 與 verify-crossword-logic.ts
// 用法：npx tsx scripts/verify-bubble-pop-logic.ts

import {
  BubblePopGame,
  BUBBLE_POP_WORDS,
  DEFAULT_COLOR_WORDS,
  LEVEL_CONFIGS,
  LEVEL_COUNT,
  generateBubbles,
  distributeBubblesAcross4Layers,
  ROW_COUNT,
  COL_COUNT,
  starsForMistakes,
  stripAdjectiveSuffix,
  COLOR_VOCAB_IDS,
} from "../src/games/bubblePopGame";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

console.log("--- 開始驗證戳泡泡遊戲邏輯 ---");

// ---- 測試 1：134 個多主題候選詞與 stripAdjectiveSuffix() ----
{
  assert(BUBBLE_POP_WORDS.length === 134, `題庫應擴充為 134 個單字，實際 ${BUBBLE_POP_WORDS.length}`);
  assert(DEFAULT_COLOR_WORDS.length === 134, "DEFAULT_COLOR_WORDS 應作為向下相容別名");

  // 驗證 7 大主題皆有收錄
  const topics = new Set(BUBBLE_POP_WORDS.map((w) => w.topic));
  const expectedTopics = ["colors", "animals_insects", "food_drink", "transportation", "parts_of_body", "weather_nature", "school"];
  for (const t of expectedTopics) {
    assert(topics.has(t), `題庫缺少主題: ${t}`);
  }

  // 驗證所有單字長度落在 3 ~ 7 字母，且無空格
  for (const w of BUBBLE_POP_WORDS) {
    assert(w.en.length >= 3 && w.en.length <= 7, `${w.en} 長度超出 [3, 7] 範圍`);
    assert(!w.en.includes(" "), `${w.en} 包含空格`);
    assert(!w.cleanZh.endsWith("的"), `${w.vocabId} cleanZh 依然以「的」結尾: ${w.cleanZh}`);
    assert(!w.cleanZh.includes("（"), `${w.vocabId} cleanZh 包含未清理之括號: ${w.cleanZh}`);
  }

  // 驗證顏色主題包含指定純顏色
  const colorWords = BUBBLE_POP_WORDS.filter((w) => w.topic === "colors");
  assert(colorWords.length === 14, `顏色主題應包含 14 個純顏色詞，實際 ${colorWords.length}`);
  const idSet = new Set(colorWords.map((w) => w.vocabId));
  for (const id of COLOR_VOCAB_IDS) {
    assert(idSet.has(id), `缺少指定顏色詞: ${id}`);
  }

  assert(stripAdjectiveSuffix("紅色的") === "紅色", "紅色的 應轉為 紅色");
  assert(stripAdjectiveSuffix("粉紅色的") === "粉紅色", "粉紅色的 應轉為 粉紅色");
  assert(stripAdjectiveSuffix("靛藍色的（彩虹七色之一）") === "靛藍色", "靛藍色括號與的字應被移除");
  assert(stripAdjectiveSuffix("金色的") === "金色", "金色的 應轉為 金色");

  console.log("✅ 測試 1 通過：134 個多主題單字（覆蓋 7 大主題）與 stripAdjectiveSuffix() 正確運作。");
}

// ---- 測試 2：generateBubbles() 泡泡數量與包含所有正確字母（含重複字母） ----
{
  const targetWord = "YELLOW"; // 含重複字母 L*2
  const decoyCount = 5;
  const bubbles = generateBubbles(targetWord, decoyCount);

  assert(bubbles.length === targetWord.length + decoyCount, `泡泡總數應為 ${targetWord.length + decoyCount}，實際 ${bubbles.length}`);
  assert(bubbles.every((b) => !b.popped), "開場時所有泡泡都不該是 popped");

  // 驗證目標單字的每個字母在 bubbles 中出現的次數至少等於目標單字所需數量
  const bubbleLetters = bubbles.map((b) => b.letter);
  const letterCounts: Record<string, number> = {};
  for (const l of bubbleLetters) {
    letterCounts[l] = (letterCounts[l] || 0) + 1;
  }

  for (const char of targetWord) {
    const requiredCount = targetWord.split("").filter((c) => c === char).length;
    assert(
      (letterCounts[char] || 0) >= requiredCount,
      `字母 ${char} 在泡泡中數量不足: 需要 ${requiredCount}，實際 ${letterCounts[char]}`
    );
  }

  console.log("✅ 測試 2 通過：generateBubbles() 泡泡數量及字母完整度正確（含重複字母）。");
}

// ---- 測試 2b：驗證從第 1 關起，泡泡固定分佈在 4 個垂直層級中且無同層重疊 ----
{
  // 測試各關卡泡泡總數（第 1 關 6 顆至第 5 關 14 顆）
  for (let total = 6; total <= 14; total++) {
    const slots = distributeBubblesAcross4Layers(total);
    assert(slots.length === total, `總槽位應為 ${total}，實際 ${slots.length}`);

    // 驗證 row 0, 1, 2, 3 每層至少有 1 顆泡泡（完整分佈在四層）
    const rowCounts = [0, 0, 0, 0];
    const rowCols: Set<number>[] = [new Set(), new Set(), new Set(), new Set()];

    for (const slot of slots) {
      assert(slot.row >= 0 && slot.row < ROW_COUNT, `row 超出範圍: ${slot.row}`);
      assert(slot.col >= 0 && slot.col < COL_COUNT, `col 超出範圍: ${slot.col}`);
      rowCounts[slot.row]++;
      assert(!rowCols[slot.row].has(slot.col), `同層 row ${slot.row} 出現重複欄位 col ${slot.col}`);
      rowCols[slot.row].add(slot.col);
    }

    for (let r = 0; r < ROW_COUNT; r++) {
      assert(rowCounts[r] >= 1, `第 ${r} 層未分配到泡泡 (總數 ${total})`);
    }
  }

  // 實際透過 generateBubbles 驗證座標範圍
  const testBubbles = generateBubbles("RED", 3); // 第 1 關：6 顆泡泡
  assert(testBubbles.length === 6, "第 1 關應生成 6 顆泡泡");
  const uniqueRows = new Set(testBubbles.map((b) => b.row));
  assert(uniqueRows.size === 4, `第 1 關泡泡必須分佈在全部 4 個垂直層級，實際覆蓋 ${uniqueRows.size} 層`);

  for (const b of testBubbles) {
    assert(b.xPercent >= 8 && b.xPercent <= 90, `xPercent 超出安全範圍: ${b.xPercent}`);
    assert(b.yPercent >= 10 && b.yPercent <= 84, `yPercent 超出安全範圍: ${b.yPercent}`);
  }

  console.log("✅ 測試 2b 通過：從第 1 關起泡泡保證完整分佈在 4 個垂直層級，同層無重疊且座標均在安全範圍。");
}

// ---- 測試 3：五個關卡設定與候選字範圍 ----
{
  assert(LEVEL_COUNT === 5, `關卡總數應為 5，實際 ${LEVEL_COUNT}`);
  assert(LEVEL_CONFIGS[0].wordLengthRange[0] === 3 && LEVEL_CONFIGS[0].wordLengthRange[1] === 4, "關卡 1 範圍應為 3-4");
  assert(LEVEL_CONFIGS[0].decoyCount === 3, "關卡 1 干擾數應為 3");

  assert(LEVEL_CONFIGS[1].wordLengthRange[0] === 4 && LEVEL_CONFIGS[1].wordLengthRange[1] === 5, "關卡 2 範圍應為 4-5");
  assert(LEVEL_CONFIGS[1].decoyCount === 4, "關卡 2 干擾數應為 4");

  assert(LEVEL_CONFIGS[2].wordLengthRange[0] === 5 && LEVEL_CONFIGS[2].wordLengthRange[1] === 5, "關卡 3 範圍應為 5-5");
  assert(LEVEL_CONFIGS[2].decoyCount === 5, "關卡 3 干擾數應為 5");

  assert(LEVEL_CONFIGS[3].wordLengthRange[0] === 5 && LEVEL_CONFIGS[3].wordLengthRange[1] === 6, "關卡 4 範圍應為 5-6");
  assert(LEVEL_CONFIGS[3].decoyCount === 6, "關卡 4 干擾數應為 6");

  assert(LEVEL_CONFIGS[4].wordLengthRange[0] === 6 && LEVEL_CONFIGS[4].wordLengthRange[1] === 7, "關卡 5 範圍應為 6-7");
  assert(LEVEL_CONFIGS[4].decoyCount === 7, "關卡 5 干擾數應為 7");

  // 檢查 BUBBLE_POP_WORDS 中每個關卡都有充裕數量的候選字
  for (let i = 0; i < LEVEL_CONFIGS.length; i++) {
    const [minLen, maxLen] = LEVEL_CONFIGS[i].wordLengthRange;
    const words = BUBBLE_POP_WORDS.filter((w) => w.en.length >= minLen && w.en.length <= maxLen);
    assert(words.length >= 20, `第 ${i + 1} 關候選字應充足 (>=20)，實際有 ${words.length} 字`);
  }

  console.log("✅ 測試 3 通過：LEVEL_CONFIGS 五關難度階梯與候選字均充裕符合規範。");
}

// ---- 測試 3b：starsForMistakes() 門檻邊界值（比照 prompt-star-rating-mechanism.md）----
{
  assert(starsForMistakes(0) === 5, "0 次錯誤應該是 5 顆星");
  assert(starsForMistakes(1) === 4, "1 次錯誤應該是 4 顆星（1-2 次門檻）");
  assert(starsForMistakes(2) === 4, "2 次錯誤應該還是 4 顆星");
  assert(starsForMistakes(3) === 3, "3 次錯誤應該是 3 顆星（3-4 次門檻）");
  assert(starsForMistakes(4) === 3, "4 次錯誤應該還是 3 顆星");
  assert(starsForMistakes(5) === 2, "5 次錯誤應該是 2 顆星（5-7 次門檻）");
  assert(starsForMistakes(7) === 2, "7 次錯誤應該還是 2 顆星");
  assert(starsForMistakes(8) === 1, "8 次錯誤應該是 1 顆星（8 次以上門檻）");
  assert(starsForMistakes(50) === 1, "50 次錯誤應該還是 1 顆星（下限）");
  console.log("✅ 測試 3b 通過：starsForMistakes() 五個門檻的邊界值完全正確。");
}

// ---- 測試 4：答題邏輯（正確點破、錯誤飄移不消失、累計 wrongCount、依序拼字） ----
{
  const fixtureWords = [
    { vocabId: "voc.test.001", en: "RED", zh: "紅色的", cleanZh: "紅色" },
    { vocabId: "voc.test.002", en: "GREEN", zh: "綠色的", cleanZh: "綠色" },
    { vocabId: "voc.test.003", en: "PURPLE", zh: "紫色的", cleanZh: "紫色" },
  ];
  const fixtureConfigs = [
    { wordLengthRange: [3, 3] as [number, number], decoyCount: 2 },
    { wordLengthRange: [5, 5] as [number, number], decoyCount: 2 },
    { wordLengthRange: [6, 6] as [number, number], decoyCount: 2 },
  ];

  let wrongPopTriggeredId: string | null = null;
  const game = new BubblePopGame(fixtureWords, fixtureConfigs, 10);
  game.onWrongPop = (id) => {
    wrongPopTriggeredId = id;
  };

  assert(game.level === 1, "初始應為第 1 關");
  assert(game.targetWord === "RED", `第 1 關單字應為 RED，實際為 ${game.targetWord}`);
  assert(game.progressIndex === 0, "初始進度應為 0");
  assert(game.wrongCount === 0, "初始錯誤次數應為 0");

  let changeTriggeredOnWrong = false;
  game.onChange = () => {
    changeTriggeredOnWrong = true;
  };

  // 找一顆不是 'R' 的泡泡點破（測試點錯情況）
  const wrongBubble = game.bubbles.find((b) => b.letter !== "R");
  assert(!!wrongBubble, "應能找到干擾泡泡");
  game.popBubble(wrongBubble!.id);

  assert(game.wrongCount === 1, "點錯泡泡後 wrongCount 應為 1");
  assert(wrongBubble!.popped === false, "點錯泡泡後該泡泡不該被標記為 popped");
  assert(wrongPopTriggeredId === wrongBubble!.id, "onWrongPop 應被觸發並帶入泡泡 ID");
  assert(game.progressIndex === 0, "點錯泡泡 progressIndex 不應前進");
  assert(!changeTriggeredOnWrong, "點錯泡泡不該觸發 onChange（避免全畫面重置）");

  // 正確依序點破 R -> E -> D
  const rBubble = game.bubbles.find((b) => b.letter === "R" && !b.popped);
  assert(!!rBubble, "應能找到 R 泡泡");
  game.popBubble(rBubble!.id);

  assert(rBubble!.popped === true, "R 泡泡應被標記為 popped");
  assert(game.progressIndex === 1, "progressIndex 應前進到 1");

  // 嘗試再點一次已經 popped 的 R 泡泡
  game.popBubble(rBubble!.id);
  assert(game.progressIndex === 1, "重複點擊已破泡泡不應有任何反應");

  // 嘗試點 D（跳過 E）
  const dBubble = game.bubbles.find((b) => b.letter === "D" && !b.popped);
  assert(!!dBubble, "應能找到 D 泡泡");
  game.popBubble(dBubble!.id);
  assert(game.wrongCount === 2, "未依序拼字應計為答錯");
  assert(dBubble!.popped === false, "未依序拼字該泡泡不該破裂");

  // 點 E
  const eBubble = game.bubbles.find((b) => b.letter === "E" && !b.popped);
  assert(!!eBubble, "應能找到 E 泡泡");
  game.popBubble(eBubble!.id);
  assert(eBubble!.popped === true, "E 泡泡應破裂");
  assert(game.progressIndex === 2, "progressIndex 應前進到 2");

  // 點 D
  game.popBubble(dBubble!.id);
  assert(dBubble!.popped === true, "D 泡泡應破裂");
  assert(game.progressIndex === 3, "progressIndex 應前進到 3");
  assert(game.phase === "levelComplete", "單字完成後狀態應為 levelComplete");

  console.log("✅ 測試 4 通過：依序點破、錯誤飄移保留、進度與狀態切換完全符合預期。");
}

// ---- 測試 5：完整五關過關至 complete 流程（手動 nextLevel 進入下一關） ----
async function testFullGameRun() {
  const fixtureWords = [
    { vocabId: "voc.test.001", en: "RED", zh: "紅色的", cleanZh: "紅色" },
    { vocabId: "voc.test.002", en: "BLUE", zh: "藍色的", cleanZh: "藍色" },
    { vocabId: "voc.test.003", en: "GREEN", zh: "綠色的", cleanZh: "綠色" },
    { vocabId: "voc.test.004", en: "YELLOW", zh: "黃色的", cleanZh: "黃色" },
    { vocabId: "voc.test.005", en: "PURPLE", zh: "紫色的", cleanZh: "紫色" },
  ];
  const fixtureConfigs = [
    { wordLengthRange: [3, 4] as [number, number], decoyCount: 3 },
    { wordLengthRange: [4, 5] as [number, number], decoyCount: 4 },
    { wordLengthRange: [5, 5] as [number, number], decoyCount: 5 },
    { wordLengthRange: [5, 6] as [number, number], decoyCount: 6 },
    { wordLengthRange: [6, 6] as [number, number], decoyCount: 7 },
  ];

  let completed = false;
  let receivedStars = 0;
  const game = new BubblePopGame(fixtureWords, fixtureConfigs, 10);
  game.onComplete = (stars) => {
    completed = true;
    receivedStars = stars;
  };

  for (let lvl = 1; lvl <= 5; lvl++) {
    assert(game.level === lvl, `目前應在第 ${lvl} 關`);
    const word = game.targetWord;
    for (let charIndex = 0; charIndex < word.length; charIndex++) {
      const char = word[charIndex];
      const bubble = game.bubbles.find((b) => b.letter === char && !b.popped);
      assert(!!bubble, `在第 ${lvl} 關應能找到未破裂的字母 ${char}`);
      game.popBubble(bubble!.id);
    }

    if (lvl < 5) {
      assert(game.phase === "levelComplete", `第 ${lvl} 關拼完應停留在 levelComplete，等候手動下一關`);
      game.nextLevel();
    } else {
      assert(game.phase === "complete", "第 5 關拼完應進入 complete");
    }
  }

  assert(completed === true, "五關破完後應觸發 onComplete()");
  assert(receivedStars === 5, `0 次失誤應得到 5 顆星，實際得到 ${receivedStars}`);
  console.log("✅ 測試 5 通過：五關手動 nextLevel() 進階與最終通關星等評鑑流程完整通過。");
}

testFullGameRun().catch((err) => {
  console.error(err);
  process.exit(1);
});
