// 角色小鎮：美術館（2026-11-04 使用者要求：照相館改成美術館）
// 走進去是一間長長的展覽大廳：小朋友拍的照片像畫作一樣掛在牆上（畫框、投射燈、作品名牌），
// 拍得越多、展廳越長（每 roomSize 件一間展廳，中間有柱子與展廳名牌）；長椅、紅龍柱、盆栽點綴。
// 角色在大廳裡走動（同街道：鏡頭跟著走、兩端停住），走到作品前按 ↑ 或直接點作品 → 大圖（下載、分享、設為封面、收起＝刪除）。
// 走到入口的大門按 ↑ 或按「回小鎮」離開。數值與文案：GameTokens.town.places[photo].gallery。
import { GameArt, icon } from "./gameKit";
import type { StageController } from "./stageController";
import { confirmDialog, toast } from "./fullscreenPage";
import { canShareFiles, deletePhoto, downloadBlob, listPhotos, photoFileName, photosSupported, syncPhotos, type PhotoRecord } from "./photoStore";
import { loadCharacter, saveCharacter } from "./characterStore";
import { playBlip } from "./townSfx";

export interface GalleryCfg {
  exitX: number;
  firstX: number;
  spacing: number;
  roomSize: number;
  frameH: number;
  frameCenterY: number;
  frames: string[];
  decorEvery: number;
  text: Record<"title" | "titleEn" | "count" | "room" | "empty" | "viewHint" | "exitHint" | "hello" | "deleted" | "full", string>;
}
export type GalleryNear = { kind: "exit" } | { kind: "photo"; idx: number } | null;

interface Item {
  x: number;
  el: HTMLElement;
}

const ASPECT: Record<string, number> = { "16:9": 16 / 9, "1:1": 1, "4:5": 4 / 5 };

