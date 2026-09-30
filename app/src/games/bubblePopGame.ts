// 遊戲室第三款遊戲：戳泡泡（Bubble Pop，多主題綜合冒險模式）。
// 比照 memoryMatchGame.ts / crosswordGame.ts 的架構：純邏輯引擎，不碰 DOM。
// 畫面渲染、飄移動畫、音效與事件綁定交由 games/bubblePopStandalone.ts 處理。
// 規範見 docs/handoff-prompt-bubble-pop-game.md。

import colorsVocabData from "../../../content/vocab/colors.json";
import animalsVocabData from "../../../content/vocab/animals_insects.json";
import foodVocabData from "../../../content/vocab/food_drink.json";
import transportVocabData from "../../../content/vocab/transportation.json";
import bodyVocabData from "../../../content/vocab/parts_of_body.json";
import natureVocabData from "../../../content/vocab/weather_nature.json";
import schoolVocabData from "../../../content/vocab/school.json";

export interface BubbleLevelConfig {
  wordLengthRange: [number, number];
  decoyCount: number;
}

export const LEVEL_CONFIGS: BubbleLevelConfig[] = [
  { wordLengthRange: [3, 4], decoyCount: 3 }, // 第 1 關 (3-4 字母 + 3 干擾，快速暖身)
  { wordLengthRange: [4, 5], decoyCount: 4 }, // 第 2 關 (4-5 字母 + 4 干擾)
  { wordLengthRange: [5, 5], decoyCount: 5 }, // 第 3 關 (5 字母 + 5 干擾)
  { wordLengthRange: [5, 6], decoyCount: 6 }, // 第 4 關 (5-6 字母 + 6 干擾)
  { wordLengthRange: [6, 7], decoyCount: 7 }, // 第 5 關 (6-7 字母 + 7 干擾，終極挑戰)
];

export const LEVEL_COUNT = LEVEL_CONFIGS.length; // 5

// 過關訊息停留時間（毫秒），比照全站既有節奏
export const LEVEL_COMPLETE_PAUSE_MS = 1400;

// 針對顏色主題，嚴格維持 14 個純顏色詞（避免深淺形容詞混淆）
export const PURE_COLOR_IDS = new Set<string>([
  "voc.colors.010", // RED (3)
  "voc.colors.008", // PINK (4)
  "voc.colors.002", // BLUE (4)
  "voc.colors.005", // GRAY (4)
  "voc.colors.013", // GOLD (4)
  "voc.colors.001", // BLACK (5)
  "voc.colors.003", // BROWN (5)
  "voc.colors.006", // GREEN (5)
  "voc.colors.011", // WHITE (5)
  "voc.colors.012", // YELLOW (6)
  "voc.colors.007", // ORANGE (6)
  "voc.colors.009", // PURPLE (6)
  "voc.colors.014", // SILVER (6)
  "voc.colors.015", // INDIGO (6)
]);

export const COLOR_VOCAB_IDS = Array.from(PURE_COLOR_IDS);

export interface BubbleWordItem {
  vocabId: string;
  en: string;
  zh: string;
  cleanZh: string;
  topic?: string;
}

// 向下相容別名
export type ColorWordItem = BubbleWordItem;

/**
 * 去除中文名詞或形容詞結尾的「的」字，並移除補充括號（如「紅色的」→「紅色」，「乳牛（黑白花紋）」→「乳牛」）
 */
export function stripAdjectiveSuffix(zh: string): string {
  const withoutParentheses = zh.replace(/（[^）]*）|\([^)]*\)/g, "").trim();
  return withoutParentheses.endsWith("的")
    ? withoutParentheses.slice(0, -1)
    : withoutParentheses;
}

interface RawVocabItem {
  id: string;
  en: string;
  zh: string;
}

