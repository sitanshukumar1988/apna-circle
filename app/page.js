'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCookies } from 'next-client-cookies'; // Ye package baad mein add karenge

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const t = useTranslations('HomePage');

  useEffect(() => {
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

  const changeLanguage = (lang) => {
    document.cookie = `locale=${lang}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {/* Language Switch Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => changeLanguage('en')} style={{ margin: '0 5px', padding: '5px 10px' }}>English</button>
        <button onClick={() => changeLanguage('hi')} style={{ margin: '0 5px', padding: '5px 10px' }}>हिंदी</button>
      </div>

      <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      
      {user ? (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e0f7fa', borderRadius: '8px', display: 'inline-block' }}>
          <p>{t('loggedInAs')} <strong>{user.email}</strong></p>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', marginTop: '10px', cursor: 'pointer' }}>{t('logout')}</button>
        </div>
      ) : (
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <a href="/login" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>{t('login')}</a>
          <a href="/signup" style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>{t('signup')}</a>
        </div>
      )}
    </div>
  );
      }
