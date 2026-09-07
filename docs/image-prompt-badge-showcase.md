# 圖片生成提示詞 — 成就徽章設計理念簡介圖（v2：沿用現有徽章圖）

## 先說一個技術限制：沒有「正式站上的徽章圖片網址」

去正式站的成就徽章頁面實際檢查過，徽章圖是用 base64 直接內嵌進打包後的 JS／HTML 裡（`app/vite.config.ts` 的 `assetsInlineLimit` 設定造成的，當初是為了讓 `demo-standalone.html` 能單檔獨立運作），**不是個別檔案，所以沒有獨立的圖片網址可以貼**。

能直接拿來用的是本機的原始素材檔（1024×1024，畫質比正式站上顯示的 200×200 縮圖好很多），這 7 個徽章分別對應：

| 徽章名稱 | 代號 | 檔案路徑 |
|---|---|---|
| 我來了！ | OB-01 | `English for Kids/assets/badge/OB-01.png` |
| 字彙大師 | VM-05 | `English for Kids/assets/badge/VM-05.png` |
| 練習專家 | QM-03 | `English for Kids/assets/badge/QM-03.png` |
| 配對新手 | GM-01 | `English for Kids/assets/badge/GM-01.png` |
| 生活情境 | WC-05 | `English for Kids/assets/badge/WC-05.png` |
| 七日不間斷 | SK-02 | `English for Kids/assets/badge/SK-02.png` |
| 假日學習家 | HH-02 | `English for Kids/assets/badge/HH-02.png` |

**這次的重點是直接使用這 7 張既有圖檔合成排版，不要重新生成徽章美術**——把上面 7 個檔案當成圖片輸入／參考圖附給圖片生成 agent（連同 `Resume Website/assets/img-works/EK/ek_platform_showcase.jpg` 當抬頭排版參考），再依照下面的說明排版。

## Prompt（附上圖片後貼給圖片生成 agent）

```
Use the 7 attached badge images exactly as they are — do NOT redraw, restyle, or regenerate any badge artwork. This is a layout/composition task, not an art-generation task.

Compose them into a single promotional explainer graphic that helps parents understand the DESIGN PURPOSE of the achievement badge system in a children's English-learning app called "English for Kids" — not just "here are some badges" but "here's why we designed badges this way."

BACKGROUND & HEADER (match the attached reference screenshot's style):
- Warm off-white / cream background (soft warm beige, around #F2EFE9), flat, minimal, soft subtle shadows only.
- Top-left header: "ENGLISH FOR KIDS" in a dark navy serif font, all caps, letter-spaced, with a thin vertical divider and "成就徽章設計理念" in a lighter warm gray sans-serif font next to it, smaller size — same header treatment/position as the reference image.
- Landscape composition, roughly 16:9, generous margins, nothing touching the edges.

LAYOUT — 7 badges arranged in a single tidy row or a gentle arc across the middle of the frame, each badge floating with a soft drop shadow, evenly spaced, all roughly the same size:

For each badge, place a short caption directly below it (small, clean sans-serif, dark gray text, centered) using exactly this text:

1. 我來了！ — 新手引導：第一次登入就有的第一個徽章
2. 字彙大師 — 單字里程碑：累積學會的單字量
3. 練習專家 — 練習里程碑：累積完成的練習題數
4. 配對新手 — 題型熟練度：個別題型練習到一定次數
5. 生活情境 — 單元完成：走完一個主題單元的全部關卡
6. 七日不間斷 — 連續學習：鼓勵每天玩一點的習慣
7. 假日學習家 — 健康學習習慣：連假期間也保持學習節奏

Below the row of badges, leave room for one closing line of text (dark navy, medium weight, centered): "每一種徽章，都在鼓勵孩子用不同的方式持續進步"

Do not add any badges other than the 7 provided. Do not include device mockups, screenshots, or UI chrome — just the cream background, header, the 7 real badge images with captions, and the closing line.
```

## 補充說明

- 這 7 個徽章刻意涵蓋了新手引導、單字里程碑、練習里程碑、題型熟練度、單元完成、連續學習、健康學習習慣等大部分徽章分類（僅缺「總天數」「表現」「收藏家」三類未入選），適合用來說明「徽章系統背後在鼓勵孩子哪些不同面向的學習行為」。
- 如果生成工具的圖片輸入介面只接受網址、不接受本機檔案上傳，就沒辦法用這個方法——這種情況要嘛換一個支援上傳圖片的工具，要嘛退回上一版「純文字重新生成徽章風格」的做法（原本的 prompt 已經被這次覆蓋掉，需要的話跟我說一聲我可以再補回來）。
