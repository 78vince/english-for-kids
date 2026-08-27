// Stage B 題型：句子排序（把打散的字塊依正確順序組成例句）。
// 跟 matchingGame.ts 一樣，只管狀態不碰 DOM，畫面渲染交給 main.ts。

import type { Sentence } from "./types";

export type TokenStatus = "pool" | "placed";

export interface OrderingToken {
  instanceId: string;
  text: string;
  originalIndex: number; // 這個字塊在正確句子中應該在第幾個位置
  status: TokenStatus;
}

export type RoundFeedback = "building" | "correct" | "wrong";

/** 連續答錯幾次之後，開始出現「提示」按鈕 */
const HINT_AFTER_WRONG_ATTEMPTS = 2;
/** 連續答錯幾次之後，開始出現「跳過」按鈕 */
const SKIP_AFTER_WRONG_ATTEMPTS = 4;

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

export class OrderingGame {
  private sentenceIndex = 0;
  private locked = false;
  /**
   * 這一句正確的文字順序（例如 ["This","is","my","father.","He","is","a","doctor."]）。
   * 判斷答對/答錯、以及每個位置對不對，都要拿「文字」去跟這個比對，不能拿 originalIndex
   * 去比對字塊實例——因為像 "is" 這種字會在同一句裡出現兩次，兩個 "is" 字塊看起來一模一樣、
   * 完全可以互換，用哪個實例放哪個位置其實不重要，只要位置上的文字對了就是對的。
   * 之前拿 originalIndex 比對，會出現「排出來的句子看起來完全正確，卻被判定答錯」的問題，
   * 原因就是使用者剛好把兩個 "is" 字塊的位置互換了。
   */
  private canonicalWords: string[] = [];

  pool: OrderingToken[] = [];
  placed: OrderingToken[] = [];
  feedback: RoundFeedback = "building";

  correctCount = 0;
  wrongCount = 0;
  skippedCount = 0;

  /** 這一句連續答錯的次數，答對或換下一句就歸零；用來決定何時出現提示/跳過按鈕 */
  wrongStreak = 0;

  /** 這一整輪（從進到 Stage B-1 到全部句子答完）有沒有用過提示——只要用過一次就一直是 true，
   * 不會在換下一句時重置，給「完美關卡」成就徽章（PF-01：全對且未使用提示）判斷用。 */
  hintUsedThisRound = false;

  onChange: () => void = () => {};
  /** 這一句「答對」的那一刻呼叫一次（不是每次 render 都會呼叫），給 main.ts 接上音效用 */
  onCorrect: () => void = () => {};
  /** 這一句「答錯」的那一刻呼叫一次，給 main.ts 接上音效用 */
  onWrong: () => void = () => {};

  constructor(private readonly sentences: Sentence[]) {
    if (sentences.length === 0) {
      throw new Error("OrderingGame 需要至少一句話才能開始");
    }
    this.loadSentence(0);
  }

  get currentSentence(): Sentence {
    return this.sentences[this.sentenceIndex];
  }

  get currentSentenceNumber(): number {
    return this.sentenceIndex + 1;
  }

  get totalSentences(): number {
    return this.sentences.length;
  }

  get isRoundComplete(): boolean {
    return this.sentenceIndex >= this.sentences.length;
  }

  get canShowHint(): boolean {
    return !this.isRoundComplete && this.wrongStreak >= HINT_AFTER_WRONG_ATTEMPTS;
  }

  get canSkip(): boolean {
    return !this.isRoundComplete && this.wrongStreak >= SKIP_AFTER_WRONG_ATTEMPTS;
  }

  private loadSentence(index: number): void {
    this.sentenceIndex = index;
    this.feedback = "building";
    this.locked = false;
    this.wrongStreak = 0;
    this.placed = [];
    if (index >= this.sentences.length) {
      this.pool = [];
      this.canonicalWords = [];
      return;
    }
    const words = tokenize(this.sentences[index].en);
    this.canonicalWords = words;
    this.pool = shuffle(
      words.map((text, originalIndex) => ({
        instanceId: `${index}-${originalIndex}`,
        text,
        originalIndex,
        status: "pool" as TokenStatus,
      }))
    );
  }

  /** 給畫面渲染用：目前答案區第 index 個位置的字，是不是這一句正確順序該放的字（用文字比對，見 canonicalWords 的說明） */
  isPlacedCorrectAt(index: number): boolean {
    return this.placed[index]?.text === this.canonicalWords[index];
  }

  /** 點擊字塊池裡的字塊：直接放到答案區最後面 */
  placeToken(instanceId: string): void {
    this.insertFromPool(instanceId, null);
  }

  /**
   * 把字塊池裡的字塊插入到答案區指定字塊的前面（拖曳用）；
   * beforeInstanceId 傳 null 代表插到最後面（跟點擊字塊池的效果一樣）。
   */
  insertFromPool(instanceId: string, beforeInstanceId: string | null): void {
    if (this.locked) return;
    const poolIndex = this.pool.findIndex((t) => t.instanceId === instanceId);
    if (poolIndex === -1) return;
    const [token] = this.pool.splice(poolIndex, 1);
    token.status = "placed";

    const targetIndex =
      beforeInstanceId === null
        ? -1
        : this.placed.findIndex((t) => t.instanceId === beforeInstanceId);

    if (targetIndex === -1) {
      this.placed.push(token);
    } else {
      this.placed.splice(targetIndex, 0, token);
    }

    if (this.feedback === "wrong") this.feedback = "building";
    this.onChange();

    if (this.pool.length === 0) {
      this.evaluate();
    }
  }

