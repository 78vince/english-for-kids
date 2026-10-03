# Handoff Prompt：新增 Bathroom 浴室主題

## 背景

使用者想在單元二「食衣住行」新增「浴室」主題。這對應到 `docs/content-plan.md` 3.1 節 2026-08-24（十七）那則記錄——當時討論 Health 擴充時使用者就問過「浴室」要不要另開主題，查過 Houses & Apartments 後發現「bathroom」這個房間名稱本身已經收錄，浴室裡的物品/動作可以另開一個新主題，但那次使用者決定「先不建」。這次使用者要求正式開這個新主題。

content 端（`content/vocab/bathroom.json`，以及對應的 `sentences`／`passages`／`glossary` 四份檔案）已經全部建立完成並驗證過（含 `jsonschema` 驗證、跨主題單字衝突掃描、短文查字模擬、全部 21 支 `verify-*.ts`、`npm run build`）。App 端只需要在 `main.ts` 登記這個新主題，不用改任何遊戲邏輯——`content/` 底下的檔案已經是 `import.meta.glob` 會自動讀到的正確格式，跟其他既有主題完全一樣。

## 需要的改動（`app/src/main.ts`）

### 1. `TOPICS` 陣列新增一筆

```ts
const TOPICS: TopicConfig[] = [
  // ...既有的 25 筆...
  { fileKey: "houses_apartments", label: "Houses & Apartments 房子與公寓" },
  { fileKey: "tableware", label: "Tableware 餐具" },
  { fileKey: "bathroom", label: "Bathroom 浴室" },  // 新增
  { fileKey: "transportation", label: "Transportation 交通工具" },
  // ...其餘不變...
];
```

放的位置不影響功能（`TOPICS` 只是清單，畫面呈現順序由 `UNITS.topicFileKeys` 的順序決定），建議放在 `tableware` 後面、`transportation` 前面，跟單元二在 `UNITS` 裡的順序一致，方便閱讀。

### 2. `UNITS` 陣列：`unit2` 補上一個 `topicFileKeys`

```ts
{
  key: "unit2",
  label: "單元二：食衣住行",
  topicFileKeys: ["food_drink", "clothing_accessories", "houses_apartments", "tableware", "bathroom", "transportation"],
  // 原本是 ["food_drink", "clothing_accessories", "houses_apartments", "tableware", "transportation"]
},
```

### 3. `TOPIC_THUMBS` 新增一筆縮圖設定

```ts
const TOPIC_THUMBS: Record<string, { emoji: string; className: string }> = {
  // ...既有的...
  bathroom: { emoji: "🛁", className: "thumb-bathroom" },
};
```

`className` 只要跟其他主題一樣是「thumb-用連字號分隔的 fileKey」格式即可，實際顏色由 CSS 那邊統一處理（沒有專屬樣式規則的話會退回預設外觀，不影響功能，可之後再美化）。

## 不需要改的地方

- 沒有任何遊戲邏輯（`MatchingGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`FlashcardGame`／`buildCapstoneQuestions`）需要改，這些都是吃 `content/` 資料的通用邏輯，新主題會自動套用。
- `content/badges/badges.json` 的 `badge.unit_completion.unit2` 徽章條件文字是「食衣住行單元內所有主題皆通過 Stage D 綜合關卡」，沒有寫死主題清單，不用改。
- Stage D 綜合關卡（`buildCapstoneQuestions`）、單字收藏、短文點字查中文全部通用，不用個別接線。

## 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 建議跑一次 `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`，記得同步覆蓋專案根目錄那份重複的 `demo-standalone.html`（`cp app/demo-standalone.html ../demo-standalone.html`）。
- 可以順手跑 `node scripts/build-content-review.mjs` 確認新主題有出現在內容審閱頁（content 端已經把這支腳本的 `TOPICS` 清單同步加好了，這支腳本原本就漏了 weather_nature／geographical_terms／places_directions／occupations／money／health／forms_of_address 這 7 個舊主題——這是既有缺口，不是這次造成的，這次只補上 bathroom 自己）。
- 完成後在 `HANDOFF.md` 對應的「新增 Bathroom 浴室主題」條目下方補一行「App 端已於 main.ts 執行完成」的記錄即可，不用開新編號（沿用先前 PE / Sports、Weather 等 handoff 的慣例）。
