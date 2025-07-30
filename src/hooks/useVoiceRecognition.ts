import { useState, useRef, useCallback } from 'react';
import { ConversationState } from '@/types';

interface UseVoiceRecognitionProps {
  onTranscriptComplete: (transcript: string) => void;
  onStateChange: (state: ConversationState) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition({ onTranscriptComplete, onStateChange, onError }: UseVoiceRecognitionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const initializeRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        
        setCurrentTranscript(transcript);
        
        if (isFinal && transcript.trim()) {
          onStateChange('processing');
          onTranscriptComplete(transcript.trim());
          setCurrentTranscript('');
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          stopRecording();
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Proporcionar mensajes de error más específicos
        let errorMessage = 'Error en el reconocimiento de voz';
        switch (event.error) {
          case 'network':
            errorMessage = 'Error de conexión. Verifica tu conexión a internet y vuelve a intentar.';
            break;
          case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados. Permite el acceso al micrófono.';
            break;
          case 'no-speech':
            errorMessage = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
            break;
          case 'audio-capture':
            errorMessage = 'Error al capturar audio. Verifica que el micrófono esté funcionando.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Servicio de reconocimiento no disponible. Intenta más tarde.';
            break;
          default:
            errorMessage = `Error de reconocimiento: ${event.error}`;
        }
        
        // Notificar el error al componente padre
         onStateChange('idle');
         stopRecording();
         
         // Notificar el error si hay callback
         if (onError) {
           onError(errorMessage);
         }
      };

      setIsSupported(true);
    } else {
      console.warn('Speech recognition not supported in this browser');
      setIsSupported(false);
    }
  }, [isRecording, onTranscriptComplete]);

  const setupAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      if (!isSupported) {
        initializeRecognition();
        if (!isSupported) {
          const errorMsg = 'Reconocimiento de voz no soportado en este navegador';
          if (onError) onError(errorMsg);
          return;
        }
      }

      const audioSetup = await setupAudioAnalysis();
      if (!audioSetup) {
        const errorMsg = 'Error al acceder al micrófono. Verifica los permisos.';
        if (onError) onError(errorMsg);
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsRecording(true);
      setCurrentTranscript('');
      onStateChange('listening');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al iniciar grabación';
      if (onError) onError(errorMsg);
      onStateChange('idle');
    }
  }, [isSupported, initializeRecognition, setupAudioAnalysis, onStateChange, onError]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsRecording(false);
    setAudioLevel(0);
    // Solo cambiar a processing si hay contenido que procesar
    // Si no hay contenido, volver a idle
    if (currentTranscript.trim()) {
      onStateChange('processing');
    } else {
      onStateChange('idle');
    }
  }, [onStateChange, currentTranscript]);

  const cleanup = useCallback(() => {
    stopRecording();
    if (recognitionRef.current) {
      recognitionRef.current = null;
    }
  }, [stopRecording]);

  return {
    isRecording,
    currentTranscript,
    audioLevel,
    isSupported,
    startRecording,
    stopRecording,
    cleanup,
    initializeRecognition
  };
}