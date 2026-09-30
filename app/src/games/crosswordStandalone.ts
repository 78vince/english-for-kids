// 填字遊戲——獨立打包的遊戲頁面（games/crossword.html 的進入點），比照翻牌配對
// （memoryMatchStandalone.ts）的既有架構：獨立 iframe 頁面＋gameBridge.ts postMessage
// 橋接，從一開始就照這個架構做，不用像翻牌配對一樣事後遷移。見
// docs/handoff-prompt-crossword-game.md 的背景說明。
//
// 這支頁面負責：抽一個填字關卡、畫網格／字母區／提示文字、用 pointer event 自己實作
// 拖曳互動（不用原生 HTML5 Drag and Drop API——那套 API 在手機瀏覽器上支援度不好，
// 這個 App 主要使用情境是手機，pointer event 手機/電腦都相容）、音效掛勾、破關後把
// 星等透過 gameBridge 回報給 parent。
//
// 跟翻牌配對一樣，這支頁面刻意「完全不知道代幣／最高紀錄怎麼存」這些概念：不 import
// gameTokens.ts／gameHighScores.ts。「再玩一次」按鈕只會 postMessage 一個 requestReplay，
// parent 扣款成功才會回 replayApproved；破關時只會把算好的星等數字用 "complete" 訊息
// 的 stars 欄位送給 parent，parent 收到才會把星等存進最高紀錄——持久化狀態一律只存在
// parent，跟代幣扣款走同一套架構原則（見 gameBridge.ts 的協定說明）。

import { CrosswordGame, LEVEL_COUNT, type CrosswordTrayTile } from "./crosswordGame";
import { COIN_ICON, STAR_EMPTY_ICON, STAR_FILLED_ICON } from "./gameIcons";
import { CROSSWORDS, GAMES } from "../content";
import type { Crossword } from "../types";
import { playCorrectSound, playRoundCompleteSound, playWrongSound } from "../sound";
import { speakEnglish } from "../speech";
import { GAME_BRIDGE_CHANNEL, type GameToParentMessage, type ParentToGameMessage } from "../gameBridge";

const app = document.querySelector<HTMLDivElement>("#crossword-app");
if (!app) {
  throw new Error("找不到 #crossword-app 掛載點");
}

const crosswordConfig = GAMES.find((g) => g.id === "crossword");
const crosswordCost = crosswordConfig?.cost ?? 0;

/** 隨機抽一個填字關卡——目前 content 只有 1 個打樣關卡（居家空間），之後 content 端
 * 擴充更多主題/關卡時，這裡不用改，CROSSWORDS 會自動含入新檔案。 */
function pickCrossword(): Crossword {
  return CROSSWORDS[Math.floor(Math.random() * CROSSWORDS.length)];
}

let crossword: Crossword = pickCrossword();
let game: CrosswordGame = new CrosswordGame(crossword);

let lastStars = 0;

// 跟 crosswordStandalone.css 的 `.crossword-grid { gap: 4px; }` 保持同一個數字——
// 2026-09-30 使用者回饋排查「答題區還是超出畫面」時發現，先前用 JS 算格子容器的
// width／height 只乘了「格子邊長 × 格數」，漏算了格子之間的間距（gap），導致算出來的
// 容器高度比實際排版需要的高度少了 `gap × (格數-1)`，最後一列格子因此超出容器自己
// 宣告的高度，被 `.crossword-board` 的 overflow:hidden 切掉一截——這裡把 gap 抽成
// 常數，跟 CSS 那份數字放在一起維護，兩邊都要改的時候不容易漏改其中一邊。
const GRID_GAP_PX = 4;

