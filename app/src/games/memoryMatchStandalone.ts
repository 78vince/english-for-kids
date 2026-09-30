// 翻牌配對——獨立打包的遊戲頁面（games/memory-match.html 的進入點），2026-09-29
// 架構升級：從「main.ts 自己 new MemoryMatchGame()、自己處理 DOM」搬過來，用
// <iframe> 嵌進主站的遊戲室畫面。這裡負責原本 main.ts 的 renderMemoryMatch() 除了
// 「再玩一次要問 parent 扣不扣代幣」之外的所有事：抽卡、畫面渲染、FLIP 位移動畫、
// 音效掛勾——規則、時間常數、事件觸發順序都原封不動照搬，只是換了執行的地方
// （見 docs/handoff-prompt-memory-match-iframe-migration.md）。
//
// 這支頁面刻意「完全不知道代幣這個概念存在」：不 import gameTokens.ts，不自己判斷
// 餘額夠不夠。「再玩一次」按鈕只會 postMessage 一個 requestReplay 給 parent，
// parent（main.ts）扣款成功才會回 replayApproved，這裡收到才真的重新開一局；
// 扣款失敗（replayDenied）不用做任何事——parent 那邊已經自己彈出鼓勵文案、
// 導去遊戲室了，這個 iframe 畫面不會再被使用者看到，不需要重複處理。

import { MemoryMatchGame, type MemoryCard, LEVEL_COUNT, shuffleCardCountForLevel, SHUFFLE_MOVE_DURATION_MS } from "./memoryMatchGame";
import { COIN_ICON, CARD_BACK_ICON } from "./gameIcons";
import { GAMES, pickRandomVocabPairs } from "../content";
import { playCorrectSound, playWrongSound, playRoundCompleteSound, playCardFlipSound, playCardCoverSound } from "../sound";
import { GAME_BRIDGE_CHANNEL, type GameToParentMessage, type ParentToGameMessage } from "../gameBridge";

const app = document.querySelector<HTMLDivElement>("#memory-match-app");
if (!app) {
  throw new Error("找不到 #memory-match-app 掛載點");
}

// 翻牌配對固定抽 3 組配對＝6 張卡片（3 欄 x 2 行），跟main.ts 搬過來之前的版本一致。
const PAIR_COUNT = 3;

function createGame(): MemoryMatchGame {
  return new MemoryMatchGame(pickRandomVocabPairs(PAIR_COUNT));
}

const memoryMatchConfig = GAMES.find((g) => g.id === "memory_match");
const memoryMatchCost = memoryMatchConfig?.cost ?? 0;

let game: MemoryMatchGame = createGame();

