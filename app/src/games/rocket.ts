// 火箭發射遊戲（每場扣 5 代幣、嚴格 A/B 輪流交替推進、精準座落底座表面、背景太空艙一體化）
import { GameArt, GameTokens, icon, prefersReducedMotion, type Look } from "../game/gameKit";
import { getActiveLook, loadCharacter } from "../game/characterStore";
import {
  addRotateHint,
  leaveTo,
  preventZoomGestures,
  requireActiveProfileId,
  returnTarget,
  tryFullscreenOnFirstTap,
} from "../game/fullscreenPage";
import { loadRocketRecord, saveRocketFlight, getRocketRank } from "../game/rocketStore";
import { earnTokens, getTokenBalance, spendTokens } from "../gameTokens";
import { speakEnglish, unlockSpeech } from "../speech";
import "./rocket.css";

const ROCKET_CFG = (GameTokens as any)?.rocket as { cost: number; payout: number; targetAltitude: number; durationSec: number } | undefined;
const TARGET_ALTITUDE = ROCKET_CFG?.targetAltitude ?? 30000;
const GAME_DURATION_SEC = ROCKET_CFG?.durationSec ?? 15;
const ROCKET_COST = ROCKET_CFG?.cost ?? 5;
const LAUNCHPAD_BOTTOM_PX = 33; // 火箭停在發射台上的基準高度 (px，底座頂部高 38px，尾翼距底部 5px，接觸完全吻合無懸空)

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled = true;

  public initCtx() {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  playBeep(freq: number, duration: number, type: OscillatorType = "sine") {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // 靜默
    }
  }

  playTap(isCombo: boolean, comboCount: number) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isCombo ? "triangle" : "sine";
      const baseFreq = isCombo ? 340 + Math.min(380, comboCount * 20) : 290;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(isCombo ? 0.18 : 0.13, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // 靜默
    }
  }

  playMissTap() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // 靜默
    }
  }

  playFail() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    } catch {
      // 靜默
    }
  }

  playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.12);
        osc.stop(this.ctx!.currentTime + idx * 0.12 + 0.3);
      });
    } catch {
      // 靜默
    }
  }
}

const sounds = new SoundManager();

class RocketGame {
  private appEl: HTMLElement;
  private profileId: string;
  private look: Look;
  private charName = "我的角色";
  private coins = 0;

  private state: "READY" | "COUNTDOWN" | "PLAYING" | "SUCCESS" | "FAIL" | "RESULT" = "READY";
  private timeLeft = GAME_DURATION_SEC;
  private startTime = 0; // 記錄起飛開始時間
  private totalTaps = 0;
  private currentAltitude = 0;
  private velocity = 0; // m/s
  private peakCPS = 0;

  private lastPressedKey: "a" | "b" | null = null;
  private comboCount = 0;
  private tapTimestamps: number[] = [];
  private altHintTimer = 0;
  private isSmokeBillowing = false;

  private lastFrameTime = 0;
  private animFrameId = 0;
  private countdownTimerId = 0;

  constructor(appEl: HTMLElement) {
    this.appEl = appEl;

    let activeId: string | null = null;
    let isDirectTest = false;
    try {
      isDirectTest =
        typeof window !== "undefined" &&
        // 只有單檔試玩版（file://）用測試帳號；網址後門 ?test 已移除，測試請用遊戲實驗室（npm run lab）
        window.location.protocol === "file:";
      if (isDirectTest) {
        activeId = "test-player";
      } else {
        activeId = requireActiveProfileId();
      }
    } catch {
      activeId = "test-player";
    }
    this.profileId = activeId ?? "test-player";

    // 初始讀取代幣：若為單機/測試帳號且餘額不足，預先充值以利測試驗證
    this.coins = getTokenBalance(this.profileId);
    if ((isDirectTest || this.profileId === "test-player") && this.coins < ROCKET_COST) {
      earnTokens(this.profileId, 50);
      this.coins = getTokenBalance(this.profileId);
    }

    const activeLook = getActiveLook(this.profileId);
    this.look = activeLook ?? GameArt.presets["kid-blue"] ?? GameArt.randomLook();

    const charData = loadCharacter(this.profileId);
    if (charData && charData.slots[charData.activeSlot]?.name) {
      this.charName = charData.slots[charData.activeSlot].name;
    }

    this.renderLayout();
    this.bindEvents();
    this.updateHUD();
    this.prepareCountdown();
  }

