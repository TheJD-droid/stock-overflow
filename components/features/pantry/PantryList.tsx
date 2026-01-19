"use client";

import { useTransition } from "react";
import { handleQuantityChange } from "@/lib/actions/items";
import { Database } from "@/lib/supabase/database.types";

type Item = Database["public"]["Tables"]["items"]["Row"];

export default function PantryList({ 
  items, 
  householdId 
}: { 
  items: Item[] | null, 
  householdId: string 
}) {
  const [isPending, startTransition] = useTransition();

  // Unified handler to wrap the async action for startTransition
  const performUpdate = (itemId: string, val: number, relative: boolean) => {
    startTransition(async () => {
      const result = await handleQuantityChange(itemId, householdId, val, relative);
      if (result?.error) {
        alert(result.error); // Basic error handling
      }
    });
  };

  const handleManualSet = (item: Item) => {
    const userInput = window.prompt(
      `Set exact quantity for ${item.name}:`, 
      (item.quantity ?? 0).toString()
    );
    
    if (userInput !== null) {
      const newValue = parseInt(userInput);
      if (!isNaN(newValue)) {
        const delta = newValue - (item.quantity ?? 0);
        if (delta !== 0) {
          performUpdate(item.id, delta, true);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {items?.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl bg-background">
          <div className="flex flex-col">
            <h4 className="font-semibold text-sm">{item.name}</h4>
            <span className="text-[10px] uppercase text-muted-foreground font-medium">
              {item.category || "General"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* MINUS: Wrap the call to handle the promise */}
            <button 
              disabled={isPending}
              onClick={() => performUpdate(item.id, -1, true)}
              className="w-10 h-10 rounded-lg border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-xl active:scale-95 disabled:opacity-50"
            >
              −
            </button>

            {/* LABEL: Trigger manual prompt */}
            <button
              disabled={isPending}
              onClick={() => handleManualSet(item)}
              className={`min-w-[48px] px-2 py-1 text-center font-mono text-lg font-bold rounded-md hover:bg-muted ${
                isPending ? "animate-pulse text-muted-foreground" : "text-primary"
              }`}
            >
              {item.quantity ?? 0}
            </button>

            {/* PLUS: Wrap the call to handle the promise */}
            <button 
              disabled={isPending}
              onClick={() => performUpdate(item.id, 1, true)}
              className="w-10 h-10 rounded-lg border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-xl active:scale-95 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}