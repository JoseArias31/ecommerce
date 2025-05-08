"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, Heart, Share2, Truck, ShieldCheck, RotateCcw, Star, ChevronRight, ChevronLeft } from "lucide-react"
import AddToCartButton from "@/components/add-to-cart-button"
import { useQuantityStore } from "@/store/quantityStore"

export default function ProductPage({ params }) {
  const { id } = params
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [productImages, setProductImages] = useState([])
  const [recentlyViewedImages, setRecentlyViewedImages] = useState({})
  const [relatedProductImages, setRelatedProductImages] = useState({})
  const quantity = useQuantityStore((state) => state.quantities[product?.id] || 1)
  const setQuantity = useQuantityStore((state) => state.setQuantity)

  useEffect(() => {
    const fetchData = async () => {
      // Fetch product
      const { data: product, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
        setProductImages([]);
      } else {
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
      // Fetch related products
      const { data: relData, error: relError } = await supabase.from("products").select("*").neq("id", id).limit(4);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <span>Loading...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
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
        <div className="space-y-4">
          {/* Main image with zoom effect */}
          <div
            className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleImageHover}
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
                className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Share product"
              >
                <Share2 className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 ${
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
                <Star key={i} className={`h-5 w-5 ${i < 4 ? "fill-current" : ""}`} />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">4.0 (24 reviews)</span>
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
          <button className="px-4 py-2 border border-black rounded-md hover:bg-black hover:text-white transition-colors">
            Write a Review
          </button>
        </div>

        {/* Sample Reviews */}
        <div className="space-y-6">
          {[1, 2].map((review) => (
            <div key={review} className="border-b pb-6">
              <div className="flex justify-between">
                <div>
                  <div className="flex text-yellow-400 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < 5 ? "fill-current" : ""}`} />
                    ))}
                  </div>
                  <h3 className="font-medium">Great product, highly recommend!</h3>
                </div>
                <span className="text-sm text-gray-500">2 weeks ago</span>
              </div>
              <p className="mt-2 text-gray-600">
                This product exceeded my expectations. The quality is excellent and it looks even better in person.
                Would definitely purchase again.
              </p>
              <div className="mt-2 text-sm text-gray-500">
                <span>John D. - Verified Buyer</span>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-6 w-full py-2 border border-gray-300 rounded-md text-center hover:bg-gray-50 transition-colors">
          Load More Reviews
        </button>
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
              <p className="text-gray-700">${relatedProduct.price.toFixed(2)}</p>
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
    </div>
  )
}
