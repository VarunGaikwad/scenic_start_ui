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
    listOfBookmarks.length > 0 ? listOfBookmarks[0]._id : null,
  );

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [contentPayload, setContentPayload] = useState<Content>({
    name: "",
    content: "",
    type: null,
  });
  const [folderInput, setFolderInput] = useState("");

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

  // -------------------- Helpers --------------------
  const findBookmarkById = (
    bookmarks: Bookmark[],
    id: string,
  ): Bookmark | null => {
    for (const bookmark of bookmarks) {
      if (bookmark._id === id) return bookmark;
      if (bookmark.children.length > 0) {
        const found = findBookmarkById(bookmark.children, id);
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
      .map((b) => ({
        ...b,
        children: removeBookmarkFromTree(b.children, id),
      }));
  };

  // -------------------- Effects --------------------
  // Load bookmarks from API
  useEffect(() => {
    getBookmarkTree().then(({ data }) => {
      setListOfBookmarks(data);
      if (data.length > 0) setActiveBookmarkId(data[0]._id);
    });
  }, []);

  // Save to localStorage and ensure active bookmark exists
  useEffect(() => {
    setDataToLocalStorage(KEY, listOfBookmarks);
    if (
      activeBookmarkId &&
      !findBookmarkById(listOfBookmarks, activeBookmarkId)
    ) {
      setActiveBookmarkId(listOfBookmarks[0]?._id || null);
    }
  }, [listOfBookmarks]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu]);

  // -------------------- Handlers --------------------
  const handleClick = (id: string) => {
    setActiveBookmarkId(id);
  };

  const handleContextMenu = (
    event: MouseEvent<HTMLDivElement>,
    bookmarkId: string,
    bookmarkTitle: string,
  ) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      bookmarkId,
      bookmarkTitle,
    });
  };

  const handleEdit = () => {
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

  const handleDelete = async () => {
    if (contextMenu) {
      try {
        const answer = confirm(
          `Are you sure you want to delete "${contextMenu.bookmarkTitle}"? All its children will also be deleted.`,
        );
        if (!answer) return;

        await deleteBookmark(contextMenu.bookmarkId);

        setListOfBookmarks((prev) =>
          removeBookmarkFromTree(prev, contextMenu.bookmarkId),
        );

        // Update active bookmark if needed
        if (activeBookmarkId === contextMenu.bookmarkId) {
          setActiveBookmarkId(listOfBookmarks[0]?._id || null);
        }

        setContextMenu(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const renderBookmarks = (bookmarks: Bookmark[]) => {
    return bookmarks.map((bookmark) => (
      <div key={bookmark._id} className="ml-4 mt-1">
        <div
          className="flex items-center gap-2"
          onContextMenu={(e) =>
            handleContextMenu(e, bookmark._id, bookmark.title)
          }
        >
          <BookmarkButton
            active={activeBookmarkId === bookmark._id}
            onClick={() => handleClick(bookmark._id)}
          >
            {bookmark.title}
          </BookmarkButton>

          {bookmark.type === "link" && bookmark.url && (
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-xs underline"
            >
              Open
            </a>
          )}
        </div>

        {/* Recursively render children */}
        {bookmark.children.length > 0 && (
          <div className="ml-4">{renderBookmarks(bookmark.children)}</div>
        )}
      </div>
    ));
  };

  const onAddFolderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  const onAddContentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!contentPayload.name || !contentPayload.content || !activeBookmarkId)
        return;

      const parentFolder = findBookmarkById(listOfBookmarks, activeBookmarkId);
      if (!parentFolder) {
        console.error("Parent folder not found!");
        return;
      }

      const { data } = await postBookmarkLink(
        contentPayload.name,
        contentPayload.content,
        parentFolder._id,
      );

      setListOfBookmarks((prev) =>
        updateBookmarkInTree(prev, parentFolder._id, (b) => ({
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

  // -------------------- Render --------------------
  return (
    <div className="flex-1 flex flex-col gap-5">
      {/* Top folder buttons */}
      <div className="text-xs flex gap-2.5">
        {listOfBookmarks.map(({ _id, title }) => (
          <div
            key={_id}
            onContextMenu={(e) => handleContextMenu(e, _id, title)}
          >
            <BookmarkButton
              active={activeBookmarkId === _id}
              onClick={() => handleClick(_id)}
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
          onSubmit={onAddFolderSubmit}
          className="flex flex-col gap-5 w-full max-w-md mx-auto text-sm font-medium"
        >
          <input
            value={folderInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFolderInput(e.target.value)
            }
            className="bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none p-2 placeholder-gray-400 text-sm"
            placeholder="Enter Folder name..."
          />
          <button
            type="submit"
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            {editingBookmark ? "Update Folder" : "Add Folder"}
          </button>
        </form>
      </Modal>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white text-black border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
          >
            Delete
          </button>
        </div>
      )}

      {/* Add content button */}
      <div className="flex-1">
        {listOfBookmarks.length > 0 && (
          <div className="size-10 bg-black/15 grid place-content-center rounded-xl hover:bg-black cursor-pointer hover:border-dashed hover:border-2 transition-all duration-200 ease-in">
            <Plus
              onClick={() => {
                setIsContentModalOpen(true);
                setContentPayload({ name: "", content: "", type: "link" });
              }}
            />

            <Modal
              isOpen={isContentModalOpen}
              onClose={() => setIsContentModalOpen(false)}
              title="Add Content"
              size="lg"
            >
              <form
                onSubmit={onAddContentSubmit}
                className="flex flex-col gap-5 w-full max-w-md mx-auto text-sm font-medium"
              >
                <input
                  value={contentPayload.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setContentPayload((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none p-2 placeholder-gray-400 text-sm"
                  placeholder="Enter Content Name..."
                />
                <input
                  value={contentPayload.content}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setContentPayload((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none p-2 placeholder-gray-400 text-sm"
                  placeholder="Enter Content..."
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
          </div>
        )}
      </div>
    </div>
  );
}
