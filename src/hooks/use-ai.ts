import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';

// Initialize the API outside the hook so we don't recreate it unnecessarily
let genAI: GoogleGenerativeAI | null = null;
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export function useAIBrainstorm() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(!!API_KEY);
  
  const chatSessionRef = useRef<ChatSession | null>(null);

  // Initialize a new chat session when the hook mounts (or when a new model is needed)
  useEffect(() => {
    if (genAI && !chatSessionRef.current) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        chatSessionRef.current = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: "You are an AI Brainstorming Assistant for an author writing a novel. Keep your answers creative, helpful, and concise. Help them overcome writer's block, generate names, or outline plot points." }],
            },
            {
              role: "model",
              parts: [{ text: "I'm ready to help you brainstorm! What are we working on today?" }],
            }
          ],
        });
        
        // Add the initial welcome message to the UI state
        setMessages([{
          role: "model",
          content: "I'm ready to help you brainstorm! What are we working on today?"
        }]);
      } catch (err: any) {
        console.error("Error initializing Gemini Chat:", err);
      }
    }
  }, []);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!isConfigured || !chatSessionRef.current) {
      setError("AI is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
      return;
    }

    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to UI immediately
      setMessages(prev => [...prev, { role: "user", content: prompt }]);

      // Send to Gemini
      const result = await chatSessionRef.current.sendMessage(prompt);
      const response = await result.response;
      const text = response.text();

      // Add model response to UI
      setMessages(prev => [...prev, { role: "model", content: text }]);
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(err.message || "Failed to generate a response from the AI.");
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  const clearChat = useCallback(() => {
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      chatSessionRef.current = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "You are an AI Brainstorming Assistant for an author writing a novel. Keep your answers creative, helpful, and concise. Help them overcome writer's block, generate names, or outline plot points." }],
          },
          {
            role: "model",
            parts: [{ text: "I'm ready to help you brainstorm! What are we working on today?" }],
          }
        ],
      });
      setMessages([{
        role: "model",
        content: "I'm ready to help you brainstorm! What are we working on today?"
      }]);
    }
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    isConfigured,
    clearChat
  };
}
