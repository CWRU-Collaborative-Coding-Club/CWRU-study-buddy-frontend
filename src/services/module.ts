import { isLocalBackend } from "../lib/http/apiConfig";
import client from "../lib/http/request";
import {
  CreateChatRequest,
  CreateModuleRequest,
  EditModuleRequest,
  Module,
  ResourceListResponse,
} from "../models/module";

const api = {
  modules: "/modules",
  resources: "/module_resources",
  chats: "/chats",
};

function normalizeModule(raw: Record<string, unknown>): Module {
  const criteriaRaw = raw.criteria;
  const criteria = Array.isArray(criteriaRaw)
    ? criteriaRaw
    : typeof criteriaRaw === "string"
      ? (criteriaRaw as string).split("#;$;#").filter(Boolean)
      : [];

  return {
    chat_id: "",
    criteria: criteria as never[],
    name: String(raw.name ?? ""),
    agent_id: String(raw.agent_id ?? raw.id ?? ""),
    modified_by: String(raw.modified_by ?? ""),
    system_prompt: String(raw.system_prompt ?? ""),
    CREATED_BY: String(raw.created_by ?? raw.CREATED_BY ?? ""),
    CREATED_AT: String(raw.created_at ?? raw.CREATED_AT ?? ""),
    isDeleted: raw.isDeleted != null ? Boolean(raw.isDeleted) : null,
    modified_at: String(raw.modified_at ?? ""),
    has_pdf: Array.isArray(raw.resources) && (raw.resources as unknown[]).length > 0,
    resources: undefined,
  };
}

async function fetchModuleRowForUpload(agentId: string): Promise<Record<string, unknown>> {
  const res = await client.get("/module/list", {
    params: { filter_deleted: false, page: 1, page_size: 500 },
  });
  const modules = res.data?.modules ?? [];
  const found = modules.find(
    (m: { agent_id?: string; id?: string }) =>
      m.agent_id === agentId || m.id === agentId
  );
  if (!found) {
    throw new Error(`Module ${agentId} not found for upload`);
  }
  return found;
}

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
  if (isLocalBackend()) {
    const response = await client.get("/module/list", {
      params: {
        filter_deleted: filterDeleted,
        page,
        page_size: pageSize,
        search: search || undefined,
      },
    });
    const rawList = response.data?.modules ?? [];
    const total_count = response.data?.total_count ?? rawList.length;
    return {
      modules: rawList.map((m: Record<string, unknown>) => normalizeModule(m)),
      page: response.data?.page ?? page,
      page_size: response.data?.page_size ?? pageSize,
      total: total_count,
      total_count,
    };
  }

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
    const contentRange = response.headers["content-range"];
    const total = contentRange
      ? parseInt(contentRange.split("/")[1], 10)
      : response.data.length;

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

