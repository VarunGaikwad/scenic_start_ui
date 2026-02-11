import {
  deleteBookmark,
  getBookmarks,
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
import { STORAGE_KEYS } from "@/constants";
import { useEffect, useState, useRef, useCallback } from "react";

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
    const firstFolder = tree.find((item) => item.type === "folder");
    return activeId || firstFolder?._id || null;
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

  // Sync activeTreeId to localStorage
  useEffect(() => {
    setDataToLocalStorage(STORAGE_KEYS.ACTIVE_TREE_ID, activeTreeId);
  }, [activeTreeId]);

  // Set default activeTreeId if none exists
  useEffect(() => {
    if (!activeTreeId && tree.length > 0) {
      const firstFolder = tree.find((item) => item.type === "folder");
      if (firstFolder) {
        setActiveTreeId(firstFolder._id);
      }
    }
  }, [activeTreeId, tree]);

  // Fetch bookmark tree from API on mount
  useEffect(() => {
    (async function () {
      const data = await getBookmarkTree();
      setTree(data);
      const firstFolder = data.find((item) => item.type === "folder");
      setActiveTreeId((prev) => prev || firstFolder?._id || null);
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
            const firstFolder = newArray.find((item) => item.type === "folder");
            setActiveTreeId(firstFolder?._id || null);
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

  const onSuccess = (item: BookmarkTreeType) => {
    setTree((prev) =>
      prev.map((folder) =>
        folder._id === activeTreeId
          ? { ...folder, children: [...folder.children, item] }
          : folder,
      ),
    );
  };

  const getHexPosition = useCallback(
    (index: number) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const isOddRow = row % 2 === 1;

      const hexWidth = 112; // Adjusted: 120 - 8 (horizontal overlap)
      const hexHeight = 90; // Adjusted: 120 - 30 (vertical overlap)

      const left = col * hexWidth + (isOddRow ? 56 : 0); // Half of hexWidth for offset
      const top = row * hexHeight;

      return { left, top };
    },
    [itemsPerRow],
  );

  const activeFolder = tree.find((folder) => folder._id === activeTreeId);
  const children = activeFolder?.children || [];

  const totalItems = children.length + 1;
  const totalRows = Math.ceil(totalItems / itemsPerRow);
  const containerHeight = totalRows * 90 + 30;

  return (
    <div className="flex-1 px-5 py-3">
      <div className="flex gap-4">
        {tree
          .filter((item) => item.type === "folder")
          .map(({ title, type, _id }) => (
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
                      folder._id === _id
                        ? { ...folder, title: newName }
                        : folder,
                    ),
                  );
                })
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

              postBookmarkFolder(newName)
                .then((data) => {
                  setTree((prev) => {
                    const newTree = [...prev, data];
                    setDataToLocalStorage(STORAGE_KEYS.BOOKMARK_TREE, newTree);
                    return newTree;
                  });
                  setActiveTreeId(data._id);
                  setIsAddingNew(false);
                })
                .catch((error) => {
                  console.error("Failed to create folder:", error);
                  alert("Failed to create folder. Please try again.");
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
                key={index}
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
                  size={120}
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
