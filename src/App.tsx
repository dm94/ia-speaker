import React, { useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Activity } from "lucide-react";
import { useAICall } from "./hooks/useAICall";
import { useSEO } from "./hooks/useSEO";
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

  const {
    callState,
    isRecording,
    isMuted,
    audioLevel,
    error,
    startCall,
    endCall,
    toggleMute,
  } = useAICall({ config });

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

  // SEO optimization
  useSEO({
    title:
      callState === "idle"
        ? "IA Speaker - Conversaciones de Voz con IA Local"
        : `IA Speaker - ${getStateText()}`,
    description:
      "Aplicación web que simula llamadas telefónicas con IA de forma completamente local. Conversaciones naturales por voz con privacidad total.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "IA Speaker",
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web Browser",
      description:
        "Aplicación web para conversaciones por voz con inteligencia artificial local",
      url: "https://ia-speaker.vercel.app",
      author: {
        "@type": "Organization",
        name: "IA Speaker Team",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  });

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
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative">
      {/* Panel de configuración */}
      <ConfigPanel
        config={config}
        onConfigChange={setConfig}
        isCallActive={isCallActive}
      />

      <section
        className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full"
        role="main"
        aria-label="Interfaz de llamada con IA"
      >
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">IA Speaker</h1>
          <p className="text-white/70 text-sm">Conversación por voz con IA</p>
        </header>

        {/* Estado de la llamada */}
        <section
          className="text-center mb-8"
          aria-live="polite"
          aria-label="Estado de la llamada"
        >
          <div
            className={`text-lg font-medium ${getStateColor()} mb-2`}
            role="status"
          >
            {getStateText()}
          </div>

          {/* Indicador de actividad */}
          {callState === "processing" && (
            <div
              className="flex justify-center mb-4"
              aria-label="Procesando solicitud"
            >
              <Activity
                className="w-6 h-6 text-blue-400 animate-pulse"
                aria-hidden="true"
              />
            </div>
          )}
        </section>

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
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-red-400" />
                ) : isRecording ? (
                  <Mic className="w-5 h-5 text-green-400" />
                ) : (
                  <MicOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones de control */}
        <section
          className="flex justify-center items-center space-x-4 mb-6"
          role="group"
          aria-label="Controles de llamada"
        >
          {/* Botón de mute (solo visible durante llamada) */}
          {isCallActive && (
            <button
              onClick={toggleMute}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-300 transform hover:scale-105
                shadow-lg border-4 focus:outline-none focus:ring-4 focus:ring-white/50
                ${
                  isMuted
                    ? "bg-red-500 hover:bg-red-600 border-red-400"
                    : "bg-gray-600 hover:bg-gray-700 border-gray-500"
                }
              `}
              disabled={callState === "calling" || callState === "processing"}
              aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
              aria-pressed={isMuted}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" aria-hidden="true" />
              ) : (
                <Mic className="w-6 h-6 text-white" aria-hidden="true" />
              )}
            </button>
          )}

          {/* Botón principal de llamada */}
          <button
            onClick={isCallActive ? endCall : startCall}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-300 transform hover:scale-105
              shadow-lg border-4 focus:outline-none focus:ring-4 focus:ring-white/50
              ${
                isCallActive
                  ? "bg-red-500 hover:bg-red-600 border-red-400 animate-pulse"
                  : "bg-green-500 hover:bg-green-600 border-green-400"
              }
            `}
            disabled={callState === "calling" || callState === "processing"}
            aria-label={isCallActive ? "Finalizar llamada" : "Iniciar llamada"}
            aria-pressed={isCallActive}
          >
            {isCallActive ? (
              <PhoneOff className="w-8 h-8 text-white" aria-hidden="true" />
            ) : (
              <Phone className="w-8 h-8 text-white" aria-hidden="true" />
            )}
          </button>
        </section>

        {/* Información adicional */}
        <aside
          className="text-center text-white/60 text-xs space-y-1"
          aria-label="Información de estado"
        >
          <p aria-live="polite">
            Nivel de audio: {Math.round((audioLevel / 255) * 100)}%
          </p>
          {isCallActive && (
            <div
              className="flex justify-center items-center space-x-2"
              role="status"
            >
              <p className="text-green-400" aria-label="Estado en vivo">
                🔴 En vivo
              </p>
              {isMuted && (
                <p className="text-red-400" aria-label="Micrófono silenciado">
                  🔇 Muteado
                </p>
              )}
            </div>
          )}
        </aside>

        {/* Error */}
        {error && (
          <div
            className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Estado de conexión */}
        <footer className="mt-6 pt-4 border-t border-white/10">
          <div className="text-white/60 text-xs space-y-1">
            <p className="flex items-center justify-between">
              <span>Estado:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  isCallActive
                    ? "bg-green-500/20 text-green-300"
                    : "bg-gray-500/20 text-gray-300"
                }`}
                role="status"
                aria-label={`Estado de conexión: ${
                  isCallActive ? "En línea" : "Desconectado"
                }`}
              >
                {isCallActive ? "En línea" : "Desconectado"}
              </span>
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default App;
