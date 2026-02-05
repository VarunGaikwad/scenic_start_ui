// Get a value from localStorage
export const getDataFromLocalStorage = <T = unknown>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;

    // Try to parse JSON. If it fails, return string as-is
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.error(`Error getting "${key}" from localStorage:`, error);
    return null;
  }
};

// Set a value in localStorage
export const setDataToLocalStorage = (key: string, value: unknown): void => {
  try {
    const item =
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value);
    localStorage.setItem(key, item);
  } catch (error) {
    console.error(`Error setting "${key}" in localStorage:`, error);
  }
};

export const deleteDataFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error);
  }
};
