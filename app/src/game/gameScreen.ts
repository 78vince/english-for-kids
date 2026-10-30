// GameScreen：所有「我的角色」遊戲共用的版面（2026-10-28，docs/GAME-PRODUCTION-SPEC.md §6.4、game-tokens layout.screen）。
// 依裝置自動切五種版面，按鍵只出現在「操作區」，四周留間距、不蓋遊戲畫面：
//   phoneLand  手機橫放（高 ≤ 500）：左欄＝返回、頭像（上）＋十字鍵（下）；中間 16:9；右欄＝代幣、音效、暫停（上）＋ABCD（下）
//   phonePort  手機直放（寬 < 600）：上方資訊列；16:9 畫面；下方操作區（十字鍵左、ABCD 右）；「橫放更順手」提示
//   tabletPort 平板直放：同手機直放，按鍵放大
//   tabletLand 平板橫放：上方資訊列；16:9 畫面；下方操作區
//   desktop    電腦（沒有觸控、寬 ≥ 1024）：同平板橫放，另加一行鍵盤說明
// 用法：
//   const pad = new VirtualPad({ v2: true });
//   const screen = new GameScreen(root, { pad, hudLeft: [backBtn, who], hudRight: [coins, sound, pause], strip });
//   const stage = new StageController(screen.canvas, pad, {...});   // 遊戲畫面放進 screen.canvas（固定 16:9）
//   pad.setActive({ up: false, down: false });                       // 這款遊戲沒用到的鍵 → 半透明
// 尺寸、判斷條件都讀 GameTokens.layout.screen，不要在遊戲裡寫死。

import "./gameScreen.css";
import { GameTokens } from "./gameKit";
import type { VirtualPad } from "./virtualPad";

export type ScreenLayout = "phoneLand" | "phonePort" | "tabletLand" | "tabletPort" | "desktop";

interface ModeSpec {
  label: string;
  dpad: number;
  act: number;
  dpadGap: number;
  rails?: { left: number; right: number };
  zonePadding?: [number, number];
  canvasMaxWidth?: number;
  /** 計時進度（strip）放在資訊列中間，不另外佔一列（放不下時自動回到畫面上方） */
  stripInHud?: boolean;
}

const FALLBACK = {
  detect: { phoneLandMaxHeight: 500, tabletMinWidth: 600, desktopMinWidth: 1024 },
  modes: {
    phoneLand: { label: "手機橫放", dpad: 56, act: 56, dpadGap: 4, rails: { left: 188, right: 196 } },
    phonePort: { label: "手機直放", dpad: 56, act: 56, dpadGap: 4, zonePadding: [16, 0] },
    tabletPort: { label: "平板直放", dpad: 72, act: 80, dpadGap: 8, zonePadding: [16, 16] },
    tabletLand: { label: "平板橫放", dpad: 58, act: 64, dpadGap: 5, zonePadding: [4, 24], stripInHud: true },
    desktop: { label: "電腦", dpad: 56, act: 60, dpadGap: 4, zonePadding: [4, 24], canvasMaxWidth: 1100, stripInHud: true },
  } as Record<ScreenLayout, ModeSpec>,
};

function spec(): typeof FALLBACK {
  const s = (GameTokens as any)?.layout?.screen;
  if (!s?.detect || !s?.modes) return FALLBACK;
  return { detect: { ...FALLBACK.detect, ...s.detect }, modes: { ...FALLBACK.modes, ...s.modes } };
}

export const SCREEN_LAYOUT_LABEL: Record<ScreenLayout, string> = {
  phoneLand: "手機橫放",
  phonePort: "手機直放",
  tabletLand: "平板橫放",
  tabletPort: "平板直放",
  desktop: "電腦",
};

/** 觸控裝置：主要指標是手指，或沒有 hover（手機、平板） */
export function isTouchScreen(): boolean {
  if (typeof matchMedia !== "function") return false;
  return matchMedia("(pointer: coarse)").matches || !matchMedia("(hover: hover)").matches;
}

