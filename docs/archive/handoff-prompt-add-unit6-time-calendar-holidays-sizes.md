# Handoff Prompt：新增單元六「時間與節日」四個主題（Time／Calendar／Holidays & Festivals／Sizes & Measurements）

## 背景

使用者要求正式開始規劃單元六「時間與節日」。原本規劃只有 Time／Holidays & Festivals／Sizes & Measurements 三個主題，但 Time 的候選字（報時概念＋星期＋月份）合計超過 40 個，跟使用者確認後決定拆成兩個主題：**Time**（報時＋一天中的時段＋相對日期詞，22 字）與 **Calendar**（星期＋月份＋日曆概念詞，27 字）。所以單元六最終是 4 個主題，不是原規劃的 3 個。

content 端（`content/vocab/time.json`、`content/vocab/calendar.json`、`content/vocab/holidays_festivals.json`、`content/vocab/sizes_measurements.json`，以及對應的 `sentences`／`passages`／`glossary` 四份檔案 × 4 個主題）已經全部建立完成並驗證過（含 `jsonschema` 驗證、跨主題單字衝突掃描、短文查字模擬、全部 21 支 `verify-*.ts`、`npm run build`）。App 端只需要在 `main.ts` 登記這四個新主題，不用改任何遊戲邏輯——`content/` 底下的檔案已經是 `import.meta.glob` 會自動讀到的正確格式，跟其他既有主題完全一樣。

## 需要的改動（`app/src/main.ts`）

### 1. `TOPICS` 陣列新增四筆

```ts
const TOPICS: TopicConfig[] = [
  // ...既有的 26 筆...
  { fileKey: "health", label: "Health 健康" },
  { fileKey: "forms_of_address", label: "Forms of Address 稱謂" },
  { fileKey: "time", label: "Time 時間" },              // 新增
  { fileKey: "calendar", label: "Calendar 日曆" },       // 新增
  { fileKey: "holidays_festivals", label: "Holidays & Festivals 節日" },  // 新增
  { fileKey: "sizes_measurements", label: "Sizes & Measurements 尺寸與量測" },  // 新增
];
```

放的位置不影響功能（`TOPICS` 只是清單，畫面呈現順序由 `UNITS.topicFileKeys` 的順序決定），建議放在單元五（`forms_of_address`）後面，方便閱讀。

### 2. `UNITS` 陣列：`unit6` 從 3 個 `topicFileKeys` 變成 4 個

```ts
{
  key: "unit6",
  label: "單元六：時間與節日",
  topicFileKeys: ["time", "calendar", "holidays_festivals", "sizes_measurements"],
  // 原本是 ["time", "holidays_festivals", "sizes_measurements"]（規劃階段的佔位清單，還沒真的建過內容）
},
```

### 3. `TOPIC_THUMBS` 新增四筆縮圖設定

```ts
const TOPIC_THUMBS: Record<string, { emoji: string; className: string }> = {
  // ...既有的...
  time: { emoji: "⏰", className: "thumb-time" },
  calendar: { emoji: "📅", className: "thumb-calendar" },
  holidays_festivals: { emoji: "🎉", className: "thumb-holidays-festivals" },
  sizes_measurements: { emoji: "📏", className: "thumb-sizes-measurements" },
};
```

`className` 只要跟其他主題一樣是「thumb-用連字號分隔的 fileKey」格式即可，實際顏色由 CSS 那邊統一處理（沒有專屬樣式規則的話會退回預設外觀，不影響功能，可之後再美化）。

## 不需要改的地方

- 沒有任何遊戲邏輯（`MatchingGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`FlashcardGame`／`buildCapstoneQuestions`）需要改，這些都是吃 `content/` 資料的通用邏輯，新主題會自動套用。
- `content/badges/badges.json` 的 `badge.unit_completion.unit6` 徽章條件文字是「時間與節日單元內所有主題皆通過 Stage D 綜合關卡」，沒有寫死主題清單，不用改。
- Stage D 綜合關卡（`buildCapstoneQuestions`）、單字收藏、短文點字查中文全部通用，不用個別接線。

## 特別提醒：`app/scripts/verify-unit-completion-badges.ts` 已經預先把這 4 個主題（連同先前的 `bathroom`）加進 `AVAILABLE_TOPIC_FILE_KEYS`

這個 script 原本的設計是「跟 main.ts 的 TOPICS 一致」，只收實際已經上架可玩的主題。這次 content 端為了讓測試邏輯提前跟 `UNITS` 的新規劃對齊，已經把 `bathroom`／`time`／`calendar`／`holidays_festivals`／`sizes_measurements` 都加進 `AVAILABLE_TOPIC_FILE_KEYS`——這代表在 App 端還沒執行這份 handoff prompt之前，這支 script 的假設會**暫時領先於 main.ts 的實際狀態**（測試本身仍然全部通過，因為沒有任何既有測試會真的去完成這幾個主題的 Stage D）。等這份 handoff prompt 執行完、`main.ts` 的 `TOPICS`／`UNITS` 也同步更新後，兩邊就會一致，不需要額外改動這支 script。

## 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 建議跑一次 `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`，記得同步覆蓋專案根目錄那份重複的 `demo-standalone.html`（`cp app/demo-standalone.html ../demo-standalone.html`）。
- 可以順手跑 `node scripts/build-content-review.mjs` 確認新主題有出現在內容審閱頁（content 端已經把這支腳本的 `TOPICS` 清單同步加好了）。
- 完成後在 `HANDOFF.md` 對應的「新增單元六四個主題」條目下方補一行「App 端已於 main.ts 執行完成」的記錄即可，不用開新編號（沿用先前 PE / Sports、Bathroom 等 handoff 的慣例）。
