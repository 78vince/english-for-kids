# 繪圖提示詞：Level N - Unit N 規則式徽章圖案（25 張，分兩批）

*撰寫：2026-10-04（內容端）｜生成：使用者｜對應資料：新專案 `content/badges/badges.v2.json`*

## 規格（沿用既有徽章 Skill：kids-badge-2-generator）

- 羊毛氈＋塑形黏土手作質感、可愛搞怪誇張、**有數字時以數字怪獸當視覺主角**。
- 1024×1024 純白背景，正圓形徽章直徑 800px、四周留白 112px，圓外無投影（以 `image-generator-skill/for Kids/badge 2/` 的規範與 `template_blue_circle.png` 為準）。
- 生成後裁切壓縮成 **200×200 JPG**（與既有徽章相同），放入新專案 `app/src/assets/badges/`。
- 圖上**不要出現文字**（數字怪獸的數字本身除外）。

## 數量更正說明

規劃稿估 10–12 張專屬圖＋3 張範本，細算後實際需要 **25 張**：單元徽章要 8 張（Unit 1–8 數字怪獸，**所有 Level 共用**，Level 的差異由 App 在圖外加色環／「L4」小標，不必每個 Level 重畫）。分兩批生成，第 1 批 5 張就足以讓 Level 4 Unit 1–3 用上新徽章，其餘先沿用文字佔位圖。

## 共用提示詞骨架（每張都用，替換最後的 `[SUBJECT]`）

```
A compact circular achievement badge centered on a 1024x1024 square canvas, with an outer badge circle diameter of exactly 800 pixels and a wide 112-pixel pure solid white (#FFFFFF) empty border margin on all four sides.
Crafted from soft tactile materials: handcrafted colorful polymer play-doh clay and fuzzy needle-felted wool texture, rich micro handcrafted details and finger-press clay marks.
Round medallion badge with a thick textured soft clay rim border.
Cute, goofy, exaggerated, funny childlike art style.
Main subject: [SUBJECT].
Background: Pure solid white (#FFFFFF), ABSOLUTELY NO drop shadow outside the badge circle, sharp clean circular silhouette with exact 112px white margin.
Studio macro photograph lighting, high detail craft photography, vibrant candy pastel color scheme. No text, no letters.
```

## 第 1 批（5 張，Level 4 Unit 1–3 立即使用）

| 檔名 | 用途 | [SUBJECT] |
|---|---|---|
| `UC-1.jpg` | 完成 Unit 1 | `The number "1" as a super cute goofy number monster made of bright red clay with big googly eyes and a happy open mouth, tiny felt arms holding a small flag` |
| `UC-2.jpg` | 完成 Unit 2 | `The number "2" as a super cute goofy number monster made of orange clay with big googly eyes and a cheeky grin, tiny felt arms holding a small star` |
| `UC-3.jpg` | 完成 Unit 3 | `The number "3" as a super cute goofy number monster made of sunny yellow clay with big googly eyes and a wide smile, wearing a tiny party hat` |
| `UT.jpg` | Unit 三星精熟（所有 Unit 共用） | `Three fat golden clay stars in a row, each with a goofy googly-eyed face, fuzzy felt sparkles around them, a tiny felt ribbon underneath` |
| `LC-4.jpg` | 完成 Level 4 | `A funny round felt bear (Benny, brown teddy bear with a blue patterned bandana) wearing a golden clay crown and holding a big number "4" shaped clay trophy, confetti made of tiny felt pieces` |

## 第 2 批（20 張）

**單元數字怪獸（Unit 4–8，所有 Level 共用）**

