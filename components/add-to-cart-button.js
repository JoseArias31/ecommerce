"use client"

import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useQuantityStore } from "../store/quantityStore"
import { supabase } from "@/lib/supabaseClient"
import { useTranslation } from "@/contexts/TranslationContext"

export default function AddToCartButton({ product }) {
  const quantity = useQuantityStore((state) => state.quantities[product.id] || 1)
  const setQuantity = useQuantityStore((state) => state.setQuantity)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart')) || []
    const existingProductIndex = existingCart.findIndex(item => item.id === product.id)

    if (existingProductIndex !== -1) {
      existingCart[existingProductIndex].quantity += quantity
    } else {
      const productImage = product.images?.[0]?.url || product.image || '/placeholder.svg'
      
      existingCart.push({
        id: product.id,
        name: product.name,
        quantity: quantity,
        price: product.price,
        image: productImage
      })
    }

    localStorage.setItem('cart', JSON.stringify(existingCart))
    window.dispatchEvent(new Event('cartUpdated'))
    setShowCheckout(true)
  }

  const handleCheckoutClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault()
      setShowAuthPrompt(true)
    }
  }

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center space-x-2">
        <button
          className="w-7 h-7 flex items-center justify-center border rounded bg-gray-100 hover:bg-gray-200 text-base font-bold transition p-0"
          onClick={() => setQuantity(product.id, Math.max(1, quantity - 1))}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(product.id, Math.max(1, Number(e.target.value)))}
          className="w-9 text-center border rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
        />
        <button
          className="w-7 h-7 flex items-center justify-center border rounded bg-gray-100 hover:bg-gray-200 text-base font-bold transition p-0"
          onClick={() => setQuantity(product.id, quantity + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
        <button
          className="ml-2 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-1.5 font-semibold text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 active:scale-95 whitespace-nowrap shadow-sm"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4" />
          {t('addToCart')}
        </button>
      </div>
      {showCheckout && (
        <Link 
          href="/checkout" 
          onClick={handleCheckoutClick}
          className="block mt-2 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-center font-semibold text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 active:scale-95 shadow-sm"
        >
          {t('checkout')}
        </Link>
      )}
      {showAuthPrompt && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 mb-2">
            {t('signIn')} to get a better shopping experience and track your orders
          </p>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded text-center transition-colors"
              onClick={() => setShowAuthPrompt(false)}
            >
              {t('signIn')}
            </Link>
            <Link
              href="/checkout"
              className="px-3 py-1.5 text-yellow-800 text-xs font-medium hover:text-yellow-900"
              onClick={() => setShowAuthPrompt(false)}
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}