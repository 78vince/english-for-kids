# Handoff：翻牌配對改成獨立 iframe 頁面＋postMessage 橋接（遊戲室架構升級）

## 背景與範圍界定

這不是新功能，是**架構重構**：把現在已經上線、已經迭代 6 輪打磨過（HANDOFF 9.123～9.128：開局記憶倒數、三關關卡機制、洗牌位移動畫、5 種音效、「再玩一次要扣代幣」）的翻牌配對，從「跟主站共用同一支 `main.ts` 的 DOM 渲染邏輯」，改成「獨立打包成自己的頁面，用 `<iframe>` 嵌進遊戲室畫面裡」。

**目的**：之後想加更多元、更複雜的遊戲類型（例如想用專門的遊戲函式庫做比較吃力的 Canvas 動畫遊戲）時，可以獨立開發、獨立打包，不用逼每一款新遊戲都遵守 `main.ts` 現在的純 DOM 操作寫法，也能順便減輕 `main.ts` 主要 bundle 過大的問題（`npm run build` 目前一直跳出「chunk 超過 500KB」的警告，主要就是 `main.ts` 打包出來高達 10MB）。**這不是為了讓翻牌配對本身變得更好玩**，這款遊戲的玩法、規則、手感完全不變，這次只改「裝在哪裡執行」。

使用者已經確認的關鍵方向：**遊戲進行中不需要跟外層溝通代幣**（配對、破關這些過程完全是遊戲自己的事），**但「再玩一次」這個動作因為要扣代幣，代幣的餘額跟扣款邏輯只存在於主站（parent）這邊，遊戲（iframe）沒辦法自己決定/執行扣款，所以這個動作需要 postMessage 橋接**。這份 handoff 就是照這個範圍寫的：遊戲本身的規則/內容完全不動，只重新分配「哪段程式碼跑在哪裡」，並且把「再玩一次」這個唯一需要跨頁溝通的動作，設計成乾淨的訊息協定。

**技術補充（背景知識，不影響設計，但說明「為什麼還要特地做橋接」）**：因為這個 iframe 頁面會跟主站部署在同一個網域下（都在 `78vince.github.io/english-for-kids/`，屬於同源），技術上 iframe 頁面其實可以直接 `import` `gameTokens.ts` 去讀寫同一份 localStorage，不一定要透過 postMessage 才能碰得到代幣資料。**但這裡刻意選擇不讓 iframe 直接碰代幣邏輯**，原因：
1. 代幣的「夠不夠、要不要顯示鼓勵文案、扣款失敗要導去哪裡」這些決策邏輯全部收斂在主站一個地方，之後不管加幾款新遊戲，經濟規則都只有一份，不會每加一款遊戲就要在該遊戲的程式碼裡重寫一次「代幣不夠時要怎麼辦」。
2. 遊戲本身變成完全不需要知道「代幣」這個概念存在的獨立單元，之後想拿掉整個代幣機制、或改成別的消費方式，只要動主站程式碼，完全不用去改任何一款遊戲。

## 1. 訊息協定：新增 `app/src/gameBridge.ts`

父頁面（`main.ts`）跟每一支獨立遊戲的進入點都要 `import` 這份型別定義，兩邊共用同一份型別，不要各自寫字串常值，避免其中一邊打錯字漏接訊息：

```ts
// gameBridge.ts——遊戲室各獨立遊戲（iframe）跟主站（parent）之間的 postMessage 訊息格式。
// 訊息一律帶一個固定的 channel 欄位，parent／iframe 收到 message 事件時都要先檢查
// event.data?.channel 是不是這個值，避免跟瀏覽器擴充功能或其他來源送來的雜訊訊息搞混。

export const GAME_BRIDGE_CHANNEL = "englishForKids.gameBridge.v1" as const;

/** 遊戲（iframe）→ 主站（parent） */
export type GameToParentMessage =
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "ready" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "requestReplay" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "exitToRoom" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "complete" };

/** 主站（parent）→ 遊戲（iframe） */
export type ParentToGameMessage =
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "replayApproved" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "replayDenied" };
```

四種「遊戲→主站」訊息的意義：

