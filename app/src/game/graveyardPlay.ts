// 角色小鎮・夜光墓園的玩法（第三階段 3b-3；docs/plan-game-town.md）：
// 從角色工作室搬過來（characterStudio.ts，規則、數值照工作室；工作室第四階段下架前兩邊各自一份）：
// - 咬人的寶箱（3 倍大）、地底冒出的巨手、會抱人的可愛小殭屍：被纏住時連按 ← → 5 秒掙脫
// - 會左右移動的大墓碑（站在上面會跟著走）
// - 變身符咒（zombieTalisman）：變成小殭屍，怪物不再攻擊，靠近會聊天；走路變慢、不能跑
// - 魔拐杖／南瓜糖果桶：按 C 放特技（流星閃光／糖果雨），把怪物嚇跑 3 秒
// - 在墓園待超過 3 分鐘：蝙蝠群飛過畫面 10 秒
// - 萬聖限定（只到 10/31；實驗室永遠開放）：夜晚穿【巫師帽＋魔拐杖】或【南瓜萌頭＋南瓜糖果桶】，
//   骷髏月亮發光 10 秒後地底冒出傳送門，碰到會問要不要挑戰巨大南瓜怪（20 遊戲幣）
import { GameArt, icon, prefersReducedMotion } from "./gameKit";
import type { StageController, StageProp } from "./stageController";
import type { VirtualPad } from "./virtualPad";
import { playBlip } from "./townSfx";
import { LAB_MODE } from "../gameRelease";

export interface GyProp extends StageProp {
  kind: string;
  wander?: boolean;
  cooldownUntil?: number;
  /** 這個道具所在那一段場域的起點（巨手重新埋伏時用） */
  base?: number;
  resetAt?: number;
}

export interface GraveyardHost {
  stage: StageController;
  pad: VirtualPad;
  toast: (html: string, ms?: number, hue?: string) => void;
  /** 角色頭上的浮動文字（yFrac＝占舞台高） */
  float: (html: string, yFrac: number, hue?: string) => void;
  /** 目前的場域道具（含墓園的寶箱、巨手） */
  props: () => GyProp[];
  /** 加入／移除道具（萬聖節傳送門） */
  addProp: (p: GyProp) => void;
  removeProp: (p: GyProp) => void;
  /** 遊戲幣餘額 */
  balance: () => number;
  /** 前往巨大南瓜怪大作戰 */
  goPumpkinBoss: () => void;
}

type ZState = "idle" | "hop" | "hug" | "dizzy" | "wave";
interface Zombie {
  id: number;
  el: HTMLDivElement;
  x: number;
  yPx: number;
  dir: 1 | -1;
  state: ZState;
  speed: number;
  patrolMin: number;
  patrolMax: number;
  hopPhase: number;
  hugCooldownUntil: number;
  flungVx: number;
  flungVy: number;
  isFlung: boolean;
  fleeingUntil: number;
  base: number;
}
interface Wander {
  slot: number;
  startFx: number;
  targetFx: number;
  moveStartAt: number;
  moveDurationMs: number;
  nextMoveAt: number;
}

const STRUGGLE_MS = 5000;
const SWARM_AFTER_MS = 180000;
const SWARM_EVERY_MS = 190000;
const PORTAL_GLOW_MS = 10000;
const PUMPKIN_COST = 20;

const DIALOGUES = [
  "萬聖節快樂！你額頭上的符咒哪裡買的？好帥！",
  "三百年不見了！你身上的衣服洗過了嗎？",
  "你有看見我的屁股嗎？剛剛跳太快好像掉了...",
  "要一起來一顆發光的糖果嗎？",
  "今天的月亮是骷髏頭造型耶，超浪漫的對吧！",
  "隔壁的寶箱今天假牙鬆了，別惹他生氣喔！",
  "借過一下～我的腳趾頭好像被石頭卡住了！",
  "你也是被剛才那顆超大南瓜嚇醒的嗎？太鬧了吧！",
];

/** 墓園一段場域（6 個畫面寬）的道具；x 從這段的起點算 */
export function graveyardField(stage: StageController, blockW: number, blockStack: number): GyProp[] {
  const bw = (blockW * stage.unit) / stage.width;
  const r = (a: number, b: number) => Number((a + Math.random() * b).toFixed(2));
  return [
    { id: "tombstone", kind: "solid", x: 0.55, state: "glow" },
    { id: "giantHand", kind: "giantHand", x: r(0.85, 0.25), state: "hidden", front: true, scale: 1.4 },
    { id: "chest", kind: "chest", x: 1.25, state: "closed", scale: 3 },
    { id: "stoneBlock", kind: "solid", x: 1.85 },
    { id: "stoneBlock", kind: "solid", x: 1.85 + bw },
    { id: "stoneBlock", kind: "solid", x: 1.85 + bw, lift: blockStack },
    { id: "giantHand", kind: "giantHand", x: r(2.15, 0.35), state: "hidden", front: true, scale: 1.4 },
    { id: "tombstone", kind: "solid", x: 2.65, state: "idle" },
    { id: "stump", kind: "solid", x: 3.15 },
    { id: "giantHand", kind: "giantHand", x: r(3.45, 0.25), state: "hidden", front: true, scale: 1.4 },
    { id: "stoneBlock", kind: "solid", x: 3.85 },
    { id: "stoneBlock", kind: "solid", x: 3.85, lift: blockStack },
    { id: "tombstone", kind: "solid", x: 4.45, state: "glow" },
    { id: "tombstone", kind: "solid", x: 5.15, state: "glow", scale: 1.8, wander: true },
    { id: "giantHand", kind: "giantHand", x: r(5.55, 0.3), state: "hidden", front: true, scale: 1.4 },
  ];
}

