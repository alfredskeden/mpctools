"use client";

import { Card } from "@/components/ui/Card";
import { Image } from "@/components/ui/Image";
import { useEffect, useMemo, useState } from "react";

type GhostCardProps = {
  side: "left" | "right";
  imageIndex: number;
  displayDuration?: number;
  fadeDuration?: number;
};

export const GhostCard = ({
  side,
  imageIndex,
  displayDuration = 1000,
  fadeDuration = 3000,
}: GhostCardProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  const images = useMemo(
    () => [
      `/outpaint-animation/${imageIndex}_prepper.webp`,
      `/outpaint-animation/${imageIndex}_outpaint.webp`,
      `/outpaint-animation/${imageIndex}_full_card.webp`,
    ],
    [imageIndex],
  );

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function cycle() {
      timeoutId = setTimeout(() => {
        setIsFading(true);
        timeoutId = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
          setIsFading(false);
          cycle();
        }, fadeDuration + displayDuration);
      }, displayDuration);
    }

    cycle();
    return () => clearTimeout(timeoutId);
  }, [displayDuration, fadeDuration, images.length]);

  const positionClasses = side === "left" ? "-left-10" : "-right-8";
  const nextIndex = (currentIndex + 1) % images.length;

  return (
    <div
      aria-hidden="true"
      data-side={side}
      className={`absolute ${positionClasses} top-1/2 -translate-y-1/2 opacity-100`}
    >
      <Card className="relative h-80 w-56 overflow-hidden rounded-xl bg-background">
        <Image
          src={images[currentIndex]}
          alt=""
          fill
          sizes="224px"
          preload
          className="object-cover"
        />
        <Image
          src={images[nextIndex]}
          alt=""
          fill
          sizes="224px"
          preload
          className="object-cover"
          style={{
            opacity: isFading ? 1 : 0,
            transition: isFading
              ? `opacity ${fadeDuration}ms ease-in-out`
              : "none",
          }}
        />
      </Card>
    </div>
  );
};