export async function createModule(
  data: CreateModuleRequest,
  pdfFile?: File
): Promise<CreateModuleReturn> {
  if (isLocalBackend()) {
    const crit = data.criteria?.filter((c) => c.trim()) ?? [];
    if (!crit.length) {
      throw new Error("At least one criterion is required.");
    }
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("system_prompt", data.system_prompt);
    crit.forEach((c) => formData.append("criteria", c));
    if (pdfFile) {
      formData.append("pdf_file", pdfFile);
    }
    const response = await client.post("/module/create", formData);
    const mod = response.data?.module;
    return {
      message: response.data?.message ?? "Module created successfully",
      module: mod ? normalizeModule(mod as Record<string, unknown>) : normalizeModule({}),
    };
  }

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

export async function deleteModule(moduleId: string): Promise<{ message: string }> {
  if (isLocalBackend()) {
    const { data } = await client.delete(`/module/${encodeURIComponent(moduleId)}`);
    return data;
  }
  try {
    await client.patch(`${api.modules}?id=eq.${moduleId}`, { is_deleted: true });
    return { message: "Module deleted successfully" };
  } catch (error) {
    console.error("Error deleting module:", error);
    throw error;
  }
}

export async function createChatAPI(
  data: CreateChatRequest
): Promise<{ chat_id: string }> {
  if (isLocalBackend()) {
    const { data: res } = await client.post("/chat/create", {
      agent_id: data.agent_id,
    });
    return { chat_id: res.chat_id };
  }
  try {
    const response = await client.post(api.chats, data);
    return response.data?.[0] || data;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

export async function editModule(
  moduleId: string,
  data: EditModuleRequest,
  pdfFile?: File
): Promise<Module> {
  if (isLocalBackend()) {
    const crit = data.criteria?.filter((c) => c.trim()) ?? [];
    if (!crit.length) {
      throw new Error("At least one criterion is required for this module.");
    }
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.system_prompt) formData.append("system_prompt", data.system_prompt);
    crit.forEach((c) => formData.append("criteria", c));
    formData.append("keep_existing_pdf", String(data.keep_existing_pdf ?? false));
    if (pdfFile) {
      formData.append("pdf_file", pdfFile);
    }
    const response = await client.put(
      `/module/${encodeURIComponent(moduleId)}`,
      formData
    );
    const mod = response.data?.module;
    return mod ? normalizeModule(mod as Record<string, unknown>) : normalizeModule({});
  }

  try {
    const updateData: Record<string, unknown> = {};

    if (data.title) updateData.title = data.title;
    if (data.system_prompt) updateData.system_prompt = data.system_prompt;
    if (data.criteria) updateData.criteria = data.criteria;

    updateData.updated_at = new Date().toISOString();

    const response = await client.patch(
      `${api.modules}?id=eq.${moduleId}`,
      updateData
    );

    if (pdfFile) {
      await uploadModulePdf(moduleId, pdfFile);
    }

    return (response.data?.[0] ?? updateData) as unknown as Module;
  } catch (error) {
    console.error("Error editing module:", error);
    throw error;
  }
}

export async function getModuleTitle(moduleId: string): Promise<string> {
  if (isLocalBackend()) {
    const { data } = await client.get(`/module/${encodeURIComponent(moduleId)}/title`);
    return data?.title || moduleId;
  }
  try {
    const response = await client.get(`${api.modules}?id=eq.${moduleId}&select=title`);
    return response.data?.[0]?.title || moduleId;
  } catch (error) {
    console.error(`Error fetching title for module ${moduleId}:`, error);
    return moduleId;
  }
}

export async function uploadModulePdf(
  moduleId: string,
  pdfFile: File
): Promise<{ message: string }> {
  if (isLocalBackend()) {
    const mod = await fetchModuleRowForUpload(moduleId);
    const criteriaStr = mod.criteria as string | string[] | undefined;
    const criteriaList = Array.isArray(criteriaStr)
      ? criteriaStr
      : typeof criteriaStr === "string"
        ? criteriaStr.split("#;$;#").filter(Boolean)
        : [];
    if (!criteriaList.length) {
      throw new Error("Cannot upload PDF: module has no criteria.");
    }
    await editModule(
      moduleId,
      {
        title: String(mod.name ?? ""),
        system_prompt: String(mod.system_prompt ?? ""),
        criteria: criteriaList,
        keep_existing_pdf: true,
      },
      pdfFile
    );
    return { message: "PDF uploaded successfully" };
  }

  try {
    const formData = new FormData();
    formData.append("pdf_file", pdfFile);

    const response = await client.post(`/modules/${moduleId}/pdf`, formData);

    return response.data || { message: "PDF uploaded successfully" };
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
}

export async function deleteModuleResource(
  moduleId: string,
  resourceId: string
): Promise<{ message: string }> {
  if (isLocalBackend()) {
    const { data } = await client.delete(
      `/module/${encodeURIComponent(moduleId)}/resource/${encodeURIComponent(resourceId)}`
    );
    return data;
  }
  try {
    await client.delete(
      `${api.resources}?id=eq.${resourceId}&module_id=eq.${moduleId}`
    );
    return { message: "Resource deleted successfully" };
  } catch (error) {
    console.error("Error deleting module resource:", error);
    throw error;
  }
}

export async function getModuleResources(moduleId: string): Promise<ResourceListResponse> {
  if (isLocalBackend()) {
    const { data } = await client.get(
      `/module/${encodeURIComponent(moduleId)}/resources`
    );
    return {
      resources: data?.resources ?? [],
      module_id: data?.module_id ?? moduleId,
      count: data?.count ?? 0,
    };
  }
  try {
    const response = await client.get(
      `${api.resources}?module_id=eq.${moduleId}&order=created_at.asc`
    );
    const list = response.data || [];
    return {
      resources: list,
      module_id: moduleId,
      count: list.length,
    };
  } catch (error) {
    console.error(`Error fetching resources for module ${moduleId}:`, error);
    throw error;
  }
}