function esc(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function propSize(id: string): [number, number] {
  return (GameArt.props.find((p) => p.id === id)?.size as [number, number]) ?? [100, 100];
}
function sceneLabel(id: string): string {
  if (id === "town") return "角色小鎮";
  return GameArt.sceneInfo[id]?.label ?? id;
}
function dateLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export class TownGallery {
  private root: HTMLDivElement;
  private itemsEl: HTMLDivElement;
  private items: Item[] = [];
  private frames: { x: number; idx: number; el: HTMLElement }[] = [];
  private photos: PhotoRecord[] = [];
  private urls = new Map<string, string>();
  private len = 2;
  private nearNow: GalleryNear = null;
  private modal: HTMLElement | null = null;
  private dead = false;

  constructor(
    private stage: StageController,
    private pid: string,
    private cfg: GalleryCfg,
    /** 展廳長度改變時（載入、刪除）：重新設定移動範圍 */
    private onLength: (len: number) => void
  ) {
    this.root = document.createElement("div");
    this.root.className = "tgal";
    this.root.innerHTML = `<div class="tgal-wall"></div><div class="tgal-floor"></div><div class="tgal-items"></div>`;
    this.itemsEl = this.root.querySelector(".tgal-items")!;
    stage.world.insertBefore(this.root, stage.world.querySelector(".gstage-props"));
    this.itemsEl.addEventListener("click", (e) => {
      const f = (e.target as HTMLElement).closest<HTMLElement>("[data-art]");
      if (f) this.open(Number(f.dataset.art));
    });
  }

  get length(): number {
    return this.len;
  }
  get near(): GalleryNear {
    return this.nearNow;
  }
  get count(): number {
    return this.photos.length;
  }

  /** 讀照片並佈置展廳；背景跟電腦同步，有變再佈置一次 */
  async load(sync = true): Promise<void> {
    if (photosSupported()) {
      try {
        this.photos = await listPhotos(this.pid);
      } catch {
        this.photos = [];
      }
    }
    if (this.dead) return;
    this.build();
    if (sync && photosSupported())
      void syncPhotos(this.pid)
        .then((changed) => {
          if (changed && !this.dead) return this.load(false);
        })
        .catch(() => {});
  }

  private url(p: PhotoRecord): string {
    let u = this.urls.get(p.id);
    if (!u) {
      u = URL.createObjectURL(p.thumb ?? p.blob);
      this.urls.set(p.id, u);
    }
    return u;
  }

  private add(x: number, html: string, cls: string, style = ""): HTMLElement {
    const el = document.createElement("div");
    el.className = `tgal-item ${cls}`;
    if (style) el.setAttribute("style", style);
    el.innerHTML = html;
    this.itemsEl.appendChild(el);
    this.items.push({ x, el });
    return el;
  }

  /** 道具（token 繪製）：寬度用設計單位換算成 em（1em＝舞台高 1%；角色高＝charH） */
  private propHtml(id: string, scale = 1): { html: string; wEm: number } {
    const [w] = propSize(id);
    const unitEm = (this.stage.charH * 100) / 170;
    return { html: GameArt.prop(id), wEm: w * unitEm * scale };
  }

  private build(): void {
    const C = this.cfg;
    const T = C.text;
    this.itemsEl.innerHTML = "";
    this.items = [];
    this.frames = [];
    const n = this.photos.length;
    const cover = loadCharacter(this.pid)?.slots[loadCharacter(this.pid)!.activeSlot]?.coverPhotoId ?? null;
    // 入口：大門＋上方的館名招牌
    const door = this.propHtml("galleryDoor", 1.15);
    this.add(C.exitX, door.html, "tgal-door", `width:${door.wEm.toFixed(2)}em`);
    this.add(
      C.exitX,
      `<span class="tgal-sign-en">${esc(T.titleEn)}</span><strong>${esc(T.title)}</strong><span class="tgal-sign-n">${esc(T.count.replace("{n}", String(n)))}</span>`,
      "tgal-sign"
    );
    const plant = this.propHtml("pottedPlant", 1.4);
    this.add(C.exitX + 0.2, plant.html, "tgal-floorprop", `width:${plant.wEm.toFixed(2)}em`);
    const H = C.frameH * 100;
    const top = (C.frameCenterY - C.frameH / 2) * 100;
    let x = C.firstX;
    if (!n) {
      // 空的展廳：一個空畫框＋說明
      this.add(x + 0.1, `<div class="tgal-frame tgal-frame--white tgal-frame--empty" style="height:${H}em;width:${(H * 16) / 9}em"><div class="tgal-mat">${icon("camera", "xl")}<p>${esc(T.empty)}</p></div></div>`, "tgal-art", `top:${top}em`);
      x += 0.1 + C.spacing;
    }
    const lamp = this.propHtml("galleryLamp", 1);
    for (let i = 0; i < n; i++) {
      // 每 roomSize 件換一間展廳：柱子＋展廳名牌
      if (i > 0 && i % C.roomSize === 0) {
        x += C.spacing * 0.15;
        this.add(x, `<span>${esc(T.room.replace("{n}", String(i / C.roomSize + 1)))}</span>`, "tgal-pillar");
        const pl = this.propHtml("pottedPlant", 1.2);
        this.add(x + 0.07, pl.html, "tgal-floorprop", `width:${pl.wEm.toFixed(2)}em`);
        x += C.spacing * 0.6;
      } else if (i === 0) {
        this.add(x - C.spacing * 0.55, `<span>${esc(T.room.replace("{n}", "1"))}</span>`, "tgal-pillar");
      }
      const p = this.photos[i];
      const ar = ASPECT[p.aspect] ?? 16 / 9;
      const fh = ar < 1 ? H * 1.12 : H; // 直的照片稍微高一點
      const fw = fh * ar;
      const style = C.frames[i % C.frames.length] ?? "gold";
      const isCover = cover === p.id;
      const el = this.add(
        x,
        `<div class="tgal-lamp" style="width:${lamp.wEm.toFixed(2)}em">${lamp.html}</div>
         <div class="tgal-glow" aria-hidden="true"></div>
         <button type="button" class="tgal-frame tgal-frame--${style}" data-art="${i}" style="height:${fh.toFixed(2)}em;width:${fw.toFixed(2)}em" aria-label="作品 ${i + 1}：${esc(sceneLabel(p.sceneId))}，${dateLabel(p.createdAt)}">
           <span class="tgal-mat"><img src="${this.url(p)}" alt="" draggable="false" /></span>
         </button>
         <div class="tgal-plaque"><strong>No.${i + 1}${isCover ? ` ${icon("star", "sm")}` : ""}</strong><span>${esc(sceneLabel(p.sceneId))}・${dateLabel(p.createdAt)}</span></div>`,
        "tgal-art",
        `top:${(C.frameCenterY * 100 - fh / 2).toFixed(2)}em`
      );
      this.frames.push({ x, idx: i, el });
      // 每幾件：作品前面放長椅或紅龍柱
      if (i % C.decorEvery === 1) {
        const b = this.propHtml(i % (C.decorEvery * 2) === 1 ? "galleryBench" : "galleryRope", 0.9);
        this.add(x, b.html, "tgal-floorprop tgal-front", `width:${b.wEm.toFixed(2)}em`);
      }
      x += C.spacing;
    }
    // 盡頭：柱子＋盆栽
    this.add(x - C.spacing * 0.25, "", "tgal-pillar tgal-pillar--end");
    const endPlant = this.propHtml("pottedPlant", 1.4);
    this.add(x - C.spacing * 0.45, endPlant.html, "tgal-floorprop", `width:${endPlant.wEm.toFixed(2)}em`);
    this.len = Math.max(C.exitX + 1.2, x - C.spacing * 0.3);
    this.onLength(this.len);
    this.frame(this.stage.worldX);
  }

  /** 每幀：依鏡頭擺放、找角色前面的作品／大門 */
  frame(wx: number): GalleryNear {
    const st = this.stage;
    const W = st.width;
    this.root.style.fontSize = `${st.height / 100}px`;
    const cam = Math.max(0.5, Math.min(Math.max(0.5, this.len - 0.5), wx));
    this.root.style.setProperty("--gal-off", `${Math.round(-cam * W)}px`);
    for (const it of this.items) {
      const sx = (it.x - cam) * W + W * 0.5;
      const vis = sx > -W * 0.6 && sx < W * 1.6;
      it.el.style.display = vis ? "" : "none";
      if (vis) it.el.style.transform = `translateX(${Math.round(sx)}px) translateX(-50%)`;
    }
    let best: GalleryNear = null;
    let bd = this.cfg.spacing * 0.5; // 站在兩幅之間也算看著比較近的那一幅
    if (Math.abs(wx - this.cfg.exitX) < 0.1) {
      best = { kind: "exit" };
      bd = Math.abs(wx - this.cfg.exitX);
    }
    for (const f of this.frames) {
      const d = Math.abs(wx - f.x);
      if (d < bd) {
        bd = d;
        best = { kind: "photo", idx: f.idx };
      }
    }
    for (const f of this.frames) f.el.classList.toggle("is-near", best?.kind === "photo" && best.idx === f.idx);
    this.nearNow = best;
    return best;
  }

  /** 作品的畫面位置（提示泡泡用） */
  anchorOf(n: GalleryNear): { x: number; top: number } | null {
    if (!n) return null;
    const sr = this.stage.el.getBoundingClientRect();
    const el = n.kind === "photo" ? this.frames.find((f) => f.idx === n.idx)?.el.querySelector(".tgal-frame") : this.itemsEl.querySelector(".tgal-door");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - sr.left, top: r.top - sr.top };
  }

  /** 看大圖：下載、分享、設為封面、收起（刪除） */
  open(idx: number): void {
    const p = this.photos[idx];
    if (!p || this.modal) return;
    playBlip("pop");
    const url = URL.createObjectURL(p.blob);
    const share = canShareFiles();
    const data = loadCharacter(this.pid);
    const isCover = data?.slots[data.activeSlot]?.coverPhotoId === p.id;
    const who = data?.slots.find((x) => x.id === p.slotId)?.name ?? (p.slotId ? "已刪除的角色" : data?.slots[p.slot]?.name ?? "");
    const style = this.cfg.frames[idx % this.cfg.frames.length] ?? "gold";
    const ov = document.createElement("div");
    ov.className = "gmodal";
    ov.innerHTML = `<div class="gmodal-card tgal-view" role="dialog" aria-modal="true" aria-label="作品 ${idx + 1}">
      <div class="tgal-frame tgal-frame--${style} tgal-frame--big"><span class="tgal-mat"><img src="${url}" alt="作品 ${idx + 1}" /></span></div>
      <p class="tgal-view-title"><strong>No.${idx + 1}</strong>　${esc(who)}・${esc(sceneLabel(p.sceneId))}・${p.time === "night" ? "夜晚" : "白天"}・${new Date(p.createdAt).toLocaleDateString()}</p>
      <div class="gmodal-actions">
        <button type="button" class="gbtn gbtn--quiet" data-v="close">${icon("close")}關閉</button>
        <button type="button" class="gbtn g-h-sky" data-v="download">${icon("download")}下載</button>
        ${share ? `<button type="button" class="gbtn g-h-lilac" data-v="share">${icon("sparkle")}分享</button>` : ""}
        <button type="button" class="gbtn g-h-sun" data-v="cover"${isCover ? " disabled" : ""}>${icon("star")}${isCover ? "目前封面" : "設為封面"}</button>
        <button type="button" class="gbtn g-h-rose" data-v="delete">${icon("trash")}刪除作品</button>
      </div></div>`;
    document.body.appendChild(ov);
    this.modal = ov;
    const close = () => {
      ov.remove();
      URL.revokeObjectURL(url);
      this.modal = null;
      window.removeEventListener("keydown", onKey, true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);
    ov.addEventListener("click", async (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
      if (!b && e.target === ov) return close();
      if (!b) return;
      const v = b.dataset.v;
      if (v === "close") close();
      else if (v === "download") downloadBlob(p.blob, photoFileName(p.createdAt));
      else if (v === "share") {
        try {
          await navigator.share({ files: [new File([p.blob], photoFileName(p.createdAt), { type: "image/png" })] });
        } catch {
          // 取消
        }
      } else if (v === "cover") {
        const d = loadCharacter(this.pid);
        if (d) {
          d.slots[d.activeSlot].coverPhotoId = p.id;
          saveCharacter(this.pid, d);
        }
        close();
        toast(`${icon("star")} 設為封面了！`, 1800, "sun");
        this.build();
      } else if (v === "delete") {
        if (!(await confirmDialog({ iconId: "trash", text: "要刪除這幅作品嗎？刪掉就找不回來了喔！", yes: "刪除" }))) return;
        await deletePhoto(p.id);
        const tu = this.urls.get(p.id);
        if (tu) URL.revokeObjectURL(tu);
        this.urls.delete(p.id);
        const d = loadCharacter(this.pid);
        if (d && d.slots[d.activeSlot].coverPhotoId === p.id) {
          d.slots[d.activeSlot].coverPhotoId = null;
          saveCharacter(this.pid, d);
        }
        close();
        toast(`${icon("trash")} ${esc(this.cfg.text.deleted)}`, 2000, "stone");
        await this.load(false);
      }
    });
  }

  get modalOpen(): boolean {
    return !!this.modal;
  }

  destroy(): void {
    this.dead = true;
    this.modal?.remove();
    this.modal = null;
    this.root.remove();
    for (const u of this.urls.values()) URL.revokeObjectURL(u);
    this.urls.clear();
  }
}
