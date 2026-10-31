'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedLang = document.cookie.split('; ').find(row => row.startsWith('locale='));
    if (savedLang) setLang(savedLang.split('=')[1]);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setTimeout(() => setLoading(false), 1000);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const changeLanguage = (newLang) => {
    document.cookie = `locale=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  };

  const t = {
    en: { title: "Apna Circle", feed: "Your Feed", noPosts: "No posts yet. Be the first to post!", home: "Home", post: "Post", logout: "Logout" },
    hi: { title: "अपना सर्कल", feed: "आपकी फीड", noPosts: "अभी कोई पोस्ट नहीं है। पहली पोस्ट आप करें!", home: "होम", post: "पोस्ट", logout: "लॉगआउट" }
  };

  // Splash Screen Logic
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0070f3', color: 'white', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '10px', letterSpacing: '2px' }}>
          APNA CIRCLE
        </h1>
        <div style={{ marginTop: '10px', marginBottom: '20px' }}>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0', opacity: 0.9 }}>Founded by Sitanshu Kumar</p>
          <p style={{ fontSize: '14px', margin: '2px 0', opacity: 0.8 }}>With SDRHP Team</p>
        </div>
        <div style={{ paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0', opacity: 0.9 }}>संस्थापक: सितांशु कुमार</p>
          <p style={{ fontSize: '14px', margin: '2px 0', opacity: 0.8 }}>SDRHP टीम के साथ</p>
        </div>
      </div>
    );
  }

  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Redirecting...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#0070f3', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{t[lang].title}</h1>
        <div>
          <button onClick={() => changeLanguage('en')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '10px', fontWeight: lang === 'en' ? 'bold' : 'normal' }}>EN</button>
          <button onClick={() => changeLanguage('hi')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: lang === 'hi' ? 'bold' : 'normal' }}>HI</button>
        </div>
      </header>

      {/* Main Feed Area */}
      <main style={{ flex: 1, padding: '20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', color: '#666' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>{t[lang].feed}</h2>
          <p>{t[lang].noPosts}</p>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', padding: '15px 0' }}>
        
        {/* HOME BUTTON (Ab kaam karega) */}
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].home}</span>
        </button>
        
        {/* POST BUTTON (Ab kaam karega) */}
        <button onClick={() => router.push('/post')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>➕</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].post}</span>
        </button>
        
        {/* LOGOUT BUTTON */}
        <button onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}>
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].logout}</span>
        </button>
        
      </nav>
    </div>
  );
    }
