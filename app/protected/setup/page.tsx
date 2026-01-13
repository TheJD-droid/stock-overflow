import { createHousehold } from '@/app/actions/household'

export default function SetupPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
          <p className="mt-2 text-gray-600">
            Let's get started by creating your first shared inventory space.
          </p>
        </div>

        {/* The Action Prop links the form directly to your Server Action */}
        <form action={createHousehold} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Household Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="e.g., Stiers Home or Beach Volleyball Gear"
              required
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Household
          </button>
        </form>
        
        <p className="text-xs text-center text-gray-400 italic">
          Tip: You can invite others using a room code once this is created.
        </p>
      </div>
    </main>
  )
}