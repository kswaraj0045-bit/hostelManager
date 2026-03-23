import WeeklyDigest from '../ai/WeeklyDigest.jsx';

export default function DigestCard({ digest }) {
  return (
    <div>
      <WeeklyDigest digest={digest} />
    </div>
  );
}
