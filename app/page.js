'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import {
  TransformWrapper,
  TransformComponent,
} from 'react-zoom-pan-pinch';
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
  const [busyActions, setBusyActions] = useState({});

  const router = useRouter();

  // Load language and user feed
  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const savedLang = document.cookie
          .split('; ')
          .find((row) => row.startsWith('locale='));

        if (savedLang && active) {
          const value = savedLang.split('=')[1];
          if (value === 'en' || value === 'hi') setLang(value);
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          router.replace('/login');
          return;
        }

        if (!active) return;
        setUser(session.user);

        const [
          profileResult,
          postsResult,
          likesResult,
          commentsResult,
          savedResult,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(),

          supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false }),

          supabase.from('likes').select('*'),

          supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: true }),

          supabase
            .from('saved_posts')
            .select('post_id')
            .eq('user_id', session.user.id),
        ]);

        if (!active) return;

        if (postsResult.error) throw postsResult.error;
        if (likesResult.error) throw likesResult.error;
        if (commentsResult.error) throw commentsResult.error;
        if (savedResult.error) throw savedResult.error;

        setUserProfile(profileResult.data || null);
        setPosts(postsResult.data || []);

        const likesMap = {};

        (likesResult.data || []).forEach((like) => {
          if (!likesMap[like.post_id]) {
            likesMap[like.post_id] = [];
          }

          likesMap[like.post_id].push({
            user_id: like.user_id,
            user_name: like.user_name || 'User',
            user_avatar: like.user_avatar || null,
            reaction_type: like.reaction_type || 'like',
          });
        });

        setLikesData(likesMap);

        const commentsMap = {};

        (commentsResult.data || []).forEach((comment) => {
          if (!commentsMap[comment.post_id]) {
            commentsMap[comment.post_id] = [];
          }

          commentsMap[comment.post_id].push(comment);
        });

        setCommentsData(commentsMap);

        setSavedPosts(
          (savedResult.data || []).map((item) => item.post_id)
        );
      } catch (error) {
        console.error('Feed loading error:', error);

        if (active) {
          alert('Data load nahi ho saka. Internet aur Supabase settings check karein.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [router]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.menu-container')) {
        setShowMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Escape key closes image viewer
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFullImage(null);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const setActionBusy = (key, value) => {
    setBusyActions((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Like and reactions
  const handleReaction = async (postId, reactionType) => {
    if (!user || busyActions[`reaction-${postId}`]) return;

    const actionKey = `reaction-${postId}`;
    setActionBusy(actionKey, true);

    try {
      const existingLike = (likesData[postId] || []).find(
        (like) => like.user_id === user.id
      );

      if (existingLike) {
        if (existingLike.reaction_type === reactionType) {
          const { error } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;

          setLikesData((previous) => ({
            ...previous,
            [postId]: (previous[postId] || []).filter(
              (like) => like.user_id !== user.id
            ),
          }));
        } else {
          const { error } = await supabase
            .from('likes')
            .update({ reaction_type: reactionType })
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;

          setLikesData((previous) => ({
            ...previous,
            [postId]: (previous[postId] || []).map((like) =>
              like.user_id === user.id
                ? { ...like, reaction_type: reactionType }
                : like
            ),
          }));
        }
      } else {
        const userName =
          userProfile?.name ||
          user.email?.split('@')[0] ||
          'User';

        const userAvatar = userProfile?.avatar_url || null;

        const { error } = await supabase.from('likes').insert({
          post_id: postId,
          user_id: user.id,
          user_name: userName,
          user_avatar: userAvatar,
          reaction_type: reactionType,
        });

        if (error) throw error;

        setLikesData((previous) => ({
          ...previous,
          [postId]: [
            ...(previous[postId] || []),
            {
              user_id: user.id,
              user_name: userName,
              user_avatar: userAvatar,
              reaction_type: reactionType,
            },
          ],
        }));

        // Notify the post owner
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .maybeSingle();

        if (
          !postError &&
          postData?.user_id &&
          postData.user_id !== user.id
        ) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: postData.user_id,
              sender_id: user.id,
              sender_name: userName,
              sender_avatar: userAvatar,
              type: 'like',
              post_id: postId,
            });

          if (notificationError) {
            console.error(
              'Notification error:',
              notificationError
            );
          }
        }
      }

      setShowReactionPicker(null);
    } catch (error) {
      console.error('Reaction error:', error);
      alert('Reaction update nahi ho saka. Dobara try karein.');
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  // Delete post
  const handleDelete = async (postId) => {
    if (!user || busyActions[`delete-${postId}`]) return;

    const post = posts.find((item) => item.id === postId);

    if (!post || post.user_id !== user.id) {
      alert('Aap sirf apni post delete kar sakte hain.');
      setShowMenu(null);
      return;
    }

    const confirmed = window.confirm(
      'Kya aap sach mein ye post delete karna chahte hain?'
    );

    if (!confirmed) {
      setShowMenu(null);
      return;
    }

    const actionKey = `delete-${postId}`;
    setActionBusy(actionKey, true);

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPosts((previous) =>
        previous.filter((item) => item.id !== postId)
      );

      setLikesData((previous) => {
        const updated = { ...previous };
        delete updated[postId];
        return updated;
      });

      setCommentsData((previous) => {
        const updated = { ...previous };
        delete updated[postId];
        return updated;
      });

      setSavedPosts((previous) =>
        previous.filter((id) => id !== postId)
      );

      setShowMenu(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Post delete nahi hui. Permissions check karein.');
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  // Save or unsave post
  const handleSave = async (postId) => {
    if (!user || busyActions[`save-${postId}`]) return;

    const actionKey = `save-${postId}`;
    setActionBusy(actionKey, true);

    try {
      const isSaved = savedPosts.includes(postId);

      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        setSavedPosts((previous) =>
          previous.filter((id) => id !== postId)
        );
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;

        setSavedPosts((previous) =>
          previous.includes(postId)
            ? previous
            : [...previous, postId]
        );
      }

      setShowMenu(null);
    } catch (error) {
      console.error('Save error:', error);
      alert('Post save nahi hui. Dobara try karein.');
    } finally {
      setActionBusy(actionKey, false);
    }
  };

  // Copy post link
  const handleCopyLink = async (postId) => {
    const postLink =
      `${window.location.origin}/post/${encodeURIComponent(postId)}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = postLink;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);
        textArea.select();

        const copied = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!copied) throw new Error('Copy failed');
      }

      alert('Link copied!');
    } catch (error) {
      console.error('Copy error:', error);
      alert(`Link copy nahi hua. Is link ko copy karein:\n${postLink}`);
    } finally {
      setShowMenu(null);
    }
  };

  // Share post
  const handleShare = async (postId) => {
    const postLink =
      `${window.location.origin}/post/${encodeURIComponent(postId)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Apna Circle Post',
          text: 'Dekho ye post Apna Circle par!',
          url: postLink,
        });
      } else {
        await handleCopyLink(postId);
        return;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        alert('Post share nahi ho saki.');
      }
    } finally {
      setShowMenu(null);
    }
  };

  const changeLanguage = (newLang) => {
    if (newLang !== 'en' && newLang !== 'hi') return;

    document.cookie =
      `locale=${newLang}; path=/; max-age=31536000; SameSite=Lax`;

    setLang(newLang);
  };

  const t = {
    en: {
      title: 'Apna Circle',
      feed: 'Your Feed',
      noPosts: 'No posts yet.',
      home: 'Home',
      search: 'Search',
      connections: 'Connections',
      post: 'Post',
      profile: 'Profile',
      like: 'Like',
      comment: 'Comment',
    },
    hi: {
      title: 'अपना सर्कल',
      feed: 'आपकी फीड',
      noPosts: 'अभी कोई पोस्ट नहीं है।',
      home: 'होम',
      search: 'खोजें',
      connections: 'कनेक्शन',
      post: 'पोस्ट',
      profile: 'प्रोफाइल',
      like: 'लाइक',
      comment: 'कमेंट',
    },
  };

  if (loading) return <Loader />;

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        Redirecting...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        paddingBottom: '75px',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#0070f3',
          padding: '15px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          {t[lang].title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/notifications')}
            aria-label="Notifications"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              marginRight: '15px',
            }}
          >
            🔔
          </button>

          <button
            onClick={() => changeLanguage('en')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              marginRight: '10px',
              fontWeight: lang === 'en' ? 'bold' : 'normal',
            }}
          >
            EN
          </button>

          <button
            onClick={() => changeLanguage('hi')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontWeight: lang === 'hi' ? 'bold' : 'normal',
            }}
          >
            HI
          </button>
        </div>
      </header>

      {/* Feed */}
      <main
        style={{
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '500px' }}>
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>
              {t[lang].noPosts}
            </p>
          ) : (
            posts.map((post) => {
              const displayName =
                post.user_name ||
                post.user_email?.split('@')[0] ||
                'User';

              const isOwner = post.user_id === user.id;
              const postLikesArray = likesData[post.id] || [];

              const myLike = postLikesArray.find(
                (like) => like.user_id === user.id
              );

              const postLikes = postLikesArray.length;
              const postComments = commentsData[post.id] || [];

              const reactionCounts = {};

              postLikesArray.forEach((like) => {
                const type = like.reaction_type || 'like';
                reactionCounts[type] =
                  (reactionCounts[type] || 0) + 1;
              });

              const reactionLabel = myLike
                ? {
                    like: '👍 Liked',
                    love: '❤️ Loved',
                    haha: '😂 Haha',
                    wow: '😮 Wow',
                    sad: '😢 Sad',
                  }[myLike.reaction_type] || '👍 Liked'
                : '🤍 Like';

              return (
                <article
                  key={post.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'visible',
                  }}
                >
                  {/* Post header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 15px',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div
                      onClick={() => {
                        if (post.user_id) {
                          router.push(`/user/${post.user_id}`);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        minWidth: 0,
                      }}
                    >
                      {post.user_avatar ? (
                        <img
                          src={post.user_avatar}
                          alt="Profile"
                          loading="lazy"
                          style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            backgroundColor: '#ddd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          👤
                        </div>
                      )}

                      <span
                        style={{
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {displayName}
                      </span>
                    </div>

                    {/* Post menu */}
                    <div
                      className="menu-container"
                      style={{ position: 'relative', flexShrink: 0 }}
                    >
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowMenu(
                            showMenu === post.id ? null : post.id
                          );
                        }}
                        aria-label="Post options"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          
