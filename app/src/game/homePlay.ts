// 我的家・在家玩（2026-11-08 使用者要求「希望在自己家裡可以走動或做各種事情、動作，像是躺在床上、坐在地上」）
// 房間放大到整個畫面，角色可以左右走（← → 鍵、畫面上的左右鍵、或直接點地板）；
// 走到家具前出現提示鈕，按 ↑／Enter／空白鍵、點提示鈕或直接點家具就做那件事：
//   床＝按 ↑ 躺上去睡覺（臉朝上、冒 Zzz、不蓋被子）、地毯＝按 ↓ 坐在地上、
//   玩具＝按 ↓ 一起玩（轉正面歡呼、玩具跳一下）、寵物＝按 ↓ 摸摸牠（轉正面開心、冒愛心、叫一聲）。
// 按鍵：統一按鍵 v2（VirtualPad：十字鍵在左下、ABCD 在右下；A 跳、B 按住跑；C、D 沒用到＝半透明）。開始走、跑、跳就起來。
// 拍照：開相機 → 取景框＋面向＋動作 → 按快門 → 倒數 3、2、1 → 拍（同小鎮相機）。不念英文（使用者要求）。
// 數值與文案：GameTokens.home.play；每款床躺下的位置：home.catalog[床].lie。
import { GameArt, GameTokens, icon, performablePoses, type Look, type View } from "./gameKit";
import { homeCfg, homeItem, homePlayCfg, type HomeLayout, type HomePlayAction } from "./homeStore";
import { playBlip, playPet, playStep } from "./townSfx";
import { VirtualPad, type PadKey } from "./virtualPad";
import { detectScreenLayout, isTouchScreen } from "./gameScreen";
import { countdownEnabled, countdownOn, setCountdownEnabled } from "./townPhoto";

type ActKind = "bed" | "rug" | "toy" | "pet";
interface Spot {
  kind: ActKind;
  a: HomePlayAction;
  lo: number;
  hi: number;
  /** 點家具時走到哪裡 */
  goX: number;
  /** 畫面上的家具元素（玩具跳、寵物冒愛心） */
  left: number;
  width: number;
}
/** 角色盒子的寬高比（GameArt.character 的 viewBox 120×170） */
const AR = 120 / 170;
/** 角色平常的高度（房間 %，同 town.css .tshop-me） */
const ME_H = 48;
/** 躺下時角色圖邊緣到身體的留白（盒子寬的比例） */
export const LIE_INSET = 0.28;

export interface HomePlayHost {
  root: HTMLElement; // .tshop（加 tshop--playing）
  room: HTMLElement; // .tshop-room
  scene: HTMLElement; // .tshop-scene（正方形房間，家具與角色的座標都是它的 %）
  me: HTMLElement; // .tshop-me
  look: () => Look;
  layout: () => HomeLayout;
  onTidy: () => void;
  onLeave: () => void;
  /** 拍照（倒數結束後呼叫；TownShop 組照片、閃光、預覽） */
  onPhoto: () => Promise<void> | void;
}

/** 拍照時的面向：前／右／後／左（同小鎮相機） */
const DIRS: { label: string; view: View; dir: 1 | -1 }[] = [
  { label: "前", view: "front", dir: 1 },
  { label: "右", view: "side", dir: 1 },
  { label: "後", view: "back", dir: 1 },
  { label: "左", view: "side", dir: -1 },
];
/** 各版面的按鍵大小（同 GameScreen：十字鍵每格、ABCD 直徑、間距） */
const PAD_SIZE = { phoneLand: [48, 50, 3], phonePort: [52, 54, 4], tabletPort: [68, 74, 6], tabletLand: [58, 64, 5], desktop: [52, 56, 4] } as const;

