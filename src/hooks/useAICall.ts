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
  
  // Services
  const transcriptionService = useRef(new SpeechTranscriptionService());
  const synthesisService = useRef(new SpeechSynthesisService());
  const lmStudioService = useRef(new LMStudioService(config.lmStudioUrl, config.lmStudioModel));

  // Keep callStateRef synchronized with callState
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Initialize audio recording
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
      
      // Configure audio analyzer for silence detection
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Configure RecordRTC
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
      setError('Error accessing microphone: ' + (err as Error).message);
      return false;
    }
  }, []);



  // Start new recording after response
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
      // Reset speech detection for new recording
      speechDetectedRef.current = false;
      consecutiveSilenceFramesRef.current = 0;
    }
  }, [isMuted]);

  // Synthesize and play speech response
  const synthesizeAndPlaySpeech = useCallback(async (text: string) => {
    callStateRef.current = 'speaking';
    setCallState('speaking');
    
    try {
      // Try using sesame/csm-1b first
      try {
        const audioBuffer = await synthesisService.current.synthesizeSpeech(text);
        await synthesisService.current.playAudioBuffer(audioBuffer);
      } catch {
        // Fallback to Web Speech API
        await synthesisService.current.synthesizeSpeechFallback(text);
      }
      
      // Continue conversation
      callStateRef.current = 'listening';
      setCallState('listening');
      startNewRecording();
      
    } catch (err) {
      setError('Error synthesizing speech: ' + (err as Error).message);
      callStateRef.current = 'listening';
      setCallState('listening');
      startNewRecording();
    }
  }, [startNewRecording]);

  // Process recording when silence is detected
  const processRecording = useCallback(async () => {
    const currentCallState = callStateRef.current;
    console.log('🎤 Starting recording processing...', { callState: currentCallState, hasRecorder: !!recorderRef.current, isMuted });
    if (!recorderRef.current || currentCallState !== 'listening' || isMuted) {
      console.log('❌ Cannot process: no recorder, incorrect state or microphone muted', { callState: currentCallState, hasRecorder: !!recorderRef.current, isMuted });
      return;
    }
    
    console.log('⚙️ Changing state to processing...');
    callStateRef.current = 'processing';
    setCallState('processing');
    
    try {
      // Stop recording temporarily
      recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current!.getBlob();
        
        try {
          // Transcribe audio
          const transcript = await transcriptionService.current.transcribeAudio(blob);
          
          if (transcript.trim()) {
            // Generate response with LM Studio
            const aiResponse = await lmStudioService.current.generateResponse(transcript);
            
            if (aiResponse) {
              await synthesizeAndPlaySpeech(aiResponse);
            } else {
              setError('Could not generate response');
              callStateRef.current = 'listening';
              setCallState('listening');
              startNewRecording();
            }
          } else {
            // If no transcription, go back to listening
            callStateRef.current = 'listening';
            setCallState('listening');
            startNewRecording();
          }
          
        } catch (err) {
          setError('Error processing audio: ' + (err as Error).message);
          callStateRef.current = 'listening';
          setCallState('listening');
          startNewRecording();
        }
      });
      
    } catch (err) {
      setError('Error processing recording: ' + (err as Error).message);
      callStateRef.current = 'listening';
      setCallState('listening');
      startNewRecording();
    }
  }, [synthesizeAndPlaySpeech, startNewRecording, isMuted]);

  // Monitor audio level and improved silence detection
  const monitorAudioLevel = useCallback(function checkLevel() {
    if (!analyserRef.current || isMuted) {
      setAudioLevel(0);
      animationFrameRef.current = requestAnimationFrame(checkLevel);
      return;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average);
    
    // Improve speech detection vs background noise
    const speechThreshold = config.silenceThreshold + 5; // Higher threshold to detect real speech
    const isSpeaking = average > speechThreshold;
    
    if (isSpeaking) {
      speechDetectedRef.current = true;
      consecutiveSilenceFramesRef.current = 0;
      
      // Cancel silence timer if there's speech
      if (silenceTimerRef.current) {
        console.log('🔊 Speech detected, canceling silence timer');
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      // Only process if speech was previously detected
      if (speechDetectedRef.current) {
        consecutiveSilenceFramesRef.current++;
        
        // Require multiple consecutive silence frames for better accuracy
        const requiredSilenceFrames = Math.floor(config.silenceTimeout / 50); // ~50ms per frame
        
        if (consecutiveSilenceFramesRef.current >= requiredSilenceFrames && !silenceTimerRef.current) {
          const currentCallState = callStateRef.current;
          
          if (currentCallState === 'listening') {
            // Reset for next detection
            speechDetectedRef.current = false;
            consecutiveSilenceFramesRef.current = 0;
            processRecording();
          }
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(checkLevel);
  }, [config.silenceThreshold, config.silenceTimeout, processRecording, isMuted]);

  // Start call
  const startCall = useCallback(async () => {
    setError(null);
    const audioInitialized = await initializeAudio();
    
    if (audioInitialized && recorderRef.current) {
      callStateRef.current = 'calling';
      setCallState('calling');
      
      // Small pause before starting to listen
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
  }, [initializeAudio, monitorAudioLevel, isMuted]);

  // End call
  const endCall = useCallback(() => {
    callStateRef.current = 'idle';
    setCallState('idle');
    setIsRecording(false);
    setAudioLevel(0);
    setError(null);
    
    // Clean up timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop services
    transcriptionService.current.stopTranscription();
    synthesisService.current.stopSynthesis();
    
    // Stop recording
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        recorderRef.current = null;
      });
    }
    
    // Close audio stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  // Function to mute/unmute microphone
  const toggleMute = useCallback(() => {
    if (callStateRef.current === 'idle') { return;}
    
    setIsMuted(prev => {
      const newMutedState = !prev;
      
      if (newMutedState) {
        // Mute: stop recording but keep call active
        if (recorderRef.current && isRecording) {
          recorderRef.current.stopRecording(() => {
            setIsRecording(false);
          });
        }
        // Cancel silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        // Reset detection
        speechDetectedRef.current = false;
        consecutiveSilenceFramesRef.current = 0;
      } else {
        // Unmute: restart recording if we're listening
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