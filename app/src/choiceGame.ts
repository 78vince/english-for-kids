// 選擇題型：短文理解（對應 content/passages/<topic>.json 裡的 questions[]）。
// 這是 Stage C「短文閱讀＋理解性選擇題」的核心玩法：先讀短文，再針對短文逐題單選作答。

import type { Passage, PassageQuestion } from "./types";

export type ChoiceFeedback = "building" | "correct" | "wrong";

export interface ChoiceOptionState {
  text: string;
  status: "idle" | "correct" | "wrong";
}

export class ChoiceGame {
  private index = 0;
  private locked = false;

  optionStates: ChoiceOptionState[] = [];
  feedback: ChoiceFeedback = "building";
  correctCount = 0;
  wrongCount = 0;

  onChange: () => void = () => {};
  /** 這一題「答對」的那一刻呼叫一次（不是每次 render 都會呼叫），給 main.ts 接上音效用 */
  onCorrect: () => void = () => {};
  /** 這一題「答錯」的那一刻呼叫一次，給 main.ts 接上音效用 */
  onWrong: () => void = () => {};

  constructor(public readonly passage: Passage) {
    if (passage.questions.length === 0) {
      throw new Error(`短文 "${passage.id}" 沒有理解題（questions 是空的）`);
    }
    this.loadOptions();
  }

  get currentQuestion(): PassageQuestion {
    return this.passage.questions[this.index];
  }

  get currentQuestionNumber(): number {
    return this.index + 1;
  }

  get totalQuestions(): number {
    return this.passage.questions.length;
  }

  get isRoundComplete(): boolean {
    return this.index >= this.passage.questions.length;
  }

  private loadOptions(): void {
    if (this.isRoundComplete) {
      this.optionStates = [];
      return;
    }
    this.optionStates = this.currentQuestion.options.map((text) => ({
      text,
      status: "idle" as const,
    }));
  }

  selectOption(text: string): void {
    if (this.locked || this.isRoundComplete) return;
    const question = this.currentQuestion;
    const option = this.optionStates.find((o) => o.text === text);
    if (!option) return;

    if (text === question.answer) {
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
    this.loadOptions();
    this.onChange();
  }

  restart(): void {
    this.index = 0;
    this.feedback = "building";
    this.locked = false;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.loadOptions();
    this.onChange();
  }
}
