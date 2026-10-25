// 遊戲代幣——遊戲室的消費貨幣，跟 points.ts 的「學習積分」是兩個完全獨立的數字：
// 學習積分是即時算出來、只會往上加的成就展示數字（沒有存檔、沒有餘額，見
// points.ts computeLearningPoints() 的說明）；遊戲代幣是這裡真正存檔的餘額，
// 可以賺、也可以花在遊戲室裡玩遊戲，兩者刻意不互通、不共用同一個數字，
// 避免「玩遊戲花掉代幣」讓學習成就的數字被牽連著變少（見 handoff 開頭的設計背景）。
//
// 跟 progress.ts／playTime.ts 同一套模式：per-profile、存在 localStorage，
// 容錯處理跟其他模組一致（讀取失敗回傳保守預設值、寫入失敗安靜忽略）。

import { appStorage } from "./storage"; // 學習紀錄：同步到區網電腦（見 storage.ts）

const TOKENS_STORAGE_KEY_PREFIX = "englishForKids.gameTokens.v1";

function storageKeyForProfile(profileId: string): string {
  return `${TOKENS_STORAGE_KEY_PREFIX}.${profileId}`;
}

export function getTokenBalance(profileId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = appStorage.getItem(storageKeyForProfile(profileId));
    const n = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeBalance(profileId: string, balance: number): void {
  if (typeof window === "undefined") return;
  try {
    appStorage.setItem(storageKeyForProfile(profileId), String(Math.max(0, balance)));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略，跟其餘模組一致
  }
}

/** （v1.7.0 起只當 economy 讀不到時的備援）舊規則：每完成一輪任何題型（不限主題、不限題型、不要求正確率）都呼叫這個函式賺代幣，
 * 金額固定不看正確率——第一階段刻意用最簡單、最容易跟小朋友解釋清楚的規則
 * 「每破一關就有 5 個代幣」，不要一開始就做複雜的加權公式，之後真的覺得
 * 步調太快/太慢，再回來調整這個常數就好。
 * 刻意的設計決定：玩遊戲室的遊戲本身不會再賺代幣。代幣只從「認真學習」這個方向賺，
 * 遊戲室是花代幣去的「休息/獎勵」，不是另一個賺代幣的迴圈——避免變成「一直玩遊戲刷
 * 代幣，再拿去玩更多遊戲」的沒意義迴圈，讓代幣真的跟「有在學習」掛勾。 */
export const TOKENS_EARNED_PER_ROUND = 5;

// ---- 代幣獲得規則（v1.7.0 起；2026-10-21 調整）：數值全部讀 game-tokens 的 economy ----
// 每輪 = Σ(成立的項目) × stageWeight[題型] × unitMultiplier[單元]，Math.round，保底 minPerRound（3）；
// 再乘上「連續挑戰」倍率（完成一個題型後 combo.windowMs 內開始另一個題型，完成時 × combo.multiplier）。
// 「再次複習」不再有每天次數上限（perDayPerStageLimit 沒設定＝不限）。
// 呼叫端必須在 recordStageCompletion() 寫入「之前」先取得先前的 timesCompleted／bestAccuracy。

export interface TokenEconomy {
  components: {
    firstClear: { amount: number };
    personalBest: { amount: number };
    perfectFirst: { amount: number };
    review: { amount: number; perDayPerStageLimit?: number };
  };
  stageWeight: Record<string, number>;
  unitMultiplier: { default?: number; byUnit?: Record<string, number> };
  /** 每輪保底（2026-10-21：3） */
  minPerRound?: number;
  /** 連續挑戰：完成一個題型後 windowMs 內開始同一單元的另一個題型，完成時代幣 × multiplier */
  combo?: { multiplier: number; windowMs: number };
  /** 今日第一輪加碼（寶箱）：amounts[等級-1]，等級 1～amounts.length */
  dailyFirst?: { amounts: number[] };
}

export interface TokenAwardLine {
  label: string;
  /** 加的代幣（項目）或倍率（加權） */
  value: string;
}

export interface TokenAward {
  total: number;
  breakdown: TokenAwardLine[];
  /** 再次複習但今天這個單元題型已經領滿 */
  reviewCapped: boolean;
}

export interface TokenRoundInput {
  profileId: string;
  unitKey: string; // l4u1
  stage: string; // matching …
  correctCount: number;
  wrongCount: number;
  /** recordStageCompletion() 之前的紀錄（沒有＝第一次） */
  prevTimesCompleted: number;
  prevBestAccuracy: number;
}

// 「再次複習」每天每個單元題型最多領幾次：記在同步的代幣前綴下（另一個 key，不改動餘額 key 的格式，
// 避免還沒更新的舊版頁面讀到 JSON 把餘額當 0）
const REVIEW_LOG_KEY_PREFIX = "englishForKids.gameTokens.reviewLog.v1";

function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readReviewLog(profileId: string): { date: string; counts: Record<string, number> } {
  const today = localDate();
  try {
    const raw = appStorage.getItem(`${REVIEW_LOG_KEY_PREFIX}.${profileId}`);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.date === today && parsed.counts && typeof parsed.counts === "object") return parsed;
  } catch {
    // 壞掉就當今天還沒領
  }
  return { date: today, counts: {} }; // 換天自動歸零（只保留當天）
}

