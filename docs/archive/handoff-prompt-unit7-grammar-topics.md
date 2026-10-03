# Handoff Prompt：新增單元七「文法小幫手」11 個主題

## 背景

使用者要求把 `docs/content-plan.md` 3.2 節原本規劃「文法／功能詞不獨立成關卡」的 11 個類別（Articles、Pronouns、Be & auxiliaries、Prepositions、Conjunctions、Interjections、Wh-words、Other verbs/adjectives/adverbs）正式建成獨立的單元七，並明確指示：跨主題重複收錄同一個英文單字（同義時）是被允許、甚至是必要的，不需要為了避免重複而犧牲某個主題內容的完整性。

content 端（`content/vocab/<fileKey>.json` 以及對應的 `sentences`／`passages`／`glossary` 四份檔案 × 11 個主題）已經全部建立完成並驗證過（含 `jsonschema` 驗證、跨主題單字衝突掃描、短文查字模擬、全部 21 支 `verify-*.ts`、`npm run build`）。App 端只需要在 `main.ts` 登記這 11 個新主題，不用改任何遊戲邏輯——`content/` 底下的檔案已經是 `import.meta.glob` 會自動讀到的正確格式，跟其他既有主題完全一樣。

`content/badges/badges.json` 也已經新增 `badge.unit_completion.unit7`（代碼 WC-07「文法小幫手」），並把原本 `all_topics` 徽章的代碼從 WC-07 往後遞補為 WC-08（條件文字更新為「全部 40 個規劃主題」），這部分不需要 App 端額外改動，`app/src/main.ts` 讀徽章清單本來就是動態讀 `badges.json`。

## 需要的改動（`app/src/main.ts`）

### 1. `TOPICS` 陣列新增 11 筆

```ts
const TOPICS: TopicConfig[] = [
  // ...既有的 32 筆...
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
```

放的位置不影響功能（`TOPICS` 只是清單，畫面呈現順序由 `UNITS.topicFileKeys` 的順序決定），建議放在單元六（`sizes_measurements`）後面，方便閱讀。

### 2. `UNITS` 陣列新增 `unit7`

```ts
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
```

這個清單已經跟 `app/scripts/verify-unit-completion-badges.ts` 裡的 `unit7` 定義完全一致（含順序），直接照抄即可。

### 3. `TOPIC_THUMBS` 新增 11 筆縮圖設定

```ts
const TOPIC_THUMBS: Record<string, { emoji: string; className: string }> = {
  // ...既有的...
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
};
```

`className` 只要跟其他主題一樣是「thumb-用連字號分隔的 fileKey」格式即可，實際顏色由 CSS 那邊統一處理（沒有專屬樣式規則的話會退回預設外觀，不影響功能，可之後再美化）。emoji 選字僅供參考，可依實際美術風格調整。

## 不需要改的地方

- 沒有任何遊戲邏輯（`MatchingGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`FlashcardGame`／`buildCapstoneQuestions`）需要改，這些都是吃 `content/` 資料的通用邏輯，新主題會自動套用。
- `content/badges/badges.json` 已經新增 `unit_completion.unit7`（WC-07）並把 `all_topics`（WC-08）條件文字同步更新，`main.ts` 讀徽章清單是動態的，不用改。
- Stage D 綜合關卡（`buildCapstoneQuestions`）、單字收藏、短文點字查中文全部通用，不用個別接線。
- `lookupPassageWordZh()` 的三層查詢邏輯（own-topic vocab → 全域表 → own-topic glossary）不用改，這 11 個新主題的內容已經在 content 端處理過所有已知的跨主題撞名風險（`like`／`do`／`can`／`fun` 四個字的排除決定，詳見 `docs/content-plan.md` 3.1 節「2026-08-25 三」註）。

## 特別提醒：`app/scripts/verify-unit-completion-badges.ts` 已經預先把這 11 個主題加進 `AVAILABLE_TOPIC_FILE_KEYS` 並定義好 `unit7`

這個 script 原本的設計是「跟 main.ts 的 TOPICS／UNITS 一致」，只收實際已經上架可玩的主題。這次 content 端為了讓測試邏輯提前跟規劃對齊，已經把這 11 個 fileKey 都加進 `AVAILABLE_TOPIC_FILE_KEYS`，也新增了完整的 `unit7` 定義與對應的「測試 11」——這代表在 App 端還沒執行這份 handoff prompt之前，這支 script 的假設會**暫時領先於 main.ts 的實際狀態**（測試本身仍然全部通過，因為沒有任何既有測試會真的去完成這 11 個主題的 Stage D，除了測試 11 本身是用假資料模擬的）。等這份 handoff prompt 執行完、`main.ts` 的 `TOPICS`／`UNITS` 也同步更新後，兩邊就會一致，不需要額外改動這支 script。

`dashboard.html` 目前也是用同樣的「pendingAppWiring: true」方式標記這 11 個主題（見 `app/scripts/build-dashboard.mjs` 的 `UNITS` fixture），等 App 端接線完成後記得把這 11 筆的 `pendingAppWiring: true` 拿掉並重新執行 `node scripts/build-dashboard.mjs`。

## 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 建議跑一次 `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`，記得同步覆蓋專案根目錄那份重複的 `demo-standalone.html`（`cp app/demo-standalone.html ../demo-standalone.html`）。
- 可以順手跑 `node scripts/build-content-review.mjs` 確認新主題有出現在內容審閱頁（content 端已經把這支腳本的 `TOPICS` 清單同步加好了，現在共 36 個主題）。
- App 端接線完成後，記得到 `app/scripts/build-dashboard.mjs` 把單元七 11 筆的 `pendingAppWiring: true` 拿掉，重新執行 `node scripts/build-dashboard.mjs` 更新 `dashboard.html`。
- 完成後在 `HANDOFF.md` 9.83 節下方補一行「App 端已於 main.ts 執行完成」的記錄即可，不用開新編號（沿用先前 PE / Sports、Bathroom、單元六等 handoff 的慣例）。
