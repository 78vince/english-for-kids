# Handoff：風格改版 v2——主色／強調色／中性色調整＋抬頭區塊重新設計

## 背景

接續 `docs/handoff-prompt-design-system-health-check.md`（模糊彈窗、nav-item/menu-item token 遷移）的全站設計系統健檢，使用者進一步要求風格改版：色彩「柔和降階」（飽和度/明度微調，不是大幅降階）、主色指定為 `#347FBC`、圓角更圓潤、補齊間距規劃、重新設計過大的抬頭／頭像區塊，並明確保留主題卡片的進度條（不要改成其他呈現方式）。完整視覺對照跟新 token 定義見 `docs/design-tokens.html`（可直接用瀏覽器打開查看，含三大部分：基礎元素／元件規格／功能應用），這份 handoff 是把那份文件裡的設計換成實際要改的程式碼。

這份 handoff 建議在 `design-system-health-check.md` 執行完之後再做（兩者都動 `.modal-card`／`.nav-item` 附近的 CSS，避免合併衝突；如果還沒執行那份，兩份可以一起看，不衝突的部分可以合併成一次修改）。

## 1. Token 檔案（`assets/design-tokens/design-tokens.v2-daily-play.css`）色彩更新

第 13-33 行，色彩區塊整組替換：

```css
  /* ---------- Color / Brand ---------- */
  --color-primary-700: #347FBC;   /* 原 #0052A3，使用者指定新主色 */
  --color-primary-500: #5B9CD1;   /* 原 #2E7BD6，跟著主色微調 */
  --color-primary-100: #DCEAF5;   /* 原 #C4E2EF */
  --color-secondary-500: #5B7CCB; /* 不變（目前用量很少，先不動） */

  /* ---------- Color / Accent（柔和降階：只微調飽和度/明度，不大幅降階） ---------- */
  --color-accent-orange: #FF9A68; /* 原 #FF8A61 */
  --color-accent-pink:   #FFB8E8; /* 原 #FFBDEF */
  --color-accent-yellow: #FFD873; /* 原 #FFD166 */

  /* ---------- Color / Feedback ---------- */
  --color-success: #7EDBA0; /* 原 #6FCF97 */
  --color-error:   #FF7A7A; /* 原 #FF6B6B */

  /* ---------- Color / Neutral（背景改暖色調，呼應「舒適」方向） ---------- */
  --color-bg:        #F7F5F1;   /* 原 #F4F6F9，冷色藍灰改暖米灰 */
  --color-surface:   #FFFFFF;
  --color-ink:       #2F2E4E;   /* 原 #2B2A4A，極微幅調整 */
  --color-ink-muted: #8B8699;   /* 原 #6B6789 */
  --color-border:    #E6E1D8;   /* 原 #DCE2EA，改暖灰 */
```

第 35-40 行 Tint 區塊（沿用 `design-system-health-check.md` 已經規劃要補的兩個 tint，這裡一併給最終色碼）：

```css
  --color-primary-tint: #EAF2FB;
  --color-success-tint: #EBFAF1;
  --color-accent-yellow-tint: #FFF8E9;
  --color-accent-orange-tint: #FFF2EA;
  --color-accent-pink-tint: #FFF3FA;
```

第 54-60 行圓角區塊，新增 `--radius-xs`，`--radius-sm`／`--radius-md` 微調更圓潤：

```css
  /* ---------- Radius（新增 xs，sm/md 微調更圓潤，呼應「圓潤和緩」） ---------- */
  --radius-xs: 6px;    /* 新增：小標籤用 */
  --radius-sm: 12px;   /* 原 8px */
  --radius-md: 18px;   /* 原 16px */
  --radius-lg: 24px;   /* 不變 */
  --radius-xl: 32px;   /* 不變 */
  --radius-pill: 999px;
  --radius-circle: 50%;
```

