// 學習積分——純粹是既有統計資料的加權算式，本身不記錄、不新增任何 localStorage 資料，
// 每次呼叫都是即時算出來的（沒有快取，資料量小，效能不是問題）。
import { getBadgeStats } from "./badgeStats";

export const POINTS_PER_CORRECT_ANSWER = 10;
export const POINTS_PER_PERFECT_LEVEL = 50;
export const POINTS_PER_CORRECT_STREAK = 30;
export const POINTS_PER_BADGE = 100;

/** achievedBadgeCount 由呼叫端傳入（main.ts 的 countAchievedBadges() 已經算好，避免重算一次）。 */
export function computeLearningPoints(profileId: string, achievedBadgeCount: number): number {
  const stats = getBadgeStats(profileId);
  return (
    stats.totalCorrectAnswered * POINTS_PER_CORRECT_ANSWER +
    stats.perfectLevelAchievedCount * POINTS_PER_PERFECT_LEVEL +
    stats.correctStreakAchievedCount * POINTS_PER_CORRECT_STREAK +
    achievedBadgeCount * POINTS_PER_BADGE
  );
}
