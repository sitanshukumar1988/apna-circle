'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Saare users fetch karo
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Jo pehle se follow kar rahe hain unki list nikaalo
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (followData) setFollowingList(followData.map(f => f.following_id));
      }

      // Saare profiles fetch karo
      const { data } = await supabase.from('profiles').select('id, name, avatar_url, bio');
      if (data) setAllUsers(data);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  // 2. Live Search Filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    const filtered = allUsers.filter(user => {
      if (user.name) {
        return user.name.toLowerCase().includes(query);
      }
      return false;
    });
    
    setResults(filtered);
  }, [searchQuery, allUsers]);

  // 3. Follow/Unfollow Function
  const handleFollow = async (targetUserId) => {
    if (!currentUser) return;
    
    if (followingList.includes(targetUserId)) {
      // Unfollow
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetUserId);
      setFollowingList(followingList.filter(id => id !== targetUserId));
    } else {
      // Follow
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetUserId });
      setFollowingList([...followingList, targetUserId]);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Search Users</h1>
      </div>

      <input 
        type="text" 
        placeholder="Search by name..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', marginBottom: '20px', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.map((profile) => {
          const isFollowing = followingList.includes(profile.id);
          const isSelf = profile.id === currentUser?.id;

          return (
            <div 
              key={profile.id} 
              style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              {/* User Info (Click to open profile) */}
              <div 
                onClick={() => router.push(`/user/${profile.id}`)} 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="DP" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{profile.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{profile.bio || 'No bio'}</p>
                </div>
              </div>

              {/* Follow Button */}
              {!isSelf && (
                <button 
                  onClick={() => handleFollow(profile.id)}
                  style={{ 
                    padding: '6px 14px', 
                    backgroundColor: isFollowing ? '#ddd' : '#0070f3', 
                    color: isFollowing ? '#333' : 'white', 
                    border: 'none', 
                    borderRadius: '20px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {searchQuery && results.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No users found.</p>
      )}

    </div>
  );
        }
