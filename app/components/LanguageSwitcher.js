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
            includedLanguages: 'en,hi', // Sirf English aur Hindi
            autoDisplay: false,
          },
          'google_translate_element'
        );
      };
    }

    // 2. Purani language cookie check karein (agar user ne pehle change ki thi)
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    if (match) {
      const lang = match[2].split('/')[2]; // 'en' ya 'hi'
      const selectElement = document.querySelector('.goog-te-combo');
      if (selectElement && selectElement.value !== lang) {
        selectElement.value = lang;
        selectElement.dispatchEvent(new Event('change'));
      }
    }
  }, []);

  const changeLanguage = (langCode) => {
    // Google Translate ke hidden dropdown ko select karein
    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
      selectElement.value = langCode;
      selectElement.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* Google Translate ka hidden container (Isko dikhne ki zaroorat nahi) */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* Hamare professional buttons */}
      <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px', border: '1px solid rgba(255,255,255,0.3)' }}>
        <button
          onClick={() => changeLanguage('en')}
          style={{ padding: '4px 12px', borderRadius: '15px', border: 'none', backgroundColor: 'white', color: '#0070f3', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('hi')}
          style={{ padding: '4px 12px', borderRadius: '15px', border: 'none', backgroundColor: 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginLeft: '2px' }}
        >
          HI
        </button>
      </div>
    </div>
  );
            }
