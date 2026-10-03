# Handoff：遊戲室導覽圖示換掉骰子＋翻牌配對從清單移除後的收尾

## 背景

使用者三項要求：

1. 移除「翻牌配對」遊戲。
2. 剩下兩款遊戲（填字遊戲、戳泡泡）的代幣費用統一改成 5 代幣。
3. 「遊戲室」導覽列圖示目前是骰子圖案，使用者要求不要用骰子，換一個替代圖示。

第 1、2 項是 content 端可以直接處理的：`content/games/games.json` 已經把 `memory_match` 那筆移除、`crossword`／`bubble_pop` 的 `cost` 都改成 `5`、`order` 重新編號成 1／2。因為 `content.ts` 是用 `import.meta.glob`／直接 import `games.json` 讀取整份清單（`GAMES` 陣列），遊戲室選單本來就是照這份清單動態產生（`visibleGames = GAMES.filter(g => g.status !== "disabled")`），**這部分不需要任何 App 端程式改動**，重新 build／部署後選單就會少一個、代幣費用也會同步變成 5。

第 3 項圖示是寫死在 `app/src/main.ts` 的 SVG 字串裡，這個需要 App 端動手改。

## 1. 導覽列圖示：換掉骰子

`app/src/main.ts` 第 1246-1256 行的 `NAV_ICONS` 物件，第 1251-1252 行：

```ts
  // 遊戲室：骰子圖案（正方形＋幾個點），跟其餘導覽圖示同一套單色線條風格。
  gameRoom: `<svg ${NAV_ICON_VIEWBOX}><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none"/></svg>`,
```

改成一個掌上型遊戲搖桿（gamepad）圖案，沿用同一套單色線條風格（`NAV_ICON_VIEWBOX`：`stroke="currentColor"`、`stroke-width="2"`，小按鈕點沿用骰子原本「實心填色小圓點」的畫法）：

```ts
  // 遊戲室：掌上型遊戲搖桿圖案（機身＋十字方向鍵＋兩顆按鈕），跟其餘導覽圖示同一套單色線條風格。
  gameRoom: `<svg ${NAV_ICON_VIEWBOX}><rect x="3" y="8" width="18" height="9" rx="4.5"/><line x1="7.5" y1="10.5" x2="7.5" y2="14.5"/><line x1="5.5" y1="12.5" x2="9.5" y2="12.5"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="13.5" r="1" fill="currentColor" stroke="none"/></svg>`,
```

視覺說明：一個圓角矩形機身、左邊一個十字方向鍵（兩條交叉線段）、右上兩顆實心小圓點當作按鈕（沿用骰子圖案原本「用小實心圓點表示細節」的畫法，只是這次排成搖桿按鈕的斜對角，不是骰子的五點骰面）。跟現有 `home`／`stats`／`badges` 等圖示一樣走簡單幾何線條，不需要額外套件或圖片素材。

改完之後直接在 `demo-standalone.html` 或 `npm run dev` 看一下導覽列「遊戲室」那個位置，確認：未選取／滑過／選取中三種狀態的顏色切換跟其他圖示一致（這是靠 CSS 用 `currentColor` 自動處理，理論上不用另外調整）、圖示本身不會因為新形狀比骰子略寬而跟旁邊文字擠在一起（`NAV_ICON_VIEWBOX` 的 `width="20" height="20"` 沒有變，正常不會有這個問題，但建議還是看一眼）。

如果這個搖桿造型你們看了覺得不夠滿意，備選方案是拼圖片形狀（呼應填字遊戲跟遊戲室整體「玩遊戲」的意象），可以用類似大小的一塊拼圖 outline 圖形替代，需要的話我可以再補一版。

## 2. 翻牌配對移除後，遺留的程式檔案（非急件，可自行評估要不要清）

`memory_match` 已經從 `content/games/games.json` 移除，使用者不會再在遊戲室選單看到它、也點不到它。但當初遷移成 iframe 架構時新增的這些程式檔案目前還留在專案裡，變成沒有入口可以觸發的「死程式碼」，不影響運作（沒人會載入到它們），純粹是專案整潔度的考量，是否清除、什麼時候清除由 App 端自行判斷：

- `app/games/memory-match.html`
- `app/src/games/memoryMatchStandalone.ts`
- `app/src/games/memoryMatchGame.ts`（純邏輯 engine）
- `vite.config.ts` 裡 `rollupOptions.input` 對應 `memory-match` 那個進入點設定
- `app/scripts/verify-memory-match-logic.ts`（既有驗證腳本，遊戲移除後這支腳本測的邏輯已經沒有實際入口在用，但腳本本身跑起來應該還是會過，不會因為移除而報錯）

不建議倉促清除——之後如果想把翻牌配對重新加回來（例如只是暫時下架而非永久移除），這些檔案留著可以直接把 `games.json` 的項目加回來就復活，不用重寫。如果確定是永久移除，之後有空再一次性清乾淨即可，這次先不動這部分。

## 3. 驗證

- `npm run build` 要過。
- 既有 `verify-*.ts` 全部重跑一次（尤其確認移除 `memory_match` 沒有讓任何驗證腳本因為找不到這筆資料而報錯——理論上不會，因為所有 verify 腳本都是讀取當下的 `games.json` 內容去驗證格式，不是寫死驗證特定三款遊戲存在）。
- 手動測試：進遊戲室確認只剩「填字遊戲」「戳泡泡」兩個項目、費用都顯示 5 代幣；導覽列「遊戲室」圖示變成搖桿而不是骰子。
