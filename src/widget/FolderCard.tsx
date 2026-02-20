import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

interface FolderCardProps {
  _id?: string;
  title?: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  editable?: boolean;
  onRename?: (newName: string) => void;
  onEnterPress?: (newName: string) => void;
  onDrop?: (item: { id: string; type: string }) => void;
}

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
}: FolderCardProps) {
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
      } else if (_id && onRename) {
        onRename(value);
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setValue(title || "");
      setIsEditing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (onDrop) {
        onDrop(data);
      }
    } catch (error) {
      console.error("Failed to parse drop data:", error);
    }
  };

  const baseClasses =
    "group relative flex items-center justify-center px-5 py-2 rounded-xl transition-all duration-300 ease-out select-none cursor-pointer border backdrop-blur-sm";

  const activeClasses = isActive
    ? "bg-white/15 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)] text-white scale-105 font-semibold"
    : "bg-black/20 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105";

  const dragClasses = isDragOver
    ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent scale-105 bg-blue-500/20"
    : "";

  return (
    <div
      className={`${baseClasses} ${activeClasses} ${dragClasses}`}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (editable && onEnterPress) {
              onEnterPress(value);
            }
            setIsEditing(false);
          }}
          className="bg-transparent outline-none text-center w-full text-sm font-medium placeholder-white/20"
          placeholder="Folder name"
        />
      ) : (
        <span
          className="text-sm tracking-wide"
          onDoubleClick={() => !editable && setIsEditing(true)}
        >
          {title || "New Folder"}
        </span>
      )}

      {onDelete && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg scale-0 group-hover:scale-100"
          title="Delete Folder"
        >
          <Trash2 size={10} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
