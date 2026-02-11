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
import { useEffect, useState, useRef } from "react";

export default function Bookmarks() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [tree, setTree] = useState<BookmarkTreeType[]>(() => {
    return (getDataFromLocalStorage("tree") as BookmarkTreeType[] | null) || [];
  });

  const [activeTreeId, setActiveTreeId] = useState<string | null>(() => {
    const activeId = getDataFromLocalStorage("app:activeTreeId:v1") as
      | string
      | null;
    return activeId || tree[0]?._id || null;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerRow, setItemsPerRow] = useState(8);
  const [gridOffset, setGridOffset] = useState(0);

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
    setDataToLocalStorage("app:activeTreeId:v1", activeTreeId);
  }, [activeTreeId]);

  // Set default activeTreeId if none exists
  useEffect(() => {
    if (!activeTreeId && tree.length > 0) {
      setActiveTreeId(tree[0]._id);
    }
  }, [activeTreeId, tree]);

  // Fetch bookmark tree from API on mount
  useEffect(() => {
    let cancelled = false;

    (async function () {
      setIsLoading(true);
      try {
        const data = await getBookmarkTree();
        if (!cancelled) {
          setTree(data);
          setDataToLocalStorage(STORAGE_KEYS.TREE, data);

          // Preserve active ID if it still exists, otherwise use first
          setActiveTreeId((prev) => {
            if (prev && data.some((item) => item._id === prev)) {
              return prev;
            }
            return data[0]?._id || null;
          });
        }
      } catch (error) {
        console.error("Failed to fetch bookmark tree:", error);
        // Keep cached data on error
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDataToLocalStorage("tree", tree);
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

      deleteBookmark(id)
        .then(() => {
          if (type === "folder" && !parentId) {
            // Deleting a top-level folder
            setTree((prev) => {
              const newArray = prev.filter((folder) => folder._id !== id);

              // Update cache
              setDataToLocalStorage(STORAGE_KEYS.TREE, newArray);

              // Update active ID if deleted folder was active
              if (activeTreeId === id) {
                setActiveTreeId(newArray[0]?._id || null);
              }

              return newArray;
            });
          } else {
            // Deleting a bookmark inside a folder
            setTree((prev) => {
              const newTree = prev.map((folder) => {
                if (folder._id === parentId) {
                  return {
                    ...folder,
                    children: folder.children.filter(
                      (child) => child._id !== id,
                    ),
                  };
                }
                return folder;
              });

              // Update cache
              setDataToLocalStorage(STORAGE_KEYS.TREE, newTree);

              return newTree;
            });
          }
        })
        .catch((error) => {
          console.error("Failed to delete bookmark:", error);
          alert("Failed to delete. Please try again.");
        });
    },
    [activeTreeId],
  );

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
  const containerHeight =
    totalRows * (HEX_SIZE - HEX_VERTICAL_OVERLAP) + HEX_VERTICAL_OVERLAP;

  const addButtonPosition = getHexPosition(children.length);

  return (
    <div className="flex-1 px-5 py-3">
      <div className="flex gap-4">
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
                    setDataToLocalStorage(STORAGE_KEYS.TREE, newTree);
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
