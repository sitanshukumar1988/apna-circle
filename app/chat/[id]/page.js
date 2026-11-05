'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Loader from '../../components/Loader'; 
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const EMOJIS = ['❤️', '😂', '😮', '😢', '👍'];

export default function Chat({ params }) {
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState({}); 
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canChat, setCanChat] = useState(false); 
  const [fullImage, setFullImage] = useState(null); 
  const [selectedMsg, setSelectedMsg] = useState(null); 

  const router = useRouter();
  const bottomRef = useRef(null);
  
  const otherUserId = params.id;

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      const { data: myProfile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();
      if (myProfile) setCurrentUserProfile(myProfile);

      const { data: iFollow } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', otherUserId).maybeSingle();
      const { data: theyFollow } = await supabase.from('follows').select('*').eq('follower_id', otherUserId).eq('following_id', user.id).maybeSingle();

      if (!iFollow || !theyFollow) {
        setCanChat(false);
        setLoading(false);
        return; 
      }
      
      setCanChat(true);

      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', otherUserId).single();
      if (profile) setOtherUser(profile);

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId},deleted_for_sender.eq.false),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id},deleted_for_receiver.eq.false)`)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);

      const msgIds = msgs?.map(m => m.id) || [];
      if (msgIds.length > 0) {
        const { data: rxns } = await supabase.from('message_reactions').select('*').in('message_id', msgIds);
        if (rxns) {
          const rxnMap = {};
          rxns.forEach(r => {
            if (!rxnMap[r.message_id]) rxnMap[r.message_id] = [];
            rxnMap[r.message_id].push(r);
          });
          setReactions(rxnMap);
        }
      }

      setLoading(false);
    };
    initChat();
  }, [otherUserId, router]);

  useEffect(() => {
    if (!currentUser || !canChat) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        if ((newMsg.sender_id === currentUser.id && newMsg.receiver_id === otherUserId) || (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUser.id)) {
          setMessages((prev) => !prev.find(m => m.id === newMsg.id) ? [...prev, newMsg] : prev);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, async () => {
        const msgIds = messages.map(m => m.id);
        if (msgIds.length > 0) {
          const { data: rxns } = await supabase.from('message_reactions').select('*').in('message_id', msgIds);
          if (rxns) {
            const rxnMap = {};
            rxns.forEach(r => {
              if (!rxnMap[r.message_id]) rxnMap[r.message_id] = [];
              rxnMap[r.message_id].push(r);
            });
            setReactions(rxnMap);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, otherUserId, canChat, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    const msgText = newMessage;
    setNewMessage('');

    const { data: savedMsg, error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: otherUserId,
      content: msgText
    }).select().single();

    if (!error && savedMsg) {
      setMessages((prev) => [...prev, savedMsg]);
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        sender_id: currentUser.id,
        sender_name: currentUserProfile?.name || currentUser.email.split('@')[0],
        sender_avatar: currentUserProfile?.avatar_url || null,
        type: 'message'
      });
    }
  };

  const handleReact = async (msgId, emoji) => {
    if (!currentUser) return;
    const existingRxn = reactions[msgId]?.find(r => r.user_id === currentUser.id);

    if (existingRxn) {
      if (existingRxn.reaction === emoji) {
        await supabase.from('message_reactions').delete().eq('id', existingRxn.id);
      } else {
        await supabase.from('message_reactions').update({ reaction: emoji }).eq('id', existingRxn.id);
      }
    } else {
      await supabase.from('message_reactions').insert({ message_id: msgId, user_id: currentUser.id, reaction: emoji });
    }
    setSelectedMsg(null); 
  };

  const handleDeleteForEveryone = async (msgId) => {
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (!error) setMessages((prev) => prev.filter(msg => msg.id !== msgId));
    setSelectedMsg(null);
  };

  const handleDeleteForMe = async (msg) => {
    const isSender = msg.sender_id === currentUser.id;
    const updateField = isSender ? { deleted_for_sender: true } : { deleted_for_receiver: true };
    await supabase.from('messages').update(updateField).eq('id', msg.id);
    setMessages((prev) => prev.filter(m => m.id !== msg.id));
    setSelectedMsg(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'apna-circle');

      const res = await fetch(`https://api.cloudinary.com/v1_1/pbpkiacn/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.secure_url) {
        const { data: savedMsg, error } = await supabase.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: otherUserId,
          content: '', 
          image_url: data.secure_url
        }).select().single();

        if (!error && savedMsg) {
          setMessages((prev) => [...prev, savedMsg]);
          await supabase.from('notifications').insert({
            user_id: otherUserId,
            sender_id: currentUser.id,
            sender_name: currentUserProfile?.name || currentUser.email.split('@')[0],
            sender_avatar: currentUserProfile?.avatar_url || null,
            type: 'message'
          });
        }
      }
    } catch (error) {
      alert('Photo upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader />;

  if (!canChat) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f0f2f5', textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Chat Not Allowed 🚫</h2>
        <button onClick={() => router.back()} style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#e5ddd5' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 15px', backgroundColor: 'white', borderBottom: '1px solid #ddd', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '10px' }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
          )}
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{otherUser?.name || 'User'}</h2>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id;
          const msgReactions = reactions[msg.id] || [];

          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', position: 'relative', marginBottom: msgReactions.length > 0 ? '15px' : '0' }}>
              
              <div 
                onClick={() => setSelectedMsg(msg)}
                onContextMenu={(e) => e.preventDefault()} 
                style={{
                  backgroundColor: isMine ? '#dcf8c6' : 'white',
                  padding: '6px 8px 6px 10px',
                  borderRadius: '8px',
                  maxWidth: '75%',
                  fontSize: '15px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  position: 'relative',
                  userSelect: 'none', 
                  WebkitUserSelect: 'none', 
                  WebkitTouchCallout: 'none', 
                }}
              >
                {msg.image_url && (
                  <div style={{ pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); setFullImage(msg.image_url); }}>
                    <img 
                      src={msg.image_url} 
                      alt="Chat" 
                      style={{ width: '100%', borderRadius: '6px', maxHeight: '250px', objectFit: 'cover', cursor: 'pointer', pointerEvents: 'none' }} 
                    />
                  </div>
                )}

                {msg.content && (
                  <span style={{ color: '#000', pointerEvents: 'none' }}>
                    {msg.content}
                  </span>
                )}
                
                <span style={{ fontSize: '10px', color: '#999', alignSelf: 'flex-end', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px', pointerEvents: 'none' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMine && <span style={{ color: '#34B7F1', fontSize: '12px' }}>✓✓</span>}
                </span>
              </div>

              {msgReactions.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-12px', 
                  right: isMine ? '10px' : 'auto', 
                  left: isMine ? 'auto' : '10px',
                  backgroundColor: 'white', 
                  borderRadius: '15px', 
                  padding: '2px 6px', 
                  fontSize: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  display: 'flex',
                  gap: '2px',
                  border: '1px solid #eee',
                  zIndex: 2
                }}>
                  {msgReactions.map((r, i) => <span key={i}>{r.reaction}</span>)}
                </div>
              )}

            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '10px 15px', backgroundColor: 'white', alignItems: 'center', flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
        <div>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="chat-image-upload" />
          <label htmlFor="chat-image-upload" style={{ cursor: 'pointer', fontSize: '24px', color: '#0070f3', display: 'flex', alignItems: 'center' }}>
            {uploading ? '⏳' : '📷'}
          </label>
        </div>

        <input 
          type="text" 
          placeholder="Type a message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          style={{ flex: 1, padding: '12px 15px', borderRadius: '25px', border: '1px solid #ccc', outline: 'none', minWidth: '0', fontSize: '15px' }}
        />
        
        <button 
          onClick={handleSendMessage} 
          style={{ padding: '12px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}
        >
          Send
        </button>
      </div>

      {selectedMsg && (
        <div onClick={() => setSelectedMsg(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', width: '85%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px', borderBottom: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
              {EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleReact(selectedMsg.id, emoji)}
                  style={{ background: 'none', border: 'none', fontSize: '26px', cursor: 'pointer' }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div style={{ padding: '10px 0' }}>
              {selectedMsg.sender_id === currentUser.id ? (
                <>
                  <button onClick={() => handleDeleteForEveryone(selectedMsg.id)} style={{ width: '100%', padding: '15px', background: 'none', border: 'none', textAlign: 'left', fontSize: '16px', color: '#333', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                    🗑️ Delete for everyone
                  </button>
                  <button onClick={() => handleDeleteForMe(selectedMsg)} style={{ width: '100%', padding: '15px', background: 'none', border: 'none', textAlign: 'left', fontSize: '16px', color: '#333', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                    🗑️ Delete for me
                  </button>
                </>
              ) : (
                <button onClick={() => handleDeleteForMe(selectedMsg)} style={{ width: '100%', padding: '15px', background: 'none', border: 'none', textAlign: 'left', fontSize: '16px', color: '#333', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                  🗑️ Delete for me
                </button>
              )}
              <button onClick={() => setSelectedMsg(null)} style={{ width: '100%', padding: '15px', background: 'none', border: 'none', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#0070f3', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {fullImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
          <button onClick={() => setFullImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 2001 }}>✕</button>
          <TransformWrapper>
            <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }} contentStyle={{ width: "100%", height: "100%" }}>
              <img src={fullImage} alt="Full Chat" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </TransformComponent> {/* 👈 Yahan fix kar diya hai */}
          </TransformWrapper>
        </div>
      )}

    </div>
  );
        }
