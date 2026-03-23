import { useVoice } from '../../hooks/useVoice.js';

export default function VoiceInput({ onResult }) {
  const { isListening, startListening } = useVoice(onResult);

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={isListening}
      className={`p-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
      title="Voice input"
    >
      🎤
    </button>
  );
}
