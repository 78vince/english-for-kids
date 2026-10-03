# Handoff Prompt：手機版排版第二輪修正（題型選單標題、字卡圖示排列、徽章彈窗遮罩覆蓋不完整）

## 背景

上一輪 handoff（`docs/handoff-prompt-stage-banner-rwd-and-passage-tts-bug.md`）修完 `.stage-banner` 窄螢幕堆疊之後，使用者繼續用手機實測，又回報三個排版問題，這次都集中在 `app/src/style.css`（問題 1、2 純 CSS）跟 `app/src/main.ts`（問題 2 需要調整一點 DOM 結構、問題 3 需要加一段 body 捲動鎖定邏輯）。`content/` 完全不用動。

---

## 問題 1：「題型選單」標題在窄螢幕一樣被返回按鈕擠壓

### 根因

上一輪只修了 `.stage-banner`（四種題型畫面＋單字總覽共用），但「主題內的題型選單」畫面（`renderMenu()`，標題例如「Pronouns 代名詞 — 題型選單」）用的是**另一個 class**：`.game-header--with-back`（`app/src/style.css` 第 87-101 行）：

```css
.game-header--with-back {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.game-header--with-back h1 {
  padding-right: 0;
}

.game-header--with-back .back-btn {
  position: static;
  flex-shrink: 0;
}
```

同樣沒有窄螢幕斷點，同一種「標題文字被右側按鈕擠壓」問題在這裡重演——而且這個畫面的返回按鈕文字是「← 返回選擇主題」，比 `.stage-banner` 的「← 返回選單」還多兩個字，窄螢幕下問題更明顯。

`main.ts` 第 1493-1521 行 `renderMenu()` 建立這個標題：

```ts
const header = document.createElement("header");
header.className = "game-header game-header--with-back";
// ...（textWrap 放 h1 + .progress，header.appendChild(textWrap)）
// ...（backBtn.className = "back-btn"，header.appendChild(backBtn)）
```

### 修法

比照上一輪 `.stage-banner` 的做法，在 `.game-header--with-back` 規則後面（或跟 `.stage-banner` 的 640px 區塊合併也可以，看你們覺得哪種比較好維護）新增：

```css
@media (max-width: 640px) {
  .game-header--with-back {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
}
```

`.game-header--with-back .back-btn` 本來就是 `position: static; flex-shrink: 0;`，改成 column 後會自然掉到標題文字下面獨立一行；不用額外處理靠左/靠右，因為這個標題只有一顆按鈕（不像 `.stage-banner-actions` 有兩顆需要 `justify-content: flex-end`），保持預設靠左即可，或依視覺習慣統一加 `align-self: flex-end`，兩種都合理，你們評估。

### 驗證

- 比照 `verify-stage-banner-responsive.ts`，可以直接擴充同一支腳本、或新增一支同類的（`verify-game-header-with-back-responsive.ts`）驗證 640px 斷點內 `.game-header--with-back` 是否為 `flex-direction: column`，斷點外維持 `justify-content: space-between`。
- 手機寬度（375px／390px）實測「主題內題型選單」畫面，確認標題跟返回按鈕上下分開、不再擠壓。

---

## 問題 2：字卡／測驗畫面裡「文字」跟「喇叭／星星圖示」窄螢幕改上下排列（圖示在上、文字在下）

### 涉及的三個地方

使用者的訴求是：窄螢幕下，凡是「一段文字＋旁邊幾個圖示按鈕（喇叭播放／星星收藏）左右排在同一行」的地方，都改成「圖示們在上面一行、文字在下面一行」，避免長片語（例如 "excuse me"／"you're welcome"／"can you help me" 這種兩三個字的片語）換行時圖示卡在文字中間高度、看起來很擠。程式裡符合這個樣式的地方有三處，都在 `app/src/style.css`：

1. **`.flashcard-word-row`**（第 1673-1678 行）：字卡暖身正面，單字文字＋🔊播放鍵＋⭐收藏星星。對應 `main.ts` 第 2523-2538 行，DOM 順序是：`wordEn`（文字）→ `replayWordBtn`（🔊）→ 收藏星星。
2. **`.flashcard-example-row`**（第 1837-1842 行）：字卡暖身／單字總覽的例句區塊，英文例句＋🔊播放鍵。對應 `main.ts` 第 1631-1648 行 `buildExampleSentenceBlock()`，DOM 順序是：`exampleEn`（文字）→ `replayExampleBtn`（🔊）。
3. **`.flashcard-quiz-reveal`**（第 1866-1871 行）：測驗答完後顯示「👉 正確單字（中文意思）」＋🔊播放鍵。對應 `main.ts` 第 2599-2614 行，DOM 順序是：`revealText`（文字）→ `revealReplayBtn`（🔊）。

三處目前都是 `display: flex; align-items: center;`（`.flashcard-word-row`／`.flashcard-example-row` 還多一個 `justify-content: center;`），文字在 DOM 順序上都排在圖示「前面」。

### 修法

