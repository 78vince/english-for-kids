// 產生 demo-standalone.html：把 dist/ build 出來的 JS/CSS 內嵌進單一 HTML 檔，
// 方便不想跑指令的人直接雙擊在瀏覽器打開試玩（不需要開發伺服器）。
// 用法：先 npm run build，再 node scripts/build-standalone-demo.mjs
//
// 注意：這只是方便試玩用的附屬產物，正式開發還是看 src/ 底下的原始檔，
// 這支 script 本身也不會被打包進正式 build。

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

// 不要用「掃 dist/assets 資料夾抓第一個 .js/.css」的方式找檔案——
// 因為這個開發沙盒的檔案系統偶爾無法清空 dist/（EPERM），vite.config.ts 裡
// 已經把 build.emptyOutDir 設成 false，舊的 hash 檔名可能會留在 dist/assets 裡，
// 掃資料夾會抓到不確定是新是舊的檔案。改成直接解析 dist/index.html 裡實際引用
// 的檔名，保證拿到「這次 build」真正產出的那一份。
const indexHtml = readFileSync(path.join(distDir, "index.html"), "utf-8");

const scriptMatch = indexHtml.match(/<script[^>]*src="\.\/(assets\/[^"]+\.js)"/);
const cssMatch = indexHtml.match(/<link[^>]*href="\.\/(assets\/[^"]+\.css)"/);

if (!scriptMatch || !cssMatch) {
  throw new Error("在 dist/index.html 裡找不到 JS/CSS 的引用，請先執行 npm run build");
}

const js = readFileSync(path.join(distDir, scriptMatch[1]), "utf-8");
const css = readFileSync(path.join(distDir, cssMatch[1]), "utf-8");

const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>每天玩一點 - English for Kids（單機示範版）</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
${js}
    </script>
    <script>
      // 2026-09-29：翻牌配對改成獨立 iframe 頁面（games/memory-match.html）架構之後，
      // 這支單檔展示版本沒辦法把 iframe 內容也一起塞進來（iframe 是獨立的 Vite 進入點，
      // 有自己的 JS/CSS bundle，不是這裡inline 的 main.js/main.css 的一部分；iframe 的
      // src 是相對路徑，單獨打開這個 HTML 檔案時旁邊沒有 dist/games/ 資料夾可以載入）。
      // 與其讓使用者看到空白或壞掉的 iframe，這裡用 MutationObserver 偵測遊戲室的
      // .game-iframe 元素一出現就換成一段說明文字，並保留主站真正部署時 iframe 仍會
      // 正常運作（這段 patch 只存在於這支單檔展示版本，不影響 dist/index.html 本身）。
      (function () {
        var patched = false;
        var observer = new MutationObserver(function () {
          if (patched) return;
          var iframe = document.querySelector(".game-iframe");
          if (!iframe) return;
          patched = true;
          var notice = document.createElement("p");
          notice.className = "hint";
          notice.style.textAlign = "center";
          notice.style.marginTop = "24px";
          notice.textContent = "遊戲室功能在這個單檔展示版本暫不支援，請用正式站測試。";
          iframe.replaceWith(notice);
        });
        observer.observe(document.body, { childList: true, subtree: true });
      })();
    </script>
  </body>
</html>
`;

writeFileSync(path.join(__dirname, "..", "demo-standalone.html"), html, "utf-8");
console.log("已產生 app/demo-standalone.html");
