# 任務：把「世界」全面改名成「單元」，並把 Unit 0 併入 0～6 連貫序列

## 背景

目前「6 大世界」分類（世界一～六）容易讓使用者誤會成地圖／關卡世界，跟使用者確認後決定改叫「單元」。因為應用還沒正式對外發布、沒有真正的使用者進度資料，這次採用**最徹底的做法**：連內部識別碼（`WORLDS` 常數、`world1`～`world6` 這些 key、`badge.world_completion.*` 徽章 ID）都一起改，不做新舊 ID 相容轉換。

同時，把現有「Unit 0 教室常用語」（原本刻意獨立於 6 大世界之外）整合進來，變成「單元 0」，跟單元一～六形成連貫的 0-6 序列。完整規劃邏輯跟命名對照表在 `docs/plan-rename-world-to-unit.md`，這份 handoff prompt 是其中 C 段（`app/src`、`app/scripts`）的具體施工清單。

**這次改動只涉及 `app/src/*.ts`、`app/src/style.css`、`app/scripts/verify-world-completion-badges.ts`、`app/scripts/verify-flashcard-logic.ts`，不涉及 `content/` 底下任何資料檔案的實際內容**（單字/句子/短文都不用動）。`content/badges/badges.json` 的徽章 ID／文字改名會由我這邊在你完成這次改動之後同步跟上，這裡不用管。

## 一、`app/src/main.ts`

### 1. `WorldConfig` → `UnitConfig`，`WORLDS` → `UNITS`，`world1`～`world6` → `unit1`～`unit6`，新增 `unit0`

目前（約 100-146 行）：

```ts
/**
 * 6 大世界地圖分類（docs/content-plan-gept-kids.md 3.1 節），首頁依這個分組呈現主題卡片。
 * topicFileKeys 是「這個世界完整規劃涵蓋的主題」，不是「目前已經做出內容的主題」——
 * 之後陸續擴充其餘 21 個主題，只要 content/ 資料齊全、`TOPICS` 有登記，就會自動出現在
 * 對應的世界底下；還沒做出內容的主題，世界頁面上就只是暫時看不到卡片，不影響
 * 「世界完成度」徽章判斷（world_completion 徽章需要這個世界規劃的主題全部存在且都
 * 通過 Stage D，見 computeBadgeViewState 的 "world_completion" case）。
 */
interface WorldConfig {
  key: string;
  label: string;
  topicFileKeys: string[];
}

const WORLDS: WorldConfig[] = [
  { key: "world1", label: "世界一：我和我的家", topicFileKeys: [...] },
  { key: "world2", label: "世界二：食衣住行", topicFileKeys: [...] },
  { key: "world3", label: "世界三：上學去", topicFileKeys: [...] },
  { key: "world4", label: "世界四：大自然與動物", topicFileKeys: [...] },
  { key: "world5", label: "世界五：生活情境", topicFileKeys: [...] },
  { key: "world6", label: "世界六：時間與節日", topicFileKeys: [...] },
];
```

改成：

```ts
/**
 * 0～6 共 7 個單元分類（docs/content-plan.md 3.1 節），首頁依這個分組呈現主題卡片。
 * topicFileKeys 是「這個單元完整規劃涵蓋的主題」，不是「目前已經做出內容的主題」——
 * 之後陸續擴充其餘主題，只要 content/ 資料齊全、`TOPICS` 有登記，就會自動出現在
 * 對應的單元底下；還沒做出內容的主題，單元頁面上就只是暫時看不到卡片，不影響
 * 「單元完成度」徽章判斷（unit_completion 徽章需要這個單元規劃的主題全部存在且都
 * 通過 Stage D，見 computeBadgeViewState 的 "unit_completion" case）。
 *
 * unit0（教室常用語）是新手起手式，只有一個主題，渲染時仍走獨立的區塊／提示文字
 * （見 renderTopicSelect()），併入這個陣列只是為了讓 0～6 的編號跟命名連貫一致；
 * unit_completion 徽章判斷邏輯明確排除 unit0（見下方 computeBadgeViewState 的說明），
 * 不會另外產生一個跟 OB-02（unit0_complete）語意重複的徽章。
 */
interface UnitConfig {
  key: string;
  label: string;
  topicFileKeys: string[];
}

const UNITS: UnitConfig[] = [
  {
    key: "unit0",
    label: "單元 0：教室常用語",
    topicFileKeys: ["unit_zero"],
  },
  {
    key: "unit1",
    label: "單元一：我和我的家",
    topicFileKeys: ["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"],
  },
  {
    key: "unit2",
    label: "單元二：食衣住行",
    topicFileKeys: ["food_drink", "clothing_accessories", "houses_apartments", "tableware", "transportation"],
  },
  {
    key: "unit3",
    label: "單元三：上學去",
    topicFileKeys: ["school", "numbers", "colors"],
  },
  {
    key: "unit4",
    label: "單元四：大自然與動物",
    topicFileKeys: ["animals_insects", "weather_nature", "geographical_terms"],
  },
  {
    key: "unit5",
    label: "單元五：生活情境",
    topicFileKeys: ["places_directions", "occupations", "money", "health", "forms_of_address"],
  },
  {
    key: "unit6",
    label: "單元六：時間與節日",
    topicFileKeys: ["time", "holidays_festivals", "sports_hobbies", "sizes_measurements"],
  },
];
```

