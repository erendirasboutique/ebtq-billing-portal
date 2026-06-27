import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("erendiras_admin")?.value;

  if (!session || session !== process.env.ADMIN_SESSION_SECRET) {
    redirect("/admin/login");
  }

  const supabase = getSupabaseAdmin();
  const { data: payments = [], error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  const totalPaid = payments
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount_total || 0), 0);

  return (
    <main className="content">
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1>Stripe Payments</h1>
            <p>All customer payments collected from Stripe Payment Links.</p>
          </div>
          <a className="linkButton" href="/api/admin/logout">Log Out</a>
        </div>

        <div className="grid">
          <div className="stat"><strong>{payments.length}</strong><span>Total payments</span></div>
          <div className="stat"><strong>{formatMoney(totalPaid, "usd")}</strong><span>Total paid</span></div>
          <div className="stat"><strong>{new Set(payments.map((p) => p.customer_email)).size}</strong><span>Customers</span></div>
        </div>

        {error && <p className="alert">{error.message}</p>}

        <div className="tableWrap" style={{ marginTop: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
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
                  <td>{payment.customer_name || "—"}</td>
                  <td>{payment.customer_email || "—"}</td>
                  <td>{formatMoney(payment.amount_total, payment.currency)}</td>
                  <td><span className="badge">{payment.payment_status}</span></td>
                  <td>{payment.description || "—"}</td>
                  <td>{formatDate(payment.created_at)}</td>
                  <td>{payment.receipt_url ? <a href={payment.receipt_url} target="_blank" rel="noreferrer">Open</a> : "—"}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan="7">No payments yet. After a Stripe Payment Link is paid, it will show here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
