const MANA_PIP_COLORS: Record<string, string> = {
  W: "#fdfeff",
  U: "#0175be",
  B: "#272624",
  R: "#ef3828",
  G: "#027b44",
  C: "#c0bfbd",
};

const GENERIC_PIP_COLOR = "#aaaaaa";

export function parseMana(cost: string | undefined): string[] {
  if (!cost) return [];
  return cost.match(/\{[^}]+\}/g) ?? [];
}

export function getManaPipColor(pip: string): string {
  const key = pip.replace(/[{}]/g, "").toUpperCase();
  return MANA_PIP_COLORS[key] ?? GENERIC_PIP_COLOR;
}
