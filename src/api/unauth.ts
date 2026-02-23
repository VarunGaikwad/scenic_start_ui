import client from "./client";

const checkEmailExists = (email: string) =>
  client.post("/unauth/email-exists", { email });

const loginUser = (email: string, password: string) =>
  client.post("/unauth/login", { email, password });

const registerUser = (name: string, email: string, password: string) =>
  client.post("/unauth/register", { name, email, password });

const logoutUser = () => client.post("/unauth/logout");

const getStations = async (): Promise<string[]> => {
  const { data } = await client.get("/unauth/train-schedule/stations");
  return data as string[];
};

const getSchedule = async (params: {
  origin: string;
  destination: string;
  date: string;
}): Promise<any> => {
  const { data } = await client.get("/unauth/train-schedule", { params });
  return data;
};

export {
  checkEmailExists,
  loginUser,
  registerUser,
  logoutUser,
  getSchedule,
  getStations,
};
