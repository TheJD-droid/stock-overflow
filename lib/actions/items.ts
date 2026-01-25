"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addItem(formData: FormData) {
  const supabase = await createClient();
  
  //  Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Extract data from form
  const household_id = formData.get("household_id") as string;
  const name = formData.get("name") as string;
  const quantity = Number(formData.get("quantity")) || 1;
  const units = formData.get("units") as string;
  const category = formData.get("category") as string;
  const threshold = Number(formData.get("threshold")) || 0;

  if (!household_id || !name) {
    return { error: "Missing required fields" };
  }


  // Check if the item already exists in the household
  const { data: existingItem, error: fetchError } = await supabase
    .from("items")
    .select("id, quantity")
    .eq("household_id", household_id)
    .ilike("name", name)
    .single();

    if (fetchError && fetchError.code !== "PGRST116") { // PGRST116: No rows found
      console.error("Error checking existing item:", fetchError);
      return { error: "Failed to check existing items" };
    }

    if (existingItem) {
      // If it exists, update the quantity instead of adding a new item
      const { error: updateError } = await supabase.rpc("update_item_quantity_atomic", {
        target_item_id: existingItem.id,
        target_household_id: household_id,
        new_value: quantity,
        is_relative: true,
      });
      if (updateError) {
        console.error("Error updating existing item quantity:", updateError);
        return { error: "Failed to update existing item quantity" };
      }
    }
    else {

    // Insert the item
    // Note: RLS 'Members can manage items' policy will automatically 
    // block this if the user isn't in household_members
    const { error: insertError } = await supabase
      .from("items")
      .insert({
        name,
        quantity,
        units,
        threshold_quantity: threshold,
        category,
        household_id,
        last_updated_by: user.id,
      });

    if (insertError) {
      console.error("Error adding item:", insertError);
      return { error: "Failed to add item" };
    }
  }


  // Refresh the specific household dashboard
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

  // Ensure user is authenticated so auth.uid() works in the SQL function
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Call the Atomic SQL function
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

  // Revalidate the dashboard so the UI reflects the new database state
  revalidatePath(`/protected/dashboard/${householdId}`);
}


export async function deleteItem(itemId: string, householdId: string) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Delete with household_id check for extra security
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("household_id", householdId);

  if (error) {
    console.error("Delete Error:", error.message);
    return { error: "Could not delete item." };
  }

  // Refresh the UI
  revalidatePath(`/protected/dashboard/${householdId}`);
}