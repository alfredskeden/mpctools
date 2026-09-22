import { downloadZip } from "client-zip";

/** One padded PNG destined for the ZIP. */
export type ZipEntry = {
  name: string;
  input: Blob;
};

/**
 * Two nested folders can each hold `card.png`. A name already taken gets
 * `-2`, `-3`, … inserted before the extension so no ZIP entry collides.
 */
export function dedupeEntryNames(entries: ZipEntry[]): ZipEntry[] {
  const counts = new Map<string, number>();
  return entries.map((entry) => {
    const seen = counts.get(entry.name) ?? 0;
    counts.set(entry.name, seen + 1);
    if (seen === 0) return entry;
    return { ...entry, name: insertSuffix(entry.name, seen + 1) };
  });
}

function insertSuffix(name: string, ordinal: number): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name}-${ordinal}`;
  return `${name.slice(0, dot)}-${ordinal}${name.slice(dot)}`;
}

/** Build the ZIP blob from padded entries, de-duplicating names first. */
export async function buildZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const deduped = dedupeEntryNames(entries);
  const response = downloadZip(
    deduped.map((entry) => ({ name: entry.name, input: entry.input })),
  );
  return response.blob();
}

/** Hand a built ZIP blob to the browser as a download. */
export function downloadZipBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
