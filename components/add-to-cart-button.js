import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useQuantityStore } from "../store/quantityStore"

export default function AddToCartButton({ product }) {
  const quantity = useQuantityStore((state) => state.quantities[product.id] || 1)
  const setQuantity = useQuantityStore((state) => state.setQuantity)
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {}, []) // Ya no es necesario guardar en localStorage aquí

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart')) || []
    const existingProductIndex = existingCart.findIndex(item => item.id === product.id)

    if (existingProductIndex !== -1) {
      existingCart[existingProductIndex].quantity += quantity
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        quantity: quantity,
        price: product.price,
        image: product.image
      })
    }

    localStorage.setItem('cart', JSON.stringify(existingCart))
    window.dispatchEvent(new Event('cartUpdated')) // Actualiza el badge en tiempo real
    setShowCheckout(true)
    // Elimina el temporizador para dejar el botón fijo
  }

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center space-x-2">
        <button
          className="w-8 h-8 flex items-center justify-center border rounded-md bg-gray-100 hover:bg-gray-200 text-lg font-bold transition"
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
          className="w-12 text-center border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          className="w-8 h-8 flex items-center justify-center border rounded-md bg-gray-100 hover:bg-gray-200 text-lg font-bold transition"
          onClick={() => setQuantity(product.id, quantity + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
        <button
          className="ml-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md flex items-center gap-2 font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95 whitespace-nowrap"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </button>
      </div>
      {showCheckout && (
        <Link href="/checkout" className="block mt-3 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md text-center font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95">
          Go to Checkout
        </Link>
      )}
    </div>
  )
}