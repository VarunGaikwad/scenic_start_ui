export type BookmarkTreeType = {
  _id: string;
  title: string;
  type: "folder" | "link" | "widget";
  url: string;
  parentId: string;
  children: BookmarkTreeType[];
  widgetType?: string;
  shortcut?: string;
};
