import type { Metadata } from "next";
import { PadderShell } from "@/components/padder/padder-shell";

export const metadata: Metadata = {
  title: "Scryfall Scan Padder — MPC Tools",
  description:
    "Pad a Scryfall card scan to MPC print size without resampling a single pixel. The scan keeps its exact resolution; only grey padding is added.",
  openGraph: {
    title: "Scryfall Scan Padder — MPC Tools",
    description:
      "Pad a Scryfall card scan to MPC print size without resampling a single pixel.",
  },
  alternates: {
    canonical: "/padder",
  },
};

export default function PadderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PadderShell currentStep={1}>{children}</PadderShell>;
}
