# Handoff Prompt：首次進站提醒 popup＋「關於本站」常駐「使用須知」段落

## 背景

Phase 3 準備把 App 直接部署到 GitHub Pages 開放給所有人玩（不用另外做展示用的 Demo 頁面，正式站本身就是 Demo）。因為要開放給不特定訪客使用，跟原本只給自己家小孩用的情境不一樣，使用者要求在登入前提醒幾件事（資料只存在本機裝置、沒有密碼保護等），同時也考慮到「使用者可能會關掉提醒、之後忘記內容」，所以要求同樣的說明也要有個常駐、隨時能回去查看的地方——選在「關於本站」頁面加一個永久的「使用須知」段落，彈窗負責第一次進站時的提醒（精簡版＋提示可以去關於本站看完整版），兩邊內容互相呼應但不完全重複。

這份改動只動 `app/src/main.ts` 跟 `app/src/style.css`，不涉及 `content/`，不用重跑 `verify-*.ts`。

## 改動一：首次進站提醒 popup（觸發點：`renderProfileSelect()`，`main.ts` 約第 890 行）

沿用既有的 `appendModalShell(title)` 共用小視窗元件（跟「變更頭像」「修改名稱」用同一份，`main.ts` 約第 2252 行），不用另外做一套 modal 系統。

### 是否顯示的判斷邏輯

這個提醒要在**任何使用者都還沒登入前**的「誰在玩？」畫面出現，此時還沒有 `activeProfile`，所以不能比照 `slowSpeech` 那樣考慮分 profileId 存——比照同樣道理，這裡也用一個**裝置層級**（不分使用者）的 localStorage 旗標記住「這台裝置／這個瀏覽器已經看過」：

```ts
const WELCOME_NOTICE_STORAGE_KEY = "englishForKids.settings.hasSeenWelcomeNotice.v1";

function hasSeenWelcomeNotice(): boolean {
  if (typeof window === "undefined") return true; // SSR/測試環境保守當作已看過，不要噴錯
  try {
    return window.localStorage.getItem(WELCOME_NOTICE_STORAGE_KEY) === "1";
  } catch {
    return true; // localStorage 被擋掉時，不要讓提醒擋住整個登入流程
  }
}

function markWelcomeNoticeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WELCOME_NOTICE_STORAGE_KEY, "1");
  } catch {
    // 忽略，跟其餘模組一致的容錯方式
  }
}
```

在 `renderProfileSelect()` 最後（畫面渲染完之後）加一段：

```ts
if (!hasSeenWelcomeNotice()) {
  appendWelcomeNoticeModal();
}
```

### Modal 內容（精簡版，四點條列＋一句footer提示）

```ts
function appendWelcomeNoticeModal(): void {
  const card = appendModalShell("開始之前，先跟你說幾件事");

  const intro = document.createElement("p");
  intro.className = "modal-text";
  intro.textContent = "這是一個由家長獨立維護的免費小平台，開始玩之前有幾點想讓你知道：";
  card.appendChild(intro);

  const list = document.createElement("ul");
  list.className = "welcome-notice-list";
  const points = [
    "學習紀錄只存在這台裝置的瀏覽器裡，沒有雲端備份。換瀏覽器、換裝置，或清除瀏覽器資料，都會讓進度消失。",
    "這裡的「登入」只是選一個名字，沒有密碼保護。如果是公用電腦，同一台裝置上的其他人也能看到、切換或刪除你的紀錄。",
    "完全不會收集或上傳任何個人資料，所有東西都只存在你自己的瀏覽器裡。",
    "家裡有多個孩子共用同一台裝置的話，記得幫每個孩子各自建立一個名字。",
  ];
  for (const text of points) {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  }
  card.appendChild(list);

  const footer = document.createElement("p");
  footer.className = "modal-text modal-text--muted";
  footer.textContent = "之後想再看這些說明，可以到「關於本站」頁面查看。";
  card.appendChild(footer);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "primary-btn";
  closeBtn.textContent = "我知道了，開始玩！";
  closeBtn.addEventListener("click", () => {
    markWelcomeNoticeSeen();
    closeProfileDetailModal(); // 沿用現有的 modal 關閉函式，跟換頭像/改名字用同一套
  });
  card.appendChild(closeBtn);
}
```

