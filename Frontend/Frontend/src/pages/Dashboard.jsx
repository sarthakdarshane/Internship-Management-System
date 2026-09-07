import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { AuthContext } from "../context/auth-context";
import {
  createEvaluation,
  createInternship,
  createTask,
  deleteInternship,
  generateReport,
  getEvaluations,
  getInternships,
  getReports,
  getSentiments,
  getTasks,
  getUpdatesFeed,
  getUsers,
  submitTaskUpdate,
  updateTaskStatus,
  updateUserRole,
} from "../services/api";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Pill,
  SectionHeader,
  Select,
  Spinner,
  StatCard,
  StatusPill,
  Table,
  Textarea,
} from "../components/ui";
import { formatDate } from "../utils/format";

const ROLES = [
  { value: "INTERN", label: "Intern" },
  { value: "MENTOR", label: "Mentor" },
  { value: "ADMIN", label: "Admin" },
  { value: "HR", label: "HR" },
];

const TASK_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

function errorText(err, fallback = "Something went wrong.") {
  return err?.response?.data?.message || err?.message || fallback;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const role = (user?.role || "INTERN").toUpperCase();
  const section = searchParams.get("section") || "overview";

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const requests = {
        internships: getInternships(role),
        tasks: getTasks(role),
        sentiments: getSentiments(role),
        evaluations: getEvaluations(role),
        reports: getReports(role),
      };
      if (["ADMIN", "HR"].includes(role)) requests.users = getUsers({ limit: 100 });
      // Daily updates feed is meaningful for interns and mentors.
      if (["INTERN", "MENTOR"].includes(role)) {
        requests.updates = getUpdatesFeed().catch(() => ({ data: { updates: [] } }));
      }
      const entries = await Promise.all(
        Object.entries(requests).map(async ([key, p]) => {
          const r = await p;
          return [key, r.data];
        }),
      );
      setData(Object.fromEntries(entries));
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err, "Unable to load data. Make sure all services are running."));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const records = (key, field) => {
    const v = data[key];
    return Array.isArray(v?.[field]) ? v[field] : [];
  };

  const internships = records("internships", "internships");
  const tasks = records("tasks", "tasks");
  const users = records("users", "users");
  const sentiments = records("sentiments", "analyses");
  const evaluations = records("evaluations", "evaluations");
  const reports = records("reports", "reports");
  const updates = records("updates", "updates");

  const context = useMemo(() => {
    return { role, internships, tasks, users, sentiments, evaluations, reports, updates, currentUser: user?.user_id };
  }, [role, internships, tasks, users, sentiments, evaluations, reports, updates, user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-center"><Spinner label="Loading your workspace…" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {loadError && <div className="banner-error">{loadError}</div>}
      <SectionRouter section={section} context={context} setSection={(s) => setSearchParams({ section: s })} onRefresh={loadAll} />
    </AppLayout>
  );
}

function SectionRouter({ section, context, setSection, onRefresh }) {
  switch (section) {
    case "users":
      return <UsersSection context={context} onRefresh={onRefresh} />;
    case "internship":
      return <InternshipSection context={context} onRefresh={onRefresh} />;
    case "tasks":
      return <TasksSection context={context} onRefresh={onRefresh} />;
    case "updates":
      return <UpdatesSection context={context} onRefresh={onRefresh} />;
    case "sentiment":
      return <SentimentSection context={context} />;
    case "evaluations":
      return <EvaluationsSection context={context} onRefresh={onRefresh} />;
    case "reports":
      return <ReportsSection context={context} onRefresh={onRefresh} />;
    case "overview":
    default:
      return <OverviewSection context={context} setSection={setSection} />;
  }
}