  private renderLayout() {
    const record = loadRocketRecord(this.profileId);

    this.appEl.className = "gpage rocket-page";
    this.appEl.innerHTML = `
      <!-- 頂部導覽列 -->
      <header class="rocket-top">
        <button type="button" class="g-iconbtn" id="rocket-back-btn" aria-label="返回遊戲室">
          ${icon("back", "lg")}
        </button>
        <div class="rocket-who">
          <div class="rocket-who-avatar">${GameArt.avatar(this.look, 42)}</div>
          <div class="rocket-who-text">
            <strong>${this.charName}</strong>
            <span class="rocket-title-line">火箭發射</span>
          </div>
        </div>
        <div class="rocket-top-spacer"></div>
        <div class="rocket-chip rocket-coin-chip" id="hudCoinChip">
          ${icon("coin", "sm")} <span id="coinCount">${this.coins}</span>
        </div>
        <div class="rocket-chip rocket-timer-chip" id="hudTimer">⏳ 15.0s</div>
        <div class="rocket-chip" id="hudTapsChip">🚀 0 次</div>
        ${record.bestTime > 0 ? `<div class="rocket-chip">⚡ 最佳 ${record.bestTime.toFixed(1)}s</div>` : ""}
        <button type="button" class="g-iconbtn" id="rocket-sound-btn" aria-label="音效開關">
          ${icon("sound")}
        </button>
      </header>

      <!-- 中央主舞台（.gstage 卡片容器） -->
      <main class="gstage rocket-stage">
        <!-- 垂直世界背景層 -->
        <div class="rocket-sky-world" id="rocketWorld">
          <div class="rocket-bg-layer">
            
            <!-- STAGE 1: 0m ~ 500m 地表發射基地、發射塔、遠山雪峰、現代大樓群、直升機與起飛濃煙 -->
            <div class="stage1-ground-group">
              <div class="stage1-distant-mountains">
                <svg viewBox="0 0 1000 180" width="100%" height="100%" preserveAspectRatio="none">
                  <path d="M0 180 L0 100 Q150 25 300 85 Q450 15 600 80 Q760 10 900 85 Q950 40 1000 70 L1000 180 Z" fill="var(--g-ink)" opacity="0.6" />
                  <polygon points="150,25 175,55 125,55" fill="var(--g-stone-soft)" opacity="0.8" />
                  <polygon points="450,15 480,50 420,50" fill="var(--g-stone-soft)" opacity="0.8" />
                  <polygon points="760,10 790,45 730,45" fill="var(--g-stone-soft)" opacity="0.8" />
                  <path d="M0 180 L0 120 Q180 50 350 110 Q520 45 700 105 Q860 40 1000 95 L1000 180 Z" fill="var(--g-ink)" />
                </svg>
              </div>

              <div class="stage1-city-skyline">
                <svg viewBox="0 0 1000 110" width="100%" height="100%" preserveAspectRatio="none">
                  <rect x="40" y="25" width="45" height="85" fill="var(--g-ink-soft)" rx="2" />
                  <rect x="48" y="32" width="8" height="6" fill="var(--g-sun-soft)" opacity="0.7" />
                  <rect x="62" y="32" width="8" height="6" fill="var(--g-sun-soft)" opacity="0.7" />
                  <rect x="48" y="46" width="8" height="6" fill="var(--g-sun-soft)" opacity="0.7" />
                  <rect x="62" y="46" width="8" height="6" fill="var(--g-sky-soft)" opacity="0.6" />
                  <line x1="62" y1="25" x2="62" y2="10" stroke="var(--g-stone-ledge)" stroke-width="2" />
                  <polygon points="120,10 135,35 105,35" fill="var(--g-stone-deep)" />
                  <rect x="105" y="35" width="30" height="75" fill="var(--g-ink)" />
                  <rect x="180" y="20" width="36" height="90" fill="var(--g-ink-soft)" rx="2" />
                  <rect x="224" y="20" width="36" height="90" fill="var(--g-ink-soft)" rx="2" />
                  <rect x="216" y="45" width="8" height="8" fill="var(--g-stone-deep)" />
                  <rect x="740" y="30" width="40" height="80" fill="var(--g-ink)" rx="2" />
                  <rect x="748" y="38" width="6" height="6" fill="var(--g-sun-soft)" opacity="0.8" />
                  <rect x="760" y="38" width="6" height="6" fill="var(--g-sun-soft)" opacity="0.8" />
                  <rect x="800" y="15" width="55" height="95" fill="var(--g-ink-soft)" rx="2" />
                  <line x1="827" y1="15" x2="827" y2="4" stroke="var(--g-rose-deep)" stroke-width="2" />
                  <rect x="880" y="40" width="38" height="70" fill="var(--g-ink)" rx="2" />
                  <rect x="935" y="22" width="45" height="88" fill="var(--g-ink-soft)" rx="2" />
                </svg>
              </div>

              <!-- 低空飄雲 -->
              <div class="stage1-cloud" style="width:140px; height:40px; left:8%; bottom:210px;"></div>
              <div class="stage1-cloud" style="width:170px; height:46px; right:12%; bottom:260px;"></div>

              <!-- 低空飛鳥 -->
              <div class="stage1-birds">
                <svg viewBox="0 0 90 40" width="100%" height="100%">
                  <path d="M10 20 Q16 12 22 20 Q28 12 34 20" stroke="var(--g-ink)" stroke-width="2" fill="none" stroke-linecap="round" />
                  <path d="M40 10 Q45 4 50 10 Q55 4 60 10" stroke="var(--g-ink)" stroke-width="1.8" fill="none" stroke-linecap="round" />
                  <path d="M65 24 Q69 18 73 24 Q77 18 81 24" stroke="var(--g-ink-soft)" stroke-width="1.5" fill="none" stroke-linecap="round" />
                </svg>
              </div>

              <!-- 低空直升機（雙旋翼旋轉、巡邏盤旋） -->
              <div class="stage1-helicopter">
                <svg viewBox="0 0 100 52" width="100%" height="100%">
                  <rect x="44" y="6" width="6" height="8" fill="var(--g-ink-soft)" />
                  <ellipse class="heli-rotor-main" cx="47" cy="6" rx="42" ry="2.5" fill="var(--g-ink)" />
                  <path d="M22 26 C22 16 34 14 54 14 C68 14 76 20 76 28 C76 36 66 38 50 38 C34 38 22 34 22 26 Z" fill="var(--g-peach-deep)" stroke="var(--g-wood-deep)" stroke-width="1.8" />
                  <path d="M54 16 C64 16 72 21 72 27 L54 27 Z" fill="var(--g-sky)" stroke="var(--g-sky-deep)" stroke-width="1.5" />
                  <circle cx="58" cy="22" r="2.5" fill="var(--g-ink)" />
                  <path d="M24 28 L66 28" stroke="var(--g-surface-raised)" stroke-width="2.5" stroke-linecap="round" />
                  <path d="M22 24 L4 20 L2 26 L22 28 Z" fill="var(--g-peach-deep)" stroke="var(--g-wood-deep)" stroke-width="1.5" />
                  <polygon points="4,14 9,21 3,22" fill="var(--g-rose-deep)" />
                  <ellipse class="heli-rotor-tail" cx="5" cy="18" rx="2.5" ry="8" fill="var(--g-ink-soft)" />
                  <line x1="38" y1="38" x2="34" y2="46" stroke="var(--g-ink-soft)" stroke-width="2" />
                  <line x1="56" y1="38" x2="52" y2="46" stroke="var(--g-ink-soft)" stroke-width="2" />
                  <rect x="24" y="45" width="46" height="3" rx="1.5" fill="var(--g-ink)" />
                </svg>
              </div>

              <!-- 地表發射平台總成（底座頂高 38px，火箭底座吻合貼齊） -->
              <div class="stage1-launch-station">
                <div class="stage1-pad-deck">
                  <div class="stage1-clamp-arm stage1-clamp-left"></div>
                  <div class="stage1-exhaust-trench"></div>
                  <div class="stage1-clamp-arm stage1-clamp-right"></div>
                </div>

                <!-- 大量滾滾噴發的「完全不透明」起飛濃煙雲團 -->
                <div class="stage1-launch-smoke" id="launchSmoke">
                  <!-- 左翼噴湧厚實濃煙 -->
                  <div class="smoke-puff smoke-l1"></div>
                  <div class="smoke-puff smoke-l2"></div>
                  <div class="smoke-puff smoke-l3"></div>
                  <div class="smoke-puff smoke-l4"></div>
                  <div class="smoke-puff smoke-l5"></div>
                  <!-- 右翼噴湧厚實濃煙 -->
                  <div class="smoke-puff smoke-r1"></div>
                  <div class="smoke-puff smoke-r2"></div>
                  <div class="smoke-puff smoke-r3"></div>
                  <div class="smoke-puff smoke-r4"></div>
                  <div class="smoke-puff smoke-r5"></div>
                  <!-- 中央向上翻滾大雲團 -->
                  <div class="smoke-puff smoke-c1"></div>
                  <div class="smoke-puff smoke-c2"></div>
                  <div class="smoke-puff smoke-c3"></div>
                  <div class="smoke-puff smoke-c4"></div>
                </div>

                <div class="stage1-tower">
                  <svg viewBox="0 0 52 220" width="100%" height="100%">
                    <line x1="8" y1="0" x2="8" y2="220" stroke="var(--g-ink-soft)" stroke-width="4" />
                    <line x1="44" y1="0" x2="44" y2="220" stroke="var(--g-ink-soft)" stroke-width="4" />
                    <line x1="8" y1="30" x2="44" y2="65" stroke="var(--g-stone-deep)" stroke-width="2.5" />
                    <line x1="44" y1="30" x2="8" y2="65" stroke="var(--g-stone-deep)" stroke-width="2.5" />
                    <line x1="8" y1="90" x2="44" y2="125" stroke="var(--g-stone-deep)" stroke-width="2.5" />
                    <line x1="44" y1="90" x2="8" y2="125" stroke="var(--g-stone-deep)" stroke-width="2.5" />
                    <line x1="8" y1="150" x2="44" y2="185" stroke="var(--g-stone-deep)" stroke-width="2.5" />
                    <line x1="44" y1="150" x2="8" y2="185" stroke="var(--g-stone-deep)" stroke-width="2.5" />
                    <rect x="0" y="2" width="52" height="8" rx="2" fill="var(--g-rose-deep)" />
                    <circle cx="26" cy="5" r="3" fill="var(--g-rose-soft)" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- STAGE 2: 500m ~ 3,000m 豐富多層雲海、圓潤熱氣球、齊柏林飛船、噴射客機 -->
            <div class="stage2-cloud-group">
              <!-- 大量多層蓬鬆雲朵群 -->
              <div class="stage2-cloud stage2-cloud-1"></div>
              <div class="stage2-cloud stage2-cloud-2"></div>
              <div class="stage2-cloud stage2-cloud-3"></div>
              <div class="stage2-cloud stage2-cloud-4"></div>
              <div class="stage2-cloud stage2-cloud-5"></div>
              <div class="stage2-cloud stage2-cloud-6"></div>
              <div class="stage2-cloud stage2-cloud-7"></div>
              
              <!-- 經典對稱圓潤熱氣球（造型優雅圓潤，明亮暖色系） -->
              <div class="stage2-hot-balloon">
                <svg viewBox="0 0 120 160" width="100%" height="100%">
                  <defs>
                    <clipPath id="balloonClip">
                      <path d="M 60 2 C 96 2, 118 32, 118 68 C 118 102, 90 122, 74 132 L 74 136 L 46 136 L 46 132 C 30 122, 2 102, 2 68 C 2 32, 24 2, 60 2 Z" />
                    </clipPath>
                  </defs>
                  <g clip-path="url(#balloonClip)">
                    <rect x="0" y="0" width="120" height="140" fill="var(--g-rose)" />
                    <path d="M 60 2 C 86 2, 102 32, 102 68 C 102 102, 80 122, 68 136 L 52 136 C 40 122, 18 102, 18 68 C 18 32, 34 2, 60 2 Z" fill="var(--g-sun)" />
                    <path d="M 60 2 C 78 2, 88 32, 88 68 C 88 102, 72 122, 64 136 L 56 136 C 48 122, 32 102, 32 68 C 32 32, 42 2, 60 2 Z" fill="var(--g-sky)" />
                    <path d="M 60 2 C 69 2, 74 32, 74 68 C 74 102, 66 122, 62 136 L 58 136 C 54 122, 46 102, 46 68 C 46 32, 51 2, 60 2 Z" fill="var(--g-mint)" />
                    <path d="M 60 2 C 96 2, 118 32, 118 68 C 118 102, 90 122, 74 132 L 74 136 L 46 136 L 46 132 C 30 122, 2 102, 2 68 C 2 32, 24 2, 60 2 Z" fill="none" stroke="var(--g-rose-ledge)" stroke-width="2" />
                  </g>
                  <rect x="46" y="136" width="28" height="4" rx="1.5" fill="var(--g-stone-ledge)" />
                  <polygon points="56,137 64,137 60,131" fill="var(--g-sun)" />
                  <polygon points="58,137 62,137 60,133" fill="var(--g-peach)" />
                  <line x1="48" y1="139" x2="51" y2="148" stroke="var(--g-stone-deep)" stroke-width="1.5" />
                  <line x1="72" y1="139" x2="69" y2="148" stroke="var(--g-stone-deep)" stroke-width="1.5" />
                  <line x1="56" y1="139" x2="57" y2="148" stroke="var(--g-stone-deep)" stroke-width="1.2" />
                  <line x1="64" y1="139" x2="63" y2="148" stroke="var(--g-stone-deep)" stroke-width="1.2" />
                  <rect x="50" y="148" width="20" height="15" rx="3" fill="var(--g-wood)" stroke="var(--g-wood-deep)" stroke-width="1.5" />
                  <line x1="50" y1="153" x2="70" y2="153" stroke="var(--g-wood-deep)" stroke-width="1" />
                  <line x1="50" y1="158" x2="70" y2="158" stroke="var(--g-wood-deep)" stroke-width="1" />
                </svg>
              </div>

              <!-- 齊柏林巨型飛船（飛艇優雅巡航，尾翼十字與觀景吊艙） -->
              <div class="stage2-zeppelin">
                <svg viewBox="0 0 160 64" width="100%" height="100%">
                  <polygon points="26,14 4,6 8,24 28,24" fill="var(--g-sky-deep)" stroke="var(--g-sky-deep)" stroke-width="1.5" />
                  <polygon points="26,50 4,58 8,40 28,40" fill="var(--g-sky-deep)" stroke="var(--g-sky-deep)" stroke-width="1.5" />
                  <path d="M18 32 C18 12 55 6 110 10 C145 13 158 24 158 32 C158 40 145 51 110 54 C55 58 18 52 18 32 Z" fill="var(--g-surface-sunken)" stroke="var(--g-stone-ledge)" stroke-width="2" />
                  <path d="M22 32 C55 24 110 24 156 32" stroke="var(--g-stone)" stroke-width="1.5" fill="none" />
                  <path d="M20 32 C55 32 110 32 158 32" stroke="var(--g-sky-deep)" stroke-width="4" fill="none" />
                  <path d="M20 35 C55 35 110 35 158 35" stroke="var(--g-sun-ledge)" stroke-width="2" fill="none" />
                  <path d="M22 32 C55 40 110 40 156 32" stroke="var(--g-stone)" stroke-width="1.5" fill="none" />
                  <path d="M150 26 C156 28 158 30 158 32 C158 34 156 36 150 38 Z" fill="var(--g-stone-deep)" />
                  <rect x="74" y="52" width="46" height="10" rx="3" fill="var(--g-ink)" stroke="var(--g-ink)" stroke-width="1.5" />
                  <circle cx="82" cy="57" r="1.8" fill="var(--g-sun-soft)" />
                  <circle cx="90" cy="57" r="1.8" fill="var(--g-sun-soft)" />
                  <circle cx="98" cy="57" r="1.8" fill="var(--g-sun-soft)" />
                  <circle cx="106" cy="57" r="1.8" fill="var(--g-sun-soft)" />
                  <circle cx="114" cy="57" r="1.8" fill="var(--g-sun-soft)" />
                  <rect x="52" y="44" width="14" height="6" rx="2" fill="var(--g-ink-soft)" />
                  <line x1="50" y1="41" x2="50" y2="53" stroke="var(--g-stone-ledge)" stroke-width="1.5" />
                </svg>
              </div>

              <!-- 高空噴射客機（從左飛向右，機頭在前、凝結尾羽煙在後） -->
              <div class="stage2-airplane">
                <svg viewBox="0 0 120 46" width="100%" height="100%">
                  <path d="M12 22 L55 22 L45 4 L60 4 L82 22 L112 22 Q120 22 118 25 Q114 27 96 27 L65 42 L52 42 L60 27 L22 27 L16 34 L8 34 L12 22 Z" fill="var(--g-surface-raised)" stroke="var(--g-stone)" stroke-width="1.5" />
                  <circle cx="70" cy="24" r="1.5" fill="var(--g-sky-deep)" />
                  <circle cx="76" cy="24" r="1.5" fill="var(--g-sky-deep)" />
                  <circle cx="82" cy="24" r="1.5" fill="var(--g-sky-deep)" />
                  <circle cx="88" cy="24" r="1.5" fill="var(--g-sky-deep)" />
                  <circle cx="94" cy="24" r="1.5" fill="var(--g-sky-deep)" />
                  <line x1="0" y1="23" x2="16" y2="23" stroke="var(--g-surface-raised)" stroke-width="2.5" stroke-linecap="round" opacity="0.9" />
                  <line x1="0" y1="26" x2="18" y2="26" stroke="var(--g-surface-raised)" stroke-width="2.5" stroke-linecap="round" opacity="0.9" />
                </svg>
              </div>
            </div>

            <!-- STAGE 3: 3,000m ~ 10,000m 平流層雙層極光、流星與高空卷雲 -->
            <div class="stage3-aurora-group">
              <div class="stage3-cirrus" style="width:180px; height:24px; left:10%; top:15%;"></div>
              <div class="stage3-cirrus" style="width:220px; height:26px; right:8%; top:38%;"></div>
              <div class="stage3-aurora-wave"></div>
              <div class="stage3-aurora-wave-2"></div>
              <div class="stage3-shooting-star" style="top:25%; left:12%;"></div>
              <div class="stage3-shooting-star" style="top:55%; right:16%; animation-delay:1.5s;"></div>
            </div>

            <!-- STAGE 4: 10,000m ~ 30,000m 中氣層地球弧線、太空站 ISS、人造衛星 -->
            <div class="stage4-mesosphere-group">
              <div class="stage4-earth-curve"></div>
              <div class="stage4-iss">
                <svg viewBox="0 0 110 60" width="100%" height="100%">
                  <rect x="36" y="26" width="38" height="8" rx="2" fill="var(--g-stone-soft)" stroke="var(--g-stone-ledge)" stroke-width="1.5" />
                  <circle cx="55" cy="30" r="3" fill="var(--g-sky)" />
                  <rect x="4" y="8" width="28" height="44" rx="2" fill="var(--g-sky-deep)" stroke="var(--g-sky)" stroke-width="1.5" />
                  <line x1="4" y1="22" x2="32" y2="22" stroke="var(--g-sky)" stroke-width="1" />
                  <line x1="4" y1="36" x2="32" y2="36" stroke="var(--g-sky)" stroke-width="1" />
                  <line x1="18" y1="8" x2="18" y2="52" stroke="var(--g-sky)" stroke-width="1" />
                  <line x1="32" y1="30" x2="36" y2="30" stroke="var(--g-stone-ledge)" stroke-width="3" />
                  <rect x="78" y="8" width="28" height="44" rx="2" fill="var(--g-sky-deep)" stroke="var(--g-sky)" stroke-width="1.5" />
                  <line x1="78" y1="22" x2="106" y2="22" stroke="var(--g-sky)" stroke-width="1" />
                  <line x1="78" y1="36" x2="106" y2="36" stroke="var(--g-sky)" stroke-width="1" />
                  <line x1="92" y1="8" x2="92" y2="52" stroke="var(--g-sky)" stroke-width="1" />
                  <line x1="74" y1="30" x2="78" y2="30" stroke="var(--g-stone-ledge)" stroke-width="3" />
                </svg>
              </div>

              <div class="stage4-satellite">
                <svg viewBox="0 0 95 75" width="100%" height="100%">
                  <rect x="6" y="24" width="26" height="22" rx="2" fill="var(--g-sky-deep)" stroke="var(--g-sky)" stroke-width="1.5" />
                  <line x1="19" y1="24" x2="19" y2="46" stroke="var(--g-sky)" stroke-width="1" />
                  <rect x="63" y="24" width="26" height="22" rx="2" fill="var(--g-sky-deep)" stroke="var(--g-sky)" stroke-width="1.5" />
                  <line x1="76" y1="24" x2="76" y2="46" stroke="var(--g-sky)" stroke-width="1" />
                  <rect x="36" y="20" width="23" height="30" rx="4" fill="var(--g-stone)" stroke="var(--g-stone-ledge)" stroke-width="2" />
                  <circle cx="47" cy="31" r="3.5" fill="var(--g-peach-deep)" />
                  <circle cx="47" cy="41" r="2.5" fill="var(--g-mint-deep)" />
                  <path d="M47 20 L47 8 M38 8 Q47 2 56 8 Z" stroke="var(--g-stone)" stroke-width="2" fill="none" />
                </svg>
              </div>
            </div>

            <!-- STAGE 5: 30,000m+ 外太空黑夜、土星環、火星、隕石群、月球與 UFO -->
            <div class="stage5-space-group">
              <div class="stage5-stars-field"></div>
              <div class="stage5-saturn">
                <svg viewBox="0 0 130 90" width="100%" height="100%">
                  <ellipse cx="65" cy="45" rx="58" ry="18" fill="none" stroke="var(--g-sun-ledge)" stroke-width="6" opacity="0.65" transform="rotate(-18 65 45)" />
                  <circle cx="65" cy="45" r="24" fill="url(#saturnGrad)" />
                  <path d="M8 45 A58 18 0 0 0 122 45" fill="none" stroke="var(--g-sun)" stroke-width="7" opacity="0.9" transform="rotate(-18 65 45)" />
                  <defs>
                    <radialGradient id="saturnGrad" cx="40%" cy="40%" r="60%">
                      <stop offset="0%" stop-color="var(--g-sun-soft)" />
                      <stop offset="60%" stop-color="var(--g-peach-deep)" />
                      <stop offset="100%" stop-color="var(--g-bark-deep)" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>

              <div class="stage5-mars">
                <svg viewBox="0 0 72 72" width="100%" height="100%">
                  <defs><radialGradient id="marsGrad" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="var(--g-rose)" /><stop offset="70%" stop-color="var(--g-rose-deep)" /><stop offset="100%" stop-color="var(--g-rose-deep)" /></radialGradient></defs><circle cx="36" cy="36" r="34" fill="url(#marsGrad)" />
                  <circle cx="26" cy="28" r="6" fill="var(--g-rose-deep)" opacity="0.5" />
                  <circle cx="44" cy="46" r="8" fill="var(--g-rose-deep)" opacity="0.6" />
                  <circle cx="48" cy="24" r="4" fill="var(--g-rose-deep)" opacity="0.4" />
                </svg>
              </div>

              <div class="stage5-asteroid stage5-asteroid-1">
                <svg viewBox="0 0 48 42" width="100%" height="100%">
                  <polygon points="12,4 36,2 46,20 38,38 16,40 4,26" fill="var(--g-stone-deep)" stroke="var(--g-ink-soft)" stroke-width="2" />
                  <circle cx="22" cy="18" r="3" fill="var(--g-ink)" />
                  <circle cx="32" cy="28" r="4" fill="var(--g-ink)" />
                </svg>
              </div>

              <div class="stage5-asteroid stage5-asteroid-2">
                <svg viewBox="0 0 36 32" width="100%" height="100%">
                  <polygon points="8,3 28,2 34,16 26,30 10,29 2,18" fill="var(--g-stone-deep)" stroke="var(--g-bark-ledge)" stroke-width="1.8" />
                  <circle cx="16" cy="14" r="2.5" fill="var(--g-bark-deep)" />
                </svg>
              </div>

              <div class="stage5-moon">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <path d="M50 10 A40 40 0 1 0 88 70 A32 32 0 1 1 50 10 Z" fill="var(--g-sun-soft)" />
                  <path d="M48 42 Q54 36 60 42" stroke="var(--g-sun-deep)" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <path d="M52 54 Q58 60 64 54" stroke="var(--g-sun-deep)" stroke-width="2.5" stroke-linecap="round" fill="none" />
                  <ellipse cx="66" cy="48" rx="3.5" ry="2" fill="var(--g-rose)" opacity="0.6" />
                </svg>
              </div>

              <div class="stage5-ufo">
                <svg viewBox="0 0 90 64" width="100%" height="100%">
                  <ellipse cx="45" cy="28" rx="22" ry="18" fill="var(--g-mint)" opacity="0.85" />
                  <circle cx="45" cy="24" r="9" fill="var(--g-mint-deep)" />
                  <circle cx="42" cy="23" r="2.2" fill="var(--g-surface-raised)" />
                  <circle cx="48" cy="23" r="2.2" fill="var(--g-surface-raised)" />
                  <path d="M36 28 Q30 20 32 14" stroke="var(--g-mint-deep)" stroke-width="3" stroke-linecap="round" fill="none" />
                  <ellipse cx="45" cy="40" rx="40" ry="13" fill="var(--g-stone-ledge)" stroke="var(--g-stone-deep)" stroke-width="2" />
                  <circle cx="22" cy="40" r="2.8" fill="var(--g-sun-ledge)" />
                  <circle cx="37" cy="42" r="2.8" fill="var(--g-sky)" />
                  <circle cx="53" cy="42" r="2.8" fill="var(--g-rose-deep)" />
                  <circle cx="68" cy="40" r="2.8" fill="var(--g-sun-ledge)" />
                </svg>
              </div>
            </div>

          </div>
        </div>

        <!-- 舞台左側高度標尺 -->
        <div class="rocket-alt-sidebar">
          <div class="rocket-alt-track">
            <div class="rocket-alt-bar" id="altBar"></div>
            <div class="rocket-alt-target-line" title="30,000m 目標線"></div>
          </div>
          <div class="rocket-alt-label" id="altVal">0 m</div>
        </div>

        <!-- 火箭主體（初始精準座落在發射台底座表面 33px，接觸完美無懸空） -->
        <div class="rocket-actor-container" id="rocketActor">
          <div class="rocket-svg-wrap">
            <svg viewBox="0 0 100 165" width="100%" height="100%">
              <path d="M15 125 L4 160 L28 150 Z" fill="var(--g-rose-deep)" />
              <path d="M85 125 L96 160 L72 150 Z" fill="var(--g-rose-deep)" />
              <path d="M50 8 C72 36 82 82 78 142 L22 142 C18 82 28 36 50 8 Z" fill="var(--g-surface-raised)" />
              <path d="M50 8 C60 25 67 40 70 48 L30 48 C33 40 40 25 50 8 Z" fill="var(--g-rose-deep)" />
              <path d="M24 128 L76 128 L74 135 L26 135 Z" fill="var(--g-ink)" />
              <rect x="36" y="142" width="28" height="9" rx="3" fill="var(--g-ink-soft)" />
            </svg>

            <!-- 圓形金屬舷窗與使用者角色頭像 -->
            <div class="rocket-porthole-avatar" id="portholeAvatar">
              ${GameArt.avatar(this.look, 48)}
            </div>
            <div class="rocket-porthole-glass"></div>

            <!-- 動態火焰（速度越快越大越偏藍白） -->
            <div class="rocket-thruster-flame" id="thrusterFlame">
              <svg viewBox="0 0 40 75" width="100%" height="100%">
                <path id="flameOuter" d="M20 0 Q34 38 20 75 Q6 38 20 0 Z" fill="var(--g-peach-deep)" />
                <path id="flameInner" d="M20 0 Q28 28 20 52 Q12 28 20 0 Z" fill="var(--g-sun)" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 失敗跳傘舞台（降落傘 Z 軸低於玩家角色） -->
        <div class="rocket-eject-stage" id="ejectStage">
          <div class="rocket-eject-chute">
            ${GameArt.prop("parachute", { state: "open" })}
          </div>
          <div class="rocket-eject-character">
            ${GameArt.character({ ...this.look, pose: "fall", view: "front" })}
          </div>
        </div>

        <!-- 一體化過關 POP 畫面：背景太空艙內景＋下方數據儀表（絕無多餘拉桿條，絕不覆蓋遮擋！） -->
        <div class="rocket-cockpit-overlay" id="cockpitOverlay" style="display:none;">
          <div class="cockpit-console-card">
            
            <!-- 上半部：太空艙內部實景（艙壁、鉚釘、遙測螢幕、大圓形觀景窗） -->
            <div class="cockpit-cabin-scene">
              <svg class="cockpit-cabin-svg" viewBox="0 0 460 205" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cabinWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="var(--g-surface-raised)" />
                    <stop offset="45%" stop-color="var(--g-stone-soft)" />
                    <stop offset="100%" stop-color="var(--g-stone)" />
                  </linearGradient>
                  <linearGradient id="cabinCeilShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="var(--g-stone-deep)" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="var(--g-stone-deep)" stop-opacity="0" />
                  </linearGradient>
                  <linearGradient id="portholeRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--g-surface-sunken)" />
                    <stop offset="50%" stop-color="var(--g-stone-ledge)" />
                    <stop offset="100%" stop-color="var(--g-ink-soft)" />
                  </linearGradient>
                </defs>

                <!-- 白色/金屬科技艙壁 -->
                <rect x="0" y="0" width="460" height="205" fill="url(#cabinWallGrad)" />
                <rect x="0" y="0" width="460" height="10" fill="var(--g-stone-deep)" />
                <rect x="0" y="195" width="460" height="10" fill="var(--g-ink-soft)" />
                <rect x="0" y="10" width="460" height="15" fill="url(#cabinCeilShadow)" />

                <!-- 艙頂藍色氣氛燈條 -->
                <rect x="90" y="2" width="280" height="6" rx="3" fill="var(--g-sky)" opacity="0.9" filter="drop-shadow(0 0 6px var(--g-sky))" />

                <!-- 左側艙壁操控面板與螢幕 -->
                <rect x="10" y="26" width="62" height="152" rx="6" fill="var(--g-ink)" stroke="var(--g-stone-deep)" stroke-width="2" />
                <rect x="16" y="34" width="50" height="38" rx="3" fill="var(--g-ink)" stroke="var(--g-sky)" stroke-width="1.5" />
                <path d="M20 53 L28 53 L32 44 L38 62 L42 50 L46 53 L62 53" stroke="var(--g-sky)" stroke-width="2" fill="none" />
                <circle cx="22" cy="84" r="3.5" fill="var(--g-mint-deep)" />
                <circle cx="34" cy="84" r="3.5" fill="var(--g-sky)" />
                <circle cx="46" cy="84" r="3.5" fill="var(--g-peach-deep)" />
                <circle cx="58" cy="84" r="3.5" fill="var(--g-rose-deep)" />
                <rect x="16" y="98" width="50" height="68" rx="4" fill="var(--g-ink)" />
                <rect x="24" y="108" width="8" height="48" rx="4" fill="var(--g-ink)" />
                <circle cx="28" cy="120" r="6" fill="var(--g-rose-deep)" />
                <rect x="42" y="110" width="16" height="10" rx="2" fill="var(--g-sky)" />
                <rect x="42" y="126" width="16" height="10" rx="2" fill="var(--g-sun-ledge)" />
                <rect x="42" y="142" width="16" height="10" rx="2" fill="var(--g-mint-deep)" />

                <!-- 右側艙壁維生儀表面板 -->
                <rect x="388" y="26" width="62" height="152" rx="6" fill="var(--g-ink)" stroke="var(--g-stone-deep)" stroke-width="2" />
                <rect x="394" y="34" width="50" height="52" rx="3" fill="var(--g-ink)" stroke="var(--g-mint-deep)" stroke-width="1.5" />
                <circle cx="419" cy="60" r="16" fill="none" stroke="var(--g-mint-deep)" stroke-width="1.5" stroke-dasharray="3,2" />
                <circle cx="419" cy="60" r="6" fill="var(--g-sky)" />
                <circle cx="429" cy="51" r="2.5" fill="var(--g-sun-ledge)" />
                <circle cx="402" cy="98" r="3.5" fill="var(--g-mint-deep)" />
                <circle cx="419" cy="98" r="3.5" fill="var(--g-mint-deep)" />
                <circle cx="436" cy="98" r="3.5" fill="var(--g-sky)" />
                <rect x="394" y="112" width="50" height="54" rx="4" fill="var(--g-ink)" />
                <line x1="400" y1="126" x2="438" y2="126" stroke="var(--g-stone-deep)" stroke-width="2" />
                <line x1="400" y1="138" x2="438" y2="138" stroke="var(--g-stone-deep)" stroke-width="2" />
                <line x1="400" y1="150" x2="438" y2="150" stroke="var(--g-stone-deep)" stroke-width="2" />

                <!-- 艙壁鉚釘與接縫結構 -->
                <circle cx="94" cy="40" r="2.5" fill="var(--g-stone-ledge)" />
                <circle cx="94" cy="102" r="2.5" fill="var(--g-stone-ledge)" />
                <circle cx="94" cy="164" r="2.5" fill="var(--g-stone-ledge)" />
                <circle cx="366" cy="40" r="2.5" fill="var(--g-stone-ledge)" />
                <circle cx="366" cy="102" r="2.5" fill="var(--g-stone-ledge)" />
                <circle cx="366" cy="164" r="2.5" fill="var(--g-stone-ledge)" />

                <!-- 觀景大圓窗金屬外框 -->
                <circle cx="230" cy="102" r="82" fill="url(#portholeRimGrad)" stroke="var(--g-ink)" stroke-width="2.5" />
                <circle cx="230" cy="102" r="72" fill="var(--g-space-night-sky-top)" />
                <!-- 鉚釘裝飾圈 -->
                <circle cx="230" cy="26" r="2.5" fill="var(--g-ink-soft)" />
                <circle cx="230" cy="178" r="2.5" fill="var(--g-ink-soft)" />
                <circle cx="154" cy="102" r="2.5" fill="var(--g-ink-soft)" />
                <circle cx="306" cy="102" r="2.5" fill="var(--g-ink-soft)" />
                <circle cx="176" cy="48" r="2.5" fill="var(--g-ink-soft)" />
                <circle cx="284" cy="48" r="2.5" fill="var(--g-ink-soft)" />
                <circle cx="176" cy="156" r="2.5" fill="var(--g-ink-soft)" />
                <circle cx="284" cy="156" r="2.5" fill="var(--g-ink-soft)" />
              </svg>

              <!-- 觀景圓窗內宇宙景致 -->
              <div class="cockpit-porthole-view">
                <div class="stage5-stars-field" style="height:100%;"></div>
                <div class="cockpit-earth-mini"></div>
                <div class="cockpit-saturn-mini">
                  <svg viewBox="0 0 54 34" width="100%" height="100%">
                    <ellipse cx="27" cy="17" rx="24" ry="6.5" fill="none" stroke="var(--g-sun-ledge)" stroke-width="2.5" opacity="0.75" transform="rotate(-15 27 17)" />
                    <circle cx="27" cy="17" r="9" fill="var(--g-peach-deep)" />
                    <path d="M4 17 A24 6.5 0 0 0 50 17" fill="none" stroke="var(--g-sun)" stroke-width="3" opacity="0.9" transform="rotate(-15 27 17)" />
                  </svg>
                </div>
                <div class="cockpit-porthole-glare"></div>
              </div>

              <!-- 玩家角色在太空艙內無重力旋轉飄浮 -->
              <div class="cockpit-zero-g-char" id="cockpitChar">
                ${GameArt.character({ ...this.look, pose: "cheer", view: "front" })}
              </div>

              <!-- 艙內漂浮星星裝飾 -->
              <div class="zero-g-floating-prop zero-g-star">✨</div>
              <div class="zero-g-floating-prop zero-g-star-2">⭐</div>
            </div>

            <!-- 下半部：一體化遙測數據面板 -->
            <div class="cockpit-telemetry-dashboard">
              <div class="telemetry-header">
                <div class="telemetry-title">🎉 任務大成功！</div>
                <div class="telemetry-subtitle">火箭順利進入太空軌道，無重力漂浮中！</div>
              </div>

              <div class="telemetry-time-badge" id="telemetryTimeBadge">
                ⏱️ 達成時間：<strong id="telemetryClearTime">--</strong> 秒
                <span class="new-record-tag" id="telemetryNewRecord" style="display:none;">🏆 歷史新紀錄！</span>
              </div>

              <div class="telemetry-grid">
                <div class="telemetry-item">
                  <span class="telemetry-lbl">本次點擊</span>
                  <strong class="telemetry-num accent" id="telTotalTaps">0 次</strong>
                </div>
                <div class="telemetry-item">
                  <span class="telemetry-lbl">歷史最高點擊</span>
                  <strong class="telemetry-num" id="telBestTaps">0 次</strong>
                </div>
                <div class="telemetry-item">
                  <span class="telemetry-lbl">最高手速</span>
                  <strong class="telemetry-num" id="telPeakCPS">0.0 次/秒</strong>
                </div>
                <div class="telemetry-item">
                  <span class="telemetry-lbl">歷史最佳時間</span>
                  <strong class="telemetry-num" id="telBestTime">-- 秒</strong>
                </div>
              </div>

              <div class="telemetry-actions">
                <button type="button" class="gbtn gbtn--quiet" id="btnCockpitBack">回遊戲室</button>
                <button type="button" class="gbtn" id="btnCockpitRetry">再發射一次 🚀</button>
              </div>
            </div>

          </div>
        </div>

        <!-- 開場倒數 5-4-3-2-1-FIRE 覆蓋層 -->
        <div class="rocket-countdown-overlay" id="countdownOverlay">
          <div class="rocket-countdown-number" id="countdownNum">🚀</div>
          <div class="rocket-countdown-tip" id="countdownTip">連續快速交替點按 A 與 B 發射！</div>
          <button type="button" class="rocket-start-btn" id="btnStartCountdown">點擊開始發射 🚀</button>
        </div>
      </main>

      <!-- 底部控制按鈕區（A、B 按鍵完全置中對齊！） -->
      <footer class="rocket-controls">
        <div class="rocket-speed-badge">
          <span class="rocket-speed-label">即時手速</span>
          <span class="rocket-speed-val" id="cpsMeter">0.0 次/秒</span>
        </div>
        <div class="rocket-vpad-pair" id="vpadPair">
          <button type="button" class="vpad-k vpad-a" id="btnA">A</button>
          <button type="button" class="vpad-k vpad-b" id="btnB">B</button>
        </div>
      </footer>
    `;
  }

