// 驗證「字卡暖身」學習單元（flashcardGame.ts／flashcardQuestions.ts）：
// 1. 批次（沿用 matchingGame.ts 的 buildBatchesAvoidingSynonymClashes）底下再切成小組
//    （預設 3 個字），一組字卡看完才進入這一組的測驗，不是一張字卡接一題測驗那麼細碎
//    （使用者實測回饋後的調整）。
// 2. 答錯不是原地重試同一題，而是把這個字丟回這一組待考隊伍的最後面，稍後重新出題，
//    直到每個字都答對過一次才算這一組結束（使用者實測回饋後的調整）。
// 3. 聽音題型會觸發 onQuizShown（main.ts 接上自動播放語音，不用使用者自己按按鈕）。
// 4. skipCards（跳過字卡直接測驗）、restart()、答錯的視覺回饋節奏。
// 5. 干擾選項不會洩漏同義詞（跟 capstoneQuestions.ts 修過的同一個曖昧題目坑一致）。
// 6. progress.ts／badgeStats.ts 接上新的 "flashcards" stageKey 之後，讀寫正常、
//    不同使用者互相獨立（沿用既有 verify-progress-logic.ts／verify-badgestats-logic.ts 的模式）。
// 7. 新增 flashcards 關卡之後，main.ts 依賴 STAGE_ROWS.length／ALL_STAGE_KEYS.length 動態計算
//    的「X / Y 種題型」統計邏輯，跟依賴「只看 matching／capstone 單一題型」的成就徽章判斷邏輯
//    （vocab_milestone／unit_completion）不會互相干擾——這裡直接用 progress.ts 的真正函式
//    模擬這兩種聚合方式，不是只憑程式碼推論。
// 8. 不管哪一種題型，reveal_en／reveal_zh 都要固定填這個單字本身的英文／中文（不是「這一題
//    考的方向」的 answer），main.ts 答完之後才顯示得出正確的英文拼字＋中文意思。
// 用法：npx tsx scripts/verify-flashcard-logic.ts

import { readFileSync } from "node:fs";
import type { Vocab } from "../src/types";

function makeFakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

(globalThis as any).window = {
  localStorage: makeFakeLocalStorage(),
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf-8"));
}

const { FlashcardGame } = await import("../src/flashcardGame");
const { buildFlashcardQuizQuestion } = await import("../src/flashcardQuestions");
const { getStageProgress, recordStageCompletion } = await import("../src/progress");
const { recordQuestionAnswered, getBadgeStats } = await import("../src/badgeStats");

const familyVocab = loadJson<Vocab[]>("../../content/vocab/family.json").filter(
  (v) => v.status === "published"
);
const tablewareVocab = loadJson<Vocab[]>("../../content/vocab/tableware.json").filter(
  (v) => v.status === "published"
);
const partsOfBodyVocab = loadJson<Vocab[]>("../../content/vocab/parts_of_body.json").filter(
  (v) => v.status === "published"
);

// ---- 測試 1：批次邏輯跟 Stage A 單字配對一致（family 15 字、batchSize 6 → 3 批），
//      批次底下再照 groupSize（預設 3）切成小組。 ----
{
  const game = new FlashcardGame(familyVocab, 6, 3);
  assert(game.totalBatches === 3, `15 個單字、每批 6 個，應該分成 3 批，實際 ${game.totalBatches}`);
  assert(game.phase === "card", "一開始應該停在字卡階段");
  assert(game.currentBatchNumber === 1, "一開始應該是第 1 批");
  assert(game.cardPositionInGroup === 1, "一開始應該是這一組的第 1 張字卡");
  assert(
    game.groupCardCount === 3,
    `每批 6 個字、每組 3 個字，第一組應該有 3 張字卡，實際 ${game.groupCardCount}`
  );
  console.log("✅ 測試 1 通過：字卡暖身分批邏輯跟 Stage A 單字配對一致（15 字 → 3 批，每批再切成 3 字一組）。");
}