**問題 1 的情況（`.flashcard-word-row`）比較特殊**，因為圖示有兩顆（🔊＋⭐），使用者要的是「兩顆圖示同一行在上面」，不是「喇叭一行、星星一行、文字一行」分成三行。建議調整 `main.ts` 第 2523-2538 行，把 🔊 跟 ⭐ 包進一個共用的小容器，再讓 `.flashcard-word-row` 用 `flex-direction: column-reverse` 呈現（利用 DOM 順序「文字在前、圖示容器在後」＋ `column-reverse` 反過來排，圖示自然跑到文字上面，不用額外用 `order` 屬性）：

```ts
const wordRow = document.createElement("div");
wordRow.className = "flashcard-word-row";
const wordEn = document.createElement("span");
wordEn.className = "flashcard-word-en";
wordEn.textContent = vocab.en;
wordRow.appendChild(wordEn);

// 🔊／⭐ 包成一個共用小容器，窄螢幕用 column-reverse 呈現時，這兩顆才會排在同一行
// （而不是各自變成獨立一行），詳見 style.css 的 .flashcard-word-icons。
const iconsWrap = document.createElement("div");
iconsWrap.className = "flashcard-word-icons";
const replayWordBtn = document.createElement("button");
replayWordBtn.type = "button";
replayWordBtn.className = "flashcard-replay-btn";
replayWordBtn.textContent = "🔊";
replayWordBtn.setAttribute("aria-label", "重播單字發音");
replayWordBtn.addEventListener("click", () => speakEnglish(vocab.en));
iconsWrap.appendChild(replayWordBtn);
iconsWrap.appendChild(buildFavoriteStarButton(activeProfile!.id, vocab.id));
wordRow.appendChild(iconsWrap);
card.appendChild(wordRow);
```

CSS（`style.css`）：

```css
.flashcard-word-icons {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

@media (max-width: 640px) {
  .flashcard-word-row {
    flex-direction: column-reverse;
    gap: var(--space-2);
  }
}
```

**問題 2、3 的情況（`.flashcard-example-row`／`.flashcard-quiz-reveal`）只有一顆圖示，不用包容器，直接靠 `column-reverse` 就能讓 DOM 順序「文字在前、圖示在後」在窄螢幕下自動變成「圖示在上、文字在下」，`main.ts` 完全不用改：**

```css
@media (max-width: 640px) {
  .flashcard-example-row {
    flex-direction: column-reverse;
    align-items: center;
    gap: var(--space-2);
  }

  .flashcard-quiz-reveal {
    flex-direction: column-reverse;
    align-items: flex-start; /* 跟桌面版一致靠左，只有 .flashcard-word-row/.flashcard-example-row 是置中排版 */
    gap: var(--space-2);
  }
}
```

### 驗證

- 新增一支 `verify-flashcard-icons-responsive.ts`（或併進既有的響應式驗證腳本），確認：
  - `.flashcard-word-icons` 規則存在，且 `main.ts` 裡 `replayWordBtn`／收藏星星按鈕都是這個容器的子節點（用 regex 或字串比對確認 `iconsWrap.appendChild` 有兩次呼叫，且順序在 `wordRow.appendChild(wordEn)` 之後）。
  - 640px 斷點內 `.flashcard-word-row`／`.flashcard-example-row`／`.flashcard-quiz-reveal` 都是 `flex-direction: column-reverse`。
  - 斷點外三者都維持原本 `flex-direction: row`（預設值，沒有另外宣告也算通過）。
- 手機寬度實測字卡暖身（Family 或 Greetings 主題，看得到中文/英文都短的單字＋像 "excuse me" 這種比較長的片語兩種情況）、測驗答完後的「👉 正確單字」列，確認圖示都跑到文字上面、排版不再擁擠。

---

## 問題 3：「獲得新徽章」彈窗遮罩，使用者往上滑動後跳出時覆蓋不完整

### 現況與根因分析

使用者描述：作答時把畫面往上滑，讓頂部的 `.stage-banner` 滑出可視範圍之外（只看得到作答區），全部答完、跳出「獲得新徽章」pop 時，半透明遮罩（`.modal-overlay`）沒有完整蓋住整個畫面，底部露出一塊沒被遮住的區域。

檢查過 `.modal-overlay`（`style.css` 第 1115-1124 行）：

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(43, 42, 74, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  z-index: 100;
}
```

CSS 本身寫法沒有問題（`position: fixed; inset: 0;` 是正確、標準的滿版遮罩寫法），也確認過沒有任何祖先元素（`body`／`#app`）有 `transform`／`filter`／`will-change` 之類會讓 `position: fixed` 失效、變成相對於某個祖先容器定位的樣式規則。

推測根因：這是 **iOS Safari 的已知行為**——使用者往下捲動時，Safari 網址列／工具列會自動收合，讓「視覺可視區域」變高；`position: fixed` 元素理論上應該即時跟著新的可視區域重新計算尺寸，但 Safari 在某些情況下（尤其是元素是在使用者捲動之後、工具列已經收合的狀態下才被插入 DOM）不會正確重新計算，導致 fixed 元素维持在插入當下算出來的高度，跟實際可視區域對不齊，畫面下方就會露出沒被遮住的縫隙。

