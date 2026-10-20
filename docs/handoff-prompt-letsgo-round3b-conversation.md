# Handoff：第三輪-B 會話練習（Stage E）回歸

*撰寫：2026-10-04（內容端）｜執行對象：`/Users/admin/VK Agent/English for Kids LetsGo/`（App 端）｜規劃見原專案 `docs/plan-letsgo-round3-games-story-badges.md` §2*
*只改新專案；不要動原專案。可與第三輪-A（遊戲室）分開執行。*

## 1. 內容端已備妥

- `content/level4/unit{1,2,3}/conversation.json`：**單一物件**（不是陣列），格式與原站 `conversation.schema.json` 完全相同——`id`（`l4u1.conv.01`）、`topic`（Unit key `l4u1`）、`title`、`character`（Benny）、`scenes`、`turns`（每回合 3 個選項、1 個 `is_correct`，錯誤選項帶 `hint`）。每則 6 回合、3 個場景。故事：Unit 1 Benny's Camping Trip、Unit 2 Benny's Dream Day、Unit 3 Benny's Birthday Party。選項順序由 App 隨機打亂（原站行為，維持）。
- 場景圖檔名：`l4u1_scene_1.jpg` … `l4u3_scene_3.jpg`，**插圖由使用者另外生成**（提示詞見原專案 `docs/image-prompt-letsgo-scenes.md`），生成後會放入 `app/src/assets/scenes/`。**現在圖還沒有，App 必須能在沒有圖的情況下正常運作。**
- Unit 4 以後暫時沒有 `conversation.json`，App 需容忍。

## 2. 要做的事

1. **恢復程式**（自原專案 `English for Kids/app/src/` 複製並改接 Level／Unit）：`conversationGame.ts`；`main.ts` 中的 `renderConversation()`、會話畫面（screen `conversation`）與對應樣式；`types.ts` 的 Conversation 相關型別；`speech.ts` 中 Stage E 專用的 Benny／使用者雙角色語音（`pickBennyVoice` 與 Stage E TTS 函式）。語音實驗室（Voice Lab）與其設定頁**不要恢復**；若 Benny 語音沒有設定頁也要能運作（用 `speech.ts` 的自動偵測）。
2. **內容載入**：`content.ts` 新增 `import.meta.glob("../../content/level*/unit*/conversation.json", { eager: true, import: "default" })`，以路徑解析 Level／Unit，索引成 `conversationByUnit["l4u1"]`。沒有檔案的 Unit 回傳 `undefined`。
3. **圖片**：以 `import.meta.glob("./assets/scenes/*.jpg", { eager: true, query: "?url", import: "default" })`（或你判斷更適合 `assetsInlineLimit` 的方式）依 `scene.image` 檔名解析。**找不到圖時的 fallback**：用該 Unit 色票的色塊底圖，上面顯示 `scene.description`（英文，小字、次要色）；不得報錯或顯示破圖。圖補進去後不需改程式。
4. **入口位置**（沿用原站設計）：Stage D 通關後出現**選擇性**的「進入 Stage E 會話練習」。這顆是全站唯一允許使用 `primary-btn--reward` 的轉場鈕；**按鈕文字不加 emoji**；其他重玩鈕一律 `secondary-btn`。該 Unit 沒有 `conversation.json` 時不顯示。同時在 Unit 選單的關卡列表加入 Stage E 一列（Stage D 通過後解鎖，樣式與狀態沿用其他 Stage），讓孩子之後可以直接重玩。
5. **進度、星等**：沿用 Stage 計算規則；進度 key 以 Unit 命名（`l4u1:` 前綴，與其他 Stage 一致）。答對回合數、答錯次數、正確率的紀錄方式比照原站 Stage E。
6. **完成畫面**：沿用原站樣式，但文字／邊框色用 `-700` 色階（`--color-success-700` 等），重玩鈕為 `secondary-btn`、不加 emoji（見原站 style-refresh-v6 的規範）。
7. **Schema**：`content/schema/` 補 `conversation.schema.json`（由原專案複製）；`topic` 說明改為 Unit key；`scene.image` 說明註明「可缺檔，App 會 fallback」。
8. **驗證腳本**：`verify-level-unit-content.ts` 新增 conversation 檢查——每回合恰 1 個 `is_correct`、選項數為 3、`turn.scene_id` 存在於 `scenes`、錯誤選項有 `hint`、`id`／`topic` 與 Unit 一致；圖檔缺少只列為**警告**（輸出缺少幾張），不得使驗證失敗；輸出各 Unit 回合數（目前各 6）。

## 3. 驗證

1. `npm run build`、`npm run build:standalone`、全部 verify 腳本通過。
2. 在**沒有場景圖**的狀態下，Unit 1–3 各跑完一輪 Stage E：fallback 底圖顯示正常、場景切換正常、Benny 台詞自動朗讀、選對／選錯與 hint 顯示正確、答完出現完成畫面與星等。
3. 臨時放一張測試圖（例如複製原專案任一場景圖並改名為 `l4u1_scene_1.jpg`）確認圖會顯示，測完移除。
4. Stage D 通關後的 CTA 顯示正確且只有這顆是 reward 樣式；Unit 4–8 沒有 CTA、不報錯。
5. 手機（390px）與平板（820px）截圖檢查對話畫面（場景圖區、對話泡泡、三個選項、hint）。
6. 全專案 grep：不得出現教材書名／出版社名、舊站主題 key、Voice Lab 殘留引用。
7. 在新專案 `HANDOFF.md` 記錄結果與未完成項目。
8. 不要修改 `content/level4/` 內容檔；若發現劇本問題（例如某回合選項不好或 hint 不清楚），回報內容端修正。
