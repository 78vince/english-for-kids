# 任務：把「關於本站」頁面的介紹文字換成使用者新寫的版本

## 背景

使用者提供了一段新的自我介紹文字（家長視角、說明做這個平台的緣由），要換掉現有「關於 English for Kids」底下那句簡短介紹。這句話目前唯一出現在 `app/src/main.ts` 的 `renderAbout()` 函式裡（`main.ts:2005-2009`），也是全檔案唯一出現「GEPT Kids」字樣的地方，換掉之後這個字樣就不會再出現，不用另外處理。

## 要改的地方

`renderAbout()`（`main.ts:1992-2017`）目前結構：

```ts
const aboutTitle = document.createElement("h2");
aboutTitle.className = "section-heading";
aboutTitle.textContent = "關於 English for Kids";
app!.appendChild(aboutTitle);

const aboutText = document.createElement("p");
aboutText.className = "about-text";
aboutText.textContent =
  "一個給小朋友在家練習 GEPT Kids 單字、句型與短文的學習平台。沒有排行榜、沒有跟別人比較，只記錄你自己的進步。";
app!.appendChild(aboutText);

const metaText = document.createElement("p");
metaText.className = "about-meta";
metaText.innerHTML = `English for Kids v${pkg.version} ｜ Vincent - 小禮 ｜ <a href="mailto:78vince@gmail.com">78vince@gmail.com</a>`;
app!.appendChild(metaText);
```

`aboutTitle`（`關於 English for Kids` 標題）跟最後的 `metaText`（版本號／作者／email）都不用動，只換中間 `aboutText` 這一段——原本是單一句話塞進一個 `<p>`，新文字比較長、分好幾個自然段，改成三個 `<p class="about-text">`（第一段是標語，第二段是正文，第三段是邀請回饋的短句），中間留白距離沿用 `.about-text` 現有的段落間距，不用另外加 CSS：

```ts
const aboutTagline = document.createElement("p");
aboutTagline.className = "about-text about-tagline";
aboutTagline.textContent = "每天玩一點英語！";
app!.appendChild(aboutTagline);

const aboutText = document.createElement("p");
aboutText.className = "about-text";
aboutText.textContent =
  "從孩子還很小的時候，我們就用繪本、單字圖卡等各種資源陪他一起學英語；上了小學之後，也開始讓他透過 App 學習。市面上的英語學習 App 非常多，各有特色與專長，我們也陪孩子用過三、四款，都有不錯的收穫。不過就學習程度與內容來看，這些 App 不是太偏向幼兒，就是太偏向成人，對小學階段的孩子來說，內容不太貼近他們的生活情境。於是我決定自己動手做一個更適合這個學習階段的平台，也能依照孩子的需求隨時調整內容。目前我的孩子讀小學三年級，所以平台內容以小學階段的單字與文法為主。如果你或家中的孩子也有需要，歡迎多加利用。";
app!.appendChild(aboutText);

const aboutFeedback = document.createElement("p");
aboutFeedback.className = "about-text";
aboutFeedback.textContent = "有任何問題或建議，都歡迎跟我說。";
app!.appendChild(aboutFeedback);
```

`about-tagline` 這個 class 是新加的，純粹讓「每天玩一點英語！」這句標語視覺上可以比正文稍微突出一點（例如加粗、或用 `--color-primary-700`），不是必要的，如果你覺得不需要特別處理，三段都用原本 `.about-text` 的樣式即可，不用堅持一定要做視覺差異。

## 驗證

1. `npm run build`（含 `tsc --noEmit`）通過。
2. 全文搜尋 `GEPT Kids` 確認 `app/src` 底下不再有殘留（改完這裡應該就是最後一處）。
3. 實際打開「關於本站」頁面，確認新文字正確顯示、分段清楚易讀，版本號／作者／email 那行沒有跟著跑掉。
4. `node scripts/build-standalone-demo.mjs` 重新產生 `app/demo-standalone.html`，並 `cp app/demo-standalone.html ../demo-standalone.html` 同步專案根目錄那份。
