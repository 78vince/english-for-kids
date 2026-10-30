// 巨大南瓜怪大作戰遊戲存檔：key englishForKids.pumpkinBoss.v1.<profileId>，走 storage.ts 區網同步。
import { appStorage } from "../storage";

export const PUMPKIN_BOSS_KEY_PREFIX = "englishForKids.pumpkinBoss.v1";

export interface PumpkinBossProfileRecord {
  victories: number;
  totalGames: number;
  bestTimeSec: number;
  hasTalisman: boolean;
  updatedAt: number;
}

export function pumpkinBossKey(profileId: string): string {
  return `${PUMPKIN_BOSS_KEY_PREFIX}.${profileId}`;
}

export function defaultPumpkinBossRecord(): PumpkinBossProfileRecord {
  return {
    victories: 0,
    totalGames: 0,
    bestTimeSec: 0,
    hasTalisman: false,
    updatedAt: 0,
  };
}

export function loadPumpkinBossRecord(profileId: string): PumpkinBossProfileRecord {
  if (!profileId) return defaultPumpkinBossRecord();
  try {
    const raw = appStorage.getItem(pumpkinBossKey(profileId));
    let rec: PumpkinBossProfileRecord;
    if (!raw) {
      rec = defaultPumpkinBossRecord();
    } else {
      const data = JSON.parse(raw);
      rec = {
        victories: Math.max(0, Number(data.victories) || 0),
        totalGames: Math.max(0, Number(data.totalGames) || 0),
        bestTimeSec: Math.max(0, Number(data.bestTimeSec) || 0),
        hasTalisman: Boolean(data.hasTalisman),
        updatedAt: Number(data.updatedAt) || 0,
      };
    }

    // 跨設備自動修復：若南瓜怪記錄尚未帶有 talisman，但角色外觀資料已裝備變身符咒，自動修復為已解鎖
    if (!rec.hasTalisman) {
      try {
        const charRaw = appStorage.getItem(`englishForKids.character.v1.${profileId}`);
        if (charRaw) {
          const charData = JSON.parse(charRaw);
          const slots = Array.isArray(charData?.slots) ? charData.slots : [];
          const hasInLook = slots.some((s: any) => s?.look?.accessories?.includes("zombieTalisman"));
          if (hasInLook) {
            rec.hasTalisman = true;
            rec.updatedAt = Date.now();
            appStorage.setItem(pumpkinBossKey(profileId), JSON.stringify(rec));
          }
        }
      } catch {
        // 忽略角色存檔檢查異常
      }
    }

    return rec;
  } catch {
    return defaultPumpkinBossRecord();
  }
}

export function savePumpkinBossRecord(profileId: string, record: PumpkinBossProfileRecord): void {
  if (!profileId) return;
  try {
    let existingTalisman = false;
    let existingVictories = 0;
    let existingTotalGames = 0;
    let existingBestTimeSec = 0;
    const raw = appStorage.getItem(pumpkinBossKey(profileId));
    if (raw) {
      try {
        const d = JSON.parse(raw);
        existingTalisman = Boolean(d.hasTalisman);
        existingVictories = Math.max(0, Number(d.victories) || 0);
        existingTotalGames = Math.max(0, Number(d.totalGames) || 0);
        existingBestTimeSec = Math.max(0, Number(d.bestTimeSec) || 0);
      } catch {
        // 忽略解析異常
      }
    }
    // 守護變身符咒：只要任一處曾解鎖過，就永不降級為 false；勝場與總場次取最大；時間取非 0 最快
    const hasTalisman = Boolean(record.hasTalisman || existingTalisman);
    const victories = Math.max(record.victories, existingVictories);
    const totalGames = Math.max(record.totalGames, existingTotalGames);
    let bestTimeSec = 0;
    if (record.bestTimeSec > 0 && existingBestTimeSec > 0) {
      bestTimeSec = Math.min(record.bestTimeSec, existingBestTimeSec);
    } else if (record.bestTimeSec > 0) {
      bestTimeSec = record.bestTimeSec;
    } else {
      bestTimeSec = existingBestTimeSec;
    }

    const payload: PumpkinBossProfileRecord = {
      victories,
      totalGames,
      bestTimeSec,
      hasTalisman,
      updatedAt: Date.now(),
    };
    appStorage.setItem(pumpkinBossKey(profileId), JSON.stringify(payload));
  } catch {
    // 忽略寫入失敗
  }
}
