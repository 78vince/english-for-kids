# Handoff：Stage C 完成畫面沒有引導進入 Stage D 綜合關卡

## 背景

使用者截圖回報：完成某主題的 Stage C（短文理解）後，畫面只顯示「從頭再玩一次（Stage A）」跟「回選單」兩顆按鈕，沒有任何引導前往 Stage D 綜合關卡的按鈕，玩家得自己回選單才找得到 Stage D。

**這份 handoff 已經執行過一次（第一版），但按鈕樣式/文案跟全站既有的「前往下一關」慣例不一致，使用者截圖比對後要求修正，以下是修正後的版本，請以這版為準重新調整。**

## 第一版的問題：借錯了慣例

App 端第一版實作把 Stage C 的「前往 Stage D」按鈕做成跟 `renderCapstone()`（Stage D 完成畫面）的「💬 進入 Stage E 會話練習 →」同一種橘色 reward 樣式、排第一顆。但比對全站其餘所有「本關卡全部完成 → 前往下一關」的畫面（字卡暖身→Stage A、Stage A→B-1、Stage B-1→B-2、Stage B-2→Stage C，共 4 處，寫法完全一致）才發現：**橘色 reward 樣式是「進入 Stage E」專屬的**，因為 Stage E 是「不是每個主題都有」的選擇性加場；Stage D 綜合關卡則是**每個主題都一定會經過的必要關卡**，跟 Stage A→B-1→B-2→C 這幾個轉場屬於同一種性質，應該套用同一套既有格式，不是比照 Stage E 那個特例。

全站既有的「前往下一關」格式（以 Stage B-2 → Stage C 為例，`main.ts` 第 3652-3662 行）：

```ts
const restartBtn = document.createElement("button");
restartBtn.className = "secondary-btn";          // 次要按鈕排第一顆
restartBtn.textContent = "重玩 Stage B-2";
restartBtn.addEventListener("click", restartOrdering);
footer.appendChild(restartBtn);

const nextStageBtn = document.createElement("button");
nextStageBtn.className = "primary-btn";           // 純藍色主要按鈕（不是 reward 橘色）排第二顆
nextStageBtn.textContent = "前往 Stage C：短文理解 →";  // 「前往 Stage X：名稱 →」，用全形冒號，沒有 emoji
nextStageBtn.addEventListener("click", goToChoice);
footer.appendChild(nextStageBtn);
```

## 修正：把 Stage C 完成畫面的按鈕改成套用這套既有格式

`app/src/main.ts` 目前（第一版實作的結果）：

```ts
const nextStageBtn = document.createElement("button");
nextStageBtn.className = "primary-btn primary-btn--reward";
nextStageBtn.textContent = "🏆 前往 Stage D 綜合關卡 →";
nextStageBtn.addEventListener("click", goToCapstone);
footer.appendChild(nextStageBtn);

const restartBtn = document.createElement("button");
restartBtn.className = "secondary-btn";
restartBtn.textContent = "從頭再玩一次（Stage A）";
restartBtn.addEventListener("click", restartEverything);
footer.appendChild(restartBtn);

const menuBtn = document.createElement("button");
menuBtn.className = "secondary-btn";
menuBtn.textContent = "回選單";
menuBtn.addEventListener("click", goToMenu);
footer.appendChild(menuBtn);
```

請改成：

```ts
const restartBtn = document.createElement("button");
// 比照 Stage A→B-1→B-2→C 既有轉場的格式：次要按鈕排第一顆。
restartBtn.className = "secondary-btn";
restartBtn.textContent = "從頭再玩一次（Stage A）";
restartBtn.addEventListener("click", restartEverything);
footer.appendChild(restartBtn);

const nextStageBtn = document.createElement("button");
// Stage D 是每個主題都會經過的必要關卡（不是像 Stage E 那樣的選擇性加場），
// 所以套用既有「前往下一關」的純藍色 primary-btn 格式，不用 reward 橘色、
// 不加 emoji，文案格式跟其餘「前往 Stage X：名稱 →」一致。
nextStageBtn.className = "primary-btn";
nextStageBtn.textContent = "前往 Stage D：綜合關卡 →";
nextStageBtn.addEventListener("click", goToCapstone);
footer.appendChild(nextStageBtn);

const menuBtn = document.createElement("button");
menuBtn.className = "secondary-btn";
menuBtn.textContent = "回選單";
menuBtn.addEventListener("click", goToMenu);
footer.appendChild(menuBtn);
```

`goToCapstone()`（第 690-719 行）維持不動，純粹是按鈕的 class／文案／順序調整。

## 3. 第三輪修正：關卡轉場按鈕一律不加 emoji／icon（含 Stage D→E 那顆）

使用者進一步要求：**全站所有「關卡轉場」按鈕都不加 emoji/icon**，連 `renderCapstone()`（Stage D 完成畫面）現有的「💬 進入 Stage E 會話練習 →」也要拿掉 💬。橘色 reward 配色維持不變（Stage E 不是每個主題都有，繼續用顏色區分這個特殊場景就夠了，不需要再疊加 emoji），純粹是拿掉文字前面的符號。

`app/src/main.ts` 第 4083-4089 行：

```ts
if (hasConversation) {
  const convBtn = document.createElement("button");
  convBtn.className = "primary-btn primary-btn--reward";
  convBtn.textContent = "💬 進入 Stage E 會話練習 →";
  convBtn.addEventListener("click", goToConversation);
  footer.appendChild(convBtn);
}
```

改成：

```ts
if (hasConversation) {
  const convBtn = document.createElement("button");
  convBtn.className = "primary-btn primary-btn--reward";
  convBtn.textContent = "進入 Stage E 會話練習 →"; // 拿掉前面的 💬，全站關卡轉場按鈕統一不加 emoji
  convBtn.addEventListener("click", goToConversation);
  footer.appendChild(convBtn);
}
```

**範圍提醒**：這次「不加 emoji」只限定在「關卡轉場」這一類按鈕（前往下一個 Stage、重玩、回選單），不包含其他功能性的 emoji 按鈕——例如播放發音的 🔊、提示按鈕的 💡「給我一點提示」、首次進站確認的 ✅「確定，開始使用」——那些 emoji 本身是按鈕功能的一部分（圖像化的播放鍵、提示燈泡），跟關卡轉場文字按鈕是不同性質，這次不動。

## 不用改的部分

- `renderCapstone()` 的 reward 橘色配色本身維持不變，只拿掉 emoji 文字。
- 不用检查「這個主題是否真的有 Stage D」——目前所有主題都有 Stage D 綜合關卡。
- 播放發音／提示／確認這類功能性 emoji 按鈕不在這次調整範圍內（見上方範圍提醒）。

## 驗證

- `npm run build` 要過，全部 `verify-*.ts` 重跑一次。
- 手動測試：
  - 任一主題玩到 Stage C 全部完成，確認畫面依序出現「從頭再玩一次（Stage A）」（白底次要按鈕）、「前往 Stage D：綜合關卡 →」（純藍色主要按鈕，不是橘色，沒有 emoji）、「回選單」三顆按鈕，排列順序跟文案風格跟 Stage B-2→C 等既有轉場畫面一致；點下去會直接進入 Stage D 綜合關卡。
  - 有 Stage E 的主題玩到 Stage D 通過，確認「進入 Stage E 會話練習 →」按鈕還是橘色 reward 樣式，但文字前面不再有 💬。
  - 播放發音（🔊）、提示（💡）等其他功能性 emoji 按鈕維持原樣，沒有被誤刪。
