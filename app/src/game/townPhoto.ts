// 角色小鎮：拍照與相簿（第三階段：照相館；docs/plan-game-town.md）
// - 隨手拍（TownCamera）：街上、各場景右上角的相機鈕 → 倒數 → 快門 → 預覽（存到相簿／下載／分享／刪除）。
//   街上：GameArt.exportPNG 不畫森林圖層（hideLayers），改把小鎮自己的街景、建築、路燈當 extras（z: under）畫進照片；
//   場景：生物、淹水、雨跟工作室一樣當 extras。
// - 紀念照（portraitPhoto）：照相館裡在攝影棚（studio 場景）拍一張，選動作與照片比例。
// - 相簿（PhotoAlbum）：照相館裡看照片、下載、分享、設為封面、刪除。
// 規則跟工作室一樣：存相簿或下載都算拍了一張（第一張 +5 代幣、攝影師／環遊世界／日夜都愛徽章）。
import { GameArt, GameTokens, icon, performablePoses, SEQUENCE_ONLY_POSES, type ExportExtra, type Look, type View } from "./gameKit";
import type { VirtualPad } from "./virtualPad";
import type { StageController } from "./stageController";
import { confirmDialog, toast } from "./fullscreenPage";
import { addPhoto, canShareFiles, deletePhoto, downloadBlob, listPhotos, MAX_PHOTOS, photoFileName, photosSupported, syncPhotos, type PhotoRecord } from "./photoStore";
import { loadCharacter, saveCharacter } from "./characterStore";
import { updateStats } from "./lookShop";
import { earnTokens } from "../gameTokens";
import { serverSyncEnabled } from "../storage";
import { playBlip, playShutter } from "./townSfx";

export type PhotoAspect = "16:9" | "1:1" | "4:5";
export interface PhotoMetaIn {
  sceneId: string;
  time: "day" | "night";
  aspect: PhotoAspect;
}
const FIRST_PHOTO_TOKENS = 5;
const COUNTDOWN_KEY = "townCamCountdown";
/** 相機的「倒數」開關（小鎮相機、我的家共用） */
export function countdownEnabled(): boolean {
  return ssGet(COUNTDOWN_KEY, "1") === "1";
}
export function setCountdownEnabled(on: boolean): void {
  ssSet(COUNTDOWN_KEY, on ? "1" : "0");
}

function esc(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function ssGet(k: string, d: string): string {
  try {
    return sessionStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
}
function ssSet(k: string, v: string): void {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    // 忽略
  }
}

// ================= 照片統計＋獎勵 =================
const counted = new WeakSet<object>();
/** 拍了一張（存相簿或下載）：同一張只算一次 */
export function recordPhotoStats(pid: string, meta: PhotoMetaIn): void {
  if (counted.has(meta)) return;
  counted.add(meta);
  let reward = 0;
  const badges = updateStats(pid, (d) => {
    d.stats.photos += 1;
    const tag = `${meta.sceneId}:${meta.time}`;
    if (!d.stats.scenesShot.includes(tag)) d.stats.scenesShot.push(tag);
    if (meta.time === "night") d.stats.nightShot = true;
    else d.stats.dayShot = true;
    if (!d.stats.firstPhotoRewarded) {
      d.stats.firstPhotoRewarded = true;
      reward = FIRST_PHOTO_TOKENS;
    }
    return true;
  });
  if (reward) {
    earnTokens(pid, reward);
    toast(`${icon("coin")} 第一張照片！送你 ${reward} 個代幣`, 2600);
  }
  badges.forEach((b, i) => window.setTimeout(() => toast(`${icon("trophy")} 獲得新徽章：${esc(b)}`, 3200, "lilac"), 600 + i * 900));
}

function photoModal(inner: string): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "gmodal";
  overlay.innerHTML = `<div class="gmodal-card studio-photo-card" role="dialog" aria-modal="true">${inner}</div>`;
  document.body.appendChild(overlay);
  return overlay;
}

