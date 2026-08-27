// 成就徽章用的統計資料——獨立的新資料模組，跟 progress.ts／playLog.ts／playTime.ts 一樣
// 依使用者（profileId）分開存在 localStorage，不會去動既有 progress.ts 的資料結構
// （這是跟使用者確認過的做法：比照現有模式新增獨立模組）。
//
// 這裡只負責存 content/badges/badges.json 需要、但目前其他資料模型還沒有的統計數字：
// - 累計題數（不限題型／各題型分開）：給「完成題目數量」「遊戲題型精通」徽章用
// - 跨題型連續答對計數：給「連勝十題」用（答錯即歸零，滿門檻算達成一次並歸零重算）
// - 每一輪「全對且未使用提示」的累計次數：給「完美關卡」用
// - 早起／假日練習的累計次數：給「正向作息」用
// - 連續遊玩天數門檻（3/7/15/30 天）各自的達成次數：給「連續學習天數」用——這幾個門檻
//   彼此獨立各自計數＋各自在達成當下歸零重算，不是「一路累加到 30 天才給金牌」的單一進度條
//   （詳見 docs/achievement-badges.md 的徽章條件說明），所以用「checkpoint」記錄每個門檻
//   上一次是在連續天數多長的時候被觸發，之後只要「目前連續天數－checkpoint」又跨過門檻，
//   就再算一次達成、checkpoint 往前推進。

export type StageKeyForBadges =
  | "flashcards"
  | "matching"
  | "ordering"
  | "fillBlank"
  | "choice"
  | "capstone";

interface BadgeStatsData {
  totalQuestionsAnswered: number;
  /** 累計「答對」的題數（不分題型），跟 totalQuestionsAnswered（不管對錯都算）不一樣——
   * 給「個人檔案」頁的學習成就數據卡用，答對次數比純作答次數更有成就感，值得單獨存一份。 */
  totalCorrectAnswered: number;
  stageQuestionsAnswered: Record<StageKeyForBadges, number>;
  correctStreak: number;
  correctStreakAchievedCount: number;
  perfectLevelAchievedCount: number;
  earlyBirdAchievedCount: number;
  weekendAchievedCount: number;
  /** key 是徽章 id（例如 "badge.streak.3d"） */
  streakCheckpoint: Record<string, number>;
  streakAchievedCount: Record<string, number>;
  /** 上一次檢查時的「目前連續遊玩天數」，用來判斷連續天數是不是中途斷掉重新歸零過——
   * 斷掉的話所有 streakCheckpoint 都要跟著歸零，不然門檻會變成「扣分」而不是重新累計。 */
  lastKnownRawStreak: number;
}

function emptyStats(): BadgeStatsData {
  return {
    totalQuestionsAnswered: 0,
    totalCorrectAnswered: 0,
    stageQuestionsAnswered: {
      flashcards: 0,
      matching: 0,
      ordering: 0,
      fillBlank: 0,
      choice: 0,
      capstone: 0,
    },
    correctStreak: 0,
    correctStreakAchievedCount: 0,
    perfectLevelAchievedCount: 0,
    earlyBirdAchievedCount: 0,
    weekendAchievedCount: 0,
    streakCheckpoint: {},
    streakAchievedCount: {},
    lastKnownRawStreak: 0,
  };
}

const STORAGE_KEY_PREFIX = "englishForKids.badgeStats.v1";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function storageKeyForProfile(profileId: string): string {
  return `${STORAGE_KEY_PREFIX}.${profileId}`;
}

function readStats(profileId: string): BadgeStatsData {
  if (!hasLocalStorage()) return emptyStats();
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId));
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyStats();
    // 用預設值補齊缺的欄位，避免舊資料格式（或未來新增欄位）造成畫面壞掉。
    return {
      ...emptyStats(),
      ...parsed,
      stageQuestionsAnswered: {
        ...emptyStats().stageQuestionsAnswered,
        ...(parsed.stageQuestionsAnswered ?? {}),
      },
      streakCheckpoint: parsed.streakCheckpoint ?? {},
      streakAchievedCount: parsed.streakAchievedCount ?? {},
    };
  } catch {
    // localStorage 被擋掉或資料壞掉，當作沒有任何統計資料，不要讓 App 掛掉。
    return emptyStats();
  }
}

function writeStats(profileId: string, stats: BadgeStatsData): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId), JSON.stringify(stats));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略——不影響遊戲本身，只是這次的統計不會被記住。
  }
}

/** 給畫面渲染用：讀出這個使用者目前所有的徽章統計數字。 */
export function getBadgeStats(profileId: string): BadgeStatsData {
  return readStats(profileId);
}

