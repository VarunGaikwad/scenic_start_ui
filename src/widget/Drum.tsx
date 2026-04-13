import { ITEM_H } from "@/constants";
import { useEffect, useRef } from "react";

export default function Drum({
  count,
  value,
  onChange,
  pad = 2,
}: {
  count: number;
  value: number;
  onChange: (v: number) => void;
  pad?: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startVal = useRef(value);
  const keyBuffer = useRef<string>("");
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clamp = (v: number) => ((v % count) + count) % count;

  const setOffset = (v: number) => {
    if (!listRef.current) return;
    const offset = 1 * ITEM_H - v * ITEM_H;
    listRef.current.style.transform = `translateY(${offset}px)`;
  };

  useEffect(() => {
    setOffset(value);
  }, [value]);

  const handleDelta = (deltaY: number) => {
    const delta = Math.round(deltaY / ITEM_H);
    onChange(clamp(startVal.current + delta));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!/^\d$/.test(e.key)) return;
    e.preventDefault();

    keyBuffer.current += e.key;

    // clear buffer after 800ms of no input
    if (keyTimer.current) clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => {
      keyBuffer.current = "";
    }, 800);

    const parsed = parseInt(keyBuffer.current, 10);

    if (parsed < count) {
      onChange(parsed);
    }

    // if buffer has 2 digits or next digit would exceed count, reset buffer
    if (
      keyBuffer.current.length >= 2 ||
      parseInt(keyBuffer.current + "0", 10) >= count
    ) {
      keyBuffer.current = "";
      if (keyTimer.current) clearTimeout(keyTimer.current);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative overflow-hidden cursor-ns-resize select-none outline-none focus:ring-1 focus:ring-zinc-500 rounded-lg"
      style={{ height: ITEM_H * 3, width: 52 }}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        containerRef.current?.focus();
        startY.current = e.clientY;
        startVal.current = value;
      }}
      onMouseMove={(e) => {
        if (startY.current !== null) handleDelta(startY.current - e.clientY);
      }}
      onMouseUp={() => {
        startY.current = null;
      }}
      onMouseLeave={() => {
        startY.current = null;
      }}
      onWheel={(e) => {
        e.preventDefault();
        onChange(clamp(value + Math.sign(e.deltaY)));
      }}
      onTouchStart={(e) => {
        startY.current = e.touches[0].clientY;
        startVal.current = value;
      }}
      onTouchMove={(e) => {
        if (startY.current !== null)
          handleDelta(startY.current - e.touches[0].clientY);
      }}
      onTouchEnd={() => {
        startY.current = null;
      }}
    >
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-10 bg-linear-to-b from-zinc-900 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none h-10 bg-linear-to-t from-zinc-900 to-transparent" />
      <div
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 border-t border-b border-zinc-600 z-10 pointer-events-none"
        style={{ height: ITEM_H }}
      />

      <div
        ref={listRef}
        className="flex flex-col items-center"
        style={{ transition: "transform 0.15s ease" }}
      >
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            onClick={() => onChange(i)}
            style={{ height: ITEM_H, minHeight: ITEM_H }}
            className={`flex items-center justify-center w-full font-medium transition-all cursor-pointer ${
              i === value ? "text-zinc-100 text-xl" : "text-zinc-500 text-base"
            }`}
          >
            {String(i).padStart(pad, "0")}
          </div>
        ))}
      </div>
    </div>
  );
}
