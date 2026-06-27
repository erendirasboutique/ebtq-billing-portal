export default function HomePage() {
  return (
    <main className="hero">
      <section className="heroCard">
        <p className="eyebrow">Payment Portal</p>
        <h1>Erendira&apos;s Boutique</h1>
        <p>
          Track Stripe payments, view customer payment history, and keep boutique orders organized in one branded portal.
        </p>
        <div className="nav" style={{ marginTop: 24 }}>
          <a className="primary" href="/customer">View My Payments</a>
          <a href="/admin/login">Admin Dashboard</a>
        </div>
        <div className="grid">
          <div className="stat"><strong>Stripe</strong><span>Payment Link tracking</span></div>
          <div className="stat"><strong>Admin</strong><span>All customer payments</span></div>
          <div className="stat"><strong>Customer</strong><span>Email login history</span></div>
        </div>
      </section>
    </main>
  );
}
