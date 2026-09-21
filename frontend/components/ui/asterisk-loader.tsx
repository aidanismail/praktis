import type { SVGProps } from "react";

export type AsteriskLoaderProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  animate?: boolean;
};

export function AsteriskIcon({
  size = 20,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden={props["aria-label"] ? undefined : "true"}
      role={props["aria-label"] ? "img" : undefined}
      className={`shrink-0 ${className}`}
      {...props}
    >
      <rect x="9.1" y="2" width="5.8" height="20" rx="2.9" />
      <rect
        x="9.1"
        y="2"
        width="5.8"
        height="20"
        rx="2.9"
        transform="rotate(60 12 12)"
      />
      <rect
        x="9.1"
        y="2"
        width="5.8"
        height="20"
        rx="2.9"
        transform="rotate(120 12 12)"
      />
    </svg>
  );
}

export function AsteriskLoader({
  size = 20,
  animate = true,
  className = "",
  ...props
}: AsteriskLoaderProps) {
  const isHidden = props["aria-hidden"] === true || props["aria-hidden"] === "true";
  const ariaLabel = props["aria-label"] ?? (isHidden ? undefined : "Loading");

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden={isHidden ? "true" : undefined}
      role={isHidden ? undefined : "status"}
      aria-label={ariaLabel}
      className={`shrink-0 ${animate ? "animate-asterisk-spin" : ""} ${className}`}
      {...props}
    >
      <rect x="9.1" y="2" width="5.8" height="20" rx="2.9" />
      <rect
        x="9.1"
        y="2"
        width="5.8"
        height="20"
        rx="2.9"
        transform="rotate(60 12 12)"
      />
      <rect
        x="9.1"
        y="2"
        width="5.8"
        height="20"
        rx="2.9"
        transform="rotate(120 12 12)"
      />
    </svg>
  );
}

export const BrandSpinner = AsteriskLoader;
