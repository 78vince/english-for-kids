# Handoff：English for Kids LetsGo 第二輪（Stage P 逐格填空＋區網固定 IP 防呆＋script 修正）

*撰寫：2026-10-04（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）*
*只改新專案；不要動原專案 `English for Kids/app/`、`content/`。*

## 背景

第一輪已驗收（平板、區網啟動皆正常）。本輪三件事，另有一項內容端已完成的資料變更需要你接線。

## 1. 修正 `app/scripts/verify-level-unit-content.ts`（路徑含空格會壞）

第 21 行：

```ts
const CONTENT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../content");
```

`.pathname` 不會解碼 `%20`，專案路徑「English for Kids LetsGo」含空格就 ENOENT。改成：

```ts
import { fileURLToPath } from "node:url";
const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../content");
```

並 grep `app/scripts/` 與 `app/*.ts`、`vite*.config.ts` 內所有 `.pathname` 用法，一併改掉。驗證：直接在含空格的專案路徑下跑 `npx tsx scripts/verify-level-unit-content.ts`（不要複製到別處）要通過。

## 2. Stage P 改為逐格填空（內容端已備妥 `cloze` 欄位）

內容端已在 `content/level4/unit{1,2,3}/sentences.json` 每一筆（共 19 筆）加入：

```json
"cloze": {
  "text": "___ she need a tennis racket? Yes, she ___.",
  "answers": ["Does", "does"],
  "distractors": ["Do", "is"]
}
```

規則（已用腳本驗證）：`text` 中的 `___` 依序以 `answers` 填回，結果與 `example_sentence.en` **逐字完全相同**；`answers` 是該句的文法重點（動詞變化、助動詞、序數詞等），1–2 格；`distractors` 是 2 個常見錯誤形。

實作要求：

1. **Schema**：`content/schema/pattern-sentence.schema.json` 新增 `cloze` 物件（`text`、`answers`、`distractors`；`answers` 與 `distractors` 為字串陣列，`answers` 至少 1 個，`text` 中 `___` 的數量必須等於 `answers.length`）。
2. **互動**：畫面維持顯示 `pattern_zh` 與例句中文；英文句子用 `cloze.text` 顯示，`___` 畫成空格。下方詞卡 = `answers` ＋ `distractors`，洗牌；孩子點詞卡依序填入空格（可點已填的詞卡退回）。全部空格填滿後判題：逐格與 `answers` 比對（大小寫要一致，句首的 `Does` 不可用 `does` 取代）。答對：播放完整例句語音（沿用現有朗讀）；答錯：顯示 `grammar_point` 提示，可重試，錯誤計入正確率。
3. **Fallback**：若某筆沒有 `cloze`（之後新增的單元可能還沒補），沿用第一輪的「組出整句」玩法，不要報錯。
4. 第一輪的詞卡干擾項邏輯（`distractorsFor`）在有 `cloze` 時不使用，但保留給 fallback。
5. 進度、星等、徽章（GM-07/08 句型練習題數）沿用既有計算方式，不要改 key。
6. 更新 `scripts/verify-level-unit-content.ts`：對每筆有 `cloze` 的句型驗證「填回後 == example_sentence.en」「`___` 數量 == answers 數量」「distractors 不與 answers 相同」；有 `cloze` 的筆數要在輸出中列出（目前應為 6 + 7 + 6 = 19）。

## 3. 區網固定 IP：嚴格防呆（使用者要求嚴格執行）

**規則**：學習紀錄存在平板瀏覽器、跟著「網址（IP＋port）」走。電腦區網 IP 變動 → 平板網址變動 → 孩子紀錄會歸零。因此：

1. `區網啟動.command` 每次啟動時，把偵測到的 IP 與專案根目錄的 `.last-ip`（新增，加進 `.gitignore`）比對：
   - 第一次（沒有 `.last-ip`）：寫入目前 IP，印出提示「請到路由器為這台電腦設定固定 IP（DHCP 保留），否則 IP 變動會讓平板的學習紀錄歸零」。
   - IP 相同：正常啟動。
   - **IP 不同**：用醒目的多行警告印出「舊 IP → 新 IP」及後果，**暫停等待使用者輸入 `y` 才繼續**（輸入其他任何內容或直接關閉視窗＝中止，不啟動）。使用者輸入 `y` 後才更新 `.last-ip`。
2. 找不到區網 IP（沒連 Wi-Fi）時不要啟動，直接結束並說明原因（目前是印警告後仍繼續）。
3. port 維持 5180、`--strictPort`（已是如此）。
4. 在新專案 `README.md` 與 `HANDOFF.md` 加一節「固定 IP 規則（必須遵守）」，寫明上述規則與原因，並寫上 macOS 查本機 IP 與路由器設定 DHCP 保留的做法（僅文字說明，不需要實際操作路由器）。
5. 驗證：手動把 `.last-ip` 改成別的值再執行，確認會警告並停下等待；輸入 `n` 會中止、輸入 `y` 會繼續並更新檔案。

## 4. 驗證與回報

- `npm run build`、`npm run build:standalone`、全部 verify 腳本通過（含含空格路徑下的 `verify-level-unit-content.ts`）。
- 以 Unit 1–3 各跑一輪 Stage P，確認：逐格填空、大小寫判題、答錯提示、有／無 `cloze` 兩種資料都可運作（可臨時移除一筆 `cloze` 測 fallback，測完還原）。
- 手機（390px）與平板（820px）截圖檢查 Stage P 的詞卡排列與空格（空格需要足夠寬，不能因詞卡長度而跑版）。
- 在新專案 `HANDOFF.md` 記錄結果；未完成項目要明講。
- 不要修改 `content/level4/` 的內容檔；如發現內容問題（例如某句 cloze 不合理），回報給內容端修。
