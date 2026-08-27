# 任務：把世界四＋五新增的 7 個主題接進 App 選單

## 背景

`content/vocab／sentences／passages／glossary/` 已經補好 7 個新主題的完整內容（Weather & nature、Geographical terms、Places & directions、Occupations、Money、Health、Forms of address），每個主題都有單字＋例句、4 句 Stage B 例句、1 篇短文＋3 題理解題、補充詞彙表，格式已經跑過 `jsonschema` 驗證（`vocab.schema.json`／`sentence.schema.json`／`passage.schema.json`／`glossary.schema.json`），也交叉確認過 `vocab_ids` 引用都存在、每題 `answer` 都在 `options` 裡、每題 `source_sentence` 都是短文 `text` 的逐字子字串。**內容資料這次不用再檢查**，只需要把它們接進 App。

好消息是這次要動的地方很小：`app/src/main.ts` 的 `WORLDS`（世界地圖分組）**已經預先把這 6 個新主題的 `fileKey` 都填好了**（見下方），只有 `TOPICS` 陣列跟 `forms_of_address` 這一個世界五分組還需要補。

## 相關檔案

- `app/src/main.ts`
  - 約 76-91 行：`TOPICS: TopicConfig[]` —— 目前只登記 14 個已上架主題，這次要在陣列最後新增 7 行
  - 約 107-138 行：`WORLDS: WorldConfig[]` —— **世界四（`world4`）、世界五（`world5`）的 `topicFileKeys` 已經預先填好** `weather_nature`／`geographical_terms`（world4）與 `places_directions`／`occupations`／`money`／`health`（world5），這是先前規劃時就寫好等內容補齊的；**只有 world5 缺一個 `"forms_of_address"`**（原始規劃漏掉這個主題，內容補齊時才發現，見 `docs/content-plan.md`〔原檔名 `content-plan-gept-kids.md`〕3.1 節新加的註記），這次要把它加進 world5 的 `topicFileKeys` 陣列
  - 約 1138-1152 行：`TOPIC_THUMBS` —— 首頁主題卡片縮圖（emoji＋底色 class），找不到對應項目時會自動退回 `DEFAULT_TOPIC_THUMB`（📘＋預設底色），所以**這個不是必要項目**，但補上視覺效果會更好（School／Numbers 這兩個既有主題目前也還沒補，可以參考現況決定要不要順便一起補，不強制）
- `app/src/style.css` 約 662-712 行：`.thumb-*` 系列樣式，如果要補 `TOPIC_THUMBS` 就要在這裡新增對應 class（純背景色，直接沿用既有 design token 色票即可，不用發明新顏色，既有樣式裡同一個顏色被兩三個主題共用也是正常情況，例如 `.thumb-family` 跟 `.thumb-clothing` 都用 `--color-accent-pink`）
- `app/scripts/verify-multi-topic.ts` —— 這支驗證腳本內部有一份寫死的 `TOPICS` 清單（HANDOFF.md 9.25 節提過，先前世界三上架時就漏更新過一次），這次記得也同步加上新主題，不然這支驗證會漏測到新內容
- `docs/content-plan.md`（原檔名 `content-plan-gept-kids.md`）3.1 節 —— 世界規劃表已經更新過（world5 已加上 Forms of address），這裡不用再改，僅供對照
- `app/src/main.ts` 約 1974-1976 行：`renderAbout()` 裡「關於本站」頁面顯示的文字，目前寫死「一個給小朋友在家練習 GEPT Kids 單字、句型與短文的學習平台。沒有排行榜、沒有跟別人比較，只記錄你自己的進步。」——這句話是這次順便要處理的第二件事，見下方第 5 點
- `app/scripts/verify-about-page.ts` —— 裡面有測試字串比對到「關於本站」頁面的文案，改了上面那句話記得同步改測試比對的字串，不然這支驗證會失敗

## 要做的事

### 1. `TOPICS` 陣列新增 7 行

比照現有寫法（`{ fileKey: "...", label: "英文 中文" }`），加在陣列最後：

```ts
{ fileKey: "weather_nature", label: "Weather & Nature 天氣與自然" },
{ fileKey: "geographical_terms", label: "Geographical Terms 地理名詞" },
{ fileKey: "places_directions", label: "Places & Directions 地點與方位" },
{ fileKey: "occupations", label: "Occupations 職業" },
{ fileKey: "money", label: "Money 金錢" },
{ fileKey: "health", label: "Health 健康" },
{ fileKey: "forms_of_address", label: "Forms of Address 稱謂" },
```

label 的中英文字串可以微調成跟既有 12 個主題的命名風格更一致，不用完全照抄，但 `fileKey` 一定要跟 `content/` 底下的檔名完全一致（`weather_nature`／`geographical_terms`／`places_directions`／`occupations`／`money`／`health`／`forms_of_address`），這是內容檔案已經用掉的正式命名，不要另外改。

### 2. `WORLDS` 補上 `forms_of_address`

world5（約 129-132 行）目前是：

```ts
{
  key: "world5",
  label: "世界五：生活情境",
  topicFileKeys: ["places_directions", "occupations", "money", "health"],
},
```

加上 `"forms_of_address"`：

```ts
topicFileKeys: ["places_directions", "occupations", "money", "health", "forms_of_address"],
```

