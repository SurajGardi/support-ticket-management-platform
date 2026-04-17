import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      !window.location.pathname.includes("/login") &&
      !err.config?.url?.includes("/users/me")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;