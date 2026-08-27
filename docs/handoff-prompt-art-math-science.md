# Handoff Prompt：Colors→Art、Numbers→Math 改名擴充，新增 Science 自然科學主題

## 背景

使用者要求把單元三的 Colors 主題改名擴充為「美術課（Art）」、Numbers 主題改名擴充為「數學（Math）」，並新增一個新學科主題 Science（自然科學）。經 `AskUserQuestion` 確認範圍後，這次改動是**直接改名＋擴充**（不是砍掉重建），也就是：

- `colors`／`numbers` 兩個 fileKey **完全不變**（沿用原本的 vocab id、badge、玩過紀錄），只調整 `main.ts` 裡的**顯示名稱** `label`，並在 content 端擴充了新單字。這跟先前「Tableware 擴充改名為 Kitchen & Dining」（`fileKey` 維持 `tableware`）是同一個模式。
- Science 是全新主題，`fileKey` 是 `"science"`，掛在單元三（`unit3`）底下。

content 端已經全部建立完成並通過驗證（`jsonschema` 驗證、跨主題單字衝突掃描、短文查字模擬、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`、`build-content-review.mjs`）：

- `content/vocab/colors.json`：19 個原有單字（顏色）+ 16 個新單字（美術用品／美術課概念：paint／brush／scissors／glue／crayon／marker／sticker／paper／craft／art／canvas／palette／easel／clay／sketch／sculpture），共 35 字。對應 `sentences/colors.json`（19 句）、`passages/colors.json`（短文改成「My Art Class」，原本的「My Favorite Colors」短文已整篇改寫）、`glossary/colors.json`（同步改寫）。
- `content/vocab/numbers.json`：30 個原有單字（0～100 數詞）+ 19 個新單字（運算概念：math／add／subtract／plus／minus／equal／count／shape 8 個 + 形狀：circle／square／triangle／star／heart 5 個 + 進階：multiply／divide／pattern／calculator／more／less 6 個），共 49 字。對應 `sentences/numbers.json`（15 句）、`passages/numbers.json`（短文改成「My Math Class」，原本的「A Fun Day at the Zoo」短文已整篇改寫）、`glossary/numbers.json`（同步改寫）。
- `content/vocab/science.json`（全新檔案）：20 個單字（核心 12 個：science／experiment／observe／plant／seed／leaf／grow／magnet／energy／air／sound／planet + 進階 8 個：gravity／force／solid／liquid／gas／matter／battery／electricity）。對應 `sentences/science.json`（11 句）、`passages/science.json`（短文「My Science Class」）、`glossary/science.json`（新檔案）。

**特別提醒（詞義衝突，已確認是刻意保留、不是漏掃）**：

- `star`：`numbers`（Math）收的是「星形」（形狀），跟 `weather_nature` 原本收的「星星」（天體）是不同意思的刻意重複，兩邊各自的主題底下點字查詢都會查到自己主題的版本，不會互相污染（跟既有的 `cold`＝health「感冒」vs. weather_nature「寒冷的」是同一種情況）。
- `brush`：`colors`（Art）收的是「畫筆」（名詞），`bathroom` 這次也新增了一個「brush」（動詞，刷牙的刷）——這是因為 Art 新增 `brush` 之後，`bathroom` 短文裡原本「brush my teeth」的 `brush` 會被 Art 的全域查詢表誤蓋成「畫筆」，所以在 `bathroom.json` 也補了一個 `voc.bathroom.019`（brush＝刷，動詞）讓 bathroom 自己主題的查詢優先權蓋過去。這個修正已經做完，不需要 App 端再處理。
- `plant`／`grow`：`science` 各自收了一份跟 `geographical_terms`／`family` 意思相同的版本（植物／生長），屬於同義重複收錄，不影響查詢正確性。

content/ 底下的檔案已經是 `import.meta.glob` 會自動讀到的正確格式，跟其他既有主題完全一樣。這份 handoff 只需要 App 端在 `main.ts` 做三件事：**改兩個 label、新增一個主題登記**。

## 需要的改動（`app/src/main.ts`）

### 1. `TOPICS` 陣列：改兩筆 label，新增一筆

```ts
const TOPICS: TopicConfig[] = [
  // ...
  { fileKey: "colors", label: "Art 美術" },       // 原本是 "Colors 顏色"，只改 label
  // ...
  { fileKey: "numbers", label: "Math 數學" },      // 原本是 "Numbers 數字"，只改 label
  // ...
  { fileKey: "science", label: "Science 自然科學" },  // 新增
];
```

`colors`／`numbers` 這兩筆**只改字串，`fileKey` 完全不動**——不要為了改名去改 `fileKey`，那樣會讓既有的收藏紀錄、Stage D 完成紀錄、badge 判斷全部對不上。

### 2. `UNITS` 陣列：`unit3` 的 `topicFileKeys` 新增 `"science"`

```ts
{
  key: "unit3",
  label: "單元三：上學去",
  topicFileKeys: ["school", "numbers", "colors", "pe_sports", "clubs_hobbies", "science"],
  // 原本是 ["school", "numbers", "colors", "pe_sports", "clubs_hobbies"]，新增 "science"
},
```

### 3. `TOPIC_THUMBS` 新增一筆（`colors`／`numbers` 的縮圖不用改，emoji 剛好都還適用）

```ts
const TOPIC_THUMBS: Record<string, { emoji: string; className: string }> = {
  // ...既有的...
  colors: { emoji: "🎨", className: "thumb-colors" },   // 不用改，🎨 剛好也適合美術課
  numbers: { emoji: "🔢", className: "thumb-numbers" }, // 不用改，🔢 也適合數學
  science: { emoji: "🔬", className: "thumb-science" }, // 新增
};
```

## 不需要改的地方

- 沒有任何遊戲邏輯（`MatchingGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`FlashcardGame`／`buildCapstoneQuestions`）需要改。
- `content/badges/badges.json` 沒有任何地方寫死 "Colors"／"Numbers" 字樣（已用 grep 確認過），改名不影響徽章文案。
- Stage D 綜合關卡、單字收藏、短文點字查中文全部通用，不用個別接線。

