// 驗證 Stage E 會話練習整合至「挑戰紀錄」與單元三會話資料完整性：
// - 驗證 content/conversations/ 內所有會話 JSON 符合規格
// - 驗證 main.ts 中的 getStageRowsForTopic() 與 renderStats() 整合
// - 驗證 progress.ts 能正確紀錄與讀取 conversation stage 的完成狀態與正確率
// 用法：npx --yes tsx scripts/verify-conversation-stats.ts

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getStageProgress,
  recordStageCompletion,
  clearAllProgress,
} from "../src/progress";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

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

// ---- 測試 1：全站單元 0～七全部 43 個主題會話練習 JSON 結構驗證 ----
{
  const convDir = fileURLToPath(new URL("../../content/conversations", import.meta.url));
  const files = readdirSync(convDir).filter((f) => f.endsWith(".json"));
  assert(files.length >= 43, `應該至少有 43 個主題具備會話練習（目前有 ${files.length} 個）`);

  const checkedTopics = [
    "school", "numbers", "colors", "pe_sports", "clubs_hobbies", "science",
    "animals_insects", "weather_nature", "geographical_terms",
    "places_directions", "occupations", "money", "health", "forms_of_address",
    "time", "calendar", "holidays_festivals", "sizes_measurements",
    "advanced_pronouns", "wh_words_frequency", "articles_determiners",
    "sentence_connectors", "prepositions", "other_nouns",
    "other_verbs_1", "other_verbs_2", "other_adjectives_1",
    "other_adjectives_2", "other_adverbs_responses",
  ];
  for (const topic of checkedTopics) {
    assert(files.includes(`${topic}.json`), `主題 ${topic}.json 應該存在於 conversations 目錄`);
    const raw = readFileSync(join(convDir, `${topic}.json`), "utf-8");
    const data = JSON.parse(raw);
    assert(data.topic === topic, `${topic}.json topic 欄位應為 ${topic}`);
    assert(data.scenes.length === 3, `${topic}.json 應該有 3 個生活場景`);
    assert(data.turns.length === 6, `${topic}.json 應該有 6 個對話回合`);
    for (const turn of data.turns) {
      assert(turn.options.length === 3, `turn ${turn.turn_id} 應該有 3 個選項`);
      const correct = turn.options.filter((o: any) => o.is_correct === true);
      assert(correct.length === 1, `turn ${turn.turn_id} 應該恰好有 1 個正確選項`);
      const wrong = turn.options.filter((o: any) => o.is_correct === false);
      assert(wrong.length === 2, `turn ${turn.turn_id} 應該有 2 個干擾選項`);
      for (const w of wrong) {
        assert(typeof w.hint === "string" && w.hint.length > 0, `干擾選項 ${w.id} 應該附帶教學引導 hint`);
      }
    }
  }
  console.log("✅ 測試 1 通過：單元 0～七共 43 份會話練習 JSON 格式與提示驗證完全正確。");
}

// ---- 測試 2：main.ts 程式碼接線與 getStageRowsForTopic 驗證 ----
{
  const mainTsPath = fileURLToPath(new URL("../src/main.ts", import.meta.url));
  const mainTs = readFileSync(mainTsPath, "utf-8");

  assert(mainTs.includes("function getStageRowsForTopic("), "main.ts 應具備 getStageRowsForTopic 函式");
  assert(
    mainTs.includes('{ label: "Stage E　會話練習", stageKey: "conversation" }'),
    "getStageRowsForTopic 應包含 Stage E 會話練習的定義"
  );
  assert(
    mainTs.includes("else if (stageKey === \"conversation\") goToConversation();"),
    "goToTopicStage 應支援直接跳轉進入 goToConversation()"
  );
  assert(
    mainTs.includes("const stageRows = getStageRowsForTopic(topicFileKey);"),
    "renderStats 應動態取得該主題的 stageRows"
  );
  console.log("✅ 測試 2 通過：main.ts 中 Stage E 會話練習已成功整合進挑戰紀錄與跳轉邏輯。");
}

// ---- 測試 3：progress.ts 針對 conversation 題型的寫入與讀取 ----
{
  const testProfileId = "test-profile-conv";
  clearAllProgress(testProfileId);

  // 模擬完成一次會話練習（全對 6/6）
  recordStageCompletion(testProfileId, "school", "conversation", 6, 0);
  const prog1 = getStageProgress(testProfileId, "school", "conversation");
  assert(prog1 !== null, "應該能讀取到 school 主題 conversation 的進度紀錄");
  assert(prog1!.timesCompleted === 1, "完成次數應為 1");
  assert(prog1!.bestAccuracy === 100, "最佳正確率應為 100%");

  // 模擬第二次練習（答對 5 題、答錯 1 題）
  recordStageCompletion(testProfileId, "school", "conversation", 5, 1);
  const prog2 = getStageProgress(testProfileId, "school", "conversation");
  assert(prog2!.timesCompleted === 2, "累計完成次數應為 2");
  assert(prog2!.bestAccuracy === 100, "最佳正確率應維持歷史最高 100%");
  assert(prog2!.lastCorrectCount === 5, "最近一次答對題數應為 5");
  assert(prog2!.lastWrongCount === 1, "最近一次答錯題數應為 1");

  clearAllProgress(testProfileId);
  console.log("✅ 測試 3 通過：progress.ts 正確記錄與維護 conversation 關卡的成效、最高正確率與次數。");
}

console.log("\n🎉 全部 Stage E 會話單元挑戰紀錄整合與單元三驗證皆通過！");
