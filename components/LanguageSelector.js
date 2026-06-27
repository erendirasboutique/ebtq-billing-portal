"use client";

import { useEffect, useState } from "react";

export default function LanguageSelector() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("erendiras_lang") || "en";
    setLang(saved);
    document.documentElement.dataset.lang = saved;
  }, []);

  function updateLanguage(nextLang) {
    setLang(nextLang);
    window.localStorage.setItem("erendiras_lang", nextLang);
    document.documentElement.dataset.lang = nextLang;
  }

  return (
    <div className="languageSelector" aria-label="Language selector">
      <button
        type="button"
        className={lang === "en" ? "active" : ""}
        onClick={() => updateLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === "es" ? "active" : ""}
        onClick={() => updateLanguage("es")}
      >
        ES
      </button>
    </div>
  );
}
