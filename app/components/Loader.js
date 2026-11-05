export default function Loader() {
  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      {/* 3 Skeleton Cards */}
      {[1, 2, 3].map((item) => (
        <div key={item} style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          animation: 'pulse 1.5s infinite ease-in-out'
        }}>
          {/* Header Skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#e0e0e0' }}></div>
            <div style={{ width: '120px', height: '15px', borderRadius: '4px', backgroundColor: '#e0e0e0' }}></div>
          </div>
          {/* Image Skeleton */}
          <div style={{ width: '100%', height: '200px', borderRadius: '8px', backgroundColor: '#f0f0f0', marginBottom: '15px' }}></div>
          {/* Text Skeleton */}
          <div style={{ width: '80%', height: '15px', borderRadius: '4px', backgroundColor: '#e0e0e0', marginBottom: '8px' }}></div>
          <div style={{ width: '60%', height: '15px', borderRadius: '4px', backgroundColor: '#e0e0e0' }}></div>
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
                }
