import { GhostCard } from "@/components/ghost-card";
import { HeroSection } from "@/components/hero-section";
import { StepIndicator } from "@/components/step-indicator";

const steps = [
  { label: "Prep", active: true },
  { label: "Outpaint", active: false },
  { label: "Merge", active: false },
];

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background">
      <GhostCard
        side="left"
        images={[
          "/outpaint-animation/raphael_tough_turtle_prepper.png",
          "/outpaint-animation/raphael_tough_turtle_outpaint.png",
        ]}
      />
      <GhostCard
        side="right"
        images={[
          "/outpaint-animation/raphael_tough_turtle_prepper.png",
          "/outpaint-animation/raphael_tough_turtle_outpaint.png",
        ]}
      />
      <HeroSection />
      <StepIndicator steps={steps} />
    </main>
  );
}
