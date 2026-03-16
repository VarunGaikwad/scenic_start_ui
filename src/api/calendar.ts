import type { CalendarTask } from "@/interface";
import client from "./client";

const PATH = `/auth/calendar-reminders`;

// Map backend structure to frontend structure
const mapApiToTask = (apiData: any): CalendarTask => ({
  id: apiData._id || apiData.id,
  title: apiData.title,
  date: apiData.date,
  completed: apiData.completed || false,
  type: apiData.type || "task",
  time: apiData.time,
});

export const getTasks = async (): Promise<CalendarTask[]> => {
  try {
    const { data } = await client.get(PATH);
    return (data || []).map(mapApiToTask);
  } catch (error) {
    console.error("Error fetching calendar tasks:", error);
    return [];
  }
};

export const getTaskById = async (id: string): Promise<CalendarTask | null> => {
  try {
    const { data } = await client.get(`${PATH}/${id}`);
    return mapApiToTask(data);
  } catch (error) {
    console.error(`Error fetching calendar task ${id}:`, error);
    return null;
  }
};

export const getTasksByUser = async (
  userId: string,
): Promise<CalendarTask[]> => {
  try {
    const { data } = await client.get(`${PATH}/user/${userId}`);
    return (data || []).map(mapApiToTask);
  } catch (error) {
    console.error(`Error fetching calendar tasks for user ${userId}:`, error);
    return [];
  }
};

export const getTasksDueToday = async (): Promise<CalendarTask[]> => {
  try {
    const { data } = await client.get(`${PATH}/due/today`);
    return (data || []).map(mapApiToTask);
  } catch (error) {
    console.error("Error fetching today's calendar tasks:", error);
    return [];
  }
};

export const addTask = async (
  task: Omit<CalendarTask, "id">,
): Promise<CalendarTask> => {
  const { data } = await client.post(PATH, {
    title: task.title,
    date: task.date,
    completed: task.completed,
    type: task.type,
    time: task.time,
    // Add default values for fields backend expects but frontend doesn't use yet
    description: "",
    priority: "medium",
    location: "Unknown",
  });
  return mapApiToTask(data);
};

export const deleteTask = async (id: string): Promise<void> => {
  await client.delete(`${PATH}/${id}`);
};

export const updateTask = async (
  id: string,
  updates: Partial<CalendarTask>,
): Promise<CalendarTask> => {
  const { data } = await client.put(`${PATH}/${id}`, {
    ...updates,
  });
  return mapApiToTask(data);
};
