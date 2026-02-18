import type { ComponentProps } from "react";

interface EmbedWidgetProps extends ComponentProps<"iframe"> {
  url: string;
}

export default function EmbedWidget({ url, ...props }: EmbedWidgetProps) {
  return (
    <iframe
      src={url}
      className="w-full h-[75vh] border-none rounded-2xl bg-white/5"
      title="Embedded Content"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      {...props}
    />
  );
}
