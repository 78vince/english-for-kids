// 第一關「人物設定」角色工作室（Handoff 2）＋拍照／相簿（Handoff 3）。
// 全螢幕整頁（同視窗導航，見 game/fullscreenPage.ts）；舞台／按鍵用共用框架（game/stageController.ts、virtualPad.ts）；
// 圖形全部來自 assets/game-tokens（GameArt／GameIcons），App 端只組 UI 與存檔。

import "../game/gamePage.css";
import "./characterStudio.css";
import { GameArt, GameTokens, icon, normalizeLook, prefersReducedMotion, type Look, type View } from "../game/gameKit";
import { VirtualPad } from "../game/virtualPad";
import { StageController, type StageProp, type TimeMode } from "../game/stageController";
import { performablePoses, SEQUENCE_ONLY_POSES } from "../game/gameKit";
import {
  createInitial,
  loadCharacter,
  saveCharacter,
  newSlot,
  validateName,
  lookFingerprint,
  slotIndexAt,
  MAX_SLOTS,
  NAME_MAX,
  DEFAULT_NAME,
  type CharacterData,
  type CharacterSlot,
  type SlotScene,
} from "../game/characterStore";
import {
  addRotateHint,
  confirmDialog,
  leaveTo,
  preventZoomGestures,
  requireActiveProfileId,
  returnTarget,
  toast,
  tryFullscreenOnFirstTap,
} from "../game/fullscreenPage";
import {
  addPhoto,
  canShareFiles,
  deletePhoto,
  downloadBlob,
  listPhotos,
  syncPhotos,
  MAX_PHOTOS,
  photoFileName,
  photosSupported,
  type PhotoRecord,
} from "../game/photoStore";
import { flushPending, getSyncStatus, onSyncStatusChange, serverSyncEnabled, type SyncStatus } from "../storage";
import { loadRace } from "../game/raceStore";
import { loadPumpkinBossRecord, savePumpkinBossRecord } from "../game/pumpkinBossStore";
import { earnTokens, getTokenBalance } from "../gameTokens";
import {
  findItem,
  freeScenes,
  isOwned,
  loadWardrobe,
  purchase,
  recentPurchases,
  refund,
  sanitizeLook,
  sanitizeSceneId,
  sceneTrialRule,
  sceneTrialsLeft,
  shopItems,
  useSceneTrial,
  type ShopItem,
} from "../game/shopStore";
import { getAllBadges } from "../content";
import { evaluateRuleBadge, type RuleBadgeContext } from "../badgeRules";
import type { CharacterStudioProfileData } from "../types";
import { isGamePlayable, LAB_MODE } from "../gameRelease";

const profileId = requireActiveProfileId();
const app = document.querySelector<HTMLDivElement>("#studio-app")!;

const FIRST_SAVE_TOKENS = 10;
const FIRST_PHOTO_TOKENS = 5;
const SAVE_DEBOUNCE_MS = 800;
const HISTORY_LIMIT = 50;

// ---- 本機設定（每台設備各自，不同步） ----
const SETTINGS = {
  aspect: "englishForKids.settings.photoAspect.v1",
  sound: "englishForKids.settings.gameSound.v1",
  countdown: "englishForKids.settings.photoCountdown.v1",
};
function getSetting(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function setSetting(key: string, v: string): void {
  try {
    window.localStorage.setItem(key, v);
  } catch {
    // 忽略
  }
}

// ---- 中文名稱（長按色票／款式顯示；token 沒有提供中文名稱時顯示 id） ----
const NAMES: Record<string, string> = {
  kid: "小孩", bear: "小熊",
  porcelain: "白瓷", peach: "蜜桃", sand: "沙色", honey: "蜂蜜", cocoa: "可可", espresso: "咖啡",
  ink: "深藍黑", chestnut: "栗子", caramel: "焦糖", rose: "玫瑰粉", sky: "天空藍", lilac: "紫丁香", mint: "薄荷綠",
  sun: "陽光黃", leaf: "葉子綠", stone: "石頭灰", wood: "木頭色",
  "honey-bear": "蜂蜜熊", "cocoa-bear": "可可熊", panda: "熊貓", cloud: "雲朵",
  short: "短髮", bob: "鮑伯頭", bun: "包包頭", puff: "爆炸頭", ponytail: "馬尾", none: "沒有", curly: "捲髮", twintail: "雙馬尾", long: "長直髮",
  dot: "圓圓眼", happy: "瞇瞇眼", oval: "大眼睛", lash: "睫毛", sparkle: "閃亮眼",
  smile: "微笑", open: "開心", o: "驚訝", tongue: "吐舌頭",
  tee: "T 恤", hoodie: "帽 T", overalls: "吊帶褲", dress: "洋裝", jacket: "外套", stripe: "條紋衫", sundress: "背心裙",
  "glasses-round": "圓眼鏡", "glasses-soft": "軟框眼鏡", cap: "帽子", bow: "蝴蝶結", headphones: "耳機", bandana: "領巾",
  scarf: "圍巾", backpack: "背包", "star-clip": "星星髮夾", goggles: "護目鏡", wings: "翅膀", cape: "披風",
  flag: "旗子", lollipop: "棒棒糖", wand: "魔法棒", book: "書", pinwheel: "風車", bouquet: "小花束",
  twinbun: "雙包頭", meat: "帶骨肉", plunger: "馬桶吸把",
  zombieTalisman: "變身符咒", witchhat: "女巫帽", pumpkinhood: "南瓜頭套",
  magiccane: "魔拐杖", pumpkinbucket: "南瓜糖果桶", melonhat: "西瓜帽",
  mikanhood: "蜜柑頭套", bluehood: "藍兜帽", poopstick: "便便棒",
};
// 中文名稱：優先讀 token 的 optionLabels，找不到才用上面的對照表，再找不到顯示 id
const nameOf = (id: string) => GameArt.options.optionLabels?.[id] ?? NAMES[id] ?? id;

// ---- 狀態 ----
let data: CharacterData = loadCharacter(profileId ?? "") ?? createInitial();
let isFirstVisit = !loadCharacter(profileId ?? "");
// 商店：造型或場景用到「沒買／已退回」的商品款式（例如在另一台平板退回）就換回預設值
if (profileId && !isFirstVisit) {
  const w = loadWardrobe(profileId);
  let fixed = false;
  for (const s of data.slots) {
    const r = sanitizeLook(profileId, s.look, w);
    if (r.changed) {
      s.look = r.look;
      fixed = true;
    }
    const sid = sanitizeSceneId(profileId, s.scene.id, w);
    if (sid !== s.scene.id) {
      s.scene = { ...(s.sceneTimes?.[sid] ?? { id: sid, time: "day" as const, useSystemTime: false }), id: sid };
      fixed = true;
    }
  }
  if (fixed) saveCharacter(profileId, data); // 立刻存回（首頁頭像等其他地方也看得到換掉後的樣子）
}
// 巨大南瓜怪變身符咒：若角色外觀存檔已有 zombieTalisman，確保南瓜怪記錄亦自動解鎖同步
if (profileId) {
  const hasInLook = data.slots.some((s) => s.look?.accessories?.includes("zombieTalisman"));
  if (hasInLook) {
    const pbRec = loadPumpkinBossRecord(profileId);
    if (!pbRec.hasTalisman) {
      savePumpkinBossRecord(profileId, { ...pbRec, hasTalisman: true });
    }
  }
}
let slot: CharacterSlot = data.slots[data.activeSlot];
let entryLook: Look = clone(slot.look);
let undoStack: Look[] = [];
let redoStack: Look[] = [];
let saveTimer = 0;
let dirty = false;
type TabId = "style" | "pose" | "scene" | "album";
type StyleCat = "body" | "hair" | "face" | "outfit" | "acc" | "held";
let tab: TabId = "style" as TabId;
let styleCat: StyleCat = "body" as StyleCat;
let drawerOpen = false;
let cameraMode = false;
let busy = false;

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

// ---- 音效（WebAudio 合成，不用音檔；可在右上設定關閉） ----
let audioCtx: AudioContext | null = null;
function soundOn(): boolean {
  return getSetting(SETTINGS.sound, "1") === "1";
}
function blip(kind: "tap" | "jump" | "land" | "shutter" | "coin" | "pop" | "trip"): void {
  if (!soundOn()) return;
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    if (kind === "trip") {
      // 跌倒：「咻～」往下滑的音（絆到）＋ 380ms 後「咚」一聲（趴到地上，對上 trip 序列第一步的長度）
      const o1 = ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.setValueAtTime(620, t);
      o1.frequency.exponentialRampToValueAtTime(180, t + 0.3);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.13, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      o1.connect(gain);
      o1.start(t);
      o1.stop(t + 0.34);
      const t2 = t + 0.38;
      const g2 = ctx.createGain();
      g2.connect(ctx.destination);
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.setValueAtTime(140, t2);
      o2.frequency.exponentialRampToValueAtTime(55, t2 + 0.18);
      g2.gain.setValueAtTime(0.0001, t2);
      g2.gain.exponentialRampToValueAtTime(0.3, t2 + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.24);
      o2.connect(g2);
      o2.start(t2);
      o2.stop(t2 + 0.26);
      // 一點點雜音當作「撲」的質感
      const len = Math.floor(ctx.sampleRate * 0.08);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const dd = buf.getChannelData(0);
      for (let i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g3 = ctx.createGain();
      g3.gain.value = 0.12;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      src.connect(lp).connect(g3).connect(ctx.destination);
      src.start(t2);
      return;
    }
    if (kind === "shutter") {
      const len = Math.floor(ctx.sampleRate * 0.09);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      gain.gain.value = 0.35;
      src.connect(gain);
      src.start(t);
      return;
    }
    const osc = ctx.createOscillator();
    const f = { tap: [660, 660], jump: [420, 760], land: [220, 140], coin: [880, 1320], pop: [520, 900] }[kind];
    osc.type = kind === "land" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(f[0], t);
    osc.frequency.exponentialRampToValueAtTime(f[1], t + 0.1);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.18);
  } catch {
    // 不支援就安靜
  }
}

// ---- 版面 ----
app.innerHTML = `
  <div class="gpage studio">
    <header class="studio-top">
      <button type="button" class="g-iconbtn g-h-stone studio-back" aria-label="返回">${icon("back")}</button>
      <span class="studio-name-wrap"><button type="button" class="studio-name" aria-label="修改角色名稱"><span class="g-t-heading studio-name-text"></span>${icon("edit", "sm")}</button></span>
      <div class="studio-top-spacer"></div>
      <button type="button" class="g-iconbtn studio-undo" aria-label="復原">${icon("undo")}</button>
      <button type="button" class="g-iconbtn studio-redo" aria-label="重做">${icon("redo")}</button>
      <span class="studio-save" role="status" aria-live="polite"><i></i><span class="g-t-caption"></span></span>
      ${isGamePlayable("race") ? `<button type="button" class="g-iconbtn g-h-mint studio-race" aria-label="賽跑">${icon("flag")}</button>` : ""}
      <button type="button" class="g-iconbtn studio-sound" aria-label="音效開關"></button>
      <button type="button" class="g-iconbtn g-h-sun studio-camera" aria-label="拍照">${icon("camera")}</button>
    </header>
    <div class="studio-body">
      <section class="studio-stage-wrap">
        <div class="studio-stage-host"></div>
        <div class="studio-views" role="group" aria-label="視角"></div>
        <div class="studio-pad-host"></div>
        <div class="studio-camera-bar" hidden></div>
        <div class="studio-frame" hidden></div>
      </section>
      <aside class="studio-panel">
        <button type="button" class="studio-drawer-toggle" aria-label="展開／收合面板">${icon("menu")}</button>
        <nav class="studio-tabs" role="tablist"></nav>
        <div class="studio-tab-body"></div>
      </aside>
    </div>
  </div>`;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
const stageHost = $(".studio-stage-host");
const pad = new VirtualPad();
$(".studio-pad-host").appendChild(pad.el);
const stage = new StageController(stageHost, pad, {
  sceneId: slot.scene.id,
  look: slot.look,
  view: "front",
  // 0.34H：蓄力跳（2 倍高，約舞台 52%）時頭頂仍在舞台內
  charH: 0.34,
  autoSideOnMove: true,
});
// 測試用：網址加 ?debug 時把舞台掛在 window.__studioStage（自動化測試讀物理狀態用）
if (new URLSearchParams(location.search).has("debug")) (window as unknown as { __studioStage: StageController }).__studioStage = stage;
stageHost.appendChild(stage.el);
updateCKeyVisibility();
// 視角切換、相機列、取景框都疊在舞台上
stageHost.append($(".studio-views"), $(".studio-camera-bar"), $(".studio-frame"));

// 2026-10-20：拿掉工作室的金幣（撿了不能變成遊戲代幣，孩子容易誤會；使用者決定）
const hintBox = document.createElement("div");
hintBox.className = "studio-hint";
stage.hud.appendChild(hintBox);

// ---- 存檔 ----
function markDirty(): void {
  dirty = true;
  slot.updatedAt = Date.now();
  renderSaveStatus();
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveNow, SAVE_DEBOUNCE_MS);
}

function saveNow(): void {
  clearTimeout(saveTimer);
  if (!profileId) return;
  // 沒有改過就不寫：不然離開頁面時會用「現在」的時間戳把別台設備較新的版本蓋掉
  if (!dirty) return;
  const wasDirty = dirty;
  dirty = false;
  data.slots[data.activeSlot] = slot;
  // 「造型師」累計紀錄：每個存過的角色記一份造型指紋（刪除角色也保留）
  data.stats.slotsEverSaved = { ...(data.stats.slotsEverSaved ?? {}), [slot.id]: lookFingerprint(slot.look) };
  if (wasDirty && !data.stats.firstSaveRewarded) {
    data.stats.firstSaveRewarded = true;
    earnTokens(profileId, FIRST_SAVE_TOKENS);
    toast(`${icon("coin")} 第一次存好角色，送你 ${FIRST_SAVE_TOKENS} 個代幣！`, 2600);
  }
  const before = badgeSnapshot();
  saveCharacter(profileId, data);
  announceBadges(before);
  renderSaveStatus();
}

function renderSaveStatus(): void {
  const box = $(".studio-save");
  const s: SyncStatus = getSyncStatus();
  let cls = "saved";
  let text = "已存";
  if (dirty) {
    cls = "saving";
    text = "儲存中";
  } else if (s === "syncing") {
    cls = "saving";
    text = "同步中";
  } else if (s === "offline" || s === "unreachable") {
    cls = "offline";
    text = "離線，稍後同步";
  }
  box.className = `studio-save studio-save--${cls}`;
  box.querySelector("span")!.textContent = text;
}
onSyncStatusChange(() => renderSaveStatus());

// ---- 徽章（規則式，badgeRules.ts 的 character_studio 類，CS-01～CS-07）：工作室裡達成就跳提示 ----
const CHARACTER_BADGES = getAllBadges().filter((b) => b.category === "character_studio");
function charCtx(): RuleBadgeContext {
  return {
    completedUnits: new Set(),
    masteredUnits: new Set(),
    openUnitCount: 0,
    plannedUnitsByLevel: {},
    conversationUnitKeys: [],
    conversationCompletedUnits: new Set(),
    crosswordClears: 0,
    bubblePopClears: 0,
    characterStudio: storedData() as unknown as CharacterStudioProfileData | null,
    availableScenes: freeScenes(), // 「環遊世界」只算免費場景（商店場景不影響）
    availablePoses: performablePoses(),
  };
}
/** 徽章看「已存檔」的資料（跟主頁徽章頁一致） */
function storedData(): CharacterData | null {
  return profileId ? loadCharacter(profileId) : null;
}
function badgeSnapshot(): Set<string> {
  const ctx = charCtx();
  return new Set(CHARACTER_BADGES.filter((b) => evaluateRuleBadge(b, ctx)?.achieved).map((b) => b.id));
}
function announceBadges(before: Set<string>): void {
  const after = badgeSnapshot();
  for (const b of CHARACTER_BADGES) {
    if (after.has(b.id) && !before.has(b.id)) toast(`${icon("trophy")} 獲得新徽章：${b.name}`, 3200, "lilac");
  }
}

// ---- 造型編輯（復原／重做 ≥ 20 步） ----
function applyLook(next: Look, record = true): void {
  if (record) {
    undoStack.push(clone(slot.look));
    if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    redoStack = [];
  }
  if (tryOn && tryOn.item.field !== "scene") tryOn = null; // 換別的造型＝結束試穿（舞台會換成正式造型）
  const wasZombie = isZombieTransformed();
  slot.look = normalizeLook(profileId ? sanitizeLook(profileId, next).look : next);
  // 維持使用者目前選的視角（正／側／背）與面向，只重畫造型；縮圖仍是正面
  stage.setLook(slot.look);
  updateCKeyVisibility();
  const isNowZombie = isZombieTransformed();
  if (!wasZombie && isNowZombie) {
    // 裝備上變身符咒的瞬間，玩家四周冒出一團白煙（卸載時不用）
    spawnTalismanSmokeEffect();
  }
  if (isZombieTransformed()) {
    releaseMonsterTrapByTalisman();
  }
  markDirty();
  renderHistoryButtons();
  if (tab === "style") renderTab();
  blip("tap");
  tourAdvance("style");
}

function undo(): void {
  const prev = undoStack.pop();
  if (!prev) return;
  redoStack.push(clone(slot.look));
  applyLook(prev, false);
}
function redo(): void {
  const next = redoStack.pop();
  if (!next) return;
  undoStack.push(clone(slot.look));
  applyLook(next, false);
}
function renderHistoryButtons(): void {
  $<HTMLButtonElement>(".studio-undo").disabled = undoStack.length === 0;
  $<HTMLButtonElement>(".studio-redo").disabled = redoStack.length === 0;
}

function setField(key: keyof Look, value: string): void {
  const next = clone(slot.look) as any;
  next[key] = value;
  if (key === "species" && value === "bear" && !next.fur) next.fur = GameArt.options.fur[0];
  applyLook(next);
}
/** 咪頭與全包頭套系列（橘咪頭、藍咪頭、南瓜萌頭）一次只能戴一個：選了一個就拿掉另一個 */
const HOOD_ACCESSORIES = ["mikanhood", "bluehood", "pumpkinhood"];
function toggleAccessory(a: string): void {
  const next = clone(slot.look);
  const i = next.accessories.indexOf(a);
  if (i >= 0) next.accessories.splice(i, 1);
  else {
    if (HOOD_ACCESSORIES.includes(a)) next.accessories = next.accessories.filter((x) => !HOOD_ACCESSORIES.includes(x));
    next.accessories.push(a);
  }
  applyLook(next);
}
function randomize(): void {
  const r = GameArt.randomLook();
  r.species = slot.look.species; // 隨機保留物種（名稱另外存，不受影響）
  if (r.species === "bear") {
    const F = GameArt.options.fur;
    r.fur = F[Math.floor(Math.random() * F.length)];
  }
  applyLook(r);
}

// ---- 縮圖（以 GameArt.character 即時繪製，不用圖檔；一律正面、靜止） ----
function thumbChar(look: Look, mode: "head" | "body" = "body"): string {
  return mode === "head" ? GameArt.avatar(look) : GameArt.character({ ...look, view: "front", pose: null });
}

/** 縮圖專用 look：複製目前的造型，再清掉「其他分類」的選配項目，才看得出這個款式本身。
 * 配件分頁＝只有該款配件、不拿東西；手持物分頁＝只拿該款、不戴配件；其他分頁＝配件與手持物都清掉。
 * 「已選」外框仍依實際 look 判斷；舞台上的角色不受影響。 */
function thumbLook(key: keyof Look, v: string): Look {
  const look = { ...clone(slot.look), [key]: v } as Look;
  if (key === "accessories") {
    look.accessories = [v];
    look.held = "none";
  } else if (key === "held") {
    look.accessories = [];
  } else {
    look.accessories = [];
    look.held = "none";
  }
  return look;
}

function colorOf(src: "skin" | "hair" | "fur" | "hue", id: string): string {
  const C = GameTokens.color as any;
  return src === "hue" ? C.hue[id]?.base : C[src]?.[id];
}

function chipsHtml(key: keyof Look, values: string[], src: "skin" | "hair" | "fur" | "hue", label: string): string {
  return `<div class="studio-field"><p class="g-t-label">${label}</p><div class="studio-swatches">${values
    .map((v) => {
      const on = (slot.look as any)[key] === v;
      return `<button type="button" class="studio-swatch" data-set="${key}" data-v="${v}" aria-pressed="${on}" aria-label="${nameOf(v)}" title="${nameOf(v)}" style="background:${colorOf(src, v)}"></button>`;
    })
    .join("")}</div></div>`;
}

/** 褲子顏色：色票＋「同衣服」（pantsColor: 'match'，褲子／連身褲／洋裝下半部跟衣服同色；不是色相，不能查 hue） */
function pantsHtml(): string {
  const O = GameArt.options;
  const isMatch = slot.look.pantsColor === "match";
  const swatches = O.pantsColor
    .filter((c) => c !== "match" && colorOf("hue", c))
    .map((v) => {
      const on = !isMatch && slot.look.pantsColor === v;
      return `<button type="button" class="studio-swatch" data-set="pantsColor" data-v="${v}" aria-pressed="${on}" aria-label="${nameOf(v)}" title="${nameOf(v)}" style="background:${colorOf("hue", v)}"></button>`;
    })
    .join("");
  const matchBtn = O.pantsColor.includes("match")
    ? `<button type="button" class="studio-match" data-set="pantsColor" data-v="match" aria-pressed="${isMatch}" aria-label="褲子同衣服顏色"><i style="background:${colorOf("hue", slot.look.outfitColor)}"></i>同衣服</button>`
    : "";
  return `<div class="studio-field"><p class="g-t-label">褲子顏色</p><div class="studio-swatches">${matchBtn}${swatches}</div></div>`;
}