  /** 把已放置的字塊送回字塊池（讓小朋友可以修正順序） */
  returnToken(instanceId: string): void {
    if (this.locked) return;
    const tokenIndex = this.placed.findIndex((t) => t.instanceId === instanceId);
    if (tokenIndex === -1) return;
    const [token] = this.placed.splice(tokenIndex, 1);
    token.status = "pool";
    this.pool.push(token);
    if (this.feedback === "wrong") this.feedback = "building";
    this.onChange();
  }

  /**
   * 拖曳排序：把已放置的字塊移到另一個已放置字塊的前面；
   * targetInstanceId 傳 null 代表移到最後面（拖到答案區空白處的情境）。
   */
  reorderPlaced(draggedInstanceId: string, targetInstanceId: string | null): void {
    if (this.locked) return;
    if (draggedInstanceId === targetInstanceId) return;
    const fromIndex = this.placed.findIndex((t) => t.instanceId === draggedInstanceId);
    if (fromIndex === -1) return;
    const [moved] = this.placed.splice(fromIndex, 1);

    const toIndex =
      targetInstanceId === null
        ? -1
        : this.placed.findIndex((t) => t.instanceId === targetInstanceId);

    if (toIndex === -1) {
      this.placed.push(moved);
    } else {
      this.placed.splice(toIndex, 0, moved);
    }

    if (this.feedback === "wrong") this.feedback = "building";
    this.onChange();

    // 拖曳重新排序後如果剛好全部字塊都在答案區了，等同於送出一次新答案，直接評分。
    if (this.pool.length === 0) {
      this.evaluate();
    }
  }

  /**
   * 提示：保留目前已經排對的開頭部分，把之後（不管在字塊池還是排錯位置）的字塊
   * 全部退回字塊池重新洗牌，並直接放上下一個正確位置該放的字——
   * 等於「幫你把下一個字定位」，讓卡關的孩子有個明確的下一步可以跟。
   */
  useHint(): void {
    if (this.locked || this.isRoundComplete) return;

    this.hintUsedThisRound = true;

    let confirmedPrefixLength = 0;
    while (this.isPlacedCorrectAt(confirmedPrefixLength)) {
      confirmedPrefixLength++;
    }

    const toReturn = this.placed.splice(confirmedPrefixLength);
    for (const t of toReturn) t.status = "pool";
    this.pool.push(...shuffle(toReturn));

    const nextSlot = confirmedPrefixLength;
    const nextWord = this.canonicalWords[nextSlot];
    // 同一個字可能在字塊池裡有好幾個實例（例如兩個 "is"），隨便選一個文字相符的就好，
    // 它們本來就可以互換。
    const correctTokenIndex = this.pool.findIndex((t) => t.text === nextWord);
    if (correctTokenIndex !== -1) {
      const [correctToken] = this.pool.splice(correctTokenIndex, 1);
      correctToken.status = "placed";
      this.placed.push(correctToken);
    }

    this.feedback = "building";
    this.wrongStreak = 0; // 用過提示後給孩子一個新的機會，不要一直卡在跳過按鈕的門檻上
    this.onChange();

    if (this.pool.length === 0) {
      this.evaluate();
    }
  }

  /** 放棄這句，直接跳到下一句（不計入答對，但也不會卡住整個關卡） */
  skipCurrentSentence(): void {
    if (this.isRoundComplete) return;
    this.skippedCount += 1;
    this.loadSentence(this.sentenceIndex + 1);
    this.onChange();
  }

  /** 答對後畫面會停在原地，使用者按這個按鈕才會真的前進到下一句 */
  advanceToNextSentence(): void {
    if (this.feedback !== "correct") return;
    this.loadSentence(this.sentenceIndex + 1);
    this.onChange();
  }

  private evaluate(): void {
    const isCorrect =
      this.placed.length === this.canonicalWords.length &&
      this.placed.every((_, i) => this.isPlacedCorrectAt(i));

    if (isCorrect) {
      // 答對了：畫面停在這裡（鎖住字塊，避免答對後還能亂動），
      // 由使用者自己按「下一句」的按鈕決定什麼時候前進，不用計時器自動跳。
      this.feedback = "correct";
      this.correctCount += 1;
      this.locked = true;
      this.onChange();
      this.onCorrect();
      return;
    }

    // 答錯了：保留使用者目前排的順序，不重新洗牌、不鎖住畫面——
    // 讓孩子自己看得出哪裡錯了，再手動調整，而不是被系統直接打回重來。
    this.feedback = "wrong";
    this.wrongCount += 1;
    this.wrongStreak += 1;
    this.onChange();
    this.onWrong();
  }

  restart(): void {
    this.correctCount = 0;
    this.wrongCount = 0;
    this.skippedCount = 0;
    this.hintUsedThisRound = false;
    this.loadSentence(0);
    this.onChange();
  }
}
