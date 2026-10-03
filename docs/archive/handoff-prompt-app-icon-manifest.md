# Handoff Prompt：加入主畫面／安裝應用程式時顯示固定 App 圖示

## 背景

使用者問「把網頁做成桌面應用程式時，可以有固定的 icon 嗎？」——目前 `app/index.html` 完全沒有 favicon／`apple-touch-icon`／web app manifest，所以 iOS Safari「加入主畫面」或 Chrome「安裝應用程式」時，系統只能拿網頁截圖或系統預設圖示頂替，不會有一致的品牌圖示。

已經設計好圖示美術（字母 K 怪獸，跟徽章系列同一套羊毛氈／黏土手作風格，但改用滿版純色背景＋安全邊界，符合 App 圖示的呈現方式，不是徽章那種白底留白的做法），並且**已經處理好全部尺寸的檔案，直接放進 `app/public/`**（Vite 預設會把 `public/` 底下的檔案原封不動複製到 `dist/` 根目錄）：

```
app/public/
├── favicon.ico              （16/32/48 多尺寸，瀏覽器分頁圖示用）
├── apple-touch-icon.png     （180×180，iOS「加入主畫面」用）
└── icons/
    ├── favicon-16.png
    ├── favicon-32.png
    ├── icon-192.png         （Android／PWA manifest 用）
    └── icon-512.png         （PWA manifest／各種高解析度顯示用）
```

這份改動只需要：(1) 新增一個 `app/public/manifest.webmanifest` JSON 檔（純資料，不是程式邏輯，可以直接照抄下面內容建立）、(2) 在 `app/index.html` 的 `<head>` 補上幾行 `<link>`／`<meta>` 標籤。**不需要寫任何 service worker、不需要改 `main.ts`**——使用者只是要一個固定圖示，不是要做完整離線可用的 PWA，這裡刻意不擴大範圍。

## 改動一：新增 `app/public/manifest.webmanifest`

```json
{
  "name": "English for Kids - 每天玩一點英語！",
  "short_name": "English for Kids",
  "description": "台灣國小階段常見英語學習主題的兒童英語學習平台，用主題式單字、句型、短文的遊戲化關卡在家複習英文。",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#0052A3",
  "theme_color": "#0052A3",
  "lang": "zh-Hant",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**注意 `icons[].src` 這裡故意用相對路徑（沒有開頭斜線）**，因為 web app manifest 裡的路徑是相對於 manifest 檔案本身的網址解析，不是相對於網站 base（Vite 的 `base: "./"` 設定也不會去重寫 `.webmanifest` 檔案內容本身，只會重寫 `index.html` 裡的路徑）——用相對路徑在 GitHub Pages 子路徑（`https://78vince.github.io/english-for-kids/`）底下才會正確指到 `.../english-for-kids/icons/icon-192.png`，不會被解析成網域根目錄下的錯誤路徑。

## 改動二：`app/index.html` 的 `<head>` 補上圖示相關標籤

現有的 `app/index.html`：

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>每天玩一點 - English for Kids</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

改成（在 `<title>` 後面、`<link rel="stylesheet">` 前面插入以下區塊；沿用現有 `href="/src/..."` 這種開頭斜線的絕對路徑寫法，Vite 的 `base: "./"` 設定會在 build 時自動把這些路徑正確改寫成部署子路徑相對路徑，跟現有 `/src/main.ts`／`/src/style.css` 的處理方式一致，不用擔心 GitHub Pages 子路徑的問題）：

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0052A3" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="English for Kids" />
```

- `apple-mobile-web-app-title` 特別設成比較短的「English for Kids」（不是網頁 `<title>` 那串「每天玩一點 - English for Kids」），因為 iOS 主畫面圖示下面的名稱空間很窄，太長的標題會被截斷成「每天玩一點 - Eng…」不好看。
- `apple-mobile-web-app-capable` + `status-bar-style` 讓 iOS 上「加入主畫面」後點開時，是全螢幕獨立視窗（沒有 Safari 網址列／工具列），比較有「桌面應用程式」的感覺——這也是使用者原本問題裡「做成桌面應用程式」這個情境會期待的效果。

## 驗證

1. `npm run build`（`tsc --noEmit && vite build`）通過，確認 `dist/` 底下有 `favicon.ico`／`apple-touch-icon.png`／`manifest.webmanifest`／`icons/icon-192.png`／`icons/icon-512.png`，且 `dist/index.html` 裡的路徑有被正確改寫成 `./favicon.ico` 這種相對路徑（不是還留著開頭斜線的絕對路徑）。
2. 瀏覽器分頁圖示：本機 `npm run dev` 或 `npm run preview` 開起來，確認分頁上看得到 K 怪獸的 favicon。
3. **手機實測（這項沒辦法在沙盒環境確認）**：麻煩實際用 iPhone Safari「分享→加入主畫面」、或 Android Chrome「安裝應用程式／新增至主畫面」，確認：
   - 主畫面上的圖示是 K 怪獸（不是網頁截圖或系統預設圖示）。
   - 圖示下方顯示的名稱是「English for Kids」，不是被截斷的長標題。
   - 點開後是全螢幕獨立視窗（沒有網址列），感覺像獨立 App。
4. `node scripts/build-standalone-demo.mjs` 重新產生 `app/demo-standalone.html` 並同步到專案根目錄那份（`public/` 底下的檔案是獨立檔案，不會被 standalone 版本的 inline 邏輯處理到，這點不影響 standalone 版本本身能不能正常開啟，只是 standalone 版本本來就不是給人「安裝」的用途，不用特別驗證這部分）。

## 不需要改的地方

- `content/` 完全不用動。
- 不用寫 service worker、不用做離線快取——範圍只到「有固定的安裝圖示」，之後如果要做完整 PWA 離線支援，是另一個獨立的功能，這裡先不做。
- 不用改 `main.ts`——這次改動不涉及任何執行期程式邏輯，純粹是靜態檔案＋`index.html` 標籤。
