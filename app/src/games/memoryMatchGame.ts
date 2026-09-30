// 遊戲室第一款打樣遊戲：翻牌配對（Memory Match）。跟其餘題型引擎
// （matchingGame.ts／orderingGame.ts／conversationGame.ts）同一套模式：這裡只管
// 遊戲狀態與規則，不碰 DOM——畫面渲染交給 main.ts 的 renderMemoryMatch()。
//
// 玩法：不綁定特定主題（遊戲室是跟主題平行的功能，使用者可能還沒選主題就從導覽列
// 直接進來），main.ts 負責從全部主題的 vocab 資料庫隨機抽 3 組 {en, zh} 配對傳進來，
// 這裡把每組拆成兩張卡片（一張顯示英文、一張顯示中文），共 6 張卡片打散排列。
//
// 2026-09-28 使用者回饋新增「開局記憶」流程：一開始先把全部卡片翻開讓使用者看幾秒鐘、
// 記住位置，時間到才自動蓋牌，接著才能開始正式翻牌配對（見 phase 狀態機說明）。
//
// 2026-09-28（同一天，第二次回饋）新增「三關關卡機制」：同一局遊戲要連續闖三關才算
// 破關（使用者選定的方向，見 HANDOFF 9.126/9.127 討論）。三關共用同一組 3 對配對內容
// （只是每一關重新排列位置、重新倒數），差別在於「開局記憶」倒數結束之後：
// - 第 1 關：倒數結束直接開始遊戲（原本的行為）。
// - 第 2 關：倒數結束後，隨機挑 2 張卡片互換位置（附移動動畫，交給 renderer 處理），
//   換完才開始遊戲——考驗使用者能不能在記憶位置被打亂後還抓得到配對。
// - 第 3 關：倒數結束後，隨機挑 4 張卡片（兩兩一組，共兩次互換）換位置，難度更高。
//   2026-09-29 使用者回饋：這兩次互換不要同時發生，改成先換第一組、動畫播完才換
//   第二組（見 performSwapStep()），比較看得清楚每一步發生了什麼事。
// 過了第 1、2 關會有短暫的「過關」訊息停留，然後自動重新排列進入下一關；過了第 3 關
// 才是真正的「遊戲結束」畫面。這個遊戲純粹是休閒獎勵，不記錄到 progress.ts、不影響任何
// 徽章或積分（見最早的 handoff 設計背景），全破之後想再玩只能重新抽新的一組並再次扣代幣。

export interface MemoryCard {
  id: string; // 每組 pair 兩張卡片各自的唯一 id
  pairId: string; // 同一組配對的兩張卡片共用同一個 pairId
  display: string; // 卡片正面顯示的文字（英文或中文）
  isFlipped: boolean;
  isMatched: boolean;
}

/** 遊戲進行到哪個階段：
 * - "reveal"：開局記憶倒數時間，全部卡片翻開顯示、畫面上有數字倒數，使用者不能翻牌
 *   （flip() 直接忽略），倒數到 0 自動進入下一步（"shuffling" 或直接 "playing"）。
 * - "shuffling"：只有第 2/3 關才會經過這個階段——倒數結束後，隨機幾張卡片互換位置
 *   （帶移動動畫），換完才會進到 "playing"。這個階段一樣不能翻牌。
 * - "playing"：正式翻牌配對階段，flip() 正常運作。
 * - "levelComplete"：這一關全部配對完成，但還沒破完三關——顯示「過關」訊息，短暫停留後
 *   自動進入下一關（重新排列＋重新倒數）。
 * - "complete"：三關全部破完。 */
export type MemoryMatchPhase = "reveal" | "shuffling" | "playing" | "levelComplete" | "complete";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 總共三關，難度依序遞增（見檔案開頭說明）。 */
export const LEVEL_COUNT = 3;

/** 每一關「倒數結束後」要互換位置的卡片張數，index 0 對應第 1 關。0 代表不換位置。 */
const SHUFFLE_CARD_COUNTS = [0, 2, 4];

