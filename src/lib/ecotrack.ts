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
  1: { home: 1400, stopDesk: 1100 },   // Adrar
  2: { home: 800, stopDesk: 650 },     // Chlef
  3: { home: 850, stopDesk: 700 },     // Laghouat
  4: { home: 800, stopDesk: 700 },     // Oum El Bouaghi
  5: { home: 800, stopDesk: 700 },     // Batna
  6: { home: 800, stopDesk: 700 },     // Béjaïa
  7: { home: 850, stopDesk: 700 },     // Biskra
  8: { home: 1200, stopDesk: 1100 },   // Béchar
  9: { home: 600, stopDesk: 600 },     // Blida
  10: { home: 800, stopDesk: 650 },    // Bouira
  11: { home: 1800, stopDesk: 1500 },  // Tamanrasset
  12: { home: 800, stopDesk: 750 },    // Tébessa
  13: { home: 800, stopDesk: 700 },    // Tlemcen
  14: { home: 1000, stopDesk: 700 },   // Tiaret
  15: { home: 700, stopDesk: 700 },    // Tizi Ouzou
  16: { home: 400, stopDesk: 200 },    // Alger
  17: { home: 850, stopDesk: 700 },    // Djelfa
  18: { home: 800, stopDesk: 700 },    // Jijel
  19: { home: 800, stopDesk: 650 },    // Sétif
  20: { home: 900, stopDesk: 700 },    // Saïda
  21: { home: 800, stopDesk: 700 },    // Skikda
  22: { home: 800, stopDesk: 700 },    // Sidi Bel Abbès
  23: { home: 800, stopDesk: 700 },    // Annaba
  24: { home: 800, stopDesk: 700 },    // Guelma
  25: { home: 800, stopDesk: 700 },    // Constantine
  26: { home: 800, stopDesk: 700 },    // Médéa
  27: { home: 800, stopDesk: 700 },    // Mostaganem
  28: { home: 800, stopDesk: 700 },    // M'sila
  29: { home: 900, stopDesk: 750 },    // Mascara
  30: { home: 900, stopDesk: 750 },    // Ouargla
  31: { home: 800, stopDesk: 550 },    // Oran
  32: { home: 1000, stopDesk: 750 },   // El Bayadh
  33: { home: 800, stopDesk: 700 },    // Illizi
  34: { home: 800, stopDesk: 700 },    // Bordj Bou Arréridj
  35: { home: 600, stopDesk: 600 },    // Boumerdès
  36: { home: 800, stopDesk: 700 },    // El Tarf
  37: { home: 1800, stopDesk: 1450 },  // Tindouf
  38: { home: 900, stopDesk: 700 },    // Tissemsilt
  39: { home: 900, stopDesk: 750 },    // El Oued
  40: { home: 800, stopDesk: 700 },    // Khenchela
  41: { home: 800, stopDesk: 700 },    // Souk Ahras
  42: { home: 600, stopDesk: 600 },    // Tipaza
  43: { home: 800, stopDesk: 700 },    // Mila
  44: { home: 800, stopDesk: 700 },    // Aïn Defla
  45: { home: 900, stopDesk: 700 },    // Naâma
  46: { home: 800, stopDesk: 700 },    // Aïn Témouchent
  47: { home: 900, stopDesk: 750 },    // Ghardaïa
  48: { home: 800, stopDesk: 700 },    // Relizane
  49: { home: 900, stopDesk: 750 },    // El M'Ghair
  50: { home: 900, stopDesk: 750 },    // El Meniaa
  51: { home: 900, stopDesk: 750 },    // Ouled Djellal
  52: { home: 1800, stopDesk: 1500 },  // Bordj Badji Mokhtar
  53: { home: 1200, stopDesk: 1100 },  // Béni Abbès
  54: { home: 1400, stopDesk: 1100 },  // Timimoun
  55: { home: 900, stopDesk: 750 },    // Touggourt
  56: { home: 1800, stopDesk: 1500 },  // Djanet
  57: { home: 1800, stopDesk: 1500 },  // In Salah
  58: { home: 1800, stopDesk: 1500 },  // In Guezzam
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
 * Normalized wilaya type
 */
export interface WilayaData {
  id: number;
  name: string;
  code: number;
}

/**
 * Normalized commune type
 */
export interface CommuneData {
  id: number;
  name: string;
  wilayaId: number;
  codePostal: string;
  hasStopDesk: boolean;
}

/**
 * Get list of all wilayas from Ecotrack
 * API endpoint: GET /api/v1/get/wilayas
 * Response: [{wilaya_id, wilaya_name}]
 */
