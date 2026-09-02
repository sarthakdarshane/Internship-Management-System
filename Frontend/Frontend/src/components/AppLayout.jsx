import { useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const navByRole = {
  INTERN: [
    "Overview",
    "My internship",
    "Daily updates",
    "Task history",
    "Monthly report",
  ],
  MENTOR: [
    "Overview",
    "Assigned interns",
    "Daily updates",
    "Evaluations",
    "Performance",
  ],
  ADMIN: ["Overview", "Users", "Internships", "Mentors", "Reports"],
  HR: ["Overview", "Interns", "Performance", "Reports"],
};

export default function AppLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = (user?.role || "INTERN").toUpperCase();
  const name =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "User";
  const sections = navByRole[role] || navByRole.INTERN;
  const activeSection = searchParams.get("section") || sections[0];
  const signOut = () => {
    logout();
    navigate("/login");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">IM</div>
        <div className="brand">
          InternFlow<span>Management system</span>
        </div>
        <nav>
          {sections.map((item) => (
            <button
              className={item === activeSection ? "nav-item active" : "nav-item"}
              key={item}
              type="button"
              onClick={() => setSearchParams({ section: item })}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="sign-out" type="button" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">{role} WORKSPACE</p>
            <h1>Welcome back, {name}</h1>
          </div>
          <div className="user-badge">
            <span>{name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{name}</strong>
              <small>{role}</small>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
