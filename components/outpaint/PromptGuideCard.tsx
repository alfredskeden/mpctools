"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/Image";
import { Button } from "@/components/ui/Button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";

type PromptGuideCardProps = {
  stepNumber: string;
  heading: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  priority?: boolean;
  className?: string;
};

export const PromptGuideCard = ({
  stepNumber,
  heading,
  description,
  imageSrc,
  imageAlt,
  priority = false,
  className,
}: PromptGuideCardProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "bg-surface-raised border border-surface-border rounded-lg overflow-hidden flex flex-col",
          className,
        )}
      >
        <button
          type="button"
          className="relative aspect-video w-full h-32 cursor-zoom-in"
          aria-label={`View ${imageAlt} full size`}
          onClick={() => setOpen(true)}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-contain"
            priority={priority}
          />
        </button>
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

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-16 outline-none"
          >
            <DialogPrimitive.Title className="sr-only">
              {imageAlt}
            </DialogPrimitive.Title>
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1920}
              height={1080}
              className="max-w-full max-h-full object-contain rounded-lg"
              priority
            />
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-4 right-4"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </DialogPrimitive.Root>
    </>
  );
};
