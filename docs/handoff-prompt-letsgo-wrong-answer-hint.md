# Handoff：Stage P 答錯提示改為「正確答案＋原因」

*撰寫：2026-10-04（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）*
*前置：第二輪（`handoff-prompt-letsgo-round2.md`）的逐格填空已完成並驗收。只改新專案。*

## 問題

答錯時目前只顯示「💡 文法重點：need — 第三人稱單數（肯定句）」。這是句型名稱，孩子看不出正確選項是什麼、為什麼。

## 內容端已備妥

`content/level4/unit{1,2,3}/sentences.json` 的每筆 `cloze` 新增 `reasons`：字串陣列，**與 `answers` 一一對應**（第 i 個原因解釋第 i 格）。共 19 筆、23 格，每條是一句給孩子看的簡短中文理由。例：

```json
"cloze": {
  "text": "He ___ a mitt and a bat to play baseball.",
  "answers": ["needs"],
  "distractors": ["need", "has"],
  "reasons": ["主詞是 He（第三人稱單數），動詞要加 s。"]
}
```

## 需求

### 1. Schema 與驗證

- `content/schema/pattern-sentence.schema.json` 的 `cloze` 新增 `reasons`（字串陣列，**選填**）；若有，長度必須等於 `answers.length`。
- `scripts/verify-level-unit-content.ts` 增加檢查：有 `reasons` 時長度需等於 `answers`、每條非空；輸出有 `reasons` 的筆數（目前應為 19）。

### 2. 答錯提示的顯示

取代現在的「文法重點：…」那一行。孩子填滿所有空格且有錯時：

- **只針對填錯的格子**列出說明，填對的格子不重複說明。
- 每個錯誤格子一組，格式（兩行）：
  - 第一行：`正確答案：needs`（答案用粗體或明顯的詞卡樣式；多格時前面標「第 1 格」「第 2 格」，只有 1 格時不用標號）
  - 第二行：`reasons[i]` 的原因文字
- 不要自動把正確答案填進空格；孩子仍然要自己點選修正（保留現行「點紅色格子退回再換詞卡」的流程）。
- 沒有 `reasons` 的資料（fallback）：只顯示「正確答案：…」，並把 `grammar_point` 當作補充小字，不要報錯。
- 原本的 `grammar_point` 在有 `reasons` 時改成提示卡上方的小標籤（小字、次要色），讓家長／孩子知道這題練的是哪個句型；不再當作主要說明。
- 現有的紅字「還不對喔——紅色的格子填錯了…」維持。

### 3. 樣式

- 提示卡沿用設計系統：背景用 `-tint`、文字與邊框用 `-700` 色階（不要用基底色當文字色）。
- 「正確答案」的詞卡樣式與答題詞卡一致但標示為已揭示（例如成功色 `-700` 外框），不要做成可點擊的按鈕。
- 原因文字字級不小於內文；手機 390px 要能自然換行，不超出卡片。
- 不新增 emoji；保留現有 💡 圖示（這是功能性圖示，不是轉場按鈕）。

### 4. 驗證

- Unit 1–3 各挑幾題，故意答錯：單格題（如 Unit 1 第 1 題）、兩格題且只錯一格（如 Unit 1 第 2 題只錯 Does）、兩格全錯，確認顯示的格子、答案與原因正確。
- 填對的格子不出現說明；填對整題後提示消失。
- 暫時移除一筆的 `reasons`（以及一筆整個 `cloze`）測 fallback，測完還原。
- 手機與平板寬度截圖檢查提示卡。
- `npm run build`、`npm run build:standalone`、全部 verify 腳本通過；在 `HANDOFF.md` 記錄結果。
- 不要修改 `content/level4/` 內容檔；若發現某條原因不好懂，回報內容端調整。
