import { GhostCard } from "@/components/GhostCard";
import { HeroSection } from "@/components/HeroSection";
import { StepIndicator } from "@/components/StepIndicator";
import { getGhostCardImageSets } from "@/lib/ghost-card-images";

const steps = [
  { label: "Prep", active: true },
  { label: "Outpaint", active: false },
  { label: "Merge", active: false },
];

export default async function Home() {
  const [leftImages, rightImages] = getGhostCardImageSets();
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background">
      <GhostCard side="left" images={leftImages} />
      <GhostCard side="right" images={rightImages} />
      <HeroSection />
      <StepIndicator steps={steps} variant="landing" />
    </main>
  );
}
