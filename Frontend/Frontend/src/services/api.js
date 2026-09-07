import axios from "axios";

const AUTH = "http://localhost:5001/api";
const INTERNSHIP = "http://localhost:5002/api";
const TASK = "http://localhost:5003/api";
const SENTIMENT = "http://localhost:5004/api";
const EVALUATION = "http://localhost:5005/api";
const REPORT = "http://localhost:5006/api";

const getToken = () => localStorage.getItem("token");

function createClient(baseURL) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}

export const authApi = createClient(AUTH);
export const internshipApi = createClient(INTERNSHIP);
export const taskApi = createClient(TASK);
export const sentimentApi = createClient(SENTIMENT);
export const evaluationApi = createClient(EVALUATION);
export const reportApi = createClient(REPORT);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const login = (credentials) => authApi.post("/auth/login", credentials);
export const register = (details) => authApi.post("/auth/register", details);
export const getProfile = () => authApi.get("/auth/profile");
export const getUsers = (params) => authApi.get("/auth/users", { params });
export const updateUserRole = (userId, role) =>
  authApi.patch(`/auth/users/${userId}/role`, { role });

// ---------------------------------------------------------------------------
// Internships
// ---------------------------------------------------------------------------
export const getInternships = (role) =>
  role === "INTERN"
    ? internshipApi.get("/internships/mine")
    : role === "MENTOR"
      ? internshipApi.get("/internships/assigned")
      : internshipApi.get("/internships");

export const createInternship = (data) => internshipApi.post("/internships", data);
export const updateInternship = (id, data) =>
  internshipApi.put(`/internships/${id}`, data);
export const deleteInternship = (id) => internshipApi.delete(`/internships/${id}`);

// ---------------------------------------------------------------------------
// Tasks & daily updates
// ---------------------------------------------------------------------------
export const getTasks = (role) =>
  role === "INTERN"
    ? taskApi.get("/tasks/mine")
    : role === "MENTOR"
      ? taskApi.get("/tasks/assigned")
      : taskApi.get("/tasks");

export const createTask = (data) => taskApi.post("/tasks", data);
export const updateTaskStatus = (taskId, status) =>
  taskApi.patch(`/tasks/${taskId}`, { status });

// Interns and mentors can both read the "updates" feed scoped by role.
export const getUpdatesFeed = () => taskApi.get("/tasks/updates");
export const submitTaskUpdate = (taskId, data) =>
  taskApi.post(`/tasks/${taskId}/updates`, data);

// ---------------------------------------------------------------------------
// Sentiment
// ---------------------------------------------------------------------------
// Mentors do not have a sentiment listing endpoint, so resolve to an empty
// result instead of failing the whole dashboard.
export const getSentiments = (role) =>
  role === "INTERN"
    ? sentimentApi.get("/sentiment/mine")
    : role === "ADMIN" || role === "HR"
      ? sentimentApi.get("/sentiment")
      : Promise.resolve({ data: { analyses: [] } });

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------
export const getEvaluations = (role) =>
  role === "INTERN"
    ? evaluationApi.get("/evaluations/mine")
    : role === "MENTOR"
      ? evaluationApi.get("/evaluations/assigned")
      : evaluationApi.get("/evaluations");

export const createEvaluation = (data) => evaluationApi.post("/evaluations", data);

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export const getReports = (role) =>
  role === "INTERN"
    ? reportApi.get("/reports/mine")
    : role === "MENTOR"
      ? reportApi.get("/reports/assigned")
      : reportApi.get("/reports");

export const generateReport = (data) => reportApi.post("/reports/generate", data);

export default authApi;