// 驗證 Phase 2 新接上的三個徽章判斷邏輯：
// - OB-02（badge.onboarding.unit0_complete）：單元 0「教室常用語」主題的 Stage A 單字配對
//   完成過一輪，就算「完成 Unit 0 全部單字練習」（MatchingGame 要求全部單字都配對成功
//   才算完成一輪，不需要連 Stage B/C/D 都通過）。
// - OB-03（badge.onboarding.first_stage_d）：任一主題第一次「完整完成」就算達成——
//   2026-09-27 起，「完整完成」的定義從「只要通過 Stage D」改成「通過 Stage D，且如果
//   這個主題已經有 Stage E 會話練習內容，也要一併通過 Stage E」（沒有 Stage E 內容的
//   主題則維持只看 Stage D，見下方 hasStageEContent() 的防呆說明）。
// - WC-01~08（badge.unit_completion.unit1~unit7／all_topics）：要「這個單元規劃的
//   全部主題」都存在於目前已上架的主題清單裡、而且每個都符合上面的「完整完成」定義，
//   才算這個單元完成；all_topics 則是 unit1～unit7 都要完成（unit0 明確排除在外，見下方
//   UNITS 常數說明）。
//   （2026-08-25：新增單元七「文法小幫手」11 個主題，WC-07 all_topics 徽章的 code
//   往後遞補一位變成 WC-08，是刻意調整不是漏改，見 content/badges/badges.json。）
//
// main.ts 裡的 computeCompletedTopics() / computeBadgeViewState() 的 unit_completion
// 分支就是這裡驗證的邏輯，但 main.ts 本身因為用了 Vite 專屬的 import.meta.glob 沒辦法在
// plain tsx 下直接 import，所以這裡重建一份跟 main.ts 邏輯一致的最小版本來驗證
//（同樣的作法沿用自其他 verify-*.ts，例如 verify-passage-glossary.ts）。
// progress.ts 本身不依賴 import.meta.glob，可以直接 import 真正的模組來測。
// 用法：npx tsx scripts/verify-unit-completion-badges.ts
//
// progress.ts 在 Node 環境跑沒有瀏覽器的 localStorage，跟 verify-progress-logic.ts
// 同一套做法：先塞一個最陽春的 in-memory 假 localStorage 進 globalThis.window，
// 再用動態 import 載入 progress.ts，讓裡面的 window.localStorage 呼叫可以正常運作。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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

// 這裡不 import content.ts 的 getConversationByTopic()（會牽動 import.meta.glob），
// 改成直接用「這個主題的 fileKey 底下有沒有 content/conversations/<fileKey>.json」來
// 判斷有沒有 Stage E 內容，跟 main.ts 用 getConversationByTopic() 判斷的結果等價。
// unit_zero 這個舊主題（已經拆成 greetings／pronouns 兩個新主題）本來就沒有專屬的
// conversations 檔案，天生就是「沒有 Stage E 內容」的防呆情境，不用另外造假資料。
const CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../content/conversations");
function hasStageEContent(fileKey: string): boolean {
  try {
    readFileSync(path.join(CONTENT_DIR, `${fileKey}.json`));
    return true;
  } catch {
    return false;
  }
}
assert(!hasStageEContent("unit_zero"), "unit_zero 應該沒有對應的 conversations 內容檔（拿來當作沒有 Stage E 內容的防呆測試情境）");
assert(hasStageEContent("family"), "family 應該有對應的 conversations 內容檔");

/** 跟 main.ts computeCompletedTopics() 邏輯一致：先看 Stage D 有沒有通過，沒通過直接
 * 不算完成；通過的話，再看這個主題有沒有 Stage E 內容——沒有就直接算完成（防呆：避免
 * 未來新增暫時性、還沒做 Stage E 的主題時，玩家永遠拿不到完成徽章），有的話就還要
 * Stage E 也通過才算完成。 */
function computeCompletedTopics(profileId: string): Set<string> {
  return new Set(
    [...AVAILABLE_TOPIC_FILE_KEYS].filter((fileKey) => {
      const stageDDone = getStageProgress(profileId, fileKey, "capstone") !== null;
      if (!stageDDone) return false;
      if (!hasStageEContent(fileKey)) return true;
      return getStageProgress(profileId, fileKey, "conversation") !== null;
    })
  );
}

