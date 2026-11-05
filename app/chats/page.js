'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Loader from '../components/Loader';

export default function ChatList() {
  const [chatUsers, setChatUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      // 1. Un sabhi messages ko fetch karein jisme current user involved hai
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messages) {
        // 2. Unique users ki ID nikalne ka logic (Set ka use karke)
        const userIds = new Set();
        messages.forEach(msg => {
          if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
          if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
        });

        // 3. Un users ki profile fetch karein
        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', Array.from(userIds));
          
          setChatUsers(profiles || []);
        }
      }
      setLoading(false);
    };
    fetchChats();
  }, [router]);

  if (loading) return <Loader />;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '80px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Messages</h1>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {chatUsers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Abhi tak koi chat nahi hai. Kisi user ki profile par jaakar Message par click karein!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chatUsers.map((u) => (
              <div 
                key={u.id} 
                onClick={() => router.push(`/chat/${u.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid #eee', cursor: 'pointer' }}
              >
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="dp" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
                )}
                <div>
                  <h3 style={{ fontSize: '16px', margin: 0, fontWeight: 'bold' }}>{u.name || 'User'}</h3>
                  <p style={{ margin: 0, color: '#0070f3', fontSize: '13px' }}>Tap to open chat 💬</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navbar */}
      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0', position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 1000, boxShadow: '0 -1px 5px rgba(0,0,0,0.1)' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>🏠</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Home</span>
        </button>
        <button onClick={() => router.push('/search')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>🔍</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Search</span>
        </button>
        <button onClick={() => router.push('/connections')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>👥</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Network</span>
        </button>
        <button onClick={() => router.push('/post')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3', flex: 1 }}>
          <span style={{ fontSize: '22px', fontWeight: 'bold' }}>➕</span><span style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>Post</span>
        </button>
        <button onClick={() => router.push('/chats')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>💬</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Chats</span>
        </button>
        <button onClick={() => router.push('/notifications')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1, position: 'relative' }}>
          <span style={{ fontSize: '22px' }}>🔔</span>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Alerts</span>
        </button>
        <button onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>👤</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Profile</span>
        </button>
      </nav>
    </div>
  );
    }
