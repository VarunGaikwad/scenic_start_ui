import { LinkModal, FolderCard, TranslationCard, FolderModal } from "@/widget";
import LRTCard from "@/widget/LRTCard";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { STORAGE_KEYS } from "@/constants";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { deleteBookmark, getBookmarkTree, putBookmark } from "@/api";
import type { BookmarkTreeType } from "@/interface";
import { useEffect, useState, useCallback } from "react";

export default function Dashboard() {
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

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingBookmark, setEditingBookmark] =
    useState<BookmarkTreeType | null>(null);

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
      try {
        const data = await getBookmarkTree();
        setTree((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data)) {
            return prev;
          }
          return data;
        });

        const firstFolder = data.find((item) => item.type === "folder");
        setActiveTreeId((prev) => prev || firstFolder?._id || null);
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      }
    })();
  }, []);

  useEffect(() => {
    setDataToLocalStorage(STORAGE_KEYS.BOOKMARK_TREE, tree);
  }, [tree]);

  const onDelete = useCallback(
    (id?: string, title?: string, type = "folder", parentId?: string) => {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete " + title + "?",
      );
      if (!confirmDelete) return;

      deleteBookmark(id!).then(() => {
        if (type === "folder" && !parentId) {
          setTree((prev) => {
            const newArray = prev.filter(({ _id }) => _id !== id);
            if (activeTreeId === id) {
              const firstFolder = newArray.find(
                (item) => item.type === "folder",
              );
              setActiveTreeId(firstFolder?._id || null);
            }
            return newArray;
          });
        } else {
          setTree((prev) => {
            return prev.map((folder) => {
              if (folder._id === parentId) {
                folder.children = folder.children.filter(
                  ({ _id }) => _id !== id,
                );
              }
              return folder;
            });
          });
        }
      });
    },
    [activeTreeId],
  );

  const onSuccess = useCallback(
    (item: BookmarkTreeType) => {
      setTree((prev) =>
        prev.map((folder) =>
          folder._id === activeTreeId
            ? { ...folder, children: [...folder.children, item] }
            : folder,
        ),
      );
    },
    [activeTreeId],
  );

  const activeFolder = tree.find((folder) => folder._id === activeTreeId);
  const children = activeFolder?.children || [];
  const bookmarks = children.filter((c) => c.type !== "widget");

  // Collect widgets only from the ACTIVE folder
  const activeWidgets = children.filter((c) => c.type === "widget");

  const folders = tree.filter((item) => item.type === "folder");

  return (
    <div className="w-full flex flex-col gap-10 font-sans text-white pb-20">
      {/* ── Folder Tabs ── */}
      {folders.length > 0 && (
        <nav className="flex items-center gap-2 flex-wrap px-1">
          {folders.map(({ title, type, _id }) => (
            <div key={_id} className="relative group">
              <FolderCard
                _id={_id}
                title={title}
                isActive={_id === activeTreeId}
                onClick={() => setActiveTreeId(_id)}
                onDelete={() => onDelete(_id, title, type)}
                onRename={(newName) =>
                  putBookmark(_id!, { title: newName }).then(() =>
                    getBookmarkTree().then(setTree),
                  )
                }
                onDrop={(item) => {
                  if (
                    item.type === "bookmark" &&
                    item.id &&
                    _id !== activeTreeId
                  ) {
                    putBookmark(item.id, { parentId: _id }).then(() =>
                      getBookmarkTree().then(setTree),
                    );
                  }
                }}
              />
            </div>
          ))}

          {/* New folder inline */}
          {/* New folder button - triggers modal */}
          <button
            onClick={() => setIsAddingFolder(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-dashed border-white/15 text-white/40 hover:text-white/70 text-sm transition-all duration-200"
            title="New collection"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">New</span>
          </button>
        </nav>
      )}

      {/* ── Widgets (Scoped to Active Folder) ── */}
      {activeWidgets.length > 0 && (
        <section className="w-full">
          <div
            className={
              activeWidgets.length === 1
                ? "w-full"
                : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            }
          >
            {activeWidgets.map((widget, i) => (
              <div
                key={widget._id}
                className="relative group w-full"
                style={{
                  animation: `fadeSlideUp 0.5s ease-out ${i * 80}ms both`,
                }}
              >
                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(
                      widget._id,
                      widget.title,
                      "widget",
                      widget.parentId,
                    );
                  }}
                  className="absolute -top-2 -right-2 z-20 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500 hover:scale-110 shadow-lg"
                  title="Remove widget"
                >
                  <Plus className="rotate-45 w-3.5 h-3.5" />
                </button>

                <div className="transition-transform duration-300 hover:scale-[1.005]">
                  {widget.widgetType === "LRT" ? (
                    <div className="max-w-xl mx-auto w-full">
                      <LRTCard variant="default" />
                    </div>
                  ) : widget.widgetType === "TRANSLATION" ? (
                    <TranslationCard />
                  ) : (
                    <div className="w-full h-44 bg-white/[0.04] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-6 border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
                      <span className="text-lg font-light tracking-wide text-white/70">
                        {widget.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bookmarks Grid ── */}
      {/* Only show bookmarks if no widgets are present in this folder */}
      {activeWidgets.length === 0 && (
        <section className="w-full">
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-5 gap-y-7 justify-items-center">
              {bookmarks.map((bookmark, i) => (
                <BookmarkIcon
                  key={bookmark._id}
                  bookmark={bookmark}
                  index={i}
                  onEdit={() => setEditingBookmark(bookmark)}
                  onDelete={() =>
                    onDelete(
                      bookmark._id,
                      bookmark.title,
                      "link",
                      bookmark.parentId,
                    )
                  }
                />
              ))}

              {/* Add link */}
              <button
                onClick={() => setIsAddingLink(true)}
                className="group flex flex-col items-center gap-2.5 w-[88px] cursor-pointer"
                title="Add a new bookmark"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-dashed border-white/15 flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-white/30 transition-all duration-250">
                  <Plus className="w-6 h-6 text-white/25 group-hover:text-white/60 transition-colors" />
                </div>
                <span className="text-[11px] font-medium text-white/25 group-hover:text-white/50 transition-colors">
                  Add link
                </span>
              </button>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <FolderOpen className="w-7 h-7 text-white/20" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/40">
                  {activeFolder
                    ? `No links in "${activeFolder.title}" yet`
                    : "No collection selected"}
                </p>
                <p className="text-xs text-white/25 mt-1">
                  Add your first bookmark to get started
                </p>
              </div>
              <button
                onClick={() => setIsAddingLink(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sm text-white/60 hover:text-white/90 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add your first link
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Link Modal ── */}
      {(editingBookmark || isAddingLink) && (
        <LinkModal
          isModalOpen={!!editingBookmark || isAddingLink}
          setIsModalOpen={(open) => {
            if (!open) {
              setEditingBookmark(null);
              setIsAddingLink(false);
            }
          }}
          activeTreeId={activeTreeId || ""}
          isEditMode={!!editingBookmark}
          initialTitle={editingBookmark?.title || ""}
          initialUrl={editingBookmark?.url || ""}
          bookmarkId={editingBookmark?._id}
          onSuccess={(updatedItem) => {
            if (isAddingLink) {
              onSuccess(updatedItem);
              setIsAddingLink(false);
            } else {
              setTree((prev) =>
                prev.map((folder) => {
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
            }
          }}
        />
      )}

      {/* ── Folder Modal ── */}
      <FolderModal
        isModalOpen={isAddingFolder}
        setIsModalOpen={setIsAddingFolder}
        onSuccess={(newFolder) => {
          setTree((prev) => [...prev, newFolder]);
          setActiveTreeId(newFolder._id);
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Bookmark Icon – App-style with contextual actions
   ───────────────────────────────────────────── */
function BookmarkIcon({
  bookmark,
  index,
  onEdit,
  onDelete,
}: {
  bookmark: BookmarkTreeType;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hostname = bookmark.url ? new URL(bookmark.url).hostname : "";
  const faviconUrl = `https://scenic-start-node-ten.vercel.app/auth/favorite-icon?domain=${hostname}`;

  return (
    <div
      className="group flex flex-col items-center gap-2.5 w-[88px] cursor-pointer relative"
      style={{
        animation: `fadeSlideUp 0.4s ease-out ${index * 40}ms both`,
      }}
    >
      {/* Icon tile */}
      <div
        className="relative w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.07] shadow-sm flex items-center justify-center group-hover:bg-white/[0.09] group-hover:shadow-lg group-hover:scale-105 transition-all duration-250 overflow-hidden"
        onClick={() => window.open(bookmark.url, "_blank")}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/json",
            JSON.stringify({ id: bookmark._id, type: "bookmark" }),
          );
        }}
      >
        <img
          src={faviconUrl}
          alt={bookmark.title}
          className="w-8 h-8 rounded-md object-contain"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
          }}
        />

        {/* Action overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5 text-white/90" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-300" />
          </button>
        </div>
      </div>

      {/* Title */}
      <span
        className="text-[11px] font-medium text-white/50 text-center leading-tight w-full truncate group-hover:text-white/80 transition-colors"
        title={bookmark.title}
        onClick={() => window.open(bookmark.url, "_blank")}
      >
        {bookmark.title}
      </span>

      {/* Hostname subtitle - visible on hover */}
      <span className="text-[9px] text-white/20 -mt-1.5 truncate w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
        {hostname}
      </span>
    </div>
  );
}
