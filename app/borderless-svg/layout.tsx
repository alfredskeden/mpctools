import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Borderless SVG Generator — MPC Tools",
  description:
    "Upload your card art and let AI handle the full outpainting workflow automatically. Canvas sizing, processing, outpainting, and merging in one seamless flow.",
  openGraph: {
    title: "Automatic Design — MPC Tools",
    description:
      "Upload your card art and let AI handle the full outpainting workflow automatically.",
  },
  alternates: {
    canonical: "/borderless-svg",
  },
};

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
              Borderless SVG
            </span>
          </Link>
          <span className="hidden text-text-faint sm:inline" aria-hidden="true">
            |
          </span>
          <span className="text-label font-medium text-text-primary sm:hidden">
            Borderless SVG
          </span>
          <span className="hidden text-label font-medium text-text-primary sm:inline">
            Borderless SVG
          </span>
        </div>
      </header>
      {children}
    </div>
  );
};

export default DesignLayout;
