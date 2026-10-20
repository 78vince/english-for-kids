# Handoff 1/3：遊戲共用框架（token 模組、虛擬按鍵、舞台控制）

*撰寫：2026-10-08（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜只改新專案｜先做這份，再做 2、3*
*相關：`docs/plan-game-level1-character-studio.md`、`assets/game-tokens/README.md`、預覽 Artifact `game-design-tokens`（行為與手感以預覽頁為準）*

## 目標
把 `assets/game-tokens/` 的繪製器與預覽頁裡已調好的操作手感，整理成之後**所有遊戲關卡共用**的三個模組。內容端維護 json 與圖形演算法（`game-*.js`），App 端**不改圖形邏輯**，只負責封裝、型別、整合。

## 要做的事
1. **引入 token 模組**
   - 載入順序：tokens → art → props → character → scene → export → icons（見 README）。可轉成 ES module 並補型別宣告（`GameTokens`、`GameArt`、`GameIcons`），但演算法檔案以內容端為準；內容端更新後 App 端直接覆蓋檔案即可。
   - `game-tokens.css`（`--g-*`、`.g-t-*`、`.g-bubble/.g-chip/.g-iconbtn/.g-firefly`…）掛在遊戲頁；**不要**與學習介面 token（`design-tokens`）混用。
   - 啟動時檢查 `GameTokens.meta.version`，與 App 預期版本不同時，開發模式 console 警告。
   - 全專案不得出現外部字型／CDN 請求；字型隨附 Nunito＋Noto Sans TC 子集。
2. **`VirtualPad` 元件**
   - 十字鍵 ↑↓←→ 在左、**A 在右上、B 在左下（靠近十字鍵一側，與 A 間距見預覽頁）**；每鍵 ≥ 56px；多點觸控（可同時按方向＋B＋A）；`pointer capture`；視窗失焦／`blur`／切分頁時自動放開所有鍵。
   - 鍵盤對應：方向鍵；A＝`A`／`Space`／`J`；B＝`B`／`Shift`／`K`；在 input/select 內不攔截。
   - 對外介面：`down: {up,down,left,right,a,b}`、事件 `press(k, bool)`；icon 使用 `GameIcons`（up/down/left/right）。
3. **`StageController`（舞台）**
   - 圖層 DOM：依場景 `layers` 建立；每層日／夜兩疊，夜層透明度＝`skyAt(...).night`；視差速度＝`parallax`；層寬 200%、水平平鋪。
   - 時間：`u∈[0,1)`；模式＝固定／播放（`celestial.cycleMs`）／系統時間（`GameArt.uFromDate()`）；太陽月亮為獨立物件，依 `skyAt` 的 x/y/size 定位，太陽顏色設 CSS 變數 `--sunc`；`celestial.hidden` 的場景（攝影棚）不顯示。
   - 角色：腳底在舞台高 **0.88**，角色高約 0.34H（可由關卡設定）；夜晚套 `world.light.night.filter`；`stage` 高度改變時重算。HUD 的 z-index 必須高於前景（canopy）。
   - **移動與物理（與預覽頁完全一致）**：走 .38 W/s、按住 B 奔跑 .85 W/s；蹲下（↓）在地面時**不能前進**；A 起跳（拋物線，高度約舞台高 26%），空中可水平移動，空中速度由**起跳當下是否按著 B** 決定（跑跳較遠）；落地：若正在移動則不播落地動作、直接接走／跑，否則播 `land` 240ms；動作優先序＝一次性動作 > 空中(jump/fall) > 蹲下 > 走/跑 > 待機動作。參數與寫法可直接參考 `assets/game-tokens/preview.src.html` 的 `loop`、`desired`、`press`。
   - 偏好減少動態（`prefers-reduced-motion`）：停用視差、特效、螢火蟲動畫。
4. **共用 HUD 與全螢幕頁骨架**：沿用「全螢幕遊戲」handoff（同視窗導航、safe-area、離開前 flush 同步、返回後 hydrate）。
5. **驗證**：建一個 `games/_sandbox.html`（開發用，不上正式入口）放舞台＋按鍵＋場景切換，在手機 390、平板 820（直／橫）逐項試：走、跑、跳、跑跳、蹲下不能前進、落地接續移動、日夜切換、系統時間。60fps（iPad 6 代以上）。
6. 在新專案 HANDOFF 記錄；回報需要內容端補的 token。
