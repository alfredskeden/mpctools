"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";

type GhostCardProps = {
  side: "left" | "right";
  images: [string, string];
  displayDuration?: number;
  fadeDuration?: number;
};

export function GhostCard({
  side,
  images,
  displayDuration = 3000,
  fadeDuration = 5000,
}: GhostCardProps) {
  const [showSecond, setShowSecond] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function cycle() {
      timeoutId = setTimeout(() => {
        setShowSecond(true);
        timeoutId = setTimeout(() => {
          setShowSecond(false);
          cycle();
        }, fadeDuration + displayDuration);
      }, displayDuration);
    }

    cycle();
    return () => clearTimeout(timeoutId);
  }, [displayDuration, fadeDuration]);

  const positionClasses = side === "left" ? "-left-10" : "-right-8";

  return (
    <div
      aria-hidden="true"
      className={`absolute ${positionClasses} top-1/2 -translate-y-1/2 opacity-100`}
    >
      <Card className="relative h-80 w-56 overflow-hidden rounded-xl bg-background">
        <Image src={images[0]} alt="" fill className="object-cover" />
        <Image
          src={images[1]}
          alt=""
          fill
          className="object-cover"
          style={{
            opacity: showSecond ? 1 : 0,
            transition: showSecond
              ? `opacity ${fadeDuration}ms ease-in-out`
              : "none",
          }}
        />
      </Card>
    </div>
  );
}
