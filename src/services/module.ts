import { create } from "domain";
import client from "../lib/http/request";
import {
  Module,
  CreateModuleRequest,
  EditModuleRequest,
} from "../models/module";

const prefix = "/module";

const api = {
  listApi: `${prefix}/list`,
  createApi: `${prefix}/create`,
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

// Create a new module
export async function createModule(data: CreateModuleRequest): Promise<Module> {
  const response = await client({
    url: api.createApi,
    method: "post",
    data,
  });

  return response.data;
}

// Delete a module
export async function deleteModule(moduleId: string): Promise<any> {
  const deleteUrl = `${prefix}/${moduleId}`;

  try {
    const response = await client({
      url: deleteUrl,
      method: "DELETE",
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
}

// Edit an existing module
export async function editModule(
  moduleId: string,
  data: EditModuleRequest
): Promise<Module> {
  const editURL = `${prefix}/${moduleId}`;

  try {
    const response = await client({
      url: editURL,
      method: "PUT",
      data,
    });
    return response.data;
  } catch (error) {
    console.error("Error editing module:", error);
    throw error;
  }
}
