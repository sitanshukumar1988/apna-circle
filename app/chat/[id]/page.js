'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Loader from '../../components/Loader'; 
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function Chat({ params }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canChat, setCanChat] = useState(false); 
  const [fullImage, setFullImage] = useState(null); 
  
  const [deleteModalMsg, setDeleteModalMsg] = useState(null); // 👈 Delete popup ke liye state

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

      // Messages fetch karo (Delete for me wale messages filter out ho jayenge)
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId},deleted_for_sender.eq.false),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id},deleted_for_receiver.eq.false)`)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);
      setLoading(false);
    };
    initChat();
  }, [otherUserId, router]);

  // Real-time listener
  useEffect(() => {
    if (!currentUser || !canChat) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUser.id)
          ) {
            setMessages((prev) => {
              if (!prev.find(m => m.id === newMsg.id)) return [...prev, newMsg];
              return prev;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' }, 
        (payload) => {
          setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, otherUserId, canChat]);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'apna-circle');

      const res = await fetch(`https://api.cloudinary.com/v1_1/pbpkiacn/image/upload`, {
        method: 'POST',
        body: formData,
      });
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
        }
      }
    } catch (error) {
      alert('Photo upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 👈 Delete Functionality
  const handleDeleteForEveryone = async (msgId) => {
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (!error) {
      setMessages((prev) => prev.filter(msg => msg.id !== msgId));
    }
    setDeleteModalMsg(null);
  };

  const handleDeleteForMe = async (msg) => {
    const isSender = msg.sender_id === currentUser.id;
    const updateField = isSender ? { deleted_for_sender: true } : { deleted_for_receiver: true };

    const { error } = await supabase.from('messages').update(updateField).eq('id', msg.id);
    if (!error) {
      setMessages((prev) => prev.filter(m => m.id !== msg.id));
    }
    setDeleteModalMsg(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 15px', backgroundColor: 'white', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
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

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div 
                // 👈 Message par click karne se Delete Popup khulega (sirf apne message par)
                onClick={() => isMine && setDeleteModalMsg(msg)}
                style={{
                  backgroundColor: isMine ? '#0070f3' : 'white',
                  color: isMine ? 'white' : '#333',
                  padding: '8px 12px',
                  borderRadius: isMine ? '15px 15px 0 15px' : '15px 15px 15px 0',
                  maxWidth: '75%',
                  fontSize: '15px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  cursor: isMine ? 'pointer' : 'default' 
                }}
              >
                {msg.image_url && (
                  <img 
                    src={msg.image_url} 
                    alt="Chat" 
                    onClick={(e) => { e.stopPropagation(); setFullImage(msg.image_url); }} // Image click par full screen
                    style={{ width: '100%', borderRadius: '8px', maxHeight: '250px', objectFit: 'cover', cursor: 'pointer' }} 
                  />
                )}
                {msg.content && <span>{msg.content}</span>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '8px', padding: '10px 15px', backgroundColor: 'white', borderTop: '1px solid #ddd', alignItems: 'center', flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
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
          style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', minWidth: '0' }}
        />
        
        <button 
          onClick={handleSendMessage} 
          style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}
        >
          Send
        </button>
      </div>

      {/* 👈 WHATSAPP STYLE DELETE MODAL */}
      {deleteModalMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '15px', width: '80%', maxWidth: '320px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', textAlign: 'center', color: '#333', fontWeight: 'bold', fontSize: '16px' }}>
              Delete message?
            </div>
            
            <button 
              onClick={() => handleDeleteForEveryone(deleteModalMsg.id)}
              style={{ width: '100%', padding: '16px', background: 'none', border: 'none', borderBottom: '1px solid #eee', color: '#0070f3', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              Delete for everyone
            </button>
            
            <button 
              onClick={() => handleDeleteForMe(deleteModalMsg)}
              style={{ width: '100%', padding: '16px', background: 'none', border: 'none', borderBottom: '1px solid #eee', color: '#0070f3', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              Delete for me
            </button>
            
            <button 
              onClick={() => setDeleteModalMsg(null)}
              style={{ width: '100%', padding: '16px', background: 'none', border: 'none', color: '#0070f3', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE MODAL */}
      {fullImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
          <button onClick={() => setFullImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 2001 }}>✕</button>
          <TransformWrapper>
            <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }} contentStyle={{ width: "100%", height: "100%" }}>
              <img src={fullImage} alt="Full Chat" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </TransformWrapper>
          </TransformWrapper>
        </div>
      )}

    </div>
  );
        }
