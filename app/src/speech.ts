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
//
// 2026-08-28 使用者手機實測回報：Parts of Body 主題「Is your foot bigger than your hand?」
// 這句話拆成 Stage B-1 字塊後，單獨點句首字塊「Is」（大寫，保留原句大小寫）會被引擎唸成
// "Ice"。跟 "I" 是同一類「單獨一個字塊送進 TTS，前後文不足夠判斷詞性/詞義」的問題，但
// 不是同一個字——先前排查 "is" 時測的是完整句子裡的小寫 is（例如 "He is happy."），跟
// 這次「句首、大寫、單獨字塊」的情境不衝突，只是先前沒涵蓋到。這裡先採用 handoff 建議的
// 候選 1（字尾補句點成 "Is."，讓引擎當作完整短句處理，而不是被當成單一縮寫字判斷）——
// 這個修法沒辦法在沒有喇叭/瀏覽器的沙盒環境裡實際聽過確認，是根據 handoff 的推薦順序
// 先採用，還沒驗證有沒有真的解決。麻煩實機測過 Parts of Body／Places & Directions 這兩句
// 話的「Is」字塊，如果還是被唸成 "Ice"，改用 handoff 列的候選 2（把值換成 "Izz"）。
// places_directions.json 的「Is the hospital near here or over there?」也是同樣的句首
// 「Is」字塊，同一條規則就能一起修好，不用個別處理。
const AMBIGUOUS_STANDALONE_WORDS: Record<string, string> = {
  I: "Eye",
  Is: "Is.",
};

// 瀏覽器的語音清單（SpeechSynthesisVoice）沒有正式的「性別」欄位，只能靠名字裡的關鍵字
// 盡量比對——這份清單因裝置/瀏覽器而異，不保證每個人都看得到、也不保證 100% 選對，
// 找不到明確女聲時就直接退回瀏覽器預設語音（等於維持原本的行為，不會噴錯）。
const KNOWN_FEMALE_VOICE_NAME_HINTS = [
  "samantha", "zira", "aria", "karen", "moira", "tessa", "victoria", "ava",
  "allison", "susan", "fiona", "kate", "serena", "grace",
  "emma", "joanna", "salli", "kimberly", "kendra", "ivy", "justine", "nicole",
  "google us english", "google uk english female", "kyoko", "sara", "linda",
  "heather", "catherine",
];
const KNOWN_MALE_VOICE_NAME_HINTS = [
  "alex", "daniel", "david", "mark", "thomas", "oliver", "aaron",
  "george", "james", "arthur", "ryan", "google uk english male", "guy",
];

// 系統（尤其 macOS / Windows）內建的老舊合成器（如 1984 年 Fred / Albert）、趣味/卡通/特效聲音，全面排除
const DISALLOWED_NOVELTY_VOICE_NAMES = [
  "fred", "albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
  "good news", "jester", "junior", "organ", "superstar", "trinoids",
  "whisper", "zarvox", "wobble", "ralph",
  "sandy", "shelley", "flo", "eddy", "grandma", "grandpa", "rocko", "reed",
];

function isNoveltyVoice(name: string): boolean {
  const n = name.toLowerCase();
  return DISALLOWED_NOVELTY_VOICE_NAMES.some((hint) => n.includes(hint));
}



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

// 「語音設定」功能：讓使用者自己手動指定這台裝置要用哪個語音，蓋過下方三個角色各自的
// 自動偵測邏輯。這是「裝置設定」不是「帳號設定」——跟 SLOW_MODE_STORAGE_KEY 同一個等級，
// 存在 localStorage、不分使用者 profile、不能存到雲端，因為手機/電腦的語音清單完全不同，
// 綁到帳號換裝置就會找不到同名語音。
const VOICE_OVERRIDE_GENERAL_STORAGE_KEY = "englishForKids.settings.voiceGeneral.v1";
const VOICE_OVERRIDE_BENNY_STORAGE_KEY = "englishForKids.settings.voiceBenny.v1";
const VOICE_OVERRIDE_USER_REPLY_STORAGE_KEY = "englishForKids.settings.voiceUserReply.v1";

export type VoiceRole = "general" | "benny" | "userReply";

const VOICE_OVERRIDE_KEYS: Record<VoiceRole, string> = {
  general: VOICE_OVERRIDE_GENERAL_STORAGE_KEY,
  benny: VOICE_OVERRIDE_BENNY_STORAGE_KEY,
  userReply: VOICE_OVERRIDE_USER_REPLY_STORAGE_KEY,
};

/** 讀取使用者手動指定的語音名稱（SpeechSynthesisVoice.name）。
 * 回傳 null 代表「沒有手動選過，維持自動偵測」——這是預設值，確保沒動過這個設定的人
 * 行為完全不變。 */
