import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as groupService from '../services/groupService.js';
import { useToast } from '../hooks/useToast.js';

export default function RoomSetup() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) return;

    const join = async () => {
      setLoading(true);
      try {
        await groupService.joinGroup(code.toUpperCase());
        success('Joined group successfully');
        navigate('/groups');
      } catch (err) {
        error(err.response?.data?.message || 'Invalid or expired invite code');
        navigate('/groups');
      } finally {
        setLoading(false);
      }
    };

    join();
  }, [code, success, error, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '14px', color: '#FFFFFE' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500"></div>
          Joining group...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#A7A9BE' }}>Processing...</p>
    </div>
  );
}
