import type { CalendarTask } from "@/interface";
import client from "./client";
import { isMe } from "./auth";

const PATH = `/auth/calendar-reminders`;

// Map backend structure to frontend structure
const mapApiToTask = (apiData: any): CalendarTask => ({
  id: apiData._id || apiData.id,
  title: apiData.title,
  date: apiData.date,
  completed: apiData.completed || false,
  type: apiData.type || "task",
  time: apiData.time,
  description: apiData.description,
  priority: apiData.priority,
  location: apiData.location,
  createdAt: apiData.createdAt,
  userId: apiData.userId,
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
  let userId = task.userId;
  if (!userId) {
    try {
      const user = await isMe();
      userId = user?._id || user?.id; // backend user model typically has an id or _id
    } catch (err) {
      console.warn("Failed to fetch user in addTask", err);
    }
  }

  const { data } = await client.post(PATH, {
    title: task.title,
    date: task.date,
    completed: task.completed,
    type: task.type,
    time: task.time,
    description: task.description || "",
    priority: task.priority || "medium",
    location: task.location || "",
    createdAt: task.createdAt || new Date().toISOString(),
    userId: userId,
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
  const { data } = await client.patch(`${PATH}/${id}`, {
    ...updates,
  });
  return mapApiToTask(data);
};
