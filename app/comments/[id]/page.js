'use client';
import { useRouter } from 'next/navigation';

export default function CommentsPage() {
  const router = useRouter();
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Comments</h1>
      <p>Yahan comments dikhenge.</p>
      <button onClick={() => router.back()} style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', borderRadius: '5px', marginTop: '20px' }}>
        Go Back
      </button>
    </div>
  );
                                                   }