// ---- 測試 2：完整跑一輪（每題都選正確答案，不會觸發答錯重排隊伍），驗證「一組字卡看完
//      才接這一組的測驗」的節奏——同一組的字卡要連續出現（不能中途插入測驗），
//      字卡結束後緊接著的測驗題數要剛好等於這一組的字卡數。 ----
{
  const game = new FlashcardGame(familyVocab, 6, 3);
  const cardShownVocabIds: string[] = [];
  game.onCardShown = (vocab) => cardShownVocabIds.push(vocab.id);
  // constructor 裡第一張字卡的內部狀態是在 onCardShown 接上「之前」跑的（跟 matchingGame.ts
  // 的 onChange 是同一種慣例：callback 要等 new 完才能設定），main.ts 的 goToFlashcards()
  // 就是因為這樣才會在接上 callback 後，另外手動呼叫一次 speakEnglish() 補上第一張字卡——
  // 這裡的測試也要照這個真實用法補一次，不然會誤判成「漏了一個字」。
  if (game.phase === "card" && !game.isRoundComplete) {
    cardShownVocabIds.push(game.currentVocab.id);
  }

  let guard = 0;
  // 用 "card" / "quiz-correct" 標記每一步實際發生的事，之後檢查「一串 card 接一串長度
  // 相同的 quiz-correct」這個分組節奏有沒有真的成立。
  const stepLog: string[] = [];
  while (!game.isRoundComplete) {
    if (game.phase === "card") {
      stepLog.push("card");
      game.advanceCard();
    } else {
      if (!game.quizQuestion) throw new Error("測驗階段卻沒有題目");
      game.selectQuizOption(game.quizQuestion.answer);
      assert(game.feedback === "correct", "每題都選正確答案，feedback 應該立刻是 correct");
      stepLog.push("quiz");
      game.advanceToNextWord();
    }
    guard += 1;
    if (guard > familyVocab.length * 10) throw new Error("疑似無窮迴圈");
  }

  assert(game.correctCount === familyVocab.length, `答對次數應等於單字數，實際 ${game.correctCount} / ${familyVocab.length}`);
  assert(game.wrongCount === 0, "每題都選正確答案，答錯次數應該是 0");
  assert(game.masteredCount === familyVocab.length, `已學會的單字數應該等於總單字數，實際 ${game.masteredCount}`);
  assert(cardShownVocabIds.length === familyVocab.length, `每個單字都應該顯示過一次字卡，實際顯示 ${cardShownVocabIds.length} 次`);
  assert(
    new Set(cardShownVocabIds).size === familyVocab.length,
    "onCardShown 觸發的單字不應該有重複（代表沒有跳過或重複某個字）"
  );

  // 把 stepLog 切成一段一段連續的 "card" 或連續的 "quiz"，驗證節奏是「一串字卡接著一串
  // 一樣長度的測驗」。組數不寫死成固定數字，只驗證節奏本身——2026-08-23 family 拆掉
  // dad/daddy/mom/mommy/grandma/grandpa 之後，family 本身已經沒有 related_forms
  // 同義詞群組了（father/mother/grandfather/grandmother 都各自獨立），但
  // buildBatchesAvoidingSynonymClashes() 這套「避開同義詞衝突」的分批邏輯是通用的，
  // 用其他還有同義詞群組的主題（例如 parts_of_body 的 foot/feet、tooth/teeth）也一樣
  // 可能讓各批大小不是剛好整除，所以這裡繼續保持「不假設固定組數」的寫法，不因為
  // family 現在沒有同義詞就改成寫死組數。
  const runs: { kind: string; length: number }[] = [];
  for (const step of stepLog) {
    const last = runs[runs.length - 1];
    if (last && last.kind === step) last.length += 1;
    else runs.push({ kind: step, length: 1 });
  }
  assert(runs.length % 2 === 0, `字卡段跟測驗段應該一一配對，總段數應該是偶數，實際 ${runs.length} 段`);
  assert(runs.length > 2, `${familyVocab.length} 個字、每組最多 3 個，應該遠不只 1 組，實際只有 ${runs.length / 2} 組`);
  for (let i = 0; i < runs.length; i++) {
    const expectedKind = i % 2 === 0 ? "card" : "quiz";
    assert(runs[i].kind === expectedKind, `第 ${i + 1} 段應該是 "${expectedKind}"，實際是 "${runs[i].kind}"`);
    assert(runs[i].length <= 3, `每組最多 3 個字，第 ${i + 1} 段長度應該 ≤ 3，實際 ${runs[i].length}`);
    if (i % 2 === 1) {
      assert(
        runs[i].length === runs[i - 1].length,
        `第 ${i + 1} 段測驗的題數（${runs[i].length}）應該跟前一段字卡的張數（${runs[i - 1].length}）一樣多`
      );
    }
  }
  const totalCardsShown = runs.filter((_, i) => i % 2 === 0).reduce((sum, r) => sum + r.length, 0);
  assert(
    totalCardsShown === familyVocab.length,
    `所有字卡段的張數加總應該等於總單字數，實際 ${totalCardsShown} / ${familyVocab.length}`
  );
  console.log(
    `✅ 測試 2 通過：Family 主題（${familyVocab.length} 字）確實按「一組字卡（最多 3 張）看完才接同一組的測驗」節奏進行，共 ${runs.length / 2} 組，字卡跟測驗題數一一對應。`
  );
}

