// content/ 資料夾是內容的 single source of truth（見 docs/content-plan-gept-kids.md 2.1）。
// Phase 1 骨架先用「build 時直接 import JSON」的方式串接，不做額外的匯入/資料庫層——
// 這對純靜態網站（GitHub Pages）來說最簡單：JSON 在打包時就變成 JS bundle 的一部分，
// 不需要在執行期額外 fetch，也不需要處理路徑部署問題。
// 之後如果要擴充成 24 個主題，這裡用一個 import.meta.glob 就能自動載入 content/vocab/*.json，
// 不需要每加一個主題就手動加一行 import。

import type { Badge, ChangelogEntry, Conversation, Crossword, GameConfig, Passage, Sentence, Vocab } from "./types";
// content/badges/badges.json 是「一份清單」而不是像 vocab/sentences 那樣按主題各自一個檔案，
// 所以不用 import.meta.glob，直接照 tsconfig 的 resolveJsonModule 設定當一般模組匯入即可，
// 建置時期會被打包進 JS bundle，執行期不需要額外 fetch。
import badgesData from "../../content/badges/badges.json";
// content/changelog.json 跟 badges.json 一樣是單一清單檔案，比照同樣的匯入方式。
// 這份資料本身已經由新到舊排列，畫面端不用另外排序，直接照陣列順序取前幾則渲染即可。
import changelogData from "../../content/changelog.json";
// content/games/games.json：「遊戲室」上架清單，一樣是單一清單檔案，比照同樣的匯入方式。
import gamesData from "../../content/games/games.json";

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