### 2. `renderTopicSelect()`（約 1195-1258 行）

目前邏輯是「Unit 0 獨立渲染一個特殊區塊，然後 `for (const world of WORLDS)` 跑其餘 6 個世界」。改成「從 `UNITS` 裡挑出 `unit0` 單獨渲染特殊區塊（維持現有的『🚀 新手起手式』提示文字跟 `unit-zero-section`/`unit-zero-hint` 樣式），其餘 `unit1`～`unit6` 照原本邏輯跑迴圈」：

```ts
function renderTopicSelect(): void {
  appendShell("home");

  const header = document.createElement("header");
  header.className = "game-header";
  header.innerHTML = `<h1>選擇主題</h1><p class="progress">先選一個單元，再選主題，挑戰 Stage A-D</p>`;
  app!.appendChild(header);

  // 單元 0「教室常用語」是新手起手式，維持獨立區塊＋專屬提示文字，不強制要求
  // 先玩完才能玩其他主題——跟其他已上架主題一樣自由選（跟使用者確認過）。
  const unitZeroConfig = UNITS.find((unit) => unit.key === "unit0");
  const unitZeroSummary = availableTopics.find((summary) => summary.topic.fileKey === "unit_zero");
  if (unitZeroConfig && unitZeroSummary) {
    const unitZeroSection = document.createElement("section");
    unitZeroSection.className = "unit-section unit-zero-section";

    const unitZeroTitle = document.createElement("h2");
    unitZeroTitle.className = "unit-title";
    unitZeroTitle.textContent = "🚀 新手起手式";
    unitZeroSection.appendChild(unitZeroTitle);

    const unitZeroHint = document.createElement("p");
    unitZeroHint.className = "unit-zero-hint";
    unitZeroHint.textContent = "推薦新朋友從這裡開始暖身，不過也可以跳過、直接挑其他單元的主題玩。";
    unitZeroSection.appendChild(unitZeroHint);

    const unitZeroGrid = document.createElement("div");
    unitZeroGrid.className = "topic-grid";
    unitZeroGrid.appendChild(buildTopicCard(unitZeroSummary));
    unitZeroSection.appendChild(unitZeroGrid);

    app!.appendChild(unitZeroSection);
  }

  // 首頁依單元一～六分組呈現（docs/content-plan.md 3.1 節），每個單元底下
  // 只顯示「目前已經有內容」的主題卡片；單元規劃的主題還沒做出內容的話，
  // 這個單元暫時只顯示「敬請期待」，不會出現空白或壞掉的卡片。
  for (const unit of UNITS) {
    if (unit.key === "unit0") continue; // 已經在上面獨立渲染過了
    const topicsInUnit = availableTopics.filter((summary) => unit.topicFileKeys.includes(summary.topic.fileKey));

    const unitSection = document.createElement("section");
    unitSection.className = "unit-section";

    const unitTitle = document.createElement("h2");
    unitTitle.className = "unit-title";
    unitTitle.textContent = unit.label;
    unitSection.appendChild(unitTitle);

    if (topicsInUnit.length === 0) {
      const comingSoon = document.createElement("p");
      comingSoon.className = "unit-coming-soon";
      comingSoon.textContent = "敬請期待，這個單元的主題內容還在製作中。";
      unitSection.appendChild(comingSoon);
      app!.appendChild(unitSection);
      continue;
    }

    const grid = document.createElement("div");
    grid.className = "topic-grid";
    for (const summary of topicsInUnit) {
      grid.appendChild(buildTopicCard(summary));
    }
    unitSection.appendChild(grid);
    app!.appendChild(unitSection);
  }
}
```

