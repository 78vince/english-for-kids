# 變更計劃：「世界」→「單元」全站改名

建立日期：2026-08-22
狀態：**規劃中，尚未執行**（本文件只是計劃，實際改動要等使用者確認後才動手）

## 背景與決策

目前「6 大世界」分類（世界一～六）容易讓使用者誤會成遊戲裡的「地圖／關卡世界」，希望改用比較直白的「單元」取代。順便決定了兩個關鍵問題：

1. **改名範圍**：目前應用尚未正式對外發布，沒有真正的使用者進度資料，所以採用**最徹底的做法**——連內部程式碑的識別碼（`WORLDS` 常數、`world1`～`world6` 這些 key、`badge.world_completion.*` 徽章 ID）都一起改成 `unit` 開頭，不做新舊 ID 相容轉換。
2. **Unit 0 的定位**：現有「Unit 0 教室常用語」原本刻意獨立於 6 大世界之外。這次順勢把它整合進來，變成「單元 0」，跟單元一～六形成連貫的 0-6 序列。

## 新舊命名對照表

| 舊 | 新 |
|---|---|
| 世界（概念／中文顯示） | 單元 |
| `WorldConfig`（interface） | `UnitConfig` |
| `WORLDS`（常數） | `UNITS` |
| `world1` ～ `world6`（key） | `unit1` ～ `unit6` |
| （不存在，Unit 0 目前独立於陣列外） | 新增 `unit0`，併入 `UNITS` 陣列最前面 |
| 「世界一：我和我的家」～「世界六：時間與節日」 | 「單元一：我和我的家」～「單元六：時間與節日」 |
| 「Unit 0　教室常用語」／「教室常用語（Unit 0）」 | 「單元 0：教室常用語」（英文 Unit 0 維持，剛好對應） |
| `badge.world_completion.world1`～`world6`／`all_topics` | `badge.unit_completion.unit1`～`unit6`／`all_topics` |
| `BadgeCategory` 的 `"world_completion"` | `"unit_completion"` |
| `isWorldCompletionAchieved()` | `isUnitCompletionAchieved()` |
| `worldIdSuffix` | `unitIdSuffix` |
| `topicsInWorld` | `topicsInUnit` |
| CSS `.world-section` / `.world-title` / `.world-coming-soon` | `.unit-section` / `.unit-title` / `.unit-coming-soon` |
| `app/scripts/verify-world-completion-badges.ts`（檔名） | `verify-unit-completion-badges.ts` |
| `badge.onboarding.unit0_complete` | **不變**——本來就叫 `unit0`，剛好已經符合新方案 |

### 一個需要特別注意的設計判斷：Unit 0 要不要也自動產生「單元完成度」徽章？

現有 6 個世界完成度徽章（`world_completion.world1`～`world6`）的邏輯是「這個世界規劃的所有主題都通過 Stage D」。如果把 Unit 0 直接併入 `UNITS` 陣列當成 `unit0`，同一套邏輯跑下去會自動多產生一個「單元 0 完成度」徽章——但 Unit 0 底下只有一個主題（`unit_zero`），而且它已經有專屬的新手徽章 `badge.onboarding.unit0_complete`（條件是「完成 Unit 0 全部單字練習」，走 matching 判斷，不是 Stage D）。兩個徽章條件不同、意義重疊，容易讓使用者困惑「怎麼兩個徽章都叫單元 0 完成」。

**建議**：`unit0` 併入 `UNITS` 陣列只用於「首頁顯示順序／單元 0～六連貫命名」，但徽章判斷邏輯明確排除 `unit0`（例如 `UNITS.filter(u => u.key !== "unit0")` 才拿去跑 `unit_completion` 判斷），繼續讓 Unit 0 只保留原本的新手徽章。這樣命名統一，但不會產生一個語意重複的新徽章。這點會在 handoff prompt 裡明確交代給技術端，執行時如果覺得應該反過來處理（真的也要有 `unit_completion.unit0`），歡迎技術端跟你確認後再調整。

## 影響範圍全清單與執行分工

### A. 我可以直接獨立完成（文件類，不影響程式邏輯）

