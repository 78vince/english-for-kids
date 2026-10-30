// 造型商店（game-tokens v2.1 `shop`）：用遊戲代幣購買新款式（髮型、表情、配件、手持物、場景…）。
// - 原本的款式全部免費；只有 GameTokens.shop.items 列出的才要購買。
// - 擁有清單存在 englishForKids.wardrobe.v1.<profileId>（同步到區網電腦）。伺服器對這個 key 做「聯集合併」
//   （server.mjs mergeWardrobe）：兩台平板各自買的東西都會保留，同一件以 updatedAt 較新的為準（退回也算更新）。
// - 買下後 refundWindowMs（預設 10 分鐘）內可以退回，全額退代幣。
// - 刻意不做抽獎、隨機獎勵、限時特價；價格看得到、要按「確定購買」才扣代幣。（場景試玩有 30 秒、每天 3 次的限制，見檔案最後）

import { appStorage } from "../storage";
import { GameArt, GameTokens, normalizeLook, type Look } from "./gameKit";
import { earnTokens, getTokenBalance, spendTokens } from "../gameTokens";
import { LAB_MODE } from "../gameRelease";

export const WARDROBE_KEY_PREFIX = "englishForKids.wardrobe.v1";
export type ShopField = "hairStyle" | "mouth" | "eyes" | "brows" | "faceShape" | "outfit" | "accessories" | "held" | "scene";
const LOOK_FIELDS: ShopField[] = ["hairStyle", "mouth", "eyes", "brows", "faceShape", "outfit", "accessories", "held"];

export interface ShopItem {
  id: string;
  field: ShopField;
  value: string;
  price: number;
  tier: string;
}
export interface WardrobeEntry {
  at: number;
  price: number;
  refundedAt?: number;
  updatedAt: number;
}
export interface WardrobeData {
  version: 1;
  items: Record<string, WardrobeEntry>;
}

/** 這些欄位遇到「沒買的款式」時換成的預設值（不是商品的基本款） */
const FALLBACK: Partial<Record<ShopField, string>> = {
  hairStyle: "short",
  mouth: "smile",
  eyes: "dot",
  brows: "none",
  faceShape: "round",
  outfit: "tee",
  held: "none",
};

function shopToken(): any {
  return (GameTokens as any)?.shop ?? null;
}

export function shopItems(): ShopItem[] {
  const items = shopToken()?.items;
  if (!Array.isArray(items)) return [];
  return items.filter(
    (it: any) =>
      it &&
      typeof it.id === "string" &&
      typeof it.field === "string" &&
      typeof it.value === "string" &&
      typeof it.price === "number" &&
      it.price > 0
  );
}

export function refundWindowMs(): number {
  const v = shopToken()?.refundWindowMs;
  return typeof v === "number" && v >= 0 ? v : 10 * 60 * 1000;
}

export function findItem(field: string, value: string): ShopItem | undefined {
  return shopItems().find((it) => it.field === field && it.value === value);
}

/** 不在商店裡的場景（徽章「環遊世界」只算免費場景，買不買新場景都不影響已經能得到的徽章） */
export function freeScenes(): string[] {
  return GameArt.scenes.filter((id) => !findItem("scene", id));
}

export function wardrobeKey(profileId: string): string {
  return `${WARDROBE_KEY_PREFIX}.${profileId}`;
}

function validEntry(e: any): e is WardrobeEntry {
  return e && typeof e.at === "number" && typeof e.price === "number" && typeof e.updatedAt === "number";
}

export function parseWardrobe(raw: string | null | undefined): WardrobeData {
  try {
    const d = raw ? JSON.parse(raw) : null;
    const items: Record<string, WardrobeEntry> = {};
    if (d && d.items && typeof d.items === "object") {
      for (const [k, v] of Object.entries(d.items)) if (validEntry(v)) items[k] = v as WardrobeEntry;
    }
    return { version: 1, items };
  } catch {
    return { version: 1, items: {} };
  }
}

export function loadWardrobe(profileId: string): WardrobeData {
  try {
    return parseWardrobe(appStorage.getItem(wardrobeKey(profileId)));
  } catch {
    return { version: 1, items: {} };
  }
}

function saveWardrobe(profileId: string, d: WardrobeData): void {
  try {
    appStorage.setItem(wardrobeKey(profileId), JSON.stringify(d));
  } catch {
    // 寫入失敗安靜忽略（跟其他模組一致）
  }
}

/** 兩份擁有清單合併：聯集，同一件以 updatedAt 較新的為準（伺服器 mergeWardrobe 用同一套規則） */
export function mergeWardrobe(a: WardrobeData, b: WardrobeData): WardrobeData {
  const items: Record<string, WardrobeEntry> = { ...a.items };
  for (const [k, v] of Object.entries(b.items)) {
    const cur = items[k];
    if (!cur || v.updatedAt > cur.updatedAt) items[k] = v;
  }
  return { version: 1, items };
}

export function ownsEntry(e: WardrobeEntry | undefined): boolean {
  return !!e && !e.refundedAt;
}

/** 這個款式能不能用：不是商品＝免費；是商品＝要買過且沒退回。實驗室模式下全部開放測試。 */
export function isOwned(profileId: string, field: string, value: string, data?: WardrobeData): boolean {
  if (LAB_MODE) return true;
  const it = findItem(field, value);
  if (!it) return true;
  return ownsEntry((data ?? loadWardrobe(profileId)).items[it.id]);
}

export type PurchaseResult = { ok: true } | { ok: false; reason: "owned" } | { ok: false; reason: "tokens"; need: number };

