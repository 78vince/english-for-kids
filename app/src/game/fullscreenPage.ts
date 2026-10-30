// 全螢幕遊戲頁骨架（沿用「全螢幕遊戲」handoff 的規則）：
// - 同視窗導航：從主頁 location.assign 進來，返回時先 flush 同步佇列再 location.assign 回主頁；
//   主頁啟動時（boot.ts）會重新對帳，代幣／高分／徽章統計不會被舊快取蓋掉。
// - safe-area（CSS env()）、touch-action:none、禁止選取與長按選單（gamePage.css）。
// - 首次點擊嘗試 Fullscreen API（失敗靜默）；需要橫放時顯示「請橫放裝置」提示（不強制）。

import { flushPending } from "../storage";
import { icon } from "./gameKit";
import { isLoginRemembered, rememberLogin } from "../pin";
import { LAB_MODE } from "../gameRelease";
import { createProfile, listProfiles, setActiveProfileId } from "../profile";
import { AVATARS } from "../avatars";

const ACTIVE_PROFILE_ID_KEY = "englishForKids.activeProfileId.v1";

export type ReturnTarget = "home" | "gameRoom" | "lab";

/** 目前登入的使用者（每台設備各自記，不同步）；沒有就回主頁選人 */
export function requireActiveProfileId(): string | null {
  let id: string | null = null;
  try {
    // 「記住登入」過期（12 小時）就回主頁重新輸入密碼
    id = isLoginRemembered() ? window.localStorage.getItem(ACTIVE_PROFILE_ID_KEY) : null;
  } catch {
    id = null;
  }
  if (!id && (LAB_MODE || (typeof window !== "undefined" && window.location?.port === "5190"))) {
    try {
      const existing = listProfiles().find((p) => p.name === "測試員");
      const tester = existing ?? createProfile("測試員", AVATARS[0]?.id ?? "default");
      setActiveProfileId(tester.id);
      rememberLogin();
      id = tester.id;
    } catch {
      // 忽略
    }
  }
  if (!id) {
    window.location.replace(LAB_MODE ? "../lab.html" : "../index.html");
    return null;
  }
  return id;
}

/** 從網址 ?from=home|gameRoom|lab 讀返回目的地（lab 只在遊戲實驗室有效） */
export function returnTarget(): ReturnTarget {
  const from = new URLSearchParams(window.location.search).get("from");
  if (from === "lab" && LAB_MODE) return "lab";
  return from === "home" ? "home" : "gameRoom";
}

let leaving = false;

/** 離開遊戲頁：先把同步佇列送出（最多等 2 秒），再回主頁 */
export async function leaveTo(target: ReturnTarget = returnTarget(), beforeLeave?: () => void | Promise<void>): Promise<void> {
  if (leaving) return;
  leaving = true;
  try {
    await beforeLeave?.();
  } catch {
    // 忽略：離開不能被卡住
  }
  try {
    await Promise.race([flushPending(), new Promise((r) => setTimeout(r, 2000))]);
  } catch {
    // 離線也照樣離開，佇列留在本機稍後補傳
  }
  window.location.assign(target === "lab" ? "../lab.html" : `../index.html#${target}`);
}

/** 首次點擊嘗試進入全螢幕（PWA standalone 本來就是全螢幕；不支援或被拒就算了） */
export function tryFullscreenOnFirstTap(): void {
  const handler = () => {
    window.removeEventListener("pointerdown", handler, true);
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
    if (standalone || document.fullscreenElement) return;
    try {
      const p = el.requestFullscreen?.();
      if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
      else el.webkitRequestFullscreen?.();
    } catch {
      // 靜默
    }
  };
  window.addEventListener("pointerdown", handler, true);
}

/** 「請橫放裝置」提示（只在手機直放時顯示，不強制） */
export function addRotateHint(text = "橫放裝置玩起來更順手喔"): void {
  const el = document.createElement("div");
  el.className = "g-rotate-hint g-rotate-hint--show";
  el.innerHTML = `<span class="g-bubble g-h-sun">${text}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

/** 頂部短暫提示（不打斷操作） */
export function toast(html: string, ms = 2200, hue = "sun"): void {
  const el = document.createElement("div");
  el.className = "gtoast";
  el.innerHTML = `<div class="g-bubble g-h-${hue}">${html}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/** 二次確認：圖示＋短文字＋兩顆大按鈕 */
export function confirmDialog(opts: { iconId: string; text: string; yes: string; no?: string; hue?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    let iconSvg = "";
    try {
      iconSvg = icon(opts.iconId, "xl");
    } catch {
      try {
        iconSvg = icon("back", "xl");
      } catch {
        iconSvg = "";
      }
    }
    const overlay = document.createElement("div");
    overlay.className = "gmodal";
    overlay.innerHTML = `
      <div class="gmodal-card" role="dialog" aria-modal="true" style="align-items:center;text-align:center">
        <div style="color:var(--g-${opts.hue ?? "rose"}-deep)">${iconSvg}</div>
        <p class="g-t-heading">${opts.text}</p>
        <div class="gmodal-actions">
          <button type="button" class="gbtn gbtn--quiet" data-v="no">${icon("close")} ${opts.no ?? "不要"}</button>
          <button type="button" class="gbtn g-h-${opts.hue ?? "rose"}" data-v="yes">${icon("check")} ${opts.yes}</button>
        </div>
      </div>`;
    overlay.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
      if (!b && e.target !== overlay) return;
      overlay.remove();
      resolve(b?.dataset.v === "yes");
    });
    document.body.appendChild(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-v="no"]')?.focus();
  });
}

/** 遊戲頁擋掉 iPad／iPhone Safari 的縮放手勢（連點虛擬按鍵時被判成「點兩下放大」、雙指縮放）。
 * 只在遊戲頁呼叫；回傳移除函式（離開頁面時也會自動移除），一般學習頁的縮放不受影響。 */
export function preventZoomGestures(): () => void {
  let lastTouchEnd = 0;
  const onTouchEnd = (e: TouchEvent) => {
    const now = Date.now();
    // 跟上一次 touchend 間隔 < 350ms：當成連擊，擋掉雙擊縮放（按鍵本身用 pointer 事件，不受影響）
    if (now - lastTouchEnd < 350 && e.cancelable) e.preventDefault();
    lastTouchEnd = now;
  };
  const onGesture = (e: Event) => e.preventDefault();
  const onDblClick = (e: Event) => e.preventDefault();
  document.addEventListener("touchend", onTouchEnd, { passive: false });
  for (const ev of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(ev, onGesture, { passive: false } as AddEventListenerOptions);
  document.addEventListener("dblclick", onDblClick, { passive: false });
  const off = () => {
    document.removeEventListener("touchend", onTouchEnd);
    for (const ev of ["gesturestart", "gesturechange", "gestureend"]) document.removeEventListener(ev, onGesture);
    document.removeEventListener("dblclick", onDblClick);
    window.removeEventListener("pagehide", off);
  };
  window.addEventListener("pagehide", off);
  return off;
}
