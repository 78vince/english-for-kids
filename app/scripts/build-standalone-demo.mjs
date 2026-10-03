// 產生 demo-standalone.html：把 App 打包成單一 HTML 檔，方便不想跑指令的人直接雙擊
// 在瀏覽器打開試玩（不需要開發伺服器）。
// 用法：先 npm run build:standalone（會用 vite.standalone.config.ts 建置到
// dist-standalone/），再 node scripts/build-standalone-demo.mjs
//
// 注意：這只是方便試玩用的附屬產物，正式開發還是看 src/ 底下的原始檔，
// 這支 script 本身也不會被打包進正式 build。
//
// 2026-10-03 改版（見 docs/handoff-prompt-standalone-demo-chunk-split-bug.md）：
// 原本這支腳本是手動 regex 從 dist/index.html 抓「第一個 <script src>」跟「第一個
// <link href>」各一個，假設整個 App 只有一份 JS、一份 CSS。遊戲室三款獨立 iframe
// 遊戲上線後，vite.config.ts 變成 5 個進入點，Rollup 把 speech.ts／gameBridge.ts
// 這兩個被多個進入點一起 import 的共用模組拆成獨立 chunk，連同 modulepreload-polyfill
// 一起讓 dist/index.html 變成好幾個 <script>/<link>，這支腳本的「只抓第一個」假設
// 從那之後就不成立了——雙擊打開 demo-standalone.html 會因為 file:// 協定下載不到
// 那些共用 chunk（CORS 擋掉）整頁空白，卻沒有人發現（部署流程本身不會雙擊這個檔案
// 測試）。
//
// 改法：不再自己手動拼接 JS/CSS，改成讀取 vite-plugin-singlefile 建置出來的
// dist-standalone/index.html——這份本身就已經是 Rollup/Vite 正確處理過共用 chunk／
// 模組相依性之後內嵌出來的完整單檔，只需要做兩件事：(1) 拿掉 favicon/manifest 這類
// 指向外部檔案的 <link>（demo-standalone.html 放在專案根目錄，旁邊沒有 dist-standalone/
// 的 icons/ 資料夾，留著這些連結會在 file:// 開啟時變成 404，在 DevTools Console 跳出
// 紅字錯誤）；(2) 補回遊戲室 iframe 的 MutationObserver 補丁（這份 standalone 單檔
// 展示版本本來就不含三款遊戲獨立 iframe 頁面的 JS/CSS，見補丁註解）。

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const standaloneDistDir = path.join(__dirname, "..", "dist-standalone");
const indexHtmlPath = path.join(standaloneDistDir, "index.html");

let html;
try {
  html = readFileSync(indexHtmlPath, "utf-8");
} catch {
  throw new Error(
    "找不到 dist-standalone/index.html，請先執行 npm run build:standalone（用 vite.standalone.config.ts 建置單一進入點＋vite-plugin-singlefile 內嵌）"
  );
}

// 拿掉指向外部檔案的 favicon/manifest <link>——這些檔案只存在於 dist-standalone/
// 旁邊（icons/、manifest.webmanifest 等），demo-standalone.html 是放在專案根目錄，
// 沒有把這些檔案一起複製過去，留著會在雙擊開啟時變成 404，在 DevTools Console
// 顯示紅字錯誤（跟這次修的 bug 同一種「console 不乾淨」症頭，不該留下新的一種）。
// App 功能本身不依賴這些 link（favicon／PWA manifest 純粹是瀏覽器裝飾用），拿掉
// 不影響試玩體驗。
html = html.replace(/\s*<link rel="icon"[^>]*>\n/g, "\n");
html = html.replace(/\s*<link rel="apple-touch-icon"[^>]*>\n/g, "\n");
html = html.replace(/\s*<link rel="manifest"[^>]*>\n/g, "\n");

// 標題加上「（單機示範版）」區分，避免跟正式站搞混（沿用改版前的既有做法）。
html = html.replace(
  /<title>([^<]*)<\/title>/,
  (_match, titleText) => `<title>${titleText}（單機示範版）</title>`
);

const gameRoomIframePatch = `
    <script>
      // 2026-09-29：翻牌配對改成獨立 iframe 頁面（games/memory-match.html）架構之後，
      // 這支單檔展示版本沒辦法把 iframe 內容也一起塞進來（iframe 是獨立的 Vite 進入點，
      // 有自己的 JS/CSS bundle，不是這裡 inline 進單一 HTML 的 main 進入點的一部分；
      // iframe 的 src 是相對路徑，單獨打開這個 HTML 檔案時旁邊沒有 dist/games/ 資料夾
      // 可以載入）。與其讓使用者看到空白或壞掉的 iframe，這裡用 MutationObserver 偵測
      // 遊戲室的 .game-iframe 元素一出現就換成一段說明文字，並保留主站真正部署時
      // iframe 仍會正常運作（這段 patch 只存在於這支單檔展示版本，不影響正式站）。
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
  </body>`;

if (!html.includes("</body>")) {
  throw new Error("dist-standalone/index.html 裡找不到 </body>，無法插入遊戲室 iframe 補丁");
}
html = html.replace(/\s*<\/body>/, gameRoomIframePatch);

writeFileSync(path.join(__dirname, "..", "demo-standalone.html"), html, "utf-8");
console.log("已產生 app/demo-standalone.html");
