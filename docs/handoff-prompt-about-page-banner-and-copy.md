# Handoff Prompt：「關於本站」頁面加上底部裝飾圖＋介紹文字改寫（更易讀、加大行距）

## 背景

使用者提供了一張新素材圖（可愛毛氈風格男孩＋字母怪獸插畫），要放在「關於本站」頁面最下方，並且要隨螢幕寬度縮放；同時也覺得現有介紹文字有點繞口、不容易讀，希望改寫得更順、分段更清楚，並加大行距。

圖片已經處理好放進 `app/src/assets/about-banner.jpg`（原始素材另外裁切壓縮成 1200×670 的 JPG，跟 `app/src/assets/badges/*.jpg` 的既有慣例一致，只是這張不是徽章、不用透過 `import.meta.glob`，直接一般 import 即可）。這份 handoff 只需要改 `app/src/main.ts` 的 `renderAbout()` 函式跟 `app/src/style.css` 的 `.about-*` 相關樣式，不涉及 `content/`，不用重跑任何 `verify-*.ts`。

## 改動一：`renderAbout()` 底部加上裝飾圖（`main.ts` 約第 2194-2224 行）

在檔案開頭其他 asset import 旁邊（可以放在 `avatars.ts`／`badgeImages.ts` 那些 import 附近）新增：

```ts
import aboutBannerUrl from "./assets/about-banner.jpg";
```

在 `renderAbout()` 最後（`metaText` 那個 `<p>` appendChild 之後）新增：

```ts
const bannerImg = document.createElement("img");
bannerImg.className = "about-banner-img";
bannerImg.src = aboutBannerUrl;
bannerImg.alt = ""; // 純裝飾用途，不承載內容資訊，不用 alt 文字（跟其他頭像圖 alt="" 的慣例一致）
app!.appendChild(bannerImg);
```

CSS 新增：

```css
.about-banner-img {
  display: block;
  width: 100%;
  height: auto;
  margin-top: var(--space-7, var(--space-6));
  border-radius: var(--radius-lg);
}
```

因為 `#app` 本身有 `max-width: 1000px`（`style.css` 第 43 行），圖片用 `width: 100%` 會自動跟著容器寬度縮放（手機窄螢幕會縮小、桌機寬螢幕最大就撐到 1000px 容器寬度），符合「隨螢幕寬度放大」的需求，不用另外寫 media query。`margin-top` 的 token 名稱請依實際 design tokens 現有的間距 scale 選一個比 `.about-text` 段落間距更大的值，做出「內文結束、圖片是獨立的裝飾區塊」的視覺區隔即可，數值不用堅持一定要用上面寫的名稱。

## 改動二：介紹文字改寫＋加大行距（`main.ts` 約第 2207-2211 行 ＋ `style.css` 約第 2043-2048 行）

現有文字是一整段塞在單一 `<p class="about-text">` 裡，讀起來偏長、句子之間轉折也有點生硬。改成三段更口語、更好讀的版本（原本 `aboutTagline`、`aboutFeedback`、`metaText` 三個元素都不用動，只換中間這一段）：

```ts
const aboutText1 = document.createElement("p");
aboutText1.className = "about-text";
aboutText1.textContent =
  "孩子還小的時候，我們用繪本和單字卡陪他一起學英語；上小學後，也開始讓他用 App 練習。這幾年陸續讓孩子試過三、四款英語學習 App，各有特色，孩子也確實學到不少東西。";
app!.appendChild(aboutText1);

const aboutText2 = document.createElement("p");
aboutText2.className = "about-text";
aboutText2.textContent =
  "不過用久了發現，這些 App 大多不是設計給學齡前的幼兒，就是偏向成人自學，內容跟小學生的生活情境有點距離，孩子沒辦法完全對應到學校教的東西。";
app!.appendChild(aboutText2);

const aboutText3 = document.createElement("p");
aboutText3.className = "about-text";
aboutText3.textContent =
  "所以我決定自己動手做一個更適合小學階段的英語學習平台，讓孩子每天玩一點英語，內容也能隨時依照他的程度調整。目前我的孩子讀小學三年級，平台內容也以小學階段的單字和文法為主。如果你家的孩子也有類似需求，歡迎多加利用！";
app!.appendChild(aboutText3);
```

`aboutFeedback`（「有任何問題或建議，都歡迎跟我說。」）維持不變，接在這三段後面即可，四段加起來的閱讀節奏比原本一大塊文字清楚很多。

行距／段落間距：`.about-text` 目前是 `line-height: 1.6`、段落間距 `margin: var(--space-3) 0 0`，改成：

```css
.about-text {
  margin: var(--space-4) 0 0;
  font-size: var(--text-body);
  color: var(--color-ink-muted);
  line-height: 1.8;
}
```

`line-height` 從 1.6 調到 1.8（單行閱讀更鬆），段落間距從 `--space-3` 調到 `--space-4`（現在有 4 段，段落之間需要比原本單一大段落更明顯的呼吸空間）。`.about-tagline` 有自己獨立的 `margin-top: var(--space-6)` 不受影響，不用改。

## 不需要改的地方

- `content/` 完全不用動。
- 不用改任何 `verify-*.ts`，這次改動跟主題內容、成效追蹤、徽章系統都無關。
- `aboutTagline`（標語）、`aboutFeedback`（回饋短句）、`metaText`（版本號／作者／email）三個元素本身文字都不用改，只是 `metaText` 之後多插入了一張圖。

## 驗證

1. `npm run build`（含 `tsc --noEmit`）通過。
2. 實際打開「關於本站」頁面，確認：文字分成四個自然段、行距明顯比之前鬆、圖片出現在最下方且寬度會跟著視窗縮放（縮小瀏覽器視窗測試一下響應式效果）。
3. `node scripts/build-standalone-demo.mjs` 重新產生 `app/demo-standalone.html`，並 `cp app/demo-standalone.html ../demo-standalone.html` 同步專案根目錄那份（demo-standalone.html 會把圖片內嵌成 base64，記得確認產出的檔案有正常包含圖片、檔案大小沒有異常暴增）。
4. 不用重跑 `verify-*.ts`、不用重新產生 `dashboard.html`／`content-review.html`。
