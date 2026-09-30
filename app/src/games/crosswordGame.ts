// 遊戲室第二款遊戲：填字遊戲（Crossword）。跟其餘遊戲引擎（memoryMatchGame.ts）同一套
// 模式：這裡只管遊戲狀態與規則，不碰 DOM——畫面渲染／拖曳互動交給
// games/crosswordStandalone.ts。見 docs/handoff-prompt-crossword-game.md 的背景說明。
//
// 玩法：讀入一份 Crossword 關卡資料（content/crosswords/*.json，排版已經由 content 端
// 離線用回溯演算法算好，交疊處字母保證一致），依照關卡座標把每個單字鋪到網格上，
// 算出每個格子的正確字母；每一關開始時依照「這一關要挖空幾格」的比例隨機決定哪些格子
// 當空格，字母區只放「這一關全部空格需要的正確字母」（不多給、不少給，順序打亂）。
// 使用者從字母區拖曳字母磚到空格上，答對永久固定、答錯彈回字母區（渲染端自己處理彈跳
// 動畫，這裡只負責判斷對錯、累計錯誤次數）。
//
// 關卡機制比照 memoryMatchGame.ts 的 phase 狀態機設計思路：同一組單字內容玩三關，
// 每一關挖空比例遞增（40% → 65% → 85~90%），破完三關才算真正完成；破關後用「三關加總
// 的錯誤次數」換算成 1-3 顆星的最高紀錄（見 starsForMistakes()，星等本身存到哪裡是
// 呼叫端／main.ts 的事，這裡只負責算出星等數字）。

import type { Crossword } from "../types";

/** 網格上單一格子的靜態資訊：座標＋這個座標唯一的正確答案（交疊格只會有一個字母，
 * content 端已經離線驗證過交疊處字母一致，這裡建構時再次確認，雙重保險）。 */
export interface CrosswordCell {
  row: number;
  col: number;
  letter: string;
}

/** 字母區的一枚字母磚。用 id 而不是直接用字母字串識別，是因為同一關可能有重複字母
 * （例如兩個 O），需要能區分「哪一枚磚」被拖走了。 */
export interface CrosswordTrayTile {
  id: string;
  letter: string;
}

/** - "playing"：正式作答階段，dropLetter() 正常運作。
 * - "levelComplete"：這一關全部空格都正確填滿，但還沒破完三關——顯示「過關」訊息，
 *   短暫停留後自動進入下一關（重新挑選空格、重新排列字母區）。
 * - "complete"：三關全部破完，可以計算星等。 */
export type CrosswordPhase = "playing" | "levelComplete" | "complete";

export const LEVEL_COUNT = 3;

// 每一關挖空的格子比例，index 0 對應第 1 關——難度遞增：40% → 65% → 85~90%。
const LEVEL_BLANK_RATIOS = [0.4, 0.65, 0.875];

// 第 3 關就算比例算出來要挖空更多格，也至少留這麼多格已知字母當「提示錨點」，避免完全
// 沒有任何已知字母、變成無從下手的裸猜（見 handoff 的難度設計說明）。
const LEVEL3_MIN_KNOWN_CELLS = 2;

// 2026-09-30 使用者實機試玩回饋：某幾個單字整條格子全部被挖空、完全沒有任何提示字母，
// 導致那幾個字看起來像無字天書、無從下手。原本只保證「整個網格」至少留 LEVEL3_MIN_KNOWN_CELLS
// 格已知字母，沒有保證「每一個單字自己」至少留一格——這裡補上這條規則：不管挖空比例
// 演算出來的結果是什麼，最後都會檢查每個單字是否至少留一格已知字母，不夠的話就從該單字
// 的格子裡挑一格改回「已知」（優先挑跟別的單字交疊的格子，這樣一格可以同時幫到兩個單字，
// 盡量不多動格子）。

// 過關訊息停留多久之後自動進入下一關——直接沿用翻牌配對 memoryMatchGame.ts 目前的預設值，
// 維持全站「過關停留感」一致，不用另外發明一個數字。
const LEVEL_COMPLETE_PAUSE_MS = 1400;

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 把 crossword.words 依座標鋪到網格上，算出每個格子的正確字母。交疊格（同時屬於兩個
 * 單字的格子）如果算出來的字母不一致，代表 content 端的排版資料有錯，直接丟例外——
 * 這種情況表示內容本身壞掉了，不該讓遊戲悄悄用錯的資料跑起來（content 端另外有
 * verify-crossword-content.ts 離線把關，這裡是執行期的最後一道保險）。 */
function buildCells(crossword: Crossword): CrosswordCell[] {
  const map = new Map<string, CrosswordCell>();
  for (const word of crossword.words) {
    for (let i = 0; i < word.en.length; i++) {
      const row = word.direction === "down" ? word.row + i : word.row;
      const col = word.direction === "across" ? word.col + i : word.col;
      const letter = word.en[i];
      const key = cellKey(row, col);
      const existing = map.get(key);
      if (existing && existing.letter !== letter) {
        throw new Error(
          `填字關卡 "${crossword.id}" 座標 (${row}, ${col}) 交疊處字母不一致：` +
            `已有 "${existing.letter}"，單字 "${word.en}" 卻算出 "${letter}"`
        );
      }
      map.set(key, { row, col, letter });
    }
  }
  return [...map.values()].sort((a, b) => a.row - b.row || a.col - b.col);
}

