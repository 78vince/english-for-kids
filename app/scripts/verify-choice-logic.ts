// 驗證 ChoiceGame 搭配真實 content/passages/family.json 能跑完全部理解題，
// 且答對/答錯分支都正確。
// 用法：npx tsx scripts/verify-choice-logic.ts

import { readFileSync } from "node:fs";
import { ChoiceGame } from "../src/choiceGame";
import type { Passage } from "../src/types";

const passage: Passage = JSON.parse(
  readFileSync(new URL("../../content/passages/family.json", import.meta.url), "utf-8")
);

console.log(`短文標題：${passage.title}`);
console.log(`理解題數：${passage.questions.length}（應為 3）`);
if (passage.questions.length !== 3) {
  throw new Error(`預期 3 題，實際 ${passage.questions.length} 題`);
}

const game = new ChoiceGame(passage);

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let safety = 0;
while (!game.isRoundComplete) {
  safety += 1;
  if (safety > 20) throw new Error("超過安全上限，可能卡住了");

  const q = game.currentQuestion;

  const wrongOption = q.options.find((o) => o !== q.answer);
  if (wrongOption) {
    game.selectOption(wrongOption);
    if (game.feedback !== "wrong") throw new Error("故意選錯，但沒有標記為 wrong");
    await sleep(750);
  }

  game.selectOption(q.answer);
  if (game.feedback !== "correct") {
    throw new Error("選對答案後 feedback 應該是 correct");
  }
  // 答對後畫面停在原地，要自己按「下一題」才會前進——這裡模擬使用者按下按鈕。
  game.advanceToNextQuestion();
}

console.log(`答對次數：${game.correctCount}（應為 3）`);
console.log(`答錯次數：${game.wrongCount}（應大於 0）`);

if (game.correctCount !== 3) throw new Error(`答對次數不對，預期 3 實際 ${game.correctCount}`);
if (game.wrongCount === 0) throw new Error("從未觸發答錯流程");

console.log("✅ ChoiceGame 邏輯驗證通過：短文理解題 3 題都能跑完，且答對/答錯回饋正常。");
