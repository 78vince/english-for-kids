import { defineConfig } from "vite";
import { gamePageInputs } from "./gamePages";

// 遊戲實驗室（docs/GAME-PRODUCTION-SPEC.md §2）：給開發／測試用的獨立入口。
// - npm run lab：開發伺服器（http://<電腦IP>:5190/lab.html，平板可連，存檔即時更新）
// - npm run build:lab：建置到 dist-lab/（跟孩子用的 dist/ 分開）
// 跟孩子用的 App 的差別：__LAB__＝true → 開發中的遊戲也會出現在遊戲室、不跟區網電腦同步；
// 另外用不同的 port，瀏覽器的資料（localStorage）跟 App 完全分開。
export default defineConfig({
  define: {
    __STANDALONE__: JSON.stringify(false),
    __LAB__: JSON.stringify(true),
  },
  base: "./",
  plugins: [
    {
      name: "lab-html-transform",
      transformIndexHtml(html) {
        return html.replace(/<head>/i, `<head><script>window.__LAB__ = true;</script>`);
      },
    },
  ],
  server: {
    host: true,
    port: 5190,
    strictPort: true,
    open: "/lab.html",
    fs: {
      allow: [".."],
    },
    watch: {
      ignored: ["!**/content/**"],
    },
  },
  preview: {
    host: true,
    port: 5190,
    strictPort: true,
  },
  build: {
    outDir: "dist-lab",
    emptyOutDir: true,
    assetsInlineLimit: 200000,
    rollupOptions: {
      input: {
        main: "index.html",
        lab: "lab.html",
        layoutDemo: "layout-demo.html",
        ...gamePageInputs({ lab: true }),
      },
    },
  },
});
