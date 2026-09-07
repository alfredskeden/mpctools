"use client";

import { useEffect } from "react";

/**
 * Hand the first image on the clipboard to `onFile` when the user pastes,
 * so a scan copied straight from Scryfall skips the download-then-upload trip.
 */
export function usePasteImage(onFile: (file: File) => void): void {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;

        const file = item.getAsFile();
        if (!file) continue;

        event.preventDefault();
        onFile(file);
        return;
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFile]);
}
