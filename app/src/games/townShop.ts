// 角色小鎮：店內畫面（第二階段 2a；docs/plan-game-town.md §4、§5、§7）
// 左邊是店裡（店長、招牌、自己的角色正面），右邊是這間店賣的款式。
// - 免費或已買的款式：點了直接換上、馬上存檔。
// - 沒買的款式：點了先試穿，下方出現「買下來」；確定才扣代幣（purchase），10 分鐘內可退回（shopStore 規則不變）。
// - 店長講英文短句（下面有中文），iOS 要先點過畫面才會唸。
import { GameArt, GameTokens, icon, normalizeLook, type Facing, type Look, type View } from "../game/gameKit";
import {
  colorOf,
  lockedItem,
  nameOf,
  saveActiveLook,
  sameLook,
  setField,
  talismanUnlocked,
  thumbLook,
  toggleAccessory,
  tryOnLook,
  type LookKey,
} from "../game/lookShop";
import { purchase, recentPurchases, refund, sanitizeLook, shopItems, type ShopItem } from "../game/shopStore";
import { createInitial, DEFAULT_NAME, loadCharacter, MAX_SLOTS, NAME_MAX, newSlot, saveCharacter, slotIndexAt, validateName, type CharacterData } from "../game/characterStore";
import { confirmDialog, toast } from "../game/fullscreenPage";
import { getTokenBalance } from "../gameTokens";
import { speakEnglishFemale as speakEnglish } from "../speech";
import { COIN_ICON } from "./gameIcons";
import { PhotoAlbum, portraitPhoto, showPhotoPreview, type PhotoAspect } from "../game/townPhoto";
import { playShutter } from "../game/townSfx";
import { HomePlay } from "../game/homePlay";
import {
  categoryOf,
  composeRoomSvg,
  decorateEnabled,
  playEnabled,
  homeCfg,
  homeItem,
  itemsOf,
  loadHome,
  ownsHomeItem,
  renderRoom,
  setHomeSlot,
  slotsOf,
  storeEnabled,
  type HomeItem,
  type HomeLayout,
} from "../game/homeStore";

export interface ShopSection {
  field: keyof Look;
  type: "thumb" | "swatch" | "pants" | "acc";
  label: string;
  src?: "skin" | "hair" | "hue";
  mode?: "head" | "body";
  /** item＝縮圖只畫道具，不畫人物（GameArt.itemIcon） */
  art?: "item";
  /** acc：這一區的配件；"rest"＝其他區沒分到的配件 */
  items?: string[] | "rest";
}
export interface ShopPlaceInfo {
  id: string;
  label: string;
  en: string;
  hue: string;
  say?: string;
  shop: {
    /** home＝我的家（角色槽＋衣櫃：只能換已擁有的款式，沒有店長、櫃檯、購買）；photo＝照相館（紀念照＋相簿）；furniture＝家具店（左邊是自己的房間預覽） */
    mode?: "shop" | "home" | "photo" | "furniture";
    /** 照相館：紀念照的場景、可選動作、台詞、文案 */
    photo?: {
      scene: string;
      poses: string[];
      lines: Record<"snap" | "saved", Line>;
      text: Record<"portrait" | "portraitHint" | "album" | "streetHint" | "empty", string>;
    };
    /** 店長：人物＋裝扮系統做的角色（不用動物）；我的家沒有 */
    keeper?: { name: string; look: Partial<Look> };
    zhHello: string;
    /** 我的家的英文招呼語（沒有就用地點的 say） */
    hello?: string;
    sections: ShopSection[];
    /** 店內擺設：櫃檯色相（我的家沒有）＋牆上／地上的道具（left／bottom／width＝正方形舞台的百分比） */
    interior: { counter?: string; decor: { prop: string; state?: string; left: number; bottom: number; width: number }[] };
    /** 這個地點自己的台詞（例如我的家的再見） */
    lines?: Partial<Record<"bye", Line>>;
  };
}
type Line = { en: string; zh: string };
export interface ShopLines {
  tryOn: Line;
  buy: Line;
  wear: Line;
  bye: Line;
  needMore: Line;
}

