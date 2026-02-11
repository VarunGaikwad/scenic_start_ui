import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

interface FolderCardProps {
  _id?: string;
  title: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => Promise<void>;
  readOnly?: boolean; // Can't be renamed
}

export default function FolderCard({
  _id,
  title,
  isActive = false,
  onClick,
  onDelete,
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
  const clickTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync value with title prop changes
  useEffect(() => {
    setValue(title);
  }, [title]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = value.trim();

    if (!trimmed) {
      setValue(title);
      setIsEditing(false);
      return;
    }

    if (trimmed === title) {
      setIsEditing(false);
      return;
    }

    if (onRename) {
      setIsSaving(true);
      try {
        await onRename(trimmed);
        setIsEditing(false);
      } catch (error) {
        console.error("Rename failed:", error);
        setValue(title); // Revert on error
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleClick = () => {
    if (isEditing || showDeleteConfirm) return;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      onClick?.();
    }, 200);
  };

  const handleDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (!readOnly && !showDeleteConfirm) {
      setIsEditing(true);
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

      {onDelete && !isEditing && !showDeleteConfirm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="absolute -top-1 -right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-sm"
          title="Delete Folder"
        >
          <Trash2 size={10} />
        </button>
      )}

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/90 rounded-2xl flex items-center justify-center gap-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
          >
            Delete
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
            }}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
