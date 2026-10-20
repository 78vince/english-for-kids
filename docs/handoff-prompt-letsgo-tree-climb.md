# 交接：新遊戲「爬樹」（tree_climb）— App 端實作（token v2.0.0）

> 內容端已交付素材、數值、地形生成與試算；App 端負責遊戲本體。先讀 `docs/plan-game-tree-climb.md`（企劃、§14 已確認決定、§15 試算）與 `docs/game-dev-spec-my-character-games.md`。

## 0. 前置
- 覆蓋 `assets/game-tokens/*`，`EXPECTED_GAME_TOKENS_VERSION` ＝ `2.0.0`。載入順序：tokens → art → props → race → **tree** → character → scene → export → icons。
- `games.json` 新增：`id: tree_climb`、`name: 爬樹`、cost 5、payout 0（不發代幣、不給免費首玩）。
- 存檔 key：`levelUnitReview.treeClimb.v1.<profileId>`，**storage.ts 與 server.mjs 兩處白名單同步**（前綴 `levelUnitReview.treeClimb.`）。
- 新頁 `games/tree-climb.html`＋`treeClimb*.ts/.css`；`StageController` 偏水平跑酷，**請新寫垂直攀爬舞台模組**，共用 VirtualPad、角色渲染、全螢幕。

## 1. 讀取的資料（全部在 `GameTokens.treeClimb`，勿寫死）
`world`（50 單位＝1 m、頂高 8000＝160 m、zones、parallax）、`layout`（樹枝定位）、`player`（走 130、空中控制 .8、跳高 130／滯空 900 ms、coyote 80、buffer 100、edgeForgive 12、dropThrough、camera、lowGravity ×0.75 於 7000 以上）、`effects`、`spawn`、`levels`（小樹苗 120 s／大橡樹 90 s／千年神木 60 s；unlock：前一難度 ★★）、`stars`、`summit`、`titles`、`messages`、`rewards.badges`、`layout.landscapePhone.variants.treeClimb`（含 ↓ 鍵）。

## 2. 美術 API
- 地形：`GameArt.treeBuild(levelId, seed)` → 樹枝陣列 `{uid, side:'L'|'R'|'W', len, style, alt, kind:'start'|'normal'|'brittle'|'top', x0, x1, id, shroom?}`；**`id` 是素材 prop id（limbS/M/L/Wrap/Brittle/Top），會重複；DOM 元素 Map、脆枝計時一律用 `uid`**。**固定種子重現同一棵樹**；已保證只用一般樹枝即可通關（450 組驗證 0 不可達）。左側枝為右側圖水平鏡像。樹枝為**單向平台**，踩踏面＝`alt`（圖上緣 y=14）。
- 背景：`treeChunk(layer, idx, w)`（layer: far/mid/trunk/near，chunkH 640）分層捲動，視差 .5/.75/1/1.15；`treeSkyAt(alt)` 取天色，`treeStars()` 星空，`treeZoneAt`、`treeTrunkHalf(alt)`。`treeCompose` 只是靜態合成（預覽／結算縮圖），遊玩請自行分層。
- 道具／生物用 `GameArt.prop(id,{state})`，尺寸與碰撞框在 `props.list`（群組「爬樹」）：caterpillar、birdFoe、bee、acorn、balloonCluster、gust、meteor、alertMark、hourglassLeaf、capeItem、acornPick、capeFx、parachute、springShroom、limbS/M/L/Wrap/Brittle/Top。動作新增 `parachute`、`fly`。

## 3. 規則重點（細節見企劃）
1. 失敗＝掉出畫面底端（地面仍可見時不失敗）；掉出後切降落傘下降動畫（60 單位/秒，水平 ±40），鏡頭平滑移到角色，然後結算。
2. 鏡頭只往上推（角色高過畫面 60% 才推）；↓＋A 可穿越單向平台下落。
3. 披風 `capeItem`：拾取持有 1 個，B 鍵使用，飛升 3 s（230 單位/s、可 ←→ 微調、無敵），結束正常下落。氣球只當障礙。
4. 沙漏葉 +5 s，每局最多 3 次；被擊中後無敵 1500 ms；暈眩期間不能移動／跳但受重力。
5. 障礙與道具依 `spawn`（每 1000 單位期望數）＋固定種子生成，最小間距 `minGapUnits`、不得出現在唯一路徑起跳點，預警（`warnMs`）要有 `alertMark`。難度以 `levels[].allow`／`obstacleScale` 限制。
6. 星等＝最高高度（公尺）對 `stars[levelId]`：小樹苗 15/55/125、大橡樹 25/50/85、千年神木 25/45/75；稱號 `titles`；登頂 160 m 顯示 `summit`。
7. 不接英語學習連結、無夜間版、不發代幣。
8. 徽章 TC-01..08 草案在 `rewards.badges`；內容端待使用者確認後再寫入 `content/badges/badges.json`，App 先照條件做統計即可。

## 4. 驗收
- 垂直物理：跳高 130 可上 dy≤118；coyote/buffer/邊緣寬容生效；單向平台不卡頭。
- 三難度各玩一輪：樹頂可達、計時正確、降落傘結算正常。
- 橫式手機：依 `layout.landscapePhone.variants.treeClimb`（含 ↓）；iPad 不誤觸縮放。
- 存檔跨裝置同步（白名單兩處）；`verify` 腳本新增 tree_climb 項。
- 平衡為模擬假設值，實機後把真實成績回報內容端校正 `tree-sim.js` 與 `stars`。
