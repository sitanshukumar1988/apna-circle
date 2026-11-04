'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Post() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handlePost = async (e) => {
    e.preventDefault();
    if (!image) return alert('Pehle photo select karo!');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('upload_preset', 'apna-circle');

      const res = await fetch(`https://api.cloudinary.com/v1_1/pbpkiacn/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.secure_url) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();

        await supabase.from('posts').insert({
          user_email: user.email,
          user_id: user.id,
          image_url: data.secure_url,
          caption: caption,
          user_name: profile?.name || user.email.split('@')[0],
          user_avatar: profile?.avatar_url
        });

        alert('Post uploaded!');
        router.push('/');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Create Post</h1>
      <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
        <textarea placeholder="Caption..." value={caption} onChange={(e) => setCaption(e.target.value)} rows="3" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
        <button type="submit" disabled={uploading} style={{ padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
          {uploading ? 'Uploading...' : 'Post'}
        </button>
      </form>
      <button onClick={() => router.push('/')} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: 'transparent', border: 'none', color: '#666' }}>Back to Home</button>
    </div>
  );
    }