// Stage E 會話練習：每主題單一物件
const conversationModules = import.meta.glob("../../content/conversations/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Conversation>;

// content/glossary/<topic>.json：補充「短文理解」點字看中文意思要用的額外單字翻譯，
// 只收「不在該主題 vocab_ids、也不在任何主題 vocab 清單裡」的字（例如短文裡出現的
// teacher/nurse 這種屬於別的主題、甚至完全沒有 vocab 資料的字）。見 content/schema/glossary.schema.json。
const glossaryModules = import.meta.glob("../../content/glossary/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Record<string, string>>;

// content/crosswords/*.json：遊戲室「填字遊戲」的關卡資料，一個檔案是一個關卡（不是
// 按主題分，一個主題之後可能有好幾個關卡），比照 vocab/sentences 用 import.meta.glob
// 自動載入，之後 content 端要擴充新主題/新關卡，直接加檔案即可，不用改這裡的程式碼。
const crosswordModules = import.meta.glob("../../content/crosswords/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Crossword>;

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
const conversationByTopic = indexSingleByTopicKey(conversationModules);
const glossaryByTopic = indexSingleByTopicKey(glossaryModules);

export function getConversationByTopic(topicFileKey: string): Conversation | undefined {
  return conversationByTopic[topicFileKey];
}

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

export interface TopicConfig {
  fileKey: string;
  label: string;
}

// 目前規劃的主題清單（對應 content/vocab|sentences|passages/{fileKey}.json）。
// 之後要再擴充主題，只要 content/ 底下三份檔案都準備好、都是 published 狀態，
// 在這裡加一行就好，不用再動下面的邏輯。
// 2026-09-29：從 main.ts 移到這裡（連同下面的 TopicContent／loadTopicContent），
// 讓「翻牌配對」獨立 iframe 頁面（memoryMatchStandalone.ts）跟 main.ts 可以共用同一份
// 主題清單跟同一套「主題內容是否齊全」判斷邏輯——避免兩邊各寫一份、之後主題清單一改
// 卻忘記同步更新其中一邊，導致遊戲室抽到的單字池跟主站學習範圍偷偷對不齊。
export const TOPICS: TopicConfig[] = [
  { fileKey: "greetings", label: "Greetings 問候與禮貌用語" },
  { fileKey: "pronouns", label: "Pronouns 代名詞" },
  { fileKey: "family", label: "Family 家庭" },
  { fileKey: "people", label: "People 人" },
  { fileKey: "appearance", label: "Appearance 外觀特徵" },
  { fileKey: "emotions", label: "Emotions 情緒" },
  { fileKey: "personality_traits", label: "Personality Traits 性格特質" },
  { fileKey: "parts_of_body", label: "Parts of Body 身體部位" },
  { fileKey: "colors", label: "Art 美術" },
  { fileKey: "school", label: "School 學校" },
  { fileKey: "numbers", label: "Math 數學" },
  { fileKey: "science", label: "Science 自然科學" },
  { fileKey: "pe_sports", label: "PE / Sports 體育課" },
  { fileKey: "clubs_hobbies", label: "Clubs & Hobbies 社團活動" },
  { fileKey: "animals_insects", label: "Animals & Insects 動物與昆蟲" },
  { fileKey: "food_drink", label: "Food & Drink 食物與飲料" },
  { fileKey: "clothing_accessories", label: "Clothing & Accessories 衣服與配件" },
  { fileKey: "houses_apartments", label: "Houses & Apartments 房子與公寓" },
  { fileKey: "tableware", label: "Kitchen & Dining 廚房與餐具" },
  { fileKey: "bathroom", label: "Bathroom 浴室" },
  { fileKey: "transportation", label: "Transportation 交通工具" },
  { fileKey: "weather_nature", label: "Weather 天氣" },
  { fileKey: "geographical_terms", label: "Geographical Terms 地理名詞" },
  { fileKey: "places_directions", label: "Places & Directions 地點與方位" },
  { fileKey: "occupations", label: "Occupations 職業" },
  { fileKey: "money", label: "Money 金錢" },
  { fileKey: "health", label: "Health 健康" },
  { fileKey: "forms_of_address", label: "Forms of Address 稱謂" },
  { fileKey: "time", label: "Time 時間" },
  { fileKey: "calendar", label: "Calendar 日曆" },
  { fileKey: "holidays_festivals", label: "Holidays & Festivals 節日" },
  { fileKey: "sizes_measurements", label: "Sizes & Measurements 尺寸與量測" },
  { fileKey: "advanced_pronouns", label: "Advanced Pronouns 代名詞總複習" },
  { fileKey: "wh_words_frequency", label: "Wh-Words & Frequency 疑問詞與頻率副詞" },
  { fileKey: "articles_determiners", label: "Articles & Determiners 冠詞與限定詞" },
  { fileKey: "sentence_connectors", label: "Sentence Connectors 造句小幫手" },
  { fileKey: "prepositions", label: "Prepositions 介系詞" },
  { fileKey: "other_nouns", label: "Other Nouns 其他常用名詞" },
  { fileKey: "other_verbs_1", label: "Other Verbs I 其他常用動詞 I" },
  { fileKey: "other_verbs_2", label: "Other Verbs II 其他常用動詞 II" },
  { fileKey: "other_adjectives_1", label: "Other Adjectives I 其他常用形容詞 I" },
  { fileKey: "other_adjectives_2", label: "Other Adjectives II 其他常用形容詞 II" },
  { fileKey: "other_adverbs_responses", label: "Other Adverbs & Responses 其他副詞與應答詞" },
];

export interface TopicContent {
  vocab: Vocab[];
  sentences: Sentence[];
  passage: Passage;
}

/** 讀取＋過濾某個主題可以練習的內容；只要單字／句子／短文其中之一不齊全就回傳 null（不丟例外），
 * 讓呼叫端可以決定要跳過這個主題還是提示使用者，不會讓整個 App 崩掉。 */
export function loadTopicContent(topic: TopicConfig): TopicContent | null {
  const vocab: Vocab[] = getVocabByTopic(topic.fileKey).filter((v) => v.status === "published");
  const sentences: Sentence[] = getSentencesByTopic(topic.fileKey).filter(
    (s) => s.topic === topic.fileKey && s.stage === "B" && s.status === "published"
  );
  const passage: Passage = getPassageByTopic(topic.fileKey);
  if (vocab.length === 0 || sentences.length === 0 || passage.status !== "published") {
    return null;
  }
  return { vocab, sentences, passage };
}

/** 遊戲室「翻牌配對」用：從全部主題（只算內容齊全、TOPICS 有登記的主題，跟主站學習
 * 範圍完全一致，不會多算或少算）的 published 單字裡隨機抽 count 組英文/中文配對。
 * 2026-09-29 新增，抽成這裡一個共用函式，是因為這段抽卡邏輯原本只有 main.ts 的
 * createMemoryMatchGame() 在用；翻牌配對改成獨立 iframe 頁面（memoryMatchStandalone.ts）
 * 之後，兩邊都需要一樣的抽卡池，寫成共用函式才不會兩邊各寫一份、之後容易對不齊。 */
export function pickRandomVocabPairs(count: number): { en: string; zh: string }[] {
  const pool: Vocab[] = TOPICS.flatMap((topic) => loadTopicContent(topic)?.vocab ?? []);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count).map((v) => ({ en: v.en, zh: v.zh }));
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
// 常用不規則動詞/名詞詞形映射（過去式、過去分詞、複數等 -> 原型）
const IRREGULAR_LEMMA_MAP: Record<string, string> = {
  said: "say",
  did: "do",
  ran: "run",
  went: "go",
  came: "come",
  ate: "eat",
  saw: "see",
  took: "take",
  got: "get",
  made: "make",
  gave: "give",
  told: "tell",
  found: "find",
  thought: "think",
  knew: "know",
  fell: "fall",
  swam: "swim",
  flew: "fly",
  slept: "sleep",
  wrote: "write",
  read: "read",
  spoke: "speak",
  sang: "sing",
  built: "build",
  bought: "buy",
  brought: "bring",
  caught: "catch",
  heard: "hear",
  sat: "sit",
  stood: "stand",
  met: "meet",
  left: "leave",
  lost: "lose",
  won: "win",
  held: "hold",
  drove: "drive",
  rode: "ride",
  wore: "wear",
  broke: "break",
  threw: "throw",
  grew: "grow",
  drew: "draw",
  drank: "drink",
  feet: "foot",
  teeth: "tooth",
  mice: "mouse",
  children: "child",
  men: "man",
  women: "woman",
};

/** 取得英文單字可能的原型候選列表（依可能性高低排序） */
function getLemmaCandidates(word: string): string[] {
  const candidates: string[] = [];
  const lower = word.toLowerCase();

  // 1. 不規則變化表
  if (IRREGULAR_LEMMA_MAP[lower]) {
    candidates.push(IRREGULAR_LEMMA_MAP[lower]);
  }

  // 2. 動詞進行式 -ing (如 doing -> do, climbing -> climb, dancing -> dance, running -> run)
  if (lower.endsWith("ing") && lower.length > 4) {
    const base = lower.slice(0, -3);
    candidates.push(base); // climbing -> climb
    candidates.push(base + "e"); // dancing -> dance, making -> make
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.push(base.slice(0, -1)); // running -> run
    }
  }

  // 3. 過去式 -ed (如 climbed -> climb, liked -> like, stopped -> stop, studied -> study)
  if (lower.endsWith("ed") && lower.length > 4) {
    if (lower.endsWith("ied") && lower.length > 4) {
      candidates.push(lower.slice(0, -3) + "y"); // studied -> study, cried -> cry
    }
    const base = lower.slice(0, -2);
    candidates.push(base); // climbed -> climb, scampered -> scamper
    candidates.push(lower.slice(0, -1)); // liked -> like, smiled -> smile (-d)
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      candidates.push(base.slice(0, -1)); // stopped -> stop
    }
  }

  // 4. 名詞複數 / 動詞第三人稱單數 -s, -es, -ies (如 squirrels -> squirrel, stories -> story)
  if (lower.endsWith("s") && !lower.endsWith("ss") && lower.length > 3) {
    if (lower.endsWith("ies") && lower.length > 4) {
      candidates.push(lower.slice(0, -3) + "y"); // stories -> story
    } else if (lower.endsWith("es") && lower.length > 3) {
      candidates.push(lower.slice(0, -2)); // boxes -> box, watches -> watch
      candidates.push(lower.slice(0, -1)); // cakes -> cake
    } else {
      candidates.push(lower.slice(0, -1)); // squirrels -> squirrel, trees -> tree
    }
  }

  return [...new Set(candidates.filter((c) => c !== lower))];
}

// 常用文法字、會話常用語與繪本故事生字之全域補充詞庫
const COMMON_CONVERSATIONAL_WORDS: Record<string, string> = {
  // 文法功能詞
  the: "這、那（定冠詞）",
  that: "那個、那樣",
  this: "這個",
  these: "這些",
  those: "那些",
  did: "做、助動詞（過去式）",
  say: "說",
  said: "說（過去式）",
  doing: "做、正在做",
  course: "過程、課程（of course 當然）",
  back: "回來、後面",
  down: "向下、下來",
  up: "向上、在上面",
  away: "離開、遠離",
  with: "用、和...一起",
  of: "...的、屬於",
  for: "為了、給予",
  at: "在...（地點/時間）",
  on: "在...上面",
  in: "在...裡面",
  to: "到、朝向、向",
  from: "從...來自",
  by: "在...旁邊、搭乘",
  into: "進入...之中",
  out: "出來、向外",
  about: "關於、大約",
  over: "在...之上、翻過",
  under: "在...之下",
  again: "再一次、又",
  so: "如此、這麼、非常",
  very: "非常、很",
  too: "也、太",
  will: "將會、想要",
  would: "將會、願意",
  can: "能夠、可以",
  could: "能、可以（過去式）",
  should: "應該",
  must: "必須",
  may: "可以、也許",
  might: "可能",
  just: "只是、剛好",
  now: "現在",
  then: "然後、那時",
  here: "這裡",
  there: "那裡",
  where: "哪裡",
  when: "何時",
  why: "為什麼",
  how: "如何、怎樣",
  what: "什麼",
  who: "誰",
  all: "全部、所有",
  some: "一些",
  any: "任何",
  every: "每個、每一",
  each: "每個",
  both: "兩者都",
  other: "其他的",
  another: "另一個",
  more: "更多",
  most: "最多的",
  much: "許多",
  many: "許多",
  little: "小巧的、一點點",
  few: "很少的",
  your: "你的、你們的",
  my: "我的",
  our: "我們的",
  their: "他們的",
  his: "他的",
  her: "她的",
  its: "它的",

  // 繪本與會話常見詞彙
  fantastic: "極好的、太棒了",
  practice: "練習",
  single: "單一的、每一個",
  path: "小徑、道路",
  squirrel: "松鼠",
  pine: "松樹",
  scamper: "蹦跳竄跑、奔馳",
  scampered: "蹦跳竄跑（過去式）",
  climb: "爬、攀爬",
  climbed: "爬、攀爬（過去式）",
  playful: "頑皮的、調皮活潑的",
  garden: "花園、庭院",
  look: "看、瞧",
  run: "跑步、奔跑",
  ran: "跑步（過去式）",
  fast: "快速的",
  hard: "認真地、辛勤地、硬的",
  day: "天、日子",
  tree: "樹木",
  english: "英文、英語",
  tall: "高的",
  come: "來、過來",
  play: "玩耍、遊玩",
  sorry: "不好意思、抱歉",
  please: "請",
  thank: "感謝",
  thanks: "謝謝",
  welcome: "受歡迎的、歡迎",
  hello: "哈囉、你好",
  hi: "嗨",
  bye: "再見",
  goodbye: "再見",
  friend: "朋友",
  class: "班級、課堂",
  school: "學校",
  home: "家",
  story: "故事",
  book: "書籍",
  smile: "微笑",
  laugh: "大笑",
  happy: "快樂的",
  nice: "美好的、親切的",
  great: "很棒的、巨大的",
  good: "好的",
  fun: "好玩的、樂趣",
  love: "喜愛、愛",
  like: "喜歡、如同",
  hear: "聽見",
  listen: "聆聽",
  see: "看見",
  watch: "觀看",
  speak: "說話",
  talk: "聊天、交談",
  read: "閱讀",
  write: "書寫",
  draw: "繪畫",
  sing: "唱歌",
  dance: "跳舞",
  jump: "跳躍",
  walk: "走路",
  swim: "游泳",
  fly: "飛翔",
  ride: "騎乘",
  drive: "開車",
  eat: "吃",
  drink: "喝",
  sleep: "睡覺",
  wake: "醒來",
  wear: "穿著",
  open: "打開",
  close: "關閉",
  clean: "乾淨的",
  wash: "清洗",
  brush: "刷洗",
  count: "數數",
  guess: "猜猜看",
  choose: "選擇",
  check: "檢查",
  learn: "學習",
  help: "幫忙",
  ready: "準備好了",
  sure: "當然、確定的",
  okay: "好的、可以",
  ok: "好的、可以",
  yes: "是的",
  no: "不、沒有",
  well: "好、安好",
};

/**
 * 查某個英文字（大小寫不拘）的中文意思與 vocabId：
 * 查詢順序：
 *   1. 優先查「這個主題自己」的 vocab 清單（精確比對）
 *   2. 退回「跨主題攤平表」globalVocabByEnglish（精確比對）
 *   3. 退回「這個主題自己」的補充詞彙表（content/glossary/<topic>.json）
 *   4. 智慧字幹還原（Lemmatization）：將時態/屈折變化形還原後，重新比對步驟 1~3
 *   5. 全域常見文法詞與會話詞庫（COMMON_CONVERSATIONAL_WORDS）
 * 都查不到回傳 null（呼叫端可進行發音兜底，顯示英文本身與發音按鈕）。
 */
export function lookupPassageWordZh(
  topicFileKey: string,
  word: string
): { zh: string; vocabId: string | null } | null {
  const key = word.toLowerCase();

  // 1. 優先查「這個主題自己」的 vocab 清單
  const ownVocab = vocabByTopic[topicFileKey]?.find((v) => v.en.toLowerCase() === key);
  if (ownVocab) return { zh: ownVocab.zh, vocabId: ownVocab.id };

  // 2. 退回跨主題全域表
  const fromVocab = globalVocabByEnglish[key];
  if (fromVocab) return { zh: fromVocab.zh, vocabId: fromVocab.vocabId };

  // 3. 退回該主題自己的補充詞彙表
  const glossary = glossaryByTopic[topicFileKey];
  const zh = glossary?.[key];
  if (zh) return { zh, vocabId: null };

  // 4. 智慧字幹還原（Lemmatization / Stemming）
  const candidates = getLemmaCandidates(key);
  for (const cand of candidates) {
    const ownCand = vocabByTopic[topicFileKey]?.find((v) => v.en.toLowerCase() === cand);
    if (ownCand) return { zh: ownCand.zh, vocabId: ownCand.id };

    const fromGlobCand = globalVocabByEnglish[cand];
    if (fromGlobCand) return { zh: fromGlobCand.zh, vocabId: fromGlobCand.vocabId };

    const candZh = glossary?.[cand];
    if (candZh) return { zh: candZh, vocabId: null };
  }

  // 5. 全域常見文法詞與會話生字表
  const commonZh = COMMON_CONVERSATIONAL_WORDS[key];
  if (commonZh) return { zh: commonZh, vocabId: null };

  for (const cand of candidates) {
    const candCommonZh = COMMON_CONVERSATIONAL_WORDS[cand];
    if (candCommonZh) return { zh: candCommonZh, vocabId: null };
  }

  return null;
}

const BADGES = badgesData as Badge[];

/** 43 個成就徽章的正式清單（content/badges/badges.json），依 code 順序排列方便畫面呈現。 */
export function getAllBadges(): Badge[] {
  return [...BADGES].sort((a, b) => a.code.localeCompare(b.code));
}

// content/changelog.json（給使用者看的簡短更新紀錄）本身已經由新到舊排列，這裡不用
// 另外排序，直接原樣匯出給 renderAbout() 取前 5 則使用。
export const CHANGELOG: ChangelogEntry[] = changelogData;

// content/games/games.json（「遊戲室」上架清單）：畫面端自己依 order 排序、依 status
// 篩選要不要顯示，這裡不預先處理，原樣匯出即可（跟 CHANGELOG 不同，這份清單沒有
// 「已經照顯示順序排好」的既定假設）。
export const GAMES: GameConfig[] = gamesData as GameConfig[];

// 全部填字關卡（值的順序不保證，呼叫端要自己篩選/排序）。目前只有 1 個打樣關卡
// （crossword.houses_apartments.living_space），之後 content 端擴充更多主題/關卡時，
// 這裡不用改，新檔案會自動被 import.meta.glob 抓進來。
export const CROSSWORDS: Crossword[] = Object.values(crosswordModules);

export function getCrosswordById(id: string): Crossword | undefined {
  return CROSSWORDS.find((c) => c.id === id);
}
