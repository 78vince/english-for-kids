# Handoff：使用者密碼鎖（測試帳號 Vicnent）

*撰寫：2026-10-08（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜只改新專案*

## 目標
使用者清單中有一個測試用帳號（使用者拼成 “Vicnent”，可能是 “Vincent” 的筆誤）。為其加上密碼，避免孩子登入。密碼不寫進任何檔案明文；僅提供 PBKDF2 雜湊。

## 要做的事
1. **比對對象**：請先檢查實際儲存的使用者名稱。名稱（去空白、不分大小寫）為 `vicnent` 或 `vincent` 的使用者視為鎖定；回報實際名稱給內容端。設計成設定檔 `server/locked-profiles.json`（可擴充，不進前端 bundle）：
```json
{ "profiles": [ { "names": ["vicnent", "vincent"], "kdf": "pbkdf2-sha256", "iterations": 210000,
  "salt": "22022f13207dd6a8ef0846b064acf621",
  "hash": "891faf247e49fdce7ac16003e6ac4dd6baee139351a453dfd6849986716b2bb8" } ] }
```
2. **驗證在伺服器端**（`server/server.mjs`）：區網為 http，瀏覽器沒有 `crypto.subtle`，不要在前端驗證。新增 `POST /api/unlock { profileName, password }` → 用 `crypto.pbkdf2Sync(password, Buffer.from(salt,'hex'), iterations, 32, 'sha256')` 以 `timingSafeEqual` 比對，回 `{ok:true}`／`{ok:false}`。
3. **鎖定邏輯**：連續錯 5 次，該使用者鎖 30 秒（伺服器端依使用者計；重啟可重置）。回應不透露雜湊。
4. **前端**：選擇使用者畫面中，受保護使用者顯示鎖頭圖示；點選後出現數字輸入（6 位、`inputmode="numeric"`、密碼遮罩），驗證成功才切換。解鎖狀態存 `sessionStorage`（關閉分頁即失效），不同步。
5. **同步資料也要擋**：`GET /api/sync` 目前會回傳全部使用者資料；此為「軟鎖」（防孩子誤用），可接受，請在 HANDOFF 註明不是安全邊界。單機版（standalone／dev、無伺服器）時，該使用者在清單中隱藏。
6. 驗證：密碼對／錯／連錯鎖定、切換使用者後需重新輸入、其他使用者不受影響、全專案 grep 不得出現明文密碼。
