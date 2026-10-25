// 我的角色 — 賽跑（與森林動物賽跑）。依原專案 docs/handoff-prompt-letsgo-race.md。
// 全螢幕整頁（同視窗導航，見 game/fullscreenPage.ts）；舞台沿用 game/stageController.ts（自動前進、碰撞、蓄力光暈），
// 數值、賽道、對手、裁判全部讀 GameTokens.race（內容端維護），這裡只組流程、HUD、對手 AI、存檔與扣款。
// 規則：花 GameTokens.race.cost 代幣開始，贏了不發代幣（玩遊戲不賺代幣）；獎勵走徽章、星等、稱號。

import "../game/gamePage.css";
import "./race.css";
import { GameArt, GameTokens, icon, prefersReducedMotion, type Look, type PoseController } from "../game/gameKit";
import { VirtualPad } from "../game/virtualPad";
import { StageController, type StageCollider, type StageProp } from "../game/stageController";
import { getActiveLook, loadCharacter } from "../game/characterStore";
import { loadRace, saveRace, stageRecord, isUnlocked, starsFor, recordResult, topTitle, type RaceProfileData } from "../game/raceStore";
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
import { addPhoto, downloadBlob, photoFileName, photosSupported } from "../game/photoStore";
import { getTokenBalance, spendTokens } from "../gameTokens";
import { getAllBadges } from "../content";
import { evaluateRuleBadge, type RuleBadgeContext } from "../badgeRules";
import { speakEnglish } from "../speech";

// ---------------- token 資料 ----------------
interface RaceItem {
  id: string;
  x: number;
  elev?: number;
  w?: number;
  stack?: number;
  top?: string[];
}
interface RaceStage {
  id: number;
  opponent: string;
  label: string;
  u: number;
  targetTime: number;
  items: RaceItem[];
}
interface Slow {
  mult: number;
  sec?: number;
}
interface RaceTokens {
  cost: number;
  track: { length: number; startSafe: number; finishSafe: number; mileFlagEvery: number; warnLead: number; warnStages: number[] };
  player: { speed: number; jump: { height: number; airMs: number }; chargeJump?: { holdMs: number; mult: number } };
  effects: Record<string, { label: string; mult?: number; sec?: number; skip?: number; slow?: Slow; store?: number }>;
  animals: Record<string, { label: string; tier: string; runPeriod: number; hello: string; bye: string }>;
  referee: { label: string; look: Partial<Look>; poses: Record<string, string>; lines: Record<string, string> };
  opponents: Record<
    string,
    {
      speed: number;
      sprint?: { everySec: number; sec: number; speed: number };
      nap?: { lead: number; sec: number; cooldownSec: number };
      stumble?: { x: number; sec: number }[];
    }
  >;
  stages: RaceStage[];
  rewards: { badges: string[]; titles: string[] };
}
const R = (GameTokens as unknown as { race: RaceTokens }).race;
const TRACK = R.track.length;

const profileId = requireActiveProfileId();
const app = document.querySelector<HTMLDivElement>("#race-app")!;
const debug = new URLSearchParams(location.search).has("debug");

// ---------------- 設定（每台設備各自記，不同步） ----------------
const SETTINGS = {
  sound: "englishForKids.settings.gameSound.v1",
};
function getSetting(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function setSetting(key: string, v: string): void {
  try {
    window.localStorage.setItem(key, v);
  } catch {
    // 無痕模式：忽略
  }
}
const soundOn = () => getSetting(SETTINGS.sound, "1") === "1";

// ---------------- 音效（WebAudio 合成；跟工作室同一個音效開關） ----------------
let audioCtx: AudioContext | null = null;
type Sfx = "jump" | "pickup" | "hit" | "boost" | "beep" | "go" | "win" | "lose" | "pop" | "spring" | "bump" | "charge";
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
      case "beep":
        tone(660, 660, 0, 0.14, 0.12);
        break;
      case "go":
        tone(990, 990, 0, 0.3, 0.14);
        break;
      case "spring":
        tone(300, 900, 0, 0.25, 0.12);
        break;
      case "pop":
        tone(520, 900, 0, 0.1, 0.12);
        break;
      case "charge":
        tone(700, 1100, 0, 0.12, 0.08);
        break;
      case "win":
        [523, 659, 784, 1046].forEach((f, i) => tone(f, f, i * 0.12, 0.2, 0.12));
        break;
      case "lose":
        [392, 349, 311].forEach((f, i) => tone(f, f * 0.98, i * 0.16, 0.24, 0.1, "triangle"));
        break;
    }
  } catch {
    // 不支援就安靜
  }
}
function say(text: string | undefined): void {
  if (!text || !soundOn()) return;
  try {
    speakEnglish(text.replace(/…/g, ""));
  } catch {
    // 沒有語音就算了
  }
}

// ---------------- 狀態 ----------------
let race: RaceProfileData = loadRace(profileId ?? "");
const look: Look = (profileId && getActiveLook(profileId)) || GameArt.presets["kid-blue"];
const charData = profileId ? loadCharacter(profileId) : null;
const charName = charData?.slots[charData.activeSlot]?.name ?? "小夥伴";

function animalName(kind: string): string {
  const l = R.animals[kind]?.label ?? kind;
  return l.replace(/「.*」/, "");
}

// ---------------- 版面 ----------------
app.innerHTML = `
  <div class="gpage race">
    <header class="race-top">
      <button type="button" class="g-iconbtn g-h-stone race-back" aria-label="返回">${icon("back")}</button>
      <div class="race-who">
        <span class="race-who-avatar">${GameArt.avatar(look, 48)}</span>
        <span class="race-who-text"><strong class="g-t-heading">${escapeHtml(charName)}</strong><span class="g-t-caption race-title-line"></span></span>
      </div>
      <span class="race-top-spacer"></span>
      <span class="race-coins g-chip">${icon("coin")}<span></span></span>
      <button type="button" class="g-iconbtn g-h-stone race-sound" aria-label="音效開關"></button>
    </header>
    <main class="race-menu"></main>
    <section class="race-play" hidden>
      <div class="race-stage-host"></div>
      <div class="race-controls">
      </div>
    </section>
  </div>`;