/** 剛拍好的照片：再拍／存到相簿／下載／分享／刪除 */
export function showPhotoPreview(pid: string, blob: Blob, meta: PhotoMetaIn, onSaved?: () => void): void {
  const url = URL.createObjectURL(blob);
  const share = canShareFiles();
  const overlay = photoModal(`
    <img class="studio-photo-big" src="${url}" alt="剛拍好的照片" />
    <div class="gmodal-actions">
      <button type="button" class="gbtn gbtn--quiet" data-v="again">${icon("camera")}再拍</button>
      <button type="button" class="gbtn g-h-mint" data-v="save">${icon("save")}存到相簿</button>
      <button type="button" class="gbtn g-h-sky" data-v="download">${icon("download")}下載</button>
      ${share ? `<button type="button" class="gbtn g-h-lilac" data-v="share">${icon("sparkle")}分享</button>` : ""}
      <button type="button" class="gbtn g-h-rose" data-v="delete">${icon("trash")}刪除</button>
    </div>`);
  const close = () => {
    overlay.remove();
    URL.revokeObjectURL(url);
  };
  overlay.addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
    if (!b) return;
    const v = b.dataset.v;
    if (v === "again") return close();
    if (v === "download") {
      downloadBlob(blob, photoFileName(Date.now()));
      recordPhotoStats(pid, meta);
      return;
    }
    if (v === "share") {
      try {
        await navigator.share({ files: [new File([blob], photoFileName(Date.now()), { type: "image/png" })] });
      } catch {
        // 使用者取消
      }
      return;
    }
    if (v === "delete") {
      if (await confirmDialog({ iconId: "trash", text: "不要這張照片？", yes: "刪掉" })) close();
      return;
    }
    if (v === "save") {
      if (!photosSupported()) {
        downloadBlob(blob, photoFileName(Date.now()));
        recordPhotoStats(pid, meta);
        return close();
      }
      try {
        const data = loadCharacter(pid);
        const slot = data?.slots[data.activeSlot];
        await addPhoto({ profileId: pid, slot: data?.activeSlot ?? 0, slotId: slot?.id, sceneId: meta.sceneId, time: meta.time, aspect: meta.aspect, createdAt: Date.now(), width: 0, height: 0 }, blob);
        recordPhotoStats(pid, meta);
        toast(`${icon("check")} 存好了！作品掛到美術館了`, 2200, "mint");
        close();
        onSaved?.();
      } catch (err) {
        if ((err as Error).message === "PHOTO_LIMIT") toast(`${icon("info")} 美術館滿了（${MAX_PHOTOS} 件），先到美術館刪掉幾件舊作品吧`, 3000, "rose");
        else toast(`${icon("info")} 存不進去，可以先下載`, 2600, "rose");
      }
    }
  });
}

/** 相機倒數 3、2、1（「倒數」關掉就直接拍）；我的家在家玩也用 */
export async function countdownOn(host: HTMLElement, tapSkip: string): Promise<void> {
  if (ssGet(COUNTDOWN_KEY, "1") !== "1") return;
  const el = document.createElement("div");
  el.className = "studio-countdown";
  host.appendChild(el);
  let skip = false;
  el.addEventListener("pointerdown", () => (skip = true));
  for (const n of [3, 2, 1]) {
    if (skip) break;
    el.innerHTML = `<span class="g-t-display">${n}</span><span class="g-t-caption">${esc(tapSkip)}</span>`;
    playBlip("tap");
    await new Promise((r) => setTimeout(r, 700));
  }
  el.remove();
}
export function flash(host: HTMLElement): void {
  const f = document.createElement("div");
  f.className = "studio-flash";
  host.appendChild(f);
  requestAnimationFrame(() => f.classList.add("studio-flash--go"));
  window.setTimeout(() => f.remove(), 450);
  playShutter();
}

