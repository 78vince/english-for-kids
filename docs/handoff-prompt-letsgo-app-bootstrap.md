# Handoff：建立獨立 app「Level N - Unit N 課堂複習版」（第一版）

*撰寫：2026-10-04（內容端）｜執行：App 端*
*前置條件已滿足：demo-standalone 白頁問題已修復（HANDOFF §9.177）。*

## 1. 目標與決議

- 從現行 `app/` **複製一份**成獨立專案，改版為「Level → Unit」導覽的課堂複習 app。現行站不動、兩邊各自演進。
- 使用者：自家孩子，對應課堂進度。私有，**不推 GitHub Pages**；用電腦區網提供平板使用。
- 命名一律 `Level N - Unit N`，畫面與資料中不出現教材書名／出版社名。
- 第一版精簡：**不帶遊戲室、不做 Stage C 短文**。保留徽章機制（圖案與名稱之後再換）。

## 2. 新專案位置與初始化

- 新資料夾：`/Users/admin/VK Agent/English for Kids LetsGo/`（與現行專案同層，獨立 `git init`，不設遠端或只設私有 repo）。
- 複製 `app/`（排除 `node_modules/`、`dist/`、`dist-standalone/`、所有 `vite.config.ts.timestamp-*.mjs`）。
- 複製 `content/schema/`（參考用）與 `content-letsgo/` → 新專案的 `content/`（結構見 §4）。
- 新專案自建精簡版 `README.md`、`HANDOFF.md`（從 §1 起算），不複製現行站的歷史紀錄。
- `package.json` 的 name／description 改掉；`index.html` title、品牌橫幅、關於頁、頁尾文字改為「Level N - Unit N 複習」，移除現行站網址與社群連結。

## 3. 保留／移除

**保留**：字卡暖身、Stage A 單字配對、Stage B-1/B-2（排序／填空，先沿用於 `vocab.example_sentence`）、Stage D 綜合關卡（若依賴 passage 則先隱藏）、語音朗讀、進度與星等紀錄、成就徽章機制、設計系統（tokens、-700 色階、轉場按鈕規範）、手機／平板 RWD、`build:standalone`。

**移除（第一版）**：遊戲室（`app/games/`、voiceLab／memoryMatch／crossword／bubblePop 四個 Vite entry、`gameBridge.ts` 相關、`content/games|crosswords`）、Stage C 短文與 glossary、Stage E 會話（`conversations`）、現行站的 7 單元主題內容與對應場景插圖（`public/` 內不需要的資產，約 129 張）、分享／社群相關區塊。移除後 `vite.config.ts` 只剩 `main` 單一 entry，順便讓 standalone 設定更單純。

註：移除是「刪除功能」而非隱藏，避免死碼；現行站仍保留原樣供日後比對。

## 4. 內容資料格式（已由內容端備妥）

```
content/level4/level.json              Level 概要、planned_units、各單元狀態
content/level4/unit{N}/unit.json       title_en/zh、grammar_focus、phonics、culture_reading_note
content/level4/unit{N}/vocab.json      陣列；id=l4u{N}.voc.NNN；topic=單元內分組
content/level4/unit{N}/sentences.json  陣列；id=l4u{N}.sen.NNN；pattern_en/pattern_zh/grammar_point/example_sentence
content/level5/ …                      之後同格式新增
```

- 載入：`import.meta.glob("../../content/level*/unit*/vocab.json")` 等，以路徑解析 level／unit；Unit 4–8 目前不存在，程式需容忍「planned 但無檔案」並在 UI 顯示「尚未開放」。
- `vocab.json` 欄位與現行 `vocab.schema.json` 相同（`topic` 改當單元內分組，不再是主題 fileKey）。`sentences.json` 是**新格式**（句型框架＋例句），不是現行 `sentence.schema.json`；請在新專案內新增 `schema/` 並以此為準。
- `unit.json` 的 `culture_reading_note` 僅為備註，**不要顯示在孩子畫面上**。

## 5. 導覽與關卡設計

- 首頁：選 Level（目前只有 Level 4，其他灰階標示「即將推出」）→ 選 Unit（1–8；未整理的顯示「尚未開放」）。
- 單元頁依序：**字卡暖身 → 單字配對（Stage A）→ 排序／填空（Stage B，用例句）→ 句型練習（新）**。
- 進度、星等、徽章的 key 改為 `l4u{N}`（不再是主題 key）；徽章先以「完成 Unit N」為單位，沿用現有機制，圖案暫用現有素材。
- 轉場按鈕、重玩按鈕沿用既有規範（重玩一律 `secondary-btn`、轉場不加 emoji）。

## 6. 新題型：句型代換練習（單獨成一個 Stage，建議命名 Stage P）

資料：`sentences.json` 每筆有框架（`pattern_en`，空格以 `___` 表示）與 `example_sentence`。

互動（第一版先做最小可用）：
1. 畫面顯示中文情境／句型中文（`pattern_zh`），與一個英文框架。
2. 下方提供詞卡（人稱、單字、動詞變化形，如 want/wants、do/does），孩子點選填入空格。
3. 判題：以 `example_sentence.en` 為標準答案做字串比對（先不做多解）；錯誤時提示該句型的文法重點（`grammar_point`）。
4. 每個 Unit 的句型題出完即完成該 Stage，計星等。

此題型的詞卡選項需要由程式從 `example_sentence.en` 拆詞並加入 1–2 個干擾項（同單元 vocab 或人稱／be 動詞變化）。若實作上覺得第一版太大，可先退到「排序題」（把 `example_sentence.en` 打散重排），Stage P 留到第二輪。

## 7. 區網提供平板使用

- `npm run build`，再 `npx serve dist -l 5180`（或 `vite preview --host`），平板連 `http://<電腦區網 IP>:5180`。
- 加入 PWA 基本設定（manifest、圖示、`display: standalone`），平板可「加入主畫面」；service worker 先不做，避免快取造成更新困擾。
- 新專案根目錄加 `區網啟動.command`（雙擊自動 build 並啟動、印出區網網址），比照現行站的 `.command` 檔風格。
- 語音朗讀依賴瀏覽器 TTS，請在平板實測一次；區網 `http://` 下 Web Speech 通常可用，若有限制再回報。

## 8. 驗證

1. `npm run build` 與 `npm run build:standalone` 皆通過；雙擊 `dist-standalone` 的 html 可正常顯示（file:// 無 CORS 錯誤）。
2. 首頁 → Level 4 → Unit 1–3 皆可進入，Unit 4–8 顯示「尚未開放」且不報錯。
3. 單字配對、排序／填空以 Unit 1 內容跑完一輪，星等與徽章正常寫入。
4. 全專案 grep：不得出現教材書名／出版社名、`world`／舊主題 key、遊戲室相關殘留引用。
5. 手機與平板寬度目視檢查首頁、Unit 頁。
6. 在 HANDOFF 記錄結果，並回報哪些項目沒做（如 Stage P）。

## 9. 不要做的事

- 不要修改現行 `app/` 與 `content/`。
- 不要把 `assets/letsgo/` 的教材照片複製到新專案或任何部署輸出。
- 不要新增遠端部署（GitHub Pages 等）。
