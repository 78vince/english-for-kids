# 兒童英語學習平台（English for Kids）

> 目前狀態：Phase 3 完成，已正式上架 GitHub Pages：<https://78vince.github.io/english-for-kids/>。Phase 1（四種文字型題型、登入登出、成效追蹤）已完成；Phase 2（擴充主題、成就徽章、單字收藏、字卡學習單元、進度視覺分級）已完成，課程內容（content 端）與 App 端接線都已全部 43 個正式主題（含 Unit 0 兩個暖身主題，全站合計 45 個主題）建置並上線完成，單元 0～七全部可以在畫面上實際玩到。

## 這個專案是什麼

English for Kids 是一個以台灣國小階段常見英語學習主題為範圍的兒童英語學習平台，用「主題式單字 → 句型 → 短文」的遊戲化關卡，讓孩子在家就能複習英文。

不需要老師帳號、不需要家長綁定，登入後直接開始玩；也不做班級排行或跟其他小朋友比較——每個使用者看到的，只有自己的學習紀錄跟成就徽章。

## 使用緣起

市面上不少兒童英語學習教材，不是偏教室團體使用，就是要另外付費訂閱。想做一個免安裝、免付費、在家就能用瀏覽器打開的版本，讓孩子用類似闖關遊戲的方式，一步步練熟國小階段常見的單字、句型跟短文閱讀。

設計上刻意避開會讓孩子有壓力或比較心態的元素：沒有排行榜、沒有跟其他人的名次比較、也不會用負面的顏色或文字去強調「表現不好」。徽章與進度分級只回饋「這次比上次更熟了」，希望英文複習本身能維持在一個輕鬆、正向的節奏裡。

專案完成到一定程度後，預計會開源到 GitHub，讓有同樣需求的家庭也能直接使用，或依自己孩子的程度調整內容。

## 內容來源與聲明

單字範圍參考台灣國小階段常見的英語學習主題自行整理、篩選、編寫而成，實際例句、短文與題目皆為原創撰寫。

本專案為個人／家庭自製的學習輔助工具，非任何測驗機構之官方產品或教材，與任何測驗機構、出版社皆無合作或代言關係，內容亦非用於準備特定測驗之官方題庫。

## 專案結構

```
English for Kids/
├── app/            前端 App（Vite + TypeScript，Phase 1 開發中）
├── content/        課程內容（單字／句子／短文 JSON，single source of truth）
├── docs/           規劃文件（內容規劃、交接文件）
└── HANDOFF.md      專案交接文件
```

## 開發

```
cd app
npm install
npm run dev
```

## 上傳更新到 GitHub

雙擊專案根目錄的 [`上傳更新.command`](./上傳更新.command)，會自動依序執行：建置檢查（`npm run build`）→ 跑全部驗證腳本 → 顯示變更清單 → 詢問確認後 commit → `git push`。不用再手動一行一行下指令。

第一次雙擊如果被 macOS 擋下（顯示「無法辨識開發者」），改成對檔案按右鍵→打開，確認一次「打開」即可，之後就能正常雙擊。

## 作者

Vincent - 小禮
聯絡信箱：78vince@gmail.com

## 授權

本專案採用 [創用 CC 姓名標示-非商業性 4.0 國際](https://creativecommons.org/licenses/by-nc/4.0/deed.zh_TW)（CC BY-NC 4.0）授權，歡迎自由使用、修改、分享，但不得作商業用途，且需標示出處。完整條款見 [`LICENSE`](./LICENSE)。

## TODO

- [x] Phase 1：四種文字型題型（Stage A 單字配對／Stage B-1 句子排序／Stage B-2 句子填空／Stage C 短文理解／Stage D 綜合關卡）、登入登出、成效追蹤
- [x] 成就徽章系統（43 個徽章）、單字收藏功能、字卡學習單元、題型選單與挑戰紀錄頁的進度視覺分級、App 內「關於本站」頁面（版本／作者資訊）
- [x] Phase 2 內容擴充（content 端）：32 個主題（含 Unit 0 兩個暖身主題）單字／句子／短文資料已全部建置完成並通過驗證，共 672 個單字、279 句、32 篇短文。單元一原本的 Personal characteristics 已拆成 Appearance／Emotions／Personality traits 三個新主題（單元一因此變成 6 個主題）；單元六「時間與節日」原規劃 3 個主題，因 Time 候選字過多拆成 Time 與 Calendar 兩個主題，最終變成 4 個主題（Time、Calendar、Holidays & festivals、Sizes & measurements）；2026-08-25：單元三的 Colors 改名擴充為「Art 美術」、Numbers 改名擴充為「Math 數學」（沿用原 fileKey），並新增 Science 自然科學主題（20 字），單元三因此變成 6 個主題
- [x] Phase 2 App 端接線：全部 32 個主題（含 Unit 0 兩個暖身主題）都已接進 `app/src/main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS`，單元 0～六全部可以在 App 選單裡實際玩到；Colors／Numbers 顯示名稱已改為 Art／Math，Science 自然科學主題已上線
- [x] 新增單元七「文法小幫手」11 個主題（content 端）：Advanced Pronouns／Wh-Words & Frequency／Articles & Determiners／Sentence Connectors／Prepositions／Other Nouns／Other Verbs I・II／Other Adjectives I・II／Other Adverbs & Responses，正式推翻原本「文法/功能詞不獨立成關卡」的規劃（見 `docs/content-plan.md` 3.2 節），單字／句子／短文資料與驗證腳本、成就徽章系統（新增 WC-07「文法小幫手」）皆已完成並通過驗證
- [x] Phase 2 App 端接線（單元七）：`main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS` 已新增單元七 11 個主題並上線，全部 43 個正式主題（含單元 0 共 45 個）現在都已接進 App 選單可玩
- [x] 決定並補上開源授權條款：CC BY-NC 4.0（見 `LICENSE`）
- [x] Phase 3：上架 GitHub Pages，正式站：<https://78vince.github.io/english-for-kids/>；首次進站提醒 popup＋「關於本站」常駐使用須知段落已完成並上線
- [ ] Phase 4：語音辨識與口說題型（延後）

（頁面左右側裝飾性背景圖：已規劃兩款羊毛氈字母提示詞，決定先不做，暫緩）
