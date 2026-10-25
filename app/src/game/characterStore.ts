// 角色存檔（第一關「人物設定」）：key englishForKids.character.v1.<profileId>，走 storage.ts 的區網同步
// （較新者勝、衝突舊值進 learning-data/conflicts/），本機 localStorage 快取、離線可用。
// 格式見內容端「角色工作室」handoff（HANDOFF.md §13）；look 只存 id 字串，讀取時以 normalizeLook() 把未知 id 換成預設值。
//
// 這個檔案只依賴 storage.ts 與 gameKit.ts（GameArt），主頁（頭像、徽章判定）與工作室頁都用它。

import { appStorage } from "../storage";
import { GameArt, normalizeLook, type Look, type SceneTime } from "./gameKit";
import { sanitizeLook } from "./shopStore";

export const CHARACTER_KEY_PREFIX = "englishForKids.character.v1";
export const MAX_SLOTS = 3;
export const NAME_MAX = 12;
export const DEFAULT_NAME = "小夥伴";

export interface SlotScene {
  id: string;
  time: SceneTime;
  useSystemTime: boolean;
  /** 拖曳時間軸的位置（0–1）；沒有就依 time 取正午／午夜 */
  u?: number;
  /** 天氣：晴天、雨天、颱風天 */
  weather?: "sunny" | "rainy" | "typhoon";
}

