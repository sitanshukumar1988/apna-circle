'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [likesData, setLikesData] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postsData) {
        setPosts(postsData);

        const emails = [...new Set(postsData.map(p => p.user_email))];
        if (emails.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('email', emails);

          const profileMap = {};
          if (profilesData) {
            profilesData.forEach(p => {
              profileMap[p.email] = p;
            });
          }
          setProfiles(profileMap);
        }
      }

      const { data: likesFetched } = await supabase.from('likes').select('*');
      if (likesFetched) {
        const likesMap = {};
        likesFetched.forEach(like => {
          if (!likesMap[like.post_id]) likesMap[like.post_id] = [];
          likesMap[like.post_id].push(like);
        });
        setLikesData(likesMap);
      }

      const { data: commentsFetched } = await supabase.from('comments').select('post_id');
      if (commentsFetched) {
        const commentsMap = {};
        commentsFetched.forEach(comment => {
          if (!commentsMap[comment.post_id]) commentsMap[comment.post_id] = [];
          commentsMap[comment.post_id].push(comment);
        });
        setCommentsData(commentsMap);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleReaction = async (postId, reactionType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hasLiked = likesData[postId]?.find(like => like.user_id === user.id);
    
    if (hasLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikesData(prev => ({
        ...prev,
        [postId]: prev[postId].filter(like => like.user_id !== user.id)
      }));
    } else {
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();
      
      const newLike = { 
        post_id: postId, 
        user_id: user.id,
        user_name: profile?.name || user.email.split('@')[0],
        user_avatar: profile?.avatar_url,
        reaction_type: reactionType
      };

      await supabase.from('likes').insert(newLike);
      
      setLikesData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newLike]
      }));
    }
    setShowReactionPicker(null);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '80px' }}>
      
      <header style={{ backgroundColor: '#0070f3', padding: '15px', color: 'white', textAlign: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Apna Circle</h1>
      </header>

      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Koi post nahi hai.</p>
        ) : (
          posts.map(post => {
            const userProfile = profiles[post.user_email] || {};
            const displayName = userProfile.name || post.user_name || post.user_email;
            const displayAvatar = userProfile.avatar_url || post.user_avatar;
            const postLikesArray = likesData[post.id] || [];
            const postLikes = postLikesArray.length;
            const postCommentsCount = commentsData[post.id]?.length || 0;

            return (
              <div 
                key={post.id} 
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  marginBottom: '20px', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                  overflow: 'hidden' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                  )}
                  <span style={{ fontWeight: 'bold' }}>{displayName}</span>
                </div>
                
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  style={{ width: '100%', display: 'block' }} 
                />
                
                {post.caption && (
                  <div style={{ padding: '10px 15px', fontSize: '15px' }}>
                    {post.caption}
                  </div>
                )}

                <div style={{ padding: '10px 15px', display: 'flex', gap: '20px', borderTop: '1px solid #eee', position: 'relative' }}>
                  <button 
                    onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    👍 {postLikes} Like
                  </button>

                  <button 
                    onClick={() => router.push(`/comments/${String(post.id)}`)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    💬 {postCommentsCount} Comment
                  </button>

                  {showReactionPicker === post.id && (
                    <div style={{ position: 'absolute', bottom: '100%', left: '15px', backgroundColor: 'white', borderRadius: '30px', padding: '5px 15px', display: 'flex', gap: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 10 }}>
                      <button onClick={() => handleReaction(post.id, 'like')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>👍</button>
                      <button onClick={() => handleReaction(post.id, 'love')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>❤️</button>
                      <button onClick={() => handleReaction(post.id, 'haha')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😂</button>
                      <button onClick={() => handleReaction(post.id, 'wow')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😮</button>
                      <button onClick={() => handleReaction(post.id, 'sad')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😢</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* NEW Fixed Bottom Navigation Bar */}
      <nav style={{ 
        backgroundColor: 'white', 
        borderTop: '1px solid #ddd', 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        padding: '8px 0', 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        width: '100%', 
        zIndex: 1000,
        boxShadow: '0 -1px 5px rgba(0,0,0,0.1)'
      }}>
        
        {/* Home */}
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>🏠</span>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Home</span>
        </button>

        {/* Search */}
        <button onClick={() => router.push('/search')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>🔍</span>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Search</span>
        </button>

        {/* Connections */}
        <button onClick={() => router.push('/connections')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>👥</span>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Network</span>
        </button>

        {/* Fancy Post Button */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => router.push('/post')} 
            style={{ 
              width: '45px', 
              height: '45px', 
              borderRadius: '50%', 
              background: 'linear-gradient(45deg, #0070f3, #00c6ff)', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0, 112, 243, 0.4)',
              transform: 'translateY(-10px)' 
            }}
          >
            <span style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '-2px' }}>+</span>
          </button>
        </div>

        {/* Notifications */}
        <button onClick={() => router.push('/notifications')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>🔔</span>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Alerts</span>
        </button>

        {/* Profile */}
        <button onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666', flex: 1 }}>
          <span style={{ fontSize: '22px' }}>👤</span>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Profile</span>
        </button>

      </nav>

    </div>
  );
          }
