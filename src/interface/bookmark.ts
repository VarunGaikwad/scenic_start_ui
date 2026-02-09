export type BookmarkTreeType = {
  _id: string;
  title: string;
  url?: string;
  children: BookmarkTreeType[];
};
