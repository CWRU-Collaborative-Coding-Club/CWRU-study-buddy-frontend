import { isLocalBackend } from "@/lib/http/apiConfig";
import { Chat, ChatDetailsResponse, ChatListResponse, ChatStatusUpdate } from '@/models/chat';
import client from "../lib/http/request";

const api = {
  chats: "/chats",
  messages: "/messages",
};

function mapLocalChatRow(row: Record<string, unknown>): Chat {
  return {
    status: String(row.status ?? ""),
    version: row.version as string | number,
    started_at: String(row.started_at ?? ""),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
    messages: (row.messages as Chat["messages"]) ?? [],
    chat_id: String(row.chat_id ?? ""),
    agent_id: String(row.agent_id ?? ""),
    score: row.score != null ? Number(row.score) : null,
  };
}

export async function listChats(
  status?: string,
  page: string = '1',
  page_size: string = '10'
): Promise<ChatListResponse> {
  if (isLocalBackend()) {
    const response = await client.get("/chat/list", {
      params: {
        status: status || undefined,
        page: parseInt(page, 10),
        limit: parseInt(page_size, 10),
      },
    });
    const raw = response.data?.data ?? response.data?.DATA ?? [];
    const rows = Array.isArray(raw) ? raw : [];
    const mapped: Chat[] = rows.map((r: Record<string, unknown>) => mapLocalChatRow(r));
    const total = response.data?.total ?? response.data?.TOTAL ?? mapped.length;
    const lim = response.data?.limit ?? response.data?.LIMIT ?? parseInt(page_size, 10);
    const pg = response.data?.page ?? response.data?.PAGE ?? parseInt(page, 10);
    return {
      data: mapped,
      total: typeof total === "number" ? total : mapped.length,
      page: pg,
      limit: lim,
    };
  }

  try {
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    
    let url = `${api.chats}?order=created_at.desc&limit=${page_size}&offset=${offset}`;
    
    if (status) {
      url += `&status=eq.${status}`;
    }

    const response = await client.get(url);
    
    const totalFromRange = response.headers["content-range"]?.split("/")[1];
    const total = totalFromRange ? parseInt(totalFromRange, 10) : response.data.length;

    return {
      data: response.data,
      total,
      page: parseInt(page, 10),
      limit: parseInt(page_size, 10),
    };
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

export async function getChatDetail(chatId: string, version?: string): Promise<ChatDetailsResponse> {
  if (isLocalBackend()) {
    const response = await client.get("/chat/list", {
      params: { page: 1, limit: 500 },
    });
    const raw = response.data?.data ?? response.data?.DATA ?? [];
    const rows = Array.isArray(raw) ? raw : [];
    const row = rows.find(
      (r: Record<string, unknown>) => String(r.chat_id) === chatId
    );
    if (!row) {
      return { chat_id: chatId, messages: [] };
    }
    return {
      chat_id: chatId,
      messages: (row.messages as ChatDetailsResponse["messages"]) ?? [],
    };
  }

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
  if (isLocalBackend()) {
    const response = await client.put(`/chat/status/${encodeURIComponent(data.chat_id)}`, {
      chat_id: data.chat_id,
      status: data.status,
    });
    return {
      message: response.data?.message ?? "Chat status updated successfully",
      chat_id: response.data?.chat_id ?? data.chat_id,
    };
  }

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
