import api from "./axiosInstance";

export const getUsers = () => api.get("/users");
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post("/users", data);
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate`);
export const activateUser = (id) => api.patch(`/users/${id}/activate`);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getAgentWorkload = () => api.get("/users/agents/workload");