/**
 * API Service for Chat Training functionality
 * Handles authentication, module data fetching, and messaging
 */

import { getCookie } from "@/utils/cookies";


// Base API URL
const BASE_URL = "https://eaton1-api.xlab-cwru.com";

// Define response types
interface ModuleResponse {
  response: any;
  id: string;
  title: string;
  system_prompt: string;
  scenario_context: {
    title: string;
    description: string;
    guidelines: string[];
    keyTerms: { [key: string]: string };
  };
}

interface TrainingResource {
  id: string;
  title: string;
  url: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  access_level: number;
}

// Chat-related type definitions

export type ChatStatus = 'open' | 'in_progress' | 'completed';

export interface ChatMessage {
  role: string; // 'system', 'user', or 'assistant'
  content: string;
  on: string; // ISO timestamp
}

export interface ChatVersion {
  score: number;
  progress: number; // Progress percentage (0-100)
  status: ChatStatus;
  started_at: string; // ISO timestamp
  completed_at?: string; // ISO timestamp or undefined if not completed
  messages: ChatMessage[];
}

export interface ChatSession {
  agent_id: string; // ID of the AI agent
  user_id: string; // ID of the user
  version: number; // Current version of the chat
  chat_id: string; // Unique chat identifier
  chat: {
    [version: string]: ChatVersion; // Key is version number as string
  };
}

// Response types based on API documentation
interface CreateChatResponse {
  message: string;
  chat_id: string;
}

interface SendMessageResponse {
  message: string;
  data: {
    role: string;
    content: string;
    on: string;
  };
}

interface ChatHistoryResponse {
  message: string;
  data: {
    messages: ChatMessage[];
    chat_id: string;
  };
}