**注意**：`--radius-sm`／`--radius-md` 數值改變會影響所有引用這兩個 token 的既有元件（例如按鈕、小卡片），這是預期中的全站圓潤化效果，不是遺漏；但請過一遍 `npm run build` 之後實際看一輪畫面，確認沒有哪個元件因為圓角變大而跟相鄰元素重疊或露出縫隙。

第 77-85 行功能列區塊：

```css
  --nav-item-active-color: var(--color-surface); /* 原 #FFFFFF，改引用既有 token */
```

## 2. `style.css` 自己 `:root` 裡的衍生色——基礎色換了，衍生色要跟著重算

第 14-23 行目前的衍生色是手動算出來的深/淺變化，基礎色改變後這些值會過時，改成：

```css
  --color-success-text: #2E8C5C;      /* 原 #2f8f5e，依新 success #7EDBA0 重算 */
  --color-success-bg:   #E9F9F0;      /* 原 #e6f7ee */
  --color-error-text:   #C24A45;      /* 原 #c2453f，依新 error #FF7A7A 重算 */
  --color-error-bg:     #FFEBE9;      /* 原 #ffe9e7 */
  --color-primary-700-hover: #2A6694; /* 原 #003b78，依新主色 #347FBC 重算（再深一階） */
  --color-reward-hover: #E8824A;      /* 原 #e8703f，依新 accent-orange #FF9A68 重算 */
```

這幾個色碼是用「比基礎色再深一階、維持對比度」的原則手動抓的，不是精算值，改完後麻煩用瀏覽器實際看一下文字在對應底色上是否還夠清楚，不夠的話可以用設計工具微調，不用拘泥於我給的色碼。

**連動修改**：`app/src/games/crosswordStandalone.css`／`app/src/games/memoryMatchStandalone.css` 裡複製貼上的 `--color-primary-700-hover`（之前在 `design-system.md` 第 5 節列為技術債：「以後 style.css 改了衍生色算法要記得同步」）這次**必須**一起更新成 `#2A6694`，不然這兩款遊戲的 hover 效果會停留在舊主色的色調，跟全站其他地方的新藍色不一致。

`crosswordStandalone.css`／`bubblePopStandalone.css` 各自目測調出來的粉色系（`--color-crossword-pink-*`）、泡泡粉色系（`--color-bubble-pink-*`）主要是從 `--color-accent-pink` 衍生，這次 `--color-accent-pink` 只有微幅改變（`#FFBDEF`→`#FFB8E8`），視覺差異很小，**可以不用跟著重新調**，但如果順手想一起處理也可以，不強制。

## 3. 首頁抬頭／頭像區塊重新設計（這次最主要的版面調整）

現況（`app/src/main.ts` 第 1281-1303 行 `appendBrandBanner()`）：登入狀態用 `<br/>` 強制兩行「Hi! {name}」+「今天也來玩一點英語吧！」，頭像用 `height:100%` 撐滿文字欄高度；手機版（`style.css` 第 427-447 行）頭像被放大到固定 `288×288px`、整欄堆疊。實測桌面版抬頭＋功能列約佔 207px、**手機版約佔 620px**，在看到任何學習內容之前就先吃掉大半螢幕。

### 3.1 `main.ts` 的 `appendBrandBanner()` 改成單行文字

```ts
function appendBrandBanner(): void {
  const banner = document.createElement("div");

  if (activeProfile) {
    banner.className = "brand-banner brand-banner--user";
    const avatarUrl = getAvatarById(activeProfile.avatarId).url;
    banner.innerHTML = `
      <img class="brand-banner-avatar" src="${avatarUrl}" alt="" />
      <h1>Hi, ${activeProfile.name}！一起玩英語</h1>
    `;
  } else {
    banner.className = "brand-banner";
    banner.innerHTML = `
      <p class="brand-subtitle">English for Kids</p>
      <h1>每天玩一點英語！</h1>
    `;
  }

  app!.appendChild(banner);
}
```

