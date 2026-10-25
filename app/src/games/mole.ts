// 打地鼠遊戲（每場扣 5 代幣、限時 30 秒、8 孔交錯透視、Go/No-Go 認知訓練）
import { GameArt, GameTokens, prefersReducedMotion, type Look } from "../game/gameKit";
import { getActiveLook, loadCharacter } from "../game/characterStore";
import {
  addRotateHint,
  confirmDialog,
  leaveTo,
  preventZoomGestures,
  requireActiveProfileId,
  returnTarget,
  toast,
  tryFullscreenOnFirstTap,
} from "../game/fullscreenPage";
import { COIN_ICON } from "./gameIcons";
import { getTokenBalance, spendTokens } from "../gameTokens";
import { saveMoleGame, getMoleTitle } from "../game/moleStore";
import { speakEnglish, unlockSpeech } from "../speech";
import "./mole.css";

const MOLE_CFG = (GameTokens as any)?.mole as
  | {
      cost: number;
      payout: number;
      durationSec: number;
      holeCount: number;
      starThresholds: number[];
      stages: Array<{
        id: string;
        fromSec: number;
        toSec: number;
        maxActive: number;
        stayMs: number;
        melonChance: number;
      }>;
    }
  | undefined;

const GAME_DURATION_SEC = MOLE_CFG?.durationSec ?? 30;
const MOLE_COST = MOLE_CFG?.cost ?? 5;
const STAR_THRESHOLDS = MOLE_CFG?.starThresholds ?? [8, 16, 24];

// 音效管理器（Web Audio 合成，純代碼生成清脆音效）
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled = true;

  public initCtx() {
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

  playTone(freq: number, duration: number, type: OscillatorType = "sine", gainVal = 0.16) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // 靜默容錯
    }
  }

  playHit(combo: number) {
    const baseFreq = 520;
    const freq = Math.min(880, baseFreq + Math.min(combo, 10) * 32);
    this.playTone(freq, 0.16, "triangle", 0.2);
  }

  playMelon() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch {
      // 靜默
    }
  }

  playFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.24, "triangle", 0.18);
      }, idx * 110);
    });
  }
}

// 冒出的目標角色清單（預設均不戴帽子，髮型多樣膚色各異，使「戴西瓜帽」與「沒戴帽子」對比極致鮮明）
const TARGET_PRESETS: Look[] = [
  { species: "kid", skin: "peach", hairStyle: "short", hairColor: "chestnut", eyes: "dot", mouth: "smile", outfit: "hoodie", outfitColor: "sky", pantsColor: "stone", accessories: [], held: "none" },
  { species: "kid", skin: "honey", hairStyle: "spiky", hairColor: "ink", eyes: "happy", mouth: "open", outfit: "overalls", outfitColor: "sun", pantsColor: "sky", accessories: [], held: "none" },
  { species: "kid", skin: "porcelain", hairStyle: "bob", hairColor: "rose", eyes: "lash", mouth: "smile", outfit: "dress", outfitColor: "mint", pantsColor: "stone", accessories: [], held: "none" },
  { species: "kid", skin: "cocoa", hairStyle: "twintail", hairColor: "ink", eyes: "happy", mouth: "smile", outfit: "jacket", outfitColor: "peach", pantsColor: "wood", accessories: [], held: "none" },
  { species: "kid", skin: "sand", hairStyle: "buzz", hairColor: "caramel", eyes: "dot", mouth: "open", outfit: "stripe", outfitColor: "leaf", pantsColor: "wood", accessories: [], held: "none" },
  { species: "kid", skin: "peach", hairStyle: "sidepart", hairColor: "honey", eyes: "dot", mouth: "smile", outfit: "tee", outfitColor: "lilac", pantsColor: "stone", accessories: [], held: "none" },
];

// 8 個坑洞的座標佈局（採 3、2、3 三列交錯編排，百分比座標）
interface HoleCoord {
  left: number; // %
  top: number; // %
  rowClass: string;
}

