import { defineConfig } from "vite";

// content/ 放在 app/ 外面（跟 docs/ 平行），是內容的 single source of truth。
// 開發環境下 Vite 預設不允許存取專案根目錄以外的檔案，這裡放行給 ../content 使用。
export default defineConfig({
  base: "./", // 相對路徑輸出，方便未來部署到 GitHub Pages 的專案子路徑
  server: {
    fs: {
      allow: [".."],
    },
  },
  build: {
    outDir: "dist",
    // 開發沙盒環境下，重新清空 dist/ 偶爾會遇到檔案權限問題，關掉自動清空。
    // dist/ 本來就在 .gitignore 內，需要乾淨結果時手動刪除 dist/ 再 build 即可。
    emptyOutDir: false,
    // demo-standalone.html 是把 dist/index.html 參照的 JS/CSS 內容抓出來塞進單一 HTML 檔，
    // 不會另外複製 dist/assets/ 底下獨立產生的檔案——所以像使用者頭像、音效、成就徽章圖這種
    // 小型素材，一定要能被 inline 成 base64 塞進 JS/CSS 本身，不能被當成獨立檔案輸出，
    // 不然 standalone 版本會看不到圖/聽不到聲音。頭像縮圖跟徽章縮圖都在 15KB 以內，
    // 音效 WAV 檔最大約 77KB（一輪完成的歡呼音效），「關於本站」底部裝飾圖約 143KB
    // （2026-08-26 新增，是目前最大的素材），這裡把門檻拉高到 200KB 確保全部都會被 inline
    // （含未來新增的頭像、音效、徽章圖或裝飾圖，只要維持在這個門檻以內就好；如果之後又加了
    // 更大的素材，記得同步調高這個數字，不然又會重演「standalone 版本看不到圖」的問題）。
    assetsInlineLimit: 200000,
  },
});