/** 「連勝十題」（PF-02）的預設門檻；main.ts 之後會直接從 badges.json 的 threshold 欄位傳入，
 * 這裡的預設值只是保險，避免呼叫端忘記傳參數時整個邏輯失效。 */
const CORRECT_STREAK_DEFAULT_THRESHOLD = 10;

/**
 * 每答完一題（不管對錯）呼叫一次：累計題數＋1、這個題型的累計題數＋1；
 * 答對的話連續答對計數＋1，滿門檻就算達成一次「連勝」並歸零重算；答錯則把連續答對計數歸零。
 */
export function recordQuestionAnswered(
  profileId: string,
  stage: StageKeyForBadges,
  correct: boolean,
  correctStreakThreshold: number = CORRECT_STREAK_DEFAULT_THRESHOLD
): void {
  const stats = readStats(profileId);
  stats.totalQuestionsAnswered += 1;
  stats.stageQuestionsAnswered[stage] = (stats.stageQuestionsAnswered[stage] ?? 0) + 1;

  if (correct) {
    stats.totalCorrectAnswered += 1;
    stats.correctStreak += 1;
    if (correctStreakThreshold > 0 && stats.correctStreak >= correctStreakThreshold) {
      stats.correctStreakAchievedCount += 1;
      stats.correctStreak = 0;
    }
  } else {
    stats.correctStreak = 0;
  }

  writeStats(profileId, stats);
}

/**
 * 一輪題型全部答完時呼叫一次：wrongCount 是這一輪的答錯次數，hintUsed 是這一輪有沒有用過提示
 * （沒有提示機制的題型固定傳 false 即可）——兩者都符合才算一次「完美關卡」（PF-01）。
 * 同時依現在的本機時間判斷是不是「早上 6-9 點」（HH-01）或「週末」（HH-02），符合就各自累加一次。
 */
export function recordRoundCompletion(
  profileId: string,
  options: { wrongCount: number; hintUsed: boolean; now?: Date }
): void {
  const stats = readStats(profileId);
  const now = options.now ?? new Date();

  if (options.wrongCount === 0 && !options.hintUsed) {
    stats.perfectLevelAchievedCount += 1;
  }

  const hour = now.getHours();
  if (hour >= 6 && hour < 9) {
    stats.earlyBirdAchievedCount += 1;
  }

  const dayOfWeek = now.getDay(); // 0 = 週日, 6 = 週六
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    stats.weekendAchievedCount += 1;
  }

  writeStats(profileId, stats);
}

/**
 * 依「目前連續遊玩天數」（playLog.ts 的 getPlayStreak()）檢查連續天數徽章有沒有跨過門檻。
 * thresholdsByBadgeId 是 { 徽章 id: 天數門檻 }，由呼叫端從 badges.json 動態算出來傳入，
 * 這個函式本身不假設任何具體的徽章 id 或門檻數字，之後 badges.json 調整門檻不用改這裡。
 *
 * 每個門檻各自獨立計數：連續天數每跨過一次門檻就達成一次、該門檻的 checkpoint 往前推進；
 * 如果偵測到連續天數比上次檢查時還「變小」（代表中途斷過，playLog 的 streak 重新從 0/1 起算），
 * 所有門檻的 checkpoint 都要跟著歸零，不然會出現「新的一輪還沒開始就被算成已經達成」的錯誤。
 */
export function syncDailyStreakBadges(
  profileId: string,
  rawStreak: number,
  thresholdsByBadgeId: Record<string, number>
): void {
  const stats = readStats(profileId);

  if (rawStreak < stats.lastKnownRawStreak) {
    stats.streakCheckpoint = {};
  }
  stats.lastKnownRawStreak = rawStreak;

  for (const [badgeId, threshold] of Object.entries(thresholdsByBadgeId)) {
    if (threshold <= 0) continue;
    let checkpoint = stats.streakCheckpoint[badgeId] ?? 0;
    let achievedCount = stats.streakAchievedCount[badgeId] ?? 0;
    while (rawStreak - checkpoint >= threshold) {
      achievedCount += 1;
      checkpoint += threshold;
    }
    stats.streakCheckpoint[badgeId] = checkpoint;
    stats.streakAchievedCount[badgeId] = achievedCount;
  }

  writeStats(profileId, stats);
}

export function getStreakBadgeAchievedCount(profileId: string, badgeId: string): number {
  return readStats(profileId).streakAchievedCount[badgeId] ?? 0;
}

export function clearBadgeStats(profileId: string): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(storageKeyForProfile(profileId));
  } catch {
    // 忽略
  }
}
