// 賽跑存檔：key englishForKids.race.v1.<profileId>，走 storage.ts 的區網同步（跟 characterStore 同風格）。
// 格式見原專案 docs/handoff-prompt-letsgo-race.md §10；解鎖狀態由 stages[N].wins ≥ 1 推導，不另存。

import { appStorage } from "../storage";
import type { RaceProfileData as RaceProfileBase, RaceStageRecord } from "../types";

/** 讀進來之後一律補齊所有欄位（types.ts 的 RaceProfileData 給徽章判定用，欄位可選） */
export interface RaceProfileData extends RaceProfileBase {
  losses: number;
  rewards: { badges: string[]; titles: string[]; trophy: boolean };
  stats: { played: number; coinsSpent: number };
}

export const RACE_KEY_PREFIX = "englishForKids.race.v1";

export function raceKey(profileId: string): string {
  return `${RACE_KEY_PREFIX}.${profileId}`;
}

function emptyStage(): RaceStageRecord {
  return { best: null, stars: 0, wins: 0, hitsMin: null };
}

export function emptyRace(): RaceProfileData {
  return { stages: {}, losses: 0, rewards: { badges: [], titles: [], trophy: false }, stats: { played: 0, coinsSpent: 0 } };
}

export function loadRace(profileId: string): RaceProfileData {
  const raw = appStorage.getItem(raceKey(profileId));
  const d = emptyRace();
  if (!raw) return d;
  try {
    const j = JSON.parse(raw);
    if (j.stages && typeof j.stages === "object") {
      for (const [k, v] of Object.entries(j.stages as Record<string, any>)) {
        if (!v || typeof v !== "object") continue;
        d.stages[k] = {
          best: typeof v.best === "number" ? v.best : null,
          stars: Math.max(0, Math.min(3, Number(v.stars) || 0)),
          wins: Math.max(0, Number(v.wins) || 0),
          hitsMin: typeof v.hitsMin === "number" ? v.hitsMin : null,
        };
      }
    }
    d.losses = Math.max(0, Number(j.losses) || 0);
    const r = j.rewards ?? {};
    d.rewards = {
      badges: Array.isArray(r.badges) ? r.badges.filter((x: unknown) => typeof x === "string") : [],
      titles: Array.isArray(r.titles) ? r.titles.filter((x: unknown) => typeof x === "string") : [],
      trophy: !!r.trophy,
    };
    const s = j.stats ?? {};
    d.stats = { played: Math.max(0, Number(s.played) || 0), coinsSpent: Math.max(0, Number(s.coinsSpent) || 0) };
  } catch {
    // 壞資料：當成新的
  }
  return d;
}

export function saveRace(profileId: string, d: RaceProfileData): void {
  appStorage.setItem(raceKey(profileId), JSON.stringify(d));
}

export function stageRecord(d: RaceProfileData, id: number): RaceStageRecord {
  return d.stages[String(id)] ?? emptyStage();
}

/** 第 1 場永遠開放；贏過第 N 場才解鎖第 N+1 場 */
export function isUnlocked(d: RaceProfileData, id: number): boolean {
  return id <= 1 || stageRecord(d, id - 1).wins >= 1;
}

/** 星等：★ 勝利；★★ 且時間 ≤ targetTime；★★★ 且撞擊 0 */
export function starsFor(win: boolean, time: number, targetTime: number, hits: number): number {
  if (!win) return 0;
  if (time > targetTime) return 1;
  return hits === 0 ? 3 : 2;
}

/** 記一場結果；回傳新取得的稱號（只發一次） */
export function recordResult(
  d: RaceProfileData,
  id: number,
  r: { win: boolean; time: number; stars: number; hits: number },
  titles: string[],
  stageCount: number
): { newTitles: string[]; trophy: boolean } {
  const s = { ...stageRecord(d, id) };
  if (r.win) {
    s.wins += 1;
    s.best = s.best === null ? r.time : Math.min(s.best, r.time);
    s.stars = Math.max(s.stars, r.stars);
    s.hitsMin = s.hitsMin === null ? r.hits : Math.min(s.hitsMin, r.hits);
    d.losses = 0;
  } else d.losses += 1;
  d.stages[String(id)] = s;
  const newTitles: string[] = [];
  if (r.win) {
    const t = titles[id - 1];
    if (t && !d.rewards.titles.includes(t)) {
      d.rewards.titles.push(t);
      newTitles.push(t);
    }
  }
  let trophy = false;
  if (!d.rewards.trophy && stageCount > 0) {
    let all = true;
    for (let i = 1; i <= stageCount; i++) if (stageRecord(d, i).wins < 1) all = false;
    if (all) {
      d.rewards.trophy = true;
      trophy = true;
    }
  }
  return { newTitles, trophy };
}

/** 稱號：取最高的一個（飛毛腿 > 閃電跑者 > 森林跑者） */
export function topTitle(d: RaceProfileData, titles: string[]): string | null {
  for (let i = titles.length - 1; i >= 0; i--) if (d.rewards.titles.includes(titles[i])) return titles[i];
  return null;
}
