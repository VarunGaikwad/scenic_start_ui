export const STORAGE_KEYS = {
  // Auth & User
  // AUTH_TOKEN: "scenic:v1:auth:token",
  // LOGIN_TIMESTAMP: "scenic:v1:auth:login_timestamp",
  USER_NAME: "scenic:v1:user:name",
  USER_EMAIL: "scenic:v1:user:email",

  // Bookmarks
  BOOKMARK_TREE: "scenic:v1:bookmarks:tree",
  ACTIVE_TREE_ID: "scenic:v1:bookmarks:active_tree_id",
  FAVORITE_ICONS: "scenic:v1:favicons",

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

  QUOTE_LAST_FETCH: "scenic:v1:quote:last_fetch",

  LRT_SOURCE: "scenic:v1:lrt:source",
  LRT_DESTINATION: "scenic:v1:lrt:destination",
  LRT_WALK_BUFFER: "scenic:v1:lrt:walk_buffer",
  LRT_STATIONS: "scenic:v1:lrt:stations",
  LRT_SCHEDULE_CACHE: "scenic:v1:lrt:schedule_cache",

  LAST_AUTH_TIMESTAMP: "scenic:v1:last_auth_timestamp",

  PUNCHOUT_DATA: "scenic:v1:punchout:data",
  PUNCHOUT_TARGET: "scenic:v1:punchout:target",
};

export const CACHE_DURATIONS = {
  WEATHER: 30 * 60 * 1000,
};

export const UI_CONSTANTS = {
  FLIP_DURATION_MS: 600,
  FLIP_HALFWAY_MS: 300,
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const ITEM_H = 40 as const;

export { DAYS, MONTHS, ITEM_H };
