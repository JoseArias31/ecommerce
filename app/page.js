import Link from "next/link"
import { products } from "@/lib/products"

export default function Home() {
 
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="group">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-4">
              <Link href={`/products/${product.id}`}>
              <img
                src={product.image || "/placeholder.svg?height=500&width=500"}
                alt={product.name}
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300 w-full h-full"
              />
              </Link>
            </div>
            <Link href={`/products/${product.id}`} className=" hover:text-blue-600">
            <h3 className="text-lg font-bold">{product.name}</h3>
            </Link>
            <p className="text-gray-700 mt-1 font-medium">${product.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

