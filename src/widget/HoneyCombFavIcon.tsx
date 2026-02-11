import type { BookmarkTreeType } from "@/interface";
import { useMemo, useState } from "react";

interface HoneyCombFavIconProps extends BookmarkTreeType {
  size?: number;
  onDelete?: (
    id: string,
    title: string,
    type: "folder" | "link",
    parentId?: string,
  ) => void;
  isDeletable?: boolean;
  onEdit?: (item: BookmarkTreeType) => void;
}

import { HEXAGON_DIMENSIONS, SVG_PATHS } from "@/constants";

export default function HoneyCombFavIcon({
  url,
  _id,
  title,
  type,
  children,
  parentId,
  size = HEXAGON_DIMENSIONS.size,
  onDelete,
  isDeletable = true,
  onEdit,
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

  // const logoSrc = `https://favicon.vemetric.com/${hostname}`;
  const logoSrc = `https://scenic-start-node-ten.vercel.app/auth/favorite-icon?domain=${hostname}`;
  const fallbackSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (onDelete) {
      onDelete(_id, title, type, parentId);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit({ _id, title, url, type, parentId, children: children || [] });
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ id: _id, type: "bookmark" }),
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="relative inline-flex group"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={isDeletable} // Only draggable if it's a user bookmark (approx proxy)
      onDragStart={handleDragStart}
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

          {/* Glass hexagon - Always visible */}
          <svg
            d={SVG_PATHS.HEXAGON_SOFT}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            className="transition-all duration-300 group-hover:stroke-white/30 group-hover:fill-white/5"
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

      {/* Hover Overlay with Actions */}
      {isDeletable && (
        <div
          className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-200 ${
            isHovered
              ? "opacity-100 pointer-events-none"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Glass background for overlay */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: SVG_PATHS.CLIP_PATH,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(2px)",
            }}
          ></div>

          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="relative z-10 p-2 rounded-full bg-blue-600/80 hover:bg-blue-500 text-white transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20 pointer-events-auto"
              aria-label={`Edit ${title}`}
              title="Edit"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="relative z-10 p-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20 pointer-events-auto"
            aria-label={`Delete ${title}`}
            title="Delete"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
