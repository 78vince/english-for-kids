// 角色小鎮的店舖共用邏輯（不碰 DOM）：款式名稱、縮圖用 look、試穿、配件規則、存檔（含第一次存檔獎勵與徽章）。
// 規則與角色工作室（characterStudio.ts）相同：配件頭套一次只能戴一個、變身符咒要先在南瓜怪解鎖、
// 第一次存角色送 10 代幣（規範 §7.1 既有例外，只送一次，旗標 stats.firstSaveRewarded 與工作室共用）。
// 工作室在第四階段下架前維持自己的程式；之後的家、衣櫃也用這支。docs/plan-game-town.md §9.4
import { GameArt, GameTokens, normalizeLook, performablePoses, type Look } from "./gameKit";
import { createInitial, loadCharacter, lookFingerprint, saveCharacter, type CharacterData } from "./characterStore";
import { findItem, freeScenes, isOwned, sanitizeLook, type ShopItem } from "./shopStore";
import { loadPumpkinBossRecord } from "./pumpkinBossStore";
import { earnTokens } from "../gameTokens";
import { LAB_MODE } from "../gameRelease";
import { getAllBadges } from "../content";
import { evaluateRuleBadge, type RuleBadgeContext } from "../badgeRules";
import type { CharacterStudioProfileData } from "../types";

export const FIRST_SAVE_TOKENS = 10;
/** 頭套系列一次只能戴一個 */
export const HOOD_ACCESSORIES = ["mikanhood", "bluehood", "pumpkinhood"];

export type LookKey = Exclude<keyof Look, "accessories">;

/** 中文名稱（token optionLabels） */
export function nameOf(id: string): string {
  return GameArt.options.optionLabels?.[id] ?? id;
}

export function colorOf(src: "skin" | "hair" | "fur" | "hue", id: string): string {
  const C = GameTokens.color as unknown as Record<string, Record<string, unknown>>;
  if (src === "hue") return ((C.hue[id] as { base?: string }) ?? {}).base ?? "";
  return (C[src]?.[id] as string) ?? "";
}

/** 縮圖用 look：其他分類的選配清掉，才看得出這個款式本身（同工作室 thumbLook） */
export function thumbLook(base: Look, key: keyof Look, v: string): Look {
  const look = { ...JSON.parse(JSON.stringify(base)), [key]: v } as Look;
  if (key === "accessories") {
    look.accessories = [v];
    look.held = "none";
  } else if (key === "held") look.accessories = [];
  else {
    look.accessories = [];
    look.held = "none";
  }
  return look;
}

export function toggleAccessory(base: Look, a: string): Look {
  const next = JSON.parse(JSON.stringify(base)) as Look;
  const i = next.accessories.indexOf(a);
  if (i >= 0) next.accessories.splice(i, 1);
  else {
    if (HOOD_ACCESSORIES.includes(a)) next.accessories = next.accessories.filter((x) => !HOOD_ACCESSORIES.includes(x));
    next.accessories.push(a);
  }
  return normalizeLook(next);
}

export function setField(base: Look, key: LookKey, v: string): Look {
  const next = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  next[key] = v;
  return normalizeLook(next as unknown as Look);
}

/** 試穿：只套上這一件（配件是加上去） */
export function tryOnLook(base: Look, it: ShopItem): Look {
  if (it.field === "accessories") {
    const has = base.accessories.includes(it.value);
    return has ? normalizeLook(base) : toggleAccessory(base, it.value);
  }
  return setField(base, it.field as LookKey, it.value);
}

/** 商店鎖：沒買的款式回傳商品（買過或免費回傳 null） */
export function lockedItem(pid: string, field: string, v: string): ShopItem | null {
  const it = findItem(field, v);
  if (!it || isOwned(pid, field, v)) return null;
  return it;
}

/** 變身符咒：南瓜怪過關解鎖（實驗室直接顯示） */
export function talismanUnlocked(pid: string): boolean {
  if (LAB_MODE) return true;
  if (loadPumpkinBossRecord(pid)?.hasTalisman) return true;
  return Boolean(loadCharacter(pid)?.slots.some((s) => s.look?.accessories?.includes("zombieTalisman")));
}

// ---- 徽章（character_studio 類；看已存檔的資料，跟工作室一致） ----
const CHARACTER_BADGES = getAllBadges().filter((b) => b.category === "character_studio");
function badgeSnapshot(pid: string): Set<string> {
  const ctx: RuleBadgeContext = {
    completedUnits: new Set(),
    masteredUnits: new Set(),
    openUnitCount: 0,
    plannedUnitsByLevel: {},
    conversationUnitKeys: [],
    conversationCompletedUnits: new Set(),
    crosswordClears: 0,
    bubblePopClears: 0,
    characterStudio: loadCharacter(pid) as unknown as CharacterStudioProfileData | null,
    availableScenes: freeScenes(),
    availablePoses: performablePoses(),
  };
  return new Set(CHARACTER_BADGES.filter((b) => evaluateRuleBadge(b, ctx)?.achieved).map((b) => b.id));
}

export interface SaveResult {
  /** 第一次存角色送的代幣（0＝沒送） */
  firstReward: number;
  /** 這次新拿到的徽章名稱 */
  newBadges: string[];
}

/** 把造型存進目前使用中的角色（沒有角色存檔就用這個造型建立第一個角色） */
export function saveActiveLook(pid: string, look: Look): SaveResult {
  const before = badgeSnapshot(pid);
  let data: CharacterData | null = loadCharacter(pid);
  if (!data) {
    data = createInitial();
  }
  const slot = data.slots[data.activeSlot];
  slot.look = normalizeLook(sanitizeLook(pid, look).look);
  slot.updatedAt = Date.now();
  data.stats.slotsEverSaved = { ...(data.stats.slotsEverSaved ?? {}), [slot.id]: lookFingerprint(slot.look) };
  let firstReward = 0;
  if (!data.stats.firstSaveRewarded) {
    data.stats.firstSaveRewarded = true;
    earnTokens(pid, FIRST_SAVE_TOKENS);
    firstReward = FIRST_SAVE_TOKENS;
  }
  saveCharacter(pid, data);
  const after = badgeSnapshot(pid);
  const newBadges = CHARACTER_BADGES.filter((b) => after.has(b.id) && !before.has(b.id)).map((b) => b.name);
  return { firstReward, newBadges };
}

/** 改角色存檔的統計（拍照、表演動作）：mutate 回傳 true 才存檔；回傳這次新拿到的徽章名稱 */
export function updateStats(pid: string, mutate: (data: CharacterData) => boolean): string[] {
  const before = badgeSnapshot(pid);
  const data = loadCharacter(pid) ?? createInitial();
  if (!mutate(data)) return [];
  saveCharacter(pid, data);
  const after = badgeSnapshot(pid);
  return CHARACTER_BADGES.filter((b) => after.has(b.id) && !before.has(b.id)).map((b) => b.name);
}

export function sameLook(a: Look, b: Look): boolean {
  return lookFingerprint(a) === lookFingerprint(b);
}
