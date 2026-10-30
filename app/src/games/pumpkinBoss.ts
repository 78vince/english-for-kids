// 巨大南瓜怪大作戰 (pumpkinBoss.ts)
// 遵守全圓角、無描邊、--g-* 代幣設計規範
// 統一按鍵 v2＋GameScreen 五種版面改版（docs/GAME-PRODUCTION-SPEC.md §6.3–6.5、§7.4、§10.1、§16）

import "../game/gamePage.css";
import "./pumpkinBoss.css";
import { GameArt, GameTokens, icon, prefersReducedMotion, type Look } from "../game/gameKit";
import { VirtualPad } from "../game/virtualPad";
import { GameScreen } from "../game/gameScreen";
import { StageController, type StageProp } from "../game/stageController";
import { getActiveLook, loadCharacter, saveCharacter } from "../game/characterStore";
import {
  loadPumpkinBossRecord,
  savePumpkinBossRecord,
} from "../game/pumpkinBossStore";
import {
  leaveTo,
  preventZoomGestures,
  requireActiveProfileId,
  returnTarget,
  toast,
} from "../game/fullscreenPage";
import { LAB_MODE } from "../gameRelease";
import { earnTokens, getTokenBalance, spendTokens } from "../gameTokens";
import { flushPending } from "../storage";
import { COIN_ICON } from "./gameIcons";

// ---------------- 聲音輔助 ----------------
function blip(kind: "jump" | "trip" | "coin" | "pop" | "sparkle"): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    if (kind === "jump") {
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (kind === "coin" || kind === "sparkle") {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(780, now + 0.08);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (kind === "pop") {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.18);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch {
    // 忽略音效失敗
  }
}

// ---------------- 石燈籠點亮華麗音效 ----------------
function playLanternHolySound(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const startT = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0, startT);
      gain.gain.linearRampToValueAtTime(0.2, startT + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(startT + 0.39);

      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(freq * 2, startT);
      sGain.gain.setValueAtTime(0, startT);
      sGain.gain.linearRampToValueAtTime(0.08, startT + 0.01);
      sGain.gain.exponentialRampToValueAtTime(0.001, startT + 0.25);
      shimmer.connect(sGain);
      sGain.connect(ctx.destination);
      shimmer.start(startT);
      shimmer.stop(startT + 0.26);
    });
  } catch {
    // 忽略音效異常
  }
}

// ---------------- 啟動初始化 ----------------
const rawProfileId = requireActiveProfileId();
if (!rawProfileId) throw new Error("登入已過期");
const profileId: string = rawProfileId;
const appEl = document.getElementById("pumpkin-boss-app");
if (!appEl) throw new Error("缺少 #pumpkin-boss-app");
preventZoomGestures();

// 規則 1：新手未持闖關道具時，系統不自動提供。唯測試階段（遊戲實驗室），測試角色預設裝備魔拐杖。
let activeLook: Look = getActiveLook(profileId) ?? GameArt.presets["kid-blue"];
const isLab = LAB_MODE;
const userHeld = activeLook.held;
const hasHolyItem = userHeld === "magiccane" || userHeld === "pumpkinbucket";
if (isLab && !hasHolyItem) {
  activeLook = { ...activeLook, held: "magiccane" };
}

const activeChar = loadCharacter(profileId);
const charName = activeChar?.slots[activeChar.activeSlot]?.name ?? "小勇者";

