import { getCookie } from "@/utils/cookies";
import client from "../../lib/http/request";

///Api paths
const path = "chat";

const API_URL = `${path}`;

const api = {
  message: `${API_URL}/message`, // GET & POST
  pdf: `${API_URL}/pdf`, // GET & POST
};

interface Module {
  id: string;
  name: string;
  criteria: string[];
}

interface ExtendedChatResponse extends getChatResponse {
  module?: Module;
}

interface messages {
  role: string,
  content: string,
  on: Date,
}

interface getChatResponse {
  chat_id: string;
  messages: messages[];
}

interface getCriteriaResponse {
  chat_id: string;
  criteria: Record<string, boolean[]>;
}

interface PDF {
  id: string;
  title: string;
  url: string;
  fileSize: string;
  uploadDate: Date;
  moduleId: string;
}

//updat this to real one
interface pdfDocument {
  id: string;
  title: string;
  uploadDate: Date;
  fileSize: string;
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

async function getCriteria(
  agent_id: string,
): Promise<getChatResponse> {
  try {
    const response = await client({
      url: `${api.message}/${agent_id}?criteria=true`,
      method: "GET"
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

export async function getModuleTitle(moduleId: string): Promise<string> {
  try {
    const response = await client({
      url: `module/${moduleId}/title`,
      method: "GET"
    });
    return response.data.title;
  } catch (error) {
    console.error(`Error fetching title for module ${moduleId}:`, error);
    return moduleId; // Fallback to showing the ID if we can't get the title
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

async function download_pdf(
  module_id: string,
): Promise<void> {
  if (!module_id) {
    console.error("download_pdf: module_id is null or undefined.");
    throw new Error("Module ID is required to download the PDF.");
  }
  try {
    const response = await client({
      url: `${api.pdf}/${module_id}`,
      method: "GET",
      responseType: "blob", // Important for binary data
    });

    if (response.status !== 200) {
      console.error(`Error fetching PDF: Status code ${response.status}`, response);
      throw new Error(`Failed to download PDF. Server responded with status ${response.status}`);
    }

    // Create a blob from the response data
    const blob = new Blob([response.data], { type: "application/pdf" });

    // Create a link element, set the URL and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Optionally, set a default filename
    link.download = `module_${module_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error: any) {
    console.error("Error in download_pdf API call:", error);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Failed to download PDF'}`);
    } else if (error.request) {
      console.error('Error request:', error.request);
      throw new Error('Network error: No response received from server.');
    } else {
      console.error('Error message:', error.message);
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

// update it to match real one
async function getPDfDocuments(
  chat_id: string,
): Promise<pdfDocument[]> {
  try {
    const response = await client({
      url: `${api.message}/${chat_id}`,
      method: "GET",
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

export type { getChatResponse, messages, pdfDocument, ExtendedChatResponse, getCriteriaResponse };
export { getChats, chat, getPDfDocuments, download_pdf, getCriteria };