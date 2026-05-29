import { useCallback, useRef } from 'react';

export function useSound(muted) {
  const audioContext = useRef(null);

  const getContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return null;
    }

    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    return audioContext.current;
  }, []);

  const playTone = useCallback(
    (notes, duration = 0.18) => {
      if (muted) {
        return;
      }

      const context = getContext();
      if (!context) {
        return;
      }

      if (context.state === 'suspended') {
        context.resume();
      }

      const start = context.currentTime;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const noteStart = start + index * 0.045;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.08, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + duration + 0.03);
      });
    },
    [getContext, muted],
  );

  return {
    click: () => playTone([520], 0.08),
    page: () => playTone([360, 430], 0.12),
    success: () => playTone([392, 523, 659], 0.22),
  };
}
