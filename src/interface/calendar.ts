export type TaskType = "task" | "birthday" | "event";

export interface CalendarTask {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  title: string;
  completed: boolean;
  type: TaskType;
  time?: string;
  description?: string;
  priority?: string;
  location?: string;
  createdAt?: string;
  userId?: string;
}