/** 跟 main.ts computeBadgeViewState() 的 "onboarding"/"unit_completion" 分支邏輯一致。 */
function isFirstStageDAchieved(completedTopics: Set<string>): boolean {
  return completedTopics.size > 0;
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
function isUnitCompletionAchieved(badgeIdSuffix: string, completedTopics: Set<string>): boolean {
  const unitsToCheck =
    badgeIdSuffix === "all_topics"
      ? UNITS.filter((u) => u.key !== "unit0")
      : UNITS.filter((u) => u.key === badgeIdSuffix && u.key !== "unit0");
  if (unitsToCheck.length === 0) return false;
  return unitsToCheck.every((unit) =>
    unit.topicFileKeys.every(
      (fileKey) => AVAILABLE_TOPIC_FILE_KEYS.has(fileKey) && completedTopics.has(fileKey)
    )
  );
}

// ---- 測試 1：完全沒有人玩過 Stage D，first_stage_d／unit1／all_topics 全部都還沒達成 ----
{
  const profileId = "test-profile-none";
  const completed = computeCompletedTopics(profileId);
  assert(completed.size === 0, "還沒玩過 Stage D，completedTopics 應該是空集合");
  assert(!isFirstStageDAchieved(completed), "還沒玩過任何 Stage D，first_stage_d 不該達成");
  assert(!isUnitCompletionAchieved("unit1", completed), "還沒玩過任何 Stage D，unit1 不該達成");
  assert(!isUnitCompletionAchieved("all_topics", completed), "還沒玩過任何 Stage D，all_topics 不該達成");
  console.log("✅ 測試 1 通過：完全沒有 Stage D 紀錄時，first_stage_d／unit_completion 都正確判斷為未達成。");
}

// ---- 測試 2（新版）：只通過 family 的 Stage D、沒通過 Stage E，family 不該算「完整完成」，
//      first_stage_d 也不該達成——這是這次改版最重要的行為驗證：以前 Stage D 通過就算數，
//      現在必須 Stage D + Stage E 都通過才算數。接著補上 Stage E，family 才變成完整完成，
//      first_stage_d 才變成達成。 ----
{
  const profileId = "test-profile-partial";
  recordStageCompletion(profileId, "family", "capstone", 6, 0);
  const completedStageDOnly = computeCompletedTopics(profileId);
  assert(
    completedStageDOnly.size === 0,
    "family 只通過 Stage D、還沒通過 Stage E，completedTopics 應該還是空集合"
  );
  assert(
    !isFirstStageDAchieved(completedStageDOnly),
    "只通過 Stage D、沒通過 Stage E，first_stage_d 不該達成（這是這次改版的關鍵行為）"
  );
  assert(!isUnitCompletionAchieved("unit1", completedStageDOnly), "unit1 還有 6 個主題沒完整完成，不該算完成");

  recordStageCompletion(profileId, "family", "conversation", 12, 0);
  const completedAfterStageE = computeCompletedTopics(profileId);
  assert(
    completedAfterStageE.size === 1 && completedAfterStageE.has("family"),
    "family 通過 Stage D 又通過 Stage E 後，completedTopics 應該包含 family"
  );
  assert(
    isFirstStageDAchieved(completedAfterStageE),
    "family 已經完整完成（Stage D + Stage E），first_stage_d 應該達成"
  );
  assert(!isUnitCompletionAchieved("unit1", completedAfterStageE), "unit1 還有 5 個主題沒完整完成，不該算完成");
  console.log("✅ 測試 2 通過：只通過 Stage D、未通過 Stage E 時 first_stage_d 不達成；補上 Stage E 後才正確變成達成。");
}

// ---- 測試 3：unit1 規劃的 6 個主題（Personal Characteristics 拆成 appearance／emotions／
//      personality_traits 三個之後，unit1 從 4 個主題變成 6 個）全部完整完成（Stage D +
//      Stage E），unit1 應該算完成，但 all_topics 還不算 ----
{
  const profileId = "test-profile-unit1-complete";
  for (const fileKey of ["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"]) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
    recordStageCompletion(profileId, fileKey, "conversation", 12, 0);
  }
  const completed = computeCompletedTopics(profileId);
  assert(completed.size === 6, "單元一 6 個主題都要完整完成（Stage D + Stage E）");
  assert(isUnitCompletionAchieved("unit1", completed), "單元一規劃的 6 個主題都完整完成，unit1 應該算完成");
  assert(
    !isUnitCompletionAchieved("all_topics", completed),
    "單元二～六規劃的主題都還沒做出來，all_topics 不該算完成"
  );
  assert(!isUnitCompletionAchieved("unit3", completed), "unit3 需要 colors 之外還有 school/numbers/pe_sports/clubs_hobbies/science，還沒完成");
  console.log("✅ 測試 3 通過：單元一規劃的 6 個主題全數完整完成後，unit1 正確算完成，all_topics 仍未達成。");
}

