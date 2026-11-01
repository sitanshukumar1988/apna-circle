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
  
  // Likes aur Comments ke states
  const [likesData, setLikesData] = useState({}); // { post_id: [user_ids] }
  const [commentsData, setCommentsData] = useState({}); // { post_id: [comments] }
  const [commentText, setCommentText] = useState({}); // Kis post par kya likha ja raha hai
  
  const router = useRouter();

  useEffect(() => {
    const savedLang = document.cookie.split('; ').find(row => row.startsWith('locale='));
    if (savedLang) setLang(savedLang.split('=')[1]);

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUser(session.user);

      // Posts fetch karo
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (postsData) setPosts(postsData);

      // Likes fetch karo
      const { data: likesData } = await supabase.from('likes').select('*');
      if (likesData) {
        const likesMap = {};
        likesData.forEach(like => {
          if (!likesMap[like.post_id]) likesMap[like.post_id] = [];
          likesMap[like.post_id].push(like.user_id);
        });
        setLikesData(likesMap);
      }

      // Comments fetch karo
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
    const hasLiked = likesData[postId]?.includes(user.id);
    
    if (hasLiked) {
      // Unlike
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikesData(prev => ({
        ...prev,
        [postId]: prev[postId].filter(id => id !== user.id)
      }));
    } else {
      // Like
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      setLikesData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), user.id]
      }));
    }
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text || text.trim() === '') return;

    const { data: newComment } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email.split('@')[0], // Naam save karo
      comment_text: text
    }).select().single();

    if (newComment) {
      setCommentsData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setCommentText(prev => ({ ...prev, [postId]: '' })); // Input clear
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
    en: { title: "Apna Circle", feed: "Your Feed", noPosts: "No posts yet.", home: "Home", search: "Search", post: "Post", profile: "Profile", like: "Like", comment: "Comment", send: "Send" },
    hi: { title: "अपना सर्कल", feed: "आपकी फीड", noPosts: "अभी कोई पोस्ट नहीं है।", home: "होम", search: "खोजें", post: "पोस्ट", profile: "प्रोफाइल", like: "लाइक", comment: "कमेंट", send: "भेजें" }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0070f3', color: 'white' }}><h1>Loading...</h1></div>;
  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Redirecting...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Header */}
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
              const hasLiked = likesData[post.id]?.includes(user.id);
              const postLikes = likesData[post.id]?.length || 0;
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
                  <img src={post.image_url} alt="Post" onClick={() => setFullImage(post.image_url)} style={{ width: '100%', display: 'block', cursor: 'pointer' }} />
                  
                  {/* Post Actions (Like, Comment) */}
                  <div style={{ padding: '10px 15px', display: 'flex', gap: '15px', borderBottom: '1px solid #eee' }}>
                    <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: hasLiked ? '#dc3545' : '#333' }}>
                      {hasLiked ? '❤️' : '🤍'} {postLikes} {t[lang].like}
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                      💬 {postComments.length} {t[lang].comment}
                    </button>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <div style={{ padding: '10px 15px', fontSize: '15px' }}>
                      <strong>{displayName}: </strong> {post.caption}
                    </div>
                  )}

                  {/* Comments Section */}
                  <div style={{ padding: '10px 15px', backgroundColor: '#fafafa' }}>
                    {postComments.map(comment => (
                      <div key={comment.id} style={{ fontSize: '14px', marginBottom: '5px' }}>
                        <strong>{comment.user_name}: </strong> {comment.comment_text}
                      </div>
                    ))}

                    {/* Add Comment Input */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                        style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                      />
                      <button onClick={() => handleComment(post.id)} style={{ padding: '8px 12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {t[lang].send}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Bottom Nav */}
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