/** 萬聖限定活動是否進行中（只到 10/31；實驗室永遠開放測試） */
export function isHalloweenActive(): boolean {
  if (LAB_MODE || window.location?.port === "5190") return true;
  return new Date().getMonth() + 1 < 11;
}

export class GraveyardPlay {
  private st: StageController;
  private zombies: Zombie[] = [];
  private wander = new Map<GyProp, Wander>();
  private trappedChest: GyProp | null = null;
  private trappedHand: GyProp | null = null;
  private hugged: Zombie | null = null;
  private target: "chest" | "zombie" | "hand" | null = null;
  private progress = 0;
  private lastTapAt = 0;
  private lastKey: "left" | "right" | null = null;
  private hud: HTMLDivElement | null = null;
  private chestCooldownUntil = 0;
  private lastChatAt = 0;
  private bubble: { el: HTMLDivElement; target: HTMLElement; expiresAt: number } | null = null;
  private enteredAt = performance.now();
  private lastSwarmAt = 0;
  private swarmEl: HTMLDivElement | null = null;
  private swarmTimer = 0;
  private phase: "none" | "moonGlow" | "emerged" = "none";
  private glowStartAt = 0;
  private portal: GyProp | null = null;
  private modal: HTMLElement | null = null;
  private portalCooldownUntil = 0;
  private notice: HTMLElement | null = null;
  private noticeTimer = 0;
  private arrow: HTMLDivElement | null = null;
  private wasZombie = false;
  private lastT = performance.now();
  private offPad: () => void;
  private timers: number[] = [];

  constructor(private h: GraveyardHost) {
    this.st = h.stage;
    this.offPad = h.pad.on((k, v) => {
      if (!v) return;
      if (this.target && (k === "left" || k === "right")) this.tap(k);
    });
  }

  // ================= 進出場景 =================
  /** 進墓園：殭屍（前三段各兩隻）、會移動的大墓碑 */
  start(start: number, period: number): void {
    this.enteredAt = performance.now();
    this.lastSwarmAt = 0;
    this.wasZombie = this.isZombie();
    const layer = this.st.flyerLayer;
    const cfgs = [
      { x: 0.85, patrolMin: 0.35, patrolMax: 2.05, speed: 0.045 },
      { x: 3.45, patrolMin: 2.65, patrolMax: 4.75, speed: 0.045 },
    ];
    if (layer)
      for (let k = 0; k < 3; k++) {
        const base = start + k * period;
        cfgs.forEach((c, i) => {
          const el = document.createElement("div");
          el.className = "gstage-prop gstage-creature gstage-creature--zombie";
          el.style.width = "56px";
          el.style.height = "72px";
          el.innerHTML = GameArt.prop("zombie", { state: "idle" });
          layer.appendChild(el);
          this.zombies.push({ id: i, el, x: base + c.x, yPx: 0, dir: (i % 2 === 0 ? 1 : -1) as 1 | -1, state: "idle", speed: c.speed, patrolMin: base + c.patrolMin, patrolMax: base + c.patrolMax, hopPhase: i * Math.PI, hugCooldownUntil: 0, flungVx: 0, flungVy: 0, isFlung: false, fleeingUntil: 0, base });
        });
      }
    const now = performance.now();
    for (const p of this.h.props()) if (p.wander) this.wander.set(p, { slot: 0, startFx: 0, targetFx: 0, moveStartAt: 0, moveDurationMs: 950, nextMoveAt: now + 1000 + Math.random() * 800 });
  }

  /** 離開墓園：全部清掉，角色恢復可以跳、蹲、跑 */
  stop(): void {
    this.offPad();
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.clearStruggle();
    this.trappedChest = this.trappedHand = this.hugged = null;
    for (const z of this.zombies) z.el.remove();
    this.zombies = [];
    this.wander.clear();
    this.bubble?.el.remove();
    this.bubble = null;
    this.cleanupSwarm();
    this.cleanupPortal();
    this.st.allowJump = this.st.allowCrouch = this.st.allowRun = true;
  }

  // ================= 狀態 =================
  isZombie(): boolean {
    return (this.st.currentLook?.accessories ?? []).includes("zombieTalisman");
  }
  /** 走路速度倍率（null＝不影響） */
  speedMult(): number | null {
    if (this.trappedChest || this.trappedHand) return 0;
    if (this.hugged) return 0.35;
    if (this.isZombie()) return 0.65;
    return null;
  }
  private later(fn: () => void, ms: number): void {
    this.timers.push(window.setTimeout(fn, ms));
  }
  private prompt(): string {
    return this.target === "chest" ? "連按 ← → 掙脫寶箱！" : this.target === "hand" ? "連按 ← → 掙脫巨手！" : "連按 ← → 彈開殭屍！";
  }
  private charCenter(): { cx: number; cy: number; top: number } {
    const c = this.st.charEl.getBoundingClientRect();
    const hr = this.st.hud.getBoundingClientRect();
    return { cx: c.left - hr.left + c.width / 2, cy: c.top - hr.top + c.height / 2, top: c.top - hr.top };
  }
  /** 角色往旁邊跳開 px 像素（dir＝-1 左、1 右） */
  private hop(px: number): void {
    this.st.setWorldX(this.st.worldX + px / this.st.width);
  }

