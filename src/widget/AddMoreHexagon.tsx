import { useState } from "react";
import LinkModal from "./LinkModal";
import type { BookmarkTreeType } from "@/interface";
import { HEXAGON_DIMENSIONS, SVG_PATHS } from "@/constants";

export default function AddMoreHexagon({
  size = HEXAGON_DIMENSIONS.size,
  activeTreeId,
  onSuccess,
}: {
  size?: number;
  onSuccess: (bookmark: BookmarkTreeType) => void;
  activeTreeId: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center justify-center transition-opacity duration-200 hover:opacity-90 cursor-pointer"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 120"
          width="100%"
          height="100%"
          className="overflow-visible"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glass hexagon background with soft corners */}
          <path
            d={SVG_PATHS.HEXAGON_SOFT}
            fill="rgba(0,0,0,0.35)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />

          {/* Plus icon */}
          <line
            x1="60"
            y1="40"
            x2="60"
            y2="65"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1="47.5"
            y1="52.5"
            x2="72.5"
            y2="52.5"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Label */}
          <text
            x="60"
            y="85"
            textAnchor="middle"
            fontSize="10"
            fontWeight="500"
            fill="rgba(255,255,255,0.7)"
            letterSpacing="0.02em"
            className="uppercase tracking-tight select-none"
          >
            Add More
          </text>
        </svg>
      </button>

      {/* Modal rendered as sibling, not child of button */}
      <LinkModal
        onSuccess={onSuccess}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        activeTreeId={activeTreeId}
      />
    </>
  );
}
