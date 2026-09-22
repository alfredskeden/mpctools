/**
 * Turn browser file inputs — a `FileList` from `<input>`, or a `DataTransfer`
 * from a drop — into a filtered `File[]`. Pure over its arguments: the
 * recursive directory walk takes the browser entry objects as data, so the
 * whole thing is testable without a DOM.
 */

/** A dropped filesystem entry, narrowed to only what the walk touches. */
type DroppedEntry = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (onFile: (file: File) => void) => void;
  createReader?: () => {
    readEntries: (onBatch: (entries: DroppedEntry[]) => void) => void;
  };
};

type EntryItem = {
  webkitGetAsEntry?: () => DroppedEntry | null;
};

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/** Image files from an `<input type="file">` FileList, in order. */
export function collectImageFiles(fileList: FileList | null): File[] {
  if (!fileList) return [];
  return Array.from(fileList).filter(isImageFile);
}

/**
 * Image files from a drop. Walks any dropped directories recursively via
 * `webkitGetAsEntry`; when no item exposes it, falls back to the flat
 * `dataTransfer.files`.
 */
export async function collectDroppedFiles(
  dataTransfer: DataTransfer,
): Promise<File[]> {
  const rootEntries = readRootEntries(dataTransfer.items);
  if (rootEntries === null) {
    return collectImageFiles(dataTransfer.files);
  }

  const files: File[] = [];
  for (const entry of rootEntries) {
    await walkEntry(entry, files);
  }
  return files.filter(isImageFile);
}

/** Root entries when entry support exists, otherwise null (use the fallback). */
function readRootEntries(
  items: DataTransferItemList | undefined,
): DroppedEntry[] | null {
  if (!items) return null;

  const entries: DroppedEntry[] = [];
  let supported = false;
  for (const item of Array.from(items) as unknown as EntryItem[]) {
    if (typeof item.webkitGetAsEntry !== "function") continue;
    supported = true;
    const entry = item.webkitGetAsEntry();
    if (entry) entries.push(entry);
  }
  return supported ? entries : null;
}

async function walkEntry(entry: DroppedEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    out.push(await entryToFile(entry));
    return;
  }
  const children = await readAllEntries(entry);
  for (const child of children) {
    await walkEntry(child, out);
  }
}

function entryToFile(entry: DroppedEntry): Promise<File> {
  return new Promise((resolve) => {
    entry.file!((file) => resolve(file));
  });
}

/** `readEntries` yields in batches and must be drained until it returns empty. */
function readAllEntries(entry: DroppedEntry): Promise<DroppedEntry[]> {
  const reader = entry.createReader!();
  const all: DroppedEntry[] = [];
  return new Promise((resolve) => {
    const read = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all);
          return;
        }
        all.push(...batch);
        read();
      });
    };
    read();
  });
}