export function shuffleCardCountForLevel(level: number): number {
  return SHUFFLE_CARD_COUNTS[level - 1] ?? 0;
}

// 開局記憶時間：全部卡片翻開讓使用者記住位置的秒數（畫面上會顯示 5,4,3,2,1 倒數）。
// 這個數字沒有經過實機測試微調，先用一個「感覺合理」的預設值上線，之後有真人試玩回饋
// 覺得太快/太慢再回頭調整。
export const REVEAL_DURATION_MS = 5000;

// 交換位置的移動動畫播放時間——renderer 那邊的 CSS transform 動畫時長要跟這個數字
// 搭配好，不然畫面可能動畫還沒播完就已經翻牌開始了。
// 2026-09-28 使用者回饋動畫太快、換完位置應該多停留一下再蓋牌，所以拆成兩段：
// 「移動本身播放多久」＋「移動播完之後、蓋牌開始遊戲之前，再讓使用者多看幾秒」。
// 2026-09-29 使用者再次回饋還要再慢一點，把兩段時間都拉長。
export const SHUFFLE_MOVE_DURATION_MS = 1400;
const SHUFFLE_SETTLE_PAUSE_MS = 900;
// 從「觸發一次交換」到「這次交換的移動動畫播完＋額外停留」的延遲——這個值同時當作
// performSwapStep() 每一步之間的間隔，以及最後一步結束後、真正蓋牌進入 playing 前的
// 延遲，等於「移動動畫播完」+「額外停留」。
const SHUFFLE_ANIMATION_MS = SHUFFLE_MOVE_DURATION_MS + SHUFFLE_SETTLE_PAUSE_MS;

// 過關訊息停留多久之後自動進入下一關。
const LEVEL_COMPLETE_PAUSE_MS = 1400;

// 配對失敗時，蓋回去之前讓使用者看清楚兩張牌長什麼樣子的延遲——跟 matchingGame.ts
// 答錯後 600ms 才恢復 idle 的手感一致。
const MISMATCH_FLIP_BACK_DELAY_MS = 800;

export class MemoryMatchGame {
  cards: MemoryCard[] = [];
  moveCount = 0; // 累計整個三關的翻牌次數，不分關卡重置
  phase: MemoryMatchPhase = "reveal";
  level = 1;
  /** 開局記憶倒數還剩幾秒（整數，給畫面顯示用），到 0 就會自動進入下一步。 */
  revealSecondsRemaining: number;

  private readonly pairs: { en: string; zh: string }[];
  private readonly revealDurationMs: number;
  private readonly revealTotalSeconds: number;
  private readonly shuffleAnimationMs: number;
  private readonly levelCompletePauseMs: number;

  private flippedIds: string[] = [];
  private isJudging = false; // 已經翻開兩張、還在延遲判定期間，忽略新的 flip() 呼叫
  private countdownTimer: ReturnType<typeof setInterval> | undefined;

