const GHOST_IMAGE_COUNT = 6;

function pickTwoDistinct(count: number): [number, number] {
  const a = Math.floor(Math.random() * count);
  let b = Math.floor(Math.random() * (count - 1));
  if (b >= a) b++;
  return [a, b];
}

function ghostImages(index: number): string[] {
  return [
    `/outpaint-animation/${index}_prepper.webp`,
    `/outpaint-animation/${index}_outpaint.webp`,
    `/outpaint-animation/${index}_full_card.webp`,
  ];
}

export function getGhostCardImageSets(): [string[], string[]] {
  const [leftIndex, rightIndex] = pickTwoDistinct(GHOST_IMAGE_COUNT);
  return [ghostImages(leftIndex), ghostImages(rightIndex)];
}
