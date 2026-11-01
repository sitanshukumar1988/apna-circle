'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [fullImage, setFullImage] = useState(null);
  
  const [likesData, setLikesData] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    const savedLang = document.cookie.split('; ').find(row => row.startsWith('locale='));
    if (savedLang) setLang(savedLang.split('=')[1]);

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profileData) setUserProfile(profileData);

      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (postsData) setPosts(postsData);

      const { data: likesData } = await supabase.from('likes').select('*');
      if (likesData) {
        const likesMap = {};
        likesData.forEach(like => {
          if (!likesMap[like.post_id]) likesMap[like.post_id] = [];
          likesMap[like.post_id].push({
            user_id: like.user_id,
            user_name: like.user_name || 'User',
            user_avatar: like.user_avatar
          });
        });
        setLikesData(likesMap);
      }

      const { data: commentsData } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
      if (commentsData) {
        const commentsMap = {};
        commentsData.forEach(comment => {
          if (!commentsMap[comment.post_id]) commentsMap[comment.post_id] = [];
          commentsMap[comment.post_id].push(comment);
        });
        setCommentsData(commentsMap);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleLike = async (postId) => {
    const hasLiked = likesData[postId]?.some(like => like.user_id === user.id);
    
    if (hasLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikesData(prev => ({
        ...prev,
        [postId]: prev[postId].filter(like => like.user_id !== user.id)
      }));
    } else {
      const userName = userProfile?.name || user.email.split('@')[0];
      const userAvatar = userProfile?.avatar_url || null;
      
      await supabase.from('likes').insert({ 
        post_id: postId, 
        user_id: user.id,
        user_name: userName,
        user_avatar: userAvatar
      });
      
      setLikesData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { user_id: user.id, user_name: userName, user_avatar: userAvatar }]
      }));
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Kya aap sach me ye post delete karna chahte hain?')) {
      await supabase.from('posts').delete().eq('id', postId);
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  const changeLanguage = (newLang) => {
    document.cookie = `locale=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  };

  const t = {
    en: { title: "Apna Circle", feed: "Your Feed", noPosts: "No posts yet.", home: "Home", search: "Search", post: "Post", profile: "Profile", like: "Like", comment: "Comment" },
    hi: { title: "अपना सर्कल", feed: "आपकी फीड", noPosts: "अभी कोई पोस्ट नहीं है।", home: "होम", search: "खोजें", post: "पोस्ट", profile: "प्रोफाइल", like: "लाइक", comment: "कमेंट" }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0070f3', color: 'white' }}><h1>Loading...</h1></div>;
  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Redirecting...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      <header style={{ backgroundColor: '#0070f3', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{t[lang].title}</h1>
        <div>
          <button onClick={() => changeLanguage('en')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '10px' }}>EN</button>
          <button onClick={() => changeLanguage('hi')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>HI</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>{t[lang].noPosts}</p>
          ) : (
            posts.map((post) => {
              const displayName = post.user_name || post.user_email.split('@')[0];
              const isOwner = user.email === post.user_email;
              const postLikesArray = likesData[post.id] || [];
              const hasLiked = postLikesArray.some(like => like.user_id === user.id);
              const postLikes = postLikesArray.length;
              const postComments = commentsData[post.id] || [];

              return (
                <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  
                  {/* Post Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                    <div onClick={() => router.push(`/user/${post.user_id}`)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      {post.user_avatar ? (
                        <img src={post.user_avatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                      )}
                      <span style={{ fontWeight: 'bold' }}>{displayName}</span>
                    </div>
                    {isOwner && <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'red' }}>🗑️</button>}
                  </div>

                  {/* Post Image */}
                  <img src={post.image_url} alt="Post" onClick={() => setFullImage(post.image_url)} style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                  
                  {/* LinkedIn Style Action Bar */}
                  <div style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                    
                    {/* Left Side: Counts */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div 
                        onClick={() => router.push(`/likes/${post.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '15px', color: '#666' }}
                      >
                        <span style={{ fontSize: '18px' }}>👍</span> {postLikes}
                      </div>
                      
                      <div 
                        onClick={() => router.push(`/comments/${post.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '15px', color: '#666' }}
                      >
                        <span style={{ fontSize: '18px' }}>💬</span> {postComments.length}
                      </div>
                    </div>

                    {/* Right Side: Reaction Icons */}
                    {postLikes > 0 && (
                      <div 
                        onClick={() => router.push(`/likes/${post.id}`)}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '-6px', zIndex: 3, border: '2px solid white' }}>
                          <span style={{ color: 'white', fontSize: '10px' }}>👍</span>
                        </div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '-6px', zIndex: 2, border: '2px solid white' }}>
                          <span style={{ color: 'white', fontSize: '10px' }}>❤️</span>
                        </div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#ffc107', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '2px solid white' }}>
                          <span style={{ color: 'white', fontSize: '10px' }}>😂</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Like/Unlike Buttons */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    <button onClick={() => handleLike(post.id)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: hasLiked ? '#dc3545' : '#666', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                      {hasLiked ? '❤️ Liked' : '🤍 Like'}
                    </button>
                    <button onClick={() => router.push(`/comments/${post.id}`)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#666', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                      💬 Comment
                    </button>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <div style={{ padding: '10px 15px', fontSize: '15px' }}>
                      <strong>{displayName}: </strong> {post.caption}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', padding: '15px 0', position: 'sticky', bottom: 0 }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '12px' }}>{t[lang].home}</span>
        </button>
        <button onClick={() => router.push('/search')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <span style={{ fontSize: '12px' }}>{t[lang].search}</span>
        </button>
        <button onClick={() => router.push('/post')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>➕</span>
          <span style={{ fontSize: '12px' }}>{t[lang].post}</span>
        </button>
        <button onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <span style={{ fontSize: '20px' }}>👤</span>
          <span style={{ fontSize: '12px' }}>{t[lang].profile}</span>
        </button>
      </nav>

      {/* Full Image Popup */}
      {fullImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <button onClick={() => setFullImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 1001 }}>✕</button>
          <div onClick={() => setFullImage(null)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <img src={fullImage} alt="Full Post" style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '5px' }} />
          </div>
        </div>
      )}

    </div>
  );
  }
