// 驗證 FillBlankGame 搭配真實 content/sentences/family.json + content/vocab/family.json
// 能對全部 4 句都成功產生填空題，並且答對/答錯分支都正確。
// 用法：npx tsx scripts/verify-fillblank-logic.ts

import { readFileSync } from "node:fs";
import { FillBlankGame } from "../src/fillBlankGame";
import type { Sentence, Vocab } from "../src/types";

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf-8"));
}

const allVocab = loadJson<Vocab[]>("../../content/vocab/family.json");
const playableVocab = allVocab.filter((v) => v.status === "published");

const allSentences = loadJson<Sentence[]>("../../content/sentences/family.json");
const sentences = allSentences.filter(
  (s) => s.topic === "family" && s.stage === "B" && s.status === "published"
);

console.log(`句子數：${sentences.length}（應為 4）`);

const game = new FillBlankGame(sentences, playableVocab);
console.log(`成功產生的填空題數：${game.totalQuestions}（應為 4，代表每句都能挖到空）`);
if (game.totalQuestions !== 4) {
  throw new Error(`預期 4 題，實際 ${game.totalQuestions} 題`);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let safety = 0;
while (!game.isRoundComplete) {
  safety += 1;
  if (safety > 50) throw new Error("超過安全上限，可能卡住了");

  const q = game.currentQuestion;

  // 先故意選一個錯的選項（如果有的話），驗證答錯分支
  const wrongOption = q.options.find((o) => o.vocabId !== q.correctVocabId);
  if (wrongOption) {
    game.selectOption(wrongOption.vocabId);
    if (game.feedback !== "wrong") throw new Error("故意選錯，但沒有標記為 wrong");
    await sleep(750);
  }

  // 再選正確答案
  game.selectOption(q.correctVocabId);
  if (game.feedback !== "correct") {
    throw new Error("選對答案後 feedback 應該是 correct");
  }
  // 答對後畫面停在原地，要自己按「下一題」才會前進——這裡模擬使用者按下按鈕。
  game.advanceToNextQuestion();
}

console.log(`答對次數：${game.correctCount}（應為 4）`);
console.log(`答錯次數：${game.wrongCount}（應大於 0）`);

if (game.correctCount !== 4) throw new Error(`答對次數不對，預期 4 實際 ${game.correctCount}`);
if (game.wrongCount === 0) throw new Error("從未觸發答錯流程");

console.log("✅ FillBlankGame 邏輯驗證通過：4 句都能挖空出題，且答對/答錯回饋正常。");
