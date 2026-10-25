// 公開版轉接檔（2026-10-20）：LetsGo 的 badgeRules.ts 是規則式徽章（單元精熟、角色工作室 CS-01～07、
// 賽跑 RC-01～05…）。公開版的徽章系統不同（content/badges/badges.json，main.ts 判定），
// 第一階段先不判定「我的角色」相關徽章：evaluateRuleBadge 一律回傳 null（＝不適用），
// 遊戲裡就不會跳出徽章提示。之後要加徽章時，再把這兩類規則移植到這裡並在 badges.json 補資料。
import type { Badge } from "./types";

export type RuleBadgeContext = Record<string, unknown>;

export function evaluateRuleBadge(_badge: Badge, _ctx: RuleBadgeContext): { achieved: boolean } | null {
  return null;
}
