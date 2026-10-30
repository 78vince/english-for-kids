// 遊戲共用 token 模組（assets/game-tokens/，內容端維護）。
//
// 內容端的繪製器是「經典 script」（IIFE 掛在 window 上），App 端不改它們的圖形邏輯，只在這裡依 README
// 規定的順序當成副作用模組載入（tokens → art → props → character → scene → export → icons），再補上型別。
// 內容端更新 assets/game-tokens/*.js 之後，直接覆蓋檔案即可，這裡不用改。
//
// game-tokens.css（--g-*、.g-t-*、.g-bubble …）只掛在遊戲頁（各遊戲頁的 CSS 自己 @import），
// 不跟學習介面的 design-tokens 混用。

import "../../../assets/game-tokens/game-tokens.js";
import "../../../assets/game-tokens/game-art.js";
import "../../../assets/game-tokens/game-props.js";
import "../../../assets/game-tokens/game-race.js";
import "../../../assets/game-tokens/game-tree.js";
import "../../../assets/game-tokens/game-character.js";
import "../../../assets/game-tokens/game-scene.js";
import "../../../assets/game-tokens/game-export.js";
import "../../../assets/game-tokens/game-icons.js";

/** App 預期的 token 版本；內容端升版後若 API 有變，這裡跟著改。 */
export const EXPECTED_GAME_TOKENS_VERSION = "2.12.1";

export type View = "front" | "side" | "back";
export type Facing = "left" | "right";
export type SceneTime = "day" | "night";

/** 角色外觀：只存 id 字串，跟 GameArt.character() 參數一致（小熊另有 fur） */
export interface Look {
  species: string;
  skin: string;
  hairStyle: string;
  hairColor: string;
  eyes: string;
  mouth: string;
  outfit: string;
  outfitColor: string;
  pantsColor: string;
  accessories: string[];
  held: string;
  fur?: string;
  /** v1.0：臉型（小熊不適用）；舊存檔沒有＝圓臉 */
  faceShape?: string;
  /** v1.0：眉毛；舊存檔沒有＝無 */
  brows?: string;
}

export interface CharacterOptions {
  species: string[];
  skin: string[];
  hairStyle: string[];
  hairColor: string[];
  eyes: string[];
  mouth: string[];
  outfit: string[];
  outfitColor: string[];
  pantsColor: string[];
  accessories: string[];
  held: string[];
  fur: string[];
  faceShape: string[];
  brows: string[];
  /** v1.0：選項中文名稱（id → 名稱） */
  optionLabels?: Record<string, string>;
}

export interface SkyState {
  u: number;
  night: number;
  top: string;
  bottom: string;
  sun: { visible: boolean; x: number; y: number; size: number; color?: string };
  moon: { visible: boolean; x: number; y: number; size: number };
}

export interface WaterPhysics {
  water: boolean;
  /** 重力倍率（越小落得越慢） */
  gravityMult: number;
  /** 最大下落速度（舞台高／秒） */
  maxFallH: number;
  /** 划水一下往上的速度（舞台高／秒） */
  strokeH: number;
  /** 兩次划水的最短間隔 */
  strokeCooldownMs: number;
  /** 頭頂離舞台上緣至少留多少（舞台高比例） */
  topMarginH: number;
  /** 走路速度倍率 */
  walkMult: number;
}

