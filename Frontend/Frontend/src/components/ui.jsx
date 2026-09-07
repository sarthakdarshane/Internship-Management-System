/* ------------------------------------------------------------------ */
/* Inline SVG icon set (no external dependency required)               */
/* ------------------------------------------------------------------ */
const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  checkSquare: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m9 12 2 2 4-4" /></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h6" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  award: <><circle cx="12" cy="8" r="6" /><path d="M15.5 13 17 22l-5-3-5 3 1.5-9" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  sparkle: <path d="M12 3v2m0 14v2M5.2 5.2l1.4 1.4m10.8 10.8 1.4 1.4M3 12h2m14 0h2M5.2 18.8l1.4-1.4M17.4 6.6l1.4-1.4" />,
};

export function Icon({ name, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */
export function Card({ children, className = "", ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

export function StatCard({ label, value, icon, tone = "indigo", hint }) {
  return (
    <Card className="stat-card" >
      <div className={`stat-icon tone-${tone}`}><Icon name={icon} /></div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint ? <span className="stat-hint">{hint}</span> : null}
      </div>
    </Card>
  );
}

const toneMap = {
  green: "pill-green",
  amber: "pill-amber",
  red: "pill-red",
  blue: "pill-blue",
  slate: "pill-slate",
  indigo: "pill-indigo",
};

export function Pill({ children, tone = "slate" }) {
  return <span className={`pill ${toneMap[tone] || toneMap.slate}`}>{children}</span>;
}

export function StatusPill({ value }) {
  const v = String(value || "").toUpperCase();
  const tone =
    v === "COMPLETED" || v === "ACTIVE" || v === "POSITIVE"
      ? "green"
      : v === "IN_PROGRESS" || v === "PENDING"
        ? "amber"
        : v === "NEGATIVE" || v === "CANCELLED"
          ? "red"
          : v === "NEUTRAL"
            ? "blue"
            : "slate";
  return <Pill tone={tone}>{v || "—"}</Pill>;
}

export function Button({ children, icon, variant = "primary", type = "button", ...props }) {
  return (
    <button type={type} className={`btn btn-${variant}`} {...props}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Select({ options = [], ...props }) {
  return (
    <select className="input" {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className="input" {...props} />;
}

export function EmptyState({ icon = "sparkle", title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={26} /></div>
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="spinner-wrap">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Table({ columns, data, empty, renderRow }) {
  if (!data?.length) {
    return empty || <EmptyState title="No records found" text="Nothing to display yet." />;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>{data.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

export function SectionHeader({ title, text, actions }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {text ? <p>{text}</p> : null}
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  );
}
