'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Post() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(''); // 👈 Naya state
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
        if (!user) {
          alert('Aap logged in nahi hain!');
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();

        // 👈 Yahan Error Check lagaya hai
        const { error } = await supabase.from('posts').insert({
          user_email: user.email,
          user_id: user.id,
          image_url: data.secure_url,
          caption: caption,
          user_name: profile?.name || user.email.split('@')[0],
          user_avatar: profile?.avatar_url
        });

        if (error) {
          alert('Post upload failed: ' + error.message);
        } else {
          // 👈 Popup ki jagah Success Message dikhaya
          setSuccessMsg('Post uploaded successfully! Redirecting...');
          setTimeout(() => {
            router.push('/');
            router.refresh(); // Home page ko refresh karne ke liye
          }, 1500);
        }
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Create New Post</h1>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ border: '2px dashed #0070f3', borderRadius: '10px', padding: '30px', textAlign: 'center', backgroundColor: '#f9f9f9', cursor: 'pointer' }}>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} style={{ display: 'none' }} id="post-image" />
            <label htmlFor="post-image" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '40px' }}>📸</span>
              <span style={{ color: '#0070f3', fontWeight: 'bold' }}>
                {image ? image.name : 'Select a Photo to Upload'}
              </span>
            </label>
          </div>

          <textarea placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} rows="4" style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '8px', outline: 'none', resize: 'none', fontSize: '15px' }} />
          
          <button type="submit" disabled={uploading} style={{ padding: '12px', backgroundColor: uploading ? '#ccc' : '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading Post...' : 'Share Post'}
          </button>
        </form>

        {/* 👈 Success Message dikhane ke liye */}
        {successMsg && (
          <p style={{ color: 'green', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>
            {successMsg}
          </p>
        )}
      </div>

    </div>
  );
  }
