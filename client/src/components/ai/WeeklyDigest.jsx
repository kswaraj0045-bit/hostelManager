export default function WeeklyDigest({ digest }) {
  if (!digest?.content) return null;

  return (
    <div className="glass" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(255,101,132,0.08))' }}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '10px', color: '#FFFFFE' }}>
        Weekly Digest
      </h3>
      <p style={{ color: '#D4D6E4', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{digest.content}</p>
    </div>
  );
}
