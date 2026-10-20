# Handoff：我的角色 — 賽跑（與森林動物賽跑）

*撰寫：2026-10-11（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜只改新專案｜企劃：`docs/plan-game-level1-race.md`（§13 已確認：泰迪熊裁判，其餘照建議）*
*前置：把 `assets/game-tokens/` 更新到 **v0.8.0**（新增 `game-race.js`；更新 `game-tokens.json/js/css`、`game-character.js`（v0.7.2 殘影修正）、`game-props.js`（樹幹 bark）、`race-sim.js` 為工具，App 不載入）；`EXPECTED_GAME_TOKENS_VERSION` 改 0.8.0；載入順序：tokens → art → props → **race** → character → scene → export → icons。*
*內容端已完成：對手動物、賽跑道具、賽道資料、數值試算；App 端負責流程、物理、碰撞、HUD、存檔、扣款。*

## 1. 入口與流程
- 首頁「我的角色」頁（或遊戲室）新增入口「賽跑」。使用目前選用角色（含造型、名字）。
- 流程：**選對手（3 張卡）→ 確認「花 5 代幣開始」→ 起跑準備＋倒數 → 比賽 → 終點 → 結算**。
- **扣款**：按「開始」時呼叫 `gameTokens` 扣 `GameTokens.race.cost`（5）。倒數開始前取消不扣；倒數開始後離開不退。代幣不足：顯示「去學習賺代幣」按鈕，不扣款、不進賽道。**贏了不發代幣**（`race.payout = 0`；既有規則：玩遊戲不賺代幣）。
- **解鎖**：烏龜永遠開放；贏（第 1 名）第 N 場才解鎖第 N+1 場；已通關可重玩（仍扣 5），只更新最佳成績。
- 暫停：切 App／離開頁面／來電自動暫停，回來顯示「繼續」；暫停不計時。

## 2. 資料來源（全部讀 token，不要寫死）
```ts
const R = GameTokens.race;           // cost、track、player、effects、animals、referee、opponents、stages、stars、unlock、rewards
R.stages[i].items                    // 賽道物件表 [{id,x,elev?,w?,stack?,top?}]
R.stages[i].u / label / targetTime / opponent
GameArt.props                        // 道具 size／collider（kind: pickup | zone | hazard | solid | spring）
GameArt.animal(kind,{pose,t,facing}) / GameArt.animateAnimal(svg,pose)
GameArt.character(R.referee.look + {view,pose})  // 熊熊裁判
```
- **單位**＝角色設計單位（角色高 170、groundY 164）；畫到舞台：`px = 單位 × (角色高 px ÷ 170)`。賽道長 `R.track.length = 3600`。
- 動物 viewBox（寬×高，單位）：烏龜 130×72、兔子 130×106、鴕鳥 130×192（鴕鳥比角色高，是設計）；腳底線在 `h − 6` 左右，直接用 `GameArt.animalViewBox[kind]` 置底對齊地面。預設朝右，`facing:'left'` 鏡像。
- 容器不要 `overflow:hidden`（`stumble`、`sleep` 會轉出框）。

## 3. 賽道與場景
- 沿用 `forest` 場景與視差，**不新增場景**。三場天色以 `stages[i].u`（0.08 晨光／0.25 午後／0.44 黃昏）傳給 `GameArt.skyAt/scene`。
- 玩家與對手各一條視覺跑道（對手在後一條，景深疊放；高度略上移 8–12 px 表示較遠）。**每場只有玩家＋1 位對手。**
- 起跑門 `startGate`（x=0 附近）、終點線 `finishLine`（x=3600；撞線時切 state `broken`）；`mileFlag` 每 `track.mileFlagEvery`（600）單位自動擺一支；第 `warnStages`（[1]）場在每個 `rock`／`branch` 前 `warnLead`（150）單位擺 `warnSign`。
- 鏡頭跟玩家；對手出畫面時在邊緣顯示箭頭＋距離。頂部進度條：`GameArt.avatar` 頭像（玩家）與對手動物縮圖（可用 `animal(kind,{pose:'idle'})` 裁頭部或固定圖示）依位置/3600 並排移動。

## 4. 賽道物件擺放（`stages[i].items`）
| 欄位 | 意義 |
|---|---|
| `id`, `x` | 道具 id；x＝賽道單位（0–3600），以道具**左緣**為準 |
| `elev` | 底端離地單位（`branch`／`hive`＝118，站立會撞，蹲滑可過；其他預設 0） |
| `w` | 區域橫向拉伸寬度（`windZone`／`mud`）；道具以 `preserveAspectRatio="none"` 水平縮放 |
| `stack`, `top` | `stoneBlock` 疊 2–3 層（每層 64 單位高）；`top` 為站在最上層的道具 id 列表（沿著方塊上緣 x 依序排開，約每 30 單位 1 個，elev＝方塊總高） |
- 起跑區 0–300、終點前 300 單位已確保沒有障礙；障礙彼此間距 ≥150。新增關卡只改資料，不改程式。

