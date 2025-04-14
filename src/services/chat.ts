import client from "../lib/http/request";
import { ChatListResponse, ChatDetailsResponse, ChatStatusUpdate, MessageAdd } from '@/models/chat';

// API paths
const path = "chat";

const api = {
  listChats: `/${path}/list`,
  getChat: `/${path}/message`, // Will append chat_id in function
  updateStatus: `/${path}/status` // Will append chat_id in function
};

export async function listChats(
  status?: string,
  page: string = '1',
  page_size: string = '10'
): Promise<ChatListResponse> {
  try {
    const response = await client({
      url: api.listChats,
      method: "GET",
      params: {
        status,
        page,
        limit: page_size
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

export async function getChatDetail(chatId: string, version?: string): Promise<ChatDetailsResponse> {
  try {
    const response = await client({
      url: `${api.getChat}/${chatId}`,
      method: "GET",
      params: version ? { version } : undefined
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chat details:", error);
    throw error;
  }
}

export async function updateChatStatus(data: ChatStatusUpdate): Promise<{ message: string; chat_id: string }> {
  try {
    const response = await client({
      url: `${api.updateStatus}/${data.chat_id}`,
      method: "PUT",
      data: { 
        chat_id: data.chat_id,
        status: data.status }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating chat status:", error);
    throw error;
  }
}