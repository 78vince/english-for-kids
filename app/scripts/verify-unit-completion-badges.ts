// 驗證 Phase 2 新接上的三個徽章判斷邏輯：
// - OB-02（badge.onboarding.unit0_complete）：單元 0「教室常用語」主題的 Stage A 單字配對
//   完成過一輪，就算「完成 Unit 0 全部單字練習」（MatchingGame 要求全部單字都配對成功
//   才算完成一輪，不需要連 Stage B/C/D 都通過）。
// - OB-03（badge.onboarding.first_stage_d）：任一主題第一次通過 Stage D 綜合關卡就算達成。
// - WC-01~08（badge.unit_completion.unit1~unit7／all_topics）：要「這個單元規劃的
//   全部主題」都存在於目前已上架的主題清單裡、而且每個都通過 Stage D，才算這個單元完成；
//   all_topics 則是 unit1～unit7 都要完成（unit0 明確排除在外，見下方 UNITS 常數說明）。
//   （2026-08-25：新增單元七「文法小幫手」11 個主題，WC-07 all_topics 徽章的 code
//   往後遞補一位變成 WC-08，是刻意調整不是漏改，見 content/badges/badges.json。）
//
// main.ts 裡的 computeCompletedStageDTopics() / computeBadgeViewState() 的 unit_completion
// 分支就是這裡驗證的邏輯，但 main.ts 本身因為用了 Vite 專屬的 import.meta.glob 沒辦法在
// plain tsx 下直接 import，所以這裡重建一份跟 main.ts 邏輯一致的最小版本來驗證
//（同樣的作法沿用自其他 verify-*.ts，例如 verify-passage-glossary.ts）。
// progress.ts 本身不依賴 import.meta.glob，可以直接 import 真正的模組來測。
// 用法：npx tsx scripts/verify-unit-completion-badges.ts
//
// progress.ts 在 Node 環境跑沒有瀏覽器的 localStorage，跟 verify-progress-logic.ts
// 同一套做法：先塞一個最陽春的 in-memory 假 localStorage 進 globalThis.window，
// 再用動態 import 載入 progress.ts，讓裡面的 window.localStorage 呼叫可以正常運作。

function makeFakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

