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
}: {
  _id?: string;
  title?: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  editable?: boolean;
  onRename?: (newName: string) => void;
  onEnterPress?: (newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(editable);
  const [value, setValue] = useState(title || "");
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
        // New folder creation
        onEnterPress(value);
      } else if (_id) {
        try {
          // Call API to update title
          await putBookmark(_id, { title: value });
          onRename?.(value); // update parent state
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

  return (
    <div
      onClick={() => {
        if (!isEditing) onClick?.();
      }}
      onDoubleClick={() => {
        if (!editable) setIsEditing(true);
      }}
      className={`bookmark-btn-common group relative flex items-center justify-center ${
        isActive ? "before:border-solid" : ""
      }`}
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
              onEnterPress?.(""); // notify parent that it's empty
            }
          }}
          className="
      absolute inset-0
      w-full h-full
      px-4
      text-center
      rounded-2xl
      bg-transparent
      border-none
      focus:outline-none
    "
        />
      ) : (
        <span>{value || "Folder Name"}</span>
      )}

      {onDelete && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hover:text-red-700 cursor-pointer absolute top-1 right-1 z-10 p-1 opacity-0 pointer-events-none transition group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
