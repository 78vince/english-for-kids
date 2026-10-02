// 遊戲室共用的幾個扁平單色 SVG 圖示：main.ts（遊戲室清單畫面／確認彈窗）跟各獨立
// 遊戲頁面（例如 memoryMatchStandalone.ts）都要用到同一份「代幣符號」「卡背圖示」，
// 2026-09-29 翻牌配對改成獨立 iframe 頁面架構升級時抽到這裡，避免兩邊各自複製一份
// SVG 字串、以後改圖示只改得到其中一邊。
//
// 跟主站其餘扁平圖示（EYE_OPEN_ICON／TURTLE_ICON／INFO_ICON 等，定義在 main.ts）
// 同一套視覺語言：viewBox="0 0 24 24" fill="none" stroke="currentColor"。

export const FLAT_ICON_VIEWBOX = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

// 遊戲代幣：扁平單色錢幣圖示（圓圈＋中間一個貨幣符號的曲線），取代原本的 🪙 emoji。
// 遊戲代幣圖示——圓圈＋品牌字母 K，呼應吉祥物「羊毛氈字母怪獸 K」，2026-10-01 風格改版 v3
// 從硬幣造型改版（函式名稱維持 COIN_ICON 不變，改名字要動到三個呼叫點，沒有必要）。
export const COIN_ICON = (size: number) => {
  const fontSize = Math.round(size * 0.58);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="vertical-align:-2px">
    <defs>
      <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--color-primary-700)"/>
        <stop offset="100%" stop-color="var(--color-primary-500)"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="11" fill="url(#coinGrad)"/>
    <text x="12" y="12" text-anchor="middle" dy=".35em"
      font-family="Huninn, sans-serif" font-weight="700" font-size="${fontSize}" fill="#fff">K</text>
  </svg>`;
};

// 翻牌配對的卡片背面圖示：扁平星芒/閃亮圖案，取代原本的 🃏 emoji。
export const CARD_BACK_ICON = (size: number) =>
  `<svg ${FLAT_ICON_VIEWBOX} width="${size}" height="${size}"><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18"/></svg>`;

// 2026-09-30 填字遊戲（遊戲室第二款遊戲）新增：拼圖片圖示，取代原本的 🧩 emoji，
// 同一套扁平單色視覺語言。
export const CROSSWORD_ICON = (size: number) =>
  `<svg ${FLAT_ICON_VIEWBOX} width="${size}" height="${size}"><path d="M6 4h4v2.5a1.5 1.5 0 0 0 3 0V4h4v4h-2.5a1.5 1.5 0 0 0 0 3H17v4h-4v-2.5a1.5 1.5 0 0 0-3 0V15H6v-4h2.5a1.5 1.5 0 0 0 0-3H6V4Z"/></svg>`;

// 星等（最高紀錄）用的實心/空心星星圖示，遊戲室清單卡片跟填字遊戲破關畫面共用同一份，
// 避免兩邊各畫一份星星 SVG。填色版用 fill="currentColor"（覆蓋掉 FLAT_ICON_VIEWBOX 預設
// 的 fill="none"），空心版維持只有邊框。
export const STAR_FILLED_ICON = (size: number) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9 2.2-5.3Z"/></svg>`;

export const STAR_EMPTY_ICON = (size: number) =>
  `<svg ${FLAT_ICON_VIEWBOX} width="${size}" height="${size}" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9 2.2-5.3Z"/></svg>`;

// 2026-09-30 戳泡泡（遊戲室第三款遊戲）新增：泡泡圖示，取代原本的 🫧 emoji，
// 同一套扁平單色視覺語言。
export const BUBBLE_POP_ICON = (size: number) =>
  `<svg ${FLAT_ICON_VIEWBOX} width="${size}" height="${size}"><circle cx="10" cy="14" r="6"/><circle cx="17" cy="8" r="4"/><circle cx="6" cy="7" r="2"/></svg>`;

