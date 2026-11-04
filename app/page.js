'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
      <h1>Apna Circle Live!</h1>
      <p>App chal rahi hai.</p>
      <button onClick={() => router.push('/login')} style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', borderRadius: '5px', marginTop: '20px' }}>
        Go to Login
      </button>
    </div>
  );
}
