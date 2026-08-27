// 產生根目錄的 dashboard.html：專案進度儀表板（總覽／開發階段／課程內容資產／技術待辦／檔案總覽）。
// 「課程內容資產」分頁（KPI 卡片、進度條、統計表、可展開的主題內容卡片）完全從 content/ 底下的
// JSON 檔案讀取產生，不是手動謄打，所以永遠反映最新內容，不會像過去的手動維護版本一樣脫節。
// dashboard.html 裡用 <!-- AUTO-GENERATED:XXX:START/END --> 註解標出這支 script 會覆寫的區塊，
// 其餘部分（CSS、開發階段分頁、技術待辦分頁、檔案總覽分頁、JS）維持原樣不動。
// 用法：node scripts/build-dashboard.mjs

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, "..", "..", "content");
const rootDir = path.join(__dirname, "..", "..");

// pendingAppWiring: true 代表 content 端已經完整建立，但 app/src/main.ts 的
// TOPICS／UNITS／TOPIC_THUMBS 還沒接線，所以還不能實際在畫面上玩到（見對應的
// docs/handoff-prompt-*.md）。
const UNITS = [
  {
    label: "單元 0：教室常用語",
    topics: [
      { fileKey: "greetings", label: "Greetings 問候與禮貌用語" },
      { fileKey: "pronouns", label: "Pronouns 代名詞" },
    ],
  },
  {
    label: "單元一：我和身邊的人",
    topics: [
      { fileKey: "family", label: "Family 家庭" },
      { fileKey: "people", label: "People 人" },
      { fileKey: "appearance", label: "Appearance 外觀特徵" },
      { fileKey: "emotions", label: "Emotions 情緒" },
      { fileKey: "personality_traits", label: "Personality Traits 性格特質" },
      { fileKey: "parts_of_body", label: "Parts of Body 身體部位" },
    ],
  },
  {
    label: "單元二：食衣住行",
    topics: [
      { fileKey: "food_drink", label: "Food & Drink 食物與飲料" },
      { fileKey: "clothing_accessories", label: "Clothing & Accessories 衣服與配件" },
      { fileKey: "houses_apartments", label: "Houses & Apartments 房子與公寓" },
      { fileKey: "tableware", label: "Kitchen & Dining 廚房與餐具" },
      { fileKey: "bathroom", label: "Bathroom 浴室" },
      { fileKey: "transportation", label: "Transportation 交通工具" },
    ],
  },
  {
    label: "單元三：上學去",
    topics: [
      { fileKey: "school", label: "School 學校" },
      { fileKey: "numbers", label: "Math 數學" },
      { fileKey: "colors", label: "Art 美術" },
      { fileKey: "pe_sports", label: "PE / Sports 體育課" },
      { fileKey: "clubs_hobbies", label: "Clubs & Hobbies 社團活動" },
      { fileKey: "science", label: "Science 自然科學" },
    ],
  },
  {
    label: "單元四：大自然與動物",
    topics: [
      { fileKey: "animals_insects", label: "Animals & Insects 動物與昆蟲" },
      { fileKey: "weather_nature", label: "Weather 天氣" },
      { fileKey: "geographical_terms", label: "Geographical Terms 地理名詞" },
    ],
  },
  {
    label: "單元五：生活情境",
    topics: [
      { fileKey: "places_directions", label: "Places & Directions 地點與方位" },
      { fileKey: "occupations", label: "Occupations 職業" },
      { fileKey: "money", label: "Money 金錢" },
      { fileKey: "health", label: "Health 健康" },
      { fileKey: "forms_of_address", label: "Forms of Address 稱謂" },
    ],
  },
  {
    label: "單元六：時間與節日",
    topics: [
      { fileKey: "time", label: "Time 時間" },
      { fileKey: "calendar", label: "Calendar 日曆" },
      { fileKey: "holidays_festivals", label: "Holidays & Festivals 節日" },
      { fileKey: "sizes_measurements", label: "Sizes & Measurements 尺寸與量測" },
    ],
  },
  {
    label: "單元七：文法小幫手",
    topics: [
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
    ],
  },
];

