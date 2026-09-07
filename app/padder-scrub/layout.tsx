import type { Metadata } from "next";
import { PadderShell } from "@/components/padder/padder-shell";

export const metadata: Metadata = {
  title: "Padder Outpaint Prompts — MPC Tools",
  description:
    "The Gemini prompts for outpainting a padded Scryfall card scan into a full MPC print-size canvas.",
  openGraph: {
    title: "Padder Outpaint Prompts — MPC Tools",
    description:
      "The Gemini prompts for outpainting a padded Scryfall card scan.",
  },
  alternates: {
    canonical: "/padder-outpaint",
  },
};

export default function PadderOutpaintLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PadderShell currentStep={2}>{children}</PadderShell>;
}
