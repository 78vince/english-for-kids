// 「字卡暖身」學習單元：插在 Stage A（單字配對）之前的新關卡，先用字卡讓使用者記憶單字，
// 字卡跟測驗題交錯出現——但不是「一張字卡接一題測驗」這麼細碎，而是每次看 groupSize
// （預設 3）張字卡，再接著考這一小組的測驗，這樣比較有節奏感，不會太快太瑣碎
// （使用者實測回饋：原本一次一張太呆板，改成小組進行）。
//
// 這裡刻意不重新設計分批規則——沿用 matchingGame.ts 的 buildBatchesAvoidingSynonymClashes()
// （依主題單字分批、同一批不會出現同義詞），在這個「批」（預設 6 個字）底下再切成更小的
// 「組」（預設 3 個字）決定字卡跟測驗交錯的節奏；測驗選項的干擾邏輯沿用 flashcardQuestions.ts。
//
// 答錯處理（使用者實測回饋）：答錯不是原地讓使用者馬上重試同一題，而是把這個字丟回這一組
// 「待考隊伍」的最後面，稍後（通常是考完組內其他字之後）才會再考一次，直到答對為止才會
// 離開隊伍——如果這一組只剩這一個字沒過，就會連續再考這個字（但每次都是重新出題，
// 題型可能換一種）。這個檔案只管「字卡／測驗」這個新狀態機本身的流程：目前在哪一批、
// 哪一組、字卡看到第幾張、測驗待考隊伍裡還剩哪些字。

import type { Vocab, PassageQuestion } from "./types";
import { buildBatchesAvoidingSynonymClashes } from "./matchingGame";
import { buildFlashcardQuizQuestion, pickRandomQuizType } from "./flashcardQuestions";

export type FlashcardPhase = "card" | "quiz";

export interface FlashcardQuizOptionState {
  text: string;
  status: "idle" | "correct" | "wrong";
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 把一批單字切成固定大小的小組（最後一組可能不足 size 個，是正常情況）。 */
function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

export class FlashcardGame {
  private batches: Vocab[][];
  private batchIndex = 0;
  private groups: Vocab[][] = [];
  private groupIndex = 0;
  private cardIndexInGroup = 0;
  /** 這一組還沒答對過的單字，答錯會被丟回隊伍最後面，稍後才會再考——不是原地重試同一題。
   * 隊伍清空（每個字都至少答對一次）才算這一組的測驗結束。 */
  private quizQueue: Vocab[] = [];
  private locked = false;
  private roundComplete = false;

  /** 使用者按「跳過字卡，直接測驗」時打開——之後每一組都不再顯示字卡畫面，
   * 直接進測驗（給重玩同一個主題、已經很熟的孩子用，跟使用者確認過是建議功能，非硬性規定）。 */
  skipCards = false;

  phase: FlashcardPhase = "card";
  quizQuestion: PassageQuestion | null = null;
  optionStates: FlashcardQuizOptionState[] = [];
  feedback: "building" | "correct" | "wrong" = "building";

  correctCount = 0;
  wrongCount = 0;
  /** 已經完全答對過一次（離開待考隊伍）的單字數，答錯被丟回隊伍重考的字不算，
   * 給畫面顯示「已學會 N / 總共 M 個單字」用——比「第幾個字」更準確，因為答錯重考
   * 會讓單字的出現順序跟位置不再是固定的。 */
  masteredCount = 0;

  /** 狀態變動時呼叫，由外部（main.ts）接上重新渲染畫面 */
  onChange: () => void = () => {};
  /** 測驗「答對」的那一刻呼叫一次，給 main.ts 接上音效用 */
  onCorrect: () => void = () => {};
  /** 測驗「答錯」的那一刻呼叫一次，給 main.ts 接上音效用 */
  onWrong: () => void = () => {};
  /** 每次「顯示一張新字卡」時呼叫一次（不是每次 render 都會呼叫，也不會在 skipCards 開著
   * 時觸發），給 main.ts 接上 speakEnglish(vocab.en) 做「進入畫面自動唸一次單字」用。 */
  onCardShown: (vocab: Vocab) => void = () => {};
  /** 每次「顯示一題新測驗」時呼叫一次（不管是這一組第一次考、還是答錯被丟回隊伍後重考），
   * 給 main.ts 接上「聽音題型自動播放語音」用——question.listen_word 有值才需要真的播放。 */
  onQuizShown: (question: PassageQuestion) => void = () => {};

