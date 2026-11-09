// 蟑螂數獨遊戲（Queens 數獨空間益智變體，每場扣 5 代幣、3 顆心、拍打驗收實體按鈕、自動補助）
import { GameArt, GameTokens, prefersReducedMotion, type Look } from "../game/gameKit";
import { getActiveLook } from "../game/characterStore";
import {
  leaveTo,
  preventZoomGestures,
  requireActiveProfileId,
  returnTarget,
  toast,
  tryFullscreenOnFirstTap,
} from "../game/fullscreenPage";
import { COIN_ICON } from "./gameIcons";
import { getTokenBalance, spendTokens } from "../gameTokens";
import {
  saveRoachSudokuGame,
  getRoachSudokuTitle,
  loadRoachSudokuRecord,
} from "../game/roachSudokuStore";
import { speakEnglish, unlockSpeech } from "../speech";
import { VirtualPad } from "../game/virtualPad";
import { GameScreen } from "../game/gameScreen";
import "./roachSudoku.css";

const CFG = (GameTokens as any)?.roachSudoku as
  | {
      cost: number;
      payout: number;
      autoAssist: boolean;
      maxHearts: number;
      stages: Array<{
        id: string;
        label: string;
        en: string;
        size: number;
        roaches: number;
      }>;
      messages: {
        victory: string;
        encouragement: string;
        needMoreTokens: string;
        ruleRegion: string;
        ruleLine: string;
        ruleAdjacent: string;
        readyToSlap: string;
        conflictAdjacent: string;
        conflictLine: string;
        conflictRegion: string;
      };
    }
  | undefined;

interface StageData {
  id: string;
  label: string;
  en: string;
  size: number;
  roaches: number;
  regions: number[][];
  solution: [number, number][];
}

// 內建保證唯一解的關卡題庫（Stage 2 為附圖同款 5x5 客廳）
const STAGES: StageData[] = [
  {
    id: "stage_1",
    label: "臥室地毯",
    en: "Bedroom Rug",
    size: 4,
    roaches: 4,
    regions: [
      [0, 0, 0, 1],
      [2, 3, 1, 1],
      [2, 3, 3, 3],
      [2, 3, 3, 3],
    ],
    solution: [
      [0, 1],
      [1, 3],
      [2, 0],
      [3, 2],
    ],
  },
  {
    id: "stage_2",
    label: "溫馨客廳",
    en: "Living Room",
    size: 5,
    roaches: 5,
    regions: [
      [0, 1, 2, 2, 2],
      [0, 2, 2, 2, 4],
      [0, 3, 2, 2, 4],
      [0, 3, 2, 2, 4],
      [0, 0, 3, 2, 4],
    ],
    solution: [
      [0, 1],
      [1, 3],
      [2, 0],
      [3, 4],
      [4, 2],
    ],
  },
  {
    id: "stage_3",
    label: "美食廚房",
    en: "Kitchen Tiles",
    size: 6,
    roaches: 6,
    regions: [
      [1, 1, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0],
      [1, 1, 2, 0, 0, 0],
      [4, 2, 2, 0, 3, 3],
      [4, 4, 2, 2, 3, 3],
      [4, 4, 2, 2, 3, 5],
    ],
    solution: [
      [0, 3],
      [1, 0],
      [2, 2],
      [3, 4],
      [4, 1],
      [5, 5],
    ],
  },
  {
    id: "stage_4",
    label: "閣樓書房",
    en: "Attic Study",
    size: 7,
    roaches: 7,
    regions: [
      [0, 3, 3, 3, 3, 3, 3],
      [0, 3, 3, 3, 3, 1, 1],
      [3, 3, 3, 3, 2, 1, 1],
      [3, 3, 4, 3, 5, 5, 5],
      [3, 3, 4, 4, 4, 5, 5],
      [3, 6, 6, 6, 5, 5, 5],
      [6, 6, 6, 6, 5, 5, 5],
    ],
    solution: [
      [0, 0],
      [1, 6],
      [2, 4],
      [3, 1],
      [4, 3],
      [5, 5],
      [6, 2],
    ],
  },
  {
    id: "stage_5",
    label: "神秘地下室",
    en: "Secret Basement",
    size: 8,
    roaches: 8,
    regions: [
      [1, 1, 1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 0, 0],
      [1, 4, 4, 1, 1, 1, 0, 2],
      [4, 4, 4, 3, 1, 1, 0, 2],
      [6, 4, 4, 4, 1, 5, 0, 0],
      [6, 4, 5, 5, 5, 5, 5, 0],
      [6, 7, 5, 5, 5, 5, 5, 5],
      [6, 7, 7, 7, 5, 5, 5, 5],
    ],
    solution: [
      [0, 6],
      [1, 4],
      [2, 7],
      [3, 3],
      [4, 1],
      [5, 5],
      [6, 0],
      [7, 2],
    ],
  },
];