/** 依寬高與是否觸控決定版面（判斷條件見 game-tokens layout.screen.detect） */
export function detectScreenLayout(w: number, h: number, touch: boolean): ScreenLayout {
  const d = spec().detect;
  if (!touch && w >= d.desktopMinWidth) return "desktop";
  if (w > h) return h <= d.phoneLandMaxHeight ? "phoneLand" : "tabletLand";
  return w < d.tabletMinWidth ? "phonePort" : "tabletPort";
}

export interface GameScreenAudit {
  layout: ScreenLayout;
  canvas: { w: number; h: number };
  keys: { key: string; inactive: boolean; label: string; overlapsCanvas: boolean; offscreen: boolean }[];
  /** 空陣列＝通過 */
  problems: string[];
}

export interface GameScreenOptions {
  /** 統一按鍵 v2（new VirtualPad({ v2: true })） */
  pad: VirtualPad;
  /** 資訊列左側（返回鍵、頭像＋名字）；手機橫放時放在左欄上方 */
  hudLeft?: HTMLElement[];
  /** 資訊列右側（代幣、音效、暫停）；手機橫放時放在右欄上方 */
  hudRight?: HTMLElement[];
  /** 畫面上方細列（計時＋進度）；沒有就不顯示 */
  strip?: HTMLElement;
  /** 直放時顯示「橫放更順手」（預設 true） */
  rotateHint?: boolean;
  /** 測試用：強制版面（遊戲實驗室的版面測試頁） */
  forceLayout?: () => ScreenLayout | null;
}

export class GameScreen {
  readonly el: HTMLDivElement;
  /** 遊戲畫面（固定 16:9），把舞台放在這裡面 */
  readonly canvas: HTMLDivElement;
  layout: ScreenLayout = "phoneLand";
  onLayoutChange?: (layout: ScreenLayout) => void;

  private o: GameScreenOptions;
  private hudL: HTMLDivElement;
  private hudR: HTMLDivElement;
  private railL: HTMLDivElement;
  private railR: HTMLDivElement;
  private railLTop: HTMLDivElement;
  private railRTop: HTMLDivElement;
  private zoneDpadRail: HTMLDivElement;
  private zoneActRail: HTMLDivElement;
  private main: HTMLDivElement;
  private stripSlot: HTMLDivElement;
  private hudMid: HTMLDivElement;
  private controls: HTMLDivElement;
  private zoneDpad: HTMLDivElement;
  private zoneAct: HTMLDivElement;
  private ro: ResizeObserver | null = null;
  private cleanup: (() => void)[] = [];