  // ================= 掙脫（連按 ← →） =================
  private showHud(): void {
    if (!this.hud) {
      this.hud = document.createElement("div");
      this.hud.className = "studio-struggle-hud";
      this.st.hud.appendChild(this.hud);
    }
    this.updateHud();
  }
  private updateHud(): void {
    if (!this.hud) return;
    const pct = Math.min(100, Math.round((this.progress / STRUGGLE_MS) * 100));
    const { cx, top } = this.charCenter();
    this.hud.style.left = `${cx}px`;
    this.hud.style.top = `${top - 14}px`;
    this.hud.innerHTML = `<span>${this.prompt()}</span><div class="studio-struggle-track"><div class="studio-struggle-fill" style="width:${pct}%"></div></div>`;
  }
  private clearStruggle(): void {
    this.target = null;
    this.progress = 0;
    this.lastKey = null;
    this.lastTapAt = 0;
    this.hud?.remove();
    this.hud = null;
    this.st.allowJump = this.st.allowCrouch = true;
  }
  private trap(target: "chest" | "zombie" | "hand", now: number): void {
    this.target = target;
    this.progress = 0;
    this.lastKey = null;
    this.lastTapAt = now;
    if (target !== "zombie") this.st.allowJump = this.st.allowCrouch = false;
    this.showHud();
  }
  private tap(k: "left" | "right"): void {
    const now = performance.now();
    const alt = this.lastKey === null || k !== this.lastKey;
    this.lastKey = k;
    if (alt) {
      const dt = this.lastTapAt > 0 ? Math.min(320, Math.max(120, now - this.lastTapAt)) : 220;
      this.progress = Math.min(STRUGGLE_MS, this.progress + dt);
      this.lastTapAt = now;
      if (this.hud) {
        this.hud.classList.remove("studio-struggle-hud--shake");
        void this.hud.offsetWidth;
        this.hud.classList.add("studio-struggle-hud--shake");
      }
      playBlip("tap");
    }
    this.updateHud();
    if (this.progress >= STRUGGLE_MS) this.resolve();
  }
  private retreatHand(hand: GyProp, cooldown: number): void {
    hand.cooldownUntil = performance.now() + cooldown;
    this.st.setPropState(hand, "retreat");
    hand.el?.classList.add("studio-hand-retreat");
    this.later(() => {
      if (hand.state !== "retreat") return;
      hand.el?.classList.remove("studio-hand-retreat");
      this.st.setPropState(hand, "hidden");
      // 換到這段場域裡不特定的新位置埋伏
      hand.x = Number(((hand.base ?? 0) + 0.5 + Math.random() * 5).toFixed(2));
      this.st.positionProps();
    }, 1200);
  }
  private resolve(): void {
    const target = this.target;
    this.clearStruggle();
    const back = this.st.dir === 1 ? -1 : 1;
    if (target === "chest" && this.trappedChest) {
      const chest = this.trappedChest;
      this.trappedChest = null;
      this.chestCooldownUntil = performance.now() + 5000;
      this.st.setPropState(chest, "dizzy");
      this.later(() => {
        if (chest.state === "dizzy") this.st.setPropState(chest, "closed");
      }, 4500);
      this.hop(back * 135);
      this.st.bounce(1.15);
      playBlip("jump");
      this.h.float("跳開掙脫！", 0.45, "sun");
    } else if (target === "hand" && this.trappedHand) {
      const hand = this.trappedHand;
      this.trappedHand = null;
      this.retreatHand(hand, 10000);
      this.hop(back * 75);
      this.st.bounce(1.25);
      playBlip("jump");
      this.h.float("跳開掙脫巨手！", 0.42, "sun");
    } else if (target === "zombie" && this.hugged) {
      const z = this.hugged;
      this.hugged = null;
      z.isFlung = true;
      this.setZ(z, "dizzy");
      z.flungVx = back * 250;
      z.flungVy = -270;
      z.hugCooldownUntil = performance.now() + 5000;
      playBlip("pop");
      this.h.float("彈開殭屍！", 0.45, "mint");
    }
  }
  /** 被纏住時換上變身符咒：怪物認出同伴，立刻鬆開 */
  private releaseByTalisman(): void {
    if (!this.target && !this.trappedChest && !this.trappedHand && !this.hugged) return;
    this.clearStruggle();
    if (this.trappedChest) {
      const c = this.trappedChest;
      this.trappedChest = null;
      this.chestCooldownUntil = performance.now() + 6000;
      this.st.setPropState(c, "closed");
      this.talk(c.el, 0);
    }
    if (this.trappedHand) {
      const hd = this.trappedHand;
      this.trappedHand = null;
      this.retreatHand(hd, 10000);
    }
    if (this.hugged) {
      const z = this.hugged;
      this.hugged = null;
      z.hugCooldownUntil = performance.now() + 6000;
      this.setZ(z, "wave");
      this.talk(z.el, 0);
    }
    this.st.positionProps();
    playBlip("coin");
    this.h.float(`${icon("sparkle")} 變身符咒！怪物認出同伴鬆開了！`, 0.38, "mint");
  }
  private setZ(z: Zombie, s: ZState): void {
    if (z.state === s) return;
    z.state = s;
    z.el.innerHTML = GameArt.prop("zombie", { state: s });
  }

