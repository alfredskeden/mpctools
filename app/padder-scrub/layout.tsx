import type { Metadata } from "next";
import { PadderShell } from "@/components/padder/padder-shell";

export const metadata: Metadata = {
  title: "Padder Scrub Prompts — MPC Tools",
  description:
    "The Gemini prompts for scrubbing a padded Scryfall card scan into full-bleed art at MPC print size.",
  openGraph: {
    title: "Padder Scrub Prompts — MPC Tools",
    description:
      "The Gemini prompts for scrubbing a padded Scryfall card scan.",
  },
  alternates: {
    canonical: "/padder-scrub",
  },
};

export default function PadderScrubLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PadderShell currentStep={2}>{children}</PadderShell>;
}
