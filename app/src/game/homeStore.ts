// 我的家・佈置（docs/plan-town-home-furniture.md；token GameTokens.home）
// - 一個使用者（profile）一個家，3 個角色共用。存檔 englishForKids.home.v1.<profileId>（同步到區網電腦，以 updatedAt 新的為準）。
// - 房間是「固定位置換款式」：每個 slot 放一款 catalog 裡同類別的家具；沒有 price＝免費。
// - 讀取容錯：壞資料、不認識的款式、類別不對、還沒擁有的款式 → 換回預設（同 sanitizeLook 的做法）。
// - 付費款（第 2 階段家具店）沿用衣櫃擁有清單：field "furniture"、value＝家具 id。
import { appStorage } from "../storage";
import { GameArt, GameTokens, type Look } from "./gameKit";
import { isOwned, loadWardrobe, ownsEntry } from "./shopStore";
import { LAB_MODE } from "../gameRelease";

export const HOME_KEY_PREFIX = "englishForKids.home.v1";

export interface HomeItem {
  id: string;
  cat: string;
  zh: string;
  en: string;
  theme?: string;
  price?: number;
  tier?: string;
  prop?: string;
  state?: string;
  /** 壁紙／地板顏色（token 色相）＋深淺 */
  color?: string;
  tone?: "soft" | "base" | "deep";
  /** 窗外：天空（跟著日夜）或場景 id */
  sky?: boolean;
  scene?: string;
  /** 掛畫：自畫像（畫孩子目前的角色） */
  portrait?: boolean;
  /** 「沒有／空著」 */
  none?: boolean;
  /** 壁紙／地板花紋（stripes、dots、clouds、leaves、waves、tiles、grass、sand） */
  pattern?: string;
  /** 晚上會亮（吊燈、燈飾） */
  glow?: boolean;
  /** 窗戶的玻璃形狀（窗外景色依這個裁切）：round／arch／porthole／capsule；沒有＝方窗 */
  glass?: string;
  /** 床：躺下的位置（在家玩）；x／bottom＝房間 %、scale＝角色大小、cover＝被子從床寬的哪裡開始蓋（0–1） */
  lie?: { x: number; bottom: number; scale: number; cover: number };
}
export interface HomeSlot {
  id: string;
  cat: string;
  kind?: "wall" | "floor" | "view" | "shelf";
  left?: number;
  bottom?: number;
  top?: number;
  width?: number;
  height?: number;
  z?: number;
  label?: string;
}
export interface HomeCategory {
  id: string;
  zh: string;
  en: string;
}
interface HomeCfg {
  features: { decorate: boolean; store: boolean; play?: boolean };
  play?: HomePlayCfg;
  categories: HomeCategory[];
  slots: HomeSlot[];
  catalog: HomeItem[];
  defaults: Record<string, string>;
  text: Record<string, string>;
}
export interface HomePlayAction {
  slot: string;
  label: string;
  icon: string;
  pose: string;
  /** 按哪個鍵做：up＝↑（床、玩具、寵物）、down＝↓（地毯） */
  key?: "up" | "down";
}
export interface HomePlayCfg {
  speed: number;
  runMult?: number;
  jumpV?: number;
  gravity?: number;
  minX: number;
  maxX: number;
  startX: number;
  actions: Record<"bed" | "rug" | "toy" | "pet", HomePlayAction>;
  text: Record<string, string>;
}
export function homePlayCfg(): HomePlayCfg | undefined {
  return homeCfg().play;
}
export interface HomeLayout {
  v: 1;
  slots: Record<string, string>;
  updatedAt: number;
}

export function homeCfg(): HomeCfg {
  return (GameTokens as unknown as { home: HomeCfg }).home;
}
/** 佈置分頁：實驗室一律打開；正式 App 看 token features.decorate */
export function decorateEnabled(): boolean {
  return LAB_MODE || !!homeCfg()?.features?.decorate;
}
/** 在家玩（走動、躺床、坐地上）：遊戲實驗室一律打開；正式 App 看 home.features.play */
export function playEnabled(): boolean {
  return !!homeCfg()?.play && (LAB_MODE || !!homeCfg()?.features?.play);
}
export function storeEnabled(): boolean {
  return LAB_MODE || !!homeCfg()?.features?.store;
}
export function homeKey(profileId: string): string {
  return `${HOME_KEY_PREFIX}.${profileId}`;
}
export function homeItem(id: string | undefined): HomeItem | undefined {
  return id ? homeCfg().catalog.find((x) => x.id === id) : undefined;
}
export function itemsOf(cat: string): HomeItem[] {
  return homeCfg().catalog.filter((x) => x.cat === cat);
}
export function slotsOf(cat: string): HomeSlot[] {
  return homeCfg().slots.filter((s) => s.cat === cat);
}
export function categoryOf(id: string): HomeCategory | undefined {
  return homeCfg().categories.find((c) => c.id === id);
}

