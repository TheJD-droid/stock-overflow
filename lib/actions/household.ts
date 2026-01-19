"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- ACTION 1: CREATE ---
export async function createHousehold(formData: FormData) {
  const supabase = await createClient()
  
  // Get the user first to ensure they are authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Guard Clause: Prevent orphaned households
  if (!user) {
    throw new Error("Authentication required: You must be logged in to create a household.")
  }

  const name = formData.get('name') as string

  // We'll wrap the database work in a try/catch for safety
  let newHouseholdId: string;

  try {
    // 1. Create the household entry
    const { data: household, error: hError } = await supabase
      .from('households')
      .insert({ name })
      .select("id")
      .single()

    if (hError) throw hError
    newHouseholdId = household.id

    // 2. Link the user as the Admin member
    const { error: mError } = await supabase
      .from('household_members')
      .insert({
        household_id: newHouseholdId,
        user_id: user.id,
        role: 'admin'
      })

    if (mError) throw mError

  } catch (error) {
  console.error("Household creation error:", error)
  // Update this to match the new location
  redirect('/protected/setup?error=creation-failed')
}

  // 3. Success! Redirect to the new dynamic dashboard
  redirect(`/protected/dashboard/${newHouseholdId}`)
}


// --- ACTION 2: JOIN ---
export async function joinHousehold(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const roomCode = (formData.get("room_code") as string).toUpperCase();

  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 2. Find the house
  const { data: household, error: hError } = await supabase
    .from("households")
    .select("id")
    .eq("room_code", roomCode)
    .single();

  if (hError || !household) {
    return { error: "Invalid Room Code." };
  }

 const { data: existingMember } = await supabase
  .from("household_members")
  .select("id")
  .eq("household_id", household.id)
  .eq("user_id", user.id)
  .single();

if (existingMember) {
  return { error: "You are already a member of this household! Redirecting..." };
  // Tip: You could also just redirect them immediately if they are already in.
}
  // 3. Insert membership
  const { error: mError } = await supabase
    .from("household_members")
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: "member",
    });

  if (mError) {
    if (mError.code === '23505') return { error: "Already a member." };
    return { error: "Join failed." };
  }

  // 4. Update and Go!
  revalidatePath(`/protected/dashboard/${household.id}`);
  redirect(`/protected/dashboard/${household.id}`);
}