const HOLE_COORDS: HoleCoord[] = [
  // 第一列（3 孔，後排，Y = 35%）
  { left: 24, top: 35, rowClass: "mole-hole-wrap--row1" },
  { left: 50, top: 35, rowClass: "mole-hole-wrap--row1" },
  { left: 76, top: 35, rowClass: "mole-hole-wrap--row1" },
  // 第二列（2 孔，中排，Y = 59%）
  { left: 37, top: 59, rowClass: "mole-hole-wrap--row2" },
  { left: 63, top: 59, rowClass: "mole-hole-wrap--row2" },
  // 第三列（3 孔，前排，Y = 83%）
  { left: 24, top: 83, rowClass: "mole-hole-wrap--row3" },
  { left: 50, top: 83, rowClass: "mole-hole-wrap--row3" },
  { left: 76, top: 83, rowClass: "mole-hole-wrap--row3" },
];

interface HoleInstance {
  id: number;
  coord: HoleCoord;
  state: "down" | "up" | "hit";
  isMelon: boolean;
  wrapEl: HTMLElement;
  actorEl: HTMLElement;
  timer: number | null;
}

// 主遊戲類
class MoleGame {
  private profileId: string;
  private userLook: Look;
  private rootEl: HTMLElement;
  private sounds = new SoundManager();

  // 遊戲進行狀態
  private isPlaying = false;
  private isPaused = false;
  private timeRemaining = GAME_DURATION_SEC;
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private melonsHit = 0;

  // 計時器
  private gameLoopTimer: number | null = null;
  private spawnLoopTimer: number | null = null;
  private cleanups: Array<() => void> = [];

  // DOM 元素引用
  private holes: HoleInstance[] = [];
  private timeFillEl: HTMLElement | null = null;
  private timeTextEl: HTMLElement | null = null;
  private scoreTextEl: HTMLElement | null = null;
  private comboTextEl: HTMLElement | null = null;
  private playerDockSvgEl: HTMLElement | null = null;
  private playerBubbleEl: HTMLElement | null = null;
  private coinValEl: HTMLElement | null = null;

  constructor(profileId: string) {
    this.profileId = profileId;
    this.rootEl = document.getElementById("mole-app") || document.body;
    const look = getActiveLook(profileId);
    this.userLook = look ?? (GameArt.presets as any)["kid-blue"] ?? { species: "human", skin: "sand" };
  }

  public init() {
    this.renderSkeleton();
    this.cleanups.push(preventZoomGestures());
    addRotateHint();
    tryFullscreenOnFirstTap();
    this.showRulesModal();
  }

