'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addManualItem(formData: FormData) {
  const supabase = await createClient()
  
  const rawName = formData.get('name') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const units = (formData.get('units') as string) || 'units'
  const householdId = formData.get('householdId') as string
  const threshold = parseInt(formData.get('threshold') as string) || 0;
  const category = (formData.get('category') as string)?.trim() || "General";

  if (!rawName || !householdId) return

  const searchName = rawName.trim()

  // 1. SMART LOOKUP: Check Inventory (items table)
  const { data: inventoryItem } = await supabase
    .from('items')
    .select('id, quantity, threshold_quantity')
    .eq('household_id', householdId)
    .ilike('name', searchName)
    .single()

  // 2. DUPLICATE CHECK: Check Staging (grocery_list_entries table)
  // We check for EITHER a matching item_id (if we found one) OR a matching manual_name
  let query = supabase
    .from('grocery_list_entries')
    .select('id, quantity')
    .eq('household_id', householdId)

  if (inventoryItem) {
    query = query.eq('item_id', inventoryItem.id)
  } else {
    query = query.ilike('manual_name', searchName)
  }

  const { data: existingEntry } = await query.single()

  // 3. CALCULATE THE "STARTING" QUANTITY
  let baseQuantity = 0;

  if (existingEntry) {
    // Case A: It's already in the cart (e.g. you added it previously)
    baseQuantity = existingEntry.quantity;
  } 
  else if (inventoryItem) {
    // Case B: It's a "Ghost" (Low Stock) that we are about to make real
    const threshold = inventoryItem.threshold_quantity || 0;
    const current = inventoryItem.quantity || 0;
    
    // Only count the deficit if it's actually low
    if (current < threshold) {
      baseQuantity = threshold - current;
    }
  }

  // 4. PERFORM THE UPDATE OR INSERT
  const finalQuantity = baseQuantity + quantity;

  if (existingEntry) {
    // UPDATE existing entry
    await supabase
      .from('grocery_list_entries')
      .update({ quantity: finalQuantity, initialQuantity: finalQuantity })
      .eq('id', existingEntry.id)

  } else {
    // INSERT new entry (Summing Ghost + Input)
    const payload: any = {
      household_id: householdId,
      quantity: finalQuantity,
      initial_quantity: finalQuantity,
      units: units,
      is_checked: false,
      manual_threshold: threshold,
      manual_category: category
    }

if (inventoryItem) {
      payload.item_id = inventoryItem.id
    } else {
      payload.manual_name = searchName
    }

    await supabase.from('grocery_list_entries').insert(payload)
  }

  revalidatePath(`/households/${householdId}/grocery-list`)
}