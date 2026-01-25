import { getHouseholdGroceryList } from "@/lib/actions/groceryList";
import GroceryListClient from "./GroceryListClient"; // Import the client part

export default async function GroceryListContent({ 
    params,
}: { 
    params: Promise<{ id: string }>
}) {

    const { id: householdId } = await params;

    const { data: items } = await getHouseholdGroceryList(householdId);

    return (
        // Pass data to the Client Component
        <GroceryListClient items={items || []} householdId={householdId} allItemNames={items?.map(i => i.name) || []} />
    );
}