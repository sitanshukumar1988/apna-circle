'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../lib/cropImage';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', bio: '', city: '', avatar_url: '', email: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const [showFullImage, setShowFullImage] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
      } else {
        setProfile(prev => ({ ...prev, email: user.email }));
      }
    };
    fetchProfile();
  }, [router]);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      setImageSrc(null); 
      uploadToCloudinary(croppedImage);
    } catch (e) {
      alert("Crop Error: " + e.message);
      console.error(e);
    }
  };

  const uploadToCloudinary = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'apna-circle');
      const res = await fetch(`https://api.cloudinary.com/v1_1/pbpkiacn/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) setProfile({ ...profile, avatar_url: data.secure_url });
    } catch (err) { alert(err.message); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    
    // 1. Profile save karo
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, 
      email: user.email, 
      name: profile.name,
      bio: profile.bio,
      city: profile.city,
      avatar_url: profile.avatar_url,
      updated_at: new Date()
    });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    // 2. Saari purani posts me nayi DP aur Naam update karo
    await supabase.from('posts')
      .update({ 
        user_avatar: profile.avatar_url, 
        user_name: profile.name 
      })
      .eq('user_email', user.email);

    alert('Profile and Posts Updated!');
    setSaving(false);
    
    // Page refresh karo taaki naya data dikhe
    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  // Crop Screen
  if (imageSrc) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#333' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 80 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '20px', background: 'white' }}>
          <button onClick={() => setImageSrc(null)} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>Cancel</button>
          <button onClick={handleCropSave} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>Crop & Save</button>
        </div>
      </div>
    );
  }

  // DP Full Image View (With Zoom)
  if (showFullImage && profile.avatar_url) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000 }}>
        <button onClick={() => setShowFullImage(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '24px', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 1001 }}>✕</button>
        <TransformWrapper>
          <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }} contentStyle={{ width: "100%", height: "100%" }}>
            <img src={profile.avatar_url} alt="Full DP" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </TransformComponent>
        </TransformWrapper>
      </div>
    );
  }

  // Main Profile Page
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>My Profile</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt="DP" 
            onClick={() => setShowFullImage(true)} 
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0070f3', cursor: 'pointer' }} 
          />
        ) : (
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#ddd', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
        )}
        <br /><br />
        <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} id="dp-upload" />
        <label htmlFor="dp-upload" style={{ padding: '8px 15px', backgroundColor: '#0070f3', color: 'white', borderRadius: '5px', cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Change DP'}
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input placeholder="Your Name" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
        <textarea placeholder="Bio (e.g. Fitness lover)" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows="3" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
        <input placeholder="City" value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
        
        <button onClick={handleSave} disabled={saving} style={{ padding: '12px', backgroundColor: saving ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <button onClick={handleLogout} style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
        Logout
      </button>

      <button onClick={() => router.push('/')} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Back to Home
      </button>
    </div>
  );
}
