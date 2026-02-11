import type { CalendarTask } from "@/interface";
import { getDataFromLocalStorage, setDataToLocalStorage } from "@/utils";

import { STORAGE_KEYS } from "@/constants";

// Mock delay to simulate API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = STORAGE_KEYS.CALENDAR_TASKS;

export const getTasks = async (): Promise<CalendarTask[]> => {
  await delay(100); // Simulate network
  const tasks = getDataFromLocalStorage(STORAGE_KEY) as CalendarTask[] | null;
  return tasks || [];
};

export const addTask = async (
  task: Omit<CalendarTask, "id">,
): Promise<CalendarTask> => {
  await delay(100);
  const tasks =
    (getDataFromLocalStorage(STORAGE_KEY) as CalendarTask[] | null) || [];

  const newTask: CalendarTask = {
    ...task,
    id: crypto.randomUUID(),
  };

  const updatedTasks = [...tasks, newTask];
  setDataToLocalStorage(STORAGE_KEY, updatedTasks);

  return newTask;
};

export const deleteTask = async (id: string): Promise<void> => {
  await delay(100);
  const tasks =
    (getDataFromLocalStorage(STORAGE_KEY) as CalendarTask[] | null) || [];
  const updatedTasks = tasks.filter((t) => t.id !== id);
  setDataToLocalStorage(STORAGE_KEY, updatedTasks);
};

export const updateTask = async (
  id: string,
  updates: Partial<CalendarTask>,
): Promise<CalendarTask> => {
  await delay(100);
  const tasks =
    (getDataFromLocalStorage(STORAGE_KEY) as CalendarTask[] | null) || [];

  let updatedTask: CalendarTask | undefined;

  const updatedTasks = tasks.map((t) => {
    if (t.id === id) {
      updatedTask = { ...t, ...updates };
      return updatedTask;
    }
    return t;
  });

  if (!updatedTask) throw new Error("Task not found");

  setDataToLocalStorage(STORAGE_KEY, updatedTasks);
  return updatedTask;
};