function escapeHtml(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const fromParam = new URLSearchParams(window.location.search).get("from");
function exitBossGame(): void {
  stage?.destroy();
  pad?.destroy();
  screen?.destroy();
  if (fromParam === "studio") {
    void flushPending().finally(() => {
      window.location.assign(`character-studio.html?from=${returnTarget()}`);
    });
  } else {
    leaveTo(returnTarget());
  }
}

// ---------------- 統一按鍵 v2 與 GameScreen ----------------
let screen: GameScreen | null = null;
let pad: VirtualPad | null = null;
let stage: StageController | null = null;

pad = new VirtualPad({ v2: true });
pad.setActive({
  up: false,
  down: true,
  left: true,
  right: true,
  a: true,
  b: true,
  c: hasHolyItem,
  d: false,
});

const heartSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>`;

// 左側 HUD：返回鍵、頭像與稱號
const backBtn = document.createElement("button");
backBtn.type = "button";
backBtn.className = "g-iconbtn pumpkin-back-btn";
backBtn.setAttribute("aria-label", "返回");
backBtn.innerHTML = icon("back");
backBtn.addEventListener("click", () => exitBossGame());

const whoEl = document.createElement("div");
whoEl.className = "pumpkin-who";
whoEl.innerHTML = `
  <span class="pumpkin-who-avatar">${GameArt.avatar(activeLook, 40)}</span>
  <span class="pumpkin-who-text">
    <strong class="g-t-heading">${escapeHtml(charName)}</strong>
    <span class="g-t-caption pumpkin-title-line">南瓜怪大作戰</span>
  </span>
`;

// 右側 HUD：代幣晶片、生命值愛心列
const coinsChip = document.createElement("span");
coinsChip.className = "pumpkin-coins-chip g-chip";
coinsChip.innerHTML = `${icon("coin")}<span>${profileId ? getTokenBalance(profileId) : 0}</span>`;

const heartsBar = document.createElement("div");
heartsBar.className = "pumpkin-hearts-bar";
heartsBar.setAttribute("aria-label", "玩家生命值");
heartsBar.innerHTML = `
  <span class="pumpkin-heart-icon" data-heart="1">${heartSvg}</span>
  <span class="pumpkin-heart-icon" data-heart="2">${heartSvg}</span>
  <span class="pumpkin-heart-icon" data-heart="3">${heartSvg}</span>
`;

// 上方 Strip 細列：辟邪石燈籠點亮進度（5 座）
const strip = document.createElement("div");
strip.className = "pumpkin-strip-bar";
strip.innerHTML = `
  <div class="pumpkin-lanterns-box" aria-label="辟邪石燈籠點亮進度">
    ${[1, 2, 3, 4, 5].map((i) => `<span class="pumpkin-lantern-pip off" data-lantern="${i}">${GameArt.prop("stoneLantern", { state: "off" })}</span>`).join("")}
  </div>
`;

appEl.innerHTML = "";
screen = new GameScreen(appEl, {
  pad,
  hudLeft: [backBtn, whoEl],
  hudRight: [coinsChip, heartsBar],
  strip,
});

stage = new StageController(screen.canvas, pad, {
  sceneId: "graveyard",
  look: activeLook,
  view: "side",
  charH: 0.32,
});
stage.setTime({ kind: "fixed", u: 0.75 }); // 夜光墓園夜晚骷髏月亮
stage.propPeriod = 3.6;

// 墓園競技場專屬道具：佈置 5 座未點燈辟邪石燈籠
const LANTERN_POSITIONS = [0.45, 1.05, 1.65, 2.25, 2.85];
const lanternProps: StageProp[] = LANTERN_POSITIONS.map((x) => ({
  id: "stoneLantern",
  x,
  state: "off",
  scale: 1.15,
}));
stage.setProps(lanternProps);

// ---------------- 遊戲核心狀態 ----------------
const PB_CONFIG = GameTokens.pumpkinBoss ?? {
  cost: 20,
  repeatRewardTokens: 30,
  maxHearts: 3,
  invulnerableMs: 1800,
  lanternsRequired: 5,
};

let hearts = PB_CONFIG.maxHearts;
let invulnerableUntil = 0;
let knockbackCooldownUntil = 0;
const litLanterns = new Set<StageProp>();
let isGameStarted = false;
let isGameOver = false;
let isVictory = false;
let victoryChestProp: StageProp | null = null;
let isChestLanding = false;
let gameStartTime = performance.now();

const userAccs = activeLook.accessories || [];
const isZombie = userAccs.includes("zombieTalisman");
const isSetA = userAccs.includes("witchhat") && userHeld === "magiccane";
const isSetB = userAccs.includes("pumpkinhood") && userHeld === "pumpkinbucket";
const isCostumeComplete = isSetA || isSetB;

// 扣款與裝備資格邏輯（非實驗室時開局扣款 20 代幣，且必須裝備齊全且未貼變身符咒）
if (!isLab) {
  if (isZombie) {
    isGameOver = true;
    toast("身上貼著變身符咒，無法進入南瓜怪戰場！請先取下符咒！", 2500, "rose");
    setTimeout(() => exitBossGame(), 600);
  } else if (!isCostumeComplete) {
    isGameOver = true;
    toast("裝備不齊全！需穿戴【巫師帽＋魔拐杖】或【南瓜萌頭＋糖果桶】！", 2500, "stone");
    setTimeout(() => exitBossGame(), 600);
  } else if (!spendTokens(profileId, PB_CONFIG.cost)) {
    toast(`再賺 ${PB_CONFIG.cost} 個代幣就可以玩囉！`, 2000, "sun");
    setTimeout(() => exitBossGame(), 600);
  }
}

// ---------------- 巨大南瓜怪 Boss ----------------
const bossEl = document.createElement("div");
bossEl.className = "gstage-boss-pumpkin";
bossEl.innerHTML = GameArt.prop("giantPumpkin", { state: "idle" });
stage.world.appendChild(bossEl);

let bossWorldX = 1.35; // 初始站在中間
let bossY = 0;
let bossDir: 1 | -1 = 1;
let bossPhase: "squat" | "jump" | "slam" | "shatter" = "squat";
let bossPhaseStart = performance.now();
const BOSS_SCALE = 2.925;
const PUMPKIN_BODY_BOTTOM_Y = 254;

// ---- 蹲下蓄力 → 2 倍高度跳高功能 ----
const CHARGE_MULT = 2;
const CHARGE_GLOW_MS = 350;
const CHARGE_MS = 1000;
const CHARGE_GRACE_MS = 300;
let crouchSince = 0;
let charged = false;
let glowing = false;
let chargeExpireAt = 0;

function setGlow(on: boolean): void {
  glowing = on;
  stage?.setCharge(on, on && charged);
}

function setCharged(on: boolean): void {
  if (charged === on) {
    if (!on && glowing) setGlow(false);
    return;
  }
  charged = on;
  if (on) {
    setGlow(true);
    blip("coin");
    try {
      navigator.vibrate?.(30);
    } catch {}
  } else setGlow(false);
}

function consumeCharge(): boolean {
  const was = charged;
  setCharged(false);
  crouchSince = 0;
  chargeExpireAt = 0;
  return was;
}

stage.jumpMultiplier = () => {
  if (!consumeCharge()) return 1;
  return CHARGE_MULT;
};

function updateCharge(now: number): void {
  if (!stage || !pad) return;
  const onGround = !stage.isAirborne && !stage.isTripping;
  if (pad.down.down && onGround) {
    if (!crouchSince) crouchSince = now;
    chargeExpireAt = 0;
    const held = now - crouchSince;
    if (!charged && held >= CHARGE_MS) setCharged(true);
    else if (!glowing && held >= CHARGE_GLOW_MS) setGlow(true);
  } else {
    crouchSince = 0;
    if (charged || glowing) {
      if (!chargeExpireAt) chargeExpireAt = now + CHARGE_GRACE_MS;
      if (now > chargeExpireAt || !onGround) {
        chargeExpireAt = 0;
        setCharged(false);
      }
    }
  }
}

// ---------------- 開場玩法說明彈窗 ----------------
function showIntroModal(): void {
  pad?.setEnabled(false);
  const modal = document.createElement("div");
  modal.className = "pumpkin-modal-overlay";
  modal.id = "pumpkin-intro-modal";
  modal.innerHTML = `
    <div class="pumpkin-modal-card pumpkin-intro-card" role="dialog" aria-modal="true">
      <div class="pumpkin-modal-badge">${GameArt.prop("giantPumpkin", { state: "idle" })}</div>
      <div class="pumpkin-modal-body">
        <h2 class="pumpkin-modal-title">🎃 萬聖調皮大南瓜來襲！</h2>
        <p class="pumpkin-modal-desc">
          夜光墓園中出現了一顆巨大又調皮的南瓜怪！快使用聖光點亮石燈籠，驅散大南瓜吧！
        </p>
        <div class="pumpkin-intro-rules">
          <div class="pumpkin-intro-row">
            <span class="pumpkin-intro-icon">❤️</span>
            <span><strong>避開踩踏</strong>：被撞損失生命向後彈開</span>
          </div>
          <div class="pumpkin-intro-row">
            <span class="pumpkin-intro-icon">🏮</span>
            <span><strong>C 鍵點燈</strong>：靠近石燈籠點亮 5 座獲勝</span>
          </div>
          <div class="pumpkin-intro-row">
            <span class="pumpkin-intro-icon">⬇️</span>
            <span><strong>蓄力跳</strong>：按住 ↓ 蓄力，再按 A 跳 2 倍高</span>
          </div>
          <div class="pumpkin-intro-row">
            <span class="pumpkin-intro-icon">🦘</span>
            <span><strong>空中避震</strong>：南瓜怪落地時跳在空中免疫震動</span>
          </div>
        </div>
        <div class="pumpkin-modal-actions">
          <button type="button" class="gbtn g-h-sun gbtn-lg" id="btn-start-game">開始挑戰！</button>
        </div>
      </div>
    </div>
  `;
  const host = screen?.canvas ?? appEl;
  host?.appendChild(modal);

  modal.querySelector("#btn-start-game")?.addEventListener("click", () => {
    modal.classList.add("modal-fade-out");
    setTimeout(() => modal.remove(), 250);
    pad?.setEnabled(true);
    isGameStarted = true;
    gameStartTime = performance.now();
    bossPhaseStart = performance.now();
    blip("sparkle");
  });
}

function updateHeartsHud(): void {
  for (let i = 1; i <= 3; i++) {
    const el = heartsBar.querySelector(`[data-heart="${i}"]`);
    if (el) el.classList.toggle("lost", i > hearts);
  }
}

function updateLanternsHud(): void {
  let idx = 1;
  for (const p of lanternProps) {
    const el = strip.querySelector(`[data-lantern="${idx}"]`);
    if (el) {
      const isLit = litLanterns.has(p);
      el.classList.toggle("lit", isLit);
      el.classList.toggle("off", !isLit);
      el.innerHTML = GameArt.prop("stoneLantern", { state: isLit ? "lit" : "off" });
    }
    idx++;
  }
}

function floatText(txt: string, xRel: number, yRel: number, hueColor: string): void {
  if (!stage) return;
  const d = document.createElement("div");
  d.className = `g-float g-float--${hueColor}`;
  d.textContent = txt;
  d.style.left = `${(xRel * 100).toFixed(1)}%`;
  d.style.top = `${(yRel * 100).toFixed(1)}%`;
  stage.hud.appendChild(d);
  setTimeout(() => d.remove(), 1200);
}

// ---------------- 手持物動態效果 ----------------
function triggerMagicCaneEffects(cx: number, cy: number): void {
  if (prefersReducedMotion() || !stage) return;
  const container = document.createElement("div");
  container.className = "studio-fx-container";

  const ring1 = document.createElement("div");
  ring1.className = "magic-ring";
  ring1.style.left = `${cx}px`;
  ring1.style.top = `${cy - 16}px`;
  ring1.style.width = "64px";
  ring1.style.height = "64px";
  container.appendChild(ring1);

  const ring2 = document.createElement("div");
  ring2.className = "magic-ring";
  ring2.style.left = `${cx}px`;
  ring2.style.top = `${cy - 16}px`;
  ring2.style.width = "96px";
  ring2.style.height = "96px";
  ring2.style.borderColor = "var(--g-lilac)";
  ring2.style.animationDelay = "0.15s";
  container.appendChild(ring2);

  const colors = ["var(--g-sun)", "var(--g-lilac)", "var(--g-rose)", "var(--g-sky)", "var(--g-mint)"];
  const shardCount = 22;
  for (let i = 0; i < shardCount; i++) {
    const shard = document.createElement("div");
    shard.className = "magic-shard";
    const color = colors[i % colors.length];
    const isStar = i % 2 === 0;
    shard.innerHTML = isStar
      ? `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" fill="${color}"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 0 L16 8 L8 16 L0 8 Z" fill="${color}"/></svg>`;

    const angle = (i / shardCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
    const dist = 90 + Math.random() * 135;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist);
    const trot = `${Math.round((Math.random() - 0.5) * 360)}deg`;

    shard.style.left = `${cx - 10}px`;
    shard.style.top = `${cy - 10}px`;
    shard.style.setProperty("--tx", `${tx}px`);
    shard.style.setProperty("--ty", `${ty}px`);
    shard.style.setProperty("--trot", trot);
    shard.style.animationDelay = `${(Math.random() * 0.16).toFixed(2)}s`;
    shard.style.animationDuration = `${(1.1 + Math.random() * 0.35).toFixed(2)}s`;
    container.appendChild(shard);
  }

  const meteorCount = 8;
  const meteorColors = [
    "var(--g-sun)",
    "var(--g-lilac)",
    "var(--g-sky)",
    "var(--g-mint)",
    "var(--g-rose)",
    "var(--g-peach)",
    "var(--g-sun)",
    "var(--g-lilac)",
  ];
  for (let i = 0; i < meteorCount; i++) {
    const angle = (i / meteorCount) * 2 * Math.PI;
    const dist = 180 + Math.random() * 95;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist);
    const rotDeg = Math.round((angle * 180) / Math.PI);
    const mColor = meteorColors[i % meteorColors.length];

    const meteor = document.createElement("div");
    meteor.className = "magic-meteor";
    meteor.style.left = `${cx - 30}px`;
    meteor.style.top = `${cy - 10}px`;
    meteor.style.setProperty("--tx", `${tx}px`);
    meteor.style.setProperty("--ty", `${ty}px`);
    meteor.style.setProperty("--rot", `${rotDeg}deg`);
    meteor.style.animationDelay = `${(i * 0.035).toFixed(2)}s`;

    meteor.innerHTML = `
      <svg width="60" height="20" viewBox="0 0 60 20" overflow="visible">
        <path d="M 0 10 Q 25 10 46 10" stroke="${mColor}" stroke-width="4.5" stroke-linecap="round" opacity="0.85" />
        <path d="M 12 10 Q 30 10 46 10" stroke="var(--g-surface-raised)" stroke-width="2.2" stroke-linecap="round" opacity="0.9" />
        <circle cx="46" cy="10" r="6" fill="${mColor}" opacity="0.4" />
        <circle cx="46" cy="10" r="3.5" fill="var(--g-sun-soft)" />
        <path d="M 46 3 Q 46 10 53 10 Q 46 10 46 17 Q 46 10 39 10 Q 46 10 46 3 Z" fill="${mColor}" />
      </svg>
    `;
    container.appendChild(meteor);
  }

  stage.hud.appendChild(container);
  setTimeout(() => container.remove(), 1900);
}

function triggerPumpkinBucketEffects(cx: number): void {
  if (prefersReducedMotion() || !stage) return;
  const container = document.createElement("div");
  container.className = "studio-fx-container";

  const candyColors = [
    "var(--g-peach)",
    "var(--g-sun)",
    "var(--g-leaf)",
    "var(--g-rose)",
    "var(--g-sky)",
    "var(--g-lilac)",
  ];
  const candyCount = 26;
  const H = stage.height;
  const groundY = 0.88 * H;

  for (let i = 0; i < candyCount; i++) {
    const drop = document.createElement("div");
    drop.className = "candy-drop";
    const c1 = candyColors[i % candyColors.length];
    const c2 = candyColors[(i + 2) % candyColors.length];
    const kind = i % 3;

    if (kind === 0) {
      drop.innerHTML = `<svg width="26" height="18" viewBox="0 0 24 16"><path d="M7 3 Q12 0 17 3 L17 13 Q12 16 7 13 Z" fill="${c1}"/><polygon points="7,8 2,2 2,14" fill="${c2}"/><polygon points="17,8 22,2 22,14" fill="${c2}"/><circle cx="12" cy="8" r="2.2" fill="var(--g-surface-raised)" opacity="0.85"/></svg>`;
    } else if (kind === 1) {
      drop.innerHTML = `<svg width="22" height="22" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="${c1}"/><path d="M10 2 Q14 10 10 18 Q6 10 10 2 Z" fill="${c2}"/><circle cx="10" cy="10" r="2.5" fill="var(--g-surface-raised)" opacity="0.9"/></svg>`;
    } else {
      drop.innerHTML = `<svg width="24" height="20" viewBox="0 0 22 18"><ellipse cx="11" cy="9" rx="8" ry="6" fill="${c1}"/><polygon points="3,9 0,4 0,14" fill="${c2}"/><polygon points="19,9 22,4 22,14" fill="${c2}"/><line x1="8" y1="5" x2="8" y2="13" stroke="var(--g-surface-raised)" stroke-width="1.8" opacity="0.75"/><line x1="14" y1="5" x2="14" y2="13" stroke="var(--g-surface-raised)" stroke-width="1.8" opacity="0.75"/></svg>`;
    }

    const startX = cx + (Math.random() - 0.5) * (stage.width * 0.42);
    const startY = -40 - Math.random() * 80;
    const targetY = groundY - 6 - Math.random() * 12;
    const tx = Math.round((Math.random() - 0.5) * 60);
    const ty = Math.round(targetY - startY);
    const trot = `${Math.round((Math.random() - 0.5) * 360)}deg`;

    drop.style.left = `${startX}px`;
    drop.style.top = `${startY}px`;
    drop.style.setProperty("--tx", `${tx}px`);
    drop.style.setProperty("--ty", `${ty}px`);
    drop.style.setProperty("--trot", trot);
    drop.style.animationDelay = `${(i * 0.05).toFixed(2)}s`;
    drop.style.animationDuration = `${(1.4 + Math.random() * 0.35).toFixed(2)}s`;
    container.appendChild(drop);
  }

  stage.hud.appendChild(container);
  setTimeout(() => container.remove(), 2400);
}

// ---------------- C 鍵法術釋放與石燈籠點燈 ----------------
pad.on((k, down) => {
  if (!down || isGameOver || isVictory) return;
  if (k === "c") {
    handleCastHolyLight();
  }
});

function handleCastHolyLight(): void {
  if (!stage) return;
  const currentHeld = ((stage.currentLook as Look)?.held) ?? activeLook.held;
  const isCane = currentHeld === "magiccane";
  const isBucket = currentHeld === "pumpkinbucket";

  if (!isCane && !isBucket) {
    floatText("需要魔拐杖或南瓜糖果桶才能點燈喔！", 0.5, 0.42, "stone");
    blip("trip");
    return;
  }

  stage.perform("wave");
  setTimeout(() => stage?.perform(null), 1000);

  const charRect = stage.charEl.getBoundingClientRect();
  const hudRect = stage.hud.getBoundingClientRect();
  const cx = charRect.left - hudRect.left + charRect.width / 2;
  const cy = charRect.top - hudRect.top + charRect.height / 2;

  if (isCane) {
    blip("pop");
    triggerMagicCaneEffects(cx, cy);
  } else if (isBucket) {
    blip("coin");
    triggerPumpkinBucketEffects(cx);
  }

  let targetLantern: StageProp | null = null;
  for (const lp of lanternProps) {
    if (!litLanterns.has(lp) && stage.distanceTo(lp) < 0.12) {
      targetLantern = lp;
      break;
    }
  }

  if (targetLantern) {
    litLanterns.add(targetLantern);
    stage.setPropState(targetLantern, "lit");
    updateLanternsHud();
    playLanternHolySound();
    floatText(`✨ 辟邪聖火已點亮！ (${litLanterns.size}/5)`, 0.5, 0.35, "sun");

    const lanternX = stage.propScreenX(targetLantern);
    const fx = document.createElement("div");
    fx.className = "holy-light-beam";
    fx.style.left = `${(lanternX - 14).toFixed(1)}px`;
    stage.world.appendChild(fx);
    setTimeout(() => fx.remove(), 1400);

    if (litLanterns.size >= 5) {
      triggerVictory();
    }
  } else {
    blip("sparkle");
    floatText(isCane ? "✨ 揮動魔拐杖釋放聖光！" : "🍬 撒出繽紛聖光糖果雨！", 0.5, 0.45, "mint");
  }
}

// ---------------- 南瓜怪碎裂許多小碎片動態粒子 ----------------
function spawnBossShatterShards(cx: number, cy: number): void {
  if (!stage) return;
  const container = document.createElement("div");
  container.className = "boss-shatter-container";

  const shardCount = 60;
  const colors = [
    "var(--g-peach-deep)",
    "var(--g-peach-ledge)",
    "var(--g-peach)",
    "var(--g-sun)",
    "var(--g-sun-soft)",
    "var(--g-mint-deep)",
    "var(--g-rose)",
  ];

  for (let i = 0; i < shardCount; i++) {
    const shard = document.createElement("div");
    shard.className = "pumpkin-shatter-piece";
    const color = colors[i % colors.length];
    const kind = i % 4;
    const size = 14 + Math.random() * 20;

    if (kind === 0) {
      shard.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M4 6 Q14 2 20 8 Q22 18 12 20 Q2 16 4 6 Z" fill="${color}"/></svg>`;
    } else if (kind === 1) {
      shard.innerHTML = `<svg width="${size * 0.85}" height="${size * 0.85}" viewBox="0 0 20 20"><polygon points="10,0 20,10 10,20 0,10" fill="${color}"/></svg>`;
    } else if (kind === 2) {
      shard.innerHTML = `<svg width="${size * 0.75}" height="${size * 0.75}" viewBox="0 0 16 16"><ellipse cx="8" cy="8" rx="6" ry="3.5" fill="${color}" transform="rotate(30 8 8)"/></svg>`;
    } else {
      shard.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 20 20"><path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" fill="${color}"/></svg>`;
    }

    const angle = (i / shardCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
    const dist = 180 + Math.random() * 320;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist + 45);
    const rot = Math.round((Math.random() - 0.5) * 720);

    shard.style.left = `${cx - size / 2}px`;
    shard.style.top = `${cy - size / 2}px`;
    shard.style.setProperty("--tx", `${tx}px`);
    shard.style.setProperty("--ty", `${ty}px`);
    shard.style.setProperty("--rot", `${rot}deg`);
    shard.style.animationDuration = `${(1.2 + Math.random() * 0.4).toFixed(2)}s`;

    container.appendChild(shard);
  }

  stage.hud.appendChild(container);
  setTimeout(() => container.remove(), 1800);
}

// ---------------- 寶箱自天空緩緩降落 ----------------
function spawnVictoryChestDescend(): void {
  if (!stage) return;
  const H = stage.height;
  const W = stage.width;
  const chestX = Number(((stage.offset + W * 0.16) / W).toFixed(3));
  victoryChestProp = {
    id: "victoryChest",
    x: chestX,
    state: "closed",
    scale: 1.4,
  };
  stage.setProps([...lanternProps, victoryChestProp]);

  if (!victoryChestProp.el) return;
  const chestEl = victoryChestProp.el;
  const chestSvg = chestEl.querySelector("svg");

  const targetTop = 0.88 * H - (52 * (victoryChestProp.scale ?? 1.4) * stage.unit);
  let currentChestY = -80;
  isChestLanding = true;

  chestEl.style.top = `${currentChestY}px`;
  if (chestSvg) {
    chestSvg.classList.add("chest-sky-descending");
  }

  const beam = document.createElement("div");
  beam.className = "chest-sky-beam";
  beam.style.left = `${stage.propScreenX(victoryChestProp).toFixed(1)}px`;
  stage.hud.appendChild(beam);

  blip("sparkle");
  floatText("✨ 萬聖勝利寶箱自天空緩緩降落...", 0.5, 0.28, "sun");

  const descentSpeed = 2.4;
  function stepDescend() {
    if (!victoryChestProp || !victoryChestProp.el || !isChestLanding || !stage) {
      beam.remove();
      return;
    }
    currentChestY += descentSpeed;
    beam.style.left = `${stage.propScreenX(victoryChestProp).toFixed(1)}px`;

    if (currentChestY >= targetTop) {
      currentChestY = targetTop;
      isChestLanding = false;
      chestEl.style.top = `${targetTop.toFixed(1)}px`;
      if (chestSvg) {
        chestSvg.classList.remove("chest-sky-descending");
        chestSvg.classList.add("chest-landing-bounce");
      }
      beam.remove();

      blip("coin");
      floatText("🎁 寶箱已著地！快去開啟吧！", 0.5, 0.42, "sun");
      return;
    }

    chestEl.style.top = `${currentChestY.toFixed(1)}px`;
    requestAnimationFrame(stepDescend);
  }

  requestAnimationFrame(stepDescend);
}

// ---------------- 挑戰勝利演出 ----------------
function triggerVictory(): void {
  if (isVictory) return;
  isVictory = true;

  bossPhase = "shatter";
  bossY = 0;
  blip("sparkle");
  const bossSvg = bossEl.querySelector("svg");
  if (!prefersReducedMotion() && bossSvg) {
    bossSvg.classList.remove("boss-shudder", "boss-rapid-shudder", "boss-swell-expand");
    bossSvg.classList.add("boss-rapid-shudder");
  }
  floatText("✨ 辟邪聖火共鳴中...", 0.5, 0.32, "sun");

  setTimeout(() => {
    if (!prefersReducedMotion() && bossSvg) {
      bossSvg.classList.remove("boss-rapid-shudder");
      bossSvg.classList.add("boss-swell-expand");
    }
    blip("jump");
    floatText("⚡ 聖光灌注！大南瓜承受不住要爆開了！", 0.5, 0.32, "mint");

    setTimeout(() => {
      bossEl.style.display = "none";
      blip("pop");
      blip("coin");
      floatText("💥 砰！調皮大南瓜化作漫天碎片！", 0.5, 0.35, "sun");

      if (stage) {
        const W = stage.width;
        let bossRelX = (bossWorldX * W - stage.offset) % (stage.propPeriod * W);
        if (bossRelX < -W) bossRelX += stage.propPeriod * W;
        spawnBossShatterShards(bossRelX, stage.height * 0.88 - (PUMPKIN_BODY_BOTTOM_Y * BOSS_SCALE * 0.45));
      }

      const currentRecord = loadPumpkinBossRecord(profileId);
      if (currentRecord.hasTalisman) {
        const repeatTokens = PB_CONFIG.repeatRewardTokens ?? 30;
        earnTokens(profileId, repeatTokens);
        blip("coin");
        floatText(`🎉 再次擊退南瓜怪！獲得 +${repeatTokens} 遊戲幣！`, 0.5, 0.4, "sun");

        const durationSec = Math.max(1, Math.round((performance.now() - gameStartTime) / 1000));
        savePumpkinBossRecord(profileId, {
          victories: currentRecord.victories + 1,
          totalGames: currentRecord.totalGames + 1,
          bestTimeSec: currentRecord.bestTimeSec === 0 ? durationSec : Math.min(currentRecord.bestTimeSec, durationSec),
          hasTalisman: true,
          updatedAt: Date.now(),
        });
        setTimeout(() => {
          pad?.setEnabled(false);
          const modal = document.createElement("div");
          modal.className = "pumpkin-modal-overlay";
          modal.innerHTML = `
            <div class="pumpkin-modal-card" role="dialog" aria-modal="true">
              <div class="pumpkin-modal-badge">${GameArt.prop("zombieTalisman")}</div>
              <div class="pumpkin-modal-body">
                <h2 class="pumpkin-modal-title">🎉 再次擊退調皮大南瓜！</h2>
                <p class="pumpkin-modal-desc">你成功點亮了 5 座辟邪石燈籠，擊碎了大南瓜！已取得過神奇的【變身符咒】囉！</p>
                <div class="pumpkin-repeat-reward">
                  <span class="pumpkin-reward-coin">${COIN_ICON(24)}</span>
                  <span>獲得再次挑戰獎勵 <strong>+${repeatTokens} 遊戲幣</strong>！</span>
                </div>
                <div class="pumpkin-modal-actions">
                  <button type="button" class="gbtn g-h-sun gbtn-lg" id="btn-return-graveyard">返回夜光墓園</button>
                </div>
              </div>
            </div>
          `;
          const host = screen?.canvas ?? appEl;
          host?.appendChild(modal);
          modal.querySelector("#btn-return-graveyard")?.addEventListener("click", () => {
            exitBossGame();
          });
        }, 850);
      } else {
        setTimeout(() => {
          spawnVictoryChestDescend();
        }, 700);
      }
    }, 750);
  }, 700);
}

// ---------------- 開啟勝利寶箱並獲得變身符咒 ----------------
function handleOpenVictoryChest(): void {
  if (!victoryChestProp || victoryChestProp.state === "open" || isChestLanding || !stage) return;
  stage.setPropState(victoryChestProp, "open");
  blip("coin");
  blip("sparkle");

  const durationSec = Math.max(1, Math.round((performance.now() - gameStartTime) / 1000));
  const record = loadPumpkinBossRecord(profileId);
  savePumpkinBossRecord(profileId, {
    victories: record.victories + 1,
    totalGames: record.totalGames + 1,
    bestTimeSec: record.bestTimeSec === 0 ? durationSec : Math.min(record.bestTimeSec, durationSec),
    hasTalisman: true,
    updatedAt: Date.now(),
  });

  setTimeout(() => {
    pad?.setEnabled(false);
    const modal = document.createElement("div");
    modal.className = "pumpkin-modal-overlay";
    modal.innerHTML = `
      <div class="pumpkin-modal-card" role="dialog" aria-modal="true">
        <div class="pumpkin-modal-badge">${GameArt.prop("zombieTalisman")}</div>
        <div class="pumpkin-modal-body">
          <h2 class="pumpkin-modal-title">🎉 萬聖節大獲全勝！</h2>
          <p class="pumpkin-modal-desc">你成功點亮了 5 座辟邪石燈籠，驅散了大南瓜！墓園怪物們非常感謝你，送給你神奇的【變身符咒】！</p>
          <div class="pumpkin-modal-actions">
            <button type="button" class="gbtn g-h-sun gbtn-lg" id="btn-equip-talisman">領取符咒</button>
          </div>
        </div>
      </div>
    `;
    const host = screen?.canvas ?? appEl;
    host?.appendChild(modal);

    modal.querySelector("#btn-equip-talisman")?.addEventListener("click", () => {
      const char = loadCharacter(profileId);
      if (char) {
        const slot = char.slots[char.activeSlot];
        if (slot) {
          const accs = new Set(slot.look.accessories || []);
          accs.add("zombieTalisman");
          slot.look.accessories = Array.from(accs);
          saveCharacter(profileId, char);
          try {
            sessionStorage.setItem("justEquippedTalisman", "1");
          } catch {
            // ignore
          }
        }
      }
      exitBossGame();
    });
  }, 900);
}

// ---------------- 闖關失敗彈窗 ----------------
function triggerGameOver(): void {
  if (isGameOver) return;
  isGameOver = true;
  blip("trip");
  pad?.setEnabled(false);

  const modal = document.createElement("div");
  modal.className = "pumpkin-modal-overlay";
  modal.innerHTML = `
    <div class="pumpkin-modal-card" role="dialog" aria-modal="true">
      <div class="pumpkin-modal-badge">${GameArt.prop("giantPumpkin", { state: "idle" })}</div>
      <div class="pumpkin-modal-body">
        <h2 class="pumpkin-modal-title">闖關失敗！</h2>
        <p class="pumpkin-modal-desc">差一點點就點亮所有石燈籠了！是否花費 ${PB_CONFIG.cost} 遊戲幣再次挑戰？（保留已點亮燈籠）</p>
        <div class="pumpkin-modal-actions">
          <button type="button" class="gbtn g-h-stone gbtn-md" id="btn-giveup">退出關卡</button>
          <button type="button" class="gbtn g-h-sun gbtn-md" id="btn-retry">再次挑戰 (${PB_CONFIG.cost} 幣)</button>
        </div>
      </div>
    </div>
  `;
  const host = screen?.canvas ?? appEl;
  host?.appendChild(modal);

  modal.querySelector("#btn-giveup")?.addEventListener("click", () => {
    exitBossGame();
  });
  modal.querySelector("#btn-retry")?.addEventListener("click", () => {
    if (!isLab) {
      if (!spendTokens(profileId, PB_CONFIG.cost)) {
        toast(`再賺 ${PB_CONFIG.cost} 個代幣就可以挑戰囉！去學習吧！`, 2000, "sun");
        return;
      }
    }
    modal.remove();
    pad?.setEnabled(true);
    isGameOver = false;
    hearts = PB_CONFIG.maxHearts;
    updateHeartsHud();
    invulnerableUntil = performance.now() + 1500;
    bossWorldX = 1.35;
    bossY = 0;
    bossPhase = "squat";
    bossPhaseStart = performance.now();
    bossEl.innerHTML = GameArt.prop("giantPumpkin", { state: "idle" });
    bossEl.style.display = "";
    blip("coin");
    floatText("✨ 再次挑戰！已點亮的石燈籠維持發光！", 0.5, 0.42, "sun");
  });
}

// ---------------- 每幀主迴圈 (Boss 運動軌跡與碰撞檢測) ----------------
stage.onTick = () => {
  if (!stage) return;
  const now = performance.now();
  updateCharge(now);

  if (!isGameStarted) return;

  const W = stage.width;
  const H = stage.height;
  const charScreenX = W * stage.charX;

  if (isVictory && victoryChestProp && victoryChestProp.state === "closed" && !isChestLanding) {
    if (stage.distanceTo(victoryChestProp) < 0.08) {
      handleOpenVictoryChest();
    }
  }

  if (isGameOver || isVictory || bossPhase === "shatter") return;

  let bossRelX = (bossWorldX * W - stage.offset) % (stage.propPeriod * W);
  if (bossRelX < -W) bossRelX += stage.propPeriod * W;
  const bossScreenX = bossRelX;
  const bossBottomY = H * 0.88 - bossY;

  const elapsed = now - bossPhaseStart;
  const distToPlayer = Math.abs(charScreenX - bossScreenX);

  if (bossPhase === "squat") {
    bossY = 0;
    const squatMs = distToPlayer > W * 0.42 ? 520 : 800;
    if (elapsed > squatMs) {
      bossPhase = "jump";
      bossPhaseStart = now;
      bossEl.innerHTML = GameArt.prop("giantPumpkin", { state: "jump" });
      blip("jump");
      bossDir = charScreenX >= bossScreenX ? 1 : -1;
    }
  } else if (bossPhase === "jump") {
    const t = Math.min(1, elapsed / 1200);
    const peakH = Math.max(H * 0.5, H * 0.88 - (PUMPKIN_BODY_BOTTOM_Y * BOSS_SCALE * 0.2));
    bossY = Math.sin(t * Math.PI) * peakH;

    const chaseMult = Math.min(2.5, Math.max(1.0, distToPlayer / (W * 0.3)));
    const baseJumpDistWorld = (160 * BOSS_SCALE) / W;
    const jumpDistWorld = baseJumpDistWorld * chaseMult;
    bossWorldX += (jumpDistWorld * (1 / 60)) * bossDir * 1.8;

    if (elapsed > 1200) {
      bossPhase = "slam";
      bossPhaseStart = now;
      bossY = 0;
      bossEl.innerHTML = GameArt.prop("giantPumpkin", { state: "slam" });
      blip("trip");

      if (!prefersReducedMotion()) {
        stage.el.classList.remove("screen-shake");
        void stage.el.offsetWidth;
        stage.el.classList.add("screen-shake");
      }

      const isPlayerInAir = stage.isAirborne || stage.jumpHeight > 4;
      if (!isPlayerInAir) {
        stage.bounce(0.52);
        stage.stun(500, "surprise");
      }

      if (!prefersReducedMotion()) {
        for (const lp of lanternProps) {
          const svg = lp.el?.querySelector<HTMLElement>("svg");
          if (svg) {
            svg.classList.remove("lantern-earthquake-bounce");
            void svg.getBoundingClientRect();
            svg.classList.add("lantern-earthquake-bounce");
            setTimeout(() => svg.classList.remove("lantern-earthquake-bounce"), 500);
          }
        }
      }
    }
  } else if (bossPhase === "slam") {
    bossY = 0;
    if (elapsed > 600) {
      bossPhase = "squat";
      bossPhaseStart = now;
      bossEl.innerHTML = GameArt.prop("giantPumpkin", { state: "squat" });
    }
  }

  const scaleX = bossPhase === "squat" ? BOSS_SCALE * 1.15 : BOSS_SCALE;
  const scaleY = bossPhase === "squat" ? BOSS_SCALE * 0.68 : BOSS_SCALE;

  bossEl.style.transform = `translate(${(bossScreenX - 160).toFixed(1)}px, ${(bossBottomY - PUMPKIN_BODY_BOTTOM_Y).toFixed(1)}px) scale(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)})`;

  if (bossY < 80) {
    const bossHalfW = 125 * 1.5;
    const bossLeft = bossScreenX - bossHalfW;
    const bossRight = bossScreenX + bossHalfW;

    const charHalfW = 24;
    const charLeft = charScreenX - charHalfW;
    const charRight = charScreenX + charHalfW;

    const isOverlap = charRight > bossLeft && charLeft < bossRight;

    if (isOverlap) {
      if (now > knockbackCooldownUntil) {
        knockbackCooldownUntil = now + 500;
        const charWidthPx = 75 * stage.unit;
        const knockbackDist = charWidthPx * 4;
        const knockbackDir = charScreenX < bossScreenX ? -1 : 1;

        stage.stun(500, "surprise");

        let kbLeft = knockbackDist;
        const kbStep = () => {
          if (kbLeft <= 0 || !stage) return;
          const s = Math.min(kbLeft, knockbackDist / 6);
          stage.offset += s * knockbackDir;
          kbLeft -= s;
          if (kbLeft > 0) requestAnimationFrame(kbStep);
        };
        kbStep();
      }

      if (charScreenX < bossScreenX) {
        const diff = charRight - bossLeft;
        stage.offset -= diff + 2;
      } else {
        const diff = bossRight - charLeft;
        stage.offset += diff + 2;
      }

      if (now > invulnerableUntil) {
        hearts = Math.max(0, hearts - 1);
        invulnerableUntil = now + PB_CONFIG.invulnerableMs;
        updateHeartsHud();
        blip("trip");
        floatText("💥 哎呀！被大南瓜撞飛了！", 0.5, 0.42, "rose");

        stage.charEl?.classList.add("invulnerable");
        setTimeout(() => {
          stage?.charEl?.classList.remove("invulnerable");
        }, PB_CONFIG.invulnerableMs);

        if (hearts <= 0) {
          triggerGameOver();
        }
      }
    }
  }
};

showIntroModal();
