// 遊戲實驗室（docs/GAME-PRODUCTION-SPEC.md §2）：開發中的遊戲只在這裡測試，孩子用的 App 看不到。
// - 只存在遊戲實驗室的建置（vite.lab.config.ts：npm run lab／build:lab），一般 build 不會打包這一頁。
// - 不跟區網電腦同步（storage.ts 在 __LAB__ 時關閉同步），而且跑在另一個 port（5190），
//   瀏覽器的 localStorage 依網址分開，測試資料不會碰到孩子的紀錄。
// - 自動建立「測試員」使用者（沒有密碼）、可以補代幣、清除全部測試資料。
import "./lab.css";
import gamesData from "../../../content/games/games.json";
import type { GameConfig } from "../types";
import { GAME_STATUS_LABEL, LAB_MODE } from "../gameRelease";
import { createProfile, getActiveProfileId, getProfileById, listProfiles, setActiveProfileId } from "../profile";
import { rememberLogin } from "../pin";
import { earnTokens, getTokenBalance, spendTokens } from "../gameTokens";
import { AVATARS } from "../avatars";

const TESTER_NAME = "測試員";
const root = document.getElementById("lab")!;

function ensureTester(): string {
  const active = getActiveProfileId();
  if (active && getProfileById(active)) {
    rememberLogin();
    return active;
  }
  const existing = listProfiles().find((p) => p.name === TESTER_NAME);
  const tester = existing ?? createProfile(TESTER_NAME, AVATARS[0]?.id ?? "default");
  setActiveProfileId(tester.id);
  rememberLogin();
  return tester.id;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

async function clearAllTestData(): Promise<void> {
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    // 忽略
  }
  try {
    const dbs = (await indexedDB.databases?.()) ?? [{ name: "englishForKids.photos" }];
    await Promise.all(
      dbs.map(
        (d) =>
          new Promise<void>((resolve) => {
            if (!d.name) return resolve();
            const req = indexedDB.deleteDatabase(d.name);
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
          })
      )
    );
  } catch {
    // 忽略
  }
  window.location.reload();
}

function render(): void {
  if (!LAB_MODE) {
    // 理論上不會發生：一般 build 不打包這一頁
    root.innerHTML = `<main class="lab"><h1>這一頁只在遊戲實驗室使用</h1><p><a href="index.html">回到 App</a></p></main>`;
    return;
  }
  const profileId = ensureTester();
  const profile = getProfileById(profileId);
  const balance = getTokenBalance(profileId);
  const games = [...(gamesData as GameConfig[])].sort((a, b) => a.order - b.order);

  const rows = games
    .map((g) => {
      const href = g.kind === "learning" ? "index.html#gameRoom" : `${g.page}?from=lab`;
      const how = g.kind === "learning" ? "從遊戲室開（要選 Unit）" : "直接開遊戲頁";
      return `
      <li class="lab-game lab-game--${g.status}">
        <span class="lab-game-icon" aria-hidden="true">${esc(g.icon_placeholder)}</span>
        <span class="lab-game-body">
          <strong>${esc(g.name)}</strong>
          <span class="lab-game-meta"><code>${esc(g.id)}</code>・${g.kind}・${g.cost} 代幣／場</span>
        </span>
        <span class="lab-status lab-status--${g.status}">${GAME_STATUS_LABEL[g.status]}</span>
        <a class="lab-btn" href="${esc(href)}" title="${how}">測試</a>
      </li>`;
    })
    .join("");

  root.innerHTML = `
  <main class="lab">
    <header class="lab-head">
      <h1>🧪 遊戲實驗室</h1>
      <p>開發中的遊戲在這裡測試。孩子用的 App <strong>不會</strong>出現「開發中」的遊戲，遊戲頁也不會被打包進去。</p>
      <p class="lab-note">這裡的資料只存在這台裝置的這個網址（不同步到電腦、不影響孩子的紀錄）。上架方式：測試清單全部通過後，把 <code>content/games/games.json</code> 的 <code>status</code> 改成 <code>active</code>，再重新建置。</p>
    </header>

    <section class="lab-card">
      <h2>測試帳號</h2>
      <p>目前使用者：<strong>${esc(profile?.name ?? "?")}</strong>（沒有密碼）</p>
      <p>遊戲代幣：<strong class="lab-balance">${balance}</strong></p>
      <div class="lab-actions">
        <button type="button" data-act="add50">＋50 代幣</button>
        <button type="button" data-act="add500">＋500 代幣</button>
        <button type="button" data-act="zero">代幣歸零（測試餘額不足）</button>
        <button type="button" data-act="clear" class="lab-danger">清除全部測試資料</button>
      </div>
    </section>

    <section class="lab-card">
      <h2>遊戲</h2>
      <p class="lab-sub">清單來自 <code>content/games/games.json</code></p>
      <ul class="lab-games">${rows}</ul>
      <p class="lab-actions"><a class="lab-btn" href="index.html#gameRoom">開啟遊戲室（實驗室模式）</a>
      <a class="lab-btn lab-btn--ghost" href="index.html">開啟 App 首頁</a></p>
    </section>

    <section class="lab-card">
      <h2>上架前檢查</h2>
      <ol class="lab-check">
        <li>直式／橫式手機、iPad、電腦都玩過一輪，按鍵與 HUD 沒遮住畫面</li>
        <li>代幣：開局扣款、餘額不足擋下並引導去學習、玩完不發代幣</li>
        <li>沒有角色存檔、壞資料時不會當機；離開後沒有殘留動畫或計時器</li>
        <li>減少動態效果、連點不縮放、返回按鈕都正常</li>
        <li><code>npx tsx scripts/verify-game-release.ts</code> 與全部 verify、build 通過</li>
      </ol>
      <p>完整規範：<code>docs/GAME-PRODUCTION-SPEC.md</code></p>
    </section>
  </main>`;

  root.querySelectorAll<HTMLButtonElement>("[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "add50") earnTokens(profileId, 50);
      else if (act === "add500") earnTokens(profileId, 500);
      else if (act === "zero") spendTokens(profileId, getTokenBalance(profileId));
      else if (act === "clear") {
        if (window.confirm("清除這台裝置上所有實驗室測試資料？")) void clearAllTestData();
        return;
      }
      render();
    });
  });
}

render();
