# Handoff：demo-standalone.html 雙擊打開完全空白——`build-standalone-demo.mjs` 的「只有一份 JS/CSS」假設已經不成立

## 背景

使用者回報雙擊 `demo-standalone.html` 整頁空白，瀏覽器 DevTools Console 有 7 個紅字錯誤，截圖確認錯誤內容：

```
Access to script at 'file:///.../modulepreload-polyfill-B5Qt9EMX.js' from origin 'null' has been blocked by CORS policy...
Failed to load resource: net::ERR_FAILED   modulepreload-polyfill-B5Qt9EMX.js:1
Access to script at 'file:///.../gameBridge-DsWlonG_.js' from origin 'null' has been blocked by CORS policy...
Failed to load resource: net::ERR_FAILED   gameBridge-DsWlonG_.js:1
Access to script at 'file:///.../speech-DNC2BivM.js' from origin 'null' has been blocked by CORS policy...
Failed to load resource: net::ERR_FAILED   speech-DNC2BivM.js:1
```

這不是先前已知、刻意接受的「遊戲室 iframe 在單檔展示版裡顯示提示文字」那個限制（那個不影響其餘畫面），這次是**整個 App 完全沒有執行**，`<div id="app">` 一直是空的。

## 根因：多個 Vite 進入點之後，`speech.ts`／`gameBridge.ts` 被拆成共用 chunk，`build-standalone-demo.mjs` 沒有跟著更新

`app/vite.config.ts` 的 `rollupOptions.input` 目前有 5 個進入點：`main`（主站）、`voiceLab`、`memoryMatch`、`crossword`、`bubblePop`（遊戲室三款遊戲各自獨立的 iframe 頁面）。`app/src/speech.ts`（語音播放，全站共用）跟 `app/src/gameBridge.ts`（遊戲室 iframe 跟主站溝通用）同時被 `main.ts` 跟三款遊戲的 standalone 進入點一起 import：

```
$ grep -rln "from \"./speech\"\|from \"./gameBridge\"" src/*.ts src/games/*.ts
src/main.ts
src/games/bubblePopStandalone.ts
src/games/crosswordStandalone.ts
src/games/memoryMatchStandalone.ts
```

Rollup／Vite 建置多個進入點時，預設會把「被 2 個以上進入點一起 import 的模組」自動拆成獨立的共用 chunk（避免每個進入點各自重複打包一份），所以現在 `dist/index.html` 長這樣（第 16-19 行）：

```html
<script type="module" crossorigin src="./assets/main-Cvi894Ct.js"></script>
<link rel="modulepreload" crossorigin href="./assets/modulepreload-polyfill-B5Qt9EMX.js">
<link rel="modulepreload" crossorigin href="./assets/gameBridge-DsWlonG_.js">
<link rel="modulepreload" crossorigin href="./assets/speech-DNC2BivM.js">
<link rel="stylesheet" crossorigin href="./assets/main-DKeogTV2.css">
```

`main-Cvi894Ct.js` 裡面有真正的 `import ... from "./gameBridge-xxx.js"`／`import ... from "./speech-xxx.js"` 這種 ES module 靜態 import 陳述式，不是裝飾性的 modulepreload 而已——瀏覽器執行 `main.js` 時一定要能抓到這兩個檔案才能跑下去。

`app/scripts/build-standalone-demo.mjs` 目前的邏輯（第 21-22 行）：

```js
const scriptMatch = indexHtml.match(/<script[^>]*src="\.\/(assets\/[^"]+\.js)"/);
const cssMatch = indexHtml.match(/<link[^>]*href="\.\/(assets\/[^"]+\.css)"/);
```

