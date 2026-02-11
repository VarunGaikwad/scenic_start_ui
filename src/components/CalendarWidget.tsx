import { useState, useEffect } from "react";
import { Calendar, ChevronRight, Gift, Bell } from "lucide-react";
import { getTasks } from "@/api";
import type { CalendarTask } from "@/interface";
import CalendarModal from "./CalendarModal";

export default function CalendarWidget() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayTasks, setTodayTasks] = useState<CalendarTask[]>([]);
  const [nextTask, setNextTask] = useState<CalendarTask | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await getTasks();
      const todayStr = new Date().toISOString().split("T")[0];

      const today = tasks.filter((t) => t.date === todayStr);
      setTodayTasks(today);

      // Find next task (future)
      const now = new Date();
      const upcoming = tasks
        .filter((t) => new Date(t.date) >= now && t.date !== todayStr)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      setNextTask(upcoming[0] || null);
    };

    fetchTasks();
    // Poll for updates (simplified)
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const birthday = todayTasks.find((t) => t.type === "birthday");
  const specialEvent = todayTasks.find((t) => t.type === "event");

  // Trigger Notification on mount if there's a birthday or event
  useEffect(() => {
    if (birthday || specialEvent) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Special Day!", {
          body: birthday
            ? `🎂 It's ${birthday.title} today!`
            : `🔔 Event today: ${specialEvent?.title}`,
          icon: "/icons/calendar.png", // Fallback icon
        });
      }
    }
  }, [birthday, specialEvent]);

  return (
    <>
      <div
        className="group relative flex flex-col gap-3 px-5 py-4 rounded-3xl bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-black/40 transition-all duration-300 shadow-2xl cursor-pointer select-none w-64 transform hover:-translate-y-1"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Header: Date */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </span>
            <span className="text-3xl font-bold text-white tracking-tight">
              {currentDate.getDate()}
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors">
            <Calendar size={18} className="text-white/80" />
          </div>
        </div>

        {/* Dynamic Content */}
        {birthday ? (
          <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200">
            <Gift size={14} className="shrink-0 animate-pulse" />
            <span className="text-xs font-medium truncate">
              {birthday.title}
            </span>
          </div>
        ) : specialEvent ? (
          <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-200">
            <Bell size={14} className="shrink-0" />
            <span className="text-xs font-medium truncate">
              {specialEvent.title}
            </span>
          </div>
        ) : nextTask ? (
          <div className="mt-1 flex flex-col gap-1">
            <span className="text-[10px] text-white/40 uppercase tracking-wide">
              Next Up
            </span>
            <span className="text-sm font-medium text-white/90 truncate">
              {nextTask.title}
            </span>
            <span className="text-[10px] text-white/50">
              {new Date(nextTask.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        ) : (
          <div className="mt-2 text-xs text-white/40 italic">
            No upcoming tasks
          </div>
        )}

        {/* Hover Hint */}
        <div className="absolute top-1/2 -right-2 opacity-0 group-hover:opacity-100 group-hover:-right-4 transition-all duration-300">
          <ChevronRight size={16} className="text-white/30" />
        </div>
      </div>

      <CalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
