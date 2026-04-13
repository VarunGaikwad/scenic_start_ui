import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DAYS, MONTHS } from "@/constants";
import PunchOutModal from "./PunchOutModal";

export default function PunchOutCard() {
  const [currentState, setCurrentState] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const displayDate = new Date();
  displayDate.setDate(1);
  displayDate.setMonth(displayDate.getMonth() + currentState);

  const isToday = currentState === 0;
  const today = new Date();

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayRaw = new Date(year, month, 1).getDay();
  const startOffset = (firstDayRaw + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="w-full flex justify-center p-2">
      <div className="w-full max-w-5xl bg-zinc-900 rounded-2xl p-4 px-20">
        <div className="flex items-center gap-10 mb-6">
          <button
            onClick={() => setCurrentState(0)}
            disabled={isToday}
            className="bg-zinc-700 text-zinc-100 p-1 rounded-full w-20 text-center shadow-lg disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-opacity duration-200"
          >
            Today
          </button>

          <div className="flex gap-1 text-zinc-400">
            <button onClick={() => setCurrentState((s) => s - 1)}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentState((s) => s + 1)}>
              <ChevronRight size={20} />
            </button>
          </div>

          <p className="text-zinc-100">
            {MONTHS[month]}{" "}
            <time dateTime={`${year}-${String(month + 1).padStart(2, "0")}`}>
              {year}
            </time>
          </p>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <p key={d} className="text-zinc-500 text-center">
              {d}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
          {cells.map((day, i) => {
            const isCurrentDay =
              day !== null &&
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`h-20 cursor-pointer hover:scale-105 rounded-lg grid place-items-center transition-all ${
                  day === null
                    ? "bg-transparent"
                    : isCurrentDay
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {day !== null && (
                  <time
                    dateTime={`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`}
                  >
                    {day}
                  </time>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {selectedDay !== null && (
        <PunchOutModal {...{ year, month, selectedDay, setSelectedDay }} />
      )}
    </div>
  );
}
