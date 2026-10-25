// VirtualPad：所有遊戲關卡共用的虛擬按鍵（十字鍵在左；A 在右上、B 在左下靠近十字鍵一側）。
// 手感與 assets/game-tokens/preview.src.html 的「角色 × 場景」一致：
// - 每鍵 ≥ 56px（十字鍵 56、A/B 72），多點觸控（可同時按方向＋B＋A），pointer capture；
// - 視窗失焦／blur／切分頁時自動放開所有鍵；
// - 鍵盤：方向鍵；A＝A／Space／J；B＝B／Shift／K；焦點在 input/select/textarea 時不攔截。

import { icon } from "./gameKit";

export type PadKey = "up" | "down" | "left" | "right" | "a" | "b" | "c";
export const PAD_KEYS: PadKey[] = ["up", "down", "left", "right", "a", "b", "c"];

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
};

const LABEL: Record<PadKey, string> = { up: "上", down: "下", left: "左", right: "右", a: "A 跳", b: "B 跑", c: "C 魔法" };

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return /^(input|select|textarea)$/i.test(el.tagName) || el.isContentEditable;
}

export class VirtualPad {
  readonly el: HTMLDivElement;
  readonly down: Record<PadKey, boolean> = { up: false, down: false, left: false, right: false, a: false, b: false, c: false };
  private listeners = new Set<(k: PadKey, pressed: boolean) => void>();
  private buttons = new Map<PadKey, HTMLButtonElement>();
  private enabled = true;
  private cleanup: (() => void)[] = [];

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "vpad";
    this.el.innerHTML = `
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
      b.setAttribute("aria-label", LABEL[k]);
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
    if (this.down[k] === pressed) return;
    this.down[k] = pressed;
    this.buttons.get(k)?.classList.toggle("on", pressed);
    for (const fn of this.listeners) fn(k, pressed);
  }

  releaseAll(): void {
    for (const k of PAD_KEYS) if (this.down[k]) this.press(k, false);
  }

  /** 顯示／隱藏特定按鈕（例如裝備特定道具時顯示 C 鍵） */
  setKeyVisible(k: PadKey, show: boolean): void {
    const b = this.buttons.get(k);
    if (b) b.style.display = show ? "" : "none";
  }

  /** 停用（例如面板抽屜展開、表演中）：放開所有鍵、不接受新的按壓 */
  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.releaseAll();
    this.el.classList.toggle("vpad--disabled", !on);
  }

  destroy(): void {
    this.releaseAll();
    for (const fn of this.cleanup) fn();
    this.el.remove();
  }
}
