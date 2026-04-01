import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const HeroSection = () => {
  return (
    <div className="relative flex flex-col items-center gap-12 px-6 rounded-2xl py-10 backdrop-blur-md bg-white/5 border border-white/10 sm:backdrop-blur-none sm:bg-transparent sm:border-transparent sm:py-0 sm:rounded-none mx-4 sm:mx-0">
      <div className="flex max-w-xl flex-col items-center gap-4">
        <Badge
          variant="secondary"
          className="font-medium uppercase tracking-extra-wide text-brand"
        >
          NBP ❤️
        </Badge>
        <h1 className="scroll-m-20 text-center font-black tracking-display text-balance text-foreground text-4xl sm:text-display-lg">
          From source art to print-ready image.
        </h1>
        <p className="text-center text-base leading-7 font-light text-text-secondary">
          Upload any artwork. AI fills beyond the edges. Exports ready to use in
          your render.
        </p>
      </div>

      <Button
        asChild
        size="lg"
        className="h-13 gap-2.5 rounded-lg bg-brand px-9 text-base font-semibold text-brand-foreground hover:bg-brand-hover"
      >
        <Link href="/prep">
          Start Building
          <ArrowRight className="size-4.5" />
        </Link>
      </Button>
    </div>
  );
};
