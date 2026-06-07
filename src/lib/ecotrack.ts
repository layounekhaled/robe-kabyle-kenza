import { db } from "@/lib/db";

const ECOTRACK_BASE_URL = "https://fret.ecotrack.dz";
const DEFAULT_TOKEN = "f3T3yfdoMYkdm3s2608MNEo6IMc5W8TDY0899d7hZqyaTXWP4YcCtr4ZcypY";

interface EcotrackConfig {
  apiUrl: string;
  apiToken: string;
}

// Default shipping prices by wilaya code (Algerian delivery standard rates)
// These are used as fallback when the Ecotrack API is unavailable
const DEFAULT_SHIPPING_RATES: Record<number, { home: number; stopDesk: number }> = {
  1: { home: 400, stopDesk: 300 },   // Adrar
  2: { home: 700, stopDesk: 500 },   // Chlef
  3: { home: 700, stopDesk: 500 },   // Laghouat
  4: { home: 700, stopDesk: 500 },   // Oum El Bouaghi
  5: { home: 700, stopDesk: 500 },   // Batna
  6: { home: 700, stopDesk: 500 },   // Béjaïa
  7: { home: 700, stopDesk: 500 },   // Biskra
  8: { home: 700, stopDesk: 500 },   // Béchar
  9: { home: 700, stopDesk: 500 },   // Blida
  10: { home: 700, stopDesk: 500 },  // Bouira
  11: { home: 700, stopDesk: 500 },  // Tamanrasset
  12: { home: 700, stopDesk: 500 },  // Tébessa
  13: { home: 700, stopDesk: 500 },  // Tlemcen
  14: { home: 700, stopDesk: 500 },  // Tiaret
  15: { home: 700, stopDesk: 500 },  // Tizi Ouzou
  16: { home: 400, stopDesk: 300 },  // Alger
  17: { home: 700, stopDesk: 500 },  // Djelfa
  18: { home: 700, stopDesk: 500 },  // Jijel
  19: { home: 700, stopDesk: 500 },  // Sétif
  20: { home: 700, stopDesk: 500 },  // Saïda
  21: { home: 700, stopDesk: 500 },  // Skikda
  22: { home: 700, stopDesk: 500 },  // Sidi Bel Abbès
  23: { home: 700, stopDesk: 500 },  // Annaba
  24: { home: 700, stopDesk: 500 },  // Guelma
  25: { home: 700, stopDesk: 500 },  // Constantine
  26: { home: 700, stopDesk: 500 },  // Médéa
  27: { home: 700, stopDesk: 500 },  // Mostaganem
  28: { home: 700, stopDesk: 500 },  // M'sila
  29: { home: 700, stopDesk: 500 },  // Mascara
  30: { home: 700, stopDesk: 500 },  // Ouargla
  31: { home: 700, stopDesk: 500 },  // Oran
  32: { home: 700, stopDesk: 500 },  // El Bayadh
  33: { home: 700, stopDesk: 500 },  // Illizi
  34: { home: 700, stopDesk: 500 },  // Bordj Bou Arréridj
  35: { home: 700, stopDesk: 500 },  // Boumerdès
  36: { home: 700, stopDesk: 500 },  // El Tarf
  37: { home: 700, stopDesk: 500 },  // Tindouf
  38: { home: 700, stopDesk: 500 },  // Tissemsilt
  39: { home: 700, stopDesk: 500 },  // El Oued
  40: { home: 700, stopDesk: 500 },  // Khenchela
  41: { home: 700, stopDesk: 500 },  // Souk Ahras
  42: { home: 700, stopDesk: 500 },  // Tipaza
  43: { home: 700, stopDesk: 500 },  // Mila
  44: { home: 700, stopDesk: 500 },  // Aïn Defla
  45: { home: 700, stopDesk: 500 },  // Naâma
  46: { home: 700, stopDesk: 500 },  // Aïn Témouchent
  47: { home: 700, stopDesk: 500 },  // Ghardaïa
  48: { home: 700, stopDesk: 500 },  // Relizane
  49: { home: 700, stopDesk: 500 },  // El M'Ghair
  50: { home: 700, stopDesk: 500 },  // El Meniaa
  51: { home: 700, stopDesk: 500 },  // Ouled Djellal
  52: { home: 700, stopDesk: 500 },  // Bordj Badji Mokhtar
  53: { home: 700, stopDesk: 500 },  // Béni Abbès
  54: { home: 700, stopDesk: 500 },  // Timimoun
  55: { home: 700, stopDesk: 500 },  // Touggourt
  56: { home: 700, stopDesk: 500 },  // Djanet
  57: { home: 700, stopDesk: 500 },  // In Salah
  58: { home: 700, stopDesk: 500 },  // In Guezzam
};

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
 * Calculate shipping cost for a wilaya - returns both home and stop desk prices
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
 * Get shipping rates for a wilaya (both home delivery and stop desk)
 * Falls back to default rates if API is unavailable
 */
export async function getShippingRates(wilayaCode: number): Promise<{
  home: number;
  stopDesk: number;
  source: "api" | "fallback";
}> {
  try {
    const shipping = await calculateShipping(wilayaCode);
    // Try to extract prices from the API response
    const homePrice = shipping?.prix_domicile || shipping?.home_price || shipping?.price || shipping?.prix;
    const stopDeskPrice = shipping?.prix_stopdesk || shipping?.stop_desk_price || shipping?.stopdesk_price;

    if (homePrice || stopDeskPrice) {
      return {
        home: parseInt(homePrice) || 700,
        stopDesk: parseInt(stopDeskPrice) || 500,
        source: "api",
      };
    }
  } catch {
    // Fall through to default rates
  }

  // Fallback: return default shipping rates
  const rates = DEFAULT_SHIPPING_RATES[wilayaCode] || { home: 700, stopDesk: 500 };
  return {
    ...rates,
    source: "fallback",
  };
}

/**
 * Get stop desks (bureaux) for a specific wilaya
 */
export async function getStopDesks(wilayaId: number) {
  try {
    const response = await ecotrackFetch(`/api/stopdesk/${wilayaId}`);
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching stop desks for wilaya ${wilayaId}:`, error);
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
  stopdesk_id?: number;
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
