// 爬樹存檔：key englishForKids.treeClimb.v1.<profileId>，走 storage.ts 的區網同步。
// 格式依 docs/handoff-prompt-letsgo-tree-climb.md 與 plan-game-tree-climb.md；
// 解鎖狀態由前一關 stars >= 2 推導。

import { appStorage } from "../storage";
import type { TreeClimbLevelRecord, TreeClimbProfileData } from "../types";

export type { TreeClimbLevelRecord, TreeClimbProfileData };

export const TREE_CLIMB_KEY_PREFIX = "englishForKids.treeClimb.v1";

export function treeClimbKey(profileId: string): string {
  return `${TREE_CLIMB_KEY_PREFIX}.${profileId}`;
}

export function emptyLevelRecord(): TreeClimbLevelRecord {
  return { bestAlt: 0, bestMeters: 0, stars: 0, climbs: 0, summits: 0 };
}

export function emptyTreeClimb(): TreeClimbProfileData {
  return {
    levels: {},
    rewards: { badges: [], titles: [] },
    stats: {
      played: 0,
      coinsSpent: 0,
      totalMeters: 0,
      summits: 0,
      hourglassesPicked: 0,
      capesUsed: 0,
      falls: 0,
    },
  };
}

export function loadTreeClimb(profileId: string): TreeClimbProfileData {
  const raw = appStorage.getItem(treeClimbKey(profileId));
  const d = emptyTreeClimb();
  if (!raw) return d;
  try {
    const j = JSON.parse(raw);
    if (j.levels && typeof j.levels === "object") {
      for (const [k, v] of Object.entries(j.levels as Record<string, any>)) {
        if (!v || typeof v !== "object") continue;
        d.levels[k] = {
          bestAlt: Math.max(0, Number(v.bestAlt) || 0),
          bestMeters: Math.max(0, Number(v.bestMeters) || 0),
          stars: Math.max(0, Math.min(3, Number(v.stars) || 0)),
          climbs: Math.max(0, Number(v.climbs) || 0),
          summits: Math.max(0, Number(v.summits) || 0),
        };
      }
    }
    const r = j.rewards ?? {};
    d.rewards = {
      badges: Array.isArray(r.badges) ? r.badges.filter((x: unknown) => typeof x === "string") : [],
      titles: Array.isArray(r.titles) ? r.titles.filter((x: unknown) => typeof x === "string") : [],
    };
    const s = j.stats ?? {};
    d.stats = {
      played: Math.max(0, Number(s.played) || 0),
      coinsSpent: Math.max(0, Number(s.coinsSpent) || 0),
      totalMeters: Math.max(0, Number(s.totalMeters) || 0),
      summits: Math.max(0, Number(s.summits) || 0),
      hourglassesPicked: Math.max(0, Number(s.hourglassesPicked) || 0),
      capesUsed: Math.max(0, Number(s.capesUsed) || 0),
      falls: Math.max(0, Number(s.falls) || 0),
    };
  } catch {
    // 壞資料：當成新的
  }
  return d;
}

export function saveTreeClimb(profileId: string, d: TreeClimbProfileData): void {
  appStorage.setItem(treeClimbKey(profileId), JSON.stringify(d));
}

export function levelRecord(d: TreeClimbProfileData, levelId: string): TreeClimbLevelRecord {
  return d.levels[levelId] ?? emptyLevelRecord();
}

/** 依據關卡 unlock 設定判定是否開放（小樹苗預設開放；大橡樹需小樹苗 ★★；千年神木需大橡樹 ★★） */
export function isLevelUnlocked(
  d: TreeClimbProfileData,
  level: { id: string; unlock?: { level: string; stars: number } | null }
): boolean {
  if (!level.unlock) return true;
  const prev = levelRecord(d, level.unlock.level);
  return prev.stars >= level.unlock.stars;
}

/** 星等換算：依高度公尺數對照門檻 [★, ★★, ★★★] */
export function starsFor(meters: number, thresholds: number[]): number {
  if (!thresholds || thresholds.length < 3) return 0;
  if (meters >= thresholds[2]) return 3;
  if (meters >= thresholds[1]) return 2;
  if (meters >= thresholds[0]) return 1;
  return 0;
}

/** 記錄一局成績，回傳是否創個人紀錄與新獲得的稱號 */
export function recordResult(
  d: TreeClimbProfileData,
  levelId: string,
  r: {
    alt: number;
    meters: number;
    stars: number;
    summit: boolean;
    hourglasses: number;
    capes: number;
    falls: number;
  },
  titles: { id: string; label: string; meters?: number; summit?: boolean }[]
): { isNewBest: boolean; newTitles: string[] } {
  const cur = { ...levelRecord(d, levelId) };
  const isNewBest = r.meters > cur.bestMeters;

  cur.bestAlt = Math.max(cur.bestAlt, r.alt);
  cur.bestMeters = Math.max(cur.bestMeters, r.meters);
  cur.stars = Math.max(cur.stars, r.stars);
  cur.climbs += 1;
  if (r.summit) cur.summits += 1;
  d.levels[levelId] = cur;

  if (!d.stats) {
    d.stats = {
      played: 0,
      coinsSpent: 0,
      totalMeters: 0,
      summits: 0,
      hourglassesPicked: 0,
      capesUsed: 0,
      falls: 0,
    };
  }
  d.stats.played += 1;
  d.stats.totalMeters += r.meters;
  if (r.summit) d.stats.summits += 1;
  d.stats.hourglassesPicked += r.hourglasses;
  d.stats.capesUsed += r.capes;
  d.stats.falls += r.falls;

  const newTitles: string[] = [];
  if (!d.rewards) d.rewards = { badges: [], titles: [] };
  if (!d.rewards.titles) d.rewards.titles = [];

  for (const t of titles) {
    let earned = false;
    if (t.summit && r.summit) earned = true;
    else if (typeof t.meters === "number" && cur.bestMeters >= t.meters) earned = true;
    if (earned && !d.rewards.titles.includes(t.label)) {
      d.rewards.titles.push(t.label);
      newTitles.push(t.label);
    }
  }

  return { isNewBest, newTitles };
}

/** 稱號：取最高的一個 */
export function topTitle(
  d: TreeClimbProfileData,
  titles: { id: string; label: string }[]
): string | null {
  if (!d.rewards?.titles) return null;
  for (let i = titles.length - 1; i >= 0; i--) {
    if (d.rewards.titles.includes(titles[i].label)) return titles[i].label;
  }
  return null;
}