(globalThis as any).window = {
  localStorage: makeFakeLocalStorage(),
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const { recordStageCompletion, getStageProgress } = await import("../src/progress");

interface UnitConfig {
  key: string;
  label: string;
  topicFileKeys: string[];
}

// 跟 main.ts 的 UNITS 常數保持一致（docs/content-plan.md 3.1 節的 0～6 單元規劃）。
// unit0（教室常用語）併入這個清單只是為了讓編號連貫，unit_completion 判斷邏輯
// （isUnitCompletionAchieved()）明確排除 unit0，它已經有專屬的 OB-02 新手徽章。
const UNITS: UnitConfig[] = [
  { key: "unit0", label: "單元 0：教室常用語", topicFileKeys: ["greetings", "pronouns"] },
  { key: "unit1", label: "單元一：我和身邊的人", topicFileKeys: ["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"] },
  { key: "unit2", label: "單元二：食衣住行", topicFileKeys: ["food_drink", "clothing_accessories", "houses_apartments", "tableware", "bathroom", "transportation"] },
  { key: "unit3", label: "單元三：上學去", topicFileKeys: ["school", "numbers", "colors", "pe_sports", "clubs_hobbies", "science"] },
  { key: "unit4", label: "單元四：大自然與動物", topicFileKeys: ["animals_insects", "weather_nature", "geographical_terms"] },
  { key: "unit5", label: "單元五：生活情境", topicFileKeys: ["places_directions", "occupations", "money", "health"] },
  { key: "unit6", label: "單元六：時間與節日", topicFileKeys: ["time", "calendar", "holidays_festivals", "sizes_measurements"] },
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

// 目前實際已經上架、可以玩的 16 個主題（跟 main.ts 的 TOPICS 一致，含 Unit 0；
// Personal Characteristics 已拆成 appearance／emotions／personality_traits 三個主題）。
const AVAILABLE_TOPIC_FILE_KEYS = new Set([
  "unit_zero",
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
]);

function computeCompletedStageDTopics(profileId: string): Set<string> {
  return new Set(
    [...AVAILABLE_TOPIC_FILE_KEYS].filter((fileKey) => getStageProgress(profileId, fileKey, "capstone") !== null)
  );
}

/** 跟 main.ts computeBadgeViewState() 的 "onboarding"/"unit_completion" 分支邏輯一致。 */
function isFirstStageDAchieved(completedStageDTopics: Set<string>): boolean {
  return completedStageDTopics.size > 0;
}

/** 跟 main.ts computeUnit0MatchingComplete() 邏輯一致：Unit 0 已上架，且這個使用者
 * 已經完成過一輪 unit_zero 主題的 Stage A 單字配對。 */
function isUnit0MatchingComplete(profileId: string): boolean {
  if (!AVAILABLE_TOPIC_FILE_KEYS.has("unit_zero")) return false;
  return getStageProgress(profileId, "unit_zero", "matching") !== null;
}

/** 跟 main.ts computeBadgeViewState() 的 "unit_completion" case 邏輯一致：unit0 明確
 * 排除在外（它已經有專屬的 OB-02 新手徽章，不需要再產生一個語意重複的 unit_completion
 * 徽章），all_topics 只需要 unit1～unit6 全部完成，不需要 unit0。 */
function isUnitCompletionAchieved(badgeIdSuffix: string, completedStageDTopics: Set<string>): boolean {
  const unitsToCheck =
    badgeIdSuffix === "all_topics"
      ? UNITS.filter((u) => u.key !== "unit0")
      : UNITS.filter((u) => u.key === badgeIdSuffix && u.key !== "unit0");
  if (unitsToCheck.length === 0) return false;
  return unitsToCheck.every((unit) =>
    unit.topicFileKeys.every(
      (fileKey) => AVAILABLE_TOPIC_FILE_KEYS.has(fileKey) && completedStageDTopics.has(fileKey)
    )
  );
}

// ---- 測試 1：完全沒有人玩過 Stage D，first_stage_d／unit1／all_topics 全部都還沒達成 ----
{
  const profileId = "test-profile-none";
  const completed = computeCompletedStageDTopics(profileId);
  assert(completed.size === 0, "還沒玩過 Stage D，completedStageDTopics 應該是空集合");
  assert(!isFirstStageDAchieved(completed), "還沒玩過任何 Stage D，first_stage_d 不該達成");
  assert(!isUnitCompletionAchieved("unit1", completed), "還沒玩過任何 Stage D，unit1 不該達成");
  assert(!isUnitCompletionAchieved("all_topics", completed), "還沒玩過任何 Stage D，all_topics 不該達成");
  console.log("✅ 測試 1 通過：完全沒有 Stage D 紀錄時，first_stage_d／unit_completion 都正確判斷為未達成。");
}

// ---- 測試 2：只完成 unit1 裡的 1 個主題（family）的 Stage D ----
{
  const profileId = "test-profile-partial";
  recordStageCompletion(profileId, "family", "capstone", 6, 0);
  const completed = computeCompletedStageDTopics(profileId);
  assert(completed.size === 1 && completed.has("family"), "只玩過 family 的 Stage D，completedStageDTopics 應該只有 family");
  assert(isFirstStageDAchieved(completed), "已經通過至少一次 Stage D，first_stage_d 應該達成");
  assert(!isUnitCompletionAchieved("unit1", completed), "unit1 還有 5 個主題沒通過 Stage D，不該算完成");
  console.log("✅ 測試 2 通過：只完成單元一裡 1 個主題的 Stage D 時，first_stage_d 達成但 unit1 尚未完成。");
}

// ---- 測試 3：unit1 規劃的 6 個主題（Personal Characteristics 拆成 appearance／emotions／
//      personality_traits 三個之後，unit1 從 4 個主題變成 6 個）全部通過 Stage D，
//      unit1 應該算完成，但 all_topics 還不算 ----
{
  const profileId = "test-profile-unit1-complete";
  for (const fileKey of ["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"]) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
  }
  const completed = computeCompletedStageDTopics(profileId);
  assert(completed.size === 6, "單元一 6 個主題都要通過 Stage D");
  assert(isUnitCompletionAchieved("unit1", completed), "單元一規劃的 6 個主題都通過 Stage D，unit1 應該算完成");
  assert(
    !isUnitCompletionAchieved("all_topics", completed),
    "單元二～六規劃的主題都還沒做出來，all_topics 不該算完成"
  );
  assert(!isUnitCompletionAchieved("unit3", completed), "unit3 需要 colors 之外還有 school/numbers/pe_sports/clubs_hobbies/science，還沒完成");
  console.log("✅ 測試 3 通過：單元一規劃的 6 個主題全數通過 Stage D 後，unit1 正確算完成，all_topics 仍未達成。");
}

// ---- 測試 4：即使 colors／animals_insects（unit3／unit4 的一部分）都通過 Stage D，
//      unit3 還缺 school/numbers 的 Stage D 紀錄（這個測試的使用者沒玩過，即使內容已經
//      上架）、unit4 缺的 weather_nature/geographical_terms 兩個主題內容本身還沒做出來——
//      這是「比對完整規劃清單，不是只看已上架主題」的關鍵行為，兩種「不完成」的原因都要測到。 ----
{
  const profileId = "test-profile-colors-animals";
  for (const fileKey of ["colors", "animals_insects"]) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
  }
  const completed = computeCompletedStageDTopics(profileId);
  assert(!isUnitCompletionAchieved("unit3", completed), "這個使用者沒玩過 school/numbers 的 Stage D，unit3 不該算完成");
  assert(!isUnitCompletionAchieved("unit4", completed), "weather_nature/geographical_terms 還沒上架，unit4 不該算完成");
  console.log("✅ 測試 4 通過：即使已上架主題的 Stage D 都通過，缺其他主題（不論是內容還沒上架、還是這個使用者還沒玩過）都會讓對應單元正確保持未完成。");
}

