# 兒童英語學習平台 — 專案交接文件（HANDOFF）

最後更新：2026-08-25　　目前階段：**Phase 1 已達標＋視覺風格 v2 改版完成，Phase 2 內容擴充持續進行中（單元一～五主題皆已接進 App，Personal Characteristics 已拆成三個獨立主題；「世界」已全面改名為「單元」，Unit 0 併入 0～6 連貫序列，`content/badges/badges.json` 已同步完成，WC-01~07 徽章恢復正常判斷；點擊互動跳回頂端的問題已修正並加上「回到頂端」按鈕；「關於本站」頁面介紹文字已換成新版，全站已無「GEPT Kids」字樣殘留；單元 0「教室常用語」已拆成 Greetings 問候與禮貌用語／Pronouns 代名詞兩個主題；Family 主題移除 dad／daddy／mom／mommy／grandma／grandpa 六個字，從 21 字變 15 字；單元一名稱由「我和我的家」改為「我和身邊的人」，content 端與 `main.ts` 皆已同步完成；Appearance 主題補充 11 個外觀描述詞，從 7 字變 18 字；Emotions 主題補充 9 個心理狀態單字，從 11 字變 20 字；Kitchen & Dining 主題補充 15 個廚房用品單字，從 13 字變 28 字；Colors 主題補充 7 個顏色相關單字，從 12 字變 19 字；Numbers 主題移除 first／second／third／number／how many 5 個字，從 30 字變 25 字，短文換成新故事「A Fun Day at the Zoo」；Weather & Nature 改名為 Weather，補充 16 個天氣/四季單字，從 16 字變 32 字，content 端與 `main.ts` 皆已同步完成；Geographical Terms 補充 11 個地景單字＋再補充 9 個常用地形/地表單字，從 5 字變 25 字；單元三新增 PE / Sports 體育課〔24 字〕與 Clubs & Hobbies 社團活動〔16 字〕兩個新主題，content 端與 `main.ts` 皆已同步完成；Places & Directions 補充 9 個導航方位單字，從 18 字變 27 字；Occupations 補充 3 個現代職業單字，從 13 字變 16 字；Money 補充 18 個金錢相關單字，從 4 字變 22 字；短文查字功能改成主題優先查詢＋收藏清單新增排序功能，content 端與 `main.ts` 皆已同步完成；Health 補充 17 個健康相關單字，從 4 字變 21 字；Forms of Address 補充 9 個稱謂相關單字，從 4 字變 13 字；單元二新增 Bathroom 浴室主題〔18 字〕，content 端與 `main.ts` 皆已同步完成；單元六「時間與節日」正式開始建置並完成，新增 Time〔22 字〕／Calendar〔27 字〕／Holidays & Festivals〔18 字〕／Sizes & Measurements〔13 字〕四個主題（原規劃只有 3 個主題，Time 因候選字過多拆成 Time 與 Calendar 兩個），content 端與 `main.ts` 皆已同步完成，全部 31 個主題〔含單元 0〕現在都已接進 App 選單可玩；單元三的 Colors 改名擴充為「Art 美術」〔35 字〕、Numbers 改名擴充為「Math 數學」〔49 字〕（`fileKey` 不變，只改顯示名稱），並新增 Science 自然科學主題〔20 字〕，content 端與 `main.ts` 皆已同步完成，全部 32 個主題〔含單元 0〕現在都已接進 App 選單可玩；content 端新增單元七「文法小幫手」11 個主題〔advanced_pronouns／wh_words_frequency／articles_determiners／sentence_connectors／prepositions／other_nouns／other_verbs_1／other_verbs_2／other_adjectives_1／other_adjectives_2／other_adverbs_responses〕，正式推翻「文法/功能詞不獨立成關卡」的原始政策，content 端與驗證腳本／徽章系統皆已同步完成，**App 端尚未接線**，詳見 9.83 節與 `docs/handoff-prompt-unit7-grammar-topics.md`），並新增「字卡暖身」學習單元**（登入登出、課程範圍、六種文字型題型〔字卡暖身＋Stage A-D，含 Stage D 綜合關卡〕、成效追蹤基本功能全部完成；單元 0「教室常用語」〔Greetings 問候與禮貌用語／Pronouns 代名詞兩個主題〕＋單元一「我和身邊的人」6 個主題〔Family／People／Appearance／Emotions／Personality Traits／Parts of Body〕＋單元二「食衣住行」6 個主題〔Food & Drink／Clothing & Accessories／Houses & Apartments／Kitchen & Dining／Bathroom／Transportation〕＋單元三「上學去」6 個主題〔School／Math／Art／PE / Sports／Clubs & Hobbies／Science〕＋單元四「大自然與動物」3 個主題〔Animals & Insects／Weather／Geographical Terms〕＋單元五「生活情境」5 個主題〔Places & Directions／Occupations／Money／Health／Forms of Address〕＋單元六「時間與節日」4 個主題〔Time／Calendar／Holidays & Festivals／Sizes & Measurements〕共 30 個正式主題＋單元 0（2 個暖身主題）皆可跑通，全站合計 32 個主題；首頁改成單元分組＋單元 0 獨立區塊；OB-02／OB-03／WC-01~07 徽章判斷邏輯已改成 `unit_completion`（`badges.json` 已同步更新徽章 ID，WC-01~07 恢復正常判斷；單元三完成度徽章邏輯已可實際解鎖）；Family／Colors／Animals & insects 三個主題的單字已補上 example_sentence 專屬例句；個人檔案頁新增「學習成就」六格量化數據卡；新增單字收藏功能，OB-04／FV-01~03 徽章已接上真正判斷邏輯；題型選單頁「返回」文字連結改成正式按鈕；題型選單卡片與挑戰紀錄頁皆已新增熟悉度分級色條＋淡底色；Stage D 短句填空題新增「播放這句」語音按鈕；新增獨立的「關於本站」頁面，已收進功能列常駐項目；功能列已改成動態量測寬度切換 icon-only（不再依賴固定螢幕寬度斷點），品牌橫幅仍維持手機寬度響應式設計，窄螢幕頭像已放大並移到文字上方）

