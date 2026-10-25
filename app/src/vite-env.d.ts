/// <reference types="vite/client" />

/** build 時由 vite.config.ts（false）／vite.standalone.config.ts（true）的 define 注入：
 * true＝單檔展示版（demo-standalone.html），整頁遊戲（我的角色）不提供。 */
declare const __STANDALONE__: boolean;

/** build 時由 define 注入：true＝遊戲實驗室（vite.lab.config.ts，npm run lab／build:lab），
 * 會顯示開發中的遊戲；正式站（GitHub Pages）一律 false。 */
declare const __LAB__: boolean;
