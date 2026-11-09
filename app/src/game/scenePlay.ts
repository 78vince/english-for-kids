// 角色小鎮・主題場景的互動（第三階段 3b-1；docs/plan-game-town.md）：
// 從角色工作室搬過來的「試玩場域」——圓石、禮物方塊、彈簧、花苞、石頭方塊／階梯、木頭、樹墩、寶箱、營火、
// 宇宙空間的漂浮小行星與黑洞、墓園的墓碑；蓄力跳（按住 ↓ 1 秒再按 A，2 倍高）、彈簧 1.8 倍、
// 海底划水泡泡、太空衝刺星塵、飛碟隕石、黑洞傳送的音效與文字。
// 規則、數值照工作室（characterStudio.ts）；工作室第四階段下架前兩邊各自一份。
// 3b-2：森林天氣（晴天／雨天／颱風天，畫面上的天氣鈕讓小朋友自己切換；雨量四級、下太大太久會淹水、漂浮；
// 颱風天順風快逆風慢、跳起來被吹走），森林蜜蜂（白天）／蝙蝠（晚上）與大便樹枝驅離。
// 3b-3：夜光墓園的咬人寶箱、地底巨手、小殭屍、會移動的大墓碑、變身符咒、蝙蝠群、萬聖節傳送門（graveyardPlay.ts）；
// 魔拐杖／南瓜糖果桶按 C 放特技（街上、各場景都可以）。
import { GameArt, icon, prefersReducedMotion, type ExportExtra, type RainLevel, type SceneWeather } from "./gameKit";
import type { StageController, StageProp } from "./stageController";
import type { VirtualPad } from "./virtualPad";
import { playBlip } from "./townSfx";
import { GraveyardPlay, graveyardField, magicCaneFx, candyRainFx, type GyProp } from "./graveyardPlay";

export interface ScenePlayOpts {
  /** 遊戲幣餘額（萬聖節傳送門挑戰南瓜怪用） */
  balance?: () => number;
  /** 前往巨大南瓜怪大作戰 */
  goPumpkinBoss?: () => void;
}

interface PlayProp extends StageProp {
  kind: "gift" | "spring" | "flower" | "chest" | "campfire" | "rock" | "solid" | "blackhole" | "giantHand" | "halloweenPortal";
  resetAt?: number;
  wander?: boolean;
  cooldownUntil?: number;
  base?: number;
}
type Def = Omit<PlayProp, "x"> & { x: number };

/** 場域每段長度（舞台寬）；出口門右邊從 start 開始，重複 reps 段 */
const FIELD_PERIOD = 6;
const BLOCK_STACK = 58;
const BLOCK_W = 64;
const SPRING_MULT = 1.8;
const CHARGE_MULT = 2;
const CHARGE_GLOW_MS = 350;
const CHARGE_MS = 1000;
const CHARGE_GRACE_MS = 300;
const CAMPFIRE_MS = 10000;
type Weather = "sunny" | "rainy" | "typhoon";
const WEATHER_KEY = "townWeather";

interface Flyer {
  kind: "bee" | "bat";
  id: number;
  el: HTMLDivElement;
  x: number;
  yPx: number;
  dir: 1 | -1;
  wing: "up" | "down";
  lastWingAt: number;
  patrolMin: number;
  patrolMax: number;
  baseY: number;
  speed: number;
  chasing: boolean;
  attracted: boolean;
  reboundUntil: number;
  fleeing: boolean;
}

export class ScenePlay {
  private props: PlayProp[] = [];
  private crouchSince = 0;
  private charged = false;
  private glowing = false;
  private chargeExpireAt = 0;
  private lastJumpHeight = 0;
  private campfireUntil = new Map<PlayProp, number>();
  private spaceHint = false;
  private chargeHint = false;
  // ---- 森林天氣 ----
  private sceneId = "";
  private weather: Weather = "sunny";
  private rain = 1;
  private flood = 0;
  private heavyRainSince = 0;
  private floodNotice = false;
  private floatNotice = false;
  private windNotice = false;
  private wasFloating = false;
  private weatherLayer: HTMLDivElement | null = null;
  private floodLayer: HTMLDivElement | null = null;
  private weatherUi: HTMLDivElement | null = null;
  private flyers: Flyer[] = [];
  private scareUntil = 0;
  private lastT = performance.now();
  // ---- 墓園、特技 ----
  private gy: GraveyardPlay | null = null;
  private extra: StageProp[] = [];
  private cOn = false;
  private specialTimer = 0;

