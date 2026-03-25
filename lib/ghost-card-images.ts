import { readdirSync } from "fs";
import { join } from "path";

export function getNumericFolders(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => parseInt(a) - parseInt(b));
}

export function pickTwoDistinct(items: string[]): [string, string] {
  if (items.length === 0) return ["0", "0"];
  if (items.length === 1) return [items[0], items[0]];
  const firstIdx = Math.floor(Math.random() * items.length);
  let secondIdx: number;
  do {
    secondIdx = Math.floor(Math.random() * items.length);
  } while (secondIdx === firstIdx);
  return [items[firstIdx], items[secondIdx]];
}

export function buildImagePaths(folderIndex: string): string[] {
  return [
    `/outpaint-animation/${folderIndex}/prepper.webp`,
    `/outpaint-animation/${folderIndex}/outpaint.webp`,
    `/outpaint-animation/${folderIndex}/full_card.webp`,
  ];
}

export function getGhostCardImageSets(): [string[], string[]] {
  const dir = join(process.cwd(), "public", "outpaint-animation");
  const folders = getNumericFolders(dir);
  const [first, second] = pickTwoDistinct(folders);
  return [buildImagePaths(first), buildImagePaths(second)];
}
