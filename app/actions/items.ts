"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addItem(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get("name") as string;
  const household_id = formData.get("household_id") as string;
  const category = formData.get("category") as string;

  const { error } = await supabase
    .from("items")
    .insert({
      name,
      household_id,
      category,
    });

  if (error) {
    console.error("Error adding item:", error);
    return { error: "Failed to add item" };
  }

  // This tells Next.js to refresh the dashboard data
  revalidatePath(`/protected/dashboard/${household_id}`);
}