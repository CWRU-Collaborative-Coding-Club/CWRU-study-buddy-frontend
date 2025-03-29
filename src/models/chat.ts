export interface Message {
  role: string;
  content: string;
  on: string;
}

export interface ChatVersion {
  version: number;
  score?: number | null;
  progress?: number | null;
  startedAt: string;
  closedAt?: string | null;
  messages: Message[];
}

export interface Chat {
  status: string;
  version: string | number;
  started_at: string;
  completed_at?: string | null;
  messages: Message[];
}

export interface ChatListResponse {
  chats: Chat[];
  page: number;
  page_size: number;
  total_count: number;
}

export interface ChatDetailsResponse {
  chat: {
    agent_id: string;
    user_id: string;
    status: string;
    startedAt: string;
    closedAt?: string;
    current_version: number;
    chat: ChatVersion[];
  };
}

export interface ChatStatusUpdate {
  chat_id: string;
  status: string;
}

export interface MessageAdd {
  chat_id: string;
  role: string;
  content: string;
}