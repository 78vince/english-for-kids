// 蟑螂數獨遊戲存檔：key englishForKids.roachSudoku.v1.<profileId>，走 storage.ts 區網同步。
import { appStorage } from "../storage";

export const ROACH_SUDOKU_KEY_PREFIX = "englishForKids.roachSudoku.v1";

export interface RoachSudokuStageRecord {
  stars: number;
  fastestSec: number;
}

export interface RoachSudokuProfileRecord {
  bestStars: number;
  stagesCleared: number;
  totalGames: number;
  totalRoachesCaught: number;
  stageRecords: Record<string, RoachSudokuStageRecord>;
  lastStars: number;
  lastStageId: string;
  updatedAt: number;
}

export function roachSudokuKey(profileId: string): string {
  return `${ROACH_SUDOKU_KEY_PREFIX}.${profileId}`;
}

export function defaultRoachSudokuRecord(): RoachSudokuProfileRecord {
  return {
    bestStars: 0,
    stagesCleared: 0,
    totalGames: 0,
    totalRoachesCaught: 0,
    stageRecords: {},
    lastStars: 0,
    lastStageId: "stage_1",
    updatedAt: 0,
  };
}

export function loadRoachSudokuRecord(profileId: string): RoachSudokuProfileRecord {
  if (!profileId) return defaultRoachSudokuRecord();
  try {
    const raw = appStorage.getItem(roachSudokuKey(profileId));
    if (!raw) return defaultRoachSudokuRecord();
    const data = JSON.parse(raw);
    const stageRecords: Record<string, RoachSudokuStageRecord> = {};
    if (data.stageRecords && typeof data.stageRecords === "object") {
      for (const [k, v] of Object.entries(data.stageRecords as Record<string, any>)) {
        if (v && typeof v === "object") {
          stageRecords[k] = {
            stars: Math.max(0, Math.min(3, Number(v.stars) || 0)),
            fastestSec: Math.max(0, Number(v.fastestSec) || 0),
          };
        }
      }
    }
    return {
      bestStars: Math.max(0, Math.min(3, Number(data.bestStars) || 0)),
      stagesCleared: Math.max(0, Number(data.stagesCleared) || 0),
      totalGames: Math.max(0, Number(data.totalGames) || 0),
      totalRoachesCaught: Math.max(0, Number(data.totalRoachesCaught) || 0),
      stageRecords,
      lastStars: Math.max(0, Math.min(3, Number(data.lastStars) || 0)),
      lastStageId: typeof data.lastStageId === "string" ? data.lastStageId : "stage_1",
      updatedAt: Number(data.updatedAt) || 0,
    };
  } catch {
    return defaultRoachSudokuRecord();
  }
}

export function saveRoachSudokuGame(
  profileId: string,
  result: {
    stageId: string;
    stars: number;
    timeSec: number;
    roachesCaught: number;
  }
): { isNewRecord: boolean; record: RoachSudokuProfileRecord } {
  if (!profileId) {
    const d = defaultRoachSudokuRecord();
    return { isNewRecord: false, record: d };
  }

  const current = loadRoachSudokuRecord(profileId);
  const prevStage = current.stageRecords[result.stageId] || { stars: 0, fastestSec: 0 };

  const higherStars = result.stars > prevStage.stars;
  const fasterTime =
    result.stars >= 1 &&
    result.timeSec > 0 &&
    (prevStage.fastestSec === 0 || result.timeSec < prevStage.fastestSec);
  const isNewRecord = higherStars || fasterTime;

  const newStageRecords = { ...current.stageRecords };
  newStageRecords[result.stageId] = {
    stars: Math.max(prevStage.stars, result.stars),
    fastestSec:
      prevStage.fastestSec === 0
        ? result.timeSec
        : result.timeSec > 0
          ? Math.min(prevStage.fastestSec, result.timeSec)
          : prevStage.fastestSec,
  };

  const clearedCount = Object.values(newStageRecords).filter((s) => s.stars >= 1).length;

  const updated: RoachSudokuProfileRecord = {
    bestStars: Math.max(current.bestStars, result.stars),
    stagesCleared: Math.max(current.stagesCleared, clearedCount),
    totalGames: current.totalGames + 1,
    totalRoachesCaught: current.totalRoachesCaught + result.roachesCaught,
    stageRecords: newStageRecords,
    lastStars: result.stars,
    lastStageId: result.stageId,
    updatedAt: Date.now(),
  };

  try {
    appStorage.setItem(roachSudokuKey(profileId), JSON.stringify(updated));
  } catch {
    // 忽略寫入失敗
  }

  return { isNewRecord, record: updated };
}

export function getRoachSudokuTitle(stagesCleared: number): { title: string; en: string } {
  if (stagesCleared >= 5) return { title: "終極家政大師", en: "Master of Cleanliness" };
  if (stagesCleared >= 3) return { title: "小強剋星", en: "Roach Nemesis" };
  if (stagesCleared >= 2) return { title: "神準拖鞋手", en: "Slipper Sharpshooter" };
  return { title: "地板見習生", en: "Floor Trainee" };
}
