// 驗證「答完一輪，跳出獲得新徽章 pop」背後的核心邏輯：diffNewlyAchievedBadges()。
// main.ts 沒辦法直接 import 進來跑（同一個檔案間接用到 content.ts 的 import.meta.glob，
// tsx 執行環境不支援這個語法——其他 verify-*.ts 都是同樣的處理方式），這裡把
// main.ts 的 snapshotBadgeAchievements()／diffNewlyAchievedBadges() 邏輯原封不動複製一份
// 過來測，只是拿掉「怎麼算出快照」的部分，直接手動建構兩份快照（Map）餵給 diff 函式，
// 專注測「比對規則」本身對不對：
//   - 一次性徽章：未達成 → 達成 才算「新達成」。
//   - 可累計次數的徽章：已達成，但 achievedCount 變多了，也要算「又達成一次」。
//   - 一次性／可累計都是「沒變化」的，不能被誤判成新達成。
//   - 同一輪多個徽章同時新達成時，要能一次全部抓出來。
// 用法：npx tsx scripts/verify-badge-unlock-diff.ts

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

type BadgeStub = { id: string };

type BadgeAchievementSnapshot = Map<string, { achieved: boolean; achievedCount: number }>;

// 跟 main.ts 的 diffNewlyAchievedBadges() 邏輯一致：
function diffNewlyAchievedBadges(
  allBadges: BadgeStub[],
  before: BadgeAchievementSnapshot,
  after: BadgeAchievementSnapshot
): BadgeStub[] {
  const newly: BadgeStub[] = [];
  for (const badge of allBadges) {
    const b = before.get(badge.id);
    const a = after.get(badge.id);
    if (!a) continue;
    const justUnlocked = !b?.achieved && a.achieved;
    const achievedAgain = (b?.achieved ?? false) && a.achieved && a.achievedCount > (b?.achievedCount ?? 0);
    if (justUnlocked || achievedAgain) {
      newly.push(badge);
    }
  }
  return newly;
}

const ALL_BADGES: BadgeStub[] = [
  { id: "badge.vocab_milestone.50" }, // 一次性
  { id: "badge.performance.streak10" }, // 可累計次數
  { id: "badge.total_days.7" }, // 一次性，這次沒變化
  { id: "badge.healthy_habit.early_bird" }, // 可累計次數，這次沒變化
];

function snap(entries: Record<string, { achieved: boolean; achievedCount?: number }>): BadgeAchievementSnapshot {
  const map: BadgeAchievementSnapshot = new Map();
  for (const [id, v] of Object.entries(entries)) {
    map.set(id, { achieved: v.achieved, achievedCount: v.achievedCount ?? 0 });
  }
  return map;
}

// ---- 測試 1：一次性徽章「未達成→達成」，要被抓成新達成 ----
{
  const before = snap({
    "badge.vocab_milestone.50": { achieved: false, achievedCount: 0 },
    "badge.performance.streak10": { achieved: false, achievedCount: 0 },
    "badge.total_days.7": { achieved: false, achievedCount: 0 },
    "badge.healthy_habit.early_bird": { achieved: false, achievedCount: 0 },
  });
  const after = snap({
    "badge.vocab_milestone.50": { achieved: true, achievedCount: 0 },
    "badge.performance.streak10": { achieved: false, achievedCount: 0 },
    "badge.total_days.7": { achieved: false, achievedCount: 0 },
    "badge.healthy_habit.early_bird": { achieved: false, achievedCount: 0 },
  });
  const newly = diffNewlyAchievedBadges(ALL_BADGES, before, after);
  assert(newly.length === 1, `測試 1 失敗：應該只抓到 1 個新達成的徽章，實際抓到 ${newly.length} 個`);
  assert(newly[0].id === "badge.vocab_milestone.50", "測試 1 失敗：抓到的徽章 id 不對");
  console.log("✅ 測試 1 通過：一次性徽章「未達成→達成」正確被抓成新達成。");
}

// ---- 測試 2：一次性徽章「達成→達成」（沒變化），不能被誤判成新達成 ----
{
  const before = snap({ "badge.total_days.7": { achieved: true, achievedCount: 0 } });
  const after = snap({ "badge.total_days.7": { achieved: true, achievedCount: 0 } });
  const newly = diffNewlyAchievedBadges([{ id: "badge.total_days.7" }], before, after);
  assert(newly.length === 0, "測試 2 失敗：已經達成、這次沒變化的一次性徽章不該被抓出來");
  console.log("✅ 測試 2 通過：一次性徽章沒有變化時，不會被誤判成新達成。");
}

