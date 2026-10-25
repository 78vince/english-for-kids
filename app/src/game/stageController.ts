// StageController：所有遊戲關卡共用的舞台（圖層、視差、日夜、角色、跳躍物理、互動道具）。
// 行為與參數完全照 assets/game-tokens/preview.src.html（「角色 × 場景」的 loop／desired／press）：
// - 走 .38 W/s、按住 B 奔跑 .85 W/s；在地面蹲下（↓）不能前進；
// - A 起跳：初速 max(520, 1.55H)、重力 max(1500, 4.6H)（跳高約舞台高 26%）；空中可水平移動，
//   空中速度由「起跳當下是否按著 B」決定（跑跳較遠）；
// - 落地：正在移動就直接接走／跑，否則播 land 240ms；
// - 動作優先序：一次性動作 > 空中（jump/fall）> 蹲下 > 走／跑 > 待機（或表演動作）。
// 圖層：依場景 layers 建立，每層日／夜兩疊（夜層透明度＝skyAt().night），層寬 200%、水平平鋪，視差＝parallax。
// 太陽月亮是獨立物件（依 skyAt 的 x/y/size 定位；太陽顏色設 --sunc）；celestial.hidden 的場景（攝影棚）不顯示。
// 角色腳底在舞台高 0.88、角色高約 0.34H（可設定）；夜晚套 world.light.night.filter；舞台高度改變時重算。
// prefers-reduced-motion：停用視差（背景各層跟地面一起移動）、雲飄移與螢火蟲動畫。

import {
  GameArt,
  GameTokens,
  nightFilterCss,
  prefersReducedMotion,
  type Facing,
  type Look,
  type PoseController,
  type SceneInfo,
  type SkyState,
  type SpacePhysics,
  type View,
  type WaterPhysics,
} from "./gameKit";
import type { PadKey, VirtualPad } from "./virtualPad";

export type TimeMode = { kind: "fixed"; u: number } | { kind: "play" } | { kind: "system" };

export interface StageProp {
  id: string;
  /** 世界座標（單位＝舞台寬），會隨地面捲動、以 PROP_PERIOD 為週期平鋪 */
  x: number;
  state?: string;
  /** 高度占舞台高比例 */
  h?: number;
  /** 尺寸縮放倍率（預設 1；例如咬人的巨型寶箱 scale: 2） */
  scale?: number;
  /** 隨機左右移動（例如墓園大型墓碑） */
  wander?: boolean;
  /** 底部位置（占舞台高，預設＝腳底線 0.88）；可放在空中（例如禮物方塊） */
  y?: number;
  /** 底部離地高度（角色設計單位；疊方塊用）。有設定時優先於 y */
  lift?: number;
  /** 橫向拉伸寬度（設計單位；windZone／mud 等區域）。道具 svg 以 preserveAspectRatio="none" 水平縮放 */
  wUnits?: number;
  /** 關卡自用旗標（例如賽跑：已觸發、已撿） */
  used?: boolean;
  /** hazard 事件模式：目前是否還重疊（離開後才會再觸發） */
  inside?: boolean;
  front?: boolean;
  el?: HTMLDivElement;
  /** 絆倒冷卻（performance.now 毫秒）：爬起後 600ms 內不再被同一顆石頭絆倒 */
  tripCooldownUntil?: number;
  /** 黑洞（宇宙空間）：傳送出口；沒設定就找場上最近的另一個黑洞 */
  link?: StageProp;
  /** 宇宙空間：漂浮的小行星（會上下浮動、可以推、站在上面會跟著漂） */
  floating?: boolean;
  /** 漂浮位移（設計單位；fy 往上為正）、速度（單位／秒）、目前浮動量、浮動相位 */
  fx?: number;
  fy?: number;
  fvx?: number;
  fvy?: number;
  bob?: number;
  phase?: number;
}

/** 飛行物的道具 id（爬樹已經有一個 meteor＝流星，太空隕石用 spaceMeteor） */
const FLYER_PROP = { ufo: "ufo", meteor: "spaceMeteor" } as const;

/** 宇宙空間的飛行物（飛碟、隕石）：wx＝畫面 x＋offset（跟著鏡頭捲動），y＝中心的畫面 y */
interface Flyer {
  kind: "ufo" | "meteor";
  wx: number;
  baseY: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  el: HTMLDivElement;
  hit: boolean;
  age: number;
  rot: number;
  vr: number;
  dead: boolean;
}

/** 道具在舞台上的矩形：left/right＝畫面 x（px）、bottom/top＝離地高度（px，往上為正） */
export interface PropRect {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

interface Collider extends PropRect {
  p: StageProp;
  /** solid／hazard 參與物理；pickup／zone／spring 只給關卡判定用（StageController 不處理） */
  kind: "solid" | "hazard" | "pickup" | "zone" | "spring" | "blackhole";
}
export type StageCollider = Collider;

/** 角色碰撞盒（角色設計單位：角色高 170）：寬 36、高 120，腳底往上、水平置中 */
const CHAR_BOX_W = 36;
const CHAR_BOX_H = 120;
/** 蹲下（蹲滑）時頭頂高度：低於樹枝／蜂窩的 elev 118 */
const CROUCH_BOX_H = 110;
/** 小台階：腳底只低於上緣 < 6 單位時自動踏上去 */
const STEP_UP = 6;
/** 圓石：腳底低於上緣 4 單位以上才算撞到（絆倒） */
const TRIP_MARGIN = 4;
const TRIP_COOLDOWN = 600;
/** 「全身都看得到時」角色 svg 的寬（設計單位） */
const CHAR_W = 120;
const WALK = 0.38;
const RUN = 0.85;
const FEET_Y = 0.88;
/** 道具世界的週期（舞台寬的倍數）；走過一圈會再遇到同一批道具 */
export const PROP_PERIOD = 3;

// 前景（near 地面前緣的草叢、canopy 樹冠）永遠在最上層，蓋在角色與道具前面
const Z: Record<string, number> = { sky: 1, stars: 2, cel: 3, clouds: 4, far: 5, mid: 6, ground: 7, props: 8, me: 8, near: 9, canopy: 10 };

export interface StageOptions {
  sceneId: string;
  look: Look;
  view?: View;
  /** 角色高占舞台高比例（預設 .34） */
  charH?: number;
  /** 編輯時預設正面、開始移動自動轉側面 */
  autoSideOnMove?: boolean;
}

export class StageController {
  readonly el: HTMLDivElement;
  /** HUD 容器：z-index 高於前景（canopy） */
  readonly hud: HTMLDivElement;
  sceneId: string;
  look: Look;
  view: View;
  dir: 1 | -1 = 1;
  /** 背景位移（px，＝角色在世界中走過的距離） */
  offset = 0;
  u = 0.25;
  timeMode: TimeMode = { kind: "fixed", u: 0.25 };
  charH: number;
  autoSideOnMove: boolean;
  /** 表演動作（動作分頁）：沒按鍵時用這個取代 idle */
  idlePose = "idle";
  props: StageProp[] = [];
  /** 道具世界的週期（舞台寬的倍數） */
  propPeriod = PROP_PERIOD;
  /** 角色在畫面上的水平位置（舞台寬比例；預設置中，賽跑放 0.3 看得到前方） */
  charX = 0.5;
  /** 自動前進（賽跑）：回傳目前速度 px/s；設定後左右鍵無效、不能倒退，蹲下也照常前進 */
  autoRun: (() => number) | null = null;
  /** 跳躍參數（設計單位）：設定後依「高度＋滯空時間」換算初速與重力；沒設定照預覽頁 max(520,1.55H) */
  jumpSpec: { heightUnits: number; airMs: number } | null = null;
  /** hazard 處理：trip＝播完整絆倒序列（工作室）；event＝只呼叫 onHazard，由關卡決定效果（賽跑短絆） */
  hazardMode: "trip" | "event" = "trip";
  /** 可以蹲下（↓）；賽跑關掉（↓ 完全不作用） */
  allowCrouch = true;
  /** 可以跳躍（A 鍵）；被寶箱咬住時關掉 */
  allowJump = true;

  /** 跳躍／落地／每幀／道具靠近等事件（給關卡邏輯用） */
  onJump: () => void = () => {};
  onLand: () => void = () => {};
  onMove: () => void = () => {};
  onTick: (dt: number) => void = () => {};
  onSkyChange: (k: SkyState) => void = () => {};
  /** 視角改變（視角鈕、移動自動轉側面） */
  onViewChange: (v: View) => void = () => {};
  /** 從下方頂到 solid 道具（例如禮物方塊） */
  onHeadBump: (p: StageProp) => void = () => {};
  /** 撞到 hazard（圓石）跌倒 */
  onTrip: (p: StageProp) => void = () => {};
  /** hazardMode='event'：碰到 hazard（每次接觸一次） */
  onHazard: (p: StageProp) => void = () => {};
  /** 被 solid 側面擋住（每次接觸一次） */
  onBlocked: (p: StageProp) => void = () => {};
  /** 起跳高度倍率（關卡可覆寫，例如蹲下蓄力 2 倍）；高度 h＝v²/2g，所以初速乘 √倍率 */
  jumpMultiplier: () => number = () => 1;

