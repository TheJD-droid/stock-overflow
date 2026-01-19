import { createClient } from "@/lib/supabase/server";

export default async function MembersSection({ householdId }: { householdId: string }) {
  const supabase = await createClient();

  // 1. Fetch Household Details (for the Room Code)
  const { data: household } = await supabase
    .from("households")
    .select("room_code")
    .eq("id", householdId)
    .single();

  // 2. Fetch Members
  const { data: members, error } = await supabase
    .from("household_members")
    .select(`
      role,
      profiles!user_id (
        name,
        id
      )
    `)
    .eq("household_id", householdId);

  if (error) {
    return <div className="p-6 border rounded-xl bg-destructive/10 text-destructive text-sm">Failed to load members.</div>;
  }

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Housemates</h2>
        
        {/* ROOM CODE UI */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">Room Code</span>
          <code className="text-sm font-mono font-bold bg-primary/5 px-2 py-0.5 rounded border border-primary/20 text-primary">
            {household?.room_code}
          </code>
        </div>
      </div>

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
      
      <p className="mt-auto pt-6 text-[11px] text-muted-foreground italic">
        Share the invite code above to add more members to this household.
      </p>
    </div>
  );
}