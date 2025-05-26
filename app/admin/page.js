"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Edit, Trash2, Plus, FolderPlus } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { uploadImage } from "@/lib/storage/cliente";
import { useRef, useTransition } from "react";
import { convertBlobUrlToFile } from "@/lib/utils";
import { deleteImageFromBucket } from "@/lib/storage/deleteImageFromBucket";
import AdminProtectedRoute from '@/components/AdminProtectedRoute'

export default function AdminPage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [productImages, setProductImages] = useState([]); // Store images with alt text per product
  const [countries, setCountries] = useState([]); // Add state for countries
  const [selectedCountry, setSelectedCountry] = useState("all"); // Default to show all products

  const imageInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setCurrentProduct(prev => {
        // Calculate how many more images we can add
        const currentImagesCount = (prev.images || []).length;
        const remainingSlots = 8 - currentImagesCount;
        
        // Only take as many new images as we have slots for
        const newImages = filesArray.slice(0, remainingSlots).map(file => ({ 
          file, 
          url: URL.createObjectURL(file), 
          alt: "" 
        }));
        
        return {
          ...prev,
          images: [
            ...(prev.images || []),
            ...newImages
          ]
        };
      });
    }
  };

  const [isPending, startTransition] = useTransition();

  // Fetch images for all products
  const fetchProductImages = useCallback(async (products) => {
    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) return;
    const { data, error } = await supabase
      .from("productimages")
      .select("id, product_id, url, alt").in("product_id", productIds);
    if (!error && data) {
      setProductImages(data);
    } else {
      setProductImages([]);
    }
  }, []);

  // Load products and their images from Supabase on mount
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) console.error("Error fetching products:", error);
    else {
      setProducts(data);
      setFilteredProducts(data); // Initially set filtered products to all products
      await fetchProductImages(data);
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("id,name")
    console.log('Fetched categories:', data)
    if (error) console.error("Error fetching categories:", error)
    else setCategories(data)
  }
  
  // Fetch available countries
  const fetchCountries = async () => {
    const { data, error } = await supabase.from("countries").select("code,name")
    if (error) console.error("Error fetching countries:", error)
    else setCountries(data)
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchCountries() // Add this to fetch countries on mount
  }, [])

  // Filter products based on selected country
  useEffect(() => {
    if (selectedCountry === "all") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => {
        // If country_availability is null or empty, don't show when filtering by country
        if (!product.country_availability || product.country_availability.length === 0) {
          return false;
        }
        // Check if the selected country is in the product's country_availability array
        return product.country_availability.includes(selectedCountry);
      });
      setFilteredProducts(filtered);
    }
  }, [selectedCountry, products])

  // When editing, fetch images for this product
  const handleEdit = async (product) => {
    setCurrentProduct({
      ...product,
      category_id: product.category_id != null ? product.category_id.toString() : "",
      country_availability: product.country_availability || [], // Add this line
    });
    // Fetch images for this product
    const { data, error } = await supabase
      .from("productimages")
      .select("id, url, alt")
      .eq("product_id", product.id);
    if (!error && data) {
      setCurrentProduct((prev) => ({ ...prev, images: data }));
    } else {
      setCurrentProduct((prev) => ({ ...prev, images: [] }));
    }
    setIsEditing(true);
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      // 1. Get all images for the product
      const { data: images, error: imagesError } = await supabase
        .from("productimages")
        .select("id, url")
        .eq("product_id", id);
      if (images && Array.isArray(images)) {
        for (const img of images) {
          await deleteImageFromBucket(img.url, "images");
          // Remove from productimages table
          await supabase.from("productimages").delete().eq("id", img.id);
        }
      }
      // 2. Delete the product itself
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) console.error("Error deleting product:", error)
      else setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  // Remove the image field from newProduct
  const handleAddNew = () => {
    const newProduct = {
      name: "",
      description: "",
      price: 0,
      category_id: categories.length > 0 ? categories[0].id.toString() : "",
      images: [], // For new images
      country_availability: [], // Add this line
    };
    setCurrentProduct(newProduct);
    setIsEditing(true);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentProduct.category_id) {
      alert("Please select a category for the product.");
      return;
    }
    const payload = {
      name: currentProduct.name,
      description: currentProduct.description,
      price: currentProduct.price,
      category_id: currentProduct.category_id,
      country_availability: currentProduct.country_availability || [], // Add this line
    };
    try {
      let productId = currentProduct.id;
      let result;
      if (currentProduct.id) {
        result = await supabase
          .from("products")
          .update(payload)
          .eq("id", currentProduct.id)
          .select();
      } else {
        result = await supabase
          .from("products")
          .insert([payload])
          .select();
        productId = result.data?.[0]?.id;
      }
      if (result.error) throw result.error;
      // Sync productimages table
      if (productId) {
        // 1. Delete removed images
        const { data: oldImages } = await supabase
          .from("productimages")
          .select("id, url")
          .eq("product_id", productId);
        const keepUrls = (currentProduct.images || []).filter(img => img.url && !img.file).map((img) => img.url);
        const toDelete = (oldImages || []).filter((img) => !keepUrls.includes(img.url));
        for (const img of toDelete) {
          await supabase.from("productimages").delete().eq("id", img.id);
        }
        // 2. Upload new images (those with File objects)
        for (const img of (currentProduct.images || [])) {
          if (img.file) {
            const { imageUrl, error } = await uploadImage({ file: img.file, bucket: "images" });
            if (!error && imageUrl) {
              await supabase.from("productimages").insert({
                product_id: productId,
                url: imageUrl,
                alt: img.alt || "",
              });
            }
          }
        }
        // 3. Update alt text for existing images (those with url and id)
        for (const img of (currentProduct.images || [])) {
          if (img.id) {
            await supabase
              .from("productimages")
              .update({ alt: img.alt || "" })
              .eq("id", img.id);
          }
        }
      }
      await fetchProducts();
      setIsEditing(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling only for price (since we want to keep it as a number in state)
    if (name === "price") {
      const processedValue = value === "" ? "" : parseFloat(value);
      setCurrentProduct(prev => ({
        ...prev,
        [name]: processedValue
      }));
    } else {
      // For all other fields (including category_id), keep as string until save
      setCurrentProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  const handleImageAltChange = (e, index) => {
    const { value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? { ...img, alt: value } : img)
    }));
  }

  const handleRemoveImage = (index) => {
    setCurrentProduct(prev => ({
      ...prev,
      images: prev.images.filter((img, i) => i !== index)
    }));
  }

  // Handle country selection
  const handleCountryChange = (e) => {
    const { value, checked } = e.target;
    
    setCurrentProduct(prev => {
      const currentCountries = prev.country_availability || [];
      
      if (checked) {
        // Add country if checked and not already in the array
        return {
          ...prev,
          country_availability: [...currentCountries, value]
        };
      } else {
        // Remove country if unchecked
        return {
          ...prev,
          country_availability: currentCountries.filter(country => country !== value)
        };
      }
    });
  }

  // Add state for category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [categoryLoading, setCategoryLoading] = useState(false);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) {
      alert("Category name is required");
      return;
    }
    setCategoryLoading(true);
    const { error } = await supabase.from("categories").insert([
      { name: newCategory.name, description: newCategory.description }
    ]);
    setCategoryLoading(false);
    if (error) {
      alert("Error adding category: " + error.message);
      return;
    }
    setShowCategoryModal(false);
    setNewCategory({ name: "", description: "" });
    fetchCategories();
  };

  return (
    <AdminProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex justify-between items-center w-full sm:w-auto">
            <h1 className="text-3xl font-bold">Products</h1>
            <button
              className="btn-primary flex items-center sm:hidden"
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center">
              <label htmlFor="countryFilter" className="mr-2 text-sm font-medium">Filter by Country:</label>
              <select
                id="countryFilter"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="all">All Countries</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              className="btn-primary hidden sm:flex items-center"
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Product
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button className="btn-primary flex items-center w-full sm:w-auto justify-center" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </button>
            <button className="btn-secondary flex items-center w-full sm:w-auto justify-center" onClick={() => setShowCategoryModal(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Add Category
            </button>
          </div>
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Add New Category</h2>
              <form onSubmit={handleAddCategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={newCategory.name}
                    onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    value={newCategory.description}
                    onChange={e => setNewCategory(c => ({ ...c, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn-secondary" onClick={() => setShowCategoryModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={categoryLoading}>
                    {categoryLoading ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4">{currentProduct.id ? "Edit Product" : "Add New Product"}</h2>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={currentProduct.name}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={Number.isNaN(currentProduct.price) ? "" : currentProduct.price}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-sm"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="category_id">Category</label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={currentProduct.category_id || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md text-sm"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Country Availability</label>
                  <div className="border rounded p-2 max-h-32 overflow-y-auto">
                    {countries.length === 0 ? (
                      <p className="text-sm text-gray-500">No countries available</p>
                    ) : (
                      countries.map((country) => (
                        <div key={country.code} className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            id={`country-${country.code}`}
                            value={country.code}
                            checked={(currentProduct.country_availability || []).includes(country.code)}
                            onChange={handleCountryChange}
                            className="mr-2"
                          />
                          <label htmlFor={`country-${country.code}`} className="text-sm">
                            {country.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select countries where this product will be available
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Images</label>
                  {(currentProduct.images || []).map((img, index) => (
                    <div key={index} className="flex flex-col xs:flex-row items-start xs:items-center mb-2 gap-2 xs:gap-0">
                      <Image src={img.url} alt={img.alt} width={50} height={50} className="object-cover rounded" />
                      <input
                        type="text"
                        value={img.alt}
                        onChange={(e) => handleImageAltChange(e, index)}
                        className="w-full p-2 border rounded-md ml-0 xs:ml-2 text-sm mt-2 xs:mt-0"
                        placeholder="Alt text"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="btn-secondary ml-0 xs:ml-2 mt-2 xs:mt-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2a4365] file:text-white hover:file:bg-[#2a4365]/80 mt-2"
                    disabled={(currentProduct?.images?.length || 0) >= 8}
                  />
                  <p className={`text-xs mt-1 ${(currentProduct?.images?.length || 0) >= 8 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                    {(currentProduct?.images?.length || 0)}/8 images 
                    {(currentProduct?.images?.length || 0) >= 8 && ' - Maximum limit reached'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={currentProduct.description || ''}
                    onChange={(e) => {
                      // Only update if we're under the limit
                      if (e.target.value.length <= 500) {
                        handleChange(e);
                      }
                    }}
                    className="w-full p-2 border rounded-md text-sm"
                    rows="3"
                    required
                  />
                  <p className={`text-xs mt-1 ${(currentProduct?.description?.length || 0) >= 500 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                    Characters remaining: {500 - (currentProduct?.description?.length || 0)}
                    {(currentProduct?.description?.length || 0) >= 500 && ' - Maximum limit reached'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2 sm:gap-4">
                <button
                  type="button"
                  className="btn-secondary w-full sm:w-auto"
                  onClick={() => {
                    setIsEditing(false)
                    setCurrentProduct(null)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Product</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Price</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Category</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Created At</th>
                <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const productImage = productImages.find(img => img.product_id === product.id);
                return (
                  <tr key={product.id}>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 relative flex-shrink-0">
                          <Image
                            src={productImage?.url || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover object-center rounded-md"
                          />
                        </div>
                        <div className="ml-2 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 break-all">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {categories.find(cat => cat.id === product.category_id)?.name || 'Uncategorized'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {product.country_availability && product.country_availability.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.country_availability.map(code => {
                              const countryName = countries.find(c => c.code === code)?.name || code;
                              return (
                                <span key={code} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {countryName.substring(0, 2)}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-red-500">No countries</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {new Date(product.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-600 hover:text-gray-900 mr-2 sm:mr-3" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-red-600" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
