'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Apna Circle Live!</h1>
      <button onClick={() => router.push('/login')} style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white' }}>
        Go to Login
      </button>
    </div>
  );
  }
