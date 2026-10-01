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
.game-room-card-stars--great {                                      /* 5 顆：太棒了，整排反白加漸層底 */
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: #fff;
  background: var(--gradient-gold);
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
}
```

`--gradient-gold` 是這次新增的漸層 token（見第 3 節）。只有滿星（5 顆）用漸層反白 chip，1-4 顆維持純色文字不加背景，避免每個等級都用特效互相稀釋掉滿星的慶祝感——這個設計原則在 `docs/design-tokens.html` 第 10b 節已經說明。

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

## 6. 首頁抬頭圓角改用 pill（膠囊形，呼應圓形大頭貼）

接續 `style-refresh-v2.md` 第 3.2 節，`.brand-banner` 的 `border-radius` 從 `var(--radius-xl)` 改成 `var(--radius-pill)`：

```css
.brand-banner {
  margin: 0 0 var(--space-4);
  padding: var(--space-4) var(--space-6);  /* 左右改用 space-6（32px），比上下的 space-4（16px）寬，避免膠囊圓角把文字吃進曲線 */
  background: var(--gradient-primary);      /* 直接引用新 token，取代原本手寫的 linear-gradient(135deg, ...) */
  color: #fff;
  text-align: left;
  border-radius: var(--radius-pill);        /* 原 var(--radius-xl)，改全圓角膠囊形 */
}
```

未登入狀態（選擇使用者畫面的 `.brand-banner` 不含 `--user`）文字較長（「每天玩一點英語！」+ slogan 兩行），膠囊圓角在這個情境下如果造成左右留白看起來過度浮誇，可以讓未登入狀態維持 `--radius-xl`、只有已登入狀態（`.brand-banner--user`）改成 `--radius-pill`——這個取捨請實際看過兩種畫面再決定，不是非改不可的硬性規則。

## 7. 驗證

- `npm run build` 要過。
- 全部既有 `verify-*.ts` 重跑一次。
- 手動測試：
  - 遊戲室任一遊戲玩到不同星數（1-2／3-4／5 顆），確認星星顏色隨分級變化，滿星時整排星星變成反白＋金色漸層底的膠囊 chip。
  - 代幣圖示（餘額顯示／卡片費用標籤／確認彈窗）全部顯示圓圈＋白色字母 K，不是原本的硬幣圖案，字母置中沒有偏移。
  - 首頁抬頭圓角變成膠囊形，文字跟頭像沒有被圓角裁切或擠壓。
  - 按鈕 hover 效果維持原本正常運作（這次沒有改動，純粹確認沒有被其他改動意外影響到）。
