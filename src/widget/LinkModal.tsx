import { useMemo, useState, useEffect } from "react";
import Modal from "./Modal";
import { postBookmarkLink, putBookmark, postEmbedWidget } from "@/api";
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
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [touched, setTouched] = useState({ title: false, url: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [linkType, setLinkType] = useState<"link" | "embed">("link");

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (isModalOpen) {
      setTitle(initialTitle);
      setUrl(initialUrl);
      setTouched({ title: false, url: false });
      setTouched({ title: false, url: false });
      setApiError("");
      setLinkType("link");
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
    if (!touched.url) return "";
    if (!url.trim()) return "URL is required";

    try {
      new URL(normalizeUrl(url));
      return "";
    } catch {
      return "Invalid URL";
    }
  }, [url, touched.url]);

  const isFormValid = useMemo(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
      return false;
    }

    try {
      new URL(normalizeUrl(url));
      return true;
    } catch {
      return false;
    }
  }, [title, url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched to show errors
    setTouched({ title: true, url: true });

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      let result: BookmarkTreeType;

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

        if (linkType === "embed") {
          result = await postEmbedWidget(
            title.trim(),
            normalizedUrl,
            activeTreeId,
          );
        } else {
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
        `Failed to ${isEditMode ? "update" : "add"} link. Try again.`,
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
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {
          /* Type Selector */
          !isEditMode && (
            <div className="flex gap-6 border-b border-white/10 pb-1 mb-4">
              <button
                type="button"
                onClick={() => setLinkType("link")}
                className={`text-sm font-medium pb-2 -mb-1.5 transition-colors relative ${
                  linkType === "link"
                    ? "text-blue-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-400"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                Bookmark
              </button>
              <button
                type="button"
                onClick={() => setLinkType("embed")}
                className={`text-sm font-medium pb-2 -mb-1.5 transition-colors relative ${
                  linkType === "embed"
                    ? "text-blue-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-400"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                Embed Website
              </button>
            </div>
          )
        }

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
            placeholder="Q1 Marketing Dashboard"
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

        {/* URL */}
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

        {/* Embed Preview */}
        {linkType === "embed" && url && !urlError && (
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Embed Preview</label>
            <div className="w-full h-48 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden relative group">
              <iframe
                src={normalizeUrl(url)}
                className="w-full h-full border-none opacity-50 group-hover:opacity-100 transition-opacity"
                title="Preview"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-white/50 bg-black/20 group-hover:bg-transparent transition-colors">
                <span className="bg-black/60 px-2 py-1 rounded backdrop-blur-sm group-hover:opacity-0 transition-opacity">
                  Check if content loads here
                </span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">
              Note: If the preview is blank or shows an error, this website
              likely prevents embedding.
            </p>
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
              : "Add Link"}
        </button>
      </form>
    </Modal>
  );
}
