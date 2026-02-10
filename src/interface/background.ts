export type ImageResponseType = {
  id: string;
  image_url: string;
  is_welcome: boolean;
  media_type: "image" | "video";
  overlay_color: string;
  overlay_opacity: number;
  text_color: "light" | "dark";
};

export type CachedImage = ImageResponseType & {
  date: string;
};
