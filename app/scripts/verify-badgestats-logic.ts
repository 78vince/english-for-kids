// 驗證 badgeStats.ts 的成就徽章統計邏輯：累計題數、跨題型連續答對（連勝十題）、
// 完美關卡（全對且未用提示）、早起/假日次數、連續天數門檻（各自獨立計數＋達成後歸零重算）、
// 不同使用者的紀錄互相獨立、清除功能。
// 用法：npx tsx scripts/verify-badgestats-logic.ts

function makeFakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

(globalThis as any).window = {
  localStorage: makeFakeLocalStorage(),
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const {
  recordQuestionAnswered,
  recordRoundCompletion,
  syncDailyStreakBadges,
  getBadgeStats,
  getStreakBadgeAchievedCount,
  clearBadgeStats,
} = await import("../src/badgeStats");

const ALICE = "profile-alice";
const BOB = "profile-bob";

// ---- 測試 1：累計題數（不限題型／各題型分開）正確累加 ----
{
  recordQuestionAnswered(ALICE, "matching", true);
  recordQuestionAnswered(ALICE, "matching", false);
  recordQuestionAnswered(ALICE, "ordering", true);
  const stats = getBadgeStats(ALICE);
  assert(stats.totalQuestionsAnswered === 3, `累計題數應該是 3，實際 ${stats.totalQuestionsAnswered}`);
  assert(stats.stageQuestionsAnswered.matching === 2, `matching 累計題數應該是 2，實際 ${stats.stageQuestionsAnswered.matching}`);
  assert(stats.stageQuestionsAnswered.ordering === 1, `ordering 累計題數應該是 1，實際 ${stats.stageQuestionsAnswered.ordering}`);
  assert(stats.stageQuestionsAnswered.fillBlank === 0, `fillBlank 累計題數應該是 0，實際 ${stats.stageQuestionsAnswered.fillBlank}`);
  assert(stats.totalCorrectAnswered === 2, `累計答對題數應該是 2（matching 答對 1 題＋ordering 答對 1 題），實際 ${stats.totalCorrectAnswered}`);
  console.log("✅ 測試 1 通過：累計題數（不限題型／各題型分開）正確累加。");
}

// ---- 測試 2：跨題型連續答對（連勝十題，門檻用 5 方便測試），答錯會歸零 ----
{
  clearBadgeStats(ALICE);
  for (let i = 0; i < 4; i++) recordQuestionAnswered(ALICE, "matching", true, 5);
  let stats = getBadgeStats(ALICE);
  assert(stats.correctStreak === 4, `連續答對 4 題，correctStreak 應該是 4，實際 ${stats.correctStreak}`);
  assert(stats.correctStreakAchievedCount === 0, "還沒到門檻，不應該算達成");

  recordQuestionAnswered(ALICE, "ordering", true, 5); // 跨題型累計，第 5 題，滿門檻
  stats = getBadgeStats(ALICE);
  assert(stats.correctStreak === 0, `滿門檻後應該歸零重算，實際 ${stats.correctStreak}`);
  assert(stats.correctStreakAchievedCount === 1, `應該達成一次連勝，實際 ${stats.correctStreakAchievedCount}`);

  recordQuestionAnswered(ALICE, "choice", false, 5); // 答錯，歸零
  stats = getBadgeStats(ALICE);
  assert(stats.correctStreak === 0, "答錯應該讓連續答對計數歸零");
  assert(stats.correctStreakAchievedCount === 1, "答錯不應該影響已達成次數");
  console.log("✅ 測試 2 通過：跨題型連續答對計數正確，答錯歸零，滿門檻達成並重算。");
}

// ---- 測試 3：完美關卡（全對且未用提示）才算達成；答錯或用過提示都不算 ----
{
  clearBadgeStats(ALICE);
  recordRoundCompletion(ALICE, { wrongCount: 0, hintUsed: false, now: new Date(2026, 0, 10, 12, 0) }); // 平日中午
  recordRoundCompletion(ALICE, { wrongCount: 1, hintUsed: false, now: new Date(2026, 0, 10, 12, 0) }); // 有答錯
  recordRoundCompletion(ALICE, { wrongCount: 0, hintUsed: true, now: new Date(2026, 0, 10, 12, 0) }); // 用過提示
  const stats = getBadgeStats(ALICE);
  assert(stats.perfectLevelAchievedCount === 1, `應該只有第一次算完美關卡，實際 ${stats.perfectLevelAchievedCount}`);
  console.log("✅ 測試 3 通過：只有全對且未用提示才算完美關卡。");
}

// ---- 測試 4：早起（06:00-09:00）與假日（週六日）次數各自累加，範圍外不累加 ----
{
  clearBadgeStats(ALICE);
  recordRoundCompletion(ALICE, { wrongCount: 0, hintUsed: false, now: new Date(2026, 0, 12, 7, 30) }); // 週一早上 7:30，早起
  recordRoundCompletion(ALICE, { wrongCount: 0, hintUsed: false, now: new Date(2026, 0, 12, 14, 0) }); // 週一下午，都不算
  recordRoundCompletion(ALICE, { wrongCount: 0, hintUsed: false, now: new Date(2026, 0, 10, 10, 0) }); // 週六上午，假日
  recordRoundCompletion(ALICE, { wrongCount: 0, hintUsed: false, now: new Date(2026, 0, 11, 8, 0) }); // 週日早上 8 點，兩個都算
  const stats = getBadgeStats(ALICE);
  assert(stats.earlyBirdAchievedCount === 2, `早起次數應該是 2，實際 ${stats.earlyBirdAchievedCount}`);
  assert(stats.weekendAchievedCount === 2, `假日次數應該是 2，實際 ${stats.weekendAchievedCount}`);
  console.log("✅ 測試 4 通過：早起／假日次數只在符合條件的時段才累加。");
}

// ---- 測試 5：連續天數門檻各自獨立計數，逐日累加、達成後各自歸零重算 ----
{
  clearBadgeStats(ALICE);
  const thresholds = { "badge.streak.3d": 3, "badge.streak.7d": 7 };

  // 模擬連續天數從 1 天逐日累加到 8 天，每天都檢查一次。
  for (let day = 1; day <= 8; day++) {
    syncDailyStreakBadges(ALICE, day, thresholds);
  }
  // 3 天門檻：第 3 天達成一次（checkpoint=3），第 6 天再達成一次（checkpoint=6），第 8 天還沒到 9。
  assert(
    getStreakBadgeAchievedCount(ALICE, "badge.streak.3d") === 2,
    `3 天門檻到第 8 天應該已經達成 2 次，實際 ${getStreakBadgeAchievedCount(ALICE, "badge.streak.3d")}`
  );
  // 7 天門檻：第 7 天達成一次。
  assert(
    getStreakBadgeAchievedCount(ALICE, "badge.streak.7d") === 1,
    `7 天門檻到第 8 天應該已經達成 1 次，實際 ${getStreakBadgeAchievedCount(ALICE, "badge.streak.7d")}`
  );
  console.log("✅ 測試 5 通過：連續天數門檻各自獨立計數，逐日累加時各自在跨過門檻時達成並歸零重算。");
}

// ---- 測試 6：連續天數中途斷掉（rawStreak 變小）時，checkpoint 要歸零，不能讓已達成次數被扣掉 ----
{
  const thresholds = { "badge.streak.3d": 3 };
  const beforeBreakCount = getStreakBadgeAchievedCount(ALICE, "badge.streak.3d");

  syncDailyStreakBadges(ALICE, 1, thresholds); // 斷掉重新開始，從第 1 天算
  assert(
    getStreakBadgeAchievedCount(ALICE, "badge.streak.3d") === beforeBreakCount,
    "斷掉重新開始的當下，已達成次數不應該被扣掉"
  );

  syncDailyStreakBadges(ALICE, 2, thresholds);
  syncDailyStreakBadges(ALICE, 3, thresholds); // 新的一輪重新累積到第 3 天，應該再達成一次
  assert(
    getStreakBadgeAchievedCount(ALICE, "badge.streak.3d") === beforeBreakCount + 1,
    `重新累積滿 3 天後應該再達成一次，實際 ${getStreakBadgeAchievedCount(ALICE, "badge.streak.3d")}`
  );
  console.log("✅ 測試 6 通過：連續天數斷掉後 checkpoint 正確歸零重算，不影響先前已達成的次數。");
}

// ---- 測試 7：不同使用者的統計資料互相獨立 ----
{
  clearBadgeStats(ALICE);
  clearBadgeStats(BOB);
  recordQuestionAnswered(ALICE, "matching", true);
  recordQuestionAnswered(ALICE, "matching", true);
  recordQuestionAnswered(BOB, "matching", true);

  const aliceStats = getBadgeStats(ALICE);
  const bobStats = getBadgeStats(BOB);
  assert(aliceStats.totalQuestionsAnswered === 2, `Alice 的累計題數應該是 2，實際 ${aliceStats.totalQuestionsAnswered}`);
  assert(bobStats.totalQuestionsAnswered === 1, `Bob 的累計題數應該是 1，實際 ${bobStats.totalQuestionsAnswered}`);
  console.log("✅ 測試 7 通過：不同使用者的成就徽章統計資料互相獨立。");
}

// ---- 測試 8：clearBadgeStats 清除後恢復成全新狀態 ----
{
  clearBadgeStats(ALICE);
  const stats = getBadgeStats(ALICE);
  assert(stats.totalQuestionsAnswered === 0, "清除後累計題數應該歸零");
  assert(stats.correctStreakAchievedCount === 0, "清除後連勝次數應該歸零");
  assert(stats.perfectLevelAchievedCount === 0, "清除後完美關卡次數應該歸零");
  assert(getStreakBadgeAchievedCount(ALICE, "badge.streak.3d") === 0, "清除後連續天數徽章次數應該歸零");
  console.log("✅ 測試 8 通過：clearBadgeStats 可以把統計資料清成全新狀態。");
}

// ---- 測試 9：累計答對題數（totalCorrectAnswered）只在答對時累加，跟「不管對錯都算」的
// totalQuestionsAnswered 是兩個獨立欄位；給「個人檔案」頁學習成就數據卡用。 ----
{
  clearBadgeStats(ALICE);
  recordQuestionAnswered(ALICE, "matching", true);
  recordQuestionAnswered(ALICE, "matching", false);
  recordQuestionAnswered(ALICE, "flashcards", true);
  recordQuestionAnswered(ALICE, "flashcards", false);
  recordQuestionAnswered(ALICE, "flashcards", false);
  const stats = getBadgeStats(ALICE);
  assert(stats.totalQuestionsAnswered === 5, `作答總數應該是 5，實際 ${stats.totalQuestionsAnswered}`);
  assert(stats.totalCorrectAnswered === 2, `答對題數應該是 2（不含答錯的 3 題），實際 ${stats.totalCorrectAnswered}`);
  console.log("✅ 測試 9 通過：累計答對題數只在答對時累加，跟累計作答總數是兩個獨立欄位。");
}

console.log("\n✅ 全部 badgeStats.ts 邏輯驗證通過。");
