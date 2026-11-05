'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function Chat({ params }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const bottomRef = useRef(null);
  
  const otherUserId = params.id;

  useEffect(() => {
    const initChat = async () => {
      // Current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      // Doosre user ki profile
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', otherUserId).single();
      if (profile) setOtherUser(profile);

      // Purane messages fetch karo
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

  // Auto-scroll niche
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text Message Bhejna
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
    }
  };

  // Photo Bhejna (Cloudinary)
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
        // Photo ka URL chat me save karo
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Chat...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Chat Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: 'white', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
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
                padding: '8px',
                borderRadius: isMine ? '15px 15px 0 15px' : '15px 15px 15px 0',
                maxWidth: '75%',
                fontSize: '15px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                {/* Image (Agar hai) */}
                {msg.image_url && (
                  <img src={msg.image_url} alt="Chat" style={{ width: '100%', borderRadius: '8px', maxHeight: '250px', objectFit: 'cover' }} />
                )}
                {/* Text (Agar hai) */}
                {msg.content && <span style={{ padding: '2px 5px' }}>{msg.content}</span>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '10px', padding: '15px', backgroundColor: 'white', borderTop: '1px solid #ddd', alignItems: 'center' }}>
        
        {/* Photo Upload Button */}
        <div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            style={{ display: 'none' }} 
            id="chat-image-upload" 
          />
          <label htmlFor="chat-image-upload" style={{ cursor: 'pointer', fontSize: '24px', color: '#0070f3', display: 'flex', alignItems: 'center' }}>
            {uploading ? '⏳' : '📷'}
          </label>
        </div>

        {/* Text Input */}
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
        />
        
        <button 
          onClick={handleSendMessage} 
          style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Send
        </button>
      </div>

    </div>
  );
}
