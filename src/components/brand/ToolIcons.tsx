/* ──────────────────────────────────────────────────────────────────
 * ToolIcons — clean SVG versions of the tools shown in the BuiltWith
 * strip on the landing page. Each icon uses `currentColor` so it
 * inherits theme color from the parent.
 *
 * These are simplified, original interpretations of brand marks for
 * use in a "Powered by" or "Built with" context — recognizable but
 * not 1:1 copies of trademarked logos. Pair with brand name in text.
 * ────────────────────────────────────────────────────────────────── */

import type { SVGProps } from "react";
import { VercelIcon } from "./ToolIcons";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps(size: number, props: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    ...props,
  } as const;
}

/* Vercel — triangle */
export function VercelIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <path
        d="M12 3 L22 21 L2 21 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* Paystack — two interlocking rounded bars */
export function PaystackIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <rect x="2" y="8" width="13" height="8" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9" y="6" width="13" height="8" rx="4" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

/* Whop — circular "W" badge */
export function WhopIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M7 9 L9 16 L11 11 L13 16 L15 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* TanStack — geometric stacked squares */
export function TanStackIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <rect x="3" y="3" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="12" y="3" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.15" />
      <rect x="3" y="12" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.15" />
      <rect x="12" y="12" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/* Neon — simple glow dot */
export function NeonIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, props)}>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.2" />
      <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* Map tool name to icon component */
export const TOOL_ICONS: Record<string, React.FC<IconProps>> = {
  Neon: NeonIcon,
  Vercel: VercelIcon,
  Paystack: PaystackIcon,
  Whop: WhopIcon,
  "TanStack Start": TanStackIcon,
};
