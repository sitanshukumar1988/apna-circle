'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Loader from '../../components/Loader';

export default function LikesPage({ params }) {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  
  const postId = params.id;

  useEffect(() => {
    const fetchLikes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      // Database se likes fetch kar rahe hain
      const { data: likesData, error } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId);
      
      if (error) {
        console.error("Error fetching likes:", error);
        setErrorMsg("Error: " + error.message);
      }

      if (likesData) {
        setLikes(likesData);
      }
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

  if (loading) return <Loader />;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Reactions ({likes.length})</h1>
      </div>

      {/* Error Message (Agar koi database error ho) */}
      {errorMsg && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '13px' }}>
          {errorMsg}
        </div>
      )}

      {/* Reactions List */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {likes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px', fontSize: '15px' }}>Abhi tak kisi ne react nahi kiya.</p>
        ) : (
          likes.map((like, index) => (
            <div 
              key={index} 
              onClick={() => router.push(`/user/${like.user_id}`)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                marginBottom: '15px', 
                borderBottom: index !== likes.length - 1 ? '1px solid #eee' : 'none', 
                paddingBottom: index !== likes.length - 1 ? '15px' : '0',
                cursor: 'pointer',
                userSelect: 'none', // Text select hone se rokega
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
            >
              {/* Profile Picture */}
              {like.user_avatar ? (
                <img src={like.user_avatar} alt="DP" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', pointerEvents: 'none' }} />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', pointerEvents: 'none' }}>👤</div>
              )}
              
              {/* User Name */}
              <div style={{ flex: 1, pointerEvents: 'none' }}>
                <span style={{ fontWeight: 'bold', fontSize: '17px', display: 'block', color: '#333' }}>{like.user_name || 'User'}</span>
              </div>

              {/* Reaction Emoji */}
              <span style={{ fontSize: '26px', pointerEvents: 'none' }}>
                {getReactionEmoji(like.reaction_type)}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
        }
