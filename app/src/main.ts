// Phase 1 最小可行骨架的進入點。
// 開場先登入（本機端選「誰在玩」，見 profile.ts），再選主題，再進題型選單，
// 串了四種文字型題型的完整流程：
//   Stage A   單字配對      matchingGame.ts   (content/vocab/{topic}.json)
//   Stage B-1 句子排序      orderingGame.ts   (content/sentences/{topic}.json, stage B)
//   Stage B-2 句子填空      fillBlankGame.ts  (同上，挖空 vocab_ids 對應的字)
//   Stage C   短文理解選擇  choiceGame.ts     (content/passages/{topic}.json)
// 對應 docs/content-plan-gept-kids.md 3.3 的關卡設計（單字 → 短句 → 短文）。
// 目前有完整內容（單字＋句子＋短文都是 published）的主題：Family、Colors、Animals & insects。

import "./style.css";
import {
  getAllBadges,
  getPassageByTopic,
  getSentencesByTopic,
  getVocabByTopic,
  lookupPassageWordZh,
} from "./content";
import { MatchingGame, type MatchCard } from "./matchingGame";
import { OrderingGame, type OrderingToken } from "./orderingGame";
import { FillBlankGame } from "./fillBlankGame";
import { ChoiceGame, type ChoiceOptionState } from "./choiceGame";
import { buildCapstoneQuestions } from "./capstoneQuestions";
import { FlashcardGame, type FlashcardQuizOptionState } from "./flashcardGame";
import {
  speakEnglish,
  speakPassage,
  stopSpeaking,
  isSlowSpeechEnabled,
  setSlowSpeechEnabled,
} from "./speech";
import { computeLearningPoints } from "./points";
import {
  clearAllProgress,
  getStageProgress,
  recordStageCompletion,
  type StageKey,
  type StageProgress,
} from "./progress";
import {
  createProfile,
  deleteProfile,
  getActiveProfileId,
  getProfileById,
  listProfiles,
  setActiveProfileId,
  updateProfile,
  type Profile,
} from "./profile";
import { AVATARS, getAvatarById } from "./avatars";
import { getBadgeImageUrl } from "./badgeImages";
import aboutBannerUrl from "./assets/about-banner.jpg";
import { recordPlayToday, getPlayStreak, getTotalDaysPlayed } from "./playLog";
import { addPlayTime, getTotalPlayTimeMs, formatPlayTimeLines } from "./playTime";
import { isFavorite, toggleFavorite, getFavoriteVocabIds, getFavoriteCount } from "./favorites";
import { playCorrectSound, playWrongSound, playRoundCompleteSound, playFavoriteSound, playUnfavoriteSound } from "./sound";
import {
  recordQuestionAnswered,
  recordRoundCompletion,
  syncDailyStreakBadges,
  clearBadgeStats,
  getBadgeStats,
  type StageKeyForBadges,
} from "./badgeStats";
import type { Badge, Passage, Sentence, Vocab } from "./types";
// 全站頁尾要顯示的版本號，直接讀 package.json 的 version 欄位（tsconfig.json 已經開了
// resolveJsonModule，Vite 本身也原生支援 JSON import），不在這裡另外寫死一份版本字串，
// 避免以後 package.json 升版了、頁尾卻忘記同步更新。
import pkg from "../package.json";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("找不到 #app 掛載點");
}

interface TopicConfig {
  fileKey: string;
  label: string;
}

// 目前規劃的主題清單（對應 content/vocab|sentences|passages/{fileKey}.json）。
// 之後要再擴充主題，只要 content/ 底下三份檔案都準備好、都是 published 狀態，
// 在這裡加一行就好，不用再動下面的邏輯。
const TOPICS: TopicConfig[] = [
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

/**
 * 0～6 共 7 個單元分類（docs/content-plan.md 3.1 節），首頁依這個分組呈現主題卡片。
 * topicFileKeys 是「這個單元完整規劃涵蓋的主題」，不是「目前已經做出內容的主題」——
 * 之後陸續擴充其餘主題，只要 content/ 資料齊全、`TOPICS` 有登記，就會自動出現在
 * 對應的單元底下；還沒做出內容的主題，單元頁面上就只是暫時看不到卡片，不影響
 * 「單元完成度」徽章判斷（unit_completion 徽章需要這個單元規劃的主題全部存在且都
 * 通過 Stage D，見 computeBadgeViewState 的 "unit_completion" case）。
 *
 * unit0（教室常用語）是新手起手式，底下有 greetings（問候與禮貌用語）／pronouns（代名詞）
 * 兩個主題，渲染時仍走獨立的區塊／提示文字（見 renderTopicSelect()），併入這個陣列只是
 * 為了讓 0～6 的編號跟命名連貫一致；
 * unit_completion 徽章判斷邏輯明確排除 unit0（見下方 computeBadgeViewState 的說明），
 * 不會另外產生一個跟 OB-02（unit0_complete）語意重複的徽章。
 */
interface UnitConfig {
  key: string;
  label: string;
  topicFileKeys: string[];
}

const UNITS: UnitConfig[] = [
  {
    key: "unit0",
    label: "單元 0：教室常用語",
    topicFileKeys: ["greetings", "pronouns"],
  },
  {
    key: "unit1",
    label: "單元一：我和身邊的人",
    topicFileKeys: ["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"],
  },
  {
    key: "unit2",
    label: "單元二：食衣住行",
    topicFileKeys: ["food_drink", "clothing_accessories", "houses_apartments", "tableware", "bathroom", "transportation"],
  },
  {
    key: "unit3",
    label: "單元三：上學去",
    topicFileKeys: ["school", "numbers", "colors", "pe_sports", "clubs_hobbies", "science"],
  },
  {
    key: "unit4",
    label: "單元四：大自然與動物",
    topicFileKeys: ["animals_insects", "weather_nature", "geographical_terms"],
  },
  {
    key: "unit5",
    label: "單元五：生活情境",
    topicFileKeys: ["places_directions", "occupations", "money", "health", "forms_of_address"],
  },
  {
    key: "unit6",
    label: "單元六：時間與節日",
    topicFileKeys: ["time", "calendar", "holidays_festivals", "sizes_measurements"],
  },
  {
    key: "unit7",
    label: "單元七：文法小幫手",
    topicFileKeys: [
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
    ],
  },
];

// 43 個成就徽章的正式清單（content/badges/badges.json），開場讀一次就好，
// 徽章定義是靜態內容，不會在執行期變動。
const ALL_BADGES: Badge[] = getAllBadges();

/** 「連勝十題」（PF-02）的門檻直接從 badges.json 讀，不要在 main.ts 另外寫死一次 10 這個數字。 */
const CORRECT_STREAK_THRESHOLD =
  ALL_BADGES.find((b) => b.id === "badge.performance.streak10")?.threshold ?? 10;

// 「連續學習天數」（SK-01~04）的門檻同樣直接從 badges.json 讀出來，key 是徽章 id、value 是天數門檻，
// 傳給 badgeStats.ts 的 syncDailyStreakBadges()，這個模組本身不用知道任何具體的徽章內容。
const STREAK_BADGE_THRESHOLDS: Record<string, number> = Object.fromEntries(
  ALL_BADGES.filter((b) => b.category === "streak" && b.threshold !== null).map((b) => [b.id, b.threshold as number])
);

/** 每次一輪題型完成時呼叫：把目前的連續遊玩天數拿去檢查「連續學習天數」徽章有沒有跨過門檻。 */
function syncStreakBadgesNow(profileId: string): void {
  syncDailyStreakBadges(profileId, getPlayStreak(profileId), STREAK_BADGE_THRESHOLDS);
}

interface TopicContent {
  vocab: Vocab[];
  sentences: Sentence[];
  passage: Passage;
}

/** 讀取＋過濾某個主題可以練習的內容；只要單字／句子／短文其中之一不齊全就回傳 null（不丟例外），
 * 讓呼叫端可以決定要跳過這個主題還是提示使用者，不會讓整個 App 崩掉。 */
function loadTopicContent(topic: TopicConfig): TopicContent | null {
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

interface TopicSummary {
  topic: TopicConfig;
  vocabCount: number;
  sentenceCount: number;
  passageTitle: string;
}

// 開場先把每個主題的內容都檢查過一次，只有真的齊全的才會出現在「選擇主題」畫面上。
const availableTopics: TopicSummary[] = TOPICS.map((topic) => {
  const content = loadTopicContent(topic);
  return content
    ? {
        topic,
        vocabCount: content.vocab.length,
        sentenceCount: content.sentences.length,
        passageTitle: content.passage.title,
      }
    : null;
}).filter((t): t is TopicSummary => t !== null);

if (availableTopics.length === 0) {
  app.innerHTML = `<p class="error">目前沒有任何主題的內容是齊全的（單字／句子／短文都要是 published 狀態）。</p>`;
  throw new Error("no available topics");
}

type Screen =
  | "profileSelect"
  | "topicSelect"
  | "menu"
  | "vocabOverview"
  | "flashcards"
  | "matching"
  | "ordering"
  | "fillBlank"
  | "choice"
  | "capstone"
  | "stats"
  | "badges"
  | "favorites"
  | "profileDetail"
  | "about";
// 預設開場先登入（選使用者），再選主題，再進題型選單，方便一次看到四種題型的入口，
// 不用照順序破關才能檢視——這是給內容/題型確認用的導覽方式，跟正式產品
// 「照 Stage A→B→C→D 順序解鎖」的關卡邏輯是分開的概念：兩者並存，選單只是額外
// 加開的捷徑，不影響 Stage 完成後自動出現「前往下一關」的既有流程。

// 先把第一個可玩的主題準備好（給還沒選主題就被存取到的變數一個合理初始值），
// 真正要玩哪個主題，要等使用者在「選擇主題」畫面點選之後由 goToTopic() 決定。
const firstTopicContent = loadTopicContent(availableTopics[0].topic) as TopicContent;
let currentTopic: TopicConfig = availableTopics[0].topic;
let playableVocab: Vocab[] = firstTopicContent.vocab;
let playableSentences: Sentence[] = firstTopicContent.sentences;
let currentPassage: Passage = firstTopicContent.passage;

// 「字卡暖身」：插在 Stage A 之前的新學習單元，見 flashcardGame.ts 的說明。
let flashcardGame: FlashcardGame | null = null;
let matchingGame: MatchingGame | null = null;
let orderingGame: OrderingGame | null = null;
let fillBlankGame: FillBlankGame | null = null;
let choiceGame: ChoiceGame | null = null;
// Stage D 綜合關卡：沿用 ChoiceGame 同一套單選題引擎（見 capstoneQuestions.ts 的說明），
// 只是題目來源換成混合單字/短句/短文出的清單，不是某一篇短文自己的 questions[]。
let capstoneGame: ChoiceGame | null = null;

// 成效追蹤只要在「這一輪剛好完成的那一刻」寫一次 localStorage 就好，不能每次 render 都寫——
// render() 每點一下畫面就會呼叫，isRoundComplete 之後會維持 true 好一段時間，
// 用這幾個旗標記住「這次完成已經記錄過了」，避免重複寫入、把 timesCompleted 灌水。
let flashcardsRecorded = false;
let matchingRecorded = false;
let orderingRecorded = false;
let fillBlankRecorded = false;
let choiceRecorded = false;
let capstoneRecorded = false;

// Stage C 短文理解：點短文裡的字看中文意思——目前正在顯示提示泡泡的那個字的 key
// （用「第幾個字」當 key，同一個字在短文裡出現多次時才不會互相搞混），沒有點任何字就是 null。
let activePassageWordKey: number | null = null;

// Stage C 短文理解：是否正在朗讀全文（播放/暫停按鈕的狀態），true 時按鈕顯示「暫停」，
// 唸完（onEnd）或使用者按暫停整段停止，都會把這個設回 false。
let isPassageReading = false;

// 收藏清單的排序方式：收藏時間（新到舊）／字母 A→Z／字母 Z→A。不用跨畫面/跨工作階段記住，
// 每次進入收藏清單畫面（goToFavorites()）都會重置成預設值 "recent"，做法比較單純。
type FavoritesSortMode = "recent" | "az" | "za";
let favoritesSortMode: FavoritesSortMode = "recent";

// 成就徽章頁面：說明文字改成滑鼠移到徽章上（:hover，CSS 處理）或點擊/點選（平板等
// 沒有滑鼠的裝置，:hover 不一定觸發）才彈出，不再一直顯示在徽章下方。這裡記著「點擊」
// 觸發、目前彈出說明文的是哪一個徽章代號（用 code 當 key，同一頁裡每個代號只出現一次，
// 不會像短文的字一樣重複，所以不需要像 activePassageWordKey 那樣用位置索引）。
let activeBadgeTooltipCode: string | null = null;

// 題型答完一輪時，如果新達成（或可累計次數的徽章又達成一次）了成就徽章，要跳出
// 「獲得新徽章」的 pop（跟使用者確認過：條件達成每一次都要跳，不是只有第一次；
// 使用者要自己按關閉，不會自動消失）。這裡存目前待顯示的徽章清單，同一輪如果
// 一次跨過好幾個門檻（例如同時跨過「完成題目數量」跟「遊戲題型精通」），
// 全部收在同一個陣列裡，一次跳同一個 pop 顯示，不會跳好幾次。
let pendingBadgeUnlocks: Badge[] = [];

// 挑戰紀錄頁：同一個主題的四種題型合併成一張卡片，預設收合只顯示精簡資訊，
// 點整張卡片才展開看四種題型各自的細節（跟使用者確認過：整張卡片都能點，
// 不用另外找一個小箭頭才能點）。這裡記著目前哪些主題（topic.fileKey）是展開的。
const expandedStatsTopics = new Set<string>();

// 累計遊玩時間（見 playTime.ts）：進入某一種題型畫面時記下「現在幾點」，
// 到那一輪答完（recordStageCompletion 觸發）的當下算出經過多久、加進累計總數，
// 然後把這個時間戳記重設成「現在」，這樣同一個畫面裡重玩下一輪也能繼續正確累加；
// 如果玩到一半離開、沒有答完，這段時間就不會被算進去（刻意的簡化）。
let stageStartedAt: number | null = null;

/** 在四個 recordStageCompletion() 呼叫點旁邊一起呼叫：把從 stageStartedAt 到現在
 * 經過的時間加進這個使用者的累計遊玩時間，然後把時間戳記重設成現在。 */
function recordElapsedPlayTime(): void {
  if (stageStartedAt !== null) {
    addPlayTime(activeProfile!.id, Date.now() - stageStartedAt);
    stageStartedAt = Date.now();
  }
}

// ---- 登入登出（本機端「誰在玩」，見 profile.ts）----
// 不是真的帳號系統：沒有密碼、沒有雲端，只是把不同使用者的名字記在 localStorage，
// 讓每個人的成效追蹤（progress.ts）分開存。開場如果瀏覽器記得上次登入的使用者，
// 就直接跳過選人畫面、記住他是誰；找不到（第一次使用、或曾經登出）才顯示選人畫面。
let activeProfile: Profile | null = null;

// 新增使用者表單裡「目前選到的頭像」跟「正在打的名字」——都只是畫面上的暫時狀態。
// 點頭像會觸發 render() 整個重畫（render() 每次都會 app!.innerHTML = "" 重建 DOM），
// 如果沒有另外記住使用者已經打到一半的名字，先打名字再選頭像時，輸入框就會被清空——
// 所以名字草稿也要跟頭像一樣提升成模組層級的狀態，重畫時把它塞回新的 <input> 裡。
let newProfileAvatarId: string = AVATARS[0].id;
let newProfileNameDraft: string = "";

// 「新增使用者」現在拆成三步，不是一次全部顯示：
//   hidden  → 只有「＋ 新增使用者」按鈕，頭像選單/名字欄位都還沒出現
//   form    → 按下去之後才出現頭像選單＋名字欄位，選頭像/打名字都只是暫存草稿
//   confirm → 填完按「下一步」後，先顯示一次「你選的是這個，確定嗎？」的確認畫面，
//             真的按下確定才會呼叫 createProfile()／登入，避免手滑選錯頭像或打錯名字
type AddProfileStep = "hidden" | "form" | "confirm";
let addProfileStep: AddProfileStep = "hidden";

const restoredProfileId = getActiveProfileId();
const restoredProfile = restoredProfileId ? getProfileById(restoredProfileId) : null;
if (restoredProfile) {
  activeProfile = restoredProfile;
}

let screen: Screen = activeProfile ? "topicSelect" : "profileSelect";

/** 離開短文理解畫面前的收尾：全文朗讀如果還在播就停掉，按鈕狀態也一併重置，
 * 不然使用者切到別的畫面聲音還會繼續唸、回來時按鈕又顯示錯的狀態。
 * 任何會把 screen 切離 "choice" 的導覽函式都要呼叫這個。 */
function stopPassageReadingIfAny(): void {
  stopSpeaking();
  isPassageReading = false;
}

/** 登入：記住這個使用者是目前登入的人，進去選主題畫面。 */
function goToProfile(profile: Profile): void {
  activeProfile = profile;
  setActiveProfileId(profile.id);
  screen = "topicSelect";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（登入後的首頁），蓋掉 render() 預設保留捲動位置的行為
}

/** 登出：忘記目前登入的使用者，回到選人畫面（不會刪除任何人的成效紀錄）。 */
function logout(): void {
  stopPassageReadingIfAny();
  activeProfile = null;
  setActiveProfileId(null);
  newProfileAvatarId = AVATARS[0].id; // 重置成預設頭像，避免帶著上一次選的頭像進到選人畫面
  newProfileNameDraft = "";
  addProfileStep = "hidden";
  screen = "profileSelect";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（登出後回到選人畫面）
}

function goToTopicSelect(): void {
  stopPassageReadingIfAny();
  screen = "topicSelect";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（回到首頁）
}

/** 切換主題：換掉 playableVocab／playableSentences／currentPassage，並把四種題型的
 * 遊戲實例、完成旗標都重置，避免不同主題的題目混在一起、或誤觸發成效重複記錄。
 * 回傳是否成功切換（內容不齊全就跳提示、回傳 false，呼叫端不用再往下處理畫面切換）——
 * 抽出來是因為「挑戰紀錄」頁想要「點按鈕直接跳進某個題型的作答畫面」（goToTopicStage()），
 * 需要跟原本「切主題→停在選單畫面」共用同一段載入/重置邏輯，只有最後要停在哪個畫面不同。 */
function activateTopic(topic: TopicConfig): boolean {
  const content = loadTopicContent(topic);
  if (!content) {
    window.alert(`「${topic.label}」目前的內容還沒有齊全，暫時無法練習，請選擇其他主題。`);
    return false;
  }
  currentTopic = topic;
  playableVocab = content.vocab;
  playableSentences = content.sentences;
  currentPassage = content.passage;

  flashcardGame = null;
  matchingGame = null;
  orderingGame = null;
  fillBlankGame = null;
  choiceGame = null;
  capstoneGame = null;
  flashcardsRecorded = false;
  matchingRecorded = false;
  orderingRecorded = false;
  fillBlankRecorded = false;
  choiceRecorded = false;
  capstoneRecorded = false;

  return true;
}

function goToTopic(topic: TopicConfig): void {
  if (!activateTopic(topic)) return;
  screen = "menu";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（這個主題的題型選單）
}

/** 挑戰紀錄頁「開始挑戰／再次挑戰」按鈕用：跳過「選單」畫面，直接切主題並進入
 * 指定的題型作答畫面（goToMatching／goToOrdering／goToFillBlank／goToChoice
 * 各自已經會設定 screen 並呼叫 render()，這裡不用重複呼叫）。 */
function goToTopicStage(topic: TopicConfig, stageKey: StageKeyForBadges): void {
  if (!activateTopic(topic)) return;
  if (stageKey === "flashcards") goToFlashcards();
  else if (stageKey === "matching") goToMatching();
  else if (stageKey === "ordering") goToOrdering();
  else if (stageKey === "fillBlank") goToFillBlank();
  else if (stageKey === "capstone") goToCapstone();
  else goToChoice();
}

function goToMenu(): void {
  stopPassageReadingIfAny();
  screen = "menu";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（題型選單）
}

function goToStats(): void {
  stopPassageReadingIfAny();
  screen = "stats";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（挑戰紀錄）
}

function goToBadges(): void {
  stopPassageReadingIfAny();
  activeBadgeTooltipCode = null;
  screen = "badges";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（成就徽章）
}

/** 單字總覽：主題內的入口（從題型選單點進去），不是 Stage——只是瀏覽這個主題全部
 * 單字＋收藏喜歡的字，沒有「完成度」的概念，所以不用比照 goToMatching() 那樣
 * 建立遊戲實例或記錄 stageStartedAt。 */
function goToVocabOverview(): void {
  stopPassageReadingIfAny();
  screen = "vocabOverview";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（單字總覽）
}

/** 收藏清單：全站導覽列的入口，列出這個使用者收藏過的所有單字，不分主題。 */
function goToFavorites(): void {
  stopPassageReadingIfAny();
  favoritesSortMode = "recent"; // 排序狀態不跨畫面記住，每次進入都重置成預設值
  screen = "favorites";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（收藏清單）
}

// 「修改名稱」小視窗的表單草稿——進入視窗時才從 activeProfile 帶入目前的值，
// 離開視窗（不管有沒有存）就丟掉，不會殘留上次編輯到一半的內容。頭像不用草稿，
// 「變更頭像」小視窗點哪張就直接存哪張，不需要另外一個「確定」步驟。
let profileDetailNameDraft = "";
let profileDetailJustSaved = false;

// 「變更頭像」「修改名稱」都改成跳出小視窗（pop）讓使用者操作，這個狀態記著
// 目前有沒有開著視窗、開的是哪一個——render() 每次都會照這個狀態決定要不要
// 在畫面最上面疊一層 modal-overlay。
type ProfileDetailModal = "none" | "avatar" | "name";
let profileDetailModal: ProfileDetailModal = "none";

function goToProfileDetail(): void {
  stopPassageReadingIfAny();
  profileDetailNameDraft = activeProfile!.name;
  profileDetailJustSaved = false;
  profileDetailModal = "none";
  screen = "profileDetail";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（個人檔案）
}

/** 「關於本站」：獨立頁面，功能列（NAV_ITEMS）的第 6 個常駐項目，說明文字＋版本號＋
 * 作者資訊都放這裡。跟其他 5 個功能列目的地一樣呼叫 appendShell()，是瀏覽性質的頁面，
 * 沒有「完成度」概念，不用建立遊戲實例或記錄任何 progress。 */
function goToAbout(): void {
  stopPassageReadingIfAny();
  screen = "about";
  render();
  window.scrollTo(0, 0); // 換到全新畫面（關於本站）
}

// 「字卡暖身」：插在 Stage A 之前，先看一小組（預設 3 張）字卡記憶單字，再接這一組的測驗
// （見 flashcardGame.ts 的說明）。onCardShown 接上 speakEnglish() 做「進入字卡自動唸一次
// 單字」；onQuizShown 接上「聽音題型自動播放語音」——使用者不用自己按播放鍵才聽得到，
// 畫面上另外保留的「播放語音」按鈕只是給想重聽的人用。
// FlashcardGame 的 constructor 自己會先跑一次第一張字卡的內部狀態，但那時候 callback 都還沒
// 接上（跟 goToMatching 等其他 goTo 函式一樣，callback 要等 new 完才能設定），所以這裡額外
// 手動呼叫一次，確保「一進畫面就唸出第一個單字」對第一張字卡也成立，不用等使用者做任何動作。
function goToFlashcards(): void {
  screen = "flashcards";
  flashcardGame = new FlashcardGame(playableVocab, 6, 3);
  flashcardGame.onChange = render;
  flashcardGame.onCardShown = (vocab) => speakEnglish(vocab.en);
  flashcardGame.onQuizShown = (question) => {
    if (question.listen_word) speakEnglish(question.listen_word);
  };
  flashcardGame.onCorrect = () => {
    playCorrectSound();
    recordQuestionAnswered(activeProfile!.id, "flashcards", true, CORRECT_STREAK_THRESHOLD);
  };
  flashcardGame.onWrong = () => {
    playWrongSound();
    recordQuestionAnswered(activeProfile!.id, "flashcards", false, CORRECT_STREAK_THRESHOLD);
  };
  flashcardsRecorded = false;
  stageStartedAt = Date.now();
  if (flashcardGame.phase === "card" && !flashcardGame.isRoundComplete) {
    speakEnglish(flashcardGame.currentVocab.en);
  }
  render();
  window.scrollTo(0, 0); // 換到全新畫面（字卡暖身）
}

function goToMatching(): void {
  screen = "matching";
  matchingGame = new MatchingGame(playableVocab, 6);
  matchingGame.onChange = render;
  matchingGame.onCorrect = () => {
    playCorrectSound();
    recordQuestionAnswered(activeProfile!.id, "matching", true, CORRECT_STREAK_THRESHOLD);
  };
  matchingGame.onWrong = () => {
    playWrongSound();
    recordQuestionAnswered(activeProfile!.id, "matching", false, CORRECT_STREAK_THRESHOLD);
  };
  matchingRecorded = false;
  stageStartedAt = Date.now();
  render();
  window.scrollTo(0, 0); // 換到全新畫面（配對題）
}

function goToOrdering(): void {
  screen = "ordering";
  orderingGame = new OrderingGame(playableSentences);
  orderingGame.onChange = render;
  orderingGame.onCorrect = () => {
    playCorrectSound();
    recordQuestionAnswered(activeProfile!.id, "ordering", true, CORRECT_STREAK_THRESHOLD);
    // 排對排完整句正確時，延遲 1 秒再唸出完整句子，等答對音效播完再開口，不會疊在一起。
    const sentence = orderingGame!.currentSentence.en;
    setTimeout(() => speakEnglish(sentence), 1000);
  };
  orderingGame.onWrong = () => {
    playWrongSound();
    recordQuestionAnswered(activeProfile!.id, "ordering", false, CORRECT_STREAK_THRESHOLD);
  };
  orderingRecorded = false;
  stageStartedAt = Date.now();
  render();
  window.scrollTo(0, 0); // 換到全新畫面（排序題）
}

function goToFillBlank(): void {
  screen = "fillBlank";
  fillBlankGame = new FillBlankGame(playableSentences, playableVocab);
  fillBlankGame.onChange = render;
  fillBlankGame.onCorrect = () => {
    playCorrectSound();
    recordQuestionAnswered(activeProfile!.id, "fillBlank", true, CORRECT_STREAK_THRESHOLD);
  };
  fillBlankGame.onWrong = () => {
    playWrongSound();
    recordQuestionAnswered(activeProfile!.id, "fillBlank", false, CORRECT_STREAK_THRESHOLD);
  };
  fillBlankRecorded = false;
  stageStartedAt = Date.now();
  render();
  window.scrollTo(0, 0); // 換到全新畫面（填空題）
}

function goToChoice(): void {
  screen = "choice";
  choiceGame = new ChoiceGame(currentPassage);
  choiceGame.onChange = render;
  choiceGame.onCorrect = () => {
    playCorrectSound();
    recordQuestionAnswered(activeProfile!.id, "choice", true, CORRECT_STREAK_THRESHOLD);
  };
  choiceGame.onWrong = () => {
    playWrongSound();
    recordQuestionAnswered(activeProfile!.id, "choice", false, CORRECT_STREAK_THRESHOLD);
  };
  choiceRecorded = false;
  stageStartedAt = Date.now();
  activePassageWordKey = null;
  isPassageReading = false;
  render();
  window.scrollTo(0, 0); // 換到全新畫面（短文理解題）
}

// Stage D「綜合關卡」：題目來源是 capstoneQuestions.ts 混合出來的清單，不是某一篇短文
// 自己的 questions[]，所以這裡另外組一個「假的」Passage 物件塞進 ChoiceGame——
// ChoiceGame 本身只讀 passage.id 跟 passage.questions，不會用到 text/sentence_ids/vocab_ids，
// 所以這幾個欄位隨便給合理的值就好，不影響作答邏輯。
function goToCapstone(): void {
  screen = "capstone";
  const capstoneQuestions = buildCapstoneQuestions(playableVocab, playableSentences, currentPassage);
  const syntheticPassage: Passage = {
    id: `capstone.${currentTopic!.fileKey}`,
    title: `${currentTopic!.label} — Stage D 綜合關卡`,
    topic: currentTopic!.fileKey,
    text: currentPassage.text,
    sentence_ids: [],
    vocab_ids: [],
    questions: capstoneQuestions,
    status: "published",
  };
  capstoneGame = new ChoiceGame(syntheticPassage);
  capstoneGame.onChange = render;
  capstoneGame.onCorrect = () => {
    playCorrectSound();
    recordQuestionAnswered(activeProfile!.id, "capstone", true, CORRECT_STREAK_THRESHOLD);
  };
  capstoneGame.onWrong = () => {
    playWrongSound();
    recordQuestionAnswered(activeProfile!.id, "capstone", false, CORRECT_STREAK_THRESHOLD);
  };
  capstoneRecorded = false;
  stageStartedAt = Date.now();
  activePassageWordKey = null;
  isPassageReading = false;
  render();
  window.scrollTo(0, 0); // 換到全新畫面（Stage D 綜合關卡）
}

function restartEverything(): void {
  orderingGame = null;
  fillBlankGame = null;
  choiceGame = null;
  orderingRecorded = false;
  fillBlankRecorded = false;
  choiceRecorded = false;
  goToMatching();
}

function restartFlashcards(): void {
  flashcardGame?.restart();
  flashcardsRecorded = false;
}

function restartMatching(): void {
  matchingGame?.restart();
  matchingRecorded = false;
}

function restartOrdering(): void {
  orderingGame?.restart();
  orderingRecorded = false;
}

function restartFillBlank(): void {
  fillBlankGame?.restart();
  fillBlankRecorded = false;
}

// ---- 共用小元件 ----

function cardButton(card: MatchCard, onClick: (vocabId: string) => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = `card card--${card.status}`;
  btn.textContent = card.text;
  btn.disabled = card.status === "correct";
  btn.addEventListener("click", () => onClick(card.vocabId));
  return btn;
}

/**
 * 字塊池裡的字塊：點擊會放到答案區最後面，也可以直接拖到答案區裡的任何位置
 * （拖曳只是額外的操作方式，點擊永遠都能用，方便觸控裝置或不想拖曳時使用）。
 */
function tokenButton(token: OrderingToken, onClick: (instanceId: string) => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "token";
  btn.textContent = token.text;
  btn.draggable = true;

  btn.addEventListener("click", () => {
    speakEnglish(token.text); // 點字塊池裡的字塊時唸出這個字，跟 Stage A 單字配對同一個概念
    onClick(token.instanceId);
  });

  btn.addEventListener("dragstart", (e) => {
    btn.classList.add("token--dragging");
    e.dataTransfer?.setData("text/plain", token.instanceId);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  });
  btn.addEventListener("dragend", () => {
    btn.classList.remove("token--dragging");
  });

  return btn;
}

/**
 * 答案區裡「已放置」的字塊：可以點擊送回字塊池，也可以當作拖放目標——
 * 不管拖過來的字塊原本在字塊池還是答案區的其他位置，放開後都會插到這個字塊的前面。
 */
function placedTokenButton(
  token: OrderingToken,
  index: number,
  game: OrderingGame
): HTMLButtonElement {
  const btn = document.createElement("button");
  const positionClass =
    game.feedback === "wrong"
      ? game.isPlacedCorrectAt(index)
        ? "token--correct-pos"
        : "token--wrong-pos"
      : "";
  btn.className = `token ${positionClass}`.trim();
  btn.textContent = token.text;
  btn.draggable = true;

  btn.addEventListener("click", () => game.returnToken(token.instanceId));

  btn.addEventListener("dragstart", (e) => {
    btn.classList.add("token--dragging");
    e.dataTransfer?.setData("text/plain", token.instanceId);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  });
  btn.addEventListener("dragend", () => {
    btn.classList.remove("token--dragging");
  });
  btn.addEventListener("dragenter", (e) => {
    e.preventDefault();
    btn.classList.add("token--drag-over");
  });
  btn.addEventListener("dragleave", () => {
    btn.classList.remove("token--drag-over");
  });
  btn.addEventListener("dragover", (e) => {
    e.preventDefault(); // 一定要擋掉，瀏覽器預設不允許 drop
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  });
  btn.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation(); // 避免事件冒泡到答案區容器，被當成「拖到最後面」重複處理一次
    btn.classList.remove("token--drag-over");
    const sourceId = e.dataTransfer?.getData("text/plain");
    if (!sourceId) return;
    const isFromPool = game.pool.some((t) => t.instanceId === sourceId);
    if (isFromPool) {
      game.insertFromPool(sourceId, token.instanceId);
    } else {
      game.reorderPlaced(sourceId, token.instanceId);
    }
  });

  return btn;
}

