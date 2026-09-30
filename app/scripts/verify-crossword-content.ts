// 驗證 content/crosswords/*.json 每個填字關卡的排版資料是不是真的合法：交疊處字母
// 一致（跟 crosswordGame.ts 建構子執行期做的檢查是同一種邏輯，這裡離線先把關，避免壞掉
// 的排版資料上線後才在使用者手機上炸開）、每個 vocabId 都能在對應主題的
// content/vocab/<topicFileKey>.json 裡找到、基本欄位符合 content/schema/crossword.schema.json
// 的形狀（不是完整跑 ajv，用手動檢查比照專案裡其餘 verify script 的既有作法）。
// 用法：npx tsx scripts/verify-crossword-content.ts

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf-8"));
}

interface CrosswordWordDef {
  vocabId: string;
  en: string;
  zh: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

interface Crossword {
  id: string;
  topicFileKey: string;
  title: string;
  hintZh: string;
  gridWidth: number;
  gridHeight: number;
  words: CrosswordWordDef[];
}

interface Vocab {
  id: string;
  en: string;
  zh: string;
}

const crosswordsDir = new URL("../../content/crosswords/", import.meta.url);
const crosswordFiles = readdirSync(fileURLToPath(crosswordsDir)).filter((f) => f.endsWith(".json"));

assert(crosswordFiles.length > 0, "content/crosswords/ 底下應該至少有 1 個填字關卡檔案");

for (const file of crosswordFiles) {
  const crossword = loadJson<Crossword>(`../../content/crosswords/${file}`);

  // ---- 基本欄位形狀（比照 crossword.schema.json 的必填欄位跟格式限制）----
  assert(typeof crossword.id === "string" && /^crossword\.[a-z_]+\.[a-z_]+$/.test(crossword.id), `${file}: id 格式應該符合 "crossword.<topic>.<slug>"`);
  assert(typeof crossword.topicFileKey === "string" && crossword.topicFileKey.length > 0, `${file}: topicFileKey 不可為空`);
  assert(typeof crossword.title === "string" && crossword.title.length > 0, `${file}: title 不可為空`);
  assert(typeof crossword.hintZh === "string" && crossword.hintZh.length > 0, `${file}: hintZh 不可為空`);
  assert(Number.isInteger(crossword.gridWidth) && crossword.gridWidth >= 1, `${file}: gridWidth 應該是 >=1 的整數`);
  assert(Number.isInteger(crossword.gridHeight) && crossword.gridHeight >= 1, `${file}: gridHeight 應該是 >=1 的整數`);
  assert(
    Array.isArray(crossword.words) && crossword.words.length >= 3 && crossword.words.length <= 6,
    `${file}: words 應該是 3-6 個單字的陣列，實際 ${crossword.words?.length}`
  );

  const vocab = loadJson<Vocab[]>(`../../content/vocab/${crossword.topicFileKey}.json`);

  for (const word of crossword.words) {
    assert(/^[A-Z]+$/.test(word.en), `${file}: 單字 "${word.en}" 應該全大寫（只能是 A-Z）`);
    assert(word.row >= 0 && word.col >= 0, `${file}: 單字 "${word.en}" 的 row/col 座標不可為負數`);
    assert(word.row + (word.en.length - 1) <= crossword.gridHeight - 1 || word.direction === "across", `${file}: 單字 "${word.en}"（down）超出 gridHeight`);
    assert(word.col + (word.en.length - 1) <= crossword.gridWidth - 1 || word.direction === "down", `${file}: 單字 "${word.en}"（across）超出 gridWidth`);

    // vocabId 必須能在對應主題的 vocab 清單裡找到，且英文/中文要跟 vocab 清單裡的紀錄一致
    // （避免填字關卡自己抄錯字，跟 vocab 清單的正式內容兜不起來）。
    const matched = vocab.find((v) => v.id === word.vocabId);
    assert(matched !== undefined, `${file}: vocabId "${word.vocabId}" 在 content/vocab/${crossword.topicFileKey}.json 裡找不到`);
    if (matched) {
      assert(
        matched.en.toUpperCase() === word.en,
        `${file}: 單字 "${word.en}" 跟 vocabId "${word.vocabId}" 對應的 vocab.en "${matched.en}" 不一致`
      );
      assert(
        matched.zh === word.zh,
        `${file}: 單字 "${word.en}" 的 zh "${word.zh}" 跟 vocabId "${word.vocabId}" 對應的 vocab.zh "${matched.zh}" 不一致`
      );
    }
  }

  // ---- 重新排版驗證交疊處字母一致（跟 crosswordGame.ts 執行期做的是同一種檢查，
  //      這裡離線先把關，是 content 端排版資料的最後一道保險）----
  const cellMap = new Map<string, string>();
  for (const word of crossword.words) {
    for (let i = 0; i < word.en.length; i++) {
      const row = word.direction === "down" ? word.row + i : word.row;
      const col = word.direction === "across" ? word.col + i : word.col;
      const letter = word.en[i];
      const key = `${row},${col}`;
      const existing = cellMap.get(key);
      assert(
        existing === undefined || existing === letter,
        `${file}: 座標 (${row},${col}) 交疊處字母不一致——已有 "${existing}"，單字 "${word.en}" 卻算出 "${letter}"`
      );
      cellMap.set(key, letter);
    }
  }

  // ---- 2026-09-30 使用者實機試玩回饋：畫面上出現「BFR」「ELO」這種沒有意義的字母組合
  //      ——原因是排版只驗證了「交疊處字母一致」，沒驗證「每一段連續格子（不管橫向還是
  //      縱向）本身是不是一個有意義的單字」，導致不同單字的格子剛好排在同一行/同一列、
  //      彼此相鄰卻沒有刻意設計成同一個單字，畫面上就會讀出一段沒人設計過的字母序列。
  //      這裡補上這項檢查：掃過整個網格，把每一段「連續、長度 >= 2」的格子抓出來
  //      （橫向掃一遍、縱向再掃一遍），每一段都必須剛好對應到 words[] 裡某個宣告的單字
  //      （方向、起點、長度都要吻合），才能通過；不然代表排版把不相關的單字排得太近，
  //      需要重新設計座標、拉開間距。 ----
  {
    const acrossWords = crossword.words.filter((w) => w.direction === "across");
    const downWords = crossword.words.filter((w) => w.direction === "down");

    // 橫向掃描：依 row 分組，掃每一列裡連續（col 差 1）的格子
    const rowGroups = new Map<number, number[]>();
    for (const [key] of cellMap) {
      const [row, col] = key.split(",").map(Number);
      (rowGroups.get(row) ?? rowGroups.set(row, []).get(row)!).push(col);
    }
    for (const [row, cols] of rowGroups) {
      const sorted = [...cols].sort((a, b) => a - b);
      let runStart = sorted[0];
      for (let i = 0; i <= sorted.length; i++) {
        const isBreak = i === sorted.length || sorted[i] !== sorted[i - 1] + 1;
        if (isBreak) {
          const runEnd = sorted[i - 1];
          const runLength = runEnd - runStart + 1;
          if (runLength >= 2) {
            const matched = acrossWords.some((w) => w.row === row && w.col === runStart && w.en.length === runLength);
            assert(
              matched,
              `${file}: 第 ${row} 列 col ${runStart}-${runEnd} 連續 ${runLength} 格，沒有對應到任何一個宣告的橫向單字` +
                `（可能是不同單字排得太近、意外連成一段沒有意義的字母組合，例如使用者回報的 "BFR"／"ELO"）`
            );
          }
          if (i < sorted.length) runStart = sorted[i];
        }
      }
    }

    // 縱向掃描：依 col 分組，掃每一欄裡連續（row 差 1）的格子
    const colGroups = new Map<number, number[]>();
    for (const [key] of cellMap) {
      const [row, col] = key.split(",").map(Number);
      (colGroups.get(col) ?? colGroups.set(col, []).get(col)!).push(row);
    }
    for (const [col, rows] of colGroups) {
      const sorted = [...rows].sort((a, b) => a - b);
      let runStart = sorted[0];
      for (let i = 0; i <= sorted.length; i++) {
        const isBreak = i === sorted.length || sorted[i] !== sorted[i - 1] + 1;
        if (isBreak) {
          const runEnd = sorted[i - 1];
          const runLength = runEnd - runStart + 1;
          if (runLength >= 2) {
            const matched = downWords.some((w) => w.col === col && w.row === runStart && w.en.length === runLength);
            assert(
              matched,
              `${file}: 第 ${col} 欄 row ${runStart}-${runEnd} 連續 ${runLength} 格，沒有對應到任何一個宣告的縱向單字` +
                `（可能是不同單字排得太近、意外連成一段沒有意義的字母組合）`
            );
          }
          if (i < sorted.length) runStart = sorted[i];
        }
      }
    }
  }

  console.log(`✅ ${file}：${crossword.words.length} 個單字、${cellMap.size} 個格子，交疊處字母全部一致、每一段連續格子都對應到有意義的單字，vocabId 都能回溯到 content/vocab/${crossword.topicFileKey}.json。`);
}

console.log(`\n✅ 全部 ${crosswordFiles.length} 個填字關卡的排版資料驗證通過。`);
