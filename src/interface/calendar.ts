export type TaskType = "task" | "birthday" | "event";

export interface CalendarTask {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  title: string;
  completed: boolean;
  type: TaskType;
}
