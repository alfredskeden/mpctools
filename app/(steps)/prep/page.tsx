import type { Metadata } from "next";
import { PrepPageContent } from "@/components/prep/prep-page-content";

export const metadata: Metadata = {
  title: "Prepare Art for Outpaint | MPC Tools",
  description:
    "Resize and position your art for outpainting. Step 1 of the MPC Tools image outpainting workflow.",
};

export default function PrepPage() {
  return (
    <main className="flex flex-1 min-h-0 flex-col bg-surface-base">
      <PrepPageContent />
    </main>
  );
}