export function getVoiceOverride(role: VoiceRole): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(VOICE_OVERRIDE_KEYS[role]);
  } catch {
    return null;
  }
}

/** 傳入 null 代表清除設定、改回自動偵測（對應 UI 下拉選單裡的「自動（系統推薦）」選項）。 */
export function setVoiceOverride(role: VoiceRole, voiceName: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (voiceName === null) {
      window.localStorage.removeItem(VOICE_OVERRIDE_KEYS[role]);
    } else {
      window.localStorage.setItem(VOICE_OVERRIDE_KEYS[role], voiceName);
    }
  } catch {
    // 忽略，跟其餘模組一致的容錯方式
  }
}

/** 如果使用者手動選過，而且這個語音名稱在「這台裝置目前的語音清單」裡真的存在，就用它；
 * 找不到（例如瀏覽器更新後語音改名、或是把 localStorage 從別的裝置複製過來）就回傳
 * undefined，呼叫端要自己 fallback 回原本的自動偵測邏輯，不能讓使用者卡在「選了但沒聲音」。 */
function resolveVoiceOverride(role: VoiceRole): SpeechSynthesisVoice | undefined {
  const name = getVoiceOverride(role);
  if (!name) return undefined;
  if (cachedVoices.length === 0) refreshVoiceCache();
  return cachedVoices.find((v) => v.name === name);
}

export interface VoiceOption {
  name: string;
  lang: string;
  gender: "female" | "male" | "neutral";
  recommended: boolean; // 對應 voiceLab.ts 的「白名單」：英語、排除卡通/老舊特效聲音
}

/** 給「語音設定」畫面列清單用：只列英語語音，排除卡通/老舊特效聲音，推薦的排在前面。
 * 判斷邏輯直接沿用檔案最上方既有的 KNOWN_FEMALE/MALE_VOICE_NAME_HINTS、isNoveltyVoice()，
 * 跟 voiceLab.ts 是同一套規則但各自維護一份（voiceLab.ts 是獨立頁面，故意不互相 import）。 */
export function getAvailableEnglishVoices(): VoiceOption[] {
  if (cachedVoices.length === 0) refreshVoiceCache();
  const options = cachedVoices
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .map((v) => {
      const n = v.name.toLowerCase();
      const novelty = isNoveltyVoice(v.name);
      let gender: "female" | "male" | "neutral" = "neutral";
      if (n.includes("female") || KNOWN_FEMALE_VOICE_NAME_HINTS.some((h) => n.includes(h))) gender = "female";
      else if (n.includes("male") || KNOWN_MALE_VOICE_NAME_HINTS.some((h) => n.includes(h))) gender = "male";
      return { name: v.name, lang: v.lang, gender, recommended: !novelty };
    });
  // 推薦的排前面，同一組內維持瀏覽器原始順序
  return [...options.filter((o) => o.recommended), ...options.filter((o) => !o.recommended)];
}

/** 「語音設定」畫面的試聽按鈕用：直接指定語音名稱唸一句範例句，不經過三個角色的自動判斷邏輯。
 * 找不到這個名字的語音（理論上不會發生，因為選單本來就是從這台裝置的清單生成的）就靜默不處理。 */
export function previewVoiceByName(voiceName: string, sampleText = "Hello! Nice to meet you."): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (cachedVoices.length === 0) refreshVoiceCache();
  const voice = cachedVoices.find((v) => v.name === voiceName);
  if (!voice) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(sampleText);
  utterance.voice = voice;
  utterance.lang = voice.lang || "en-US";
  utterance.rate = currentRate();
  window.speechSynthesis.speak(utterance);
}