export class HomePlay {
  active = false;
  x: number;
  dir: 1 | -1 = 1;
  private view: View = "front";
  private pose = "idle";
  private eyes: string | null = null;
  private drawn = "";
  private ctl: { stop(): void } | null = null;
  private hold = 0;
  /** 跑：Shift／K／畫面 B 按住 */
  private running = false;
  /** 跳：離地高度（房間 %）與速度 */
  private y = 0;
  private vy = 0;
  private landUntil = 0;
  private target: number | null = null;
  private pending: Spot | null = null;
  /** 正在做的事：家具動作或動作面板的姿勢 */
  private doing: { kind: ActKind | "pose"; spot?: Spot } | null = null;
  private doingTimer = 0;
  private lying: { x: number; bottom: number; scale: number } | null = null;
  private hud: HTMLDivElement;
  /** 統一按鍵 v2（開始在家玩時建立） */
  private pad: VirtualPad | null = null;
  /** 相機 */
  private camOn = false;
  private shooting = false;
  private camBar: HTMLDivElement;
  private camFrame: HTMLDivElement;
  private walkBtns: HTMLDivElement;
  private hint: HTMLDivElement;
  private posePanel: HTMLDivElement;
  private zzz: HTMLDivElement;
  private raf = 0;
  private last = 0;
  private stepAt = 0;

