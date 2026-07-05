"use client";

import { useState } from "react";

type Props = {
  product: string;
  displayName: string;
  size?: number;
};

const stripName = (product: string) => product.replace(/^Desc_/, "").replace(/_C$/, "");

const initialsColor = (name: string): string => {
  // Simple hash → hue.
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 45%, 42%)`;
};

const initials = (name: string): string => {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Renders a product icon at /icons/IconDesc_{name}.png. Icons don't exist for
 * every product (169 icons vs 361 products), so on load-error we fall back to
 * a colored initials avatar.
 */
export function ProductIcon({ product, displayName, size = 28 }: Props) {
  const [broken, setBroken] = useState(false);
  const url = `/icons/IconDesc_${stripName(product)}.png`;

  if (broken) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          background: initialsColor(displayName),
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size * 0.42),
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, sans-serif",
          flexShrink: 0
        }}
        aria-label={displayName}
      >
        {initials(displayName)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={displayName}
      width={size}
      height={size}
      onError={() => setBroken(true)}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        imageRendering: "auto"
      }}
    />
  );
}
