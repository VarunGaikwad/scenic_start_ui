import client from "./client";

const checkEmailExists = (email: string) =>
  client.post("/unauth/email-exists", { email });

const loginUser = (email: string, password: string) =>
  client.post("/unauth/login", { email, password });

const registerUser = (name: string, email: string, password: string) =>
  client.post("/unauth/register", { name, email, password });

const logoutUser = () => client.post("/unauth/logout");

export { checkEmailExists, loginUser, registerUser, logoutUser };