檢查過 `main.ts`，目前**完全沒有任何「開啟彈窗時鎖定背景捲動」的邏輯**（全域搜尋 `document.body.style`／`overflow.*hidden`／`scrollTo` 都只有「切換到全新畫面」時呼叫 `window.scrollTo(0, 0)` 重置捲動位置，跟疊加在當前畫面上的彈窗——`appendModalShell()`／`appendBadgeUnlockModal()`——完全無關）。彈窗跳出時背景仍然可以捲動，這本來就不是理想的彈窗互動（使用者可能誤觸背景內容），加上鎖定背景捲動也是解決這類 iOS fixed 定位缺口問題最常見、最可靠的做法（讓瀏覽器在彈窗開啟期間穩定住可視區域，不會再有工具列收合造成的尺寸不同步）。

### 修法

在 `main.ts` 新增一對共用的捲動鎖定函式，開啟任何 `.modal-overlay` 時呼叫鎖定、關閉時呼叫解鎖，兩個既有的彈窗建構函式都要接上：

```ts
// 開啟任何 .modal-overlay（變更頭像／修改名稱／首次進站提醒／獲得新徽章……）期間，
// 鎖定背景捲動：一來避免使用者誤觸背景內容，二來這是解決 iOS Safari「網址列收合後
// position:fixed 遮罩沒有正確重新計算可視高度、底部露出縫隙」這類問題最常見的做法——
// 鎖定捲動能讓瀏覽器在彈窗開啟期間穩定可視區域尺寸。用一個計數器而不是布林值，
// 是為了保險起見支援「巢狀/連續開啟多個彈窗」的情境（目前程式應該不會真的疊兩層，
// 但用計數器不會因為疊層而不小心提早解鎖）。
let modalScrollLockCount = 0;
let savedScrollY = 0;

function lockBodyScroll(): void {
  if (modalScrollLockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
  }
  modalScrollLockCount++;
}

function unlockBodyScroll(): void {
  modalScrollLockCount = Math.max(0, modalScrollLockCount - 1);
  if (modalScrollLockCount === 0) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo(0, savedScrollY);
  }
}
```

用 `position: fixed` 鎖 `body`（而不是單純 `overflow: hidden`）是刻意的：只用 `overflow: hidden` 在 iOS Safari 上常常鎖不住背景捲動（已知的另一個 iOS 特有問題），`position: fixed` 是比較可靠、業界常見的替代做法；副作用是需要手動記錄／還原捲動位置（`savedScrollY`），不然解鎖後畫面會跳回頂部。

接上兩個彈窗建構函式：

- `appendModalShell()`（第 2334 行）開頭呼叫 `lockBodyScroll()`；`closeProfileDetailModal()`（負責關閉這個彈窗的既有函式）裡呼叫 `unlockBodyScroll()`。
- `appendBadgeUnlockModal()`（第 3648 行）開頭呼叫 `lockBodyScroll()`；`closeBadgeUnlockModal()`（既有的關閉函式）裡呼叫 `unlockBodyScroll()`。

麻煩實作時先找一下 `closeProfileDetailModal()`／`closeBadgeUnlockModal()` 目前的實際內容（我這邊沒有把兩個函式的完整定義都翻出來，只確認了呼叫點），確認每個「可能導致彈窗消失」的路徑（叉叉／點遮罩／確認鈕／未來如果新增 ESC 鍵關閉）都會經過同一個關閉函式，才能保證 `unlockBodyScroll()` 一定會被呼叫到、不會卡死背景捲動。

### 驗證

- `npm run build` 通過。
- 這是最需要在真實 iOS Safari 上實測才能確認有沒有解決的一項（沒有瀏覽器的沙盒環境沒辦法重現這個 bug，更沒辦法確認修法有沒有效）：麻煩重現使用者原本的操作（作答時往上滑動把 `.stage-banner` 滑出畫面外，答完整輪跳出「獲得新徽章」pop），確認遮罩這次有完整覆蓋整個畫面、沒有縫隙；也麻煩測一下「變更頭像」「修改名稱」這兩個共用 `appendModalShell()` 的既有彈窗，確認鎖定/解鎖背景捲動沒有把原本正常的行為弄壞（例如彈窗關閉後畫面跳掉、捲動位置跑掉）。
- 如果鎖定/解鎖背景捲動之後，實測發現遮罩依然偶爾覆蓋不完整，可以考慮進一步的候選方向：彈窗開啟當下額外強制 `window.scrollTo(0, 0)`（讓工具列穩定收合狀態），或改用 `100dvh`（dynamic viewport height）相關的 CSS 技巧；這些沒有在這份 handoff 裡直接給出實作，因為沒辦法在沒有瀏覽器的環境驗證哪個對這個特定情境比較有效，麻煩先測過上面的鎖定捲動修法，真的不夠再視情況追加。

## 不需要改的地方

- `content/` 完全不用動，三個問題都跟主題內容資料無關。
- 不用動 `speech.ts`（上一輪的 Mia／RWD handoff 已經處理完，這次是全新的三個問題）。
