# 任務：把「Tableware 餐具」主題改名成「Kitchen & Dining 廚房與餐具」

## 背景

「Tableware 餐具」主題依使用者要求擴充範圍，從純餐具（chopsticks／knife／plate／bowl／fork／cup／spoon，7 字）加入 6 個廚房電器／設備字（refrigerator／stove／pot／sink／microwave／oven），變成 13 字。內容資料已經寫好、驗證過（`jsonschema` 通過、`vocab_ids` 交叉引用檢查通過、全部 21 支 `verify-*.ts` 都過），**內容資料這次不用檢查**，只需要改一個地方。

## 這次只需要改一行

`app/src/main.ts` 約 91 行：

```ts
{ fileKey: "tableware", label: "Tableware 餐具" },
```

改成：

```ts
{ fileKey: "tableware", label: "Kitchen & Dining 廚房與餐具" },
```

**`fileKey` 不要改**，還是 `"tableware"`——這次不是新增主題或拆分主題，只是幫既有主題改名＋擴充內容，`content/` 底下的檔案都沒有改路徑，`WORLDS`（約 125 行 world2 的 `topicFileKeys`）跟 `TOPIC_THUMBS`（約 1160 行 `tableware: { emoji: "🍽️", className: "thumb-tableware" }`）都不用動，`🍽️` 這個 emoji 拿來代表「廚房與餐具」也還算合適，不強制要求換。

## 驗證

改完之後跑一次 `npm run build`（含 `tsc --noEmit`）確認過，實際打開試玩確認世界二的主題卡片顯示「Kitchen & Dining 廚房與餐具」，點進去可以看到 13 個字（含新加的廚房電器）。不用重新跑 `verify-*.ts`，這次改動不涉及任何驗證腳本檢查的邏輯。
