'use client'

import { useEffect } from 'react'

export default function CartClearer() {
  useEffect(() => {
    // Clear cart from localStorage
    localStorage.removeItem('cart')
    // Dispatch event to update cart counter in navbar
    window.dispatchEvent(new Event('cartUpdated'))
  }, [])

  return null
} 