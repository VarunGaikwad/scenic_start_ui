import { useState, type ReactNode, type MouseEvent } from "react";

interface BookmarkButtonProps {
  active?: boolean;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export default function Bookmarks() {
  const [activeBookmark, setActiveBookmark] = useState("Bookmark");

  const handleClick = (name: string) => {
    setActiveBookmark(name);
  };

  // Map bookmarks to embeddable URLs
  const bookmarkUrls: Record<string, string> = {
    Bookmark: "https://example.com",
    Varun: "https://www.w3schools.com", // another embeddable site
  };

  return (
    <div className="flex-1 flex flex-col gap-5">
      <div className="text-xs flex gap-5">
        {Object.keys(bookmarkUrls).map((name) => (
          <BookmarkButton
            key={name}
            active={activeBookmark === name}
            onClick={() => handleClick(name)}
          >
            {name}
          </BookmarkButton>
        ))}
      </div>
      <div className="flex-1">
        <iframe src="https://chatgpt.com/?ext_cid=homey"></iframe>
      </div>
    </div>
  );
}

function BookmarkButton({
  active = false,
  onClick,
  children,
}: BookmarkButtonProps) {
  return (
    <div
      onClick={onClick}
      className={`${
        active ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
      } w-36 text-center p-1 px-3 rounded-full cursor-pointer`}
    >
      {children}
    </div>
  );
}
