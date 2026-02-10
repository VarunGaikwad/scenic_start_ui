import { useMemo, useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import { postBookmarkLink } from "@/api";
import type { BookmarkTreeType } from "@/interface";

type Props = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  activeTreeId: string;
  onSuccess: (bookmark: BookmarkTreeType) => void;
};

// Move outside component - static function
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const MAX_TITLE_LENGTH = 100;

export default function AddLinkModal({
  isModalOpen,
  setIsModalOpen,
  activeTreeId,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState({ title: false, url: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTitle("");
      setUrl("");
      setTouched({ title: false, url: false });
      setApiError("");
    }
  }, [isModalOpen]);

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

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setIsModalOpen(false);
    }
  }, [isSubmitting, setIsModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched to show errors
    setTouched({ title: true, url: true });

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const normalizedUrl = normalizeUrl(url);

      const createdBookmark = await postBookmarkLink(
        title.trim(),
        normalizedUrl,
        activeTreeId,
      );

      onSuccess(createdBookmark);

      // Close and reset
      setIsModalOpen(false);
      // Reset will happen via useEffect when modal closes
    } catch (error: any) {
      console.error("Add link error:", error);

      if (error.response?.status === 409) {
        setApiError("This link already exists in this folder.");
      } else if (error.response?.status === 400) {
        setApiError(error.response.data?.message || "Invalid link data.");
      } else if (!navigator.onLine) {
        setApiError("You're offline. Please check your connection.");
      } else {
        setApiError("Failed to add link. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      title="Add new link"
      size="sm"
    >
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

        {apiError && (
          <p className="text-xs text-red-400 text-center" role="alert">
            {apiError}
          </p>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-zinc-700 py-2.5 text-white font-medium
              transition-all
              hover:bg-zinc-600
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-white font-medium
              transition-all
              hover:bg-blue-500
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding…" : "Add link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