function stylesHtml(key: keyof Look, values: string[], label: string, mode: "head" | "body"): string {
  return `<div class="studio-field"><p class="g-t-label">${label}</p><div class="studio-thumbs">${values
    .map((v) => {
      const on = (slot.look as any)[key] === v;
      const look = thumbLook(key, v);
      const lk = lockInfo(key, v);
      return `<button type="button" class="studio-thumb${lk.cls}" data-set="${key}" data-v="${v}"${lk.attr} aria-pressed="${on}" aria-label="${nameOf(v)}${lk.aria}" title="${nameOf(v)}">${thumbChar(look, mode)}<span class="g-t-caption">${nameOf(v)}</span>${lk.badge}</button>`;
    })
    .join("")}</div></div>`;
}

function accessoriesHtml(): string {
  const O = GameArt.options;
  const pbRec = profileId ? loadPumpkinBossRecord(profileId) : null;
  const hasInLook = Boolean(
    slot?.look?.accessories?.includes("zombieTalisman") ||
      data?.slots?.some((s) => s.look?.accessories?.includes("zombieTalisman"))
  );
  const unlockedTalisman = Boolean(pbRec?.hasTalisman || hasInLook || LAB_MODE);
  return `<div class="studio-field"><p class="g-t-label">配件（可以選很多個）</p><div class="studio-thumbs">${O.accessories
    .filter((a) => a !== "zombieTalisman" || unlockedTalisman)
    .map((a) => {
      const on = slot.look.accessories.includes(a);
      const look = thumbLook("accessories", a);
      const lk = lockInfo("accessories", a);
      return `<button type="button" class="studio-thumb${lk.cls}" data-acc="${a}"${lk.attr} aria-pressed="${on}" aria-label="${nameOf(a)}${lk.aria}" title="${nameOf(a)}">${thumbChar(look, "body")}<span class="g-t-caption">${nameOf(a)}</span>${lk.badge}</button>`;
    })
    .join("")}</div></div>`;
}

// ---- 造型商店（GameTokens.shop）：鎖住的款式顯示價格；點了先試穿，按「買下來」→「確定購買」才扣代幣；10 分鐘內可退回 ----
let tryOn: { item: ShopItem; prevScene?: string; endsAt?: number } | null = null;
/** 場景試玩倒數（每 250ms 更新試穿列的剩餘秒數，時間到自動結束） */
let trialTimer = 0;
/** 不能試玩（今天的次數用完）或試玩時間到之後：顯示購買列，不換場景也能直接買 */
let buyOnly: { item: ShopItem; reason: "used" | "timeup" } | null = null;
function lockInfo(field: string, v: string): { cls: string; attr: string; aria: string; badge: string } {
  const it = findItem(field, v);
  if (!it || !profileId || isOwned(profileId, field, v)) return { cls: "", attr: "", aria: "", badge: "" };
  const trying = tryOn?.item.id === it.id;
  // 場景：每天可以試玩的次數用完了 → 縮圖標「明天再試」
  const noTrial = it.field === "scene" && !trying && sceneTrialsLeft(profileId, it.value) <= 0;
  return {
    cls: " studio-locked" + (trying ? " studio-locked--trying" : "") + (noTrial ? " studio-locked--notrial" : ""),
    attr: ` data-shopitem="${it.id}"`,
    aria: `（商店：${it.price} 個代幣，${it.field === "scene" ? (noTrial ? "今天的試玩次數用完了" : `點一下先試玩 ${sceneTrialRule().seconds} 秒`) : "點一下先試穿"}）`,
    badge: `<span class="studio-price" aria-hidden="true">${icon("coin", "sm")}${it.price}</span>${noTrial ? `<span class="studio-notrial g-t-caption" aria-hidden="true">明天再試</span>` : ""}`,
  };
}
function shopName(it: ShopItem): string {
  return it.field === "scene" ? GameArt.sceneInfo[it.value]?.label ?? it.value : nameOf(it.value);
}
function tryOnLook(it: ShopItem): Look {
  const next = clone(slot.look) as any;
  if (it.field === "accessories") {
    if (HOOD_ACCESSORIES.includes(it.value)) next.accessories = next.accessories.filter((x: string) => !HOOD_ACCESSORIES.includes(x));
    if (!next.accessories.includes(it.value)) next.accessories.push(it.value);
  } else next[it.field] = it.value;
  return normalizeLook(next);
}
async function startTryOn(it: ShopItem): Promise<void> {
  if (tryOn?.item.id === it.id) return; // 試玩中再點同一個不重算次數
  if (it.field === "scene" && profileId) {
    // 場景試玩：每次 30 秒、每個場景每天 3 次（只記在這台設備）
    if (!useSceneTrial(profileId, it.value)) {
      // 今天的試玩次數用完：不換場景，但顯示購買列，想買可以直接買
      endTryOn(false);
      buyOnly = { item: it, reason: "used" };
      blip("tap");
      return renderTab();
    }
  }
  buyOnly = null;
  endTryOn(false);
  tryOn = { item: it };
  if (it.field === "scene") {
    tryOn.endsAt = Date.now() + sceneTrialRule().seconds * 1000;
    startTrialTimer();
    tryOn.prevScene = stage.sceneId;
    renderTab();
    await stage.setScene(it.value);
    placeProps();
  } else {
    stage.setLook(tryOnLook(it));
    updateCKeyVisibility();
  }
  blip("tap");
  renderTab();
}
function startTrialTimer(): void {
  clearInterval(trialTimer);
  trialTimer = window.setInterval(() => {
    if (!tryOn?.endsAt) {
      clearInterval(trialTimer);
      return;
    }
    const left = Math.max(0, Math.ceil((tryOn.endsAt - Date.now()) / 1000));
    document.querySelectorAll<HTMLElement>(".studio-trial-left").forEach((e) => (e.textContent = trialClock(left)));
    if (left <= 0) {
      // 時間到：回到原本的場景，購買列留著，喜歡可以直接買
      const it = tryOn.item;
      endTryOn(false);
      buyOnly = { item: it, reason: "timeup" };
      renderTab();
      toast(`${icon("timer")} 試玩時間到囉！喜歡「${shopName(it)}」的話可以買下來`, 3000, "sun");
    }
  }, 250);
}
function trialClock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
function endTryOn(rerender = true): void {
  if (!tryOn) return;
  const t = tryOn;
  tryOn = null;
  clearInterval(trialTimer);
  if (t.item.field === "scene") {
    const back = t.prevScene ?? slot.scene.id;
    if (stage.sceneId !== back)
      void stage.setScene(back).then(() => {
        stage.setTime(timeModeOf(slot.scene));
        placeProps();
      });
  } else {
    stage.setLook(slot.look);
    updateCKeyVisibility();
  }
  if (rerender) renderTab();
}
async function buyTryOn(): Promise<void> {
  const cur = tryOn?.item ?? buyOnly?.item;
  if (!cur || !profileId) return;
  const it = cur;
  const ok = await confirmDialog({ iconId: "coin", text: `確定用 ${it.price} 個代幣買「${shopName(it)}」嗎？`, yes: "確定購買", no: "再想想", hue: "sun" });
  if (!ok || (tryOn?.item ?? buyOnly?.item)?.id !== it.id) return;
  const r = purchase(profileId, it);
  if (!r.ok && r.reason === "tokens") {
    toast(`${icon("coin")} 再多 ${r.need} 個代幣就能買囉！`, 2400, "sky");
    return renderTab();
  }
  const wasTrying = tryOn !== null;
  tryOn = null;
  buyOnly = null;
  clearInterval(trialTimer);
  if (it.field === "scene") {
    if (wasTrying && stage.sceneId === it.value) {
      const remembered = slot.sceneTimes?.[it.value] ?? { id: it.value, time: "day" as const, useSystemTime: false };
      applySceneSetting({ ...remembered, id: it.value });
    } else await switchScene(it.value); // 沒在試玩（次數用完、時間到）：買完直接換過去
  } else applyLook(tryOnLook(it));
  blip("coin");
  toast(`${icon("sparkle")} 買到「${shopName(it)}」了！10 分鐘內可以退回`, 2800, "mint");
  renderTab();
}
async function refundItem(id: string): Promise<void> {
  const it = shopItems().find((x) => x.id === id);
  if (!it || !profileId) return;
  const ok = await confirmDialog({ iconId: "restart", text: `要退回「${shopName(it)}」嗎？${it.price} 個代幣會還給你。`, yes: "退回", no: "不要", hue: "sky" });
  if (!ok) return;
  if (!refund(profileId, it)) {
    toast(`${icon("info")} 已經超過可以退回的時間了`, 2400, "rose");
    return renderTab();
  }
  if (tryOn?.item.id === it.id) endTryOn(false);
  sanitizeAllSlots();
  toast(`${icon("restart")} 已退回，${it.price} 個代幣還給你了`, 2400, "sky");
  renderTab();
}
/** 退回之後：所有角色身上用到這個商品的地方換回預設值（場景換回森林） */
function sanitizeAllSlots(): void {
  if (!profileId) return;
  const w = loadWardrobe(profileId);
  let changed = false;
  for (const s of data.slots) {
    const r = sanitizeLook(profileId, s.look, w);
    if (r.changed) {
      if (s === slot) applyLook(r.look, false);
      else s.look = r.look;
      changed = true;
    }
    const sid = sanitizeSceneId(profileId, s.scene.id, w);
    if (sid !== s.scene.id) {
      s.scene = { ...(s.sceneTimes?.[sid] ?? { id: sid, time: "day" as const, useSystemTime: false }), id: sid };
      changed = true;
      if (s === slot)
        void stage.setScene(sid).then(() => {
          stage.setTime(timeModeOf(slot.scene));
          placeProps();
        });
    }
  }
  if (changed) markDirty();
}
function shopBarHtml(): string {
  if (!profileId) return "";
  if (!tryOn && buyOnly) {
    // 購買列（不在試玩中）：今天的試玩次數用完、或試玩時間到
    const it = buyOnly.item;
    const bal = getTokenBalance(profileId);
    const enough = bal >= it.price;
    const left = sceneTrialsLeft(profileId, it.value);
    const why =
      buyOnly.reason === "timeup"
        ? `試玩時間到了${left > 0 ? `・今天還可以再試 ${left} 次` : "・今天的試玩次數用完了"}`
        : "今天的試玩次數用完了，明天可以再試";
    return `<div class="studio-shopbar" role="region" aria-label="購買">
    <p class="g-t-body"><strong>${shopName(it)}</strong>　${icon("coin", "sm")}${it.price}　<span class="g-t-caption">你有 ${bal} 個代幣</span></p>
    <p class="g-t-caption">${why}；買下來就能一直玩！</p>
    ${enough ? "" : `<p class="g-t-caption">再多 ${it.price - bal} 個代幣就能買囉！認真學習就能賺代幣。</p>`}
    <div class="studio-shopbar-actions">
      <button type="button" class="gbtn g-h-sun" data-shop="buy"${enough ? "" : " disabled"}>${icon("coin")}買下來</button>
      <button type="button" class="gbtn gbtn--quiet" data-shop="cancel">不要了</button>
    </div>
  </div>`;
  }
  if (!tryOn) return "";
  const it = tryOn.item;
  const bal = getTokenBalance(profileId);
  const enough = bal >= it.price;
  const scene = it.field === "scene";
  const left = scene && tryOn.endsAt ? Math.max(0, Math.ceil((tryOn.endsAt - Date.now()) / 1000)) : 0;
  const trial = scene
    ? `<p class="g-t-caption">試玩剩下 <strong class="studio-trial-left">${trialClock(left)}</strong>・今天還可以再試 ${sceneTrialsLeft(profileId, it.value)} 次</p>`
    : "";
  return `<div class="studio-shopbar" role="region" aria-label="${scene ? "試玩" : "試穿"}">
    <p class="g-t-body"><strong>${scene ? "試玩中" : "試穿中"}：${shopName(it)}</strong>　${icon("coin", "sm")}${it.price}　<span class="g-t-caption">你有 ${bal} 個代幣</span></p>
    ${trial}
    ${enough ? "" : `<p class="g-t-caption">再多 ${it.price - bal} 個代幣就能買囉！認真學習就能賺代幣。</p>`}
    <div class="studio-shopbar-actions">
      <button type="button" class="gbtn g-h-sun" data-shop="buy"${enough ? "" : " disabled"}>${icon("coin")}買下來</button>
      <button type="button" class="gbtn gbtn--quiet" data-shop="cancel">不要了</button>
    </div>
  </div>`;
}
function recentHtml(): string {
  if (!profileId) return "";
  const list = recentPurchases(profileId);
  if (!list.length) return "";
  return `<div class="studio-recent"><p class="g-t-label">剛買的東西（買後 10 分鐘內可以退回）</p>${list
    .map(
      ({ item, msLeft }) =>
        `<div class="studio-recent-row"><span class="g-t-body">${shopName(item)}</span><span class="g-t-caption">還有 ${Math.max(1, Math.ceil(msLeft / 60000))} 分鐘</span><button type="button" class="gbtn gbtn--quiet studio-recent-btn" data-shop="refund" data-item="${item.id}">${icon("restart", "sm")}退回</button></div>`
    )
    .join("")}</div>`;
}

const STYLE_CATS: { id: StyleCat; label: string; iconId: string }[] = [
  { id: "body", label: "身體", iconId: "user" },
  { id: "hair", label: "頭髮", iconId: "sparkle" },
  { id: "face", label: "臉", iconId: "face" },
  { id: "outfit", label: "服裝", iconId: "shirt" },
  { id: "acc", label: "配件", iconId: "star" },
  { id: "held", label: "手持物", iconId: "flag" },
];

function slotsHtml(): string {
  let h = `<div class="studio-slots" role="group" aria-label="角色槽">`;
  for (let pos = 0; pos < MAX_SLOTS; pos++) {
    const idx = slotIndexAt(data, pos);
    const s = idx >= 0 ? data.slots[idx] : null;
    const on = idx === data.activeSlot;
    if (!s) {
      h += `<button type="button" class="studio-slot studio-slot--empty" data-newslot="${pos}" aria-label="新增角色 ${pos + 1}">${icon("plus", "lg")}<span class="g-t-caption">新角色</span></button>`;
      continue;
    }
    h += `<div class="studio-slot${on ? " studio-slot--on" : ""}" data-pos="${pos}">
      <button type="button" class="studio-slot-pick" data-slot="${idx}" aria-pressed="${on}" aria-label="角色 ${pos + 1}：${escapeHtml(s.name)}">${GameArt.avatar(s.look)}</button>
      <button type="button" class="studio-slot-name g-t-caption" data-rename="${idx}" aria-label="幫「${escapeHtml(s.name)}」改名字">${escapeHtml(s.name)}</button>
      ${pos > 0 ? `<button type="button" class="studio-slot-del" data-delslot="${idx}" aria-label="刪除「${escapeHtml(s.name)}」">${icon("trash", "sm")}</button>` : ""}
    </div>`;
  }
  return h + `</div>`;
}

function escapeHtml(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function styleTabHtml(): string {
  const O = GameArt.options;
  const L = slot.look;
  let body = "";
  if (styleCat === "body") {
    // v1.4.1 起物種只剩小孩：只有一種時不顯示物種選項
    if (O.species.length > 1) body += stylesHtml("species", O.species, "物種", "body");
    body += L.species === "bear" ? chipsHtml("fur", O.fur, "fur", "毛色") : chipsHtml("skin", O.skin, "skin", "膚色");
  } else if (styleCat === "hair") {
    if (L.species === "bear") body += `<p class="g-t-body studio-note">小熊沒有頭髮，換成小孩就能選髮型喔。</p>`;
    else body += stylesHtml("hairStyle", O.hairStyle, "髮型", "head") + chipsHtml("hairColor", O.hairColor, "hair", "髮色");
  } else if (styleCat === "face") {
    // 臉型：小熊不適用（隱藏，改顯示一行說明）；眉毛對小熊也有效
    if (O.faceShape?.length) {
      body +=
        slot.look.species === "bear"
          ? `<div class="studio-field"><p class="g-t-label">臉型</p><p class="g-t-caption studio-note">小熊的臉型是固定的，可以換眼睛、嘴巴和眉毛喔</p></div>`
          : stylesHtml("faceShape", O.faceShape, "臉型", "head");
    }
    body += stylesHtml("eyes", O.eyes, "眼睛", "head");
    if (O.brows?.length) body += stylesHtml("brows", O.brows, "眉毛", "head");
    body += stylesHtml("mouth", O.mouth, "嘴巴", "head");
  } else if (styleCat === "outfit") {
    body +=
      stylesHtml("outfit", O.outfit, "衣服", "body") +
      chipsHtml("outfitColor", O.outfitColor, "hue", "衣服顏色") +
      pantsHtml();
  } else if (styleCat === "acc") {
    body += accessoriesHtml();
  } else {
    body += stylesHtml("held", O.held, "手上拿的東西", "body");
  }
  return `
    ${slotsHtml()}
    <div class="studio-cats" role="tablist">${STYLE_CATS.map(
      (c) => `<button type="button" class="studio-cat" data-cat="${c.id}" aria-pressed="${styleCat === c.id}">${icon(c.iconId)}<span>${c.label}</span></button>`
    ).join("")}</div>
    <div class="studio-cat-body">${body}</div>
    <div class="studio-style-actions">
      <button type="button" class="gbtn g-h-lilac" data-act="random">${icon("dice")}隨機</button>
      <button type="button" class="gbtn gbtn--quiet" data-act="revert">${icon("restart")}還原</button>
      <button type="button" class="gbtn g-h-mint" data-act="presets">${icon("user")}預設角色</button>
    </div>`;
}

// ---- 動作分頁 ----
let activePerformance: string | null = null;
function poseTabHtml(): string {
  const poses = performablePoses().map(
    (p) =>
      `<button type="button" class="studio-pose" data-pose="${p}" aria-pressed="${activePerformance === p}">${GameTokens.motion.poses[p]?.label ?? p}</button>`
  );
  // 「絆倒」序列只在撞到圓石時播放，不放進連播
  const seqs = GameArt.sequences.filter((q) => !SEQUENCE_ONLY_POSES.includes(q)).map(
    (s) =>
      `<button type="button" class="studio-pose studio-pose--seq" data-seq="${s}" aria-pressed="${activePerformance === "seq:" + s}">${icon("play", "sm")}${GameTokens.motion.sequences[s]?.label ?? s}</button>`
  );
  return `<p class="g-t-label">按一下讓角色表演，再按一次或開始移動就停下</p>
    <div class="studio-poses">${poses.join("")}</div>
    <p class="g-t-label" style="margin-top:12px">連播</p>
    <div class="studio-poses">${seqs.join("")}</div>`;
}
function startPerformance(key: string): void {
  if (activePerformance === key) {
    stopPerformance();
    return;
  }
  activePerformance = key;
  if (key.startsWith("seq:")) stage.playSequence(key.slice(4));
  else {
    stage.perform(key);
    // 「動作達人」：記下演過的動作
    const tried = data.stats.posesTried ?? (data.stats.posesTried = []);
    if (!tried.includes(key)) {
      tried.push(key);
      if (!data.stats.poseMasterDone && performablePoses().every((p) => tried.includes(p))) data.stats.poseMasterDone = true;
      markDirty();
    }
  }
  blip("tap");
  if (tab === "pose") renderTab();
}
function stopPerformance(): void {
  activePerformance = null;
  stage.perform(null);
  if (tab === "pose") renderTab();
}

// ---- 場景分頁（各場景獨立記憶時間設定） ----
function currentSceneSetting(): SlotScene {
  return slot.scene;
}
function timeModeOf(s: SlotScene): TimeMode {
  if (s.useSystemTime) return { kind: "system" };
  return { kind: "fixed", u: s.u ?? (s.time === "night" ? 0.75 : 0.25) };
}
function sceneTabHtml(): string {
  const s = currentSceneSetting();
  const thumbs = GameArt.scenes
    .map((id) => {
      const on = id === slot.scene.id;
      const time = (slot.sceneTimes?.[id]?.time ?? "day") as "day" | "night";
      const lk = lockInfo("scene", id);
      return `<button type="button" class="studio-scene${lk.cls}" data-scene="${id}"${lk.attr} aria-pressed="${on}" aria-label="${GameArt.sceneInfo[id].label}${lk.aria}">${GameArt.scene(id, 320, 180, { time })}<span class="g-t-label">${GameArt.sceneInfo[id].label}</span>${lk.badge}</button>`;
    })
    .join("");
  const u = s.u ?? (s.time === "night" ? 0.75 : 0.25);
  const weatherSection = s.id === "forest" ? `
    <p class="g-t-label" style="margin-top: 14px">天氣</p>
    <div class="studio-seg studio-seg--weather" role="group" aria-label="天氣設定">
      <button type="button" data-weather="sunny" aria-pressed="${currentWeather === "sunny"}">${icon("sun", "sm")}晴天</button>
      <button type="button" data-weather="rainy" aria-pressed="${currentWeather === "rainy"}">${icon("rain", "sm")}雨天</button>
      <button type="button" data-weather="typhoon" aria-pressed="${currentWeather === "typhoon"}">${icon("wind", "sm")}颱風天</button>
    </div>` : "";
  return `<div class="studio-scenes">${thumbs}</div>
    <p class="g-t-label">時間</p>
    <div class="studio-seg" role="group">
      <button type="button" data-time="day" aria-pressed="${!s.useSystemTime && s.time === "day"}">${icon("sun", "sm")}白天</button>
      <button type="button" data-time="night" aria-pressed="${!s.useSystemTime && s.time === "night"}">${icon("moon", "sm")}夜晚</button>
      <button type="button" data-time="system" aria-pressed="${s.useSystemTime}">${icon("timer", "sm")}現在時間</button>
    </div>
    <label class="studio-range"><span class="g-t-caption">拖曳時間（日出 → 正午 → 日落 → 午夜）</span>
      <input type="range" min="0" max="999" value="${Math.round(u * 999)}" data-u ${s.useSystemTime ? "disabled" : ""} aria-label="拖曳時間" /></label>
    ${weatherSection}`;
}
function applySceneSetting(s: SlotScene): void {
  slot.scene = s.id === "forest" ? { ...s, weather: currentWeather } : { ...s };
  slot.sceneTimes = { ...(slot.sceneTimes ?? {}), [s.id]: slot.scene };
  stage.setTime(timeModeOf(s));
  markDirty();
}
async function switchScene(id: string): Promise<void> {
  if (id === stage.sceneId) return;
  const remembered = slot.sceneTimes?.[id] ?? { id, time: "day" as const, useSystemTime: false, weather: "sunny" as const };
  currentWeather = id === "forest" ? (remembered.weather ?? "sunny") : "sunny";
  await stage.setScene(id);
  renderWeatherVisual();
  applySceneSetting({ ...remembered, id, weather: currentWeather });
  placeProps();
  if (tab === "scene") renderTab();
}

// ---- 相簿分頁 ----
let photoCache: PhotoRecord[] = [];
const thumbUrls = new Map<string, string>();
function albumTabHtml(): string {
  if (!photosSupported()) return `<p class="g-t-body studio-note">這個瀏覽器不能存照片，拍好可以直接下載。</p>`;
  if (photoCache.length === 0)
    return `<div class="studio-empty">${icon("image", "xl")}<p class="g-t-body">還沒有照片，按右上角的相機拍一張吧！</p></div>`;
  const where = serverSyncEnabled() ? "・照片會存到家裡的電腦，換平板也看得到" : "・照片只存在這台設備";
  return `<p class="g-t-caption">${photoCache.length} / ${MAX_PHOTOS} 張${where}</p><div class="studio-album">${photoCache
    .map((p) => {
      let url = thumbUrls.get(p.id);
      if (!url) {
        url = URL.createObjectURL(p.thumb);
        thumbUrls.set(p.id, url);
      }
      const cover = slot.coverPhotoId === p.id;
      return `<button type="button" class="studio-photo${cover ? " studio-photo--cover" : ""}" data-photo="${p.id}" aria-label="照片"><img src="${url}" alt="" />${cover ? `<span class="g-tag g-h-sun">封面</span>` : ""}</button>`;
    })
    .join("")}</div>`;
}
async function refreshAlbum(sync = true): Promise<void> {
  if (!profileId || !photosSupported()) return;
  try {
    photoCache = await listPhotos(profileId);
  } catch {
    photoCache = [];
  }
  if (tab === "album") renderTab();
  // 背景跟電腦同步（補傳、下載別台拍的、跟著別台刪除）；本機有變再重畫一次
  if (sync) {
    const pid = profileId;
    void syncPhotos(pid)
      .then((changed) => {
        if (changed && profileId === pid) return refreshAlbum(false);
      })
      .catch(() => {});
  }
}

// ---- 分頁渲染 ----
const TABS: { id: TabId; label: string; iconId: string }[] = [
  { id: "style", label: "造型", iconId: "shirt" },
  { id: "pose", label: "動作", iconId: "sparkle" },
  { id: "scene", label: "場景", iconId: "map" },
  { id: "album", label: "相簿", iconId: "image" },
];
function renderTabs(): void {
  $(".studio-tabs").innerHTML = TABS.map(
    (t) => `<button type="button" role="tab" class="studio-tab" data-tab="${t.id}" aria-selected="${tab === t.id}">${icon(t.iconId)}<span>${t.label}</span></button>`
  ).join("");
}
function renderTab(): void {
  const body = $(".studio-tab-body");
  const scroll = body.scrollTop;
  body.innerHTML =
    shopBarHtml() +
    (tab === "style" ? styleTabHtml() + recentHtml() : tab === "pose" ? poseTabHtml() : tab === "scene" ? sceneTabHtml() + recentHtml() : albumTabHtml());
  body.scrollTop = scroll;
}
function renderName(): void {
  $(".studio-name-text").textContent = slot.name;
  // 2026-10-21：拿掉名字下方的賽跑稱號（森林跑者／閃電跑者／飛毛腿），使用者決定；賽跑頁照常顯示
}
function renderViews(): void {
  const views: { v: View; label: string }[] = [
    { v: "front", label: "正" },
    { v: "side", label: "側" },
    { v: "back", label: "背" },
  ];
  $(".studio-views").innerHTML = views
    .map((x) => `<button type="button" data-view="${x.v}" aria-pressed="${stage.view === x.v}" aria-label="${x.label}面">${x.label}</button>`)
    .join("");
}
function renderSound(): void {
  $(".studio-sound").innerHTML = icon(soundOn() ? "sound" : "mute");
}

// ---- 事件 ----
$(".studio-back").addEventListener("click", () => {
  saveNow();
  void leaveTo(undefined, () => saveNow());
});
$(".studio-undo").addEventListener("click", undo);
$(".studio-redo").addEventListener("click", redo);
// 賽跑：同視窗導航，離開前先存檔
// 賽跑捷徑只在賽跑已上架（或在遊戲實驗室）時出現
document.querySelector(".studio-race")?.addEventListener("click", () => {
  saveNow();
  void flushPending().finally(() => window.location.assign(`race.html?from=${returnTarget()}`));
});

$(".studio-sound").addEventListener("click", () => {
  setSetting(SETTINGS.sound, soundOn() ? "0" : "1");
  renderSound();
  blip("tap");
});
$(".studio-name").addEventListener("click", () => startRename($(".studio-name"), data.activeSlot));
$(".studio-camera").addEventListener("click", () => toggleCamera());
$(".studio-drawer-toggle").addEventListener("click", () => setDrawer(!drawerOpen));
$(".studio-views").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-view]");
  if (!b) return;
  stage.setView(b.dataset.view as View);
  renderViews();
});
$(".studio-tabs").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-tab]");
  if (!b) return;
  const next = b.dataset.tab as TabId;
  // 手機直放：再點一次目前的分頁＝收合抽屜
  if (isPortraitDrawer() && drawerOpen && next === tab) {
    setDrawer(false);
    return;
  }
  tab = next;
  if (tab === "album") void refreshAlbum();
  renderTabs();
  renderTab();
  if (!drawerOpen) setDrawer(true);
});

