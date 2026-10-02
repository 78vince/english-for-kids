# Handoff：Stage E 會話練習完成畫面——漏用 v5 新色階 + 誤用轉場按鈕慣例（2 處同類型問題）

## 背景

使用者截圖比對 Stage C→D、Stage D→E、Stage E 完成畫面三張截圖，回報三個問題：

1. 「使用的顏色系統沒有依照原本的設定」
2. 「按鈕的順序排列沒有依照先前的方式」
3. 「會話練習的綠色，參照答對時加深的設定」

逐一排查後確認：**Stage C→D、Stage D→E 兩處轉場已經正確套用 9.170／9.171 的修正**（截圖裡這兩顆按鈕的樣式、順序、文案都已經符合既有慣例）。問題出在 Stage E 自己的完成畫面（`renderConversation()`），以及連帶發現 `renderCapstone()` 裡一個同類型的既有漏網之魚，兩處都違反了「重玩／再玩一次按鈕一律用 `secondary-btn`，橘色 `primary-btn--reward` 只保留給『前往下一個選擇性關卡』的 CTA」這條全站慣例，另外還漏掉了 v5 的答對色對比度修正（v5 當初只掃了 `style.css`，沒掃到 `main.ts` 裡用 inline style 寫的這段）。

**排查方式**：全文 grep `main.ts` 裡所有 `primary-btn--reward` 與 `var(--color-success)`／`var(--color-error)` 的出現位置，確認只有以下列出的這幾處，沒有其他漏網的同類問題。

## 1. `renderConversation()`（Stage E 完成畫面，約第 4556-4567 行）——目前程式碼

```ts
controls.innerHTML = `
  <div style="padding: 16px; background: var(--color-success-tint); border: 2px solid var(--color-success); border-radius: var(--radius-lg); text-align: center;">
    <p style="font-size: 16px; font-weight: 700; color: var(--color-success); margin: 0 0 12px; line-height: 1.6;">
      🎉 太棒了！完成了 Stage E 會話練習！<br />
      共進行了 ${game.totalTurns * 2} 句對話，正確率 ${accuracy}%！
    </p>
    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
      <button type="button" class="primary-btn primary-btn--reward" id="btn-conv-restart">再練一次 💬</button>
      <button type="button" class="secondary-btn" id="btn-conv-menu">回選單</button>
    </div>
  </div>
`;
```

三個問題都出在這段：

- **顏色沒跟上 v5**：`border` 跟文字 `color` 直接用 `var(--color-success)`（裝飾性基礎色，淺綠），對比度不夠——這正是 v5 handoff 已經修過的同一種問題（答對文字對比度不足），只是 v5 當時只掃了 `style.css` 的規則，沒掃到 `main.ts` 裡這段用 inline style 寫的結算框，這次補上。背景 `var(--color-success-tint)` 本身不用改，是刻意保留的淺底色。
- **「再練一次」誤用橘色 reward 樣式**：橘色 `primary-btn--reward` 全站只保留給「前往下一個選擇性關卡」這種 CTA（目前唯一案例是 Stage D→E 那顆），重玩／再玩一次這類按鈕不管在哪個畫面都該是 `secondary-btn`，跟 Stage A→B-1、B-2→C、Stage C→D 的「從頭再玩一次」統一。這裡用了 reward 樣式是錯的。
- **還留著 💬 emoji**：9.171 定調「關卡轉場／重玩類按鈕一律不加 emoji」，這顆當初沒有被一起改到。

改成：

```ts
controls.innerHTML = `
  <div style="padding: 16px; background: var(--color-success-tint); border: 2px solid var(--color-success-700); border-radius: var(--radius-lg); text-align: center;">
    <p style="font-size: 16px; font-weight: 700; color: var(--color-success-700); margin: 0 0 12px; line-height: 1.6;">
      🎉 太棒了！完成了 Stage E 會話練習！<br />
      共進行了 ${game.totalTurns * 2} 句對話，正確率 ${accuracy}%！
    </p>
    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
      <button type="button" class="secondary-btn" id="btn-conv-restart">再練一次</button>
      <button type="button" class="secondary-btn" id="btn-conv-menu">回選單</button>
    </div>
  </div>
`;
```

（`#btn-conv-restart`／`#btn-conv-menu` 的 id 跟下面的 `addEventListener` 綁定不用動，純粹是 class／文字／顏色變數的調整。）

## 2. `renderCapstone()`（Stage D 完成畫面，第 4092-4096 行）——同一種誤用，藏在條件判斷裡

```ts
const restartBtn = document.createElement("button");
restartBtn.className = hasConversation ? "secondary-btn" : "primary-btn primary-btn--reward";
restartBtn.textContent = "從頭再玩一次（Stage A）";
restartBtn.addEventListener("click", restartEverything);
footer.appendChild(restartBtn);
```

這主題**有** Stage E 時（`hasConversation === true`），`restartBtn` 正確是 `secondary-btn`，跟截圖裡看到的一樣沒問題。但這主題**沒有** Stage E 時（`hasConversation === false`，Stage D 就是這個主題的最後一關），`restartBtn` 會變成橘色 `primary-btn--reward`——這是同一種誤用：沒有下一關可以前往的時候，不代表重玩按鈕就該升級成 reward 樣式，「重玩／再玩一次」不管在哪個情境都該是 `secondary-btn`，橘色樣式自始至終只給「前往下一個選擇性關卡」的 CTA 用，沒有 CTA 的時候就單純不出現橘色按鈕，不會轉移到別顆按鈕上。

改成固定用 `secondary-btn`，拿掉三元判斷：

```ts
const restartBtn = document.createElement("button");
restartBtn.className = "secondary-btn";
restartBtn.textContent = "從頭再玩一次（Stage A）";
restartBtn.addEventListener("click", restartEverything);
footer.appendChild(restartBtn);
```

## 不用改的部分

- Stage C→D、Stage D→E 兩顆轉場按鈕（9.170／9.171 修正的範圍）已經正確，不要再動。
- `renderConversation()`／`renderCapstone()` 的背景色 `var(--color-success-tint)` 維持不變，只有文字／邊框兩處要升級成 `-700`。
- 紙花特效 `CONFETTI_COLORS`（約第 4899-4905 行）裡的 `var(--color-success)` 是純裝飾用色，不是文字也不是邊框，不用改。
- 播放發音 🔊、提示 💡、確認 ✅ 這類功能性 emoji 按鈕依然不在範圍內。

## 驗證

- `npm run build` 要過，全部 `verify-*.ts` 重跑一次。
- 全文 grep 確認 `main.ts` 裡不再有 `var(--color-success)`／`var(--color-error)` 被當成文字或邊框色使用（紙花陣列那行除外），也不再有 `primary-btn--reward` 用在重玩/再玩一次類按鈕上（`grep -n "primary-btn--reward" app/src/main.ts` 應該只剩第 4086 行 Stage D→E 那顆）。
- 手動測試：
  - 有 Stage E 的主題玩到 Stage E 完成，確認結算框文字／邊框綠色變深、看得清楚，「再練一次」「回選單」兩顆都是白底次要按鈕樣式，文字都沒有 emoji。
  - 沒有 Stage E 的主題玩到 Stage D 完成，確認「從頭再玩一次（Stage A）」是白底次要按鈕（不是橘色）。