  // 渲染頁面骨架
  private renderSkeleton() {
    const char = loadCharacter(this.profileId);
    const charName = (char && char.slots[char.activeSlot]?.name) ? char.slots[char.activeSlot].name : "小小探險家";
    const balance = getTokenBalance(this.profileId);
    const isReduced = prefersReducedMotion();

    this.rootEl.innerHTML = `
      <div class="mole-page ${isReduced ? "mole-reduced-motion" : ""}">
        <!-- 頂部 HUD -->
        <header class="mole-top">
          <div class="mole-top-left">
            <button type="button" class="mole-btn-icon mole-back-btn" title="返回" aria-label="返回">
              <span aria-hidden="true">‹</span>
            </button>
            <div class="mole-who">
              <div class="mole-who-avatar">${GameArt.avatar(this.userLook, 40)}</div>
              <div class="mole-who-text">
                <strong>${charName}</strong>
              </div>
            </div>
          </div>

          <div class="mole-top-center">
            <div class="mole-timer-label">
              <span>剩餘時間</span>
              <strong id="mole-timer-text">${GAME_DURATION_SEC}s</strong>
            </div>
            <div class="mole-timer-bar">
              <div id="mole-timer-fill" class="mole-timer-fill" style="width: 100%;"></div>
            </div>
          </div>

          <div class="mole-top-right">
            <div class="mole-hud-chip">
              <span>得分</span>
              <span id="mole-score-val" class="mole-score-val">0</span>
              <span id="mole-combo-val" class="mole-combo-val" style="display: none;">0x</span>
            </div>
            <div class="mole-hud-chip" title="遊戲代幣">
              ${COIN_ICON(20)}
              <span id="mole-coin-val">${balance}</span>
            </div>
            <button type="button" class="mole-btn-icon mole-sound-btn" title="音效開關" aria-label="音效開關">
              <span id="mole-sound-icon">🔊</span>
            </button>
          </div>
        </header>

        <!-- 橫式全草地舞台區 -->
        <main class="mole-stage">
          <div class="mole-bg-deco">
            <!-- 雜物石塊、野花、草叢裝飾 -->
            <div class="mole-deco-item" style="left: 8%; top: 16%; width: 44px;">${GameArt.prop("rock")}</div>
            <div class="mole-deco-item" style="left: 88%; top: 14%; width: 36px;">${GameArt.prop("rock")}</div>
            <div class="mole-deco-item" style="left: 12%; top: 48%; width: 28px;">${GameArt.prop("flower", { state: "idle" })}</div>
            <div class="mole-deco-item" style="left: 88%; top: 46%; width: 32px;">${GameArt.prop("rock")}</div>
            <div class="mole-deco-item" style="left: 36%; top: 38%; width: 26px;">${GameArt.prop("flower", { state: "idle" })}</div>
            <div class="mole-deco-item" style="left: 64%; top: 38%; width: 30px;">${GameArt.prop("rock")}</div>
            <div class="mole-deco-item" style="left: 14%; top: 82%; width: 34px;">${GameArt.prop("rock")}</div>
            <div class="mole-deco-item" style="left: 88%; top: 80%; width: 28px;">${GameArt.prop("flower", { state: "idle" })}</div>
            <div class="mole-deco-item" style="left: 48%; top: 90%; width: 26px;">${GameArt.prop("flower", { state: "idle" })}</div>
            <!-- 草叢微紋理 -->
            <div class="mole-grass-patch" style="left: 32%; top: 20%;"></div>
            <div class="mole-grass-patch" style="left: 68%; top: 18%;"></div>
            <div class="mole-grass-patch" style="left: 48%; top: 60%;"></div>
            <div class="mole-grass-patch" style="left: 80%; top: 64%;"></div>
          </div>

          <!-- 主角大本營 -->
          <div class="mole-player-dock">
            <div id="mole-player-bubble" class="mole-player-bubble">Ready!</div>
            <div id="mole-player-svg" class="mole-player-dock-svg">
              ${GameArt.character({ ...this.userLook, view: "front", facing: "right", pose: "idle" })}
            </div>
          </div>

          <!-- 8 個坑洞佈局 -->
          <div id="mole-field" class="mole-field"></div>
        </main>
      </div>
    `;

    // 取得節點
    this.timeFillEl = document.getElementById("mole-timer-fill");
    this.timeTextEl = document.getElementById("mole-timer-text");
    this.scoreTextEl = document.getElementById("mole-score-val");
    this.comboTextEl = document.getElementById("mole-combo-val");
    this.playerDockSvgEl = document.getElementById("mole-player-svg");
    this.playerBubbleEl = document.getElementById("mole-player-bubble");
    this.coinValEl = document.getElementById("mole-coin-val");

    // 綁定事件
    const backBtn = this.rootEl.querySelector(".mole-back-btn");
    backBtn?.addEventListener("click", () => this.handleBack());

    const soundBtn = this.rootEl.querySelector(".mole-sound-btn");
    soundBtn?.addEventListener("click", () => this.toggleSound());

    // 生成 8 個坑洞
    this.buildHoles();
  }

