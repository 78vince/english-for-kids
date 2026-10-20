# Handoff：兔子重新設計（跳躍前進）＋賽跑步調參數（game-tokens）

*撰寫：2026-10-12（App 端，依使用者回饋）｜執行對象：內容端 `assets/game-tokens/`（`game-race.js`、`game-tokens.json`）｜App 端不改 token 繪圖*
*對照圖：`handoff-prompt-letsgo-rabbit-hop.before.png`（v1.4.1 的兔子，跑步姿勢看起來像趴著走）*

## 1. 兔子造型重新設計，改成「跳躍前進」（使用者需求）
- 兔子不要像四腳跑步，改成**一蹦一蹦往前跳**：後腿蹬地 → 身體拉長騰空（耳朵往後飄）→ 前腳先落地、後腿收回 → 再蹬；每一跳有明顯的上下起伏與擠壓伸展（落地壓扁、騰空拉長）。
- 造型一起調整：直立一點的身體、大後腿、長耳朵、圓尾巴，跟角色風格一致（圓潤、無描邊）；側視、預設朝右，`facing:'left'` 鏡像。
- 動作：`run`＝跳躍循環（`race.animals.rabbit.runPeriod` 依跳躍節奏調整，例如一跳約 350–450ms；高度起伏由動作本身的 `root.y` 決定，App 不另外加），`idle`、`sleep`（午睡 zzz）、`stumble`（絆倒）、`cheer`、`sad` 都要重畫成新造型。
- viewBox 若改尺寸請更新 `animalViewBox.rabbit`（App 依它把腳底對齊地面）；跳到最高點也不能跑出 viewBox 太多（容器已 `overflow:visible`）。
- 速度與 AI（`opponents.rabbit` 的衝刺、午睡、絆倒）不用改；若跳躍節奏影響觀感，可微調 `runPeriod`。

## 2. 賽跑步調參數（App 已實作，建議搬到 token）
App 端這一輪加入方向鍵調整步調（使用者需求）：按住 →（前進方向）略快、連續點 → 明顯變快、按住 ← 略慢。數值目前寫在 App（`race.ts` 的 `PACE`），建議移到 `race.player.pace`，之後調整只改 json：
```json
"pace": { "hold": 1.1, "tap": 1.35, "back": 0.85, "tapCount": 3, "tapWindowMs": 900, "tapKeepMs": 450 }
```
（速度＝基準 × 加速道具（取最大）× 減速相乘 × 步調；連續點＝0.9 秒內點 3 次以上、最後一次在 0.45 秒內。）請用 `race-sim.js` 把「會連點」的玩家也試算一次，必要時調整對手速度或 `targetTime`。

## 驗收
- 預覽頁兔子 idle／run／sleep／stumble／cheer／sad 都是新造型；run 是跳躍循環，換姿勢不閃、不殘影。
- 版本號升一版並告知 App 端；App 端同步檔案、更新 `EXPECTED_GAME_TOKENS_VERSION`、改讀 `race.player.pace`（有就用 token 的值），跑賽跑回歸。
