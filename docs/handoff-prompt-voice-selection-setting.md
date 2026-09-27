# Handoff：新增「語音設定」——讓使用者自己選這台裝置要用哪個語音

## 背景與需求

使用者實際在手機上使用時，發現唸出來的英文語音跟預期的不一樣（跟電腦瀏覽器聽到的聲音不同）。這是預期中的裝置差異：`app/src/speech.ts` 的 `pickPreferredVoice()`／`pickBennyVoice()`／`pickUserDialogueVoice()` 都是用 `window.speechSynthesis.getVoices()` 從**這台裝置本身**的語音清單裡自動篩選猜測出最合適的聲音，但每台裝置/瀏覽器內建的語音清單完全不同（例如電腦 Chrome 常見「Google US English」，手機 iOS 可能只有「Samantha」「Karen」之類的 Siri 語音，Android 則看裝置有沒有裝 Google TTS 語音包），自動偵測邏輯猜的名字在不同裝置上不一定猜得準。

使用者確認：這次要做的語音選擇功能，範圍包含**全部三種發音角色**都要能讓使用者自己手動指定：

1. **通用發音**——單字卡、例句、短文朗讀共用的那個聲音（`pickPreferredVoice()`，`speakEnglish()`／`speakPassage()` 呼叫的對象）
2. **Stage E 小熊 Benny（男聲角色）**——`pickBennyVoice()`
3. **Stage E 使用者回答（女聲角色）**——`pickUserDialogueVoice()`

## 重要前提：這是「裝置設定」，不是「帳號設定」

跟現有的慢速模式（`SLOW_MODE_STORAGE_KEY`）、單字總覽練習模式同一個等級——**存在 localStorage，不分使用者 profile，也不能存到雲端或帳號資料裡**。因為手機跟電腦上的語音清單完全不同，如果把「選了哪個語音」這件事綁到帳號，換一台裝置玩就會找不到同名語音，設定形同失效。這點務必在 UI 文案裡跟使用者說清楚（例如「這是這台裝置的設定，換到別的手機或電腦需要重新選一次」），避免家長以為換裝置後設定會跟著跑。

專案裡已經有現成的技術地基可以直接沿用：`app/src/voiceLab.ts`（`/voice-lab.html` 語音比較實驗室）已經寫好「列出這台裝置全部語音、依名字關鍵字猜測性別、標示白名單/黑名單、即時試聽」這一整套邏輯，這次不用重新發明，同一套判斷規則 `speech.ts` 裡已經有一份（`KNOWN_FEMALE_VOICE_NAME_HINTS`／`KNOWN_MALE_VOICE_NAME_HINTS`／`DISALLOWED_NOVELTY_VOICE_NAMES`／`isNoveltyVoice()`），直接在 `speech.ts` 裡擴充即可，不用去改或匯入 `voiceLab.ts`（那是獨立 Vite entry，故意跟主 App 隔開）。

## 1. `app/src/speech.ts`：新增裝置層級語音覆寫設定

在 `SLOW_MODE_STORAGE_KEY` 附近新增三把 key 跟對應的 get/set：

```ts
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
```

修改三個挑選函式，開頭都先檢查有沒有手動覆寫：

```ts
function pickPreferredVoice(): SpeechSynthesisVoice | undefined {
  const override = resolveVoiceOverride("general");
  if (override) return override;
  // ...其餘既有的自動偵測邏輯完全不動
}

function pickBennyVoice(): SpeechSynthesisVoice | undefined {
  const override = resolveVoiceOverride("benny");
  if (override) return override;
  // ...其餘既有的自動偵測邏輯完全不動
}

function pickUserDialogueVoice(): SpeechSynthesisVoice | undefined {
  const override = resolveVoiceOverride("userReply");
  if (override) return override;
  // ...其餘既有的自動偵測邏輯完全不動
}
```

## 2. `app/src/speech.ts`：新增給設定畫面用的輔助函式