/** 算出某一關要挖空幾格。第 3 關即使比例算出來的數字更高，也會被夾在
 * 「總格數 - LEVEL3_MIN_KNOWN_CELLS」以內，確保至少留幾格已知字母。 */
export function blankCountForLevel(level: number, totalCells: number): number {
  const ratio = LEVEL_BLANK_RATIOS[level - 1] ?? LEVEL_BLANK_RATIOS[LEVEL_BLANK_RATIOS.length - 1];
  let blankCount = Math.round(totalCells * ratio);
  if (level === LEVEL_COUNT) {
    const minKnown = Math.min(LEVEL3_MIN_KNOWN_CELLS, totalCells);
    blankCount = Math.min(blankCount, totalCells - minKnown);
  }
  return Math.max(0, Math.min(blankCount, totalCells));
}

/** 三關加總錯誤次數 → 1-5 顆星，數字越少星等越高（見 handoff 的評分理由：這個 App 一貫
 * 避免計時/反應壓力，用「拖錯幾次」當指標比用時間更貼近使用情境）。
 * 2026-09-30 使用者要求把星等從 1-3 顆改成 1-5 顆，門檻依同樣的精神（答錯越少、星等
 * 越高）重新切成 5 段，級距比原本的 3 段更細一點，讓「答錯 1-2 次」跟「完全不錯」
 * 不再被歸在同一顆星裡：
 *   0 次 → 5★；1-2 次 → 4★；3-4 次 → 3★；5-7 次 → 2★；8 次以上 → 1★。 */
export function starsForMistakes(mistakeCount: number): number {
  if (mistakeCount === 0) return 5;
  if (mistakeCount <= 2) return 4;
  if (mistakeCount <= 4) return 3;
  if (mistakeCount <= 7) return 2;
  return 1;
}

export class CrosswordGame {
  readonly crossword: Crossword;
  readonly cells: readonly CrosswordCell[];
  phase: CrosswordPhase = "playing";
  level = 1;
  /** 累計整個三關的錯誤次數，不分關卡重置——星等是用三關加總的數字換算，見
   * starsForMistakes()。 */
  mistakeCount = 0;

  private readonly cellMap: Map<string, CrosswordCell>;
  private readonly levelCompletePauseMs: number;
  /** 每個單字（用 "en,row,col,direction" 當 key，因為同一個 en 字串可能在同一關出現不只
   * 一次的極端情況也不會混淆）對應到它佔用的格子座標 key 列表，setupLevel() 用這個
   * 確保「每個單字至少留一格已知字母」。 */
  private readonly wordCellKeys: string[][];
  private blankCellKeys = new Set<string>();
  private filledCellKeys = new Set<string>();
  private tray: CrosswordTrayTile[] = [];
  private tileIdCounter = 0;

  /** 狀態變動時呼叫，由外部（crosswordStandalone.ts）接上重新渲染畫面。只有「答對」跟
   * 關卡轉場才會觸發——答錯只觸發 onWrongDrop()，不觸發 onChange()，讓渲染端可以自己
   * 播放「彈回字母區」的動畫，不會被整段重新渲染打斷（跟 memoryMatchGame.ts 的
   * onMismatch 不觸發整段重繪是同樣的理由）。 */
  onChange: () => void = () => {};
  /** 拖對字母時呼叫（給答對音效用） */
  onCorrectDrop: () => void = () => {};
  /** 拖錯字母（或拖到已經填過的格子/不存在的格子）時呼叫（給答錯音效／彈跳動畫用） */
  onWrongDrop: () => void = () => {};
  /** 這一關全部空格填滿、但還沒破完三關時呼叫一次，帶入「剛過的是第幾關」 */
  onLevelComplete: (level: number) => void = () => {};
  /** 三關全部破完時呼叫一次，帶入依總錯誤次數換算出來的星等（1-3） */
  onComplete: (stars: number) => void = () => {};

  constructor(crossword: Crossword, levelCompletePauseMs: number = LEVEL_COMPLETE_PAUSE_MS) {
    this.crossword = crossword;
    this.levelCompletePauseMs = levelCompletePauseMs;
    this.cells = buildCells(crossword);
    this.cellMap = new Map(this.cells.map((c) => [cellKey(c.row, c.col), c]));
    this.wordCellKeys = crossword.words.map((word) => {
      const keys: string[] = [];
      for (let i = 0; i < word.en.length; i++) {
        const row = word.direction === "down" ? word.row + i : word.row;
        const col = word.direction === "across" ? word.col + i : word.col;
        keys.push(cellKey(row, col));
      }
      return keys;
    });
    this.setupLevel();
  }

