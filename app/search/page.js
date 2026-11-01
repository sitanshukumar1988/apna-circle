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

  // 1. Saare users fetch karo (Posts se)
  useEffect(() => {
    const fetchAllUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);

      const { data, error } = await supabase
        .from('posts')
        .select('user_id, user_name, user_avatar');
      
      if (!error && data) {
        // Duplicate users hatao
        const uniqueUsers = [];
        const map = new Map();
        for (const item of data) {
          if (item.user_id && !map.has(item.user_id)) {
            map.set(item.user_id, true);
            uniqueUsers.push({
              id: item.user_id,
              name: item.user_name || 'User',
              avatar_url: item.user_avatar
            });
          }
        }
        setAllUsers(uniqueUsers);
      }
      setLoading(false);
    };
    fetchAllUsers();
  }, []);

  // 2. Live Search (Browser me filter)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    // Browser me filter karo (Apne aap ko bhi dikhao)
    const filtered = allUsers.filter(user => 
      user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setResults(filtered);
    
  }, [searchQuery, allUsers]);

  // 3. Follow/Unfollow (Agar khud ko follow na kar sake, toh button hide karenge)
  const handleFollow = async (targetUserId) => {
    if (!currentUser || targetUserId === currentUser.id) return;
    
    if (followingList.includes(targetUserId)) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetUserId);
      setFollowingList(followingList.filter(id => id !== targetUserId));
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetUserId });
      setFollowingList([...followingList, targetUserId]);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading users...</div>;

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
        {results.map((profile) => (
          <div key={profile.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            
            <div 
              onClick={() => router.push(`/user/${profile.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="DP" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{profile.name}</h3>
              </div>
            </div>

            {/* Agar user khud hai toh Follow button mat dikhao */}
            {profile.id !== currentUser?.id ? (
              <button 
                onClick={() => handleFollow(profile.id)}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: followingList.includes(profile.id) ? '#ddd' : '#0070f3', 
                  color: followingList.includes(profile.id) ? '#333' : 'white', 
                  border: 'none', 
                  borderRadius: '5px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
              >
                {followingList.includes(profile.id) ? 'Following' : 'Follow'}
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>You</span>
            )}
          </div>
        ))}
      </div>

      {searchQuery && results.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No users found.</p>
      )}

      {/* Debug Info */}
      <div style={{ marginTop: '30px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
        Total users loaded: {allUsers.length}
      </div>

    </div>
  );
            }
