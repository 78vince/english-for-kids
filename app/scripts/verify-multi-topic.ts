// 驗證多主題擴充後，main.ts 用的內容過濾規則（單字 status=published、句子 stage=B
// 且 status=published、短文 status=published）對全部 6 個主題（Phase 2 新增 People／
// Personal Characteristics／Parts of Body 之後）都能載入齊全，而且五種題型
// （Stage A→B-1→B-2→C→D）都能真的用這些資料跑出至少一輪。
// 這支 script 直接模擬 main.ts 的 loadTopicContent() 邏輯，不是重複測試個別題型
// 已經驗證過的細節（那些交給 verify-matching-logic.ts 等既有 script）；
// Stage D 用的是 capstoneQuestions.ts 的 buildCapstoneQuestions()，跟 main.ts 的
// goToCapstone() 是同一套組題邏輯。
// 用法：npx tsx scripts/verify-multi-topic.ts

import { readFileSync } from "node:fs";
import { MatchingGame } from "../src/matchingGame";
import { OrderingGame } from "../src/orderingGame";
import { FillBlankGame } from "../src/fillBlankGame";
import { ChoiceGame } from "../src/choiceGame";
import { buildCapstoneQuestions } from "../src/capstoneQuestions";
import { FlashcardGame } from "../src/flashcardGame";
import type { Passage, Sentence, Vocab } from "../src/types";

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf-8"));
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

interface TopicConfig {
  fileKey: string;
  label: string;
}

