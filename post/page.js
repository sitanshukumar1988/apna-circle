'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Post() {
  const router = useRouter();

  return (
    <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
      <h1>Create a Post</h1>
      <p>Yahan photo upload ka form aayega.</p>
      <button 
        onClick={() => router.push('/')} 
        style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Back to Home
      </button>
    </div>
  );
  }
