'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Post() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userProfile, setUserProfile] = useState({ name: '', avatar_url: '' }); // Profile save karne ke liye
  const router = useRouter();

  useEffect(() => {
    // Page load hote hi user ki profile fetch karo
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();
        if (data) setUserProfile(data);
      }
    };
    fetchUserProfile();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!image) {
      setErrorMsg('Pehle koi photo select karo!');
      return;
    }
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
      
      if (data.error) throw new Error(data.error.message);
      
      if (data.secure_url) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Supabase me post save karo (naam aur DP ke saath)
        const { error: dbError } = await supabase.from('posts').insert({
          user_email: user.email,
          image_url: data.secure_url,
          caption: caption,
          user_name: userProfile.name || user.email.split('@')[0], // Naam save karo
          user_avatar: userProfile.avatar_url || null // DP save karo
        });

        if (dbError) throw new Error(dbError.message);

        alert('Post uploaded successfully!');
        router.push('/');
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>Create a Post</h1>
      
      <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setImage(e.target.files[0])} 
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white' }}
        />
        
        <textarea 
          placeholder="Write a caption (optional)..." 
          value={caption} 
          onChange={(e) => setCaption(e.target.value)} 
          rows="3"
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', resize: 'none' }}
        />

        <button 
          type="submit" 
          disabled={uploading}
          style={{ padding: '12px', backgroundColor: uploading ? '#ccc' : '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
          {uploading ? 'Uploading...' : 'Post'}
        </button>
      </form>

      {errorMsg && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffe6e6', color: 'red', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }}>
          Error: {errorMsg}
        </div>
      )}

      <button onClick={() => router.push('/')} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Back to Home
      </button>
    </div>
  );
        }
