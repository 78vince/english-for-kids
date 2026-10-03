# Handoff Prompt：使用者回饋三項體驗優化（學習積分／慢速語速／單字總覽點開例句）

## 背景

使用者測試回饋了三個獨立的體驗需求，都只需要改 App 端邏輯與畫面，**content 端不用補任何資料**——已經逐一查過現有資料與程式碼確認可行：

1. 想在個人檔案頁看到「積分」這種具體數字，會更有成就感。
2. 發音時比較長／多音節的單字聽不清楚，想要一個「慢速播放」的選項。
3. 單字總覽瀏覽時，想直接點開看某個單字的範例句子，不用進字卡暖身才看得到。

三項都已確認現有資料／程式碼可以直接支撐，細節見下面各節。全部改動只會動到 `app/src/`（`speech.ts`、`main.ts`，建議新增一個 `points.ts`），不用碰 `content/` 或任何 `verify-*.ts`，完成後也不用重跑 content 驗證腳本，只要 `npm run build` 過即可。

---

## 改動一：學習積分（個人檔案頁）

### 資料來源：完全沿用現有統計，不用新增任何追蹤機制

`badgeStats.ts` 的 `getBadgeStats(profileId)` 已經在每次答題／每一輪結束時累計好這些數字：`totalCorrectAnswered`（累計答對題數）、`perfectLevelAchievedCount`（完美關卡次數）、`correctStreakAchievedCount`（連勝十題次數）；`main.ts` 現有的 `countAchievedBadges(profileId)`（約在第 1904 行）已經算得出「目前已解鎖徽章數」。這四個數字加權加總就是積分，不用新增 localStorage key，也不用改任何既有的記錄邏輯。

### 建議新增 `app/src/points.ts`（比照 `playLog.ts`／`playTime.ts`／`badgeStats.ts` 這種各自負責一個統計面向的獨立模組慣例）：

```ts
// 學習積分——純粹是既有統計資料的加權算式，本身不記錄、不新增任何 localStorage 資料，
// 每次呼叫都是即時算出來的（沒有快取，資料量小，效能不是問題）。
import { getBadgeStats } from "./badgeStats";

export const POINTS_PER_CORRECT_ANSWER = 10;
export const POINTS_PER_PERFECT_LEVEL = 50;
export const POINTS_PER_CORRECT_STREAK = 30;
export const POINTS_PER_BADGE = 100;

/** achievedBadgeCount 由呼叫端傳入（main.ts 的 countAchievedBadges() 已經算好，避免重算一次）。 */
export function computeLearningPoints(profileId: string, achievedBadgeCount: number): number {
  const stats = getBadgeStats(profileId);
  return (
    stats.totalCorrectAnswered * POINTS_PER_CORRECT_ANSWER +
    stats.perfectLevelAchievedCount * POINTS_PER_PERFECT_LEVEL +
    stats.correctStreakAchievedCount * POINTS_PER_CORRECT_STREAK +
    achievedBadgeCount * POINTS_PER_BADGE
  );
}
```

權重是建議值（每題 10 分／完美關卡 50 分／連勝 30 分／每個徽章 100 分），如果實際玩起來覺得數字漲太快或太慢，之後只要調整這四個常數即可，不影響任何資料結構。

### 畫面：`renderProfileAchievementsGrid()`（`main.ts` 約第 1922 行）

目前這個函式已經算好 `achievedBadgeCount`，只要在既有六格卡片**上方**插入一個獨立的「學習積分」大數字區塊，跟六格卡片的視覺語言區隔開（更大、更醒目，像是「總分」），不要塞成第七張一樣大小的卡片：

```ts
const totalPoints = computeLearningPoints(profileId, achievedBadgeCount);
```

```html
<div class="learning-points-hero">
  <span class="learning-points-value">${totalPoints}</span>
  <span class="learning-points-label">學習積分</span>
</div>
```

CSS 新增 `.learning-points-hero`／`.learning-points-value`／`.learning-points-label`，放在 `.profile-stats-section` 裡、`.profile-stats-grid` 之前即可，樣式可以參考 `.stage-banner`（大字級、品牌色底）或直接用比六格卡片大一號的字級呈現，細節交給實作時決定。

