// 對應 content/schema/vocab.schema.json 的型別定義。
// 注意：這裡只是「讀取端」的型別鏡射，不是資料驗證。
// 若要驗證資料是否符合 schema，應該另外寫一支跑 ajv 之類工具的 content 驗證 script，
// 不要在這裡做，也不要因為型別需求反過來更動 content/ 的資料結構。

export type Status = "draft" | "reviewed" | "published";

export interface Vocab {
  id: string; // voc.<topic>.<3位數字>
  en: string;
  zh: string;
  pos: string;
  topic: string;
  scope: string; // 目前固定 "gept_kids"
  difficulty_tier: 1 | 2 | 3;
  ipa: string | null;
  audio: string | null;
  image: string | null;
  sense_of: string | null;
  related_forms: string[];
  /** 這個單字專屬的例句（跟 content/sentences/<topic>.json 的 Stage B 多字綜合例句不同，
   * 這裡只圍繞這一個單字本身），給「字卡記憶」學習單元（flashcards stage）用。
   * 選填欄位：目前只有部分主題的 vocab JSON 有補這個欄位，其餘主題的 vocab 物件裡
   * 完全沒有這個 key（等同 undefined），跟「有這個 key 但值是 null」視為同一種情況處理。 */
  example_sentence?: { en: string; zh: string; status: Status } | null;
  source: string;
  status: Status;
}

export interface Sentence {
  id: string; // sent.<topic>.<stage>.<3位數字>
  en: string;
  zh: string;
  topic: string;
  stage: "A" | "B" | "C" | "D";
  grammar_point: string;
  vocab_ids: string[];
  audio: string | null;
  status: Status;
}

export interface PassageQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  type: string; // 例如 "single_choice"
  /** 給 Stage D 綜合關卡「播放這句」朗讀按鈕用的完整英文句子。兩種來源：
   * (1) 短文理解題（content/passages/<topic>.json 裡的 questions[]）：這一題答案對應到
   *     passage.text 裡的哪一句（原文照抄，逐字一致）；不是每題都填得出來（例如需要合併
   *     好幾句才答得出來的題目可以留 null），沒有值時退回播放整篇短文。
   * (2) 短句填空題（capstoneQuestions.ts 執行期組出來的 "capstone.sentence.*"）：題目文字
   *     本身把答案挖空了（例如 "My bag is ____"），這裡填挖空前的完整原句，讓使用者可以
   *     聽完整句發音、從聽力上判斷該填哪個字，一定會有值。
   * 單字題（"capstone.vocab.*"）不會有這個欄位（undefined）——題目文字本身已經把英文單字
   * 寫出來了（例如 "school" 是什麼意思？），不需要額外的聽力提示。 */
  source_sentence?: string | null;
  /** 給「字卡暖身」學習單元（flashcardQuestions.ts）的聽音出題型（聽音選英文／聽音選中文）用：
   * 這一題要唸出來的英文字（通常就是題目對應的 vocab.en）。有這個欄位時，作答畫面要顯示
   * 「播放語音」按鈕，題目文字本身不能直接寫出這個英文字，不然小朋友用讀的就能作答，
   * 沒有真的在考聽力。純粹是執行期組出來的合成欄位（跟 source_sentence 不同，這個欄位
   * 不會出現在 content/passages/<topic>.json 裡，也不需要寫進 passage.schema.json）。 */
  listen_word?: string | null;
  /** 給「字卡暖身」學習單元用：這一題對應單字的英文／中文（跟 `answer` 不一樣——`answer`
   * 只是「這一題考的方向」的正確選項文字，中翻英題的 `answer` 是英文、聽音選中文題的
   * `answer` 是中文，並不會固定是英文拼字）。答完之後（不管答對還是答錯）都要把這兩個
   * 顯示出來，讓使用者能看到完整的「英文－中文」配對——尤其聽音選中文這種題型，畫面上
   * 原本完全不會出現英文拼字，只靠聲音作答，使用者反應希望看得到文字對照。 */
  reveal_en?: string;
  reveal_zh?: string;
}

export interface Passage {
  id: string; // pass.<topic>.<id>
  title: string;
  topic: string;
  text: string;
  sentence_ids: string[];
  vocab_ids: string[];
  questions: PassageQuestion[];
  status: Status;
}

// 對應 content/schema/badge.schema.json ——成就徽章的正式資料格式（見 content/badges/badges.json）。
export type BadgeCategory =
  | "onboarding"
  | "vocab_milestone"
  | "questions_milestone"
  | "game_mastery"
  | "unit_completion"
  | "streak"
  | "total_days"
  | "performance"
  | "favorites"
  | "healthy_habit";

export interface Badge {
  id: string;
  code: string; // 例如 "VM-01"
  name: string;
  description: string;
  condition: string;
  category: BadgeCategory;
  type: "one_time" | "repeatable";
  reset_on_achieve: boolean;
  display_count: boolean;
  tier_group: string | null;
  tier_level: number | null;
  threshold: number | null;
  icon_placeholder: string | null;
  status: Status;
}
