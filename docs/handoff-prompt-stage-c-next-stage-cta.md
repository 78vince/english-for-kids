# Handoff：Stage C 完成畫面沒有引導進入 Stage D 綜合關卡

## 背景

使用者截圖回報：完成某主題的 Stage C（短文理解）後，畫面只顯示「從頭再玩一次（Stage A）」跟「回選單」兩顆按鈕，沒有任何引導前往 Stage D 綜合關卡的按鈕，玩家得自己回選單才找得到 Stage D。

對照 Stage D 自己通過後的畫面（`renderCapstone()`，`main.ts` 約第 4061-4094 行）：**已經正確示範了這個模式**——如果該主題有 Stage E 會話練習，會優先顯示一顆橘色 reward 按鈕「💬 進入 Stage E 會話練習 →」，「從頭再玩一次」則降級成次要按鈕。Stage C 完成畫面（`renderChoice()`，約第 3924-3963 行）當初漏掉了這個「導向下一關」的按鈕，這份 handoff 只補這一個缺口，不用重新設計整套邏輯。

## 修正：`renderChoice()` 的完成畫面補上「前往 Stage D」按鈕

`app/src/main.ts` 第 3951-3963 行目前：

```ts
const restartBtn = document.createElement("button");
// 這是整個主題四種題型都跑完一輪的「破關獎勵」時刻，用 reward 配色（橘色）
// 特別標出來，跟一般的「下一題／下一關」淺藍色按鈕做出區隔。
restartBtn.className = "primary-btn primary-btn--reward";
restartBtn.textContent = "從頭再玩一次（Stage A）";
restartBtn.addEventListener("click", restartEverything);
footer.appendChild(restartBtn);

const menuBtn = document.createElement("button");
menuBtn.className = "secondary-btn";
menuBtn.textContent = "回選單";
menuBtn.addEventListener("click", goToMenu);
footer.appendChild(menuBtn);
```

改成跟 `renderCapstone()` 同一套模式——Stage D 綜合關卡的按鈕優先用 reward 配色排第一顆，「從頭再玩一次」降級成次要按鈕：

```ts
const nextStageBtn = document.createElement("button");
// Stage A→B-1→B-2→C 都跑完一輪，自然的下一步是 Stage D 綜合關卡，用 reward 配色
// （橘色）凸顯這是建議的下一步，比照 renderCapstone() 完成畫面「進入 Stage E」
// 按鈕的同一套模式。
nextStageBtn.className = "primary-btn primary-btn--reward";
nextStageBtn.textContent = "🏆 前往 Stage D 綜合關卡 →";
nextStageBtn.addEventListener("click", goToCapstone);
footer.appendChild(nextStageBtn);

const restartBtn = document.createElement("button");
restartBtn.className = "secondary-btn"; // 原本是 primary-btn--reward，降級成次要按鈕
restartBtn.textContent = "從頭再玩一次（Stage A）";
restartBtn.addEventListener("click", restartEverything);
footer.appendChild(restartBtn);

const menuBtn = document.createElement("button");
menuBtn.className = "secondary-btn";
menuBtn.textContent = "回選單";
menuBtn.addEventListener("click", goToMenu);
footer.appendChild(menuBtn);
```

`goToCapstone()`（第 690-719 行）已經是現成的函式，目前只有選單的 stage 切換（第 460 行 `goToStage()`）在用，直接呼叫即可，不用另外處理狀態——它會自己用 `currentTopic`／`currentPassage` 組出 Stage D 需要的題目，跟從選單點進去的效果完全一樣。

## 不用改的部分

- `renderCapstone()`（Stage D 完成畫面）本身邏輯正確，不用動，這次只是把 Stage C 補成跟它一致。
- 不用检查「這個主題是否真的有 Stage D」——目前所有主題都有 Stage D 綜合關卡（跟 Stage E 會話練習不一樣，Stage E 不是每個主題都有，`renderCapstone()` 才需要用 `hasConversation` 判斷要不要顯示），所以 Stage C 完成畫面可以直接顯示這顆按鈕，不用加條件判斷。

## 驗證

- `npm run build` 要過，全部 `verify-*.ts` 重跑一次。
- 手動測試：任一主題玩到 Stage C 全部完成，確認畫面出現「🏆 前往 Stage D 綜合關卡 →」橘色按鈕排第一顆，點下去會直接進入 Stage D 綜合關卡（不用回選單再點一次）；「從頭再玩一次」「回選單」兩顆按鈕依然正常運作。
