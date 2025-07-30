import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  History as HistoryIcon,
  Home as HomeIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ConversationState } from "@/types";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useConversations } from "@/hooks/useConversations";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { AIService, VoiceSynthesisService } from "@/services/aiService";

export default function Home() {
  const [isMuted, setIsMuted] = useState(false);
  const [conversationState, setConversationState] =
    useState<ConversationState>("idle");
  const [error, setError] = useState<string | null>(null);

  const { config, isLoading: configLoading } = useConfiguration();
  const {
    currentConversation,
    createNewConversation,
    addMessageToConversation,
  } = useConversations();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiServiceRef = useRef<AIService | null>(null);
  const voiceServiceRef = useRef<VoiceSynthesisService | null>(null);

  const handleTranscriptComplete = async (transcript: string) => {
    if (transcript.trim()) {
      await handleSendMessage(transcript.trim());
    } else {
      // Si no hay contenido, volver a idle
      setConversationState("idle");
    }
  };

  const {
    isRecording,
    currentTranscript,
    audioLevel,
    isSupported,
    startRecording,
    stopRecording,
    cleanup,
    initializeRecognition,
  } = useVoiceRecognition({
    onTranscriptComplete: handleTranscriptComplete,
    onStateChange: setConversationState,
    onError: (errorMessage) => {
      setError(errorMessage);
      // Limpiar el error después de 5 segundos
      setTimeout(() => setError(null), 5000);
    },
  });

  useEffect(() => {
    if (!configLoading) {
      // Inicializar servicios con la configuración
      aiServiceRef.current = new AIService(config);
      voiceServiceRef.current = new VoiceSynthesisService({
        speed: config.voiceSpeed,
        pitch: config.voicePitch,
        volume: config.outputVolume,
        lang: "es-ES",
      });

      // Inicializar reconocimiento de voz
      initializeRecognition();

      // Asegurar que el estado inicial sea idle
      setConversationState("idle");
      setError(null);
    }

    return () => {
      cleanup();
    };
  }, [configLoading, config, initializeRecognition, cleanup]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Crear nueva conversación si no existe
  useEffect(() => {
    if (!currentConversation && !configLoading) {
      createNewConversation();
    }
  }, [currentConversation, createNewConversation, configLoading]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      setError(null); // Limpiar errores previos
      await startRecording();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (text: string) => {
    if (!currentConversation || !aiServiceRef.current) return;

    setError(null);
    setConversationState("processing");

    try {
      // Agregar mensaje del usuario
      const userMessage = await addMessageToConversation(
        currentConversation.id,
        {
          type: "user",
          content: text,
        }
      );

      // Obtener respuesta de LM Studio
      const aiResponse = await aiServiceRef.current.generateResponse(
        text,
        currentConversation.messages.map((m) => ({
          role: m.type === "user" ? "user" : "assistant",
          content: m.content,
        }))
      );

      // Agregar mensaje de la AI
      const aiMessage = await addMessageToConversation(currentConversation.id, {
        type: "ai",
        content: aiResponse,
      });

      // Sintetizar voz
      setConversationState("speaking");
      await synthesizeVoice(aiResponse);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");

      // Agregar mensaje de error
      await addMessageToConversation(currentConversation.id, {
        type: "ai",
        content: "Lo siento, hubo un error al procesar tu solicitud.",
      });
    } finally {
      setConversationState("idle");
    }
  };

  const synthesizeVoice = async (text: string) => {
    if (isMuted || !voiceServiceRef.current) {
      setConversationState("idle");
      return;
    }

    try {
      await voiceServiceRef.current.speak(text);
    } catch (error) {
      console.error("Error in voice synthesis:", error);
    } finally {
      setConversationState("idle");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Navegador no compatible
          </h2>
          <p className="text-gray-600">
            Tu navegador no soporta reconocimiento de voz. Por favor, usa
            Chrome, Edge o Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HomeIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">IA Speaker</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/configuration"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <Link
              to="/history"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <HistoryIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
        {/* Status Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    conversationState === "idle"
                      ? "bg-gray-400"
                      : conversationState === "listening"
                      ? "bg-green-500 animate-pulse"
                      : conversationState === "processing"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-blue-500 animate-pulse"
                  }`}
                />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {conversationState === "idle"
                    ? "Listo"
                    : conversationState === "listening"
                    ? "Escuchando..."
                    : conversationState === "processing"
                    ? "Procesando..."
                    : "Hablando..."}
                </span>
              </div>

              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">Nivel de audio</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                  {error}
                </div>
              )}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-white shadow-lg mb-6 overflow-hidden rounded-b-lg">
          <div className="h-96 overflow-y-auto p-6">
            {!currentConversation?.messages ||
            currentConversation.messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <Mic className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">
                  Presiona el micrófono para comenzar una conversación
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span
                        className={`text-xs mt-2 block ${
                          message.type === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                {currentTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[70%] rounded-lg p-4 bg-blue-400 text-white opacity-75">
                      <p className="whitespace-pre-wrap">{currentTranscript}</p>
                      <span className="text-xs mt-2 block text-blue-100">
                        Transcribiendo...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full transition-colors ${
              isMuted
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </button>

          {/* Main Record Button */}
          <button
            onClick={handleToggleRecording}
            disabled={
              conversationState === "processing" ||
              conversationState === "speaking" ||
              configLoading
            }
            className={`p-6 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-gray-600" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.outputVolume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                if (voiceServiceRef.current) {
                  voiceServiceRef.current.setVolume(newVolume);
                }
              }}
              className="w-20"
            />
            <span className="text-sm text-gray-600">
              {Math.round(config.outputVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            Mantén presionado el micrófono para hablar, suéltalo para enviar
          </p>
          <p className="mt-1">
            Asegúrate de que LM Studio esté ejecutándose en {config.lmStudioUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
