// 情境插畫載入器：使用 import.meta.glob 在建置時期把圖檔打包成 URL 資源
const sceneImageModules = import.meta.glob("./assets/scenes/*.jpg", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function nameFromPath(path: string): string {
  const file = path.split("/").pop() ?? "";
  return file;
}

const sceneImageByName: Record<string, string> = Object.fromEntries(
  Object.entries(sceneImageModules).map(([path, url]) => [nameFromPath(path), url])
);

export function getSceneImageUrl(filename: string): string | null {
  return sceneImageByName[filename] ?? null;
}
