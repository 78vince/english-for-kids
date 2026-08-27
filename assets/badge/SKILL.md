---
name: kids-badge-2-generator
description: 兒童英語學習平台成就徽章圖片生成 Skill。規範羊毛氈與黏土軟性手作材質、精確圓形直徑 800px 與四周留白 112px、可愛搞怪誇張風格、數字視覺主角及純白無陰影背景。
---

# Kids English Learning Badge Generator (Badge 2) Skill

本 Skill 專門用於設計與生成**兒童英語學習平台**之全套手作質感成就徽章 (Kids English Learning Achievement Badges)。

所有徽章外觀均為**正圓形**，視覺風格採用**羊毛氈 (Needle Felt)** 與 **塑形黏土 (Polymer Clay / Play-Doh)** 等軟性材質，主打真實手作感與可愛、搞怪、誇張的童趣視覺效果。

---

## 1. 核心視覺規範 (Core Visual Rules)

### 1. 精確圓形尺寸與留白規範 (Exact 800px Circle & 112px Margin)
- **尺寸範本圖檔**：[`template_blue_circle.png`](file:///Users/admin/VK%20Agent/image-generator-skill/for%20Kids/badge%202/template_blue_circle.png)
- **畫布比例**：`1:1` 正方形畫布（標準 `1024 × 1024` 像素）。
- **精確尺寸**：徽章圓形直徑必須精確為 **800 像素 (800px)**。
- **精確留白**：四周上下左右必須均勻留白 **112 像素 (112px margin)**，中心點精確對齊 (512, 512)。

### 2. 背景與陰影規範 (Background & Shadow Rules)
- **純白背景**：畫布背景必須為 100% 純白色 (`#FFFFFF` / `RGB: 255, 255, 255`)。
- **無外部陰影 (No Outer Drop Shadow)**：圓形徽章外邊線與白色背景之間**嚴禁添加投射陰影 (No drop shadow outside the circle)**。圓形外輪廓必須極致乾淨、邊緣清晰，以便於 UI 介面去背與套用。
- *註：徽章圓形牌面內部的元件之間（如黏土層次疊加）可有自然微觀陰影以展現立體質感。*

### 3. 軟性材質真實手作感 (Soft Tactile Handcrafted Texture)
- **羊毛氈 (Needle-felted Wool)**：可看見細緻的毛絨纖維、柔軟羊毛球、手針戳刺紋理與蓬鬆質感。
- **彩色塑形黏土 (Polymer Clay / Play-Doh)**：軟陶霧面質感、指尖捏塑微壓痕、厚實圓潤的邊緣與鮮豔黏土配色。
- **混合材質應用**：可將羊毛氈與黏土結合（如黏土做主體、羊毛氈做毛髮或配件），創造豐富的微觀手作寫真感 (Macro craft photograph)。

### 4. 可愛搞怪誇張美學 (Googly, Goofy & Exaggerated Style)
- **表情特色**：靈動的大滾動眼睛 (Googly eyes)、不對稱的歪嘴笑、張大嘴巴呆萌樣、浮誇驚訝表情或幽默死魚眼。
- **動態造型**：誇張肢體動作、搞笑裝飾小物（如小皇冠、Party 派對帽、小披風、星芒彩帶等）。

### 5. 數字視覺主角規則 (Number-as-Character Rule)
- 當成就主題包含明確數字指示（如：學習時間 `10 MINS`、天數 `7 DAYS`、詞彙數 `100 WORDS`、連續開卡 `30 STREAKS` 等）：
  - **必須以數字本身作為視覺主角 (Visual Hero)**。
  - 將數字捏塑成活潑生動的**「數字黏土/羊毛氈小怪獸」**（長出眼睛、嘴巴、小手小腳或角）。
  - 周圍搭配主題關聯的軟性小物襯托主角。

---

## 2. 提示詞結構與範本 (Prompt Formula & Templates)

### A. 通用提示詞結構 (Prompt Structure Formula)

```text
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: [SUBJECT / NUMBER MONSTER DESCRIPTION].
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme.
```

---

### B. 雙情境提示詞範本 (Scenario Templates)

#### 1. 數字成就主題 (數字主角)
> **範例主題**：7 天連續學習成就
```text
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft polymer clay and fuzzy needle-felted wool texture.
The central hero subject is the number "7", designed as a super cute, goofy number monster character made of vibrant yellow clay with big funny googly eyes, a goofy open mouth, tiny felt arms holding a tiny glowing star.
Thick soft teal clay round border.
Cute, exaggerated, funny childlike craft art style.
Pure solid white background (#FFFFFF), ABSOLUTELY NO drop shadow outside the circle border, sharp clean edge with 112px white margin. Macro studio photograph, high 3D craft texture.
```

#### 2. 非數字（技能/概念）成就主題
> **範例主題**：發音大師成就
```text
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft play-doh clay and fluffy needle-felted wool fibers.
The main subject is a funny, goofy parrot monster wearing headphones and singing into a golden clay microphone, with an exaggerated hilarious expression, fuzzy felt body and colorful clay beak.
Thick soft purple clay circle rim framing the badge.
Cute, goofy, exaggerated handcrafted style.
Pure solid white background (#FFFFFF), ABSOLUTELY NO outer drop shadow around the badge, perfectly sharp circular silhouette with 112px white margin. High-detail macro craft photography.
```

---

## 3. 成就徽章主題矩陣 (Badge Taxonomy)

### 1. 時間與天數成就 (Time & Days - 數字主角)
- `TIME-05`: **5 Mins** — 數字 "5" 黏土怪踩著鬧鐘小卡，手拿計時沙漏。
- `TIME-15`: **15 Mins** — 數字 "15" 羊毛氈怪背著火箭包，飛奔造型。
- `DAY-07`: **7 Days** — 數字 "7" 戴著派對帽、吹彩帶氣笛的慶祝小怪。
- `DAY-30`: **30 Days** — 數字 "30" 戴金皇冠、披紅披風的霸氣號碼王。
- `DAY-100`: **100 Days** — 數字 "100" 由三個圓滾滾黏土眼珠怪組成的百日大隊。

### 2. 詞彙與閱讀成就 (Vocabulary & Reading - 數字主角/概念主角)
- `VOCAB-50`: **50 Words** — 數字 "50" 化身為開花發芽的綠色羊毛氈樹怪。
- `VOCAB-200`: **200 Words** — 數字 "200" 抱著巨大字典書、戴圓眼鏡的搞笑學霸怪。
- `READ-01`: **Bookworm Master** — 戴眼鏡啃書本的長條彩虹黏土毛毛蟲。

### 3. 聽力與發音成就 (Listening & Speaking - 概念主角)
- `SPEAK-01`: **Phonics King** — 浮誇張大嘴發音的黃色羊毛氈獅子小怪。
- `LISTEN-01`: **Super Ears** — 戴著特大號黏土耳機、耳朵豎起的呆萌兔子怪。

### 4. 通關與挑戰成就 (Challenge & Streak)
- `STREAK-03`: **3 Combo** — 三個黏土小怪疊羅漢的搞笑連勝塔。
- `PERFECT-100`: **100% Score** — 頂著 3 顆閃亮金星、笑到眼睛瞇成一條線的羊毛氈金盃怪。

---

## 4. 輸出與品質驗證規範 (Output & Verification Checklist)

1. **檔案格式與畫質**：`1024 × 1024` 像素 PNG 圖檔。
2. **圖片儲存目錄**：`/Users/admin/VK Agent/image-generator-skill/for Kids/badge 2/`
3. **精確尺寸與留白核驗**：徽章圓形直徑必須精確為 **800px**，四周留白均勻為 **112px**。
4. **背景核驗**：100% `#FFFFFF` 純白背景，圓形周圍無陰影、無漸層、無雜點。
5. **材質質感核驗**：清晰展現羊毛氈毛絨感或黏土捏塑霧面微觀質感。