export async function getWilayas(): Promise<WilayaData[]> {
  try {
    const response = await ecotrackFetch("/api/v1/get/wilayas");
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // API returns array of {wilaya_id, wilaya_name}
    if (Array.isArray(data)) {
      return data.map((w: { wilaya_id: number; wilaya_name: string }) => ({
        id: w.wilaya_id,
        name: w.wilaya_name,
        code: w.wilaya_id,
      }));
    }
    throw new Error("Unexpected wilayas response format");
  } catch (error) {
    console.error("Error fetching wilayas from Ecotrack:", error);
    throw error;
  }
}

/**
 * Get communes for a specific wilaya
 * API endpoint: GET /api/v1/get/communes?wilaya_id=X
 * Response: [{nom, wilaya_id, code_postal, has_stop_desk}]
 */
export async function getCommunes(wilayaId: number): Promise<CommuneData[]> {
  try {
    const response = await ecotrackFetch(`/api/v1/get/communes?wilaya_id=${wilayaId}`);
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // API returns array of {nom, wilaya_id, code_postal, has_stop_desk}
    if (Array.isArray(data)) {
      return data.map((c: { nom: string; wilaya_id: number; code_postal: string; has_stop_desk: number }, index: number) => ({
        id: index + 1, // Communes don't have an explicit ID in API response
        name: c.nom,
        wilayaId: c.wilaya_id,
        codePostal: c.code_postal,
        hasStopDesk: c.has_stop_desk === 1,
      }));
    }
    throw new Error("Unexpected communes response format");
  } catch (error) {
    console.error(`Error fetching communes for wilaya ${wilayaId}:`, error);
    throw error;
  }
}

/**
 * Get shipping fees for all wilayas
 * API endpoint: GET /api/v1/get/fees
 * Response: {livraison: [{wilaya_id, tarif, tarif_stopdesk}]}
 */
export async function getFees(): Promise<Record<number, { home: number; stopDesk: number }>> {
  try {
    const response = await ecotrackFetch("/api/v1/get/fees");
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // API returns {livraison: [{wilaya_id, tarif, tarif_stopdesk}]}
    const feesMap: Record<number, { home: number; stopDesk: number }> = {};
    if (data && Array.isArray(data.livraison)) {
      for (const fee of data.livraison) {
        feesMap[fee.wilaya_id] = {
          home: parseInt(fee.tarif) || 700,
          stopDesk: parseInt(fee.tarif_stopdesk) || 500,
        };
      }
    }
    return feesMap;
  } catch (error) {
    console.error("Error fetching fees from Ecotrack:", error);
    throw error;
  }
}

/**
 * Get shipping rates for a specific wilaya (both home delivery and stop desk)
 * Uses the /api/v1/get/fees endpoint and filters by wilaya_id
 * Falls back to default rates if API is unavailable
 */
