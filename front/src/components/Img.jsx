import { useState } from "react";

const PALETTES = [
  "from-primary/20 to-primary/5",
  "from-primary-deep/15 to-primary-light",
];

/** 图片组件：加载失败时显示品牌色占位块。 */
export default function Img({ src, alt, className = "", ratio = "aspect-[4/3]" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${PALETTES[0]} ${ratio} ${className}`}
        role="img"
        aria-label={alt || "占位图"}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.2" className="text-primary/50" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="M4 18l5-5 3 3 4-4 4 4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
