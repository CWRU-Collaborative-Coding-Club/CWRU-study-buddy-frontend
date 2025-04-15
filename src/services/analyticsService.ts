import client from "@/lib/http/request";

// API paths
const path = "analytics";

export async function analyticsService(): Promise<any> {
    try {
        const response = await client({
            url: `${path}/`,
            method: "GET"
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching analytics details:", error);
        throw error;
    }
}