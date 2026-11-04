'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Saari posts fetch karo
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postsData) {
        setPosts(postsData);

        // 2. Jitne bhi users ki posts hain, unki profiles fetch karo
        const emails = [...new Set(postsData.map(p => p.user_email))];
        if (emails.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('email', emails);

          const profileMap = {};
          if (profilesData) {
            profilesData.forEach(p => {
              profileMap[p.email] = p;
            });
          }
          setProfiles(profileMap);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '70px' }}>
      
      <header style={{ backgroundColor: '#0070f3', padding: '15px', color: 'white', textAlign: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Apna Circle</h1>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Koi post nahi hai.</p>
        ) : (
          posts.map(post => {
            // Post ke email se uski fresh profile nikalo
            const userProfile = profiles[post.user_email] || {};
            const displayName = userProfile.name || post.user_name || post.user_email;
            const displayAvatar = userProfile.avatar_url || post.user_avatar;

            return (
              <div 
                key={post.id} 
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  marginBottom: '20px', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                  overflow: 'hidden' 
                }}
              >
                {/* Header: Naam aur DP profile se aa raha hai */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                  )}
                  <span style={{ fontWeight: 'bold' }}>{displayName}</span>
                </div>
                
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  style={{ width: '100%', display: 'block' }} 
                />
                
                {post.caption && (
                  <div style={{ padding: '10px 15px', fontSize: '15px' }}>
                    {post.caption}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Fixed Bottom Navigation Bar (LinkedIn style with Notifications) */}
      <nav style={{ 
        backgroundColor: 'white', 
        borderTop: '1px solid #ddd', 
        display: 'flex', 
        justifyContent: 'space-around', 
        padding: '10px 0', 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        width: '100%', 
        zIndex: 1000,
        boxShadow: '0 -1px 5px rgba(0,0,0,0.1)'
      }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Home</span>
        </button>
        
        <button onClick={() => router.push('/post')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>➕</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Post</span>
        </button>

        <button onClick={() => router.push('/notifications')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Notifications</span>
        </button>
        
        <button onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={{ fontSize: '12px', marginTop: '4px' }}>Profile</span>
        </button>
      </nav>

    </div>
  );
      }
