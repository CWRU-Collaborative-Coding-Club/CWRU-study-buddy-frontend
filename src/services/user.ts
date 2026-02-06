import { supabase } from "../lib/http/firebase";
import client from "../lib/http/request";
import {
    AddUserRequest,
    AuthResponse,
    DeleteUserRequest,
    SignInRequest,
    SignUpRequest,
    UpdateAccessLevelRequest,
    User,
    UserProfile
} from "../models/user";

// Supabase REST API paths
const api = {
  users: "/users",
  allowedUsers: "/allowed_users",
};

// Authentication using Supabase Auth
export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.email.split("@")[0], // Or use name if provided
        },
      },
    });

    if (error) throw error;

    // Get JWT token from session
    const token = authData.session?.access_token || "";
    
    // Create user profile in users table
    if (authData.user?.id) {
      await client.post(api.users, {
        id: authData.user.id,
        email: data.email,
        access_level: 1, // Default access level
      });
    }

    return {
      token,
      user: {
        user_id: authData.user?.id || "",
        email: data.email,
        access_level: 1,
      },
    };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
}

export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;

    const token = authData.session?.access_token || "";

    // Fetch user profile from users table
    const { data: userData, error: userError } = await client.get(
      `${api.users}?id=eq.${authData.user?.id}`
    );

    if (userError) throw userError;

    const user = userData?.[0] || { user_id: authData.user?.id };

    return {
      token,
      user: {
        user_id: user.user_id,
        email: data.email,
        access_level: user.access_level || 1,
      },
    };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

export function addUser(data: AddUserRequest): Promise<{ message: string }> {
  return client
    .post(api.allowedUsers, {
      email: data.email,
      access_level: data.access_level || 1,
    })
    .then((response: { data: { message: string } }) => response.data);
}

export function deleteUsers(data: DeleteUserRequest): Promise<{ message: string }> {
  return client
    .delete(`${api.users}?id=eq.${data.user_id}`)
    .then((response: { data: { message: string } }) => response.data);
}

export function updateAccessLevel(data: UpdateAccessLevelRequest): Promise<{ message: string }> {
  return client
    .patch(
      `${api.users}?id=eq.${data.user_id}`,
      { access_level: data.access_level }
    )
    .then((response: { data: { message: string } }) => response.data);
}

export function listUsers(
  filterType: string = "all", 
  search: string = "", 
  page: number = 1, 
  pageSize: number = 25
): Promise<User[]> {
  const offset = (page - 1) * pageSize;
  
  let url = `${api.users}?order=created_at.desc&limit=${pageSize}&offset=${offset}`;
  
  if (search) {
    url += `&or=(email.ilike.%${search}%,display_name.ilike.%${search}%)`;
  }

  return client
    .get(url)
    .then((response: { data: User[] }) => response.data);
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
  const offset = (page - 1) * pageSize;
  
  let url = `${api.allowedUsers}?order=created_at.desc&limit=${pageSize}&offset=${offset}`;
  
  if (search) {
    url += `&or=(email.ilike.%${search}%)`;
  }

  return client
    .get(url)
    .then((response: { data: any[] }) => ({
      allowed_users: response.data || [],
      page,
      page_size: pageSize,
      total_count: response.data?.length || 0,
    }));
}

export async function listAllPendingUsers(search: string = ""): Promise<any[]> {
  // Start with page 1
  let page = 1;
  const pageSize = 25; // Request larger page size
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
  return client
    .delete(`${api.allowedUsers}?email=eq.${encodeURIComponent(email)}`)
    .then(() => ({ message: "User deleted successfully" }));
}

export function updateAllowedUserAccessLevel(payload: {
  email: string;
  new_access_level: number;
}): Promise<{ message: string }> {
  return client
    .patch(
      `${api.allowedUsers}?email=eq.${encodeURIComponent(payload.email)}`,
      { access_level: payload.new_access_level }
    )
    .then(() => ({ message: "Access level updated successfully" }));
}

export async function getMe(): Promise<UserProfile> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser.user?.id) {
      throw new Error("User not authenticated");
    }

    // Fetch user profile from users table
    const { data: userData, error } = await client.get(
      `${api.users}?id=eq.${authUser.user.id}`
    );

    if (error) throw error;

    const user = userData?.[0];
    if (!user) {
      throw new Error("User profile not found");
    }

    return {
      user_id: user.id,
      email: user.email,
      access_level: user.access_level,
      display_name: user.display_name,
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
}