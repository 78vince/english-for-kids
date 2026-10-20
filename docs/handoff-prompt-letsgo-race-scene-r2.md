# Handoff：賽跑場景第二輪（game-tokens）

*撰寫：2026-10-12（App 端，依使用者回饋）｜執行對象：內容端 `assets/game-tokens/`｜App 端不改 token 繪圖與賽道資料（App 照 `GameTokens.race`、`GameArt.prop` 畫，資料改了 App 自動跟著變）*
*對照圖：同資料夾 `handoff-prompt-letsgo-race-scene-r2.flag.png`（裁判旗子，紅線＝希望的方向）、`…finish-star.png`（終點線上的六芒星，紅圈）、`…tree-highlight.png`（樹冠亮點，紅箭頭）*

App 端同一輪已完成（不需內容端處理）：結算畫面改版（拍照鈕移到右上角，下方依序「回選單、再賽一次、下一位對手」）、賽跑改用共用虛擬按鍵（A＝跳、B＝使用道具、↓＝蹲滑）。

## 使用者需求（原話整理）
1. **木頭物件樹皮的顏色加深**（賽道上的 `log`／`stump`；之前 `docs/handoff-prompt-letsgo-tree-trunk-color.md` 是樹幹，這次是木頭物件，可一起統一木頭類色票）。
2. **移除順風氣流物件** `windZone`：從 `race.stages[*].items` 拿掉；`effects.wind` 可保留或刪除；請用 `race-sim.js` 重新試算三場勝率（拿掉順風後玩家變慢，對手速度或 `targetTime` 可能要微調）。
3. **終點線中的六芒星符號移除**（`finishLine` 上的金色星形）。
4. **起點線與終點線重新設計：地上的黑白格線**（像賽車的方格旗格子，平鋪在地面上、跨過跑道；不要立起來的門）。建議：
   - `startGate`／`finishLine` 改為（或新增）貼地的格線道具，高度很低（約 10–16 單位），寬度約 24–32 單位、黑白兩列方格；`finishLine` 的 `broken` 狀態可改成格線旁冒出彩帶或保留空狀態。
   - 若需要旗桿或拱門，請另外做成可選道具；App 端目前會在起點畫 `startGate`、終點畫 `finishLine`（`x` 為左緣），尺寸讀 `size`。
5. **背景樹上的亮點移除**：場景 `forest` 樹冠上那個淺色圓形高光（mid／near 層的樹，以及 `tree` 道具），整個森林場景一起拿掉，工作室與賽跑共用。
6. **改變裁判手中旗幟的角度**：裁判（熊熊裁判 `race.referee.look`，`held:'flag'`）現在旗子斜向下指；使用者希望旗子往上舉（對照圖紅線方向：旗桿朝右上、旗面在上方）。若只想改裁判，可在 `race.referee` 加 `heldAngle`／`flagUp:true` 這類參數；若所有角色拿旗子都一起改也可以，請在 HANDOFF 說明。

## 驗收
- 預覽頁三場賽道排布：沒有順風帶；起點、終點是地上的黑白格線；終點沒有星形。
- 森林場景（白天／夜晚）樹冠沒有高光；樹幹與木頭物件顏色較深、跟地面分得開。
- 裁判 idle／wave／cheer／salute／victory 各姿勢旗子都朝上、不穿過頭和身體。
- `race-sim.js` 試算結果寫進企劃 §7；版本號升一版並告知 App 端；App 端同步檔案、更新 `EXPECTED_GAME_TOKENS_VERSION`，跑賽跑與工作室回歸。
