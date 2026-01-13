import { createHousehold } from "@/app/actions/household";
import JoinHouseForm from "./JoinHouseForm"; // Import your new component

export default function SetupPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-12 p-8 justify-center min-h-[80vh]">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Welcome to StockOverflow</h1>
        <p className="text-xl text-muted-foreground">To get started, create a new household or join an existing one.</p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* OPTION 1: CREATE (Keeping it simple for now) */}
        <div className="flex flex-col p-8 border rounded-2xl bg-card shadow-sm hover:border-primary/50 transition-colors">
          <h2 className="text-2xl font-bold mb-2">Create</h2>
          <p className="text-muted-foreground mb-6">Start a fresh inventory for your home.</p>
          <form action={createHousehold} className="mt-auto space-y-4">
            <input 
              name="name" 
              placeholder="Household Name" 
              required 
              className="w-full p-3 border rounded-lg bg-background"
            />
            <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90">
              Create Household
            </button>
          </form>
        </div>

        {/* OPTION 2: JOIN (Using the new Client Component) */}
        <JoinHouseForm /> 
      </div>
    </div>
  );
}