  private bindEvents() {
    tryFullscreenOnFirstTap();

    const handleBack = () => {
      if (typeof window !== "undefined" && window.location.protocol === "file:") {
        if (window.history.length > 1) window.history.back();
        else window.close();
      } else {
        void leaveTo(returnTarget());
      }
    };

    const btnBack = document.querySelector<HTMLButtonElement>("#rocket-back-btn")!;
    btnBack.addEventListener("click", handleBack);

    const btnSound = document.querySelector<HTMLButtonElement>("#rocket-sound-btn")!;
    btnSound.addEventListener("click", () => {
      sounds.enabled = !sounds.enabled;
      btnSound.innerHTML = icon(sounds.enabled ? "sound" : "mute");
    });

    const btnA = document.querySelector<HTMLButtonElement>("#btnA")!;
    const btnB = document.querySelector<HTMLButtonElement>("#btnB")!;

    const handleTap = (key: "a" | "b", btnEl: HTMLElement) => {
      if (this.state === "READY") {
        this.triggerStartCountdown();
        return;
      }
      if (this.state !== "PLAYING") return;
      btnEl.classList.add("on");
      setTimeout(() => btnEl.classList.remove("on"), 70);
      this.registerTap(key);
    };

    btnA.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      handleTap("a", btnA);
    });

    btnB.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      handleTap("b", btnB);
    });

    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "a" || k === "j" || k === "arrowleft") {
        handleTap("a", btnA);
      } else if (k === "b" || k === "k" || k === "arrowright" || k === " ") {
        handleTap("b", btnB);
      }
    });

    // 點擊開始發射按鈕
    const btnStart = document.querySelector<HTMLButtonElement>("#btnStartCountdown");
    if (btnStart) {
      btnStart.addEventListener("click", () => {
        this.triggerStartCountdown();
      });
    }

    // 成功畫面的按鈕監聽
    const btnCockpitBack = document.querySelector<HTMLButtonElement>("#btnCockpitBack");
    const btnCockpitRetry = document.querySelector<HTMLButtonElement>("#btnCockpitRetry");
    btnCockpitBack?.addEventListener("click", handleBack);
    btnCockpitRetry?.addEventListener("click", () => {
      const curCoins = getTokenBalance(this.profileId);
      if (curCoins < ROCKET_COST) {
        this.showNeedCoinsModal(ROCKET_COST - curCoins);
        return;
      }
      window.location.reload();
    });
  }

  private updateCoinsHUD() {
    this.coins = getTokenBalance(this.profileId);
    const coinCount = document.querySelector<HTMLElement>("#coinCount");
    if (coinCount) {
      coinCount.textContent = String(this.coins);
    }
  }

  // 準備發射階段：確保使用者互動後解鎖 Web Audio 與語音合成
  private prepareCountdown() {
    this.state = "READY";
    const overlay = document.querySelector<HTMLElement>("#countdownOverlay");
    const startHandler = () => {
      if (this.state === "READY") {
        this.triggerStartCountdown();
      }
    };
    overlay?.addEventListener("pointerdown", startHandler, { once: true });
  }

  private triggerStartCountdown() {
    if (this.state !== "READY") return;

    // 1. 扣除代幣檢查：每次遊戲消耗 5 代幣
    const currentCoins = getTokenBalance(this.profileId);
    if (currentCoins < ROCKET_COST) {
      this.showNeedCoinsModal(ROCKET_COST - currentCoins);
      return;
    }

    const ok = spendTokens(this.profileId, ROCKET_COST);
    if (!ok) {
      this.showNeedCoinsModal(ROCKET_COST - currentCoins);
      return;
    }
    this.updateCoinsHUD();

    this.state = "COUNTDOWN";

    // 關鍵解鎖：在使用者手勢事件中立即解鎖語音與 Web Audio Context
    unlockSpeech();
    sounds.initCtx();

    const btnStart = document.querySelector<HTMLElement>("#btnStartCountdown");
    if (btnStart) btnStart.style.display = "none";

    const tip = document.querySelector<HTMLElement>("#countdownTip");
    if (tip) tip.textContent = "連續快速交替點按 A 與 B 發射！";

    this.runCountdownSequence();
  }

  // 倒數計時語音：從 5 開始倒數，不念 0，不念 go，念 fire!
  private runCountdownSequence() {
    let count = 5;
    const numEl = document.querySelector<HTMLElement>("#countdownNum")!;
    const overlay = document.querySelector<HTMLElement>("#countdownOverlay")!;

    sounds.playBeep(440, 0.15);
    numEl.textContent = "5";
    speakEnglish("Five");

    this.countdownTimerId = window.setInterval(() => {
      count--;
      if (count === 4) {
        sounds.playBeep(440, 0.15);
        numEl.textContent = "4";
        speakEnglish("Four");
      } else if (count === 3) {
        sounds.playBeep(440, 0.15);
        numEl.textContent = "3";
        speakEnglish("Three");
      } else if (count === 2) {
        sounds.playBeep(440, 0.15);
        numEl.textContent = "2";
        speakEnglish("Two");
      } else if (count === 1) {
        sounds.playBeep(440, 0.15);
        numEl.textContent = "1";
        speakEnglish("One");
      } else if (count === 0) {
        // 不念 0，不念 go，念 fire!
        sounds.playBeep(880, 0.35, "triangle");
        numEl.textContent = "FIRE!";
        numEl.style.color = "var(--g-sky)";
        speakEnglish("Fire!");
      } else {
        clearInterval(this.countdownTimerId);
        overlay.style.display = "none";
        this.startGameplay();
      }
    }, 850);
  }

  private startGameplay() {
    this.state = "PLAYING";
    this.timeLeft = GAME_DURATION_SEC;
    this.startTime = performance.now(); // 記錄起飛起點時間
    this.totalTaps = 0;
    this.currentAltitude = 0;
    this.velocity = 0;
    this.peakCPS = 0;
    this.lastPressedKey = null;
    this.comboCount = 0;
    this.tapTimestamps = [];
    this.isSmokeBillowing = false;
    const launchSmoke = document.querySelector<HTMLElement>("#launchSmoke");
    if (launchSmoke) {
      launchSmoke.classList.remove("billowing", "dissipating");
    }
    this.lastFrameTime = performance.now();

    this.loop(performance.now());
  }

  /**
   * 核心推進判斷：
   * 如果沒有 A、B 輪流按，火箭就「不能推進」（推力為 0）！
   */
  private registerTap(key: "a" | "b") {
    // 檢查是否連續按同一個鍵（未輪流交替）
    if (this.lastPressedKey !== null && this.lastPressedKey === key) {
      this.comboCount = 0;
      sounds.playMissTap();
      this.showAlternateHint(key === "a" ? "b" : "a");
      return; // 推進力 = 0！火箭完全不推進！
    }

    // 順利交替點按（A -> B 或 B -> A，或第一下）
    this.lastPressedKey = key;
    this.totalTaps++;
    const now = performance.now();
    this.tapTimestamps.push(now);

    this.comboCount++;
    sounds.playTap(true, this.comboCount);

    // 依交替連擊給予推力（連擊越高推力加成越強，最大 2.2 倍）
    const boost = Math.min(2.2, 1.0 + this.comboCount * 0.06);
    const impulse = 85 * boost;
    this.velocity = Math.max(0, this.velocity) + impulse;

    // 清除可能殘留的提示
    this.clearAlternateHint();
  }

  private showAlternateHint(suggestKey: "a" | "b") {
    const vpadPair = document.querySelector<HTMLElement>("#vpadPair");
    const btnA = document.querySelector<HTMLElement>("#btnA");
    const btnB = document.querySelector<HTMLElement>("#btnB");

    if (btnA && btnB) {
      if (suggestKey === "a") {
        btnA.classList.add("suggest");
        btnB.classList.remove("suggest");
      } else {
        btnB.classList.add("suggest");
        btnA.classList.remove("suggest");
      }
    }

    if (vpadPair) {
      let hint = vpadPair.querySelector<HTMLElement>(".rocket-alt-hint");
      if (!hint) {
        hint = document.createElement("div");
        hint.className = "rocket-alt-hint";
        vpadPair.appendChild(hint);
      }
      hint.textContent = `請按 ${suggestKey.toUpperCase()} 鍵！要輪流按！`;

      window.clearTimeout(this.altHintTimer);
      this.altHintTimer = window.setTimeout(() => {
        this.clearAlternateHint();
      }, 900);
    }
  }

  private clearAlternateHint() {
    window.clearTimeout(this.altHintTimer);
    document.querySelector("#btnA")?.classList.remove("suggest");
    document.querySelector("#btnB")?.classList.remove("suggest");
    document.querySelector(".rocket-alt-hint")?.remove();
  }

  private loop(now: number) {
    if (this.state !== "PLAYING") return;

    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    const oneSecAgo = now - 1000;
    while (this.tapTimestamps.length > 0 && this.tapTimestamps[0] < oneSecAgo) {
      this.tapTimestamps.shift();
    }
    const currentCPS = this.tapTimestamps.length;
    if (currentCPS > this.peakCPS) {
      this.peakCPS = currentCPS;
    }

    // 重力減速：若不按鍵轉為負值緩慢向下降落
    const gravity = 320;
    this.velocity -= gravity * dt;
    this.velocity = Math.max(-160, Math.min(2400, this.velocity));

    // 高度更新
    this.currentAltitude = Math.max(0, this.currentAltitude + this.velocity * dt);
    if (this.currentAltitude <= 0) {
      this.currentAltitude = 0;
      if (this.velocity < 0) this.velocity = 0;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);

    this.updateMotionVisuals(currentCPS);
    this.updateHUD();

    // 達到 30,000m 提前成功通關
    if (this.currentAltitude >= TARGET_ALTITUDE) {
      const elapsed = Math.min(GAME_DURATION_SEC, (performance.now() - this.startTime) / 1000);
      this.triggerSuccess(elapsed);
      return;
    }

    // 時間結束判定
    if (this.timeLeft <= 0) {
      if (this.currentAltitude >= TARGET_ALTITUDE) {
        this.triggerSuccess(GAME_DURATION_SEC);
      } else {
        this.triggerFailure();
      }
      return;
    }

    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  private updateMotionVisuals(cps: number) {
    const rocketActor = document.querySelector<HTMLElement>("#rocketActor");
    const flameEl = document.querySelector<HTMLElement>("#thrusterFlame");
    const flameOuter = document.querySelector<SVGPathElement>("#flameOuter");
    const flameInner = document.querySelector<SVGPathElement>("#flameInner");
    const worldEl = document.querySelector<HTMLElement>("#rocketWorld");
    const altBar = document.querySelector<HTMLElement>("#altBar");
    const altVal = document.querySelector<HTMLElement>("#altVal");
    const cpsMeter = document.querySelector<HTMLElement>("#cpsMeter");
    const launchSmoke = document.querySelector<HTMLElement>("#launchSmoke");

    if (cpsMeter) {
      cpsMeter.textContent = `${cps.toFixed(1)} 次/秒`;
    }

    const isThrusting = cps > 0 && this.velocity > 20;

    // 起飛時地表發射台劇烈噴出煙霧（升空或停止時漸進消散過程動畫）
    if (launchSmoke) {
      const shouldSmoke = this.currentAltitude < 1500 && isThrusting;
      if (shouldSmoke) {
        if (!this.isSmokeBillowing) {
          this.isSmokeBillowing = true;
          launchSmoke.classList.remove("dissipating");
          launchSmoke.classList.add("billowing");
        }
      } else {
        if (this.isSmokeBillowing) {
          this.isSmokeBillowing = false;
          launchSmoke.classList.remove("billowing");
          launchSmoke.classList.add("dissipating");
        }
      }
    }

    // 火焰尺寸與顏色：按鍵頻率越快越大越偏藍白
    if (flameEl && flameOuter && flameInner) {
      if (isThrusting) {
        flameEl.classList.add("active");
        const flameH = Math.min(130, 28 + cps * 10);
        flameEl.style.height = `${flameH}px`;

        if (cps >= 7) {
          flameOuter.setAttribute("fill", "var(--g-sky-deep)");
          flameInner.setAttribute("fill", "var(--g-surface-raised)");
          flameEl.style.filter = "drop-shadow(0 0 16px var(--g-sky)) drop-shadow(0 0 24px var(--g-surface-raised))";
        } else if (cps >= 4) {
          flameOuter.setAttribute("fill", "var(--g-sky)");
          flameInner.setAttribute("fill", "var(--g-sky-soft)");
          flameEl.style.filter = "drop-shadow(0 0 12px var(--g-sky))";
        } else {
          flameOuter.setAttribute("fill", "var(--g-peach-deep)");
          flameInner.setAttribute("fill", "var(--g-sun)");
          flameEl.style.filter = "drop-shadow(0 0 6px var(--g-peach-deep))";
        }
      } else {
        flameEl.classList.remove("active");
        flameEl.style.height = "0px";
      }
    }

    // 火箭位置：未升空佇立在發射台底座（33px）；0~2,000m 抬升至巡航高度；不按鍵時緩慢降回
    if (rocketActor) {
      if (isThrusting && !prefersReducedMotion()) {
        rocketActor.classList.add("thrusting");
      } else {
        rocketActor.classList.remove("thrusting");
      }

      const stageEl = document.querySelector<HTMLElement>(".rocket-stage");
      const stageH = stageEl ? stageEl.clientHeight : 400;
      const liftProg = Math.min(1.0, this.currentAltitude / 2000);
      const targetBottom = LAUNCHPAD_BOTTOM_PX + liftProg * (stageH * 0.36 - LAUNCHPAD_BOTTOM_PX);
      rocketActor.style.bottom = `${targetBottom}px`;
    }

    // 背景垂直視差滾動
    if (worldEl) {
      const scrollRatio = Math.min(1.0, this.currentAltitude / TARGET_ALTITUDE);
      const scrollVh = scrollRatio * 380;
      worldEl.style.transform = `translateY(${scrollVh}vh)`;
    }

    // 左側高度計
    if (altBar) {
      altBar.style.height = `${Math.min(100, (this.currentAltitude / TARGET_ALTITUDE) * 94)}%`;
    }
    if (altVal) {
      altVal.textContent = `${Math.round(this.currentAltitude).toLocaleString()} m`;
    }
  }

  private updateHUD() {
    const hudTimer = document.querySelector<HTMLElement>("#hudTimer");
    const hudTapsChip = document.querySelector<HTMLElement>("#hudTapsChip");

    if (hudTimer) {
      hudTimer.textContent = `⏳ ${this.timeLeft.toFixed(1)}s`;
      if (this.timeLeft <= 3.0) {
        hudTimer.classList.add("urgent");
      } else {
        hudTimer.classList.remove("urgent");
      }
    }

    if (hudTapsChip) {
      hudTapsChip.textContent = `🚀 ${this.totalTaps} 次`;
    }
  }

  // 成功：突破大氣層，記錄達成時間，一體化過關白色太空艙與數據面板（絕無遮擋！）
  private triggerSuccess(clearTime: number) {
    this.state = "SUCCESS";
    cancelAnimationFrame(this.animFrameId);
    sounds.playVictory();
    speakEnglish("Mission Accomplished!");

    const rocketActor = document.querySelector<HTMLElement>("#rocketActor");
    if (rocketActor) rocketActor.style.display = "none";

    // 儲存記錄（含達成時間）
    const { isNewRecord, record } = saveRocketFlight(this.profileId, {
      taps: this.totalTaps,
      altitude: Math.round(this.currentAltitude),
      peakCPS: this.peakCPS,
      success: true,
      clearTime,
    });

    // 填入一體化數據儀表板
    const clearTimeEl = document.querySelector<HTMLElement>("#telemetryClearTime");
    const newRecordEl = document.querySelector<HTMLElement>("#telemetryNewRecord");
    const telTotalTaps = document.querySelector<HTMLElement>("#telTotalTaps");
    const telBestTaps = document.querySelector<HTMLElement>("#telBestTaps");
    const telPeakCPS = document.querySelector<HTMLElement>("#telPeakCPS");
    const telBestTime = document.querySelector<HTMLElement>("#telBestTime");

    if (clearTimeEl) clearTimeEl.textContent = clearTime.toFixed(1);
    if (newRecordEl) newRecordEl.style.display = isNewRecord ? "inline-block" : "none";
    if (telTotalTaps) telTotalTaps.textContent = `${this.totalTaps} 次`;
    if (telBestTaps) telBestTaps.textContent = `${record.bestTaps} 次`;
    if (telPeakCPS) telPeakCPS.textContent = `${this.peakCPS.toFixed(1)} 次/秒`;
    if (telBestTime) telBestTime.textContent = record.bestTime > 0 ? `${record.bestTime.toFixed(1)} 秒` : `${clearTime.toFixed(1)} 秒`;

    // 顯示一體化控制艙與數據面板
    const cockpitOverlay = document.querySelector<HTMLElement>("#cockpitOverlay");
    if (cockpitOverlay) cockpitOverlay.style.display = "flex";
  }

  // 失敗處理：
  // 1. 若停在發射台（未升空）：火箭不掉落，停在平台上，玩家角色露出驚訝表情
  // 2. 若在空中失敗：太空船窗框保留、太空船慢速墜落畫面外、玩家乘降落傘緩降
  private triggerFailure() {
    this.state = "FAIL";
    cancelAnimationFrame(this.animFrameId);
    sounds.playFail();
    speakEnglish("Nice try!");

    const rocketActor = document.querySelector<HTMLElement>("#rocketActor")!;
    const portholeAvatar = document.querySelector<HTMLElement>("#portholeAvatar");
    const flameEl = document.querySelector<HTMLElement>("#thrusterFlame");
    const ejectStage = document.querySelector<HTMLElement>("#ejectStage")!;
    const stageEl = document.querySelector<HTMLElement>(".rocket-stage")!;

    if (flameEl) {
      flameEl.classList.remove("active");
      flameEl.style.height = "0px";
    }

    const { isNewRecord, record } = saveRocketFlight(this.profileId, {
      taps: this.totalTaps,
      altitude: Math.round(this.currentAltitude),
      peakCPS: this.peakCPS,
      success: false,
      clearTime: GAME_DURATION_SEC,
    });

    const isStuckOnLaunchpad = this.currentAltitude <= 40;

    if (isStuckOnLaunchpad) {
      // 情況一：停在發射台沒起飛
      if (portholeAvatar) {
        const surprisedLook: Look = {
          ...this.look,
          eyes: "dot",
          mouth: "o",
          brows: "arch",
        };
        portholeAvatar.innerHTML = GameArt.avatar(surprisedLook, 48);
      }

      // 彈出逗趣驚訝對話框
      const bubble = document.createElement("div");
      bubble.className = "rocket-stuck-bubble";
      bubble.textContent = "😱 咦？！火箭沒升空！";
      rocketActor.appendChild(bubble);

      setTimeout(() => {
        this.showFailureResultModal(isNewRecord, record);
      }, 2400);

    } else {
      // 情況二：在半空中任務失敗
      if (portholeAvatar) {
        const avatarSvg = portholeAvatar.querySelector("svg");
        if (avatarSvg) avatarSvg.style.display = "none";
        portholeAvatar.style.background = "var(--g-ink)"; // 空無一人的深色駕駛艙
      }

      const rocketRect = rocketActor.getBoundingClientRect();
      const stageRect = stageEl.getBoundingClientRect();

      const spawnX = rocketRect.left - stageRect.left + rocketRect.width / 2;
      const spawnY = rocketRect.top - stageRect.top + 10;

      ejectStage.style.left = `${spawnX}px`;
      ejectStage.style.top = `${spawnY}px`;
      ejectStage.classList.add("descending");

      this.dropRocketOffscreen(rocketActor, stageRect.height);

      setTimeout(() => {
        this.showFailureResultModal(isNewRecord, record);
      }, 3400);
    }
  }

  private dropRocketOffscreen(rocketEl: HTMLElement, stageHeight: number) {
    rocketEl.classList.remove("thrusting");
    rocketEl.style.transition = "none";
    rocketEl.style.animation = "none";

    const GRAVITY = 520;
    let vy = -60;
    let y = 0;
    let rot = 0;
    const startBottom = parseFloat(rocketEl.style.bottom || "33") || 33;
    const exitDistance = stageHeight - startBottom + rocketEl.offsetHeight + 120;
    let last = performance.now();
    const startedAt = last;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = (now - startedAt) / 1000;

      vy += GRAVITY * dt;
      y += vy * dt;
      if (elapsed > 0.2) rot = Math.min(140, rot + 70 * dt);
      const wobble = Math.sin(elapsed * 12) * Math.max(0, 3 - elapsed * 1.5);

      rocketEl.style.transform = `translateX(calc(-50% + ${wobble.toFixed(1)}px)) translateY(${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;

      if (y < exitDistance) {
        requestAnimationFrame(step);
      } else {
        rocketEl.style.visibility = "hidden";
      }
    };
    requestAnimationFrame(step);
  }

  // 代幣不足提示視窗
  private showNeedCoinsModal(diff: number) {
    const modal = document.createElement("div");
    modal.className = "rocket-result-modal";
    modal.innerHTML = `
      <div class="rocket-need-coins-card">
        <div style="font-size:38px; margin-bottom:8px;">🪙</div>
        <div class="rocket-result-title">代幣不足</div>
        <div class="rocket-result-subtitle" style="margin-top:6px; line-height:1.5;">
          再多 <strong>${diff}</strong> 個代幣就能發射火箭囉！<br>
          <span style="font-size:12px; color:var(--g-ink-soft);">完成一輪英語練習就能賺代幣</span>
        </div>
        <div class="rocket-result-actions" style="margin-top:16px;">
          <button type="button" class="gbtn gbtn--quiet" id="btnCoinCancel">等一下</button>
          <button type="button" class="gbtn" id="btnCoinLearn">去學習賺代幣</button>
        </div>
      </div>
    `;

    const stageEl = document.querySelector<HTMLElement>(".rocket-stage") || this.appEl;
    stageEl.appendChild(modal);

    modal.querySelector("#btnCoinCancel")?.addEventListener("click", () => {
      modal.remove();
    });

    modal.querySelector("#btnCoinLearn")?.addEventListener("click", () => {
      modal.remove();
      void leaveTo("home");
    });
  }

  // 任務失敗結算面板（符合遊戲室規範）
  private showFailureResultModal(
    isNewRecord: boolean,
    record: ReturnType<typeof loadRocketRecord>
  ) {
    this.state = "RESULT";
    const rank = getRocketRank(this.currentAltitude, false);

    const modal = document.createElement("div");
    modal.className = "rocket-result-modal";
    modal.innerHTML = `
      <div class="rocket-result-card">
        <div class="rocket-result-title">🪂 任務失敗</div>
        <div class="rocket-result-subtitle">${this.currentAltitude <= 40 ? "火箭停在發射台未能升空，再試一次！" : "高度不足，角色已安全跳傘降落。"}</div>
        ${isNewRecord ? `<div style="background:var(--g-sun-soft); color:var(--g-sun-deep); padding:5px 10px; border-radius:var(--g-radius-pill); font-size:12px; font-weight:800; margin-bottom:12px;">🏆 突破個人最佳紀錄！</div>` : ""}

        <div class="rocket-result-stats">
          <div class="rocket-stat-item">
            <div class="rocket-stat-label">本次點擊數</div>
            <div class="rocket-stat-val accent">${this.totalTaps} 次</div>
          </div>
          <div class="rocket-stat-item">
            <div class="rocket-stat-label">歷史最高點擊</div>
            <div class="rocket-stat-val">${record.bestTaps} 次</div>
          </div>
          <div class="rocket-stat-item">
            <div class="rocket-stat-label">飛行高度</div>
            <div class="rocket-stat-val">${Math.round(this.currentAltitude).toLocaleString()} m</div>
          </div>
          <div class="rocket-stat-item">
            <div class="rocket-stat-label">太空稱號</div>
            <div class="rocket-stat-val" style="font-size:14px; margin-top:3px;">
              ${rank.title.split(" ")[0]}
            </div>
          </div>
        </div>

        <div class="rocket-result-actions">
          <button type="button" class="gbtn gbtn--quiet" id="btnFailBack">回遊戲室</button>
          <button type="button" class="gbtn" id="btnFailRetry">再試一次 🚀</button>
        </div>
      </div>
    `;

    const stageEl = document.querySelector<HTMLElement>(".rocket-stage") || this.appEl;
    stageEl.appendChild(modal);

    const handleBack = () => {
      if (typeof window !== "undefined" && window.location.protocol === "file:") {
        if (window.history.length > 1) window.history.back();
        else window.close();
      } else {
        void leaveTo(returnTarget());
      }
    };

    modal.querySelector("#btnFailBack")?.addEventListener("click", handleBack);
    modal.querySelector("#btnFailRetry")?.addEventListener("click", () => {
      const curCoins = getTokenBalance(this.profileId);
      if (curCoins < ROCKET_COST) {
        modal.remove();
        this.showNeedCoinsModal(ROCKET_COST - curCoins);
        return;
      }
      window.location.reload();
    });
  }
}

preventZoomGestures();
if (window.matchMedia("(orientation: portrait) and (max-width: 700px)").matches) {
  addRotateHint();
}

const rootEl = document.querySelector<HTMLElement>("#rocket-app");
if (rootEl) {
  new RocketGame(rootEl);
}
