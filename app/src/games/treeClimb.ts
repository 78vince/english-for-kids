// 我的角色 — 爬樹（垂直跳躍攀爬遊戲）。
// 依據 docs/handoff-prompt-letsgo-tree-climb.md 與 plan-game-tree-climb.md。
// 統一按鍵 v2＋GameScreen 五種版面改版（docs/GAME-PRODUCTION-SPEC.md §6.3–6.5、§10.1、§16）。
// 全螢幕整頁（同視窗導航，見 game/fullscreenPage.ts）；
// 數值、地形、道具、障礙全部讀取 GameTokens.treeClimb（內容端維護）。
// 規則：花費 5 代幣開始，遊戲本體不發代幣；獎勵走星等、稱號與成就徽章。

import "../game/gamePage.css";
import "./treeClimb.css";
import { GameArt, GameTokens, icon, type Look } from "../game/gameKit";
import { VirtualPad } from "../game/virtualPad";
import { GameScreen } from "../game/gameScreen";
import { TreeStageController } from "../game/treeStageController";
import { getActiveLook } from "../game/characterStore";
import {
  loadTreeClimb,
  saveTreeClimb,
  levelRecord,
  isLevelUnlocked,
  starsFor,
  recordResult,
  topTitle,
  type TreeClimbProfileData,
} from "../game/treeClimbStore";
import {
  confirmDialog,
  leaveTo,
  preventZoomGestures,
  requireActiveProfileId,
  returnTarget,
  toast,
  tryFullscreenOnFirstTap,
} from "../game/fullscreenPage";
import { getTokenBalance, spendTokens } from "../gameTokens";

const TC = (GameTokens as any).treeClimb;
const COST = TC.cost || 5;

const profileId = requireActiveProfileId() ?? "";
const app = document.querySelector<HTMLDivElement>("#tree-climb-app")!;
app.className = "gpage tree-climb";

let store: TreeClimbProfileData = loadTreeClimb(profileId);
let look: Look = (profileId && getActiveLook(profileId)) || GameArt.presets["kid-blue"];

type ViewState = "menu" | "play";
let currentView: ViewState = "menu";
let currentLevelId = "sapling";
let stageCtrl: TreeStageController | null = null;
let pad: VirtualPad | null = null;
let screen: GameScreen | null = null;
let gameTimerId = 0;
let remainSeconds = 120;
let currentMeters = 0;
let maxMeters = 0;
let fallsCount = 0;
let capesUsedCount = 0;
let hourglassesPickedCount = 0;
let isGamePaused = false;

// ---------------- 音效開關與設定（跟工作室同一個音效開關） ----------------
const SETTINGS = {
  sound: "englishForKids.settings.gameSound.v1",
};
function getSetting(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function setSetting(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {}
}
const soundOn = () => getSetting(SETTINGS.sound, "1") === "1";

// ---------------- 音效合成（WebAudio 零延遲合成） ----------------
let audioCtx: AudioContext | null = null;
type Sfx = "jump" | "pickup" | "hit" | "boost" | "win" | "lose" | "spring" | "bump";
function sfx(kind: Sfx): void {
  if (!soundOn()) return;
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const t = ctx.currentTime;
    const tone = (f0: number, f1: number, at: number, dur: number, vol: number, type: OscillatorType = "sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t + at);
      o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(vol, t + at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + at + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t + at);
      o.stop(t + at + dur + 0.02);
    };
    switch (kind) {
      case "jump":
        tone(420, 760, 0, 0.12, 0.1);
        break;
      case "pickup":
        tone(880, 1320, 0, 0.1, 0.1);
        tone(1320, 1760, 0.08, 0.1, 0.08);
        break;
      case "hit":
        tone(300, 120, 0, 0.22, 0.16, "triangle");
        break;
      case "bump":
        tone(160, 90, 0, 0.14, 0.18, "triangle");
        break;
      case "boost":
        tone(300, 1200, 0, 0.35, 0.1, "sawtooth");
        break;
      case "spring":
        tone(300, 900, 0, 0.25, 0.12);
        break;
      case "win":
        [523, 659, 784, 1046].forEach((f, i) => tone(f, f, i * 0.12, 0.2, 0.12));
        break;
      case "lose":
        [392, 349, 311].forEach((f, i) => tone(f, f * 0.98, i * 0.16, 0.24, 0.1, "triangle"));
        break;
    }
  } catch {
    // 不支援或靜音
  }
}

// 設定防縮放手勢（橫放更順手由 GameScreen 自帶管理）
preventZoomGestures();
tryFullscreenOnFirstTap();

