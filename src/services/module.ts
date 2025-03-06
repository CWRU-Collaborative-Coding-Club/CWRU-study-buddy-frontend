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
    const response = await client({
      url: api.listApi,
      method: "GET",
      params: {
        filter_deleted: filterDeleted,
        page,
        page_size: pageSize,
        search,
      },
    });
    return response.data;
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