const body = $(".studio-tab-body");
body.addEventListener("click", async (e) => {
  const t = e.target as HTMLElement;
  const btn = t.closest<HTMLButtonElement>("button");
  if (!btn) return;
  // 商店：試穿列的按鈕、剛買的東西退回
  if (btn.dataset.shop === "buy") return buyTryOn();
  if (btn.dataset.shop === "cancel") {
    if (buyOnly && !tryOn) {
      buyOnly = null;
      return renderTab();
    }
    return endTryOn();
  }
  if (btn.dataset.shop === "refund") return refundItem(btn.dataset.item!);
  // 點了還沒買的款式／場景：先試穿（不扣代幣、不存檔）
  if (btn.dataset.shopitem) {
    const it = shopItems().find((x) => x.id === btn.dataset.shopitem);
    if (it) return startTryOn(it);
  }
  // 點了其他東西＝結束試穿
  if (tryOn && (btn.dataset.set || btn.dataset.acc || btn.dataset.scene || btn.dataset.slot || btn.dataset.newslot || btn.dataset.act)) endTryOn(false);
  if (buyOnly && (btn.dataset.set || btn.dataset.acc || btn.dataset.scene || btn.dataset.slot || btn.dataset.newslot || btn.dataset.act)) buyOnly = null;
  if (btn.dataset.set) return setField(btn.dataset.set as keyof Look, btn.dataset.v!);
  if (btn.dataset.acc) return toggleAccessory(btn.dataset.acc);
  if (btn.dataset.cat) {
    styleCat = btn.dataset.cat as StyleCat;
    return renderTab();
  }
  if (btn.dataset.slot) return switchSlot(Number(btn.dataset.slot));
  if (btn.dataset.newslot) return createSlotAt(Number(btn.dataset.newslot));
  if (btn.dataset.rename) return startRename(btn, Number(btn.dataset.rename));
  if (btn.dataset.delslot) return deleteSlot(Number(btn.dataset.delslot));
  if (btn.dataset.act === "random") return randomize();
  if (btn.dataset.act === "revert") return applyLook(clone(entryLook));
  if (btn.dataset.act === "presets") return openPresets();
  if (btn.dataset.pose) return startPerformance(btn.dataset.pose);
  if (btn.dataset.seq) return startPerformance("seq:" + btn.dataset.seq);
  if (btn.dataset.scene) return switchScene(btn.dataset.scene);
  if (btn.dataset.time) {
    const s = currentSceneSetting();
    if (btn.dataset.time === "system") applySceneSetting({ ...s, useSystemTime: true });
    else applySceneSetting({ ...s, useSystemTime: false, time: btn.dataset.time as "day" | "night", u: btn.dataset.time === "night" ? 0.75 : 0.25 });
    return renderTab();
  }
  if (btn.dataset.weather) {
    const s = currentSceneSetting();
    if (s.id !== "forest") return;
    const w = btn.dataset.weather as WeatherType;
    setWeather(w);
    applySceneSetting({ ...s, weather: w });
    return renderTab();
  }
  if (btn.dataset.photo) return openPhoto(btn.dataset.photo);
});
body.addEventListener("input", (e) => {
  const el = e.target as HTMLInputElement;
  if (!el.hasAttribute("data-u")) return;
  const u = Number(el.value) / 999;
  const night = u > 0.5 && u < 1;
  slot.scene = { ...slot.scene, useSystemTime: false, u, time: night ? "night" : "day" };
  slot.sceneTimes = { ...(slot.sceneTimes ?? {}), [slot.scene.id]: slot.scene };
  stage.setTime({ kind: "fixed", u });
  markDirty();
});
body.addEventListener("change", (e) => {
  if ((e.target as HTMLElement).hasAttribute("data-u") && tab === "scene") renderTab();
});

// 長按色票／款式顯示名稱（不能只靠顏色）
let pressTimer = 0;
body.addEventListener("pointerdown", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".studio-swatch,.studio-thumb");
  if (!b) return;
  pressTimer = window.setTimeout(() => toast(b.getAttribute("aria-label") ?? "", 1400, "sky"), 450);
});
["pointerup", "pointercancel", "pointerleave"].forEach((ev) => body.addEventListener(ev, () => clearTimeout(pressTimer)));

pad.on((k, v) => {
  if (!v) return;
  // 被咬住或被抱住時，方向鍵左右交替連按掙脫
  if (struggleTarget && (k === "left" || k === "right")) {
    handleStruggleTap(k);
    return;
  }
  if (activePerformance && (k === "left" || k === "right" || k === "a" || k === "down")) {
    activePerformance = null;
    if (tab === "pose") renderTab();
  }
  if (k === "c") {
    handleSpecialAction();
  }
});
// 判斷角色是否裝備變身符咒（化身小殭屍造型）
function isZombieTransformed(): boolean {
  const look = (stage?.currentLook as Look | undefined) ?? slot?.look;
  const acc = (look?.accessories as string[]) || [];
  return acc.includes("zombieTalisman");
}

// 萬聖節怪物幽默搞笑對話庫
const HALLOWEEN_DIALOGUES = [
  "萬聖節快樂！你額頭上的符咒哪裡買的？好帥！",
  "三百年不見了！你身上的衣服洗過了嗎？",
  "你有看見我的屁股嗎？剛剛跳太快好像掉了...",
  "要一起來一顆發光的糖果嗎？",
  "今天的月亮是骷髏頭造型耶，超浪漫的對吧！",
  "隔壁的寶箱今天假牙鬆了，別惹他生氣喔！",
  "借過一下～我的腳趾頭好像被石頭卡住了！",
  "你也是被剛才那顆超大南瓜嚇醒的嗎？太鬧了吧！",
];
let lastMonsterChatAt = 0;
let activeMonsterBubble: { el: HTMLDivElement; target: HTMLElement; expiresAt: number } | null = null;

function tryMonsterTalk(targetEl: HTMLElement | null | undefined, dist: number): void {
  const now = performance.now();
  if (!targetEl || dist > 0.1 || now - lastMonsterChatAt < 3500) return;
  lastMonsterChatAt = now;
  const msg = HALLOWEEN_DIALOGUES[Math.floor(Math.random() * HALLOWEEN_DIALOGUES.length)];

  if (activeMonsterBubble) {
    activeMonsterBubble.el.remove();
    activeMonsterBubble = null;
  }

  const bubble = document.createElement("div");
  bubble.className = "monster-dialog-bubble";
  bubble.textContent = msg;
  stage.hud.appendChild(bubble);

  activeMonsterBubble = { el: bubble, target: targetEl, expiresAt: now + 3200 };
  updateMonsterBubblePos();
  blip("pop");
}

function updateMonsterBubblePos(): void {
  if (!activeMonsterBubble) return;
  const now = performance.now();
  if (now >= activeMonsterBubble.expiresAt) {
    const el = activeMonsterBubble.el;
    el.classList.add("monster-dialog-bubble--fadeout");
    setTimeout(() => el.remove(), 250);
    activeMonsterBubble = null;
    return;
  }
  const { el, target } = activeMonsterBubble;
  if (!target.isConnected) {
    el.remove();
    activeMonsterBubble = null;
    return;
  }
  const tRect = target.getBoundingClientRect();
  const hudRect = stage.hud.getBoundingClientRect();
  const cx = tRect.left - hudRect.left + tRect.width / 2;
  const top = tRect.top - hudRect.top - 12;
  el.style.left = `${cx.toFixed(1)}px`;
  el.style.top = `${top.toFixed(1)}px`;
}

// 視角鈕跟實際視角一致（移動時自動轉側面也會亮「側」）
stage.onViewChange = () => renderViews();
// 角色走路速度倍率：被咬住無法行走、被巨手抓住無法行走、被殭屍抱住行動緩慢、變身符咒殭屍步行、颱風天順逆風影響
stage.speedMult = (mv: number) => {
  if (trappedChest) return 0;
  if (trappedHand) return 0;
  if (huggedZombie) return 0.35;
  if (isZombieTransformed()) return 0.65; // 變身符咒：一般殭屍行走速度 (0.65x)，不能跑步
  if (stage.sceneId === "forest" && currentWeather === "typhoon") {
    return mv < 0 ? 1.95 : 0.35;
  }
  return 1;
};

// ---- 掙脫機制（會咬人的寶箱、緊緊抱人的可愛殭屍、地底突襲冒出的巨手） ----
let trappedChest: PlayProp | null = null;
let chestCooldownUntil = 0;
let trappedHand: PlayProp | null = null;
let huggedZombie: ZombieEntity | null = null;
let struggleTarget: "chest" | "zombie" | "hand" | null = null;
let struggleProgressMs = 0;
let lastStruggleTapAt = 0;
let lastStruggleKey: "left" | "right" | null = null;
let struggleHudEl: HTMLDivElement | null = null;

function showStruggleHud(text: string): void {
  if (!struggleHudEl) {
    struggleHudEl = document.createElement("div");
    struggleHudEl.className = "studio-struggle-hud";
    stage.hud.appendChild(struggleHudEl);
  }
  updateStruggleHud(text, struggleProgressMs);
}

function updateStruggleHud(text: string, progressMs: number): void {
  if (!struggleHudEl) return;
  const pct = Math.min(100, Math.round((progressMs / 5000) * 100));
  const charRect = stage.charEl.getBoundingClientRect();
  const hudRect = stage.hud.getBoundingClientRect();
  const cx = charRect.left - hudRect.left + charRect.width / 2;
  const top = charRect.top - hudRect.top - 14;
  struggleHudEl.style.left = `${cx}px`;
  struggleHudEl.style.top = `${top}px`;
  struggleHudEl.innerHTML = `
    <span>${text}</span>
    <div class="studio-struggle-track">
      <div class="studio-struggle-fill" style="width: ${pct}%"></div>
    </div>
  `;
}

function removeStruggleHud(): void {
  if (struggleHudEl) {
    struggleHudEl.remove();
    struggleHudEl = null;
  }
}

function handleStruggleTap(k: "left" | "right"): void {
  const now = performance.now();
  const isAlternating = lastStruggleKey === null || k !== lastStruggleKey;
  lastStruggleKey = k;

  if (isAlternating) {
    // 快速連按左右左右持續 5 秒（每次交替累計約 220~280ms 進度）
    const dt = lastStruggleTapAt > 0 ? Math.min(320, Math.max(120, now - lastStruggleTapAt)) : 220;
    struggleProgressMs = Math.min(5000, struggleProgressMs + dt);
    lastStruggleTapAt = now;

    if (struggleHudEl) {
      struggleHudEl.classList.remove("studio-struggle-hud--shake");
      void struggleHudEl.offsetWidth;
      struggleHudEl.classList.add("studio-struggle-hud--shake");
    }

    const shakeOffset = k === "left" ? -4 : 4;
    stage.charEl.style.transform = `translateX(calc(-50% + ${shakeOffset}px))`;
    if (struggleTarget === "hand" && trappedHand?.el) {
      const handEl = trappedHand.el;
      const hw = Number(handEl.dataset.w) || handEl.offsetWidth;
      const hx = stage.propScreenX(trappedHand) - hw / 2;
      handEl.style.transform = `translateX(calc(${hx.toFixed(1)}px + ${shakeOffset}px))`;
    }
    setTimeout(() => {
      if (stage.charEl) stage.charEl.style.transform = "translateX(-50%)";
      if (struggleTarget === "hand" && trappedHand?.el) {
        stage.positionProps();
      }
    }, 60);

    blip("tap");
  }

  const promptText = struggleTarget === "chest" ? "連按 ← → 掙脫寶箱！" : struggleTarget === "hand" ? "連按 ← → 掙脫巨手！" : "連按 ← → 彈開殭屍！";
  updateStruggleHud(promptText, struggleProgressMs);

  if (struggleProgressMs >= 5000) {
    resolveStruggle();
  }
}

function resolveStruggle(): void {
  const target = struggleTarget;
  struggleTarget = null;
  struggleProgressMs = 0;
  lastStruggleKey = null;
  lastStruggleTapAt = 0;
  removeStruggleHud();

  if (target === "chest" && trappedChest) {
    const chest = trappedChest;
    trappedChest = null;
    stage.allowJump = true;
    chestCooldownUntil = performance.now() + 5000;
    stage.setPropState(chest, "dizzy");
    setTimeout(() => {
      if (chest.state === "dizzy") stage.setPropState(chest, "closed");
    }, 4500);

    // 跳離寶箱至一個角色遠（因咬人寶箱加大為 3 倍大，跳離約 135px）
    const jumpDir = stage.dir === 1 ? -1 : 1;
    stage.offset += jumpDir * -135;
    stage.bounce(1.15);
    stage.onJump();
    blip("jump");
    floatText("跳開掙脫！", 0.5, 0.45, "sun");
  } else if (target === "hand" && trappedHand) {
    const hand = trappedHand;
    trappedHand = null;
    stage.allowJump = true;
    stage.allowCrouch = true;
    hand.cooldownUntil = performance.now() + 10000;
    stage.setPropState(hand, "retreat");
    if (hand.el) hand.el.classList.add("studio-hand-retreat");

    // 角色跳離巨手
    const jumpDir = stage.dir === 1 ? -1 : 1;
    stage.offset += jumpDir * -75;
    stage.bounce(1.25);
    stage.onJump();
    blip("jump");
    floatText("跳開掙脫巨手！", 0.5, 0.42, "sun");

    setTimeout(() => {
      if (hand.state === "retreat") {
        if (hand.el) hand.el.classList.remove("studio-hand-retreat");
        stage.setPropState(hand, "hidden");
        // 隨機重置至不特定的新位置
        hand.x = Number((0.5 + Math.random() * 5.0).toFixed(2));
        stage.positionProps();
      }
    }, 1200);
  } else if (target === "zombie" && huggedZombie) {
    const z = huggedZombie;
    huggedZombie = null;
    z.isFlung = true;
    z.state = "dizzy";
    z.el.innerHTML = GameArt.prop("zombie", { state: "dizzy" });
    // 彈開至三個角色遠（水平速度向外激射，拋起弧度）
    const flingDir = stage.dir === 1 ? -1 : 1;
    z.flungVx = flingDir * 250;
    z.flungVy = -270;
    z.hugCooldownUntil = performance.now() + 5000;
    blip("pop");
    floatText("彈開殭屍！", 0.5, 0.45, "mint");
  }
}

/** 被怪物纏住時，即時換上變身符咒，纏住效果立即解除 */
function releaseMonsterTrapByTalisman(): void {
  if (!struggleTarget && !trappedChest && !trappedHand && !huggedZombie) return;

  struggleTarget = null;
  struggleProgressMs = 0;
  lastStruggleKey = null;
  lastStruggleTapAt = 0;
  removeStruggleHud();
  stage.allowJump = true;
  stage.allowCrouch = true;

  if (trappedChest) {
    const chest = trappedChest;
    trappedChest = null;
    chestCooldownUntil = performance.now() + 6000;
    stage.setPropState(chest, "closed");
    tryMonsterTalk(chest.el, 0);
  }

  if (trappedHand) {
    const hand = trappedHand;
    trappedHand = null;
    hand.cooldownUntil = performance.now() + 10000;
    stage.setPropState(hand, "retreat");
    if (hand.el) hand.el.classList.add("studio-hand-retreat");
    setTimeout(() => {
      if (hand.state === "retreat") {
        if (hand.el) hand.el.classList.remove("studio-hand-retreat");
        stage.setPropState(hand, "hidden");
        hand.x = Number((0.5 + Math.random() * 5.0).toFixed(2));
        stage.positionProps();
      }
    }, 1200);
  }

  if (huggedZombie) {
    const z = huggedZombie;
    huggedZombie = null;
    z.hugCooldownUntil = performance.now() + 6000;
    z.state = "wave";
    z.el.innerHTML = GameArt.prop("zombie", { state: "wave" });
    tryMonsterTalk(z.el, 0);
  }

  if (stage.charEl) stage.charEl.style.transform = "translateX(-50%)";
  stage.positionProps();
  blip("coin");
  floatText("✨ 換上符咒！怪物認出同伴鬆開了！", 0.5, 0.38, "mint");
}

