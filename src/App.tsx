import React, { useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Activity } from "lucide-react";
import { useAICall } from "./hooks/useAICall";
import { ConfigPanel } from "./components/ConfigPanel";
import { AppConfig } from "./types/speech";
import "./App.css";

function App() {
  const [config, setConfig] = useState<AppConfig>({
    lmStudioUrl: "http://localhost:1234",
    lmStudioModel: "liquid/lfm2-1.2b",
    silenceThreshold: 10,
    silenceTimeout: 2000,
  });

  const { callState, isRecording, audioLevel, error, startCall, endCall } =
    useAICall({ config });

  const getStateText = () => {
    switch (callState) {
      case "idle":
        return "Presiona para iniciar llamada";
      case "calling":
        return "Conectando...";
      case "listening":
        return "Escuchando...";
      case "processing":
        return "Procesando...";
      case "speaking":
        return "IA respondiendo...";
      default:
        return "Estado desconocido";
    }
  };

  const getStateColor = () => {
    switch (callState) {
      case "idle":
        return "text-gray-400";
      case "calling":
        return "text-yellow-400";
      case "listening":
        return "text-green-400";
      case "processing":
        return "text-blue-400";
      case "speaking":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const isCallActive = callState !== "idle";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative">
      {/* Panel de configuración */}
      <ConfigPanel
        config={config}
        onConfigChange={setConfig}
        isCallActive={isCallActive}
      />

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">IA Speaker</h1>
          <p className="text-white/70 text-sm">Conversación por voz con IA</p>
        </div>

        {/* Estado de la llamada */}
        <div className="text-center mb-8">
          <div className={`text-lg font-medium ${getStateColor()} mb-2`}>
            {getStateText()}
          </div>

          {/* Indicador de actividad */}
          {callState === "processing" && (
            <div className="flex justify-center mb-4">
              <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Visualizador de audio */}
        {isCallActive && (
          <div className="mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-1 h-16">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-green-400 to-blue-400 rounded-full transition-all duration-150"
                    style={{
                      width: "3px",
                      height: isRecording
                        ? `${Math.max(
                            4,
                            (audioLevel / 255) * 60 + Math.random() * 10
                          )}px`
                        : "4px",
                      opacity: isRecording ? 0.8 : 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Indicador de micrófono */}
              <div className="flex justify-center mt-2">
                {isRecording ? (
                  <Mic className="w-5 h-5 text-green-400" />
                ) : (
                  <MicOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón principal de llamada */}
        <div className="flex justify-center mb-6">
          <button
            onClick={isCallActive ? endCall : startCall}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-300 transform hover:scale-105
              shadow-lg border-4
              ${
                isCallActive
                  ? "bg-red-500 hover:bg-red-600 border-red-400 animate-pulse"
                  : "bg-green-500 hover:bg-green-600 border-green-400"
              }
            `}
            disabled={callState === "calling" || callState === "processing"}
          >
            {isCallActive ? (
              <PhoneOff className="w-8 h-8 text-white" />
            ) : (
              <Phone className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Información adicional */}
        <div className="text-center text-white/60 text-xs space-y-1">
          <p>Nivel de audio: {Math.round((audioLevel / 255) * 100)}%</p>
          {isCallActive && <p className="text-green-400">🔴 En vivo</p>}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Estado de conexión */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-white/60 text-xs space-y-1">
            <p className="flex items-center justify-between">
              <span>Estado:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  isCallActive
                    ? "bg-green-500/20 text-green-300"
                    : "bg-gray-500/20 text-gray-300"
                }`}
              >
                {isCallActive ? "En línea" : "Desconectado"}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>LM Studio:</span>
              <span className="text-blue-300">
                {config.lmStudioUrl.replace("http://", "")}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
