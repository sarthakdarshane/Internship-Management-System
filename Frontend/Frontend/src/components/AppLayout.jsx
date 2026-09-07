import { useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import { Icon } from "./ui";

const NAV = {
  INTERN: [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "internship", label: "My internship", icon: "briefcase" },
    { key: "tasks", label: "Tasks", icon: "checkSquare" },
    { key: "updates", label: "Daily updates", icon: "clipboard" },
    { key: "sentiment", label: "Sentiment", icon: "smile" },
    { key: "evaluations", label: "Evaluations", icon: "award" },
    { key: "reports", label: "Reports", icon: "file" },
  ],
  MENTOR: [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "internship", label: "Assigned interns", icon: "users" },
    { key: "tasks", label: "Tasks", icon: "checkSquare" },
    { key: "updates", label: "Daily updates", icon: "clipboard" },
    { key: "evaluations", label: "Evaluations", icon: "award" },
    { key: "reports", label: "Reports", icon: "file" },
  ],
  ADMIN: [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "users", label: "Users", icon: "users" },
    { key: "internship", label: "Internships", icon: "briefcase" },
    { key: "tasks", label: "Tasks", icon: "checkSquare" },
    { key: "sentiment", label: "Sentiment", icon: "smile" },
    { key: "evaluations", label: "Evaluations", icon: "award" },
    { key: "reports", label: "Reports", icon: "file" },
  ],
  HR: [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "users", label: "Interns", icon: "users" },
    { key: "internship", label: "Internships", icon: "briefcase" },
    { key: "sentiment", label: "Sentiment", icon: "smile" },
    { key: "evaluations", label: "Evaluations", icon: "award" },
    { key: "reports", label: "Reports", icon: "file" },
  ],
};

const ROLE_LABELS = {
  INTERN: "Intern workspace",
  MENTOR: "Mentor workspace",
  ADMIN: "Admin workspace",
  HR: "HR workspace",
};

export default function AppLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = (user?.role || "INTERN").toUpperCase();
  const name =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "User";
  const init = user?.full_name?.[0] || user?.email?.[0] || "U";
  const sections = NAV[role] || NAV.INTERN;
  const activeKey = searchParams.get("section") || "overview";
  const activeItem = sections.find((s) => s.key === activeKey);
  const activeLabel = activeItem?.label || "Overview";

  const go = (key) => setSearchParams({ section: key });
  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">IM</div>
          <div className="brand-text">
            <strong>InternFlow</strong>
            <span>Management system</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map((item) => (
            <button
              className={item.key === activeKey ? "nav-item active" : "nav-item"}
              key={item.key}
              type="button"
              onClick={() => go(item.key)}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{init.toUpperCase()}</div>
            <div className="sidebar-user-meta">
              <strong>{name}</strong>
              <span>{role}</span>
            </div>
          </div>
          <button className="sign-out" type="button" onClick={signOut}>
            <Icon name="logOut" size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">{ROLE_LABELS[role] || "Workspace"}</p>
            <h1>{activeLabel}</h1>
          </div>
          <div className="user-badge">
            <span className="avatar">{init.toUpperCase()}</span>
            <div>
              <strong>{name}</strong>
              <small>{role}</small>
            </div>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}