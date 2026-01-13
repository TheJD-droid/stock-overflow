import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function HouseholdDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Household Details
  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", id)
    .single();

  if (!household) return notFound();

  // 2. Fetch Members and their Profile details
  // This 'join' works because of the Foreign Key relationship 
  // between household_members and profiles
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select(`
      role,
      profiles!user_id (
        name,
        id
      )
    `)
    .eq("household_id", id);

    console.log("--- DEBUG HOUSEHOLD MEMBERS ---");
    console.log("ID from URL:", id);
    // Log the error specifically
    if (membersError) {
      console.error("DATABSE ERROR:", membersError.message);
      console.error("ERROR CODE:", membersError.code);
    }
console.log("Members Found:", members);
  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{household.name}</h1>
        <div className="flex items-center gap-4">
          <span className="bg-muted px-3 py-1 rounded-md text-sm font-mono border">
            Room Code: {household.room_code}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Card */}
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Inventory</h2>
          <p className="text-muted-foreground italic">No items tracked yet.</p>
          <button className="mt-4 w-full bg-foreground text-background py-2 rounded-md font-medium hover:opacity-90">
            + Add Item
          </button>
        </div>

        {/* Members List */}
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Housemates</h2>
          <div className="flex flex-col gap-4">
            {members?.map((member: any) => (
              <div key={member.profiles.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold border border-primary/20">
                  {member.profiles.name?.substring(0, 2).toUpperCase() || "???"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{member.profiles.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}