'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const router = useRouter();

  useEffect(() => {
    // Language check karo
    const savedLang = document.cookie.split('; ').find(row => row.startsWith('locale='));
    if (savedLang) setLang(savedLang.split('=')[1]);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const changeLanguage = (newLang) => {
    document.cookie = `locale=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  };

  // Translations
  const t = {
    en: { title: "Welcome to Apna Circle", subtitle: "Your app is being built!", login: "Login", signup: "Sign Up", logout: "Logout", loggedIn: "Logged in as:" },
    hi: { title: "अपना सर्कल में आपका स्वागत है", subtitle: "आपका ऐप बन रहा है!", login: "लॉगिन करें", signup: "साइन अप करें", logout: "लॉगआउट", loggedIn: "लॉग इन हैं:" }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => changeLanguage('en')} style={{ margin: '0 5px', padding: '5px 10px' }}>English</button>
        <button onClick={() => changeLanguage('hi')} style={{ margin: '0 5px', padding: '5px 10px' }}>हिंदी</button>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>{t[lang].title}</h1>
      <p>{t[lang].subtitle}</p>
      
      {user ? (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e0f7fa', borderRadius: '8px', display: 'inline-block' }}>
          <p>{t[lang].loggedIn} <strong>{user.email}</strong></p>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', marginTop: '10px', cursor: 'pointer' }}>{t[lang].logout}</button>
        </div>
      ) : (
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <a href="/login" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>{t[lang].login}</a>
          <a href="/signup" style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>{t[lang].signup}</a>
        </div>
      )}
    </div>
  );
    }
