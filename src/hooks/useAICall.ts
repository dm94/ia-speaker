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
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<RecordRTC | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechDetectedRef = useRef(false);
  const consecutiveSilenceFramesRef = useRef(0);
  const callStateRef = useRef<CallState>('idle');
  
  // Servicios
  const transcriptionService = useRef(new SpeechTranscriptionService());
  const synthesisService = useRef(new SpeechSynthesisService());
  const lmStudioService = useRef(new LMStudioService(config.lmStudioUrl, config.lmStudioModel));

  // Mantener callStateRef sincronizado con callState
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

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



  // Iniciar nueva grabación después de respuesta
  const startNewRecording = useCallback(() => {
    if (recorderRef.current && mediaStreamRef.current && !isMuted) {
      recorderRef.current = new RecordRTC(mediaStreamRef.current, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000
      });
      
      recorderRef.current.startRecording();
      setIsRecording(true);
      // Reset detección de habla para nueva grabación
      speechDetectedRef.current = false;
      consecutiveSilenceFramesRef.current = 0;
    }
  }, [isMuted]);

  // Sintetizar y reproducir respuesta de voz
  const synthesizeAndPlaySpeech = useCallback(async (text: string) => {
    callStateRef.current = 'speaking';
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
      callStateRef.current = 'listening';
      setCallState('listening');
      startNewRecording();
      
    } catch (err) {
      setError('Error al sintetizar voz: ' + (err as Error).message);
      callStateRef.current = 'listening';
      setCallState('listening');
      startNewRecording();
    }
  }, [startNewRecording]);

  // Procesar grabación cuando se detecta silencio
  const processRecording = useCallback(async () => {
    const currentCallState = callStateRef.current;
    console.log('🎤 Iniciando procesamiento de grabación...', { callState: currentCallState, hasRecorder: !!recorderRef.current, isMuted });
    if (!recorderRef.current || currentCallState !== 'listening' || isMuted) {
      console.log('❌ No se puede procesar: sin grabador, estado incorrecto o micrófono muteado', { callState: currentCallState, hasRecorder: !!recorderRef.current, isMuted });
      return;
    }
    
    console.log('⚙️ Cambiando estado a processing...');
    callStateRef.current = 'processing';
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
              callStateRef.current = 'listening';
              setCallState('listening');
              startNewRecording();
            }
          } else {
            // Si no hay transcripción, volver a escuchar
            callStateRef.current = 'listening';
            setCallState('listening');
            startNewRecording();
          }
          
        } catch (err) {
          setError('Error al procesar audio: ' + (err as Error).message);
          callStateRef.current = 'listening';
          setCallState('listening');
          startNewRecording();
        }
      });
      
    } catch (err) {
      setError('Error al procesar grabación: ' + (err as Error).message);
      callStateRef.current = 'listening';
      setCallState('listening');
      startNewRecording();
    }
  }, [callState, synthesizeAndPlaySpeech, startNewRecording]);

  // Monitorear nivel de audio y detectar silencio mejorado
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || isMuted) {
      setAudioLevel(0);
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      return;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calcular nivel promedio de audio
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average);
    
    // Mejorar detección de habla vs ruido de fondo
    const speechThreshold = config.silenceThreshold + 5; // Umbral más alto para detectar habla real
    const isSpeaking = average > speechThreshold;
    
    if (isSpeaking) {
      speechDetectedRef.current = true;
      consecutiveSilenceFramesRef.current = 0;
      
      // Cancelar timer de silencio si hay habla
      if (silenceTimerRef.current) {
        console.log('🔊 Habla detectada, cancelando timer de silencio');
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      // Solo procesar si ya se detectó habla previamente
      if (speechDetectedRef.current) {
        consecutiveSilenceFramesRef.current++;
        
        // Requerir múltiples frames consecutivos de silencio para mayor precisión
        const requiredSilenceFrames = Math.floor(config.silenceTimeout / 50); // ~50ms por frame
        
        if (consecutiveSilenceFramesRef.current >= requiredSilenceFrames && !silenceTimerRef.current) {
          const currentCallState = callStateRef.current;
          console.log('🔇 Silencio prolongado detectado después de habla, procesando...', { 
            callState: currentCallState
          });
          
          if (currentCallState === 'listening') {
            // Reset para próxima detección
            speechDetectedRef.current = false;
            consecutiveSilenceFramesRef.current = 0;
            processRecording();
          }
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, [callState, config.silenceThreshold, config.silenceTimeout, processRecording, isMuted]);

  // Iniciar llamada
  const startCall = useCallback(async () => {
    setError(null);
    const audioInitialized = await initializeAudio();
    
    if (audioInitialized && recorderRef.current) {
      callStateRef.current = 'calling';
      setCallState('calling');
      
      // Pequeña pausa antes de empezar a escuchar
      setTimeout(() => {
        callStateRef.current = 'listening';
        setCallState('listening');
        if (!isMuted) {
          recorderRef.current!.startRecording();
          setIsRecording(true);
        }
        monitorAudioLevel();
      }, 1000);
    }
  }, [initializeAudio, monitorAudioLevel]);

  // Finalizar llamada
  const endCall = useCallback(() => {
    callStateRef.current = 'idle';
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

  // Función para mutear/desmutear el micrófono
  const toggleMute = useCallback(() => {
    if (callStateRef.current === 'idle') { return;}
    
    setIsMuted(prev => {
      const newMutedState = !prev;
      
      if (newMutedState) {
        // Mutear: detener grabación pero mantener la llamada
        if (recorderRef.current && isRecording) {
          recorderRef.current.stopRecording(() => {
            setIsRecording(false);
          });
        }
        // Cancelar timer de silencio
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        // Reset detección
        speechDetectedRef.current = false;
        consecutiveSilenceFramesRef.current = 0;
      } else {
        // Desmutear: reiniciar grabación si estamos escuchando
        if (callStateRef.current === 'listening' && recorderRef.current && mediaStreamRef.current) {
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
      }
      
      return newMutedState;
    });
  }, [isRecording]);

  return {
    callState,
    isRecording,
    isMuted,
    audioLevel,
    error,
    startCall,
    endCall,
    toggleMute
  };
};