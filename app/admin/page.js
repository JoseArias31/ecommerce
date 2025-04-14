"use client"

import { useState } from "react"
import Image from "next/image"
import { Edit, Trash2, Plus } from "lucide-react"
import { products as initialProducts } from "@/lib/products"

export default function AdminPage() {
  const [products, setProducts] = useState(initialProducts)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  const handleEdit = (product) => {
    setCurrentProduct(product)
    setIsEditing(true)
  }

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((product) => product.id !== id))
    }
  }

  const handleAddNew = () => {
    const newProduct = {
      id: Math.max(...products.map((p) => p.id)) + 1,
      name: "",
      description: "",
      price: 0,
      image: "/placeholder.svg?height=100&width=100",
      category: "",
    }
    setCurrentProduct(newProduct)
    setIsEditing(true)
  }

  const handleSave = (e) => {
    e.preventDefault()

    if (products.some((p) => p.id === currentProduct.id)) {
      // Update existing product
      setProducts(products.map((p) => (p.id === currentProduct.id ? currentProduct : p)))
    } else {
      // Add new product
      setProducts([...products, currentProduct])
    }

    setIsEditing(false)
    setCurrentProduct(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setCurrentProduct({
      ...currentProduct,
      [name]: name === "price" ? Number.parseFloat(value) : value,
    })
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
                  value={currentProduct.price}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={currentProduct.category}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
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
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {product.category}
                  </span>
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
