import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { putBookmark } from "@/api"; // your API

export default function FolderCard({
  _id,
  title,
  isActive = false,
  onClick,
  onDelete,
  editable = false,
  onRename,
  onEnterPress,
  onDrop,
}: {
  _id?: string;
  title?: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  editable?: boolean;
  onRename?: (newName: string) => void;
  onEnterPress?: (newName: string) => void;
  onDrop?: (item: { id: string; type: string }) => void;
}) {
  const [isEditing, setIsEditing] = useState(editable);
  const [value, setValue] = useState(title || "");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (editable && onEnterPress) {
        onEnterPress(value);
      } else if (_id) {
        try {
          await putBookmark(_id, { title: value });
          onRename?.(value);
        } catch (err) {
          console.error("Rename failed", err);
          setValue(title || ""); // revert if API fails
        }
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setValue(title || "");
      setIsEditing(false);
    }
  };

  const baseClasses =
    "group relative flex items-center justify-center px-6 py-2.5 rounded-full transition-all duration-300 ease-out select-none cursor-pointer border";

  const activeClasses = isActive
    ? "bg-white/20 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] text-white scale-105"
    : "bg-black/30 border-white/10 text-white/70 hover:bg-black/50 hover:border-white/30 hover:text-white hover:scale-105 hover:shadow-lg";

  const dragClasses = isDragOver
    ? "ring-2 ring-white/50 scale-110 bg-white/20"
    : "";

  return (
    <div
      onClick={() => {
        if (!isEditing) onClick?.();
      }}
      onDoubleClick={() => {
        if (!editable) setIsEditing(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const bookmarkId = e.dataTransfer.getData("bookmarkId");
        if (bookmarkId && onDrop) {
          onDrop({ id: bookmarkId, type: "bookmark" });
        }
      }}
      className={`${baseClasses} ${activeClasses} ${dragClasses} min-w-[100px]`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsEditing(false);
            if (editable && !value.trim()) {
              onEnterPress?.("");
            }
          }}
          className="w-full bg-transparent text-center text-white outline-none placeholder:text-white/30"
          placeholder="New Folder"
        />
      ) : (
        <span className="font-medium tracking-wide truncate max-w-[150px]">
          {value || "Folder"}
        </span>
      )}

      {onDelete && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-1 -right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-sm"
          title="Delete Folder"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
}
