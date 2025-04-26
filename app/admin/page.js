"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Edit, Trash2, Plus, FolderPlus } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { uploadImage } from "@/lib/storage/cliente";
import { useRef, useTransition } from "react";
import { convertBlobUrlToFile } from "@/lib/utils";

export default function AdminPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [productImages, setProductImages] = useState([]); // Store images with alt text per product

  const imageInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setCurrentProduct(prev => ({
        ...prev,
        images: [
          ...(prev.images || []),
          ...filesArray.map(file => ({ file, url: URL.createObjectURL(file), alt: "" }))
        ]
      }));
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
      await fetchProductImages(data);
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("id,name")
    console.log('Fetched categories:', data)
    if (error) console.error("Error fetching categories:", error)
    else setCategories(data)
 
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // When editing, fetch images for this product
  const handleEdit = async (product) => {
    setCurrentProduct({
      ...product,
      category_id: product.category_id != null ? product.category_id.toString() : "",
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
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
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
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={currentProduct.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md text-sm"
                  rows="3"
                  required
                />
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
            {products.map((product) => {
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
  )
}
