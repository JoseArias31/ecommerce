"use client"

import { useState, useEffect } from "react"
import { ShoppingCart } from "lucide-react"

export default function AddToCartButton({ product }) {
  const [quantity, setQuantity] = useState(1)
  

  // Cargar cantidad guardada al iniciar
  useEffect(() => {
    const savedQuantities = JSON.parse(localStorage.getItem('productQuantities')) || {}
    setQuantity(savedQuantities[product.id] || 1)
  }, [product.id])

  // Guardar cantidad cuando cambie
  useEffect(() => {
    const savedQuantities = JSON.parse(localStorage.getItem('productQuantities')) || {}
    savedQuantities[product.id] = quantity
    localStorage.setItem('productQuantities', JSON.stringify(savedQuantities))
  }, [quantity, product.id])

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