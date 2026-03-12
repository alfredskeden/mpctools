import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="relative flex flex-col items-center gap-12 px-6">
      <div className="flex max-w-xl flex-col items-center gap-4">
        <Badge
          variant="secondary"
          className="font-medium uppercase tracking-extra-wide text-brand"
        >
          Welcome to
        </Badge>
        <h1 className="scroll-m-20 text-center text-display font-black tracking-display text-balance text-foreground sm:text-display-lg text-4xl tracking-tight">
          All-in-One MTG Playtest Card Builder
        </h1>
        <p className="text-center text-xl leading-7 font-light text-white">
          Prepare, outpaint, and merge high-quality card art for print-ready
          playtest proxies.
        </p>
      </div>

      <Button
        asChild
        size="lg"
        className="h-13 gap-2.5 rounded-lg bg-brand px-9 text-base font-semibold text-brand-foreground hover:bg-brand-hover"
      >
        <Link href="/prep">
          Begin Step 1
          <ArrowRight className="size-4.5" />
        </Link>
      </Button>
    </div>
  );
}
