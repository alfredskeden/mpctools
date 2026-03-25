import { cn } from "@/lib/utils";
import Image from "next/image";

type PromptGuideCardProps = {
  stepNumber: string;
  heading: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  className?: string;
};

export const PromptGuideCard = ({
  stepNumber,
  heading,
  description,
  imageSrc,
  imageAlt,
  className,
}: PromptGuideCardProps) => {
  return (
    <div
      className={cn(
        "bg-surface-raised border border-surface-border rounded-lg overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="relative aspect-video w-full h-32">
        <Image src={imageSrc} alt={imageAlt} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-contain" />
      </div>
      <div className="flex flex-col gap-1 p-4 lg:p-5">
        <span className="text-micro font-bold tracking-extra-wide uppercase text-accent-blue">
          {stepNumber}
        </span>
        <h3 className="text-label font-semibold text-text-primary">
          {heading}
        </h3>
        <p className="text-caption text-text-secondary">{description}</p>
      </div>
    </div>
  );
};
