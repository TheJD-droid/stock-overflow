"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";



// --- ACTION: FETCH GROCERY LIST BASED ON THRESHOLD ---

export async function getHouseholdGroceryList(householdId: string) {
  const supabase = await createClient();

  // Helper to determine suggested quantity
  const getSuggestedQty = (item: any) => {
    if (item.default_buy_qty) return item.default_buy_qty;
    if (item.threshold_quantity) return item.threshold_quantity; // Buy the full threshold amount
    return 1;
  };

  // 1. Fetch Staging
  const { data: stagingEntries } = await supabase
    .from("grocery_list_entries")
    .select("*, item:items(*)")
    .eq("household_id", householdId);

  const stagedInventoryIds = new Set(
    (stagingEntries || []).map(entry => entry.item_id).filter(Boolean)
  );

  // 2. Fetch Inventory
  const { data: inventory } = await supabase
    .from("items")
    .select("*")
    .eq("household_id", householdId);

  // 3. Process Ghosts (Auto)
  const autoItems = (inventory || [])
    .filter(item => {
      const isLow = (item.threshold_quantity ?? 0) > 0 && item.quantity < (item.threshold_quantity ?? 0);
      return isLow && !stagedInventoryIds.has(item.id);
    })
    .map(item => {
      
      const suggestedQuantity = getSuggestedQty(item)  
      return {

        uniqueId: item.id,
        itemId: item.id,
        name: item.name,
        quantityNeeded: suggestedQuantity, // Quantity that will appear in the list, meant to be the same as suggestedQuantity initially
        suggestedQuantity: suggestedQuantity, // Suggestion based on threshold or default
        units: item.units || 'units',
        source: 'auto', // Label: "Low Stock"
        isChecked: false,
        category: item.category || 'General',
        inventoryQuantity: item.quantity || 0,
        thresholdQuantity: item.threshold_quantity || 0

      }
    });

  // 4. Process Staging (Manual + Linked)
  const manualItems = (stagingEntries || []).map(entry => {
    const linkedItem = entry.item;
    
    const suggested = linkedItem ? getSuggestedQty(linkedItem) :
      entry.initial_quantity ? entry.initial_quantity : entry.quantity;


    const threshold = linkedItem ? linkedItem.threshold_quantity : entry.manual_threshold;
    const inventoryQuantity = linkedItem ? linkedItem.quantity : 0;

    // LOGIC FIX: Determine Source based on data presence
    let source = 'manual';
    if (entry.item_id && linkedItem) {
        const isLowStock = (linkedItem.threshold_quantity ?? 0) >= 0 && 
        linkedItem.quantity < (linkedItem.threshold_quantity ?? 0);
    

        if (isLowStock) {
            source = 'auto';
        }
        else {
            source = 'linked';
        }
    }

    return {
      uniqueId: entry.id,
      entryId: entry.id,
      itemId: entry.item_id,
      name: linkedItem?.name || entry.manual_name || "Unknown",
      quantityNeeded: entry.quantity, // The user's current desired quantity
      suggestedQuantity: suggested, // Suggestion based on threshold or default
      units: entry.units || 'units',
      source: source, // 'linked' (in inventory), auto (in inventory, but low on stock), or 'manual' (manually added, not in inventory yet)
      isChecked: entry.is_checked,
      category: entry.manual_category || linkedItem?.category || 'General',
      thresholdQuantity: threshold || undefined,
      inventoryQuantity: inventoryQuantity || undefined

    };
  });

  // 5. MERGE & SORT
  const combinedItems = [...autoItems, ...manualItems].sort((a, b) => {
    // Primary Sort: Category (A-Z)
    const catCompare = (a.category || '').localeCompare(b.category || '');
    if (catCompare !== 0) return catCompare;

    // Secondary Sort: Name (A-Z)
    return a.name.localeCompare(b.name);
  });

  return { data: combinedItems };
}

export async function submitGroceryList(householdId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Get ONLY Checked items from Staging
  const { data: itemsToBuy } = await supabase
    .from('grocery_list_entries')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_checked', true); // <--- Only buy what is checked

  if (!itemsToBuy || itemsToBuy.length === 0) return;

  const boughtEntryIds = [];

  for (const entry of itemsToBuy) {
    boughtEntryIds.push(entry.id);

    // OPTION A: It's linked to an Inventory Item
    if (entry.item_id) {
       await supabase.rpc("update_item_quantity_atomic", {
         target_item_id: entry.item_id,
         target_household_id: householdId,
         new_value: entry.quantity,
         is_relative: true 
       });
    } 
    // OPTION B: It's a new Manual Item (Create it)
    else if (entry.manual_name) {
       await supabase.from("items").insert({
         household_id: householdId,
         name: entry.manual_name,
         quantity: entry.quantity,
         units: entry.units || 'units',
         threshold_quantity: entry.manual_threshold || 0,
         category: entry.manual_category || 'General', // Default
         last_updated_by: user?.id
       });
    }
  }

  // 2. Cleanup: Delete ONLY the items we bought
  if (boughtEntryIds.length > 0) {
    await supabase
      .from('grocery_list_entries')
      .delete()
      .in('id', boughtEntryIds);
  }

  revalidatePath(`/protected/${householdId}/grocery-list`);
  revalidatePath(`/protected/dashboard/${householdId}`); // Update dashboard too
}