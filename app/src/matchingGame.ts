// Stage A 題型：單字配對（英文 <-> 中文）。
// 這個檔案只管遊戲狀態與規則，不碰 DOM——畫面渲染交給 main.ts，方便未來替換題型時重用同一套模式。

import type { Vocab } from "./types";

export type CardStatus = "idle" | "selected" | "correct" | "wrong";

export interface MatchCard {
  vocabId: string;
  text: string;
  status: CardStatus;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 兩個單字是不是同義詞（例如 dad/daddy/father、grandma/grandmother） */
function isSynonymPair(a: Vocab, b: Vocab): boolean {
  return a.related_forms.includes(b.id) || b.related_forms.includes(a.id);
}

/**
 * 分組成配對題的一組一組，並且盡量避免「同義詞（related_forms）同時出現在同一組」——
 * 像 grandma／grandmother 或 dad／daddy／father 中文意思幾乎一樣，同組出現時，
 * 配對遊戲會變成用刪去法猜英文拼字，而不是真的測驗字義理解，對學習沒有幫助。
 * 用貪婪法：依序把每個單字塞進「目前還沒滿、而且不會跟組內任何字衝突」的組別裡，
 * 找不到就退而求其次塞進最不滿的組別（避免單字被漏掉）。
 */
/** 匯出給「字卡暖身」學習單元（flashcardGame.ts）沿用同一套分批邏輯，不要另外設計一份——
 * 兩邊都需要「依主題單字分批、同一批不出現同義詞」的規則，行為要完全一致。 */
export function buildBatchesAvoidingSynonymClashes(items: Vocab[], size: number): Vocab[][] {
  const shuffled = shuffle(items);
  const numBatches = Math.max(1, Math.ceil(shuffled.length / size));
  const batches: Vocab[][] = Array.from({ length: numBatches }, () => []);

  for (const vocab of shuffled) {
    const openBatches = batches.filter((b) => b.length < size);

    const conflictFree = openBatches
      .filter((b) => !b.some((existing) => isSynonymPair(existing, vocab)))
      .sort((a, b) => a.length - b.length);

    if (conflictFree.length > 0) {
      conflictFree[0].push(vocab);
      continue;
    }

    // 找不到完全不衝突的組（同義詞群比組數還多時才會發生），退而求其次選最不滿的組。
    const leastFull = openBatches.sort((a, b) => a.length - b.length)[0];
    leastFull.push(vocab);
  }

  return batches.filter((b) => b.length > 0);
}

export class MatchingGame {
  private batches: Vocab[][];
  private batchIndex = 0;

  englishCards: MatchCard[] = [];
  chineseCards: MatchCard[] = [];

  private selectedEnglishId: string | null = null;
  private selectedChineseId: string | null = null;
  private locked = false; // 短暫鎖住輸入，讓錯誤配對的紅色回饋有時間被看到

  correctCount = 0;
  wrongCount = 0;

  /** 狀態變動時呼叫，由外部（main.ts）接上重新渲染畫面 */
  onChange: () => void = () => {};
  /** 配對「答對」的那一刻呼叫一次（不是每次 render 都會呼叫），給 main.ts 接上音效用 */
  onCorrect: () => void = () => {};
  /** 配對「答錯」的那一刻呼叫一次，給 main.ts 接上音效用 */
  onWrong: () => void = () => {};

  constructor(
    private readonly topicVocabs: Vocab[],
    private readonly batchSize = 6
  ) {
    this.batches = buildBatchesAvoidingSynonymClashes(topicVocabs, batchSize);
    this.loadBatch(0);
  }

  get totalBatches(): number {
    return this.batches.length;
  }

  get currentBatchNumber(): number {
    return this.batchIndex + 1;
  }

  get isBatchComplete(): boolean {
    return this.englishCards.every((c) => c.status === "correct");
  }

  get isRoundComplete(): boolean {
    return this.isBatchComplete && this.batchIndex === this.batches.length - 1;
  }

  get totalVocabCount(): number {
    return this.topicVocabs.length;
  }

  private loadBatch(index: number): void {
    this.batchIndex = index;
    const batch = this.batches[index];
    this.englishCards = shuffle(
      batch.map((v) => ({ vocabId: v.id, text: v.en, status: "idle" as CardStatus }))
    );
    this.chineseCards = shuffle(
      batch.map((v) => ({ vocabId: v.id, text: v.zh, status: "idle" as CardStatus }))
    );
    this.selectedEnglishId = null;
    this.selectedChineseId = null;
    this.locked = false;
  }

  advanceToNextBatch(): void {
    if (this.batchIndex < this.batches.length - 1) {
      this.loadBatch(this.batchIndex + 1);
      this.onChange();
    }
  }

  restart(): void {
    this.batches = buildBatchesAvoidingSynonymClashes(this.topicVocabs, this.batchSize);
    this.correctCount = 0;
    this.wrongCount = 0;
    this.loadBatch(0);
    this.onChange();
  }

  selectEnglish(vocabId: string): void {
    if (this.locked) return;
    const card = this.englishCards.find((c) => c.vocabId === vocabId);
    if (!card || card.status === "correct") return;
    this.selectedEnglishId = vocabId;
    this.syncSelectedStatus();
    this.tryEvaluate();
  }

  selectChinese(vocabId: string): void {
    if (this.locked) return;
    const card = this.chineseCards.find((c) => c.vocabId === vocabId);
    if (!card || card.status === "correct") return;
    this.selectedChineseId = vocabId;
    this.syncSelectedStatus();
    this.tryEvaluate();
  }

  private syncSelectedStatus(): void {
    for (const c of this.englishCards) {
      if (c.status !== "correct") {
        c.status = c.vocabId === this.selectedEnglishId ? "selected" : "idle";
      }
    }
    for (const c of this.chineseCards) {
      if (c.status !== "correct") {
        c.status = c.vocabId === this.selectedChineseId ? "selected" : "idle";
      }
    }
    this.onChange();
  }

  private tryEvaluate(): void {
    if (!this.selectedEnglishId || !this.selectedChineseId) return;

    const isMatch = this.selectedEnglishId === this.selectedChineseId;
    const enCard = this.englishCards.find((c) => c.vocabId === this.selectedEnglishId)!;
    const zhCard = this.chineseCards.find((c) => c.vocabId === this.selectedChineseId)!;

    if (isMatch) {
      enCard.status = "correct";
      zhCard.status = "correct";
      this.correctCount += 1;
      this.selectedEnglishId = null;
      this.selectedChineseId = null;
      this.onChange();
      this.onCorrect();
      return;
    }

    this.wrongCount += 1;
    enCard.status = "wrong";
    zhCard.status = "wrong";
    this.locked = true;
    this.onChange();
    this.onWrong();

    setTimeout(() => {
      enCard.status = "idle";
      zhCard.status = "idle";
      this.selectedEnglishId = null;
      this.selectedChineseId = null;
      this.locked = false;
      this.onChange();
    }, 600);
  }
}
