'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Loader from '../../components/Loader'; 

export default function UserProfile({ params }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [theyFollowMe, setTheyFollowMe] = useState(false); // 👈 Naya state
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const router = useRouter();
  
  const userId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (myProfile) setCurrentUserProfile(myProfile);

        // 1. Kya main isko follow karta hu?
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();
        if (followData) setIsFollowing(true);

        // 2. Kya ye mujhe follow karta hai?
        const { data: theyFollowData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', userId)
          .eq('following_id', user.id)
          .single();
        if (theyFollowData) setTheyFollowMe(true);
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileData) setProfile(profileData);

      setLoading(false);
    };
    if (userId) fetchData();
  }, [userId]);

  const handleFollow = async () => {
    if (!currentUser) return;
    
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
      setIsFollowing(true);

      if (userId !== currentUser.id) {
        await supabase.from('notifications').insert({
          user_id: userId,
          sender_id: currentUser.id,
          sender_name: currentUserProfile?.name || currentUser.email.split('@')[0],
          sender_avatar: currentUserProfile?.avatar_url || null,
          type: 'follow'
        });
      }
    }
  };

  if (loading) return <Loader />; 
  if (!profile) return <div style={{ textAlign: 'center', marginTop: '50px' }}>User not found</div>;

  // 👈 Check: Kya dono ek dusre ko follow karte hain?
  const canChat = isFollowing && theyFollowMe;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Profile</h1>
      </div>

      <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="DP" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0070f3' }} />
        ) : (
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#ddd', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
        )}
        
        <h2 style={{ marginTop: '15px' }}>{profile.name}</h2>
        <p style={{ color: '#666' }}>{profile.bio}</p>
        <p style={{ color: '#0070f3' }}>📍 {profile.city}</p>
        
        {currentUser && currentUser.id !== userId && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={handleFollow} 
              style={{ 
                padding: '10px 25px', 
                backgroundColor: isFollowing ? '#ddd' : '#0070f3', 
                color: isFollowing ? '#333' : 'white', 
                border: 'none', 
                borderRadius: '20px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '14px',
                flex: 1
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>

            {/* 👈 Message Button Update */}
            <button 
              onClick={() => canChat ? router.push(`/chat/${userId}`) : alert('Chat karne ke liye dono ko ek dusre ko follow karna hoga!')} 
              style={{ 
                padding: '10px 25px', 
                backgroundColor: canChat ? 'white' : '#f0f2f5', 
                color: canChat ? '#0070f3' : '#999', 
                border: canChat ? '1px solid #0070f3' : '1px solid #ccc', 
                borderRadius: '20px', 
                cursor: canChat ? 'pointer' : 'not-allowed', 
                fontWeight: 'bold',
                fontSize: '14px',
                flex: 1
              }}
            >
              {canChat ? 'Message' : 'Follow to Chat'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
          }
