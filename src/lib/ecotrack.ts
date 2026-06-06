import { db } from "@/lib/db";

const ECOTRACK_BASE_URL = "https://fret.ecotrack.dz";
const DEFAULT_TOKEN = "f3T3yfdoMYkdm3s2608MNEo6IMc5W8TDY0899d7hZqyaTXWP4YcCtr4ZcypY";

interface EcotrackConfig {
  apiUrl: string;
  apiToken: string;
}

/**
 * Get Ecotrack configuration from DB, fall back to defaults
 */
async function getConfig(): Promise<EcotrackConfig> {
  try {
    const settings = await db.ecotrackSettings.findFirst();
    if (settings && settings.active) {
      return {
        apiUrl: settings.apiUrl,
        apiToken: settings.apiToken,
      };
    }
  } catch {
    // DB might not be available yet
  }
  return {
    apiUrl: ECOTRACK_BASE_URL,
    apiToken: DEFAULT_TOKEN,
  };
}

/**
 * Make an authenticated request to the Ecotrack API
 */
async function ecotrackFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = await getConfig();
  const url = `${config.apiUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get list of all wilayas from Ecotrack
 */
export async function getWilayas() {
  try {
    const response = await ecotrackFetch("/api/wilayas");
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching wilayas from Ecotrack:", error);
    throw error;
  }
}

/**
 * Get communes for a specific wilaya
 */
export async function getCommunes(wilayaId: number) {
  try {
    const response = await ecotrackFetch(`/api/communes/${wilayaId}`);
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching communes for wilaya ${wilayaId}:`, error);
    throw error;
  }
}

/**
 * Calculate shipping cost for a wilaya
 */
export async function calculateShipping(wilayaId: number) {
  try {
    const response = await ecotrackFetch(`/api/shipping/${wilayaId}`);
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error calculating shipping for wilaya ${wilayaId}:`, error);
    throw error;
  }
}

/**
 * Create a shipping order in Ecotrack
 */
export async function createOrder(orderData: {
  nom: string;
  telephone: string;
  wilaya_id: number;
  commune_id: number;
  adresse: string;
  prix: number;
  produit: string;
  type?: string;
}) {
  try {
    const response = await ecotrackFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        ...orderData,
        type: orderData.type || "livraison",
      }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Ecotrack API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating Ecotrack order:", error);
    throw error;
  }
}

/**
 * Track a shipment by tracking number
 */
export async function trackOrder(trackingNumber: string) {
  try {
    const response = await ecotrackFetch(`/api/track/${trackingNumber}`);
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error tracking order ${trackingNumber}:`, error);
    throw error;
  }
}
