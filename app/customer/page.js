"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

function formatMoney(amount, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount || 0));
}

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function CustomerPage() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase public environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
      if (data.user) await loadPayments();
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMagicLink(event) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase public environment variables are missing.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/customer`,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Check your email for the login link. Use the same email you used at checkout.");
  }

  async function loadPayments() {
    if (!supabase) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) return;

    const response = await fetch("/api/customer-payments", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    setPayments(result.payments || []);
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/customer";
  }

  if (loading) {
    return (
      <main className="content"><section className="card"><p>Loading...</p></section></main>
    );
  }

  if (!user) {
    return (
      <main className="content">
        <section className="card">
          <p className="eyebrow">Customer Portal</p>
          <h1>View Your Payments</h1>
          <p>Enter the same email you used to pay your Stripe payment link. We will send a secure login link.</p>
          <form className="form" onSubmit={sendMagicLink}>
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button className="buttonPrimary" type="submit">Send Login Link</button>
            {message && <div className="alert">{message}</div>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="content">
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow">Customer Portal</p>
            <h1>Your Payments</h1>
            <p>Showing payment history for {user.email}.</p>
          </div>
          <button className="linkButton" onClick={logout}>Log Out</button>
        </div>

        <div className="tableWrap" style={{ marginTop: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatMoney(payment.amount_total, payment.currency)}</td>
                  <td><span className="badge">{payment.payment_status}</span></td>
                  <td>{payment.description || "Stripe Payment"}</td>
                  <td>{formatDate(payment.created_at)}</td>
                  <td>{payment.receipt_url ? <a href={payment.receipt_url} target="_blank" rel="noreferrer">Open</a> : "—"}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan="5">No payments found for this email yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
