import {
  deleteBookmark,
  getBookmarkTree,
  postBookmarkFolder,
  postBookmarkLink,
  putBookmark,
} from "@/api";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";
import { BookmarkAddButton, BookmarkButton, Modal } from "@/widget";
import { Plus } from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";

const KEY = "userBookmarks";

interface Bookmark {
  _id: string;
  userId: string;
  type: string;
  title: string;
  parentId: string | null;
  url: string | null;
  createdAt: string;
  children: Bookmark[];
}

interface Content {
  name: string;
  content: string;
  type: "link" | null;
}

export default function Bookmarks() {
  const [listOfBookmarks, setListOfBookmarks] = useState<Bookmark[]>(
    (getDataFromLocalStorage(KEY) as Bookmark[]) || [],
  );

  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(
    listOfBookmarks[0]?._id || null,
  );

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  const [folderInput, setFolderInput] = useState("");
  const [contentPayload, setContentPayload] = useState<Content>({
    name: "",
    content: "",
    type: "link",
  });

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    bookmarkId: string;
    bookmarkTitle: string;
  } | null>(null);

  const [editingBookmark, setEditingBookmark] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // ---------------- Helpers ----------------
  const findBookmarkById = (
    bookmarks: Bookmark[],
    id: string,
  ): Bookmark | null => {
    for (const b of bookmarks) {
      if (b._id === id) return b;
      if (b.children.length > 0) {
        const found = findBookmarkById(b.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateBookmarkInTree = (
    bookmarks: Bookmark[],
    id: string,
    updater: (b: Bookmark) => Bookmark,
  ): Bookmark[] => {
    return bookmarks.map((b) => {
      if (b._id === id) return updater(b);
      if (b.children.length > 0) {
        return {
          ...b,
          children: updateBookmarkInTree(b.children, id, updater),
        };
      }
      return b;
    });
  };

  const removeBookmarkFromTree = (
    bookmarks: Bookmark[],
    id: string,
  ): Bookmark[] => {
    return bookmarks
      .filter((b) => b._id !== id)
      .map((b) => ({ ...b, children: removeBookmarkFromTree(b.children, id) }));
  };

  // ---------------- Effects ----------------
  useEffect(() => {
    getBookmarkTree().then(({ data }) => {
      setListOfBookmarks(data);
      if (data.length > 0) setActiveBookmarkId(data[0]._id);
    });
  }, []);

  useEffect(() => {
    setDataToLocalStorage(KEY, listOfBookmarks);
    if (
      activeBookmarkId &&
      !findBookmarkById(listOfBookmarks, activeBookmarkId)
    ) {
      setActiveBookmarkId(listOfBookmarks[0]?._id || null);
    }
  }, [listOfBookmarks]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu]);

  // ---------------- Handlers ----------------
  const handleClickFolder = (id: string) => setActiveBookmarkId(id);

  const handleContextMenu = (
    e: MouseEvent<HTMLDivElement>,
    bookmarkId: string,
    bookmarkTitle: string,
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, bookmarkId, bookmarkTitle });
  };

  const handleEditFolder = () => {
    if (contextMenu) {
      setEditingBookmark({
        id: contextMenu.bookmarkId,
        title: contextMenu.bookmarkTitle,
      });
      setFolderInput(contextMenu.bookmarkTitle);
      setIsFolderModalOpen(true);
      setContextMenu(null);
    }
  };

  const handleDeleteFolder = async () => {
    if (!contextMenu) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${contextMenu.bookmarkTitle}"? All its children will also be deleted.`,
    );
    if (!confirmDelete) return;

    try {
      await deleteBookmark(contextMenu.bookmarkId);
      setListOfBookmarks((prev) =>
        removeBookmarkFromTree(prev, contextMenu.bookmarkId),
      );

      if (activeBookmarkId === contextMenu.bookmarkId) {
        setActiveBookmarkId(listOfBookmarks[0]?._id || null);
      }

      setContextMenu(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFolderSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingBookmark) {
        await putBookmark(editingBookmark.id, { title: folderInput });
        setListOfBookmarks((prev) =>
          updateBookmarkInTree(prev, editingBookmark.id, (b) => ({
            ...b,
            title: folderInput,
          })),
        );
        setActiveBookmarkId(editingBookmark.id);
        setEditingBookmark(null);
      } else {
        const { data } = await postBookmarkFolder(folderInput);
        setListOfBookmarks((prev) => [...prev, data]);
        setActiveBookmarkId(data._id);
      }
      setIsFolderModalOpen(false);
      setFolderInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddContentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contentPayload.name || !contentPayload.content || !activeBookmarkId)
      return;

    const parent = findBookmarkById(listOfBookmarks, activeBookmarkId);
    if (!parent) return console.error("Parent folder not found!");

    try {
      const { data } = await postBookmarkLink(
        contentPayload.name,
        contentPayload.content,
        parent._id,
      );
      setListOfBookmarks((prev) =>
        updateBookmarkInTree(prev, parent._id, (b) => ({
          ...b,
          children: [...b.children, data],
        })),
      );
      setContentPayload({ name: "", content: "", type: "link" });
      setIsContentModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- Render ----------------
  const activeFolder = activeBookmarkId
    ? findBookmarkById(listOfBookmarks, activeBookmarkId)
    : null;

  return (
    <div className="flex-1 flex flex-col gap-5">
      {/* Folder bar */}
      <div className="flex gap-2.5 overflow-x-auto text-xs">
        {listOfBookmarks.map(({ _id, title }) => (
          <div
            key={_id}
            onContextMenu={(e) => handleContextMenu(e, _id, title)}
          >
            <BookmarkButton
              active={activeBookmarkId === _id}
              onClick={() => handleClickFolder(_id)}
            >
              {title}
            </BookmarkButton>
          </div>
        ))}
        {listOfBookmarks.length < 5 && (
          <BookmarkAddButton
            onClick={() => {
              setEditingBookmark(null);
              setFolderInput("");
              setIsFolderModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white text-black border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleEditFolder}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteFolder}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
          >
            Delete
          </button>
        </div>
      )}

      {/* Folder modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingBookmark(null);
          setFolderInput("");
        }}
        title={editingBookmark ? "Edit Folder" : "Add Folder"}
        size="lg"
      >
        <form
          onSubmit={handleAddFolderSubmit}
          className="flex flex-col gap-5 w-full max-w-md mx-auto text-sm font-medium"
        >
          <input
            value={folderInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFolderInput(e.target.value)
            }
            placeholder="Enter Folder name..."
            className="bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none p-2 text-sm"
          />
          <button
            type="submit"
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            {editingBookmark ? "Update Folder" : "Add Folder"}
          </button>
        </form>
      </Modal>

      {/* Add content modal */}
      <Modal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        title="Add Content"
        size="lg"
      >
        <form
          onSubmit={handleAddContentSubmit}
          className="flex flex-col gap-5 w-full max-w-md mx-auto text-sm font-medium"
        >
          <input
            value={contentPayload.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setContentPayload((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter Content Name..."
            className="bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none p-2 text-sm"
          />
          <input
            value={contentPayload.content}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setContentPayload((prev) => ({
                ...prev,
                content: e.target.value,
              }))
            }
            placeholder="Enter Content..."
            className="bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none p-2 text-sm"
          />
          <select
            value={contentPayload.type || "link"}
            onChange={(e) =>
              setContentPayload((prev) => ({
                ...prev,
                type: e.target.value as "link",
              }))
            }
            className="bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none p-2 text-sm"
          >
            <option value="link">Link</option>
          </select>
          <button
            type="submit"
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300 text-sm"
          >
            Add Content
          </button>
        </form>
      </Modal>

      {/* Children / content inline */}
      <div className="flex flex-wrap gap-3 mt-4">
        {/* Add content button */}
        {activeFolder && (
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer hover:bg-black/5 transition-colors duration-200"
            onClick={() => {
              setIsContentModalOpen(true);
              setContentPayload({ name: "", content: "", type: "link" });
            }}
          >
            <Plus size={20} />
          </div>
        )}

        {/* Render children */}
        {activeFolder?.children.map((child) => (
          <a
            key={child._id}
            href={child.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-black/5 transition-colors duration-200"
          >
            {child.url && (
              <img
                src={`https://favicon.vemetric.com/${new URL(child.url).hostname}`}
                alt={child.title}
                className="w-4 h-4 object-cover rounded-sm"
              />
            )}
            <span className="text-xs truncate max-w-[80px]">{child.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