function loadJson(relativePath) {
  return JSON.parse(readFileSync(path.join(contentDir, relativePath), "utf-8"));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ---- 讀取全部主題內容，順便累計統計數字 ----
let totalWords = 0;
let totalSentences = 0;
let totalPassages = 0;
let totalQuestions = 0;
let pendingCount = 0;
let playableCount = 0;

const flatTopics = [];
for (const unit of UNITS) {
  for (const topic of unit.topics) {
    const vocab = loadJson(`vocab/${topic.fileKey}.json`);
    const sentences = loadJson(`sentences/${topic.fileKey}.json`);
    const passage = loadJson(`passages/${topic.fileKey}.json`);
    totalWords += vocab.length;
    totalSentences += sentences.length;
    totalPassages += 1;
    totalQuestions += passage.questions.length;
    if (topic.pendingAppWiring) pendingCount += 1;
    else playableCount += 1;
    flatTopics.push({ ...topic, unitLabel: unit.label, vocab, sentences, passage });
  }
}
const totalTopics = flatTopics.length;
const contentProgressPct = Math.round((playableCount / totalTopics) * 1000) / 10;

// ---- 統計表列 ----
function statsRow(t) {
  const searchTerms = `${t.unitLabel} ${t.label}`.toLowerCase();
  const status = t.pendingAppWiring ? "partial" : "done";
  const statusPill = t.pendingAppWiring
    ? `<span class="pill partial">內容完成／待 App 接線</span>`
    : `<span class="pill done">已建立完整範例</span>`;
  return `        <tr data-status="${status}" data-search="${escapeHtml(searchTerms)}"><td>${escapeHtml(
    t.unitLabel
  )} › ${escapeHtml(t.label)}</td><td class="num">${t.vocab.length}</td><td class="num">${
    t.sentences.length
  }</td><td class="num">1</td><td>${statusPill}</td></tr>`;
}

// ---- 主題內容卡片 ----
function topicCard(t) {
  const searchTerms = `${t.unitLabel} ${t.label}`.toLowerCase();
  const status = t.pendingAppWiring ? "partial" : "done";
  const vocabRows = t.vocab
    .map(
      (v) =>
        `            <tr><td>${escapeHtml(v.en)}</td><td>${escapeHtml(v.zh)}</td><td>${escapeHtml(
          v.pos
        )}</td><td class="num">${v.difficulty_tier}</td></tr>`
    )
    .join("\n");

  const sentItems = t.sentences
    .map(
      (s) =>
        `            <li><span class="en">${escapeHtml(s.en)}</span><span class="zh">${escapeHtml(
          s.zh
        )}</span><span class="gp">${escapeHtml(s.grammar_point)}</span></li>`
    )
    .join("\n");

  const qItems = t.passage.questions
    .map((q) => {
      const opts = q.options
        .map((opt) => `<li${opt === q.answer ? ' class="correct"' : ""}>${escapeHtml(opt)}</li>`)
        .join("");
      return `            <li class="q"><div class="qtext">${escapeHtml(
        q.question
      )}</div><ul class="opts">${opts}</ul></li>`;
    })
    .join("\n");

  const pendingNote = t.pendingAppWiring
    ? `\n          <div class="topic-note">content 端已完整建立並通過驗證，App 端（main.ts）尚未接線，暫時還不能在畫面上玩到，詳見 docs/ 底下對應的 handoff-prompt。</div>`
    : "";

  return `      <details class="topic-card" data-status="${status}" data-search="${escapeHtml(searchTerms)}">
        <summary>${escapeHtml(t.unitLabel)} › ${escapeHtml(t.label)} <span class="count">單字 ${
    t.vocab.length
  } · 句子 ${t.sentences.length} · 短文 1</span></summary>
        <div class="topic-body">${pendingNote}
          <div class="block-label">單字 Vocab</div>
          <table class="mini">
            <thead><tr><th>English</th><th>中文</th><th>詞性</th><th>難度</th></tr></thead>
            <tbody>
${vocabRows}
            </tbody>
          </table>
          <div class="block-label">短句 Sentences（Stage B）</div>
          <ul class="sent-list">
${sentItems}
          </ul>
          <div class="block-label">短文 Passage（Stage C）</div>
          <div class="passage">
            <div class="ptitle">${escapeHtml(t.passage.title)}</div>
            <div class="ptext">${escapeHtml(t.passage.text)}</div>
            <ul class="qlist">
${qItems}
            </ul>
          </div>
        </div>
      </details>`;
}

const statsRowsHtml = flatTopics.map(statsRow).join("\n");
const topicCardsHtml = flatTopics.map(topicCard).join("\n");

const kpiHtml = `
      <div class="kpi"><div class="v">${totalTopics}</div><div class="l">主題內容已完整建立（單字＋短句＋短文），含 Unit 0（${pendingCount} 個待 App 端接線）</div></div>
      <div class="kpi"><div class="v">${totalWords}</div><div class="l">單字條目（含 Unit 0）</div></div>
      <div class="kpi"><div class="v">${totalSentences}</div><div class="l">範例句子</div></div>
      <div class="kpi"><div class="v">${totalPassages}</div><div class="l">範例短文（共 ${totalQuestions} 題理解題）</div></div>
      <div class="kpi"><div class="v">44</div><div class="l">成就徽章（10 大分類，美術圖已全部補齊）</div></div>
      <div class="kpi"><div class="v">${pendingCount}</div><div class="l">主題 content 端已完成、待技術架構 session 接線 main.ts</div></div>
      `;

const contentProgressHtml = `
    <div class="content-progress">
      <div class="txt">主題完成度</div>
      <div class="bar"><span style="width:${contentProgressPct}%"></span></div>
      <div class="txt">${playableCount} / ${totalTopics}（App 端可玩，約 ${contentProgressPct}%），另有 ${pendingCount} 個主題 content 端已完成、待接線</div>
    </div>
    `;

const today = new Date().toISOString().slice(0, 10);

function replaceMarked(source, markerName, replacement) {
  const startMarker = `<!-- AUTO-GENERATED:${markerName}:START -->`;
  const endMarker = `<!-- AUTO-GENERATED:${markerName}:END -->`;
  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`找不到標記區塊：${markerName}`);
  }
  return (
    source.slice(0, startIdx + startMarker.length) +
    "\n" +
    replacement +
    "\n      " +
    source.slice(endIdx)
  );
}