export function getReviewCountToday(profileId: string, unitKey: string, stage: string): number {
  const n = readReviewLog(profileId).counts[`${unitKey}:${stage}`];
  return typeof n === "number" && n > 0 ? n : 0;
}

function bumpReviewCount(profileId: string, unitKey: string, stage: string): void {
  const log = readReviewLog(profileId);
  const k = `${unitKey}:${stage}`;
  log.counts[k] = (log.counts[k] ?? 0) + 1;
  try {
    appStorage.setItem(`${REVIEW_LOG_KEY_PREFIX}.${profileId}`, JSON.stringify(log));
  } catch {
    // 忽略
  }
}

const fmtMult = (m: number) => `×${Number.isInteger(m) ? m : m.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;

/** 只計算、不寫入（測試與預覽用）；reviewCountToday 由呼叫端提供 */
export function computeTokenAward(
  economy: TokenEconomy,
  input: Omit<TokenRoundInput, "profileId">,
  reviewCountToday: number,
  comboMult = 1
): TokenAward & { reviewUsed: boolean } {
  const c = economy.components;
  const total = input.correctCount + input.wrongCount;
  const accuracy = total > 0 ? Math.round((input.correctCount / total) * 100) : 0;
  const first = input.prevTimesCompleted <= 0;
  const breakdown: TokenAwardLine[] = [];
  let sum = 0;
  let reviewUsed = false;
  let reviewCapped = false;
  if (first) {
    sum += c.firstClear.amount;
    breakdown.push({ label: "第一次完成", value: `+${c.firstClear.amount}` });
  }
  const best = !first && accuracy > input.prevBestAccuracy;
  if (best) {
    sum += c.personalBest.amount;
    breakdown.push({ label: "刷新最高分", value: `+${c.personalBest.amount}` });
  }
  if (accuracy === 100 && (first || input.prevBestAccuracy < 100)) {
    sum += c.perfectFirst.amount;
    breakdown.push({ label: "拿到滿分", value: `+${c.perfectFirst.amount}` });
  }
  if (!first && !best) {
    const limit = c.review.perDayPerStageLimit ?? Infinity;
    if (reviewCountToday < limit) {
      sum += c.review.amount;
      reviewUsed = true;
      breakdown.push({ label: "再次複習", value: `+${c.review.amount}` });
    } else {
      reviewCapped = true;
    }
  }
  if (sum <= 0) return { total: 0, breakdown, reviewCapped, reviewUsed };
  const w = economy.stageWeight[input.stage] ?? 1;
  const m = economy.unitMultiplier.byUnit?.[input.unitKey] ?? economy.unitMultiplier.default ?? 1;
  if (w !== 1) breakdown.push({ label: "題型加權", value: fmtMult(w) });
  if (m !== 1) breakdown.push({ label: "單元加成", value: fmtMult(m) });
  const floor = economy.minPerRound ?? 1;
  const raw = Math.round(sum * w * m);
  let award = Math.max(floor, raw);
  if (award > raw) breakdown.push({ label: "保底", value: `${floor}` });
  if (comboMult > 1) {
    award = Math.round(award * comboMult);
    breakdown.push({ label: "連續挑戰", value: fmtMult(comboMult) });
  }
  return { total: award, breakdown, reviewCapped, reviewUsed };
}

// ---- 連續挑戰（2026-10-21）：鼓勵完成一個題型後馬上挑戰下一個 ----
// 完成一個題型 → 開出「機會」（同一單元、windowMs 內有效）；在時間內開始**另一個**題型 → 這一輪是連續挑戰，
// 完成時代幣 × multiplier，完成後再開出新的機會（可以一路接下去，倍率不疊加）。重玩同一個題型不算。
// 只存在記憶體（重新整理頁面就重來）。

export interface ComboOffer {
  unitKey: string;
  fromStage: string;
  until: number;
}
export interface ComboState {
  offer: ComboOffer | null;
  active: { unitKey: string; stage: string } | null;
}

export function comboRule(economy: TokenEconomy | undefined | null): { multiplier: number; windowMs: number } | null {
  const c = economy?.combo;
  return c && c.multiplier > 1 && c.windowMs > 0 ? c : null;
}

/** 開始一個題型：在機會時間內、而且是不同題型 → 這一輪算連續挑戰。開始任何題型都會用掉（或放棄）目前的機會 */
export function comboOnStart(state: ComboState, unitKey: string, stage: string, now: number): ComboState {
  const o = state.offer;
  const ok = !!o && o.unitKey === unitKey && o.fromStage !== stage && now <= o.until;
  return { offer: null, active: ok ? { unitKey, stage } : null };
}

/** 完成一個題型：回傳這一輪的倍率，並開出下一個機會 */
export function comboOnFinish(
  state: ComboState,
  unitKey: string,
  stage: string,
  now: number,
  rule: { multiplier: number; windowMs: number } | null
): { multiplier: number; state: ComboState } {
  const a = state.active;
  const multiplier = rule && a && a.unitKey === unitKey && a.stage === stage ? rule.multiplier : 1;
  return { multiplier, state: { offer: rule ? { unitKey, fromStage: stage, until: now + rule.windowMs } : null, active: null } };
}

/** 完成一輪：依規則計算、入帳、記錄今天的複習次數；economy 讀不到就退回舊規則 +5 */
export function awardRoundTokens(economy: TokenEconomy | undefined | null, input: TokenRoundInput, comboMult = 1): TokenAward {
  if (!economy?.components || !economy.stageWeight) {
    earnTokens(input.profileId, TOKENS_EARNED_PER_ROUND);
    return { total: TOKENS_EARNED_PER_ROUND, breakdown: [{ label: "完成一輪", value: `+${TOKENS_EARNED_PER_ROUND}` }], reviewCapped: false };
  }
  const r = computeTokenAward(economy, input, getReviewCountToday(input.profileId, input.unitKey, input.stage), comboMult);
  if (r.reviewUsed) bumpReviewCount(input.profileId, input.unitKey, input.stage);
  if (r.total > 0) earnTokens(input.profileId, r.total);
  return { total: r.total, breakdown: r.breakdown, reviewCapped: r.reviewCapped };
}

export function earnTokens(profileId: string, amount: number): number {
  const newBalance = getTokenBalance(profileId) + amount;
  writeBalance(profileId, newBalance);
  return newBalance;
}

/** 回傳 true 代表扣款成功（餘額足夠）；false 代表餘額不夠，呼叫端不能真的讓使用者
 * 進遊戲，畫面上要用鼓勵文案處理，不能出現「餘額不足」這種字眼。 */
export function spendTokens(profileId: string, amount: number): boolean {
  const balance = getTokenBalance(profileId);
  if (balance < amount) return false;
  writeBalance(profileId, balance - amount);
  return true;
}

// ---- 今日第一輪加碼（寶箱，2026-10-21）----
// 每位使用者每天第一次完成任何題型（不限單元、題型，不設正確率門檻）→ 額外送 dailyFirst.amounts[等級-1]，
// 不乘題型加權／單元加成／連續挑戰。等級＝寶箱等級：昨天也領過 → 升一級（最高 amounts.length）；
// 中斷 → 每少來一天退一級（最低 1），不歸零。記錄存在同步的代幣前綴下（換平板同一天不會領兩次）。
const DAILY_KEY_PREFIX = "englishForKids.gameTokens.daily.v1";

export interface DailyFirstRecord {
  /** 最後一次領寶箱的本機日期 YYYY-MM-DD */
  lastDate: string;
  /** 那一天的寶箱等級（1～amounts.length） */
  level: number;
}

export function dailyFirstRule(economy: TokenEconomy | undefined | null): { amounts: number[] } | null {
  const a = economy?.dailyFirst?.amounts;
  return Array.isArray(a) && a.length > 0 && a.every((n) => typeof n === "number" && n > 0) ? { amounts: a } : null;
}

/** 兩個 YYYY-MM-DD 相差幾天（b − a） */
export function dayDiff(a: string, b: string): number {
  const p = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(b) - p(a)) / 86400000);
}

/** 今天領的話是幾級（今天已經領過回 null） */
export function dailyFirstLevel(rec: DailyFirstRecord | null, today: string, maxLevel: number): number | null {
  if (!rec || !rec.lastDate) return 1;
  const gap = dayDiff(rec.lastDate, today);
  if (gap <= 0) return null; // 今天領過（或時鐘倒退）
  const prev = Math.max(1, Math.min(maxLevel, Math.floor(rec.level) || 1));
  if (gap === 1) return Math.min(maxLevel, prev + 1);
  return Math.max(1, prev - (gap - 1)); // 少來幾天退幾級
}

export function readDailyFirst(profileId: string): DailyFirstRecord | null {
  try {
    const raw = appStorage.getItem(`${DAILY_KEY_PREFIX}.${profileId}`);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.lastDate === "string" && typeof v.level === "number" ? v : null;
  } catch {
    return null;
  }
}

/** 畫面提示用：今天還能不能領、領的話幾級、幾個代幣 */
export function dailyFirstStatus(
  profileId: string,
  economy: TokenEconomy | undefined | null,
  today = localDate()
): { available: boolean; level: number; amount: number; maxLevel: number } | null {
  const rule = dailyFirstRule(economy);
  if (!rule) return null;
  const max = rule.amounts.length;
  const lv = dailyFirstLevel(readDailyFirst(profileId), today, max);
  if (lv === null) {
    const rec = readDailyFirst(profileId)!;
    const cur = Math.max(1, Math.min(max, rec.level));
    return { available: false, level: cur, amount: rule.amounts[cur - 1], maxLevel: max };
  }
  return { available: true, level: lv, amount: rule.amounts[lv - 1], maxLevel: max };
}

/** 完成一輪時呼叫：今天第一次 → 入帳並記錄，回傳 { amount, level }；今天領過回 null */
export function claimDailyFirst(
  profileId: string,
  economy: TokenEconomy | undefined | null,
  today = localDate()
): { amount: number; level: number; maxLevel: number } | null {
  const st = dailyFirstStatus(profileId, economy, today);
  if (!st || !st.available) return null;
  try {
    appStorage.setItem(`${DAILY_KEY_PREFIX}.${profileId}`, JSON.stringify({ lastDate: today, level: st.level }));
  } catch {
    // 存不進去：這次照樣給（下次可能再給一次，影響很小）
  }
  earnTokens(profileId, st.amount);
  return { amount: st.amount, level: st.level, maxLevel: st.maxLevel };
}
