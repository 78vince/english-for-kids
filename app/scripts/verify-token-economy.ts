// 驗證遊戲代幣獲得規則（2026-10-25 同步自 LetsGo 的 verify-token-economy.ts，公開版改用主題代號、多一個 choice 題型）：
//  1. token：economy 有保底 3、連續挑戰 ×2／2 分鐘、複習沒有每天次數上限
//  2. computeTokenAward：第一次完成、滿分、刷新最高分、複習；保底 3；連續挑戰在保底之後 ×2
//  3. 複習不限次數（今天已複習很多次仍然有代幣）
//  4. 連續挑戰狀態機：完成 → 時間內開始「另一個」題型才算；重玩同一題型、超過時間、換單元都不算；可以一路接下去
//  5. 完成畫面接上代幣雨與連續挑戰（main.ts 原始碼檢查）
// 用法：npx tsx scripts/verify-token-economy.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  },
};
function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const tokens = await import("../src/gameTokens");
const T = JSON.parse(fs.readFileSync(path.join(__dirname, "../../assets/game-tokens/game-tokens.json"), "utf-8"));
const E = T.economy;

// ---- 1 ----
assert(E.minPerRound === 3, "每輪保底 3");
assert(E.components.firstClear.amount === 12 && E.components.perfectFirst.amount === 6 && E.components.personalBest.amount === 4 && E.components.review.amount === 3, "各項：第一次 12、滿分 6、刷新最高分 4、複習 3");
assert(E.combo && E.combo.multiplier === 2 && E.combo.windowMs === 120000, "連續挑戰 ×2、2 分鐘");
assert(E.components.review.perDayPerStageLimit === undefined, "複習沒有每天次數上限");
console.log("✅ 1. token：第一次 12／滿分 6／刷新 4／複習 3、保底 3、連續挑戰 ×2／2 分鐘、複習不限次數");

// ---- 2 ----
const base = { unitKey: "l4u1", stage: "matching", correctCount: 10, wrongCount: 0, prevTimesCompleted: 0, prevBestAccuracy: 0 };
let r = tokens.computeTokenAward(E, base, 0);
assert(r.total === 18, `U1 配對第一次滿分 (12+6)×1×1＝18，實際 ${r.total}`);
r = tokens.computeTokenAward(E, { ...base, correctCount: 8, wrongCount: 2 }, 0);
assert(r.total === 12, `第一次完成（沒滿分）＝12，實際 ${r.total}`);
r = tokens.computeTokenAward(E, { ...base, prevTimesCompleted: 3, prevBestAccuracy: 100 }, 0);
assert(r.total === 3 && !r.breakdown.some((l) => l.label === "保底"), `複習 3×1×1＝3，實際 ${r.total}`);
r = tokens.computeTokenAward(E, { ...base, stage: "flashcards", prevTimesCompleted: 3, prevBestAccuracy: 100 }, 0);
assert(r.total === 3 && r.breakdown.some((l) => l.label === "保底"), "字卡複習 3×0.6＝1.8 → 保底 3");
// 公開版：主題沒有單元加成（×1）；短文理解 choice 在 main.ts 給 1.5
const EP = { ...E, stageWeight: { choice: 1.5, ...E.stageWeight } };
r = tokens.computeTokenAward(EP, { ...base, unitKey: "family", stage: "choice", prevTimesCompleted: 2, prevBestAccuracy: 100 }, 0);
assert(r.total === 5, `主題短文理解複習 3×1.5×1＝4.5 → 5，實際 ${r.total}`);
r = tokens.computeTokenAward(EP, { ...base, unitKey: "family", stage: "capstone" }, 0);
assert(r.total === 36, `主題綜合關卡第一次滿分 18×2×1＝36，實際 ${r.total}`);
r = tokens.computeTokenAward(EP, { ...base, unitKey: "family", stage: "capstone" }, 0, 2);
assert(r.total === 72 && r.breakdown.some((l) => l.label === "連續挑戰" && l.value === "×2"), `連續挑戰 36×2＝72，實際 ${r.total}`);
r = tokens.computeTokenAward(E, { ...base, prevTimesCompleted: 3, prevBestAccuracy: 100 }, 0, 2);
assert(r.total === 6, `複習 3 再連續挑戰 ×2＝6，實際 ${r.total}`);
r = tokens.computeTokenAward(E, { ...base, correctCount: 9, wrongCount: 1, prevTimesCompleted: 2, prevBestAccuracy: 80 }, 0);
assert(r.total === 4, `刷新最高分 4×1×1＝4，實際 ${r.total}`);
console.log("✅ 2. 各項代幣、保底 3、連續挑戰在保底之後 ×2");