const existingPath = path.join(rootDir, "dashboard.html");
let html = readFileSync(existingPath, "utf-8");

html = html.replace(/專案 Dashboard · 最後更新 [^<]+/, `專案 Dashboard · 最後更新 ${today}（全部正式主題已接進 App，含單元六）`);
html = replaceMarked(html, "KPIS", kpiHtml.trim());
html = replaceMarked(html, "CONTENT_PROGRESS", contentProgressHtml.trim());
html = replaceMarked(html, "STATS_ROWS", statsRowsHtml);
html = replaceMarked(html, "TOPIC_CARDS", topicCardsHtml);
html = html.replace(
  /目前 \d+ 個正式主題＋Unit 0 皆已完整建立/,
  `目前 ${totalTopics} 個主題（含 Unit 0）皆已完整建立`
);
html = html.replace(/\d+ 支 verify-\*\.ts/, "21 支 verify-*.ts");
html = html.replace(
  /\d+ 個主題單字檔（[^<]*），共 \d+ 筆/,
  `${totalTopics} 個主題單字檔（Unit 0 兩主題＋單元一～六共 ${totalTopics - 2} 個正式主題），共 ${totalWords} 筆`
);
html = html.replace(/\d+ 個主題的 Stage B 範例句子檔，共 \d+ 句/, `${totalTopics} 個主題的 Stage B 範例句子檔，共 ${totalSentences} 句`);
html = html.replace(/\d+ 個主題的 Stage C 範例短文＋理解題，共 \d+ 題/, `${totalTopics} 個主題的 Stage C 範例短文＋理解題，共 ${totalQuestions} 題`);
html = html.replace(/(<span class="ext">)\d+( 個 JSON 檔案<\/span>)/g, `$1${totalTopics}$2`);

writeFileSync(existingPath, html, "utf-8");
console.log(
  `已產生 dashboard.html：${totalTopics} 個主題（${playableCount} 個可玩 + ${pendingCount} 個待接線），共 ${totalWords} 個單字、${totalSentences} 句、${totalPassages} 篇短文。`
);