  // ================= 特技（C）：魔拐杖、南瓜糖果桶 =================
  /** 按 C 放特技，把怪物嚇跑 */
  special(kind: string): void {
    const now = performance.now();
    this.chestCooldownUntil = Math.max(this.chestCooldownUntil, now + 3000);
    if (this.trappedChest) {
      this.trappedChest = null;
      if (this.target === "chest") this.clearStruggle();
      this.h.float("寶箱被嚇退！", 0.42, "sun");
    }
    for (const p of this.h.props()) if (p.kind === "chest" && p.state !== "closed") this.st.setPropState(p, "closed");
    if (this.hugged) {
      this.hugged = null;
      if (this.target === "zombie") this.clearStruggle();
      this.h.float("殭屍嚇跑了！", 0.42, "mint");
    }
    const cx = this.st.charX * this.st.width;
    for (const z of this.zombies) {
      z.fleeingUntil = now + 3000;
      z.isFlung = false;
      z.flungVx = z.flungVy = 0;
      z.dir = this.st.propScreenX({ id: "zombie", x: z.x }) >= cx ? 1 : -1;
      this.setZ(z, "wave");
    }
    if (this.trappedHand) {
      const hd = this.trappedHand;
      this.trappedHand = null;
      if (this.target === "hand") this.clearStruggle();
      this.retreatHand(hd, 15000);
      this.h.float("巨手被嚇退！", 0.42, "sun");
    }
    for (const p of this.h.props()) if (p.kind === "giantHand" && p.state === "grab") this.retreatHand(p, 15000);
    void kind;
  }