## 5. 操作
- **自動前進**，不能倒退，不需左右鍵。按鈕：**跳**（↑／A／空白）、**蹲滑**（↓／B）、**使用加速罐**（C／Shift，持有時亮起）。左右手互換沿用既有設定。
- 跳：高度約 `R.player.jump.height`（130 單位）、滯空約 `airMs`（900 ms）。**蓄力跳**：在地面蹲住 ≥ `chargeJump.holdMs`（1000 ms）後放開／按跳 → `chargeJump.mult`（×2）高度；蹲住 ≥350 ms 起套 `GameArt.setCharge(svg,true,false)`，≥1000 ms 套 `(true,true)`（沿用 r2／obstacles 規則；沒有圖示）。
- 蹲滑：蹲姿（`crouch` pose）持續到放開；滑行不損速度，角色高度降低（頭頂約 110 單位，低於 `elev:118`）。
- 動作姿勢：跑＝`run`（走／跑 pose，依速度）、跳＝`jump`／`fall`／`land`、蹲＝`crouch`、短絆＝見 §6。

## 6. 速度與碰撞（公式；數值全在 `R.effects`）
**速度**＝`R.player.speed(120)` × 加速倍率（目前所有加速中取**最大值**，不疊加）× 所有進行中減速倍率**相乘**。蹲滑／跳躍不影響速度。
| 物件（kind） | 觸發 | 效果 |
|---|---|---|
| `speedShoe`（pickup） | 碰到即撿 | ×1.4、2.5 秒（再撿刷新時間） |
| `boostCan`（pickup） | 碰到即撿，存入道具欄（最多 1，已滿再撿無效但消失） | 按 C：×1.7、2 秒；使用時角色 `setCharge(true,true)`，結束關閉 |
| `windZone`（zone） | 區域內 | ×1.25（離開恢復） |
| `spring`（spring） | 從上方落下踩到（腳底穿過 `box` 上緣） | 彈起並**瞬間前進 +120 單位**（動作用 `jump` 彈高，高度比一般跳高約 1.3 倍） |
| `bubble`（pickup） | 碰到即撿 | 持有護盾（角色外加半透明泡泡圈，可用 `bubble` 道具縮放疊在角色上）；擋下**下一次**障礙後破掉（無減速、不算撞擊） |
| `rock`（hazard） | 側面碰到且腳底低於上緣 | **短絆**：播 `trip` 動作前 380 ms 即可（不要完整 1.9 秒序列），速度 ×0.3、0.6 秒；跳過（腳底高於上緣）安全 |
| `mud`（zone） | 進入區域 | ×0.6，離開恢復；跳過整片（`w` ≤ 140，單次跳可過）安全 |
| `branch`（hazard，`elev` 118） | 站立或跳起時碰到 `box` | ×0.5、0.8 秒；蹲滑通過安全（蹲滑頭頂低於 `elev`） |
| `hive`（hazard，`elev` 118） | 同上 | ×0.7、1.5 秒（蜜蜂追逐特效可用 `sparkle`／小黑點粒子，選配） |
| `log`／`stump`／`stoneBlock`（solid） | 沿用既有 solid 規則 | 側面擋住（等同停在原地，直到跳起）；可踩上去；站上去可蹲、蓄力、再跳 |
- 「撞擊」計數（供星等／徽章）：所有 hazard 與 mud 造成減速且沒被護盾擋掉的次數；撞到 solid 被擋**也算 1 次**。
- 護盾優先於所有 hazard／mud 減速。減速中再被撞：倍率相乘（不延長原計時，各自獨立）。
- 陰影貼在腳下支撐面；不要修正動作內建的 `root.y`。
- 所有判定在 `prefers-reduced-motion` 下仍成立，只關畫面震動與速度線。

## 7. 對手 AI（`R.opponents[kind]`）
- 對手只有自己的速度曲線，**不撿道具、不吃障礙、不受橡皮筋影響**，由參數決定：
  - `speed`：基準速度（單位／秒）：烏龜 116、兔子 140、鴕鳥 190。
  - 兔子 `sprint`：每 `everySec`（8）秒的前 `sec`（3）秒速度改為 `speed`(200)。
  - 兔子 `nap`：當對手領先玩家 > `lead`（400）單位且玩家尚未完賽 → 睡 `sec`（2.5）秒（`sleep` 動作＋zzz），之後 `cooldownSec`（4）秒內不再睡。
  - `stumble`: [{x,sec}]：到 x 處固定絆倒（`stumble` 動作），停頓 `sec` 秒（期間速度 ×0.15）。