/** 擁有：免費款（窗外場景要擁有那個場景）＋買過的付費款 */
export function ownsHomeItem(profileId: string, it: HomeItem): boolean {
  if (it.scene && !isOwned(profileId, "scene", it.scene)) return false;
  if (!it.price) return true;
  // 家具一律看真正的購買紀錄（不套用遊戲實驗室「全部都有」的設定），這樣在實驗室也能測買、放、退回
  const e = loadWardrobe(profileId).items[`furniture:${it.id}`];
  return ownsEntry(e);
}

export function defaultLayout(): HomeLayout {
  return { v: 1, slots: { ...homeCfg().defaults }, updatedAt: 0 };
}

/** 解析＋補預設＋檢查款式（不認識、類別不對、沒擁有 → 預設） */
export function sanitizeHome(profileId: string | null, raw: unknown): HomeLayout {
  const out = defaultLayout();
  const r = raw && typeof raw === "object" ? (raw as Partial<HomeLayout>) : null;
  if (r && typeof r.updatedAt === "number" && Number.isFinite(r.updatedAt)) out.updatedAt = r.updatedAt;
  const slots = r && r.slots && typeof r.slots === "object" ? (r.slots as Record<string, unknown>) : {};
  for (const s of homeCfg().slots) {
    const v = slots[s.id];
    if (typeof v !== "string") continue;
    const it = homeItem(v);
    if (!it || it.cat !== s.cat) continue;
    if (profileId && !ownsHomeItem(profileId, it)) continue;
    out.slots[s.id] = v;
  }
  return out;
}

export function loadHome(profileId: string): HomeLayout {
  try {
    const raw = appStorage.getItem(homeKey(profileId));
    return sanitizeHome(profileId, raw ? JSON.parse(raw) : null);
  } catch {
    return defaultLayout();
  }
}

export function saveHome(profileId: string, layout: HomeLayout): void {
  try {
    appStorage.setItem(homeKey(profileId), JSON.stringify({ v: 1, slots: layout.slots, updatedAt: Date.now() }));
  } catch {
    // 寫入失敗安靜忽略（跟其他模組一致）
  }
}

/** 換一個位置的款式（檢查類別與擁有）；回傳新的 layout，不合法就原樣回傳 */
export function setHomeSlot(profileId: string, layout: HomeLayout, slotId: string, itemId: string): HomeLayout {
  const s = homeCfg().slots.find((x) => x.id === slotId);
  const it = homeItem(itemId);
  if (!s || !it || it.cat !== s.cat || !ownsHomeItem(profileId, it)) return layout;
  const next: HomeLayout = { v: 1, slots: { ...layout.slots, [slotId]: itemId }, updatedAt: Date.now() };
  saveHome(profileId, next);
  return next;
}

