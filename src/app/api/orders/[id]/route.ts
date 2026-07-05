import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEcotrackShipment, trackOrder, updateEcotrackOrderStatus, getEcotrackOrderByTracking } from "@/lib/ecotrack";

/**
 * GET /api/orders/[id] - Get order with items (admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                reference: true,
                price: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la commande" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders/[id] - Update order status (admin)
 * Actions:
 *  - status update (new/confirmed/shipped/delivered/cancelled)
 *  - sendToEcotrack: manually send order to Ecotrack
 *  - syncEcotrack: sync tracking status from Ecotrack
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes, ecotrackTracking, paymentMethod, sendToEcotrack, syncEcotrack } = body;

    const existing = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { name: true, reference: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // ── Handle status update ──
    if (status !== undefined) {
      updateData.status = status;

      // If order is being cancelled, restore stock
      if (status === "cancelled" && existing.status !== "cancelled") {
        for (const item of existing.items) {
          const variant = await db.productVariant.findUnique({
            where: {
              productId_size_color: {
                productId: item.productId,
                size: item.size,
                color: item.color,
              },
            },
          });
          if (variant) {
            await db.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // ── Push status change to Ecotrack when marking as shipped ──
      // When local status changes to "shipped" (expédié), we attempt to update Ecotrack status.
      // 
      // IMPORTANT: The Ecotrack public API (v1.1.0) does NOT provide a way to change order status
      // or "validate expedition" via the API. The update/order endpoint accepts a "status" parameter
      // but it does NOT actually change the status on Ecotrack's side.
      //
      // What we do:
      // 1. Call updateEcotrackOrderStatus (for documentation/audit purposes)
      // 2. Fetch the ACTUAL status from Ecotrack using getEcotrackOrderByTracking
      // 3. Store the real Ecotrack status locally in ecotrackStatus
      //
      // The "Valider l'expédition" step on Ecotrack must be done manually via their dashboard or app.
      if (status === "shipped" && existing.ecotrackTracking) {
        try {
          const ecotrackSettings = await db.ecotrackSettings.findFirst({
            where: { active: true },
          });
          if (ecotrackSettings) {
            // Get wilaya code for the update request
            let wilayaCode: number | null = null;
            try {
              const { getWilayas } = await import("@/lib/ecotrack");
              const wilayas = await getWilayas();
              const matchedWilaya = wilayas.find(w => w.name === existing.wilaya);
              if (matchedWilaya) wilayaCode = matchedWilaya.code;
            } catch {
              const parsed = parseInt(existing.wilaya);
              if (!isNaN(parsed)) wilayaCode = parsed;
            }

            if (wilayaCode) {
              // Attempt to update status on Ecotrack (may not actually change it)
              try {
                const updateResult = await updateEcotrackOrderStatus(existing.ecotrackTracking, "vers_station", {
                  type: 1,  // 1 = Livraison
                  wilaya: wilayaCode,
                  commune: existing.commune,
                  adresse: existing.address,
                  client: existing.customer.name,
                  tel: existing.phone || existing.customer.phone,
                  montant: existing.totalAmount + existing.shippingCost,
                });
                
                // If the update returned the actual status, use it
                if (updateResult && 'actualStatus' in updateResult && updateResult.actualStatus) {
                  updateData.ecotrackStatus = updateResult.actualStatus;
                  if (!updateResult.statusChanged) {
                    console.warn(`[ECOTRACK] Status not changed on Ecotrack for ${existing.ecotrackTracking}. Actual: "${updateResult.actualStatus}". You may need to manually validate the expedition on the Ecotrack dashboard.`);
                  }
                } else {
                  updateData.ecotrackStatus = "vers_station";
                }
              } catch (updateError) {
                // Update failed - try to fetch current status directly
                console.warn(`[ECOTRACK] Update call failed, fetching current status for ${existing.ecotrackTracking}`);
                const currentOrder = await getEcotrackOrderByTracking(existing.ecotrackTracking);
                if (currentOrder) {
                  updateData.ecotrackStatus = currentOrder.status;
                } else {
                  updateData.ecotrackStatus = "vers_station"; // Fallback to expected status
                }
              }
            }
            console.log(`[ECOTRACK] Order ${existing.ecotrackTracking} - local status set to "shipped", ecotrackStatus set to "${updateData.ecotrackStatus}"`);
          }
        } catch (ecotrackUpdateError) {
          console.error("[ECOTRACK] Failed to sync status for shipped order:", ecotrackUpdateError);
          // Don't fail the whole update - local status is still saved
          updateData.ecotrackStatus = "vers_station"; // Set expected status as fallback
        }
      }

      // ── Push status change to Ecotrack when marking as delivered ──
      if (status === "delivered" && existing.ecotrackTracking) {
        try {
          const ecotrackSettings = await db.ecotrackSettings.findFirst({
            where: { active: true },
          });
          if (ecotrackSettings) {
            let wilayaCode: number | null = null;
            try {
              const { getWilayas } = await import("@/lib/ecotrack");
              const wilayas = await getWilayas();
              const matchedWilaya = wilayas.find(w => w.name === existing.wilaya);
              if (matchedWilaya) wilayaCode = matchedWilaya.code;
            } catch {
              const parsed = parseInt(existing.wilaya);
              if (!isNaN(parsed)) wilayaCode = parsed;
            }

            if (wilayaCode) {
              try {
                const updateResult = await updateEcotrackOrderStatus(existing.ecotrackTracking, "livré", {
                  type: 1,
                  wilaya: wilayaCode,
                  commune: existing.commune,
                  adresse: existing.address,
                  client: existing.customer.name,
                  tel: existing.phone || existing.customer.phone,
                  montant: existing.totalAmount + existing.shippingCost,
                });
                
                if (updateResult && 'actualStatus' in updateResult && updateResult.actualStatus) {
                  updateData.ecotrackStatus = updateResult.actualStatus;
                } else {
                  updateData.ecotrackStatus = "livré";
                }
              } catch (updateError) {
                const currentOrder = await getEcotrackOrderByTracking(existing.ecotrackTracking);
                if (currentOrder) {
                  updateData.ecotrackStatus = currentOrder.status;
                } else {
                  updateData.ecotrackStatus = "livré";
                }
              }
            }
            console.log(`[ECOTRACK] Order ${existing.ecotrackTracking} - local status set to "delivered", ecotrackStatus set to "${updateData.ecotrackStatus}"`);
          }
        } catch (ecotrackUpdateError) {
          console.error("[ECOTRACK] Failed to sync status for delivered order:", ecotrackUpdateError);
          updateData.ecotrackStatus = "livré";
        }
      }
    }

    // ── Handle manual "Send to Ecotrack" action ──
    if (sendToEcotrack && !existing.ecotrackId) {
      try {
        const ecotrackSettings = await db.ecotrackSettings.findFirst({
          where: { active: true },
        });

        if (ecotrackSettings) {
          // Build product description
          const productDesc = existing.items
            .map((item) => `${item.product.name} (${item.size}/${item.color}) x${item.quantity}`)
            .join(", ");

          // Determine wilaya code - try to find from the Ecotrack API wilayas
          // The wilaya field contains the name, so we need to find the code
          let wilayaCode: number | null = null;
          
          // First, try to parse from the wilaya field (it might contain the code already)
          // If the order was created from the storefront with customerWilayaCode, it's stored as the wilaya name
          // We need to look up the code from the Ecotrack API
          try {
            const { getWilayas } = await import("@/lib/ecotrack");
            const wilayas = await getWilayas();
            const matchedWilaya = wilayas.find(w => w.name === existing.wilaya);
            if (matchedWilaya) {
              wilayaCode = matchedWilaya.code;
            }
          } catch {
            // If we can't get wilayas, try a numeric parse
            const parsed = parseInt(existing.wilaya);
            if (!isNaN(parsed)) wilayaCode = parsed;
          }

          if (wilayaCode) {
            const shipmentData = await createEcotrackShipment({
              nom_client: existing.customer.name,
              telephone: existing.phone || existing.customer.phone,
              adresse: existing.address,
              code_wilaya: wilayaCode,
              commune: existing.commune,
              montant: existing.totalAmount + existing.shippingCost,
              produit: productDesc,
              type: 1,  // 1 = Livraison (NOT 2 which = Echange!)
              stop_desk: 0,  // 0 = home delivery (default for manual sends)
              remarque: existing.notes || `Commande ${existing.orderNumber}`,
              reference: existing.orderNumber,
              quantite: existing.items.reduce((sum, item) => sum + item.quantity, 0),
            });

            // Response format: {success: true, tracking: "EC6KZ...", reference: "CMD-..."}
            if (shipmentData && shipmentData.success) {
              updateData.ecotrackTracking = shipmentData.tracking || null;
              updateData.ecotrackStatus = "created";
            }
          } else {
            return NextResponse.json(
              { error: `Impossible de trouver le code wilaya pour "${existing.wilaya}". Vérifiez que la wilaya est correcte.` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "FRET.DIRECT n'est pas configuré. Veuillez d'abord configurer les paramètres FRET.DIRECT." },
            { status: 400 }
          );
        }
      } catch (ecotrackError) {
        console.error("Failed to create Ecotrack shipment:", ecotrackError);
        return NextResponse.json(
          { error: `Erreur FRET.DIRECT: ${ecotrackError instanceof Error ? ecotrackError.message : "Erreur inconnue"}` },
          { status: 500 }
        );
      }
    }

    // ── Handle "Sync Ecotrack status" action ──
    if (syncEcotrack && existing.ecotrackTracking) {
      try {
        // Use getEcotrackOrderByTracking for more accurate status (includes status, process_state_id, type_id, etc.)
        const ecotrackOrder = await getEcotrackOrderByTracking(existing.ecotrackTracking);
        if (ecotrackOrder) {
          updateData.ecotrackStatus = ecotrackOrder.status;
          console.log(`[ECOTRACK] Synced status for ${existing.ecotrackTracking}: status="${ecotrackOrder.status}", process_state_id=${ecotrackOrder.process_state_id}, type_id=${ecotrackOrder.type_id}`);
          
          // Auto-update order status based on Ecotrack status
          const ecotrackStatus = ecotrackOrder.status.toLowerCase();
          const processStateId = ecotrackOrder.process_state_id;
          
          if (ecotrackStatus.includes("livré") || processStateId >= 200) {
            updateData.status = "delivered";
          } else if (
            ecotrackStatus.includes("vers_") || 
            ecotrackStatus.includes("en_preparation") || 
            ecotrackStatus.includes("en_livraison") ||
            processStateId >= 60
          ) {
            updateData.status = "shipped";
          }
        } else {
          // Fallback to tracking API
          const trackingData = await trackOrder(existing.ecotrackTracking);
          if (trackingData) {
            const activity = trackingData.activity?.[0];
            if (activity) {
              updateData.ecotrackStatus = activity.status || existing.ecotrackStatus;
            }
          }
        }
      } catch (syncError) {
        console.error("[ECOTRACK] Failed to sync Ecotrack status:", syncError);
        // Don't fail the whole update
      }
    }

    // ── Other updates ──
    if (notes !== undefined) updateData.notes = notes;
    if (ecotrackTracking !== undefined) updateData.ecotrackTracking = ecotrackTracking;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                reference: true,
                images: { take: 1, orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande" },
      { status: 500 }
    );
  }
}
