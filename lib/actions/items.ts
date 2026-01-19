"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addItem(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 2. Extract data from form
  const household_id = formData.get("household_id") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const quantity = Number(formData.get("quantity")) || 1;

  // 3. Insert the item
  // Note: RLS 'Members can manage items' policy will automatically 
  // block this if the user isn't in household_members!
  const { error } = await supabase
    .from("items")
    .insert({
      name,
      quantity,
      category,
      household_id,
      last_updated_by: user.id, // Matching your schema name
    });

  if (error) {
    console.error("Error adding item:", error);
    return { error: "Failed to add item" };
  }

  // 4. Refresh the specific household dashboard
  revalidatePath(`/protected/dashboard/${household_id}`);
}

/**
 * Handles both relative adjustments (increment/decrement) 
 * and absolute overrides (manual input deltas).
 */
export async function handleQuantityChange(
  itemId: string,
  householdId: string,
  value: number,
  isRelative: boolean
) {
  const supabase = await createClient();

  // 1. Ensure user is authenticated so auth.uid() works in the SQL function
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 2. Call the Atomic SQL function
  const { error } = await supabase.rpc("update_item_quantity_atomic", {
    target_item_id: itemId,
    target_household_id: householdId,
    new_value: value,
    is_relative: isRelative,
  });

  if (error) {
    console.error("RPC Update Error:", error.message);
    return { error: "Failed to update quantity. Please try again." };
  }

  // 3. Revalidate the dashboard so the UI reflects the new database state
  revalidatePath(`/protected/dashboard/${householdId}`);
}