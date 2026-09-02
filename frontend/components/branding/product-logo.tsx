import Image from "next/image";

type ProductLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  size?: number;
};

export function ProductLogo({
  alt = "",
  className,
  priority = false,
  size = 32
}: ProductLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      className={className}
    />
  );
}