const TOPICS: TopicConfig[] = [
  { fileKey: "greetings", label: "Greetings 問候與禮貌用語" },
  { fileKey: "pronouns", label: "Pronouns 代名詞" },
  { fileKey: "family", label: "Family 家庭" },
  { fileKey: "people", label: "People 人" },
  { fileKey: "appearance", label: "Appearance 外觀特徵" },
  { fileKey: "emotions", label: "Emotions 情緒" },
  { fileKey: "personality_traits", label: "Personality Traits 性格特質" },
  { fileKey: "parts_of_body", label: "Parts of Body 身體部位" },
  { fileKey: "colors", label: "Colors 顏色" },
  { fileKey: "school", label: "School 學校" },
  { fileKey: "numbers", label: "Numbers 數字" },
  { fileKey: "pe_sports", label: "PE / Sports 體育課" },
  { fileKey: "clubs_hobbies", label: "Clubs & Hobbies 社團活動" },
  { fileKey: "science", label: "Science 自然科學" },
  { fileKey: "animals_insects", label: "Animals & Insects 動物與昆蟲" },
  { fileKey: "food_drink", label: "Food & Drink 食物與飲料" },
  { fileKey: "clothing_accessories", label: "Clothing & Accessories 衣服與配件" },
  { fileKey: "houses_apartments", label: "Houses & Apartments 房子與公寓" },
  { fileKey: "tableware", label: "Tableware 餐具" },
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

for (const topic of TOPICS) {
  const allVocab = loadJson<Vocab[]>(`../../content/vocab/${topic.fileKey}.json`);
  const vocab = allVocab.filter((v) => v.status === "published");

  const allSentences = loadJson<Sentence[]>(`../../content/sentences/${topic.fileKey}.json`);
  const sentences = allSentences.filter(
    (s) => s.topic === topic.fileKey && s.stage === "B" && s.status === "published"
  );

  const passage = loadJson<Passage>(`../../content/passages/${topic.fileKey}.json`);

  assert(vocab.length > 0, `${topic.label}：應該要有 published 的單字`);
  assert(sentences.length > 0, `${topic.label}：應該要有 Stage B、published 的句子`);
  assert(passage.status === "published", `${topic.label}：短文應該是 published 狀態`);
  console.log(
    `✅ ${topic.label}：${vocab.length} 個單字、${sentences.length} 句、短文「${passage.title}」都齊全。`
  );

  // 字卡暖身：插在 Stage A 之前，一組（預設 3 張）字卡看完接這一組的測驗（見 flashcardGame.ts）。
  // 每張字卡都直接前進（不用真的模擬「看字卡」這個沒有作答動作的畫面），每題都選正確答案，
  // 所以不會觸發答錯重排隊伍的邏輯，correctCount 應該剛好等於單字數、wrongCount 應該是 0。
  const flashcards = new FlashcardGame(vocab, 6, 3);
  let flashcardsGuard = 0;
  while (!flashcards.isRoundComplete) {
    if (flashcards.phase === "card") {
      flashcards.advanceCard();
      flashcardsGuard += 1;
      if (flashcardsGuard > vocab.length * 5) throw new Error(`${topic.label} flashcards：疑似無窮迴圈`);
      continue;
    }
    if (flashcards.feedback === "correct") {
      flashcards.advanceToNextWord();
      flashcardsGuard += 1;
      if (flashcardsGuard > vocab.length * 5) throw new Error(`${topic.label} flashcards：疑似無窮迴圈`);
      continue;
    }
    if (!flashcards.quizQuestion) throw new Error(`${topic.label} flashcards：測驗階段卻沒有題目`);
    flashcards.selectQuizOption(flashcards.quizQuestion.answer);
    flashcardsGuard += 1;
    if (flashcardsGuard > vocab.length * 5) throw new Error(`${topic.label} flashcards：疑似無窮迴圈`);
  }
  assert(
    flashcards.correctCount === vocab.length,
    `${topic.label} flashcards：答對次數應等於單字數（實際 ${flashcards.correctCount} / ${vocab.length}，代表有單字因為湊不出干擾選項被跳過）`
  );
  assert(flashcards.wrongCount === 0, `${topic.label} flashcards：每題都選正確答案，答錯次數應該是 0`);
  assert(
    flashcards.masteredCount === vocab.length,
    `${topic.label} flashcards：已學會的單字數應該等於總單字數，實際 ${flashcards.masteredCount} / ${vocab.length}`
  );

  // Stage A：隨便配對到全部完成
  const matching = new MatchingGame(vocab, 6);
  let matchingGuard = 0;
  while (!matching.isRoundComplete) {
    if (matching.isBatchComplete) {
      matching.advanceToNextBatch();
      continue;
    }
    const en = matching.englishCards.find((c) => c.status !== "correct");
    const zh = matching.chineseCards.find((c) => c.status !== "correct" && c.vocabId === en?.vocabId);
    if (!en || !zh) throw new Error(`${topic.label} matching：找不到可配對的卡片`);
    matching.selectEnglish(en.vocabId);
    matching.selectChinese(zh.vocabId);
    matchingGuard += 1;
    if (matchingGuard > vocab.length * 5) throw new Error(`${topic.label} matching：疑似無窮迴圈`);
  }
  assert(matching.correctCount === vocab.length, `${topic.label} matching：答對次數應等於單字數`);

  // Stage B-1：照正確順序排完全部句子
  const ordering = new OrderingGame(sentences);
  let orderingGuard = 0;
  while (!ordering.isRoundComplete) {
    if (ordering.feedback === "correct") {
      ordering.advanceToNextSentence();
      continue;
    }
    const canonicalWords = ordering.currentSentence.en.split(" ").filter((w) => w.length > 0);
    for (const word of canonicalWords) {
      const token = ordering.pool.find((t) => t.text === word);
      if (!token) throw new Error(`${topic.label} ordering：字塊池找不到 "${word}"`);
      ordering.placeToken(token.instanceId);
    }
    orderingGuard += 1;
    if (orderingGuard > sentences.length * 3) throw new Error(`${topic.label} ordering：疑似無窮迴圈`);
  }
  assert(ordering.correctCount === sentences.length, `${topic.label} ordering：答對次數應等於句數`);

  // Stage B-2：每題都選正確答案
  const fillBlank = new FillBlankGame(sentences, vocab);
  assert(fillBlank.totalQuestions > 0, `${topic.label} fillBlank：應該至少能挖出一題`);
  let fillGuard = 0;
  while (!fillBlank.isRoundComplete) {
    if (fillBlank.feedback === "correct") {
      fillBlank.advanceToNextQuestion();
      continue;
    }
    const correctOption = fillBlank.currentQuestion.options.find((o) => o.vocabId === fillBlank.currentQuestion.correctVocabId);
    if (!correctOption) throw new Error(`${topic.label} fillBlank：找不到正確選項`);
    fillBlank.selectOption(correctOption.vocabId);
    fillGuard += 1;
    if (fillGuard > fillBlank.totalQuestions * 5) throw new Error(`${topic.label} fillBlank：疑似無窮迴圈`);
  }
  assert(fillBlank.correctCount === fillBlank.totalQuestions, `${topic.label} fillBlank：答對次數應等於題數`);

  // Stage C：每題都選正確答案
  const choice = new ChoiceGame(passage);
  let choiceGuard = 0;
  while (!choice.isRoundComplete) {
    if (choice.feedback === "correct") {
      choice.advanceToNextQuestion();
      continue;
    }
    choice.selectOption(choice.currentQuestion.answer);
    choiceGuard += 1;
    if (choiceGuard > choice.totalQuestions * 5) throw new Error(`${topic.label} choice：疑似無窮迴圈`);
  }
  assert(choice.correctCount === choice.totalQuestions, `${topic.label} choice：答對次數應等於題數`);

  // Stage D：混合單字/短句/短文出的綜合關卡，每題都選正確答案
  const capstoneQuestions = buildCapstoneQuestions(vocab, sentences, passage);
  assert(capstoneQuestions.length > 0, `${topic.label} capstone：應該至少能組出一題`);
  const syntheticPassage: Passage = {
    id: `capstone.${topic.fileKey}`,
    title: `${topic.label} — Stage D 綜合關卡`,
    topic: topic.fileKey,
    text: passage.text,
    sentence_ids: [],
    vocab_ids: [],
    questions: capstoneQuestions,
    status: "published",
  };
  const capstone = new ChoiceGame(syntheticPassage);
  let capstoneGuard = 0;
  while (!capstone.isRoundComplete) {
    if (capstone.feedback === "correct") {
      capstone.advanceToNextQuestion();
      continue;
    }
    capstone.selectOption(capstone.currentQuestion.answer);
    capstoneGuard += 1;
    if (capstoneGuard > capstone.totalQuestions * 5) throw new Error(`${topic.label} capstone：疑似無窮迴圈`);
  }
  assert(capstone.correctCount === capstone.totalQuestions, `${topic.label} capstone：答對次數應等於題數`);

  console.log(`✅ ${topic.label}：字卡暖身＋Stage A→B-1→B-2→C→D 六個關卡都能跑完一輪。`);
}

console.log(
  "\n✅ 全部 14 個主題（Unit 0／Family／People／Personal Characteristics／Parts of Body／Colors／School／Numbers／Animals & insects／Food & Drink／Clothing & Accessories／Houses & Apartments／Tableware／Transportation）的多主題流程驗證通過（含字卡暖身）。"
);
