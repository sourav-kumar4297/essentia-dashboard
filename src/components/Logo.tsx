import Image from "next/image";
import { clsx } from "clsx";

export function Logo({
  variant = "white",
  className,
  height = 20,
}: {
  variant?: "espresso" | "white";
  className?: string;
  /** Header spec: 20px */
  height?: number;
}) {
  const src = variant === "white" ? "/logo-white.png" : "/logo-espresso.png";
  const width = Math.round(height * 4.2);
  return (
    <Image
      src={src}
      alt="essentia"
      width={width}
      height={height}
      className={clsx("object-contain object-left", className)}
      priority
    />
  );
}
