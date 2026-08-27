# 任務：修掉「點擊會跳回頁面頂端」的問題＋每個頁面加上「回到頂端」按鈕

## 背景與問題根因

使用者反映：只要點擊畫面（例如點徽章、答題、切換分頁），畫面就會自動跳回頁面最上方，不管使用者原本捲動到哪裡。

**根因**：`render()`（`main.ts:3455-3479`）每次都先 `app!.innerHTML = ""` 清空整個 `#app`，再依目前 `screen` 狀態重新組出整個畫面。這個 app 幾乎所有互動（答對/答錯一題、點徽章、切換分頁、點頭像……）最後都會呼叫一次 `render()`（例如 `goToProfile()` 351-356、`logout()` 359-368、`goToTopicSelect()` 370-374、`goToTopic()` 408-412、`goToMenu()` 427-430，以及各題型遊戲內部 `advanceCard()`／`advanceToNextQuestion()` 之類的 callback），不是只有「切換到全新頁面」才會重畫。

因為 `body` 是實際捲動的容器（沒有內層 scroll box），每次 `render()` 把整個 `#app` 砍掉重建，剛剛被點擊、正在 focus 的按鈕會被一起砍掉——焦點元素從 DOM 消失，瀏覽器預設行為就是把捲動位置重置，這就是「點哪裡都跳回頂端」的實際成因，不是某個連結或表單設定錯的問題（已排除 `<a href="#">`、表單 submit、`scrollTo`／`scrollIntoView` 誤用這幾種常見成因，都不是這裡的狀況）。

## 一、修正捲動位置重置的問題

**設計方向**：`render()` 預設要「保留使用者目前的捲動位置」，因為它被呼叫的場合裡，九成以上是「同一個畫面內的互動更新」（答題、點徽章、展開/收合），使用者主觀感受是「還在同一頁」，不該被拉回頂端。只有真正「切換到不同畫面」的場合（例如從主題選單點進一個主題、登出、切換分頁），才應該讓新畫面從頂端開始顯示，這是合理、預期中的行為，不用特別保留舊捲動位置。

### 1. 修改 `render()` 本身：預設保留捲動位置

```ts
function render(): void {
  const scrollY = window.scrollY;
  app!.innerHTML = "";
  // ...原本的 if/else-if 畫面分派邏輯，不用改...
  window.scrollTo(0, scrollY);
}
```

`window.scrollTo(0, scrollY)` 要放在整個畫面重建完成、`render()` 快結束的地方（原本 `appendBadgeUnlockModal()` 那段之後），確保是在同一個同步任務內完成，瀏覽器不會有機會先畫出「捲動到 0」的那一幀，不會閃一下。

### 2. 「真正切換畫面」的地方，改成明確捲回頂端

以下這些函式呼叫 `render()` 的目的是「顯示一個全新的畫面」，不是「更新目前畫面」，所以要在它們呼叫 `render()` 之後**額外加一行 `window.scrollTo(0, 0);`**，蓋掉上面 `render()` 預設的「保留捲動位置」行為，讓使用者看到新畫面時是從頂端開始：

- `goToProfile()`（351-356）
- `logout()`（359-368）
- `goToTopicSelect()`（370-374）
- `goToTopic()`（408-412）
- `goToMenu()`（427-430）
- 其餘 `restart*`／`goTo*` 這類「切換到別的畫面」的函式（約 630-660 行附近，實際位置可能因為這次改動而略有偏移，找 function 名稱比對就好）
- 首頁／挑戰紀錄／成就徽章／個人檔案／關於本站這幾個分頁之間互相切換的進入點（`renderFavorites`、`renderStats`、`renderAbout`、`renderBadges` 對應的「點分頁按鈕」callback，不是這幾個 render 函式本身）

**判斷原則**（交給你實際過一輪程式碼確認完整性，上面列的清單不一定 100% 齊全）：如果這個函式的目的是「把 `screen`／目前主題／目前分頁這類狀態換成不一樣的值，然後顯示一個邏輯上『不同的頁面』」，就該加這行；如果只是「同一個畫面裡因為使用者操作要更新一部分內容」（例如答題後換下一題、展開徽章提示、收藏／取消收藏一個單字），就不要加，讓 `render()` 預設的保留行為生效即可。