// 切換分頁/失焦時暫停計時與物理
function pauseClimb(): void {
  if (isGamePaused || currentView !== "play") return;
  isGamePaused = true;
  stageCtrl?.pause();
  clearInterval(gameTimerId);
}

function resumeClimb(): void {
  if (!isGamePaused || currentView !== "play") return;
  isGamePaused = false;
  stageCtrl?.resume();
  startTimer();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseClimb();
  else if (!document.querySelector(".gmodal") && !document.querySelector(".tree-result-modal") && !document.querySelector(".tree-pause-modal")) resumeClimb();
});
window.addEventListener("blur", pauseClimb);
window.addEventListener("focus", () => {
  if (!document.querySelector(".gmodal") && !document.querySelector(".tree-result-modal") && !document.querySelector(".tree-pause-modal")) resumeClimb();
});

function render(): void {
  app.innerHTML = "";

  if (currentView === "menu") {
    renderMenu();
  } else {
    renderPlay();
  }
}

// ---------------- 難度選單畫面 ----------------
function renderMenu(): void {
  const balance = getTokenBalance(profileId);
  const titles = TC.titles || [];
  const currentTitle = topTitle(store, titles) || "小樹苗探險家";

  app.innerHTML = `
    <div class="tree-climb-menu-view">
      <header class="tree-climb-top">
        <button type="button" class="g-iconbtn" id="tree-back-btn" aria-label="返回">
          ${icon("back", "lg")}
        </button>
        <div class="tree-who">
          <div class="tree-who-avatar">${GameArt.avatar(look, 48)}</div>
          <div class="tree-who-text">
            <strong>${look.species === "bear" ? "我的小熊" : "我的角色"}</strong>
            <span class="tree-title-line">${currentTitle}</span>
          </div>
        </div>
        <div class="tree-top-spacer"></div>
        <div class="tree-coins">
          ${icon("coin", "md")} <span>${balance}</span>
        </div>
        <button type="button" class="g-iconbtn tree-sound" aria-label="音效開關">
          ${icon(soundOn() ? "sound" : "mute")}
        </button>
      </header>

      <main class="tree-menu">
        <div class="tree-guide">
          <div class="g-bubble g-bubble--left">
            一局 1~2 分鐘！踩著樹枝往上爬，限時內爬得越高越好。掉出畫面會開降落傘喔～
          </div>
        </div>

        <div class="tree-cards">
          ${TC.levels
            .map((lv: any) => {
              const rec = levelRecord(store, lv.id);
              const unlocked = isLevelUnlocked(store, lv);
              const starsStr = "★".repeat(rec.stars) + "☆".repeat(3 - rec.stars);
              return `
                <div class="tree-card ${unlocked ? "" : "tree-card--locked"}" data-id="${lv.id}">
                  <div class="tree-card-header">
                    <span class="tree-card-title">${lv.label}</span>
                    <span class="tree-card-stars">${starsStr}</span>
                  </div>
                  <div class="tree-card-desc">
                    限時 ${lv.timeSec} 秒 ｜ 最高 ${rec.bestMeters} 公尺
                  </div>
                  ${
                    !unlocked && lv.unlock
                      ? `<div class="tree-card-desc" style="color:var(--g-rose-deep);">需前一難度取得 ★★</div>`
                      : ""
                  }
                  <button type="button" class="tree-card-btn" data-level="${lv.id}" ${unlocked ? "" : "disabled"}>
                    ${unlocked ? `開始攀爬（${COST} 代幣）` : "尚未解鎖"}
                  </button>
                </div>
              `;
            })
            .join("")}
        </div>
      </main>
    </div>
  `;

  app.querySelector("#tree-back-btn")?.addEventListener("click", () => {
    leaveTo(returnTarget());
  });

  app.querySelector(".tree-sound")?.addEventListener("click", () => {
    setSetting(SETTINGS.sound, soundOn() ? "0" : "1");
    const btn = app.querySelector<HTMLButtonElement>(".tree-sound");
    if (btn) btn.innerHTML = icon(soundOn() ? "sound" : "mute");
  });

  app.querySelectorAll<HTMLButtonElement>(".tree-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lvId = btn.dataset.level;
      if (lvId) startClimb(lvId);
    });
  });
}

