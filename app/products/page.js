"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import AddToCartButton from "@/components/add-to-cart-button";
import { Star, Heart, Filter } from "lucide-react";
import { useQuantityStore } from "@/store/quantityStore";

const PLACEHOLDER = "/placeholder.svg";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [productImages, setProductImages] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const { getQuantity } = useQuantityStore();
  const [productRatings, setProductRatings] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: products, error } = await supabase.from("products").select("*, categories(name)");
      if (!error && products) setProducts(products);
    };
    const fetchCategories = async () => {
      const { data: cats } = await supabase.from("categories").select("name");
      if (cats) setCategories(["all", ...cats.map((c) => c.name)]);
    };
    const fetchImages = async () => {
      const { data: imgs } = await supabase.from("productimages").select("product_id, url");
      if (imgs) {
        const imgMap = {};
        imgs.forEach(img => {
          if (!imgMap[img.product_id]) imgMap[img.product_id] = img.url;
        });
        setProductImages(imgMap);
      }
    };
    fetchProducts();
    fetchCategories();
    fetchImages();
  }, []);

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
  }, [products]);

  const filtered = products.filter((p) =>
    (activeCategory === "all" || p.categories?.name === activeCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 m-4">
      {/* Header Section */}
      <section className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-800">Our Products</h1>
          <div className="flex gap-2 items-center w-full md:w-auto">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 transition-all"
              onClick={() => setShowFilter((v) => !v)}
            >
              <Filter className="w-4 h-4" />
              Categories
            </button>
            <input
              className="flex-1 md:w-56 px-3 py-2 rounded-full border border-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none text-gray-700 bg-white shadow-sm text-sm"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div
          className={`transition-all duration-300 ${
            showFilter ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden bg-gray-50`}
        >
          <div className="container mx-auto max-w-7xl px-4 py-2 flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setShowFilter(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto max-w-8xl  py-6 ">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24">
            <Image
              src={PLACEHOLDER}
              alt="No products"
              width={120}
              height={120}
              className="mb-4 opacity-60"
            />
            <h2 className="text-lg font-medium text-gray-500">
              No products found
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group relative flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 h-full"
              >
                {/* Favorite Button */}
                <button className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-pink-50 transition-colors">
                  <Heart className="h-4 w-4 text-pink-500 group-hover:fill-pink-100" />
                </button>

                {/* Product Image */}
                <Link
                  href={`/products/${product.id}`}
                  className="block overflow-hidden"
                >
                  <Image
                    src={
                      productImages[product.id] || product.image || PLACEHOLDER
                    }
                    alt={product.name}
                    width={240}
                    height={180}
                    className="object-cover w-full h-80 bg-gray-100 group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Product Info */}
                <div className="p-3 flex flex-col gap-2">
                  {/* Title and Category */}
                  <div>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {product.name}
                      </h3>
                    </Link>
                    {product.categories?.name && (
                      <span className="text-xs text-gray-500">
                        {product.categories.name}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.round(productRatings[product.id]?.average || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">
                      {productRatings[product.id]?.average || 0} ({productRatings[product.id]?.count || 0})
                    </span>
                  </div>

                  {/* Price and Add to Cart */}
                  <div className="mt-1 flex flex-col gap-2 px-2">
                    <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900 self-start">
                      ${product.price}
                    </span>
                    <div className="flex flex-row items-center gap-2 w-full">
                      <AddToCartButton
                        product={product}
                        quantity={
                          Number.isFinite(getQuantity(product.id))
                            ? getQuantity(product.id)
                            : 1
                        }
                        className="w-full px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors min-w-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}