"use client";

import { useState } from "react";
import T from "@/components/T";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
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
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      setMessage("Wrong admin email or password. Try again.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="content">
      <section className="card loginCard">
        <p className="eyebrow"><T en="Private Admin Login" es="Entrada Privada" /></p>
        <h1><T en="Admin Dashboard" es="Panel Administrativo" /></h1>
        <p>
          <T
            en="Only authorized Erendira's Boutique team members can view customer payment records."
            es="Solo el equipo autorizado de Erendira's Boutique puede ver los pagos de clientes."
          />
        </p>
        <form className="form" onSubmit={login}>
          <input
            className="input"
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="buttonPrimary" type="submit" disabled={loading}>
            {loading ? "Checking..." : <T en="Log In" es="Entrar" />}
          </button>
          {message && <div className="alert">{message}</div>}
        </form>
      </section>
    </main>
  );
}