function $<T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = app): T {
  return root.querySelector<T>(sel)!;
}
function escapeHtml(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderTop(): void {
  $(".race-coins span").textContent = String(profileId ? getTokenBalance(profileId) : 0);
  const t = topTitle(race, R.rewards.titles);
  $(".race-title-line").textContent = t ? `稱號：${t}` : "";
  $(".race-sound").innerHTML = icon(soundOn() ? "sound" : "mute");
  $(".race-sound").setAttribute("aria-pressed", String(soundOn()));
}
$(".race-sound").addEventListener("click", () => {
  setSetting(SETTINGS.sound, soundOn() ? "0" : "1");
  renderTop();
});

// ---------------- 選單（選對手） ----------------
function refereeSvg(pose: string, size = 120): string {
  return GameArt.character({ ...(GameArt.presets["kid-blue"] as Look), ...(R.referee.look as Look), view: "front", pose }).replace(
    "<svg ",
    `<svg width="${(size * 120) / 170}" height="${size}" `
  );
}
function animalThumb(kind: string, pose = "idle"): string {
  return GameArt.animal(kind, { pose });
}
function starsHtml(n: number): string {
  return [1, 2, 3].map((i) => `<span class="race-star${i <= n ? " on" : ""}">${icon("star", "sm")}</span>`).join("");
}

function renderMenu(): void {
  renderTop();
  const menu = $(".race-menu");
  const cards = R.stages
    .map((st) => {
      const rec = stageRecord(race, st.id);
      const open = isUnlocked(race, st.id);
      const prev = R.stages.find((x) => x.id === st.id - 1);
      const a = R.animals[st.opponent];
      return `<button type="button" class="race-card${open ? "" : " race-card--locked"}" data-stage="${st.id}" data-locked="${!open}">
        <span class="race-card-art">${animalThumb(st.opponent, open ? "idle" : "sleep")}</span>
        <span class="race-card-body">
          <span class="g-t-label">第 ${st.id} 場・${escapeHtml(st.label)}</span>
          <strong class="g-t-heading">${escapeHtml(a?.label ?? st.opponent)}</strong>
          <span class="g-t-caption">對手：${escapeHtml(a?.tier ?? "")}</span>
          <span class="race-card-stars" aria-label="${rec.stars} 顆星">${starsHtml(rec.stars)}</span>
          <span class="g-t-caption">${rec.best !== null ? `最佳 ${rec.best.toFixed(1)} 秒` : open ? "還沒贏過" : ""}</span>
        </span>
        ${
          open
            ? `<span class="race-card-go g-t-button">${icon("coin", "sm")} ${R.cost} 開始</span>`
            : `<span class="race-card-lock g-t-caption">${icon("lock", "sm")} 贏過${escapeHtml(animalName(prev?.opponent ?? ""))}才能挑戰</span>`
        }
      </button>`;
    })
    .join("");
  menu.innerHTML = `
    <div class="race-guide">
      <span class="race-ref">${refereeSvg("idle", 110)}</span>
      <div class="g-bubble g-h-sun">我是${escapeHtml(R.referee.label)}！選一位對手來比賽吧！<br><span class="g-t-caption">每場 ${R.cost} 個代幣，贏了解鎖下一位</span></div>
    </div>
    <div class="race-cards">${cards}</div>
    <div class="race-menu-foot">
      <p class="g-t-caption">操作：自動往前跑。<b>A</b>（或 ↑、空白鍵）＝跳、<b>B</b>（或 Shift、C）＝使用道具（加速罐）。按住 <b>→</b> 跑快一點、連續點 <b>→</b> 衝刺、按 <b>←</b> 慢一點。</p>
    </div>`;
  menu.querySelectorAll<HTMLButtonElement>(".race-card").forEach((b) =>
    b.addEventListener("click", () => {
      const id = Number(b.dataset.stage);
      if (!isUnlocked(race, id)) {
        toast(`${icon("lock")} 先贏過前一位對手喔`, 1800, "sky");
        return;
      }
      void askStart(id);
    })
  );
}

async function askStart(id: number): Promise<void> {
  if (!profileId) return;
  const st = R.stages.find((s) => s.id === id)!;
  if (getTokenBalance(profileId) < R.cost) {
    // 不用「餘額不足」這種字眼：鼓勵去學習
    const go = await confirmDialog({
      iconId: "coin",
      text: `再多 ${R.cost - getTokenBalance(profileId)} 個代幣就能比賽囉！<br><span class="g-t-body">完成一輪練習就能賺代幣</span>`,
      yes: "去學習賺代幣",
      no: "等一下",
      hue: "sun",
    });
    if (go) void leaveTo("home");
    return;
  }
  const ok = await confirmDialog({
    iconId: "flag",
    text: `跟${escapeHtml(animalName(st.opponent))}比賽？<br><span class="g-t-body">${icon("coin", "sm")} 花 ${R.cost} 個代幣開始</span>`,
    yes: "開始",
    no: "取消",
    hue: "mint",
  });
  if (!ok) return;
  if (!spendTokens(profileId, R.cost)) {
    toast(`${icon("info")} 代幣不夠了，先去學習吧`, 2000, "sun");
    renderTop();
    return;
  }
  race.stats.played += 1;
  race.stats.coinsSpent += R.cost;
  saveRace(profileId, race);
  renderTop();
  startRace(st);
}

// ---------------- 比賽 ----------------
const stageHost = $(".race-stage-host");
const pad = new VirtualPad();
const stage = new StageController(stageHost, pad, { sceneId: "forest", look, view: "side", charH: 0.3 });
stageHost.appendChild(stage.el);
stage.setCharX(0.3);
stage.hazardMode = "event";
// ↓ 完全不作用（使用者要求移除蹲滑）：不蹲、不蓄力；需要蹲滑的樹枝／蜂窩也不擺（見 buildTrack）
stage.allowCrouch = false;
stage.jumpSpec = { heightUnits: R.player.jump.height, airMs: R.player.jump.airMs };
stage.freeze(true);
const START_X = 40; // 玩家起跑點（賽道單位；起跑門中心在 0）

// 舞台上的對手、裁判、護盾、HUD
const oppEl = document.createElement("div");
oppEl.className = "race-opp";
const refEls = [document.createElement("div"), document.createElement("div")];
refEls.forEach((e) => (e.className = "race-referee"));
const shieldEl = document.createElement("div");
shieldEl.className = "race-shield";
shieldEl.innerHTML = GameArt.prop("bubble");
shieldEl.hidden = true;
const speedLines = document.createElement("div");
speedLines.className = "race-speedlines";
// 對手、裁判要跟角色在同一層（§41 起角色包在 .gstage-world 裡，不是 stage.el 的直接子元素）
const worldEl = stage.charEl.parentElement ?? stage.el;
worldEl.insertBefore(oppEl, stage.charEl);
for (const e of refEls) worldEl.insertBefore(e, oppEl);
stage.el.append(shieldEl, speedLines);
stage.hud.innerHTML = `
  <div class="race-hud-top">
    <span class="race-timer g-chip">${icon("timer", "sm")}<span>0.0</span></span>
    <div class="race-progress" aria-hidden="true"><i class="race-progress-line"></i><span class="race-pin race-pin--opp"></span><span class="race-pin race-pin--me">${GameArt.avatar(look, 28)}</span><span class="race-progress-flag">${icon("flag", "sm")}</span></div>
    <button type="button" class="g-iconbtn g-h-stone race-pause" aria-label="暫停">${icon("pause")}</button>
  </div>
  <div class="race-effects"></div>
  <div class="race-edge" hidden></div>
  <div class="race-countdown" hidden></div>
  <div class="race-refline" hidden></div>`;
// 計時／進度條在手機橫式會被搬到舞台上方的細列（applyLandscape），先留住參照
const hudTimerSpan = $(".race-timer span", stage.hud);
const hudProgress = $(".race-progress", stage.hud);
const hudEdge = $(".race-edge", stage.hud);
const hudEffects = $(".race-effects", stage.hud);

interface Effect {
  kind: string;
  mult: number;
  until: number;
}
type Phase = "idle" | "countdown" | "running" | "finished";
interface RaceState {
  st: RaceStage;
  phase: Phase;
  time: number;
  opp: { kind: string; x: number; pose: string; napUntil: number; napCooldown: number; stumbleUntil: number; stumbled: Set<number>; finishTime: number | null };
  boosts: Effect[];
  slows: Effect[];
  shield: boolean;
  can: boolean;
  canUntil: number;
  hits: number;
  pickups: number;
  gapAtOppFinish: number | null;
  finishBroken: boolean;
}
let S: RaceState | null = null;
let paused = false;
let oppCtl: { setPose(p: string): void; stop(): void } | null = null;
let oppPose = "";
const refCtl: (PoseController | null)[] = [null, null];
let finishProp: StageProp | null = null;
let lastFeet = 0;

/** 玩家目前在賽道上的位置（中心，賽道單位） */
function playerX(): number {
  return START_X + stage.offset / stage.unit;
}

/** 需要蹲滑才能通過的障礙（蹲滑已移除，先不擺；已請內容端從賽道資料拿掉） */
const CROUCH_ONLY = new Set(["branch", "hive"]);
const MAX_STACK_NO_CHARGE = 2;

function buildTrack(st: RaceStage): StageProp[] {
  const props: StageProp[] = [];
  const k = stage.unit / stage.width; // 1 個賽道單位＝幾個舞台寬（舞台固定 16:9，換尺寸也不變）
  const sizeOf = (id: string) => (GameArt.props.find((d) => d.id === id)?.size as [number, number] | undefined) ?? [64, 64];
  const add = (id: string, left: number, o: Partial<StageProp> = {}) => {
    const w = o.wUnits ?? sizeOf(id)[0];
    props.push({ id, x: (left + w / 2 - START_X) * k, ...o } as StageProp);
  };
  add("startGate", -sizeOf("startGate")[0] / 2);
  for (let x = R.track.mileFlagEvery; x < TRACK; x += R.track.mileFlagEvery) add("mileFlag", x);
  const warn = R.track.warnStages.includes(st.id);
  for (const it of st.items) {
    if (CROUCH_ONLY.has(it.id)) continue; // 蹲滑已移除：不擺需要蹲滑的障礙
    if (warn && it.id === "rock") add("warnSign", it.x - R.track.warnLead);
    if (it.id === "stoneBlock" && it.stack) {
      // 疊方塊：每層 64 高、碰撞盒上緣 60，下一層的底放在 58（碰撞盒底部離道具底 2）
      // 沒有蓄力跳時，普通跳（130 單位）只上得了 2 層（118）；3 層（176）會永遠擋住 → 先最多疊 2 層
      const stack = stage.allowCrouch ? it.stack : Math.min(it.stack, MAX_STACK_NO_CHARGE);
      for (let i = 0; i < stack; i++) add("stoneBlock", it.x, { lift: i * 58 });
      const topY = (stack - 1) * 58 + 60;
      const tops = it.top ?? [];
      tops.forEach((id, j) => {
        const cx = it.x + 32 + (j - (tops.length - 1) / 2) * 30;
        add(id, cx - sizeOf(id)[0] / 2, { lift: topY, state: "idle" });
      });
      continue;
    }
    add(it.id, it.x, {
      lift: it.elev,
      wUnits: it.w,
      state: GameArt.propStates(it.id)?.[0]?.id,
    });
  }
  add("finishLine", TRACK, { state: "idle" });
  finishProp = props[props.length - 1];
  return props;
}

function placeWorld(el: HTMLElement, trackX: number, wUnits: number, hUnits: number, laneLift: number, feetUnits: number): boolean {
  const u = stage.unit;
  const W = stage.width;
  const H = stage.height;
  const x = W * stage.charX + (trackX - playerX()) * u;
  el.style.width = `${wUnits * u}px`;
  el.style.height = `${hUnits * u}px`;
  el.style.left = `${x - (wUnits * u) / 2}px`;
  // 腳底在 viewBox 底部往上 feetUnits 處，對齊地面線（0.88H）；laneLift＝後一條跑道往上移一點表示較遠
  el.style.top = `${H * 0.88 - (hUnits - feetUnits) * u - laneLift}px`;
  return x > -wUnits * u && x < W + wUnits * u;
}

function setOppPose(pose: string): void {
  if (!S || oppPose === pose) return;
  oppPose = pose;
  S.opp.pose = pose;
  if (!oppCtl) {
    oppEl.innerHTML = GameArt.animal(S.opp.kind, { pose });
    const svg = oppEl.querySelector("svg");
    if (svg) oppCtl = GameArt.animateAnimal(svg, pose);
  } else oppCtl.setPose(pose);
}

function setRefPose(i: number, pose: string): void {
  const el = refEls[i];
  if (el.dataset.pose === pose) return;
  el.dataset.pose = pose;
  refCtl[i]?.stop();
  el.innerHTML = GameArt.character({ ...(GameArt.presets["kid-blue"] as Look), ...(R.referee.look as Look), view: "front", pose });
  const svg = el.querySelector("svg");
  refCtl[i] = svg ? GameArt.animate(svg as SVGElement, pose) : null;
}

/** 裁判台詞：對話框放在說話的裁判頭頂上（0＝起跑門旁、1＝終點線旁），每幀跟著裁判位置走 */
let speakingRef = 0;
function refLine(text: string, ms = 1400, who = 0): void {
  const el = $(".race-refline", stage.hud);
  speakingRef = who;
  el.innerHTML = `<div class="g-bubble g-h-sun">${escapeHtml(text)}</div>`;
  el.hidden = false;
  placeRefLine();
  clearTimeout(Number(el.dataset.t));
  el.dataset.t = String(window.setTimeout(() => (el.hidden = true), ms));
}

function placeRefLine(): void {
  const el = $(".race-refline", stage.hud);
  if (el.hidden) return;
  const r = refEls[speakingRef];
  const cx = r.offsetLeft + r.offsetWidth / 2;
  const top = r.offsetTop + r.offsetHeight * 0.02; // 裁判頭頂（帽子上緣）
  const w = el.offsetWidth;
  // 裁判在畫面外時貼著邊緣，不跑出舞台
  const x = Math.min(stage.width - w / 2 - 6, Math.max(w / 2 + 6, cx));
  el.style.left = `${x}px`;
  el.style.top = `${Math.max(el.offsetHeight + 6, top)}px`;
}

function floatText(html: string, hue = "sun"): void {
  const el = document.createElement("div");
  el.className = `g-float race-float g-h-${hue}`;
  el.innerHTML = html;
  el.style.left = `${stage.charX * 100}%`;
  el.style.top = `${Math.max(6, 88 - ((stage.jumpHeight + 140 * stage.unit) / stage.height) * 100)}%`;
  stage.el.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function shake(): void {
  if (prefersReducedMotion()) return;
  stage.el.animate(
    [{ transform: "translate(0,0)" }, { transform: "translate(-3px,1px)" }, { transform: "translate(3px,-1px)" }, { transform: "translate(0,0)" }],
    { duration: 120 }
  );
}

function startRace(st: RaceStage): void {
  $(".race-menu").hidden = true;
  $(".race-play").hidden = false;
  applyLandscape();
  stage.setTime({ kind: "fixed", u: st.u });
  stage.offset = 0;
  stage.propPeriod = (TRACK + 1200) * (stage.unit / stage.width) + 4;
  stage.setProps(buildTrack(st));
  S = {
    st,
    phase: "countdown",
    time: 0,
    opp: { kind: st.opponent, x: START_X, pose: "idle", napUntil: 0, napCooldown: 0, stumbleUntil: 0, stumbled: new Set(), finishTime: null },
    boosts: [],
    slows: [],
    shield: false,
    can: false,
    canUntil: 0,
    hits: 0,
    pickups: 0,
    gapAtOppFinish: null,
    finishBroken: false,
  };
  oppCtl?.stop();
  oppCtl = null;
  oppPose = "";
  oppEl.dataset.kind = st.opponent;
  setOppPose("idle");
  setRefPose(0, R.referee.poses.idle ?? "idle");
  setRefPose(1, R.referee.poses.finish ?? "salute");
  shieldEl.hidden = true;
  stage.setCharge(false);
  renderBoost();
  paused = false;
  stage.freeze(false);
  pad.setEnabled(true);
  void countdown();
}

async function countdown(): Promise<void> {
  if (!S) return;
  const cd = $(".race-countdown", stage.hud);
  cd.hidden = false;
  const st = S;
  const steps: [string, string | null, string][] = [
    ["3", R.referee.lines.ready, R.referee.poses.countdown ?? "wave"],
    ["2", R.referee.lines.set, R.referee.poses.countdown ?? "wave"],
    ["1", null, R.referee.poses.countdown ?? "wave"],
  ];
  say(R.animals[st.opp.kind]?.hello);
  for (const [n, line, pose] of steps) {
    if (S !== st) return;
    cd.innerHTML = `<span class="race-count g-t-display">${n}</span>`;
    setRefPose(0, pose);
    if (line) {
      refLine(line, 900);
      say(line);
    }
    sfx("beep");
    await waitRunning(800);
  }
  if (S !== st) return;
  cd.innerHTML = `<span class="race-count race-count--go g-t-display">Go!</span>`;
  setRefPose(0, R.referee.poses.go ?? "cheer");
  refLine(R.referee.lines.go, 900);
  say(R.referee.lines.go);
  sfx("go");
  st.phase = "running";
  setTimeout(() => (cd.hidden = true), 600);
}

/** 等 ms（暫停期間不算） */
function waitRunning(ms: number): Promise<void> {
  return new Promise((res) => {
    let left = ms;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      if (!paused) left -= now - last;
      last = now;
      if (left <= 0) res();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// 速度＝基準 × 加速倍率（取最大，不疊加）× 所有減速倍率相乘（px/s）
function currentMults(): { boost: number; slow: number; zone: string | null } {
  if (!S) return { boost: 1, slow: 1, zone: null };
  const now = S.time;
  S.boosts = S.boosts.filter((b) => b.until > now);
  S.slows = S.slows.filter((b) => b.until > now);
  let boost = 1;
  for (const b of S.boosts) boost = Math.max(boost, b.mult);
  let slow = 1;
  for (const s of S.slows) slow *= s.mult;
  // 區域：順風（在區域內）、泥巴（在地面上踩到）
  let zone: string | null = null;
  const box = stage.charBox();
  for (const c of stage.colliders()) {
    if (c.kind !== "zone" || c.right <= box.left || c.left >= box.right) continue;
    if (c.p.id === "windZone" && box.bottom < c.top) {
      boost = Math.max(boost, R.effects.wind?.mult ?? 1.25);
      zone = "wind";
    }
    if (c.p.id === "mud" && !stage.isAirborne && !c.p.used) {
      slow *= R.effects.mud?.slow?.mult ?? 0.6;
      zone = "mud";
    }
  }
  return { boost, slow, zone };
}

// 方向鍵調整步調（玩家自己出力，跟道具分開相乘）：按住 →（前進方向）略快、連續點 → 明顯變快、按住 ← 略慢。
// 數值先放在 App 端，之後可移到 token（race.player.pace）
// 加速道具倍率（使用者要求調高；token 原本 加速鞋 1.4／加速罐 1.7）。已寫交辦請內容端改 token，
// 改好後把這裡清空（{}）就會回到讀 token 的 effects.*.mult。
// v1.6.0 起 token 已是 1.6／2.1，這裡清空、改讀 token
const BOOST_MULT: Partial<Record<"speedShoe" | "boostCan", number>> = {};

const PACE = {
  hold: 1.1,
  tap: 1.6,
  back: 0.85,
  tapCount: 3,
  tapWindowMs: 900,
  tapKeepMs: 450,
  // token 有 race.player.pace 就用 token 的值
  ...((R.player as { pace?: Record<string, number> }).pace ?? {}),
};
let forwardTaps: number[] = [];
let curPace = 1;
function paceMult(): number {
  const now = performance.now();
  forwardTaps = forwardTaps.filter((t) => now - t < PACE.tapWindowMs);
  const d = pad.down;
  const last = forwardTaps[forwardTaps.length - 1] ?? 0;
  if (forwardTaps.length >= PACE.tapCount && now - last < PACE.tapKeepMs) return PACE.tap;
  if (d.right && !d.left) return PACE.hold;
  if (d.left && !d.right) return PACE.back;
  return 1;
}
pad.on((k, v) => {
  if (k === "right" && v) forwardTaps.push(performance.now());
});

stage.autoRun = () => {
  if (!S || S.phase !== "running" || paused) return 0;
  const m = currentMults();
  return R.player.speed * m.boost * m.slow * paceMult() * stage.unit;
};

function addSlow(kind: string): void {
  if (!S) return;
  const e = R.effects[kind];
  if (!e?.slow) return;
  S.slows.push({ kind, mult: e.slow.mult, until: S.time + (e.slow.sec ?? 0.6) });
}

/** 護盾擋下：破掉、不減速、不算撞擊 */
function useShield(): boolean {
  if (!S || !S.shield) return false;
  S.shield = false;
  shieldEl.hidden = true;
  sfx("pop");
  floatText(icon("sparkle"), "sky");
  return true;
}

stage.onHazard = (p) => {
  if (!S || S.phase !== "running") return;
  if (useShield()) return;
  S.hits += 1;
  sfx("hit");
  shake();
  if (p.id === "rock") {
    stage.shortTrip(380); // 短絆：只播 trip 前 380ms
    addSlow("rock");
  } else if (p.id === "branch") {
    addSlow("branch");
    floatText(`${icon("star")}${icon("star")}`, "sun");
  } else if (p.id === "hive") {
    addSlow("hive");
    floatText(`${icon("sparkle")}${icon("sparkle")}`, "sun");
  }
};
stage.onBlocked = () => {
  if (!S || S.phase !== "running") return;
  // 撞到 solid 被擋也算 1 次撞擊（護盾不擋 solid：它不是減速）
  S.hits += 1;
  sfx("bump");
};
stage.onJump = () => sfx("jump");

// 蓄力跳：地面蹲住 ≥ holdMs 後放開或按跳 → mult 倍高度；≥350ms 開始柔和光暈，≥holdMs 變亮
let crouchSince = 0;
let chargeFull = false;
let chargeGlow = false;
let chargeGraceUntil = 0;
function glow(): void {
  const can = !!S && S.canUntil > S.time;
  stage.setCharge(can || chargeGlow, can || chargeFull);
}
stage.jumpMultiplier = () => {
  const m = chargeFull && stage.allowCrouch ? (R.player.chargeJump?.mult ?? 2) : 1;
  chargeFull = chargeGlow = false;
  crouchSince = 0;
  chargeGraceUntil = 0;
  glow();
  return m;
};
function updateCharge(now: number): void {
  if (!stage.allowCrouch) return;
  const onGround = !stage.isAirborne;
  if (pad.down.down && onGround && S?.phase !== "finished") {
    if (!crouchSince) crouchSince = now;
    const held = now - crouchSince;
    if (!chargeGlow && held >= 350) {
      chargeGlow = true;
      glow();
    }
    if (!chargeFull && held >= (R.player.chargeJump?.holdMs ?? 1000)) {
      chargeFull = true;
      sfx("charge");
      glow();
    }
  } else {
    crouchSince = 0;
    if ((chargeGlow || chargeFull) && (!onGround || (chargeGraceUntil && now > chargeGraceUntil))) {
      chargeFull = chargeGlow = false;
      chargeGraceUntil = 0;
      glow();
    }
  }
}

// 虛擬按鍵（跟工作室同一組）：A／↑＝跳、B＝使用道具、←／→＝步調；↓ 不作用（蹲滑已移除）
pad.on((k, v) => {
  if (k === "up") pad.press("a", v);
  if (k === "b" && v) useCan();
  if (k === "down" && !v && chargeFull && !stage.isAirborne && S?.phase === "running") {
    pad.press("a", true);
    pad.press("a", false);
  } else if (k === "down" && !v && (chargeGlow || chargeFull)) chargeGraceUntil = performance.now() + 300;
});
// 鍵盤 B／Shift／K 由 VirtualPad 對到 B（使用道具）；C 也可以用
window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) useCan();
    }
    if (e.key === "Escape" && S?.phase === "running") pause(true);
  },
  true
);
window.addEventListener(
  "keyup",
  (e) => {
    if (e.key === "c" || e.key === "C") e.stopImmediatePropagation();
  },
  true
);

// 虛擬按鍵：左右鍵在賽跑用不到（自動前進），隱藏；B 鍵標成「道具」
const padHost = $(".race-controls");
padHost.appendChild(pad.el);
pad.el.classList.add("race-pad");
const padB = pad.el.querySelector<HTMLButtonElement>('[data-k="b"]')!;
const padA = pad.el.querySelector<HTMLButtonElement>('[data-k="a"]')!;
padA.setAttribute("aria-label", "A 跳");
padA.innerHTML = `<span class="race-pad-label">A</span><span class="race-pad-sub">跳</span>`;
padB.setAttribute("aria-label", "B 使用道具");

function renderBoost(): void {
  const has = !!S?.can;
  padB.classList.toggle("race-pad-b--ready", has);
  padB.innerHTML = `<span class="race-pad-label">B</span><span class="race-pad-sub">${has ? "加速" : "道具"}</span>${
    has ? `<span class="race-pad-item">${GameArt.prop("boostCan")}</span>` : ""
  }`;
}

// ---------------- 手機橫式版面（game-tokens layout.landscapePhone，handoff-prompt-letsgo-race-landscape） ----------------
// 只在比賽中、且符合 mediaQuery（矮的橫放）時啟用：左欄（返回、頭像名稱、← →）｜16:9 舞台（上方細列：時間＋進度）｜
// 右欄（代幣、音量、暫停、A、B）。把既有元素「搬」進欄位（事件都還在），離開時原位放回；直式與平板不變。
interface LandscapeSpec {
  mediaQuery?: string;
  rail?: { left?: { width?: number }; right?: { width?: number } };
  controls?: { moveLeft?: number; moveRight?: number; jump?: number; item?: number; gap?: number; minTouch?: number };
  hud?: { back?: number; avatar?: number; nameMaxChars?: number; stripHeight?: number };
}
const LP: LandscapeSpec = ((GameTokens as unknown as { layout?: { landscapePhone?: LandscapeSpec } }).layout?.landscapePhone ?? {}) as LandscapeSpec;
const lpMq = window.matchMedia(LP.mediaQuery ?? "(orientation: landscape) and (max-height: 500px)");
{
  const st = $(".race").style;
  const px = (n: number | undefined, d: number) => `${n ?? d}px`;
  st.setProperty("--lp-left", px(LP.rail?.left?.width, 144));
  st.setProperty("--lp-right", px(LP.rail?.right?.width, 96));
  st.setProperty("--lp-move-l", px(LP.controls?.moveLeft, 56));
  st.setProperty("--lp-move-r", px(LP.controls?.moveRight, 72));
  st.setProperty("--lp-jump", px(LP.controls?.jump, 72));
  st.setProperty("--lp-item", px(LP.controls?.item, 56));
  st.setProperty("--lp-gap", px(LP.controls?.gap, 8));
  st.setProperty("--lp-back", px(LP.hud?.back, 44));
  st.setProperty("--lp-avatar", px(LP.hud?.avatar, 36));
  st.setProperty("--lp-strip", px(LP.hud?.stripHeight, 32));
}
const lpLeft = document.createElement("div");
lpLeft.className = "race-rail race-rail--left";
lpLeft.innerHTML = `<div class="race-rail-top"></div><div class="race-rail-info race-infobar"></div><div class="race-rail-bottom race-rail-move"></div>`;
const lpRight = document.createElement("div");
lpRight.className = "race-rail race-rail--right";
lpRight.innerHTML = `<div class="race-rail-top"><div class="race-rail-coins"></div><div class="race-rail-row"></div></div><div class="race-rail-bottom race-rail-ab"></div>`;
const lpStrip = document.createElement("div");
lpStrip.className = "race-strip";
const ppInfo = document.createElement("div");
ppInfo.className = "race-infobar";
const lpMoved: { el: HTMLElement; parent: Node; next: Node | null }[] = [];
type LayoutMode = "lp" | "pp" | null;
let layoutMode: LayoutMode = null;
const nameEl = $(".race-who-text strong");
// 手機直放：時間、進度、暫停移到舞台上方細列；效果（加速／減速／領先幾步）移到舞台下方，畫面上不再有資訊
const ppMq = window.matchMedia("(orientation: portrait) and (max-width: 700px)");

function lpMove(el: HTMLElement, to: HTMLElement): void {
  lpMoved.push({ el, parent: el.parentNode!, next: el.nextSibling });
  to.appendChild(el);
}

function restoreLayout(): void {
  for (const m of lpMoved.reverse()) m.parent.insertBefore(m.el, m.next && m.next.parentNode === m.parent ? m.next : null);
  lpMoved.length = 0;
  lpLeft.remove();
  lpRight.remove();
  lpStrip.remove();
  ppInfo.remove();
  nameEl.textContent = charName;
  $(".race").classList.remove("race--lp", "race--pp");
}

function applyLandscape(): void {
  const playing = !$(".race-play").hidden;
  const want: LayoutMode = !playing ? null : lpMq.matches ? "lp" : ppMq.matches ? "pp" : null;
  if (want === layoutMode) return;
  if (layoutMode) restoreLayout();
  layoutMode = want;
  const page = $(".race");
  const host = $(".race-stage-host");
  if (want === "lp") {
    const [lt, li, lb] = [lpLeft.children[0] as HTMLElement, lpLeft.children[1] as HTMLElement, lpLeft.children[2] as HTMLElement];
    const [rt, rb] = [lpRight.children[0] as HTMLElement, lpRight.children[1] as HTMLElement];
    const row = rt.querySelector<HTMLElement>(".race-rail-row")!;
    lpMove($(".race-back"), lt);
    lpMove($(".race-who"), lt);
    // 方向鍵上下左右整組保留（各遊戲視覺一致；賽跑的 ↑↓ 沒有功能）
    lpMove(pad.el.querySelector<HTMLElement>(".vpad-dpad")!, lb);
    lpMove($(".race-coins"), rt.querySelector<HTMLElement>(".race-rail-coins")!);
    lpMove($(".race-sound"), row);
    lpMove($(".race-pause"), row);
    lpMove(padA, rb);
    lpMove(padB, rb);
    lpMove($(".race-timer"), lpStrip);
    lpMove($(".race-progress"), lpStrip);
    lpMove(hudEffects, li); // 效果、領先幾步：左欄中間（不蓋在畫面上）
    lpMove(hudEdge, li);
    page.prepend(lpLeft);
    page.append(lpRight);
    host.parentNode!.insertBefore(lpStrip, host);
    const max = LP.hud?.nameMaxChars ?? 6;
    nameEl.textContent = [...charName].length > max ? [...charName].slice(0, max).join("") + "…" : charName;
    page.classList.add("race--lp");
  } else if (want === "pp") {
    lpMove($(".race-timer"), lpStrip);
    lpMove($(".race-progress"), lpStrip);
    lpMove($(".race-pause"), lpStrip);
    lpMove(hudEffects, ppInfo);
    lpMove(hudEdge, ppInfo);
    host.parentNode!.insertBefore(lpStrip, host);
    host.parentNode!.insertBefore(ppInfo, host.nextSibling);
    page.classList.add("race--pp");
  }
  pad.releaseAll();
}
const onLayoutChange = () => {
  applyLandscape();
  document.querySelector(".race-result")?.classList.toggle("race-result--lp", lpMq.matches);
};
lpMq.addEventListener?.("change", onLayoutChange);
ppMq.addEventListener?.("change", onLayoutChange);

function useCan(): void {
  if (!S || S.phase !== "running" || paused || !S.can) return;
  const e = R.effects.boostCan;
  S.can = false;
  S.canUntil = S.time + (e.sec ?? 2);
  S.boosts.push({ kind: "can", mult: BOOST_MULT.boostCan ?? e.mult ?? 1.7, until: S.canUntil });
  sfx("boost");
  floatText(`${icon("bolt")}`, "rose");
  glow();
  renderBoost();
}

function collect(c: StageCollider): void {
  if (!S) return;
  const p = c.p;
  p.used = true;
  stage.setPropState(p, "collected");
  S.pickups += 1;
  if (p.id === "speedShoe") {
    const e = R.effects.speedShoe;
    S.boosts = S.boosts.filter((b) => b.kind !== "shoe"); // 再撿刷新時間
    S.boosts.push({ kind: "shoe", mult: BOOST_MULT.speedShoe ?? e.mult ?? 1.4, until: S.time + (e.sec ?? 2.5) });
    sfx("pickup");
    floatText(`${icon("bolt")} ${BOOST_MULT.speedShoe ?? e.mult}×`, "sky");
  } else if (p.id === "boostCan") {
    if (!S.can) {
      S.can = true;
      floatText(`${icon("check")} 加速罐`, "rose");
    }
    sfx("pickup");
    renderBoost();
  } else if (p.id === "bubble") {
    S.shield = true;
    shieldEl.hidden = false;
    sfx("pickup");
  }
}

stage.onTick = (dt) => {
  if (!S) return;
  const now = performance.now();
  if (paused) return;
  updateCharge(now);
  const running = S.phase === "running";
  if (running) S.time += dt;
  if (S.canUntil && S.time >= S.canUntil) {
    S.canUntil = 0;
    glow();
  }

  // 撿道具、泥巴（護盾也擋泥巴）、彈簧
  const box = stage.charBox();
  for (const c of stage.colliders()) {
    if (c.right <= box.left || c.left >= box.right) continue;
    const overlapY = c.bottom < box.top && c.top > box.bottom;
    if (c.kind === "pickup" && !c.p.used && overlapY && running) collect(c);
    if (c.kind === "zone" && c.p.id === "mud" && running && !stage.isAirborne && !c.p.used && !c.p.inside) {
      c.p.inside = true;
      if (useShield()) c.p.used = true;
      else {
        S.hits += 1;
        sfx("hit");
      }
    }
    if (c.kind === "spring" && stage.isFalling && lastFeet > c.top && box.bottom <= c.top && running) {
      stage.setPropState(c.p, "compressed");
      setTimeout(() => stage.setPropState(c.p, "launched"), 90);
      setTimeout(() => stage.setPropState(c.p, "idle"), 700);
      stage.bounce(1.3);
      stage.addDash((R.effects.spring?.skip ?? 120) * stage.unit, 0.5);
      sfx("spring");
      floatText(`${icon("up")} +${R.effects.spring?.skip ?? 120}`, "mint");
    }
  }
  for (const p of stage.props) if (p.id === "mud" && p.inside) {
    const r = stage.propRect(p);
    if (r && (r.right <= box.left || r.left >= box.right)) p.inside = false;
  }
  lastFeet = box.bottom;

  // 對手
  updateOpponent(dt, running);

  // 裁判、對手位置
  const vbOpp = GameArt.animalViewBox[S.opp.kind] ?? [130, 100];
  const oppVisible = placeWorld(oppEl, S.opp.x, vbOpp[0], vbOpp[1], 10 * (stage.height / 400), 6);
  placeWorld(refEls[0], -110, 120, 170, 12 * (stage.height / 400), 6);
  placeWorld(refEls[1], TRACK + 150, 120, 170, 12 * (stage.height / 400), 6);
  placeRefLine();
  // 護盾跟著角色
  if (S.shield) {
    const s = 150 * stage.unit;
    shieldEl.style.width = shieldEl.style.height = `${s}px`;
    shieldEl.style.left = `${stage.width * stage.charX - s / 2}px`;
    shieldEl.style.top = `${stage.height * 0.88 - stage.jumpHeight - s * 0.92}px`;
  }
  const m = currentMults();
  const pace = paceMult();
  speedLines.classList.toggle("on", running && (m.boost > 1.01 || pace > 1.2) && !prefersReducedMotion());
  curPace = running ? pace : 1;
  renderHud(oppVisible, m);

  // 終點
  const px = playerX();
  if (S.opp.x >= TRACK && S.opp.finishTime === null) {
    S.opp.finishTime = S.time;
    S.gapAtOppFinish = Math.max(0, TRACK - px);
    breakFinish();
  }
  if (running && px >= TRACK) finish();
};

function updateOpponent(dt: number, running: boolean): void {
  if (!S) return;
  const o = S.opp;
  const cfg = R.opponents[o.kind];
  if (!running && S.phase !== "finished") {
    setOppPose("idle");
    return;
  }
  // 玩家贏了：對手直接停在原地（不再往終點跑），做沮喪動作
  if (S.phase === "finished" && finishWin) {
    setOppPose("sad");
    return;
  }
  if (o.finishTime !== null && o.x >= TRACK) {
    // 到終點後停在線後：對手贏＝cheer、對手輸＝sad
    setOppPose(S.phase === "finished" && finishWin ? "sad" : "cheer");
    if (o.x < TRACK + 160) o.x += cfg.speed * 0.5 * dt;
    return;
  }
  const t = S.time;
  let v = cfg.speed;
  let pose = "run";
  if (cfg.sprint && t % cfg.sprint.everySec < cfg.sprint.sec) v = cfg.sprint.speed;
  // 兔子午睡：領先太多而且玩家還沒完賽
  if (cfg.nap) {
    if (t < o.napUntil) {
      v = 0;
      pose = "sleep";
    } else if (o.napUntil && t >= o.napUntil && o.napCooldown < o.napUntil) {
      o.napCooldown = o.napUntil + cfg.nap.cooldownSec;
    } else if (S.phase === "running" && o.x - playerX() > cfg.nap.lead && t >= o.napCooldown) {
      o.napUntil = t + cfg.nap.sec;
      v = 0;
      pose = "sleep";
    }
  }
  // 固定位置絆倒
  for (const [i, s] of (cfg.stumble ?? []).entries()) {
    if (!o.stumbled.has(i) && o.x >= s.x) {
      o.stumbled.add(i);
      o.stumbleUntil = t + s.sec;
    }
  }
  if (t < o.stumbleUntil) {
    v *= 0.15;
    pose = "stumble";
  }
  o.x += v * dt;
  setOppPose(pose);
}

function breakFinish(): void {
  if (!S || S.finishBroken || !finishProp) return;
  S.finishBroken = true;
  stage.setPropState(finishProp, "broken");
}

let finishWin: boolean | null = null;
function renderHud(oppVisible: boolean, m: { boost: number; slow: number; zone: string | null }): void {
  if (!S) return;
  hudTimerSpan.textContent = S.time.toFixed(1);
  const bar = hudProgress;
  const me = $(".race-pin--me", bar);
  const op = $(".race-pin--opp", bar);
  if (!op.dataset.kind) {
    op.dataset.kind = S.opp.kind;
  }
  if (op.dataset.kind !== S.opp.kind || !op.innerHTML) {
    op.dataset.kind = S.opp.kind;
    op.innerHTML = GameArt.animal(S.opp.kind, { pose: "idle" });
  }
  me.style.left = `${Math.min(100, Math.max(0, (playerX() / TRACK) * 100))}%`;
  op.style.left = `${Math.min(100, Math.max(0, (S.opp.x / TRACK) * 100))}%`;
  // 對手在畫面外：邊緣箭頭＋距離（1 步≈60 單位）
  const edge = hudEdge;
  if (!oppVisible && S.phase === "running" && S.opp.x < TRACK + 100) {
    const diff = S.opp.x - playerX();
    const steps = Math.max(1, Math.round(Math.abs(diff) / 60));
    edge.hidden = false;
    edge.className = `race-edge ${diff > 0 ? "race-edge--right" : "race-edge--left"}`;
    edge.innerHTML =
      diff > 0
        ? `<span class="g-chip">${escapeHtml(animalName(S.opp.kind))}領先 ${steps} 步 ${icon("right", "sm")}</span>`
        : `<span class="g-chip">${icon("left", "sm")} 你領先 ${steps} 步</span>`;
  } else edge.hidden = true;
  // 進行中的效果
  const chips: string[] = [];
  if (m.boost > 1.01) chips.push(`<span class="g-chip g-h-sky">${icon("bolt", "sm")} ${m.boost.toFixed(2).replace(/0$/, "")}×</span>`);
  if (m.slow < 0.99) chips.push(`<span class="g-chip g-h-rose">${icon("down", "sm")} ${m.slow.toFixed(2).replace(/0$/, "")}×</span>`);
  if (curPace > 1.2) chips.push(`<span class="g-chip g-h-sun">${icon("right", "sm")} 衝刺！</span>`);
  else if (curPace < 0.99) chips.push(`<span class="g-chip g-h-stone">${icon("left", "sm")} 慢慢跑</span>`);
  if (S.shield) chips.push(`<span class="g-chip g-h-mint">${icon("shield", "sm")} 護盾</span>`);
  const fx = hudEffects;
  const html = chips.join("");
  if (fx.innerHTML !== html) fx.innerHTML = html;
}

// ---------------- 終點、結算 ----------------
function finish(): void {
  if (!S || S.phase !== "running") return;
  S.phase = "finished";
  const win = S.opp.finishTime === null;
  finishWin = win;
  const time = Math.round(S.time * 10) / 10;
  if (win) {
    breakFinish();
    confetti();
    sfx("win");
  } else sfx("lose");
  setRefPose(1, win ? R.referee.poses.win ?? "victory" : R.referee.poses.lose ?? "cheer");
  refLine(win ? R.referee.lines.win : R.referee.lines.lose, 2200, 1);
  say(win ? R.referee.lines.win : R.referee.lines.lose);
  stage.setCharge(false);
  const stars = starsFor(win, time, S.st.targetTime, S.hits);
  const badgesBefore = earnedRaceBadges();
  const res = recordResult(race, S.st.id, { win, time, stars, hits: S.hits }, R.rewards.titles, R.stages.length);
  const badgesAfter = earnedRaceBadges();
  for (const b of badgesAfter) if (!badgesBefore.has(b) && !race.rewards.badges.includes(b)) race.rewards.badges.push(b);
  if (profileId) saveRace(profileId, race);
  const newBadges = [...badgesAfter].filter((b) => !badgesBefore.has(b));
  // 對手繼續跑到終點（不再影響結果）；角色停下
  const gap = win ? Math.max(0, TRACK - S.opp.x) : S.gapAtOppFinish ?? 0;
  const st = S.st;
  setTimeout(() => showResult({ st, win, time, stars, gap, hits: S!.hits, pickups: S!.pickups, newBadges, newTitles: res.newTitles, trophy: res.trophy }), 1400);
}

function earnedRaceBadges(): Set<string> {
  const ctx = {
    completedUnits: new Set<string>(),
    masteredUnits: new Set<string>(),
    openUnitCount: 0,
    plannedUnitsByLevel: {},
    conversationUnitKeys: [],
    conversationCompletedUnits: new Set<string>(),
    crosswordClears: 0,
    bubblePopClears: 0,
    race,
  } as RuleBadgeContext;
  const out = new Set<string>();
  for (const b of getAllBadges()) {
    if (b.category !== "race") continue;
    if (evaluateRuleBadge(b, ctx)?.achieved) out.add(b.code ?? b.id);
  }
  return out;
}

function confetti(): void {
  if (prefersReducedMotion()) return;
  const wrap = document.createElement("div");
  wrap.className = "race-confetti";
  const hues = ["sun", "rose", "sky", "mint", "lilac", "peach"];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement("i");
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = `var(--g-${hues[i % hues.length]})`;
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    c.style.animationDuration = `${1.4 + Math.random() * 0.8}s`;
    wrap.appendChild(c);
  }
  stage.el.appendChild(wrap);
  setTimeout(() => wrap.remove(), 2800);
}