// ---- 測試 9：unit3（School／Numbers／Colors／PE / Sports／Clubs & Hobbies／Science）
//      六個主題內容現在都已經上架，實際用真正的 progress.ts 操作完六個主題的 Stage D，
//      unit3 應該從未完成變成已完成——不是只憑程式碼邏輯推論，這裡真的呼叫
//      recordStageCompletion() 六次來驗證（2026-08-24：pe_sports／clubs_hobbies 從單元六
//      原本規劃的「Sports/interests/hobbies」拆出並移入單元三，unit3 從 3 個主題變 5 個；
//      2026-08-25：Numbers 改名擴充為 Math、新增 Science 主題，unit3 再變成 6 個，見
//      docs/content-plan.md 3.1 節對應日期的註）。 ----
{
  const profileId = "test-profile-unit3-complete";
  const completedBefore = computeCompletedStageDTopics(profileId);
  assert(!isUnitCompletionAchieved("unit3", completedBefore), "還沒玩過任何 unit3 主題的 Stage D，unit3 不該算完成");

  for (const fileKey of ["school", "numbers", "colors", "pe_sports", "clubs_hobbies", "science"]) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
  }
  const completedAfter = computeCompletedStageDTopics(profileId);
  assert(completedAfter.size === 6, "unit3 規劃的 6 個主題都要通過 Stage D");
  assert(
    isUnitCompletionAchieved("unit3", completedAfter),
    "School／Numbers／Colors／PE / Sports／Clubs & Hobbies／Science 六個主題都通過 Stage D 後，unit3 應該正確判斷為完成"
  );
  assert(
    !isUnitCompletionAchieved("all_topics", completedAfter),
    "unit1／unit2 規劃的主題這個使用者都還沒玩過，all_topics 不該算完成"
  );
  console.log("✅ 測試 9 通過：實際操作 School／Numbers／Colors／PE / Sports／Clubs & Hobbies／Science 六個主題的 Stage D 後，unit3 真的從未完成變成已完成。");
}

// ---- 測試 5：不同使用者（profileId）的 Stage D 完成紀錄互相獨立 ----
{
  const completedA = computeCompletedStageDTopics("test-profile-none");
  const completedB = computeCompletedStageDTopics("test-profile-unit1-complete");
  assert(completedA.size === 0, "test-profile-none 不該受其他使用者影響");
  assert(completedB.size === 6, "test-profile-unit1-complete 應該維持 6 個已完成主題");
  console.log("✅ 測試 5 通過：不同使用者的 Stage D 完成紀錄互相獨立，不會互相污染。");
}

// ---- 測試 6：還沒玩過 Unit 0 的 Stage A 配對，unit0_complete 不該達成 ----
{
  const profileId = "test-profile-unit0-none";
  assert(!isUnit0MatchingComplete(profileId), "還沒玩過 unit_zero 的 Stage A 配對，unit0_complete 不該達成");
  console.log("✅ 測試 6 通過：還沒玩過 Unit 0 的 Stage A 配對時，unit0_complete 正確判斷為未達成。");
}

