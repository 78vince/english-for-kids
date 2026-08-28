// 用瀏覽器內建的 Web Speech Synthesis API 唸出英文，不需要任何音檔、也不用後端——
// 對應 HANDOFF.md 第 7 節「待決定事項」裡的 TTS 選項，這裡先採用免費、零設定的瀏覽器方案
// （docs/content-plan-gept-kids.md 也提到這是候選方案之一）。
// vocab 資料本身已經有 `audio` 欄位（目前都是 null），未來如果要換成真人錄音或其他 TTS 引擎，
// 只要把這個檔案內部實作換掉（例如改成播放 audio/{id}.mp3），呼叫端完全不用改。

// 有些系統的語音合成引擎，看到「單獨」一個大寫 I（前後沒有其他字）時會誤判成羅馬數字 1，
// 唸成 "one" 而不是代名詞 I（應該唸作 "eye"）——這是 Stage B-1 句子排序點單一字塊時會發生的問題，
// 出現在完整句子裡不會（例如 "I have a brother." 前後文夠清楚，正常都會唸對代名詞 I）。
// 這裡只在「整句要唸的文字剛好等於這幾個容易被唸錯的單字」時，換成拼法不同但發音相同的替代字，
// 繞開這個問題；不影響完整句子的發音。
// （檢查過其他會出現在句子裡的短字：is / in / us / He / It / My / my——都不是羅馬數字也不是
// 容易跟字母名稱搞混的字，目前沒有觀察到同樣的問題，所以先只處理 I。）
const AMBIGUOUS_STANDALONE_WORDS: Record<string, string> = {
  I: "Eye",
};

// 瀏覽器的語音清單（SpeechSynthesisVoice）沒有正式的「性別」欄位，只能靠名字裡的關鍵字
// 盡量比對——這份清單因裝置/瀏覽器而異，不保證每個人都看得到、也不保證 100% 選對，
// 找不到明確女聲時就直接退回瀏覽器預設語音（等於維持原本的行為，不會噴錯）。
const KNOWN_FEMALE_VOICE_NAME_HINTS = [
  "samantha", "zira", "aria", "karen", "moira", "tessa", "victoria", "ava",
  "allison", "susan", "fiona", "kate", "serena", "shelley", "sandy", "grace",
  "emma", "joanna", "salli", "kimberly", "kendra", "ivy", "justine", "nicole",
  "google us english", "google uk english female", "kyoko", "sara", "linda",
  "heather", "catherine",
];
const KNOWN_MALE_VOICE_NAME_HINTS = [
  "alex", "daniel", "fred", "david", "mark", "thomas", "oliver", "aaron",
  "george", "james", "arthur", "ryan", "google uk english male", "guy",
];

let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoiceCache(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoiceCache();
  // 有些瀏覽器（尤其 Chrome）語音清單是非同步載入的，第一次呼叫 getVoices() 可能是空的，
  // 要等 voiceschanged 事件才拿得到完整清單。
  window.speechSynthesis.onvoiceschanged = refreshVoiceCache;
}

const NORMAL_RATE = 0.9;
const SLOW_RATE = 0.6; // 明顯放慢但不到逐字唸的程度，可依實際聽感微調

// 2026-08-27 使用者用手機實測回報，短文朗讀（speakPassage）唸 Pronouns 短文時，
// "Mia" 這個專有名詞被瀏覽器語音引擎誤判成需要逐字母拼讀的縮寫（唸成 "M-I-A" 而不是
// 完整名字）。原本一度懷疑跟慢速模式（0.6 倍速）有關，一度在這裡加了一個 speakPassage
// 專用的、比較保守的 PASSAGE_SLOW_RATE = 0.75，想說用比較不極端的慢速倍率避開這個問題。
// 2026-08-28 使用者實際測過：**常速跟慢速都一樣會被拼讀**，證實這個 bug 跟語速快慢
// 完全無關，是這個字本身（3 個字母、大寫開頭，外觀很像縮寫）被引擎誤判，不是語速造成的。
// 所以已經把這個「短文朗讀用比較保守倍率」的嘗試撤掉，短文朗讀跟單字/句子朗讀一樣
// 沿用同一組 NORMAL_RATE／SLOW_RATE，不需要為了這個 bug 另外分岔出一組倍率。
// 真正的修法是把短文裡的角色名字 "Mia" 直接改成 "Ella"（見
// content/passages/food_drink.json／personality_traits.json／pronouns.json），
// 詳見 HANDOFF.md 對應章節的排查記錄。

const SLOW_MODE_STORAGE_KEY = "englishForKids.settings.slowSpeech.v1";

// 慢速模式是「這台裝置聽力偏好」，不是學習成效資料，故意不比照 progress.ts 等模組
// 依 profileId 分開存——不管誰登入，慢速開關狀態都一致，比較符合「小朋友聽不清楚
// 就開，聽得清楚再關」這種臨時性、跟裝置而非個別使用者綁定的操作情境。
function readSlowMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SLOW_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let slowModeEnabled = readSlowMode();

export function isSlowSpeechEnabled(): boolean {
  return slowModeEnabled;
}

export function setSlowSpeechEnabled(enabled: boolean): void {
  slowModeEnabled = enabled;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SLOW_MODE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 忽略，跟其餘模組一致的容錯方式
  }
}

function currentRate(): number {
  return slowModeEnabled ? SLOW_RATE : NORMAL_RATE;
}

/** 盡量挑一個聽起來像女聲的英文語音；找不到就回傳 undefined，讓瀏覽器用預設語音。 */
function pickPreferredVoice(): SpeechSynthesisVoice | undefined {
  if (cachedVoices.length === 0) refreshVoiceCache();
  const enVoices = cachedVoices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = enVoices.length > 0 ? enVoices : cachedVoices;
  if (pool.length === 0) return undefined;

  const explicitFemale = pool.find((v) => v.name.toLowerCase().includes("female"));
  if (explicitFemale) return explicitFemale;

  const knownFemale = pool.find((v) =>
    KNOWN_FEMALE_VOICE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
  );
  if (knownFemale) return knownFemale;

  // 沒有明確女聲候選時，至少避開已知男聲名字，不要隨便挑到男聲。
  const notKnownMale = pool.find(
    (v) => !KNOWN_MALE_VOICE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
  );
  return notKnownMale ?? undefined; // 全部都像男聲的話，維持瀏覽器預設，不硬選
}

export function speakEnglish(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // 避免連續點擊時，前一句還沒唸完聲音就疊在一起
  const spokenText = AMBIGUOUS_STANDALONE_WORDS[text] ?? text;
  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.lang = "en-US";
  utterance.voice = pickPreferredVoice() ?? null;
  utterance.rate = currentRate(); // 一般語速稍微放慢；慢速模式開啟時更慢
  window.speechSynthesis.speak(utterance);
}

// 短文理解「朗讀全文」用：跟 speakEnglish() 不同的地方是需要知道「唸完了」（onEnd），
// 呼叫端（main.ts）才能把播放按鈕從「暫停」換回「播放」；正常唸完或中途被
// stopSpeaking() 取消，都會觸發 onend／onerror，兩種情況都要讓按鈕狀態復原，
// 所以這裡兩個都接同一個 onEnd callback。
export function speakPassage(text: string, onEnd: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.voice = pickPreferredVoice() ?? null;
  utterance.rate = currentRate(); // 一般語速稍微放慢；慢速模式開啟時更慢（跟 speakEnglish 用同一組倍率）
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

/** 使用者按「暫停」時直接整段停止（不是真的暫停/續播），跟 handoff 需求一致：按暫停鍵就停止朗讀。 */
export function stopSpeaking(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
