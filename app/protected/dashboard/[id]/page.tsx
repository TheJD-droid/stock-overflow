import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function HouseholdDashboard({
  params,
}: {
  // Update the type to reflect that it's a Promise
  params: Promise<{ id: string }>; 
}) {
  // 1. Await the params to get the actual ID
  const { id } = await params; 
  
  const supabase = await createClient();

  // 2. Use the unwrapped 'id' here
  const { data: household, error } = await supabase
    .from("households")
    .select("*")
    .eq("id", id) 
    .single();

  if (error || !household) {
    return notFound();
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{household.name}</h1>
        <div className="flex items-center gap-4">
          <span className="bg-muted px-3 py-1 rounded-md text-sm font-mono border">
            Room Code: {household.room_code}
          </span>
          <p className="text-sm text-muted-foreground">
            Share this code to let others join.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Summary */}
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Inventory</h2>
          <p className="text-muted-foreground italic">No items found.</p>
          <button className="mt-4 w-full bg-foreground text-background py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
            + Add Item
          </button>
        </div>

        {/* Members List */}
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Housemates</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
              JD
            </div>
            <span className="text-sm font-medium">You (Admin)</span>
          </div>
        </div>
      </div>
    </div>
  );
}