import Link from "next/link"
import Image from "next/image"

export default function ProductCard({ product }) {
  return (
    <div className="group">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-4">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="text-lg font-medium">{product.name}</h3>
        <p className="text-gray-600 mt-1">${product.price}</p>
      </Link>
    </div>
  )
}
