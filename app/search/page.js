'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Saare users fetch karo
  useEffect(() => {
    const fetchAllUsers = async () => {
      // Saare profiles fetch karo
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, bio');
      
      if (error) {
        console.log("Error:", error);
      }

      if (data) {
        setAllUsers(data);
      }
      setLoading(false);
    };
    fetchAllUsers();
  }, []);

  // 2. Live Search Filter (Browser me hoga)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Filter lagao (Apne aap ko bhi dikhao)
    const filtered = allUsers.filter(user => {
      if (user.name) {
        return user.name.toLowerCase().includes(query);
      }
      return false;
    });
    
    setResults(filtered);
    
  }, [searchQuery, allUsers]);

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
        {results.map((profile) => (
          <div 
            key={profile.id} 
            onClick={() => router.push(`/user/${profile.id}`)} 
            style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
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
        ))}
      </div>

      {searchQuery && results.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No users found.</p>
      )}

      {/* Debug Info (Check karne ke liye) */}
      <div style={{ marginTop: '30px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>
        Total users loaded: {allUsers.length}
      </div>

    </div>
  );
            }
