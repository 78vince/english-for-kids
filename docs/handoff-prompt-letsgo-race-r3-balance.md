# Handoff：賽跑第三輪——移除蹲滑、提高加速（game-tokens 賽道資料與數值）

*撰寫：2026-10-12（App 端，依使用者回饋）｜執行對象：內容端 `assets/game-tokens/game-tokens.json`（`race`）＋ `race-sim.js` 重新試算｜App 端已先用暫時做法處理（見下）*

## 使用者需求
1. **移除蹲下滑行**：↓ 在賽跑中完全不作用（不蹲、不蓄力跳）。
2. **提高加速道具的速度加成。**
3. **提高連續點擊前進方向（→）的速度加成。**

## App 端已做的暫時處理（等 token 改好後移除）
- 不擺 `branch`、`hive`（需要蹲滑才能過）及其警示牌。
- 疊方塊 `stoneBlock.stack` 最多 2 層（3 層 176 單位，沒有蓄力跳上不去，會永遠擋住）。
- 加速倍率先寫在 App（`race.ts` 的 `BOOST_MULT`）：加速鞋 1.4 → **1.6**、加速罐 1.7 → **2.1**。
- 連點步調（`race.ts` 的 `PACE`）：連點 1.35 → **1.6**（按住 → 1.1、按住 ← 0.85 不變）。

## 請內容端
1. `race.stages[*].items`：拿掉 `branch`、`hive`（可改放其他跳得過的障礙或道具，維持障礙間距 ≥150）；`stoneBlock` 疊層改成最多 2 層（或改成「階梯式」2 層＋1 層讓普通跳可以一級一級上去）。`effects.branch`／`effects.hive`、`player.chargeJump` 可刪除或標註不用。
2. `effects.speedShoe.mult` → 1.6、`effects.boostCan.mult` → 2.1（或內容端認為更好的值）；新增 `race.player.pace`（見 `docs/handoff-prompt-letsgo-rabbit-hop.md` §2），`tap` 改 1.6。
3. 用 `race-sim.js` 重新試算：App 端自動玩家（會跳、有罐就用、不連點）目前三場都贏（烏龜 22.4 秒、兔子 18.6 秒、鴕鳥 18.1 秒，目標 25／23／20.5），難度明顯變低。請調整對手速度、兔子衝刺、`targetTime`，讓勝率回到新手／一般／熟練的梯度（例如 95%／60%／40%，連點的玩家應該比較容易贏）。
4. 版本號升一版並告知 App 端；App 端會改回全部讀 token（清空 `BOOST_MULT`、拿掉 `CROUCH_ONLY` 與疊層上限）。
