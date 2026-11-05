'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Loader from '../../components/Loader'; 

export default function Chat({ params }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canChat, setCanChat] = useState(false); 
  const router = useRouter();
  const bottomRef = useRef(null);
  
  const otherUserId = params.id;

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      // Apni profile fetch karo
      const { data: myProfile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();
      if (myProfile) setCurrentUserProfile(myProfile);

      // Mutual follow check
      const { data: iFollow } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', otherUserId).maybeSingle();
      const { data: theyFollow } = await supabase.from('follows').select('*').eq('follower_id', otherUserId).eq('following_id', user.id).maybeSingle();

      if (!iFollow || !theyFollow) {
        setCanChat(false);
        setLoading(false);
        return; 
      }
      
      setCanChat(true);

      // Doosre user ki profile fetch karo
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', otherUserId).single();
      if (profile) setOtherUser(profile);

      // Messages fetch karo
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);
      setLoading(false);
    };
    initChat();
  }, [otherUserId, router]);

  // Real-time listener (Bina refresh kiye message aayega)
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

      // Notification insert logic
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

          // Notification insert logic
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
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '15px' }}>Aap dono tab tak chat nahi kar sakte jab tak dono ek dusre ko follow nahi karte.</p>
        <button onClick={() => router.back()} style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          Go Back
        </button>
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
              <div style={{
                backgroundColor: isMine ? '#0070f3' : 'white',
                color: isMine ? 'white' : '#333',
                padding: '8px 12px',
                borderRadius: isMine ? '15px 15px 0 15px' : '15px 15px 15px 0',
                maxWidth: '75%',
                fontSize: '15px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                {msg.image_url && (
                  <img src={msg.image_url} alt="Chat" style={{ width: '100%', borderRadius: '8px', maxHeight: '250px', objectFit: 'cover' }} />
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

    </div>
  );
            }
