// 驗證「短文點字看中文意思」的資料串接：content/glossary/<topic>.json 補充詞彙表 +
// 跨主題 vocab 查詢，確認三篇短文（family/colors/animals_insects）裡的內容字（名詞、
// 動詞、形容詞等）都查得到中文意思，只有刻意排除的基本文法字／人名查不到
//（這是預期的，不是資料缺漏）。
//
// content.ts 用 Vite 專屬的 import.meta.glob 讀取 content/ 底下的 JSON，tsx 直接跑
// 沒辦法用這個語法（其他 verify-*.ts 遇到同樣的情況，做法都是直接用 readFileSync 讀原始檔案，
// 這裡沿用同一套做法，不 import content.ts），所以這裡重建一份跟 content.ts 的
// lookupPassageWordZh() 邏輯一致的查詢函式，直接讀 JSON 檔案本身來驗證。
// 用法：npx tsx scripts/verify-passage-glossary.ts

import { readFileSync } from "node:fs";
import type { Passage, Vocab } from "../src/types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf-8")) as T;
}

const TOPICS = [
  "greetings",
  "pronouns",
  "family",
  "people",
  "appearance",
  "emotions",
  "personality_traits",
  "parts_of_body",
  "colors",
  "school",
  "numbers",
  "animals_insects",
  "food_drink",
  "clothing_accessories",
  "houses_apartments",
  "tableware",
  "bathroom",
  "transportation",
  "pe_sports",
  "clubs_hobbies",
  "time",
  "calendar",
  "holidays_festivals",
  "sizes_measurements",
  "science",
  "advanced_pronouns",
  "wh_words_frequency",
  "articles_determiners",
  "sentence_connectors",
  "prepositions",
  "other_nouns",
  "other_verbs_1",
  "other_verbs_2",
  "other_adjectives_1",
  "other_adjectives_2",
  "other_adverbs_responses",
];

const vocabByTopic: Record<string, Vocab[]> = Object.fromEntries(
  TOPICS.map((t) => [t, readJson<Vocab[]>(`../../content/vocab/${t}.json`)])
);
const glossaryByTopic: Record<string, Record<string, string>> = Object.fromEntries(
  TOPICS.map((t) => [t, readJson<Record<string, string>>(`../../content/glossary/${t}.json`)])
);
const passageByTopic: Record<string, Passage> = Object.fromEntries(
  TOPICS.map((t) => [t, readJson<Passage>(`../../content/passages/${t}.json`)])
);

// 跟 content.ts 的 globalVocabByEnglish 同一套邏輯：把所有主題的 vocab 攤平成一張查詢表，
// 連 vocab.id 一起存——單字收藏功能需要真正的 vocab.id 才能收藏，這裡連帶驗證這個查詢表
// 有沒有正確帶出 vocabId（不是只驗證 zh 意思查得到）。
const globalVocabByEnglish: Record<string, { zh: string; vocabId: string }> = {};
for (const vocabs of Object.values(vocabByTopic)) {
  for (const v of vocabs) {
    globalVocabByEnglish[v.en.toLowerCase()] = { zh: v.zh, vocabId: v.id };
  }
}

/** 跟 content.ts 的 lookupPassageWordZh() 邏輯一致（2026-08-24 改成「這個主題自己優先」）：
 * 先查這個主題自己的 vocab 清單，查不到才退回跨主題攤平表，再查不到才退回這個主題的
 * 補充詞彙表；查得到 vocab 的字回傳真正的 vocabId，退回 glossary 查到的字 vocabId 是 null
 * （這種字沒有對應的 vocab.id，單字收藏功能沒有東西可以收藏，main.ts 的
 * buildInteractivePassage() 只有 vocabId 不是 null 時才會畫收藏星星）。 */
function lookupPassageWordZh(topicFileKey: string, word: string): { zh: string; vocabId: string | null } | null {
  const key = word.toLowerCase();
  const ownVocab = vocabByTopic[topicFileKey]?.find((v) => v.en.toLowerCase() === key);
  if (ownVocab) return { zh: ownVocab.zh, vocabId: ownVocab.id };
  const fromVocab = globalVocabByEnglish[key];
  if (fromVocab) return { zh: fromVocab.zh, vocabId: fromVocab.vocabId };
  const zh = glossaryByTopic[topicFileKey]?.[key];
  return zh ? { zh, vocabId: null } : null;
}

