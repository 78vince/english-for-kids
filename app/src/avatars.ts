// 使用者頭像——新增使用者時可以選一張可愛動物照片當頭像，讓小朋友一眼就能認出
// 「這是我」，比純文字名字更直覺。圖檔是從 assets/photo/ 的原始照片（1024x1024，
// 每張 500~800KB）另外裁切壓縮成 200x200 的小縮圖放在 app/src/assets/avatars/，
// 因為 demo-standalone.html 會把整個 App 打包成單一 HTML 檔案，圖檔越小，
// 產出的檔案才不會太肥大。目前共 18 張（2026-08-05 新增第二批 12 張）。

export interface Avatar {
  id: string;
  label: string;
  url: string;
}

const avatarModules = import.meta.glob("./assets/avatars/*.jpg", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

// 對應每個檔名的中文顯示名稱，只是給畫面上的 title 提示用（例如滑鼠移到頭像上）。
const AVATAR_LABELS: Record<string, string> = {
  bull_terrier: "鬥牛梗犬",
  capybara: "水豚",
  formosan_black_bear: "台灣黑熊",
  lop_eared_rabbit: "垂耳兔",
  monkey: "猴子",
  siamese_cat: "暹羅貓",
  // 2026-08-05 新增的第二批頭像，共 12 張
  capybara_1: "眼鏡水豚",
  emperor_penguin: "帝王企鵝",
  fennec_fox: "耳廓狐",
  french_bulldog: "法國鬥牛犬",
  netherland_dwarf_rabbit: "荷蘭侏儒兔",
  persian_cat: "波斯貓",
  polar_bear: "北極熊",
  proboscis_monkey: "長鼻猴",
  sea_otter: "海獺",
  shiba_inu: "柴犬",
  sloth: "樹懶",
  toy_poodle: "貴賓犬",
};

function idFromPath(path: string): string {
  const file = path.split("/").pop() ?? "";
  return file.replace(/\.jpg$/, "");
}

export const AVATARS: Avatar[] = Object.entries(avatarModules)
  .map(([path, url]) => {
    const id = idFromPath(path);
    return { id, label: AVATAR_LABELS[id] ?? id, url };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

if (AVATARS.length === 0) {
  throw new Error("找不到任何頭像圖片（app/src/assets/avatars/*.jpg）");
}

/** 依 id 找頭像；找不到（例如圖檔被移除）就退回第一張，確保畫面一定有圖可顯示。 */
export function getAvatarById(id: string): Avatar {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
