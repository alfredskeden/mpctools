import type { Metadata } from "next";
import { PrepPageContent } from "@/components/prep/prep-page-content";

export const metadata: Metadata = {
  title: "Prepare Card Art | MPC Proxy Art",
  description:
    "Crop, resize, and position your card art for outpainting. Step 1 of the MPC Proxy Art workflow.",
};

export default function PrepPage() {
  return (
    <main className="flex flex-1 min-h-0 flex-col bg-surface-base">
      <PrepPageContent />
    </main>
  );
}
