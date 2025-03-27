export interface Module {
  chat_id: Module;
  name: string;
  agent_id: string;
  modified_by: string;
  system_prompt: string;
  CREATED_BY: string;
  CREATED_AT: string;
  isDeleted: boolean | null;
  modified_at: string;
}

export interface CreateModuleRequest {
  title: string;
  system_prompt: string;
}

export interface CreateChatRequest {
  agent_id?: string;
}

export interface EditModuleRequest {
  title?: string;
  system_prompt?: string;
}