---

## 改動二：慢速語速切換

### 現況：`app/src/speech.ts` 目前 `speakEnglish()`／`speakPassage()` 都寫死 `utterance.rate = 0.9`

呼叫 `speakEnglish()`／`speakPassage()` 的地方在 `main.ts` 裡有十幾處（字卡暖身、單字配對、句子排序、填空、選字、短文點字、Stage D 綜合關卡…），**不建議逐一在每個呼叫點旁邊加慢速鍵**，改成在 `speech.ts` 內部加一個全域「慢速模式」開關最省事：只要改 `speech.ts` 一個檔案的內部邏輯，所有既有呼叫點完全不用動。

### `speech.ts` 改動：

```ts
const NORMAL_RATE = 0.9;
const SLOW_RATE = 0.6; // 明顯放慢但不到逐字唸的程度，可依實際聽感微調

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
```

然後把 `speakEnglish()` 跟 `speakPassage()` 裡兩處 `utterance.rate = 0.9;` 都改成 `utterance.rate = currentRate();`，其餘邏輯不動。

### UI：加在 `stageHeader()`（`main.ts` 約第 837 行，所有題型畫面＋單字總覽共用的橫幅）

這是唯一需要碰 UI 的地方，因為 `stageHeader()` 是幾乎所有會播放語音的畫面共用的橫幅（注意：首頁／個人檔案／成就徽章等用 `appendShell()` 的瀏覽性頁面本來就不會播放語音，不用加）。目前 `stageHeader()` 的結構是 `textWrap`（標題＋進度）＋ `backBtn` 兩個 flex 子項、`justify-content: space-between`。建議把慢速切換鈕跟返回鍵包成同一組「右側動作區」，維持兩欄排版不變：

```ts
function stageHeader(title: string, progressText: string): void {
  const header = document.createElement("header");
  header.className = "stage-banner";

  const textWrap = document.createElement("div");
  textWrap.className = "stage-banner-text";
  // ...標題／進度文字，維持原樣...
  header.appendChild(textWrap);

  const actions = document.createElement("div");
  actions.className = "stage-banner-actions";

  const slowToggleBtn = document.createElement("button");
  slowToggleBtn.type = "button";
  slowToggleBtn.className = "slow-speech-toggle-btn" + (isSlowSpeechEnabled() ? " active" : "");
  slowToggleBtn.setAttribute("aria-pressed", String(isSlowSpeechEnabled()));
  slowToggleBtn.textContent = isSlowSpeechEnabled() ? "🐢 慢速中" : "🐢 慢速";
  slowToggleBtn.setAttribute("aria-label", "切換慢速發音");
  slowToggleBtn.addEventListener("click", () => {
    setSlowSpeechEnabled(!isSlowSpeechEnabled());
    render(); // 重新渲染目前畫面，讓按鈕文字/active 樣式立刻反映新狀態
  });
  actions.appendChild(slowToggleBtn);

  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← 返回選單";
  backBtn.addEventListener("click", goToMenu);
  actions.appendChild(backBtn);

  header.appendChild(actions);
  app!.appendChild(header);
}
```

CSS：`.stage-banner-actions` 用 `display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0;` 包住兩顆按鈕（原本 `.stage-banner .back-btn` 是 `position: static` 直接排在 flex 列裡，包一層外層 div 不影響它原本的樣式，只要把 `.stage-banner .back-btn` 的樣式選擇器同時涵蓋新的巢狀結構）；`.slow-speech-toggle-btn` 樣式可以直接比照 `.stage-banner .back-btn`（同樣是深底配淺色邊框文字），`.active` 狀態換成品牌強調色底，讓使用者一眼看出目前開著。

`renderVocabOverview()`（單字總覽）也是呼叫 `stageHeader()`，所以這個畫面會自動一起拿到慢速切換鈕，不用另外處理。

> 補充：如果之後想做成「每個使用者各自記住自己的慢速偏好」，只要把 `SLOW_MODE_STORAGE_KEY` 改成跟其他模組一樣依 `profileId` 組 key、`isSlowSpeechEnabled()`／`setSlowSpeechEnabled()` 改成收 `profileId` 參數即可，目前先做成裝置層級的全域開關是刻意簡化，不是遺漏。

