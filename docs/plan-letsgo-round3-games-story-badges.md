# 規劃：Level N - Unit N 獨立 app 第三輪（遊戲室回歸／會話故事／規則式徽章）

*撰寫：2026-10-04（內容端）｜對象專案：`English for Kids LetsGo/`*
*狀態：規劃稿，待使用者確認後才拆成各項 handoff 與內容製作。*

## 0. 已確認的決定

- 遊戲室：只帶回現行上架的兩款——**填字遊戲**、**戳泡泡**（翻牌配對、語音練習先不帶）。
- 會話練習（Stage E）：每個 Unit 一則原創故事，沿用角色 Benny＋場景插圖（插圖由使用者另外生成，內容端負責劇本與繪圖提示詞）。
- 徽章：改為可擴充 Level／Unit 的規則式徽章，圖案一併重做（提示詞由內容端寫，使用者生成）。
- 流程：先規劃、確認後再拆 handoff。

## 1. 遊戲室（填字＋戳泡泡）

**原站做法（已查證）**：`games.json` 上架清單 → 遊戲各自是獨立 HTML 頁（iframe）→ `gameBridge`/`speech` 共用；填字吃 `crosswords/*.json`（每個檔一個關卡，含格子與詞座標），戳泡泡直接從各主題 vocab 組題；玩一次花遊戲代幣（兩款都是 5）。

**新 app 的改動**

| 項目 | 做法 | 負責 |
|---|---|---|
| 程式 | 從原專案 `app/games/`、`src/games/`（填字、戳泡泡）、`gameBridge.ts`、`gameTokens.ts`、`gameHighScores.ts` 複製回來；`vite.config.ts` 新增兩個 entry；遊戲室入口回到首頁 | App |
| 戳泡泡題源 | 原本從多主題 vocab 組題 → 改成讀 Level／Unit vocab：預設「目前已開放 Unit 的單字」，提供「單一 Unit」選項。**不需要額外內容** | App |
| 填字題源 | 新格式 `content/level4/unit{N}/crossword.json`（每 Unit 至少 1 關，之後可 2 關） | 內容端出題、App 接線 |
| 遊戲清單 | 新增 `content/games/games.json`，只列兩款，沿用 schema | 內容端 |
| 代幣與高分 | 沿用既有機制；key 前綴維持 `levelUnitReview.` | App |

**填字內容限制（內容端的作法）**：填字只能用單一英文單字（無空格），所以每個 Unit 只挑單字型詞彙，片語（a towel、climb a mountain 等）不入題。Unit 1 可用 cool/cold/warm/hot/humid/foggy、helmet、skateboard、bucket、towel、tent…；Unit 2 可用 astronaut、singer、musician、writer、scientist、engineer、architect…；Unit 3 用月份與序數詞。我會寫一支腳本自動檢查格子合法性（交叉字母一致、無相鄰誤連、座標不越界）再交付，避免做出解不開的關卡。

**技術風險（交給 App 端確認）**：遊戲是 iframe 獨立頁。原專案踩過 `file://` 單檔版的 chunk 問題，之後用 `vite-plugin-singlefile` 修好，且單檔版只含 `main`。遊戲室回來後，請 App 端先確認：① 區網 `dist` 版（主要使用方式）遊戲正常；② 單檔 standalone 版遊戲室要不要降級（隱藏入口並說明），不要為了單檔版把遊戲 inline 進去而增加複雜度。

## 2. 會話故事（Stage E 回歸）

**原站格式（已查證 `conversation.schema.json`）**：角色、`scenes`（場景圖與描述）、`turns`（角色台詞＋3 個選項，其中 1 個 `is_correct`，錯誤選項有 `hint`）。App 的 `conversationGame.ts` 與 Benny 對話語音在第一輪被刪，需要從原專案恢復。

**新 app 的改動**

- 資料：`content/level4/unit{N}/conversation.json`，ID 用 `l4u{N}.conv.01`；schema 沿用原格式（`topic` 改為單元 key `l4u{N}`）。
- 位置：維持原本設計——Stage D 通關後出現**選擇性**的「進入 Stage E 會話練習」（`primary-btn--reward` 專屬這顆，其他重玩鈕一律 `secondary-btn`，不加 emoji）。
- 圖片找不到時不報錯，用色塊＋場景描述當底圖，讓劇本可先上線、插圖之後補。
- 進度、星等沿用 Stage 計算；徽章見 §3。

**內容端製作規格**