/** 裝備變身符咒瞬間：玩家四周冒出一團白煙（卸載裝備時不用） */
function spawnTalismanSmokeEffect(): void {
  if (prefersReducedMotion() || !stage.charEl) return;

  const charRect = stage.charEl.getBoundingClientRect();
  const hudRect = stage.hud.getBoundingClientRect();
  const cx = charRect.left - hudRect.left + charRect.width / 2;
  const cy = charRect.top - hudRect.top + charRect.height / 2;

  const container = document.createElement("div");
  container.className = "talisman-smoke-container";

  // 1. 中心核心煙團 (Core puff)
  const core = document.createElement("div");
  core.className = "talisman-smoke-core";
  core.style.left = `${cx}px`;
  core.style.top = `${cy}px`;
  core.innerHTML = `
    <svg width="120" height="120" viewBox="0 0 120 120" overflow="visible">
      <defs>
        <filter id="smokeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="var(--g-stone-ledge)" flood-opacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#smokeShadow)">
        <circle cx="60" cy="60" r="38" fill="var(--g-surface-raised)" />
        <circle cx="44" cy="46" r="28" fill="var(--g-surface-raised)" />
        <circle cx="76" cy="46" r="28" fill="var(--g-surface-raised)" />
        <circle cx="40" cy="70" r="26" fill="var(--g-surface-raised)" />
        <circle cx="80" cy="70" r="26" fill="var(--g-surface-raised)" />
        <circle cx="60" cy="38" r="24" fill="var(--g-stone-soft)" opacity="0.6" />
        <circle cx="60" cy="60" r="28" fill="var(--g-surface-raised)" />
      </g>
    </svg>
  `;
  container.appendChild(core);

  // 2. 圍繞玩家四周向外爆發的白煙團 (10 枚環狀噴散煙球)
  const puffCount = 10;
  const puffRadius = 55;
  for (let i = 0; i < puffCount; i++) {
    const angle = (i * (360 / puffCount) + (Math.random() - 0.5) * 20) * (Math.PI / 180);
    const dist = puffRadius + (Math.random() - 0.5) * 20;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist * 0.85);
    const size = Math.round(36 + Math.random() * 26);

    const puff = document.createElement("div");
    puff.className = "talisman-smoke-puff";
    puff.style.left = `${cx}px`;
    puff.style.top = `${cy}px`;
    puff.style.setProperty("--tx", `${tx}px`);
    puff.style.setProperty("--ty", `${ty}px`);
    puff.style.animationDelay = `${(i * 0.02).toFixed(2)}s`;

    puff.innerHTML = `
      <svg width="${size}" height="${size}" viewBox="0 0 60 60" overflow="visible">
        <circle cx="30" cy="30" r="25" fill="var(--g-surface-raised)" />
        <circle cx="24" cy="24" r="14" fill="var(--g-stone-soft)" opacity="0.5" />
      </svg>
    `;
    container.appendChild(puff);
  }

  // 3. 飄逸小煙圈 (6 枚向上飄揚)
  const wispCount = 6;
  for (let i = 0; i < wispCount; i++) {
    const angle = ((i * 60 + 30 + (Math.random() - 0.5) * 30) * Math.PI) / 180;
    const dist = 35 + Math.random() * 30;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist * 0.6 - 20);

    const wisp = document.createElement("div");
    wisp.className = "talisman-smoke-wisp";
    wisp.style.left = `${cx}px`;
    wisp.style.top = `${cy}px`;
    wisp.style.setProperty("--tx", `${tx}px`);
    wisp.style.setProperty("--ty", `${ty}px`);
    wisp.style.animationDelay = `${(0.06 + i * 0.03).toFixed(2)}s`;

    const wispSize = 18 + Math.random() * 12;
    wisp.innerHTML = `
      <svg width="${wispSize}" height="${wispSize}" viewBox="0 0 30 30" overflow="visible">
        <circle cx="15" cy="15" r="12" fill="var(--g-surface-raised)" opacity="0.9" />
        <circle cx="15" cy="15" r="6" fill="var(--g-sun-soft)" opacity="0.75" />
      </svg>
    `;
    container.appendChild(wisp);
  }

  stage.hud.appendChild(container);
  blip("pop");
  blip("coin");

  window.setTimeout(() => {
    container.remove();
  }, 950);
}

// ---- 特殊手持物技能（魔拐杖：四射流星與閃光；南瓜糖果桶：天降糖果雨） ----
let specialActionTimer = 0;

function currentStudioHeld(): string | undefined {
  return stage.currentLook?.held ?? slot?.look?.held;
}

function updateCKeyVisibility(): void {
  const held = currentStudioHeld();
  const hasSpecial = held === "magiccane" || held === "pumpkinbucket";
  pad.setKeyVisible("c", hasSpecial);
}

function handleSpecialAction(): void {
  const held = currentStudioHeld();
  if (held !== "magiccane" && held !== "pumpkinbucket") return;

  // 1. 角色執行揮手動作
  stage.perform("wave");
  clearTimeout(specialActionTimer);
  specialActionTimer = window.setTimeout(() => {
    if (stage.currentPose === "wave" || activePerformance === "wave") {
      stage.perform(null);
      activePerformance = null;
      if (tab === "pose") renderTab();
    }
  }, 1900);

  // 2. 計算角色在 stage.hud 的中心座標
  const charRect = stage.charEl.getBoundingClientRect();
  const hudRect = stage.hud.getBoundingClientRect();
  const cx = charRect.left - hudRect.left + charRect.width / 2;
  const cy = charRect.top - hudRect.top + charRect.height / 2;

  // 3. 特效觸發
  if (held === "magiccane") {
    blip("pop");
    triggerMagicCaneEffects(cx, cy);
  } else if (held === "pumpkinbucket") {
    blip("coin");
    triggerPumpkinBucketEffects(cx);
  }

  // 4. 特技驅散怪物：殭屍逃離使用者 3 秒，咬人的寶箱關閉不咬人 3 秒
  scareGraveyardMonsters(performance.now());
}

/** 當使用魔拐杖或南瓜糖果桶特技時，驅散萬聖節怪物：殭屍逃離 3 秒、咬人寶箱關閉不咬人 3 秒 */
function scareGraveyardMonsters(now: number): void {
  // 1. 咬人的寶箱：立即鬆開角色、關閉且 3 秒內不咬人
  chestCooldownUntil = Math.max(chestCooldownUntil, now + 3000);
  if (trappedChest) {
    trappedChest = null;
    stage.allowJump = true;
    stage.allowCrouch = true;
    if (struggleTarget === "chest") {
      struggleTarget = null;
      struggleProgressMs = 0;
      lastStruggleKey = null;
      lastStruggleTapAt = 0;
      removeStruggleHud();
    }
    floatText("寶箱被嚇退！", 0.5, 0.42, "sun");
  }
  for (const p of playProps) {
    if (p.kind === "chest") {
      stage.setPropState(p, "closed");
    }
  }

  // 2. 可愛殭屍：立即脫離緊抱、逃離使用者 3 秒
  if (huggedZombie) {
    huggedZombie = null;
    if (struggleTarget === "zombie") {
      struggleTarget = null;
      struggleProgressMs = 0;
      lastStruggleKey = null;
      lastStruggleTapAt = 0;
      removeStruggleHud();
    }
    floatText("殭屍嚇跑了！", 0.5, 0.42, "mint");
  }

  const W = stage.width;
  const charCx = stage.charX * W;
  for (const z of graveyardZombies) {
    z.fleeingUntil = now + 3000;
    z.isFlung = false;
    z.flungVx = 0;
    z.flungVy = 0;
    const screenX = stage.propScreenX({ id: "zombie", x: z.x });
    z.dir = screenX >= charCx ? 1 : -1;
    z.state = "wave";
    z.el.innerHTML = GameArt.prop("zombie", { state: "wave" });
  }

  // 3. 地底巨手：立即鬆脫角色並縮回地底
  if (trappedHand) {
    const hand = trappedHand;
    trappedHand = null;
    stage.allowJump = true;
    stage.allowCrouch = true;
    if (struggleTarget === "hand") {
      struggleTarget = null;
      struggleProgressMs = 0;
      lastStruggleKey = null;
      lastStruggleTapAt = 0;
      removeStruggleHud();
    }
    hand.cooldownUntil = now + 15000;
    stage.setPropState(hand, "retreat");
    if (hand.el) hand.el.classList.add("studio-hand-retreat");
    floatText("巨手被嚇退！", 0.5, 0.42, "sun");
    setTimeout(() => {
      if (hand.state === "retreat") {
        if (hand.el) hand.el.classList.remove("studio-hand-retreat");
        stage.setPropState(hand, "hidden");
        hand.x = Number((0.5 + Math.random() * 5.0).toFixed(2));
        stage.positionProps();
      }
    }, 1200);
  }
  for (const p of playProps) {
    if (p.kind === "giantHand" && p.state === "grab") {
      p.cooldownUntil = now + 15000;
      stage.setPropState(p, "retreat");
      if (p.el) p.el.classList.add("studio-hand-retreat");
      setTimeout(() => {
        if (p.state === "retreat") {
          if (p.el) p.el.classList.remove("studio-hand-retreat");
          stage.setPropState(p, "hidden");
          p.x = Number((0.5 + Math.random() * 5.0).toFixed(2));
          stage.positionProps();
        }
      }, 1200);
    }
  }
}

function triggerMagicCaneEffects(cx: number, cy: number): void {
  if (prefersReducedMotion()) return;
  const container = document.createElement("div");
  container.className = "studio-fx-container";

  // 1. 煙火光環（加大範圍至 250px 半徑）
  const ring1 = document.createElement("div");
  ring1.className = "magic-ring";
  ring1.style.left = `${cx}px`;
  ring1.style.top = `${cy - 16}px`;
  ring1.style.width = "64px";
  ring1.style.height = "64px";
  container.appendChild(ring1);

  const ring2 = document.createElement("div");
  ring2.className = "magic-ring";
  ring2.style.left = `${cx}px`;
  ring2.style.top = `${cy - 16}px`;
  ring2.style.width = "96px";
  ring2.style.height = "96px";
  ring2.style.borderColor = "var(--g-lilac)";
  ring2.style.animationDelay = "0.15s";
  container.appendChild(ring2);

  // 2. 閃光碎片（範圍加大至 100~240px，22 枚向量星芒與鑽石）
  const colors = ["var(--g-sun)", "var(--g-lilac)", "var(--g-rose)", "var(--g-sky)", "var(--g-mint)"];
  const shardCount = 22;
  for (let i = 0; i < shardCount; i++) {
    const shard = document.createElement("div");
    shard.className = "magic-shard";
    const color = colors[i % colors.length];
    const isStar = i % 2 === 0;
    shard.innerHTML = isStar
      ? `<svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0 Z" fill="${color}"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 0 L16 8 L8 16 L0 8 Z" fill="${color}"/></svg>`;

    const angle = (i / shardCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
    const dist = 90 + Math.random() * 135;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist);
    const trot = `${Math.round((Math.random() - 0.5) * 360)}deg`;

    shard.style.left = `${cx - 10}px`;
    shard.style.top = `${cy - 10}px`;
    shard.style.setProperty("--tx", `${tx}px`);
    shard.style.setProperty("--ty", `${ty}px`);
    shard.style.setProperty("--trot", trot);
    shard.style.animationDelay = `${(Math.random() * 0.16).toFixed(2)}s`;
    shard.style.animationDuration = `${(1.1 + Math.random() * 0.35).toFixed(2)}s`;
    container.appendChild(shard);
  }

  // 3. 四射的流星（8 顆向八方飛散的拖尾流星）
  const meteorCount = 8;
  const meteorColors = ["#FFD873", "#BDAEE8", "#8EC5E8", "#9ADBC0", "#F4A9C8", "#FFB596", "#FFD873", "#BDAEE8"];
  for (let i = 0; i < meteorCount; i++) {
    const angle = (i / meteorCount) * 2 * Math.PI;
    const dist = 180 + Math.random() * 95;
    const tx = Math.round(Math.cos(angle) * dist);
    const ty = Math.round(Math.sin(angle) * dist);
    const rotDeg = Math.round((angle * 180) / Math.PI);
    const mColor = meteorColors[i % meteorColors.length];

    const meteor = document.createElement("div");
    meteor.className = "magic-meteor";
    meteor.style.left = `${cx - 30}px`;
    meteor.style.top = `${cy - 10}px`;
    meteor.style.setProperty("--tx", `${tx}px`);
    meteor.style.setProperty("--ty", `${ty}px`);
    meteor.style.setProperty("--rot", `${rotDeg}deg`);
    meteor.style.animationDelay = `${(i * 0.035).toFixed(2)}s`;

    meteor.innerHTML = `
      <svg width="60" height="20" viewBox="0 0 60 20" overflow="visible">
        <path d="M 0 10 Q 25 10 46 10" stroke="${mColor}" stroke-width="4.5" stroke-linecap="round" opacity="0.85" />
        <path d="M 12 10 Q 30 10 46 10" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.9" />
        <circle cx="46" cy="10" r="6" fill="${mColor}" opacity="0.4" />
        <circle cx="46" cy="10" r="3.5" fill="#FFFDF0" />
        <path d="M 46 3 Q 46 10 53 10 Q 46 10 46 17 Q 46 10 39 10 Q 46 10 46 3 Z" fill="${mColor}" />
      </svg>
    `;
    container.appendChild(meteor);
  }

  stage.hud.appendChild(container);
  setTimeout(() => container.remove(), 1900);
}

function triggerPumpkinBucketEffects(cx: number): void {
  if (prefersReducedMotion()) return;
  const container = document.createElement("div");
  container.className = "studio-fx-container";

  // 糖果雨（從使用者位置上方「畫面外」降下至「地面」）
  const candyColors = ["#FFB596", "#FFD873", "#A7D79A", "#F4A9C8", "#8EC5E8", "#BDAEE8"];
  const candyCount = 26;
  const H = stage.height;
  const groundY = 0.88 * H;

  for (let i = 0; i < candyCount; i++) {
    const drop = document.createElement("div");
    drop.className = "candy-drop";
    const c1 = candyColors[i % candyColors.length];
    const c2 = candyColors[(i + 2) % candyColors.length];
    const kind = i % 3;

    if (kind === 0) {
      drop.innerHTML = `<svg width="26" height="18" viewBox="0 0 24 16"><path d="M7 3 Q12 0 17 3 L17 13 Q12 16 7 13 Z" fill="${c1}"/><polygon points="7,8 2,2 2,14" fill="${c2}"/><polygon points="17,8 22,2 22,14" fill="${c2}"/><circle cx="12" cy="8" r="2.2" fill="#FFFFFF" opacity="0.85"/></svg>`;
    } else if (kind === 1) {
      drop.innerHTML = `<svg width="18" height="26" viewBox="0 0 16 24"><circle cx="8" cy="8" r="7" fill="${c1}"/><circle cx="8" cy="8" r="4" fill="#FFFFFF" opacity="0.65"/><rect x="7" y="15" width="2" height="9" rx="1" fill="#FFFFFF"/></svg>`;
    } else {
      drop.innerHTML = `<svg width="20" height="20" viewBox="0 0 18 18"><ellipse cx="9" cy="9" rx="8" ry="6.2" fill="${c1}"/><ellipse cx="7.5" cy="7.2" rx="3.2" ry="1.6" fill="#FFFFFF" opacity="0.75"/></svg>`;
    }

    // 畫面外上方（startY: -40 ~ -120px）
    const startX = Math.round(cx - 120 + Math.random() * 240);
    const startY = Math.round(-40 - Math.random() * 90);
    const ty = Math.round(groundY - startY + (Math.random() * 16 - 8));
    const tx = Math.round((Math.random() - 0.5) * 70);
    const trot = `${Math.round((Math.random() - 0.5) * 220)}deg`;

    drop.style.left = `${startX}px`;
    drop.style.top = `${startY}px`;
    drop.style.setProperty("--tx", `${tx}px`);
    drop.style.setProperty("--ty", `${ty}px`);
    drop.style.setProperty("--trot", trot);
    drop.style.animationDelay = `${(Math.random() * 0.55).toFixed(2)}s`;
    drop.style.animationDuration = `${(1.5 + Math.random() * 0.45).toFixed(2)}s`;
    container.appendChild(drop);
  }

  stage.hud.appendChild(container);
  setTimeout(() => container.remove(), 2600);
}

// ---- 角色名稱（頂部列與角色卡都能行內改名：Enter／失焦儲存、Esc 取消；不進復原堆疊） ----
function startRename(anchor: HTMLElement, idx: number): void {
  const target = data.slots[idx];
  if (!target || anchor.hidden) return;
  const original = target.name;
  const input = document.createElement("input");
  input.className = "studio-rename";
  input.value = original;
  input.maxLength = NAME_MAX * 2;
  input.setAttribute("aria-label", "角色名稱");
  input.setAttribute("enterkeyhint", "done");
  const restore = () => {
    input.remove();
    anchor.hidden = false;
    renderName();
    if (tab === "style") renderTab();
  };
  let done = false;
  const commit = (save: boolean) => {
    if (done) return;
    done = true;
    if (save) {
      const r = validateName(input.value);
      if (!r.ok) {
        // 不合規：簡短提示、保留原名
        toast(`${icon("info")} ${r.reason}，名字沒有改`, 2200, "rose");
      } else if (r.name !== original) {
        target.name = r.name;
        target.updatedAt = Date.now();
        markDirty();
      }
    }
    restore();
  };
  input.addEventListener("keydown", (e) => {
    e.stopPropagation(); // 打字時不要觸發虛擬按鍵（A／B／J／K）
    if (e.key === "Enter") {
      e.preventDefault();
      commit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      commit(false);
    }
  });
  input.addEventListener("blur", () => commit(true));
  input.addEventListener("click", (e) => e.stopPropagation());
  // 輸入框放在按鈕旁邊（不能放進 <button> 裡，空白鍵／Enter 會觸發按鈕）
  anchor.hidden = true;
  anchor.after(input);
  input.focus();
  input.select();
}

// ---- 預設角色（9 組） ----
function openPresets(): void {
  const overlay = document.createElement("div");
  overlay.className = "gmodal";
  overlay.innerHTML = `
    <div class="gmodal-card" role="dialog" aria-modal="true">
      <p class="g-t-heading">${icon("user")} 選一個預設角色</p>
      <div class="studio-presets">${Object.entries(GameArt.presets)
        .map(([id, look]) => `<button type="button" class="studio-thumb" data-preset="${id}" aria-label="預設角色 ${id}">${thumbChar(look, "body")}</button>`)
        .join("")}</div>
      <div class="gmodal-actions"><button type="button" class="gbtn gbtn--quiet" data-v="close">${icon("close")}關閉</button></div>
    </div>`;
  overlay.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!b && e.target !== overlay) return;
    if (b?.dataset.preset) applyLook(clone(GameArt.presets[b.dataset.preset]));
    overlay.remove();
  });
  document.body.appendChild(overlay);
}

// ---- 角色槽（3 個；切槽自動存目前編輯；第 2、3 個可以刪除） ----
async function activateSlot(i: number): Promise<void> {
  endTryOn(false);
  data.activeSlot = i;
  slot = data.slots[i];
  entryLook = clone(slot.look);
  undoStack = [];
  redoStack = [];
  stage.setLook(slot.look);
  updateCKeyVisibility();
  await stage.setScene(slot.scene.id);
  currentWeather = slot.scene.id === "forest" ? (slot.scene.weather ?? "sunny") : "sunny";
  renderWeatherVisual();
  stage.setTime(timeModeOf(slot.scene));
  placeProps();
  renderName();
  renderHistoryButtons();
  renderTab();
}

async function switchSlot(i: number): Promise<void> {
  if (i === data.activeSlot || !data.slots[i]) return;
  saveNow();
  await activateSlot(i);
  dirty = true;
  saveNow();
}

async function createSlotAt(pos: number): Promise<void> {
  if (slotIndexAt(data, pos) >= 0 || data.slots.length >= MAX_SLOTS) return;
  saveNow();
  const ok = await confirmDialog({ iconId: "plus", text: "做一個新角色？", yes: "好", hue: "mint" });
  if (!ok) return;
  const base = `${DEFAULT_NAME}${pos + 1}`;
  const ns = newSlot(GameArt.randomLook(), [...base].slice(0, NAME_MAX).join(""));
  if (!validateName(ns.name).ok) ns.name = DEFAULT_NAME;
  ns.pos = pos;
  data.slots.push(ns);
  await activateSlot(data.slots.length - 1);
  dirty = true;
  saveNow();
}

