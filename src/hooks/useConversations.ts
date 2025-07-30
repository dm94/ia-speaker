import { useState, useEffect } from 'react';
import { Conversation, Message } from '@/types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    try {
      const saved = localStorage.getItem('ia-speaker-conversations');
      if (saved) {
        const parsed = JSON.parse(saved).map((conv: any) => ({
          ...conv,
          date: new Date(conv.date),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(parsed);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversations = (convs: Conversation[]) => {
    try {
      localStorage.setItem('ia-speaker-conversations', JSON.stringify(convs));
      return true;
    } catch (error) {
      console.error('Error saving conversations:', error);
      return false;
    }
  };

  const createNewConversation = (firstMessage?: Message): Conversation => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: firstMessage ? generateTitle(firstMessage.content) : 'Nueva conversación',
      date: new Date(),
      messages: firstMessage ? [firstMessage] : []
    };
    
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversation(newConversation);
    saveConversations(updatedConversations);
    
    return newConversation;
  };

  const addMessageToConversation = (conversationId: string, messageData: Omit<Message, 'id' | 'timestamp'>): Message => {
    const message: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        const updatedConv = {
          ...conv,
          messages: [...conv.messages, message],
          title: conv.messages.length === 0 ? generateTitle(message.content) : conv.title
        };
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConv);
        }
        return updatedConv;
      }
      return conv;
    });
    
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    return message;
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  };

  const generateTitle = (content: string): string => {
    const words = content.trim().split(' ');
    const title = words.slice(0, 6).join(' ');
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  };

  const searchConversations = (searchTerm: string): Conversation[] => {
    if (!searchTerm.trim()) return conversations;
    
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getConversationById = (id: string): Conversation | undefined => {
    return conversations.find(conv => conv.id === id);
  };

  return {
    conversations,
    currentConversation,
    isLoading,
    setCurrentConversation,
    createNewConversation,
    addMessageToConversation,
    deleteConversation,
    searchConversations,
    getConversationById,
    clearAllConversations: () => {
      setConversations([]);
      setCurrentConversation(null);
      localStorage.removeItem('ia-speaker-conversations');
    }
  };
}