  constructor(private h: HomePlayHost) {
    const P = homePlayCfg()!;
    const T = P.text;
    this.x = P.startX;
    this.hud = document.createElement("div");
    this.hud.className = "home-play-hud";
    this.hud.innerHTML = `
      <button type="button" class="gbtn g-h-lilac home-play-btn" data-hp="pose" aria-pressed="false">${icon("sparkle")}<span>${T.pose}</span></button>
      <button type="button" class="gbtn g-h-sun home-play-btn" data-hp="photo">${icon("camera")}<span>${T.photo}</span></button>
      <button type="button" class="gbtn g-h-sky home-play-btn" data-hp="tidy">${icon("edit")}<span>${T.tidy}</span></button>
      <button type="button" class="gbtn g-h-mint home-play-btn" data-hp="leave">${icon("back")}<span>${T.leave}</span></button>`;
    this.walkBtns = document.createElement("div");
    this.walkBtns.className = "home-walk";
    this.walkBtns.innerHTML = `<div class="home-pad-zone home-pad-zone--dpad"></div><div class="home-pad-zone home-pad-zone--act"></div>`;
    this.camBar = document.createElement("div");
    this.camBar.className = "studio-camera-bar home-cam-bar";
    this.camBar.hidden = true;
    this.camFrame = document.createElement("div");
    this.camFrame.className = "studio-frame home-cam-frame";
    this.camFrame.hidden = true;
    this.hint = document.createElement("div");
    this.hint.className = "home-hint g-bubble";
    this.hint.hidden = true;
    this.posePanel = document.createElement("div");
    this.posePanel.className = "home-pose";
    this.posePanel.hidden = true;
    this.posePanel.setAttribute("role", "group");
    this.posePanel.setAttribute("aria-label", T.pose);
    this.zzz = document.createElement("div");
    this.zzz.className = "home-zzz";
    this.zzz.hidden = true;
    this.zzz.setAttribute("aria-hidden", "true");
    const z = `<svg viewBox="0 0 16 20"><path d="M2.5 3 H13.5 L2.5 17 H13.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    this.zzz.innerHTML = `<span>${z}</span><span>${z}</span><span>${z}</span>`;

    this.hud.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-hp]");
      if (!b) return;
      const v = b.dataset.hp;
      if (v === "pose") return this.togglePoses();
      if (v === "photo") return this.toggleCamera(true);
      if (v === "tidy") return this.h.onTidy();
      if (v === "leave") return this.h.onLeave();
    });
    this.camBar.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!b) return;
      if (b.hasAttribute("data-countdown")) {
        setCountdownEnabled(!countdownEnabled());
        this.renderCamBar();
        playBlip("tap");
      } else if (b.hasAttribute("data-cam-close")) this.toggleCamera(false);
      else if (b.hasAttribute("data-shutter")) void this.shoot();
    });
    this.hint.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-k]");
      if (b) this.useSpot(b.dataset.k === "down" ? "down" : "up");
    });
    this.posePanel.addEventListener("click", (e) => {
      const fb = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-face]");
      if (fb) {
        this.setFace(Number(fb.dataset.face));
        playBlip("tap");
        return this.renderPoses();
      }
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-pose]");
      if (!b) return;
      const p = b.dataset.pose!;
      if (this.doing?.kind === "pose" && this.pose === p) this.standUp();
      else this.doPose(p);
      playBlip("tap");
      this.renderPoses();
    });
    // 點房間：點家具（data-hslot）＝走過去做事；點其他地方＝走過去
    this.onSceneClick = this.onSceneClick.bind(this);
  }

  // ================= 開始／結束 =================
  start(): void {
    if (this.active) return;
    this.active = true;
    this.h.root.classList.add("tshop--playing");
    this.h.room.append(this.hud, this.walkBtns, this.hint, this.posePanel, this.camBar);
    this.h.scene.append(this.zzz, this.camFrame);
    this.makePad();
    this.h.scene.addEventListener("click", this.onSceneClick);
    this.x = Math.max(homePlayCfg()!.minX, Math.min(homePlayCfg()!.maxX, this.x));
    this.view = "front";
    this.pose = "idle";
    this.drawn = "";
    this.draw();
    this.last = performance.now();
    const loop = (t: number) => {
      if (!this.active) return;
      this.tick(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.standUp(true);
    this.hold = 0;
    this.target = null;
    this.pending = null;
    this.h.root.classList.remove("tshop--playing");
    this.h.scene.removeEventListener("click", this.onSceneClick);
    if (this.camOn) this.toggleCamera(false);
    this.pad?.destroy();
    this.pad = null;
    window.removeEventListener("resize", this.sizePad);
    this.hud.remove();
    this.walkBtns.remove();
    this.camBar.remove();
    this.camFrame.remove();
    this.hint.remove();
    this.posePanel.remove();
    this.zzz.remove();
    this.ctl?.stop();
    this.ctl = null;
    // 角色回到原本的位置（交給 TownShop 重畫）
    const me = this.h.me;
    me.style.left = me.style.bottom = me.style.height = me.style.transform = "";
    me.classList.remove("is-lying");
  }

  // ================= 按鍵 =================
  /** 統一按鍵 v2：十字鍵＋ABCD 全部顯示；C、D 在家裡沒用到＝半透明。鍵盤（方向鍵、空白／J＝A、Shift／K＝B）也由 VirtualPad 處理 */
  private makePad(): void {
    const pad = new VirtualPad({ v2: true });
    pad.setActive({ up: true, down: true, left: true, right: true, a: true, b: true, c: false, d: false });
    this.walkBtns.querySelector(".home-pad-zone--dpad")!.appendChild(pad.dpadEl);
    this.walkBtns.querySelector(".home-pad-zone--act")!.appendChild(pad.actionsEl);
    pad.on((k, on) => this.onPad(k, on));
    this.pad = pad;
    this.sizePad();
    window.addEventListener("resize", this.sizePad);
  }
  private sizePad = (): void => {
    const lay = detectScreenLayout(window.innerWidth, window.innerHeight, isTouchScreen());
    const [d, a, g] = PAD_SIZE[lay];
    this.pad?.setSizes(d, a, g);
    this.walkBtns.dataset.layout = lay;
  };

  private onPad(k: PadKey, on: boolean): void {
    if (!this.active || this.shooting) return;
    const pad = this.pad!;
    if (k === "left" || k === "right") {
      const d = pad.down.right && !pad.down.left ? 1 : pad.down.left && !pad.down.right ? -1 : on ? (k === "left" ? -1 : 1) : 0;
      if (d) {
        if (d !== this.hold) this.startWalk(d);
      } else this.hold = 0;
      return;
    }
    if (k === "b") return this.setRun(on);
    if (!on) return;
    if (k === "a") return this.jump();
    if (k === "up") return this.useSpot("up");
    if (k === "down") return this.useSpot("down");
  }

  /** 鍵盤（TownShop 轉過來；處理了回傳 true）。方向鍵、A、B 交給 VirtualPad，這裡只擋掉 TownShop 原本的轉身、處理 Enter／Esc */
  key(e: KeyboardEvent, down: boolean): boolean {
    if (!this.active) return false;
    const k = e.key;
    if (k === "Escape") {
      if (!down) return true;
      if (this.camOn) {
        this.toggleCamera(false);
        return true;
      }
      return false; // TownShop 關掉我的家
    }
    if (k === "Enter") {
      if (!down || (e.target as HTMLElement)?.closest?.("button")) return down ? false : true;
      e.preventDefault();
      if (this.doing) this.standUp();
      else {
        const sp = this.spotsAt()[0];
        if (sp) this.act(sp);
      }
      return true;
    }
    return k.startsWith("Arrow") || k === " " || k === "Shift" || /^[abcdijkl]$/i.test(k);
  }

  // ================= 走路 =================
  private startWalk(d: 1 | -1): void {
    this.hold = d;
    this.target = null;
    this.pending = null;
    if (this.doing) this.standUp();
  }

  private setRun(on: boolean): void {
    this.running = on;
  }

  /** 跳（在床上、坐著時先起來） */
  jump(): void {
    if (this.y > 0.01 || this.vy !== 0) return;
    if (this.doing) this.standUp(true);
    const P = homePlayCfg()!;
    this.vy = P.jumpV ?? 95;
    this.y = 0.01;
    playBlip("jump");
  }

  private walkTo(x: number, then: Spot | null): void {
    const P = homePlayCfg()!;
    if (this.doing) this.standUp();
    this.target = Math.max(P.minX, Math.min(P.maxX, x));
    this.pending = then;
    this.hold = 0;
  }

  private onSceneClick(e: Event): void {
    if (!this.active) return;
    const el = e.target as HTMLElement;
    if (this.shooting || el.closest(".home-hint, .home-pose, .home-play-hud, .home-walk, .home-cam-bar")) return;
    const pe0 = e as MouseEvent;
    // 家具可能被角色擋住：點到的位置底下有家具就算點家具
    const slotBtn =
      el.closest<HTMLElement>("[data-hslot]") ??
      (document.elementsFromPoint?.(pe0.clientX, pe0.clientY) ?? []).map((n) => (n as HTMLElement).closest?.<HTMLElement>("[data-hslot]")).find((n) => n && this.spots().some((s) => s.a.slot === n.dataset.hslot)) ??
      null;
    if (slotBtn) {
      e.stopPropagation();
      const sp = this.spots().find((s) => s.a.slot === slotBtn.dataset.hslot);
      if (sp) return this.walkTo(sp.goX, sp);
    }
    const r = this.h.scene.getBoundingClientRect();
    const pe = e as MouseEvent;
    if (r.width > 0) this.walkTo(((pe.clientX - r.left) / r.width) * 100, null);
  }

  private tick(t: number): void {
    const P = homePlayCfg()!;
    const dt = Math.min(0.05, Math.max(0, (t - this.last) / 1000));
    this.last = t;
    let v = 0;
    if (this.hold) v = this.hold;
    else if (this.target != null) {
      const d = this.target - this.x;
      if (Math.abs(d) < 0.8) {
        this.x = this.target;
        this.target = null;
        const sp = this.pending;
        this.pending = null;
        if (sp) this.act(sp);
      } else v = d > 0 ? 1 : -1;
    }
    // 跳：離地高度
    const air = this.y > 0 || this.vy !== 0;
    if (air) {
      this.vy -= (P.gravity ?? 320) * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.landUntil = t + 160;
        playBlip("land");
      }
    }
    const run = this.running && !!v;
    if (v) {
      this.dir = v > 0 ? 1 : -1;
      let step = v * P.speed * (run ? P.runMult ?? 1.8 : 1) * dt;
      // 走向目標：不要走過頭（一幀走太遠會在目標兩邊來回）
      if (this.target != null && Math.abs(step) > Math.abs(this.target - this.x)) step = this.target - this.x;
      this.x = Math.max(P.minX, Math.min(P.maxX, this.x + step));
      if ((this.x <= P.minX && v < 0) || (this.x >= P.maxX && v > 0)) {
        if (this.target != null) this.target = this.x;
      }
      this.view = "side";
      this.pose = run ? "run" : "walk";
      if (!air && t - this.stepAt > (run ? 220 : 330)) {
        this.stepAt = t;
        playStep(run);
      }
    } else if (!this.doing && (this.pose === "walk" || this.pose === "run")) {
      this.pose = "idle";
    }
    // 空中／落地的動作（蓋過走路）
    if (this.y > 0 || this.vy !== 0) {
      this.pose = this.vy > 0 ? "jump" : "fall";
      if (this.view === "back") this.view = "side";
    } else if (t < this.landUntil) this.pose = "land";
    else if (!this.doing && !v && (this.pose === "jump" || this.pose === "fall" || this.pose === "land")) this.pose = "idle";
    this.place();
    this.draw();
    this.updateHint(!v);
  }

  // ================= 畫角色 =================
  private draw(): void {
    const key = `${this.pose}|${this.view}|${this.dir}|${this.eyes ?? ""}`;
    if (key === this.drawn) return;
    this.drawn = key;
    this.ctl?.stop();
    const look = this.eyes ? ({ ...this.h.look(), eyes: this.eyes } as Look) : this.h.look();
    this.h.me.innerHTML = GameArt.character({ ...look, view: this.view, facing: this.dir < 0 ? "left" : "right", pose: this.pose });
    const svg = this.h.me.querySelector("svg");
    this.ctl = svg ? GameArt.animate(svg as SVGElement, this.pose) : null;
  }

  private place(): void {
    const me = this.h.me;
    if (this.lying) {
      const L = this.lying;
      const H = ME_H * L.scale;
      const W = H * AR;
      me.classList.add("is-lying");
      me.style.height = `${H}%`;
      me.style.left = `${L.x}%`;
      // 轉 90° 後，看起來的高度＝原本的寬度：讓身體底部剛好在床墊上
      // 角色圖的左右留白約 28%：往下補，讓手臂、身體貼到床墊
      me.style.bottom = `${(L.bottom - (H - W) / 2 - W * LIE_INSET).toFixed(2)}%`;
      me.style.transform = "translateX(-50%) rotate(-90deg)";
      return;
    }
    me.classList.remove("is-lying");
    me.style.height = "";
    me.style.bottom = "";
    me.style.transform = "";
    me.style.left = `${this.x.toFixed(2)}%`;
    if (this.y > 0) {
      const sh = this.h.scene.getBoundingClientRect().height;
      me.style.transform = `translateX(-50%) translateY(${(-(this.y / 100) * sh).toFixed(1)}px)`;
    }
  }

  // ================= 家具熱點 =================
  private spots(): Spot[] {
    const P = homePlayCfg()!;
    const C = homeCfg();
    const lay = this.h.layout();
    const out: Spot[] = [];
    for (const kind of ["toy", "pet", "bed", "rug"] as ActKind[]) {
      const a = P.actions[kind];
      if (!a) continue;
      const s = C.slots.find((x) => x.id === a.slot);
      if (!s) continue;
      const it = homeItem(lay.slots[s.id]) ?? homeItem(C.defaults[s.id]);
      if (!it || it.none) continue;
      const l = s.left ?? 0;
      const w = s.width ?? 10;
      let lo = l;
      let hi = l + w;
      let goX = l + w / 2;
      if (kind === "toy" || kind === "pet") {
        lo = l - 4;
        hi = l + w + 4;
        // 站在旁邊（不要站在玩具、寵物上）
        goX = l + w + 5 <= P.maxX ? l + w + 5 : l - 5;
      } else if (kind === "bed") {
        lo = l + 3;
        hi = l + w - 3;
        goX = it.lie?.x ?? l + w / 2;
      } else {
        lo = l + 2;
        hi = l + w - 2;
        goX = Math.max(lo, Math.min(hi, this.x));
      }
      out.push({ kind, a, lo, hi, goX: Math.max(P.minX, Math.min(P.maxX, goX)), left: l, width: w });
    }
    return out;
  }

  /** 站的位置可以做的事：↑、↓ 各取一個（同一個鍵有好幾個重疊時，取中心最近的；例如床前面的玩具） */
  private spotsAt(): Spot[] {
    const here = this.spots().filter((s) => this.x >= s.lo && this.x <= s.hi);
    const best = (k: "up" | "down") =>
      here.filter((s) => (s.a.key ?? "up") === k).sort((a, b) => Math.abs(a.left + a.width / 2 - this.x) - Math.abs(b.left + b.width / 2 - this.x))[0];
    return [best("up"), best("down")].filter((s): s is Spot => !!s);
  }

  private updateHint(still: boolean): void {
    const list = still && !this.doing && !this.camOn && !this.shooting && this.target == null && this.y === 0 ? this.spotsAt() : [];
    if (!list.length) {
      this.hint.hidden = true;
      return;
    }
    const sig = list.map((s) => s.kind).join(",");
    if (this.hint.dataset.k !== sig) {
      this.hint.dataset.k = sig;
      const tip = homePlayCfg()!.text.hint;
      this.hint.innerHTML = list
        .map((sp) => {
          const k = sp.a.key === "down" ? "down" : "up";
          return `<button type="button" class="home-hint-btn" data-k="${k}" aria-label="${sp.a.label}（${tip}）"><span class="home-hint-key">${k === "down" ? "↓" : "↑"}</span>${icon(sp.a.icon, "sm")}<span>${sp.a.label}</span></button>`;
        })
        .join("");
    }
    this.hint.hidden = false;
    this.hint.style.left = `${this.sceneToRoomX(this.x)}px`;
    this.hint.style.bottom = `${this.sceneToRoomY(ME_H + 6)}px`;
  }

  /** 房間座標（正方形 scene 的 %）→ .tshop-room 的 px */
  private sceneToRoomX(pct: number): number {
    const r = this.h.room.getBoundingClientRect();
    const s = this.h.scene.getBoundingClientRect();
    return s.left - r.left + (s.width * pct) / 100;
  }
  private sceneToRoomY(pctFromBottom: number): number {
    const r = this.h.room.getBoundingClientRect();
    const s = this.h.scene.getBoundingClientRect();
    return r.bottom - s.bottom + (s.height * pctFromBottom) / 100;
  }

  /** 按 ↑／↓（key）或點提示鈕（沒有 key）：床、玩具、寵物用 ↑，地毯用 ↓；正在做事時按 ↑／↓ 就起來 */
  private useSpot(key?: "up" | "down"): void {
    if (this.doing) return this.standUp();
    if (this.y > 0) return;
    const sp = this.spotsAt().find((s) => (s.a.key ?? "up") === (key ?? "up"));
    if (sp) this.act(sp);
  }

  // ================= 做事 =================
  private act(sp: Spot): void {
    clearTimeout(this.doingTimer);
    this.hint.hidden = true;
    const C = homeCfg();
    const lay = this.h.layout();
    if (sp.kind === "bed") {
      const it = homeItem(lay.slots.bed) ?? homeItem(C.defaults.bed);
      const L = it?.lie ?? { x: sp.left + sp.width / 2, bottom: 34, scale: 0.8, cover: 0.35 };
      this.x = L.x;
      this.lying = { x: L.x, bottom: L.bottom, scale: L.scale };
      // 臉朝上躺：側面（面向右）再轉 -90°，頭在床頭（左）、臉朝天花板；不蓋被子（使用者要求）
      this.view = "side";
      this.dir = 1;
      this.pose = GameArt.poses.includes(sp.a.pose) ? sp.a.pose : "idle";
      this.eyes = "happy"; // 閉著眼睛
      this.doing = { kind: "bed", spot: sp };
      // Zzz：頭的位置（床的左邊、身體上方）
      const H = ME_H * L.scale;
      this.zzz.style.left = `${(L.x - H * 0.42).toFixed(2)}%`;
      this.zzz.style.bottom = `${(L.bottom + H * AR * 0.55).toFixed(2)}%`;
      this.zzz.hidden = false;
      playBlip("pop");
    } else if (sp.kind === "rug") {
      this.view = "front";
      this.pose = GameArt.poses.includes(sp.a.pose) ? sp.a.pose : "idle";
      this.doing = { kind: "rug", spot: sp };
      playBlip("land");
    } else if (sp.kind === "toy") {
      // 轉正面做開心的動作（使用者要求）
      this.view = "front";
      this.dir = 1;
      this.eyes = "happy";
      this.pose = GameArt.poses.includes(sp.a.pose) ? sp.a.pose : "cheer";
      this.doing = { kind: "toy", spot: sp };
      this.bounce(sp.a.slot);
      playBlip("pop");
      this.doingTimer = window.setTimeout(() => this.standUp(), 1600);
    } else if (sp.kind === "pet") {
      this.view = "front";
      this.dir = 1;
      this.eyes = "happy";
      this.pose = GameArt.poses.includes(sp.a.pose) ? sp.a.pose : "cheer";
      this.doing = { kind: "pet", spot: sp };
      const it = homeItem(lay.slots[sp.a.slot]);
      this.hearts(sp);
      this.bounce(sp.a.slot);
      playPet(/cat|orange|siamese/.test(it?.id ?? "") ? "cat" : "dog");
      this.doingTimer = window.setTimeout(() => this.standUp(), 1800);
    }
    this.place();
    this.draw();
  }

  private doPose(p: string): void {
    clearTimeout(this.doingTimer);
    if (this.lying) this.standUp(true);
    this.target = null;
    this.pending = null;
    this.hold = 0;
    this.pose = p;
    this.doing = { kind: "pose" };
    this.place();
    this.draw();
  }

  /** 起來：恢復站著（可以走） */
  standUp(silent = false): void {
    clearTimeout(this.doingTimer);
    const wasLying = !!this.lying;
    this.lying = null;
    this.eyes = null;
    this.doing = null;
    this.zzz.hidden = true;
    if (this.pose !== "walk") this.pose = "idle";
    if (wasLying) {
      // 從床上下來：站在床前
      this.view = "front";
      if (!silent) playBlip("jump");
    }
    if (!this.active) return;
    this.place();
    this.draw();
    this.renderPoses();
  }

  private bounce(slotId: string): void {
    const el = this.h.scene.querySelector<HTMLElement>(`.home-decor [data-hslot="${slotId}"], .home-decor .home-slot--${slotId}`);
    if (!el) return;
    el.classList.remove("home-slot--hop");
    void el.offsetWidth;
    el.classList.add("home-slot--hop");
    window.setTimeout(() => el.classList.remove("home-slot--hop"), 900);
  }

  private hearts(sp: Spot): void {
    const box = document.createElement("div");
    box.className = "home-hearts";
    box.setAttribute("aria-hidden", "true");
    box.style.left = `${(sp.left + sp.width / 2).toFixed(2)}%`;
    box.style.bottom = `${(sp.width * 0.9 + 4).toFixed(2)}%`;
    box.innerHTML = [0, 1, 2].map((i) => `<span style="--i:${i}">${icon("heart", "md")}</span>`).join("");
    this.h.scene.appendChild(box);
    window.setTimeout(() => box.remove(), 1700);
  }

  // ================= 動作面板 =================
  private togglePoses(): void {
    if (this.camOn) return;
    this.posePanel.hidden = !this.posePanel.hidden;
    this.hud.querySelector('[data-hp="pose"]')?.setAttribute("aria-pressed", String(!this.posePanel.hidden));
    this.renderPoses();
  }
  private renderPoses(): void {
    if (this.posePanel.hidden) return;
    const cur = this.doing?.kind === "pose" ? this.pose : null;
    const list = performablePoses().filter((p) => !["walk", "run", "fall", "land", "parachute", "fly"].includes(p));
    const face = this.camOn
      ? `<p class="g-t-label">${icon("user", "sm")} 面向</p><div class="studio-seg town-cam-face" role="group" aria-label="面向">${DIRS.map((d, i) => `<button type="button" data-face="${i}" aria-pressed="${this.faceIndex() === i}">${d.label}</button>`).join("")}</div><p class="g-t-label town-perform-seq">${icon("sparkle", "sm")} 動作</p>`
      : "";
    this.posePanel.classList.toggle("home-pose--cam", this.camOn);
    this.posePanel.innerHTML = `${face}<div class="studio-poses home-poses">${list
      .map((p) => `<button type="button" class="studio-pose" data-pose="${p}" aria-pressed="${cur === p}">${GameTokens.motion.poses[p]?.label ?? p}</button>`)
      .join("")}</div>`;
  }

  // ================= 拍照用：現在的樣子 =================
  /** 角色目前的位置與動作（房間比例 0–1）；躺床時一起給被子的範圍 */
  // ================= 相機 =================
  private faceIndex(): number {
    if (this.view === "front") return 0;
    if (this.view === "back") return 2;
    return this.dir < 0 ? 3 : 1;
  }
  private setFace(i: number): void {
    const d = DIRS[i] ?? DIRS[0];
    if (this.lying || (this.doing && this.doing.kind !== "pose")) this.standUp(true);
    this.view = d.view;
    this.dir = d.dir;
    this.draw();
  }
  private renderCamBar(): void {
    const t = (GameTokens as any).town?.camera?.text ?? {};
    this.camBar.innerHTML = `
      <button type="button" class="studio-seg-toggle" data-countdown aria-pressed="${countdownEnabled()}">${icon("timer", "sm")} ${t.countdown ?? "倒數"}</button>
      <button type="button" class="g-iconbtn g-h-sun studio-shutter" data-shutter aria-label="${t.shutter ?? "按下快門"}">${icon("camera", "lg")}</button>
      <button type="button" class="g-iconbtn g-h-stone" data-cam-close aria-label="${t.close ?? "關閉相機"}">${icon("close")}</button>`;
  }
  /** 開／關相機：取景框、上方快門列、左邊面向＋動作；右上角按鈕先收起來 */
  toggleCamera(on: boolean): void {
    if (this.camOn === on) return;
    this.camOn = on;
    this.h.root.classList.toggle("tshop--cam", on);
    this.camBar.hidden = this.camFrame.hidden = !on;
    this.hud.hidden = on;
    // 相機開著：按鍵先收起來（面向、動作用左邊面板擺；要走動先關相機），不擋取景
    this.walkBtns.hidden = on;
    this.hold = 0;
    this.setRun(false);
    this.pad?.releaseAll();
    this.posePanel.hidden = !on;
    this.hud.querySelector('[data-hp="pose"]')?.setAttribute("aria-pressed", "false");
    if (on) {
      this.renderCamBar();
      this.hint.hidden = true;
    }
    this.renderPoses();
    playBlip("tap");
  }
  /** 按快門：收起相機介面 → 倒數 → 拍 → 回到相機 */
  private async shoot(): Promise<void> {
    if (this.shooting) return;
    this.shooting = true;
    this.hold = 0;
    this.target = null;
    this.setRun(false);
    this.pad?.releaseAll();
    this.camBar.hidden = this.camFrame.hidden = this.posePanel.hidden = true;
    this.walkBtns.hidden = true;
    const t = (GameTokens as any).town?.camera?.text ?? {};
    await countdownOn(this.h.room, t.tapSkip ?? "點一下直接拍");
    try {
      if (this.active) await this.h.onPhoto();
    } finally {
      this.shooting = false;
      this.walkBtns.hidden = this.camOn;
      if (this.active && this.camOn) {
        this.camBar.hidden = this.camFrame.hidden = this.posePanel.hidden = false;
        this.renderPoses();
      }
    }
  }

  photoState(): { x: number; pose: string; view: View; facing: "left" | "right"; eyes?: string; lie?: { x: number; bottom: number; scale: number; cover: number } } {
    const C = homeCfg();
    const it = this.lying ? homeItem(this.h.layout().slots.bed) ?? homeItem(C.defaults.bed) : undefined;
    return {
      x: this.x / 100,
      pose: this.pose === "walk" || this.pose === "run" ? "idle" : this.pose,
      view: this.view,
      facing: this.dir < 0 ? "left" : "right",
      eyes: this.eyes ?? undefined,
      lie: this.lying && it?.lie ? it.lie : undefined,
    };
  }
}
