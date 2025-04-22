"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { products } from "@/lib/products"
import AddToCartButton from "@/components/add-to-cart-button"
import { ArrowRight, Star, TrendingUp, Package, Clock, Search } from "lucide-react"
import { useQuantityStore } from "@/store/quantityStore"

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState(products)
  const { getQuantity, setQuantity } = useQuantityStore()

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let result = products

    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter((product) => (product.category || "uncategorized") === activeCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)),
      )
    }

    setFilteredProducts(result)
  }, [activeCategory, searchQuery])

  // Featured products (first 3 products for demo)
  const featuredProducts = products.slice(0, 3)

  // New arrivals (last 4 products for demo)
  const newArrivals = [...products].reverse().slice(0, 4)

  // Categories (derived from products)
  const categories = ["all", ...new Set(products.map((product) => product.category || "uncategorized"))]

  if (!isMounted) {
    return null;
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-[#183d5a] text-white">
        <div className="container mx-auto px-4 py-24 relative z-10 max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
              Discover Quality Products for Your Lifestyle
            </h1>
            <p className="text-lg mb-8 text-blue-100">
              Explore our curated collection of premium products designed to
              enhance your everyday experience.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#featured"
                className="bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Shop Featured
              </Link>
              <Link
                href="#new-arrivals"
                className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-black transition-colors"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Categories */}
      <section id="categories" className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <div className="flex overflow-x-auto pb-2 gap-2 w-full md:w-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  activeCategory === category
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Our Products */}
      <section id="featured" className=" bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-gray-900 text-center tracking-tight">Our Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
            {featuredProducts.map((product) => (
              <div key={product.id} className="flex flex-col bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 h-full">
                <Link href={`/products/${product.id}`} className="block overflow-hidden rounded-t-xl">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="object-cover object-center w-full h-52 md:h-56 lg:h-60 xl:h-64 hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="flex-1 flex flex-col p-5">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-lg font-semibold mb-1 hover:text-blue-600 transition-colors text-center">{product.name}</h3>
                  </Link>
                  <p className="text-gray-500 text-sm mb-4 text-center line-clamp-2 min-h-[40px]">{product.description}</p>
                  <div className="mt-auto flex flex-col gap-2">
                    <span className="text-2xl font-bold text-black text-center mb-2">${product.price}</span>
                    <AddToCartButton product={product} quantity={Number.isFinite(getQuantity(product.id)) ? getQuantity(product.id) : 1} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {/* <section id="new-arrivals" className="py-16 bg-gray-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">New Arrivals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {newArrivals.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6 flex flex-col">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="object-cover object-center rounded mb-4 w-full h-64"
                />
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-700 mb-4 flex-1">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-black">${product.price}</span>
                  <AddToCartButton product={product} quantity={Number.isFinite(getQuantity(product.id)) ? getQuantity(product.id) : 1} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Premium Quality</h3>
            <p className="text-gray-600">
              All our products are made with the highest quality materials and
              craftsmanship.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Free Shipping</h3>
            <p className="text-gray-600">
              Enjoy free shipping on all orders over $100 within the continental
              US.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">30-Day Returns</h3>
            <p className="text-gray-600">
              Not satisfied? Return any item within 30 days for a full refund.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            What Our Customers Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((testimonial) => (
              <div
                key={testimonial}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "I absolutely love the products from this store. The quality
                  is exceptional and the customer service is outstanding. Will
                  definitely be ordering again!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">Verified Customer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gray-900 text-white rounded-lg p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Join Our Newsletter
            </h2>
            <p className="text-gray-300 mb-6">
              Subscribe to get special offers, free giveaways, and
              once-in-a-lifetime deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-4 py-3 rounded-md text-black focus:outline-none"
              />
              <button className="bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* All Products */}
      {/* <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Our Products</h2>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">
              No products found. Try a different search or category.
            </p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-4">
                  <Link href={`/products/${product.id}`}>
                    <Image
                      src={
                        product.image || "/placeholder.svg?height=500&width=500"
                      }
                      alt={product.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                </div>
                <Link
                  href={`/products/${product.id}`}
                  className="hover:text-gray-700"
                >
                  <h3 className="text-lg font-medium">{product.name}</h3>
                </Link>
                <p className="text-gray-700 mt-1 font-bold">
                  ${product.price.toFixed(2)}
                </p>
                {/* Quantity Selector */}
                {/* <div className="flex items-center border rounded-md w-24 mt-2 mb-2">
                  <button
                    onClick={() =>
                      setQuantity(
                        product.id,
                        Math.max(1, getQuantity(product.id) - 1)
                      )
                    }
                    className="px-2 py-1 text-gray-600 hover:text-black"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={Number.isFinite(getQuantity(product.id)) ? getQuantity(product.id) : 1}
                    onChange={(e) =>
                      setQuantity(
                        product.id,
                        Math.max(1, Number(e.target.value))
                      )
                    }
                    className="w-10 text-center border-none focus:ring-0 outline-none"
                  />
                  <button
                    onClick={() =>
                      setQuantity(product.id, getQuantity(product.id) + 1)
                    }
                    className="px-2 py-1 text-gray-600 hover:text-black"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <div className="mt-2">
                  <AddToCartButton
                    product={product}
                    quantity={Number.isFinite(getQuantity(product.id)) ? getQuantity(product.id) : 1}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section> */} 
    </main>
  );
}
