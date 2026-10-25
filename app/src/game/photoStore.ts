// 相簿：照片存在這台設備的 IndexedDB（PNG blob＋縮圖＋metadata），並同步到區網電腦（2026-10-20 起）。
// - 拍好存相簿 → 先存本機，再上傳 PUT /api/photos/<profileId>/<id>（成功後 storage 改成 'server'）。
// - 開相簿時 syncPhotos()：補傳還沒上傳的、下載別台拍的、照電腦上的刪除紀錄刪掉本機的。
// - 刪除 → 本機刪掉並通知電腦（電腦留 tombstone，別台同步時跟著刪）；連不上時記在本機待刪清單，下次同步再送。
// - 單檔版／npm run dev／file:// 沒有電腦可以同步，照舊只存本機。
// 每位使用者上限 MAX_PHOTOS 張，超過要先刪舊的。

import { serverSyncEnabled } from "../storage";

export const MAX_PHOTOS = 50;

export interface PhotoMeta {
  id: string;
  profileId: string;
  slot: number;
  /** 拍照時的角色 id（角色被刪除後，相簿以「已刪除的角色」帶過） */
  slotId?: string;
  sceneId: string;
  time: "day" | "night";
  aspect: "16:9" | "1:1" | "4:5";
  createdAt: number;
  storage: "local" | "server";
  width: number;
  height: number;
}

export interface PhotoRecord extends PhotoMeta {
  blob: Blob;
  thumb: Blob;
}

const DB_NAME = "englishForKids.photos";
const STORE = "photos";

let dbPromise: Promise<IDBDatabase> | null = null;

