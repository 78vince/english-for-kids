# 任務：新增「字卡記憶＋測驗輪替」學習單元（插在 Stage A 之前）

## 背景

要在每個主題現有的題型關卡（Stage A 單字配對／Stage B-1 句子排序／Stage B-2 句子填空／Stage C 短文理解／Stage D 綜合關卡）**之前**，新增一個獨立的學習單元：先用字卡讓使用者記憶單字，字卡與測驗題交錯出現，測驗只考選擇題（中翻英／英翻中／聽音選英文／聽音選中文）。

我先檢查過現有程式碼，這個功能有大量可以直接沿用的既有機制，**不要重新發明**，細節如下。

## 相關檔案

- `content/schema/vocab.schema.json`、`content/vocab/*.json` — 單字資料（目前 `Vocab` 型別**沒有**例句欄位，見下方「內容缺口」）
- `app/src/types.ts` — `Vocab` / `Sentence` / `Passage` / `PassageQuestion` 型別定義，這次要改的話從這裡開始
- `app/src/progress.ts`（第 16 行）與 `app/src/badgeStats.ts`（第 16 行）— **兩處各自獨立定義了一份幾乎一樣的 `StageKey` / `StageKeyForBadges` type**（`"matching" | "ordering" | "fillBlank" | "choice" | "capstone"`），新增這個學習單元的 stageKey 時，這兩處都要同步改，改掉一個忘了改另一個會讓成效追蹤或徽章判斷其中一邊壞掉
- `app/src/main.ts` 裡的 `STAGE_ROWS`（約 1233-1238 行）與主題選單/關卡跳轉邏輯（`goToTopicStage`、`STAGE_ROWS.map(...)` 那幾處）— 新關卡要接進主題選單，並排在 Stage A 之前
- `app/src/matchingGame.ts` — 裡面已經有 `buildBatchesAvoidingSynonymClashes()`，把主題單字自動分成每批 6 個、同一批不會出現同義詞，這個學習單元的分批邏輯直接沿用同一套，不要另外設計
- `app/src/capstoneQuestions.ts` — Stage D 綜合關卡已經示範過「把單字資料組成 `PassageQuestion` 形狀（question/options/answer/type），丟給既有 `ChoiceGame` 引擎作答」這個做法，裡面的 `buildVocabQuizQuestions()` 就是一個「"word" 是什麼意思？」四選一題目產生器（英翻中方向），這次的四種測驗題型**直接照這個函式的寫法做姊妹版本**，不要重新做一套答題狀態機
- `app/src/choiceGame.ts` — 上面提到的既有單選題引擎（`ChoiceGame` class），構造子吃一個 `Passage` 物件，這次一樣可以組一個「假的」`Passage`（`questions` 換成新產生的題目清單）來重用它
- `app/src/speech.ts` — 已有 `speakEnglish(text)`（唸單字/短句）可以直接重用來做字卡「自動語音」跟聽音測驗題的發音，不用另外接 TTS
- `assets/design-tokens/design-tokens.css` — 視覺樣式請沿用既有色彩/圓角/字體 token，跟其他關卡（matching/choice 等畫面）風格保持一致

## 內容缺口：單字目前沒有專屬例句（這次要一併補上）

`content/vocab/*.json` 的每筆單字目前**沒有**「例句」欄位——`content/sentences/*.json` 裡的句子是給 Stage B 用的多字綜合例句（一句常常涵蓋 2-3 個單字、搭配文法點），不是每個單字各自的專屬例句，而且每個主題只有 4 句，跟主題單字量（Family 21／Colors 12／Animals & insects 31）對不起來，沒辦法拿來一對一當字卡例句用。

請執行以下內容擴充：

1. 在 `content/schema/vocab.schema.json` 與 `app/src/types.ts` 的 `Vocab` 型別，新增欄位 `example_sentence: { en: string; zh: string } | null`。
2. 幫現有三個主題（Family／Colors／Animals & insects，共 64 個單字）的每一筆單字都補上一句簡單、符合國小低中年級程度、只圍繞這個單字本身的例句（原創撰寫，不要照抄 `content/sentences/*.json` 既有句子）。
3. 沿用既有的 `status: draft/reviewed/published` 慣例——新寫的例句先標 `draft`，其餘沒動到的欄位維持原狀，不要動到既有的 `id`／`en`／`zh`／`pos` 等欄位。

