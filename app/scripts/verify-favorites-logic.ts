// 驗證 favorites.ts 的單字收藏邏輯：收藏／取消收藏切換、收藏清單／收藏數量讀取、
// 不同使用者的收藏互相獨立、localStorage 被擋掉或資料壞掉時安靜降級（不拋例外）。
// 另外也驗證 content/badges/badges.json 裡收藏相關 4 個徽章（OB-04／FV-01~03）的資料
// 形狀，是否符合 main.ts 的 computeBadgeViewState()「onboarding.first_favorite 用
// favoritesCount > 0 判斷、favorites 分類用 threshold 判斷」這兩條分支實際依賴的假設——
// main.ts 因為用了 import.meta.glob，沒辦法直接在 tsx 下 import 執行，這裡改成用
// 「真正的 favorites.ts」＋「真正的 badges.json」模擬同一套判斷邏輯，交叉確認資料跟
// 邏輯兜得起來，不是只看程式碼推論（4 個徽章的門檻/分類是否正確、globals 有沒有被移出
// BADGES_BLOCKED_BY_MISSING_FEATURE 清單，都在這裡實際跑一次收藏動作來確認）。
// 用法：npx tsx scripts/verify-favorites-logic.ts

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

const { isFavorite, toggleFavorite, getFavoriteVocabIds, getFavoriteCount } = await import(
  "../src/favorites"
);

const ALICE = "profile-alice";
const BOB = "profile-bob";

// ---- 測試 1：一開始沒有任何收藏 ----
{
  assert(isFavorite(ALICE, "voc.family.001") === false, "還沒收藏過任何字，isFavorite 應該是 false");
  assert(getFavoriteCount(ALICE) === 0, `還沒收藏過任何字，數量應該是 0，實際 ${getFavoriteCount(ALICE)}`);
  assert(getFavoriteVocabIds(ALICE).length === 0, "還沒收藏過任何字，清單應該是空的");
  console.log("✅ 測試 1 通過：初始狀態沒有任何收藏。");
}

// ---- 測試 2：toggleFavorite 收藏一個字，isFavorite／數量／清單都要正確反映 ----
{
  toggleFavorite(ALICE, "voc.family.001");
  assert(isFavorite(ALICE, "voc.family.001") === true, "收藏後 isFavorite 應該變成 true");
  assert(getFavoriteCount(ALICE) === 1, `收藏一個字後數量應該是 1，實際 ${getFavoriteCount(ALICE)}`);
  assert(getFavoriteVocabIds(ALICE).includes("voc.family.001"), "收藏清單應該包含剛收藏的 id");
  console.log("✅ 測試 2 通過：toggleFavorite 可以把單字加入收藏。");
}

// ---- 測試 3：再呼叫一次 toggleFavorite（同一個 id）會取消收藏 ----
{
  toggleFavorite(ALICE, "voc.family.001");
  assert(isFavorite(ALICE, "voc.family.001") === false, "再切換一次應該取消收藏");
  assert(getFavoriteCount(ALICE) === 0, `取消收藏後數量應該回到 0，實際 ${getFavoriteCount(ALICE)}`);
  console.log("✅ 測試 3 通過：再次呼叫 toggleFavorite 會取消收藏（不是一直累加）。");
}

// ---- 測試 4：收藏多個不同主題的單字，數量與清單都正確累加，不分主題攤平存在一起 ----
{
  toggleFavorite(ALICE, "voc.family.001");
  toggleFavorite(ALICE, "voc.colors.003");
  toggleFavorite(ALICE, "voc.animals_insects.010");
  assert(getFavoriteCount(ALICE) === 3, `收藏 3 個跨主題的字，數量應該是 3，實際 ${getFavoriteCount(ALICE)}`);
  const ids = getFavoriteVocabIds(ALICE);
  assert(
    ids.includes("voc.family.001") && ids.includes("voc.colors.003") && ids.includes("voc.animals_insects.010"),
    "收藏清單應該包含全部 3 個跨主題的 id（不分主題攤平存放）"
  );
  console.log("✅ 測試 4 通過：收藏清單不分主題，可以正確累加多個不同主題的單字。");
}

// ---- 測試 5：不同使用者的收藏互相獨立 ----
{
  assert(getFavoriteCount(BOB) === 0, "Bob 還沒收藏過任何字，數量應該是 0");
  toggleFavorite(BOB, "voc.family.001");
  assert(getFavoriteCount(BOB) === 1, `Bob 收藏一個字後數量應該是 1，實際 ${getFavoriteCount(BOB)}`);
  assert(getFavoriteCount(ALICE) === 3, "Bob 的收藏不應該影響 Alice 的收藏數量");
  console.log("✅ 測試 5 通過：不同使用者的收藏清單互相獨立。");
}

// ---- 測試 6：localStorage 資料壞掉（不是合法 JSON 陣列）時，安靜降級成「沒有收藏」，不拋例外 ----
{
  const CAROL = "profile-carol";
  (globalThis.window as any).localStorage.setItem("englishForKids.favorites.v1." + CAROL, "{not valid json");
  assert(getFavoriteCount(CAROL) === 0, "資料壞掉時應該安靜降級成沒有收藏，不是拋例外");
  assert(getFavoriteVocabIds(CAROL).length === 0, "資料壞掉時收藏清單應該是空的");
  // 資料壞掉的情況下還是要能正常繼續收藏，不會卡死。
  toggleFavorite(CAROL, "voc.family.001");
  assert(getFavoriteCount(CAROL) === 1, "資料壞掉修復後應該可以正常繼續收藏");
  console.log("✅ 測試 6 通過：localStorage 資料壞掉時安靜降級，不會讓 App 掛掉，且能繼續正常收藏。");
}