// ================= 把舞台上的 DOM 圖層變成照片的 extras =================
/** 元素（含祖先）的實際不透明度；display:none 或看不見回傳 0 */
function visibleOpacity(el: Element, stop: Element): number {
  let op = 1;
  for (let e: Element | null = el; e && e !== stop; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.display === "none" || cs.visibility === "hidden") return 0;
    op *= Number(cs.opacity);
  }
  return op;
}
/** 舞台上看得到的 SVG（街景、建築）→ 照片 extras（box＝實際位置，可超出畫面） */
export function domExtras(stageEl: HTMLElement, svgs: Iterable<SVGSVGElement>, z: ExportExtra["z"]): ExportExtra[] {
  const out: ExportExtra[] = [];
  const sr = stageEl.getBoundingClientRect();
  if (sr.width < 1 || sr.height < 1) return out;
  const ser = new XMLSerializer();
  for (const svg of svgs) {
    const r = svg.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < sr.left || r.left > sr.right) continue;
    const op = visibleOpacity(svg, stageEl);
    if (op < 0.01) continue;
    out.push({
      svg: ser.serializeToString(svg),
      z,
      box: [(r.left - sr.left) / sr.width, (r.top - sr.top) / sr.height, (r.right - sr.left) / sr.width, (r.bottom - sr.top) / sr.height],
      opacity: op,
    });
  }
  return out;
}
/** 生物（蜜蜂、蝙蝠、殭屍；DOM 裡的 SVG，含目前姿勢） */
export function creatureExtras(stage: StageController): ExportExtra[] {
  const out: ExportExtra[] = [];
  const sr = stage.el.getBoundingClientRect();
  if (sr.width < 1 || sr.height < 1) return out;
  const ser = new XMLSerializer();
  stage.el.querySelectorAll<HTMLElement>(".gstage-creature").forEach((el) => {
    const svg = el.querySelector("svg");
    if (!svg) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < sr.left || r.left > sr.right) return;
    const m = new DOMMatrixReadOnly(cs.transform === "none" ? undefined : cs.transform);
    out.push({
      svg: ser.serializeToString(svg),
      z: Number(cs.zIndex) > 8 ? "front" : "back",
      x: (r.left + r.width / 2 - sr.left) / sr.width,
      y: (r.bottom - sr.top) / sr.height,
      h: r.height / sr.height,
      ar: r.width / r.height,
      flip: m.a < 0,
      opacity: Number(cs.opacity),
    });
  });
  return out;
}

// ================= 隨手拍：街上、場景右上角的相機 =================
export interface CameraText {
  open: string;
  close: string;
  shutter: string;
  countdown: string;
  tapSkip: string;
  fail: string;
}
export interface CameraHost {
  stage: StageController;
  pad: VirtualPad;
  pid: string;
  text: CameraText;
  /** 目前拍照的場景代號（街上＝town）與要隱藏的場景圖層 */
  where: () => { sceneId: string; hideLayers?: string[] };
  /** 遊戲頁自己畫的圖層 */
  extras: () => ExportExtra[];
  /** 相機開／關時（關掉其他面板等） */
  onToggle?: (on: boolean) => void;
}

/** 拍照時的面向：前／右／後／左（同商店的轉身） */
const DIRS: { label: string; view: View; dir: 1 | -1 }[] = [
  { label: "前", view: "front", dir: 1 },
  { label: "右", view: "side", dir: 1 },
  { label: "後", view: "back", dir: 1 },
  { label: "左", view: "side", dir: -1 },
];

export class TownCamera {
  readonly button: HTMLButtonElement;
  private bar: HTMLDivElement;
  private frame: HTMLDivElement;
  /** 拍照擺姿勢：面向＋動作 */
  private pose: HTMLDivElement;
  private perf: string | null = null;
  private on = false;
  private busy = false;

