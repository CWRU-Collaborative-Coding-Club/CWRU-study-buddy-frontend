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