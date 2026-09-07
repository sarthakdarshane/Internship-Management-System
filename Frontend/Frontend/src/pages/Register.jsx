import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "INTERN",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(formData);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <span className="intro-logo">IM</span>
        <p className="eyebrow">INTERNSHIP MANAGEMENT</p>
        <h1>Start your growth journey.</h1>
        <p>
          Create an account to track tasks, submit updates, and receive
          structured feedback from your mentor.
        </p>
      </section>

      <main className="auth-card">
        <div>
          <p className="eyebrow">GET STARTED</p>
          <h2>Create your account</h2>
          <p className="muted">
            New accounts start as interns. An admin can change your role later.
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <label>
            Full name
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </main>
    </div>
  );
}