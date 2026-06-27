'use client';
export default function LanguageToggle({ lang, setLang }) {
  return <div className="lang"><button className={lang==='en'?'button secondary':'button ghost'} onClick={()=>setLang('en')}>EN</button><button className={lang==='es'?'button secondary':'button ghost'} onClick={()=>setLang('es')}>ES</button></div>;
}
