"use client";

import { useActionState } from "react";
import { joinHousehold } from "@/lib/actions/household";
import { Button } from "@/components/ui/button";

export default function JoinHouseForm() {
  // state will hold the { error: "..." } returned from your action
  const [state, formAction, isPending] = useActionState(joinHousehold, null);

  return (
    <div className="flex flex-col p-8 border rounded-2xl bg-card shadow-sm hover:border-primary/50 transition-colors">
      <h2 className="text-2xl font-bold mb-2">Join</h2>
      <p className="text-sm text-muted-foreground mb-6">Enter a code from a housemate.</p>
      
      <form action={formAction} className="mt-auto space-y-4">
        <input 
          name="room_code" 
          placeholder="6-DIGIT CODE" 
          required 
          maxLength={6}
          className="w-full p-3 border rounded-lg bg-background font-mono text-center uppercase tracking-widest text-lg"
        />
        
        {/* Display the error message if it exists */}
        {state?.error && (
          <p className="text-destructive text-sm font-medium bg-destructive/10 p-2 rounded">
            {state.error}
          </p>
        )}

        <Button 
          type="submit" 
          disabled={isPending} 
          variant="secondary" 
          className="w-full"
        >
          {isPending ? "Joining..." : "Join Household"}
        </Button>
      </form>
    </div>
  );
}