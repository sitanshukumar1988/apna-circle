'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Login successful! Redirecting...');
      router.push('/'); // Login ke baad home page par bhejega
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Apna Circle Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
          style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
        >
          Login
        </button>
      </form>
      {message && <p style={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        New user? <a href="/signup" style={{ color: 'blue', textDecoration: 'underline' }}>Sign up here</a>
      </p>
    </div>
  );
            }