  constructor(private h: CameraHost) {
    const st = h.stage;
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "g-iconbtn g-h-sun town-cam-btn";
    this.button.setAttribute("aria-label", h.text.open);
    this.button.innerHTML = icon("camera");
    this.button.addEventListener("click", () => this.toggle());
    this.bar = document.createElement("div");
    this.bar.className = "studio-camera-bar town-camera-bar";
    this.bar.hidden = true;
    this.frame = document.createElement("div");
    this.frame.className = "studio-frame town-frame";
    this.frame.hidden = true;
    this.pose = document.createElement("div");
    this.pose.className = "town-perform town-cam-pose";
    this.pose.setAttribute("role", "group");
    this.pose.setAttribute("aria-label", "拍照姿勢");
    this.pose.hidden = true;
    st.hud.append(this.frame, this.bar, this.pose);
    this.pose.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!b) return;
      if (b.dataset.face) {
        const d = DIRS[Number(b.dataset.face)];
        st.setView(d.view);
        st.setFacing(d.dir);
      } else {
        const key = b.dataset.pose ?? (b.dataset.seq ? `seq:${b.dataset.seq}` : null);
        if (!key) return;
        if (this.perf === key) this.stopPose();
        else {
          this.perf = key;
          if (key.startsWith("seq:")) st.playSequence(key.slice(4), true);
          else st.perform(key);
        }
      }
      playBlip("tap");
      this.renderPose();
    });
    this.pose.addEventListener("keydown", (e) => e.stopPropagation());
    // 開始走、跳、蹲：動作停下（同工作室）；走路會自動轉成側面
    h.pad.on((k, v) => {
      if (!v || !this.on) return;
      if (k === "left" || k === "right" || k === "a" || k === "down") {
        if (this.perf) this.stopPose();
        window.setTimeout(() => this.renderPose(), 0);
      }
    });
    this.bar.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!b) return;
      if (b.hasAttribute("data-countdown")) {
        ssSet(COUNTDOWN_KEY, ssGet(COUNTDOWN_KEY, "1") === "1" ? "0" : "1");
        this.renderBar();
      } else if (b.hasAttribute("data-cam-close")) this.toggle(false);
      else if (b.hasAttribute("data-shutter")) void this.shoot();
    });
  }

  get isOn(): boolean {
    return this.on;
  }

  private stopPose(): void {
    this.perf = null;
    this.h.stage.perform(null);
    this.h.stage.playSequence(null);
  }

  private faceIndex(): number {
    const st = this.h.stage;
    const v = st.exportState().view;
    if (v === "front") return 0;
    if (v === "back") return 2;
    return st.dir < 0 ? 3 : 1;
  }

  private renderPose(): void {
    if (!this.on) return;
    const cur = this.perf;
    const fi = this.faceIndex();
    const poses = performablePoses()
      .filter((x) => !["walk", "run", "fall", "land"].includes(x))
      .map((x) => `<button type="button" class="studio-pose" data-pose="${x}" aria-pressed="${cur === x}">${esc(GameTokens.motion.poses[x]?.label ?? x)}</button>`);
    const seqs = GameArt.sequences
      .filter((q) => !SEQUENCE_ONLY_POSES.includes(q))
      .map((q) => `<button type="button" class="studio-pose studio-pose--seq" data-seq="${q}" aria-pressed="${cur === "seq:" + q}">${icon("play", "sm")}${esc(GameTokens.motion.sequences[q]?.label ?? q)}</button>`);
    this.pose.innerHTML = `<p class="g-t-label">${icon("user", "sm")} 面向</p>
      <div class="studio-seg town-cam-face" role="group" aria-label="面向">${DIRS.map((d, i) => `<button type="button" data-face="${i}" aria-pressed="${fi === i}">${d.label}</button>`).join("")}</div>
      <p class="g-t-label town-perform-seq">${icon("sparkle", "sm")} 動作</p>
      <div class="studio-poses town-poses">${poses.join("")}${seqs.join("")}</div>`;
  }

  private renderBar(): void {
    const t = this.h.text;
    const cd = ssGet(COUNTDOWN_KEY, "1") === "1";
    this.bar.innerHTML = `
      <button type="button" class="studio-seg-toggle" data-countdown aria-pressed="${cd}">${icon("timer", "sm")} ${esc(t.countdown)}</button>
      <button type="button" class="g-iconbtn g-h-sun studio-shutter" data-shutter aria-label="${esc(t.shutter)}">${icon("camera", "lg")}</button>
      <button type="button" class="g-iconbtn g-h-stone" data-cam-close aria-label="${esc(t.close)}">${icon("close")}</button>`;
  }

  toggle(force?: boolean): void {
    this.on = force ?? !this.on;
    this.bar.hidden = this.frame.hidden = this.pose.hidden = !this.on;
    this.button.classList.toggle("on", this.on);
    this.button.setAttribute("aria-pressed", String(this.on));
    if (this.on) {
      this.renderBar();
      this.renderPose();
      playBlip("tap");
    } else {
      // 收起相機：動作停下、轉回側面
      if (this.perf) this.stopPose();
      this.h.stage.setView("side");
    }
    this.h.onToggle?.(this.on);
  }

  /** 按下快門：倒數 → 角色定格 → 匯出 PNG → 預覽 */
  async shoot(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    const st = this.h.stage;
    this.bar.hidden = this.frame.hidden = this.pose.hidden = true;
    await countdownOn(st.hud, this.h.text.tapSkip);
    st.freeze(true);
    const w = this.h.where();
    const base = st.exportState();
    // 小鎮的鏡頭可以停住（camRange）：背景位移跟畫面一樣用「鏡頭中心」，角色在畫面上的位置用 charX
    const opts = { ...base, aspect: "16:9" as const, charX: st.charX, shift: st.worldX - st.charX + 0.5, hideLayers: w.hideLayers, extras: this.h.extras() };
    flash(st.hud);
    let blob: Blob | null = null;
    try {
      blob = await GameArt.exportPNG(opts);
    } catch (err) {
      console.error("exportPNG 失敗", err, navigator.userAgent);
      toast(`${icon("info")} ${esc(this.h.text.fail)}`, 2600, "rose");
    }
    st.freeze(false);
    this.busy = false;
    if (this.on) this.bar.hidden = this.frame.hidden = this.pose.hidden = false;
    if (!blob) return;
    showPhotoPreview(this.h.pid, blob, { sceneId: w.sceneId, time: st.skyState.night > 0.5 ? "night" : "day", aspect: "16:9" });
  }

  destroy(): void {
    this.button.remove();
    this.bar.remove();
    this.frame.remove();
    this.pose.remove();
  }
}

