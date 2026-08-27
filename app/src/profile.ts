// 本機端「登入登出」——不是真的帳號系統，只是讓同一台電腦、不同小孩可以各自選一個
// 使用者身分（例如選「誰在玩」），讓每個人的成效追蹤資料分開存，不會混在一起。
// 不用密碼、不用雲端、不用後端，符合家庭/個人本機使用的場景（HANDOFF.md 第 2 節角色規劃：
// 只有「管理者（家長／使用者本人）」與「使用者（學習者）」，不做教師/班級功能）。

const PROFILES_KEY = "englishForKids.profiles.v1";
const ACTIVE_PROFILE_ID_KEY = "englishForKids.activeProfileId.v1";

export interface Profile {
  id: string;
  name: string;
  avatarId: string; // 對應 avatars.ts 裡某張頭像的 id，畫面渲染時才去查對應的圖片網址
  createdAt: string; // ISO 字串
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readProfiles(): Profile[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Profile[]) : [];
  } catch {
    // localStorage 被擋掉或資料壞掉，當作沒有任何使用者，不要讓 App 掛掉。
    return [];
  }
}

function writeProfiles(profiles: Profile[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略——不影響當次使用，只是名單不會被記住。
  }
}

export function listProfiles(): Profile[] {
  return readProfiles();
}

export function getProfileById(id: string): Profile | null {
  return readProfiles().find((p) => p.id === id) ?? null;
}

/** 新增一個本機使用者，名字前後空白會被去除；名字不能是空字串。
 * avatarId 對應 avatars.ts 裡某張頭像的 id——這裡故意不 import avatars.ts，
 * 讓 profile.ts 只負責存資料，不用知道頭像圖片實際長怎樣、放在哪裡。 */
export function createProfile(name: string, avatarId: string): Profile {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("使用者名稱不能是空的");
  }
  const profile: Profile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    avatarId,
    createdAt: new Date().toISOString(),
  };
  const profiles = readProfiles();
  profiles.push(profile);
  writeProfiles(profiles);
  return profile;
}

export interface ProfileUpdate {
  name?: string;
  avatarId?: string;
}

/** 更新使用者的名字／頭像（個人設定頁用）。名字一樣要求非空，前後空白會去除；
 * 找不到這個使用者就回傳 null（理論上不會發生，除非剛好在別的分頁被刪除了）。 */
export function updateProfile(id: string, updates: ProfileUpdate): Profile | null {
  const profiles = readProfiles();
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = profiles[index];
  const nextName = updates.name !== undefined ? updates.name.trim() : current.name;
  if (nextName.length === 0) {
    throw new Error("使用者名稱不能是空的");
  }

  const updated: Profile = {
    ...current,
    name: nextName,
    avatarId: updates.avatarId ?? current.avatarId,
  };
  profiles[index] = updated;
  writeProfiles(profiles);
  return updated;
}

/** 刪除一個使用者（不會連帶刪除他的成效紀錄，那些資料維持在 localStorage 裡不影響其他人）。 */
export function deleteProfile(id: string): void {
  const profiles = readProfiles().filter((p) => p.id !== id);
  writeProfiles(profiles);
  if (getActiveProfileId() === id) {
    setActiveProfileId(null);
  }
}

export function getActiveProfileId(): string | null {
  if (!hasLocalStorage()) return null;
  try {
    return window.localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

/** 設定目前登入的使用者；傳 null 代表登出。 */
export function setActiveProfileId(id: string | null): void {
  if (!hasLocalStorage()) return;
  try {
    if (id === null) {
      window.localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
    }
  } catch {
    // 忽略
  }
}
