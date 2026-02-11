import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Bell,
  Gift,
  CheckCircle,
} from "lucide-react";
import { getTasks, addTask, deleteTask, updateTask } from "@/api";
import type { CalendarTask, TaskType } from "@/interface";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<TaskType>("task");

  useEffect(() => {
    if (isOpen) {
      loadTasks();
      requestNotificationPermission();
    }
  }, [isOpen]);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    setSelectedDate(newDate);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    // Adjust for timezone offset to keep strict YYYY-MM-DD
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - offset * 60 * 1000);
    const dateStr = localDate.toISOString().split("T")[0];

    await addTask({
      title: newTaskTitle,
      date: dateStr,
      completed: false,
      type: newTaskType,
    });
    setNewTaskTitle("");
    loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    loadTasks();
  };

  const toggleComplete = async (task: CalendarTask) => {
    await updateTask(task.id, { completed: !task.completed });
    loadTasks();
  };

  // Filter tasks for selected date
  const selectedDateStr = (() => {
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  })();

  const selectedTasks = tasks.filter((t) => t.date === selectedDateStr);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        {/* Left: Calendar Grid */}
        <div className="flex-1 p-8 border-r border-white/10 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-4">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4 flex-1 content-start">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day,
              );
              const dateStr = (() => {
                const offset = date.getTimezoneOffset();
                const local = new Date(date.getTime() - offset * 60 * 1000);
                return local.toISOString().split("T")[0];
              })();

              const dayTasks = tasks.filter((t) => t.date === dateStr);
              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentDate.getMonth();
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all group
                    ${isSelected ? "bg-white text-black shadow-lg scale-105" : "text-white/80 hover:bg-white/10"}
                    ${isToday && !isSelected ? "border border-blue-500/50 text-blue-400" : ""}
                  `}
                >
                  {day}
                  {/* Indicators */}
                  <div className="absolute bottom-2 flex gap-1 justify-center">
                    {dayTasks.some((t) => t.type === "birthday") && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    )}
                    {dayTasks.some((t) => t.type === "event") && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                    )}
                    {dayTasks.some((t) => t.type === "task") && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Task Panel */}
        <div className="w-96 p-8 bg-black/20 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-medium text-white">
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Add Task */}
          <div className="flex flex-col gap-3 mb-6">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <div className="flex gap-2">
              {(["task", "birthday", "event"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewTaskType(type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium uppercase tracking-wide border transition-all
                    ${
                      newTaskType === type
                        ? type === "birthday"
                          ? "bg-amber-500/20 border-amber-500 text-amber-200"
                          : type === "event"
                            ? "bg-blue-500/20 border-blue-500 text-blue-200"
                            : "bg-white/20 border-white text-white"
                        : "border-transparent text-white/40 hover:bg-white/5"
                    }
                  `}
                >
                  {type === "birthday" && <Gift size={12} />}
                  {type === "event" && <Bell size={12} />}
                  {type === "task" && <CheckCircle size={12} />}
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Add Task
            </button>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 custom-scrollbar">
            {selectedTasks.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-sm">
                No tasks for this day.
              </div>
            ) : (
              selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${task.completed ? "opacity-50 bg-black/20 border-transparent" : "bg-white/5 border-white/5 hover:border-white/10"}
                  `}
                >
                  <button
                    onClick={() => toggleComplete(task)}
                    className={`h-5 w-5 rounded-full border flex items-center justify-center transition
                      ${task.completed ? "bg-white/20 border-transparent" : "border-white/30 hover:border-white/60"}
                    `}
                  >
                    {task.completed && (
                      <CheckCircle size={12} className="text-white" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${task.completed ? "line-through text-white/40" : "text-white/90"}`}
                    >
                      {task.title}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mt-0.5 flex items-center gap-1">
                      {task.type === "birthday" && (
                        <Gift size={8} className="text-amber-400" />
                      )}
                      {task.type === "event" && (
                        <Bell size={8} className="text-blue-400" />
                      )}
                      {task.type}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
