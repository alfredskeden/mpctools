import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface-header backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="mpctools home">
          <span className="font-mono text-xl font-bold tracking-wide text-text-primary">
            MPC Tools
          </span>
        </Link>
        <nav aria-label="Site navigation">
          <ul className="flex items-center gap-2 list-none m-0 p-0">
            <li className="hidden sm:block">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-text-secondary px-3 py-2 transition-colors hover:text-text-primary"
              >
                How it works
              </a>
            </li>
            <li>
              <Link
                href="/prep"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                Get Started
                <ArrowRight className="size-3.5" />
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