function processVocabList(items: RawVocabItem[], topicName: string, isColors = false): BubbleWordItem[] {
  const result: BubbleWordItem[] = [];
  for (const item of items) {
    if (isColors && !PURE_COLOR_IDS.has(item.id)) continue;
    const en = item.en.trim();
    // 嚴格篩選長度 3 ~ 7 字母，且不包含空格與連字號的具體單一名詞
    if (en.length >= 3 && en.length <= 7 && !en.includes(" ") && !en.includes("-")) {
      result.push({
        vocabId: item.id,
        en: en.toUpperCase(),
        zh: item.zh,
        cleanZh: stripAdjectiveSuffix(item.zh),
        topic: topicName,
      });
    }
  }
  return result;
}

/**
 * 戳泡泡遊戲多主題綜合題庫（共 134 字）：
 * 包含：顏色 (14)、動物昆蟲 (29)、食物飲品 (15)、交通工具 (11)、身體部位 (21)、大自然天氣 (31)、學校文具 (13)
 */
export const BUBBLE_POP_WORDS: BubbleWordItem[] = [
  ...processVocabList(colorsVocabData, "colors", true),
  ...processVocabList(animalsVocabData, "animals_insects"),
  ...processVocabList(foodVocabData, "food_drink"),
  ...processVocabList(transportVocabData, "transportation"),
  ...processVocabList(bodyVocabData, "parts_of_body"),
  ...processVocabList(natureVocabData, "weather_nature"),
  ...processVocabList(schoolVocabData, "school"),
];

// 向下相容
export const DEFAULT_COLOR_WORDS: BubbleWordItem[] = BUBBLE_POP_WORDS;

export interface BubbleData {
  id: string;
  letter: string;
  popped: boolean;
  xPercent: number; // 8 ~ 90 之間的百分比位置
  yPercent: number; // 10 ~ 84 之間的百分比位置
  floatDelay: number; // 浮動動畫延遲（秒）
  floatDuration: number; // 浮動動畫週期（秒）
  row?: number; // 0 ~ 3 (所屬垂直層級)
  col?: number; // 0 ~ 3 (所屬水平欄位)
}

export type BubblePopPhase = "playing" | "levelComplete" | "complete";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const ROW_COUNT = 4;
export const COL_COUNT = 4;

export interface BubbleSlot {
  row: number; // 0, 1, 2, 3
  col: number; // 0, 1, 2, 3
}

/**
 * 累計五關加總錯誤次數 → 1-5 顆星（見 docs/prompt-star-rating-mechanism.md 評分規範）：
 *   0 次 → 5★；1-2 次 → 4★；3-4 次 → 3★；5-7 次 → 2★；8 次以上 → 1★。
 */
export function starsForMistakes(mistakeCount: number): number {
  if (mistakeCount === 0) return 5;
  if (mistakeCount <= 2) return 4;
  if (mistakeCount <= 4) return 3;
  if (mistakeCount <= 7) return 2;
  return 1;
}

/**
 * 隨機挑選 decoyCount 個大寫干擾英文字母
 */
export function pickRandomDecoyLetters(count: number, avoidLetters: string[] = []): string[] {
  const avoidSet = new Set(avoidLetters.map((l) => l.toUpperCase()));
  const preferred = ALPHABET.split("").filter((l) => !avoidSet.has(l));
  const pool = preferred.length >= count ? preferred : ALPHABET.split("");
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const letter = pool[Math.floor(Math.random() * pool.length)];
    result.push(letter);
  }
  return result;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 將 total 顆泡泡（6~13 顆）分佈在 4 個垂直層級中。
 * 保證從第 1 關起，每層（row 0, 1, 2, 3）至少有 1 顆泡泡；
 * 剩餘泡泡隨機均勻分配，且每層不超過 COL_COUNT (4) 顆；
 * 各層中的泡泡分配到不重複的水平欄位（col 0~3），避免同層重疊。
 */
