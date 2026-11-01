'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Connections() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: followersData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id);

      if (followersData && followersData.length > 0) {
        const followerIds = followersData.map(f => f.follower_id);
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', followerIds);
        if (profiles) setFollowers(profiles);
      }

      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(f => f.following_id);
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', followingIds);
        if (profiles) setFollowing(profiles);
      }

      setLoading(false);
    };
    fetchConnections();
  }, [router]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/profile')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>My Connections</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <button 
          onClick={() => setActiveTab('followers')} 
          style={{ flex: 1, padding: '15px', background: activeTab === 'followers' ? '#0070f3' : 'white', color: activeTab === 'followers' ? 'white' : '#666', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Followers ({followers.length})
        </button>
        <button 
          onClick={() => setActiveTab('following')} 
          style={{ flex: 1, padding: '15px', background: activeTab === 'following' ? '#0070f3' : 'white', color: activeTab === 'following' ? 'white' : '#666', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Following ({following.length})
        </button>
      </div>

      {/* List Area */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {activeTab === 'followers' ? (
          followers.length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>No followers yet.</p> :
          followers.map(profile => (
            <div key={profile.id} onClick={() => router.push(`/user/${profile.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="DP" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{profile.name || 'User'}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{profile.bio || 'No bio'}</p>
              </div>
            </div>
          ))
        ) : (
          following.length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>You are not following anyone.</p> :
          following.map(profile => (
            <div key={profile.id} onClick={() => router.push(`/user/${profile.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="DP" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{profile.name || 'User'}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{profile.bio || 'No bio'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', padding: '15px 0', position: 'fixed', bottom: 0, left: 0, width: '100%' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '12px' }}>Home</span>
        </button>
        <button onClick={() => router.push('/search')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <span style={{ fontSize: '12px' }}>Search</span>
        </button>
        <button onClick={() => router.push('/connections')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}>
          <span style={{ fontSize: '20px' }}>👥</span>
          <span style={{ fontSize: '12px' }}>Connections</span>
        </button>
        <button onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={{ fontSize: '12px' }}>Profile</span>
        </button>
      </nav>

    </div>
  );
    }