  constructor(
    private readonly topicVocabs: Vocab[],
    private readonly batchSize = 6,
    private readonly groupSize = 3
  ) {
    this.batches = buildBatchesAvoidingSynonymClashes(topicVocabs, batchSize);
    this.enterBatch(0);
  }

  get totalBatches(): number {
    return this.batches.length;
  }

  get currentBatchNumber(): number {
    return Math.min(this.batchIndex + 1, this.batches.length);
  }

  get currentGroup(): Vocab[] {
    return this.groups[this.groupIndex] ?? [];
  }

  get currentVocab(): Vocab {
    return this.currentGroup[this.cardIndexInGroup];
  }

  get cardPositionInGroup(): number {
    return this.cardIndexInGroup + 1;
  }

  get groupCardCount(): number {
    return this.currentGroup.length;
  }

  get totalVocabCount(): number {
    return this.topicVocabs.length;
  }

  get isRoundComplete(): boolean {
    return this.roundComplete;
  }

  /** 目前正在測驗的單字 id（quizQueue 最前面那個，不是字卡階段時就是 null）——
   * 主要給驗證腳本用來確認「答錯的字有沒有真的被排到隊伍後面、換考別的字」，
   * 不用另外去解析 quizQuestion.id 裡的 vocab id（vocab id 本身就含有點號，字串解析容易出錯）。 */
  get currentQuizVocabId(): string | null {
    return this.phase === "quiz" ? (this.quizQueue[0]?.id ?? null) : null;
  }

  /** 這一題如果答對，整個字卡暖身關卡是不是就結束了——給畫面決定要顯示「下一題」
   * 還是「查看結果」用。因為答錯的字會被丟回隊伍重考，不能單純看「第幾個字」判斷，
   * 要看「待考隊伍只剩這一個字，而且已經是最後一批最後一組」才知道。 */
  get isFinalWordOfRound(): boolean {
    return (
      this.quizQueue.length === 1 &&
      this.groupIndex === this.groups.length - 1 &&
      this.batchIndex === this.batches.length - 1
    );
  }

  /** 切到某一批，重新照 groupSize 切成小組，從第一組的第一張字卡開始
   * （不會自己觸發 onChange，由呼叫端統一在最後呼叫一次）。 */
  private enterBatch(index: number): void {
    this.batchIndex = index;
    this.groups = chunk(shuffle(this.batches[index]), this.groupSize);
    this.groupIndex = 0;
    this.enterGroupCards();
  }

  private enterGroupCards(): void {
    this.cardIndexInGroup = 0;
    this.enterCardPhaseForCurrentIndex();
  }

  /** 進入目前這一組、目前這個 index 的字卡階段。skipCards 開著的話，整組字卡都瞬間帶過，
   * 直接進這一組的測驗，不會真的把字卡畫面渲染給使用者看到，也不會觸發 onCardShown。 */
  private enterCardPhaseForCurrentIndex(): void {
    this.phase = "card";
    this.quizQuestion = null;
    this.optionStates = [];
    this.feedback = "building";
    this.locked = false;

    if (this.skipCards) {
      this.enterGroupQuiz();
      return;
    }
    this.onCardShown(this.currentVocab);
  }

  /** 這一組的字卡看完了（或被 skipCards 跳過），把整組單字打散排進待考隊伍，開始測驗。 */
  private enterGroupQuiz(): void {
    this.quizQueue = shuffle(this.currentGroup);
    this.loadNextQuizFromQueue();
  }

  /** 從待考隊伍最前面的單字組一題新的測驗（不管是這一組第一次考、還是答錯重排到隊伍尾端後
   * 排到的重考，都會重新隨機挑一種題型出題，不是每次都問一樣的問題）。
   * 隊伍空了代表這一組全部答對，前進到下一組／下一批／整個關卡結束。 */
  private loadNextQuizFromQueue(): void {
    if (this.quizQueue.length === 0) {
      this.advanceToNextGroupOrBatchOrFinish();
      return;
    }
    const vocab = this.quizQueue[0];
    const quizType = pickRandomQuizType();
    const question = buildFlashcardQuizQuestion(vocab, this.topicVocabs, quizType);
    if (!question) {
      // 主題單字太少湊不出干擾選項（理論上不會發生，至少要有 Stage A 配對可玩的單字量），
      // 保險起見直接算這個字過關，往隊伍下一個前進，不讓畫面卡住。
      this.quizQueue.shift();
      this.masteredCount += 1;
      this.loadNextQuizFromQueue();
      return;
    }
    this.phase = "quiz";
    this.quizQuestion = question;
    this.optionStates = question.options.map((text) => ({ text, status: "idle" as const }));
    this.feedback = "building";
    this.locked = false;
    this.onQuizShown(question);
  }