（`buildTopicCard()` 本身不用改，共用卡片邏輯不受影響。）

### 3. 徽章分類顯示（約 2973、2999 行）

```ts
world_completion: { icon: CATEGORY_ICONS.map, title: "主題／世界完成度" },
```

改成：

```ts
unit_completion: { icon: CATEGORY_ICONS.map, title: "主題／單元完成度" },
```

`BADGE_CATEGORY_ORDER` 陣列裡的 `"world_completion"` 同步改成 `"unit_completion"`。

### 4. `computeBadgeViewState()` 的 `world_completion` case（約 3121-3134 行）

目前：

```ts
    case "world_completion": {
      // 這裡故意比對 WORLDS 裡「規劃完整 24 主題」的完整清單（不是只看目前已經做出來的
      // 6 個主題），所以世界二～六、all_topics 在其他 18 個主題做出來之前都會自然算未達成，
      // 不用另外維護一份「功能開發中」名單，之後主題陸續補齊也不用回來改這裡的邏輯。
      const worldIdSuffix = badge.id.replace("badge.world_completion.", "");
      const worldsToCheck =
        worldIdSuffix === "all_topics" ? WORLDS : WORLDS.filter((w) => w.key === worldIdSuffix);
      if (worldsToCheck.length === 0) {
        return { achieved: false, blockedByMissingFeature: true };
      }
      const achieved = worldsToCheck.every((world) =>
        world.topicFileKeys.every(
          (fileKey) => availableTopics.some((t) => t.topic.fileKey === fileKey) && completedStageDTopics.has(fileKey)
        )
      );
      return { achieved, blockedByMissingFeature: false };
    }
```

改成（**注意**：`UNITS` 拿去比對的清單要排除 `unit0`，理由見上面 `UNITS` 常數的註解——unit0 已經有專屬的 OB-02 新手徽章，不需要再產生一個 unit_completion 徽章）：

```ts
    case "unit_completion": {
      // 這裡故意比對 UNITS 裡「規劃完整主題」的完整清單（不是只看目前已經做出來的主題），
      // 所以還沒做出內容的單元、all_topics 在對應主題做出來之前都會自然算未達成，不用另外
      // 維護一份「功能開發中」名單，之後主題陸續補齊也不用回來改這裡的邏輯。
      // unit0（教室常用語）故意排除在外：它已經有專屬的 OB-02 新手徽章
      // （badge.onboarding.unit0_complete，判斷 Stage A 單字配對完成），不需要再產生一個
      // 語意重複的 unit_completion 徽章。
      const unitIdSuffix = badge.id.replace("badge.unit_completion.", "");
      const unitsToCheck =
        unitIdSuffix === "all_topics"
          ? UNITS.filter((u) => u.key !== "unit0")
          : UNITS.filter((u) => u.key === unitIdSuffix && u.key !== "unit0");
      if (unitsToCheck.length === 0) {
        return { achieved: false, blockedByMissingFeature: true };
      }
      const achieved = unitsToCheck.every((unit) =>
        unit.topicFileKeys.every(
          (fileKey) => availableTopics.some((t) => t.topic.fileKey === fileKey) && completedStageDTopics.has(fileKey)
        )
      );
      return { achieved, blockedByMissingFeature: false };
    }
```

### 5. 其他零星的「世界」中文字／`world` 命名

用編輯器全文搜尋 `世界`、`world`（不分大小寫）大概還會找到：

- 幾處註解裡的「世界」文字（例如 2942 行附近「6 世界 24 主題架構」這類敘述性註解）→ 改成「單元」，數字如果跟目前實際規劃的主題數對不上，就用目前正確的數字。
- `worldIdSuffix`、`topicsInWorld` 這類變數名稱如果還有漏網之魚 → 統一改成 `unitIdSuffix`、`topicsInUnit`。
- `unitZeroSummary`／`unitZeroSection`／`unitZeroTitle`／`unitZeroHint`／`unitZeroGrid`／`computeUnit0MatchingComplete`／`unit0MatchingComplete`／`unit0Available` 這些**已經是 `unit`/`unit0` 命名，不用改**。

