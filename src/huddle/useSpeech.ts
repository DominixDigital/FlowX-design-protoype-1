import { useCallback, useEffect, useRef, useState } from 'react';

// Real browser speech recognition where available (Chromium, Safari).
// Elsewhere the UI says so and offers typing instead — voice is never the only path.

export type SpeechState = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

/* eslint-disable @typescript-eslint/no-explicit-any */
const Recognition: any =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition : undefined;

export function useSpeech(onFinal: (text: string) => void) {
  const [state, setState] = useState<SpeechState>(Recognition ? 'idle' : 'unsupported');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const rec = useRef<any>(null);
  const finalText = useRef('');
  const cb = useRef(onFinal);
  cb.current = onFinal;

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!Recognition) {
      setState('unsupported');
      return;
    }
    finalText.current = '';
    setTranscript('');
    setError('');
    const r = new Recognition();
    r.lang = 'en-GB';
    r.interimResults = true;
    r.continuous = true;
    r.onstart = () => setState('listening');
    r.onresult = (e: any) => {
      const text = Array.from(e.results as ArrayLike<any>).map((x: any) => x[0].transcript).join(' ');
      finalText.current = text;
      setTranscript(text);
    };
    r.onerror = (e: any) => {
      setError(
        e.error === 'not-allowed'
          ? 'Microphone access is blocked. Allow it in the browser, or type the note instead.'
          : e.error === 'no-speech'
            ? 'Nothing was heard. Try again closer to the mic, or type the note.'
            : 'Voice input stopped unexpectedly. Your note so far is kept — type to finish it.',
      );
      setState('error');
    };
    r.onend = () => {
      setState((s) => {
        if (s === 'error') return s;
        if (finalText.current.trim()) {
          cb.current(finalText.current.trim());
          return 'processing';
        }
        return 'idle';
      });
    };
    rec.current = r;
    try {
      r.start();
    } catch {
      setState('error');
      setError('Voice input could not start. Type the note instead.');
    }
  }, []);

  useEffect(() => () => rec.current?.abort?.(), []);

  return { state, setState, transcript, setTranscript, error, start, stop, supported: !!Recognition };
}