interface Result {
  st: RaceStage;
  win: boolean;
  time: number;
  stars: number;
  gap: number;
  hits: number;
  pickups: number;
  newBadges: string[];
  newTitles: string[];
  trophy: boolean;
}

function showResult(r: Result): void {
  // 輸了：隨機暈眩或思考
  const loseFace = Math.random() < 0.5 ? "dizzy" : "think";
  const next = R.stages.find((s) => s.id === r.st.id + 1);
  const nextOpen = !!next && isUnlocked(race, next.id);
  const steps = Math.max(1, Math.round(r.gap / 60));
  const badgeNames = r.newBadges
    .map((code) => getAllBadges().find((b) => b.code === code)?.name ?? code)
    .map((n) => `<span class="g-chip g-h-lilac">${icon("trophy", "sm")} ${escapeHtml(n)}</span>`)
    .join("");
  const tip =
    !r.win && race.losses >= 3
      ? `<div class="race-tip g-bubble g-h-mint">${icon("info", "sm")} 小提示：把加速罐留到最後衝刺；一直連點 → 可以衝得更快！</div>`
      : "";
  const overlay = document.createElement("div");
  overlay.className = "gmodal race-result";
  overlay.innerHTML = `
    <div class="gmodal-card race-result-card" role="dialog" aria-modal="true">
      ${photosSupported() ? `<button type="button" class="g-iconbtn g-h-sky race-result-photo" data-act="photo" aria-label="拍照">${icon("camera")}</button>` : ""}
      <div class="race-result-left">
      <div class="race-podium">
        <span class="race-podium-me">${GameArt.character({ ...look, view: "front", pose: r.win ? "victory" : loseFace })}</span>
        <span class="race-podium-opp">${GameArt.animal(r.st.opponent, { pose: r.win ? "sad" : "cheer" })}</span>
      </div>
      <p class="g-t-title">${r.win ? "第 1 名！" : "第 2 名，差一點！"}</p>
      <div class="race-card-stars race-result-stars" aria-label="${r.stars} 顆星">${starsHtml(r.stars)}</div>
      </div>
      <div class="race-result-right">
      <ul class="race-result-list g-t-body">
        <li>時間 <b>${r.time.toFixed(1)}</b> 秒（目標 ${r.st.targetTime} 秒）</li>
        <li>${r.win ? `贏${escapeHtml(animalName(r.st.opponent))} ${steps} 步` : `落後 ${steps} 步`}</li>
        <li class="race-li-pair"><span>撿到道具 <b>${r.pickups}</b> 個</span><span class="race-li-dot">・</span><span>撞到 <b>${r.hits}</b> 次</span></li>
      </ul>
      ${r.newTitles.length ? `<p class="g-t-label">獲得稱號：${r.newTitles.map(escapeHtml).join("、")}</p>` : ""}
      ${r.trophy ? `<p class="g-t-label">${icon("trophy", "sm")} 三場全贏！冠軍獎盃放進角色工作室了</p>` : ""}
      ${badgeNames ? `<div class="race-result-badges">${badgeNames}</div>` : ""}
      ${tip}
      <div class="gmodal-actions race-result-actions">
        <button type="button" class="gbtn gbtn--quiet" data-act="menu">${icon("back")} 回選單</button>
        <button type="button" class="gbtn g-h-sun" data-act="again">${icon("restart")} 再賽一次（${R.cost}）</button>
        ${nextOpen ? `<button type="button" class="gbtn g-h-mint" data-act="next">${icon("right")} 下一位對手</button>` : ""}
      </div>
      </div>
    </div>`;
  if (lpMq.matches) overlay.classList.add("race-result--lp");
  overlay.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "photo") {
      void takePhoto(r);
      return;
    }
    overlay.remove();
    if (act === "menu") backToMenu();
    if (act === "again") {
      backToMenu();
      void askStart(r.st.id);
    }
    if (act === "next" && next) {
      backToMenu();
      void askStart(next.id);
    }
  });
  document.body.appendChild(overlay);
  for (const t of r.newTitles) toast(`${icon("trophy")} 獲得稱號：${escapeHtml(t)}`, 2600, "lilac");
  for (const code of r.newBadges) {
    const name = getAllBadges().find((b) => b.code === code)?.name ?? code;
    toast(`${icon("trophy")} 獲得新徽章：${escapeHtml(name)}`, 3200, "lilac");
  }
}