export function purchase(profileId: string, item: ShopItem, now = Date.now()): PurchaseResult {
  const d = loadWardrobe(profileId);
  if (ownsEntry(d.items[item.id])) return { ok: false, reason: "owned" };
  if (!spendTokens(profileId, item.price)) return { ok: false, reason: "tokens", need: item.price - getTokenBalance(profileId) };
  d.items[item.id] = { at: now, price: item.price, updatedAt: now };
  saveWardrobe(profileId, d);
  return { ok: true };
}

export function refundable(e: WardrobeEntry | undefined, now = Date.now()): boolean {
  return ownsEntry(e) && now - e!.at <= refundWindowMs();
}

/** 退回：全額退代幣（退買的時候付的價格），擁有紀錄標上 refundedAt */
export function refund(profileId: string, item: ShopItem, now = Date.now()): boolean {
  const d = loadWardrobe(profileId);
  const e = d.items[item.id];
  if (!refundable(e, now)) return false;
  earnTokens(profileId, e.price);
  d.items[item.id] = { ...e, refundedAt: now, updatedAt: now };
  saveWardrobe(profileId, d);
  return true;
}

/** 還在退回期限內的商品（剛買的）與剩下的毫秒數 */
export function recentPurchases(profileId: string, now = Date.now()): { item: ShopItem; msLeft: number }[] {
  const d = loadWardrobe(profileId);
  const win = refundWindowMs();
  return shopItems()
    .map((item) => ({ item, e: d.items[item.id] }))
    .filter(({ e }) => refundable(e, now))
    .map(({ item, e }) => ({ item, msLeft: Math.max(0, win - (now - e!.at)) }));
}

/** 把造型裡「沒買（或已退回）」的商品款式換成預設值。changed＝有沒有換掉東西 */
export function sanitizeLook(profileId: string, look: Look, data?: WardrobeData): { look: Look; changed: boolean } {
  const d = data ?? loadWardrobe(profileId);
  const next: any = { ...look, accessories: [...(look.accessories ?? [])] };
  let changed = false;
  for (const f of LOOK_FIELDS) {
    if (f === "accessories") {
      const kept = next.accessories.filter((a: string) => isOwned(profileId, "accessories", a, d));
      if (kept.length !== next.accessories.length) {
        next.accessories = kept;
        changed = true;
      }
      continue;
    }
    const v = next[f];
    if (typeof v === "string" && !isOwned(profileId, f, v, d)) {
      next[f] = FALLBACK[f] ?? v;
      changed = true;
    }
  }
  return { look: changed ? normalizeLook(next) : look, changed };
}

/** 場景沒買（或已退回）就換回第一個免費場景 */
export function sanitizeSceneId(profileId: string, sceneId: string, data?: WardrobeData): string {
  if (isOwned(profileId, "scene", sceneId, data)) return sceneId;
  return freeScenes()[0] ?? "forest";
}

// ---- 場景試玩限制（2026-10-20，使用者決定）：還沒買的場景每次試玩 sceneTrial.seconds 秒（預設 30）、
// 每個場景每天 sceneTrial.perDay 次（預設 3）。避免一直試玩就等於免費玩。
// 次數只記在這台設備的 localStorage（不同步，輕度限制）；日期用本機日期，換天自動歸零。
export const SCENE_TRIAL_KEY_PREFIX = "englishForKids.sceneTrial.v1";
interface SceneTrialLog {
  date: string;
  counts: Record<string, number>;
}

export function sceneTrialRule(): { seconds: number; perDay: number } {
  const t = shopToken()?.sceneTrial;
  const seconds = typeof t?.seconds === "number" && t.seconds > 0 ? t.seconds : 30;
  const perDay = typeof t?.perDay === "number" && t.perDay >= 0 ? Math.floor(t.perDay) : 3;
  return { seconds, perDay };
}

function localDay(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function trialStore(): Storage | null {
  try {
    const g = globalThis as { localStorage?: Storage; window?: { localStorage?: Storage } };
    return g.localStorage ?? g.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

function loadSceneTrials(profileId: string, now: number): SceneTrialLog {
  const today = localDay(now);
  try {
    const raw = trialStore()?.getItem(`${SCENE_TRIAL_KEY_PREFIX}.${profileId}`);
    const v = raw ? JSON.parse(raw) : null;
    if (v && v.date === today && v.counts && typeof v.counts === "object") return { date: today, counts: v.counts };
  } catch {
    // 壞資料當作今天還沒試過
  }
  return { date: today, counts: {} };
}

/** 今天這個場景還能試玩幾次 */
export function sceneTrialsLeft(profileId: string, sceneId: string, now = Date.now()): number {
  if (LAB_MODE) return 999;
  const used = Number(loadSceneTrials(profileId, now).counts[sceneId]) || 0;
  return Math.max(0, sceneTrialRule().perDay - used);
}

/** 開始一次試玩：還有次數就記一次並回傳 true；用完了回傳 false */
export function useSceneTrial(profileId: string, sceneId: string, now = Date.now()): boolean {
  if (sceneTrialsLeft(profileId, sceneId, now) <= 0) return false;
  const log = loadSceneTrials(profileId, now);
  log.counts[sceneId] = (Number(log.counts[sceneId]) || 0) + 1;
  try {
    trialStore()?.setItem(`${SCENE_TRIAL_KEY_PREFIX}.${profileId}`, JSON.stringify(log));
  } catch {
    // 存不進去（私密模式等）：這次照樣讓他試
  }
  return true;
}
