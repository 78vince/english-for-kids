// 打地鼠遊戲存檔：key englishForKids.mole.v1.<profileId>，走 storage.ts 區網同步。
import { appStorage } from "../storage";

export const MOLE_KEY_PREFIX = "englishForKids.mole.v1";

export interface MoleProfileRecord {
  bestScore: number;
  bestStars: number;
  bestCombo: number;
  totalGames: number;
  totalHits: number;
  totalMelonsHit: number;
  lastScore: number;
  lastStars: number;
  lastCombo: number;
  lastMelonsHit: number;
  updatedAt: number;
}

export function moleKey(profileId: string): string {
  return `${MOLE_KEY_PREFIX}.${profileId}`;
}

export function defaultMoleRecord(): MoleProfileRecord {
  return {
    bestScore: 0,
    bestStars: 0,
    bestCombo: 0,
    totalGames: 0,
    totalHits: 0,
    totalMelonsHit: 0,
    lastScore: 0,
    lastStars: 0,
    lastCombo: 0,
    lastMelonsHit: 0,
    updatedAt: 0,
  };
}

export function loadMoleRecord(profileId: string): MoleProfileRecord {
  if (!profileId) return defaultMoleRecord();
  try {
    const raw = appStorage.getItem(moleKey(profileId));
    if (!raw) return defaultMoleRecord();
    const data = JSON.parse(raw);
    return {
      bestScore: Math.max(0, Number(data.bestScore) || 0),
      bestStars: Math.max(0, Math.min(3, Number(data.bestStars) || 0)),
      bestCombo: Math.max(0, Number(data.bestCombo) || 0),
      totalGames: Math.max(0, Number(data.totalGames) || 0),
      totalHits: Math.max(0, Number(data.totalHits) || 0),
      totalMelonsHit: Math.max(0, Number(data.totalMelonsHit) || 0),
      lastScore: Math.max(0, Number(data.lastScore) || 0),
      lastStars: Math.max(0, Math.min(3, Number(data.lastStars) || 0)),
      lastCombo: Math.max(0, Number(data.lastCombo) || 0),
      lastMelonsHit: Math.max(0, Number(data.lastMelonsHit) || 0),
      updatedAt: Number(data.updatedAt) || 0,
    };
  } catch {
    return defaultMoleRecord();
  }
}

export function saveMoleGame(
  profileId: string,
  result: {
    score: number;
    stars: number;
    maxCombo: number;
    melonsHit: number;
  }
): { isNewRecord: boolean; record: MoleProfileRecord } {
  if (!profileId) {
    const d = defaultMoleRecord();
    return { isNewRecord: false, record: d };
  }

  const current = loadMoleRecord(profileId);

  const higherScore = result.score > current.bestScore;
  const higherStars = result.stars > current.bestStars;
  const higherCombo = result.maxCombo > current.bestCombo;
  const isNewRecord = higherScore || higherStars || higherCombo;

  const updated: MoleProfileRecord = {
    bestScore: Math.max(current.bestScore, result.score),
    bestStars: Math.max(current.bestStars, result.stars),
    bestCombo: Math.max(current.bestCombo, result.maxCombo),
    totalGames: current.totalGames + 1,
    totalHits: current.totalHits + result.score,
    totalMelonsHit: current.totalMelonsHit + result.melonsHit,
    lastScore: result.score,
    lastStars: result.stars,
    lastCombo: result.maxCombo,
    lastMelonsHit: result.melonsHit,
    updatedAt: Date.now(),
  };

  try {
    appStorage.setItem(moleKey(profileId), JSON.stringify(updated));
  } catch {
    // 忽略寫入失敗
  }

  return { isNewRecord, record: updated };
}

export function getMoleTitle(score: number): { title: string; en: string } {
  if (score >= 34) return { title: "閃電擊掌王", en: "Lightning Tapper" };
  if (score >= 24) return { title: "躲貓貓大師", en: "Peekaboo Master" };
  if (score >= 12) return { title: "反應小快手", en: "Quick Paws" };
  return { title: "草地探索員", en: "Grassland Explorer" };
}