只抓「第一個 `<script src>`」跟「第一個 `<link href>`」各一個，分別對應 `main-xxx.js`／`main-xxx.css`，完全沒有處理 `modulepreload` 這三個連結——這支腳本是在遊戲室架構出現、`speech.ts`／`gameBridge.ts` 變成共用 chunk 之前寫的，當時 `dist/index.html` 確實只有一份 JS 一份 CSS，這個假設在當時是對的，但遊戲室上線（`docs/archive/handoff-prompt-memory-match-iframe-migration.md`／`handoff-prompt-crossword-game.md`／`handoff-prompt-bubble-pop-game.md`）之後就不成立了，沒有人同步回來檢查這支腳本，所以 `demo-standalone.html` 從那之後雙擊打開其實就已經是空白的，只是沒有人發現（部署流程本身用的是 `npm run dev` 或正式網站，不會去雙擊這個檔案測試）。

## 建議修法：兩個方向都可行，風險/工作量不同

### 方向 A（建議）：改用 `vite-plugin-singlefile` 取代手寫的 `build-standalone-demo.mjs`

手動 regex 抓檔案這種做法沒辦法穩定處理「共用 chunk」「modulepreload」這類 Rollup 多進入點建置的細節，而且以後架構一變又會重演同樣的 bug。`vite-plugin-singlefile`（npm 上行之有年、維護中的社群套件）專門處理「把一個 Vite 進入點的所有 JS/CSS/chunk 都內嵌進單一 HTML」，會正確處理共用 chunk 的內嵌順序跟模組相依性，不會有這次的問題。

做法大致是：

1. `npm install -D vite-plugin-singlefile`（在 `app/` 底下）。
2. 另外開一份只有 `main` 單一進入點的 Vite 設定（例如 `vite.standalone.config.ts`，複製 `vite.config.ts` 但 `rollupOptions.input` 只留 `main: "index.html"`，不含 `voiceLab`／三款遊戲），掛上 `viteSingleFile()` plugin，輸出到獨立的 `dist-standalone/` 資料夾。
3. `build-standalone-demo.mjs` 改成直接讀 `dist-standalone/index.html`（這份已經是完整單檔，不用再自己拼接 JS/CSS），複製／改檔名存成 `demo-standalone.html`，前面那段手動抓 script/css 內容塞進 template 的邏輯可以整個刪掉，連同遊戲室 iframe 的 MutationObserver 補丁一起保留（那段還是需要，因為 standalone 版本本來就不含遊戲室三個 iframe 頁面）。
4. 更新 `README.md` 裡「情境插畫自動化生圖工具」附近如果有提到建置流程的地方（視現況决定要不要加一段簡短說明）。

這個方向的好處是以後不管 App 再加幾個共用模組、再加幾個進入點，這個 plugin 都會自動處理好，不會再發生這種「忘記同步腳本」的問題。

### 方向 B（較小改動，但不夠穩固）：手動把 `speech.ts`／`gameBridge.ts` 塞回 `main.js` 裡

在 `vite.config.ts` 的 `build.rollupOptions.output` 加 `manualChunks` 設定，強制這兩個模組不要被拆成獨立 chunk、直接打包進各自進入點自己的 bundle 裡（犧牲一點點檔案大小換來進入點之間互相獨立）。這個方向改動範圍小，但如果之後又加新的共用模組、或者 Rollup 版本升級改變預設拆分邏輯，有可能重蹈覆轍，沒有方向 A 來得穩固。

## 驗證

- 不管採用哪個方向，修完後都要**實際雙擊打開 `demo-standalone.html`**（不是跑 `npm run dev`）確認：
  - 開發人員工具 Console 乾淨無紅字錯誤。
  - 首頁／選主題／四種題型／成就徽章／語音朗讀都正常運作。
  - 遊戲室三款遊戲維持原本「顯示提示文字而非破圖」的已知行為（這部分不用變，只是這次連main.js 都沒執行所以看起來更嚴重，修好之後應該只剩遊戲室這個已知限制）。
- `npm run build`／全部 `verify-*.ts` 照常重跑一次確認沒有連帶影響正式站的建置結果（正式站一直是透過 http(s) 開啟，不受這個 file:// CORS 限制影響，這次修的純粹是 standalone 單檔展示版）。
