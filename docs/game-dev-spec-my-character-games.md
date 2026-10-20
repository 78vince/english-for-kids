# 「我的角色」遊戲開發規範（給負責製作新遊戲的 agent）

*撰寫：2026-10-14（內容端）｜適用：在 `English for Kids LetsGo`（私有區網 App「Level N - Unit N 複習」）裡，用**使用者自訂的人物**當主角的新遊戲（參考範本：賽跑）｜版本基準：game-tokens v1.8.0*

> 先讀這四份再開始：本文、`docs/plan-game-level1-race.md`（一款遊戲完整企劃長什麼樣）、`docs/handoff-prompt-letsgo-race.md`（企劃如何交給 App 端）、`assets/game-tokens/README.md`（token 套件規則與版本紀錄）。實作範本是 `app/src/games/race.ts`。

---

## 0. 一句話與成功標準
孩子用自己做的角色玩一款**短、爽、不挫折**的遊戲；玩一次要花代幣、**玩遊戲本身不賺代幣**（獎勵走星等、徽章、稱號）；在 iPad／iPhone（Safari、Chrome）與電腦都順；橫式優先；全部畫面與數值都來自 design token。

成功標準：孩子 10 秒內懂玩法；一局 1–3 分鐘；新手勝率高、熟練者有挑戰（見 §9）；畫面不被按鍵／HUD 遮住；不會縮放、不會卡住。

## 1. 專案分工（最重要的規則）
| 區域 | 誰維護 | 你能不能改 |
|---|---|---|
| `assets/game-tokens/`（`game-tokens.json`、`game-*.js`、`build-*.py`、`preview.*`） | **內容端 section**（角色／場景／道具／動物／數值資料／版面規格） | **不能改**。需要新美術、新數值區塊、新道具 → 寫 handoff 給內容端（§11） |
| `content/`（單字、徽章 `badges.json`、遊戲清單 `games/games.json`） | 內容端 | 不直接改；需要新徽章／上架項目 → 提需求，或在 handoff 附建議 JSON |
| `app/`（TypeScript、CSS、HTML、設定） | **App 端**（你是新遊戲的 App 端實作者） | 可以改，但只動新遊戲自己的檔案＋必要的註冊點（§4、§7） |
| `docs/` 的 handoff／企劃 | 雙方 | 你的交付文件也寫在這裡 |

原則：**內容端永遠不改 App 程式；App 端永遠不改 token 套件。** 兩邊靠 `docs/handoff-prompt-letsgo-*.md` 溝通。

## 2. 遊戲分類：本規範只管「我的角色」類
- 學習類（填字、戳泡泡）：iframe 嵌在遊戲室、跟單元綁定，**不在本規範範圍**。
- **我的角色類（賽跑、角色工作室）**：全螢幕整頁、同視窗導航（`window.location.assign("games/<id>.html?from=…")`）、主角是使用者角色。新遊戲屬於這類。

## 3. 一個「我的角色」遊戲的最小內容
1. 企劃文件 `docs/plan-game-<id>.md`（依 §12 範本）
2. 頁面：`app/games/<id>.html`（複製 `race.html`，viewport 必須含 `maximum-scale=1, user-scalable=no, viewport-fit=cover`）
3. 程式：`app/src/games/<id>Boot.ts`、`<id>.ts`、`<id>.css`；存檔 `app/src/game/<id>Store.ts`
4. 資料：`GameTokens.<id>`（數值／關卡／對手／文案，內容端提供）
5. 註冊：`vite.config.ts` 的多頁 input、入口導航（參考 `main.ts` 對 race 的導航）、`games.json` 項目、同步白名單（§7）
6. 驗證腳本與平衡模擬（§9、§10）