  /** 狀態變動時呼叫，由外部（main.ts）接上重新渲染畫面 */
  onChange: () => void = () => {};
  /** 三關全部破完時呼叫一次 */
  onComplete: () => void = () => {};
  /** 使用者翻開一張卡片時呼叫（給翻牌音效用；開局記憶階段自動翻開的卡片不算，
   * 只有正式配對階段使用者主動翻的才會觸發） */
  onFlip: () => void = () => {};
  /** 卡片蓋回去時呼叫一次（給覆牌音效用）：開局記憶時間結束（或交換位置結束）全部蓋牌、
   * 或配對失敗兩張蓋回去，都會觸發 */
  onCoverBack: () => void = () => {};
  /** 翻兩張配對成功時呼叫（給答對音效用） */
  onMatch: () => void = () => {};
  /** 翻兩張配對失敗時呼叫（給答錯音效用） */
  onMismatch: () => void = () => {};
  /** 這一關全部配對完成、但還沒破完三關時呼叫一次，帶入「剛過的是第幾關」。
   * renderer 可以用這個時機播放過關音效、顯示「準備進入下一關」訊息。 */
  onLevelComplete: (level: number) => void = () => {};
  /** 開局記憶倒數結束、即將互換一組卡片位置時呼叫（只有第 2/3 關會觸發），帶入即將互換
   * 的卡片 id（例如 [["pair-0-en", "pair-1-zh"]] 代表這兩張要互換）。
   * 2026-09-29 改版：第 3 關有兩組要換的卡片時，改成「一組換完、動畫播完，才換下一組」
   * （不是兩組同時換），所以這個事件現在每次都只帶「一組」（陣列長度固定是 1），
   * 一次 performShuffle() 可能觸發多次 onShuffleStart。
   * 呼叫這個事件的當下卡片陣列「還沒」真正互換，讓 renderer 有機會先記錄下舊的畫面座標，
   * 才能在互換後做 FLIP 移動動畫（先記錄舊位置→套用新順序→算出位移量→從位移量動畫
   * 回到 0）。 */
  onShuffleStart: (swapPairs: [string, string][]) => void = () => {};

  constructor(
    pairs: { en: string; zh: string }[],
    revealDurationMs: number = REVEAL_DURATION_MS,
    shuffleAnimationMs: number = SHUFFLE_ANIMATION_MS,
    levelCompletePauseMs: number = LEVEL_COMPLETE_PAUSE_MS
  ) {
    this.pairs = pairs;
    this.revealDurationMs = revealDurationMs;
    this.revealTotalSeconds = Math.max(1, Math.round(revealDurationMs / 1000));
    this.revealSecondsRemaining = this.revealTotalSeconds;
    this.shuffleAnimationMs = shuffleAnimationMs;
    this.levelCompletePauseMs = levelCompletePauseMs;
    this.setupLevel();
  }

  /** 開始（或重新開始）目前這一關：把 pairs 重新拆成卡片、洗牌、全部翻開，
   * 重置翻牌相關的內部狀態，並啟動開局記憶倒數。 */
  private setupLevel(): void {
    const cards: MemoryCard[] = [];
    this.pairs.forEach((pair, index) => {
      const pairId = `pair-${index}`;
      // 開局記憶階段全部翻開（isFlipped: true），讓使用者先看清楚每張卡片的內容。
      cards.push({ id: `${pairId}-en`, pairId, display: pair.en, isFlipped: true, isMatched: false });
      cards.push({ id: `${pairId}-zh`, pairId, display: pair.zh, isFlipped: true, isMatched: false });
    });
    this.cards = shuffle(cards);
    this.flippedIds = [];
    this.isJudging = false;
    this.phase = "reveal";
    this.startCountdown();
  }

