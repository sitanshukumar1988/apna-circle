'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Apna Circle Feed</h1>
      
      {posts.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Koi post nahi hai.</p>
      ) : (
        posts.map(post => (
          <div key={post.id} style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
              {post.user_name || post.user_email}
            </div>
            <img src={post.image_url} alt="Post" style={{ width: '100%', display: 'block' }} />
            {post.caption && <div style={{ padding: '10px 15px' }}>{post.caption}</div>}
          </div>
        ))
      )}
          )}  // <-- Ye line 37-38 ke aas-paas hai

<button onClick={() => router.push('/post')} style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
  Create New Post
</button>

<button onClick={() => router.push('/profile')} style={{ padding: '10px', width: '100%', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
  Go to Profile
</button>
    </div>
  );
    }
