# Handoff Prompt：Weather & Nature 改名為 Weather

## 背景

使用者想把「Weather & Nature 天氣與自然」拆成兩個主題。查過內容後發現候選的「自然地理與地景」類字（beach／river／mountain／lake／sea 等）其實已經是同一個單元（單元四：大自然與動物）底下 **Geographical Terms 地理名詞** 主題的字，不需要另開一個「Nature」主題重複收錄。

跟使用者確認後採用的做法：

1. **Weather & Nature 專心做「天氣」**：改名成「Weather 天氣」，新增天氣現象、氣溫形容詞、四季共 16 個新字（`fileKey` 不變，仍是 `weather_nature`，只改顯示 `label`），從 16 字變 32 字。
2. **不新開 Nature 主題**，把地景類的新字（nature／hill／island／forest／tree／flower／grass／plant／rock／earth／ground）直接併入既有的 **Geographical Terms** 主題，從 5 字變 16 字。這部分不用改 `main.ts` 的任何顯示文字，`fileKey`／`label`／`topicFileKeys` 都不變，純粹是 `content/vocab/geographical_terms.json` 內容變多了。

content 端（`content/vocab/weather_nature.json`、`content/vocab/geographical_terms.json`、對應的 `content/sentences/*.json`）已經全部完成，也都驗證過。App 端只需要一處改動。

## 需要的改動

`app/src/main.ts` 裡 `TOPICS` 陣列的 `weather_nature` 項目：

```ts
{ fileKey: "weather_nature", label: "Weather & Nature 天氣與自然" },   // ← 改成 "Weather 天氣"
```

只改這一行的 `label` 字串，`fileKey`（`"weather_nature"`）、`TOPIC_THUMBS` 裡的縮圖設定（`weather_nature: { emoji: "🌦️", className: "thumb-weather-nature" }`）都不用動。

`UNITS` 陣列裡單元四的 `topicFileKeys: ["animals_insects", "weather_nature", "geographical_terms"]` 也不用改，`weather_nature` 這個識別碼本身沒變。

## 不需要改的地方

- `geographical_terms` 主題完全不用碰，它的顯示名稱、`fileKey`、單元歸屬都沒變，只是內容變多了。
- 沒有任何程式邏輯依賴 `weather_nature` 的 `label` 字串做判斷（只用來顯示），所以不會有連鎖影響。

## 驗證

- `npm run build` 過即可。
- 建議跑一次 `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`，記得同步覆蓋專案根目錄那份重複的 `demo-standalone.html`（`cp app/demo-standalone.html ../demo-standalone.html`）。
- 完成後在 `HANDOFF.md` 對應的 Weather & Nature 拆分條目下方補一行「App 端已於 main.ts 執行完成」的記錄即可，不用開新編號。