async function deleteSlot(i: number): Promise<void> {
  const target = data.slots[i];
  if (!target || (target.pos ?? i) === 0) return; // 第 1 個角色不能刪
  const ok = await confirmDialog({
    iconId: "trash",
    text: `<span class="studio-del-preview">${GameArt.avatar(target.look, 72)}</span>刪掉「${escapeHtml(target.name)}」？`,
    yes: "刪除",
    no: "取消",
  });
  if (!ok) return;
  saveNow();
  const wasActive = i === data.activeSlot;
  const activeId = slot.id;
  data.slots.splice(i, 1);
  if (wasActive) {
    // 刪的是使用中角色：自動切到第 1 個
    const first = slotIndexAt(data, 0);
    await activateSlot(first >= 0 ? first : 0);
  } else {
    data.activeSlot = Math.max(0, data.slots.findIndex((s) => s.id === activeId));
    slot = data.slots[data.activeSlot];
    renderTab();
  }
  dirty = true;
  saveNow();
  toast(`${icon("check")} 刪好了`, 1600, "mint");
}

// ---- 試玩小場域（不計分）：禮物方塊、彈簧、花苞、寶箱、營火、金幣、地底巨手 ----
interface PlayProp extends StageProp {
  // rock＝圓石（碰到跌倒）、solid＝可踩踏（石頭方塊、草地方塊、木頭、樹墩）、giantHand＝地底冒出抓人的巨手、halloweenPortal＝萬聖巨大傳送門
  kind: "gift" | "spring" | "flower" | "chest" | "campfire" | "rock" | "solid" | "blackhole" | "giantHand" | "halloweenPortal";
  resetAt?: number;
  wander?: boolean;
  cooldownUntil?: number;
}
let playProps: PlayProp[] = [];
/** 試玩場域的障礙物與互動道具（之後新增只改這份資料）。
 * x＝離出生點的距離（舞台寬為單位），整個場域每 FIELD_PERIOD 個舞台寬重複一次；
 * 道具大小＝token 的 size（角色設計單位），lift＝底部離地高度（設計單位，疊方塊用）；y＝底部位置（占舞台高，空中的禮物方塊用）。 */
const FIELD_PERIOD = 6;
// 石頭方塊 64 高、碰撞盒上緣在 60：疊第二塊時 lift＝60－2（碰撞盒底部離道具底 2）＝58
const BLOCK_STACK = 58;
const BLOCK_W = 64;
interface ObstacleDef {
  id: string;
  kind: PlayProp["kind"];
  x: number;
  state?: string;
  lift?: number;
  y?: number;
  /** 尺寸縮放倍率（預設 1；例如咬人的巨型寶箱 scale: 3、大型墓碑 scale: 1.8） */
  scale?: number;
  /** 隨機左右移動（例如墓園大型墓碑，每次隨機移動約一個物件寬） */
  wander?: boolean;
  /** 宇宙空間：漂浮的小行星（會浮動、可以推）；phase＝浮動相位，讓每顆錯開 */
  floating?: boolean;
  phase?: number;
  front?: boolean;
  cooldownUntil?: number;
}
const raceData = loadRace(profileId ?? "");
const raceTrophy = raceData.rewards.trophy;
function fieldObstacles(): ObstacleDef[] {
  const isForest = stage.sceneId === "forest";
  // 方塊寬換算成舞台寬比例（緊貼排列用）
  const bw = (BLOCK_W * stage.unit) / stage.width;
  return [
    { id: "rock", kind: "rock", x: 0.42 },
    // 森林場景依需求移除禮物盒
    ...(!isForest ? [{ id: "giftBlock", kind: "gift" as const, x: 0.82, y: 0.88 - stage.charH - 0.12, state: "idle" }] : []),
    { id: "spring", kind: "spring", x: 1.2, state: "idle" },
    { id: "flower", kind: "flower", x: 1.5, state: "bud" },
    // 單顆方塊
    { id: "stoneBlock", kind: "solid", x: 1.8 },
    // 2 級階梯
    { id: "stoneBlock", kind: "solid", x: 2.2 },
    { id: "stoneBlock", kind: "solid", x: 2.2 + bw },
    { id: "stoneBlock", kind: "solid", x: 2.2 + bw, lift: BLOCK_STACK },
    { id: "rock", kind: "rock", x: 2.62 },
    { id: "log", kind: "solid", x: 2.95 },
    // 森林場景依需求移除寶箱
    ...(!isForest ? [{ id: "chest", kind: "chest" as const, x: 3.25, state: "closed" }] : []),
    { id: "stump", kind: "solid", x: 3.55 },
    // 小跳台：草地方塊（踏腳）＋兩塊疊高的石頭方塊、上面放一根木頭（總高約 144 單位：從草地方塊接力跳，或在地面蓄力跳）
    { id: "grassBlock", kind: "solid", x: 4.1 - (120 * stage.unit) / stage.width },
    { id: "stoneBlock", kind: "solid", x: 4.1 },
    { id: "stoneBlock", kind: "solid", x: 4.1, lift: BLOCK_STACK },
    { id: "log", kind: "solid", x: 4.1, lift: BLOCK_STACK * 2 },
    { id: "rock", kind: "rock", x: 4.55 },
    // 森林場景火堆預設未生火（state: "out"）
    { id: "campfire", kind: "campfire", x: 5.3, state: "out" },
    { id: "rock", kind: "rock", x: 5.62 },
    // 森林場景與墓園場景依需求移除獎盃
    ...(!isForest && stage.sceneId !== "graveyard" && raceTrophy ? [{ id: "trophy", kind: "solid" as const, x: 0.22 }] : []),
  ];
}

/** 墓園場景專屬道具配置（2026-10-24）：移除獎杯與石頭，配置南瓜墓碑、加大為 1.5 倍（3 倍大）咬人寶箱、老樹樁、石階梯、隨機移動的大型墓碑，以及在不特定的地底隨機埋伏的巨手陷阱 */
function graveyardObstacles(): ObstacleDef[] {
  const bw = (BLOCK_W * stage.unit) / stage.width;
  // 地底巨手：初始隨機分布在不特定的地底位置（條件觸發前看不出異樣）
  const hx1 = Number((0.85 + Math.random() * 0.25).toFixed(2));
  const hx2 = Number((2.15 + Math.random() * 0.35).toFixed(2));
  const hx3 = Number((3.45 + Math.random() * 0.25).toFixed(2));
  const hx4 = Number((5.55 + Math.random() * 0.3).toFixed(2));
  return [
    { id: "tombstone", kind: "solid" as const, x: 0.55, state: "glow" },
    { id: "giantHand", kind: "giantHand" as const, x: hx1, state: "hidden", front: true, scale: 1.4 },
    { id: "chest", kind: "chest" as const, x: 1.25, state: "closed", scale: 3 },
    { id: "stoneBlock", kind: "solid" as const, x: 1.85 },
    { id: "stoneBlock", kind: "solid" as const, x: 1.85 + bw },
    { id: "stoneBlock", kind: "solid" as const, x: 1.85 + bw, lift: BLOCK_STACK },
    { id: "giantHand", kind: "giantHand" as const, x: hx2, state: "hidden", front: true, scale: 1.4 },
    { id: "tombstone", kind: "solid" as const, x: 2.65, state: "idle" },
    { id: "stump", kind: "solid" as const, x: 3.15 },
    { id: "giantHand", kind: "giantHand" as const, x: hx3, state: "hidden", front: true, scale: 1.4 },
    { id: "stoneBlock", kind: "solid" as const, x: 3.85 },
    { id: "stoneBlock", kind: "solid" as const, x: 3.85, lift: BLOCK_STACK },
    { id: "tombstone", kind: "solid" as const, x: 4.45, state: "glow" },
    // 石頭換成大型墓碑（1.8 倍大，左右隨機移動約一個物件寬）
    { id: "tombstone", kind: "solid" as const, x: 5.15, state: "glow", scale: 1.8, wander: true },
    { id: "giantHand", kind: "giantHand" as const, x: hx4, state: "hidden", front: true, scale: 1.4 },
  ];
}

/** 宇宙空間（2026-10-20）：沒有地面，換成飄在空中的小行星（可以站）、兩個互通的黑洞、飄在空中的金幣。
 * y＝道具底部位置（占舞台高）。小行星上緣不高於 0.37（站上去頭頂還在畫面裡）；黑洞中心在 0.3 左右，
 * 貼著下方飄過去不會被吸（吸力範圍 pullRadiusH），往上飄才會被吸進去。出生點腳下有一顆大的。 */
function spaceObstacles(): ObstacleDef[] {
  const list: ObstacleDef[] = [
    { id: "asteroid", kind: "solid", x: 0, y: 0.97 },
    { id: "asteroidSmall", kind: "solid", x: 0.55, y: 0.72 },
    { id: "asteroid", kind: "solid", x: 0.95, y: 0.6 },
    { id: "blackHole", kind: "blackhole", x: 1.65, y: 0.44 },
    { id: "asteroid", kind: "solid", x: 2.15, y: 0.82 },
    { id: "asteroidSmall", kind: "solid", x: 2.55, y: 0.58 },
    { id: "asteroid", kind: "solid", x: 3.35, y: 0.66 },
    { id: "asteroidSmall", kind: "solid", x: 3.8, y: 0.9 },
    { id: "blackHole", kind: "blackhole", x: 4.25, y: 0.44 },
    { id: "asteroid", kind: "solid", x: 4.75, y: 0.55 },
    { id: "asteroidSmall", kind: "solid", x: 5.25, y: 0.76 },
  ];
  // 小行星全部是漂浮的：慢慢上下浮動、可以推著走、站在上面會跟著漂（StageController.updateFloaters）
  return list.map((o, i) => (o.kind === "solid" ? { ...o, floating: true, phase: i * 1.7 } : o));
}

let spaceHintShown = false;

// ---- 手動天氣系統（晴天、雨天、颱風天） ----
type WeatherType = "sunny" | "rainy" | "typhoon";
let currentWeather: WeatherType = "sunny";
let weatherLayer: HTMLDivElement | null = null;

function initWeatherLayer(): void {
  if (weatherLayer) weatherLayer.remove();
  weatherLayer = document.createElement("div");
  weatherLayer.className = `gstage-weather gstage-weather--${currentWeather}`;
  stage.world.appendChild(weatherLayer);
  renderWeatherVisual();
}

function renderWeatherVisual(): void {
  if (!weatherLayer) return;

  if (stage.sceneId !== "forest") {
    stage.el.classList.remove("gstage--rainy", "gstage--typhoon");
    weatherLayer.className = "gstage-weather";
    weatherLayer.innerHTML = "";
    return;
  }

  stage.el.classList.toggle("gstage--rainy", currentWeather === "rainy");
  stage.el.classList.toggle("gstage--typhoon", currentWeather === "typhoon");
  weatherLayer.className = `gstage-weather gstage-weather--${currentWeather}`;

  if (currentWeather === "sunny") {
    weatherLayer.innerHTML = "";
    return;
  }

  // 雨絲粒子（24-36 條）
  const count = currentWeather === "typhoon" ? 36 : 24;
  let rainHtml = '<div class="g-rain-layer">';
  for (let i = 0; i < count; i++) {
    const left = ((i * 100) / count + (i % 3) * 2.5).toFixed(1);
    const delay = (-(i * 0.07)).toFixed(2);
    rainHtml += `<div class="g-rain-streak" style="left:${left}%;animation-delay:${delay}s"></div>`;
  }
  rainHtml += "</div>";

  // 颱風陣風流線
  let windHtml = "";
  if (currentWeather === "typhoon") {
    windHtml = '<div class="g-wind-layer">';
    const gusts = [
      { top: 16, width: 220, delay: 0 },
      { top: 38, width: 340, delay: 0.45 },
      { top: 60, width: 260, delay: 0.8 },
      { top: 82, width: 300, delay: 0.25 },
    ];
    for (const g of gusts) {
      windHtml += `<div class="g-wind-gust" style="top:${g.top}%;width:${g.width}px;animation-delay:-${g.delay}s"></div>`;
    }
    windHtml += "</div>";
  }

  weatherLayer.innerHTML = rainHtml + windHtml;
}

function setWeather(w: WeatherType, showToast = true): void {
  if (stage.sceneId !== "forest") return;
  currentWeather = w;
  renderWeatherVisual();
  if (w === "typhoon") {
    campfireLitUntil = 0;
    const campfire = playProps.find((p) => p.kind === "campfire");
    if (campfire && campfire.state !== "out") stage.setPropState(campfire, "out");
    const flower = playProps.find((p) => p.kind === "flower");
    if (flower && flower.state !== "bud") stage.setPropState(flower, "bud");
    for (const b of forestBees) if (b.el) b.el.style.display = "none";
    for (const bat of forestBats) if (bat.el) bat.el.style.display = "none";
  }
  if (showToast) {
    if (w === "sunny") toast("☀️ 晴天：陽光普照，適合大自然探索！", 2400, "sun");
    else if (w === "rainy") toast("🌧️ 雨天：綿綿細雨，火堆燃燒時間會變短喔～", 2600, "sky");
    else if (w === "typhoon") toast("💨 颱風天：暴風雨狂吹！順風飛馳加速、逆風寸步難行！", 3000, "peach");
  }
}

// 火堆燃燒時間（依天氣狀況調整）
function campfireDuration(): number {
  if (currentWeather === "typhoon") return 3500; // 颱風暴雨 3.5 秒熄滅
  if (currentWeather === "rainy") return 6000;   // 雨天 6 秒熄滅
  return 10000;                                   // 晴天 10 秒熄滅
}

// ---- 森林生物：白天蜜蜂群、夜晚蝙蝠群 ----
function isHoldingPoopstick(): boolean {
  const look = stage.currentLook ?? (tryOn && tryOn.item.field !== "scene" ? tryOnLook(tryOn.item) : slot.look);
  return look.held === "poopstick" || (typeof look.held === "string" && look.held.includes("poop"));
}

interface BeeEntity {
  id: number;
  el: HTMLDivElement;
  x: number;
  yPx: number; // 離地高度 (px)
  dir: 1 | -1;
  state: "up" | "down";
  lastWingAt: number;
  patrolMin: number;
  patrolMax: number;
  baseY: number;
  speed: number;
  chasing: boolean;
  attracted: boolean;
  reboundUntil: number;
  fleeing?: boolean;
}

interface BatEntity {
  id: number;
  el: HTMLDivElement;
  x: number;
  yPx: number; // 離地高度 (px)
  dir: 1 | -1;
  state: "up" | "down";
  lastWingAt: number;
  patrolMin: number;
  patrolMax: number;
  baseY: number;
  speed: number;
  fleeing: boolean;
}

interface ZombieEntity {
  id: number;
  el: HTMLDivElement;
  x: number;
  yPx: number;
  dir: 1 | -1;
  state: "idle" | "hop" | "hug" | "dizzy" | "wave";
  speed: number;
  patrolMin: number;
  patrolMax: number;
  hopPhase: number;
  hugCooldownUntil: number;
  flungVx: number;
  flungVy: number;
  isFlung: boolean;
  fleeingUntil?: number;
}

let forestBees: BeeEntity[] = [];
let forestBats: BatEntity[] = [];
let graveyardZombies: ZombieEntity[] = [];
let campfireLitUntil = 0;
let scareCooldownUntil = 0;
let lastCreatureTick = performance.now();

function initSceneCreatures(): void {
  for (const b of forestBees) if (b.el) b.el.remove();
  for (const b of forestBats) if (b.el) b.el.remove();
  for (const z of graveyardZombies) if (z.el) z.el.remove();
  forestBees = [];
  forestBats = [];
  graveyardZombies = [];

  const layer = stage.flyerLayer;
  if (!layer) return;

  if (stage.sceneId === "forest") {
    // 3 隻蜜蜂：活動範圍擴大至 0.6 ~ 3.8
    const beeConfigs = [
      { x: 1.35, patrolMin: 0.6, patrolMax: 2.2, baseY: 72, speed: 0.10 },
      { x: 1.65, patrolMin: 1.1, patrolMax: 2.9, baseY: 86, speed: 0.085 },
      { x: 2.2,  patrolMin: 1.6, patrolMax: 3.8, baseY: 68, speed: 0.11 },
    ];
    forestBees = beeConfigs.map((cfg, i) => {
      const el = document.createElement("div");
      el.className = "gstage-prop gstage-creature gstage-creature--bee";
      el.style.width = "46px";
      el.style.height = "40px";
      el.style.display = "none";
      el.innerHTML = GameArt.prop("bee", { state: "up" });
      layer.appendChild(el);
      return {
        id: i,
        el,
        x: cfg.x,
        yPx: cfg.baseY,
        dir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
        state: "up" as const,
        lastWingAt: 0,
        patrolMin: cfg.patrolMin,
        patrolMax: cfg.patrolMax,
        baseY: cfg.baseY,
        speed: cfg.speed,
        chasing: false,
        attracted: false,
        reboundUntil: 0,
        fleeing: false,
      };
    });

    // 3 隻蝙蝠：夜晚於火堆周邊 3.8 ~ 6.5 交錯起伏盤旋
    const batConfigs = [
      { x: 4.8, patrolMin: 4.3, patrolMax: 5.7, baseY: 95, speed: 0.11 },
      { x: 5.3, patrolMin: 4.8, patrolMax: 6.2, baseY: 80, speed: 0.13 },
      { x: 5.8, patrolMin: 3.8, patrolMax: 5.5, baseY: 120, speed: 0.09 },
    ];
    forestBats = batConfigs.map((cfg, i) => {
      const el = document.createElement("div");
      el.className = "gstage-prop gstage-creature gstage-creature--bat";
      el.style.width = "48px";
      el.style.height = "36px";
      el.style.display = "none";
      el.innerHTML = GameArt.prop("bat", { state: "up" });
      layer.appendChild(el);
      return {
        id: i,
        el,
        x: cfg.x,
        yPx: cfg.baseY,
        dir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
        state: "up" as const,
        lastWingAt: 0,
        patrolMin: cfg.patrolMin,
        patrolMax: cfg.patrolMax,
        baseY: cfg.baseY,
        speed: cfg.speed,
        fleeing: false,
      };
    });
  } else if (stage.sceneId === "graveyard") {
    // 墓園生物：可愛小殭屍（巡邏跳步、碰到角色緊緊擁抱）
    const zombieConfigs = [
      { x: 0.85, patrolMin: 0.35, patrolMax: 2.05, speed: 0.045 },
      { x: 3.45, patrolMin: 2.65, patrolMax: 4.75, speed: 0.045 },
    ];
    graveyardZombies = zombieConfigs.map((cfg, i) => {
      const el = document.createElement("div");
      el.className = "gstage-prop gstage-creature gstage-creature--zombie";
      el.style.width = "56px";
      el.style.height = "72px";
      el.innerHTML = GameArt.prop("zombie", { state: "idle" });
      layer.appendChild(el);
      return {
        id: i,
        el,
        x: cfg.x,
        yPx: 0,
        dir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
        state: "idle" as const,
        speed: cfg.speed,
        patrolMin: cfg.patrolMin,
        patrolMax: cfg.patrolMax,
        hopPhase: i * Math.PI,
        hugCooldownUntil: 0,
        flungVx: 0,
        flungVy: 0,
        isFlung: false,
      };
    });
  }
}

