import {
  ChevronLeft,
  ChevronRight,
  TrainFront,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DAYS, MONTHS, STORAGE_KEYS } from "@/constants";
import PunchOutModal from "./PunchOutModal";
import { getDataFromLocalStorage } from "@/utils";

const TARGET_OT_HOURS = 5;
const STANDARD_DAILY_HOURS = 9;

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTotalTime(totalMinutes: number): string {
  const isNegative = totalMinutes < 0;
  const absMinutes = Math.abs(totalMinutes);
  const h = Math.floor(absMinutes / 60);
  const m = Math.round(absMinutes % 60);
  return `${isNegative ? "-" : ""}${h}h ${m}m`;
}

export default function PunchOutCard() {
  const [currentState, setCurrentState] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [lrtData, setLRTData] = useState<any>(null);

  const punchOutData = getDataFromLocalStorage<
    Record<string, Record<string, { clockIn: string; clockOut: string }>>
  >(STORAGE_KEYS.PUNCHOUT_DATA);

  const today = new Date();
  const displayDate = new Date();
  displayDate.setDate(1);
  displayDate.setMonth(displayDate.getMonth() + currentState);

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const isToday = currentState === 0;

  // Physical Current Month info for stats
  const curYear = today.getFullYear();
  const curMonth = today.getMonth();
  const currentMonthYearKey = `${MONTHS[curMonth]} ${curYear}`;
  const todayKey = `${today.getDate()}`;
  const currentData = punchOutData?.[currentMonthYearKey]?.[todayKey] || null;

  // Monthly Stats (always for current physical month as per user request)
  const currentMonthData = punchOutData?.[currentMonthYearKey] || {};
  let totalPositiveOTMinutes = 0;
  let totalNegativeOTMinutes = 0;

  Object.values(currentMonthData).forEach((dayData) => {
    const inMin = parseTimeToMinutes(dayData.clockIn);
    const outMin = parseTimeToMinutes(dayData.clockOut);
    if (inMin && outMin) {
      const duration = outMin - inMin;
      const netOT = duration - STANDARD_DAILY_HOURS * 60;
      if (netOT > 0) {
        totalPositiveOTMinutes += netOT;
      } else if (netOT < 0) {
        totalNegativeOTMinutes += Math.abs(netOT);
      }
    }
  });

  const netOTMinutes = totalPositiveOTMinutes - totalNegativeOTMinutes;
  const totalNetOTHours = netOTMinutes / 60;
  const remainingOTHours = Math.max(0, TARGET_OT_HOURS - totalNetOTHours);

  // Suggested Clock Out Today
  let suggestedClockOut = "";
  if (currentData?.clockIn && !currentData.clockOut) {
    const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDate();
    let remainingWorkingDays = 0;
    for (let d = today.getDate(); d <= lastDayOfMonth; d++) {
      const dayOfWeek = new Date(curYear, curMonth, d).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) remainingWorkingDays++;
    }

    if (remainingWorkingDays > 0) {
      const otNeededToday = (remainingOTHours * 60) / remainingWorkingDays;
      const suggestedOutMin =
        parseTimeToMinutes(currentData.clockIn) +
        STANDARD_DAILY_HOURS * 60 +
        otNeededToday;
      suggestedClockOut = formatMinutesToTime(suggestedOutMin);
    }
  }

  // Calculate Suggested LRT
  let suggestedLRT = null;
  if (suggestedClockOut && lrtData) {
    const WALK_BUFFER_MIN = 15;
    const reachStationMin =
      parseTimeToMinutes(suggestedClockOut) + WALK_BUFFER_MIN;

    const storedSource =
      localStorage.getItem(STORAGE_KEYS.LRT_SOURCE) || "kashi";
    const sourceName = storedSource === "kashi" ? "かしの森公園前" : "峰";
    const route = lrtData.routes?.find((r: any) => r.from === sourceName);

    if (route) {
      suggestedLRT = route.trips.find(
        (t: any) => parseTimeToMinutes(t.departure) >= reachStationMin,
      );
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayRaw = new Date(year, month, 1).getDay();
  const startOffset = (firstDayRaw + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  useEffect(() => {
    fetch("/lrt/lrt.json")
      .then((res) => res.json())
      .then(setLRTData)
      .catch(console.error);
  }, []);

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
                  <div className="flex flex-col items-center gap-1">
                    <time
                      dateTime={`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`}
                    >
                      {day}
                    </time>
                    {punchOutData?.[`${MONTHS[month]} ${year}`]?.[`${day}`] && (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800 pt-8">
          <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50 backdrop-blur-sm">
            <h3 className="text-zinc-400 text-sm font-medium mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Today's
              Status
            </h3>
            {currentData ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">Clock In</span>
                  <span className="text-zinc-100 font-mono">
                    {currentData.clockIn}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">Clock Out</span>
                  <span className="text-zinc-100 font-mono">
                    {currentData.clockOut || "--:--"}
                  </span>
                </div>
                {suggestedClockOut && !currentData.clockOut && (
                  <div className="mt-2 space-y-2">
                    <div className="py-2 px-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-xs flex justify-between">
                        <span>Target Clock Out</span>
                        <span className="font-bold">{suggestedClockOut}</span>
                      </p>
                    </div>

                    {suggestedLRT && (
                      <div className="py-2 px-3 bg-zinc-700/50 border border-zinc-600/50 rounded-lg space-y-1">
                        <p className="text-zinc-300 text-[10px] flex justify-between items-center">
                          <span className="flex items-center gap-1 opacity-60">
                            <TrainFront size={12} /> Sug. LRT
                          </span>
                          <span className="font-mono text-zinc-100 flex items-center gap-1.5">
                            {suggestedLRT.departure}
                            <ArrowRight size={10} className="opacity-40" />
                            {suggestedLRT.arrival}
                          </span>
                        </p>
                        <p className="text-[9px] text-zinc-500 flex justify-between">
                          <span>Leave Office By</span>
                          <span className="font-bold text-amber-500/80">
                            {formatMinutesToTime(
                              parseTimeToMinutes(suggestedLRT.departure) - 15,
                            )}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm italic">
                No punch in data for today.
              </p>
            )}
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50 backdrop-blur-sm">
            <h3 className="text-zinc-400 text-sm font-medium mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Monthly
              Overtime
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-zinc-100 italic">
                  {formatTotalTime(netOTMinutes)}
                  <small className="text-xs text-zinc-500 ml-1 italic uppercase">
                    Net Duration
                  </small>
                </span>
                <span className="text-zinc-500 text-sm mb-1 font-mono">
                  Target: {TARGET_OT_HOURS}h
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (totalNetOTHours / TARGET_OT_HOURS) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold">
                <span className="text-green-500">
                  +{formatTotalTime(totalPositiveOTMinutes)} OT
                </span>
                <span className="text-red-500">
                  -{formatTotalTime(totalNegativeOTMinutes)} UNDER
                </span>
              </div>
              <p className="text-zinc-500 text-xs">
                {remainingOTHours > 0
                  ? `${formatTotalTime(remainingOTHours * 60)} remaining to hit your target.`
                  : "Target achieved! Good job."}
              </p>
            </div>
          </div>
        </div>
      </div>
      {selectedDay !== null && (
        <PunchOutModal {...{ year, month, selectedDay, setSelectedDay }} />
      )}
    </div>
  );
}
