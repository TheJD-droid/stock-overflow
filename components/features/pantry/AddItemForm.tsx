"use client";

import { addItem } from "@/lib/actions/items";
import { useRef } from "react";

export default function AddItemForm({ 
  householdId, 
  existingItemNames = [] 
}: { 
  householdId: string, 
  existingItemNames?: string[] 
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form 
      ref={formRef}
      action={async (formData) => {
        await addItem(formData);
        formRef.current?.reset(); // Clear form after adding
      }} 
      className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30"
    >
      {/* Hidden input to pass the household ID to the Server Action */}
      <input type="hidden" name="household_id" value={householdId} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase text-muted-foreground">Item Name</label>
        <input 
        name="name" 
        placeholder="Milk, Eggs, etc." 
        required 
        list="inventory-suggestions"
        autoComplete="off"
               className="bg-background border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
      </div>
      {/* The Invisible Helper List */}
        <datalist id="inventory-suggestions">
          {existingItemNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Quantity</label>
          <input name="quantity" type="number" defaultValue="1" min="1"
                 className="bg-background border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase text-muted-foreground">Units</label>
        <input 
        name="units" 
        placeholder="e.g. box, lbs" 
        type="text"
        className="bg-background border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
      </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Threshold</label>
          <input 
          name="threshold" 
          placeholder="Default 1" 
          type="number"
          defaultValue="1"
          min="0"
          className="bg-background border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Category</label>
          <input name="category" placeholder="Grocery" 
                  className="bg-background border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>
      



      <button type="submit" className="mt-2 w-full bg-foreground text-background py-2 rounded-md font-medium hover:opacity-90 transition-opacity">
        Confirm Add
      </button>
    </form>
  );
}