## 4. 技術架構（沿用，不要另起爐灶）
- 語言與建置：TypeScript＋Vite 多頁；**不新增 npm 相依套件**；純 DOM／SVG 字串，沒有框架。
- 載入 token 一律經 `app/src/game/gameKit.ts`（它依序載入 tokens → art → props → race → character → scene → export → icons）；`GameTokens`、`GameArt`、`GameIcons` 從這裡取。`EXPECTED_GAME_TOKENS_VERSION` 跟 token 版本一致，升版時同步。
- 頁面骨架：`import "../game/gamePage.css"`（全螢幕、不捲動、不選取、無長按選單、`touch-action:none`）＋自己的 `<id>.css`；token CSS 變數（`--g-*`）只用在遊戲頁。
- 舞台：需要「角色走在場景裡」就用 `StageController`（`src/game/stageController.ts`）：自動前進（`autoRun`）、跳躍、碰撞（solid／hazard）、`setScene`、`setCharX`、事件 callback。需要自己的邏輯就在上面包一層，**不要複製貼上改它**；缺功能 → 提需求給 App 端維護者或在同檔加選項、並保持賽跑行為不變。
- 輸入：`VirtualPad`（`src/game/virtualPad.ts`；鍵 `up/down/left/right/a/b`，同時支援鍵盤）。用 `pad.on((key, pressed) => …)` 接收；不要自己另做按鍵。
- 全螢幕頁共用：`src/game/fullscreenPage.ts`（`requireActiveProfileId`、`leaveTo`、`tryFullscreenOnFirstTap`、`addRotateHint`、`toast`、`confirmDialog`、`preventZoomGestures`）。
- 儲存：只透過 `appStorage`（`src/storage.ts`），**不要直接用 `localStorage`**（不然不會同步到電腦）。
- 代幣：`src/gameTokens.ts` 的 `getTokenBalance`、`spendTokens`（回傳 boolean）。賽跑範例：開局先 `spendTokens(profileId, cost)`，失敗要提示餘額不足、不進遊戲。
- 星等最高紀錄：`src/gameHighScores.ts` 的 `recordStars`／`getBestStars`。
- 朗讀：`src/speech.ts` 的 `speakEnglish`（語音有 iOS 限制，**不要依賴自動播放**；任何必須聽到的內容要有文字與「點一下播放」）。

## 5. 使用者角色規範
- 取角色：`getActiveLook(profileId)`（`characterStore.ts`）。沒有角色時給預設（`GameArt.presets` 之一或 `randomLook`），並引導去角色工作室，**不可當機**。一律 `normalizeLook()` 過一次（舊存檔相容）。
- 畫角色：`GameArt.character({ ...look, view, facing, pose, t })` 產 SVG 字串；動畫用 `GameArt.animate(svg, poseName)`（回傳 `{ setPose, stop }`，離開時必須 `stop()`）；頭像用 `GameArt.avatar(look, size)`。
- 角色外觀只讀不改；不要加新的 Look 欄位，需要新髮型／配件／姿勢 → 向內容端提需求（改 token）。
- 動作清單用 `GameArt.poses` 與 `performablePoses()`；序列動作（絆倒、跌倒、爬起）用 `GameArt.sequenceAt`／StageController 的 `playSequence`。新遊戲需要的情緒動作（贏、輸、受傷、慶祝）先查現有 22 個動作，沒有再提需求。
- 比例：角色高度＝170 設計單位；用 `charH`（占舞台高比例，賽跑 0.3）控制大小；不要自己縮放 SVG 圖層造成腳不貼地。
- 角色永遠是**主角**：HUD 顯示頭像與名稱；結算畫面主角做慶祝／難過動作；稱號（如賽跑的「飛毛腿」）顯示在名稱下方。
- 同時出現對手／夥伴時，用 token 的動物或預設角色（`GameArt.animal`、`GameArt.presets`），不要自己畫角色。

## 6. Design token 規範（硬性）
1. **顏色、字級、圓角、陰影、動畫時間**一律用 token CSS 變數（`--g-*`）或 `GameTokens` 資料；**不得在 CSS／TS 寫死色碼或新增自己的色票**。
2. **圖示**用 `GameIcons.icon(id, {size})`；**場景**用 `GameArt.scene(...)`／`sceneLayers`；**道具**用 `GameArt.prop(id)`；**動物**用 `GameArt.animal(kind)`。缺素材 → 向內容端提需求，先用最接近的現有素材佔位，不要手畫 SVG 混進去。
3. 遊戲數值（速度、成本、關卡、文案、對手、星等門檻、獎勵）放進 `GameTokens.<id>`（內容端維護）；App 只寫流程與判定。需要調整數字時改 json，不改程式。
4. 版面規格：直式／平板沿用賽跑；**手機橫式依 `GameTokens.layout.landscapePhone`**（三欄：左欄 144／16:9 畫面／右欄 96；← 56、→ 72、A 72、B 56；HUD 放側欄；計時進度條放畫面上方細列；結算對話框雙欄、一頁看完）。見 `docs/handoff-prompt-letsgo-race-landscape.md`。
5. 無障礙：不能只靠顏色傳達資訊；`prefers-reduced-motion`（`prefersReducedMotion()`）要降低或關閉鏡頭晃動、大量粒子；觸控目標 ≥ 56px。
6. 文字：繁體中文、孩子看得懂的短句；**不出現教材書名／出版社名**；不羞辱失敗（輸了也要有鼓勵與下一步）。

