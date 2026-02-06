import client from "@/lib/http/request";

// Supabase REST API paths
const api = {
  analytics: "/analytics",
};

export async function analyticsService(): Promise<any> {
  try {
    const response = await client.get(api.analytics);
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics details:", error);
    throw error;
  }
}