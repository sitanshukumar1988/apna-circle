'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Loader from '../components/Loader';

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
      setLoading(false);
    };
    fetchNotifications();
  }, [router]);

  if (loading) return <Loader />;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Notifications</h1>
      </div>

      {/* Notifications List */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No notifications yet.</p>
        ) : (
          notifications.map((notif, index) => (
            <div key={notif.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: index !== notifications.length - 1 ? '1px solid #eee' : 'none' }}>
              {notif.sender_avatar ? (
                <img src={notif.sender_avatar} alt="DP" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: '15px' }}>
                  <strong>{notif.sender_name || 'User'}</strong> {notif.type === 'like' ? 'liked your post' : notif.type === 'comment' ? 'commented on your post' : 'started following you'}.
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', padding: '15px 0', position: 'fixed', bottom: 0, left: 0, width: '100%' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '12px' }}>Home</span>
        </button>
        <button onClick={() => router.push('/search')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <span style={{ fontSize: '12px' }}>Search</span>
        </button>
        <button onClick={() => router.push('/connections')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
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