- 每 Unit 1 則，3 個場景、約 6 個回合；對話只用該 Unit 的單字與句型，並在回合中刻意練到該 Unit 的文法重點（錯誤選項設計成孩子常見的文法錯誤，`hint` 用簡單中文說明為什麼）。
- 完全原創，不用課本角色與情節；角色只有 Benny（原站吉祥物）與少量路人朋友。
- 初步故事構想（可再調整）：
  - **Unit 1 Benny's Camping Trip**：看天氣預報（It's going to be…）→ 整理露營要帶什麼（What do I need?／You need…）→ 到營地。
  - **Unit 2 Benny's Dream Day**：學校「夢想日」，朋友們說想當什麼、想做什麼（What does she want to be／do?），輪到 Benny。
  - **Unit 3 Benny's Birthday Party**：邀請朋友、問日期（When's your birthday? It's on the…），聊上週末發生的事（What did you do? I…／過去式）。
- 同時交付每個場景的**繪圖提示詞**（3 場景 × 3 Unit = 9 張），風格對齊原站 129 張場景插圖，使用者自行生成後放入指定檔名（`l4u1_scene_1.jpg` 這類）。

## 3. 規則式徽章

**現況（新專案 `badges.json` 44 枚）**：Unit 完成徽章是 `l4u1`~`l4u8` 逐枚寫死，Level 5、6 來了就要手動再加；沒有會話與遊戲室相關徽章。

**新設計原則**：能由 `level.json` 推算的，就用「範本」自動產生，不要逐枚寫死。

| 類別 | 規則 | 備註 |
|---|---|---|
| 單元完成 | 範本：每個 Level 的每個 Unit 一枚「完成 Level {L} - Unit {N}」（通過該 Unit Stage D） | 依 `level.json` 的 `planned_units` 自動生成；尚未開放的 Unit 顯示鎖定 |
| Level 完成 | 範本：每個 Level 一枚「完成 Level {L}」（該 Level 所有 Unit 皆通過 Stage D） | 門檻 = `planned_units`，不寫死 8 |
| 單元精熟 | 範本：每 Unit 一枚「Unit {N} 三星」（該 Unit 所有 Stage 皆 3 星） | 新增，鼓勵回頭重練 |
| 單元進度里程碑 | 累計完成 Unit 數 3／5／全部 | 取代舊的零散做法，跨 Level 累計 |
| 會話 | 完成第 1 則故事／完成 5 則／完成當前 Level 全部故事；會話題數 30／150（接 `game_mastery` 的新手／大師） | 新增 |
| 遊戲室 | 填字通關 1／10 次、戳泡泡通關 1／10 次、兩款都玩過 | 新增，用 `gameHighScores` 與遊戲紀錄 |
| 保留 | 登入、收藏、單字量里程碑、題數里程碑、題型新手／大師（配對、排序、填空、句型）、連續天數、累計天數、完美關卡、連勝、健康習慣 | 規則不變；單字量「all」已是動態門檻 |

**資料格式**：`badges.json` 允許條目帶 `generate`（`per_unit`、`per_level`）與名稱／說明中的 `{L}`、`{N}` 佔位，由 App 依 `level.json` 展開；固定徽章維持原格式。徽章圖案：單元徽章用「Level 色＋數字」的共用範本由程式疊字（不需每 Unit 一張圖），Level 完成、單元精熟、會話、遊戲室各一張專屬圖。

**圖案**：沿用既有單色扁平風格；內容端交付「徽章圖案清單＋繪圖提示詞」（預估 10–12 張專屬圖＋3 張 Level 色範本底圖），使用者生成後放入指定檔名。

## 4. 建議的執行順序

1. **第 1 階段：遊戲室**——App 端恢復兩款遊戲並改接 Level／Unit 題源；內容端同步出填字題庫（Unit 1–3 各 1 關）與 `games.json`。
2. **第 2 階段：會話故事**——內容端寫 3 則劇本與 9 張插圖提示詞；App 端恢復 Stage E（可先無圖上線）；使用者生成插圖。
3. **第 3 階段：徽章**——內容端定案 `badges.json` 範本與圖案清單／提示詞；App 端實作展開與新判定（精熟、會話、遊戲室）；使用者生成圖案後換上。

三個階段互相不阻擋，只有徽章中的「會話」「遊戲室」類需要前兩階段的進度資料，所以排在最後。

## 5. 需要您確認

1. 上述範圍與順序是否 OK？若想調整（例如先做會話再做遊戲室），直接說。
2. 填字每個 Unit 先 1 關是否足夠？（Unit 4 以後我會繼續每 Unit 出 1 關。）
3. 單元精熟徽章（全 Stage 三星）要不要？它會讓孩子回頭重玩，但也可能增加挫折；不要的話我就移除這一列。
4. 故事主角維持 Benny、風格延用原站——這點同意嗎？
