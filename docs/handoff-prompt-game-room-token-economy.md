# Handoff：「遊戲室」入口＋遊戲代幣消費機制（先做 1 款打樣：翻牌配對）

## 背景與決策過程

使用者提議在 App 裡加一個「遊戲室」，用學習累積的點數去玩裡面的小遊戲，遊戲清單要能讓管理者自己新增/擴充/移除，每款遊戲消費的點數也不一樣。評估後跟使用者確認了幾個關鍵設計方向，這份 handoff 就是照這些方向寫的，動手前務必先讀完這一段背景，不要只看下面的程式碼片段就直接改。

**重要發現：現有「學習積分」不能直接拿來當消費貨幣。** `app/src/points.ts` 的 `computeLearningPoints()` 是即時算出來的展示用數字（答對題數／完美關卡／連勝／徽章數加權加總），**沒有存檔、沒有餘額**，每次呼叫都是重新算一次，而且顯示在個人檔案頁的定位是「只會往上加的成就榮譽數字」（`renderProfileAchievementsGrid()` 裡的 `learning-points-hero`）。如果直接拿它來扣款消費，下次重新整理頁面數字又會照公式算回來，扣款無效；而且這個數字被扣減，觀感上容易變成「退步了」的負面訊號，跟這個專案一貫「不用負面文字強調表現不好」的調性衝突（見 README.md 開頭的專案定位說明）。

**因此決定：另外做一套完全獨立、真的有存檔餘額的「遊戲代幣」，跟「學習積分」脫鉤。** 學習積分維持現狀不動，繼續當展示用的成就數字；遊戲代幣是專門給遊戲室用的、可以賺可以花的貨幣。

使用者也確認了兩個關鍵範圍決定：

1. **第一階段只做 1 款遊戲打樣**（翻牌配對／Memory Match），先把「賺代幣→花代幣→玩遊戲」這一整套機制跑通、實際測過感覺對不對，再決定要不要擴充更多款遊戲。**這份 handoff 只要求做這一款，不要因為看到「可擴充」的架構描述就順便多做幾款遊戲。**
2. **全部遊戲都需要代幣才能玩**（不是「保留一款免費遊戲」那個方向），代幣不夠時要用鼓勵性文案處理（例如「再多學一點點就可以囉！」），絕對不要出現「餘額不足」「點數不夠」這種商業感/責備感的字眼。

## 1. 新增內容檔：`content/games/games.json`（已經建立好了）

我已經直接建好這個內容檔跟對應的 `content/schema/game.schema.json`，格式如下（App 端不用改這兩個檔案，直接讀取使用）：

```json
[
  {
    "id": "memory_match",
    "name": "翻牌配對",
    "description": "翻開卡片找出英文單字跟中文意思的配對，考驗記憶力，也是複習單字的好機會。",
    "icon_placeholder": "🃏",
    "cost": 20,
    "status": "active",
    "order": 1
  }
]
```

之後要新增/下架遊戲，管理者（也就是我，透過 content 端）之後只要編輯這份 JSON 就好——但要提醒清楚：**這份清單只能控制「上架哪幾款、消費多少代幣、排列順序、顯示文字」，沒辦法無中生有生出遊戲的實際玩法**。每一款新遊戲的互動邏輯都要另外寫一支對應的引擎模組（`id` 對應到模組檔名，例如 `memory_match` → `app/src/games/memoryMatchGame.ts`），這件事要在 App 端跟未來的我都要有共識，避免以為之後「隨便改 JSON 就能長出新遊戲」。

比照 `content/badges/badges.json` 走 `import.meta.glob` 或直接 `import` 的既有做法，在 `app/src/content.ts` 裡新增讀取這份檔案、匯出 `GAMES` 陣列（型別定義加進 `app/src/types.ts`，對照 `game.schema.json` 的欄位）。

## 2. 新增遊戲代幣錢包：`app/src/gameTokens.ts`

