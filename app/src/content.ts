// content/ 資料夾是內容的 single source of truth（見 docs/content-plan-gept-kids.md 2.1）。
// Phase 1 骨架先用「build 時直接 import JSON」的方式串接，不做額外的匯入/資料庫層——
// 這對純靜態網站（GitHub Pages）來說最簡單：JSON 在打包時就變成 JS bundle 的一部分，
// 不需要在執行期額外 fetch，也不需要處理路徑部署問題。
// 之後如果要擴充成 24 個主題，這裡用一個 import.meta.glob 就能自動載入 content/vocab/*.json，
// 不需要每加一個主題就手動加一行 import。

import type { Badge, Passage, Sentence, Vocab } from "./types";
// content/badges/badges.json 是「一份清單」而不是像 vocab/sentences 那樣按主題各自一個檔案，
// 所以不用 import.meta.glob，直接照 tsconfig 的 resolveJsonModule 設定當一般模組匯入即可，
// 建置時期會被打包進 JS bundle，執行期不需要額外 fetch。
import badgesData from "../../content/badges/badges.json";

const vocabModules = import.meta.glob("../../content/vocab/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Vocab[]>;

const sentenceModules = import.meta.glob("../../content/sentences/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Sentence[]>;

// 注意：跟 vocab/sentences 不同，content/passages/*.json 目前一個檔案是「一篇短文」
// （單一物件），不是陣列——這是延續 content/schema/passage.schema.json 的既有格式，
// 這裡不去改資料結構，只是用符合現況的方式讀取。
const passageModules = import.meta.glob("../../content/passages/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Passage>;

// content/glossary/<topic>.json：補充「短文理解」點字看中文意思要用的額外單字翻譯，
// 只收「不在該主題 vocab_ids、也不在任何主題 vocab 清單裡」的字（例如短文裡出現的
// teacher/nurse 這種屬於別的主題、甚至完全沒有 vocab 資料的字）。見 content/schema/glossary.schema.json。
const glossaryModules = import.meta.glob("../../content/glossary/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Record<string, string>>;

function topicKeyFromPath(path: string): string {
  const file = path.split("/").pop() ?? "";
  return file.replace(/\.json$/, "");
}

function indexByTopicKey<T>(modules: Record<string, T[]>): Record<string, T[]> {
  const byTopic: Record<string, T[]> = {};
  for (const [path, items] of Object.entries(modules)) {
    byTopic[topicKeyFromPath(path)] = items;
  }
  return byTopic;
}

function indexSingleByTopicKey<T>(modules: Record<string, T>): Record<string, T> {
  const byTopic: Record<string, T> = {};
  for (const [path, item] of Object.entries(modules)) {
    byTopic[topicKeyFromPath(path)] = item;
  }
  return byTopic;
}

const vocabByTopic = indexByTopicKey(vocabModules);
const sentencesByTopic = indexByTopicKey(sentenceModules);
const passageByTopic = indexSingleByTopicKey(passageModules);
const glossaryByTopic = indexSingleByTopicKey(glossaryModules);

// 跨主題的「英文字（小寫）→ 中文意思＋vocab id」查詢表，開場算一次就好——短文理解點字看翻譯時，
// 不應該只查「目前這個主題」的 vocab，因為短文裡提到的字（例如職業名稱）可能剛好是
// 別的主題才有收錄的 vocab，這裡把所有主題的 vocab 都攤平進同一張表，查詢範圍才夠廣。
// 同一個英文字如果在不同主題重複出現（例如同義詞或不同主題各自收錄不同意思的版本，
// 例如 Money 的 change＝零錢 vs. 其他主題的 change＝改變），後面的主題會覆蓋前面的——
// 這張表只當作 lookupPassageWordZh() 查不到「目前這個主題自己」的版本時的退回選項，
// 真正決定「這個主題該顯示哪個意思」的是 lookupPassageWordZh() 裡優先查自己主題 vocab
// 的那一步，這張攤平表本身的覆蓋順序不影響使用者實際看到的翻譯結果。
// 連 vocabId 一起存起來（不是只存 zh），是因為單字收藏功能要用真正的 vocab.id 當收藏
// 的 key，Stage C 點字翻譯泡泡才能在旁邊畫收藏星星——只查得到 zh、查不到 vocabId
// 的字（見下面 lookupPassageWordZh() 退回 glossary 補充詞彙表的情況）代表這個字不屬於
// 任何主題的 vocab 清單，本來就沒有東西可以收藏，畫面上不會顯示星星。
const globalVocabByEnglish: Record<string, { zh: string; vocabId: string }> = {};
for (const vocabs of Object.values(vocabByTopic)) {
  for (const v of vocabs) {
    globalVocabByEnglish[v.en.toLowerCase()] = { zh: v.zh, vocabId: v.id };
  }
}

export function getVocabByTopic(topicFileKey: string): Vocab[] {
  const vocabs = vocabByTopic[topicFileKey];
  if (!vocabs) {
    throw new Error(
      `找不到主題 "${topicFileKey}" 的單字資料（content/vocab/${topicFileKey}.json）`
    );
  }
  return vocabs;
}

export function getSentencesByTopic(topicFileKey: string): Sentence[] {
  const sentences = sentencesByTopic[topicFileKey];
  if (!sentences) {
    throw new Error(
      `找不到主題 "${topicFileKey}" 的句子資料（content/sentences/${topicFileKey}.json）`
    );
  }
  return sentences;
}

export function getPassageByTopic(topicFileKey: string): Passage {
  const passage = passageByTopic[topicFileKey];
  if (!passage) {
    throw new Error(
      `找不到主題 "${topicFileKey}" 的短文資料（content/passages/${topicFileKey}.json）`
    );
  }
  return passage;
}

export function listAvailableTopics(): string[] {
  return Object.keys(vocabByTopic);
}

/**
 * 給短文理解（Stage C）點字看中文意思用：查某個英文字（大小寫不拘）的中文意思，
 * 查詢順序是「這個主題自己優先」：
 *   1. 先查這個主題自己的 vocab 清單——這個主題自己收錄的意思優先權最高，
 *      不管其他主題有沒有收過同一個英文字、收的是什麼意思（content 端的規則已經
 *      放寬成「同一個英文字在同一個主題裡只能收錄一次」，不同主題可以各自收一份
 *      意思不同的版本，例如 Money 的 change＝零錢 跟其他主題的 change＝改變）。
 *   2. 這個主題自己沒收，才退回跨主題的攤平表 `globalVocabByEnglish`（維持原本
 *      「順便學到別的主題單字」的加分功能，例如在 Colors 短文點到 sister 查到
 *      Family 主題的意思）。
 *   3. 都查不到，才退回這個主題自己的補充詞彙表（content/glossary/<topic>.json，
 *      收錄 vocab 清單裡完全沒有、只在短文原文才出現的字，例如職業名稱）。
 * 三邊都查不到就回傳 null（畫面上這個字就不會做成可點擊的樣式）。
 *
 * 回傳值多了 vocabId：查得到 vocab 的字會回傳真正的 vocab.id（給單字收藏功能用），
 * 退回 glossary 查到的補充詞彙沒有對應的 vocab.id，vocabId 給 null——呼叫端（Stage C
 * 的點字翻譯泡泡）只有 vocabId 不是 null 時才畫收藏星星，glossary 查到的字沒有東西
 * 可以收藏，不顯示星星。
 */
export function lookupPassageWordZh(
  topicFileKey: string,
  word: string
): { zh: string; vocabId: string | null } | null {
  const key = word.toLowerCase();
  const ownVocab = vocabByTopic[topicFileKey]?.find((v) => v.en.toLowerCase() === key);
  if (ownVocab) return { zh: ownVocab.zh, vocabId: ownVocab.id };
  const fromVocab = globalVocabByEnglish[key];
  if (fromVocab) return { zh: fromVocab.zh, vocabId: fromVocab.vocabId };
  const glossary = glossaryByTopic[topicFileKey];
  const zh = glossary?.[key];
  return zh ? { zh, vocabId: null } : null;
}

const BADGES = badgesData as Badge[];

/** 43 個成就徽章的正式清單（content/badges/badges.json），依 code 順序排列方便畫面呈現。 */
export function getAllBadges(): Badge[] {
  return [...BADGES].sort((a, b) => a.code.localeCompare(b.code));
}
