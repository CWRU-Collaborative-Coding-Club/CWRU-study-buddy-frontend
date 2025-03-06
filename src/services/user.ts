import { list } from "postcss";
import client from "../lib/http/request";
import { 
  SignUpRequest, 
  SignInRequest, 
  AddUserRequest, 
  UpdateAccessLevelRequest,
  DeleteUserRequest,
  AuthResponse,
  User
} from "../models/user";

// API paths
const path = "user";

const api = {
  signUp: `/${path}/signup`,
  signIn: `/${path}/signin`,
  addUser: `/${path}/allowed-users`,
  deleteUser: `/${path}`, // Will append user_id in function
  updateAccessLevel: `/${path}/set-access-level`,
  listUsers: `/${path}/list`,
  listAllowedUsers: `/${path}/allowed-users`,
  updateAllowedAccessLevel: `/${path}/allowed-users/access-level`,
};

export function signUp(data: SignUpRequest): Promise<AuthResponse> {
  return client<AuthResponse>({
    url: api.signUp,
    method: "post",
    data,
  }).then((response: { data: AuthResponse }) => response.data);
}

export function signIn(data: SignInRequest): Promise<AuthResponse> {
  return client({
    url: api.signIn,
    method: "post",
    data,
  }).then((response: { data: AuthResponse }) => response.data);
}

export function addUser(data: AddUserRequest): Promise<{message: string}> {
  return client({
    url: api.addUser,
    method: "post",
    data,
  }).then((response: { data: { message: string } }) => response.data);
}

export function deleteUsers(data: DeleteUserRequest): Promise<{message: string}> {
  return client({
    url: `${api.deleteUser}/${data.user_id}`,
    method: "delete",
  }).then((response: { data: { message: string } }) => response.data);
}

export function updateAccessLevel(data: UpdateAccessLevelRequest): Promise<{message: string}> {
  return client({
    url: api.updateAccessLevel,
    method: "post",
    data,
  }).then((response: { data: { message: string } }) => response.data);
}

export function listUsers(
  filterType: string = "all", 
  search: string = "", 
  page: number = 1, 
  pageSize: number = 10
): Promise<User[]> {
  return client({
    url: api.listUsers,
    method: "get",
    params: { filter_type: filterType, search, page, page_size: pageSize }
  }).then((response: { data: User[] }) => response.data);
}

export function listAllowedUsers(
  search: string = "", 
  page: number = 1, 
  pageSize: number = 50
): Promise<{
  allowed_users: Array<{
    email: string;
    access_level: number;
    created_at?: string;
    created_by?: string;
  }>;
  page: number;
  page_size: number;
  total_count: number;
}> {
  return client({
    url: api.listAllowedUsers,
    method: "get",
    params: { search, page, page_size: pageSize }
  }).then((response) => response.data);
}

export async function listAllPendingUsers(search: string = ""): Promise<any[]> {
  // Start with page 1
  let page = 1;
  const pageSize = 50; // Request larger page size
  let allUsers: any[] = [];
  let hasMoreData = true;
  
  // Fetch all pages
  while (hasMoreData) {
    const response = await listAllowedUsers(search, page, pageSize);
    
    if (response.allowed_users && response.allowed_users.length > 0) {
      allUsers = [...allUsers, ...response.allowed_users];
      
      // If we got fewer users than the page size, we're done
      if (response.allowed_users.length < pageSize) {
        hasMoreData = false;
      } else {
        page++; // Move to next page
      }
    } else {
      hasMoreData = false;
    }
  }
  return allUsers;
}

export function deleteAllowedUser(email: string): Promise<{message: string}> {
  return client({
    url: `${api.addUser}/${encodeURIComponent(email)}`,
    method: "delete",
  }).then((response: { data: { message: string } }) => response.data);
}

export function updateAllowedUserAccessLevel(payload: {
  email: string;
  new_access_level: number;
}): Promise<{ message: string }> {
  return client({
    url: api.updateAllowedAccessLevel,
    method: "put",
    data: {
      email: payload.email,
      new_access_level: payload.new_access_level
    },
  }).then((response) => response.data);
}