'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function CommentsPage({ params }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const postId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) setUserProfile(profile);

      // Post fetch karo
      const { data: postData } = await supabase.from('posts').select('*').eq('id', postId).single();
      if (postData) setPost(postData);

      // Comments fetch karo
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (commentsData) setComments(commentsData);

      setLoading(false);
    };
    fetchData();
  }, [postId, router]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const userName = userProfile?.name || user.email.split('@')[0];
    const userAvatar = userProfile?.avatar_url || null;

    const { data: addedComment, error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      user_name: userName,
      user_avatar: userAvatar,
      comment_text: newComment
    }).select().single();

    if (!error && addedComment) {
      setComments([...comments, addedComment]);
      setNewComment('');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Comments</h1>
      </div>

      {/* Post Info (Optional) */}
      {post && (
        <div style={{ padding: '10px 15px', backgroundColor: '#fafafa', borderBottom: '1px solid #eee', fontSize: '14px', color: '#666' }}>
          <strong>{post.user_name}:</strong> {post.caption}
        </div>
      )}

      {/* Comments List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No comments yet. Be the first!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '15px' }}>
              {comment.user_avatar ? (
                <img src={comment.user_avatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
              )}
              <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '10px', flex: 1 }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '3px' }}>{comment.user_name}</strong>
                <span style={{ fontSize: '14px' }}>{comment.comment_text}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input (Fixed at bottom) */}
      <div style={{ display: 'flex', gap: '10px', padding: '15px', backgroundColor: 'white', borderTop: '1px solid #ddd' }}>
        <input 
          type="text" 
          placeholder="Add a comment..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
        />
        <button 
          onClick={handleAddComment} 
          style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Send
        </button>
      </div>

    </div>
  );
                                                                               }
