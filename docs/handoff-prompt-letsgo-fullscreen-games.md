# Handoff：填字、戳泡泡改為全螢幕頁面（不用 iframe）

*撰寫：2026-10-08（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜只改新專案*

## 決議
遊戲室的遊戲改為**同視窗導航到整頁遊戲**（`games/<game>.html`），不再內嵌 iframe；PWA standalone（加入主畫面）下仍全螢幕。之後的平台遊戲沿用同一框架。

## 要做的事
1. 進入遊戲：先扣代幣並**立即 flush** 同步佇列（server-sync 的 storage），再 `location.assign`。遊戲頁自帶左上角「返回」鈕（圓角 44px 以上點擊區）與暫停選單；返回時 `location.assign` 回主頁，主頁啟動時重新 hydrate，確保代幣／高分／徽章統計不被舊快取蓋掉。
2. 遊戲頁：`<meta viewport viewport-fit=cover>`、`touch-action:none`、`env(safe-area-inset-*)`、禁止選取與長按選單；橫放偏好時顯示「請橫放裝置」提示（不強制）。首次點擊可嘗試 Fullscreen API（失敗靜默）。
3. 取消 `gameBridge` / postMessage 依賴：遊戲頁直接使用 `storage.ts` 與共用模組寫入結果（完成回合、`finalizeRoundCompletion` 等）；移除 iframe 容器與相關樣式。
4. 結果畫面保留「再玩一次」「回遊戲室」。
5. 驗證：手機 390px、平板 820px（直／橫）；返回後代幣與高分正確；另一台設備看到相同數值；單檔版／dev 模式退回 localStorage 仍可運作。
6. 在新專案 HANDOFF 記錄；回報任何需要內容端配合的事。
