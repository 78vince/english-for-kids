# Handoff 2/3：第一關「人物設定」角色工作室

*撰寫：2026-10-08（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜只改新專案｜前置：Handoff 1（遊戲框架）*
*完整企劃（流程、畫面、決策）：`docs/plan-game-level1-character-studio.md`；已定案 §13 九項全採建議。*

## 目標
使用者在一個安靜的空間裡打扮自己的角色、存檔、試玩操作與動作、切換場景。角色之後作為所有關卡的主角與個人檔案頭像。

## 頁面與入口
- `games/character-studio.html`，同視窗導航、全螢幕。入口：**首頁獨立「我的角色」**＋遊戲室第一項；之後各關卡右上角顯示角色頭像（`GameArt.avatar(look,size)`），點擊可回工作室。**不扣代幣**。
- 橫放 ≥ 820×480：舞台約 62%、右側面板約 38%；手機直放：舞台置頂、面板底部抽屜，展開時隱藏虛擬按鍵。

## 版面（參考企劃 §4）
頂部列：返回、角色名稱（可編輯，1–12 字，中英文數字，禁空白與純符號）、復原／重做、儲存狀態點（同步中／已存／離線稍後同步）、拍照鈕。
面板四分頁：**造型**、**動作**、**場景**、**相簿**（相簿由 Handoff 3 實作，這裡先放分頁殼）。
視角切換（正／側／背）在舞台右下；編輯時預設正面，開始移動自動側面。
全部 icon 用 `GameIcons`（camera/undo/redo/save/shirt/dice/trash/edit/face…）；文字用 `.g-t-*`；點擊區 ≥ 56px。

## 造型（選項來自 `GameTokens.character.options`，**不要寫死清單**）
- 分類：身體（物種 kid/bear、膚色／小熊毛色 `fur`）、頭髮（髮型、髮色）、臉（眼、口）、服裝（outfit、outfitColor、pantsColor）、配件（可複選）、手持物。
- 款式用縮圖（以 `GameArt.character` 即時繪製，不用圖檔）；色票用圓形色塊，已選以外框標示；長按色票顯示名稱（無障礙，不能只靠顏色）。
- 點選即套用；**復原／重做 ≥ 20 步**；底部固定「隨機」（`GameArt.randomLook()`，保留名稱與物種）、「還原」、「預設角色」（`GameArt.presets`，9 組；首次進入隨機給一組）。
- 配件全開（不解鎖）。頭部配件之間若視覺衝突（例如 cap 與 goggles）允許並存，不做限制。
- 新款式出現未知 id 時，以預設值替換，不報錯（向前相容）。

## 動作分頁
- 按鈕格：`GameArt.poses` 全部（各有 `label`）＋「連播」`GameArt.sequences`（轉圈展示、打招呼）。按下＝角色原地表演（呼叫 `GameArt.animate(svg, pose)`；序列用 `GameArt.sequenceAt(name, ms)` 每步重畫，見預覽頁「動作連播」）；再按或開始移動即結束。
- 表演時隱藏／鎖住虛擬按鍵以外的干擾；不改變存檔。

## 試玩小場域（不計分）
場景內擺可互動物件，狀態來自 `GameArt.propStates(id)`：禮物方塊（A 頂開彈出彩帶）、彈簧、花苞、寶箱（走近開啟）、營火（點擊開關）。可收集金幣，**僅在畫面顯示，不計入學習代幣**。物理與按鍵見 Handoff 1。頂部提示氣泡（`.g-bubble`）「按 A 跳起來！」，完成一次後不再出現；首次進入有 3 步輕量導覽（點選造型→按 A→按相機），可略過、只出現一次。

## 場景
`GameArt.scenes`＝forest、studio；縮圖輪播以 `GameArt.scene(id,w,h,{time})` 即時繪製。時間控制：白天／夜晚／系統時間／拖曳；各場景獨立記憶。切換淡入淡出 300ms，角色維持在地面線。之後新增場景（海灘、房間）只要 token 增加，App 端自動出現，不改邏輯。

## 存檔與同步
- key：`levelUnitReview.character.v1.<profileId>`，走既有 server-sync（較新者勝、衝突舊值進 `conflicts/`），本機 localStorage 快取；離線可用。
- 格式：
```json
{"version":1,"activeSlot":0,"slots":[{"id":"c1","name":"小夥伴","look":{"species":"kid","skin":"peach","hairStyle":"short","hairColor":"chestnut","eyes":"dot","mouth":"smile","outfit":"hoodie","outfitColor":"sky","pantsColor":"stone","accessories":["glasses-round"],"held":"none"},"scene":{"id":"forest","time":"day","useSystemTime":false},"createdAt":0,"updatedAt":0}],"stats":{"photos":0,"scenesShot":[],"firstSaveRewarded":false,"firstPhotoRewarded":false}}
```
`look` 只存 id 字串、與 `GameArt.character()` 參數一致（小熊另有 `fur`）。**3 個角色槽**；切槽自動存目前編輯。
- 自動存：每次變更後 800ms debounce；離開、切槽、拍照前強制存。刪除／覆蓋一律二次確認（圖示＋兩顆大按鈕，文字簡短）。
- 個人檔案頭像、各關卡右上頭像使用 active slot 的 `look`。

## 獎勵（沿用既有代幣與徽章機制）
首次儲存角色 +10 代幣、首次拍照 +5（以 `stats.firstSaveRewarded/firstPhotoRewarded` 防重複）。新徽章規則式（圖案由內容端另提供）：造型師（儲存 3 個不同角色）、攝影師（拍 1／10 張）、環遊世界（各場景都拍過）、日夜都愛（白天與夜晚各拍 1 張）。

## 驗證
手機 390／平板 820（直橫）；任意造型組合無穿幫（耳機、背包、披風、翅膀、長髮與各視角）；改造型→重新整理仍在；兩台設備同步；離線改→上線同步；復原重做；3 槽切換；`prefers-reduced-motion`；對比 ≥ 4.5:1。完成後在新專案 HANDOFF 記錄，並回報需要內容端補的 token（款式、動作、場景）。
