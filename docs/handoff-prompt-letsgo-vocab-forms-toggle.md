# Handoff：單字卡字族顯示改成可展開的「big, bigger, biggest」（App 端）

*撰寫：2026-10-12（內容端，依使用者看過 App 畫面後的回饋）｜執行對象：App 端 `app/`（單字總覽卡片）｜內容檔不用改*

## 使用者回饋
1. 字族要把**三個形態都列出來**：`big, bigger, biggest`（原級也要在裡面，目前只顯示 `→ bigger, biggest`）。
2. 目前前面的 `→` 看不出來可以點開。請參考卡片下方「例句 ▲」的作法：**後置的三角形符號**，並有 hover／active 樣式。

## 請 App 端修改
1. 字串：`[原級] + related_forms` 以「, 」連接，例如 `big, bigger, biggest`、`good, better, best`、`easy, easier, easiest`。原級可用與標題一致的字重，其餘形態用次要色，方便看出變化。
2. 觸發方式：整列做成按鈕（`<button>`），文字後面放 ▲／▼（展開時 ▲、收合時 ▼，與「例句」同一組圖示與顏色）；移除前面的 `→`。
3. 互動樣式：與「例句 ▲」一致——hover 時文字／符號變深（或底色微亮）、游標 pointer；active 時略縮或加深；鍵盤聚焦有 focus ring；`aria-expanded` 與 `aria-controls`。觸控裝置不要依賴 hover，三角形本身就要看得出可點。
4. 展開內容：每個形態各一行（big／bigger／biggest），帶喇叭（朗讀該形態）與詞形標示（原級／比較級／最高級；不規則字如 good, better, best 同樣標示）。收合時只顯示一行字族字串。
5. 沒有 `related_forms` 的單字不顯示這一列；其他 Unit 不受影響。

## 驗收
- 卡片上看得出這一行可以點開（符號與例句同款）；hover、active、focus 都有明顯變化。
- 展開後三個形態都能朗讀；手機 390px、平板 820px 不換行破版、無水平捲動。
