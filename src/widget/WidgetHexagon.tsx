import { useState } from "react";
import { TrainFront, Clock, Trash2 } from "lucide-react";
import Modal from "./Modal";
import LRTCard from "./LRTCard";
import { HEXAGON_DIMENSIONS, SVG_PATHS } from "@/constants";
import type { BookmarkTreeType } from "@/interface";

interface WidgetHexagonProps extends BookmarkTreeType {
  size?: number;
  onDelete?: (
    id: string,
    title: string,
    type: string,
    parentId?: string,
  ) => void;
  isDeletable?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

export default function WidgetHexagon({
  _id,
  title,
  widgetType,
  parentId,
  size = HEXAGON_DIMENSIONS.size,
  onDelete,
  isDeletable = true,
  isOpen,
  onClose,
  onOpen,
}: WidgetHexagonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // If controlled (isOpen provided), use props. Otherwise use internal state.
  const isControlled = isOpen !== undefined;
  const showModal = isControlled ? isOpen : internalIsOpen;

  const handleOpen = () => {
    if (isControlled) {
      if (onOpen) onOpen();
    } else {
      setInternalIsOpen(true);
      if (onOpen) onOpen();
    }
  };

  const handleClose = () => {
    if (!isControlled) {
      setInternalIsOpen(false);
    }
    if (onClose) onClose();
  };

  // Sync internal state with external prop if provided
  if (isOpen !== undefined && isOpen !== internalIsOpen) {
    // We don't necessarily need to sync internal state if we use showModal derived from props,
    // but keeping it synced can be useful if we switch modes (unlikely).
    // Actually, setting state during render is bad. Let's rely on showModal.
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && parentId) {
      onDelete(_id, title, "widget", parentId);
    }
  };

  const Icon = widgetType === "LRT" ? TrainFront : Clock;

  return (
    <>
      <div
        className="relative inline-flex group cursor-pointer"
        style={{ width: size, height: size }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleOpen}
      >
        {/* Hexagon Background */}
        <svg
          viewBox="0 0 120 120"
          width="100%"
          height="100%"
          className="overflow-visible drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glass hexagon */}
          <path
            d={SVG_PATHS.HEXAGON_SOFT}
            fill="rgba(59, 130, 246, 0.15)" // Blue tint for widgets
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth={1.5}
            className="transition-all duration-300 group-hover:fill-blue-500/25 group-hover:stroke-blue-400"
          />

          {/* Icon Container using foreignObject to center Lucide icon */}
          <foreignObject x="30" y="30" width="60" height="60">
            <div className="w-full h-full flex items-center justify-center text-blue-300 group-hover:text-blue-200 transition-colors">
              <Icon size={32} />
            </div>
          </foreignObject>

          {/* Label */}
          <text
            x="60"
            y="92"
            textAnchor="middle"
            fontSize="10"
            fontWeight="500"
            fill="rgba(255,255,255,0.8)"
            className="pointer-events-none select-none uppercase tracking-wider"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {title.length > 10 ? `${title.slice(0, 10)}...` : title}
          </text>
        </svg>

        {/* Hover Overlay with Delete */}
        {isDeletable && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Glass background for overlay */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: SVG_PATHS.CLIP_PATH,
                backgroundColor: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(1px)",
              }}
            ></div>

            <button
              onClick={handleDelete}
              className="relative z-10 p-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white transition-all hover:scale-110 shadow-lg"
              title="Delete Widget"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={!!showModal} onClose={handleClose} title={title}>
        <div className="flex justify-center items-center w-full">
          {widgetType === "LRT" ? (
            <LRTCard variant="minimal" />
          ) : (
            <div className="text-white/70">Widget content not available</div>
          )}
        </div>
      </Modal>
    </>
  );
}