- **`ready`**：iframe 頁面載入完成、遊戲引擎已經初始化好，主站可以把 loading 佔位畫面換成真正的 iframe 內容（避免使用者看到 iframe 還沒套好版就先閃一下空白）。
- **`requestReplay`**：使用者點了遊戲畫面裡的「再玩一次」按鈕。**遊戲自己完全不知道代幣夠不夠**，丟給 parent 決定。
- **`exitToRoom`**：使用者點了「返回遊戲室」。因為換畫面（離開 iframe、顯示遊戲室清單）是主站的職責，iframe 沒辦法自己叫 parent 換頁，要透過訊息請 parent 處理。
- **`complete`**：三關全部破完時通知一聲，純粹告知用途。**這次不掛任何代幣邏輯**（使用者已確認「遊戲中不需要轉代幣」），只是先把這個事件接好，之後如果真的想做「破關也能拿一點代幣」之類的功能，訊息管道已經現成，不用再回頭補接線——但這次不要自作主張加上任何加分邏輯。

兩種「主站→遊戲」回覆：

- **`replayApproved`**：扣款成功，iframe 收到後重新開一局（`new MemoryMatchGame(newPairs)`，重新抽新的配對內容，從第 1 關開始）。
- **`replayDenied`**：扣款失敗（代幣不夠）。iframe **不用做任何事**（不用顯示自己的錯誤訊息）——因為 parent 收到 `requestReplay` 後，扣款失敗的同時就會自己彈出鼓勵文案並把使用者導回遊戲室畫面，iframe 端不會再看到自己的畫面，不需要重複處理。

## 2. 父頁面（`main.ts`）：`renderMemoryMatch()` 整個改寫

現在的 `renderMemoryMatch()`（main.ts 第 2264 行起）自己 `new MemoryMatchGame()`、自己處理 DOM 渲染、FLIP 位移動畫、音效掛勾、「再玩一次」直接呼叫 `spendTokens()`——這整段渲染邏輯之後都要搬到 iframe 頁面裡（見第 4 節）。`renderMemoryMatch()` 改寫後只剩下：

```ts
function renderMemoryMatch(): void {
  appendShell("gameRoom");

  const header = document.createElement("header");
  header.className = "game-header game-header--with-back";
  // ...標題／返回按鈕維持原本的寫法（返回按鈕點擊一樣呼叫 goToGameRoom()，
  // 這個按鈕留在 parent 層級，不用透過 postMessage）

  const iframe = document.createElement("iframe");
  iframe.className = "game-iframe";
  iframe.src = "games/memory-match.html";
  iframe.title = "翻牌配對";
  app!.appendChild(iframe);

  // 只掛一次，避免每次 render() 都重複註冊（可以在畫面切走時 removeEventListener，
  // 或用一個模組層級的旗標避免重複掛，比照專案裡其餘「只掛一次」事件的既有寫法）
  window.addEventListener("message", handleGameBridgeMessage);
}

function handleGameBridgeMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return; // 同源保護，忽略其他來源的訊息
  const data = event.data as GameToParentMessage | undefined;
  if (data?.channel !== GAME_BRIDGE_CHANNEL) return;

  const iframe = document.querySelector<HTMLIFrameElement>(".game-iframe");

  if (data.type === "ready") {
    // 隱藏 loading 佔位畫面（如果有做的話）
  } else if (data.type === "exitToRoom") {
    goToGameRoom();
  } else if (data.type === "requestReplay") {
    const memoryMatchConfig = GAMES.find((g) => g.id === "memory_match");
    const cost = memoryMatchConfig?.cost ?? 0;
    const success = spendTokens(activeProfile!.id, cost);
    if (success) {
      iframe?.contentWindow?.postMessage(
        { channel: GAME_BRIDGE_CHANNEL, type: "replayApproved" } satisfies ParentToGameMessage,
        window.location.origin
      );
    } else {
      window.alert("代幣好像不太夠喔，再多學一點點就可以囉！"); // 沿用現有文案
      iframe?.contentWindow?.postMessage(
        { channel: GAME_BRIDGE_CHANNEL, type: "replayDenied" } satisfies ParentToGameMessage,
        window.location.origin
      );
      goToGameRoom();
    }
  }
  // "complete" 目前不用處理任何事，先不用寫 case
}
```

離開這個畫面時記得 `window.removeEventListener("message", handleGameBridgeMessage)`（比照專案裡其餘畫面切換時清理監聽器/計時器的既有習慣，例如 `stopPassageReadingIfAny()` 這類「離開畫面前清乾淨」的模式），避免使用者離開遊戲室後，殘留的監聽器還在背景處理訊息。

## 3. Vite 設定：新增第二個獨立進入點

比照 `voice-lab.html` 已經確立的模式（`app/voice-lab.html` + `vite.config.ts` 的 `rollupOptions.input.voiceLab`），新增：