function updateForestCreatures(now: number, dt: number): void {
  // 颱風天生物不出現；非森林場景不出現
  if (stage.sceneId !== "forest" || currentWeather === "typhoon") {
    for (const b of forestBees) if (b.el) b.el.style.display = "none";
    for (const b of forestBats) if (b.el) b.el.style.display = "none";
    return;
  }

  const isNight = stage.skyState.night > 0.5;
  const H = stage.height;
  const W = stage.width;
  const FEET_PX = 0.88 * H;
  const charSpan = stage.charSpan();
  const charVert = stage.charVertical;
  const charCx = stage.charX * W;
  const hasPoop = isHoldingPoopstick();

  // 1) 蜜蜂群（白天活躍）
  const flower = playProps.find((p) => p.kind === "flower");
  const isFlowerBloom = flower && flower.state === "bloom";

  for (const bee of forestBees) {
    if (isNight) {
      bee.el.style.display = "none";
      continue;
    }
    bee.el.style.display = "";

    const wingInterval = (bee.chasing || bee.fleeing) ? 65 : 110;
    if (now - bee.lastWingAt > wingInterval) {
      bee.lastWingAt = now;
      bee.state = bee.state === "up" ? "down" : "up";
      bee.el.innerHTML = GameArt.prop("bee", { state: bee.state });
    }

    const screenX = stage.propScreenX({ id: "bee", x: bee.x });
    const distToCharScreen = Math.abs(screenX - charCx);

    if (hasPoop) {
      // 角色手持大便樹枝：蜜蜂避之唯恐不及，飛離至畫面外
      bee.fleeing = true;
      bee.chasing = false;
      bee.attracted = false;
      const fleeDir = screenX < charCx ? -1 : 1;
      bee.dir = fleeDir;
      bee.x += bee.dir * (0.24 + bee.id * 0.05) * dt;
      bee.yPx += (390 + bee.id * 35) * dt;
    } else if (bee.fleeing) {
      // 沒拿大便樹枝：滑翔返回巡邏高度
      if (bee.yPx > bee.baseY + 15) {
        bee.yPx -= (115 + bee.id * 20) * dt;
      } else {
        bee.fleeing = false;
      }
    } else if (isFlowerBloom) {
      // 角色觸發開花：蜜蜂被花朵吸引停在花蕊上方採蜜，碰觸無效
      bee.attracted = true;
      bee.chasing = false;
      const targetX = flower.x + (bee.id - 1) * 0.04;
      const targetY = 42 + bee.id * 6;
      bee.x += (targetX - bee.x) * Math.min(1, dt * 2.5);
      bee.yPx += (targetY - bee.yPx) * Math.min(1, dt * 2.5);
    } else {
      bee.attracted = false;
      // 角色進入範圍時，會追擊角色
      const canChase = distToCharScreen < W * 0.42 && now > bee.reboundUntil;

      if (canChase) {
        bee.chasing = true;
        bee.dir = screenX < charCx ? 1 : -1;
        bee.x += bee.dir * (bee.speed * 1.65) * dt;
        const targetY = charVert.feet + 52 + Math.sin(now * 0.012 + bee.id) * 8;
        bee.yPx += (targetY - bee.yPx) * Math.min(1, dt * 3.8);
      } else {
        bee.chasing = false;
        // 巡邏活動範圍擴大
        bee.x += bee.dir * bee.speed * dt;
        if (bee.x > bee.patrolMax) {
          bee.x = bee.patrolMax;
          bee.dir = -1;
        } else if (bee.x < bee.patrolMin) {
          bee.x = bee.patrolMin;
          bee.dir = 1;
        }
        const targetY = bee.baseY + Math.sin(now * 0.006 + bee.id * 1.8) * 14;
        bee.yPx += (targetY - bee.yPx) * Math.min(1, dt * 3);
      }
    }

    const screenY = FEET_PX - bee.yPx - 40;
    bee.el.style.transform = `translate(${(screenX - 23).toFixed(1)}px, ${screenY.toFixed(1)}px) scaleX(${bee.dir < 0 ? -1 : 1})`;

    // 碰觸判定（花朵盛開、飛離中或手持大便樹枝時碰觸無效）
    if (!bee.fleeing && !hasPoop && !bee.attracted && now > scareCooldownUntil && now > bee.reboundUntil && !stage.isStunned) {
      const beeLeft = screenX - 16;
      const beeRight = screenX + 16;
      const beeBottom = bee.yPx;
      const beeTop = bee.yPx + 32;

      const xHit = beeRight >= charSpan[0] && beeLeft <= charSpan[1];
      const yHit = beeTop >= charVert.feet && beeBottom <= charVert.head;

      if (xHit && yHit) {
        scareCooldownUntil = now + 1500;
        bee.reboundUntil = now + 2000; // 蜜蜂蟄到後反彈退後並暫停追擊 2 秒
        bee.dir = (bee.dir * -1) as 1 | -1;
        bee.x += bee.dir * 0.15;
        stage.stun(1000, "surprise");
        blip("trip");
        floatText(`!`, 0.5, Math.max(0.05, 0.88 - stage.charH - stage.jumpHeight / stage.height - 0.04), "peach");
        if (!prefersReducedMotion()) {
          stage.el.animate(
            [
              { transform: "translate(0,0)" },
              { transform: "translate(-3px,1px)" },
              { transform: "translate(3px,-1px)" },
              { transform: "translate(-1px,0)" },
              { transform: "translate(0,0)" },
            ],
            { duration: 150, easing: "linear" }
          );
        }
      }
    }
  }

  // 2) 蝙蝠群（夜晚活躍）
  const campfire = playProps.find((p) => p.kind === "campfire");
  const isFireLit = campfire && campfire.state === "lit";

  for (const bat of forestBats) {
    if (!isNight) {
      bat.el.style.display = "none";
      continue;
    }
    bat.el.style.display = "";

    const flapInterval = bat.fleeing ? 75 : 125;
    if (now - bat.lastWingAt > flapInterval) {
      bat.lastWingAt = now;
      bat.state = bat.state === "up" ? "down" : "up";
      bat.el.innerHTML = GameArt.prop("bat", { state: bat.state });
    }

    const screenX = stage.propScreenX({ id: "bat", x: bat.x });
    const batFlee = isFireLit || hasPoop;
    if (batFlee) {
      // 角色觸發火堆生火或手持大便樹枝：蝙蝠群迅速飛離畫面外
      bat.fleeing = true;
      const fleeDir = hasPoop ? (screenX < charCx ? -1 : 1) : bat.dir;
      bat.dir = fleeDir;
      bat.yPx += (390 + bat.id * 35) * dt;
      bat.x += bat.dir * (0.22 + bat.id * 0.06) * dt;
    } else {
      // 火堆未生火且沒拿大便樹枝：滑翔返回巡邏
      if (bat.fleeing) {
        if (bat.yPx > bat.baseY + 15) {
          bat.yPx -= (115 + bat.id * 20) * dt;
        } else {
          bat.fleeing = false;
        }
      } else {
        bat.x += bat.dir * bat.speed * dt;
        if (bat.x > bat.patrolMax) {
          bat.x = bat.patrolMax;
          bat.dir = -1;
        } else if (bat.x < bat.patrolMin) {
          bat.x = bat.patrolMin;
          bat.dir = 1;
        }
        const targetY = bat.baseY + Math.sin(now * 0.005 + bat.id * 2.1) * 20;
        bat.yPx += (targetY - bat.yPx) * Math.min(1, dt * 2.5);
      }
    }

    const screenY = FEET_PX - bat.yPx - 36;
    bat.el.style.transform = `translate(${(screenX - 24).toFixed(1)}px, ${screenY.toFixed(1)}px) scaleX(${bat.dir < 0 ? -1 : 1})`;

    // 碰觸判定（生火逃離或手持大便樹枝時碰觸無效）
    if (!bat.fleeing && !hasPoop && now > scareCooldownUntil && !stage.isStunned) {
      const batLeft = screenX - 18;
      const batRight = screenX + 18;
      const batBottom = bat.yPx;
      const batTop = bat.yPx + 30;

      const xHit = batRight >= charSpan[0] && batLeft <= charSpan[1];
      const yHit = batTop >= charVert.feet && batBottom <= charVert.head;

      if (xHit && yHit) {
        scareCooldownUntil = now + 1500;
        stage.stun(1000, "surprise");
        blip("trip");
        floatText(`!`, 0.5, Math.max(0.05, 0.88 - stage.charH - stage.jumpHeight / stage.height - 0.04), "peach");
        if (!prefersReducedMotion()) {
          stage.el.animate(
            [
              { transform: "translate(0,0)" },
              { transform: "translate(-3px,1px)" },
              { transform: "translate(3px,-1px)" },
              { transform: "translate(-1px,0)" },
              { transform: "translate(0,0)" },
            ],
            { duration: 150, easing: "linear" }
          );
        }
      }
    }
  }
}

function updateSceneCreatures(now: number, dt: number): void {
  if (stage.sceneId === "forest") {
    if (currentWeather === "typhoon") {
      for (const b of forestBees) if (b.el) b.el.style.display = "none";
      for (const b of forestBats) if (b.el) b.el.style.display = "none";
      return;
    }
    updateForestCreatures(now, dt);
    return;
  }

  if (stage.sceneId === "graveyard") {
    const H = stage.height;
    const W = stage.width;
    const FEET_PX = 0.88 * H;
    const charCx = stage.charX * W;

    for (const z of graveyardZombies) {
      if (z.isFlung) {
        // 被彈開狀態：拋物線向外拋飛
        z.x += (z.flungVx / W) * dt;
        z.yPx -= z.flungVy * dt;
        z.flungVy += 850 * dt;
        if (z.yPx <= 0) {
          z.yPx = 0;
          z.isFlung = false;
          z.flungVx = 0;
          z.flungVy = 0;
          z.state = "dizzy";
          z.el.innerHTML = GameArt.prop("zombie", { state: "dizzy" });
        }
      } else if (huggedZombie === z) {
        // 緊緊抱著角色：吸附在角色身前隨角色移動
        z.x = (stage.charX * W + stage.offset) / W;
        z.yPx = stage.jumpHeight;
        z.dir = stage.dir;
        if (z.state !== "hug") {
          z.state = "hug";
          z.el.innerHTML = GameArt.prop("zombie", { state: "hug" });
        }
      } else if (z.fleeingUntil && now < z.fleeingUntil) {
        // 逃離使用者：背對使用者快速蹦跳逃跑 3 秒
        z.hopPhase += dt * 8.5;
        const hopSin = Math.sin(z.hopPhase);
        z.yPx = Math.max(0, hopSin * 14);
        if (z.state !== "wave") {
          z.state = "wave";
          z.el.innerHTML = GameArt.prop("zombie", { state: "wave" });
        }
        const fleeSpeed = z.speed * 2.8;
        z.x += z.dir * fleeSpeed * dt;
        if (z.x < 0.1) z.x = 0.1;
        else if (z.x > 5.8) z.x = 5.8;
        const screenX = stage.propScreenX({ id: "zombie", x: z.x });
        if (Math.abs(screenX - charCx) > 10) {
          z.dir = screenX >= charCx ? 1 : -1;
        }
      } else {
        // 巡邏緩慢移動（跳步 hop）
        if (now < z.hugCooldownUntil) {
          z.yPx = 0;
          if (z.state !== "dizzy") {
            z.state = "dizzy";
            z.el.innerHTML = GameArt.prop("zombie", { state: "dizzy" });
          }
        } else {
          z.hopPhase += dt * 3.8;
          const hopSin = Math.sin(z.hopPhase);
          if (hopSin > 0) {
            z.yPx = hopSin * 10;
            if (z.state !== "hop") {
              z.state = "hop";
              z.el.innerHTML = GameArt.prop("zombie", { state: "hop" });
            }
            z.x += z.dir * z.speed * dt;
          } else {
            z.yPx = 0;
            if (z.state !== "idle") {
              z.state = "idle";
              z.el.innerHTML = GameArt.prop("zombie", { state: "idle" });
            }
          }

          if (z.x > z.patrolMax) {
            z.dir = -1;
          } else if (z.x < z.patrolMin) {
            z.dir = 1;
          }

          // 碰觸角色判定：未被咬住、未被抱住且非逃跑狀態
          const screenX = stage.propScreenX({ id: "zombie", x: z.x });
          const distToCharPx = Math.abs(screenX - charCx);
          if (isZombieTransformed()) {
            // 變身殭屍：同類好朋友，殭屍不抱人！靠近時觸發聊天對話彩蛋
            if (distToCharPx < 45) {
              tryMonsterTalk(z.el, distToCharPx / W);
            }
          } else if (distToCharPx < 28 && stage.jumpHeight < 30 && !trappedChest && !huggedZombie && (!z.fleeingUntil || now >= z.fleeingUntil)) {
            huggedZombie = z;
            struggleTarget = "zombie";
            struggleProgressMs = 0;
            lastStruggleKey = null;
            lastStruggleTapAt = now;
            z.state = "hug";
            z.el.innerHTML = GameArt.prop("zombie", { state: "hug" });
            blip("pop");
            showStruggleHud("連按 ← → 彈開殭屍！");
          }
        }
      }

      const screenX = huggedZombie === z ? charCx + (stage.dir === 1 ? 6 : -6) : stage.propScreenX({ id: "zombie", x: z.x });
      const screenY = FEET_PX - z.yPx - 72;
      z.el.style.transform = `translate(${(screenX - 28).toFixed(1)}px, ${screenY.toFixed(1)}px) scaleX(${z.dir < 0 ? -1 : 1})`;
    }
  }
}

// ---- 墓園場景停留超過 180 秒：蝙蝠群佔據畫面 6 秒 ----
let graveyardStayStartAt = performance.now();
let lastBatSwarmAt = 0;
let activeBatSwarmEl: HTMLDivElement | null = null;
let activeBatSwarmTimer = 0;

function cleanupBatSwarm(): void {
  if (activeBatSwarmTimer) {
    clearTimeout(activeBatSwarmTimer);
    activeBatSwarmTimer = 0;
  }
  if (activeBatSwarmEl) {
    activeBatSwarmEl.remove();
    activeBatSwarmEl = null;
  }
}

function triggerGraveyardBatSwarm(): void {
  cleanupBatSwarm();
  const overlay = document.createElement("div");
  overlay.className = "studio-bat-swarm-overlay";
  overlay.setAttribute("aria-hidden", "true");

  const batUpSvg = GameArt.prop("bat", { state: "up" });
  const batDownSvg = GameArt.prop("bat", { state: "down" });

  const paths = [
    "bat-fly--swoop-lr",
    "bat-fly--swoop-rl",
    "bat-fly--circle-center",
    "bat-fly--foreground-surge",
  ];

  // 減敏動態模式下減少數量；持續 10 秒多波次穿梭
  const count = prefersReducedMotion() ? 16 : 48;
  const waveSize = Math.ceil(count / 3);

  for (let i = 0; i < count; i++) {
    const bat = document.createElement("div");
    const pathClass = paths[i % paths.length];
    bat.className = `studio-swarm-bat ${pathClass}`;

    // 垂直高度均勻分布在全畫面（從 4% 到 90% 各高度區間平均涵蓋）
    const inWave = i % waveSize;
    const baseY = 5 + (inWave / Math.max(1, waveSize - 1)) * 82;
    const startY = Math.max(4, Math.min(92, baseY + ((i * 11) % 7 - 3))).toFixed(1) + "%";

    // 佔據畫面 10 秒：分 3 個接續波次（0s、2.1s、4.2s），時長 4.8s ~ 5.7s
    const wave = Math.floor(i / waveSize);
    const waveBaseDelay = wave * 2.1;
    const delay = (waveBaseDelay + (inWave % 8) * 0.24 + (i % 3) * 0.1).toFixed(2) + "s";
    const dur = (4.8 + (i % 5) * 0.22).toFixed(2) + "s";
    const scale = (0.65 + (i % 7) * 0.18 + (i % 4 === 3 ? 0.35 : 0)).toFixed(2);

    bat.style.setProperty("--bat-scale", scale);
    bat.style.setProperty("--start-y", startY);
    bat.style.setProperty("--fly-delay", delay);
    bat.style.setProperty("--fly-dur", dur);

    bat.innerHTML = `
      <div class="bat-wing bat-wing--up">${batUpSvg}</div>
      <div class="bat-wing bat-wing--down">${batDownSvg}</div>
    `;

    overlay.appendChild(bat);
  }

  stage.hud.appendChild(overlay);
  activeBatSwarmEl = overlay;

  blip("trip");
  floatText(`🦇 蝙蝠群掠過！`, 0.5, 0.18, "lilac");

  activeBatSwarmTimer = window.setTimeout(() => {
    cleanupBatSwarm();
  }, 10000);
}

// ---- 萬聖限定：巨大南瓜怪大作戰傳送門 ----
type HalloweenPortalPhase = "none" | "moonGlow" | "emerged";
let halloweenPortalPhase: HalloweenPortalPhase = "none";
let moonGlowStartAt = 0;
let halloweenPortalProp: PlayProp | null = null;
let halloweenPortalModalEl: HTMLElement | null = null;
let halloweenPortalCooldownUntil = 0;
let halloweenNoticeEl: HTMLElement | null = null;
let halloweenNoticeTimer = 0;
let portalNavArrowEl: HTMLDivElement | null = null;

function showHalloweenNotice(text: string, durationMs = 6000): void {
  cleanupHalloweenNotice();
  const el = document.createElement("div");
  el.className = "halloween-costume-notice";
  el.textContent = text;
  stage.hud.appendChild(el);
  halloweenNoticeEl = el;

  halloweenNoticeTimer = window.setTimeout(() => {
    cleanupHalloweenNotice();
  }, durationMs);
}

function cleanupHalloweenNotice(): void {
  if (halloweenNoticeTimer) {
    clearTimeout(halloweenNoticeTimer);
    halloweenNoticeTimer = 0;
  }
  if (halloweenNoticeEl) {
    halloweenNoticeEl.remove();
    halloweenNoticeEl = null;
  }
}

function updatePortalNavArrow(): void {
  // 只有在傳送門已觸發（moonGlow 或 emerged）、且裝備齊全未貼符咒、彈窗未開啟時顯示指引
  if (
    halloweenPortalPhase === "none" ||
    halloweenPortalModalEl ||
    isZombieTransformed() ||
    !hasHalloweenPortalCostume()
  ) {
    hidePortalNavArrow();
    return;
  }

  const W = stage.width;
  const targetX = halloweenPortalProp
    ? stage.propScreenX(halloweenPortalProp)
    : stage.propScreenX({ x: 2.2 } as StageProp);
  const charScreenX = stage.width * stage.charX;
  const dist = Math.abs(targetX - charScreenX) / W;

  // 若角色已經走到傳送門旁（接觸中），隱藏指引箭頭
  if (dist < 0.08) {
    hidePortalNavArrow();
    return;
  }

  if (!portalNavArrowEl) {
    portalNavArrowEl = document.createElement("div");
    portalNavArrowEl.className = "portal-nav-arrow";
    stage.hud.appendChild(portalNavArrowEl);
  }

  // 判斷傳送門在畫面左側、右側，或已在畫面中
  if (targetX > W - 80) {
    // 傳送門在右側
    portalNavArrowEl.className = "portal-nav-arrow portal-nav-arrow--right";
    portalNavArrowEl.innerHTML = `<span class="portal-nav-text">傳送門</span><span class="portal-nav-icon">➔</span>`;
    portalNavArrowEl.style.left = "";
    portalNavArrowEl.style.right = "18px";
    portalNavArrowEl.style.top = "46%";
  } else if (targetX < 80) {
    // 傳送門在左側
    portalNavArrowEl.className = "portal-nav-arrow portal-nav-arrow--left";
    portalNavArrowEl.innerHTML = `<span class="portal-nav-icon">⬅</span><span class="portal-nav-text">傳送門</span>`;
    portalNavArrowEl.style.right = "";
    portalNavArrowEl.style.left = "18px";
    portalNavArrowEl.style.top = "46%";
  } else {
    // 傳送門在畫面可視區：懸浮在傳送門上方直指傳送門
    portalNavArrowEl.className = "portal-nav-arrow portal-nav-arrow--down";
    portalNavArrowEl.innerHTML = `<span class="portal-nav-text">萬聖傳送門</span><span class="portal-nav-icon">▼</span>`;
    portalNavArrowEl.style.right = "";
    portalNavArrowEl.style.left = `${Math.round(targetX)}px`;
    portalNavArrowEl.style.top = "18%";
  }
}

function hidePortalNavArrow(): void {
  if (portalNavArrowEl) {
    portalNavArrowEl.remove();
    portalNavArrowEl = null;
  }
}

/** 活動期限判定：活動只到 10/31 為止，11/1 則不再觸發此關卡（實驗室模式下永遠開放測試） */
function isHalloweenActive(): boolean {
  if (LAB_MODE || (typeof window !== "undefined" && window.location?.port === "5190")) {
    return true;
  }
  const now = new Date();
  const month = now.getMonth() + 1;
  // 11/1 起關閉（11 月及 12 月）
  if (month >= 11) return false;
  return true;
}

/** 裝備條件判定：巫師帽＋魔拐杖 或 南瓜萌頭＋南瓜糖果桶 二擇一 */
function hasHalloweenPortalCostume(): boolean {
  const l = (stage.currentLook as Look) ?? slot.look;
  const accs = l.accessories || [];
  const isSetA = accs.includes("witchhat") && l.held === "magiccane";
  const isSetB = accs.includes("pumpkinhood") && l.held === "pumpkinbucket";
  return isSetA || isSetB;
}

/** 夜光墓園夜晚判定 */
function isGraveyardNight(): boolean {
  if (stage.sceneId !== "graveyard") return false;
  return stage.el.classList.contains("gstage--night") || slot.scene?.time === "night";
}

function cleanupHalloweenPortal(): void {
  cleanupHalloweenNotice();
  hidePortalNavArrow();
  if (halloweenPortalModalEl) {
    halloweenPortalModalEl.remove();
    halloweenPortalModalEl = null;
  }
  const moonEl = stage.moonEl;
  if (moonEl) {
    moonEl.classList.remove("moon-mystic-glow");
  }
  if (halloweenPortalProp) {
    playProps = playProps.filter((p) => p !== halloweenPortalProp);
    stage.setProps(playProps);
    halloweenPortalProp = null;
  }
  halloweenPortalPhase = "none";
  moonGlowStartAt = 0;
}

function updateHalloweenPortal(now: number): void {
  // 非墓園或活動已過期：清理重置
  if (stage.sceneId !== "graveyard" || !isHalloweenActive()) {
    if (halloweenPortalPhase !== "none") cleanupHalloweenPortal();
    return;
  }

  const condMet = isGraveyardNight() && hasHalloweenPortalCostume() && !isZombieTransformed();

  if (halloweenPortalPhase === "none") {
    if (condMet) {
      halloweenPortalPhase = "moonGlow";
      moonGlowStartAt = now;
      const moonEl = stage.moonEl;
      if (moonEl) moonEl.classList.add("moon-mystic-glow");
      blip("coin");
      showHalloweenNotice("骷髏月亮感應到萬聖裝扮，開始閃爍發光！", 6000);
    }
  } else if (halloweenPortalPhase === "moonGlow") {
    // 閃爍發光 10 秒期間若條件中斷（更換裝備或切換時間），取消儀式
    if (!condMet) {
      cleanupHalloweenNotice();
      hidePortalNavArrow();
      const moonEl = stage.moonEl;
      if (moonEl) moonEl.classList.remove("moon-mystic-glow");
      halloweenPortalPhase = "none";
      moonGlowStartAt = 0;
      return;
    }

    // 持續確保月亮發光
    const moonEl = stage.moonEl;
    if (moonEl && !moonEl.classList.contains("moon-mystic-glow")) {
      moonEl.classList.add("moon-mystic-glow");
    }

    // 閃爍滿 10 秒（10000ms）後，地底冒出巨大的傳送門
    if (now - moonGlowStartAt >= 10000) {
      cleanupHalloweenNotice();
      halloweenPortalPhase = "emerged";
      stage.bounce(0.5);
      blip("pop");
      blip("jump");

      // 產生傳送門道具（放置在 x = 2.2）
      const portal: PlayProp = {
        id: "halloweenPortal",
        kind: "halloweenPortal",
        x: 2.2,
        state: "erupt",
        scale: 1.35,
        front: true,
      };
      halloweenPortalProp = portal;
      playProps.push(portal);
      stage.setProps(playProps);

      if (portal.el) {
        portal.el.classList.add("studio-portal-burst");
      }
      floatText("⚡ 轟隆隆！地底冒出一座神祕萬聖傳送門！", 0.5, 0.38, "mint");

      setTimeout(() => {
        if (halloweenPortalProp) {
          stage.setPropState(halloweenPortalProp, "active");
          if (halloweenPortalProp.el) {
            halloweenPortalProp.el.classList.remove("studio-portal-burst");
            halloweenPortalProp.el.classList.add("studio-portal-active");
          }
        }
      }, 700);
    }
  } else if (halloweenPortalPhase === "emerged") {
    if (!halloweenPortalProp) return;
    // 檢測玩家是否碰觸傳送門
    if (!halloweenPortalModalEl && now > halloweenPortalCooldownUntil) {
      const dist = stage.distanceTo(halloweenPortalProp);
      if (dist < 0.08) {
        showHalloweenPortalModal();
      }
    }
  }

  // 實時更新指向傳送門的閃爍箭頭
  updatePortalNavArrow();
}

