# Handoff：臉型與眉毛選項（工作室「臉」分類）

*撰寫：2026-10-12（內容端）｜執行對象：`English for Kids LetsGo/app`｜只改新專案｜前置：`assets/game-tokens/` 更新到 **v1.0.0**（`game-tokens.json/js/css`、`game-character.js`），`EXPECTED_GAME_TOKENS_VERSION` 改 1.0.0*

## 改了什麼（token 端已完成）
- 新增 `GameArt.options.faceShape`：`round`／`square`／`oval`／`pointed`；`options.brows`：`none`／`thin`／`thick`／`arch`／`sharp`。中文名稱在 `options.optionLabels`（圓臉、方臉、橢圓臉、瓜子臉；無／細眉、粗眉、彎眉、劍眉；「none」顯示為「沒有」）。
- `look` 多兩個欄位 `faceShape`、`brows`；缺欄位（舊存檔）時繪製端用預設（圓臉、無眉毛），App 不需遷移，`normalizeLook()` 補預設值即可。
- 脖子已移除、臉頰回復、髮型更新（v0.9：移除 puff／ponytail／bun／long，新增 buzz／sidepart／spiky；`legacy` 已對應）。

## App 端工作
1. 「臉」分類新增兩區：**臉型**（4 款）、**眉毛**（5 款，含「沒有」）。縮圖用 `thumbLook()`（正面、無配件、無手持物、`pose:null`），臉型縮圖建議用 `GameArt.avatar(look, size)` 以看得清楚；眉毛縮圖同。選項讀 token，不要寫死清單；中文名稱優先讀 `optionLabels`，找不到才用內建 `NAMES`，再找不到顯示 id。
2. 套用即時、可復原／重做、存檔（`levelUnitReview.character.v1`）與同步不變；隨機鈕改用 `GameArt.randomLook()`（已含臉型、眉毛；小熊維持原本處理）。
3. 小熊：臉型選項不影響小熊（可隱藏或停用臉型區），眉毛對小熊有效。
4. 預設角色（9 組）已帶臉型／眉毛；既有使用者的角色不變（缺欄位＝圓臉、無眉毛）。

## 驗收
- 4 種臉型 × 正／側／背視角、搭配各髮型與眼鏡／帽子／耳機都沒有穿幫（拍照匯出一致）。
- 眉毛 5 款在正／側面正確；驚訝動作（`surprise`）眉毛上抬；背面不畫。
- 舊存檔載入後外觀不變；新增欄位寫入並同步；`prefers-reduced-motion`、390／820 版面正常。