- `docs/content-plan.md`：3.1 節「6 大世界地圖分類」標題與表格、各處「世界一」～「世界六」文字
- `docs/achievement-badges.md`：世界完成度徽章那幾列的名稱／描述文字，配合新 ID 一起改
- `README.md`：TODO 裡「世界一～六」的文字
- `HANDOFF.md`：新增一筆變更紀錄，說明這次改名的背景與範圍
- `dashboard.html`：靜態表格／卡片裡「世界一」～「世界四」文字（提醒：這個檔案內容本身已經跟目前實際進度不同步，例如 Tableware 還顯示 7 字、還沒有 Appearance/Emotions/Personality traits——這次只做文字置換，數字/主題清單的完整校正建議另外找時間一次處理）
- `content/units/unit0.json`：`name_zh` 改成反映「單元 0」的新定位（這個檔案目前是純文件性質，main.ts 沒有實際讀取它，改動零風險）

### B. 我可以做，但時機需要跟技術端同步（不能我自己先單獨改）

- `content/badges/badges.json`：7 個徽章 ID（`badge.world_completion.*` → `badge.unit_completion.*`）＋名稱／描述文字。**這個檔案比較特別**：跟前面加單字、拆主題那種「先改 content、app 晚點接線也不會壞」不一樣——`main.ts` 目前是直接從徽章 ID 字串解析出 `worldIdSuffix` 去比對 `WORLDS`，如果我先把 ID 改成 `unit` 開頭，但 `main.ts` 還沒同步改，這 7 個徽章會全部「判斷不到、永遠無法達成」（不會當機，但功能會暫時失效）。因為目前還沒正式發布、沒有真正使用者在玩，這個空窗期風險可以接受，但建議這個檔案的改動跟技術端的 `main.ts` 改動盡量在同一次工作時段內前後腳完成，避免空窗期拖太久。

### C. 需要透過 handoff prompt 交給技術端執行（app/src、app/scripts）

- `app/src/main.ts`：
  - `WorldConfig` → `UnitConfig`，`WORLDS` → `UNITS`，`world1`～`world6` → `unit1`～`unit6`
  - 新增 `unit0` 併入 `UNITS` 陣列最前面（`topicFileKeys: ["unit_zero"]`），首頁渲染邏輯調整成 0～6 連貫顯示（Unit 0 仍可保留現有的「🚀 新手起手式」提示文字跟稍微不同的呈現方式，只是資料結構上併入同一個陣列）
  - 所有「世界」中文字串 → 「單元」
  - 函式／變數重新命名：`isWorldCompletionAchieved`→`isUnitCompletionAchieved`、`worldIdSuffix`→`unitIdSuffix`、`topicsInWorld`→`topicsInUnit`
  - 徽章判斷邏輯改用新 ID（`unit_completion.unit1`～`unit6`／`all_topics`），並依前面「設計判斷」那段，讓這段邏輯明確排除 `unit0`
  - 所有相關註解同步更新
- `app/src/style.css`：`.world-section`/`.world-title`/`.world-coming-soon` → `.unit-section`/`.unit-title`/`.unit-coming-soon`（`.unit-zero-section`/`.unit-zero-hint` 已經是對的名稱，不用動）
- `app/src/types.ts`：`BadgeCategory` 的 `"world_completion"` → `"unit_completion"`
- `app/scripts/verify-world-completion-badges.ts`：檔名改成 `verify-unit-completion-badges.ts`，內部整組 `WorldConfig`/`WORLDS` 鏡像 fixture、測試案例文字、`isWorldCompletionAchieved` 呼叫都要同步改
- `app/scripts/verify-flashcard-logic.ts`：註解裡提到 `world_completion` 的地方順手改成 `unit_completion`（純註解，優先度低）
- 驗證：改完跑 `npm run build`（含 `tsc --noEmit`）、跑全部 `verify-*.ts`、重新產生 `app/demo-standalone.html` 並同步複製到專案根目錄的 `demo-standalone.html`

## 建議執行順序

1. 先由技術端一次做完 C 段（`main.ts`／`style.css`／`types.ts`／`verify-world-completion-badges.ts`），因為這段互相牽連最深，改一半會建置失敗。
2. 技術端完成、`npm run build` 過了之後，我立刻同步做 B 段（`content/badges/badges.json`），把徽章 ID／文字改過去，避免空窗期。
3. 我這邊獨立完成 A 段（純文件，跟前面順序無關，隨時可以做）。
4. 全部改完後，實際打開 App／`demo-standalone.html` 走一次首頁，確認「單元 0」～「單元六」都正確顯示、隨便完成幾個 Stage D 觸發一次徽章判斷，確認 `unit_completion` 徽章邏輯沒壞掉。

這份計劃你如果沒有其他意見，我就照這個分工開始動手：先寫一份給技術端的 handoff prompt（涵蓋上面 C 段的完整改動清單），同時我自己先把 A 段的文件類改動做掉；B 段（`badges.json`）會等技術端那邊完成、跟你確認後再一起收尾。
