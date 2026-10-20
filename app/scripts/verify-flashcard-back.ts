// 驗證字卡暖身的「← 上一張」與「← 回看這一組字卡」（使用者回饋：還沒作答前想往回看先前的字卡）：
// 1. 字卡階段：每組第 1 張不能再往回；往回會回到上一張、自動唸單字（onCardShown）；往回再往前順序不變。
// 2. 進入這一組測驗、還沒作答前可以回看字卡，回到這一組最後一張；回看後重新開始測驗照常出題。
// 3. 這一組只要作答過任何一題（答對或答錯）就不能再回看；換到下一組後又可以。
// 4. 回看／上一張都不改答對、答錯、已學會的計數。
// 5. 「跳過字卡」模式沒有字卡可看，不提供回看。
// 用法：npx tsx scripts/verify-flashcard-back.ts

import { readFileSync } from "node:fs";
import type { Vocab } from "../src/types";

const VOCAB_PATH = "../../content/vocab/family.json";

(globalThis as any).window = {
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const { FlashcardGame } = await import("../src/flashcardGame");
const vocab = (JSON.parse(readFileSync(new URL(VOCAB_PATH, import.meta.url), "utf-8")) as Vocab[]).filter(
  (v) => v.status === "published"
);
assert(vocab.length >= 6, "測試用單字至少要 6 個");

const g = new FlashcardGame(vocab, 6, 3);
const spoken: string[] = [];
g.onCardShown = (v) => spoken.push(v.en);
const counts = () => `${g.correctCount}/${g.wrongCount}/${g.masteredCount}`;

// ---- 1. 字卡階段的「上一張」 ----
assert(g.phase === "card" && g.cardPositionInGroup === 1, "一開始在第 1 張字卡");
assert(!g.canGoBackCard, "第 1 張不能再往回");
const firstId = g.currentVocab.id;
g.previousCard();
assert(g.cardPositionInGroup === 1 && g.currentVocab.id === firstId, "第 1 張按上一張不會有任何變化");
assert(g.groupCardCount >= 2, "測試需要一組至少 2 張字卡");
const order: string[] = [firstId];
while (g.cardPositionInGroup < g.groupCardCount) {
  g.advanceCard();
  order.push(g.currentVocab.id);
}
assert(g.canGoBackCard, "第 2 張以後可以往回");
g.previousCard();
assert(g.currentVocab.id === order[order.length - 2], "上一張回到前一張字卡");
assert(spoken[spoken.length - 1] === g.currentVocab.en, "往回時一樣自動唸一次單字");
g.advanceCard();
assert(g.currentVocab.id === order[order.length - 1], "往回再往前，順序不變");
assert(counts() === "0/0/0", "字卡往返不影響計數");
console.log("✅ 1. 字卡階段「← 上一張」正確（第 1 張不能往回、順序不變、會唸單字）");

// ---- 2. 測驗作答前回看字卡 ----
g.advanceCard();
assert(g.phase === "quiz" && g.quizQuestion !== null, "看完這一組字卡進入測驗");
assert(g.canReviewCards, "這一組還沒作答前可以回看字卡");
g.backToCards();
assert(g.phase === "card", "回看後回到字卡階段");
assert(g.currentVocab.id === order[order.length - 1] && g.cardPositionInGroup === g.groupCardCount, "回到這一組最後一張字卡");
assert(g.canGoBackCard, "回看後可以繼續往前翻");
g.previousCard();
assert(g.currentVocab.id === order[order.length - 2], "回看後往前翻一張");
g.advanceCard();
g.advanceCard();
assert(g.phase === "quiz" && g.quizQuestion !== null && g.canReviewCards, "回看後重新開始測驗，照常出題");
assert(counts() === "0/0/0", "回看字卡不影響計數");
console.log("✅ 2. 作答前「← 回看這一組字卡」正確");

// ---- 3. 作答後不能回看 ----
const q = g.quizQuestion!;
const wrong = q.options.find((o) => o !== q.answer)!;
g.selectQuizOption(wrong);
assert(!g.canReviewCards, "答錯後不能回看");
g.backToCards();
assert(g.phase === "quiz" && g.feedback === "wrong", "答錯後呼叫 backToCards() 不會有作用");
g.continueAfterWrong();
assert(g.phase === "quiz" && !g.canReviewCards, "同一組換下一題後仍不能回看");
assert(counts() === "0/1/0", "計數只反映實際作答（答錯 1 次）");
let guard = 0;
while (g.phase === "quiz" && guard++ < 50) {
  g.selectQuizOption(g.quizQuestion!.answer);
  assert(!g.canReviewCards, "答對後也不能回看");
  g.advanceToNextWord();
}
assert(g.phase === "card" && !g.isRoundComplete, "這一組答完進入下一組字卡");
assert(g.cardPositionInGroup === 1 && !g.canGoBackCard, "下一組從第 1 張開始，不能跨組往回");
while (g.phase === "card") g.advanceCard();
assert(g.canReviewCards, "新的一組在作答前又可以回看");
console.log("✅ 3. 作答後不能回看；換到下一組重設");

// ---- 5. 跳過字卡模式 ----
const s = new FlashcardGame(vocab, 6, 3);
s.setSkipCards(true);
assert(s.phase === "quiz" && !s.canReviewCards, "跳過字卡模式不提供回看");
s.backToCards();
assert(s.phase === "quiz", "跳過字卡模式呼叫 backToCards() 不會有作用");
assert(!s.canGoBackCard, "跳過字卡模式沒有上一張");
console.log("✅ 4. 跳過字卡模式不提供回看");

console.log("\n✅ 全部字卡暖身「上一張／回看字卡」驗證通過。");