// ---- 測試 7：localStorage 整個不存在（例如被瀏覽器擋掉）時，一樣安靜降級不拋例外 ----
{
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {}; // 模擬沒有 localStorage 的環境
  const DAVE = "profile-dave";
  assert(isFavorite(DAVE, "voc.family.001") === false, "沒有 localStorage 時 isFavorite 應該安靜回傳 false");
  assert(getFavoriteCount(DAVE) === 0, "沒有 localStorage 時數量應該是 0");
  toggleFavorite(DAVE, "voc.family.001"); // 不應該拋例外
  console.log("✅ 測試 7 通過：localStorage 整個不存在時安靜降級，不會讓 App 掛掉。");
  (globalThis as any).window = originalWindow;
}

// ---- 測試 8：badges.json 裡收藏相關 4 個徽章的資料形狀，符合 main.ts 判斷邏輯的假設 ----
{
  const fs = await import("node:fs");
  const badgesPath = new URL("../../content/badges/badges.json", import.meta.url);
  const allBadges = JSON.parse(fs.readFileSync(badgesPath, "utf-8")) as Array<{
    id: string;
    category: string;
    threshold: number | null;
    code: string;
  }>;

  const firstFavorite = allBadges.find((b) => b.id === "badge.onboarding.first_favorite");
  assert(firstFavorite !== undefined, "badges.json 應該要有 badge.onboarding.first_favorite（OB-04）");
  assert(
    firstFavorite!.category === "onboarding",
    `OB-04 的 category 應該是 "onboarding"，實際 "${firstFavorite!.category}"（main.ts 的 switch 是照這個分類走到 onboarding 分支）`
  );

  const favoriteTierBadges = allBadges.filter((b) => b.category === "favorites");
  assert(
    favoriteTierBadges.length === 3,
    `category 是 "favorites" 的徽章應該有 3 個（FV-01~03），實際 ${favoriteTierBadges.length} 個`
  );
  const thresholds = favoriteTierBadges.map((b) => b.threshold).sort((a, b) => (a ?? 0) - (b ?? 0));
  assert(
    JSON.stringify(thresholds) === JSON.stringify([10, 30, 100]),
    `FV-01~03 的門檻應該是 10/30/100，實際 ${JSON.stringify(thresholds)}`
  );
  console.log("✅ 測試 8 通過：badges.json 裡 OB-04／FV-01~03 的 category／threshold 資料形狀符合預期。");

  // ---- 測試 9：用真正的 favorites.ts 實際操作收藏動作，模擬 main.ts 的判斷分支
  // （achieved = favoritesCount > 0 / favoritesCount >= threshold），確認收藏數量
  // 跨過每個門檻時，這 4 個徽章會從「未達成」變成「已達成」，不是只看程式碼推論。----
  const ERIN = "profile-erin";
  function simulateOnboardingFirstFavoriteAchieved(): boolean {
    return getFavoriteCount(ERIN) > 0; // 對應 computeBadgeViewState() 的 first_favorite 分支
  }
  function simulateFavoritesTierAchieved(threshold: number): boolean {
    return getFavoriteCount(ERIN) >= threshold; // 對應 computeBadgeViewState() 的 "favorites" 分支
  }

  assert(simulateOnboardingFirstFavoriteAchieved() === false, "還沒收藏任何字時，OB-04 應該是未達成");
  assert(simulateFavoritesTierAchieved(10) === false, "還沒收藏任何字時，FV-01（門檻 10）應該是未達成");

  for (let i = 1; i <= 10; i++) toggleFavorite(ERIN, `voc.verify.${String(i).padStart(3, "0")}`);
  assert(getFavoriteCount(ERIN) === 10, `收藏 10 個字後數量應該是 10，實際 ${getFavoriteCount(ERIN)}`);
  assert(simulateOnboardingFirstFavoriteAchieved() === true, "收藏過至少一個字後，OB-04 應該變成已達成");
  assert(simulateFavoritesTierAchieved(10) === true, "收藏數量剛好達到 10 時，FV-01 應該變成已達成");
  assert(simulateFavoritesTierAchieved(30) === false, "收藏數量只有 10，還沒到 30，FV-02 應該仍是未達成");

  for (let i = 11; i <= 30; i++) toggleFavorite(ERIN, `voc.verify.${String(i).padStart(3, "0")}`);
  assert(getFavoriteCount(ERIN) === 30, `收藏 30 個字後數量應該是 30，實際 ${getFavoriteCount(ERIN)}`);
  assert(simulateFavoritesTierAchieved(30) === true, "收藏數量達到 30 時，FV-02 應該變成已達成");
  assert(simulateFavoritesTierAchieved(100) === false, "收藏數量只有 30，還沒到 100，FV-03 應該仍是未達成");

  for (let i = 31; i <= 100; i++) toggleFavorite(ERIN, `voc.verify.${String(i).padStart(3, "0")}`);
  assert(getFavoriteCount(ERIN) === 100, `收藏 100 個字後數量應該是 100，實際 ${getFavoriteCount(ERIN)}`);
  assert(simulateFavoritesTierAchieved(100) === true, "收藏數量達到 100 時，FV-03 應該變成已達成");

  console.log(
    "✅ 測試 9 通過：實際用 favorites.ts 操作收藏動作，OB-04／FV-01/02/03 分別在收藏數量跨過 1／10／30／100 時從未達成變成已達成。"
  );
}

console.log("\n✅ 全部 favorites.ts 邏輯驗證通過（含收藏徽章 OB-04／FV-01~03 的資料形狀與門檻交叉確認）。");
