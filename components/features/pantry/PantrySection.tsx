import { createClient } from "@/lib/supabase/server";
import AddItemForm from "@/components/features/pantry/AddItemForm";
import PantryList from "./PantryList";

export default async function PantrySection({ householdId }: { householdId: string }) {
  const supabase = await createClient();

  // Fetch Items specifically for this household
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("household_id", householdId)
    .order("name", { ascending: true }); // Alphabetical order is usually best for pantries

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Pantry</h2>
      
      {/* Pass the items to the list */}
      <PantryList items={items} householdId={householdId} />

      <div className="pt-6 mt-6 border-t">
        <h3 className="text-sm font-medium mb-4">Add to Stock</h3>
        <AddItemForm householdId={householdId} />
      </div>
    </div>
  );
}