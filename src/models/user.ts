export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  access_level: number;
  isDeleted?: Date | null;
  workspace_id: number;
}

export interface DecodedToken {
  user_id: string;
  access_level: number;
  exp: number;
}

export interface UpdateAccessLevelRequest {
  email: string;
  new_access_level: number;
}

export interface DeleteUserRequest {
  user_id: string;
}

export interface AddUserRequest {
  emails: string;
  access_level: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
}

export interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  access_level: number;
  user_id: string;
  avatar_url?: string;
}