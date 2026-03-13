"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";

type GhostCardProps = {
  side: "left" | "right";
  images: string[];
  displayDuration?: number;
  fadeDuration?: number;
};

export function GhostCard({
  side,
  images,
  displayDuration = 1000,
  fadeDuration = 3000,
}: GhostCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (images.length < 2) return;

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
      className={`absolute ${positionClasses} top-1/2 -translate-y-1/2 opacity-100`}
    >
      <Card className="relative h-80 w-56 overflow-hidden rounded-xl bg-background">
        <Image
          src={images[currentIndex]}
          alt=""
          fill
          className="object-cover"
        />
        {images.length > 1 && (
          <Image
            src={images[nextIndex]}
            alt=""
            fill
            className="object-cover"
            style={{
              opacity: isFading ? 1 : 0,
              transition: isFading
                ? `opacity ${fadeDuration}ms ease-in-out`
                : "none",
            }}
          />
        )}
      </Card>
    </div>
  );
}
