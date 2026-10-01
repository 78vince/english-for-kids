# Handoff：風格改版 v3——星星分級／代幣圖示／字型系統／按鈕選取狀態／抬頭膠囊圓角

## 背景

接續 `handoff-prompt-style-refresh-v2.md`，使用者這次提出 9 項更細節的要求。完整視覺定義在 `docs/design-tokens.html`（已更新：新增漸層、完整字型系統、星星評等分級、代幣圖示、按鈕選取狀態、導覽列 hover 說明、挑戰紀錄/個人檔案卡片，並加上「點色卡複製 token 名稱」的功能，方便直接核對）。下面依序列出實際要改的程式碼。執行順序建議：v2 → v3，因為 v3 有些色彩引用（漸層）要等 v2 的主色/強調色定案才有意義。

## 1. 遊戲星星分級（不是成就徽章——遊戲室用星星，主站學習進度才用徽章）

現況：`crosswordGame.ts`/`bubblePopGame.ts` 的 `starsForMistakes()` 已經有 1-5 顆的換算邏輯，渲染在 `main.ts` 第 2073-2087 行，用 `STAR_FILLED_ICON`/`STAR_EMPTY_ICON`（`gameIcons.ts`），**兩個 icon 都用 `currentColor`，目前沒有任何分級配色，不管幾顆星全部同一個顏色**。

新增分級（三級）：

```ts
// main.ts 第 2073-2087 行附近，renderGameRoom() 內
const bestStars = getBestStars(activeProfile!.id, game.id);
if (bestStars > 0) {
  const tierClass =
    bestStars <= 2 ? "game-room-card-stars--practice" :
    bestStars <= 4 ? "game-room-card-stars--good" :
    "game-room-card-stars--great";
  const starsHtml = [1, 2, 3, 4, 5]
    .map((n) => (n <= bestStars ? STAR_FILLED_ICON(16) : STAR_EMPTY_ICON(16)))
    .join("");
  // 外層包一層 tier class，顏色交給 CSS 處理（icon 本身維持 currentColor 不用動）
  starsBlock = `<div class="game-room-card-stars ${tierClass}">${starsHtml}</div>`;
}
```

`style.css` 新增三個 tier class：

```css
.game-room-card-stars--practice { color: var(--color-ink-muted); }  /* 1-2 顆：再接再厲 */
.game-room-card-stars--good { color: var(--color-accent-yellow); }  /* 3-4 顆：做得好 */
.game-room-card-stars--great {                 /* 5 顆：太棒了，改用深棕金色實心底＋亮金星星（不是亮色漸層） */
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: #fff;
  background: #3D2F18;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
}
.game-room-card-stars--great .star-icon { color: var(--color-accent-yellow); }  /* 星星本身維持亮金色，只有底色改深 */
```

**修正（2026-10-01 使用者回饋）**：滿星原本規劃用 `--gradient-gold` 亮色漸層反白，使用者看過後要求改用深色——深棕金色（`#3D2F18`）實心底＋亮金色星星，比亮色漸層更有「頒獎」質感，也讓滿星明確比 3-4 顆的淡黃色更隆重。`--gradient-gold` 這個 token 仍然保留在 token 檔案裡（其他地方可能用得到），只是星星評等這個元件改成不用它。1-4 顆維持純色文字不加背景不變。

## 2. 代幣圖示換成「圓圈＋字母 K」

現況：`gameIcons.ts` 的 `COIN_ICON(size)` 目前是硬幣造型的 SVG，使用處：`main.ts` 第 2050、2086、2169 行（代幣餘額顯示、卡片費用標籤、確認彈窗內文），**沒有殘留 emoji，是找到單一函式就能全部置換**。

把 `COIN_ICON` 的 SVG 內容換成圓圈＋白色字母 K（沿用 `--gradient-primary`）：

