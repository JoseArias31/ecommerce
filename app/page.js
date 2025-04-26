"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import AddToCartButton from "@/components/add-to-cart-button"
import { ArrowRight, Star, TrendingUp, Package, Clock, Heart, ShoppingBag } from "lucide-react"
import { useQuantityStore } from "@/store/quantityStore"

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [allProducts, setAllProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const { getQuantity, setQuantity } = useQuantityStore()
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

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch products and their first image
  useEffect(() => {
    const fetchProducts = async () => {
      // Fetch all products
      const { data: products, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("Error fetching products:", error);
        return;
      }
      // Fetch all images for these products
      const productIds = products.map(p => p.id);
      const { data: images, error: imgError } = await supabase.from("productimages").select("id, product_id, url");
      if (imgError) {
        console.error("Error fetching images:", imgError);
      }
      // Map first image to each product
      const productsWithImage = products.map(product => {
        const imgs = (images || []).filter(img => img.product_id === product.id);
        return { ...product, image: imgs[0]?.url || "/placeholder.svg" };
      });
      setAllProducts(productsWithImage);
      setFilteredProducts(productsWithImage);
    };
    fetchProducts();
  }, [])

  useEffect(() => {
    let result = allProducts

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
  }, [activeCategory, searchQuery, allProducts])

  // Featured products (first 3 products for demo)
  const featuredProducts = allProducts.slice(0, 3)

  // New arrivals (last 4 products for demo)
  const newArrivals = [...allProducts].reverse().slice(0, 4)

  // Categories (derived from products)
  const categories = ["all", ...new Set(allProducts.map((product) => product.category || "uncategorized"))]

  // Random hero carousel index (random mode)
  const [randomHeroIndex, setRandomHeroIndex] = useState(
    () => Math.floor(Math.random() * featuredProducts.length)
  )
  useEffect(() => {
    const interval = setInterval(() => {
      setRandomHeroIndex(
        Math.floor(Math.random() * featuredProducts.length)
      )
    }, 4000)
    return () => clearInterval(interval)
  }, [featuredProducts.length])

  if (!isMounted) {
    return null
  }


  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-10 max-w-7xl">
          {/* Animated Dots Background */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(#2a4365_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-[#2a4365]/5 animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-16 h-16 rounded-full bg-[#2a4365]/10 animate-pulse [animation-delay:1s]"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full bg-[#2a4365]/5 animate-pulse [animation-delay:2s]"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            {/* Left Side - Text */}
            <div className="md:w-1/2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2a4365]/5 rounded-full text-sm font-medium text-[#2a4365] mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2a4365] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2a4365]"></span>
                </span>
                New Collection 2025
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
                Discover <span className="text-[#2a4365]">Exceptional</span> Products
              </h1>

              <p className="text-gray-600 mb-8 max-w-md mx-auto md:mx-0">
                Curated selection of premium items designed to elevate your everyday experience
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link
                  href="#featured"
                  className="group relative px-6 py-3 bg-[#2a4365] text-white rounded-full font-medium overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#2a4365]/20"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explore Collection
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>

                <div className="relative">
                <Link href="/checkout">
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {cartCount}
                  </div>
                   <button className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors duration-300 flex items-center gap-2">
                     <ShoppingBag className="w-4 h-4" />
                    Cart
                  </button></Link>
                </div>
              </div>
            </div>

            {/* Right Side - Interactive Product Showcase */}
            <div className="w-full md:w-1/2 relative">
              <div className="flex items-center justify-center">
                <div className="w-full h-64 md:h-96 relative overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    key={featuredProducts[randomHeroIndex]?.id}
                    src={featuredProducts[randomHeroIndex]?.image && featuredProducts[randomHeroIndex]?.image !== "" ? featuredProducts[randomHeroIndex]?.image : "/placeholder.svg"}
                    alt={featuredProducts[randomHeroIndex]?.name || ""}
                    fill
                    className="object-cover object-center transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white text-indigo-600 rounded px-2 py-1 text-xs font-semibold shadow">
                    20% OFF
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                    <h3 className="text-xl font-bold">{featuredProducts[randomHeroIndex]?.name}</h3>
                    <p className="text-sm">${featuredProducts[randomHeroIndex]?.price ?? '0.00'}</p>
                    <Link href={`/products/${featuredProducts[randomHeroIndex]?.id || ''}`} className="underline text-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section id="categories" className="container mx-auto px-6 py-8">
        <div className="flex overflow-x-auto pb-2 gap-2 w-full no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-3 rounded-full whitespace-nowrap transition-all duration-300 ${
                activeCategory === category
                  ? "bg-[#2a4365] text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Our Products */}
      <section id="featured" className="bg-gray-50 py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              <span className="relative">
                Featured Products
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#2a4365] rounded-full"></span>
              </span>
            </h2>
            <Link
              href="/products"
              className="mt-4 md:mt-0 text-[#2a4365] font-medium flex items-center gap-1 hover:underline"
            >
              View all products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl h-full"
              >
                <div className="relative">
                  <Link href={`/products/${product.id}`} className="block overflow-hidden">
                    <Image
                      src={product.image && product.image !== "" ? product.image : "/placeholder.svg"}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="object-cover object-center w-full h-72 transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-300">
                      <Heart className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 
                </div>

                <div className="flex-1 flex flex-col p-6">
                

                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-[#2a4365] transition-colors duration-300">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">{product.description}</p>

                  <div className="mt-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                      <span className="text-sm text-green-600 font-medium">In Stock</span>
                    </div>
                    <AddToCartButton
                      product={product}
                      quantity={Number.isFinite(getQuantity(product.id)) ? getQuantity(product.id) : 1}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-[#2a4365]/10 p-5 rounded-full mb-6 group-hover:bg-[#2a4365]/20 transition-colors duration-300">
              <TrendingUp className="h-7 w-7 text-[#2a4365]" />
            </div>
            <h3 className="font-bold text-xl mb-3">Premium Quality</h3>
            <p className="text-gray-600 leading-relaxed">
              All our products are made with the highest quality materials and craftsmanship to ensure lasting
              satisfaction.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-[#2a4365]/10 p-5 rounded-full mb-6 group-hover:bg-[#2a4365]/20 transition-colors duration-300">
              <Package className="h-7 w-7 text-[#2a4365]" />
            </div>
            <h3 className="font-bold text-xl mb-3">Free Shipping</h3>
            <p className="text-gray-600 leading-relaxed">
              Enjoy free shipping on all orders over $100 within the continental US with fast and reliable delivery.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-[#2a4365]/10 p-5 rounded-full mb-6 group-hover:bg-[#2a4365]/20 transition-colors duration-300">
              <Clock className="h-7 w-7 text-[#2a4365]" />
            </div>
            <h3 className="font-bold text-xl mb-3">30-Day Returns</h3>
            <p className="text-gray-600 leading-relaxed">
              Not satisfied? Return any item within 30 days for a full refund, no questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="relative inline-block">
              What Our Customers Say
              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#2a4365] rounded-full"></span>
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                image: "/placeholder.svg?height=100&width=100",
                text: "I absolutely love the products from this store. The quality is exceptional and the customer service is outstanding. Will definitely be ordering again!",
                role: "Fashion Designer",
              },
              {
                name: "Michael Chen",
                image: "/placeholder.svg?height=100&width=100",
                text: "The attention to detail in every product I've purchased is remarkable. Fast shipping and beautiful packaging make the whole experience feel premium.",
                role: "Tech Entrepreneur",
              },
              {
                name: "Emma Rodriguez",
                image: "/placeholder.svg?height=100&width=100",
                text: "I've been a loyal customer for years now. Their commitment to quality and customer satisfaction is unmatched. Highly recommend to everyone!",
                role: "Interior Designer",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
              >
                <div className="flex text-yellow-400 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed flex-grow">"{testimonial.text}"</p>
                <div className="flex items-center mt-auto">
                  <div className="w-14 h-14 bg-gray-200 rounded-full mr-4 overflow-hidden">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-[#2a4365]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-[#2a4365] text-white rounded-3xl p-10 md:p-16 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Newsletter</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-6 py-4 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
              />
              <button className="group relative overflow-hidden bg-white text-[#2a4365] px-8 py-4 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
                <span className="relative z-10 flex items-center gap-2">
                  Subscribe
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}