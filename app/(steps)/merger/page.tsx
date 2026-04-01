import type { Metadata } from "next";
import { MergerPageContent } from "@/components/merger/merger-page-content";

export const metadata: Metadata = {
  title: "Merge Outpainted Image | MPC Tools",
  description:
    "Overlay your outpainted image onto the original for a print-ready result. Step 3 of the MPC Tools image outpainting workflow.",
};

export default function MergerPage() {
  return (
    <main className="flex flex-1 min-h-0 flex-col bg-surface-base">
      <MergerPageContent />
    </main>
  );
}
