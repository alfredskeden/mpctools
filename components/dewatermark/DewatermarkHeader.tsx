import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Prep", href: "/prep" },
  { label: "Outpaint", href: "/outpaint" },
  { label: "Merger", href: "/merger" },
  { label: "Dewatermark", href: "/dewatermark" },
];

export function DewatermarkHeader() {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-surface-border bg-surface-header px-4">
      <div className="flex items-center gap-2.5">
        <Link href="/" aria-label="mpctools home">
          <span className="font-mono text-label font-bold tracking-display text-text-primary">
            MPC Tools
          </span>
        </Link>
        <span className="text-text-faint" aria-hidden="true">
          |
        </span>
        <span className="font-mono text-caption font-semibold uppercase tracking-extra-wide text-accent-blue">
          Tool
        </span>
        <span className="text-label font-medium text-text-primary">
          Dewatermark
        </span>
      </div>
      <nav aria-label="MPC Tools sections">
        <ul className="flex list-none items-center gap-1 p-0">
          {NAV.map((item) => {
            const active = item.href === "/dewatermark";
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-caption transition-colors",
                    active
                      ? "bg-surface-raised text-text-primary"
                      : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