  constructor(
    private stage: StageController,
    private pad: VirtualPad,
    private toast: (html: string, ms?: number, hue?: string) => void,
    private opts: ScenePlayOpts = {}
  ) {
    // 魔拐杖／南瓜糖果桶：按 C 放特技
    pad.on((k, v) => {
      if (v && k === "c") this.special();
    });
    // 跳躍、落地、蓄力：小鎮街上也適用
    stage.onJump = () => playBlip("jump");
    stage.onLand = () => playBlip("land");
    stage.jumpMultiplier = () => {
      if (!this.consumeCharge()) return 1;
      return CHARGE_MULT;
    };
    stage.onHeadBump = (sp) => {
      const p = sp as PlayProp;
      if (p.kind !== "gift" || p.state !== "idle") return;
      stage.setPropState(p, "hit");
      p.resetAt = performance.now() + 8000;
      playBlip("pop");
      const r = stage.propRect(p);
      const topFrac = r ? 0.88 - r.top / stage.height : 0.3;
      this.floatText(`${icon("sparkle")}${icon("star")}${icon("sparkle")}`, Math.max(0.05, topFrac - 0.08), "rose");
      setTimeout(() => stage.setPropState(p, "used"), 300);
    };
    stage.onTrip = () => {
      this.setCharged(false);
      this.crouchSince = 0;
      playBlip("trip");
      this.floatText(`${icon("star")}${icon("sparkle")}`, 0.42, "sun");
      if (!prefersReducedMotion())
        stage.el.animate([{ transform: "translate(0,0)" }, { transform: "translate(-4px,1px)" }, { transform: "translate(3px,-1px)" }, { transform: "translate(0,0)" }], { duration: 120 });
    };
    stage.onSwim = () => this.puff(false, 0, 0);
    stage.onDash = (dx, dy) => {
      playBlip("jump");
      this.puff(true, dx, dy);
    };
    stage.onFlyerHit = (kind) => {
      playBlip(kind === "ufo" ? "pop" : "trip");
      this.floatText(kind === "ufo" ? `!${icon("sparkle")}` : `!!${icon("star")}`, this.headTop() - 0.04, kind === "ufo" ? "mint" : "peach");
    };
    // 颱風天：順風快、逆風慢；跳起來（或浮在水上）被風往左吹（只在森林）
    stage.speedMult = (mv: number) => {
      const g = this.gy?.speedMult();
      if (g != null) return g;
      if (this.sceneId !== "forest" || this.weather !== "typhoon") return 1;
      const T = this.fw()?.typhoon;
      return mv < 0 ? T?.walkTail ?? 1.95 : T?.walkHead ?? 0.35;
    };
    stage.airWind = (floating: boolean) => {
      if (this.sceneId !== "forest" || this.weather !== "typhoon") return 0;
      const T = this.fw()?.typhoon;
      if (!T) return 0;
      const gust = 1 + T.gustAmp * Math.sin((performance.now() / T.gustMs) * Math.PI * 2);
      if (!floating && !this.windNotice) {
        this.windNotice = true;
        this.toast(`${icon("wind")} 哇！跳起來被強風吹走了～`, 2200, "peach");
      }
      return (floating ? T.floatDriftW : T.jumpWindW) * gust;
    };
    try {
      const w = sessionStorage.getItem(WEATHER_KEY);
      if (w) {
        const [a, b] = w.split(":");
        if (a === "sunny" || a === "rainy" || a === "typhoon") this.weather = a;
        if (b && Number.isFinite(Number(b))) this.rain = Number(b);
      } else this.rain = this.fw()?.rain.default ?? 1;
    } catch {
      // 忽略
    }
    stage.onWarp = (phase) => {
      playBlip(phase === "in" ? "pop" : "coin");
      if (phase === "out") this.floatText(`${icon("sparkle")}${icon("star")}${icon("sparkle")}`, this.headTop() - 0.06, "lilac");
    };
  }

  private headTop(): number {
    return Math.max(0.05, 0.88 - this.stage.charH - this.stage.jumpHeight / this.stage.height);
  }

  private floatText(html: string, yFrac: number, hue = "sun"): void {
    if (prefersReducedMotion()) return;
    const sp = document.createElement("span");
    sp.className = `g-float g-h-${hue} scene-float`;
    sp.innerHTML = html;
    sp.style.left = `${this.stage.charX * 100}%`;
    sp.style.top = `${yFrac * 100}%`;
    this.stage.hud.appendChild(sp);
    setTimeout(() => sp.remove(), 900);
  }

  /** 海底划水泡泡（space＝太空衝刺星塵） */
  private puff(space: boolean, dx: number, dy: number): void {
    if (prefersReducedMotion()) return;
    const st = this.stage;
    const H = st.height;
    const b = document.createElement("span");
    b.className = `scene-bubbles${space ? " scene-bubbles--space" : ""}`;
    b.innerHTML = "<i></i><i></i><i></i>";
    if (space) {
      const midY = 0.88 * H - st.jumpHeight - st.charH * H * 0.45;
      b.style.left = `calc(${st.charX * 100}% + ${(-dx * st.charH * H * 0.35).toFixed(0)}px)`;
      b.style.top = `${Math.max(0, midY - dy * st.charH * H * 0.35)}px`;
    } else {
      b.style.left = `${st.charX * 100}%`;
      b.style.top = `${Math.max(0, (0.88 - st.charH) * H - st.jumpHeight)}px`;
    }
    st.hud.appendChild(b);
    setTimeout(() => b.remove(), 1200);
  }