/** 宇宙空間的無重力物理（v2.2）：…H＝舞台高比例（速度為每秒、加速度為每秒平方） */
export interface SpacePhysics {
  space: true;
  /** 方向鍵推進的加速度 */
  thrustH: number;
  /** 推進的最高速度 */
  maxSpeedH: number;
  /** 按住 B 時推進與最高速度的倍率 */
  boostMult: number;
  /** 沒有推進時速度衰減（每秒 e^-drag）：放開按鍵後慢慢停下 */
  dragPerSec: number;
  /** A 衝刺一下增加的速度 */
  dashH: number;
  dashCooldownMs: number;
  /** 站在小行星上按 A／↑ 離開的速度 */
  pushOffH: number;
  /** 閒置時旋轉速度範圍（度／秒，方向隨機） */
  spinDegPerSec: [number, number];
  /** 開始操作或站上小行星時轉回正的速度（度／秒） */
  uprightDegPerSec: number;
  topMarginH: number;
  /** 在小行星上走路的速度倍率 */
  walkMult: number;
  blackHole: {
    pullRadiusH: number;
    captureRadiusH: number;
    /** 吸力（範圍邊緣）；越靠近越強，最多 pullMaxH */
    pullH: number;
    pullMaxH: number;
    /** 吸進去、轉出來各花的時間 */
    warpMs: number;
    /** 從出口黑洞彈出的速度 */
    exitSpeedH: number;
  };
  /** 漂浮的小行星（單位＝角色設計單位）：被推的速度倍率、阻尼、上下浮動、垂直回彈 */
  floatRock?: {
    pushMult: number;
    drag: number;
    maxSpeedUnits: number;
    bobUnits: number;
    bobHz: number;
    springY: number;
    maxDriftYUnits: number;
  };
  /** 偶爾飛過的飛碟、隕石 */
  flyers?: {
    firstDelayMs: number;
    intervalMs: [number, number];
    maxOnScreen: number;
    ufoChance: number;
    ufo: { speedW: number; wobbleH: number; sizeMult: number; stunMs: number; bounceSpeedW: number };
    meteor: { speedW: number; angleDeg: [number, number]; sizeMult: number; knockH: number; knockUpH: number; tumbleDegPerSec: number; stunMs: number };
  };
}

export interface SceneInfo {
  label: string;
  layers: string[];
  parallax: Record<string, number>;
  groundLine: number;
  celestial: { hidden?: boolean; cycleMs: number };
  /** 場景物理（v2.1 海底世界）：water＝漂浮機制。倍率相對於地面；…H 為舞台高比例 */
  physics?: WaterPhysics | SpacePhysics;
  day: Record<string, unknown> & { label?: string };
  night: Record<string, unknown> & { label?: string };
}

export interface SceneLayers {
  [layer: string]: unknown;
  _inner: Record<string, string>;
  _w: number;
  _h: number;
  _groundY: number;
}

export interface PoseController {
  setPose(name: string): void;
  stop(): void;
}

export interface SequenceSample {
  pose: string;
  view: View;
  facing: Facing;
  t: number;
  step: number;
}

export interface PropDef {
  id: string;
  label: string;
  group: string;
  size: [number, number];
  states?: { id: string; label: string }[];
}

export interface ExportOptions {
  scene: string;
  u?: number;
  aspect?: "16:9" | "1:1" | "4:5";
  width?: number;
  height?: number;
  look?: Look;
  pose?: string;
  t?: number;
  view?: View;
  facing?: Facing;
  charX?: number;
  charH?: number;
  feetY?: number;
  /** 腳下支撐面＝影子位置（預設＝feetY）；角色離地時影子留在支撐面 */
  shadowY?: number;
  /** v2.2 宇宙空間：身體旋轉角度（度）、縮放（被黑洞吸進去時變小）、false＝不畫影子（飄在太空中） */
  rot?: number;
  scale?: number;
  shadow?: boolean;
  shift?: number;
  props?: { id: string; x: number; state?: string; h?: number; y?: number; front?: boolean }[];
}

