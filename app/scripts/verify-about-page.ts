// 驗證「關於本站」獨立頁面（renderAbout()）＋確認全站頁尾（.site-footer／appendSiteFooter()）
// 真的已經完全移除，不是改個名字或留下殘骸：
// - .site-footer／appendSiteFooter() 在 main.ts、style.css 裡都完全不存在了
// - 版本號真的是讀 package.json 的 version 欄位（不是寫死的字串，以後升版才不會兩處不同步）
// - goToAbout()／renderAbout() 真的接上了 Screen／NavKey 型別、render() 的畫面分派、
//   功能列（NAV_ITEMS）第 6 個常駐項目三個地方——這是第二輪修改：最初做成個人檔案頁
//   裡的一個連結按鈕，使用者反應希望直接做進功能列那一排（首頁／挑戰紀錄／成就徽章／
//   收藏清單／個人檔案／登出），所以改成常駐導覽項目，個人檔案頁的連結按鈕跟著移除。
// - 個人檔案頁不再直接內嵌「關於 English for Kids」標題／說明文字／連結按鈕
//   （已經搬到獨立頁面，入口統一收斂到功能列，避免同一個目的地有兩種進入方式）
// - 「關於本站」頁面用跟其他功能列目的地一樣的 appendShell() 外殼，不需要自己的返回按鈕
// main.ts 因為用了 import.meta.glob 沒辦法直接 import 執行，這裡用原始碼字串比對，
// 做法跟其他 verify-*.ts（例如 verify-menu-progress-tier.ts）一致。
// 用法：npx tsx scripts/verify-about-page.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");
const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");

// ---- 測試 1：package.json 真的有 version 欄位，且是看起來合理的版本號格式
//      （不是空字串、不是 undefined），這樣後面驗證「main.ts 有讀這個值」才有意義。 ----
{
  assert(typeof pkg.version === "string" && pkg.version.length > 0, "package.json 應該要有非空字串的 version 欄位");
  assert(/^\d+\.\d+\.\d+/.test(pkg.version), `package.json 的 version「${pkg.version}」應該是看起來合理的版本號格式`);
  console.log(`✅ 測試 1 通過：package.json 的 version 是「${pkg.version}」，格式合理。`);
}

// ---- 測試 2：確認全站頁尾（.site-footer／appendSiteFooter()）真的整個移除了，
//      不是改名或留下沒被呼叫的殘骸函式／CSS 規則。 ----
{
  assert(!mainTs.includes("appendSiteFooter"), "main.ts 不應該再出現 appendSiteFooter（整個功能已經移除）");
  assert(!mainTs.includes("site-footer"), 'main.ts 不應該再出現 "site-footer" 這個 class 名稱');
  assert(!styleCss.includes(".site-footer"), "style.css 不應該再有 .site-footer 相關規則");
  console.log("✅ 測試 2 通過：全站頁尾（appendSiteFooter()／.site-footer）已經完全移除，main.ts 跟 style.css 都沒有殘骸。");
}

// ---- 測試 3：main.ts 真的用 import 讀 package.json（不是自己另外寫死一份版本字串），
//      renderAbout() 的內容有把版本號、作者資訊、email 都組進去。 ----
{
  assert(mainTs.includes('import pkg from "../package.json";'), 'main.ts 應該要 import pkg from "../package.json"');
  assert(mainTs.includes("function renderAbout(): void {"), "main.ts 應該要有 renderAbout() 函式");
  assert(
    mainTs.includes("English for Kids v${pkg.version}"),
    "renderAbout() 的版本號應該用 ${pkg.version} 動態組字串，不能寫死版本數字"
  );
  assert(mainTs.includes("Vincent - 小禮"), "renderAbout() 應該要顯示作者資訊「Vincent - 小禮」");
  assert(mainTs.includes('href="mailto:78vince@gmail.com"'), "renderAbout() 的 email 應該用 mailto: 連結包起來");
  assert(mainTs.includes('metaText.className = "about-meta";'), "renderAbout() 的版本／作者資訊那一行應該用 about-meta 這個 class");

  // main.ts 裡不該出現寫死的版本字串（例如直接寫 "v0.1.0"），版本號只能從 pkg.version 來，
  // 不然以後 package.json 升版了，「關於本站」頁面容易忘記同步更新。
  const hardcodedVersionPattern = new RegExp(`v${pkg.version.replace(/\./g, "\\.")}(?!\\})`);
  const withoutTemplateLiteral = mainTs.replace("English for Kids v${pkg.version}", "");
  assert(
    !hardcodedVersionPattern.test(withoutTemplateLiteral),
    `main.ts 不應該出現寫死的版本字串「v${pkg.version}」，版本號只能透過 \${pkg.version} 動態組出來`
  );

  console.log("✅ 測試 3 通過：renderAbout() 真的用 pkg.version 動態讀版本號，內容也包含作者資訊與 mailto 連結。");
}

