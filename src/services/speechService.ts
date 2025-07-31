import { SpeechRecognition } from '@/types/speech';
import axios from 'axios';

// Servicio para transcripción de audio usando Web Speech API como fallback
export class SpeechTranscriptionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'es-ES';
    this.recognition.maxAlternatives = 1;
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition no disponible'));
        return;
      }

      // Crear un audio temporal para reproducir y transcribir
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
        URL.revokeObjectURL(audioUrl);
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Error de transcripción: ${event.error}`));
        URL.revokeObjectURL(audioUrl);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      // Iniciar transcripción
      try {
        this.recognition.start();
        this.isListening = true;
        
        // Reproducir audio para que el reconocimiento lo capture
        audio.play();
      } catch (error) {
        reject(error);
      }
    });
  }

  stopTranscription() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

// Servicio para síntesis de voz con sesame/csm-1b
export class SpeechSynthesisService {
  private sesameApiUrl: string;

  constructor(sesameApiUrl = 'http://localhost:8000') {
    this.sesameApiUrl = sesameApiUrl;
  }

  async synthesizeSpeech(text: string, speaker = 0): Promise<AudioBuffer> {
    try {
      // Intentar usar sesame/csm-1b primero
      const response = await axios.post(
        `${this.sesameApiUrl}/synthesize`,
        {
          text,
          speaker,
          max_audio_length_ms: 10000
        },
        {
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      // Convertir respuesta a AudioBuffer
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(response.data);
      return audioBuffer;
    } catch (error) {
      console.warn('Sesame/CSM-1B no disponible, usando Web Speech API como fallback');
      throw error;
    }
  }

  async synthesizeSpeechFallback(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Error en síntesis: ${event.error}`));

      speechSynthesis.speak(utterance);
    });
  }

  async playAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => resolve();
      source.addEventListener('error', () => reject(new Error('Error al reproducir audio')));
      
      source.start();
    });
  }

  stopSynthesis() {
    speechSynthesis.cancel();
  }
}

// Servicio para comunicación con LM Studio
export class LMStudioService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:1234', model = 'local-model') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateResponse(userMessage: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente de voz útil y amigable. Responde de manera concisa y natural, como en una conversación telefónica. Mantén tus respuestas breves y conversacionales.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
    } catch (error) {
      console.error('Error al comunicarse con LM Studio:', error);
      throw new Error('Error al generar respuesta de IA');
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/v1/models`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}