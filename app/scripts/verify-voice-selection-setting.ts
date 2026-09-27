// 驗證「語音設定」功能：讓使用者自己指定這台裝置三個發音角色（通用發音／Stage E 小熊
// Benny／Stage E 使用者回答）要用哪個語音，蓋過 speech.ts 各自的自動偵測邏輯。
// 比照 verify-vocab-overview-english-toggle.ts 的靜態比對手法（main.ts／speech.ts
// 都用了瀏覽器專屬 API，沒辦法在 plain tsx 下直接跑起來用真的 speechSynthesis 測試，
// 這裡改成讀原始碼字串，確認關鍵程式碼結構真的存在、順序也對）。
// 用法：npx tsx scripts/verify-voice-selection-setting.ts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const speechTs = readFileSync(path.resolve(dir, "../src/speech.ts"), "utf-8");
const mainTs = readFileSync(path.resolve(dir, "../src/main.ts"), "utf-8");
const styleCss = readFileSync(path.resolve(dir, "../src/style.css"), "utf-8");

// ---- 測試 1：speech.ts 有四個新 export，且 setVoiceOverride(role, null) 對應
//      localStorage.removeItem ----
{
  assert(speechTs.includes("export function getVoiceOverride("), "speech.ts 應該要有 export function getVoiceOverride()");
  assert(speechTs.includes("export function setVoiceOverride("), "speech.ts 應該要有 export function setVoiceOverride()");
  assert(speechTs.includes("export function getAvailableEnglishVoices("), "speech.ts 應該要有 export function getAvailableEnglishVoices()");
  assert(speechTs.includes("export function previewVoiceByName("), "speech.ts 應該要有 export function previewVoiceByName()");
  assert(speechTs.includes("export type VoiceRole"), "speech.ts 應該要有 export type VoiceRole");

  const setFnStart = speechTs.indexOf("export function setVoiceOverride(");
  const setFnBody = speechTs.slice(setFnStart, setFnStart + 400);
  assert(
    setFnBody.includes("voiceName === null") && setFnBody.includes("localStorage.removeItem"),
    "setVoiceOverride(role, null) 應該要呼叫 localStorage.removeItem 清除設定，而不是存一個空字串"
  );
  console.log("✅ 測試 1 通過：speech.ts 四個新 export 都存在，setVoiceOverride(role, null) 正確對應 localStorage.removeItem。");
}

// ---- 測試 2：pickPreferredVoice／pickBennyVoice／pickUserDialogueVoice 三個函式，
//      內文最前面就呼叫 resolveVoiceOverride(...)——確認手動選擇的優先權真的蓋過
//      自動偵測，不是加在邏輯後面永遠不會被走到 ----
{
  function assertOverrideCheckedFirst(fnSignature: string, expectedRole: string, label: string): void {
    const start = speechTs.indexOf(fnSignature);
    assert(start !== -1, `speech.ts 應該要有 ${fnSignature}`);
    // 函式定義開頭到第一個 refreshVoiceCache() 呼叫之間的這段，應該要看得到
    // resolveVoiceOverride 的呼叫跟 return，且要排在 refreshVoiceCache() 之前
    // （refreshVoiceCache 是原本自動偵測邏輯的第一步）。
    const bodyWindow = speechTs.slice(start, start + 400);
    const overrideIdx = bodyWindow.indexOf(`resolveVoiceOverride("${expectedRole}")`);
    const refreshIdx = bodyWindow.indexOf("refreshVoiceCache()");
    assert(overrideIdx !== -1, `${label} 應該要呼叫 resolveVoiceOverride("${expectedRole}")`);
    assert(
      refreshIdx === -1 || overrideIdx < refreshIdx,
      `${label} 應該要先檢查 resolveVoiceOverride(...)，再進到原本的自動偵測邏輯（refreshVoiceCache 那段），不能反過來`
    );
    // 緊接著 resolveVoiceOverride(...) 呼叫之後，要有 if (override) return override; 這種
    // 提早 return 的寫法，確認真的會蓋過後面的自動偵測，不是叫了但沒用回傳值。
    const afterOverride = bodyWindow.slice(overrideIdx, overrideIdx + 120);
    assert(
      afterOverride.includes("if (override) return override;"),
      `${label} 應該要在拿到 override 之後立刻 if (override) return override;`
    );
  }

  assertOverrideCheckedFirst("function pickPreferredVoice(", "general", "pickPreferredVoice()");
  assertOverrideCheckedFirst("function pickBennyVoice(", "benny", "pickBennyVoice()");
  assertOverrideCheckedFirst("function pickUserDialogueVoice(", "userReply", "pickUserDialogueVoice()");
  console.log("✅ 測試 2 通過：pickPreferredVoice／pickBennyVoice／pickUserDialogueVoice 三個函式都在最前面檢查手動覆寫，優先權正確蓋過自動偵測。");
}