如果覺得 64 句一次寫完的品質不好掌握，可以先完成 Family 一個主題、跟我確認品質跟語氣抓得對不對，再繼續 Colors、Animals & insects，不用一次全部做完才回報。

## 功能規劃

### 1. 新關卡定位

插在 Stage A 之前，**不要**把既有 Stage A-D 重新編號（不要把單字配對從 Stage A 改成 Stage B 之類），單純新增一個獨立 stageKey（例如 `"flashcards"`），排在 `STAGE_ROWS` 最前面。原因：既有的徽章世界通關邏輯、進度資料、選單標籤都已經跟 Stage A-D 的既有命名綁在一起，重新編號的改動範圍會遠大於單純插入一個新關卡，沒有必要。

建議名稱「字卡暖身」或「單字記憶」，實際定名請自行決定即可，不用特別跟我確認。

### 2. 字卡（記憶）畫面

- 顯示：單字（英文＋中文）、`example_sentence`（英文＋中文）、自動語音。
- 進入畫面自動呼叫 `speakEnglish(vocab.en)` 唸一次單字，並提供一個手動重播按鈕（可以順便把例句也做一個重播按鈕，念 `example_sentence.en`）。

### 3. 測驗（選擇題）畫面：四種題型

1. **中翻英**：題目顯示中文意思，四選一選出正確英文單字
2. **英翻中**：題目顯示英文單字，四選一選出正確中文意思（`capstoneQuestions.ts` 的 `buildVocabQuizQuestions()` 已經是這個方向，可以直接參考或重用）
3. **聽音選英文**：題目播放 `speakEnglish(vocab.en)`，四選一選出正確英文單字
4. **聽音選中文**：題目播放 `speakEnglish(vocab.en)`，四選一選出正確中文意思

干擾選項（錯誤選項）做法沿用 `buildVocabQuizQuestions()` 現成邏輯：從同主題其他單字裡挑，並排除 `related_forms`（同義詞）避免曖昧題目。

**每個單字只出一題（四種題型隨機挑一種），不要四種都考**——用 Animals & insects（31 個單字）試算，四種都考會變成 124 題測驗，對小朋友來說太長。

### 4. 記憶／測驗輪替方式

建議：一張字卡緊接著一題該單字的測驗，逐字輪替（字卡 1 → 測驗 1 → 字卡 2 → 測驗 2 …），並沿用 `matchingGame.ts` 裡 `buildBatchesAvoidingSynonymClashes()` 的分批邏輯（預設每批 6 個單字），不要一次把整個主題的單字都跑完，維持跟 Stage A 一致的節奏感。

### 5. 可略過設計（建議，非硬性規定）

建議允許使用者跳過字卡直接進測驗（例如重玩同一個主題時，已經很熟的孩子不用每次都被強迫複習一遍）。這點如果你評估後覺得不需要也可以先不做，不影響其他部分。

## 這次要順便處理的技術檢查點

- `progress.ts` 與 `badgeStats.ts` 的 `StageKey`/`StageKeyForBadges` 兩處定義要同步新增這個 stageKey。
- 確認新增這個 stage 之後，既有依賴 `STAGE_ROWS.length` 算「主題全通關」的邏輯（`main.ts` 裡 `computeAchievementAggregates()`／`topicsFullyCompleted` 那段）會不會受影響——理論上因為它是動態算 `STAGE_ROWS.length` 不是寫死數字，應該會自動吃到新關卡，但請實際跑一次確認，不要只憑邏輯推論。
- 新關卡的成效紀錄一樣要走 `progress.ts` 既有的 `profileId` 分帳號存法，不要另開一套。

## 範圍界線

- 這次只做這個新學習單元＋補齊三個既有主題的 `example_sentence` 內容，不要順便去改 Stage A-D 既有題型的邏輯或版面。
- 徽章頁面（`content/badges/badges.json`）先不用因為這個新關卡新增徽章，除非你在做的過程中發現有非做不可的理由，那請先跟我確認再動手。
- 如果過程中發現 `content/` 的資料格式還有其他不方便的地方，一樣先跟我確認要不要調整，不要自己直接改。
