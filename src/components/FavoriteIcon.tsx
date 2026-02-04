export default function FavoriteIcon() {
  return (
    <div className="max-h-32 overflow-y-auto">
      <div
        className="
        grid gap-2
        grid-cols-4 sm:grid-cols-6
      "
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <Icon key={i} />
        ))}
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div
      className="
      flex flex-col items-center
      hover:bg-black/20
      px-3 rounded-2xl
      cursor-pointer
      transition-colors duration-300
    "
    >
      <img className="size-10 sm:size-12" src="/icons/bing.svg" alt="Bing" />
      <div className="mt-1 text-sm sm:text-base">Bing</div>
    </div>
  );
}