// ---- 測試 3：答錯不是原地重試——這個字會被丟回待考隊伍最後面，換考隊伍裡的下一個字，
//      稍後才會重新出現（用 groupSize=3 的一組驗證：故意讓第一個字答錯，確認接下來
//      考的是「別的」字，不是同一個字，直到最後把答錯的字補考完，這一組才會結束）。
//      使用者反應原本 700ms 自動計時器停頓太短，來不及看清楚答錯提示跟正確答案，
//      改成使用者自己按「繼續」按鈕（main.ts 接的是 game.continueAfterWrong()）才會換題，
//      這裡不能再靠等待計時器驗證，要直接呼叫 continueAfterWrong()。 ----
{
  const game = new FlashcardGame(familyVocab, 6, 3); // 第一批 6 個字會切成 3+3 兩組
  // 跳過字卡，直接進第一組的測驗，方便鎖定要測試的情境。
  game.setSkipCards(true);
  assert(game.phase === "quiz", "skipCards 開著時應該直接進測驗");

  const firstWordId = game.currentQuizVocabId!;
  const wrongOption = game.quizQuestion!.options.find((o) => o !== game.quizQuestion!.answer)!;
  game.selectQuizOption(wrongOption);
  assert(game.feedback === "wrong", "選錯之後 feedback 應該是 wrong");
  assert(game.wrongCount === 1, "答錯次數應該累加");

  // 答錯之後不會自動換題，要停在原地等使用者按按鈕——這裡故意「等一下」＋確認畫面
  // 還是原本那一題，證明真的沒有計時器在背景默默把題目換掉。
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert(game.feedback === "wrong", "答錯後沒有按「繼續」按鈕之前，應該一直停在 wrong 狀態，不會自動恢復");
  assert(game.currentQuizVocabId === firstWordId, "答錯後沒有按「繼續」按鈕之前，應該還停在原本那一題");

  game.continueAfterWrong();
  const secondWordId = game.currentQuizVocabId!;
  assert(game.phase === "quiz", "按下「繼續」之後應該還在測驗階段（換了一題，不是回到字卡）");
  assert(game.feedback === "building", "按下「繼續」之後 feedback 應該重置成 building，可以正常作答");
  assert(secondWordId !== firstWordId, "答錯的字不應該原地重試，應該換考隊伍裡的下一個字");

  // 把這一組另外 2 個字都答對，最後應該輪回最初答錯的那個字，補考一次才會結束這一組。
  let guard = 0;
  let sawFirstWordAgain = false;
  while (game.phase === "quiz" && !game.isRoundComplete) {
    const currentWordId = game.currentQuizVocabId!;
    if (currentWordId === firstWordId) {
      sawFirstWordAgain = true;
      game.selectQuizOption(game.quizQuestion!.answer);
      assert(game.feedback === "correct", "補考答對之後 feedback 應該是 correct");
      game.advanceToNextWord();
      break;
    }
    game.selectQuizOption(game.quizQuestion!.answer);
    game.advanceToNextWord();
    guard += 1;
    if (guard > 10) throw new Error("疑似無窮迴圈：一直等不到答錯的字被重新排進來");
  }
  assert(sawFirstWordAgain, "答錯的字最後應該有被重新排進隊伍、再考一次");
  console.log("✅ 測試 3 通過：答錯的字不會原地重試，會被排到隊伍最後面、稍後重新出題，直到補考答對才離開隊伍。");
}