## 二、每個頁面加上「回到頂端」按鈕

**放置位置**：`render()`（main.ts:3455-3479）裡，原本 if/else-if 畫面分派邏輯跑完、`appendBadgeUnlockModal()` 那段之後，**不分畫面**、無條件加一個浮動按鈕appended 到 `#app`——比照 `appendBadgeUnlockModal()` 那樣「不管目前是哪個 screen，`render()` 結束前都會加上」的寫法，這樣包含登入/選使用者畫面（`renderProfileSelect`）跟七種遊戲題型畫面（`renderVocabOverview`／`renderFlashcards`／`renderMatching`／`renderOrdering`／`renderFillBlank`／`renderChoice`／`renderCapstone`，這些畫面目前不會呼叫 `appendShell()`）都會出現，不會有頁面漏掉。

```ts
function appendBackToTopButton(): void {
  const btn = document.createElement("button");
  btn.className = "back-to-top-btn";
  btn.setAttribute("aria-label", "回到頂端");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  app!.appendChild(btn);
}
```

在 `render()` 裡 `appendBadgeUnlockModal()` 那一段之後加一行 `appendBackToTopButton();`。

**顯示邏輯**：按鈕只在使用者往下捲動一段距離之後才出現（避免頁面本來就很短、根本用不到時還佔畫面），用 CSS class 切換＋一個 `scroll` 事件監聽器控制，不用每次 `render()` 重建時都重新綁定監聽器（`render()` 砍掉重建整個 DOM，`scroll` 監聽器建議綁在 `window` 上、只在整個 app 初始化時綁一次，不要放進 `render()` 或 `appendBackToTopButton()` 裡面，不然每次重畫都會疊加重複綁定）。CSS 大致：

```css
.back-to-top-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-circle);
  border: none;
  background: var(--color-primary-500);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
.back-to-top-btn.visible {
  opacity: 1;
  pointer-events: auto;
}
```

（`z-index: 90` 刻意比 `.modal-overlay` 的 `100` 低一階，避免蓋在燈箱／彈窗上面；圓形浮動按鈕、陰影、主色都直接沿用既有的 `--radius-circle`／`--shadow-md`／`--color-primary-500`，跟 `.modal-close-btn`（style.css 984-995）視覺風格一致，不用另外設計新樣式。）

`scroll` 事件監聽器（放在 app 初始化的地方，例如 `main.ts` 最外層啟動邏輯附近，只執行一次）：

```ts
window.addEventListener("scroll", () => {
  const btn = document.querySelector(".back-to-top-btn");
  if (!btn) return;
  btn.classList.toggle("visible", window.scrollY > 300);
}, { passive: true });
```

（`300` 這個門檻值可以依實際試玩體感調整，不用照抄死值。）

## 驗證

1. `npm run build`（含 `tsc --noEmit`）通過。
2. 全部 `verify-*.ts` 重跑一次確認沒有連帶影響（這次改動不涉及任何驗證腳本檢查的內容邏輯，但還是照慣例全部跑一次比較保險）。
3. 實際打開試玩：
   - 進入任一遊戲題型（例如配對），往下捲一點、答一題，確認畫面**不會**跳回頂端，捲動位置維持原地。
   - 點徽章卡片看提示文字，確認捲動位置不會跳動。
   - 從主題選單點進一個主題（真正換頁），確認新頁面是從頂端開始顯示（這是預期行為，不是 bug）。
   - 登出、切換分頁（首頁／挑戰紀錄／成就徽章／個人檔案）也都確認是從頂端開始顯示新頁面。
   - 往下捲動超過門檻值，確認右下角出現「回到頂端」圓形按鈕；點擊後平滑捲回頂端；捲回頂端後按鈕應該消失（`scrollY <= 300`）。
   - 選使用者畫面（登入前）、七種遊戲題型畫面都各自確認「回到頂端」按鈕有出現（這幾個畫面不走 `appendShell()`，容易漏放）。
4. `node scripts/build-standalone-demo.mjs` 重新產生 `app/demo-standalone.html`，並 `cp app/demo-standalone.html ../demo-standalone.html` 同步專案根目錄那份。
