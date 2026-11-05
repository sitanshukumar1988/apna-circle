'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Loader from '../components/Loader';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      // 1. Notifications fetch karo
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);

      // 2. Sabko "Read" mark kar do (Badge hat jayega)
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      // 3. Following list nikaalo
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      if (followData) setFollowingList(followData.map(f => f.following_id));

      setLoading(false);
    };
    fetchNotifications();
  }, [router]);

  const handleFollowBack = async (targetUserId) => {
    if (!currentUser) return;
    
    if (followingList.includes(targetUserId)) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetUserId);
      setFollowingList(followingList.filter(id => id !== targetUserId));
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetUserId });
      setFollowingList([...followingList, targetUserId]);
    }
  };

  const getNotificationText = (type) => {
    switch(type) {
      case 'follow': return 'started following you';
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'message': return 'sent you a message 💬'; // 👈 Naya Message Notification Text
      default: return 'did something';
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '80px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Notifications</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No notifications yet.</p>
        ) : (
          notifications.map((notif) => {
            const isFollowing = followingList.includes(notif.sender_id);
            const isFollowType = notif.type === 'follow';
            
            return (
              <div 
                key={notif.id} 
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                <div onClick={() => router.push(`/user/${notif.sender_id}`)} style={{ cursor: 'pointer' }}>
                  {notif.sender_avatar ? (
                    <img src={notif.sender_avatar} alt="DP" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
                  )}
                </div>

                <div style={{ flex: 1 }} onClick={() => {
                   if(notif.type === 'message') router.push(`/chat/${notif.sender_id}`);
                   else router.push(`/user/${notif.sender_id}`);
                }}>
                  <p style={{ margin: 0, fontSize: '15px', color: '#333', cursor: 'pointer' }}>
                    <strong>{notif.sender_name || 'User'}</strong> {getNotificationText(notif.type)}.
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>
                    {new Date(notif.created_at).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, day: 'numeric', month: 'short' })}
                  </p>
                </div>

                {isFollowType && (
                  <button 
                    onClick={() => handleFollowBack(notif.sender_id)}
                    style={{ padding: '6px 12px', backgroundColor: isFollowing ? '#ddd' : '#0070f3', color: isFollowing ? '#333' : 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                  >
                    {isFollowing ? 'Following' : 'Follow Back'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
  }
