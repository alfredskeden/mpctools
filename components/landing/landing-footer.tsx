import Link from "next/link";

const NAV_STEPS = [
  { label: "Prep", href: "/prep" },
  { label: "Outpaint", href: "/outpaint" },
  { label: "Merge", href: "/merger" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-surface-border bg-surface-ground">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xl font-bold text-text-primary">
              MPC Tools
            </span>
            <p className="text-sm text-text-tertiary">
              Made possible via Magic Proxies community over at{" "}
              <Link
                className="text-text-secondary transition-colors hover:text-text-primary underline"
                target="_blank"
                href="https://nux.cam/discord"
              >
                Discord
              </Link>
              .
            </p>
            <p className="text-sm text-text-tertiary">
              Special thanks to: @PoliteFrog @Taffman @Kermit
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-6 list-none m-0 p-0">
              {NAV_STEPS.map((step) => (
                <li key={step.href}>
                  <Link
                    href={step.href}
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {step.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
