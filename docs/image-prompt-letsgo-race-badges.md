# 繪圖提示詞：賽跑徽章（5 張，自動化流程用）

*撰寫：2026-10-11（內容端）｜生成：使用者（自動化）｜機器可讀版本：`image-prompt-letsgo-race-badges.manifest.json`（欄位 `code`、`prompt`、`raw_png`、`final_jpg`）*
*對應企劃：`docs/plan-game-level1-race.md` §8；沿用既有 Skill `kids-badge-2-generator`（羊毛氈＋黏土、1024×1024、圓徑 800、留白 112、純白無陰影、無文字）。*

## 存儲位置與命名規則

| 階段 | 位置 | 檔名 | 規格 |
|---|---|---|---|
| 1. 原圖（生成輸出） | `/Users/admin/VK Agent/image-generator-skill/for Kids/badge 2/` | `<code>.png`，例：`RC-01.png` | 1024×1024 PNG，純白背景 |
| 2. 成品（App 使用） | `/Users/admin/VK Agent/English for Kids LetsGo/app/src/assets/badges/` | `<code>.jpg`，例：`RC-01.jpg` | 200×200 JPG（品質 85–90，裁切方式同既有徽章） |

- 檔名＝徽章代號 `RC-01`～`RC-05`（RC＝Race Champion；格式 `^RC-0[1-9]$`）。App 的 `badgeImages.ts` 依檔名自動對應，放進去即生效。
- 不要覆蓋其他前綴（OB/VM/GM/CS…）的既有檔案；重新生成同一張時直接覆蓋同名檔；原圖 PNG 保留、不放進 `app/`。
- 後處理（縮圖）：`python3 -c "from PIL import Image; im=Image.open('RC-01.png').convert('RGB'); im.resize((200,200), Image.LANCZOS).save('<成品路徑>/RC-01.jpg', quality=88)"`（先檢查圓形四周留白一致再縮圖）。

## 徽章清單（分類 `race`、類型 `one_time`、狀態 `draft`）

| 代號 | 名稱 | 條件 |
|---|---|---|
| `RC-01` | 烏龜首勝 | 贏過第 1 場（烏龜） |
| `RC-02` | 兔子追不上 | 贏過第 2 場（兔子） |
| `RC-03` | 鴕鳥克星 | 贏過第 3 場（鴕鳥） |
| `RC-04` | 全三星 | 三場賽跑都拿到三顆星 |
| `RC-05` | 零失誤 | 任一場賽跑沒撞到任何障礙就獲勝 |

資料來源：App 賽跑存檔（每場最佳名次、星等、是否零撞擊，見 `docs/handoff-prompt-letsgo-race.md` §存檔）。徽章與稱號只發一次，重玩不重複發。

## 共用骨架（每張替換 `Main subject:` 那行）

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: [SUBJECT].
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

## 各張完整提示詞（可直接送出）

### RC-01｜烏龜首勝

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A cheerful felt turtle with a bumpy clay shell wearing a tiny clay silver medal, waving a little felt hat at a tiny felt kid doll who is crossing a clay checkered finish ribbon, goofy googly eyes.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### RC-02｜兔子追不上

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A sleepy fluffy felt bunny snoring on a clay carrot pillow with tiny Z bubbles, while a tiny felt kid doll runs past with a clay gold medal swinging, long floppy felt ears, goofy googly eyes.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### RC-03｜鴕鳥克星

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A tall wobbly felt ostrich with long pink neck and fluffy white wool tail feathers looking surprised, a tiny felt kid doll standing on a clay winner podium holding a big shiny clay trophy, goofy googly eyes.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### RC-04｜全三星

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: Three goofy felt animals (turtle, bunny, ostrich) standing in a row in front of a clay podium, each holding up three chunky yellow clay stars, tiny confetti made of felt, big googly eyes.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### RC-05｜零失誤

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A tiny felt kid doll sprinting through a tunnel of clay rocks, mud puddles and hanging branches without touching anything, glowing clay sparkles trailing behind the shoes, proud winking googly eye.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```
