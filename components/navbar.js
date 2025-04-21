import Link from "next/link"
import { ShoppingCart, User } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          STORE
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/checkout" className="p-2 relative">
            <ShoppingCart className="h-5 w-5" />
           
          </Link>
          <Link href="/admin" className="p-2">
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
