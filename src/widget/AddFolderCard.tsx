import { Plus } from "lucide-react";

export default function AddFolderCard({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ease-out select-none cursor-pointer border bg-black/30 border-white/10 text-white/70 hover:bg-black/50 hover:border-white/30 hover:text-white hover:scale-105 hover:shadow-lg min-w-[120px]"
    >
      <Plus size={16} />
      <span className="font-medium tracking-wide">Add Folder</span>
    </div>
  );
}