## 特別提醒：`app/scripts/verify-unit-completion-badges.ts` 已經把 `science` 加進 `AVAILABLE_TOPIC_FILE_KEYS`，`unit3.topicFileKeys` 測試 fixture 也已經改成 6 個

跟先前 Bathroom／單元六的慣例一樣，content 端已經讓這支 script 的測試 fixture 提前對齊 `UNITS` 的新規劃（`unit3` 從 5 個主題變成 6 個），測試本身全部通過。等這份 handoff 執行完、`main.ts` 同步更新後，兩邊就會一致，不需要再改這支 script。

`app/scripts/build-dashboard.mjs` 的 `UNITS` fixture 也已經把 `colors`／`numbers` 的 label 改成 `"Art 美術"`／`"Math 數學"`，並把 `science` 加進去（標記 `pendingAppWiring: true`）。**這份 handoff 執行完之後，記得把 `science` 那筆的 `pendingAppWiring: true` 拿掉**（比照先前 Bathroom／單元六接線完成後的慣例），然後重新跑一次 `node scripts/build-dashboard.mjs` 讓 `dashboard.html` 反映最新狀態。

## 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 建議跑一次 `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`，記得同步覆蓋專案根目錄那份重複的 `demo-standalone.html`（`cp app/demo-standalone.html ../demo-standalone.html`）。
- 可以順手跑 `node scripts/build-content-review.mjs` 確認 Science 有出現在內容審閱頁（content 端已經把 `colors`／`numbers` 的 label 同步改成 "Art 美術"／"Math 數學"，並把 `science` 加進這支腳本的 `TOPICS` 清單，不用再改）。
- 完成後在 `HANDOFF.md` 對應的「Colors→Art、Numbers→Math、新增 Science」條目下方補一行「App 端已於 main.ts 執行完成」的記錄即可，不用開新編號（沿用先前 PE / Sports、Bathroom、單元六等 handoff 的慣例）。