// ---------------- 畫房間（我的家、家具店預覽共用） ----------------
function hueVar(h: string, tone: string = "soft"): string {
  return tone === "base" ? `var(--g-${h})` : `var(--g-${h}-${tone})`;
}
/** token 色票的實際顏色（花紋要畫進 SVG 圖片，不能用 CSS 變數） */
function hx(h: string, tone: string = "base"): string {
  try {
    return (GameArt as unknown as { _h: { hue(h: string, t?: string): string } })._h.hue(h, tone === "base" ? undefined : tone);
  } catch {
    return "#cccccc";
  }
}
const WHITE = "#FFFFFF";
/** 花紋的一格（40×40）：底色＋圖案 */
export function patternTile(pattern: string, color = "sky"): { bg: string; inner: string } {
  const soft = hx(color, "soft");
  const base = hx(color);
  switch (pattern) {
    case "stripes":
      return { bg: soft, inner: `<rect x="0" y="0" width="12" height="40" fill="${base}" opacity=".35"/><rect x="20" y="0" width="4" height="40" fill="${WHITE}" opacity=".6"/>` };
    case "dots":
      return { bg: soft, inner: `<circle cx="10" cy="10" r="5" fill="${base}" opacity=".55"/><circle cx="30" cy="30" r="5" fill="${WHITE}" opacity=".8"/>` };
    case "clouds":
      return { bg: soft, inner: `<g fill="${WHITE}" opacity=".85"><circle cx="12" cy="14" r="5"/><circle cx="19" cy="11" r="6"/><circle cx="26" cy="14" r="5"/><rect x="10" y="14" width="18" height="5" rx="2.5"/></g><circle cx="33" cy="33" r="1.6" fill="${base}" opacity=".5"/>` };
    case "leaves":
      return { bg: soft, inner: `<ellipse cx="11" cy="12" rx="6" ry="3.2" fill="${hx("leaf")}" transform="rotate(-35 11 12)"/><ellipse cx="30" cy="29" rx="6" ry="3.2" fill="${hx("leaf", "ledge")}" transform="rotate(35 30 29)"/><circle cx="31" cy="9" r="1.8" fill="${hx("sun")}"/>` };
    case "waves":
      return { bg: soft, inner: `<path d="M0 14 Q10 6 20 14 T40 14" fill="none" stroke="${base}" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M0 32 Q10 24 20 32 T40 32" fill="none" stroke="${WHITE}" stroke-width="3" stroke-linecap="round" opacity=".8"/>` };
    case "tiles":
      return { bg: soft, inner: `<rect x="1" y="1" width="18" height="18" rx="3" fill="${WHITE}" opacity=".55"/><rect x="21" y="21" width="18" height="18" rx="3" fill="${WHITE}" opacity=".55"/><rect x="21" y="1" width="18" height="18" rx="3" fill="${base}" opacity=".18"/><rect x="1" y="21" width="18" height="18" rx="3" fill="${base}" opacity=".18"/>` };
    case "grass":
      return { bg: hx("leaf", "soft"), inner: `<path d="M6 30 l3 -10 l3 10 Z M24 16 l3 -10 l3 10 Z M30 38 l2.5 -8 l2.5 8 Z" fill="${hx("leaf")}"/><circle cx="16" cy="34" r="1.8" fill="${hx("sun")}"/>` };
    case "sand":
      return { bg: hx("sun", "soft"), inner: `<g fill="${hx("sun", "deep")}" opacity=".35"><circle cx="6" cy="8" r="1.4"/><circle cx="22" cy="18" r="1.2"/><circle cx="34" cy="6" r="1"/><circle cx="12" cy="30" r="1.2"/><circle cx="30" cy="34" r="1.4"/></g><path d="M18 30 Q22 24 26 30 Z" fill="${hx("peach", "soft")}"/>` };
    case "starry":
      return { bg: hx("lilac", "deep"), inner: `<path d="M10 7 L11 10 L14 11 L11 12 L10 15 L9 12 L6 11 L9 10 Z" fill="${hx("sun")}" opacity=".85"/><circle cx="30" cy="29" r="1.2" fill="${WHITE}" opacity=".8"/><circle cx="25" cy="10" r=".8" fill="${WHITE}" opacity=".5"/>` };
    case "candy":
      return { bg: hx("rose", "soft"), inner: `<path d="M-10 40 L30 0 H40 L0 40 Z M30 40 L40 30 V40 Z M-10 10 L0 0 H10 Z" fill="${hx("rose")}" opacity=".55"/><path d="M8 40 L48 0" stroke="${WHITE}" stroke-width="3"/>` };
    case "glass":
      return { bg: hx("lilac", "ledge"), inner: `<rect x="1" y="1" width="38" height="38" rx="4" fill="${WHITE}" opacity=".14"/><path d="M8 8 L14 14 M26 28 L30 32" stroke="${WHITE}" stroke-width="2" stroke-linecap="round" opacity=".5"/><path d="M30 6 L31 9 L34 10 L31 11 L30 14 L29 11 L26 10 L29 9 Z" fill="${hx("sun", "soft")}"/><circle cx="12" cy="30" r="1.4" fill="${WHITE}"/>` };
    case "cookie":
      return { bg: hx("wood"), inner: `<rect x="1" y="1" width="38" height="38" rx="6" fill="${hx("wood", "ledge")}" opacity=".35"/><rect x="4" y="4" width="32" height="32" rx="5" fill="${hx("wood")}"/><circle cx="12" cy="13" r="2.6" fill="${hx("bark")}"/><circle cx="27" cy="11" r="2" fill="${hx("bark")}"/><circle cx="20" cy="24" r="2.4" fill="${hx("bark")}"/><circle cx="30" cy="29" r="2" fill="${hx("bark")}"/><circle cx="11" cy="30" r="1.8" fill="${hx("bark")}"/>` };
    default:
      return { bg: soft, inner: "" };
  }
}
// ---------------- 窗戶玻璃形狀 ----------------
/** 窗框 120×100 座標裡的玻璃外形；窗外景色（view 位置）＝窗框的 (8,8)–(112,92) */
export function windowGlass(shape: string | undefined): [number, number][] | null {
  const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number): [number, number][] =>
    Array.from({ length: n + 1 }, (_, k) => {
      const a = a0 + ((a1 - a0) * k) / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
  const P = Math.PI;
  switch (shape) {
    case "round":
      return arc(60, 50, 40, 0, 2 * P, 48);
    case "porthole":
      return arc(60, 50, 34, 0, 2 * P, 48);
    case "arch":
      return [[22, 92], ...arc(60, 48, 38, P, 2 * P, 24), [98, 92]];
    case "capsule":
      return [...arc(74, 50, 28, -P / 2, P / 2, 16), ...arc(46, 50, 28, P / 2, (3 * P) / 2, 16)];
    default:
      return null;
  }
}
/** 玻璃形狀換成窗外景色方框裡的比例（0–1） */
export function windowGlassInView(shape: string | undefined): [number, number][] | null {
  const g = windowGlass(shape);
  return g ? g.map(([x, y]) => [(x - 8) / 104, (y - 8) / 84]) : null;
}

function patternCss(it: HomeItem, tileFrac: number): string {
  const t = patternTile(it.pattern!, it.color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">${t.inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${(tileFrac * 100).toFixed(2)}% auto repeat, ${t.bg}`;
}
function propSvg(id: string, state?: string): string {
  try {
    return GameArt.prop(id, state ? { state } : {});
  } catch {
    return "";
  }
}
function viewHtml(it: HomeItem | undefined, night: boolean): string {
  if (it?.scene) {
    try {
      return GameArt.scene(it.scene, 320, 180, { time: night ? "night" : "day" }).replace(/preserveAspectRatio="[^"]*"/, "").replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ');
    } catch {
      /* 退回天空 */
    }
  }
  const K = GameArt.skyAt("forest", night ? 0.75 : 0.25) as { top: string; bottom: string };
  return `<div class="home-sky" style="background:linear-gradient(${K.top},${K.bottom})"></div>`;
}

export interface RoomRender {
  wall: string;
  floor: string;
  html: string;
}
/** 房間：牆、地板顏色（CSS）＋各位置的家具 HTML；interactive＝每個位置是可以點的按鈕（data-hslot） */
export function renderRoom(layout: HomeLayout, o: { look?: Look; night?: boolean; interactive?: boolean; showEmpty?: boolean; highlight?: string | null }): RoomRender {
  const C = homeCfg();
  const get = (slotId: string) => homeItem(layout.slots[slotId]) ?? homeItem(C.defaults[slotId]);
  const wallIt = get("wallpaper");
  const floorIt = get("floor");
  const wall = wallIt?.pattern ? patternCss(wallIt, 0.08) : hueVar(wallIt?.color ?? "peach", wallIt?.tone ?? "soft");
  const floor = floorIt?.pattern ? patternCss(floorIt, 0.06) : hueVar(floorIt?.color ?? "wood", floorIt?.tone ?? "soft");
  const noShelf = !!get("shelf")?.none;
  let html = "";
  for (const s of C.slots) {
    if (s.kind === "wall" || s.kind === "floor") continue;
    // 小擺飾放在置物架上：沒有置物架就不出現
    if (s.cat === "smalldeco" && noShelf) continue;
    const it = get(s.id);
    let inner = "";
    if (s.kind === "view") {
      inner = viewHtml(it, !!o.night);
    } else if (!it || it.none) {
      // 空位：可以點的時候畫一個淡淡的虛線框，讓孩子知道這裡可以放東西
      if (!o.interactive || !o.showEmpty) continue;
      inner = `<span class="home-empty"></span>`;
    } else if (it.portrait) {
      inner = `<span class="home-portrait">${o.look ? GameArt.avatar(o.look) : ""}</span>${propSvg("homeFrame")}`;
    } else if (it.prop) inner = propSvg(it.prop, it.state);
    if (!inner) continue;
    const glassPts = s.kind === "view" ? windowGlassInView(get("window")?.glass) : null;
    const clipCss = glassPts ? `clip-path:polygon(${glassPts.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(",")});border-radius:0;` : "";
    const pos = `left:${s.left ?? 0}%;${s.top != null ? `top:${s.top}%` : `bottom:${s.bottom ?? 0}%`};width:${s.width ?? 10}%;${s.height != null ? `height:${s.height}%;` : ""}z-index:${s.z ?? 2};${clipCss}`;
    const cls = `tshop-prop home-slot home-slot--${s.kind ?? s.cat}${it?.none ? " home-slot--empty" : ""}${o.highlight === s.id ? " home-slot--hl" : ""}${o.night && it?.glow && !it.none ? " home-slot--glow" : ""}`;
    const tag = o.interactive ? "button" : "div";
    const attrs = tag === "button" ? ` type="button" data-hslot="${s.id}" aria-label="${(s.label ?? categoryOf(s.cat)?.zh ?? s.cat).replace(/"/g, "")}"` : "";
    html += `<${tag} class="${cls}" style="${pos}"${attrs}>${inner}</${tag}>`;
  }
  return { wall, floor, html };
}

// ---------------- 拍照：把房間＋角色組成一張 SVG（再轉 PNG） ----------------
/** 角色在房間裡的位置（同 town.css 的 .tshop--home .tshop-me：left 60%、bottom 5%、高 48%） */
export const HOME_ME = { left: 0.6, bottom: 0.05, height: 0.48 };

function nest(svg: string, x: number, y: number, w: number, h: number, extra = ""): string {
  const open = svg.match(/<svg\b[^>]*>/);
  if (!open) return "";
  const cleaned = open[0].replace(/\s(width|height|x|y|class|overflow|preserveAspectRatio)="[^"]*"/g, "").replace(/\sstyle="[^"]*"/g, "");
  return svg.replace(open[0], cleaned.replace("<svg", `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" overflow="visible"${extra}`));
}
function vbRatio(svg: string): number {
  const m = svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/);
  return m ? Number(m[2]) / Number(m[1]) : 1;
}

/** 房間照片（正方形）：牆、地板、家具（依 z）、角色；resolve＝把 CSS 變數換成實際顏色 */
export function composeRoomSvg(
  layout: HomeLayout,
  o: {
    look: Look;
    pose: string;
    view: string;
    facing: string;
    night: boolean;
    size: number;
    resolve: (cssVar: string) => string;
    /** 在家玩：角色目前的位置（0–1）、眼睛（睡覺閉眼）、躺床（床的 lie 設定：角色側面轉 -90°、臉朝上；不蓋被子） */
    me?: { x: number; eyes?: string; lie?: { x: number; bottom: number; scale: number; cover: number } };
  }
): string {
  const C = homeCfg();
  const S = o.size;
  const get = (slotId: string) => homeItem(layout.slots[slotId]) ?? homeItem(C.defaults[slotId]);
  const color = (it: HomeItem | undefined, dh: string, dt: string) => {
    const h = it?.color ?? dh;
    const t = it?.tone ?? dt;
    return o.resolve(t === "base" ? `--g-${h}` : `--g-${h}-${t}`);
  };
  const layers: { z: number; i: number; svg: string }[] = [];
  const noShelf = !!get("shelf")?.none;
  C.slots.forEach((s, i) => {
    if (s.kind === "wall" || s.kind === "floor") return;
    if (s.cat === "smalldeco" && noShelf) return;
    const it = get(s.id);
    if (!it || it.none) return;
    const w = ((s.width ?? 10) / 100) * S;
    const place = (h: number) => (s.top != null ? (s.top / 100) * S : S - ((s.bottom ?? 0) / 100) * S - h);
    const x = ((s.left ?? 0) / 100) * S;
    let svg = "";
    if (s.kind === "view") {
      const h = ((s.height ?? 20) / 100) * S;
      const y = place(h);
      if (it.scene) {
        try {
          const sc = GameArt.scene(it.scene, 320, 180, { time: o.night ? "night" : "day" }).replace(/preserveAspectRatio="[^"]*"/, "");
          svg = nest(sc, x, y, w, h, ' preserveAspectRatio="xMidYMid slice"').replace('overflow="visible"', 'overflow="hidden"');
        } catch {
          svg = "";
        }
      }
      if (!svg) {
        const K = GameArt.skyAt("forest", o.night ? 0.75 : 0.25) as { top: string; bottom: string };
        const id = `hsky${i}`;
        svg = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.top}"/><stop offset="1" stop-color="${K.bottom}"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>`;
      }
      const gp = windowGlassInView(get("window")?.glass);
      if (gp && svg) {
        const cid = `hglass${i}`;
        svg = `<defs><clipPath id="${cid}"><polygon points="${gp.map(([px, py]) => `${(x + px * w).toFixed(1)},${(y + py * h).toFixed(1)}`).join(" ")}"/></clipPath></defs><g clip-path="url(#${cid})">${svg}</g>`;
      }
    } else if (it.portrait) {
      const h = w;
      const y = place(h);
      svg = `<rect x="${x + w * 0.1}" y="${y + h * 0.1}" width="${w * 0.8}" height="${h * 0.8}" fill="${o.resolve("--g-sky-soft")}"/>` + nest(GameArt.avatar(o.look), x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8).replace(' overflow="visible"', ' overflow="hidden"') /* 相框裡的頭像：裁在相框內（身體不能露出相框外） */ + nest(propSvg("homeFrame"), x, y, w, h);
    } else if (it.prop) {
      const p = propSvg(it.prop, it.state);
      const h = w * vbRatio(p);
      svg = nest(p, x, place(h), w, h);
    }
    if (svg) layers.push({ z: s.z ?? 2, i, svg });
  });
  // 角色（z 5：在家具前面、地上的玩具後面）
  const look = o.me?.eyes ? ({ ...o.look, eyes: o.me.eyes } as Look) : o.look;
  const lie = o.me?.lie;
  let ch = GameArt.character({ ...look, view: o.view as never, facing: o.facing as never, pose: o.pose });
  // 躺床：睡覺動作自帶的 Zzz 會跟著轉成橫的，照片裡拿掉；臉朝上（側面再轉 -90°），不蓋被子
  if (lie) ch = ch.replace(/(<g class="g-fx" data-fx="zzz" style="display:)[^"]*"/, '$1none"');
  // 躺床：地上的影子也拿掉（轉 90° 後會變成直的）
  if (lie) ch = ch.replace('data-part="shadow"', 'data-part="shadow" style="display:none"');
  if (lie) {
    // 躺床：同畫面上的 .tshop-me.is-lying（以盒子中心轉 -90°，身體底部貼著床墊）
    const mh = HOME_ME.height * lie.scale * S;
    const mw = mh * vbRatio(ch) ** -1;
    const cx = (lie.x / 100) * S;
    const boxBottom = (lie.bottom / 100) * S - (mh - mw) / 2 - mw * 0.28; // 0.28＝homePlay.ts LIE_INSET
    const y = S - boxBottom - mh;
    layers.push({ z: 5, i: 999, svg: `<g transform="rotate(-90 ${cx.toFixed(1)} ${(y + mh / 2).toFixed(1)})">${nest(ch, cx - mw / 2, y, mw, mh)}</g>` });
  } else {
    const mh = HOME_ME.height * S;
    const mw = mh * vbRatio(ch) ** -1;
    const mx = (o.me?.x ?? HOME_ME.left) * S;
    layers.push({ z: 5, i: 999, svg: nest(ch, mx - mw / 2, S - HOME_ME.bottom * S - mh, mw, mh) });
  }
  layers.sort((a, b) => a.z - b.z || a.i - b.i);
  // 牆、地板：純色或花紋（<pattern>，一格＝畫面寬的 8%／6%，跟畫面上一樣）
  const fill = (it: HomeItem | undefined, dh: string, id: string, frac: number): { def: string; fill: string } => {
    if (!it?.pattern) return { def: "", fill: color(it, dh, "soft") };
    const t = patternTile(it.pattern, it.color);
    const sz = S * frac;
    return {
      def: `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${sz}" height="${sz}"><rect width="${sz}" height="${sz}" fill="${t.bg}"/><svg viewBox="0 0 40 40" width="${sz}" height="${sz}">${t.inner}</svg></pattern>`,
      fill: `url(#${id})`,
    };
  };
  const wf = fill(get("wallpaper"), "peach", "hpWall", 0.08);
  const ff = fill(get("floor"), "wood", "hpFloor", 0.06);
  const body = `<defs>${wf.def}${ff.def}</defs><rect width="${S}" height="${S}" fill="${wf.fill}"/><rect y="${S * 0.72}" width="${S}" height="${S * 0.28}" fill="${ff.fill}"/>` + layers.map((l) => l.svg).join("");
  const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${body}</svg>`;
  // 剩下的 CSS 變數：有後備值用後備值，沒有就查實際顏色
  return out.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_m, v: string, fb?: string) => (fb ? fb.trim() : o.resolve(v)));
}
