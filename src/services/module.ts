import { create } from "domain";
import client from "../lib/http/request";
import {
  Module,
  CreateModuleRequest,
  EditModuleRequest,
  CreateChatRequest,
  ResourceListResponse,
  ModuleResource,
} from "../models/module";

const prefix = "module";

const api = {
  listApi: `/${prefix}/list`,
  createApi: `/${prefix}/create`,
  createChatApi: `/chat/create`,
  deleteApi: (moduleId: string) => `/${prefix}/${moduleId}`,
  editApi: (moduleId: string) => `/${prefix}/${moduleId}`,
  titleApi: (moduleId: string) => `/${prefix}/${moduleId}/title`,
  pdfApi: (moduleId: string) => `/${prefix}/${moduleId}/pdf`,
  deleteResourceApi: (moduleId: string, resourceId: string) => `/${prefix}/${moduleId}/resource/${resourceId}`,
  resourcesApi: (moduleId: string) => `/${prefix}/${moduleId}/resources`,
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
    const params: any = {
      filter_deleted: filterDeleted,
    };

    // Only add pagination params if they're valid numbers
    if (typeof page === "number" && !isNaN(page)) {
      params.page = page;
    }

    if (typeof pageSize === "number" && !isNaN(pageSize)) {
      params.page_size = pageSize;
    }

    // Add search param if it exists
    if (search) {
      params.search = search;
    }

    const response = await client({
      url: api.listApi,
      method: "GET",
      params: params,
    });

    console.log("API response data:", response.data);

    // Handle case where response might not have expected structure
    const result = response.data || {};

    // Ensure modules is always an array
    if (!result.modules) {
      result.modules = [];
    }

    // Ensure total is a number for pagination
    if (typeof result.total !== "number") {
      // Try to get total from total_count or fall back to modules length
      result.total = result.total_count || result.modules.length || 0;
    }

    return result;
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
  const formData = new FormData();
  
  // Append module data directly to formData
  formData.append('title', data.title);
  formData.append('system_prompt', data.system_prompt);
  if (data.criteria) {
    formData.append('criteria', JSON.stringify(data.criteria));
  }
  
  // Append PDF file if provided
  if (pdfFile) {
    formData.append('pdf_file', pdfFile);
  }
  
  const response = await client({
    url: api.createApi,
    method: "POST",
    data: formData
  });

  return response.data;
}

// Delete a module
export async function deleteModule(moduleId: string): Promise<any> {
  try {
    const response = await client({
      url: api.deleteApi(moduleId),
      method: "DELETE",
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
}

// Create a new module
export async function createChatAPI(data: CreateChatRequest): Promise<Module> {
  const response = await client({
    url: api.createChatApi,
    method: "post",
    data,
  });

  return response.data;
}

// Edit an existing module
export async function editModule(
  moduleId: string,
  data: EditModuleRequest,
  pdfFile?: File
): Promise<Module> {
  try {
    const formData = new FormData();
    
    // Append module data directly to formData
    if (data.title) formData.append('title', data.title);
    if (data.system_prompt) formData.append('system_prompt', data.system_prompt);
    if (data.criteria) formData.append('criteria', JSON.stringify(data.criteria));
    if (data.keep_existing_pdf !== undefined) {
      formData.append('keep_existing_pdf', String(data.keep_existing_pdf));
    }
    
    // Append PDF file if provided
    if (pdfFile) {
      formData.append('pdf_file', pdfFile);
    }
    
    const response = await client({
      url: api.editApi(moduleId),
      method: "PUT",
      data: formData
    });
    return response.data;
  } catch (error) {
    console.error("Error editing module:", error);
    throw error;
  }
}

export async function getModuleTitle(moduleId: string): Promise<string> {
  try {
    const response = await client({
      url: api.titleApi(moduleId),
      method: "GET"
    });
    return response.data.title;
  } catch (error) {
    console.error(`Error fetching title for module ${moduleId}:`, error);
    return moduleId; // Fallback to showing the ID if we can't get the title
  }
}

// Upload PDF file for a module
export async function uploadModulePdf(moduleId: string, pdfFile: File): Promise<{ message: string }> {
  // Create FormData to handle file upload
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  
  try {
    console.log(`Uploading PDF to module ${moduleId}`);
    
    // Use the consistent endpoint format
    const response = await client({
      url: api.pdfApi(moduleId),
      method: "POST",
      data: formData
    });
    
    return response.data;
  } catch (error) {
    console.error("Error uploading PDF for module:", error);
    throw error;
  }
}

// Delete a resource from a module
export async function deleteModuleResource(moduleId: string, resourceId: string): Promise<{ message: string }> {
  try {
    const response = await client({
      url: api.deleteResourceApi(moduleId, resourceId),
      method: "DELETE",
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting module resource:", error);
    throw error;
  }
}

// Get resources for a module
export async function getModuleResources(moduleId: string): Promise<ResourceListResponse> {
  try {
    const response = await client({
      url: api.resourcesApi(moduleId),
      method: "GET"
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching resources for module ${moduleId}:`, error);
    throw error;
  }
}