改動重點：登入狀態拿掉 `<br/>` 強制換行跟獨立的 `<p class="brand-subtitle">`（slogan 在已登入狀態的價值不高，拿掉可以讓這一行真正縮成一行）、頭像放到文字前面（跟 `docs/design-tokens.html` 第 15 節的範例一致，頭像在左、文字在右）。未登入狀態（選擇使用者畫面）維持原樣不變，因為那個畫面本來就沒有頭像、也沒有空間擁擠的問題。

### 3.2 `style.css` 抬頭 CSS 調整

第 290-298 行：

```css
.brand-banner {
  margin: 0 0 var(--space-4);                          /* 原 var(--space-5) */
  padding: var(--space-4) var(--space-5);               /* 原 calc(var(--space-6) + var(--space-2)) var(--space-5)，40px→16/24px */
  background: linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500));
  color: #fff;
  text-align: left;
  border-radius: var(--radius-xl);
}
```

第 307-313 行：

```css
.brand-banner h1 {
  font-family: var(--font-display);
  font-size: var(--text-body-lg);  /* 原 var(--text-h1) 42px，大幅縮小到 23px，單行文字不需要原本的巨大字級 */
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}
```

第 318-339 行（`.brand-banner--user` 容器＋頭像）：

```css
.brand-banner.brand-banner--user {
  display: flex;
  align-items: center;       /* 原 stretch，頭像不再撐滿高度 */
  gap: var(--space-4);       /* 原 var(--space-5) */
}

.brand-banner-avatar {
  width: 56px;    /* 原 height:100%／width:auto 動態撐滿 */
  height: 56px;
  border-radius: var(--radius-circle);
  object-fit: cover;
  flex-shrink: 0;
}
```

（`.brand-banner-text` 這個包裹 `<div>` 因為新版 `innerHTML` 不再需要文字跟 slogan 分開兩層，可以直接刪除對應的 CSS 規則，或保留不動——沒有任何元素會再用到這個 class，刪不刪都不影響畫面。）

第 427-447 行手機版覆寫——**整段規則可以直接刪除**，因為新版單行文字＋56px 固定頭像在手機寬度下不需要任何特殊處理，跟桌面版表現一致（如果實機測試發現手機版名字太長導致換行，再回報，屆時用 `text-overflow: ellipsis` 或字級再降一階處理，不要重新套用整欄堆疊的舊方案）。

## 4. 明確不動的部分

- **主題卡片的進度條維持原樣不動**——使用者已經明確說「進度條顯示比較單純直覺」，不要用任何其他方式（獎牌、星星、百分比文字等）取代，`docs/design-tokens.html` 第 16 節的範例也是進度條原樣呈現，只調整了卡片圓角（lg→md）跟內距 token，進度條本身的 DOM／邏輯都不碰。
- 字級數值本身不調整（`--text-*` 全部維持現有，只有 `.brand-banner h1` 這一處因為版面重新設計而改用更小的既有字級 token，不是整組字級系統變動）。
- 間距數值（`--space-*`）不調整，只是補齊第 1 節提到的「用途分組」說明（寫進 `docs/design-system.md`，不需要程式碼改動）。

## 5. 驗證

- `npm run build` 要過。
- 全部既有 `verify-*.ts` 重跑一次（這次改動是 CSS＋`appendBrandBanner()` 的 DOM 結構，確認沒有任何驗證腳本是用字串比對檢查舊版 `<br/>`／`.brand-subtitle` 結構，若有需要同步更新該驗證腳本的比對字串）。
- 手動測試（桌面＋手機寬度模擬 375px）：
  - 抬頭區塊登入後顯示「Hi, {name}！一起玩英語」單行文字＋56px 圓形頭像，桌面跟手機版看起來一致，不再有手機版頭像暴增的狀況。
  - 整頁可視高度明顯增加（開發者工具量測抬頭＋功能列總高度，應該從原本手機版約 620px 降到 150px 以內）。
  - 全站按鈕／卡片的圓角變圓潤，沒有造成元素互相重疊。
  - 填字遊戲／戳泡泡裡的 hover 效果（卡片、按鈕）顏色是新的藍色系，不是停留在舊主色。
  - 主題卡片的進度條外觀／互動跟修改前完全一致。