// 格子狀態定義
const CELL_EMPTY = 0;
const CELL_CROSS = 1;
const CELL_SLIPPER = 2;

// 色塊對應之 CSS 變數名稱（取自 token）
const REGION_COLOR_VARS = [
  "var(--g-rose-soft)",
  "var(--g-mint-soft)",
  "var(--g-sun-soft)",
  "var(--g-sky-soft)",
  "var(--g-lilac-soft)",
  "var(--g-peach-soft)",
  "var(--g-leaf-soft)",
  "var(--g-wood-soft)",
];

// 蟑螂數獨專屬音效合成器（Web Audio API）
class RoachSoundManager {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;

  private initCtx() {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.noiseBuf) return this.noiseBuf;
    const sampleRate = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.floor(sampleRate * 0.5), sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuf = buf;
    return buf;
  }

  /** 拖鞋拍打聲「啪！」：短促清脆的拍擊噪聲 ＋ 橡膠鞋底拍地板的低頻撞擊 */
  playSlap() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    try {
      // 1. 啪的高頻拍擊噪聲
      const noise = this.getNoiseBuffer();
      if (noise) {
        const src = this.ctx.createBufferSource();
        src.buffer = noise;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1600, t);
        filter.Q.setValueAtTime(1.2, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        src.start(t);
        src.stop(t + 0.06);
      }

      // 2. 啪的低頻實體感（快速音高滑落：320Hz -> 65Hz）
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.07);

      oscGain.gain.setValueAtTime(0.3, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // 靜默容錯
    }
  }

  /** 標記 ❌ 聲「sh」：細膩柔和的畫筆摩擦噪聲 */
  playSh() {
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    try {
      const noise = this.getNoiseBuffer();
      if (!noise) return;

      const src = this.ctx.createBufferSource();
      src.buffer = noise;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(3200, t);
      filter.Q.setValueAtTime(1.6, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      src.start(t);
      src.stop(t + 0.15);
    } catch {
      // 靜默容錯
    }
  }

  /** 小強亂竄碎步聲：2 秒內密集的細小步點 */
  playScurry() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const count = 16;
      for (let i = 0; i < count; i++) {
        const stepT = t + i * 0.11 + (Math.random() * 0.03 - 0.015);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        const f = 720 + Math.random() * 320;
        osc.frequency.setValueAtTime(f, stepT);
        g.gain.setValueAtTime(0.04, stepT);
        g.gain.exponentialRampToValueAtTime(0.0001, stepT + 0.035);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(stepT);
        osc.stop(stepT + 0.04);
      }
    } catch {
      // 靜默容錯
    }
  }

  destroy() {
    if (this.ctx && this.ctx.state !== "closed") {
      void this.ctx.close();
      this.ctx = null;
    }
    this.noiseBuf = null;
  }
}

class RoachSudokuGame {
  private profileId: string;
  private currentStageIndex = 0;
  private hearts = 3;
  private autoAssist = true;
  private currentTool: "slipper" | "cross" = "slipper";
  private soundManager = new RoachSoundManager();
  private isScurrying = false;

  private boardState: number[][] = [];
  private autoFilledMask: boolean[][] = []; // 標記由自動補助填入的 cross

  private startTime = 0;
  private activeLook: Look;

  private rootEl: HTMLElement;
  private screen!: GameScreen;
  private pad!: VirtualPad;
  private stageEl!: HTMLElement;
  private gridEl!: HTMLElement;
  private slapBtnEl!: HTMLButtonElement;
  private heartsEl!: HTMLElement;
  private counterEl!: HTMLElement;
  private feedbackEl: HTMLElement | null = null;
  private charWrapEl!: HTMLElement;

  private cleanupFns: Array<() => void> = [];

  constructor(profileId: string) {
    this.profileId = profileId;
    this.activeLook = (profileId ? getActiveLook(profileId) : null) ?? GameArt.presets["kid-blue"];
    this.rootEl = document.getElementById("roach-sudoku-app") || document.body;
  }

  public init() {
    this.cleanupFns.push(preventZoomGestures());
    // 橫放提示：改由 GameScreen 自帶處理，取代舊的 addRotateHint()
    tryFullscreenOnFirstTap();

    this.renderSkeleton();
    this.loadStage(this.currentStageIndex);
    this.showStartModal();
  }