專案定位：給家庭／個人使用的兒童英語學習平台，內容以台灣國小階段常見英語學習主題為主要範圍，初期在本地端開發測試，最終上架至 GitHub（開源）。

> 命名與內容來源說明（2026-08-22）：規劃初期曾直接沿用某特定測驗機構的官方名稱與參考字表作為內容依據，後來發現該機構已就其測驗名稱、服務標章發表商標聲明，字表本身也標示著作權聲明。考量之後要開源公開，已將專案文件（本檔、`docs/content-plan.md`、`README.md`）與 `content/vocab/*.json` 的 `source` 欄位裡的相關品牌引用移除，改用「國小常用英語主題字彙」等中性描述，詳細原因與作法見 `docs/content-plan.md` 開頭的更新記錄。`app/src/main.ts` 裡「關於本站」頁面顯示的文字已於 2026-08-23（9.53）換成新版家長視角自我介紹，全站已無殘留品牌引用，詳見第 9.53 節。

---

## 1. 目前進度總結

| 項目 | 狀態 |
|---|---|
| 專案架構規劃（角色、課程範圍、遊戲題型、成效追蹤、技術問題、開發階段） | ✅ 已完成，見 Obsidian Canvas |
| 兒童英語學習內容規劃（資料結構、關卡分類方式） | ✅ 已完成，見 `docs/content-plan.md`（原檔名 `content-plan-gept-kids.md`） |
| 範例課程內容（32 個正式主題＋單元 0＋單元七 11 個主題） | ✅ 單元一～六全部 32 個正式主題＋單元 0（Greetings／Pronouns 兩個暖身主題）都已接進 App 選單可玩（見 9.82 節）；單元七「文法小幫手」11 個主題（content 端已完成，App 端待接線，見 9.83 節） |
| 免費語音辨識資源研究 | ✅ 已完成，候選方案已列出，**實作延後至最後階段** |
| App 程式碼 | ✅ Phase 1 全部完成——登入登出、六種文字型題型（字卡暖身／配對／排序／填空／選擇／綜合關卡）、成效追蹤都已完成，見 `app/` 與第 9 節 |
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
| Phase 1 | 本地端 MVP：登入登出、課程範圍、配對／排序／填空／選擇四種文字型題型、成效追蹤基本功能 | ✅ 已達標——登入登出（本機端「誰在玩」）、四種題型（Family／Colors／Animals & insects 三主題皆可玩）、成效追蹤都已完成（見第 9 節） |
| Phase 2 | 完善課程內容與個人成效追蹤：擴充其餘主題、積分/徽章/報告 | 進行中——內容已擴充至 13/24 正式主題＋Unit 0（世界一 4 主題、世界二 5 主題、世界三 3 主題**已全部完成**、Animals & insects 皆完整）；連續學習天數、43 個成就徽章、個人檔案「學習成就」六格數據卡、單字收藏功能皆已完成；剩餘世界四～六共 11 個官方主題內容尚待擴充 |
| Phase 3 | 上架 GitHub：README、授權條款、Demo 展示頁面 | 未開始 |
| Phase 4 🔇 | 語音辨識與口說題型（延後開發，最後階段） | 研究已完成，實作待 Phase 1-3 完成後才開始 |

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
├── README.md                          ← 專案 README 完整版（專案介紹、使用緣起、內容來源、作者資訊皆已補齊，2026-08-22）
├── .gitignore
├── dashboard.html                     ← 專案 Dashboard（瀏覽器開啟）
├── docs/
│   ├── content-plan.md                ← 兒童英語學習內容規劃完整說明（原檔名 content-plan-gept-kids.md，已停用僅留轉址提示）
│   └── handoff-prompt-phase1.md       ← 交給 AI 接手 Phase 1 開發時用的任務說明
├── content/
│   ├── schema/                        ← vocab / sentence / passage JSON Schema
│   ├── vocab/                         ← 14 個主題單字檔（13 正式主題＋unit_zero，共 236 字）
│   ├── sentences/                     ← 14 個主題的 Stage B 例句檔（各 4 句）
│   ├── passages/                      ← 14 個主題的 Stage C 短文＋理解題檔（各 1 篇＋3 題）
│   ├── glossary/                      ← 各主題短文點字看中文意思用的補充詞彙表
│   ├── units/                         ← unit0.json
│   └── badges/badges.json             ← 43 個成就徽章正式定義（10 大分類）
└── app/                                ← 前端 App（Vite + TypeScript），見第 9 節
    ├── src/                           ← 遊戲邏輯與畫面（main.ts 入口；profile.ts 登入登出；progress.ts／badgeStats.ts／playLog.ts 成效追蹤；favorites.ts 單字收藏；sound.ts／speech.ts 音效與語音；flashcardGame.ts／matchingGame.ts／orderingGame.ts／fillBlankGame.ts／choiceGame.ts／capstoneQuestions.ts 各題型）
    ├── scripts/                       ← 驗證用 script（不是正式測試框架，但涵蓋主要邏輯，共 16 支 verify-*.ts）
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

1. 打開 `app/demo-standalone.html`（雙擊，不用跑任何指令）試玩：先選/新增使用者登入，再選主題（目前 13 個正式主題＋Unit 0 都可玩，世界一／世界二／世界三皆已完整），進去玩字卡暖身＋Stage A-D 六種題型
2. 打開 `app/content-review.html` 校對目前 13 個正式主題＋Unit 0 的單字/例句/短文內容
3. 打開 `dashboard.html` 看整體專案進度快照
4. 看第 9 節「App 開發現況」了解程式碼骨架；Phase 1 規劃項目已全部完成，Phase 2 進行中（見第 1、3 節），第 10 節列了如果還想繼續強化可以做的非必要項目，或直接進 Phase 3（上架準備）
5. 要跑開發環境：`cd app && npm install && npm run dev`；`npm run build` 會產出 `dist/`

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
