import { ChatDetailsResponse, ChatListResponse, ChatStatusUpdate } from '@/models/chat';
import client from "../lib/http/request";

// Supabase REST API paths
const api = {
  chats: "/chats",
  messages: "/messages",
};

export async function listChats(
  status?: string,
  page: string = '1',
  page_size: string = '10'
): Promise<ChatListResponse> {
  try {
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    
    let url = `${api.chats}?order=created_at.desc&limit=${page_size}&offset=${offset}`;
    
    if (status) {
      url += `&status=eq.${status}`;
    }

    const response = await client.get(url);
    
    return {
      chats: response.data,
      total: response.headers['content-range']?.split('/')[1] || response.data.length,
      page: parseInt(page),
      page_size: parseInt(page_size),
    };
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

export async function getChatDetail(chatId: string, version?: string): Promise<ChatDetailsResponse> {
  try {
    let url = `${api.messages}?chat_id=eq.${chatId}&order=created_at.asc`;
    
    if (version) {
      url += `&version=eq.${version}`;
    }

    const response = await client.get(url);
    
    return {
      chat_id: chatId,
      messages: response.data,
    };
  } catch (error) {
    console.error("Error fetching chat details:", error);
    throw error;
  }
}

export async function updateChatStatus(data: ChatStatusUpdate): Promise<{ message: string; chat_id: string }> {
  try {
    const response = await client.patch(
      `${api.chats}?id=eq.${data.chat_id}`,
      { status: data.status }
    );
    
    return {
      message: "Chat status updated successfully",
      chat_id: data.chat_id,
    };
  } catch (error) {
    console.error("Error updating chat status:", error);
    throw error;
  }
}