| 檔名 | [SUBJECT] |
|---|---|
| `UC-4.jpg` | `The number "4" as a goofy number monster made of lime-green clay with googly eyes and a big grin, tiny felt arms waving` |
| `UC-5.jpg` | `The number "5" as a goofy number monster made of teal clay with googly eyes and a surprised open mouth, holding a tiny felt balloon` |
| `UC-6.jpg` | `The number "6" as a goofy number monster made of sky-blue clay with googly eyes and a silly smile, wearing tiny felt sunglasses` |
| `UC-7.jpg` | `The number "7" as a goofy number monster made of purple clay with googly eyes and a mischievous grin, holding a tiny glowing felt star` |
| `UC-8.jpg` | `The number "8" as a goofy number monster made of pink clay with googly eyes and a giant smile, with a tiny felt flower on its head` |

**Level 完成（Level 5、6）**

| 檔名 | [SUBJECT] |
|---|---|
| `LC-5.jpg` | 同 `LC-4`，改為 Benny 捧著數字「5」獎盃、金色黏土皇冠，背景配色偏綠 |
| `LC-6.jpg` | 同 `LC-4`，改為 Benny 捧著數字「6」獎盃、金色黏土皇冠，背景配色偏紫 |

**單元里程碑（新分類）**

| 檔名（代號） | 徽章 | [SUBJECT] |
|---|---|---|
| `UM-01.jpg` | 單元探險家 3 | `A goofy felt explorer bear with a tiny backpack and a clay map, the number "3" shaped like a hiking signpost` |
| `UM-02.jpg` | 單元探險家 5 | `A goofy felt explorer bear climbing a clay mountain with a flag, the number "5" shaped like a hiking signpost` |
| `UM-03.jpg` | 單元大滿貫 | `A goofy felt bear standing on top of a big clay mountain of colorful number blocks 1 to 8, waving a golden flag` |

**會話（新分類）**

| 檔名 | 徽章 | [SUBJECT] |
|---|---|---|
| `CV-01.jpg` | 故事初體驗 | `A cute felt bear opening a big colorful clay storybook, tiny speech bubbles made of felt floating up` |
| `CV-02.jpg` | 故事達人 | `A cute felt bear sitting on a stack of five clay storybooks, holding a little felt microphone, big proud grin` |
| `CV-03.jpg` | 說書高手 | `A cute felt bear wearing a clay storyteller hat on a tiny stage with a golden clay microphone and star confetti` |
| `GM-09.jpg` | 會話新手 | `Two cute felt speech bubbles with googly eyes chatting happily, the number "30" shaped from small clay balls` |
| `GM-10.jpg` | 會話大師 | `Two big golden clay speech bubbles with googly eyes and tiny crowns, the number "150" shaped from clay balls` |

**遊戲室（新分類）**

| 檔名 | 徽章 | [SUBJECT] |
|---|---|---|
| `GR-01.jpg` | 填字初體驗 | `A goofy clay crossword grid with colorful letter blocks (use abstract shapes, no real letters), one block with googly eyes giving a thumbs-up` |
| `GR-02.jpg` | 填字高手 | `A goofy clay crossword grid with a golden medal and a number "10" monster standing proudly on it` |
| `GR-03.jpg` | 戳泡泡初體驗 | `Rainbow felt soap bubbles with tiny googly eyes, one bubble popping with a happy face and felt sparkles` |
| `GR-04.jpg` | 泡泡高手 | `A giant golden felt bubble with a crown, a number "10" monster popping smaller bubbles with a tiny clay pin` |
| `GR-05.jpg` | 遊戲室玩家 | `A cute felt bear holding a clay crossword block in one hand and a rainbow bubble in the other, a tiny game controller made of clay at his feet` |

## 驗收與回報

- 請檢查：圓形直徑與留白、背景純白、無投影、無文字、與既有徽章的羊毛氈＋黏土質感一致。
- 第 1 批 5 張先生成並放入資料夾，我再請 App 端驗證顯示；其餘 20 張慢慢補，沒圖的徽章 App 會退回「色底＋名稱」佔位圖，不影響使用。
- 想改某張的角色或動作，告訴我檔名與想法，我調整提示詞。
