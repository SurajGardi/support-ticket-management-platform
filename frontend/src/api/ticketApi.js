import api from "./axiosInstance";

export const getTickets = (params) => api.get("/tickets", { params });
export const getTicket = (id) => api.get(`/tickets/${id}`);
export const createTicket = (data) => api.post("/tickets", data);
export const updateStatus = (id, status) =>
  api.patch(`/tickets/${id}/status`, { status });
export const assignTicket = (id, agent_id) =>
  api.post(`/tickets/${id}/assign`, { agent_id });
export const addComment = (id, content) =>
  api.post(`/tickets/${id}/comment`, { content });
export const getComments = (id) => api.get(`/tickets/${id}/comments`);
export const getActivity = (id) => api.get(`/tickets/${id}/activity`);