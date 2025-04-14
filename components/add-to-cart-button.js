"use client"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"

export default function AddToCartButton({ product }) {
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    // This would typically update a cart state or send data to an API
    alert(`Added ${quantity} ${product.name}(s) to cart`)
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <button
          className="w-8 h-8 flex items-center justify-center border rounded-md"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
        >
          -
        </button>
        <span className="mx-4">{quantity}</span>
        <button
          className="w-8 h-8 flex items-center justify-center border rounded-md"
          onClick={() => setQuantity(quantity + 1)}
        >
          +
        </button>
      </div>

      <button className="btn-primary w-full flex items-center justify-center" onClick={handleAddToCart}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
      </button>
    </div>
  )
}