function retreatPlayerFromPortal(): void {
  if (halloweenPortalProp) {
    const portalScreenX = stage.propScreenX(halloweenPortalProp);
    const charScreenX = stage.width * stage.charX;
    // 若角色在傳送門左側則向左後退，若在右側則向右後退
    const retreatDir = charScreenX <= portalScreenX ? -1 : 1;
    const ch = stage.height * stage.charH;
    const charWidthPx = (ch * 120) / 170;
    const retreatDistPx = charWidthPx * 2.2; // 後退約兩步
    stage.offset += retreatDir * retreatDistPx;
    stage.positionProps();
    stage.perform("trip");
    setTimeout(() => stage.perform(null), 450);
  }
}

function showHalloweenPortalModal(): void {
  if (halloweenPortalModalEl) return;
  hidePortalNavArrow();

  // 1. 就算裝備具全，貼上變身符咒後，也不能進入傳送門
  if (isZombieTransformed()) {
    blip("trip");
    floatText("🧟 貼著變身符咒，無法進入傳送門！", 0.5, 0.42, "rose");
    halloweenPortalCooldownUntil = performance.now() + 1800;
    retreatPlayerFromPortal();

    const modal = document.createElement("div");
    modal.className = "halloween-portal-overlay";
    modal.innerHTML = `
      <div class="halloween-portal-card">
        <div class="halloween-portal-badge">${GameArt.prop("zombieTalisman")}</div>
        <h2 class="halloween-portal-title">無法進入傳送門</h2>
        <p class="halloween-portal-desc">
          你現在貼著【變身符咒】化身為小殭屍，傳送門的辟邪聖光排斥著殭屍同伴！<br>
          請先前往造型選單取下符咒，恢復冒險者身分再來挑戰！
        </p>
        <div class="halloween-portal-actions">
          <button type="button" class="gbtn gbtn-sun gbtn-md" id="btn-portal-blocked">我知道了</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    halloweenPortalModalEl = modal;

    modal.querySelector("#btn-portal-blocked")?.addEventListener("click", () => {
      modal.remove();
      halloweenPortalModalEl = null;
    });
    return;
  }

  // 2. 裝備不具全，也不能進入傳送門
  if (!hasHalloweenPortalCostume()) {
    blip("trip");
    floatText("🧙 裝備不齊全，無法進入傳送門！", 0.5, 0.42, "stone");
    halloweenPortalCooldownUntil = performance.now() + 1800;
    retreatPlayerFromPortal();

    const modal = document.createElement("div");
    modal.className = "halloween-portal-overlay";
    modal.innerHTML = `
      <div class="halloween-portal-card">
        <div class="halloween-portal-badge">${GameArt.prop("halloweenPortal", { state: "active" })}</div>
        <h2 class="halloween-portal-title">裝備不齊全</h2>
        <p class="halloween-portal-desc">
          身上的萬聖裝扮不齊全，無法與傳送門產生聖光共鳴！<br>
          請穿戴完整裝扮：<br>
          <strong>【巫師帽＋魔拐杖】</strong> 或 <strong>【南瓜萌頭＋南瓜糖果桶】</strong> 再來挑戰！
        </p>
        <div class="halloween-portal-actions">
          <button type="button" class="gbtn gbtn-sun gbtn-md" id="btn-portal-blocked">我知道了</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    halloweenPortalModalEl = modal;

    modal.querySelector("#btn-portal-blocked")?.addEventListener("click", () => {
      modal.remove();
      halloweenPortalModalEl = null;
    });
    return;
  }

  // 3. 裝備具全且未貼符咒：詢問是否接受挑戰
  blip("pop");
  const modal = document.createElement("div");
  modal.className = "halloween-portal-overlay";
  modal.innerHTML = `
    <div class="halloween-portal-card">
      <div class="halloween-portal-badge">${GameArt.prop("halloweenPortal", { state: "active" })}</div>
      <h2 class="halloween-portal-title">萬聖限定：巨大南瓜怪大作戰！</h2>
      <p class="halloween-portal-desc">
        夜光墓園地底冒出了一顆比畫面還大的調皮南瓜怪，正在四處跳躍砸地大鬧墓園！<br>
        勇敢的冒險者，要接受挑戰前往討伐南瓜怪、解救墓園同伴嗎？<br>
        <span class="portal-cost-tag">每次挑戰花費 20 遊戲幣</span>
      </p>
      <div class="halloween-portal-actions">
        <button type="button" class="gbtn gbtn-stone gbtn-md" id="btn-portal-decline">暫時不要</button>
        <button type="button" class="gbtn gbtn-mint gbtn-md" id="btn-portal-accept">接受挑戰 (20 幣)</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  halloweenPortalModalEl = modal;

  // 暫時不要：讓玩家後退兩步，關閉 pop，待玩家再次碰觸傳送門時，再次詢問
  modal.querySelector("#btn-portal-decline")?.addEventListener("click", () => {
    modal.remove();
    halloweenPortalModalEl = null;
    halloweenPortalCooldownUntil = performance.now() + 1800;
    retreatPlayerFromPortal();
  });

  // 接受挑戰：檢查代幣與裝備並傳送
  modal.querySelector("#btn-portal-accept")?.addEventListener("click", () => {
    if (isZombieTransformed()) {
      toast("身上貼著變身符咒，無法進入傳送門！", 2500, "rose");
      modal.remove();
      halloweenPortalModalEl = null;
      retreatPlayerFromPortal();
      return;
    }
    if (!hasHalloweenPortalCostume()) {
      toast("裝備不齊全，無法進入傳送門！", 2500, "stone");
      modal.remove();
      halloweenPortalModalEl = null;
      retreatPlayerFromPortal();
      return;
    }
    const isLab = LAB_MODE || (typeof window !== "undefined" && window.location?.port === "5190");
    const bal = profileId ? getTokenBalance(profileId) : 0;
    if (!isLab && bal < 20) {
      toast(`再賺 ${20 - bal} 個代幣就可以挑戰囉！去學習吧！`, 2500, "sun");
      return;
    }
    modal.remove();
    halloweenPortalModalEl = null;
    blip("coin");
    void flushPending().finally(() => {
      window.location.assign(`pumpkin-boss.html?from=studio`);
    });
  });
}

function placeProps(): void {
  stage.propPeriod = FIELD_PERIOD;
  // 切換或重設場景時清理蝙蝠群與傳送門並重設計時
  cleanupBatSwarm();
  cleanupHalloweenPortal();
  graveyardStayStartAt = performance.now();
  lastBatSwarmAt = 0;
  // 清除掙脫狀態
  if (struggleTarget) {
    struggleTarget = null;
    trappedChest = null;
    trappedHand = null;
    huggedZombie = null;
    struggleProgressMs = 0;
    removeStruggleHud();
    stage.allowJump = true;
    stage.allowCrouch = true;
  }
  // 海底世界：不擺營火和花（水裡），其他障礙物照舊
  const list: PlayProp[] = (
    stage.inSpace
      ? spaceObstacles()
      : stage.sceneId === "graveyard"
      ? graveyardObstacles()
      : fieldObstacles()
  )
    .filter((o) => !(stage.inWater && (o.kind === "campfire" || o.kind === "flower")))
    .map((o) => ({ ...o }));
  // 兩個黑洞互通
  const holes = list.filter((p) => p.kind === "blackhole");
  if (holes.length === 2) {
    holes[0].link = holes[1];
    holes[1].link = holes[0];
  }
  if (stage.inSpace && !spaceHintShown) {
    spaceHintShown = true;
    toast(`${icon("star")} 方向鍵在太空中滑行，A 衝刺！小心黑洞～`, 3200, "lilac");
  }
  playProps = list;
  stage.setProps(list);
  initWanderingProps();
  for (const p of list) {
    if (p.kind === "campfire" && p.el) {
      p.el.classList.add("gstage-prop--click");
      p.el.setAttribute("role", "button");
      p.el.setAttribute("aria-label", "營火：點一下點亮或熄滅");
      p.el.addEventListener("click", () => {
        if (stage.sceneId === "forest" && currentWeather === "typhoon") {
          toast("💨 風雨太大了，無法生火！", 2000, "stone");
          return;
        }
        if (p.state === "lit") {
          stage.setPropState(p, "out");
          campfireLitUntil = 0;
          blip("pop");
        } else {
          stage.setPropState(p, "lit");
          campfireLitUntil = performance.now() + campfireDuration();
          blip("pop");
          floatText(`${icon("sparkle")}`, 0.5, 0.45, "peach");
        }
      });
    }
    if (p.kind === "flower" && p.el) {
      p.el.classList.add("gstage-prop--click");
      p.el.setAttribute("role", "button");
      p.el.setAttribute("aria-label", "花朵");
      p.el.addEventListener("click", () => {
        if (stage.sceneId === "forest" && currentWeather === "typhoon") {
          toast("💨 風雨太強了，花朵緊閉無法盛開！", 2000, "stone");
          return;
        }
      });
    }
  }
  initSceneCreatures();
}

function floatText(html: string, xFrac: number, yFrac: number, hue = "sun"): void {
  if (prefersReducedMotion()) return;
  const sp = document.createElement("span");
  sp.className = `g-float g-h-${hue} studio-float`;
  sp.innerHTML = html;
  sp.style.left = `${xFrac * 100}%`;
  sp.style.top = `${yFrac * 100}%`;
  stage.hud.appendChild(sp);
  setTimeout(() => sp.remove(), 900);
}

stage.onJump = () => {
  blip("jump");
  if (!data.stats.jumpHintDone) {
    data.stats.jumpHintDone = true;
    renderHint();
    markDirty();
  }
  tourAdvance("jump");
};
stage.onLand = () => blip("land");
// ---- 蹲下蓄力 → 2 倍高度跳；彈簧 1.8 倍（高度 h＝v²/2g，初速乘 √倍率，見 StageController.launch） ----
const SPRING_MULT = 1.8;
const CHARGE_MULT = 2;
/** 按住 ↓ 0.35 秒：開始發光（柔和）；1 秒：可以蓄力跳（更亮、脈動更快） */
const CHARGE_GLOW_MS = 350;
const CHARGE_MS = 1000;
const CHARGE_GRACE_MS = 300;
let crouchSince = 0;
let charged = false;
let glowing = false;
let chargeExpireAt = 0;
let lastJumpHeight = 0;
/** 蓄力光暈：GameArt.setCharge（角色 SVG 內建，StageController 在角色重畫後自動重新套用） */
function setGlow(on: boolean): void {
  glowing = on;
  stage.setCharge(on, on && charged);
}
function setCharged(on: boolean): void {
  if (charged === on) {
    if (!on && glowing) setGlow(false);
    return;
  }
  charged = on;
  if (on) {
    setGlow(true);
    blip("coin");
    try {
      navigator.vibrate?.(30);
    } catch {
      // 不支援就算了
    }
  } else setGlow(false);
}
function consumeCharge(): boolean {
  const was = charged;
  setCharged(false);
  crouchSince = 0;
  chargeExpireAt = 0;
  return was;
}
stage.jumpMultiplier = () => {
  if (trappedChest) return 0;
  if (huggedZombie) return 0.25;
  if (!consumeCharge()) return 1;
  if (!data.stats.chargeHintDone) {
    data.stats.chargeHintDone = true;
    renderHint();
    markDirty();
  }
  return CHARGE_MULT;
};
function updateCharge(now: number): void {
  const onGround = !stage.isAirborne && !stage.isTripping;
  if (pad.down.down && onGround) {
    if (!crouchSince) crouchSince = now;
    chargeExpireAt = 0;
    const held = now - crouchSince;
    if (!charged && held >= CHARGE_MS) setCharged(true);
    else if (!glowing && held >= CHARGE_GLOW_MS) setGlow(true);
  } else {
    crouchSince = 0;
    if (charged || glowing) {
      // 放開 ↓ 後 300ms 內按 A 仍有效，超過就取消（不懲罰）；離地、絆倒立即取消
      if (!chargeExpireAt) chargeExpireAt = now + CHARGE_GRACE_MS;
      if (now > chargeExpireAt || !onGround) {
        chargeExpireAt = 0;
        setCharged(false);
      }
    }
  }
}

function renderHint(): void {
  if (!data.stats.jumpHintDone) hintBox.innerHTML = `<div class="g-bubble g-h-sun">按 A 跳起來！</div>`;
  else if (!data.stats.chargeHintDone) hintBox.innerHTML = `<div class="g-bubble g-h-mint">按住 ↓ 一下下，再按 A，跳更高！</div>`;
  else hintBox.innerHTML = "";
}

// 禮物方塊是 solid：從下方頂到時，StageController 讓角色彈回並通知這裡切「被撞擊」
stage.onHeadBump = (sp) => {
  const p = sp as PlayProp;
  if (p.kind !== "gift" || p.state !== "idle") return;
  stage.setPropState(p, "hit");
  p.resetAt = performance.now() + 8000;
  blip("pop");
  const r = stage.propRect(p);
  const topFrac = r ? 0.88 - r.top / stage.height : 0.3;
  floatText(`${icon("sparkle")}${icon("star")}${icon("sparkle")}`, 0.5, Math.max(0.05, topFrac - 0.08), "rose");
  setTimeout(() => stage.setPropState(p, "used"), 300);
};

// 圓石：撞到跌倒（序列與輸入鎖定由 StageController 處理）；這裡只做回饋
stage.onTrip = () => {
  setCharged(false);
  crouchSince = 0;
  blip("trip");
  floatText(`${icon("star")}${icon("sparkle")}`, 0.5, 0.42, "sun");
  if (!prefersReducedMotion()) {
    stage.el.animate(
      [
        { transform: "translate(0,0)" },
        { transform: "translate(-4px,1px)" },
        { transform: "translate(3px,-1px)" },
        { transform: "translate(-2px,0)" },
        { transform: "translate(0,0)" },
      ],
      { duration: 120, easing: "linear" }
    );
  }
};

// ---- 換裝近拍（使用者回饋：工作室裡角色太小）----
// 站著不動（換裝、看造型、表演動作）超過 STUDIO_ZOOM_IDLE_MS 就把鏡頭以腳底為中心拉近到 1.5 倍；
// 一按左右、跳起來、絆倒就立刻拉回原本大小（玩法、碰撞、跳躍高度都不變）。拍照模式固定 1 倍，
// 取景框才會跟匯出的照片一致。
const STUDIO_ZOOM = 1.5;
const STUDIO_ZOOM_IDLE_MS = 250;
let zoomIdleSince = 0;
function updateStudioZoom(now: number): void {
  const busy =
    cameraMode ||
    pad.down.left ||
    pad.down.right ||
    pad.down.a ||
    // 太空：一直飄著，停下來（沒有速度、沒被黑洞吸）就可以拉近；地面：離地就拉遠
    (stage.inSpace ? stage.spaceBusy || pad.down.up || pad.down.down : stage.isAirborne) ||
    stage.isTripping;
  if (busy) {
    zoomIdleSince = 0;
    stage.setZoom(1);
    return;
  }
  if (!zoomIdleSince) zoomIdleSince = now;
  if (now - zoomIdleSince >= STUDIO_ZOOM_IDLE_MS) stage.setZoom(STUDIO_ZOOM);
}

// 海底世界：划水時從頭頂冒出泡泡
stage.onSwim = () => {
  if (prefersReducedMotion()) return;
  const H = stage.height;
  const headY = (0.88 - stage.charH) * H - stage.jumpHeight;
  const b = document.createElement("span");
  b.className = "studio-bubbles";
  b.innerHTML = "<i></i><i></i><i></i>";
  b.style.left = `${stage.charX * 100}%`;
  b.style.top = `${Math.max(0, headY)}px`;
  stage.hud.appendChild(b);
  setTimeout(() => b.remove(), 1200);
};

// 宇宙空間：A 衝刺時從反方向噴出小星塵；黑洞吸進去／跑出來的音效與文字
stage.onDash = (dx, dy) => {
  blip("jump");
  if (prefersReducedMotion()) return;
  const H = stage.height;
  const midY = 0.88 * H - stage.jumpHeight - stage.charH * H * 0.45;
  const b = document.createElement("span");
  b.className = "studio-bubbles studio-bubbles--space";
  b.innerHTML = "<i></i><i></i><i></i>";
  b.style.left = `calc(${stage.charX * 100}% + ${(-dx * stage.charH * H * 0.35).toFixed(0)}px)`;
  b.style.top = `${Math.max(0, midY - dy * stage.charH * H * 0.35)}px`;
  stage.hud.appendChild(b);
  setTimeout(() => b.remove(), 900);
};
// 飛碟、隕石碰到角色：音效＋驚嘆號（嚇一跳、被撞飛由 StageController 處理）
stage.onFlyerHit = (kind) => {
  blip(kind === "ufo" ? "pop" : "trip");
  const top = Math.max(0.05, 0.88 - stage.charH - stage.jumpHeight / stage.height - 0.04);
  floatText(kind === "ufo" ? `!${icon("sparkle")}` : `!!${icon("star")}`, 0.5, top, kind === "ufo" ? "mint" : "peach");
};
stage.onWarp = (phase) => {
  blip(phase === "in" ? "pop" : "coin");
  if (phase === "out") floatText(`${icon("sparkle")}${icon("star")}${icon("sparkle")}`, 0.5, Math.max(0.05, 0.88 - stage.charH - stage.jumpHeight / stage.height - 0.06), "lilac");
};

// ---- 隨機左右移動物件（墓園大型墓碑，每次隨機移動約一個物件寬） ----
interface WanderingPropState {
  slot: number; // -1 (左), 0 (中), 1 (右)
  startFx: number;
  targetFx: number;
  moveStartAt: number;
  moveDurationMs: number;
  nextMoveAt: number;
}
const wanderingProps = new Map<PlayProp, WanderingPropState>();

function initWanderingProps(): void {
  wanderingProps.clear();
  for (const p of playProps) {
    if (p.wander) {
      wanderingProps.set(p, {
        slot: 0,
        startFx: 0,
        targetFx: 0,
        moveStartAt: 0,
        moveDurationMs: 950,
        nextMoveAt: performance.now() + 1000 + Math.random() * 800,
      });
    }
  }
}

function updateMovingProps(now: number): void {
  if (wanderingProps.size === 0) return;
  let hasMoved = false;

  for (const [p, s] of wanderingProps) {
    // 每次移動約一個物件寬度（基礎 60 單位 × 縮放倍率）
    const stepWidth = (GameArt.props.find((d) => d.id === p.id)?.size[0] ?? 60) * (p.scale ?? 1);

    // 檢查是否開始下一次隨機移動
    if (s.moveStartAt === 0 && now >= s.nextMoveAt) {
      // 在中間 (0) 時，50% 往左 (-1)，50% 往右 (+1)；在邊緣時往回移動至中間 (0)
      const nextSlot = s.slot === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
      s.slot = nextSlot;
      s.startFx = p.fx ?? 0;
      s.targetFx = nextSlot * stepWidth;
      s.moveStartAt = now;
      s.moveDurationMs = 850 + Math.random() * 250;
    }

    // 移動進行中（平滑 Ease-In-Out 曲線）
    if (s.moveStartAt > 0) {
      const elapsed = now - s.moveStartAt;
      const progress = Math.min(1, Math.max(0, elapsed / s.moveDurationMs));
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const newFx = s.startFx + (s.targetFx - s.startFx) * ease;
      const dfx = newFx - (p.fx ?? 0);
      p.fx = newFx;
      hasMoved = true;

      // 角色與移動墓碑的互動
      if (dfx !== 0) {
        const [charLeft, charRight] = stage.charSpan();
        const r = stage.propRect(p);
        if (r) {
          const isStanding = Math.abs(r.top - stage.jumpHeight) < 6 && charRight > r.left && charLeft < r.right;
          if (isStanding && !stage.isFalling) {
            // 角色站在墓碑上方：隨墓碑一起平移
            stage.offset += dfx * stage.unit;
          } else if (stage.jumpHeight < r.top - 2) {
            // 角色在地面側面：若墓碑移動碰撞擠壓，溫和推開角色防穿透
            if (dfx > 0 && r.right > charLeft && r.left < charLeft) {
              stage.offset += (r.right - charLeft) + 2;
            } else if (dfx < 0 && r.left < charRight && r.right > charRight) {
              stage.offset -= (charRight - r.left) + 2;
            }
          }
        }
      }

      if (progress >= 1) {
        s.moveStartAt = 0;
        s.nextMoveAt = now + 1200 + Math.random() * 1200; // 停留 1.2 ~ 2.4 秒後再次隨機移動
      }
    }
  }

  if (hasMoved) {
    stage.positionProps();
  }
}

stage.onTick = () => {
  const H = stage.height;
  const now = performance.now();
  const dt = Math.min(0.05, Math.max(0.001, (now - lastCreatureTick) / 1000));
  lastCreatureTick = now;
  stage.allowRun = !isZombieTransformed();
  if (isZombieTransformed() && (struggleTarget || trappedChest || trappedHand || huggedZombie)) {
    releaseMonsterTrapByTalisman();
  }
  updateCharge(now);
  updateStudioZoom(now);
  updateSceneCreatures(now, dt);
  updateMovingProps(now);
  updateMonsterBubblePos();
  updateHalloweenPortal(now);

  // 墓園場景停留超過 180 秒（3 分鐘）：群蝠飛過佔據畫面 10 秒
  if (stage.sceneId === "graveyard") {
    const stayMs = now - graveyardStayStartAt;
    if (stayMs >= 180000 && (lastBatSwarmAt === 0 || now - lastBatSwarmAt >= 190000)) {
      lastBatSwarmAt = now;
      triggerGraveyardBatSwarm();
    }
  }

  // 掙脫進度緩慢消退（若超過 750ms 未按鍵）
  if (struggleTarget) {
    if (lastStruggleTapAt > 0 && now - lastStruggleTapAt > 750) {
      struggleProgressMs = Math.max(0, struggleProgressMs - dt * 650);
      const promptText = struggleTarget === "chest" ? "連按 ← → 掙脫寶箱！" : struggleTarget === "hand" ? "連按 ← → 掙脫巨手！" : "連按 ← → 彈開殭屍！";
      updateStruggleHud(promptText, struggleProgressMs);
    }
  }

  // 被寶箱咬住時，微調鎖定角色位置
  if (trappedChest) {
    const chestScreenX = stage.propScreenX(trappedChest);
    const diff = chestScreenX - stage.width * stage.charX;
    if (Math.abs(diff) > 1.5) {
      stage.offset += diff * 0.15;
    }
  }

  // 被地底巨手抓住時，鎖定巨手在角色正中心，保持完全同步
  if (trappedHand) {
    trappedHand.x = stage.offset / stage.width;
    stage.positionProps();
  }

  for (const p of playProps) {
    const dist = stage.distanceTo(p);
    if (p.resetAt && now > p.resetAt && dist > 0.6) {
      p.resetAt = undefined;
      stage.setPropState(p, p.kind === "gift" ? "idle" : p.kind === "chest" ? "closed" : "idle");
    }
    // 彈簧：只有「下落時腳底碰到彈簧頂部」才觸發（走過、從下方頂到都不算），彈起 1.8 倍高；不加冷卻
    if (p.kind === "spring" && stage.isFalling && dist < 0.045) {
      const topPx = stage.propRect(p)?.top ?? 0.11 * H; // 彈簧頂部離地高度
      if (lastJumpHeight > topPx && stage.jumpHeight <= topPx) {
        const mult = Math.max(SPRING_MULT, consumeCharge() ? CHARGE_MULT : 1); // 跟蓄力不疊加，取較大者
        stage.setPropState(p, "compressed");
        stage.bounce(mult);
        blip("jump");
        floatText(icon("sparkle"), 0.5, 0.55, "mint");
        setTimeout(() => stage.setPropState(p, "launched"), 90);
        p.resetAt = now + 700;
      }
    }
    if (p.kind === "flower") {
      const isTyphoon = stage.sceneId === "forest" && currentWeather === "typhoon";
      const want = !isTyphoon && dist < 0.12 ? "bloom" : "bud";
      if (p.state !== want) stage.setPropState(p, want);
    }
    if (p.kind === "campfire") {
      const isTyphoon = stage.sceneId === "forest" && currentWeather === "typhoon";
      if (isTyphoon) {
        if (p.state !== "out") {
          stage.setPropState(p, "out");
          campfireLitUntil = 0;
        }
      } else {
        // 角色走近火堆（dist < 0.09）且未生火時自動觸發生火並啟動計時
        if (p.state === "out" && dist < 0.09) {
          stage.setPropState(p, "lit");
          campfireLitUntil = now + campfireDuration();
          blip("pop");
          floatText(`${icon("sparkle")}`, 0.5, 0.45, "peach");
        }
        // 計時自動熄滅
        if (p.state === "lit" && campfireLitUntil && now >= campfireLitUntil) {
          campfireLitUntil = 0;
          stage.setPropState(p, "out");
          blip("pop");
          floatText(`${icon("sparkle")}`, 0.5, 0.45, "stone");
        }
      }
    }
    if (p.kind === "chest") {
      if (stage.sceneId === "graveyard") {
        if (isZombieTransformed()) {
          // 變身殭屍：寶箱不咬同類，靠近時觸發聊天對話彩蛋
          if (dist < 0.1) tryMonsterTalk(p.el, dist);
        } else if (p.state === "closed" && dist < 0.12 && stage.jumpHeight < 65 && now > chestCooldownUntil && !trappedChest && !huggedZombie) {
          trappedChest = p;
          struggleTarget = "chest";
          struggleProgressMs = 0;
          lastStruggleKey = null;
          lastStruggleTapAt = now;
          stage.allowJump = false;
          stage.allowCrouch = false;
          stage.setPropState(p, "bite");
          blip("trip");
          showStruggleHud("連按 ← → 掙脫寶箱！");
        }
      } else {
        // 一般場景寶箱
        if (p.state === "closed" && dist < 0.07) {
          stage.setPropState(p, "open");
          p.resetAt = now + 6000;
          blip("pop");
          floatText(`${icon("gem")}`, 0.5, 0.45, "lilac");
        }
      }
    }
    if (p.kind === "giantHand") {
      if (stage.sceneId === "graveyard") {
        if (isZombieTransformed()) {
          // 變身殭屍：地底巨手不攻擊同類
        } else if (p.state === "hidden" && dist < 0.055 && stage.jumpHeight < 25 && (!p.cooldownUntil || now > p.cooldownUntil) && !struggleTarget) {
          // 立即將巨手位置精準對齊在角色的正中心
          p.x = stage.offset / stage.width;
          stage.positionProps();

          trappedHand = p;
          struggleTarget = "hand";
          struggleProgressMs = 0;
          lastStruggleKey = null;
          lastStruggleTapAt = now;
          stage.allowJump = false;
          stage.allowCrouch = false;
          stage.setPropState(p, "grab");
          if (p.el) {
            p.el.classList.remove("studio-hand-retreat");
            p.el.classList.remove("studio-hand-erupt");
            void p.el.offsetWidth;
            p.el.classList.add("studio-hand-erupt");
          }
          blip("trip");
          floatText("👻 地底冒出巨手！", 0.5, 0.35, "lilac");
          showStruggleHud("連按 ← → 掙脫巨手！");
        }
      }
    }
  }
  lastJumpHeight = stage.jumpHeight;
};

// ---- 拍照（Handoff 3） ----
type Aspect = "16:9" | "1:1" | "4:5";
const ASPECTS: Aspect[] = ["16:9", "1:1", "4:5"];
function aspect(): Aspect {
  const a = getSetting(SETTINGS.aspect, "16:9") as Aspect;
  return ASPECTS.includes(a) ? a : "16:9";
}
function renderCameraBar(): void {
  const bar = $(".studio-camera-bar");
  const cd = getSetting(SETTINGS.countdown, "1") === "1";
  bar.innerHTML = `
    <div class="studio-seg" role="group" aria-label="照片比例">${ASPECTS.map(
      (a) => `<button type="button" data-aspect="${a}" aria-pressed="${aspect() === a}">${a}</button>`
    ).join("")}</div>
    <button type="button" class="studio-seg-toggle" data-countdown aria-pressed="${cd}">${icon("timer", "sm")} 倒數</button>
    <button type="button" class="g-iconbtn g-h-sun studio-shutter" aria-label="按下快門">${icon("camera", "lg")}</button>
    <button type="button" class="g-iconbtn g-h-stone" data-cam-close aria-label="關閉相機">${icon("close")}</button>`;
  renderFrame();
}
function renderFrame(): void {
  const f = $(".studio-frame");
  const [w, h] = GameArt.photoSizes[aspect()] ?? [1920, 1080];
  const ratio = w / h;
  const sw = stage.width;
  const sh = stage.height;
  let fw = sh * ratio;
  let fh = sh;
  if (fw > sw) {
    fw = sw;
    fh = sw / ratio;
  }
  f.style.width = `${fw}px`;
  f.style.height = `${fh}px`;
}
function toggleCamera(force?: boolean): void {
  cameraMode = force ?? !cameraMode;
  if (cameraMode) endTryOn(); // 試穿中的款式不能拍照（沒買）
  $(".studio-camera-bar").hidden = !cameraMode;
  $(".studio-frame").hidden = !cameraMode;
  $(".studio-camera").classList.toggle("on", cameraMode);
  if (cameraMode) {
    renderCameraBar();
    if (drawerOpen && isPortraitDrawer()) setDrawer(false);
    tourAdvance("camera");
  }
}
$(".studio-camera-bar").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (!b) return;
  if (b.dataset.aspect) {
    setSetting(SETTINGS.aspect, b.dataset.aspect);
    renderCameraBar();
  } else if (b.hasAttribute("data-countdown")) {
    setSetting(SETTINGS.countdown, getSetting(SETTINGS.countdown, "1") === "1" ? "0" : "1");
    renderCameraBar();
  } else if (b.hasAttribute("data-cam-close")) toggleCamera(false);
  else if (b.classList.contains("studio-shutter")) void takePhoto();
});

async function countdown(): Promise<void> {
  if (getSetting(SETTINGS.countdown, "1") !== "1") return;
  const el = document.createElement("div");
  el.className = "studio-countdown";
  stage.hud.appendChild(el);
  let skip = false;
  el.addEventListener("pointerdown", () => (skip = true));
  for (const n of [3, 2, 1]) {
    if (skip) break;
    el.innerHTML = `<span class="g-t-display">${n}</span><span class="g-t-caption">點一下直接拍</span>`;
    blip("tap");
    await new Promise((r) => setTimeout(r, 700));
  }
  el.remove();
}

async function takePhoto(): Promise<void> {
  if (busy || !profileId) return;
  busy = true;
  saveNow(); // 拍照前強制存
  await countdown();
  stage.freeze(true); // 角色定格目前動作
  // 腳底與影子位置跟舞台一致（跳起來、在海底游泳、站在方塊上拍，照片裡也在同樣的高度）
  const opts = { ...stage.exportState(), aspect: aspect(), charX: 0.5 };
  const flash = document.createElement("div");
  flash.className = "studio-flash";
  stage.hud.appendChild(flash);
  requestAnimationFrame(() => flash.classList.add("studio-flash--go"));
  setTimeout(() => flash.remove(), 450);
  blip("shutter");
  let blob: Blob | null = null;
  try {
    blob = await GameArt.exportPNG(opts);
  } catch (err) {
    console.error("exportPNG 失敗（請回報內容端，附瀏覽器版本與 exportSVG 輸出）", err, navigator.userAgent);
    toast(`${icon("info")} 這台裝置拍照失敗了`, 2600, "rose");
  }
  stage.freeze(false);
  busy = false;
  if (!blob) return;
  const night = stage.skyState.night > 0.5;
  showPhotoPreview(blob, { aspect: opts.aspect as Aspect, sceneId: opts.scene, time: night ? "night" : "day" });
}

function photoModal(inner: string): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "gmodal";
  overlay.innerHTML = `<div class="gmodal-card studio-photo-card" role="dialog" aria-modal="true">${inner}</div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function showPhotoPreview(blob: Blob, meta: { aspect: Aspect; sceneId: string; time: "day" | "night" }): void {
  const url = URL.createObjectURL(blob);
  const share = canShareFiles();
  const overlay = photoModal(`
    <img class="studio-photo-big" src="${url}" alt="剛拍好的照片" />
    <div class="gmodal-actions">
      <button type="button" class="gbtn gbtn--quiet" data-v="again">${icon("camera")}再拍</button>
      <button type="button" class="gbtn g-h-mint" data-v="save">${icon("save")}存到相簿</button>
      <button type="button" class="gbtn g-h-sky" data-v="download">${icon("download")}下載</button>
      ${share ? `<button type="button" class="gbtn g-h-lilac" data-v="share">${icon("sparkle")}分享</button>` : ""}
      <button type="button" class="gbtn g-h-rose" data-v="delete">${icon("trash")}刪除</button>
    </div>`);
  const close = () => {
    overlay.remove();
    URL.revokeObjectURL(url);
  };
  overlay.addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
    if (!b) return;
    const v = b.dataset.v;
    if (v === "again") {
      close();
      return;
    }
    if (v === "download") {
      downloadBlob(blob, photoFileName(Date.now()));
      recordPhotoStats(meta);
      return;
    }
    if (v === "share") {
      try {
        await navigator.share({ files: [new File([blob], photoFileName(Date.now()), { type: "image/png" })] });
      } catch {
        // 使用者取消
      }
      return;
    }
    if (v === "delete") {
      if (await confirmDialog({ iconId: "trash", text: "不要這張照片？", yes: "刪掉" })) close();
      return;
    }
    if (v === "save") {
      if (!photosSupported()) {
        downloadBlob(blob, photoFileName(Date.now()));
        recordPhotoStats(meta);
        close();
        return;
      }
      try {
        await addPhoto(
          { profileId: profileId!, slot: slot.pos ?? data.activeSlot, slotId: slot.id, sceneId: meta.sceneId, time: meta.time, aspect: meta.aspect, createdAt: Date.now(), width: 0, height: 0 },
          blob
        );
        recordPhotoStats(meta);
        toast(`${icon("check")} 存好了！到「相簿」看看`, 2000, "mint");
        await refreshAlbum();
        close();
      } catch (err) {
        if ((err as Error).message === "PHOTO_LIMIT") toast(`${icon("info")} 相簿滿了（${MAX_PHOTOS} 張），先刪掉舊的吧`, 3000, "rose");
        else toast(`${icon("info")} 存不進去，可以先下載`, 2600, "rose");
      }
    }
  });
}

