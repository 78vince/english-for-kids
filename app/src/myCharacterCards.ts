// 遊戲室「我的角色」卡片（2026-10-20 建立；2026-10-25 改成依 content/games/games.json 產生）。
// main.ts 用動態 import 載入這個檔案，遊戲美術套件（assets/game-tokens）才不會被打包進主頁一開始的程式。
// 清單＝games.json 裡 kind 為 studio／character 的遊戲（scripts/sync-games-from-letsgo.mjs 從 LetsGo 同步）；
// 上架判斷用 gameRelease.ts（正式站只顯示 active；遊戲實驗室全部顯示並標「測試中」）。
// 有專屬寫法的遊戲顯示個人紀錄；新同步過來、這裡還沒有專屬寫法的遊戲用通用卡片（名稱、說明、花費）。
// 點卡片＝同視窗導航到 games/*.html（整頁遊戲）；離開遊戲時 game/fullscreenPage.ts 會導回 index.html#gameRoom。
// 卡片縮圖 SVG 跟 LetsGo main.ts 相同。

import gamesData from "../../content/games/games.json";
import type { GameConfig } from "./types";
import { GameArt, GameTokens } from "./game/gameKit";
import { activeAvatarSvg } from "./game/characterStore";
import { loadRace } from "./game/raceStore";
import { loadTreeClimb } from "./game/treeClimbStore";
import { loadRocketRecord } from "./game/rocketStore";
import { loadMoleRecord } from "./game/moleStore";
import { isGamePlayable, labStatusTagHtml } from "./gameRelease";
import { COIN_ICON } from "./games/gameIcons";

const TREE_CLIMB_THUMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect width="100" height="100" fill="#E3F1FA"/><circle cx="18" cy="24" r="5" fill="#fff" opacity=".8"/><circle cx="24" cy="22" r="6" fill="#fff" opacity=".8"/><ellipse cx="50" cy="104" rx="62" ry="20" fill="#86BD77"/><ellipse cx="50" cy="102" rx="56" ry="16" fill="#A7D79A"/><path d="M40 92 Q44 88 44 78 L45 44 L55 44 L56 78 Q56 88 61 92 Z" fill="#7A5230"/><path d="M51 44 L55 44 L56 78 Q56 88 61 92 L54 92 Q52 84 52 76 Z" fill="#5F3F24"/><path d="M46 80 L29 74" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/><rect x="20" y="69" width="16" height="6" rx="3" fill="#3A7330"/><rect x="20" y="68" width="16" height="4" rx="2" fill="#86BD77"/><path d="M54 68 L71 62" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/><rect x="64" y="57" width="16" height="6" rx="3" fill="#3A7330"/><rect x="64" y="56" width="16" height="4" rx="2" fill="#86BD77"/><circle cx="50" cy="34" r="25" fill="#6FB57F"/><circle cx="33" cy="40" r="14" fill="#6FB57F"/><circle cx="67" cy="40" r="14" fill="#6FB57F"/><circle cx="50" cy="30" r="22" fill="#A7D79A"/><circle cx="35" cy="37" r="12" fill="#A7D79A"/><circle cx="65" cy="37" r="12" fill="#A7D79A"/><circle cx="50" cy="16" r="13" fill="#A7D79A"/><circle cx="43" cy="20" r="6" fill="#E8F5E2" opacity=".75"/><circle cx="31" cy="32" r="4" fill="#E8F5E2" opacity=".75"/><circle cx="60" cy="40" r="2.6" fill="#E9A23B"/><circle cx="40" cy="44" r="2.6" fill="#E9A23B"/><circle cx="56" cy="24" r="2.6" fill="#E9A23B"/></svg>`;
const ROCKET_THUMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect width="100" height="100" fill="#13162b"/><circle cx="20" cy="25" r="1.5" fill="#ffd873"/><circle cx="85" cy="30" r="1.2" fill="#fff"/><circle cx="78" cy="75" r="1.8" fill="#8ec5e8"/><circle cx="15" cy="80" r="1.2" fill="#f4a9c8"/><path d="M50 12 C62 30 68 55 66 75 L34 75 C32 55 38 30 50 12 Z" fill="#f8fafc"/><path d="M50 12 C55 20 60 28 62 34 L38 34 C40 28 45 20 50 12 Z" fill="#ef4444"/><path d="M34 60 L24 75 L34 72 Z" fill="#ef4444"/><path d="M66 60 L76 75 L66 72 Z" fill="#ef4444"/><circle cx="50" cy="46" r="10" fill="#3b82f6" stroke="#e2e8f0" stroke-width="2.5"/><circle cx="48" cy="44" r="3" fill="#93c5fd"/><path d="M43 75 Q50 94 50 94 Q50 94 57 75 Z" fill="#f97316"/><path d="M46 75 Q50 87 50 87 Q50 87 54 75 Z" fill="#fde047"/></svg>`;
const MOLE_THUMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect width="100" height="100" fill="#E3F1FA"/><ellipse cx="50" cy="85" rx="42" ry="14" fill="#A7D79A"/><ellipse cx="50" cy="74" rx="34" ry="11" fill="#7A5230"/><ellipse cx="50" cy="73" rx="30" ry="9" fill="#4F3319"/><path d="M32 72 Q32 36 50 36 Q68 36 68 72 Z" fill="#FFE3D2"/><circle cx="43" cy="54" r="2.2" fill="#35405A"/><circle cx="57" cy="54" r="2.2" fill="#35405A"/><circle cx="39" cy="58" r="2.5" fill="#F4A9C8" opacity=".7"/><circle cx="61" cy="58" r="2.5" fill="#F4A9C8" opacity=".7"/><path d="M47 62 Q50 64 53 62" stroke="#B5526A" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M30 42 Q30 20 50 20 Q70 20 70 42 Z" fill="#2E7A5E"/><path d="M30 40 L70 40 L70 44 L30 44 Z" fill="#F4A9C8"/><circle cx="40" cy="42" r="0.9" fill="#35405A"/><circle cx="50" cy="42" r="0.9" fill="#35405A"/><circle cx="60" cy="42" r="0.9" fill="#35405A"/><path d="M22 75 Q50 68 78 75 Q82 92 50 94 Q18 92 22 75 Z" fill="#D8B48A"/><circle cx="32" cy="82" r="3" fill="#A7D79A"/><circle cx="68" cy="82" r="3" fill="#A7D79A"/></svg>`;