---

## 改動三：單字總覽點開看例句

### 資料已經 100% 齊全，不用補內容

已經用腳本核對過：全站 43 個主題、897 個單字，**每一個都已經有** `vocab.example_sentence`（英文＋中文）。`main.ts` 裡 Stage A 字卡暖身（約第 2302 行）那段程式碼的註解寫著「目前只有 Family／Colors／Animals & insects 補了」——這行註解已經過時了（現在全部主題都有），可以順手更新或刪掉，不影響邏輯。

### 改 `buildVocabOverviewRow()`（`main.ts` 約第 1547 行）

這個函式是「單字總覽」（`renderVocabOverview()`）與「收藏清單」（`renderFavorites()`）共用的同一份程式碼，改這裡兩個畫面會同步生效，不用分別處理。現有的字卡暖身已經有現成的例句呈現樣式可以直接沿用（`.flashcard-example`／`.flashcard-example-row`／`.flashcard-example-en`／`.flashcard-example-zh`／`.flashcard-replay-btn`，`main.ts` 約第 2304-2325 行），做法：

1. 在 `.vocab-overview-info` 跟 `.vocab-overview-actions` 之外，新增一顆「展開例句」按鈕（例如文字「例句 ▾」，展開後變「例句 ▴」），點擊切換一個例句面板的顯示/隱藏（用一個 boolean 變數 + 重新渲染該列，或用 CSS `hidden` 屬性 toggle 都可以，不用整頁重新 render）。
2. 展開的面板內容直接沿用字卡暖身那段程式碼的結構（英文例句＋專屬 🔊 播放鍵＋中文翻譯），可以抽成一個共用的小函式（例如 `buildExampleSentenceBlock(vocab.example_sentence)`）讓字卡暖身跟單字總覽都呼叫同一份，避免兩處各寫一次幾乎一樣的 DOM。
3. 因為型別上 `example_sentence` 仍是選填欄位（`Vocab.example_sentence?: {...} | null`），展開按鈕出現的條件維持 `if (vocab.example_sentence)` 防呆判斷，不要假設一定有值——即使目前資料 100% 齊全，這樣寫比較保險，之後如果新增主題忘記補這個欄位也不會炸畫面，只是那個字沒有展開按鈕而已。

CSS 新增：展開按鈕可以用跟 `.flashcard-replay-btn` 類似的小型 icon 按鈕樣式，展開面板可以直接重用 `.flashcard-example` 那一組 class（視覺上會跟字卡暖身的例句框一致，也省了重新設計一組樣式），或依畫面需求微調。

---

## 不需要改的地方

- `content/` 底下完全不用動，三項都是純畫面/邏輯改動。
- 不用改任何 `verify-*.ts`、不用重新產生 `dashboard.html`／`demo-standalone.html`／`content-review.html`（那三個 script 只反映 `content/` 的資料，這次沒有動 content）。
- `content/badges/badges.json` 不用改，積分是獨立於徽章系統之外的另一套呈現，不影響徽章判斷邏輯。
- 三項都不影響任何遊戲邏輯（`MatchingGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`FlashcardGame`／`buildCapstoneQuestions`），也不影響成效追蹤（`progress.ts`）或徽章統計（`badgeStats.ts`）的寫入邏輯——積分只是「讀」這些既有資料，不會「寫」新的東西進去。

## 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 手動用 `npm run dev` 或 `app/demo-standalone.html` 實際玩過一輪，確認：個人檔案頁看得到積分數字且答題後會增加；題型畫面／單字總覽點「🐢 慢速」發音明顯變慢，且切換狀態離開畫面再回來還記得（重新整理頁面也要記得，因為存在 localStorage）；單字總覽／收藏清單點開任一個字都看得到例句並能播放。
- 因為沒有動 `content/`，不需要重跑 `verify-*.ts` 或任何 content 相關 build script。

## 完成後

在 `HANDOFF.md` 補一個新的 `### 9.x` 條目（先重新 grep 目前最新的 `### 9.` 編號），記錄這三項改動＋這份 handoff prompt 已執行完成，比照先前 handoff 執行完成後的記錄慣例即可。
