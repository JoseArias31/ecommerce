"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Trash2 } from "lucide-react"

// Mock cart data - in a real app, this would come from state management or localStorage
const initialCart = [
  { id: 1, name: "Minimalist Watch", price: 129.99, quantity: 1, image: "/placeholder.svg?height=100&width=100" },
  { id: 3, name: "Wireless Earbuds", price: 149.99, quantity: 2, image: "/placeholder.svg?height=100&width=100" },
]

export default function CheckoutPage() {
  const [cart, setCart] = useState(initialCart)

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = 10.0
  const total = subtotal + shipping

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center text-sm mb-8 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Continue shopping
      </Link>

      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">Your cart is empty</p>
          <Link href="/" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center py-4 border-b">
                <div className="w-20 h-20 relative flex-shrink-0">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover object-center"
                  />
                </div>

                <div className="ml-4 flex-grow">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-gray-600">${item.price.toFixed(2)}</p>

                  <div className="flex items-center mt-2">
                    <button
                      className="w-6 h-6 flex items-center justify-center border rounded-md text-sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="mx-2 text-sm">{item.quantity}</span>
                    <button
                      className="w-6 h-6 flex items-center justify-center border rounded-md text-sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button className="ml-4 text-gray-500 hover:text-red-500" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button className="btn-primary w-full">Proceed to Checkout</button>

              <p className="text-xs text-gray-500 mt-4 text-center">Taxes calculated at checkout</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
