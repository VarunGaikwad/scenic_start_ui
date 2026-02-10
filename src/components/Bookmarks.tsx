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
} from "@/widget";
import { useEffect, useState, useRef, useCallback } from "react";

const STORAGE_KEYS = {
  TREE: "app:bookmarkTree:v1",
  ACTIVE_ID: "app:activeTreeId:v1",
} as const;

const HEX_SIZE = 120;
const HEX_HORIZONTAL_OVERLAP = 8;
const HEX_VERTICAL_OVERLAP = 30;

export default function Bookmarks() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [tree, setTree] = useState<BookmarkTreeType[]>(() => {
    try {
      const cached = getDataFromLocalStorage(STORAGE_KEYS.TREE);
      if (Array.isArray(cached)) {
        return cached;
      }
    } catch (error) {
      console.warn("Failed to load cached tree:", error);
    }
    return [];
  });

  const [activeTreeId, setActiveTreeId] = useState<string | null>(() => {
    try {
      const cached = getDataFromLocalStorage(STORAGE_KEYS.ACTIVE_ID);
      if (typeof cached === "string") {
        return cached;
      }
    } catch (error) {
      console.warn("Failed to load active tree ID:", error);
    }
    return null;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerRow, setItemsPerRow] = useState(8);

  // Calculate items per row based on container width
  useEffect(() => {
    const updateItemsPerRow = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const hexWidth = HEX_SIZE - HEX_HORIZONTAL_OVERLAP;
        const calculated = Math.floor(containerWidth / hexWidth);
        setItemsPerRow(Math.max(3, calculated));
      }
    };

    updateItemsPerRow();
    window.addEventListener("resize", updateItemsPerRow);
    return () => window.removeEventListener("resize", updateItemsPerRow);
  }, []);

  // Sync activeTreeId to localStorage
  useEffect(() => {
    if (activeTreeId) {
      setDataToLocalStorage(STORAGE_KEYS.ACTIVE_ID, activeTreeId);
    }
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

  const onDelete = useCallback(
    (id?: string, title?: string, type = "folder", parentId?: string) => {
      if (!id) return;

      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${title}"?`,
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

  const onSuccess = useCallback(
    (item: BookmarkTreeType) => {
      setTree((prev) => {
        const newTree = prev.map((folder) =>
          folder._id === activeTreeId
            ? { ...folder, children: [...folder.children, item] }
            : folder,
        );

        setDataToLocalStorage(STORAGE_KEYS.TREE, newTree);
        return newTree;
      });
    },
    [activeTreeId],
  );

  const getHexPosition = useCallback(
    (index: number) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const isOddRow = row % 2 === 1;

      const hexWidth = HEX_SIZE - HEX_HORIZONTAL_OVERLAP;
      const hexHeight = HEX_SIZE - HEX_VERTICAL_OVERLAP;

      const left = col * hexWidth + (isOddRow ? hexWidth / 2 : 0);
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
    <div className="flex-1 px-5 py-3 relative">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Folder tabs */}
      <div className="flex gap-4 overflow-x-auto pb-2">
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
            onRename={(newName) => {
              if (!_id) return;

              putBookmark(_id, { title: newName })
                .then(() => {
                  setTree((prev) => {
                    const newTree = prev.map((folder) =>
                      folder._id === _id
                        ? { ...folder, title: newName }
                        : folder,
                    );
                    setDataToLocalStorage(STORAGE_KEYS.TREE, newTree);
                    return newTree;
                  });
                })
                .catch((error) => {
                  console.error("Failed to rename folder:", error);
                  alert("Failed to rename. Please try again.");
                });
            }}
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
      <div className="mt-8" ref={containerRef}>
        <div
          style={{
            position: "relative",
            height: `${containerHeight}px`,
          }}
        >
          {children.map((bookmark, index) => {
            const { left, top } = getHexPosition(index);
            return (
              <div
                key={bookmark._id || index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                }}
              >
                <HoneyCombFavIcon
                  {...bookmark}
                  onDelete={onDelete}
                  size={HEX_SIZE}
                />
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: `${addButtonPosition.left}px`,
              top: `${addButtonPosition.top}px`,
            }}
          >
            <AddMoreHexagon
              size={HEX_SIZE}
              activeTreeId={activeTreeId || ""}
              onSuccess={onSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