  private renderSkeleton() {
    this.rootEl.innerHTML = "";
    this.rootEl.className = "roach-page";

    // 統一按鍵 v2：點按益智遊戲，本遊戲不需要對應虛擬按鍵，全數設為 disable 狀態
    this.pad = new VirtualPad({ v2: true });
    this.pad.setActive({
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      c: false,
      d: false,
    });
    this.pad.setEnabled(false);

    // 左側 HUD：返回鍵、關卡標籤、愛心
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "roach-btn-icon";
    backBtn.title = "返回";
    backBtn.innerHTML = GameArt.prop("door", { state: "open", size: 26 });
    backBtn.addEventListener("click", () => this.handleLeave());

    const stageBadge = document.createElement("div");
    stageBadge.className = "roach-stage-badge";
    stageBadge.id = "roach-stage-title";
    stageBadge.textContent = STAGES[this.currentStageIndex].label;

    this.heartsEl = document.createElement("div");
    this.heartsEl.className = "roach-hearts-wrap";
    this.updateHeartsUI();

    // 右側 HUD：計數器、金幣餘額
    this.counterEl = document.createElement("div");
    this.counterEl.className = "roach-counter-badge";
    this.updateCounterUI();

    const coinEl = document.createElement("div");
    coinEl.className = "roach-counter-badge";
    coinEl.innerHTML = `${COIN_ICON(22)} <span>${getTokenBalance(this.profileId)}</span>`;

    // 頂部進度列
    const stripEl = document.createElement("div");
    stripEl.className = "roach-strip-bar";
    stripEl.appendChild(stageBadge);
    stripEl.appendChild(this.heartsEl);
    stripEl.appendChild(this.counterEl);

    // 整合 GameScreen 響應式容器
    this.screen = new GameScreen(this.rootEl, {
      pad: this.pad,
      hudLeft: [backBtn],
      hudRight: [coinEl],
      strip: stripEl,
    });

    // 舞台內容
    this.stageEl = document.createElement("div");
    this.stageEl.className = `roach-stage ${prefersReducedMotion() ? "g-reduced-motion" : ""}`;

    // 規則提示列（對應截圖三標籤）
    const rulesBar = document.createElement("div");
    rulesBar.className = "roach-rules-bar";
    rulesBar.innerHTML = `
      <div class="roach-rule-pill roach-rule-pill--active">${CFG?.messages.ruleRegion ?? "每個色塊 1 隻"}</div>
      <div class="roach-rule-pill roach-rule-pill--active">${CFG?.messages.ruleLine ?? "每行每列 1 隻"}</div>
      <div class="roach-rule-pill roach-rule-pill--active">${CFG?.messages.ruleAdjacent ?? "蟑螂不能相鄰"}</div>
    `;
    this.stageEl.appendChild(rulesBar);

    // 舞台主體（角色 + 棋盤）
    const mainArea = document.createElement("div");
    mainArea.className = "roach-main-area";

    // 左側角色
    const charBox = document.createElement("div");
    charBox.className = "roach-character-box";
    this.charWrapEl = document.createElement("div");
    this.charWrapEl.className = "roach-char-svg-wrap";
    this.updateCharPose("stand");

    const speechEl = document.createElement("div");
    speechEl.className = "roach-char-speech";
    speechEl.textContent = "Slipper ready!";
    charBox.appendChild(speechEl);
    charBox.appendChild(this.charWrapEl);
    mainArea.appendChild(charBox);

    // 中間棋盤容器
    const gridWrapper = document.createElement("div");
    gridWrapper.className = "roach-grid-wrapper";
    this.gridEl = document.createElement("div");
    this.gridEl.className = "roach-grid";
    gridWrapper.appendChild(this.gridEl);
    mainArea.appendChild(gridWrapper);

    this.stageEl.appendChild(mainArea);

    // 底部操作工具列
    const bottomBar = document.createElement("div");
    bottomBar.className = "roach-bottom-bar";

    const slipperToolBtn = document.createElement("button");
    slipperToolBtn.type = "button";
    slipperToolBtn.className = "roach-tool-btn roach-tool-btn--active";
    slipperToolBtn.id = "roach-tool-slipper";
    slipperToolBtn.innerHTML = `<span class="roach-tool-icon">${GameArt.prop("slipper", { state: "idle", size: 20 })}</span> 拖鞋模式`;
    slipperToolBtn.addEventListener("click", () => this.setTool("slipper"));

    const crossToolBtn = document.createElement("button");
    crossToolBtn.type = "button";
    crossToolBtn.className = "roach-tool-btn";
    crossToolBtn.id = "roach-tool-cross";
    crossToolBtn.innerHTML = `<span class="roach-tool-icon">${GameArt.prop("tileCross", { size: 18 })}</span> 標記 ❌`;
    crossToolBtn.addEventListener("click", () => this.setTool("cross"));

    const autoAssistBtn = document.createElement("button");
    autoAssistBtn.type = "button";
    autoAssistBtn.className = "roach-tool-btn";
    autoAssistBtn.id = "roach-tool-auto";
    autoAssistBtn.textContent = `自動補助: ${this.autoAssist ? "ON" : "OFF"}`;
    autoAssistBtn.addEventListener("click", () => this.toggleAutoAssist());

    this.slapBtnEl = document.createElement("button");
    this.slapBtnEl.type = "button";
    this.slapBtnEl.className = "roach-slap-btn";
    this.slapBtnEl.innerHTML = `<span class="roach-tool-icon">${GameArt.prop("slipper", { state: "slap", size: 20 })}</span> 拍打驗收！`;
    this.slapBtnEl.addEventListener("click", () => this.verifyBoard());

    bottomBar.appendChild(slipperToolBtn);
    bottomBar.appendChild(crossToolBtn);
    bottomBar.appendChild(autoAssistBtn);
    bottomBar.appendChild(this.slapBtnEl);
    this.stageEl.appendChild(bottomBar);

    this.screen.canvas.appendChild(this.stageEl);
  }

