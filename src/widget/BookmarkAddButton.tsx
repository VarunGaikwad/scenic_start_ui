import { PlusIcon } from "lucide-react";

export default function BookmarkAddButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <div
      {...{ onClick }}
      className="bg-black/30 text-center p-1 size-7 px-3 rounded-full cursor-pointer grid place-content-center hover:bg-white hover:text-black duration-500 ease-in-out transition-colors"
    >
      <PlusIcon size={10} />
    </div>
  );
}
