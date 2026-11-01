'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [fullImage, setFullImage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const savedLang = document.cookie.split('; ').find(row => row.startsWith('locale='));
    if (savedLang) setLang(savedLang.split('=')[1]);

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setPosts(data);
      
      setTimeout(() => setLoading(false), 1000);
    };
    fetchData();
  }, [router]);

  const handleDelete = async (postId) => {
    if (window.confirm('Kya aap sach me ye post delete karna chahte hain?')) {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) {
        alert('Error deleting post: ' + error.message);
      } else {
        setPosts(posts.filter(post => post.id !== postId));
      }
    }
  };

  const changeLanguage = (newLang) => {
    document.cookie = `locale=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  };

  const t = {
    en: { title: "Apna Circle", feed: "Your Feed", noPosts: "No posts yet. Be the first to post!", home: "Home", post: "Post", profile: "Profile" },
    hi: { title: "अपना सर्कल", feed: "आपकी फीड", noPosts: "अभी कोई पोस्ट नहीं है। पहली पोस्ट आप करें!", home: "होम", post: "पोस्ट", profile: "प्रोफाइल" }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0070f3', color: 'white', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '10px', letterSpacing: '2px' }}>APNA CIRCLE</h1>
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
      
      <header style={{ backgroundColor: '#0070f3', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{t[lang].title}</h1>
        <div>
          <button onClick={() => changeLanguage('en')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '10px', fontWeight: lang === 'en' ? 'bold' : 'normal' }}>EN</button>
          <button onClick={() => changeLanguage('hi')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: lang === 'hi' ? 'bold' : 'normal' }}>HI</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#333', textAlign: 'center' }}>{t[lang].feed}</h2>
          
          {posts.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', color: '#666' }}>
              <p>{t[lang].noPosts}</p>
            </div>
          ) : (
            posts.map((post) => {
              const displayName = post.user_name || post.user_email.split('@')[0];
              const isOwner = user.email === post.user_email;
              
              return (
                <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  
                  {/* Post Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                    <div 
                      onClick={() => router.push(`/user/${post.user_id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                    >
                      {post.user_avatar ? (
                        <img src={post.user_avatar} alt="Profile" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                      )}
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{displayName}</span>
                    </div>

                    {isOwner && (
                      <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#dc3545', padding: '5px' }}>🗑️</button>
                    )}
                  </div>

                  <img src={post.image_url} alt="Post" onClick={() => setFullImage(post.image_url)} style={{ width: '100%', display: 'block', cursor: 'pointer' }} />
                  
                  {post.caption && (
                    <div style={{ padding: '10px 15px', fontSize: '15px' }}>
                      <strong>{displayName}: </strong> {post.caption}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', padding: '15px 0', position: 'sticky', bottom: 0 }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].home}</span>
        </button>
        
        <button onClick={() => router.push('/post')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>➕</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].post}</span>
        </button>
        
        <button onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>{t[lang].profile}</span>
        </button>
      </nav>

      {/* Full Image Popup with Close Button */}
      {fullImage && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}
        >
          {/* Close Button (X) */}
          <button 
            onClick={() => setFullImage(null)} 
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}
          >
            ✕
          </button>

          <div 
            onClick={() => setFullImage(null)} 
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}
          >
            <img src={fullImage} alt="Popup Post" style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '5px' }} />
          </div>
        </div>
      )}
    </div>
  );
      }
