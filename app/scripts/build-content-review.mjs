// 產生 content-review.html：把 content/ 底下每個主題的單字／句子／短文
// 整理成一張易讀的靜態頁面（不是遊戲，是給人審內容用的），方便你檢查翻譯、
// 例句品質、短文是否適合小朋友，不用一關一關玩才能看到全部內容。
// 資料直接讀自 content/ 的 JSON 檔，不是手動謄打，所以不會跟正式內容脫節。
// 之後要再加主題，在下面 TOPICS 陣列加一筆 { fileKey, label } 就好（實際涵蓋的主題數量
// 請直接看下面 TOPICS 陣列，這裡不重複維護一份數字，之前這裡的舊數字已經過時）。
// 用法：node scripts/build-content-review.mjs

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, "..", "..", "content");

const TOPICS = [
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

function loadJson(relativePath) {
  return JSON.parse(readFileSync(path.join(contentDir, relativePath), "utf-8"));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderTopicSection(topic) {
  const vocab = loadJson(`vocab/${topic.fileKey}.json`);
  const sentences = loadJson(`sentences/${topic.fileKey}.json`);
  const passage = loadJson(`passages/${topic.fileKey}.json`);

  const vocabRows = vocab
    .map(
      (v) => `
      <tr>
        <td>${escapeHtml(v.id)}</td>
        <td>${escapeHtml(v.en)}</td>
        <td>${escapeHtml(v.zh)}</td>
        <td>${escapeHtml(v.pos)}</td>
        <td>${v.difficulty_tier}</td>
        <td>${escapeHtml(v.status)}</td>
      </tr>`
    )
    .join("");

  const sentenceRows = sentences
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.id)}</td>
        <td>${escapeHtml(s.en)}</td>
        <td>${escapeHtml(s.zh)}</td>
        <td>${escapeHtml(s.grammar_point)}</td>
        <td>${escapeHtml(s.vocab_ids.join(", "))}</td>
      </tr>`
    )
    .join("");

  const questionBlocks = passage.questions
    .map(
      (q, i) => `
      <div class="question">
        <p class="q-text"><strong>Q${i + 1}.</strong> ${escapeHtml(q.question)}</p>
        <ul class="q-options">
          ${q.options
            .map(
              (opt) =>
                `<li class="${opt === q.answer ? "correct-option" : ""}">${escapeHtml(opt)}${
                  opt === q.answer ? " ✅" : ""
                }</li>`
            )
            .join("")}
        </ul>
      </div>`
    )
    .join("");

  return `
    <section class="topic-section">
      <h1>${escapeHtml(topic.label)}</h1>
      <p class="meta">資料直接讀自 content/vocab/${topic.fileKey}.json、content/sentences/${topic.fileKey}.json、content/passages/${topic.fileKey}.json，跟遊戲用的是同一份資料，所見即所得。</p>

      <h2>單字（Vocab）<span class="count-badge">${vocab.length} 個</span></h2>
      <table>
        <thead>
          <tr><th>ID</th><th>English</th><th>中文</th><th>詞性</th><th>難度</th><th>狀態</th></tr>
        </thead>
        <tbody>${vocabRows}</tbody>
      </table>

      <h2>例句（Sentences，Stage B）<span class="count-badge">${sentences.length} 句</span></h2>
      <table>
        <thead>
          <tr><th>ID</th><th>English</th><th>中文</th><th>文法點</th><th>引用單字</th></tr>
        </thead>
        <tbody>${sentenceRows}</tbody>
      </table>

      <h2>短文（Passage，Stage C）</h2>
      <div class="passage-box">
        <h3>${escapeHtml(passage.title)}</h3>
        <p>${escapeHtml(passage.text)}</p>
      </div>
      <div class="questions">${questionBlocks}</div>
    </section>
  `;
}

const navLinks = TOPICS.map(
  (t) => `<a href="#topic-${t.fileKey}">${escapeHtml(t.label)}</a>`
).join(" ｜ ");

const topicSections = TOPICS.map(
  (t) => `<div id="topic-${t.fileKey}">${renderTopicSection(t)}</div>`
).join("<hr />");

const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>內容審閱頁 - 全部主題</title>
    <style>
      :root { font-family: "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif; }
      body { margin: 0; background: #fdf6e3; color: #333; }
      .wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px 64px; }
      .top-nav { position: sticky; top: 0; background: #fdf6e3; padding: 10px 0; border-bottom: 2px solid #f4a300; margin-bottom: 8px; }
      .top-nav a { margin-right: 6px; color: #a06b00; text-decoration: none; font-weight: bold; }
      .top-nav a:hover { text-decoration: underline; }
      h1 { font-size: 1.6rem; }
      h2 { margin-top: 40px; border-bottom: 3px solid #f4a300; padding-bottom: 6px; }
      .meta { color: #777; font-size: 0.9rem; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; background: white; }
      th, td { border: 1px solid #eee; padding: 8px 10px; font-size: 0.92rem; text-align: left; vertical-align: top; }
      th { background: #fff2d6; }
      tr:nth-child(even) { background: #fafafa; }
      .passage-box { background: white; border: 2px solid #eee; border-radius: 12px; padding: 18px; margin-top: 12px; line-height: 1.8; }
      .passage-box h3 { margin-top: 0; }
      .question { margin-top: 18px; padding: 12px 14px; background: #fff; border-radius: 8px; border: 1px solid #eee; }
      .q-text { margin: 0 0 8px; }
      .q-options { margin: 0; padding-left: 20px; }
      .correct-option { color: #2e7d32; font-weight: bold; }
      .count-badge { display: inline-block; background: #f4a300; color: white; border-radius: 999px; padding: 2px 10px; font-size: 0.85rem; margin-left: 8px; }
      hr { border: none; border-top: 4px dashed #f0e4c8; margin: 48px 0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <nav class="top-nav">${navLinks}</nav>
      ${topicSections}
    </div>
  </body>
</html>
`;

writeFileSync(path.join(__dirname, "..", "content-review.html"), html, "utf-8");
console.log(`已產生 app/content-review.html（共 ${TOPICS.length} 個主題）`);
