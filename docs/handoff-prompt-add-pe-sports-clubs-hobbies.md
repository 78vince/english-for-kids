# Handoff Prompt：新增 PE / Sports 體育課、Clubs & Hobbies 社團活動兩個主題

## 背景

使用者想在單元三「上學去」補上「體育課」（運動相關單字）跟「社團活動」（小學常見興趣嗜好）。這對應到 `docs/content-plan.md` 原本規劃在單元六「時間與節日」裡、但還沒動工的「Sports/interests/hobbies」主題，這次拆成兩個主題，並且改放進單元三（理由：體育課、社團活動都是學生在學校會遇到的日常情境，跟單元三既有的 School／Numbers／Colors 更貼近，詳見 `docs/content-plan.md` 3.1 節 2026-08-24 註）。

content 端（`content/vocab/pe_sports.json`、`content/vocab/clubs_hobbies.json`，以及對應的 `sentences`／`passages`／`glossary` 四份檔案）已經全部建立完成並驗證過（含 `jsonschema` 驗證、跨主題單字衝突掃描、短文查字模擬、全部 21 支 `verify-*.ts`、`npm run build`）。App 端只需要在 `main.ts` 登記這兩個新主題，不用改任何遊戲邏輯——`content/` 底下的檔案已經是 `import.meta.glob` 會自動讀到的正確格式，跟其他既有主題完全一樣。

## 需要的改動（`app/src/main.ts`）

### 1. `TOPICS` 陣列（約第 76 行）新增兩筆

```ts
const TOPICS: TopicConfig[] = [
  // ...既有的 24 筆...
  { fileKey: "school", label: "School 學校" },
  { fileKey: "numbers", label: "Numbers 數字" },
  { fileKey: "pe_sports", label: "PE / Sports 體育課" },        // 新增
  { fileKey: "clubs_hobbies", label: "Clubs & Hobbies 社團活動" }, // 新增
  { fileKey: "animals_insects", label: "Animals & Insects 動物與昆蟲" },
  // ...其餘不變...
];
```

放的位置不影響功能（`TOPICS` 只是清單，畫面呈現順序由 `UNITS.topicFileKeys` 的順序決定），建議放在 `numbers` 後面、`animals_insects` 前面，跟單元三在 `UNITS` 裡的順序一致，方便閱讀。

### 2. `UNITS` 陣列（約第 123 行）：`unit3` 補上兩個 `topicFileKeys`

```ts
{
  key: "unit3",
  label: "單元三：上學去",
  topicFileKeys: ["school", "numbers", "colors", "pe_sports", "clubs_hobbies"],  // 原本只有 school/numbers/colors
},
```

`unit6` 原本規劃的 `topicFileKeys` 裡有 `sports_hobbies` 這個佔位字串（對應還沒建置的舊規劃），這次拆分後這兩個主題已經確定移到單元三，所以把 `sports_hobbies` 從 `unit6` 移除：

```ts
{
  key: "unit6",
  label: "單元六：時間與節日",
  topicFileKeys: ["time", "holidays_festivals", "sizes_measurements"],  // 移除 sports_hobbies
},
```

### 3. `TOPIC_THUMBS`（約第 1176 行）新增兩筆縮圖設定

```ts
const TOPIC_THUMBS: Record<string, { emoji: string; className: string }> = {
  // ...既有的...
  pe_sports: { emoji: "⚽", className: "thumb-pe-sports" },
  clubs_hobbies: { emoji: "🎵", className: "thumb-clubs-hobbies" },
};
```

`className` 只要跟其他主題一樣是「thumb-用連字號分隔的 fileKey」格式即可，實際顏色由 CSS 那邊統一處理（沒有專屬樣式規則的話會退回預設外觀，不影響功能，可之後再美化）。

## 不需要改的地方

- 沒有任何遊戲邏輯（`MatchingGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`FlashcardGame`／`buildCapstoneQuestions`）需要改，這些都是吃 `content/` 資料的通用邏輯，新主題會自動套用。
- `content/badges/badges.json` 的 `badge.unit_completion.unit3` 徽章條件文字是「上學去單元內所有主題皆通過 Stage D 綜合關卡」，沒有寫死主題清單，不用改。
- Stage D 綜合關卡（`buildCapstoneQuestions`）、單字收藏、短文點字查中文全部通用，不用個別接線。

## 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 建議跑一次 `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`，記得同步覆蓋專案根目錄那份重複的 `demo-standalone.html`（`cp app/demo-standalone.html ../demo-standalone.html`）。
- 可以順手跑 `node scripts/build-content-review.mjs` 確認新主題有出現在內容審閱頁（content 端已經把這支腳本的 `TOPICS` 清單同步加好了）。
- 完成後在 `HANDOFF.md` 對應的「新增 PE / Sports、Clubs & Hobbies 兩個主題」條目下方補一行「App 端已於 main.ts 執行完成」的記錄即可，不用開新編號（沿用先前 Weather / 單元一改名 handoff 的慣例）。
