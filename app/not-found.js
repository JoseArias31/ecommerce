import Link from "next/link"
import { Home, AlertCircle } from "lucide-react"


export default function NotFound() {
  return (
    <>
       
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="text-[150px] font-bold text-gray-200">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="h-20 w-20 text-red-500" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn&#39;t find the page you&#39;re looking for. It might have been moved or doesn&#39;t exist.
        </p>

        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Home className="mr-2 h-5 w-5" />
          Back to Home
        </Link>
      </div>
    </div>
        
    </>
  )
}
