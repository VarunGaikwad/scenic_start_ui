import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { MONTHS, STORAGE_KEYS } from "@/constants";
import TimePicker from "./TimePicker";

export default function PunchOutModal({
  year,
  month,
  selectedDay,
  setSelectedDay,
}: {
  year: number;
  month: number;
  selectedDay: number;
  setSelectedDay: (day: number | null) => void;
}) {
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");

  const getStoredData = (): Record<string, { clockIn: string; clockOut: string }> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PUNCHOUT_DATA);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Failed to parse punchout data", e);
      return {};
    }
  };

  useEffect(() => {
    const data = getStoredData();
    const dateKey = `${year}-${month + 1}-${selectedDay}`;
    const saved = data[dateKey];

    if (saved) {
      setClockIn(saved.clockIn);
      setClockOut(saved.clockOut);
    } else {
      setClockIn("");
      setClockOut("");
    }
  }, [selectedDay, year, month]);

  const handleSave = () => {
    if (!clockIn || !clockOut) return;

    const data = getStoredData();
    const dateKey = `${year}-${month + 1}-${selectedDay}`;

    localStorage.setItem(
      STORAGE_KEYS.PUNCHOUT_DATA,
      JSON.stringify({
        ...data,
        [dateKey]: { clockIn, clockOut },
      }),
    );
    setSelectedDay(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={() => setSelectedDay(null)}
    >
      <div
        className="bg-zinc-900 rounded-2xl p-6 w-96 shadow-2xl flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <p className="text-zinc-100">
            {MONTHS[month]}{" "}
            <time
              dateTime={`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`}
            >
              {selectedDay}
            </time>
            {", "}
            <time dateTime={`${year}`}>{year}</time>
          </p>
          <button
            onClick={() => setSelectedDay(null)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-6">
          <TimePicker label="Clock In" value={clockIn} onChange={setClockIn} />
          <TimePicker
            label="Clock Out"
            value={clockOut}
            onChange={setClockOut}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!clockIn || !clockOut}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