  private updateCharPose(pose: string) {
    this.charWrapEl.innerHTML = GameArt.character({
      ...this.activeLook,
      view: "front",
      facing: "right",
      pose: pose as any,
    });
  }

  private setTool(tool: "slipper" | "cross") {
    this.currentTool = tool;
    const slipBtn = document.getElementById("roach-tool-slipper");
    const crossBtn = document.getElementById("roach-tool-cross");
    if (slipBtn) slipBtn.classList.toggle("roach-tool-btn--active", tool === "slipper");
    if (crossBtn) crossBtn.classList.toggle("roach-tool-btn--active", tool === "cross");
  }

  private toggleAutoAssist() {
    this.autoAssist = !this.autoAssist;
    const autoBtn = document.getElementById("roach-tool-auto");
    if (autoBtn) autoBtn.textContent = `自動補助: ${this.autoAssist ? "ON" : "OFF"}`;
    if (this.autoAssist) {
      this.recomputeAutoAssist();
    }
  }

  private updateHeartsUI() {
    let html = "";
    for (let i = 0; i < 3; i++) {
      const isLost = i >= this.hearts;
      html += `<span class="roach-heart-icon ${isLost ? "roach-heart-icon--lost" : ""}">${GameArt.prop("heart", { size: 22 })}</span>`;
    }
    if (this.heartsEl) {
      this.heartsEl.innerHTML = html;
    }
  }

  private updateCounterUI() {
    const stage = STAGES[this.currentStageIndex];
    let slipperCount = 0;
    if (this.boardState && this.boardState.length === stage.size) {
      for (let r = 0; r < stage.size; r++) {
        for (let c = 0; c < stage.size; c++) {
          if (this.boardState[r]?.[c] === CELL_SLIPPER) slipperCount++;
        }
      }
    }
    if (this.counterEl) {
      this.counterEl.innerHTML = `<span class="roach-counter-icon">${GameArt.prop("slipper", { state: "idle", size: 20 })}</span> <span>${slipperCount}/${stage.roaches}</span>`;
    }

    if (this.slapBtnEl) {
      const isReady = slipperCount === stage.roaches;
      this.slapBtnEl.classList.toggle("roach-slap-btn--ready", isReady);
      this.slapBtnEl.innerHTML = `<span class="roach-tool-icon">${GameArt.prop("slipper", { state: isReady ? "slap" : "idle", size: 20 })}</span> 拍打驗收 (${slipperCount}/${stage.roaches})`;
    }
  }

  // 載入關卡盤面
  private loadStage(stageIndex: number) {
    this.currentStageIndex = stageIndex;
    this.isScurrying = false;
    const stage = STAGES[stageIndex];
    this.hearts = 3;
    this.startTime = Date.now();

    const titleEl = document.getElementById("roach-stage-title");
    if (titleEl) titleEl.textContent = `${stage.label} (${stage.size}×${stage.size})`;

    this.boardState = Array.from({ length: stage.size }, () => Array(stage.size).fill(CELL_EMPTY));
    this.autoFilledMask = Array.from({ length: stage.size }, () =>
      Array(stage.size).fill(false)
    );

    this.renderGrid();
    this.updateHeartsUI();
    this.updateCounterUI();
  }

