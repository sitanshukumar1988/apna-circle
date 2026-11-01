'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingList, setFollowingList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
        if (data) setFollowingList(data.map(f => f.following_id));
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim() === '') {
        setResults([]);
        return;
      }
      
      // Hum POSTS table se naam dhoondh rahe hain (jo 100% kaam karega)
      const { data, error } = await supabase
        .from('posts')
        .select('user_id, user_name, user_avatar')
        .ilike('user_name', `%${searchQuery}%`);

      if (!error && data) {
        // Duplicate naam hatao (agar ek user ki 2 post hain toh ek hi baar dikhe)
        const uniqueUsers = [];
        const map = new Map();
        for (const item of data) {
          if (!map.has(item.user_id)) {
            map.set(item.user_id, true);
            uniqueUsers.push({
              id: item.user_id,
              name: item.user_name,
              avatar_url: item.user_avatar
            });
          }
        }
        
        const filtered = uniqueUsers.filter(profile => profile.id !== currentUser?.id);
        setResults(filtered);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUser]);

  const handleFollow = async (targetUserId) => {
    if (!currentUser) return;
    
    if (followingList.includes(targetUserId)) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetUserId);
      setFollowingList(followingList.filter(id => id !== targetUserId));
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetUserId });
      setFollowingList([...followingList, targetUserId]);
    }
  };

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
          </div>
        ))}
      </div>

      {searchQuery && results.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No users found.</p>
      )}

    </div>
  );
          }