// API error handling with custom error class
class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// API Service
export const ApiService = {
  // Get authentication token - check local storage first
  getAuthToken: (): string => {
    // In a production app, this would be integrated with an auth provider
    return localStorage.getItem('token') || getCookie("token") || '';
  },

  // Set authentication token
  setAuthToken: (token: string): void => {
    localStorage.setItem('token', token);
  },

  // Get current user information from token or localStorage
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null; // SSR guard

    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  },

  // Set current user information
  setCurrentUser: (user: User): void => {
    localStorage.setItem('currentUser', JSON.stringify(user));
  },

  // Get headers with authentication
  getHeaders: (contentType: string = "application/json") => {
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "accept": "application/json",
    };

    const token = ApiService.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  },

  // Enhanced fetch with error handling
  fetchWithErrorHandling: async (url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // Handle different error codes appropriately
        switch (response.status) {
          case 401:
            throw new ApiError('Authentication required. Please log in again.', 401);
          case 403:
            throw new ApiError('You do not have permission to perform this action.', 403);
          case 404:
            throw new ApiError('Resource not found.', 404);
          default:
            throw new ApiError(`API request failed with status: ${response.status}`, response.status);
        }
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      } else {
        // Network errors, JSON parsing errors, etc.
        throw new ApiError('Network or server error occurred.', 0);
      }
    }
  },

  // Fetch module by ID
  fetchModuleById: async (moduleId: string, userId?: string): Promise<ModuleResponse> => {
    var response = null;
    try {
      // Add userId as query param if available for personalization
      const url = `${BASE_URL}/prod/chat/message/${moduleId}`;

      response = await ApiService.fetchWithErrorHandling(url, {
        method: "GET",
        headers: ApiService.getHeaders()
      });
    } catch (error) {
      console.error("Error fetching module:", error);
    }
    // Provide fallback data if API fails
    return {
      response: response,
      id: moduleId,
      title: "Customer Billing Issue",
      system_prompt: "This is a customer support training scenario. The customer has a billing issue. Please assist them professionally.",
      scenario_context: {
        title: "Customer Billing Issue",
        description: "Customer is confused about a $45 charge labeled 'Service Fee' on their recent invoice",
        guidelines: [
          "Use empathetic language",
          "Offer clear explanations about billing policies",
          "Provide options for resolving the issue"
        ],
        keyTerms: {
          "Service Fee": "Monthly fee for premium technical support ($45/month)",
          "Proration": "Partial billing for partial service period",
          "Service tier": "Level of support customer has subscribed to"
        }
      }
    };
  },

  // Create a new chat session - Matches API documentation
  createChatSession: async (agentId: string): Promise<string> => {
    try {
      const data = await ApiService.fetchWithErrorHandling(`${BASE_URL}/dev/chat/create`, {
        method: 'POST',
        headers: ApiService.getHeaders(),
        body: JSON.stringify({ agent_id: agentId })
      });

      return data.chat_id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  },

  // Send message to a chat - Follows API documentation
  sendMessage: async (message: string, chatId: string): Promise<SendMessageResponse> => {
    try {
      return await ApiService.fetchWithErrorHandling(`${BASE_URL}/dev/chat/message`, {
        method: 'POST',
        headers: ApiService.getHeaders(),
        body: JSON.stringify({
          message,
          chat_id: chatId // Verified from API docs, should be chat_id not thread_id
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get chat history for a specific agent - Follows API documentation
  getChatHistory: async (agentId: string): Promise<ChatHistoryResponse> => {
    try {
      return await ApiService.fetchWithErrorHandling(`${BASE_URL}/dev/chat/message/${agentId}`, {
        method: 'GET',
        headers: ApiService.getHeaders()
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  },

  // Fetch training resources
  fetchTrainingResources: async (moduleId: string, userId?: string): Promise<TrainingResource[]> => {
    try {
      // Add userId as query param if available for personalization
      const url = userId
        ? `${BASE_URL}/dev/resources/${moduleId}?user_id=${userId}`
        : `${BASE_URL}/dev/resources/${moduleId}`;

      return await ApiService.fetchWithErrorHandling(url, {
        method: 'GET',
        headers: ApiService.getHeaders()
      });
    } catch (error) {
      console.error("Error fetching training resources:", error);

      // Fallback to mock data if API fails
      return [
        { id: "1", title: "Billing Policy Guide", url: "/resources/billing-guide.pdf" },
        { id: "2", title: "Customer Service Standards", url: "/resources/service-standards.pdf" },
        { id: "3", title: "De-escalation Techniques", url: "/resources/de-escalation.pdf" }
      ];
    }
  },

  // Track user progress in a training module
  // Using chatId as param name to match API expectations per documentation
  trackProgress: async (userId: string, moduleId: string, chatId: string, score: number): Promise<void> => {
    try {
      await ApiService.fetchWithErrorHandling(`${BASE_URL}/dev/training/progress`, {
        method: 'POST',
        headers: ApiService.getHeaders(),
        body: JSON.stringify({
          userId,
          moduleId,
          chatId, // Using chatId consistently
          score
        })
      });
    } catch (error) {
      console.error("Error tracking progress:", error);

      // Don't throw for non-critical operation
      if ((error as ApiError).status === 401) {
        throw error; // Re-throw auth errors as they need handling
      }
      // Silently handle other errors for this non-critical operation
    }
  },

  // Get user progress across all training modules
  getUserProgress: async (userId: string): Promise<any> => {
    try {
      return await ApiService.fetchWithErrorHandling(`${BASE_URL}/dev/training/progress/${userId}`, {
        method: 'GET',
        headers: ApiService.getHeaders()
      });
    } catch (error) {
      console.error("Error getting user progress:", error);

      // Fallback to mock data if API fails
      return {
        total_modules: 5,
        completed_modules: 2,
        average_score: 7.5,
        modules: [
          {
            module_id: "module-123",
            title: "Customer Billing Issue",
            completed: true,
            best_score: 8,
            attempts: 2
          },
          {
            module_id: "module-456",
            title: "Technical Support Basics",
            completed: true,
            best_score: 7,
            attempts: 1
          }
        ]
      };
    }
  },

  // Get an existing chat session by using chat history
  getChatSession: async (agentId: string, userId: string): Promise<ChatSession> => {
    try {
      // Try to get chat history
      const history = await ApiService.getChatHistory(agentId);

      if (history && history.data && history.data.chat_id) {
        // Construct a chat session from history
        const messages = history.data.messages;

        return {
          agent_id: agentId,
          user_id: userId,
          version: 1, // Assuming first version
          chat_id: history.data.chat_id,
          chat: {
            "1": {
              score: 0, // Default values since API doesn't provide these
              progress: calculateProgressFromMessages(messages),
              status: 'open',
              started_at: messages[0]?.on || new Date().toISOString(),
              messages: messages
            }
          }
        };
      }

      // If no history found, create a new chat session
      const chatId = await ApiService.createChatSession(agentId);

      // Return a minimal session structure for the new session
      return {
        agent_id: agentId,
        user_id: userId,
        version: 1,
        chat_id: chatId,
        chat: {
          "1": {
            score: 0,
            progress: 0,
            status: 'open',
            started_at: new Date().toISOString(),
            messages: []
          }
        }
      };
    } catch (error) {
      console.error('Error getting or creating chat session:', error);

      // Create a new session as fallback
      try {
        const chatId = await ApiService.createChatSession(agentId);

        return {
          agent_id: agentId,
          user_id: userId,
          version: 1,
          chat_id: chatId,
          chat: {
            "1": {
              score: 0,
              progress: 0,
              status: 'open',
              started_at: new Date().toISOString(),
              messages: []
            }
          }
        };
      } catch (err) {
        console.error('Critical error creating chat session:', err);
        throw error;
      }
    }
  },

  // Helper method to simulate completing a chat session
  // Note: This isn't in the API documentation, but needed for app functionality
  completeChatSession: async (
    agentId: string,
    userId: string,
    version: number,
    score: number
  ): Promise<ChatSession> => {
    try {
      // Get current session state
      const session = await ApiService.getChatSession(agentId, userId);

      // Update session locally (since API doesn't have this endpoint)
      if (session && session.chat && session.chat[version]) {
        // Create updated session
        const updatedSession = {
          ...session,
          chat: {
            ...session.chat,
            [version]: {
              ...session.chat[version],
              status: 'completed' as const,
              score: score,
              completed_at: new Date().toISOString()
            }
          }
        };

        // Track progress to backend
        await ApiService.trackProgress(
          userId,
          agentId,
          session.chat_id,
          score
        );

        return updatedSession;
      }

      throw new Error('Invalid session state');
    } catch (error) {
      console.error('Error completing chat session:', error);
      throw error;
    }
  }
};

// Helper function to calculate progress from message count
function calculateProgressFromMessages(messages: ChatMessage[]): number {
  const userMessageCount = messages.filter(m => m.role === "user").length;
  return Math.min(Math.floor((userMessageCount / 10) * 100), 100);
}