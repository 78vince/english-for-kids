// Stage D「綜合關卡」：混合單字／短句／短文題目的最終測驗，對應 docs/content-plan-gept-kids.md
// 3.3 節的規劃（「混合單字+短句+短文的最終測驗，過關即視為該主題單元完成」）。
//
// 這裡刻意不重新做一套新的答題狀態機——把三種來源的題目都轉成跟 content/passages/<topic>.json
// 的 questions[] 一樣的形狀（question/options/answer），組成一份清單之後直接交給既有的
// ChoiceGame（Stage C 短文理解用的同一個引擎）處理作答流程，main.ts 只需要另外組一個
// 「假的」Passage 物件（questions 換成這裡混合出來的清單）就能重用 ChoiceGame，
// 不用另外維護一套幾乎一樣的答題邏輯。

import type { Passage, PassageQuestion, Sentence, Vocab } from "./types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function stripPunctuation(word: string): string {
  return word.replace(/[.,!?;:]+$/, "").toLowerCase();
}

/** 兩個單字是不是同義詞（例如 dad/daddy/father、grandma/grandmother）——跟 matchingGame.ts
 * 的 isSynonymPair() 是同一套邏輯（配對題避免同義詞同組出現），這裡拿來做同一件事：
 * 同義詞不能拿來當干擾選項，不然題目會出現兩個選項意思幾乎一樣，變成無法作答的送分/曖昧題
 * （例如題目問 "daddy" 是什麼意思，選項卻同時有 dad 的「爸爸（= father; dad）」）。 */
function isSynonymPair(a: Vocab, b: Vocab): boolean {
  return a.related_forms.includes(b.id) || b.related_forms.includes(a.id);
}

/** 單字題：「"word" 是什麼意思？」四選一，干擾選項從同一個主題的其他單字中文意思挑，
 * 排除跟目標單字是同義詞（related_forms）關係的字，避免曖昧題目。 */
function buildVocabQuizQuestions(vocabPool: Vocab[], count: number): PassageQuestion[] {
  const picked = shuffle(vocabPool).slice(0, count);
  const questions: PassageQuestion[] = [];
  picked.forEach((vocab, index) => {
    const distractors = shuffle(
      vocabPool.filter((v) => v.id !== vocab.id && v.zh !== vocab.zh && !isSynonymPair(v, vocab))
    ).slice(0, 3);
    if (distractors.length < 1) return; // 干擾選項不夠（主題單字太少）就跳過這個字
    const options = shuffle([vocab.zh, ...distractors.map((d) => d.zh)]);
    questions.push({
      id: `capstone.vocab.${vocab.id}.${index}`,
      question: `"${vocab.en}" 是什麼意思？`,
      options,
      answer: vocab.zh,
      type: "single_choice",
    });
  });
  return questions;
}

/** 短句填空題：句子裡的一個字換成「____」，四選一選出正確的英文字——
 * 跟 fillBlankGame.ts 找「vocab_ids 裡的字在句子裡的哪個位置」是同一套邏輯，
 * 只是這裡輸出的是單選題形狀（question 文字裡已經把空白處理好），不是另外一套挖空版面。 */
function buildSentenceQuizQuestions(sentences: Sentence[], vocabPool: Vocab[], count: number): PassageQuestion[] {
  const picked = shuffle(sentences).slice(0, count);
  const questions: PassageQuestion[] = [];

  for (const sentence of picked) {
    const tokens = sentence.en.split(" ").filter((w) => w.length > 0);
    const candidateVocabIds = shuffle([...sentence.vocab_ids]);

    for (const vocabId of candidateVocabIds) {
      const vocab = vocabPool.find((v) => v.id === vocabId);
      if (!vocab) continue;
      const tokenIndex = tokens.findIndex((t) => stripPunctuation(t) === vocab.en.toLowerCase());
      if (tokenIndex === -1) continue;

      const distractors = shuffle(
        vocabPool.filter(
          (v) => v.id !== vocab.id && v.en.toLowerCase() !== vocab.en.toLowerCase() && !isSynonymPair(v, vocab)
        )
      ).slice(0, 3);
      if (distractors.length < 1) continue;

      const displayTokens = tokens.map((t, i) => (i === tokenIndex ? "____" : t));
      const options = shuffle([vocab.en, ...distractors.map((d) => d.en)]);

      questions.push({
        id: `capstone.sentence.${sentence.id}`,
        question: displayTokens.join(" "),
        options,
        answer: vocab.en,
        type: "single_choice",
        // 題目文字本身把答案挖空了（例如 "My bag is ____"），純用讀的很難確定填哪個字，
        // 這裡把挖空前的完整原句存進 source_sentence，main.ts 的 renderCapstone() 會用它
        // 顯示「播放這句」按鈕，讓使用者可以聽完整句子的發音、從聽力上判斷該填哪個字
        // （跟 Stage B-2 句子填空的「播放整句」是同一個概念）。
        source_sentence: sentence.en,
      });
      break; // 一句只出一題，找到能出題的 vocab_id 就停止
    }
  }

  return questions;
}

/**
 * 組出 Stage D 綜合關卡的完整題目清單：4 題單字（或主題單字不夠 4 個就用全部）＋
 * 2 題短句填空＋短文原本的理解題全部照搬，最後整體打亂順序，讓三種來源混在一起考，
 * 不會變成「先考完單字、再考完句子」這種分區塊的感覺。
 */
export function buildCapstoneQuestions(vocab: Vocab[], sentences: Sentence[], passage: Passage): PassageQuestion[] {
  const vocabQuestions = buildVocabQuizQuestions(vocab, Math.min(4, vocab.length));
  const sentenceQuestions = buildSentenceQuizQuestions(sentences, vocab, Math.min(2, sentences.length));
  const combined = [...vocabQuestions, ...sentenceQuestions, ...passage.questions];
  return shuffle(combined);
}
