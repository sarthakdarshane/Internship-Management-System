import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { AuthContext } from "../context/AuthContext";
import { getEvaluations, getInternships, getReports, getSentiments, getTasks, getUsers } from "../services/api";

const content = {
  INTERN: {
    title: "Your internship, in one place",
    text: "Track your progress, submit daily work updates, and keep your mentor informed.",
    cards: [
      ["My internship", "Your assignment details will appear here."],
      [
        "Daily update",
        "Submit today’s progress when the task service is connected.",
      ],
      ["Monthly report", "Review completed work and growth."],
    ],
  },
  MENTOR: {
    title: "Support your interns",
    text: "Review progress and give timely, constructive feedback to your assigned interns.",
    cards: [
      ["Assigned interns", "Your assigned intern list will appear here."],
      ["Daily updates", "Review submitted progress updates."],
      ["Evaluations", "Complete work evaluations and feedback."],
    ],
  },
  ADMIN: {
    title: "Manage the programme",
    text: "Keep people, internships, and reporting organised from one workspace.",
    cards: [
      ["Users", "Manage user accounts and access."],
      ["Internships", "Oversee internship assignments."],
      ["Reports", "Access programme-level reporting."],
    ],
  },
  HR: {
    title: "People and performance",
    text: "Follow internship progress and support a healthy, productive programme.",
    cards: [
      ["Interns", "View intern information and progress."],
      ["Performance", "Review performance insights."],
      ["Reports", "Access HR reports and summaries."],
    ],
  },
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const role = (user?.role || "INTERN").toUpperCase();
  const dashboard = content[role] || content.INTERN;
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  useEffect(() => {
    let active = true;
    const requests = { internships: getInternships(role), tasks: getTasks(role), sentiments: getSentiments(role), evaluations: getEvaluations(role), reports: getReports(role) };
    if (["ADMIN", "HR"].includes(role)) requests.users = getUsers();
    setLoading(true); setFetchError("");
    Promise.all(Object.entries(requests).map(async ([key, request]) => [key, (await request).data]))
      .then((entries) => { if (active) setData(Object.fromEntries(entries)); })
      .catch(() => { if (active) setFetchError("Some backend services are unavailable. Start them and refresh this page."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role]);
  const records = (key, field = key) => Array.isArray(data[key]?.[field]) ? data[key][field] : [];
  const stats = [
    records("internships").length,
    records("tasks").length,
    role === "INTERN" ? records("sentiments", "analyses").length : role === "MENTOR" ? records("evaluations").length : records("reports").length,
  ];
  const section = searchParams.get("section") || "Overview";
  const isOverview = section === "Overview";
  return (
    <AppLayout>
      <section className="hero-panel">
        <p className="status-dot">Authenticated account</p>
        <h2>{isOverview ? dashboard.title : section}</h2>
        <p>{isOverview ? dashboard.text : `This ${section.toLowerCase()} workspace is ready for the connected service.`}</p>
      </section>
      {fetchError && <p className="form-error dashboard-error" role="alert">{fetchError}</p>}
      {loading ? <div className="dashboard-loading">Loading live data from your services…</div> : <section className="dashboard-grid">
        {dashboard.cards.map(([title, text], index) => (
          <article className="dashboard-card" key={title}>
            <span className="card-number">0{index + 1}</span>
            <h3>{isOverview ? title : `${section} ${index + 1}`}</h3>
            <p>{isOverview ? text : `Use this area to manage ${section.toLowerCase()} data when the service is connected.`}</p>
            {isOverview && <strong className="live-count">{stats[index] ?? 0} records</strong>}
            <span className="coming-soon">{stats[index] ? "Live data loaded" : "No records found yet"}</span>
          </article>
        ))}
      </section>}
    </AppLayout>
  );
}