## 7. 註冊、存檔與同步（容易漏的清單）
1. `content/games/games.json` 新增項目：`id`（`^[a-z_]+$`）、`name`、`description`、`icon_placeholder`、`cost`（整數）、`status`（`active`／`coming_soon`／`disabled`）、`order`。上架內容由內容端確認。
2. 存檔 key：`levelUnitReview.<id>.v1.<profileId>`，格式與讀寫容錯參考 `raceStore.ts`（讀進來一律補齊欄位、壞資料不報錯、有版本欄位）。
3. **同步白名單兩處都要加前綴** `"levelUnitReview.<id>."`：`app/src/storage.ts` 與 `server/server.mjs`。只加一邊會造成「電腦與平板不同步」（角色造型曾因此出問題）。
4. 徽章：需要新徽章時，向內容端提需求（`content/badges/badges.json`；分類沿用或新增並更新 `BADGE_CATEGORY_ORDER`）。勿在 App 內硬寫徽章判定資料。
5. 遊戲啟動入口（主站按鈕或選單）與返回目標用 `returnTarget()`／`leaveTo()`。

## 8. 遊戲流程與 UX 規範
- 流程：入口／選關 → 規則一頁（可跳過）→ 扣代幣 → 3-2-1 倒數 → 遊玩 → 結算 → 再玩（顯示花費）／下一關／回選單。
- 成本：玩一次花 `GameTokens.<id>.cost` 代幣（預設 5，與賽跑一致）；**贏了不發代幣**；不能出現「輸了扣更多」。餘額不足時顯示「還差 N 個代幣，去學習賺代幣吧」並提供回到學習的入口。
- 暫停、音效開關、返回（返回要確認並說明是否扣款不退）都放側欄；離開頁面要清理（計時器、`pad.destroy()`、動畫 `stop()`、`preventZoomGestures()` 回傳的清除函式）。
- 結算畫面：一頁看完（橫式雙欄），顯示名次／星等／本局數據／鼓勵語；星等門檻在 token。
- 效能：iPhone 上維持流暢（目標 60fps）；避免每幀整片重建 DOM；粒子與同屏物件設上限；長時間遊玩不得記憶體持續上升。
- 防呆：必須通過 `handoff-prompt-letsgo-pad-no-zoom.md`（連點不縮放）、`handoff-prompt-letsgo-race-landscape.md`（橫式版面）；進入頁面加 `addRotateHint()`。
- 離線：區網內運作，不呼叫外部網路、不載入外部字型／腳本；單檔版（`build:standalone`，`file://`）若不支援該遊戲要在遊戲室顯示「請用區網版」。

## 9. 難度與平衡（比照賽跑）
1. 先在企劃寫**目標梯度**：新手／一般／熟練的勝率或過關率（賽跑是 96%／63%／47%，連點玩家最高）。
2. 寫 Node 模擬器 `assets/game-tokens/<id>-sim.js` 的需求交給內容端，或你自己在 `app/scripts/` 寫純邏輯模擬；模型至少含新手、一般、熟練、滿分四種技能。
3. 數值全在 token JSON，調整後重跑模擬，把結果寫進 README／HANDOFF。
4. 學習類獎勵（代幣）已由 `GameTokens.economy` 管理；新遊戲**不得**另設代幣收入。

