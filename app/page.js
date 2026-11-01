'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Loader from './components/Loader';

export default function Home() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [fullImage, setFullImage] = useState(null);
  
  const [likesData, setLikesData] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [savedPosts, setSavedPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  
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
            user_avatar: like.user_avatar,
            reaction_type: like.reaction_type || 'like'
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

      const { data: savedData } = await supabase.from('saved_posts').select('post_id').eq('user_id', session.user.id);
      if (savedData) setSavedPosts(savedData.map(s => s.post_id));

      setLoading(false);
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setShowMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleReaction = async (postId, reactionType) => {
    const hasLiked = likesData[postId]?.find(like => like.user_id === user.id);
    
    if (hasLiked) {
      if (hasLiked.reaction_type === reactionType) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
        setLikesData(prev => ({
          ...prev,
          [postId]: prev[postId].filter(like => like.user_id !== user.id)
        }));
      } else {
        await supabase.from('likes').update({ reaction_type: reactionType }).eq('post_id', postId).eq('user_id', user.id);
        setLikesData(prev => ({
          ...prev,
          [postId]: prev[postId].map(like => like.user_id === user.id ? { ...like, reaction_type: reactionType } : like)
        }));
      }
    } else {
      const userName = userProfile?.name || user.email.split('@')[0];
      const userAvatar = userProfile?.avatar_url || null;
      
      await supabase.from('likes').insert({ 
        post_id: postId, 
        user_id: user.id,
        user_name: userName,
        user_avatar: userAvatar,
        reaction_type: reactionType
      });
      
      setLikesData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { user_id: user.id, user_name: userName, user_avatar: userAvatar, reaction_type: reactionType }]
      }));

      // Notification Bhejo
      const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (postData && postData.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postData.user_id,
          sender_id: user.id,
          sender_name: userName,
          sender_avatar: userAvatar,
          type: 'like',
          post_id: postId
        });
      }
    }
    setShowReactionPicker(null);
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Kya aap sach me ye post delete karna chahte hain?')) {
      await supabase.from('posts').delete().eq('id', postId);
      setPosts(posts.filter(post => post.id !== postId));
    }
    setShowMenu(null);
  };

  const handleSave = async (postId) => {
    if (savedPosts.includes(postId)) {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
      setSavedPosts(savedPosts.filter(id => id !== postId));
      alert("Post Un-saved!");
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
      setSavedPosts([...savedPosts, postId]);
      alert("Post Saved!");
    }
    setShowMenu(null);
  };

  const handleCopyLink = (postId) => {
    const postLink = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postLink);
    alert("Link Copied!");
    setShowMenu(null);
  };

  const handleShare = async (postId) => {
    const postLink = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Apna Circle Post',
          text: 'Dekho ye post Apna Circle par!',
          url: postLink,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(postLink);
      alert("Link Copied! (Share not supported on this browser)");
    }
    setShowMenu(null);
  };

  const changeLanguage = (newLang) => {
    document.cookie = `locale=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  };

  const t = {
    en: { title: "Apna Circle", feed: "Your Feed", noPosts: "No posts yet.", home: "Home", search: "Search", connections: "Connections", post: "Post", profile: "Profile", like: "Like", comment: "Comment" },
    hi: { title: "अपना सर्कल", feed: "आपकी फीड", noPosts: "अभी कोई पोस्ट नहीं है।", home: "होम", search: "खोजें", connections: "कनेक्शन", post: "पोस्ट", profile: "प्रोफाइल", like: "लाइक", comment: "कमेंट" }
  };

  if (loading) return <Loader />;
  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Redirecting...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '70px' }}>
      
      {/* Header with Bell Icon - Sticky at top */}
      <header style={{ backgroundColor: '#0070f3', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{t[lang].title}</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          
          {/* Notification Bell */}
          <button onClick={() => router.push('/notifications')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px', marginRight: '15px' }}>
            🔔
          </button>

          <button onClick={() => changeLanguage('en')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '10px' }}>EN</button>
          <button onClick={() => changeLanguage('hi')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>HI</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>{t[lang].noPosts}</p>
          ) : (
            posts.map((post) => {
              const displayName = post.user_name || post.user_email.split('@')[0];
              const isOwner = user.email === post.user_email;
              const postLikesArray = likesData[post.id] || [];
              const myLike = postLikesArray.find(like => like.user_id === user.id);
              const postLikes = postLikesArray.length;
              const postComments = commentsData[post.id] || [];
              
              const reactionCounts = {};
              postLikesArray.forEach(l => {
                const type = l.reaction_type || 'like';
                reactionCounts[type] = (reactionCounts[type] || 0) + 1;
              });

              return (
                <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                    <div onClick={() => router.push(`/user/${post.user_id}`)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      {post.user_avatar ? (
                        <img src={post.user_avatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                      )}
                      <span style={{ fontWeight: 'bold' }}>{displayName}</span>
                    </div>
                    
                    <div className="menu-container" style={{ position: 'relative' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === post.id ? null : post.id); }} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#666', padding: '5px' }}
                      >
                        ⋮
                      </button>

                      {showMenu === post.id && (
                        <div style={{ position: 'absolute', top: '30px', right: '0', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 100, display: 'flex', flexDirection: 'column', width: '150px' }}>
                          {isOwner && (
                            <button onClick={() => handleDelete(post.id)} style={{ padding: '10px', textAlign: 'left', border: 'none', background: 'none', color: '#dc3545', cursor: 'pointer', borderBottom: '1px solid #eee' }}>🗑️ Delete</button>
                          )}
                          <button onClick={() => handleSave(post.id)} style={{ padding: '10px', textAlign: 'left', border: 'none', background: 'none', color: '#333', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                            {savedPosts.includes(post.id) ? '🔖 Unsave' : '🔖 Save'}
                          </button>
                          <button onClick={() => handleCopyLink(post.id)} style={{ padding: '10px', textAlign: 'left', border: 'none', background: 'none', color: '#333', cursor: 'pointer', borderBottom: '1px solid #eee' }}>🔗 Copy Link</button>
                          <button onClick={() => handleShare(post.id)} style={{ padding: '10px', textAlign: 'left', border: 'none', background: 'none', color: '#333', cursor: 'pointer' }}>📤 Share</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <img src={post.image_url} alt="Post" onClick={() => setFullImage(post.image_url)} style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                  
                  <div style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div onClick={() => router.push(`/likes/${String(post.id)}`)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '15px', color: '#666' }}>
                        <span style={{ fontSize: '18px' }}>👍</span> {postLikes}
                      </div>
                      <div onClick={() => router.push(`/comments/${String(post.id)}`)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '15px', color: '#666' }}>
                        <span style={{ fontSize: '18px' }}>💬</span> {postComments.length}
                      </div>
                    </div>

                    {postLikes > 0 && (
                      <div onClick={() => router.push(`/likes/${String(post.id)}`)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        {reactionCounts.like > 0 && <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '-6px', zIndex: 3, border: '2px solid white' }}><span style={{ color: 'white', fontSize: '10px' }}>👍</span></div>}
                        {reactionCounts.love > 0 && <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '-6px', zIndex: 2, border: '2px solid white' }}><span style={{ color: 'white', fontSize: '10px' }}>❤️</span></div>}
                        {reactionCounts.haha > 0 && <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#ffc107', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '2px solid white' }}><span style={{ color: 'white', fontSize: '10px' }}>😂</span></div>}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', borderBottom: '1px solid #eee', position: 'relative' }}>
                    <button 
                      onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)} 
                      style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: myLike ? '#0a66c2' : '#666', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                    >
                      {myLike ? (
                        myLike.reaction_type === 'love' ? '❤️ Loved' : myLike.reaction_type === 'haha' ? '😂 Haha' : myLike.reaction_type === 'wow' ? '😮 Wow' : myLike.reaction_type === 'sad' ? '😢 Sad' : '👍 Liked'
                      ) : '🤍 Like'}
                    </button>
                    
                    <button onClick={() => router.push(`/comments/${String(post.id)}`)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#666', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                      💬 Comment
                    </button>

                    {showReactionPicker === post.id && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '20px', backgroundColor: 'white', borderRadius: '30px', padding: '5px 15px', display: 'flex', gap: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 10 }}>
                        <button onClick={() => handleReaction(post.id, 'like')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>👍</button>
                        <button onClick={() => handleReaction(post.id, 'love')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>❤️</button>
                        <button onClick={() => handleReaction(post.id, 'haha')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😂</button>
                        <button onClick={() => handleReaction(post.id, 'wow')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😮</button>
                        <button onClick={() => handleReaction(post.id, 'sad')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😢</button>
                      </div>
                    )}
                  </div>

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

      {/* Fixed Bottom Navigation */}
      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', padding: '10px 0', position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 1000, boxShadow: '0 -1px 5px rgba(0,0,0,0.1)' }}>
        <button onClick={() => router.push('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3' }}><span style={{ fontSize: '20px' }}>🏠</span><span style={{ fontSize: '12px' }}>{t[lang].home}</span></button>
        <button onClick={() => router.push('/search')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><span style={{ fontSize: '20px' }}>🔍</span><span style={{ fontSize: '12px' }}>{t[lang].search}</span></button>
        <button onClick={() => router.push('/connections')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><span style={{ fontSize: '20px' }}>👥</span><span style={{ fontSize: '12px' }}>{t[lang].connections}</span></button>
        <button onClick={() => router.push('/post')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><span style={{ fontSize: '20px' }}>➕</span><span style={{ fontSize: '12px' }}>{t[lang].post}</span></button>
        <button onClick={() => router.push('/profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><span style={{ fontSize: '20px' }}>👤</span><span style={{ fontSize: '12px' }}>{t[lang].profile}</span></button>
      </nav>

      {fullImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
          <button onClick={() => setFullImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 2001 }}>✕</button>
          <TransformWrapper>
            <TransformComponent wrapperStyle={{ width: "100vw", height:
