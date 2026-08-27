// 這支 script 原本想用 jsdom 載入 build 出來的 dist/index.html 並模擬點擊，
// 做真正的瀏覽器端對端驗證。實測發現 jsdom 不支援執行 <script type="module">，
// 而這個開發沙盒又沒有網路可以下載 Playwright 的瀏覽器執行檔，所以無法在這裡做到。
//
// 目前的驗證方式退而求其次：
// 1. scripts/verify-matching-logic.ts 直接跑 MatchingGame 的真實邏輯（跟正式程式同一份 class），
//    讀取真正的 content/vocab/family.json，模擬跑完整輪含答錯/答對分支。
// 2. `npm run build` 確認型別檢查與打包都過，並用 grep 確認 bundle 裡真的包含 family.json 的資料
//    （例如 "voc.family.001"、"阿姨"），代表 content -> 型別 -> 遊戲邏輯 -> DOM 這條串接沒有斷掉。
//
// 若之後要在有網路權限的環境（例如本機或 CI）補真正的瀏覽器 E2E 測試，可以參考：
//   npm install -D @playwright/test
//   npx playwright install chromium
//   然後用 playwright 開這個專案 build 出來的 dist/index.html，模擬點擊 .card 按鈕。
