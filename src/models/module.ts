export interface Module {
  id: string;
  title: string;
  system_prompt: string;
}

export interface CreateModuleRequest {
  title: string;
  system_prompt: string;
}

export interface EditModuleRequest {
  title?: string;
  system_prompt?: string;
}