跟 `progress.ts`／`playTime.ts` 同一套模式：per-profile、存在 localStorage、容錯處理跟其他模組一致。

```ts
// 遊戲代幣——遊戲室的消費貨幣，跟 points.ts 的「學習積分」是兩個完全獨立的數字：
// 學習積分是即時算出來、只會往上加的成就展示數字；遊戲代幣是這裡真正存檔的餘額，
// 可以賺、也可以花在遊戲室裡玩遊戲，兩者刻意不互通、不共用同一個數字，
// 避免「玩遊戲花掉代幣」讓學習成就的數字被牽連著變少（見 handoff 開頭的設計背景）。

const TOKENS_STORAGE_KEY_PREFIX = "englishForKids.gameTokens.v1";

function storageKeyForProfile(profileId: string): string {
  return `${TOKENS_STORAGE_KEY_PREFIX}.${profileId}`;
}

export function getTokenBalance(profileId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(storageKeyForProfile(profileId));
    const n = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeBalance(profileId: string, balance: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKeyForProfile(profileId), String(Math.max(0, balance)));
  } catch {
    // 容量滿了或無痕模式擋寫入，安靜忽略，跟其餘模組一致
  }
}

/** 每完成一輪任何題型（不限主題、不限題型、不要求正確率）都呼叫這個函式賺代幣，
 * 金額固定不看正確率——第一階段刻意用最簡單、最容易跟小朋友解釋清楚的規則
 * 「每破一關就有 5 個代幣」，不要一開始就做複雜的加權公式，之後真的覺得
 * 步調太快/太慢，再回來調整這個常數就好。 */
export const TOKENS_EARNED_PER_ROUND = 5;

export function earnTokens(profileId: string, amount: number): number {
  const newBalance = getTokenBalance(profileId) + amount;
  writeBalance(profileId, newBalance);
  return newBalance;
}

/** 回傳 true 代表扣款成功（餘額足夠）；false 代表餘額不夠，呼叫端不能真的讓使用者
 * 進遊戲，畫面上要用鼓勵文案處理，不能出現「餘額不足」這種字眼。 */
export function spendTokens(profileId: string, amount: number): boolean {
  const balance = getTokenBalance(profileId);
  if (balance < amount) return false;
  writeBalance(profileId, balance - amount);
  return true;
}
```

## 3. 掛上賺代幣的事件：`main.ts` 的 `finalizeRoundCompletion()`

這個函式（約第 4428-4450 行）是**所有題型完成一輪的共同結算點**（Stage A～E 全部題型都會呼叫到），是掛「賺代幣」邏輯最乾淨的地方，不用在每個題型各自加一次：

```ts
function finalizeRoundCompletion(
  stageKey: StageKeyForBadges,
  correctCount: number,
  wrongCount: number,
  hintUsed: boolean
): void {
  const profileId = activeProfile!.id;
  const before = snapshotBadgeAchievements(profileId);

  recordStageCompletion(profileId, currentTopic.fileKey, stageKey, correctCount, wrongCount);
  recordPlayToday(profileId);
  recordElapsedPlayTime();
  recordRoundCompletion(profileId, { wrongCount, hintUsed });
  syncStreakBadgesNow(profileId);
  earnTokens(profileId, TOKENS_EARNED_PER_ROUND); // 新增：每完成一輪就賺代幣

  // ...其餘不變
}
```

記得在檔案最上方 import 區塊補上 `earnTokens`、`TOKENS_EARNED_PER_ROUND`（從新的 `gameTokens.ts`）。

**刻意的設計決定：玩遊戲室的遊戲本身不會再賺代幣。** 代幣只從「認真學習」這個方向賺，遊戲室是花代幣去的「休息/獎勵」，不是另一個賺代幣的迴圈——避免變成「一直玩遊戲刷代幣，再拿去玩更多遊戲」的沒意義迴圈，讓代幣真的跟「有在學習」掛勾。

