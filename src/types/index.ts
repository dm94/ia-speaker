export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

export interface ConfigurationData {
  lmStudioUrl: string;
  lmStudioModel: string;
  temperature: number;
  maxTokens: number;
  voiceSpeed: number;
  voicePitch: number;
  microphoneSensitivity: number;
  outputVolume: number;
  inputDevice: string;
  outputDevice: string;
}

export type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceSynthesisConfig {
  speed: number;
  pitch: number;
  volume: number;
  lang: string;
}

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}