function startClimb(levelId: string): void {
  const balance = getTokenBalance(profileId);
  if (balance < COST) {
    const diff = COST - balance;
    toast(TC.messages.lowCoin.replace("{n}", String(diff)));
    return;
  }

  // 扣款 5 代幣（玩遊戲不發代幣）
  const ok = spendTokens(profileId, COST);
  if (!ok) {
    toast("代幣扣除失敗，請重新嘗試");
    return;
  }

  // 重新載入最新存檔
  store = loadTreeClimb(profileId);
  store.stats = store.stats || {
    played: 0,
    coinsSpent: 0,
    totalMeters: 0,
    summits: 0,
    hourglassesPicked: 0,
    capesUsed: 0,
    falls: 0,
  };
  store.stats.coinsSpent += COST;
  saveTreeClimb(profileId, store);

  currentLevelId = levelId;
  currentView = "play";
  currentMeters = 0;
  maxMeters = 0;
  fallsCount = 0;
  capesUsedCount = 0;
  hourglassesPickedCount = 0;
  isGamePaused = false;

  const lvDef = TC.levels.find((l: any) => l.id === levelId);
  remainSeconds = lvDef ? lvDef.timeSec : 120;

  render();
}

// ---------------- 攀爬遊玩畫面（統一按鍵 v2＋GameScreen 五種版面） ----------------
function renderPlay(): void {
  const lvDef = TC.levels.find((l: any) => l.id === currentLevelId) || TC.levels[0];
  const balance = getTokenBalance(profileId);
  const titles = TC.titles || [];
  const currentTitle = topTitle(store, titles) || "小樹苗探險家";

  app.innerHTML = "";

  // 1. 統一按鍵 v2：啟用 left、right、down、a（跳躍）、b（按住加速奔跑），up/c/d 設為半透明
  pad = new VirtualPad({ v2: true });
  pad.setActive({
    up: false,
    down: true,
    left: true,
    right: true,
    a: true,
    b: true,
    c: false,
    d: false,
  });

  // 2. 左側 HUD：返回按鈕、角色頭像與稱號
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "g-iconbtn";
  backBtn.id = "tree-play-back";
  backBtn.setAttribute("aria-label", "返回");
  backBtn.innerHTML = icon("back", "lg");
  backBtn.addEventListener("click", async () => {
    pauseClimb();
    pad?.setEnabled(false);
    const ok = await confirmDialog({
      iconId: "back",
      text: "確定要退出攀爬嗎？<br><span class=\"g-t-body\">已扣除的代幣不會退還喔</span>",
      yes: "退出",
      no: "繼續爬",
    });
    if (ok) {
      cleanUpGame();
      currentView = "menu";
      render();
    } else {
      pad?.setEnabled(true);
      resumeClimb();
    }
  });

  const whoEl = document.createElement("div");
  whoEl.className = "tree-who";
  whoEl.innerHTML = `
    <div class="tree-who-avatar" style="width:40px;height:40px;">${GameArt.avatar(look, 40)}</div>
    <div class="tree-who-text">
      <strong>${look.species === "bear" ? "我的小熊" : "我的角色"}</strong>
      <span class="tree-title-line">${currentTitle}</span>
    </div>
  `;

  // 3. 右側 HUD：代幣、暫停按鈕、音效切換
  const coinsEl = document.createElement("div");
  coinsEl.className = "tree-coins";
  coinsEl.innerHTML = `${icon("coin", "sm")} <span id="tree-coins-val">${balance}</span>`;

  const pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "g-iconbtn";
  pauseBtn.id = "tree-play-pause";
  pauseBtn.setAttribute("aria-label", "暫停");
  pauseBtn.innerHTML = icon("pause");
  pauseBtn.addEventListener("click", () => {
    showPauseModal();
  });

  const soundBtn = document.createElement("button");
  soundBtn.type = "button";
  soundBtn.className = "g-iconbtn tree-sound";
  soundBtn.setAttribute("aria-label", "音效開關");
  soundBtn.innerHTML = icon(soundOn() ? "sound" : "mute");
  soundBtn.addEventListener("click", () => {
    setSetting(SETTINGS.sound, soundOn() ? "0" : "1");
    soundBtn.innerHTML = icon(soundOn() ? "sound" : "mute");
  });

  // 4. 畫面上方細列（strip）：剩餘時間、高度紀錄、披風狀態、跳過降落傘
  const stripEl = document.createElement("div");
  stripEl.className = "tree-strip-bar";
  stripEl.innerHTML = `
    <div class="tree-timer" id="tree-timer">⏳ ${remainSeconds}s</div>
    <div class="tree-strip-spacer"></div>
    <div class="tree-height-meter" id="tree-height-meter">0 m</div>
    <div class="tree-hud-items">
      <span class="tree-cape-indicator tree-cape-indicator--empty" id="tree-cape-status">
        披風：無
      </span>
      <button type="button" class="tree-skip-chute-btn" id="tree-skip-chute" style="display:none;">
        跳過降落傘 ⏩
      </button>
    </div>
  `;

  stripEl.querySelector("#tree-skip-chute")?.addEventListener("click", () => {
    stageCtrl?.skipParachute();
  });

  // 5. 建立 GameScreen 容器
  screen = new GameScreen(app, {
    pad,
    hudLeft: [backBtn, whoEl],
    hudRight: [coinsEl, pauseBtn, soundBtn],
    strip: stripEl,
  });

  // 6. 攀爬舞台掛載於 16:9 的 screen.canvas
  const seed = Math.floor(Math.random() * 1000000);
  stageCtrl = new TreeStageController(screen.canvas, look, lvDef, seed, {
    onHeightChange: (meters, maxM) => {
      currentMeters = meters;
      maxMeters = maxM;
      const meterEl = app.querySelector("#tree-height-meter");
      if (meterEl) meterEl.textContent = `${currentMeters} m (最高 ${maxMeters} m)`;
    },
    onHourglassCollect: (addSec) => {
      sfx("pickup");
      remainSeconds += addSec;
      hourglassesPickedCount++;
      toast(`拾取沙漏葉！時間 +${addSec} 秒`);
      updateTimerDisplay();
    },
    onCapeCollect: () => {
      sfx("boost");
      toast("獲得飛升披風！自動向上飛升 🚀");
      updateCapeStatus(true);
    },
    onCapeUsed: () => {
      capesUsedCount++;
      updateCapeStatus(false);
    },
    onHit: (_kind) => {
      sfx("hit");
    },
    onJump: () => {
      sfx("jump");
    },
    onBounce: () => {
      sfx("spring");
    },
    onBrittleCrack: () => {
      sfx("bump");
    },
    onSummit: () => {
      clearInterval(gameTimerId);
      sfx("win");
      toast(TC.messages.summit || "你爬到樹頂了！");
      endGame(true);
    },
    onFallOut: () => {
      fallsCount++;
      clearInterval(gameTimerId); // 掉出底端立即停止計時，成績已鎖定
      sfx("lose");
      toast(TC.messages.chute || "展開降落傘～");
      const skipBtn = app.querySelector<HTMLButtonElement>("#tree-skip-chute");
      if (skipBtn) skipBtn.style.display = "inline-flex";
    },
    onLandAfterFall: () => {
      endGame(false);
    },
  });

  // 7. VirtualPad 輸入事件（含鍵盤鍵入）直通控制器
  pad.on((k, pressed) => {
    stageCtrl?.handleInput(k, pressed);
  });

  // 8. 開始計時與循環
  startTimer();
  stageCtrl.start();
}