function esc(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export class TownShop {
  readonly el: HTMLDivElement;
  private look: Look;
  private entry: Look;
  /** 我的家：角色槽／衣櫃分頁 */
  private readonly home: boolean;
  private homeTab: "slots" | "wardrobe" | "decorate" = "slots";
  /** 我的家・佈置：房間擺設、進門時的擺設（還原用）、目前的類別與位置、晚上（窗外、燈） */
  private layout: HomeLayout | null = null;
  private layoutEntry = "";
  private decoCat = "wallpaper";
  private decoSlot = "";
  private hlSlot: string | null = null;
  private hlTimer = 0;
  private night = false;
  /** 家具店：左邊是自己的房間，店長熊木匠站在房間裡；點家具先試擺 */
  private readonly furniture: boolean;
  private storeCat = "";
  private tryHome: { slot: string; item: string } | null = null;
  /** 照相館 */
  private readonly photo: boolean;
  private album: PhotoAlbum | null = null;
  private pPose = "cheer";
  private pAspect: PhotoAspect = "4:5";
  private shooting = false;
  private trying: ShopItem | null = null;
  private meCtl: { stop(): void } | null = null;
  /** 我的家・在家玩（走動、躺床、坐地上）；null＝沒開 */
  private play: HomePlay | null = null;
  private keeperCtl: { stop(): void } | null = null;
  private poseTimer = 0;
  private closed = false;
  /** 角色預覽的方向：正面 → 右 → 背面 → 左（← → 鍵或下方按鈕切換） */
  private dir = 0;
  private static readonly DIRS: { id: string; label: string; view: View; facing: Facing }[] = [
    { id: "front", label: "前", view: "front", facing: "right" },
    { id: "right", label: "右", view: "side", facing: "right" },
    { id: "back", label: "後", view: "back", facing: "right" },
    { id: "left", label: "左", view: "side", facing: "left" },
  ];
  private onKeyUp = (e: KeyboardEvent) => {
    this.play?.key(e, false);
  };
  private onKey = (e: KeyboardEvent) => {
    if (this.play?.key(e, true)) return;
    if (e.key === "Escape") void this.close();
    else if (e.key === "ArrowRight") this.turn(1);
    else if (e.key === "ArrowLeft") this.turn(-1);
  };

  constructor(
    host: HTMLElement,
    private pid: string,
    private place: ShopPlaceInfo,
    look: Look,
    private lines: ShopLines,
    private onClose: (look: Look, name?: string) => void,
    opts: { night?: boolean } = {}
  ) {
    this.night = !!opts.night;
    this.look = sanitizeLook(pid, look).look;
    this.entry = this.look;
    this.home = place.shop.mode === "home";
    this.photo = place.shop.mode === "photo";
    this.furniture = place.shop.mode === "furniture";
    if (this.furniture) this.layout = loadHome(pid);
    // 佈置功能沒開（正式 App、使用者還沒同意上線）：房間維持原本的畫法，完全不變
    if (this.home && decorateEnabled()) {
      this.layout = loadHome(pid);
      this.layoutEntry = JSON.stringify(this.layout.slots);
    }
    if (this.photo) {
      this.pPose = place.shop.photo?.poses.find((x) => GameArt.poses.includes(x)) ?? "idle";
      this.album = new PhotoAlbum(pid, () => this.render());
      void this.album.refresh();
    }
    const p = place;
    const counter = p.shop.interior.counter;
    this.el = document.createElement("div");
    this.el.className = `tshop${this.home ? " tshop--home" : ""}${this.photo ? " tshop--photo" : ""}${this.furniture ? " tshop--furniture" : ""}`;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-label", p.label);
    this.el.style.setProperty("--h", `var(--g-${p.hue})`);
    this.el.style.setProperty("--hs", `var(--g-${p.hue}-soft)`);
    this.el.style.setProperty("--hd", `var(--g-${p.hue}-deep)`);
    this.el.innerHTML = `
      <div class="tshop-left">
      <section class="tshop-room">
        <div class="tshop-floor"></div>
        <div class="tshop-scene">
          ${this.layout ? `<div class="home-decor"></div>` : this.decorHtml()}
          ${p.shop.keeper && !this.furniture ? `<div class="tshop-keeper"></div>` : ""}
          ${counter ? this.propHtml("shopCounter", counter, 2, 14, 50, "tshop-counter") : ""}
          ${counter ? this.propHtml("shoppingBag", p.hue === "peach" ? "sky" : "peach", 6, 34.2, 8) : ""}
          ${counter ? this.propHtml("cashRegister", undefined, 32, 34.2, 14) : ""}
          <div class="tshop-sign"><span class="town-en">${esc(p.en)}</span><span class="town-zh">${esc(p.label)}</span></div>
          <div class="tshop-me"></div>
        </div>
        <div class="tshop-say g-bubble" aria-live="polite"></div>

      </section>
        <div class="tshop-turn" role="group" aria-label="轉身看看">
          <button type="button" class="g-iconbtn tshop-turn-btn" data-turn="-1" aria-label="往左轉">${icon("left")}</button>
          ${TownShop.DIRS.map((d, i) => `<button type="button" class="tshop-dir" data-dir="${i}" aria-pressed="${i === 0}">${d.label}</button>`).join("")}
          <button type="button" class="g-iconbtn tshop-turn-btn" data-turn="1" aria-label="往右轉">${icon("right")}</button>
          ${this.layout && this.home ? `<button type="button" class="g-iconbtn g-h-sun tshop-turn-btn home-cam" data-act="homephoto" aria-label="在家裡拍照">${icon("camera")}</button>` : ""}
        </div>
      </div>
      <section class="tshop-panel">
        <header class="tshop-head">
          <span class="g-chip tshop-coins">${COIN_ICON(22)}<span class="g-t-number"></span></span>
          ${this.home && this.layout && playEnabled() ? `<button type="button" class="gbtn g-h-lilac tshop-playbtn" data-act="play">${icon("user")}${esc(homeCfg().play?.text.play ?? "在家玩")}</button>` : ""}
          <button type="button" class="gbtn gbtn--quiet tshop-revert" data-act="revert">${icon("restart")}還原</button>
          <button type="button" class="gbtn g-h-mint tshop-leave" data-act="leave">${icon("back")}離開</button>
        </header>
        <div class="tshop-body"></div>
        <div class="tshop-bar" hidden></div>
      </section>`;
    host.appendChild(this.el);
    if (this.layout) this.drawRoom();
    this.drawKeeper();
    this.drawMe();
    if (p.shop.keeper) {
      const nm = p.shop.keeper.name;
      this.say({ en: `Hi, I'm ${nm}! ${(p.say ?? "Welcome!").replace(/^Hello!\s*/, "")}`, zh: `嗨，我是 ${nm}！${p.shop.zhHello.replace(/^哈囉！/, "")}` }, true);
    } else this.say({ en: p.shop.hello ?? p.say ?? "Welcome home!", zh: p.shop.zhHello }, true);
    this.render();
    this.el.addEventListener("click", (e) => this.onClick(e));
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    // 我的家・在家玩：進門就在房間裡（要換角色、衣服、佈置按「整理房間」）
    if (this.home && this.layout && playEnabled()) this.startPlay();
  }

  // ---- 畫面 ----
  /** 店內道具（token 繪製）；left／bottom／width 是正方形舞台的百分比 */
  private propHtml(id: string, state: string | undefined, left: number, bottom: number, width: number, cls = ""): string {
    let art = "";
    try {
      art = GameArt.prop(id, state ? { state } : {});
    } catch {
      return "";
    }
    return `<div class="tshop-prop ${cls}" style="left:${left}%;bottom:${bottom}%;width:${width}%">${art}</div>`;
  }

  private decorHtml(): string {
    return this.place.shop.interior.decor.map((d) => this.propHtml(d.prop, d.state, d.left, d.bottom, d.width)).join("");
  }

  /** 店長：用人物＋裝扮系統做的角色，站在櫃檯後面 */
  private drawKeeper(): void {
    const box = this.el.querySelector<HTMLElement>(".tshop-keeper");
    if (!box || !this.place.shop.keeper) return;
    const look = normalizeLook(this.place.shop.keeper.look as Look, GameArt.presets["kid-blue"]);
    box.innerHTML = GameArt.character({ ...look, view: "front", pose: "idle" });
    const svg = box.querySelector("svg");
    if (svg) this.keeperCtl = GameArt.animate(svg as SVGElement, "idle");
  }

  private startPlay(): void {
    if (!this.play) {
      this.play = new HomePlay({
        root: this.el,
        room: this.el.querySelector<HTMLElement>(".tshop-room")!,
        scene: this.el.querySelector<HTMLElement>(".tshop-scene")!,
        me: this.el.querySelector<HTMLElement>(".tshop-me")!,
        look: () => this.look,
        layout: () => this.layout!,
        onTidy: () => this.stopPlay(),
        onLeave: () => void this.close(),
        onPhoto: () => void this.snapHome(),
      });
    }
    this.meCtl?.stop();
    this.meCtl = null;
    if (this.homeTab === "decorate") {
      this.homeTab = "slots";
      this.el.classList.remove("tshop--decorating");
      this.drawRoom();
    }
    this.play.start();
  }
  private stopPlay(): void {
    this.play?.stop();
    this.dir = 0;
    this.drawMe();
    this.render();
  }

  private drawMe(pose = this.photo ? this.pPose : "idle"): void {
    if (this.play?.active) return; // 在家玩：角色交給 HomePlay 畫
    this.meCtl?.stop();
    const box = this.el.querySelector<HTMLElement>(".tshop-me")!;
    if (this.furniture && this.place.shop.keeper) {
      // 家具店：房間裡站的是店長熊木匠（不是自己的角色）
      const kl = normalizeLook(this.place.shop.keeper.look as Look, GameArt.presets["kid-blue"]);
      const kd = TownShop.DIRS[this.dir];
      box.innerHTML = GameArt.character({ ...kl, ...(this.place.shop.keeper.look as Partial<Look>), view: kd.view, facing: kd.facing, pose });
      const ksvg = box.querySelector("svg");
      this.meCtl = ksvg ? GameArt.animate(ksvg as SVGElement, pose) : null;
      return;
    }
    const shown = this.trying ? tryOnLook(this.look, this.trying) : this.look;
    const d = TownShop.DIRS[this.dir];
    box.innerHTML = GameArt.character({ ...shown, view: d.view, facing: d.facing, pose });
    const svg = box.querySelector("svg");
    this.meCtl = svg ? GameArt.animate(svg as SVGElement, pose) : null;
  }

  /** 轉身：step＝±1，或直接指定 index */
  private turn(step: number, to?: number): void {
    const n = TownShop.DIRS.length;
    this.dir = to ?? (((this.dir + step) % n) + n) % n;
    this.el.querySelectorAll<HTMLElement>(".tshop-dir").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.dir) === this.dir)));
    clearTimeout(this.poseTimer);
    this.drawMe();
  }

  /** 開心一下（試穿、買下、換上） */
  private cheer(): void {
    clearTimeout(this.poseTimer);
    this.drawMe(GameArt.poses.includes("cheer") ? "cheer" : "idle");
    this.poseTimer = window.setTimeout(() => this.drawMe(), 1100);
  }

  private say(line: Line, speak = true): void {
    const b = this.el.querySelector<HTMLElement>(".tshop-say")!;
    const kn = this.place.shop.keeper?.name;
    b.innerHTML = `${kn ? `<span class="tshop-say-name g-tag">${esc(kn)}</span>` : ""}<strong class="tshop-say-en">${esc(line.en)}</strong><span class="tshop-say-zh">${esc(line.zh)}</span>`;
    if (speak) speakEnglish(line.en);
  }

  private priceBadge(it: ShopItem | null): string {
    if (!it) return "";
    return `<span class="tshop-price" aria-hidden="true">${COIN_ICON(14)}${it.price}</span>`;
  }

  private sectionHtml(s: ShopSection): string {
    const O = GameArt.options as unknown as Record<string, string[]>;
    const L = this.look as unknown as Record<string, unknown>;
    if (s.type === "swatch") {
      const vals = O[s.field as string] ?? [];
      return `<div class="tshop-field"><p class="g-t-label">${esc(s.label)}</p><div class="tshop-swatches">${vals
        .map((v) => {
          const c = colorOf(s.src ?? "hue", v);
          if (!c) return "";
          return `<button type="button" class="tshop-swatch" data-set="${s.field}" data-v="${v}" aria-pressed="${L[s.field] === v}" aria-label="${esc(nameOf(v))}" title="${esc(nameOf(v))}" style="background:${c}"></button>`;
        })
        .join("")}</div></div>`;
    }
    if (s.type === "pants") {
      const vals = (O.pantsColor ?? []).filter((v) => v !== "match" && colorOf("hue", v));
      const isMatch = this.look.pantsColor === "match";
      const match = (O.pantsColor ?? []).includes("match")
        ? `<button type="button" class="tshop-match" data-set="pantsColor" data-v="match" aria-pressed="${isMatch}"><i style="background:${colorOf("hue", this.look.outfitColor)}"></i>同衣服</button>`
        : "";
      return `<div class="tshop-field"><p class="g-t-label">${esc(s.label)}</p><div class="tshop-swatches">${match}${vals
        .map(
          (v) =>
            `<button type="button" class="tshop-swatch" data-set="pantsColor" data-v="${v}" aria-pressed="${!isMatch && this.look.pantsColor === v}" aria-label="${esc(nameOf(v))}" title="${esc(nameOf(v))}" style="background:${colorOf("hue", v)}"></button>`
        )
        .join("")}</div></div>`;
    }
    const isAcc = s.type === "acc";
    let vals = O[isAcc ? "accessories" : (s.field as string)] ?? [];
    if (isAcc && s.items) {
      if (s.items === "rest") {
        const used = new Set(this.place.shop.sections.flatMap((x) => (Array.isArray(x.items) ? x.items : [])));
        vals = vals.filter((a) => !used.has(a));
      } else {
        const list = s.items;
        vals = list.filter((a) => vals.includes(a));
      }
    }
    if (isAcc && !talismanUnlocked(this.pid)) vals = vals.filter((a) => a !== "zombieTalisman" || this.look.accessories.includes(a));
    if (!vals.length) return "";
    const mode = s.mode ?? "body";
    const itemArt = s.art === "item";
    return `<div class="tshop-field"><p class="g-t-label">${esc(s.label)}</p><div class="tshop-thumbs${mode === "head" ? " tshop-thumbs--head" : ""}${itemArt ? " tshop-thumbs--item" : ""}">${vals
      .map((v) => {
        const on = isAcc ? this.look.accessories.includes(v) : L[s.field] === v;
        const it = lockedItem(this.pid, isAcc ? "accessories" : (s.field as string), v);
        if (it && this.home) return ""; // 衣櫃只放已擁有（免費或買過）的款式
        const tryingThis = this.trying && it && this.trying.id === it.id;
        const tl = thumbLook(this.look, isAcc ? "accessories" : s.field, v);
        const art = itemArt
          ? GameArt.itemIcon(isAcc ? "accessories" : "held", v) || `<span class="tshop-none">${icon("close", "lg")}</span>`
          : mode === "head"
            ? GameArt.avatar(tl)
            : GameArt.character({ ...tl, view: "front", pose: null });
        const cls = `tshop-thumb${it ? " tshop-thumb--locked" : ""}${tryingThis ? " tshop-thumb--trying" : ""}`;
        const aria = `${nameOf(v)}${it ? `（${it.price} 個代幣，點一下先試穿）` : ""}`;
        return `<button type="button" class="${cls}" ${isAcc ? `data-acc="${v}"` : `data-set="${s.field}" data-v="${v}"`} aria-pressed="${on}" aria-label="${esc(aria)}" title="${esc(nameOf(v))}">${art}<span class="g-t-caption">${esc(nameOf(v))}</span>${this.priceBadge(it)}</button>`;
      })
      .join("")}</div></div>`;
  }

  private recentHtml(): string {
    if (this.home) return "";
    const fields = this.furniture ? new Set(["furniture"]) : new Set(this.place.shop.sections.map((s) => s.field as string));
    const list = recentPurchases(this.pid).filter(({ item }) => fields.has(item.field));
    if (!list.length) return "";
    return `<div class="tshop-recent"><p class="g-t-label">剛買的東西（買後 10 分鐘內可以退回）</p>${list
      .map(
        ({ item, msLeft }) =>
          `<div class="tshop-recent-row"><span class="g-t-body">${esc(this.itemName(item))}</span><span class="g-t-caption">還有 ${Math.max(1, Math.ceil(msLeft / 60000))} 分鐘</span><button type="button" class="gbtn gbtn--quiet tshop-recent-btn" data-refund="${item.id}">${icon("restart", "sm")}退回</button></div>`
      )
      .join("")}</div>`;
  }

  /** 照相館：紀念照（選動作、照片比例、拍照）＋相簿 */
  private photoHtml(): string {
    const P = this.place.shop.photo;
    const T = P?.text;
    const poses = (P?.poses ?? []).filter((x) => GameArt.poses.includes(x));
    const label = (x: string) => GameTokens.motion.poses[x]?.label ?? x;
    const aspects: PhotoAspect[] = ["16:9", "1:1", "4:5"];
    return `<div class="tshop-field">
        <p class="g-t-label">${icon("camera", "sm")} ${esc(T?.portrait ?? "拍紀念照")}</p>
        <p class="g-t-caption tshop-note">${esc(T?.portraitHint ?? "")}</p>
        <div class="studio-poses tshop-poses">${poses.map((x) => `<button type="button" class="studio-pose" data-ppose="${x}" aria-pressed="${this.pPose === x}">${esc(label(x))}</button>`).join("")}</div>
        <div class="tshop-photo-row">
          <div class="studio-seg" role="group" aria-label="照片比例">${aspects.map((a) => `<button type="button" data-paspect="${a}" aria-pressed="${this.pAspect === a}">${a}</button>`).join("")}</div>
          <button type="button" class="gbtn g-h-sun tshop-snap" data-act="portrait"${this.shooting ? " disabled" : ""}>${icon("camera")}${esc(T?.portrait ?? "拍紀念照")}</button>
        </div>
        <p class="g-t-caption tshop-note">${icon("info", "sm")} ${esc(T?.streetHint ?? "")}</p>
      </div>
      <div class="tshop-field"><p class="g-t-label">${icon("image", "sm")} ${esc(T?.album ?? "相簿")}</p>${this.album?.html(T?.empty ?? "還沒有照片") ?? ""}</div>`;
  }

  private async snapPortrait(): Promise<void> {
    if (this.shooting) return;
    const P = this.place.shop.photo;
    this.shooting = true;
    this.render();
    if (P) this.say(P.lines.snap);
    const room = this.el.querySelector<HTMLElement>(".tshop-room");
    await new Promise((r) => setTimeout(r, 900));
    if (room) {
      const f = document.createElement("div");
      f.className = "studio-flash";
      room.appendChild(f);
      requestAnimationFrame(() => f.classList.add("studio-flash--go"));
      window.setTimeout(() => f.remove(), 450);
    }
    playShutter();
    let blob: Blob | null = null;
    try {
      blob = await portraitPhoto(this.look, this.pPose, this.pAspect, P?.scene ?? "studio");
    } catch (err) {
      console.error("紀念照匯出失敗", err);
      toast(`${icon("info")} 這台裝置拍照失敗了`, 2600, "rose");
    }
    this.shooting = false;
    this.render();
    if (!blob || this.closed) return;
    showPhotoPreview(this.pid, blob, { sceneId: P?.scene ?? "studio", time: "day", aspect: this.pAspect }, () => {
      void this.album?.refresh(false);
      if (P) this.say(P.lines.saved, false);
      this.cheer();
    });
  }

  private render(): void {
    this.renderBody();
    if (this.furniture) this.placeKeeper();
  }

  private renderBody(): void {
    const body = this.el.querySelector<HTMLElement>(".tshop-body")!;
    const top = body.scrollTop;
    if (this.home) {
      const tabs = `<div class="tshop-tabs" role="tablist">${[
        ["slots", "user", "我的角色"],
        ["wardrobe", "shirt", "衣櫃"],
        ...(decorateEnabled() ? [["decorate", "home", homeCfg().text.decorateTab ?? "佈置"]] : []),
      ]
        .map(([id, ic, lab]) => `<button type="button" class="tshop-tab" role="tab" data-hometab="${id}" aria-selected="${this.homeTab === id}">${icon(ic)}<span>${lab}</span></button>`)
        .join("")}</div>`;
      body.innerHTML =
        tabs +
        (this.homeTab === "decorate" && decorateEnabled()
          ? this.decorateHtml()
          : this.homeTab === "slots"
          ? this.slotsHtml()
          : `<p class="g-t-caption tshop-note">衣櫃裡是你已經有的款式（免費的和買過的）；新款式要去商店買喔！</p>` + this.place.shop.sections.map((s) => this.sectionHtml(s)).join(""));
    } else if (this.furniture) body.innerHTML = this.storeHtml() + this.recentHtml();
    else if (this.photo) body.innerHTML = this.photoHtml();
    else body.innerHTML = this.place.shop.sections.map((s) => this.sectionHtml(s)).join("") + this.recentHtml();
    body.scrollTop = top;
    // 佈置的時候先把角色藏起來，房間看得比較清楚（拍照時角色會回來）
    this.el.classList.toggle("tshop--decorating", !!this.layout && this.homeTab === "decorate");
    this.el.querySelector(".tshop-coins .g-t-number")!.textContent = String(getTokenBalance(this.pid));
    const bar = this.el.querySelector<HTMLElement>(".tshop-bar")!;
    if (this.furniture && this.tryHome) {
      const hi = homeItem(this.tryHome.item)!;
      const owned = ownsHomeItem(this.pid, hi);
      const placed = this.layout?.slots[this.tryHome.slot] === hi.id;
      const bal = getTokenBalance(this.pid);
      const price = hi.price ?? 0;
      const enough = bal >= price;
      const T = homeCfg().text;
      bar.hidden = false;
      bar.innerHTML = owned
        ? `<p class="g-t-body"><strong>${esc(T.tryOn ?? "試擺中")}：${esc(hi.zh)}</strong>　<span class="g-tag g-h-mint">${esc(T.owned ?? "已擁有")}</span></p>
           <div class="tshop-bar-actions">${placed ? "" : `<button type="button" class="gbtn g-h-mint" data-act="hput">${icon("home")}${esc(T.put ?? "放進我的家")}</button>`}<button type="button" class="gbtn gbtn--quiet" data-act="cancel">不要了</button></div>`
        : `<p class="g-t-body"><strong>${esc(T.tryOn ?? "試擺中")}：${esc(hi.zh)}</strong>　${COIN_ICON(18)}${price}　<span class="g-t-caption">你有 ${bal} 個代幣</span></p>
           ${enough ? "" : `<p class="g-t-caption">再多 ${price - bal} 個代幣就能買囉！認真學習就能賺代幣。</p>`}
           <div class="tshop-bar-actions"><button type="button" class="gbtn g-h-sun" data-act="hbuy"${enough ? "" : " disabled"}>${COIN_ICON(22)}買下來</button><button type="button" class="gbtn gbtn--quiet" data-act="cancel">不要了</button></div>`;
    } else if (this.trying) {
      const it = this.trying;
      const bal = getTokenBalance(this.pid);
      const enough = bal >= it.price;
      bar.hidden = false;
      bar.innerHTML = `
        <p class="g-t-body"><strong>試穿中：${esc(nameOf(it.value))}</strong>　${COIN_ICON(18)}${it.price}　<span class="g-t-caption">你有 ${bal} 個代幣</span></p>
        ${enough ? "" : `<p class="g-t-caption">再多 ${it.price - bal} 個代幣就能買囉！認真學習就能賺代幣。</p>`}
        <div class="tshop-bar-actions">
          <button type="button" class="gbtn g-h-sun" data-act="buy"${enough ? "" : " disabled"}>${COIN_ICON(22)}買下來</button>
          <button type="button" class="gbtn gbtn--quiet" data-act="cancel">不要了</button>
        </div>`;
    } else {
      bar.hidden = true;
      bar.innerHTML = "";
    }
    const revert = this.el.querySelector<HTMLButtonElement>(".tshop-revert")!;
    revert.disabled = sameLook(this.look, this.entry) && (!this.layout || JSON.stringify(this.layout.slots) === this.layoutEntry);
    revert.style.display = this.furniture ? "none" : ""; // 家具店不換造型，不需要還原
  }

  // ---- 我的家：佈置（docs/plan-town-home-furniture.md；固定位置換款式） ----
  private drawRoom(): void {
    if (!this.layout) return;
    const lay = this.tryHome ? { ...this.layout, slots: { ...this.layout.slots, [this.tryHome.slot]: this.tryHome.item } } : this.layout;
    const r = renderRoom(lay, { look: this.look, night: this.night, interactive: !this.furniture && decorateEnabled(), showEmpty: this.homeTab === "decorate", highlight: this.hlSlot });
    const room = this.el.querySelector<HTMLElement>(".tshop-room");
    const floor = this.el.querySelector<HTMLElement>(".tshop-floor");
    if (room) room.style.background = r.wall;
    if (floor) floor.style.background = r.floor;
    const box = this.el.querySelector<HTMLElement>(".home-decor");
    if (box) box.innerHTML = r.html;
  }

  /** 目前類別要換的位置（掛畫、擺飾、玩具有好幾個位置） */
  private curSlot(): string {
    const ss = slotsOf(this.decoCat);
    if (!ss.some((x) => x.id === this.decoSlot)) this.decoSlot = ss[0]?.id ?? this.decoCat;
    return this.decoSlot;
  }

  private itemArt(it: HomeItem): string {
    if (it.none) return `<span class="tshop-none">${icon("close", "lg")}</span>`;
    if (it.color) return `<span class="home-swatch" style="background:${it.tone === "base" ? `var(--g-${it.color})` : `var(--g-${it.color}-${it.tone ?? "soft"})`}"></span>`;
    if (it.sky || it.scene) {
      if (it.scene) {
        try {
          return `<span class="home-view-thumb">${GameArt.scene(it.scene, 160, 90, { time: this.night ? "night" : "day" })}</span>`;
        } catch {
          return "";
        }
      }
      const K = GameArt.skyAt("forest", this.night ? 0.75 : 0.25) as { top: string; bottom: string };
      return `<span class="home-view-thumb" style="background:linear-gradient(${K.top},${K.bottom})"></span>`;
    }
    if (it.portrait) return `<span class="home-thumb-portrait"><span class="home-portrait">${GameArt.avatar(this.look)}</span>${(() => { try { return GameArt.prop("homeFrame"); } catch { return ""; } })()}</span>`;
    if (it.prop) {
      try {
        return GameArt.prop(it.prop, it.state ? { state: it.state } : {});
      } catch {
        return "";
      }
    }
    return "";
  }

  private decorateHtml(): string {
    const C = homeCfg();
    const L = this.layout!;
    const cats = C.categories.filter((c) => slotsOf(c.id).length);
    const slotId = this.curSlot();
    const slots = slotsOf(this.decoCat);
    const owned = itemsOf(this.decoCat).filter((it) => ownsHomeItem(this.pid, it));
    const cur = L.slots[slotId];
    const needShelf = this.decoCat === "smalldeco" && !!homeItem(L.slots.shelf)?.none;
    return `<div class="home-cats" role="tablist" aria-label="家具類別">${cats
      .map((c) => `<button type="button" class="home-cat" role="tab" data-hcat="${c.id}" aria-selected="${c.id === this.decoCat}">${esc(c.zh)}</button>`)
      .join("")}</div>
      ${
        slots.length > 1
          ? `<div class="tshop-field"><p class="g-t-label">${esc(C.text.slotPick ?? "放在哪裡？")}</p><div class="studio-seg home-slotpick" role="group">${slots
              .map((x) => `<button type="button" data-hslotpick="${x.id}" aria-pressed="${x.id === slotId}">${esc(x.label ?? x.id)}</button>`)
              .join("")}</div></div>`
          : ""
      }
      ${needShelf ? `<div class="home-need"><p class="g-t-body">${esc(C.text.needShelf ?? "先放一個置物架")}</p><button type="button" class="gbtn g-h-sky" data-hcat="shelf">${esc(categoryOf("shelf")?.zh ?? "置物架")}</button></div>` : ""}
      <div class="tshop-field"${needShelf ? " hidden" : ""}><p class="g-t-label">${esc(categoryOf(this.decoCat)?.zh ?? "")} <span class="home-cat-en">${esc(categoryOf(this.decoCat)?.en ?? "")}</span></p>
      <div class="tshop-thumbs home-items">${owned
        .map(
          (it) =>
            `<button type="button" class="tshop-thumb home-item" data-hitem="${it.id}" aria-pressed="${cur === it.id}" aria-label="${esc(it.zh)}" title="${esc(it.zh)}">${this.itemArt(it)}<span class="g-t-caption">${esc(it.zh)}</span></button>`
        )
        .join("")}</div></div>
      <p class="g-t-caption tshop-note">${icon("info", "sm")} ${esc(C.text.hint ?? "")}</p>
      ${storeEnabled() ? `<p class="g-t-caption tshop-note">${icon("sparkle", "sm")} ${esc(C.text.more ?? "")}</p>` : ""}`;
  }

  /** 點房間裡的東西：跳到那個類別、那個位置，念出英文 */
  private pickRoomSlot(slotId: string): void {
    const sl = homeCfg().slots.find((x) => x.id === slotId);
    if (!sl) return;
    this.homeTab = "decorate";
    this.decoCat = sl.cat;
    this.decoSlot = sl.id;
    // 只念家具類別的英文（不念單一款式、不跳說話泡泡；2026-11-06 使用者要求）
    const cat = categoryOf(sl.cat);
    if (cat) speakEnglish(cat.en);
    this.flash(sl.id);
    this.render();
  }

  private flash(slotId: string): void {
    this.hlSlot = slotId;
    this.drawRoom();
    clearTimeout(this.hlTimer);
    this.hlTimer = window.setTimeout(() => {
      this.hlSlot = null;
      this.drawRoom();
    }, 900);
  }

  private applyHomeItem(itemId: string): void {
    if (!this.layout) return;
    const slotId = this.curSlot();
    if (this.layout.slots[slotId] === itemId) return;
    this.layout = setHomeSlot(this.pid, this.layout, slotId, itemId);
    this.flash(slotId);
    this.cheer();
    this.render();
  }

  // ---- 家具店（第 2 階段；docs/plan-town-home-furniture.md §4.2） ----
  private itemName(it: ShopItem): string {
    return it.field === "furniture" ? homeItem(it.value)?.zh ?? it.value : nameOf(it.value);
  }

  private storeCats(): string[] {
    return homeCfg().categories.map((c) => c.id).filter((c) => itemsOf(c).some((i) => i.price));
  }

  /** 家具店：店長站到不擋住目前這一類家具的位置（只看放在地上的位置；牆上、天花板的不會被擋到） */
  private placeKeeper(): void {
    const me = this.el.querySelector<HTMLElement>(".tshop-me");
    if (!me || !this.furniture) return;
    const low = slotsOf(this.storeCat).filter((s) => s.bottom != null && s.bottom < 50);
    const HALF = 13;
    let best = 62;
    let bestCost = Infinity;
    for (const c of [62, 82, 40, 22]) {
      const cost = low.reduce((n, s) => n + Math.max(0, Math.min(c + HALF, (s.left ?? 0) + (s.width ?? 10)) - Math.max(c - HALF, s.left ?? 0)), 0);
      if (cost < bestCost) {
        bestCost = cost;
        best = c;
      }
    }
    me.style.left = `${best}%`;
  }

  private storeHtml(): string {
    const C = homeCfg();
    const cats = this.storeCats();
    if (!cats.includes(this.storeCat)) this.storeCat = cats[0] ?? "";
    const items = itemsOf(this.storeCat).filter((i) => i.price);
    const themes = (C as unknown as { themes?: Record<string, string> }).themes ?? {};
    return `<div class="home-cats" role="tablist" aria-label="家具類別">${cats
      .map((c) => `<button type="button" class="home-cat" role="tab" data-scat="${c}" aria-selected="${c === this.storeCat}">${esc(categoryOf(c)?.zh ?? c)}</button>`)
      .join("")}</div>
      <div class="tshop-field"><p class="g-t-label">${esc(categoryOf(this.storeCat)?.zh ?? "")} <span class="home-cat-en">${esc(categoryOf(this.storeCat)?.en ?? "")}</span></p>
      <div class="tshop-thumbs home-items">${items
        .map((it) => {
          const owned = ownsHomeItem(this.pid, it);
          const trying = this.tryHome?.item === it.id;
          return `<button type="button" class="tshop-thumb home-item${owned ? "" : " tshop-thumb--locked"}${trying ? " tshop-thumb--trying" : ""}" data-sitem="${it.id}" aria-pressed="${trying}" aria-label="${esc(`${it.zh}${owned ? "（已擁有）" : `（${it.price} 個代幣）`}`)}">${this.itemArt(it)}<span class="g-t-caption">${esc(it.zh)}</span>${
            it.theme && themes[it.theme] ? `<span class="home-theme">${esc(themes[it.theme])}</span>` : ""
          }${owned ? `<span class="tshop-price home-owned">${icon("check", "sm")}</span>` : `<span class="tshop-price" aria-hidden="true">${COIN_ICON(14)}${it.price}</span>`}</button>`;
        })
        .join("")}</div></div>
      <p class="g-t-caption tshop-note">${icon("info", "sm")} ${esc(C.text.storeHint ?? "")}</p>`;
  }

  private storeLine(k: "tryOn" | "buy" | "put"): Line {
    const L = (homeCfg() as unknown as { storeLines?: Record<string, Line> }).storeLines;
    return L?.[k] ?? this.lines.buy;
  }

  /** 家具店：點一款 → 先擺進房間預覽（不扣代幣） */
  private tryFurniture(itemId: string): void {
    const it = homeItem(itemId);
    const slot = it ? slotsOf(it.cat)[0]?.id : undefined;
    if (!it || !slot) return;
    if (this.tryHome?.item === itemId) return;
    this.tryHome = { slot, item: itemId };
    if (!ownsHomeItem(this.pid, it)) this.say(this.storeLine("tryOn"), false);
    this.flash(slot);
    this.cheer();
    this.render();
  }

  private putFurniture(): void {
    if (!this.tryHome || !this.layout) return;
    this.layout = setHomeSlot(this.pid, this.layout, this.tryHome.slot, this.tryHome.item);
    this.say(this.storeLine("put"), false);
    this.tryHome = null;
    this.drawRoom();
    this.cheer();
    this.render();
  }

  private async buyFurniture(): Promise<void> {
    const tr = this.tryHome;
    const hi = tr ? homeItem(tr.item) : undefined;
    const si = hi ? shopItems().find((x) => x.field === "furniture" && x.value === hi.id) : undefined;
    if (!tr || !hi || !si) return;
    const ok = await confirmDialog({ iconId: "coin", text: `確定用 ${si.price} 個代幣買「${hi.zh}」嗎？`, yes: "確定購買", no: "再想想", hue: "sun" });
    if (!ok || this.closed || this.tryHome?.item !== hi.id) return;
    const r = purchase(this.pid, si);
    if (!r.ok && r.reason === "tokens") {
      this.say(this.lines.needMore);
      toast(`${COIN_ICON(22)} 再多 ${r.need} 個代幣就能買囉！`, 2400, "sky");
      return this.render();
    }
    this.say(this.storeLine("buy"));
    this.cheer();
    toast(`${icon("sparkle")} 買到「${esc(hi.zh)}」了！10 分鐘內可以退回`, 2800, "mint");
    this.render();
    const put = await confirmDialog({ iconId: "home", text: homeCfg().text.putAsk ?? "要放進我的家嗎？", yes: "好", no: "先不要", hue: "mint" });
    if (this.closed) return;
    if (put) this.putFurniture();
  }

  /** 我的家拍照：房間＋角色（開心的動作、目前的方向）組成正方形照片，存相簿流程同照相館 */
  private async snapHome(): Promise<void> {
    if (!this.layout || this.shooting) return;
    this.shooting = true;
    const wasDecorating = this.homeTab === "decorate";
    if (wasDecorating) this.el.classList.remove("tshop--decorating");
    // 在家玩：相機已經倒數過，照角色現在的位置、方向、動作直接拍（躺床、坐地上也拍得到）
    const ps = this.play?.active ? this.play.photoState() : null;
    if (!ps) {
      this.say({ en: "Say cheese!", zh: "笑一個！" });
      this.drawMe("cheer");
      await new Promise((r) => setTimeout(r, 900));
    }
    const room = this.el.querySelector<HTMLElement>(".tshop-room");
    if (room) {
      const f = document.createElement("div");
      f.className = "studio-flash";
      room.appendChild(f);
      requestAnimationFrame(() => f.classList.add("studio-flash--go"));
      window.setTimeout(() => f.remove(), 450);
    }
    playShutter();
    const d = TownShop.DIRS[this.dir];
    const cs = getComputedStyle(this.el);
    let blob: Blob | null = null;
    try {
      const svg = composeRoomSvg(this.layout, {
        look: this.look,
        pose: ps ? ps.pose : GameArt.poses.includes("cheer") ? "cheer" : "idle",
        view: ps ? ps.view : d.view,
        facing: ps ? ps.facing : d.facing,
        night: this.night,
        size: 1080,
        resolve: (v) => cs.getPropertyValue(v).trim() || "#cccccc",
        me: ps ? { x: ps.x, eyes: ps.eyes, lie: ps.lie } : undefined,
      });
      blob = await new Promise<Blob | null>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = 1080;
          c.height = 1080;
          c.getContext("2d")!.drawImage(img, 0, 0, 1080, 1080);
          c.toBlob((b) => resolve(b), "image/png");
        };
        img.onerror = () => reject(new Error("房間照片載入失敗"));
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      });
    } catch (err) {
      console.error("我的家拍照失敗", err);
      toast(`${icon("info")} 這台裝置拍照失敗了`, 2600, "rose");
    }
    this.shooting = false;
    if (this.closed) return;
    this.drawMe();
    if (wasDecorating) this.render();
    if (!blob) return;
    showPhotoPreview(this.pid, blob, { sceneId: "home", time: this.night ? "night" : "day", aspect: "1:1" }, () => this.cheer());
  }

  // ---- 我的家：角色槽（3 個；第 1 個不能刪；規則同角色工作室） ----
  private data(): CharacterData {
    let d = loadCharacter(this.pid);
    if (!d) {
      d = createInitial();
      d.slots[0].look = this.look;
      saveCharacter(this.pid, d);
    }
    return d;
  }

  private activeName(): string {
    const d = loadCharacter(this.pid);
    return d?.slots[d.activeSlot]?.name ?? DEFAULT_NAME;
  }

  private slotsHtml(): string {
    const d = this.data();
    let h = `<div class="tshop-slots">`;
    for (let pos = 0; pos < MAX_SLOTS; pos++) {
      const idx = slotIndexAt(d, pos);
      const sl = idx >= 0 ? d.slots[idx] : null;
      if (!sl) {
        h += `<button type="button" class="tshop-slot tshop-slot--empty" data-newslot="${pos}" aria-label="新增角色 ${pos + 1}">${icon("plus", "lg")}<span class="g-t-caption">新角色</span></button>`;
        continue;
      }
      const on = idx === d.activeSlot;
      const lk = sanitizeLook(this.pid, sl.look).look;
      h += `<div class="tshop-slot${on ? " tshop-slot--on" : ""}">
        <button type="button" class="tshop-slot-pick" data-slot="${idx}" aria-pressed="${on}" aria-label="角色 ${pos + 1}：${esc(sl.name)}">${GameArt.character({ ...lk, view: "front", pose: null })}</button>
        <button type="button" class="tshop-slot-name" data-rename="${idx}" aria-label="幫「${esc(sl.name)}」改名字">${esc(sl.name)}${icon("edit", "sm")}</button>
        ${on ? `<span class="g-tag tshop-slot-tag">使用中</span>` : ""}
        ${pos > 0 ? `<button type="button" class="tshop-slot-del" data-delslot="${idx}" aria-label="刪除「${esc(sl.name)}」">${icon("trash", "sm")}</button>` : ""}
      </div>`;
    }
    return h + `</div><p class="g-t-caption tshop-note">點角色就換成這個角色；點名字可以改名（最多 ${NAME_MAX} 個字）。</p>`;
  }

  /** 換成第 i 個角色：預覽、還原基準都換成那個角色 */
  private useSlotLook(d: CharacterData): void {
    const sl = d.slots[d.activeSlot];
    this.trying = null;
    this.look = sanitizeLook(this.pid, sl.look).look;
    this.entry = this.look;
    saveActiveLook(this.pid, this.look); // 跟工作室一樣：切換＝存一次（造型師紀錄、第一次存檔獎勵）
    this.drawMe();
    if (this.home) this.drawRoom();
    this.cheer();
  }

  private switchSlot(i: number): void {
    const d = this.data();
    if (i === d.activeSlot || !d.slots[i]) return;
    d.activeSlot = i;
    saveCharacter(this.pid, d);
    this.useSlotLook(d);
    this.render();
  }

  private async createSlot(pos: number): Promise<void> {
    const d = this.data();
    if (slotIndexAt(d, pos) >= 0 || d.slots.length >= MAX_SLOTS) return;
    const ok = await confirmDialog({ iconId: "plus", text: "做一個新角色？", yes: "好", hue: "mint" });
    if (!ok || this.closed) return;
    const ns = newSlot(GameArt.randomLook(), [...`${DEFAULT_NAME}${pos + 1}`].slice(0, NAME_MAX).join(""));
    if (!validateName(ns.name).ok) ns.name = DEFAULT_NAME;
    ns.look = sanitizeLook(this.pid, ns.look).look;
    ns.pos = pos;
    d.slots.push(ns);
    d.activeSlot = d.slots.length - 1;
    saveCharacter(this.pid, d);
    this.useSlotLook(d);
    this.render();
    toast(`${icon("sparkle")} 新角色來了！去衣櫃幫他打扮吧`, 2400, "mint");
  }

  private async deleteSlot(i: number): Promise<void> {
    const d = this.data();
    const target = d.slots[i];
    if (!target || (target.pos ?? i) === 0) return;
    const ok = await confirmDialog({ iconId: "trash", text: `刪掉「${esc(target.name)}」？`, yes: "刪除", no: "取消" });
    if (!ok || this.closed) return;
    const activeId = d.slots[d.activeSlot]?.id;
    const wasActive = i === d.activeSlot;
    d.slots.splice(i, 1);
    if (wasActive) {
      const first = slotIndexAt(d, 0);
      d.activeSlot = first >= 0 ? first : 0;
    } else d.activeSlot = Math.max(0, d.slots.findIndex((x) => x.id === activeId));
    saveCharacter(this.pid, d);
    if (wasActive) this.useSlotLook(d);
    this.render();
    toast(`${icon("check")} 刪好了`, 1600, "mint");
  }

  /** 行內改名：Enter／離開輸入框存檔、Esc 取消 */
  private startRename(anchor: HTMLElement, idx: number): void {
    const d = this.data();
    const target = d.slots[idx];
    if (!target) return;
    const input = document.createElement("input");
    input.className = "tshop-rename";
    input.value = target.name;
    input.maxLength = NAME_MAX * 2;
    input.setAttribute("aria-label", "角色名稱");
    input.setAttribute("enterkeyhint", "done");
    let done = false;
    const commit = (save: boolean) => {
      if (done) return;
      done = true;
      if (save) {
        const r = validateName(input.value);
        if (!r.ok) toast(`${icon("info")} ${r.reason}，名字沒有改`, 2200, "rose");
        else if (r.name !== target.name) {
          const d2 = this.data();
          const t2 = d2.slots.find((x) => x.id === target.id);
          if (t2) {
            t2.name = r.name;
            t2.updatedAt = Date.now();
            saveCharacter(this.pid, d2);
          }
        }
      }
      this.render();
    };
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
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
    anchor.replaceWith(input);
    input.focus();
    input.select();
  }

  // ---- 操作 ----
  private apply(next: Look): void {
    this.trying = null;
    if (sameLook(next, this.look)) return this.render();
    this.look = next;
    const r = saveActiveLook(this.pid, this.look);
    if (r.firstReward) toast(`${COIN_ICON(22)} 第一次存好角色，送你 ${r.firstReward} 個代幣！`, 2600);
    for (const n of r.newBadges) toast(`${icon("trophy")} 獲得新徽章：${esc(n)}`, 3200, "lilac");
    this.drawMe();
    if (this.home) this.drawRoom(); // 自畫像跟著換
    this.render();
  }

  private startTry(it: ShopItem): void {
    if (this.trying?.id === it.id) return;
    this.trying = it;
    this.say(this.lines.tryOn);
    this.cheer();
    this.render();
  }

  private async buy(): Promise<void> {
    const it = this.trying;
    if (!it) return;
    const ok = await confirmDialog({ iconId: "coin", text: `確定用 ${it.price} 個代幣買「${nameOf(it.value)}」嗎？`, yes: "確定購買", no: "再想想", hue: "sun" });
    if (!ok || this.closed || this.trying?.id !== it.id) return;
    const r = purchase(this.pid, it);
    if (!r.ok && r.reason === "tokens") {
      this.say(this.lines.needMore);
      toast(`${COIN_ICON(22)} 再多 ${r.need} 個代幣就能買囉！`, 2400, "sky");
      return this.render();
    }
    const next = tryOnLook(this.look, it);
    this.apply(next);
    this.say(this.lines.buy);
    this.cheer();
    toast(`${icon("sparkle")} 買到「${esc(nameOf(it.value))}」了！10 分鐘內可以退回`, 2800, "mint");
  }

  private async refundItem(id: string): Promise<void> {
    const it = shopItems().find((x) => x.id === id);
    if (!it) return;
    const ok = await confirmDialog({ iconId: "restart", text: `要退回「${this.itemName(it)}」嗎？${it.price} 個代幣會還給你。`, yes: "退回", no: "不要", hue: "sky" });
    if (!ok || this.closed) return;
    if (!refund(this.pid, it)) {
      toast(`${icon("info")} 已經超過可以退回的時間了`, 2400, "rose");
      return this.render();
    }
    if (it.field === "furniture") {
      // 家裡用到的家具換回預設（loadHome 會檢查擁有）
      this.layout = loadHome(this.pid);
      this.tryHome = null;
      this.drawRoom();
    } else
      // 身上用到的換回預設值（其他角色槽在下次讀取時由 getActiveLook／sanitizeLook 處理）
      this.apply(sanitizeLook(this.pid, this.look).look);
    toast(`${icon("restart")} 已退回，${it.price} 個代幣還給你了`, 2400, "sky");
    this.render();
  }

  private onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (!t || this.closed) return;
    if (t.dataset.turn) return this.turn(Number(t.dataset.turn));
    if (t.dataset.hometab) {
      this.homeTab = t.dataset.hometab as "slots" | "wardrobe" | "decorate";
      this.drawRoom(); // 空位的虛線框只在佈置分頁出現
      return this.render();
    }
    if (t.dataset.hslot) return this.pickRoomSlot(t.dataset.hslot);
    if (t.dataset.hcat) {
      this.decoCat = t.dataset.hcat;
      this.decoSlot = "";
      const cat = categoryOf(this.decoCat);
      if (cat) speakEnglish(cat.en);
      this.flash(this.curSlot());
      return this.render();
    }
    if (t.dataset.hslotpick) {
      this.decoSlot = t.dataset.hslotpick;
      this.flash(this.decoSlot);
      return this.render();
    }
    if (t.dataset.hitem) return this.applyHomeItem(t.dataset.hitem);
    if (t.dataset.scat) {
      this.storeCat = t.dataset.scat;
      const cat = categoryOf(this.storeCat);
      if (cat) speakEnglish(cat.en);
      return this.render();
    }
    if (t.dataset.sitem) return this.tryFurniture(t.dataset.sitem);
    if (t.dataset.slot) return this.switchSlot(Number(t.dataset.slot));
    if (t.dataset.newslot) return void this.createSlot(Number(t.dataset.newslot));
    if (t.dataset.delslot) return void this.deleteSlot(Number(t.dataset.delslot));
    if (t.dataset.rename) return this.startRename(t, Number(t.dataset.rename));
    if (t.dataset.dir) return this.turn(0, Number(t.dataset.dir));
    if (this.photo) {
      if (t.dataset.ppose) {
        this.pPose = t.dataset.ppose;
        this.drawMe();
        return this.render();
      }
      if (t.dataset.paspect) {
        this.pAspect = t.dataset.paspect as PhotoAspect;
        return this.render();
      }
      if (t.dataset.act === "portrait") return void this.snapPortrait();
      if (this.album?.onClick(t)) return;
    }
    const act = t.dataset.act;
    if (act === "leave") return void this.close();
    if (act === "homephoto") return void this.snapHome();
    if (act === "play") return this.startPlay();
    if (act === "hbuy") return void this.buyFurniture();
    if (act === "hput") return this.putFurniture();
    if (act === "revert") {
      if (this.layout && JSON.stringify(this.layout.slots) !== this.layoutEntry) {
        const back = JSON.parse(this.layoutEntry) as Record<string, string>;
        for (const [k, v] of Object.entries(back)) this.layout = setHomeSlot(this.pid, this.layout, k, v);
        this.drawRoom();
      }
      return this.apply(this.entry);
    }
    if (act === "buy") return void this.buy();
    if (act === "cancel") {
      this.trying = null;
      if (this.tryHome) {
        this.tryHome = null;
        this.drawRoom();
      }
      this.drawMe();
      return this.render();
    }
    if (t.dataset.refund) return void this.refundItem(t.dataset.refund);
    if (t.dataset.acc) {
      const a = t.dataset.acc;
      const it = lockedItem(this.pid, "accessories", a);
      if (it && !this.look.accessories.includes(a)) return this.startTry(it);
      this.apply(toggleAccessory(this.look, a));
      if (!this.look.accessories.includes(a)) return; // 拿掉不用稱讚
      this.say(this.lines.wear, false);
      return this.cheer();
    }
    if (t.dataset.set && t.dataset.v) {
      const key = t.dataset.set as LookKey;
      const v = t.dataset.v;
      const it = lockedItem(this.pid, key, v);
      if (it) return this.startTry(it);
      this.apply(setField(this.look, key, v));
      this.say(this.lines.wear, false);
      this.cheer();
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.trying = null;
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
    this.play?.stop();
    clearTimeout(this.poseTimer);
    clearTimeout(this.hlTimer);
    this.say(this.place.shop.lines?.bye ?? this.lines.bye);
    this.el.classList.add("tshop--leaving");
    await new Promise((r) => setTimeout(r, 380));
    this.meCtl?.stop();
    this.keeperCtl?.stop();
    this.album?.destroy();
    this.el.remove();
    this.onClose(this.look, this.home ? this.activeName() : undefined);
  }
}
