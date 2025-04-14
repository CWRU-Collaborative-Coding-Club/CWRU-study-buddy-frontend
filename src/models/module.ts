export interface Module {
  chat_id: string,
  criteria: never[];
  name: string;
  agent_id: string;
  modified_by: string;
  system_prompt: string;
  CREATED_BY: string;
  CREATED_AT: string;
  isDeleted: boolean | null;
  modified_at: string;
  has_pdf?: boolean;
  resources?: { id: string, name: string }[];
}

export interface CreateModuleRequest {
  title: string;
  system_prompt: string;
  criteria?: string[];
  pdf_file?: File,
}

export interface CreateChatRequest {
  agent_id?: string;
}

export interface EditModuleRequest {
  title?: string;
  system_prompt?: string;
  pdf_file?: File;
  criteria?: string[];
  keep_existing_pdf?: boolean;
}

export interface ModuleResource {
  resource_id: string;
  original_filename: string;
  file_url: string;
  upload_timestamp: string;
  file_size: number;
  processing_status: string;
  resource_type: string;
}

export interface ResourceListResponse {
  resources: ModuleResource[];
  module_id: string;
  count: number;
}