// ---- 3 ----
r = tokens.computeTokenAward(E, { ...base, prevTimesCompleted: 9, prevBestAccuracy: 100 }, 50);
assert(r.total === 3 && !r.reviewCapped, "今天已複習 50 次仍然有代幣");
for (let i = 0; i < 6; i++) {
  const a = tokens.awardRoundTokens(E, { ...base, profileId: "p1", prevTimesCompleted: 5, prevBestAccuracy: 100 });
  assert(a.total === 3, `第 ${i + 1} 次複習都有 3 個代幣`);
}
assert(tokens.getTokenBalance("p1") === 18, "6 次複習共 18 個代幣入帳");
console.log("✅ 3. 複習不限次數");

// ---- 4 ----
const rule = tokens.comboRule(E)!;
let st: any = { offer: null, active: null };
const t0 = 1_000_000;
// 第一個題型：沒有機會，不翻倍
st = tokens.comboOnStart(st, "l4u1", "matching", t0);
let f = tokens.comboOnFinish(st, "l4u1", "matching", t0 + 60_000, rule);
assert(f.multiplier === 1 && f.state.offer?.until === t0 + 60_000 + 120_000, "第一個題型 ×1，完成後開出 2 分鐘的機會");
st = f.state;
// 1 分鐘後開始另一個題型 → 翻倍
st = tokens.comboOnStart(st, "l4u1", "fillBlank", t0 + 120_000);
assert(st.active?.stage === "fillBlank" && st.offer === null, "時間內開始另一個題型＝連續挑戰");
f = tokens.comboOnFinish(st, "l4u1", "fillBlank", t0 + 300_000, rule);
assert(f.multiplier === 2, "完成連續挑戰 ×2");
st = f.state;
// 可以一路接下去
st = tokens.comboOnStart(st, "l4u1", "ordering", t0 + 330_000);
f = tokens.comboOnFinish(st, "l4u1", "ordering", t0 + 500_000, rule);
assert(f.multiplier === 2, "接著下一個題型也 ×2（倍率不疊加）");
st = f.state;
// 重玩同一個題型不算
let s2 = tokens.comboOnStart(st, "l4u1", "ordering", t0 + 510_000);
assert(s2.active === null, "重玩同一個題型不算連續挑戰");
// 超過 2 分鐘不算
s2 = tokens.comboOnStart(st, "l4u1", "pattern", t0 + 500_000 + 120_001);
assert(s2.active === null, "超過 2 分鐘才開始不算");
// 換單元不算
s2 = tokens.comboOnStart(st, "l4u2", "pattern", t0 + 520_000);
assert(s2.active === null, "換到別的單元不算");
// 開始了別的題型但中途離開、改玩第三個：只有真正完成的那個題型算
s2 = tokens.comboOnStart(st, "l4u1", "pattern", t0 + 520_000);
f = tokens.comboOnFinish(s2, "l4u1", "capstone", t0 + 600_000, rule);
assert(f.multiplier === 1, "完成的不是開始時那個題型就不算");
assert(tokens.comboRule({ ...E, combo: undefined }) === null, "沒有 combo 設定就沒有連續挑戰");
console.log("✅ 4. 連續挑戰：時間內、不同題型、同一單元才算；可以一路接下去");

