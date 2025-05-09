"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import AddToCartButton from "@/components/add-to-cart-button"
import { ArrowRight, Star, TrendingUp, Package, Clock, Heart, ShoppingBag } from "lucide-react"
import { useQuantityStore } from "@/store/quantityStore"
import ReviewsCarousel from "@/components/ReviewsCarousel"

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [allProducts, setAllProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState(["all"])
  const { getQuantity, setQuantity } = useQuantityStore()
  const [cartCount, setCartCount] = useState(0)
  const [productRatings, setProductRatings] = useState({})
  // Add newsletter states
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState('idle')

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
      const { data: products, error } = await supabase
        .from("products")
        .select("*, categories(name)"); // Join categories table to get name
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
      // Map first image and category name to each product
      const productsWithImage = products.map(product => {
        const imgs = (images || []).filter(img => img.product_id === product.id);
        return {
          ...product,
          image: imgs[0]?.url || "/placeholder.svg",
          category: product.categories?.name || null, // Map category name
        };
      });
      setAllProducts(productsWithImage);
      setFilteredProducts(productsWithImage);

      // Fetch categories from DB
      const { data: cats, error: catError } = await supabase.from("categories").select("name");
      if (!catError && cats) {
        setCategories(["all", ...cats.map(cat => cat.name)]);
      }
    };
    fetchProducts();
  }, [])

  useEffect(() => {
    let result = allProducts
    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter((product) => product.category === activeCategory)
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

  // Featured products: show all filtered products for the active category
  const featuredProducts = filteredProducts;

  // New arrivals (last 4 products for demo)
  const newArrivals = [...allProducts].reverse().slice(0, 4)

  // Always loop hero images from all products, not filtered
  const [randomHeroIndex, setRandomHeroIndex] = useState(() => Math.floor(Math.random() * allProducts.length));
  useEffect(() => {
    if (!allProducts.length) return;
    const interval = setInterval(() => {
      setRandomHeroIndex(Math.floor(Math.random() * allProducts.length));
    }, 4000);
    return () => clearInterval(interval);
  }, [allProducts.length]);

  const heroProduct = allProducts.length ? allProducts[randomHeroIndex] : null;

  // Fetch ratings for all products
  useEffect(() => {
    const fetchRatings = async () => {
      const { data: reviews, error } = await supabase
        .from('product_reviews')
        .select('product_id, rating');
      if (!error && reviews) {
        // Group reviews by product_id
        const grouped = {};
        reviews.forEach(r => {
          if (!grouped[r.product_id]) grouped[r.product_id] = [];
          grouped[r.product_id].push(r.rating);
        });
        // Calculate average and count for each product
        const ratings = {};
        Object.entries(grouped).forEach(([productId, ratingsArr]) => {
          const count = ratingsArr.length;
          const avg = count > 0 ? ratingsArr.reduce((sum, r) => sum + (r || 0), 0) / count : 0;
          ratings[productId] = {
            average: Math.round(avg * 10) / 10,
            count,
          };
        });
        setProductRatings(ratings);
      }
    };
    fetchRatings();
  }, [allProducts]);

  // Add newsletter submit handler
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setSubscribeStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setSubscribeStatus('success')
      setEmail('')
      setName('')
    } catch (err) {
      console.error('Newsletter subscription error:', err)
      setSubscribeStatus('error')
    }
  }

  if (!isMounted) {
    return null
  }


  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-10 max-w-7xl">
          {/* Animated Dots Background */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-[#1e40af]/5 animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-16 h-16 rounded-full bg-[#1e40af]/10 animate-pulse [animation-delay:1s]"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full bg-[#1e40af]/5 animate-pulse [animation-delay:2s]"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            {/* Left Side - Text */}
            <div className="md:w-1/2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1e40af]/5 rounded-full text-sm font-medium text-[#1e40af] mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1e40af] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1e40af]"></span>
                </span>
                New Collection 2025
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
                Discover <span className="text-[#1e40af]">Exceptional</span>{" "}
                Products
              </h1>

              <p className="text-gray-600 mb-8 max-w-md mx-auto md:mx-0">
                Curated selection of premium items designed to elevate your
                everyday experience
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link
                  href="#featured"
                  className="group relative px-6 py-3 bg-[#1e40af] text-white rounded-full font-medium overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#1e40af]/20"
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
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Side - Interactive Product Showcase */}
            <div className="w-full md:w-1/2 relative">
              <div className="flex items-center justify-center">
                <div className="w-full h-64 md:h-96 relative overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    key={heroProduct?.id || 'fallback'}
                    src={heroProduct?.image && heroProduct?.image !== '' ? heroProduct.image : '/placeholder.svg'}
                    alt={heroProduct?.name || ''}
                    fill
                    className="object-cover object-center transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-white text-blue-600 rounded px-2 py-1 text-xs font-semibold shadow">
                    20% OFF
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                    <h3 className="text-xl font-bold">{heroProduct?.name}</h3>
                    <p className="text-sm">${heroProduct?.price ?? '0.00'}</p>
                    <Link href={`/products/${heroProduct?.id || ''}`} className="underline text-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-col md:flex-row items-center  gap-4">
         {/* Category Pills */}
         <section id="categories" className="container mx-auto px-6 py-8">
          <div className="flex overflow-x-auto gap-2 w-full no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-3 rounded-full whitespace-nowrap transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-[#1e40af] text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </section>
        {/* Search Bar */}
        <section className="container mx-auto px-6 ">
          <input
            type="text"
            className="w-full md:w-1/2 px-4 py-2 rounded-full border border-gray-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-700 bg-white shadow-sm text-base"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </section>

       
      </div>

      {/* Our Products */}
      <section id="featured" className="bg-gray-50 py-16">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              <span className="relative">
                Featured Products
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#1e40af] rounded-full"></span>
              </span>
            </h2>
            <Link
              href="/products"
              className="mt-4 md:mt-0 text-[#1e40af] font-medium flex items-center gap-1 hover:underline"
            >
              View all products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group relative flex flex-col bg-white/80 backdrop-blur-md rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 h-full"
              >
                {/* BADGE: Example for new products */}
                {product.isNew && (
                  <span className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg z-20 animate-pulse">
                    New
                  </span>
                )}
                <div className="relative">
                  <Link
                    href={`/products/${product.id}`}
                    className="block overflow-hidden rounded-t-xl"
                  >
                    <Image
                      src={
                        product.image && product.image !== ""
                          ? product.image
                          : "/placeholder.svg"
                      }
                      alt={product.name}
                      width={400}
                      height={400}
                      className="object-cover object-center w-full h-40 sm:h-48 md:h-56 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                    />
                  </Link>
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                    <button className="p-1 sm:p-1.5 bg-white/80 rounded-full shadow-md hover:bg-blue-50 transition-colors duration-300 group active:scale-90">
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 group-hover:fill-indigo-100 transition-all" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col p-2 sm:p-3 md:p-4 gap-1 sm:gap-2">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold mb-0.5 sm:mb-1 group-hover:text-blue-700 transition-colors duration-300 truncate">
                      {product.name}
                    </h3>
                  </Link>
                  {/* Star rating */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 ${
                          i < Math.round(productRatings[product.id]?.average || 0)
                            ? "text-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                    <span className="text-[10px] sm:text-xs text-gray-500 ml-0.5 sm:ml-1">
                      {productRatings[product.id]?.average || 0} ({productRatings[product.id]?.count || 0})
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mb-1 sm:mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 drop-shadow-sm">
                      ${product.price}
                    </span>
                    <span className="text-[8px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                      In Stock
                    </span>
                  </div>
                  <AddToCartButton
                    product={product}
                    quantity={
                      Number.isFinite(getQuantity(product.id))
                        ? getQuantity(product.id)
                        : 1
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] sm:text-sm font-bold py-1 sm:py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-600 hover:scale-105 active:scale-95 transition-all duration-200 mt-1 sm:mt-2"
                  />
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
            <div className="bg-[#1e40af]/10 p-5 rounded-full mb-6 group-hover:bg-[#1e40af]/20 transition-colors duration-300">
              <TrendingUp className="h-7 w-7 text-[#1e40af]" />
            </div>
            <h3 className="font-bold text-xl mb-3">Premium Quality</h3>
            <p className="text-gray-600 leading-relaxed">
              All our products are made with the highest quality materials and
              craftsmanship to ensure lasting satisfaction.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-[#1e40af]/10 p-5 rounded-full mb-6 group-hover:bg-[#1e40af]/20 transition-colors duration-300">
              <Package className="h-7 w-7 text-[#1e40af]" />
            </div>
            <h3 className="font-bold text-xl mb-3">Free Shipping</h3>
            <p className="text-gray-600 leading-relaxed">
              Enjoy free shipping on all orders over $100 within the continental
              US with fast and reliable delivery.
            </p>
          </div>
          <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="bg-[#1e40af]/10 p-5 rounded-full mb-6 group-hover:bg-[#1e40af]/20 transition-colors duration-300">
              <Clock className="h-7 w-7 text-[#1e40af]" />
            </div>
            <h3 className="font-bold text-xl mb-3">30-Day Returns</h3>
            <p className="text-gray-600 leading-relaxed">
              Not satisfied? Return any item within 30 days for a full refund,
              no questions asked.
            </p>
          </div>
        </div>
      </section>

    
           {/* Reviews Carousel Section */}
      <section className="bg-gray-50 ">
        <ReviewsCarousel />
      </section>
      

      {/* Newsletter */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-[#1e40af] text-white rounded-3xl p-10 md:p-16 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Our Newsletter
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Subscribe to get special offers, free giveaways, and
              once-in-a-lifetime deals delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className=" flex-grow px-6 py-4 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 sm:w-1/3"
                  disabled={subscribeStatus === 'loading'}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow px-6 py-4 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                  required
                  disabled={subscribeStatus === 'loading'}
                />
              </div>
              <button
                type="submit"
                className="group relative overflow-hidden bg-white text-[#1e40af] px-8 py-4 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={subscribeStatus === 'loading'}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {subscribeStatus === 'loading' ? 'Submitting...' : 'Subscribe'}
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </form>

            {/* Status messages */}
            {subscribeStatus === 'success' && (
              <p className="text-green-300 mt-4">You've been subscribed successfully!</p>
            )}
            {subscribeStatus === 'error' && (
              <p className="text-red-300 mt-4">There was an error. Please try again.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}