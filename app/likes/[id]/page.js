'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function LikesPage({ params }) {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const postId = params.id;

  useEffect(() => {
    const fetchLikes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: likesData, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId);
      
      if (likesData) setLikes(likesData);
      setLoading(false);
    };
    fetchLikes();
  }, [postId, router]);

  const getReactionEmoji = (type) => {
    switch(type) {
      case 'love': return '❤️';
      case 'haha': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      default: return '👍';
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Likes...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Reactions ({likes.length})</h1>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {likes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No likes yet.</p>
        ) : (
          likes.map((like, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', borderBottom: index !== likes.length - 1 ? '1px solid #eee' : 'none', paddingBottom: index !== likes.length - 1 ? '15px' : '0' }}>
              {like.user_avatar ? (
                <img src={like.user_avatar} alt="DP" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>
              )}
              
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 'bold', fontSize: '18px', display: 'block' }}>{like.user_name || 'User'}</span>
              </div>

              {/* Kisne kya reaction diya */}
              <span style={{ fontSize: '24px' }}>
                {getReactionEmoji(like.reaction_type)}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
    }
