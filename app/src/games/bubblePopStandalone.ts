// 戳泡泡——獨立打包的遊戲頁面（games/bubble-pop.html 的進入點）。
// 延續翻牌配對與填字遊戲的既有架構：獨立 iframe 頁面 ＋ gameBridge.ts postMessage 橋接。
// 見 docs/handoff-prompt-bubble-pop-game.md。

import { BubblePopGame, LEVEL_COUNT } from "./bubblePopGame";
import { COIN_ICON, STAR_EMPTY_ICON, STAR_FILLED_ICON } from "./gameIcons";
import { GAMES } from "../content";
import { playCorrectSound, playRoundCompleteSound } from "../sound";
import { speakEnglish } from "../speech";
import { GAME_BRIDGE_CHANNEL, type GameToParentMessage, type ParentToGameMessage } from "../gameBridge";

const app = document.querySelector<HTMLDivElement>("#bubble-pop-app");
if (!app) {
  throw new Error("找不到 #bubble-pop-app 掛載點");
}

const gameConfig = GAMES.find((g) => g.id === "bubble_pop");
const gameCost = gameConfig?.cost ?? 20;

const game = new BubblePopGame();

// 記錄當前關卡中每顆泡泡的 DOM 節點，供局部動畫更新使用（不重建整個畫面）
let currentBubbleEls = new Map<string, HTMLDivElement>();
let currentSlotEls: HTMLDivElement[] = [];

/**
 * 僅在「關卡開局」或「進入下一關」時建置全畫面 DOM。
 * 答題過程中絕不整頁清空，避免破壞動畫與造成已答對泡泡閃現。
 */
function initLevel(): void {
  app!.innerHTML = "";
  currentBubbleEls.clear();
  currentSlotEls = [];

  // ---- 1. 頂部資訊列（關卡標籤與中文提示詞） ----
  const topBar = document.createElement("div");
  topBar.className = "top-bar";

  const levelTag = document.createElement("div");
  levelTag.className = "level-tag";
  levelTag.textContent = `第 ${game.level} / ${LEVEL_COUNT} 關`;
  topBar.appendChild(levelTag);

  const promptCard = document.createElement("div");
  promptCard.className = "prompt-card";
  promptCard.innerHTML = `<span class="prompt-label">依序戳破字母，拼出：</span><span class="prompt-target">${game.targetZh}</span>`;
  topBar.appendChild(promptCard);

  app!.appendChild(topBar);

  // ---- 2. 中央泡泡遊戲場域 ----
  const bubbleField = document.createElement("div");
  bubbleField.className = "bubble-field";

  game.bubbles.forEach((b) => {
    const bubbleEl = document.createElement("div");
    bubbleEl.className = "bubble-item";
    bubbleEl.dataset.id = b.id;
    bubbleEl.setAttribute("role", "button");
    bubbleEl.setAttribute("aria-label", `字母 ${b.letter}`);
    bubbleEl.style.left = `${b.xPercent}%`;
    bubbleEl.style.top = `${b.yPercent}%`;
    bubbleEl.style.animationDelay = `${b.floatDelay}s`;
    bubbleEl.style.animationDuration = `${b.floatDuration}s`;

    const letterSpan = document.createElement("span");
    letterSpan.className = "bubble-letter";
    letterSpan.textContent = b.letter;
    bubbleEl.appendChild(letterSpan);

    bubbleEl.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      game.popBubble(b.id);
    });

    currentBubbleEls.set(b.id, bubbleEl);
    bubbleField.appendChild(bubbleEl);
  });

  app!.appendChild(bubbleField);

  // ---- 3. 底部拼字進度區 ----
  const bottomBar = document.createElement("div");
  bottomBar.className = "bottom-bar";

  const tray = document.createElement("div");
  tray.className = "spelling-tray";

  const targetLetters = game.targetWord.split("");
  targetLetters.forEach(() => {
    const slot = document.createElement("div");
    slot.className = "spelling-slot spelling-slot--empty";
    slot.textContent = "";
    currentSlotEls.push(slot);
    tray.appendChild(slot);
  });

  bottomBar.appendChild(tray);
  app!.appendChild(bottomBar);
}

// ---- 掛接遊戲引擎各項事件 ----

// 點對泡泡：音效、快速消失動畫、直接隱藏、局部更新進度槽（不重繪畫面）
game.onCorrectPop = (letter, _progressSoFar, bubbleId) => {
  playCorrectSound();

  const bubbleEl = currentBubbleEls.get(bubbleId);
  if (bubbleEl) {
    bubbleEl.classList.add("bubble--popped");
    // 0.12s 動畫結束後直接隱藏，絕不復現
    setTimeout(() => {
      bubbleEl.style.display = "none";
    }, 110);
  }

  const slotIndex = game.progressIndex - 1;
  const slot = currentSlotEls[slotIndex];
  if (slot) {
    slot.className = "spelling-slot spelling-slot--filled";
    slot.textContent = letter;
  }
};

