export default function Header() {
  return (
    <header className="header customerOnlyHeader">
      <a className="brand" href="/">
        <img src="/logo.png" alt="Erendira's Boutique" />
        <span className="brandText">
          <strong>Erendira&apos;s Boutique</strong>
          <span>Envios cada Sábado</span>
        </span>
      </a>
      <nav className="nav">
        <a className="primary" href="https://www.erendirasboutique.com/shop" target="_blank" rel="noreferrer">Shop</a>
      </nav>
    </header>
  );
}
