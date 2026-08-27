// 一次性驗證用 script（不是正式測試框架），確認 MatchingGame 邏輯搭配真實
// content/vocab/family.json 資料可以完整跑完一輪，並且配對規則正確。
// 用法：npx tsx scripts/verify-matching-logic.ts

import { readFileSync } from "node:fs";
import { MatchingGame } from "../src/matchingGame";
import type { Vocab } from "../src/types";

const familyVocab: Vocab[] = JSON.parse(
  readFileSync(new URL("../../content/vocab/family.json", import.meta.url), "utf-8")
);

console.log(`載入 Family 單字數：${familyVocab.length}`);
if (familyVocab.length !== 15) {
  throw new Error(`預期 15 個單字，實際 ${familyVocab.length} 個`);
}

const vocabById = new Map(familyVocab.map((v) => [v.id, v]));

/** 同義詞（related_forms）不該同時出現在同一批配對題裡，否則等於用刪去法猜拼字。 */
function assertNoSynonymClashInCurrentBatch(game: MatchingGame): void {
  const ids = game.englishCards.map((c) => c.vocabId);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = vocabById.get(ids[i])!;
      const b = vocabById.get(ids[j])!;
      const isSynonym = a.related_forms.includes(b.id) || b.related_forms.includes(a.id);
      if (isSynonym) {
        throw new Error(`同一批出現了同義詞衝突：${a.en} / ${b.en}（批次 ${game.currentBatchNumber}）`);
      }
    }
  }
}

const game = new MatchingGame(familyVocab, 6);
let changeEvents = 0;
game.onChange = () => {
  changeEvents += 1;
};

assertNoSynonymClashInCurrentBatch(game);

let safetyCounter = 0;
while (!game.isRoundComplete) {
  safetyCounter += 1;
  if (safetyCounter > 500) throw new Error("超過安全迴圈上限，可能卡住了");

  // 先故意選一組錯的（如果這一批還有兩張以上未配對的卡），驗證「答錯」流程
  const idleEnglish = game.englishCards.filter((c) => c.status === "idle");
  const idleChinese = game.chineseCards.filter((c) => c.status === "idle");

  if (idleEnglish.length >= 2 && idleChinese.length >= 2) {
    const wrongEn = idleEnglish[0];
    const wrongZh = idleChinese.find((c) => c.vocabId !== wrongEn.vocabId);
    if (wrongZh) {
      game.selectEnglish(wrongEn.vocabId);
      game.selectChinese(wrongZh.vocabId);
      if (wrongEn.status !== "wrong" || wrongZh.status !== "wrong") {
        throw new Error("答錯配對沒有被標記為 wrong");
      }
      // 模擬 600ms 後的自動重置（setTimeout 邏輯），這裡直接手動跑一次 tick
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
  }

  // 再選一組正確的
  const pending = game.englishCards.find((c) => c.status === "idle");
  if (pending) {
    game.selectEnglish(pending.vocabId);
    game.selectChinese(pending.vocabId);
    const updated = game.englishCards.find((c) => c.vocabId === pending.vocabId)!;
    if (updated.status !== "correct") {
      throw new Error(`正確配對沒有被標記為 correct（${pending.vocabId}）`);
    }
  }

  if (game.isBatchComplete && !game.isRoundComplete) {
    game.advanceToNextBatch();
    assertNoSynonymClashInCurrentBatch(game);
  }
}

console.log(`總批次數：${game.totalBatches}`);
console.log(`答對次數：${game.correctCount}（應等於 15）`);
console.log(`答錯次數：${game.wrongCount}（應大於 0，代表錯誤回饋流程有被觸發）`);
console.log(`onChange 觸發次數：${changeEvents}`);

if (game.correctCount !== 15) {
  throw new Error(`answers 數量不對，預期 15 實際 ${game.correctCount}`);
}
if (game.wrongCount === 0) {
  throw new Error("從未觸發答錯流程，測試沒有涵蓋到 wrong 分支");
}
if (!game.isRoundComplete) {
  throw new Error("跑完所有批次後 isRoundComplete 應為 true");
}

console.log("✅ MatchingGame 邏輯驗證通過：可以完整跑完 Family 主題一輪，含答對與答錯回饋。");

// 額外做 200 次隨機重洗牌壓力測試，確認「同義詞不同批」這條規則在各種洗牌結果下都成立
// （這條規則靠的是隨機貪婪演算法，光跑一次不足以代表所有情況）。
const stressGame = new MatchingGame(familyVocab, 6);
for (let i = 0; i < 200; i++) {
  stressGame.restart();
  assertNoSynonymClashInCurrentBatch(stressGame);
  while (stressGame.currentBatchNumber < stressGame.totalBatches) {
    stressGame.advanceToNextBatch();
    assertNoSynonymClashInCurrentBatch(stressGame);
  }
}
console.log("✅ 200 次隨機重洗牌壓力測試通過：每一批都沒有同義詞衝突。");
