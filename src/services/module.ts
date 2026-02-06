import client from "../lib/http/request";
import {
    CreateChatRequest,
    CreateModuleRequest,
    EditModuleRequest,
    Module,
    ResourceListResponse
} from "../models/module";

// Supabase REST API paths
const api = {
  modules: "/modules",
  resources: "/module_resources",
  chats: "/chats",
};

// Get modules with pagination and filtering
export async function getModules(
  filterDeleted: boolean = false,
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<{
  modules: Module[];
  page: number;
  page_size: number;
  total: number;
  total_count: number;
}> {
  try {
    const offset = (page - 1) * pageSize;
    let url = `${api.modules}?order=created_at.desc&limit=${pageSize}&offset=${offset}`;
    
    if (!filterDeleted) {
      url += "&is_deleted=eq.false";
    }
    
    if (search) {
      url += `&or=(title.ilike.%${search}%,description.ilike.%${search}%)`;
    }

    const response = await client.get(url);
    const contentRange = response.headers['content-range'];
    const total = contentRange ? parseInt(contentRange.split('/')[1]) : response.data.length;

    return {
      modules: response.data || [],
      page,
      page_size: pageSize,
      total,
      total_count: total,
    };
  } catch (error) {
    console.error("Error fetching modules:", error);
    throw error;
  }
}

interface CreateModuleReturn {
  message: string;
  module: Module;
}

// Create a new module
export async function createModule(data: CreateModuleRequest, pdfFile?: File): Promise<CreateModuleReturn> {
  try {
    const moduleData = {
      title: data.title,
      system_prompt: data.system_prompt,
      criteria: data.criteria || null,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };

    const response = await client.post(api.modules, moduleData);
    const moduleId = response.data?.[0]?.id;

    // Upload PDF if provided
    if (pdfFile && moduleId) {
      await uploadModulePdf(moduleId, pdfFile);
    }

    return {
      message: "Module created successfully",
      module: response.data?.[0] || { id: moduleId, ...moduleData },
    };
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
}

// Delete a module
export async function deleteModule(moduleId: string): Promise<any> {
  try {
    const response = await client.patch(
      `${api.modules}?id=eq.${moduleId}`,
      { is_deleted: true }
    );
    return { message: "Module deleted successfully" };
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
}

// Create a new chat
export async function createChatAPI(data: CreateChatRequest): Promise<Module> {
  try {
    const response = await client.post(api.chats, data);
    return response.data?.[0] || data;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

// Edit an existing module
export async function editModule(
  moduleId: string,
  data: EditModuleRequest,
  pdfFile?: File
): Promise<Module> {
  try {
    const updateData: any = {};
    
    if (data.title) updateData.title = data.title;
    if (data.system_prompt) updateData.system_prompt = data.system_prompt;
    if (data.criteria) updateData.criteria = data.criteria;
    
    updateData.updated_at = new Date().toISOString();

    const response = await client.patch(
      `${api.modules}?id=eq.${moduleId}`,
      updateData
    );

    // Upload PDF if provided
    if (pdfFile) {
      await uploadModulePdf(moduleId, pdfFile);
    }

    return response.data?.[0] || updateData;
  } catch (error) {
    console.error("Error editing module:", error);
    throw error;
  }
}

export async function getModuleTitle(moduleId: string): Promise<string> {
  try {
    const response = await client.get(`${api.modules}?id=eq.${moduleId}&select=title`);
    return response.data?.[0]?.title || moduleId;
  } catch (error) {
    console.error(`Error fetching title for module ${moduleId}:`, error);
    return moduleId;
  }
}

// Upload PDF file for a module (stores as blob in storage)
export async function uploadModulePdf(moduleId: string, pdfFile: File): Promise<{ message: string }> {
  try {
    console.log(`Uploading PDF for module ${moduleId}`);
    
    // For Supabase Storage (if using), initialize the storage client
    // For now, if storing as binary in database:
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    
    // If your backend has a specific PDF upload endpoint
    const response = await client.post(
      `/modules/${moduleId}/pdf`,
      formData
    );
    
    return response.data || { message: "PDF uploaded successfully" };
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
}

// Delete a resource from a module
export async function deleteModuleResource(moduleId: string, resourceId: string): Promise<{ message: string }> {
  try {
    const response = await client.delete(
      `${api.resources}?id=eq.${resourceId}&module_id=eq.${moduleId}`
    );
    return { message: "Resource deleted successfully" };
  } catch (error) {
    console.error("Error deleting module resource:", error);
    throw error;
  }
}

// Get resources for a module
export async function getModuleResources(moduleId: string): Promise<ResourceListResponse> {
  try {
    const response = await client.get(
      `${api.resources}?module_id=eq.${moduleId}&order=created_at.asc`
    );
    return {
      resources: response.data || [],
      total: response.data?.length || 0,
    };
  } catch (error) {
    console.error(`Error fetching resources for module ${moduleId}:`, error);
    throw error;
  }
}