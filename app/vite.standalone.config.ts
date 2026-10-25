import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// 2026-10-03：專門給 scripts/build-standalone-demo.mjs 用的獨立 Vite 設定，
// 跟 vite.config.ts（正式站多進入點 build）分開，不要共用同一份設定。
//
// 背景（見 docs/handoff-prompt-standalone-demo-chunk-split-bug.md）：遊戲室三款
// 獨立 iframe 遊戲上線後，vite.config.ts 的 rollupOptions.input 變成 5 個進入點，
// Rollup 預設會把「被 2 個以上進入點一起 import 的模組」（speech.ts／gameBridge.ts）
// 自動拆成獨立的共用 chunk，連同 modulepreload-polyfill 一起變成 dist/index.html 裡
// 好幾個 <script>/<link> 而不是原本假設的「只有一份 main.js/main.css」。
// build-standalone-demo.mjs 原本手動 regex 抓「第一個 script/css」塞進單一 HTML 的
// 做法沒辦法處理這種多檔案情境，造成 demo-standalone.html 雙擊打開時瀏覽器找不到
// file:// 相對路徑的共用 chunk（CORS 擋掉），整頁空白。
//
// 這份設定只建構 main 單一進入點（不含 voiceLab／三款遊戲——那幾個本來就是獨立的
// iframe 頁面，standalone 單檔展示版本原本就不支援，見 build-standalone-demo.mjs
// 裡的 MutationObserver 補丁），掛上 vite-plugin-singlefile，讓 Rollup/Vite 自己
// 把所有 JS/CSS/共用 chunk 正確內嵌進一份完整的單檔 index.html，不用再手動 regex
// 猜檔案名稱、也不會因為以後又加新的共用模組/進入點而重演這個 bug。
export default defineConfig({
  // 單檔版沒有 games/*.html，「我的角色」整頁遊戲的入口要隱藏（main.ts 讀這個旗標）
  define: {
    __STANDALONE__: JSON.stringify(true),
    __LAB__: JSON.stringify(false),
  },
  base: "./",
  server: {
    fs: {
      allow: [".."],
    },
  },
  build: {
    outDir: "dist-standalone",
    emptyOutDir: true,
    // 跟 vite.config.ts 同樣的理由：小型素材（頭像／音效／徽章圖）要能被 inline 成
    // base64，不能被當成獨立檔案輸出，不然單檔展示版本會看不到圖/聽不到聲音。
    assetsInlineLimit: 200000,
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
  plugins: [viteSingleFile()],
});