  private setupLevel(): void {
    const totalCells = this.cells.length;
    const blankCount = blankCountForLevel(this.level, totalCells);
    const blankKeys = new Set(shuffle(this.cells.map((c) => cellKey(c.row, c.col))).slice(0, blankCount));
    this.ensureEveryWordHasKnownLetter(blankKeys);
    this.blankCellKeys = blankKeys;
    this.filledCellKeys = new Set();
    this.phase = "playing";
    this.tray = shuffle(
      [...this.blankCellKeys].map((key) => {
        const cell = this.cellMap.get(key)!;
        this.tileIdCounter += 1;
        return { id: `tile-${this.tileIdCounter}`, letter: cell.letter };
      })
    );
  }

  /** 檢查每個單字是否至少有一格不在 blankKeys 裡（也就是至少留一格已知字母當提示），
   * 不夠的話就從該單字的格子裡挑一格移出 blankKeys（優先挑跟別的單字共用的交疊格，
   * 這樣一格可以同時滿足兩個單字的最低提示需求，盡量少動格子）。挑格子時故意選「目前
   * blankKeys 裡剩最多次數」的那格（也就是最多單字共用的交疊格）以外的邏輯太複雜，這裡
   * 用簡單版本：優先挑交疊格（同時出現在別的單字 wordCellKeys 裡），沒有交疊格才挑隨機
   * 一格，兩種情況都只需要 O(單字數 × 單字長度) 的計算量，跑起來不會有效能疑慮。 */
  private ensureEveryWordHasKnownLetter(blankKeys: Set<string>): void {
    for (const keys of this.wordCellKeys) {
      const hasKnown = keys.some((key) => !blankKeys.has(key));
      if (hasKnown) continue;
      // 這個單字全部格子都是空格——挑一格改成已知。優先挑「其他單字也用得到」的交疊格，
      // 這樣同一格可能同時幫另一個原本也全空的單字補上已知格，減少總共要動的格數。
      const overlapKey = keys.find((key) =>
        this.wordCellKeys.some((otherKeys) => otherKeys !== keys && otherKeys.includes(key))
      );
      const keyToReveal = overlapKey ?? keys[Math.floor(Math.random() * keys.length)];
      blankKeys.delete(keyToReveal);
    }
  }

  get isComplete(): boolean {
    return this.phase === "complete";
  }

  /** 目前字母區還沒被拖走的磚（唯讀，渲染端自己依序畫出來，不用管排列邏輯）。 */
  get letterTray(): readonly CrosswordTrayTile[] {
    return this.tray;
  }

  /** 這個座標是不是這一關要挖空的格子（不管有沒有被填過）。 */
  isBlankCell(row: number, col: number): boolean {
    return this.blankCellKeys.has(cellKey(row, col));
  }

  /** 這個座標是不是網格裡「屬於某個單字」的格子——渲染端用這個判斷要畫成看得見的格子
   * 還是版面留白（網格本身是矩形，但填字關卡通常不是每格都用得到，例如範例排版裡的 "."
   * 位置）。 */
  hasCell(row: number, col: number): boolean {
    return this.cellMap.has(cellKey(row, col));
  }

  /** 這個座標目前應該顯示什麼：已知格／已填對的空格回傳正確字母；還沒填的空格回傳
   * null（渲染端顯示空白）；根本不屬於任何單字的格子也回傳 null（渲染端顯示成不可見
   * 的版面留白格）。 */
  displayLetterAt(row: number, col: number): string | null {
    const key = cellKey(row, col);
    const cell = this.cellMap.get(key);
    if (!cell) return null;
    if (!this.blankCellKeys.has(key)) return cell.letter;
    if (this.filledCellKeys.has(key)) return cell.letter;
    return null;
  }

  /** 嘗試把某枚字母磚拖到某個格子上。回傳 true 代表答對（磚固定進格子、從字母區移除）；
   * 回傳 false 代表這次嘗試沒有成功（格子不是空格、格子已經填過、磚不存在、或字母不對）
   * ——渲染端看到 false 就播放「彈回字母區」的動畫，不用區分是哪一種失敗原因。
   * 只有「格子存在且是還沒填的空格、磚也存在」但字母答錯，才會累計錯誤次數；亂拖到
   * 版面空白處或已經填過的格子不算一次「錯誤嘗試」，不計入星等評分。 */
  dropLetter(row: number, col: number, tileId: string): boolean {
    if (this.phase !== "playing") return false;
    const key = cellKey(row, col);
    if (!this.blankCellKeys.has(key) || this.filledCellKeys.has(key)) return false;
    const cell = this.cellMap.get(key);
    if (!cell) return false;
    const tile = this.tray.find((t) => t.id === tileId);
    if (!tile) return false;

    if (tile.letter !== cell.letter) {
      this.mistakeCount += 1;
      this.onWrongDrop();
      return false;
    }

    this.filledCellKeys.add(key);
    this.tray = this.tray.filter((t) => t.id !== tileId);
    this.onCorrectDrop();

    const allFilled = [...this.blankCellKeys].every((k) => this.filledCellKeys.has(k));
    if (allFilled) {
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
        this.onComplete(starsForMistakes(this.mistakeCount));
      }
    } else {
      this.onChange();
    }
    return true;
  }
}
