import { getBookmarkTree } from "@/api";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Bookmarks() {
  const [tree, setTree] = useState([]);
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  useEffect(() => {
    (async function () {
      const { data } = await getBookmarkTree();
      setTree(data);
    })();
  }, []);

  return (
    <div className="flex-1 px-5 py-3">
      <div className="flex gap-4">
        {tree.map(function ({ title, _id }) {
          return (
            <FolderCard
              key={_id}
              onClick={() => setActiveTreeId(_id)}
              title={title}
              isActive={_id === activeTreeId}
              onDelete={() => console.log(_id)}
            />
          );
        })}
        <AddFolderCard />
      </div>
    </div>
  );
}

function FolderCard({
  title,
  isActive = false,
  onClick,
  onDelete,
}: {
  title?: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bookmark-btn-common
        group
        relative
        flex
        items-center
        justify-center
        ${isActive ? "before:border-solid" : ""}
      `}
    >
      <span>{title || "Folder Name"}</span>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hover:text-red-700 cursor-pointer absolute top-1 right-1 z-10 p-1 opacity-0 pointer-events-none transition group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <Trash2 className="" size={14} />
        </button>
      )}
    </div>
  );
}

function AddFolderCard() {
  return (
    <div className="bookmark-btn-common flex items-center justify-center gap-2">
      <Plus size={16} />
      <span>Add Folder</span>
    </div>
  );
}
