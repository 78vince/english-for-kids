// 「字卡暖身」學習單元（插在 Stage A 之前）的測驗選擇題產生器。
// 每個單字只出一題，四種題型（中翻英／英翻中／聽音選英文／聽音選中文）隨機挑一種，
// 不是四種都考——主題單字量大的時候（例如 Animals & insects 31 字）四種都考會變成
// 4 倍題數，對小朋友來說太長，跟 docs 需求一致。
//
// 干擾選項邏輯沿用 capstoneQuestions.ts 的 buildVocabQuizQuestions()／isSynonymPair() 同一套
// 規則：干擾選項從同一個主題的其他單字裡挑，並排除跟目標單字是同義詞（related_forms）關係的字，
// 避免「daddy 是什麼意思」同時出現兩個都翻成「爸爸」的選項這種曖昧題目（這個問題在
// capstoneQuestions.ts 已經修過一次，這裡直接沿用同樣的修法，不要重新踩一次同一個坑）。

import type { PassageQuestion, Vocab } from "./types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 跟 matchingGame.ts／capstoneQuestions.ts 同一套「兩個單字是不是同義詞」判斷邏輯。 */
function isSynonymPair(a: Vocab, b: Vocab): boolean {
  return a.related_forms.includes(b.id) || b.related_forms.includes(a.id);
}

export type FlashcardQuizType = "zh_to_en" | "en_to_zh" | "listen_to_en" | "listen_to_zh";

const QUIZ_TYPES: FlashcardQuizType[] = ["zh_to_en", "en_to_zh", "listen_to_en", "listen_to_zh"];

/** 每個單字出題時隨機挑一種題型。 */
export function pickRandomQuizType(): FlashcardQuizType {
  return QUIZ_TYPES[Math.floor(Math.random() * QUIZ_TYPES.length)];
}

/** 組「四選一」的選項清單：正確答案＋最多 3 個干擾選項（干擾選項不夠時就用比較少個，
 * 跟 capstoneQuestions.ts 的容錯策略一致，不會因為某個主題單字量剛好少而整題出不了）。
 * answerKey 決定要比較／顯示的是 en 還是 zh 欄位。 */
function buildOptions(
  vocab: Vocab,
  vocabPool: Vocab[],
  answerKey: "en" | "zh"
): { options: string[]; answer: string } | null {
  const answer = vocab[answerKey];
  const distractors = shuffle(
    vocabPool.filter((v) => {
      if (v.id === vocab.id) return false;
      if (isSynonymPair(v, vocab)) return false;
      return answerKey === "en" ? v.en.toLowerCase() !== answer.toLowerCase() : v.zh !== answer;
    })
  ).slice(0, 3);
  if (distractors.length < 1) return null; // 主題單字太少湊不出任何干擾選項才會發生
  const options = shuffle([answer, ...distractors.map((d) => d[answerKey])]);
  return { options, answer };
}

/**
 * 依指定題型組出這個單字的測驗選擇題；主題單字太少湊不出干擾選項時回傳 null，
 * 呼叫端（flashcardGame.ts）遇到 null 會直接跳過這個字的測驗，不讓畫面卡住。
 *
 * 聽音題（listen_to_en／listen_to_zh）額外填 listen_word（PassageQuestion 新增的選填欄位）：
 * main.ts 看到這個欄位就知道要顯示「播放語音」按鈕，題目文字本身刻意不寫出英文單字，
 * 不然小朋友用讀的就能作答，變成沒有真的在考聽力。
 *
 * 不管哪一種題型，都固定填 reveal_en／reveal_zh（這個單字的英文／中文本身，不是
 * 「這一題考的方向」的 answer）：main.ts 答完之後（不管答對還是答錯）都會顯示出來，
 * 使用者反應希望不管作答結果如何都能看到完整的英文拼字＋中文意思，尤其聽音選中文
 * 這種題型，畫面上原本完全不會出現任何英文文字。
 */
export function buildFlashcardQuizQuestion(
  vocab: Vocab,
  vocabPool: Vocab[],
  quizType: FlashcardQuizType
): PassageQuestion | null {
  switch (quizType) {
    case "en_to_zh": {
      const built = buildOptions(vocab, vocabPool, "zh");
      if (!built) return null;
      return {
        id: `flashcard.quiz.${vocab.id}.en_to_zh`,
        question: `"${vocab.en}" 是什麼意思？`,
        options: built.options,
        answer: built.answer,
        type: "single_choice",
        reveal_en: vocab.en,
        reveal_zh: vocab.zh,
      };
    }
    case "zh_to_en": {
      const built = buildOptions(vocab, vocabPool, "en");
      if (!built) return null;
      return {
        id: `flashcard.quiz.${vocab.id}.zh_to_en`,
        question: `「${vocab.zh}」的英文怎麼說？`,
        options: built.options,
        answer: built.answer,
        type: "single_choice",
        reveal_en: vocab.en,
        reveal_zh: vocab.zh,
      };
    }
    case "listen_to_en": {
      const built = buildOptions(vocab, vocabPool, "en");
      if (!built) return null;
      return {
        id: `flashcard.quiz.${vocab.id}.listen_to_en`,
        question: "🔊 聽發音，選出正確的英文單字",
        options: built.options,
        answer: built.answer,
        type: "single_choice",
        listen_word: vocab.en,
        reveal_en: vocab.en,
        reveal_zh: vocab.zh,
      };
    }
    case "listen_to_zh": {
      const built = buildOptions(vocab, vocabPool, "zh");
      if (!built) return null;
      return {
        id: `flashcard.quiz.${vocab.id}.listen_to_zh`,
        question: "🔊 聽發音，選出正確的中文意思",
        options: built.options,
        answer: built.answer,
        type: "single_choice",
        listen_word: vocab.en,
        reveal_en: vocab.en,
        reveal_zh: vocab.zh,
      };
    }
  }
}