```ts
export function COIN_ICON(size: number): string {
  const fontSize = Math.round(size * 0.58);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="vertical-align:-2px">
    <defs>
      <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--color-primary-700)"/>
        <stop offset="100%" stop-color="var(--color-primary-500)"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="11" fill="url(#coinGrad)"/>
    <text x="12" y="12" text-anchor="middle" dominant-baseline="central"
      font-family="Huninn, sans-serif" font-weight="700" font-size="${fontSize}" fill="#fff">K</text>
  </svg>`;
}
```

**注意**：函式名稱 `COIN_ICON` 可以維持不變（改名字要動到三個呼叫點，沒有必要），只是這次圖案不再是硬幣造型了，建議把函式上方的註解改成「遊戲代幣圖示——圓圈＋品牌字母 K，呼應吉祥物『羊毛氈字母怪獸 K』，2026-10-01 從硬幣造型改版」，避免之後有人看函式名稱誤以為還是硬幣圖案。`<text>` 的 `dominant-baseline="central"` 在少數舊版瀏覽器支援度沒那麼好，如果實測發現字母 K 垂直沒有置中，改用 `dy=".35em"` 這個更保守的寫法替代。

## 3. 字型系統補齊（`assets/design-tokens/design-tokens.v2-daily-play.css`）

字級數值不變，這次補上字重跟行高的角色定義，第 42-52 行 Typography 區塊最後新增：

```css
  --weight-regular: 400;
  --weight-bold: 700;
  --leading-tight: 1.3;   /* 標題 h1~h3 */
  --leading-normal: 1.6;  /* 內文 body／caption */

  /* ---------- Gradient（新增：統一用 135deg，避免各元件自己亂配） ---------- */
  --gradient-primary: linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500));
  --gradient-gold: linear-gradient(135deg, #E8C24E, var(--color-accent-yellow));
  --gradient-success: linear-gradient(135deg, #4FBE82, var(--color-success));
```

這幾個 token 目前是「補文件＋補 token 定義」，不強制要求把全站既有的 `font-weight: 700` 字面值都替換成 `var(--weight-bold)`——那個工程量大但效益低（純粹是把同一個數字換一種寫法），這次只要求新寫的元件（第 1、2 節）直接用這些新 token，既有程式碼不用為了這個去翻修。

## 4. 按鈕 hover／選取狀態

**hover 效果其實已經存在**：`.primary-btn:hover`／`.secondary-btn:hover`（`style.css` 1758-1787 行）已經有完整的 hover 樣式，這部分不用新增。

新增的是「當前頁面／選取中」持續狀態（跟 hover 不同，是「這個選項目前被選中」的狀態，例如多選一的 Tab 或篩選 Chip），`style.css` 新增一個共用 class，供之後任何多選一元件使用：

```css
.is-selected {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
  color: #fff;
}
```

**目前沒有迫切需要套用的地方**（`.favorites-sort` 的排序按鈕已經有自己的 active 邏輯，不用強制改用這個新 class），這次先把共用 class 定義好，之後做新的分頁式元件（例如填字遊戲如果以後要做難度分頁）可以直接套用，不用每次重新發明一套「選取中」樣式。

## 5. 挑戰紀錄／個人檔案資訊卡＋單元完成卡

### 5.1 資訊卡（`.profile-stat-card`）——現況已經符合預期形狀，只需要核對 token

`main.ts` 第 2678-2690 行 `.profile-stat-card` 已經是「icon＋數字＋標籤」的卡片結構，不需要重新搭建，只要核對 `style.css` 裡對應的樣式數值跟 `docs/design-tokens.html` 第 20 節一致：

```css
.profile-stat-card {
  border-radius: var(--radius-md);  /* 確認用新的 18px，不是舊的 16px */
}
.profile-stat-value {
  font-size: var(--text-h3);
  font-weight: 700;
  color: var(--color-primary-700);  /* 確認數字是主色，不是純黑/純灰 */
}
.profile-stat-label {
  font-size: var(--text-caption);
  color: var(--color-ink-muted);
}
```

如果目前這幾個屬性已經是這樣寫，這部分不用改，純粹是核對用。

### 5.2 單元完成卡——目前不存在，是新元件，建議之後再做

目前「整個單元完成」只有兩種呈現：Stage D 過關後的一段純文字（`main.ts` 第 4055-4060 行「🏆🏆 ... 主題單元完成！」），以及共用的徽章解鎖彈窗（`appendBadgeUnlockModal()`，所有徽章類型共用同一套彈窗，不是單元完成專屬的視覺）。**`docs/design-tokens.html` 第 20 節畫的「單元完成卡」目前沒有對應的實際元件**，是新增功能，不是既有元件的重新上色。

這次 handoff **不包含**實作這張新卡片——先把視覺規格定義好放在設計文件裡，等你確認要不要真的做這個新功能（例如：整個單元完成時，除了現有的徽章解鎖彈窗，另外在挑戰紀錄頁常駐顯示一張這樣的慶祝卡）再另外開一次 handoff，避免這次风格調整的 commit 範圍混進新功能開發。

**補充（2026-10-01 使用者回饋）**：`docs/design-tokens.html` 第 20 節這張示意圖現在同時畫了「一般狀態／進行中」（白底＋邊框＋`primary-tint` 底色的「進行中」標籤）跟原本的「🎉 單元完成」（成功色漸層）兩張卡並排比較，方便直接看出「做到一半」跟「完成」兩種狀態的視覺差異。這純粹是補完設計規格的對照組，不影響上面「這次不實作」的結論——兩張卡都還是新元件，一樣等你確認要不要做才會另開 handoff。

## 6. 首頁抬頭圓角改用 pill（膠囊形，呼應圓形大頭貼）

接續 `style-refresh-v2.md` 第 3.2 節，`.brand-banner` 的 `border-radius` 從 `var(--radius-xl)` 改成 `var(--radius-pill)`：

```css
.brand-banner {
  margin: 0 0 var(--space-4);
  padding: var(--space-4);                  /* 原規劃左右用 space-6 比上下寬，使用者回饋要求四邊一致，改回統一 space-4（16px） */
  background: var(--gradient-primary);      /* 直接引用新 token，取代原本手寫的 linear-gradient(135deg, ...) */
  color: #fff;
  text-align: left;
  border-radius: var(--radius-pill);        /* 原 var(--radius-xl)，改全圓角膠囊形 */
}
```

**修正（2026-10-01 使用者回饋）**：原本規劃左右內距用 `--space-6`（32px）比上下的 `--space-4`（16px）寬，理由是怕膠囊圓角把文字吃進曲線。使用者回饋：「左側 padding，我想要與上下相同，這樣大頭貼距離外匡的間距才會一致」——改成四邊統一 `--space-4`，讓頭像到外框的距離上下左右一致，視覺上更穩定。如果統一間距後膠囊圓角在長文字情境（未登入狀態「每天玩一點英語！」+ slogan 兩行）看起來擁擠，可以讓未登入狀態維持 `--radius-xl`、只有已登入狀態（`.brand-banner--user`）改成 `--radius-pill`——圓角的取捨請實際看過兩種畫面再決定，但內距四邊一致這點已經是使用者明確要求，不是取捨選項。

## 7. 導覽列 hover 改用「一般按鈕」同一套配方（2026-10-01 新增，使用者回饋）

使用者回饋：「導覽列 Nav 上的按鈕效果，並沒有在按鈕設定上出現，請使用一般按鈕設定」——意思是導覽列目前的 hover 是自己另外配的一套，沒有跟一般按鈕（`.secondary-btn`）共用同一份視覺語言，造成全站「滑鼠移過去」的感覺不一致。

現況核對（`style.css` 第 386-388 行）：

```css
.nav-item:hover {
  background: var(--color-primary-100);
}
```

目前只換背景色，沒有邊框變化；而 `.secondary-btn`（第 1772-1787 行）本身是「白底＋`primary-100` 邊框＋`primary-700` 文字，hover 時邊框變成 `primary-500`」。兩者字面上的 hover 配方（換背景 vs. 換邊框）確實是兩套不同邏輯，這就是使用者說「沒有用一般按鈕設定」的地方。

**修正方向**：把一般按鈕的 hover 配方（背景補上 `primary-tint` 淺底＋邊框/文字轉為 `primary-700`，`docs/design-tokens.html` 第 10 節已經把這個當成「一般按鈕」的正式規格）同時套用到 `.secondary-btn:hover` 跟 `.nav-item:hover`，讓兩者共用同一份視覺語言：

```css
/* 1. .secondary-btn:hover 升級成補背景＋邊框一起變色（原本只換邊框） */
.secondary-btn:hover {
  background: var(--color-primary-tint);
  border-color: var(--color-primary-700);
}

/* 2. .nav-item 補上透明邊框（預留 hover 用，不加邊框 hover 時會因為沒有邊框而跳動） */
.nav-item {
  /* ...原有屬性不動，新增一行： */
  border: 2px solid transparent;
}

/* 3. .nav-item:hover 改用跟 .secondary-btn:hover 一致的配方 */
.nav-item:hover {
  background: var(--color-primary-tint);   /* 原 var(--color-primary-100) */
  border-color: var(--color-primary-700);  /* 新增 */
  color: var(--color-primary-700);         /* 新增，原本沒有換文字色 */
}
```

`.nav-item.active`（第 390-393 行，實心底＋白字）跟 `.nav-item--logout`（登出單獨配色）維持不動——這兩個是「當前頁面」跟「警示色」的既有邏輯，不屬於這次「一般 hover 要一致」的範圍。手機觸控沒有 hover 狀態，所以「當前頁面」一定要靠 `.active` 的實心背景清楚標示，不能只靠 hover 讓使用者猜測現在在哪一頁——這點本來就成立，這次沒有改變。

## 8. 驗證

- `npm run build` 要過。
- 全部既有 `verify-*.ts` 重跑一次。
- 手動測試：
  - 遊戲室任一遊戲玩到不同星數（1-2／3-4／5 顆），確認星星顏色隨分級變化，滿星時整排星星變成深棕金色實心底（`#3D2F18`）＋亮金色星星的膠囊 chip（不是亮色漸層反白）。
  - 代幣圖示（餘額顯示／卡片費用標籤／確認彈窗）全部顯示圓圈＋白色字母 K，不是原本的硬幣圖案，字母置中沒有偏移。
  - 首頁抬頭圓角變成膠囊形，四邊內距看起來一致（頭像到外框上下左右距離相同），文字跟頭像沒有被圓角裁切或擠壓。
  - 一般按鈕（`.secondary-btn`）hover 時背景補上淺底色、邊框變深（不是只有邊框變色）。
  - 導覽列任一項目滑鼠移過去時，背景／邊框／文字顏色變化跟一般按鈕 hover 一致；「當前頁面」仍然用實心底＋白字清楚標示，不受 hover 樣式影響。