world4（約 123-127 行）不用改，`weather_nature`／`geographical_terms` 已經在裡面，加上 `animals_insects` 這個世界四就滿了（世界四規劃只有這 3 個主題）。

### 3.（建議，非硬性規定）補 `TOPIC_THUMBS`

如果想讓這 7 個新主題在首頁也有專屬 emoji 縮圖而不是退回預設值，可以參考：

```ts
weather_nature: { emoji: "🌦️", className: "thumb-weather-nature" },
geographical_terms: { emoji: "⛰️", className: "thumb-geographical-terms" },
places_directions: { emoji: "🏙️", className: "thumb-places-directions" },
occupations: { emoji: "👩‍⚕️", className: "thumb-occupations" },
money: { emoji: "💰", className: "thumb-money" },
health: { emoji: "🩺", className: "thumb-health" },
forms_of_address: { emoji: "🙋", className: "thumb-forms-of-address" },
```

對應的 `.thumb-*` class 在 `style.css` 只要設一個 `background`，沿用既有色票即可（例如挑幾個目前還沒用過或用得少的 token）。這步驟做不做都不影響功能，只是視覺完整度，你評估後決定即可，不用先跟我確認。

### 4. `verify-multi-topic.ts` 同步更新

把這支腳本裡寫死的主題清單加上這 7 個新 `fileKey`，讓它們也被納入「字卡暖身＋Stage A→B-1→B-2→C→D 六個關卡都能跑完一輪」的既有驗證流程，不用另外寫新的驗證邏輯。

### 5.（順便一起處理）「關於本站」頁面文字移除特定測驗機構名稱

跟這次的主題接線是不同的事，但剛好都要動 `main.ts`，一起處理比較有效率。背景：專案文件（`README.md`／`HANDOFF.md`／`docs/content-plan.md`／`content/vocab/*.json` 的 `source` 欄位）已經把「GEPT Kids」這個特定測驗機構的品牌名稱移除，改用中性描述，原因是該機構已公開聲明其測驗名稱、服務標章受商標保護，字表本身也有著作權聲明，為避免商標／著作權爭議才這樣調整（詳見 `docs/content-plan.md` 開頭的更新記錄、`HANDOFF.md` 第 5 節與最上面的說明）。但 App 內「關於本站」頁面（`renderAbout()`，約 1974-1976 行）顯示的文字目前還沒改：

```ts
aboutText.textContent =
  "一個給小朋友在家練習 GEPT Kids 單字、句型與短文的學習平台。沒有排行榜、沒有跟別人比較，只記錄你自己的進步。";
```

改成不指名特定機構的版本，例如：

```ts
aboutText.textContent =
  "一個給小朋友在家練習國小英語常用單字、句型與短文的學習平台。沒有排行榜、沒有跟別人比較，只記錄你自己的進步。";
```

文字微調成什麼樣子不用跟我確認，只要不指名任何特定測驗機構名稱、語意跟原本一致即可。改完後 `app/scripts/verify-about-page.ts` 裡對應比對這句文案的測試字串要同步更新，不然驗證會失敗。

## 實作檢查清單

1. `main.ts`：`TOPICS` 加 7 行、`WORLDS` 的 world5 補 `forms_of_address`。
2. （建議）`main.ts` 的 `TOPIC_THUMBS` ＋ `style.css` 的對應 `.thumb-*` 補齊 7 個新主題的縮圖。
3. `main.ts`：`renderAbout()` 裡的文案移除「GEPT Kids」字樣，改用中性描述；`verify-about-page.ts` 同步更新測試比對字串。
4. `verify-multi-topic.ts` 加上這 7 個新 `fileKey`，重跑一次連同其餘既有 `verify-*.ts`（共 21 支）全部通過。
5. `npm run build` 通過後，記得比照 HANDOFF.md 9.35 節提過的做法，重新跑 `node scripts/build-standalone-demo.mjs` 更新 `demo-standalone.html`，不然 `content/` 跟 `TOPICS`／`WORLDS`／文案的改動不會反映到這個單檔試玩版。
6. 實際打開試玩，確認世界四、世界五都不再顯示「敬請期待」，7 個新主題卡片都能點進去、字卡暖身到 Stage D 六關都能跑完，短文點字翻譯功能（含 `Mr.`／`Mrs.` 這種特殊字）顯示正常；「關於本站」頁面文字確認已經不再出現「GEPT Kids」字樣。

## 範圍界線

- 這次只處理「把已經寫好的 7 個主題接進選單」，不要順便去改 `content/` 底下這 7 個主題的資料內容（單字／例句／短文），資料已經是我這邊確認過的最終版本。
- 不要動世界六（Time／Holidays & festivals／Sports, interests & hobbies／Sizes & measurements）——那 4 個主題還沒開始規劃內容，`WORLDS` 裡雖然已經預留了 `topicFileKeys`（`time`／`holidays_festivals`／`sports_hobbies`／`sizes_measurements`），但對應的 `content/` 檔案還不存在，這次不用管，世界六頁面會自動顯示「敬請期待」。
- 如果過程中發現 `TOPICS`／`WORLDS` 以外還有其他地方（例如某處寫死的主題數量、某個徽章判斷邏輯）需要跟著調整才能正確運作，先跟我確認要不要動，不要自己直接改動內容資料或既有徽章邏輯。