function updateCapeStatus(isFlying: boolean): void {
  const capeEl = app.querySelector("#tree-cape-status");
  if (capeEl) {
    capeEl.textContent = isFlying ? "披風：飛升中！🚀" : "披風：無";
    capeEl.classList.toggle("tree-cape-indicator--empty", !isFlying);
  }
}

function updateTimerDisplay(): void {
  const timerEl = app.querySelector("#tree-timer");
  if (timerEl) timerEl.textContent = `⏳ ${remainSeconds}s`;
}

function startTimer(): void {
  clearInterval(gameTimerId);
  gameTimerId = window.setInterval(() => {
    remainSeconds--;
    updateTimerDisplay();
    if (remainSeconds <= 0) {
      clearInterval(gameTimerId);
      toast(TC.messages.timeUp || "時間到！");
      endGame(false);
    }
  }, 1000);
}

function showPauseModal(): void {
  if (isGamePaused || currentView !== "play" || !screen) return;
  pauseClimb();
  pad?.setEnabled(false);

  const modal = document.createElement("div");
  modal.className = "tree-pause-modal";
  modal.innerHTML = `
    <div class="tree-pause-dialog">
      <div class="tree-pause-title">遊戲暫停</div>
      <div class="tree-pause-desc">
        目前高度：<strong>${currentMeters} m</strong>（最高 ${maxMeters} m）<br>
        剩餘時間：<strong>${remainSeconds} 秒</strong>
      </div>
      <div class="tree-pause-actions">
        <button type="button" class="tree-btn-primary" id="tree-pause-resume">繼續攀爬</button>
        <button type="button" class="tree-btn-secondary" id="tree-pause-quit">退出攀爬</button>
      </div>
    </div>
  `;
  screen.canvas.appendChild(modal);

  modal.querySelector("#tree-pause-resume")?.addEventListener("click", () => {
    modal.remove();
    pad?.setEnabled(true);
    resumeClimb();
  });

  modal.querySelector("#tree-pause-quit")?.addEventListener("click", async () => {
    modal.remove();
    const ok = await confirmDialog({
      iconId: "back",
      text: "確定要退出攀爬嗎？<br><span class=\"g-t-body\">已扣除的代幣不會退還喔</span>",
      yes: "退出",
      no: "繼續爬",
    });
    if (ok) {
      cleanUpGame();
      currentView = "menu";
      render();
    } else {
      pad?.setEnabled(true);
      resumeClimb();
    }
  });
}