- 動作：跑＝`animateAnimal(svg,'run')`（動畫週期已含在 token `race.animals[kind].runPeriod`，速度很快時不要加速播放）；睡＝`sleep`；絆倒＝`stumble`（一次性，播完停在最後一格）；終點：贏＝`cheer`、輸＝`sad`。
- 平衡試算（已完成，`node assets/game-tokens/race-sim.js`）：第 1 場新手 99%、第 2 場一般 61%、第 3 場熟練 41%；詳見企劃 §7。**數值要調時只改 token，不改程式。**

## 8. 熊熊裁判（泰迪熊）
- `GameArt.character({...R.referee.look, view:'front', pose})`（物種 `bear`，條紋衫、帽子、拿旗子）；姿勢對應 `R.referee.poses`：待機 `idle`、倒數 `wave`、Go `cheer`、終點 `salute`、頒獎 `victory`（玩家贏）／`cheer`（對手贏）。
- 台詞（氣泡）取 `R.referee.lines`：`ready`／`set`／`go`／`win`／`lose`；是否朗讀交給既有語音設定。
- 倒數：3‑2‑1‑Go 大字＋起跑門＋裁判；Go 時角色與對手同時起跑。終點：撞線 `finishLine` 切 `broken` ＋紙花（輸時不放紙花，顯示「差一點」）。
- 位置：起跑門旁、終點線旁各一位（同一造型，不同時出現）；選單頁放一位引導。

## 9. 結算與獎勵
- 結算：名次、時間、距離差、星等、撿道具數／撞擊數、角色頒獎台拍照（沿用拍照流程）。
- **星等**：★ 勝利；★★ 勝利且時間 ≤ `stage.targetTime`；★★★ 勝利、時間 ≤ targetTime 且撞擊 0。
- 只發**一次**（重玩只更新最佳成績）：徽章 `RC-01` 烏龜首勝（贏第 1 場）、`RC-02` 兔子追不上（贏第 2 場）、`RC-03` 鴕鳥克星（贏第 3 場）、`RC-04` 全三星（三場皆 ★★★）、`RC-05` 零失誤（任一場撞擊 0 且獲勝）；稱號「森林跑者／閃電跑者／飛毛腿」（贏第 1／2／3 場）顯示在角色名字下方；三場全贏 → 解鎖「冠軍獎盃」`trophy` 道具（可放在角色工作室場景）。圖片：`docs/image-prompt-letsgo-race-badges.md`（內容端自動化流程產出，放進 `app/src/assets/badges/` 即生效）。
- 連敗 ≥3 次：結算出現提示卡（「把加速罐留到最後衝刺」「蓄力跳可以走捷徑」），**不改數值**。

## 10. 存檔
- 鍵：`levelUnitReview.race.v1.<profileId>`，值：`{ stages:{ "1":{best:秒|null, stars:0–3, wins:n, hitsMin:n|null}, "2":…, "3":… }, losses:n（目前連敗，供提示卡）, rewards:{ badges:[…], titles:[…], trophy:boolean }, stats:{ played, coinsSpent } }`。同步規則沿用既有 `storage.ts`（跟 `characterStore` 同風格）。
- 解鎖狀態＝由 `stages[N].wins ≥ 1` 推導，不另存。

## 11. 驗收
1. 代幣不足不能開始；扣款一次且只扣 5；倒數前離開不扣、之後離開不退；贏了不發代幣。
2. 沒贏第 1 場，第 2 場鎖著；贏了才解鎖；重啟 App 後解鎖狀態保留。
3. 賽道物件與 token 資料一致（含 `elev`／`w`／`stack`／`top`）；障礙與道具效果、數值符合 §6；護盾、加速罐存放／使用、蓄力光暈正確。
4. 對手行為：兔子衝刺＋睡覺、鴕鳥與兔子的固定絆倒、全程不撿道具；沒有橡皮筋。
5. 動物動畫切換不閃站姿／殘影（`animateAnimal` 啟動時已同步套 t=0；角色同理 v0.7.2）。
6. 星等與一次性獎勵正確（重玩不重複發）；結算拍照可用。
7. 390／820 版面、左右手互換、`prefers-reduced-motion`、暫停／回前景、鏡像（`facing:'left'`）。
8. 完成後在新專案 HANDOFF 記錄，並回報需要內容端補的 token（例如更多石頭／木頭款式、跌倒表情、直立木頭）。

## 12. 內容端另交付／回報
- 預覽頁（Artifact「Game Design Tokens」§9）可看全部動物姿勢、裁判姿勢與三場賽道排布。
- 之後可補：狗狗吉祥物（二期）、更多對手、`spring` 的彈起視覺狀態。