- `app/games/memory-match.html`（新資料夾 `app/games/`，之後每加一款遊戲都在這裡加一個新的 html，統一集中管理，不要散落在 `app/` 根目錄跟 `voice-lab.html` 混在一起）
- `vite.config.ts` 的 `rollupOptions.input` 新增一行：

```ts
rollupOptions: {
  input: {
    main: "index.html",
    voiceLab: "voice-lab.html",
    memoryMatch: "games/memory-match.html", // 新增
  },
},
```

## 4. 新增 `app/src/games/memoryMatchStandalone.ts`：iframe 頁面的進入點

這支新檔案負責「原本 `renderMemoryMatch()` 裡除了『再玩一次要問 parent』之外的所有事」：

- `import { MemoryMatchGame } from "./memoryMatchGame"`——**引擎本身完全不用改**，這個 class 本來就沒有依賴 DOM（檔案開頭的註解本來就寫明「這裡只管遊戲狀態與規則，不碰 DOM」），可以直接照搬進來用。
- 抽卡邏輯：把 `main.ts` 現在的 `createMemoryMatchGame()`（第 2243-2256 行，從全部主題 vocab 隨機抽 3 組配對）整段邏輯搬過來（或者更好的做法：抽成 `content.ts` 裡一個共用函式，例如 `pickRandomVocabPairs(count)`，讓這支獨立進入點跟未來任何需要類似邏輯的地方都能重用，不用兩邊各寫一份可能之後對不齊）。
- 把 `renderMemoryMatch()` 裡除了「再玩一次的扣款判斷」之外的所有 DOM 渲染／FLIP 動畫計算／音效掛勾（`onFlip`／`onCoverBack`／`onMatch`／`onMismatch`／`onLevelComplete`／`onShuffleStart`／`onComplete` 這幾個事件的畫面反應）整段原封不動搬過來，改成掛在這個獨立頁面自己的 DOM 上。
- 初始化完成後：`window.parent.postMessage({ channel: GAME_BRIDGE_CHANNEL, type: "ready" }, window.location.origin)`。
- 「再玩一次」按鈕：

```ts
playAgainBtn.addEventListener("click", () => {
  window.parent.postMessage(
    { channel: GAME_BRIDGE_CHANNEL, type: "requestReplay" } satisfies GameToParentMessage,
    window.location.origin
  );
});
```

- 監聽 parent 的回覆：

```ts
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data as ParentToGameMessage | undefined;
  if (data?.channel !== GAME_BRIDGE_CHANNEL) return;
  if (data.type === "replayApproved") {
    game = createNewGame(); // 重新抽一組新配對，重新 new MemoryMatchGame(...)，從第 1 關開始
    render();
  }
  // "replayDenied" 不用做任何事，見上面協定說明
});
```

- 「返回遊戲室」按鈕：

```ts
backToRoomBtn.addEventListener("click", () => {
  window.parent.postMessage(
    { channel: GAME_BRIDGE_CHANNEL, type: "exitToRoom" } satisfies GameToParentMessage,
    window.location.origin
  );
});
```

- 三關全部破完（`game.onComplete`）：額外呼叫一次 `window.parent.postMessage({ channel: GAME_BRIDGE_CHANNEL, type: "complete" }, window.location.origin)`（不等回覆，純粹告知）。

## 5. CSS：獨立頁面要有自己的樣式，但顏色/字級要跟主站一致

新增 `app/src/games/memoryMatchStandalone.css`，把 `style.css` 裡 `.memory-match-*`／`.game-header--with-back`／`.game-room-card-cost`／按鈕（`.primary-btn`／`.secondary-btn`）等這個畫面用得到的規則搬過去（或用 `@import` 引用）。**特別提醒**：`style.css` 最上方應該有一份 `:root` CSS 變數（顏色、字級這些設計 token），這份獨立頁面一定要能存取到同一份變數，不然顏色/字級會跟主站對不起來——建議把 `:root` 那段變數定義抽成一個獨立的 `app/src/tokens.css`，讓 `style.css` 跟 `memoryMatchStandalone.css` 都 `@import` 它，之後改顏色/字級只要改一個地方，兩邊不會走鐘。

## 6. 響應式高度：這次先不做自動調整

