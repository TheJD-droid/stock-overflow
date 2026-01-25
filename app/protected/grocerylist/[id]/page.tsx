import { Suspense } from "react";
import GroceryListContent from "@/components/features/grocerylist/GroceryListContent";

export default function GroceryListPage({
  params,
}: {
    params: Promise<{ id: string }>;
}) {

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      {/* This renders INSTANTLY because it doesn't 'await' anything */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold italic text-primary">Grocery List</h1>
      </header>
        {/* Only the parts that need the ID are wrapped in Suspense */}
        <Suspense fallback={<div className="p-4 animate-pulse text-muted-foreground">Loading grocery list...</div>}>
            
            <GroceryListContent params={params} />

        </Suspense>
    </div>
  );
}