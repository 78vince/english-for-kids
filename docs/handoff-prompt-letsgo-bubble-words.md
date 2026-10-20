# Handoff：戳泡泡補充單字（`bubble_words.json`）

*撰寫：2026-10-04（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜回應新專案 HANDOFF §7.4 的回報*
*只改新專案；不要動原專案。*

## 背景

戳泡泡過濾規則（去冠詞、排除含空格／連字號、只留 3–7 字母）讓 Unit 2 只剩 SINGER、WRITER 兩個字。內容端的解法：**從課堂片語裡取出 3–7 字母的關鍵單字**（如 `climb a mountain` → `climb`），另存成每 Unit 一個補充檔，戳泡泡可以多用這些字。不修改 `vocab.json`。

## 內容端已備妥

`content/level4/unit{1,2,3}/bubble_words.json`：陣列，每筆：

```json
{ "vocabId": "l4u2.voc.017", "word": "climb", "zh": "攀爬" }
```

- `vocabId` 指向同 Unit `vocab.json` 的來源片語；`word` 為全小寫、純英文字母、3–7 個字母；`zh` 是**這個單字本身**的中文提示（不是整個片語），戳泡泡的中文提示請用它。
- 筆數：Unit 1 共 6、Unit 2 共 20、Unit 3 共 18。加上原本可用的單字，單一 Unit 可用字數約為 Unit 1：19、Unit 2：22、Unit 3：24。
- 同一個單字若在同 Unit 出現多次（或與 `vocab.json` 本身的單字重複），以 `word` 去重。

## 要做的事

1. **Schema**：`content/schema/` 新增 `bubble-word.schema.json`（`vocabId`、`word`（`^[a-z]{3,7}$`）、`zh`，皆必填）。
2. **載入**：`content.ts` 以 `import.meta.glob("../../content/level*/unit*/bubble_words.json")` 載入（**檔案可缺**，沒有檔案的 Unit 視為空陣列）。
3. **題源**：`buildBubbleWords(vocab, unitKey)` 現有規則不變，再**併入**該 Unit 的 `bubble_words`（`en` 用 `word`、中文提示用 `zh`）；以 `word` 去重（同字時保留 `vocab.json` 原本那筆）。「全部 Unit」題源同樣併入所有已開放 Unit 的補充字。各關長度設計（3–4／4–5／5／5–6／6–7）與「找不到時用最接近長度」的 fallback 維持。
4. **移除警示**：Unit 2 單選時不再需要「（會重複出題）」，改為「可用單字數」足夠（≥ 15）時不顯示該標示；仍低於門檻（例如之後的某個 Unit）才顯示。
5. **驗證腳本**：`verify-level-unit-content.ts` 增加檢查——`bubble_words.json`（若存在）每筆 `vocabId` 存在於同 Unit vocab、`word` 符合 `^[a-z]{3,7}$`、`zh` 非空；輸出各 Unit 戳泡泡可用單字數（預期 19／22／24，全部不重複計為 59 以內，以實際去重結果為準）。

## 驗證

- `npm run build`、`npm run build:standalone` 與全部 verify 腳本通過。
- 區網 dist 版：戳泡泡選「Unit 2」連玩 3 局，確認 5 關不再重複出題（或重複率明顯降低），泡泡的中文提示是單字本身的意思（例如 `climb` 顯示「攀爬」，不是「爬山」）；選「全部 Unit」、「Unit 1」、「Unit 3」也各玩一局，沒有空格或大寫混入。
- 手機（390px）、平板（820px）快速目視檢查泡泡提示文字不被截斷。
- 在新專案 `HANDOFF.md` 記錄結果。若發現某個補充字不適合（太難、中文提示不清楚），回報內容端調整，不要自行改檔。