```ts
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
```

`KNOWN_FEMALE_VOICE_NAME_HINTS`／`KNOWN_MALE_VOICE_NAME_HINTS`／`isNoveltyVoice` 都已經是這個檔案裡的既有內部函式/常數，直接用就好，不用重複定義。

## 3. `app/src/main.ts`：新增「語音設定」畫面區塊

放的位置建議：`renderProfileDetail()`（個人檔案頁）裡，現有「重置所有進度紀錄」那個區塊的**上方**新增一個獨立卡片區塊，標題「🔊 語音設定」，說明文字要清楚寫「這是這台裝置的設定，不會跟著帳號走，換到別的手機或電腦要重新選一次」。

三個角色各一個下拉選單＋試聽按鈕，排列方式仿照 Voice Lab 的角色卡片但大幅簡化（不要 tab 分類、不要黑白名單標籤、不要音調/語速滑桿——那些是給你自己排查用的技術細節，一般使用者只需要「選一個、聽一下、滿意就好」）：

```ts
function renderVoiceSettingsSection(): HTMLDivElement {
  const section = document.createElement("div");
  section.className = "voice-settings-section";

  const title = document.createElement("h3");
  title.textContent = "🔊 語音設定";
  section.appendChild(title);

  const hint = document.createElement("p");
  hint.className = "voice-settings-hint";
  hint.textContent = "這是這台裝置的設定，不會跟著帳號走——換到別的手機或電腦時，需要重新選一次。不選就會用系統自動推薦的語音。";
  section.appendChild(hint);

  const roles: { role: VoiceRole; label: string; sample: string }[] = [
    { role: "general", label: "通用發音（單字／例句／短文朗讀）", sample: "Hello! Nice to meet you." },
    { role: "benny", label: "🐻 小熊 Benny（會話練習男聲角色）", sample: "Good morning! How are you?" },
    { role: "userReply", label: "👧 使用者回答（會話練習女聲角色）", sample: "Good morning! I am doing great!" },
  ];

  const voiceOptions = getAvailableEnglishVoices();

  for (const { role, label, sample } of roles) {
    const row = document.createElement("div");
    row.className = "voice-settings-row";

    const rowLabel = document.createElement("label");
    rowLabel.textContent = label;
    row.appendChild(rowLabel);

    const select = document.createElement("select");
    select.className = "voice-settings-select";

    const autoOption = document.createElement("option");
    autoOption.value = "";
    autoOption.textContent = "自動（系統推薦）";
    select.appendChild(autoOption);

    for (const opt of voiceOptions) {
      const optionEl = document.createElement("option");
      optionEl.value = opt.name;
      const genderLabel = opt.gender === "female" ? "女聲" : opt.gender === "male" ? "男聲" : "";
      optionEl.textContent = `${opt.recommended ? "🌟 " : ""}${opt.name}${genderLabel ? `（${genderLabel}）` : ""}`;
      select.appendChild(optionEl);
    }

    select.value = getVoiceOverride(role) ?? "";
    select.addEventListener("change", () => {
      setVoiceOverride(role, select.value === "" ? null : select.value);
    });
    row.appendChild(select);

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "voice-settings-preview-btn";
    previewBtn.textContent = "🔊 試聽";
    previewBtn.addEventListener("click", () => {
      const voiceName = select.value || getVoiceOverride(role);
      if (voiceName) {
        previewVoiceByName(voiceName, sample);
      } else {
        // 選的是「自動」，還沒真的選過語音——就直接唸一句讓使用者聽聽目前自動猜的聲音
        speakEnglish(sample);
      }
    });
    row.appendChild(previewBtn);

    section.appendChild(row);
  }

  return section;
}
```

把這個區塊插進 `renderProfileDetail()` 裡（放在個人小卡跟「重置所有進度紀錄」之間），並且在檔案最上方 import 區塊補上 `getVoiceOverride`、`setVoiceOverride`、`getAvailableEnglishVoices`、`previewVoiceByName`、`VoiceRole`（`speech.ts` 已經有這些新 export）。

