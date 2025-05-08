"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch 5-star reviews with their associated products
        const { data, error } = await supabase
          .from('product_reviews')
          .select(`
            *,
            products:product_id (
              name,
              images:productimages (
                url
              )
            )
          `)
          .eq('rating', 5)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Filter out reviews without product images and take only the first 5
        const validReviews = data
          .filter(review => review.products?.images?.[0]?.url)
          .slice(0, 5)

        setReviews(validReviews)
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoPlaying || reviews.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Rotate every 2 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, reviews.length])

  const nextReview = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
    )
    // Pause auto-rotation when manually navigating
    setIsAutoPlaying(false)
  }

  const prevReview = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    )
    // Pause auto-rotation when manually navigating
    setIsAutoPlaying(false)
  }

  // Resume auto-rotation after 5 seconds of manual navigation
  useEffect(() => {
    if (!isAutoPlaying) {
      const timeout = setTimeout(() => {
        setIsAutoPlaying(true)
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [isAutoPlaying])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return null
  }

  const currentReview = reviews[currentIndex]

  return (
    <div className="relative bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevReview}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors z-10"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          <button
            onClick={nextReview}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors z-10"
            aria-label="Next review"
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </button>

          {/* Reviews Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              currentReview,
              reviews[(currentIndex + 1) % reviews.length],
              reviews[(currentIndex + 2) % reviews.length]
            ].map((review, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col md:flex-row">
                  {/* Product Image - Smaller on mobile */}
                  <div className="relative h-32 md:h-40 w-full md:w-1/3">
                    <Image
                      src={review.products.images[0].url}
                      alt={review.products.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Review Content - More emphasis on mobile */}
                  <div className="p-4 md:p-5 flex flex-col justify-center flex-1">
                    <div className="flex text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    
                    <blockquote className="text-sm md:text-base text-gray-700 mb-3 line-clamp-3 md:line-clamp-4">
                      "{review.comment}"
                    </blockquote>

                    <div className="mt-auto">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">
                          {review.reviewer_name || 'Anonymous'}
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {review.products.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 