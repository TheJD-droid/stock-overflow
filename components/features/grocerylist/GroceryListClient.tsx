'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleItemCheck } from '@/lib/actions/toggleItemCheck'
import { submitGroceryList } from '@/lib/actions/groceryList'
import AddManualItemDialog from './AddItemManualDialog'
import GroceryQuantityControl from './GroceryQuantityControls'

export default function GroceryListClient({ 
  items, 
  householdId, 
  allItemNames 
}: { items: any[]; householdId: string; allItemNames: string[] }) {
  
  const [pending, startTransition] = useTransition()

  // OPTIONAL: useOptimistic makes the check feel instant
  // even though it's waiting for the server
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (state, updatedItem: any) => {
       return state.map(i => 
         i.uniqueId === updatedItem.uniqueId 
           ? { ...i, isChecked: !i.isChecked } 
           : i
       )
    }
  )

  const handleCheck = async (item: any) => {
    // 1. Update UI instantly
    startTransition(() => {
       setOptimisticItems(item)
    })
    // 2. Update DB
    await toggleItemCheck(householdId, item)
  }

  // Filter based on the state
  const activeItems = optimisticItems.filter(i => !i.isChecked)
  const cartItems = optimisticItems.filter(i => i.isChecked)

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm">
      
      {/* SECTION 1: ACTIVE */}
      <ul className="space-y-4">
        {activeItems.map((item, index) => {
          const prevItem = activeItems[index - 1];
          const showHeader = !prevItem || item.category !== prevItem.category;
          return (
            <div key={item.uniqueId}>
              {/* Render Header if category changed */}
              {showHeader && (
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-6 mb-2">
                  {item.category}
                </h3>
              )}
       
              {/* Render Item */}
              <li className="flex gap-4">
                <input 
                  type="checkbox" 
                  checked={false} 
                  onChange={() => handleCheck(item)}
                  disabled={pending} // Prevent double clicks
                  className="w-5 h-5 cursor-pointer"
                />
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-semibold">
                    {item.source === 'auto' && <span className="text-orange-600">Need {item.thresholdQuantity - item.inventoryQuantity}</span>}
                    {item.source === 'linked' && <span className="text-blue-600">Have {item.inventoryQuantity} Inventory</span>}
                    {item.source === 'manual' && <span className="text-gray-400">Manual</span>}
                  </span>
                </div>
                <span className="ml-auto text-sm">
                  <GroceryQuantityControl 
                    householdId={householdId} 
                    item={item}
                  />
                </span>
              </li>
            </div>
          )})}
      </ul>

      {/* SECTION 2: CART */}
      {cartItems.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">In Cart</h3>
          <ul className="space-y-4 opacity-60">
            {cartItems.map(item => (
              <li key={item.uniqueId} className="flex gap-4">
                <input 
                  type="checkbox" 
                  checked={true} 
                  onChange={() => handleCheck(item)} 
                  className="w-5 h-5 cursor-pointer"
                />
                <div>
                  <span className="font-medium line-through">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 font-semibold line-through">
                    {item.source === 'auto' && <span className="text-orange-600">Low Stock</span>}
                    {item.source === 'linked' && <span className="text-blue-600">Inventory</span>}
                    {item.source === 'manual' && <span className="text-gray-400">Manual</span>}
                  </span>
                </div>
                <span className="ml-auto text-sm line-through">
                  {item.quantityNeeded} {item.units}
                </span>
                
              </li>
            ))}
          </ul>
           
           {/* SUBMIT BUTTON */}
           <form action={async () => await submitGroceryList(householdId)}>
             <button 
               className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity"
             >
               Complete Shopping Trip
             </button>
           </form>
        </div>
      )}

      {/* MANUAL ADD */}
      <AddManualItemDialog householdId={householdId} existingItemNames={allItemNames} />
      
    </div>
  )
}