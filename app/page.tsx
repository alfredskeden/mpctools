import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { label: "Prep", active: true },
  { label: "Outpaint", active: false },
  { label: "Merge", active: false },
];

export default function Home() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background">
      {/* Ghost card — left */}
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-5">
        <div className="h-80 w-56 rounded-xl bg-white" />
      </div>

      {/* Ghost card — right */}
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-5">
        <div className="h-80 w-56 rounded-xl bg-white" />
      </div>

      {/* Hero */}
      <div className="relative flex flex-col items-center gap-12 px-6">
        <div className="flex max-w-xl flex-col items-center gap-4">
          <span className="text-label font-medium uppercase tracking-extra-wide text-brand">
            Welcome to
          </span>
          <h1 className="text-center text-display font-black tracking-display text-foreground sm:text-display-lg">
            All-in-One MTG Playtest Card Builder
          </h1>
          <p className="text-center text-base font-light leading-6 text-muted-foreground">
            Prepare, outpaint, and merge high-quality card art for print-ready
            playtest proxies.
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="h-13 gap-2.5 rounded-lg bg-brand px-9 text-base font-semibold text-brand-foreground hover:bg-brand-hover"
        >
          <Link href="/prep">
            Begin Step 1
            <ArrowRight className="size-4.5" />
          </Link>
        </Button>
      </div>

      {/* Step indicators */}
      <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-8">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div
                className={`size-2 rounded-full ${
                  step.active ? "bg-brand" : "bg-secondary"
                }`}
              />
              <span
                className={`text-xs leading-4 ${
                  step.active
                    ? "font-medium text-brand"
                    : "font-normal text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="h-px w-8 bg-secondary" />}
          </div>
        ))}
      </div>
    </div>
  );
}
