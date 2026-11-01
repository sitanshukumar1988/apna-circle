'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function UserProfile({ params }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState(null);
  const router = useRouter();
  
  const userEmail = decodeURIComponent(params.email);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .single();
      
      if (profileData) setProfile(profileData);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });
      
      if (postsData) setPosts(postsData);
    };

    if (userEmail) fetchUserData();
  }, [userEmail]);

  if (!profile) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Profile...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>
          ←
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>{profile.name || 'User Profile'}</h1>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt="DP" 
            onClick={() => { setFullImageUrl(profile.avatar_url); setShowFullImage(true); }}
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0070f3', cursor: 'pointer', margin: '0 auto' }} 
          />
        ) : (
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#ddd', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
        )}
        
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginTop: '15px' }}>{profile.name || 'Anonymous'}</h2>
        <p style={{ color: '#666', marginTop: '5px' }}>{profile.bio || 'No bio yet.'}</p>
        <p style={{ color: '#0070f3', fontWeight: 'bold', marginTop: '5px' }}>📍 {profile.city || 'India'}</p>
      </div>

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

      {showFullImage && (
        <div onClick={() => setShowFullImage(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <img src={fullImageUrl} alt="Full" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
