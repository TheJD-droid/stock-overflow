'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleItemCheck(
  householdId: string, 
  // We pass the whole item object to have all data ready for promotion
  item: { 
    uniqueId: string;
    itemId?: string;
    entryId?: string;
    quantityNeeded: number;
    units: string;
    isChecked: boolean; // The OLD state
  }
) {
  const supabase = await createClient()

  // SCENARIO A: It's a Real Row (Manual Add or already Promoted)
  if (item.entryId) {
    // Just flip the boolean
    await supabase
      .from('grocery_list_entries')
      .update({ is_checked: !item.isChecked })
      .eq('id', item.entryId)
  }
  
  // SCENARIO B: It's a Ghost (Auto-Item) being Checked
  else if (item.itemId && !item.isChecked) {
    // Promote it! Create a real row.
    await supabase
      .from('grocery_list_entries')
      .insert({
        household_id: householdId,
        item_id: item.itemId,
        quantity: item.quantityNeeded,
        units: item.units,
        is_checked: true
      })
  }

  // SCENARIO C: It's a Ghost being Unchecked? 
  // (Impossible, because Ghosts start unchecked. But we handle it for safety)
  
  revalidatePath(`/households/${householdId}/grocery-list`)
}