// ================= 紀念照（照相館的攝影棚） =================
export async function portraitPhoto(look: Look, pose: string, aspect: PhotoAspect, sceneId = "studio"): Promise<Blob> {
  const night = false;
  return GameArt.exportPNG({
    scene: sceneId,
    u: night ? 0.75 : 0.25,
    aspect,
    look,
    pose,
    t: 500,
    view: "front",
    facing: "right",
    charX: 0.5,
    charH: aspect === "16:9" ? 0.62 : 0.56,
    feetY: 0.9,
    props: [],
  });
}

// ================= 相簿 =================
export class PhotoAlbum {
  private photos: PhotoRecord[] = [];
  private urls = new Map<string, string>();
  private loaded = false;

  constructor(
    private pid: string,
    private onChange: () => void
  ) {}

  async refresh(sync = true): Promise<void> {
    if (!photosSupported()) return;
    try {
      this.photos = await listPhotos(this.pid);
    } catch {
      this.photos = [];
    }
    this.loaded = true;
    this.onChange();
    if (sync)
      void syncPhotos(this.pid)
        .then((changed) => {
          if (changed) return this.refresh(false);
        })
        .catch(() => {});
  }

  private coverId(): string | null {
    const d = loadCharacter(this.pid);
    return d?.slots[d.activeSlot]?.coverPhotoId ?? null;
  }