// ---- 測試 4：即使 colors／animals_insects（unit3／unit4 的一部分）都完整完成，
//      unit3 還缺 school/numbers 的完成紀錄（這個測試的使用者沒玩過，即使內容已經
//      上架）、unit4 缺的 weather_nature/geographical_terms 兩個主題內容本身還沒做出來——
//      這是「比對完整規劃清單，不是只看已上架主題」的關鍵行為，兩種「不完成」的原因都要測到。 ----
{
  const profileId = "test-profile-colors-animals";
  for (const fileKey of ["colors", "animals_insects"]) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
    recordStageCompletion(profileId, fileKey, "conversation", 12, 0);
  }
  const completed = computeCompletedTopics(profileId);
  assert(!isUnitCompletionAchieved("unit3", completed), "這個使用者沒玩過 school/numbers，unit3 不該算完成");
  assert(!isUnitCompletionAchieved("unit4", completed), "weather_nature/geographical_terms 還沒上架，unit4 不該算完成");
  console.log("✅ 測試 4 通過：即使已上架主題都完整完成，缺其他主題（不論是內容還沒上架、還是這個使用者還沒玩過）都會讓對應單元正確保持未完成。");
}

// ---- 測試 9：unit3（School／Numbers／Colors／PE / Sports／Clubs & Hobbies／Science）
//      六個主題內容現在都已經上架，實際用真正的 progress.ts 操作完六個主題的 Stage D +
//      Stage E，unit3 應該從未完成變成已完成——不是只憑程式碼邏輯推論，這裡真的呼叫
//      recordStageCompletion() 來驗證（2026-08-24：pe_sports／clubs_hobbies 從單元六
//      原本規劃的「Sports/interests/hobbies」拆出並移入單元三，unit3 從 3 個主題變 5 個；
//      2026-08-25：Numbers 改名擴充為 Math、新增 Science 主題，unit3 再變成 6 個，見
//      docs/content-plan.md 3.1 節對應日期的註）。 ----
{
  const profileId = "test-profile-unit3-complete";
  const completedBefore = computeCompletedTopics(profileId);
  assert(!isUnitCompletionAchieved("unit3", completedBefore), "還沒玩過任何 unit3 主題，unit3 不該算完成");

  for (const fileKey of ["school", "numbers", "colors", "pe_sports", "clubs_hobbies", "science"]) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
    recordStageCompletion(profileId, fileKey, "conversation", 12, 0);
  }
  const completedAfter = computeCompletedTopics(profileId);
  assert(completedAfter.size === 6, "unit3 規劃的 6 個主題都要完整完成");
  assert(
    isUnitCompletionAchieved("unit3", completedAfter),
    "School／Numbers／Colors／PE / Sports／Clubs & Hobbies／Science 六個主題都完整完成後，unit3 應該正確判斷為完成"
  );
  assert(
    !isUnitCompletionAchieved("all_topics", completedAfter),
    "unit1／unit2 規劃的主題這個使用者都還沒玩過，all_topics 不該算完成"
  );
  console.log("✅ 測試 9 通過：實際操作 School／Numbers／Colors／PE / Sports／Clubs & Hobbies／Science 六個主題完整完成後，unit3 真的從未完成變成已完成。");
}

