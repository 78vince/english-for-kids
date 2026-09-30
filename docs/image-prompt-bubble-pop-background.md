# 圖片生成提示詞——戳泡泡遊戲背景（天空＋白雲）

用途：遊戲室第三款遊戲「戳泡泡」的畫面背景，泡泡（含字母）跟提示詞文字都會疊加顯示在這張背景上面，所以背景本身要夠柔和、對比不能太強，不能搶走前景泡泡/文字的視覺焦點。風格比照專案既有情境插畫（Stage E 會話練習用的水彩/水粉插畫，見 `docs/scenes-generation-queue.md`）同一套美術基調，但這次不需要角色、不需要場景敘事，純粹是氛圍背景圖。

## 提示詞（英文，供圖片生成工具使用）

```
Full-frame flat illustration background, no text, no characters. A soft, dreamy daytime sky filled with warm gentle sunlight, painted in warm gouache/watercolor style with visible soft brush texture. Several fluffy round white clouds of varying sizes drift across a gradient sky that transitions from a light warm blue near the top to a soft pale pastel near the horizon. The clouds have soft rounded edges, no sharp outlines, painted with light dry-brush texture typical of children's picture book illustration. Leave the lower two-thirds and center of the composition open, uncluttered, and low-contrast, since interactive game elements (bubbles) will be layered on top digitally — avoid busy detail, birds, sun rays, or any additional foreground objects in that area. A few clouds may cluster near the top and side edges as gentle framing. Bright, cheerful, calm mood suitable for a young children's educational app; colors should feel warm and inviting rather than cold or stark. 4:3 aspect ratio, no vignette, no dark corners, no text or logos anywhere in the image.
```

## 給圖片生成 agent 的補充說明

- **構圖留白很重要**：畫面中下段跟正中央要留乾淨、對比低的區域，因為之後會在上面疊放半透明的泡泡跟字母，如果背景本身細節/對比太強，泡泡裡的字母會看不清楚。
- **色彩**：暖色調的天空藍（不要選飽和度太高、太刺眼的正藍色），跟白雲的溫暖米白色，整體要跟這次遊戲要求的「粉色系」介面色调（泡泡、按鈕、提示詞文字框等 UI 元素會是粉色系）互相襯托，不要互相搶色——背景是暖藍/暖白，UI 是粉色，形成對比但都是柔和色調，不要用高飽和度撞色。
- **不要放文字、不要放人物/動物角色**：這張純粹是氛圍背景，跟 Stage E 情境插畫（有角色 Benny）不同，這裡不需要任何角色或敘事元素。
- **尺寸**：建議跟現有情境插畫一致抓 4:3 比例，實際輸出解析度依生成工具預設即可，之後由 App 端壓縮處理（比照先前 129 張情境插畫的壓縮流程）。
- **檔案存放路徑**：完成後請存到 `app/src/assets/games/bubble-pop-sky-bg.jpg`（新資料夾，比照 `app/src/assets/scenes/` 的既有慣例，遊戲相關的美術素材集中放在 `app/src/assets/games/` 底下，之後其他遊戲的美術素材也放在這裡）。
