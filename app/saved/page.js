'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Loader from '../components/Loader';

export default function SavedPosts() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // 1. Saved posts ki IDs nikaalo
      const { data: savedData } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id);

      if (savedData && savedData.length > 0) {
        const postIds = savedData.map(s => s.post_id);

        // 2. Un IDs wali posts fetch karo
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (postsData) setSavedPosts(postsData);
      }
      setLoading(false);
    };
    fetchSaved();
  }, [router]);

  const handleUnsave = async (postId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
    
    if (!error) {
      setSavedPosts((prev) => prev.filter(p => p.id !== postId));
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Saved Posts 🔖</h1>
      </div>

      {savedPosts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
          <p>Aapne abhi tak koi post save nahi kiya hai.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {savedPosts.map(post => (
            <div 
              key={post.id} 
              style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                {post.user_avatar ? (
                  <img src={post.user_avatar} alt="DP" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                )}
                <span style={{ fontWeight: 'bold' }}>{post.user_name || 'User'}</span>
              </div>

              <img src={post.image_url} alt="Saved Post" style={{ width: '100%', display: 'block' }} />
              
              {post.caption && (
                <div style={{ padding: '10px 15px', fontSize: '15px' }}>{post.caption}</div>
              )}

              <div style={{ padding: '10px 15px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                <button 
                  onClick={() => handleUnsave(post.id)}
                  style={{ background: 'none', border: 'none', color: '#dc3545', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  ❌ Unsave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
      }
