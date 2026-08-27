// 成就徽章美術圖——跟 avatars.ts 一樣，用 import.meta.glob 在建置時期把圖檔打包成資源，
// 不需要在執行期額外 fetch。原始素材（1024x1024、圓形直徑 800px＋112px 白色留白，
// 見 assets/badge/SKILL.md 的規範）另外裁切壓縮成 200x200 的小縮圖才進這裡，
// 因為 demo-standalone.html 會把整個 App 打包成單一 HTML 檔案，圖檔越小，產出才不會太肥大。
//
// 目前只有部分徽章代號完成美術（見 assets/badge/ 底下實際有哪些檔案），還沒畫的徽章
// getBadgeImageUrl() 會回傳 null，畫面上會退回藍色底色＋代號的佔位圖（main.ts 的
// renderBadgeCard() 已經處理這個 fallback，不用在這裡另外做預設圖）。

const badgeImageModules = import.meta.glob("./assets/badges/*.jpg", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function codeFromPath(path: string): string {
  const file = path.split("/").pop() ?? "";
  return file.replace(/\.jpg$/, "");
}

const badgeImageByCode: Record<string, string> = Object.fromEntries(
  Object.entries(badgeImageModules).map(([path, url]) => [codeFromPath(path), url])
);

/** 依徽章代號（例如 "VM-01"）取得美術圖網址；還沒畫好的徽章回傳 null。 */
export function getBadgeImageUrl(code: string): string | null {
  return badgeImageByCode[code] ?? null;
}