export interface CharacterSlot {
  id: string;
  /** 卡片位置 0–2（刪除第 2 個角色後，第 3 個仍留在原位，空出來的位置顯示「＋新角色」）；舊存檔沒有就用陣列順序 */
  pos?: number;
  name: string;
  look: Look;
  scene: SlotScene;
  /** 各場景各自記憶的時間設定 */
  sceneTimes?: Record<string, SlotScene>;
  /** 相簿裡設為封面的照片 id（Handoff 3） */
  coverPhotoId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CharacterStats {
  photos: number;
  /** "sceneId:day|night" */
  scenesShot: string[];
  firstSaveRewarded: boolean;
  firstPhotoRewarded: boolean;
  /** 白天／夜晚拍過照（「日夜都愛」徽章；scenesShot 也看得出來，這兩個旗標給徽章判定直接用） */
  dayShot?: boolean;
  nightShot?: boolean;
  /** 動作分頁演過的動作（「動作達人」徽章） */
  posesTried?: string[];
  /** 累計存過的角色：slot id → 造型指紋（刪除角色也不移除，「造型師」徽章用這個判定，已得徽章不會因刪除消失） */
  slotsEverSaved?: Record<string, string>;
  /** 「動作達人」達成過（之後 token 新增動作也不收回） */
  poseMasterDone?: boolean;
  /** 「按住 ↓ 再按 A 跳更高」提示：第一次蓄力跳成功後不再出現 */
  chargeHintDone?: boolean;
  tourSeen?: boolean;
  jumpHintDone?: boolean;
}

export interface CharacterData {
  version: 1;
  activeSlot: number;
  slots: CharacterSlot[];
  stats: CharacterStats;
}

export function storageKey(profileId: string): string {
  return `${CHARACTER_KEY_PREFIX}.${profileId}`;
}

function emptyStats(): CharacterStats {
  return { photos: 0, scenesShot: [], firstSaveRewarded: false, firstPhotoRewarded: false };
}

export function defaultScene(): SlotScene {
  return { id: GameArt.scenes.includes("forest") ? "forest" : GameArt.scenes[0], time: "day", useSystemTime: false, weather: "sunny" };
}

export function newSlot(look?: Look, name = DEFAULT_NAME): CharacterSlot {
  const now = Date.now();
  const presets = Object.values(GameArt.presets);
  const base = look ?? presets[Math.floor(Math.random() * presets.length)] ?? GameArt.randomLook();
  return {
    id: `c${now.toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name,
    look: normalizeLook(JSON.parse(JSON.stringify(base))),
    scene: defaultScene(),
    sceneTimes: {},
    coverPhotoId: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** 名稱規則：1–12 字，中英文數字（可夾空白以外的一般字元），不能有空白、不能全是符號 */
export function validateName(raw: string): { ok: true; name: string } | { ok: false; reason: string } {
  const name = raw.trim();
  if (name.length === 0) return { ok: false, reason: "名字不能空白" };
  if ([...name].length > NAME_MAX) return { ok: false, reason: `最多 ${NAME_MAX} 個字` };
  if (/\s/.test(name)) return { ok: false, reason: "名字裡不能有空格" };
  if (!/[\p{L}\p{N}]/u.test(name)) return { ok: false, reason: "要有中文、英文或數字" };
  return { ok: true, name };
}

function normalizeSlot(raw: any): CharacterSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = newSlot(undefined);
  const scene = raw.scene && typeof raw.scene === "object" ? raw.scene : {};
  const validName = typeof raw.name === "string" ? validateName(raw.name) : null;
  return {
    id: typeof raw.id === "string" ? raw.id : s.id,
    pos: typeof raw.pos === "number" && raw.pos >= 0 && raw.pos < MAX_SLOTS ? Math.floor(raw.pos) : undefined,
    name: validName && validName.ok ? validName.name : DEFAULT_NAME,
    look: normalizeLook(raw.look),
    scene: {
      id: GameArt.sceneInfo[scene.id] ? scene.id : defaultScene().id,
      time: scene.time === "night" ? "night" : "day",
      useSystemTime: !!scene.useSystemTime,
      u: typeof scene.u === "number" ? scene.u : undefined,
    },
    sceneTimes: raw.sceneTimes && typeof raw.sceneTimes === "object" ? raw.sceneTimes : {},
    coverPhotoId: typeof raw.coverPhotoId === "string" ? raw.coverPhotoId : null,
    createdAt: Number(raw.createdAt) || s.createdAt,
    updatedAt: Number(raw.updatedAt) || s.updatedAt,
  };
}

/** 讀取（沒有存檔回傳 null）；資料壞掉或有未知 id 都不報錯 */
export function loadCharacter(profileId: string): CharacterData | null {
  const raw = appStorage.getItem(storageKey(profileId));
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const slots = (Array.isArray(d.slots) ? d.slots : []).map(normalizeSlot).filter(Boolean).slice(0, MAX_SLOTS) as CharacterSlot[];
    if (slots.length === 0) return null;
    assignPositions(slots);
    const stats = { ...emptyStats(), ...(d.stats ?? {}) } as CharacterStats;
    stats.scenesShot = Array.isArray(stats.scenesShot) ? stats.scenesShot : [];
    stats.posesTried = Array.isArray(stats.posesTried) ? stats.posesTried : [];
    stats.slotsEverSaved = stats.slotsEverSaved && typeof stats.slotsEverSaved === "object" ? stats.slotsEverSaved : {};
    const activeSlot = Math.min(Math.max(0, Number(d.activeSlot) || 0), slots.length - 1);
    return { version: 1, activeSlot, slots, stats };
  } catch {
    return null;
  }
}

/** 補上／修正卡片位置：重複或沒有 pos 的依陣列順序放進空位；第 1 個角色永遠在位置 0 */
export function assignPositions(slots: CharacterSlot[]): void {
  const used = new Set<number>();
  for (const s of slots) {
    if (s.pos !== undefined && !used.has(s.pos)) used.add(s.pos);
    else s.pos = undefined;
  }
  for (const s of slots) {
    if (s.pos !== undefined) continue;
    let p = 0;
    while (used.has(p)) p++;
    s.pos = p;
    used.add(p);
  }
}

/** 某個卡片位置上的角色（陣列索引）；空位回傳 -1 */
export function slotIndexAt(data: CharacterData, pos: number): number {
  return data.slots.findIndex((s) => s.pos === pos);
}

/** 第一次進入：隨機給一組預設角色 */
export function createInitial(): CharacterData {
  const first = newSlot();
  first.pos = 0;
  return { version: 1, activeSlot: 0, slots: [first], stats: emptyStats() };
}

export function saveCharacter(profileId: string, data: CharacterData): void {
  appStorage.setItem(storageKey(profileId), JSON.stringify(data));
}

export function lookFingerprint(look: Look): string {
  const l = normalizeLook(look);
  return JSON.stringify({ ...l, accessories: [...l.accessories].sort() });
}

/** 主頁用：目前使用中角色的外觀（沒有存檔回傳 null） */
export function getActiveLook(profileId: string): Look | null {
  const d = loadCharacter(profileId);
  // 商店款式沒買／已退回（例如在另一台平板退回）就顯示預設值
  return d ? sanitizeLook(profileId, d.slots[d.activeSlot].look).look : null;
}

/** 主頁用：頭像 SVG（圓形遮罩由 CSS 處理）；沒有角色回傳 null */
export function activeAvatarSvg(profileId: string, size: number): string | null {
  const look = getActiveLook(profileId);
  return look ? GameArt.avatar(look, size) : null;
}

/** 徽章判定用的統計（沒有存檔都是 0） */