## 10. 驗證與交付
- 必跑：`npx tsc --noEmit`、`npm run build`、`npm run build:standalone`、既有 verify 腳本（含 `verify-game-framework.ts`，在含空格的專案路徑下直接執行）。
- 新增 `app/scripts/verify-<id>.ts`：存檔往返與壞資料、星等／獎勵判定、關卡資料與 token 一致、扣款流程（餘額不足不進遊戲）。
- 實機（至少）：iPhone 橫式＋直式（Safari、Chrome）、iPad、電腦；連點、暫停、返回、斷線（區網離線再恢復同步）都測；沙盒無真瀏覽器時用 Playwright，並誠實標註「未實機驗證」。
- 交付物：程式與檔案、企劃文件、`docs/handoff-prompt-letsgo-<id>-*.md`（給內容端的素材／數值需求）、`HANDOFF.md` 新段落、結果回報（通過項目＋未驗證項目）。

## 11. 與內容端協作（需求格式）
需求用 `docs/handoff-prompt-letsgo-<主題>.md` 提出，格式比照現有檔案：標題、日期與執行對象、需求（編號）、驗收。必寫：
1. **要什麼**：新道具／場景／動物／動作／文案／數值區塊／徽章，附用途與出現畫面。
2. **資料形狀**：你希望的 JSON 欄位（例：`GameTokens.<id>.stages[].items`）與 API。
3. **尺寸與狀態**：SVG 設計單位、需要的狀態（例如 `idle／hit／win`）、是否需要碰撞資訊。
4. **驗收**：預覽頁看什麼、版本號怎麼升（內容端升版，你同步 `EXPECTED_GAME_TOKENS_VERSION`）。
內容端會回覆：新 token 版本、使用方式、模擬結果；你負責接上。

## 12. 新遊戲企劃範本（交給使用者確認，再開發）
複製 `docs/plan-game-level1-race.md` 的章節順序；至少包含：
1. 遊戲名稱、一句話玩法、目標玩家（年齡／熟練度）
2. **角色如何參與**（操作哪些鍵、用到哪些動作／姿勢、角色大小與視角）
3. 單局流程與時間、勝負／星等規則、失敗時的鼓勵
4. 關卡或內容結構（幾關、解鎖條件）
5. 操作對照（直式／橫式、觸控／鍵盤）與 HUD 配置
6. 成本、獎勵（星等、稱號、徽章；**不賺代幣**）
7. 與英語學習的連結（有／無；若有，單字／句型如何融入、答錯如何處理）
8. 素材需求清單（逐項標明：已有／需新增→提給內容端）
9. 數值與目標梯度、模擬計畫
10. 風險與未決事項（交給使用者決定的清單）

## 13. 已知陷阱（這個專案踩過的）
- 沒加同步白名單（兩處）→ 電腦與平板資料不同步。
- iOS：連點會觸發雙擊縮放；語音不能自動播放；`cancel()` 後馬上 `speak()` 不穩。
- 全螢幕頁的返回：用 `leaveTo()`，不要自己 `history.back()`。
- token 載入順序固定，且 token 是經典 script（掛在 `window`），不要改成 ES module import。
- 角色 SVG 是字串；每幀重畫會閃，要用 `animate()` 控制姿勢，需要重畫時（換視角／面向）才重建並重新套用特效（例如蓄力光暈）。
- 檔案路徑含空格（`English for Kids LetsGo`），命令列記得加引號。
- 沙盒沒有真瀏覽器與 iPad：視覺驗證靠截圖／Playwright，不能宣稱已實機測過。
- 單檔版（`file://`）不支援 iframe 與多頁；新頁面要確認 standalone 不被破壞。

## 14. 驗收清單（交付前逐項勾）
- [ ] 角色（含沒有存檔的情況）可正確顯示，姿勢／視角／面向正常，離開頁面無殘留動畫
- [ ] 所有顏色／圖示／場景／道具／數值都來自 token，沒有寫死色碼與數字
- [ ] 手機橫式依 `layout.landscapePhone`：按鍵與 HUD 不遮畫面，結算一頁看完；直式與 iPad 正常
- [ ] 連點不縮放；觸控目標 ≥ 56px；`prefers-reduced-motion` 有處理
- [ ] 扣款流程正確（餘額不足不進遊戲、贏了不發代幣）；星等寫入 `recordStars`
- [ ] 存檔 key 已加入 `storage.ts` 與 `server/server.mjs` 白名單；電腦與平板同步實測
- [ ] `games.json` 項目、入口、返回路徑正確；單檔版行為已處理
- [ ] 平衡模擬達成企劃的目標梯度，結果記錄在文件
- [ ] tsc／build／verify 全過；已寫 handoff 與 HANDOFF 段落；未實機驗證項目明列