  private pad: VirtualPad;
  private info: SceneInfo;
  private layers: Record<string, { day?: HTMLDivElement; night?: HTMLDivElement }> = {};
  private cel: Record<string, HTMLDivElement> = {};
  private propLayer: HTMLDivElement;
  private propFrontLayer: HTMLDivElement;
  private me: HTMLDivElement;
  private shadow: HTMLDivElement;
  private ctl: PoseController | null = null;
  private cur = "idle";
  private oneShot: string | null = null;
  private oneShotTimer = 0;
  private air = false;
  private vy = 0;
  private jy = 0;
  readonly world: HTMLDivElement;
  private zoomScale = 1;
  /** 目前場景的漂浮物理（海底世界）；null＝一般地面物理 */
  private water: WaterPhysics | null = null;
  private lastStrokeAt = 0;
  /** 在水裡划水往上時呼叫（工作室接上冒泡泡） */
  onSwim: () => void = () => {};
  /** 目前場景的無重力物理（宇宙空間）；null＝不是太空 */
  private space: SpacePhysics | null = null;
  /** 太空：水平速度（px/s，往右為正；垂直沿用 vy，往上為負） */
  private svx = 0;
  /** 太空：身體旋轉角度（度，順時針為正）與閒置旋轉速度（度/秒；0＝還沒選方向） */
  private rot = 0;
  private spin = 0;
  private lastDashAt = -1e9;
  /** 太空：目前被黑洞吸住的程度（0~1，畫面效果用） */
  private pullK = 0;
  /** 黑洞傳送：in＝縮小旋轉進入 from，out＝從 to 轉出來 */
  private warp: {
    phase: "in" | "out";
    start: number;
    from: StageProp;
    to: StageProp;
    o0: number;
    j0: number;
    o1: number;
    j1: number;
    dir: [number, number];
  } | null = null;
  private warpScale = 1;
  /** 剛出來的黑洞：離開它的吸力範圍前不會再被它吸住 */
  private immune: StageProp | null = null;
  /** 太空：A 衝刺時呼叫（工作室接上噴氣效果） */
  onDash: (dx: number, dy: number) => void = () => {};
  /** 腳下的小行星（漂浮時角色跟著移動） */
  private standOn: StageProp | null = null;
  /** 被飛碟／隕石撞到：這個時間（performance.now）之前不能操作 */
  private stunUntil = 0;
  /** 被隕石撞飛時的翻滾速度（度／秒，會慢慢變小） */
  private tumble = 0;
  private flyers: Flyer[] = [];
  private nextFlyerAt = 0;
  private flyLayer: HTMLDivElement;
  /** 飛碟／隕石碰到角色 */
  onFlyerHit: (kind: "ufo" | "meteor") => void = () => {};
  /** 黑洞傳送：in＝開始被吸進去、out＝開始從另一個黑洞出來 */
  onWarp: (phase: "in" | "out", from: StageProp, to: StageProp) => void = () => {};
  /** 行走速度倍率回呼（例如順風加速、逆風減速）：傳入移動方向 mv（-1 為往左、1 為往右），回傳倍率 */
  speedMult: ((mv: number) => number) | null = null;
  private runJump = false;
  private last = 0;
  private drift = 0;
  private lastH = 0;
  private raf = 0;
  private frozen = false;
  private reduced = prefersReducedMotion();
  private sky: SkyState | null = null;
  private unsubPad: () => void;
  private resizeObs: ResizeObserver | null = null;
  private seqName: string | null = null;
  private seqStart = 0;
  private seqStep = -1;
  private seqView: View = "front";
  private seqFacing: Facing = "right";
  /** 序列沿用目前的視角／面向（絆倒） */
  private seqKeepView = false;
  /** 絆倒中：輸入全部忽略；先往面向方向滑出一小段 */
  private trip: { start: number; end: number; slide: number; slid: number; dir: 1 | -1; p: StageProp } | null = null;
  /** 蓄力光暈（角色重畫後要重新套用） */
  private charge = { on: false, full: false };
  private seatEl: HTMLDivElement;
  private seatPose: string | null = null;
  /** 腳下支撐面的離地高度（px）：地面＝0，站在方塊上＝方塊上緣 */
  private supportY = 0;
  /** 額外前進（彈簧跳過一段賽道）：剩餘 px 與速度 px/s */
  private dash = { left: 0, speed: 0 };
  private blockedBy: StageProp | null = null;

  constructor(host: HTMLElement, pad: VirtualPad, o: StageOptions) {
    this.pad = pad;
    this.sceneId = GameArt.sceneInfo[o.sceneId] ? o.sceneId : GameArt.scenes[0];
    this.info = GameArt.sceneInfo[this.sceneId];
    this.applyPhysics();
    this.look = o.look;
    this.view = o.view ?? "side";
    this.charH = o.charH ?? 0.34;
    this.autoSideOnMove = o.autoSideOnMove ?? false;

    this.el = document.createElement("div");
    this.el.className = "gstage";
    this.hud = document.createElement("div");
    this.hud.className = "gstage-hud";
    this.propLayer = document.createElement("div");
    this.propLayer.className = "gstage-props";
    this.propFrontLayer = document.createElement("div");
    this.propFrontLayer.className = "gstage-props gstage-props--front";
    this.shadow = document.createElement("div");
    this.shadow.className = "gstage-shadow";
    this.me = document.createElement("div");
    this.me.className = "gstage-me";
    this.seatEl = document.createElement("div");
    this.seatEl.className = "gstage-seat";
    this.seatEl.style.display = "none";
    // 場景圖層、道具、角色都放在 world 裡，鏡頭縮放（setZoom）只縮放 world，HUD 不受影響
    this.world = document.createElement("div");
    this.world.className = "gstage-world";
    this.flyLayer = document.createElement("div");
    this.flyLayer.className = "gstage-props gstage-flyers";
    this.world.append(this.propLayer, this.shadow, this.seatEl, this.me, this.propFrontLayer, this.flyLayer);
    if (this.space) this.me.style.transformOrigin = "50% 53%";
    this.el.append(this.world, this.hud);
    host.appendChild(this.el);

    this.unsubPad = pad.on((k, v) => this.press(k, v));
    this.buildWorld();
    this.drawChar();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObs = new ResizeObserver(() => this.layout());
      this.resizeObs.observe(this.el);
    }
    this.raf = requestAnimationFrame((ts) => this.loop(ts));
  }

  get width(): number {
    return this.el.clientWidth || 1;
  }

  /** 鏡頭縮放倍率（1＝原本）。只影響畫面，不影響物理、碰撞與拍照匯出（exportState 不含縮放）。 */
  get zoom(): number {
    return this.zoomScale;
  }

  /** 鏡頭以角色腳底為中心縮放（角色工作室換裝時拉近用）；切換時有 350ms 過渡（prefers-reduced-motion 時直接切換）。 */
  setZoom(scale: number): void {
    const s = Math.max(1, Math.min(2, scale));
    if (s === this.zoomScale) return;
    this.zoomScale = s;
    // 以腳底為中心；飄在高處（太空、海底）時往上移，讓放大後頭頂不超出舞台上緣
    const feet = FEET_Y - this.jy / this.height;
    const head = feet - this.charH;
    let o = feet;
    if (s > 1 && o + s * (head - o) < 0.02) o = (s * head - 0.02) / (s - 1);
    const oy = Math.max(0.02, Math.min(0.95, o));
    this.world.style.transformOrigin = `${(this.charX * 100).toFixed(2)}% ${(oy * 100).toFixed(2)}%`;
    this.world.style.transform = s === 1 ? "" : `scale(${s})`;
  }
  get height(): number {
    return this.el.clientHeight || 1;
  }
  get currentPose(): string {
    return this.cur;
  }
  get isAirborne(): boolean {
    return this.air;
  }
  get sceneInfo(): SceneInfo {
    return this.info;
  }
  get skyState(): SkyState {
    return this.sky ?? GameArt.skyAt(this.sceneId, this.u);
  }

  // ---- 場景 ----

  private buildWorld(): void {
    this.el.querySelectorAll(".gstage-lay,.gstage-cel").forEach((e) => e.remove());
    this.layers = {};
    this.cel = {};
    const id = this.sceneId;
    const Ld = GameArt.sceneLayers(id, "day", 960, 540);
    const Ln = GameArt.sceneLayers(id, "night", 960, 540);
    const mk = (n: string, html: string, night: boolean) => {
      const d = document.createElement("div");
      d.className = "gstage-lay" + (n === "sky" || n === "stars" ? " gstage-lay--fixed" : "");
      d.dataset.layer = n;
      d.style.zIndex = String(Z[n] ?? 6);
      d.innerHTML = html;
      if (night) d.style.opacity = "0";
      this.world.insertBefore(d, this.propLayer);
      return d;
    };
    for (const n of this.info.layers) {
      if (n === "sky") this.layers.sky = { day: mk(n, "", false) };
      else if (n === "stars") this.layers.stars = { night: mk(n, Ln.stars ?? "", true) };
      else {
        const day = Ld[n] ?? "";
        const night = Ln[n] ?? "";
        this.layers[n] = { day: mk(n, day + day, false), night: night ? mk(n, night + night, true) : undefined };
      }
    }
    if (!this.info.celestial?.hidden) {
      for (const o of ["sun", "moon"]) {
        const d = document.createElement("div");
        d.className = "gstage-cel";
        d.style.zIndex = String(Z.cel);
        const st = o === "moon" && this.sceneId === "graveyard" ? "skull" : "round";
        d.innerHTML = GameArt.prop(o, { state: st });
        this.world.insertBefore(d, this.propLayer);
        this.cel[o] = d;
      }
    }
    if (this.reduced) this.el.classList.add("gstage--reduced");
    this.lastH = 0;
    this.layout();
  }