  // ================= 怪物聊天（變身成小殭屍時） =================
  private talk(el: HTMLElement | null | undefined, dist: number): void {
    const now = performance.now();
    if (!el || dist > 0.1 || now - this.lastChatAt < 3500) return;
    this.lastChatAt = now;
    this.bubble?.el.remove();
    const b = document.createElement("div");
    b.className = "monster-dialog-bubble";
    b.textContent = DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)];
    this.st.hud.appendChild(b);
    this.bubble = { el: b, target: el, expiresAt: now + 3200 };
    this.placeBubble();
    playBlip("pop");
  }
  private placeBubble(): void {
    const bb = this.bubble;
    if (!bb) return;
    if (performance.now() >= bb.expiresAt || !bb.target.isConnected) {
      const el = bb.el;
      el.classList.add("monster-dialog-bubble--fadeout");
      window.setTimeout(() => el.remove(), 250);
      this.bubble = null;
      return;
    }
    const t = bb.target.getBoundingClientRect();
    const hr = this.st.hud.getBoundingClientRect();
    bb.el.style.left = `${(t.left - hr.left + t.width / 2).toFixed(1)}px`;
    bb.el.style.top = `${(t.top - hr.top - 12).toFixed(1)}px`;
  }

  // ================= 蝙蝠群（待超過 3 分鐘） =================
  private cleanupSwarm(): void {
    clearTimeout(this.swarmTimer);
    this.swarmTimer = 0;
    this.swarmEl?.remove();
    this.swarmEl = null;
  }
  /** 蝙蝠群飛過畫面 10 秒（除錯：window.__town.play 可直接呼叫） */
  swarm(): void {
    this.cleanupSwarm();
    const ov = document.createElement("div");
    ov.className = "studio-bat-swarm-overlay";
    ov.setAttribute("aria-hidden", "true");
    const up = GameArt.prop("bat", { state: "up" });
    const down = GameArt.prop("bat", { state: "down" });
    const paths = ["bat-fly--swoop-lr", "bat-fly--swoop-rl", "bat-fly--circle-center", "bat-fly--foreground-surge"];
    const count = prefersReducedMotion() ? 16 : 48;
    const waveSize = Math.ceil(count / 3);
    for (let i = 0; i < count; i++) {
      const bat = document.createElement("div");
      bat.className = `studio-swarm-bat ${paths[i % paths.length]}`;
      const inWave = i % waveSize;
      const baseY = 5 + (inWave / Math.max(1, waveSize - 1)) * 82;
      bat.style.setProperty("--bat-scale", (0.65 + (i % 7) * 0.18 + (i % 4 === 3 ? 0.35 : 0)).toFixed(2));
      bat.style.setProperty("--start-y", `${Math.max(4, Math.min(92, baseY + (((i * 11) % 7) - 3))).toFixed(1)}%`);
      bat.style.setProperty("--fly-delay", `${(Math.floor(i / waveSize) * 2.1 + (inWave % 8) * 0.24 + (i % 3) * 0.1).toFixed(2)}s`);
      bat.style.setProperty("--fly-dur", `${(4.8 + (i % 5) * 0.22).toFixed(2)}s`);
      bat.innerHTML = `<div class="bat-wing bat-wing--up">${up}</div><div class="bat-wing bat-wing--down">${down}</div>`;
      ov.appendChild(bat);
    }
    this.st.hud.appendChild(ov);
    this.swarmEl = ov;
    playBlip("trip");
    this.h.float("蝙蝠群飛過！", 0.18, "lilac");
    this.swarmTimer = window.setTimeout(() => this.cleanupSwarm(), 10000);
  }

  // ================= 萬聖限定：南瓜怪傳送門 =================
  private hasCostume(): boolean {
    const l = this.st.currentLook;
    const acc = l?.accessories ?? [];
    return (acc.includes("witchhat") && l?.held === "magiccane") || (acc.includes("pumpkinhood") && l?.held === "pumpkinbucket");
  }
  private showNotice(text: string, ms = 6000): void {
    this.hideNotice();
    const el = document.createElement("div");
    el.className = "halloween-costume-notice";
    el.textContent = text;
    this.st.hud.appendChild(el);
    this.notice = el;
    this.noticeTimer = window.setTimeout(() => this.hideNotice(), ms);
  }
  private hideNotice(): void {
    clearTimeout(this.noticeTimer);
    this.notice?.remove();
    this.notice = null;
  }
  private hideArrow(): void {
    this.arrow?.remove();
    this.arrow = null;
  }
  private cleanupPortal(): void {
    this.hideNotice();
    this.hideArrow();
    this.modal?.remove();
    this.modal = null;
    this.st.moonEl?.classList.remove("moon-mystic-glow");
    if (this.portal) this.h.removeProp(this.portal);
    this.portal = null;
    this.phase = "none";
    this.glowStartAt = 0;
  }
  private updateArrow(): void {
    if (this.phase === "none" || this.modal || this.isZombie() || !this.hasCostume()) return this.hideArrow();
    const W = this.st.width;
    const tx = this.portal ? this.st.propScreenX(this.portal) : W * this.st.charX + W * 0.7;
    if (Math.abs(tx - W * this.st.charX) / W < 0.08) return this.hideArrow();
    if (!this.arrow) {
      this.arrow = document.createElement("div");
      this.st.hud.appendChild(this.arrow);
    }
    const a = this.arrow;
    if (tx > W - 80) {
      a.className = "portal-nav-arrow portal-nav-arrow--right";
      a.innerHTML = `<span class="portal-nav-text">傳送門</span><span class="portal-nav-icon">➔</span>`;
      Object.assign(a.style, { left: "", right: "18px", top: "46%" });
    } else if (tx < 80) {
      a.className = "portal-nav-arrow portal-nav-arrow--left";
      a.innerHTML = `<span class="portal-nav-icon">⬅</span><span class="portal-nav-text">傳送門</span>`;
      Object.assign(a.style, { right: "", left: "18px", top: "46%" });
    } else {
      a.className = "portal-nav-arrow portal-nav-arrow--down";
      a.innerHTML = `<span class="portal-nav-text">萬聖傳送門</span><span class="portal-nav-icon">▼</span>`;
      Object.assign(a.style, { right: "", left: `${Math.round(tx)}px`, top: "18%" });
    }
  }
  /** 除錯：直接讓傳送門冒出來 */
  forcePortal(): void {
    this.phase = "moonGlow";
    this.glowStartAt = performance.now() - PORTAL_GLOW_MS;
  }
  private updatePortal(now: number): void {
    if (!isHalloweenActive()) {
      if (this.phase !== "none") this.cleanupPortal();
      return;
    }
    const night = this.st.skyState.night > 0.5;
    const ok = night && this.hasCostume() && !this.isZombie();
    if (this.phase === "none") {
      if (ok) {
        this.phase = "moonGlow";
        this.glowStartAt = now;
        this.st.moonEl?.classList.add("moon-mystic-glow");
        playBlip("coin");
        this.showNotice("骷髏月亮感應到萬聖裝扮，開始閃爍發光！");
      }
    } else if (this.phase === "moonGlow") {
      if (!ok && now - this.glowStartAt < PORTAL_GLOW_MS) {
        this.hideNotice();
        this.hideArrow();
        this.st.moonEl?.classList.remove("moon-mystic-glow");
        this.phase = "none";
        return;
      }
      this.st.moonEl?.classList.add("moon-mystic-glow");
      if (now - this.glowStartAt >= PORTAL_GLOW_MS) {
        this.hideNotice();
        this.phase = "emerged";
        this.st.bounce(0.5);
        playBlip("pop");
        // 在角色前方冒出來
        const p: GyProp = { id: "halloweenPortal", kind: "halloweenPortal", x: this.st.worldX + 0.32, state: "erupt", scale: 1.35, front: true };
        this.portal = p;
        this.h.addProp(p);
        p.el?.classList.add("studio-portal-burst");
        this.h.float("轟隆隆！地底冒出一座神祕萬聖傳送門！", 0.38, "mint");
        this.later(() => {
          if (!this.portal) return;
          this.st.setPropState(this.portal, "active");
          this.portal.el?.classList.remove("studio-portal-burst");
          this.portal.el?.classList.add("studio-portal-active");
        }, 700);
      }
    } else if (this.portal && !this.modal && now > this.portalCooldownUntil && this.st.distanceTo(this.portal) < 0.08) {
      this.openPortalModal();
    }
    this.updateArrow();
  }
  private stepBack(): void {
    if (!this.portal) return;
    const dir = this.st.width * this.st.charX <= this.st.propScreenX(this.portal) ? -1 : 1;
    this.hop(dir * ((this.st.height * this.st.charH * 120) / 170) * 2.2);
    this.st.perform("trip");
    this.later(() => this.st.perform(null), 450);
  }
  private card(badge: string, title: string, desc: string, actions: string): HTMLElement {
    const m = document.createElement("div");
    m.className = "halloween-portal-overlay";
    m.innerHTML = `<div class="halloween-portal-card" role="dialog" aria-modal="true" aria-label="${title}"><div class="halloween-portal-badge">${badge}</div><h2 class="halloween-portal-title">${title}</h2><p class="halloween-portal-desc">${desc}</p><div class="halloween-portal-actions">${actions}</div></div>`;
    document.body.appendChild(m);
    this.modal = m;
    return m;
  }
  private closeModal(): void {
    this.modal?.remove();
    this.modal = null;
  }
  private openPortalModal(): void {
    this.hideArrow();
    const blocked = (badge: string, title: string, desc: string) => {
      playBlip("trip");
      this.portalCooldownUntil = performance.now() + 1800;
      this.stepBack();
      const m = this.card(badge, title, desc, `<button type="button" class="gbtn gbtn-sun gbtn-md" data-v="ok">我知道了</button>`);
      m.querySelector("[data-v=ok]")?.addEventListener("click", () => this.closeModal());
    };
    if (this.isZombie())
      return blocked(GameArt.prop("zombieTalisman"), "無法進入傳送門", "你現在貼著【變身符咒】化身為小殭屍，傳送門的聖光排斥著殭屍同伴！<br>請先回家的衣櫃取下符咒，再來挑戰！");
    if (!this.hasCostume())
      return blocked(GameArt.prop("halloweenPortal", { state: "active" }), "裝備不齊全", "身上的萬聖裝扮不齊全，無法與傳送門產生共鳴！<br>請穿戴完整裝扮：<br><strong>【巫師帽＋魔拐杖】</strong> 或 <strong>【南瓜萌頭＋南瓜糖果桶】</strong> 再來挑戰！");
    playBlip("pop");
    const m = this.card(
      GameArt.prop("halloweenPortal", { state: "active" }),
      "萬聖限定：巨大南瓜怪大作戰！",
      `夜光墓園地底冒出了一顆比畫面還大的調皮南瓜怪，正在四處跳躍砸地大鬧墓園！<br>勇敢的冒險者，要接受挑戰前往討伐南瓜怪嗎？<br><span class="portal-cost-tag">每次挑戰花費 ${PUMPKIN_COST} 遊戲幣</span>`,
      `<button type="button" class="gbtn gbtn-stone gbtn-md" data-v="no">暫時不要</button><button type="button" class="gbtn gbtn-mint gbtn-md" data-v="yes">接受挑戰</button>`
    );
    m.querySelector("[data-v=no]")?.addEventListener("click", () => {
      this.closeModal();
      this.portalCooldownUntil = performance.now() + 1800;
      this.stepBack();
    });
    m.querySelector("[data-v=yes]")?.addEventListener("click", () => {
      const bal = this.h.balance();
      const lab = LAB_MODE || window.location?.port === "5190";
      if (!lab && bal < PUMPKIN_COST) {
        this.h.toast(`再賺 ${PUMPKIN_COST - bal} 個遊戲幣就可以挑戰囉！去學習吧！`, 2500, "sun");
        return;
      }
      this.closeModal();
      playBlip("coin");
      this.h.goPumpkinBoss();
    });
  }

  // ================= 會左右移動的大墓碑 =================
  private updateWander(now: number): void {
    if (!this.wander.size) return;
    const st = this.st;
    let moved = false;
    for (const [p, s] of this.wander) {
      const step = (GameArt.props.find((d) => d.id === p.id)?.size[0] ?? 60) * (p.scale ?? 1);
      if (s.moveStartAt === 0 && now >= s.nextMoveAt) {
        s.slot = s.slot === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
        s.startFx = p.fx ?? 0;
        s.targetFx = s.slot * step;
        s.moveStartAt = now;
        s.moveDurationMs = 850 + Math.random() * 250;
      }
      if (s.moveStartAt > 0) {
        const t = Math.min(1, Math.max(0, (now - s.moveStartAt) / s.moveDurationMs));
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const nx = s.startFx + (s.targetFx - s.startFx) * e;
        const dfx = nx - (p.fx ?? 0);
        p.fx = nx;
        moved = true;
        if (dfx !== 0 && st.distanceTo(p) < 0.5) {
          const [cl, cr] = st.charSpan();
          const r = st.propRect(p);
          if (r) {
            const standing = Math.abs(r.top - st.jumpHeight) < 6 && cr > r.left && cl < r.right;
            if (standing && !st.isFalling) this.hop(dfx * st.unit);
            else if (st.jumpHeight < r.top - 2) {
              if (dfx > 0 && r.right > cl && r.left < cl) this.hop(r.right - cl + 2);
              else if (dfx < 0 && r.left < cr && r.right > cr) this.hop(-(cr - r.left + 2));
            }
          }
        }
        if (t >= 1) {
          s.moveStartAt = 0;
          s.nextMoveAt = now + 1200 + Math.random() * 1200;
        }
      }
    }
    if (moved) st.positionProps();
  }

  // ================= 小殭屍 =================
  private updateZombies(now: number, dt: number): void {
    const st = this.st;
    const W = st.width;
    const FEET = 0.88 * st.height;
    const cx = st.charX * W;
    const zombie = this.isZombie();
    for (const z of this.zombies) {
      const sx0 = st.propScreenX({ id: "zombie", x: z.x });
      const far = sx0 < -W || sx0 > 2 * W;
      if (z.isFlung) {
        z.x += (z.flungVx / W) * dt;
        z.yPx -= z.flungVy * dt;
        z.flungVy += 850 * dt;
        if (z.yPx <= 0) {
          z.yPx = 0;
          z.isFlung = false;
          z.flungVx = z.flungVy = 0;
          this.setZ(z, "dizzy");
        }
      } else if (this.hugged === z) {
        z.x = st.worldX;
        z.yPx = st.jumpHeight;
        z.dir = st.dir;
        this.setZ(z, "hug");
      } else if (now < z.fleeingUntil) {
        z.hopPhase += dt * 8.5;
        z.yPx = Math.max(0, Math.sin(z.hopPhase) * 14);
        this.setZ(z, "wave");
        z.x = Math.max(z.base + 0.1, Math.min(z.base + 5.8, z.x + z.dir * z.speed * 2.8 * dt));
        const sx = st.propScreenX({ id: "zombie", x: z.x });
        if (Math.abs(sx - cx) > 10) z.dir = sx >= cx ? 1 : -1;
      } else if (now < z.hugCooldownUntil) {
        z.yPx = 0;
        this.setZ(z, "dizzy");
      } else if (!far) {
        z.hopPhase += dt * 3.8;
        const s = Math.sin(z.hopPhase);
        if (s > 0) {
          z.yPx = s * 10;
          this.setZ(z, "hop");
          z.x += z.dir * z.speed * dt;
        } else {
          z.yPx = 0;
          this.setZ(z, "idle");
        }
        if (z.x > z.patrolMax) z.dir = -1;
        else if (z.x < z.patrolMin) z.dir = 1;
        const d = Math.abs(st.propScreenX({ id: "zombie", x: z.x }) - cx);
        if (zombie) {
          if (d < 45) this.talk(z.el, d / W);
        } else if (d < 28 && st.jumpHeight < 30 && !this.trappedChest && !this.hugged && !this.target) {
          this.hugged = z;
          this.setZ(z, "hug");
          playBlip("pop");
          this.trap("zombie", now);
        }
      }
      const sx = this.hugged === z ? cx + (st.dir === 1 ? 6 : -6) : st.propScreenX({ id: "zombie", x: z.x });
      z.el.style.display = sx < -W || sx > 2 * W ? "none" : "";
      z.el.style.transform = `translate(${(sx - 28).toFixed(1)}px, ${(FEET - z.yPx - 72).toFixed(1)}px) scaleX(${z.dir < 0 ? -1 : 1})`;
    }
  }

  // ================= 每幀 =================
  tick(): void {
    const st = this.st;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastT) / 1000));
    this.lastT = now;
    const zombie = this.isZombie();
    st.allowRun = !zombie;
    if (zombie && !this.wasZombie) {
      this.releaseByTalisman();
    }
    this.wasZombie = zombie;
    if (zombie && (this.target || this.trappedChest || this.trappedHand || this.hugged)) this.releaseByTalisman();
    this.updateWander(now);
    this.updateZombies(now, dt);
    this.placeBubble();
    this.updatePortal(now);
    if (now - this.enteredAt >= SWARM_AFTER_MS && (this.lastSwarmAt === 0 || now - this.lastSwarmAt >= SWARM_EVERY_MS)) {
      this.lastSwarmAt = now;
      this.swarm();
    }
    // 掙脫進度：0.75 秒沒按就慢慢退
    if (this.target) {
      if (this.lastTapAt > 0 && now - this.lastTapAt > 750) this.progress = Math.max(0, this.progress - dt * 650);
      this.updateHud();
    }
    // 被寶箱咬住：角色慢慢吸到寶箱上
    if (this.trappedChest) {
      const diff = st.propScreenX(this.trappedChest) - st.width * st.charX;
      if (Math.abs(diff) > 1.5) this.hop(diff * 0.15);
    }
    // 被巨手抓住：巨手跟角色在同一個位置
    if (this.trappedHand) {
      this.trappedHand.x = st.worldX;
      st.positionProps();
    }
    for (const p of this.h.props()) {
      if (p.kind !== "chest" && p.kind !== "giantHand") continue;
      const dist = st.distanceTo(p);
      if (dist > 1.2) continue;
      if (p.kind === "chest") {
        if (zombie) {
          if (dist < 0.1) this.talk(p.el, dist);
        } else if (p.state === "closed" && dist < 0.12 && st.jumpHeight < 65 && now > this.chestCooldownUntil && !this.trappedChest && !this.hugged && !this.target) {
          this.trappedChest = p;
          st.setPropState(p, "bite");
          playBlip("trip");
          this.trap("chest", now);
        }
      } else if (!zombie && p.state === "hidden" && dist < 0.055 && st.jumpHeight < 25 && (!p.cooldownUntil || now > p.cooldownUntil) && !this.target) {
        p.x = st.worldX;
        st.positionProps();
        this.trappedHand = p;
        st.setPropState(p, "grab");
        if (p.el) {
          p.el.classList.remove("studio-hand-retreat", "studio-hand-erupt");
          void p.el.offsetWidth;
          p.el.classList.add("studio-hand-erupt");
        }
        playBlip("trip");
        this.h.float("地底冒出巨手！", 0.35, "lilac");
        this.trap("hand", now);
      }
    }
  }

  /** 除錯 */
  get debug(): { target: string | null; zombies: number; phase: string } {
    return { target: this.target, zombies: this.zombies.length, phase: this.phase };
  }
}

