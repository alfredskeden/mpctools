import type { Metadata } from "next";
import { MergerPageContent } from "@/components/merger/merger-page-content";

export const metadata: Metadata = {
  title: "Merge Outpainted Cards | MPC Proxy Art",
  description:
    "Overlay your outpainted card art onto the original for a print-ready result. Step 3 of the MPC Proxy Art workflow.",
};

export default function MergerPage() {
  return (
    <main className="flex flex-1 min-h-0 flex-col bg-surface-base">
      <MergerPageContent />
    </main>
  );
}