  /** 切換場景：淡出 → 換圖層 → 淡入（300ms），角色維持在地面線 */
  setScene(id: string, fade = true): Promise<void> {
    if (!GameArt.sceneInfo[id]) return Promise.resolve();
    const apply = () => {
      this.sceneId = id;
      this.info = GameArt.sceneInfo[id];
      this.applyPhysics();
      this.buildWorld();
      this.renderProps();
    };
    if (!fade || this.reduced) {
      apply();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.el.classList.add("gstage--fading");
      setTimeout(() => {
        apply();
        requestAnimationFrame(() => {
          this.el.classList.remove("gstage--fading");
          setTimeout(resolve, 150);
        });
      }, 150);
    });
  }

  /** 依場景設定漂浮（海底）或無重力（太空）物理，並重設太空狀態 */
  private applyPhysics(): void {
    const ph = this.info.physics;
    this.water = ph && "water" in ph && ph.water ? ph : null;
    this.space = ph && "space" in ph && ph.space ? ph : null;
    this.svx = 0;
    this.rot = 0;
    this.spin = 0;
    this.pullK = 0;
    this.warp = null;
    this.warpScale = 1;
    this.immune = null;
    this.standOn = null;
    this.stunUntil = 0;
    this.tumble = 0;
    if (this.flyLayer) this.clearFlyers();
    if (this.space) {
      this.air = true;
      this.vy = 0;
      this.oneShot = null;
    }
    if (this.me) this.me.style.transformOrigin = this.space ? "50% 53%" : "";
  }

  setTime(mode: TimeMode): void {
    this.timeMode = mode;
    if (mode.kind === "fixed") this.u = ((mode.u % 1) + 1) % 1;
    if (mode.kind === "system") this.u = GameArt.uFromDate();
    this.updateSky();
  }

  private updateSky(): void {
    const K = GameArt.skyAt(this.sceneId, this.u);
    this.sky = K;
    const W = this.width;
    const H = this.height;
    const grad = `linear-gradient(${K.top},${K.bottom})`;
    this.el.style.background = grad;
    if (this.layers.sky?.day) this.layers.sky.day.style.background = grad;
    for (const n of Object.keys(this.layers)) {
      const e = this.layers[n];
      if (e.night) e.night.style.opacity = String(K.night);
    }
    for (const [name, o] of [
      ["sun", K.sun],
      ["moon", K.moon],
    ] as const) {
      const d = this.cel[name];
      if (!d) continue;
      const sz = o.size * H;
      d.style.display = o.visible ? "" : "none";
      d.style.width = d.style.height = `${sz}px`;
      d.style.left = `${o.x * W - sz / 2}px`;
      d.style.top = `${o.y * H - sz / 2}px`;
    }
    if (this.cel.sun && K.sun.color) this.cel.sun.style.setProperty("--sunc", K.sun.color);
    const f = nightFilterCss(K.night);
    this.me.style.filter = f;
    this.propLayer.style.filter = f;
    this.propFrontLayer.style.filter = f;
    this.el.classList.toggle("gstage--night", K.night > 0.5);
    this.onSkyChange(K);
  }

  // ---- 角色 ----

  private layout(): void {
    const H = this.height;
    if (H === this.lastH) return;
    this.lastH = H;
    const ch = H * this.charH;
    this.me.style.width = `${(ch * 120) / 170}px`;
    this.me.style.left = this.shadow.style.left = `${this.charX * 100}%`;
    this.me.style.top = `${H * FEET_Y - (ch * 164) / 170}px`;
    this.shadow.style.width = `${ch * 0.42}px`;
    this.shadow.style.height = `${ch * 0.05}px`;
    this.shadow.style.top = `${H * FEET_Y - ch * 0.025}px`;
    this.renderProps();
    this.updateSky();
  }

  get currentLook(): Look {
    return this.look;
  }

  setLook(look: Look): void {
    this.look = look;
    this.drawChar();
  }

  setView(v: View): void {
    if (this.view === v) return;
    this.view = v;
    this.drawChar();
    this.onViewChange(v);
  }

  /** 角色在畫面上的水平位置（舞台寬比例） */
  setCharX(x: number): void {
    this.charX = x;
    this.lastH = 0;
    this.layout();
  }

  setCharHeight(h: number): void {
    this.charH = h;
    this.lastH = 0;
    this.layout();
  }

  private drawChar(viewOverride?: View, facingOverride?: Facing): void {
    const view = viewOverride ?? this.view;
    this.me.innerHTML = `<div class="gstage-flip">${GameArt.character({ ...this.look, view, facing: facingOverride })}</div>`;
    this.ctl?.stop();
    const svg = this.me.querySelector("svg");
    this.cur = this.desired();
    if (svg) this.ctl = GameArt.animate(svg as SVGElement, this.cur);
    this.flip(view);
    this.applyCharge();
  }

  /** 蓄力光暈：GameArt.setCharge（角色 SVG 內建 .g-glow）；on＝開始蓄力（柔和），full＝可以蓄力跳（更亮） */
  setCharge(on: boolean, full = false): void {
    if (this.charge.on === on && this.charge.full === (on && full)) return;
    this.charge = { on, full: on && full };
    this.applyCharge();
  }

  private applyCharge(): void {
    const svg = this.me.querySelector("svg");
    if (svg) GameArt.setCharge(svg, this.charge.on, this.charge.full);
  }

  /** 設計單位 → px（角色高 170 單位） */
  get unit(): number {
    return (this.height * this.charH) / 170;
  }

  get isTripping(): boolean {
    return this.trip !== null;
  }

  private flip(view: View = this.view): void {
    const f = this.me.querySelector<HTMLElement>(".gstage-flip");
    if (f) f.style.transform = view === "side" && this.dir < 0 ? "scaleX(-1)" : "";
  }

  private desired(): string {
    const d = this.pad.down;
    if (this.oneShot) return this.oneShot;
    if (this.space) {
      if (this.warp) return "surprise";
      if (this.air) {
        const moving = d.left || d.right || d.up || d.down || performance.now() - this.lastDashAt < 400;
        return moving ? "fly" : this.pullK > 0.15 ? "surprise" : this.idlePose;
      }
    }
    if (this.air) return this.water ? (this.vy < 0 ? "jump" : "fly") : this.vy < 0 ? "jump" : "fall";
    if (d.down && this.allowCrouch) return "crouch";
    if (this.autoRun) return this.autoRun() > 0 ? "run" : this.idlePose;
    if (d.left || d.right) return d.b ? "run" : "walk";
    return this.idlePose;
  }

  /** 一次性動作（ms 後回到正常判斷） */
  shot(pose: string, ms: number): void {
    this.oneShot = pose;
    clearTimeout(this.oneShotTimer);
    this.oneShotTimer = window.setTimeout(() => (this.oneShot = null), ms);
  }

  /** 表演（動作分頁）：角色原地做這個動作；再按或開始移動即結束 */
  perform(pose: string | null): void {
    this.stopSequence();
    this.idlePose = pose ?? "idle";
  }

  /** 連播序列（GameArt.sequenceAt 每步重畫）；loop=false 的序列播完停在最後一步 */
  playSequence(name: string | null, keepView = false): void {
    this.idlePose = "idle";
    this.seqKeepView = keepView;
    this.seqName = name;
    this.seqStart = performance.now();
    this.seqStep = -1;
    if (!name) this.drawChar();
  }

  private stopSequence(): void {
    if (this.seqName) {
      this.seqName = null;
      this.seqStep = -1;
      this.drawChar();
    }
  }

  get performing(): boolean {
    return this.seqName !== null || this.idlePose !== "idle";
  }

  /** 拍照時定格目前動作 */
  freeze(on: boolean): void {
    this.frozen = on;
    if (on) this.pad.releaseAll();
  }

  /** 受驚嚇／定身：在 ms 毫秒內無法操作、播放指定姿勢（預設 surprise），並放開所有按鍵 */
  stun(ms: number, pose = "surprise"): void {
    const ts = performance.now();
    this.stunUntil = Math.max(this.stunUntil, ts + ms);
    this.shot(pose, ms);
    this.pad.releaseAll();
  }

  get isStunned(): boolean {
    return performance.now() < this.stunUntil;
  }

  get flyerLayer(): HTMLDivElement {
    return this.flyLayer;
  }

  // ---- 輸入與物理 ----

  private press(k: PadKey, v: boolean): void {
    if (!v) return;
    if (this.frozen || this.trip || performance.now() < this.stunUntil) return; // 絆倒／定身期間按鍵無效（放開事件由 VirtualPad 記錄，不會卡鍵）
    if (this.performing && (k === "left" || k === "right" || k === "a" || k === "down")) {
      this.perform(null);
    }
    if (this.space) {
      this.pressSpace(k);
      return;
    }
    if (k === "a" && this.air && this.water && this.allowJump) this.stroke(performance.now());
    if (k === "a" && !this.air && this.oneShot !== "land" && this.allowJump) {
      this.launch(this.jumpMultiplier());
      this.onJump();
    }
    if (this.autoRun && (k === "left" || k === "right")) return;
    if (k === "left") {
      this.dir = -1;
      this.flip();
    }
    if (k === "right") {
      this.dir = 1;
      this.flip();
    }
    if (this.autoSideOnMove && (k === "left" || k === "right") && this.view !== "side") this.setView("side");
  }

  /** 太空的按鍵：站在小行星上 A／↑ 離開；飄著時 A 往按住的方向衝刺；←→ 轉身 */
  private pressSpace(k: PadKey): void {
    if (this.warp || performance.now() < this.stunUntil) return; // 傳送中、被撞到嚇一跳時不能操作
    if (this.performing && k === "up") this.perform(null);
    const now = performance.now();
    if ((k === "a" || k === "up") && !this.air) {
      this.air = true;
      this.vy = -this.space!.pushOffH * this.height;
      this.oneShot = null;
      this.onJump();
    } else if (k === "a") this.spaceDash(now);
    if (k === "left" || k === "right") {
      this.dir = k === "left" ? -1 : 1;
      this.flip();
      if (this.autoSideOnMove && this.view !== "side") this.setView("side");
    }
  }

  /** 太空衝刺：往按住的方向（沒按就往上）加一段速度 */
  private spaceDash(now: number): void {
    const S = this.space!;
    if (now - this.lastDashAt < S.dashCooldownMs) return;
    const d = this.pad.down;
    let x = (d.left ? -1 : 0) + (d.right ? 1 : 0);
    let y = (d.up ? -1 : 0) + (d.down ? 1 : 0);
    if (!x && !y) y = -1;
    const n = Math.hypot(x, y);
    x /= n;
    y /= n;
    const H = this.height;
    const cap = S.maxSpeedH * S.boostMult * 1.6 * H;
    this.svx += x * S.dashH * H;
    this.vy += y * S.dashH * H;
    const sp = Math.hypot(this.svx, this.vy);
    if (sp > cap) {
      this.svx *= cap / sp;
      this.vy *= cap / sp;
    }
    this.lastDashAt = now;
    this.oneShot = null;
    this.onDash(x, y);
  }

  /** 是否在宇宙空間（無重力） */
  get inSpace(): boolean {
    return this.space !== null;
  }

  /** 太空裡還在移動、被吸或傳送中（工作室換裝近拍用：停下來才拉近） */
  get spaceBusy(): boolean {
    if (!this.space) return false;
    const eps = 0.02 * this.height;
    return this.warp !== null || this.pullK > 0 || performance.now() < this.stunUntil || Math.abs(this.svx) > eps || Math.abs(this.vy) > eps;
  }

  /** 普通跳的初速（px/s，向上為負） */
  private get baseJumpVelocity(): number {
    if (this.jumpSpec) {
      const h = this.jumpSpec.heightUnits * this.unit;
      return (-4 * h) / (this.jumpSpec.airMs / 1000);
    }
    return -Math.max(520, this.height * 1.55);
  }

  /** 起跳／彈起：高度＝普通跳 × mult（初速 × √mult，重力不變）；空中速度由此刻是否按著 B 決定 */
  /** 加強跳（蓄力、彈簧）最高點的上限（離地高度／舞台高）；小螢幕時普通跳本身就比較高，避免頭頂衝出舞台 */
  boostPeakCap = 0.52;

  /** 是否在水裡（海底世界的漂浮機制） */
  get inWater(): boolean {
    return this.water !== null;
  }

  /** 實際重力：水裡乘上 gravityMult（慢慢落下） */
  private get gravity(): number {
    return this.baseGravity * (this.water ? this.water.gravityMult : 1);
  }

  /** 地面上的重力（跳躍高度用這個算，水裡跳一樣高、只是比較慢） */
  private get baseGravity(): number {
    if (this.jumpSpec) {
      const h = this.jumpSpec.heightUnits * this.unit;
      const T = this.jumpSpec.airMs / 1000;
      return (8 * h) / (T * T);
    }
    return Math.max(1500, this.height * 4.6);
  }

  /** 額外往前衝 px（sec 秒內走完；例如彈簧跳過一段賽道） */
  addDash(px: number, sec: number): void {
    this.dash = { left: this.dash.left + px, speed: Math.max(this.dash.speed, px / Math.max(0.05, sec)) };
  }

  /** 短絆（賽跑）：只播絆倒動作的前段 ms，不鎖輸入、不滑出 */
  shortTrip(ms = 380): void {
    this.perform(null);
    this.shot("trip", ms);
  }

  /** 目前是否蹲著（地面上按住 ↓） */
  get isCrouching(): boolean {
    return this.allowCrouch && !this.air && this.pad.down.down;
  }

  /** 起跳：最高點離地＝普通跳 × mult（mult > 1 時不超過 boostPeakCap，也不低於普通跳）；
   * 高度從腳下支撐面算；在空中起跳（彈簧）會扣掉離支撐面的高度，所以連續彈不會越彈越高 */
  private launch(mult: number): void {
    const g = this.gravity;
    const h0 = this.baseJumpVelocity ** 2 / (2 * this.baseGravity);
    let peak = h0 * Math.max(0.1, mult);
    // 加強跳的上限以「離地面」算（站在高台上蓄力也不會衝出舞台），但至少有普通跳的高度
    if (mult > 1) peak = Math.min(peak, Math.max(h0, this.boostPeakCap * this.height - this.supportY));
    // 高度從腳下的支撐面（地面或方塊上緣）算起
    const rise = Math.max(h0 * 0.2, peak - Math.max(0, this.jy - this.supportY));
    this.air = true;
    this.runJump = this.pad.down.b;
    this.vy = -Math.sqrt(2 * g * rise);
    this.oneShot = null;
  }

  /** 水裡划水：往上推一下（有冷卻）；按住 A 時由 physics() 在下落時自動再划 */
  private stroke(now: number): void {
    const w = this.water;
    if (!w || this.frozen || this.trip) return;
    if (now - this.lastStrokeAt < w.strokeCooldownMs) return;
    this.lastStrokeAt = now;
    this.vy = Math.min(this.vy, -w.strokeH * this.height);
    this.oneShot = null;
    this.onSwim();
  }

  /** 水裡最高可以浮到多高（離地 px）：頭頂離舞台上緣至少留 topMarginH */
  private get waterCeiling(): number {
    const w = this.water;
    return w ? Math.max(0, (0.88 - this.charH - w.topMarginH) * this.height) : Infinity;
  }

  /** 彈簧等外力：在空中直接彈起，最高點離地＝普通跳 × mult */
  bounce(mult: number): void {
    if (this.frozen) return;
    this.launch(mult);
  }

  /** 正在下落（空中且往下） */
  get isFalling(): boolean {
    return this.air && this.vy > 0;
  }

  /** 角色 DOM（關卡加蓄力等視覺回饋用） */
  get charEl(): HTMLDivElement {
    return this.me;
  }

  private loop(ts: number): void {
    const dt = Math.min(0.05, (ts - this.last) / 1000 || 0);
    this.last = ts;
    const W = this.width;
    const H = this.height;
    if (!this.frozen) this.physics(dt, ts);
    const sup = this.supportY;
    const spin = this.space ? ` rotate(${this.rot.toFixed(1)}deg) scale(${this.warpScale.toFixed(3)})` : "";
    this.me.style.transform = `translateX(-50%) translateY(${-this.jy}px)${spin}`;
    const hh = Math.min(1, Math.max(0, this.jy - sup) / (H * 0.4));
    this.shadow.style.transform = `translateX(-50%) translateY(${-sup}px) scale(${(1 - 0.4 * hh).toFixed(3)},1)`;
    // 太空：飄著時沒有影子（站在小行星上才有）
    this.shadow.style.opacity = this.space && this.air ? "0" : (1 - 0.45 * hh).toFixed(2);

    const per = W;
    for (const n of this.info.layers) {
      const f0 = this.info.parallax[n];
      const e = this.layers[n];
      if (!f0 || !e) continue;
      const f = this.reduced ? 1 : f0;
      const off = this.offset * f + (n === "clouds" ? this.drift : 0);
      const x = -(((off % per) + per) % per);
      if (e.day) e.day.style.transform = `translateX(${x}px)`;
      if (e.night) e.night.style.transform = `translateX(${x}px)`;
    }
    this.positionProps();

    if (this.timeMode.kind === "system") {
      const nu = GameArt.uFromDate();
      if (Math.abs(nu - this.u) > 0.0003) {
        this.u = nu;
        this.updateSky();
      }
    } else if (this.timeMode.kind === "play" && !this.frozen) {
      this.u = (this.u + (dt * 1000) / (this.info.celestial?.cycleMs || 24000)) % 1;
      this.updateSky();
    }
    if (H !== this.lastH) this.layout();

    if (this.seqName && !this.frozen) {
      const q = GameArt.sequenceAt(this.seqName, ts - this.seqStart);
      if (q && q.step !== this.seqStep) {
        this.seqStep = q.step;
        this.seqView = this.seqKeepView ? this.view : q.view;
        this.seqFacing = this.seqKeepView ? (this.dir < 0 ? "left" : "right") : q.facing;
        // 沿用目前視角時，側面用 .gstage-flip 鏡像（跟平常一樣），不另外傳 facing
        this.me.innerHTML = `<div class="gstage-flip">${GameArt.character({
          ...this.look,
          view: this.seqView,
          facing: this.seqKeepView ? undefined : q.facing,
        })}</div>`;
        this.ctl?.stop();
        const svg = this.me.querySelector("svg");
        this.cur = q.pose;
        if (svg) this.ctl = GameArt.animate(svg as SVGElement, q.pose);
        if (this.seqKeepView) this.flip(this.seqView);
        this.applyCharge();
      }
    } else if (!this.frozen) {
      const want = this.desired();
      if (want !== this.cur && this.ctl) {
        this.cur = want;
        this.ctl.setPose(want);
      }
    }
    this.updateSeat();
    this.onTick(dt);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  // ---- 碰撞（solid：可站上、側面擋住、從下方頂到彈回；hazard：從側面撞到會跌倒，從上方落下可以站上去） ----

  /** 所有有 collider 的道具在畫面上的碰撞盒（px；離地高度往上為正） */
  colliders(): Collider[] {
    const out: Collider[] = [];
    for (const p of this.props) {
      const def = GameArt.props.find((d) => d.id === p.id) as { size: [number, number]; collider?: { kind: string; box: number[] } } | undefined;
      const c = def?.collider;
      if (!c || !["solid", "hazard", "pickup", "zone", "spring", "blackhole"].includes(c.kind)) continue;
      const r = this.propRect(p);
      if (!r) continue;
      const ky = (r.top - r.bottom) / def!.size[1];
      const kx = (r.right - r.left) / def!.size[0];
      const [bx, by, bw, bh] = c.box;
      out.push({
        p,
        kind: c.kind as Collider["kind"],
        left: r.left + bx * kx,
        right: r.left + (bx + bw) * kx,
        top: r.bottom + (def!.size[1] - by) * ky,
        bottom: r.bottom + (def!.size[1] - by - bh) * ky,
      });
    }
    return out;
  }

  /** 角色碰撞盒（畫面 px 左右、離地高度上下；蹲下時頭頂較低） */
  charBox(): PropRect {
    const [l, r] = this.charSpan();
    return { left: l, right: r, bottom: this.jy, top: this.jy + (this.isCrouching ? CROUCH_BOX_H : CHAR_BOX_H) * this.unit };
  }

  /** 角色碰撞盒左右（畫面 px） */
  charSpan(): [number, number] {
    const half = (CHAR_BOX_W * this.unit) / 2;
    const cx = this.width * this.charX;
    return [cx - half, cx + half];
  }

  /** 腳下支撐面：水平重疊、且上緣不高於 feet（＋容差）的碰撞物裡最高的；沒有就是地面 0 */
  private supportAt(feet: number, cols: Collider[], tol: number): number {
    const [l, r] = this.charSpan();
    let s = 0;
    for (const c of cols) {
      // 圓石可以站上去；掛在高處的 hazard（樹枝、蜂窩）不能
      if (c.kind !== "solid" && !(c.kind === "hazard" && c.bottom < 1)) continue;
      if (c.right <= l || c.left >= r) continue;
      if (c.top <= feet + tol && c.top > s) s = c.top;
    }
    return s;
  }

  private physics(dt: number, ts: number): void {
    if (this.space) {
      this.spacePhysics(dt, ts);
      return;
    }
    const d = this.pad.down;
    const W = this.width;
    const u = this.unit;
    const boxH = this.isCrouching ? CROUCH_BOX_H : CHAR_BOX_H;
    const charTop = (jy: number) => jy + boxH * u;
    let cols = this.colliders();

    // 1) 水平移動（絆倒中：只往面向方向滑出）
    let dx = 0;
    if (this.trip) {
      const left = this.trip.slide - this.trip.slid;
      if (left > 0) {
        const spd = this.trip.slide / 0.38; // 絆倒 380ms 內滑完
        dx = this.trip.dir * Math.min(left, spd * dt);
        this.trip.slid += Math.abs(dx);
      }
    } else if (this.autoRun) {
      // 賽跑：自動前進（蹲滑也照常前進），再加上彈簧的額外衝刺
      dx = Math.max(0, this.autoRun()) * dt;
      if (this.dash.left > 0) {
        const step = Math.min(this.dash.left, this.dash.speed * dt);
        this.dash.left -= step;
        dx += step;
      }
    } else {
      const stunned = ts < this.stunUntil;
      const mv = stunned ? 0 : (d.left ? -1 : 0) + (d.right ? 1 : 0);
      // 蹲下時（在地面）不能前進；空中速度由起跳當下是否按著 B 決定
      if (mv && (this.air || !this.isCrouching)) {
        const sm = this.speedMult ? this.speedMult(mv) : 1;
        const spd = W * (this.air ? (this.runJump ? RUN : WALK) : d.b ? RUN : WALK) * (this.water ? this.water.walkMult : 1) * sm;
        dx = mv * spd * dt;
      }
    }
    if (dx) {
      const [l, r] = this.charSpan();
      const want = dx;
      let blocker: StageProp | null = null;
      for (const c of cols) {
        if (c.kind !== "solid") continue;
        // 只擋「身體高度範圍內、而且不是小台階」的側面
        // 空中不給台階容差（否則腳底稍低於上緣時會斜斜穿進方塊裡）
        const tol = this.air ? 0.5 : STEP_UP * u;
        if (c.bottom >= charTop(this.jy) || c.top - this.jy < tol) continue;
        const before = dx;
        if (dx > 0 && c.left >= r - 0.5) dx = Math.min(dx, Math.max(0, c.left - r));
        if (dx < 0 && c.right <= l + 0.5) dx = Math.max(dx, Math.min(0, c.right - l));
        if (dx !== before) blocker = c.p;
      }
      if (blocker && Math.abs(dx) < Math.abs(want) * 0.5) {
        if (this.blockedBy !== blocker) {
          this.blockedBy = blocker;
          this.onBlocked(blocker);
        }
        this.dash.left = 0; // 被擋住時彈簧衝刺作廢
      } else if (!blocker) this.blockedBy = null;
      if (dx) {
        this.offset += dx;
        this.onMove();
        cols = this.colliders();
      }
    }
    const [l, r] = this.charSpan();
    const overlapX = (c: Collider) => c.right > l && c.left < r;

    // 2) 小台階自動踏上
    if (!this.air) {
      for (const c of cols) {
        if (c.kind === "solid" && overlapX(c) && c.top > this.jy && c.top - this.jy < STEP_UP * u) this.jy = c.top;
      }
    }

    // 3) hazard：腳底低於上緣 4 單位以上、且頭頂高於底緣（樹枝／蜂窩掛在高處：站著或跳起來碰到，蹲滑過得去）
    if (this.hazardMode === "event") {
      for (const c of cols) {
        if (c.kind !== "hazard") continue;
        const hit = overlapX(c) && this.jy < c.top - TRIP_MARGIN * u && charTop(this.jy) > c.bottom;
        if (hit && !c.p.inside) this.onHazard(c.p);
        c.p.inside = hit;
      }
    } else if (!this.trip) {
      for (const c of cols) {
        if (c.kind !== "hazard" || !overlapX(c)) continue;
        if ((c.p.tripCooldownUntil ?? 0) > ts) continue;
        if (this.jy < c.top - TRIP_MARGIN * u && charTop(this.jy) > c.bottom) {
          this.startTrip(c, ts);
          break;
        }
      }
    }

    // 4) 垂直
    if (this.air) {
      const g = this.gravity;
      const prev = this.jy;
      this.vy += g * dt;
      if (this.water) {
        // 漂浮：下落有最高速度；按住 A 時一開始往下就自動再划一下
        const maxFall = this.water.maxFallH * this.height;
        if (this.vy > maxFall) this.vy = maxFall;
        if (d.a && this.vy > 0) this.stroke(ts);
      }
      let next = prev - this.vy * dt;
      if (this.water && next > this.waterCeiling) {
        next = this.waterCeiling;
        if (this.vy < 0) this.vy = 0;
      }
      if (this.vy < 0) {
        // 往上：頭碰到 solid 底面 → 彈回
        for (const c of cols) {
          if (c.kind !== "solid" || !overlapX(c)) continue;
          if (charTop(prev) <= c.bottom + 1 && charTop(next) > c.bottom) {
            next = c.bottom - boxH * u;
            this.vy = 0;
            this.onHeadBump(c.p);
          }
        }
        this.jy = Math.max(0, next);
      } else {
        // 往下：腳底穿過上緣 → 站上（地面＝0）
        const sup = this.supportAt(prev, cols, 0.5);
        if (next <= sup) {
          this.jy = sup;
          this.air = false;
          this.vy = 0;
          if (!(d.left || d.right) && !this.trip && !this.autoRun) this.shot("land", 240);
          this.onLand();
        } else this.jy = next;
      }
    } else {
      // 地面上：走出平台邊緣 → 下落
      const sup = this.supportAt(this.jy, cols, 1);
      if (sup < this.jy - 1) {
        this.air = true;
        this.vy = 0;
        this.runJump = d.b;
      } else this.jy = sup;
    }
    this.supportY = this.supportAt(this.jy, cols, 1);

    // 5) 絆倒結束 → 回到待機
    if (this.trip && ts >= this.trip.end) {
      this.trip.p.tripCooldownUntil = ts + TRIP_COOLDOWN;
      this.trip = null;
      this.oneShot = null;
      this.stopSequence();
    }

    if (!this.reduced) this.drift += dt * W * 0.01;
  }

  // ---- 宇宙空間（無重力）：推進＋阻尼、小行星可站立、黑洞傳送、閒置緩慢旋轉 ----

  private spacePhysics(dt: number, ts: number): void {
    const S = this.space!;
    const d = this.pad.down;
    const W = this.width;
    const H = this.height;
    const u = this.unit;
    if (!this.reduced) this.drift += dt * W * 0.01;
    if (this.warp) {
      this.stepWarp(dt, ts);
      this.supportY = 0;
      this.updateFlyers(dt, ts, false);
      return;
    }
    // 漂浮的小行星先動；站在上面的角色跟著移動（水平＝鏡頭跟著捲、垂直＝腳底貼著上緣）
    this.updateFloaters(dt, ts);
    let cols = this.colliders();
    const stunned = ts < this.stunUntil;
    const mx = stunned ? 0 : (d.left ? -1 : 0) + (d.right ? 1 : 0);
    const my = stunned ? 0 : (d.up ? -1 : 0) + (d.down ? 1 : 0); // 畫面方向：負＝往上（同 vy）
    const boost = d.b ? S.boostMult : 1;
    const vmax = S.maxSpeedH * H * boost;
    const acc = S.thrustH * H * boost;
    const decay = Math.exp(-S.dragPerSec * dt);
    // 推進：往按住的方向加速到最高速度；沒按的方向慢慢停下（放開就停在原位）
    const steer = (v: number, m: number): number => {
      if (!m) {
        v *= decay;
        return Math.abs(v) < 0.5 ? 0 : v;
      }
      if (v * m < 0) v *= decay; // 反方向：先煞車
      if (v * m < vmax) return m > 0 ? Math.min(vmax, v + acc * dt) : Math.max(-vmax, v - acc * dt);
      return m * Math.max(vmax, Math.abs(v) * decay); // 衝刺、黑洞、被隕石撞帶來的超速慢慢降回最高速度
    };
    if (!this.air) {
      // 站在小行星上：←→ 走路（同地面）
      this.svx = mx ? mx * W * (d.b ? RUN : WALK) * S.walkMult : 0;
      this.vy = 0;
    } else {
      this.svx = steer(this.svx, mx);
      this.vy = steer(this.vy, my);
    }
    if (this.blackHolePull(cols, dt, ts)) return;
    const F = S.floatRock;
    const pushMult = F?.pushMult ?? 0.7;

    // 水平：小行星側面擋住；漂浮的小行星會被推走（角色稍微減速，繼續往前就能一直推）
    let dx = this.svx * dt;
    if (dx) {
      const [l, r] = this.charSpan();
      const top = this.jy + CHAR_BOX_H * u;
      let hardBlock = false;
      for (const c of cols) {
        if (c.kind !== "solid") continue;
        const tol = this.air ? 0.5 : STEP_UP * u;
        if (c.bottom >= top || c.top - this.jy < tol) continue;
        const before = dx;
        if (dx > 0 && c.left >= r - 0.5) dx = Math.min(dx, Math.max(0, c.left - r));
        if (dx < 0 && c.right <= l + 0.5) dx = Math.max(dx, Math.min(0, c.right - l));
        if (dx === before) continue;
        if (c.p.floating) {
          const push = (this.svx / u) * pushMult; // 單位／秒
          const fv = c.p.fvx ?? 0;
          c.p.fvx = push > 0 ? Math.max(fv, push) : Math.min(fv, push);
        } else hardBlock = true;
      }
      if (Math.abs(dx) < Math.abs(this.svx * dt) - 0.01) {
        if (hardBlock) this.svx = 0;
        else if (this.air) this.svx *= Math.exp(-3 * dt);
      }
      if (dx) {
        this.offset += dx;
        this.onMove();
        cols = this.colliders();
      }
    }
    const [l, r] = this.charSpan();

    // 垂直：上下有邊界（不是地面，碰到只是停住、繼續飄著）；往下碰到小行星上緣就站上去
    if (this.air) {
      const prev = this.jy;
      let next = prev - this.vy * dt;
      const ceil = Math.max(0, (FEET_Y - this.charH - S.topMarginH) * H);
      if (next > ceil) {
        next = ceil;
        if (this.vy < 0) this.vy = 0;
      }
      if (next < 0) {
        next = 0;
        if (this.vy > 0) this.vy = 0;
      }
      if (this.vy < 0) {
        for (const c of cols) {
          if (c.kind !== "solid" || c.right <= l || c.left >= r) continue;
          if (prev + CHAR_BOX_H * u <= c.bottom + 1 && next + CHAR_BOX_H * u > c.bottom) {
            next = c.bottom - CHAR_BOX_H * u;
            // 從下面頂到漂浮的小行星：把它往上推
            if (c.p.floating) c.p.fvy = Math.max(c.p.fvy ?? 0, (-this.vy / u) * pushMult);
            this.vy = 0;
            this.onHeadBump(c.p);
          }
        }
        this.jy = Math.max(0, next);
      } else {
        const sup = this.vy > 0 ? this.supportAt(prev, cols, 0.5) : 0;
        if (sup > 0 && next <= sup) {
          // 落在漂浮的小行星上：它會被壓得往下沉一點再浮回來
          const land = cols.find((c) => c.kind === "solid" && c.right > l && c.left < r && Math.abs(c.top - sup) < 0.5);
          if (land?.p.floating) land.p.fvy = (land.p.fvy ?? 0) - (this.vy / u) * 0.3;
          this.jy = sup;
          this.air = false;
          this.vy = 0;
          this.svx = 0;
          this.rot = 0;
          this.spin = 0;
          this.tumble = 0;
          if (!mx) this.shot("land", 240);
          this.onLand();
        } else this.jy = next;
      }
    } else {
      // 走出小行星邊緣 → 飄起來（沒有重力，不會往下掉）
      const sup = this.supportAt(this.jy, cols, 1);
      if (sup < this.jy - 1) {
        this.air = true;
        this.vy = 0;
      } else this.jy = sup;
    }
    this.supportY = this.air ? 0 : this.jy;
    // 記住腳下是哪一顆（下一幀它漂動時角色跟著走）
    this.standOn = this.air
      ? null
      : (cols.find((c) => c.kind === "solid" && c.right > l && c.left < r && Math.abs(c.top - this.jy) < 1.5)?.p ?? null);

    this.updateFlyers(dt, ts, true);

    // 旋轉：都沒有操作時朝隨機方向緩慢旋轉；一操作（或被黑洞吸、站上小行星）就轉回正；被隕石撞到會翻滾一下
    const input = mx !== 0 || my !== 0 || ts - this.lastDashAt < 300;
    if (Math.abs(this.tumble) > 1 && this.air) {
      if (!this.reduced) this.rot = (this.rot + this.tumble * dt) % 360;
      this.tumble *= Math.exp(-2.2 * dt);
    } else if (this.air && this.pullK > 0) {
      if (!this.reduced) this.rot = (this.rot + 160 * this.pullK * dt) % 360; // 被吸住：越靠近轉越快
    } else if (this.air && !input && !stunned && !this.reduced) {
      if (!this.spin) {
        const [a, b] = S.spinDegPerSec;
        this.spin = (Math.random() < 0.5 ? -1 : 1) * (a + Math.random() * (b - a));
      }
      this.rot = (this.rot + this.spin * dt) % 360;
    } else {
      this.tumble = 0;
      this.spin = 0;
      let a = (((this.rot % 360) + 540) % 360) - 180;
      const step = S.uprightDegPerSec * dt;
      a = Math.abs(a) <= step ? 0 : a - Math.sign(a) * step;
      this.rot = a;
    }
  }

  /** 漂浮的小行星：慢慢上下浮動（bob）；被推之後滑一段再停下，垂直方向有彈簧慢慢回到原本高度；站在上面的角色跟著移動 */
  private updateFloaters(dt: number, ts: number): void {
    const F = this.space?.floatRock;
    if (!F) return;
    // 腳下是哪一顆：上一幀記下的；剛站上去（或剛換場景）還沒記到就現在找
    if (!this.air && !this.standOn) {
      const [l, r] = this.charSpan();
      this.standOn = this.colliders().find((c) => c.kind === "solid" && c.right > l && c.left < r && Math.abs(c.top - this.jy) < 1.5)?.p ?? null;
    }
    const ride = !this.air ? this.standOn : null;
    const before = ride ? this.propRect(ride) : null;
    const drag = Math.exp(-F.drag * dt);
    const maxV = F.maxSpeedUnits;
    for (const p of this.props) {
      if (!p.floating) continue;
      p.fx ??= 0;
      p.fy ??= 0;
      p.fvx = (p.fvx ?? 0) * drag;
      p.fvy = ((p.fvy ?? 0) - F.springY * p.fy * dt) * drag;
      p.fvx = Math.max(-maxV, Math.min(maxV, p.fvx));
      p.fvy = Math.max(-maxV, Math.min(maxV, p.fvy));
      p.fx += p.fvx * dt;
      p.fy = Math.max(-F.maxDriftYUnits, Math.min(F.maxDriftYUnits, p.fy + p.fvy * dt));
      p.bob = this.reduced ? 0 : F.bobUnits * Math.sin((ts / 1000) * 6.2832 * F.bobHz + (p.phase ?? 0));
    }
    if (ride && before) {
      const after = this.propRect(ride);
      if (after) {
        const dxPx = (after.left + after.right) / 2 - (before.left + before.right) / 2;
        // 跨過道具世界週期的接縫時中心會跳一整圈，那一幀不跟
        if (Math.abs(dxPx) < this.width * 0.5) this.offset += dxPx;
        this.jy = Math.max(0, this.jy + (after.top - before.top));
      }
    }
  }

  /** 太空的飛行物：偶爾有飛碟、隕石飛過畫面；碰到角色時——飛碟：角色驚訝、停在原地，飛碟被彈飛；隕石：角色驚訝並被撞飛一段 */
  private updateFlyers(dt: number, ts: number, collide: boolean): void {
    const S = this.space;
    const C = S?.flyers;
    if (!S || !C) return;
    const W = this.width;
    const H = this.height;
    const u = this.unit;
    if (!this.nextFlyerAt) this.nextFlyerAt = ts + C.firstDelayMs;
    if (ts >= this.nextFlyerAt && this.flyers.length < C.maxOnScreen && !this.warp) {
      this.spawnFlyer(Math.random() < C.ufoChance ? "ufo" : "meteor");
      const [a, b] = C.intervalMs;
      this.nextFlyerAt = ts + a + Math.random() * (b - a);
    }
    const cx = W * this.charX;
    const cy = FEET_Y * H - this.jy - (CHAR_BOX_H * u) / 2; // 角色身體中心（畫面 y）
    for (const f of this.flyers) {
      f.age += dt;
      f.wx += f.vx * dt;
      f.baseY += f.vy * dt;
      if (f.kind === "ufo" && !f.hit && !this.reduced) f.y = f.baseY + C.ufo.wobbleH * H * Math.sin(f.age * 3);
      else f.y = f.baseY;
      f.rot += f.vr * dt;
      const sx = f.wx - this.offset;
      // 碰撞：角色碰撞盒 vs 飛行物（取圖的中間一圈）
      if (collide && !f.hit && Math.abs(sx - cx) < (CHAR_BOX_W * u) / 2 + f.w * 0.36 && Math.abs(f.y - cy) < (CHAR_BOX_H * u) / 2 + f.h * 0.3) {
        f.hit = true;
        this.perform(null);
        if (f.kind === "ufo") {
          // 角色嚇一跳、停在原地；飛碟往反方向、往上彈飛並打轉
          this.svx = 0;
          this.vy = 0;
          this.stunUntil = ts + C.ufo.stunMs;
          this.shot("surprise", C.ufo.stunMs);
          f.vx = -Math.sign(f.vx || 1) * C.ufo.bounceSpeedW * W;
          f.vy = -0.55 * H;
          f.vr = (f.vx > 0 ? 1 : -1) * 540;
        } else {
          // 隕石：沿著隕石飛行的方向把角色撞飛（稍微往上），翻滾一下
          const dir = Math.sign(f.vx || 1);
          this.air = true;
          this.standOn = null;
          this.svx = dir * C.meteor.knockH * H;
          this.vy = -C.meteor.knockUpH * H;
          this.tumble = dir * C.meteor.tumbleDegPerSec;
          this.spin = 0;
          this.stunUntil = ts + C.meteor.stunMs;
          this.shot("surprise", C.meteor.stunMs + 300);
        }
        this.onFlyerHit(f.kind);
      }
      const off = sx < -W * 0.35 || sx > W * 1.35 || f.y > H + f.h || f.y < -f.h * 1.5;
      if (off && f.age > 1) f.dead = true;
      if (!f.dead) {
        const flip = f.vx < 0 && f.kind === "meteor" ? " scaleX(-1)" : "";
        f.el.style.transform = `translate(${(sx - f.w / 2).toFixed(1)}px, ${(f.y - f.h / 2).toFixed(1)}px) rotate(${f.rot.toFixed(1)}deg)${flip}`;
      }
    }
    for (const f of this.flyers) if (f.dead) f.el.remove();
    this.flyers = this.flyers.filter((f) => !f.dead);
  }

  /** 產生一個飛行物：從畫面左或右邊外面進來。飛碟水平飛、上下晃；隕石從上方斜斜往下衝 */
  private spawnFlyer(kind: "ufo" | "meteor"): void {
    const C = this.space!.flyers!;
    const propId = FLYER_PROP[kind];
    const def = GameArt.props.find((p) => p.id === propId);
    if (!def) return;
    const W = this.width;
    const H = this.height;
    const u = this.unit;
    const k = kind === "ufo" ? C.ufo.sizeMult : C.meteor.sizeMult;
    const w = def.size[0] * u * k;
    const h = def.size[1] * u * k;
    const fromLeft = Math.random() < 0.5;
    const dir = fromLeft ? 1 : -1;
    const sx = fromLeft ? -w : W + w; // 畫面 x
    let vx: number;
    let vy: number;
    let y: number;
    let rot = 0;
    if (kind === "ufo") {
      vx = dir * C.ufo.speedW * W;
      vy = 0;
      y = H * (0.12 + Math.random() * 0.45);
    } else {
      const a = ((C.meteor.angleDeg[0] + Math.random() * (C.meteor.angleDeg[1] - C.meteor.angleDeg[0])) * Math.PI) / 180;
      vx = dir * C.meteor.speedW * W * Math.cos(a);
      vy = C.meteor.speedW * W * Math.sin(a);
      y = H * (0.02 + Math.random() * 0.25);
      rot = (dir * a * 180) / Math.PI;
    }
    const el = document.createElement("div");
    el.className = "gstage-prop gstage-flyer";
    el.dataset.prop = propId;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.top = "0px";
    el.innerHTML = GameArt.prop(propId);
    this.flyLayer.appendChild(el);
    this.flyers.push({ kind, wx: sx + this.offset, baseY: y, y, vx, vy, w, h, el, hit: false, age: 0, rot, vr: 0, dead: false });
  }

  private clearFlyers(): void {
    for (const f of this.flyers) f.el.remove();
    this.flyers = [];
    this.nextFlyerAt = 0;
  }

  /** 黑洞吸力：範圍內往中心加速（越近越強，再加一點旋轉的切線力）；夠近就開始傳送（回傳 true） */
  private blackHolePull(cols: Collider[], dt: number, ts: number): boolean {
    const B = this.space!.blackHole;
    const H = this.height;
    const R = B.pullRadiusH * H;
    const cx = this.width * this.charX;
    const cy = this.jy + (CHAR_BOX_H * this.unit) / 2;
    this.pullK = 0;
    for (const c of cols) {
      if (c.kind !== "blackhole") continue;
      const hx = (c.left + c.right) / 2;
      const hy = (c.bottom + c.top) / 2;
      const ex = hx - cx;
      const ey = hy - cy; // 往上為正
      const dist = Math.hypot(ex, ey);
      if (this.immune === c.p) {
        if (dist > R * 1.05) this.immune = null;
        continue;
      }
      if (dist >= R) continue;
      if (dist < B.captureRadiusH * H) {
        this.startWarp(c.p, ts, ex, ey);
        return true;
      }
      const k = 1 - dist / R;
      const a = Math.min(B.pullMaxH, B.pullH * (1 + 3 * k * k)) * H;
      const nx = ex / dist;
      const ny = ey / dist;
      const at = 0.5 * a * (dist / R); // 切線（逆時針），越靠近越小，不會一直繞圈
      this.svx += (nx * a - ny * at) * dt;
      this.vy -= (ny * a + nx * at) * dt;
      this.air = true;
      this.pullK = Math.max(this.pullK, k);
    }
    return false;
  }

  /** 找出口：from.link（關卡指定）或場上另一個黑洞 */
  private warpTarget(from: StageProp): StageProp | null {
    const link = from.link;
    if (link && this.props.includes(link)) return link;
    const isHole = (p: StageProp) => (GameArt.props.find((d) => d.id === p.id) as { collider?: { kind: string } } | undefined)?.collider?.kind === "blackhole";
    let best: StageProp | null = null;
    let bestD = Infinity;
    for (const p of this.props) {
      if (p === from || !isHole(p)) continue;
      const dd = Math.abs(p.x - from.x);
      if (dd < bestD) {
        bestD = dd;
        best = p;
      }
    }
    return best;
  }

  private startWarp(from: StageProp, ts: number, ex: number, ey: number): void {
    const to = this.warpTarget(from);
    if (!to) {
      this.immune = from;
      return;
    }
    const sp = Math.hypot(this.svx, this.vy);
    let dir: [number, number] = sp > 0.05 * this.height ? [this.svx / sp, this.vy / sp] : [this.dir, -0.4];
    const n = Math.hypot(dir[0], dir[1]);
    dir = [dir[0] / n, dir[1] / n];
    this.perform(null);
    this.warp = { phase: "in", start: ts, from, to, o0: this.offset, j0: this.jy, o1: this.offset + ex, j1: this.jy + ey, dir };
    this.svx = 0;
    this.vy = 0;
    this.air = true;
    this.oneShot = null;
    this.spin = 0;
    this.onWarp("in", from, to);
  }

  /** 傳送動畫：縮小旋轉進入 → 鏡頭移到出口 → 放大旋轉出來，往進入時的方向彈出 */
  private stepWarp(dt: number, ts: number): void {
    const w = this.warp!;
    const B = this.space!.blackHole;
    const t = Math.min(1, (ts - w.start) / B.warpMs);
    if (!this.reduced) this.rot = (this.rot + 720 * dt) % 360;
    if (w.phase === "in") {
      const e = t * t;
      this.offset = w.o0 + (w.o1 - w.o0) * e;
      this.jy = Math.max(0, w.j0 + (w.j1 - w.j0) * e);
      this.warpScale = 1 - t;
      this.onMove();
      if (t >= 1) {
        // 鏡頭移到出口黑洞（道具世界每 propPeriod 重複，取最近的一圈）
        const W = this.width;
        const period = this.propPeriod * W;
        const base = w.to.x * W;
        this.offset = base + Math.round((this.offset - base) / period) * period;
        const c = this.colliders().find((cc) => cc.p === w.to);
        if (c) this.jy = Math.max(0, (c.bottom + c.top) / 2 - (CHAR_BOX_H * this.unit) / 2);
        w.phase = "out";
        w.start = ts;
        this.onMove();
        this.onWarp("out", w.from, w.to);
      }
    } else {
      this.warpScale = 1 - (1 - t) * (1 - t);
      if (t >= 1) {
        this.warp = null;
        this.warpScale = 1;
        this.immune = w.to;
        const v = B.exitSpeedH * this.height;
        let [x, y] = w.dir;
        if (y > 0 && this.jy < 0.15 * this.height) y = -y; // 太靠下面就往上彈
        this.svx = x * v;
        this.vy = y * v;
        if (x) {
          this.dir = x < 0 ? -1 : 1;
          this.flip();
        }
        this.shot("dizzy", 900);
      }
    }
  }

  private startTrip(c: Collider, ts: number): void {
    const [l, r] = this.charSpan();
    const dir = this.dir;
    // 往面向方向滑出：至少半個角色寬，並且一定滑過這顆石頭（爬起來時不會還壓在石頭上）
    const clear = dir > 0 ? c.right - l : r - c.left;
    const slide = Math.max(0.5 * CHAR_W * this.unit, clear + 2 * this.unit);
    const steps = (GameTokens.motion.sequences as Record<string, { steps?: { ms: number }[] }>).trip?.steps ?? [];
    const total = steps.reduce((a, st) => a + st.ms, 0) || 1900;
    this.trip = { start: ts, end: ts + total, slide, slid: 0, dir, p: c.p };
    this.setCharge(false);
    this.perform(null);
    this.playSequence("trip", true);
    this.seqStart = ts;
    this.onTrip(c.p);
  }

  /** 坐在椅子上（pose.seat）：腳下補一張小板凳（只在舞台上；拍照時 exportSVG 會自動補） */
  private updateSeat(): void {
    const pose = this.seqName ? null : this.cur;
    const seat = pose && GameArt.seatFor ? GameArt.seatFor(pose) : null;
    if (!seat) {
      if (this.seatPose) {
        this.seatEl.style.display = "none";
        this.seatPose = null;
      }
      return;
    }
    const def = GameArt.props.find((d) => d.id === seat.prop);
    if (!def) return;
    const u = this.unit;
    const h = seat.hUnits * u;
    const w = (h * def.size[0]) / def.size[1];
    if (this.seatPose !== pose) {
      this.seatPose = pose;
      this.seatEl.innerHTML = GameArt.prop(seat.prop);
      this.seatEl.style.display = "";
    }
    this.seatEl.style.width = `${w}px`;
    this.seatEl.style.height = `${h}px`;
    this.seatEl.style.left = `${this.width * this.charX - w / 2 + seat.dx * u * (this.dir < 0 && this.view === "side" ? -1 : 1)}px`;
    this.seatEl.style.top = `${this.height * FEET_Y - h - this.jy}px`;
  }

  // ---- 互動道具（地面層，跟著地面捲動） ----

  setProps(list: StageProp[]): void {
    this.props = list;
    this.standOn = null;
    this.renderProps();
    if (this.space && !this.warp) {
      this.updateFloaters(0, performance.now()); // 先算好浮動量，再把角色放到小行星上
      this.settleSpace();
    }
  }

  /** 太空換道具（換場景）時：身體卡在小行星裡就放到它上面站著 */
  private settleSpace(): void {
    const [l, r] = this.charSpan();
    const top = this.jy + CHAR_BOX_H * this.unit;
    let s = -1;
    for (const c of this.colliders()) {
      if (c.kind !== "solid" || c.right <= l || c.left >= r) continue;
      if (c.bottom < top && c.top >= this.jy - 1 && c.top > s) s = c.top;
    }
    if (s >= 0) {
      this.jy = s;
      this.air = false;
      this.vy = 0;
      this.svx = 0;
      this.rot = 0;
    }
    this.supportY = this.air ? 0 : this.jy;
  }

  private renderProps(): void {
    this.propLayer.innerHTML = "";
    this.propFrontLayer.innerHTML = "";
    const H = this.height;
    for (const p of this.props) {
      const def = GameArt.props.find((d) => d.id === p.id);
      if (!def) continue;
      const { w, h: hpx, bottom } = this.propSize(p, def.size);
      const el = document.createElement("div");
      el.className = "gstage-prop" + (p.front ? " gstage-prop--front" : "");
      el.dataset.prop = p.id;
      el.style.width = `${w}px`;
      el.style.height = `${hpx}px`;
      el.style.top = `${FEET_Y * H - bottom - hpx}px`;
      el.innerHTML = GameArt.prop(p.id, p.state ? { state: p.state } : {});
      if (p.wUnits != null) el.querySelector("svg")?.setAttribute("preserveAspectRatio", "none");
      el.dataset.w = String(w);
      p.el = el;
      (p.front ? this.propFrontLayer : this.propLayer).appendChild(el);
    }
    this.positionProps();
  }

  setPropFront(p: StageProp, front: boolean): void {
    p.front = front;
    if (p.el) {
      p.el.classList.toggle("gstage-prop--front", front);
      (front ? this.propFrontLayer : this.propLayer).appendChild(p.el);
    }
  }

  /** 道具尺寸（px）：高＝size[1] × 設計單位（道具單位＝角色設計單位）；有 h（占舞台高）時用 h；支援 scale 縮放。bottom＝底部離地高度 */
  private propSize(p: StageProp, size: [number, number]): { w: number; h: number; bottom: number } {
    const H = this.height;
    const u = this.unit;
    const s = p.scale ?? 1;
    const h = (p.h != null ? p.h * H : size[1] * u) * s;
    const w = p.wUnits != null ? p.wUnits * u : (h * size[0]) / size[1];
    const bottom = p.lift != null ? p.lift * u : p.y != null ? (FEET_Y - p.y) * H : 0;
    return { w, h, bottom };
  }

  /** 道具矩形（畫面 x、離地高度，px） */
  propRect(p: StageProp): PropRect | null {
    const def = GameArt.props.find((d) => d.id === p.id);
    if (!def) return null;
    const { w, h, bottom: b0 } = this.propSize(p, def.size);
    const bottom = b0 + this.floatDy(p);
    const cx = this.propScreenX(p);
    return { left: cx - w / 2, right: cx + w / 2, bottom, top: bottom + h };
  }

  /** 角色碰撞盒的離地範圍（px）：腳底、頭頂 */
  get charVertical(): { feet: number; head: number } {
    return { feet: this.jy, head: this.jy + (this.isCrouching ? CROUCH_BOX_H : CHAR_BOX_H) * this.unit };
  }

  setPropState(p: StageProp, state: string): void {
    p.state = state;
    if (p.el) {
      p.el.innerHTML = GameArt.prop(p.id, { state });
      if (p.wUnits != null) p.el.querySelector("svg")?.setAttribute("preserveAspectRatio", "none");
    }
  }

  /** 道具在畫面上的 x（px，中心）；角色固定在畫面中央 */
  propScreenX(p: StageProp): number {
    const W = this.width;
    const period = this.propPeriod * W;
    let x = p.x * W - this.offset + (p.fx ?? 0) * this.unit;
    x = ((x % period) + period) % period;
    if (x > period - W) x -= period; // 讓左邊稍微看得到
    return x + W * this.charX;
  }

  /** 角色與道具的水平距離（單位＝舞台寬） */
  distanceTo(p: StageProp): number {
    return Math.abs(this.propScreenX(p) - this.width * this.charX) / this.width;
  }

  /** 角色目前腳底離地高度（px） */
  get jumpHeight(): number {
    return this.jy;
  }

  /** 漂浮小行星目前的垂直位移（px，往上為正）：推動的位移＋上下浮動 */
  private floatDy(p: StageProp): number {
    return ((p.fy ?? 0) + (p.bob ?? 0)) * this.unit;
  }

  positionProps(): void {
    for (const p of this.props) {
      if (!p.el) continue;
      const w = Number(p.el.dataset.w) || p.el.offsetWidth; // 不每幀讀 offsetWidth（避免強制排版）
      const x = this.propScreenX(p) - w / 2;
      // 畫面外的道具不顯示（賽道很長時省繪製）
      const off = x > this.width * 1.6 || x + w < -this.width * 0.6;
      if (p.el.style.display !== (off ? "none" : "")) p.el.style.display = off ? "none" : "";
      if (!off) {
        const dy = p.floating ? this.floatDy(p) : 0;
        p.el.style.transform = dy ? `translate(${x.toFixed(1)}px, ${(-dy).toFixed(1)}px)` : `translateX(${x.toFixed(1)}px)`;
      }
    }
  }

  /** 拍照用：目前舞台狀態轉成 GameArt.exportSVG 的 opts */
  exportState(): {
    scene: string;
    u: number;
    look: Look;
    pose: string;
    t: number;
    view: View;
    facing: Facing;
    shift: number;
    charH: number;
    /** 腳底（舞台高比例）：跳起來、在水裡浮著、站在方塊上時比 0.88 高 */
    feetY: number;
    /** 腳下支撐面（地面或方塊上緣）＝影子位置 */
    shadowY: number;
    /** 太空：身體旋轉（度）、縮放（黑洞傳送中）、飄著時不畫影子 */
    rot: number;
    scale: number;
    shadow: boolean;
    props: { id: string; x: number; state?: string; h?: number; y?: number; front?: boolean }[];
  } {
    const W = this.width;
    const props = this.props
      .map((p) => {
        const r = this.propRect(p);
        const H = this.height;
        return {
          id: p.id,
          x: this.propScreenX(p) / W,
          state: p.state,
          h: r ? (r.top - r.bottom) / H : p.h,
          y: r ? FEET_Y - r.bottom / H : p.y,
          front: p.front,
        };
      })
      .filter((p) => p.x > -0.2 && p.x < 1.2);
    // 宇宙空間：畫面上的飛碟、隕石也拍進去
    const H0 = this.height;
    for (const f of this.flyers) {
      const x = (f.wx - this.offset) / W;
      if (x > -0.2 && x < 1.2) props.push({ id: FLYER_PROP[f.kind], x, state: undefined, h: f.h / H0, y: (f.y + f.h / 2) / H0, front: true });
    }
    return {
      scene: this.sceneId,
      u: this.u,
      look: this.look,
      pose: this.cur,
      t: 300,
      view: this.seqName ? this.seqView : this.view,
      facing: this.seqName ? this.seqFacing : this.dir < 0 ? "left" : "right",
      shift: this.offset / W,
      charH: this.charH,
      feetY: FEET_Y - this.jy / this.height,
      shadowY: FEET_Y - this.supportY / this.height,
      rot: this.space ? this.rot : 0,
      scale: this.space ? this.warpScale : 1,
      shadow: !(this.space && this.air),
      props,
    };
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.ctl?.stop();
    this.unsubPad();
    this.resizeObs?.disconnect();
    clearTimeout(this.oneShotTimer);
    this.el.remove();
  }
}