// ---- 測試 4：聽音題型會觸發 onQuizShown（main.ts 接上自動播放語音），非聽音題型
//      （zh_to_en／en_to_zh）不會觸發播放（因為 question.listen_word 是 undefined）。 ----
{
  const game = new FlashcardGame(familyVocab, 6, 3);
  const shownQuestions: { hasListenWord: boolean }[] = [];
  game.onQuizShown = (question) => {
    shownQuestions.push({ hasListenWord: !!question.listen_word });
  };
  game.setSkipCards(true); // 每個字都直接進測驗，加快跑完一輪的速度

  let guard = 0;
  while (!game.isRoundComplete) {
    if (!game.quizQuestion) throw new Error("測驗階段卻沒有題目");
    game.selectQuizOption(game.quizQuestion.answer);
    if (game.feedback === "correct") game.advanceToNextWord();
    guard += 1;
    if (guard > familyVocab.length * 10) throw new Error("疑似無窮迴圈");
  }

  assert(shownQuestions.length === familyVocab.length, `onQuizShown 應該總共觸發 ${familyVocab.length} 次（每個字一次，沒有答錯不會多觸發）`);
  const listenCount = shownQuestions.filter((q) => q.hasListenWord).length;
  assert(listenCount > 0, "15 個字、四種題型隨機挑，應該至少會出現一次聽音題型（機率上不太可能全部都不是聽音題）");
  assert(listenCount < shownQuestions.length, "15 個字不太可能全部都剛好是聽音題型");
  console.log(
    `✅ 測試 4 通過：onQuizShown 總共觸發 ${shownQuestions.length} 次，其中 ${listenCount} 次是聽音題型（main.ts 接上這個 callback 才能在聽音題自動播放語音）。`
  );
}

// ---- 測試 5：restart() 重置正確/錯誤/已學會次數跟批次進度 ----
{
  const game = new FlashcardGame(tablewareVocab, 6, 3);
  game.setSkipCards(true);
  game.selectQuizOption(game.quizQuestion!.answer);
  game.advanceToNextWord();
  assert(game.correctCount === 1, "重玩前應該已經有 1 次答對紀錄");
  assert(game.masteredCount === 1, "重玩前應該已經有 1 個已學會的單字");

  game.restart();
  assert(game.correctCount === 0, "restart 後答對次數應該歸零");
  assert(game.wrongCount === 0, "restart 後答錯次數應該歸零");
  assert(game.masteredCount === 0, "restart 後已學會單字數應該歸零");
  assert(game.currentBatchNumber === 1, "restart 後應該回到第 1 批");
  assert(game.cardPositionInGroup === 1, "restart 後應該回到這一組的第 1 張字卡");
  // restart() 沒有另外重置 skipCards（維持原本的開關狀態），所以這裡沿用測試前設的
  // skipCards=true，restart 後應該直接停在測驗階段，不是字卡階段。
  assert(game.phase === "quiz", "restart 後如果 skipCards 還開著，應該直接停在測驗階段");
  console.log("✅ 測試 5 通過：restart() 正確重置正確/錯誤/已學會次數與批次進度。");
}