// ---- 測試 7：完成一輪 unit_zero 的 Stage A 配對後，unit0_complete 應該達成 ----
{
  const profileId = "test-profile-unit0-done";
  recordStageCompletion(profileId, "unit_zero", "matching", 16, 0);
  assert(isUnit0MatchingComplete(profileId), "完成過一輪 unit_zero 的 Stage A 配對，unit0_complete 應該達成");
  console.log("✅ 測試 7 通過：完成一輪 Unit 0 的 Stage A 配對後，unit0_complete 正確判斷為達成。");
}

// ---- 測試 8：只完成「其他主題」的 Stage A 配對，不該誤判 unit0_complete 達成——
//      必須明確是 unit_zero 這個主題本身，不能被隨便哪個主題的配對完成紀錄帶過。 ----
{
  const profileId = "test-profile-unit0-other-topic-only";
  recordStageCompletion(profileId, "family", "matching", 21, 0);
  assert(
    !isUnit0MatchingComplete(profileId),
    "只完成 family 的 Stage A 配對，不是 unit_zero 本身，unit0_complete 不該達成"
  );
  console.log("✅ 測試 8 通過：只完成其他主題的 Stage A 配對時，不會誤判成 Unit 0 已完成。");
}

// ---- 測試 10：即使 unit_zero 主題本身通過 Stage D，unit0 也不該被誤判成
//      unit_completion 達成——unit0 明確排除在外，它有專屬的 OB-02 新手徽章，
//      不應該讓 UNITS 陣列多了一個 unit0 項目就意外多出一個可達成的 unit_completion
//      徽章（badges.json 本來就不會有 badge.unit_completion.unit0 這個 ID，這裡主要
//      是確保程式邏輯遇到 unit0 這個 key 時的行為符合預期，不會因為陣列多一項就出錯）。 ----
{
  const profileId = "test-profile-unit0-stage-d";
  recordStageCompletion(profileId, "unit_zero", "capstone", 16, 0);
  const completed = computeCompletedStageDTopics(profileId);
  assert(completed.has("unit_zero"), "這個使用者應該已經通過 unit_zero 的 Stage D");
  assert(
    !isUnitCompletionAchieved("unit0", completed),
    "即使 unit_zero 通過 Stage D，unit0 也不該被判斷為 unit_completion 達成（明確排除在外）"
  );
  assert(
    !isUnitCompletionAchieved("all_topics", completed),
    "unit1～unit6 規劃的主題這個使用者都還沒玩過，all_topics 不該算完成（unit0 完成與否不影響 all_topics）"
  );
  console.log("✅ 測試 10 通過：unit_zero 通過 Stage D 不會誤判 unit0 的 unit_completion 達成，all_topics 也不受影響。");
}

// ---- 測試 11：unit7（文法小幫手，11 個主題：Advanced Pronouns／Wh-Words & Frequency／
//      Articles & Determiners／Sentence Connectors／Prepositions／Other Nouns／
//      Other Verbs I／Other Verbs II／Other Adjectives I／Other Adjectives II／
//      Other Adverbs & Responses）內容已經全數上架，實際操作完 11 個主題的 Stage D，
//      unit7 應該從未完成變成已完成（2026-08-25：新增單元七，見 docs/content-plan.md
//      3.1 節對應日期的註）。 ----
{
  const profileId = "test-profile-unit7-complete";
  const unit7FileKeys = [
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
  const completedBefore = computeCompletedStageDTopics(profileId);
  assert(!isUnitCompletionAchieved("unit7", completedBefore), "還沒玩過任何 unit7 主題的 Stage D，unit7 不該算完成");

  for (const fileKey of unit7FileKeys) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
  }
  const completedAfter = computeCompletedStageDTopics(profileId);
  assert(completedAfter.size === unit7FileKeys.length, "unit7 規劃的 11 個主題都要通過 Stage D");
  assert(
    isUnitCompletionAchieved("unit7", completedAfter),
    "單元七規劃的 11 個主題都通過 Stage D 後，unit7 應該正確判斷為完成"
  );
  assert(
    !isUnitCompletionAchieved("all_topics", completedAfter),
    "unit1～unit6 規劃的主題這個使用者都還沒玩過，all_topics 不該算完成"
  );
  console.log("✅ 測試 11 通過：實際操作單元七 11 個主題的 Stage D 後，unit7 真的從未完成變成已完成。");
}

console.log("\n✅ 全部 OB-02／OB-03／unit_completion 徽章判斷邏輯驗證通過。");