// ---- 測試 3：可累計次數的徽章，achievedCount 變多了，要算「又達成一次」----
{
  const before = snap({ "badge.performance.streak10": { achieved: true, achievedCount: 1 } });
  const after = snap({ "badge.performance.streak10": { achieved: true, achievedCount: 2 } });
  const newly = diffNewlyAchievedBadges([{ id: "badge.performance.streak10" }], before, after);
  assert(newly.length === 1, "測試 3 失敗：可累計次數的徽章又跨過一次門檻，應該要被抓出來");
  console.log("✅ 測試 3 通過：可累計次數的徽章 achievedCount 變多時，正確被抓成又達成一次。");
}

// ---- 測試 4：可累計次數的徽章，achievedCount 沒變化，不能被誤判 ----
{
  const before = snap({ "badge.healthy_habit.early_bird": { achieved: true, achievedCount: 3 } });
  const after = snap({ "badge.healthy_habit.early_bird": { achieved: true, achievedCount: 3 } });
  const newly = diffNewlyAchievedBadges([{ id: "badge.healthy_habit.early_bird" }], before, after);
  assert(newly.length === 0, "測試 4 失敗：achievedCount 沒有變化，不該被抓出來");
  console.log("✅ 測試 4 通過：可累計次數的徽章沒有變化時，不會被誤判成又達成一次。");
}

// ---- 測試 5：完全沒達成、這次也還沒達成，不能被抓出來 ----
{
  const before = snap({ "badge.vocab_milestone.50": { achieved: false, achievedCount: 0 } });
  const after = snap({ "badge.vocab_milestone.50": { achieved: false, achievedCount: 0 } });
  const newly = diffNewlyAchievedBadges([{ id: "badge.vocab_milestone.50" }], before, after);
  assert(newly.length === 0, "測試 5 失敗：一直都沒達成的徽章不該被抓出來");
  console.log("✅ 測試 5 通過：一直都沒達成的徽章正確不會被抓出來。");
}

// ---- 測試 6：同一輪一次跨過好幾個門檻，要能一次全部抓出來（同一個 pop 要列出全部）----
{
  const before = snap({
    "badge.vocab_milestone.50": { achieved: false, achievedCount: 0 },
    "badge.performance.streak10": { achieved: true, achievedCount: 1 },
    "badge.total_days.7": { achieved: false, achievedCount: 0 },
    "badge.healthy_habit.early_bird": { achieved: true, achievedCount: 3 },
  });
  const after = snap({
    "badge.vocab_milestone.50": { achieved: true, achievedCount: 0 }, // 新達成
    "badge.performance.streak10": { achieved: true, achievedCount: 2 }, // 又達成一次
    "badge.total_days.7": { achieved: true, achievedCount: 0 }, // 新達成
    "badge.healthy_habit.early_bird": { achieved: true, achievedCount: 3 }, // 沒變化
  });
  const newly = diffNewlyAchievedBadges(ALL_BADGES, before, after);
  const ids = newly.map((b) => b.id).sort();
  assert(
    ids.length === 3 &&
      ids.includes("badge.vocab_milestone.50") &&
      ids.includes("badge.performance.streak10") &&
      ids.includes("badge.total_days.7"),
    `測試 6 失敗：應該同時抓到 3 個徽章（2 個新達成＋1 個又達成一次），實際抓到：${ids.join(", ")}`
  );
  console.log("✅ 測試 6 通過：同一輪一次跨過好幾個門檻時，全部一次抓出來（可以同時列在同一個 pop 裡）。");
}

// ---- 測試 7：「之前」快照裡完全沒有這個徽章的紀錄（例如剛好是這個使用者第一次
//      算快照），也要能正確判斷成新達成，不會因為 before.get() 回傳 undefined 而出錯 ----
{
  const before: BadgeAchievementSnapshot = new Map();
  const after = snap({ "badge.vocab_milestone.50": { achieved: true, achievedCount: 0 } });
  const newly = diffNewlyAchievedBadges([{ id: "badge.vocab_milestone.50" }], before, after);
  assert(newly.length === 1, "測試 7 失敗：before 快照完全沒有這個徽章時，也要能正確判斷成新達成");
  console.log("✅ 測試 7 通過：before 快照缺這個徽章的紀錄時，不會出錯，也能正確判斷成新達成。");
}

console.log("\n✅ 全部徽章解鎖偵測（diffNewlyAchievedBadges）邏輯驗證通過。");