// ---- 4b. 今日第一輪寶箱 ----
assert(JSON.stringify(E.dailyFirst?.amounts) === JSON.stringify([20, 22, 24, 27, 30]), "寶箱 Lv.1～5：20／22／24／27／30");
const L = (rec: any, today: string) => tokens.dailyFirstLevel(rec, today, 5);
assert(L(null, "2026-10-21") === 1, "第一次領：Lv.1");
assert(L({ lastDate: "2026-10-21", level: 1 }, "2026-10-21") === null, "同一天不能再領");
assert(L({ lastDate: "2026-10-20", level: 1 }, "2026-10-21") === 2, "連續第 2 天：Lv.2");
assert(L({ lastDate: "2026-10-20", level: 5 }, "2026-10-21") === 5, "最高 Lv.5");
assert(L({ lastDate: "2026-10-19", level: 5 }, "2026-10-21") === 4, "中斷一天：退一級（Lv.5 → Lv.4）");
assert(L({ lastDate: "2026-10-18", level: 3 }, "2026-10-21") === 1, "中斷兩天：Lv.3 → Lv.1");
assert(L({ lastDate: "2026-10-01", level: 5 }, "2026-10-21") === 1, "很久沒來：最低 Lv.1");
assert(L({ lastDate: "2026-10-31", level: 2 }, "2026-11-01") === 3 && L({ lastDate: "2026-12-31", level: 2 }, "2027-01-01") === 3, "跨月、跨年也算連續");
const before = tokens.getTokenBalance("pd");
let c1 = tokens.claimDailyFirst("pd", E, "2026-10-20");
assert(c1?.amount === 20 && c1.level === 1 && tokens.getTokenBalance("pd") === before + 20, "第一天領 +20 入帳");
assert(tokens.claimDailyFirst("pd", E, "2026-10-20") === null, "同一天第二輪沒有寶箱");
c1 = tokens.claimDailyFirst("pd", E, "2026-10-21");
assert(c1?.amount === 22 && c1.level === 2, "隔天 Lv.2 +22");
let st6 = tokens.dailyFirstStatus("pd", E, "2026-10-21");
assert(st6 && !st6.available && st6.level === 2, "今天領過：狀態顯示已打開");
st6 = tokens.dailyFirstStatus("pd", E, "2026-10-23");
assert(st6?.available && st6.level === 1 && st6.amount === 20, "中斷一天：Lv.2 → Lv.1");
assert(tokens.dailyFirstStatus("pd", { ...E, dailyFirst: undefined }, "2026-10-23") === null, "沒有設定就沒有寶箱");
console.log("✅ 4b. 今日第一輪寶箱：+20 起、每天升一級到 Lv.5、中斷退一級、同一天只領一次");

// ---- 5 ----
const main = fs.readFileSync(path.join(__dirname, "../src/main.ts"), "utf-8");
for (const st5 of ["flashcards", "matching", "ordering", "fillBlank", "choice", "capstone", "conversation"]) {
  assert(main.includes(`screen = "${st5}";\n  startCombo("${st5}");`), `開始 ${st5} 時檢查連續挑戰`);
}
assert(main.includes("claimDailyFirst(") && main.includes("appendDailyChestBanner()"), "完成一輪領寶箱、首頁／選單提示");
assert(main.includes("playCoinRain(") && main.includes("comboOnFinish(") && main.includes("appendComboBanner()") && main.includes("appendComboChip()"), "完成畫面有代幣雨、連續挑戰");
const css = fs.readFileSync(path.join(__dirname, "../src/style.css"), "utf-8");
assert(css.includes("@keyframes coin-rain-fall") && css.includes(".coin-rain--reduced"), "代幣雨動畫與 reduced-motion 版本");
assert(main.includes("choice: 1.5") && main.includes('from "../../assets/game-tokens/game-tokens.json"'), "公開版 economy 讀 game-tokens.json，並補上 choice 的題型加權");
assert(!main.includes("TOKENS_EARNED_PER_ROUND"), "不再用舊的每輪固定 +5");
console.log("✅ 5. 完成畫面接上代幣雨與連續挑戰");

console.log("\n✅ 遊戲代幣獲得規則驗證全部通過。");
