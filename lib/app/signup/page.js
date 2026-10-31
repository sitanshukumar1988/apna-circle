'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Signup successful! Please check your email or login.');
      router.push('/login');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Apna Circle Signup</h2>
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} 
        />
        <button 
          type="submit" 
          style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
        >
          Sign Up
        </button>
      </form>
      {message && <p style={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <a href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>Login here</a>
      </p>
    </div>
  );
}
