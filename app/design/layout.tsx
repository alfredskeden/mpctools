import { Header } from "@/components/Header";
import Link from "next/link";

export const DesignLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-surface-border bg-surface-header px-4">
        <div className="flex items-center gap-2.5">
          <Link href="/">
            <span className="text-caption font-semibold uppercase tracking-label text-accent-blue">
              Design
            </span>
          </Link>
          <span className="hidden text-text-faint sm:inline" aria-hidden="true">
            |
          </span>
          <span className="text-label font-medium text-text-primary sm:hidden">
            Outpaint Studio
          </span>
          <span className="hidden text-label font-medium text-text-primary sm:inline">
            Outpaint Studio
          </span>
        </div>
      </header>
      {children}
    </div>
  );
};

export default DesignLayout;
