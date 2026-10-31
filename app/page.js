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

    // User check karo
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // Agar login nahi hai, toh login page par bhej do
      } else {
        setUser(session.user);
      }
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

  // Translations
  const t = {
    en: { 
      title: "Apna Circle", 
      feed: "Your Feed", 
      noPosts: "No posts yet. Be the first to post!",
      home: "Home",
      post: "Post",
      profile: "Profile",
      logout: "Logout"
    },
    hi: { 
      title: "अपना सर्कल", 
      feed: "आपकी फीड", 
      noPosts: "अभी कोई पोस्ट नहीं है। पहली पोस्ट आप करें!",
      home: "होम",
      post: "पोस्ट",
      profile: "प्रोफाइल",
      logout: "लॉगआउट"
    }
  };

  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

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
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].home}</span>
        </button>
        
        {/* Post Button (Aage chalkar kaam karega) */}
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>➕</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].post}</span>
        </button>
        
        {/* Profile / Logout Button */}
        <button onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}>
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].logout}</span>
        </button>
      </nav>
    </div>
  );
    }
