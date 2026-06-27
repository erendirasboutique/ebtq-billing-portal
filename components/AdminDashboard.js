"use client";

import { useMemo, useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";
import T from "@/components/T";

export default function AdminDashboard({ payments = [], errorMessage = "", admin = null }) {
  const [search, setSearch] = useState("");

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((payment) =>
      [
        payment.customer_name,
        payment.customer_email,
        payment.description,
        payment.payment_status,
        payment.stripe_session_id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [payments, search]);

  const paidPayments = payments.filter((payment) => payment.payment_status === "paid");
  const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.amount_total || 0), 0);
  const today = new Date().toDateString();
  const todayPaid = paidPayments
    .filter((payment) => new Date(payment.created_at).toDateString() === today)
    .reduce((sum, payment) => sum + Number(payment.amount_total || 0), 0);
  const customerCount = new Set(payments.map((payment) => payment.customer_email).filter(Boolean)).size;

  function exportCsv() {
    const rows = [
      ["Customer", "Email", "Amount", "Currency", "Status", "Description", "Date", "Receipt"],
      ...filteredPayments.map((payment) => [
        payment.customer_name || "",
        payment.customer_email || "",
        payment.amount_total || "",
        payment.currency || "usd",
        payment.payment_status || "",
        payment.description || "",
        payment.created_at || "",
        payment.receipt_url || "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "erendiras-payments.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="content">
      <section className="card adminCard">
        <div className="adminTopbar">
          <div>
            <p className="eyebrow"><T en="Admin Dashboard" es="Panel de Administradora" /></p>
            <h1><T en="Stripe Payments" es="Pagos de Stripe" /></h1>
            <p>
              <T
                en="Private dashboard for Erendira's Boutique payments collected from Stripe Payment Links."
                es="Panel privado para los pagos de Erendira's Boutique recibidos por enlaces de pago de Stripe."
              />
            </p>
          </div>
          <div className="adminActions">
            {admin?.email && <span className="adminIdentity">{admin.email} · {admin.role}</span>}
            <a className="linkButton" href="/api/admin/logout"><T en="Log Out" es="Cerrar Sesión" /></a>
          </div>
        </div>

        <div className="grid dashboardGrid">
          <div className="stat"><strong>{payments.length}</strong><span><T en="Total payments" es="Pagos totales" /></span></div>
          <div className="stat"><strong>{formatMoney(totalPaid, "usd")}</strong><span><T en="All-time paid" es="Total pagado" /></span></div>
          <div className="stat"><strong>{formatMoney(todayPaid, "usd")}</strong><span><T en="Paid today" es="Pagado hoy" /></span></div>
          <div className="stat"><strong>{customerCount}</strong><span><T en="Customers" es="Clientes" /></span></div>
        </div>

        {errorMessage && <p className="alert">{errorMessage}</p>}

        <div className="toolbar">
          <input
            className="input searchInput"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, email, status..."
            aria-label="Search payments"
          />
          <button className="buttonPrimary smallButton" type="button" onClick={exportCsv}>
            <T en="Export CSV" es="Exportar CSV" />
          </button>
        </div>

        <div className="tableWrap" style={{ marginTop: 24 }}>
          <table>
            <thead>
              <tr>
                <th><T en="Customer" es="Cliente" /></th>
                <th><T en="Email" es="Correo" /></th>
                <th><T en="Amount" es="Cantidad" /></th>
                <th><T en="Status" es="Estado" /></th>
                <th><T en="Description" es="Descripción" /></th>
                <th><T en="Date" es="Fecha" /></th>
                <th><T en="Receipt" es="Recibo" /></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.customer_name || "—"}</td>
                  <td>{payment.customer_email || "—"}</td>
                  <td>{formatMoney(payment.amount_total, payment.currency)}</td>
                  <td><span className="badge">{payment.payment_status}</span></td>
                  <td>{payment.description || "—"}</td>
                  <td>{formatDate(payment.created_at)}</td>
                  <td>{payment.receipt_url ? <a href={payment.receipt_url} target="_blank" rel="noreferrer"><T en="Open" es="Abrir" /></a> : "—"}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <T
                      en="No payments found. After a Stripe Payment Link is paid, it will show here."
                      es="No se encontraron pagos. Cuando un enlace de pago de Stripe sea pagado, aparecerá aquí."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
