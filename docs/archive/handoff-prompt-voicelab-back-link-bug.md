# Handoff：Voice Lab「返回學習主站」連結失效（絕對路徑 vs. GitHub Pages 子路徑）

## 問題

使用者回報：在正式站進入「語音比較實驗室 (Voice Lab)」（`/voice-lab.html`）後，沒辦法返回平台首頁。

## 根因

`app/src/voiceLab.ts` 第 212 行：

```ts
<a href="/" class="lab-back-btn">← 返回學習主站</a>
```

`href="/"` 是絕對路徑，會導到網站所在網域的**根目錄**。但正式站是部署在 GitHub Pages 的專案子路徑 `https://78vince.github.io/english-for-kids/`，不是網域根目錄，所以點下去會被導到 `https://78vince.github.io/`（帳號的 GitHub Pages 根頁面，不是這個學習平台），等於連結失效。

`vite.config.ts` 第 6 行本來就特別設定 `base: "./"` 並註明「相對路徑輸出，方便未來部署到 GitHub Pages 的專案子路徑」——`voiceLab.ts` 這個連結沒有遵守這個既有的相對路徑慣例，是純粹的疏漏。

## 修法

```ts
<a href="index.html" class="lab-back-btn">← 返回學習主站</a>
```

用相對於當前頁面的 `index.html`（`voice-lab.html` 打包後跟 `index.html` 在同一層目錄），不用 `href="/"` 也不用 `href="./"`（`./` 在某些情況下可能因為結尾斜線/目錄層級解讀不同而有歧義，直接指名 `index.html` 最明確、不會猜錯）。

## 驗證

建議在既有的 `verify-app-icon-manifest.ts`（已經在做「確認路徑有正確被 Vite `base: "./"` 改寫成相對路徑」這類檢查）附近，或新增一支簡短驗證，用字串比對確認 `voiceLab.ts` 裡這個連結是 `href="index.html"`，不是 `href="/"`。

`npm run build` 後，檢查 `dist/voice-lab.html` 打包出來的連結確實是相對路徑；如果方便的話，用 `npx serve dist` 之類的方式模擬部署在子路徑的情境（或直接等正式站更新後在手機/電腦上實測）點一次「返回學習主站」確認真的能回到首頁。
