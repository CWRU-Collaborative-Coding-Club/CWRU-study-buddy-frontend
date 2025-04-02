import { getCookie } from "@/utils/cookies";
import client from "../../lib/http/request";

///Api paths
const path = "chat";

const API_URL = `${path}`;

const api = {
  message: `${API_URL}/message`, // GET & POST
};

interface messages {
  role: string,
  content: string,
  on: Date,
}

interface getChatResponse {
  chat_id: string;
  messages: messages[];
}

async function getChats(
  agent_id: string,
): Promise<getChatResponse> {
  try {
    const response = await client({
      url: `${api.message}/${agent_id}`,
      method: "GET"
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function chat(
  chat_id: string,
  message: string,
): Promise<messages> {
  try {
    const response = await client({
      url: api.message,
      method: "POST",
      data: {
        chat_id,
        message,
      },
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

export type { getChatResponse, messages };
export { getChats, chat };