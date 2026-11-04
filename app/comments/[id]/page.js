'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function CommentsPage({ params }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
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

      const { data: postData } = await supabase.from('posts').select('*').eq('id', postId).single();
      if (postData) setPost(postData);

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (commentsData) setComments(commentsData);

      const { data: reactionsData } = await supabase.from('comment_reactions').select('*');
      if (reactionsData) setReactions(reactionsData);

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
      comment_text: newComment,
      parent_id: replyTo ? replyTo : null
    }).select().single();

    if (!error && addedComment) {
      setComments([...comments, addedComment]);
      setNewComment('');
      setReplyTo(null);
    }
  };

  const handleReact = async (commentId, reactionType) => {
    const hasReacted = reactions.find(r => r.comment_id === commentId && r.user_id === user.id);
    const userName = userProfile?.name || user.email.split('@')[0];

    if (hasReacted) {
      if (hasReacted.reaction_type === reactionType) {
        await supabase.from('comment_reactions').delete().eq('id', hasReacted.id);
        setReactions(reactions.filter(r => r.id !== hasReacted.id));
      } else {
        await supabase.from('comment_reactions').update({ reaction_type: reactionType }).eq('id', hasReacted.id);
        setReactions(reactions.map(r => r.id === hasReacted.id ? { ...r, reaction_type: reactionType } : r));
      }
    } else {
      const { data: newReaction } = await supabase.from('comment_reactions').insert({
        comment_id: commentId,
        user_id: user.id,
        user_name: userName,
        reaction_type: reactionType
      }).select().single();
      if (newReaction) setReactions([...reactions, newReaction]);
    }
    setShowEmojiPicker(null);
  };

  const getReactionEmoji = (type) => {
    switch(type) {
      case 'love': return '❤️';
      case 'haha': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      default: return '👍';
    }
  };

  const getCommentReactions = (commentId) => {
    return reactions.filter(r => r.comment_id === commentId);
  };

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (commentId) => comments.filter(c => c.parent_id === commentId);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Comments</h1>
      </div>

      {post && (
        <div style={{ padding: '10px 15px', backgroundColor: '#fafafa', borderBottom: '1px solid #eee', fontSize: '14px', color: '#666' }}>
          <strong>{post.user_name}:</strong> {post.caption}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {topLevelComments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No comments yet. Be the first!</p>
        ) : (
          topLevelComments.map(comment => {
            const replies = getReplies(comment.id);
            const commentReactions = getCommentReactions(comment.id);
            const myReaction = commentReactions.find(r => r.user_id === user.id);

            return (
              <div key={comment.id} style={{ marginBottom: '20px' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div onClick={() => router.push(`/user/${comment.user_id}`)} style={{ cursor: 'pointer' }}>
                    {comment.user_avatar ? (
                      <img src={comment.user_avatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '10px' }}>
                      <strong onClick={() => router.push(`/user/${comment.user_id}`)} style={{ fontSize: '14px', display: 'block', marginBottom: '3px', cursor: 'pointer', color: '#0070f3' }}>{comment.user_name}</strong>
                      <span style={{ fontSize: '14px' }}>{comment.comment_text}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px', marginLeft: '10px', alignItems: 'center', position: 'relative' }}>
                      <button onClick={() => setReplyTo(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Reply</button>
                      
                      <button onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: myReaction ? '#dc3545' : '#666', fontWeight: 'bold' }}>
                        {myReaction ? `${getReactionEmoji(myReaction.reaction_type)} Reacted` : '🤍 React'}
                      </button>

                      {commentReactions.length > 0 && (
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '5px' }}>
                          {commentReactions.map(r => getReactionEmoji(r.reaction_type)).join(' ')}
                        </span>
                      )}

                      {showEmojiPicker === comment.id && (
                        <div style={{ position: 'absolute', bottom: '30px', left: '0', backgroundColor: 'white', borderRadius: '30px', padding: '5px 10px', display: 'flex', gap: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 10 }}>
                          <button onClick={() => handleReact(comment.id, 'like')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>👍</button>
                          <button onClick={() => handleReact(comment.id, 'love')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>❤️</button>
                          <button onClick={() => handleReact(comment.id, 'haha')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😂</button>
                          <button onClick={() => handleReact(comment.id, 'wow')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😮</button>
                          <button onClick={() => handleReact(comment.id, 'sad')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>😢</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {replies.length > 0 && (
                  <div style={{ marginLeft: '45px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {replies.map(reply => (
                      <div key={reply.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div onClick={() => router.push(`/user/${reply.user_id}`)} style={{ cursor: 'pointer' }}>
                          {reply.user_avatar ? (
                            <img src={reply.user_avatar} alt="DP" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>👤</div>
                          )}
                        </div>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '8px 10px', borderRadius: '10px', flex: 1 }}>
                          <strong style={{ fontSize: '13px', display: 'block', marginBottom: '2px' }}>{reply.user_name}</strong>
                          <span style={{ fontSize: '13px' }}>{reply.comment_text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {replyTo && (
        <div style={{ padding: '5px 15px', backgroundColor: '#e6f0ff', fontSize: '12px', color: '#0070f3', display: 'flex', justifyContent: 'space-between' }}>
          Replying to comment...
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', padding: '15px', backgroundColor: 'white', borderTop: '1px solid #ddd' }}>
        <input 
          type="text" 
          placeholder={replyTo ? "Write a reply..." : "Add a comment..."} 
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
