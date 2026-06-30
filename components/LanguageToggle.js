'use client';

export default function LanguageToggle({ lang, setLang }) {
  return (
    <div className="lang no-print">
      <button className={`button ${lang === 'en' ? 'secondary' : 'ghost'} mini`} onClick={() => setLang('en')}>EN</button>
      <button className={`button ${lang === 'es' ? 'secondary' : 'ghost'} mini`} onClick={() => setLang('es')}>ES</button>
    </div>
  );
}
