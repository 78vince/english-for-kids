# Handoff：第三輪-A 遊戲室回歸（填字遊戲＋戳泡泡）

*撰寫：2026-10-04（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜規劃見原專案 `docs/plan-letsgo-round3-games-story-badges.md` §1*
*只改新專案；不要動原專案 `English for Kids/app/`、`content/`。範圍：**只帶回填字與戳泡泡**，翻牌配對與 Voice Lab 不帶。*

## 1. 內容端已備妥

- `content/games/games.json`：只列 `crossword`、`bubble_pop`（見檔案；cost 皆為 5、status active）。
- `content/level4/unit{1,2,3}/crossword.json`：**陣列**，每個元素是一關（目前每 Unit 1 關，之後可能 2 關）。格式沿用原站 `crossword.schema.json`，差異只有：
  - `id`：`crossword.l4u1.getting_ready` 這種格式（含數字）。
  - `topicFileKey`：值為 Unit key（`l4u1`），語意是「單字來源 Unit」。
  - `words[].vocabId`：指向同 Unit `vocab.json` 的 id（`l4u1.voc.NNN`）；`en` 全大寫單字、無空格。
  - 每關 3–6 個單字，格子 ≤ 9×9，已由內容端腳本驗證（交疊字母一致、無非預期相連、全連通）。
- 內容端另有驗證工具 `scripts/gen-letsgo-crossword.py --verify`（在原專案），你不需要處理；App 端只需在 `verify-level-unit-content.ts` 加入對應檢查（見 §4）。

## 2. 要做的事

1. **恢復程式**：從原專案 `English for Kids/app/` 複製以下到新專案並改名／改路徑（不要複製翻牌、Voice Lab 相關）：
   - `app/games/crossword.html`、`app/games/bubble-pop.html`
   - `src/games/crosswordGame.ts`、`crosswordStandalone.ts`、`crosswordStandalone.css`、`bubblePopGame.ts`、`bubblePopStandalone.ts`、`bubblePopStandalone.css`、`gameIcons.ts`（只留這兩款需要的圖示）
   - `src/gameBridge.ts`、`src/gameTokens.ts`、`src/gameHighScores.ts`，以及遊戲用到的音效／圖片資產（填字背景、戳泡泡背景等，只複製這兩款有引用的）
   - `vite.config.ts` 新增兩個 entry（`crossword`、`bubblePop`）；`speech.ts` 若被遊戲引用，維持現狀。
2. **遊戲室入口**：首頁恢復「遊戲室」入口與遊戲清單，資料讀 `content/games/games.json`（遊戲卡片、代幣花費、鎖定／高分顯示沿用原站行為）。
3. **填字題源**：載入 `content/level4/unit*/crossword.json`（`import.meta.glob`，每檔是陣列）。選關介面以 **Level／Unit** 組織（不是主題）；尚未開放或沒有題庫的 Unit 顯示「尚未開放」，不報錯。`Crossword` 型別的 `topicFileKey` 改解讀為 Unit key；`vocabId` 查詢改走 Level／Unit 的 vocab 索引。
4. **戳泡泡題源**：原本從多主題 vocab 組題（含顏色專用邏輯）→ 改成讀 Level／Unit vocab：
   - 預設題源 = 目前已開放 Unit 的全部單字；提供「單一 Unit」選項（若原站有選主題 UI，沿用並改為選 Unit）。
   - 移除顏色專屬分支（`isColors`、`DEFAULT_COLOR_WORDS` 等舊站概念）。
   - 片語型單字（如 `a towel`、`climb a mountain`、`sleeping bag`）：泡泡拼字若不適合含空格，請在題源過濾時**排除含空格的單字**（或去掉冠詞後仍含空格者），並在 `HANDOFF.md` 記錄規則；不要讓遊戲出現無法點選的空格。
5. **代幣、高分、星等**：沿用原站機制；localStorage key 前綴保持 `levelUnitReview.`，遊戲高分與星等的 key 以 Unit（`l4u1`）而非主題命名。
6. **Schema**：`content/schema/` 補 `game.schema.json`（可由原專案複製）與更新後的 `crossword.schema.json`（`id` pattern 改為 `^crossword\\.l\\d+u\\d+\\.[a-z_]+$`、`topicFileKey` 說明改為 Unit key、`vocabId` 說明改為指向 Unit vocab）。

## 3. 技術注意（請在 HANDOFF 記錄結論）

- 遊戲是 iframe 獨立頁。**區網 `dist` 版（主要使用方式）必須正常**。
- 單檔 `build:standalone`：先確認 `vite.standalone.config.ts` 只含 `main`；遊戲室回來後若 standalone 版遊戲打不開，**不要**為此把遊戲 inline 進單檔；改為在 standalone 版隱藏遊戲室入口（或顯示「請用區網版開啟」說明），並把這個決定寫進 HANDOFF 與 README。
- 遊戲頁與 main 共用的模組（`speech.ts`、`gameBridge.ts`）若造成 chunk 拆分，區網版沒有問題；standalone 設定不應被影響。

## 4. 驗證

1. `npm run build`、`npm run build:standalone` 與全部 verify 腳本通過；`verify-level-unit-content.ts` 新增：每個 `crossword.json` 每關單字都能在同 Unit vocab 找到（`vocabId` 存在、去冠詞後轉大寫等於 `en`）、字數 3–6、格子 ≤ 9×9、交疊字母一致，並輸出各 Unit 關卡數（目前各 1）。
2. 區網 `dist` 版實測：遊戲室入口 → 填字（Unit 1、2、3 各玩到過關，確認 3 關遞增挖空與星等）→ 戳泡泡（全部 Unit、單一 Unit 兩種題源各玩一輪，確認無空格單字出現）→ 代幣扣除與高分更新。
3. 首頁其他功能（Level／Unit 導覽、各 Stage、徽章）未受影響。
4. 手機（390px）與平板（820px）截圖檢查遊戲室頁與兩款遊戲。
5. 全專案 grep：不得出現教材書名／出版社名、舊站主題 key、翻牌／Voice Lab 殘留引用。
6. 在新專案 `HANDOFF.md` 記錄結果；未完成項目明講。
7. 不要修改 `content/level4/` 與 `content/games/` 內容檔；若發現題庫問題（例如某關太難或單字不合適），回報內容端調整。