/** 頒獎台拍照：沿用工作室的拍照（exportPNG）並存進相簿 */
async function takePhoto(r: Result): Promise<void> {
  try {
    const W = 1600;
    const H = 900;
    const st = stage.exportState();
    const blob = await GameArt.exportPNG({
      ...st,
      width: W,
      height: H,
      pose: r.win ? "victory" : "cheer",
      view: "front",
      props: [
        { id: "finishLine", x: 0.72, state: r.win ? "broken" : "idle", h: (140 * stage.unit) / stage.height },
        ...(race.rewards.trophy ? [{ id: "trophy", x: 0.62, h: (64 * stage.unit) / stage.height }] : []),
      ],
    });
    if (profileId) {
      const slot = charData?.slots[charData.activeSlot];
      await addPhoto(
        { profileId, slot: slot?.pos ?? 0, slotId: slot?.id, sceneId: "forest", time: "day", aspect: "16:9", createdAt: Date.now(), width: W, height: H },
        blob
      ).catch(() => null);
    }
    downloadBlob(blob, photoFileName(Date.now()));
    toast(`${icon("check")} 拍好了！也存進「我的角色」相簿`, 2400, "mint");
  } catch (err) {
    console.warn("賽跑拍照失敗", navigator.userAgent, err);
    toast(`${icon("info")} 這台裝置拍照失敗了`, 2400, "rose");
  }
}

