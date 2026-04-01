import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="bg-surface-base border-t border-surface-border">
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-display-lg font-black tracking-display text-text-primary">
          Ready to outpaint your images?
        </h2>
        <p className="mt-4 text-base text-text-secondary">
          Three steps. Under a few minutes. Free!
        </p>
        <div className="mt-10">
          <Link
            href="/prep"
            className="inline-flex items-center gap-2.5 rounded-lg bg-brand px-9 py-4 text-base font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            Get Started
            <ArrowRight className="size-4.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