/** 照片統計＋獎勵（首次拍照 +5 代幣、攝影師／環遊世界／日夜都愛徽章）：存相簿或下載都算「拍了一張」，同一張只算一次 */
const countedPhotos = new WeakSet<object>();
function recordPhotoStats(meta: { sceneId: string; time: "day" | "night" }): void {
  if (countedPhotos.has(meta)) return;
  countedPhotos.add(meta);
  const before = badgeSnapshot();
  data.stats.photos += 1;
  const tag = `${meta.sceneId}:${meta.time}`;
  if (!data.stats.scenesShot.includes(tag)) data.stats.scenesShot.push(tag);
  if (meta.time === "night") data.stats.nightShot = true;
  else data.stats.dayShot = true;
  if (!data.stats.firstPhotoRewarded && profileId) {
    data.stats.firstPhotoRewarded = true;
    earnTokens(profileId, FIRST_PHOTO_TOKENS);
    toast(`${icon("coin")} 第一張照片！送你 ${FIRST_PHOTO_TOKENS} 個代幣`, 2600);
  }
  dirty = true;
  data.slots[data.activeSlot] = slot;
  saveCharacter(profileId!, data);
  dirty = false;
  announceBadges(before);
  renderSaveStatus();
}

function openPhoto(id: string): void {
  const p = photoCache.find((x) => x.id === id);
  if (!p) return;
  const url = URL.createObjectURL(p.blob);
  const share = canShareFiles();
  const isCover = slot.coverPhotoId === p.id;
  const overlay = photoModal(`
    <img class="studio-photo-big" src="${url}" alt="照片" />
    <p class="g-t-caption">${escapeHtml(data.slots.find((x) => x.id === p.slotId)?.name ?? (p.slotId ? "已刪除的角色" : data.slots[p.slot]?.name ?? ""))}・${new Date(p.createdAt).toLocaleString()}・${GameArt.sceneInfo[p.sceneId]?.label ?? p.sceneId}・${p.time === "night" ? "夜晚" : "白天"}・${p.aspect}</p>
    <div class="gmodal-actions">
      <button type="button" class="gbtn gbtn--quiet" data-v="close">${icon("close")}關閉</button>
      <button type="button" class="gbtn g-h-sky" data-v="download">${icon("download")}下載</button>
      ${share ? `<button type="button" class="gbtn g-h-lilac" data-v="share">${icon("sparkle")}分享</button>` : ""}
      <button type="button" class="gbtn g-h-sun" data-v="cover" ${isCover ? "disabled" : ""}>${icon("star")}${isCover ? "目前封面" : "設為封面"}</button>
      <button type="button" class="gbtn g-h-rose" data-v="delete">${icon("trash")}刪除</button>
    </div>`);
  const close = () => {
    overlay.remove();
    URL.revokeObjectURL(url);
  };
  overlay.addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
    if (!b && e.target === overlay) return close();
    if (!b) return;
    const v = b.dataset.v;
    if (v === "close") close();
    else if (v === "download") downloadBlob(p.blob, photoFileName(p.createdAt));
    else if (v === "share") {
      try {
        await navigator.share({ files: [new File([p.blob], photoFileName(p.createdAt), { type: "image/png" })] });
      } catch {
        // 取消
      }
    } else if (v === "cover") {
      slot.coverPhotoId = p.id;
      markDirty();
      close();
      renderTab();
    } else if (v === "delete") {
      if (!(await confirmDialog({ iconId: "trash", text: "刪掉這張照片？", yes: "刪掉" }))) return;
      await deletePhoto(p.id);
      const tu = thumbUrls.get(p.id);
      if (tu) URL.revokeObjectURL(tu);
      thumbUrls.delete(p.id);
      if (slot.coverPhotoId === p.id) {
        slot.coverPhotoId = null;
        markDirty();
      }
      close();
      await refreshAlbum();
    }
  });
}

// ---- 手機直放：面板改為底部抽屜，展開時隱藏虛擬按鍵 ----
function isPortraitDrawer(): boolean {
  return window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches;
}
function setDrawer(open: boolean): void {
  drawerOpen = open;
  app.querySelector(".studio")!.classList.toggle("studio--drawer-open", open);
  const hidePad = open && isPortraitDrawer();
  pad.setEnabled(!hidePad);
  $(".studio-pad-host").hidden = hidePad;
}

// ---- 首次 3 步導覽（點選造型 → 按 A → 按相機），可略過、只出現一次 ----
const TOUR = [
  { key: "style", text: "點一個造型，幫角色換裝" },
  { key: "jump", text: "按 A（或空白鍵）跳起來！" },
  { key: "camera", text: "按右上角的相機拍一張照" },
];
let tourStep = data.stats.tourSeen ? -1 : 0;
const tourEl = document.createElement("div");
tourEl.className = "studio-tour";
document.body.appendChild(tourEl);
function renderTour(): void {
  if (tourStep < 0 || tourStep >= TOUR.length) {
    tourEl.hidden = true;
    return;
  }
  tourEl.hidden = false;
  tourEl.innerHTML = `<div class="g-bubble g-h-sky"><span class="g-t-tag">${tourStep + 1} / ${TOUR.length}</span> ${TOUR[tourStep].text}
    <button type="button" class="studio-tour-skip">略過</button></div>`;
  tourEl.querySelector("button")!.addEventListener("click", () => finishTour());
}
function tourAdvance(key: string): void {
  if (tourStep < 0 || TOUR[tourStep]?.key !== key) return;
  tourStep++;
  if (tourStep >= TOUR.length) finishTour();
  else renderTour();
}
function finishTour(): void {
  tourStep = -1;
  renderTour();
  if (!data.stats.tourSeen) {
    data.stats.tourSeen = true;
    markDirty();
  }
}

// ---- 啟動 ----
function init(): void {
  if (!profileId) return;
  if (isFirstVisit) {
    // 首次進入：隨機給一組預設角色，先不存檔——孩子自己改過才算「第一次儲存」（代幣＋「初次變身」徽章）
    isFirstVisit = false;
  }
  currentWeather = slot.scene.id === "forest" ? (slot.scene.weather ?? "sunny") : "sunny";
  initWeatherLayer();
  stage.setTime(timeModeOf(slot.scene));
  placeProps();
  renderTabs();
  renderTab();
  renderName();
  renderViews();
  renderHistoryButtons();
  renderSound();
  renderSaveStatus();
  renderTour();
  renderHint();
  setDrawer(!isPortraitDrawer());
  let wasPortrait = isPortraitDrawer();
  window.addEventListener("resize", () => {
    if (cameraMode) renderFrame();
    const nowPortrait = isPortraitDrawer();
    // 轉向時：橫放一律展開面板；直放收合抽屜（讓按鍵出現）
    if (nowPortrait !== wasPortrait) {
      wasPortrait = nowPortrait;
      setDrawer(!nowPortrait);
    }
  });
  window.addEventListener("pagehide", () => saveNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveNow();
  });
  tryFullscreenOnFirstTap();
  preventZoomGestures();
  if (window.matchMedia("(orientation: portrait) and (max-width: 700px)").matches) addRotateHint();
  void refreshAlbum();
  try {
    if (sessionStorage.getItem("justEquippedTalisman") === "1") {
      sessionStorage.removeItem("justEquippedTalisman");
      setTimeout(() => {
        spawnTalismanSmokeEffect();
      }, 400);
    }
  } catch {
    // 忽略
  }
}
init();
// 自動化測試用（網址加 ?debug=1 才掛出來）
if (new URLSearchParams(location.search).has("debug")) (window as any).__studio = { stage, pad, get data() { return data; }, triggerBatSwarm: triggerGraveyardBatSwarm, triggerSmoke: spawnTalismanSmokeEffect };
(window as any).__triggerBatSwarm = triggerGraveyardBatSwarm;
