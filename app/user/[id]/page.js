'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function UserProfile({ params }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Photo badi karne ke liye states
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState(null);
  
  const router = useRouter();
  const userId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileData) setProfile(profileData);
        else setProfile({ name: 'User', bio: 'No bio yet', city: 'India', avatar_url: '' });

        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (postsData) setPosts(postsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Profile...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>{profile?.name || 'Profile'}</h1>
      </div>

      {/* Profile Info Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        {profile?.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt="DP" 
            onClick={() => { setFullImageUrl(profile.avatar_url); setShowFullImage(true); }}
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0070f3', margin: '0 auto', cursor: 'pointer' }} 
          />
        ) : (
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#ddd', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
        )}
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '15px' }}>{profile?.name}</h2>
        <p style={{ color: '#666', marginTop: '5px' }}>{profile?.bio}</p>
        <p style={{ color: '#0070f3', fontWeight: 'bold', marginTop: '5px' }}>📍 {profile?.city}</p>
      </div>

      {/* Posts Grid */}
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Posts</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {posts.map(post => (
          <img 
            key={post.id} 
            src={post.image_url} 
            alt="Post" 
            onClick={() => { setFullImageUrl(post.image_url); setShowFullImage(true); }}
            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} 
          />
        ))}
      </div>

      {/* Full Image Popup */}
      {showFullImage && (
        <div 
          onClick={() => setShowFullImage(false)} 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '10px', maxWidth: '95%', maxHeight: '95%' }}>
            <img src={fullImageUrl} alt="Full" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '5px' }} />
          </div>
        </div>
      )}

    </div>
  );
    }