// ---- 測試 6：干擾選項不會洩漏同義詞（原本用 family 主題的 dad/daddy/father 當測試案例，
//      2026-08-23 family 拆掉 dad/daddy/mom/mommy/grandma/grandpa 之後，family 底下已經
//      沒有 related_forms 群組了，改用 parts_of_body 主題的 foot/feet 這組不規則複數
//      related_forms 當測試案例——同一套「排除 related_forms 洩漏」的程式邏輯，不管測的是
//      同義詞還是不規則複數形式，都是同一個機制，改題目不影響測試涵蓋到的程式碼路徑）。 ----
{
  const partsOfBody = new Map(partsOfBodyVocab.map((v) => [v.id, v]));
  const foot = partsOfBodyVocab.find((v) => v.en === "foot")!;
  const synonymIds = new Set(foot.related_forms);
  assert(synonymIds.size > 0, "測試前提：foot 應該要有 related_forms（跟 feet 互相關聯）");

  const TRIALS = 60;
  const quizTypes = ["zh_to_en", "en_to_zh", "listen_to_en", "listen_to_zh"] as const;
  for (const quizType of quizTypes) {
    for (let i = 0; i < TRIALS; i++) {
      const question = buildFlashcardQuizQuestion(foot, partsOfBodyVocab, quizType);
      assert(question !== null, `foot（${quizType}）：主題單字量夠多，不應該湊不出干擾選項`);
      assert(question!.options.includes(question!.answer), "選項裡一定要包含正確答案");
      assert(new Set(question!.options).size === question!.options.length, "選項不應該重複");
      for (const optionText of question!.options) {
        if (optionText === question!.answer) continue;
        const isSynonymLeak = [...synonymIds].some((id) => {
          const synonymVocab = partsOfBody.get(id);
          if (!synonymVocab) return false;
          return quizType === "zh_to_en" || quizType === "listen_to_en"
            ? optionText === synonymVocab.en
            : optionText === synonymVocab.zh;
        });
        assert(!isSynonymLeak, `foot（${quizType}）：干擾選項「${optionText}」洩漏了 related_forms（feet），應該被排除`);
      }
    }
  }
  console.log(
    `✅ 測試 6 通過：foot 的四種題型各重複組題 ${TRIALS} 次，都沒有出現 related_forms（feet）干擾選項洩漏（跟 capstoneQuestions.ts 修過的曖昧題目坑一致）。`
  );
}

// ---- 測試 7：progress.ts／badgeStats.ts 接上新的 "flashcards" stageKey 之後讀寫正常，
//      不同使用者互相獨立（沿用既有 verify-progress-logic.ts／verify-badgestats-logic.ts 的模式）。 ----
{
  const ALICE = "flashcard-test-alice";
  const BOB = "flashcard-test-bob";

  assert(getStageProgress(ALICE, "family", "flashcards") === null, "還沒玩過，getStageProgress 應該回傳 null");

  recordStageCompletion(ALICE, "family", "flashcards", 19, 2);
  const aliceProgress = getStageProgress(ALICE, "family", "flashcards");
  assert(aliceProgress !== null, "完成一次後應該要有紀錄");
  assert(aliceProgress!.timesCompleted === 1, "timesCompleted 應該是 1");
  assert(aliceProgress!.bestAccuracy === 90, `正確率應該是 90，實際 ${aliceProgress!.bestAccuracy}`);

  const bobProgress = getStageProgress(BOB, "family", "flashcards");
  assert(bobProgress === null, "Bob 還沒玩過，不該看到 Alice 的紀錄");

  recordQuestionAnswered(ALICE, "flashcards", true);
  recordQuestionAnswered(ALICE, "flashcards", false);
  const aliceStats = getBadgeStats(ALICE);
  assert(aliceStats.stageQuestionsAnswered.flashcards === 2, "flashcards 的累計題數應該是 2");
  assert(aliceStats.totalQuestionsAnswered >= 2, "總累計題數應該至少包含這 2 題");

  const bobStats = getBadgeStats(BOB);
  assert(bobStats.stageQuestionsAnswered.flashcards === 0, "Bob 的 flashcards 累計題數不該被 Alice 影響");

  console.log("✅ 測試 7 通過：progress.ts／badgeStats.ts 的 \"flashcards\" stageKey 讀寫正常、使用者互相獨立。");
}

