# 繪圖提示詞：Level 4 會話故事場景插圖（9 張）

*撰寫：2026-10-04（內容端）｜生成：使用者｜對應資料：`content-letsgo/level4/unit{1,2,3}/conversation.json`*

## 規格

- 風格、尺寸與原站 129 張情境插畫一致：溫暖童趣的水彩與不透明水彩（gouache）繪本風格，色彩溫暖明亮；既有檔案實際尺寸為 **1376×768**，請用同樣比例輸出 JPG。
- 檔名與存放：生成後依下表檔名放入**新專案** `app/src/assets/scenes/`（資料夾沒有就新建）。
- 圖上**不要出現任何文字**（含招牌、標語、日曆數字；需要時用抽象圖形代替），避免與畫面上的英文對話衝突。
- 內容尺度：孩子友善、無暴力、無品牌商標。
- 角色一致性（每張都要附上）：
  - **Benny**：溫暖棕色的泰迪熊（毛絨質感、圓圓的耳朵與鼻子、微笑的眼睛），脖子繫一條**藍色小花紋領巾**，身體乾淨、沒有補丁與縫線。
  - **孩子主角（玩家的朋友）**：棕色蓬鬆短髮的小男孩，綠白條紋上衣＋綠色吊帶褲（與原站場景一致；若某張不需要出現就省略）。
  - **Mia**：留著及肩棕色捲髮、戴粉色髮夾的小女孩。
  - **Leo**：黑色短髮、戴圓框眼鏡的小男孩。

## 共用前綴（每張都貼在最前面）

```
Warm children's picture-book illustration in soft watercolor and gouache, bright cozy colors, gentle outlines, 16:9 landscape (1376x768), no text, no letters, no logos. Characters: Benny, a friendly brown teddy bear with round ears, a smiling face and a small blue patterned bandana around his neck (clean fur, no patches); a boy with messy brown hair in a green-and-white striped top and green overalls; Mia, a girl with shoulder-length curly brown hair and a pink hair clip; Leo, a boy with short black hair and round glasses.
```

## Unit 1 — Benny's Camping Trip

| 檔名 | 提示詞（接在共用前綴後） |
|---|---|
| `l4u1_scene_1.jpg` | `A cozy living room. Benny and the boy sit on a sofa watching a TV weather forecast; the TV shows a map with a big smiling sun symbol and no words. Warm afternoon light, a backpack by the sofa.` |
| `l4u1_scene_2.jpg` | `A bedroom floor with a big open backpack. Benny and Mia are packing: a small orange tent, a flashlight, a sun hat, sunglasses and a tube of sunscreen lie around them. Cheerful and busy mood.` |
| `l4u1_scene_3.jpg` | `A forest campsite at early evening. A small tent, a crackling campfire, Benny, the boy and Mia sitting on logs, a clear sky with the first stars and a soft pink-blue sunset.` |

## Unit 2 — Benny's Dream Day

| 檔名 | 提示詞 |
|---|---|
| `l4u2_scene_1.jpg` | `A bright elementary classroom. A big colorful poster on the wall (only drawings, no words) showing jobs: an astronaut, a singer, a scientist, an engineer. Benny, Mia and Leo stand beside it, pointing and smiling.` |
| `l4u2_scene_2.jpg` | `Benny, Mia and Leo sit in a circle on a rug in the classroom. Mia holds a toy microphone, Leo holds a notebook and pencil; thought-bubble style doodles above them: a boat on the sea and a big book.` |
| `l4u2_scene_3.jpg` | `A small classroom stage. Benny stands proudly wearing a paper astronaut helmet, the boy, Mia and Leo clap in front of him. Streamers and a rocket drawing in the background.` |

## Unit 3 — Benny's Birthday Party

| 檔名 | 提示詞 |
|---|---|
| `l4u3_scene_1.jpg` | `Benny sits at a wooden table making birthday invitation cards with crayons and stickers. Behind him a wall calendar with one date circled in red (no numbers, just the red circle). Sunny window.` |
| `l4u3_scene_2.jpg` | `A cheerful birthday party in a decorated room: balloons, paper garlands, a cake with lit candles on the table. Benny, the boy, Mia and Leo gather around, smiling; a kite and a small trophy sit on a shelf.` |
| `l4u3_scene_3.jpg` | `Benny looks surprised and a little embarrassed in front of a half-eaten chocolate cake, chocolate smudges on his face. The boy, Mia and Leo laugh kindly; wrapped presents pile up beside the table.` |

## 驗收與回報

- 生成後請檢查：Benny 的領巾與毛色是否一致、圖上沒有任何文字／數字、風格與原站接近。
- 圖沒到位之前，App 會用色塊加場景描述當底圖（見 handoff 第三輪-B），所以不必等圖才能上線。
- 若要重畫，告訴我是哪一張與哪裡不滿意，我調整提示詞。
