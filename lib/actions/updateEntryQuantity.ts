'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateEntryQuantity(
  householdId: string, 
  item: { 
    uniqueId: string;
    itemId?: string;
    entryId?: string;
    manual_name?: string; 
  },
  newQuantity: number
) {
  const supabase = await createClient()

  // 1. AUTHENTICATION: Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // 2. AUTHORIZATION: Verify user belongs to this household
  const { data: membership, error } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single()

  if (error || !membership) {
    console.error('Authorization failed: User is not a member of this household')
    throw new Error('Forbidden: You are not a member of this household')
  }

  // --- SAFE TO PROCEED ---

  if (newQuantity < 1) return; 
  // Even if we don't have an entryId from the client, we check if one exists in the DB
  // This catches the "Race Condition" where a row was just created.

  let updateSuccessful = false;

  // 1. Try to UPDATE based on explicit Entry ID
  if (item.entryId) {
    const { error } = await supabase
      .from('grocery_list_entries')
      .update({ quantity: newQuantity })
      .eq('id', item.entryId)
      .eq('household_id', householdId) // Safety check
    
    if (!error) updateSuccessful = true;
  }

  // 2. If that didn't happen, try to UPDATE based on Inventory ID (The "Ghost" Check)
  if (!updateSuccessful && item.itemId) {
    const { data, error } = await supabase
      .from('grocery_list_entries')
      .update({ quantity: newQuantity })
      .eq('household_id', householdId)
      .eq('item_id', item.itemId)
      .select(); // We select to see if any rows were actually touched

    if (!error && data && data.length > 0) {
      updateSuccessful = true;
    }
  }

  // 3. If neither update worked, it is TRULY a new entry. INSERT it.
  if (!updateSuccessful && item.itemId) {
    const { error } = await supabase
      .from('grocery_list_entries')
      .insert({
        household_id: householdId,
        item_id: item.itemId,
        quantity: newQuantity,
        is_checked: false 
      });
      
    // EDGE CASE: If this Insert fails, it means we lost the race (Constraint Violation).
    // In that specific case, we should try updating one last time.
    if (error?.code === '23505') { // Postgres Unique Violation code
       await supabase
        .from('grocery_list_entries')
        .update({ quantity: newQuantity })
        .eq('household_id', householdId)
        .eq('item_id', item.itemId);
    }
  }

  revalidatePath(`/protected/grocerlist/${householdId}`)
}