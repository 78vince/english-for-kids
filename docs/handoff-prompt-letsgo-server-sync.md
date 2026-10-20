# Handoff：學習紀錄存到電腦（區網伺服器同步）

*撰寫：2026-10-05（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）*
*只改新專案；不要動原專案。內容端的 `content/` 檔案不需要修改。*

## 1. 目標與決議（使用者已確認）

學習紀錄目前存在各設備瀏覽器的 localStorage，綁定網址：換設備、換 IP、清除瀏覽器資料就消失，兩台平板也無法接續。改為：**紀錄存在這台電腦上，區網內任一設備登入同一個使用者，紀錄都延續**。

已確認的預設：
- 第一次同步時，若兩邊都有資料 → **以較新者為準**，被取代的版本另存備份，不丟資料。
- 兩台設備同時使用同一個使用者 → **後寫入者為準**（不做即時合併）。
- 電腦端自動保留**最近 14 天**的每日備份。
- localStorage 保留當快取，電腦沒開或斷線時照常使用、恢復後補傳。
- 區網內不設密碼（家用）；不對外網開放。

## 2. 伺服器（新增 `server/server.mjs`，Node ≥ 18，**不新增 npm 套件**）

1. 取代現在 `vite preview` 的角色：提供 `app/dist/` 靜態檔案（正確 MIME，含 `games/*.html`、`icons/`、`manifest.webmanifest`），監聽 `0.0.0.0:5180`，`--strictPort` 行為不變（port 被占用就明確報錯結束）。
2. API（同源，不需要 CORS）：
   - `GET /api/sync` → 回傳全部紀錄 `{ "<localStorage key>": { "v": "<字串值>", "t": <毫秒時間戳> }, ... }`。
   - `POST /api/sync` → body：`{ deviceId, changes: { "<key>": { "v": ..., "t": ... } } }`；對每個 key 比較 `t`，**較新者勝**（`t` 相同則視為相同、不覆寫）；被覆蓋的舊值寫入 `learning-data/conflicts/<時間>-<key>.json`（只在「舊值非空且與新值不同」時）。回傳合併後的最新值給客戶端（讓客戶端更新快取）。
   - `GET /api/health` → `{ ok: true, time }`（客戶端用來判斷連線）。
3. **安全與穩健**：只接受以 `levelUnitReview.` 開頭、且在「同步 key 清單」（見 §3）內的 key；單次請求 body 上限 5 MB；key 不會被拿來組檔案路徑（所有資料存在單一 JSON）；非法請求回 4xx，不得讓伺服器崩潰。
4. **儲存**：`learning-data/store.json`（key → `{v,t}`）。寫入一律「先寫暫存檔再 rename」，避免寫到一半斷電造成損毀；啟動時若 `store.json` 損毀，嘗試從最新的每日備份還原並在終端機印出警告。每天第一次寫入時複製成 `learning-data/backups/store-YYYY-MM-DD.json`，保留最近 14 份。
5. `learning-data/` 加進 `.gitignore`（不進 git）。
6. 修改 `區網啟動.command`：build 後改用 `node server/server.mjs`；保留原有 IP 偵測、`.last-ip` 變動警告與等待確認的流程；終端機印出「學習紀錄存放於：<絕對路徑>」。

## 3. 前端儲存層（新增 `src/storage.ts`，取代各處直接呼叫 localStorage）

目前 32 處直接讀寫 localStorage（`profile.ts`、`progress.ts`、`favorites.ts`、`playLog.ts`、`playTime.ts`、`badgeStats.ts`、`points.ts`、`gameTokens.ts`、`gameHighScores.ts`、`gameBridge.ts`、`speech.ts`、`badgeRules.ts`、`main.ts`）。要求：

