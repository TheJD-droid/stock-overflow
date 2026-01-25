'use client'

import { useState, useRef } from 'react'
import { addManualItem } from '@/lib/actions/addManualItem'

export default function AddManualItemDialog({ 
  householdId,
  existingItemNames = [] // Passed down from parent for autocomplete
}: { 
  householdId: string,
  existingItemNames?: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const toggle = () => setIsOpen(!isOpen)

  const handleSubmit = async (formData: FormData) => {
    // 1. Call Server Action (Smart Lookup & Add to Staging)
    await addManualItem(formData)
    
    // 2. Cleanup UI
    formRef.current?.reset()
    setIsOpen(false)
  }

  return (
    <>
      {/* 1. TRIGGER BUTTON (Matches the list style) */}
      <button 
        onClick={toggle}
        className="w-full py-3 mt-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        <span>Add Item Manually</span>
      </button>

      {/* 2. MODAL OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          {/* 3. MODAL CONTENT */}
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 scale-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Add to List</h2>
              <button onClick={toggle} className="text-primary hover:text-muted-foreground rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-primary transition">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            
            <form 
              ref={formRef}
              action={handleSubmit}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="householdId" value={householdId} />
              
              {/* --- FIELD: NAME (With Autocomplete) --- */}
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">
                  Item Name
                </label>
                <input 
                  name="name" 
                  type="text" 
                  required 
                  autoFocus
                  autoComplete="off"
                  list="manual-suggestions" // <--- Connects to datalist
                  placeholder="e.g. Milk, Batteries..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                />
                
                {/* The "Invisible" Helper List */}
                <datalist id="manual-suggestions">
                  {existingItemNames.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* --- FIELDS: QUANTITY & UNITS --- */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input 
                      name="quantity" 
                      type="number" 
                      defaultValue={1}
                      min={1}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Units <span className="text-gray-400 font-normal">(opt)</span>
                    </label>
                    <input 
                      name="units" 
                      type="text" 
                      placeholder="e.g. box, lbs"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                    />
                 </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Threshold <span className="text-gray-400 font-normal">(opt)</span>
                    </label>
                    <input 
                    name="threshold" 
                    type="number" 
                    min="0"
                    defaultValue="1"


                    placeholder="e.g. 3"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                    />
                </div>

                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Category <span className="text-gray-400 font-normal">(opt)</span>
                    </label>
                    <input 
                      name="category" 
                      type="text" 
                      placeholder="e.g. Dairy, Electronics"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                    />
                 </div>
                 
              </div>
              


              {/* --- ACTIONS --- */}
              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={toggle} 
                  className="flex-1 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-bold shadow-sm transition-opacity"
                >
                  Add Item
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}