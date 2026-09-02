import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5001/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (credentials) => api.post("/auth/login", credentials);
export const register = (details) => api.post("/auth/register", details);
export const getProfile = () => api.get("/auth/profile");
const service = (baseURL) => { const client = axios.create({ baseURL }); client.interceptors.request.use((config) => { const token = localStorage.getItem("token"); if (token) config.headers.Authorization = `Bearer ${token}`; return config; }); return client; };
const internshipApi = service("http://localhost:5002/api");
const taskApi = service("http://localhost:5003/api");
const sentimentApi = service("http://localhost:5004/api");
const evaluationApi = service("http://localhost:5005/api");
const reportApi = service("http://localhost:5006/api");
export const getUsers = () => api.get("/auth/users");
export const getInternships = (role) => role === "INTERN" ? internshipApi.get("/internships/mine") : role === "MENTOR" ? internshipApi.get("/internships/assigned") : internshipApi.get("/internships");
export const getTasks = (role) => role === "INTERN" ? taskApi.get("/tasks/mine") : role === "MENTOR" ? taskApi.get("/tasks/assigned") : taskApi.get("/tasks");
export const getSentiments = (role) => role === "INTERN" ? sentimentApi.get("/sentiment/mine") : sentimentApi.get("/sentiment");
export const getEvaluations = (role) => role === "INTERN" ? evaluationApi.get("/evaluations/mine") : role === "MENTOR" ? evaluationApi.get("/evaluations/assigned") : evaluationApi.get("/evaluations");
export const getReports = (role) => role === "INTERN" ? reportApi.get("/reports/mine") : reportApi.get("/reports");
export default api;
