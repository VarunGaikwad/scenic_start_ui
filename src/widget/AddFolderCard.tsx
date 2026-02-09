import { Plus } from "lucide-react";

export default function AddFolderCard({ onClick }: { onClick?: () => void }) {
  return (
    <div
      className="bookmark-btn-common flex items-center justify-center gap-2 cursor-pointer"
      onClick={onClick}
    >
      <Plus size={16} />
      <span>Add Folder</span>
    </div>
  );
}
