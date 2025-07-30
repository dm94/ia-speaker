import { useState, useEffect } from 'react';
import { ConfigurationData } from '@/types';

const defaultConfig: ConfigurationData = {
  lmStudioUrl: 'http://localhost:1234',
  lmStudioModel: '',
  temperature: 0.7,
  maxTokens: 1000,
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  microphoneSensitivity: 0.5,
  outputVolume: 0.8,
  inputDevice: 'default',
  outputDevice: 'default'
};

export function useConfiguration() {
  const [config, setConfig] = useState<ConfigurationData>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = () => {
    try {
      const savedConfig = localStorage.getItem('ia-speaker-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = (newConfig: Partial<ConfigurationData>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      localStorage.setItem('ia-speaker-config', JSON.stringify(updatedConfig));
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      return false;
    }
  };

  const resetConfiguration = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('ia-speaker-config');
  };

  const testLMStudioConnection = async (url?: string): Promise<boolean> => {
    try {
      const testUrl = url || config.lmStudioUrl;
      const response = await fetch(`${testUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('LM Studio connection test failed:', error);
      return false;
    }
  };

  return {
    config,
    isLoading,
    saveConfiguration,
    resetConfiguration,
    testLMStudioConnection,
    updateConfig: (key: keyof ConfigurationData, value: string | number) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };
}