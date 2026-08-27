// Stage B-2 題型：句子填空。
// 從 Stage B 的短句（content/sentences/<topic>.json）中，挑出 vocab_ids 對應的其中一個字挖空，
// 用「選字」而非「打字」作答——這樣不用處理文字輸入的容錯（大小寫、多餘空白、同義詞拼寫等），
// 對小朋友的操作也更友善（點選 vs. 打鍵盤）。

import type { Sentence, Vocab } from "./types";

export type FillBlankFeedback = "building" | "correct" | "wrong";

export interface FillBlankOption {
  vocabId: string;
  text: string;
  status: "idle" | "correct" | "wrong";
}

export interface FillBlankQuestion {
  sentence: Sentence;
  /** 句子用空白分詞後，被挖空的 token 索引 */
  blankTokenIndex: number;
  /** 挖空前的原始字（含標點），畫面上答對時要換回這個 */
  originalToken: string;
  correctVocabId: string;
  options: FillBlankOption[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function tokenize(sentence: string): string[] {
  return sentence.split(" ").filter((w) => w.length > 0);
}

function stripPunctuation(word: string): string {
  return word.replace(/[.,!?;:]+$/, "").toLowerCase();
}

/** 找出這個 vocab 的 en 在句子分詞後對應的 token 索引，找不到就回傳 -1 */
function findTokenIndexForVocab(tokens: string[], vocab: Vocab): number {
  return tokens.findIndex((t) => stripPunctuation(t) === vocab.en.toLowerCase());
}

function buildDistractors(
  correctVocab: Vocab,
  vocabPool: Vocab[],
  count: number
): Vocab[] {
  const excludedIds = new Set([correctVocab.id, ...correctVocab.related_forms]);
  const candidates = vocabPool.filter(
    (v) =>
      !excludedIds.has(v.id) && v.en.toLowerCase() !== correctVocab.en.toLowerCase()
  );
  return shuffle(candidates).slice(0, count);
}

function buildQuestion(sentence: Sentence, vocabPool: Vocab[]): FillBlankQuestion | null {
  const tokens = tokenize(sentence.en);

  // 一句可能對應多個 vocab_ids（例如同時練 brother 跟 sister），隨機挑其中一個當這次的填空目標。
  const candidateVocabIds = shuffle([...sentence.vocab_ids]);
  for (const vocabId of candidateVocabIds) {
    const vocab = vocabPool.find((v) => v.id === vocabId);
    if (!vocab) continue;
    const tokenIndex = findTokenIndexForVocab(tokens, vocab);
    if (tokenIndex === -1) continue;

    const distractors = buildDistractors(vocab, vocabPool, 2);
    if (distractors.length < 1) continue; // 干擾選項不夠就換下一個 vocab_id 試試看

    const options: FillBlankOption[] = shuffle([
      { vocabId: vocab.id, text: vocab.en, status: "idle" as const },
      ...distractors.map((d) => ({ vocabId: d.id, text: d.en, status: "idle" as const })),
    ]);

    return {
      sentence,
      blankTokenIndex: tokenIndex,
      originalToken: tokens[tokenIndex],
      correctVocabId: vocab.id,
      options,
    };
  }

  return null;
}

export class FillBlankGame {
  private questions: FillBlankQuestion[];
  private index = 0;
  private locked = false;

  feedback: FillBlankFeedback = "building";
  correctCount = 0;
  wrongCount = 0;

  onChange: () => void = () => {};
  /** 這一題「答對」的那一刻呼叫一次（不是每次 render 都會呼叫），給 main.ts 接上音效用 */
  onCorrect: () => void = () => {};
  /** 這一題「答錯」的那一刻呼叫一次，給 main.ts 接上音效用 */
  onWrong: () => void = () => {};

  constructor(sentences: Sentence[], vocabPool: Vocab[]) {
    this.questions = sentences
      .map((s) => buildQuestion(s, vocabPool))
      .filter((q): q is FillBlankQuestion => q !== null);

    if (this.questions.length === 0) {
      throw new Error(
        "沒有任何句子能產生填空題（vocab_ids 對應不到句子裡的字，或找不到足夠的干擾選項）"
      );
    }
  }

  get currentQuestion(): FillBlankQuestion {
    return this.questions[this.index];
  }

  get currentQuestionNumber(): number {
    return this.index + 1;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get isRoundComplete(): boolean {
    return this.index >= this.questions.length;
  }

  /** 給畫面渲染用：句子分詞後，被挖空的地方換成 null */
  get displayTokens(): (string | null)[] {
    const tokens = tokenize(this.currentQuestion.sentence.en);
    return tokens.map((t, i) => (i === this.currentQuestion.blankTokenIndex ? null : t));
  }

  selectOption(vocabId: string): void {
    if (this.locked || this.isRoundComplete) return;
    const question = this.currentQuestion;
    const option = question.options.find((o) => o.vocabId === vocabId);
    if (!option) return;

    if (vocabId === question.correctVocabId) {
      // 答對了：畫面停在這裡，等使用者自己按「下一題」，不用計時器自動跳。
      option.status = "correct";
      this.feedback = "correct";
      this.correctCount += 1;
      this.locked = true;
      this.onChange();
      this.onCorrect();
      return;
    }

    option.status = "wrong";
    this.feedback = "wrong";
    this.wrongCount += 1;
    this.locked = true;
    this.onChange();
    this.onWrong();

    setTimeout(() => {
      option.status = "idle";
      this.feedback = "building";
      this.locked = false;
      this.onChange();
    }, 700);
  }

  /** 答對後畫面會停在原地，使用者按這個按鈕才會真的前進到下一題 */
  advanceToNextQuestion(): void {
    if (this.feedback !== "correct") return;
    this.index += 1;
    this.feedback = "building";
    this.locked = false;
    this.onChange();
  }

  restart(): void {
    this.index = 0;
    this.feedback = "building";
    this.locked = false;
    this.correctCount = 0;
    this.wrongCount = 0;
    for (const q of this.questions) {
      for (const o of q.options) o.status = "idle";
    }
    this.onChange();
  }
}
