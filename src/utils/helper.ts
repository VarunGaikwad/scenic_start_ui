export const insertString = (original: string, insert: string, index: number) =>
  original.slice(0, index) + insert + original.slice(index);

export const sliceString = (
  original: string,
  startIndex: number,
  length: number,
): string =>
  original.slice(0, startIndex) + original.slice(startIndex + length);

export const getFaviconUrl = (url: string, domain: string, size = 64) => {
  // Try Chrome extension favicon service first if available
  try {
    if (typeof window !== "undefined") {
      const chrome = (window as any).chrome;
      if (chrome && chrome.runtime && chrome.runtime.id) {
        return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url || `https://${domain}`)}&size=${size}`;
      }
    }
  } catch (e) {
    // Fallback if chrome is not available
  }

  // Fallback to proxy
  return `https://scenic-start-node-ten.vercel.app/api/unauth/favorite-icon?domain=${domain}`;
};