// ---- 測試 3：main.ts 的 renderProfileDetail() 有呼叫語音設定區塊建構函式 ----
{
  assert(mainTs.includes("function renderVoiceSettingsSection("), "main.ts 應該要有 renderVoiceSettingsSection() 函式");
  assert(
    mainTs.includes("app!.appendChild(renderVoiceSettingsSection())"),
    "main.ts 應該要在畫面上實際呼叫並掛上 renderVoiceSettingsSection() 的回傳結果"
  );

  const renderProfileDetailStart = mainTs.indexOf("function renderProfileDetail(");
  const renderVoiceSettingsCallIdx = mainTs.indexOf("app!.appendChild(renderVoiceSettingsSection())");
  assert(
    renderProfileDetailStart !== -1 && renderVoiceSettingsCallIdx > renderProfileDetailStart,
    "renderVoiceSettingsSection() 的呼叫應該要在 renderProfileDetail() 函式內部"
  );

  // 確認三個角色（general／benny／userReply）都有在 renderVoiceSettingsSection() 裡出現
  const sectionFnStart = mainTs.indexOf("function renderVoiceSettingsSection(");
  const sectionFnBody = mainTs.slice(sectionFnStart, sectionFnStart + 3500);
  assert(sectionFnBody.includes(`role: "general"`), "renderVoiceSettingsSection() 應該要涵蓋 general 角色");
  assert(sectionFnBody.includes(`role: "benny"`), "renderVoiceSettingsSection() 應該要涵蓋 benny 角色");
  assert(sectionFnBody.includes(`role: "userReply"`), "renderVoiceSettingsSection() 應該要涵蓋 userReply 角色");
  assert(
    sectionFnBody.includes("這是這台裝置的設定"),
    "renderVoiceSettingsSection() 應該要有明確的裝置設定說明文字，避免家長以為換裝置設定會跟著走"
  );
  console.log("✅ 測試 3 通過：main.ts 的 renderProfileDetail() 正確呼叫並掛上語音設定區塊，三個角色與裝置設定說明文字都涵蓋到。");
}

// ---- 測試 4：三個 localStorage key 字串都存在且互不相同 ----
{
  const keyMatches = [...speechTs.matchAll(/"englishForKids\.settings\.voice(General|Benny|UserReply)\.v1"/g)].map(
    (m) => m[0]
  );
  assert(keyMatches.length >= 3, "speech.ts 應該要有 voiceGeneral／voiceBenny／voiceUserReply 三個 localStorage key 字串");
  const uniqueKeys = new Set(keyMatches);
  assert(uniqueKeys.size === keyMatches.length || uniqueKeys.size >= 3, "三個 localStorage key 字串應該互不相同");
  assert(speechTs.includes('"englishForKids.settings.voiceGeneral.v1"'), "應該要有 voiceGeneral.v1 這個 key");
  assert(speechTs.includes('"englishForKids.settings.voiceBenny.v1"'), "應該要有 voiceBenny.v1 這個 key");
  assert(speechTs.includes('"englishForKids.settings.voiceUserReply.v1"'), "應該要有 voiceUserReply.v1 這個 key");
  console.log("✅ 測試 4 通過：voiceGeneral／voiceBenny／voiceUserReply 三個 localStorage key 字串都存在且互不相同。");
}

// ---- 測試 5：main.ts 有掛上 speechSynthesis 的 voiceschanged 監聽，處理手機語音清單
//      非同步載入的問題，且只在 profileDetail 畫面時才重繪 ----
{
  assert(
    mainTs.includes('addEventListener("voiceschanged"'),
    "main.ts 應該要掛上 speechSynthesis 的 voiceschanged 監聽，處理語音清單非同步載入的問題"
  );
  const listenerStart = mainTs.indexOf('addEventListener("voiceschanged"');
  const listenerWindow = mainTs.slice(listenerStart, listenerStart + 150);
  assert(
    listenerWindow.includes('screen === "profileDetail"'),
    "voiceschanged 監聽應該要判斷目前是不是停在 profileDetail 畫面才重繪，避免使用者在別的畫面被打斷"
  );
  console.log("✅ 測試 5 通過：main.ts 有正確掛上 voiceschanged 監聽，且只在 profileDetail 畫面時才重繪。");
}

// ---- 測試 6：CSS 有語音設定區塊的樣式 ----
{
  assert(styleCss.includes(".voice-settings-section"), "style.css 應該要有 .voice-settings-section 樣式");
  assert(styleCss.includes(".voice-settings-hint"), "style.css 應該要有 .voice-settings-hint 樣式");
  assert(styleCss.includes(".voice-settings-row"), "style.css 應該要有 .voice-settings-row 樣式");
  assert(styleCss.includes(".voice-settings-select"), "style.css 應該要有 .voice-settings-select 樣式");
  assert(styleCss.includes(".voice-settings-preview-btn"), "style.css 應該要有 .voice-settings-preview-btn 樣式");
  console.log("✅ 測試 6 通過：style.css 涵蓋語音設定區塊需要的所有樣式類別。");
}

console.log("\n✅ 全部「語音設定」功能驗證通過。");
