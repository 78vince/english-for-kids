// 驗證 Stage D 綜合關卡的組題邏輯（capstoneQuestions.ts），特別是使用者回報過的
// 「同義詞干擾選項」曖昧題目問題：像 parts_of_body 主題的 foot/feet 這種 related_forms
// 群組（不規則複數，中文意思幾乎一樣），如果同時出現在「"foot" 是什麼意思？」這種單字題
// 的選項裡，就會變成無法用意思分辨、只能瞎猜的曖昧題。
// capstoneQuestions.ts 修正後，干擾選項要排除跟目標單字是同義詞關係的字，這裡大量重複
// 呼叫 buildCapstoneQuestions() 驗證這個規則真的有生效，不是只在某一次隨機洗牌下剛好沒出現。
// 用法：npx tsx scripts/verify-capstone-questions.ts

import { readFileSync } from "node:fs";
import { buildCapstoneQuestions } from "../src/capstoneQuestions";
import type { Passage, Sentence, Vocab } from "../src/types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf-8"));
}

/** 跟 capstoneQuestions.ts 內部的 stripPunctuation() 是同一套邏輯，拿來驗證挖空位置的字
 * 去掉標點符號後是否對得上正確答案。 */
function stripPunctuation(word: string): string {
  return word.replace(/[.,!?;:]+$/, "").toLowerCase();
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
  "transportation",
];

const TRIALS = 60;

for (const topic of TOPICS) {
  const vocab = loadJson<Vocab[]>(`../../content/vocab/${topic}.json`).filter((v) => v.status === "published");
  const sentences = loadJson<Sentence[]>(`../../content/sentences/${topic}.json`).filter(
    (s) => s.topic === topic && s.stage === "B" && s.status === "published"
  );
  const passage = loadJson<Passage>(`../../content/passages/${topic}.json`);

  const vocabById = new Map(vocab.map((v) => [v.id, v]));
  const vocabByEn = new Map(vocab.map((v) => [v.en.toLowerCase(), v]));
  const vocabByZh = new Map(vocab.map((v) => [v.zh, v]));

  function isSynonymPair(a: Vocab, b: Vocab): boolean {
    return a.related_forms.includes(b.id) || b.related_forms.includes(a.id);
  }

  let synonymLeakCount = 0;
  let totalVocabQuestions = 0;
  let totalSentenceQuestions = 0;

  for (let trial = 0; trial < TRIALS; trial++) {
    const questions = buildCapstoneQuestions(vocab, sentences, passage);
    assert(questions.length > 0, `${topic}：第 ${trial} 次試跑應該至少組出一題`);

    for (const q of questions) {
      // 每題的選項不能重複，也一定要包含正確答案。
      const uniqueOptions = new Set(q.options);
      assert(uniqueOptions.size === q.options.length, `${topic}：題目「${q.question}」選項有重複`);
      assert(q.options.includes(q.answer), `${topic}：題目「${q.question}」的選項裡沒有正確答案`);

      if (q.id.startsWith("capstone.vocab.")) {
        totalVocabQuestions += 1;
        const answerVocab = vocabByZh.get(q.answer);
        if (!answerVocab) continue; // 理論上一定找得到，找不到就跳過，不是這裡要驗證的重點
        for (const option of q.options) {
          if (option === q.answer) continue;
          const optionVocab = vocabByZh.get(option);
          if (optionVocab && isSynonymPair(optionVocab, answerVocab)) {
            synonymLeakCount += 1;
            throw new Error(
              `❌ ${topic}：單字題「${q.question}」的干擾選項「${option}」跟正確答案「${q.answer}」互為同義詞（related_forms），會變成曖昧題目`
            );
          }
        }
      } else if (q.id.startsWith("capstone.sentence.")) {
        totalSentenceQuestions += 1;
        const answerVocab = vocabByEn.get(q.answer.toLowerCase());
        if (!answerVocab) continue;
        for (const option of q.options) {
          if (option === q.answer) continue;
          const optionVocab = vocabByEn.get(option.toLowerCase());
          if (optionVocab && isSynonymPair(optionVocab, answerVocab)) {
            synonymLeakCount += 1;
            throw new Error(
              `❌ ${topic}：短句填空題「${q.question}」的干擾選項「${option}」跟正確答案「${q.answer}」互為同義詞（related_forms），會變成曖昧題目`
            );
          }
        }

        // 短句填空題的題目文字把答案挖空了（例如 "My bag is ____"），main.ts 靠
        // source_sentence 顯示「播放這句」語音按鈕，讓使用者可以用聽的判斷答案——
        // 這裡確認每一題都真的有填這個欄位（不是 undefined／null），且內容真的是
        // 「挖空前的完整原句」：除了挖空那個位置，其他每個字（含標點符號）都要跟
        // source_sentence 逐字相同；挖空那個位置去除標點符號後要等於 q.answer。
        // 不能直接用「把 ____ 換回 q.answer」跟 source_sentence 做字串比對——
        // capstoneQuestions.ts 挖空時是整個 token 換成 "____"，如果原本那個字後面
        // 黏著標點符號（例如句尾的 "you."），標點符號會被一起吃掉，換回去之後
        // 不會跟原句逐字相同（缺一個句點），這是既有的挖空機制本身的行為，不是這次
        // 新增的錯誤，所以驗證要按 token 逐一比對，而不是整句字串比對。
        assert(
          typeof q.source_sentence === "string" && q.source_sentence.length > 0,
          `${topic}：短句填空題「${q.question}」應該要有 source_sentence（給 Stage D 播放整句用），不能是 undefined/null`
        );
        const questionTokens = q.question.split(" ");
        const sourceTokens = q.source_sentence!.split(" ");
        assert(
          questionTokens.length === sourceTokens.length,
          `${topic}：短句填空題「${q.question}」的字數（${questionTokens.length}）應該跟 source_sentence「${q.source_sentence}」的字數（${sourceTokens.length}）一樣`
        );
        const blankIndex = questionTokens.findIndex((t) => t === "____");
        assert(blankIndex !== -1, `${topic}：短句填空題「${q.question}」應該要有 "____" 挖空記號`);
        questionTokens.forEach((token, i) => {
          if (i === blankIndex) {
            assert(
              stripPunctuation(sourceTokens[i]) === q.answer.toLowerCase(),
              `${topic}：source_sentence「${q.source_sentence}」挖空位置的字「${sourceTokens[i]}」應該對應正確答案「${q.answer}」`
            );
          } else {
            assert(
              token === sourceTokens[i],
              `${topic}：短句填空題「${q.question}」第 ${i} 個字「${token}」應該跟 source_sentence 逐字相同，實際是「${sourceTokens[i]}」——播放出來的語音會跟題目文字對不起來`
            );
          }
        });
      }
    }
  }

  assert(synonymLeakCount === 0, `${topic}：不該有任何同義詞干擾選項洩漏`);
  console.log(
    `✅ ${topic}：連續 ${TRIALS} 次組題（共 ${totalVocabQuestions} 題單字題、${totalSentenceQuestions} 題短句填空題）都沒有同義詞干擾選項，選項也都不重複且一定包含正確答案。`
  );
}