  // 生成 8 個坑洞 DOM
  private buildHoles() {
    const fieldEl = document.getElementById("mole-field");
    if (!fieldEl) return;
    fieldEl.innerHTML = "";
    this.holes = [];

    HOLE_COORDS.forEach((coord, idx) => {
      const wrap = document.createElement("div");
      wrap.className = `mole-hole-wrap ${coord.rowClass}`;
      wrap.style.left = `${coord.left}%`;
      wrap.style.top = `${coord.top}%`;

      // 坑洞三層結構：後坑陰影、角色、前沿泥堆（wrap 本身為 200×220px 完整感應區）
      wrap.innerHTML = `
        <div class="mole-hole-back">${GameArt.prop("moleHole", { state: "back" })}</div>
        <div class="mole-actor-wrap">
          <div class="mole-actor"></div>
        </div>
        <div class="mole-hole-front">${GameArt.prop("moleHole", { state: "front" })}</div>
      `;

      const actorEl = wrap.querySelector(".mole-actor") as HTMLElement;

      const holeInst: HoleInstance = {
        id: idx,
        coord,
        state: "down",
        isMelon: false,
        wrapEl: wrap,
        actorEl,
        timer: null,
      };

      // 靈敏點擊：同時監聽 pointerdown、touchstart 與 click，附帶防重複觸發機制
      let lastHitTime = 0;
      const onHit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - lastHitTime < 150) return;
        lastHitTime = now;
        this.hitHole(holeInst);
      };

      wrap.addEventListener("pointerdown", onHit);
      wrap.addEventListener("touchstart", onHit, { passive: false });
      wrap.addEventListener("click", onHit);

      fieldEl.appendChild(wrap);
      this.holes.push(holeInst);
    });
  }

  // 顯示玩法規則與開局確認對話框
  private showRulesModal() {
    const balance = getTokenBalance(this.profileId);
    const affordable = balance >= MOLE_COST;

    // 預覽角色（相同角色，一個沒戴帽子，一個戴西瓜帽）
    const previewPreset = TARGET_PRESETS[0];
    const targetSvg = GameArt.avatar({ ...previewPreset, accessories: [] }, 72);
    const melonSvg = GameArt.avatar({ ...previewPreset, accessories: ["melonhat"] }, 72);

    const modal = document.createElement("div");
    modal.className = "mole-modal-backdrop";
    modal.innerHTML = `
      <div class="mole-modal-card">
        <h2>打地鼠</h2>
        <p class="g-t-body">點擊從草地冒出來的小夥伴！但是要小心偽裝的西瓜帽子喔！</p>

        <div class="mole-rules-preview">
          <div class="mole-rule-item">
            ${targetSvg}
            <span class="mole-rule-tag mole-rule-tag--hit">點擊 +1 分</span>
            <span class="mole-rule-desc">可愛小夥伴</span>
          </div>
          <div class="mole-rule-item">
            ${melonSvg}
            <span class="mole-rule-tag mole-rule-tag--avoid">不要點擊</span>
            <span class="mole-rule-desc">戴西瓜帽 +0 分</span>
          </div>
        </div>

        <p class="g-t-caption" style="color: var(--g-ink-soft);">
          限時 30 秒・花費 ${COIN_ICON(20)} ${MOLE_COST} 代幣
        </p>

        <div class="mole-modal-actions">
          <button type="button" class="mole-btn-secondary mole-btn-leave">回遊戲室</button>
          <button type="button" class="mole-btn-primary mole-btn-start">
            ${affordable ? `開始挑戰 ${COIN_ICON(22)} ${MOLE_COST}` : "代幣不足去學習"}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".mole-btn-leave")?.addEventListener("click", () => {
      modal.remove();
      this.destroy();
      leaveTo(returnTarget());
    });

    modal.querySelector(".mole-btn-start")?.addEventListener("click", () => {
      unlockSpeech();
      this.sounds.initCtx();
      if (!affordable) {
        modal.remove();
        toast(`再賺 ${MOLE_COST - balance} 個代幣就可以玩囉！`, 2600);
        setTimeout(() => {
          this.destroy();
          leaveTo("home");
        }, 1200);
        return;
      }

      // 扣款（硬性規則 §7.3）
      const ok = spendTokens(this.profileId, MOLE_COST);
      if (!ok) {
        toast("代幣不足，先去練習學習賺代幣吧！", 2500);
        return;
      }
      if (this.coinValEl) {
        this.coinValEl.textContent = String(getTokenBalance(this.profileId));
      }
      modal.remove();
      this.startCountdown();
    });
  }

  // 3-2-1 開局倒數
  private startCountdown() {
    let count = 3;
    const cdEl = document.createElement("div");
    cdEl.className = "mole-modal-backdrop";
    cdEl.innerHTML = `<h1 style="font-size: 80px; color: var(--g-sun-base); text-shadow: 0 4px 16px rgba(0,0,0,0.3);">${count}</h1>`;
    document.body.appendChild(cdEl);

    this.sounds.playTone(440, 0.12, "sine");
    speakEnglish(String(count));

    const iv = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        cdEl.innerHTML = `<h1 style="font-size: 80px; color: var(--g-sun-base); text-shadow: 0 4px 16px rgba(0,0,0,0.3);">${count}</h1>`;
        this.sounds.playTone(440, 0.12, "sine");
        speakEnglish(String(count));
      } else if (count === 0) {
        cdEl.innerHTML = `<h1 style="font-size: 72px; color: var(--g-leaf-deep); text-shadow: 0 4px 16px rgba(0,0,0,0.3);">GO!</h1>`;
        this.sounds.playTone(880, 0.25, "triangle");
        speakEnglish("Go!");
      } else {
        clearInterval(iv);
        cdEl.remove();
        this.startGame();
      }
    }, 850);
  }

  // 正式開始遊戲
  private startGame() {
    this.isPlaying = true;
    this.isPaused = false;
    this.timeRemaining = GAME_DURATION_SEC;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.melonsHit = 0;
    this.updateHud();

    if (this.playerBubbleEl) this.playerBubbleEl.textContent = "Smash!";

    // 主時鐘（每 100ms 更新進度條）
    const startTime = Date.now();
    this.gameLoopTimer = window.setInterval(() => {
      if (this.isPaused) return;
      const elapsed = (Date.now() - startTime) / 1000;
      this.timeRemaining = Math.max(0, GAME_DURATION_SEC - elapsed);

      const ratio = this.timeRemaining / GAME_DURATION_SEC;
      if (this.timeFillEl) {
        this.timeFillEl.style.width = `${ratio * 100}%`;
        if (this.timeRemaining <= 6) {
          this.timeFillEl.classList.add("mole-timer-fill--urgent");
        }
      }
      if (this.timeTextEl) {
        this.timeTextEl.textContent = `${Math.ceil(this.timeRemaining)}s`;
      }

      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 100);

    // 目標冒出迴圈（每 350ms 檢查並嘗試冒出）
    this.spawnLoopTimer = window.setInterval(() => {
      if (this.isPaused || !this.isPlaying) return;
      this.trySpawnTarget();
    }, 350);
  }

  // 取得當前時間階段設定
  private getCurrentStageConfig() {
    const elapsed = GAME_DURATION_SEC - this.timeRemaining;
    const stages = MOLE_CFG?.stages ?? [
      { id: "warmup", fromSec: 0, toSec: 10, maxActive: 1, stayMs: 1200, melonChance: 0.15 },
      { id: "speedup", fromSec: 10, toSec: 20, maxActive: 2, stayMs: 900, melonChance: 0.25 },
      { id: "rush", fromSec: 20, toSec: 30, maxActive: 3, stayMs: 700, melonChance: 0.35 },
    ];
    for (const st of stages) {
      if (elapsed >= st.fromSec && elapsed < st.toSec) return st;
    }
    return stages[stages.length - 1];
  }

  // 嘗試冒出新目標
  private trySpawnTarget() {
    const cfg = this.getCurrentStageConfig();
    const activeHoles = this.holes.filter((h) => h.state !== "down");
    if (activeHoles.length >= cfg.maxActive) return;

    const idleHoles = this.holes.filter((h) => h.state === "down");
    if (idleHoles.length === 0) return;

    const NORMAL_POSES = ["wave", "cheer", "surprise", "shy", "salute", "think", "victory", "idle"];
    const EYE_OPTIONS = ["happy", "wide", "dot", "lash"];
    const MOUTH_OPTIONS = ["open", "tongue", "smile", "teeth", "o"];

    // 隨機選一個空坑洞
    const targetHole = idleHoles[Math.floor(Math.random() * idleHoles.length)];
    const isMelon = Math.random() < cfg.melonChance;

    // 隨機自預設庫挑選小夥伴
    const pickPreset = TARGET_PRESETS[Math.floor(Math.random() * TARGET_PRESETS.length)];
    let actorLook: Look;
    let spawnPose: string;

    if (isMelon) {
      // 西瓜帽夥伴：配戴西瓜帽，神情逗趣/得意
      actorLook = {
        ...pickPreset,
        eyes: "happy",
        mouth: "smile",
        accessories: ["melonhat"],
        held: "none",
      };
      const melonPoses = ["idle", "think", "shy"];
      spawnPose = melonPoses[Math.floor(Math.random() * melonPoses.length)];
    } else {
      // 普通夥伴：絕對不戴帽子，隨機表演生動動作與豐富表情！
      const randomPose = NORMAL_POSES[Math.floor(Math.random() * NORMAL_POSES.length)];
      const randomEye = EYE_OPTIONS[Math.floor(Math.random() * EYE_OPTIONS.length)];
      const randomMouth = MOUTH_OPTIONS[Math.floor(Math.random() * MOUTH_OPTIONS.length)];
      actorLook = {
        ...pickPreset,
        eyes: randomEye,
        mouth: randomMouth,
        accessories: [],
        held: "none",
      };
      spawnPose = randomPose;
    }

    targetHole.isMelon = isMelon;
    targetHole.state = "up";
    targetHole.actorEl.className = "mole-actor mole-actor--up";
    targetHole.actorEl.innerHTML = GameArt.character({ ...actorLook, view: "front", pose: spawnPose });

    // 語音短語提示（偶爾喊一聲）
    if (Math.random() < 0.25) {
      speakEnglish(isMelon ? "Watermelon!" : "Peekaboo!");
    }

    // 停留倒數後縮回
    targetHole.timer = window.setTimeout(() => {
      this.retreatHole(targetHole);
    }, cfg.stayMs);
  }

  // 擊中坑洞
  private hitHole(hole: HoleInstance) {
    if (!this.isPlaying || this.isPaused || hole.state !== "up") return;

    hole.state = "hit";
    if (hole.timer) {
      clearTimeout(hole.timer);
      hole.timer = null;
    }

    // 主角揮動充氣槌動作
    this.triggerPlayerSwing();

    if (!hole.isMelon) {
      // 成功擊中普通夥伴
      this.score += 1;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.sounds.playHit(this.combo);

      hole.actorEl.className = "mole-actor mole-actor--up mole-actor--hit";
      this.showFx(hole.wrapEl, "+1", "score");

      if (this.combo >= 5 && this.combo % 5 === 0) {
        speakEnglish("Great!");
        if (this.playerBubbleEl) this.playerBubbleEl.textContent = `${this.combo} Combo!`;
      } else if (Math.random() < 0.3) {
        speakEnglish("Nice!");
      }

      window.setTimeout(() => {
        this.retreatHole(hole);
      }, 220);
    } else {
      // 誤擊西瓜帽（不給分 + 斷連擊）
      this.melonsHit += 1;
      this.combo = 0;
      this.sounds.playMelon();

      hole.actorEl.className = "mole-actor mole-actor--up mole-actor--sad";
      this.showFx(hole.wrapEl, "Oops! +0", "oops");
      speakEnglish("Oops!");
      if (this.playerBubbleEl) this.playerBubbleEl.textContent = "Oops!";

      window.setTimeout(() => {
        this.retreatHole(hole);
      }, 350);
    }

    this.updateHud();
  }

  // 縮回坑洞
  private retreatHole(hole: HoleInstance) {
    if (hole.timer) {
      clearTimeout(hole.timer);
      hole.timer = null;
    }
    hole.actorEl.className = "mole-actor";
    hole.state = "down";
  }

  // 顯示浮動特效
  private showFx(wrapEl: HTMLElement, text: string, type: "score" | "oops") {
    const fx = document.createElement("div");
    fx.className = type === "score" ? "mole-fx-score" : "mole-fx-oops";
    fx.textContent = text;
    wrapEl.appendChild(fx);
    setTimeout(() => fx.remove(), 750);
  }

  // 主角揮擊動畫
  private triggerPlayerSwing() {
    if (!this.playerDockSvgEl) return;
    this.playerDockSvgEl.classList.add("mole-player-dock-svg--swing");
    setTimeout(() => {
      this.playerDockSvgEl?.classList.remove("mole-player-dock-svg--swing");
    }, 180);
  }

  // 更新 HUD
  private updateHud() {
    if (this.scoreTextEl) {
      this.scoreTextEl.textContent = String(this.score);
    }
    if (this.comboTextEl) {
      if (this.combo >= 2) {
        this.comboTextEl.style.display = "inline-block";
        this.comboTextEl.textContent = `${this.combo}x`;
      } else {
        this.comboTextEl.style.display = "none";
      }
    }
  }

  // 遊戲結束結算
  private endGame() {
    this.isPlaying = false;
    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
    if (this.spawnLoopTimer) {
      clearInterval(this.spawnLoopTimer);
      this.spawnLoopTimer = null;
    }

    // 縮回全部地鼠
    this.holes.forEach((h) => this.retreatHole(h));

    // 計算星等
    let stars = 0;
    if (this.score >= STAR_THRESHOLDS[2]) stars = 3;
    else if (this.score >= STAR_THRESHOLDS[1]) stars = 2;
    else if (this.score >= STAR_THRESHOLDS[0]) stars = 1;

    // 儲存存檔紀錄
    const saveResult = saveMoleGame(this.profileId, {
      score: this.score,
      stars,
      maxCombo: this.maxCombo,
      melonsHit: this.melonsHit,
    });

    const titleInfo = getMoleTitle(this.score);
    this.sounds.playFanfare();
    speakEnglish(stars >= 2 ? "Awesome job!" : "Good try!");

    this.showResultModal(stars, titleInfo, saveResult.isNewRecord);
  }

  // 結算彈窗
  private showResultModal(
    stars: number,
    titleInfo: { title: string; en: string },
    isNewRecord: boolean
  ) {
    const isZeroMelon = this.melonsHit === 0 && this.score >= STAR_THRESHOLDS[0];
    const balance = getTokenBalance(this.profileId);
    const affordable = balance >= MOLE_COST;

    const modal = document.createElement("div");
    modal.className = "mole-modal-backdrop";
    modal.innerHTML = `
      <div class="mole-modal-card">
        <h2>${stars >= 2 ? "🎉 挑戰成功！" : "🌟 繼續加油！"}</h2>
        
        <div class="mole-result-avatar">
          ${GameArt.character({
            ...this.userLook,
            view: "front",
            facing: "right",
            pose: stars >= 2 ? "victory" : "cheer",
          })}
        </div>

        <div class="mole-result-stars">
          <span class="mole-star ${stars >= 1 ? "mole-star--active" : ""}">★</span>
          <span class="mole-star ${stars >= 2 ? "mole-star--active" : ""}">★</span>
          <span class="mole-star ${stars >= 3 ? "mole-star--active" : ""}">★</span>
        </div>

        <div class="mole-badge-pill">
          ${titleInfo.title} (${titleInfo.en})
        </div>

        ${isZeroMelon ? `<div class="mole-rule-tag mole-rule-tag--hit">🍉 西瓜品鑑家（零誤擊）</div>` : ""}
        ${isNewRecord ? `<div class="mole-rule-tag mole-rule-tag--hit">🏆 刷新個人最高紀錄！</div>` : ""}

        <div class="mole-result-stats">
          <div class="mole-stat-box">
            <span class="mole-stat-label">本次得分</span>
            <span class="mole-stat-num">${this.score}</span>
          </div>
          <div class="mole-stat-box">
            <span class="mole-stat-label">最高連擊</span>
            <span class="mole-stat-num">${this.maxCombo}x</span>
          </div>
          <div class="mole-stat-box">
            <span class="mole-stat-label">誤擊西瓜帽</span>
            <span class="mole-stat-num">${this.melonsHit} 次</span>
          </div>
          <div class="mole-stat-box">
            <span class="mole-stat-label">剩餘代幣</span>
            <span class="mole-stat-num">${balance}</span>
          </div>
        </div>

        <div class="mole-modal-actions">
          <button type="button" class="mole-btn-secondary mole-btn-leave">回遊戲室</button>
          <button type="button" class="mole-btn-primary mole-btn-replay">
            ${affordable ? `再玩一次 ${COIN_ICON(20)} ${MOLE_COST}` : "去學習賺代幣"}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".mole-btn-leave")?.addEventListener("click", () => {
      modal.remove();
      this.destroy();
      leaveTo(returnTarget());
    });

    modal.querySelector(".mole-btn-replay")?.addEventListener("click", () => {
      modal.remove();
      if (!affordable) {
        toast(`再賺 ${MOLE_COST - balance} 個代幣就可以玩囉！`, 2600);
        setTimeout(() => {
          this.destroy();
          leaveTo("home");
        }, 1200);
        return;
      }
      const ok = spendTokens(this.profileId, MOLE_COST);
      if (!ok) return;
      if (this.coinValEl) {
        this.coinValEl.textContent = String(getTokenBalance(this.profileId));
      }
      this.startCountdown();
    });
  }

  // 返回處理
  private async handleBack() {
    if (this.isPlaying) {
      this.isPaused = true;
      const shouldLeave = await confirmDialog({
        iconId: "warn",
        text: "現在離開，這場花費的 5 個代幣不會退回喔！確定要離開嗎？",
        yes: "離開",
        no: "繼續玩",
        hue: "rose",
      });
      if (shouldLeave) {
        this.destroy();
        leaveTo(returnTarget());
      } else {
        this.isPaused = false;
      }
    } else {
      this.destroy();
      leaveTo(returnTarget());
    }
  }

  // 切換音效
  private toggleSound() {
    this.sounds.enabled = !this.sounds.enabled;
    const soundIcon = document.getElementById("mole-sound-icon");
    if (soundIcon) {
      soundIcon.textContent = this.sounds.enabled ? "🔊" : "🔇";
    }
  }

  // 清理銷毀
  public destroy() {
    this.isPlaying = false;
    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
    if (this.spawnLoopTimer) {
      clearInterval(this.spawnLoopTimer);
      this.spawnLoopTimer = null;
    }
    this.holes.forEach((h) => {
      if (h.timer) clearTimeout(h.timer);
    });
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }
}

// 啟動進入點
const profileId = requireActiveProfileId() ?? "test-player";
const game = new MoleGame(profileId);
game.init();

// 頁面卸載時清理
window.addEventListener("beforeunload", () => game.destroy());
