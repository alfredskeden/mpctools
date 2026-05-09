import type { Metadata } from "next";
import { DewatermarkPageContent } from "@/components/dewatermark/dewatermark-page-content";

export const metadata: Metadata = {
  title: "Dewatermark | MPC Tools",
  description:
    "Remove the Gemini AI watermark from outpainted card art. Side-by-side preview, live tweakable settings, runs entirely in your browser.",
};

export default function DewatermarkPage() {
  return <DewatermarkPageContent />;
}