/** 跟 main.ts 的 buildInteractivePassage() 用同一套規則切字：英文字母／撇號 vs. 其他字元。 */
function tokenizeWords(text: string): string[] {
  const tokens = text.match(/[A-Za-z']+/g) ?? [];
  return [...new Set(tokens.map((t) => t.toLowerCase()))];
}

/** 每篇短文裡「刻意不提供中文意思」的字：基本文法字（代名詞、冠詞、連接詞、be 動詞等）
 * 跟人名，這些字查不到中文意思是預期行為，不是漏掉忘記補。 */
const EXPECTED_UNCOVERED: Record<string, string[]> = {
  // 2026-08-23：Unit 0「教室常用語」拆成兩個主題——greetings（問候／禮貌用語，13 字，
  // 短文沿用原本「Hello, Friend!」的故事）跟 pronouns（代名詞，7 字，短文換成新故事
  // 「My New Classroom」）。拆分前後 unit_zero 20 個字的英文字集合完全一樣（只是搬到
  // 兩個新檔案），所以其他主題原本因為 he/she/we/it/I 全域查得到而移除的排除清單項目
  // 不受影響，不用回頭改。
  greetings: [
    "a", "amy", "if", "lily", "my", "our", "story", "the",
  ],
  pronouns: [
    "ben", "mia", "my", "that", "the", "this", "tom",
  ],
  // "i"／"one" 原本在這些主題自己的排除清單裡（沒有任何主題的 vocab 收錄這兩個字，
  // 所以之前是「預期查不到」），但 Unit 0 新增 voc.unit_zero.005（I）之後，這個字變成
  // 全域 vocab 查得到（globalVocabZhByEnglish 是跨主題攤平的表），連帶讓其他主題的
  // 短文點到「I」也查得到中文意思了——這是預期中的正面副作用（使用者可以在任何主題的
  // 短文裡點「I」看到「我」），所以要把這個字從各主題原本的排除清單移掉，不是漏改。
  //
  // 2026-08-22 Unit 0 改版又新增了「he／she／we／it」等代名詞，同樣的道理，這幾個字
  // 現在也變成全域查得到，以下幾個主題排除清單裡原本的 "he"／"she"／"we"／"it" 一併移掉
  // （"one" 則反過來：Unit 0 移除了 1-10 這批數字，改移到 numbers.json 補上，所以
  // "one" 依然全域查得到，這些主題的排除清單不需要因為 "one" 而改動）。
  family: ["my", "amy", "a"],
  // 2026-08-22：People 主題移除 neighbor／classmate，補上 men/women/person/children/adult/
  // young person/old person，短文換成新故事「People in the Park」，排除清單同步更新。
  people: ["a", "an", "my", "the"],
  // 2026-08-22：Personal Characteristics 拆成 appearance／emotions／personality_traits
  // 三個主題（見 HANDOFF.md 對應章節），這裡的排除清單也拆成三份，對應各自新短文的
  // 實際內容（舊的 personal_characteristics.json 四個檔案技術端已經處理完畢並實際
  // 刪除，main.ts 的 TOPICS／UNITS 也已經換成這三個新主題，見 HANDOFF.md 9.42 節）。
  appearance: ["a", "my"],
  emotions: ["a", "also", "my", "the"],
  personality_traits: [
    "a", "ben", "lily", "mia",
  ],
  // 2026-08-22：Parts of Body 補了 8 個新字（eyebrow/chest/knee/cheek/feet/teeth/tongue/
  // fingernail），其中 feet 是 foot 的不規則複數，新增後讓短文裡原本查不到的 "feet"
  // 變成全域查得到（跟 9.37 節 he/she/we/it 那次是同一種正面副作用），排除清單移除 feet。
  parts_of_body: [
    "my", "eyes", "ears", "arms", "hands", "legs",
  ],
  colors: ["my", "the", "a"],
  school: ["a", "ben", "lee", "ms", "my", "the"],
  // 2026-08-23：Numbers 移除 first／second／third／number／how many 這 5 個非數字/序數詞
  // 後，短文換成新故事「A Fun Day at the Zoo」，排除清單同步更新（見 HANDOFF.md 對應章節）。
  numbers: ["a", "my", "the"],
  science: ["a", "pulls", "that", "the"],
  advanced_pronouns: [],
  wh_words_frequency: ["amy", "the"],
  articles_determiners: [
    "my", "the", "a", "an", "just", "there", "until", "gets",
  ],
  sentence_connectors: ["don't", "my", "that", "the", "our", "an", "just"],
  prepositions: ["my", "a", "the", "this"],
  other_nouns: ["my", "a", "the"],
  other_verbs_1: ["my", "the", "that", "a"],
  other_verbs_2: ["a"],
  other_adjectives_1: [],
  other_adjectives_2: [],
  other_adverbs_responses: [],
  animals_insects: ["my", "a", "the", "was", "had"],
  food_drink: ["my", "mia", "a"],
  clothing_accessories: [
    "my", "leo", "a", "has", "our",
  ],
  houses_apartments: ["my", "ben", "has", "a", "the", "there"],
  tableware: ["my", "amy", "the", "a", "or"],
  transportation: [
    "my", "leo", "the", "a", "an",
  ],
  // 2026-08-24：新增 PE / Sports（體育課）與 Clubs & Hobbies（社團活動）兩個主題，
  // 從單元六原本規劃的「Sports/interests/hobbies」拆出並移入單元三「上學去」（見
  // docs/content-plan.md 3.1 節 2026-08-24 註）。這兩個主題是全新建立，不是舊有的
  // 7 主題缺口（見 9.56 節），所以直接正常補進 TOPICS 陣列，不是暫時繞過。
  pe_sports: [
    "a", "around", "did", "had", "my", "the",
  ],
  clubs_hobbies: ["my", "our", "the"],
  // 2026-08-24：新增 Bathroom 主題（浴室），移入單元二「食衣住行」，跟先前十七節記錄的
  // 候選字一致（先前決定「先不建」，這次使用者要求正式開這個主題）。"brush"／"hands" 在
  // 短文本文裡是「brush my teeth」「wash my hands」這種被 my 隔開的詞組，不是連續兩個字，
  // 所以跟已知的短文詞組查字限制（見 9.72 節 piggy bank／bank）同一種狀況，查不到中文意思
  // 是預期的，不是資料缺漏。"mom" 是人物稱呼，跟其他主題排除清單裡的人名同類。
  bathroom: ["a", "hands", "mom", "my", "the"],
  // 2026-08-25：使用者要求正式開始規劃單元六「時間與節日」，新增 Time／Calendar／
  // Holidays & Festivals／Sizes & Measurements 四個全新主題（原規劃只有 3 個主題，
  // Time 因為候選字太多〔星期+月份+報時概念約 40+ 字〕，使用者選擇拆成 Time 與 Calendar
  // 兩個主題，見 docs/content-plan.md 3.1 節 2026-08-25 註）。這四個主題都是全新建立，
  // 比照 PE / Sports／Bathroom 的慣例，直接正常登記進 TOPICS 陣列。
  time: ["a", "my", "the"],
  calendar: ["a", "my", "the"],
  holidays_festivals: ["a", "be", "my", "the"],
  sizes_measurements: ["a", "my", "our", "the", "was"],
};

for (const [topic, expectedUncovered] of Object.entries(EXPECTED_UNCOVERED)) {
  const passage = passageByTopic[topic];
  const words = tokenizeWords(passage.text);

  const actualUncovered: string[] = [];
  const covered: string[] = [];
  for (const word of words) {
    const result = lookupPassageWordZh(topic, word);
    if (result) covered.push(word);
    else actualUncovered.push(word);
    // 查得到中文意思的字，vocabId 只有兩種合法狀態：來自 vocab（非 null）或來自
    // glossary 補充詞彙表（null）——不會有「查得到 zh 但 vocabId 是 undefined」這種
    // 半吊子狀態，這裡順手確認回傳形狀正確，不只是 truthy 檢查。
    if (result) {
      assert(
        typeof result.zh === "string" && result.zh.length > 0,
        `${topic} 的「${word}」查到的 zh 應該是非空字串`
      );
      assert(
        result.vocabId === null || typeof result.vocabId === "string",
        `${topic} 的「${word}」的 vocabId 應該是 null 或字串，不是其他型別`
      );
    }
  }

  const expectedSet = new Set(expectedUncovered);
  const actualSet = new Set(actualUncovered);
  const missingFromExpected = actualUncovered.filter((w) => !expectedSet.has(w));
  // 「預期查不到」的字，如果現在已經不在「實際查不到」的集合裡，代表其實查得到了（清單過期，該更新）。
  const unexpectedlyCovered = expectedUncovered.filter((w) => !actualSet.has(w));

  assert(
    missingFromExpected.length === 0,
    `${topic}：這些字意外查不到中文意思，可能漏補進 content/glossary/${topic}.json：${missingFromExpected.join(", ")}`
  );
  assert(
    unexpectedlyCovered.length === 0,
    `${topic}：預期排除清單裡的字其實查得到中文意思了，清單需要更新：${unexpectedlyCovered.join(", ")}`
  );

  console.log(
    `✅ ${topic}：短文共 ${words.length} 個不重複的字，${covered.length} 個查得到中文意思，${actualUncovered.length} 個是預期排除的基本文法字/人名。`
  );
}

// ---- 額外驗證：跨主題查詢真的有作用——sister 是 family 主題的 vocab，
//      colors 短文裡也出現「sister」這個字，即使是在 colors 主題底下查，也要查得到，
//      而且 vocabId 要是 family 主題那個 sister 的真正 vocab.id（單字收藏功能要用）。 ----
{
  const result = lookupPassageWordZh("colors", "sister");
  assert(result !== null, "跨主題查詢失敗：在 colors 主題底下查「sister」（family 主題的 vocab）應該要查得到");
  assert(
    result!.vocabId !== null && result!.vocabId.startsWith("voc.family."),
    `「sister」查到的 vocabId 應該是 family 主題的 vocab.id，實際 "${result!.vocabId}"`
  );
  console.log(
    `✅ 跨主題查詢驗證通過：在 colors 主題底下查「sister」查到「${result!.zh}」＋vocabId「${result!.vocabId}」（來自 family 主題的 vocab 資料）。`
  );
}

// ---- 額外驗證：查不存在的字要回傳 null，不能讓程式掛掉 ----
{
  const result = lookupPassageWordZh("family", "xyzzynotarealword");
  assert(result === null, "查一個不存在的字應該回傳 null");
  console.log("✅ 查不存在的字正確回傳 null。");
}

// ---- 額外驗證：單字收藏功能的關鍵技術細節——退回 glossary 補充詞彙表查到的字
//      （不在任何主題的 vocab 清單裡，例如職業名稱），vocabId 必須是 null，
//      因為這種字沒有對應的 vocab.id，沒有東西可以收藏，main.ts 的
//      buildInteractivePassage() 就是靠這個欄位判斷要不要畫收藏星星。 ----
{
  let checkedAtLeastOne = false;
  for (const [topic, glossary] of Object.entries(glossaryByTopic)) {
    for (const glossaryWord of Object.keys(glossary)) {
      if (globalVocabByEnglish[glossaryWord]) continue; // 這個字剛好也在某個主題的 vocab 裡，不是我們要找的「純 glossary」情況
      const result = lookupPassageWordZh(topic, glossaryWord);
      assert(result !== null, `${topic} 的 glossary 補充詞彙「${glossaryWord}」應該查得到`);
      assert(
        result!.vocabId === null,
        `${topic} 的 glossary 補充詞彙「${glossaryWord}」不屬於任何主題的 vocab，vocabId 應該是 null，實際 "${result!.vocabId}"`
      );
      checkedAtLeastOne = true;
    }
  }
  assert(checkedAtLeastOne, "至少要找到一個純 glossary（不在任何主題 vocab 裡）的字才能驗證這個情況");
  console.log("✅ glossary 補充詞彙表查到的字（不屬於任何主題的 vocab）vocabId 正確回傳 null，不會誤判成可以收藏。");
}

console.log("\n✅ 全部短文詞彙查詢驗證通過（含單字收藏功能需要的 vocabId 欄位）。");
