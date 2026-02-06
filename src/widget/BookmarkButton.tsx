import type { MouseEvent, ReactNode } from "react";

interface BookmarkButtonProps {
  active?: boolean;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}
export default function BookmarkButton({
  active = false,
  onClick,
  children,
}: BookmarkButtonProps) {
  return (
    <div
      onClick={onClick}
      className={`font-semibold ${
        active ? "bg-white text-black" : "bg-black/15 text-white"
      } w-36 text-center p-1 px-3 rounded-full cursor-pointer transition-colors duration-500 ease-in-out grid place-content-center`}
    >
      {children}
    </div>
  );
}
