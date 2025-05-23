"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, Heart, Share2, Truck, ShieldCheck, RotateCcw, Star, ChevronRight, ChevronLeft, X, Check } from "lucide-react"
import AddToCartButton from "@/components/add-to-cart-button"
import { useQuantityStore } from "@/store/quantityStore"
import { useCountry } from "@/contexts/CountryContext"
import { useRouter } from "next/navigation"
import { formatPriceForCountry } from "@/lib/countryUtils"

export default function ProductPage({ params }) {
  const { id } = params
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [productImages, setProductImages] = useState([])
  const [recentlyViewedImages, setRecentlyViewedImages] = useState({})
  const [relatedProductImages, setRelatedProductImages] = useState({})
  const [reviews, setReviews] = useState([])
  const [user, setUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' })
  const [editingReview, setEditingReview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const quantity = useQuantityStore((state) => state.quantities[product?.id] || 1)
  const setQuantity = useQuantityStore((state) => state.setQuantity)
  const [showShareSuccess, setShowShareSuccess] = useState(false)
  const [productNotAvailable, setProductNotAvailable] = useState(false)
  const { country, getCountryData } = useCountry()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      // Fetch product
      const { data: product, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
        setProductImages([]);
      } else {
        // Check if product is available in the selected country
        if (!product.country_availability || !product.country_availability.includes(country)) {
          setProductNotAvailable(true);
          setProduct(null);
          setProductImages([]);
          return;
        }
        
        setProduct(product);
        // Fetch images for this product
        const { data: images, error: imgError } = await supabase.from("productimages").select("id, url, alt").eq("product_id", id);
        if (imgError) {
          console.error("Error fetching images:", imgError);
          setProductImages([]);
        } else {
          setProductImages(images);
        }
      }
      // Fetch related products in the same country
      const { data: relData, error: relError } = await supabase
        .from("products")
        .select("*")
        .neq("id", id)
        .contains('country_availability', [country])
        .limit(4);
      if (relError) console.error("Error fetching related products:", relError);
      else {
        setRelatedProducts(relData);
        // Fetch images for related products
        const { data: relImages, error: relImgError } = await supabase
          .from("productimages")
          .select("product_id, url")
          .in("product_id", relData.map(p => p.id));
        if (!relImgError && relImages) {
          const imgMap = {};
          relImages.forEach(img => {
            if (!imgMap[img.product_id]) imgMap[img.product_id] = img.url;
          });
          setRelatedProductImages(imgMap);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    fetchUser();
  }, []);

  // Fetch reviews (no join)
  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setReviews(data);
      }
    };
    fetchReviews();
  }, [id]);

  const galleryImages = productImages.length > 0 ? productImages.map(img => img.url) : ["/placeholder.svg"];

  const showArrows = galleryImages.length > 1;
  const handlePrev = () => setSelectedImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  const handleNext = () => setSelectedImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));

  // Store recently viewed products in localStorage
  useEffect(() => {
    if (!product) return
    const storedProducts = JSON.parse(localStorage.getItem("recentlyViewed") || "[]")
    if (!storedProducts.some((p) => p.id === product.id)) {
      const updatedProducts = [product, ...storedProducts].slice(0, 4)
      localStorage.setItem("recentlyViewed", JSON.stringify(updatedProducts))
      setRecentlyViewed(updatedProducts.filter((p) => p.id !== product.id))
      
      // Fetch images for recently viewed products
      const fetchRecentImages = async () => {
        const { data: recentImages, error } = await supabase
          .from("productimages")
          .select("product_id, url")
          .in("product_id", updatedProducts.filter(p => p.id !== product.id).map(p => p.id));
        if (!error && recentImages) {
          const imgMap = {};
          recentImages.forEach(img => {
            if (!imgMap[img.product_id]) imgMap[img.product_id] = img.url;
          });
          setRecentlyViewedImages(imgMap);
        }
      };
      fetchRecentImages();
    } else {
      setRecentlyViewed(storedProducts.filter((p) => p.id !== product.id))
      // Fetch images for recently viewed products
      const fetchRecentImages = async () => {
        const { data: recentImages, error } = await supabase
          .from("productimages")
          .select("product_id, url")
          .in("product_id", storedProducts.filter(p => p.id !== product.id).map(p => p.id));
        if (!error && recentImages) {
          const imgMap = {};
          recentImages.forEach(img => {
            if (!imgMap[img.product_id]) imgMap[img.product_id] = img.url;
          });
          setRecentlyViewedImages(imgMap);
        }
      };
      fetchRecentImages();
    }
  }, [product])

  const handleImageHover = (e) => {
    if (!isZoomed) return
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPosition({ x, y })
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in to leave a review')
      return
    }

    setIsSubmitting(true)
    try {
      // Fetch user details from users table
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      const reviewerName = userData?.name && userData.name.trim() !== ''
        ? userData.name
        : (userData?.email?.split('@')[0] || 'User');

      if (editingReview) {
        // Update existing review
        const { error } = await supabase
          .from('product_reviews')
          .update({
            rating: newReview.rating,
            title: newReview.title,
            comment: newReview.comment,
            reviewer_name: reviewerName,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReview.id)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        // Create new review
        const { error } = await supabase
          .from('product_reviews')
          .insert([{
            product_id: id,
            user_id: user.id,
            rating: newReview.rating,
            title: newReview.title,
            comment: newReview.comment,
            reviewer_name: reviewerName
          }])
        if (error) throw error
      }

      // Refresh reviews
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setReviews(data)
      }

      // Reset form
      setNewReview({ rating: 5, title: '', comment: '' })
      setEditingReview(null)
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh reviews
      const { data, error: fetchError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })

      if (!fetchError && data) {
        setReviews(data)
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Error deleting review. Please try again.')
    }
  }

  const handleEditReview = (review) => {
    setEditingReview(review)
    setNewReview({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment
    })
    setShowReviewForm(true);
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setNewReview({ rating: 5, title: '', comment: '' })
    setShowReviewForm(false);
  }

  const handleWriteReviewClick = () => {
    setEditingReview(null);
    setNewReview({ rating: 5, title: '', comment: '' });
    setShowReviewForm(true);
  }

  // Calculate average rating and review count
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount) : 0;
  const roundedRating = Math.round(averageRating * 10) / 10;

  const handleGalleryOpen = () => {
    setIsGalleryOpen(true)
    document.body.style.overflow = 'hidden' // Prevent scrolling when gallery is open
  }

  const handleGalleryClose = () => {
    setIsGalleryOpen(false)
    document.body.style.overflow = 'auto' // Re-enable scrolling
  }

  const handleShare = async () => {
    const productUrl = window.location.href
    const shareData = {
      title: product.name,
      text: `Check out this ${product.name} on our store!`,
      url: productUrl
    }

    try {
      // Try to use Web Share API if available (mostly on mobile devices)
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback for desktop: copy to clipboard
        await navigator.clipboard.writeText(productUrl)
        setShowShareSuccess(true)
        setTimeout(() => setShowShareSuccess(false), 2000)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback to clipboard if Web Share API fails
      try {
        await navigator.clipboard.writeText(productUrl)
        setShowShareSuccess(true)
        setTimeout(() => setShowShareSuccess(false), 2000)
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError)
        alert('Failed to share. Please try copying the URL manually.')
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : !product ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">
              {productNotAvailable 
                ? `This product is not available in your selected country (${getCountryData().name})` 
                : "Product not found"}
            </h1>
            <Link href="/products" className="text-blue-600 hover:underline">
              Back to products
            </Link>
          </div>
        ) : null}
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link href="/" className="hover:text-gray-900">
          Products
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images Section */}
        <div className="space-y-4 justify-items-center ">
          {/* Main image with zoom effect */}
          <div
            className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in w-[60%]"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleImageHover}
            onClick={handleGalleryOpen}
          >
            {/* Overlayed minimal arrows */}
            {showArrows && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={handlePrev}
                  className="pointer-events-auto bg-white/70 hover:bg-white transition p-1 rounded-full shadow border border-gray-200 absolute left-2 top-1/2 -translate-y-1/2 z-10"
                  style={{touchAction: 'manipulation'}}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={handleNext}
                  className="pointer-events-auto bg-white/70 hover:bg-white transition p-1 rounded-full shadow border border-gray-200 absolute right-2 top-1/2 -translate-y-1/2 z-10"
                  style={{touchAction: 'manipulation'}}
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
              </>
            )}
            <Image
              src={galleryImages[selectedImage]}
              alt={product.name}
              fill
              className={`object-cover object-center transition-transform duration-300 ${isZoomed ? "scale-150" : "scale-100"}`}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : {}
              }
            />
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button
                className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Add to wishlist"
              >
                <Heart className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare()
                }}
                className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors relative"
                aria-label="Share product"
              >
                {showShareSuccess ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Share2 className="h-5 w-5 text-gray-700" />
                )}
                {showShareSuccess && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                    Link copied!
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedImage(index)
                  handleGalleryOpen()
                }}
                className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 cursor-pointer ${
                  selectedImage === index ? "border-black" : "border-transparent"
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} - Image ${index + 1}`}
                  fill
                  className="object-cover object-center"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details Section */}
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Ratings */}
          <div className="flex items-center mt-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? "fill-current" : ""}`} />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">{roundedRating} ({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
          </div>

          {/* Price */}
          <p className="text-2xl mt-2">${product.price.toFixed(2)}</p>

          {/* Availability */}
          <div className="mt-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              In Stock
            </span>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-medium mb-2">Description</h2>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {/* Add to Cart Button */}
          <div className="mt-8">
            <AddToCartButton product={{
              ...product,
              images: productImages  // Include the product images in the product object
            }} quantity={Number.isFinite(quantity) ? quantity : 1} />
          </div>

          {/* Shipping & Returns */}
          <div className="mt-8 space-y-4 border-t pt-6">
            <div className="flex">
              <Truck className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Free Shipping</h3>
                <p className="text-sm text-gray-600">Free standard shipping on orders over $100</p>
              </div>
            </div>
            <div className="flex">
              <RotateCcw className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Easy Returns</h3>
                <p className="text-sm text-gray-600">30-day return policy</p>
              </div>
            </div>
            <div className="flex">
              <ShieldCheck className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Secure Checkout</h3>
                <p className="text-sm text-gray-600">SSL encrypted checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Specifications */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Product Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm text-gray-500">Material</h3>
              <p>Premium quality materials</p>
            </div>
            <div className="border-b pb-2">
              <h3 className="text-sm text-gray-500">Dimensions</h3>
              <p>H: 10cm x W: 20cm x D: 5cm</p>
            </div>
            <div className="border-b pb-2">
              <h3 className="text-sm text-gray-500">Weight</h3>
              <p>0.5 kg</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm text-gray-500">Origin</h3>
              <p>Designed in USA, Made in Italy</p>
            </div>
            <div className="border-b pb-2">
              <h3 className="text-sm text-gray-500">Warranty</h3>
              <p>1 year limited warranty</p>
            </div>
            <div className="border-b pb-2">
              <h3 className="text-sm text-gray-500">SKU</h3>
              <p>PRD-{product.id.toString().padStart(6, "0")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          {user && !editingReview && (
            <button
              onClick={handleWriteReviewClick}
              className="px-4 py-2 border border-black rounded-md hover:bg-black hover:text-white transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {(editingReview || (user && showReviewForm)) && (
          <form onSubmit={handleReviewSubmit} className="mb-8 p-6 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium mb-4">
              {editingReview ? 'Edit Review' : 'Write a Review'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className="text-2xl"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= newReview.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1" required>
                  Title 
                </label>
                <input
                  type="text"
                  id="title"
                  value={newReview.title}
                  onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Summarize your experience"
                  required
                />
              </div>
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1" required>
                  Review
                </label>
                <textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Share your experience with this product"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                </button>
                {editingReview && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {!editingReview && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex justify-between">
                  <div>
                    <div className="flex text-yellow-400 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <h3 className="font-medium">{review.title || 'Great product!'}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                    {user && review.user_id === user.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-gray-600">{review.comment}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <span>{review.reviewer_name || 'User'} </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.map((viewedProduct) => (
              <Link href={`/products/${viewedProduct.id}`} key={viewedProduct.id} className="group">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 mb-2">
                  <Image
                    src={recentlyViewedImages[viewedProduct.id] || "/placeholder.svg"}
                    alt={viewedProduct.name}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-medium group-hover:underline">{viewedProduct.name}</h3>
                <p className="text-gray-700">${viewedProduct.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {relatedProducts.map((relatedProduct) => (
            <Link href={`/products/${relatedProduct.id}`} key={relatedProduct.id} className="group">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 mb-2">
                <Image
                  src={relatedProductImages[relatedProduct.id] || "/placeholder.svg"}
                  alt={relatedProduct.name}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium group-hover:underline">{relatedProduct.name}</h3>
              <p className="text-gray-700">{formatPriceForCountry(relatedProduct.price, getCountryData())}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Back to products link */}
      <div className="mt-16 text-center">
        <Link href="/" className="inline-flex items-center text-sm hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to all products
        </Link>
      </div>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={handleGalleryClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
              aria-label="Close gallery"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Main image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={galleryImages[selectedImage]}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Navigation arrows */}
            {showArrows && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrev()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/50 p-2 rounded-lg">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(index)
                  }}
                  className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                    selectedImage === index ? "border-white" : "border-transparent"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover object-center"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
