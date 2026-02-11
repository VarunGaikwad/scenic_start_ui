export const HEXAGON_DIMENSIONS = {
  width: 112,
  height: 90,
  size: 120,
};

export const SVG_PATHS = {
  HEXAGON_SOFT:
    "M 60 10 C 62 10 70 14 78 18 L 96 28 C 102 31 106 36 106 44 L 106 76 C 106 84 102 89 96 92 L 78 102 C 70 106 62 110 60 110 C 58 110 50 106 42 102 L 24 92 C 18 89 14 84 14 76 L 14 44 C 14 36 18 31 24 28 L 42 18 C 50 14 58 10 60 10 Z",
  CLIP_PATH:
    "path('M 60 10 C 62 10 70 14 78 18 L 96 28 C 102 31 106 36 106 44 L 106 76 C 106 84 102 89 96 92 L 78 102 C 70 106 62 110 60 110 C 58 110 50 106 42 102 L 24 92 C 18 89 14 84 14 76 L 14 44 C 14 36 18 31 24 28 L 42 18 C 50 14 58 10 60 10 Z')",
};

export const STORAGE_KEYS = {
  // Auth & User
  AUTH_TOKEN: "scenic:v1:auth:token",
  LOGIN_TIMESTAMP: "scenic:v1:auth:login_timestamp",
  USER_NAME: "scenic:v1:user:name",
  USER_EMAIL: "scenic:v1:user:email",

  // Bookmarks
  BOOKMARK_TREE: "scenic:v1:bookmarks:tree",
  ACTIVE_TREE_ID: "scenic:v1:bookmarks:active_tree_id",

  // Weather
  WEATHER_INFO: "scenic:v1:weather:info",
  WEATHER_TIMESTAMP: "scenic:v1:weather:timestamp",
  COORDS: "scenic:v1:weather:coords",

  // Quotes
  QUOTE_PREFERENCE: "scenic:v1:quote:preference",
  SHAYARI_DATA: "scenic:v1:quote:shayari_data",
  QUOTE_DATA: "scenic:v1:quote:quote_data",

  // Settings
  SEARCH_ENGINE: "scenic:v1:settings:search_engine",

  // Calendar
  CALENDAR_TASKS: "scenic:v1:calendar:tasks",

  // Background
  BACKGROUND_DATA: "scenic:v1:background:data",
};

export const CACHE_DURATIONS = {
  WEATHER: 30 * 60 * 1000,
};

export const UI_CONSTANTS = {
  FLIP_DURATION_MS: 600,
  FLIP_HALFWAY_MS: 300,
};
