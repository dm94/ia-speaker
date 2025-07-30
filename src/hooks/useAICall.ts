import { useState, useRef, useCallback, useEffect } from 'react';
import RecordRTC from 'recordrtc';
import { CallState, AppConfig } from '../types/speech';
import { 
  SpeechTranscriptionService, 
  SpeechSynthesisService, 
  LMStudioService 
} from '../services/speechService';

interface UseAICallProps {
  config: AppConfig;
}

export const useAICall = ({ config }: UseAICallProps) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<RecordRTC | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Servicios
  const transcriptionService = useRef(new SpeechTranscriptionService());
  const synthesisService = useRef(new SpeechSynthesisService());
  const lmStudioService = useRef(new LMStudioService(config.lmStudioUrl, config.lmStudioModel));

  // Inicializar grabación de audio
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;
      
      // Configurar analizador de audio para detección de silencio
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Configurar RecordRTC
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000
      });
      
      recorderRef.current = recorder;
      
      return true;
    } catch (err) {
      setError('Error al acceder al micrófono: ' + (err as Error).message);
      return false;
    }
  }, []);

  // Monitorear nivel de audio y detectar silencio
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calcular nivel promedio de audio
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average);
    
    // Detectar silencio
    if (average < config.silenceThreshold) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (callState === 'listening') {
            processRecording();
          }
        }, config.silenceTimeout);
      }
    } else {
      // Cancelar timer de silencio si hay audio
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, [callState, config.silenceThreshold, config.silenceTimeout]);

  // Procesar grabación cuando se detecta silencio
  const processRecording = useCallback(async () => {
    if (!recorderRef.current || callState !== 'listening') return;
    
    setCallState('processing');
    
    try {
      // Detener grabación temporalmente
      recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current!.getBlob();
        
        try {
          // Transcribir audio
          const transcript = await transcriptionService.current.transcribeAudio(blob);
          
          if (transcript.trim()) {
            // Generar respuesta con LM Studio
            const aiResponse = await lmStudioService.current.generateResponse(transcript);
            
            if (aiResponse) {
              await synthesizeAndPlaySpeech(aiResponse);
            } else {
              setError('No se pudo generar respuesta');
              setCallState('listening');
              startNewRecording();
            }
          } else {
            // Si no hay transcripción, volver a escuchar
            setCallState('listening');
            startNewRecording();
          }
          
        } catch (err) {
          setError('Error al procesar audio: ' + (err as Error).message);
          setCallState('listening');
          startNewRecording();
        }
      });
      
    } catch (err) {
      setError('Error al procesar grabación: ' + (err as Error).message);
      setCallState('listening');
      startNewRecording();
    }
  }, [callState]);

  // Sintetizar y reproducir respuesta de voz
  const synthesizeAndPlaySpeech = useCallback(async (text: string) => {
    setCallState('speaking');
    
    try {
      // Intentar usar sesame/csm-1b primero
      try {
        const audioBuffer = await synthesisService.current.synthesizeSpeech(text);
        await synthesisService.current.playAudioBuffer(audioBuffer);
      } catch {
        // Fallback a Web Speech API
        await synthesisService.current.synthesizeSpeechFallback(text);
      }
      
      // Continuar conversación
      setCallState('listening');
      startNewRecording();
      
    } catch (err) {
      setError('Error al sintetizar voz: ' + (err as Error).message);
      setCallState('listening');
      startNewRecording();
    }
  }, []);

  // Iniciar nueva grabación después de respuesta
  const startNewRecording = useCallback(() => {
    if (recorderRef.current && mediaStreamRef.current) {
      recorderRef.current = new RecordRTC(mediaStreamRef.current, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000
      });
      
      recorderRef.current.startRecording();
      setIsRecording(true);
    }
  }, []);

  // Iniciar llamada
  const startCall = useCallback(async () => {
    setError(null);
    const audioInitialized = await initializeAudio();
    
    if (audioInitialized && recorderRef.current) {
      setCallState('calling');
      
      // Pequeña pausa antes de empezar a escuchar
      setTimeout(() => {
        setCallState('listening');
        recorderRef.current!.startRecording();
        setIsRecording(true);
        monitorAudioLevel();
      }, 1000);
    }
  }, [initializeAudio, monitorAudioLevel]);

  // Finalizar llamada
  const endCall = useCallback(() => {
    setCallState('idle');
    setIsRecording(false);
    setAudioLevel(0);
    setError(null);
    
    // Limpiar timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Detener servicios
    transcriptionService.current.stopTranscription();
    synthesisService.current.stopSynthesis();
    
    // Detener grabación
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        recorderRef.current = null;
      });
    }
    
    // Cerrar stream de audio
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Cerrar contexto de audio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Limpiar al desmontar componente
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    callState,
    isRecording,
    audioLevel,
    error,
    startCall,
    endCall
  };
};