  // ---- 蓄力跳 ----
  private setGlow(on: boolean): void {
    this.glowing = on;
    this.stage.setCharge(on, on && this.charged);
  }
  private setCharged(on: boolean): void {
    if (this.charged === on) {
      if (!on && this.glowing) this.setGlow(false);
      return;
    }
    this.charged = on;
    if (on) {
      this.setGlow(true);
      playBlip("coin");
      try {
        navigator.vibrate?.(30);
      } catch {
        // 不支援
      }
    } else this.setGlow(false);
  }
  private consumeCharge(): boolean {
    const was = this.charged;
    this.setCharged(false);
    this.crouchSince = 0;
    this.chargeExpireAt = 0;
    return was;
  }
  private updateCharge(now: number): void {
    const st = this.stage;
    const onGround = !st.isAirborne && !st.isTripping;
    if (this.pad.down.down && onGround && !st.inSpace) {
      if (!this.crouchSince) this.crouchSince = now;
      this.chargeExpireAt = 0;
      const held = now - this.crouchSince;
      if (!this.charged && held >= CHARGE_MS) this.setCharged(true);
      else if (!this.glowing && held >= CHARGE_GLOW_MS) this.setGlow(true);
    } else {
      this.crouchSince = 0;
      if (this.charged || this.glowing) {
        if (!this.chargeExpireAt) this.chargeExpireAt = now + CHARGE_GRACE_MS;
        if (now > this.chargeExpireAt || !onGround) {
          this.chargeExpireAt = 0;
          this.setCharged(false);
        }
      }
    }
  }

  // ---- 場域 ----
  private field(sceneId: string): Def[] {
    const st = this.stage;
    const bw = (BLOCK_W * st.unit) / st.width;
    if (st.inSpace) {
      const list: Def[] = [
        { id: "asteroid", kind: "solid", x: 0, y: 0.97 },
        { id: "asteroidSmall", kind: "solid", x: 0.55, y: 0.72 },
        { id: "asteroid", kind: "solid", x: 0.95, y: 0.6 },
        { id: "blackHole", kind: "blackhole", x: 1.65, y: 0.44 },
        { id: "asteroid", kind: "solid", x: 2.15, y: 0.82 },
        { id: "asteroidSmall", kind: "solid", x: 2.55, y: 0.58 },
        { id: "asteroid", kind: "solid", x: 3.35, y: 0.66 },
        { id: "asteroidSmall", kind: "solid", x: 3.8, y: 0.9 },
        { id: "blackHole", kind: "blackhole", x: 4.25, y: 0.44 },
        { id: "asteroid", kind: "solid", x: 4.75, y: 0.55 },
        { id: "asteroidSmall", kind: "solid", x: 5.25, y: 0.76 },
      ];
      return list.map((o, i) => (o.kind === "solid" ? { ...o, floating: true, phase: i * 1.7 } : o));
    }
    if (sceneId === "graveyard") return graveyardField(st, BLOCK_W, BLOCK_STACK) as Def[];
    const forest = sceneId === "forest";
    const list: Def[] = [
      { id: "rock", kind: "rock", x: 0.42 },
      ...(!forest ? [{ id: "giftBlock", kind: "gift" as const, x: 0.82, y: 0.88 - st.charH - 0.12, state: "idle" }] : []),
      { id: "spring", kind: "spring", x: 1.2, state: "idle" },
      { id: "flower", kind: "flower", x: 1.5, state: "bud" },
      { id: "stoneBlock", kind: "solid", x: 1.8 },
      { id: "stoneBlock", kind: "solid", x: 2.2 },
      { id: "stoneBlock", kind: "solid", x: 2.2 + bw },
      { id: "stoneBlock", kind: "solid", x: 2.2 + bw, lift: BLOCK_STACK },
      { id: "rock", kind: "rock", x: 2.62 },
      { id: "log", kind: "solid", x: 2.95 },
      ...(!forest ? [{ id: "chest", kind: "chest" as const, x: 3.25, state: "closed" }] : []),
      { id: "stump", kind: "solid", x: 3.55 },
      { id: "grassBlock", kind: "solid", x: 4.1 - (120 * st.unit) / st.width },
      { id: "stoneBlock", kind: "solid", x: 4.1 },
      { id: "stoneBlock", kind: "solid", x: 4.1, lift: BLOCK_STACK },
      { id: "log", kind: "solid", x: 4.1, lift: BLOCK_STACK * 2 },
      { id: "rock", kind: "rock", x: 4.55 },
      { id: "campfire", kind: "campfire", x: 5.3, state: "out" },
      { id: "rock", kind: "rock", x: 5.62 },
    ];
    // 海底世界：不擺營火和花
    return list.filter((o) => !(st.inWater && (o.kind === "campfire" || o.kind === "flower")));
  }

