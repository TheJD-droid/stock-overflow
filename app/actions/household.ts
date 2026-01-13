'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
      .select()
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
  redirect(`/dashboard/${newHouseholdId}`)
}