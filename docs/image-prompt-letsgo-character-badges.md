# 繪圖提示詞：角色工作室徽章（7 張，自動化流程用）

*撰寫：2026-10-08（內容端）｜生成：使用者（自動化）｜機器可讀版本：`image-prompt-letsgo-character-badges.manifest.json`（欄位 `code`、`prompt`、`raw_png`、`final_jpg`）*
*對應企劃：`docs/plan-game-level1-character-studio.md` §5.6；沿用既有 Skill `kids-badge-2-generator`（羊毛氈＋黏土、1024×1024、圓徑 800、留白 112、純白無陰影、無文字）。*

## 存儲位置與命名規則

| 階段 | 位置 | 檔名 | 規格 |
|---|---|---|---|
| 1. 原圖（生成輸出） | `/Users/admin/VK Agent/image-generator-skill/for Kids/badge 2/` | `<code>.png`，例：`CS-01.png` | 1024×1024 PNG，純白背景 |
| 2. 成品（App 使用） | `/Users/admin/VK Agent/English for Kids LetsGo/app/src/assets/badges/` | `<code>.jpg`，例：`CS-01.jpg` | 200×200 JPG（品質 85–90，裁切方式同既有徽章） |

- 檔名＝徽章代號 `CS-01`～`CS-07`（大寫 CS＋連字號＋兩位數字）；代號格式 `^CS-0[1-9]$`。App 的 `badgeImages.ts` 用 `import.meta.glob("./assets/badges/*.jpg")` 依檔名自動對應，**放進去即生效，不需改程式**。
- 不要覆蓋其他前綴（OB/VM/GM/…）的既有檔案；重新生成同一張時直接覆蓋同名檔。
- 原圖 PNG 要保留（日後重新裁切用），不放進專案 `app/`。
- 後處理（縮圖）範例：`python3 -c "from PIL import Image; im=Image.open('CS-01.png').convert('RGB'); im.resize((200,200), Image.LANCZOS).save('<成品路徑>/CS-01.jpg', quality=88)"`（沿用既有徽章流程：先檢查圓形四周留白一致再縮圖）。

## 徽章清單（建議條件，之後由 App 端接進 `content/badges/badges.json`）

| 代號 | 名稱 | 條件 |
|---|---|---|
| `CS-01` | 初次變身 | 首次儲存角色 |
| `CS-02` | 造型師 | 3 個角色槽都存過不同角色 |
| `CS-03` | 攝影新手 | 累計拍照 1 張 |
| `CS-04` | 攝影師 | 累計拍照 10 張 |
| `CS-05` | 環遊世界 | 每個場景都拍過照 |
| `CS-06` | 日夜都愛 | 白天與夜晚各拍過 1 張 |
| `CS-07` | 動作達人 | 試過所有動作 |

分類建議 `character_studio`（新分類）、類型 `one_time`、狀態 `draft`。條件資料來源：`levelUnitReview.character.v1.<profileId>` 的 `slots` 與 `stats`（`photos`、`scenesShot`，見 `docs/handoff-prompt-letsgo-character-studio.md`）；CS-07 需要工作室額外記錄 `stats.posesTried`（尚未在 handoff 中，之後補）。

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

### CS-01｜初次變身

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A goofy felt kid doll standing on a tiny clay pedestal, half of it still plain grey clay and half already dressed in a colorful felt hoodie with a tiny clay bow, little felt sparkles around, one big googly eye winking.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### CS-02｜造型師

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: Three tiny goofy felt dolls side by side wearing three different felt outfits (a hoodie, a dress, overalls), the middle one holding a clay comb and a pair of felt scissors, a tiny golden clay hanger above them.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### CS-03｜攝影新手

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A cute round clay camera with a huge googly-eye lens and a happy open mouth, a little felt strap, a tiny paper-like clay photo popping out with a smiling felt star on it.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### CS-04｜攝影師

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A goofy number "10" monster made of orange clay with googly eyes wearing a tiny felt photographer vest and holding a clay camera, a string of small clay photos clipped to a felt rope behind it.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### CS-05｜環遊世界

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A cute felt bear wearing a tiny clay explorer hat standing on a small clay globe, holding a clay camera, tiny felt trees and a felt spotlight stage on the globe.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### CS-06｜日夜都愛

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A round clay badge split in two halves: a sunny yellow felt sun with googly eyes on the left and a deep blue felt moon with googly eyes and a tiny night cap on the right, they hold a little clay camera together.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

### CS-07｜動作達人

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: A goofy felt kid doll striking a funny dance pose with arms and legs bent in different directions, tiny clay musical notes and felt stars flying around, cheeky googly eyes.
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

## 驗收

- 圓形直徑 800、四周留白 112、背景純白、圓外無投影、圖上無文字（CS-04 的數字「10」本身除外）。
- 與既有徽章同一組手作質感（羊毛氈＋黏土、搞怪大眼）。
- 縮到 200×200 後主體仍清楚；若角色細節糊掉，告訴我檔名，我簡化該張提示詞。