function optionButton(
  text: string,
  status: "idle" | "correct" | "wrong",
  onClick: () => void
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = `option option--${status}`;
  btn.textContent = text;
  btn.disabled = status === "correct";
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * 四種題型畫面（單字配對／句子排序／填空／短文理解）共用的題型橫幅——
 * 跟首頁／目錄頁用的 .brand-banner 是同一種「有底色的圓角橫幅」概念，但故意做成
 * 不同的樣式：高度矮很多、字也小很多（.brand-banner 的 h1 用 --text-h1，
 * 這裡用 --text-h3），內容只放「題型範圍當標題」＋進度文字，不放頭像／招呼語，
 * 一眼就能跟首頁/目錄頁的橫幅區分開來，同時清楚知道現在在哪個題型裡。
 */
function stageHeader(title: string, progressText: string): void {
  const header = document.createElement("header");
  header.className = "stage-banner";

  const textWrap = document.createElement("div");
  textWrap.className = "stage-banner-text";
  const heading = document.createElement("h1");
  heading.textContent = title;
  textWrap.appendChild(heading);
  const progress = document.createElement("p");
  progress.className = "progress";
  progress.textContent = progressText;
  textWrap.appendChild(progress);
  header.appendChild(textWrap);

  const actions = document.createElement("div");
  actions.className = "stage-banner-actions";

  // 慢速發音是「這台裝置」的全域開關（存在 localStorage，不分使用者），放在所有
  // 會播放語音的畫面共用的橫幅上，切一次全站都生效；appendShell() 的瀏覽性頁面
  // （首頁／個人檔案／成就徽章）本來就不播放語音，不需要這顆按鈕。
  const slowToggleBtn = document.createElement("button");
  slowToggleBtn.type = "button";
  slowToggleBtn.className = "slow-speech-toggle-btn" + (isSlowSpeechEnabled() ? " active" : "");
  slowToggleBtn.setAttribute("aria-pressed", String(isSlowSpeechEnabled()));
  slowToggleBtn.textContent = isSlowSpeechEnabled() ? "🐢 慢速中" : "🐢 慢速";
  slowToggleBtn.setAttribute("aria-label", "切換慢速發音");
  slowToggleBtn.addEventListener("click", () => {
    setSlowSpeechEnabled(!isSlowSpeechEnabled());
    render(); // 重新渲染目前畫面，讓按鈕文字／active 樣式立刻反映新狀態
  });
  actions.appendChild(slowToggleBtn);

  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← 返回選單";
  backBtn.addEventListener("click", goToMenu);
  actions.appendChild(backBtn);

  header.appendChild(actions);
  app!.appendChild(header);
}

// ---- 登入：選使用者（本機端「誰在玩」），或新增一個新的使用者 ----

// 首次進站提醒——Phase 3 要開放給不特定訪客使用，跟原本只給自己家小孩用的情境不一樣，
// 需要在登入前提醒幾件事（資料只存本機、沒有密碼保護等）。這個提醒要在「還沒有任何人
// 登入」的「誰在玩？」畫面出現，此時沒有 activeProfile，不能比照 slowSpeech 那樣依
// profileId 分開存——一樣用裝置層級（不分使用者）的 localStorage 旗標記住「這台裝置／
// 這個瀏覽器已經看過」。
const WELCOME_NOTICE_STORAGE_KEY = "englishForKids.settings.hasSeenWelcomeNotice.v1";

function hasSeenWelcomeNotice(): boolean {
  if (typeof window === "undefined") return true; // SSR/測試環境保守當作已看過，不要噴錯
  try {
    return window.localStorage.getItem(WELCOME_NOTICE_STORAGE_KEY) === "1";
  } catch {
    return true; // localStorage 被擋掉時，不要讓提醒擋住整個登入流程
  }
}

function markWelcomeNoticeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WELCOME_NOTICE_STORAGE_KEY, "1");
  } catch {
    // 忽略，跟其餘模組一致的容錯方式
  }
}