  /** 進入場景：擺出口門（extra）＋場域（從 start 開始重複 reps 段，不平鋪，出口門才不會重複） */
  start(sceneId: string, extra: StageProp[], start: number, reps = 8): void {
    const st = this.stage;
    this.sceneId = sceneId;
    const list: PlayProp[] = [];
    // 每段重新取一次（墓園巨手每段埋伏位置不同）
    for (let k = 0; k < reps; k++) {
      const base = start + k * FIELD_PERIOD;
      for (const d of this.field(sceneId)) list.push({ ...d, x: d.x + base, base } as PlayProp);
    }
    // 黑洞兩兩互通（每段裡的兩個）
    const holes = list.filter((p) => p.kind === "blackhole");
    for (let i = 0; i + 1 < holes.length; i += 2) {
      holes[i].link = holes[i + 1];
      holes[i + 1].link = holes[i];
    }
    this.props = list;
    this.campfireUntil.clear();
    st.propPeriod = 1e6;
    this.extra = extra;
    st.setProps([...extra, ...list]);
    for (const p of list) {
      if (p.kind === "campfire" && p.el) {
        p.el.classList.add("gstage-prop--click");
        p.el.setAttribute("role", "button");
        p.el.setAttribute("aria-label", "營火：點一下點亮或熄滅");
        p.el.addEventListener("click", () => {
          if (this.sceneId === "forest" && this.weather === "typhoon") return this.toast(`${icon("wind")} 風雨太大了，無法生火！`, 2000, "stone");
          if (this.sceneId === "forest" && this.flood >= (this.fw()?.flood.campfireOutH ?? 1)) return this.toast(`${icon("rain")} 營火泡在水裡，點不著了！`, 2000, "sky");
          if (p.state === "lit") {
            st.setPropState(p, "out");
            this.campfireUntil.delete(p);
          } else {
            st.setPropState(p, "lit");
            this.campfireUntil.set(p, performance.now() + this.campfireMs());
            this.floatText(icon("sparkle"), 0.45, "peach");
          }
          playBlip("pop");
        });
      }
    }
    if (sceneId === "forest") {
      this.initWeather();
      this.initFlyers(start);
    }
    if (sceneId === "graveyard") {
      this.gy = new GraveyardPlay({
        stage: st,
        pad: this.pad,
        toast: this.toast,
        float: (html, y, hue) => this.floatText(html, y, hue),
        props: () => this.props as GyProp[],
        addProp: (p) => {
          this.props.push(p as PlayProp);
          st.setProps([...this.extra, ...this.props]);
        },
        removeProp: (p) => {
          this.props = this.props.filter((q) => q !== p);
          st.setProps([...this.extra, ...this.props]);
        },
        balance: () => this.opts.balance?.() ?? 0,
        goPumpkinBoss: () => this.opts.goPumpkinBoss?.(),
      });
      this.gy.start(start, FIELD_PERIOD);
    }
    if (st.inSpace && !this.spaceHint) {
      this.spaceHint = true;
      this.toast(`${icon("star")} 方向鍵在太空中滑行，A 衝刺！小心黑洞～`, 3200, "lilac");
    } else if (!st.inSpace && !this.chargeHint) {
      this.chargeHint = true;
      this.toast(`${icon("sparkle")} 按住 ↓ 一下下，再按 A，可以跳更高！`, 3200, "mint");
    }
  }

  stop(): void {
    this.gy?.stop();
    this.gy = null;
    this.props = [];
    this.campfireUntil.clear();
    this.setCharged(false);
    this.sceneId = "";
    this.resetFlood();
    for (const f of this.flyers) f.el.remove();
    this.flyers = [];
    this.weatherLayer?.remove();
    this.floodLayer?.remove();
    this.weatherUi?.remove();
    this.weatherLayer = this.floodLayer = this.weatherUi = null;
    this.stage.el.classList.remove("gstage--rainy", "gstage--typhoon");
  }

  // ================= 森林天氣（數值：GameArt.sceneInfo.forest.weather） =================
  private fw(): SceneWeather | undefined {
    return GameArt.sceneInfo.forest?.weather;
  }
  private rainLevels(): RainLevel[] {
    return this.fw()?.rain.levels ?? [];
  }
  private rainLevel(): RainLevel {
    const L = this.rainLevels();
    return L[Math.max(0, Math.min(L.length - 1, this.rain))] ?? { id: "moderate", label: "中雨", streaks: 24, opacity: 0.75, speed: 1, tint: 0.16, floodRateH: 0, floodAfterMs: 0 };
  }
  private campfireMs(): number {
    return this.weather === "typhoon" ? 3500 : this.weather === "rainy" ? 6000 : CAMPFIRE_MS;
  }
  private saveWeather(): void {
    try {
      sessionStorage.setItem(WEATHER_KEY, `${this.weather}:${this.rain}`);
    } catch {
      // 忽略
    }
  }