  private advanceToNextGroupOrBatchOrFinish(): void {
    const nextGroupIndex = this.groupIndex + 1;
    if (nextGroupIndex < this.groups.length) {
      this.groupIndex = nextGroupIndex;
      this.enterGroupCards();
    } else if (this.batchIndex + 1 < this.batches.length) {
      this.enterBatch(this.batchIndex + 1);
    } else {
      this.roundComplete = true;
      this.phase = "card";
      this.quizQuestion = null;
      this.optionStates = [];
    }
  }

  /** 字卡畫面「下一張」／「開始測驗」按鈕都呼叫這個——同一組還有下一張字卡就換下一張，
   * 這一組字卡都看完了就開始這一組的測驗，呼叫端不用自己判斷是哪一種情況。 */
  advanceCard(): void {
    if (this.isRoundComplete || this.phase !== "card") return;
    const nextIndex = this.cardIndexInGroup + 1;
    if (nextIndex < this.currentGroup.length) {
      this.cardIndexInGroup = nextIndex;
      this.enterCardPhaseForCurrentIndex();
    } else {
      this.enterGroupQuiz();
    }
    this.onChange();
  }

  selectQuizOption(text: string): void {
    if (this.locked || this.phase !== "quiz" || !this.quizQuestion) return;
    const option = this.optionStates.find((o) => o.text === text);
    if (!option) return;

    if (text === this.quizQuestion.answer) {
      // 答對了：畫面停在這裡，等使用者自己按「下一個字」，不用計時器自動跳。
      option.status = "correct";
      this.feedback = "correct";
      this.correctCount += 1;
      this.locked = true;
      this.onChange();
      this.onCorrect();
      return;
    }

    // 答錯：跟其他題型不一樣，這裡不是原地讓使用者馬上重試同一題，而是把這個字丟回
    // 待考隊伍最後面、換考隊伍裡的下一個字，這個字稍後才會重新出現（使用者實測回饋：
    // 答錯的字要往後安排再次出現，直到每個單字都答對為止）。畫面停在這裡，等使用者
    // 自己按按鈕才會真的換題——原本是 700ms 自動計時器，使用者反應停頓時間太短，
    // 來不及看清楚答錯提示跟 reveal_en/reveal_zh 顯示的正確答案，改成跟答對一樣
    // 由使用者自己按按鈕決定什麼時候繼續。
    option.status = "wrong";
    this.feedback = "wrong";
    this.wrongCount += 1;
    this.locked = true;
    this.onChange();
    this.onWrong();
  }

  /** 答對測驗後呼叫這個：這個字算過關，離開待考隊伍，前進到隊伍裡下一個字／下一組／下一批／
   * 整個關卡結束（不能在字卡階段呼叫，也不能在測驗還沒答對時呼叫）。 */
  advanceToNextWord(): void {
    if (this.phase !== "quiz" || this.feedback !== "correct") return;
    this.quizQueue.shift();
    this.masteredCount += 1;
    this.loadNextQuizFromQueue();
    this.onChange();
  }

  /** 答錯測驗後呼叫這個：使用者看完錯誤提示跟正確答案、自己按按鈕才會把這個字丟回
   * 待考隊伍最後面、換考隊伍裡的下一個字（不能在字卡階段呼叫，也不能在還沒答錯時呼叫）。 */
  continueAfterWrong(): void {
    if (this.phase !== "quiz" || this.feedback !== "wrong") return;
    const missedVocab = this.quizQueue.shift();
    if (missedVocab) this.quizQueue.push(missedVocab);
    this.loadNextQuizFromQueue();
    this.onChange();
  }

  /** 開/關「跳過字卡，直接測驗」；打開的當下如果正停在字卡畫面，直接把這一整組都跳去測驗，
   * 不用等使用者一張一張把剩下的字卡按完。 */
  setSkipCards(value: boolean): void {
    this.skipCards = value;
    if (value && this.phase === "card" && !this.isRoundComplete) {
      this.enterGroupQuiz();
      this.onChange();
    }
  }

  restart(): void {
    this.batches = buildBatchesAvoidingSynonymClashes(this.topicVocabs, this.batchSize);
    this.correctCount = 0;
    this.wrongCount = 0;
    this.masteredCount = 0;
    this.roundComplete = false;
    this.enterBatch(0);
    this.onChange();
  }
}