## 4. 新增畫面：遊戲室入口＋翻牌配對遊戲

### 4.1 導覽列新增「遊戲室」分頁

`NAV_ITEMS`（main.ts 約第 1260-1267 行）目前是：

```ts
const NAV_ITEMS: NavItemConfig[] = [
  { key: "home", icon: NAV_ICONS.home, label: "首頁", onSelect: goToTopicSelect },
  { key: "stats", icon: NAV_ICONS.stats, label: "挑戰紀錄", onSelect: goToStats },
  { key: "badges", icon: NAV_ICONS.badges, label: "成就徽章", onSelect: goToBadges },
  { key: "favorites", icon: NAV_ICONS.favorites, label: "收藏清單", onSelect: goToFavorites },
  { key: "profile", icon: NAV_ICONS.profile, label: "個人檔案", onSelect: goToProfileDetail },
  { key: "about", icon: NAV_ICONS.about, label: "關於本站", onSelect: goToAbout },
];
```

在「收藏清單」跟「個人檔案」之間插入一個新項目（順序上放在跟學習/收藏比較近的位置，比「關於本站」這種次要功能更顯眼）：

```ts
{ key: "gameRoom", icon: NAV_ICONS.gameRoom, label: "遊戲室", onSelect: goToGameRoom },
```

`NAV_ICONS` 物件（跟其餘圖示定義在一起）新增一個 `gameRoom` 的 SVG，維持跟現有圖示同一套「單色線條風格」（可以用簡單的遊戲手把/骰子/拼圖圖案，具體 path 由你決定，只要跟現有圖示的線條粗細、視覺重量一致即可）。導覽列本身已經有動態量測寬度自動切換緊湊模式的機制（`updateNavCompactState()`），多一個項目不用擔心手機版塞不下的問題，這個機制已經處理過了。

`Screen` type（約第 279 行附近）新增 `"gameRoom"` 與 `"memoryMatch"` 兩個畫面值；router（約第 4732-4747 行 `renderScreen()` 的 if-else 鏈）新增對應兩行：

```ts
else if (screen === "gameRoom") renderGameRoom();
else if (screen === "memoryMatch") renderMemoryMatch();
```

### 4.2 `renderGameRoom()`：遊戲室清單畫面

比照 `renderBadges()`／`renderVocabOverview()` 的既有畫面結構（`stageHeader()` 橫幅 + 清單），大致邏輯：

```ts
function renderGameRoom(): void {
  const profileId = activeProfile!.id;
  const balance = getTokenBalance(profileId);

  stageHeader("遊戲室", `目前有 ${balance} 個遊戲代幣，認真學習就能賺代幣，來玩點小遊戲放鬆一下吧！`);

  const tokenHero = document.createElement("div");
  tokenHero.className = "game-tokens-hero"; // 樣式比照 learning-points-hero，換一個顏色區分兩者
  tokenHero.innerHTML = `
    <span class="game-tokens-value">🪙 ${balance}</span>
    <span class="game-tokens-label">遊戲代幣</span>
  `;
  app!.appendChild(tokenHero);

  const list = document.createElement("div");
  list.className = "game-room-list";

  for (const game of GAMES.filter((g) => g.status !== "disabled").sort((a, b) => a.order - b.order)) {
    const card = document.createElement("div");
    card.className = "game-room-card";

    const affordable = balance >= game.cost;
    const comingSoon = game.status === "coming_soon";

    card.innerHTML = `
      <div class="game-room-card-icon">${game.icon_placeholder}</div>
      <div class="game-room-card-body">
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <span class="game-room-card-cost">🪙 ${game.cost} 代幣</span>
      </div>
    `;

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "game-room-play-btn";

    if (comingSoon) {
      actionBtn.textContent = "即將推出";
      actionBtn.disabled = true;
    } else if (affordable) {
      actionBtn.textContent = "開始遊戲";
      actionBtn.addEventListener("click", () => confirmAndPlayGame(game));
    } else {
      // 代幣不夠：鼓勵文案，不要用「餘額不足」這種字眼
      const missing = game.cost - balance;
      actionBtn.textContent = `再賺 ${missing} 個代幣就可以玩囉！`;
      actionBtn.className += " game-room-play-btn--locked";
      actionBtn.disabled = true;
    }

    card.appendChild(actionBtn);
    list.appendChild(card);
  }

  app!.appendChild(list);
}

/** 點「開始遊戲」先跳一個確認彈窗，避免不小心誤觸就扣款——比照專案裡其餘會扣資源/
 * 不可逆操作的既有 .modal-overlay／.modal-card 彈窗寫法（例如刪除使用者、重置進度）。 */
function confirmAndPlayGame(game: GameConfig): void {
  // 顯示 modal：「要用 20 個代幣玩「翻牌配對」嗎？」確認後才真的呼叫 spendTokens()，
  // 扣款成功才 goToMemoryMatch()；理論上這裡不該扣款失敗（按鈕在餘額不夠時已經是
  // disabled 狀態），但還是要處理 spendTokens() 回傳 false 的情況，不要假設一定成功。
}
```