function renderProfileSelect(): void {
  appendBrandBanner();

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>誰在玩？</h1><p class="progress">先選一個使用者，每個人的學習紀錄會分開存在這台電腦裡</p>`;
  app!.appendChild(header);

  const profiles = listProfiles();

  if (profiles.length > 0) {
    // 刪除使用者的功能移到「個人檔案」頁（登入後才看得到），這裡只單純列出
    // 可以登入的使用者，不用再用 <div> 包一層「登入按鈕＋刪除按鈕」的兩個兄弟元素，
    // 直接把 profile-login-btn 當成清單項目，避免多一層外框（.menu-item）疊在上面。
    const menu = document.createElement("div");
    menu.className = "menu-list";
    for (const profile of profiles) {
      const loginBtn = document.createElement("button");
      loginBtn.className = "profile-login-btn";
      loginBtn.addEventListener("click", () => goToProfile(profile));

      const avatarImg = document.createElement("img");
      avatarImg.className = "profile-avatar-img";
      avatarImg.src = getAvatarById(profile.avatarId).url;
      avatarImg.alt = "";
      loginBtn.appendChild(avatarImg);

      const info = document.createElement("span");
      info.className = "profile-login-info";

      const nameSpan = document.createElement("span");
      nameSpan.className = "profile-login-name";
      nameSpan.textContent = profile.name;
      info.appendChild(nameSpan);

      // 目前沒有真的記錄「登入」這個動作的時間點，這裡借用「最近一次在任何主題/題型
      // 答完一輪」的時間（跟「個人檔案」頁的「上次遊玩」同一份資料）當作上次登入時間的近似值。
      const lastSeen = document.createElement("span");
      lastSeen.className = "profile-login-lastseen";
      const lastPlayedDate = getLastPlayedDate(profile.id);
      lastSeen.textContent = lastPlayedDate ? `上次登入：${formatDateTime(lastPlayedDate)}` : "尚未登入過";
      info.appendChild(lastSeen);

      loginBtn.appendChild(info);

      menu.appendChild(loginBtn);
    }
    app!.appendChild(menu);
  } else if (addProfileStep === "hidden") {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "目前還沒有任何使用者，先新增一個吧。";
    app!.appendChild(hint);
  }

  if (addProfileStep === "hidden") {
    const addBtn = document.createElement("button");
    addBtn.className = "primary-btn add-profile-trigger-btn";
    addBtn.textContent = "＋ 新增使用者";
    addBtn.addEventListener("click", () => {
      addProfileStep = "form";
      render();
    });
    app!.appendChild(addBtn);
  } else if (addProfileStep === "form") {
    renderAddProfileForm();
  } else if (addProfileStep === "confirm") {
    renderAddProfileConfirm();
  }

  // 首次進站（甚至還沒登入）就能看到本站的介紹＋插畫，不用特地點進「關於本站」才知道
  // 這是什麼——跟關於本站頁面（renderAbout()）的故事段落＋插畫是同一份文字／圖片，
  // Phase 3 要開放給不特定訪客，這裡刻意不重複「使用須知」跟版本資訊那些次要資訊，
  // 只放最核心的品牌介紹，避免登入前的畫面塞太多東西。
  const homeTagline = document.createElement("p");
  homeTagline.className = "about-text about-tagline";
  homeTagline.textContent = "English for Kids - 每天玩一點英語！";
  app!.appendChild(homeTagline);

  const homeStoryParagraphs = [
    "孩子還小的時候，我們用繪本和單字卡陪他一起學英語；上小學後，也開始讓他用 App 練習。這幾年陸續讓孩子試過三、四款英語學習 App，各有特色，孩子也確實學到不少東西。",
    "不過用久了發現，這些 App 大多不是設計給學齡前的幼兒，就是偏向成人自學，內容跟小學生的生活情境有點距離，孩子沒辦法完全對應到學校教的東西。",
    "所以我決定自己動手做一個更適合小學階段的英語學習平台，讓孩子每天玩一點英語，內容也能隨時依照他的程度調整。目前我的孩子讀小學三年級，平台內容也以小學階段的單字和文法為主。如果你家的孩子也有類似需求，歡迎多加利用！",
  ];
  for (const text of homeStoryParagraphs) {
    const p = document.createElement("p");
    p.className = "about-text";
    p.textContent = text;
    app!.appendChild(p);
  }

  const homeBannerImg = document.createElement("img");
  homeBannerImg.className = "about-banner-img";
  homeBannerImg.src = aboutBannerUrl;
  homeBannerImg.alt = "";
  app!.appendChild(homeBannerImg);

  // 疊在畫面最上層——跟「獲得新徽章」pop 一樣，只要條件成立就在 render() 重畫時附加。
  if (!hasSeenWelcomeNotice()) {
    appendWelcomeNoticeModal();
  }
}

/** 第二步：按下「＋ 新增使用者」之後才出現的頭像選單＋名字欄位。
 * 版面由上到下：提示文字 → 大張預覽頭像（預設第一張，下面選單點哪張就即時換成哪張）
 * → 名字輸入欄位 → 頭像選單（放最下面）。 */
function renderAddProfileForm(): void {
  const title = document.createElement("p");
  title.className = "hint";
  title.textContent = "新增使用者：先選一張頭像，再輸入名字";
  app!.appendChild(title);

  // 大張預覽頭像：預設顯示第一張（newProfileAvatarId 的初始值），
  // 下面選單點哪張，這裡就即時換成那一張。
  const previewAvatar = getAvatarById(newProfileAvatarId);
  const preview = document.createElement("img");
  preview.className = "add-profile-avatar-preview";
  preview.src = previewAvatar.url;
  preview.alt = previewAvatar.label;
  app!.appendChild(preview);

  const form = document.createElement("form");
  form.className = "add-profile-form";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "輸入名字，例如：小美";
  nameInput.maxLength = 20;
  nameInput.value = newProfileNameDraft; // 選頭像會整頁重畫，把打到一半的名字塞回來
  nameInput.addEventListener("input", () => {
    newProfileNameDraft = nameInput.value;
  });
  form.appendChild(nameInput);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "secondary-btn";
  cancelBtn.textContent = "取消";
  cancelBtn.addEventListener("click", () => {
    addProfileStep = "hidden";
    newProfileAvatarId = AVATARS[0].id;
    newProfileNameDraft = "";
    render();
  });
  form.appendChild(cancelBtn);

  const nextBtn = document.createElement("button");
  nextBtn.type = "submit";
  nextBtn.className = "primary-btn";
  nextBtn.textContent = "下一步 →";
  form.appendChild(nextBtn);

  // 這裡先只檢查名字非空、進到確認畫面；真正呼叫 createProfile() 是在確認畫面
  // 按下最終確定按鈕才會做，讓「選頭像/打名字」跟「真的送出並登入」分成兩個動作。
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (nameInput.value.trim().length === 0) {
      window.alert("名字不能是空的，請輸入名字。");
      return;
    }
    addProfileStep = "confirm";
    render();
  });

  app!.appendChild(form);

  // 頭像選單放在最下面：點任何一張會更新上面的大預覽圖，也會換掉這裡的「已選取」外框。
  const avatarPicker = document.createElement("div");
  avatarPicker.className = "avatar-picker";
  for (const avatar of AVATARS) {
    const avatarBtn = document.createElement("button");
    avatarBtn.type = "button";
    avatarBtn.className = `avatar-option${avatar.id === newProfileAvatarId ? " avatar-option--selected" : ""}`;
    avatarBtn.title = avatar.label;

    const img = document.createElement("img");
    img.src = avatar.url;
    img.alt = avatar.label;
    avatarBtn.appendChild(img);

    avatarBtn.addEventListener("click", () => {
      newProfileAvatarId = avatar.id;
      render(); // 重畫才能讓剛選的頭像顯示「已選取」的外框，同時換掉上面的大預覽圖
    });
    avatarPicker.appendChild(avatarBtn);
  }
  app!.appendChild(avatarPicker);
}

/** 第三步：選好頭像＋名字後的最終確認畫面，按下確定才會真的新增使用者並登入。 */
function renderAddProfileConfirm(): void {
  const avatar = getAvatarById(newProfileAvatarId);

  const card = document.createElement("div");
  card.className = "profile-confirm-card";

  const img = document.createElement("img");
  img.className = "profile-confirm-avatar";
  img.src = avatar.url;
  img.alt = "";
  card.appendChild(img);

  const name = document.createElement("p");
  name.className = "profile-confirm-name";
  name.textContent = newProfileNameDraft.trim();
  card.appendChild(name);

  const question = document.createElement("p");
  question.className = "hint";
  question.textContent = "確定要用這個頭像和名字開始學習嗎？";
  card.appendChild(question);

  app!.appendChild(card);

  const actions = document.createElement("div");
  actions.className = "game-footer";

  const backBtn = document.createElement("button");
  backBtn.className = "secondary-btn";
  backBtn.textContent = "◀ 重新選擇";
  backBtn.addEventListener("click", () => {
    addProfileStep = "form";
    render();
  });
  actions.appendChild(backBtn);

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "primary-btn";
  confirmBtn.textContent = "✅ 確定，開始使用";
  confirmBtn.addEventListener("click", () => {
    try {
      const profile = createProfile(newProfileNameDraft, newProfileAvatarId);
      addProfileStep = "hidden";
      newProfileAvatarId = AVATARS[0].id;
      newProfileNameDraft = "";
      goToProfile(profile);
    } catch {
      // 理論上不會發生——上一步已經檢查過名字非空，這裡只是保險。
      window.alert("名字不能是空的，請回上一步重新輸入。");
      addProfileStep = "form";
      render();
    }
  });
  actions.appendChild(confirmBtn);

  app!.appendChild(actions);
}

// ---- 選擇主題：先選一個主題，才知道要玩哪一份 vocab/sentences/passage ----

/** 統計某個主題四種題型裡，有幾種已經挑戰過（timesCompleted > 0），當作選主題畫面上的小提示。 */
const ALL_STAGE_KEYS: StageKey[] = ["flashcards", "matching", "ordering", "fillBlank", "choice", "capstone"];

function countChallengedStages(profileId: string, fileKey: string): number {
  return ALL_STAGE_KEYS.filter((k) => getStageProgress(profileId, fileKey, k) !== null).length;
}

// ---- 全站品牌橫幅＋功能列（v2「每天玩一點」改版共用外殼） ----

type NavKey = "home" | "stats" | "badges" | "favorites" | "profile" | "about";

interface NavItemConfig {
  key: NavKey;
  icon: string;
  label: string;
  onSelect: () => void;
}

// 功能列圖示改用單色線條 SVG（stroke="currentColor"），不用彩色 emoji——
// 顏色跟著 .nav-item 本身的文字顏色走，未選取／滑過／選取中（.active）三種狀態
// 靠 CSS 換文字顏色就會自動連圖示一起換色，不用另外幫圖示寫三套顏色規則，
// 也讓「滑過」（背景淺藍、圖示維持原色）跟「選取中」（背景深藍、圖示變白）
// 兩種狀態的圖示看起來明顯不同。
const NAV_ICON_VIEWBOX = `viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
const NAV_ICONS = {
  home: `<svg ${NAV_ICON_VIEWBOX}><path d="M3 9.5 12 3l9 6.5"/><path d="M5 9v10a1 1 0 0 0 1 1h5v-6h2v6h5a1 1 0 0 0 1-1V9"/></svg>`,
  stats: `<svg ${NAV_ICON_VIEWBOX}><line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="10"/></svg>`,
  badges: `<svg ${NAV_ICON_VIEWBOX}><circle cx="12" cy="8" r="6"/><polyline points="8.2 13.5 7 22 12 19 17 22 15.8 13.5"/></svg>`,
  favorites: `<svg ${NAV_ICON_VIEWBOX}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  profile: `<svg ${NAV_ICON_VIEWBOX}><circle cx="12" cy="7.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>`,
  about: `<svg ${NAV_ICON_VIEWBOX}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="7.5" x2="12" y2="7.5"/></svg>`,
  logout: `<svg ${NAV_ICON_VIEWBOX}><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3"/><polyline points="15 17 20 12 15 7"/><line x1="20" y1="12" x2="9" y2="12"/></svg>`,
};

const NAV_ITEMS: NavItemConfig[] = [
  { key: "home", icon: NAV_ICONS.home, label: "首頁", onSelect: goToTopicSelect },
  { key: "stats", icon: NAV_ICONS.stats, label: "挑戰紀錄", onSelect: goToStats },
  { key: "badges", icon: NAV_ICONS.badges, label: "成就徽章", onSelect: goToBadges },
  { key: "favorites", icon: NAV_ICONS.favorites, label: "收藏清單", onSelect: goToFavorites },
  { key: "profile", icon: NAV_ICONS.profile, label: "個人檔案", onSelect: goToProfileDetail },
  { key: "about", icon: NAV_ICONS.about, label: "關於本站", onSelect: goToAbout },
];

/**
 * 品牌橫幅：選使用者畫面（還沒登入、沒有 activeProfile）顯示平台名稱「每天玩一點」＋
 * Slogan「English for Kids」；已登入之後改成兩欄排列——左邊換成「Hi! {名字}，今天也來玩一點吧！」
 * 的個人化招呼語＋Slogan，右邊放使用者頭像，讓橫幅同時有品牌識別跟「這是誰在玩」的提示。
 * 只有已登入的畫面才有下面的功能列（因為功能列的目的地都需要 activeProfile 才能顯示），
 * 所以拆成 appendBrandBanner()（單獨橫幅）跟 appendShell()（橫幅＋功能列）兩個函式。
 */
function appendBrandBanner(): void {
  const banner = document.createElement("div");

  if (activeProfile) {
    banner.className = "brand-banner brand-banner--user";
    const avatarUrl = getAvatarById(activeProfile.avatarId).url;
    banner.innerHTML = `
      <div class="brand-banner-text">
        <p class="brand-subtitle">English for Kids</p>
        <h1>Hi! ${activeProfile.name}<br />今天也來玩一點英語吧！</h1>
      </div>
      <img class="brand-banner-avatar" src="${avatarUrl}" alt="" />
    `;
  } else {
    banner.className = "brand-banner";
    banner.innerHTML = `
      <p class="brand-subtitle">English for Kids</p>
      <h1>每天玩一點英語！</h1>
    `;
  }

  app!.appendChild(banner);
}

/**
 * 品牌橫幅＋功能列——選主題／挑戰紀錄／成就徽章／個人檔案 這四個已登入頁面共用的外殼。
 * 參考 assets/design-tokens/screen-preview-daily-play.html 的 .brand-banner／.function-nav，
 * 但因為整個 App 只操作單一 #app 容器（非滿版版面），這裡把外殼渲染成 #app 的最前面兩個子元素，
 * 而不是真的滿版鋪到畫面邊緣——這是刻意的簡化，不影響功能。
 */
/** 量測功能列（.function-nav）目前是否塞得下「圖示＋文字標籤」都顯示的版面：
 * 先拿掉 .function-nav--compact，讓文字標籤恢復顯示，量出這時候的實際內容寬度
 * （scrollWidth），跟可視寬度（clientWidth）比較——塞不下就切回 compact（只留
 * 圖示，文字移到 title 屬性），塞得下就維持顯示文字。
 *
 * 這裡刻意不用固定的 @media 螢幕寬度斷點，改用動態量測：先前用 640px 當斷點，
 * 但使用者截圖回報過，寬度介於 640px 斷點跟桌面版版面之間時（例如瀏覽器視窗
 * 沒開滿版、或內嵌在較窄的容器裡），文字標籤還是會被擠到跑版，卻沒被隱藏，
 * 因為那個寬度大於 640px、斷點沒有觸發。改成直接量測功能列自己的內容寬度夠不夠，
 * 不管寬度變窄的原因是什麼（真的縮小視窗、容器變窄、工具列擠壓可視區域……）都能
 * 正確反應，不用再為各種情境各自猜一個像素數字。 */
function updateNavCompactState(nav: HTMLElement): void {
  nav.classList.remove("function-nav--compact");
  const needsCompact = nav.scrollWidth > nav.clientWidth + 1; // +1 容許四捨五入誤差
  nav.classList.toggle("function-nav--compact", needsCompact);
}

function appendShell(activeNav: NavKey): void {
  appendBrandBanner();

  const nav = document.createElement("nav");
  nav.className = "function-nav";
  for (const item of NAV_ITEMS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-item" + (item.key === activeNav ? " active" : "");
    // title 屬性：塞不下時會靠 updateNavCompactState() 動態隱藏 .nav-item-label
    // 只留圖示，這裡補上 title 讓滑鼠移過去／長按時還是看得到文字說明，
    // 不會因為隱藏文字就完全失去「這顆是什麼」的線索。
    btn.title = item.label;
    btn.innerHTML = `<span class="nav-item-icon">${item.icon}</span><span class="nav-item-label">${item.label}</span>`;
    btn.addEventListener("click", item.onSelect);
    nav.appendChild(btn);
  }

  // 登出／切換玩家不是「畫面」，是一個離開目前使用者的動作，所以不跟著上面四個
  // 目的地一樣用 NavKey／active 高亮邏輯，用不同樣式跟它們區隔開來（原本這個按鈕
  // 放在「個人檔案」頁面的個人小卡上，改版後移到功能列，四個畫面都能直接登出）。
  const logoutBtn = document.createElement("button");
  logoutBtn.className = "nav-item nav-item--logout";
  logoutBtn.title = "登出";
  logoutBtn.innerHTML = `<span class="nav-item-icon">${NAV_ICONS.logout}</span><span class="nav-item-label">登出</span>`;
  logoutBtn.addEventListener("click", logout);
  nav.appendChild(logoutBtn);

  app!.appendChild(nav);

  // 掛上 DOM 之後才量得出真實寬度：先跑一次判斷目前塞不塞得下，再用
  // ResizeObserver 持續監看——不管是使用者拖動視窗變窄、還是容器本身尺寸
  // 改變，都會重新判斷一次，取代原本固定的 @media 斷點。
  updateNavCompactState(nav);
  const navResizeObserver = new ResizeObserver(() => updateNavCompactState(nav));
  navResizeObserver.observe(nav);
}

/** 首頁主題卡片用的小圖示＋底色，對應 assets/design-tokens/screen-preview-daily-play.html
 * 的 .topic-thumb／.thumb-*；找不到對應的新主題時，用一組通用預設值，之後加主題不用改這裡。 */
const TOPIC_THUMBS: Record<string, { emoji: string; className: string }> = {
  greetings: { emoji: "👋", className: "thumb-greetings" },
  pronouns: { emoji: "🙋‍♂️", className: "thumb-pronouns" },
  family: { emoji: "👨‍👩‍👧", className: "thumb-family" },
  people: { emoji: "👥", className: "thumb-people" },
  appearance: { emoji: "🧑", className: "thumb-appearance" },
  emotions: { emoji: "😊", className: "thumb-emotions" },
  personality_traits: { emoji: "🌟", className: "thumb-personality-traits" },
  parts_of_body: { emoji: "🖐️", className: "thumb-parts-of-body" },
  colors: { emoji: "🎨", className: "thumb-colors" },
  animals_insects: { emoji: "🐾", className: "thumb-animals" },
  food_drink: { emoji: "🍎", className: "thumb-food-drink" },
  clothing_accessories: { emoji: "👕", className: "thumb-clothing" },
  houses_apartments: { emoji: "🏠", className: "thumb-houses" },
  bathroom: { emoji: "🛁", className: "thumb-bathroom" },
  tableware: { emoji: "🍽️", className: "thumb-tableware" },
  transportation: { emoji: "🚌", className: "thumb-transportation" },
  school: { emoji: "🏫", className: "thumb-school" },
  numbers: { emoji: "🔢", className: "thumb-numbers" },
  science: { emoji: "🔬", className: "thumb-science" },
  advanced_pronouns: { emoji: "🙋", className: "thumb-advanced-pronouns" },
  wh_words_frequency: { emoji: "❓", className: "thumb-wh-words-frequency" },
  articles_determiners: { emoji: "🔖", className: "thumb-articles-determiners" },
  sentence_connectors: { emoji: "🧩", className: "thumb-sentence-connectors" },
  prepositions: { emoji: "📍", className: "thumb-prepositions" },
  other_nouns: { emoji: "🎁", className: "thumb-other-nouns" },
  other_verbs_1: { emoji: "🏃", className: "thumb-other-verbs-1" },
  other_verbs_2: { emoji: "🤝", className: "thumb-other-verbs-2" },
  other_adjectives_1: { emoji: "✨", className: "thumb-other-adjectives-1" },
  other_adjectives_2: { emoji: "🍬", className: "thumb-other-adjectives-2" },
  other_adverbs_responses: { emoji: "🐹", className: "thumb-other-adverbs-responses" },
  pe_sports: { emoji: "⚽", className: "thumb-pe-sports" },
  clubs_hobbies: { emoji: "🎵", className: "thumb-clubs-hobbies" },
  weather_nature: { emoji: "🌦️", className: "thumb-weather-nature" },
  geographical_terms: { emoji: "⛰️", className: "thumb-geographical-terms" },
  places_directions: { emoji: "🏙️", className: "thumb-places-directions" },
  occupations: { emoji: "👩‍⚕️", className: "thumb-occupations" },
  money: { emoji: "💰", className: "thumb-money" },
  health: { emoji: "🩺", className: "thumb-health" },
  forms_of_address: { emoji: "🙋", className: "thumb-forms-of-address" },
  time: { emoji: "⏰", className: "thumb-time" },
  calendar: { emoji: "📅", className: "thumb-calendar" },
  holidays_festivals: { emoji: "🎉", className: "thumb-holidays-festivals" },
  sizes_measurements: { emoji: "📏", className: "thumb-sizes-measurements" },
};
const DEFAULT_TOPIC_THUMB = { emoji: "📘", className: "thumb-default" };

/** 首頁主題卡片本身的 DOM——單元 0 專區跟單元一～六底下的主題格都共用同一份卡片長相，
 * 抽成共用函式，避免兩邊重複寫一樣的 innerHTML。 */
function buildTopicCard(summary: TopicSummary): HTMLButtonElement {
  const challenged = countChallengedStages(activeProfile!.id, summary.topic.fileKey);
  const thumb = TOPIC_THUMBS[summary.topic.fileKey] ?? DEFAULT_TOPIC_THUMB;
  const progressPercent = Math.round((challenged / ALL_STAGE_KEYS.length) * 100);

  const btn = document.createElement("button");
  btn.className = "topic-card";
  btn.innerHTML = `
    <div class="topic-thumb ${thumb.className}">${thumb.emoji}</div>
    <h3>${summary.topic.label}</h3>
    <p>${summary.vocabCount} 個單字・${summary.sentenceCount} 句短句・短文「${summary.passageTitle}」</p>
    <div class="topic-progress-track"><div class="topic-progress-fill" style="width:${progressPercent}%"></div></div>
    <div class="topic-progress-label">${challenged} / ${ALL_STAGE_KEYS.length} 種題型已挑戰過</div>
  `;
  btn.addEventListener("click", () => goToTopic(summary.topic));
  return btn;
}

function renderTopicSelect(): void {
  appendShell("home");

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>選擇主題</h1><p class="progress">先選一個單元，再選主題，挑戰 Stage A-D</p>`;
  app!.appendChild(header);

  // 單元 0「教室常用語」是新手起手式，維持獨立區塊＋專屬提示文字，不強制要求
  // 先玩完才能玩其他主題——跟其他已上架主題一樣自由選（跟使用者確認過）。
  const unitZeroConfig = UNITS.find((unit) => unit.key === "unit0");
  if (unitZeroConfig) {
    const unitZeroTopics = availableTopics.filter((summary) =>
      unitZeroConfig.topicFileKeys.includes(summary.topic.fileKey)
    );
    if (unitZeroTopics.length > 0) {
      const unitZeroSection = document.createElement("section");
      unitZeroSection.className = "unit-section unit-zero-section";

      const unitZeroTitle = document.createElement("h2");
      unitZeroTitle.className = "unit-title";
      unitZeroTitle.textContent = "🚀 新手起手式";
      unitZeroSection.appendChild(unitZeroTitle);

      const unitZeroHint = document.createElement("p");
      unitZeroHint.className = "unit-zero-hint";
      unitZeroHint.textContent = "推薦新朋友從這裡開始暖身，不過也可以跳過、直接挑其他單元的主題玩。";
      unitZeroSection.appendChild(unitZeroHint);

      const unitZeroGrid = document.createElement("div");
      unitZeroGrid.className = "topic-grid";
      for (const summary of unitZeroTopics) {
        unitZeroGrid.appendChild(buildTopicCard(summary));
      }
      unitZeroSection.appendChild(unitZeroGrid);

      app!.appendChild(unitZeroSection);
    }
  }

  // 首頁依單元一～六分組呈現（docs/content-plan.md 3.1 節），每個單元底下
  // 只顯示「目前已經有內容」的主題卡片；單元規劃的主題還沒做出內容的話，
  // 這個單元暫時只顯示「敬請期待」，不會出現空白或壞掉的卡片。
  for (const unit of UNITS) {
    if (unit.key === "unit0") continue; // 已經在上面獨立渲染過了
    const topicsInUnit = availableTopics.filter((summary) => unit.topicFileKeys.includes(summary.topic.fileKey));

    const unitSection = document.createElement("section");
    unitSection.className = "unit-section";

    const unitTitle = document.createElement("h2");
    unitTitle.className = "unit-title";
    unitTitle.textContent = unit.label;
    unitSection.appendChild(unitTitle);

    if (topicsInUnit.length === 0) {
      const comingSoon = document.createElement("p");
      comingSoon.className = "unit-coming-soon";
      comingSoon.textContent = "敬請期待，這個單元的主題內容還在製作中。";
      unitSection.appendChild(comingSoon);
      app!.appendChild(unitSection);
      continue;
    }

    const grid = document.createElement("div");
    grid.className = "topic-grid";
    for (const summary of topicsInUnit) {
      grid.appendChild(buildTopicCard(summary));
    }
    unitSection.appendChild(grid);
    app!.appendChild(unitSection);
  }
}

// ---- 選單：四種題型的入口，方便直接跳過去確認，不用照順序破關 ----

interface MenuItem {
  label: string;
  description: string;
  /** 沒有這個欄位代表不是 Stage（例如「單字總覽」只是瀏覽，沒有「完成度」的概念），
   * 畫面上就不會顯示 formatProgressBadge() 那一行「已完成 N 次」的成效摘要。 */
  stageKey?: StageKey;
  onSelect: () => void;
}

/** 把存在 localStorage 的成效資料，轉成選單上一行小字的顯示文字 */
function formatProgressBadge(progress: StageProgress | null): string {
  if (!progress) return "尚未挑戰過";
  const lastPlayed = new Date(progress.lastPlayedAt);
  const dateLabel = Number.isNaN(lastPlayed.getTime())
    ? ""
    : `，最近一次 ${lastPlayed.getMonth() + 1}/${lastPlayed.getDate()}`;
  return `已完成 ${progress.timesCompleted} 次・最佳正確率 ${progress.bestAccuracy}%${dateLabel}`;
}

/** 題型選單卡片的「熟悉度分級」：尚未挑戰／練習中／表現不錯／完美，
 * 只套用在有 stageKey 的關卡項目（見 renderMenu() 的 MenuItem 型別註解），
 * 讓使用者一眼分辨每個題型目前的熟悉程度，不用逐字讀完成效文字。
 * 80% 門檻沿用專案舊版徽章邏輯就出現過的 accuracyTargets = [80, 90, 100] 分界，
 * 不另外發明新數字；100 分特別獨立一級（mastered），跟「還不錯但沒滿分」（good）區分開。 */
type ProgressTier = "not-started" | "practicing" | "good" | "mastered";
function progressTier(progress: StageProgress | null): ProgressTier {
  if (!progress) return "not-started";
  if (progress.bestAccuracy >= 100) return "mastered";
  if (progress.bestAccuracy >= 80) return "good";
  return "practicing";
}

/** 挑戰紀錄頁（renderStats()）外層 .stats-topic-card 的分級：跟 progressTier() 共用
 * 同一個 ProgressTier 型別，但判斷規則不一樣——外層卡片彙整的是跨全部題型
 * （STAGE_ROWS.length 種）的平均值，不是單一正確率，不能直接套用 progressTier()
 * 的門檻，不然會出現「只試 1 種題型就矇對 100%」跟「全部題型都完成且全對」
 * 被塗成同一種「完美」金色的怪現象，讓「完美」這個顏色失去意義。
 * 這裡改成「完成度優先、正確率次之」：只挑戰過部分題型（不管平均正確率多高）
 * 一律算 practicing，要全部題型都挑戰過才有資格拿到 good／mastered，這樣「完美／
 * 表現不錯」代表的是真的把這個主題整個做完，符合「挑戰紀錄」回顧整體投入程度的定位。 */
function topicProgressTier(topicPlayedCount: number, totalStages: number, averageAccuracy: number): ProgressTier {
  if (topicPlayedCount === 0) return "not-started";
  if (topicPlayedCount < totalStages) return "practicing";
  if (averageAccuracy >= 100) return "mastered";
  if (averageAccuracy >= 80) return "good";
  return "practicing";
}

function renderMenu(): void {
  appendShell("home");

  // 用 .game-header--with-back 讓標題文字跟返回按鈕用 flex 左右排開（不是
  // .game-header 預設的絕對定位），這樣按鈕文字比較長（「返回選擇主題」比
  // 其他題型畫面的「返回選單」多兩個字）也不會跟標題文字疊在一起。
  const header = document.createElement("header");
  header.className = "game-header game-header--with-back";

  const textWrap = document.createElement("div");
  const titleEl = document.createElement("h1");
  titleEl.textContent = `${currentTopic.label} — 題型選單`;
  textWrap.appendChild(titleEl);

  const progressP = document.createElement("p");
  progressP.className = "progress";
  progressP.textContent = "點下面任一種題型直接開始，不用照順序破關";
  textWrap.appendChild(progressP);
  header.appendChild(textWrap);

  // 沿用 stageHeader() 裡「← 返回選單」用的同一套 .back-btn 樣式（圓角外框按鈕，
  // 不是文字連結），跟題型畫面回上一層的視覺語言一致；文字改成「返回選擇主題」，
  // 因為這個按鈕實際上是回到選主題畫面，不是回到題型選單本身。
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "back-btn";
  backBtn.textContent = "← 返回選擇主題";
  backBtn.addEventListener("click", goToTopicSelect);
  header.appendChild(backBtn);

  app!.appendChild(header);

  const items: MenuItem[] = [
    {
      label: "📖 單字總覽",
      description: `瀏覽這個主題全部 ${playableVocab.length} 個單字，可以收藏喜歡的字、播放發音`,
      onSelect: goToVocabOverview,
    },
    {
      label: "字卡暖身　單字記憶",
      description: `${playableVocab.length} 個單字，字卡跟隨堂測驗交錯進行，排在 Stage A 之前`,
      stageKey: "flashcards",
      onSelect: goToFlashcards,
    },
    {
      label: "Stage A　單字配對",
      description: `${playableVocab.length} 個單字，英文／中文配對`,
      stageKey: "matching",
      onSelect: goToMatching,
    },
    {
      label: "Stage B-1　句子排序",
      description: `${playableSentences.length} 句短句，點字塊組成正確順序`,
      stageKey: "ordering",
      onSelect: goToOrdering,
    },
    {
      label: "Stage B-2　句子填空",
      description: `同一批短句，挖空一個字，選字作答`,
      stageKey: "fillBlank",
      onSelect: goToFillBlank,
    },
    {
      label: "Stage C　短文理解",
      description: `讀短文「${currentPassage.title}」，回答 ${currentPassage.questions.length} 題選擇題`,
      stageKey: "choice",
      onSelect: goToChoice,
    },
    {
      label: "Stage D　綜合關卡",
      description: `混合單字、短句、短文的最終測驗，過關就算這個主題單元完成`,
      stageKey: "capstone",
      onSelect: goToCapstone,
    },
  ];

  const menu = document.createElement("div");
  menu.className = "menu-list";
  for (const item of items) {
    // 「單字總覽」沒有 stageKey，是純瀏覽功能沒有正確率，不套用熟悉度分級
    // （tier 維持 null，btn 只掛預設的 .menu-item，不加 modifier class）。
    const progress = item.stageKey ? getStageProgress(activeProfile!.id, currentTopic.fileKey, item.stageKey) : null;
    const tier = item.stageKey ? progressTier(progress) : null;
    const progressText = item.stageKey
      ? (tier === "mastered" ? "⭐ " : "") + formatProgressBadge(progress)
      : `已收藏 ${playableVocab.filter((v) => isFavorite(activeProfile!.id, v.id)).length} / ${playableVocab.length} 個單字`;
    const btn = document.createElement("button");
    btn.className = "menu-item" + (tier ? ` menu-item--${tier}` : "");
    btn.innerHTML = `
      <span class="menu-item-label">${item.label}</span>
      <span class="menu-item-desc">${item.description}</span>
      <span class="menu-item-progress">${progressText}</span>
    `;
    btn.addEventListener("click", item.onSelect);
    menu.appendChild(btn);
  }
  app!.appendChild(menu);

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = "也可以照順序玩：每一關答完會自動出現「前往下一關」的按鈕。上方功能列可以直接切換「挑戰紀錄」或「首頁」換主題。";
  app!.appendChild(hint);
}

// ---- 單字收藏：星星按鈕＋「單字總覽」（主題內）／「收藏清單」（全站）兩個畫面 ----
// 三個收藏入口（單字總覽、Stage C 短文點字翻譯泡泡、字卡暖身）共用同一顆星星按鈕，
// 不用各畫面各寫一套；點擊收藏／取消收藏時借用 playCorrectSound() 當即時音效回饋
// （跟使用者確認過的加分建議：不用另外做新音效檔）。

/** 收藏星星按鈕：已收藏＝實心星星（fill=currentColor），未收藏＝空心星星，
 * 點擊呼叫 toggleFavorite() 並重新渲染。stopPropagation() 是因為這顆按鈕常常
 * 疊在別的可點擊元素裡面（例如 Stage C 短文的 .passage-word），不能讓點擊
 * 事件冒泡上去誤觸發外層自己的 click 監聽器（例如把翻譯泡泡關掉）。 */
function buildFavoriteStarButton(profileId: string, vocabId: string): HTMLButtonElement {
  const active = isFavorite(profileId, vocabId);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "favorite-star-btn" + (active ? " favorite-star-btn--active" : "");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="${active ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  btn.setAttribute("aria-label", active ? "取消收藏這個單字" : "收藏這個單字");
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    // 收藏跟取消收藏用不同音效：active 是「點擊前」的狀態，所以 active 為 false
    // 代表這一下是「收藏」動作（點擊後會變成已收藏），true 則是「取消收藏」。
    const willBecomeFavorite = !active;
    toggleFavorite(profileId, vocabId);
    if (willBecomeFavorite) {
      playFavoriteSound();
    } else {
      playUnfavoriteSound();
    }
    render();
  });
  return btn;
}

/** 例句區塊（英文＋專屬播放鍵＋中文翻譯）——字卡暖身跟單字總覽／收藏清單共用同一份
 * DOM 結構，避免兩處各寫一次幾乎一樣的內容。沿用 .flashcard-example 那組既有樣式。 */
function buildExampleSentenceBlock(example: { en: string; zh: string }): HTMLDivElement {
  const exampleBox = document.createElement("div");
  exampleBox.className = "flashcard-example";

  const exampleRow = document.createElement("div");
  exampleRow.className = "flashcard-example-row";
  const exampleEn = document.createElement("span");
  exampleEn.className = "flashcard-example-en";
  exampleEn.textContent = example.en;
  exampleRow.appendChild(exampleEn);
  const replayExampleBtn = document.createElement("button");
  replayExampleBtn.type = "button";
  replayExampleBtn.className = "flashcard-replay-btn";
  replayExampleBtn.textContent = "🔊";
  replayExampleBtn.setAttribute("aria-label", "重播例句發音");
  replayExampleBtn.addEventListener("click", () => speakEnglish(example.en));
  exampleRow.appendChild(replayExampleBtn);
  exampleBox.appendChild(exampleRow);

  const exampleZh = document.createElement("p");
  exampleZh.className = "flashcard-example-zh";
  exampleZh.textContent = example.zh;
  exampleBox.appendChild(exampleZh);

  return exampleBox;
}

/** 「單字總覽」跟「收藏清單」共用的一列單字：英文／詞性／中文＋播放發音按鈕＋收藏星星，
 * 加上可展開的例句面板（有 example_sentence 才會顯示展開鈕），
 * 抽成共用函式避免兩個畫面各寫一份幾乎一樣的 DOM 結構。 */
function buildVocabOverviewRow(vocab: Vocab): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "vocab-overview-row";

  const mainRow = document.createElement("div");
  mainRow.className = "vocab-overview-row-main";

  const info = document.createElement("div");
  info.className = "vocab-overview-info";
  info.innerHTML = `
    <span class="vocab-overview-en">${vocab.en}</span>
    <span class="vocab-overview-pos">${vocab.pos}</span>
    <span class="vocab-overview-zh">${vocab.zh}</span>
  `;
  mainRow.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "vocab-overview-actions";

  const playBtn = document.createElement("button");
  playBtn.type = "button";
  playBtn.className = "flashcard-replay-btn"; // 沿用字卡暖身既有的播放發音按鈕樣式
  playBtn.textContent = "🔊";
  playBtn.setAttribute("aria-label", `播放 ${vocab.en} 的發音`);
  playBtn.addEventListener("click", () => speakEnglish(vocab.en));
  actions.appendChild(playBtn);

  actions.appendChild(buildFavoriteStarButton(activeProfile!.id, vocab.id));

  mainRow.appendChild(actions);
  row.appendChild(mainRow);

  // example_sentence 是選填欄位；現在全站主題都已補齊，但仍維持防呆判斷，
  // 避免之後新增主題忘記補這個欄位時畫面出錯。
  if (vocab.example_sentence) {
    const example = vocab.example_sentence;
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "vocab-overview-example-toggle-btn";
    toggleBtn.textContent = "例句 ▾";
    toggleBtn.setAttribute("aria-label", `顯示 ${vocab.en} 的例句`);

    const examplePanel = buildExampleSentenceBlock(example);
    examplePanel.hidden = true;

    toggleBtn.addEventListener("click", () => {
      const willShow = examplePanel.hidden;
      examplePanel.hidden = !willShow;
      toggleBtn.textContent = willShow ? "例句 ▴" : "例句 ▾";
      toggleBtn.setAttribute("aria-label", willShow ? `隱藏 ${vocab.en} 的例句` : `顯示 ${vocab.en} 的例句`);
    });

    row.appendChild(toggleBtn);
    row.appendChild(examplePanel);
  }

  return row;
}

/** 單字總覽：主題內的入口，列出 getVocabByTopic() 的全部單字，純瀏覽用途，
 * 不是 Stage，不記錄任何成效資料。 */
function renderVocabOverview(): void {
  stageHeader(`${currentTopic.label} — 單字總覽`, `共 ${playableVocab.length} 個單字，點星星收藏喜歡的字`);

  const list = document.createElement("div");
  list.className = "vocab-overview-list";
  for (const vocab of playableVocab) {
    list.appendChild(buildVocabOverviewRow(vocab));
  }
  app!.appendChild(list);
}

/** 收藏清單：全站導覽列的入口，收藏的 vocab id 不分主題攤平存在 favorites.ts，
 * 這裡要反查回每個 id 對應的 Vocab 物件（英文／中文／詞性）才能顯示；
 * 沒有收藏任何單字時顯示清楚的空狀態提示，不是空白一片。 */
function renderFavorites(): void {
  appendShell("favorites");

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>收藏清單</h1><p class="progress">收藏過的單字，不分主題，全部集中在這裡</p>`;
  app!.appendChild(header);

  const favoriteIds = getFavoriteVocabIds(activeProfile!.id);
  if (favoriteIds.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "還沒有收藏任何單字，去「單字總覽」點幾個喜歡的字吧！";
    app!.appendChild(empty);
    return;
  }

  // 收藏的 vocab id 分散在各主題各自的 content/vocab/*.json 裡，建一張全主題攤平的
  // 「vocabId → Vocab」查詢表，避免每個收藏都重新掃一次全部主題的單字清單。
  const vocabById = new Map<string, Vocab>();
  for (const summary of availableTopics) {
    for (const vocab of getVocabByTopic(summary.topic.fileKey)) {
      vocabById.set(vocab.id, vocab);
    }
  }

  const sortControls = document.createElement("div");
  sortControls.className = "favorites-sort";
  const sortOptions: { mode: FavoritesSortMode; label: string }[] = [
    { mode: "recent", label: "收藏時間" },
    { mode: "az", label: "字母 A→Z" },
    { mode: "za", label: "字母 Z→A" },
  ];
  for (const option of sortOptions) {
    const btn = document.createElement("button");
    btn.className =
      "favorites-sort-btn" + (favoritesSortMode === option.mode ? " favorites-sort-btn--active" : "");
    btn.textContent = option.label;
    btn.addEventListener("click", () => {
      favoritesSortMode = option.mode;
      render();
    });
    sortControls.appendChild(btn);
  }
  app!.appendChild(sortControls);

  const favoriteVocabs = favoriteIds
    .map((id) => vocabById.get(id))
    .filter((v): v is Vocab => v !== undefined); // 理論上不會查不到（收藏的 id 一定來自某個主題的 vocab），保險起見過濾掉
  const sortedVocabs = sortFavoriteVocabs(favoriteVocabs, favoritesSortMode);

  const list = document.createElement("div");
  list.className = "vocab-overview-list";
  for (const vocab of sortedVocabs) {
    list.appendChild(buildVocabOverviewRow(vocab));
  }
  app!.appendChild(list);
}

/** 收藏清單排序：
 * - "az"／"za"：依 vocab.en 做字母排序（localeCompare 不分大小寫差異造成排序錯亂）。
 * - "recent"：getFavoriteVocabIds() 回傳的是 favorites.ts readFavoriteIds() 的 Set 插入順序
 *   （舊到新），直接反過來就是「最近收藏的排最前面」，不用另外存時間戳記。
 */
function sortFavoriteVocabs(vocabs: Vocab[], mode: FavoritesSortMode): Vocab[] {
  if (mode === "az") {
    return [...vocabs].sort((a, b) => a.en.localeCompare(b.en));
  }
  if (mode === "za") {
    return [...vocabs].sort((a, b) => b.en.localeCompare(a.en));
  }
  return [...vocabs].reverse();
}

// ---- 挑戰紀錄：跨「所有主題」彙整 progress.ts 存的資料，一次看全部進度
// （原本只看目前選的那個主題，v2 改版後跟功能列的其他頁面一樣是全站總覽）----

interface StatsRow {
  label: string;
  stageKey: StageKey;
}

const STAGE_ROWS: StatsRow[] = [
  { label: "字卡暖身　單字記憶", stageKey: "flashcards" },
  { label: "Stage A　單字配對", stageKey: "matching" },
  { label: "Stage B-1　句子排序", stageKey: "ordering" },
  { label: "Stage B-2　句子填空", stageKey: "fillBlank" },
  { label: "Stage C　短文理解", stageKey: "choice" },
  { label: "Stage D　綜合關卡", stageKey: "capstone" },
];

// 挑戰紀錄的主題卡：收合狀態右側的展開箭頭（純視覺提示，實際點擊範圍是整張卡片）。
const STATS_CHEVRON_ICON = `<svg ${NAV_ICON_VIEWBOX}><polyline points="6 9 12 15 18 9"/></svg>`;

function renderStats(): void {
  appendShell("stats");

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>挑戰紀錄</h1><p class="progress">看看目前累積了多少進度，資料存在這台電腦的瀏覽器裡</p>`;
  app!.appendChild(header);

  // 攤平成「每個主題 × 每種題型」的清單，只用來算最上面那排整體總覽數字
  // （3 個統計卡不變，底下的卡片清單改成每個主題一張，見下面的 for 迴圈）。
  const entries = availableTopics.flatMap((summary) =>
    STAGE_ROWS.map((row) => ({
      progress: getStageProgress(activeProfile!.id, summary.topic.fileKey, row.stageKey),
    }))
  );

  const playedCount = entries.filter((e) => e.progress !== null).length;
  const totalCompleted = entries.reduce((sum, e) => sum + (e.progress?.timesCompleted ?? 0), 0);
  const accuracies = entries
    .filter((e): e is { progress: StageProgress } => e.progress !== null)
    .map((e) => e.progress.bestAccuracy);
  const averageBestAccuracy =
    accuracies.length > 0 ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 0;

  const summaryEl = document.createElement("div");
  summaryEl.className = "stats-summary";
  summaryEl.innerHTML = `
    <div class="stats-summary-item">
      <span class="stats-summary-value">${playedCount} / ${entries.length}</span>
      <span class="stats-summary-label">已挑戰過的題型</span>
    </div>
    <div class="stats-summary-item">
      <span class="stats-summary-value">${totalCompleted}</span>
      <span class="stats-summary-label">累計完成次數</span>
    </div>
    <div class="stats-summary-item">
      <span class="stats-summary-value">${accuracies.length > 0 ? `${averageBestAccuracy}%` : "—"}</span>
      <span class="stats-summary-label">平均最佳正確率</span>
    </div>
  `;
  app!.appendChild(summaryEl);

  // 同一個主題的四種題型合併成一張卡片（原本是「每個主題 × 每種題型」攤平成 12 張卡）。
  // 預設收合只顯示精簡摘要，點整張卡片才展開看四種題型各自的細節。
  const list = document.createElement("div");
  list.className = "stats-list";

  for (const summary of availableTopics) {
    const topicFileKey = summary.topic.fileKey;
    const isExpanded = expandedStatsTopics.has(topicFileKey);

    const stageEntries = STAGE_ROWS.map((row) => ({
      row,
      progress: getStageProgress(activeProfile!.id, topicFileKey, row.stageKey),
    }));
    const topicPlayedCount = stageEntries.filter((e) => e.progress !== null).length;
    const topicAccuracies = stageEntries
      .filter((e): e is { row: StatsRow; progress: StageProgress } => e.progress !== null)
      .map((e) => e.progress.bestAccuracy);
    const topicAverageAccuracy =
      topicAccuracies.length > 0
        ? Math.round(topicAccuracies.reduce((a, b) => a + b, 0) / topicAccuracies.length)
        : 0;
    // 外層卡片的分級規則跟內層單一題型不一樣（見 topicProgressTier() 的說明），
    // "not-started" 沿用現有中性樣式，不加 modifier class（跟 .menu-item 那次不同，
    // 這裡不需要額外修正文字顏色——.stats-card-detail--muted 本來就是正確的灰色）。
    const topicTier = topicProgressTier(topicPlayedCount, STAGE_ROWS.length, topicAverageAccuracy);

    const card = document.createElement("div");
    card.className =
      "stats-topic-card" +
      (isExpanded ? " stats-topic-card--expanded" : "") +
      (topicTier !== "not-started" ? ` stats-topic-card--${topicTier}` : "");
    card.addEventListener("click", () => {
      if (isExpanded) expandedStatsTopics.delete(topicFileKey);
      else expandedStatsTopics.add(topicFileKey);
      render();
    });

    // ---- 收合狀態一定看得到的精簡摘要：主題名稱＋整體進度，不管展開與否都在最上面。----
    const summaryRow = document.createElement("div");
    summaryRow.className = "stats-topic-summary";

    const summaryText = document.createElement("div");
    summaryText.className = "stats-topic-summary-text";
    const titleEl = document.createElement("div");
    titleEl.className = "stats-topic-title";
    titleEl.textContent = summary.topic.label;
    summaryText.appendChild(titleEl);
    const briefEl = document.createElement("p");
    briefEl.className = "stats-card-detail stats-card-detail--muted";
    briefEl.textContent =
      topicPlayedCount > 0
        ? `${topicTier === "mastered" ? "⭐ " : ""}已挑戰 ${topicPlayedCount} / ${STAGE_ROWS.length} 種題型・平均正確率 ${topicAverageAccuracy}%`
        : "尚未挑戰過";
    summaryText.appendChild(briefEl);
    summaryRow.appendChild(summaryText);

    const chevron = document.createElement("span");
    chevron.className = "stats-topic-chevron";
    chevron.innerHTML = STATS_CHEVRON_ICON;
    chevron.setAttribute("aria-hidden", "true");
    summaryRow.appendChild(chevron);

    card.appendChild(summaryRow);

    // ---- 展開狀態才顯示的四種題型明細，每一種題型都有直接跳進作答畫面的按鈕。----
    if (isExpanded) {
      const stageList = document.createElement("div");
      stageList.className = "stats-stage-list";

      for (const { row, progress } of stageEntries) {
        // 內層題型列直接重用題型選單那套 progressTier()（跟 MenuItem 的資料形狀一樣，
        // 都是單一 StageProgress | null），套用完全相同的顏色對照——這裡沒有「not-started」
        // modifier class，跟外層卡片一樣，等同預設中性樣式，只有已經挑戰過的三級才加色條。
        const stageTier = progressTier(progress);
        const stageRow = document.createElement("div");
        stageRow.className = "stats-stage-row" + (progress ? ` stats-stage-row--${stageTier}` : "");

        const stageInfo = document.createElement("div");
        stageInfo.className = "stats-stage-info";
        const stageTitle = document.createElement("div");
        stageTitle.className = "stats-stage-title";
        stageTitle.textContent = row.label;
        stageInfo.appendChild(stageTitle);

        if (progress) {
          const lastPlayed = new Date(progress.lastPlayedAt);
          const dateLabel = Number.isNaN(lastPlayed.getTime())
            ? "—"
            : `${lastPlayed.getFullYear()}/${lastPlayed.getMonth() + 1}/${lastPlayed.getDate()}`;

          const bar = document.createElement("div");
          bar.className = "stats-bar-track";
          const fill = document.createElement("div");
          // 填色跟著分級走（practicing 藍／good 綠／mastered 金），跟色條顏色呼應，
          // 這條進度條本來就是既有元素，順便讓它有意義，不會增加畫面元素數量。
          fill.className = `stats-bar-fill stats-bar-fill--${stageTier}`;
          fill.style.width = `${progress.bestAccuracy}%`;
          bar.appendChild(fill);
          stageInfo.appendChild(bar);

          // 原本這裡分兩行分別顯示「最佳正確率／完成次數」跟「最近一次的答對/答錯明細」，
          // 兩行都在講正確率，讀起來有點重複；合併成一行精簡呈現，減少閱讀負擔。
          // mastered 時加 ⭐ 前綴，跟題型選單 .menu-item-progress 的做法一致。
          const detail = document.createElement("p");
          detail.className = "stats-card-detail stats-card-detail--muted";
          detail.textContent = `${stageTier === "mastered" ? "⭐ " : ""}最佳正確率 ${progress.bestAccuracy}%・完成 ${progress.timesCompleted} 次・最近一次 ${dateLabel}`;
          stageInfo.appendChild(detail);
        } else {
          const detail = document.createElement("p");
          detail.className = "stats-card-detail stats-card-detail--muted";
          detail.textContent = "尚未挑戰過";
          stageInfo.appendChild(detail);
        }
        stageRow.appendChild(stageInfo);

        const actionBtn = document.createElement("button");
        actionBtn.type = "button";
        actionBtn.className = "secondary-btn stats-stage-btn";
        actionBtn.textContent = progress ? "再次挑戰" : "開始挑戰";
        actionBtn.addEventListener("click", (event) => {
          event.stopPropagation(); // 不要連帶觸發外層卡片的展開/收合
          goToTopicStage(summary.topic, row.stageKey);
        });
        stageRow.appendChild(actionBtn);

        stageList.appendChild(stageRow);
      }

      card.appendChild(stageList);
    }

    list.appendChild(card);
  }

  app!.appendChild(list);
}

// ---- 個人檔案：登入者的頭像／名字兩欄小卡（含加入時間、上次遊玩時間、累計遊玩時間）
// ＋帳號設定（換頭像、改名字都改成跳出小視窗操作）。原本這裡還有一份「學習成就總覽」，
// v2 改版後移到獨立的成就徽章頁（renderBadges），這裡只留跟「使用者本人」有關的東西。----

/** 把 ISO 字串或 Date 轉成「YYYY/M/D HH:mm」的字樣；轉換失敗（資料壞掉）就回傳 "—"。 */
function formatDateTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 找出所有主題、所有題型裡最近一次玩過的時間；沒玩過就回傳 null。 */
function getLastPlayedDate(profileId: string): Date | null {
  const timestamps: number[] = [];
  for (const summary of availableTopics) {
    for (const row of STAGE_ROWS) {
      const progress = getStageProgress(profileId, summary.topic.fileKey, row.stageKey);
      if (progress) {
        const t = new Date(progress.lastPlayedAt).getTime();
        if (!Number.isNaN(t)) timestamps.push(t);
      }
    }
  }
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

interface ProfileStatCardConfig {
  icon: string;
  value: string;
  sub?: string;
  label: string;
}

/** 累計「目前已解鎖」的成就徽章數量——直接沿用 snapshotBadgeAchievements() 算每個徽章
 * 現在有沒有達成，不重新寫一套判斷邏輯（跟被 BADGES_BLOCKED_BY_MISSING_FEATURE 標記、
 * 功能還沒上架的徽章一樣，achieved 永遠是 false，不用另外排除）。 */
function countAchievedBadges(profileId: string): number {
  const snapshot = snapshotBadgeAchievements(profileId);
  let count = 0;
  for (const entry of snapshot.values()) {
    if (entry.achieved) count += 1;
  }
  return count;
}

/**
 * 「個人檔案」頁的學習成就宮格：六張數字卡片（已學單字量／連續學習天數／成就徽章／
 * 累計答對題數／累計學習天數／累計遊玩時間），圖示沿用成就徽章頁 CATEGORY_ICONS
 * 已經畫好的同一套單色線條風格，只新增 medal（徽章）跟 clock（遊玩時間）兩個新圖示。
 * 六個數字全部沿用既有的統計函式（computeVocabAggregate／snapshotBadgeAchievements／
 * playLog.ts／playTime.ts／badgeStats.ts 的 totalCorrectAnswered），沒有另外發明一套
 * 統計邏輯，也不會跟「挑戰紀錄」頁上方已有的「已挑戰過的題型／累計完成次數／平均正確率」
 * 三個數字重複（那三個是「題型」角度的統計，這裡是給小朋友看的「累積成就感」角度）。
 */
function renderProfileAchievementsGrid(profileId: string): HTMLElement {
  const vocabAgg = computeVocabAggregate(profileId);
  const achievedBadgeCount = countAchievedBadges(profileId);
  const stats = getBadgeStats(profileId);
  const streakDays = getPlayStreak(profileId);
  const totalDaysPlayed = getTotalDaysPlayed(profileId);
  const playTimeMs = getTotalPlayTimeMs(profileId);
  const totalPoints = computeLearningPoints(profileId, achievedBadgeCount);

  const medalIcon = `<svg ${CATEGORY_ICON_ATTRS}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
  const clockIcon = `<svg ${CATEGORY_ICON_ATTRS}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  const cards: ProfileStatCardConfig[] = [
    { icon: CATEGORY_ICONS.book, value: `${vocabAgg.vocabKnown}`, sub: `/ ${vocabAgg.totalVocabAvailable}`, label: "已學單字量" },
    { icon: CATEGORY_ICONS.flame, value: `${streakDays}`, sub: "天", label: "連續學習" },
    { icon: medalIcon, value: `${achievedBadgeCount}`, sub: `/ ${ALL_BADGES.length}`, label: "成就徽章" },
    { icon: CATEGORY_ICONS.edit, value: `${stats.totalCorrectAnswered}`, label: "累計答對題數" },
    { icon: CATEGORY_ICONS.calendar, value: `${totalDaysPlayed}`, sub: "天", label: "累計學習天數" },
    // 累計遊玩時間拆成最多兩行（第一行小時、第二行分鐘）顯示，避免「1 小時 17 分」
    // 這種字串在窄螢幕的小卡片裡被瀏覽器隨機斷行，見 playTime.ts 的 formatPlayTimeLines()。
    { icon: clockIcon, value: formatPlayTimeLines(playTimeMs).join("<br>"), label: "累計遊玩時間" },
  ];

  const section = document.createElement("div");
  section.className = "profile-stats-section";

  const title = document.createElement("h2");
  title.className = "section-heading";
  title.textContent = "學習成就";
  section.appendChild(title);

  const pointsHero = document.createElement("div");
  pointsHero.className = "learning-points-hero";
  pointsHero.innerHTML = `
    <span class="learning-points-value">${totalPoints}</span>
    <span class="learning-points-label">學習積分</span>
  `;
  section.appendChild(pointsHero);

  const grid = document.createElement("div");
  grid.className = "profile-stats-grid";
  for (const card of cards) {
    const cardEl = document.createElement("div");
    cardEl.className = "profile-stat-card";
    cardEl.innerHTML = `
      <span class="profile-stat-icon">${card.icon}</span>
      <span class="profile-stat-value">${card.value}${card.sub ? `<span class="profile-stat-sub">${card.sub}</span>` : ""}</span>
      <span class="profile-stat-label">${card.label}</span>
    `;
    grid.appendChild(cardEl);
  }
  section.appendChild(grid);
  return section;
}

function renderProfileDetail(): void {
  appendShell("profile");

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>個人檔案</h1><p class="progress">目前登入的小朋友</p>`;
  app!.appendChild(header);

  // ---- 個人小卡：左欄頭像（不加外框）、右欄名字＋時間資訊，兩欄排列
  // （登出／切換玩家已經改放到上面的功能列，這裡不用重複放）----
  const profileCard = document.createElement("div");
  profileCard.className = "profile-card";

  const avatarImg = document.createElement("img");
  avatarImg.className = "profile-card-avatar";
  avatarImg.src = getAvatarById(activeProfile!.avatarId).url;
  avatarImg.alt = "";
  profileCard.appendChild(avatarImg);

  const infoCol = document.createElement("div");
  infoCol.className = "profile-card-info";

  const nameHeading = document.createElement("h3");
  nameHeading.textContent = activeProfile!.name;
  infoCol.appendChild(nameHeading);

  const lastPlayedDate = getLastPlayedDate(activeProfile!.id);
  const metaList = document.createElement("dl");
  metaList.className = "profile-card-meta";
  metaList.innerHTML = `
    <dt>加入時間</dt><dd>${formatDateTime(activeProfile!.createdAt)}</dd>
    <dt>上次遊玩</dt><dd>${lastPlayedDate ? formatDateTime(lastPlayedDate) : "尚未開始遊玩"}</dd>
  `;
  infoCol.appendChild(metaList);

  profileCard.appendChild(infoCol);
  app!.appendChild(profileCard);

  // ---- 學習成就：六張數字卡片，讓量化數據（單字量／答對題數／徽章／連續天數／
  // 累計天數／遊玩時間）用明顯、圖示化的方式呈現，比純文字 dl 列表更有成就感。
  // 全部沿用既有的統計函式，沒有新增追蹤機制（除了 totalCorrectAnswered 這個
  // badgeStats.ts 新欄位）——累計遊玩時間也從上面的 dl 移到這裡，統一集中呈現。
  app!.appendChild(renderProfileAchievementsGrid(activeProfile!.id));

  // ---- 帳號設定：換頭像、改名字都改成跳出小視窗操作，這裡的按鈕只負責開視窗 ----
  const settingsTitle = document.createElement("h2");
  settingsTitle.className = "section-heading";
  settingsTitle.textContent = "帳號設定";
  app!.appendChild(settingsTitle);

  const settingsActions = document.createElement("div");
  settingsActions.className = "profile-settings-actions";

  const changeAvatarBtn = document.createElement("button");
  changeAvatarBtn.className = "secondary-btn";
  changeAvatarBtn.textContent = "🖼️ 變更頭像";
  changeAvatarBtn.addEventListener("click", () => {
    profileDetailJustSaved = false;
    profileDetailModal = "avatar";
    render();
  });
  settingsActions.appendChild(changeAvatarBtn);

  const changeNameBtn = document.createElement("button");
  changeNameBtn.className = "secondary-btn";
  changeNameBtn.textContent = "✏️ 修改名稱";
  changeNameBtn.addEventListener("click", () => {
    profileDetailNameDraft = activeProfile!.name;
    profileDetailJustSaved = false;
    profileDetailModal = "name";
    render();
  });
  settingsActions.appendChild(changeNameBtn);

  // ---- 危險操作：重置進度紀錄、刪除這個使用者——跟上面兩個按鈕排在同一列，
  // 用 #FF6B6B 警示色（.danger-btn）跟一般的帳號設定按鈕區隔開來，提醒這兩個是
  // 不可逆的動作（原本重置進度放在題型選單頁、刪除使用者放在選使用者畫面，
  // 改版後都收進「個人檔案」頁，刪除也只能刪自己目前登入的這個使用者）----
  const resetBtn = document.createElement("button");
  resetBtn.className = "secondary-btn danger-btn";
  resetBtn.textContent = "重置進度紀錄";
  resetBtn.addEventListener("click", () => {
    const confirmed = window.confirm(
      "確定要清除所有已存的進度紀錄嗎？（完成次數、最佳正確率、成就徽章都會歸零，這個動作無法復原）"
    );
    if (confirmed) {
      clearAllProgress(activeProfile!.id);
      clearBadgeStats(activeProfile!.id);
      render();
    }
  });
  settingsActions.appendChild(resetBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "secondary-btn danger-btn";
  deleteBtn.textContent = "刪除這個使用者";
  deleteBtn.addEventListener("click", () => {
    const confirmed = window.confirm(
      `確定要刪除使用者「${activeProfile!.name}」嗎？他的所有學習紀錄跟成就徽章都會一起消失，這個動作無法復原。`
    );
    if (confirmed) {
      deleteProfile(activeProfile!.id);
      logout();
    }
  });
  settingsActions.appendChild(deleteBtn);

  app!.appendChild(settingsActions);

  if (profileDetailJustSaved) {
    const savedMsg = document.createElement("p");
    savedMsg.className = "hint hint--correct";
    savedMsg.textContent = "✅ 已儲存";
    app!.appendChild(savedMsg);
  }

  // ---- 變更頭像／修改名稱的小視窗，放在最後面附加才會疊在整個畫面最上層 ----
  if (profileDetailModal === "avatar") {
    appendAvatarModal();
  } else if (profileDetailModal === "name") {
    appendNameModal();
  }
}

function closeProfileDetailModal(): void {
  profileDetailModal = "none";
  unlockBodyScroll();
  render();
}

/** 「關於本站」獨立頁面：功能列（NAV_ITEMS）常駐第 6 個項目，跟首頁／挑戰紀錄／成就徽章／
 * 收藏清單／個人檔案並列，隨時都能點進來，放跟 README.md 一致的簡短自我介紹＋版本號＋
 * 作者資訊，讓實際使用 App 的家長（不會去看原始碼裡的 README）也能看到「這是什麼平台、
 * 誰做的」。版面比照 renderFavorites() 這種功能列目的地的簡單標題列，不需要額外的
 * 返回按鈕——功能列本身就是導覽入口。 */
function renderAbout(): void {
  appendShell("about");

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>關於本站</h1>`;
  app!.appendChild(header);

  const aboutTagline = document.createElement("p");
  aboutTagline.className = "about-text about-tagline";
  aboutTagline.textContent = "English for Kids - 每天玩一點英語！";
  app!.appendChild(aboutTagline);

  const aboutText1 = document.createElement("p");
  aboutText1.className = "about-text";
  aboutText1.textContent =
    "孩子還小的時候，我們用繪本和單字卡陪他一起學英語；上小學後，也開始讓他用 App 練習。這幾年陸續讓孩子試過三、四款英語學習 App，各有特色，孩子也確實學到不少東西。";
  app!.appendChild(aboutText1);

  const aboutText2 = document.createElement("p");
  aboutText2.className = "about-text";
  aboutText2.textContent =
    "不過用久了發現，這些 App 大多不是設計給學齡前的幼兒，就是偏向成人自學，內容跟小學生的生活情境有點距離，孩子沒辦法完全對應到學校教的東西。";
  app!.appendChild(aboutText2);

  const aboutText3 = document.createElement("p");
  aboutText3.className = "about-text";
  aboutText3.textContent =
    "所以我決定自己動手做一個更適合小學階段的英語學習平台，讓孩子每天玩一點英語，內容也能隨時依照他的程度調整。目前我的孩子讀小學三年級，平台內容也以小學階段的單字和文法為主。如果你家的孩子也有類似需求，歡迎多加利用！";
  app!.appendChild(aboutText3);

  const aboutFeedback = document.createElement("p");
  aboutFeedback.className = "about-text";
  aboutFeedback.textContent = "有任何問題或建議，都歡迎跟我說。";
  app!.appendChild(aboutFeedback);

  // 常駐「使用須知」：跟首次進站的 appendWelcomeNoticeModal() 精簡版提醒互相呼應但
  // 不完全重複（這裡是完整版），放在故事段落之後、版本資訊之前，讓使用者忘記彈窗內容
  // 時，隨時能回來這裡查看完整說明。
  const usageSectionTitle = document.createElement("h2");
  usageSectionTitle.className = "section-heading";
  usageSectionTitle.textContent = "使用須知";
  app!.appendChild(usageSectionTitle);

  const usageParagraphs = [
    "所有的學習紀錄（單字進度、收藏、成就徽章）都只存在你目前使用的這個瀏覽器裡，沒有雲端同步、也沒有備份機制。如果你換一台電腦、換一個瀏覽器，或清除瀏覽器資料、使用無痕模式，這些紀錄都會消失，沒辦法救回來。",
    "這裡的「登入」只是選一個顯示名稱，不是帳號密碼機制。如果你在公用電腦（例如學校、圖書館）上使用，請留意同一台裝置上的其他人也能看到、切換，甚至刪除你建立的名字與紀錄。",
    "因為整個平台完全是純前端運作，沒有任何後端伺服器，不會收集、儲存或上傳你的任何個人資料——這也代表沒有辦法把資料同步到別台裝置，兩者是一體兩面。",
    "如果家裡有多個孩子一起用同一台裝置，建議幫每個孩子各自建立一個獨立的名字，這樣彼此的學習紀錄才不會混在一起。",
    "發音功能使用瀏覽器內建的語音合成，某些瀏覽器或裝置可能沒有內建可用的語音，或需要先允許網頁播放音效。",
    "這是我利用空閒時間獨立維護的小專案，內容仍在持續擴充與調整中，如果你發現任何問題或有建議，都歡迎透過下方信箱跟我說，但沒有辦法保證即時處理，請見諒。",
  ];
  for (const text of usageParagraphs) {
    const p = document.createElement("p");
    p.className = "about-text";
    p.textContent = text;
    app!.appendChild(p);
  }

  // 版本號直接讀 package.json 的 version 欄位（見檔案開頭的 import pkg），不在這裡
  // 另外寫死一份版本字串，避免以後升版了兩處數字不同步。
  const metaText = document.createElement("p");
  metaText.className = "about-meta";
  metaText.innerHTML = `English for Kids v${pkg.version} ｜ Vincent - 小禮 ｜ <a href="mailto:78vince@gmail.com">78vince@gmail.com</a>`;
  app!.appendChild(metaText);

  // 純裝飾用的底部插畫，隨 #app 容器寬度縮放（見 .about-banner-img），
  // alt="" 跟其他頭像圖一致，不承載內容資訊。
  const bannerImg = document.createElement("img");
  bannerImg.className = "about-banner-img";
  bannerImg.src = aboutBannerUrl;
  bannerImg.alt = "";
  app!.appendChild(bannerImg);
}

// 開啟任何 .modal-overlay（變更頭像／修改名稱／首次進站提醒／獲得新徽章……）期間，
// 鎖定背景捲動：一來避免使用者誤觸背景內容，二來這是解決 iOS Safari「網址列收合後
// position:fixed 遮罩沒有正確重新計算可視高度、底部露出縫隙」這類問題最常見的做法——
// 鎖定捲動能讓瀏覽器在彈窗開啟期間穩定可視區域尺寸。用一個計數器而不是布林值，
// 是為了保險起見支援「巢狀/連續開啟多個彈窗」的情境（目前程式應該不會真的疊兩層，
// 但用計數器不會因為疊層而不小心提早解鎖）。
let modalScrollLockCount = 0;
let savedScrollY = 0;

function lockBodyScroll(): void {
  if (modalScrollLockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
  }
  modalScrollLockCount++;
}

function unlockBodyScroll(): void {
  modalScrollLockCount = Math.max(0, modalScrollLockCount - 1);
  if (modalScrollLockCount === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo(0, savedScrollY);
  }
}

/**
 * 通用的小視窗外殼：半透明背景遮罩＋置中的卡片，點遮罩空白處或右上角的叉叉都能關閉
 * （點卡片本身不會關閉，靠 e.target === overlay 判斷有沒有點在遮罩上而不是卡片上）。
 * 回傳卡片本身的 DOM 節點，方便呼叫端把「變更頭像」或「修改名稱」的內容繼續往裡面加。
 * 開啟時鎖定背景捲動（見上方 lockBodyScroll()），跟 closeProfileDetailModal() 的
 * unlockBodyScroll() 成對——不管最後從叉叉、點遮罩、還是各自的確認鈕關閉，都會
 * 經過同一個 closeProfileDetailModal()，保證背景捲動一定會被正確解鎖。
 */
function appendModalShell(title: string): HTMLElement {
  lockBodyScroll();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeProfileDetailModal();
  });

  const card = document.createElement("div");
  card.className = "modal-card";

  const cardHeader = document.createElement("div");
  cardHeader.className = "modal-card-header";

  const titleEl = document.createElement("h3");
  titleEl.textContent = title;
  cardHeader.appendChild(titleEl);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close-btn";
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "關閉");
  closeBtn.addEventListener("click", closeProfileDetailModal);
  cardHeader.appendChild(closeBtn);

  card.appendChild(cardHeader);
  overlay.appendChild(card);
  app!.appendChild(overlay);
  return card;
}

/**
 * 首次進站提醒（精簡版四點條列＋提示可到「關於本站」看完整版）：跟「變更頭像」「修改
 * 名稱」共用同一套 appendModalShell()／closeProfileDetailModal() 外殼。因為
 * appendModalShell() 的右上角叉叉／點遮罩關閉都共用同一個 closeProfileDetailModal()，
 * 沒有專屬的關閉 callback 可以掛，所以在畫面「出現的當下」就直接標記已讀，而不是等
 * 使用者按下確認鈕才記錄——這樣不管最後用哪種方式關閉（確認鈕／叉叉／點遮罩），
 * 下次重新整理都不會再跳出來，不會有「用叉叉關掉但沒被記到」的落差。
 */
function appendWelcomeNoticeModal(): void {
  markWelcomeNoticeSeen();

  const card = appendModalShell("開始之前，先跟你說幾件事");

  const intro = document.createElement("p");
  intro.className = "modal-text";
  intro.textContent = "這是一個由家長獨立維護的免費小平台，開始玩之前有幾點想讓你知道：";
  card.appendChild(intro);

  const list = document.createElement("ul");
  list.className = "welcome-notice-list";
  const points = [
    "學習紀錄只存在這台裝置的瀏覽器裡，沒有雲端備份。換瀏覽器、換裝置，或清除瀏覽器資料，都會讓進度消失。",
    "這裡的「登入」只是選一個名字，沒有密碼保護。如果是公用電腦，同一台裝置上的其他人也能看到、切換或刪除你的紀錄。",
    "完全不會收集或上傳任何個人資料，所有東西都只存在你自己的瀏覽器裡。",
    "家裡有多個孩子共用同一台裝置的話，記得幫每個孩子各自建立一個名字。",
  ];
  for (const text of points) {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  }
  card.appendChild(list);

  const footer = document.createElement("p");
  footer.className = "modal-text modal-text--muted";
  footer.textContent = "之後想再看這些說明，可以到「關於本站」頁面查看。";
  card.appendChild(footer);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "primary-btn";
  closeBtn.textContent = "我知道了，開始玩！";
  closeBtn.addEventListener("click", closeProfileDetailModal);
  card.appendChild(closeBtn);
}

/** 「變更頭像」小視窗：跟新增使用者共用同一套頭像選單樣式，點哪張就直接存哪張並關窗，
 * 不用另外按一次「確定」——比修改名字更適合這樣做，因為不會有「打錯字」的中間狀態。 */
function appendAvatarModal(): void {
  const card = appendModalShell("變更頭像");
  card.classList.add("modal-card--wide"); // 頭像是 200px 的照片，卡片要夠寬才能兩欄排列

  const picker = document.createElement("div");
  picker.className = "avatar-picker";
  for (const avatar of AVATARS) {
    const avatarBtn = document.createElement("button");
    avatarBtn.type = "button";
    avatarBtn.className = `avatar-option${avatar.id === activeProfile!.avatarId ? " avatar-option--selected" : ""}`;
    avatarBtn.title = avatar.label;

    const img = document.createElement("img");
    img.src = avatar.url;
    img.alt = avatar.label;
    avatarBtn.appendChild(img);

    avatarBtn.addEventListener("click", () => {
      const updated = updateProfile(activeProfile!.id, { avatarId: avatar.id });
      if (updated) {
        activeProfile = updated;
        profileDetailJustSaved = true;
        profileDetailModal = "none";
        render();
      }
    });
    picker.appendChild(avatarBtn);
  }
  card.appendChild(picker);
}

/** 「修改名稱」小視窗：輸入新名字，按儲存才會真的更新並關窗（跟頭像不同，文字要打完
 * 才有意義，所以保留「輸入完再按儲存」這個中間步驟，不要一打字就存檔）。 */
function appendNameModal(): void {
  const card = appendModalShell("修改名稱");

  const form = document.createElement("form");
  form.className = "add-profile-form";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.maxLength = 20;
  nameInput.value = profileDetailNameDraft;
  nameInput.addEventListener("input", () => {
    profileDetailNameDraft = nameInput.value;
  });
  form.appendChild(nameInput);

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "primary-btn";
  saveBtn.textContent = "💾 儲存";
  form.appendChild(saveBtn);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const updated = updateProfile(activeProfile!.id, { name: nameInput.value });
      if (updated) {
        activeProfile = updated;
        profileDetailNameDraft = updated.name;
        profileDetailJustSaved = true;
        profileDetailModal = "none";
        render();
      }
    } catch {
      window.alert("名字不能是空的，請輸入名字。");
    }
  });

  card.appendChild(form);
  nameInput.focus(); // 這時候 form 已經透過上面的 appendChild 掛進真正的畫面了，可以直接取得焦點
}

// ---- Stage A：單字配對 ----

// ---- 「字卡暖身」：插在 Stage A 之前，字卡跟測驗題交錯出現 ----

function renderFlashcards(): void {
  const game = flashcardGame!;

  stageHeader(
    `${currentTopic.label} — 字卡暖身`,
    game.isRoundComplete
      ? `全部 ${game.totalVocabCount} 個單字都學會了　答對 ${game.correctCount}　答錯 ${game.wrongCount}`
      : `第 ${game.currentBatchNumber} / ${game.totalBatches} 批　已學會 ${game.masteredCount} / ${game.totalVocabCount} 個單字　答對 ${game.correctCount}　答錯 ${game.wrongCount}`
  );

  if (!game.isRoundComplete && game.phase === "card") {
    const vocab = game.currentVocab;

    const skipRow = document.createElement("label");
    skipRow.className = "flashcard-skip-row";
    skipRow.innerHTML = `<input type="checkbox" ${game.skipCards ? "checked" : ""} /> 已經很熟了？跳過字卡，直接測驗`;
    const skipCheckbox = skipRow.querySelector("input")!;
    skipCheckbox.addEventListener("change", () => {
      game.setSkipCards(skipCheckbox.checked);
    });
    app!.appendChild(skipRow);

    // 這一組（預設 3 張）字卡看到第幾張的小提示——跟使用者確認過，改成「一組看完幾張
    // 字卡，再接這一組的測驗」的節奏，不是原本一張字卡接一題測驗那麼細碎。
    const groupHint = document.createElement("p");
    groupHint.className = "flashcard-group-hint";
    groupHint.textContent = `這一組共 ${game.groupCardCount} 張字卡，第 ${game.cardPositionInGroup} 張`;
    app!.appendChild(groupHint);

    const card = document.createElement("div");
    card.className = "flashcard-card";

    const wordRow = document.createElement("div");
    wordRow.className = "flashcard-word-row";
    const wordEn = document.createElement("span");
    wordEn.className = "flashcard-word-en";
    wordEn.textContent = vocab.en;
    wordRow.appendChild(wordEn);
    // 🔊／⭐ 包成一個共用小容器，窄螢幕用 column-reverse 呈現時，這兩顆才會排在同一行
    // （而不是各自變成獨立一行），詳見 style.css 的 .flashcard-word-icons。
    const iconsWrap = document.createElement("div");
    iconsWrap.className = "flashcard-word-icons";
    const replayWordBtn = document.createElement("button");
    replayWordBtn.type = "button";
    replayWordBtn.className = "flashcard-replay-btn";
    replayWordBtn.textContent = "🔊";
    replayWordBtn.setAttribute("aria-label", "重播單字發音");
    replayWordBtn.addEventListener("click", () => speakEnglish(vocab.en));
    iconsWrap.appendChild(replayWordBtn);
    // 字卡也能收藏（跟單字總覽／Stage C 短文點字翻譯泡泡共用同一顆星星按鈕）。
    iconsWrap.appendChild(buildFavoriteStarButton(activeProfile!.id, vocab.id));
    wordRow.appendChild(iconsWrap);
    card.appendChild(wordRow);

    const wordZh = document.createElement("p");
    wordZh.className = "flashcard-word-zh";
    wordZh.textContent = vocab.zh;
    card.appendChild(wordZh);

    // example_sentence 是選填欄位（現在全站主題都已補齊，這裡仍保留防呆判斷，
    // 避免之後新增主題忘記補這個欄位時畫面出錯），沒有的話字卡只留單字本身。
    if (vocab.example_sentence) {
      card.appendChild(buildExampleSentenceBlock(vocab.example_sentence));
    }

    app!.appendChild(card);

    const footer = document.createElement("footer");
    footer.className = "game-footer";
    const isLastCardInGroup = game.cardPositionInGroup === game.groupCardCount;
    const nextBtn = document.createElement("button");
    nextBtn.className = "primary-btn";
    nextBtn.textContent = isLastCardInGroup ? "開始這一組的測驗 →" : "下一張字卡 →";
    nextBtn.addEventListener("click", () => game.advanceCard());
    footer.appendChild(nextBtn);
    app!.appendChild(footer);
    return;
  }

  if (!game.isRoundComplete && game.phase === "quiz" && game.quizQuestion) {
    const question = game.quizQuestion;

    if (question.listen_word) {
      const audioRow = document.createElement("div");
      audioRow.className = "flashcard-listen-row";
      const listenBtn = document.createElement("button");
      listenBtn.type = "button";
      listenBtn.className = "passage-read-aloud-btn";
      listenBtn.textContent = "▶ 播放語音";
      listenBtn.addEventListener("click", () => speakEnglish(question.listen_word!));
      audioRow.appendChild(listenBtn);
      app!.appendChild(audioRow);
    }

    const questionText = document.createElement("p");
    questionText.className = "question-text";
    questionText.textContent = question.question;
    app!.appendChild(questionText);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";
    for (const option of game.optionStates as FlashcardQuizOptionState[]) {
      optionsWrap.appendChild(
        optionButton(option.text, option.status, () => game.selectQuizOption(option.text))
      );
    }
    app!.appendChild(optionsWrap);

    // 不管答對還是答錯，都要把這一題對應的英文單字＋中文意思顯示出來（使用者反應：
    // 聽音選中文這種題型原本畫面上完全不會出現任何英文文字，只靠聲音作答，答完之後
    // 想知道自己聽到的到底是哪個字），旁邊再加一顆播放語音的按鈕，讓使用者（尤其是
    // 答錯的時候）可以直接聽一次正確單字的發音，不用回去字卡階段才聽得到。
    // 作答前（feedback === "building"）不顯示，不然會提前洩漏答案。
    if (game.feedback !== "building" && question.reveal_en && question.reveal_zh) {
      const revealEn = question.reveal_en;
      const revealRow = document.createElement("div");
      revealRow.className = "flashcard-quiz-reveal";
      const revealText = document.createElement("span");
      revealText.className = "flashcard-quiz-reveal-text";
      revealText.textContent = `👉 ${question.reveal_en}（${question.reveal_zh}）`;
      revealRow.appendChild(revealText);
      const revealReplayBtn = document.createElement("button");
      revealReplayBtn.type = "button";
      revealReplayBtn.className = "flashcard-replay-btn";
      revealReplayBtn.textContent = "🔊";
      revealReplayBtn.setAttribute("aria-label", "播放正確單字發音");
      revealReplayBtn.addEventListener("click", () => speakEnglish(revealEn));
      revealRow.appendChild(revealReplayBtn);
      app!.appendChild(revealRow);
    }

    const footer = document.createElement("footer");
    footer.className = "game-footer";
    if (game.feedback === "correct") {
      const msg = document.createElement("p");
      msg.className = "hint hint--correct";
      msg.textContent = "✅ 答對了！";
      footer.appendChild(msg);

      const nextBtn = document.createElement("button");
      nextBtn.className = "primary-btn";
      nextBtn.textContent = game.isFinalWordOfRound ? "查看結果 →" : "下一題 →";
      nextBtn.addEventListener("click", () => game.advanceToNextWord());
      footer.appendChild(nextBtn);
    } else if (game.feedback === "wrong") {
      const msg = document.createElement("p");
      msg.className = "hint hint--wrong";
      msg.textContent = "不對喔，這個字晚一點再考你一次...";
      footer.appendChild(msg);

      // 原本是 700ms 自動計時器換下一題，使用者反應停頓時間太短，來不及看清楚上面
      // reveal_en/reveal_zh 顯示的正確答案——改成跟答對一樣，使用者自己按按鈕才繼續。
      const continueBtn = document.createElement("button");
      continueBtn.className = "primary-btn";
      continueBtn.textContent = "繼續 →";
      continueBtn.addEventListener("click", () => game.continueAfterWrong());
      footer.appendChild(continueBtn);
    }
    app!.appendChild(footer);
    return;
  }

  // ---- 整個主題的字卡暖身都跑完了 ----
  if (!flashcardsRecorded) {
    finalizeRoundCompletion("flashcards", game.correctCount, game.wrongCount, false);
    flashcardsRecorded = true;
  }
  const total = game.correctCount + game.wrongCount;
  const accuracy = total > 0 ? Math.round((game.correctCount / total) * 100) : 0;

  const footer = document.createElement("footer");
  footer.className = "game-footer";
  footer.innerHTML = `
    <p class="done">
      🎉 字卡暖身全部 ${game.totalVocabCount} 個單字都複習完成了！<br />
      測驗正確率 ${accuracy}%（答對 ${game.correctCount} 次／答錯 ${game.wrongCount} 次）
    </p>
  `;
  const restartBtn = document.createElement("button");
  restartBtn.className = "secondary-btn";
  restartBtn.textContent = "重玩字卡暖身";
  restartBtn.addEventListener("click", restartFlashcards);
  footer.appendChild(restartBtn);

  const nextStageBtn = document.createElement("button");
  nextStageBtn.className = "primary-btn";
  nextStageBtn.textContent = "前往 Stage A：單字配對 →";
  nextStageBtn.addEventListener("click", goToMatching);
  footer.appendChild(nextStageBtn);

  app!.appendChild(footer);
}

function renderMatching(): void {
  const game = matchingGame!;

  stageHeader(
    `${currentTopic.label} — Stage A 單字配對`,
    `第 ${game.currentBatchNumber} / ${game.totalBatches} 組　答對 ${game.correctCount}　答錯 ${game.wrongCount}`
  );

  const board = document.createElement("div");
  board.className = "board";

  const englishCol = document.createElement("div");
  englishCol.className = "column";
  for (const card of game.englishCards) {
    const btn = cardButton(card, (id) => {
      speakEnglish(card.text); // 點英文單字時唸出發音，跟選字配對同一個動作
      game.selectEnglish(id);
    });
    btn.textContent = `🔊 ${card.text}`;
    englishCol.appendChild(btn);
  }

  const chineseCol = document.createElement("div");
  chineseCol.className = "column";
  for (const card of game.chineseCards) {
    chineseCol.appendChild(cardButton(card, (id) => game.selectChinese(id)));
  }

  board.appendChild(englishCol);
  board.appendChild(chineseCol);
  app!.appendChild(board);

  const footer = document.createElement("footer");
  footer.className = "game-footer";

  if (game.isRoundComplete) {
    if (!matchingRecorded) {
      finalizeRoundCompletion("matching", game.correctCount, game.wrongCount, false);
      matchingRecorded = true;
    }
    const total = game.correctCount + game.wrongCount;
    const accuracy = total > 0 ? Math.round((game.correctCount / total) * 100) : 0;
    footer.innerHTML = `
      <p class="done">
        🎉 Stage A 全部 ${game.totalVocabCount} 個單字都配對完成了！<br />
        正確率 ${accuracy}%（答對 ${game.correctCount} 次／答錯 ${game.wrongCount} 次）
      </p>
    `;
    const restartBtn = document.createElement("button");
    restartBtn.className = "secondary-btn";
    restartBtn.textContent = "重玩 Stage A";
    restartBtn.addEventListener("click", restartMatching);
    footer.appendChild(restartBtn);

    const nextStageBtn = document.createElement("button");
    nextStageBtn.className = "primary-btn";
    nextStageBtn.textContent = "前往 Stage B-1：句子排序 →";
    nextStageBtn.addEventListener("click", goToOrdering);
    footer.appendChild(nextStageBtn);
  } else if (game.isBatchComplete) {
    const nextBtn = document.createElement("button");
    nextBtn.className = "primary-btn";
    nextBtn.textContent = "下一組 →";
    nextBtn.addEventListener("click", () => game.advanceToNextBatch());
    footer.appendChild(nextBtn);
  } else {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "點一個英文單字，再點一個對應的中文意思。";
    footer.appendChild(hint);
  }

  app!.appendChild(footer);
}

// ---- Stage B-1：句子排序 ----

function renderOrdering(): void {
  const game = orderingGame!;

  stageHeader(
    `${currentTopic.label} — Stage B-1 句子排序`,
    `第 ${Math.min(game.currentSentenceNumber, game.totalSentences)} / ${game.totalSentences} 句　答對 ${game.correctCount}　答錯 ${game.wrongCount}`
  );

  if (!game.isRoundComplete) {
    // 題目文字（中文）直接放在標題/進度列下面，當作這一題要組出來的句子提示——
    // 不再加「中文提示：」這種標籤字樣，字級加大、顏色加深，看起來就是「題目本身」。
    const zhPrompt = document.createElement("p");
    zhPrompt.className = "question-prompt";
    zhPrompt.textContent = game.currentSentence.zh;
    app!.appendChild(zhPrompt);

    const answerArea = document.createElement("div");
    answerArea.className = `answer-area answer-area--${game.feedback}`;
    if (game.placed.length === 0) {
      const placeholder = document.createElement("span");
      placeholder.className = "answer-placeholder";
      placeholder.textContent = "點選或拖曳下面的字塊，依順序組成句子";
      answerArea.appendChild(placeholder);
    } else {
      game.placed.forEach((token, index) => {
        answerArea.appendChild(placedTokenButton(token, index, game));
      });
    }

    // 答案區容器本身也是拖放目標：拖到字塊跟字塊之間的空白處、或整個答案區還是空的時候，
    // 都當作「放到最後面」處理。子元素（placedTokenButton）的 drop 事件會先擋掉冒泡，
    // 所以拖到某個已放置字塊上面時，只有那個字塊的 drop 邏輯會執行，不會被這裡重複處理。
    answerArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });
    answerArea.addEventListener("drop", (e) => {
      e.preventDefault();
      const sourceId = e.dataTransfer?.getData("text/plain");
      if (!sourceId) return;
      const isFromPool = game.pool.some((t) => t.instanceId === sourceId);
      if (isFromPool) {
        game.insertFromPool(sourceId, null); // 插到最後面
      } else {
        game.reorderPlaced(sourceId, null); // 移到最後面
      }
    });

    app!.appendChild(answerArea);

    const pool = document.createElement("div");
    pool.className = "token-pool";
    for (const token of game.pool) {
      pool.appendChild(tokenButton(token, (id) => game.placeToken(id)));
    }
    app!.appendChild(pool);

    // 播放整句正確發音——句子本身沒有直接顯示英文全文（字塊都是打散的），
    // 讓孩子可以先「聽」出正確的句子順序，當作額外的聽力提示，而不是直接看到答案。
    const playBtn = document.createElement("button");
    playBtn.className = "secondary-btn play-btn";
    playBtn.textContent = "🔊 播放整句";
    playBtn.addEventListener("click", () => speakEnglish(game.currentSentence.en));
    app!.appendChild(playBtn);

    if (game.feedback === "wrong") {
      const wrongMsg = document.createElement("p");
      wrongMsg.className = "hint hint--wrong";
      wrongMsg.textContent = "順序還不對——紅色的字塊位置不對，綠色的位置是對的，點一下或拖曳調整看看。";
      app!.appendChild(wrongMsg);
    }

    if (game.canShowHint || game.canSkip) {
      const assistRow = document.createElement("div");
      assistRow.className = "assist-row";

      if (game.canShowHint) {
        const hintBtn = document.createElement("button");
        hintBtn.className = "secondary-btn";
        hintBtn.textContent = "💡 給我一點提示";
        hintBtn.addEventListener("click", () => game.useHint());
        assistRow.appendChild(hintBtn);
      }

      if (game.canSkip) {
        const skipBtn = document.createElement("button");
        skipBtn.className = "secondary-btn";
        skipBtn.textContent = "跳過這句 →";
        skipBtn.addEventListener("click", () => game.skipCurrentSentence());
        assistRow.appendChild(skipBtn);
      }

      app!.appendChild(assistRow);
    }
  }

  const footer = document.createElement("footer");
  footer.className = "game-footer";

  if (game.isRoundComplete) {
    if (!orderingRecorded) {
      finalizeRoundCompletion("ordering", game.correctCount, game.wrongCount, game.hintUsedThisRound);
      orderingRecorded = true;
    }
    const total = game.correctCount + game.wrongCount;
    const accuracy = total > 0 ? Math.round((game.correctCount / total) * 100) : 0;
    const skippedNote =
      game.skippedCount > 0 ? `，另外跳過了 ${game.skippedCount} 句` : "";
    footer.innerHTML = `
      <p class="done">
        🎉 Stage B-1 句子排序全部跑完了！<br />
        正確率 ${accuracy}%（答對 ${game.correctCount} 次／答錯 ${game.wrongCount} 次）${skippedNote}
      </p>
    `;
    const restartBtn = document.createElement("button");
    restartBtn.className = "secondary-btn";
    restartBtn.textContent = "重玩 Stage B-1";
    restartBtn.addEventListener("click", restartOrdering);
    footer.appendChild(restartBtn);

    const nextStageBtn = document.createElement("button");
    nextStageBtn.className = "primary-btn";
    nextStageBtn.textContent = "前往 Stage B-2：句子填空 →";
    nextStageBtn.addEventListener("click", goToFillBlank);
    footer.appendChild(nextStageBtn);
  } else if (game.feedback === "correct") {
    const msg = document.createElement("p");
    msg.className = "hint hint--correct";
    msg.textContent = "✅ 答對了！";
    footer.appendChild(msg);

    const isLastSentence = game.currentSentenceNumber === game.totalSentences;
    const nextBtn = document.createElement("button");
    nextBtn.className = "primary-btn";
    nextBtn.textContent = isLastSentence ? "查看結果 →" : "下一句 →";
    nextBtn.addEventListener("click", () => game.advanceToNextSentence());
    footer.appendChild(nextBtn);
  }

  app!.appendChild(footer);
}

// ---- Stage B-2：句子填空 ----

function renderFillBlank(): void {
  const game = fillBlankGame!;

  stageHeader(
    `${currentTopic.label} — Stage B-2 句子填空`,
    `第 ${Math.min(game.currentQuestionNumber, game.totalQuestions)} / ${game.totalQuestions} 題　答對 ${game.correctCount}　答錯 ${game.wrongCount}`
  );

  if (!game.isRoundComplete) {
    const sentenceLine = document.createElement("p");
    sentenceLine.className = "fill-blank-sentence";
    sentenceLine.innerHTML = game.displayTokens
      .map((t) => (t === null ? `<span class="blank">____</span>` : t))
      .join(" ");
    app!.appendChild(sentenceLine);

    const zhHint = document.createElement("p");
    zhHint.className = "hint";
    zhHint.textContent = `中文提示：${game.currentQuestion.sentence.zh}`;
    app!.appendChild(zhHint);

    // 播放整句正確發音——用完整原句（挖空前的版本），讓孩子先聽過整句應該長怎樣，
    // 跟 Stage B-1 的「播放整句」是同一個概念。
    const playBtn = document.createElement("button");
    playBtn.className = "secondary-btn play-btn";
    playBtn.textContent = "🔊 播放整句";
    playBtn.addEventListener("click", () => speakEnglish(game.currentQuestion.sentence.en));
    app!.appendChild(playBtn);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";
    for (const option of game.currentQuestion.options) {
      optionsWrap.appendChild(
        optionButton(option.text, option.status, () => {
          speakEnglish(option.text); // 點選項時也唸出這個字，跟 Stage A 單字配對同一個概念
          game.selectOption(option.vocabId);
        })
      );
    }
    app!.appendChild(optionsWrap);
  }

  const footer = document.createElement("footer");
  footer.className = "game-footer";

  if (game.isRoundComplete) {
    if (!fillBlankRecorded) {
      finalizeRoundCompletion("fillBlank", game.correctCount, game.wrongCount, false);
      fillBlankRecorded = true;
    }
    const total = game.correctCount + game.wrongCount;
    const accuracy = total > 0 ? Math.round((game.correctCount / total) * 100) : 0;
    footer.innerHTML = `
      <p class="done">
        🎉 Stage B-2 句子填空全部跑完了！<br />
        正確率 ${accuracy}%（答對 ${game.correctCount} 次／答錯 ${game.wrongCount} 次）
      </p>
    `;
    const restartBtn = document.createElement("button");
    restartBtn.className = "secondary-btn";
    restartBtn.textContent = "重玩 Stage B-2";
    restartBtn.addEventListener("click", restartFillBlank);
    footer.appendChild(restartBtn);

    const nextStageBtn = document.createElement("button");
    nextStageBtn.className = "primary-btn";
    nextStageBtn.textContent = "前往 Stage C：短文理解 →";
    nextStageBtn.addEventListener("click", goToChoice);
    footer.appendChild(nextStageBtn);
  } else if (game.feedback === "correct") {
    const msg = document.createElement("p");
    msg.className = "hint hint--correct";
    msg.textContent = "✅ 答對了！";
    footer.appendChild(msg);

    const isLastQuestion = game.currentQuestionNumber === game.totalQuestions;
    const nextBtn = document.createElement("button");
    nextBtn.className = "primary-btn";
    nextBtn.textContent = isLastQuestion ? "查看結果 →" : "下一題 →";
    nextBtn.addEventListener("click", () => game.advanceToNextQuestion());
    footer.appendChild(nextBtn);
  } else if (game.feedback === "wrong") {
    const msg = document.createElement("p");
    msg.className = "hint hint--wrong";
    msg.textContent = "不對喔，再想想看...";
    footer.appendChild(msg);
  }

  app!.appendChild(footer);
}

// ---- Stage C：短文理解（選擇題） ----

/**
 * 把短文文字拆成一個一個字（保留原本的空白、標點，拼回去要跟原文一模一樣），
 * 查得到中文意思的字（見 lookupPassageWordZh：先查跨主題 vocab，查不到再查這個主題的
 * 補充詞彙表 content/glossary/）就做成可以點的樣式，點一下彈出小泡泡顯示中文意思，
 * 再點一次（或點別的字）就換掉；查不到中文意思的字（像 is/a/and 這種基本文法字）維持普通文字。
 */
function buildInteractivePassage(text: string, topicFileKey: string): HTMLParagraphElement {
  const p = document.createElement("p");
  // 用「英文字母／撇號」跟「其他字元（空白、標點）」交錯切開，兩種 token 拼回去就是原文。
  const tokens = text.match(/[A-Za-z']+|[^A-Za-z']+/g) ?? [];

  tokens.forEach((token, index) => {
    const isWord = /^[A-Za-z']+$/.test(token);
    if (!isWord) {
      p.appendChild(document.createTextNode(token));
      return;
    }

    const lookup = lookupPassageWordZh(topicFileKey, token);
    if (!lookup) {
      p.appendChild(document.createTextNode(token));
      return;
    }

    const wordSpan = document.createElement("span");
    wordSpan.className = "passage-word" + (activePassageWordKey === index ? " passage-word--active" : "");
    wordSpan.textContent = token;
    wordSpan.addEventListener("click", () => {
      activePassageWordKey = activePassageWordKey === index ? null : index;
      render();
    });

    if (activePassageWordKey === index) {
      const tooltip = document.createElement("span");
      tooltip.className = "passage-word-tooltip";
      const tooltipText = document.createElement("span");
      tooltipText.textContent = lookup.zh;
      tooltip.appendChild(tooltipText);
      // 只有查得到真正 vocab.id 的字才能收藏（退回 glossary 補充詞彙表查到的字沒有
      // 對應的 vocab.id，沒有東西可以收藏，不顯示星星）。
      if (lookup.vocabId) {
        tooltip.appendChild(buildFavoriteStarButton(activeProfile!.id, lookup.vocabId));
      }
      wordSpan.appendChild(tooltip);
    }

    p.appendChild(wordSpan);
  });

  return p;
}

function renderChoice(): void {
  const game = choiceGame!;

  stageHeader(
    `${currentTopic.label} — Stage C 短文理解`,
    `第 ${Math.min(game.currentQuestionNumber, game.totalQuestions)} / ${game.totalQuestions} 題　答對 ${game.correctCount}　答錯 ${game.wrongCount}`
  );

  const passageBox = document.createElement("div");
  passageBox.className = "passage-box";

  const passageHeader = document.createElement("div");
  passageHeader.className = "passage-header";
  const passageTitle = document.createElement("h2");
  passageTitle.textContent = game.passage.title;
  passageHeader.appendChild(passageTitle);

  // 朗讀全文按鈕：播放中按下去是「整段停止」（不是暫停/續播），跟 handoff 需求一致。
  const readAloudBtn = document.createElement("button");
  readAloudBtn.type = "button";
  readAloudBtn.className = "passage-read-aloud-btn" + (isPassageReading ? " passage-read-aloud-btn--playing" : "");
  readAloudBtn.textContent = isPassageReading ? "⏸ 暫停" : "▶ 朗讀短文";
  readAloudBtn.addEventListener("click", () => {
    if (isPassageReading) {
      stopSpeaking();
      isPassageReading = false;
      render();
      return;
    }
    isPassageReading = true;
    render();
    speakPassage(game.passage.text, () => {
      isPassageReading = false;
      render();
    });
  });
  passageHeader.appendChild(readAloudBtn);

  passageBox.appendChild(passageHeader);
  passageBox.appendChild(buildInteractivePassage(game.passage.text, currentTopic.fileKey));
  app!.appendChild(passageBox);

  if (!game.isRoundComplete) {
    const question = document.createElement("p");
    question.className = "question-text";
    question.textContent = game.currentQuestion.question;
    app!.appendChild(question);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";
    for (const option of game.optionStates as ChoiceOptionState[]) {
      optionsWrap.appendChild(
        optionButton(option.text, option.status, () => game.selectOption(option.text))
      );
    }
    app!.appendChild(optionsWrap);
  }

  const footer = document.createElement("footer");
  footer.className = "game-footer";

  if (game.isRoundComplete) {
    if (!choiceRecorded) {
      finalizeRoundCompletion("choice", game.correctCount, game.wrongCount, false);
      choiceRecorded = true;
    }
    const total = game.correctCount + game.wrongCount;
    const accuracy = total > 0 ? Math.round((game.correctCount / total) * 100) : 0;

    const matchingTotal = (matchingGame?.correctCount ?? 0) + (matchingGame?.wrongCount ?? 0);
    const orderingTotal = (orderingGame?.correctCount ?? 0) + (orderingGame?.wrongCount ?? 0);
    const fillBlankTotal = (fillBlankGame?.correctCount ?? 0) + (fillBlankGame?.wrongCount ?? 0);
    const choiceTotal = total;
    const grandCorrect =
      (matchingGame?.correctCount ?? 0) +
      (orderingGame?.correctCount ?? 0) +
      (fillBlankGame?.correctCount ?? 0) +
      game.correctCount;
    const grandTotal = matchingTotal + orderingTotal + fillBlankTotal + choiceTotal;
    const grandAccuracy = grandTotal > 0 ? Math.round((grandCorrect / grandTotal) * 100) : 0;

    footer.innerHTML = `
      <p class="done">
        🎉🎉 ${currentTopic.label} 主題 Stage A → B-1 → B-2 → C 全部跑完一輪了！<br />
        Stage C 正確率 ${accuracy}%（答對 ${game.correctCount} 次／答錯 ${game.wrongCount} 次）<br />
        全部題型加總正確率 ${grandAccuracy}%（答對 ${grandCorrect} 次／共作答 ${grandTotal} 次）
      </p>
    `;
    const restartBtn = document.createElement("button");
    // 這是整個主題四種題型都跑完一輪的「破關獎勵」時刻，用 reward 配色（橘色）
    // 特別標出來，跟一般的「下一題／下一關」淺藍色按鈕做出區隔。
    restartBtn.className = "primary-btn primary-btn--reward";
    restartBtn.textContent = "從頭再玩一次（Stage A）";
    restartBtn.addEventListener("click", restartEverything);
    footer.appendChild(restartBtn);

    const menuBtn = document.createElement("button");
    menuBtn.className = "secondary-btn";
    menuBtn.textContent = "回選單";
    menuBtn.addEventListener("click", goToMenu);
    footer.appendChild(menuBtn);
  } else if (game.feedback === "correct") {
    const msg = document.createElement("p");
    msg.className = "hint hint--correct";
    msg.textContent = "✅ 答對了！";
    footer.appendChild(msg);

    const isLastQuestion = game.currentQuestionNumber === game.totalQuestions;
    const nextBtn = document.createElement("button");
    nextBtn.className = "primary-btn";
    nextBtn.textContent = isLastQuestion ? "查看結果 →" : "下一題 →";
    nextBtn.addEventListener("click", () => game.advanceToNextQuestion());
    footer.appendChild(nextBtn);
  } else if (game.feedback === "wrong") {
    const msg = document.createElement("p");
    msg.className = "hint hint--wrong";
    msg.textContent = "不對喔，回去短文裡找找看...";
    footer.appendChild(msg);
  }

  app!.appendChild(footer);
}

// Stage D「綜合關卡」畫面：比 Stage C 簡單，沒有短文框、沒有朗讀按鈕、沒有短文逐字點擊翻譯——
// 就是題目文字＋四個選項＋作答結果，因為題目本身已經混合了單字/短句/短文三種來源
// （見 capstoneQuestions.ts），這裡只需要單純呈現「一題接一題」的單選題流程即可。
// 沿用跟 renderChoice 同一顆 ChoiceGame 引擎，所以 game 物件的欄位（isRoundComplete／
// feedback／currentQuestionNumber／optionStates…）意義完全相同。
function renderCapstone(): void {
  const game = capstoneGame!;

  stageHeader(
    `${currentTopic.label} — Stage D 綜合關卡`,
    `第 ${Math.min(game.currentQuestionNumber, game.totalQuestions)} / ${game.totalQuestions} 題　答對 ${game.correctCount}　答錯 ${game.wrongCount}`
  );

  if (!game.isRoundComplete) {
    // 這一題如果是「短文理解題」（id 是 pass.<topic>.<passageId>.q<N> 開頭，跟 capstoneQuestions.ts
    // 混進來的單字題「capstone.vocab.*」／短句題「capstone.sentence.*」不同前綴），沒有把短文原文
    // 顯示在畫面上（Stage D 故意比 Stage C 簡單，不放整篇短文框），所以額外補一個朗讀按鈕，
    // 讓使用者可以只靠聽短文語音來作答，不用回去 Stage C 才能重聽。
    // 這一題如果有填 source_sentence（該題答案對應到短文原文的哪一句，content/passages/
    // <topic>.json 手動標註），優先只播放那一句，讓使用者能更聚焦地用聽的找答案，
    // 不用每題都重聽一整篇；沒有標註（例如需要合併好幾句才答得出來的題目）才退回播放整篇短文。
    //
    // 這一題如果是「短句填空題」（id 是 capstone.sentence.* 開頭），題目文字本身把答案挖空了
    // （例如 "My bag is ____"），沒有上下文短文可以對照，純用讀的很難確定該填哪個字；
    // capstoneQuestions.ts 組題時已經把挖空前的完整原句存進 source_sentence（一定會有值），
    // 這裡一起補上同一顆「播放這句」按鈕，讓使用者可以用聽的判斷答案，跟 Stage B-2
    // 句子填空的「播放整句」是同一個概念。
    const isFromPassage = game.currentQuestion.id.startsWith("pass.");
    const isSentenceQuiz = game.currentQuestion.id.startsWith("capstone.sentence.");
    if (isFromPassage || isSentenceQuiz) {
      const sourceSentence = game.currentQuestion.source_sentence ?? null;
      const textToRead = sourceSentence ?? currentPassage.text;

      const audioRow = document.createElement("div");
      audioRow.className = "capstone-audio-row";
      const readAloudBtn = document.createElement("button");
      readAloudBtn.type = "button";
      readAloudBtn.className = "passage-read-aloud-btn" + (isPassageReading ? " passage-read-aloud-btn--playing" : "");
      readAloudBtn.textContent = isPassageReading ? "⏸ 暫停" : sourceSentence ? "▶ 播放這句" : "▶ 朗讀短文";
      readAloudBtn.addEventListener("click", () => {
        if (isPassageReading) {
          stopSpeaking();
          isPassageReading = false;
          render();
          return;
        }
        isPassageReading = true;
        render();
        speakPassage(textToRead, () => {
          isPassageReading = false;
          render();
        });
      });
      audioRow.appendChild(readAloudBtn);
      app!.appendChild(audioRow);
    }

    const question = document.createElement("p");
    question.className = "question-text";
    question.textContent = game.currentQuestion.question;
    app!.appendChild(question);

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";
    for (const option of game.optionStates as ChoiceOptionState[]) {
      optionsWrap.appendChild(
        optionButton(option.text, option.status, () => game.selectOption(option.text))
      );
    }
    app!.appendChild(optionsWrap);
  }

  const footer = document.createElement("footer");
  footer.className = "game-footer";

  if (game.isRoundComplete) {
    if (!capstoneRecorded) {
      finalizeRoundCompletion("capstone", game.correctCount, game.wrongCount, false);
      capstoneRecorded = true;
    }
    const total = game.correctCount + game.wrongCount;
    const accuracy = total > 0 ? Math.round((game.correctCount / total) * 100) : 0;

    footer.innerHTML = `
      <p class="done">
        🏆🏆 ${currentTopic.label} 主題 Stage D 綜合關卡通過了！這個主題單元完成！<br />
        Stage D 正確率 ${accuracy}%（答對 ${game.correctCount} 次／答錯 ${game.wrongCount} 次）
      </p>
    `;
    const restartBtn = document.createElement("button");
    restartBtn.className = "primary-btn primary-btn--reward";
    restartBtn.textContent = "從頭再玩一次（Stage A）";
    restartBtn.addEventListener("click", restartEverything);
    footer.appendChild(restartBtn);

    const menuBtn = document.createElement("button");
    menuBtn.className = "secondary-btn";
    menuBtn.textContent = "回選單";
    menuBtn.addEventListener("click", goToMenu);
    footer.appendChild(menuBtn);
  } else if (game.feedback === "correct") {
    const msg = document.createElement("p");
    msg.className = "hint hint--correct";
    msg.textContent = "✅ 答對了！";
    footer.appendChild(msg);

    const isLastQuestion = game.currentQuestionNumber === game.totalQuestions;
    const nextBtn = document.createElement("button");
    nextBtn.className = "primary-btn";
    nextBtn.textContent = isLastQuestion ? "查看結果 →" : "下一題 →";
    nextBtn.addEventListener("click", () => {
      // 下一題不一定還是短文理解題，朗讀按鈕可能會跟著消失——先把還在播放的短文語音停掉，
      // 不然會變成畫面上找不到暫停鍵、但背景聲音還繼續播的怪狀況。
      if (isPassageReading) {
        stopSpeaking();
        isPassageReading = false;
      }
      game.advanceToNextQuestion();
    });
    footer.appendChild(nextBtn);
  } else if (game.feedback === "wrong") {
    const msg = document.createElement("p");
    msg.className = "hint hint--wrong";
    msg.textContent = "不對喔，再想想看...";
    footer.appendChild(msg);
  }

  app!.appendChild(footer);
}

// ---- 成就徽章：資料來源是 content/badges/badges.json（43 個徽章、10 大分類）----
// 這是跟舊版「4 大類 × 銅銀金三階、門檻自己隨便訂」完全不同的兩套邏輯：
// 舊版已經整個換掉，畫面現在照 badges.json 的正式清單跟達成條件呈現，不是套版而已。
//
// 有 13 個徽章依賴目前系統還沒有的功能（Unit 0 教學未上架、沒有 Stage D 綜合關卡、
// 沒有「收藏最愛單字」功能、沒有完整的單元／主題架構），這些永遠顯示成鎖定＋標註
// 「功能開發中」，等對應功能做出來後再回來接上真正的判斷邏輯（跟使用者確認過的處理方式）。
const BADGES_BLOCKED_BY_MISSING_FEATURE = new Set<string>([
  // OB-02（unit0_complete）、OB-03（first_stage_d）、OB-04（first_favorite）跟
  // WC-01~07（unit_completion.*）、FV-01~03（favorites.*）已經全部接上真正的判斷邏輯
  // （見 computeBadgeViewState() 的 "onboarding"／"unit_completion"／"favorites" 分支），
  // 不用再放在這裡當「功能開發中」了。目前沒有任何徽章卡在這份清單裡。
]);

// 類別標籤前面的圖示改用單色線條 SVG（跟功能列 NAV_ICONS 同一套風格：
// stroke="currentColor"，顏色跟著 .badge-category-title 本身的文字顏色走），
// 不用彩色 emoji，看起來更簡單一致。
const CATEGORY_ICON_ATTRS = `viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
const CATEGORY_ICONS = {
  rocket: `<svg ${CATEGORY_ICON_ATTRS}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  book: `<svg ${CATEGORY_ICON_ATTRS}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  edit: `<svg ${CATEGORY_ICON_ATTRS}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  gamepad: `<svg ${CATEGORY_ICON_ATTRS}><rect x="2" y="8" width="20" height="8" rx="4"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="4" y1="12" x2="8" y2="12"/><circle cx="15" cy="11" r="1"/><circle cx="18" cy="13" r="1"/></svg>`,
  map: `<svg ${CATEGORY_ICON_ATTRS}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
  flame: `<svg ${CATEGORY_ICON_ATTRS}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  calendar: `<svg ${CATEGORY_ICON_ATTRS}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  target: `<svg ${CATEGORY_ICON_ATTRS}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  star: `<svg ${CATEGORY_ICON_ATTRS}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  sun: `<svg ${CATEGORY_ICON_ATTRS}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
};

const BADGE_CATEGORY_DISPLAY: Record<Badge["category"], { icon: string; title: string }> = {
  onboarding: { icon: CATEGORY_ICONS.rocket, title: "新手引導" },
  vocab_milestone: { icon: CATEGORY_ICONS.book, title: "單字里程碑" },
  questions_milestone: { icon: CATEGORY_ICONS.edit, title: "完成題目數量" },
  game_mastery: { icon: CATEGORY_ICONS.gamepad, title: "遊戲題型精通" },
  unit_completion: { icon: CATEGORY_ICONS.map, title: "主題／單元完成度" },
  streak: { icon: CATEGORY_ICONS.flame, title: "連續學習天數" },
  total_days: { icon: CATEGORY_ICONS.calendar, title: "累計學習天數" },
  performance: { icon: CATEGORY_ICONS.target, title: "表現／正確率" },
  favorites: { icon: CATEGORY_ICONS.star, title: "收藏（最喜歡的單字）" },
  healthy_habit: { icon: CATEGORY_ICONS.sun, title: "正向作息" },
};

// 顯示順序照 docs/achievement-badges.md 的章節順序排列。
const BADGE_CATEGORY_ORDER: Badge["category"][] = [
  "onboarding",
  "vocab_milestone",
  "questions_milestone",
  "game_mastery",
  "unit_completion",
  "streak",
  "total_days",
  "performance",
  "favorites",
  "healthy_habit",
];

/** game_mastery 分類的 tier_group 是 "game_mastery.match"／"order"／"fill"／"choice"，
 * 對應到 progress.ts／badgeStats.ts 的 StageKey 命名。 */
const GAME_MASTERY_STAGE_KEY: Record<string, StageKeyForBadges> = {
  match: "matching",
  order: "ordering",
  fill: "fillBlank",
  choice: "choice",
};

/** 把 progress.ts 的資料彙整成算「單字里程碑」（VM-01~05）要用的總數，跨「所有主題」統計。
 * 沿用舊版「matchingDone 就算這個主題的單字都習得」的簡化定義。 */
function computeVocabAggregate(profileId: string): { vocabKnown: number; totalVocabAvailable: number } {
  const vocabKnown = availableTopics
    .filter((summary) => getStageProgress(profileId, summary.topic.fileKey, "matching") !== null)
    .reduce((sum, summary) => sum + summary.vocabCount, 0);
  const totalVocabAvailable = availableTopics.reduce((sum, t) => sum + t.vocabCount, 0);
  return { vocabKnown, totalVocabAvailable };
}

/** 給「收藏」相關徽章（OB-04 我的收藏、FV-01~03 收藏家 10/30/100）用的聚合數字——
 * 直接沿用 favorites.ts 的 getFavoriteCount()，寫法照 computeVocabAggregate() 同一套模式，
 * 不用另外發明。 */
function computeFavoritesAggregate(profileId: string): number {
  return getFavoriteCount(profileId);
}

/** 算出這個使用者「已經通過 Stage D 綜合關卡」的主題 fileKey 集合——給 OB-03（第一次
 * 通過任一主題的 Stage D）跟 unit_completion（整個單元的主題都要通過 Stage D）共用。 */
function computeCompletedStageDTopics(profileId: string): Set<string> {
  return new Set(
    availableTopics
      .filter((summary) => getStageProgress(profileId, summary.topic.fileKey, "capstone") !== null)
      .map((summary) => summary.topic.fileKey)
  );
}

/** OB-02（unit0_complete）用：單元 0 底下的 greetings／pronouns 兩個主題是否都已上架
 * （content 齊全才會出現在 availableTopics），而且這個使用者是否兩個主題都各自完成過
 * 一輪 Stage A 單字配對（MatchingGame 要求全部單字都配對成功才算完成一輪）——兩個主題
 * 都要完成才算達成「完成單元 0 全部單字練習」，跟其他單元完成度徽章「底下所有主題都要
 * 完成」的判斷邏輯一致（見 computeBadgeViewState 的 "unit_completion" case）。 */
function computeUnit0MatchingComplete(profileId: string): boolean {
  const unit0TopicFileKeys = UNITS.find((unit) => unit.key === "unit0")?.topicFileKeys ?? [];
  if (unit0TopicFileKeys.length === 0) return false;
  return unit0TopicFileKeys.every((fileKey) => {
    const isAvailable = availableTopics.some((summary) => summary.topic.fileKey === fileKey);
    return isAvailable && getStageProgress(profileId, fileKey, "matching") !== null;
  });
}

interface BadgeViewState {
  /** 已經取得（one_time 至少達成一次／repeatable 累計次數 > 0） */
  achieved: boolean;
  /** repeatable 徽章要顯示的「已達成 N 次」；one_time 徽章不需要，維持 undefined */
  achievedCount?: number;
  /** 因為功能還沒做出來、永遠無法判斷達成與否 */
  blockedByMissingFeature: boolean;
}

/** 依 badge 的分類/id，算出目前這個使用者的達成狀態。集中寫在一個函式裡，
 * 之後 badges.json 有調整或新增徽章，只要照這裡的分類規則接資料就好。 */
function computeBadgeViewState(
  badge: Badge,
  vocabAgg: { vocabKnown: number; totalVocabAvailable: number },
  stats: ReturnType<typeof getBadgeStats>,
  totalDaysPlayed: number,
  completedStageDTopics: Set<string>,
  unit0MatchingComplete: boolean,
  favoritesCount: number
): BadgeViewState {
  if (BADGES_BLOCKED_BY_MISSING_FEATURE.has(badge.id)) {
    return { achieved: false, blockedByMissingFeature: true };
  }

  switch (badge.category) {
    case "onboarding": {
      // OB-02（unit0_complete）：條件寫的是「完成 Unit 0 全部單字練習」，對應到
      // Stage A 單字配對——MatchingGame 要全部單字都配對成功才算「完成一輪」，
      // 所以這裡用「greetings／pronouns 兩個主題的 Stage A 配對是否都完成過一次」判斷，不要求
      // 連 Stage B/C/D 都要通過（那是 OB-03 first_stage_d 在管的事）。
      // OB-03（first_stage_d）：只要任一主題通過過一次 Stage D 綜合關卡就算達成；
      // OB-04（first_favorite）：收藏過至少一個單字就算達成；
      // 其餘 onboarding 徽章（OB-01）能看到這個畫面就代表已經成功登入過這個使用者了，
      // 直接算達成。
      if (badge.id === "badge.onboarding.unit0_complete") {
        return { achieved: unit0MatchingComplete, blockedByMissingFeature: false };
      }
      if (badge.id === "badge.onboarding.first_stage_d") {
        return { achieved: completedStageDTopics.size > 0, blockedByMissingFeature: false };
      }
      if (badge.id === "badge.onboarding.first_favorite") {
        return { achieved: favoritesCount > 0, blockedByMissingFeature: false };
      }
      return { achieved: true, blockedByMissingFeature: false };
    }
    case "vocab_milestone": {
      const threshold = badge.threshold ?? vocabAgg.totalVocabAvailable;
      const achieved = vocabAgg.totalVocabAvailable > 0 && vocabAgg.vocabKnown >= threshold;
      return { achieved, blockedByMissingFeature: false };
    }
    case "questions_milestone": {
      const achieved = badge.threshold !== null && stats.totalQuestionsAnswered >= badge.threshold;
      return { achieved, blockedByMissingFeature: false };
    }
    case "game_mastery": {
      const stageSuffix = badge.tier_group?.split(".")[1] ?? "";
      const stageKey = GAME_MASTERY_STAGE_KEY[stageSuffix];
      const count = stageKey ? stats.stageQuestionsAnswered[stageKey] : 0;
      const achieved = badge.threshold !== null && count >= badge.threshold;
      return { achieved, blockedByMissingFeature: false };
    }
    case "total_days": {
      const achieved = badge.threshold !== null && totalDaysPlayed >= badge.threshold;
      return { achieved, blockedByMissingFeature: false };
    }
    case "streak": {
      const count = stats.streakAchievedCount[badge.id] ?? 0;
      return { achieved: count > 0, achievedCount: count, blockedByMissingFeature: false };
    }
    case "performance": {
      if (badge.id === "badge.performance.perfect_level") {
        const count = stats.perfectLevelAchievedCount;
        return { achieved: count > 0, achievedCount: count, blockedByMissingFeature: false };
      }
      // badge.performance.streak10（連勝十題）
      const count = stats.correctStreakAchievedCount;
      return { achieved: count > 0, achievedCount: count, blockedByMissingFeature: false };
    }
    case "healthy_habit": {
      const count =
        badge.id === "badge.healthy_habit.early_bird" ? stats.earlyBirdAchievedCount : stats.weekendAchievedCount;
      return { achieved: count > 0, achievedCount: count, blockedByMissingFeature: false };
    }
    case "unit_completion": {
      // 這裡故意比對 UNITS 裡「規劃完整主題」的完整清單（不是只看目前已經做出來的主題），
      // 所以還沒做出內容的單元、all_topics 在對應主題做出來之前都會自然算未達成，不用另外
      // 維護一份「功能開發中」名單，之後主題陸續補齊也不用回來改這裡的邏輯。
      // unit0（教室常用語）故意排除在外：它已經有專屬的 OB-02 新手徽章
      // （badge.onboarding.unit0_complete，判斷 Stage A 單字配對完成），不需要再產生一個
      // 語意重複的 unit_completion 徽章。
      const unitIdSuffix = badge.id.replace("badge.unit_completion.", "");
      const unitsToCheck =
        unitIdSuffix === "all_topics"
          ? UNITS.filter((u) => u.key !== "unit0")
          : UNITS.filter((u) => u.key === unitIdSuffix && u.key !== "unit0");
      if (unitsToCheck.length === 0) {
        return { achieved: false, blockedByMissingFeature: true };
      }
      const achieved = unitsToCheck.every((unit) =>
        unit.topicFileKeys.every(
          (fileKey) => availableTopics.some((t) => t.topic.fileKey === fileKey) && completedStageDTopics.has(fileKey)
        )
      );
      return { achieved, blockedByMissingFeature: false };
    }
    case "favorites": {
      // FV-01~03（收藏家 10/30/100）：收藏數量達門檻就算達成，門檻直接讀 badges.json
      // 的 threshold，不在這裡寫死 10/30/100。
      const achieved = badge.threshold !== null && favoritesCount >= badge.threshold;
      return { achieved, blockedByMissingFeature: false };
    }
    default:
      return { achieved: false, blockedByMissingFeature: true };
  }
}

/** 每個徽章 id 對應「目前有沒有達成」＋「累計達成次數」的一份快照，寫入 badgeStats
 * 前後各拍一張，才能比對出「這一輪新達成的徽章」（見 diffNewlyAchievedBadges()）。 */
type BadgeAchievementSnapshot = Map<string, { achieved: boolean; achievedCount: number }>;

function snapshotBadgeAchievements(profileId: string): BadgeAchievementSnapshot {
  const vocabAgg = computeVocabAggregate(profileId);
  const stats = getBadgeStats(profileId);
  const totalDaysPlayed = getTotalDaysPlayed(profileId);
  const completedStageDTopics = computeCompletedStageDTopics(profileId);
  const unit0MatchingComplete = computeUnit0MatchingComplete(profileId);
  const favoritesCount = computeFavoritesAggregate(profileId);
  const snapshot: BadgeAchievementSnapshot = new Map();
  for (const badge of ALL_BADGES) {
    const view = computeBadgeViewState(
      badge,
      vocabAgg,
      stats,
      totalDaysPlayed,
      completedStageDTopics,
      unit0MatchingComplete,
      favoritesCount
    );
    snapshot.set(badge.id, { achieved: view.achieved, achievedCount: view.achievedCount ?? 0 });
  }
  return snapshot;
}

/** 比對「寫入 badgeStats 前」跟「寫入後」兩份快照，抓出這一輪新達成的徽章。
 * 跟使用者確認過的規則：條件達成「每一次」都要跳出來，不是只有第一次達成才跳——
 * 一次性徽章看「未達成→達成」；可以重複累計次數的徽章（連續答對／完美關卡／
 * 早起／假日／連續天數各門檻）看 achievedCount 有沒有變多，變多就代表又達成一次，
 * 也要跳出來。 */
function diffNewlyAchievedBadges(before: BadgeAchievementSnapshot, after: BadgeAchievementSnapshot): Badge[] {
  const newly: Badge[] = [];
  for (const badge of ALL_BADGES) {
    const b = before.get(badge.id);
    const a = after.get(badge.id);
    if (!a) continue;
    const justUnlocked = !b?.achieved && a.achieved;
    const achievedAgain = (b?.achieved ?? false) && a.achieved && a.achievedCount > (b?.achievedCount ?? 0);
    if (justUnlocked || achievedAgain) {
      newly.push(badge);
    }
  }
  return newly;
}

/**
 * 四種題型「答完一輪」共用的收尾動作：寫入 badgeStats／progress／playLog 相關資料，
 * 順便比對寫入前後的徽章達成狀態，把這一輪新達成（或又達成一次）的徽章收進
 * pendingBadgeUnlocks，讓 render() 在畫面最上層跳出「獲得新徽章」的 pop。
 * 原本四個 renderXxx() 各自重複寫一模一樣的六行呼叫，現在集中在這裡，
 * 只有 stageKey／hintUsed 這兩個參數依題型不同。
 */
function finalizeRoundCompletion(
  stageKey: StageKeyForBadges,
  correctCount: number,
  wrongCount: number,
  hintUsed: boolean
): void {
  const profileId = activeProfile!.id;
  const before = snapshotBadgeAchievements(profileId);

  recordStageCompletion(profileId, currentTopic.fileKey, stageKey, correctCount, wrongCount);
  recordPlayToday(profileId);
  recordElapsedPlayTime();
  recordRoundCompletion(profileId, { wrongCount, hintUsed });
  syncStreakBadgesNow(profileId);

  const after = snapshotBadgeAchievements(profileId);
  const newly = diffNewlyAchievedBadges(before, after);
  if (newly.length > 0) {
    pendingBadgeUnlocks = [...pendingBadgeUnlocks, ...newly];
  }

  playRoundCompleteSound();
}

function closeBadgeUnlockModal(): void {
  pendingBadgeUnlocks = [];
  unlockBodyScroll();
  render();
}

// 紙花配色沿用既有 design tokens 的強調色系，不新增色票。
const CONFETTI_COLORS = [
  "var(--color-accent-yellow)",
  "var(--color-accent-orange)",
  "var(--color-accent-pink)",
  "var(--color-primary-500)",
  "var(--color-success)",
];

/**
 * 「獲得新徽章」pop 出現時，畫面上方灑落的紙花效果——純視覺裝飾，不影響任何互動，
 * 每片紙花是一個 CSS 動畫（見 .confetti-piece／@keyframes confetti-fall）負責掉落，
 * 這裡只負責隨機決定每片的起始位置／延遲／掉落時間／飄移距離／初始旋轉角度，
 * 讓每次跳出來的紙花看起來不會整齊劃一。動畫本身只播一次（2~3 秒），
 * 不用 JS 計時器清除，因為下次 render() 整個 #app 都會被砍掉重建。
 */
function buildConfettiOverlay(): HTMLDivElement {
  const container = document.createElement("div");
  container.className = "confetti-container";
  const pieceCount = 36;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.setProperty("--confetti-delay", `${(Math.random() * 0.5).toFixed(2)}s`);
    piece.style.setProperty("--confetti-duration", `${(2 + Math.random() * 1.2).toFixed(2)}s`);
    piece.style.setProperty("--confetti-drift", `${Math.round((Math.random() * 2 - 1) * 60)}px`);
    piece.style.setProperty("--confetti-rotate-start", `${Math.round(Math.random() * 360)}deg`);
    container.appendChild(piece);
  }
  return container;
}

/**
 * 「獲得新徽章」的 pop：答完一輪、發現有新達成的徽章時跳出，同一輪可能一次拿到
 * 好幾個（例如同時跨過「完成題目數量」跟「遊戲題型精通」的門檻），全部列在同一個
 * pop 裡。跟使用者確認過：不會自動消失，要使用者自己按關閉（右上角的叉叉、
 * 底下的「太棒了！」按鈕、或點遮罩空白處都可以）。共用跟「變更頭像／修改名稱」
 * 一樣的 .modal-overlay／.modal-card 外殼樣式，維持整站小視窗長相一致；
 * 額外疊一層紙花動畫（buildConfettiOverlay()）營造歡樂氛圍，放在卡片「後面」
 * （DOM 順序在卡片之前），讓紙花從畫面上方灑落、卡片本身維持在最上層清楚可讀。
 * 開啟時鎖定背景捲動（lockBodyScroll()，見 appendModalShell() 旁的說明），
 * 跟 closeBadgeUnlockModal() 的 unlockBodyScroll() 成對，三種關閉方式
 * （叉叉／點遮罩／「太棒了！」按鈕）都經過同一個 closeBadgeUnlockModal()。
 */
function appendBadgeUnlockModal(): void {
  lockBodyScroll();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeBadgeUnlockModal();
  });

  overlay.appendChild(buildConfettiOverlay());

  const card = document.createElement("div");
  card.className = "modal-card badge-unlock-card";

  const cardHeader = document.createElement("div");
  cardHeader.className = "modal-card-header";
  const titleEl = document.createElement("h3");
  titleEl.textContent = "🎉 獲得新徽章！";
  cardHeader.appendChild(titleEl);
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close-btn";
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "關閉");
  closeBtn.addEventListener("click", closeBadgeUnlockModal);
  cardHeader.appendChild(closeBtn);
  card.appendChild(cardHeader);

  const list = document.createElement("div");
  list.className = "badge-unlock-list";
  for (const badge of pendingBadgeUnlocks) {
    const item = document.createElement("div");
    item.className = "badge-unlock-item";

    const media = document.createElement("div");
    media.className = "badge-unlock-media";
    const imageUrl = getBadgeImageUrl(badge.code);
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = badge.name;
      media.appendChild(img);
    } else {
      const fill = document.createElement("div");
      fill.className = "badge-media-fill";
      fill.textContent = badge.code;
      media.appendChild(fill);
    }
    item.appendChild(media);

    const text = document.createElement("div");
    text.className = "badge-unlock-text";
    const name = document.createElement("p");
    name.className = "badge-unlock-name";
    name.textContent = badge.name;
    text.appendChild(name);
    const desc = document.createElement("p");
    desc.className = "badge-unlock-desc";
    desc.textContent = badge.description;
    text.appendChild(desc);
    item.appendChild(text);

    list.appendChild(item);
  }
  card.appendChild(list);

  const closeAction = document.createElement("button");
  closeAction.type = "button";
  closeAction.className = "primary-btn";
  closeAction.textContent = "太棒了！";
  closeAction.addEventListener("click", closeBadgeUnlockModal);
  card.appendChild(closeAction);

  overlay.appendChild(card);
  app!.appendChild(overlay);
}

function renderBadgeCard(badge: Badge, view: BadgeViewState): HTMLElement {
  const locked = !view.achieved;

  const card = document.createElement("div");
  card.className = "badge-card";

  // 說明文字不再固定顯示在徽章下方，改成滑鼠移到徽章上（CSS :hover）或點擊/點選
  // （平板等沒有滑鼠的裝置，:hover 不一定會觸發，所以另外用 click 切換）才彈出。
  // .badge-media-wrap 負責定位泡泡跟接收點擊；.badge-media 維持原本的圓形遮罩
  // （overflow:hidden），泡泡故意放在 .badge-media 外面一層，不然會被圓形遮罩裁掉。
  const mediaWrap = document.createElement("div");
  const isTooltipActive = activeBadgeTooltipCode === badge.code;
  mediaWrap.className = "badge-media-wrap" + (isTooltipActive ? " badge-media-wrap--active" : "");
  mediaWrap.addEventListener("click", () => {
    activeBadgeTooltipCode = isTooltipActive ? null : badge.code;
    render();
  });

  const media = document.createElement("div");
  media.className = locked ? "badge-media badge-media--locked" : "badge-media";

  const imageUrl = getBadgeImageUrl(badge.code);
  if (imageUrl) {
    // 美術圖已經畫好（見 assets/badge/SKILL.md 的規範，壓縮成 200x200 小圖放在
    // app/src/assets/badges/），直接顯示真圖；透明度／鎖定樣式套用在 <img> 本身。
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `${badge.name}：${badge.description}`;
    media.appendChild(img);
  } else {
    // TODO：待美術圖檔完成後替換——目前這個徽章代號還沒有畫好的圖，
    // 用 --color-primary-500 藍色底色＋徽章代號當佔位圖，版面結構不用動。
    const mediaFill = document.createElement("div");
    mediaFill.className = "badge-media-fill";
    mediaFill.textContent = badge.code;
    mediaFill.setAttribute("role", "img");
    mediaFill.setAttribute("aria-label", `${badge.name}：${badge.description}`);
    media.appendChild(mediaFill);
  }
  mediaWrap.appendChild(media);

  const tooltip = document.createElement("div");
  tooltip.className = "badge-tooltip";
  tooltip.textContent = badge.description;
  mediaWrap.appendChild(tooltip);

  card.appendChild(mediaWrap);

  const title = document.createElement("h4");
  title.textContent = badge.name;
  card.appendChild(title);

  if (badge.display_count) {
    const countLine = document.createElement("p");
    countLine.className = "badge-count";
    countLine.textContent = `已達成 ${view.achievedCount ?? 0} 次`;
    card.appendChild(countLine);
  }

  if (view.blockedByMissingFeature) {
    const devNote = document.createElement("p");
    devNote.className = "badge-dev-note";
    devNote.textContent = "🚧 功能開發中，之後上線就能挑戰這個徽章";
    card.appendChild(devNote);
  }

  return card;
}

function renderBadges(): void {
  appendShell("badges");

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>成就徽章</h1><p class="progress">共 ${ALL_BADGES.length} 個徽章，分成 10 大類</p>`;
  app!.appendChild(header);

  const profileId = activeProfile!.id;
  const vocabAgg = computeVocabAggregate(profileId);
  const stats = getBadgeStats(profileId);
  const totalDaysPlayed = getTotalDaysPlayed(profileId);
  const completedStageDTopics = computeCompletedStageDTopics(profileId);
  const unit0MatchingComplete = computeUnit0MatchingComplete(profileId);
  const favoritesCount = computeFavoritesAggregate(profileId);

  // 所有類別＋徽章都包在同一個白底圓角的框架裡（跟 .stage-banner 一樣四邊留一致的
  // padding），不同類別之間用虛線分隔，不用再各自散落在頁面底色上。
  const frame = document.createElement("div");
  frame.className = "badge-frame";

  for (const category of BADGE_CATEGORY_ORDER) {
    const badgesInCategory = ALL_BADGES.filter((b) => b.category === category);
    if (badgesInCategory.length === 0) continue;

    const display = BADGE_CATEGORY_DISPLAY[category];
    const categoryEl = document.createElement("div");
    categoryEl.className = "badge-category";

    const categoryTitle = document.createElement("div");
    categoryTitle.className = "badge-category-title";
    categoryTitle.innerHTML = `<span class="badge-category-icon">${display.icon}</span>${display.title}`;
    categoryEl.appendChild(categoryTitle);

    const row = document.createElement("div");
    row.className = "badge-row";
    for (const badge of badgesInCategory) {
      const view = computeBadgeViewState(
        badge,
        vocabAgg,
        stats,
        totalDaysPlayed,
        completedStageDTopics,
        unit0MatchingComplete,
        favoritesCount
      );
      row.appendChild(renderBadgeCard(badge, view));
    }
    categoryEl.appendChild(row);

    frame.appendChild(categoryEl);
  }

  app!.appendChild(frame);
}

/**
 * 「回到頂端」浮動按鈕：不分畫面，render() 每次重畫都會無條件加上一個（比照
 * appendBadgeUnlockModal() 的做法），往下捲動超過門檻值才會顯示（見底下綁在
 * window 上的 scroll 監聽器，用 .back-to-top-btn--visible class 切換）。
 * 圓形浮動按鈕＋陰影＋主色直接沿用既有的 --radius-circle／--shadow-md／
 * --color-primary-500，跟 .modal-close-btn 視覺風格一致，不用另外設計新樣式。
 */
function appendBackToTopButton(): void {
  const btn = document.createElement("button");
  btn.className = "back-to-top-btn";
  btn.setAttribute("aria-label", "回到頂端");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  app!.appendChild(btn);
}

function render(): void {
  // render() 幾乎每個使用者互動最後都會呼叫一次（答對/答錯一題、點徽章、展開/收合、
  // 收藏/取消收藏……不是只有「切換到全新畫面」才會重畫），但每次都會先把 #app 砍掉重建。
  // 剛好被點擊、正在 focus 的按鈕會被一起砍掉，瀏覽器對「focus 元素從 DOM 消失」的
  // 預設行為就是把捲動位置重置回頂端——這才是「點哪裡都跳回頂端」的真正成因（不是
  // <a href="#">、表單 submit 或哪裡誤用了 scrollTo/scrollIntoView）。
  // 修法：render() 預設保留使用者目前的捲動位置，記下重畫前的 scrollY，重畫完再
  // 設回去；真正「切換到不同畫面」的少數地方（各個 goToXxx() 函式）會在呼叫完
  // render() 之後自己額外呼叫 window.scrollTo(0, 0) 蓋掉這裡的預設行為。
  const scrollY = window.scrollY;
  app!.innerHTML = "";
  if (screen === "profileSelect") renderProfileSelect();
  else if (screen === "topicSelect") renderTopicSelect();
  else if (screen === "menu") renderMenu();
  else if (screen === "vocabOverview") renderVocabOverview();
  else if (screen === "flashcards") renderFlashcards();
  else if (screen === "matching") renderMatching();
  else if (screen === "ordering") renderOrdering();
  else if (screen === "fillBlank") renderFillBlank();
  else if (screen === "choice") renderChoice();
  else if (screen === "capstone") renderCapstone();
  else if (screen === "stats") renderStats();
  else if (screen === "badges") renderBadges();
  else if (screen === "favorites") renderFavorites();
  else if (screen === "profileDetail") renderProfileDetail();
  else if (screen === "about") renderAbout();

  // 「獲得新徽章」的 pop 疊在最上層——不管目前是哪個畫面，只要有待顯示的新達成
  // 徽章就跳出來，跟「變更頭像／修改名稱」的小視窗一樣是 position:fixed 的
  // 全螢幕遮罩，不用管前面畫面渲染的 DOM 結構，加在最後面就會蓋在最上面。
  if (pendingBadgeUnlocks.length > 0) {
    appendBadgeUnlockModal();
  }

  // 不分畫面，「回到頂端」浮動按鈕都要加上——包含選使用者畫面跟七種遊戲題型畫面
  // （這些畫面不會呼叫 appendShell()），寫法比照上面的 appendBadgeUnlockModal()，
  // 不管目前是哪個 screen 都會執行到。
  appendBackToTopButton();

  // 這裡是整個 render() 同步任務裡最後把捲動位置設回去的地方，確保瀏覽器不會有機會
  // 先畫出「捲動到 0」的那一幀（不會閃一下）；換到全新畫面的 goToXxx() 函式呼叫完
  // render() 之後，會再用 window.scrollTo(0, 0) 蓋掉這裡設回的舊位置。
  window.scrollTo(0, scrollY);
}

// 短文理解點字看翻譯：點擊泡泡以外的任何地方（包含空白處）都要能關閉泡泡，
// 不用等使用者剛好點到另一個字。點在 .passage-word 本身（或其內的泡泡）時，
// closest() 找得到就不處理，交給 buildInteractivePassage() 裡該元素自己的
// click 監聽器切換開關；點在其他任何地方，只要泡泡目前是開著的，就收起來並重新渲染。
document.addEventListener("click", (event) => {
  if (activePassageWordKey === null) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest(".passage-word")) return;
  activePassageWordKey = null;
  render();
});

// 成就徽章的說明文泡泡：點擊觸發的（平板等沒有滑鼠的裝置）也要能點空白處關閉，
// 邏輯跟短文點字看翻譯的泡泡一模一樣——點在 .badge-media-wrap 本身，交給它自己的
// click 監聽器切換開關；點在其他任何地方，泡泡開著的話就收起來。
document.addEventListener("click", (event) => {
  if (activeBadgeTooltipCode === null) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest(".badge-media-wrap")) return;
  activeBadgeTooltipCode = null;
  render();
});

// 「回到頂端」按鈕的顯示/隱藏只靠 CSS class 切換，不用每次 render() 重畫都重新綁定
// 監聽器——render() 每次都會把 #app 砍掉重建，如果把這段放進 render() 或
// appendBackToTopButton() 裡面，會疊加出一堆重複的 scroll 監聽器。這裡綁在 window
// 上、只在整個 app 初始化時執行一次，之後每次 render() 重建出來的新按鈕都共用同一個
// 監聽器（用 querySelector 現抓 DOM 上當下那個按鈕，不用擔心舊按鈕的參照失效）。
window.addEventListener(
  "scroll",
  () => {
    const btn = document.querySelector(".back-to-top-btn");
    if (!btn) return;
    btn.classList.toggle("visible", window.scrollY > 300);
  },
  { passive: true }
);

render();
