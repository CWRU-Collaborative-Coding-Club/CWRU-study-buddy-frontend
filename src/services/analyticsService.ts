import client from "@/lib/http/request";

const api = {
  analytics: "/analytics",
};

export async function analyticsService(): Promise<any> {
  try {
    // FastAPI route is GET /{dev|prod}/analytics (no trailing slash).
    const response = await client.get(api.analytics);
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics details:", error);
    throw error;
  }
}