/** 魔拐杖：煙火光環、閃光碎片、四射流星（座標＝舞台 HUD 內 px） */
export function magicCaneFx(hud: HTMLElement, cx: number, cy: number): void {
  if (prefersReducedMotion()) return;
  const box = document.createElement("div");
  box.className = "studio-fx-container";
  for (const [size, color, delay] of [
    [64, "", 0],
    [96, "var(--g-lilac)", 0.15],
  ] as const) {
    const ring = document.createElement("div");
    ring.className = "magic-ring";
    Object.assign(ring.style, { left: `${cx}px`, top: `${cy - 16}px`, width: `${size}px`, height: `${size}px`, animationDelay: `${delay}s` });
    if (color) ring.style.borderColor = color;
    box.appendChild(ring);
  }
  const colors = ["var(--g-sun)", "var(--g-lilac)", "var(--g-rose)", "var(--g-sky)", "var(--g-mint)"];
  for (let i = 0; i < 22; i++) {
    const s = document.createElement("div");
    s.className = "magic-shard";
    const c = colors[i % colors.length];
    s.innerHTML = i % 2 === 0 ? `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" fill="${c}"/></svg>` : `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 0 L16 8 L8 16 L0 8 Z" fill="${c}"/></svg>`;
    const a = (i / 22) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
    const d = 90 + Math.random() * 135;
    s.style.left = `${cx - 10}px`;
    s.style.top = `${cy - 10}px`;
    s.style.setProperty("--tx", `${Math.round(Math.cos(a) * d)}px`);
    s.style.setProperty("--ty", `${Math.round(Math.sin(a) * d)}px`);
    s.style.setProperty("--trot", `${Math.round((Math.random() - 0.5) * 360)}deg`);
    s.style.animationDelay = `${(Math.random() * 0.16).toFixed(2)}s`;
    s.style.animationDuration = `${(1.1 + Math.random() * 0.35).toFixed(2)}s`;
    box.appendChild(s);
  }
  const mc = ["var(--g-sun)", "var(--g-lilac)", "var(--g-sky)", "var(--g-mint)", "var(--g-rose)", "var(--g-peach)", "var(--g-sun)", "var(--g-lilac)"];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 2 * Math.PI;
    const d = 180 + Math.random() * 95;
    const c = mc[i];
    const m = document.createElement("div");
    m.className = "magic-meteor";
    m.style.left = `${cx - 30}px`;
    m.style.top = `${cy - 10}px`;
    m.style.setProperty("--tx", `${Math.round(Math.cos(a) * d)}px`);
    m.style.setProperty("--ty", `${Math.round(Math.sin(a) * d)}px`);
    m.style.setProperty("--rot", `${Math.round((a * 180) / Math.PI)}deg`);
    m.style.animationDelay = `${(i * 0.035).toFixed(2)}s`;
    m.innerHTML = `<svg width="60" height="20" viewBox="0 0 60 20" overflow="visible"><path d="M 0 10 Q 25 10 46 10" stroke="${c}" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/><path d="M 12 10 Q 30 10 46 10" stroke="var(--g-surface-raised)" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/><circle cx="46" cy="10" r="6" fill="${c}" opacity="0.4"/><circle cx="46" cy="10" r="3.5" fill="var(--g-surface-raised)"/><path d="M 46 3 Q 46 10 53 10 Q 46 10 46 17 Q 46 10 39 10 Q 46 10 46 3 Z" fill="${c}"/></svg>`;
    box.appendChild(m);
  }
  hud.appendChild(box);
  window.setTimeout(() => box.remove(), 1900);
}

