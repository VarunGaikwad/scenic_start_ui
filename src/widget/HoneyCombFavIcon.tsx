import type { BookmarkTreeType } from "@/interface";
import { useMemo, useState } from "react";

interface HoneyCombFavIconProps extends BookmarkTreeType {
  size?: number;
  onDelete?: (
    url: string,
    title: string,
    type: "folder" | "link",
    parentId?: string,
  ) => void;
  isDeletable?: boolean;
}

export default function HoneyCombFavIcon({
  url,
  _id,
  title,
  type,
  parentId,
  size = 120,
  onDelete,
  isDeletable = true,
}: HoneyCombFavIconProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hostname = useMemo(() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  }, [url]);

  const logoSrc = `https://favicon.vemetric.com/${hostname}`;
  const fallbackSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onDelete) {
      onDelete(_id, title, type, parentId);
    }
  };

  return (
    <div
      className="relative inline-flex group"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex hover:opacity-90 transition-opacity duration-200 focus:outline-none rounded-lg"
        style={{ width: size, height: size }}
        aria-label={`Open ${title}`}
      >
        <svg
          viewBox="0 0 120 120"
          width="100%"
          height="100%"
          className="overflow-visible drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-labelledby={`favicon-${hostname}`}
        >
          <title id={`favicon-${hostname}`}>{title}</title>

          {/* Glass hexagon */}
          <path
            d="M 63,10 L 100,33 Q 105,36 105,42 L 105,78 Q 105,84 100,87 L 63,110 Q 60,112 57,110 L 20,87 Q 15,84 15,78 L 15,42 Q 15,36 20,33 L 57,10 Q 60,8 63,10 Z"
            fill="rgba(0,0,0,0.35)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />

          {/* Favicon with fallback */}
          <image
            href={imageError ? fallbackSrc : logoSrc}
            x="42"
            y="28"
            width="36"
            height="36"
            opacity="0.9"
            preserveAspectRatio="xMidYMid meet"
            onError={() => setImageError(true)}
          />

          {/* Label */}
          <text
            x="60"
            y="88"
            textAnchor="middle"
            fontSize="10"
            fontWeight="500"
            fill="rgba(255,255,255,0.7)"
            letterSpacing="0.02em"
            className="pointer-events-none select-none"
          >
            {title.length > 12 ? `${title.slice(0, 12)}...` : title}
          </text>
        </svg>
      </a>

      {/* Delete button - only show if deletable and hovered */}
      {isDeletable && isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 z-10 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label={`Delete ${title}`}
          type="button"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
