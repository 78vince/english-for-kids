// VirtualPad：所有遊戲關卡共用的虛擬按鍵（十字鍵在左；A 在右上、B 在左下靠近十字鍵一側）。
// 手感與 assets/game-tokens/preview.src.html 的「角色 × 場景」一致：
// - 每鍵 ≥ 56px（十字鍵 56、A/B 72），多點觸控（可同時按方向＋B＋A），pointer capture；
// - 視窗失焦／blur／切分頁時自動放開所有鍵；
// - 鍵盤：方向鍵；A＝A／Space／J；B＝B／Shift／K；C＝C／L；D＝D／I；焦點在 input/select/textarea 時不攔截。
//
// 2026-10-28 統一按鍵 v2（docs/GAME-PRODUCTION-SPEC.md §6.3、game-tokens controls.v2）：new VirtualPad({ v2: true })
// - 一律顯示十字鍵＋A、B、C、D；A＝跳／確定、B＝加速、C／D＝道具；按鍵只有英文字母
// - setActive()：這款遊戲沒有的功能、或 C／D 沒有道具時，該鍵半透明、按了不觸發（只輕晃一下）
// - 位置照 GameTokens.controls.v2.abcdUnits；尺寸由 GameScreen 依版面呼叫 setSizes()
// 不帶參數（舊版）的行為完全不變，舊遊戲逐步改成 v2。

import { icon } from "./gameKit";

import { GameTokens } from "./gameKit";

export type PadKey = "up" | "down" | "left" | "right" | "a" | "b" | "c" | "d";
export const PAD_KEYS: PadKey[] = ["up", "down", "left", "right", "a", "b", "c", "d"];

export interface VirtualPadOptions {
  /** 統一按鍵 v2（十字鍵＋ABCD 全部顯示、沒功能半透明）。新遊戲一律用 true。 */
  v2?: boolean;
}

/** v2 的 ABCD 位置（以按鍵直徑為 1 的左上角座標；token 讀不到時用定案值） */
function abcdUnits(): { pos: Record<"a" | "b" | "c" | "d", [number, number]>; box: [number, number] } {
  const u = (GameTokens as any)?.controls?.v2?.abcdUnits;
  const ok = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === "number");
  if (u && ok(u.a) && ok(u.b) && ok(u.c) && ok(u.d) && ok(u.box)) return { pos: { a: u.a, b: u.b, c: u.c, d: u.d }, box: u.box };
  return { pos: { c: [0.7, 0], a: [2.2, 0.28], d: [0, 1.39], b: [1.5, 1.67] }, box: [3.2, 2.67] };
}

const KEYMAP: Record<string, PadKey> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  " ": "a",
  a: "a",
  A: "a",
  j: "a",
  J: "a",
  b: "b",
  B: "b",
  Shift: "b",
  k: "b",
  K: "b",
  c: "c",
  C: "c",
  l: "c",
  L: "c",
  d: "d",
  D: "d",
  i: "d",
  I: "d",
};

const LABEL: Record<PadKey, string> = { up: "上", down: "下", left: "左", right: "右", a: "A 跳", b: "B 跑", c: "C 魔法", d: "D 道具" };
const LABEL_V2: Record<PadKey, string> = { up: "上", down: "下", left: "左", right: "右", a: "A 跳、確定", b: "B 加速", c: "C 道具", d: "D 道具" };

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return /^(input|select|textarea)$/i.test(el.tagName) || el.isContentEditable;
}

export class VirtualPad {
  readonly el: HTMLDivElement;
  readonly down: Record<PadKey, boolean> = { up: false, down: false, left: false, right: false, a: false, b: false, c: false, d: false };
  /** v2：十字鍵、ABCD 兩塊（GameScreen 會把它們放進不同的操作區） */
  readonly v2: boolean;
  readonly dpadEl: HTMLDivElement;
  readonly actionsEl: HTMLDivElement;
  private active: Record<PadKey, boolean> = { up: true, down: true, left: true, right: true, a: true, b: true, c: false, d: false };
  private listeners = new Set<(k: PadKey, pressed: boolean) => void>();
  private buttons = new Map<PadKey, HTMLButtonElement>();
  private enabled = true;
  private cleanup: (() => void)[] = [];