/* ------------------------------------------------------------------------ */
/* Overview                                                                  */
/* ------------------------------------------------------------------------ */
function OverviewSection({ context, setSection }) {
  const { role, internships, tasks, sentiments, evaluations, reports, users } = context;
  const stats = [
    { label: "Internships", value: internships.length, icon: "briefcase", tone: "indigo" },
    { label: "Tasks", value: tasks.length, icon: "checkSquare", tone: "blue" },
    ...(role === "INTERN"
      ? [{ label: "Sentiment entries", value: sentiments.length, icon: "smile", tone: "green" }]
      : role === "MENTOR"
        ? [{ label: "Evaluations written", value: evaluations.length, icon: "award", tone: "amber" }]
        : [{ label: "Users", value: users.length, icon: "users", tone: "green" }]),
    { label: "Reports", value: reports.length, icon: "file", tone: "slate" },
  ];

  const completedTasks = tasks.filter((t) => String(t.status).toUpperCase() === "COMPLETED").length;
  const activeInternships = internships.filter((i) => String(i.status).toUpperCase() === "ACTIVE").length;
  const avgSentiment = sentiments.length
    ? (sentiments.reduce((s, x) => s + Number(x.score || 0), 0) / sentiments.length).toFixed(2)
    : "—";

  return (
    <div className="dashboard-stack">
      <section className="hero-panel">
        <span className="hero-chip"><span className="live-dot" /> Live data synced</span>
        <h2>Welcome to your {role.toLowerCase()} workspace</h2>
        <p>
          {role === "INTERN" && "Track your internship, submit daily updates, and review mentor feedback all in one place."}
          {role === "MENTOR" && "Coach your interns, assign tasks, and complete performance evaluations."}
          {role === "ADMIN" && "Oversee users, internships, and reporting across the whole programme."}
          {role === "HR" && "Follow internship progress and support a healthy, productive programme."}
        </p>
        <div className="hero-actions">
          {role === "INTERN" && <Button variant="light" icon="clipboard" onClick={() => setSection("updates")}>Submit an update</Button>}
          {role === "MENTOR" && <Button variant="light" icon="plus" onClick={() => setSection("tasks")}>Assign a task</Button>}
          {["ADMIN", "HR"].includes(role) && <Button variant="light" icon="plus" onClick={() => setSection("internship")}>Create internship</Button>}
        </div>
      </section>

      <div className="stats-grid">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="overview-columns">
        <Card>
          <SectionHeader title="At a glance" text="Key programme indicators from your live data." />
          <ul className="kpi-list">
            <li><span>Completed tasks</span><strong>{completedTasks} / {tasks.length}</strong></li>
            <li><span>Active internships</span><strong>{activeInternships}</strong></li>
            {role === "INTERN" && <li><span>Average sentiment</span><strong>{avgSentiment}</strong></li>}
            {role === "MENTOR" && <li><span>Evaluations submitted</span><strong>{evaluations.length}</strong></li>}
            <li><span>Reports available</span><strong>{reports.length}</strong></li>
          </ul>
        </Card>

        <Card>
          <SectionHeader title="Quick actions" text="Jump straight into common tasks." />
          <div className="quick-actions">
            {role === "INTERN" && (
              <>
                <Button variant="ghost" icon="checkSquare" onClick={() => setSection("tasks")}>Browse my tasks</Button>
                <Button variant="ghost" icon="file" onClick={() => setSection("reports")}>View my reports</Button>
              </>
            )}
            {role === "MENTOR" && (
              <>
                <Button variant="ghost" icon="users" onClick={() => setSection("internship")}>View assigned interns</Button>
                <Button variant="ghost" icon="award" onClick={() => setSection("evaluations")}>Write evaluation</Button>
              </>
            )}
            {["ADMIN", "HR"].includes(role) && (
              <>
                <Button variant="ghost" icon="users" onClick={() => setSection("users")}>Manage users</Button>
                <Button variant="ghost" icon="file" onClick={() => setSection("reports")}>Browse reports</Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Users (Admin / HR)                                                        */
/* ------------------------------------------------------------------------ */
function UsersSection({ context, onRefresh }) {
  const { role, users } = context;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = role === "ADMIN";

  async function handleRoleChange(userId, newRole) {
    setBusy(true);
    setError("");
    try {
      await updateUserRole(userId, newRole);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeader
        title={isAdmin ? "User management" : "Interns"}
        text={isAdmin ? "Manage accounts and change user roles." : "View all registered interns."}
      />
      {error && <div className="banner-error">{error}</div>}
      <Table
        columns={["Name", "Email", "Role", "Joined", ...(isAdmin ? ["Change role"] : [])]}
        data={users}
        renderRow={(u) => (
          <tr key={u.user_id}>
            <td><strong>{u.full_name}</strong></td>
            <td>{u.email}</td>
            <td><StatusPill value={u.role} /></td>
            <td>{formatDate(u.created_at)}</td>
            {isAdmin && (
              <td>
                <Select
                  value={u.role}
                  disabled={busy}
                  options={ROLES}
                  onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                />
              </td>
            )}
          </tr>
        )}
      />
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Internships                                                               */
/* ------------------------------------------------------------------------ */
function InternshipSection({ context, onRefresh }) {
  const { role, internships, users } = context;
  const isManager = ["ADMIN", "HR"].includes(role);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});

  const internOptions = users.filter((u) => u.role === "INTERN").map((u) => ({ value: u.user_id, label: `${u.full_name} (${u.email})` }));
  const mentorOptions = users.filter((u) => u.role === "MENTOR").map((u) => ({ value: u.user_id, label: `${u.full_name} (${u.email})` }));

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createInternship(form);
      setForm({});
      setOpen(false);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this internship?")) return;
    setBusy(true);
    try {
      await deleteInternship(id);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeader
        title={role === "INTERN" ? "My internship" : role === "MENTOR" ? "Assigned interns" : "Internships"}
        text="Internship assignments and current status."
        actions={isManager ? <Button icon="plus" onClick={() => setOpen(true)}>New internship</Button> : null}
      />
      {error && <div className="banner-error">{error}</div>}
      <Table
        columns={["Title", "Company", "Dates", "Status", ...(isManager ? ["Actions"] : [])]}
        data={internships}
        renderRow={(i) => (
          <tr key={i.internship_id}>
            <td><strong>{i.internship_title || "Untitled"}</strong><small className="sub">ID #{i.internship_id}</small></td>
            <td>{i.company_name}</td>
            <td>{formatDate(i.start_date)} → {formatDate(i.end_date)}</td>
            <td><StatusPill value={i.status} /></td>
            {isManager && (
              <td><Button variant="danger-ghost" onClick={() => remove(i.internship_id)}>Delete</Button></td>
            )}
          </tr>
        )}
      />

      <Modal open={open} title="Create internship" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="form-grid">
          <Field label="Intern">
            <Select required value={form.intern_id || ""} onChange={set("intern_id")} options={[{ value: "", label: "Select intern…" }, ...internOptions]} />
          </Field>
          <Field label="Mentor">
            <Select required value={form.mentor_id || ""} onChange={set("mentor_id")} options={[{ value: "", label: "Select mentor…" }, ...mentorOptions]} />
          </Field>
          <Field label="Company"><Input required value={form.company_name || ""} onChange={set("company_name")} placeholder="Acme Inc." /></Field>
          <Field label="Title"><Input required value={form.internship_title || ""} onChange={set("internship_title")} placeholder="Software Engineer Intern" /></Field>
          <Field label="Start date"><Input type="date" required value={form.start_date || ""} onChange={set("start_date")} /></Field>
          <Field label="End date"><Input type="date" required value={form.end_date || ""} onChange={set("end_date")} /></Field>
          <Field label="Description" hint="Optional summary of responsibilities.">
            <Textarea rows={3} value={form.description || ""} onChange={set("description")} />
          </Field>
          {error && <div className="banner-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create internship"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Tasks                                                                     */
/* ------------------------------------------------------------------------ */
function TasksSection({ context, onRefresh }) {
  const { role, tasks, users, internships } = context;
  const canCreate = ["MENTOR", "ADMIN", "HR"].includes(role);
  const [open, setOpen] = useState(false);
  const [updateFor, setUpdateFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});
  const [updateForm, setUpdateForm] = useState({ reflection: "", hours_worked: "", update_date: "" });

  const internOptions = users.filter((u) => u.role === "INTERN").map((u) => ({ value: u.user_id, label: `${u.full_name}` }));
  const myInternships = internships;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const mentorId = role === "MENTOR" ? context.currentUser : form.mentor_id;
      await createTask({ ...form, mentor_id: mentorId });
      setForm({});
      setOpen(false);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(taskId, status) {
    setBusy(true);
    setError("");
    try {
      await updateTaskStatus(taskId, status);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitUpdate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await submitTaskUpdate(updateFor.task_id, {
        reflection: updateForm.reflection,
        hours_worked: updateForm.hours_worked,
        update_date: updateForm.update_date || null,
      });
      setUpdateForm({ reflection: "", hours_worked: "", update_date: "" });
      setUpdateFor(null);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const renderStatusSelect = (t) => (
    <Select
      value={t.status || "PENDING"}
      disabled={busy}
      options={TASK_STATUSES}
      onChange={(e) => changeStatus(t.task_id, e.target.value)}
    />
  );

  return (
    <Card>
      <SectionHeader
        title="Tasks"
        text={role === "INTERN" ? "Your assigned tasks and their progress." : "Assign and track tasks for your interns."}
        actions={canCreate ? <Button icon="plus" onClick={() => setOpen(true)}>New task</Button> : null}
      />
      {error && <div className="banner-error">{error}</div>}
      <Table
        columns={["Title", "Due date", "Status", ...(role === "INTERN" ? ["Update status", "Submit update"] : ["Change status"])]}
        data={tasks}
        renderRow={(t) => (
          <tr key={t.task_id}>
            <td>
              <strong>{t.title}</strong>
              {t.description ? <small className="sub">{t.description}</small> : null}
            </td>
            <td>{formatDate(t.due_date)}</td>
            <td><StatusPill value={t.status} /></td>
            {role === "INTERN" ? (
              <>
                <td>{renderStatusSelect(t)}</td>
                <td><Button variant="ghost" icon="clipboard" onClick={() => setUpdateFor(t)}>Add update</Button></td>
              </>
            ) : (
              <td>{renderStatusSelect(t)}</td>
            )}
          </tr>
        )}
      />

      <Modal open={open} title="Create task" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="form-grid">
          <Field label="Internship">
            <Select required value={form.internship_id || ""} onChange={set("internship_id")} options={[{ value: "", label: "Select internship…" }, ...myInternships.map((i) => ({ value: i.internship_id, label: `${i.internship_title || "Internship"} (#${i.internship_id})` }))]} />
          </Field>
          <Field label="Intern">
            <Select required value={form.intern_id || ""} onChange={set("intern_id")} options={[{ value: "", label: "Select intern…" }, ...internOptions]} />
          </Field>
          {role !== "MENTOR" && (
            <Field label="Mentor">
              <Select required value={form.mentor_id || ""} onChange={set("mentor_id")} options={[{ value: "", label: "Select mentor…" }, ...users.filter((u) => u.role === "MENTOR").map((u) => ({ value: u.user_id, label: u.full_name }))]} />
            </Field>
          )}
          <Field label="Title"><Input required value={form.title || ""} onChange={set("title")} placeholder="Build the dashboard UI" /></Field>
          <Field label="Due date"><Input type="date" value={form.due_date || ""} onChange={set("due_date")} /></Field>
          <Field label="Description"><Textarea rows={3} value={form.description || ""} onChange={set("description")} /></Field>
          {error && <div className="banner-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create task"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(updateFor)} title={`Daily update — ${updateFor?.title || ""}`} onClose={() => setUpdateFor(null)}>
        <form onSubmit={submitUpdate} className="form-grid">
          <Field label="What did you work on today?">
            <Textarea required rows={4} value={updateForm.reflection} onChange={(e) => setUpdateForm((f) => ({ ...f, reflection: e.target.value }))} placeholder="Describe your progress, blockers, and next steps…" />
          </Field>
          <Field label="Hours worked">
            <Input type="number" min="0" max="24" step="0.5" value={updateForm.hours_worked} onChange={(e) => setUpdateForm((f) => ({ ...f, hours_worked: e.target.value }))} />
          </Field>
          <Field label="Date">
            <Input type="date" value={updateForm.update_date} onChange={(e) => setUpdateForm((f) => ({ ...f, update_date: e.target.value }))} />
          </Field>
          {error && <div className="banner-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <Button variant="ghost" type="button" onClick={() => setUpdateFor(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Submit update"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Daily updates                                                             */
/* ------------------------------------------------------------------------ */
function UpdatesSection({ context }) {
  const { updates } = context;
  return (
    <Card>
      <SectionHeader title="Daily updates" text="Work reflections submitted by interns." />
      <Table
        columns={["Task", "Reflection", "Hours", "Date"]}
        data={updates}
        renderRow={(u) => (
          <tr key={u.update_id}>
            <td><strong>{u.title || `Task #${u.task_id}`}</strong></td>
            <td className="wrap-cell">{u.reflection}</td>
            <td>{u.hours_worked ?? "—"}</td>
            <td>{formatDate(u.update_date)}</td>
          </tr>
        )}
      />
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Sentiment                                                                 */
/* ------------------------------------------------------------------------ */
function SentimentSection({ context }) {
  const { role, sentiments } = context;
  if (role === "MENTOR") {
    return <Card><EmptyState icon="smile" title="No sentiment insight" text="Sentiment scores are available to interns, admins, and HR." /></Card>;
  }
  return (
    <Card>
      <SectionHeader title="Sentiment analysis" text="AI-derived mood scores from your daily updates." />
      <Table
        columns={["Text", "Sentiment", "Score", "Date"]}
        data={sentiments}
        renderRow={(s) => (
          <tr key={s.sentiment_id}>
            <td className="wrap-cell">{s.text_content}</td>
            <td><StatusPill value={s.sentiment} /></td>
            <td><Pill tone="indigo">{Number(s.score).toFixed(2)}</Pill></td>
            <td>{formatDate(s.created_at)}</td>
          </tr>
        )}
      />
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Evaluations                                                               */
/* ------------------------------------------------------------------------ */
function EvaluationsSection({ context, onRefresh }) {
  const { role, evaluations, users, internships } = context;
  const canCreate = ["MENTOR", "ADMIN", "HR"].includes(role);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const mentorId = role === "MENTOR" ? context.currentUser : form.mentor_id;
      await createEvaluation({ ...form, mentor_id: mentorId });
      setForm({});
      setOpen(false);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const dimensions = [
    ["task_completion", "Task completion"],
    ["work_quality", "Work quality"],
    ["technical_skills", "Technical skills"],
    ["communication", "Communication"],
    ["problem_solving", "Problem solving"],
    ["punctuality", "Punctuality"],
  ];

  return (
    <Card>
      <SectionHeader
        title="Evaluations"
        text={role === "INTERN" ? "Your mentor feedback and scores." : "Performance evaluations you have written."}
        actions={canCreate ? <Button icon="plus" onClick={() => setOpen(true)}>Write evaluation</Button> : null}
      />
      {error && <div className="banner-error">{error}</div>}
      <Table
        columns={["Comments", "Overall", "Quality", "Skills", "Communication", "Date"]}
        data={evaluations}
        renderRow={(ev) => (
          <tr key={ev.feedback_id}>
            <td className="wrap-cell">{ev.comments}</td>
            <td><Pill tone="green">{Math.round(ev.overall_score)}</Pill></td>
            <td>{Math.round(ev.work_quality)}</td>
            <td>{Math.round(ev.technical_skills)}</td>
            <td>{Math.round(ev.communication)}</td>
            <td>{formatDate(ev.created_at)}</td>
          </tr>
        )}
      />

      <Modal open={open} title="Write evaluation" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="form-grid">
          <Field label="Internship">
            <Select required value={form.internship_id || ""} onChange={set("internship_id")} options={[{ value: "", label: "Select internship…" }, ...internships.map((i) => ({ value: i.internship_id, label: `${i.internship_title || "Internship"} (#${i.internship_id})` }))]} />
          </Field>
          <Field label="Intern">
            <Select required value={form.intern_id || ""} onChange={set("intern_id")} options={[{ value: "", label: "Select intern…" }, ...users.filter((u) => u.role === "INTERN").map((u) => ({ value: u.user_id, label: u.full_name }))]} />
          </Field>
          {role !== "MENTOR" && (
            <Field label="Mentor">
              <Select required value={form.mentor_id || ""} onChange={set("mentor_id")} options={[{ value: "", label: "Select mentor…" }, ...users.filter((u) => u.role === "MENTOR").map((u) => ({ value: u.user_id, label: u.full_name }))]} />
            </Field>
          )}
          {dimensions.map(([key, label]) => (
            <Field key={key} label={label}>
              <Input type="number" min="0" max="100" required value={form[key] || ""} onChange={set(key)} placeholder="0–100" />
            </Field>
          ))}
          <Field label="Comments" hint="Summarise strengths and areas to improve.">
            <Textarea required rows={3} value={form.comments || ""} onChange={set("comments")} />
          </Field>
          {error && <div className="banner-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Submit evaluation"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Reports                                                                   */
/* ------------------------------------------------------------------------ */
function ReportsSection({ context, onRefresh }) {
  const { role, reports, internships } = context;
  const canGenerate = ["INTERN", "ADMIN", "HR"].includes(role);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await generateReport(form);
      setForm({});
      setOpen(false);
      await onRefresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeader
        title="Monthly reports"
        text={role === "MENTOR" ? "Reports for your assigned interns." : "Aggregated performance reports."}
        actions={canGenerate ? <Button icon="sparkle" onClick={() => setOpen(true)}>Generate report</Button> : null}
      />
      {error && <div className="banner-error">{error}</div>}
      <Table
        columns={["Month", "Tasks", "Completed", "Completion %", "Avg sentiment", "Avg rating", "Generated"]}
        data={reports}
        renderRow={(r) => {
          const s = r.summary || {};
          const month = r.month || s.month || "";
          return (
            <tr key={r.report_id}>
              <td><strong>{String(month).slice(0, 7)}</strong></td>
              <td>{s.tasks_assigned ?? "—"}</td>
              <td>{s.tasks_completed ?? "—"}</td>
              <td>{s.completion_percentage != null ? `${s.completion_percentage}%` : "—"}</td>
              <td>{s.average_sentiment != null ? Number(s.average_sentiment).toFixed(2) : "—"}</td>
              <td>{s.average_mentor_rating != null ? Math.round(s.average_mentor_rating) : "—"}</td>
              <td>{formatDate(r.created_at)}</td>
            </tr>
          );
        }}
      />

      <Modal open={open} title="Generate monthly report" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="form-grid">
          {role !== "INTERN" && (
            <Field label="Intern ID">
              <Input type="number" required value={form.intern_id || ""} onChange={set("intern_id")} placeholder="e.g. 10" />
            </Field>
          )}
          <Field label="Internship">
            <Select required value={form.internship_id || ""} onChange={set("internship_id")} options={[{ value: "", label: "Select internship…" }, ...internships.map((i) => ({ value: i.internship_id, label: `${i.internship_title || "Internship"} (#${i.internship_id})` }))]} />
          </Field>
          <Field label="Month">
            <Input type="month" required value={form.month || ""} onChange={set("month")} />
          </Field>
          {error && <div className="banner-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Generating…" : "Generate report"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}