### 4.3 翻牌配對遊戲：`app/src/games/memoryMatchGame.ts`

比照專案裡其餘題型引擎（`MatchingGame`／`OrderingGame`／`ConversationGame`）的既有模式：**遊戲邏輯寫成一個不依賴 DOM 的 class，可以在 plain tsx 底下被 verify 腳本直接 `new` 出來測試**，畫面渲染另外在 `main.ts` 處理。

玩法設計：不綁定特定主題（因為遊戲室是跟主題平行的功能，使用者可能還沒選主題就從導覽列直接進來），從**全部主題的 vocab 資料庫**（`content.ts` 已經有的完整 vocab 清單）隨機抽 6 組英文/中文詞義配對，共 12 張卡片，打散排列；使用者一次翻兩張，配對成功就留在檯面上標記已配對，配對失敗兩張都蓋回去；全部配對完成即算破關。

```ts
export interface MemoryCard {
  id: string; // 每組 pair 兩張卡片各自的唯一 id
  pairId: string; // 同一組配對的兩張卡片共用同一個 pairId
  display: string; // 卡片正面顯示的文字（英文或中文）
  isFlipped: boolean;
  isMatched: boolean;
}

export class MemoryMatchGame {
  cards: MemoryCard[] = [];
  private flippedIds: string[] = [];
  moveCount = 0;

  onChange: () => void = () => {};
  onComplete: () => void = () => {};

  constructor(pairs: { en: string; zh: string }[]) {
    // 把每組 {en, zh} 拆成兩張卡片（一張顯示英文、一張顯示中文），
    // 用同一個 pairId 標記是同一組，打散排列（Fisher-Yates 洗牌，避免固定規律讓小朋友用位置背答案）
  }

  /** 翻一張卡片。已經翻開兩張還沒判定完成之前，忽略新的翻牌（避免連續快速點擊搞亂狀態）。 */
  flip(cardId: string): void {
    // 邏輯：翻開的卡片加進 flippedIds；滿兩張時比對 pairId 是否相同，
    // 相同→兩張都標記 isMatched=true；不同→用 setTimeout 延遲一小段時間讓使用者看清楚，
    // 再把兩張都翻回 isFlipped=false；moveCount 累加；全部 isMatched 時觸發 onComplete()。
  }
}
```

畫面渲染（`renderMemoryMatch()`）比照其餘題型畫面：`stageHeader()` 橫幅（含「返回遊戲室」而不是「返回選單」，因為這個遊戲不屬於任何主題）＋卡片格狀排列（CSS Grid，正面蓋牌用問號或遊戲圖示、翻開後顯示英文/中文文字）；完成畫面比照其餘題型的「恭喜」結算卡片樣式，文案走純鼓勵路線（例如「太厲害了，全部配對成功！」），**這個遊戲純粹是休閒獎勵，不需要記錄到 `progress.ts`／不影響任何徽章或積分**，完成後只要一個「再玩一次」（重新抽新的 6 組配對，但要再次扣代幣，不是免費重玩）跟「返回遊戲室」兩個按鈕。