（`appendModalShell()` 的既有右上角叉叉／點遮罩關閉，也建議一併呼叫 `markWelcomeNoticeSeen()`，不要讓使用者用「叉叉關掉」的方式繞過記錄，不然下次還是會跳出來——實作時檢查一下 `appendModalShell()` 內部的關閉邏輯，如果叉叉/遮罩共用同一個 `closeProfileDetailModal()`，可以把 `markWelcomeNoticeSeen()` 移到呼叫 `appendWelcomeNoticeModal()` 當下就先標記已讀，而不是等按下確認鈕才記錄，避免不管用哪種方式關閉都有紀錄到。這個實作細節依現有 `appendModalShell()`／`closeProfileDetailModal()` 的實際行為決定即可。）

CSS 新增（`.modal-text`／`.modal-text--muted` 如果 modal 元件裡還沒有對應樣式就補上，`welcome-notice-list` 用簡單的項目符號清單樣式）：

```css
.welcome-notice-list {
  margin: var(--space-3) 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--color-ink-muted);
  font-size: var(--text-body);
  line-height: 1.6;
}

.modal-text--muted {
  color: var(--color-ink-muted);
  font-size: var(--text-caption);
}
```

## 改動二：「關於本站」常駐「使用須知」段落（`renderAbout()`，`main.ts` 約第 2195-2245 行）

放在 `aboutFeedback`（「有任何問題或建議」）之後、`metaText`（版本號那行）之前——先講完平台的故事，再講使用須知，最後才是版本資訊跟裝飾圖，這樣的閱讀順序比較自然：

```ts
const usageSectionTitle = document.createElement("h2");
usageSectionTitle.className = "section-heading";
usageSectionTitle.textContent = "使用須知";
app!.appendChild(usageSectionTitle);

const usageParagraphs = [
  "所有的學習紀錄（單字進度、收藏、成就徽章）都只存在你目前使用的這個瀏覽器裡，沒有雲端同步、也沒有備份機制。如果你換一台電腦、換一個瀏覽器，或清除瀏覽器資料、使用無痕模式，這些紀錄都會消失，沒辦法救回來。",
  "這裡的「登入」只是選一個顯示名稱，不是帳號密碼機制。如果你在公用電腦（例如學校、圖書館）上使用，請留意同一台裝置上的其他人也能看到、切換，甚至刪除你建立的名字與紀錄。",
  "因為整個平台完全是純前端運作，沒有任何後端伺服器，不會收集、儲存或上傳你的任何個人資料——這也代表沒有辦法把資料同步到別台裝置，兩者是一體兩面。",
  "如果家裡有多個孩子一起用同一台裝置，建議幫每個孩子各自建立一個獨立的名字，這樣彼此的學習紀錄才不會混在一起。",
  "發音功能使用瀏覽器內建的語音合成，某些瀏覽器或裝置可能沒有內建可用的語音，或需要先允許網頁播放音效。",
  "這是我利用空閒時間獨立維護的小專案，內容仍在持續擴充與調整中，如果你發現任何問題或有建議，都歡迎透過下方信箱跟我說，但沒有辦法保證即時處理，請見諒。",
];
for (const text of usageParagraphs) {
  const p = document.createElement("p");
  p.className = "about-text";
  p.textContent = text;
  app!.appendChild(p);
}
```

`section-heading` 這個 class 是既有的段落標題樣式（其他頁面已經在用，例如「學習成就」「帳號設定」），不用新增樣式。

## 不需要改的地方

- `content/` 完全不用動，這次改動跟主題內容、成效追蹤、徽章系統都無關。
- `appendModalShell()` 元件本身結構不用改，直接沿用。
- 不用改任何 `verify-*.ts`。

## 驗證

1. `npm run build`（含 `tsc --noEmit`）通過。
2. 清空瀏覽器 localStorage 後重新打開「誰在玩？」畫面，確認 popup 會出現；關掉後（不論按確認鈕、叉叉、還是點遮罩）重新整理頁面，確認不會再跳出來。
3. 打開「關於本站」頁面，確認「使用須知」完整段落有出現在正確位置（故事段落之後、版本資訊之前）。
4. `node scripts/build-standalone-demo.mjs` 重新產生 `app/demo-standalone.html`，並 `cp app/demo-standalone.html ../demo-standalone.html` 同步專案根目錄那份。
5. 不用重跑 `verify-*.ts`、不用重新產生 `dashboard.html`／`content-review.html`。
