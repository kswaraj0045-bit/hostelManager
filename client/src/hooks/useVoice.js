import { useState, useCallback } from 'react';

export const useVoice = (onResult) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onResult?.('Speech recognition not supported');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult?.(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      onResult?.('');
    };

    recognition.start();
  }, [onResult]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
};
