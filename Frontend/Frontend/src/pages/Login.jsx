import { useContext, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProfile, login } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, saveUser } = useContext(AuthContext);
  const navigate = useNavigate();
  if (user) return <Navigate to="/dashboard" replace />;
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await login({ email, password });
      const token = data.token || data.accessToken;
      if (!token)
        throw new Error("The sign-in response did not include a token.");
      localStorage.setItem("token", token);
      const profile =
        data.user ||
        (await getProfile()).data.user ||
        (await getProfile()).data;
      saveUser(profile);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-intro">
        <span className="intro-logo">IM</span>
        <p className="eyebrow">INTERNSHIP MANAGEMENT</p>
        <h1>Make every internship count.</h1>
        <p>
          One focused space for interns, mentors, administrators, and HR teams.
        </p>
      </section>
      <main className="auth-card">
        <div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your workspace</h2>
          <p className="muted">
            Use your registered account details to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </main>
    </div>
  );
}