export async function getShippingRates(wilayaCode: number): Promise<{
  home: number;
  stopDesk: number;
  source: "api" | "fallback";
}> {
  try {
    const allFees = await getFees();
    const fee = allFees[wilayaCode];
    if (fee) {
      return {
        home: fee.home,
        stopDesk: fee.stopDesk,
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
 * Calculate shipping cost for a wilaya - returns both home and stop desk prices
 * Kept for backward compatibility
 */
export async function calculateShipping(wilayaId: number): Promise<{
  prix_domicile: number;
  prix_stopdesk: number;
  wilaya_id: number;
}> {
  const rates = await getShippingRates(wilayaId);
  return {
    prix_domicile: rates.home,
    prix_stopdesk: rates.stopDesk,
    wilaya_id: wilayaId,
  };
}

/**
 * Get stop desks (bureaux) for a specific wilaya
 * Note: The Ecotrack API doesn't have a dedicated stop desk endpoint in v1
 * Stop desk availability is indicated by has_stop_desk in commune data
 */
export async function getStopDesks(wilayaId: number) {
  try {
    // Use communes endpoint to find which communes have stop desks
    const communes = await getCommunes(wilayaId);
    const stopDeskCommunes = communes.filter(c => c.hasStopDesk);
    return stopDeskCommunes.map(c => ({
      id: c.id,
      name: c.name,
      wilaya_id: c.wilayaId,
      has_stop_desk: true,
    }));
  } catch (error) {
    console.error(`Error fetching stop desks for wilaya ${wilayaId}:`, error);
    throw error;
  }
}

/**
 * Create a shipping order in Ecotrack
 * API endpoint: POST /api/v1/create/order
 * 
 * Required params: nom_client, telephone, adresse, code_wilaya, commune, montant, produit
 * Optional: telephone_2, code_postal, remarque, stock, quantite, type (1=Livraison, 2=Echange, 3=PICKUP, 4=Recouvrement), stop_desk (0 or 1), weight, fragile
 *
 * IMPORTANT: The 'type' parameter controls the ORDER TYPE, NOT the delivery method:
 *   type=1 → Livraison (standard delivery) ← DEFAULT for all orders
 *   type=2 → Echange (exchange)
 *   type=3 → PICKUP
 *   type=4 → Recouvrement (collection)
 *
 * Stop desk vs home delivery is controlled by the SEPARATE 'stop_desk' parameter:
 *   stop_desk=0 → Livraison à domicile (home delivery)
 *   stop_desk=1 → Livraison au stop desk
 * 
 * CRITICAL: The API expects parameters in the POST body as JSON, NOT as query parameters.
 * Sending parameters as query params causes the API to ignore the 'type' field,
 * resulting in orders being created as "échange" instead of "livraison".
 * Response: {"success":true, "tracking":"EC6KZ4260607148398", "reference":"TEST-002"}
 */
export async function createEcotrackShipment(orderData: {
  nom_client: string;
  telephone: string;
  telephone_2?: string;
  adresse: string;
  code_wilaya: number;
  commune: string;
  code_postal?: string;
  montant: number;
  produit: string;
  remarque?: string;
  type?: 1 | 2 | 3 | 4;  // 1=Livraison, 2=Echange, 3=PICKUP, 4=Recouvrement (default: 1)
  stop_desk?: 0 | 1;    // 0=home delivery (default), 1=stop desk delivery
  quantite?: number;
  weight?: number;
  fragile?: boolean;
  reference?: string;
}) {
  try {
    // Build the request body as JSON
    // CRITICAL: The Ecotrack API expects parameters in the POST body as JSON,
    // NOT as query parameters. Sending them as query params causes the API
    // to ignore certain fields (like 'type'), resulting in orders being
    // created as "échange" instead of "livraison".
    const body: Record<string, unknown> = {
      nom_client: orderData.nom_client,
      telephone: orderData.telephone,
      adresse: orderData.adresse,
      code_wilaya: orderData.code_wilaya,
      commune: orderData.commune,
      montant: orderData.montant,
      produit: orderData.produit,

      // Type: Order operation type
      // 1 = Livraison (standard delivery) - ALWAYS use this for normal orders
      // 2 = Echange (exchange)
      // 3 = PICKUP
      // 4 = Recouvrement (collection)
      // CRITICAL: type=1 means Livraison, NOT home delivery!
      type: orderData.type ?? 1,

      // Stop desk: Delivery method (separate from order type)
      // 0 = Livraison à domicile (home delivery) - default
      // 1 = Livraison au stop desk
      stop_desk: orderData.stop_desk ?? 0,
    };

    // Optional params - only include if provided
    if (orderData.telephone_2) body.telephone_2 = orderData.telephone_2;
    if (orderData.code_postal) body.code_postal = orderData.code_postal;
    if (orderData.remarque) body.remarque = orderData.remarque;
    if (orderData.quantite) body.quantite = orderData.quantite;
    if (orderData.weight) body.weight = orderData.weight;
    if (orderData.fragile) body.fragile = 1;
    if (orderData.reference) body.reference = orderData.reference;

    console.log(`[ECOTRACK] Creating order with type=${body.type}, stop_desk=${body.stop_desk}`);

    const response = await ecotrackFetch(`/api/v1/create/order`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Ecotrack API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }
    const data = await response.json();
    console.log(`[ECOTRACK] Create order response:`, JSON.stringify(data));
    return data as { success: boolean; tracking: string; reference: string };
  } catch (error) {
    console.error("Error creating Ecotrack shipment:", error);
    throw error;
  }
}

/**
 * Get orders list from Ecotrack
 * API endpoint: GET /api/v1/get/orders
 *
 * Returns paginated list of orders with full details including:
 * - tracking, reference, client, phone, adresse
 * - type_id (1=Livraison, 2=Echange)
 * - status (prete_a_expedier, vers_hub, vers_wilaya, en_preparation, en_livraison, livré, etc.)
 * - process_state_id (numeric status code)
 * - global_status (en_process, livre, retour)
 */
export async function getEcotrackOrders(page: number = 1): Promise<{
  current_page: number;
  data: EcotrackOrder[];
}> {
  try {
    const response = await ecotrackFetch(`/api/v1/get/orders?page=${page}`);
    if (!response.ok) {
      throw new Error(`Ecotrack API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data as { current_page: number; data: EcotrackOrder[] };
  } catch (error) {
    console.error("Error fetching Ecotrack orders:", error);
    throw error;
  }
}

/**
 * Ecotrack order type from GET /api/v1/get/orders
 */
export interface EcotrackOrder {
  tracking: string;
  reference: string | null;
  client: string;
  phone: string;
  phone_2: string | null;
  adresse: string;
  stop_desk: number;
  commune_id: number;
  wilaya_id: number;
  montant: string;
  tarif_prestation: string;
  tarif_retour: string;
  type_id: number;  // 1=Livraison, 2=Echange
  created_at: string;
  payment_id: string | null;
  return_id: string | null;
  process_state_id: number;
  livred_at: string | null;
  exchanged_at: string | null;
  return_asked_at: string | null;
  last_updated_at: string;
  driver_name: string;
  driver_phone: string;
  products: string;
  status: string;  // prete_a_expedier, vers_hub, vers_wilaya, en_preparation, en_livraison, livré, etc.
  global_status: string;  // en_process, livre, retour
  status_reason: unknown[];
  order_products: unknown[];
}

/**
 * Get a specific order from Ecotrack by tracking number
 * Uses the get/orders endpoint and finds the matching order
 */
export async function getEcotrackOrderByTracking(tracking: string): Promise<EcotrackOrder | null> {
  try {
    // Search through pages to find the order
    let page = 1;
    const maxPages = 10; // Safety limit
    
    while (page <= maxPages) {
      const result = await getEcotrackOrders(page);
      const order = result.data.find(o => o.tracking === tracking);
      if (order) return order;
      
      // If we got fewer orders than expected, we've reached the end
      if (result.data.length === 0) break;
      page++;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Ecotrack order ${tracking}:`, error);
    return null;
  }
}

/**
 * Validate and ship (expédier) an order on Ecotrack
 * API endpoint: POST /api/v1/valid/order
 *
 * This is the equivalent of clicking "Valider l'expédition" in the Ecotrack dashboard.
 * After calling this endpoint, the order status changes from "prete_a_expedier" to
 * "vers_station" / "vers_hub" and the order can no longer be modified or deleted.
 *
 * Parameters (JSON body):
 *   - tracking (required): The tracking number of the order
 *   - ask_collection (optional): 1 = request pickup (ramassage), 0 = no pickup
 *
 * IMPORTANT: This must be called when the local order status changes to "shipped".
 * The previous approach of using /api/v1/update/order with a status parameter did NOT
 * actually validate the expedition — it only updated order details.
 */
export async function validateEcotrackExpedition(
  tracking: string,
  askCollection: 0 | 1 = 0
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`[ECOTRACK] Validating expedition for order ${tracking}`);

    const body = {
      tracking,
      ask_collection: askCollection,
    };

    const response = await ecotrackFetch(`/api/v1/valid/order`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[ECOTRACK] Validate expedition failed for ${tracking}: ${response.status} - ${errorBody}`);
      throw new Error(
        `Ecotrack API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    console.log(`[ECOTRACK] Validate expedition response for ${tracking}:`, JSON.stringify(data));

    // Verify the status changed by fetching the order
    const updatedOrder = await getEcotrackOrderByTracking(tracking);
    if (updatedOrder) {
      console.log(`[ECOTRACK] Order ${tracking} status after validation: "${updatedOrder.status}" (process_state_id: ${updatedOrder.process_state_id})`);
    }

    return data as { success: boolean; message?: string };
  } catch (error) {
    console.error(`[ECOTRACK] Error validating expedition for ${tracking}:`, error);
    throw error;
  }
}

/**
 * Update order details on Ecotrack (address, phone, etc. — NOT status)
 * API endpoint: POST /api/v1/update/order
 *
 * This endpoint can only be used BEFORE the order is validated (expédiée).
 * It updates order details like address, phone, amount, etc.
 * It does NOT change the order status — use validateEcotrackExpedition for that.
 *
 * Required fields: tracking, type, wilaya, commune, adresse, client, tel, montant
 */
export async function updateEcotrackOrder(
  tracking: string,
  orderDetails: {
    type: number;
    wilaya: number;
    commune: string;
    adresse: string;
    client: string;
    tel: string;
    montant: number;
  }
) {
  try {
    console.log(`[ECOTRACK] Updating order details for ${tracking}`);

    const response = await ecotrackFetch("/api/v1/update/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tracking,
        type: orderDetails.type,
        wilaya: orderDetails.wilaya,
        commune: orderDetails.commune,
        adresse: orderDetails.adresse,
        client: orderDetails.client,
        tel: orderDetails.tel,
        montant: orderDetails.montant,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[ECOTRACK] Update failed for ${tracking}: ${response.status} - ${errorBody}`);
      throw new Error(
        `Ecotrack API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data = await response.json();
    console.log(`[ECOTRACK] Update response for ${tracking}:`, JSON.stringify(data));

    return data as { success: boolean; message?: string };
  } catch (error) {
    console.error(`[ECOTRACK] Error updating order ${tracking}:`, error);
    throw error;
  }
}

/**
 * Backward compatible alias
 */
export const createOrder = createEcotrackShipment;

/**
 * Track a shipment by tracking number
 * API endpoint: GET /api/v1/get/tracking/info?tracking=X
 */
export async function trackOrder(trackingNumber: string) {
  try {
    const response = await ecotrackFetch(`/api/v1/get/tracking/info?tracking=${trackingNumber}`);
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
