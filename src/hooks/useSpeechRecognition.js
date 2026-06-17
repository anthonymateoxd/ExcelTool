import { useCallback, useEffect, useRef, useState } from 'react';

const SPEECH_ERROR_MESSAGES = {
  'no-speech': 'No se detectó voz. Intenta hablar más cerca del micrófono.',
  aborted: 'El reconocimiento de voz fue detenido.',
  audio_capture: 'No se detectó ningún micrófono disponible.',
  network:
    'Error de red del reconocimiento de voz. Prueba en Google Chrome o Microsoft Edge, usando localhost y con internet activo.',
  'not-allowed':
    'El navegador bloqueó el permiso del micrófono. Debes permitir el acceso al micrófono.',
  'service-not-allowed':
    'El navegador no permite usar el servicio de reconocimiento de voz.',
  'bad-grammar': 'Error interno de gramática del reconocimiento de voz.',
  'language-not-supported':
    'El idioma seleccionado no es compatible con el reconocimiento de voz.',
};

export function useSpeechRecognition({ onResult, language = 'es-MX' } = {}) {
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError(
        'Este navegador no soporta reconocimiento de voz. Usa Google Chrome o Microsoft Edge.',
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      setTranscript('');
    };

    recognition.onresult = event => {
      const result = event.results?.[0]?.[0];
      const text = result?.transcript || '';

      if (!text.trim()) {
        setError('No se recibió texto del micrófono.');
        return;
      }

      setTranscript(text.trim());
      onResultRef.current?.(text.trim());
    };

    recognition.onerror = event => {
      const message =
        SPEECH_ERROR_MESSAGES[event.error] ||
        `Error del reconocimiento de voz: ${event.error}`;

      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // Evita error si el reconocimiento ya estaba detenido.
      }

      recognitionRef.current = null;
    };
  }, [language]);

  const requestMicrophonePermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('El navegador no permite solicitar acceso al micrófono.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    stream.getTracks().forEach(track => track.stop());
  };

  const startListening = useCallback(async () => {
    setError('');

    if (!recognitionRef.current) {
      setError(
        'El navegador no soporta reconocimiento de voz. Usa Google Chrome o Microsoft Edge.',
      );
      return;
    }

    if (isListening) {
      return;
    }

    try {
      await requestMicrophonePermission();
      recognitionRef.current.start();
    } catch (error) {
      setError(
        error.message ||
          'No se pudo iniciar el micrófono. Revisa los permisos del navegador.',
      );
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      setIsListening(false);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
}
