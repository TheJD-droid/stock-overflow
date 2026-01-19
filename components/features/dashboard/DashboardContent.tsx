import { Suspense } from "react";
import PantrySection from "@/components/features/pantry/PantrySection";
import MembersSection from "@/components/features/households/MembersSection";

export default async function DashboardContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
        <PantrySection householdId={id} />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}>
        <MembersSection householdId={id} />
      </Suspense>
    </div>
  );
}