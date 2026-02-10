export type BookmarkTreeType = {
  _id: string;
  title: string;
  type: "folder" | "link";
  url: string;
  parentId: string;
  children: BookmarkTreeType[];
};
