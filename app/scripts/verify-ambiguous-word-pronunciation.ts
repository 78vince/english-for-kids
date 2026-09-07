// 驗證 speech.ts 的 AMBIGUOUS_STANDALONE_WORDS 對照表（單獨字塊容易被 TTS 引擎誤判發音、
// 需要換一個拼法繞開的字）內容是否符合預期：
// - "I"（代名詞，句子排序單獨點字塊時會被誤判成羅馬數字 1）→ "Eye"，這是原本就有的規則。
// - "Is"（Parts of Body／Places & Directions 兩句話的句首字塊，會被誤判成 "Ice"）→ "Is."，
//   2026-08-28 使用者手機實測回報後新增，見 speech.ts 對應註解。
// 這是純資料層面的檢查（純字串比對 speech.ts 原始碼），不涉及真的呼叫 Web Speech API，
// 因為這個沙盒環境沒有喇叭/瀏覽器，沒辦法實際聽發音確認修法是否有效——那部分需要
// 使用者在真實瀏覽器上實測（見 speech.ts 註解）。
// 用法：npx tsx scripts/verify-ambiguous-word-pronunciation.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const speechTs = readFileSync(new URL("../src/speech.ts", import.meta.url), "utf-8");
const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");

// ---- 測試 1：AMBIGUOUS_STANDALONE_WORDS 裡 "I" 跟 "Is" 兩條規則都存在。 ----
{
  const mapMatch = speechTs.match(/const AMBIGUOUS_STANDALONE_WORDS: Record<string, string> = \{[\s\S]*?\};/);
  assert(mapMatch !== null, "應該找得到 AMBIGUOUS_STANDALONE_WORDS 對照表");
  const mapBody = mapMatch![0];
  assert(mapBody.includes('I: "Eye"'), 'AMBIGUOUS_STANDALONE_WORDS 應該保留原本的 "I" → "Eye" 規則');
  assert(mapBody.includes('Is: "Is."'), 'AMBIGUOUS_STANDALONE_WORDS 應該新增 "Is" → "Is." 規則（Parts of Body／Places & Directions 句首字塊 bug 修法）');

  console.log('✅ 測試 1 通過：AMBIGUOUS_STANDALONE_WORDS 同時包含 "I"／"Is" 兩條規則。');
}

// ---- 測試 2：speakEnglish() 真的有查這個對照表，不是查完全沒接上。 ----
{
  const speakEnglishFn = speechTs.match(/export function speakEnglish\(text: string\): void \{[\s\S]*?\n\}/);
  assert(speakEnglishFn !== null, "應該找得到 speakEnglish() 函式定義");
  assert(
    speakEnglishFn![0].includes("AMBIGUOUS_STANDALONE_WORDS[text] ?? text"),
    "speakEnglish() 應該用 AMBIGUOUS_STANDALONE_WORDS[text] ?? text 查表，查不到就照原文唸"
  );

  console.log("✅ 測試 2 通過：speakEnglish() 有正確查對照表。");
}

// ---- 測試 3：content 裡確認的 2 句「Is」開頭句子還在，且 Stage B-1 字塊化（用空白字元
//      分割）會讓句首字塊剛好等於 "Is"（不含標點），才會命中這條規則。 ----
{
  const partsOfBody = JSON.parse(
    readFileSync(new URL("../../content/sentences/parts_of_body.json", import.meta.url), "utf-8")
  );
  const placesDirections = JSON.parse(
    readFileSync(new URL("../../content/sentences/places_directions.json", import.meta.url), "utf-8")
  );

  const findIsSentence = (data: any): string | undefined => {
    const list = Array.isArray(data) ? data : data.sentences ?? data.items ?? [];
    for (const item of list) {
      const text: string | undefined = item?.text ?? item?.en;
      if (typeof text === "string" && text.startsWith("Is ")) return text;
    }
    return undefined;
  };

  const partsOfBodySentence = findIsSentence(partsOfBody);
  const placesDirectionsSentence = findIsSentence(placesDirections);

  assert(
    partsOfBodySentence === "Is your foot bigger than your hand?",
    "content/sentences/parts_of_body.json 應該還有「Is your foot bigger than your hand?」這句"
  );
  assert(
    placesDirectionsSentence === "Is the hospital near here or over there?",
    "content/sentences/places_directions.json 應該還有「Is the hospital near here or over there?」這句"
  );

  for (const sentence of [partsOfBodySentence!, placesDirectionsSentence!]) {
    const firstToken = sentence.split(" ").filter((w) => w.length > 0)[0];
    assert(
      firstToken === "Is",
      `「${sentence}」用空白字元分割出來的第一個字塊應該剛好是 "Is"（不含標點），才會命中 AMBIGUOUS_STANDALONE_WORDS 規則，實際是 "${firstToken}"`
    );
  }

  console.log("✅ 測試 3 通過：兩句「Is」開頭的句子都還在，且句首字塊會剛好命中 \"Is\" 規則。");
}

// ---- 測試 4：Stage B-1 字塊池點擊時真的是呼叫 speakEnglish(token.text)（保留原始大小寫），
//      不是先轉小寫再唸——這是這個 bug 之所以發生（也是這條規則能命中）的關鍵前提。 ----
{
  assert(
    mainTs.includes("speakEnglish(token.text)"),
    "main.ts 的字塊池點擊事件應該呼叫 speakEnglish(token.text)，保留字塊原始大小寫（句首字塊才會是大寫 Is）"
  );

  console.log("✅ 測試 4 通過：main.ts 字塊池點擊時保留原始大小寫，跟這條規則的前提一致。");
}

console.log("\n✅ 全部 AMBIGUOUS_STANDALONE_WORDS 對照表驗證通過（實際發音效果仍需真實瀏覽器實測確認）。");