interface CardInfo {
  art: string;
  text: string;
  button: string;
}

/** 各遊戲的專屬卡片內容（個人紀錄）；沒有列在這裡的遊戲用通用卡片 */
const DETAIL: Record<string, (profileId: string) => CardInfo> = {
  character_studio: (profileId) => ({
    art: activeAvatarSvg(profileId, 56) ?? GameArt.avatar(GameArt.presets["kid-blue"], 56),
    text: "打扮自己的角色、走走跳跳、換場景拍照。其他「我的角色」遊戲都會用這個角色。",
    button: "進入工作室",
  }),
  race: (profileId) => {
    const R = (GameTokens as any).race as { stages: { opponent: string }[] } | undefined;
    const race = loadRace(profileId);
    const stages = R?.stages ?? [];
    const wins = stages.filter((_, i) => (race.stages[String(i + 1)]?.wins ?? 0) >= 1).length;
    return {
      art: `<span class="game-room-race-art">${GameArt.animal(stages[0]?.opponent ?? "turtle", { pose: "run" })}</span>`,
      text: `用你的角色跟森林動物賽跑！跳過石頭、撿加速鞋，先衝過終點就贏。（已贏 ${wins}／${stages.length} 場）`,
      button: "去賽跑",
    };
  },
  tree_climb: (profileId) => {
    const TC = (GameTokens as any).treeClimb as { levels?: { id: string }[] } | undefined;
    const tree = loadTreeClimb(profileId);
    let stars = 0;
    let best = 0;
    for (const lv of TC?.levels ?? []) {
      const rec = tree.levels[lv.id];
      if (rec) {
        stars += rec.stars;
        best = Math.max(best, rec.bestMeters);
      }
    }
    return {
      art: `<span class="game-room-tree-art">${TREE_CLIMB_THUMB_SVG}</span>`,
      text: `用自己的角色爬上巨大神木！踩樹枝往上跳、收集披風飛升，掉出畫面就開降落傘。（最高 ${best} m，共 ${stars} 顆星）`,
      button: "去爬樹",
    };
  },
  rocket: (profileId) => {
    const rec = loadRocketRecord(profileId);
    return {
      art: `<span class="game-room-rocket-art">${ROCKET_THUMB_SVG}</span>`,
      text: `連續快速點按 A、B 按鍵為火箭注入強大推力，衝破大氣層直奔宇宙無重力世界！${
        rec.totalFlights > 0 ? `（最高 ${Math.round(rec.bestAltitude).toLocaleString()} m，點擊 ${rec.bestTaps} 次）` : "（限時連打升空）"
      }`,
      button: "去發射",
    };
  },
  mole: (profileId) => {
    const rec = loadMoleRecord(profileId);
    return {
      art: `<span class="game-room-mole-art">${MOLE_THUMB_SVG}</span>`,
      text: `在限時內點擊從草地土坑冒出來的小夥伴！點擊普通夥伴得 1 分，但別點到戴西瓜帽的偽裝夥伴喔！${
        rec.totalGames > 0 ? `（最高 ${rec.bestScore} 分，${rec.bestStars} 星）` : "（限時反應挑戰）"
      }`,
      button: "去打地鼠",
    };
  },
};

function costOf(game: GameConfig): number {
  const cfg = (GameTokens as any)[game.id.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())] as { cost?: number } | undefined;
  return cfg?.cost ?? game.cost;
}

function buildCard(game: GameConfig, profileId: string): HTMLElement {
  const info: CardInfo = DETAIL[game.id]?.(profileId) ?? {
    art: `<span class="game-room-generic-art">${game.icon_placeholder}</span>`,
    text: game.description,
    button: "開始",
  };
  const cost = game.kind === "studio" ? 0 : costOf(game);
  const el = document.createElement("div");
  el.className = `game-room-card game-room-card--${game.id.replace(/_/g, "-")}`;
  el.innerHTML = `
    <div class="game-room-card-icon my-character-avatar">${info.art}</div>
    <div class="game-room-card-body">
      <h3>${game.name}${labStatusTagHtml(game.id)}</h3>
      <p>${info.text}</p>
      <span class="game-room-card-cost">${cost > 0 ? `${COIN_ICON(22)} ${cost} / 場` : "免費"}</span>
    </div>`;
  const go = document.createElement("button");
  go.type = "button";
  go.className = "game-room-play-btn";
  go.textContent = info.button;
  // 代幣夠不夠由遊戲頁自己判斷（開局才扣，不夠會顯示鼓勵文字）
  go.addEventListener("click", () => window.location.assign(`${game.page}?from=gameRoom`));
  el.appendChild(go);
  return el;
}

export function buildMyCharacterCards(profileId: string): HTMLElement[] {
  return (gamesData as GameConfig[])
    .filter((g) => (g.kind === "studio" || g.kind === "character") && isGamePlayable(g.id))
    .sort((a, b) => a.order - b.order)
    .map((g) => {
      try {
        return buildCard(g, profileId);
      } catch {
        return null; // 某一款的紀錄壞掉也不影響其他卡片
      }
    })
    .filter((el): el is HTMLElement => el !== null);
}
