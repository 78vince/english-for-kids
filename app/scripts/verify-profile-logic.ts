// 驗證 profile.ts 的本機使用者（登入登出）邏輯：新增/列出/刪除使用者、記住目前登入的人、登出、頭像欄位。
// 這支 script 故意不 import avatars.ts——avatars.ts 用了 Vite 專屬的 import.meta.glob（"?url"），
// 只能在 Vite 的打包環境跑，tsx 這種單純的 Node/TS 執行器沒辦法處理；反正 profile.ts
// 本來就只把 avatarId 當成一般字串存，不需要真的載入圖片才能測試邏輯。
// 用法：npx tsx scripts/verify-profile-logic.ts

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
  listProfiles,
  createProfile,
  deleteProfile,
  getProfileById,
  getActiveProfileId,
  setActiveProfileId,
  updateProfile,
} = await import("../src/profile");

// ---- 測試 1：一開始沒有任何使用者 ----
{
  assert(listProfiles().length === 0, "初始狀態不應該有任何使用者");
  assert(getActiveProfileId() === null, "初始狀態不應該有已登入的使用者");
  console.log("✅ 測試 1 通過：初始狀態沒有使用者、沒有人登入。");
}

// ---- 測試 2：新增使用者，名字前後空白會被去除，頭像 id 會被存起來 ----
let alice: ReturnType<typeof createProfile>;
{
  alice = createProfile("  小美  ", "capybara");
  assert(alice.name === "小美", `名字應該去除前後空白，實際 "${alice.name}"`);
  assert(alice.avatarId === "capybara", `頭像 id 應該被存下來，實際 "${alice.avatarId}"`);
  assert(listProfiles().length === 1, "新增後應該有 1 個使用者");
  console.log("✅ 測試 2 通過：新增使用者會去除名字前後空白，並存下選擇的頭像 id。");
}

// ---- 測試 3：空字串名字要丟例外，不能新增 ----
{
  let threw = false;
  try {
    createProfile("   ", "capybara");
  } catch {
    threw = true;
  }
  assert(threw, "空字串名字應該要丟例外");
  assert(listProfiles().length === 1, "新增失敗不該增加使用者數量");
  console.log("✅ 測試 3 通過：空字串名字會被擋下來。");
}

// ---- 測試 4：可以新增第二個使用者，兩人各自獨立存在，頭像也各自獨立 ----
let bob: ReturnType<typeof createProfile>;
{
  bob = createProfile("小明", "monkey");
  const all = listProfiles();
  assert(all.length === 2, `應該有 2 個使用者，實際 ${all.length}`);
  assert(getProfileById(alice.id)?.name === "小美", "應該找得到小美");
  assert(getProfileById(bob.id)?.name === "小明", "應該找得到小明");
  assert(getProfileById(bob.id)?.avatarId === "monkey", "小明的頭像應該是 monkey");
  assert(getProfileById(alice.id)?.avatarId === "capybara", "小美的頭像不該被小明影響");
  console.log("✅ 測試 4 通過：可以新增多個使用者，各自獨立存在，頭像互不影響。");
}

// ---- 測試 5：設定／讀取目前登入的使用者 ----
{
  setActiveProfileId(alice.id);
  assert(getActiveProfileId() === alice.id, "應該記住小美是目前登入的使用者");
  console.log("✅ 測試 5 通過：可以設定並讀回目前登入的使用者。");
}

// ---- 測試 6：登出（傳 null）之後，getActiveProfileId 應該回到 null ----
{
  setActiveProfileId(null);
  assert(getActiveProfileId() === null, "登出後不應該有已登入的使用者");
  console.log("✅ 測試 6 通過：登出後正確清除目前登入的使用者。");
}

// ---- 測試 7：刪除使用者後，名單裡不該再看到他；如果他是目前登入的人，也要自動登出 ----
{
  setActiveProfileId(bob.id);
  assert(getActiveProfileId() === bob.id, "應該先記住小明是目前登入的使用者");

  deleteProfile(bob.id);
  assert(getProfileById(bob.id) === null, "刪除後應該找不到小明");
  assert(listProfiles().length === 1, "刪除後應該只剩 1 個使用者");
  assert(getActiveProfileId() === null, "刪除目前登入的使用者後，應該自動登出");
  console.log("✅ 測試 7 通過：刪除使用者會從名單移除，若他是目前登入者也會自動登出。");
}

// ---- 測試 8：個人設定頁可以更新名字／頭像，其他使用者不受影響 ----
let carol: ReturnType<typeof createProfile>;
{
  carol = createProfile("小華", "siamese_cat");

  const renamed = updateProfile(carol.id, { name: "  小華華  " });
  assert(renamed !== null, "更新應該要成功，回傳更新後的資料");
  assert(renamed!.name === "小華華", `名字應該更新成小華華並去除空白，實際 "${renamed!.name}"`);
  assert(renamed!.avatarId === "siamese_cat", "只改名字，頭像應該維持原本的 siamese_cat");

  const rebadged = updateProfile(carol.id, { avatarId: "bull_terrier" });
  assert(rebadged!.avatarId === "bull_terrier", "頭像應該更新成 bull_terrier");
  assert(rebadged!.name === "小華華", "只改頭像，名字應該維持剛剛更新的小華華");

  assert(getProfileById(carol.id)?.avatarId === "bull_terrier", "重新讀取也應該看到最新的頭像");
  assert(getProfileById(alice.id)?.name === "小美", "更新小華不該影響小美的資料");
  console.log("✅ 測試 8 通過：可以個別更新名字／頭像，且不影響其他使用者。");
}

// ---- 測試 9：把名字改成空字串要丟例外，且不能把資料改壞 ----
{
  let threw = false;
  try {
    updateProfile(carol.id, { name: "   " });
  } catch {
    threw = true;
  }
  assert(threw, "把名字改成空字串應該要丟例外");
  assert(getProfileById(carol.id)?.name === "小華華", "更新失敗，名字應該維持原本的值");
  console.log("✅ 測試 9 通過：改成空字串名字會被擋下來，不會把資料改壞。");
}

// ---- 測試 10：更新不存在的使用者要回傳 null ----
{
  const result = updateProfile("profile-does-not-exist", { name: "測試" });
  assert(result === null, "更新不存在的使用者應該回傳 null");
  console.log("✅ 測試 10 通過：更新不存在的使用者會安全地回傳 null。");
}

console.log("\n✅ 全部 profile.ts 邏輯驗證通過。");