  constructor(host: HTMLElement, o: GameScreenOptions) {
    this.o = o;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    this.el = document.createElement("div");
    this.el.className = "gscreen";
    this.el.innerHTML = `
      <div class="gscreen-hud"><div class="gscreen-hud-l"></div><div class="gscreen-hud-mid"></div><div class="gscreen-hud-r"></div></div>
      <div class="gscreen-rail gscreen-rail--l"><div class="gscreen-rail-top"></div><div class="gscreen-zone gscreen-zone--dpad"></div></div>
      <div class="gscreen-main"><div class="gscreen-strip"></div><div class="gscreen-canvas"></div><span class="gscreen-rotate">橫放更順手</span></div>
      <div class="gscreen-rail gscreen-rail--r"><div class="gscreen-rail-top"></div><div class="gscreen-zone gscreen-zone--act"></div></div>
      <div class="gscreen-controls"><div class="gscreen-zone gscreen-zone--dpad"></div><div class="gscreen-zone gscreen-zone--act"></div></div>
      <div class="gscreen-keys" aria-hidden="true">
        <span><kbd>← → ↑ ↓</kbd> 移動</span><span><kbd>空白</kbd>/<kbd>J</kbd> A</span><span><kbd>Shift</kbd>/<kbd>K</kbd> B</span><span><kbd>L</kbd> C</span><span><kbd>I</kbd> D</span>
      </div>`;
    const q = <T extends HTMLElement>(sel: string) => this.el.querySelector<T>(sel)!;
    this.hudL = q(".gscreen-hud-l");
    this.hudR = q(".gscreen-hud-r");
    this.railL = q(".gscreen-rail--l");
    this.railR = q(".gscreen-rail--r");
    this.railLTop = this.railL.querySelector<HTMLDivElement>(".gscreen-rail-top")!;
    this.railRTop = this.railR.querySelector<HTMLDivElement>(".gscreen-rail-top")!;
    this.zoneDpadRail = this.railL.querySelector<HTMLDivElement>(".gscreen-zone")!;
    this.zoneActRail = this.railR.querySelector<HTMLDivElement>(".gscreen-zone")!;
    this.main = q(".gscreen-main");
    this.stripSlot = q(".gscreen-strip");
    this.hudMid = q(".gscreen-hud-mid");
    this.canvas = q(".gscreen-canvas");
    this.controls = q(".gscreen-controls");
    this.zoneDpad = this.controls.querySelector<HTMLDivElement>(".gscreen-zone--dpad")!;
    this.zoneAct = this.controls.querySelector<HTMLDivElement>(".gscreen-zone--act")!;
    if (o.strip) this.stripSlot.appendChild(o.strip);
    else this.stripSlot.remove();
    if (o.rotateHint === false) q(".gscreen-rotate").remove();
    o.pad.el.classList.add("vpad--v2");
    host.appendChild(this.el);
    this.el.appendChild(o.pad.el); // 只是留在 DOM 裡（display: contents）；兩塊按鍵會被搬進操作區

    const onResize = () => this.refresh();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    this.cleanup.push(() => window.removeEventListener("resize", onResize), () => window.removeEventListener("orientationchange", onResize));
    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => this.fitCanvas());
      this.ro.observe(this.main);
    }
    this.refresh(true);
    // 實驗室：讓自動測試（Playwright）或主控台呼叫 window.__gameScreenAudit() 自我檢查版面
    if (__LAB__) (window as any).__gameScreenAudit = () => this.audit();
  }

  /** 重新判斷版面（視窗大小、方向改變時會自動呼叫） */
  refresh(force = false): void {
    const r = this.el.getBoundingClientRect();
    const w = r.width || window.innerWidth;
    const h = r.height || window.innerHeight;
    const L = this.o.forceLayout?.() ?? detectScreenLayout(w, h, isTouchScreen());
    if (force || L !== this.layout) {
      this.layout = L;
      this.el.dataset.layout = L;
      this.place();
      this.onLayoutChange?.(L);
    } else {
      this.placeStrip(!!spec().modes[this.layout].stripInHud); // 寬度變了：重新判斷資訊列放不放得下
    }
    this.fitCanvas();
  }

  private place(): void {
    const m = spec().modes[this.layout];
    const pad = this.o.pad;
    const rails = this.layout === "phoneLand";
    const left = this.o.hudLeft ?? [];
    const right = this.o.hudRight ?? [];
    (rails ? this.railLTop : this.hudL).append(...left);
    (rails ? this.railRTop : this.hudR).append(...right);
    (rails ? this.zoneDpadRail : this.zoneDpad).appendChild(pad.dpadEl);
    (rails ? this.zoneActRail : this.zoneAct).appendChild(pad.actionsEl);
    if (m.rails) this.el.style.gridTemplateColumns = rails ? `${m.rails.left}px 1fr ${m.rails.right}px` : "";
    else this.el.style.gridTemplateColumns = "";
    const zp = m.zonePadding ?? [16, 16];
    this.controls.style.padding = `${zp[0]}px ${zp[1]}px`;
    this.el.style.setProperty("--gscreen-canvas-max", m.canvasMaxWidth ? `${m.canvasMaxWidth}px` : "none");
    pad.setSizes(m.dpad, m.act, m.dpadGap);
    this.placeStrip(!!m.stripInHud);
  }

  /** 計時進度：平板橫放／電腦放在資訊列中間（省下一整列給遊戲畫面）；放不下就回到畫面上方 */
  private placeStrip(inHud: boolean): void {
    if (!this.o.strip) return;
    const s = this.stripSlot;
    s.style.width = "";
    if (inHud) {
      this.hudMid.appendChild(s);
      this.el.classList.add("gscreen--strip-hud");
      if (s.scrollWidth > s.clientWidth + 2) inHud = false; // 資訊列太擠：退回畫面上方
    }
    if (!inHud) {
      this.main.insertBefore(s, this.canvas);
      this.el.classList.remove("gscreen--strip-hud");
    }
  }

  /** 16:9 畫面盡量放大（直放：寬度填滿；其他：受格子寬高限制） */
  private fitCanvas(): void {
    const strip = this.main.querySelector<HTMLElement>(".gscreen-strip"); // 在資訊列時不算畫面高度
    const cw = this.main.clientWidth;
    const ch = this.main.clientHeight - (strip ? strip.offsetHeight + 6 : 0);
    let w = cw;
    let h = (cw * 9) / 16;
    const portrait = this.layout === "phonePort" || this.layout === "tabletPort";
    if (!portrait && h > ch && ch > 0) {
      h = ch;
      w = (ch * 16) / 9;
    }
    const max = spec().modes[this.layout].canvasMaxWidth;
    if (max && w > max) {
      w = max;
      h = (w * 9) / 16;
    }
    this.canvas.style.width = `${Math.floor(w)}px`;
    this.canvas.style.height = `${Math.floor(h)}px`;
    if (strip) strip.style.width = `${Math.floor(w)}px`;
  }

  /** 版面自我檢查（實驗室與自動測試用）：按鍵有沒有蓋到畫面、超出螢幕，哪些鍵半透明 */
  audit(): GameScreenAudit {
    const cv = this.canvas.getBoundingClientRect();
    const keys = Array.from(this.el.querySelectorAll<HTMLElement>(".vpad-k")).map((k) => {
      const r = k.getBoundingClientRect();
      return {
        key: k.dataset.k ?? "",
        inactive: k.classList.contains("vpad-k--inactive"),
        label: (k.textContent ?? "").trim(),
        overlapsCanvas: !(r.right <= cv.left || r.left >= cv.right || r.bottom <= cv.top || r.top >= cv.bottom),
        offscreen: r.width === 0 || r.left < -1 || r.top < -1 || r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1,
      };
    });
    const de = document.documentElement;
    const problems: string[] = [];
    if (keys.length !== 8) problems.push(`按鍵數量是 ${keys.length}，應該是 8`);
    for (const k of keys) {
      if (k.overlapsCanvas) problems.push(`${k.key} 鍵蓋到遊戲畫面`);
      if (k.offscreen) problems.push(`${k.key} 鍵超出螢幕`);
      if (["a", "b", "c", "d"].includes(k.key) && k.label !== k.key.toUpperCase()) problems.push(`${k.key} 鍵文字是「${k.label}」，只能是字母`);
    }
    if (de.scrollWidth > window.innerWidth + 1) problems.push("頁面可以水平捲動");
    if (Math.abs(cv.width / Math.max(1, cv.height) - 16 / 9) > 0.03) problems.push("遊戲畫面不是 16:9");
    return { layout: this.layout, canvas: { w: Math.round(cv.width), h: Math.round(cv.height) }, keys, problems };
  }

  destroy(): void {
    if (__LAB__ && (window as any).__gameScreenAudit) delete (window as any).__gameScreenAudit;
    this.ro?.disconnect();
    for (const fn of this.cleanup) fn();
    this.el.remove();
  }
}
