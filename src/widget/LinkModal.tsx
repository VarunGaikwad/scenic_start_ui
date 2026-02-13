import { useMemo, useState, useEffect } from "react";
import Modal from "./Modal";
import { postBookmarkLink, postBookmarkWidget, putBookmark } from "@/api";
import type { BookmarkTreeType } from "@/interface";

const MAX_TITLE_LENGTH = 100;

type Props = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  activeTreeId?: string;
  onSuccess: (bookmark: BookmarkTreeType) => void;
  // Edit mode props
  initialTitle?: string;
  initialUrl?: string;
  bookmarkId?: string;
  isEditMode?: boolean;
};

export default function LinkModal({
  isModalOpen,
  setIsModalOpen,
  activeTreeId,
  onSuccess,
  initialTitle = "",
  initialUrl = "",
  bookmarkId,
  isEditMode = false,
}: Props) {
  const [type, setType] = useState<"link" | "widget">("link");
  const [widgetType, setWidgetType] = useState("LRT");
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [touched, setTouched] = useState({ title: false, url: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (isModalOpen) {
      setTitle(initialTitle);
      setUrl(initialUrl);
      setTouched({ title: false, url: false });
      setApiError("");
      setType("link");
    }
  }, [isModalOpen, initialTitle, initialUrl]);

  const normalizeUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : `https://${value}`;

  const titleError = useMemo(() => {
    if (!touched.title) return "";
    const trimmed = title.trim();
    if (trimmed.length === 0) return "Title is required";
    if (trimmed.length > MAX_TITLE_LENGTH) {
      return `Max ${MAX_TITLE_LENGTH} characters`;
    }
    return "";
  }, [title, touched.title]);

  const urlError = useMemo(() => {
    if (type === "widget") return "";
    if (!touched.url) return "";
    if (!url.trim()) return "URL is required";

    try {
      new URL(normalizeUrl(url));
      return "";
    } catch {
      return "Invalid URL";
    }
  }, [url, touched.url, type]);

  const isFormValid = useMemo(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
      return false;
    }

    if (type === "link") {
      try {
        new URL(normalizeUrl(url));
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, [title, url, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched to show errors
    setTouched({ title: true, url: true });

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      let result: BookmarkTreeType;

      if (type === "widget") {
        if (!activeTreeId) throw new Error("Parent ID required for new widget");
        result = await postBookmarkWidget(
          title.trim(),
          widgetType,
          activeTreeId,
        );
      } else {
        const normalizedUrl = normalizeUrl(url);

        if (isEditMode && bookmarkId) {
          await putBookmark(bookmarkId, {
            title: title.trim(),
            url: normalizedUrl,
          });
          // Mock the object to return for immediate UI update
          result = {
            _id: bookmarkId,
            title: title.trim(),
            url: normalizedUrl,
            type: "link",
            parentId: activeTreeId || "",
            children: [],
          };
        } else {
          if (!activeTreeId) throw new Error("Parent ID required for new link");
          result = await postBookmarkLink(
            title.trim(),
            normalizedUrl,
            activeTreeId,
          );
        }
      }

      onSuccess(result);
      setIsModalOpen(false);
    } catch {
      setApiError(
        `Failed to ${isEditMode ? "update" : "add"} ${type}. Try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={isEditMode ? "Edit link" : "Add new item"}
      size="sm"
    >
      {!isEditMode && (
        <div className="flex bg-zinc-800 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setType("link")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              type === "link"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Link
          </button>
          <button
            type="button"
            onClick={() => setType("widget")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              type === "widget"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Widget
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Title */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="bookmark-title" className="text-sm text-zinc-400">
              Title
            </label>
            <span className="text-xs text-zinc-500">
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>
          <input
            id="bookmark-title"
            type="text"
            autoFocus
            placeholder={
              type === "link" ? "Q1 Marketing Dashboard" : "My Widget"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            maxLength={MAX_TITLE_LENGTH}
            autoComplete="off"
            disabled={isSubmitting}
            className={`w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-white
              border transition-all outline-none
              focus:ring-2 focus:ring-blue-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                titleError
                  ? "border-red-500/60"
                  : "border-white/10 focus:border-blue-500/60"
              }`}
          />
          {titleError && (
            <p className="mt-1 text-xs text-red-400" role="alert">
              {titleError}
            </p>
          )}
        </div>

        {/* URL or Widget Type */}
        {type === "link" ? (
          <div>
            <label
              htmlFor="bookmark-url"
              className="block text-sm mb-1 text-zinc-400"
            >
              URL
            </label>
            <input
              id="bookmark-url"
              type="url"
              placeholder="example.com/dashboard"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, url: true }))}
              autoComplete="url"
              disabled={isSubmitting}
              className={`w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-white
                border transition-all outline-none
                focus:ring-2 focus:ring-blue-500/50
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  urlError
                    ? "border-red-500/60"
                    : "border-white/10 focus:border-blue-500/60"
                }`}
            />
            {urlError && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {urlError}
              </p>
            )}
            {url && !urlError && touched.url && (
              <p className="mt-1 text-xs text-zinc-500">
                Will be saved as: {normalizeUrl(url)}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor="widget-type"
              className="block text-sm mb-1 text-zinc-400"
            >
              Widget Type
            </label>
            <select
              id="widget-type"
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-white border border-white/10 outline-none focus:border-blue-500/60"
            >
              <option value="LRT">LRT Card</option>
            </select>
          </div>
        )}

        {apiError && (
          <p className="text-xs text-red-400 text-center" role="alert">
            {apiError}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium
            transition-all
            hover:bg-blue-500
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isEditMode
              ? "Saving..."
              : "Adding…"
            : isEditMode
              ? "Save changes"
              : `Add ${type}`}
        </button>
      </form>
    </Modal>
  );
}