export interface GameArtApi {
  character(opts: Partial<Look> & { view?: View; facing?: Facing; pose?: string | null; t?: number }): string;
  animate(svg: SVGElement, pose: string): PoseController;
  randomLook(rnd?: () => number): Look;
  presets: Record<string, Look>;
  options: CharacterOptions;
  poses: string[];
  views: View[];
  sequences: string[];
  sequenceAt(name: string, ms: number): SequenceSample | null;
  /** v0.5：坐在椅子上的座位道具（hUnits＝道具高，角色設計單位） */
  seatFor?(pose: string): { prop: string; hUnits: number; dx: number; hRel: number } | null;
  /** v0.7：蓄力光暈開關（角色 SVG 內建 .g-glow） */
  setCharge(svg: Element, on: boolean, full?: boolean): void;
  /** v0.8 賽跑：對手動物（側視、預設朝右） */
  animal(kind: string, o?: { pose?: string; t?: number; facing?: Facing }): string;
  animateAnimal(svg: Element, pose: string): { setPose(p: string): void; stop(): void };
  animalKinds: string[];
  animalPoses: string[];
  animalViewBox: Record<string, [number, number]>;
  scene(id: string, w: number, h: number, o?: { time?: SceneTime; u?: number; layers?: string[] }): string;
  sceneLayers(id: string, time: SceneTime, w: number, h: number): SceneLayers & Record<string, string>;
  skyAt(id: string, u: number): SkyState;
  uFromDate(d?: Date): number;
  scenes: string[];
  sceneTimes: SceneTime[];
  sceneInfo: Record<string, SceneInfo>;
  prop(id: string, o?: { state?: string; size?: number; shadow?: boolean }): string;
  propStates(id: string): { id: string; label: string }[] | null;
  props: PropDef[];
  exportSVG(o: ExportOptions): string;
  exportPNG(o: ExportOptions): Promise<Blob>;
  avatar(look: Look, size?: number): string;
  photoSizes: Record<string, [number, number]>;
  /** v2.0.0 爬樹：地形、背景與分塊 API */
  treeBuild(levelId: string, seed?: number, maxAlt?: number): TreeBranch[];
  treeExtent(side: "L" | "R" | "W", len: "S" | "M" | "L", alt: number): { x0: number; x1: number };
  treeCompose(camAlt: number, w: number, h?: number, o?: { branches?: TreeBranch[]; sprites?: any[] }): string;
  treeChunk(layer: "far" | "mid" | "trunk" | "near", index: number, w?: number): string;
  treeSkyAt(alt: number): { top: string; bottom: string; star: number };
  treeZoneAt(alt: number): { id: string; label: string };
  treeStars(w: number, h: number): string;
  treeTrunkHalf(alt: number): number;
  treeInfo(): Record<string, any>;
}

export interface TreeBranch {
  side: "L" | "R" | "W";
  len: "S" | "M" | "L";
  style: string;
  alt: number;
  x0: number;
  x1: number;
  kind: "normal" | "brittle" | "top" | "start";
  id: string;
  uid?: string;
  shroom?: boolean;
}

export interface GameIconsApi {
  icon(id: string, o?: { size?: "sm" | "md" | "lg" | "xl" | number; color?: string; cls?: string }): string;
}

export interface GameTokensData {
  meta: { name: string; version: string; updated: string };
  color: Record<string, any> & { world: { scene: Record<string, SceneInfo>; light?: { night?: { filter?: string } } } };
  motion: { poses: Record<string, { label: string }>; sequences: Record<string, { label: string; loop: boolean }> };
  character: { options: CharacterOptions; presets: Record<string, Look> };
  controls: Record<string, unknown>;
  [k: string]: any;
}

// 跟 token 檔案的 IIFE 用同一個掛載對象（瀏覽器是 window；node 測試環境可能另外放了假的 window）
const g = (typeof window !== "undefined" ? window : globalThis) as unknown as {
  GameTokens: GameTokensData;
  GameArt: GameArtApi;
  GameIcons: GameIconsApi;
};

export const GameTokens: GameTokensData = g.GameTokens;
export const GameArt: GameArtApi = g.GameArt;
export const GameIcons: GameIconsApi = g.GameIcons;

if (import.meta.env?.DEV && GameTokens?.meta?.version !== EXPECTED_GAME_TOKENS_VERSION) {
  console.warn(
    `[game-tokens] 版本不同：App 預期 ${EXPECTED_GAME_TOKENS_VERSION}，實際 ${GameTokens?.meta?.version}。` +
      "內容端更新了 token，請確認 API 是否有變（見 assets/game-tokens/README.md）。"
  );
}

/** icon 簡寫 */
export function icon(id: string, size: "sm" | "md" | "lg" | "xl" | number = "md"): string {
  return GameIcons.icon(id, { size });
}