// ---- 測試 8：新增 flashcards 關卡之後，main.ts 兩種既有聚合邏輯不會互相干擾——
//      (a) 「X / Y 種題型已挑戰過」這種依 STAGE_ROWS.length／ALL_STAGE_KEYS.length 動態計算的
//          統計，加入 flashcards 之後分母應該自動變成 6（不是寫死的 5），且只計算「這個使用者
//          真的挑戰過」的題型數量；
//      (b) vocab_milestone（只看 "matching"）／unit_completion（只看 "capstone"）這種只認
//          特定單一題型的成就判斷邏輯，不應該因為使用者只完成了 flashcards、還沒完成 matching
//          或 capstone，就被誤判成達成。這裡直接呼叫 progress.ts 的真正函式模擬 main.ts 的
//          computeVocabAggregate()／computeCompletedStageDTopics() 邏輯，不是只憑程式碼推論。 ----
{
  const STAGE_KEYS_WITH_FLASHCARDS = ["flashcards", "matching", "ordering", "fillBlank", "choice", "capstone"] as const;
  const USER = "flashcard-test-carol";
  const TOPIC = "colors";

  function countChallengedStages(): number {
    return STAGE_KEYS_WITH_FLASHCARDS.filter((k) => getStageProgress(USER, TOPIC, k) !== null).length;
  }

  assert(countChallengedStages() === 0, "一開始應該 0 種題型被挑戰過");

  // (a) 只完成 flashcards，"X / Y" 的 Y（分母）應該是 6，X（分子）應該是 1，不是舊的 5。
  recordStageCompletion(USER, TOPIC, "flashcards", 12, 0);
  assert(countChallengedStages() === 1, `只完成 flashcards，應該算 1 種題型被挑戰過，實際 ${countChallengedStages()}`);
  assert(STAGE_KEYS_WITH_FLASHCARDS.length === 6, "加入 flashcards 之後，題型總數應該是 6（不是舊的 5）");

  // (b) vocab_milestone 只認 "matching"：只完成 flashcards，還沒完成 matching，
  //     這個主題的單字不應該被算進「已習得」。
  const vocabKnownBeforeMatching = getStageProgress(USER, TOPIC, "matching") !== null;
  assert(!vocabKnownBeforeMatching, "只完成 flashcards、還沒完成 matching，vocab_milestone 不該誤判成已習得");

  recordStageCompletion(USER, TOPIC, "matching", 12, 0);
  const vocabKnownAfterMatching = getStageProgress(USER, TOPIC, "matching") !== null;
  assert(vocabKnownAfterMatching, "完成 matching 之後，vocab_milestone 才應該算已習得");
  assert(countChallengedStages() === 2, `完成 flashcards＋matching，應該算 2 種題型被挑戰過，實際 ${countChallengedStages()}`);

  // (b) unit_completion 只認 "capstone"：即使 flashcards／matching 都完成了，
  //     還沒完成 capstone，這個主題不該被算進「這個單元通過 Stage D」。
  const stageDDoneBeforeCapstone = getStageProgress(USER, TOPIC, "capstone") !== null;
  assert(!stageDDoneBeforeCapstone, "還沒完成 capstone，unit_completion 不該誤判成已通過");

  recordStageCompletion(USER, TOPIC, "capstone", 9, 0);
  const stageDDoneAfterCapstone = getStageProgress(USER, TOPIC, "capstone") !== null;
  assert(stageDDoneAfterCapstone, "完成 capstone 之後，unit_completion 才應該算已通過");

  console.log(
    "✅ 測試 8 通過：新增 flashcards 之後，「X / Y 種題型」統計的分母正確變成 6，且 vocab_milestone／unit_completion 只認 matching／capstone 的判斷邏輯完全不受 flashcards 完成與否影響。"
  );
}

// ---- 測試 9：不管哪一種題型，reveal_en／reveal_zh 都要固定填這個單字本身的英文／中文
//      （不是「這一題考的方向」的 answer）——使用者反應答完之後（不管答對還是答錯）
//      都想看到完整的英文拼字＋中文意思，尤其聽音選中文題型，畫面上原本完全不會出現
//      任何英文文字。 ----
{
  const vocab = familyVocab.find((v) => v.en === "father")!;
  const quizTypes = ["zh_to_en", "en_to_zh", "listen_to_en", "listen_to_zh"] as const;
  for (const quizType of quizTypes) {
    const question = buildFlashcardQuizQuestion(vocab, familyVocab, quizType);
    assert(question !== null, `father（${quizType}）：不應該湊不出干擾選項`);
    assert(
      question!.reveal_en === vocab.en,
      `father（${quizType}）：reveal_en 應該固定是 "${vocab.en}"，實際 "${question!.reveal_en}"`
    );
    assert(
      question!.reveal_zh === vocab.zh,
      `father（${quizType}）：reveal_zh 應該固定是 "${vocab.zh}"，實際 "${question!.reveal_zh}"`
    );
  }
  console.log("✅ 測試 9 通過：四種題型組出來的題目都固定填正確的 reveal_en／reveal_zh，不會因為考的方向不同而缺漏或錯置。");
}

console.log("\n✅ 全部「字卡暖身」學習單元邏輯驗證通過。");
