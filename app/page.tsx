import { GhostCard } from "@/components/GhostCard";
import { HeroSection } from "@/components/HeroSection";
import { StepIndicator } from "@/components/StepIndicator";

const GHOST_IMAGE_COUNT = 6;

function pickTwoDistinct(count: number): [number, number] {
  const a = Math.floor(Math.random() * count);
  let b = Math.floor(Math.random() * (count - 1));
  if (b >= a) b++;
  return [a, b];
}

const steps = [
  { label: "Prep", active: true },
  { label: "Outpaint", active: false },
  { label: "Merge", active: false },
];

export default async function Home() {
  const [leftIndex, rightIndex] = pickTwoDistinct(GHOST_IMAGE_COUNT);

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background">
      <GhostCard side="left" imageIndex={leftIndex} />
      <GhostCard side="right" imageIndex={rightIndex} />
      <HeroSection />
      <StepIndicator steps={steps} variant="landing" />
    </main>
  );
}
