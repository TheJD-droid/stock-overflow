'use client'

import { useState, useRef } from 'react'
import { updateEntryQuantity } from '@/lib/actions/updateEntryQuantity'

export default function GroceryQuantityControl({ 
  item, 
  householdId 
}: { 
  item: any, 
  householdId: string 
}) {
  // Local state for instant feedback (Optimistic UI)
  const [currentQty, setCurrentQty] = useState(item.quantityNeeded)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Is the current value different from the suggestion?
  const isModified = currentQty !== item.suggestedQuantity;

  const handleUpdate = async (newVal: number) => {
    if (newVal < 1) return;
    setCurrentQty(newVal); // Instant UI update
    setIsSaving(true);
    
    await updateEntryQuantity(householdId, item, newVal);
    
    setIsSaving(false);
    setIsEditing(false);
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      
      {/* 1. RESET BUTTON (Only if modified) */}
      {isModified && (
         <button 
           onClick={() => handleUpdate(item.suggestedQuantity)}
           disabled={isSaving}
           className="text-gray-400 hover:text-orange-600 mr-1 transition-colors"
           title={`Reset to suggested (${item.suggestedQuantity})`}
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
           </svg>
         </button>
      )}

      {/* 2. DECREMENT */}
      <button 
        onClick={() => handleUpdate(currentQty - 1)}
        className="w-6 h-6 flex items-center justify-center rounded-lg bg-secondary hover:bg-accent hover:text-primary text-secondary-foreground font-bold"
      >
        -
      </button>

      {/* 3. NUMBER DISPLAY / EDIT INPUT */}
      {isEditing ? (
        <input 
          type="number" 
          autoFocus
          onFocus={(e) => e.target.select()}
          onBlur={(e) => handleUpdate(parseInt(e.target.value) || 1)}
          onKeyDown={(e) => {
             if(e.key === 'Enter') handleUpdate(parseInt(e.currentTarget.value) || 1)
          }}
          defaultValue={currentQty}
          className="w-10 text-center bg-transparent border-0 p-0 outline-none appearance-none focus:ring-0 py-0.5 text-sm [&::-webkit-inner-spin-button]:appearance-none m-0"
        />
      ) : (
        <span 
          onClick={() => setIsEditing(true)}
          className={`w-10 text-center text-sm font-medium cursor-pointer hover:underline ${isModified ? 'text-accent-foreground' : 'text-orange-600'}`}
          title="Click to edit manually"
        >
          {currentQty}
        </span>
      )}

      {/* 4. INCREMENT */}
      <button 
        onClick={() => handleUpdate(currentQty + 1)}
        className="w-6 h-6 flex items-center justify-center rounded-lg bg-secondary hover:bg-accent hover:text-primary text-secondary-foreground font-bold"
      >
        +
      </button>

      <span className="text-sm ml-1 text-gray-500 w-8 truncate">
        {item.units}
      </span>
    </div>
  )
}