// ---- 測試 4：goToAbout()／renderAbout() 真的接上 Screen 型別、render() 的畫面分派、
//      功能列（NAV_ITEMS）第 6 個常駐項目三個地方，不是寫好了函式卻沒有任何地方真的用它。 ----
{
  assert(mainTs.includes('| "about";'), 'Screen 型別應該要有 "about" 這個畫面');
  assert(
    mainTs.includes('type NavKey = "home" | "stats" | "badges" | "favorites" | "profile" | "about";'),
    'NavKey 型別應該要有 "about"，這樣「關於本站」才能被功能列的 active 高亮邏輯識別'
  );
  assert(mainTs.includes("function goToAbout(): void {"), "main.ts 應該要有 goToAbout() 函式");
  assert(mainTs.includes('screen = "about";'), "goToAbout() 應該要把 screen 設成 \"about\"");
  assert(
    mainTs.includes('else if (screen === "about") renderAbout();'),
    "render() 的畫面分派應該要接上 renderAbout()"
  );
  assert(
    mainTs.includes('{ key: "about", icon: NAV_ICONS.about, label: "關於本站", onSelect: goToAbout },'),
    "NAV_ITEMS 應該要有「關於本站」這個常駐項目，onSelect 呼叫 goToAbout()"
  );
  assert(mainTs.includes("about: `<svg"), "NAV_ICONS 應該要有 about 這個圖示");

  console.log("✅ 測試 4 通過：goToAbout()／renderAbout() 真的接上了 Screen／NavKey 型別、render() 分派、NAV_ITEMS 常駐項目三個地方。");
}

// ---- 測試 5：個人檔案頁不再直接內嵌「關於 English for Kids」標題／說明文字，
//      也不再有專屬的連結按鈕——使用者反應之後改成「關於本站」直接放進功能列，
//      不需要在個人檔案頁另外留一個入口，避免同一個目的地有兩種進入方式。 ----
{
  const renderProfileDetailMatch = mainTs.match(/function renderProfileDetail\(\): void \{[\s\S]*?\n\}\n\nfunction closeProfileDetailModal/);
  assert(renderProfileDetailMatch !== null, "應該找得到完整的 renderProfileDetail() 函式內容");
  assert(
    !renderProfileDetailMatch![0].includes('aboutTitle.textContent = "關於 English for Kids"'),
    "renderProfileDetail() 不應該再直接內嵌「關於 English for Kids」標題（已經搬到獨立頁面）"
  );
  assert(
    !renderProfileDetailMatch![0].includes("一個給小朋友在家練習 GEPT Kids"),
    "renderProfileDetail() 不應該再直接內嵌「關於」說明文字（已經搬到獨立頁面）"
  );
  assert(
    !renderProfileDetailMatch![0].includes("aboutLinkBtn"),
    "renderProfileDetail() 不應該再有專屬的「關於本站」連結按鈕（入口移到功能列，避免重複入口）"
  );

  console.log("✅ 測試 5 通過：個人檔案頁已經不再內嵌「關於」標題／文字／連結按鈕，入口統一收斂到功能列。");
}

// ---- 測試 6：「關於本站」頁面的標題／說明文字文案跟 docs/handoff-prompt-about-footer.md
//      定稿的一致，且用跟其他 5 個功能列目的地一樣的 appendShell() 外殼（不是自己另外做
//      一顆返回按鈕——功能列本身就是導覽入口，不需要額外的「返回」概念）。 ----
{
  const renderAboutMatch = mainTs.match(/function renderAbout\(\): void \{[\s\S]*?\n\}\n/);
  assert(renderAboutMatch !== null, "應該找得到完整的 renderAbout() 函式內容");
  assert(renderAboutMatch![0].includes('appendShell("about");'), 'renderAbout() 應該呼叫 appendShell("about")，跟其他功能列目的地一致');
  assert(
    !renderAboutMatch![0].includes("back-btn"),
    "renderAbout() 不應該再有自己的返回按鈕——功能列本身就是導覽入口，跟 renderFavorites() 等其他功能列頁面一致"
  );
  assert(
    !mainTs.includes('aboutTitle.textContent = "關於 English for Kids";'),
    "renderAbout() 已改版拿掉獨立的「關於 English for Kids」標題，改由 aboutTagline 撐起標題視覺份量"
  );
  assert(
    mainTs.includes('aboutTagline.textContent = "English for Kids - 每天玩一點英語！";'),
    "renderAbout() 應該要有「English for Kids - 每天玩一點英語！」標語段落（取代原本的標題）"
  );
  assert(
    mainTs.includes("所以我決定自己動手做一個更適合小學階段的英語學習平台"),
    "renderAbout() 應該要有定稿的家長視角「關於」說明文字（2026-08-26 三段式改版版本）"
  );
  assert(
    mainTs.includes('aboutFeedback.textContent = "有任何問題或建議，都歡迎跟我說。";'),
    "renderAbout() 應該要有邀請回饋的結尾段落"
  );
  assert(
    !mainTs.includes("GEPT Kids"),
    "renderAbout() 改版後不應該再出現「GEPT Kids」字樣"
  );

  console.log("✅ 測試 6 通過：「關於本站」頁面用 appendShell(\"about\") 跟其他功能列目的地一致，文案正確（含 2026-08 改版新文案），沒有多餘的返回按鈕。");
}

