"use client";

import { BorderlessAltWithEffect } from "@/components/images/BorderlessAltWithEffect";
import { ScryfallSearch } from "@/components/images/scryfall-search";
import { useScryfallSearch } from "@/hooks/use-scryfall-search";
import { useSvgToPng } from "@/hooks/use-svg-to-png";

const SVG_ID = "Borderless_Alt";

const MAP_COLORS: Record<string, string> = {
  G: "#027b44",
  W: "#fdfeff",
  U: "#0175be",
  B: "#272624",
  R: "#ef3828",
  C: "#c0bfbd",
  MULTI: "#f6d362",
  LAND: "#ae9787",
  ARTIFACT: "#c5cbd9",
};

export default function BorderlessSvgPage() {
  const {
    query,
    suggestions,
    selectedCard,
    isLoading,
    error,
    setQuery,
    selectCard,
  } = useScryfallSearch();

  const { downloadAsPng } = useSvgToPng();

  const pinlineColors = !selectedCard?.color_identity?.length
    ? MAP_COLORS.C
    : selectedCard.color_identity.length >= 3
      ? MAP_COLORS.MULTI
      : MAP_COLORS[selectedCard.color_identity[0]];

  const pinlineColorEnd = !selectedCard?.color_identity?.length
    ? MAP_COLORS.C
    : selectedCard.color_identity.length >= 3
      ? MAP_COLORS.MULTI
      : MAP_COLORS[
          selectedCard.color_identity[selectedCard.color_identity.length - 1]
        ];

  const handleDownload = () => {
    const name = selectedCard?.name ?? "card";
    downloadAsPng(SVG_ID, `${name}.png`);
  };

  return (
    <main className="flex flex-col items-center gap-6 overflow-y-auto p-6">
      <ScryfallSearch
        query={query}
        suggestions={suggestions}
        isLoading={isLoading}
        error={error}
        onQueryChange={setQuery}
        onSelect={selectCard}
      />
      <BorderlessAltWithEffect
        imageUrl={selectedCard?.image_uris?.art_crop}
        cardName={selectedCard?.name}
        typeLine={selectedCard?.type_line}
        oracleText={selectedCard?.oracle_text}
        manaCost={selectedCard?.mana_cost}
        pinlineColor={pinlineColors}
        pinlineColorEnd={pinlineColorEnd}
      />
      {selectedCard && (
        <button
          onClick={handleDownload}
          data-testid="download-png-button"
          className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Download PNG
        </button>
      )}
    </main>
  );
}
