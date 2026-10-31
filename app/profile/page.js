'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', bio: '', city: '', avatar_url: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [router]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, ...profile, updated_at: new Date()
    });
    if (error) alert(error.message);
    else alert('Profile Saved!');
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>My Profile</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="DP" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0070f3' }} />
        ) : (
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#ddd', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>👤</div>
        )}
        <br /><br />
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="dp-upload" />
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

      {/* Logout Button */}
      <button onClick={handleLogout} style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
        Logout
      </button>

      <button onClick={() => router.push('/')} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Back to Home
      </button>
    </div>
  );
            }