// ---- 測試 5：不同使用者（profileId）的完成紀錄互相獨立 ----
{
  const completedA = computeCompletedTopics("test-profile-none");
  const completedB = computeCompletedTopics("test-profile-unit1-complete");
  assert(completedA.size === 0, "test-profile-none 不該受其他使用者影響");
  assert(completedB.size === 6, "test-profile-unit1-complete 應該維持 6 個已完整完成主題");
  console.log("✅ 測試 5 通過：不同使用者的完成紀錄互相獨立，不會互相污染。");
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

// ---- 測試 10：unit_zero 這個主題沒有對應的 Stage E 會話練習內容（已經拆成 greetings／
//      pronouns 兩個新主題，見上方 hasStageEContent() 說明），所以只要通過 Stage D 就該算
//      完整完成——這正是這次改版要求的「沒有 Stage E 內容的主題，Stage D 就足夠」防呆情境
//      的真實測試案例，不需要另外造假資料。同時 unit0 這個單元本身仍然明確排除在
//      unit_completion 判斷之外（它有專屬的 OB-02 新手徽章）。 ----
{
  const profileId = "test-profile-unit0-stage-d";
  recordStageCompletion(profileId, "unit_zero", "capstone", 16, 0);
  const completed = computeCompletedTopics(profileId);
  assert(
    completed.has("unit_zero"),
    "unit_zero 沒有 Stage E 內容，只要通過 Stage D 就該算完整完成（fallback 防呆邏輯）"
  );
  assert(
    !isUnitCompletionAchieved("unit0", completed),
    "即使 unit_zero 完整完成，unit0 也不該被判斷為 unit_completion 達成（明確排除在外）"
  );
  assert(
    !isUnitCompletionAchieved("all_topics", completed),
    "unit1～unit6 規劃的主題這個使用者都還沒玩過，all_topics 不該算完成（unit0 完成與否不影響 all_topics）"
  );
  console.log("✅ 測試 10 通過：沒有 Stage E 內容的主題（unit_zero）只要通過 Stage D 就正確算完整完成，unit0／all_topics 判斷也不受影響。");
}

// ---- 測試 11：unit7（文法小幫手，11 個主題：Advanced Pronouns／Wh-Words & Frequency／
//      Articles & Determiners／Sentence Connectors／Prepositions／Other Nouns／
//      Other Verbs I／Other Verbs II／Other Adjectives I／Other Adjectives II／
//      Other Adverbs & Responses）內容已經全數上架且都有 Stage E，實際操作完 11 個主題的
//      Stage D + Stage E，unit7 應該從未完成變成已完成（2026-08-25：新增單元七，見
//      docs/content-plan.md 3.1 節對應日期的註）。 ----
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
  const completedBefore = computeCompletedTopics(profileId);
  assert(!isUnitCompletionAchieved("unit7", completedBefore), "還沒玩過任何 unit7 主題，unit7 不該算完成");

  for (const fileKey of unit7FileKeys) {
    recordStageCompletion(profileId, fileKey, "capstone", 6, 0);
    recordStageCompletion(profileId, fileKey, "conversation", 12, 0);
  }
  const completedAfter = computeCompletedTopics(profileId);
  assert(completedAfter.size === unit7FileKeys.length, "unit7 規劃的 11 個主題都要完整完成");
  assert(
    isUnitCompletionAchieved("unit7", completedAfter),
    "單元七規劃的 11 個主題都完整完成後，unit7 應該正確判斷為完成"
  );
  assert(
    !isUnitCompletionAchieved("all_topics", completedAfter),
    "unit1～unit6 規劃的主題這個使用者都還沒玩過，all_topics 不該算完成"
  );
  console.log("✅ 測試 11 通過：實際操作單元七 11 個主題完整完成後，unit7 真的從未完成變成已完成。");
}

// ---- 測試 12：main.ts 原始碼結構檢查——確認 computeCompletedStageDTopics 已經改名成
//      computeCompletedTopics、內部真的呼叫了 getConversationByTopic()（不是只改名字、
//      邏輯沒變），而且全檔案不再有任何 completedStageDTopics 字串殘留，
//      "onboarding"／"unit_completion" 兩處分支也都改用新的 completedTopics 名稱。 ----
{
  const mainTsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/main.ts");
  const mainTs = readFileSync(mainTsPath, "utf-8");

  assert(mainTs.includes("function computeCompletedTopics("), "main.ts 應該要有改名後的 computeCompletedTopics() 函式");
  assert(
    !mainTs.includes("computeCompletedStageDTopics"),
    "main.ts 不該再有舊名稱 computeCompletedStageDTopics 殘留"
  );
  assert(!mainTs.includes("completedStageDTopics"), "main.ts 不該再有任何 completedStageDTopics 字串殘留");

  const computeFnStart = mainTs.indexOf("function computeCompletedTopics(");
  const computeFnBody = mainTs.slice(computeFnStart, computeFnStart + 800);
  assert(
    computeFnBody.includes("getConversationByTopic"),
    "computeCompletedTopics() 內部應該要呼叫 getConversationByTopic() 判斷這個主題有沒有 Stage E 內容"
  );
  assert(
    computeFnBody.includes(`"capstone"`) && computeFnBody.includes(`"conversation"`),
    "computeCompletedTopics() 應該同時檢查 capstone（Stage D）與 conversation（Stage E）兩個 stageKey"
  );

  assert(
    mainTs.includes("completedTopics: Set<string>"),
    "computeBadgeViewState() 的參數應該改名為 completedTopics"
  );
  assert(
    mainTs.includes("badge.onboarding.first_stage_d") && mainTs.includes("completedTopics.size > 0"),
    "onboarding 分支的 first_stage_d 判斷應該改用 completedTopics"
  );
  assert(
    mainTs.includes("completedTopics.has(fileKey)"),
    "unit_completion 分支的判斷應該改用 completedTopics"
  );

  console.log("✅ 測試 12 通過：main.ts 內 computeCompletedStageDTopics → computeCompletedTopics 改名與 Stage E 邏輯、所有呼叫點的變數改名都正確無誤。");
}

console.log("\n✅ 全部 OB-02／OB-03／unit_completion 徽章判斷邏輯驗證通過。");