// 點錯泡泡：不發出錯誤音效，採用 Web Animations API (WAAPI) 達成 0ms 零延遲即時超速閃避，大幅加大距離並彈性回位，不重置畫面
game.onWrongPop = (bubbleId) => {
  const bubbleEl = currentBubbleEls.get(bubbleId);
  if (bubbleEl) {
    // 立即取消先前的閃避動畫（避免連續點擊時動畫疊加或等待）
    bubbleEl.getAnimations().filter((anim) => anim.id === "dodge").forEach((anim) => anim.cancel());

    // 隨機角度與大幅加大逃逸距離（80px ~ 115px，強烈閃躲避開手指）
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 35;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    // 採用極具爆發力的曲線，前 65ms (offset ~0.16) 達到最大噴射閃避，隨後平滑回彈
    const anim = bubbleEl.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", easing: "cubic-bezier(0, 0.95, 0.1, 1)" },
        {
          transform: `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(1.18)`,
          offset: 0.16,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        },
        {
          transform: `translate(calc(-50% + ${(dx * 0.3).toFixed(1)}px), calc(-50% + ${(dy * 0.3).toFixed(1)}px)) scale(1.04)`,
          offset: 0.55,
        },
        { transform: "translate(-50%, -50%) scale(1)" },
      ],
      {
        duration: 400,
        fill: "none",
      }
    );
    anim.id = "dodge";
  }
};

// 關卡完成：播放歡呼音效與英文發音；停在原畫面，提供「下一關」按鈕
game.onLevelComplete = (word, isFinal) => {
  playRoundCompleteSound();
  speakEnglish(word.toLowerCase());

  if (!isFinal) {
    // 顯示「下一關」互動卡片，不自動跳轉
    const card = document.createElement("div");
    card.className = "level-complete-card";
    card.innerHTML = `
      <h2>🎉 太棒了！</h2>
      <p>成功拼出 <strong>${game.targetZh}</strong> (${game.targetWord})！</p>
    `;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "primary-btn next-level-btn";
    nextBtn.textContent = `進入第 ${game.level + 1} 關 →`;
    nextBtn.addEventListener("click", () => {
      card.remove();
      game.nextLevel();
    });

    card.appendChild(nextBtn);
    app!.appendChild(card);
  }
};

function starsRow(starsCount: number): string {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += i <= starsCount ? STAR_FILLED_ICON(28) : STAR_EMPTY_ICON(28);
  }
  return html;
}

// 五關全部破完：顯示通關卡片與星等評鑑，以及再玩一次/返回按鈕
game.onComplete = (stars) => {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const modal = document.createElement("div");
  modal.className = "modal-card";
  modal.innerHTML = `
    <h2>🎈 恭喜全部過關！</h2>
    <div class="bubble-stars">${starsRow(stars)}</div>
    <p>太厲害了，所有單字都被你成功戳破拼出來了！<br />總共失誤：${game.wrongCount} 次</p>
  `;

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const replayBtn = document.createElement("button");
  replayBtn.type = "button";
  replayBtn.className = "primary-btn";
  replayBtn.innerHTML = `再玩一次 <span class="game-room-card-cost">（${COIN_ICON(15)}-${gameCost}）</span>`;
  replayBtn.addEventListener("click", () => {
    window.parent.postMessage(
      { channel: GAME_BRIDGE_CHANNEL, type: "requestReplay" } satisfies GameToParentMessage,
      window.location.origin
    );
  });
  actions.appendChild(replayBtn);

  const exitBtn = document.createElement("button");
  exitBtn.type = "button";
  exitBtn.className = "secondary-btn";
  exitBtn.textContent = "返回遊戲室";
  exitBtn.addEventListener("click", () => {
    window.parent.postMessage(
      { channel: GAME_BRIDGE_CHANNEL, type: "exitToRoom" } satisfies GameToParentMessage,
      window.location.origin
    );
  });
  actions.appendChild(exitBtn);

  modal.appendChild(actions);
  overlay.appendChild(modal);
  app!.appendChild(overlay);

  window.parent.postMessage(
    { channel: GAME_BRIDGE_CHANNEL, type: "complete", stars } satisfies GameToParentMessage,
    window.location.origin
  );
};

// 當進入新關卡（例如點擊下一關按鈕）時才重新建置全畫面 DOM
game.onChange = () => {
  if (game.phase === "playing") {
    initLevel();
  }
};

// 初始化第 1 關
initLevel();

// 監聽來自 parent 的訊息
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data as ParentToGameMessage | undefined;
  if (data?.channel !== GAME_BRIDGE_CHANNEL) return;

  if (data.type === "replayApproved") {
    game.restart();
    initLevel();
  }
});

// 通知 parent 遊戲已就緒
window.parent.postMessage(
  { channel: GAME_BRIDGE_CHANNEL, type: "ready" } satisfies GameToParentMessage,
  window.location.origin
);