function backToMenu(): void {
  S = null;
  finishWin = null;
  paused = false;
  oppCtl?.stop();
  oppCtl = null;
  stage.freeze(true);
  stage.setCharge(false);
  $(".race-pause-overlay")?.remove();
  $(".race-play").hidden = true;
  $(".race-menu").hidden = false;
  applyLandscape();
  race = loadRace(profileId ?? "");
  renderMenu();
}

// ---------------- 暫停（切 App／離開頁面自動暫停，回來按「繼續」） ----------------
function pause(on: boolean): void {
  if (!S || S.phase === "finished") return;
  if (paused === on) return;
  paused = on;
  stage.freeze(on);
  document.querySelector(".race-pause-overlay")?.remove();
  if (on) {
    const ov = document.createElement("div");
    ov.className = "gmodal race-pause-overlay";
    ov.innerHTML = `<div class="gmodal-card" role="dialog" aria-modal="true" style="align-items:center;text-align:center">
      <p class="g-t-title">暫停中</p>
      <div class="gmodal-actions">
        <button type="button" class="gbtn gbtn--quiet" data-v="quit">${icon("back")} 離開比賽</button>
        <button type="button" class="gbtn g-h-mint" data-v="go">${icon("play")} 繼續</button>
      </div></div>`;
    ov.addEventListener("click", async (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
      if (!b) return;
      if (b.dataset.v === "go") pause(false);
      else {
        ov.remove();
        const ok = await confirmDialog({ iconId: "back", text: "離開這場比賽？<br><span class=\"g-t-body\">代幣不會退回喔</span>", yes: "離開", no: "繼續比" });
        if (ok) {
          race.losses += 1;
          if (profileId) saveRace(profileId, race);
          backToMenu();
        } else pause(false);
      }
    });
    document.body.appendChild(ov);
  }
}
$(".race-pause", stage.hud).addEventListener("click", () => pause(true));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") pause(true);
});
window.addEventListener("pagehide", () => pause(true));
window.addEventListener("blur", () => {
  if (S?.phase === "running") pause(true);
});

// ---------------- 返回 ----------------
$(".race-back").addEventListener("click", async () => {
  if (S && S.phase !== "finished") {
    pause(true);
    return;
  }
  void leaveTo(returnTarget());
});

renderMenu();
tryFullscreenOnFirstTap();
// 連點 → 不要觸發 iPad 的雙擊放大／雙指縮放（只在遊戲頁）
preventZoomGestures();
padHost.addEventListener("dblclick", (e) => e.preventDefault());
if (window.matchMedia("(orientation: portrait) and (max-width: 700px)").matches) addRotateHint();

if (debug) {
  (window as unknown as { __race: unknown }).__race = {
    stage,
    pad,
    get S() {
      return S;
    },
    get race() {
      return race;
    },
    startRace: (id: number) => startRace(R.stages.find((s) => s.id === id)!),
    playerX,
    finish,
  };
}
