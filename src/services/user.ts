import { supabase } from "../lib/http/firebase";
import { isLocalBackend } from "../lib/http/apiConfig";
import client from "../lib/http/request";
import {
  AddUserRequest,
  AuthResponse,
  DeleteUserRequest,
  SignInRequest,
  SignUpRequest,
  UpdateAccessLevelRequest,
  User,
  UserProfile,
} from "../models/user";

// Supabase REST API paths (PostgREST)
const api = {
  users: "/users",
  allowedUsers: "/allowed_users",
};

// Authentication
export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  if (isLocalBackend()) {
    const { data: res } = await client.post<AuthResponse>("/user/signup", {
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
    });
    return res;
  }

  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.email.split("@")[0],
        },
      },
    });

    if (error) throw error;

    const token = authData.session?.access_token || "";

    if (authData.user?.id) {
      await client.post(api.users, {
        id: authData.user.id,
        email: data.email,
        access_level: 1,
      });
    }

    return {
      message: "Sign up successful",
      token,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
}

export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  if (isLocalBackend()) {
    const { data: res } = await client.post<AuthResponse>("/user/signin", {
      email: data.email,
      password: data.password,
    });
    return res;
  }

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    const token = authData.session?.access_token || "";

    await client.get(`${api.users}?id=eq.${authData.user?.id}`);

    return {
      message: "Sign in successful",
      token,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

export function addUser(data: AddUserRequest): Promise<{ message: string }> {
  if (isLocalBackend()) {
    return client
      .post<{ message: string }>("/user/allowed-users", {
        emails: data.emails,
        access_level: data.access_level ?? 1,
      })
      .then((response) => response.data);
  }
  return client
    .post(api.allowedUsers, {
      emails: data.emails,
      access_level: data.access_level || 1,
    })
    .then((response: { data: { message: string } }) => response.data);
}

export function deleteUsers(data: DeleteUserRequest): Promise<{ message: string }> {
  if (isLocalBackend()) {
    return client
      .delete<{ message: string }>(`/user/${encodeURIComponent(data.user_id)}`)
      .then((response) => response.data);
  }
  return client
    .delete(`${api.users}?id=eq.${data.user_id}`)
    .then((response: { data: { message: string } }) => response.data);
}

export function updateAccessLevel(
  data: UpdateAccessLevelRequest
): Promise<{ message: string }> {
  if (isLocalBackend()) {
    return client
      .post<{ message: string }>("/user/set-access-level", {
        email: data.email,
        new_access_level: data.new_access_level,
      })
      .then((response) => response.data);
  }
  return client
    .patch(`${api.users}?email=eq.${encodeURIComponent(data.email)}`, {
      access_level: data.new_access_level,
    })
    .then((response: { data: { message: string } }) => response.data);
}

export function listUsers(
  filterType: string = "all",
  search: string = "",
  page: number = 1,
  pageSize: number = 25
): Promise<User[]> {
  if (isLocalBackend()) {
    return client
      .get<Record<string, unknown>[]>("/user/list", {
        params: {
          filter_type: filterType,
          search,
          page,
          page_size: pageSize,
        },
      })
      .then((response) =>
        (response.data || []).map((row) => ({
          user_id: String(row.user_id ?? ""),
          first_name: String(row.first_name ?? ""),
          last_name: String(row.last_name ?? ""),
          email: String(row.email ?? ""),
          access_level: Number(row.access_level ?? 0),
          workspace_id: Number(row.workspace_id ?? 0),
          isDeleted: row.isDeleted != null ? (row.isDeleted as Date | null) : null,
        }))
      );
  }

  const offset = (page - 1) * pageSize;
  let url = `${api.users}?order=created_at.desc&limit=${pageSize}&offset=${offset}`;

  if (search) {
    url += `&or=(email.ilike.%${search}%,display_name.ilike.%${search}%)`;
  }

  return client.get(url).then((response: { data: User[] }) => response.data);
}

export function listAllowedUsers(
  search: string = "",
  page: number = 1,
  pageSize: number = 25
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
  if (isLocalBackend()) {
    return client
      .get("/user/allowed-users", {
        params: { search, page, page_size: pageSize },
      })
      .then((response) => ({
        allowed_users: response.data.allowed_users || [],
        page: response.data.page ?? page,
        page_size: response.data.page_size ?? pageSize,
        total_count: response.data.total_count ?? 0,
      }));
  }

  const offset = (page - 1) * pageSize;
  let url = `${api.allowedUsers}?order=created_at.desc&limit=${pageSize}&offset=${offset}`;

  if (search) {
    url += `&or=(email.ilike.%${search}%)`;
  }

  return client.get(url).then((response: { data: any[] }) => ({
    allowed_users: response.data || [],
    page,
    page_size: pageSize,
    total_count: response.data?.length || 0,
  }));
}

export async function listAllPendingUsers(search: string = ""): Promise<any[]> {
  let page = 1;
  const pageSize = 25;
  let allUsers: any[] = [];
  let hasMoreData = true;

  while (hasMoreData) {
    const response = await listAllowedUsers(search, page, pageSize);

    if (response.allowed_users && response.allowed_users.length > 0) {
      allUsers = [...allUsers, ...response.allowed_users];

      if (response.allowed_users.length < pageSize) {
        hasMoreData = false;
      } else {
        page++;
      }
    } else {
      hasMoreData = false;
    }
  }
  return allUsers;
}

export function deleteAllowedUser(email: string): Promise<{ message: string }> {
  if (isLocalBackend()) {
    return client
      .delete<{ message: string }>(
        `/user/allowed-users/${encodeURIComponent(email)}`
      )
      .then((r) => r.data);
  }
  return client
    .delete(`${api.allowedUsers}?email=eq.${encodeURIComponent(email)}`)
    .then(() => ({ message: "User deleted successfully" }));
}

export function updateAllowedUserAccessLevel(payload: {
  email: string;
  new_access_level: number;
}): Promise<{ message: string }> {
  if (isLocalBackend()) {
    return client
      .put<{ message: string }>("/user/allowed-users/access-level", {
        email: payload.email,
        new_access_level: payload.new_access_level,
      })
      .then((r) => r.data);
  }
  return client
    .patch(
      `${api.allowedUsers}?email=eq.${encodeURIComponent(payload.email)}`,
      { access_level: payload.new_access_level }
    )
    .then(() => ({ message: "Access level updated successfully" }));
}

export async function getMe(): Promise<UserProfile> {
  if (isLocalBackend()) {
    const { data } = await client.get<{
      email: string;
      first_name: string;
      last_name: string;
      access_level: number;
      user_id: string;
    }>("/user/me");
    return {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      access_level: data.access_level,
      user_id: data.user_id,
    };
  }

  try {
    const { data: authUser } = await supabase.auth.getUser();

    if (!authUser.user?.id) {
      throw new Error("User not authenticated");
    }

    const { data: userData } = await client.get(
      `${api.users}?id=eq.${authUser.user.id}`
    );

    const user = userData?.[0];
    if (!user) {
      throw new Error("User profile not found");
    }

    return {
      user_id: user.id ?? user.user_id,
      email: user.email,
      access_level: user.access_level,
      first_name: user.first_name ?? user.display_name ?? "",
      last_name: user.last_name ?? "",
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
}
