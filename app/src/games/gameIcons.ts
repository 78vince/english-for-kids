// 遊戲室共用的幾個扁平單色 SVG 圖示：main.ts（遊戲室清單畫面／確認彈窗）跟各獨立
// 遊戲頁面（例如 memoryMatchStandalone.ts）都要用到同一份「代幣符號」「卡背圖示」，
// 2026-09-29 翻牌配對改成獨立 iframe 頁面架構升級時抽到這裡，避免兩邊各自複製一份
// SVG 字串、以後改圖示只改得到其中一邊。
//
// 跟主站其餘扁平圖示（EYE_OPEN_ICON／TURTLE_ICON／INFO_ICON 等，定義在 main.ts）
// 同一套視覺語言：viewBox="0 0 24 24" fill="none" stroke="currentColor"。

export const FLAT_ICON_VIEWBOX = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

// 遊戲代幣：扁平單色錢幣圖示（圓圈＋中間一個貨幣符號的曲線），取代原本的 🪙 emoji。
export const COIN_ICON = (size: number) =>
  `<svg ${FLAT_ICON_VIEWBOX} width="${size}" height="${size}"><circle cx="12" cy="12" r="9"/><path d="M9 15.5c0 1 1.2 1.5 3 1.5s3-.6 3-1.7c0-2.6-6-1.3-6-3.9 0-1.1 1.2-1.7 3-1.7s3 .5 3 1.5"/><line x1="12" y1="6.5" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="17.5"/></svg>`;

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

