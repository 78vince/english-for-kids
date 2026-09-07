# Handoff：「關於本站」頁面新增「更新紀錄」區塊

網站已經正式上架給更多使用者，希望在網頁裡加一個給使用者看的簡短更新說明，跟 `HANDOFF.md`（給開發交接用、技術細節很多、上百條）分開，是完全不同的兩份東西。

## 資料來源（已建立，content 端）

新增了 `content/changelog.json`，格式是陣列，**由新到舊排列**，直接照陣列順序渲染就好，不用另外排序：

```json
[
  {
    "date": "2026-08-28",
    "title": "可以加到手機主畫面了",
    "items": ["把網頁加入手機主畫面時，現在會顯示專屬的字母怪獸圖示，不再是瀏覽器預設的圖案。"]
  },
  {
    "date": "2026-08-28",
    "title": "手機操作變更順手了",
    "items": ["...", "..."]
  }
]
```

之後每次有使用者感受得到的更新，會由我直接編輯這個檔案加一條資料到最前面，**不需要再另外寫 handoff**——這次只需要把「讀取＋渲染」這個機制做出來，之後維護只動 JSON。

## 要做的事

### 1. `content.ts` 讀取 changelog.json

比照現有 `content/badges/badges.json` 的做法（`content.ts` 第 12 行 `import badgesData from "../../content/badges/badges.json";`），新增：

```ts
import changelogData from "../../content/changelog.json";
```

型別可以參考 `types.ts` 的寫法新增一個簡單的 interface：

```ts
export interface ChangelogEntry {
  date: string;
  title: string;
  items: string[];
}
```

匯出一個排序好（其實不用排序，檔案本身已經新到舊）、可以直接用的常數，例如 `export const CHANGELOG: ChangelogEntry[] = changelogData;`。

### 2. `renderAbout()` 新增區塊（`main.ts` 第 2255-2328 行）

放在「使用須知」區塊之後、版本號那行（第 2314-2319 行 `metaText`）之前。只顯示**最新 5 則**就好（不用做「查看更多」之類的功能，說明不用太長）：

```ts
const changelogSectionTitle = document.createElement("h2");
changelogSectionTitle.className = "section-heading";
changelogSectionTitle.textContent = "更新紀錄";
app!.appendChild(changelogSectionTitle);

const changelogList = document.createElement("div");
changelogList.className = "changelog-list";
for (const entry of CHANGELOG.slice(0, 5)) {
  const entryEl = document.createElement("div");
  entryEl.className = "changelog-entry";

  const entryHeader = document.createElement("p");
  entryHeader.className = "changelog-entry-header";
  entryHeader.innerHTML = `<span class="changelog-date">${entry.date}</span> ${entry.title}`;
  entryEl.appendChild(entryHeader);

  const list = document.createElement("ul");
  list.className = "changelog-items";
  for (const item of entry.items) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }
  entryEl.appendChild(list);

  changelogList.appendChild(entryEl);
}
app!.appendChild(changelogList);
```

（變數/class 命名可以依現有慣例微調，重點是放置順序跟只取前 5 則。）

### 3. CSS（`style.css`，比照「使用須知」`.about-text` 附近的樣式）

不用花俏，簡單清楚就好：日期用小一點、淺灰色的字；標題稍微加粗；`items` 用小圓點列表，行距跟現有 `.about-text` 系列一致即可。手機版（`max-width: 640px`）確認一下不會跑版（這個專案手機版排版已經修過好幾輪 bug，麻煩比照現有 `.about-text` 的響應式寫法，不要重新發明）。

### 4. 驗證

- `npm run build` 要過。
- 建議新增 `verify-changelog.ts`：檢查 `content/changelog.json` 每筆資料的 `date` 格式（YYYY-MM-DD）、`title`／`items` 不是空字串、`items` 至少 1 條，比照專案裡其他 verify script 的寫法即可，之後我自己加新的 changelog 條目時也能順便自我檢查格式有沒有寫錯。
- 實機或 demo 打開「關於本站」頁面，確認「更新紀錄」區塊有出現在使用須知跟版本號中間，手機寬度看起來正常。

## 不用做的事（保持簡單）

- 不用做「有新更新」提示（例如小紅點），使用者要看就自己點進「關於本站」看。
- 不用做獨立的導覽分頁，也不用「查看全部歷史」的展開功能，只顯示最新 5 則即可。
- `content/changelog.json` 內容不用你這邊維護或補資料，之後都由我直接編輯這個檔案。
