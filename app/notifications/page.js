'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Notifications</h1>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Abhi koi notification nahi hai.</p>
        ) : (
          notifications.map((notif, index) => (
            <div key={notif.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: index !== notifications.length - 1 ? '1px solid #eee' : 'none' }}>
              {notif.sender_avatar ? (
                <img src={notif.sender_avatar} alt="DP" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
              )}
              <p style={{ margin: 0, fontSize: '15px' }}>
                <strong>{notif.sender_name || 'User'}</strong> {notif.type === 'like' ? 'ne aapki post like ki' : notif.type === 'comment' ? 'ne aapki post par comment kiya' : 'ne aapko follow kiya'}.
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
                }
