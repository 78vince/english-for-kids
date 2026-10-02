# 兒童英語學習平台 — 專案交接文件（HANDOFF）

最後更新：2026-09-07　　目前階段：**Phase 1～3 全部達標，已正式上架 GitHub Pages（<https://78vince.github.io/english-for-kids/>）**。Phase 1（登入登出、六種文字型題型、成效追蹤）、Phase 2（全部 43 個正式主題＋單元 0，含單元七「文法小幫手」11 個主題，content 端與 App 端皆已接線完成，共 897 個單字／496 句／43 篇短文）、Phase 3（README／授權條款／GitHub Pages 正式上架／首次進站提醒＋「關於本站」使用須知）皆已完成。上架後又完成 3 輪手機版 RWD 修正（`.stage-banner`／`.game-header--with-back` 標題橫向擠壓、字卡作答區喇叭與文字排列、Modal 遮罩在捲動後蓋不滿全螢幕、個人小卡與挑戰紀錄卡片溢出容器等問題）、App 圖示／manifest（可加入主畫面時顯示自訂「羊毛氈字母怪獸 K」圖示）、以及 `上傳更新.command` 自助上傳工具（雙擊即可建置檢查＋跑驗證＋commit＋push，不用再手動下指令）。Phase 4（語音辨識與口說題型）尚未開始，維持延後。過去每一批內容擴充/改版的完整歷程仍保留在下方 9.x 變更紀錄，越新編號越靠上面；本段落之後只在階段性里程碑（Phase 完成、大改版）更新，逐批內容擴充明細請直接看 9.x 系列。

專案定位：給家庭／個人使用的兒童英語學習平台，內容以台灣國小階段常見英語學習主題為主要範圍，初期在本地端開發測試，最終上架至 GitHub（開源）。

> 命名與內容來源說明（2026-08-22）：規劃初期曾直接沿用某特定測驗機構的官方名稱與參考字表作為內容依據，後來發現該機構已就其測驗名稱、服務標章發表商標聲明，字表本身也標示著作權聲明。考量之後要開源公開，已將專案文件（本檔、`docs/content-plan.md`、`README.md`）與 `content/vocab/*.json` 的 `source` 欄位裡的相關品牌引用移除，改用「國小常用英語主題字彙」等中性描述，詳細原因與作法見 `docs/content-plan.md` 開頭的更新記錄。`app/src/main.ts` 裡「關於本站」頁面顯示的文字已於 2026-08-23（9.53）換成新版家長視角自我介紹，全站已無殘留品牌引用，詳見第 9.53 節。

---

## 1. 目前進度總結

| 項目 | 狀態 |
|---|---|
| 專案架構規劃（角色、課程範圍、遊戲題型、成效追蹤、技術問題、開發階段） | ✅ 已完成，見 Obsidian Canvas |
| 兒童英語學習內容規劃（資料結構、關卡分類方式） | ✅ 已完成，見 `docs/content-plan.md`（原檔名 `content-plan-gept-kids.md`） |
| 範例課程內容（43 個正式主題＋單元 0，含單元七 11 個文法主題） | ✅ 全部 43 個正式主題＋單元 0（Greetings／Pronouns 兩個暖身主題）都已接進 App 選單可玩，共 897 個單字／496 句／43 篇短文（見 9.x 系列） |
| 免費語音辨識資源研究 | ✅ 已完成，候選方案已列出，**實作延後至最後階段** |
| App 程式碼 | ✅ Phase 1～3 全部完成——登入登出、六種文字型題型（字卡暖身／配對／排序／填空／選擇／綜合關卡）、成效追蹤、43 個成就徽章、App 圖示／manifest 都已完成並上架，見 `app/` 與第 9 節 |
| 正式上架 | ✅ GitHub Pages 已上線：<https://78vince.github.io/english-for-kids/> |
| 專案 Dashboard | ✅ 已建立，見 `dashboard.html` |

---

## 2. 專案架構規劃（Obsidian Canvas）

路徑：`Obsidian/發想/開發/兒童英語學習平台/架構.canvas`（需用 Obsidian 開啟，非本專案資料夾內）

分成 7 大分支：

1. **系統角色與權限**——只有「管理者（家長／使用者本人）」與「使用者（學習者）」兩種角色，**不做教師角色、不做家長帳號綁定**（家庭/個人用途，已依需求簡化）
2. **課程範圍**——以國小階段常見英語學習主題為核心，預留國中會考／多益 Bridge／主題式生活英語的擴充空間
3. **學習流程與關卡設計**——先練習單字＋例句，再進入配對／排序／填空遊戲，含過關門檻與錯題複習機制
4. **遊戲題型與核心概念**——選擇、填空、拼字、聽力理解題型正常規劃；**口說題型（6 種）已標記 🔇 灰階，因為需要語音辨識，延後開發**
5. **個人學習成效追蹤與獎勵機制**——只做個人成就追蹤（積分、連續天數、單字量、徽章、學習報告），**不做班級排行榜**（已依需求移除）
6. **待確定的技術問題**——語音辨識已研究完候選方案（見第 4 節）；TTS、前端技術選型、後端與資料庫、兒童隱私資安、離線支援等 6 項仍**待決定**
7. **開發與上架規劃**——四個階段（見第 3 節），語音辨識同樣標記 🔇 灰階放在最後

---

## 3. 開發階段規劃（Phase 1-4）

| Phase | 內容 | 狀態 |
|---|---|---|
| Phase 1 | 本地端 MVP：登入登出、課程範圍、配對／排序／填空／選擇四種文字型題型、成效追蹤基本功能 | ✅ 已達標——登入登出（本機端「誰在玩」）、四種題型、成效追蹤都已完成（見第 9 節） |
| Phase 2 | 完善課程內容與個人成效追蹤：擴充其餘主題、積分/徽章/報告 | ✅ 已完成——全部 43 個正式主題＋單元 0（含單元七「文法小幫手」11 個主題）content 端與 App 端皆已接線，連續學習天數、43 個成就徽章、個人檔案「學習成就」六格數據卡、單字收藏功能皆已完成 |
| Phase 3 | 上架 GitHub：README、授權條款、Demo 展示頁面 | ✅ 已完成——README／CC BY-NC 4.0 授權條款皆已補齊，正式站已上架 GitHub Pages：<https://78vince.github.io/english-for-kids/>，首次進站提醒＋「關於本站」使用須知已上線；上架後另完成 3 輪手機版 RWD 修正與 App 圖示／manifest |
| Phase 4 🔇 | 語音辨識與口說題型（延後開發，最後階段） | 研究已完成，尚未開始實作 |

**設計原則**：語音辨識技術風險與開發成本最高，故整個平台先用純文字/選擇/聽力型題型把核心學習迴圈（單字→短句→短文→關卡→成效追蹤）做完、上架驗證，最後才疊加口說功能。

---

## 4. 免費語音辨識資源（已研究，供 Phase 4 使用）

| 方案 | 特性 |
|---|---|
| Web Speech API | 瀏覽器內建、完全免費免金鑰、需連網（Chrome 支援最好），零成本可先做雛形 |
| Whisper／whisper.cpp | OpenAI 開源、可離線自架、準確度目前最高 |
| Vosk | 開源輕量、可離線即時串流，準確度較低但適合資源有限裝置 |
| Azure Pronunciation Assessment | 免費層每月 5 小時，專為語言學習設計、有音素級發音評分，最貼近 Duolingo 體驗但額度有限 |

建議路徑：先用 Web Speech API 做 Phase 4 雛形，之後視需求評估 Azure 免費層或自架 Whisper。

---

## 5. 兒童英語學習內容規劃重點

完整文件：`docs/content-plan.md`（原檔名 `content-plan-gept-kids.md`）

- **範圍依據**：對應 CEFR A1 程度，約 600 字，規劃分 37 個主題分類（26 個內容主題＋11 個文法/功能詞類別，2026-08-22 Personal characteristics 拆成三個主題後從 24 變 26），完整分類清單已整理在文件附錄（`docs/content-plan.md`，2026-08-22 已改名並移除品牌引用，原名 `content-plan-gept-kids.md`）
- **資料結構**：內容即資料，單字／句子／短文各自獨立 JSON 檔，以穩定 ID（`voc.*` / `sent.*` / `pass.*`）互相引用而非複製內容；已處理一詞多義（如 chicken 動物 vs 食物）與不規則詞形（mouse/mice）
- **關卡分類**：26 個內容主題歸納成 6 個「世界」，每個主題內固定走 Stage A 單字 → B 短句 → C 短文 → D 綜合王關；文法功能詞不獨立成關卡，融入短句短文；另設計 Unit 0 新手起手式與跨主題複習關
- **已建立的內容**：這裡列的主題／字數明細已經跟不上後續每批擴充（世界四五 7 主題、Unit 0／People／Personal characteristics 陸續改版），**目前實際內容進度請直接看本節最新的變更歷程（9.x 系列，越新編號越上面）跟 `docs/content-plan.md`**，不要以這裡的舊數字為準；世界三「上學去」（School／Numbers／Colors）**已全部完成，可解鎖世界完成度徽章 WC-03**，這點目前仍然成立。
  - 三份 JSON Schema（`content/schema/`）定義單字/句子/短文的資料結構，供內容驗證 script 使用

---

## 6. 檔案總覽

```
English for Kids/                      ← 專案資料夾（本檔案所在處）
├── HANDOFF.md                         ← 本文件
├── README.md                          ← 專案 README 完整版（專案介紹、使用緣起、內容來源、作者資訊皆已補齊）
├── 上傳更新.command                    ← 雙擊即可建置檢查＋跑驗證＋commit＋push 到 GitHub 的自助上傳工具
├── .gitignore
├── dashboard.html                     ← 專案 Dashboard（瀏覽器開啟，數字由 `app/scripts/build-dashboard.mjs` 部分自動產生）
├── docs/                              ← 內容規劃文件＋交給「技術架構」session 執行的 handoff prompt 文件
├── content/                           ← 課程內容 single source of truth；目前共 43 個正式主題＋單元 0，897 個單字／496 句／43 篇短文，實際數字請看 `dashboard.html` 或執行 build-dashboard.mjs
│   ├── schema/                        ← vocab / sentence / passage JSON Schema
│   ├── vocab/ sentences/ passages/    ← 各主題單字／例句／短文 JSON
│   ├── glossary/                      ← 各主題短文點字看中文意思用的補充詞彙表
│   ├── units/                         ← unit0.json
│   └── badges/badges.json             ← 43 個成就徽章正式定義（10 大分類）
└── app/                                ← 前端 App（Vite + TypeScript），見第 9 節
    ├── src/                           ← 遊戲邏輯與畫面（main.ts 入口；profile.ts 登入登出；progress.ts／badgeStats.ts／playLog.ts 成效追蹤；favorites.ts 單字收藏；sound.ts／speech.ts 音效與語音；flashcardGame.ts／matchingGame.ts／orderingGame.ts／fillBlankGame.ts／choiceGame.ts／capstoneQuestions.ts 各題型）
    ├── public/                        ← 靜態資源（favicon／apple-touch-icon／manifest.webmanifest／icons/），build 時原樣複製進 dist/ 根目錄
    ├── scripts/                       ← 驗證用 script（不是正式測試框架，但涵蓋主要邏輯，共 27 支 verify-*.ts）
    ├── demo-standalone.html           ← 單檔示範版，雙擊可直接在瀏覽器打開試玩
    └── content-review.html            ← 內容審閱頁（單字/句子/短文一次列出，方便校對文字）

Obsidian/發想/開發/兒童英語學習平台/
└── 架構.canvas                        ← 專案架構腦圖（需 Obsidian 開啟）
```

---

## 7. 待決定事項（已更新）

1. ~~前端技術選型（框架）~~ ✅ 已決定：**Vanilla TypeScript + Vite**（不用框架），理由與骨架見第 9 節
2. ~~後端與資料庫~~ ✅ 已決定：**純前端 + localStorage**，不需要後端資料庫（家庭/個人本機用途，見第 9 節成效追蹤）
3. ~~文字轉語音 TTS~~ ✅ 已採用瀏覽器內建 **Web Speech Synthesis API**（`app/src/speech.ts`），零成本、不用音檔／後端；vocab 的 `audio` 欄位仍保留，未來要換真人錄音只要換掉這個檔案內部實作
4. ~~兒童帳號隱私與資安 / 登入登出~~ ✅ 已採用**本機端「誰在玩」使用者切換**（`app/src/profile.ts`）：不用密碼、不用雲端帳號，只在本機瀏覽器記名字，天生不會有兒童個資外洩／跨裝置追蹤的疑慮，符合家庭/個人本機使用的定位
5. 離線使用支援與否——**還沒決定**，目前是純線上瀏覽器頁面（打包成 dist/ 後其實已經是純靜態檔案，理論上可離線，但沒有特別做 Service Worker / PWA 之類的離線快取）

---

## 8. 快速上手（下次回來接手時）

1. 正式站已上線，直接開 <https://78vince.github.io/english-for-kids/> 就能看到目前完成的成果；本機開發可打開 `app/demo-standalone.html`（雙擊，不用跑任何指令）試玩，先選/新增使用者登入，再選主題（全部 43 個正式主題＋單元 0 都可玩），進去玩字卡暖身＋Stage A-D 六種題型
2. 打開 `app/content-review.html` 校對目前所有主題的單字/例句/短文內容
3. 打開 `dashboard.html` 看整體專案進度快照（KPI／內容進度為自動產生，「開發階段」分頁為手動維護）
4. 看第 9 節「App 開發現況」了解程式碼骨架；Phase 1～3 已全部完成並上架（見第 1、3 節），Phase 4（語音辨識口說題型）尚未開始
5. 要跑開發環境：`cd app && npm install && npm run dev`；`npm run build` 會產出 `dist/`
6. 要把本機變更上傳到 GitHub：雙擊專案根目錄的 `上傳更新.command`，會自動建置檢查＋跑全部驗證腳本＋commit＋push，不用手動下指令（僅限使用者自己的 Mac 上執行，因為需要本機已設定好的 SSH 憑證）

---

## 9. App 開發現況（2026-08-03）

技術棧：**Vanilla TypeScript + Vite**，不用框架。理由：Phase 1 目的是驗證「content/ JSON → 型別 → 遊戲邏輯 → 畫面」這條路徑，架構夠簡單、打包後是純靜態檔案，適合最終上架 GitHub Pages；不需要框架的元件生命週期，DOM 直接手刻即可。

資料串接：`app/src/content.ts` 用 `import.meta.glob` 在 build 時把 `content/vocab/*.json`、`content/sentences/*.json`、`content/passages/*.json` 直接打包進 JS，不用執行期 fetch、不用額外的匯入/資料庫層。`content/` 資料夾維持唯一真相來源，這次開發過程沒有更動過 schema 或資料結構。

已完成的四種文字型題型，現在支援多主題切換（開場先選主題，再進題型選單；`app/src/main.ts` 的 `TOPICS` 陣列列出主題清單，只要 `content/` 底下的單字/句子/短文三份檔案都是 `published` 狀態就會自動出現在選單上）：

| 題型 | 檔案 | 資料來源 | 備註 |
|---|---|---|---|
| Stage A 單字配對 | `matchingGame.ts` | `content/vocab/{topic}.json`（Family 15 字／Colors 12 字／Animals & insects 31 字） | 分批配對時會主動避開 related_forms 同批出現（如 parts_of_body 的 foot/feet）；點英文單字會用 Web Speech API 唸出發音 |
| Stage B-1 句子排序 | `orderingGame.ts` | `content/sentences/{topic}.json`（各主題 4 句，stage B） | 支援點擊與拖曳兩種操作、答錯保留原排列並標示對/錯位置、連續答錯後出現提示/跳過、判斷對錯用「文字」而非「字塊實例」比對（處理句子裡重複字如兩個 is 的情況）、可播放整句正確發音 |
| Stage B-2 句子填空 | `fillBlankGame.ts` | 同上，依 `vocab_ids` 挖空一個字 | 用選字作答，不用打字；干擾選項排除同義詞；有播放整句與逐字發音 |
| Stage C 短文理解 | `choiceGame.ts` | `content/passages/{topic}.json`（各主題 3 題） | 單選題，答對/答錯即時回饋 |

目前 Family／Colors／Animals & insects 三個主題的內容都齊全，選主題畫面會列出這三個；之後要再擴充主題，只要把新主題的三份 JSON 檔補齊並設成 `published`，在 `TOPICS` 陣列加一行即可，不用動遊戲邏輯或畫面程式碼。

四種題型答對後畫面都會停在原地，由使用者自己按「下一題/下一句」按鈕才前進，不用計時器自動跳（唯一例外是配對題本來就是選完自動繼續選下一組，沒有這個問題）。

登入登出（`app/src/profile.ts`）：開場第一個畫面是「誰在玩」——列出本機已建立的使用者（含頭像），新增使用者時要先選頭像、輸入名字，再經過一次確認卡片才會真的登入；刪除使用者的功能放在「我的」頁面（只能刪除目前登入的自己）。不用密碼、不用雲端帳號，純粹是本機瀏覽器 localStorage 記名字＋頭像，讓同一台電腦的不同小孩可以分開記錄進度。瀏覽器會記住上次登入的人，下次開啟直接略過選人畫面。頭像素材（`app/src/avatars.ts`）目前共 18 款可愛動物照片（2026-08-05 新增第二批 12 款），原始 1024x1024 照片放在 `assets/photo/`，壓縮成 200x200 縮圖後才進 `app/src/assets/avatars/`，畫面上全部頭像顯示尺寸統一都是 200px。

`app/src/main.ts` 的畫面順序是「選使用者」→「選主題」→「題型選單」，可以不照順序直接跳進任何一關，也保留「完成後自動出現前往下一關」的順序流程。

成效追蹤（`app/src/progress.ts`）：依「使用者＋主題＋題型」分別記錄玩過幾次、最佳正確率、最近一次結果，存進 localStorage（key 格式：`englishForKids.progress.v1.<使用者 id>`），不同使用者、不同主題的紀錄都互相獨立；「重置所有進度」按鈕移到「我的」頁面（只清除目前登入者自己的紀錄）。另外 `app/src/playLog.ts` 記錄每天有沒有玩過（`englishForKids.playLog.v1.<使用者 id>`），用來算「連續遊玩天數」，供成就徽章的「每日習慣」分類使用。

### 9.1 視覺風格 v2「每天玩一點」改版（2026-08-04）

依 `assets/design-tokens/` 底下的 v2 提案改版（`design-tokens.v2-daily-play.css`／`.json`，參考頁面 `screen-preview-daily-play.html`）。使用者原本指定的參考檔案是 `style-guide-preview.html`（v1 舊稿），但資料夾裡已經有更新、更完整對應這次需求（字級加大、功能列、徽章分級）的 v2 提案，所以改用 v2 版本，這裡註明這個替換決定。

- **品牌**：平台名稱「每天玩一點」、Slogan「English for Kids」，見 `main.ts` 的 `appendShell()`（品牌橫幅＋固定功能列，取代原本每個畫面右上角的「頭像＋登出」小標籤）。
- **字級／中性色**：字級全面放大約 10–20%，背景／邊框改中性灰藍（`#F4F6F9`），品牌色相不變，降低實作風險。
- **功能列**：首頁／挑戰紀錄／成就徽章／個人檔案四個分頁（「個人檔案」原本叫「我的」，2026-08-05 改名），選使用者畫面與四種關卡畫面（本來就有自己的「返回選單」按鈕）不套用這個外殼。
- **首頁**：主題清單從直向列表改成 `.topic-card` 卡片＋進度條（`renderTopicSelect`）。
- **挑戰紀錄**：原本只看「目前主題」，改成跨所有主題的攤平清單（`renderStats`，`STAGE_ROWS × availableTopics`）。
- **成就徽章**（`renderBadges`，2026-08-06 全面改版，見下方新段落）：原本是自己另外設計的 4 分類×銅銀金 12 個假徽章，已整個換掉，改成讀取 `content/badges/badges.json` 的正式清單（43 個徽章、10 大分類）。
- **我的**（`renderProfileDetail`，2026-08-05 再改版）：個人小卡改成左右兩欄（左邊頭像不加外框、右邊名字＋時間資訊），時間資訊有三項：加入時間、上次遊玩日期與時間（`formatDateTime()`）、累計遊玩時間（`app/src/playTime.ts`，估算「進入題型畫面」到「那一輪答完」之間經過的時間，玩到一半沒答完不會被算進去）；換頭像、改名字都改成點按鈕跳出小視窗（`.modal-overlay`／`.modal-card`）操作，頭像點了就直接存檔關窗，名字要打完按「儲存」才會存；刪除使用者、重置所有進度紀錄維持在頁面下方。原本的「學習成就總覽」整段在更早之前就移到成就徽章頁了。

驗證：`npm run build`（`tsc --noEmit && vite build`）通過；`app/scripts/verify-playlog-logic.ts`（連續天數演算法，8 個測試）、`verify-playtime-logic.ts`（累計遊玩時間，7 個測試）與其餘既有 `verify-*.ts` 全部重跑一次都通過；有手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認新字串（口號全文、`--color-tier-*`、`F4F6F9`、`modal-overlay`、「累計遊玩時間」）真的有進到最終產出。因為開發沙盒沒有瀏覽器，沒辦法做真正的畫面截圖驗證，正式的視覺確認要靠 `app/demo-standalone.html`。

### 9.170 使用者回報：Stage C「前往 Stage D」按鈕格式跟全站既有轉場不一致，修正 handoff（2026-10-02）

9.169 App 端執行完後，使用者截圖比對 Stage B-2→C、Stage C→D、Stage D→E 三個完成畫面，指出格式不一致：9.169 的實作把「前往 Stage D」做成跟 Stage D→E 的「💬 進入 Stage E」一樣的橘色 reward 樣式排第一顆，但比對全站其餘 4 處既有轉場（字卡暖身→A、A→B-1、B-1→B-2、B-2→C）才發現，橘色 reward 樣式是「Stage E 不是每個主題都有」這個特例才用的，Stage D 綜合關卡是每個主題都一定會經過的必要關卡，應該比照既有轉場的格式：次要按鈕（重玩/從頭再玩）排第一顆、純藍色 `primary-btn`（不是 reward 橘色）排第二顆、文案統一用「前往 Stage X：名稱 →」。改寫 `docs/handoff-prompt-stage-c-next-stage-cta.md`，直接在原檔案裡修正（不開新檔），列出第一版的問題分析＋修正後的完整程式碼，並提醒 Stage D→E 的橘色按鈕本身不用動（那裡才是真正的例外）。待 App 端重新執行。

### 9.169 App 端執行：修正 Stage C 完成畫面沒有引導進入 Stage D 的 bug（2026-10-02）

執行 `docs/handoff-prompt-stage-c-missing-capstone-link.md`。

- **根因**：`renderChoice()`（Stage C 完成畫面）當初漏做了 `renderCapstone()`（Stage D 完成畫面）已經有的「導向下一關」按鈕模式，玩家破完 Stage C 只看到「從頭再玩一次」「回選單」兩顆按鈕，得自己回選單才找得到 Stage D。
- **修法**：`main.ts` 的 `renderChoice()` 完成畫面新增第一顆按鈕「🏆 前往 Stage D 綜合關卡 →」（`primary-btn primary-btn--reward` 橘色，跟 `renderCapstone()` 的「進入 Stage E」按鈕同一套視覺語言），點擊直接呼叫既有的 `goToCapstone()`（原本只有選單的 `goToStage()` 在用，不用額外處理狀態，它會自己用 `currentTopic`／`currentPassage` 組出 Stage D 需要的題目）；原本的「從頭再玩一次」按鈕從 `primary-btn--reward` 降級成 `secondary-btn` 次要按鈕，「回選單」維持不動。
- **沒有加條件判斷**：照 handoff 確認，目前所有主題都有 Stage D 綜合關卡（跟不是每個主題都有的 Stage E 不同），所以不用像 `renderCapstone()` 判斷 `hasConversation` 那樣加顯示條件，直接顯示即可。
- **驗證**：`npx tsc --noEmit` 通過；全部既有 `verify-*.ts` 重跑一次全部通過；`rm -rf dist && npm run build` 成功；grep 打包後的 `dist/assets/main-*.js` 確認「前往 Stage D 綜合關卡」字串確實進到最終產出。
- **後續**：開發沙盒沒有瀏覽器，實機確認任一主題玩到 Stage C 全部完成後畫面確實出現新按鈕排第一顆、點擊後直接進入 Stage D（不用回選單再點一次），仍待人工檢查。

### 9.168 使用者回報：Stage C 完成畫面沒有引導進入 Stage D，撰寫 handoff（2026-10-02）

使用者截圖回報：完成 Stage C（短文理解）後，畫面只有「從頭再玩一次」「回選單」，沒有引導進入 Stage D 綜合關卡的按鈕。對照 Stage D 自己通過後的畫面（`renderCapstone()`）發現它已經正確示範「有下一關就優先給一顆 reward 配色的導向按鈕」（進入 Stage E 會話練習），確認是 Stage C 完成畫面（`renderChoice()`）本身漏掉了這個模式，不是整套邏輯有問題。撰寫 `docs/handoff-prompt-stage-c-next-stage-cta.md`，補上「🏆 前往 Stage D 綜合關卡 →」按鈕（reward 配色排第一顆，呼叫現成的 `goToCapstone()`），原本的「從頭再玩一次」降級成次要按鈕，跟 Stage D 完成畫面的按鈕排列邏輯一致。待 App 端執行。

### 9.167 App 端執行：風格改版 v5（success-700/error-700 文字分級色＋修正「慢速」按鈕收合展開例句的 bug）（2026-10-02）

執行 `docs/handoff-prompt-style-refresh-v5.md`，接續 9.165（v4 執行完成）之後做。

- **新增 `--color-success-700`／`--color-error-700`**：`design-tokens.v2-daily-play.css` Feedback 色彩區塊，比照 `primary-700/500/100` 的分級寫法正式收錄進色票系統。套用前先用 WCAG 相對亮度公式實際算過，確認 handoff 給的色碼數據正確：`success-700` 對白底 5.29:1、對 `success-tint` 4.91:1；`error-700` 對白底 5.26:1、對 `error-tint` 4.66:1，跟 handoff 聲稱的 5.3/4.9/5.3/4.7 幾乎吻合，都通過 WCAG AA 一般文字門檻（4.5:1）。
- **全站 28 行文字/邊框改用 `-700`**：用 node 腳本精確比對「整行 trim 後完全等於 `color: var(--color-success);` 或 `border-color: var(--color-success);`」（error 同理）才替換，避免誤改到字面上包含相同子字串但語意不同的規則——例如 `.menu-item--good:hover { border-left-color: var(--color-success); }` 這種「色條」用途的 `border-left-color`，字串上包含 `color: var(--color-success);` 但不是要改的目標，用精確的整行比對正確排除掉了。改完後 grep 確認：28 處文字/邊框規則全部换成 `-700`（`.option--correct`／`.card--correct`／`.answer-area--correct`／`.token--correct-pos`／`.hint--correct`／Stage E 對話選項等，含對應的答錯版本），`.menu-item--good`／`.topic-progress-fill`／`.stats-bar-fill` 等純裝飾性填色／色條維持用基礎色不變，跟 handoff 的「刻意不改」清單一致。
- **修正「慢速」按鈕收合展開例句的 bug**：`main.ts` 的 `stageHeader()` 裡慢速切換按鈕的 click handler 拿掉 `render()`，改成比照 `renderVocabOverview()` 練習模式主開關的做法，直接更新按鈕自己的 `classList`／`aria-pressed`／`innerHTML`。因為 `stageHeader()` 是全站共用函式，這個修正讓所有題型畫面的「慢速」按鈕都受惠，不只是單字總覽。
- **確認不用改的部分**：`gameHighScores.ts` 的 `recordStars()`「只記錄最佳成績」邏輯（`if (clamped <= current) return;`）核對過跟 handoff 描述一致，使用者已確認維持現狀，這次沒有碰這支檔案。
- **驗證**：`npx tsc --noEmit` 通過；全部既有 `verify-*.ts` 重跑一次全部通過；`rm -rf dist && npm run build` 成功；grep 打包後的 `dist/assets/main-*.css` 確認 `--color-success-700`／`--color-error-700`、`.option--correct{border-color:var(--color-success-700);background:var(--color-success-tint);color:var(--color-success-700)...}` 都進到最終產出，`.menu-item--good` 仍維持基礎色；grep 打包後的 `dist/assets/main-*.js` 確認慢速按鈕的 click handler 裡 `classList.toggle`／`setAttribute`／`innerHTML` 更新緊接在 `setSlowSpeechEnabled()` 之後，中間沒有 `render()` 呼叫。
- **後續**：開發沙盒沒有瀏覽器，實機/色弱模擬確認答對答錯文字在白底跟淡底色上都清楚可讀、單字總覽展開例句後點慢速按鈕不再被收合，仍待人工檢查。

### 9.166 風格改版 v5：補成功/錯誤文字分級色解決色弱對比度問題＋修正「慢速」按鈕收合單字總覽展開例句的 bug（2026-10-02）

v4 上線後使用者實測回報 3 件事：

1. **答對／答錯文字對比度不夠**（附截圖，選擇題答對選項的綠色文字幾乎看不清楚，標註「對比度不夠」），色弱使用者可能受影響更大。確認後：v4 把 `success`（#7EDBA0）／`error`（#FF7A7A）基礎色直接當文字色，實測對白底分別只有 1.6:1／2.3:1，遠低於 WCAG AA 文字最低要求 4.5:1。跟使用者確認修法：**補成跟主色 `primary-700/500/100` 一樣的分級邏輯**，新增 `--color-success-700`（#237A4F，對白底 5.3:1）／`--color-error-700`（#C13D37，對白底 5.3:1）兩個正式收錄進色票系統的文字/邊框用色階——不是走回頭路重新引入 v3 之前那種私下存放的衍生色，差別在於這次正式命名、對比度經過驗證、跟主色同一套分級架構。全站約 19 處答對/答錯相關的文字/邊框規則（`.option--correct`、`.card--correct`、`.hint--wrong` 等）改用 `-700`；進度條、色條這類裝飾性填色（旁邊沒有依附文字）維持用基礎色不變。
2. **單字總覽點「慢速」按鈕會把已展開的例句全部收合**：確認是真的 bug——`stageHeader()` 共用橫幅的「慢速」按鈕點擊後呼叫 `render()` 整頁重繪，而例句展開狀態只是本地 DOM 屬性沒有存到任何變數，整頁重繪就全部重置。修法：比照同一個檔案裡「練習模式」主開關已經示範過的做法，改成只切換按鈕自己的 class／文字／aria，不呼叫 `render()`。因為 `stageHeader()` 是全站共用函式，這個修正讓所有題型畫面都受惠。
3. **遊戲室星星評等「玩得較差會不會覆蓋舊紀錄」**：確認 `gameHighScores.ts` 的 `recordStars()` 本來就是「只記錄最佳成績」的設計（`if (clamped <= current) return;`），不是 bug。跟使用者確認維持這個設計，**沒有程式碼異動**，純粹記錄確認結果。
- `docs/design-tokens.html` 第 2／2b 節更新：新增 `success-700`／`error-700` 兩張色卡（含對比度數據），裝飾性填色跟文字/邊框用色分開標示用途；2b 節說明這次修正的脈絡（v3 拿掉衍生色 → v4 改基礎色但對比度不夠 → v5 補正式分級色）。
- 撰寫正式 `docs/handoff-prompt-style-refresh-v5.md`：新 token 定義、全站 19 處文字/邊框取代清單（含刻意不改的裝飾性填色清單）、慢速按鈕的實際程式碼修正、第 3 點的確認記錄。
- 待 App 端執行這份 v5 handoff。

### 9.165 App 端執行：風格改版 v4（拿掉衍生色，答對/答錯改用基礎色票，hover 改 color-mix()）（2026-10-02）

執行 `docs/handoff-prompt-style-refresh-v4.md`，接續 9.163（v2）／9.164（v3）之後做。

- **新增 `--color-error-tint`**：`design-tokens.v2-daily-play.css` Tint 區塊補上，沿用既有 tint 的淡化比例。
- **刪除 `style.css` 自己的衍生色 `:root` 區塊**：`--color-success-text`／`--color-success-bg`／`--color-error-text`／`--color-error-bg`／`--color-primary-700-hover`／`--color-reward-hover` 這 6 個 token 整段刪除，`color-scheme: light` 保留。
- **全站機械式取代**（19 處 `style.css` 規則，見 handoff 清單）：`-text`→基礎色、`-bg`→對應 `-tint`。取代後額外 grep 全專案，發現 handoff 清單沒列到的第 20 處——`main.ts` 第 4541-4542 行 Stage E 會話練習結算畫面的**inline style**（`background: var(--color-success-bg)`／`border-color`／`color: var(--color-success-text)`）也引用了這兩個被刪掉的 token，一併修正，不然這個畫面的底色/邊框/文字會變成無效的 CSS 值。
- **按鈕 hover 改用 `color-mix()`**：`.primary-btn:hover`／`.primary-btn--reward:hover` 改成當場算「基礎色混 15% 黑」，不再查固定 token。
- **清理死碼**：`crosswordStandalone.css` 複製的那份 `--color-primary-700-hover` 盤點後確認完全沒有使用點（這個遊戲按鈕 hover 實際用自己的粉色系 token），直接刪除宣告；`memoryMatchStandalone.css` 那份維持不動（翻牌配對已經下架，照 handoff 指示留給之後整份刪除該檔案時一併清理，不用現在單獨處理）。
- **驗證**：`npx tsc --noEmit` 通過；全部既有 `verify-*.ts` 重跑一次全部通過；`rm -rf dist && npm run build` 成功；grep 打包後的 `dist/assets/main-*.css` 確認 `--color-error-tint`、`color-mix(in srgb,var(--color-primary-700) 85%,black 15%)`、`color-mix(in srgb,var(--color-accent-orange) 85%,black 15%)` 都進到最終產出，且舊的 6 個 token 名稱在 `app/src/` 全目錄（含兩個遊戲 Standalone CSS）grep 結果都是 0 筆（`memoryMatchStandalone.css` 那份依 handoff 指示保留，不在這次清除範圍內）。
- **⚠️ 對比度檢查，發現問題、依照指示不自己決定改法**：使用者特別要求檢查答對/答錯文字色改用基礎色票後會不會太淡看不清楚。用 WCAG 對比度公式實際算給白底的結果：舊版 `--color-success-text`（#2E8C5C）對白底對比度 4.18:1、`--color-error-text`（#C24A45）對白底 4.82:1（後者剛好過 AA 一般文字門檻 4.5:1，前者微幅不足但接近）；新版直接用 `--color-success`（#7EDBA0）對白底只剩 **1.68:1**、`--color-error`（#FF7A7A）對白底只剩 **2.52:1**，兩者都遠低於 WCAG AA 一般文字門檻（4.5:1），`--color-success` 甚至連大字/粗體文字的門檻（3.0:1）都不到——換算成白話：答對文字（淺綠）在白底上會相當不清楚、答錯文字（淺紅）也偏淡，不是「略微」不夠清楚，是客觀測量確實不合格。照使用者這次的明確指示（「不要自己決定改法」「不要重新引入衍生色」），這次**沒有**自行調整，程式碼已經照 handoff 原樣套用基礎色票，實際清晰度問題留給使用者看過 `demo-standalone.html` 之後決定要怎麼處理（例如字重加粗、底色加深、或其他不涉及新增衍生色 token 的方式）。
- **後續**：四份風格改版 handoff（v2／v3／v4）全部執行完畢；答對/答錯文字對比度問題待使用者決策；9.164 遺留的 `.profile-stat-card` 落差也待使用者決策。

### 9.164 App 端執行：風格改版 v3（星星分級／代幣圖示／按鈕選取狀態／抬頭膠囊圓角等）（2026-10-02）

執行 `docs/handoff-prompt-style-refresh-v3.md`（檔案目前最新內容，已整合兩輪使用者回饋，接續 9.163 的 v2 執行完成之後做）。

- **遊戲星星三級配色**：`main.ts` 的 `renderGameRoom()` 新增 `starsTierClass`（1-2 顆 `--practice`／3-4 顆 `--good`／5 顆 `--great`），`style.css` 新增三個對應的 tier class，滿星是 `--gradient-gold` 漸層反白膠囊 chip（照第二次回饋的最終版本，不是中間一度改過的深棕金實心底）。
- **代幣圖示換成圓圈＋字母 K**：`gameIcons.ts` 的 `COIN_ICON()` 內容整個替換，圓形漸層底（`--color-primary-700`→`--color-primary-500`）＋白色粗體字母 K；垂直置中改用 `dy=".35em"` 而非 handoff 原本建議的 `dominant-baseline="central"`（更保守的寫法，開發沙盒沒有瀏覽器沒辦法實測哪個在舊版瀏覽器表現比較好，照 handoff 註記的備案直接採用）；函式名稱維持 `COIN_ICON` 不變，三個呼叫點（代幣餘額／卡片費用標籤／確認彈窗）不用修改。
- **字型系統／漸層 token 補齊**：`design-tokens.v2-daily-play.css` 新增 `--weight-regular`／`--weight-bold`／`--leading-tight`／`--leading-normal`／`--gradient-primary`／`--gradient-gold`／`--gradient-success`，純補 token 定義，不強制套用到既有程式碼。
- **按鈕選取狀態**：`style.css` 新增共用 `.is-selected` class，目前沒有既有元件套用，供之後分頁/篩選類元件使用。
- **抬頭膠囊圓角**：`.brand-banner` 的 `border-radius` 改 `var(--radius-pill)`、內距四邊統一改 `var(--space-4)`（原規劃左右用 `--space-6` 比上下寬，使用者回饋要一致）、背景改引用 `var(--gradient-primary)` token。未登入狀態（兩行 slogan＋標題）在膠囊圓角下是否會顯得擁擠，沒有瀏覽器沒辦法實測，照 handoff 給的程式碼直接統一套用，如果實機看起來不协調，可以考慮比照 handoff 備案只在 `.brand-banner--user` 用 pill、未登入狀態維持 `--radius-xl`。
- **導覽列 hover 改用一般按鈕配方**：`.secondary-btn:hover` 升級成「補 `primary-tint` 背景＋邊框轉 `primary-700`」（原本只換邊框）；`.nav-item` 補上 `border: 2px solid transparent` 預留 hover 邊框空間（避免 hover 時因為新增邊框而跳動）、`.nav-item:hover` 改用跟 `.secondary-btn:hover` 一致的配方（新增邊框色＋文字色）。`.nav-item.active`／`.nav-item--logout` 維持不動。
- **主題卡 icon 拿掉底色**：`style.css` 整批刪除約 40 個 `.thumb-<topicId>` 修飾 class（每個都只有一行 `background`，刪除前用 `grep -A2 '^\.thumb-'` 確認過全部只有這一行屬性），icon 直接疊在卡片白底上；`main.ts` 的 `thumb.className`／`thumb.emoji` 指派邏輯完全不動。
- **刻意跳過一項、未套用 handoff 的建議修改**：5.1 節「挑戰紀錄／個人檔案資訊卡」要求核對 `.profile-stat-card` 的 `border-radius`／數字字級／數字顏色／標籤字級是否跟 `docs/design-tokens.html` 第 20 節的簡化示意一致。實際核對發現現況（`--radius-lg`、數字用 `--text-display`/54px/`--color-accent-orange`橘色＋icon、標籤用 `--text-body-lg`）明顯比示意圖豐富得多（示意圖只有「數字＋標籤」兩行文字，現況還有獨立圖示跟更大的數字強調），這看起來是刻意設計的「統計數字強調卡」，不是示意圖沒跟上的技術債——貿然套用示意圖的樸素版本（縮小字級、橘色數字改回主色藍）會是明顯的視覺降級，不是單純補 token，所以這次沒有動，留給使用者看過 `demo-standalone.html` 之後決定要不要跟著簡化。
- **驗證**：`npx tsc --noEmit` 通過；全部既有 `verify-*.ts` 重跑一次全部通過；`rm -rf dist && npm run build` 成功；grep 打包後的產出確認 `.game-room-card-stars--great{...background:var(--gradient-gold)...}`、`.is-selected{...}`、`.nav-item:hover{...border-color:var(--color-primary-700)...}`、`.secondary-btn:hover{...background:var(--color-primary-tint)...}`、`.brand-banner{...border-radius:var(--radius-pill)...}`、`.thumb-greetings` 等舊規則已完全消失、代幣圖示的 `coinGrad`／`>K<` 字串都確實進到最終產出（`COIN_ICON` 被打包進 `gameBridge-*.js` 共用 chunk，不是 `main-*.js`，跟先前文件記錄的 Vite 分包現象一致）。
- **後續**：緊接著執行 9.162（風格改版 v4）；`.profile-stat-card` 的落差留待使用者決定。

### 9.163 App 端執行：風格改版 v2（主色 #347FBC 定案＋抬頭區塊重新設計）（2026-10-02）

執行 `docs/handoff-prompt-style-refresh-v2.md`。

- **Token 檔案色彩／圓角更新**：`--color-primary-700` 等品牌色、強調色、feedback 色、中性色全部換成 v2 定案色碼；Tint 區塊 5 個淡色重算成最終色碼；新增 `--radius-xs: 6px`，`--radius-sm`（8px→12px）／`--radius-md`（16px→18px）更圓潤。
- **`style.css` 衍生色重算**：`--color-success-text`／`--color-success-bg`／`--color-error-text`／`--color-error-bg`／`--color-primary-700-hover`／`--color-reward-hover` 依新基礎色重新計算；同步更新 `crosswordStandalone.css`／`memoryMatchStandalone.css` 複製貼上的 `--color-primary-700-hover`（`#003b78`→`#2A6694`），避免兩款遊戲的按鈕 hover 停留在舊藍色。
- **抬頭區塊重新設計**（這次最主要的版面調整）：`main.ts` 的 `appendBrandBanner()` 已登入狀態拿掉 `<br/>` 強制兩行招呼語跟獨立的 `.brand-banner-text`／`.brand-subtitle`，改成頭像在前＋單行「Hi, {name}！一起玩英語」；`style.css` 對應調整：`.brand-banner` 內距/外距縮小、`.brand-banner h1` 字級從 `--text-h1`（42px）降到 `--text-body-lg`（23px）、`.brand-banner-avatar` 從 `height:100%` 動態撐滿改成固定 56×56px、`.brand-banner.brand-banner--user` 改用 `align-items: center`；原本因應舊版「頭像撐滿文字欄高度」問題而寫的手機版 `@media (max-width: 640px)` 覆寫區塊（頭像放大到 288px、改上下堆疊）整段拿掉，因為新設計桌面/手機表現本來就一致，不需要特殊處理。未登入狀態（選使用者畫面）維持原樣不變。
- **改寫 `verify-brand-banner-responsive.ts`**：舊版測試腳本整支都是針對「手機版覆寫區塊」寫的斷言，這次新設計已經沒有那個區塊，照 handoff 指示重寫整支腳本，改驗證新版狀態（單行招呼語無 `<br/>`、頭像固定 56px、`align-items: center`、`h1` 用 `--text-body-lg`、確認沒有殘留舊版手機版覆寫區塊）。
- **驗證**：`npx tsc --noEmit` 通過；全部既有 `verify-*.ts`（含改寫後的 `verify-brand-banner-responsive.ts`）重跑一次全部通過；`rm -rf dist && npm run build` 成功；grep 打包後的 `dist/assets/main-*.css`／`*.js` 確認 `347FBC`、`.brand-banner-avatar{width:56px;height:56px...}`、`.brand-banner h1{...font-size:var(--text-body-lg)...}`、單行招呼語字串 `Hi, ${x.name}` 都確實進到最終產出。
- **明確沒動的部分**（照 handoff 指示）：主題卡片進度條 DOM／邏輯完全不碰；`--text-*`／`--space-*` 數值本身不變；未登入狀態的抬頭版面不變。
- **後續**：開發沙盒沒有瀏覽器無法截圖，實機/手機寬度模擬確認抬頭高度確實大幅縮減、圓角變圓潤沒有造成元素重疊，仍待 `demo-standalone.html` 或 `npm run dev` 人工檢查；緊接著繼續執行 9.158-9.160（風格改版 v3）與 9.162（v4）。

### 9.162 風格改版 v4：拿掉「衍生色」，答對/答錯文字直接用基礎色票，按鈕 hover 改用 color-mix() 公式（2026-10-01）

使用者對 9.161 新補的「衍生色」章節有意見：這 6 個 token（`success-text`／`success-bg`／`error-text`／`error-bg`／`primary-700-hover`／`reward-hover`）是沒有依據的手動色碼，要求新方案全部不採用，並舉例「錯誤文字直接用 error #FF7A7A」。另外要求每張色卡下方都要有用途說明，且質疑色卡下方的灰底標籤樣式是「沒來由亂加」的設定。

1. **拿掉衍生色**：改成兩條規則——文字/邊框語意色直接用基礎色票（`--color-success`／`--color-error`），背景淡底色直接用 `-tint` 淡底色票（新增 `--color-error-tint`，沿用既有 tint 的淡化比例）；按鈕 hover 不再存成新 token，改用 CSS `color-mix()` 公式即時從基礎色算出來（基礎色混 15% 黑）。`docs/design-tokens.html` 第 2 節整合實色＋tint 並列，第 2b 節改寫成說明這個決策跟公式示範（滑鼠移過去可以看 `color-mix()` 即時運算的效果）；誠實記錄一個取捨：`success`／`error` 基礎色本身偏淺，直接當文字色對比會比原本加深過的版本略低，這是使用者明確要求的方向。
2. **每張色卡補上用途標籤**：盤點後第 2／3／4 節原本有好幾張色卡完全沒寫用途（強調色 5 張、中性色 5 張、徽章分級色 4 張），這次全部補齊，目前全文 30 張色卡都有用途說明。
3. **定義「用途標籤」本身的樣式依據**：這個標籤（灰藍底／primary-700 字）其實是沿用第 1 節已經定義好的 `primary-tint`／`primary-700`／`radius-xs` 三個既有 token，不是另外發明的新色碼——加了一段說明寫在 meta-banner，把這件事講清楚。
4. 撰寫正式 `docs/handoff-prompt-style-refresh-v4.md`：列出全站約 19 處要做的機械式 token 取代（`-text`/`-bg` → 基礎色/tint）、2 處按鈕 hover 改 `color-mix()` 公式、新增 `--color-error-tint` 到正式 token 檔案；順便盤點發現 `crosswordStandalone.css` 裡複製的那份 `--color-primary-700-hover` 其實是死碼（完全沒被使用，填字遊戲自己的按鈕 hover 用的是粉色系 token），一併列入清理。
- 待 App 端依序執行 9.156／9.157／9.158／9.159／9.160／v4 這些累積的程式碼改動。

### 9.161 design-tokens.html 結構調整＋全文內容盤點（2026-10-01）

使用者提出 4 項要求：把 9.160 新補的主題卡移到第 16 節（主題選擇頁面）、原第 16 節內容刪除；成就徽章 icon 改用單色扁平風格；檢視全文是否有重複/不合理之處；檢視學習平台內容是否有需要補進 design token 規範的部分。這次**純粹是文件修正，沒有動到任何 `app/` 程式碼**——盤點後發現需要改的地方，實際上都已經符合規範或已經在之前的 handoff 裡處理過，缺的只是這份參考文件沒記錄到。

1. **主題卡移到第 16 節**：第 16 節原本只畫縮小版（無說明文字／進度文字），現在換成完整版（icon＋名稱＋說明＋進度條＋進度文字），跟第 11 節元件規格、首頁實際畫面一致；第 20 節的重複示意拿掉，改成文字指向第 16 節，不再畫兩次。
2. **成就徽章 icon 改單色扁平**：原本用 🥉🥇🔒 全彩 emoji，跟全站其他 icon（第 9 節、導覽列、分類標題）的單色線條風格不一致。盤點 `main.ts` 發現**實際程式碼的 `CATEGORY_ICONS`／`BADGE_CATEGORY_DISPLAY`（第 4571-4596 行）本來就已經是 `stroke="currentColor"` 的單色扁平 SVG，不是 emoji**——這份文件的示意圖是唯一不合規範的地方。改成分級色圓底＋白色扁平獎牌 SVG（沿用 `CATEGORY_ICONS` 的獎牌形狀），**不需要任何程式碼異動**。
3. **全文重複/不合理之處**：
   - `primary-100` 色卡的「用途」寫著「nav hover」，但導覽列 hover 在上一輪修正已經改用 `primary-tint`，這裡沒跟著更新，屬於文件內部互相矛盾——已修正兩張色卡的用途說明。
   - 第 11 節主題卡 icon 的說明寫著「跟 `.menu-item`／遊戲室卡片用色塊底托住 icon 是不同視覺語言」，但實際核對 `style.css` 發現 `.menu-item-icon`／`.game-room-card-icon` 本來就沒有色塊底——這句話本身就是錯的，已經修正說明文字，三者其實是一致的「純 icon 無底色」。
4. **內容盤點：發現兩組 token 完全沒被這份文件記錄到**：
   - **衍生色**（`success-text`／`success-bg`／`error-text`／`error-bg`／`primary-700-hover`／`reward-hover`，定義在 `app/src/style.css` 自己的 `:root`，不是 token 檔案）：全站廣泛用在錯誤文字、危險按鈕、hover 狀態、答對/答錯卡片等情境，但這份文件完全沒提過。新增第 2b 節補上，數值用改版後（`docs/handoff-prompt-style-refresh-v2.md` 已經規劃好）的新值。
   - **成就徽章分級色的 `-bg` 淡底變體**（`tier-bronze-bg`／`tier-silver-bg`／`tier-gold-bg`／`tier-locked-bg`）：token 檔案裡本來就有，這份文件第 4 節之前只列實色，沒列淡底版——已補齊，並記錄一個現況：`tier-bronze-bg`／`tier-silver-bg`／`tier-gold-bg` 原本的主要用途（主題卡 icon 色塊底）已經因為「icon 不加底色」的決定而不再使用，暫時變成沒有使用場景的 token（保留定義，不用現在刪），只有 `tier-locked-bg` 還有別的用途（翻牌配對鎖定狀態）繼續在用。
- 版本標籤更新為 `2026-10-01 v4`。
- 這次調整不影響任何待執行的 handoff（9.156／9.157／9.158／9.159／9.160 五份累積的程式碼改動內容不變），純粹是參考文件本身的品質修正。

### 9.160 風格改版 v3 第二次使用者回饋修正：滿星改回漸層金／取消「單元完成卡」改成主題卡／主題卡 icon 拿掉底色（2026-10-01）

使用者看過 9.159 的修正後，再提出 2 點進一步修正：

1. **滿星改回漸層金，只有文字要深色**：9.159 把滿星「太棒了」改成深棕金色實心底，使用者這次要求改回原本的 `--gradient-gold` 漸層反白 chip，只有「太棒了」這三個字（目前只存在於 `docs/design-tokens.html` 的示意圖，實際 DOM 沒有這段文字）改用深色。程式碼層面（`.game-room-card-stars--great`）等於完全恢復成最早的漸層版本，沒有新增異動。
2. **「單元完成卡」不是規範項目，應該是主題卡**：釐清網站結構是「單元（例如單元一：我和身邊的人）→ 底下若干主題卡（Family／Pets／Appearance...）」，沒有「整個單元完成」這一層獨立卡片。9.159 在 `docs/design-tokens.html` 第 20 節畫的「單元完成卡」（含「進行中／🎉 單元完成」標籤）整個拿掉，改成直接沿用既有的 `.topic-card` 元件（跟第 11 節／首頁同一個）。這代表原本列為「新功能，待確認」的單元完成卡**不需要再確認、也不會做**。
   1. **主題卡的 icon 要加回去**：確認 icon 其實一直都存在（`.topic-thumb`，`main.ts` 第 1425 行），只是 `docs/design-tokens.html` 第 11／16 節的示意圖之前漏畫了，這次補上。
   2. **icon 不要設定底色**：現況每個主題各自的 `.thumb-<topicId>` 修飾 class（`style.css` 第 829-1010 行，約 40 個）都只有一行 `background: ...`，這次要求全部拿掉，讓 icon 直接疊在卡片白底上，不要色塊托底。

- `docs/design-tokens.html`：滿星 chip 改回 `--gradient-gold`＋白色星星＋深色文字；刪除 `.tk-unit-card` CSS 跟第 20 節的單元完成卡示意，改成主題卡示意（含 icon）；第 11／16 節的主題卡示意補上 icon；`gradient-success` 色卡的用途說明改成通用描述（不再綁定「單元完成慶祝卡」）。
- `docs/handoff-prompt-style-refresh-v3.md`：第 1 節滿星 CSS 改回漸層版本；第 5 節整個改寫——5.2 說明「單元完成卡」是誤會，直接取消；新增 5.3，列出要刪除的 40 個 `.thumb-*` 背景色規則（含確認用的 grep 指令）；驗證清單同步更新（滿星漸層、主題卡 icon 無底色）。
- 兩份文件已重新一致，仍待排入 App 端執行（9.156／9.157／9.158／9.159／9.160 五份累積的改動，執行時以這份最新版為準，不要照著 9.159 那版做）。

### 9.159 風格改版 v3 使用者回饋修正：星星深色滿星／單元卡對照／抬頭統一內距／導覽列沿用一般按鈕 hover（2026-10-01）

使用者看過 9.158 的 `docs/design-tokens.html` 後提出 4 點修正，已同步更新設計文件與對應的 `docs/handoff-prompt-style-refresh-v3.md`：

1. **遊戲星星評等第三級「太棒了」改用深色**：原規劃是亮色漸層（`--gradient-gold`）反白 chip，使用者回饋改用深棕金色實心底（`#3D2F18`）＋亮金色星星，更有「頒獎」質感，跟 1-4 顆的淡黃色區隔更明確。`--gradient-gold` token 保留在檔案裡，只是這個元件不再使用。
2. **單元完成卡加入一般狀態做比較**：設計文件第 20 節補上「一般狀態／進行中」卡（白底＋邊框＋`primary-tint` 底色標籤）跟原本的「🎉 單元完成」並排對照，方便一眼看出差異。這張卡仍是全新元件，維持排除在 handoff 實作範圍外，等使用者另外確認要不要做。
3. **首頁抬頭內距改四邊統一**：原規劃左右內距比上下寬（避免膠囊圓角吃字），使用者回饋要四邊一致，這樣頭像到外框的距離才會上下左右對稱，改成統一用 `--space-4`。
4. **導覽列 hover 沿用「一般按鈕」設定**：原本導覽列自己配一套 hover（只換背景色），跟一般按鈕（`.secondary-btn:hover`）的配方不一致。修正後兩者統一用同一套配方（背景補 `primary-tint`、邊框跟文字轉 `primary-700`），`.secondary-btn:hover` 本身也同步升級（原本只換邊框，沒有補背景色）。

- `docs/design-tokens.html` 四處對應更新（滿星 chip 改深色、§20 新增對照卡、`.tk-banner` 內距、`.tk-nav-item:hover`／`.tk-nav-item` 新增透明邊框）。
- `docs/handoff-prompt-style-refresh-v3.md` 同步修正第 1／5／6 節程式碼，新增第 7 節「導覽列 hover 改用一般按鈕配方」（含 `.secondary-btn:hover` 升級＋`.nav-item` 補邊框＋`.nav-item:hover` 改配方三處實際 diff），驗證清單一併更新。
- 兩份文件都還沒交給 App 端執行，待 9.156／9.157／9.158／9.159 四份 handoff 一起排入 App 端工作。

### 9.158 風格改版 v3：星星分級／代幣圖示／字型系統／按鈕選取狀態／抬頭膠囊圓角（2026-10-01）

使用者提出 9 項更細節的設計要求，逐一處理：

1. **遊戲室用星星分級，不是成就徽章**——釐清：主站學習進度的成就徽章系統維持不變，遊戲室（填字遊戲／戳泡泡）的星星評等這次補上三級配色（1-2 顆「再接再厲」用中性灰、3-4 顆「做得好」用黃色、5 顆「太棒了」用金色漸層反白 chip），現況確認 `starsForMistakes()` 換算邏輯已存在，只是星星渲染目前完全沒有分級配色（`STAR_FILLED_ICON`/`STAR_EMPTY_ICON` 都是 `currentColor`，所有星數同一個顏色）。
2. **代幣圖示換成圓圈＋字母 K**——確認目前 `COIN_ICON()` 是硬幣造型 SVG（不是 emoji，之前就已經換成 SVG 了），這次改成圓圈底（`--gradient-primary`）＋白色粗體字母 K，呼應吉祥物「羊毛氈字母怪獸 K」。
3. **新增字型系統**：字級數值不變，補上 `--weight-regular`/`--weight-bold`/`--leading-tight`/`--leading-normal` 角色定義，明確區分 `--font-display`（標題/按鈕/數字）跟 `--font-body`（內文）兩個角色，即使目前是同一套字體，角色分開方便未來調整。
4. **按鈕 hover／選取狀態**：確認 `.primary-btn`/`.secondary-btn` 的 hover 其實已經存在（不用新增），新增的是 `.is-selected` 共用 class 給未來的分頁/篩選類元件用，這次沒有既有元件需要套用，先定義好備用。
5. **挑戰紀錄／個人檔案資訊卡、單元完成卡**：確認 `.profile-stat-card` 現況已經是「icon+數字+標籤」的卡片結構，只需要核對 token 數值；**單元完成卡確認目前不存在對應元件**（現況只有純文字跟共用的徽章解鎖彈窗），已在設計文件定義視覺規格，但明確排除在這次 handoff 之外，列為需要額外確認的新功能，避免風格調整的 commit 範圍混進新功能開發。
6. **首頁抬頭圓角改用 pill**（膠囊形，呼應圓形大頭貼），接續 9.157 的抬頭重新設計，圓角從 `--radius-xl` 升級成全圓角膠囊形，並備註未登入狀態視覺上是否也要套用膠囊圓角，交由實際畫面確認再決定。
7. **色彩系統補漸層**：新增 `--gradient-primary`/`--gradient-gold`/`--gradient-success` 三組 135deg 漸層 token，統一全站漸層配色跟角度，不要各元件各自亂配。
8. **`docs/design-tokens.html` 新增點擊色卡複製 token 名稱功能**（純文件工具，不影響實際網站程式碼）。
9. **導覽列 hover／當前頁面狀態**：確認現況已經存在（`.nav-item:hover`／`.nav-item.active`），這次只是在設計文件正式記錄狀態對照表，沒有程式碼異動。
- 參考另一個專案的設計文件（`project_smart_reading_platform/ref/design-tokens.html`）格式，`docs/design-tokens.html` 大幅擴充：新增漸層／完整字型系統／星星評等／代幣圖示／按鈕選取狀態／挑戰紀錄個人檔案卡片等章節，並加上點擊複製功能。
- 撰寫正式 handoff `docs/handoff-prompt-style-refresh-v3.md`，含星星分級/代幣圖示的實際程式碼改法、字型/漸層 token 新增、抬頭膠囊圓角調整，明確排除「單元完成卡」這項新功能。
- **後續**：待 App 端依序執行 9.156／9.157／9.158 三份 handoff；單元完成卡是否要做列為獨立待確認項目。

### 9.157 風格改版 v2：主色／強調色／中性色定案＋抬頭區塊重新設計（2026-10-01）

接續 9.155 設計系統健檢，使用者進一步要求完整風格改版，方向：舒適、柔和降階的中性色調、圓潤和緩、色彩深淺＋留白建立層級。透過 `mcp__visualize`／HTML 對照頁來回三輪確認細節：

- 第一版提案飽和度/明度降太多，使用者回饋「死氣沉沉」，第二版拉回接近原色的鮮豔度，只做微調；主色最終由使用者指定為 `#347FBC`。
- 使用者額外要求：制定圓角／間距更多細節、依現有排版重新規劃（點名抬頭／頭像區塊過大）、**明確保留主題卡片原本的進度條**（第一版提案誤用獎牌徽章示意，已修正）。
- 參考使用者另一專案 `project_smart_reading_platform/ref/design-tokens.html` 的文件邏輯（元素→元件→應用三段式），建立同等結構的 `docs/design-tokens.html`：Part 1 基礎元素（色彩／字級／間距／圓角／陰影／斷點／圖示風格）、Part 2 元件規格（按鈕／卡片／彈窗／標籤／導覽列）、Part 3 功能應用（首頁抬頭／主題卡片／遊戲室／成就徽章／Stage E 會話練習，逐一示範 token 實際用法）。
- **實測現有抬頭區塊高度**：桌面版約 207px，**手機版因頭像被放大到固定 288×288px、文字被 `<br/>` 強制兩行，約佔 620px**，在看到任何學習內容前就吃掉大半手機螢幕——這是這次改版的主要動機，不只是色彩微調。
- 撰寫正式 handoff `docs/handoff-prompt-style-refresh-v2.md`：token 檔案色彩／圓角更新（新增 `--radius-xs`，`--radius-sm`／`--radius-md` 微調更圓潤）、`style.css` 衍生色依新基礎色重算（含提醒必須同步更新 `crosswordStandalone.css`／`memoryMatchStandalone.css` 複製貼上的 `--color-primary-700-hover`，否則兩款遊戲的 hover 色會停留在舊藍色）、`appendBrandBanner()` 改寫成頭像＋單行問候語同一行的精簡版面（拿掉強制換行與手機版 288px 頭像的特殊覆寫）。
- 明確記錄「刻意不動」清單：字級數值本身不變、間距數值不變（只補分組說明）、主題卡片進度條不變。
- 建議執行順序：接在 9.156（設計系統健檢 handoff）之後執行，兩者都動 `.modal-card`／`.nav-item` 附近的 CSS。
- **後續**：待 App 端依序執行 9.156、9.157 兩份 handoff，實機（含手機寬度）確認抬頭高度大幅縮減、色彩全站套用一致、進度條外觀不變。

### 9.156 App 端執行：設計系統健檢 handoff（token 補齊＋彈窗/卡片手機版）（2026-10-01）

執行 9.155 寫的 `docs/handoff-prompt-design-system-health-check.md`，執行前先讀過 `docs/design-system.md` 了解命名邏輯與斷點慣例。

- **Token 檔案**（`assets/design-tokens/design-tokens.v2-daily-play.css`）：Tint 區塊補上 `--color-accent-orange-tint: #FFF1EB`／`--color-accent-pink-tint: #FFF3FB`，跟既有 primary/success/accent-yellow 三個 tint 同樣手法（原色提亮）；`--nav-item-active-color` 從寫死的 `#FFFFFF` 改成 `var(--color-surface)`（數值不變，只是改用既有中性色 token，避免同一個白色在檔案裡有兩種表示方式）。
- **`.nav-item`／`.menu-item` 寫死 px 改成對應 token**（純字面替換，視覺不變）：`.nav-item` 的 `gap: 4px`→`var(--space-1)`、`padding: 8px 12px`→`var(--space-2) var(--space-3)`；`.function-nav--compact .nav-item` 的 `padding: 8px 10px`→`var(--space-2)`（10px 捨入到 8px，壓縮態本來就是極窄螢幕才觸發，2px 差異感知不到，不為這一個特例新增 token）；`.menu-item` 的 `gap: 4px`→`var(--space-1)`。
- **彈窗手機版 `@media (max-width: 640px)` 覆寫**（直接回應使用者「戳泡泡」確認彈窗擁擠的回報）：在 `.modal-close-btn:hover` 後面新增區塊，`.modal-overlay` 內距 `--space-5`→`--space-3`、`.modal-card` 內距 `--space-6`→`--space-4`、圓角降到 `--radius-lg`、`.modal-card-header` 下方留白 `--space-4`→`--space-3`、標題字級 `--text-h3`→`--text-body-lg`、`.modal-close-btn` 從 36px 放大到 44×44px（符合最小點擊熱區建議）、`.modal-text` 字級 `--text-body`→`--text-caption`。因為 `.modal-overlay`／`.modal-card` 是所有彈窗共用的外殼 class，首次進站提醒、換頭像、改名字等彈窗手機版會一併受惠，不用逐一處理。
- **`.topic-card`／`.menu-item` 手機版內距微調**：同一個 640px 斷點內新增 `.topic-card`／`.menu-item` 的 `padding: var(--space-4)`（原 `--space-5`/24px），只調內距、不動字級（照 handoff 指示先不要一次調太多，欄數本來就靠 `auto-fit` grid 自動收成單欄不用額外處理）。
- **驗證**：`npx tsc --noEmit` 通過；全部既有 `verify-*.ts`（約 40 支）重跑一次全部通過（純 CSS 改動，沒有任何邏輯驗證腳本受影響）；`rm -rf dist && npm run build` 成功；grep 打包後的 `dist/assets/main-*.css` 確認 `--color-accent-orange-tint`／`--color-accent-pink-tint`／`--nav-item-active-color: var(--color-surface)`／`.nav-item{...padding:var(--space-2) var(--space-3)...}`／`.function-nav--compact .nav-item{padding:var(--space-2);gap:0}`／`@media (max-width:640px)` 內的 `.modal-card{padding:var(--space-4);border-radius:var(--radius-lg)}`／`.modal-close-btn{width:44px;height:44px}`／`.topic-card,.menu-item{padding:var(--space-4)}` 都確實進到最終產出；所有改動都包在 `@media (max-width: 640px)` 裡，桌面寬度（>640px）的規則完全沒有被動到。
- **本輪刻意不處理**（跟 `docs/design-system.md` 第 6 節一致）：填字遊戲／翻牌配對兩款遊戲缺手機版 CSS（牽涉 TypeScript 動態格子計算，列下一輪）、`style.css` 衍生色集中化、遊戲粉色系改用 `color-mix()`、`--nav-height` 疑似未使用的清理，也沒有新增 handoff 建議的 `verify-design-token-usage.ts`（純 CSS 字面替換風險低，先用既有 `tsc`＋`verify-*` 流程把關，留待下一輪視需要再補）。
- **後續**：開發沙盒沒有瀏覽器，無法截圖驗證，實機/手機寬度模擬確認彈窗跟卡片視覺效果仍待 `demo-standalone.html` 或 `npm run dev` 人工檢查。

### 9.155 使用者回報手機版確認彈窗擁擠，進行全站設計系統健檢（2026-10-01）

使用者截圖回報遊戲室確認彈窗（「要玩『戳泡泡』嗎？」）在手機寬度下感覺擁擠，進一步要求「重新檢視全站的設計樣式，並調整 design token 來制定整體視覺以及良好的響應式體驗」。用 AskUserQuestion 確認範圍：使用者選擇**全面檢視視覺＋響應式（完整設計系統健檢）**，不只修這一個彈窗。

- **盤點現況**：全站 token 定義在 `assets/design-tokens/design-tokens.v2-daily-play.css`，三款遊戲的 Standalone CSS 都正確共用同一份（優點），但斷點慣例混亂（420/480/640/768/899-900px 五種數字散落四個檔案，沒有統一邏輯）；`.nav-item`／`.menu-item` 有幾處間距用寫死 px 而不是對應的 spacing token（數值剛好相等，但沒走 token）；`.modal-overlay`／`.modal-card`（含這次回報的確認彈窗）完全沒有手機版覆寫，是擁擠感的根因；填字遊戲／翻牌配對兩款遊戲完全沒有任何 `@media` 規則（比純視覺擁擠更嚴重，因為是可拖曳/可點擊的互動內容）。
- **新增固定參考文件** `docs/design-system.md`：整理 token 現況、**新制定的斷點慣例**（主斷點 640px、極窄手機/資訊密集版面才需要的 400px、Voice Lab 雙欄用的獨立 899/900px 門檻維持不變）、間距/字級使用原則（優先用既有 token、不夠用時捨入到最近的既有值而非新增一次性 token、按鈕最小點擊熱區 44px）、手機版響應式現況盤點、已知技術債清單（衍生色集中管理、遊戲粉色系用 `color-mix()` 綁定來源色、`--nav-height` 疑似未使用）。
- **撰寫 handoff**：`docs/handoff-prompt-design-system-health-check.md`——(1) token 檔案補 `--color-accent-orange-tint`／`--color-accent-pink-tint` 兩個遺漏的淡色 tint；(2) `.nav-item`／`.menu-item` 寫死 px 改回對應 token，壓縮態的 10px 特例捨入到 `--space-2`（8px）而非新增 token；(3) **`.modal-overlay`／`.modal-card` 新增手機版 `@media (max-width: 640px)` 覆寫**（內距減半、標題字級降一階、關閉按鈕放大到 44px 符合最小點擊熱區）——這是直接回應使用者回報的部分，因為是共用外殼，首次進站提醒／改頭像/改名字等其他彈窗會一併受惠；(4) `.topic-card`／`.menu-item` 手機版內距微調。
- **刻意排除本輪範圍**：兩款遊戲缺手機版 CSS（牽涉 TypeScript 動態格子尺寸計算，需跟遊戲邏輯一起看）、衍生色集中化、遊戲主題色改用 `color-mix()`——都記錄進 `design-system.md`，留給下一輪健檢，避免這次改動範圍失控。
- **後續**：待 App 端執行 handoff、確認 build／驗證通過，實機（含手機寬度模擬）確認彈窗不再擁擠、桌面版完全不受影響。

### 9.154 App 端執行：填字遊戲手機版題目區太小、字母區太佔空間（2026-10-01）

使用者用真機截圖回報：手機直式畫面下，題目區（網格）明顯太小，下面字母區的方塊佔了太多空間，要求把字母磚縮小、讓題目區可以放大。

- **根因**：`crosswordStandalone.ts` 的 `fitGridToViewport()`（9.141～9.143 建立的機制）是整頁（標題、進度文字、網格、字母區、提示文字、頁尾按鈕）都排版完成後，才量測整頁高度有沒有超出這個 iframe 的可視高度，超出的話把超出的量整個算在網格身上去縮小格子——這表示字母區佔用的高度越多，可以留給網格的高度就越少，網格格子就會被壓得越小。截圖裡的「穿搭配件」關卡排版是 5 欄×9 列（`content/crosswords/clothing_accessories_outfit.json`，8 份題庫裡最窄長的一份），加上原本字母磚是 48px 見方、間距 12px，較難的關卡字母數量多（最多十幾個字母）在窄螢幕手機上會換成 2-3 行，光字母區就可能吃掉一兩百 px 的高度，網格因此被壓到最小下限（24px）。
- **修法**：單純調整 `crosswordStandalone.css` 的字母區樣式，不用額外動 JS 邏輯——`.crossword-tray` 的 `margin-top` 從 `--space-5`（24px）降到 `--space-4`（16px）、`gap` 從 `--space-3`（12px）降到 `--space-2`（8px）；`.crossword-tile` 的尺寸從 48×48px 縮到 36×36px、字級從 `--text-body-lg`（23px）降到 16px。因為 `fitGridToViewport()` 本來就是「整頁排版完才量測、按超出的量縮小網格」這套機制，字母區縮小、整頁高度自然變矮，同一套邏輯會讓網格不用縮得那麼小（甚至可能完全不用縮），這個改動不需要碰 `fitGridToViewport()` 本身的計算邏輯，純粹靠既有機制自動把省下來的高度反映到網格大小上。
- **沒有改動的部分**：格子本身的 `.crossword-cell`（含最小尺寸下限 24px）、`fitGridToViewport()` 的計算公式、`GRID_GAP_PX` 常數都維持不變——這次只是調整「字母區要分走多少版面」，不是調整「網格該怎麼縮放」的規則本身。
- **驗證**：`tsc --noEmit`、`verify-crossword-content.ts`／`verify-crossword-logic.ts`／全部既有 `verify-*.ts` 都通過；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.css` 確認 `.crossword-tile` 已經是 `width:36px;height:36px;...font-size:16px`、`.crossword-tray` 已經是 `margin-top:var(--space-4);...gap:var(--space-2)`；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：36px 的字母磚在真機上用手指拖曳的手感會不會因為變小而變得比較難精準操作（原本 48px 比較大顆好抓）、縮小後網格實際放大的幅度在這款「穿搭配件」最窄長的關卡上夠不夠明顯，都需要使用者實機重新試玩一次確認；如果 36px 覺得拖曳不好抓，可以回頭把這個數字調大一點（例如 40px），用網格放大的幅度跟拖曳手感兩者間抓一個使用者滿意的平衡點。
- 沒有執行任何 git 操作。

### 9.153 App 端執行：修正首頁主題卡片漏算 Stage E 會話練習（2026-09-30）

依 `docs/handoff-prompt-topic-card-stage-count-missing-conversation.md`（對應 9.152）執行。

- **修法完全照 handoff 給的方案**：`app/src/main.ts` 的 `ALL_STAGE_KEYS` 常數補上 `"conversation"`（從 6 個題型變成 7 個），註解「四種題型」／「六種題型」的過時文字一併改成正確的「七種題型」。分母 `ALL_STAGE_KEYS.length` 本來就是動態算的，卡片渲染邏輯（`buildTopicCard`）完全不用改，補完常數畫面就會自動變成「X / 7」。
- **grep 確認影響範圍**：`ALL_STAGE_KEYS` 在整個 `app/src` 底下只有 `main.ts` 這一處定義、`countChallengedStages()` 這一個函式用到，跟 handoff 描述的影響範圍一致，沒有漏掉其他引用點。
- **新增 `app/scripts/verify-topic-card-stage-count.ts`**（照 handoff 建議做的防呆，這是第二次發生「新增題型忘了同步這個清單」的狀況）：讀 `progress.ts` 的 `StageKey` 型別定義跟 `main.ts` 的 `ALL_STAGE_KEYS` 常數兩邊的原始碼字串，逐一比對成員是否完全一致（數量、內容都要對得上），不一致就直接讓驗證失敗並印出具體缺了哪個題型；另外確認卡片文案／進度條的分母寫法確實是 `ALL_STAGE_KEYS.length`（動態算）而不是寫死的數字。`main.ts` 因為用了 `import.meta.glob` 沒辦法直接 import 執行，這裡比照 `verify-menu-progress-tier.ts` 等既有腳本的做法，直接讀原始碼字串做正規表示式比對。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts`（含新增的 `verify-topic-card-stage-count.ts`，測試 1／2／3 皆通過：`StageKey` 型別跟 `ALL_STAGE_KEYS` 都正確涵蓋 7 種題型且完全一致、卡片渲染邏輯確認用動態分母）都通過；`npm run build` 通過，grep 打包後的 `dist/assets/main-*.js` 確認「種題型已挑戰過」字串跟 `"conversation"` 都有進到 bundle；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：實際畫面上「X / 7 種題型已挑戰過」的文字跟進度條視覺效果，需要使用者實機選一個已經玩過全部 7 種題型（含 Stage E）的主題確認顯示「7 / 7」、選一個還沒玩 Stage E 的主題確認顯示「6 / 7」。
- 沒有執行任何 git 操作。

### 9.152 使用者回報：首頁主題卡片「X / 6 種題型已挑戰過」漏算 Stage E，撰寫 handoff（2026-09-30）

使用者截圖回報首頁主題卡片顯示「6 / 6 種題型已挑戰過」，但主題其實已經有 7 種題型（字卡暖身＋Stage A～D＋Stage E 會話練習）。

- **根因**：`main.ts` 第 1223 行的 `ALL_STAGE_KEYS` 常數只列了原本 6 種（`flashcards／matching／ordering／fillBlank／choice／capstone`），新增 Stage E 時忘了同步補上 `"conversation"`——但 `StageKey` 型別本身（`progress.ts`）早就包含 `"conversation"`，Stage E 也是走跟其餘 6 種完全同一套 `getStageProgress`／`recordStageCompletion` 機制，`computeCompletedTopics()` 判斷主題是否完整完成時也已經正確把 Stage E 算進去，**只有這一個常數沒跟上**。
- **確認影響範圍**：卡片顯示的分母 `ALL_STAGE_KEYS.length` 是動態算的（不是寫死數字），所以修法很單純，只要把 `"conversation"` 加進這個陣列，畫面就會自動變成「X / 7」；grep 確認 `ALL_STAGE_KEYS` 沒有被其他地方引用，不會有連鎖影響。
- **撰寫 handoff**：`docs/handoff-prompt-topic-card-stage-count-missing-conversation.md`，附上修法（陣列加一項＋更新已經過時的「四種題型」註解），並建議順便加一支 `verify-topic-card-stage-count.ts` 防呆（這是第二次發生「新增題型忘記同步這個常數清單」的狀況，值得留一道檢查）。
- **後續**：待 App 端執行、確認 build／驗證通過，實機測一個已全破的主題應顯示「7 / 7」。

### 9.151 App 端執行：遊戲室導覽圖示換掉骰子＋翻牌配對從清單移除後的收尾（2026-09-30）

依 `docs/handoff-prompt-*.md`（對應 9.150 的企劃）執行。

- **確認 content 端已經做好的部分**：讀了 `content/games/games.json`，確認只剩 `crossword`（order 1）／`bubble_pop`（order 2）兩筆，`cost` 都是 `5`，`memory_match` 已經整筆移除——這部分不需要任何 App 端程式改動，`content.ts` 本來就是動態讀取這份清單產生遊戲室選單。
- **`app/src/main.ts` 的 `NAV_ICONS.gameRoom`**：把骰子圖案（正方形＋五個實心小圓點）換成掌上型遊戲搖桿圖案（圓角矩形機身＋十字方向鍵兩條線段＋右上兩顆實心小圓點當按鈕），完全照 handoff 給的 SVG 字串替換，`NAV_ICON_VIEWBOX` 沒有變動，顏色切換靠既有的 `currentColor` CSS 機制自動處理，不用額外調整。
- **翻牌配對遺留檔案維持不動**：`app/games/memory-match.html`／`app/src/games/memoryMatchStandalone.ts`／`memoryMatchGame.ts`／`vite.config.ts` 的 `memory-match` 進入點／`verify-memory-match-logic.ts` 全部保留，照 handoff 的建議先不清——`games.json` 已經沒有這筆資料，沒有任何入口會載入到這些檔案，純粹是死程式碼、不影響運作，之後確定要永久移除再一次清乾淨即可。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts`（含 `verify-memory-match-logic.ts`，確認 handoff 說的「腳本本身跑起來還是會過」屬實，跑的是獨立於 `games.json` 的引擎邏輯，跟遊戲室選單清單無關）都通過；`npm run build` 通過（`memory-match` 進入點也還是正常建置出 `dist/`，維持死程式碼但可建置的狀態）；grep 打包後的 `dist/assets/gameBridge-*.js`（`content.ts` 的 `GAMES` 陣列實際被打進這個共用 chunk，不是 `main-*.js`，這點跟原本預期的檔名不太一樣，值得記錄：Vite 依模組相依關係決定 chunk 歸屬，不會照直覺分到看起來最相關的檔名）確認 `crossword`／`bubble_pop` 兩筆的 `cost:5`、`order:1`／`order:2` 都正確、且陣列裡完全沒有 `id:"memory_match"` 這筆（`main-*.js` 裡還找得到 `"memory_match"` 字串，但那是 `currentGameId()` 這個函式裡的字面字串、不是資料，屬於前面提到的死程式碼，不影響選單顯示）；grep `dist/assets/main-*.js` 確認新的搖桿 SVG 路徑（`rx="4.5"` 那組屬性）有進到 bundle、舊骰子圖案的五點特徵（`cx="12" cy="12" r="1"`）已經完全消失；同步 grep 過重新產生的 `demo-standalone.html` 得到一致結果。重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：搖桿圖示在三種互動狀態（未選取／滑過／選取中）下實際的顏色切換效果、圖示新形狀會不會跟旁邊「遊戲室」文字擠在一起——理論上 `currentColor` 機制跟 `NAV_ICON_VIEWBOX` 尺寸都沒有變動，不應該有問題，但建議使用者實機或 `npm run dev` 看一眼確認；遊戲室選單畫面確認只剩兩個項目、費用都顯示 5 代幣，也建議實機點開看一次。
- 沒有執行任何 git 操作。

### 9.150 使用者提議：移除翻牌配對、剩餘兩款遊戲代幣統一改 5、遊戲室圖示換掉骰子（2026-09-30）

使用者三項要求：一、移除「翻牌配對」遊戲；二、剩餘兩款遊戲（填字遊戲、戳泡泡）的代幣費用均改為 5 代幣；三、遊戲室導覽圖示不要用骰子，尋找替代。

- **content 端直接處理（第 1、2 項）**：`content/games/games.json` 移除 `memory_match` 項目、`crossword`／`bubble_pop` 的 `cost` 都改成 `5`、`order` 重新編號成 1／2。因為遊戲室選單本來就是照 `GAMES` 這份清單動態產生（`content.ts` 用 `import.meta.glob`／直接 import 讀取，main.ts 用 `status !== "disabled"` 過濾），這部分**不需要任何 App 端程式改動**，重新 build／部署後選單就會同步更新。
- **撰寫 handoff（第 3 項）**：`docs/handoff-prompt-gameroom-icon-and-memory-match-removal.md`——`NAV_ICONS.gameRoom`（`main.ts` 第 1251-1252 行）目前是骰子圖案（正方形＋5 點），改成掌上型遊戲搖桿造型（圓角矩形機身＋十字方向鍵＋兩顆實心按鈕點），沿用同一套單色線條 SVG 風格（`NAV_ICON_VIEWBOX`），並備註如果搖桿造型不滿意，備選是拼圖片形狀。
- **翻牌配對相關程式碼未清除**：iframe 架構遷移時新增的 `app/games/memory-match.html`／`memoryMatchStandalone.ts`／`memoryMatchGame.ts`／`vite.config.ts` 的對應 rollup input／`verify-memory-match-logic.ts` 都還留著，變成沒有入口的死程式碼，不影響運作。在 handoff 裡明確標註這是「非急件、可自行評估要不要清」，先不動，保留之後想把遊戲加回來的彈性。
- **後續**：待 App 端執行圖示替換、確認 build／驗證通過，並實機確認遊戲室選單只剩兩款、費用顯示正確。

### 9.149 App 端執行：填字盤面透明度從 0.2 改成完全透明（2026-09-30）

使用者看過 9.148 的半透明（0.2）效果後，要求直接改成完全透明（0）。

- **修法**：`crosswordStandalone.css` 的 `.crossword-board` 背景從 `rgba(255, 255, 255, 0.2)` 改成 `rgba(255, 255, 255, 0)`，板子本身不再帶任何顏色，純粹當版面容器（負責 padding／置中格子跟字母區）用，背景插畫完全透出來。格子本身（`.crossword-cell--given`／`--blank`／`--blank.filled`）各自都有自己不透明的背景色，不會因為外層板子完全透明就看不清楚字母。
- **驗證**：`tsc --noEmit`、`verify-crossword-content.ts`／`verify-crossword-logic.ts` 都通過；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.css` 確認 `.crossword-board` 規則本身已經是 `background:#fff0`（`rgba(255,255,255,0)` 的簡寫，完全透明）；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：完全透明之後，格子跟字母區之間的留白（padding／gap）會直接看到背景插畫，這樣的視覺效果（尤其在插畫細節比較多的區域）好不好看，需要使用者實機看一次確認；如果覺得完全透明太雜亂，可以回頭調整成介於 0～0.2 之間的數字。
- 沒有執行任何 git 操作。

### 9.148 App 端執行：填字盤面改半透明＋拿掉陰影（2026-09-30）

使用者看到 9.147 加上背景插畫後的畫面，回報填字盤面（`.crossword-board`，格子跟字母區外面那塊白色底板）擋住了背景插畫，要求把透明度設為 0.2，並且拿掉陰影。

- **修法**：`crosswordStandalone.css` 的 `.crossword-board` 背景從不透明的 `var(--color-surface)`（`#FFFFFF`）改成半透明的 `rgba(255, 255, 255, 0.2)`，讓背景插畫可以透出來；同時移除原本的 `box-shadow: var(--shadow-sm)`——半透明的板子已經不是一塊「浮在最上層的實體卡片」外觀，繼續保留陰影會顯得不協調（陰影原本的用意是暗示卡片是不透明、疊在背景上方的實體，跟現在半透明融合背景的視覺方向矛盾），拿掉之後畫面更乾淨。
- **格子本身的可讀性不受影響**：填字格子（`.crossword-cell--given`／`--blank`／`--blank.filled` 這幾個狀態）本身各自都有自己不透明的背景色，只有 `.crossword-board` 的 padding／格子間空隙那些留白區域會透出背景插畫，不會讓已經寫好的字母看不清楚。
- **驗證**：`tsc --noEmit`、`verify-crossword-content.ts`／`verify-crossword-logic.ts` 都通過；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.css` 確認 `.crossword-board` 規則本身已經是 `background:#fff3`（`rgba(255,255,255,0.2)` 的簡寫）且沒有 `box-shadow`，同時確認其餘元件（按鈕、拖曳中的字母磚）原本各自的陰影沒有被誤刪；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：0.2 這個透明度數字實際疊在背景插畫上，格子跟字母區周圍留白的視覺效果好不好看（會不會讓背景圖案透過來太明顯反而分散注意力），需要使用者實機看一次確認；如果 0.2 太透或太不透，直接調整 `.crossword-board` 的 `rgba(255, 255, 255, X)` 這個數字即可。
- 沒有執行任何 git 操作。

### 9.147 App 端執行：填字遊戲加入背景插畫（2026-09-30）

使用者提供情境背景圖 `app/src/assets/games/crossword-letters-bg.jpg`（積木／拼圖片水彩插畫，元素集中在畫面上半部，下半部是素色米黃留白），要求加到填字遊戲畫面。

- **做法比照戳泡泡（`bubblePopStandalone.css`）已經確立的背景圖慣例**：`background-color` 當保底色（圖片還沒載入完成前，或極端狀況載入失敗時的備用底色，沿用原本的 `--color-crossword-pink-bg`）、`background-image` 疊上插畫、`background-size: cover` 讓圖片依畫面比例縮放鋪滿不變形、`background-repeat: no-repeat` 避免鋪磚重複——這四行都直接照抄戳泡泡那份寫法。
- **`background-position` 沒有照抄戳泡泡的 `center bottom`，改成 `top center`**：戳泡泡的天空背景插畫元素（雲朵等）集中在畫面下半部，所以用 `center bottom` 讓下半部的內容對齊可視範圍下緣；這次使用者給的填字遊戲背景圖插畫元素（積木、拼圖片）明顯集中在上半部，下半部是素色留白，所以改用 `top center`，讓有插畫細節的部分對齊可視範圍上緣——這個屬性要依每張圖片本身的構圖個別判斷，不是同一套遊戲就該套用同一組數字。
- **沒有動到版面結構或格子／字母區的任何樣式**：填字盤面（`.crossword-board`）本身是不透明的白色卡片蓋在背景圖上面，不會被這張背景圖影響到格子內容的可讀性，只有頁首標題、提示文字、頁尾按鈕周圍的留白區域看得到背景圖，維持這個遊戲原本「粉色系主題＋插畫點綴」的視覺方向不變。
- **驗證**：`tsc --noEmit` 通過；`npm run build` 通過，確認 `dist/assets/` 底下有產生對應的 hashed 檔名圖片（`crossword-letters-bg-*.jpg`），grep 打包後的 `dist/assets/crossword-*.css` 確認 `background-image`／`background-position:top center` 等規則都正確帶著這個 hashed 檔名進到最終產出；`verify-crossword-content.ts`／`verify-crossword-logic.ts`（跟這次改動直接相關的兩支腳本）都重新跑過確認通過。**戳泡泡功能同一時間有另一個並行處理在施工中，這次跑全部 `verify-*.ts` 迴圈時 `verify-bubble-pop-logic.ts` 短暫出現「關卡總數應為 3」的失敗**——這是那個並行處理當下還沒寫完的暫時性狀態，跟這次的填字遊戲背景圖改動無關，這裡沒有去動戳泡泡的任何程式碼或測試，純粹是巧合同時間施工撞見的暫態，記錄下來避免之後有人誤以為是這次改動造成的。
- **沒辦法在沙盒裡驗證的部分**：這張背景圖實際在手機小螢幕上跟粉色系文字（`--color-crossword-pink-700` 等）疊在一起的對比度／可讀性，以及 `top center` 這個定位在不同螢幕長寬比下插畫元素會不會被裁切到看不出形狀，都需要使用者實機看一次確認。`app/demo-standalone.html` 這次一樣沒辦法用來看這張背景圖的實際效果（沿用既有限制，`.game-iframe` 在單檔展示版本會被換成說明文字，見先前 HANDOFF 記錄）。
- 沒有執行任何 git 操作。

### 9.146 App 端執行：填字遊戲星等從 1-3 顆改成 1-5 顆（2026-09-30）

使用者要求把填字遊戲的星等評鑑從 1-3 顆星改成 1-5 顆星。

- **門檻重新設計**：`crosswordGame.ts` 的 `starsForMistakes()` 從原本的 3 段門檻（0-2 次錯誤=3★／3-5 次=2★／6 次以上=1★）改成 5 段：0 次=5★、1-2 次=4★、3-4 次=3★、5-7 次=2★、8 次以上=1★——維持「答錯越少、星等越高」的既有精神，只是把級距切得更細，讓「完全不錯」跟「錯 1-2 次」不再被歸在同一顆星裡，區分度更高一些。這幾個門檻數字是這次直接設計採用的（沒有另外詢問使用者要哪個確切門檻），之後如果覺得太嚴或太鬆，直接回頭調整 `starsForMistakes()` 裡的數字即可，不影響其他程式邏輯。
- **同步調整的地方**：`gameHighScores.ts` 的 `getBestStars()`／`recordStars()` 把「合法星等範圍」的上限從 3 改成 5（`n <= 3` → `n <= 5`、`Math.min(3, ...)` → `Math.min(5, ...)`）；`crosswordStandalone.ts` 的 `starsRow()` 畫星星迴圈的上限從 3 改成 5，圖示尺寸順便從 32px 縮到 26px（5 顆排起來寬度跟原本 3 顆×32px 差不多，不會讓那一排字忽然變寬很多）；`main.ts` 遊戲室卡片顯示最高紀錄星等的地方，畫星星的陣列從 `[1,2,3]` 改成 `[1,2,3,4,5]`。
- **已知取捨（沒有做資料轉換）**：`gameHighScores.ts` 只改了「星等上限」跟「換算門檻」，沒有針對「已經存在 localStorage 裡、舊制 1-3 顆星時代存下來的紀錄」做資料轉換——例如使用者先前在舊制下拿到滿分「3 顆星」，改版後畫面會顯示成「5 顆星裡的 3 顆」，看起來像沒有拿滿分，但其實是換算基準變了，不是退步。這個 App 是單機／個人使用情境（沒有雲端排行榜或跨裝置同步），影響範圍只有使用者自己這台裝置先前累積的最高紀錄視覺上「感覺變差」，不影響任何功能正確性；星等本身是鼓勵性質的呈現，沒有特別寫一次性資料轉換腳本，之後有需要再補。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts` 都通過（`verify-crossword-logic.ts` 的測試 3／測試 6 已同步改成新門檻的期望值：測試 3 逐一驗證 5 段門檻的邊界值，測試 6 驗證「三關加總 1 次錯誤」換算出新制下的 4 顆星而不是舊制的 3 顆星）；`npm run build` 通過，grep 打包後的 `dist/assets/main-*.js` 確認 `[1,2,3,4,5]` 這個畫星星用的陣列有進到 bundle。
- **沒辦法在沙盒裡驗證的部分**：5 顆星排成一排在小螢幕手機上的實際視覺密度（圖示縮小到 26px 之後看起來會不會太擠、觸控/點按沒有互動需求所以應該不影響操作，純粹是視覺密度），建議使用者實機看一次確認排版還過得去。
- 沒有執行任何 git 操作。

### 9.145 App 端執行：修正填字遊戲答對單字唸成逐字母拼讀（2026-09-30）

使用者截圖回報：交通工具主題答對 CAR 之後，語音唸成「C、A、R」逐字母拼讀，不是唸整個單字「car」。這次回報剛好碰上 9.144 才剛上線的第二批 7 個主題題庫（交通工具是其中之一），順便確認這個 bug 是通用問題、不是特定主題的內容錯誤。

- **根因**：`content/crosswords/*.json` 裡每個單字的 `en` 欄位依 schema 規定一律存成全大寫（例如 `"CAR"`），`crosswordStandalone.ts` 在 9.139 新增「答對整字唸出來」功能時直接把 `word.en`（全大寫字串）送進 `speakEnglish()`——很多瀏覽器的語音合成引擎看到全大寫的短字串會當成縮寫/簡稱處理，逐字母拼讀而不是當一般單字唸出完整發音，跟 `speech.ts` 檔頭本來就記錄過的其他發音問題（"Mia" 被拼讀、句首大寫 "Is" 被唸成 "Ice"）是同一類「引擎誤判」現象，只是這次的觸發條件是「整個字全大寫」。
- **這個問題其實已經在戳泡泡（Bubble Pop，9.138 提案）遇過並修好了**：`bubblePopStandalone.ts` 第 155 行呼叫 `speakEnglish(word.toLowerCase())`，答題內容同樣來自全大寫的顏色單字，已經用 `.toLowerCase()` 解決——這裡確認填字遊戲漏掉了同一個修法，不是新的未知成因。
- **修法**：`crosswordStandalone.ts` 觸發答對語音的那一行改成 `speakEnglish(word.en.toLowerCase())`，跟戳泡泡採用同一個修法，維持全站對同一類問題一致的解法（不用另外發明新寫法）。
- **執行時順便修掉一個無關的建置錯誤**：跑 `tsc --noEmit` 時發現 `bubblePopStandalone.ts` 第 90 行有一個未使用的 `idx` 參數（`targetLetters.forEach((_, idx) => {...})`，`idx` 沒被用到）導致整個專案型別檢查失敗——這是戳泡泡功能開發過程中另一個並行處理留下的小疏漏，跟這次要修的填字遊戲問題無關，但因為 `tsc --noEmit` 是對整個專案做檢查、任何一個檔案有錯就會擋住驗證，這裡順手把這個未使用的參數拿掉（`forEach(() => {...})`），沒有動到戳泡泡功能本身的任何邏輯。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts`（含 9.144 新增的 7 份題庫內容檢查）都通過；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.js` 確認 `toLowerCase` 有進到 bundle；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。這個修法是通用的（作用在 `word.en` 這個變數本身，不是針對特定主題寫死），所以 9.144 新增的 7 個主題（含交通工具）跟原本的居家空間主題都會一併修好，不用逐一測試每個主題。
- **沒辦法在沙盒裡驗證的部分**：`.toLowerCase()` 這個修法在戳泡泡已經是「還沒實機驗證過就先採用」的狀態（跟這裡一樣，沒有喇叭/瀏覽器的沙盒環境沒辦法真的聽出差異），這次填字遊戲比照辦理，理論上原理相通（多數瀏覽器的語音引擎是看「大小寫」而非「詞性」在判斷要不要逐字母拼讀），但實際聽感仍需要使用者實機確認——如果小寫化之後這個引擎還是拼讀，可能要考慮 `speech.ts` 檔頭那個「加句點讓引擎當完整短句處理」的候選方案（比照 "Is." 的既有寫法）。
- 沒有執行任何 git 操作。

### 9.144 填字遊戲第二批內容——新增 7 個主題題庫（2026-09-30）

使用者詢問「填字遊戲，我們會需要製作多少主題題庫？」，說明目前模型是「一個主題一份題庫，關卡難度靠同一份單字表的挖空比例調整（40%／65%／85-90%）」，並建議先做第二批 5-8 個生活常用單字量較多的主題，而不是一次把全部約 30 個可行主題做完。使用者確認：**「5-8 個主題、開始生成下一批題庫」**。

- **選題**：family（我的家人）、food_drink（食物與飲料）、school（學校生活）、animals_insects（動物朋友）、clothing_accessories（穿搭配件）、transportation（交通工具）、parts_of_body（身體部位），共 7 個主題，皆確認對應 vocab 檔全部單字 `status: "published"`（15～31 字不等）。
- **產生方式**：沿用 9.135／9.137 的離線排版產生器（Python，非 App 執行期運算），這次針對 9.137 App 端實機測試抓出的 bug 類別（相鄰但不相關的字母無意間排成看得懂的字串，例如「BFR」「ELO」）額外強化，新增三項強制檢查，任何一項沒過就整份重算：
  1. `check_connected()`——所有單字要透過共用格子彼此連通成一個整體，不能有孤立單字。
  2. `has_same_direction_overlap()`——**這次新抓到的一類 bug**：兩個「同方向」（都橫排或都直排）的單字，不能有任何格子重疊。原因：`school` 主題原本想放 PEN 跟 PENCIL、`parts_of_body` 主題原本想放 EYE 跟 EYEBROW，這兩組短字剛好是長字的字首，排版演算法只檢查「重疊格子字母要一致」（沒問題，因為前幾個字母真的一樣），結果讓 PEN 整個字完全疊在 PENCIL 的前 3 格、EYE 整個字完全疊在 EYEBROW 的前 3 格——變成畫面上兩個「不同的單字」占用完全相同的格子範圍，邏輯上說不通。修法：兩個候選字若同方向且有任何格子交集，直接判定排版不合法，重新排版；`school` 排除 PEN、`parts_of_body` 排除 EYEBROW，各自保留另一個字（PENCIL／EYE）。
  3. `check_no_accidental_fragments()`——對應 9.137 的「BFR/ELO」bug 類別，逐一檢查網格裡每一段「橫向或縱向連續 ≥2 格的填字區塊」是否剛好對應「某一個宣告的單字」，不容許不小心排出的無意義字母片段。
- **7 份最終題庫**（皆已通過上述三項檢查＋原有的字母衝突檢查，零衝突、全連通、無同方向重疊、無意外片段）：
  - `content/crosswords/family_my_family.json`：GROW／DAUGHTER／AUNT／SISTER／COUSIN／FATHER，8×6 網格
  - `content/crosswords/food_drink_food_and_drink.json`：WATER／APPLE／BREAD／BANANA／CAKE／EGG，9×5 網格
  - `content/crosswords/school_school_life.json`：RULER／LIBRARY／STUDENT／DESK／PENCIL／SCHOOL，5×10 網格（PEN 因故排除，理由見上）
  - `content/crosswords/animals_insects_animal_friends.json`：SNAKE／MICE／HORSE／BEE／DOG／CAT，5×7 網格
  - `content/crosswords/clothing_accessories_outfit.json`：PANTS／HAT／SKIRT／WEAR／COAT／SHOES，9×5 網格
  - `content/crosswords/transportation_vehicles.json`：TAXI／TRUCK／SHIP／BIKE／CAR／BUS，7×6 網格
  - `content/crosswords/parts_of_body_body_parts.json`：EYE／HEAD／ARM／MOUTH／LEG／FEET，5×5 網格（EYEBROW 因故排除，理由見上）
- **`hintZh` 文案清理**：組成提示句時發現部分單字的 `zh` 欄位（直接取自對應 `content/vocab/*.json`，該欄位本身給單字卡／總覽頁用途沒有問題）帶有給學習用的附註，直接接進「單字包括：...」的提示句會很拗口，例如 FATHER 是「爸爸（= dad; daddy）」、MICE 是「老鼠（複數）」、WEAR 是「穿、戴（狀態）」、FEET 是「腳（複數，foot 的不規則複數）」。這些附註只在各主題 `vocab.json` 裡保留（維持原本用途與可追溯性，未改動），**只有這 7 份題庫檔案自己的 `hintZh` 組成句**做了簡化：有頓號「、」的取第一個念法，結尾有「（...）」附註的整段去掉（例如「爸爸（= dad; daddy）」→「爸爸」、「老鼠（複數）」→「老鼠」、「穿、戴（狀態）」→「穿」、「腳（複數，foot 的不規則複數）」→「腳」），每個單字項目自己的 `zh` 欄位（`words[].zh`，題庫 JSON 內部）維持跟來源 vocab 一致未改動。
- **確認不需要 App 端任何程式改動**：讀了 `app/src/content.ts` 確認 `content/crosswords/*.json` 是用 `import.meta.glob("../../content/crosswords/*.json", { eager: true, import: "default" })` 全部讀進 `CROSSWORDS` 陣列（跟 vocab／sentences 同一套模式，程式碼註解也寫明新增檔案不用改程式），且填字遊戲在遊戲室選單裡是「扁平的單一入口」（`content/games/games.json` 只有一個 `crossword` 項目，用 `status` 決定要不要顯示），不是像 Stage E 會話練習那樣「每個主題各自判斷是否有內容才顯示選項」——所以這批新增的 7 份題庫檔案上傳之後即可自動被讀到、自動可玩，不需要另外寫 handoff 給 App 端。
- **驗證**：對 8 份題庫檔案（含既有的 `houses_apartments_living_space.json`）逐一重跑「字母衝突、連通性、同方向重疊、意外片段」四項程式化檢查，全部通過（皆為直接讀取最終寫入磁碟的 JSON 檔案驗證，不是只驗證產生時的記憶體內資料）。
- **後續**：待使用者決定是否繼續往全部約 30 個可行主題擴充（排除單元七 11 個文法類主題），或維持目前規模；若繼續，沿用同一套產生器與三項檢查即可。

### 9.143 App 端執行：修正填字遊戲網格仍超出畫面＋紅框改成整字一框（2026-09-30）

使用者截圖回報兩件事：一、9.142 修完之後畫面還是超出範圍；二、答對後的紅框是「每個字母各自一框」，希望改成「整個單字一個框」。

- **問題一根因（9.142 沒修乾淨的地方）**：`crosswordStandalone.css` 的 `.crossword-grid` 設了 `gap: 4px`（格子之間的間距），但 `crosswordStandalone.ts` 算網格容器的 `width`／`height` 時，只用了「格子邊長 × 格數」，沒有把 `gap × (格數-1)` 這段額外空間也算進去——容器實際需要的高度比程式算出來的還多，最後一列格子因此超出容器自己宣告的高度，被 `.crossword-board` 的 `overflow:hidden` 切掉一截。`fitGridToViewport()` 反推「目前格子邊長」時也是同樣的漏算，導致整套縮放邏輯從一開始量測的基準就是錯的。修法：新增 `GRID_GAP_PX = 4` 常數（跟 CSS 那份數字對齊維護），拆出 `applyGridSize(cellPx)` 統一負責設定 `grid-template-columns／rows` 跟容器 `width／height`（兩者都正確加上 gap 那一段），`fitGridToViewport()` 反推目前格子邊長時也同步扣掉 gap 佔用的高度，這樣量測跟設定用的是同一套正確公式，不會再有落差。順便補上「寬度也要顧到」：新增量測 `board` 實際可用寬度（扣掉左右 padding），如果目前格子邊長讓網格總寬度超出可用寬度（例如小尺寸手機），先縮小寬度方向，再處理高度是否超出可視範圍，避免只顧到某一個方向。
- **問題二**：原本的做法是讓單字裡每一格各自套用 `.crossword-cell--word-complete` 這個 class，各自畫一圈紅框，相鄰格子的框疊在一起雖然外觀像一個大框，但因為是「每格各自的框」，格子邊界之間還是會看到多餘的疊線。改法：不再幫個別格子加樣式，改成新增 `renderWordCompleteBoxes()`，用「格子邊長＋間距」精算出整個單字（不管幾個字母、橫向或縱向）在網格裡的實際像素範圍，額外畫一個絕對定位的 `.crossword-word-complete-box` 覆蓋在那個範圍上面（`pointer-events:none` 不擋拖曳判定，`box-sizing:border-box` 確保框線畫在算好的範圍「裡面」不會位移）——這樣不管單字幾個字母，視覺上都是一個乾淨的框，格子內部完全沒有多餘的線。這個函式在初次渲染格子後呼叫一次，`fitGridToViewport()` 縮放格子尺寸之後也會重新呼叫一次（因為紅框的像素座標跟著格子邊長變動，縮放後如果不重算，紅框位置會對不齊新的格子位置）。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts` 都通過；額外寫了一段獨立的 Node 腳本驗算 gap 相關的像素公式（`width = cellPx×gridWidth + gap×(gridWidth-1)`，用這個公式算出的高度反推回 cellPx 要能還原成原本的數字），確認往返運算沒有誤差；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.js`／`*.css` 確認新的 `crossword-word-complete-box` class 名稱有進到 bundle、舊的 `crossword-cell--word-complete`（每格各自一框那版）已經完全清除、`getComputedStyle`（量測 board 寬度用到的 API）有進到 bundle；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：這是這一項排版尺寸問題第三輪修正了，每一輪都只能靠程式碼審查跟公式推導抓根因，沒有瀏覽器沒辦法實際看到渲染結果，這次改用「明確 px 數字＋正確的 gap 公式」取代先前依賴 CSS 自動運算比例的寫法，理論上更可靠，但最終還是要使用者實機重新試玩一次確認：答題區真的完整顯示不用捲動、答對後的紅框是一個乾淨的框圍住整個單字（不是每個字母各自一框）。如果這輪還是沒修好，麻煩下次回報時盡量附上「這台裝置的螢幕尺寸／瀏覽器種類」，方便判斷是不是特定螢幕比例才會出現的邊界情況。
- 沒有執行任何 git 操作。

### 9.142 App 端執行：修正 9.141 的修法把答題區切掉一截的問題（2026-09-30）

使用者截圖回報：9.141 修完「需要捲動」的問題後，畫面變成更糟——FLOOR 那一列格子被硬生生切成一半，下半部完全看不到，字母區反而正常顯示在被切開的格子下方，紅框標記處剛好就是 `.crossword-board` 的下邊界。

**根因**：9.141 用 CSS `aspect-ratio` 搭配 `max-height:58vh` 想讓瀏覽器自動縮放整個網格（設計理念是模仿圖片 `object-fit: contain` 那種「兩個方向都不超框、自動抓最大合適尺寸」的效果）。但這個技巧只有瀏覽器對「替換元素」（img、video 這類本身有固有比例、渲染引擎知道怎麼整體縮放的元素）才會完整套用；一般 `<div>` 搭配 CSS Grid 排版，`aspect-ratio` 只會用來算「還沒填的那個維度該多大」，並不會回頭去校正另一個已經定案的維度，所以最終算出來的容器尺寸（寬 420px、高被 `max-height` 夾到某個值）其實已經破壞了原本要求的長寬比；更嚴重的是 `.crossword-cell` 自己也另外寫了一份 `aspect-ratio:1/1`，CSS Grid／Flexbox 規範裡「格子最小尺寸預設等於它自己想要的大小」（`min-size:auto`）這條規則，讓每個格子拒絕縮小到比它認定的正方形更小的尺寸，於是格子們撐出來的實際總高度還是超過容器被夾住的高度，超出的部分被 `.crossword-board` 的 `overflow:hidden` 直接切掉——比原本「需要捲動至少還看得到全部內容」的體驗更差（內容直接消失）。

- **修法：完全改用 JS 明確計算像素尺寸，不再依賴 CSS `aspect-ratio` 這類讓瀏覽器自動運算比例的相對寫法。** `crosswordStandalone.ts` 的 `render()` 一開始先用「保守預設格子邊長」（依這一關的欄數換算，夾在 24px～84px 之間）直接把 `grid-template-columns`／`grid-template-rows`／`width`／`height` 全部設成明確的 px 數字（不是 `1fr` 或 `%`），格子的正方形完全是靠這組明確的 px 軌道尺寸保證，不再靠任何一層 `aspect-ratio`。等整頁（標題、進度文字、網格、字母區、提示文字、頁尾按鈕）全部排版完成、`syncProgress()`／`syncFooter()` 都跑完之後，新增的 `fitGridToViewport()` 會量測 `document.documentElement.scrollHeight`（整頁實際高度）有沒有超過 `window.innerHeight`（這個 iframe 頁面自己的可視高度——iframe 是獨立的瀏覽情境，這裡量到的是 iframe 本身的視窗高度，不是外層 App 頁面的），超出的話直接反推「網格要縮小多少 px」，重新寫回明確的 `grid-template-columns`／`rows`／`width`／`height`（保留 16px 安全邊界避免四捨五入誤差、24px 最小格子尺寸下限避免縮到看不清楚字母／點不準），確保縮完之後整頁高度剛好落在可視範圍內。
- `crosswordStandalone.css` 同步移除 `.crossword-grid` 的 `aspect-ratio: 1/1`、`max-height: 58vh`、`max-width: 420px`（這些通通交給 JS 算好的明確 px 數字取代，不再需要任何比例／相對尺寸規則）；`.crossword-cell` 也移除 `aspect-ratio: 1/1`，改成明確寫 `min-width: 0; min-height: 0;`——確保格子一定會乖乖縮到 grid 軌道給的實際尺寸，不會再有自己的「最小尺寸主張」跟 `fitGridToViewport()` 算出來的縮小結果打架。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts` 都通過；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.js` 確認 `scrollHeight`／`innerHeight`（`fitGridToViewport()` 用到的量測 API，函式本身名稱在 minify 後會被改掉，所以改用這兩個不會被改名的瀏覽器原生 API 字串來確認邏輯有進到 bundle）都有進到最終產出，grep `dist/assets/crossword-*.css` 確認 `aspect-ratio`／`max-height:58vh` 這兩個造成問題的寫法都已經完全移除；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：這次改法依賴 `document.documentElement.scrollHeight` 跟 `window.innerHeight` 這兩個瀏覽器 API 在真實 iframe 環境裡量出來的數字是否準確反映「使用者看到的可視範圍」——不同手機瀏覽器（尤其 iOS Safari 的網址列/工具列會動態顯示/隱藏，影響 `innerHeight` 的即時數值）算出來的縮放結果可能有落差，這點沒辦法在沒有瀏覽器的沙盒裡確認，需要使用者實機重新試玩一次，確認這次真的不用捲動、格子也沒有被切掉一截。
- 沒有執行任何 git 操作。

### 9.141 App 端執行：修正填字遊戲網格超出畫面需要捲動的問題（2026-09-30）

使用者截圖回報：9.139 把居家空間關卡改成 5 欄×8 列（窄長形狀）之後，遊戲畫面裡的格子超出可視範圍，要往下捲動才看得到剩下的格子跟字母區。

**根因**：`crosswordStandalone.css` 的 `.crossword-grid` 從一開始（9.136）就寫死 `aspect-ratio: 1 / 1`，隱含假設「排版一定是正方形」——在舊排版（5×5、9×6 這種寬高比較接近的形狀）底下沒被注意到，但 9.139 改成 5×8 這種明顯窄長的排版後，這個寫死的正方形比例硬把一個「該是長方形」的網格塞進正方形的框，換算下來 8 列格子疊起來的實際高度遠超過容器原本設定的 420px 寬度（也就是原本假設的高度），超出的部分只能靠捲動看到。

- **修正**：`crosswordStandalone.ts` 的 `render()` 改成依照這一關實際的 `crossword.gridWidth`／`gridHeight` 動態設定 `grid.style.aspectRatio = \`${gridWidth} / ${gridHeight}\`;`，不再假設一定是正方形；`crosswordStandalone.css` 的 `.crossword-grid` 額外補上 `max-height: 58vh`（CSS 的 `aspect-ratio` 搭配同時存在的 `max-width` 跟 `max-height`，瀏覽器會自動算出「兩個方向都不超框」的最大尺寸，效果類似圖片的 `object-fit: contain`），這樣不管之後 content 端排出正方形、長方形還是窄長形的關卡，整個網格都會自動縮放到完整顯示在遊戲畫面裡，不用使用者捲動；`.crossword-cell` 本身也還留著 `aspect-ratio: 1/1`，因為現在網格整體比例已經跟實際欄數/列數一致，格子計算出來的寬高本來就會剛好相等，這個保險不會造成衝突。
- **執行時順便發現的插曲**：修正過程中重新跑 `tsc --noEmit` 一度出現 `main.ts` 找不到 `BUBBLE_POP_ICON`／`renderBubblePop` 沒被使用等錯誤——這是另一個並行處理中的「戳泡泡」（Bubble Pop）功能正在同時編輯 `main.ts` 造成的暫時性不一致狀態，跟這次要修的填字遊戲問題無關；等了一下該功能的編輯完成後重跑 `tsc --noEmit` 就恢復正常，這裡沒有對 `main.ts`／戳泡泡相關程式碼做任何實質修改，純粹是巧合撞見別人施工中的暫時狀態。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts` 都通過（含戳泡泡新增的驗證腳本，這批不是這次修正的內容，但因為同一輪 build 跑過一起確認沒有互相影響）；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.js` 確認 `aspectRatio` 這個 inline style 屬性設定有進到 bundle、`dist/assets/crossword-*.css` 確認 `max-height:58vh` 有進到最終產出；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：`aspect-ratio` 搭配 `max-width`／`max-height` 這種「雙向自動縮放取最小值」的排版行為，雖然是標準 CSS 規格的既有支援（不是實驗性功能），但實際在手機瀏覽器上縮放出來的字級/觸控熱區大小是否還夠大、`58vh` 這個高度上限數字在不同手機螢幕比例下觀感如何，仍建議使用者實機重新試玩一次確認，不需要再捲動看到完整網格。
- 沒有執行任何 git 操作。

### 9.140 使用者提議 Stage E 會話練習新增「練習模式」（模糊中文），撰寫 handoff（2026-09-30）

使用者希望 Stage E 會話練習新增「練習模式」，打開後把中文翻譯模糊。用 `AskUserQuestion` 確認範圍：只模糊聊天記錄裡已說過的台詞中文，還是連這一輪答題選項的中文也一起模糊——使用者選擇**兩者都要**（進階挑戰模式）。

開始處理前先重新驗證了 `content/crosswords/houses_apartments_living_space.json` 又被調整過的網格（這次是 5×8，6 字互相有交集且零衝突，比對 9.139 記錄的「排版改成真正有交集」修正一致，沒有問題）。

寫好 handoff 交給 App 端執行：見 `docs/handoff-prompt-conversation-practice-mode.md`。設計延續「單字總覽」練習模式（9.114~9.117）已確立的原則——裝置層級開關、預設關閉、純 CSS class 切換不呼叫 `render()`：
- 新增裝置層級設定 `conversationPracticeMode.v1`，開關按鈕放進 `stageHeader()` 的 `extraActions`（比照單字總覽練習模式按鈕的既有位置模式）。
- 聊天記錄的中文：**逐句獨立模糊**，點哪句就只解除那一句，不影響其他句、不重繪整頁（保留捲動位置跟其他已點開的狀態）。
- 答題選項的中文：因為三個選項是整輪一起換新的（不像聊天記錄逐句累積），改成一個「看中文」按鈕**一次顯示這一輪全部三個選項**，進入下一輪選項會自動重新模糊。
- 特別提醒最容易出錯的地方：務必只在 `practiceModeOn === true` 時才加上模糊 class，關閉時要完全零影響，這點要寫進驗證腳本重點檢查；也提醒不影響既有的逐字點擊查詢翻譯 tooltip 功能。

### 9.139 App 端執行：填字遊戲第二輪實機回饋修正——標題字級、每字至少留提示、排版改成真正有交集、答對整字紅框＋語音（2026-09-30）

使用者用截圖回報 4 個新問題（前一輪 9.137 剛修完 7 個 bug 之後又試玩一次發現的）：

1. 「提示：居家空間」標題字級太大。
2. 答題區太多空格，每個單字需保留至少一個字母提示（截圖看到 ROOF／SOFA／ROOM 三個字完全沒有任何已知字母，整條空白，等於憑空亂猜）。
3. 6 個單字彼此完全沒有交集，各自散落畫面各處，不像真正的填字遊戲（使用者附的參考圖是一般填字遊戲常見的「互相交錯」排法）。
4. 答對、完整拼出一個單字時，要用紅框整個圈起來＋語音唸出這個單字，不用等到整關破完才有回饋。

**注意：這輪修正直接推翻了 9.138（戳泡泡企劃）裡「已確認 9×6、只留一個交疊點的排版是刻意設計，不需要處理」這個判斷**——9.138 動工前只針對「有沒有意外無意義字母片段」重新驗證過 9.137 的排版，沒有重新檢視「排版本身夠不夠像真正的填字遊戲（單字之間該有交集）」這個問題，這輪使用者實際回報後才發現排版雖然沒有無意義片段，但因為刻意只留一個交疊點、其餘單字完全不相交，玩起來视覺上更像「6 個獨立的單字方塊隨機擺放」而不是「填字遊戲」。9.138 那段記錄不會回頭修改（歷史記錄維持原樣），這裡說明清楚以免之後有人誤以為排版又被改壞。

- **問題 1（標題字級）**：`crosswordStandalone.css` 的 `.game-header h1` 字級從 `--text-h2`（32px）改成 `--text-body-lg`（23px）。原本想改用 `--text-h3`（28px），但跟 `--text-h2` 只差 4px，視覺上感覺不出差別，改用差距更明顯的 `--text-body-lg`。
- **問題 2（每個單字至少留一格提示）——這是 `crosswordGame.ts` 引擎邏輯的問題，不是排版問題**：原本 `setupLevel()` 只用「隨機打散、取前 N 格當空格」這一種邏輯決定哪些格子要挖空，唯一的下限保護是 `LEVEL3_MIN_KNOWN_CELLS = 2`——但那個下限是「整個網格」層級的，不是「每個單字」層級的，隨機挑選的結果完全可能讓某幾個單字的格子全部剛好都被選中變成空格，導致那個單字從頭到尾沒有任何提示字母。修法：新增 `wordCellKeys`（建構子時算好每個單字佔用哪些格子座標）跟 `ensureEveryWordHasKnownLetter()`，`setupLevel()` 算完隨機空格集合後，這個方法會逐一檢查每個單字是否至少有一格不在空格集合裡，不夠的話就從該單字的格子裡「還原」一格（優先挑跟別的單字共用的交疊格，這樣一格同時滿足兩個單字的下限、少動格數）。寫了一支獨立的 500 次隨機試驗腳本（模擬三關、每關都正常破關），確認新版邏輯下每個單字在每一關都至少留有一格已知字母，無一例外（見下方驗證段落）。
- **問題 3（排版要有真正的交集）——完全重新設計 `content/crosswords/houses_apartments_living_space.json`**：原本 9.137 的 9×6 排版刻意只留 BED×DOOR 一個交疊點，避免意外無意義片段的代價是犧牲了「像真正填字遊戲」的視覺效果。這次用程式輔助搜尋（隨機打亂單字放置順序＋逐一嘗試跟已放置單字的共用字母交叉、每次放置都同步檢查交疊處字母一致且不會產生任何意外相鄰片段、最後檢查全部 6 個單字透過交疊連成同一個連通元件）取代純手算，找到一個 5 欄 × 8 列、19 格的排版，6 個單字用 5 個交疊點串成一條鏈：BED×DOOR（(0,2) 共用 D）→ DOOR×ROOM（(2,2) 共用 O）→ ROOM×ROOF（(2,0) 共用 R，剛好是兩個字都用第一個字母當起點的角落交叉）→ ROOF×FLOOR（(5,0) 共用 F／R，兩字都在這個交疊格結束/開始）→ FLOOR×SOFA（(5,3) 共用 O）。用另一支獨立腳本重新逐格印出網格＋掃過每一段連續格子確認全部對應到唯一宣告單字，確認排版正確（沒有意外片段）且真的是一個連通的填字盤面，不是 9.137 那種各自獨立的孤島。
- **問題 4（答對整字紅框＋語音）**：`crosswordStandalone.ts` 新增 `wordCoords()`（算出某個單字佔用哪些格子座標，跟 `crosswordGame.ts` 內部算法相同邏輯但是渲染端自己算，沒有另外從引擎開 API，純粹畫面呈現用途）；`render()` 每次重繪時，會先掃過 `crossword.words`，找出「這個單字本來至少有一格是空格（不是從一開始就全部已知），而且現在全部格子都已知」的單字（用 `game.displayLetterAt()` 判斷），把這些單字的格子座標記進 `wordCompleteCellKeys`，畫格子時額外加上 `.crossword-cell--word-complete` 這個 class（3px 紅框＋內縮紅色 box-shadow，疊在既有的綠色「答對格」底色上面）；同時用 `announcedWordIndexesForLevel`（一個 Set，記錄「這一關已經唸過的單字 index」）確保同一個單字在同一關只會觸發一次 `speakEnglish()` 語音（不然整段重繪的 `render()` 每次都會重新掃過一次，若沒有這個記錄會每次重繪都重唸）；換到下一關或整個 game 物件重建（按「再玩一次」）時，透過比對 `game.level` 是否變動來清空這個記錄，確保新關卡的單字可以正常重新觸發語音。故意排除「本來就整個是已知格、使用者完全沒有拼過」的單字（例如某個很短的字剛好在挖空時整條都被判定成已知格）不觸發語音跟紅框，這種情況不是使用者「答對」的，不用給這個回饋。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts`（含 `verify-crossword-content.ts`、`verify-crossword-logic.ts`）都通過；另外寫了一支獨立的 500 次隨機試驗腳本（`CrosswordGame` 搭配正式的 `houses_apartments_living_space.json` 內容，模擬使用者連續破完三關），確認每一關、每一個單字都至少保留一格已知字母，500 次無一例外；`npm run build` 通過，grep 打包後的 `dist/assets/crossword-*.js`／`*.css` 確認 `crossword-cell--word-complete` 這個 class 名稱、`speech.ts` 模組（`speakEnglish` 的所在檔案）都有正確進到 bundle；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生示範頁面並複製到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：紅框的視覺呈現在小螢幕上會不會太搶眼／跟既有綠色答對底色疊在一起好不好看、語音唸出單字的時機聽起來順不順（例如交疊格剛好讓兩個單字幾乎同時完成時，兩段語音會不會疊在一起搶著唸）、新排版（5×8、19 格、5 個交疊點）的整體視覺是否真的比較像「填字遊戲」——這些都建議使用者實機重新試玩一次確認。
- 沒有執行任何 git 操作。

### 9.138 使用者提議遊戲室第三款遊戲：戳泡泡（Bubble Pop，顏色主題），撰寫企劃與 handoff（2026-09-30）

使用者提出企劃：泡泡裡有字母，依中文顏色提示依序點破拼出正確單字，答錯的泡泡往隨機方向飄移（不消失、可再點），要規劃關卡機制，視覺走天空白雲插畫風格。開始處理前先重新驗證了 9.136/9.137 調整過的填字遊戲網格（9×6、只留一個交疊點）——確認這是刻意設計，用來避免像舊版 5×5 排法那樣出現「BFR」「ELO」這類無意義相鄰字母片段（見 9.137 問題 5 排查），不是疏漏，不需要處理。

已直接完成的內容工作：
- `content/games/games.json` 新增 `bubble_pop` 一筆，`status` 先設 `"coming_soon"`。
- `docs/image-prompt-bubble-pop-background.md`：天空＋白雲插畫背景的圖片生成提示詞，風格比照既有情境插畫但换成純氛圍背景（無角色、無敘事），特別提醒構圖中下段要留白低對比,避免蓋掉之後疊加的泡泡跟文字。

寫好完整實作 handoff 交給 App 端：見 `docs/handoff-prompt-bubble-pop-game.md`。第三款遊戲一樣直接沿用前兩款已經確立的「獨立 iframe＋`gameBridge.ts`」架構。內容涵蓋：
- 單字範圍明確列出 `content/vocab/colors.json` 裡 14 個純顏色詞的 vocabId 對照表（排除 light／dark／bright／colorful 等修飾詞跟畫筆/剪刀等美術用品詞彙，這個檔案雖然檔名是 colors 但因為先前主題擴充已經混雜了非顏色詞彙）。
- 提示詞顯示邏輯：`zh` 欄位要去掉結尾的「的」字才乾淨顯示。
- 依序拼字判定邏輯（`popBubble()`：比對「目前該拼的字母」，對了才消掉累加進度，錯了觸發飄移事件但不移除泡泡）。
- 比照前兩款「一局三關」節奏的關卡設計：字母數＋干擾泡泡數隨關卡遞增（3-4字/+4 → 5字/+6 → 6字/+8）。
- 明確提醒：不要把難度值/干擾字母數這些數字自己調整手感，也不要把 light/dark/bright/colorful 這些非純顏色詞混進答案範圍。

### 9.137 App 端執行：修正填字遊戲實機試玩回報的 7 個 bug（2026-09-30）

使用者在真機（手機）實際試玩 9.136 剛上線的填字遊戲後，用 6 張截圖＋1 張參考圖回報 7 個問題。逐一排查與修正如下：

- **問題 1／2／3／4／6（拖曳不流暢、卡頓、答錯/放手時字母跑到畫面左下角、答對後格子裡字母沒有置中對齊、換關卡時上一關的字母沒清除）——這五個表面症狀其實是同一個根本原因**：`crosswordStandalone.ts` 原本的 `makeTileDraggable()` 在 `pointerdown` 時把字母磚 `document.body.appendChild(tileEl)` 重新掛到 `<body>` 底下（這樣拖曳時磚才能疊在所有元素最上層、不被格子或其他 UI 擋住），但 `render()` 每次重繪只會清空 `#crossword-app` 這個容器的 `innerHTML`，磚被重新掛到 `<body>` 之後就徹底脫離了 `render()` 管得到的 DOM 樹——舊的磚元素變成永遠不會被清掉的孤兒節點，留在畫面上原本 `document.body.appendChild` 當下的座標（螢幕左下角，因為 `position:fixed` 預設定位點沒設 `left/top` 時瀏覽器行為造成的視覺結果剛好落在那個角落），這就是使用者看到「字母跑到左下角」的直接原因；換關卡時舊磚元素同樣沒被清掉，就變成「多餘字母殘留」（問題 6）；而拖曳中途的重新掛載／樣式切換造成的 reflow，加上孤兒節點越積越多，就是「不流暢、容易卡頓」的原因（問題 1）。
  - **修正方式**：完全移除 `document.body.appendChild()` 這一步，拖曳中的磚**保持留在原本的 `tray` 容器裡**，單純用 `position: fixed` 讓它脫離正常文件流、視覺上浮在最上層跟著指標移動（`position: fixed` 本身就足以達到「蓋在所有元素上面」的效果，不需要真的搬動 DOM 節點）；放開手指或點擊落點判斷完之後，`bounceBack()` 只需要把 `position/left/top/width/height` 這幾個 inline style 重設回空字串（`""`），磚就會因為還在原本的 flex 容器（`tray`）裡，自動彈回它在字母區裡原本該在的排列位置——不需要手動記錄/還原 `originParent`／`originNextSibling` 再重新插入。這樣一來 `render()` 的 `app.innerHTML = ""` 清空邏輯就能正常清到這個元素（因為它從頭到尾都沒有離開過被管理的 DOM 子樹），問題 1/2/4/6 一次解決。
  - 問題 3（答對後格子裡字母沒有置中、排列不整齊）也是同一個修正順便解決：舊寫法答對瞬間磚還頂著 `position:fixed`／`left/top` 這些拖曳中殘留的 inline style 沒有重設乾淨就被視為「放到格子裡」，`game.onChange()` 觸發整段重繪時雖然會重新生成格子內容的 DOM，但殘留的孤兒磚元素本身還飄在畫面上沒被清掉、視覺上疊加在新格子旁邊造成「沒有置中、排列不整齊」的錯覺；拿掉重新掛載＋確實重設 inline style 之後，格子內容完全由 `render()` 重新產生的標準排版負責置中，不會再有殘留元素干擾。
- **問題 5（題目區橫向出現無意義單字或非答案單字，例如 "BFR"／"ELO" 這種片段）——這是 content 端排版設計的問題，不是程式邏輯的 bug**：`crosswordGame.ts` 原本只驗證「交疊處字母一致」，沒有驗證「網格裡任何一段連續格子（不管橫向還是縱向）本身是不是剛好對應到某個宣告的單字」，導致舊版 `houses_apartments_living_space.json`（5×5、18 格）裡有些不相關單字的格子剛好緊鄰排在同一列/同一欄、彼此之間沒有刻意留空隔開，畫面上讀出來就會冒出一段沒人設計過的字母序列。
  - **修正方式**：完全重新設計 `content/crosswords/houses_apartments_living_space.json` 的座標排版，改成 9×6 網格、23 個格子，6 個單字（BED／DOOR／FLOOR／ROOF／SOFA／ROOM）之間只保留**唯一一個刻意設計的交疊點**（BED 跟 DOOR 在 `(0,2)` 交疊，字母都是 `D`），其餘單字之間都用空白緩衝格隔開，逐格手動驗證過橫向/縱向每一段連續格子都恰好對應唯一一個宣告單字，不會出現任何意外相鄰片段。
  - **同時在 `app/scripts/verify-crossword-content.ts` 新增一項防倒退檢查**（避免以後 content 端再不小心排出無意義片段却沒人發現）：掃過網格裡填滿的每一格，分別依「列」跟「欄」分組、找出每一段「連續（座標差 1）、長度 ≥ 2」的格子區間，逐一比對這段區間是不是剛好等於 `words[]` 裡某個宣告單字的起點座標＋方向＋長度；只要有任何一段連續格子沒有對應到剛好一個宣告單字，就直接讓驗證腳本失敗並印出是哪一列/哪一欄、哪個座標區間出的問題，方便之後 content 端排版時提早在離線階段抓到，不用等使用者實機試玩才發現。
- **問題 7（「居家空間」改成「提示：居家空間」，移除前置 icon，移除場上的裝飾 icon）**：`crosswordStandalone.ts` 內層標題（iframe 裡遊戲本體自己的標題，不是外層帶返回鍵的「填字遊戲」頁首，那個沒有改動）從 `<h1>${CROSSWORD_ICON(...)}${crossword.title}</h1>` 改成純文字 `<h1>提示：${crossword.title}</h1>`，移除 `CROSSWORD_ICON` 的 import 跟使用；同時整段移除 9.136 那版刻意加上的雲朵／亮片星星裝飾插圖（`DECOR_CLOUD`／`DECOR_SPARKLE` 常數、`render()` 裡建立/掛載這兩個裝飾 div 的程式碼，以及 `crosswordStandalone.css` 裡對應的 `.crossword-decor`／`.crossword-decor--tl`／`.crossword-decor--br` 樣式規則），照使用者要求场上完全不留任何裝飾 icon。
- **驗證**：`tsc --noEmit`、全部既有 `verify-*.ts`（含這次擴充過的 `verify-crossword-content.ts`）都通過；`npm run build` 通過，清空 `dist/` 重新完整建置一次後 grep 打包後的 `dist/assets/crossword-*.js`／`*.css` 確認：`document.body.appendChild` 字串已經不存在、`提示：` 字串有進到 bundle、`crossword-decor` 字串（CSS class 名稱）已經完全清除；重新用 `build-content-review.mjs`／`build-dashboard.mjs`／`build-standalone-demo.mjs` 重新產生 `content-review.html`／`dashboard.html`／`demo-standalone.html` 並複製最新版到專案根目錄。
- **沒辦法在沙盒裡驗證的部分**：拖曳修正之後實際手感是否真的流暢不卡頓、彈回動畫在真機上的視覺效果、格子置中排列在不同螢幕寬度下是否整齊，這些都需要使用者在真機上重新試玩一次才能確認——這次修正的根本原因（DOM 孤兒節點）只能靠程式碼審查跟邏輯推理找出來，沒有任何既有 verify script 能自動抓到這類純粹跟真實瀏覽器互動相關的 bug，這點跟先前每一款遊戲上線時的既有限制一致。新版排版（9×6、23 格、唯一一個交疊點）已經逐格手動驗證過，理論上不會再出現無意義字母片段，但畫面實際排版效果（例如兩個獨立單字之間的留白間距看起來會不會太空曠）同樣建議實機確認一次。
- 沒有執行任何 git 操作。

### 9.136 App 端執行：遊戲室第二款遊戲——填字遊戲（Crossword）（2026-09-30）

依 `docs/handoff-prompt-crossword-game.md` 執行，對應 9.135 的企劃。從一開始就照翻牌配對剛遷移好的「獨立 iframe＋`gameBridge.ts`」架構做，不用事後遷移。

- **`app/src/games/crosswordGame.ts`**（新檔，純邏輯引擎，不碰 DOM）：`buildCells()` 把 `Crossword.words` 依座標鋪成網格、算出每格正確字母，交疊處字母不一致直接丟例外（content 端的 `verify-crossword-content.ts` 已經離線把關過，這裡是執行期最後一道保險）。`blankCountForLevel(level, totalCells)` 依 40%／65%／87.5% 三段比例算這一關要挖空幾格，第 3 關額外夾在「總格數 − 2」以內，確保至少留 2 格已知字母當提示錨點（不會出現完全裸猜的情況）。`dropLetter(row, col, tileId)` 判斷對錯：答對固定進格子、從字母區移除、觸發 `onCorrectDrop()`；答錯只累計 `mistakeCount`＋觸發 `onWrongDrop()`，刻意**不**觸發 `onChange()`——讓 renderer 可以自己播放「彈回字母區」的動畫，不會被整段重繪打斷（跟 `memoryMatchGame.ts` 的 `onMismatch` 不觸發整段重繪是同樣的理由）。三關全破時用 `starsForMistakes(mistakeCount)` 把「三關加總的錯誤次數」換算成 1-3 顆星（0-2 次三星／3-5 次二星／6+ 次一星，門檻先照 handoff 給的預設值）。過關/進下一關的節奏比照 `memoryMatchGame.ts` 的 `phase` 狀態機設計思路（這裡簡化成 `playing`／`levelComplete`／`complete` 三態，沒有翻牌配對的「開局記憶倒數」，因為填字遊戲的已知格從一開始就看得到，不需要「先看再蓋牌」這一段）。
- **`app/src/games/crosswordStandalone.ts`＋`app/games/crossword.html`＋`app/src/games/crosswordStandalone.css`**（新檔）：`vite.config.ts` 的 `rollupOptions.input` 新增 `crossword: "games/crossword.html"`。拖曳互動**刻意不用原生 HTML5 Drag and Drop API**（手機瀏覽器支援度不好，這個 App 主要使用情境是手機），改用 `pointerdown`／`pointermove`／`pointerup` 手動實作：`pointerdown` 把字母磚切成 `position:fixed` 跟著手指/滑鼠移動，`pointerup` 時暫時把磚本身 `display:none` 再用 `document.elementFromPoint()` 判斷底下是哪個格子（不這樣做的話量到的會是磚自己，因為磚目前疊在手指正下方），交給 `game.dropLetter()` 判斷對錯；答對交給 `game.onChange` 整段重繪（不像翻牌配對需要 FLIP 動畫維持既有 DOM 節點，correct drop 之後直接重畫一次最簡單可靠），答錯或沒放到有效格子上就把磚彈回字母區原本位置＋一個小小的 CSS `scale` 彈跳動畫（`crossword-tile--bounce`），不用懲罰性音效或文字。視覺走粉色系（`--color-crossword-pink-*` 系列，從 design tokens 既有的 `--color-accent-pink` 延伸出更深/更淺版本，只有這個遊戲用得到，不影響主站或翻牌配對），跟翻牌配對「每款遊戲有自己視覺風格」的既有結論一致。
- **裝飾插圖的設計決定（沒有照 handoff 字面上「沿用居家空間情境插畫」做）**：handoff 提到裝飾小插圖可以呼應「居家空間」主題（檯燈、書、窗簾），但 `crosswordStandalone.ts` 這支渲染程式碼是**填字遊戲整個遊戲殼的共用外觀**——之後 content 端擴充其他主題的填字關卡（例如換成食物或動物主題）時會直接沿用同一套殼，不會因為主題換了還要跟著換裝飾美術素材。所以這裡選用跟任何主題內容都不衝突的柔和造型（雲朵、亮片星星）當裝飾，而不是寫死居家空間專屬的檯燈/書本圖案，避免把通用元件綁死在單一主題的美術素材上。這是刻意偏離 handoff 字面建議的地方，在此說明理由，供之後回頭調整參考。
- **`app/src/gameHighScores.ts`**（新檔，遊戲室共用「最高紀錄」模組）：完全照 handoff 給的介面做——`getBestStars(profileId, gameId)`／`recordStars(profileId, gameId, stars)`，per-profile 存在 localStorage，只有新星等比現有紀錄高才會真的更新。`main.ts` 的 `renderGameRoom()` 卡片新增這一排星星（`.game-room-card-stars`，沒玩過/0 顆星就不渲染這個 div），翻牌配對沒有主動呼叫 `recordStars()`，`getBestStars()` 對它一律回傳 0，不用另外判斷遊戲種類。
- **`gameBridge.ts` 的 `"complete"` 訊息新增選填 `stars` 欄位**：只有像填字遊戲這種有最高紀錄機制的遊戲才會帶這個欄位，`crosswordStandalone.ts` 破關時把 `starsForMistakes()` 算出來的星等透過這個欄位送給 parent；`main.ts` 的 `handleGameBridgeMessage()` 收到帶 `stars` 的 `"complete"` 訊息才呼叫 `recordStars()` 存檔——跟代幣扣款走同一套「持久化狀態只存在 parent」的架構原則，iframe 完全不知道 profile／localStorage 這些概念存在。翻牌配對的 `"complete"` 訊息維持不帶 `stars`（`undefined`），不會走進這個新分支。
- **`main.ts` 的 `handleGameBridgeMessage()` 從寫死 `"memory_match"` 改成通用查詢**：新增 `currentGameId()`，用目前的 `screen` 狀態（`"memoryMatch"` / `"crossword"`）判斷是哪一款遊戲，`requestReplay` 分支改成用這個函式查對應的代幣成本——這是第二款遊戲上線後必須做的通用化，不然填字遊戲「再玩一次」會照翻牌配對的代幣數字扣款（20 而不是 25）。新增 `goToCrossword()`（比照 `goToMemoryMatch()`）、`renderCrossword()`（比照 `renderMemoryMatch()` 的 iframe 掛載殼）、`Screen` 型別新增 `"crossword"`、`appendGameRoomConfirmModal()` 的確認按鈕新增 `else if (game.id === "crossword") goToCrossword();` 分支。
- **`content/games/games.json` 的 `crossword` 狀態從 `"coming_soon"` 改回 `"active"`**：照 handoff 最後一步的提醒（這是最容易忘記的一步）。沙盒沒有瀏覽器沒辦法真的做手機觸控／滑鼠拖曳的實機測試，這點跟前面每一款遊戲上線時的既有限制一樣——選擇先照established 慣例翻成 active、驗證腳本／build 都過，再麻煩使用者實機驗證，而不是留在 `coming_soon` 卡住使用者看不到新遊戲；如果實機試玩發現拖曳互動有問題，這筆狀態隨時可以改回 `coming_soon` 補救。
- **新增 `app/scripts/verify-crossword-logic.ts`**（比照 `verify-memory-match-logic.ts`）：用一個 5 格的小型固定測試關卡（CAT／CAR 在 (0,0) 交疊）跑 7 項測試——交疊網格正確組出、`blankCountForLevel()` 三關比例遞增且第 3 關正確夾在留 2 格已知以內、`starsForMistakes()` 門檻邊界值、字母區磚的數量/種類剛好對應空格需求、答錯正確累計 `mistakeCount` 不移除磚不觸發整段重繪、答對正確固定進格子並觸發過關轉場、連續闖三關才算 `isComplete` 且星等依三關加總錯誤次數正確換算、交疊處字母不一致的排版資料會讓建構子丟例外。重跑 10 次左右確認隨機挖空的結果不會讓測試變成不穩定（flaky）。
- **新增 `app/scripts/verify-crossword-content.ts`**：讀取 `content/crosswords/*.json`，驗證基本欄位形狀符合 `crossword.schema.json`、每個單字的 `vocabId` 都能在對應主題的 `content/vocab/<topicFileKey>.json` 找到且英文/中文一致、重新排版驗證交疊處字母全部一致（跟 `crosswordGame.ts` 執行期做的是同一種檢查，這裡離線先把關）。**發現一個 handoff 文字敘述跟實際排版對不上的小地方**：handoff 說「6 個單字共 15 個字母格」，但實際照座標展開 `houses_apartments_living_space.json` 的排版是 **18 個格子**（24 個字母扣掉 6 個交疊格），純粹是企劃文字裡的估算誤差，不影響排版本身的正確性（已用程式驗證交疊處字母全部一致），不需要回頭改 content，這裡記錄一下差異方便日後對照。
- **`verify-game-bridge-messages.ts` 比照擴充**：新增對 `crosswordStandalone.ts` 的同源保護／不直接扣款／不直接存最高紀錄／`requestReplay` 正確 postMessage 等檢查（原本只查翻牌配對一支檔案，改成迴圈跑兩支獨立遊戲檔案）；新增檢查 `main.ts` 的 `requestReplay` 分支已經用 `currentGameId()` 取代寫死 `"memory_match"`；新增檢查 5：`crosswordStandalone.ts` 的 `"complete"` 訊息帶 `stars`、`main.ts` 收到會呼叫 `recordStars()`。
- **驗證**：`tsc --noEmit`、全部 `verify-*.ts`（含兩支新增的）、`npm run build` 都通過；`npm run build` 之後確認 `dist/games/crossword.html` 正常產生、grep 打包後的 `dist/assets/main-*.js` 確認「填字遊戲」字串跟 `game-room-card-stars` 都有進到 bundle，grep `dist/assets/crossword-*.js` 確認 `crossword-tile` 拖曳相關字串有進到 iframe 專屬 bundle。
- **沒辦法在沙盒裡驗證的部分（拖曳互動、觸控相容性一定要實機測）**：手機觸控拖曳字母磚是否流暢、滑鼠拖曳（電腦）是否正常、答錯彈回動畫有沒有卡頓、粉色系視覺跟兩個裝飾插圖（雲朵/亮片）在不同裝置寬度下排版正不正常、格子/字母磚在小螢幕上的觸控熱區夠不夠大、三關的整體節奏（尤其第 3 關幾乎全空格的難度）玩起來手感如何。麻煩用 `npm run dev` 本機開發伺服器或部署後的正式站，分別用手機觸控跟電腦滑鼠各玩一輪確認。`demo-standalone.html` 這次一樣沒辦法用來測填字遊戲本身（沿用翻牌配對那次的 `MutationObserver` patch，`.game-iframe` 元素在單檔展示版本會被換成說明文字），只能測其餘功能。
- 沒有執行任何 git 操作。

### 9.135 使用者提議遊戲室第二款遊戲：填字遊戲（Crossword），撰寫企劃與 handoff（2026-09-30）

使用者參考截圖提出填字遊戲企劃：題目區網格交疊排列、字母拖曳區、答對留下答錯彈回、關卡機制、最高紀錄、粉色系視覺＋裝飾插圖。評估後確認「即時依使用者個人學習進度動態生成填字網格」不可行（字母交疊排版需要運氣好的單字組合，學過的字太少/太分散可能湊不出網格），改用「以主題為單位、預先排版好的固定關卡」，跟使用者確認後採用此方向。用 `AskUserQuestion` 確認兩個關鍵決定：關卡數量（選擇先做 1 個主題打樣）、最高紀錄呈現方式（選擇用 1-3 顆星）。

已直接完成的內容工作：
- `content/schema/crossword.schema.json`：填字關卡資料格式。
- `content/crosswords/houses_apartments_living_space.json`：第一個打樣關卡「居家空間」（houses_apartments 主題），6 個真實既有單字（BED／FLOOR／ROOF／DOOR／SOFA／ROOM）排成 5×5 網格——排版是我寫一支回溯演算法離線算出來的，並用程式驗證過所有交疊格字母一致無衝突，App 端不用自己處理排版邏輯。
- `content/games/games.json` 新增 `crossword` 一筆，`status` 先設 `"coming_soon"`（避免引擎還沒做完就被使用者點到空畫面），代幣消費 25。

寫好 handoff 交給 App 端執行：見 `docs/handoff-prompt-crossword-game.md`。第二款遊戲從一開始就採用翻牌配對剛遷移好的「獨立 iframe＋`gameBridge.ts`」架構，不用事後再遷移一次。內容涵蓋：拖曳判定邏輯（比對格子正確字母，答對固定/答錯彈回）、比照翻牌配對「一局三關、空格比例遞增（40%→65%→85-90%）」的關卡設計、星等評分（三關錯誤次數加總，0-2次三星/3-5次二星/6+次一星）、建議新增共用的 `gameHighScores.ts` 模組（趁第二款遊戲的機會把最高紀錄存取邏輯抽成共用，供未來遊戲沿用）、特別提醒手機觸控拖曳相容性（不要依賴原生 HTML5 Drag and Drop API，建議用 pointer event 自己實作）、完成後記得把 `games.json` 的 `crossword` 狀態改回 `"active"`。

### 9.134 App 端執行：修正 Voice Lab「返回學習主站」連結（絕對路徑→相對路徑）（2026-09-30）

依 `docs/handoff-prompt-voicelab-back-link-bug.md` 執行，對應 9.133 的回報。

- **`app/src/voiceLab.ts` 第 212 行**：`<a href="/" ...>` 改成 `<a href="index.html" ...>`，用相對於目前頁面（`voice-lab.html`）的檔名，跟打包後跟 `index.html` 同一層目錄的實際情況一致，也跟 `vite.config.ts` 既有的 `base: "./"` 相對路徑輸出慣例對齊。跟 handoff 建議一致，沒有用 `href="./"`（指名 `index.html` 比較明確，不會在不同目錄層級情境下猜錯）。
- **新增 `app/scripts/verify-voice-lab-back-link.ts`**：用正規表示式抓出 `voiceLab.ts` 裡 `class="lab-back-btn"` 那個 `<a>` 標籤的 `href` 屬性值，斷言① 不是 `"/"`、不是以 `http` 開頭的絕對路徑，② 剛好等於 `"index.html"`。單獨開一支新檔案而不是塞進既有的 `verify-app-icon-manifest.ts`，因為這兩者檢查的對象（manifest 路徑欄位 vs. 頁面內連結）沒有直接關聯，分開比較好找、以後這個回歸點要單獨停用/調整也不會互相干擾。
- **驗證**：`tsc --noEmit`、全部 `verify-*.ts`（含新增的這支）、`npm run build` 都通過；`npm run build` 之後 grep 確認 `dist/assets/voiceLab-*.js` 打包出來的字串是 `href="index.html" class="lab-back-btn"`，不是 `href="/"`。這個修法本身很單純（純字串路徑，不是動態計算的邏輯），沒有需要另外用瀏覽器模擬子路徑部署情境的必要；真正的「點下去到底能不能回首頁」還是要等正式站更新後在手機/電腦上實測一次，或用 `npx serve dist` 之類的方式在本機模擬（沙盒沒有瀏覽器沒辦法自己點）。
- 沒有動到其他檔案（`index.html`／`main.ts`／`vite.config.ts` 都不需要改），也沒有執行任何 git 操作。

### 9.133 使用者回報：Voice Lab「返回學習主站」連結失效，撰寫 handoff（2026-09-30）

使用者在正式站回報：進入語音比較實驗室後沒辦法返回平台首頁。排查發現 `app/src/voiceLab.ts` 第 212 行的返回連結寫死 `href="/"`（絕對路徑），會導到網域根目錄 `https://78vince.github.io/`，不是專案子路徑 `https://78vince.github.io/english-for-kids/`——正式站是部署在 GitHub Pages 專案子路徑，`vite.config.ts` 本來就有 `base: "./"` 的既有慣例（註解寫明是為了 GitHub Pages 子路徑），`voiceLab.ts` 這個連結沒有遵守，是單純的疏漏。

寫好 handoff 交給 App 端執行：見 `docs/handoff-prompt-voicelab-back-link-bug.md`，修法是把 `href="/"` 改成 `href="index.html"`（相對路徑，明確指名檔案，避免 `./` 在不同目錄層級情境下的歧義）。

### 9.132 App 端執行：修正洗牌動畫「只有一張牌動」／起始位置不對的 bug（2026-09-29）

使用者實機試玩 9.131 之後回饋：「洗牌動畫，有時候會出現，只有一張牌移動。或是移動的起始位置不正確的狀況，它們應該是被選定的兩張交換位置。」排查 `memoryMatchStandalone.ts` 的 FLIP 動畫程式碼，找到兩個會導致這個現象的根本原因，都在 `game.onChange` 這個 callback 裡：

- **量測時機被其他版面更新污染**：原本的執行順序是先跑 `syncProgress()`／`syncCountdown()`／`syncFooter()`（會改變倒數數字、提示文字內容，尤其是進入 shuffling 階段那一瞬間，倒數數字換成「🔀」、footer 提示文字整段換掉，文字長度不同可能造成版面重排），**之後**才呼叫 `syncGridOrder()` 量測卡片的新座標（`newRect`）。這代表算出來的位移量 `dx/dy = oldRect - newRect` 裡，混進了「這些不相關的文字更新造成的版面偏移」，不是單純「這兩張卡片互換位置」的位移量。如果這個偏移量剛好跟卡片互換的位移量互相抵銷，就會算出 `dx === 0 && dy === 0`，被既有的 `if (dx === 0 && dy === 0) continue;` 判斷式跳過整個動畫——這正是「有時候只有一張牌移動」的成因：兩張卡片中剛好只有一張的位移被污染到歸零。沒有剛好抵銷的情況下，則會讓起始位移量偏移，也就是使用者說的「起始位置不正確」。修法：把 FLIP 量測／套用動畫整段搬到 `onChange` 最前面（緊接在 `syncCardButton()` 之後），`syncProgress()`／`syncCountdown()`／`syncFooter()` 挪到最後才跑，讓 `oldRect`／`newRect` 之間只夾雜「這次互換」這一件事，不會被其他文字更新的版面重排干擾。
- **CSS transition 可能被瀏覽器合併成同一個 frame，動畫直接被跳過**：FLIP 手法的標準做法是「先用 `transition:none` 把元素瞬間跳到舊座標的相對位移量，下一個 frame 再打開 transition、把位移歸零」，讓瀏覽器把這個歸零過程畫成動畫。但如果中間沒有強制瀏覽器先把「跳到舊座標」這一步實際算圖層、畫出來，瀏覽器有可能會把這兩個動作（設 `transition:none` 那行、跟 `requestAnimationFrame` 裡打開 transition 那行）優化合併成同一個 frame 處理，結果卡片直接「跳」到最終位置，完全沒有播放滑動動畫——這是不少 FLIP 動畫實作常踩到的經典陷阱，也可能是「只有一張牌看得到動畫」的另一半成因（兩張卡片中，瀏覽器排程剛好只合併掉其中一張的動畫）。修法：在設定完 `transition:none` 與起始 `transform` 之後，多一行 `void btn.offsetWidth;` 強制觸發一次同步的版面重算（reflow），確保瀏覽器已經把「跳到舊座標」這個起始狀態實際套用、畫出來一次，才進到下一個 frame 開始播放動畫，不會被合併掉。
- **驗證**：這兩個都是視覺時序 bug，`MemoryMatchGame` 引擎（`memoryMatchGame.ts`）完全沒有改動（bug 出在 renderer 端如何呈現引擎丟出來的事件，不是引擎邏輯本身），所以 `verify-memory-match-logic.ts` 全部 7 個測試不用改，重跑一次照樣通過；`verify-game-bridge-messages.ts` 也重跑通過（沒有動到這部分）。`tsc --noEmit`、`npm run build` 都通過，grep 打包後的 `dist/assets/memoryMatch-*.js` 確認新的 `offsetWidth` 強制 reflow 字串有進到 bundle。動畫視覺效果一樣沒辦法在沙盒裡實際看，麻煩實機玩幾輪第 2、3 關洗牌，確認兩張被選定的卡片是不是每次都同時看得到滑動動畫、且起始位置就是它們原本所在的格子。
- 沒有動到 `memoryMatchGame.ts`（洗牌邏輯／時間常數這次沒有再調整，維持 9.131 剛放慢的數字）、`main.ts`、`gameBridge.ts`，也沒有執行任何 git 操作。

### 9.131 App 端執行：洗牌動畫再放慢、移動卡片置頂、第 3 關改先後交換（2026-09-29）

使用者實機試玩 9.130 的 iframe 版本後回饋三點：「洗牌動畫，速度再慢一點，洗牌時移動的卡牌，應該在所有卡牌的最上層，不被遮擋。第三關洗牌，先交換兩張，完成後，在交換兩張。」對應改動：

- **動畫時長再拉長**（`app/src/games/memoryMatchGame.ts`）：`SHUFFLE_MOVE_DURATION_MS` 900ms→**1400ms**，`SHUFFLE_SETTLE_PAUSE_MS` 700ms→**900ms**（移動播完到蓋牌開始遊戲之間的停留），兩者相加的 `SHUFFLE_ANIMATION_MS`（建構子第 3 參數預設值）變成 2300ms。這兩個常數上一輪（9.128）才調過一次，這次是同一批常數再放慢，沒有新增常數。
- **移動中卡片 z-index 置頂**（`app/src/games/memoryMatchStandalone.ts` 的 FLIP 動畫區塊）：卡片用 `transform: translate()` 滑到新位置的過程中，實際上是「疊在」grid 的正常排列順序上面移動，原本沒有處理堆疊順序，可能被旁邊沒在動的卡片擋住一部分。這裡在套用 transform 的同時把該卡片的 `style.zIndex` 設成 `"5"`（`.memory-match-card` 本來就是 `position: relative`，加 z-index 就會生效），動畫時長（`SHUFFLE_MOVE_DURATION_MS`）到了之後用 `setTimeout` 把 `zIndex` 清空還原——刻意選 `setTimeout` 而不是 `transitionend`，因為 `transitionend` 在某些情況下（例如 transform 剛好又變回原值）不保證觸發，`setTimeout` 比較保險。
- **第 3 關兩組互換改成先後發生**（`app/src/games/memoryMatchGame.ts` 的 `performShuffle()`）：原本第 2/3 關共用同一段邏輯——不管要換幾組，一次算出全部 `swapPairs`、一次呼叫 `onShuffleStart(swapPairs)`、一次把全部互換同步套用到 `this.cards`、等一段 `shuffleAnimationMs` 之後直接進 `playing`；第 3 關（4 張卡、2 組）因此是兩組同時滑動。改寫成新的私有方法 `performSwapStep(swapPairs, stepIndex)`：每次只處理 `swapPairs` 裡的一組——`onShuffleStart([[idA, idB]])`（陣列長度固定變成 1，不再是原本「可能 1 組可能 2 組」）→套用這一組的互換→`onChange()`→等 `shuffleAnimationMs` 之後遞迴呼叫自己處理下一組；全部組數處理完才排 `startPlaying()`。第 2 關（只有 1 組）行為跟原本完全一樣（只是繞了一層遞迴，觀察不出差異）；第 3 關現在是「換第一組→等動畫播完→換第二組→再等一次→才蓋牌開始遊戲」，總延遲也因此從原本 1 倍 `shuffleAnimationMs` 變成 2 倍。`onShuffleStart` 的事件文件（型別上方的註解）跟著更新，說明現在每次都只帶 1 組、一次 `performShuffle()` 可能觸發多次。
- **`verify-memory-match-logic.ts` 新增測試 7**：先連過第 1、2 關進到第 3 關的 `shuffling` 階段，掛 `onShuffleStart` 記錄每次呼叫時收到的組數、以及當下 `game.cards` 的排列順序快照；斷言剛好觸發兩次、每次都只帶 1 組、且第二次觸發時的卡片順序跟第一次不一樣（代表第一組真的已經換完才輪到第二組，不是兩組同時算好一次丟出來）。測試檔開頭的常數註解（`TEST_SHUFFLE_ANIM_MS` 對應的正式時長）同步更新成 2300ms。原本測試 1～6 全部原封不動重跑一次都通過（第 2 關單組互換的行為沒有變化，測試 5 的斷言不用改）。
- **驗證**：`tsc --noEmit`、全部 `verify-*.ts`（含新增的測試 7）、`npm run build` 都通過；grep 打包後的 `dist/assets/memoryMatch-*.js` 確認新的 `1400` 時長常數跟 `zIndex` 字串都有進到 iframe 專屬 bundle。這三項都是動畫時序／視覺堆疊層次相關，沙盒沒有瀏覽器沒辦法實際看動畫跑起來，麻煩實機（`npm run dev` 或部署後）玩到第 2、3 關確認：洗牌動畫是不是真的比之前慢、移動中的卡片有沒有蓋在其他卡片上面、第 3 關是不是先看到一組換完才換下一組。
- 沒有動到 `memoryMatchStandalone.css`（z-index 是用 JS inline style 直接設，不需要新增 CSS 規則）、`gameBridge.ts`、`main.ts`（這幾個都跟這次三項回饋無關），也沒有執行任何 git 操作。

### 9.130 App 端執行：翻牌配對改成獨立 iframe＋postMessage 橋接（遊戲室架構升級）（2026-09-29）

依 `docs/handoff-prompt-memory-match-iframe-migration.md` 執行，對應 9.129 的請求。這是架構重構，**翻牌配對的玩法/規則/時間常數/事件觸發順序完全沒有改動**，只是把「哪段程式碼跑在哪裡」重新分配。

- **`app/src/gameBridge.ts`**（新檔）：`GAME_BRIDGE_CHANNEL` 常數＋`GameToParentMessage`（`ready`／`requestReplay`／`exitToRoom`／`complete`）／`ParentToGameMessage`（`replayApproved`／`replayDenied`）兩組型別，`main.ts` 跟 `memoryMatchStandalone.ts` 都是 `import` 這份型別，沒有各自定義字串常值。
- **`app/games/memory-match.html`**＋**`app/src/games/memoryMatchStandalone.ts`**（新檔）：比照 `voice-lab.html` 的既有模式，`vite.config.ts` 的 `rollupOptions.input` 新增 `memoryMatch: "games/memory-match.html"`。這支新進入點把原本 `main.ts` 的 `createMemoryMatchGame()`／`renderMemoryMatch()`（DOM 渲染、開局倒數、FLIP 位移動畫、5 種音效掛勾）整段搬過來，逐行比對沒有改動任何時間常數或事件順序；`MemoryMatchGame` 引擎（`memoryMatchGame.ts`）完全沒有動。這支頁面刻意不 `import gameTokens.ts`，完全不知道代幣這個概念存在——「再玩一次」按鈕只會 `postMessage` 一個 `requestReplay`，等 parent 回 `replayApproved` 才真的重新開局（`replayDenied` 不用做任何事，因為 parent 那時候已經自己導去遊戲室了）。
- **抽卡邏輯共用化**：`content.ts` 新增 `export const TOPICS`／`export interface TopicConfig`／`export interface TopicContent`／`export function loadTopicContent()`（原本是 `main.ts` 自己的模組內私有邏輯，這次搬過去變成共用的），以及新的 `export function pickRandomVocabPairs(count)`（從 `TOPICS` 裡「內容齊全」的主題隨機抽配對，跟主站學習範圍完全一致）。這樣做是因為抽卡池原本用的是 `main.ts` 自己的 `availableTopics`（只算 `TOPICS` 清單裡、且單字/句子/短文都 published 的主題），如果只在 `memoryMatchStandalone.ts` 裡重寫一份簡化版的抽卡邏輯，兩邊的主題清單以後有機會對不齊（例如 content 端先建好某個主題的 vocab 但還沒把它加進 `TOPICS`）——搬成共用函式從根本上排除這個風險，比較費工但比較安全。`main.ts` 原本的本地 `TOPICS`／`TopicConfig`／`TopicContent`／`loadTopicContent()` 全部改成從 `./content` import，用法完全沒變。
- **`app/src/games/gameIcons.ts`**（新檔）：`COIN_ICON`／`CARD_BACK_ICON`（連同共用的 `FLAT_ICON_VIEWBOX`）從 `main.ts` 搬出來，`main.ts`（遊戲室清單／確認彈窗還是要用代幣圖示）跟 `memoryMatchStandalone.ts`（再玩一次按鈕、卡背）都 import 同一份，避免兩邊各複製一份 SVG 字串、以後要改圖示只改得到其中一邊。
- **`main.ts` 的 `renderMemoryMatch()`**：改寫成只剩標題／返回按鈕（留在 parent 層級，不用透過訊息溝通）＋掛載 `<iframe class="game-iframe" src="games/memory-match.html">`。新增 `handleGameBridgeMessage()` 處理四種來訊：`ready` 拿掉 loading 的 `game-iframe--loading` class、`exitToRoom` 呼叫既有的 `goToGameRoom()`、`requestReplay` 呼叫 `spendTokens()`，成功回 `replayApproved`、失敗維持既有的鼓勵文案 `window.alert()` 並回 `replayDenied` 再導回遊戲室、`complete` 這次不掛任何邏輯。這個監聽器刻意**只掛一次**（`window.addEventListener("message", handleGameBridgeMessage)` 在模組載入時呼叫一次，不隨每次進出遊戲室畫面重新註冊/移除）——因為瀏覽器對同一個具名函式參照重複呼叫 `addEventListener`本來就是 no-op，比 handoff 範例裡「每次進畫面掛一次、離開時記得移除」更不容易漏移除（漏移除會導致重玩一次代幣被扣兩次這種嚴重 bug），是刻意的簡化，已經在程式碼註解裡說明。
- **iframe 容器 CSS**（`style.css` 新增 `.game-iframe`／`.game-iframe--loading`）：第一版先用固定 `min-height`（桌機 820px／手機 640px）頂住畫面，不做「子頁面回報高度、父頁面動態調整」這一層（`ResizeObserver`），跟 handoff 的建議範圍一致；原本 `style.css` 裡的 `.memory-match-*` 系列規則整段搬到新的 **`app/src/games/memoryMatchStandalone.css`**，逐條規則沒有改動，只在檔案開頭額外 `@import` 主站同一份 `assets/design-tokens/design-tokens.v2-daily-play.css`（跟 `style.css` 的做法一致，維持單一色票來源），加上少數幾個 `style.css` 本地衍生色（例如 `--color-primary-700-hover`）跟共用元件樣式（`.primary-btn`／`.secondary-btn`／`.game-footer`／`.game-room-card-cost` 等）的必要複製，讓 iframe 頁面的視覺跟主站保持一致。
- **`verify-game-bridge-messages.ts`**（新檔）：沒有瀏覽器環境測不了「跨視窗訊息實際送達」，比照 `verify-unit-completion-badges.ts` 的做法直接讀原始碼字串做靜態比對，4 項檢查：① `GAME_BRIDGE_CHANNEL` 只有一份定義、雙邊都是 import；② `main.ts` 的 `requestReplay` 分支確實呼叫 `spendTokens()`，成功/失敗兩條路徑都有對應的 `postMessage`／`window.alert`／`goToGameRoom`；③ `memoryMatchStandalone.ts` 完全沒有 `spendTokens`／`getTokenBalance`／`import ... from "../gameTokens"`，確認扣款責任真的收斂回 parent，沒有殘留舊架構的直接扣款程式碼；④ 雙邊的 message 監聽器都有檢查 `event.origin === window.location.origin`。`verify-memory-match-logic.ts`（測 `MemoryMatchGame` 引擎本身）完全沒有改動、重跑全部通過，符合預期（引擎本來就沒有搬動）。
- **`scripts/build-standalone-demo.mjs`**：這支腳本只把 `dist/index.html` 引用的 main.js/main.css inline 進單一 HTML 檔，沒辦法把 iframe 的獨立 JS/CSS bundle 也一起塞進去（iframe 的 `src` 是相對路徑，單獨打開這個 HTML 檔案時旁邊沒有 `dist/games/` 資料夾可以載入）。改成在產出的 `demo-standalone.html` 裡額外注入一段 `MutationObserver`，偵測到 `.game-iframe` 元素出現時換成一段說明文字「遊戲室功能在這個單檔展示版本暫不支援，請用正式站測試」，不讓 demo 呈現空白或壞掉的 iframe；這段 patch 只存在於這支單檔展示版本產生流程，不影響 `dist/index.html` 本身（正式部署到同網域時 iframe 會正常運作）。
- **驗證**：`tsc --noEmit`、全部 `verify-*.ts`（含新的 `verify-game-bridge-messages.ts`）、`npm run build` 都通過；`npm run build` 之後確認 `dist/games/memory-match.html` 正常產生，內容正確引用相對路徑的 assets（`../assets/...`）；grep 確認 `.game-iframe` 樣式跟訊息協定字串都有進到對應的 bundle。副作用：因為 `content.ts` 現在同時被 `main.ts` 跟 `memoryMatchStandalone.ts` 兩個進入點 import，Rollup 自動把它抽成一個共用 chunk（連同體積很小的 `gameBridge.ts`，兩者一起被打包成 `gameBridge-*.js`），主要 `main-*.js` bundle 因此從約 10.27MB 降到約 9.33MB——不是刻意去做 code-splitting 優化，是這次重構的自然副作用，剛好也呼應了 handoff 背景提到的「main.ts bundle 過大」問題一部分。
- **沒辦法在沙盒裡驗證的部分（這是重構、不是加新功能，實機比對比 verify script 通過更重要，見 handoff 第 8 節）**：開局記憶倒數的秒數顯示節奏、第 2/3 關洗牌的 FLIP 位移動畫時序、5 種音效各自的觸發時機、過關訊息停留的時間、iframe 固定 `min-height` 在不同裝置寬度下夠不夠、iframe 載入時 loading 佔位切換的順暢度——這些沙盒裡沒有瀏覽器可以實際跑一輪確認，麻煩用正式站（部署到 `78vince.github.io/english-for-kids/` 之後，iframe 才會是同源）或至少 `npm run dev` 本機開發伺服器實際玩一輪「搬家前」（可以用 git 切到上一個 commit 對照）跟「搬家後」互相比對，確認代幣有沒有正確被扣、代幣不夠時有沒有正確彈出鼓勵文案並導回遊戲室。`demo-standalone.html` 這次沒辦法用來測翻牌配對本身（見上面 build-standalone-demo.mjs 的說明），只能測其餘功能。
- 沒有動到遊戲的規則/內容（`MemoryMatchGame` 引擎、`content/games/games.json`），也沒有執行任何 git 操作；handoff 第 9 節提到的「時機點」考量（是否該等第二款遊戲一起做）本來就交給執行端判斷，這次選擇直接照 handoff 執行，因為 handoff 已經把完整方案準備好、範圍界定清楚，沒有理由延後。

### 9.129 使用者提議翻牌配對改用 iframe 架構，撰寫遷移 handoff（2026-09-29）

使用者問「目前的遊戲是直接寫在網頁中嗎？」，回答確認：全部題型（含翻牌配對）都是純前端 TypeScript class，沒有 iframe、沒有後端。接著問「把遊戲改成 iframe 嵌入，會不會比較靈活，遊戲類型可以更多元？」——評估兩種方向：(A) 嵌外部現成遊戲網站——不建議，廣告/內容不受控/隨時可能失效，且黑盒子沒辦法跟代幣經濟機制串接；(B) 自己做的遊戲改成獨立打包＋iframe＋postMessage 橋接——技術上合理，但跟「遊戲種類變多」沒有直接關係，真正好處是各遊戲可以獨立技術選型、減輕 `main.ts` 主 bundle 過大的問題。使用者選方案 B，並精準指出關鍵設計重點：「遊戲中不需要轉代幣，但如果需要再玩一次扣代幣，可能就會需要橋接」。

寫好完整遷移計畫交給 App 端執行：見 `docs/handoff-prompt-memory-match-iframe-migration.md`。**這是架構重構，不是新功能**——現在已經上線、經過 9.123～9.128 六輪回饋打磨過的翻牌配對，玩法/規則/手感完全不變，只改「哪段程式碼跑在哪裡」。內容涵蓋：
- 新增 `app/src/gameBridge.ts` 共用訊息型別（`ready`／`requestReplay`／`exitToRoom`／`complete` 四種「遊戲→主站」訊息，`replayApproved`／`replayDenied` 兩種回覆），雙邊都 import 同一份型別避免字串打錯字漏接。
- `main.ts` 的 `renderMemoryMatch()` 改成顯示 `<iframe>`，遊戲本身的 DOM 渲染/動畫/音效整段搬進新的 `app/src/games/memoryMatchStandalone.ts`（新的 Vite 獨立進入點 `app/games/memory-match.html`，比照 `voice-lab.html` 的既有模式）；`MemoryMatchGame` 引擎完全不動。
- 「再玩一次」的扣代幣責任完全收斂回主站：iframe 只能送出 `requestReplay` 請求，不能自己呼叫 `spendTokens()`——這是這次重構最容易漏改、也是新驗證腳本 `verify-game-bridge-messages.ts` 要特別守住的地方。
- 特別提醒：這是重構不是新功能，每個既有的時間常數/動畫時序/音效觸發點都要原封不動搬過去，實機比對「搬家前後」手感有沒有落差比 verify script 通過更重要；也提醒了一個時機點問題——如果近期沒有規劃做第二款新遊戲，也可以考慮等真的要做第二款時再一起遷移，避免現在做一次、以後又要因應新需求調整橋接協定。

### 9.128 App 端執行：放慢卡片交換動畫並在蓋牌前多停留一下（2026-09-28）

使用者玩過 9.127 的三關版本後回饋：第 2、3 關卡片交換位置的動畫太快，希望換完位置後能多看一下再蓋牌開始遊戲。

- `app/src/games/memoryMatchGame.ts`：原本 `SHUFFLE_ANIMATION_MS = 700`（單一個「交換後多久蓋牌」的數字，動畫播放時長跟這個數字綁在一起）拆成兩段：`SHUFFLE_MOVE_DURATION_MS = 900`（卡片滑動到新位置的動畫本身播放時長，從 renderer 原本內嵌寫死的 `0.5s` 拉長並改成 export 常數，供 renderer import 使用，確保引擎的計時跟畫面的 CSS transition 時長永遠對得上）、`SHUFFLE_SETTLE_PAUSE_MS = 700`（動畫播完之後，額外停留讓使用者多看清楚新位置的時間）；`SHUFFLE_ANIMATION_MS`（從觸發交換到真正蓋牌開始遊戲的總延遲）改成兩者相加＝1600ms，比原本的 700ms 慢了一倍多。
- `renderMemoryMatch()`（`app/src/main.ts`）的 FLIP 動畫改成 import `SHUFFLE_MOVE_DURATION_MS` 動態組字串（`transform ${SHUFFLE_MOVE_DURATION_MS}ms ease`），取代原本寫死的 `"transform 0.5s ease"`，避免以後兩邊數字各自改動、又對不上的問題。
- 驗證：`tsc --noEmit`、全部 `verify-*.ts`、`npm run build` 都通過（`verify-memory-match-logic.ts` 的建構子測試參數本來就是獨立傳入極短的測試用時長，不受這次正式時長調整影響，重跑確認沒有回歸）；grep 打包後的 `dist/assets/main-*.js` 確認 `900`／`ms ease` 都有進到最終產出。
- 沒辦法在沙盒裡驗證的部分：動畫放慢後、蓋牌前多停留的實際節奏是否剛好，麻煩用 `demo-standalone.html` 或實機玩第 2、3 關看一次。

### 9.127 App 端執行：翻牌配對新增倒數數字＋三關關卡機制＋再玩一次扣代幣提示（2026-09-28）

使用者再回饋 3 點，其中「三關的關卡流程」牽涉不小的架構決定（連續闖三關才算破關／每次只玩一關輪替難度／改成三個獨立關卡選項），先用 `AskUserQuestion` 確認方向，使用者選擇「連續闖三關才算破關」，照這個方向實作。

- **開局記憶倒數改成大數字顯示**：`MemoryMatchGame`（`app/src/games/memoryMatchGame.ts`）整個重寫，`reveal` 階段從原本單一個 `setTimeout` 改成每秒 tick 一次的 `setInterval`，暴露 `revealSecondsRemaining`（整數秒數）供畫面顯示；`renderMemoryMatch()` 新增 `.memory-match-countdown` 區塊，`reveal` 階段顯示倒數數字（5,4,3,2,1），`shuffling` 階段（見下）改顯示 🔀。
- **三關關卡機制**：`MemoryMatchGame` 新增 `level`（1~3）與擴充後的 `phase`（新增 `"shuffling"`／`"levelComplete"`），三關共用同一組 3 對配對內容，差別在倒數結束後的行為：
  - 第 1 關：倒數結束直接進入 `"playing"`（原本行為）。
  - 第 2 關：倒數結束後進入 `"shuffling"`，隨機挑 2 張卡片互換位置（`shuffleCardCountForLevel(2) === 2`），換完才進 `"playing"`。
  - 第 3 關：同上但隨機挑 4 張卡片（兩兩一組、共兩次互換，`shuffleCardCountForLevel(3) === 4`），難度更高。
  過關（該關全部配對完成）觸發 `onLevelComplete(level)`，`phase` 短暫進入 `"levelComplete"`（畫面顯示「過關！準備進入下一關」），`LEVEL_COMPLETE_PAUSE_MS`（正式時長 1400ms）之後自動 `level += 1`、重新洗牌、重新倒數；只有第 3 關過關才是真正的 `phase = "complete"`、觸發 `onComplete()`，`moveCount` 累計整個三關不分關重置。
  - **交換位置的移動動畫**：新增 `onShuffleStart(swapPairs)` 事件，在陣列真正互換「之前」觸發，讓 `renderMemoryMatch()` 先用 `getBoundingClientRect()` 記錄下涉及卡片目前的畫面座標；接著引擎才真正互換 `cards` 陣列順序並觸發 `onChange()`，`renderMemoryMatch()` 新增 `syncGridOrder()` 把 DOM 節點按新順序重新 `appendChild`（此舉會讓卡片瞬間跳到新位置），再算出新舊座標的位移量、用標準的 FLIP 手法（先瞬間套用位移的 `transform`、下一個 frame 才打開 `transition` 把 `transform` 歸零）讓卡片「滑」到新位置，而不是瞬間跳過去。這一段跟卡片翻面動畫用的是同一種「保留 DOM 節點、只在 class／style 上做文章」的原則（見 9.124 的翻牌動畫根因說明），沒有引入額外動畫函式庫。
- **「再玩一次」按鈕加上扣代幣提示**：`playAgainBtn` 文字從單純「再玩一次」改成「再玩一次（🪙-N）」（N 是 `content/games/games.json` 裡 `memory_match` 的 `cost`，這裡的 🪙 其實是 `COIN_ICON` 單色圖示，套用既有的 `.game-room-card-cost` 對齊樣式），讓使用者一眼就知道點下去會扣代幣，不會誤以為是免費重玩——扣代幣的實際行為維持 9.126 就定案的「原地重開局、一樣要扣代幣」不變，這次只是把「會扣代幣」這件事講清楚。
- **驗證**：`verify-memory-match-logic.ts` 整份改寫（3 對配對＝6 張卡片，跟目前正式版一致），建構子新增第 3／4 個參數（`shuffleAnimationMs`／`levelCompletePauseMs`）方便測試指定極短時長；新增 `waitForPhase()`／`matchAllPairs()` 兩個測試輔助函式，涵蓋：開局第 1 關＋`shuffleCardCountForLevel()` 三關數字正確、第 1 關 reveal 結束不經過 shuffling 直接 playing、playing 階段配對成功/失敗（含 onFlip/onMatch/onMismatch/onCoverBack 觸發次數）、過第 1 關觸發 `onLevelComplete(1)` 並自動進入第 2 關重新洗牌、第 2 關倒數結束後正確經過 shuffling 且 `onShuffleStart` 帶對的互換組數、連續破完三關才 `isComplete`／`onComplete` 只在最後一關觸發一次。全部 `verify-*.ts`、`tsc --noEmit`、`npm run build` 都通過；grep 打包後的 `dist/assets/main-*.css` 確認 `memory-match-countdown{...}` 進到最終產出，`dist/assets/main-*.js` grep「再玩一次」「過關！準備進入第」都有出現，確認新流程真的進了 bundle。
- 沒辦法在沙盒裡驗證的部分：倒數數字視覺呈現、卡片交換位置的 FLIP 移動動畫實際播放起來夠不夠順、三關難度遞增的實際遊玩手感，麻煩用 `demo-standalone.html` 或實機玩一輪確認。

### 9.126 App 端執行：翻牌配對字級／再玩一次流程／3x2 版面（2026-09-28）

使用者玩過 9.125 的 4 欄 12 張版本後，再回饋 4 點。其中「再玩一次」的行為牽涉到 9.122／9.123 就明確定案的「玩遊戲室的遊戲要扣代幣，不能免費重玩」設計，先用 `AskUserQuestion` 跟使用者確認方向（選項：免費重玩／原地重開但一樣扣代幣／維持現況導回遊戲室），使用者選擇「直接重開一局，但一樣要扣代幣」，照這個方向實作。

- **卡牌字級放大**：`.memory-match-card-face`（`app/src/style.css`）字級從 `var(--text-caption)` 改成 `var(--text-body-lg)`，`padding` 也從 `var(--space-1)` 加大到 `var(--space-2)`——這次卡片數變少（見下）本來就有更多空間，字級也一起放大。
- **「再玩一次」不再把使用者踢出遊戲畫面**：`renderMemoryMatch()`（`app/src/main.ts`）裡 `playAgainBtn` 的點擊事件，原本是呼叫 `goToGameRoom()`（導回遊戲室清單，使用者要重新點「開始遊戲」才能再玩一次）；改成直接在原地處理——找到 `GAMES` 裡 `id === "memory_match"` 的設定拿到 `cost`，呼叫 `spendTokens(activeProfile!.id, cost)`：扣款成功就直接呼叫 `goToMemoryMatch()`（重新抽一組新配對、留在同一個翻牌配對畫面，不會先閃回遊戲室清單再進來）；扣款失敗（代幣不夠）才彈出鼓勵文案的 `window.alert()` 並導回遊戲室（沒代幣本來就沒辦法留在這裡玩，導回遊戲室讓使用者看到目前餘額跟怎麼賺代幣）。維持「重玩要扣代幣，不是免費重玩」這個 9.122 就定案的設計，只是把「扣代幣」跟「重新開局」兩件事的體驗合併成一次點擊，不用先跳走再跳回來。
- **卡片數與版面再縮減**：`createMemoryMatchGame()` 抽牌數從 6 組（12 張）改成 `shuffled.slice(0, 3)`，3 組配對＝6 張卡片；`.memory-match-grid` 的 `grid-template-columns` 從 `repeat(4, 1fr)` 改成 `repeat(3, 1fr)`，固定 3 欄 x 2 行剛好排滿 6 張卡片，卡片依然是橫式（`aspect-ratio: 4/3`）、寬度撐滿欄位。
- **驗證**：`tsc --noEmit`、全部 `verify-*.ts`、`npm run build` 都通過（`verify-memory-match-logic.ts` 測的是 `MemoryMatchGame` 這個不依賴卡片數量的遊戲邏輯類別本身，這次沒有改動、重跑確認沒有回歸）；grep 打包後的 `dist/assets/main-*.css` 確認 `memory-match-grid{...repeat(3,1fr)...}` 與新字級 `font-size:var(--text-body-lg)` 真的進到最終產出，`dist/assets/main-*.js` grep「代幣好像不太夠喔」出現兩次（原本開始遊戲確認彈窗一次＋這次新增的再玩一次流程一次），確認新的扣款失敗處理路徑真的有進到 bundle。
- 沒辦法在沙盒裡驗證的部分：3 欄 2 行版面搭配放大字級實際看起來的比例、「再玩一次」直接原地重開局的操作手感，麻煩用 `demo-standalone.html` 或實機看一次。

### 9.125 App 端執行：翻牌配對版面調整——4 欄 3 行 12 張、橫式卡片（2026-09-28）

使用者玩過 9.124 的 20 張/5 欄版本後回饋版面太滿，改成固定版面。

- `createMemoryMatchGame()`（`app/src/main.ts`）抽牌數從 10 組（20 張）改回 6 組（12 張）。
- `.memory-match-grid`（`app/src/style.css`）拿掉原本手機 3 欄／平板 4 欄／桌機 5 欄的響應式斷點，改成固定 `grid-template-columns: repeat(4, 1fr)`，4 欄 x 3 行剛好排滿 12 張卡片，所有螢幕寬度都一致。
- `.memory-match-card` 的 `aspect-ratio` 從直式 `3 / 4` 改成橫式 `4 / 3`，並拿掉先前限制卡片大小的 `max-width: 120px`，改成 `width: 100%` 讓卡片寬度直接撐滿所在欄位——4 欄版面下每張卡片可以放得比原本大。
- 驗證：`tsc --noEmit`、全部 `verify-*.ts`、`npm run build` 都通過（這次沒有動到遊戲邏輯，`verify-memory-match-logic.ts` 維持 9.124 版本原封不動、重跑確認沒有回歸）；grep 打包後的 `dist/assets/main-*.css` 確認 `memory-match-grid{...repeat(4,1fr)...}` 真的進到最終產出。
- 沒辦法在沙盒裡驗證的部分：橫式卡片＋4 欄版面實際看起來的比例是否舒適，麻煩用 `demo-standalone.html` 或實機看一次。

### 9.124 App 端執行：遊戲室／翻牌配對五項優化回饋（2026-09-28）

使用者實際玩過 9.123 打樣版本後回饋 5 點，針對代幣圖示、翻牌配對的記憶流程、卡片數量/版面、卡背圖示、翻牌動畫、音效五個方向逐一處理，沒有動到 9.123 已經定案的架構（遊戲代幣獨立於學習積分、只做翻牌配對一款、消費/賺取數字不變）。

- **代幣符號改用單色 icon**：`main.ts` 新增 `COIN_ICON()`（跟既有 `EYE_OPEN_ICON`／`TURTLE_ICON` 同一套 `viewBox="0 0 24 24" stroke="currentColor"` 扁平線條風格），取代 `.game-tokens-hero`、每張遊戲卡片的代幣消費文字、確認彈窗文案裡的 🪙 emoji 共 3 處；確認彈窗文案原本用 `.textContent` 賦值，改用 `.innerHTML` 才能塞進 inline SVG。刻意只換「代幣符號」，遊戲清單卡片本身的 🃏（來自 `content/games/games.json` 的 `icon_placeholder`，屬於遊戲內容資料）沒有動。
- **開局記憶流程**：`app/src/games/memoryMatchGame.ts` 加上 `phase: "reveal" | "playing" | "complete"` 狀態機。建構子先把全部卡片設成翻開（`isFlipped: true`）、進入 `"reveal"`，`REVEAL_DURATION_MS`（5000ms，先用一個感覺合理的預設值上線，之後看真人試玩回饋再調）後自動整批蓋牌、切到 `"playing"` 並觸發新的 `onCoverBack` 事件；`"reveal"` 期間 `flip()` 直接無視、`"playing"` 期間才是原本的翻兩張判定邏輯。這個階段轉換完全在 game 物件內部用 `setTimeout` 自動處理，`main.ts` 不用額外寫計時器。
- **卡片數量與版面**：`createMemoryMatchGame()` 從隨機抽 6 組配對改成抽 10 組（20 張卡片）。`style.css` 的 `.memory-match-grid` 改成手機 3 欄、≥481px 4 欄、≥641px（桌機）5 欄，每張卡片加 `max-width: 120px` 讓卡片本身縮小、`grid` 本身用一般的 `repeat(N, 1fr)` 讓瀏覽器依斷點自動換行排列，不用 JS 手動算列數。
- **卡背圖示**：新增 `CARD_BACK_ICON()`（4 個尖角向外的星芒線條圖案，同樣是單色 SVG），取代原本卡背用的 🃏 emoji；`.memory-match-card-face--back` 的樣式從「針對 emoji 調的 28px 字級」改成「針對 inline svg 寬高 60% 置中」。
- **翻牌動畫修正（本次回饋裡唯一的 bug 修復，其餘 4 點都是新增/調整功能）**：找到根本原因——`createMemoryMatchGame()`／`renderMemoryMatch()` 舊版把 `game.onChange` 直接指到全站共用的 `render()`，而 `render()` 每次呼叫都會整個清空重建 `#app` 底下的 DOM（這件事在稍早「單字總覽練習模式」那次功能就踩過一次同樣的坑，見 9.116/9.117）。卡片一翻動就整批 DOM 節點重新 new 出來、直接生成在「已經是最終狀態」的樣子，CSS `transition: transform 0.4s ease` 完全沒有「翻轉前」的節點可以拿來做動畫插值，所以看起來像是瞬間切換、沒有動畫。修法：重寫 `renderMemoryMatch()`，改成拿一個 `Map<string, HTMLButtonElement>` 記住每張卡片對應的既有 DOM 節點，`game.onChange` 觸發時只呼叫 `syncCardButton()`（只改 `className`／`disabled`）跟 `syncFooter()`（只重建底部這一小塊），不再呼叫全站的 `render()`——卡片按鈕節點本身從頭到尾是同一個 DOM 元素，CSS `rotateY()` 轉場現在有正確的起訖狀態可以播放。
- **五種音效**：新增 `card-flip.wav`（翻牌，短促上揚音）／`card-cover.wav`（蓋牌，柔和下降音）兩個新合成音檔，比照既有 `correct.wav` 等音效的產生方式（`wave`／`struct`／`math` 標準函式庫合成，不是真人錄音）；`sound.ts` 新增 `playCardFlipSound()`／`playCardCoverSound()`。`memoryMatchGame.ts` 新增 `onFlip`（使用者主動翻牌時觸發，開局記憶階段自動翻開不算）／`onCoverBack`（蓋牌時觸發，開局結束整批蓋牌、配對失敗恢復蓋牌都算）／`onMatch`／`onMismatch` 四個事件掛勾，`renderMemoryMatch()` 分別接上翻牌音、蓋牌音，並重用既有的 `playCorrectSound()`／`playWrongSound()`／`playRoundCompleteSound()` 當作「答對／答錯／過關」音效（這三個音效全站其他題型本來就在用，維持音效辨識度的一致性，沒有另外做新音檔）。
- **驗證**：`verify-memory-match-logic.ts` 整份改寫，改用建構子第二參數（很短的測試用 `revealDurationMs`）避免每次測試真的等 5 秒，涵蓋新的 5 個情境：建構子後處於 `reveal` 階段且全部翻開、`reveal` 階段 `flip()` 無視＋時間到自動蓋牌並觸發 `onCoverBack`、`playing` 階段配對成功且 `onFlip`/`onMatch` 正確觸發次數、配對失敗觸發 `onMismatch` 並延遲恢復觸發 `onCoverBack`＋判定期間第三次 `flip()` 忽略、全部配對完成 `onComplete()` 剛好觸發一次。`verify-game-tokens-logic.ts` 沒有改動（跟這次改的遊戲邏輯無關，重跑確認沒有回歸）。全部 `verify-*.ts`、`tsc --noEmit`、`npm run build` 都通過；有 grep 打包後的 `dist/assets/main-*.css` 確認 `memory-match-grid`／`game-tokens-value` 等新樣式進到最終產出，`dist/assets/main-*.js` 確認新音效是用 `data:audio/wav;base64` inline 進去（跟既有音效同一套機制，不是額外的網路請求），SVG 圖示（例如 `<circle cx="12" cy="12" r="9"/>`）也確認有進到 bundle。
- **沒辦法在沙盒裡驗證的部分**：翻牌動畫實際播放起來的手感（理論上已修正根因，但沒有瀏覽器可以真的看動畫跑起來）、5 欄版面在不同裝置寬度下換行是否美觀、5 個音效實際播放的音量平衡與辨識度，麻煩用 `demo-standalone.html` 或實機測試確認。

### 9.123 App 端執行：「遊戲室」入口＋遊戲代幣消費機制（翻牌配對打樣）（2026-09-28）

依 `docs/handoff-prompt-game-room-token-economy.md` 執行，對應 9.122 的請求，只做翻牌配對這一款打樣，沒有自行延伸擴充其他遊戲。

- **型別與內容讀取**：`app/src/types.ts` 新增 `GameConfig` 介面（對應 `content/schema/game.schema.json`），`app/src/content.ts` 比照 `badges.json`／`changelog.json` 的既有匯入方式，新增 `export const GAMES: GameConfig[]` 讀取 `content/games/games.json`。
- **`app/src/gameTokens.ts`**（新檔）：per-profile localStorage 錢包，跟 `points.ts` 的「學習積分」完全獨立（學習積分維持現狀不動，繼續當即時算出來的成就展示數字）。`getTokenBalance()`／`earnTokens()`／`spendTokens()` 三個核心函式，`spendTokens()` 餘額不夠時回傳 `false` 且不扣款、不會出現負數。`TOKENS_EARNED_PER_ROUND = 5`。
- **`finalizeRoundCompletion()`**（`app/src/main.ts`，所有題型共同結算點）掛上 `earnTokens(profileId, TOKENS_EARNED_PER_ROUND)`，每完成一輪任何題型（不限主題、不限題型、不看正確率）就賺 5 個代幣。刻意的設計決定：玩遊戲室的遊戲本身不會再賺代幣，代幣只從「認真學習」這個方向賺，避免變成「玩遊戲刷代幣、代幣又拿去玩更多遊戲」的沒意義迴圈。
- **導覽列新增「遊戲室」分頁**：`NavKey`／`Screen` 型別、`NAV_ICONS.gameRoom`（骰子圖案，單色線條風格）、`NAV_ITEMS`（插在「收藏清單」跟「個人檔案」之間）、`renderScreen()` 路由分派，都比照既有其他分頁的接法。
- **`renderGameRoom()`**：`.game-tokens-hero` 顯示目前代幣餘額（金幣色系 `--color-accent-yellow`，刻意跟個人檔案頁「學習積分」的品牌深藍區隔開，避免使用者把兩個數字看成同一件事），下面列出 `GAMES`（依 `order` 排序、篩掉 `status === "disabled"`）每一款的卡片：`active` 且代幣足夠顯示「開始遊戲」；`coming_soon` 顯示「即將推出」且禁用；代幣不夠顯示「再賺 N 個代幣就可以玩囉！」（鼓勵文案，全站沒有出現「餘額不足」「點數不夠」這類字眼），按鈕也用溫和中性色（`--color-tier-locked-bg`）而不是警示紅色。
- **「開始遊戲」確認彈窗**（`appendGameRoomConfirmModal()`）：沿用 `.modal-overlay`／`.modal-card` 既有視覺外觀，但用獨立的 `gameRoomConfirmGame` 狀態＋專屬的 `closeGameRoomConfirm()`，不跟個人檔案頁的 `profileDetailModal`／`closeProfileDetailModal()` 共用，避免語意混淆。確認後才真的呼叫 `spendTokens()`，扣款成功才 `goToMemoryMatch()`；`spendTokens()` 回傳 `false`（理論上不該發生，因為按鈕在餘額不夠時已經是 disabled 狀態）時一樣用鼓勵文案的 `window.alert()` 處理，不假設扣款一定成功。
- **`app/src/games/memoryMatchGame.ts`**（新檔）：`MemoryMatchGame` class，不依賴 DOM，跟 `matchingGame.ts`／`orderingGame.ts` 同一套模式。建構子把傳入的 `{en, zh}[]` 配對拆成兩倍卡片數、洗牌；`flip()` 一次翻兩張，配對成功留在檯面（`isMatched`），失敗延遲 800ms 後兩張都翻回去；判定期間（已翻開兩張還沒判定完成）的第三次 `flip()` 呼叫會被忽略。`renderMemoryMatch()`（`main.ts`）不綁定任何 `currentTopic`，改由 `createMemoryMatchGame()` 從 `availableTopics` 攤平所有主題的 published vocab 隨機抽 6 組配對開新局；畫面用 `.game-header--with-back`（沿用 `renderMenu()` 的既有寫法）搭配「← 返回遊戲室」按鈕，而不是 `stageHeader()`（那是給題型畫面在慢速朗讀＋返回題型選單用的，翻牌配對不播放語音、也不屬於任何主題，用 `stageHeader()` 不合適）。完成畫面比照其餘題型的 `.game-footer`／`.done` 樣式，純鼓勵文案「太厲害了，全部配對成功！」，「再玩一次」導回遊戲室重新走一次扣代幣流程（不是免費重玩），完全不呼叫 `finalizeRoundCompletion()`——這個遊戲不記錄進度、不影響任何徽章或積分。
- **CSS**：新增 `.game-tokens-hero`／`.game-room-list`／`.game-room-card`／`.game-room-card-cost`／`.game-room-play-btn`／`.game-room-play-btn--locked`（溫和中性色，不用警示紅）、`.memory-match-grid`（手機 3 欄、桌機 4 欄）／`.memory-match-card`（CSS `rotateY()` 3D 翻牌動畫，沒有另外引入動畫函式庫）。
- **驗證**：新增 `verify-game-tokens-logic.ts`（5 個測試：初始餘額 0、`earnTokens()` 累加、`spendTokens()` 足夠/不足兩種情況、跨 profile 互相獨立、`finalizeRoundCompletion()` 原始碼靜態比對確認真的接上 `earnTokens()`）與 `verify-memory-match-logic.ts`（4 個測試：建構子正確拆卡＋pairId 恰好各兩張、配對成功兩張變 `isMatched`、配對失敗延遲後恢復且判定期間第三次 `flip()` 被忽略、全部配對完成觸發 `onComplete()`）。另外因為 `NavKey` 型別多了 `"gameRoom"`，既有 `verify-about-page.ts` 裡一段對 `NavKey` 型別字串的精確靜態比對斷言需要同步更新（純粹是既有測試斷言字串要跟上新型別定義，不是行為變更）。全部 verify 腳本、`tsc --noEmit`、`npm run build` 都通過，grep 打包後的 `dist/assets/main-*.js`／`*.css` 確認「遊戲室」「翻牌配對」`game-room-list`／`memory-match-grid`／`gameTokens` 都真的進到最終產出。
- 這次刻意不做（照 handoff 明確列出的範圍界線，沒有自行延伸）：只做翻牌配對一款、不做代幣與學習積分互轉、不做遊戲室排行榜/分享、沒有調整 `TOKENS_EARNED_PER_ROUND`（5）或翻牌配對消費（20，來自 `content/games/games.json`）這兩個數字的手感。
- 沒有動到會話練習（voiceLab／conversationGame）相關檔案，也沒有執行任何 git 操作；`content/games/games.json`／`content/schema/game.schema.json` 已經是 content 端事先建立好、已追蹤進 git 的檔案，這次沒有修改它們。
- **沒辦法在沙盒裡驗證的部分**：翻牌動畫的實際視覺效果（3D `rotateY()` 翻轉手感）、手機版格線排列是否真的舒適、確認彈窗跟遊戲代幣顯示的實際配色觀感，麻煩用 `demo-standalone.html` 或實機看一次。

### 9.122 使用者提議「遊戲室」功能，評估可行性並撰寫 handoff（先做 1 款打樣）（2026-09-28）

使用者提議：選單加入「遊戲室」，用學習積分消費玩裡面的小遊戲，遊戲清單可由管理者擴充/移除，每款遊戲消費點數不同。評估後發現關鍵問題：`app/src/points.ts` 的「學習積分」是即時算出來的展示數字（沒有存檔餘額），沒辦法直接拿來扣款消費，而且它是「只會往上加的成就榮譽數字」，被扣減觀感上容易變成負面訊號，跟專案一貫「不用負面文字強調表現不好」的調性衝突。

跟使用者確認後決定：另外做一套獨立的「遊戲代幣」（跟學習積分脫鉤，學習積分維持現狀不動），且第一階段**只做 1 款遊戲打樣**（翻牌配對／Memory Match）驗證整套「賺代幣→花代幣→玩遊戲」機制，之後再決定要不要擴充；代幣不夠時全部遊戲都要代幣才能玩，用鼓勵文案處理（不做「保留免費遊戲」的方向）。

已直接處理（content 端）：新增 `content/games/games.json`（遊戲清單，目前只有 `memory_match` 一筆，20 代幣）跟 `content/schema/game.schema.json`。

寫好 handoff 交給 App 端執行：見 `docs/handoff-prompt-game-room-token-economy.md`，內容涵蓋：
- 新增 `app/src/gameTokens.ts`（per-profile localStorage 錢包，`earnTokens()`／`spendTokens()`，跟 `points.ts` 完全獨立）。
- 在 `finalizeRoundCompletion()`（所有題型共同結算點）掛上賺代幣事件，每完成一輪固定賺 5 代幣，不論正確率——刻意簡化，先驗證機制再考慮加權。
- 新增導覽列「遊戲室」分頁、`renderGameRoom()` 清單畫面（代幣不夠時顯示「再賺 N 個代幣就可以玩囉！」而非「餘額不足」）、`app/src/games/memoryMatchGame.ts`（不依賴 DOM 的翻牌配對遊戲引擎，可獨立驗證）。
- 明確列出「這次刻意不做的事」：只做這一款遊戲、不做代幣與積分互轉、不做排行榜/分享、不要自行調整賺/花的數字——避免執行時自行延伸擴大範圍。

### 9.121 App 端執行：新增「語音設定」——讓使用者自己選這台裝置要用哪個語音（2026-09-27）

依 `docs/handoff-prompt-voice-selection-setting.md` 執行，對應 9.120 的請求。

- **`app/src/speech.ts` 新增裝置層級語音覆寫設定**：三把 localStorage key（`englishForKids.settings.voiceGeneral.v1`／`voiceBenny.v1`／`voiceUserReply.v1`，對應 `VoiceRole = "general" | "benny" | "userReply"`），比照既有 `SLOW_MODE_STORAGE_KEY` 的寫法，是「裝置設定」不分使用者 profile。新增 `getVoiceOverride(role)`／`setVoiceOverride(role, name|null)`（傳 `null` 對應 `localStorage.removeItem`，清除設定改回自動偵測）／`resolveVoiceOverride(role)`（內部函式，只有選過的語音在這台裝置目前的清單裡真的存在才回傳，找不到就回傳 `undefined` 讓呼叫端 fallback 回自動偵測，不會卡在「選了但沒聲音」）三個核心函式。
- `pickPreferredVoice()`／`pickBennyVoice()`／`pickUserDialogueVoice()` 三個函式開頭都先呼叫對應角色的 `resolveVoiceOverride(...)`，`if (override) return override;`——確認手動選擇的優先權真的蓋過原本的自動偵測邏輯，不是加在後面永遠不會被走到。
- 新增兩個給設定畫面用的輔助 export：`getAvailableEnglishVoices()`（只列英語語音、排除卡通/老舊特效聲音，沿用檔案既有的 `KNOWN_FEMALE/MALE_VOICE_NAME_HINTS`／`isNoveltyVoice()` 判斷規則，推薦的排前面）、`previewVoiceByName(voiceName, sampleText)`（試聽按鈕用，直接指定語音唸一句範例句，不經過三個角色的自動判斷邏輯）。
- **`app/src/main.ts`**：`renderProfileDetail()`（個人檔案頁）帳號設定按鈕跟危險操作（重置進度／刪除使用者）之間新增獨立的「🔊 語音設定」卡片區塊（`renderVoiceSettingsSection()`），三個角色各一個下拉選單（含「自動（系統推薦）」選項）＋試聽按鈕，文案明確寫「這是這台裝置的設定，不會跟著帳號走，換裝置要重新選一次」；同時把原本跟帳號設定按鈕共用同一個 `.profile-settings-actions` 容器的危險操作按鈕拆成獨立的 `dangerActions` 容器，讓語音設定區塊能插在兩者中間。另外掛上 `window.speechSynthesis.addEventListener("voiceschanged", ...)`，只在使用者停留在 `profileDetail` 畫面時才 `render()`，處理手機瀏覽器語音清單非同步載入、剛進頁面時清單是空的問題。
- **CSS**：新增 `.voice-settings-section`（卡片留白，比照個人檔案頁其餘區塊間距）、`.voice-settings-hint`（淺色說明文字，仿 `.about-text`）、`.voice-settings-row`（label + select + 試聽按鈕橫向排列，640px 斷點改直排，沿用專案既有的窄螢幕直排寫法）、`.voice-settings-select`、`.voice-settings-preview-btn`（圓角按鈕樣式仿 `.secondary-btn`）。
- **驗證**（新增 `app/scripts/verify-voice-selection-setting.ts`）：因為這個功能牽涉瀏覽器專屬的 `speechSynthesis` API，沒辦法在無喇叭的沙盒裡真的出聲驗證，比照 `verify-vocab-overview-english-toggle.ts` 的靜態原始碼比對手法，寫了 6 個測試：(1) 四個新 export 都存在，`setVoiceOverride(role, null)` 正確對應 `localStorage.removeItem`；(2) 三個挑選函式都在函式最前面就呼叫 `resolveVoiceOverride(...)` 並立刻 `if (override) return override;`，確認優先權真的排在自動偵測之前而不是永遠不會被走到的死碼；(3) `renderProfileDetail()` 有實際呼叫並掛上語音設定區塊，三個角色跟裝置設定說明文字都涵蓋到；(4) 三把 localStorage key 字串都存在且互不相同；(5) `voiceschanged` 監聽有正確掛上且只在 `profileDetail` 畫面才重繪；(6) CSS 涵蓋所有需要的樣式類別。全部通過，其餘既有 `verify-*.ts` 也全部重跑一次都通過。
- `npx tsc --noEmit`、`npm run build` 都通過；有 grep 打包後的 `dist/assets/main-*.js`／`*.css` 確認 `voice-settings-section`／三把 key 字串／「語音設定」「這是這台裝置的設定」都真的進到最終產出。
- **環境小插曲**：這次 build 一開始又遇到跟 9.109 一樣的 Rollup 原生模組 `MODULE_NOT_FOUND`（`node_modules` 裡殘留 macOS 版原生二進位，Linux 沙盒讀不到對應的 Linux 版）——`app/package.json` 本身已經沒有問題（9.109 移除的那行沒有復發），單純是這次沙盒裡的 `node_modules` 沒裝好，`rm -rf node_modules && npm install` 重裝一次就正常了，這次沒有再發現 `package.json` 本身的異常，`app/package-lock.json` 因為重裝而有版本雜湊更新，屬於正常變動。
- **重要提醒（沒辦法在沙盒裡實機驗證，麻煩之後實際測試）**：手機上打開「個人檔案」頁確認語音清單有正常列出（不是空的）；選一個語音、按試聽，確認真的用選的那個聲音唸；回主題玩字卡/例句朗讀、進 Stage E 會話練習，確認通用發音跟 Benny／使用者回答兩個角色都套用了剛剛選的設定；選單選回「自動（系統推薦）」能乾淨清除設定；換一台裝置或清瀏覽器資料，確認乾淨回到「自動」不會卡住。
- 沒有動到會話練習（voiceLab／conversationGame）相關檔案本身的邏輯，也沒有執行任何 git 操作。

### 9.120 使用者回報：手機語音跟預期不同，撰寫「語音設定」handoff（2026-09-27）

使用者手機實測回報：唸出來的英文聲音跟電腦上聽到的不一樣，問能不能讓使用者自己選語音系統。評估後確認技術上可行——`app/src/speech.ts` 的 `pickPreferredVoice()`／`pickBennyVoice()`／`pickUserDialogueVoice()` 本來就是拿 `window.speechSynthesis.getVoices()`（這台裝置本身的語音清單）自動猜測，`app/src/voiceLab.ts`（語音比較實驗室）也已經把「列出裝置語音、猜性別、試聽」這套邏輯寫好了，這次只是要把類似的功能簡化後開放給一般使用者用。跟使用者確認範圍：不只是通用發音，Stage E 會話練習的 Benny（男聲）跟使用者回答（女聲）兩個角色也要能各自手動指定。

寫好 handoff 交給 App 端執行：見 `docs/handoff-prompt-voice-selection-setting.md`，內容涵蓋：
- `speech.ts` 新增三把裝置層級 localStorage key（`voiceGeneral.v1`／`voiceBenny.v1`／`voiceUserReply.v1`，比照 `SLOW_MODE_STORAGE_KEY` 的裝置設定寫法，刻意不跟帳號綁定，因為手機跟電腦的語音清單完全不同）＋ `getVoiceOverride()`／`setVoiceOverride()`／`getAvailableEnglishVoices()`／`previewVoiceByName()` 四個新 export。
- 三個挑選函式開頭都先檢查有沒有手動覆寫，且覆寫的語音名稱要先確認在這台裝置目前的清單裡真的存在，找不到就乾淨 fallback 回原本的自動偵測邏輯。
- `main.ts` 的 `renderProfileDetail()`（個人檔案頁）新增「🔊 語音設定」區塊，三個角色各一個下拉選單＋試聽按鈕，UI 大幅簡化（不像 Voice Lab 有 tab 分類跟音調/語速滑桿），並在文案裡明確告知這是裝置設定、換裝置要重選。
- 特別提醒：這個功能沒辦法在沒有喇叭的開發沙盒裡實際聽過驗證，上線前務必實機測試手機語音清單有正常列出、試聽/套用有生效、換裝置會乾淨恢復自動模式。

### 9.119 App 端執行：單元/主題完成度徽章改為要求 Stage D + Stage E（2026-09-27）

依 `docs/handoff-prompt-unit-completion-requires-stage-e.md` 執行，對應 9.118 的請求。

- **`computeCompletedStageDTopics()` 改名為 `computeCompletedTopics()`**（`app/src/main.ts`）：判斷邏輯改成先看這個主題有沒有通過 Stage D（`getStageProgress(profileId, fileKey, "capstone") !== null`），沒通過就直接不算完成；通過的話，再用 `getConversationByTopic(fileKey)` 判斷這個主題有沒有 Stage E 內容——沒有內容就直接算完成（防呆：避免未來新增暫時性、還沒做 Stage E 的主題時卡住徽章），有內容的話就還要 `getStageProgress(profileId, fileKey, "conversation") !== null` 也成立才算完成。
- 呼叫端變數／參數全部改名為 `completedTopics`：`computeBadgeViewState()` 的第 5 個參數、`snapshotBadgeAchievements()` 內的區域變數與呼叫、成就徽章頁面 render 函式內的區域變數與呼叫，四處都改好，grep `completedStageDTopics` 全檔案已無殘留。
- `"onboarding"` case（`badge.onboarding.first_stage_d`）跟 `"unit_completion"` case（WC-01~08）都改用新的 `completedTopics` 判斷。
- 主題選單說明文字更新：Stage D 從「過關就算這個主題單元完成」改成「過關再加上 Stage E 才算這個主題單元完成」；Stage E 從「身歷其境練習生活英語」改成「完成後這個主題單元才算全部通關」。沒有 Stage E 內容的極少數過渡情境（目前全部 43 個主題都已經有 Stage E，不存在這個情境）文字沒有特別處理，邏輯層的 fallback 已經正確涵蓋，可接受。
- **驗證**（`app/scripts/verify-unit-completion-badges.ts`，改寫）：新增/調整共 12 個測試，其中最關鍵的是測試 2——只通過 Stage D、未通過 Stage E 時，`first_stage_d` 跟對應單元都應該判斷為「未完成」（這是跟舊邏輯行為相反的新規則），接著補上 Stage E 後才變成「完成」；測試 10 沿用 `unit_zero`（已拆成 greetings／pronouns，本身沒有對應 `content/conversations/unit_zero.json`）驗證「沒有 Stage E 內容的主題，Stage D 就足夠」的 fallback 情境，不需要另外造假資料；測試 3、4、9、11（既有的 unit1／unit3／unit7 完成情境）都補上對應主題的 Stage E 完成紀錄，否則會在新邏輯下變成一直卡在未完成；新增測試 12 是讀取 `main.ts` 原始碼做結構性檢查，確認改名跟呼叫點都正確、不再有 `completedStageDTopics` 字串殘留。全部 12 個測試通過，其餘既有 `verify-*.ts` 也全部重跑一次都通過。
- `npx tsc --noEmit`、`npm run build` 都通過；有 grep 打包後的 `dist/assets/main-*.js` 確認新的說明文字（「過關再加上 Stage E 才算這個主題單元完成」「完成後這個主題單元才算全部通關」）真的有進到最終產出，也確認整個 bundle 裡沒有 `completedStageDTopics` 殘留字串。
- **重要提醒（沿用 9.118 的警示，這裡再次記錄）**：徽章 `achieved` 狀態是即時計算、不是解鎖後永久保存，這次上線後，任何小孩之前只靠 Stage D 拿到的 WC 系列（單元完成）或 OB-03（初次過關）徽章，會暫時變回「未解鎖」，要補完對應主題的 Stage E 才會重新亮起來——這是預期行為，不是 bug，但上線前務必先跟小朋友說明一聲，避免他們以為徽章壞掉了。
- 沒有動到會話練習（voiceLab／conversationGame）相關檔案本身的邏輯，也沒有執行任何 git 操作。

### 9.118 使用者回報：單元/主題完成度徽章跟 Stage E 上線後不吻合，撰寫 handoff（2026-09-27）

背景：全站 43 主題的 Stage E（會話練習）已經 100% 上線，「挑戰紀錄」統計頁的 `getStageRowsForTopic()` 也已經把 Stage E 算進每個主題的完整關卡清單裡，但徽章判斷邏輯（`computeCompletedStageDTopics()`）還停留在只看 Stage D（`capstone`），完全沒接進 Stage E，造成使用者回報「目前的學習進度跟取得徽章的條件不吻合」。

排查過程：先確認影響範圍——`recordQuestionAnswered(activeProfile!.id, "conversation", ...)` 這條線（累計題數 QM 系列、連勝十題 PF-02）**已經**正確把 Stage E 的作答次數算進去了，不受影響；真正沒接上的只有 OB-03「初次過關」（`badge.onboarding.first_stage_d`）跟 WC-01~08 這一整組單元完成徽章（`unit_completion` 分類），兩者都是透過 `computeCompletedStageDTopics()` 只看 Stage D 是否通過。用 `AskUserQuestion` 跟使用者確認具體是哪種不吻合，使用者確認：**「單元/主題完成度徽章應該也要求做完 Stage E」**。

已直接處理（content 端）：`content/badges/badges.json` 裡 OB-03 跟 WC-01~08（含 WC-08 環遊字世界）的 `description`／`condition` 文字全部加上「與 Stage E 會話練習」，反映新的完成度定義。

寫好 handoff 交給 App 端執行（`app/src/main.ts` 邏輯本身不屬於我的直接編輯範圍）：見 `docs/handoff-prompt-unit-completion-requires-stage-e.md`，內容涵蓋：
- `computeCompletedStageDTopics()` 改名為 `computeCompletedTopics()`，判斷邏輯改成「Stage D 通過，且如果這個主題有 Stage E 內容，Stage E 也要通過」（用 `getConversationByTopic()` 判斷是否有 Stage E 內容，防呆處理未來可能出現的無 Stage E 過渡主題）；Stage E 的完成判斷用 `getStageProgress(profileId, fileKey, "conversation") !== null`，跟 Stage D 用同一套 `recordStageCompletion`／`finalizeRoundCompletion` 記錄機制，語意一致。
- 呼叫端變數改名（`completedStageDTopics` → `completedTopics`），OB-03、`unit_completion` 兩個 case 都改用新變數。
- 主題選單裡 Stage D／Stage E 的說明文字同步更新（Stage D 原本寫「過關就算這個主題單元完成」不再準確，需要改成提到 Stage E）。
- **特別提醒 App 端注意的副作用**：徽章 `achieved` 狀態是每次即時算出來的，不是解鎖後永久保存，所以這次調整上線後，任何已經單靠 Stage D 拿到 WC 系列或 OB-03 徽章的玩家（包含我們家已經在玩的小孩），這些徽章會暫時「收回」變成未解鎖，要補完 Stage E 才會重新亮起來——這是預期行為，但務必先跟小朋友說一聲避免誤會。

### 9.117 App 端執行：練習模式按鈕移入題型橫幅＋🐢 換成扁平單色圖示＋說明改成 hover/長按泡泡（2026-09-24）

承接 9.116 節上線後，使用者用截圖回報「🐢 慢速」按鈕的 emoji 也想換成扁平單色圖示，同時提出「練習模式」按鈕應該直接放進題型橫幅（跟「🐢 慢速」「← 返回選單」同一排），不要再獨立佔一整列工具列，說明文字也精簡改成 hover（手機長按）才彈出，不要一直佔畫面空間。直接在對話中討論定案，沒有另外寫 handoff 文件。

**🐢 → 扁平單色圖示**：新增 `TURTLE_ICON(size)`，用線條畫一隻烏龜（橢圓殼＋圓形頭＋四隻腳線條＋尾巴線條），跟 `EYE_OPEN_ICON`／`EYE_OFF_ICON` 共用同一組 `FLAT_ICON_VIEWBOX`（原本叫 `EYE_ICON_VIEWBOX`，改成更通用的名字，因為現在三種圖示都共用它）。`stageHeader()` 的慢速開關按鈕從 `textContent = "🐢 慢速"` 改成 `innerHTML = TURTLE_ICON(18) + <span>慢速</span>`。

**練習模式按鈕移入題型橫幅**：`stageHeader(title, progressText, extraActions: HTMLElement[] = [])` 新增第三個參數，`.stage-banner-actions` 裡「🐢 慢速」按鈕後面、「← 返回選單」前面會插入 `extraActions` 的內容。`renderVocabOverview()` 把原本獨立的 `.vocab-overview-toolbar`（按鈕＋長說明文字段落）整個拿掉，改成建好練習模式按鈕跟說明泡泡後，透過 `stageHeader(title, progress, [toggleBtn, buildPracticeModeInfoTooltip()])` 傳進去。按鈕本身沿用既有的 `.stage-banner .slow-speech-toggle-btn` 深色配色，不用再另外補一份白底版本（之前 9.116 節為了獨立工具列補的那份白底 CSS 這次整組移除）。

**說明文字改成 hover/長按泡泡**：新增 `buildPracticeModeInfoTooltip()`，回傳一個小「i」說明圖示（`INFO_ICON`，其實就是既有 `NAV_ICONS.about` 那顆說明圖示的同一個設計，只是換成可自訂大小的版本）搭配泡泡文字（精簡成一句：「英文例句會先模糊，點單句旁的眼睛圖示可個別顯示核對。」）。桌面滑鼠移過去（CSS `:hover`）或鍵盤 Tab 移過去（CSS `:focus-within`）就會顯示，不需要 JS；手機沒有 hover，改用 `touchstart` 計時器判斷「長按」（超過 450ms 還沒放開才顯示），短按或滑動（通常是想捲動畫面）不會誤觸跳出泡泡。泡泡開關跟 9.116 節「不呼叫 `render()`」的原則一致：長按只切換 `.practice-mode-info--open` 這個 class；點畫面其他地方要能關閉，比照徽章說明文泡泡（`activeBadgeTooltipCode`）同一種「模組層級狀態 + 一次性全域監聽器」寫法（新增 `openPracticeInfoTooltip` 狀態 + 一個全域 `touchstart` 監聽器），但刻意不呼叫 `render()`，因為開關泡泡純粹是本地 DOM class 切換，不需要整頁重繪。

**手機版排版**：把練習模式按鈕跟說明圖示塞進題型橫幅後，「單字總覽」畫面窄螢幕下 `.stage-banner-actions` 最多會有 4 個項目（慢速／練習模式／說明圖示／返回選單），比照全站功能列既有的 icon-only 做法，640px 以下用 CSS 把 `.slow-speech-toggle-btn` 裡的 `<span>` 文字藏起來，只留圖示＋縮小 padding，並讓 `.stage-banner-actions` 可以 `flex-wrap`（安全網，真的放不下就換行，不會裁切）。

`app/scripts/verify-vocab-overview-english-toggle.ts` 新增 3 個測試（第 7～9 個）：🐢 emoji 已換成 `TURTLE_ICON` 且文字包在 `<span>` 裡；`stageHeader()` 有 `extraActions` 參數且會塞進 `.stage-banner-actions`，`renderVocabOverview()` 確實把按鈕跟說明泡泡一起傳進去、舊的 `.vocab-overview-toolbar` 已經整個移除；`buildPracticeModeInfoTooltip()` 用長按（`touchstart` + 450ms 計時器）觸發而不是單純點擊，且全域關閉監聽器不呼叫 `render()`。全部 9 個測試（含 9.116 節原本的 6 個）都通過。

驗證：`npx tsc --noEmit` 乾淨無錯；全部 31 支 `verify-*.ts`（含更新的這支）重跑皆通過；`npm run build` 成功，手動 grep 打包後的 `dist/assets/main-*.js`／`*.css` 確認 `"practice-mode-info"`／`"practice-mode-info-btn"`／`"practice-mode-info-bubble"` 都有進到最終產出、且已經沒有任何 🐢 emoji 殘留；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。

**這次也是純邏輯＋CSS 改動，已用自動化測試涵蓋結構性正確性**，但幾個地方沒辦法在沙盒裡實際看到，需要使用者用 `demo-standalone.html` 確認：① 烏龜圖示手繪線條組合看起來是否夠像烏龜、大小是否恰當；② 說明泡泡在桌面滑鼠 hover、手機長按（記得要「按住不放」約 0.5 秒，不是單純點一下）的實際手感跟位置（目前泡泡固定往右下角彈出，還沒做像徽章泡泡那樣的螢幕邊界自動偏移，極窄螢幕上有小機率會貼到邊緣，如果真的裁切到麻煩回報，再仿照 `.badge-tooltip`／`.passage-word-tooltip` 的 JS 動態偏移做法補上）；③ 窄螢幕下題型橫幅 4 個項目擠在一起的排版是否好按、間距是否舒服。

### 9.116 App 端執行：「單字總覽」例句開關改版為「練習模式」（主開關＋模糊/顯示、每則例句獨立作用）（2026-09-24）

承接 9.115 節上線後，使用者實際用過提出三點回饋，直接在對話中討論定案，沒有另外寫 handoff 文件：

1. 按鈕的 icon 改用扁平單色 icon，不要 emoji。
2. 原本的開關放在清單最上方、且是全域生效，清單一長就要捲回頂端才能再切換，且改成「每則例句各自獨立控制」比較符合需求。
3. 原本切換會呼叫 `render()` 整頁重繪，導致所有已展開的例句被收合，希望切換後維持原本展開狀態。

跟使用者來回討論後定案的設計（比原本更完整）：

- **主開關「練習模式」**：預設關閉（跟這個功能出現以前的行為一致，例句一律清楚顯示）。開啟後，所有例句的英文預設變模糊（`filter: blur(5px)`，看得出長度但看不清楚內容）。
- **每則例句自己的顯示鈕**：只有主開關開啟時才會出現（`.example-practice-toggle-btn`，扁平單色「眼睛」SVG，沿用全站既有的 `stroke="currentColor"` 圖示慣例，不用 emoji），只讓那一則例句變清楚，其他例句不受影響。主開關關閉時這顆按鈕完全不出現。
- **全部靠 CSS class 切換，JS 端完全不呼叫 `render()`**：主開關切換的是外層 `.vocab-overview-list` 的 `practice-mode-on` class；每則例句自己的顯示鈕切換的是該例句 `.flashcard-example` 自己的 `example-revealed` class。模糊/清楚的樣式規則全部寫在 `style.css`（`.vocab-overview-list.practice-mode-on .flashcard-example-en` 模糊、加上 `.example-revealed` 還原清楚），JS 只做兩件事：切 class、換按鈕圖示，完全沒有整頁重建，所以切換主開關或任何一則例句的顯示鈕都不會影響其他已展開的例句、不會讓捲動位置跳掉。

`app/src/main.ts` 具體改動：

- `buildExampleSentenceBlock(example, withPracticeToggle = false)`：`withPracticeToggle` 為 `true` 時才在例句列多加一顆顯示鈕，點擊切換 `exampleBox.classList.toggle("example-revealed")` 並換圖示，沒有其他副作用。`renderFavorites()`（收藏清單）跟字卡暖身呼叫這個函式都沒傳這個參數，維持舊行為不受影響。
- `buildVocabOverviewRow(vocab, withPracticeToggle = false)`：把 `withPracticeToggle` 往下傳給 `buildExampleSentenceBlock()`。
- 舊的 `readVocabOverviewShowEnglish()`／`setVocabOverviewShowEnglish()`／`VOCAB_OVERVIEW_SHOW_ENGLISH_STORAGE_KEY` 整組換成 `readVocabOverviewPracticeMode()`／`setVocabOverviewPracticeMode()`／`VOCAB_OVERVIEW_PRACTICE_MODE_STORAGE_KEY`（localStorage key 也跟著改名，裝置層級設定，預設 `false`／關閉）。
- `renderVocabOverview()` 的主開關按鈕點擊只做：讀目前 `list` 是否有 `practice-mode-on` class → 反轉 → 存 localStorage → `list.classList.toggle(...)` → 換按鈕圖示/文字/`aria-pressed`，全程沒有 `render()`。
- 新增 `EYE_OPEN_ICON(size)`／`EYE_OFF_ICON(size)` 共用的扁平單色 SVG 圖示產生器（`viewBox 24x24`、`stroke="currentColor"`、無填色，跟 `NAV_ICON_VIEWBOX` 那組既有慣例一致），主開關跟每則例句的顯示鈕共用同一組圖示。

`app/src/style.css` 具體改動：

- `.vocab-overview-toolbar .slow-speech-toggle-btn` 加上 `display: inline-flex; align-items: center; gap` 讓 icon＋文字可以並排（主開關按鈕現在是 SVG + `<span>文字</span>`，不是純文字）。
- 新增 `.vocab-overview-list.practice-mode-on .flashcard-example-en`（模糊）、`.vocab-overview-list.practice-mode-on .flashcard-example.example-revealed .flashcard-example-en`（還原清楚）、`.example-practice-toggle-btn`（預設 `display: none`）＋ `.vocab-overview-list.practice-mode-on .example-practice-toggle-btn`（練習模式開啟時才出現）。

`app/scripts/verify-vocab-overview-english-toggle.ts` 整支改寫（沿用原檔名，內容配合新設計）：6 個測試，涵蓋 `buildExampleSentenceBlock()`／`buildVocabOverviewRow()` 的 `withPracticeToggle` 參數與傳遞、收藏清單／字卡暖身不受影響、練習模式讀寫函式與預設值、`renderVocabOverview()` 正確串接且不呼叫 `render()`、`style.css` 對應規則都存在。全部通過。

驗證：`npx tsc --noEmit` 乾淨無錯；全部 31 支 `verify-*.ts`（含改寫的這支）重跑皆通過；`npm run build` 成功，手動 grep 打包後的 `dist/assets/main-*.js`／`*.css` 確認 `"練習模式"`／`"practice-mode-on"`／`"example-revealed"`／`"example-practice-toggle-btn"` 都有進到最終產出；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。

**這次也是純邏輯＋CSS class 切換，已用自動化測試涵蓋讀寫/傳遞邏輯跟「不呼叫 render()」這個關鍵行為**，但實際模糊的視覺程度是否恰當（5px 夠不夠模糊/會不會太模糊）、主開關跟每則例句顯示鈕的圖示是否清楚易懂、手機寬度下觀感，建議使用者在 `demo-standalone.html` 的「單字總覽」實際打開練習模式試用一輪確認。**沒有動到 9.112／9.113／9.114 節提到的會話練習（voiceLab／conversationGame）相關檔案，也沒有執行任何 git 操作。**

### 9.115 App 端執行：「單字總覽」新增例句英文開關（2026-09-24）

承接 9.114 節的 `docs/handoff-prompt-vocab-overview-example-english-toggle.md`，完全照 handoff 提供的程式碼實作，沒有需要偏離的地方：

1. **`buildExampleSentenceBlock()`／`buildVocabOverviewRow()`**（`main.ts`）都新增 `showEnglish: boolean = true` 參數，`buildExampleSentenceBlock()` 內用 `exampleEn.hidden = !showEnglish` 控制英文文字那個 `<span>` 是否隱藏，🔊 播放發音按鈕不受影響、一律顯示。`renderFavorites()`（收藏清單）跟字卡暖身呼叫這兩個函式時都**沒有**傳第二個參數，維持預設值 `true`，確認沒有被連帶影響。
2. **裝置層級持久化設定**：仿照 `speech.ts` 的 `isSlowSpeechEnabled()` 模式，在 `main.ts` 新增 `readVocabOverviewShowEnglish()`／`setVocabOverviewShowEnglish()`，存在 `localStorage`（key: `englishForKids.settings.vocabOverviewShowEnglish.v1`），沒存過值時預設回傳 `true`（開）。
3. **`renderVocabOverview()`** 頂部加上工具列：切換按鈕（👁️ 例句顯示英文／🙈 例句隱藏英文）＋提示文字，點擊後存檔並呼叫 `render()` 重新整理畫面；`buildVocabOverviewRow(vocab, showEnglish)` 把目前開關狀態傳給每一列單字。

**跟 handoff 假設不一致、需要補的地方**：handoff 建議按鈕直接沿用 `.slow-speech-toggle-btn` 既有樣式、不用另外寫 CSS，但檢查 `style.css` 發現那組樣式實際上是 `.stage-banner .slow-speech-toggle-btn`（深色題型橫幅專屬配色，靠 `.stage-banner` 祖先選擇器才會套用），「單字總覽」的工具列是白底一般頁面、不在 `.stage-banner` 裡面，直接沿用 class 名稱會拿到完全沒有樣式的裸按鈕。因此新增了 `.vocab-overview-toolbar .slow-speech-toggle-btn`（跟 `.active`／`:hover`）一份白底配色版本，形狀/間距規格（圓角、padding、字級）維持跟原本一致，只換了配色，沒有整個重新設計按鈕。另外新增 `.vocab-overview-toolbar`／`.vocab-overview-toolbar-hint`，640px 以下比照 `.stage-banner-actions` 的做法改上下排列。

新增 `app/scripts/verify-vocab-overview-english-toggle.ts`（6 個測試）：① `buildExampleSentenceBlock()` 有 `showEnglish` 參數且正確控制 `hidden`；② `buildVocabOverviewRow()` 有 `showEnglish` 參數且正確傳給 `buildExampleSentenceBlock()`；③ `renderFavorites()` 呼叫 `buildVocabOverviewRow(vocab)` 沒有傳第二個參數（收藏清單沒被波及）；④ 字卡暖身呼叫 `buildExampleSentenceBlock(vocab.example_sentence)` 同樣沒有傳第二個參數；⑤ 讀寫函式存在且預設值 `true`；⑥ `renderVocabOverview()` 有讀取開關狀態並正確傳給每一列單字。全部通過。

**附帶修正一個環境問題**：這次驗證時沙盒的 `npm run build` 一開始失敗，錯誤是 `Rollup 原生模組 MODULE_NOT_FOUND`——跟 9.110／9.111 節記錄的已知問題同一類，但這次多挖到一個根本原因：`app/package.json` 的 `devDependencies` 裡不知道什麼時候被直接寫死了一行 `"@rollup/rollup-darwin-x64": "^4.63.4"`（用 `git log -p -- package.json` 確認這行從來沒有被 commit 過，是純本機、未進版本控制的殘留），這會導致在非 macOS 環境（包含這個沙盒，也包含 GitHub Actions 的 `ubuntu-latest`）執行 `npm install` 直接報錯 `EBADPLATFORM` 而不是像一般 optional dependency 那樣安靜跳過。已經把這行從 `package.json` 移除（rollup 本來就會自己透過 `optionalDependencies` 依平台安裝對應的原生模組，不需要專案自己額外釘死特定平台版本），重新 `npm install` 後在這個沙盒／Linux 環境下 build 恢復正常。**這個修正還沒有被 commit**，麻煩使用者之後跑 `上傳更新.command` 時留意 `package.json`／`package-lock.json` 的異動內容，確認這個修正有一併進版本控制，避免以後 GitHub Actions 的 Ubuntu CI 也遇到同樣的建置失敗。

驗證：`npx tsc --noEmit` 乾淨無錯；全部 31 支 `verify-*.ts`（含新增的這支）重跑皆通過；`npm run build` 成功（多入口 `main`／`voiceLab`，這是 9.112／9.113 節新增的會話練習功能帶進來的，跟這次改動無關），手動 grep 打包後的 `dist/assets/main-*.js`／`*.css` 確認 `"例句顯示英文"`／`"例句隱藏英文"`／`"vocab-overview-toolbar"` 都有進到最終產出；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。

**這次也是純邏輯＋一般按鈕/清單排版，已用自動化測試涵蓋讀寫/傳遞邏輯**，但實際切換觀感（按鈕配色是否協調、手機寬度下工具列排列、🔊 按鈕在英文隱藏時仍可正常播放）建議使用者在 `demo-standalone.html` 任一主題的「單字總覽」實際切一次開關確認，並進「收藏清單」確認例句英文沒有被連帶隱藏。**這次沒有動到 9.112／9.113／9.114 節提到的會話練習（voiceLab／conversationGame）相關檔案，也沒有執行 `git add -A`／commit，只留下修改過的檔案在工作目錄，避免干擾那批還在進行中的工作。**

### 9.114 使用者提議：「單字總覽」新增例句英文開關，撰寫 handoff（2026-09-24）

使用者提議在主題內的「單字總覽」畫面，例句區塊新增一個開關，可以把例句的英文文字先隱藏，讓使用者看著中文練習說英文，說完再打開核對，**預設中英文都顯示**。

撰寫 `docs/handoff-prompt-vocab-overview-example-english-toggle.md` 交給 App 端執行，重點設計：

- `buildExampleSentenceBlock()`／`buildVocabOverviewRow()` 新增 `showEnglish: boolean = true` 參數（預設 true，不影響既有呼叫端行為），只有隱藏英文那個 `<span>`，🔊 播放發音按鈕維持一律顯示（開關管的是「看不看得到英文文字」，跟「聽不聽得到發音」是分開的兩件事）。
- 明確要求**只影響「單字總覽」**：「收藏清單」跟「字卡暖身」也共用同一組函式，但呼叫端不傳第二個參數、維持預設值 `true`，不會被連帶影響。
- 開關狀態存 localStorage（比照 `speech.ts` 的 `isSlowSpeechEnabled()` 模式，裝置層級、不分使用者），按鈕直接沿用現成的 `.slow-speech-toggle-btn` 樣式，不用另外寫新 CSS。

**這次沒有一併驗證/commit**：檢查 `git status` 發現工作目錄裡已經有一大批跟這次需求無關、看起來是 App 端正在進行中的其他功能（`conversationGame.ts`／`content/conversations/`／`voiceLab.ts` 等「會話練習」相關的新檔案跟修改，對應上面 9.112／9.113 節），為了不干擾那批還在進行中的工作，這次只新增 `docs/` 底下的 handoff 文件跟這則 HANDOFF 記錄，沒有跑 build/verify，也沒有執行 `git add -A`／commit。

### 9.113 執行方案 C：全單字發音兜底 ＋ 智慧字幹還原 ＋ 會話生字庫擴充（2026-09-23）

使用者截圖回報在會話練習中，許多單字（例如 `say`, `that`, `fantastic`, `scampered`, `pine`, `squirrel`）沒有虛線底線且無法點擊發音。經排查為過往系統將「發音能力」與「中文資料庫收錄」強綁定，導致進階生字、時態變化（如 `climbed`）與功能詞因無對應中文而被判定為不可點擊純文字。使用者指示採取「方案 C」全面解決。

- **智慧字幹還原（Lemmatization / Stemming）**：`content.ts` 新增不規則動詞/名詞變化表（`said`→`say`, `ran`→`run`, `did`→`do`...）與正規規則還原（`-ed`, `-ing`, `-s`, `-es`, `-ies`），遇到時態變化自動還原原型進行詞義比對。
- **常用文法詞與繪本會話詞庫擴充**：`content.ts` 內建 `COMMON_CONVERSATIONAL_WORDS` 全域補充庫，收錄文法功能詞（`the`, `that`, `did`, `back`, `down`, `course` 等）與生動繪本詞彙（`fantastic`, `squirrel`, `pine`, `path`, `scamper`, `practice`, `single`, `playful` 等）。
- **全單字發音兜底機制**：`main.ts` 中的 `createChatRow`（會話練習）與 `buildInteractivePassage`（短文理解）移除未收錄字的阻擋邏輯，使句子內的所有英文單字 100% 成為可互動元件，點擊必播放標準發音；查得到中文顯示中文釋義，無收錄字則顯示英文原詞與 🔊 重播按鈕。
- **驗證**：使用者截圖中全部 53 個字詞 100% 成功取得正確中文釋義；`npm run typecheck` 0 錯誤、`npm run build` 通過。

### 9.112 Stage C 短文理解生字加入語音朗讀與 🔊 重播功能（2026-09-23）

使用者回報希望在「短文理解」中的生字加入語音功能。原本 Stage C 的短文內生字點擊時僅會彈出中文釋義與收藏星星，沒有發音回饋與重聽機制。

- **點擊即時發音**：`main.ts` 的 `buildInteractivePassage()` 在點擊生字（`.passage-word`）展開泡泡時，自動呼叫 `speakEnglish(token)` 發音；若此時整篇短文朗讀正在播放（`isPassageReading === true`），會先呼叫 `stopPassageReadingIfAny()` 停止全文朗讀，避免聲音碰撞。
- **泡泡內 🔊 重播按鈕**：在 `.passage-word-tooltip` 內新增 `.passage-word-audio-btn`（🔊 重播發音），具備 `aria-label` 與 `title`，並透過 `e.stopPropagation()` 阻止事件冒泡；點擊可隨時重複朗讀該生字發音。
- **手機螢幕邊界安全校正**：針對窄螢幕（320px～414px）行首與行尾的生字，計算 `tooltip.getBoundingClientRect()`，若靠近或超出邊界，自動向內平移偏移量，並動態設定 `--arrow-left` 變數使上方指示三角形箭頭精準指向單字中心。
- **驗證**：`npm run typecheck` 0 錯誤、`npm run build` 通過（exit code 0）、`verify-passage-glossary.ts` 全數通過。

### 9.111 使用者回報：Kitchen & Dining（tableware）Stage B-1 例句語意不清，直接改寫（2026-09-14）

使用者截圖回報 Kitchen & Dining 主題（`content/sentences/tableware.json`，`fileKey` 是舊名 `tableware`）第 7 句「I use a straw, and the waiter puts the food on a tray.」語意不明——這句把「我自己用吸管喝東西」跟「服務生把食物放上托盤」兩個完全不相干情境（居家 vs. 餐廳服務生）硬用 and 接在一起，跟先前 9.9x 節修過的 Greetings 例句是同一類問題（為了塞進兩個 vocab_id 硬湊句子）。

這是 content 端問題，直接修改，不用寫 handoff：改成單一情境的句子「I put the cup with a straw on the tray.」（我把插著吸管的杯子放到托盤上），`voc.tableware.018`（straw）／`voc.tableware.019`（tray）兩個目標單字都還在，`grammar_point` 改成「介系詞片語修飾名詞」，比原本的「and 連接兩個子句」更準確描述新句子的文法重點。

驗證：全部 `verify-*.ts` 重跑皆通過；`app/demo-standalone.html`／根目錄 `demo-standalone.html`／`dashboard.html` 皆已重新產生同步。

**附帶記錄**：這次驗證時發現沙盒環境的 `app/node_modules` 也遇到跟使用者 Mac 端同一類「Rollup 原生模組 MODULE_NOT_FOUND」問題（只是換成 `@rollup/rollup-linux-x64-gnu` 版本），原因是 `node_modules/` 是共用掛載資料夾、不進版本控制（`.gitignore` 已排除），沙盒（Linux）跟使用者的 Mac 分別 `npm install` 會裝各自平台的原生模組，交互使用時難免遇到平台不合的暫時狀態，重新 `npm install` 一次就解決，不影響最終產出內容，純粹紀錄備查。

### 9.110 修正「上傳更新.command」遇到 node_modules 損毀時不會自動重裝的問題（2026-09-07）

使用者雙擊 `上傳更新.command` 時，`npm run build` 失敗，錯誤是 Rollup 原生模組 `MODULE_NOT_FOUND`（`rollup/dist/native.js`），這是 npm 安裝 optional native dependency 時常見的已知問題，通常發生在 Node.js 版本更新後，舊的 `node_modules` 裡快取的原生模組跟新版 Node 對不上。

原本的腳本只在 `app/node_modules` **完全不存在**時才會 `npm install`，這種「資料夾存在但裡面東西壞掉」的情況完全沒被涵蓋到，使用者會卡住沒辦法自己排除。已修正：`npm run build` 失敗時，自動 `rm -rf app/node_modules app/package-lock.json` 重新安裝一次再重試一次建置，不用使用者自己開 Terminal 手動操作。

也同步請使用者先手動跑一次 `rm -rf node_modules package-lock.json && npm install`（在 `app/` 目錄下）解決當下卡住的狀況，之後同類問題腳本會自己處理。

### 9.109 App 端執行：「關於本站」頁面新增「更新紀錄」區塊（2026-09-07）

承接 9.108 節的 `docs/handoff-prompt-changelog-section.md`，三個檔案的改動：

1. **`app/src/types.ts`**：新增 `ChangelogEntry` 介面（`date`／`title`／`items: string[]`），對應 `content/changelog.json` 的資料格式。
2. **`app/src/content.ts`**：比照既有 `badgesData` 的匯入方式新增 `import changelogData from "../../content/changelog.json"`，匯出 `export const CHANGELOG: ChangelogEntry[] = changelogData;`——原樣匯出、不排序，因為 `changelog.json` 本身已經由新到舊排列。
3. **`app/src/main.ts`**：`renderAbout()` 裡「使用須知」段落之後、版本號（`metaText`）之前新增「更新紀錄」標題＋清單，`CHANGELOG.slice(0, 5)` 只取最新 5 則，不做「查看更多」的展開功能，完全照 handoff 提供的程式碼實作，沒有需要偏離的地方。

`app/src/style.css` 新增 `.changelog-list`／`.changelog-entry`／`.changelog-entry-header`／`.changelog-date`／`.changelog-items` 樣式，沿用 `.about-text` 系列的字級／行距（`--text-body`、1.8 行高），日期用 13px、`--color-ink-muted` 淺灰色跟標題拉開層級。沒有另外寫 `@media (max-width: 640px)`——理由跟 `.about-text` 一致：整段內容本來就是隨 `#app` 容器（`max-width: 1000px`）等比縮放的一般段落/清單，不需要額外斷點，避免重新發明版面規格。

新增 `app/scripts/verify-changelog.ts`（3 個測試）：① `content/changelog.json` 每筆資料的 `date` 符合 `YYYY-MM-DD`、`title`／`items` 不是空字串、`items` 至少 1 條；② `content.ts` 有正確匯入並原樣匯出 `CHANGELOG`；③ `renderAbout()` 有用 `CHANGELOG.slice(0, 5)`，且「更新紀錄」區塊確實放在「使用須知」之後、版本號之前。全部通過。

驗證：`npx tsc --noEmit` 乾淨無錯；全部 29 支 `verify-*.ts`（含新增的這支）重跑皆通過；`npm run build` 成功，手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `"更新紀錄"`／`"changelog-entry-header"`／首則更新紀錄的文字內容都有進到最終產出；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。

**這次也是純資料串接＋一般段落排版，已用自動化測試涵蓋讀取／匯出／放置順序**，但實際畫面觀感（標題大小、日期顏色深淺、手機寬度下是否跟其餘「關於本站」內容視覺一致）建議使用者在 `demo-standalone.html` 的「關於本站」頁面實際看一次確認。

### 9.108 新增「更新紀錄」功能：關於本站頁面給使用者看的簡短更新說明（2026-09-07）

平台已經正式上線給更多使用者，使用者提議在網頁裡加一個記錄每次更新內容的地方，但明確要求「說明不用太長」。討論後決定跟 `HANDOFF.md`（技術交接用、上百條、充滿程式碼細節）完全分開，另外做一份給家長看的精簡版：

- **放置位置**：併入現有「關於本站」頁面新增一個「更新紀錄」區塊（使用者選擇，不新增獨立導覽分頁），只顯示最新 5 則。
- **不做「有新更新」提示**（小紅點之類的機制）——使用者選擇先簡單就好。
- **回溯歷史**：使用者選擇補 3-5 則重點大事件當開頭，已建立 `content/changelog.json`，先寫入 3 則（正式上線、手機操作優化、App 圖示），用家長看得懂的白話文字，不提技術細節。
- **維護方式**：`content/changelog.json` 是純資料檔（跟 `badges.json` 同一類），之後每次有使用者感受得到的更新，直接由我編輯這個檔案加一條到最前面即可，**不需要再走 handoff 流程**——這次的 handoff（`docs/handoff-prompt-changelog-section.md`）只需要 App 端做一次性的讀取＋渲染機制（`content.ts` import＋`renderAbout()` 新增區塊＋CSS），之後維護不會再麻煩到 App 端。

### 9.107 App 端執行：Stage B-1 新增「重置字塊」按鈕＋修正答錯次數重複累加（2026-09-07）

承接 9.106 節的 `docs/handoff-prompt-ordering-reset-and-wrongcount.md`，`app/src/orderingGame.ts` 兩處修改：

1. **答錯次數重複累加**：新增 `private wrongCountedThisSentence = false` 旗標（`loadSentence()` 時重置）。`evaluate()` 判定答錯的分支，`wrongCount` 只在 `!wrongCountedThisSentence` 時才 +1 並把旗標設成 true；`wrongStreak`（決定提示/跳過按鈕何時出現）跟 `onWrong()`（答錯音效）維持每次判定都照樣 +1／觸發，不受這個旗標影響，使用者用 `reorderPlaced()` 拖曳調整順序、字塊池清空觸發重新評分時，即使還是錯的，同一句也只會被扣一次。
2. **重置字塊**：新增公開方法 `resetPlacedTokens()`——把 `placed` 全部字塊送回 `pool`、清空 `placed`、`feedback` 設回 `"building"`、呼叫 `onChange()`；已答對鎖住（`locked === true`）或 `placed` 本來就是空的時候直接 no-op。不會動到 `wrongCount`／`wrongStreak`，跟既有的 `returnToken()` 一樣純粹是排列操作，不算重新作答一次。

`app/src/main.ts` 的 `renderOrdering()` 裡，「🔊 播放整句」按鈕後面加上「↺ 重置字塊」按鈕，顯示條件是 `game.feedback !== "correct" && game.placed.length > 0`（任何時候只要有已放置字塊且這一句還沒鎖住就能按，不限定答錯之後，符合使用者確認過的需求）。

**跟 handoff 建議程式碼的一處差異**：handoff 原本建議顯示條件用 `!game.locked`，但 `orderingGame.ts` 的 `locked` 是 `private` 欄位，`main.ts` 存取不到，會編譯錯誤。動手改之前先 grep 過 `main.ts`，確認全檔案既有慣例（其餘 5 處類似「這一題是否已鎖住」的判斷）都是用 `game.feedback === "correct"`；又讀過 `orderingGame.ts` 全部 7 處 `this.locked` 的賦值點，確認 `locked` 永遠只在 `evaluate()` 判定答對、跟 `feedback = "correct"` 同一個區塊裡被設成 true，`loadSentence()` 重置時也跟 `feedback = "building"` 同步歸零，兩者狀態永遠同步，所以直接改用 `game.feedback !== "correct"`，語意等價，也維持跟全檔案一致的寫法。

新增 `app/scripts/verify-ordering-reset-and-wrongcount.ts`（5 個測試）：① 排錯一次 → `wrongCount === 1`；② 用 `reorderPlaced()` 調整順序但仍答錯 → `wrongCount` 維持 1（不會變 2，這是這次修正的核心迴歸測試）；③ `resetPlacedTokens()` → 答案區淨空、字塊池數量回到全部、`feedback` 回到 `"building"`、`wrongCount` 不受影響；④ 換到下一句後再答錯一次 → `wrongCount` 正常累加到 2（確認只有「同一句內」不會重複疊加，跨句子還是正常累加）；⑤ 已答對鎖住時呼叫 `resetPlacedTokens()` → 確認完全 no-op（`feedback`／`placed`／`pool` 都不變）。全部 5 個測試通過。

驗證：`npx tsc --noEmit` 乾淨無錯；全部 28 支 `verify-*.ts`（含新增的這支）重跑皆通過；`npm run build` 成功，手動 grep 打包後的 `dist/assets/*.js` 確認 `"重置字塊"`／`"resetPlacedTokens"` 兩個字串都有進到最終產出；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。

**這次修改都是純邏輯層面（資料狀態機），已經用自動化測試涵蓋，不需要真的開瀏覽器/實機才能驗證**；但畫面上按鈕的實際排版位置（是否跟其餘按鈕排列整齊、點擊後動畫觀感）建議使用者在 `demo-standalone.html` 裡拿 Parts of Body「My head and my neck hurts, too.」這句實際點一次「↺ 重置字塊」確認手感。

### 9.106 使用者回報：Stage B-1 答錯次數重複累加＋新增「重置字塊」按鈕，撰寫 handoff（2026-09-07）

使用者截圖回報 Parts of Body 主題 Stage B-1 句子排序，「答對 1　答錯 2」的計數不合理。追根究柢是 `orderingGame.ts` 的 `evaluate()` 只要字塊池是空的就會判定一次對錯，使用者排錯後如果用「拖曳調整已放置字塊順序」修正（`reorderPlaced()`），字塊池本來就還是空的，每調整一次就會立刻再判定一次——同一句因此被重複扣分好幾次，造成心理負擔。

順便一併處理使用者提出的另一個需求：新增「重置字塊」按鈕，讓使用者可以一鍵把這一句所有已放置字塊送回字塊池整句重排，不用一個一個手動搬。跟使用者確認過，這個按鈕**任何時候都能按**，不限定答錯之後才出現。

已撰寫 `docs/handoff-prompt-ordering-reset-and-wrongcount.md` 交給 App 端執行，內容包含：新增 `resetPlacedTokens()` 方法＋對應按鈕；新增 `wrongCountedThisSentence` 旗標讓 `wrongCount` 同一句最多只加 1 次（`wrongStreak`〔決定何時出現提示/跳過按鈕〕跟 `onWrong()` 音效都刻意維持每次判定都觸發，不受這個旗標影響）；換句子時（`loadSentence()`）重置旗標。這次邏輯單純、不涉及 UI 動畫，建議可以直接寫 `verify-*.ts` 驗證，不用真的開瀏覽器測。

### 9.105 App 端執行：修正 Stage B-1「Is」字塊發音變 "Ice"（2026-09-07）

承接上一節（9.104）的 `docs/handoff-prompt-stage-b1-is-pronunciation-bug.md`，`app/src/speech.ts` 的 `AMBIGUOUS_STANDALONE_WORDS` 對照表新增一條規則：

```ts
const AMBIGUOUS_STANDALONE_WORDS: Record<string, string> = {
  I: "Eye",
  Is: "Is.",
};
```

採用 handoff 建議的候選 1（字尾補句點，讓引擎當作完整短句處理），因為改動最小、風險最低。跟 `AMBIGUOUS_STANDALONE_WORDS` 既有查表機制完全相容——`speakEnglish()` 本來就是 `AMBIGUOUS_STANDALONE_WORDS[text] ?? text` 查表，Stage B-1 字塊池點擊時呼叫 `speakEnglish(token.text)` 保留原始大小寫，句首字塊「Is」會直接命中這條新規則。

- 沒有處理小寫 `is` 的對應規則：handoff 本身也說這是選擇性的（「理論上目前的架構不會發生，因為只有句首字塊會大寫」），而且原本 `speech.ts` 註解裡就記錄過先前排查時「is」（小寫、完整句子情境）已經確認沒問題，這次的 bug 只跟句首大寫字塊有關，維持現有的精確比對（不改成不分大小寫），避免引入不必要的複雜度。
- 新增 `app/scripts/verify-ambiguous-word-pronunciation.ts`（4 個測試：對照表內容、`speakEnglish()` 有正確查表、`parts_of_body.json`／`places_directions.json` 兩句「Is」開頭句子還在且字塊化後第一個字塊剛好是 `"Is"`、Stage B-1 字塊池點擊確實保留原始大小寫）。

**重要限制說明**：這個修法沒辦法在沒有喇叭/瀏覽器的沙盒環境裡實際聽過確認，是根據 handoff 的推薦順序先採用候選 1，還沒驗證是否真的解決「Ice」誤讀的問題。麻煩實機測過 Parts of Body（「Is your foot bigger than your hand?」）跟 Places & Directions（「Is the hospital near here or over there?」）這兩句的「Is」字塊，確認讀音正常；如果還是被唸成 "Ice"，改用 handoff 列的候選 2（把值換成 `"Izz"`）。

驗證：`npm run build`（`tsc --noEmit && vite build`）通過；全部 27 支 `verify-*.ts`（含新增的 `verify-ambiguous-word-pronunciation.ts`）重跑皆通過；手動 grep 打包後的 `dist/assets/*.js` 確認 `Is."` 字串有進到最終產出；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。這次只改了 `speech.ts` 一個檔案，`main.ts`／`content/` 都沒有改動。

### 9.104 使用者回報：Stage B-1 單獨點「Is」字塊發音變成 "Ice"，撰寫 handoff（2026-09-07）

使用者截圖回報 Parts of Body 主題 Stage B-1 句子排序，句子「Is your foot bigger than your hand?」單獨點句首字塊「Is」時發音變成 "Ice"，其餘字塊跟整句朗讀都正常。這跟先前 9.94/9.95/9.96 節排查過的「I」羅馬數字誤判是同一類問題（`speech.ts` 的 `AMBIGUOUS_STANDALONE_WORDS` 機制），但是不同的字——先前排查「is」時測的是完整句子裡的小寫 is，這次是句首大寫、單獨字塊的「Is」（`app/src/main.ts` 第 751 行 `tokenButton()` 點擊時用原始大小寫呼叫 `speakEnglish(token.text)`），情境不同，不影響先前的結論。

已確認目前 content 裡有 2 句話句首是「Is」（`parts_of_body.json`／`places_directions.json`），撰寫 `docs/handoff-prompt-stage-b1-is-pronunciation-bug.md` 交給 App 端執行，列了兩個候選修法（補句點 `"Is."` 或換拼法 `"Izz"`），因為沙盒沒有喇叭/瀏覽器語音沒辦法直接驗證哪個有效，請 App 端實機測試後擇一採用。

### 9.103 整理進度並更新所有紀錄文件（2026-09-07）

使用者要求「整理目前的進度內容並更新所有紀錄」。檢查後發現 `HANDOFF.md` 開頭幾個結構性段落從 2026-08-25 之後就沒再同步更新過，跟 9.x 系列最新記錄（含 Phase 3 上線、單元七接線、三輪手機版 RWD 修正、App 圖示、`上傳更新.command`）明顯脫節，容易讓人誤以為專案還停在 Phase 2 進行中。這次整理內容：

- **開頭狀態段落**（原第 3 行）：原本是一段從 2026-08-04 一路累加、幾乎不可讀的巨型段落，且結尾仍寫著「單元七 App 端尚未接線」（已過期）。已整段改寫成精簡的最新狀態摘要（Phase 1～3 全部完成＋正式站網址＋三輪 RWD／App 圖示／上傳工具），並註明逐批內容擴充明細仍以 9.x 系列為準，避免這個段落之後又變成第二份難以維護的流水帳。
- **§1 目前進度總結表**：主題數／單字句子短文統計更新為最新的 43 個主題、897 字／496 句／43 篇短文，移除「單元七待接線」的過期敘述，新增「正式上架」一列。
- **§3 開發階段規劃表**：Phase 2、Phase 3 從「進行中」／「未開始」更正為「✅ 已完成」，並補上正式站網址與上架後的修正項目。
- **§6 檔案總覽**：`verify-*.ts` 數量由過期的「16 支」更正為實際的 27 支；補上 `app/public/`（圖示／manifest）與根目錄 `上傳更新.command` 的說明；`content/` 底下過期的逐檔案字數（14 個主題、236 字）改成指向 `dashboard.html` 看即時數字，避免又跟不上後續擴充。
- **§8 快速上手**：補上正式站連結與 `上傳更新.command` 的使用說明，Phase 狀態同步更正。
- **`README.md` TODO**：單字/句子/短文統計數字（672／279／32）更新為最新的 897／496／43；新增三輪手機版 RWD 修正、App 圖示／manifest、`上傳更新.command` 三個已完成項目的勾選條目（先前這三項工作只在 HANDOFF.md 的 9.x 系列有記錄，README 完全沒提到）。
- **`dashboard.html`**：重新執行 `node app/scripts/build-dashboard.mjs` 確認自動產生區塊（KPI／內容進度）數字與上述一致（43 主題、897 字、496 句、43 短文），手動維護的「開發階段」分頁先前已在 9.93 一併更新過，這次未再變動。

**刻意不做的事**：`### 9.x` 章節編號目前有 5 組重複（9.87／9.88／9.89／9.90／9.91 各出現兩次，來自不同並行 session 各自往下接續編號），這次沒有重新編號——文件內部有多處用「見 9.83 節」這類編號直接互相引用，強行重新編號有弄壞既有交叉引用的風險，且不影響閱讀（依然照時間新到舊排列），暫時維持現狀。

### 9.102 新增雙擊上傳工具「上傳更新.command」（2026-08-28）

每次要上傳新進度到 GitHub，流程一直是：我（content 端 session）在沙盒裡跑 `npm run build`／全部 `verify-*.ts`／`git add`／`git commit`，因為沙盒沒有對外網路，最後一步 `git push` 都要請使用者自己開 Terminal 手動執行——過程中也發生過使用者忘記先 commit、或重開機後不確定該怎麼做的情況。使用者要求做一個「快捷功能」，於是在專案根目錄新增 `上傳更新.command`（macOS 可雙擊執行的 shell script）：

- 雙擊後依序執行：檢查 `app/node_modules` 是否存在（沒有的話先 `npm install`）→ `npm run build` → 跑遍 `app/scripts/verify-*.ts` 全部（任何一支失敗就中止並印出錯誤，不會盲目往下 commit/push）→ 印出 `git status --short` 讓使用者看到這次有哪些變更 → 沒有變更就直接結束 → 有變更的話詢問是否確認上傳、輸入這次更新的簡短說明（可留空用預設的日期時間訊息）→ `git add -A && git commit && git push`。
- 這支腳本是給**使用者自己在他的 Mac 上雙擊執行**的，不是我在沙盒裡跑——這樣 `git push` 才能真的用上使用者本機已經設定好的 SSH 金鑰（見 9.92 節），不受沙盒沒有對外網路的限制，一次雙擊就能取代原本「等 Claude commit 好、再自己開 Terminal 打 git push」的兩階段流程。
- `README.md` 新增「上傳更新到 GitHub」段落說明用法（含 macOS Gatekeeper 第一次雙擊會被擋下、要改成右鍵→打開的提示）。
- 這個檔案本身第一次還是透過原本的流程（我 commit、使用者手動 `git push`）送上去，之後的更新才能開始用這支腳本本身。

### 9.101 手機版排版第三輪修正：頭像/文字破格＋挑戰紀錄卡片改上下排列（2026-08-28）

使用者用手機截圖回報四處排版問題（都是使用者直接口頭描述，這次沒有另外寫 handoff prompt 文件），由 App 端 session 直接執行：

1. **「誰在玩」清單項目（`.profile-login-btn`）破格**：頭像固定 200px、跟名字/上次登入文字橫向排列（`display:flex; align-items:center`，沒有 `flex-wrap`），窄螢幕下沒有足夠寬度容納兩者，文字被擠出卡片右側邊界。640px 以下改成 `flex-direction: column`，頭像跟文字都置中；順便把桌面版用的 `--radius-pill`（999px，配合橫向矮扁形狀設計）在窄螢幕覆蓋成 `--radius-xl`，避免堆疊後變高的卡片被畫成上下都是半圓的膠囊形狀。
2. **「個人檔案」個人小卡（`.profile-card`）破格**：跟 1 同一類成因（`flex-wrap: wrap` 沒有真的觸發換行，而是內容溢出），640px 以下改上下堆疊置中（`.profile-card-info`／`h3` 文字也一併置中），`.profile-card-meta` 兩欄小表格本身不用改，靠父層置中即可。
3. **挑戰紀錄展開後的題型明細列（`.stats-stage-row`）**：資訊區（標題／進度條／文字說明）跟「再次挑戰／開始挑戰」按鈕原本橫向並排，跟使用者確認後改成上下排列——640px 以下 `.stats-stage-row` 改 `flex-direction: column`，`.stats-stage-btn` 加 `align-self: stretch` 讓按鈕獨立一列撐滿寬度，比橫向擠在一起好點擊。
4. **挑戰紀錄頂部三張數據卡（`.stats-summary`）**：原本橫向三欄（`flex:1` 各佔三分之一），窄螢幕下改成單欄、上下堆疊（`.stats-summary` 640px 以下改 `flex-direction: column`）。

新增 `app/scripts/verify-mobile-layout-round3.ts`（4 個測試，每個 selector 各自對應一項，統一用「selector 緊接在 `@media (max-width: 640px) {` 開頭之後」的嚴格錨點——這個專案已經因為「檔案裡第一個 @media」這種天真假設踩雷三次了（見 9.95／9.98 節的排查記錄），這次一開始就用嚴格錨點寫，不重蹈覆轍）。

驗證：`npm run build`（`tsc --noEmit && vite build`）通過；全部 26 支 `verify-*.ts`（含新增的 `verify-mobile-layout-round3.ts`）重跑皆通過；手動 grep 打包後的 `dist/assets/*.css` 確認 `profile-login-btn{flex-direction:column`／`profile-card{flex-direction:column`／`stats-stage-row{flex-direction:column`／`stats-summary{flex-direction:column` 都有進到最終產出；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。這四項都是純 CSS 排版調整，`main.ts` 沒有改動，`content/` 也不受影響。

### 9.100 App 端執行：加入主畫面／安裝應用程式固定圖示（manifest＋index.html）（2026-08-28）

承接上一節（9.99）內容端已經放進 `app/public/` 的圖示檔案＋寫好的 `docs/handoff-prompt-app-icon-manifest.md`，這次由 App 端 session 執行技術接線：

- 新增 `app/public/manifest.webmanifest`，照 handoff 內容原樣建立（`name`／`short_name`／`description`／`start_url`／`scope`／`display: standalone`／`background_color`／`theme_color`／`lang`／`icons`），`icons[].src` 刻意用相對路徑（`icons/icon-192.png`，沒有開頭斜線），因為 manifest 裡的路徑是相對於 manifest 檔案本身解析，開頭斜線在 GitHub Pages 子路徑（`https://78vince.github.io/english-for-kids/`）下會被解析成網域根目錄，指向錯誤位置。
- `app/index.html` 的 `<head>` 在 `<title>` 後面、`<link rel="stylesheet">` 前面補上 favicon（`.ico`＋16/32px png 兩種尺寸）、`apple-touch-icon`、`manifest`、`theme-color`、三個 `apple-mobile-web-app-*` 標籤，沿用既有 `href="/src/..."` 這種開頭斜線寫法（Vite 的 `base: "./"` 設定會在 build 時自動改寫成部署子路徑相對路徑，不用手動處理）。`apple-mobile-web-app-title` 刻意用比較短的「English for Kids」而不是網頁完整標題「每天玩一點 - English for Kids」，避免 iOS 主畫面圖示下方的名稱被截斷。
- 新增 `app/scripts/verify-app-icon-manifest.ts`（4 個測試：`app/public/` 圖示檔案齊全、manifest 內容與相對路徑正確、`index.html` 的 `<head>` 標籤齊全、`npm run build` 之後 `dist/` 底下對應檔案存在且路徑已被正確改寫成相對路徑）。
- **範圍刻意沒有擴大**：沒有寫 service worker、沒有做離線快取、沒有改 `main.ts`——這次只處理「加入主畫面/安裝應用程式時有固定圖示＋全螢幕獨立視窗」這個明確需求，跟 handoff 描述的範圍一致。

驗證：`npm run build`（`tsc --noEmit && vite build`）通過，確認 `dist/` 底下有 `favicon.ico`／`apple-touch-icon.png`／`manifest.webmanifest`／`icons/icon-192.png`／`icons/icon-512.png`，且 `dist/index.html` 裡的路徑正確改寫成 `./favicon.ico`、`./manifest.webmanifest` 這種相對路徑（不是還留著開頭斜線）；全部 25 支 `verify-*.ts`（含新增的 `verify-app-icon-manifest.ts`）重跑皆通過；`dashboard.html`／`content-review.html`／`demo-standalone.html` 已重新產生（`demo-standalone.html` 本身的 `<head>` 是獨立寫死的極簡版本，不含 favicon/manifest 標籤，這點不影響 standalone 版本能不能正常開啟，standalone 版本本來就不是給人「安裝」的用途）。

**待使用者確認**：分頁 favicon（K 字母怪獸圖示）已經可以本機用 `npm run dev`／`npm run preview` 看到，但手機「加入主畫面」/「安裝應用程式」之後主畫面圖示長怎樣、名稱有沒有被截斷、點開是不是全螢幕獨立視窗（沒有網址列），這些沒辦法在沒有手機的沙盒環境確認，需要在 iPhone Safari 或 Android Chrome 上實測，且要等這次改動實際部署到 GitHub Pages 正式站之後才能測（GitHub Pages 部署流程是每次 push 到 main 時由 CI 重新 `npm run build` 產生 `app/dist` 上傳，不是用專案根目錄這些手動維護的 demo 檔案）。

### 9.99 App 圖示（favicon／加入主畫面）：K 字母怪獸美術＋ handoff（2026-08-28）

使用者問「做成桌面應用程式時可以有固定的 icon 嗎」——目前完全沒有 favicon／`apple-touch-icon`／web app manifest。設計方向跟徽章系列同一套羊毛氈／黏土手作風格，但改用**滿版純色背景＋安全邊界**（不是徽章的白底留白做法，因為 App 圖示會被系統裁成圓角方形/圓形，留白會讓圖案顯得很小）。跟使用者來回討論主角造型：先提案貓頭鷹吉祥物，使用者想改成「字母怪獸」（呼應徽章系統既有的「數字視覺主角」規則，把字母也擬人化），依序生成了 A／K／O 三個候選、以及一組 K-I-D-S 排排站的插圖（後者不適合當正式圖示，四個角色縮到 favicon 尺寸會糊在一起，只當作附帶插圖留著備用），最後使用者選定 **K 字母怪獸**（單腳站立、一手舉高揮手、另一腳踢出的動感站姿）當正式 App 圖示。

- 原始生成圖（`/Users/admin/VK Agent/image-generator-skill/for Kids/badge 2/app_icon_letter_k_monster_one_foot.png`，1024×1024）用 Python/PIL 檢查過角色主體輪廓的安全邊界（排除模糊陰影/壓縮雜訊後，實際輪廓 margin 落在 11.7%～23.6% 之間），足夠安全不用額外重新置中裁切，直接以此為來源縮圖。
- 已產生全部尺寸並直接放進 `app/public/`：`favicon.ico`（16/32/48 多尺寸）、`apple-touch-icon.png`（180×180）、`icons/icon-192.png`、`icons/icon-512.png`、`icons/favicon-16.png`、`icons/favicon-32.png`。32px 以上肉眼確認清晰可辨（臉、四肢、笑臉都看得出來），16px 只剩色塊輪廓可辨（跟所有 favicon 在這個尺寸的普遍限制一樣，不是這次美術的問題）。
- 技術接線（新增 `manifest.webmanifest`＋`index.html` 補 `<link>`／`<meta>` 標籤）寫成 `docs/handoff-prompt-app-icon-manifest.md` 交給 App 端 session，範圍刻意只到「有固定安裝圖示＋全螢幕獨立視窗」，不含 service worker／離線快取（沒有被要求，不擴大範圍）。
- **2026-08-28 追加調整**：使用者接著要求再做一版更簡化的造型——單色羊毛氈身體＋黏土眼睛、不做手腳（`/Users/admin/VK Agent/image-generator-skill/for Kids/badge 2/app_icon_letter_k_felt_plush.png`）。用色相分析（B 通道是否明顯比 R/G 高，排除掉單純比對單一背景色會被漸層/陰影誤判的問題）量測過兩版的角色輪廓安全邊界：手腳版原圖本身安全（11.7%～23.6%），但用同一份 hue-based 分析重新檢查後發現簡化版留白更充足（14.4%～22.6%），且縮到 16px favicon 時**字形本身依然清楚可辨**，比手腳版縮到同尺寸只剩色塊模糊好判讀很多——判斷原因是手腳版在小尺寸时滾動眼睛、四肢細節會互相干擾，簡化版單靠字形輪廓本身當視覺主體，反而更適合小尺寸圖示的判讀需求。使用者確認後正式採用羊毛氈素色版，`app/public/` 底下全部尺寸的圖檔已覆蓋更新為這版，`docs/handoff-prompt-app-icon-manifest.md` 的技術接線內容不用改（只是換了來源圖檔，接線方式跟檔名都一樣）。

### 9.98 App 端執行：手機版排版第二輪修正（題型選單標題／字卡圖示排列／徽章彈窗捲動鎖定）（2026-08-28）

承接上一節（9.97）內容端寫的 `docs/handoff-prompt-mobile-layout-round2.md`，這次由 App 端 session 執行三項修正：

- **問題 1「題型選單」標題窄螢幕 RWD**：`style.css` 在 `.game-header--with-back` 規則後面新增 `@media (max-width: 640px)` 區塊，改成 `flex-direction: column; align-items: stretch;`，返回按鈕跟著掉到標題文字下面獨立一行（維持預設靠左，這裡只有一顆按鈕，不像 `.stage-banner-actions` 需要額外 `justify-content: flex-end`）。新增 `app/scripts/verify-game-header-with-back-responsive.ts`（2 個測試：斷點內是否改成 column、斷點外是否維持原樣）。
- **問題 2 字卡／測驗畫面圖示改排到文字上面**：
  - `.flashcard-word-row`（字卡正面，單字＋🔊＋⭐）：`main.ts` 把播放鍵跟收藏星星包進新的 `.flashcard-word-icons` 容器（`display:flex; gap`），`style.css` 640px 斷點內 `.flashcard-word-row` 改成 `flex-direction: column-reverse`，讓「文字在前、圖示容器在後」的 DOM 順序反過來排列，兩顆圖示自然排在文字上面同一行。
  - `.flashcard-example-row`（例句＋🔊）／`.flashcard-quiz-reveal`（測驗答完的「👉 正確單字」＋🔊）：都只有一顆圖示，不用改 `main.ts`，直接在 640px 斷點內加 `flex-direction: column-reverse` 就能達成同樣效果（`.flashcard-quiz-reveal` 桌面版本來就靠左，窄螢幕維持 `align-items: flex-start`，跟另外兩個置中的不一樣）。
  - 新增 `app/scripts/verify-flashcard-icons-responsive.ts`（4 個測試：`main.ts` 的 DOM 組裝順序、`.flashcard-word-icons` 容器樣式存在、三個 selector 斷點內都是 `column-reverse`、斷點外維持原樣橫向排列）。
- **問題 3 徽章解鎖彈窗背景捲動鎖定**：`main.ts` 新增 `lockBodyScroll()`／`unlockBodyScroll()`（用計數器管理鎖定狀態、記錄並在解鎖時還原捲動位置，用 `position: fixed` 鎖 `body` 而不是單純 `overflow: hidden`，避免 iOS Safari 鎖不住背景捲動的已知問題）。`appendModalShell()`（「變更頭像」「修改名稱」「首次進站提醒」共用的外殼）跟 `appendBadgeUnlockModal()`（「獲得新徽章」pop）開頭都呼叫 `lockBodyScroll()`；`closeProfileDetailModal()`／`closeBadgeUnlockModal()`（兩者各自唯一的關閉函式，叉叉／點遮罩／確認鈕都會經過同一個）都呼叫 `unlockBodyScroll()`。新增 `app/scripts/verify-modal-scroll-lock.ts`（4 個測試，純原始碼靜態檢查：函式存在且用計數器管理／兩個 append 函式開頭都呼叫 lock／兩個 close 函式都呼叫 unlock／每個關閉路徑都經過同一個關閉函式，沒有繞過鎖定機制）。
  - **重要限制說明**：這是使用者回報的 iOS Safari 專屬視覺 bug，沒辦法在沒有瀏覽器/真機的沙盒環境裡重現或確認修法是否真的解決，`verify-modal-scroll-lock.ts` 只能確認「接線邏輯正確」，沒辦法確認「畫面上遮罩真的完整覆蓋了」。麻煩在真實 iOS Safari 上重現原本的操作（作答時往上滑動把 `.stage-banner` 滑出畫面外，答完跳出「獲得新徽章」pop），確認這次遮罩有完整覆蓋、沒有縫隙；也麻煩測一下「變更頭像」「修改名稱」這兩個共用外殼的既有彈窗，確認鎖定/解鎖背景捲動沒有把原本正常的關閉行為弄壞（例如關閉後畫面跳掉、捲動位置跑掉）。如果實測後鎖定捲動還不夠，handoff 裡列的候補方向是：彈窗開啟當下額外強制 `window.scrollTo(0, 0)`，或改用 `100dvh` 相關的 CSS 技巧。
- **修 bug 時再度踩到的既有雷**：新增 `.game-header--with-back` 的 640px 媒體查詢後，`style.css` 裡同斷點的 `@media` 區塊又多了一個，導致上一輪（9.95）新增的 `verify-stage-banner-responsive.ts` 又壞掉（原理跟 9.95 節修過的 `verify-brand-banner-responsive.ts` bug一模一樣：規則抓到桌面版預設的 `.stage-banner { ... }`，不是巢狀在正確 `@media` 裡的那個）。已用同一套「`.stage-banner {` 必須緊接在 `@media (max-width: 640px) {` 開頭之後」的嚴格錨點修好，3 個測試恢復通過。這已經是第三次踩到同一種問題，往後每次在 `style.css` 新增 640px 媒體查詢，都要留意這個坑，新寫的驗證腳本（`verify-game-header-with-back-responsive.ts`／`verify-flashcard-icons-responsive.ts`）這次一開始就用了嚴格錨點，沒有再重蹈覆轍。

驗證：`npm run build`（`tsc --noEmit && vite build`）通過；全部 24 支 `verify-*.ts`（含 3 支新增的、修正後的 `verify-stage-banner-responsive.ts`）重跑皆通過；手動 grep 打包後的 `dist/assets/*.css`／`*.js` 確認 `.game-header--with-back{flex-direction:column`、`flashcard-word-icons`、`column-reverse`（3 處）都有進到最終產出；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。

### 9.97 使用者手機實測第二輪回饋：三個 App 端排版 handoff（2026-08-28）

上一輪修正（9.95／9.96）push 上線後，使用者繼續用手機實測，又回報三個排版問題，已寫成 `docs/handoff-prompt-mobile-layout-round2.md` 交給 App 端 session：

1. **「題型選單」標題（`renderMenu()`）窄螢幕一樣被擠壓**：上一輪只修了 `.stage-banner`，但題型選單標題用的是另一個 class `.game-header--with-back`（沒套用到同一輪修正），同一種標題被返回按鈕擠壓的問題在這裡重演，而且這裡的按鈕文字「← 返回選擇主題」比 `.stage-banner` 的「← 返回選單」更長，問題更明顯。修法比照上一輪：640px 斷點內改成 `flex-direction: column`。
2. **字卡／測驗畫面文字與喇叭／星星圖示要改成上下排列（圖示在上、文字在下）**：涉及 `.flashcard-word-row`（字卡正面單字＋🔊＋⭐）、`.flashcard-example-row`（例句＋🔊）、`.flashcard-quiz-reveal`（測驗答完後「👉 正確單字」＋🔊）三處。用 `flex-direction: column-reverse` 搭配「文字在 DOM 前、圖示在 DOM 後」的既有順序，窄螢幕下不用改 DOM 順序就能讓圖示自動排到文字上面；`.flashcard-word-row` 因為有兩顆圖示（🔊＋⭐）需要在同一行，額外要在 `main.ts` 把兩顆圖示包進一個新的 `.flashcard-word-icons` 容器。
3. **「獲得新徽章」彈窗遮罩，使用者往上滑動後跳出時覆蓋不完整**：`.modal-overlay` 本身的 `position: fixed; inset: 0;` 寫法沒有問題，也確認過沒有祖先元素有 `transform` 等會讓 fixed 定位失效的樣式。推測是 iOS Safari 的已知行為——捲動時網址列收合、可視區域變高，`position: fixed` 元素在某些情況下沒有正確重新計算，導致遮罩維持在插入當下算出來的（較矮的）高度，底部露出縫隙。檢查過 `main.ts` 目前完全沒有「開啟彈窗時鎖定背景捲動」的邏輯（`appendModalShell()`／`appendBadgeUnlockModal()` 都沒有），已在 handoff 裡給出用 `position: fixed` 鎖定 `body`（不是單純 `overflow: hidden`，那個在 iOS Safari 上常鎖不住）、記錄／還原捲動位置的具體實作，這也是解決這類問題業界常見的做法。這一項沒辦法在沒有瀏覽器的環境確認是否真的解決，已在 handoff 裡註明要請使用者在真機上實測確認，並列了如果鎖定捲動還不夠的候選候補方向（強制捲回頂部、`100dvh` 相關技巧）。

這三項都只動 `app/src/style.css`／`app/src/main.ts`，`content/` 不受影響，我這邊沒有進一步修改 content 端。

### 9.96 短文朗讀 "Mia" 拼讀 bug 排查結案：確認跟語速無關，改用換名字解決（2026-08-28）

承接上一節（9.95）留下的排查缺口——使用者實際在真實瀏覽器測過：**開啟慢速模式（0.6）跟一般語速（0.9）朗讀 Pronouns 短文，"Mia" 都一樣被拼成 "M-I-A"**，兩種語速結果相同。這證實 9.95 節的假設（語速被大幅調低時較容易誤判）並不成立，語速快慢跟這個 bug 完全無關；問題出在 "Mia" 這個字本身（三個字母、大寫開頭，外觀跟 "USA"／"FBI" 這類縮寫詞很像），瀏覽器語音引擎的文字正規化規則本身就容易把它誤判成需要逐字母拼讀的縮寫，不管唸多快多慢都一樣。

- **撤掉不對症的修法**：`speech.ts` 移除 9.95 節新增的 `PASSAGE_SLOW_RATE = 0.75`／`currentPassageRate()`，`speakPassage()` 改回跟 `speakEnglish()` 共用同一組 `currentRate()`（`NORMAL_RATE = 0.9`／`SLOW_RATE = 0.6`），因為分岔出第二組倍率並沒有解決問題，只是徒增程式複雜度，維持單一組語速設定比較好維護。
- **改用內容層面修法**：跟使用者確認後，直接把三篇短文裡的角色名字 "Mia" 全部改成 "Ella"（三個字母→四個字母，外觀比較不像縮寫詞，且專案內尚未用過這個名字，不會跟既有角色撞名）：
  - `content/passages/pronouns.json`：短文本文「She is Mia, my friend.」→「She is Ella, my friend.」，題目 1 的選項「Mia」→「Ella」。
  - `content/passages/food_drink.json`：短文本文「My name is Mia.」→「My name is Ella.」，題目 1／2 的問句（"What does Mia want..."／"What does Mia's brother..."）同步改成 Ella／Ella's。
  - `content/passages/personality_traits.json`：短文本文「Mia is quiet and shy...」→「Ella is quiet and shy...」，題目 2 的問句與 `source_sentence` 同步改成 Ella。
  - `app/scripts/verify-passage-glossary.ts` 的 `EXPECTED_UNCOVERED`（短文裡「預期查不到中文意思」的人名/文法字排除清單）三個對應主題（`pronouns`／`food_drink`／`personality_traits`）裡的 `"mia"` 同步改成 `"ella"`。
- **這個方向比較根本的原因**：換名字是保證有效、不需要實際聽過確認的做法（跟語速調整不同，這次不是「猜測性修法」）；相對地，如果要在程式層面用類似 `AMBIGUOUS_STANDALONE_WORDS` 那種「唸的時候換一個發音相同的拼法」的替換技巧，需要實際在瀏覽器裡聽過替代拼法唸起來像不像 "Mia" 才能確認有沒有用，沒有瀏覽器沒辦法做這件事；而且未來如果新增的短文角色剛好也用到其他容易被誤判的短名字（例如 Ben／Tom／Amy／Lily 這類三四個字母的名字都有理論上的風險，只是目前沒被回報出問題），這個「發現就直接換名字」的處理方式也比較容易重複套用，不用每次都另外寫一組替換邏輯。

驗證：`npm run build`（`tsc --noEmit && vite build`）通過；全部 21 支 `verify-*.ts` 重跑皆通過（含更新後的 `verify-passage-glossary.ts`）；`grep -rl "Mia" content/ app/src/` 確認三篇短文內容跟程式邏輯都沒有殘留 "Mia"（`app/src/speech.ts` 裡保留的是說明這次排查歷史的註解文字，不影響實際朗讀行為）；`dashboard.html`／`content-review.html`／`demo-standalone.html`（App 端與專案根目錄兩份都同步）皆已重新產生。

**待使用者確認**：換名字這個修法理論上一定有效（因為問題字本身換掉了），但沒有瀏覽器還是沒辦法實際聽過，麻煩實測一下 Pronouns／Food & Drink／Personality Traits 三篇短文朗讀 "Ella" 時發音正常，沒有再出現類似的拼讀問題。

### 9.95 App 端執行：`.stage-banner` 手機版 RWD 修正＋短文朗讀 "Mia" 拼讀 bug 排查（2026-08-28）

承接上一節（9.94）內容端寫的 `docs/handoff-prompt-stage-banner-rwd-and-passage-tts-bug.md`，這次由 App 端 session 執行兩項修正：

- **`.stage-banner` 窄螢幕 RWD**：`style.css` 在 `.stage-banner` 相關規則後面新增 `@media (max-width: 640px)` 區塊，把 `.stage-banner` 改成 `flex-direction: column; align-items: stretch;`，`.stage-banner-actions` 改成 `justify-content: flex-end;`——640px 以下標題文字獨占一整列，「🐢 慢速」「← 返回選單」按鈕群組換到下面單獨一列並靠右對齊，不再被擠壓成窄直條逐字換行。桌面／平板寬度（斷點外）維持原本 `justify-content: space-between` 的左右排列，不受影響。新增 `app/scripts/verify-stage-banner-responsive.ts`（3 個測試：斷點內 `.stage-banner` 是否改成 column、`.stage-banner-actions` 是否靠右對齊、斷點外預設規則是否維持原樣），跟現有 `verify-brand-banner-responsive.ts` 同一套做法。
  - **附帶修正**：新增這個 `.stage-banner` 的 640px 媒體查詢後，`style.css` 裡同時存在三個 `@media (max-width: 640px)` 區塊（`.stage-banner`／`.brand-banner--user`／`.profile-stats-grid`），導致 `verify-brand-banner-responsive.ts` 原本「抓檔案裡第一個 640px 媒體查詢」的天真假設失效，錯誤比對到桌面版預設的 `.brand-banner.brand-banner--user { ... }` 規則（不在媒體查詢內，恰好排在新插入的 `.stage-banner` 區塊跟真正的手機版覆寫區塊之間）。已改用「`.brand-banner.brand-banner--user {` 必須緊接在 `@media (max-width: 640px) {` 開頭之後（中間只能有空白/換行）」的嚴格錨點重新鎖定正確區塊，5 個測試全部恢復通過。
- **短文朗讀 "Mia" 拼讀問題排查結論**：`speech.ts` 新增 `PASSAGE_SLOW_RATE = 0.75`（比一般慢速 `SLOW_RATE = 0.6` 保守），新增 `currentPassageRate()`，只有 `speakPassage()`（短文整篇朗讀）改用這個較保守的倍率，`speakEnglish()`（單字／句子朗讀）維持原本的 `SLOW_RATE = 0.6` 不變——因為單字/句子朗讀的文字通常很短，跟整段短文比起來誤判逐字母拼讀的風險本來就比較低，沒有必要跟著調整。
  - **重要限制說明**：這個修法是根據 handoff prompt 裡的推論（語速被大幅調低時，TTS 引擎對短專有名詞的誤判機率變高）直接採用的候選修法之一，**沒有辦法在這個沒有瀏覽器/音訊的沙盒環境裡實際聽過確認**。`npm run build` 跟全部 `verify-*.ts` 都通過（純邏輯層面確認 rate 數值有正確分流），但「調到 0.75 是否真的解決 Mia 被拼讀、同時聽感還是有明顯變慢」這件事需要使用者在真實瀏覽器裡實測確認：麻煩開啟慢速模式後，分別朗讀 Pronouns（「She is Mia, my friend.」）跟 Food & Drink 短文（兩篇都有 Mia），確認讀音恢復正常；也建議順便測一次一般語速（慢速關閉）確保沒有意外改到不該動的地方。如果 0.75 聽起來還是會拼讀，可以再往上微調（例如 0.8），或考慮 handoff prompt 裡提到的另一個候選方向（排除特定語音引擎）。

驗證：`npm run build`（`tsc --noEmit && vite build`）通過；全部 21 支 `verify-*.ts`（含新增的 `verify-stage-banner-responsive.ts`、修正後的 `verify-brand-banner-responsive.ts`）重跑皆通過；手動 grep 打包後的 `dist/assets/*.css`／`*.js` 確認 `.stage-banner{flex-direction:column` 跟慢速倍率 `.75` 都有進到最終產出；`demo-standalone.html`（含專案根目錄那份）已重新產生。

### 9.94 使用者手機實測回饋：Greetings 例句拆解＋兩個 App 端 bug handoff（2026-08-28）

正式站上線後使用者用手機實測，回報三個問題：

1. **Greetings 例句過於複雜**：`content/sentences/greetings.json` 原本只有 4 句，每句都是把 3 個不相關（甚至互斥，例如「早安！午安！」時段矛盾）的招呼語硬湊成一句疊加句，Stage B-1／B-2 玩起來像在解一句拼裝的長句而不是學一個簡單招呼語。已直接重寫成 10 句、每句只講一個單一情境的自然短句（早安／午安／晚安道別／自我介紹前招呼／初次見面／道別／道歉／禮貌請求／感謝與回應各自獨立成句），大部分句子直接沿用 `content/vocab/greetings.json` 裡各單字本來就有的 `example_sentence` 草稿（本來就是簡單自然的句子，一魚兩吃）。13 個單字裡故意跟原本一樣不含 `good evening`（維持跟原設計一致的覆蓋範圍）。`npm run build`、`verify-multi-topic.ts`／`verify-ordering-logic.ts`／`verify-fillblank-logic.ts`／`verify-passage-glossary.ts`／`verify-capstone-questions.ts` 全部重跑通過；`dashboard.html`／`app/content-review.html`／`demo-standalone.html`（含根目錄那份）都已同步重新產生。句數從 4→10，Stage B-1/B-2 單輪題數會變多，如果之後使用者覺得單元 0 玩起來太長，可以再考慮精簡。
2. **`.stage-banner` 手機版 RWD 沒做好**：窄螢幕下標題文字被右側「慢速／返回選單」按鈕擠成一欄逐字換行的窄直條。已寫成 handoff prompt `docs/handoff-prompt-stage-banner-rwd-and-passage-tts-bug.md`，比照先前 `.brand-banner--user` 頭像疊字問題（`verify-brand-banner-responsive.ts`）的同一套做法，640px 斷點內把 `.stage-banner` 改成 `flex-direction: column`，純 CSS 修法，待 App 端 session 執行。
3. **短文朗讀時 "Mia" 被逐字母拼讀**：Stage C 朗讀 Pronouns 短文「She is Mia, my friend.」時，`Mia` 被瀏覽器語音引擎拼成 M-I-A。確認過 `speakPassage()` 是把原始短文全文直接丟給 `SpeechSynthesisUtterance`，程式面沒有拆字重組，判斷是瀏覽器 TTS 引擎本身的已知行為（短專有名詞在語速被大幅調低時容易被誤判成要逐字母拼讀），最可能與 2026-08-26 剛上線的慢速朗讀（`SLOW_RATE = 0.6`）交互作用有關。這邊沒有瀏覽器沒辦法重現/確認根因，已寫進同一份 handoff prompt，附排查步驟（先測關閉慢速是否恢復正常）與候選修法（調高 `SLOW_RATE` 或排除特定語音），交給 App 端 session 實測後處理。

### 9.93 Phase 3 完成：GitHub Pages 正式上線（2026-08-27）

`git push`（SSH）成功後，GitHub Actions 第一次執行 `deploy.yml` 失敗，`configure-pages@v5` 回報 `HttpError: Not Found`——原因是 repo 的 Settings → Pages → Source 預設是「Deploy from a branch」，Actions 部署模式需要先手動切換成「GitHub Actions」，否則 Pages 站台根本還沒建立。經使用者明確同意（「你直接幫我處理」）後，直接用瀏覽器工具進到 repo 設定頁把 Source 切成「GitHub Actions」，再回到失敗的 workflow run 用「Re-run all jobs」重新觸發一次，這次 build／deploy 兩個 job 都成功（deploy 10s 完成），正式站確認可以打開：<https://78vince.github.io/english-for-kids/>。

首次進站提醒 popup 已確認在正式站上正常運作（見第 9.88 節，App 端 session 已執行完成，`docs/handoff-prompt-welcome-notice-and-about-usage-section.md` 這份 handoff 不用再追）。`README.md` 已更新為 Phase 3 完成狀態並補上正式站網址，Phase 3 全部項目結束，下一步是 Phase 4（延後）或既有的體驗優化項目。

頁面左右側裝飾性背景（羊毛氈字母，見前面規劃討論）使用者決定暫緩不做，`README.md` TODO 已註記這項先擱置，不是遺漏。

### 9.92 Phase 3 執行：git 初始化＋首次 commit＋GitHub Pages 部署 workflow（2026-08-27）

使用者說「下一步」，延續 Phase 3 規劃，開始執行技術性、不涉及 `app/src/*.ts` 的部分。

- 清掉一個先前處理徽章備份 zip 時失敗留下的 39MB 暫存殘檔（`zixF1EGs`，因為連結資料夾的檔案刪除保護機制擋下，改用 `allow_cowork_file_delete` 取得授權後刪除）。
- `.gitignore` 新增排除 `English-for-Kids-backup-*.zip`——備份壓縮檔（8/19、8/26 兩份，共約 118MB）是專案本身的重複快照，不適合進版本控制，另外用 zip 存放即可。
- 新增 `.github/workflows/deploy.yml`：push 到 `main` 分支時自動觸發，`actions/checkout` → `actions/setup-node@v4`（Node 20，快取 `app/package-lock.json`）→ `npm ci`／`npm run build`（皆在 `app/` 目錄下執行）→ `actions/upload-pages-artifact`（路徑 `app/dist`）→ `actions/deploy-pages` 部署，也保留 `workflow_dispatch` 手動觸發選項。`app/vite.config.ts` 原本就有 `base: "./"` 的相對路徑設定，跟這個 workflow 產出的 `dist/` 直接搭配，不用再調整。
- `git init`（分支重新命名為 `main`，跟 workflow 觸發條件一致）、設定 `user.name`／`user.email`，`git add -A` 後首次 commit（426 個檔案），排除 `node_modules/`／`dist/`／備份 zip 後 `.git` 目錄約 38MB。
- **還沒完成、需要使用者自己操作的部分**：在 GitHub 上建立一個新的空 repo（不要勾選自動產生 README/gitignore/license，本地端都已經有了）、把本機 repo 加上遠端網址並 push、到 repo 的 Settings → Pages 把來源設定改成「GitHub Actions」——這幾步需要使用者自己的 GitHub 帳號授權，這邊環境沒有 GitHub 登入權限，沒辦法代為執行。
- 不涉及 `content/` 資料或任何 App 邏輯，不用重跑 `verify-*.ts`。

### 9.91 Phase 3 規劃調整：GitHub Pages 直接取代 Demo 頁面＋撰寫首次進站提醒 handoff prompt（2026-08-26）

使用者討論 Phase 3「Demo 展示頁面」這項，決定不用另外做展示版——直接把 `dist/` 部署上 GitHub Pages，正式站本身就是完整可玩的 Demo，不需要另外包裝。原本的「Demo 展示頁面」併入「GitHub Pages 部署」這一步，不再是獨立產出；`app/demo-standalone.html`（單檔版）保留作為「不想連網、想下載後離線玩」的備用選項，不用特別包裝。

因為要開放給不特定訪客使用（不再只是自家小孩），使用者要求登入前提醒幾件事（資料只存本機裝置、沒有密碼保護、不收集個資等），並且指出「使用者按了不再顯示之後會忘記」，所以要求同樣的說明要有個常駐、隨時能回去查看的地方——不只是一次性彈窗。

- 新增 `docs/handoff-prompt-welcome-notice-and-about-usage-section.md`，交給技術架構 session 執行兩件事：(1) `renderProfileSelect()`（「誰在玩？」畫面，任何人都還沒登入前）第一次進站彈出精簡版提醒（沿用既有 `appendModalShell()` 共用小視窗元件），用裝置層級的 localStorage 旗標（`englishForKids.settings.hasSeenWelcomeNotice.v1`，比照 `slowSpeech` 開關的模式，不分 profileId）記住已經看過，關閉方式（確認鈕／叉叉／點遮罩）都要記錄已讀；(2) 「關於本站」頁面新增常駐「使用須知」段落（放在故事段落之後、版本資訊之前），內容比彈窗版更完整，涵蓋：資料只存本機瀏覽器沒有雲端備份、登入無密碼保護公用電腦要留意、不收集上傳個資、多孩子共用裝置建議各自建名字、發音功能需要瀏覽器支援、專案由個人維護沒有正式客服。彈窗結尾加一句「之後想再看這些說明，可以到「關於本站」頁面查看」跟常駐段落互相呼應。
- 這次只完成 content 端能做的部分（設計文案、撰寫 handoff prompt），不涉及 `content/` 資料，不用重跑 `verify-*.ts`；`app/src/main.ts`／`style.css` 的實際改動留給技術架構 session 執行。

### 9.90 決定開源授權條款：CC BY-NC 4.0，補上 LICENSE（2026-08-26）

Phase 3（上架 GitHub）的唯一決定點——授權條款——使用者說明用途與考量後（在意會不會被拿去商業營利，不是單純想無限制流通），選擇「創用 CC 姓名標示-非商業性 4.0 國際」（CC BY-NC 4.0），涵蓋範圍是整個專案（程式碼＋`content/` 底下的課程內容）。

- 新增專案根目錄 `LICENSE`：中文條款摘要（分享／改作皆可，但需姓名標示、不得商業使用）＋官方中文說明頁與英文法律條款全文連結，版權標示「© 2026 Vincent（小禮）」。
- `README.md`「授權」段落從「尚未決定（TODO）」改成一句話說明＋連到 `LICENSE`；TODO 清單裡「決定並補上開源授權條款」項目打勾。
- Phase 3 剩餘步驟（git 初始化、GitHub repo 建立與 push、GitHub Pages 部署 workflow、Demo 展示頁面策略）尚未開始，`app/vite.config.ts` 已經預先設定 `base: "./"` 為將來部署鋪路，這次沒有改動。

### 9.89 撰寫「關於本站」底部裝飾圖＋介紹文字改寫 handoff prompt（2026-08-26）

使用者提供一張新素材圖（毛氈風格男孩＋字母怪獸插畫），要放在「關於本站」頁面最下方並隨螢幕寬度縮放；同時覺得現有介紹文字繞口，要求改寫得更易讀、多分段、加大行距。

- 原始素材裁切壓縮成 1200×670 JPG，存進 `app/src/assets/about-banner.jpg`（一般 import，不透過 `import.meta.glob`，跟 `app/src/assets/badges/*.jpg` 的徽章慣例是分開的兩套機制）。
- 新增 `docs/handoff-prompt-about-page-banner-and-copy.md`，交給技術架構 session 執行兩件事：(1) `renderAbout()` 底部插入 `<img class="about-banner-img">`，CSS 用 `width: 100%; height: auto;` 搭配 `#app` 既有的 `max-width: 1000px` 做響應式縮放；(2) 原本塞在單一 `<p>` 裡的介紹文字拆成三段更口語的版本（緣起／既有 App 的落差／自己動手做的原因），`.about-text` 的 `line-height` 從 1.6 調到 1.8、段落間距從 `--space-3` 調到 `--space-4`。
- 這次只處理 content 端能做的部分（圖片裁切壓縮、handoff prompt 撰寫），不涉及 `content/` 資料，不用重跑 `verify-*.ts`；`app/src/main.ts`／`style.css` 的實際改動留給技術架構 session 執行。

### 9.88 修正 WC-07「文法小幫手」徽章美術圖（2026-08-26）

延續 9.87 節記錄的已知問題：`WC-07.jpg` 原本放的是舊編號時期「環遊字世界」的熱氣球插畫，跟現在的徽章名稱「文法小幫手」語意不符。這次規劃了新概念並請使用者生成圖檔，用同一套裁切壓縮流程直接覆蓋掉 `app/src/assets/badges/WC-07.jpg`。

- **新概念**：主角是一隻圓滾滾黏土膠水罐怪獸（大眼睛、笑臉），正把印有 `A`／`THE`／`IS`／`AND`／`IN` 幾個基礎文法字的小木塊積木黏成一列小火車，呼應「文法小幫手＝把單字黏成句子的小零件」這個意象，不強行把 11 個子主題全部塞進畫面。邊框改用天藍／湖水藍雙色麻花紋，跟其他張（粉／米／黃／綠／紫／粉／WC-08 金彩虹）區隔開，上緞帶「GRAMMAR HELPER」、下緞帶「WORD CONNECTOR」。
- 原始素材（`/Users/admin/VK Agent/image-generator-skill/for Kids/badge 2/WC-07.png`，1024×1024）用跟 9.87／9.7 節同一套流程（裁切壓縮成 200×200 JPG）覆蓋存回 `app/src/assets/badges/WC-07.jpg`，`badgeImages.ts` 不用改任何程式碼，檔名對應機制自動生效。
- `npm run build`（`tsc --noEmit && vite build`）通過；`demo-standalone.html` 已重新產生並覆蓋專案根目錄。不涉及 `content/` 資料，`content-review.html`／`dashboard.html` 未重新產生。
- 至此 8 個「主題／單元完成度」徽章（WC-01~08）全部都有語意正確的美術圖，9.87 節記錄的已知問題已解決。

### 9.87 補上 WC-08「環遊字世界」徽章美術圖（2026-08-26）

使用者提供已生成好的徽章原圖（`/Users/admin/VK Agent/image-generator-skill/for Kids/badge 2/WC-08.png`，1024×1024），要求換上去。

- 依既有流程（見 9.7 節）處理：原圖裁切壓縮成 200×200 的 JPG 縮圖，存成 `app/src/assets/badges/WC-08.jpg`；`badgeImages.ts` 用 `import.meta.glob` 依檔名自動對應徽章代號，不用改任何程式碼，`WC-08.jpg` 存進去就會自動顯示，不用再退回藍色底色＋代號的佔位圖。
- `npm run build`（`tsc --noEmit && vite build`）通過，grep 打包後的 `dist/assets/*.js` 確認 `WC-08` 有進到最終產出；`demo-standalone.html` 已重新產生並覆蓋專案根目錄。不涉及 `content/` 資料，`content-review.html`／`dashboard.html` 未重新產生。
- **已知未解的美術素材問題**：`app/src/assets/badges/WC-07.jpg` 目前放的其實是舊版編號時期「環遊字世界」的熱氣球+地球插畫（文字「WORD EXPLORER」／「ALL WORLDS MASTER」），2026-08-25（9.83 節）徽章重新編號後，`badges.json` 裡的 `WC-07` 代號已經改成「文法小幫手」，但這張圖沒有跟著換——也就是說**現在的 `WC-07` 徽章（文法小幫手）畫面上顯示的是語意不符的舊圖**，需要另外設計一張真正對應「文法小幫手」主題的新圖，並把現有 `WC-07.jpg` 這張熱氣球圖處理掉（或保留原始素材另作他用）。這次只處理了使用者明確要求的 `WC-08`，`WC-07` 的錯圖問題留待下次一併處理。

### 9.91 「誰在玩？」首頁底部加入品牌介紹文字＋插畫（2026-08-27）

使用者要求在「誰在玩？」（`renderProfileSelect()`，登入前的第一個畫面）最下方加上本站的說明文與插畫，讓 Phase 3 開放給不特定訪客時，還沒登入就能立刻知道「這是什麼」，不用特地點進「關於本站」。

- `renderProfileSelect()` 在使用者清單／新增使用者流程之後，新增跟「關於本站」頁面同一份標語（「English for Kids - 每天玩一點英語！」）＋三段故事文字（沿用 `.about-text`／`.about-tagline` 樣式）＋底部插畫（`aboutBannerUrl`，沿用 `.about-banner-img` 樣式），插畫一樣隨容器寬度響應式縮放。
- 刻意只放「品牌介紹」這個核心區塊，不重複「使用須知」段落跟版本／作者資訊那些次要內容，避免登入前的畫面塞太多東西——這些完整資訊仍只在「關於本站」頁面看得到。
- 這段內容是直接複製貼上（不是抽成共用函式），因為 `renderAbout()` 內部有 `verify-about-page.ts` 用整段函式內文比對的既有驗證，抽成共用函式必須改動 `renderAbout()` 的寫法才能重複使用，有弄壞既有驗證的風險；直接複製一份不會動到 `renderAbout()`，是風險最低的做法。
- 首次進站提醒 pop（`appendWelcomeNoticeModal()`）維持疊在最上層，不受影響。
- `content/` 完全沒動；`npm run build`（`tsc --noEmit && vite build`）與全部 21 支 `verify-*.ts` 皆通過。
- `content-review.html`／`dashboard.html` 與此改動無關，未重新產生；`demo-standalone.html` 已重新產生並覆蓋專案根目錄。

### 9.90 學習成就宮格排版：遊玩時間拆兩行＋窄螢幕響應式（2026-08-27）

使用者截圖回報「學習成就」宮格在窄螢幕（手機寬度）下的兩個問題：累計遊玩時間「1 小時 17 分」被瀏覽器隨機斷行切成「1 小/時 17/分」等殘缺片段；固定 3 欄的宮格在窄容器裡每欄只剩不到 100px，其餘卡片的標籤文字（例如「累計答對題數」）也被硬擠斷行。同時要求順便檢查全站的響應式設計與文字字級。

- **遊玩時間拆行**：`playTime.ts` 新增 `formatPlayTimeLines(ms)`，回傳最多兩個字串的陣列（第一行小時、第二行分鐘，例如 `["1 小時", "17 分"]`；不到 1 小時或整數小時則只回傳一行），刻意不動原本的 `formatPlayTime()`（`verify-playtime-logic.ts` 還在用它的精確字串比對，這個新函式是額外加的，不影響既有驗證）。`renderProfileAchievementsGrid()` 改用 `formatPlayTimeLines(playTimeMs).join("<br>")` 當作卡片的 `value`，讓小時／分鐘固定各佔一行，不再交給瀏覽器隨機斷行；`.profile-stat-value` 補上 `line-height: 1.15`，兩行數字疊在一起不會太擠或太鬆。
- **宮格窄螢幕響應式**：`.profile-stats-grid` 原本寫死 `repeat(3, minmax(0, 1fr))`（跟使用者確認過「桌機至少三欄兩列」，故意不用 auto-fit），新增兩個 `@media` 斷點（沿用既有的 640px 斷點慣例）：≤640px 收成 2 欄（3 列）、≤420px 收成 1 欄（6 列），讓每張卡片在窄螢幕上有足夠寬度顯示完整標籤文字，不再被擠斷。
- **全站響應式／字級抽查**：順便檢查了其他主要版面元件——`.topic-grid`（`auto-fit, minmax(260px,1fr)`）、徽章清單 `.badge-row`（`auto-fill, minmax(200px,1fr)`）、`.avatar-picker`／`.profile-card`（`flex-wrap: wrap`）、功能列（`updateNavCompactState()` 用 `ResizeObserver` 動態量測，非固定斷點）、品牌橫幅（既有 640px 斷點已處理窄螢幕堆疊＋字級縮小）都已經是響應式安全的寫法，沒有發現其他跟這次「固定多欄擠壓」同類型的問題，這次只需要修 `.profile-stats-grid` 這一處。
- `npm run build`（`tsc --noEmit && vite build`）與全部 21 支 `verify-*.ts` 皆通過（`formatPlayTime()` 沒被動到，`verify-playtime-logic.ts` 原本的精確字串比對不受影響）；手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認新的 `@media` 斷點與 `formatPlayTimeLines()` 的回傳邏輯都有進到最終產出。
- 不涉及 `content/` 資料，`content-review.html`／`dashboard.html` 未重新產生；`demo-standalone.html` 已重新產生並覆蓋專案根目錄。

### 9.89 全站 modal 卡片（.modal-card）padding／圓角加大（2026-08-27）

使用者覺得 pop 視窗（`appendModalShell()` 共用外殼，涵蓋首次進站提醒、變更頭像、修改名稱、獲得新徽章共四種 pop）看起來太侷促，要求 padding 跟四個圓角都加大一些。`.modal-card` 的 `padding` 從 `var(--space-5)`（24px）調到 `var(--space-6)`（32px）、`border-radius` 從 `var(--radius-lg)`（24px）調到 `var(--radius-xl)`（32px），都是既有 design tokens 往上一階，沒有新增數值。因為所有 pop 共用同一個 `.modal-card` class 且沒有任何 modifier 覆蓋 padding／border-radius，這次調整一次套用到全部四種 pop。`npm run build` 與全部 21 支 `verify-*.ts` 皆通過，`demo-standalone.html` 已重新產生並覆蓋專案根目錄。

### 9.88 首次進站提醒 popup＋「關於本站」常駐「使用須知」段落（2026-08-27）

Phase 3 準備把 App 直接部署到 GitHub Pages 開放給不特定訪客使用，跟原本只給自己家小孩用的情境不一樣，需要在登入前提醒幾件事（資料只存本機、沒有密碼保護等）。

- **首次進站提醒**：新增裝置層級（不分使用者，比照 `slowSpeech` 開關的存法）的 localStorage 旗標 `englishForKids.settings.hasSeenWelcomeNotice.v1`，`hasSeenWelcomeNotice()`／`markWelcomeNoticeSeen()` 兩個輔助函式；`renderProfileSelect()`（「誰在玩？」畫面，此時還沒有任何 `activeProfile`）最後加上判斷，沒看過就呼叫 `appendWelcomeNoticeModal()`，沿用既有的 `appendModalShell()` 外殼，內容是精簡版四點條列（資料只存本機沒有雲端備份／登入無密碼保護／不收集個資／建議每個孩子各自建立名字）＋一句提示可到「關於本站」看完整版。
  - **關閉即已讀的細節**：`appendModalShell()` 的右上角叉叉／點遮罩關閉都共用同一個 `closeProfileDetailModal()`，沒有專屬的關閉 callback 可以掛，所以改成在 `appendWelcomeNoticeModal()` 一開始（畫面出現的當下）就直接呼叫 `markWelcomeNoticeSeen()`，而不是等使用者按下確認鈕才記錄——這樣不管最後用哪種方式關閉，下次都不會再跳出來，不會有「用叉叉關掉但沒被記到」的落差。
- **「關於本站」常駐「使用須知」段落**：`renderAbout()` 在 `aboutFeedback`（回饋短句）之後、`metaText`（版本資訊）之前，新增一個 `<h2 class="section-heading">使用須知</h2>` 標題＋六段完整版說明（學習紀錄只存本機沒有雲端同步／登入無帳密機制＋公用電腦風險／純前端不收集個資／多孩子共用裝置建議各自建立名字／發音功能依賴瀏覽器語音合成／獨立維護小專案的免責聲明），跟彈窗精簡版互相呼應但不完全重複，讓使用者忘記彈窗內容時能隨時回來查看完整版。`section-heading` 是既有樣式（「學習成就」「帳號設定」都在用），沒有新增樣式。
- CSS 新增 `.modal-text`／`.modal-text--muted`（modal 內文的通用段落樣式，跟 `.about-text` 是同一套字級 token 但獨立 class，因為 modal 卡片版面跟頁面段落不一樣）／`.welcome-notice-list`（條列清單樣式）。
- `content/` 完全沒動，不涉及任何主題資料或成效追蹤／徽章邏輯。
- `npm run build`（`tsc --noEmit && vite build`）通過；雖然這份 handoff prompt 說不用重跑 `verify-*.ts`，仍照慣例全部 21 支重跑一次確認皆通過；手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認新字串／class（`englishForKids.settings.hasSeenWelcomeNotice.v1`、`welcome-notice-list`、「使用須知」、「開始之前，先跟你說幾件事」、`modal-text`）都有進到最終產出。
- `content-review.html`／`dashboard.html` 與此改動無關，未重新產生；`demo-standalone.html` 已重新產生並覆蓋專案根目錄。

### 9.87 「關於本站」頁面加上底部裝飾圖＋介紹文字改寫（2026-08-26）

使用者提供新素材圖（毛氈風格男孩＋字母怪獸插畫，已處理成 `app/src/assets/about-banner.jpg`，1200×670 JPG），要放在「關於本站」頁面最下方並隨螢幕寬度縮放；同時覺得原本介紹文字太長、不好讀，要求改寫得更順、分段更清楚，並加大行距。

- `main.ts` 新增 `import aboutBannerUrl from "./assets/about-banner.jpg";`，`renderAbout()` 最後（`metaText` 之後）新增一個 `<img class="about-banner-img">`，`alt=""`（純裝飾，跟其他頭像圖 alt 慣例一致）。
- 原本一整段的 `aboutText` 拆成三段更口語的版本（`aboutText1`／`aboutText2`／`aboutText3`），語意不變但轉折更順、分段更清楚；`aboutTagline`（標語）、`aboutFeedback`（回饋短句）、`metaText`（版本號／作者／email）三個元素文字都沒動，維持在四段介紹文字之後。
- CSS：`.about-text` 的 `line-height` 從 1.6 調到 1.8、段落間距 `margin` 從 `--space-3` 調到 `--space-4`（現在有 4 段，需要更明顯的呼吸空間）；新增 `.about-banner-img`（`width: 100%; height: auto;`，靠 `#app` 本身的 `max-width: 1000px` 自動響應式縮放，不用寫 media query；`margin-top: var(--space-7)` 跟內文段落拉開，做出「圖片是獨立裝飾區塊」的視覺區隔）。
- `content/` 完全沒動，不涉及任何主題資料或成效追蹤／徽章邏輯，不需要重跑 `verify-*.ts`。
- `npm run build`（`tsc --noEmit && vite build`）通過，`vite build` 產出確認新增 `dist/assets/about-banner-*.jpg`（142.77 kB）。
- `node scripts/build-standalone-demo.mjs` 重新產生 `app/demo-standalone.html`（圖片內嵌成 base64，檔案約 1.95 MB，比加圖前的版本大約增加 200KB 左右，屬預期範圍內，沒有異常暴增），已 `cp` 覆蓋專案根目錄那份。
- `content-review.html`／`dashboard.html` 與此改動無關，未重新產生。
- **後續修正（同日）**：使用者回報打開 `demo-standalone.html` 看不到新內容。追查發現 `vite.config.ts` 的 `assetsInlineLimit` 原本設 100000（100KB），是為了確保小型素材（頭像、音效、徽章圖）都能被 inline 成 base64 塞進單一 HTML；但這次新增的 `about-banner.jpg` 有 142.77KB，超過門檻，被 Vite 當成獨立檔案輸出（`new URL(...).href` 參照），standalone 版本抓不到那個獨立檔案，圖片自然顯示不出來（因為沒有寬高，整個 `<img>` 直接塌陷成看不見，連破圖示都沒有）。修法：把 `assetsInlineLimit` 拉高到 200000（200KB），重新 `npm run build`＋`node scripts/build-standalone-demo.mjs`，確認 `dist/` 建置結果不再產生獨立的 `about-banner-*.jpg`、`demo-standalone.html` 裡的圖片 src 變成正常的 `data:image/jpeg;base64,...`。同時發現既有的 `verify-about-page.ts`（測試 6）還在檢查舊版單一大段落的文字（「於是我決定自己動手做一個更適合這個學習階段的平台」），這份 handoff prompt 執行時說「不用重跑 verify」但沒注意到這支腳本剛好卡到被改掉的文案，已經把斷言字串同步改成新版三段式文字的其中一句（「所以我決定自己動手做一個更適合小學階段的英語學習平台」），全部 21 支 `verify-*.ts` 重跑後確認皆通過。`demo-standalone.html` 已重新產生並覆蓋專案根目錄。

### 9.86 「獲得新徽章」pop 加上紙花掉落動畫（2026-08-26）

使用者看了 demo 截圖後，要求徽章解鎖 pop 出現時能有紙花散落的歡樂效果。

- `main.ts` 新增 `buildConfettiOverlay()`：純視覺裝飾，產生 36 片 `.confetti-piece`，每片的起始水平位置、掉落延遲、掉落時間（2~3.2 秒隨機）、水平飄移距離、初始旋轉角度都是隨機決定（透過 inline CSS custom properties 傳給對應的 CSS 動畫），配色沿用既有 design tokens 的強調色（`--color-accent-yellow`／`--color-accent-orange`／`--color-accent-pink`／`--color-primary-500`／`--color-success`），沒有新增色票。
- `appendBadgeUnlockModal()` 在卡片之前插入這個紙花容器（DOM 順序在卡片前面，卡片維持蓋在最上層清楚可讀，紙花只在卡片周圍／畫面上方看得到）。
- CSS 新增 `.confetti-container`（`position: fixed; pointer-events: none;` 蓋滿全螢幕，不擋任何點擊）／`.confetti-piece`／`@keyframes confetti-fall`（從畫面頂端往下掉、邊掉邊轉、淡出）。
- 動畫只播一次（2~3.2 秒），不用 JS 計時器額外清除——因為 `render()` 每次重畫都會把 `#app` 整個砍掉重建，pop 一關閉紙花元素自然就跟著消失，不會有殘留。
- 沒有動到任何遊戲邏輯或徽章判斷，純粹是 `appendBadgeUnlockModal()` 裡新增的一段裝飾。
- `npm run build`（`tsc --noEmit && vite build`）與全部 21 支既有 `verify-*.ts` 皆通過；手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `confetti-container`／`confetti-piece`／`confetti-fall` 都有進到最終產出。
- 不涉及 `content/` 資料，`content-review.html`／`dashboard.html` 未重新產生；`demo-standalone.html` 已重新產生並覆蓋專案根目錄。

### 9.85 使用者回饋三項體驗優化：學習積分／慢速語速／單字總覽點開例句（2026-08-26）

使用者測試回饋三個獨立需求，經 handoff prompt 確認現有資料／程式碼可直接支撐，全部改動只動到 `app/src/`（`speech.ts`、`main.ts`、`style.css`，新增 `points.ts`），不動 `content/` 或任何 `verify-*.ts`。

- **學習積分**（個人檔案頁）：新增 `app/src/points.ts`，`computeLearningPoints(profileId, achievedBadgeCount)` 完全沿用既有統計（`badgeStats.ts` 的 `totalCorrectAnswered`／`perfectLevelAchievedCount`／`correctStreakAchievedCount`＋`countAchievedBadges()`）做加權加總（每題 10 分／完美關卡 50 分／連勝十題 30 分／每個徽章 100 分，皆為可調常數），本身不寫入任何新的 localStorage 資料，每次都是即時算出來的。`renderProfileAchievementsGrid()` 在六格數字卡片上方插入獨立的 `.learning-points-hero` 大數字區塊（實心品牌色底、字級比卡片數字更大），視覺上明顯是「總分」而非第七張卡片。
- **慢速語速切換**：`speech.ts` 新增 `isSlowSpeechEnabled()`／`setSlowSpeechEnabled()`，用一個全域開關（存在 `localStorage`，key 為 `englishForKids.settings.slowSpeech.v1`，刻意不依 profileId 分開存——這是裝置層級的聽力偏好，不是學習成效資料，不管誰登入開關狀態都一致）控制 `speakEnglish()`／`speakPassage()` 的 `utterance.rate`（正常 0.9／慢速 0.6）。UI 只加在 `stageHeader()`（所有題型畫面＋單字總覽共用的橫幅）：把原本單獨的返回鍵包進新的 `.stage-banner-actions` 右側動作區，跟新增的「🐢 慢速」切換鈕並排，點擊會呼叫 `render()` 讓按鈕文字／`active` 樣式立刻反映新狀態；`renderVocabOverview()` 也走 `stageHeader()`，自動一起拿到這顆按鈕。
- **單字總覽點開例句**：核對過全站 43 個主題、897 個單字已 100% 補齊 `vocab.example_sentence`（字卡暖身原本的過時註解「目前只有 Family／Colors／Animals & insects 補了」已一併更新）。抽出共用函式 `buildExampleSentenceBlock(example)`（英文例句＋專屬 🔊 播放鍵＋中文翻譯，沿用 `.flashcard-example` 既有樣式），字卡暖身跟新的單字總覽/收藏清單展開面板都呼叫同一份，不再各寫一次。`buildVocabOverviewRow()`（單字總覽／收藏清單共用）改成：原本的一列拆成 `.vocab-overview-row-main`（英文/詞性/中文＋播放鍵＋收藏星星，維持原樣）＋有 `example_sentence` 才出現的「例句 ▾／▴」展開鈕＋預設隱藏的例句面板，點擊用 CSS `hidden` 屬性 toggle，不用整頁重新 render；沒有例句欄位的字（理論上不存在，但保留防呆判斷）不會顯示展開鈕。
- 三項都不影響 `MatchingGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`FlashcardGame`／`buildCapstoneQuestions` 等遊戲邏輯，也不影響 `progress.ts`／`badgeStats.ts` 的寫入邏輯——積分只讀不寫，`content/badges/badges.json` 不用改。
- `npm run build`（`tsc --noEmit && vite build`）與全部 21 支既有 `verify-*.ts` 皆通過；手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認新字串／class（`learning-points-hero`、`slow-speech-toggle-btn`、`vocab-overview-example-toggle-btn`、`englishForKids.settings.slowSpeech.v1`、「學習積分」、「慢速中」、「例句」）都有進到最終產出。
- 不涉及 `content/` 資料或任何主題清單，`content-review.html`／`dashboard.html` 未重新產生；`demo-standalone.html` 已重新產生並覆蓋專案根目錄。

### 9.84 語音朗讀優先挑選女聲（2026-08-26）

使用者詢問語音腔調可調整選項，接著要求語音優先使用女聲。

- `app/src/speech.ts` 新增 `pickPreferredVoice()`：讀取 `window.speechSynthesis.getVoices()`，依名字關鍵字比對，優先選第一個名字含「female」或匹配已知女聲名單（Samantha／Zira／Aria／Karen／Google US English 等）的英文語音；都找不到時，退而避開已知男聲名單（Alex／Daniel／David／Mark 等）；如果連這個都選不到（例如清單整批都像男聲），就不指定 `voice`、維持瀏覽器預設。
- **重要限制**：`SpeechSynthesisVoice` 沒有正式的性別欄位，這份判斷完全靠名字關鍵字比對，語音清單本身也因使用者的裝置／瀏覽器／作業系統而不同，無法保證每個人都 100% 聽到女聲，只能做「盡量選、選不到就不出錯」。
- 因為 Chrome 等瀏覽器的語音清單是非同步載入的，加了 `window.speechSynthesis.onvoiceschanged` 監聽，第一次呼叫時清單若是空的，之後才會補齊快取。
- `speakEnglish()` 與 `speakPassage()`（單字發音、句子朗讀、短文整篇朗讀共用同一支模組）都套用了新的 `utterance.voice` 設定；`stopSpeaking()` 不受影響。
- 不涉及 `content/` 資料或 `main.ts` 的 `TOPICS`／`UNITS`，只改了 `speech.ts` 一個檔案。
- `npm run build`（`tsc --noEmit && vite build`）與全部 21 支既有 `verify-*.ts` 皆通過（這個改動沒有專屬驗證腳本，因為語音選擇效果需要實際瀏覽器環境才能聽到，開發沙盒沒有瀏覽器/喇叭，無法自動化驗證實際發聲效果，正式確認要靠 `demo-standalone.html` 在瀏覽器上實際點朗讀按鈕聽聽看）。
- 已重新產生 `demo-standalone.html` 並覆蓋專案根目錄；`content-review.html`／`dashboard.html` 與此改動無關，未重新產生。

### 9.83 新增單元七「文法小幫手」11 個主題，推翻「文法/功能詞不獨立成關卡」的原始政策（2026-08-25）

使用者要求把 `docs/content-plan.md` 3.2 節原本排除在外的 11 個「文法／功能詞類別」正式建成獨立的單元七，並明確指示：跨主題重複收錄同一個英文單字（同義時）是被允許、甚至是必要的，省略這些字會讓單一主題內容顯得不完整——不需要為了避免重複而犧牲完整性。

- **建置前置作業**：透過 Claude in Chrome 即時重新爬取來源網站，逐一核對 11 個分類的確切字表（不採信舊有摘要），過程中確認了單元三 Colors→Art、Numbers→Math 改版時就已存在的字表核對紀律持續適用。
- **11 個新主題**（`content/{vocab,sentences,passages,glossary}/<fileKey>.json` 四檔齊備，每個主題都有 3 題短文理解題）：
  - `advanced_pronouns` 代名詞總複習（17 字）
  - `wh_words_frequency` 疑問詞與頻率副詞（15 字）
  - `articles_determiners` 冠詞與限定詞（7 字：a/an／all／both／every／many／more／much）
  - `sentence_connectors` 造句小幫手（20 字：be動詞/助動詞 am/are/can/do/have/is/may/must/should/will＋連接詞 although/and/because/but/so＋感嘆詞 enough/excuse me/goodbye/hello/please）
  - `prepositions` 介系詞（24 字，**刻意排除 like**）
  - `other_nouns` 其他常用名詞（19 字，**刻意排除 can**）
  - `other_verbs_1`（28 字，**刻意排除 do**）／`other_verbs_2`（36 字，因原始候選字超過 60 個仿照 Time／Calendar 的拆法拆成兩個主題，補收 like 喜歡）
  - `other_adjectives_1`（25 字）／`other_adjectives_2`（19 字，同樣因候選字過多拆成兩個，**刻意排除 fun**，因為跟 other_adjectives_1 同義重複）
  - `other_adverbs_responses` 其他副詞與應答詞（15 字）
- **三個刻意排除字的同義撞名風險（避免了三個原本會發生的真實 bug）**：`like` 若以介系詞義（像）收進 `prepositions` 會蓋掉 5 個主題（wh_words_frequency／transportation／personality_traits／forms_of_address／weather_nature）依賴的全域動詞義（喜歡）——改成以動詞收進 `other_verbs_2`，順便讓那 5 個主題的查詢從 glossary 層級升到全域表層級；`do` 若以主要動詞義（做）收進 `other_verbs_1` 會蓋掉 `sentence_connectors` 已收錄的助動詞義，且會讓 `houses_apartments` 短文「We do not have a garden」的 do 顯示錯誤中文——直接排除；`can` 若以名詞義（罐頭）收進 `other_nouns` 會蓋掉 `sentence_connectors` 已收錄的助動詞義（可以），且 `articles_determiners` 短文依賴這個全域義——直接排除。三個判斷都是先推演 `globalVocabByEnglish`「後註冊蓋前註冊」的機制，找出目前依賴該字全域義的所有主題，再決定是否收錄，而非等測試腳本報錯才發現（測試腳本設計上就抓不到「查得到但語意錯」這種情況，只能抓「查不到」）。
- **`other_verbs_2` 建置時的一個自我修正**：最初漏算了字表裡的第 708 個字「like」，用 Edit 補收為 `voc.other_verbs_2.036`；同一個主題的短文草稿也曾誤把不在文字裡出現的「love」列進 `vocab_ids`，事後重新逐字核對文字後刪除。
- **兩次「同一份 glossary 檔案裡出現重複 key」的差點漏洞**（`other_verbs_2.json`／`other_adjectives_2.json` 各發生一次）：兩次都是短文裡先後用到「little」的兩種不同意思（小的 vs. 一點／有一點），若直接寫兩次同一個 key 會被 JSON 靜默覆蓋成最後一個值，導致其中一種用法顯示錯誤翻譯。兩次都改成把短文裡的「a little dim」改寫成「somewhat dim」，另外新增一個「somewhat」glossary 條目來迴避，不是靠改 key 名稱硬湊。
- **大規模 `EXPECTED_UNCOVERED` 連鎖修正**：`other_adverbs_responses` 新增的 again／away／too／not／then／very／still／together 這類極常見副詞，一口氣讓 pronouns／family／appearance／emotions／personality_traits／school／animals_insects／clothing_accessories／houses_apartments／transportation／pe_sports／prepositions 共 12 個既有主題同時受影響，改用批次 Python 腳本一次印出所有受影響主題、所有出現位置的前後文，人工逐一核對語意一致後才批次移除排除清單項目，全程沒有發現任何一次語意誤判。全部 11 個主題加總大約經歷了 10 輪這種連鎖修正，規模是全案目前為止最大的一次。
- **驗證腳本四處登記**：`app/scripts/verify-multi-topic.ts`／`verify-passage-glossary.ts`（`TOPICS` 陣列＋11 個新的 `EXPECTED_UNCOVERED` 項目＋十幾個既有主題的排除清單同步更新）／`app/scripts/build-content-review.mjs`（現在共 36 個主題）／`app/scripts/verify-unit-completion-badges.ts`（`AVAILABLE_TOPIC_FILE_KEYS` 新增 11 筆，新增 `unit7` 到 `UNITS` 陣列，新增「測試 11」驗證單元七的完成判斷邏輯與 `all_topics` 徽章的隔離性）全部更新並通過。
- **`content/badges/badges.json`**：新增 `badge.unit_completion.unit7`（文法小幫手，代碼 WC-07），原本的 `all_topics` 徽章代碼從 WC-07 往後遞補為 WC-08，條件說明文字從「全部 26 個規劃主題」更新為「全部 40 個規劃主題」（6+6+6+3+4+4+11=40）。
- **`docs/content-plan.md`**：單元表新增單元七那一列；3.1 節新增 2026-08-25 三 註完整記錄這次的範圍決定、字表核對方式、四個排除字的理由；3.2 節「文法／功能詞不獨立成關卡」標記為已作廢的歷史政策並說明推翻的理由；附錄 5 的「文法／功能詞類別」表格新增「最終 fileKey」與「實際字數」欄，對照原始規劃估計字數與最終真實收錄字數的落差。
- 全部 `verify-*.ts`（含新增的測試）、`npm run build` 都跑過確認全綠。
- App 端還需要 `main.ts` 的 `TOPICS`（新增 11 筆）／`UNITS`（新增 `unit7`，`topicFileKeys` 比照 `verify-unit-completion-badges.ts` 裡的清單）／`TOPIC_THUMBS`（新增 11 筆）三處改動才能真正在畫面上玩到，詳見新增的 `docs/handoff-prompt-unit7-grammar-topics.md`。
- **App 端已於 main.ts 執行完成**：`TOPICS` 新增 11 筆、`UNITS` 新增 `unit7`（單元七：文法小幫手，`topicFileKeys` 11 筆）、`TOPIC_THUMBS` 新增 11 筆縮圖設定，`style.css` 新增對應 11 個 `.thumb-*` CSS 規則（沿用既有 design tokens，無新色票）。`npm run build`（含 `tsc --noEmit`）與全部 21 支 `verify-*.ts` 皆通過；`app/scripts/build-dashboard.mjs` 已移除這 11 個主題的 `pendingAppWiring: true` 並重新產生 `dashboard.html`（現為 43 個主題，全部可玩，共 897 個單字、490 句、43 篇短文）；`demo-standalone.html`／`content-review.html`（36 個主題）皆已重新產生並覆蓋專案根目錄。全部 32 個原有正式主題＋單元七 11 個新主題，合計 43 個正式主題＋單元 0（2 個暖身主題），全站共 45 個主題現在都已接進 App 選單可玩。

### 9.82 Colors→Art、Numbers→Math 改名擴充，新增 Science 自然科學主題（2026-08-25）

使用者延續先前「學科擴充建議」的討論串，要求把單元三的 Colors 改為「美術課」、Numbers 改為「數學」，並加入其他學科項目。經 `AskUserQuestion` 兩輪確認範圍：調整方式選「直接改名＋擴充」（`fileKey` 不變，只調整顯示 `label` 並擴充新單字，比照先前 Tableware→Kitchen & Dining 的做法）；額外學科只選了 **Science 自然科學**。

- **`content/vocab/colors.json`（Art）**：核心 10 個＋進階 6 個，新增 16 字（paint／brush／scissors／glue／crayon／marker／sticker／paper／craft／art／canvas／palette／easel／clay／sketch／sculpture），19 字變 35 字。`content/sentences/colors.json` 新增 8 句（含補齊 gray／pink／purple／brown／color／orange 這 6 個先前就沒被任何例句涵蓋到的舊字，屬於這次改動之前就存在的缺口，順手一併補上），19 句變 19 句其中 3 句是這次為舊缺口補的。`content/passages/colors.json`／`content/glossary/colors.json` 整篇改寫，短文從「My Favorite Colors」換成「My Art Class」。
- **`content/vocab/numbers.json`（Math）**：運算概念 8 個＋形狀 5 個＋進階 6 個，新增 19 字（math／add／subtract／plus／minus／equal／count／shape／circle／square／triangle／star／heart／multiply／divide／pattern／calculator／more／less），30 字變 49 字。`content/sentences/numbers.json` 新增 11 句。`content/passages/numbers.json`／`content/glossary/numbers.json` 整篇改寫，短文從「A Fun Day at the Zoo」換成「My Math Class」。**star**（星形）刻意跟 Weather 既有的 star（星星）撞名，是跟 `cold` 同一種「不同主題各自收一份不同意思」的刻意重複。
- **新增 `content/vocab/science.json`（全新主題，`fileKey: "science"`）**：核心 12 個＋進階 8 個，共 20 字（science／experiment／observe／plant／seed／leaf／grow／magnet／energy／air／sound／planet／gravity／force／solid／liquid／gas／matter／battery／electricity），對應新建 `content/sentences/science.json`（11 句）／`content/passages/science.json`（短文「My Science Class」）／`content/glossary/science.json`。`plant`／`grow` 分別跟 Geographical Terms／Family 同義重複收錄，語意相同不算衝突。
- **修正一個真實的跨主題查詢 bug**：Art 新增獨立的「brush」（畫筆，名詞）條目後，`bathroom` 短文裡「brush my teeth」的 brush 會被 Art 的全域查詢表誤蓋成「畫筆」（因為 bathroom 原本只收了「brush teeth」片語，沒有單獨的 brush 動詞條目）。修正：在 `content/vocab/bathroom.json` 新增獨立的 `voc.bathroom.019`（brush＝刷，動詞），讓 bathroom 自己主題的查詢優先權蓋過全域表；同步更新 `content/sentences/bathroom.json`（新增 1 句）、`content/passages/bathroom.json`（vocab_ids 補上這個新 id），18 字變 19 字。
- **驗證腳本**：`app/scripts/verify-multi-topic.ts`／`verify-unit-completion-badges.ts`（`unit3.topicFileKeys` 從 5 個變 6 個，`AVAILABLE_TOPIC_FILE_KEYS` 新增 `science`，測試 9 的實際操作與訊息文字同步更新）／`verify-passage-glossary.ts`（`TOPICS` 新增 `science`，`colors`／`numbers`／`bathroom` 的 `EXPECTED_UNCOVERED` 排除清單同步更新）／`app/scripts/build-content-review.mjs`（新增 `science`，`colors`／`numbers` label 同步改成 Art／Math）全部更新並通過。全部 21 支 `verify-*.ts`、`npm run build`（含 `tsc --noEmit`）、`node scripts/build-standalone-demo.mjs`、`node scripts/build-content-review.mjs`（現在共 25 個主題）都跑過一次確認全綠，`demo-standalone.html` 已同步覆蓋根目錄那份。
- **`app/scripts/build-dashboard.mjs`**：`UNITS` fixture 裡 `colors`／`numbers` 的 label 改成「Art 美術」／「Math 數學」，新增 `science`（標記 `pendingAppWiring: true`，因為 App 端還沒接線）；重新產生 `dashboard.html`，現在是 32 個主題（31 個可玩＋1 個待接線）、672 個單字、279 句、32 篇短文；手動更新「開發階段」分頁 Phase 2 卡片文字反映這個過渡狀態（不在自動產生範圍內，比照 9.81 節的做法）。
- **`README.md`**：頂部狀態說明與 TODO 清單同步更新，新增一條「Phase 2 App 端接線（進行中）」項目說明 Science 選單接線與 Colors／Numbers 改名待下一輪 App 端執行。
- **`docs/content-plan.md`**：3.1 節單元三那一列更新，新增「2026-08-25 二」註記完整記錄這次的範圍決定、選字理由與跨主題衝突處理。
- **App 端已於 main.ts 執行完成（2026-08-25）**：`TOPICS` 陣列裡 `colors`／`numbers` 的 `label` 分別改成 `"Art 美術"`／`"Math 數學"`（`fileKey` 完全不動），並新增 `{ fileKey: "science", label: "Science 自然科學" }`；`UNITS` 的 `unit3.topicFileKeys` 補上 `"science"`（從 5 個變 6 個）；`TOPIC_THUMBS` 新增 `science: { emoji: "🔬", className: "thumb-science" }`，`colors`／`numbers` 的縮圖設定沿用不動，`style.css` 順手補上 `.thumb-science` 底色規則。`app/scripts/build-dashboard.mjs` 的 `science` 條目也拿掉 `pendingAppWiring: true`，重新產生 `dashboard.html` 現在是 32 個主題全部可玩、0 個待接線；`README.md` 的狀態說明與 TODO 也同步更新成「全部 32 個主題已上線」。沒有動任何遊戲邏輯。`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過；grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `Art 美術`／`Math 數學`／`science`／`.thumb-science` 都進到最終產出。`node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs`（現在顯示 25 個主題）重新產生，根目錄兩份複本都已同步。
- App 端還需要 `main.ts` 的 `TOPICS`（改兩個 label＋新增一筆）／`UNITS`（`unit3.topicFileKeys` 新增 `"science"`）／`TOPIC_THUMBS`（新增一筆）三處改動才能真正在畫面上玩到，詳見新增的 `docs/handoff-prompt-art-math-science.md`。App 端執行完之後記得把 `build-dashboard.mjs` 裡 `science` 的 `pendingAppWiring: true` 拿掉並重新產生 `dashboard.html`。

### 9.81 修正 dashboard.html「開發階段」分頁殘留的 Phase 2 過期文字（2026-08-25）

使用者截圖確認單元六（Time／Calendar／Holidays & Festivals／Sizes & Measurements）已經能在畫面上實際玩到。順手檢查 9.80 節的自動化更新有沒有遺漏，發現「開發階段」分頁的 Phase 2 卡片（狀態文字、進度條、條列項目、note）是手動維護的區塊，不在 `build-dashboard.mjs` 的 `<!-- AUTO-GENERATED -->` 標記範圍內，所以 9.80 重新產生時沒有覆蓋到，仍然殘留「5 個主題待技術架構 session 接線」的過期敘述。

- **`dashboard.html`**：手動把 Phase 2 卡片改成「● 已達標」／進度條 100%／條列項目與 note 都改成「全部 31 個主題都已接進 App」，跟已經更新過的總覽 KPI／內容進度條／統計表（顯示 0 個待接線）保持一致；標題徽章也從「Phase 2 進行中」改成「Phase 1／Phase 2 已達標，準備進入 Phase 3」。
- 這次只是修正遺漏的手動文字區塊，沒有動到 `build-dashboard.mjs` 的自動產生邏輯，也沒有動 content 或 App 程式碼。

### 9.80 App 端全部主題接線完成後，同步更新 build-dashboard.mjs／dashboard.html／README.md（2026-08-25）

9.79 節產生 dashboard.html 時，Bathroom／Time／Calendar／Holidays & Festivals／Sizes & Measurements 這 5 個主題在 `app/scripts/build-dashboard.mjs` 的 `UNITS` fixture裡都標記 `pendingAppWiring: true`（當時 `main.ts` 還沒接線）。這次確認這 5 個主題其實都已經在稍早的 session 裡陸續接進 `main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS`（Bathroom 見 9.77 節，單元六 4 個主題見 9.78 節），`build-dashboard.mjs` 的假設已經跟實際狀態脫節。

- **`app/scripts/build-dashboard.mjs`**：把這 5 個主題的 `pendingAppWiring: true` 全部移除，頂部標題副標同步改成「全部正式主題已接進 App，含單元六」。
- 重新跑 `node scripts/build-dashboard.mjs`：`dashboard.html` 的 KPI／進度條／統計表／主題內容卡片全面更新為「31 個主題（31 個可玩＋0 個待接線）」，不再顯示「待技術架構 session 接線」的提示。
- **`README.md`**：頂部狀態說明從「Phase 2 開發中，5 個主題待接線」改成「Phase 2 大致完成，準備進入 Phase 3」；TODO 清單裡原本 `[ ] Phase 2 進行中：App 端接線` 那一項改成 `[x]`，內容改成「全部 31 個主題都已接進 main.ts」。
- **驗證**：`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過（這次沒有動任何 App 邏輯或 content 資料，純粹是儀表板/文件資料同步）。

### 9.79 進度總結＋重新產生 dashboard.html（2026-08-25）

使用者要求總結目前進度並更新相關數據資料。趁這次機會發現根目錄的 `dashboard.html` 是很久以前（2026-08-19，單元三剛完成時）手動謄打的靜態快照，之後這段期間（Colors／Numbers／Weather 拆分／PE Sports／Clubs Hobbies／單元五全部 5 個主題／Bathroom／單元六 4 個主題等大量內容擴充）完全沒有同步更新，KPI 數字、統計表、13 個主題詳細卡片全部過期。

- **新增 `app/scripts/build-dashboard.mjs`**：仿照既有的 `build-content-review.mjs` 寫法，直接讀 `content/` 底下的 JSON 檔案計算統計數字，並用 `<!-- AUTO-GENERATED:XXX:START/END -->` 註解標記把 dashboard.html 裡「總覽 KPI」「內容進度條」「統計表」「主題內容卡片」四個區塊做成可重複執行、不會越改越亂的自動產生區塊；其餘分頁（開發階段、技術待辦、檔案總覽）跟 CSS/JS 維持原本手動維護，先只把最容易過期的「主題內容」相關資料自動化。
- **`dashboard.html`**：插入上述四個 marker 區塊後跑 `node scripts/build-dashboard.mjs`，統計數字全面更新為：31 個主題（含 Unit 0）、616 個單字、245 句、31 篇短文（93 題理解題）、26 個已接進 App 可玩／5 個 content 端完成待接線（Bathroom／Time／Calendar／Holidays & Festivals／Sizes & Measurements）。原本只有 13 個主題的詳細內容卡片，現在自動涵蓋全部 31 個主題。順手手動更新了「開發階段」分頁 Phase 2 的文字說明，以及「檔案總覽」分頁裡 `content/vocab`／`sentences`／`passages`／`glossary` 資料夾描述的過期數字（14 個檔案／236 筆 → 31 個檔案／616 筆），並把這幾個數字也一併收進 `build-dashboard.mjs` 的自動替換邏輯，之後重新產生時會一起更新。
- **`README.md`**：TODO 清單更新，把「Phase 2 進行中：擴充主題內容」拆成兩項——content 端擴充已標記完成（31 主題、616 字全部建置完），App 端接線標記為進行中待辦事項（列出 5 個待接線主題與對應的 handoff prompt 路徑）；頂部狀態說明也同步更新。
- 這次沒有動到任何 content 資料或 App 邏輯，純粹是文件/儀表板資料同步，不需要重跑 `jsonschema` 驗證，但仍重跑過全部 21 支 `verify-*.ts`＋`npm run build` 確認沒有意外影響（皆通過，預期本來就不會受影響）。

### 9.78 新增單元六「時間與節日」四個主題：Time／Calendar／Holidays & Festivals／Sizes & Measurements（2026-08-25）

使用者要求正式開始規劃單元六「時間與節日」，把規劃階段就存在但一直沒動工的 3 個主題建起來。討論候選字範圍時，Time 因為候選字（報時＋星期＋月份）合計超過 40 個，跟使用者確認後拆成 Time 與 Calendar 兩個主題，單元六因此從規劃的 3 個主題變成 4 個。

- **`content/vocab/time.json`**（新檔案，22 字）：報時（o'clock／half past／quarter past／quarter to／minute／hour／second／clock）、一天中的時段（morning／afternoon／evening／night／noon／midnight）、相對日期（today／tomorrow／yesterday）、時間副詞（now／later／early／late／soon）。
- **`content/vocab/calendar.json`**（新檔案，27 字）：星期一到日（Monday～Sunday）、一月到十二月（January～December）、日曆概念詞（day／week／month／year／date／calendar／weekend／weekday）。
- **`content/vocab/holidays_festivals.json`**（新檔案，18 字，使用者選擇「中西合併」）：西方節日（Christmas／Halloween／Easter／Thanksgiving）、華人節日（Lunar New Year／Mid-Autumn Festival／Dragon Boat Festival）、通用概念詞（birthday／gift／party／celebrate／decorate／card／costume／fireworks／lantern／mooncake／red envelope）。
- **`content/vocab/sizes_measurements.json`**（新檔案，13 字，使用者選擇「日常尺寸形容詞」角度，不含正式測量單位）：large／huge／tiny／medium／wide／narrow／thick／deep／shallow／size／half／full／empty。tall/short/heavy/light/thin 已被 Appearance 收走，watch 已被 Clothing & Accessories 收走，跨主題衝突掃描確認四個新主題全部零撞名。
- 對應的 `sentences`／`passages`／`glossary` 四份檔案 × 4 個主題全部建立完成。撰寫短文時避開了兩處已知的一字多義風險：Time 短文原本想寫「看手錶」，Holidays & Festivals 短文原本想寫「看划龍舟比賽」，兩處都因為 watch 已經是 Clothing & Accessories 的全域字（手錶）而改寫用詞（後者改用 cheer for）。
- **驗證**：`jsonschema` 驗證、跨主題衝突掃描（唯一預期的跨主題同字仍是 cold）、短文 `source_sentence` 逐字比對、全部 21 支 `verify-*.ts`（`verify-multi-topic.ts` 確認四個主題的單字/句子/短文都齊全＋六個關卡都能跑完一輪）、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。過程中發現 Calendar／Holidays & Festivals 的短文各引用了 2-4 個只存在於「7 主題缺口」（weather_nature／geographical_terms 等，見 9.56 節）裡的字（winter／there／summer／fall／moon／tree），這些字在真實 App 裡因為 `globalVocabByEnglish` 涵蓋全部主題所以查得到，但 `verify-passage-glossary.ts` 這支測試腳本的 `TOPICS` 陣列刻意不含那 7 個主題，所以測試會查不到——比照既有作法，直接把這幾個字加進對應主題自己的 `content/glossary/*.json` 當保底，不影響真實 App 行為，也不需要去修那 7 主題缺口本身。
- **App 端接線**：這四個主題是全新建立，比照 PE / Sports／Bathroom 的慣例，`app/scripts/verify-multi-topic.ts`／`verify-unit-completion-badges.ts`（`unit6.topicFileKeys` 改成 4 個＋`AVAILABLE_TOPIC_FILE_KEYS` 新增 4 筆，跟 9.77 節的 `bathroom` 一樣提前登記）／`verify-passage-glossary.ts`／`build-content-review.mjs` 都已經正常登記完成。`main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS` 三處還需要技術架構 session 執行，詳見 `docs/handoff-prompt-add-unit6-time-calendar-holidays-sizes.md`。
- **App 端已於 main.ts 執行完成（2026-08-25）**：`TOPICS` 陣列新增 `time`（Time 時間）／`calendar`（Calendar 日曆）／`holidays_festivals`（Holidays & Festivals 節日）／`sizes_measurements`（Sizes & Measurements 尺寸與量測）四筆（放在 `forms_of_address` 後面）；`UNITS` 的 `unit6.topicFileKeys` 從 3 個變成 4 個（`["time", "calendar", "holidays_festivals", "sizes_measurements"]`）；`TOPIC_THUMBS` 新增對應四筆縮圖設定，`style.css` 順手補上 `.thumb-time`／`.thumb-calendar`／`.thumb-holidays-festivals`／`.thumb-sizes-measurements` 四個底色規則。沒有動任何遊戲邏輯，也沒有動 `verify-unit-completion-badges.ts` 的 `AVAILABLE_TOPIC_FILE_KEYS`（content 端已提前登記好，這次執行後兩邊自然一致）。`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過；grep 打包後的 `dist/assets/*.js`／`*.css` 確認四個新 fileKey 跟四個新 thumb class 都進到最終產出。`node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs`（現在顯示 24 個主題，單元一～六全部主題都已上架）重新產生，根目錄兩份複本都已同步。

### 9.77 新增 Bathroom 浴室主題（2026-08-24）

使用者要求在單元二「食衣住行」新增「浴室」主題，正式落實 9.75 節（Health 擴充時）記錄過但當時決定「先不建」的浴室主題規劃。

- **`content/vocab/bathroom.json`**（新檔案，18 字）：核心 12 個——toothbrush 牙刷、toothpaste 牙膏、soap 肥皂、shampoo 洗髮精、towel 毛巾、bathtub 浴缸、shower 淋浴、toilet 馬桶、mirror 鏡子、comb 梳子、wash hands 洗手、brush teeth 刷牙；加碼 6 個——toilet paper 衛生紙、mouthwash 漱口水、slippers 拖鞋、bath mat 浴室踏墊、hairbrush 髮梳、wash face 洗臉。跨主題衝突掃描零撞名（sink／sponge 已排除，屬於 Tableware 的字，語意相同不重複收）。
- **`content/sentences/bathroom.json`**：新增 12 句涵蓋全部 18 個字。
- **`content/passages/bathroom.json`**：新短文「Getting Ready Every Morning」＋3 題理解題，撰寫時特別把「dry」換成「wipe」以避開跟 Weather 全域字 dry（乾燥的）的一字多義衝突。
- **`content/glossary/bathroom.json`**：補充短文裡的文法字翻譯。
- **驗證**：`jsonschema` 驗證、跨主題衝突掃描、短文 `source_sentence` 逐字比對、全部 21 支 `verify-*.ts`（`verify-multi-topic.ts` 確認「18 個單字、12 句」齊全＋六個關卡都能跑完一輪）、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。
- **App 端接線**：這個主題是全新建立，比照 PE / Sports／Clubs & Hobbies 的慣例，`app/scripts/verify-multi-topic.ts`／`verify-unit-completion-badges.ts`（`unit2.topicFileKeys` 加入 `bathroom`）／`verify-passage-glossary.ts`／`build-content-review.mjs` 都已經正常登記完成。`main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS` 三處還需要技術架構 session 執行，詳見 `docs/handoff-prompt-add-bathroom.md`。
- **App 端已於 main.ts 執行完成（2026-08-24）**：`TOPICS` 陣列新增 `{ fileKey: "bathroom", label: "Bathroom 浴室" }`（放在 `tableware` 後面、`transportation` 前面）；`UNITS` 的 `unit2.topicFileKeys` 補上 `bathroom`（`["food_drink", "clothing_accessories", "houses_apartments", "tableware", "bathroom", "transportation"]`）；`TOPIC_THUMBS` 新增 `bathroom: { emoji: "🛁", className: "thumb-bathroom" }`，`style.css` 順手補上 `.thumb-bathroom` 底色規則。沒有動任何遊戲邏輯。`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過；grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `bathroom`／`.thumb-bathroom` 都進到最終產出。`node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs`（現在顯示 20 個主題）重新產生，根目錄兩份複本都已同步。

### 9.76 Forms of Address 補充 9 個稱謂相關單字（2026-08-24）

使用者問 Forms of Address（4 字：name／Mr./Mrs./Miss）能不能擴充。跨主題衝突掃描確認候選字（含被排除的 teacher／uncle／aunt，已分別被 School／Family 收走）都不撞名。

- **`content/vocab/forms_of_address.json`**：新增 `voc.forms_of_address.005-013` 共 9 字：Ms. 女士（不分已婚未婚的中性稱謂）、Dr. ...博士（頭銜用法，跟 Occupations 的 doctor 是不同字）、Sir 先生（禮貌尊稱，不加姓名單獨使用）、Madam 女士／夫人（禮貌尊稱，跟 Sir 對應）、nickname 綽號、full name 全名、first name 名、last name 姓、Professor 教授，4 字變 13 字。
- **`content/sentences/forms_of_address.json`**：新增 7 句涵蓋全部 9 個新字（Sir／Madam 一句並列，first name／last name 一句並列）。短文「My Teachers」不用改（沒有引用到任何新字）。這個主題不在 `verify-passage-glossary.ts` 已知的 7 主題缺口清單裡，不受影響。
- **驗證**：跨主題單字衝突掃描（零衝突）、`jsonschema` 驗證、全部 21 支 `verify-*.ts`（`verify-multi-topic.ts` 確認「13 個單字、11 句」齊全）、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。這次沒有動到 App 端 `main.ts`，不需要新的 handoff prompt。

### 9.75 Health 補充 17 個健康相關單字（2026-08-24）

使用者問 Health（4 字）能不能擴充。查過候選字後只有 **cold**（感冒）撞名——已經是 Weather 的「cold 冷的」；也主動跳過 **band-aid**（品牌商標，跟 youtuber 那次同樣考量），改用 **bandage 繃帶**。

討論過程中使用者問「一字多義」限制有沒有解法，這個討論產出了 9.73／9.74 節那兩項改動（短文查字改主題優先）。這次 content 端動工時，9.74 的 App 端修正**已經執行完成**，所以 cold 這次直接收進 Health（跟 Weather 的 cold 是刻意保留的跨主題同字不同義，兩邊查詢順序修正後都會顯示各自主題正確的意思）。

使用者也問到「浴室」要不要另開主題，因為 wash hands／brush teeth 感覺更適合放進浴室情境。查過 Houses & Apartments 後發現「bathroom」這個房間名稱本身已經收錄，浴室主題如果之後要開，會收「浴室裡的物品/動作」（toothbrush／soap／shampoo／towel／bathtub／shower／toilet／mirror／comb／wash hands／brush teeth 這類，其中 **towel** 正好是先前 9.63 節 Kitchen & Dining 那次特地跳過的字，當時是因為它其實是浴室毛巾不是廚房抹布），可以放進單元二「食衣住行」。這次決定**先不開浴室主題**，wash hands／brush teeth 這次也沒收進 Health，留到之後真的要做浴室主題時再收。

- **`content/vocab/health.json`**：新增 `voc.health.005-021` 共 17 字：cold 感冒、fever 發燒、cough 咳嗽、stomachache 肚子痛、sore throat 喉嚨痛、runny nose 流鼻涕、rest 休息、medicine 藥、exercise 運動、sleep 睡覺、healthy 健康的（跟既有的 well 互為 `related_forms`）、hurt 受傷、疼痛、mask 口罩、thermometer 體溫計、vitamin 維他命、allergy 過敏、bandage 繃帶，4 字變 21 字。
- **`content/sentences/health.json`**：新增 9 句涵蓋全部 17 個新字。短文「A Sick Day」不用改（沒有引用到任何新字，也已經用 Python 確認過本文完全沒有出現 "cold" 這個字面，不會受這次新收的跨主題同字影響）。這個主題不在 `verify-passage-glossary.ts` 已知的 7 主題缺口清單裡，不受影響。
- **驗證**：跨主題單字衝突掃描（唯一預期的跨主題同字是 cold，已確認）、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。這次沒有動到 App 端 `main.ts`，不需要新的 handoff prompt。

### 9.74 App 端執行：短文查字改「主題優先」＋收藏清單新增排序功能（2026-08-24）

延續 9.73 交接的提示詞，這次處理技術端實作，兩項改動互相獨立。

**改動一：`lookupPassageWordZh()`（`app/src/content.ts`）查詢順序改成「這個主題自己優先」**
- 查詢順序從「先查跨主題 `globalVocabByEnglish`、查不到才查自己主題的 glossary」，改成三段式：(1) 先查這個主題自己的 `vocabByTopic[topicFileKey]`；(2) 這個主題自己沒收，才退回跨主題攤平表 `globalVocabByEnglish`（維持「順便學到別的主題單字」的加分功能）；(3) 都查不到，才退回這個主題自己的補充詞彙表 `glossaryByTopic`。
- `globalVocabByEnglish` 建表邏輯本身沒變，只是它現在只當作退回選項，不再是第一順位；附近的註解一併更新，說明「這張攤平表的覆蓋順序不影響使用者實際看到的翻譯結果」。
- **`app/scripts/verify-passage-glossary.ts`**：內部重建的 `lookupPassageWordZh()` 鏡像函式同步改成同樣的三段式查詢順序，兩邊邏輯才會一致。
- 這個改動純粹是查詢順序調整，在「無衝突字」的情況下畫面完全等價；之後 content 端真的收了同一個英文字在不同主題各自收錄不同意思的情況，才會看到差異（該主題自己的版本優先顯示）。

**改動二：收藏清單（`renderFavorites()`）新增排序功能**
- 新增模組層級狀態 `type FavoritesSortMode = "recent" | "az" | "za"` ＋ `let favoritesSortMode: FavoritesSortMode = "recent"`（預設「收藏時間，新到舊」），`goToFavorites()` 進入畫面時重置成預設值，排序狀態不跨畫面/工作階段記住。
- `renderFavorites()` 在標題底下、單字列表上方新增三個排序按鈕（收藏時間／字母 A→Z／字母 Z→A），目前選中的用 `.favorites-sort-btn--active` 標示（主色底＋白字），點擊切換 `favoritesSortMode` 並呼叫 `render()`。
- 新增 `sortFavoriteVocabs(vocabs, mode)`：`"az"`／`"za"` 用 `vocab.en.localeCompare()` 排序；`"recent"` 直接把 `getFavoriteVocabIds()` 回傳的陣列（favorites.ts 內部是 Set 插入順序，舊到新）反過來，不用另外存時間戳記。
- 確認過收藏功能本身已經用 `vocab.id`（不是英文字串）當 key，`buildVocabOverviewRow()` 顯示的也是 Vocab 物件自己的欄位，所以就算之後 content 端真的收了「同一個英文字兩個主題各自收錄不同意思」的情況，收藏清單本來就會把它們當成兩個獨立項目正確顯示，這次不用額外改 `favorites.ts`。
- **`style.css`**：新增 `.favorites-sort`／`.favorites-sort-btn`／`.favorites-sort-btn--active` 三個規則，沿用既有的 `--radius-pill`／`--color-primary-tint`／`--color-primary-500`／`--color-primary-700` token，沒有新增顏色。

**驗證**：`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過（含改過的 `verify-passage-glossary.ts`）；grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `.favorites-sort-btn` 有進到最終產出。`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本已同步。

### 9.73 撰寫提示詞：短文查字改「主題優先」＋收藏清單排序功能（2026-08-24，已於 9.74 執行完成）

延續 9.72 節發現的「一字多義」討論——使用者問這個限制有沒有解法，重新看過 `app/src/content.ts` 後發現：`MatchingGame`／`FlashcardGame`／`FillBlankGame`／`ChoiceGame`／`buildCapstoneQuestions` 這些遊戲邏輯本來就只吃 `getVocabByTopic()`（各主題自己的單字清單），完全不會用到跨主題的 `globalVocabByEnglish` 全域表；真正需要那張全域表的只有短文點字查中文意思的 `lookupPassageWordZh()`，而且它目前的查詢順序是「先查全站、查不到才查自己主題」，順序反了，才會變成「同一個英文字全站只能收一個意思」這條 content 端自己訂的硬規則。

- **改動一**：把 `lookupPassageWordZh()` 的查詢順序改成「這個主題自己的 vocab 優先，查不到才退回跨主題全域表，再查不到才退回這個主題的 glossary」。改完之後 content 端的規則可以放寬成「同一個英文字在同一個主題裡才要唯一」，不同主題可以各自收一份意思不同的版本（例如 change 可以同時是 Money 的「零錢」跟未來某個主題的「改變」）。連帶要同步改 `app/scripts/verify-passage-glossary.ts` 自己重建的那份查詢邏輯，兩邊順序才會一致。
- **改動二**：使用者想要收藏清單加排序功能（依收藏時間／字母 A→Z／字母 Z→A）。順帶確認了一個好消息：收藏功能本身已經用 `vocab.id`（不是英文字串）當 key，`buildVocabOverviewRow()` 顯示的也是 Vocab 物件自己的 `zh` 欄位，所以「同一個字兩種意思分開收藏」這件事本來就已經支援，不用額外改 `favorites.ts`。排序功能本身：新增 `favoritesSortMode` 畫面狀態＋排序控制項，「收藏時間」直接用 `getFavoriteVocabIds()` 回傳的 Set 插入順序反過來（新到舊）即可，不用額外存時間戳記；A→Z／Z→A 用 `vocab.en.localeCompare()`。
- 兩項改動互相獨立，可以分開執行分開驗證。詳細程式碼片段、確切行數、驗證步驟見 `docs/handoff-prompt-word-sense-and-favorites-sort.md`。這次是純粹的架構討論產出的交接文件，沒有連帶的 content 端異動，`content/` 底下沒有任何檔案變動。

### 9.72 Money 補充 18 個金錢相關單字（2026-08-24）

使用者問 Money（4 字：dollar／money／free／buy）還可以補什麼小學範圍的金錢單字，並提到販售/零錢/電子支付/打折/優惠這幾個方向。「電子支付」改用更具體、國小生比較有生活經驗的 **credit card 信用卡**、「優惠」改用 **coupon 優惠券**。

- **`content/vocab/money.json`**：新增 `voc.money.005-022` 共 18 字：sell 賣、change 零錢、coin 硬幣、bill 紙鈔、price 價格（跟 cost 互為 `related_forms`，避免同一批出現造成混淆）、cheap 便宜的、expensive 貴的、cost 花費、pay 付錢、save 存錢、spend 花錢、wallet 錢包、piggy bank 撲滿、allowance 零用錢、discount 折扣、coupon 優惠券、receipt 收據、credit card 信用卡，4 字變 22 字，跟現有全站單字都沒有撞名。
- **`content/sentences/money.json`**：新增 8 句涵蓋全部 18 個新字。短文「Saving Money」不用改（沒有引用到任何被移除的字）。
- **意外發現一個既有的潛在問題（不是這次新增造成的）**：短文裡的「piggy bank」因為 App 短文點字查詢是逐字比對、不是詞組比對，"bank" 會拆出來單獨查，剛好撞到 Places & Directions 的全域字「bank 銀行」，導致小朋友點到會看到錯誤的「銀行」而不是撲滿相關的意思。這個問題在新增 Money 單字之前就已經存在，新增「piggy bank」這個字本身不會讓它變好或變壞（全域字優先權本來就比 glossary 高，內容端補不了）。根本解法要在 App 端讓短文點字功能支援多字詞組比對，屬於技術架構 session 的工作範圍，這裡先記錄，沒有立即處理。
- **驗證**：跨主題單字衝突掃描、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。這次沒有動到 App 端 `main.ts`，不需要新的 handoff prompt。

### 9.71 Occupations 補充 3 個現代職業單字（2026-08-24）

使用者問 Occupations（13 字）要不要補一些貼近現代情境的職業，像 youtuber／streamer／homemaker／工程師／企劃。有兩個字需要判斷方向：

- **網路內容創作者概念**：youtuber 這個字直接包含 YouTube 這個特定平台的品牌名稱，這個專案之後要開源上 GitHub，先前已經因為商標/品牌引用風險移除過「GEPT Kids」（見開頭品牌說明），跟使用者確認後改用不含特定品牌名稱的 **content creator 內容創作者**，streamer 也一併不收（概念重疊）。
- **企劃**：中文職稱抽象，對應的英文字不明確（planner／coordinator／producer 都有可能），對國小程度也不夠具象，跟使用者確認後決定不收。

最終新增 3 字：**`content/vocab/occupations.json`** 新增 `voc.occupations.014-016`：engineer 工程師、homemaker 家庭主夫、家庭主婦、content creator 內容創作者，13 字變 16 字，跟現有全站單字都沒有撞名。**`content/sentences/occupations.json`** 新增 2 句涵蓋這 3 個新字。短文「What Do They Do?」不用改（沒有引用到任何新字）。這個主題本來就不在 `verify-passage-glossary.ts` 已知的 7 主題缺口清單裡，這次也沒改短文本文，不受影響。

**驗證**：跨主題單字衝突掃描、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。這次沒有動到 App 端 `main.ts`，不需要新的 handoff prompt。

### 9.70 Places & Directions 補充 9 個導航方位單字（2026-08-24）

使用者看畫面（18 字，以地點名詞為主，方位/導航類只有 there／left／right／here 4 個字）後問要不要補對街、街角、前面、後面、旁邊這類道路/地圖指引概念。查過專案自己在 `docs/content-plan.md` 3.2 節訂的原則——介系詞類的詞不適合開成獨立單字關卡，要融入短句短文——把候選概念拆成兩類處理：

- **介系詞片語不開成獨立單字**：對面（across from）／前面（in front of）／後面（behind）／旁邊（beside/next to）／之間（between），改成在句子裡自然出現。`content/sentences/places_directions.json` 新增 2 句：「The bank is in front of the post office, and the museum is behind it.」、「The restaurant is across from the movie theater.」，用既有的 bank／post office／museum／restaurant／movie theater 這幾個地點字帶出介系詞語感，不需要新的 vocab。
- **具體名詞/形容詞/動詞開成獨立單字**（跟現有的 left/right/there/here 同類）：**`content/vocab/places_directions.json`** 新增 `voc.places_directions.019-027`：corner 街角、street 街道、traffic light 紅綠燈、crosswalk 斑馬線、map 地圖、near 附近的、far 遠的、straight 直直地（直走）、turn 轉彎，18 字變 27 字，跟現有全站單字都沒有撞名。
- **`content/sentences/places_directions.json`**：另外新增 4 句涵蓋這 9 個新字（共新增 6 句，從 4 句變 10 句）。短文「A Day in Town」不用改（沒有引用到任何新字，也沒有被移除的字）。這個主題本來就不在 `verify-passage-glossary.ts` 已知的 7 主題缺口清單裡，這次也沒改短文本文，不受影響。
- **驗證**：跨主題單字衝突掃描、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。這次沒有動到 App 端 `main.ts`，不需要新的 handoff prompt。

### 9.69 新增 PE / Sports 體育課、Clubs & Hobbies 社團活動兩個主題（2026-08-24）

使用者想新增「體育課」與「社團活動」兩個主題。這對應到 `docs/content-plan.md` 原本規劃在單元六「時間與節日」但還沒動工的「Sports/interests/hobbies」，討論後改採使用者的提案：拆成兩個主題並移入單元三「上學去」（體育課、社團活動都是學生在學校會遇到的日常情境，跟單元三既有的 School／Numbers／Colors 更貼近，比放在「時間與節日」合理）。

- **`content/vocab/pe_sports.json`**（新檔案，24 字）：soccer／basketball／baseball／badminton／table tennis／volleyball／tennis／swimming、run／jump／throw／catch／kick、ball／bat／racket／whistle／gym、team／coach／player／win／lose／race。**`content/vocab/clubs_hobbies.json`**（新檔案，16 字）：drawing／painting／singing／dancing／music／guitar／piano、chess club／book club／art club／choir、photography／cooking／gardening／collecting／origami。跨主題衝突掃描確認沒有撞字（含事先排除的 bike／read／draw／book 這幾個已知地雷）。
- **`content/sentences/pe_sports.json`**（12 句）、**`content/sentences/clubs_hobbies.json`**（8 句）：涵蓋全部新字，每個 vocab 至少被一句引用。
- **`content/passages/pe_sports.json`**（短文「My PE Class」）、**`content/passages/clubs_hobbies.json`**（短文「After-School Clubs」）：各 3 題理解題，`source_sentence` 逐字比對過確認是原文子字串。**`content/glossary/pe_sports.json`**、**`content/glossary/clubs_hobbies.json`**：短文查字模擬跑過，補齊內容字的翻譯，剩下的都是預期排除的基本文法字。
- **過程中抓到兩個語意衝突，靠改短文措辭避開**（不是收錄有問題的字，是短文草稿本身寫得不夠精準）：草稿寫「a short race」，但 `short` 已經是 Appearance 的「矮的」，跟賽跑的「短」語意不同，改成「a fun race」；草稿寫「scored a run」，但 `run` 已經是體育課自己的「跑步」，跟棒球「得分」的 run 語意不同，改成「My whole team cheered loudly for me.」，兩題對應的理解題也一併調整。
- **`app/scripts/verify-multi-topic.ts`**：`TOPICS` 陣列新增兩筆。**`app/scripts/verify-unit-completion-badges.ts`**：`UNITS` 的 `unit3.topicFileKeys` 補上 `pe_sports`／`clubs_hobbies`，`unit6.topicFileKeys` 移除原本的佔位項目 `sports_hobbies`；`AVAILABLE_TOPIC_FILE_KEYS` 補上兩個新主題；測試 9 改成操作 unit3 全部 5 個主題（原本只測 school/numbers/colors 3 個）。**`app/scripts/verify-passage-glossary.ts`**：`TOPICS` 陣列正式補上這兩個新主題（不是套用已知的 7 主題缺口繞過法，這兩個是全新主題，直接照正常流程登記，`EXPECTED_UNCOVERED` 也對應補齊）。**`app/scripts/build-content-review.mjs`**：`TOPICS` 陣列同步補上兩筆，內容審閱頁才會顯示新主題。
- **驗證**：跨主題單字衝突掃描、`jsonschema` 驗證（vocab／sentence／passage／glossary 四種 schema）、短文查字模擬、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs`（現在顯示 19 個主題）都通過，兩份 `demo-standalone.html` 已同步。
- **待辦**：`app/src/main.ts` 需要三處改動（`TOPICS` 陣列新增兩筆、`UNITS` 的 `unit3.topicFileKeys` 補上兩個主題並移除 `unit6` 的 `sports_hobbies` 佔位項、`TOPIC_THUMBS` 新增兩筆縮圖設定），需要技術架構 session 執行，交接文件見 `docs/handoff-prompt-add-pe-sports-clubs-hobbies.md`。在這之前，這兩個主題的內容雖然已經完整存在於 `content/` 底下，但因為還沒登記進 `main.ts` 的 `TOPICS`，實際畫面上還玩不到。
- **App 端已於 main.ts 執行完成（2026-08-24）**：`TOPICS` 陣列新增 `pe_sports`（PE / Sports 體育課）／`clubs_hobbies`（Clubs & Hobbies 社團活動）兩筆（放在 `numbers` 後面、`animals_insects` 前面）；`UNITS` 的 `unit3.topicFileKeys` 補上這兩個 fileKey（`["school", "numbers", "colors", "pe_sports", "clubs_hobbies"]`），`unit6.topicFileKeys` 移除原本的佔位項 `sports_hobbies`；`TOPIC_THUMBS` 新增 `pe_sports: { emoji: "⚽", className: "thumb-pe-sports" }`／`clubs_hobbies: { emoji: "🎵", className: "thumb-clubs-hobbies" }`，`style.css` 順手補上這兩個縮圖 class 的底色規則。沒有動任何遊戲邏輯。`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過；grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `pe_sports`／`clubs_hobbies`／`.thumb-pe-sports`／`.thumb-clubs-hobbies` 都進到最終產出。`node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs`（現在顯示 19 個主題）重新產生，根目錄兩份複本都已同步。

### 9.68 Geographical Terms 補充 9 個常用地形/地表單字（2026-08-24）

使用者提供「自然地形與水域」＋「自然物質與地表成分」候選清單，問要不要補進 Geographical Terms。跨主題衝突掃描沒撞到其他主題，但兩個字概念被現有字覆蓋直接跳過：**stone**（已收在 rock 的中文註解，＝ stone）、**woods**（跟既有的 forest 太接近）。候選全加會讓主題一次跳到 30 字（接近先前 Numbers 30 字被覺得太多的量級），跟使用者確認後改成只加常用 9 個：

- **`content/vocab/geographical_terms.json`**：新增 `voc.geographical_terms.017-025`：ocean 海洋（跟既有的 sea 互為 `related_forms`）、pond 池塘、waterfall 瀑布、desert 沙漠、cave 洞穴、jungle 叢林、sand 沙子、mud 泥巴、wood 木頭/木材，從 16 字變 25 字。sea（005）同步補上 `related_forms` 連回 ocean（017）。
- **`content/sentences/geographical_terms.json`**：新增 4 句（009-012）涵蓋全部 9 個新字。
- 短文「A Trip to the Beach」不用改（沒有引用到任何新字或被移除的字）；`beach`（001）本來就沒有被任何句子引用，是既有狀態，不是這次造成的。
- **驗證**：跨主題單字衝突掃描、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。這次沒有動到 App 端 `main.ts`，不需要新的 handoff prompt。

### 9.67 Weather & Nature 拆分：改名 Weather + 擴充 Geographical Terms（2026-08-24）

使用者想把「Weather & Nature 天氣與自然」拆成兩個主題。查過內容後發現候選的「自然地理與地景」類字（beach／river／mountain／lake／sea 等）其實已經是同一個單元（單元四）底下 **Geographical Terms 地理名詞** 主題的字，不需要另開一個「Nature」主題重複收錄，跟使用者確認後改採更省事的做法：

- **`content/vocab/weather_nature.json`**：不新開主題，`fileKey` 維持 `weather_nature`，只改顯示名稱成「Weather 天氣」（App 端待執行，見 `docs/handoff-prompt-rename-weather-nature-label.md`）。新增 16 個字：天氣現象（snowy／foggy／fog／storm／stormy／typhoon／cloud／lightning／thunder／ice／wet／dry）、四季（spring／summer／fall／winter），從 16 字變 32 字。候選字裡的 **cool**（涼爽的）沒收，因為已經是 Appearance 的「cool 酷的」，同一個英文字全站不能兩個主題各收一份不同意思的版本。fall／autumn 是同義詞只收 `fall`（zh 註明＝ autumn），避免跟 thin/slim 那種另開一筆的作法不一致但又沒必要為每個同義詞都開新條目。
- **`content/vocab/geographical_terms.json`**：不新開 Nature 主題，把地景類新字（nature／hill／island／forest／tree／flower／grass／plant／rock／earth／ground）直接併入既有的 Geographical Terms，從 5 字變 16 字，這部分完全不用改 `main.ts`。rock 只收一筆（zh 註明＝ stone）；但 earth（地球）／ground（地面）意思不同，各自獨立收錄不合併。
- **`content/sentences/weather_nature.json`**：新增 7 句（005-011）涵蓋全部 16 個新字。**`content/sentences/geographical_terms.json`**：新增 4 句（005-008）涵蓋全部 11 個新字。兩個主題既有的短文都不用改（沒有引用到任何被移除的字，新字也都沒有出現在短文本文裡）。
- **自我糾正一個小失誤**：一開始把新字裡的 `wet`（027）／`dry`（028）設成互相 `related_forms`，但這兩個字是反義詞不是同義詞——`related_forms` 是用來避免「真同義詞」同時出現在同一批配對/選擇題造成選項混淆，反義詞本身很適合拿來出對比題，不該被排除同時出現。這跟 9.64 節 Colors 主題 light/dark 的錯誤是同一種，這次是自己先發現先修正，兩筆都改回 `related_forms: []`。
- **`app/scripts/verify-multi-topic.ts`**：第 51 行 `weather_nature` 的 console log 顯示用標籤同步改成「Weather 天氣」（純顯示字串，跟其他驗證邏輯無關）。
- **驗證**：跨主題單字衝突掃描、`jsonschema` 驗證、全部 21 支 `verify-*.ts`（含修正 wet/dry 之後重跑一次）、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。
- **待辦**：`app/src/main.ts` 的 `TOPICS` 陣列裡 `weather_nature` 的 `label` 字串改名，需要技術架構 session 執行，交接文件見 `docs/handoff-prompt-rename-weather-nature-label.md`。
- **App 端已於 main.ts 執行完成（2026-08-24）**：`TOPICS` 陣列裡 `weather_nature` 的 `label` 已從 `"Weather & Nature 天氣與自然"` 改成 `"Weather 天氣"`，`fileKey`／`TOPIC_THUMBS`／`UNITS` 都沒動。`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過；`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本已同步。

### 9.66 Numbers 主題移除 5 個非數字/序數詞（2026-08-23）

使用者看畫面覺得 Numbers 30 個字有點多，討論後選擇移除 5 個「不算真正數字」的字：**first／second／third**（3 個序數詞，留到未來 Time 主題〔單元六，尚未建置〕再收）、**number／how many**（2 個功能詞，跟專案自己訂的「文法/功能詞融入短句短文、不獨立成關卡」原則不一致）。30 字變 25 字。

- **`content/vocab/numbers.json`**：移除 `voc.numbers.015/016/017/018/020` 這 5 筆，其餘 25 筆 `id` 不變。
- **`content/sentences/numbers.json`**：001-003 三句原本引用被移除的字，全部換成新句子（zero/one、two/ten、twenty/fifteen 各一句），004（thirty）不受影響。
- **`content/passages/numbers.json`**：短文「Numbers Everywhere」整篇故事都建立在序數詞跟 how many 上（頒獎名次故事），已整篇換掉，改成新故事「A Fun Day at the Zoo」（動物園主題，只用基數詞：two/five/eight/twelve/twenty/ten/fifty/one/hundred/zero），3 題理解題也全部重寫，`source_sentence` 逐字比對過確認是原文子字串。`content/glossary/numbers.json` 也整份重寫，配合新故事的內容字（animals/elephants/monkeys/zoo/mom 等）。
- **意外抓到一個舊 bug**：`content/passages/personality_traits.json` 短文裡有一句「shy at first」（片語「一開始」），先前因為 Numbers 的 `first`（第一）是全域字，這句話點下去會被誤翻成「第一」，是錯的。這次移除 Numbers 的 first 之後順便在 `content/glossary/personality_traits.json` 補上正確的片語翻譯「一開始（用於 at first）」，順便修正了這個潛在的翻譯錯誤。
- **踩到已知缺口第二次**：`verify-passage-glossary.ts` 的 TOPICS 清單少 7 個主題（9.56 節記錄過的已知缺口）這次真的擋到路——新短文用到的 `name`／`zoo` 在 App 裡實際上已經是 `forms_of_address`／`places_directions` 的全域字，但這兩個主題不在這支腳本的驗證範圍，腳本會誤判成查不到。暫時在 `content/glossary/numbers.json` 也補一份 fallback（App 實際執行時會被全域字蓋掉、用不到，純粹是為了讓這支腳本能過）。這個缺口目前累積被踩過 2 次，之後有空可能真的該花時間把那 7 個主題補進腳本的驗證範圍，一次解決，不要每次都用局部補丁繞過去。
- **驗證**：跨主題單字衝突掃描、`jsonschema` 驗證（含 `source_sentence` 逐字子字串比對）、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。

### 9.65 Numbers 主題單字改成依數值大小排序（2026-08-23）

使用者要求把 Numbers 30 個單字依大小順序排好（原本的順序是先前為了避免看起來直接照抄參考字表而刻意打散的，見 9.13 節前後的相關脈絡；但數字由小到大排序是全世界通用、任何數字教材都會這樣排，不是特定來源獨有的結構，不算照抄疑慮）。

- **`content/vocab/numbers.json`**：只調整陣列順序，**沒有改動任何 `id`／內容欄位**——依序改成 zero→one～ten→eleven～nineteen→twenty→thirty→forty→fifty→hundred（25 個基數詞），再接 first／second／third（3 個序數詞），最後是 number／how many（2 個非數值的一般詞彙／疑問詞，放在最後）。改完用 Python 比對過新舊檔案的 `id` 集合完全一致（沒有遺漏或重複任何一筆）。
- 「單字總覽」頁面是直接照 `vocab.json` 陣列順序顯示，所以這個改動會直接反映在畫面上；配對／字卡等遊戲關卡本來就會自己重新洗牌出題，不受這個陣列順序影響。
- **驗證**：全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。

### 9.64 Colors 主題補充 7 個顏色相關單字（2026-08-23）

使用者提供一份顏色候選清單（其他常見顏色、顏色修飾與狀態形容詞兩類），要求從中挑選適合的字補進 Colors。

- **跳過 3 個字**：**rainbow**（已經是 `voc.weather_nature.015`，全站單字不能重複，且彩虹本來就更像天氣現象而非顏色）、**violet**（中文翻譯「藍紫色的」跟既有的 purple「紫色的」太接近，對國小程度色差太細，容易造成配對題混淆）、**peach**（中文翻譯「桃紅色的」跟既有的 pink「粉紅色的」重疊，且 peach 更常見的意思是水果「桃子」，日後食物主題若收錄桃子會撞字）。
- **`content/vocab/colors.json`**（013-019）：新增 gold 金色的、silver 銀色的、indigo 靛藍色的（彩虹七色之一）、light 淺色的（顏色前綴，如 light blue）、dark 深色的（顏色前綴，如 dark green）、bright 明亮的、colorful 多彩的，共 7 字，從 12 字變 19 字。light／dark 是反義詞不是同義詞，一開始誤設成互相 `related_forms`（這個欄位是給同義詞避免同批出現用的，反義詞放在一起反而是好的對比題），後來自己抓到並改回空陣列。
- **`content/sentences/colors.json`**：新增 4 句（005-008），涵蓋全部 7 個新字（006 那句順便用 rainbow 當情境文字帶出彩虹七色，但 rainbow 本身不算 colors 的 vocab_id）。
- **驗證**：跨主題單字衝突掃描、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。

### 9.63 Kitchen & Dining 主題補充 15 個廚房用品單字（2026-08-23）

使用者提供一份廚房用品候選清單（餐具與容器、餐桌與清潔用品、其他常見小家電與設備、廚房常用動作四類），要求從中挑選適合的字補進 Kitchen & Dining（`fileKey` 仍是 `tableware`）。

- **跳過 3 個字**：**dish**（中文翻譯「盤子/菜餚」跟既有的 plate「盤子」重疊，同一批配對題可能造成混淆）、**towel**（英文原意通常指浴室毛巾，不是廚房抹布，中文「毛巾/抹布」兩義混在一起會誤導）、**cook**（已經是 `voc.occupations.004` 廚師，全站單字不能重複，見 `content/schema` 對 `en` 唯一性的隱性要求）。
- **廚房常用動作（bake/cut/wash/clean）跟使用者確認後決定不加**，維持這個主題純名詞（餐具＋廚房家電）的一致性，不混入動詞。
- **`content/vocab/tableware.json`**（014-028）：新增 glass 玻璃杯、pan 平底鍋、bottle 瓶子、kettle 水壺、straw 吸管、tray 托盤、napkin 餐巾紙、tablecloth 桌布、trash can 垃圾桶、apron 圍裙、sponge 海綿、blender 果汁機、toaster 烤麵包機、rice cooker 電鍋、freezer 冷凍庫，共 15 字，從 13 字變 28 字。
- **`content/sentences/tableware.json`**：新增 9 句（005-013），涵蓋全部 15 個新字。
- **驗證**：跨主題單字衝突掃描（確認新字都沒有跟其他主題撞名）、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。

### 9.62 首頁主題卡片版面：限制最多 3 欄（2026-08-23）

使用者看首頁截圖後回饋，寬螢幕下 `.topic-grid` 一排排出 4 張卡片太擠，要求改成最多 3 欄。

- `style.css` 的 `.topic-grid`：`grid-template-columns` 的 `minmax` 最小寬度從 `220px` 調高到 `260px`。`#app` 容器 `max-width` 是 `1000px`（扣掉左右 padding 剩約 968px 可用寬度），4 欄需要 `4 * 260px + 3 個 gap`（`--space-5` = 24px）遠超過可用寬度，所以最多只會排出 3 欄；螢幕變窄時 `auto-fit` 仍會照原本的行為自動收成 2 欄、1 欄，不用另外寫斷點媒體查詢。這個規則同時套用在「🚀 新手起手式」（Greetings／Pronouns）跟單元一～六底下的所有主題卡片區塊，因為都共用同一個 `.topic-grid` class。
- **驗證**：`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過（沒有腳本依賴這個 CSS 數值）。`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本已同步。

### 9.60 Appearance 主題補充 11 個外觀描述詞（2026-08-23）

使用者看 Appearance 主題單字總覽截圖後要求補充更多外觀描述詞。原本只有 7 字（tall/short/thin/strong/cute/pretty/handsome）。討論 fat 這種可能被拿來嵌人的字要不要收錄後，使用者選擇直接加，並加選 beautiful／young／old、long hair／short hair、curly／straight（改用 curly hair／straight hair 更符合實際用法）、外加自訂的 slim／heavy／cool，共新增 11 字，變成 18 字：

- **`content/vocab/appearance.json`**（008-018）：fat 胖的、heavy 重的（委婉說法）、slim 苗條的、beautiful 美麗的、young 年輕的、old 老的、long hair 長髮、short hair 短髮、curly hair 捲髮、straight hair 直髮（後 4 個 `pos` 是「名詞片語」，跟其餘單一形容詞不同）、cool 酷的。thin↔slim、fat↔heavy、pretty↔beautiful 三組近義詞互相設定 `related_forms`（雙向），避免同一批配對/測驗題同時出現造成混淆，做法跟 `parts_of_body` 的 foot/feet 一致。
- **`content/sentences/appearance.json`**：新增 7 句（005-011），涵蓋全部 11 個新字。
- **跨主題連鎖影響**：`young`／`old`／`beautiful` 原本分別要靠 `content/glossary/people.json`／`content/glossary/geographical_terms.json` 自己的補充詞彙表才查得到中文意思，現在變成全域 vocab 直接查得到，兩邊的 glossary 條目已同步移除（避免死資料）；正面副作用是這幾個字現在在 People／Geographical Terms 的短文裡也能被點擊收藏（vocabId 不再是 null），跟先前 he/she/we/it、feet 那幾次是同一種模式。
- **驗證**：跨主題單字衝突掃描（無重複 `en`）、`jsonschema` 驗證 vocab／sentences、Python 模擬 `lookupPassageWordZh()` 邏輯確認 people／geographical_terms 短文裡的 old/young/beautiful 正確改連到 appearance 的新 vocab、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。
- **已知缺口（本次未處理）**：`dashboard.html` 的「Personal Characteristics」區塊從 2026-08-22 拆成 Appearance／Emotions／Personality Traits 三個主題後就沒拆開過（詳見 9.59 節），現在 Appearance 又多了 11 字，這個區塊的落差又更大了一點。之後要處理 dashboard.html 落差時，建議直接把這三個主題的最新內容（含這次新增的 11 字）一起補進去，不要分批修。

### 9.61 Emotions 主題補充 9 個心理狀態單字（2026-08-23）

使用者問 Emotions 情緒是不是該拆成「生理」跟「心理」兩個單元，並提供一份分類好的候選字清單（生理與感受類：thirsty/full/sick/ill/hot/cold/sleepy；正向與平靜情緒：glad/calm/proud/fine/okay；負向與其他情緒：afraid/mad/shy/upset/lonely）。

- **分析**：跨主題掃描發現候選字裡 hot／cold 已經是 `weather_nature` 的字、sick 已經是 `health` 的字、shy 已經是 `personality_traits` 的字——這個專案的資料模型要求每個英文單字全站唯一（`globalVocabByEnglish` 用 `en` 當 key，`sense_of` 欄位雖然存在於 schema 但全站從未實際使用過，不支援同一個英文字在兩個主題各自收一份），所以這幾個字不管要不要拆單元都不能重複加進 Emotions。這也說明這個專案本來就沒有把「生理狀態」類的字集中管理，而是依情境分散到各主題，Emotions 的定位一直是「純情緒表達」。討論後決定**不拆新單元**（新增後 Emotions 也才 20 字，跟其他主題差不多大，不到需要拆分的規模，拆單元還要動 `main.ts` 的 `UNITS`／badge 判斷邏輯，這次不划算）。使用者最後也主動選擇只加純心理狀態的字，略過 thirsty／full／sleepy 這幾個生理感受字。
- **`content/vocab/emotions.json`**（012-020）：glad 高興的、calm 平靜的、proud 感到驕傲的、fine 很好的、okay 沒事的、afraid 害怕的、mad 生氣的、upset 心煩意亂的、lonely 孤單的。glad↔happy、fine↔okay、afraid↔scared、mad↔angry 四組近義詞互相設定 `related_forms`（雙向），afraid／mad 的 `zh` 欄位額外加註「＝ scared」「＝ angry」的說明，跟先前 heavy／slim／beautiful 的做法一致。從 11 字變 20 字。
- **`content/sentences/emotions.json`**：新增 6 句（005-010），涵蓋全部 9 個新字。
- **驗證**：跨主題單字衝突掃描（確認 glad/calm/proud/fine/okay/afraid/mad/upset/lonely 都沒有跟其他主題撞名）、`jsonschema` 驗證、全部 21 支 `verify-*.ts`、`npm run build`、`build-standalone-demo.mjs`＋`build-content-review.mjs` 都通過，兩份 `demo-standalone.html` 已同步。
- **未處理**：`dashboard.html` 的 Emotions 對應區塊同樣卡在 Personal Characteristics 拆分前的舊資料（見 9.59／9.60 節同一個已知缺口），這次也沒有動它。

### 9.2 成就徽章改版：改接正式的 43 個徽章清單（2026-08-06）

依 `docs/handoff-prompt-badges-page.md` 的規格全面改版，不是換版面而已，資料來源整個換成 `content/badges/badges.json`（10 大分類、43 個徽章），舊版自己設計的 4 分類×銅銀金 12 個假徽章邏輯已刪除。

- **版面**：徽章圖案在上、說明文在下，圖案統一 240x240px 圓形遮罩；美術圖檔還沒做，先用 `--color-primary-500` 藍色底色＋徽章代號（如 `VM-01`）當佔位圖（程式碼有 TODO 註記，之後直接把 `.badge-media-fill` 換成 `<img src={icon_placeholder}>` 即可，不用動版面結構）；已取得＝100% 透明度，尚未取得＝24% 透明度＋一圈 `--color-border` 淡邊框；累積次數型徽章（`display_count: true`）額外顯示「已達成 N 次」；`.badge-row` 用 `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))` 做 RWD，手機上自動變少欄。
- **資料缺口怎麼補**（跟使用者確認過做法）：新增獨立模組 `app/src/badgeStats.ts`，比照 `playTime.ts`／`playLog.ts` 的模式，開新的 localStorage key（`englishForKids.badgeStats.v1.<使用者 id>`），不改動既有 `progress.ts` 的資料結構。裡面追蹤：累計題數（不限題型／各題型分開，供「完成題目數量」「遊戲題型精通」用）、跨題型連續答對計數（供「連勝十題」用，答錯歸零、滿門檻歸零重算）、每輪「全對且未用提示」次數（供「完美關卡」用，`orderingGame.ts` 新增 `hintUsedThisRound` 旗標）、早起／假日練習次數（供「正向作息」用）、連續天數門檻各自獨立的 checkpoint／達成次數（供「連續學習天數」用，4 個門檻 3/7/15/30 天各自計數、各自在跨過門檻時歸零重算，不是單一進度條升級）。這些統計數字在四種題型既有的 `onCorrect`／`onWrong` callback（音效功能新增的那組 hook）跟四個「一輪完成」的時間點上串接寫入。累計學習天數（不要求連續）則直接讀 `playLog.ts` 新增的 `getTotalDaysPlayed()`，沒有另外存。「重置進度紀錄」按鈕現在會一併呼叫 `clearBadgeStats()`。
- **13 個徽章暫時無法真的判斷達成與否**：因為目前系統還沒有 Unit 0 上架、Stage D 綜合關卡、「收藏最愛單字」功能、6 世界 24 主題架構，`badge.onboarding.unit0_complete`／`first_stage_d`／`first_favorite`、`badge.favorites.*`（3 個）、`badge.world_completion.*`（7 個）這 13 個徽章目前固定顯示成鎖定，並多顯示一行「🚧 功能開發中」的提示（`main.ts` 的 `BADGES_BLOCKED_BY_MISSING_FEATURE` 常數），等對應功能做出來後再回來接上真正的判斷邏輯，不會用假資料硬讓它解鎖。
- **驗證**：新增 `app/scripts/verify-badgestats-logic.ts`（8 個測試，涵蓋累計題數、連續答對、完美關卡、早起/假日、連續天數門檻各自計數與中途斷掉重算、多使用者隔離、清除功能），`npm run build` 與全部既有 `verify-*.ts` 一起重跑都通過，另外手動 grep 打包後的 JS 確認徽章代號（如 `VM-01`）跟「功能開發中」字樣真的有進到最終產出。
- **美術圖陸續完成後接上真圖**（2026-08-07）：`assets/badge/`（依 `assets/badge/SKILL.md` 的羊毛氈／黏土手作風格規範，1024x1024、圓形直徑 800px＋112px 白色留白）目前完成 27／43 個徽章代號的美術圖。新增 `app/src/badgeImages.ts`（跟 `avatars.ts` 同一套 `import.meta.glob` 模式），原始圖裁切壓縮成 200x200 縮圖放進 `app/src/assets/badges/`；`renderBadgeCard()` 找得到對應代號的圖就直接顯示真圖，找不到才退回藍色底色＋代號佔位圖，兩者共用同一套 100%／24% 透明度規則，版面結構不用另外處理。之後美術圖陸續補齊，只要把新圖放進 `assets/badge/` 依代號命名、重新跑一次縮圖批次處理即可自動接上，不用再改程式碼。

### 9.59 單元一名稱由「我和我的家」改為「我和身邊的人」（2026-08-23）

使用者看首頁截圖後回饋：「單元一：我和我的家」跟底下 6 個主題（Family／People／Appearance／Emotions／Personality Traits／Parts of Body）對不太起來——只有 Family／People 真的跟「家」有關，其餘 4 個是 2026-08-22 從 Personal Characteristics／Parts of Body 補充而來的「描述人」主題，找不到更適合的單元才留在單元一（緣由見 `docs/content-plan.md` 3.1 節 2026-08-22 二／2026-08-23 四 兩則註記）。提供兩個方案：(A) 只改單元名稱不搬動主題、(B) 拆成兩個單元（Family／People 一組、其餘 4 個「描述人」主題另成一組），使用者選擇影響最小的 **方案 A**。

- **content 端已完成**（本次改動）：`content/badges/badges.json` 的 `badge.unit_completion.unit1`（`name`／`description`／`condition`）、`docs/content-plan.md`（3.1 節表格＋新增 2026-08-23 四 註記）、`docs/achievement-badges.md`（WC-01 列）、`dashboard.html`（8 處文字）、`app/scripts/verify-unit-completion-badges.ts`（`UNITS` fixture 的 `unit1.label`）都已把「我和我的家」改成「**我和身邊的人**」。`unit1` 這個內部識別碼不變，只有顯示文字改動。
- **App 端待執行**：`app/src/main.ts` 的 `UNITS` 陣列裡 `unit1` 的 `label` 欄位（目前是 `"單元一：我和我的家"`）也要改成 `"單元一：我和身邊的人"`，只有這一行，其餘程式邏輯不受影響。已寫成 `docs/handoff-prompt-rename-unit1-label.md` 交給技術架構 session 執行。
- **已知既有落差（本次未處理）**：檢查 `dashboard.html` 時發現它從 2026-08-22 Personal Characteristics 拆成 Appearance／Emotions／Personality Traits 三個主題後就沒有同步更新——表格與明細區塊仍顯示舊的「Personal Characteristics 個性與特點 16 字」單一項目，而不是拆分後的 3 個主題。這是跟本次改名無關的獨立既有問題，之後有空可以一併整理成拆分後的 3 個項目。
- **App 端已於 main.ts 執行完成（2026-08-23）**：`UNITS` 陣列 `unit1` 的 `label` 已改成 `"單元一：我和身邊的人"`，`key`／`topicFileKeys` 不變。`npm run build`（含 `tsc --noEmit`）通過；`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本已同步。

### 9.58 Family 主題移除 dad／daddy／mom／mommy／grandma／grandpa 六個字（2026-08-23）

使用者要求把這 6 個字從 Family 拿掉，只留 father／mother／grandfather／grandmother，並且維持「father 名詞 爸爸（= dad; daddy）」這種在 zh 欄位用括號註記同義稱謂的寫法（mother／grandfather／grandmother 原本就是這樣寫，這次不用改，只是把 dad/daddy/mom/mommy/grandma/grandpa 對應的獨立詞條刪掉）。Family 從 21 字變成 15 字。

- **`content/vocab/family.json`**：移除 6 個詞條；`father`／`mother`／`grandfather`／`grandmother` 的 `related_forms` 原本互相指向被刪的詞條，一併清空（不留斷掉的 vocab.id 參照）。
- **`content/sentences/family.json`**／**`content/passages/family.json`**：唯一用到 `grandma`／`grandpa` 的短句跟短文（"My grandma and grandpa live with us."）改成 `grandmother`／`grandfather`，`vocab_ids` 跟短文的選擇題選項／答案／`source_sentence` 一併同步。
- **跨主題連帶影響（比想像中大）**：`dad`／`mom`／`grandma` 這幾個字原本靠 Family 的 vocab 全域可查，appearance／occupations／tableware（B 句）跟 appearance／health／people／places_directions／tableware／weather_nature（短文）都有用到。句子沒有點字查詢功能，不受影響；短文有，逐一比對後在 `content/glossary/{appearance,health,places_directions,tableware,weather_nature}.json` 補上 `dad`／`mom`／`grandma` 的翻譯（`people.json` 的 glossary 早就已經有 `mom` 這個備用詞條，直接生效，不用加）——這樣這幾個主題的短文點字查詢還是查得到中文意思，只是不再有收藏星星（vocabId 變成 null，因為這幾個字現在只在 glossary 不在任何主題的 vocab 裡）。
- **驗證**：`jsonschema` 驗證通過；跨主題撞字檢查沒有意外衝突；Python 模擬 `lookupPassageWordZh()` 逐字查詢，family 跟前述 6 個受影響主題的短文都重新確認一輪，`verify-passage-glossary.ts` 原本的 `EXPECTED_UNCOVERED` 清單（family／appearance／people／tableware，這 4 個是這支腳本目前有追蹤的）都不用改，加的 glossary 剛好補上少掉的那幾個字。
- **連帶炸出 3 支寫死 family 舊資料的驗證腳本**：`verify-matching-logic.ts`（寫死「Family 應該有 21 字」）、`verify-flashcard-logic.ts`（同樣寫死 21、外加測試 6／9 分別直接抓 `daddy`／`grandma` 這兩個已經被刪的字當測試案例）、`verify-capstone-questions.ts`（額外驗證段落直接抓 family 的 `dad`／`daddy` 同義詞組）——這三支都全部改成 15 字，並把原本借 family 的 dad/daddy 同義詞組驗證「干擾選項不會洩漏同義詞」的兩個測試案例，改成借 parts_of_body 的 `foot`／`feet`（不規則複數，一樣是 `related_forms` 互相關聯，驗證的是同一套排除邏輯，換題目不影響測試涵蓋範圍）；`verify-flashcard-logic.ts` 測試 9（單純測 reveal_en／reveal_zh 固定填對）原本抓的 `grandma` 改抓還在的 `father`。全部 21 支 `verify-*.ts` 重跑一次都通過，`npm run build` 通過。
- **`docs/content-plan.md`**（附錄字數表）、**`HANDOFF.md`** 第 9 節功能對照表、**`dashboard.html`**（Family 卡片的單字表格／短句／短文段落）三處的 Family 字數／內容一併同步成 15 字、拿掉 dad/daddy/mom/mommy/grandma/grandpa 的表格列，短句短文換成 grandmother/grandfather。
- `node scripts/build-standalone-demo.mjs`＋`build-content-review.mjs` 重新產生，根目錄兩份複本已同步。

### 9.56 拆分「單元 0 教室常用語」為 Greetings／Pronouns 兩個主題（2026-08-23，已於 9.57 執行完成）

使用者提議把單元 0 的 20 個字拆成兩個主題（問候／代名詞），評估後跟使用者確認兩個細節：「can you help me」併入問候主題（重新定位成「打招呼與求助用語」）；OB-02「暖身起步」徽章改成兩個主題都要完成 Stage A 單字配對才算達成。

- **`content/vocab/greetings.json`**（新，13 字）：hi／hello／bye／good morning／good afternoon／good evening／good night／please／thank you／you're welcome／sorry／excuse me／can you help me。`content/vocab/pronouns.json`（新，7 字）：I／you／he／she／we／they／it。拆分前後 20 個字的英文字集合完全一樣（用 Python 逐字比對過），只是重新分組，不影響其他主題的全域查字結果，不用回頭改任何其他主題的 `EXPECTED_UNCOVERED`。
- **短文**：greetings 沿用原本「Hello, Friend!」故事，補一句「In the evening, we say good evening too.」讓 good evening 也有短文出現的機會，換掉的第 2 題考點；pronouns 換成新故事「My New Classroom」，7 個代名詞都有出現。兩篇短文都用 Python 模擬 `lookupPassageWordZh()` 的逐字查詢邏輯驗證過，`glossary/greetings.json`／`glossary/pronouns.json` 補齊對應的基本詞彙翻譯，剩下查不到的都是預期中的基本文法字／人名。
- **驗證**：`jsonschema` 驗證 vocab／sentences／passages／glossary 四種檔案格式都過；跨主題撞字檢查（排除跟舊 `unit_zero.json` 暫時重複的預期狀況）沒有意外衝突；`verify-passage-glossary.ts`／`verify-multi-topic.ts`／`verify-capstone-questions.ts`／`build-content-review.mjs` 的主題清單都把 `unit_zero` 換成 `greetings`＋`pronouns`；全部 21 支 `verify-*.ts` 重跑都通過。
- **`content/units/unit0.json`**：純文件性質（main.ts 沒有實際讀取），`name_zh`／`description_zh`／`vocab_ids` 已更新反映兩個新主題。
- **`content/badges/badges.json`**：OB-02「暖身起步」的 `description`／`condition` 順手修正——原本還寫著「招呼語跟數字」（Unit 0 早就不收數字了，是舊文案沒跟著改），改成「招呼語跟代名詞」，`condition` 加註兩個主題名稱。
- **`docs/content-plan.md`**：3.1 節表格、3.5 節都補上拆分說明；**`docs/achievement-badges.md`**：OB-02 那行同步修正跟 badges.json 一致的文案。
- **`docs/handoff-prompt-split-unit-zero.md`**（新增）：交給技術端的完整施工清單——`TOPICS`／`UNITS`（`unit0` 的 `topicFileKeys` 改成兩個 fileKey）／`TOPIC_THUMBS` 三處更新；首頁「單元 0」專屬區塊改成迴圈渲染（跟其他單元同一套邏輯，不再寫死一張卡）；OB-02 判斷邏輯（`computeUnit0MatchingComplete()`）改成兩個主題都要通過 Stage A 配對；刪除舊的 `unit_zero` 四個內容檔案（提醒動作要快，避免全域查字表短時間內撞字不確定解析到哪個主題）；`verify-unit-completion-badges.ts` 內部鏡像 fixture 同步更新。
- **順帶發現一個既有的、跟這次改動無關的落後狀況**：`verify-passage-glossary.ts` 的 `TOPICS` 清單目前只涵蓋 16 個主題，沒有把 `weather_nature`／`geographical_terms`／`places_directions`／`occupations`／`money`／`health`／`forms_of_address` 這 7 個世界四／五主題算進去（雖然這 7 個主題早就已經接進 App 選單），代表這支腳本目前沒有真的驗證到這 7 個主題的短文查字邏輯。這次沒有一併處理（不在這次任務範圍內），先記錄下來，之後有空可以評估要不要把這 7 個主題也補進這支腳本的驗證範圍。

### 9.57 App 端執行：拆分「單元 0 教室常用語」為 Greetings／Pronouns 兩個主題（2026-08-23）

延續 9.56 交接的提示詞，這次處理技術端實作。

- **`main.ts` `TOPICS`**：`{ fileKey: "unit_zero", label: "Unit 0　教室常用語" }` 改成兩筆 `{ fileKey: "greetings", label: "Greetings 問候與禮貌用語" }`／`{ fileKey: "pronouns", label: "Pronouns 代名詞" }`。
- **`UNITS` 的 `unit0`**：`topicFileKeys` 從 `["unit_zero"]` 改成 `["greetings", "pronouns"]`（`key`／`label` 不變，仍是整個單元 0 的名稱）。
- **`TOPIC_THUMBS`**：`unit_zero` 縮圖改成 `greetings: { emoji: "👋", className: "thumb-greetings" }`／`pronouns: { emoji: "🙋‍♂️", className: "thumb-pronouns" }`；`style.css` 對應新增 `.thumb-greetings`／`.thumb-pronouns` 兩個規則，取代舊的 `.thumb-unit-zero`。
- **`renderTopicSelect()` 的「🚀 新手起手式」區塊**：從原本寫死渲染單一 `unitZeroSummary` 卡片，改成迴圈渲染 `unitZeroConfig.topicFileKeys` 底下所有已上架的主題（跟單元一～六找 `topicsInUnit` 同一套邏輯），這樣之後如果兩個主題其中一個還沒上架，區塊會自動只顯示已上架那張卡，不會整個消失或壞掉。
- **OB-02（`computeUnit0MatchingComplete()`）**：從「Unit 0 是否上架＋是否完成過一輪 `unit_zero` 的 Stage A 配對」改成「`unit0` 底下的 `greetings`／`pronouns` 兩個主題是否都上架、且都各自完成過一輪 Stage A 配對」——兩個主題都要完成才算達成，跟其他單元完成度徽章「底下所有主題都要完成」的判斷邏輯一致。附近提到「unit_zero 主題的 Stage A 配對」的註解也同步改成「greetings／pronouns 兩個主題」。
- **`verify-unit-completion-badges.ts`**：內部鏡像的 `UNITS` fixture，`unit0` 的 `topicFileKeys` 同步從 `["unit_zero"]` 改成 `["greetings", "pronouns"]`，跟 `main.ts` 保持一致（`unitsToCheck` 邏輯本來就會把 `unit0` 排除在 `unit_completion` 判斷之外，這個改動不影響任何既有測試案例的判斷結果）。
- **刪除舊檔案**：`content/vocab/unit_zero.json`／`content/sentences/unit_zero.json`／`content/passages/unit_zero.json`／`content/glossary/unit_zero.json` 四個檔案已刪除（`main.ts` 的 `TOPICS`／`UNITS` 不再引用 `unit_zero` 之後立刻刪，避免全域查字表短時間內跟新的 `greetings.json`／`pronouns.json` 撞字）。
- **驗證**：`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過；grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `greetings`／`pronouns`／`.thumb-greetings`／`.thumb-pronouns` 都進到最終產出。`node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs` 重新產生，根目錄兩份複本都已同步（`content-review.html` 現在涵蓋 17 個主題）。

### 9.53 App 端執行：更新「關於本站」頁面介紹文字（2026-08-23）

延續 9.52 交接的提示詞，這次處理技術端實作。

- `renderAbout()`（`main.ts`）原本單一段 `aboutText`（含「GEPT Kids」字樣）改成三段 `<p class="about-text">`：`aboutTagline`（標語「每天玩一點英語！」，另加 `.about-tagline` class）→ `aboutText`（家長視角的平台緣由正文）→ `aboutFeedback`（「有任何問題或建議，都歡迎跟我說。」）。`aboutTitle`（標題）與 `metaText`（版本號／作者／email）維持不動。
- `style.css` 新增 `.about-tagline` 規則（粗體＋`--color-primary-700`），讓標語段落視覺上比正文稍微突出，沿用 `.about-text` 既有間距，沒有另外調整版面。
- `verify-about-page.ts` 測試 6 原本斷言的是舊版「GEPT Kids」文案，改成斷言新版三段文字都存在、且全檔案不再出現「GEPT Kids」字樣。
- **驗證**：`npm run build`（含 `tsc --noEmit`）通過；全文搜尋 `app/src` 確認「GEPT Kids」字樣已完全清除；全部 21 支 `verify-*.ts` 重跑一次都通過。`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本已同步。

### 9.54 「關於本站」頁面微調：移除重複標題，標語改成標題級字級（2026-08-23）

使用者看過 9.53 的畫面後回饋兩點：（1）「每天玩一點英語！」標語字級應該跟「關於 English for Kids」標題一樣大；（2）乾脆刪掉「關於 English for Kids」這個標題，改由標語直接當標題用。

- `renderAbout()` 移除 `aboutTitle`（`<h2 class="section-heading">關於 English for Kids</h2>`）整段，`aboutTagline` 變成頁面裡第一個內容元素。
- `.about-tagline` 規則從原本單純的「粗體＋主色」改成完整比照 `.section-heading` 的字級組合：`margin-top: var(--space-6)`、`font-family: var(--font-display)`、`font-size: var(--text-h3)`、`font-weight: 700`、`color: var(--color-primary-700)`，撐起跟原本標題一樣的視覺份量。
- `verify-about-page.ts` 測試 6 原本斷言的「應該要有 aboutTitle」改成反向斷言「不應該再有 aboutTitle」。
- **驗證**：`npm run build` 通過；全部 21 支 `verify-*.ts` 重跑一次都通過。`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本已同步。

### 9.55 「關於本站」文案微調：標語加上品牌名稱，正文補一句「讓小孩每天玩一點英語」（2026-08-23）

- 標語從「每天玩一點英語！」改成「English for Kids - 每天玩一點英語！」，讓品牌名稱跟標語出現在同一行。
- 正文段落裡「於是我決定自己動手做一個更適合這個學習階段的平台」後面接上「，讓小孩每天玩一點英語」再銜接「也能依照孩子的需求隨時調整內容」，把這句話自然嵌進原本的句子裡，不是硬加一個獨立句子。
- `verify-about-page.ts` 測試 6 的標語斷言同步改成新文字。
- **驗證**：`npm run build` 通過；全部 21 支 `verify-*.ts` 重跑一次都通過。`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本已同步。

### 9.52 撰寫提示詞：更新「關於本站」頁面介紹文字（2026-08-23，已於 9.53 執行完成）

使用者提供一段新的自我介紹文字（家長視角，說明做這個平台的緣由），要換掉 `renderAbout()`（`main.ts:1992-2017`）裡原本那句簡短介紹。我潤飾成通順的三段文字（標語＋正文＋回饋邀請），寫成 `docs/handoff-prompt-about-page-text.md` 交給技術端。順手確認：這句話是全 `main.ts` 唯一出現「GEPT Kids」字樣的地方（標準指示要求看到就移除／變更），換掉之後就不會再有殘留，不用另外處理。版本號／作者／email 那行維持不變。

### 9.51 App 端執行：修「點擊跳回頂端」＋新增「回到頂端」按鈕（2026-08-23）

延續 9.50 交接的提示詞，這次處理技術端實作。

- **`render()` 改成預設保留捲動位置**：進去前先記 `const scrollY = window.scrollY`，`app!.innerHTML = ""` 砍掉重建、跑完 if/else-if 畫面分派＋`appendBadgeUnlockModal()` 之後，在整個函式最後用 `window.scrollTo(0, scrollY)` 設回去——確保是同一個同步任務內完成，瀏覽器不會有機會先畫出「捲到 0」的那一幀，不會閃一下。
- **17 個「真正切換畫面」的 `goToXxx()` 函式**，各自在呼叫完 `render()` 之後額外加一行 `window.scrollTo(0, 0)`，蓋掉上面的預設保留行為：`goToProfile`／`logout`／`goToTopicSelect`／`goToTopic`／`goToMenu`／`goToStats`／`goToBadges`／`goToVocabOverview`／`goToFavorites`／`goToProfileDetail`／`goToAbout`／`goToFlashcards`／`goToMatching`／`goToOrdering`／`goToFillBlank`／`goToChoice`／`goToCapstone`——實際過一輪程式碼後發現比提示詞原本列的清單多幾個（`goToStats`／`goToBadges`／`goToVocabOverview`／`goToFavorites`／`goToProfileDetail`／`goToAbout` 這幾個功能列導覽目的地、跟六種題型畫面各自的 `goToXxx()`），因為它們一樣是「把 `screen` 換成不同值、顯示邏輯上不同的頁面」，符合提示詞給的判斷原則，全部一起加上；`restartEverything()` 等只是內部呼叫 `goToMatching()` 的函式不用重複加，自然繼承。其餘同一畫面內的更新（答題換下一題、展開/收合、收藏/取消收藏、開關 modal、短文點字看翻譯、徽章說明泡泡……）都沒有動，維持 `render()` 預設保留捲動位置的行為。
- **`appendBackToTopButton()`**：不分 screen，`render()` 最後（`appendBadgeUnlockModal()` 之後）無條件呼叫一次，涵蓋選使用者畫面跟七種遊戲題型畫面（這些不走 `appendShell()`）。按鈕本身固定在右下角，圓形＋陰影＋主色沿用既有的 `--radius-circle`／`--shadow-md`／`--color-primary-500`，跟 `.modal-close-btn` 風格一致；`z-index: 90` 比 `.modal-overlay` 的 `100` 低一階，不會蓋住燈箱／彈窗。
- **顯示邏輯**：`window.addEventListener("scroll", ...)` 只在整個 app 啟動時綁一次（跟 `document.addEventListener("click", ...)` 那兩段放在同一個位置），用 `document.querySelector(".back-to-top-btn")` 現抓當下 `render()` 重建出來的按鈕、`classList.toggle("visible", window.scrollY > 300)` 切換顯示，不會因為 `render()` 重畫而疊加重複綁定監聽器。
- **驗證**：`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts` 重跑一次都通過（這次改動不影響任何驗證腳本檢查的邏輯）；手動 grep 原始碼確認 `window.scrollTo(0, 0)` 剛好出現在 17 個 `goToXxx()` 函式裡、`render()` 本身有 `scrollY` 保留機制＋`appendBackToTopButton()` 呼叫；grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `.back-to-top-btn` 樣式與邏輯都進到最終產出。`node scripts/build-standalone-demo.mjs` 重新產生，根目錄複本也已同步。

### 9.50 撰寫提示詞：修「點擊跳回頂端」的 bug＋每個頁面加「回到頂端」按鈕（2026-08-23，已於 9.51 執行完成）

使用者反映點擊畫面（答題、點徽章等）會跳回頁面最上方。排查後根因是 `render()`（`main.ts:3455-3479`）每次互動都 `app!.innerHTML = ""` 整個砍掉重建 `#app`，剛被點擊、正在 focus 的按鈕跟著被砍掉，瀏覽器把焦點元素消失當成訊號，重置捲動位置——不是連結／表單／`scrollTo` 誤用（已排查排除）。同時使用者要求每個頁面都加一個「回到頂端」浮動按鈕。已寫成 `docs/handoff-prompt-scroll-fix-and-back-to-top.md` 交給技術端，涵蓋：（1）`render()` 改成預設保留捲動位置（進去前記 `scrollY`、重建完成後 `scrollTo(0, scrollY)`），只有 `goToProfile`／`logout`／`goToTopicSelect`／`goToTopic`／`goToMenu` 這類「真正切換畫面」的函式才額外呼叫 `scrollTo(0, 0)` 回到頂端；（2）在 `render()` 裡（不分 screen，仿照 `appendBadgeUnlockModal()` 的寫法）無條件加一個 `appendBackToTopButton()`，往下捲超過門檻值才淡入顯示，涵蓋登入前的選使用者畫面跟七種遊戲題型畫面（這些不走 `appendShell()`，特別提醒容易漏放）。

### 9.49 內容側同步完成：`content/badges/badges.json` 徽章 ID 改成 `unit_completion.*`，文件全面同步「世界→單元」（2026-08-23）

接續 9.48 技術端完成的 `app/src`／`app/scripts` 改動，補上內容側的收尾：

- **`content/badges/badges.json`**：WC-01~07 這 7 個徽章的 `id`（`badge.world_completion.world1~world6/all_topics` → `badge.unit_completion.unit1~unit6/all_topics`）、`category`（`world_completion`→`unit_completion`）、`tier_group`（同上）、`name`／`description`／`condition` 裡的「世界」文字都改成「單元」；`code`（WC-01~07）維持不變。OB-02 的 `condition` 文字「完成 Unit 0（教室常用語）全部單字練習」也順手改成「完成單元 0（教室常用語）全部單字練習」。改完之後 9.48 提到的「WC-01~07 暫時顯示功能開發中」的過渡狀態已經結束，恢復正常判斷。
- **`docs/plan-rename-world-to-unit.md`**（新增）：完整的變更計劃文件，含命名對照表、Unit 0 併入 0-6 序列的設計判斷（為什麼徽章邏輯要排除 unit0）、三段式分工（A 我獨立完成的文件／B 需要跟技術端同步時機的 `content/badges/badges.json`／C 技術端執行的 `app/src`、`app/scripts`）。
- **`docs/handoff-prompt-rename-world-to-unit.md`**（新增）：交給技術端的完整施工清單，9.48 就是照這份文件執行的。
- **`docs/content-plan.md`**：3.1 節標題「主題世界」改成「主題單元」，表格與所有「世界一～六」文字改成「單元一～六」，新增單元 0 那一列，並補上 2026-08-23 的變更記錄說明這次改名跟 Unit 0 併入序列的決策；3.5／3.7 節、附錄裡零星的「世界」文字一併改成「單元」。
- **`docs/achievement-badges.md`**：分類對照表「WC｜主題／世界完成度」改成「主題／單元完成度」，WC-01~07 那張表的徽章名稱／描述／條件文字同步改成「單元」，並加註 2026-08-23 的 ID 改名說明。
- **`README.md`**：TODO 那行順便重新核對目前實際接線狀態一起更新——22／26 個規劃主題已全部接進 App 選單（不再是舊文字寫的「12 個」），世界一～五文字改成單元一～五。
- **`dashboard.html`**：表格與卡片裡「世界一」～「世界四」文字置換成「單元一」～「單元四」（純文字置換，這個檔案本身內容數字已經跟目前進度不同步是既有問題，不在這次處理範圍）。
- **`content/units/unit0.json`**：`name_zh` 反映「單元 0」新定位。
- **驗證**：`python3 -c "json.load(...)"` 確認 `badges.json` 改完仍是合法 JSON、43 個徽章都在、`unit_completion` 7 筆 ID／category／tier_group 都正確、全文不再含 `world` 字樣；`docs/content-plan.md`／`docs/achievement-badges.md` 全文搜尋「世界」確認剩下的都是刻意保留的歷史敘述文字（說明「原本叫世界」的變更記錄），不是遺漏。
- **順手抓到技術端沒改到的地方**：`content/schema/badge.schema.json` 的 `category` 欄位 enum 還是舊的 `world_completion`，沒改的話 `badges.json` 會過不了 schema 驗證，一併補上 `unit_completion`；7 個 `unit_completion` 徽章單獨過 schema 驗證確認過（另外 8 個 `game_mastery` 徽章因為 id 含中文字而驗證失敗，是既有的、跟這次改動無關的問題，不是這次引入的）。
- **後續微調（2026-08-23）**：使用者看畫面截圖後回饋 WC-01~06 的徽章名稱「XX 單元通關」重複顯示「單元通關」四個字略嫌累贅，改成只顯示單元名稱（例如「我和我的家」，不加「單元通關」後綴），`condition`／`description` 說明文字不變，`docs/achievement-badges.md` 的徽章名稱欄同步更新。

### 9.48 「世界」全面改名為「單元」，Unit 0 併入 0～6 連貫序列（2026-08-22）

跟使用者確認後決定：原本的「6 大世界」分類容易讓人誤會成地圖／關卡世界，改叫「單元」；因為應用還沒正式對外發布、沒有真正的使用者進度資料，這次採用最徹底的做法，連內部識別碼（`WORLDS` 常數、`world1`～`world6`、`badge.world_completion.*`）都一起改，不做新舊 ID 相容轉換。同時把原本獨立於 6 大世界之外的「Unit 0 教室常用語」整合進來，變成「單元 0」，跟單元一～六形成連貫的 0-6 序列。完整規劃邏輯見 `docs/plan-rename-world-to-unit.md`。

- **`app/src/main.ts`**：`WorldConfig`→`UnitConfig`，`WORLDS`→`UNITS`，`world1`～`world6`→`unit1`～`unit6`，新增 `unit0`（`topicFileKeys: ["unit_zero"]`）。`renderTopicSelect()` 改成從 `UNITS` 挑出 `unit0` 獨立渲染「🚀 新手起手式」區塊，其餘 `unit1`～`unit6` 照原本迴圈邏輯跑（`unit.key === "unit0"` 時 `continue` 跳過，避免重複渲染）。徽章分類顯示（`BADGE_CATEGORY_DISPLAY`／`BADGE_CATEGORY_ORDER`）的 `world_completion`→`unit_completion`。`computeBadgeViewState()` 的 `unit_completion` case：比對邏輯不變（仍是「這個單元規劃的全部主題都要存在且通過 Stage D」），但明確排除 `unit0`——`unitsToCheck` 用 `.filter((u) => u.key !== "unit0")`，`all_topics` 只需要 `unit1`～`unit6` 全部完成，不需要 `unit0`（它已經有專屬的 OB-02 新手徽章 `unit0_complete`，不需要再產生一個語意重複的 `unit_completion` 徽章）。
- **`app/src/style.css`**：`.world-section`／`.world-section:first-of-type`／`.world-title`／`.world-coming-soon` 改成 `.unit-section`／`.unit-section:first-of-type`／`.unit-title`／`.unit-coming-soon`；`.unit-zero-section`／`.unit-zero-hint` 本來就是對的命名，沒有改動。順手把幾處提到「世界」的中文註解也改成「單元」。
- **`app/src/types.ts`**：`BadgeCategory` 型別的 `"world_completion"` 改成 `"unit_completion"`。
- **`app/scripts/verify-world-completion-badges.ts` 改名為 `verify-unit-completion-badges.ts`**：內部的 `WorldConfig`/`WORLDS` 鏡像 fixture 整套改成 `UnitConfig`/`UNITS`（含新增的 `unit0` 項目），`isWorldCompletionAchieved()` 改名為 `isUnitCompletionAchieved()` 並比照 `main.ts` 排除 `unit0`；全部測試案例的 `world1`／`world3` 等字面值改成 `unit1`／`unit3`，斷言訊息同步改成「單元」。新增測試 10：即使 `unit_zero` 主題本身通過 Stage D，`isUnitCompletionAchieved("unit0", ...)` 也不該判斷為達成，`all_topics` 也不受 `unit0` 完成與否影響——確保程式邏輯遇到 `unit0` 這個 key 時的行為符合預期，不會因為 `UNITS` 陣列多了一項就出錯。
- **`app/scripts/verify-flashcard-logic.ts`**：註解裡提到 `world_completion` 的地方改成 `unit_completion`，純文字修改，測試邏輯本身沒變。
- **順手清掉的殘留**：`build-content-review.mjs`／`verify-menu-progress-tier.ts` 裡各自一處提到「世界」的註解／已改名檔案的引用也一併修正，全文搜尋 `world`／`World`／`世界` 確認 `app/src`／`app/scripts` 底下不再有殘留（`dist/` 裡的舊 hash 檔名產物不算，會在下次 build 時自然被新產物取代）。
- **跟 `content/badges/badges.json` 銜接的空窗期**：這次改動之後、`badges.json` 的徽章 `category`／`id` 還沒同步改成 `unit_completion.*` 之前，`computeBadgeViewState()` 的 `switch` 遇到舊的 `category: "world_completion"` 會落到 `default` 分支，回傳 `{ achieved: false, blockedByMissingFeature: true }`——也就是 WC-01~07 這幾個徽章會暫時顯示成「功能開發中」鎖定狀態，不會顯示錯誤或崩潰，是安全的過渡狀態，等 `badges.json` 同步更新後就會恢復正常判斷。
- **驗證與 build**：`npm run build`（含 `tsc --noEmit`）通過；全部 21 支 `verify-*.ts`（含改名後的 `verify-unit-completion-badges.ts`）都通過；`grep dist/assets/*.js／*.css` 確認 `unit_completion`／`.unit-section`／`.unit-title`／`.unit-coming-soon`／「單元一：我和我的家」等新字串都進到最終產出（`badges.json` 帶進來的舊 `world_completion.*` 徽章 ID 字串仍在 JS 裡，是預期中的、等待內容側同步的過渡狀態，不是我方遺漏)；`node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs` 重新產生，根目錄複本也已同步。

### 9.47 App 端接線：Tableware 改名為 Kitchen & Dining 廚房與餐具（2026-08-22）

延續 9.46 記錄的內容側工作，這次處理技術端：`main.ts` 的 `TOPICS` 陣列裡 `tableware` 這筆的 `label` 從 `"Tableware 餐具"` 改成 `"Kitchen & Dining 廚房與餐具"`，`fileKey` 維持 `"tableware"` 不變（不是新增或拆分主題，`WORLDS`／`TOPIC_THUMBS` 都不用動，🍽️ 這個 emoji 沿用）。

- **驗證與 build**：這次改動不涉及任何 `verify-*.ts` 檢查的邏輯（純顯示名稱，`fileKey` 沒變），只跑 `npm run build`（含 `tsc --noEmit`）確認通過；`grep dist/assets/*.js` 確認新名稱進到打包產出；另外確認 `content/vocab/tableware.json` 已經是 13 個字（含 9.46 新加的 6 個廚房電器）。
- `node scripts/build-standalone-demo.mjs`／`node scripts/build-content-review.mjs` 重新產生，根目錄的 `demo-standalone.html`／`content-review.html` 複本也已同步複製（見 9.44 訂下的慣例）。

### 9.46 Tableware 擴充改名為 Kitchen & Dining 廚房與餐具（2026-08-22）

使用者想把「Tableware 餐具」改成「廚房與餐具」並補充單字，用 `AskUserQuestion` 確認了兩件事：英文名稱在 Kitchen & Tableware／Kitchen & Dining 兩個選項裡選了 **Kitchen & Dining**；廚房新字從 refrigerator／stove／pot／sink 四個候選裡全選，另外自己追加了 microwave／oven。原本 7 個純餐具字（chopsticks/knife/plate/bowl/fork/cup/spoon）加上 6 個廚房電器／設備字（refrigerator/stove/pot/sink/microwave/oven），變成 13 字。

- **`fileKey` 維持不變**：這次是幫既有主題改名＋擴充，不是新增或拆分主題，`content/vocab／sentences／passages／glossary/tableware.json` 都還是同一個檔案，只有 `main.ts` 的 `TOPICS` 陣列裡這個主題的顯示 `label` 要從 `"Tableware 餐具"` 改成 `"Kitchen & Dining 廚房與餐具"`，已寫成簡短的交接提示詞 `docs/handoff-prompt-rename-tableware.md`（只需要改一行，`WORLDS`／`TOPIC_THUMBS` 都不用動）。
- 跨主題重複字檢查、短文查詢連鎖影響檢查都乾淨，全部 21 支 `verify-*.ts` 通過（這次沒有動 sentences／passages，純新增詞彙不影響既有引用）。
- `docs/content-plan.md` 世界二分組表與新增更新記錄已同步。
- **驗證與 build**：`npm run build`＋`node scripts/build-standalone-demo.mjs` 已重新產生，根目錄複本（見 9.44）也同步更新。

### 9.45 Houses & Apartments 補充 2 個新單字（2026-08-22）

使用者只說「再加兩個單字進去」沒指定是哪兩個，先用 `AskUserQuestion` 列出跟現有 18 字互補的候選（樓梯／陽台／車庫）讓使用者選，選了 stairs（樓梯）、balcony（陽台），18 字變 20 字。跨主題重複字檢查、短文查詢連鎖影響檢查都乾淨，全部 21 支 `verify-*.ts` 通過，`npm run build`＋`node scripts/build-standalone-demo.mjs` 已重新產生，根目錄複本（見 9.44）也同步更新。

### 9.44 Clothing & Accessories 補充 4 個新單字＋修正根目錄 demo-standalone.html 沒同步的問題（2026-08-22）

使用者指定加入：wear（穿／戴，狀態動詞）、put on（穿上／戴上，動作動詞片語）、take off（脫下／摘下）、cap（鴨舌帽／棒球帽，跟既有的 hat 帽子區隔開），原本 16 字變成 20 字，跨主題重複字檢查、短文詞彙查詢的全域連鎖影響檢查都乾淨（這次新字沒有影響到其他 16 個既有主題的排除清單）。

- **根目錄 `demo-standalone.html` 沒同步的 bug**：使用者回報「更新了嗎？我沒看到」，查下去發現專案根目錄下（`English for Kids/demo-standalone.html`，跟 `dashboard.html` 連結、`HANDOFF.md` 檔案樹記載的正式位置 `app/demo-standalone.html`是兩個不同檔案）意外存在一份沒有跟著同步更新的舊複本——用 `md5sum` 比對確認兩份內容不同，根目錄那份缺少最新的 Parts of Body 新字。已經用根目錄那份覆蓋成 `app/demo-standalone.html` 的最新內容讓兩份一致。**這份根目錄複本目前查不出是什麼時候、被誰複製過去的**（不是 `build-standalone-demo.mjs` 這支腳本產生的，這支腳本固定只寫 `app/demo-standalone.html`），懷疑是技術端在 9.42 那次接線工作測試時手動複製到根目錄方便開啟，之後沒有人記得同步。這次起，**每次 `npm run build`＋`node scripts/build-standalone-demo.mjs` 之後，多一步 `cp app/demo-standalone.html ../demo-standalone.html` 把根目錄那份也同步掉**，避免使用者不小心開到舊版本；如果之後確認根目錄這份真的不需要，可以考慮跟使用者確認後用 `allow_cowork_file_delete` 刪掉，只保留 `app/demo-standalone.html` 一份，減少混淆來源。
- **驗證與 build**：schema 驗證、跨主題重複字檢查、全域短文查詢連鎖影響檢查、全部 21 支 `verify-*.ts` 都通過，`npm run build`＋`node scripts/build-standalone-demo.mjs` 已重新產生，根目錄複本也已同步。

### 9.43 Parts of Body 補充 8 個新單字（2026-08-22）

使用者指定要加：眉毛（eyebrow）、胸部（chest）、膝蓋（knee）、臉頰（cheek）、腳複數（feet）、牙齒複數（teeth）、舌頭（tongue）、指甲（fingernail），原本 15 字變成 23 字。

- **不規則複數的處理方式**：`feet`／`teeth` 分別是 `foot`／`tooth` 的不規則複數，比照既有 `mouse`／`mice`（Animals & insects 主題）的慣例，各自建立獨立的 vocab 詞條（不是只在原詞條加註記），`related_forms` 欄位互相標記對方的 `vocab.id`（`foot.related_forms = ["voc.parts_of_body.020"]`、`feet.related_forms = ["voc.parts_of_body.011"]`，`tooth`／`teeth` 同理）。
- **驗證時意外發現**：`feet` 加進 vocab 之後，讓 Parts of Body 自己的短文（原本就有寫到 "feet" 這個字，之前查不到中文意思，是預期中的「排除清單」項目）現在變成全域查得到，這是跟 9.37／9.40 同一種正面副作用，`app/scripts/verify-passage-glossary.ts` 的 `parts_of_body` 排除清單移除 `feet`。
- **這次只動了 vocab**：`content/sentences/parts_of_body.json`／`content/passages/parts_of_body.json` 沒有改，純新增不影響既有引用。
- 這次順便確認：上一輪（9.40）交給技術端的 Personal Characteristics 拆分接線工作已經在這之間完成（見下方 9.42），舊的 `personal_characteristics.*` 四個檔案也已經被技術端實際刪除，我這邊原本擔心的「新舊主題撞字」問題已經自然解除，這次的跨主題重複字檢查也確認乾淨。
- **驗證與 build**：schema 驗證、跨主題重複字檢查、全部 21 支 `verify-*.ts` 都通過，`npm run build`＋`node scripts/build-standalone-demo.mjs` 已重新產生。

### 9.42 App 端接線：Personal Characteristics 拆成 Appearance／Emotions／Personality Traits，並清掉舊檔案（2026-08-22）

延續 9.40 記錄的內容側工作，這次處理技術端：把 `main.ts` 換成三個新主題，並清掉被取代的舊 `personal_characteristics.*` 四個檔案。

- **`main.ts`**：`TOPICS` 陣列把 `personal_characteristics` 那一行換成 `appearance`／`emotions`／`personality_traits` 三行（放在 `people` 之後、`parts_of_body` 之前）；`WORLDS` 的 world1 `topicFileKeys` 從 4 個主題變成 `["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"]` 6 個主題；`TOPIC_THUMBS` 也换成三個新主題各自的縮圖（🧑／😊／🌟），`style.css` 新增對應的 `.thumb-appearance`／`.thumb-emotions`／`.thumb-personality-traits`（`emotions` 沿用原本 `.thumb-personal-characteristics` 的 `--color-success-bg`，另外兩個各配一個既有色票）。
- **清掉舊檔案**：`content/vocab／sentences／passages／glossary/personal_characteristics.json` 這 4 個檔案已經真的刪除，不是清空——工作資料夾預設不能刪除既有檔案，這次改用 `allow_cowork_file_delete` 先取得刪除授權再刪，確認 9.40 記錄裡提到的「`tall`／`happy` 等字同時對應舊主題跟新主題兩個不同 `vocab.id`」這個隱性風險已經徹底排除（不是只讓風險消失於「目前主題選單看不到」，是連 `content.ts` 的 `import.meta.glob("../../content/vocab/*.json")` 都讀不到這份舊資料了）。
- **`verify-world-completion-badges.ts` 同步更新**：這支腳本自己一份 `WORLDS`／`AVAILABLE_TOPIC_FILE_KEYS`（代表「main.ts 實際已上架主題」）先前照 9.40 的交接說明刻意沒有跟著改，這次一併換成三個新主題；測試 3／測試 5 原本斷言 world1 是 4 個已完成主題，改成 6 個；測試 2 的訊息文字（「還有 3 個主題沒通過」）也一併修正成「還有 5 個主題」。
- **驗證與 build**：全部 21 支 `verify-*.ts` 重跑一次都通過，`npm run build`（含 `tsc --noEmit`）通過；`grep dist/assets/*.css` 確認新的 `.thumb-*` 規則、`grep dist/assets/*.js` 確認找不到任何 `personal_characteristics` 字樣（舊 `dist/assets/` 目錄下累積了很多次先前 build 留下的舊雜湊檔名檔案，這些舊產物本來就還留著舊字樣，只有這次 build 出來的最新那一份需要乾淨，已確認）；`node scripts/build-content-review.mjs`（顯示「共 16 個主題」，正確反映 personal_characteristics 拆分後的數字）與 `node scripts/build-standalone-demo.mjs` 都已重新產生並複製回工作資料夾。
- **附帶確認**：同一輪 build／驗證裡，先前 9.35～9.36 提到、技術端「還沒做」的世界四／五 7 個主題接線（`main.ts` 的 `TOPICS`／`WORLDS`／`TOPIC_THUMBS`）其實已經在本次會話中完成並通過驗證（`verify-multi-topic.ts` 涵蓋全部新主題），這裡一併確認、不再是懸而未決的項目；`build-content-review.mjs` 目前的主題清單只涵蓋到 personal_characteristics 拆分後的 16 個主題，還沒把世界四／五那 7 個算進去，這個之後如果要讓 `content-review.html` 完整反映全部主題，需要再更新這支腳本自己的清單。

### 9.40 拆分 Personal Characteristics 為三個主題：Appearance／Emotions／Personality Traits（2026-08-22）

使用者問「拆成兩個單元（外觀／個性）會不會學起來更輕鬆」，我分析後回報：32 個字其實比較像三類（外觀 7 字、情緒 11 字、性格特質 14 字），拆兩個份量不均，拆三個比較平均；使用者確認「拆解成三個，都先放在世界一，除非依照目前的世界分類你有其他建議」。我評估後認為三個新主題性質上都屬於「描述人」（跟世界一既有的 Family／People 同性質），沒有更適合的世界，維持全部留在世界一。

- **新主題**：`appearance`（Appearance 外觀特徵，7 字：tall/short/thin/strong/cute/pretty/handsome）、`emotions`（Emotions 情緒，11 字：happy/sad/angry/tired/hungry/excited/scared/bored/surprised/worried/nervous）、`personality_traits`（Personality Traits 性格特質，14 字：kind/shy/friendly/brave/smart/funny/lazy/active/quiet/polite/naughty/patient/honest/curious）。三個主題各自建立完整的 `content/{vocab,sentences,passages,glossary}/<topic>.json`（各 4 句 Stage B 例句、1 篇短文＋3 題理解題），單字內容直接沿用原本 32 字（含各自的 example_sentence），不是重新編寫。
- **舊檔案處理方式（重要，技術端要看）**：原本 `content/vocab/personal_characteristics.json`（及對應 sentences／passages／glossary）**沒有刪除**——工作資料夾的檔案保護規則不允許我刪除或改名既有檔案。這代表現在 `content/vocab/` 底下同時存在舊的 32 字（`personal_characteristics` 主題）跟新拆出來的 32 字（分散在 `appearance`／`emotions`／`personality_traits` 三個主題），**英文字完全重複**（例如 `tall` 同時是 `voc.personal_characteristics.009` 也是 `voc.appearance.001`）。因為 `content.ts` 的 `import.meta.glob("../../content/vocab/*.json")` 是讀「整個資料夾」，不是只讀 `main.ts` 的 `TOPICS` 陣列裡有登記的主題，所以這個重複現在就已經真實存在於 `globalVocabByEnglish` 這張全域查詢表裡（雖然目前還沒有實際觀察到的錯誤行為，因為 `content.ts` 對重複 key 的處理是「後面蓋過前面」，不會噴錯，但哪個主題「後面」取決於 `import.meta.glob` 回傳物件的 key 順序，不應該依賴這種不確定的行為）——技術端把 `main.ts` 的 `TOPICS`／`WORLDS` 換成三個新主題時，**務必同時刪除（或至少清空）舊的 4 個 `personal_characteristics.*` 檔案**，一次處理乾淨。已寫成正式交接提示詞：`docs/handoff-prompt-split-personal-characteristics.md`。
- **驗證腳本同步更新**：`verify-multi-topic.ts`／`verify-capstone-questions.ts`／`build-content-review.mjs` 的主題清單都已經把 `personal_characteristics` 換成三個新主題（這幾支腳本是直接讀 `content/` 底下的檔案驗證內容完整性，不依賴 `main.ts` 的實際接線狀態，所以可以先改）；`verify-passage-glossary.ts` 的 `TOPICS`／`EXPECTED_UNCOVERED` 排除清單也同步拆成三份。**`verify-world-completion-badges.ts` 這支例外沒有動**——它的 `AVAILABLE_TOPIC_FILE_KEYS` 清單明確代表「目前 `main.ts` 實際已上架可玩」的主題，現在改的話會跟真實狀態不一致，等技術端實際把 `main.ts` 換成新主題時，要記得順便把這支腳本的 `WORLDS`／`AVAILABLE_TOPIC_FILE_KEYS` 一起同步更新（已寫進交接提示詞）。
- **文件同步**：`docs/content-plan.md`（3.1 節世界分組表＋新增更新記錄）、`README.md`（TODO 進度行）、`content/badges/badges.json` 與 `docs/achievement-badges.md`（WC-07 徽章「24 個」→「26 個」）、本文件第 5 節（已加註舊數字不可信，改看變更歷程）都已更新，反映內容主題總數從 24 變 26、世界一從 4 個主題變 6 個。
- **驗證與 build**：4 份 schema 驗證、`vocab_ids`／`answer`／`source_sentence` 交叉引用、全部 21 支 `verify-*.ts` 都通過，`npm run build`＋`node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs` 都已重新產生。

### 9.39 Personal Characteristics 主題補充 16 個新單字（2026-08-22）

我先提了三類補充建議（情緒／性格特質／外觀），使用者確認「weak 不要，其他加入」，於是把情緒（excited/scared/bored/surprised/worried/nervous）、性格特質（lazy/active/quiet/polite/naughty/patient/honest/curious）、外觀（pretty/handsome，跳過原本一起提的 weak）全部加入，原本 16 字（cute/strong/angry/funny/brave/short/thin/tall/happy/smart/tired/hungry/kind/shy/sad/friendly）維持不動，主題變成 32 字。

- 幾個有「二選一」的地方我自己拍板：scared（不是 afraid，跟其他情緒詞一樣是 -ed 結尾比較一致）、active（不是 energetic，字比較短、國小程度更合適）、pretty（不是 beautiful，同樣是字比較短更基礎）。
- 這次是純新增，沒有移除任何字，所以 `content/sentences/personal_characteristics.json`／`content/passages/personal_characteristics.json` 都不用動（`vocab_ids` 引用的都還是原本的 16 個舊字，沒有失效問題）。
- 跨主題查了一輪確認沒有撞字（原本建議清單裡的 sick 已經在 Health 主題收過，這次沒有跟著加，維持原本的建議排除）。
- 驗證：schema 驗證、跨主題重複字檢查、全部 21 支 `verify-*.ts` 都通過（因為沒動 sentences／passages，`verify-passage-glossary.ts` 這次不用跟著改排除清單），`npm run build`＋`node scripts/build-standalone-demo.mjs` 已重新產生。

### 9.38 People 主題改版：移除 neighbor／classmate，補齊人稱單複數＋年齡分類（2026-08-22）

使用者要求 People 主題移除 neighbor（鄰居）／classmate（同班同學），補上 men／women（man／woman 的複數）、person（people 的單數）、children（child 的複數），湊成完整單複數配對；另外討論了「老人／成人／年輕人」要不要收，使用者提議用 young／old 這兩個更簡單的字取代原本建議的 teenager／elderly person，我採用「young person」「old person」這個折衷做法——既用了使用者建議的簡單字根（young／old），又維持跟這個主題其他詞彙（man／woman／girl／boy／child…）一致的名詞詞性，不會混進形容詞破壞主題一致性；「成人」則採用 adult。「小孩（單數）」使用者一開始的用意其實是要 children（複數配對），不是另外加 kid，已確認過。

- **最終字表（15 字，原 10 字）**：保留 baby／boy／girl／man／woman／child／friend／people（8 字，`man`／`woman`／`child`／`people` 新增 `related_forms` 欄位互相標註單複數對應）；移除 neighbor／classmate；新增 men／women／person／children／adult／young person／old person（7 字）。
- **Stage B 例句**：4 句全部替換成新詞彙（保留「The girl and the boy are friends.」不變，其餘 3 句改用 person/adult/child 對比句、there are + men/women、young person/old person 對等句)。
- **Stage C 短文改寫**：換成新故事「People in the Park」（公園裡看到各種人：小孩／成人、年輕人／老人、男人／女人、女孩／男孩、抱嬰兒的媽媽），取代原本圍繞 neighbor／classmate 的舊故事「My Friends and My Neighbor」；`content/glossary/people.json` 同步重寫，跑過跟 9.35／9.37 同一套 tokenize 模擬驗證，除了純文法字（a/an/and/are/in/is/my/on/the/to）外都能查到中文意思。
- **連鎖影響檢查**：這次新增／移除的字（men/women/person/children/adult/young person/old person/neighbor/classmate）沒有跟其他 13 個主題的 vocab 撞字，也沒有讓其他主題的短文查詢清單需要跟著調整（不像 9.37 那次新增 he/she/we/it 牽動了 9 個主題的排除清單）——但還是照例先寫 script 全域交叉比對過，不是憑印象判斷。
- **驗證與 build**：4 份 schema 驗證、`vocab_ids`／`answer`／`source_sentence` 交叉引用、跨主題重複字檢查、全部 21 支 `verify-*.ts`（`app/scripts/verify-passage-glossary.ts` 的 people 排除清單同步更新）都通過，`npm run build`＋`node scripts/build-standalone-demo.mjs` 已重新產生。

### 9.37 Unit 0 改版：從「感嘆詞＋代名詞＋數字」限縮成「基本問候」單一主題（2026-08-22）

使用者要求把 Unit 0 的範圍收斂成基本問候，不要數字，並提供了一份詞彙清單（你／我／你們／我們／他／她／他們／請／謝謝／對不起／哈囉／請幫我／早安／午安／晚安／再見），請我補充其他基礎教室用語。跟使用者確認過三個細節後動工：「晚安」中英文其實對應兩種不同情境（見面問候 vs. 睡前道別），兩個都收，各自用中文括號註記差異（`good evening` 標「見面問候，較正式」、`good night` 標「道別用語，用於睡前」）；「請幫我」採問句 `Can you help me?`；額外補了「不客氣 you're welcome」「不好意思 excuse me」「它 it」三個字，湊齊完整人稱代名詞（I/you/he/she/we/they/it）。

- **最終字表（20 字）**：招呼語／感嘆詞（hi／hello／bye／sorry）、人稱代名詞（I／you／he／she／we／they／it，`you` 沿用既有做法合併收「你、你們」不拆兩筆，避免同一個英文字在配對題出現兩張長得一樣的卡片）、禮貌用語（please／thank you／you're welcome／excuse me）、時段問候（good morning／good afternoon／good evening／good night）、課堂求助句（can you help me），全部符合 `vocab.schema.json` 驗證。
- **數字去哪了**：移除的 10 個數字字（one-ten）**沒有直接刪掉**，改搬進既有的 `content/vocab/numbers.json`——原本 Numbers 主題其實只收錄 11-20＋zero＋hundred＋序數詞＋「number」／「how many」，是設計時預期 1-10 由 Unit 0 負責，這次如果真的把 1-10 從 Unit 0 拿掉又沒地方接住，會變成整個 App 都學不到「one」到「ten」這幾個最基本的數字。搬過去後 Numbers 主題變成 30 個字，涵蓋 0-100 完整基礎數詞＋序數詞，不會有內容缺口。
- **短文（Stage C）改寫**：換成新故事「Hello, Friend!」（Amy 認識新朋友 Lily 的故事），涵蓋多個新字（good morning／good afternoon／good night／excuse me／can you help me 等），`content/glossary/unit_zero.json` 也同步重寫，跑過跟 9.35 同一套「模擬 app 逐字 tokenize＋查詢」的驗證流程，確認除了純文法字（my/is/a/the/to/of/and/for/have/her/our/before/if/always/at）跟人名（Amy/Lily）之外，其餘內容字都查得到中文意思。
- **意外發現並修正的連鎖問題**：
  1. `content/schema/vocab.schema.json` 的 `scope` 欄位原本寫死 `"const": "gept_kids"`，全專案 21 個 vocab 檔、300＋筆單字都用這個值——這也是使用者交代要留意移除的品牌殘留（雖然只是內部分類代稱，不是畫面上看得到的文字，但既然要開源，順手一起清乾淨），已全部改成 `"elementary_core"`，`docs/content-plan.md` 的欄位說明表也同步更新。這個欄位在 `app/src/` 只有 `types.ts` 一行型別註解引用到字面值（`// 目前固定 "gept_kids"`），沒有任何邏輯真的拿它做判斷，所以改值不影響任何功能；但那行註解本身還沒改，待技術端順手處理。
  2. Unit 0 新增 he／she／we／it 之後，跟先前 9.35 章節記錄過的「I／one 變成全域查得到」是同一種連鎖效應——這幾個代名詞現在也變成跨主題全域查得到，`app/scripts/verify-passage-glossary.ts` 裡 9 個既有主題（people／personal_characteristics／colors／school／numbers／animals_insects／food_drink／clothing_accessories／houses_apartments）原本各自排除清單裡的 "he"／"she"／"we"／"it" 因此變成「預期查不到但其實查得到」，已比照 9.35 的做法把這幾個字從對應排除清單移掉；同時 unit_zero 自己的排除清單也整份換成新短文的實際內容。這支驗證腳本雖然放在 `app/scripts/` 底下，但性質是「跟著內容變化同步更新的測試資料清單」，不涉及任何程式邏輯改動，所以這次直接更新了，不是新的越界範圍。
- **驗證與 build**：全部 4 份 schema（vocab／sentence／passage／glossary）驗證通過，`vocab_ids`／`answer`／`source_sentence` 交叉引用檢查通過，跨主題重複字檢查（21 個主題、300＋字）沒有撞字；全部 21 支 `verify-*.ts`（含 `npm run build` 的 `tsc --noEmit`）重跑一輪，21/21 通過；`npm run build`＋`node scripts/build-standalone-demo.mjs` 重新產生 `dist/`／`demo-standalone.html`。

### 9.36 修正世界四＋五 7 個新主題的短文 JSON 格式錯誤（陣列包裝 vs. 單一物件）（2026-08-22）

用戶回報「單字排列順序打散了，但畫面看起來還是照抄的字母順序」，查下去發現是舊 bug 的同一個根因（`demo-standalone.html`／`dist/` 沒有重新 build，仍是打散前的舊產物），重新跑 `npm run build`＋`node scripts/build-standalone-demo.mjs` 後確認新的隨機順序（如 `family.json` 第一筆變成 `voc.family.003` cousin）已經正確反映在畫面上。

但這次重新 build 之後，跑全部 `verify-*.ts` 意外冒出一支新的失敗：`verify-multi-topic.ts` 報 `❌ Weather & Nature 天氣與自然：短文應該是 published 狀態`。追下去發現是 9.35 那批新增的 7 個主題，`content/passages/*.json` 檔案格式寫成 `[{...}]`（陣列包一個物件），但 `content/schema/passage.schema.json` 與既有 14 個主題的檔案（例如 `content/passages/family.json`）其實都是**單一物件**（不是陣列）——`app/src/content.ts` 裡 `import.meta.glob` 讀進來後用 `indexSingleByTopicKey()` 直接把整份 module 內容當成單一 `Passage` 物件存進 `passageByTopic[topicKey]`，我這 7 個檔案因為多包了一層陣列，實際存進去的是「一個裝著物件的陣列」，讀 `.status` 自然是 `undefined`，導致驗證失敗（這個問題不影響已經跑過的 `jsonschema` 格式驗證，因為那時候寫的驗證 script 有自己相容處理陣列/物件兩種格式，沒抓到這個落差）。

- **修法**：把這 7 個檔案（`weather_nature`／`geographical_terms`／`places_directions`／`occupations`／`money`／`health`／`forms_of_address`）的 JSON 從 `[{...}]` 改成 `{...}`（拿掉外層陣列），跟 `family.json` 等既有主題的格式完全一致。改完重新用 `jsonschema` 驗證一次全部通過（`status: published` 正確讀到）。
- **驗證**：重跑 `verify-multi-topic.ts`，Weather & Nature 到 Forms of Address 全部 7 個新主題都顯示「✅ 單字、句子、短文都齊全」＋「✅ 六個關卡都能跑完一輪」；接著重跑全部 21 支 `verify-*.ts`，21/21 通過。
- **重新 build**：`npm run build`＋`node scripts/build-standalone-demo.mjs` 重新產生 `dist/`／`demo-standalone.html`，這次的格式修正也一併反映進去。
- 這個 bug 只影響「這 7 個新主題的短文資料格式」，跟 `main.ts` 的 `TOPICS`／`WORLDS` 接線（見 `docs/handoff-prompt-world4-5-wiring.md`）是不同的事——接線工作本身還沒做，這次只是先把資料格式本身的錯誤修掉，避免技術端接線時才發現短文顯示不出來。

### 9.35 新增世界四＋五共 7 個主題內容（Weather & nature、Geographical terms、Places & directions、Occupations、Money、Health、Forms of address）（2026-08-22）

延續世界一～三的內容擴充模式，這次補上世界四「大自然與動物」剩餘的 2 個主題、世界五「生活情境」的 4 個主題，並把當初世界劃分表漏掉的第 24 個規劃主題「Forms of address」（稱謂）併入世界五。單字來源當時是直接抓取某測驗機構公開的官方參考字表逐字核對，不是憑印象猜的（2026-08-22 事後盤點才發現這份參考字表的來源機構有商標與著作權聲明，詳見本節下方新增的說明；`source` 欄位已改成中性描述，不再指名該機構）。

- **字數篩選策略**：比照世界一～三已有的做法——官方字數多的主題篩選常用字（例如 Places & directions 官方 27 字選了 18 字、Occupations 官方 16 字選了 13 字），官方字數本來就少的主題全部保留（Geographical terms 5 字、Money 4 字、Forms of address 4 字）。
- **跨主題重複字處理**：Health 官方字表原本有 `strong`／`tired`／`cold`，但 `strong`／`tired` 已經是 Personal characteristics 的既有單字（不同主題但同一個英文字，會撞到 `content.ts` 的全域查詢表 `globalVocabByEnglish`），`cold` 則跟 Weather & nature 的 `cold`（氣溫形容詞）語意衝突，三個都直接跳過不重複收錄，Health 最後精簡成 4 字（headache／sick／toothache／well）。有先寫 script 交叉比對全部 236＋64 個單字確認新增的 64 字跟既有內容、跟彼此都沒有重複。
- **短文詞彙表（glossary）的踩坑**：`buildInteractivePassage()`（main.ts）把短文拆成一個一個字之後，是用**完全比對**（`token.toLowerCase()`）去查 `lookupPassageWordZh()`，沒有做字幹還原（stemming），所以短文裡出現的 `books`／`grows`／`vegetables`／`dollars` 這種複數或變化形，沒辦法透過對應的單數 vocab（`book`／`grow`／`vegetable`／`dollar`）自動比對到，要嘛在 glossary 裡額外補一筆同義的變化形，要嘛把短文改寫成用原形——這次選擇在 glossary 補齊變化形。另外像 `police station`／`piggy bank`／`go back` 這種中間有空白的詞，也會被這個規則拆成兩個獨立 token（`police`＋`station`），glossary 裡如果只登記帶空白的完整片語（例如 `"police station": "..."`）永遠查不到，要拆成兩個獨立 key 各自登記。這次寫了一支比對 script，把每個新短文實際 tokenize 一遍、檢查每個 token 能不能透過全域 vocab 或該主題 glossary 查到中文，反覆修到只剩下 `a/the/is/my/and` 這類文法字跟人名（Tom／Lily／Wang／Chen／Lin）查不到（跟既有 Family 短文的既有行為一致，這是預期內、不是漏掉）。
- **`Mr.`／`Mrs.` 帶句點的小狀況**：`buildInteractivePassage()` 的 tokenize 規則（`/[A-Za-z']+|[^A-Za-z']+/g`）只留英文字母跟撇號，句點會被當成標點符號切掉，所以短文裡的 `Mr.`／`Mrs.` 實際點擊時拿到的 token 是不帶句點的 `Mr`／`Mrs`，跟 vocab 資料裡刻意保留句點的 `en: "Mr."` 對不起來（Stage A 字卡配對／字卡暖身等不經過這個 tokenize 流程的地方不受影響，一樣正常顯示帶句點的正確拼法）。這次的因應做法：vocab 資料維持正確拼法（帶句点）不動，另外在 `content/glossary/forms_of_address.json` 額外補一組不帶句點的 `mr`／`mrs` key，讓短文點字時至少查得到中文意思（不會拿到 `vocabId`，所以短文裡的 `Mr.`／`Mrs.` 不會顯示可收藏的星星，這點是可以接受的，因為稱謂本身收藏的意義不大）。
- **已完成**：`content/vocab／sentences／passages／glossary/` 四個資料夾都補上這 7 個主題的檔案，每個主題都有 4 句 Stage B 例句、1 篇短文＋3 題理解題；全部單字都有 `example_sentence`（跟其他主題一致，直接生成就補好，沒有留 TODO）。用 `jsonschema` 套件實際跑過 `vocab.schema.json`／`sentence.schema.json`／`passage.schema.json`／`glossary.schema.json` 四份 schema 驗證，另外寫 script 交叉確認：`sentences`／`passages` 裡引用的每個 `vocab_ids` 都真的存在於對應主題的 vocab 檔、每題 `answer` 都真的是 `options` 之一、每題 `source_sentence` 都是短文 `text` 的逐字子字串（這是既有的 verify 慣例，這次直接在資料產出階段就先驗證過一次）。
- **還沒做的**：main.ts 的 `TOPICS` 陣列、世界地圖分組、首頁主題縮圖（`TOPIC_THUMBS`）都還沒把這 7 個新主題接進去，這 7 個主題目前**不會出現在 App 選單上**——資料已經備好、格式已驗證過，接下來要進 App 才要動到 `app/src/main.ts`，這次沒有一併做（維持「我只動 `content/` 資料、不動 `app/src/` 程式碼」的分工）。
- 世界六「時間與節日」（Time、Holidays & festivals、Sports/interests/hobbies、Sizes & measurements，共 4 主題）還沒開始規劃，是接下來如果要繼續擴充的下一批。

### 9.34 補完 README.md 完整版＋標記過時提示詞（2026-08-22）

- **README.md**：補上專案介紹、使用緣起、內容來源標註、作者資訊（Vincent - 小禮／78vince@gmail.com，不用真實姓名）；授權條款仍未決定，保留 TODO。TODO 清單同步改成反映實際完成度（Phase 1／Phase 2 大部分項目改標 `[x]`），不再是早期規劃階段的舊措辭。（2026-08-22 事後又因為商標／著作權疑慮再改過一次內容來源那段文字，見本節下方新增的說明。）
- **標記過時提示詞**：`docs/handoff-prompt-about-footer.md` 是這次寫 README 之前起草的「全站頁尾」規劃，寫完當下不知道 9.26/9.27 已經做過同樣的事並改版成獨立「關於本站」頁面——已在該檔案開頭加註「已過時，不要依此執行」，避免之後誤把頁尾做法重新做一次。
- **補齊 `example_sentence`**：剩餘 11 個主題（People／Food & Drink／Numbers／Parts of Body／Personal Characteristics／School／Tableware／Transportation／Clothing & Accessories／Houses & Apartments／Unit 0，共 172 個單字）全部補上專屬例句（`status: draft`），格式與既有 Family／Colors／Animals & insects 三主題一致。至此全部 14 個主題（236 個單字）的字卡暖身學習單元都有例句可用，沒有內容缺口了。
- **重新 build**：內容補完後跑了 `npm run build` ＋ `node scripts/build-standalone-demo.mjs` 重新產生 `dist/` 與 `demo-standalone.html`（原本這兩份是 08-21 21:05 的舊產物，不會自動反映新加的例句），全部 21 支 `verify-*.ts` 重跑一次都通過。之後只要改了 `content/` 底下的資料，記得同樣要重新 build 才會反映到 `demo-standalone.html`／`dist/`，改原始碼本身（`app/src/`）用 `npm run dev` 開發伺服器就會自動熱更新，不用手動重 build。

### 9.33 修正功能列尺寸斷點：改用動態量測取代固定 640px（2026-08-21）

使用者截圖回報：某個瀏覽器視窗寬度下（明顯大於 640px，功能列文字標籤都還顯示著），功能列的最左邊被瀏覽器自己的畫面元素（工具列圖示）擠壓、覆蓋到「首頁」按鈕，版面看起來破格，並指出「選單列的尺寸斷點設定需要修改」。

- **根本原因**：9.30 用固定的 `@media (max-width: 640px)` 斷點決定要不要隱藏 `.nav-item-label`，這個斷點只看瀏覽器回報的「視窗寬度」，但功能列實際可用的顯示空間不見得等於視窗寬度——例如視窗沒有開到全螢幕、或被其他畫面元素擠壓可視區域時，視窗寬度可能還是大於 640px（斷點不會觸發），但功能列真正能用的寬度其實已經放不下 7 個項目的文字標籤了。任何固定的像素數字都只能猜一種情境，猜不中所有情況。
- **修法**：不再用固定寬度斷點，改成直接量測功能列自己的內容需要多寬（`nav.scrollWidth`）夠不夠放進它實際可用的寬度（`nav.clientWidth`），放不下才切成 icon-only：
  - `main.ts` 新增 `updateNavCompactState(nav)`：先移除 `function-nav--compact` class 讓文字標籤恢復顯示以量出真實需要的寬度，再比較 `scrollWidth` 是否大於 `clientWidth`，決定要不要切上這個 class。
  - `appendShell()` 把 `nav` 掛上 DOM 之後立刻呼叫一次做初始判斷，並用 `ResizeObserver` 持續監看 `nav` 的尺寸變化——不管是使用者拖動視窗、還是容器本身尺寸被別的東西影響，都會重新判斷一次。
  - `style.css` 把原本包在 `@media (max-width: 640px)` 裡的 `.nav-item-label { display: none }`／`.nav-item` 內距調整規則搬出來，改成不受螢幕寬度限制的 `.function-nav--compact .nav-item-label`／`.function-nav--compact .nav-item`，純粹靠 JS 動態切換 class 生效。
  - 640px 斷點本身沒有拿掉，但現在只剩品牌橫幅（`.brand-banner--user` 上下堆疊＋頭像固定尺寸＋標題縮字級，9.31／9.32 那組規則）在用，功能列不再依賴它。
  - `.function-nav` 的 `flex-wrap: nowrap`／`overflow-x: auto`（9.29）維持不變，當成極端窄寬度下 icon-only 都放不下時的最後保險。
- **驗證**：重寫 `app/scripts/verify-nav-responsive.ts`（6 個測試）：確認 `.function-nav--compact` 的規則不在任何固定寬度 `@media` 斷點裡；確認 `updateNavCompactState()` 有正確的移除 class／量寬比較／切換 class 邏輯；確認 `appendShell()` 在 `nav` 掛上 DOM 之後才呼叫量測，並且真的呼叫了 `ResizeObserver` 的 `observe()`；確認保險機制與 `title` 屬性沒被動到；確認 compact 模式下 `.nav-item` 本身沒有偷縮字級。`npm run build` 與全部 21 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.css`／`*.js` 確認 `.function-nav--compact` 規則與 `ResizeObserver`／`scrollWidth` 邏輯都真的進到最終產出，重新產生的 `demo-standalone.html` 也一併確認過。

### 9.32 品牌橫幅頭像調整：放大 4 倍＋移到文字上方（2026-08-20）

使用者看過 9.31 的第一版窄螢幕堆疊版面（頭像 72px、文字在上頭像在下）後，回饋兩點調整：頭像太小、想放大 4 倍；頭像想挪到文字上面（不是下面）。

- `.brand-banner-avatar` 在 `@media (max-width: 640px)` 斷點內的尺寸從 `72px × 72px` 改成 `288px × 288px`（4 倍）。
- 新增 `order: -1`，讓頭像在 flex 排序上排到文字欄前面，視覺上變成「頭像在上、文字在下」——`main.ts` 的 `appendBrandBanner()` 完全沒有改動，DOM 結構仍然是文字 `div` 在前、頭像 `img` 在後，純粹用 CSS 的 `order` 屬性調整視覺順序，不用去動 HTML 產生邏輯。
- **驗證**：`app/scripts/verify-brand-banner-responsive.ts` 新增測試 2b：確認窄螢幕斷點裡的頭像規則真的是 `height: 288px`／`width: 288px`（不是舊版的 72px）、有 `order: -1`；並額外確認 `main.ts` 的 `appendBrandBanner()` 的 DOM 順序（文字 div 在前、頭像 img 在後）沒有被意外改動——視覺排序只能靠 CSS 達成，不能悄悄改了 HTML 結構卻沒被這支測試發現。`npm run build` 與全部 21 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.css` 確認 `.brand-banner-avatar{order:-1;height:288px;width:288px;...}` 真的進到最終產出，重新產生的 `demo-standalone.html` 也一併確認過。

### 9.31 品牌橫幅窄螢幕響應式：上下堆疊＋縮小標題（2026-08-20）

使用者截圖回報「Hi! {名字}」招呼語橫幅在窄螢幕下會破版：名字（示範用的「KA~BIBARA」）夠長時，標題文字被 42px 的 `--text-h1` 撐成好幾行，讓左邊文字欄變得很高；而右邊頭像 `.brand-banner-avatar` 是 `height: 100%`（跟著文字欄高度撐開）、`width: auto`，文字欄一變高，頭像就跟著被拉成一個巨大的圓形，反過來蓋住旁邊的招呼語文字，變成截圖裡那種文字被頭像擋住、只看得到一半字的畫面。

- 跟使用者確認過根本原因（頭像尺寸跟文字欄高度綁死，不是單純「螢幕太窄」而已，任何夠長的名字理論上都會觸發，窄螢幕只是讓它更容易發生）跟修法方向（上下堆疊佈局＋縮小標題字級，兩個都做，不是二選一）之後：
  - 640px 以下 `.brand-banner.brand-banner--user` 改成 `flex-direction: column`（沿用 DOM 順序，文字欄本來就在頭像前面，改成上下排列後自然變成「文字在上、頭像在下」，不用調整 HTML 結構）。
  - `.brand-banner-avatar` 在這個斷點內改用固定尺寸 `72px × 72px`（不再是 `height: 100%`），並用 `align-self: center` 置中——這是修掉「頭像跟著文字欄高度一起被拉大」根本問題的關鍵，不管名字多長，頭像在窄螢幕下都固定是這個尺寸。
  - `.brand-banner h1` 在這個斷點內字級從 `--text-h1`（42px）調小成 `--text-h2`（32px），減少長名字造成的換行行數。
  - 桌面／平板寬度（斷點外）完全不受影響，維持原本左右排列＋頭像跟文字欄等高的版面。
- **跟 9.30 的斷點合併**：發現這次新增的 `@media (max-width: 640px)` 跟 9.30 功能列 icon-only 那個斷點是同一個寬度，原本各自獨立宣告會變成同一個檔案裡有兩段重複的 `@media`區塊（維護上容易漏改其中一段），這次順手合併成一個共用的 640px 斷點區塊，裡面同時處理功能列（`.nav-item-label`／`.nav-item`）跟品牌橫幅（`.brand-banner--user`／`.brand-banner-avatar`／`.brand-banner h1`）兩組規則，並更新對應的兩支驗證腳本（原本各自假設「自己是檔案裡唯一一個 640px 斷點」的字串比對邏輯，合併後要改成從同一個共用區塊裡各自找自己關心的規則）。
- **驗證**：新增 `app/scripts/verify-brand-banner-responsive.ts`（4 個測試）：確認斷點裡 `.brand-banner--user` 改成 `column`、頭像改用固定 px 尺寸並置中（不是 `height:100%`）、標題字級調小（不是 `--text-h1`）、桌面版預設規則（斷點之外）完全沒被動到。同時修正 `verify-nav-responsive.ts` 因為斷點合併而失效的字級檢查（原本檢查「整個斷點裡完全不能出現 font-size」，合併後品牌橫幅那段本來就會出現 `font-size`，改成只檢查 `.nav-item` 這條規則本身沒有被改字級）。`npm run build` 與全部 21 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.css` 確認整個檔案只有一個 `@media (max-width: 640px)`（合併成功、沒有重複宣告），且 `flex-direction:column`／固定尺寸的 `.brand-banner-avatar` 規則都真的進到最終產出，重新產生的 `demo-standalone.html` 也一併確認過。

### 9.30 功能列窄螢幕響應式設計：icon-only（2026-08-20）

9.29 用 `flex-wrap: nowrap` ＋ `overflow-x: auto` 解決了功能列不換行的問題，但使用者提醒這只是「裝不下就橫向捲動」的保險機制，不是真正的響應式設計——手機這種小尺寸裝置上，整排文字＋圖示還是會需要捲動才看得到全部項目。跟使用者確認過範圍（先處理這次剛做的功能列導覽，其他畫面的窄螢幕版面之後有需要再另外處理）跟做法（窄螢幕只顯示圖示，不顯示文字）之後，這次補上第一個真正的 `@media` 響應式斷點（專案目前唯一一個）。

- `style.css` 新增 `@media (max-width: 640px)`（一般手機直向寬度約 375-430px，平板直向以上都比這個寬）：`.nav-item-label` 設成 `display: none` 隱藏文字，`.nav-item` 內距再收緊到 `8px 10px`、圖示跟文字間的 `gap` 歸零（文字都藏起來了，不需要留間距）。7 個項目（6 個常駐畫面＋登出）光靠圖示在手機寬度也能一次排開，不需要靠 9.29 那個橫向捲動的保險機制。
- **文字沒有真的消失**：`main.ts` 幫 `NAV_ITEMS` 迴圈組出來的按鈕跟登出按鈕都補上 `title` 屬性（值就是原本的 label 文字），滑鼠移過去／長按還是看得到文字說明，只是不再佔用版面空間。
- **刻意不縮小字級**：跟 9.29 一樣的原則，這次也是靠隱藏文字＋收緊間距解決窄螢幕版面，沒有動任何文字的 `font-size`。
- 9.29 的 `flex-wrap: nowrap`／`overflow-x: auto` 保留不動，當作極端情況（例如瀏覽器字級被使用者手動放大很多）的最後保險，不是主要機制。
- **驗證**：新增 `app/scripts/verify-nav-responsive.ts`（3 個測試）：確認 `@media (max-width: 640px)` 斷點存在且隱藏 `.nav-item-label`、沒有偷縮字級；確認 `.function-nav` 的 `nowrap`／`overflow-x: auto` 保險機制沒有被這次調整動到；確認 `main.ts` 真的幫每個 nav 按鈕（含登出）補上 `title` 屬性。`npm run build` 與全部 20 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.css` 確認 `@media (max-width: 640px)` 斷點跟 `.nav-item-label{display:none}` 都真的進到最終產出，重新產生的 `demo-standalone.html` 也一併確認過。
- 範圍界線：這次只處理功能列（`appendShell()` 的 `.function-nav`）的窄螢幕響應式，沒有動其他畫面（首頁主題卡、成就徽章格、挑戰紀錄卡片等）的版面——這些畫面在窄螢幕下的響應式設計，已跟使用者確認過留到之後有需要再處理，整個專案目前也只有這一個 `@media` 斷點。

### 9.29 修正功能列 6 個項目擠成兩列的問題（2026-08-20）

9.28 把功能列從 5 個項目變成 6 個（加上「關於本站」）之後，使用者截圖回報登出按鈕自己被擠到第二列（`.function-nav` 原本是 `flex-wrap: wrap`，裝不下就讓瀏覽器自動換行，換行後 `.nav-item--logout` 的 `margin-left: auto` 讓它自己跑到單獨一行，版面明顯不平衡）。

- `.function-nav` 改成 `flex-wrap: nowrap` 強制維持一列，加 `overflow-x: auto` 當保險——真的裝不下的極窄螢幕會變成可以左右滑動，而不是自動換成兩列。
- `.nav-item` 內距從 `10px 20px` 縮到 `8px 12px`、圖示跟文字間的 `gap` 從 6px 縮到 4px、圖示本身從 20px 縮到 18px（新增 `.nav-item-icon svg` 規則），額外補上 `white-space: nowrap`／`flex-shrink: 0` 避免項目文字被壓縮換行或項目本身被擠扁。`.function-nav` 的項目間距（`gap`）也從 `--space-2`（8px）收緊成 `--space-1`（4px）。
- **刻意不縮小文字字級**：專案先前（9.x 系列 62 號任務）特別把全站基礎字級加大過，這是給小朋友用的 App，縮小導覽文字會違反那個決定，所以這次只透過縮小內距／間距／圖示尺寸來讓 6 個項目＋登出塞進一列，文字本身大小不變。
- **驗證**：`app/scripts/verify-about-page.ts` 新增測試 8：確認 `.function-nav` 真的是 `flex-wrap: nowrap`＋`overflow-x: auto`、`.nav-item` 有 `white-space: nowrap`、且明確斷言文字字級沒有被改成更小的 token（防止之後為了塞版面又走回頭路縮小字級）。`npm run build` 與全部 19 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.css` 確認 `.function-nav`／`.nav-item` 的新樣式規則都真的進到最終產出。

### 9.28 「關於本站」入口從個人檔案頁連結改成功能列常駐項目（2026-08-20）

9.27 把「關於本站」做成獨立頁面，但入口是個人檔案頁裡的一個連結按鈕；使用者看了功能列（首頁／挑戰紀錄／成就徽章／收藏清單／個人檔案／登出）截圖後，希望直接把「關於本站」做進這一排，不用先進個人檔案頁才能點進去。

- `NavKey` 型別新增 `"about"`，`NAV_ICONS` 新增一顆線條風格的資訊圖示（圓圈＋驚嘆號，跟其他 5 個圖示同一套 SVG 規格），`NAV_ITEMS` 新增第 6 個常駐項目「關於本站」，`onSelect` 呼叫既有的 `goToAbout()`——功能列本身（`appendShell()`）不用另外改，既有的 `.nav-item`／`.active` 高亮樣式自動套用到新項目上，不用新增 CSS。
- `renderAbout()` 從原本「沒有 `appendShell()`、自己畫一顆返回按鈕」的次頁面寫法，改成跟 `renderFavorites()` 等其他 5 個功能列目的地一樣呼叫 `appendShell("about")`，拿掉自己的「← 返回個人檔案」按鈕——功能列本身就是導覽入口，跟其他 5 個目的地的操作方式一致，使用者在任何畫面都能直接點功能列切過去，不用先繞到個人檔案頁。
- 個人檔案頁移除原本的「ℹ️ 關於本站」連結按鈕與對應的 `.about-link-btn` CSS 規則，避免同一個目的地有兩種進入方式造成混淆。
- **驗證**：`app/scripts/verify-about-page.ts` 更新測試 4-7：確認 `NavKey` 型別、`NAV_ITEMS`／`NAV_ICONS` 都真的接上「關於本站」常駐項目；確認個人檔案頁不再有 `aboutLinkBtn` 相關程式碼；確認 `renderAbout()` 真的呼叫 `appendShell("about")` 且不再有 `back-btn`；確認 `style.css` 的 `.about-link-btn` 規則已經清除乾淨（沒有殘留沒被使用的樣式）。`npm run build` 與全部 19 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `site-footer`／`about-link-btn` 都完全找不到，「關於本站」字樣與 `.about-text`／`.about-meta` 都真的進到最終產出，重新產生的 `demo-standalone.html` 也一併確認過。

### 9.27 移除全站頁尾，改成獨立的「關於本站」頁面（2026-08-20）

9.26 做完的全站頁尾（`.site-footer`）使用者反應「位置沒有很好」，改成一個獨立頁面呈現同樣的資訊（說明文字＋版本＋作者資訊），個人檔案頁「關於 English for Kids」小節也整個搬過去，不再重複顯示同一份內容（跟使用者確認過：小節整個搬到新頁面、入口放在個人檔案頁的一個連結按鈕）。

- **移除全站頁尾**：`appendSiteFooter()` 函式、`appendShell()` 與 `renderProfileSelect()` 裡的兩個呼叫點、`style.css` 的 `.site-footer`／`.site-footer a` 規則全部刪除，不留殘骸。
- **新增「關於本站」獨立頁面**：`Screen` 型別新增 `"about"`，新增 `goToAbout()`／`renderAbout()`，`render()` 的畫面分派接上。版面比照 `renderVocabOverview()` 這種「瀏覽性質、沒有 `appendShell()` 全站導覽列」的次頁面（不是首頁／挑戰紀錄／成就徽章／收藏清單／個人檔案這 5 個常駐導覽項目之一，不想讓一個純資訊頁擠掉功能列，也不想讓使用者以為這是常用功能），用跟 `renderMenu()` 一樣的 `.game-header--with-back` 標題列＋`.back-btn` 返回按鈕（文字「← 返回個人檔案」，呼叫 `goToProfileDetail()`）。內容：「關於 English for Kids」標題（沿用 `.section-heading`）＋原本的說明文字（`.about-text`，內容不變：「一個給小朋友在家練習 GEPT Kids 單字、句型與短文的學習平台。沒有排行榜、沒有跟別人比較，只記錄你自己的進步。」）＋版本／作者資訊那一行（新增 `.about-meta` 樣式，字級再壓小一階，版本號一樣是 `${pkg.version}` 動態讀，不寫死）。
- **個人檔案頁**：移除原本內嵌的「關於 English for Kids」標題／說明文字，改成一個「ℹ️ 關於本站」連結按鈕（新增 `.about-link-btn` 樣式，仿 `.back-btn` 的低調圓角外框，跟「帳號設定」那排比較搶眼的 `.secondary-btn` 按鈕區隔開來），點了才跳到 `renderAbout()`。
- **驗證**：`app/scripts/verify-site-footer.ts` 整個重寫並改名成 `app/scripts/verify-about-page.ts`（7 個測試）：確認 `.site-footer`／`appendSiteFooter()` 在 `main.ts`／`style.css` 裡都完全找不到殘骸、版本號格式檢查、`renderAbout()` 真的用 `${pkg.version}` 動態組版本字串且包含作者資訊與 mailto 連結、`goToAbout()`／`renderAbout()` 真的接上 `Screen` 型別／`render()` 分派／個人檔案頁連結三個地方、個人檔案頁不再內嵌「關於」標題文字（只留連結入口）、「關於本站」頁面文案與返回按鈕正確、三個新 CSS class 都存在且顏色沿用既有 token。`npm run build` 與全部 19 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.js`／`*.css` 確認 `site-footer` 字樣完全消失、「關於本站」文字與三個新 class 都真的進到最終產出，重新產生的 `demo-standalone.html` 也一併確認過。

### 9.26 新增全站頁尾（版本／作者資訊）＋個人檔案「關於」小節（2026-08-20，已於 9.27 移除頁尾並改版，僅存歷史紀錄）

依 `docs/handoff-prompt-about-footer.md` 的規格，App 內原本完全沒有「這是什麼平台、誰做的」這類說明文字，`README.md` 雖然已經補完整版，但那是給 GitHub 上瀏覽原始碼的人看的，實際使用 App 的家長看不到。這次補兩個小地方，讓 App 使用者也能看到同樣的資訊。

- **全站共用頁尾**：`main.ts` 新增 `appendSiteFooter()`，內容固定「English for Kids v{版本號} ｜ Vincent - 小禮 ｜ 78vince@gmail.com」（email 用 `mailto:` 連結包起來）。版本號直接 `import pkg from "../package.json"` 讀 `version` 欄位，不在 `main.ts` 裡另外寫死一份版本字串——專案的 `tsconfig.json` 本來就已經開了 `resolveJsonModule`，Vite 本身也原生支援 JSON import，實測不需要調整任何建置設定就能直接動態讀到版本號。呼叫位置：`appendShell()`（已登入的 5 個畫面——首頁／挑戰紀錄／成就徽章／收藏清單／個人檔案——共用外殼，功能列 append 完之後）與 `renderProfileSelect()`（未登入的「選使用者」畫面，畫面最後）各呼叫一次，只維護這一份函式。
- **既有命名陷阱**：`main.ts` 裡原本就有約 8 處 `<footer class="game-footer">`，是各題型畫面「下一題／重玩」之類答題動作用的頁尾，跟這次的「全站說明頁尾」是完全不同的東西。新頁尾刻意取名 `.site-footer`（不是 `footer` 也不是沿用 `game-footer`），CSS 規則完全獨立，不共用、不繼承。
- 視覺上字級刻意壓小（13px，比 `.menu-item-desc` 用的 `--text-caption`〔17px〕再小一階；目前 design tokens 沒有比 `--text-caption` 更小的字級 token，這裡直接用具體數值，不是新增色彩 token 所以不算違反「顏色沿用既有 token」的限制）、顏色用 `--color-ink-muted`、整行置中，不搶主體遊戲內容的視覺重量。
- **個人檔案頁「關於」小節**：`renderProfileDetail()` 在「帳號設定」按鈕列（`settingsActions`）append 完之後、既有「已儲存」提示訊息之前，新增跟「帳號設定」同樣層級的「關於 English for Kids」小節（標題沿用既有 `.section-heading` 樣式），內文一段定稿文案：「一個給小朋友在家練習 GEPT Kids 單字、句型與短文的學習平台。沒有排行榜、沒有跟別人比較，只記錄你自己的進步。」純文字段落（新增 `.about-text` 樣式，字級／顏色沿用既有段落文字慣例），不做成卡片或按鈕。
- **驗證**：新增 `app/scripts/verify-site-footer.ts`（5 個測試）：package.json 版本號格式檢查、`main.ts` 真的用 `${pkg.version}` 動態組版本字串（不是寫死）且內容包含作者資訊與 mailto 連結、`appendShell()` 與 `renderProfileSelect()` 都真的呼叫了 `appendSiteFooter()`、「關於」小節文案與插入位置（帳號設定之後、已儲存提示之前）正確、`.site-footer` 與 `.game-footer` 是兩個完全獨立無共用選擇器的 CSS 規則。`npm run build` 與全部 19 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.js`／`*.css` 與重新產生的 `demo-standalone.html`，確認頁尾文字、`.site-footer` class、「關於」小節文字都真的進到最終產出，且版本號是透過變數動態組出來（不是被打包工具寫死成字面常數）。
- 範圍界線：只做頁尾＋個人檔案頁的「關於」小節，沒有動 `README.md` 或既有 8 處 `.game-footer` 相關邏輯。

### 9.25 Stage D 短句填空題加上「播放這句」語音按鈕（2026-08-20）

Stage D 綜合關卡混合了三種來源的題目（見 `capstoneQuestions.ts`）：單字題（"word" 是什麼意思？）、短句填空題（例如 "My bag is ____"）、短文理解題。9.22 之前只有短文理解題有語音按鈕（`isFromPassage` 分支），短句填空題完全沒有任何提示——題目文字已經把答案挖空了，畫面上又沒有像 Stage C 那樣顯示整篇短文可以對照，使用者反映這種題型「沒有答案的提示，很難回答」。

- `capstoneQuestions.ts` 的 `buildSentenceQuizQuestions()` 幫每一題短句填空題補上 `source_sentence`（挖空前的完整原句），沿用短文理解題原本就有的同一個欄位，不新增欄位——`PassageQuestion.source_sentence` 原本的用途就是「給 Stage D 播放這句用」，只是先前只有短文理解題（手動標注）會填，這次讓短句填空題（執行期組題時就有現成的完整句子）也一起填上。
- `main.ts` 的 `renderCapstone()` 把顯示語音按鈕的判斷條件從「只有短文理解題（`isFromPassage`）」擴大成「短文理解題或短句填空題（`isSentenceQuiz`，id 以 `capstone.sentence.` 開頭）」，按鈕元件、播放/暫停邏輯完全重用既有的那一顆，只是多一種情況會觸發顯示。短句填空題一定會有 `source_sentence`，按鈕文字固定顯示「▶ 播放這句」。
- 播放的是「挖空前的完整原句」，也就是答案已經包含在語音裡——這是刻意的設計，跟 Stage B-2 句子填空「播放整句」的既有做法一致：讓使用者練習「聽力＋選字」而不是「純閱讀理解」，對還在學認字的小朋友來說是合理的輔助，不是洩題。
- **驗證**：`verify-capstone-questions.ts` 新增短句填空題的 `source_sentence` 完整性檢查——每題都要有值，且逐字比對「除了挖空位置，其他每個字都要跟 `source_sentence` 相同，挖空位置去除標點符號後要等於正確答案」（不能單純用字串替換比對，因為挖空機制本身會連同單字尾端的標點符號一起吃掉，這是既有行為不是這次新增的問題）；另外新增原始碼字串比對，確認 `main.ts` 真的把 `isSentenceQuiz` 接進顯示語音按鈕的判斷式。同時順手修正這支驗證腳本原本的 `TOPICS` 清單只有 12 個主題（世界三 School／Numbers 上架後沒同步更新，是 9.22 之前遺留的過時清單），補齊成全部 14 個主題。`npm run build` 與全部 18 支 `verify-*.ts` 重跑一次都通過；手動 grep 打包後的 `dist/assets/*.js` 確認 `capstone.sentence.`、「播放這句」、「播放整句」字樣都真的進到最終產出。
- 範圍界線：單字題（"word" 是什麼意思？）沒有加語音按鈕——題目文字本身已經把英文單字寫出來了（例如 `"school" 是什麼意思？`），不像短句填空題那樣把答案藏起來，不需要額外的聽力提示。

### 9.24 挑戰紀錄頁延伸同一套熟悉度分級：外層主題卡＋內層題型列（2026-08-20）

9.23 只處理了題型選單卡片，這次把同一套「尚未挑戰／練習中／表現不錯／完美」視覺語言延伸到「挑戰紀錄」頁（`renderStats()`），但兩層卡片的判斷規則不一樣：

- **內層題型列**（`.stats-stage-row`／`.stats-bar-fill`，展開主題卡後看到的單一題型成效）直接重用既有的 `progressTier()`，跟題型選單同一套門檻，沒有另外複製一份邏輯。
- **外層主題卡**（`.stats-topic-card`）彙整的是跨全部 6 種題型（`STAGE_ROWS.length`）的平均正確率，不能直接套用 `progressTier()` 的門檻——不然會出現「只試 1 種題型就矇對 100%」跟「6 種題型都做完且全對」被塗成同一種「完美」金色的怪現象。新增 `topicProgressTier(topicPlayedCount, totalStages, averageAccuracy): ProgressTier`，改成「完成度優先、正確率次之」：只挑戰過部分題型（不管平均正確率多高）一律算 `practicing`，要 6 種題型全部挑戰過才有資格拿到 `good`／`mastered`。`ProgressTier` 型別跟 9.23 共用同一個定義，沒有重新定義。
- 視覺實作沿用 9.23 建立的技術：只加色條（`border-left` 5px）＋淡底色 tint，標題／說明文字顏色不跟著變。`.stats-topic-card--practicing/good/mastered` 用跟 `.menu-item--*` 完全一樣的顏色對照（`--color-primary-500`／`--color-success`／`--color-accent-yellow`），`.stats-stage-row--*` 也是同一套，`.stats-bar-fill--*` 額外把正確率長條的填色也換成對應分級色。`not-started` 兩層都不加 modifier class，維持原本中性樣式。沒有新增任何新色相，全部沿用 9.23 已經建立的 token。
- 小細節：`.stats-stage-row` 原本沒有 padding／border，直接加色條會讓左右邊界跟其他沒有分級的列不對齊；補上 `padding: var(--space-3)` ＋等量負 `margin` 抵消，讓有色條跟沒色條的列視覺上左右邊界一致。
- 外層卡片與內層題型列在達到 `mastered` 時，說明文字前面都加 ⭐ 前綴（跟題型選單的做法一致）。
- **驗證**：新增 `app/scripts/verify-stats-progress-tier.ts`（6 個測試）：`topicProgressTier()` 完成度優先的邊界情況（0/1/5/6 種題型 × 各種平均正確率的組合）、內層 `progressTier()` 門檻確認跟題型選單一致、實際用真正的 `progress.ts` 的 `recordStageCompletion()` 操作「只挑戰 3/6 種題型且全部滿分」情境確認外層卡片正確判定 `practicing`（不是 `mastered`）、實際操作全部 6 種題型從 `practicing → good → mastered` 依序變化、原始碼字串比對確認 `main.ts` 真的把兩層分級接到 `.stats-topic-card`／`.stats-stage-row`／`.stats-bar-fill` 的 class name 上、`style.css` 的 9 個 modifier class 都存在且色條顏色對照表正確（也確認沒有誤用橘色/紅色）。`npm run build` 與全部 17 支 `verify-*.ts` 重跑一次都通過；另外手動 grep 打包後的 `dist/assets/*.css`／`*.js` 確認 `stats-topic-card--*`／`stats-stage-row--*`／`stats-bar-fill--*` class 名稱真的進到最終產出，同時確認 `menu-item--*` 的 4 個 class 完全沒被動到。
- 範圍界線：只處理「挑戰紀錄」頁，題型選單卡片（`.menu-item`）已完成的分級邏輯與樣式沒有被更動。

### 9.23 題型選單卡片新增熟悉度分級（尚未挑戰／練習中／表現不錯／完美）（2026-08-20）

`renderMenu()` 的 `.menu-item` 卡片原本不管有沒有挑戰過、正確率多少，樣式都長得一樣；`.menu-item-progress` 的文字顏色還寫死是橘色，連「尚未挑戰過」都顯示成橘色，容易誤導使用者以為已經有進度。這次改成用「色條＋淡底色」呈現 4 種熟悉度狀態，同時修掉那個文字顏色的瑕疵。

- `main.ts` 新增 `progressTier(progress: StageProgress | null): ProgressTier`（`"not-started" | "practicing" | "good" | "mastered"`），門檻沿用舊版徽章邏輯就出現過的 80% 分界（`bestAccuracy < 80` 是 practicing、`80-99` 是 good、`100` 才是 mastered）。只套用在有 `stageKey` 的關卡項目上（字卡暖身／Stage A-D），「📖 單字總覽」沒有正確率概念，維持中性樣式；`renderMenu()` 是用 `item.stageKey` 是否存在來決定要不要套用分級，不是用標籤文字判斷。
- 視覺實作刻意只改兩個地方：卡片左側一條 5px 色條（`border-left`）＋卡片底色一層極淡的同色調 tint。標題／說明文字維持原本顏色不跟著變色，只有 `.menu-item-progress` 那一行呼應色條顏色——這樣即使同一畫面 4 種狀態並存，每張卡片也只有一種強調色，不會互相打架。
- 顏色對照：`not-started` 維持 `--color-border`／文字改用 `--color-ink-muted`；`practicing` 用 `--color-primary-500`；`good` 用 `--color-success`；`mastered` 用 `--color-accent-yellow`（進度文字實際用加深版 `#C8981A`，因為黃色本身太淺直接當文字色可讀性不夠）。刻意不用橘色／紅色代表任何一級——橘色留給 CTA/獎勵，紅色是答錯的瞬間回饋，長期掛在卡片上會讓小朋友覺得「被扣分」，跟這個產品一路避免負面設計的方向不一致。`mastered` 分級的進度文字前面加 ⭐ 前綴。
- `design-tokens.v2-daily-play.css`（main.ts 實際 `@import` 的那份，不是沒被引用的 `design-tokens.css`）新增 3 個淡色 tint token：`--color-primary-tint`／`--color-success-tint`／`--color-accent-yellow-tint`，都是從既有色相提亮而來，沒有新增色相。
- 額外處理一個小坑：`.menu-item:hover` 原本會把四邊 `border-color` 都改成主色藍，specificity 比單一 modifier class 高，滑鼠移過去色條會被蓋成藍色；補上 `.menu-item--practicing:hover`／`--good:hover`／`--mastered:hover` 把左側色條顏色搶回來，滑鼠移過去也維持原本分級顏色。
- **驗證**：新增 `app/scripts/verify-menu-progress-tier.ts`（6 個測試）：0/79/80/99/100 五個門檻邊界值、實際用真正的 `progress.ts` 的 `recordStageCompletion()` 操作一輪 practicing → good → mastered 確認換算結果正確、原始碼字串比對確認 `main.ts` 真的把 `progressTier()` 接到 `.menu-item` 按鈕上、`style.css` 的 4 個 modifier class 都存在且色條顏色對照表正確（也確認沒有誤用橘色/紅色）、`design-tokens.v2-daily-play.css` 真的有這 3 個新 token。`npm run build` 與全部 17 支 `verify-*.ts` 重跑一次都通過；另外手動 grep 打包後的 `dist/assets/*.css`／`*.js` 確認 `menu-item--*` class 名稱、3 個 tint token、⭐ 字元都真的進到最終產出。
- 範圍界線：只處理題型選單卡片，沒有動挑戰紀錄頁 `.stats-topic-card` 或其他畫面的樣式。

### 9.22 世界三「上學去」補齊 School／Numbers 兩主題，世界三全部完成（2026-08-19）

擴充世界三（上學去）剩餘的 School（學校）與 Numbers（數字）兩個主題，補齊後世界三規劃的 3 個主題（School／Numbers／Colors）全部上架，是繼世界一、世界二之後第三個完整世界。

- **School 學校**（18 字）：school／teacher／student／classroom／book／pencil／pen／eraser／ruler／backpack／desk／blackboard／homework／playground／library／read／write／draw。短文「My School Day」＋3 題理解題。
- **Numbers 數字**（20 字）：eleven～twenty（11-20 各自獨立單字）、thirty／forty／fifty／hundred、序數詞 first／second／third、number／zero／how many。刻意不重複 Unit 0 已有的 one～ten，避免同一個字兩個主題各自收錄一份。短文「Numbers Everywhere」＋3 題理解題。
- 內容規劃原則：規劃參考的字表 School 有 39 字、Numbers 有 40 字，字數偏大；跟先前世界一／世界二主題一樣，官方字數只作為「約略抓感」（`docs/content-plan.md`，原名 `content-plan-gept-kids.md`，附錄本身也註明僅供規劃參考），實際收錄挑選對小學生最核心常用的一個子集（School 18 字、Numbers 20 字），跟既有主題規模一致（16-21 字區間）。
- 兩個主題都補齊 Stage A 單字、Stage B 4 句例句、Stage C 短文＋3 題理解題、glossary 補充詞彙表；glossary 內容不是憑印象猜的，是先寫好短文文字後，寫一支小 script 實際跑 `lookupPassageWordZh()` 同一套查詢邏輯，把「查不到中文意思的字」都列出來，再逐一分類成「留白的基本文法字/人名」跟「該收進 glossary 的內容字」兩類，比對過其他主題 glossary（如 `morning`／`class`／`name` 等重複字）的既有翻譯保持一致用詞。
- `main.ts` 的 `TOPICS` 陣列加入 `school`／`numbers` 兩筆（`WORLDS` 常數的 world3 早在世界地圖規劃時就已經寫好 `["school", "numbers", "colors"]`，這次不用再改）。
- **驗證**：`npm run build` 通過；`verify-multi-topic.ts` 加入這兩個主題後，字卡暖身＋Stage A→B-1→B-2→C→D 六個關卡（含 Stage D 綜合關卡）都能各自跑完一輪；`verify-passage-glossary.ts` 加入兩個主題的 `EXPECTED_UNCOVERED` 清單，確認短文裡查不到中文意思的字只有預期的基本文法字/人名，沒有漏補 glossary。
- **實際操作驗證世界完成度徽章**（不是只憑程式碼邏輯推論）：`verify-world-completion-badges.ts` 原本有一個過時的 `AVAILABLE_TOPIC_FILE_KEYS`（只列了 7 個主題，世界二上架時就沒同步更新），這次一併修正成完整 14 個主題清單，並新增測試 9：用真正的 `progress.ts` 的 `recordStageCompletion()` 實際記錄 School／Numbers／Colors 三個主題的 Stage D 完成紀錄，確認 `isWorldCompletionAchieved("world3", ...)` 真的從 false 變成 true（對應 main.ts 裡的 WC-03 徽章）。全部 16 支 `verify-*.ts` 重跑一次都通過。
- 重新產生 `app/demo-standalone.html`／`app/content-review.html`（現在共 14 個主題）。

### 9.21 題型選單頁「返回」改成正式按鈕，文字改為「返回選擇主題」（2026-08-19）

9.12 做的「返回」是塞在 `<h1>` 裡的純文字連結（`.menu-back-link`：無框無底色、`font: inherit` 跟標題字級一樣），使用者反應看不出這是可以點的按鈕。改成跟其他題型畫面（`stageHeader()` 的「← 返回選單」）同一套 `.back-btn` 圓角外框按鈕樣式，文字也改成更明確的「← 返回選擇主題」（原本只寫「返回」，沒說清楚會回到哪裡）。

- `renderMenu()`：移除塞進 `<h1>` 的 `backLink`，改成標題文字＋進度說明放進 `textWrap` 容器，`.back-btn` 按鈕（含 `←` 箭頭）當成 `header` 的 flex 子元素、點擊一樣呼叫 `goToTopicSelect()`。
- 新增 `.game-header--with-back` CSS：把 `.game-header` 從預設的絕對定位（`.back-btn` 疊在 `h1` 的 `padding-right: 90px` 預留空間上）改成 flex 左右排版，避免「返回選擇主題」這個比「返回選單」長兩個字的按鈕文字跟標題重疊。
- 刪除已經沒有用到的 `.menu-back-link` CSS 規則。
- **驗證**：`npm run build`（`tsc --noEmit && vite build`）通過；全部既有 16 支 `app/scripts/verify-*.ts` 重跑一次都通過（這次改動純粹是 UI/CSS，沒有動任何資料邏輯，跑驗證腳本主要是確認沒有不小心動到其他程式碼）；重新產生 `app/demo-standalone.html`／`app/content-review.html`。

### 9.20 收藏／取消收藏改用不同音效（2026-08-19）

使用者反應收藏跟取消收藏目前用同一個 `playCorrectSound()`，聽起來沒有區別，要求做成兩種不同音效。

- **新增兩個合成音檔**：`app/src/assets/sfx/favorite.wav`（收藏）、`unfavorite.wav`（取消收藏），跟既有的 `correct.wav`／`wrong.wav`／`round-complete.wav` 一樣是合成產生（單聲道、16-bit、44.1kHz），風格上刻意跟既有兩個音效拉開區隔：收藏音效是三個快速上升的高音（C6→E6→G6，帶泛音），比 `correct.wav` 的「兩音叮鈴」多一個音、音域更高更閃亮，像「收集寶物」的音效；取消收藏音效是單一音符輕輕往下滑音（880Hz→660Hz，0.22 秒），音域維持中高音、時間短促，刻意跟 `wrong.wav` 的「低沉兩音」拉開距離——因為取消收藏是使用者自己的選擇，不是「答錯」，音效不該帶警示或負面感覺。
- **`sound.ts`** 新增 `playFavoriteSound()`／`playUnfavoriteSound()`，寫法跟既有三個 `play*Sound()` 函式一致（`new Audio()` 每次播放都新建一個，可以疊在一起播放不互相打斷）。
- **`main.ts`** 的 `buildFavoriteStarButton()` 點擊處理改成：先在呼叫 `toggleFavorite()` 前記住目前的 `active`（是否已收藏）狀態，`!active` 代表這一下按下去會「變成收藏」，播 `playFavoriteSound()`；反之播 `playUnfavoriteSound()`。三個收藏入口（單字總覽、Stage C 短文翻譯泡泡、字卡暖身）共用同一個函式，一次改完全部生效，不用個別調整。
- **驗證**：這次是純音效資源＋一行判斷邏輯的調整，沒有動到任何可以用 `tsx` 測試的純邏輯（音效播放本身高度依賴瀏覽器 `Audio` API，既有慣例也沒有幫音效撰寫驗證腳本）。`npm run build`（`tsc --noEmit && vite build`，新音檔透過 `?url` 匯入，多了 2 個模組）與全部 16 支 `verify-*.ts` 一起重跑都通過。

### 9.19 單字收藏功能：三個收藏入口＋收藏清單＋OB-04／FV-01~03 徽章解封（2026-08-19）

使用者要求讓小朋友可以點單字收藏，成就徽章系統其實早就預留了接口——`badge.onboarding.first_favorite`（OB-04）跟 `badge.favorites.10／30／100`（FV-01~03）一直放在 `BADGES_BLOCKED_BY_MISSING_FEATURE`「功能開發中」名單裡等這個功能。動工前先跟使用者確認過兩個範圍問題：收藏入口要做在三個地方（單字總覽、Stage C 短文點字翻譯泡泡、字卡暖身），以及收藏清單不分主題、全部攤平在同一張清單。

- **資料層**：新增 `app/src/favorites.ts`，比照 `playLog.ts`／`badgeStats.ts` 的既有模式（`localStorage` 依 profileId 分開存，被擋掉或資料壞掉時安靜降級成「沒有收藏」，不會讓 App 掛掉）。對外函式：`isFavorite`／`toggleFavorite`／`getFavoriteVocabIds`／`getFavoriteCount`。收藏內容存的是 vocab id 陣列，不分主題攤平存放（符合使用者確認過的範圍）。
- **content.ts 技術細節（使用者明確點出的坑）**：原本 `lookupPassageWordZh()`（Stage C 短文點字看翻譯用）只回傳中文字串，查詢時優先查跨主題 vocab，查不到才退回這個主題的 `content/glossary/` 補充詞彙表——glossary 裡的字（例如短文出現的職業名稱）沒有對應的 `Vocab.id`，沒辦法收藏。修法照使用者給的方案：`globalVocabZhByEnglish: Record<string, string>` 改成 `globalVocabByEnglish: Record<string, { zh, vocabId }>`，`lookupPassageWordZh()` 回傳型別改成 `{ zh, vocabId: string | null } | null`——查得到 vocab 的字帶真正的 vocabId，退回 glossary 查到的字 vocabId 是 `null`。改動範圍真的只有這一個函式跟它唯一的呼叫點（`buildInteractivePassage()`），跟使用者說明的範圍一致。
- **三個收藏入口共用同一顆星星按鈕**：新增 `buildFavoriteStarButton(profileId, vocabId)`，未收藏＝空心線條星星，已收藏＝實心金黃色星星（`--color-accent-yellow`），點擊呼叫 `toggleFavorite()`＋借用 `playCorrectSound()` 當即時音效回饋（使用者提出的加分建議，評估後值得做）＋`render()`。三個入口：
  1. **單字總覽**（新畫面，主題內）：`renderMenu()`（題型選單）新增「📖 單字總覽」入口，`MenuItem.stageKey` 改成選填（這個入口不是 Stage，沒有「完成度」概念，不進 `StageKey`／`STAGE_ROWS`），列出 `getVocabByTopic()` 的全部單字＋英文／詞性／中文＋播放發音按鈕（`speakEnglish()`）＋收藏星星。
  2. **Stage C 短文點字翻譯泡泡**：`buildInteractivePassage()` 改用新版 `lookupPassageWordZh()`，泡泡從純文字 `<p>` 改成 flex row（文字＋星星），只有 `vocabId` 不是 `null` 時才畫星星，`event.stopPropagation()` 避免點星星時事件冒泡誤觸發外層字詞的開關泡泡邏輯。
  3. **字卡暖身**：`renderFlashcards()` 的字卡畫面（`.flashcard-word-row`）在既有的重播發音按鈕旁邊加星星，字卡單元這次動工前已經上架（見 9.16~9.18），不用留 TODO 等它。
- **新畫面：收藏清單**（全站，`renderFavorites()`）：全站導覽列新增「收藏清單」入口（比照「成就徽章」的加法，`NavKey`／`NAV_ITEMS` 都新增 `"favorites"`），列出這個使用者收藏過的所有單字，不分主題攤平顯示；沒有收藏任何單字時顯示清楚的空狀態提示「還沒有收藏任何單字，去「單字總覽」點幾個喜歡的字吧！」，不是空白一片。收藏的 vocab id 分散在各主題各自的 `content/vocab/*.json`，畫面上用一張全主題攤平的「vocabId → Vocab」查詢表反查。單字總覽跟收藏清單共用同一個 `buildVocabOverviewRow()` 列渲染函式，不重複寫兩份幾乎一樣的 DOM。
- **接通 OB-04／FV-01~03 徽章**：`BADGES_BLOCKED_BY_MISSING_FEATURE` 移除這 4 個 id（現在這份清單是空的）；新增 `computeFavoritesAggregate(profileId)`（照 `computeVocabAggregate()` 同樣的寫法，直接沿用 `getFavoriteCount()`）；`computeBadgeViewState()` 新增第 7 個參數 `favoritesCount`，`"onboarding"` 分支新增 `badge.onboarding.first_favorite` 判斷（`favoritesCount > 0`），新增 `"favorites"` case（`favoritesCount >= badge.threshold`，門檻直接讀 `badges.json`，不寫死 10/30/100）；兩個呼叫點（`snapshotBadgeAchievements()`／`renderBadges()`）都同步補上 `favoritesCount` 參數。
- **驗證（含使用者特別交代的「實際操作一次確認，不要只憑程式碼邏輯推論」）**：新增 `verify-favorites-logic.ts`（9 個測試）：收藏／取消收藏切換、跨主題攤平收藏清單、多使用者隔離、`localStorage` 資料壞掉或整個不存在時安靜降級；測試 8／9 額外交叉確認 `content/badges/badges.json` 裡 OB-04／FV-01~03 的 `category`／`threshold` 資料形狀符合 `computeBadgeViewState()` 的判斷假設，並且用真正的 `favorites.ts` 實際執行收藏動作（`toggleFavorite` 呼叫 1／10／30／100 次），確認收藏數量跨過每個門檻時這 4 個徽章會從未達成變成已達成。`verify-passage-glossary.ts` 同步更新本地重建的查詢函式（跟其他 `verify-*.ts` 一樣不能直接 `import` 用了 `import.meta.glob` 的 `content.ts`），新增專門驗證 vocabId 欄位的斷言：跨主題查詢（`sister`）要帶出正確的 `vocab.id`，純 glossary 查到的字（不在任何主題 vocab 裡）`vocabId` 必須是 `null`——這正是使用者點出的技術細節，不只是驗證 zh 意思查得到。這次還額外做了三件事，也在這裡一併說明：
  1. **程式碼人工複查**：`computeBadgeViewState()` 新增了第 7 個參數 `favoritesCount`（跟既有的 `totalDaysPlayed` 一樣是 `number` 型別，TypeScript 型別檢查沒辦法自動抓出參數順序寫反的情況），逐一比對兩個呼叫點的參數順序都跟函式簽名一致，沒有寫反。
  2. **確認 `BADGES_BLOCKED_BY_MISSING_FEATURE` 真的變空**：直接讀程式碼確認這份清單不再包含這 4 個 id。
  3. **嘗試過用瀏覽器做真正的畫面點擊驗證，但受限於工具安全邊界做不到**：本來想用 Claude in Chrome 開 `demo-standalone.html`（`file://` 路徑）實際點收藏、看徽章頁面變化，但瀏覽器導覽工具會強制在網址前面加上 `https://`，導致 `file://` 開頭的本機檔案路徑打不開——這是刻意的安全限制（避免自動化工具讀取使用者電腦上的任意本機檔案），不是 bug，所以沒有嘗試用其他方式繞過。综合以上（單元測試＋資料契約交叉確認＋人工複查＋確認清單清空），這是目前這個開發環境能做到最嚴謹的驗證，但還沒有真正的瀏覽器截圖／點擊紀錄，建議使用者收到 demo 之後自己實際點過一次收藏功能、翻到成就徽章頁確認這 4 個徽章不再顯示「功能開發中」，做最後一道確認。`npm run build`（`tsc --noEmit && vite build`）與全部 16 支 `verify-*.ts`（新增 1 支）一起重跑都通過。
- **CSS**：新增 `.favorite-star-btn`／`.favorite-star-btn--active`（沿用 `.flashcard-replay-btn` 的 hover 放大手法）、`.vocab-overview-list`／`.vocab-overview-row`／`.vocab-overview-info`／`.vocab-overview-en`／`.vocab-overview-pos`／`.vocab-overview-zh`／`.vocab-overview-actions`（沿用 `.menu-item`／`.stats-summary-item` 既有的卡片外觀）；`.passage-word-tooltip` 從純文字泡泡改成 flex row 容納文字＋星星，星星在深色泡泡背景上另外覆寫成白色線條／金黃實心，跟其他地方的收藏星星維持同一種「已收藏」配色語意。
- **範圍界線（跟使用者確認過）**：這次只做單字收藏功能本身（資料層＋三個入口畫面＋收藏清單＋徽章解封），沒有動 Stage A-D 既有題型的邏輯或版面；沒有做「收藏數量上限」；過程中發現的 `content.ts` 資料格式調整（`lookupPassageWordZh()` 回傳型別）是使用者在任務說明裡就先給好的具體修法，不是自己臨時決定。

### 9.18 「個人檔案」頁新增「學習成就」六格數據卡（2026-08-19）

使用者反應「個人檔案」頁只有加入時間／上次遊玩／累計遊玩時間這種時間戳記，希望加入一些可以量化、能累積成就感的數據，並用明顯的方式編排。跟使用者確認過六個指標的組合（單字量／連續學習天數／成就徽章／累計答對題數／累計學習天數／累計遊玩時間）跟「累計答對題數用答對次數、不是所有作答次數」兩個決定後動工。

- **資料層**：五個數字直接沿用既有的統計函式，沒有另外發明一套——已學單字量／總單字量沿用 `main.ts` 原本就有的 `computeVocabAggregate()`（原本是算「單字里程碑」徽章用的）；連續學習天數／累計學習天數沿用 `playLog.ts` 現成的 `getPlayStreak()`／`getTotalDaysPlayed()`；累計遊玩時間沿用 `playTime.ts` 的 `getTotalPlayTimeMs()`（從原本 `.profile-card-meta` 的 dl 列表移過來，集中呈現，不再重複列兩個地方）；已解鎖成就徽章數量新增 `countAchievedBadges()` 小函式，直接沿用 `snapshotBadgeAchievements()`（本來是徽章解鎖 pop 用來比對「這一輪新達成了哪些徽章」的既有函式）算出目前有幾個 `achieved === true`，被 `BADGES_BLOCKED_BY_MISSING_FEATURE` 標記、功能還沒上架的徽章本來就永遠回傳未達成，不用另外排除。
- **唯一新增的追蹤欄位**：`badgeStats.ts` 的 `totalQuestionsAnswered` 原本的定義是「不管答對答錯，作答過就算一次」，沒辦法拿來當「累計答對題數」用；因為使用者明確要「答對次數」比較有成就感，`BadgeStatsData` 新增 `totalCorrectAnswered` 欄位，`recordQuestionAnswered()` 答對時才累加（答錯不動），`readStats()` 的預設值補齊邏輯沿用既有模式，舊資料沒有這個欄位會自動補 0，不會壞掉。
- **版面**：`main.ts` 新增 `renderProfileAchievementsGrid()`，六張卡片（`.profile-stat-card`）排成可自動換行的 grid（`repeat(auto-fit, minmax(140px, 1fr))`），每張卡片圖示＋大數字（`--text-h3`＋`--color-accent-orange`，跟「挑戰紀錄」頁的 `.stats-summary-item` 同一種強調色，兩處視覺語彙一致）＋小標籤；圖示沿用成就徽章頁 `CATEGORY_ICONS` 已經畫好的單色線條 SVG（book／flame／calendar／edit 分別對應單字里程碑／連續學習天數／累計學習天數／完成題目數量這幾個既有的徽章分類圖示），只新增 medal（成就徽章）跟 clock（累計遊玩時間）兩個新圖示，風格延續同一套 `stroke="currentColor"` 線條規格。插入位置在頭像卡片下方、帳號設定按鈕上方。
- **跟「挑戰紀錄」頁的區別**：「挑戰紀錄」頁最上方本來就有「已挑戰過的題型／累計完成次數／平均最佳正確率」三個數字，這是「題型」角度的統計；這次新增的六格是給小朋友看的「累積成就感」角度（單字量、連勝天數、徽章、答對題數這種比較直覺、有里程碑感的數字），兩邊不重複也不衝突。
- **驗證**：`verify-badgestats-logic.ts` 新增測試 9，驗證 `totalCorrectAnswered` 只在答對時累加、跟「不管對錯都算」的 `totalQuestionsAnswered` 是兩個獨立欄位（也在測試 1 補上一行斷言）；`renderProfileAchievementsGrid()`／`countAchievedBadges()` 是 `main.ts` 裡的畫面／彙整邏輯，跟其他 UI-only 改動一樣沒辦法用 `tsx` 直接測（`main.ts` 用 `import.meta.glob`，只能靠 `npm run build` 的 `tsc --noEmit` 型別檢查），`npm run build` 與全部 15 支 `verify-*.ts` 一起重跑都通過。
- **回饋追加：卡片再放大**（同日）：使用者看過 demo 後反應六張卡片偏小，希望加大。`style.css` 調整 `.profile-stat-card`（`padding` 從 `--space-4 --space-2` 加大到 `--space-6 --space-3`）、`.profile-stat-icon svg`（26px → 40px）、`.profile-stat-value`（字級從 `--text-h3` 加大到 `--text-h1`，跟首頁「累計遊玩時間」大卡同一級）、`.profile-stat-sub`／`.profile-stat-label`（字級從 `--text-caption` 加大到 `--text-body`），`.profile-stats-grid` 的欄寬下限也從 140px 提高到 180px、間距加大，避免卡片變大後彼此擠在一起。純 CSS 尺寸調整，沒有動任何邏輯，`npm run build` 與全部 15 支 `verify-*.ts` 一起重跑都通過。
- **回饋追加：再加大一輪＋固定排成 3 欄 × 2 列**（同日）：使用者接著要求卡片再加大，並且至少排成三欄兩列，不要讓寬螢幕把 6 張卡片拉成一整排（拉成一排反而每張卡片變小，跟「加大」的訴求矛盾）。`.profile-stats-grid` 從 `repeat(auto-fit, minmax(180px, 1fr))` 改成固定 `repeat(3, minmax(0, 1fr))`，不管螢幕多寬都維持 3 欄，6 張卡片自然排成 2 列；卡片內距（`padding`）再加大一級（`--space-7 --space-4`）、圖示放大到 56px、數字改用全站最大的 `--text-display`（54px，跟首頁品牌大標題同一級）、`sub`／`label` 字級升到 `--text-body-lg`，網格間距也加大到 `--space-5`。純 CSS 尺寸／排版調整，沒有動任何邏輯，`npm run build` 與全部 15 支 `verify-*.ts` 一起重跑都通過。

### 9.17 「字卡暖身」實測回饋優化：聽音自動播放／分組節奏／答錯重排隊伍（2026-08-19）

使用者實際玩過剛上架的字卡暖身之後，給了三點回饋，這裡依序處理：

- **聽音題自動播放語音**：原本聽音題型只有一顆「▶ 播放語音」按鈕，要使用者自己按才聽得到。`FlashcardGame` 新增 `onQuizShown(question)` 事件（跟 `onCardShown` 是同一種慣例，每次顯示一題新測驗時觸發一次，不管是第一次考還是答錯被重排後的重考），main.ts 的 `goToFlashcards()` 接上這個事件：`question.listen_word` 有值就自動 `speakEnglish()`。畫面上的「播放語音」按鈕保留下來，給想重聽一次的人用，不是拿掉。
- **一次字卡接一次測驗改成「一組（預設 3 張）字卡再接這一組的測驗」**：使用者反應原本「一張字卡接一題測驗」太細碎、節奏呆板。`flashcardGame.ts` 整個重寫：`batchSize`（預設 6，沿用 `matchingGame.ts` 的同義詞分批）底下再切成 `groupSize`（預設 3）的小組，同一組的字卡連續看完，才會進入這一組的測驗（測驗題數剛好等於這一組的字卡數）。API 也跟著改名：`advanceToQuiz()` 改成 `advanceCard()`（同一個方法處理「下一張字卡」跟「這一組字卡看完了、開始測驗」兩種情況，呼叫端不用自己判斷）；`wordPositionInBatch`／`batchWordCount` 換成 `cardPositionInGroup`／`groupCardCount`；新增 `masteredCount`（已經完全答對過的單字數，用來取代「第幾個字」這種因為答錯重排隊伍而不再準確的位置指標）。畫面（`renderFlashcards()`）新增一行「這一組共 N 張字卡，第 M 張」的小提示，字卡按鈕文字依是否為這一組最後一張動態換成「下一張字卡 →」或「開始這一組的測驗 →」。
- **答錯不是原地重試，而是排到隊伍後面稍後再考，直到每個字都答對**：這是最大的行為調整，跟其他題型（配對／排序／填空／選擇／綜合關卡）原本「答錯短暫變紅、幾百毫秒後原地恢復可以重試同一題」的既有節奏不一樣，是使用者特別針對字卡暖身這個新關卡要求的差異化設計。實作上，`FlashcardGame` 把「這一組還沒答對的單字」維護成一條 `quizQueue`：答對就把隊伍最前面的字移除（`advanceToNextWord()`）；答錯則是短暫顯示紅色回饋後（700ms，跟其他題型的既有節奏一致），把這個字從隊伍最前面挪到最後面，接著自動載入隊伍新的最前面的字繼續考——不會停下來等使用者對著同一題重試。隊伍清空（這一組每個字都至少答對一次）這一組才算結束，前進到下一組／下一批／整個關卡結束。重新出題時題型（中翻英／英翻中／聽音選英文／聽音選中文）會重新隨機挑，不是每次重考都問一模一樣的問題。新增 `currentQuizVocabId` 這個唯讀屬性方便驗證腳本／未來除錯確認「目前在考哪個字」，不用自己解析 `quizQuestion.id`。
- **驗證**：`verify-flashcard-logic.ts` 全面重寫並擴充成 8 個測試，涵蓋批次／分組邏輯、「一組字卡接同一組測驗、題數一一對應」的節奏（不假設固定組數，因為 `buildBatchesAvoidingSynonymClashes()` 為了避開同義詞衝突，各批實際大小不一定整除，這是找 bug 過程中發現、修正了原本寫死組數的錯誤測試假設）、答錯重排隊伍（故意讓第一個字答錯，確認接下來換考別的字、最後有被重新排進來補考）、`onQuizShown` 觸發次數與聽音題型比例、`skipCards`、`restart()`；`verify-multi-topic.ts` 的字卡暖身流程也同步改用新 API（`advanceCard()`）跑過全部 12 個主題。`npm run build` 與全部 15 支 `verify-*.ts` 一起重跑都通過。
- **回饋追加：測驗答完（不管答對還是答錯）都要顯示正確的單字**（同日）：使用者實測發現聽音選中文這種題型答完只看到「✅ 答對了！」，畫面上完全沒出現過任何英文文字，不知道自己剛剛聽到、答對的到底是哪個字。修正：`PassageQuestion` 新增選填欄位 `reveal_en`／`reveal_zh`（跟 `answer` 不一樣——`answer` 只是「這一題考的方向」的正確選項文字，中翻英題的 `answer` 是英文、聽音選中文題的 `answer` 是中文；`reveal_en`／`reveal_zh` 固定是這個單字本身的英文／中文，不管考哪個方向都一樣），`flashcardQuestions.ts` 的 `buildFlashcardQuizQuestion()` 四種題型都固定填這兩個欄位。`renderFlashcards()` 在選項下方新增一行「👉 英文（中文）」，只有 `feedback !== "building"`（已經作答、不管對錯）才顯示，避免作答前就洩漏答案。新增 `verify-flashcard-logic.ts` 測試 9，驗證四種題型組出來的題目都固定填正確的 `reveal_en`／`reveal_zh`。`npm run build` 與全部 15 支 `verify-*.ts` 重跑都通過。
- **回饋追加：答錯後改成按鈕手動繼續，不再自動計時**（同日）：使用者接著反應答錯後原本 700ms 就自動換題，停頓時間太短，來不及看清楚上面新增的 reveal_en/reveal_zh 正確答案。修正：`FlashcardGame.selectQuizOption()` 的答錯分支拿掉 `setTimeout`，答錯後畫面停在原地（跟答對一樣，選項鎖住、`feedback` 維持 `"wrong"`），新增公開方法 `continueAfterWrong()`（把這個字丟回待考隊伍最後面、換考隊伍裡下一個字、重置成可作答狀態），main.ts 的 `renderFlashcards()` 在答錯提示旁邊加一顆「繼續 →」按鈕呼叫它，讓使用者自己決定什麼時候看完提示、繼續作答。`verify-flashcard-logic.ts` 測試 3 原本靠 `await` 等 700ms 計時器驗證換題邏輯，改成直接呼叫 `continueAfterWrong()`，並且新增一段「等一下、確認畫面沒有自己偷偷換題」的檢查，證實真的不再有背景計時器。`npm run build` 與全部 15 支 `verify-*.ts` 重跑都通過。
- **回饋追加：reveal_en/reveal_zh 提示文字旁加上播放語音按鈕**（同日）：使用者反應答錯後畫面上雖然會顯示「👉 strong（強壯的）」提示，但看不到怎麼聽發音，尤其是聽音題型答錯時更需要能重聽一次正確讀音。修正：main.ts 的 `renderFlashcards()` 把原本單純的 `<p class="flashcard-quiz-reveal">` 文字段落，改成 `<div class="flashcard-quiz-reveal">` 容器，裡面放 `<span class="flashcard-quiz-reveal-text">`（原本的提示文字）＋一顆沿用既有 `.flashcard-replay-btn` 樣式的 🔊 按鈕，點下去呼叫 `speakEnglish(revealEn)`；不管答對或答錯都會顯示（維持既有邏輯，只是加按鈕），不是只有答錯才有。`style.css` 的 `.flashcard-quiz-reveal` 規則同步從純文字樣式改成 flex row 容器，文字樣式（字體／字級／顏色）搬到新增的 `.flashcard-quiz-reveal-text`，跟同檔案裡 `.flashcard-word-row`／`.flashcard-word-en` 這種「容器＋文字子元素」的既有寫法一致。這次是純 UI 調整，沒有動到 `FlashcardGame`／`flashcardQuestions.ts` 的邏輯，不需要新增驗證腳本斷言；`npm run build` 與全部 15 支 `verify-*.ts` 重跑都通過，確認沒有連帶弄壞其他東西。

### 9.16 新增「字卡暖身」學習單元＋補齊三主題 example_sentence（2026-08-19）

使用者要求在既有五種題型（Stage A 單字配對→B-1 句子排序→B-2 句子填空→C 短文理解→D 綜合關卡）之前，新增一個獨立的「先看字卡記憶單字、字卡跟測驗題交錯出現」的學習單元，測驗只考選擇題（中翻英／英翻中／聽音選英文／聽音選中文）。動工前使用者已經自己檢查過現有程式碼，明確要求盡量沿用既有機制（`matchingGame.ts` 的分批邏輯、`capstoneQuestions.ts` 的干擾選項排除同義詞邏輯、`ChoiceGame`／`speakEnglish()`），不要重新發明；也明確指出「新關卡插在 Stage A 之前，不要把既有 Stage A-D 重新編號」，以及「`progress.ts`／`badgeStats.ts` 各自獨立定義的 `StageKey`／`StageKeyForBadges` 兩處都要同步改」。

- **內容缺口先補齊**：`Vocab` 型別／`content/schema/vocab.schema.json` 新增選填欄位 `example_sentence: { en, zh, status } | null`（`status` 沿用 draft/reviewed/published 慣例，但獨立於外層單字自己的 status 追蹤，因為例句可能是後補草稿）。先幫 Family（21 字）寫好例句、跟使用者確認語氣抓得對不對，確認 OK 後才繼續 Colors（12 字）／Animals & insects（31 字），總共 64 個單字全部補上原創、圍繞單字本身的簡單例句（`status: "draft"`）。其餘 9 個主題目前沒有補（欄位是選填的，字卡暖身沒有例句時就只顯示單字本身，不會壞掉）。
- **新關卡的資料層**：`progress.ts` 的 `StageKey` 與 `badgeStats.ts` 的 `StageKeyForBadges` 都新增 `"flashcards"`（兩處都要同步改，改掉一個忘了改另一個會讓成效追蹤或徽章判斷其中一邊壞掉——這是動工前使用者就點出來的既有資料層風險）；`badgeStats.ts` 的 `emptyStats().stageQuestionsAnswered` 也一起補上 `flashcards: 0`。
- **題目產生邏輯**：新增 `app/src/flashcardQuestions.ts`，四種選擇題型（`zh_to_en`／`en_to_zh`／`listen_to_en`／`listen_to_zh`）的干擾選項邏輯直接照 `capstoneQuestions.ts` 的 `buildVocabQuizQuestions()`／`isSynonymPair()` 沿用（干擾選項從同主題其他單字挑、排除同義詞關係，避免「daddy 是什麼意思」那種曖昧題目再次出現）；每個單字只隨機挑一種題型出題（不是四種都考，31 字的 Animals & insects 主題才不會變成 124 題）。`PassageQuestion` 型別新增選填欄位 `listen_word`（聽音題型專用，作答畫面看到這個欄位就顯示「播放語音」按鈕、題目文字本身不寫出英文字，避免用讀的作弊）——這個欄位純粹是執行期組出來的合成欄位，不會出現在 `content/passages/*.json` 裡，不需要寫進 `passage.schema.json`（跟 `capstoneQuestions.ts` 自己組出來的單字題／短句題不會有 `source_sentence` 是同一種情況）。
- **字卡＋測驗輪替狀態機**：新增 `app/src/flashcardGame.ts`（`FlashcardGame` class），分批邏輯直接 `import` `matchingGame.ts` 的 `buildBatchesAvoidingSynonymClashes()`（原本沒有 export，這次改成 export 給兩邊共用，不是複製一份），不是重新設計；字卡／測驗逐字交錯（字卡 1→測驗 1→字卡 2→測驗 2…），答錯的回饋節奏（短暫鎖住 700ms 後恢復）比照 `ChoiceGame.selectOption()`。額外做了「跳過字卡，直接測驗」的可略過設計（`skipCards` 開關，使用者確認過是建議功能非硬性規定）：打開後每個字卡階段瞬間帶過直接進測驗，也不會觸發自動唸單字的 `onCardShown` 事件（已經選擇跳過複習，不需要再聽一次）。`onCardShown` 事件比照 `onCorrect`／`onWrong` 的既有 callback 慣例，但因為 `FlashcardGame` 的 constructor 會在 `new` 完成前就先跑一次第一張字卡的內部狀態（跟 `matchingGame.ts` 的 `onChange` 是同一種「callback 要等 new 完才能設定」的既有限制），main.ts 的 `goToFlashcards()` 額外手動呼叫一次 `speakEnglish()` 補上第一張字卡的自動語音，這個細節在驗證腳本寫測試時漏掉一次（見下方驗證段落）才發現，修正後補了說明註解，避免下次踩到同一個坑。
- **main.ts 串接**：新增 `"flashcards"` screen、`goToFlashcards()`／`restartFlashcards()`／`renderFlashcards()`；`STAGE_ROWS`（挑戰紀錄頁用）跟 `ALL_STAGE_KEYS`（首頁主題卡「X / Y 種題型已挑戰過」用）都在最前面插入字卡暖身這一列，不影響其他既有 5 個 stage 的順序／編號；題型選單（`renderMenu`）跟 `goToTopicStage()`（挑戰紀錄頁「直接跳題型」用）都插入字卡暖身的入口。字卡畫面顯示單字英文／中文、`example_sentence`（有的話）英文／中文，進入畫面自動唸一次單字，並提供單字／例句各自的重播按鈕；測驗畫面沿用既有 `.question-text`／`.options`／`optionButton()` 版面，聽音題型另外顯示一顆「▶ 播放語音」按鈕（沿用 `.passage-read-aloud-btn` 樣式）。`style.css` 新增 `.flashcard-*` 系列樣式，沿用既有 design tokens（色彩／圓角／字體），不是另外設計一套視覺語彙。
- **驗證（含使用者要求的「實際跑一次確認，不要只憑邏輯推論」）**：`verify-multi-topic.ts` 擴充成先跑字卡暖身（每題都直接跳測驗、選正確答案）再跑 Stage A→D，全部 12 個主題都驗證過沒有任何單字因為湊不出干擾選項被跳過（最小的 Tableware 只有 7 個單字也沒問題）；新增 `verify-flashcard-logic.ts`（8 個測試）：分批邏輯跟 Stage A 一致、字卡測驗逐字交錯不重複不遺漏、答錯回饋節奏、`skipCards` 開關行為、`restart()`、daddy 的四種題型各重複組題 60 次都沒有同義詞干擾選項洩漏、`progress.ts`／`badgeStats.ts` 的 `"flashcards"` stageKey 讀寫正常且使用者互相獨立、最後也是使用者特別交代要驗證的一項——直接用 `progress.ts` 的真正函式模擬「X / Y 種題型已挑戰過」這種依陣列長度動態計算的統計（確認新增 flashcards 之後分母正確從 5 變成 6），以及 `vocab_milestone`（只認 `"matching"`）／`world_completion`（只認 `"capstone"`）這種只看單一題型的成就判斷邏輯，確認完全不受「只完成了 flashcards、還沒完成 matching/capstone」影響，不會被誤判成已達成。`npm run build`（`tsc --noEmit && vite build`）與全部 15 支 `verify-*.ts` 一起重跑都通過。
- **範圍界線（跟使用者確認過）**：這次只做字卡暖身這個新學習單元＋補齊 3 個既有主題的 `example_sentence`，沒有動 Stage A-D 既有題型的邏輯或版面；`content/badges/badges.json` 沒有因為這個新關卡新增徽章（`recordQuestionAnswered` 仍然會把字卡暖身的題目算進 `totalQuestionsAnswered`，自然貢獻給既有的「完成題目數量」「連勝十題」等跨題型徽章，不需要另外接線）；過程中發現的 `content/` 資料格式調整（`Vocab.example_sentence` 新欄位）有先跟使用者確認範圍跟格式，不是自己直接改。

### 9.15 世界二「食衣住行」5 個主題上架（2026-08-08）

使用者說「執行 世界二」，延續世界一／Unit 0 已經確立的架構（每個主題走完整 Stage A→D、`content/{vocab,sentences,passages,glossary}/<topic>.json` 一個主題一組檔案），這次不用再問澄清問題，直接動工把「世界二：食衣住行」的 5 個正式主題（Food & Drink 食物與飲料、Clothing & Accessories 衣服與配件、Houses & Apartments 房子與公寓、Tableware 餐具、Transportation 交通工具）內容補齊、串接進 App。

- **內容**：5 個主題各自新增完整一組——vocab（16~20 字，Tableware 依官方字表只有 7 個字）、4 句 Stage B 例句、1 篇短文＋3 題理解題（每題都照 9.13 節的慣例標好 `source_sentence`）、`glossary.json` 補充詞彙表，格式跟既有 7 個主題完全一致。
- **一詞多義（polysemy）風險排查**：這次新字表跟既有 6 個內容主題（尤其 Animals & insects／Colors／Clothing 自己）撞字的風險比世界一高很多（食物 vs 動物、顏色 vs 衣服配件），而 `content.ts` 的 `globalVocabZhByEnglish` 是把全部主題 vocab 攤平成一張「英文字→中文」的查詢表，同一個英文字撞到兩個不同主題會被後載入的主題直接覆蓋，沒有任何主題區隔機制（`sense_of` 欄位雖然在型別／schema 裡就有，但目前程式碼完全沒讀取它，純粹是文件用途）。這次排查抓到並排除了三個實際會撞字的規劃：(1) Food & Drink 原本想收 chicken／fish（食物意義），但這兩個字已經是 Animals & insects 的動物單字，會讓其中一個主題點出來的中文意思是錯的，決定不收，改成 watermelon（西瓜）／hot dog（熱狗）；(2) Food & Drink 原本想收 orange（水果），跟 Colors 主題的 orange（橘色）撞字，同樣改用 watermelon；(3) Transportation 短文草稿原本寫「I like to watch all the different vehicles!」，watch 已經是 Clothing & Accessories 的手錶單字，會被覆蓋成「手錶」的意思，改寫成「I like to see all the different vehicles!」避開撞字。這三個案例都是「换掉會撞字的字／句子」來繞開架構缺口，不是修程式碼——真的要支援同一個字在不同主題有不同中文意思，需要另外做一個「主題內覆寫」機制，目前列為已知缺口、留給未來需要時再處理；為了不浪費排查成果，額外幫 Animals & insects 既有的 chicken／fish 兩個字補上 `sense_of` 文件註記（純文件用途，不影響任何行為）。
- **`main.ts` 串接**：`TOPICS` 陣列新增 5 筆、`TOPIC_THUMBS` 新增 5 組縮圖樣式；`WORLDS` 常數裡的 `world2` 清單原本就已經是這 5 個 `fileKey`（世界一那次就先規劃好了），不用改，5 個主題內容一補齊，首頁世界二區塊就自動從「敬請期待」變成可以直接玩的主題卡，沒有其他 `main.ts` 邏輯需要異動（Stage D、徽章、挑戰紀錄都是泛用邏輯，吃 `TOPICS`／`availableTopics` 就自動支援新主題）。
- **驗證**：`verify-multi-topic.ts`／`verify-passage-glossary.ts`／`verify-capstone-questions.ts`／`build-content-review.mjs` 都擴充到全部 12 個主題（unit_zero＋世界一 6 個＋世界二 5 個）；`verify-passage-glossary.ts` 這次過程中反覆抓到 5 個主題各自有 2-3 個內容字忘記補進自己的 `glossary.json`（例如 food_drink 漏了 lunch／hot，houses_apartments 漏了 big／living，tableware 漏了 put／likes／use），照 9.13/9.14 節同樣的模式一一補齊；`npm run build` 與全部 14 支 `verify-*.ts` 重跑都通過，`build-content-review.mjs` 重新產生涵蓋 12 個主題的 `content-review.html`。

### 9.14 Unit 0「教室常用語」上架（2026-08-08）

使用者問「接下來還有哪些關卡？」，回報了 18 個未做主題＋Unit 0／跨主題複習關／解鎖順序規則等機制面缺口後，使用者選擇先做 Unit 0。動工前用 AskUserQuestion 確認三個關鍵決定：(1) 呈現形式——跟其他主題一樣走完整 Stage A→D（而不是簡化版只做配對＋問候情境）；(2) 內容範圍——只收「感嘆詞＋代名詞＋數字 1-10」，不重複收錄已經是獨立主題的 Colors；(3) 導覽定位——不強制要求先完成 Unit 0 才能玩其他主題，維持跟其他主題一樣自由選。

- **內容**：發現 `content/vocab/unit_zero.json` 其實已經有人事先建好（16 個單字：hi/bye/please/thank you/I/you/one~ten），直接沿用，不重新造字表；新增 `content/sentences/unit_zero.json`（4 句 Stage B 例句）、`content/passages/unit_zero.json`（短文「Hello, Friend!」＋3 題理解題，每題都照 9.13 節新加的 `source_sentence` 慣例標好對應原文句子）、`content/glossary/unit_zero.json`（11 個補充詞彙）。`content/units/unit0.json`（原本就存在、標記「非正式擴充結構」的規劃文件，內容還包含 Colors 的單字 id）同步更新，拿掉 Colors 部分並補上跟這次實作決策一致的說明，避免文件跟實際內容兜不起來。
- **"thank you" 這種多字 vocab 跟 fillBlank／短句填空的相容性**：`voc.unit_zero.004`（thank you）的 `en` 欄位裡有空白，跟其他主題單一英文字的 vocab 不一樣。查證過 `fillBlankGame.ts`／`capstoneQuestions.ts` 的 token 比對邏輯（句子用空白切詞、逐一比對）本來就允許「這個 vocab_id 在句子裡找不到對應的字就跳過、換下一個 vocab_id 試試看」，所以「thank you」不會讓填空題掛掉，只是這個字本身永遠不會被選成填空目標——單字配對（Stage A）跟 Stage D 的單字題（"thank you" 是什麼意思？）完全不受影響，仍然可以正常出題。
- **首頁 Unit 0 專區**：Unit 0 不屬於 `docs/content-plan-gept-kids.md` 規劃的任何一個世界（3.5 節說明它是「所有主題世界之前的新手起手式」），所以 `main.ts` 的 `WORLDS` 常數沒有把它算進任何世界，`renderTopicSelect()` 在 6 大世界最前面另外加一個「🚀 新手起手式」區塊（獨立於 `for (const world of WORLDS)` 迴圈之外），底下一行提示文字「推薦新朋友從這裡開始暖身，不過也可以跳過、直接挑其他世界的主題玩」，呼應「不強制」的決定。抽出共用的 `buildTopicCard()` 函式，讓 Unit 0 專區跟 6 大世界底下的主題卡共用同一份 DOM 組裝邏輯，不用兩邊各寫一次。
- **解鎖 OB-02（`badge.onboarding.unit0_complete`）**：條件文字是「完成 Unit 0（教室常用語）全部單字練習」，對應到 Stage A 單字配對——`MatchingGame` 本來就要求全部單字都配對成功才算完成一輪，所以判斷邏輯訂為「`unit_zero` 主題的 Stage A 配對紀錄存在」（不要求連 Stage B/C/D 都通關，那是 OB-03 在管的事）。新增 `computeUnit0MatchingComplete()`，從 `BADGES_BLOCKED_BY_MISSING_FEATURE` 移除這個徽章 id。
- **驗證**：`verify-multi-topic.ts`／`verify-passage-glossary.ts`／`verify-capstone-questions.ts` 都加入 `unit_zero`（現在共驗證 7 個主題）；`verify-passage-glossary.ts` 順便發現一個有意思的連帶效應——Unit 0 新增 `I`／`one`／`two` 這幾個字的全域 vocab 之後，其他主題的短文原本點「I」「one」「two」查不到中文意思，現在因為全域 vocab 是跨主題攤平查詢，也變成查得到了（例如點 Family 短文裡的「I」會顯示「我」），這是預期中的正面副作用，已更新各主題的「預期排除清單」反映這個變化，不是新的資料錯誤。`verify-world-completion-badges.ts` 新增 3 個測試（沒紀錄時未達成、完成一輪配對後達成、只完成其他主題的配對不會誤判成 Unit 0 已完成）。`npm run build` 與全部 14 支 `verify-*.ts` 重跑都通過，`build-content-review.mjs` 重新產生涵蓋 7 個主題的 `content-review.html`。

### 9.13 Phase 2 啟動：世界一補齊三個主題＋世界地圖首頁＋Stage D 綜合關卡（2026-08-08）

跟使用者確認過範圍（「先做一個世界（3-4 個主題）」＋「內容＋世界地圖＋Stage D」，三選項裡最完整的一組）後動工，是 Phase 2 內容擴充的第一批交付，把「世界一：我和我的家」從原本只有 Family 一個主題補齊成 4 個主題，並且把 `docs/content-plan-gept-kids.md` 規劃但 App 一直沒做的「6 世界地圖」跟「Stage D 綜合關卡」兩個機制真正做出來。

- **新增 3 個主題內容**：People 人（10 字）、Personal Characteristics 個性與特點（16 字）、Parts of Body 身體部位（15 字），每個主題都補齊單字／4 句 Stage B 例句／1 篇短文（3 題理解題）／`content/glossary/<topic>.json` 補充詞彙表，格式跟既有三個主題（Family／Colors／Animals & insects）完全一致。寫句子時特別注意 `fillBlankGame.ts` 挖空比對是「句子裡的字」跟 `vocab_ids` 的字做完全比對（只去掉句尾標點，不處理複數/字尾變化），所以新句子刻意都用單字的單數/原形（例如「one brother and one sister」不用「brothers」），跟舊主題的寫法一致。
- **Stage D「綜合關卡」**（新題型，四種題型之外的第五種）：混合「單字題」（"word" 是什麼意思，四選一）、「短句填空題」（跟 Stage B-2 同一套挖空邏輯，但是單選題形狀）、「短文理解題」（沿用該主題短文原本的 3 題）三種來源，各主題各出 4＋2＋3＝9 題左右，整體打亂順序，答完整個主題單元就算完成。新增 `app/src/capstoneQuestions.ts`（純函式 `buildCapstoneQuestions()`，故意不寫新的狀態機——因為 `ChoiceGame` 只讀 `passage.id`／`passage.questions`，`main.ts` 的 `goToCapstone()` 組一個「假的」`Passage` 物件把混合出來的題目塞進 `questions`，直接重用 `ChoiceGame` 跑完整個作答流程）；新增 `renderCapstone()` 畫面（比 Stage C 簡單，沒有短文框/朗讀/點字翻譯，純粹題目＋選項）。`progress.ts` 的 `StageKey`、`badgeStats.ts` 的 `StageKeyForBadges` 都新增 `"capstone"`，題型選單／挑戰紀錄頁都新增「Stage D 綜合關卡」這一列。
- **世界地圖首頁**：`main.ts` 新增 `WORLDS` 常數（6 個世界，每個列出 `docs/content-plan-gept-kids.md` 規劃的完整主題清單，不是只列目前做出來的），首頁（`renderTopicSelect()`）改成先依世界分組、每組底下才是主題卡；世界底下如果目前一個主題都還沒做出來，顯示「敬請期待，這個世界的主題內容還在製作中」，不會整組消失不見。
- **解鎖 OB-03／WC-01~07 共 8 個徽章**：這 8 個徽章原本因為「沒有 Stage D」「沒有 6 世界 24 主題架構」被列在 `BADGES_BLOCKED_BY_MISSING_FEATURE` 永遠鎖定＋標「功能開發中」，現在接上真正的判斷邏輯：新增 `computeCompletedStageDTopics()` 讀出這個使用者已經通過 Stage D 的主題集合；OB-03（`first_stage_d`）只要這個集合不是空的就算達成；world_completion 系列刻意比對 `WORLDS` 裡「規劃完整」的主題清單（不是只看目前已上架的主題），要求該世界規劃的每個主題都「已上架」且「通過 Stage D」才算完成——這樣世界二～六跟 `all_topics` 在其餘 18 個主題實際做出來之前會自然維持未達成，不用另外維護一份「功能開發中」名單，之後主題陸續補齊也不用回來改判斷邏輯本身。
- **驗證**：`npm run build`（`tsc --noEmit && vite build`）通過；`verify-multi-topic.ts` 擴充到全部 6 個主題、Stage A→B-1→B-2→C→D 五種題型都能各自跑完一輪；`verify-passage-glossary.ts` 擴充到 6 個主題的短文逐字查詢驗證；新增 `verify-world-completion-badges.ts`（5 個測試，涵蓋完全沒紀錄、只完成世界一部分主題、世界一全部完成但 all_topics 未達成、已上架主題都完成但規劃中未上架主題讓對應世界維持未完成、多使用者互相獨立）；`app/scripts/build-content-review.mjs` 重新產生涵蓋 6 個主題的 `content-review.html`。
- **回饋修正：單字題同義詞干擾選項**（同日）：使用者實測發現「"daddy" 是什麼意思？」這題的選項同時出現「爸爸（= father; daddy）」跟「爸爸（= father; dad）」——兩個選項意思幾乎一樣（dad/daddy 在 `content/vocab/family.json` 裡本來就是 `related_forms` 同義詞），變成無法用意思分辨的曖昧題目。原本 `capstoneQuestions.ts` 的干擾選項只排除「同一個字」跟「zh 欄位完全相同」，沒有排除同義詞。修正：新增 `isSynonymPair()`（跟 `matchingGame.ts` 配對題避免同義詞同組出現的邏輯一致），單字題跟短句填空題的干擾選項都排除跟正確答案互為 `related_forms` 的字。新增 `verify-capstone-questions.ts`，對 6 個主題各重複組題 60 次，驗證選項不重複、一定包含正確答案、且不會出現同義詞干擾選項洩漏，並額外驗證 family 主題確實存在 dad/daddy 這種同義詞組（確保這個測試真的有測到問題，不是資料剛好沒同義詞而巧合通過）。
- **回饋修正：短文理解題加上朗讀按鈕**（同日）：Stage D 綜合關卡故意比 Stage C 簡單、沒有放整篇短文框，但這樣一來混進來的「短文理解題」使用者完全看不到短文原文，也沒辦法重聽。修正：`renderCapstone()` 判斷 `game.currentQuestion.id` 是不是 `pass.` 開頭（跟 capstoneQuestions.ts 組出來的 `capstone.vocab.*`／`capstone.sentence.*` 前綴不同，藉此分辨這題是不是短文理解題），是的話在題目文字上方加一顆「▶ 朗讀短文」按鈕（跟 Stage C 共用同一顆 `speakPassage()`／`stopSpeaking()`），讓使用者可以只靠聽短文語音作答；切換到下一題時如果還在播放會先停掉，避免朗讀按鈕消失後背景聲音卻繼續播的怪狀況。`npm run build` 與全部 `verify-*.ts` 重跑都通過，手動 grep 打包後的 JS 確認 `capstone-audio-row`／「朗讀短文」字樣真的有進到最終產出。
- **回饋優化：短文理解題只播放對應那一句**（同日）：使用者接著問「有可能只播放單獨那一句嗎？」——原本按下「朗讀短文」會唸出整篇短文，聽答案要自己從頭聽到尾找。新增 `PassageQuestion.source_sentence`（選填欄位，該題答案對應到短文原文的哪一句，原文照抄逐字一致），`content/passages/{family,people,personal_characteristics,parts_of_body,colors,animals_insects}.json` 6 個主題共 18 題短文理解題全部手動標註（多數對應 1 句，people 的 Q1「Who is Ben's best friend?」需要合併 2 句才答得出來，一樣標註進去）；`renderCapstone()` 這一題有標註就只播放那一句（按鈕文字也跟著換成「▶ 播放這句」），沒標註才退回播放整篇（目前 6 個主題都有標，這個退回路徑保留給未來新主題內容還沒補標註時用）。`content/schema/passage.schema.json` 同步補上這個欄位的說明。`verify-capstone-questions.ts` 新增驗證：每個主題的短文理解題都必須有 `source_sentence`，而且逐字比對必須是 `passage.text` 的子字串（標錯字或跟原文差一個字，播出來的語音會跟畫面文字對不起來）。`npm run build` 與全部 `verify-*.ts` 重跑都通過，手動 grep 打包後的 JS 確認「播放這句」字樣真的有進到最終產出。

### 9.12 題型選單頁加上「返回」連結（2026-08-08）

「Family 家庭 — 題型選單」這類題型選單頁的標題前面加上「返回 / 」，「返回」是可點擊的連結，點下去回到首頁（選主題畫面，`goToTopicSelect()`）。實作上是在 `renderMenu()` 的 `<h1>` 裡塞一個 `.menu-back-link` 按鈕（樣式重置成純文字連結、`font: inherit` 跟著標題字級走，顏色用一般連結色跟深藍標題文字區分開來），不是獨立的返回按鈕元件。

### 9.11 挑戰紀錄改版：主題卡合併＋展開收合＋直接跳題型（2026-08-08）

「挑戰紀錄」頁原本把「每個主題 × 每種題型」攤平成 12 張獨立卡片，不管有沒有玩過、資訊量都一樣多。這次改版（跟使用者確認過設計後才動工）：

- **合併＋收合／展開**：同一個主題的四種題型合併成一張卡（3 張主題卡）。預設收合只顯示主題名稱＋精簡摘要（「已挑戰 N / 4 種題型・平均正確率 X%」，或「尚未挑戰過」），整張卡片都能點擊展開/收合（`main.ts` 新增 `expandedStatsTopics` 這個 `Set<string>` 記錄哪些主題目前展開），右側有個箭頭圖示（單色 SVG，展開時轉 180 度）當視覺提示，但點擊範圍不限於箭頭本身。
- **整合重複資訊**：展開後每個題型原本分兩行顯示（「最佳正確率／完成次數」＋「最近一次的答對/答錯明細（含正確率）」），兩行都在講正確率、讀起來重複，這次合併成一行「最佳正確率 X%・完成 N 次・最近一次 日期」。
- **直接跳題型**：每個展開後的題型列都有按鈕，已經玩過的顯示「再次挑戰」、還沒玩過的顯示「開始挑戰」，點下去直接跳進該題型的作答畫面，不用先經過「選單」畫面選一次。技術上把 `goToTopic()` 原本「載入主題內容＋重置四種題型狀態」的邏輯抽成 `activateTopic()`，新增 `goToTopicStage(topic, stageKey)` 共用同一段邏輯後直接呼叫對應的 `goToMatching`／`goToOrdering`／`goToFillBlank`／`goToChoice`。按鈕點擊有 `stopPropagation()`，不會連帶觸發外層卡片的收合。
- **驗證**：`npm run build` 與全部既有 `verify-*.ts` 重跑都通過，手動 grep 打包後的 JS/CSS 確認「開始挑戰」「再次挑戰」「stats-topic-card」等新內容真的有進到最終產出。這次沒有新增獨立的 verify script，因為改動的是版面聚合／導覽邏輯（平均值計算、展開狀態），底層資料函式（`getStageProgress` 等）已經有 `verify-progress-logic.ts` 覆蓋。

### 9.10 答完一輪跳出「獲得新徽章」的 pop（2026-08-08）

四種題型（單字配對／句子排序／填空／短文理解）答完一輪時，如果新達成（或可累計次數的徽章又達成一次）了成就徽章，會跳出一個 pop 顯示，同一輪一次跨過好幾個門檻的話，全部列在同一個 pop 裡（跟使用者確認過的兩個行為：條件達成「每一次」都要跳，不是只有第一次；使用者要自己按關閉，不會自動消失）。

- **偵測邏輯**：徽章系統本來就沒有「達成事件」，達成與否是每次畫面渲染時拿 `badgeStats` 現在的數字去跟 `badges.json` 的門檻即時比對出來的（`computeBadgeViewState`）。這次新增 `snapshotBadgeAchievements()`，在寫入 `badgeStats`／`progress`／`playLog` 前後各拍一次「全部 43 個徽章目前達成與否＋累計次數」的快照，再用 `diffNewlyAchievedBadges()` 比對兩份快照：一次性徽章看「未達成→達成」；可累計次數的徽章（連續答對／完美關卡／早起／假日／連續天數各門檻）看 `achievedCount` 有沒有變多，變多就代表又達成一次，也要跳出來。
- **共用收尾函式**：原本四個 `renderXxx()` 各自重複寫一模一樣的六行「寫入 badgeStats 相關資料」呼叫，這次抽成共用的 `finalizeRoundCompletion(stageKey, correctCount, wrongCount, hintUsed)`，寫入前後拍快照、diff 出新達成的徽章，收進 `pendingBadgeUnlocks`。
- **UI**：`appendBadgeUnlockModal()` 跟「變更頭像／修改名稱」共用同一套 `.modal-overlay`／`.modal-card` 外殼，內容是每個新達成徽章的縮圖（72px，找不到美術圖一樣退回代號佔位圖）＋名稱＋說明文，`render()` 最後統一判斷 `pendingBadgeUnlocks` 是否有內容，疊在任何畫面最上層。
- **驗證**：新增 `app/scripts/verify-badge-unlock-diff.ts`（7 個測試，涵蓋一次性/可累計徽章的新達成/沒變化判斷、同時跨過多個門檻要一次全部抓出來、`before` 快照缺紀錄時的邊界情況），`npm run build` 與全部既有 `verify-*.ts` 一起重跑都通過，手動 grep 打包後的 JS 確認「獲得新徽章」「太棒了」等新字串真的有進到最終產出。

### 9.9 成就徽章頁面版型調整（2026-08-08）

- **統一包框架**：原本各分類（新手引導／單字里程碑／…）跟徽章列直接排列在頁面底色上，現在包進同一個 `.badge-frame`（白底、圓角、四邊統一 padding，跟 `.stage-banner` 同一套「有底色的圓角容器」概念）。
- **類別標題圖示改單色**：跟功能列圖示同一套做法，`main.ts` 新增 `CATEGORY_ICONS`（10 個分類各一個 `stroke="currentColor"` 線條 SVG，取代原本的彩色 emoji），顏色跟著 `.badge-category-title` 文字顏色走。
- **類別之間加虛線分隔**：`.badge-category + .badge-category` 加上 `border-top: 1px dashed var(--color-border)`，不同分類之間一眼就能分開，第一個分類上面不用（緊接在框架自己的 padding 下面就好）。

### 9.8 成就徽章說明文改成 hover／點擊才彈出（2026-08-07）

徽章卡片原本在徽章下方固定顯示一行說明文（`.badge-desc`），現在移除，改成滑鼠移到徽章上（CSS `:hover`）或點擊/點選（平板等沒有滑鼠、`:hover` 不一定會觸發的裝置）才彈出泡泡提示，跟短文理解點字看翻譯是同一套互動邏輯：`main.ts` 新增 `activeBadgeTooltipCode` 記錄點擊觸發、目前彈出的是哪個徽章代號，`document` 層級 click 監聽處理點空白處關閉；CSS 新增 `.badge-media-wrap`（負責定位泡泡＋接收點擊）／`.badge-tooltip`，泡泡刻意放在 `.badge-media` 圓形遮罩外面一層，不然會被 `overflow:hidden` 裁掉看不到。

### 9.7 成就徽章美術圖全部補齊（2026-08-07）

`assets/badge/` 原本只有 27／43 個徽章代號的美術圖，現在 43 個全部補齊了。剩下 16 個（GM-03~08、HH-01/02、OB-01、WC-01~07）用跟先前同一套流程處理：原圖（1024x1024）裁切壓縮成 200x200 的 jpg 縮圖放進 `app/src/assets/badges/`，程式碼（`badgeImages.ts`／`renderBadgeCard()`）不用改，找得到對應代號的圖就自動顯示真圖，不用再退回藍色底色＋代號的佔位圖。至此 43 個徽章全部都有真圖了。

### 9.6 功能列圖示改用單色線條 SVG（2026-08-07）

功能列（首頁／挑戰紀錄／成就徽章／個人檔案／登出）原本用彩色 emoji 當圖示（🏠📊🏅👤🚪），改成 `stroke="currentColor"` 的單色線條 SVG（`main.ts` 的 `NAV_ICONS`），顏色直接跟著 `.nav-item` 本身的文字顏色走：一般狀態是 `--nav-item-color`、滑過只換背景色（圖示顏色不變）、選取中（`.active`）背景變深藍、文字跟圖示一起變白——不用另外幫圖示寫顏色規則，「滑過」跟「選取中」兩種狀態一眼就能分清楚。

### 9.5 四種題型畫面加上專屬題型橫幅（2026-08-07）

四種題型畫面（單字配對／句子排序／填空／短文理解）原本的標題只是純文字（`.game-header`，跟「選擇主題」「誰在玩？」那種列表頁標題共用同一套樣式）。這次改成 `stageHeader()` 專用的 `.stage-banner`：跟首頁/目錄頁的 `.brand-banner` 一樣是有底色的圓角橫幅，但故意做得矮很多、字也小很多（`.brand-banner` 標題用 `--text-h1`，這裡用 `--text-h3`；`.brand-banner` 是漸層＋放頭像招呼語，這裡是實心深藍、只放「題型範圍當標題」＋進度文字），一眼就能跟首頁/目錄頁的橫幅區分開來。「← 返回選單」按鈕跟著移進橫幅裡（原本用絕對定位疊在右上角，現在改成一般 flex 排列在標題同一列的右側），顏色也換成跟深底色對比夠的淺色版本。

### 9.4 短文理解體驗微調 + 全站字級再放大（2026-08-07）

- **全站字級加大**：`assets/design-tokens/design-tokens.v2-daily-play.css` 的 `--text-*` 全部再放大一輪（例如 `--text-body` 18px→21px、`--text-h1` 36px→42px），因為全站排版都吃這幾個 token，不用一個一個元件改。
- **翻譯泡泡點空白處關閉**：`main.ts` 在 `render()` 之後加一個 `document` 層級的 click 監聽，點擊落在 `.passage-word` 以外的任何地方（含空白處），只要泡泡目前是開著的就收起來；點在字或泡泡本身則交給該元素自己的 click 監聽器處理開關切換，兩邊不會互相打架。
- **短文整篇朗讀**：短文標題旁新增「▶ 朗讀短文」按鈕，`speech.ts` 新增 `speakPassage(text, onEnd)`／`stopSpeaking()`，點下去唸出短文全文，按鈕變成「⏸ 暫停」；再按一次是整段停止（不是暫停/續播）。新增 `isPassageReading` 狀態記錄目前是否正在朗讀；離開短文理解畫面（返回選單、切主題、看紀錄／徽章／個人頁、登出）都會呼叫 `stopPassageReadingIfAny()` 停止朗讀並重置按鈕狀態，避免使用者切到別的畫面聲音還繼續播。

### 9.3 短文理解點字看中文意思（2026-08-07）

Stage C 短文理解畫面裡，點英文短文中的單字或片語，會在字下方彈出中文意思的提示泡泡，再點一次收起來。

- **翻譯資料來源**：優先查跨主題的 vocab 清單（`content.ts` 新增 `globalVocabZhByEnglish`，把三個主題的 vocab 攤平成一張表），查不到再查新增的 `content/glossary/<topic>.json` 補充詞彙表（只收「不在任何主題 vocab 清單裡」的字，例如短文原文才有的職業名稱 teacher/nurse）。兩邊都查不到，這個字就維持一般文字，不會做成可點擊樣式。新增 `content/schema/glossary.schema.json` 說明格式。
- **互動方式**：點擊切換（不是滑鼠移過去就顯示），`main.ts` 用 `activePassageWordKey`（記錄目前展開的是短文裡第幾個字，用位置而不是文字本身當 key，避免同一個字在短文裡出現兩次時互相打架）；`renderChoice()` 改用 `buildInteractivePassage()` 動態組出 DOM（取代原本整段字串塞 `innerHTML`），可點的字包一層 `<span class="passage-word">`，展開時內部多塞一個 `.passage-word-tooltip` 泡泡。
- **驗證**：新增 `app/scripts/verify-passage-glossary.ts`，重新讀三篇短文原文，逐字檢查查得到/查不到中文意思是否符合預期（人工整理一份「基本文法字/人名，本來就不該查到」的排除清單），另外驗證跨主題查詢真的有作用（在 colors 主題底下查 family 主題才有的 sister）、查不存在的字會回傳 null 不會噴錯。`npm run build` 與全部既有 `verify-*.ts` 一起重跑都通過，手動 grep 打包後的 JS 確認「老師」「護士」這兩個原本查不到翻譯的字，現在真的有進到最終產出。

驗證方式：`app/scripts/` 底下每個遊戲邏輯都有對應的 `verify-*.ts` script（不是正式測試框架，用 `npx tsx scripts/verify-xxx-logic.ts` 執行），直接跑真實 content 資料模擬答對/答錯/邊界情況；`verify-multi-topic.ts` 額外驗證 Family／Colors／Animals & insects 三個主題都能把四種題型各跑完一輪，`verify-profile-logic.ts` 驗證使用者新增/刪除/登入登出邏輯。另外 `npm run build`（含 `tsc --noEmit`）確認型別與打包都沒問題。因為開發沙盒沒有瀏覽器可以跑，沒辦法做真正的瀏覽器端對端測試，正式的手動確認都是靠 `app/demo-standalone.html`。

---

## 10. Phase 1 剩餘待辦

~~1. 登入登出~~ ✅ 已完成（2026-08-03）——本機端「誰在玩」使用者切換（`app/src/profile.ts`），不同使用者的成效追蹤資料互相獨立，不用密碼/雲端帳號

~~2. 課程範圍擴充~~ ✅ 已完成（2026-08-03）——Family／Colors／Animals & insects 三個主題都已串上完整的選主題→四種題型流程，各主題的成效追蹤也互相獨立

~~3. 頭像系統／新增使用者三步驟流程~~ ✅ 已完成（2026-08-03）——選頭像→輸入名字→確認卡片才登入

~~4. 視覺風格 v2 改版＋成就徽章系統~~ ✅ 已完成（2026-08-04，見第 9.1 節）——品牌橫幅＋功能列、首頁主題卡片、跨主題挑戰紀錄、4 分類×銅銀金成就徽章、「我的」個人小卡；連續天數／徽章原本列在 Phase 2，這次提前做掉

**Phase 1 規劃項目已全部完成，可以進 Phase 3**（README 完整版、授權條款、GitHub Pages 上架）。之後如果還想繼續強化體驗（非必要），可以考慮：
- 使用者新增時檢查重複名字（目前允許同名）
- Phase 2 剩餘項目：擴充世界三～六共 13 個官方主題內容、學習報告匯出
