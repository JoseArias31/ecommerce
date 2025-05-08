"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"

const reviews = [
  {
    id: 1,
    name: "Sarah Johnson",
    rating: 5,
    comment: "Absolutely love the quality of the products! The customer service was exceptional, and delivery was super fast. Will definitely shop here again!",
    image: "/placeholder.svg",
    date: "2024-02-15"
  },
  {
    id: 2,
    name: "Michael Chen",
    rating: 5,
    comment: "Great shopping experience! The products exceeded my expectations, and the prices are very competitive. Highly recommend!",
    image: "/placeholder.svg",
    date: "2024-02-10"
  },
  {
    id: 3,
    name: "Emma Wilson",
    rating: 5,
    comment: "Fantastic store with amazing products. The attention to detail and quality is impressive. Will be a returning customer!",
    image: "/placeholder.svg",
    date: "2024-02-05"
  }
]

export default function ReviewsCarousel() {
  const [currentReview, setCurrentReview] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handlePrev = () => {
    setIsAutoPlaying(false)
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length)
    setTimeout(() => setIsAutoPlaying(true), 5000)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentReview((prev) => (prev + 1) % reviews.length)
    setTimeout(() => setIsAutoPlaying(true), 5000)
  }

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-8 md:mb-12">
          What Our Customers Say
        </h2>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            {[currentReview, (currentReview + 1) % reviews.length, (currentReview + 2) % reviews.length].map((index) => {
              const review = reviews[index]
              return (
                <div
                  key={review.id}
                  className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-start gap-2 md:gap-4">
                    <div className="relative w-8 h-8 md:w-12 md:h-12 flex-shrink-0">
                      <Image
                        src={review.image}
                        alt={review.name}
                        fill
                        className="rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                        <h3 className="font-semibold text-sm md:text-base truncate">
                          {review.name}
                        </h3>
                        <span className="text-gray-400 text-[10px] md:text-xs">•</span>
                        <span className="text-gray-500 text-[10px] md:text-xs">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex text-yellow-400 mb-1.5 md:mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 md:h-4 md:w-4 ${
                              i < review.rating ? "fill-current" : ""
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600 text-[11px] md:text-sm line-clamp-3 md:line-clamp-4">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 bg-white p-1.5 md:p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-3 w-3 md:h-5 md:w-5 text-gray-600" />
          </button>
          <button
            onClick={handleNext}
            className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 bg-white p-1.5 md:p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Next review"
          >
            <ChevronRight className="h-3 w-3 md:h-5 md:w-5 text-gray-600" />
          </button>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-1.5 md:gap-2 mt-4 md:mt-6">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false)
                  setCurrentReview(index)
                  setTimeout(() => setIsAutoPlaying(true), 5000)
                }}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-colors ${
                  index === currentReview
                    ? "bg-gray-900"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 