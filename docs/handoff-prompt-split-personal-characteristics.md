# 任務：把 Personal Characteristics 拆成三個新主題接進 App，並清掉舊檔案

## 背景

`Personal Characteristics 個性與特點`（原本 32 個字）已經拆成三個獨立主題：`appearance`（Appearance 外觀特徵，7 字）、`emotions`（Emotions 情緒，11 字）、`personality_traits`（Personality Traits 性格特質，14 字）。三個主題各自的 `content/{vocab,sentences,passages,glossary}/<topic>.json` 都已經寫好、驗證過（`jsonschema` 四份 schema 都過、`vocab_ids`／`answer`／`source_sentence` 交叉引用都對，全部 21 支 `app/scripts/verify-*.ts` 都通過），**內容資料這次不用再檢查**，只需要把它們接進 App，並且**清掉被取代的舊檔案**——這次的清檔步驟跟過往的接線任務不一樣，是這份提示詞最重要的部分，請仔細看第 2 節。

## 相關檔案

- `app/src/main.ts`
  - 約 76-91 行：`TOPICS: TopicConfig[]` —— 第 80 行 `{ fileKey: "personal_characteristics", label: "Personal Characteristics 個性與特點" }` 這一行要**刪掉**，改成三行新主題
  - 約 107-138 行：`WORLDS: WorldConfig[]` —— world1（我和我的家）目前是 `topicFileKeys: ["family", "people", "personal_characteristics", "parts_of_body"]`，要把 `"personal_characteristics"` 換成三個新 fileKey（順序不拘，建議照人類直覺放在 `people` 後面：`["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"]`）
  - 約 1148-1152 行：`TOPIC_THUMBS` —— 第 1149 行 `personal_characteristics: { emoji: "😊", className: "thumb-personal-characteristics" }` 這筆要刪掉，改成三個新主題各自的縮圖（非必要但建議一起補，見下方第 3 節）
- `app/src/style.css` —— 如果要補 `TOPIC_THUMBS` 就要在這裡新增對應 `.thumb-*` class
- `content/vocab/personal_characteristics.json`、`content/sentences/personal_characteristics.json`、`content/passages/personal_characteristics.json`、`content/glossary/personal_characteristics.json` —— **這 4 個檔案已經被三個新主題取代，是死資料，這次要處理掉**，見下方第 2 節（**這是這次任務最關鍵的一步，不要跳過**）
- `app/scripts/verify-multi-topic.ts`／`verify-capstone-questions.ts`／`verify-passage-glossary.ts`／`build-content-review.mjs` —— 這幾支腳本的主題清單已經先幫你換成三個新主題了，不用再動
- `app/scripts/verify-world-completion-badges.ts` —— **這支還沒有動，這次要一起處理**，見下方第 4 節
- `docs/content-plan.md` 3.1 節、`README.md`、`content/badges/badges.json`、`docs/achievement-badges.md`、`HANDOFF.md` —— 文件都已經更新成「26 個內容主題、世界一 6 個主題」，這裡不用再改，僅供對照

## 要做的事

### 1. `main.ts` 接線

- `TOPICS` 陣列：刪掉 `personal_characteristics` 那一行，加入：
  ```ts
  { fileKey: "appearance", label: "Appearance 外觀特徵" },
  { fileKey: "emotions", label: "Emotions 情緒" },
  { fileKey: "personality_traits", label: "Personality Traits 性格特質" },
  ```
  放在陣列裡 `people` 之後、`parts_of_body` 之前，跟 `WORLDS` 裡的順序一致即可（順序不影響功能，只是方便閱讀）。
- `WORLDS` 的 world1：
  ```ts
  {
    key: "world1",
    label: "世界一：我和我的家",
    topicFileKeys: ["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"],
  },
  ```

### 2.（重要）清掉被取代的舊檔案

`content/vocab/personal_characteristics.json` 這 4 個檔案（vocab／sentences／passages／glossary）裡的 32 個字，跟新拆出來的 `appearance`／`emotions`／`personality_traits` 三個主題的 32 個字**英文拼字完全重複**（例如 `tall` 同時是 `voc.personal_characteristics.009` 也是 `voc.appearance.001`）。

`app/src/content.ts` 用 `import.meta.glob("../../content/vocab/*.json", ...)` 讀取 vocab，這個 glob 是讀「整個資料夾底下所有檔案」，**不是只讀 `TOPICS` 陣列裡登記的主題**——也就是說，就算 `personal_characteristics` 已經從 `TOPICS`／`WORLDS` 移除、選單上看不到這個主題了，只要 `content/vocab/personal_characteristics.json` 這個檔案還在，它裡面的 32 個字還是會被讀進 `globalVocabByEnglish`（跨主題全域查詢表，短文點字翻譯、單字收藏都靠這張表），造成 `tall`／`short`／`happy`... 這些字同時對應到兩個不同的 `vocab.id`（舊的 `personal_characteristics.*` 跟新的 `appearance.*`/`emotions.*`/`personality_traits.*`），最後哪個生效取決於 `import.meta.glob` 回傳物件的 key 順序，是不應該依賴的不確定行為。

