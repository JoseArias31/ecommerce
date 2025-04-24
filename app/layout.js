'use client'
import '../styles/globals.css';
import Link from "next/link"
import { useEffect, useState } from "react";
import Footer from "@/components/footer";
import { Globe } from "lucide-react"

export default function RootLayout({ children }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Function to sum all quantities in the cart
    const getCartCount = () => {
      if (typeof window === 'undefined') return 0;
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      return cart.reduce((sum, item) => sum + item.quantity, 0);
    };

    // Initial count
    setCartCount(getCartCount());

    // Listen for cart updates from anywhere in the app
    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>The Quick Shop</title>
        <meta name="description" content="A minimalist e-commerce store" />
      </head>
      <body>
        <div className="flex flex-col min-h-screen">
          <nav className="border-b sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-shadow">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <Link href="/">
                <h1 className="text-4xl font-bold text-black">
                  The Quick Shop
                </h1>
              </Link>

              <div className="flex items-center space-x-4">
                <Link href="/checkout" className="text-black">
                <div className="p-2 relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="21" r="1"></circle>
                    <circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center ">
                    {cartCount}
                  </span>
                  
                </div>
                </Link>
                <Link href="/login" className="text-black">
                <div className="relative p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div className="absolute -top-2 right-0 flex items-center space-x-1 animate-bounce">
                   
                    <span className="bg-blue-500 text-white text-xs rounded-full px-1 drop-shadow">Hey!</span>
                  </div>
                </div>
                </Link>
              </div>
            </div>
          </nav>
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

import './globals.css'

// export const metadata = {
//   generator: 'v0.dev'
// };
