# Handoff：樹幹顏色加深（game-tokens）

*撰寫：2026-10-11（App 端，依使用者回饋）｜執行對象：內容端 `assets/game-tokens/`｜App 端不改 token 演算法*

## 需求
使用者看工作室森林場景時回報：**樹幹物件的皮顏色要加深**（目前樹幹跟土色路面、背景太接近，不夠分明）。

## 現況
- `game-props.js` 的 `P.tree`、`pine`、`maple`、`cherry`、`palm` 樹幹都用 `hue('wood')`（base），樹幹側面的深色條紋用 `hue('wood','ledge')`。
- 場景（`game-scene.js`）的 mid／near 樹木也走同一批道具。

## 建議做法（由內容端決定細節）
1. 樹幹本體改用較深的木色（例如 `hue('wood','deep')` 或在 `color` 新增 `bark` 色票），側面條紋再深一階；樹冠與其他木製道具（告示牌、木頭 `log`、樹墩 `stump`、板凳）可維持原色，或一起調整讓木頭類一致。
2. 夜晚濾鏡套上後仍要看得出樹幹輪廓。
3. 對比檢查照 `build-tokens.py` 規則；改完跑 `build-tokens.py`、`build-preview.py`，版本號升一版並告知 App 端同步。

## 驗收
- 森林白天／夜晚截圖：樹幹比目前明顯深，跟土色地面、背景遠山分得開。
- 拍照匯出（`exportSVG`）與舞台一致。
