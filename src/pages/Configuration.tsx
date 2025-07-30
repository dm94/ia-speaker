import { useState } from 'react';
import { Settings, Mic, Volume2, Server } from 'lucide-react';

interface ConfigurationData {
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

export default function Configuration() {
  const [config, setConfig] = useState<ConfigurationData>({
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
  });

  const handleConfigChange = (key: keyof ConfigurationData, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('ia-speaker-config', JSON.stringify(config));
    alert('Configuración guardada exitosamente');
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${config.lmStudioUrl}/v1/models`);
      if (response.ok) {
        alert('Conexión exitosa con LM Studio');
      } else {
        alert('Error al conectar con LM Studio');
      }
    } catch (error) {
      alert('Error de conexión: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuración LM Studio */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">LM Studio</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Servidor
                </label>
                <input
                  type="text"
                  value={config.lmStudioUrl}
                  onChange={(e) => handleConfigChange('lmStudioUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://localhost:1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  value={config.lmStudioModel}
                  onChange={(e) => handleConfigChange('lmStudioModel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del modelo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura: {config.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleTestConnection}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Probar Conexión
              </button>
            </div>

            {/* Configuración de Audio */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Audio y Voz</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Velocidad de Voz: {config.voiceSpeed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.voiceSpeed}
                    onChange={(e) => handleConfigChange('voiceSpeed', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tono de Voz: {config.voicePitch}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.voicePitch}
                    onChange={(e) => handleConfigChange('voicePitch', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">Micrófono</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sensibilidad: {Math.round(config.microphoneSensitivity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.microphoneSensitivity}
                  onChange={(e) => handleConfigChange('microphoneSensitivity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volumen de Salida: {Math.round(config.outputVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.outputVolume}
                  onChange={(e) => handleConfigChange('outputVolume', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispositivo de Entrada
                  </label>
                  <select
                    value={config.inputDevice}
                    onChange={(e) => handleConfigChange('inputDevice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Dispositivo por defecto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dispositivo de Salida
                  </label>
                  <select
                    value={config.outputDevice}
                    onChange={(e) => handleConfigChange('outputDevice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Dispositivo por defecto</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors font-semibold"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}