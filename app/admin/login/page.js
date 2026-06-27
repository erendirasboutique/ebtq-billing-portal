"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      setMessage("Wrong password. Try again.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="content">
      <section className="card">
        <p className="eyebrow">Admin Login</p>
        <h1>Admin Dashboard</h1>
        <p>Enter your private admin password to view all Stripe payments.</p>
        <form className="form" onSubmit={login}>
          <input
            className="input"
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="buttonPrimary" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Log In"}
          </button>
          {message && <div className="alert">{message}</div>}
        </form>
      </section>
    </main>
  );
}