// ---- 測試 7：style.css 有 .about-text／.about-meta 兩個新規則，顏色都沿用既有的
//      --color-ink-muted，沒有另外挑新色；.about-link-btn（舊版連結按鈕樣式）應該
//      已經隨著入口搬到功能列一起移除，不留下沒被使用的殘骸規則。 ----
{
  for (const cls of [".about-text {", ".about-meta {"]) {
    assert(styleCss.includes(cls), `style.css 應該要有 ${cls} 規則`);
  }
  assert(!styleCss.includes(".about-link-btn"), "style.css 不應該再有 .about-link-btn（連結入口已經移到功能列，樣式一併移除）");

  const aboutTextRule = styleCss.match(/\.about-text \{[^}]*\}/);
  const aboutMetaRule = styleCss.match(/\.about-meta \{[^}]*\}/);
  assert(aboutTextRule !== null && aboutTextRule[0].includes("var(--color-ink-muted)"), ".about-text 的顏色應該用既有的 --color-ink-muted");
  assert(aboutMetaRule !== null && aboutMetaRule[0].includes("var(--color-ink-muted)"), ".about-meta 的顏色應該用既有的 --color-ink-muted");

  console.log("✅ 測試 7 通過：.about-text／.about-meta 都存在且顏色沿用既有 token，舊版 .about-link-btn 也確認清除乾淨。");
}

// ---- 測試 8：功能列從 5 個項目變成 6 個（加上「關於本站」）之後，使用者反應會被
//      擠成兩列（登出按鈕自己跑到第二列）。這裡確認 .function-nav 改成 flex-wrap: nowrap
//      （不換行，裝不下時改用 overflow-x: auto 水平捲動），而不是維持 wrap 讓瀏覽器
//      自動決定要不要換行——換行對這排導覽列來說是不平衡的版面，不是預期行為。 ----
{
  const functionNavRule = styleCss.match(/\.function-nav \{[^}]*\}/);
  assert(functionNavRule !== null, "應該找得到完整的 .function-nav 規則");
  assert(functionNavRule![0].includes("flex-wrap: nowrap;"), ".function-nav 應該是 flex-wrap: nowrap，強制維持一列，不能讓 6 個項目＋登出換行成兩列");
  assert(functionNavRule![0].includes("overflow-x: auto;"), ".function-nav 應該有 overflow-x: auto 當保險，真的裝不下的極窄螢幕改成水平捲動而不是換行");

  const navItemRule = styleCss.match(/\.nav-item \{[^}]*\}/);
  assert(navItemRule !== null, "應該找得到完整的 .nav-item 規則");
  assert(navItemRule![0].includes("white-space: nowrap;"), ".nav-item 的文字不應該自動換行，避免項目本身被壓縮到文字折成兩行");
  assert(
    !navItemRule![0].includes("font-size: var(--text-caption)") && navItemRule![0].includes("font-size: var(--text-body)"),
    "為了塞下 6 個項目，不應該縮小 .nav-item 的文字字級（專案先前特別把全站字級加大過），只能透過縮小內距/圖示來讓一排塞得下"
  );

  console.log("✅ 測試 8 通過：.function-nav 改成 nowrap＋水平捲動保險，維持一列不換行；文字字級沒有被縮小，只調整了內距與圖示大小。");
}

console.log("\n✅ 全部「關於本站」獨立頁面驗證通過（含確認全站頁尾已完全移除、入口已收斂到功能列、功能列維持一列不換行）。");
