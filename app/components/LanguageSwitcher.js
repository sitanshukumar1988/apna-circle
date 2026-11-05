'use client';
import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // 1. Google Translate script load karein
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      };
    }

    // 2. Check karein ki abhi kaunsi language active hai
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    if (match && match[2]) {
      const parts = match[2].split('/');
      if (parts[2] === 'hi') {
        setCurrentLang('hi');
      } else {
        setCurrentLang('en');
      }
    } else {
      setCurrentLang('en'); // Default English
    }
  }, []);

  const changeLanguage = (langCode) => {
    if (langCode === 'en') {
      // 👈 Agar English select kiya hai, toh Google Translate ki cookie delete karo
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
    } else {
      // Agar Hindi select kiya hai, toh cookie set karo
      document.cookie = `googtrans=/en/${langCode}; path=/; max-age=31536000`;
    }
    // Page reload karo taaki change dikh sake
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px', border: '1px solid rgba(255,255,255,0.3)' }}>
        <button
          onClick={() => changeLanguage('en')}
          style={{ 
            padding: '4px 10px', 
            borderRadius: '15px', 
            border: 'none', 
            backgroundColor: currentLang === 'en' ? 'white' : 'transparent', 
            color: currentLang === 'en' ? '#0070f3' : 'white', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            fontSize: '11px' 
          }}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('hi')}
          style={{ 
            padding: '4px 10px', 
            borderRadius: '15px', 
            border: 'none', 
            backgroundColor: currentLang === 'hi' ? 'white' : 'transparent', 
            color: currentLang === 'hi' ? '#0070f3' : 'white', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            fontSize: '11px', 
            marginLeft: '2px' 
          }}
        >
          हिंदी
        </button>
      </div>
    </div>
  );
  }