iframe 內容的高度會隨階段變化（例如 `levelComplete`／`complete` 這兩個階段會多顯示一段文字跟按鈕，比 `playing` 階段稍微高一點）。**第一版先用固定的 `min-height` 撐住 `.game-iframe` 容器**（抓現在畫面實際佔用的高度，包含最高的那個階段），不要一開始就做「子頁面回報內容高度、父頁面動態調整 iframe 高度」這一層（`ResizeObserver` + 額外的 `contentHeight` 訊息類型）——這是明顯可以往後放的範圍，先確認基本的 iframe 嵌入跟「再玩一次」橋接能正常運作，之後如果真的發現內容被裁切或跑出內部捲軸，再回來加這一層。

## 7. 驗證

- `MemoryMatchGame` 引擎完全沒改，**既有 `verify-memory-match-logic.ts` 要维持全部通過，不用重寫**——如果這支測試因為這次重構而壞掉，代表不小心動到了引擎本身，要檢查是不是誤改了不該動的部分。
- 新增 `verify-game-bridge-messages.ts`（跟其餘無法在無瀏覽器環境測試跨視窗訊息的功能一樣，用靜態程式碼字串比對手法，比照 `verify-unit-completion-badges.ts` 對 `main.ts` 原始碼做字串檢查的做法）：
  1. `gameBridge.ts` 有正確 export `GAME_BRIDGE_CHANNEL` 常數，且 `main.ts` 跟 `memoryMatchStandalone.ts` 都有 `import` 這個常數（不是各自定義自己的字串）。
  2. `main.ts` 的訊息處理函式裡，`requestReplay` 的分支確實有呼叫 `spendTokens`，且成功/失敗兩條路徑都有對應的 `postMessage`／`window.alert`／`goToGameRoom` 呼叫。
  3. `memoryMatchStandalone.ts` 的「再玩一次」按鈕 click handler，**裡面沒有**直接呼叫 `spendTokens` 或 `getTokenBalance`（確認扣款責任真的收斂回 parent，沒有殘留舊架構的直接扣款程式碼，這是這次重構最容易漏改的地方，一定要用這支測試守住）。
  4. `main.ts` 的 message 事件監聽器裡有檢查 `event.origin === window.location.origin`（同源保護沒有被遺漏）。
- `npm run build` 要過（確認新的 Vite 多進入點設定正確，`dist/games/memory-match.html` 有正常產生）；`node app/scripts/build-standalone-demo.mjs` 這支目前只打包單一頁面的邏輯，**這次多了第二個 HTML 進入點，需要一併檢查這支腳本是否也要跟著調整**，才能讓 `demo-standalone.html`（單檔示範版）繼續正常運作——如果暫時沒辦法把 iframe 內容也一起塞進單檔 demo，至少要在 `demo-standalone.html` 裡明確標註「遊戲室功能在這個單檔展示版本暫不支援，請用正式站測試」，不要讓 demo 呈現一個空白或壞掉的 iframe。

## 8. 這是重構、不是加新功能——實機比對是重點,不是只看 verify script 過了就好

這次改動的每一個細節（開局記憶倒數的秒數顯示、第 2/3 關洗牌的 FLIP 位移動畫時序、5 種音效各自的觸發時機、過關訊息停留的時間、「再玩一次」按鈕文字裡的代幣圖示）都是先前 6 輪使用者實測回饋才調出來的手感，**這次搬家過程中只要有一個時間常數或事件觸發順序沒有原封不動照搬，體驗就會跟現在不一樣，而且不一定會被 `verify-memory-match-logic.ts` 抓到**（那支測試只測遊戲邏輯，不測畫面時序/動畫）。務必實機（或 `app/demo-standalone.html`）玩一輪「搬家前」跟「搬家後」的版本互相比對，包含：開局倒數數字跑動的節奏、第 2/3 關洗牌動畫滑動的流暢度、翻牌/蓋牌/答對/答錯/過關五種音效有沒有正常在對的時機響、「再玩一次」點下去代幣有沒有正確被扣、代幣不夠時有沒有正確彈出鼓勵文案並導回遊戲室。

## 9. 值得一起考慮的時機問題（不是這份 handoff 要決定的事，但提醒一下）

目前遊戲室只有這一款翻牌配對，這次重構單純是為了「以後」要加更多元遊戲類型鋪路。如果近期沒有規劃要開發第二款、技術上真的需要跟主站分開的遊戲，也可以考慮先不急著做這次遷移，等真的要做第二款新遊戲時，兩件事一起處理（把翻牌配對也一併搬過去），會比「現在搬一次、之後可能又要因應新遊戲的需求再調整橋接協定一次」更有效率。這個時機點的判斷交給你決定，這份 handoff 已經把完整的遷移方案準備好，可以隨時執行。