  private initWeather(): void {
    const st = this.stage;
    const W = this.fw();
    this.floodLayer = document.createElement("div");
    this.floodLayer.className = "gstage-flood";
    this.floodLayer.hidden = true;
    this.floodLayer.innerHTML = `<div class="gstage-flood-wave"></div>`;
    st.world.appendChild(this.floodLayer);
    this.weatherLayer = document.createElement("div");
    this.weatherLayer.className = "gstage-weather";
    st.world.appendChild(this.weatherLayer);
    if (W) {
      st.floodFloatSubmerge = W.flood.floatSubmerge ?? st.floodFloatSubmerge;
      st.floodRiseH = W.flood.riseH ?? st.floodRiseH;
      st.floodWalkMult = W.flood.walkMult ?? st.floodWalkMult;
      st.floodBobH = W.flood.bobH ?? st.floodBobH;
      st.floodBobMs = W.flood.bobMs ?? st.floodBobMs;
    }
    // 天氣鈕（小朋友自己切換）：晴天／雨天／颱風天＋雨量 − ＋
    this.weatherUi = document.createElement("div");
    this.weatherUi.className = "scene-weather-ui";
    this.weatherUi.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (b?.dataset.w) this.setWeather(b.dataset.w as Weather);
    });
    this.weatherUi.addEventListener("input", (e) => {
      const t = e.target as HTMLInputElement;
      if (t.matches("[data-rain]")) this.setRain(Number(t.value));
    });
    // 面板上的操作不要讓角色移動（鍵盤方向鍵在滑桿上）
    this.weatherUi.addEventListener("keydown", (e) => e.stopPropagation());
    st.hud.appendChild(this.weatherUi);
    this.resetFlood();
    this.renderWeather();
  }

  /** 天氣面板：左上一列（分段鈕＋雨量滑桿；樣式同工作室「場景 → 天氣」） */
  private renderWeatherUi(): void {
    const ui = this.weatherUi;
    if (!ui) return;
    const W: [Weather, string, string][] = [
      ["sunny", "sun", "晴天"],
      ["rainy", "rain", "雨天"],
      ["typhoon", "wind", "颱風天"],
    ];
    const L = this.rainLevel();
    ui.innerHTML =
      `<div class="scene-seg" role="group" aria-label="天氣設定">${W.map(([id, ic, lab]) => `<button type="button" data-w="${id}" aria-pressed="${this.weather === id}" aria-label="${lab}">${icon(ic, "sm")}<span>${lab}</span></button>`).join("")}</div>` +
      (this.weather !== "sunny"
        ? `<label class="scene-range">${icon("rain", "sm")}<strong class="scene-rain-label">${L.label}</strong><input type="range" min="0" max="${this.rainLevels().length - 1}" step="1" value="${this.rain}" data-rain aria-label="雨量" aria-valuetext="${L.label}" /></label>`
        : "");
  }

  private renderWeather(ui = true): void {
    const st = this.stage;
    const layer = this.weatherLayer;
    if (ui) this.renderWeatherUi();
    if (!layer) return;
    st.el.classList.toggle("gstage--rainy", this.weather === "rainy");
    st.el.classList.toggle("gstage--typhoon", this.weather === "typhoon");
    layer.className = `gstage-weather gstage-weather--${this.weather}`;
    if (this.weather === "sunny") {
      layer.innerHTML = "";
      return;
    }
    const L = this.rainLevel();
    const typhoon = this.weather === "typhoon";
    const count = L.streaks + (typhoon ? this.fw()?.rain.typhoonExtraStreaks ?? 0 : 0);
    const dur = (typhoon ? 0.42 : 0.75) * L.speed;
    layer.style.setProperty("--rain-tint", String(Math.min(0.6, L.tint + (typhoon ? 0.1 : 0))));
    layer.style.setProperty("--rain-opacity", String(L.opacity));
    layer.style.setProperty("--rain-dur", `${dur.toFixed(2)}s`);
    let h = '<div class="g-rain-layer">';
    for (let i = 0; i < count; i++) h += `<div class="g-rain-streak" style="left:${((i * 100) / count + (i % 3) * 2.5).toFixed(1)}%;animation-delay:${(-((i * 0.37) % 1) * dur).toFixed(2)}s"></div>`;
    h += "</div>";
    if (typhoon) {
      h += '<div class="g-wind-layer">';
      for (const g of [
        { top: 16, width: 220, delay: 0 },
        { top: 38, width: 340, delay: 0.45 },
        { top: 60, width: 260, delay: 0.8 },
        { top: 82, width: 300, delay: 0.25 },
      ])
        h += `<div class="g-wind-gust" style="top:${g.top}%;width:${g.width}px;animation-delay:-${g.delay}s"></div>`;
      h += "</div>";
    }
    layer.innerHTML = h;
  }

  private setWeather(w: Weather): void {
    if (this.sceneId !== "forest" || w === this.weather) return;
    this.weather = w;
    this.heavyRainSince = 0;
    if (w !== "typhoon") this.windNotice = false;
    this.saveWeather();
    this.renderWeather();
    playBlip("tap");
    if (w === "typhoon") {
      for (const p of this.props) {
        if (p.kind === "campfire" && p.state !== "out") {
          this.stage.setPropState(p, "out");
          this.campfireUntil.delete(p);
        }
        if (p.kind === "flower" && p.state !== "bud") this.stage.setPropState(p, "bud");
      }
    }
    if (w === "sunny") this.toast(`${icon("sun")} 晴天：陽光普照，${this.flood > 0 ? "積水會慢慢退掉～" : "適合大自然探索！"}`, 2400, "sun");
    else if (w === "rainy") this.toast(`${icon("rain")} 雨天：可以調雨量，雨下太大太久會淹水喔～`, 2600, "sky");
    else this.toast(`${icon("wind")} 颱風天：順風飛馳、逆風難行，跳起來會被風吹走！`, 3000, "peach");
  }

  private setRain(level: number): void {
    const n = this.rainLevels().length;
    const v = Math.max(0, Math.min(n - 1, Math.round(level)));
    if (v === this.rain) return;
    this.rain = v;
    this.heavyRainSince = 0;
    this.saveWeather();
    // 拖曳中不重畫面板（只改文字），滑桿才不會中斷
    this.renderWeather(false);
    const lab = this.rainLevel().label;
    const t = this.weatherUi?.querySelector(".scene-rain-label");
    if (t) t.textContent = lab;
    this.weatherUi?.querySelector("[data-rain]")?.setAttribute("aria-valuetext", lab);
    playBlip("tap");
  }

  private resetFlood(): void {
    this.flood = 0;
    this.heavyRainSince = 0;
    this.floodNotice = false;
    this.floatNotice = false;
    this.wasFloating = false;
    this.stage.floodH = 0;
    this.renderFlood();
  }
  private renderFlood(): void {
    const fl = this.floodLayer;
    if (!fl) return;
    const show = this.sceneId === "forest" && this.flood > 0.001;
    fl.hidden = !show;
    if (show) fl.style.top = `${((0.88 - this.flood) * 100).toFixed(2)}%`;
  }
  private updateFlood(now: number, dt: number): void {
    const W = this.fw();
    if (!W || this.sceneId !== "forest") return;
    let rate: number;
    if (this.weather === "sunny") {
      rate = -W.flood.sunnyDrainH;
      this.heavyRainSince = 0;
    } else {
      const L = this.rainLevel();
      if (L.floodRateH > 0) {
        if (!this.heavyRainSince) this.heavyRainSince = now;
        rate = now - this.heavyRainSince >= L.floodAfterMs ? L.floodRateH : 0;
      } else {
        this.heavyRainSince = 0;
        rate = L.floodRateH;
      }
    }
    const before = this.flood;
    this.flood = Math.max(0, Math.min(W.flood.maxH, this.flood + rate * dt));
    if (this.flood !== before || this.stage.floodH !== this.flood) {
      this.stage.floodH = this.flood;
      this.renderFlood();
    }
    if (this.flood >= W.flood.noticeH && !this.floodNotice) {
      this.floodNotice = true;
      this.toast(`${icon("rain")} 雨下太大太久，森林開始淹水了！`, 2600, "sky");
    }
    if (this.flood <= 0 && before > 0) {
      this.floodNotice = false;
      this.floatNotice = false;
      this.toast(`${icon("sun")} 水退了，又可以在地上走路囉！`, 2200, "sun");
    }
    if (this.flood >= W.flood.campfireOutH)
      for (const p of this.props)
        if (p.kind === "campfire" && p.state === "lit") {
          this.stage.setPropState(p, "out");
          this.campfireUntil.delete(p);
        }
    const floating = this.stage.isFloating;
    if (floating && !this.wasFloating && !this.floatNotice) {
      this.floatNotice = true;
      this.toast(`${icon("sparkle")} 水太深了，你浮起來了！按 A 可以從水裡跳起來`, 3000, "sky");
    }
    this.wasFloating = floating;
  }

  // ================= 森林生物：白天蜜蜂、晚上蝙蝠；拿著大便樹枝會把牠們嚇跑 =================
  private initFlyers(start: number): void {
    const layer = this.stage.flyerLayer;
    if (!layer) return;
    const bees = [
      { x: 1.35, patrolMin: 0.6, patrolMax: 2.2, baseY: 72, speed: 0.1 },
      { x: 1.65, patrolMin: 1.1, patrolMax: 2.9, baseY: 86, speed: 0.085 },
      { x: 2.2, patrolMin: 1.6, patrolMax: 3.8, baseY: 68, speed: 0.11 },
    ];
    const bats = [
      { x: 4.8, patrolMin: 4.3, patrolMax: 5.7, baseY: 95, speed: 0.11 },
      { x: 5.3, patrolMin: 4.8, patrolMax: 6.2, baseY: 80, speed: 0.13 },
      { x: 5.8, patrolMin: 3.8, patrolMax: 5.5, baseY: 120, speed: 0.09 },
    ];
    const mk = (kind: "bee" | "bat", cfg: (typeof bees)[number], i: number, off: number): Flyer => {
      const el = document.createElement("div");
      el.className = `gstage-prop gstage-creature gstage-creature--${kind}`;
      el.style.width = kind === "bee" ? "46px" : "48px";
      el.style.height = kind === "bee" ? "40px" : "36px";
      el.style.display = "none";
      el.innerHTML = GameArt.prop(kind, { state: "up" });
      layer.appendChild(el);
      return { kind, id: i, el, x: cfg.x + off, yPx: cfg.baseY, dir: (i % 2 === 0 ? 1 : -1) as 1 | -1, wing: "up", lastWingAt: 0, patrolMin: cfg.patrolMin + off, patrolMax: cfg.patrolMax + off, baseY: cfg.baseY, speed: cfg.speed, chasing: false, attracted: false, reboundUntil: 0, fleeing: false };
    };
    this.flyers = [];
    // 前三段場域各一組
    for (let k = 0; k < 3; k++) {
      const off = start + k * FIELD_PERIOD;
      bees.forEach((c, i) => this.flyers.push(mk("bee", c, i, off)));
      bats.forEach((c, i) => this.flyers.push(mk("bat", c, i, off)));
    }
  }

  private holdingPoop(): boolean {
    const held = this.stage.currentLook?.held ?? "";
    return held === "poopstick" || held.includes("poop");
  }

  private updateFlyers(now: number, dt: number): void {
    if (!this.flyers.length) return;
    const st = this.stage;
    const hide = this.weather === "typhoon";
    const night = st.skyState.night > 0.5;
    const H = st.height;
    const W = st.width;
    const FEET = 0.88 * H;
    const span = st.charSpan();
    const vert = st.charVertical;
    const cx = st.charX * W;
    const poop = this.holdingPoop();
    const flowers = this.props.filter((p) => p.kind === "flower" && p.state === "bloom");
    const fireLit = this.props.some((p) => p.kind === "campfire" && p.state === "lit" && st.distanceTo(p) < 1.2);
    for (const f of this.flyers) {
      const active = !hide && (f.kind === "bee" ? !night : night);
      const sx = st.propScreenX({ id: f.kind, x: f.x });
      if (!active || sx < -W || sx > 2 * W) {
        f.el.style.display = "none";
        if (!active) continue;
      } else f.el.style.display = "";
      if (now - f.lastWingAt > (f.chasing || f.fleeing ? 65 : 115)) {
        f.lastWingAt = now;
        f.wing = f.wing === "up" ? "down" : "up";
        f.el.innerHTML = GameArt.prop(f.kind, { state: f.wing });
      }
      const flee = poop || (f.kind === "bat" && fireLit);
      const flower = f.kind === "bee" ? flowers.find((p) => Math.abs(p.x - f.x) < 1.2) : undefined;
      if (flee) {
        f.fleeing = true;
        f.chasing = false;
        f.attracted = false;
        f.dir = poop ? (sx < cx ? -1 : 1) : f.dir;
        f.x += f.dir * (0.24 + f.id * 0.05) * dt;
        f.yPx += (390 + f.id * 35) * dt;
      } else if (f.fleeing) {
        if (f.yPx > f.baseY + 15) f.yPx -= (115 + f.id * 20) * dt;
        else f.fleeing = false;
      } else if (flower) {
        f.attracted = true;
        f.chasing = false;
        f.x += (flower.x + (f.id - 1) * 0.04 - f.x) * Math.min(1, dt * 2.5);
        f.yPx += (42 + f.id * 6 - f.yPx) * Math.min(1, dt * 2.5);
      } else {
        f.attracted = false;
        const chase = f.kind === "bee" && Math.abs(sx - cx) < W * 0.42 && now > f.reboundUntil;
        if (chase) {
          f.chasing = true;
          f.dir = sx < cx ? 1 : -1;
          f.x += f.dir * f.speed * 1.65 * dt;
          f.yPx += (vert.feet + 52 + Math.sin(now * 0.012 + f.id) * 8 - f.yPx) * Math.min(1, dt * 3.8);
        } else {
          f.chasing = false;
          f.x += f.dir * f.speed * dt;
          if (f.x > f.patrolMax) {
            f.x = f.patrolMax;
            f.dir = -1;
          } else if (f.x < f.patrolMin) {
            f.x = f.patrolMin;
            f.dir = 1;
          }
          const amp = f.kind === "bee" ? 14 : 20;
          f.yPx += (f.baseY + Math.sin(now * (f.kind === "bee" ? 0.006 : 0.005) + f.id * 1.8) * amp - f.yPx) * Math.min(1, dt * 3);
        }
      }
      const w2 = f.kind === "bee" ? 23 : 24;
      f.el.style.transform = `translate(${(sx - w2).toFixed(1)}px, ${(FEET - f.yPx - (f.kind === "bee" ? 40 : 36)).toFixed(1)}px) scaleX(${f.dir < 0 ? -1 : 1})`;
      // 碰到角色：嚇一跳（拿大便樹枝、被花吸引、正在逃的不算）
      if (!f.fleeing && !poop && !f.attracted && now > this.scareUntil && now > f.reboundUntil && !st.isStunned) {
        const half = f.kind === "bee" ? 16 : 18;
        const xHit = sx + half >= span[0] && sx - half <= span[1];
        const yHit = f.yPx + (f.kind === "bee" ? 32 : 30) >= vert.feet && f.yPx <= vert.head;
        if (xHit && yHit) {
          this.scareUntil = now + 1500;
          if (f.kind === "bee") {
            f.reboundUntil = now + 2000;
            f.dir = (f.dir * -1) as 1 | -1;
            f.x += f.dir * 0.15;
          }
          st.stun(1000, "surprise");
          playBlip("trip");
          this.floatText("!", this.headTop() - 0.04, "peach");
        }
      }
    }
  }

  /** 每幀（場景裡與街上都呼叫；街上沒有場域道具，只處理蓄力） */
  tick(): void {
    const st = this.stage;
    const now = performance.now();
    const H = st.height;
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastT) / 1000));
    this.lastT = now;
    this.updateCharge(now);
    if (this.sceneId === "forest") {
      this.updateFlood(now, dt);
      this.updateFlyers(now, dt);
    }
    this.gy?.tick();
    // C 鍵：拿著魔拐杖或南瓜糖果桶才亮
    const c = this.specialHeld();
    if (c !== this.cOn) {
      this.cOn = c;
      this.pad.setActive({ c });
    }
    const typhoon = this.sceneId === "forest" && this.weather === "typhoon";
    for (const p of this.props) {
      const dist = st.distanceTo(p);
      if (dist > 1.5) continue;
      if (p.resetAt && now > p.resetAt && dist > 0.6) {
        p.resetAt = undefined;
        st.setPropState(p, p.kind === "chest" ? "closed" : "idle");
      }
      if (p.kind === "spring" && st.isFalling && dist < 0.045) {
        const topPx = st.propRect(p)?.top ?? 0.11 * H;
        if (this.lastJumpHeight > topPx && st.jumpHeight <= topPx) {
          const mult = Math.max(SPRING_MULT, this.consumeCharge() ? CHARGE_MULT : 1);
          st.setPropState(p, "compressed");
          st.bounce(mult);
          playBlip("jump");
          this.floatText(icon("sparkle"), 0.55, "mint");
          setTimeout(() => st.setPropState(p, "launched"), 90);
          p.resetAt = now + 700;
        }
      }
      if (p.kind === "flower") {
        const want = !typhoon && dist < 0.12 ? "bloom" : "bud";
        if (p.state !== want) st.setPropState(p, want);
      }
      if (p.kind === "campfire") {
        const drowned = this.flood >= (this.fw()?.flood.campfireOutH ?? 1);
        if (p.state === "out" && dist < 0.09 && !this.campfireUntil.has(p) && !typhoon && !drowned) {
          st.setPropState(p, "lit");
          this.campfireUntil.set(p, now + this.campfireMs());
          playBlip("pop");
          this.floatText(icon("sparkle"), 0.45, "peach");
        }
        const until = this.campfireUntil.get(p);
        if (p.state === "lit" && until && now >= until) {
          this.campfireUntil.delete(p);
          st.setPropState(p, "out");
          playBlip("pop");
        }
        // 熄滅後走遠了才可以再自動點燃
        if (p.state === "out" && !until && dist > 0.3) this.campfireUntil.delete(p);
      }
      if (p.kind === "chest" && !this.gy && p.state === "closed" && dist < 0.07) {
        st.setPropState(p, "open");
        p.resetAt = now + 6000;
        playBlip("pop");
        this.floatText(icon("gem"), 0.45, "lilac");
      }
    }
    this.lastJumpHeight = st.jumpHeight;
  }

  private specialHeld(): boolean {
    const h = this.stage.currentLook?.held;
    return h === "magiccane" || h === "pumpkinbucket";
  }
  /** 特技：魔拐杖（流星閃光）、南瓜糖果桶（糖果雨）；墓園的怪物會被嚇跑 3 秒 */
  special(): void {
    if (!this.specialHeld()) return;
    const st = this.stage;
    const held = st.currentLook.held;
    st.perform("wave");
    clearTimeout(this.specialTimer);
    this.specialTimer = window.setTimeout(() => st.perform(null), 1900);
    const c = st.charEl.getBoundingClientRect();
    const hr = st.hud.getBoundingClientRect();
    const cx = c.left - hr.left + c.width / 2;
    const cy = c.top - hr.top + c.height / 2;
    if (held === "magiccane") {
      playBlip("pop");
      magicCaneFx(st.hud, cx, cy);
    } else {
      playBlip("coin");
      candyRainFx(st.hud, cx, 0.88 * st.height);
    }
    this.gy?.special(held);
  }

  /** 拍照：森林的淹水水面、雨天／颱風天的天色與雨絲（同工作室；照片是定格，雨絲畫成斜線） */
  photoExtras(): ExportExtra[] {
    const out: ExportExtra[] = [];
    if (this.sceneId !== "forest") return out;
    const night = this.stage.skyState.night > 0.5;
    const root = getComputedStyle(document.documentElement);
    if (this.floodLayer && !this.floodLayer.hidden && this.flood > 0.001) {
      const v = (n: string) => root.getPropertyValue(`--g-forest-${night ? "night" : "day"}-${n}`).trim() || "#7FB7D9";
      const foam = v("flood-foam");
      let waves = "";
      for (let i = 0; i < 50; i++) waves += `<ellipse cx="${i * 2 + 1}" cy="1.2" rx="1" ry="1.2" fill="${foam}"/>`;
      out.push({
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="pfw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v("flood-water")}"/><stop offset="1" stop-color="${v("flood-water-deep")}"/></linearGradient></defs><rect x="0" y="1.2" width="100" height="98.8" fill="url(#pfw)"/>${waves}</svg>`,
        z: "top",
        box: [0, 0.88 - this.flood - 0.01, 1, 1],
        opacity: 0.78,
      });
    }
    if (this.weather !== "sunny" && this.weatherLayer) {
      const typhoon = this.weather === "typhoon";
      const wcs = getComputedStyle(this.weatherLayer);
      const tint = Number(wcs.getPropertyValue("--rain-tint")) || 0.16;
      const op = Number(wcs.getPropertyValue("--rain-opacity")) || 0.75;
      const dark = root.getPropertyValue("--g-forest-night-sky-top").trim() || "#1E2A44";
      const streak = typhoon ? root.getPropertyValue("--g-surface-raised").trim() || "#FFFFFF" : root.getPropertyValue("--g-sky-soft").trim() || "#D6ECF8";
      const n = this.weatherLayer.querySelectorAll(".g-rain-streak").length || 24;
      const dx = typhoon ? -3.2 : -1.5;
      let lines = "";
      for (let i = 0; i < n * 3; i++) {
        const x = ((i * 37) % 100) + (i % 3) * 1.3;
        const y = ((i * 53) % 96) - 4;
        lines += `<line x1="${x.toFixed(1)}" y1="${y}" x2="${(x + dx).toFixed(1)}" y2="${y + 6}" />`;
      }
      out.push({
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${dark}" opacity="${Math.min(0.6, tint)}"/><g stroke="${streak}" stroke-width="0.25" stroke-linecap="round" opacity="${op}">${lines}</g></svg>`,
        z: "top",
        box: [0, 0, 1, 1],
      });
    }
    return out;
  }

  /** 除錯：墓園玩法 */
  get graveyard(): GraveyardPlay | null {
    return this.gy;
  }

  /** 拍照、除錯用：目前的場域道具 */
  get playProps(): readonly StageProp[] {
    return this.props;
  }
}

/** 道具 id 是否存在（token 少了某個道具時不要當機） */
export function hasProp(id: string): boolean {
  return GameArt.props.some((d) => d.id === id);
}