function render(): void {
  app!.innerHTML = "";

  const progressP = document.createElement("p");
  progressP.className = "progress";
  app!.appendChild(progressP);

  function syncProgress(): void {
    if (game.phase === "levelComplete") {
      progressP.textContent = `🎉 過關！準備進入第 ${game.level + 1} / ${LEVEL_COUNT} 關…`;
    } else if (game.phase === "complete") {
      progressP.textContent = "三關全部破完，太厲害了！";
    } else {
      progressP.textContent = `第 ${game.level} / ${LEVEL_COUNT} 關 —— 翻開卡片找出英文單字跟中文意思的配對`;
    }
  }

  // 開局記憶倒數用大數字顯示（第 2/3 關倒數結束後改顯示「交換位置中」提示），
  // 一眼就看得出遊戲什麼時候真正開始。
  const countdownEl = document.createElement("div");
  countdownEl.className = "memory-match-countdown";
  app!.appendChild(countdownEl);

  function syncCountdown(): void {
    if (game.phase === "reveal") {
      countdownEl.textContent = String(game.revealSecondsRemaining);
      countdownEl.style.display = "";
    } else if (game.phase === "shuffling") {
      countdownEl.textContent = "🔀";
      countdownEl.style.display = "";
    } else {
      countdownEl.style.display = "none";
    }
  }

  const grid = document.createElement("div");
  grid.className = "memory-match-grid";

  const cardButtons = new Map<string, HTMLButtonElement>();

  function syncCardButton(card: MemoryCard): void {
    const btn = cardButtons.get(card.id);
    if (!btn) return;
    btn.className =
      "memory-match-card" +
      (card.isFlipped || card.isMatched ? " memory-match-card--flipped" : "") +
      (card.isMatched ? " memory-match-card--matched" : "");
    btn.disabled = card.isMatched || game.phase !== "playing";
  }

  /** 把 grid 底下的卡片按鈕重新排列成跟 game.cards 陣列一致的順序（互換位置時
   * game.cards 陣列順序會變，DOM 節點也要跟著換，appendChild 一個已存在的子節點
   * 會把它移到最後，依序呼叫就能重新排出正確順序）。 */
  function syncGridOrder(): void {
    for (const card of game.cards) {
      const btn = cardButtons.get(card.id);
      if (btn) grid.appendChild(btn);
    }
  }

  for (const card of game.cards) {
    const cardBtn = document.createElement("button");
    cardBtn.type = "button";
    cardBtn.innerHTML = `
      <span class="memory-match-card-face memory-match-card-face--back">${CARD_BACK_ICON(22)}</span>
      <span class="memory-match-card-face memory-match-card-face--front">${card.display}</span>
    `;
    cardBtn.addEventListener("click", () => game.flip(card.id));
    cardButtons.set(card.id, cardBtn);
    syncCardButton(card);
    grid.appendChild(cardBtn);
  }

  app!.appendChild(grid);

  // 這個遊戲純粹是休閒獎勵，不記錄到 progress.ts、不影響任何徽章或積分（見最早的
  // handoff 設計背景），跟其餘題型畫面的 .game-footer 完成畫面比照辦理。
  const footer = document.createElement("footer");
  footer.className = "game-footer";
  app!.appendChild(footer);

  function syncFooter(): void {
    footer.innerHTML = "";
    if (game.phase === "complete") {
      const doneText = document.createElement("p");
      doneText.className = "done";
      doneText.innerHTML = `🎉 太厲害了，三關全部破完！<br />總共翻了 ${game.moveCount} 次就找齊所有配對。`;
      footer.appendChild(doneText);

      const playAgainBtn = document.createElement("button");
      playAgainBtn.type = "button";
      playAgainBtn.className = "secondary-btn";
      // 按鈕文字要明講「再玩一次」還是會扣代幣，不能讓使用者誤以為是免費重玩。
      playAgainBtn.innerHTML = `再玩一次<span class="game-room-card-cost">（${COIN_ICON(14)}-${memoryMatchCost}）</span>`;
      playAgainBtn.addEventListener("click", () => {
        // 這支頁面自己不知道代幣夠不夠，丟給 parent 決定；parent 回 replayApproved
        // 才會真的重新開局（見檔案最下方的 message 監聽）。
        window.parent.postMessage(
          { channel: GAME_BRIDGE_CHANNEL, type: "requestReplay" } satisfies GameToParentMessage,
          window.location.origin
        );
      });
      footer.appendChild(playAgainBtn);

      const backToRoomBtn = document.createElement("button");
      backToRoomBtn.type = "button";
      backToRoomBtn.className = "primary-btn";
      backToRoomBtn.textContent = "返回遊戲室";
      backToRoomBtn.addEventListener("click", () => {
        window.parent.postMessage(
          { channel: GAME_BRIDGE_CHANNEL, type: "exitToRoom" } satisfies GameToParentMessage,
          window.location.origin
        );
      });
      footer.appendChild(backToRoomBtn);
    } else if (game.phase === "levelComplete") {
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "稍等一下，馬上進入下一關！";
      footer.appendChild(hint);
    } else if (game.phase === "reveal") {
      const hint = document.createElement("p");
      hint.className = "hint";
      const shuffleCount = shuffleCardCountForLevel(game.level);
      hint.textContent =
        shuffleCount > 0
          ? `先記住每張卡片的位置！倒數結束後有 ${shuffleCount} 張卡片會互換位置，之後才開始翻牌。`
          : "先記住每張卡片的位置，準備好了就會自動蓋牌開始！";
      footer.appendChild(hint);
    } else if (game.phase === "shuffling") {
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "卡片正在交換位置，仔細看清楚喔！";
      footer.appendChild(hint);
    } else {
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "一次翻兩張卡片，找出英文單字跟中文意思的配對。";
      footer.appendChild(hint);
    }
  }
  syncProgress();
  syncCountdown();
  syncFooter();

  // 互換位置的 FLIP 移動動畫：onShuffleStart 在 game.cards 陣列「真正互換之前」觸發，
  // 先記錄下這幾張卡片目前的畫面座標；實際互換發生在下一次 onChange（syncGridOrder()
  // 把 DOM 節點重新排列成新順序）之後，這時候量測新座標、算出位移量，從位移量把卡片
  // 動畫回到 0（標準的 First-Last-Invert-Play 手法），做出「卡片滑到新位置」的效果。
  let pendingShuffleOldRects: Map<string, DOMRect> | null = null;
  game.onShuffleStart = (swapPairs) => {
    pendingShuffleOldRects = new Map();
    for (const [idA, idB] of swapPairs) {
      for (const id of [idA, idB]) {
        const btn = cardButtons.get(id);
        if (btn) pendingShuffleOldRects.set(id, btn.getBoundingClientRect());
      }
    }
  };

  game.onChange = () => {
    for (const card of game.cards) syncCardButton(card);

    // 2026-09-29 使用者回饋：洗牌動畫有時候只有一張牌移動、或起始位置不對。根本原因是
    // 原本這裡先跑完 syncProgress()／syncCountdown()／syncFooter()（會改變倒數數字、
    // 提示文字內容，可能讓版面重排、footer 高度改變）才量測 newRect——這些跟這兩張卡片
    // 互換無關的版面變動，會混進「舊座標→新座標」算出來的位移量裡：如果版面位移量剛好
    // 跟卡片互換的位移量互相抵銷，就會算出 dx===0 && dy===0 被跳過（看起來像「只有一張
    // 牌移動」），沒抵銷的話起始位置也會偏移（「起始位置不正確」）。修法：把 FLIP 量測
    // ／套用動畫整段搬到最前面，緊接在 syncCardButton() 之後、在任何其他會動版面的文字
    // 更新之前執行，讓 oldRect／newRect 之間只夾雜「這次互換」這一件事。
    if (pendingShuffleOldRects) {
      const oldRects = pendingShuffleOldRects;
      pendingShuffleOldRects = null;
      syncGridOrder();
      for (const [id, oldRect] of oldRects) {
        const btn = cardButtons.get(id);
        if (!btn) continue;
        const newRect = btn.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (dx === 0 && dy === 0) continue;
        btn.style.transition = "none";
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
        // 移動中的卡片要蓋在其他卡片上面，不能被旁邊沒在動的卡片擋住——用一個比其餘
        // 卡片都高的 z-index，動畫播完再拿掉（拿掉的時機用跟動畫一樣長的 setTimeout，
        // 而不是 transitionend：transitionend 在 transform 被清成空字串、且 dx/dy 剛好
        // 又是 0 時可能不會觸發，setTimeout 比較保險）。
        btn.style.zIndex = "5";
        // 強制瀏覽器把「transition:none + 跳回舊座標」這一步先算圖層、畫出來一次，
        // 不然瀏覽器可能會把這行跟下面 requestAnimationFrame 裡「打開 transition、
        // 位移歸零」的動作合併成同一個 frame 處理，結果卡片直接「跳」到新位置、
        // 完全看不到滑動動畫（這正是「有時候只有一張牌會動」的另一個成因：兩張卡片
        // 中如果剛好只有一張被瀏覽器合併掉了動畫，看起來就像只有另一張在動）。
        void btn.offsetWidth;
        requestAnimationFrame(() => {
          btn.style.transition = `transform ${SHUFFLE_MOVE_DURATION_MS}ms ease`;
          btn.style.transform = "";
        });
        setTimeout(() => {
          btn.style.zIndex = "";
        }, SHUFFLE_MOVE_DURATION_MS);
      }
    }

    syncProgress();
    syncCountdown();
    syncFooter();
  };
  game.onFlip = playCardFlipSound;
  game.onCoverBack = playCardCoverSound;
  game.onMatch = playCorrectSound;
  game.onMismatch = playWrongSound;
  game.onLevelComplete = playRoundCompleteSound;
  game.onComplete = () => {
    playRoundCompleteSound();
    window.parent.postMessage(
      { channel: GAME_BRIDGE_CHANNEL, type: "complete" } satisfies GameToParentMessage,
      window.location.origin
    );
  };
}

render();

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return; // 同源保護，忽略其他來源的訊息
  const data = event.data as ParentToGameMessage | undefined;
  if (data?.channel !== GAME_BRIDGE_CHANNEL) return;
  if (data.type === "replayApproved") {
    game = createGame();
    render();
  }
  // "replayDenied" 不用做任何事，見檔案開頭的協定說明。
});

// 頁面初始化完成，通知 parent 可以把 loading 佔位換成真正的內容了。
window.parent.postMessage(
  { channel: GAME_BRIDGE_CHANNEL, type: "ready" } satisfies GameToParentMessage,
  window.location.origin
);