export function photosSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const st = db.createObjectStore(STORE, { keyPath: "id" });
        st.createIndex("profileId", "profileId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (st: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

/** 這個使用者的照片（新的在前，不含原圖 blob 以外的欄位都在） */
export async function listPhotos(profileId: string): Promise<PhotoRecord[]> {
  const all = await tx<PhotoRecord[]>("readonly", (st) => st.index("profileId").getAll(profileId));
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function countPhotos(profileId: string): Promise<number> {
  return tx<number>("readonly", (st) => st.index("profileId").count(profileId));
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  return tx<PhotoRecord | undefined>("readonly", (st) => st.get(id));
}

export async function deletePhoto(id: string): Promise<void> {
  const rec = await getPhoto(id).catch(() => undefined);
  await tx("readwrite", (st) => st.delete(id));
  if (rec && serverSyncEnabled()) {
    if (!(await remoteDelete(rec.profileId, id))) queueDelete(rec.profileId, id);
  }
}

export async function addPhoto(meta: Omit<PhotoMeta, "id" | "storage">, blob: Blob): Promise<PhotoRecord> {
  const n = await countPhotos(meta.profileId);
  if (n >= MAX_PHOTOS) throw new Error("PHOTO_LIMIT");
  const thumb = await makeThumb(blob, 360);
  const rec: PhotoRecord = {
    ...meta,
    id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    storage: "local",
    blob,
    thumb,
  };
  await tx("readwrite", (st) => st.put(rec));
  // 背景上傳到電腦（失敗沒關係，下次開相簿時 syncPhotos 會補傳）
  if (serverSyncEnabled()) void uploadPhoto(rec).catch(() => false);
  return rec;
}

// ---- 同步到區網電腦 ----

const PENDING_DELETES_KEY = "englishForKids.photoSync.pendingDeletes.v1"; // 只存本機（不在同步清單）
const LIST_TIMEOUT_MS = 8000;
const FILE_TIMEOUT_MS = 30000;

async function timedFetch(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

function photoUrl(profileId: string, id?: string, png = false): string {
  return `/api/photos/${encodeURIComponent(profileId)}${id ? `/${encodeURIComponent(id)}${png ? ".png" : ""}` : ""}`;
}

interface PendingDelete {
  profileId: string;
  id: string;
}
function readPendingDeletes(): PendingDelete[] {
  try {
    const v = JSON.parse(localStorage.getItem(PENDING_DELETES_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.profileId === "string" && typeof x.id === "string") : [];
  } catch {
    return [];
  }
}
function writePendingDeletes(list: PendingDelete[]): void {
  try {
    localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(list));
  } catch {
    // 存不進去就算了（下次同步時電腦上的照片會再下載回來）
  }
}
function queueDelete(profileId: string, id: string): void {
  const list = readPendingDeletes();
  if (!list.some((x) => x.profileId === profileId && x.id === id)) list.push({ profileId, id });
  writePendingDeletes(list);
}

async function remoteDelete(profileId: string, id: string): Promise<boolean> {
  try {
    const res = await timedFetch(photoUrl(profileId, id), { method: "DELETE" }, LIST_TIMEOUT_MS);
    return res.ok;
  } catch {
    return false;
  }
}

/** 上傳一張；成功（或電腦說這張已經被刪掉）回 true */
async function uploadPhoto(rec: PhotoRecord): Promise<boolean> {
  const meta = {
    slot: rec.slot,
    slotId: rec.slotId,
    sceneId: rec.sceneId,
    time: rec.time,
    aspect: rec.aspect,
    createdAt: rec.createdAt,
    width: rec.width,
    height: rec.height,
  };
  let res: Response;
  try {
    res = await timedFetch(
      photoUrl(rec.profileId, rec.id),
      { method: "PUT", headers: { "Content-Type": "image/png", "X-Photo-Meta": encodeURIComponent(JSON.stringify(meta)) }, body: rec.blob },
      FILE_TIMEOUT_MS
    );
  } catch {
    return false;
  }
  if (res.ok) {
    const cur = await getPhoto(rec.id).catch(() => undefined);
    if (cur) await tx("readwrite", (st) => st.put({ ...cur, storage: "server" }));
    return true;
  }
  if (res.status === 409) {
    // 別台已經刪掉這張：本機也刪
    await tx("readwrite", (st) => st.delete(rec.id));
    return true;
  }
  return false;
}

interface ServerPhoto extends Partial<PhotoMeta> {
  id: string;
  deleted?: boolean;
}

const syncing = new Map<string, Promise<boolean>>();

/** 跟電腦同步這個使用者的相簿；本機有變（下載了、刪掉了）回 true。同一個使用者同時只跑一次 */
export function syncPhotos(profileId: string): Promise<boolean> {
  if (!photosSupported() || !serverSyncEnabled()) return Promise.resolve(false);
  const running = syncing.get(profileId);
  if (running) return running;
  const job = doSync(profileId).finally(() => syncing.delete(profileId));
  syncing.set(profileId, job);
  return job;
}

async function doSync(profileId: string): Promise<boolean> {
  let changed = false;
  // 1) 補送離線時的刪除
  const pending = readPendingDeletes();
  const still: PendingDelete[] = [];
  for (const d of pending) {
    if (d.profileId !== profileId) still.push(d);
    else if (!(await remoteDelete(d.profileId, d.id))) still.push(d);
  }
  if (still.length !== pending.length) writePendingDeletes(still);
  const waitingDelete = new Set(still.filter((d) => d.profileId === profileId).map((d) => d.id));
  // 2) 電腦上的清單
  let remote: ServerPhoto[];
  try {
    const res = await timedFetch(photoUrl(profileId), {}, LIST_TIMEOUT_MS);
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("application/json")) return false;
    const body = (await res.json()) as { photos?: ServerPhoto[] };
    remote = Array.isArray(body.photos) ? body.photos : [];
  } catch {
    return false;
  }
  const byId = new Map(remote.map((p) => [p.id, p]));
  const local = await listPhotos(profileId);
  const localIds = new Set(local.map((p) => p.id));
  // 3) 電腦上已刪除的 → 本機也刪
  for (const p of local) {
    if (byId.get(p.id)?.deleted) {
      await tx("readwrite", (st) => st.delete(p.id));
      localIds.delete(p.id);
      changed = true;
    }
  }
  // 4) 本機有、電腦沒有 → 上傳（舊照片第一次同步、上次上傳失敗）
  for (const p of local) {
    if (!localIds.has(p.id) || byId.has(p.id)) continue;
    const ok = await uploadPhoto(p);
    if (ok && !(await getPhoto(p.id).catch(() => undefined))) changed = true;
  }
  // 5) 電腦有、本機沒有 → 下載（別台拍的）
  for (const r of remote) {
    if (r.deleted || localIds.has(r.id) || waitingDelete.has(r.id) || typeof r.createdAt !== "number") continue;
    try {
      const res = await timedFetch(photoUrl(profileId, r.id, true), {}, FILE_TIMEOUT_MS);
      if (!res.ok) continue;
      const blob = await res.blob();
      const png = blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
      const thumb = await makeThumb(png, 360);
      const rec: PhotoRecord = {
        id: r.id,
        profileId,
        slot: r.slot ?? 0,
        slotId: r.slotId,
        sceneId: r.sceneId ?? "forest",
        time: r.time === "night" ? "night" : "day",
        aspect: r.aspect ?? "16:9",
        createdAt: r.createdAt,
        storage: "server",
        width: r.width ?? 0,
        height: r.height ?? 0,
        blob: png,
        thumb,
      };
      await tx("readwrite", (st) => st.put(rec));
      changed = true;
    } catch {
      // 這張下次再試
    }
  }
  return changed;
}

function makeThumb(blob: Blob, maxW: number): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.naturalWidth);
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => resolve(b ?? blob), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
}

/** 下載檔名：photo-YYYYMMDD-HHMM.png */
export function photoFileName(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `photo-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.png`;
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** 有支援 Web Share（含檔案）的裝置才顯示分享鈕；區網 http 多半不支援 */
export function canShareFiles(): boolean {
  try {
    const f = new File([new Blob()], "x.png", { type: "image/png" });
    return typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [f] });
  } catch {
    return false;
  }
}