// ---- 額外驗證：短文理解題的 source_sentence（Stage D「只播放這一句」的朗讀按鈕用）
//      要嘛是 null／不存在（退回播放整篇短文），要嘛必須是 passage.text 裡逐字一致的
//      子字串——如果標錯字或跟原文有一個字不一樣，播放出來的語音會跟畫面上的短文兜不起來，
//      使用者會聽到跟看到的內容對不上。 ----
for (const topic of TOPICS) {
  const passage = loadJson<Passage>(`../../content/passages/${topic}.json`);
  let sourceSentenceCount = 0;
  for (const q of passage.questions) {
    if (q.source_sentence == null) continue;
    sourceSentenceCount += 1;
    assert(
      passage.text.includes(q.source_sentence),
      `${topic} ${q.id}：source_sentence「${q.source_sentence}」不是短文原文的逐字子字串，播放語音會跟畫面文字對不起來`
    );
  }
  assert(
    sourceSentenceCount === passage.questions.length,
    `${topic}：短文原本的 ${passage.questions.length} 題理解題應該每題都標好 source_sentence（目前只有 ${sourceSentenceCount} 題）`
  );
  console.log(`✅ ${topic}：${sourceSentenceCount} 題短文理解題的 source_sentence 都是原文逐字一致的子字串。`);
}

// ---- 額外驗證：parts_of_body 主題確實有 foot/feet 這種 related_forms 群組，
//      不是因為測試資料剛好沒有同義詞才「巧合通過」。
//      2026-08-23：原本這裡用 family 主題的 dad/daddy/father、mom/mother/mommy 當案例，
//      family 拆掉 dad/daddy/mom/mommy/grandma/grandpa 之後已經沒有 related_forms
//      群組了，改用 parts_of_body 的 foot/feet（不規則複數，一樣是 related_forms 互相
//      關聯），驗證的是同一套排除邏輯，不影響測試涵蓋範圍。 ----
{
  const vocab = loadJson<Vocab[]>(`../../content/vocab/parts_of_body.json`).filter((v) => v.status === "published");
  const foot = vocab.find((v) => v.en === "foot");
  const feet = vocab.find((v) => v.en === "feet");
  assert(!!foot && !!feet, "parts_of_body 主題應該要有 foot 跟 feet 這兩個單字");
  assert(
    foot!.related_forms.includes(feet!.id) && feet!.related_forms.includes(foot!.id),
    "foot 跟 feet 應該互為 related_forms，這樣才能真的驗證到排除邏輯"
  );
  console.log("✅ 額外驗證通過：parts_of_body 主題確實存在 foot/feet 這種 related_forms 群組，排除邏輯是真的被測試到，不是巧合通過。");
}

// ---- 額外驗證：main.ts 的 renderCapstone() 真的有把短句填空題（capstone.sentence.*）
//      接上「播放這句」語音按鈕，不是只有 capstoneQuestions.ts 組出 source_sentence 欄位、
//      畫面卻沒有真的用到（原始碼字串比對，main.ts 因為 import.meta.glob 沒辦法直接
//      import 執行）。 ----
{
  const mainTsPath = new URL("../src/main.ts", import.meta.url);
  const mainTs = readFileSync(mainTsPath, "utf-8");

  assert(
    mainTs.includes('const isSentenceQuiz = game.currentQuestion.id.startsWith("capstone.sentence.");'),
    "renderCapstone() 應該要判斷這一題是不是短句填空題（capstone.sentence.* 開頭）"
  );
  assert(
    mainTs.includes("if (isFromPassage || isSentenceQuiz) {"),
    "renderCapstone() 應該在短文理解題或短句填空題時都顯示語音播放按鈕"
  );

  console.log("✅ 額外驗證通過：main.ts 的 renderCapstone() 真的有把短句填空題接上「播放這句」語音按鈕。");
}

console.log("\n✅ 全部 Stage D 綜合關卡組題邏輯（含同義詞干擾選項排除、短句填空題語音播放）驗證通過。");
