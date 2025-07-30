import { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, Play, Calendar, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

export default function History() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Cargar conversaciones desde localStorage
    const savedConversations = localStorage.getItem('ia-speaker-conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations).map((conv: any) => ({
        ...conv,
        date: new Date(conv.date),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setConversations(parsed);
      setFilteredConversations(parsed);
    } else {
      // Datos de ejemplo para demostración
      const exampleConversations: Conversation[] = [
        {
          id: '1',
          title: 'Conversación sobre programación',
          date: new Date('2024-01-15T10:30:00'),
          messages: [
            {
              id: '1-1',
              type: 'user',
              content: '¿Puedes explicarme qué es React?',
              timestamp: new Date('2024-01-15T10:30:00')
            },
            {
              id: '1-2',
              type: 'ai',
              content: 'React es una biblioteca de JavaScript para construir interfaces de usuario. Fue desarrollada por Facebook y se basa en componentes reutilizables.',
              timestamp: new Date('2024-01-15T10:30:15')
            }
          ]
        },
        {
          id: '2',
          title: 'Consulta sobre inteligencia artificial',
          date: new Date('2024-01-14T15:45:00'),
          messages: [
            {
              id: '2-1',
              type: 'user',
              content: '¿Cómo funciona el machine learning?',
              timestamp: new Date('2024-01-14T15:45:00')
            },
            {
              id: '2-2',
              type: 'ai',
              content: 'El machine learning es una rama de la inteligencia artificial que permite a las máquinas aprender patrones de los datos sin ser programadas explícitamente.',
              timestamp: new Date('2024-01-14T15:45:20')
            }
          ]
        }
      ];
      setConversations(exampleConversations);
      setFilteredConversations(exampleConversations);
    }
  }, []);

  useEffect(() => {
    // Filtrar conversaciones basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv => 
        conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.messages.some(msg => 
          msg.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error reproduciendo audio:', error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            <HistoryIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Historial de Conversaciones</h1>
          </div>

          <div className="flex h-[calc(100vh-200px)]">
            {/* Panel izquierdo - Lista de conversaciones */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Barra de búsqueda */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar conversaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lista de conversaciones */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones guardadas'}
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(conversation.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <MessageCircle className="w-4 h-4" />
                            <span>{conversation.messages.length} mensajes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel derecho - Detalles de conversación */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Encabezado de conversación */}
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedConversation.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {formatDate(selectedConversation.date)}
                    </p>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      {selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-4 ${
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs ${
                                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(message.timestamp)}
                              </span>
                              {message.audioUrl && (
                                <button
                                  onClick={() => playAudio(message.audioUrl!)}
                                  className={`ml-2 p-1 rounded ${
                                    message.type === 'user'
                                      ? 'hover:bg-blue-700'
                                      : 'hover:bg-gray-300'
                                  }`}
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">Selecciona una conversación para ver los detalles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}