export function distributeBubblesAcross4Layers(total: number): BubbleSlot[] {
  if (total < ROW_COUNT) {
    throw new Error(`泡泡總數不能小於垂直層數 (${ROW_COUNT})`);
  }

  // 1. 每層至少 1 顆，保證從第 1 關開始四層垂直軸皆有泡泡分佈
  const rowCounts = [1, 1, 1, 1];
  let remaining = total - ROW_COUNT;

  // 2. 隨機將剩餘泡泡均勻分派給 4 層，每層上限為 COL_COUNT (4)
  const rowIndices = [0, 1, 2, 3];
  while (remaining > 0) {
    const shuffledRows = shuffle([...rowIndices]);
    for (const r of shuffledRows) {
      if (remaining > 0 && rowCounts[r] < COL_COUNT) {
        rowCounts[r]++;
        remaining--;
      }
    }
  }

  // 3. 針對每一層，隨機指派不重複的 column 槽位
  const slots: BubbleSlot[] = [];
  for (let r = 0; r < ROW_COUNT; r++) {
    const cols = shuffle([0, 1, 2, 3]).slice(0, rowCounts[r]);
    for (const c of cols) {
      slots.push({ row: r, col: c });
    }
  }

  return shuffle(slots);
}

/**
 * 給定目標單字（例如 "RED"）與干擾字母數量，回傳打散排列且帶有座標/動畫參數的泡泡清單
 */
export function generateBubbles(targetWord: string, decoyCount: number): BubbleData[] {
  const correctLetters = targetWord.toUpperCase().split("");
  // 避免干擾字母第一個就抽到下一個必須字母（降低開場誤觸率）
  const decoyLetters = pickRandomDecoyLetters(decoyCount, [correctLetters[0]]);
  const allLetters = shuffle([...correctLetters, ...decoyLetters]);

  const total = allLetters.length;
  // 固定在 4 個垂直層級中均勻分佈槽位，保證從第 1 關開始 4 層皆有泡泡
  const slots = distributeBubblesAcross4Layers(total);

  return allLetters.map((letter, i) => {
    const slot = slots[i];

    // 水平 (X) 佔 12% ~ 88%，垂直 (Y) 佔 12% ~ 80%
    const stepX = 76 / (COL_COUNT - 1); // ~25.33%
    const stepY = 68 / (ROW_COUNT - 1); // ~22.67%

    const baseX = 12 + slot.col * stepX;
    const baseY = 12 + slot.row * stepY;

    // 加上輕微有機抖動位移（X ±3%, Y ±2%），營造自然錯落感，且不會跨層重疊
    const jitterX = (Math.random() - 0.5) * 6;
    const jitterY = (Math.random() - 0.5) * 4;

    const clampedX = Math.max(8, Math.min(90, baseX + jitterX));
    const clampedY = Math.max(10, Math.min(84, baseY + jitterY));

    return {
      id: `bubble-${i}-${Math.random().toString(36).slice(2, 7)}`,
      letter,
      popped: false,
      xPercent: Number(clampedX.toFixed(1)),
      yPercent: Number(clampedY.toFixed(1)),
      floatDelay: Number((Math.random() * 2).toFixed(2)),
      floatDuration: Number((2.6 + Math.random() * 1.6).toFixed(2)),
      row: slot.row,
      col: slot.col,
    };
  });
}

export class BubblePopGame {
  readonly levelConfigs: BubbleLevelConfig[];
  readonly candidateWords: BubbleWordItem[];
  readonly levelCompletePauseMs: number;

  level = 1;
  phase: BubblePopPhase = "playing";
  targetWord = "";
  targetZh = "";
  targetVocabId = "";
  progressIndex = 0; // 目前已經正確拼到第幾個字母（0 代表還沒拼對任何字母）
  bubbles: BubbleData[] = [];
  wrongCount = 0;

  private usedVocabIds = new Set<string>();
  private nextLevelTimer: ReturnType<typeof setTimeout> | null = null;

  onCorrectPop: (letter: string, progressSoFar: string, bubbleId: string) => void = () => {};
  onWrongPop: (bubbleId: string) => void = () => {}; // 給 renderer 觸發「飄移」動畫用
  onLevelComplete: (word: string, isFinal: boolean) => void = () => {};
  onComplete: (stars: number) => void = () => {};
  onChange: () => void = () => {};

