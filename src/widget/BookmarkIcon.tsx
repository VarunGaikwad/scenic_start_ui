import type { BookmarkTreeType } from "@/interface";
import { Pencil, Trash2 } from "lucide-react";

interface BookmarkIconProps {
  bookmark: BookmarkTreeType;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BookmarkIcon({
  bookmark,
  index,
  onEdit,
  onDelete,
}: BookmarkIconProps) {
  const hostname = bookmark.url ? new URL(bookmark.url).hostname : "";
  const faviconUrl = `https://scenic-start-node-ten.vercel.app/api/auth/favorite-icon?domain=${hostname}`;

  return (
    <div
      className="group flex flex-col items-center gap-3 w-24 cursor-pointer relative"
      style={{
        animation: `fadeSlideUp 0.4s ease-out ${index * 40}ms both`,
      }}
    >
      {/* Icon tile */}
      <div
        className="relative w-16 h-16 rounded-2xl bg-white/5 border border-white/[0.08] shadow-sm flex items-center justify-center group-hover:bg-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:border-white/20 transition-all duration-300 overflow-visible"
        onClick={() => {
          if (bookmark.url) location.assign(bookmark.url);
        }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/json",
            JSON.stringify({ id: bookmark._id, type: "bookmark" }),
          );
        }}
      >
        <img
          src={faviconUrl}
          alt={bookmark.title}
          className="w-8 h-8 rounded-md object-contain drop-shadow-md"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
          }}
        />

        {/* Floating Actions (Outside) */}
        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 scale-90 group-hover:scale-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white/80 hover:text-white border border-white/10 shadow-lg hover:scale-110 transition-all"
            title="Edit"
          >
            <Pencil size={10} strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-full bg-zinc-800/90 hover:bg-red-500 text-red-400 hover:text-white border border-white/10 hover:border-red-500 shadow-lg hover:scale-110 transition-all"
            title="Delete"
          >
            <Trash2 size={10} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col items-center w-full gap-0.5">
        <span
          className="text-[11px] font-medium text-white/60 text-center leading-tight w-full truncate group-hover:text-white/90 transition-colors"
          title={bookmark.title}
          onClick={() => bookmark.url && window.open(bookmark.url)}
        >
          {bookmark.title}
        </span>

        {/* Hostname subtitle - visible on hover */}
        <span className="text-[9px] text-white/30 truncate w-full text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
          {hostname}
        </span>
      </div>
    </div>
  );
}
