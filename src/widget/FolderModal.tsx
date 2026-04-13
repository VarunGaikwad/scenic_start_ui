import { useState, useMemo } from "react";
import Modal from "./Modal";
import { postBookmarkFolder, postBookmarkWidget, postEmbedWidget } from "@/api";
import type { BookmarkTreeType } from "@/interface";
import PunchOutCard from "./PunchOutCard";

const MAX_TITLE_LENGTH = 50;

type Props = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onSuccess: (folder: BookmarkTreeType) => void;
};

export default function FolderModal({
  isModalOpen,
  setIsModalOpen,
  onSuccess,
}: Props) {
  const [folderName, setFolderName] = useState("");
  const [hasWidget, setHasWidget] = useState(false);
  const [widgetType, setWidgetType] = useState("LRT");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const isFormValid = useMemo(() => {
    const trimmed = folderName.trim();
    const isValidName =
      trimmed.length > 0 && trimmed.length <= MAX_TITLE_LENGTH;
    if (hasWidget && widgetType === "EMBED") {
      return isValidName && embedUrl.trim().length > 0;
    }
    return isValidName;
  }, [folderName, hasWidget, widgetType, embedUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      // 1. Create Folder
      const folder = await postBookmarkFolder(folderName.trim());

      // 2. Add Widget if selected
      if (hasWidget) {
        if (widgetType === "EMBED") {
          const widget = await postEmbedWidget(
            folderName.trim(),
            embedUrl,
            folder._id,
          );
          // Manually update the local folder object to include the new widget
          folder.children = [widget];
        } else {
          const widget = await postBookmarkWidget(
            folderName.trim(), // Use folder name as widget title for consistency
            widgetType,
            folder._id,
          );
          // Manually update the local folder object to include the new widget
          folder.children = [widget];
        }
      }

      onSuccess(folder);
      setIsModalOpen(false);

      // Reset form
      setFolderName("");
      setHasWidget(false);
      setWidgetType("LRT");
      setEmbedUrl("");
    } catch (error) {
      console.error(error);
      setApiError("Failed to create folder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Create New Folder"
      size={hasWidget && widgetType === "PUNCHOUT" ? "lg" : "sm"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Folder Name */}
        <div>
          <label
            htmlFor="folder-name"
            className="block text-sm mb-1 text-zinc-400"
          >
            Folder Name
          </label>
          <input
            id="folder-name"
            type="text"
            autoFocus
            placeholder="e.g. Work, Travel, News"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-white border border-white/10 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-zinc-500">
              {folderName.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>
        </div>

        {/* Add Widget Option */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="has-widget"
              className="text-sm font-medium text-white cursor-pointer select-none"
            >
              Add a widget to this folder?
            </label>
            <input
              id="has-widget"
              type="checkbox"
              checked={hasWidget}
              onChange={(e) => setHasWidget(e.target.checked)}
              disabled={isSubmitting}
              className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-blue-600 focus:ring-blue-500/50 cursor-pointer accent-blue-500"
            />
          </div>

          {/* Widget Selection (Conditional) */}
          {hasWidget && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <label
                htmlFor="widget-type"
                className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5"
              >
                Select Widget Type
              </label>
              <select
                id="widget-type"
                value={widgetType}
                onChange={(e) => setWidgetType(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white border border-white/10 outline-none focus:border-blue-500/60"
              >
                <option value="LRT">LRT Card</option>
                <option value="PUNCHOUT">Punch Out Card</option>
                <option value="EMBED">Embed Website</option>
              </select>

              {widgetType === "PUNCHOUT" && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 border border-white/5 rounded-xl overflow-hidden bg-zinc-900/50">
                  <div className="scale-[0.8] origin-top -mb-20">
                    <PunchOutCard />
                  </div>
                </div>
              )}

              {widgetType === "EMBED" && (
                <div className="mt-3">
                  <label
                    htmlFor="embed-url"
                    className="text-xs text-zinc-500 block mb-1"
                  >
                    Website URL
                  </label>
                  <input
                    id="embed-url"
                    type="url"
                    placeholder="https://example.com"
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white border border-white/10 outline-none focus:border-blue-500/60"
                    required
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Note: Some websites may block embedding. Use the "Add Link"
                    button to check preview if unsure.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {apiError && (
          <p className="text-xs text-red-400 text-center" role="alert">
            {apiError}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
        >
          {isSubmitting ? "Creating..." : "Create Folder"}
        </button>
      </form>
    </Modal>
  );
}