### 手機上語音清單可能非同步載入的問題

`speech.ts` 檔案最上方已經有寫 `window.speechSynthesis.onvoiceschanged = refreshVoiceCache`，但如果使用者一打開「個人檔案」頁面時語音清單剛好還沒載入完成（`voiceLab.ts` 的註解也提到手機瀏覽器這個狀況比較明顯），`getAvailableEnglishVoices()` 可能會回傳空陣列，下拉選單就只剩「自動（系統推薦）」一個選項可選。建議比照 `voiceLab.ts` 的 `init()` 做法，在 `main.ts` 也掛一個 `window.speechSynthesis.onvoiceschanged` 監聽，如果使用者當下正停在「個人檔案」頁，語音清單變動時重新呼叫 `render()` 一次，讓下拉選單補上完整清單（不用整頁都重新載入，只要判斷 `screen === "profileDetail"` 時才重繪，避免使用者在別的畫面時被打斷）。

## 4. CSS

新增 `.voice-settings-section`（區塊留白、標題樣式，可以參考現有 `.about-text` 或個人檔案頁其他區塊的間距習慣）、`.voice-settings-hint`（小字淺灰色說明文字，比照 `.vocab-overview-toolbar-hint` 的寫法）、`.voice-settings-row`（label + select + 試聽按鈕橫向排列，手機窄螢幕改上下排列——一樣沿用專案裡已經修過好幾輪的「窄螢幕改直排」既有寫法，不要重新發明）、`.voice-settings-select`、`.voice-settings-preview-btn`（試聽按鈕可以沿用 `.slow-speech-toggle-btn` 類似的圓角按鈕樣式）。

## 5. 驗證

新增 `verify-voice-selection-setting.ts`，比照 `verify-vocab-overview-english-toggle.ts` 的靜態比對手法，至少涵蓋：

1. `speech.ts` 有 `getVoiceOverride`／`setVoiceOverride`／`getAvailableEnglishVoices`／`previewVoiceByName` 四個 export，且 `setVoiceOverride(role, null)` 對應 `localStorage.removeItem`。
2. `pickPreferredVoice`／`pickBennyVoice`／`pickUserDialogueVoice` 三個函式內文都有呼叫 `resolveVoiceOverride(...)` 且是函式最前面就檢查（確認手動選擇的優先權真的蓋過自動偵測，不是加在邏輯後面永遠不會被走到）。
3. `main.ts` 裡 `renderProfileDetail()` 有呼叫新增的語音設定區塊建構函式。
4. 三個 localStorage key 字串（`voiceGeneral.v1`／`voiceBenny.v1`／`voiceUserReply.v1`）都存在且互不相同。

`npm run build` 要過；`npx tsx scripts/verify-voice-selection-setting.ts`（跟其餘 verify-*.ts）都要通過。**這個功能牽涉真實裝置的語音清單差異，沒辦法在沒有喇叭的開發沙盒裡實際聽過確認**，麻煩實機測試至少涵蓋：

- 手機上打開「個人檔案」頁，確認語音清單有正常列出這台手機的語音（不是空的）。
- 選一個語音、按試聽，確認真的用選的那個聲音唸出來。
- 選完之後回到任一主題玩字卡/例句朗讀，確認真的套用了剛剛選的聲音（不是還在用自動偵測的舊聲音）。
- 進 Stage E 會話練習，確認 Benny／使用者回答兩個角色的聲音也分別套用了剛剛選的設定。
- 選單裡選「自動（系統推薦）」，確認能正常清除設定、退回原本的自動偵測邏輯（不會殘留舊的選擇卡住）。
- 清一次瀏覽器資料或換一台裝置，確認因為是裝置層級的 localStorage 設定，去到新裝置會乾淨地回到「自動」，不會出現「選了但沒聲音」的卡住狀態。