/** 全站通用：優先挑選美式英文 (en-US) 乾淨自然女聲；排除卡通特效聲音，退回美式預設語音。 */
function pickPreferredVoice(): SpeechSynthesisVoice | undefined {
  const override = resolveVoiceOverride("general");
  if (override) return override;
  if (cachedVoices.length === 0) refreshVoiceCache();
  // 優先過濾美式英語 (en-US) 且排除卡通特效聲音
  const usVoices = cachedVoices.filter((v) => {
    const l = v.lang.toLowerCase().replace("_", "-");
    return (l === "en-us" || l.startsWith("en-us")) && !isNoveltyVoice(v.name);
  });
  const enVoices = cachedVoices.filter(
    (v) => v.lang.toLowerCase().startsWith("en") && !isNoveltyVoice(v.name)
  );
  const pool = usVoices.length > 0 ? usVoices : (enVoices.length > 0 ? enVoices : cachedVoices);
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
  return notKnownMale ?? pool[0];
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


/**
 * Stage E 角色 1：小熊 Benny (男聲)
 * 首選：Google UK English Male
 * 次選：高品質系統男聲（Alex, Evan, Nathan, Daniel 等），全面排除 Fred 等機械雜音
 */
function pickBennyVoice(): SpeechSynthesisVoice | undefined {
  const override = resolveVoiceOverride("benny");
  if (override) return override;
  if (cachedVoices.length === 0) refreshVoiceCache();
  const validVoices = cachedVoices.filter((v) => !isNoveltyVoice(v.name));

  // 1. 首選：Google UK English Male
  const googleUkMale = validVoices.find((v) =>
    v.name.toLowerCase().includes("google uk english male")
  );
  if (googleUkMale) return googleUkMale;

  // 2. 次選：其他英語男聲
  const enVoices = validVoices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const explicitMale = enVoices.find((v) => v.name.toLowerCase().includes("male"));
  if (explicitMale) return explicitMale;

  const knownMale = enVoices.find((v) =>
    KNOWN_MALE_VOICE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
  );
  if (knownMale) return knownMale;

  // 3. 後備：排除已知女聲的英語語音
  return (
    enVoices.find(
      (v) => !KNOWN_FEMALE_VOICE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
    ) ?? validVoices[0]
  );
}

/**
 * Stage E 角色 2：使用者回答 (女聲)
 * 首選：Google US English
 * 次選：高品質系統女聲（Samantha, Ava, Allison 等）
 */
function pickUserDialogueVoice(): SpeechSynthesisVoice | undefined {
  const override = resolveVoiceOverride("userReply");
  if (override) return override;
  if (cachedVoices.length === 0) refreshVoiceCache();
  const validVoices = cachedVoices.filter((v) => !isNoveltyVoice(v.name));

  // 1. 首選：Google US English
  const googleUs = validVoices.find((v) =>
    v.name.toLowerCase().includes("google us english")
  );
  if (googleUs) return googleUs;

  // 2. 次選：其他英語女聲
  const enVoices = validVoices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const explicitFemale = enVoices.find((v) => v.name.toLowerCase().includes("female"));
  if (explicitFemale) return explicitFemale;

  const knownFemale = enVoices.find((v) =>
    KNOWN_FEMALE_VOICE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
  );
  if (knownFemale) return knownFemale;

  return pickPreferredVoice();
}

export interface DialogueSpeechOptions {
  persona: "boy" | "girl";
  onEnd?: () => void;
}

/** Stage E 會話練習專用：小熊 Benny (Google UK English Male) 與 使用者回答 (Google US English) */
export function speakDialogueLine(text: string, options: DialogueSpeechOptions): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const spokenText = AMBIGUOUS_STANDALONE_WORDS[text] ?? text;
  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.lang = "en-US";

  // 連動上方慢速按鈕：慢速模式對齊全站標準 SLOW_RATE (0.6)，常速為自然會話語速 (0.95)
  const isSlow = isSlowSpeechEnabled();
  utterance.rate = isSlow ? SLOW_RATE : 0.95;
  utterance.volume = 1.0; // 確保 Web Speech API 音量為最大值 1.0

  if (options.persona === "boy") {
    // 角色 1：小熊 Benny（Google UK English Male 男聲）
    utterance.voice = pickBennyVoice() ?? null;
    utterance.pitch = 1.0;
    console.info(
      `[Stage E TTS] 角色 1: 小熊 Benny | 語音: "${utterance.voice?.name ?? '系統預設'}" | Pitch: 1.0 | 語速: ${utterance.rate} | 音量: ${utterance.volume} (慢速模式: ${isSlow})`
    );
  } else {
    // 角色 2：使用者回答（Google US English 女聲）
    utterance.voice = pickUserDialogueVoice() ?? null;
    utterance.pitch = 1.0;
    console.info(
      `[Stage E TTS] 角色 2: 使用者回答 | 語音: "${utterance.voice?.name ?? '系統預設'}" | Pitch: 1.0 | 語速: ${utterance.rate} | 音量: ${utterance.volume} (慢速模式: ${isSlow})`
    );
  }




  let ended = false;
  const triggerEnd = () => {
    if (!ended) {
      ended = true;
      options.onEnd?.();
    }
  };

  utterance.onend = triggerEnd;
  utterance.onerror = triggerEnd;

  // 防禦性 fallback：依字數推估最大播放時長（慢速時增加時間），防止瀏覽器 TTS 偶發遺失 onend 事件
  const wordCount = spokenText.trim().split(/\s+/).length;
  const baseTimePerWord = isSlowSpeechEnabled() ? 650 : 450;
  const fallbackMs = Math.max(1600, wordCount * baseTimePerWord + 1200);
  setTimeout(() => {
    if (!ended && window.speechSynthesis.speaking) {
      setTimeout(triggerEnd, 500);
    } else {
      triggerEnd();
    }
  }, fallbackMs);

  window.speechSynthesis.speak(utterance);
}