1. 建立 `appStorage.getItem / setItem / removeItem`，介面與 localStorage 相同（**同步讀取**，從記憶體快取讀），把上述所有呼叫改過去。
2. **同步 key 清單（跟著電腦走）**：`profiles`、`progress`、`favorites`、`playLog`、`playTime`、`badgeStats`、`gameTokens`、`gameHighScores`（連同它們後面的 `.v1.<profileId>` 等後綴，以前綴比對）。
3. **只留在設備上、不同步**：`activeProfileId`（每台設備各自選自己的使用者）、`settings.*`（語音、慢速、練習模式、歡迎提示）、`gameBridge.*`（暫時訊息）。這些仍直接用 localStorage。
4. **啟動流程**：App 啟動時（渲染第一個畫面前）先 `GET /api/sync`（逾時 2 秒），把結果合併進本機快取與 localStorage：
   - 每個 key 以 `t` 較新者為準。
   - **第一次連線**（本機沒有 `levelUnitReview.sync.deviceId` / 尚未同步過）：把本機既有資料一併 `POST` 上去，走同樣的「較新者勝＋舊值進 conflicts」規則——**平板現有的學習紀錄一筆都不能丟**。
   - 連不上伺服器：直接用本機快取繼續，不報錯。
5. **寫入**：`setItem` 先寫本機快取與 localStorage，再把變更放進送出佇列；以 300–500 ms debounce 批次 `POST`。佇列持久化在 `levelUnitReview.sync.pending`，失敗（離線）時保留，之後以重試（連線恢復、頁面重新可見、每 30 秒）補傳。
6. **時間戳**：`t` 用寫入當下的 `Date.now()`；為避免設備時鐘差異造成誤判，伺服器回傳時帶上 `serverTime`，客戶端記錄與本機的差值並在送出前校正。
7. **遊戲 iframe**（填字、戳泡泡）：同源，但是獨立的 JS 環境。遊戲頁也使用 `storage.ts`（啟動時 hydrate、寫入走同一個佇列）；遊戲關閉後，主頁要重新讀取（或 hydrate）一次，避免快取舊值覆蓋遊戲寫入的代幣與高分。請特別驗證代幣與高分不會被舊快取蓋掉。
8. **同步狀態**：在適當位置（例如頁尾或個人檔案頁）顯示一個低調的狀態：「已同步到電腦」「離線中，稍後自動同步」「無法連線」；不要用彈窗打擾孩子。
9. **單檔版與開發模式**：`build:standalone`（`__STANDALONE__`）與 `npm run dev` 沒有 `/api`，必須自動退回「只用 localStorage」，行為與現在相同，不報錯。

## 4. 文件

- 新專案 `README.md`、`HANDOFF.md`：新增「學習紀錄存放與備份」一節——紀錄位置（`learning-data/`）、每日備份與 conflicts 資料夾說明、如何手動還原、**請將 `learning-data/` 納入你的備份**。
- 修訂既有「固定 IP 規則」：IP 變動**不再讓紀錄歸零**（紀錄在電腦上），平板只需改用新網址；但仍建議固定 IP，因為主畫面圖示與書籤會依賴網址。啟動腳本的 IP 變動警告文字同步修改，語氣由「紀錄會歸零」改為「平板網址會改變」。
- 說明安全邊界：不要把 5180 對外網開放（路由器不要做連接埠轉發）。

## 5. 驗證

1. `npm run build`、`npm run build:standalone` 與全部 verify 腳本通過；新增 `server` 的自動測試（可用 `node:test`，不新增套件）：較新者勝、舊值進 conflicts、非法 key 被拒、body 過大被拒、store.json 損毀時從備份還原、每日備份保留 14 份。
2. Playwright 雙設備情境（兩個 browser context 模擬兩台平板）：
   - A 玩完一輪 → B 重新整理後看到同一個使用者的進度、星等、徽章。
   - **遷移**：先用舊版（localStorage 內有紀錄）開啟 → 升級後第一次連線，紀錄上傳到電腦、不遺失。
   - 兩邊都有不同資料時，較新者保留，另一份出現在 `learning-data/conflicts/`。
3. 離線情境：關掉伺服器 → 繼續答題（正常、狀態顯示離線）→ 重啟伺服器 → 自動補傳，電腦端資料更新。
4. 遊戲 iframe：玩一輪填字／戳泡泡後，代幣與高分在主頁、重新整理、另一台設備上都一致。
5. 單檔版以 file:// 開啟與 `npm run dev` 皆正常（退回 localStorage）。
6. 區網啟動腳本實測（含 IP 變動警告流程）；在 HANDOFF 記錄結果、未完成項目、以及 `learning-data/` 的實際結構。
7. 全專案 grep：不得出現教材書名／出版社名。
8. 回報任何需要內容端配合的事（預計沒有）。