  constructor(
    candidateWords: BubbleWordItem[] = BUBBLE_POP_WORDS,
    levelConfigs: BubbleLevelConfig[] = LEVEL_CONFIGS,
    levelCompletePauseMs: number = LEVEL_COMPLETE_PAUSE_MS
  ) {
    this.candidateWords = candidateWords;
    this.levelConfigs = levelConfigs;
    this.levelCompletePauseMs = levelCompletePauseMs;
    this.startLevel(1);
  }

  /**
   * 進入指定關卡，挑選該關卡長度範圍的候選字並生成泡泡
   */
  startLevel(levelNumber: number): void {
    if (this.nextLevelTimer) {
      clearTimeout(this.nextLevelTimer);
      this.nextLevelTimer = null;
    }

    this.level = levelNumber;
    this.phase = "playing";
    this.progressIndex = 0;

    const config = this.levelConfigs[this.level - 1] ?? this.levelConfigs[0];
    const [minLen, maxLen] = config.wordLengthRange;

    // 篩選出長度符合該關設定的候選字
    const eligibleWords = this.candidateWords.filter(
      (w) => w.en.length >= minLen && w.en.length <= maxLen
    );

    if (eligibleWords.length === 0) {
      throw new Error(`找不到字母長度介於 [${minLen}, ${maxLen}] 的單字`);
    }

    // 優先挑選這局尚未出過的單字
    let availableWords = eligibleWords.filter((w) => !this.usedVocabIds.has(w.vocabId));
    if (availableWords.length === 0) {
      availableWords = eligibleWords;
    }

    const picked = availableWords[Math.floor(Math.random() * availableWords.length)];
    this.usedVocabIds.add(picked.vocabId);

    this.targetWord = picked.en;
    this.targetZh = picked.cleanZh;
    this.targetVocabId = picked.vocabId;

    this.bubbles = generateBubbles(this.targetWord, config.decoyCount);
    this.onChange();
  }

  /**
   * 點按/戳破泡泡作答
   */
  popBubble(bubbleId: string): void {
    if (this.phase !== "playing") return;

    const bubble = this.bubbles.find((b) => b.id === bubbleId);
    if (!bubble || bubble.popped) return;

    const expectedLetter = this.targetWord[this.progressIndex];
    if (bubble.letter === expectedLetter) {
      bubble.popped = true;
      this.progressIndex += 1;
      const progressSoFar = this.targetWord.slice(0, this.progressIndex);
      this.onCorrectPop(bubble.letter, progressSoFar, bubble.id);

      if (this.progressIndex === this.targetWord.length) {
        const isFinal = this.level >= this.levelConfigs.length;
        if (!isFinal) {
          this.phase = "levelComplete";
          this.onLevelComplete(this.targetWord, false);
        } else {
          this.phase = "complete";
          this.onLevelComplete(this.targetWord, true);
          const stars = starsForMistakes(this.wrongCount);
          this.onComplete(stars);
        }
      }
    } else {
      this.wrongCount += 1;
      this.onWrongPop(bubbleId); // 觸發飄移動畫，不移除該泡泡
    }
  }

  /**
   * 使用者點擊按鈕手動進入下一關
   */
  nextLevel(): void {
    if (this.phase !== "levelComplete") return;
    if (this.level < this.levelConfigs.length) {
      this.startLevel(this.level + 1);
    }
  }

  /**
   * 重新開局（重置為第 1 關與 0 錯誤）
   */
  restart(): void {
    this.usedVocabIds.clear();
    this.wrongCount = 0;
    this.startLevel(1);
    this.onChange();
  }

  /**
   * 釋放可能存在的定時器
   */
  destroy(): void {
    if (this.nextLevelTimer) {
      clearTimeout(this.nextLevelTimer);
      this.nextLevelTimer = null;
    }
  }
}