  html(emptyText: string): string {
    if (!photosSupported()) return `<p class="g-t-body studio-note">這個瀏覽器不能存照片，拍好可以直接下載。</p>`;
    if (!this.loaded) return `<p class="g-t-caption">${icon("image", "sm")} 讀取相簿中…</p>`;
    if (!this.photos.length) return `<div class="studio-empty">${icon("image", "xl")}<p class="g-t-body">${esc(emptyText)}</p></div>`;
    const where = serverSyncEnabled() ? "・照片會存到家裡的電腦，換平板也看得到" : "・照片只存在這台設備";
    const cover = this.coverId();
    return `<p class="g-t-caption">${this.photos.length} / ${MAX_PHOTOS} 張${where}</p><div class="studio-album">${this.photos
      .map((p) => {
        let url = this.urls.get(p.id);
        if (!url) {
          url = URL.createObjectURL(p.thumb);
          this.urls.set(p.id, url);
        }
        const c = cover === p.id;
        return `<button type="button" class="studio-photo${c ? " studio-photo--cover" : ""}" data-photo="${p.id}" aria-label="照片"><img src="${url}" alt="" />${c ? `<span class="g-tag g-h-sun">封面</span>` : ""}</button>`;
      })
      .join("")}</div>`;
  }

  /** 相簿上的點擊；處理了回傳 true */
  onClick(t: HTMLElement): boolean {
    const id = t.dataset.photo;
    if (!id) return false;
    this.open(id);
    return true;
  }

  private sceneLabel(id: string): string {
    if (id === "town") return "角色小鎮";
    if (id === "home") return "我的家";
    return GameArt.sceneInfo[id]?.label ?? id;
  }

  private open(id: string): void {
    const p = this.photos.find((x) => x.id === id);
    if (!p) return;
    const url = URL.createObjectURL(p.blob);
    const share = canShareFiles();
    const data = loadCharacter(this.pid);
    const isCover = this.coverId() === p.id;
    const who = data?.slots.find((x) => x.id === p.slotId)?.name ?? (p.slotId ? "已刪除的角色" : data?.slots[p.slot]?.name ?? "");
    const overlay = photoModal(`
      <img class="studio-photo-big" src="${url}" alt="照片" />
      <p class="g-t-caption">${esc(who)}・${new Date(p.createdAt).toLocaleString()}・${esc(this.sceneLabel(p.sceneId))}・${p.time === "night" ? "夜晚" : "白天"}・${p.aspect}</p>
      <div class="gmodal-actions">
        <button type="button" class="gbtn gbtn--quiet" data-v="close">${icon("close")}關閉</button>
        <button type="button" class="gbtn g-h-sky" data-v="download">${icon("download")}下載</button>
        ${share ? `<button type="button" class="gbtn g-h-lilac" data-v="share">${icon("sparkle")}分享</button>` : ""}
        <button type="button" class="gbtn g-h-sun" data-v="cover" ${isCover ? "disabled" : ""}>${icon("star")}${isCover ? "目前封面" : "設為封面"}</button>
        <button type="button" class="gbtn g-h-rose" data-v="delete">${icon("trash")}刪除</button>
      </div>`);
    const close = () => {
      overlay.remove();
      URL.revokeObjectURL(url);
    };
    overlay.addEventListener("click", async (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
      if (!b && e.target === overlay) return close();
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
        this.onChange();
      } else if (v === "delete") {
        if (!(await confirmDialog({ iconId: "trash", text: "刪掉這張照片？", yes: "刪掉" }))) return;
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
        await this.refresh(false);
      }
    });
  }

  destroy(): void {
    for (const u of this.urls.values()) URL.revokeObjectURL(u);
    this.urls.clear();
  }
}