  private renderGrid() {
    const stage = STAGES[this.currentStageIndex];
    this.gridEl.innerHTML = "";
    this.gridEl.style.gridTemplateColumns = `repeat(${stage.size}, 1fr)`;
    this.gridEl.style.gridTemplateRows = `repeat(${stage.size}, 1fr)`;

    for (let r = 0; r < stage.size; r++) {
      for (let c = 0; c < stage.size; c++) {
        const cellEl = document.createElement("div");
        cellEl.className = "roach-cell";
        cellEl.id = `cell-${r}-${c}`;
        const regionId = stage.regions[r][c];
        cellEl.style.backgroundColor = REGION_COLOR_VARS[regionId % REGION_COLOR_VARS.length];

        const contentEl = document.createElement("div");
        contentEl.className = "roach-cell-content";
        cellEl.appendChild(contentEl);

        cellEl.addEventListener("click", () => this.handleCellClick(r, c));
        cellEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.handleCellRightClick(r, c);
        });

        this.gridEl.appendChild(cellEl);
      }
    }

    this.updateGridDisplay();
  }

  private handleCellRightClick(r: number, c: number) {
    if (this.isScurrying) return;
    unlockSpeech();
    const currentVal = this.boardState[r][c];
    if (currentVal === CELL_CROSS) {
      this.boardState[r][c] = CELL_EMPTY;
      this.autoFilledMask[r][c] = false;
    } else {
      this.boardState[r][c] = CELL_CROSS;
      this.autoFilledMask[r][c] = false;
      this.soundManager.playSh();
    }
    if (this.autoAssist) {
      this.recomputeAutoAssist();
    }
    this.updateGridDisplay();
  }

  private updateGridDisplay() {
    const stage = STAGES[this.currentStageIndex];
    for (let r = 0; r < stage.size; r++) {
      for (let c = 0; c < stage.size; c++) {
        const cellEl = document.getElementById(`cell-${r}-${c}`);
        if (!cellEl) continue;

        const contentEl = cellEl.querySelector(".roach-cell-content");
        if (!contentEl) continue;

        const val = this.boardState[r][c];
        if (val === CELL_SLIPPER) {
          contentEl.innerHTML = GameArt.prop("slipper", { state: "idle", size: 36 });
        } else if (val === CELL_CROSS) {
          contentEl.innerHTML = GameArt.prop("tileCross", { size: 30 });
        } else {
          contentEl.innerHTML = "";
        }
      }
    }
    this.updateCounterUI();
  }

  private handleCellClick(r: number, c: number) {
    if (this.isScurrying) return;
    unlockSpeech();

    const currentVal = this.boardState[r][c];

    if (this.currentTool === "slipper") {
      if (currentVal === CELL_SLIPPER) {
        this.boardState[r][c] = CELL_EMPTY;
      } else {
        this.boardState[r][c] = CELL_SLIPPER;
        this.updateCharPose("action");
        setTimeout(() => this.updateCharPose("stand"), 400);
        this.soundManager.playSlap();
      }
    } else {
      if (currentVal === CELL_CROSS) {
        this.boardState[r][c] = CELL_EMPTY;
        this.autoFilledMask[r][c] = false;
      } else {
        this.boardState[r][c] = CELL_CROSS;
        this.autoFilledMask[r][c] = false;
        this.soundManager.playSh();
      }
    }

    if (this.autoAssist) {
      this.recomputeAutoAssist();
    }

    this.updateGridDisplay();
  }

  // 自動補助排他計算：為所有放拖鞋的行、列、8 鄰自動標記 ❌
  private recomputeAutoAssist() {
    const stage = STAGES[this.currentStageIndex];

    // 清除舊的自動補助標記
    for (let r = 0; r < stage.size; r++) {
      for (let c = 0; c < stage.size; c++) {
        if (this.autoFilledMask[r][c] && this.boardState[r][c] === CELL_CROSS) {
          this.boardState[r][c] = CELL_EMPTY;
          this.autoFilledMask[r][c] = false;
        }
      }
    }

    // 針對所有拖鞋標記互斥區域
    for (let r = 0; r < stage.size; r++) {
      for (let c = 0; c < stage.size; c++) {
        if (this.boardState[r][c] === CELL_SLIPPER) {
          // 同橫行
          for (let tc = 0; tc < stage.size; tc++) {
            if (tc !== c && this.boardState[r][tc] === CELL_EMPTY) {
              this.boardState[r][tc] = CELL_CROSS;
              this.autoFilledMask[r][tc] = true;
            }
          }
          // 同直列
          for (let tr = 0; tr < stage.size; tr++) {
            if (tr !== r && this.boardState[tr][c] === CELL_EMPTY) {
              this.boardState[tr][c] = CELL_CROSS;
              this.autoFilledMask[tr][c] = true;
            }
          }
          // 周圍 8 鄰格
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < stage.size && nc >= 0 && nc < stage.size) {
                if (this.boardState[nr][nc] === CELL_EMPTY) {
                  this.boardState[nr][nc] = CELL_CROSS;
                  this.autoFilledMask[nr][nc] = true;
                }
              }
            }
          }
        }
      }
    }
  }

  // 驗收判定
  private verifyBoard() {
    if (this.isScurrying) return;
    unlockSpeech();
    const stage = STAGES[this.currentStageIndex];

    const slippers: Array<[number, number]> = [];
    for (let r = 0; r < stage.size; r++) {
      for (let c = 0; c < stage.size; c++) {
        if (this.boardState[r][c] === CELL_SLIPPER) slippers.push([r, c]);
      }
    }

    // 情況 1：拖鞋數量不足（少放了拖鞋）
    if (slippers.length < stage.roaches) {
      const missing = stage.roaches - slippers.length;
      // 找出哪些橫行完全沒有放拖鞋
      const emptyRows: number[] = [];
      for (let r = 0; r < stage.size; r++) {
        if (!slippers.some(([sr]) => sr === r)) emptyRows.push(r);
      }
      // 溫和高亮這些沒有拖鞋的橫行格子，引導小朋友
      for (const r of emptyRows) {
        for (let c = 0; c < stage.size; c++) {
          const cellEl = document.getElementById(`cell-${r}-${c}`);
          if (cellEl) {
            cellEl.classList.add("roach-cell--hint");
            setTimeout(() => cellEl.classList.remove("roach-cell--hint"), 2200);
          }
        }
      }
      this.showFeedbackBanner(`還少 ${missing} 隻拖鞋！每一橫行、每一直列都要放 1 隻拖鞋喔！`);
      speakEnglish("Look closer!");
      return;
    }

    // 情況 2：拖鞋數量過多（多放了拖鞋）
    if (slippers.length > stage.roaches) {
      const extra = slippers.length - stage.roaches;
      this.showFeedbackBanner(`拖鞋放太多囉（多放了 ${extra} 隻）！每行每列剛好只能有 1 隻！`);
      speakEnglish("Too many!");
      return;
    }

    // 情況 3：正好放滿 N 隻拖鞋 -> 進行終極驗收判定！
    const conflicts: Array<[number, number]> = [];
    let conflictMsg = "";

    // 1. 每行 1 隻
    for (let r = 0; r < stage.size; r++) {
      const rowSlips = slippers.filter(([sr]) => sr === r);
      if (rowSlips.length > 1) {
        conflicts.push(...rowSlips);
        conflictMsg = CFG?.messages.conflictLine ?? "同一橫行有重複的拖鞋喔！";
      }
    }

    // 2. 每列 1 隻
    for (let c = 0; c < stage.size; c++) {
      const colSlips = slippers.filter(([, sc]) => sc === c);
      if (colSlips.length > 1) {
        conflicts.push(...colSlips);
        if (!conflictMsg) conflictMsg = CFG?.messages.conflictLine ?? "同一直列有重複的拖鞋喔！";
      }
    }

    // 3. 每個色塊 1 隻
    const regionSlips = new Map<number, Array<[number, number]>>();
    for (const [r, c] of slippers) {
      const reg = stage.regions[r][c];
      if (!regionSlips.has(reg)) regionSlips.set(reg, []);
      regionSlips.get(reg)!.push([r, c]);
    }
    for (const [, slips] of regionSlips.entries()) {
      if (slips.length > 1) {
        conflicts.push(...slips);
        if (!conflictMsg) conflictMsg = CFG?.messages.conflictRegion ?? "同一個色塊有重複的拖鞋喔！";
      }
    }

    // 4. 不能相鄰（8-鄰互斥）
    for (let i = 0; i < slippers.length; i++) {
      for (let j = i + 1; j < slippers.length; j++) {
        const [r1, c1] = slippers[i];
        const [r2, c2] = slippers[j];
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) {
          conflicts.push([r1, c1], [r2, c2]);
          if (!conflictMsg) conflictMsg = CFG?.messages.conflictAdjacent ?? "這兩隻小強靠太近囉！蟑螂不能相鄰（包括斜角）！";
        }
      }
    }

    // 判定結果
    if (conflicts.length === 0) {
      // 完全正確通關！
      this.handleStageSuccess();
    } else {
      // 猜測有誤
      this.handleStageConflict(conflicts, conflictMsg);
    }
  }

  private handleStageSuccess() {
    const stage = STAGES[this.currentStageIndex];
    speakEnglish("Super logic! All clear!");
    this.updateCharPose("victory");

    // 播放全場拍打震撼動畫，掀開拖鞋看到轉圈圈小強
    for (const [r, c] of stage.solution) {
      const cellEl = document.getElementById(`cell-${r}-${c}`);
      if (cellEl) {
        cellEl.classList.add("roach-cell--slapped");
        const contentEl = cellEl.querySelector(".roach-cell-content");
        if (contentEl) {
          contentEl.innerHTML = GameArt.prop("cockroach", { state: "dizzy", size: 36 });
        }
      }
    }

    const elapsedSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const stars = this.hearts >= 3 ? 3 : this.hearts === 2 ? 2 : 1;

    // 存檔
    saveRoachSudokuGame(this.profileId, {
      stageId: stage.id,
      stars,
      timeSec: elapsedSec,
      roachesCaught: stage.roaches,
    });

    setTimeout(() => {
      this.showVictoryModal(stars, elapsedSec);
    }, 900);
  }

  private handleStageConflict(conflicts: Array<[number, number]>, msg: string) {
    this.hearts--;
    this.updateHeartsUI();
    this.updateCharPose("surprise");
    speakEnglish("Watch out!");

    // 震動衝突格子
    for (const [r, c] of conflicts) {
      const cellEl = document.getElementById(`cell-${r}-${c}`);
      if (cellEl) {
        cellEl.classList.add("roach-cell--conflict");
        setTimeout(() => cellEl.classList.remove("roach-cell--conflict"), 600);
      }
    }

    this.showFeedbackBanner(msg);

    if (this.hearts <= 0) {
      // 愛心扣完 -> 闖關失敗：沒有被拍打到的蟑螂在畫面上亂竄約兩秒後，才跳出闖關失敗的 pop
      this.triggerFailureSequence();
    }
  }

  // 闖關失敗動畫：未被拍打到的小強在畫面上亂竄約兩秒後跳出失敗 pop
  private triggerFailureSequence() {
    this.isScurrying = true;
    this.soundManager.playScurry();
    this.updateCharPose("surprise");

    const stage = STAGES[this.currentStageIndex];
    // 找出真解中沒有被拖鞋正確拍打到的小強位置（未被覆蓋的漏網之蟑）
    const unhit = stage.solution.filter(
      ([r, c]) => this.boardState[r][c] !== CELL_SLIPPER
    );
    const escaping = unhit.length > 0 ? unhit : stage.solution;

    const scurryOverlay = document.createElement("div");
    scurryOverlay.className = "roach-scurry-overlay";
    this.stageEl.appendChild(scurryOverlay);

    const stageRect = this.stageEl.getBoundingClientRect();
    const stageW = Math.max(stageRect.width, 320);
    const stageH = Math.max(stageRect.height, 320);

    for (const [r, c] of escaping) {
      const cellEl = document.getElementById(`cell-${r}-${c}`);
      let startX = stageW / 2;
      let startY = stageH / 2;

      if (cellEl) {
        const cellRect = cellEl.getBoundingClientRect();
        startX = cellRect.left - stageRect.left + (cellRect.width - 48) / 2;
        startY = cellRect.top - stageRect.top + (cellRect.height - 48) / 2;

        const contentEl = cellEl.querySelector(".roach-cell-content");
        if (contentEl) {
          contentEl.innerHTML = "";
        }
      }

      const runner = document.createElement("div");
      runner.className = "roach-runner";
      runner.innerHTML = `<div class="roach-runner-inner">${GameArt.prop("cockroach", { state: "idle", size: 40 })}</div>`;
      scurryOverlay.appendChild(runner);

      // 產生多段隨機轉折路徑（約 2 秒狂奔，最後衝出畫面邊緣）
      const segments = 5;
      const keyframes: Keyframe[] = [];
      let curX = startX;
      let curY = startY;

      keyframes.push({
        transform: `translate(${curX}px, ${curY}px) rotate(0deg) scale(0.6)`,
        opacity: 0,
        offset: 0,
      });
      keyframes.push({
        transform: `translate(${curX}px, ${curY}px) rotate(0deg) scale(1)`,
        opacity: 1,
        offset: 0.08,
      });

      for (let s = 1; s <= segments; s++) {
        const isLast = s === segments;
        let nextX: number;
        let nextY: number;

        if (isLast) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.max(stageW, stageH) * 0.7;
          nextX = curX + Math.cos(angle) * dist;
          nextY = curY + Math.sin(angle) * dist;
        } else {
          const pad = 16;
          nextX = pad + Math.random() * (stageW - 48 - pad * 2);
          nextY = pad + Math.random() * (stageH - 48 - pad * 2);
        }

        const dx = nextX - curX;
        const dy = nextY - curY;
        const heading = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const offset = isLast ? 1 : 0.08 + (s / segments) * 0.92;

        keyframes.push({
          transform: `translate(${nextX}px, ${nextY}px) rotate(${heading}deg) scale(1)`,
          opacity: isLast ? 0 : 1,
          offset: Math.min(1, offset),
        });

        curX = nextX;
        curY = nextY;
      }

      if (typeof runner.animate === "function") {
        runner.animate(keyframes, {
          duration: 2000,
          easing: "ease-in-out",
          fill: "forwards",
        });
      } else {
        runner.style.transform = `translate(${startX}px, ${startY}px)`;
      }
    }

    // 亂竄約 2 秒後（2100ms），移除圖層並彈出闖關失敗 pop
    setTimeout(() => {
      scurryOverlay.remove();
      this.isScurrying = false;
      this.showFailModal();
    }, 2100);
  }

  private showFeedbackBanner(msg: string) {
    if (this.feedbackEl) {
      this.feedbackEl.remove();
      this.feedbackEl = null;
    }
    this.feedbackEl = document.createElement("div");
    this.feedbackEl.className = "roach-feedback-banner";
    this.feedbackEl.textContent = msg;
    this.stageEl.appendChild(this.feedbackEl);

    setTimeout(() => {
      if (this.feedbackEl) {
        this.feedbackEl.remove();
        this.feedbackEl = null;
      }
    }, 2800);
  }

  private showStartModal() {
    this.rootEl.querySelectorAll(".roach-dialog-overlay").forEach((el) => el.remove());
    const stage = STAGES[this.currentStageIndex];
    const cost = CFG?.cost ?? 5;
    const balance = getTokenBalance(this.profileId);
    const affordable = balance >= cost;

    const overlay = document.createElement("div");
    overlay.className = "roach-dialog-overlay";

    const card = document.createElement("div");
    card.className = "roach-dialog-card";
    card.innerHTML = `
      <h2>🩴 蟑螂數獨</h2>
      <p>目標：找出藏在地磚下的 <strong>${stage.roaches} 隻小強</strong> 並用拖鞋覆蓋！<br>
      每行、每列、每個色塊剛好 1 隻且互不相鄰。<br>
      填滿格子後點擊【拍打驗收】！</p>
      <div class="roach-dialog-actions">
        <button class="roach-secondary-btn" id="roach-btn-leave">回遊戲室</button>
        <button class="roach-primary-btn" id="roach-btn-start">
          ${affordable ? `開始挑戰 ${COIN_ICON(20)} ${cost}` : "代幣不足去學習"}
        </button>
      </div>
    `;

    overlay.appendChild(card);
    this.rootEl.appendChild(overlay);

    card.querySelector("#roach-btn-leave")?.addEventListener("click", () => {
      overlay.remove();
      this.handleLeave();
    });

    card.querySelector("#roach-btn-start")?.addEventListener("click", () => {
      if (!affordable) {
        toast(`再賺 ${cost - balance} 個代幣就可以玩囉！`);
        return;
      }
      spendTokens(this.profileId, cost);
      overlay.remove();
      this.loadStage(this.currentStageIndex);
    });
  }

  private showVictoryModal(stars: number, elapsedSec: number) {
    this.rootEl.querySelectorAll(".roach-dialog-overlay").forEach((el) => el.remove());
    const stage = STAGES[this.currentStageIndex];
    const rec = loadRoachSudokuRecord(this.profileId);
    const titleObj = getRoachSudokuTitle(rec.stagesCleared);

    const overlay = document.createElement("div");
    overlay.className = "roach-dialog-overlay";

    const starsHtml = Array.from({ length: 3 }, (_, i) => {
      const active = i < stars;
      return `<div class="roach-star-item">${GameArt.prop("star", { state: active ? "idle" : "used", size: 40 })}</div>`;
    }).join("");

    const hasNext = this.currentStageIndex < STAGES.length - 1;

    const card = document.createElement("div");
    card.className = "roach-dialog-card";
    card.innerHTML = `
      <h2>🎉 成功收服小強！</h2>
      <div class="roach-stars-row">${starsHtml}</div>
      <p>恭喜通過 <strong>${stage.label}</strong>！<br>
      用時：${elapsedSec} 秒 ｜ 榮獲稱號：<strong>${titleObj.title}</strong></p>
      <div class="roach-dialog-actions">
        <button class="roach-secondary-btn" id="roach-btn-exit">回遊戲室</button>
        ${
          hasNext
            ? `<button class="roach-primary-btn" id="roach-btn-next">前進下一關 ➔</button>`
            : `<button class="roach-primary-btn" id="roach-btn-replay">再玩一次</button>`
        }
      </div>
    `;

    overlay.appendChild(card);
    this.rootEl.appendChild(overlay);

    card.querySelector("#roach-btn-exit")?.addEventListener("click", () => {
      overlay.remove();
      this.handleLeave();
    });

    card.querySelector("#roach-btn-next")?.addEventListener("click", () => {
      overlay.remove();
      this.currentStageIndex++;
      this.showStartModal();
    });

    card.querySelector("#roach-btn-replay")?.addEventListener("click", () => {
      overlay.remove();
      this.showStartModal();
    });
  }

  private showFailModal() {
    this.rootEl.querySelectorAll(".roach-dialog-overlay").forEach((el) => el.remove());
    const cost = CFG?.cost ?? 5;
    const overlay = document.createElement("div");
    overlay.className = "roach-dialog-overlay";

    const card = document.createElement("div");
    card.className = "roach-dialog-card";
    card.innerHTML = `
      <h2>💨 小強溜走啦！</h2>
      <p>${CFG?.messages.encouragement ?? "小強身手太靈活溜走啦！動動腦，下次一定抓得到！"}</p>
      <div class="roach-dialog-actions">
        <button class="roach-secondary-btn" id="roach-fail-leave">回遊戲室</button>
        <button class="roach-primary-btn" id="roach-fail-retry">
          ${COIN_ICON(20)} ${cost} 再挑戰一次
        </button>
      </div>
    `;

    overlay.appendChild(card);
    this.rootEl.appendChild(overlay);

    card.querySelector("#roach-fail-leave")?.addEventListener("click", () => {
      overlay.remove();
      this.handleLeave();
    });

    card.querySelector("#roach-fail-retry")?.addEventListener("click", () => {
      overlay.remove();
      this.showStartModal();
    });
  }

  public destroy() {
    this.screen?.destroy();
    this.pad?.destroy();
    this.soundManager?.destroy();
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.stageEl?.remove();
  }

  private handleLeave() {
    this.destroy();
    leaveTo(returnTarget());
  }
}

// 啟動進入點
const profileId = requireActiveProfileId() ?? "test-player";
const game = new RoachSudokuGame(profileId);
game.init();

window.addEventListener("beforeunload", () => game.destroy());