// 2026-09-30 使用者回饋：答對、完整拼出一個單字時，要用紅框整個圈起來＋唸出這個單字，
// 讓小朋友不用等到整關破完才有「這個字對了」的明確回饋。用單字在 crossword.words 裡的
// index 記錄「這一關已經唸過的單字」，避免同一關裡因為整段重繪（render()）被重複觸發
// 語音；level（或整個 game 物件）換了就要清空重算，見 render() 開頭的判斷。
let announcedWordIndexesForLevel = new Set<number>();
let lastTrackedLevel = -1;

/** 算出某個單字（依 crossword.words 的 index）佔用的座標清單，跟 crosswordGame.ts
 * 內部 buildCells()／wordCellKeys 是同一套算法，這裡是渲染端自己需要知道「這個單字有哪些
 * 格子」才能畫紅框，故意不從引擎另外開一個 API 出來（純畫面呈現用途，不影響遊戲邏輯）。 */
function wordCoords(word: Crossword["words"][number]): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  for (let i = 0; i < word.en.length; i++) {
    const row = word.direction === "down" ? word.row + i : word.row;
    const col = word.direction === "across" ? word.col + i : word.col;
    coords.push([row, col]);
  }
  return coords;
}

function render(): void {
  app!.innerHTML = "";

  // 2026-09-30 使用者回饋：標題不用圖示，文字改成「提示：」開頭（crossword.title 本身
  // 維持純主題名稱，例如「居家空間」，不用因為這裡加字首就去改 content 端的資料）。
  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>提示：${crossword.title}</h1>`;
  app!.appendChild(header);

  const progressP = document.createElement("p");
  progressP.className = "progress";
  app!.appendChild(progressP);

  function syncProgress(): void {
    if (game.phase === "levelComplete") {
      progressP.textContent = `🎉 過關！準備進入第 ${game.level + 1} / ${LEVEL_COUNT} 關…`;
    } else if (game.phase === "complete") {
      progressP.textContent = "三關全部破完，太厲害了！";
    } else {
      progressP.textContent = `第 ${game.level} / ${LEVEL_COUNT} 關 —— 拖曳字母填滿空格`;
    }
  }

  const board = document.createElement("div");
  board.className = "crossword-board";

  const grid = document.createElement("div");
  grid.className = "crossword-grid";
  // 2026-09-30 使用者回饋：改成 5 欄×8 列這種窄長排版之後，畫面往下捲才看得到剩下的
  // 格子。第一次嘗試用 CSS `aspect-ratio` 搭配 `max-height` 讓瀏覽器自動縮放（原理
  // 跟圖片 object-fit: contain 一樣）——但那個技巧只對「替換元素」（img/video）完整
  // 支援，一般 <div> 搭配 CSS Grid 的 1fr 軌道＋格子自己的 aspect-ratio:1/1，在容器被
  // max-height 夾小之後，格子本身的「最小尺寸預設等於它想要的正方形大小」（CSS Grid／
  // Flexbox 的 min-size:auto 特性）會拒絕縮到比軌道更小，內容因此撐爆容器，被
  // `.crossword-board` 的 overflow:hidden 硬生生切掉一截，比原本要捲動還更糟（整段
  // 內容直接消失看不到，捲動至少还看得到）。
  // 改用底下 fitGridToViewport()：先給一個保守的預設格子大小（用實際欄數/列數換算的
  // px 數字，不是 1fr／aspect-ratio 這種依賴瀏覽器自動運算的相對單位），等整頁所有
  // 區塊（標題、進度文字、字母區、提示文字、頁尾按鈕）都排版完成之後，直接量測整頁
  // 實際高度跟這個 iframe 頁面真正可視高度的落差，超出的話用量出來的落差反推該縮小
  // 多少格子尺寸，寫回明確的 px 數字（不是比例）——這樣每個格子最終呈現的尺寸是我們
  // 自己精準算出來的，不會有瀏覽器排版演算法帶來的意外落差。
  const initialCellPx = Math.max(24, Math.min(84, Math.floor(400 / crossword.gridWidth)));
  let currentCellPx = initialCellPx;
  /** 依目前的 cellPx 設定 grid 的欄寬/列高＋容器本身的 width／height——容器尺寸一定要
   * 把格子間的 gap 也算進去（不是單純「格子邊長 × 格數」），不然容器會比實際排版需要的
   * 高度／寬度少了 `gap × (格數-1)`，最後一列/欄格子會超出容器自己宣告的尺寸。 */
  function applyGridSize(cellPx: number): void {
    currentCellPx = cellPx;
    grid.style.gridTemplateColumns = `repeat(${crossword.gridWidth}, ${cellPx}px)`;
    grid.style.gridTemplateRows = `repeat(${crossword.gridHeight}, ${cellPx}px)`;
    grid.style.width = `${cellPx * crossword.gridWidth + GRID_GAP_PX * (crossword.gridWidth - 1)}px`;
    grid.style.height = `${cellPx * crossword.gridHeight + GRID_GAP_PX * (crossword.gridHeight - 1)}px`;
  }
  applyGridSize(initialCellPx);

  // 換到新的一關（或整個 game 物件重建，例如「再玩一次」）時，重新開始累計「這一關已經
  // 唸過的單字」——不然舊關卡已經唸過的單字 index 會誤判成這一關也唸過，導致新關卡裡
  // 明明剛答完的單字卻不會唸。
  if (game.level !== lastTrackedLevel) {
    announcedWordIndexesForLevel = new Set();
    lastTrackedLevel = game.level;
  }

  // 2026-09-30 使用者回饋：整個單字答對後要紅框圈起來＋唸出來。只有「這個單字本來至少
  // 有一格是空格」才算數（單字從頭到尾都是已知格，不是使用者拼出來的，不用觸發語音，
  // 但畫面上一樣可以維持既有的「已知格」樣式，不需要額外標記）。
  //
  // 2026-09-30 再次使用者回饋：紅框要「整個單字一個框」，不是「每個字母自己一個框」。
  // 原本的做法是幫單字裡每一格各自加上 `.crossword-cell--word-complete` 這個 class，
  // 讓每一格自己畫一圈紅框——相鄰格子的紅框疊在一起，看起來像一個大框，但因為是
  // 「每格各自的框」，格子之間還是會看到多餘的疊線、跟使用者要的「一個乾淨的框圈住
  // 整個單字」不一樣。改法：不再幫個別格子加樣式，而是額外畫一個絕對定位的
  // `.crossword-word-complete-box` 覆蓋在整個單字的格子範圍上面（見下面
  // renderWordCompleteBoxes()，用格子邊長＋間距反推這個單字的實際像素範圍），
  // 這樣不管單字幾個字母，視覺上都是「一個框」，內部完全沒有多餘的線。
  interface CompletedWordBox {
    row: number;
    col: number;
    direction: "across" | "down";
    length: number;
  }
  const completedWordBoxes: CompletedWordBox[] = [];
  crossword.words.forEach((word, wordIndex) => {
    const coords = wordCoords(word);
    const hasBlank = coords.some(([r, c]) => game.isBlankCell(r, c));
    if (!hasBlank) return;
    const complete = coords.every(([r, c]) => game.displayLetterAt(r, c) !== null);
    if (!complete) return;
    completedWordBoxes.push({ row: word.row, col: word.col, direction: word.direction, length: word.en.length });
    if (!announcedWordIndexesForLevel.has(wordIndex)) {
      announcedWordIndexesForLevel.add(wordIndex);
      // 2026-09-30 使用者回饋：CAR 被唸成「C、A、R」逐字母拼讀，不是唸整個單字「car」。
      // 原因是 word.en 在 content 端一律存成全大寫（例如 "CAR"），很多瀏覽器的語音
      // 合成引擎看到全大寫的短字串會當成縮寫/簡稱處理，逐字母拼讀而不是當一般單字唸；
      // 跟戳泡泡（bubblePopStandalone.ts）遇到的是同一個問題，那邊已經用
      // `.toLowerCase()` 解決，這裡採用同樣的修法，統一轉成小寫再送進 speakEnglish()。
      speakEnglish(word.en.toLowerCase());
    }
  });

  /** 依目前實際的 cellPx（可能已經被 fitGridToViewport() 縮小過）畫出每個「已完整拼出」
   * 單字的紅框——絕對定位疊在 grid 上面（grid 本身是 position:relative），座標／尺寸
   * 用「格子邊長 + 間距」反推，不用個別格子的 DOM 節點位置，這樣不管網格縮放成什麼
   * 尺寸都能正確對齊。`pointer-events:none` 確保這層框不會擋到底下格子/拖曳判定。 */
  function renderWordCompleteBoxes(cellPx: number): void {
    grid.querySelectorAll(".crossword-word-complete-box").forEach((el) => el.remove());
    for (const w of completedWordBoxes) {
      const box = document.createElement("div");
      box.className = "crossword-word-complete-box";
      const spanPx = w.length * cellPx + (w.length - 1) * GRID_GAP_PX;
      box.style.left = `${w.col * (cellPx + GRID_GAP_PX)}px`;
      box.style.top = `${w.row * (cellPx + GRID_GAP_PX)}px`;
      box.style.width = `${w.direction === "across" ? spanPx : cellPx}px`;
      box.style.height = `${w.direction === "down" ? spanPx : cellPx}px`;
      grid.appendChild(box);
    }
  }

  const cellEls = new Map<string, HTMLDivElement>(); // key: "row,col"，只有空格才需要之後同步

  function syncCell(row: number, col: number): void {
    const el = cellEls.get(`${row},${col}`);
    if (!el) return;
    const letter = game.displayLetterAt(row, col);
    const blank = game.isBlankCell(row, col);
    el.textContent = letter ?? "";
    el.className =
      "crossword-cell" +
      (blank ? " crossword-cell--blank" : " crossword-cell--given") +
      (blank && letter !== null ? " crossword-cell--filled" : "");
  }

  for (let row = 0; row < crossword.gridHeight; row++) {
    for (let col = 0; col < crossword.gridWidth; col++) {
      const el = document.createElement("div");
      if (!game.hasCell(row, col)) {
        el.className = "crossword-cell crossword-cell--empty";
        grid.appendChild(el);
        continue;
      }
      el.dataset.row = String(row);
      el.dataset.col = String(col);
      cellEls.set(`${row},${col}`, el);
      syncCell(row, col);
      grid.appendChild(el);
    }
  }

  renderWordCompleteBoxes(currentCellPx);

  board.appendChild(grid);
  app!.appendChild(board);

  const tray = document.createElement("div");
  tray.className = "crossword-tray";
  app!.appendChild(tray);

  /** pointer event 手動實作拖曳（不用原生 HTML5 Drag and Drop API，手機瀏覽器支援度
   * 不好）：pointerdown 時把磚切成 position:fixed 跟著手指/滑鼠移動，放開時用
   * elementFromPoint() 判斷底下是哪個格子，交給 game.dropLetter() 判斷對錯；答對的話
   * game.onChange 會整段重繪（這個磚元素本身會被丟棄，不用自己清理），答錯或沒放到
   * 有效格子上，就把磚彈回字母區原本的位置並播放一個小小的彈跳動畫。
   *
   * 2026-09-30 修正使用者回饋的一連串拖曳異常（拖曳卡頓、答錯字母跑到畫面左下角、
   * 答對後字母沒有置中對齊、換關時上一關的字母沒清乾淨）——這些全部同一個根因：
   * 原本 pointerdown 時會把這個磚 `document.body.appendChild(tileEl)`，讓它離開
   * `#crossword-app` 這個容器；但 render() 只會 `app.innerHTML = ""` 清空 app 底下的
   * 節點，一旦磚被搬到 body 底下，之後不管是答對觸發的整段重繪、還是換到下一關，
   * render() 都清不到這個磚——它會變成一個「孤兒」節點永遠留在 body 最下面，答錯彈回
   * 時就算把 position 屬性清空，它也只是變成 body 底下的一個普通區塊，跑到畫面最下方
   * （看起來像「跑到左下角」）而不是回到字母區原本的位置，累積多個孤兒節點還會讓畫面
   * 看起來卡頓。修法：拖曳時完全不搬動這個磚在 DOM 樹裡的位置——`position: fixed`
   * 本身就會讓它脫離字母區的排版流、疊在最上層跟著手指移動，不需要真的把它搬到
   * document.body 底下；放開時無論答對答錯，這個磚要嘛跟著 render() 一起被清掉
   * （它從頭到尾都還是 tray 的子節點，app.innerHTML="" 一定清得到），要嘛就地恢復
   * 原本的樣式，靠 flexbox 自動排回字母區正確的位置。 */
  function makeTileDraggable(tileEl: HTMLButtonElement, tile: CrosswordTrayTile): void {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function onPointerDown(e: PointerEvent): void {
      if (game.phase !== "playing") return;
      dragging = true;
      tileEl.setPointerCapture(e.pointerId);
      const rect = tileEl.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      tileEl.classList.add("crossword-tile--dragging");
      tileEl.style.position = "fixed";
      tileEl.style.left = `${rect.left}px`;
      tileEl.style.top = `${rect.top}px`;
      tileEl.style.width = `${rect.width}px`;
      tileEl.style.height = `${rect.height}px`;
      e.preventDefault();
    }

    function onPointerMove(e: PointerEvent): void {
      if (!dragging) return;
      tileEl.style.left = `${e.clientX - offsetX}px`;
      tileEl.style.top = `${e.clientY - offsetY}px`;
    }

    function bounceBack(): void {
      // 這個磚從頭到尾都還是字母區（tray）的子節點，這裡只需要清掉 pointerdown 時
      // 加上去的內嵌樣式，flexbox 就會自動把它排回字母區裡正確的位置——不需要（也不該）
      // 自己動手搬動 DOM 節點的位置。
      tileEl.style.position = "";
      tileEl.style.left = "";
      tileEl.style.top = "";
      tileEl.style.width = "";
      tileEl.style.height = "";
      tileEl.classList.remove("crossword-tile--dragging");
      tileEl.classList.add("crossword-tile--bounce");
      setTimeout(() => tileEl.classList.remove("crossword-tile--bounce"), 400);
    }

    function onPointerUp(e: PointerEvent): void {
      if (!dragging) return;
      dragging = false;
      tileEl.releasePointerCapture(e.pointerId);

      // 找放開時底下是哪個格子——先暫時隱藏這個磚本身，不然 elementFromPoint() 只會
      // 量到磚自己（磚目前是 position:fixed 蓋在手指/滑鼠正下方）。
      tileEl.style.display = "none";
      const target = document.elementFromPoint(e.clientX, e.clientY);
      tileEl.style.display = "";

      const cellEl = target?.closest<HTMLDivElement>(".crossword-cell--blank:not(.crossword-cell--filled)");
      let correct = false;
      if (cellEl && cellEl.dataset.row !== undefined && cellEl.dataset.col !== undefined) {
        correct = game.dropLetter(Number(cellEl.dataset.row), Number(cellEl.dataset.col), tile.id);
      }
      if (!correct) {
        bounceBack();
      }
      // correct === true 的情況：game.onChange() 已經觸發整段 render()，這個 tileEl
      // 節點（本來就是 tray 底下的子節點，從沒被搬到別的地方過）已經隨著
      // app.innerHTML = "" 一起被清掉，不用自己清理。
    }

    tileEl.addEventListener("pointerdown", onPointerDown);
    tileEl.addEventListener("pointermove", onPointerMove);
    tileEl.addEventListener("pointerup", onPointerUp);
    tileEl.addEventListener("pointercancel", onPointerUp);
  }

  for (const tile of game.letterTray) {
    const tileEl = document.createElement("button");
    tileEl.type = "button";
    tileEl.className = "crossword-tile";
    tileEl.textContent = tile.letter;
    makeTileDraggable(tileEl, tile);
    tray.appendChild(tileEl);
  }

  const hintP = document.createElement("p");
  hintP.className = "crossword-hint";
  hintP.textContent = crossword.hintZh;
  app!.appendChild(hintP);

  const footer = document.createElement("footer");
  footer.className = "game-footer";
  app!.appendChild(footer);

  function starsRow(stars: number): string {
    // 2026-09-30 使用者要求把星等從 1-3 顆改成 1-5 顆，這裡只需要把畫幾顆星的迴圈上限
    // 從 3 改成 5；圖示尺寸從 32px 縮到 26px，5 顆排成一排寬度跟原本 3 顆×32px 差不多，
    // 不會讓這一列忽然變寬很多。
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html += i <= stars ? STAR_FILLED_ICON(26) : STAR_EMPTY_ICON(26);
    }
    return html;
  }

  function syncFooter(): void {
    footer.innerHTML = "";
    if (game.phase === "complete") {
      const stars = document.createElement("div");
      stars.className = "crossword-stars";
      stars.innerHTML = starsRow(lastStars);
      footer.appendChild(stars);

      const doneText = document.createElement("p");
      doneText.className = "done";
      doneText.innerHTML = `🎉 太厲害了，三關全部破完！<br />總共答錯 ${game.mistakeCount} 次。`;
      footer.appendChild(doneText);

      const playAgainBtn = document.createElement("button");
      playAgainBtn.type = "button";
      playAgainBtn.className = "secondary-btn";
      playAgainBtn.innerHTML = `再玩一次<span class="game-room-card-cost">（${COIN_ICON(14)}-${crosswordCost}）</span>`;
      playAgainBtn.addEventListener("click", () => {
        window.parent.postMessage(
          { channel: GAME_BRIDGE_CHANNEL, type: "requestReplay" } satisfies GameToParentMessage,
          window.location.origin
        );
      });
      footer.appendChild(playAgainBtn);

      const backToRoomBtn = document.createElement("button");
      backToRoomBtn.type = "button";
      backToRoomBtn.className = "primary-btn";
      backToRoomBtn.textContent = "返回遊戲室";
      backToRoomBtn.addEventListener("click", () => {
        window.parent.postMessage(
          { channel: GAME_BRIDGE_CHANNEL, type: "exitToRoom" } satisfies GameToParentMessage,
          window.location.origin
        );
      });
      footer.appendChild(backToRoomBtn);
    } else if (game.phase === "levelComplete") {
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "稍等一下，馬上進入下一關！";
      footer.appendChild(hint);
    } else {
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = "把字母區的字母拖到空格上，拼出正確的單字吧！";
      footer.appendChild(hint);
    }
  }

  syncProgress();
  syncFooter();

  /** 整頁所有區塊都已經掛進 DOM、瀏覽器排版完成之後才能呼叫：量測整頁實際高度
   * （`document.documentElement.scrollHeight`）有沒有超過這個 iframe 頁面自己的可視
   * 高度（`window.innerHeight`，iframe 是獨立的瀏覽情境，這裡的 innerHeight 指的是
   * iframe 本身的高度，不是外層 App 頁面），超出的話把超出的量整個算在網格身上、
   * 直接縮小格子的 px 尺寸（欄數/列數不變，只改變每格邊長），讓整頁重新量出來的高度
   * 剛好落在可視範圍內，不用使用者捲動就能看到完整的題目跟字母區。 */
  function fitGridToViewport(): void {
    // 先確保寬度不超框：量測 board 實際可用寬度（扣掉左右 padding），如果目前的
    // cellPx 讓網格總寬度超過這個可用寬度（例如小尺寸手機螢幕），先把 cellPx 縮小到
    // 剛好塞得下，再繼續往下處理高度是否超出可視範圍——寬高兩個方向都要顧到，不能
    // 只處理其中一個。
    const boardStyle = window.getComputedStyle(board);
    const boardPaddingX = parseFloat(boardStyle.paddingLeft || "0") + parseFloat(boardStyle.paddingRight || "0");
    const availableWidth = board.clientWidth - boardPaddingX;
    const widthCappedCellPx = Math.floor(
      (availableWidth - GRID_GAP_PX * (crossword.gridWidth - 1)) / crossword.gridWidth
    );
    if (widthCappedCellPx > 0 && widthCappedCellPx < currentCellPx) {
      applyGridSize(Math.max(24, widthCappedCellPx));
      renderWordCompleteBoxes(currentCellPx);
    }

    const overflowPx = document.documentElement.scrollHeight - window.innerHeight;
    if (overflowPx <= 0) return;
    // 反推目前實際的 cellPx 時要扣掉格子間距（gap）佔掉的高度，不然算出來的「目前格子
    // 邊長」會比真正設定的值大，後續「該縮小多少」的計算也會跟著錯（這是這一輪
    // 使用者回饋「答題區還是超出畫面」的根因之一，見上面 GRID_GAP_PX 的說明）。
    const gapTotalPx = GRID_GAP_PX * (crossword.gridHeight - 1);
    const renderedHeight = grid.getBoundingClientRect().height;
    const measuredCellPx = (renderedHeight - gapTotalPx) / crossword.gridHeight;
    // 多扣一點安全邊界（16px），避免算出來的尺寸剛好卡在邊緣、四捨五入誤差又讓它超出一點點。
    const targetCellPx = Math.floor(measuredCellPx - (overflowPx + 16) / crossword.gridHeight);
    // 保底最小格子尺寸：太小會讓字母看不清楚、觸控熱區也不夠大，寧可保留一點點捲動空間
    // 也不要縮到不能用；24px 大概是能放進一個字母字級還看得清楚的下限。
    const finalCellPx = Math.max(24, targetCellPx);
    if (finalCellPx >= measuredCellPx) return;
    applyGridSize(finalCellPx);
    renderWordCompleteBoxes(finalCellPx);
  }
  fitGridToViewport();

  game.onChange = () => {
    // 答對／關卡轉場才會走到這裡（見 crosswordGame.ts 的 onChange 觸發時機說明），
    // 整段重新渲染最簡單可靠——這個遊戲不像翻牌配對需要在既有 DOM 節點上做 CSS
    // transition 動畫，correct drop 之後直接重畫一次沒有額外的動畫時序要維護。
    render();
  };
  game.onCorrectDrop = playCorrectSound;
  game.onWrongDrop = playWrongSound;
  game.onLevelComplete = playRoundCompleteSound;
  game.onComplete = (stars) => {
    lastStars = stars;
    playRoundCompleteSound();
    window.parent.postMessage(
      { channel: GAME_BRIDGE_CHANNEL, type: "complete", stars } satisfies GameToParentMessage,
      window.location.origin
    );
    syncFooter();
  };
}

render();

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return; // 同源保護，忽略其他來源的訊息
  const data = event.data as ParentToGameMessage | undefined;
  if (data?.channel !== GAME_BRIDGE_CHANNEL) return;
  if (data.type === "replayApproved") {
    crossword = pickCrossword();
    game = new CrosswordGame(crossword);
    render();
  }
  // "replayDenied" 不用做任何事，見檔案開頭的協定說明。
});

// 頁面初始化完成，通知 parent 可以把 loading 佔位換成真正的內容了。
window.parent.postMessage(
  { channel: GAME_BRIDGE_CHANNEL, type: "ready" } satisfies GameToParentMessage,
  window.location.origin
);