## 二、`app/src/style.css`

```css
.world-section { ... }
.world-section:first-of-type { ... }
.world-title { ... }
.world-coming-soon { ... }
```

改成：

```css
.unit-section { ... }
.unit-section:first-of-type { ... }
.unit-title { ... }
.unit-coming-soon { ... }
```

（`.unit-zero-section`／`.unit-zero-hint` 已經是對的名稱，不用動；記得同步改 `main.ts` 裡所有指定這些 class 的地方，跟第一節第 2 點的程式碼一致。）

## 三、`app/src/types.ts`

`BadgeCategory` 型別裡的 `"world_completion"` 改成 `"unit_completion"`（約 90 行）。

## 四、`app/scripts/verify-world-completion-badges.ts`

檔名改成 `verify-unit-completion-badges.ts`。內容目前是自己維護一份 `WorldConfig`/`WORLDS` 鏡像 fixture（跟 `main.ts` 保持一致，方便獨立測試 `isWorldCompletionAchieved` 邏輯），需要整套改成 `UnitConfig`/`UNITS`：

- `WorldConfig` → `UnitConfig`
- `WORLDS` 常數改成跟 `main.ts` 新的 `UNITS` 一模一樣（含新增的 `unit0` 項目）
- 檔案裡對應 `main.ts` 邏輯的函式（例如 `isWorldCompletionAchieved`）改名成 `isUnitCompletionAchieved`，並比照第一節第 4 點的邏輯排除 `unit0`
- 所有測試案例裡的 `world1`／`world3` 等字面值改成 `unit1`／`unit3`，斷言訊息裡的「世界」文字改成「單元」
- 檔案開頭註解（約 6-8 行）的「WC-01~07（badge.world_completion.world1~world6／all_topics）」改成「WC-01~07（badge.unit_completion.unit1~unit6／all_topics）」，51 行附近「跟 main.ts 的 WORLDS 常數保持一致」改成「跟 main.ts 的 UNITS 常數保持一致」

**新增一個測試案例**（或擴充現有測試）驗證 unit0 不會被誤判進 unit_completion：例如「即使 unit_zero 主題通過 Stage D，也不應該有 `badge.unit_completion.unit0` 這個 badge id 可以達成」（因為 badges.json 裡本來就不會有這個 ID，這裡主要是確保程式邏輯遇到 `unit0` 這個 key 時的行為符合預期，不會因為 `UNITS` 陣列多了一項就出錯）。

## 五、`app/scripts/verify-flashcard-logic.ts`

註解裡提到 `world_completion` 的地方（約 14、318、348-358 行）改成 `unit_completion`，純文字修改，不影響測試邏輯本身。

## 驗證

1. `npm run build`（含 `tsc --noEmit`）確認型別／建置都過。
2. 跑全部 `app/scripts/verify-*.ts`（包含改名後的 `verify-unit-completion-badges.ts`）確認都通過。
3. `node scripts/build-standalone-demo.mjs` 重新產生 `app/demo-standalone.html`，並 `cp app/demo-standalone.html ../demo-standalone.html` 同步專案根目錄那份（避免又出現兩份不同步的已知問題）。
4. 實際打開試玩：首頁應該依序看到「🚀 新手起手式」（單元 0 教室常用語）、單元一～單元三（目前已上架）、單元四～六（尚未上架的顯示「敬請期待，這個單元的主題內容還在製作中。」）。
5. 完成 unit1 規劃的所有主題（現在共 6 個：family／people／appearance／emotions／personality_traits／parts_of_body）的 Stage D，確認觸發的是 `badge.unit_completion.unit1`（而不是舊的 `world_completion.world1`，這個舊 ID 屆時 `content/badges/badges.json` 已經不存在了，如果程式邏輯沒改乾淨，這裡會抓不到達成）。

**改完之後跟我說一聲**，我會立刻同步把 `content/badges/badges.json` 的徽章 ID／文字改成 `unit_completion.*`，兩邊盡量在同一個時段內前後腳完成，避免徽章功能有空窗期。
