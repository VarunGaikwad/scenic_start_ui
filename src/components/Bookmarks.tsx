import {
  deleteBookmark,
  getBookmarkTree,
  postBookmarkFolder,
  putBookmark,
} from "@/api";
import type { BookmarkTreeType } from "@/interface";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import {
  AddFolderCard,
  AddMoreHexagon,
  FolderCard,
  HoneyCombFavIcon,
  LinkModal,
} from "@/widget";
import { HEXAGON_DIMENSIONS, STORAGE_KEYS } from "@/constants";
import { useEffect, useState, useRef } from "react";

export default function Bookmarks() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingBookmark, setEditingBookmark] =
    useState<BookmarkTreeType | null>(null);
  const [tree, setTree] = useState<BookmarkTreeType[]>(() => {
    return (
      (getDataFromLocalStorage(STORAGE_KEYS.BOOKMARK_TREE) as
        | BookmarkTreeType[]
        | null) || []
    );
  });

  const [activeTreeId, setActiveTreeId] = useState<string | null>(() => {
    const activeId = getDataFromLocalStorage(STORAGE_KEYS.ACTIVE_TREE_ID) as
      | string
      | null;
    return activeId || tree[0]?._id || null;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerRow, setItemsPerRow] = useState(8);
  const [gridOffset, setGridOffset] = useState(0);

  useEffect(() => {
    const updateItemsPerRow = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const hexWidth = HEXAGON_DIMENSIONS.width;

        const calculated = Math.floor(containerWidth / hexWidth);
        const count = Math.max(3, calculated);
        setItemsPerRow(count);

        const extraSpace = Math.max(0, containerWidth - count * hexWidth);
        setGridOffset(extraSpace / 2);
      }
    };

    updateItemsPerRow();
    window.addEventListener("resize", updateItemsPerRow);
    return () => window.removeEventListener("resize", updateItemsPerRow);
  }, []);

  useEffect(() => {
    setDataToLocalStorage(STORAGE_KEYS.ACTIVE_TREE_ID, activeTreeId);
  }, [activeTreeId]);

  // Fetch bookmark tree from API on mount
  useEffect(() => {
    (async function () {
      const { data } = await getBookmarkTree();
      setTree(data);
      setActiveTreeId((prev) => prev || data[0]?._id || null);
    })();
  }, []);

  useEffect(() => {
    setDataToLocalStorage(STORAGE_KEYS.BOOKMARK_TREE, tree);
  }, [tree]);

  const onDelete = (
    id?: string,
    title?: string,
    type = "folder",
    parentId?: string,
  ) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete " + title + "?",
    );
    if (!confirmDelete) return;

    deleteBookmark(id!).then(() => {
      if (type === "folder" && !parentId) {
        setTree((prev) => {
          const newArray = prev.filter(({ _id }) => _id !== id);
          if (activeTreeId === id) {
            setActiveTreeId(newArray[0]?._id || null);
          }
          return newArray;
        });
      } else {
        setTree((prev) => {
          return prev.map((folder) => {
            if (folder._id === parentId) {
              folder.children = folder.children.filter(({ _id }) => _id !== id);
            }
            return folder;
          });
        });
      }
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

  const onMoveBookmark = (bookmarkId: string, targetFolderId: string) => {
    // 1. Find the bookmark and its current parent
    let bookmarkToMove: BookmarkTreeType | undefined;

    // Create a deep copy to modify
    const newTree = JSON.parse(JSON.stringify(tree)) as BookmarkTreeType[];

    // Remove from old location
    newTree.forEach((folder) => {
      const index = folder.children.findIndex((c) => c._id === bookmarkId);
      if (index !== -1) {
        bookmarkToMove = folder.children[index];
        folder.children.splice(index, 1);
      }
    });

    if (!bookmarkToMove) return;

    // Add to new location
    const targetFolder = newTree.find((f) => f._id === targetFolderId);
    if (targetFolder) {
      // Update parentId of the bookmark object in memory
      bookmarkToMove.parentId = targetFolderId;
      targetFolder.children.push(bookmarkToMove);
      setTree(newTree);

      // Persist change
      putBookmark(bookmarkId, { parentId: targetFolderId });
    }
  };

  const getHexPosition = (index: number) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const isOddRow = row % 2 === 1;

    const hexWidth = HEXAGON_DIMENSIONS.width;
    const hexHeight = HEXAGON_DIMENSIONS.height;

    const left = col * hexWidth + (isOddRow ? 56 : 0) + gridOffset;
    const top = row * hexHeight;

    return { left, top };
  };

  const totalItems = children.length + 1;
  const totalRows = Math.ceil(totalItems / itemsPerRow);
  const containerHeight = totalRows * 90 + 30;

  return (
    <div className="flex-1 px-5 py-3 w-full">
      <div className="flex gap-4 justify-center flex-wrap">
        {tree.map(({ title, type, _id }) => (
          <FolderCard
            key={_id}
            _id={_id}
            title={title}
            isActive={_id === activeTreeId}
            onClick={() => {
              setActiveTreeId(_id);
            }}
            onDelete={() => onDelete(_id, title, type)}
            onRename={(newName) =>
              putBookmark(_id!, { title: newName }).then(() => {
                setTree((prev) =>
                  prev.map((folder) =>
                    folder._id === _id ? { ...folder, title: newName } : folder,
                  ),
                );
              })
            }
            onDrop={({ id }) => onMoveBookmark(id, _id)}
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
      <div className="mt-8 mx-auto" ref={containerRef}>
        <div
          key={activeTreeId} // Force re-render on folder change to trigger animations
          style={{
            position: "relative",
            height: `${containerHeight}px`,
          }}
        >
          {children.map((bookmark, index) => {
            const { left, top } = getHexPosition(index);
            return (
              <div
                key={`${activeTreeId}-${index}`}
                className="animate-fade-up opacity-0 fill-mode-forwards"
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  transition: "all 0.5s ease-out",
                  animationDelay: `${index * 30}ms`,
                  animationFillMode: "forwards",
                }}
              >
                <HoneyCombFavIcon
                  {...bookmark}
                  onDelete={onDelete}
                  size={HEXAGON_DIMENSIONS.size}
                  onEdit={(item) => setEditingBookmark(item)}
                />
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
                  transition: "all 0.5s ease-out",
                }}
              >
                <AddMoreHexagon
                  size={HEXAGON_DIMENSIONS.size}
                  activeTreeId={activeTreeId || ""}
                  onSuccess={onSuccess}
                />
              </div>
            );
          })()}
        </div>
        {editingBookmark && (
          <LinkModal
            isModalOpen={!!editingBookmark}
            setIsModalOpen={(open) => {
              if (!open) setEditingBookmark(null);
            }}
            activeTreeId={activeTreeId || ""}
            isEditMode={true}
            initialTitle={editingBookmark.title}
            initialUrl={editingBookmark.url}
            bookmarkId={editingBookmark._id}
            onSuccess={(updatedItem) => {
              setTree((prev) =>
                prev.map((folder) => {
                  // Check if the bookmark is in this folder
                  const index = folder.children.findIndex(
                    (c) => c._id === updatedItem._id,
                  );
                  if (index !== -1) {
                    const newChildren = [...folder.children];
                    newChildren[index] = {
                      ...newChildren[index],
                      ...updatedItem,
                    };
                    return { ...folder, children: newChildren };
                  }
                  return folder;
                }),
              );
              setEditingBookmark(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
