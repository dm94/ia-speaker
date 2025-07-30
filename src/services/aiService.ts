import { ConfigurationData, VoiceSynthesisConfig } from '@/types';

export class AIService {
  private config: ConfigurationData;

  constructor(config: ConfigurationData) {
    this.config = config;
  }

  updateConfig(newConfig: ConfigurationData) {
    this.config = newConfig;
  }

  async generateResponse(message: string, conversationHistory?: Array<{role: string, content: string}>): Promise<string> {
    try {
      const messages = [
        ...(conversationHistory || []),
        { role: 'user', content: message }
      ];

      const response = await fetch(`${this.config.lmStudioUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.lmStudioModel || 'local-model',
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LM Studio error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Respuesta inválida de LM Studio');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error(
        error instanceof Error 
          ? `Error de LM Studio: ${error.message}`
          : 'Error desconocido al comunicarse con LM Studio'
      );
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.lmStudioUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `Error HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión desconocido'
      };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.lmStudioUrl}/v1/models`);
      if (!response.ok) {
        throw new Error('Error al obtener modelos');
      }
      
      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }
}

export class VoiceSynthesisService {
  private config: VoiceSynthesisConfig;
  private pythonBackendUrl: string;

  constructor(config: VoiceSynthesisConfig, pythonBackendUrl = 'http://localhost:8000') {
    this.config = config;
    this.pythonBackendUrl = pythonBackendUrl;
  }

  updateConfig(newConfig: VoiceSynthesisConfig) {
    this.config = newConfig;
  }

  async speak(text: string): Promise<void> {
    try {
      // Intentar usar el backend Python con sesame/csm-1b
      const response = await fetch(`${this.pythonBackendUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speed: this.config.speed,
          pitch: this.config.pitch,
          volume: this.config.volume,
          lang: this.config.lang
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        await this.playAudio(audioUrl);
        URL.revokeObjectURL(audioUrl);
        return;
      }
    } catch (error) {
      console.warn('Python backend not available, falling back to Web Speech API:', error);
    }

    // Fallback a Web Speech API
    await this.fallbackToWebSpeech(text);
  }

  async synthesizeWithSesame(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.pythonBackendUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speed: this.config.speed,
          pitch: this.config.pitch,
          volume: this.config.volume
        })
      });

      if (!response.ok) {
        throw new Error('Error en el backend de síntesis de voz');
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error with Sesame synthesis, falling back to Web Speech API:', error);
      return this.synthesizeWithWebAPI(text);
    }
  }

  private synthesizeWithWebAPI(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.config.lang || 'es-ES';
        utterance.rate = this.config.speed;
        utterance.pitch = this.config.pitch;
        utterance.volume = this.config.volume;
        
        utterance.onend = () => {
          resolve('web-speech-synthesis');
        };
        
        utterance.onerror = (error) => {
          reject(new Error(`Error en síntesis de voz: ${error.error}`));
        };
        
        speechSynthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  private fallbackToWebSpeech(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.config.lang || 'es-ES';
        utterance.rate = this.config.speed;
        utterance.pitch = this.config.pitch;
        utterance.volume = this.config.volume;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.1, Math.min(2, speed));
  }

  setPitch(pitch: number): void {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  async playAudio(audioUrl: string, volume: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (audioUrl === 'web-speech-synthesis') {
        // Ya se reprodujo con Web Speech API
        resolve();
        return;
      }

      const audio = new Audio(audioUrl);
      audio.volume = volume;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = () => {
        reject(new Error('Error al reproducir audio'));
      };
      
      audio.play().catch(reject);
    });
  }

  stopSpeech() {
    speechSynthesis.cancel();
  }

  async checkPythonBackend(): Promise<boolean> {
    try {
      const response = await fetch(`${this.pythonBackendUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}