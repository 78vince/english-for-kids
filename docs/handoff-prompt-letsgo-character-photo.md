# Handoff 3/3：拍照（截圖）、相簿、頭像

*撰寫：2026-10-08（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜只改新專案｜前置：Handoff 1、2*
*企劃：`docs/plan-game-level1-character-studio.md` §9*

## 決議
拍照**不截螢幕**：把目前舞台狀態交給 `GameArt.exportSVG(opts)` 重組成單一 SVG（CSS 變數與夜晚濾鏡已展開），再用 `GameArt.exportPNG(opts)` 轉成 PNG。畫質與裝置解析度無關。內容端維護這兩個函式；App 端只組 `opts`、顯示、存檔。預覽頁「角色 × 場景」的「拍照」鈕是可運作的範例（`preview.src.html` 的 `btnShot`）。

## opts（皆已實作）
`scene`、`u`（時間軸）、`aspect`（`16:9`＝1920×1080、`1:1`＝1080×1080、`4:5`＝1080×1350）、`look`、`pose`、`t`、`view`、`facing`、`charX`（預設 .5）、`charH`（預設 .42）、`feetY`（預設 .88）、`shift`（背景位移，單位＝畫面寬，= 舞台 offset / 舞台寬）、`props:[{id,x,state,h,front}]`（把場景裡的互動物件一併拍進去）。

## 要做的事
1. **拍照流程**：相機鈕 → 3-2-1 倒數（可跳過）→ 角色**定格**目前動作 → 快門白閃＋「喀嚓」音效（可在設定關閉）→ 預覽彈窗：再拍／儲存／下載／刪除。比例選擇（三種）記住上次選擇；舞台上顯示取景框。
2. **儲存**：一期 IndexedDB（本機，存 PNG blob＋縮圖＋metadata `{id, slot, sceneId, time, aspect, createdAt}`）＋「下載到裝置」（`<a download>`，檔名 `photo-YYYYMMDD-HHMM.png`）。上限 50 張／人，超過需先刪舊的（提示簡短）。區網 http 下不依賴 Web Share／crypto；有支援 Web Share 的裝置才顯示分享鈕。
3. **相簿分頁**（工作室第四分頁）：縮圖格、點開大圖、刪除（二次確認）、設為角色封面。
4. **統計與獎勵**：寫入 `character.stats`（`photos` 累計、`scenesShot` 記 `sceneId:day|night`），觸發首次拍照代幣與徽章（見 Handoff 2）。
5. **頭像**：`GameArt.avatar(look, size)` 回傳 SVG；個人檔案與各關卡右上角使用；圓形遮罩由 CSS 處理。
6. **二期（本次不做，預留）**：相框與貼紙（貼紙用 token icon）、日期戳記、伺服器相簿 `POST/GET/DELETE /api/photos`（`learning-data/photos/<profileId>/`，縮圖＋原圖，納入每日備份）。資料結構先保留 `storage: 'local'|'server'` 欄位。
7. **驗證**：三種比例輸出尺寸正確；夜晚時角色亮度與畫面一致（夜晚濾鏡）；太陽顏色與當下時間一致；`shift` 位移後背景與舞台所見相同；相簿刪除後容量釋放；iPad Safari 與 Android Chrome 都能下載；全程無外部網路請求；照片內不含任何個資或相機影像。
8. 若 `exportPNG` 在某瀏覽器失敗（例如巢狀 SVG 光柵化問題），**回報內容端**附上瀏覽器版本與 `exportSVG` 輸出，由內容端調整，App 端不要自行改函式。在新專案 HANDOFF 記錄。
