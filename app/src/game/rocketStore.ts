// 火箭發射遊戲存檔：key englishForKids.rocket.v1.<profileId>，走 storage.ts 區網同步。
import { appStorage } from "../storage";

export const ROCKET_KEY_PREFIX = "englishForKids.rocket.v1";

export interface RocketProfileRecord {
  bestTaps: number;
  bestAltitude: number;
  bestCPS: number;
  bestTime: number; // 歷史最佳達成時間（秒，越短越好；0 代表未曾通關）
  lastClearTime: number; // 最近一次通關時間（秒）
  totalFlights: number;
  successfulMissions: number;
  lastTaps: number;
  lastAltitude: number;
  lastSuccess: boolean;
  updatedAt: number;
}

export function rocketKey(profileId: string): string {
  return `${ROCKET_KEY_PREFIX}.${profileId}`;
}

export function defaultRocketRecord(): RocketProfileRecord {
  return {
    bestTaps: 0,
    bestAltitude: 0,
    bestCPS: 0,
    bestTime: 0,
    lastClearTime: 0,
    totalFlights: 0,
    successfulMissions: 0,
    lastTaps: 0,
    lastAltitude: 0,
    lastSuccess: false,
    updatedAt: 0,
  };
}

export function loadRocketRecord(profileId: string): RocketProfileRecord {
  if (!profileId) return defaultRocketRecord();
  try {
    const raw = appStorage.getItem(rocketKey(profileId));
    if (!raw) return defaultRocketRecord();
    const data = JSON.parse(raw);
    return {
      bestTaps: Math.max(0, Number(data.bestTaps) || 0),
      bestAltitude: Math.max(0, Number(data.bestAltitude) || 0),
      bestCPS: Math.max(0, Number(data.bestCPS) || 0),
      bestTime: Math.max(0, Number(data.bestTime) || 0),
      lastClearTime: Math.max(0, Number(data.lastClearTime) || 0),
      totalFlights: Math.max(0, Number(data.totalFlights) || 0),
      successfulMissions: Math.max(0, Number(data.successfulMissions) || 0),
      lastTaps: Math.max(0, Number(data.lastTaps) || 0),
      lastAltitude: Math.max(0, Number(data.lastAltitude) || 0),
      lastSuccess: Boolean(data.lastSuccess),
      updatedAt: Number(data.updatedAt) || 0,
    };
  } catch {
    return defaultRocketRecord();
  }
}

export function saveRocketFlight(
  profileId: string,
  result: {
    taps: number;
    altitude: number;
    peakCPS: number;
    success: boolean;
    clearTime?: number;
  }
): { isNewRecord: boolean; record: RocketProfileRecord } {
  if (!profileId) {
    const d = defaultRocketRecord();
    return { isNewRecord: false, record: d };
  }

  const current = loadRocketRecord(profileId);

  // 判定是否破紀錄（最高點擊數、最高高度、或更快達成時間）
  const fasterTime =
    result.success &&
    result.clearTime !== undefined &&
    result.clearTime > 0 &&
    (current.bestTime === 0 || result.clearTime < current.bestTime);

  const higherTaps = result.taps > current.bestTaps;
  const higherAlt = result.altitude > current.bestAltitude;
  const isNewRecord = higherTaps || higherAlt || fasterTime;

  let newBestTime = current.bestTime;
  if (result.success && result.clearTime && result.clearTime > 0) {
    newBestTime = current.bestTime === 0 ? Number(result.clearTime.toFixed(1)) : Math.min(current.bestTime, Number(result.clearTime.toFixed(1)));
  }

  const updated: RocketProfileRecord = {
    bestTaps: Math.max(current.bestTaps, result.taps),
    bestAltitude: Math.max(current.bestAltitude, result.altitude),
    bestCPS: Math.max(current.bestCPS, Number(result.peakCPS.toFixed(1))),
    bestTime: newBestTime,
    lastClearTime: result.clearTime ? Number(result.clearTime.toFixed(1)) : 0,
    totalFlights: current.totalFlights + 1,
    successfulMissions: current.successfulMissions + (result.success ? 1 : 0),
    lastTaps: result.taps,
    lastAltitude: result.altitude,
    lastSuccess: result.success,
    updatedAt: Date.now(),
  };

  try {
    appStorage.setItem(rocketKey(profileId), JSON.stringify(updated));
  } catch {
    // 忽略寫入失敗
  }

  return { isNewRecord, record: updated };
}

export function getRocketRank(altitude: number, success: boolean): { title: string; subtitle: string; icon: string } {
  if (success || altitude >= 30000) {
    return {
      title: "傳奇宇航員 (Cosmic Astronaut)",
      subtitle: "突破大氣層，遨遊無重力宇宙！",
      icon: "🌟",
    };
  }
  if (altitude >= 20000) {
    return {
      title: "極光巡航先鋒 (Aurora Cruiser)",
      subtitle: "穿越平流層與極光帶，離太空只差一步！",
      icon: "⚡",
    };
  }
  if (altitude >= 10000) {
    return {
      title: "雲霄飛行員 (Cloud Explorer)",
      subtitle: "衝破對流層與雲海，表現亮眼！",
      icon: "☁️",
    };
  }
  return {
    title: "實習試飛員 (Space Cadet)",
    subtitle: "雙手交替快速點按，下次一定能衝更高！",
    icon: "🌱",
  };
}
