import { deleteBookmark, getBookmarkTree, postBookmarkFolder } from "@/api";
import type { BookmarkTreeType } from "@/interface";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import {
  AddFolderCard,
  AddMoreHexagon,
  FolderCard,
  HoneyCombFavIcon,
} from "@/widget";
import { useEffect, useState, useRef } from "react";

export default function Bookmarks() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [tree, setTree] = useState<BookmarkTreeType[]>(() => {
    return (getDataFromLocalStorage("tree") as BookmarkTreeType[] | null) || [];
  });

  const [activeTreeId, setActiveTreeId] = useState<string | null>(() => {
    const localTree = getDataFromLocalStorage("tree") as
      | BookmarkTreeType[]
      | null;
    return localTree && localTree.length > 0 ? localTree[0]._id : null;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerRow, setItemsPerRow] = useState(8);

  // Calculate items per row based on container width
  useEffect(() => {
    const updateItemsPerRow = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const hexWidth = 112; // Adjusted for rounded corners
        const calculated = Math.floor(containerWidth / hexWidth);
        setItemsPerRow(Math.max(3, calculated)); // Minimum 3 items
      }
    };

    updateItemsPerRow();
    window.addEventListener("resize", updateItemsPerRow);
    return () => window.removeEventListener("resize", updateItemsPerRow);
  }, []);

  // Fetch bookmark tree from API on mount
  useEffect(() => {
    (async function () {
      const { data } = await getBookmarkTree();
      setTree(data);
      setActiveTreeId((prev) => prev || data[0]?._id || null);
    })();
  }, []);

  useEffect(() => {
    setDataToLocalStorage("tree", tree);
  }, [tree]);

  // Delete folder
  const onDelete = (id?: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this folder?",
    );
    if (!confirmDelete) return;

    deleteBookmark(id!).then(() => {
      setTree((prev) => {
        const newArray = prev.filter(({ _id }) => _id !== id);
        if (activeTreeId === id) {
          setActiveTreeId(newArray[0]?._id || null);
        }
        return newArray;
      });
    });
  };

  const { children } = tree.find(({ _id }) => _id === activeTreeId) || {
    children: [],
  };

  const onSuccess = (item: BookmarkTreeType) => {
    setTree((prev) =>
      prev.map((folder) =>
        folder._id === activeTreeId
          ? { ...folder, children: [...folder.children, item] }
          : folder,
      ),
    );
  };

  const getHexPosition = (index: number) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const isOddRow = row % 2 === 1;

    const hexWidth = 112; // Adjusted: 120 - 8 (horizontal overlap)
    const hexHeight = 90; // Adjusted: 120 - 30 (vertical overlap)

    const left = col * hexWidth + (isOddRow ? 56 : 0); // Half of hexWidth for offset
    const top = row * hexHeight;

    return { left, top };
  };

  const totalItems = children.length + 1;
  const totalRows = Math.ceil(totalItems / itemsPerRow);
  const containerHeight = totalRows * 90 + 30;

  return (
    <div className="flex-1 px-5 py-3">
      <div className="flex gap-4">
        {tree.map(({ title, _id }) => (
          <FolderCard
            key={_id}
            title={title}
            isActive={_id === activeTreeId}
            onClick={() => setActiveTreeId(_id)}
            onDelete={() => onDelete(_id)}
            onRename={(newName) =>
              setTree((prev) =>
                prev.map((f) => (f._id === _id ? { ...f, title: newName } : f)),
              )
            }
          />
        ))}

        {isAddingNew ? (
          <FolderCard
            editable
            title=""
            onEnterPress={(newName) => {
              if (!newName.trim()) {
                setIsAddingNew(false);
                return;
              }
              postBookmarkFolder(newName).then(({ data }) => {
                setTree((prev) => [...prev, data]);
                setActiveTreeId(data._id);
                setIsAddingNew(false);
              });
            }}
            onClick={() => {}}
          />
        ) : (
          <AddFolderCard onClick={() => setIsAddingNew(true)} />
        )}
      </div>

      {/* Honeycomb Grid */}
      <div className="mt-8" ref={containerRef}>
        <div
          style={{
            position: "relative",
            height: `${containerHeight}px`,
          }}
        >
          {children.map((bookmark, index) => {
            const { left, top } = getHexPosition(index);
            console.log(bookmark);
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                }}
              >
                <HoneyCombFavIcon {...bookmark} size={120} />
              </div>
            );
          })}

          {(() => {
            const { left, top } = getHexPosition(children.length);
            return (
              <div
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                }}
              >
                <AddMoreHexagon
                  size={120}
                  activeTreeId={activeTreeId || ""}
                  onSuccess={onSuccess}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