  private startCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.revealSecondsRemaining = this.revealTotalSeconds;
    const tickMs = this.revealDurationMs / this.revealTotalSeconds;
    this.countdownTimer = setInterval(() => {
      this.revealSecondsRemaining -= 1;
      this.onChange();
      if (this.revealSecondsRemaining <= 0) {
        clearInterval(this.countdownTimer!);
        this.countdownTimer = undefined;
        this.endRevealPhase();
      }
    }, tickMs);
  }

  private endRevealPhase(): void {
    if (this.phase !== "reveal") return; // 保險起見：理論上不會提早離開 reveal 階段
    const shuffleCount = shuffleCardCountForLevel(this.level);
    if (shuffleCount > 0) {
      this.phase = "shuffling";
      this.performShuffle(shuffleCount);
    } else {
      this.startPlaying();
    }
  }

  /** 隨機挑 count 張卡片（兩兩一組互換），觸發 onShuffleStart 給 renderer 機會做移動
   * 動畫。第 3 關（count=4，兩組要換）不是兩組同時換，而是換完第一組、等動畫播完，
   * 才開始換第二組——見 performSwapStep()。全部換完、最後再停留一段時間才真正進入
   * "playing" 階段。 */
  private performShuffle(count: number): void {
    const indices = shuffle([...this.cards.keys()]).slice(0, count);
    const swapPairs: [string, string][] = [];
    for (let i = 0; i + 1 < indices.length; i += 2) {
      swapPairs.push([this.cards[indices[i]].id, this.cards[indices[i + 1]].id]);
    }
    this.performSwapStep(swapPairs, 0);
  }

  /** 依序處理 swapPairs 裡的每一組互換：換這一組→等動畫播完→換下一組，全部換完之後
   * 才進入 "playing"（見檔案開頭 2026-09-29 的改版說明）。第 2 關只有 1 組，跟改版前
   * 行為一致；第 3 關有 2 組，這裡讓它們先後發生而不是同時發生。 */
  private performSwapStep(swapPairs: [string, string][], stepIndex: number): void {
    if (stepIndex >= swapPairs.length) {
      setTimeout(() => {
        this.startPlaying();
      }, this.shuffleAnimationMs);
      return;
    }

    const [idA, idB] = swapPairs[stepIndex];

    // 這個事件必須在真正互換陣列順序「之前」呼叫，讓 renderer 有機會先讀取舊的 DOM
    // 座標（getBoundingClientRect()），才能算出互換後的位移量做 FLIP 動畫。只帶這一組
    // （陣列長度固定是 1），不是一次帶全部要換的組數。
    this.onShuffleStart([[idA, idB]]);

    const idxA = this.cards.findIndex((c) => c.id === idA);
    const idxB = this.cards.findIndex((c) => c.id === idB);
    [this.cards[idxA], this.cards[idxB]] = [this.cards[idxB], this.cards[idxA]];
    this.onChange();

    setTimeout(() => {
      this.performSwapStep(swapPairs, stepIndex + 1);
    }, this.shuffleAnimationMs);
  }

  private startPlaying(): void {
    for (const card of this.cards) {
      card.isFlipped = false;
    }
    this.phase = "playing";
    this.onCoverBack();
    this.onChange();
  }

  get isComplete(): boolean {
    return this.phase === "complete";
  }

  /** 翻一張卡片。開局記憶／交換位置／過關訊息／已完成這幾個階段都忽略；已經翻開兩張
   * 還沒判定完成之前，忽略新的翻牌（避免連續快速點擊搞亂狀態）；已經翻開或已配對的
   * 卡片也忽略，不能重複翻同一張。 */
  flip(cardId: string): void {
    if (this.phase !== "playing") return;
    if (this.isJudging) return;
    const card = this.cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    card.isFlipped = true;
    this.flippedIds.push(cardId);
    this.onFlip();
    this.onChange();

    if (this.flippedIds.length < 2) return;

    this.isJudging = true;
    this.moveCount += 1;
    const [firstId, secondId] = this.flippedIds;
    const first = this.cards.find((c) => c.id === firstId)!;
    const second = this.cards.find((c) => c.id === secondId)!;

    if (first.pairId === second.pairId) {
      first.isMatched = true;
      second.isMatched = true;
      this.flippedIds = [];
      this.isJudging = false;
      this.onMatch();

      if (this.cards.every((c) => c.isMatched)) {
        if (this.level < LEVEL_COUNT) {
          const justFinishedLevel = this.level;
          this.phase = "levelComplete";
          this.onChange();
          this.onLevelComplete(justFinishedLevel);
          setTimeout(() => {
            this.level += 1;
            this.setupLevel();
            this.onChange();
          }, this.levelCompletePauseMs);
        } else {
          this.phase = "complete";
          this.onChange();
          this.onComplete();
        }
      } else {
        this.onChange();
      }
      return;
    }

    this.onMismatch();
    setTimeout(() => {
      first.isFlipped = false;
      second.isFlipped = false;
      this.flippedIds = [];
      this.isJudging = false;
      this.onCoverBack();
      this.onChange();
    }, MISMATCH_FLIP_BACK_DELAY_MS);
  }
}
