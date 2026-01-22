"use client";

import { useTransition } from "react";
import { handleQuantityChange } from "@/lib/actions/items";
import { Database } from "@/lib/supabase/database.types";
import { deleteItem } from "@/lib/actions/items";
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

// 1. Add a performDelete handler at the top of your component
const performDelete = (itemId: string, itemName: string) => {
  if (window.confirm(`Are you sure you want to remove ${itemName}?`)) {
    startTransition(async () => {
      const result = await deleteItem(itemId, householdId);
      if (result?.error) alert(result.error);
    });
  }
};

  return (
    <div className="flex flex-col gap-3">
      {items?.map((item) => (
        
        <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl bg-background">  
          
          <div className="flex items-center gap-2"> {/* Container for Delete + Name */}

            {/* DELETE BUTTON */}
            <button
              disabled={isPending}
              onClick={() => performDelete(item.id, item.name)}
              className="text-muted-foreground/30 hover:text-destructive active:text-destructive transition-colors p-1 disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            {/* ITEM NAME AND CATEGORY */}
            <div className="flex flex-col ml-1"> {/* ml-1 adds a tiny gap for safety */}
              <h4 className="font-semibold text-sm">{item.name}</h4>
              <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tight">
                {item.category || "General"}
              </span>
            </div>
          </div>

          {/* Quantity Controls on the right */}

          <div className="flex items-center gap-2">
            
            {/* MINUS: Wrap the call to handle the promise */}
            <button 
              disabled={isPending}
              onClick={() => performUpdate(item.id, -1, true)}
              className="w-10 h-10 rounded-lg border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-xl active:scale-95 disabled:opacity-50"
            >
              -
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