## 5. CSS

新增 `.game-tokens-hero`（比照 `.learning-points-hero`，換一個跟學習積分不同的主題色，避免使用者混淆這是同一個數字）、`.game-room-list`／`.game-room-card`／`.game-room-card-cost`／`.game-room-play-btn`／`.game-room-play-btn--locked`（鎖定狀態的按鈕用比較溫和的顏色，不要用警示紅色，畢竟這不是錯誤，只是還沒存夠）、`.memory-match-grid`／`.memory-match-card`（含翻牌動畫，CSS `transform: rotateY()` 搭配 `transition` 做簡單翻牌效果即可，不用引入額外動畫函式庫）。手機版排版一樣要注意，卡片格數建議手機版維持每排 3 張（12 張卡片剛好 4 排），確認窄螢幕不會被擠壓变形。

## 6. 驗證

新增兩支驗證腳本：

1. **`verify-game-tokens-logic.ts`**（比照 `verify-progress-logic.ts` 的做法，實際 `import` 並呼叫 `gameTokens.ts` 的函式）：
   - 初始餘額為 0。
   - `earnTokens()` 正確累加，回傳值等於新餘額。
   - `spendTokens()` 餘額足夠時扣款成功並回傳 `true`；餘額不夠時回傳 `false` 且**不能真的扣款**（扣款失敗後餘額要維持不變，不能出現負數）。
   - 不同 profileId 的餘額互相獨立（跟 `progress.ts` 的多使用者隔離邏輯一致）。
   - `finalizeRoundCompletion()` 有呼叫 `earnTokens(profileId, TOKENS_EARNED_PER_ROUND)`（可以用類似 `verify-unit-completion-badges.ts` 對 `main.ts` 原始碼做字串靜態比對的手法確認接線）。

2. **`verify-memory-match-logic.ts`**（比照 `verify-matching-logic.ts`／`verify-ordering-logic.ts` 的做法）：
   - 建構子正確把傳入的配對拆成兩倍數量的卡片，且每組 pairId 只出現在剛好兩張卡片上。
   - 翻兩張配對成功的卡片，兩張都變成 `isMatched: true`。
   - 翻兩張配對失敗的卡片，延遲後兩張都恢復 `isFlipped: false`（且都還是 `isMatched: false`）。
   - 已經翻開兩張、還在判定中時，第三次 `flip()` 呼叫要被忽略。
   - 全部配對完成時觸發 `onComplete()`。

`npm run build` 要過；新的兩支跟其餘既有 `verify-*.ts` 全部要通過。因為開發沙盒沒有喇叭/瀏覽器，翻牌動畫的實際視覺效果、手機版格線排列，麻煩用 `app/demo-standalone.html` 或實機確認一次。

## 7. 這次刻意不做的事（留給之後決定，不要自己延伸做掉）

- **只做翻牌配對這一款**，不要因為架構做成「可擴充」就順手多加其他遊戲——使用者明確說要先驗證完整套機制，再決定後續方向。
- **不做「遊戲代幣兌換學習積分」或反過來的機制**——兩套數字刻意保持獨立，不要自作主張加互轉功能。
- **不做遊戲室內的排行榜或分享功能**——這個專案一貫刻意不做任何比較性質的功能。
- **不用調整 `TOKENS_EARNED_PER_ROUND`／遊戲代幣消費（20）這兩個數字的實際手感**——先照文件裡給的數字上線，之後有實際使用回饋（例如小朋友覺得賺太慢或太快）再回頭調整，不要自己先猜一個「感覺比較好」的數字。
