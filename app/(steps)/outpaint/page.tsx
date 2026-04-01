import type { Metadata } from "next";
import { OutpaintPageContent } from "@/components/outpaint/outpaint-page-content";

export const metadata: Metadata = {
  title: "Extend Card Art with AI | MPC Tools",
  description:
    "Use Gemini AI to outpaint your card art to full bleed. Step 2 of the MPC Tools image outpainting workflow.",
};

export default function OutpaintPage() {
  return (
    <main className="flex flex-1 min-h-0 flex-col bg-surface-base">
      <OutpaintPageContent />
    </main>
  );
}