function cleanUpGame(): void {
  document.querySelectorAll(".tree-pause-modal, .tree-result-modal").forEach((m) => m.remove());
  clearInterval(gameTimerId);
  stageCtrl?.stop();
  stageCtrl?.destroy();
  stageCtrl = null;
  pad?.destroy();
  pad = null;
  screen?.destroy();
  screen = null;
}

// ---------------- 結算畫面（遵循規範 §10.1） ----------------
function endGame(isSummit: boolean): void {
  const capePicked = stageCtrl?.capePickedCount || 0;
  clearInterval(gameTimerId);
  stageCtrl?.stop();
  pad?.setEnabled(false);

  const thresholds = TC.stars[currentLevelId] || [15, 55, 125];
  const earnedStars = starsFor(maxMeters, thresholds);

  const { isNewBest, newTitles } = recordResult(
    store,
    currentLevelId,
    {
      alt: maxMeters * 50,
      meters: maxMeters,
      stars: earnedStars,
      summit: isSummit,
      hourglasses: hourglassesPickedCount,
      capes: capesUsedCount,
      falls: fallsCount,
    },
    TC.titles || []
  );

  // 存檔同步
  saveTreeClimb(profileId, store);

  // 結算彈窗（掛載於 screen.canvas，遵循 §10.1 規範：五種尺寸一頁看完不捲動）
  const starsDisplay = "★".repeat(earnedStars) + "☆".repeat(3 - earnedStars);
  const titleDisplay =
    newTitles.length > 0
      ? `獲得新稱號：${newTitles.join("、")}`
      : isNewBest
        ? TC.messages.best
        : TC.messages.close;

  const modal = document.createElement("div");
  modal.className = "tree-result-modal";
  modal.innerHTML = `
    <div class="tree-result-dialog">
      <div class="tree-result-left">
        <div class="tree-result-avatar">${GameArt.avatar(look, 72)}</div>
        <div class="tree-result-meters">${maxMeters} 公尺</div>
        <div class="tree-result-stars">${starsDisplay}</div>
        <div class="tree-result-title">${titleDisplay}</div>
      </div>
      <div class="tree-result-right">
        <div class="tree-result-chips">
          <div class="tree-chip">
            <span class="tree-chip-lbl">到達高度</span>
            <strong class="tree-chip-val">${maxMeters} m</strong>
          </div>
          <div class="tree-chip">
            <span class="tree-chip-lbl">沙漏 / 披風</span>
            <strong class="tree-chip-val">${hourglassesPickedCount} / ${capePicked}</strong>
          </div>
          <div class="tree-chip">
            <span class="tree-chip-lbl">開降落傘</span>
            <strong class="tree-chip-val">${fallsCount} 次</strong>
          </div>
        </div>
        <div class="tree-result-actions">
          <button type="button" class="tree-btn-primary" id="tree-play-again">再爬一次（${COST} 代幣）</button>
          <div class="tree-btn-subrow">
            <button type="button" class="tree-btn-secondary" id="tree-change-level">選擇難度</button>
            <button type="button" class="tree-btn-secondary" id="tree-exit-room">回遊戲室</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvasHost = screen?.canvas ?? app;
  canvasHost.appendChild(modal);

  modal.querySelector("#tree-play-again")?.addEventListener("click", () => {
    modal.remove();
    cleanUpGame();
    startClimb(currentLevelId);
  });

  modal.querySelector("#tree-change-level")?.addEventListener("click", () => {
    modal.remove();
    cleanUpGame();
    currentView = "menu";
    render();
  });

  modal.querySelector("#tree-exit-room")?.addEventListener("click", () => {
    modal.remove();
    cleanUpGame();
    leaveTo(returnTarget());
  });
}

// 初始渲染
render();
