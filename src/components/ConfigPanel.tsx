import React, { useState } from "react";
import { Settings, Check, X, Wifi, WifiOff } from "lucide-react";
import { AppConfig } from "../types/speech";
import { LMStudioService } from "../services/speechService";

interface ConfigPanelProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  isCallActive: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onConfigChange,
  isCallActive,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  const handleSave = () => {
    onConfigChange(tempConfig);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempConfig(config);
    setIsOpen(false);
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const lmStudio = new LMStudioService(
        tempConfig.lmStudioUrl,
        tempConfig.lmStudioModel
      );
      const isConnected = await lmStudio.checkConnection();
      setConnectionStatus(isConnected ? "connected" : "disconnected");
    } catch {
      setConnectionStatus("disconnected");
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={isCallActive}
        className="fixed top-4 right-4 p-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Configuración"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Configuración</h2>
          <button
            onClick={handleCancel}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* LM Studio Configuration */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">LM Studio</h3>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                URL del servidor
              </label>
              <input
                type="text"
                value={tempConfig.lmStudioUrl}
                onChange={(e) =>
                  setTempConfig({ ...tempConfig, lmStudioUrl: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="http://localhost:1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Modelo
              </label>
              <input
                type="text"
                value={tempConfig.lmStudioModel}
                onChange={(e) =>
                  setTempConfig({
                    ...tempConfig,
                    lmStudioModel: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="local-model"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={testConnection}
                disabled={isTestingConnection}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                ) : connectionStatus === "connected" ? (
                  <Wifi className="w-4 h-4" />
                ) : connectionStatus === "disconnected" ? (
                  <WifiOff className="w-4 h-4" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                <span>
                  {isTestingConnection ? "Probando..." : "Probar conexión"}
                </span>
              </button>

              {connectionStatus === "connected" && (
                <span className="text-green-400 text-sm">✓ Conectado</span>
              )}
              {connectionStatus === "disconnected" && (
                <span className="text-red-400 text-sm">✗ Sin conexión</span>
              )}
            </div>
          </div>

          {/* Audio Configuration */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">
              Detección de Audio
            </h3>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Umbral de silencio (0-255)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={tempConfig.silenceThreshold}
                onChange={(e) =>
                  setTempConfig({
                    ...tempConfig,
                    silenceThreshold: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>Muy sensible</span>
                <span className="text-white">
                  {tempConfig.silenceThreshold}
                </span>
                <span>Poco sensible</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Tiempo de espera (ms)
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={tempConfig.silenceTimeout}
                onChange={(e) =>
                  setTempConfig({
                    ...tempConfig,
                    silenceTimeout: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>Rápido</span>
                <span className="text-white">
                  {tempConfig.silenceTimeout}ms
                </span>
                <span>Lento</span>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">
              Información
            </h4>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Asegúrate de que LM Studio esté ejecutándose</li>
              <li>• El modelo debe estar cargado en LM Studio</li>
              <li>• Sesame/CSM-1B es opcional (fallback a Web Speech API)</li>
              <li>• Ajusta el umbral según tu micrófono</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Guardar</span>
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
