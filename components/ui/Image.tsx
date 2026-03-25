import NextImage from "next/image";
import type { ImageProps } from "next/image";

export function Image(props: ImageProps) {
  return <NextImage {...props} />;
}