/** 南瓜糖果桶：從角色上方畫面外降下糖果雨 */
export function candyRainFx(hud: HTMLElement, cx: number, groundY: number): void {
  if (prefersReducedMotion()) return;
  const box = document.createElement("div");
  box.className = "studio-fx-container";
  const cs = ["var(--g-peach)", "var(--g-sun)", "var(--g-leaf)", "var(--g-rose)", "var(--g-sky)", "var(--g-lilac)"];
  for (let i = 0; i < 26; i++) {
    const d = document.createElement("div");
    d.className = "candy-drop";
    const c1 = cs[i % cs.length];
    const c2 = cs[(i + 2) % cs.length];
    const k = i % 3;
    d.innerHTML =
      k === 0
        ? `<svg width="26" height="18" viewBox="0 0 24 16"><path d="M7 3 Q12 0 17 3 L17 13 Q12 16 7 13 Z" fill="${c1}"/><polygon points="7,8 2,2 2,14" fill="${c2}"/><polygon points="17,8 22,2 22,14" fill="${c2}"/><circle cx="12" cy="8" r="2.2" fill="var(--g-surface-raised)" opacity="0.85"/></svg>`
        : k === 1
          ? `<svg width="18" height="26" viewBox="0 0 16 24"><circle cx="8" cy="8" r="7" fill="${c1}"/><circle cx="8" cy="8" r="4" fill="var(--g-surface-raised)" opacity="0.65"/><rect x="7" y="15" width="2" height="9" rx="1" fill="var(--g-surface-raised)"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 18 18"><ellipse cx="9" cy="9" rx="8" ry="6.2" fill="${c1}"/><ellipse cx="7.5" cy="7.2" rx="3.2" ry="1.6" fill="var(--g-surface-raised)" opacity="0.75"/></svg>`;
    const sy = Math.round(-40 - Math.random() * 90);
    d.style.left = `${Math.round(cx - 120 + Math.random() * 240)}px`;
    d.style.top = `${sy}px`;
    d.style.setProperty("--tx", `${Math.round((Math.random() - 0.5) * 70)}px`);
    d.style.setProperty("--ty", `${Math.round(groundY - sy + (Math.random() * 16 - 8))}px`);
    d.style.setProperty("--trot", `${Math.round((Math.random() - 0.5) * 220)}deg`);
    d.style.animationDelay = `${(Math.random() * 0.55).toFixed(2)}s`;
    d.style.animationDuration = `${(1.5 + Math.random() * 0.45).toFixed(2)}s`;
    box.appendChild(d);
  }
  hud.appendChild(box);
  window.setTimeout(() => box.remove(), 2600);
}
