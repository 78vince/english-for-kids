# 圖片生成提示詞——填字遊戲背景（柔和字母塗鴉）

用途：遊戲室第二款遊戲「填字遊戲」的畫面背景。目前 `crosswordStandalone.css` 只有純色背景（`--color-crossword-pink-bg`，#FFF1FA 淡粉色），這張圖是要取代/疊加在這片淡粉色底色上面的氛圍背景，字母格子網格、拖曳的字母方塊、提示詞文字框都會疊加顯示在上面，所以背景本身要夠柔和、對比不能太強，不能搶走前景網格/文字的視覺焦點。風格比照專案既有情境插畫（Stage E 會話練習用的水彩/水粉插畫，見 `docs/scenes-generation-queue.md`）跟戳泡泡遊戲背景（`docs/image-prompt-bubble-pop-background.md`）同一套美術基調，純粹是氛圍背景圖，不需要角色、不需要場景敘事。

## 提示詞（英文，供圖片生成工具使用）

```
Full-frame flat illustration background, no text, no readable letters or words, no characters. A soft, dreamy, cozy paper-like background painted in warm gouache/watercolor style with visible soft brush texture, in a warm cream and pale lavender color palette. Scattered across the background are a few loose, abstract, gently blurred alphabet-block shapes and puzzle-piece silhouettes, rendered softly out of focus like bokeh, suggesting a word-game theme without forming any actual legible letters or words. The overall composition should feel calm, playful, and cheerful, suitable for a young children's educational app. Leave the center and lower two-thirds of the composition open, uncluttered, and low-contrast, since interactive crossword grid elements will be layered on top digitally — avoid dense detail, sharp shapes, or any additional foreground objects in that central area; keep the blurred alphabet-block and puzzle-piece shapes concentrated near the top edges and corners as gentle framing. Colors should feel warm, soft, and inviting rather than cold, stark, or saturated. 4:3 aspect ratio, no vignette, no dark corners, no text or logos anywhere in the image.
```

## 給圖片生成 agent 的補充說明

- **構圖留白很重要**：畫面中央跟下方三分之二要留乾淨、對比低的區域，因為之後會在上面疊放字母格子網格跟拖曳用的字母方塊，如果背景本身細節/對比太強，格子跟字母會看不清楚。
- **色彩**：這次刻意選暖米色＋淡薰衣草紫的中性色調，**不要用粉色**——因為這款遊戲的 UI 本身（版面、按鈕、格子邊框）已經是粉色系（`--color-crossword-pink-*`），背景如果也用粉色會整片糊在一起、前景 UI 會不明顯。比照戳泡泡「背景跟 UI 用不同柔和色調互相襯托」的做法，這裡背景選中性暖色，讓粉色 UI 元素能跳出來。
- **不要出現任何看得懂的文字或字母**：雖然主題是「字母/拼字」，但畫面裡的字母塊/拼圖形狀要刻意模糊、抽象化、不對焦，只是氛圍暗示，不能出現任何清楚可讀的字母或單字（避免跟遊戲裡真正要拼的單字混淆，也避免對比太清楚喧賓奪主）。
- **不要放人物/角色**：純粹氛圍背景，跟 Stage E 情境插圖（有角色 Benny）不同。
- **尺寸**：跟戳泡泡背景一致抓 4:3 比例，實際輸出解析度依生成工具預設即可，之後由 App 端壓縮處理（比照先前 129 張情境插畫、戳泡泡背景的壓縮流程）。
- **檔案存放路徑**：完成後請存到 `app/src/assets/games/crossword-letters-bg.jpg`（比照 `app/src/assets/games/bubble-pop-sky-bg.jpg` 的既有命名慣例，遊戲相關美術素材集中放在這個資料夾底下）。