  constructor(opts: VirtualPadOptions = {}) {
    this.v2 = !!opts.v2;
    this.el = document.createElement("div");
    this.el.className = this.v2 ? "vpad vpad--v2" : "vpad";
    this.el.innerHTML = this.v2
      ? `
      <div class="vpad-dpad">
        <span></span><button type="button" class="vpad-k" data-k="up"></button><span></span>
        <button type="button" class="vpad-k" data-k="left"></button><span></span><button type="button" class="vpad-k" data-k="right"></button>
        <span></span><button type="button" class="vpad-k" data-k="down"></button><span></span>
      </div>
      <div class="vpad-abcd">
        <button type="button" class="vpad-k vpad-act vpad-act--c" data-k="c">C</button>
        <button type="button" class="vpad-k vpad-act vpad-act--a" data-k="a">A</button>
        <button type="button" class="vpad-k vpad-act vpad-act--d" data-k="d">D</button>
        <button type="button" class="vpad-k vpad-act vpad-act--b" data-k="b">B</button>
      </div>`
      : `
      <div class="vpad-dpad">
        <span></span><button type="button" class="vpad-k" data-k="up"></button><span></span>
        <button type="button" class="vpad-k" data-k="left"></button><span></span><button type="button" class="vpad-k" data-k="right"></button>
        <span></span><button type="button" class="vpad-k" data-k="down"></button><span></span>
      </div>
      <div class="vpad-ab">
        <button type="button" class="vpad-k vpad-c" data-k="c" style="display:none">C</button>
        <button type="button" class="vpad-k vpad-a" data-k="a">A</button>
        <button type="button" class="vpad-k vpad-b" data-k="b">B</button>
      </div>`;
    this.el.querySelectorAll<HTMLButtonElement>(".vpad-k").forEach((b) => {
      const k = b.dataset.k as PadKey;
      this.buttons.set(k, b);
      b.setAttribute("aria-label", (this.v2 ? LABEL_V2 : LABEL)[k]);
      if (k === "up" || k === "down" || k === "left" || k === "right") b.innerHTML = icon(k, "lg");
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try {
          b.setPointerCapture(e.pointerId);
        } catch {
          // 某些瀏覽器在合成事件上會丟例外，忽略即可
        }
        this.press(k, true);
      });
      for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) {
        b.addEventListener(ev, () => this.press(k, false));
      }
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });

    this.dpadEl = this.el.querySelector<HTMLDivElement>(".vpad-dpad")!;
    this.actionsEl = (this.el.querySelector<HTMLDivElement>(".vpad-abcd") ?? this.el.querySelector<HTMLDivElement>(".vpad-ab"))!;
    if (this.v2) {
      // 兩塊會被 GameScreen 搬離 .vpad，所以樣式掛在各自的 .vpad-v2 上
      this.dpadEl.classList.add("vpad-v2");
      this.actionsEl.classList.add("vpad-v2");
      this.setSizes(56, 56, 4);
      this.applyActive();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const k = KEYMAP[e.key];
      if (!k || isTyping(e.target) || !this.enabled) return;
      e.preventDefault();
      this.press(k, true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = KEYMAP[e.key];
      if (k) this.press(k, false);
    };
    const releaseAll = () => this.releaseAll();
    const onVis = () => {
      if (document.visibilityState !== "visible") this.releaseAll();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", onVis);
    this.cleanup.push(
      () => window.removeEventListener("keydown", onKeyDown),
      () => window.removeEventListener("keyup", onKeyUp),
      () => window.removeEventListener("blur", releaseAll),
      () => document.removeEventListener("visibilitychange", onVis)
    );
  }

  /** 對外事件：press(k, bool)；回傳取消訂閱函式 */
  on(fn: (k: PadKey, pressed: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  press(k: PadKey, pressed: boolean): void {
    if (pressed && !this.enabled) return;
    if (pressed && this.v2 && !this.active[k]) {
      this.shake(k); // v2：這款遊戲沒有的功能／沒有道具：不觸發，只輕晃一下
      return;
    }
    if (this.down[k] === pressed) return;
    this.down[k] = pressed;
    this.buttons.get(k)?.classList.toggle("on", pressed);
    for (const fn of this.listeners) fn(k, pressed);
  }

  releaseAll(): void {
    for (const k of PAD_KEYS) if (this.down[k]) this.press(k, false);
  }

  /**
   * v2：設定哪些鍵有功能（沒列到的維持原狀）。沒有功能的鍵半透明、按了不觸發。
   * 例：賽跑 setActive({ up: false, down: false, c: false, d: false })；拿到道具時 setActive({ c: true })。
   */
  setActive(map: Partial<Record<PadKey, boolean>>): void {
    for (const [k, on] of Object.entries(map) as [PadKey, boolean][]) {
      this.active[k] = on;
      if (!on && this.down[k]) this.press(k, false);
    }
    this.applyActive();
  }

  isActive(k: PadKey): boolean {
    return !this.v2 || this.active[k];
  }

  private applyActive(): void {
    for (const [k, b] of this.buttons) {
      const on = this.active[k];
      b.classList.toggle("vpad-k--inactive", !on);
      b.setAttribute("aria-disabled", String(!on));
    }
  }

  private shake(k: PadKey): void {
    const b = this.buttons.get(k);
    if (!b || typeof b.animate !== "function") return;
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    b.animate([{ translate: "0" }, { translate: "-4px 0" }, { translate: "4px 0" }, { translate: "0" }], { duration: 180 });
  }

  /** v2：依版面設定尺寸（十字鍵每格、ABCD 直徑、十字鍵間距；px），ABCD 位置照 token 比例 */
  setSizes(dpad: number, act: number, gap: number): void {
    if (!this.v2) return;
    this.dpadEl.style.gridTemplateColumns = `repeat(3, ${dpad}px)`;
    this.dpadEl.style.gridTemplateRows = `repeat(3, ${dpad}px)`;
    this.dpadEl.style.gap = `${gap}px`;
    const { pos, box } = abcdUnits();
    this.actionsEl.style.width = `${Math.round(box[0] * act)}px`;
    this.actionsEl.style.height = `${Math.round(box[1] * act)}px`;
    for (const k of ["a", "b", "c", "d"] as const) {
      const b = this.buttons.get(k)!;
      b.style.width = b.style.height = `${act}px`;
      b.style.left = `${Math.round(pos[k][0] * act)}px`;
      b.style.top = `${Math.round(pos[k][1] * act)}px`;
      b.style.fontSize = `${Math.round(act * 0.46)}px`;
    }
  }

  /** 顯示／隱藏特定按鈕（例如裝備特定道具時顯示 C 鍵）。v2 不隱藏按鍵，請改用 setActive()。 */
  setKeyVisible(k: PadKey, show: boolean): void {
    const b = this.buttons.get(k);
    if (b) b.style.display = show ? "" : "none";
  }

  /** 停用（例如面板抽屜展開、表演中）：放開所有鍵、不接受新的按壓 */
  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.releaseAll();
    this.el.classList.toggle("vpad--disabled", !on);
    if (this.v2) {
      this.dpadEl.classList.toggle("vpad-v2--disabled", !on);
      this.actionsEl.classList.toggle("vpad-v2--disabled", !on);
    }
  }

  destroy(): void {
    this.releaseAll();
    for (const fn of this.cleanup) fn();
    this.el.remove();
  }
}