/** 夜晚時套在角色與道具上的濾鏡（world.light.night.filter），依夜晚強度內插 */
export function nightFilterCss(night: number): string {
  const f = GameTokens.color.world.light?.night?.filter ?? "brightness(.88) saturate(.92)";
  const b = /brightness\(([\d.]+)\)/.exec(f);
  const s = /saturate\(([\d.]+)\)/.exec(f);
  const br = 1 - (1 - (b ? +b[1] : 1)) * night;
  const sa = 1 - (1 - (s ? +s[1] : 1)) * night;
  return night <= 0.001 ? "none" : `brightness(${br.toFixed(3)}) saturate(${sa.toFixed(3)})`;
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 未知 id（內容端改版後舊存檔）以預設值替換，不報錯（向前相容） */
export function normalizeLook(raw: Partial<Look> | null | undefined, fallback?: Look): Look {
  const O = GameArt.options;
  const base: Look = fallback ?? GameArt.presets["kid-blue"] ?? GameArt.randomLook();
  const pick = (key: Exclude<keyof CharacterOptions, "optionLabels">, v: unknown): string => {
    const list = O[key] ?? [];
    if (typeof v === "string" && list.includes(v)) return v;
    const fb = (base as any)[key];
    return typeof fb === "string" && list.includes(fb) ? fb : list[0];
  };
  // v0.6 起有些款式改名或移除：先照 character.legacy 對應（null＝移除），其餘未知 id 再換成預設值
  const legacy = ((GameTokens as any).character?.legacy ?? {}) as Record<string, Record<string, string | null>>;
  const mapId = (key: string, v: unknown): unknown => {
    const m = legacy[key];
    return typeof v === "string" && m && Object.prototype.hasOwnProperty.call(m, v) ? m[v] : v;
  };
  const r0 = raw ?? {};
  const r: Partial<Look> = { ...r0 };
  for (const key of ["species", "hairStyle", "eyes", "mouth", "outfit", "held"] as const) {
    if (r[key] !== undefined) (r as any)[key] = mapId(key, r[key]) ?? undefined;
  }
  if (Array.isArray(r0.accessories)) {
    r.accessories = r0.accessories.map((a) => mapId("accessories", a)).filter((a): a is string => typeof a === "string");
  }
  const look: Look = {
    species: pick("species", r.species),
    skin: pick("skin", r.skin),
    hairStyle: pick("hairStyle", r.hairStyle),
    hairColor: pick("hairColor", r.hairColor),
    eyes: pick("eyes", r.eyes),
    mouth: pick("mouth", r.mouth),
    outfit: pick("outfit", r.outfit),
    outfitColor: pick("outfitColor", r.outfitColor),
    pantsColor: pick("pantsColor", r.pantsColor),
    accessories: Array.isArray(r.accessories)
      ? [...new Set(r.accessories.filter((a) => O.accessories.includes(a)))]
      : [...(base.accessories ?? [])],
    held: pick("held", r.held),
  };
  if (look.species === "bear") look.fur = pick("fur", r.fur);
  // v1.0 臉型／眉毛：舊存檔缺欄位時照繪製端預設（圓臉、無眉毛），不拿預設角色的值，外觀才不會變
  const opt = (key: "faceShape" | "brows", v: unknown, dflt: string): string | undefined => {
    const list = O[key];
    if (!list || list.length === 0) return undefined;
    if (typeof v === "string" && list.includes(v)) return v;
    return list.includes(dflt) ? dflt : list[0];
  };
  const fs = opt("faceShape", r.faceShape, "round");
  const br = opt("brows", r.brows, "none");
  if (fs) look.faceShape = fs;
  if (br) look.brows = br;
  return look;
}

/** 不放進「動作分頁」、也不算「動作達人」的 pose：絆倒序列內部用（撞到圓石時自動播放） */
export const SEQUENCE_ONLY_POSES = ["trip", "fallen", "getup"];
/** 動作分頁能表演的 pose（GameArt.poses 扣掉序列專用） */
export function performablePoses(): string[] {
  return GameArt.poses.filter((p) => !SEQUENCE_ONLY_POSES.includes(p));
}
