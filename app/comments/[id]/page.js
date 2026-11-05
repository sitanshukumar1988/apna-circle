'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Loader from '../../components/Loader';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

export default function CommentsPage({ params }) {
  const [comments, setComments] = useState([]);
  const [commentReactions, setCommentReactions] = useState({});
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState(null); // Reply karne ke liye state
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // Emoji picker khulne ki state

  const router = useRouter();
  const postId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();
        if (profile) setCurrentUserProfile(profile);
      }

      // 1. Comments fetch karein
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }); 

      if (commentsData) {
        setComments(commentsData);

        // 2. Un comments ke reactions fetch karein
        const commentIds = commentsData.map(c => c.id);
        if (commentIds.length > 0) {
          const { data: rxns } = await supabase
            .from('comment_reactions')
            .select('*')
            .in('comment_id', commentIds);
          
          if (rxns) {
            const rxnMap = {};
            rxns.forEach(r => {
              if (!rxnMap[r.comment_id]) rxnMap[r.comment_id] = [];
              rxnMap[r.comment_id].push(r);
            });
            setCommentReactions(rxnMap);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [postId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setPosting(true);
    const commentText = newComment;
    setNewComment(''); 

    const { data: savedComment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_name: currentUserProfile?.name || currentUser.email.split('@')[0],
        user_avatar: currentUserProfile?.avatar_url,
        text: commentText,
        parent_id: replyingTo ? replyingTo.id : null // 👈 Reply logic
      })
      .select()
      .single();

    if (!error && savedComment) {
      setComments([...comments, savedComment]);
      setReplyingTo(null); // Reply state clear karein
    } else {
      alert("Error: " + error?.message);
    }
    setPosting(false);
  };

  // 👈 Comment par Reaction dene ka function
  const handleCommentReaction = async (commentId, emoji) => {
    if (!currentUser) return;
    
    const existingRxn = commentReactions[commentId]?.find(r => r.user_id === currentUser.id);

    if (existingRxn) {
      if (existingRxn.reaction_type === emoji) {
        // Agar same emoji par click kiya toh hata do
        await supabase.from('comment_reactions').delete().eq('id', existingRxn.id);
      } else {
        // Naya emoji select kiya toh update kar do
        await supabase.from('comment_reactions').update({ reaction_type: emoji }).eq('id', existingRxn.id);
      }
    } else {
      // Pehli baar react kar raha hai toh insert karo
      await supabase.from('comment_reactions').insert({
        comment_id: commentId,
        user_id: currentUser.id,
        user_name: currentUserProfile?.name || currentUser.email.split('@')[0],
        user_avatar: currentUserProfile?.avatar_url,
        reaction_type: emoji
      });
    }
    setShowEmojiPicker(null);
    
    // Refresh reactions for UI
    const { data: rxns } = await supabase.from('comment_reactions').select('*').eq('comment_id', commentId);
    setCommentReactions(prev => ({ ...prev, [commentId]: rxns || [] }));
  };

  // Comments ko Root aur Replies me divide karna
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  if (loading) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Comments ({comments.length})</h1>
      </div>

      {/* Comments List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {rootComments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>Koi comment nahi hai. Pehla comment aap karein!</p>
        ) : (
          rootComments.map((comment) => {
            const commentRxns = commentReactions[comment.id] || [];
            // Group reactions (e.g., { '❤️': 2, '👍': 1 })
            const groupedRxns = commentRxns.reduce((acc, curr) => {
              acc[curr.reaction_type] = (acc[curr.reaction_type] || 0) + 1;
              return acc;
            }, {});
            
            const replies = getReplies(comment.id);

            return (
              <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Main Comment */}
                <div style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '12px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div onClick={() => router.push(`/user/${comment.user_id}`)} style={{ cursor: 'pointer' }}>
                    {comment.user_avatar ? (
                      <img src={comment.user_avatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ backgroundColor: '#f0f2f5', padding: '8px 12px', borderRadius: '15px', display: 'inline-block' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', color: '#333' }}>{comment.user_name}</span>
                      <span style={{ fontSize: '14px', color: '#444' }}>{comment.text}</span>
                    </div>

                    {/* Action Buttons (React, Reply, Time) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '5px 0 0 5px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                      <span onClick={() => setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id)} style={{ cursor: 'pointer' }}>React</span>
                      <span onClick={() => setReplyingTo(comment)} style={{ cursor: 'pointer' }}>Reply</span>
                      <span style={{ color: '#999', fontWeight: 'normal' }}>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Display Grouped Reactions */}
                    {Object.keys(groupedRxns).length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        {Object.entries(groupedRxns).map(([emoji, count]) => (
                          <span key={emoji} style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '2px 6px', fontSize: '12px' }}>
                            {emoji} {count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Emoji Picker for Comment */}
                    {showEmojiPicker === comment.id && (
                      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '5px 10px', display: 'inline-flex', gap: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', marginTop: '5px' }}>
                        {EMOJIS.map(emoji => (
                          <span key={emoji} onClick={() => handleCommentReaction(comment.id, emoji)} style={{ fontSize: '20px', cursor: 'pointer' }}>{emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 👈 Replies Section (Indented) */}
                {replies.length > 0 && (
                  <div style={{ marginLeft: '45px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '2px solid #ddd', paddingLeft: '10px' }}>
                    {replies.map(reply => {
                      const replyRxns = commentReactions[reply.id] || [];
                      const groupedReplyRxns = replyRxns.reduce((acc, curr) => {
                        acc[curr.reaction_type] = (acc[curr.reaction_type] || 0) + 1;
                        return acc;
                      }, {});

                      return (
                        <div key={reply.id} style={{ display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <div onClick={() => router.push(`/user/${reply.user_id}`)} style={{ cursor: 'pointer' }}>
                            {reply.user_avatar ? (
                              <img src={reply.user_avatar} alt="DP" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                            )}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ backgroundColor: '#f0f2f5', padding: '8px 12px', borderRadius: '15px', display: 'inline-block' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', color: '#333' }}>{reply.user_name}</span>
                              <span style={{ fontSize: '13px', color: '#444' }}>{reply.text}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '5px 0 0 5px', fontSize: '11px', color: '#666', fontWeight: 'bold' }}>
                              <span onClick={() => setShowEmojiPicker(showEmojiPicker === reply.id ? null : reply.id)} style={{ cursor: 'pointer' }}>React</span>
                              <span onClick={() => setReplyingTo(comment)} style={{ cursor: 'pointer' }}>Reply</span>
                              <span style={{ color: '#999', fontWeight: 'normal' }}>{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {Object.keys(groupedReplyRxns).length > 0 && (
                              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                {Object.entries(groupedReplyRxns).map(([emoji, count]) => (
                                  <span key={emoji} style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '2px 6px', fontSize: '11px' }}>
                                    {emoji} {count}
                                  </span>
                                ))}
                              </div>
                            )}

                            {showEmojiPicker === reply.id && (
                              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '5px 10px', display: 'inline-flex', gap: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', marginTop: '5px' }}>
                                {EMOJIS.map(emoji => (
                                  <span key={emoji} onClick={() => handleCommentReaction(reply.id, emoji)} style={{ fontSize: '18px', cursor: 'pointer' }}>{emoji}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: '10px 15px', backgroundColor: 'white', borderTop: '1px solid #ddd', flexShrink: 0 }}>
        
        {/* 👈 Replying To Indicator */}
        {replyingTo && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e6f2ff', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px', fontSize: '13px', color: '#0070f3' }}>
            <span>Replying to <strong>{replyingTo.user_name}</strong>...</span>
            <span onClick={() => setReplyingTo(null)} style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>✕</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {currentUserProfile?.avatar_url ? (
            <img src={currentUserProfile.avatar_url} alt="Me" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
          )}
          
          <form onSubmit={handlePostComment} style={{ display: 'flex', flex: 1, gap: '10px' }}>
            <input 
              type="text" 
              placeholder={replyingTo ? `Reply to ${replyingTo.user_name}...` : "Write a comment..."} 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', backgroundColor: '#f0f2f5' }}
            />
            <button 
              type="submit" 
              disabled={posting || !newComment.trim()}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: (posting || !newComment.trim()) ? '#ccc' : '#0070f3', 
                color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', 
                cursor: (posting || !newComment.trim()) ? 'not-allowed' : 'pointer' 
              }}
            >
              {posting ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
      }
