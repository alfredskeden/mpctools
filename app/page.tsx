export const dynamic = "force-dynamic";

import { GhostCard } from "@/components/GhostCard";
import { HeroSection } from "@/components/HeroSection";
import { StepIndicator } from "@/components/StepIndicator";
import { LandingNav } from "@/components/landing/landing-nav";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { getGhostCardImageSets } from "@/lib/ghost-card-images";

const steps = [
  { label: "Prep", active: true },
  { label: "Outpaint", active: false },
  { label: "Merge", active: false },
];

export default async function Home() {
  const [leftImages, rightImages] = getGhostCardImageSets();

  return (
    <div className="bg-surface-ground">
      <LandingNav />
      <main className="-mt-14">
        {/* Hero */}
        <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden">
          <div className="hidden lg:block">
            <GhostCard side="left" images={leftImages} />
          </div>
          <div className="hidden lg:block">
            <GhostCard side="right" images={rightImages} />
          </div>
          <HeroSection />
          <StepIndicator steps={steps} variant="landing" />
        </section>
        <WorkflowSection />
        <FeatureGrid />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
