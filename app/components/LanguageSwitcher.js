'use client';
import { useEffect } from 'react';

export default function LanguageSwitcher() {
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
  }, []);

  const changeLanguage = (langCode) => {
    // Cookie set karein aur page reload karein
    document.cookie = `googtrans=/en/${langCode}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px', border: '1px solid rgba(255,255,255,0.3)' }}>
        <button
          onClick={() => changeLanguage('en')}
          style={{ padding: '4px 10px', borderRadius: '15px', border: 'none', backgroundColor: 'white', color: '#0070f3', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('hi')}
          style={{ padding: '4px 10px', borderRadius: '15px', border: 'none', backgroundColor: 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', marginLeft: '2px' }}
        >
          हिंदी
        </button>
      </div>
    </div>
  );
  }
