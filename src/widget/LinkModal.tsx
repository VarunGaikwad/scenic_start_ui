import { useMemo, useState, useEffect } from "react";
import Modal from "./Modal";
import { postBookmarkLink, putBookmark } from "@/api";
import type { BookmarkTreeType } from "@/interface";

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

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (isModalOpen) {
        setTitle(initialTitle);
        setUrl(initialUrl);
        setTouched({ title: false, url: false });
        setApiError("");
    }
  }, [isModalOpen, initialTitle, initialUrl]);

  const normalizeUrl = (value: string) =>
    /^https?:\/\//i.test(value) ? value : `https://${value}`;

  const titleError = useMemo(() => {
    if (!touched.title) return "";
    if (title.trim().length < 3) return "Min 3 characters required";
    return "";
  }, [title, touched.title]);

  const urlError = useMemo(() => {
    if (!touched.url) return "";
    try {
      new URL(normalizeUrl(url));
      return "";
    } catch {
      return "Invalid URL";
    }
  }, [url, touched.url]);

  const isFormValid =
    title.trim().length >= 3 &&
    (() => {
      try {
        new URL(normalizeUrl(url));
        return true;
      } catch {
        return false;
      }
    })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const normalizedUrl = normalizeUrl(url.trim());

      let result: BookmarkTreeType;

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
             children: []
         };
      } else {
         if (!activeTreeId) throw new Error("Parent ID required for new link");
         result = await postBookmarkLink(
            title.trim(),
            normalizedUrl,
            activeTreeId,
         );
      }

      onSuccess(result);
      setIsModalOpen(false);
    } catch {
      setApiError(`Failed to ${isEditMode ? "update" : "add"} link. Try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={isEditMode ? "Edit link" : "Add new link"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Title */}
        <div>
          <label className="block text-sm mb-1 text-zinc-400">Title</label>
          <input
            autoFocus
            placeholder="Q1 Marketing Dashboard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            className={`w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-white
              border transition-all outline-none
              focus:ring-2 focus:ring-blue-500/50
              ${
                titleError
                  ? "border-red-500/60"
                  : "border-white/10 focus:border-blue-500/60"
              }`}
          />
          {titleError && (
            <p className="mt-1 text-xs text-red-400">{titleError}</p>
          )}
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm mb-1 text-zinc-400">URL</label>
          <input
            placeholder="intranet.company.com/dashboard"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, url: true }))}
            className={`w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-white
              border transition-all outline-none
              focus:ring-2 focus:ring-blue-500/50
              ${
                urlError
                  ? "border-red-500/60"
                  : "border-white/10 focus:border-blue-500/60"
              }`}
          />
          {urlError && <p className="mt-1 text-xs text-red-400">{urlError}</p>}
        </div>

        {apiError && (
          <p className="text-xs text-red-400 text-center">{apiError}</p>
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
          {isSubmitting ? (isEditMode ? "Saving..." : "Adding…") : (isEditMode ? "Save changes" : "Add link")}
        </button>
      </form>
    </Modal>
  );
}
