# Handoff：側面眉毛往眼睛方向偏移（game-tokens）

*撰寫：2026-10-12（App 端，依使用者回饋）｜執行對象：內容端 `assets/game-tokens/`（`game-character.js`）｜App 端不改 token 繪圖*
*對照圖：`handoff-prompt-letsgo-brows-side-offset.before.png`（v1.0.0，側面、面向右，粗眉）*

## 問題
側面時眉毛的位置太靠後（太靠近後腦勺），沒有對在眼睛正上方。

## 需求（使用者原話）
「側面的時候，眉毛要往眼睛的方向偏移多一點，如面向畫面右方時，眉毛要再多偏移約 4px。」

## 現況
- `game-character.js` 側面頭部：`browsSvg(true, 73, 0)`（小孩）、`browsSvg(true, 72, -4)`（小熊）；側面眉毛以 `translate(cx0 − 49.5, dy) scale(.9 1)` 放在 x≈73。
- 使用者截圖的放大倍率約 4 px／設計單位，「約 4px」≈ **往面向方向多 1 個設計單位**（請以預覽頁實際看起來對在眼睛正上方為準，可微調到 1–1.5 單位）。

## 建議做法
1. 側面眉毛中心往臉的前方（面向方向，也就是 +x）移動約 1 單位：例如 `browsSvg(true, 74, 0)`；小熊同步檢查（`browsSvg(true, 73, -4)`）。
2. 建議把偏移量做成 token 參數（例如 `character.rig.browSideShift: 1`），之後微調只改 json。
3. 面向左（`facing:'left'`）走鏡像，自動往左偏，不需另外處理；正面、背面不變。
4. 驚訝（`eyes:'wide'`）上抬 3 的規則不變；5 款眉毛 × 4 種臉型 × 各髮型（尤其旁分劉海、刺蝟頭、鮑伯頭）確認眉毛不被頭髮切掉、不跑出臉外。

## 驗收
- 側面（面向右／左）眉毛中心對在眼睛正上方；拍照匯出（`exportSVG`）一致。
- 版本號升一版（例如 1.0.1）並告知 App 端；App 端同步檔案、更新 `EXPECTED_GAME_TOKENS_VERSION`、跑工作室與賽跑回歸。
