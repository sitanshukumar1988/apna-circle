'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // 👈 Import kiya
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Loader from './components/Loader';
import LanguageSwitcher from './components/LanguageSwitcher';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [likesData, setLikesData] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [fullImage, setFullImage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [activeOptionsPost, setActiveOptionsPost] = useState(null); 
  const [savedPosts, setSavedPosts] = useState([]); 
  const [toastMsg, setToastMsg] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [isHindi, setIsHindi] = useState(false); 

  const router = useRouter();

  const getReactionEmoji = (type) => {
    switch(type) {
      case 'love': return '❤️';
      case 'haha': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      default: return '👍';
    }
  };

  useEffect(() => {
    setIsHindi(document.cookie.includes('googtrans=/en/hi'));

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        if (count) setUnreadCount(count);

        const { data: savedData } = await supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', user.id);
        if (savedData) setSavedPosts(savedData.map(s => s.post_id));
      }

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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) return;

    const hasLiked = likesData[postId]?.find(like => like.user_id === currentUser.id);
    
    if (hasLiked) {
      if (hasLiked.reaction_type === reactionType) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
        setLikesData(prev => ({
          ...prev,
          [postId]: prev[postId].filter(like => like.user_id !== currentUser.id)
        }));
      } else {
        await supabase.from('likes').update({ reaction_type: reactionType }).eq('post_id', postId).eq('user_id', currentUser.id);
        setLikesData(prev => ({
          ...prev,
          [postId]: prev[postId].map(like => like.user_id === currentUser.id ? { ...like, reaction_type: reactionType } : like)
        }));
      }
    } else {
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', currentUser.id).single();
      
      const newLike = { 
        post_id: postId, 
        user_id: currentUser.id,
        user_name: profile?.name || currentUser.email.split('@')[0],
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

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Kya aap sach me ye post delete karna chahte hain?")) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    
    if (error) {
      showToast("Post delete nahi ho payi: " + error.message);
    } else {
      setPosts((prev) => prev.filter(p => p.id !== postId));
      setActiveOptionsPost(null);
      showToast("Post deleted successfully!");
    }
  };

  const handleShare = async (post) => {
    const shareData = {
      title: 'Apna Circle Post',
      text: post.caption ? `Check out this post on Apna Circle: ${post.caption}` : 'Check out this post on Apna Circle!',
      url: window.location.origin, 
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        showToast("🔗 Link copied to clipboard!");
      }
    } catch (error) {
      console.log('Error sharing:', error);
    } finally {
      setActiveOptionsPost(null);
    }
  };

  const handleSaveToggle = async (postId) => {
    const isSaved = savedPosts.includes(postId);

    if (isSaved) {
      const { error } = await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      if (!error) {
        setSavedPosts(prev => prev.filter(id => id !== postId));
        showToast("Post removed from saved! 🔖");
      }
    } else {
      const { error } = await supabase.from('saved_posts').insert({ post_id: postId, user_id: currentUser.id });
      if (!error) {
        setSavedPosts(prev => [...prev, postId]);
        showToast("Post saved successfully! 🔖");
      }
    }
    setActiveOptionsPost(null);
  };

  if (loading) return <Loader />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', paddingBottom: '80px' }}>
      
      <header style={{ backgroundColor: '#0070f3', padding: '12px 15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="notranslate" style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            {isHindi ? 'अपना सर्कल' : 'Apna Circle'}
          </h1>
          <LanguageSwitcher /> 
        </div>
        
        <div className="notranslate" style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '9px', fontWeight: 'bold', opacity: 0.9 }}>
            {isHindi ? 'सितांशु कुमार द्वारा संस्थापित' : 'FOUNDED BY SITANSHU KUMAR'}
          </p>
          <p style={{ margin: 0, fontSize: '8px', opacity: 0.8 }}>
            {isHindi ? 'SDRHP टीम के साथ' : 'With SDRHP Team'}
          </p>
        </div>
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
            const myLike = postLikesArray.find(like => like.user_id === currentUser?.id);
            const postCommentsCount = commentsData[post.id]?.length || 0;

            return (
              <div 
                key={post.id} 
                style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                  <div onClick={() => router.push(`/user/${post.user_id}`)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                    )}
                    <span className="notranslate" style={{ fontWeight: 'bold' }}>{displayName}</span>
                  </div>
                  
                  <button onClick={() => setActiveOptionsPost(post)} style={{ background: 'none', border: 'none', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', color: '#666', padding: '0 5px' }}>
                    ⋮
                  </button>
                </div>
                
                <img src={post.image_url} alt="Post" onClick={() => setFullImage(post.image_url)} style={{ width: '100%', display: 'block', cursor: 'pointer' }} />
                
                {post.caption && (
                  <div style={{ padding: '10px 15px', fontSize: '15px' }}>{post.caption}</div>
                )}

                <div style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eee', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {myLike ? getReactionEmoji(myLike.reaction_type) : '🤍'} React
                    </button>

                    <button onClick={() => router.push(`/comments/${String(post.id)}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#333', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      💬 {postCommentsCount} Comment
                    </button>
                  </div>

                  {postLikes > 0 && (
                    <div onClick={() => router.push(`/likes/${String(post.id)}`)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', backgroundColor: '#f0f2f5', padding: '2px 8px', borderRadius: '10px', fontSize: '13px', color: '#555' }}>
                      <span style={{ fontSize: '16px' }}>{getReactionEmoji(postLikesArray[0]?.reaction_type)}</span> 
                      <span style={{ marginLeft: '4px' }}>{postLikes}</span>
                    </div>
                  )}

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

      {activeOptionsPost && (
        <div onClick={() => setActiveOptionsPost(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', width: '100%', maxWidth: '500px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', paddingBottom: '20px', overflow: 'hidden' }}>
            
            <div style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#666' }}>Post Options</div>

            <button onClick={() => handleShare(activeOptionsPost)} style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', textAlign: 'left', fontSize: '16px', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}>
              🔗 Share
            </button>

            <button onClick={() => handleSaveToggle(activeOptionsPost.id)} style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', textAlign: 'left', fontSize: '16px', color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}>
              {savedPosts.includes(activeOptionsPost.id) ? '❌ Unsave Post' : '🔖 Save Post'}
            </button>

            {activeOptionsPost.user_id === currentUser?.id && (
              <button onClick={() => handleDeletePost(activeOptionsPost.id)} style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', textAlign: 'left', fontSize: '16px', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px' }}>
                🗑️ Delete Post
              </button>
            )}

            <button onClick={() => setActiveOptionsPost(null)} style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#0070f3', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#333', color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', zIndex: 4000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          {toastMsg}
        </div>
      )}

      {/* 👈 BOTTOM NAVIGATION BAR (Yahan <Link> use kiya hai) */}
      <nav style={{ backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0', position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 1000, boxShadow: '0 -1px 5px rgba(0,0,0,0.1)' }}>
        <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#0070f3', flex: 1, textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>🏠</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Home</span>
        </Link>
        <Link href="/search" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666', flex: 1, textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>🔍</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Search</span>
        </Link>
        <Link href="/connections" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666', flex: 1, textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>👥</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Network</span>
        </Link>
        <Link href="/post" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#0070f3', flex: 1, textDecoration: 'none' }}>
          <span style={{ fontSize: '22px', fontWeight: 'bold' }}>➕</span><span style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>Post</span>
        </Link>
        <Link href="/chats" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666', flex: 1, textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>💬</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Chats</span>
        </Link>
        <Link href="/notifications" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666', flex: 1, position: 'relative', textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>🔔</span>
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Alerts</span>
          {unreadCount > 0 && (
            <div style={{ position: 'absolute', top: '-2px', right: '15px', backgroundColor: 'red', color: 'white', borderRadius: '50%', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', padding: '0 4px', border: '2px solid white' }}>
              {unreadCount}
            </div>
          )}
        </Link>
        <Link href="/profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666', flex: 1, textDecoration: 'none' }}>
          <span style={{ fontSize: '22px' }}>👤</span><span style={{ fontSize: '10px', marginTop: '2px' }}>Profile</span>
        </Link>
      </nav>

      {fullImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
          <button onClick={() => setFullImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 2001 }}>✕</button>
          <TransformWrapper>
            <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }} contentStyle={{ width: "100%", height: "100%" }}>
              <img src={fullImage} alt="Full Post" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </TransformComponent>
          </TransformWrapper>
        </div>
      )}

    </div>
  );
}
