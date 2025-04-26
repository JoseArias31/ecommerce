"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Edit, Trash2, Plus } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function AdminPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  // Load products from Supabase on mount
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*")
    if (error) console.error("Error fetching products:", error)
    else setProducts(data)
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

  const handleEdit = (product) => {
    setCurrentProduct({
      ...product,
      // Ensure category_id is a string for the select
      category_id: product.category_id != null ? product.category_id.toString() : "",
    })
    setIsEditing(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) console.error("Error deleting product:", error)
      else setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleAddNew = () => {
    const newProduct = {
      name: "",
      description: "",
      price: 0,
      image: "/placeholder.svg?height=100&width=100",
      category_id: categories.length > 0 ? categories[0].id.toString() : "", // Initialize with first category
    }
    setCurrentProduct(newProduct)
    setIsEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault();
  
    // Validate category selection
    if (!currentProduct.category_id) {
      alert("Please select a category for the product.");
      return;
    }
  
    const payload = {
      name: currentProduct.name,
      description: currentProduct.description,
      price: currentProduct.price,
      image: currentProduct.image,
      category_id: currentProduct.category_id, // No conversion needed (Supabase handles it)
    };
  
    console.log("Payload being saved:", payload);
  
    try {
      const { data, error } = currentProduct.id
        ? await supabase
            .from("products")
            .update(payload)
            .eq("id", currentProduct.id)
            .select()
        : await supabase
            .from("products")
            .insert([payload])
            .select();
  
      if (error) throw error;
  
      // Refresh data
      fetchProducts();
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button className="btn-primary flex items-center" onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {isEditing ? (
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">{currentProduct.id ? "Edit Product" : "Add New Product"}</h2>

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={currentProduct.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
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
                  className="w-full p-2 border rounded-md"
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
  className="w-full p-2 border rounded-md"
  required
>
  <option value="">Select a category</option>
  {categories.map((cat) => (
    <option key={cat.id} value={cat.id}>  {/* No .toString() needed */}
      {cat.name}
    </option>
  ))}
</select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  name="image"
                  value={currentProduct.image}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={currentProduct.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsEditing(false)
                  setCurrentProduct(null)
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Product
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Product
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Category
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Created At
    </th>
    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
      Actions
    </th>
  </tr>
</thead>
          <tbody className="bg-white divide-y divide-gray-200">
  {products.map((product) => (
    <tr key={product.id}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 relative flex-shrink-0">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover object-center rounded-md"
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {categories.find(cat => cat.id === product.category_id)?.name || 'Uncategorized'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(product.created_at).toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-gray-600 hover:text-gray-900 mr-3" onClick={() => handleEdit(product)}>
          <Edit className="h-4 w-4" />
        </button>
        <button className="text-gray-600 hover:text-red-600" onClick={() => handleDelete(product.id)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  )
}