**請直接刪除這 4 個檔案**（不是清空成 `[]`，是整個檔案刪掉）：
```
content/vocab/personal_characteristics.json
content/sentences/personal_characteristics.json
content/passages/personal_characteristics.json
content/glossary/personal_characteristics.json
```

（我這邊的工作資料夾有「既有檔案不能刪除或改名」的限制，所以這 4 個檔案沒有先幫你清掉，只能留給你這邊處理；如果你這邊也有類似限制沒辦法刪檔，退而求其次的做法是把 `content/vocab/personal_characteristics.json` 改成空陣列 `[]`，`content/sentences/personal_characteristics.json` 也改成 `[]`，`content/glossary/personal_characteristics.json` 改成空物件 `{}`——`content/passages/personal_characteristics.json` 因為 `passage.schema.json` 要求一定要有 `id`/`title`/`text`/`status` 等必填欄位、不能是空物件，這個沒辦法簡單清空，如果不能刪檔的話這個檔案的重複字問題無法完全解決，請跟我確認怎麼處理）。

### 3.（建議，非必要）補 `TOPIC_THUMBS`

```ts
appearance: { emoji: "🧑", className: "thumb-appearance" },
emotions: { emoji: "😊", className: "thumb-emotions" },
personality_traits: { emoji: "🌟", className: "thumb-personality-traits" },
```
對應的 `.thumb-*` class 在 `style.css` 只要設一個 `background`，沿用既有色票即可，例如可以直接沿用原本 `.thumb-personal-characteristics` 用過的顏色分給這三個新主題。這步驟做不做都不影響功能，只是視覺完整度。

### 4. `verify-world-completion-badges.ts` 同步更新

這支腳本裡有自己一份 `WORLDS` 常數（跟 `main.ts` 的 `WORLDS` 保持一致）跟 `AVAILABLE_TOPIC_FILE_KEYS`（代表「目前 main.ts 實際已上架可玩」的主題清單）。這次**沒有先幫你改**，因為在你完成第 1、2 步之前，`personal_characteristics` 都還是實際上架中的主題，這支腳本改了反而會跟現實不符。等你把 `main.ts` 換成三個新主題之後，請：

- 把約第 53 行 `WORLDS` 裡 world1 的 `topicFileKeys` 換成 `["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"]`（跟 `main.ts` 保持一致）
- 把約第 62-77 行 `AVAILABLE_TOPIC_FILE_KEYS` 裡的 `"personal_characteristics"` 換成 `"appearance"`、`"emotions"`、`"personality_traits"` 三筆
- 約第 132 行測試 3 裡 `for (const fileKey of ["family", "people", "personal_characteristics", "parts_of_body"])` 這行也要跟著把 `"personal_characteristics"` 換成三個新 fileKey，不然這個測試會沒辦法讓 world1 真的達成完成狀態（world1 現在需要 6 個主題全部通過 Stage D）

### 5. 重新驗證與 build

1. 重跑全部 `verify-*.ts`（含步驟 4 改過的 `verify-world-completion-badges.ts`），確認 21 支全部通過。
2. `npm run build` 通過（含 `tsc --noEmit`）。
3. `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`。
4. `node scripts/build-content-review.mjs` 重新產生 `content-review.html`。
5. 實際打開試玩，確認世界一首頁顯示 6 個主題卡片（不再有 Personal Characteristics，改成 Appearance／Emotions／Personality Traits 三張），三個新主題都能點進去、字卡暖身到 Stage D 六關都能跑完，短文點字翻譯功能顯示正常；另外找幾個熟悉的字（例如 `tall`、`happy`、`kind`）在任何一個主題的短文裡點看看，確認只會查到一個乾淨的翻譯結果，沒有奇怪的重複或不一致。

## 範圍界線

- 這次只處理「把已經拆好的三個新主題接進選單、清掉舊 personal_characteristics 資料」，不要順便去改 `content/` 底下這三個新主題的資料內容（單字／例句／短文），資料已經是我這邊確認過的最終版本。
- 不要動世界六（還沒開始規劃內容，`WORLDS` 裡已經預留 `topicFileKeys`，這次不用管）。
- 如果過程中發現除了本文件列的地方以外，還有其他地方寫死 `personal_characteristics`（例如某個徽章邏輯、某個統計數字），先跟我確認要不要動，不要自己直接改動內容資料或既有徽章邏輯。
