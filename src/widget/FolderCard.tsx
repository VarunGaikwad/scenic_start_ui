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
  readOnly = false,
}: FolderCardProps) {
  const [isEditing, setIsEditing] = useState(!_id); // New folders start in edit mode
  const [value, setValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`bookmark-btn-common group relative flex items-center justify-center ${
        isActive ? "before:border-solid" : ""
      } ${isSaving ? "opacity-50 cursor-wait" : ""}`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className="absolute inset-0 w-full h-full px-4 text-center rounded-2xl bg-transparent border-none focus:outline-none disabled:cursor-wait"
          aria-label="Folder name"
        />
      ) : (
        <span className="truncate px-4">{title || "Unnamed Folder"}</span>
      )}

      {onDelete && !isEditing && !showDeleteConfirm && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="hover:text-red-500 absolute top-1 right-1 z-10 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          aria-label={`Delete folder ${title}`}
        >
          <Trash2 size={14} />
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
